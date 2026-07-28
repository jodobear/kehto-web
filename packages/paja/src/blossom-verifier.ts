/** A stored blob that Paja has retrieved and verified independently of a descriptor. */
export interface VerifiedStoredBlob {
  readonly url: string;
  readonly sha256: string;
  readonly size: number;
  readonly mimeType: string;
  readonly bytes: ArrayBuffer;
}

/** Untrusted descriptor claims that the host must prove before exposing a result URL. */
export interface StoredBlobVerificationRequest {
  readonly url: string;
  readonly sha256: string;
  readonly size: number;
  readonly requestMimeType?: string;
  readonly descriptorMimeType?: string;
  readonly signal?: AbortSignal;
}

/** Host-owned stored-blob verifier. This interface is never sent to a napplet. */
export interface PajaStoredBlobVerifier {
  verify(request: StoredBlobVerificationRequest): Promise<VerifiedStoredBlob>;
}

/** Construction options for the private Paja stored-blob verifier. */
export interface PajaStoredBlobVerifierOptions {
  /** Maximum accepted stored-byte size. Defaults to the policy baseline of 10 MiB. */
  readonly maxBytes?: number;
  /** Test-only fixture adapter. Production construction never enables loopback. */
  readonly allowLoopbackForTests?: boolean;
  /** Injected only for deterministic tests. Production uses the platform fetch. */
  readonly fetch?: typeof fetch;
  /** Injected DNS resolver for deterministic policy tests. */
  readonly resolveHostname?: (hostname: string) => Promise<readonly string[]>;
}

const MAX_REDIRECTS = 5;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Creates Paja's host-private stored-byte verifier.
 *
 * The verifier treats every descriptor field and every retrieved response as an
 * untrusted claim. It validates the URL on every redirect, caps bytes, hashes
 * the complete stored body, and returns only a verified tuple.
 */
export function createPajaStoredBlobVerifier(options: PajaStoredBlobVerifierOptions = {}): PajaStoredBlobVerifier {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const fetchFn = options.fetch ?? fetch;
  const resolveHostname = options.resolveHostname ?? defaultResolveHostname;

  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error('createPajaStoredBlobVerifier: maxBytes must be a positive safe integer');
  }

  return {
    async verify(request): Promise<VerifiedStoredBlob> {
      try {
        const response = await fetchVerifiedUrl(request.url, request.signal, 0);
        if (request.signal?.aborted) throw new Error('aborted');
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (request.signal?.aborted || bytes.byteLength > maxBytes || bytes.byteLength !== request.size) {
          throw new Error('stored byte size does not match the descriptor');
        }
        const sha256 = await sha256Hex(bytes);
        if (sha256 !== request.sha256.toLowerCase()) {
          throw new Error('stored byte digest does not match the descriptor');
        }
        const mimeType = sniffMimeType(bytes);
        if (hasConflictingMimeClaim(request.requestMimeType, mimeType) || hasConflictingMimeClaim(request.descriptorMimeType, mimeType)) {
          throw new Error('stored byte MIME does not match the request or descriptor');
        }
        return {
          url: response.url || request.url,
          sha256,
          size: bytes.byteLength,
          mimeType,
          bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
        };
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`upload-verification-failed: ${detail}`);
      }
    },
  };

  async function fetchVerifiedUrl(value: string, signal: AbortSignal | undefined, redirects: number): Promise<Response> {
    if (redirects > MAX_REDIRECTS) throw new Error('too many redirects');
    const target = await validateStoredUrl(value);
    const response = options.fetch
      ? await fetchFn(target.url, { method: 'GET', redirect: 'manual', signal })
      : await fetchPinned(target.url, target.addresses[0]!, signal);
    if (isRedirect(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('redirect did not supply a location');
      return fetchVerifiedUrl(new URL(location, target.url).href, signal, redirects + 1);
    }
    if (!response.ok) throw new Error(`stored blob returned HTTP ${response.status}`);
    const contentLength = response.headers.get('content-length');
    if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)) {
      throw new Error('stored blob exceeds the configured byte ceiling');
    }
    return response;
  }

  async function validateStoredUrl(value: string): Promise<{ url: URL; addresses: readonly string[] }> {
    const parsed = new URL(value);
    const loopbackFixture = options.allowLoopbackForTests && parsed.protocol === 'http:' && isLoopbackHost(parsed.hostname);
    if (parsed.protocol !== 'https:' && !loopbackFixture) {
      throw new Error('stored blob URL must use public HTTPS');
    }
    const addresses = await resolveHostname(parsed.hostname);
    if (addresses.length === 0 || addresses.some((address) => isPrivateAddress(address))) {
      if (!loopbackFixture) throw new Error('stored blob URL resolves to a blocked address');
    }
    return { url: parsed, addresses };
  }
}

async function fetchPinned(url: URL, address: string, signal: AbortSignal | undefined): Promise<Response> {
  const nodeHttps = await loadNodeModule(url.protocol === 'https:' ? 'node:https' : 'node:http') as {
    request(options: Record<string, unknown>, callback: (response: NodeResponse) => void): NodeRequest;
  };
  return new Promise<Response>((resolve, reject) => {
    const request = nodeHttps.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      lookup: (_hostname: string, _options: unknown, callback: (error: Error | null, ip: string, family: number) => void) => {
        callback(null, address, address.includes(':') ? 6 : 4);
      },
    }, (response) => {
      const chunks: Uint8Array[] = [];
      response.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      response.on('end', () => {
        const body = concatBytes(chunks);
        const headers = new Headers();
        for (const [name, value] of Object.entries(response.headers)) {
          if (typeof value === 'string') headers.set(name, value);
          else if (Array.isArray(value)) headers.set(name, value.join(', '));
        }
        const bodyBuffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
        resolve(new Response(bodyBuffer, { status: response.statusCode ?? 500, headers }));
      });
      response.on('error', reject);
    });
    request.on('error', reject);
    signal?.addEventListener('abort', () => request.destroy(new DOMException('Aborted', 'AbortError')), { once: true });
    request.end();
  });
}

interface NodeRequest {
  on(event: 'error', listener: (error: Error) => void): void;
  destroy(error?: Error): void;
  end(): void;
}

interface NodeResponse {
  readonly statusCode?: number;
  readonly headers: Record<string, string | readonly string[] | undefined>;
  on(event: 'data', listener: (chunk: Uint8Array) => void): void;
  on(event: 'end' | 'error', listener: (() => void) | ((error: Error) => void)): void;
}

function concatBytes(chunks: readonly Uint8Array[]): Uint8Array {
  const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

async function defaultResolveHostname(hostname: string): Promise<readonly string[]> {
  if (isIpAddress(hostname)) return [hostname];
  const nodeDns = await loadNodeModule('node:dns/promises') as {
    lookup(hostname: string, options: { all: true; verbatim: true }): Promise<readonly { address: string }[]>;
  };
  const addresses = await nodeDns.lookup(hostname, { all: true, verbatim: true });
  return addresses.map((entry) => entry.address);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const nodeCrypto = await loadNodeModule('node:crypto') as {
    createHash(algorithm: string): { update(data: Uint8Array): { digest(encoding: 'hex'): string } };
  };
  return nodeCrypto.createHash('sha256').update(bytes).digest('hex');
}

async function loadNodeModule(specifier: string): Promise<unknown> {
  try {
    return await import(specifier);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`host verifier dependency unavailable: ${detail}`);
  }
}

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function sniffMimeType(bytes: Uint8Array): string {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 6 && new TextDecoder().decode(bytes.subarray(0, 6)) === 'GIF87a') return 'image/gif';
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP') return 'image/webp';
  return 'application/octet-stream';
}

function hasConflictingMimeClaim(claim: string | undefined, sniffed: string): boolean {
  return Boolean(claim && claim !== 'application/octet-stream' && claim.toLowerCase() !== sniffed);
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '::1' || hostname.startsWith('127.');
}

function isIpAddress(value: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value) || value.includes(':');
}

function isPrivateAddress(address: string): boolean {
  if (address === '::1' || address.startsWith('fe80:') || address.startsWith('fc') || address.startsWith('fd')) return true;
  const match = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(address);
  if (!match) return false;
  const [first, second] = match.slice(1).map(Number);
  return first === 10 || first === 127 || first === 0 || first === 169 && second === 254 || first === 192 && second === 168 || first === 172 && second >= 16 && second <= 31;
}
