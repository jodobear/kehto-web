import { createServer } from 'node:http';

import { afterEach, describe, expect, it } from 'vitest';

import { createPajaStoredBlobVerifier } from './blossom-verifier.js';

const VECTOR = new Uint8Array([0, 1, 2, 3, 254, 255]);
const SHA256 = '7ea646958715ed687aa9ac2f5d785feb1a93411f4f25fdd6c7fcc6ab07fdf0e3';

interface VerifierTestServer {
  readonly url: string;
  close(): Promise<void>;
}

const servers: VerifierTestServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

async function createVerifierTestServer(bytes: Uint8Array, contentType = 'application/octet-stream'): Promise<VerifierTestServer> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': contentType });
    response.end(bytes as never);
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('test server did not bind a port');
  const fixture: VerifierTestServer = {
    url: `http://127.0.0.1:${address.port}/blob`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
  servers.push(fixture);
  return fixture;
}

describe('createPajaStoredBlobVerifier', () => {
  it('proves BUD-01 bytes with the real vector and a test-only loopback adapter', async () => {
    const server = await createVerifierTestServer(VECTOR);
    const verifier = createPajaStoredBlobVerifier({ allowLoopbackForTests: true });

    await expect(verifier.verify({
      url: server.url,
      sha256: SHA256,
      size: VECTOR.byteLength,
      requestMimeType: 'application/octet-stream',
      descriptorMimeType: 'application/octet-stream',
    })).resolves.toMatchObject({
      url: server.url,
      sha256: SHA256,
      size: VECTOR.byteLength,
      mimeType: 'application/octet-stream',
    });
  });

  it('rejects production HTTP and an altered stored object before it can be granted', async () => {
    const server = await createVerifierTestServer(new Uint8Array([9, 9, 9]));
    const verifier = createPajaStoredBlobVerifier({ allowLoopbackForTests: true });

    await expect(verifier.verify({
      url: 'http://public.example/blob',
      sha256: SHA256,
      size: VECTOR.byteLength,
    })).rejects.toThrow('upload-verification-failed');
    await expect(verifier.verify({
      url: server.url,
      sha256: SHA256,
      size: VECTOR.byteLength,
    })).rejects.toThrow('upload-verification-failed');
  });

  it('rejects a conflicting non-generic MIME claim and a response that exceeds the size ceiling', async () => {
    const server = await createVerifierTestServer(VECTOR, 'image/png');
    const verifier = createPajaStoredBlobVerifier({
      allowLoopbackForTests: true,
      maxBytes: 5,
    });

    await expect(verifier.verify({
      url: server.url,
      sha256: SHA256,
      size: VECTOR.byteLength,
      requestMimeType: 'image/jpeg',
      descriptorMimeType: 'image/png',
    })).rejects.toThrow('upload-verification-failed');
  });

  it('suppresses an aborted stored-byte verification before it can return a tuple', async () => {
    const controller = new AbortController();
    controller.abort();
    const verifier = createPajaStoredBlobVerifier({
      allowLoopbackForTests: true,
      fetch: async () => new Response(VECTOR),
    });

    await expect(verifier.verify({
      url: 'http://127.0.0.1:8080/blob',
      sha256: SHA256,
      size: VECTOR.byteLength,
      signal: controller.signal,
    })).rejects.toThrow('upload-verification-failed');
  });

  it('uses the required real-vector digest', async () => {
    const digest = await crypto.subtle.digest('SHA-256', VECTOR.buffer);
    const actual = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    expect(actual).toBe(SHA256);
  });
});
