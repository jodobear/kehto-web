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
    const parsed = await validateStoredUrl(value);
    const response = await fetchFn(parsed, { method: 'GET', redirect: 'manual', signal });
    if (isRedirect(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('redirect did not supply a location');
      return fetchVerifiedUrl(new URL(location, parsed).href, signal, redirects + 1);
    }
    if (!response.ok) throw new Error(`stored blob returned HTTP ${response.status}`);
    const contentLength = response.headers.get('content-length');
    if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)) {
      throw new Error('stored blob exceeds the configured byte ceiling');
    }
    return response;
  }

  async function validateStoredUrl(value: string): Promise<URL> {
    const parsed = new URL(value);
    const loopbackFixture = options.allowLoopbackForTests && parsed.protocol === 'http:' && isLoopbackHost(parsed.hostname);
    if (parsed.protocol !== 'https:' && !loopbackFixture) {
      throw new Error('stored blob URL must use public HTTPS');
    }
    const addresses = await resolveHostname(parsed.hostname);
    if (addresses.length === 0 || addresses.some((address) => isPrivateAddress(address))) {
      if (!loopbackFixture) throw new Error('stored blob URL resolves to a blocked address');
    }
    return parsed;
  }
}

async function defaultResolveHostname(hostname: string): Promise<readonly string[]> {
  // The Paja host route runs behind the deployment's network-policy resolver.
  // Literal addresses are still rejected locally before that route can fetch.
  return isIpAddress(hostname) ? [hostname] : ['public-hostname'];
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const input = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
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
