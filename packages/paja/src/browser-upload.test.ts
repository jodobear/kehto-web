import { describe, expect, it, vi } from 'vitest';
import type { EventTemplate, NostrEvent } from '@napplet/core';
import type { Signer } from '@kehto/runtime';

import {
  createPajaUploadRuntime,
  type PajaReplicaDiagnostic,
  type PajaUploadDiagnostic,
} from './browser-upload.js';
import {
  DEFAULT_BLOSSOM_MAX_BYTES,
  DEFAULT_BLOSSOM_MIME_TYPES,
  normalizePajaSimulation,
  type PajaSimulation,
} from './simulation.js';

const PUBKEY = 'a'.repeat(64);
const NEXT_PUBKEY = 'b'.repeat(64);
const BYTES = new Uint8Array([0, 1, 2, 3, 254, 255]);

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const input = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function signedEvent(template: EventTemplate, pubkey = PUBKEY): NostrEvent {
  return {
    ...template,
    id: 'c'.repeat(64),
    pubkey,
    sig: 'd'.repeat(128),
  };
}

function signer(pubkey = PUBKEY): Signer {
  return {
    getPublicKey: vi.fn(async () => pubkey),
    signEvent: vi.fn(async (template: EventTemplate) => signedEvent(template, pubkey)),
  };
}

function context(uploadId = 'upload-1', windowId = 'window-1') {
  return { uploadId, windowId, onStatus: vi.fn() };
}

function blossomResponse(url: string, sha256: string, size = BYTES.byteLength): Response {
  return {
    ok: true,
    status: 201,
    json: async () => ({ url, sha256, size, type: 'application/octet-stream', uploaded: 1 }),
  } as Response;
}

function failedResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
  } as Response;
}

function configuredSimulation(servers: readonly string[]): PajaSimulation {
  return normalizePajaSimulation({
    upload: {
      mode: 'blossom',
      servers,
      mimeTypes: ['application/octet-stream'],
      maxBytes: DEFAULT_BLOSSOM_MAX_BYTES,
    },
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => { resolve = next; });
  return { promise, resolve };
}

describe('createPajaUploadRuntime configured replica operations', () => {
  it('attempts configured servers in order, retries a transient 5xx once, and returns verified URLs in configured order', async () => {
    const sha256 = await sha256Hex(BYTES);
    const simulation = configuredSimulation(['https://a.example', 'https://b.example']);
    const confirmations = vi.fn(() => true);
    const diagnostics: Array<PajaReplicaDiagnostic | PajaUploadDiagnostic> = [];
    const waitForRetry = vi.fn(async () => undefined);
    const fetchFn = vi.fn(async (url: string) => {
      if (url === 'https://a.example/upload' && fetchFn.mock.calls.filter(([called]) => called === url).length === 1) {
        return failedResponse(503);
      }
      if (url === 'https://a.example/upload') return blossomResponse(`https://cdn-a.example/${sha256}`, sha256);
      return blossomResponse(`https://cdn-b.example/${sha256}`, sha256);
    });
    const runtime = createPajaUploadRuntime({
      getSimulation: () => simulation,
      getSigner: () => signer(),
      getProviderPubkey: () => PUBKEY,
      confirmRequest: confirmations,
      getNappletIdentity: () => ({ dTag: 'demo', aggregateHash: 'aggregate' }),
      verifyStoredBlob: async (request) => ({
        url: request.url,
        sha256: request.sha256,
        size: request.size,
        mimeType: 'application/octet-stream',
        bytes: BYTES.buffer,
      }),
      fetch: fetchFn as unknown as typeof fetch,
      waitForRetry,
      onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    });

    await runtime.refreshIdentity();
    const result = await runtime.uploader.upload({
      rail: 'blossom',
      data: BYTES.buffer,
      filename: 'vector.bin',
      mimeType: 'application/octet-stream',
    }, context());

    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual([
      'https://a.example/upload',
      'https://a.example/upload',
      'https://b.example/upload',
    ]);
    expect(waitForRetry).toHaveBeenCalledWith(250, expect.any(AbortSignal));
    expect(confirmations).toHaveBeenCalledWith({
      action: 'upload',
      windowId: 'window-1',
      napplet: { dTag: 'demo', aggregateHash: 'aggregate' },
      filename: 'vector.bin',
      size: BYTES.byteLength,
      mimeType: 'application/octet-stream',
      servers: ['https://a.example', 'https://b.example'],
      replicaCount: 2,
      worstCaseBytes: BYTES.byteLength * 6,
      warning: 'This upload is public and durable.',
    });
    expect(result).toMatchObject({
      ok: true,
      status: 'complete',
      url: `https://cdn-a.example/${sha256}`,
      fallbackUrls: [`https://cdn-b.example/${sha256}`],
    });
    expect(diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ server: 'https://a.example', attempt: 1, error: 'server rejected (HTTP 503)' }),
      expect.objectContaining({ server: 'https://a.example', attempt: 2, verified: true }),
      expect.objectContaining({ server: 'https://b.example', attempt: 1, verified: true }),
    ]));
  });

  it('continues after malformed descriptor failure without retrying that server', async () => {
    const sha256 = await sha256Hex(BYTES);
    const simulation = configuredSimulation(['https://bad.example', 'https://good.example']);
    const waitForRetry = vi.fn(async () => undefined);
    const fetchFn = vi.fn(async (url: string) => {
      if (url === 'https://bad.example/upload') {
        return {
          ok: true,
          status: 201,
          json: async () => ({ url: 'https://bad.example/file', sha256, size: BYTES.byteLength, uploaded: 1 }),
        } as Response;
      }
      return blossomResponse(`https://good.example/${sha256}`, sha256);
    });
    const runtime = createPajaUploadRuntime({
      getSimulation: () => simulation,
      getSigner: () => signer(),
      getProviderPubkey: () => PUBKEY,
      confirmRequest: () => true,
      getNappletIdentity: () => ({ dTag: 'demo', aggregateHash: 'aggregate' }),
      verifyStoredBlob: async (request) => ({ url: request.url, sha256: request.sha256, size: request.size, mimeType: 'application/octet-stream', bytes: BYTES.buffer }),
      fetch: fetchFn as unknown as typeof fetch,
      waitForRetry,
    });

    await runtime.refreshIdentity();
    const result = await runtime.uploader.upload({ data: BYTES.buffer, mimeType: 'application/octet-stream' }, context());

    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual(['https://bad.example/upload', 'https://good.example/upload']);
    expect(waitForRetry).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, url: `https://good.example/${sha256}` });
  });

  it('reports installed support but current unavailability when no configured server exists, without discovery or egress', async () => {
    const confirmations = vi.fn(() => true);
    const fetchFn = vi.fn();
    const activeSigner = signer();
    const runtime = createPajaUploadRuntime({
      getSimulation: () => normalizePajaSimulation({ upload: { mode: 'blossom' } }),
      getSigner: () => activeSigner,
      getProviderPubkey: () => PUBKEY,
      confirmRequest: confirmations,
      getNappletIdentity: () => ({ dTag: 'demo', aggregateHash: 'aggregate' }),
      fetch: fetchFn as unknown as typeof fetch,
    });

    await runtime.refreshIdentity();
    const result = await runtime.uploader.upload({ data: BYTES.buffer, mimeType: 'image/png' }, context());

    expect(runtime.uploadInfo()).toEqual({
      rails: [{ rail: 'blossom', enabled: false }],
      maxBytes: DEFAULT_BLOSSOM_MAX_BYTES,
      mimeTypes: [...DEFAULT_BLOSSOM_MIME_TYPES],
    });
    expect(runtime.getBackend()).toBeNull();
    expect(result).toMatchObject({ ok: false, status: 'failed', error: 'upload-unavailable' });
    expect(confirmations).not.toHaveBeenCalled();
    expect(activeSigner.signEvent).not.toHaveBeenCalled();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('reuses consent only for an identical window, signer, ordered-server, MIME, and ceiling tuple', async () => {
    const sha256 = await sha256Hex(BYTES);
    let simulation = configuredSimulation(['https://a.example', 'https://b.example']);
    const confirmations = vi.fn(() => true);
    const fetchFn = vi.fn(async (url: string) => blossomResponse(`${url.replace('/upload', '')}/${sha256}`, sha256));
    const runtime = createPajaUploadRuntime({
      getSimulation: () => simulation,
      getSigner: () => signer(),
      getProviderPubkey: () => PUBKEY,
      confirmRequest: confirmations,
      getNappletIdentity: (windowId) => ({ dTag: windowId, aggregateHash: 'aggregate' }),
      verifyStoredBlob: async (request) => ({ url: request.url, sha256: request.sha256, size: request.size, mimeType: 'application/octet-stream', bytes: BYTES.buffer }),
      fetch: fetchFn as unknown as typeof fetch,
    });

    await runtime.refreshIdentity();
    await runtime.uploader.upload({ data: BYTES.buffer, mimeType: 'application/octet-stream' }, context('one'));
    await runtime.uploader.upload({ data: BYTES.buffer, mimeType: 'application/octet-stream' }, context('two'));
    expect(confirmations).toHaveBeenCalledTimes(1);

    simulation = configuredSimulation(['https://b.example', 'https://a.example']);
    await runtime.uploader.upload({ data: BYTES.buffer, mimeType: 'application/octet-stream' }, context('three'));
    simulation = normalizePajaSimulation({ upload: { mode: 'blossom', servers: ['https://b.example', 'https://a.example'], mimeTypes: ['image/png'], maxBytes: DEFAULT_BLOSSOM_MAX_BYTES } });
    await runtime.uploader.upload({ data: BYTES.buffer, mimeType: 'image/png' }, context('four'));
    simulation = normalizePajaSimulation({ upload: { mode: 'blossom', servers: ['https://b.example', 'https://a.example'], mimeTypes: ['image/png'], maxBytes: DEFAULT_BLOSSOM_MAX_BYTES - 1 } });
    await runtime.uploader.upload({ data: BYTES.buffer, mimeType: 'image/png' }, context('five'));
    await runtime.uploader.upload({ data: BYTES.buffer, mimeType: 'image/png' }, context('six', 'window-2'));

    expect(confirmations).toHaveBeenCalledTimes(5);
  });

  it('applies the default 10 MiB image policy at the exact boundary and allows explicit generic-binary host policy', async () => {
    const boundary = new ArrayBuffer(DEFAULT_BLOSSOM_MAX_BYTES);
    const tooLarge = new ArrayBuffer(DEFAULT_BLOSSOM_MAX_BYTES + 1);
    const confirmDefault = vi.fn(() => true);
    const fetchDefault = vi.fn(async () => blossomResponse('https://blob.example/boundary', await sha256Hex(new Uint8Array(boundary)), boundary.byteLength));
    const defaultRuntime = createPajaUploadRuntime({
      getSimulation: () => normalizePajaSimulation({ upload: { mode: 'blossom', servers: ['https://blob.example'] } }),
      getSigner: () => signer(),
      getProviderPubkey: () => PUBKEY,
      confirmRequest: confirmDefault,
      getNappletIdentity: () => ({ dTag: 'demo', aggregateHash: 'aggregate' }),
      verifyStoredBlob: async (request) => ({ url: request.url, sha256: request.sha256, size: request.size, mimeType: 'image/png', bytes: boundary }),
      fetch: fetchDefault as unknown as typeof fetch,
    });
    await defaultRuntime.refreshIdentity();

    await expect(defaultRuntime.uploader.upload({ data: boundary, mimeType: 'image/png' }, context('boundary')))
      .resolves.toMatchObject({ ok: true, status: 'complete' });
    await expect(defaultRuntime.uploader.upload({ data: tooLarge, mimeType: 'image/png' }, context('too-large')))
      .resolves.toMatchObject({ ok: false, status: 'failed', error: 'upload-policy-denied' });
    expect(confirmDefault).toHaveBeenCalledTimes(1);
    expect(fetchDefault).toHaveBeenCalledTimes(1);

    const genericFetch = vi.fn(async () => blossomResponse('https://blob.example/generic', await sha256Hex(BYTES)));
    const genericRuntime = createPajaUploadRuntime({
      getSimulation: () => normalizePajaSimulation({ upload: { mode: 'blossom', servers: ['https://blob.example'], mimeTypes: ['application/octet-stream'] } }),
      getSigner: () => signer(),
      getProviderPubkey: () => PUBKEY,
      confirmRequest: () => true,
      getNappletIdentity: () => ({ dTag: 'demo', aggregateHash: 'aggregate' }),
      verifyStoredBlob: async (request) => ({ url: request.url, sha256: request.sha256, size: request.size, mimeType: 'application/octet-stream', bytes: BYTES.buffer }),
      fetch: genericFetch as unknown as typeof fetch,
    });
    await genericRuntime.refreshIdentity();
    await expect(genericRuntime.uploader.upload({ data: BYTES.buffer, mimeType: 'application/octet-stream' }, context('generic')))
      .resolves.toMatchObject({ ok: true, status: 'complete' });
  });

  it('cancels the whole operation after a verified replica, discards URLs, and reports retained copies only to the host', async () => {
    const sha256 = await sha256Hex(BYTES);
    const bResponse = deferred<Response>();
    const diagnostics: Array<PajaReplicaDiagnostic | PajaUploadDiagnostic> = [];
    const fetchFn = vi.fn((url: string) => {
      if (url === 'https://a.example/upload') return Promise.resolve(blossomResponse(`https://a.example/${sha256}`, sha256));
      return bResponse.promise;
    });
    const runtime = createPajaUploadRuntime({
      getSimulation: () => configuredSimulation(['https://a.example', 'https://b.example']),
      getSigner: () => signer(),
      getProviderPubkey: () => PUBKEY,
      confirmRequest: () => true,
      getNappletIdentity: () => ({ dTag: 'demo', aggregateHash: 'aggregate' }),
      verifyStoredBlob: async (request) => ({ url: request.url, sha256: request.sha256, size: request.size, mimeType: 'application/octet-stream', bytes: BYTES.buffer }),
      fetch: fetchFn as unknown as typeof fetch,
      onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    });
    await runtime.refreshIdentity();

    const operation = runtime.uploader.upload({ data: BYTES.buffer, mimeType: 'application/octet-stream' }, context('cancelled'));
    await vi.waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
    runtime.uploader.onWindowDestroyed?.('window-1');
    bResponse.resolve(blossomResponse(`https://b.example/${sha256}`, sha256));

    const result = await operation;
    expect(result).toMatchObject({
      ok: false,
      status: 'cancelled',
      error: 'upload-teardown-cancelled',
    });
    expect(result).not.toHaveProperty('url');
    expect(result).not.toHaveProperty('fallbackUrls');
    expect(diagnostics).toContainEqual(expect.objectContaining({
      type: 'paja.upload.partial-copy',
      windowId: 'window-1',
      retainedUrls: [`https://a.example/${sha256}`],
    }));
  });

  it('aborts active operations when the signer identity changes and never starts a later replica', async () => {
    const sha256 = await sha256Hex(BYTES);
    const firstResponse = deferred<Response>();
    let activeSigner = signer(PUBKEY);
    let providerPubkey = PUBKEY;
    let notifySignerChange: (() => void) | undefined;
    const fetchFn = vi.fn(() => firstResponse.promise);
    const runtime = createPajaUploadRuntime({
      getSimulation: () => configuredSimulation(['https://a.example', 'https://b.example']),
      getSigner: () => activeSigner,
      getProviderPubkey: () => providerPubkey,
      confirmRequest: () => true,
      getNappletIdentity: () => ({ dTag: 'demo', aggregateHash: 'aggregate' }),
      verifyStoredBlob: async (request) => ({ url: request.url, sha256: request.sha256, size: request.size, mimeType: 'application/octet-stream', bytes: BYTES.buffer }),
      fetch: fetchFn as unknown as typeof fetch,
      subscribeSignerChange: (listener) => {
        notifySignerChange = listener;
        return () => { notifySignerChange = undefined; };
      },
    });
    await runtime.refreshIdentity();

    const operation = runtime.uploader.upload({ data: BYTES.buffer, mimeType: 'application/octet-stream' }, context('identity-change'));
    await vi.waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
    activeSigner = signer(NEXT_PUBKEY);
    providerPubkey = NEXT_PUBKEY;
    notifySignerChange?.();
    firstResponse.resolve(blossomResponse(`https://a.example/${sha256}`, sha256));

    await expect(operation).resolves.toMatchObject({ ok: false, status: 'cancelled', error: 'upload-identity-changed' });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
