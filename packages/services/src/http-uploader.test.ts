/**
 * http-uploader.test.ts — NAP-UPLOAD concrete HTTP-backed uploader.
 *
 * Exercises createHttpUploader against a mock fetch + signEvent: the NIP-96
 * (NIP-98 auth + multipart) happy path, the Blossom (kind 24242 auth + PUT)
 * happy path, rail selection / defaults, unsupported & unconfigured rails, and
 * server-rejection error mapping. signEvent and fetch are injected so no real
 * network or signing key is involved.
 */

import { describe, it, expect, vi } from 'vitest';
import { createHttpUploader } from './http-uploader.js';
import type { UploaderContext } from './upload-service.js';
import type { EventTemplate, NostrEvent } from '@napplet/core';

const SHA = 'a'.repeat(64);
const BINARY_SHA = '7ea646958715ed687aa9ac2f5d785feb1a93411f4f25fdd6c7fcc6ab07fdf0e3';
const OX = 'b'.repeat(64);

function ctx(uploadId = 'up-1'): UploaderContext {
  return { uploadId, windowId: 'win-1', onStatus: vi.fn() };
}

function signer() {
  return vi.fn(async (tmpl: EventTemplate): Promise<NostrEvent> => ({
    ...tmpl,
    id: 'e'.repeat(64),
    pubkey: 'p'.repeat(64),
    sig: 'f'.repeat(128),
  }));
}

const NOW = () => 1_700_000_000;
const DIGEST = vi.fn(async () => SHA);

function nip96Response() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: 'success',
      message: 'ok',
      nip94_event: {
        tags: [
          ['url', 'https://files.test/abc.png'],
          ['ox', OX],
          ['x', SHA],
          ['size', '8'],
          ['m', 'image/png'],
          ['dim', '1280x720'],
        ],
      },
    }),
  } as unknown as Response;
}

function blossomResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      url: 'https://blossom.test/abc.pdf',
      sha256: SHA,
      size: 8,
      type: 'application/pdf',
      uploaded: 1,
    }),
  } as unknown as Response;
}

describe('createHttpUploader', () => {
  describe('nip96 rail', () => {
    it('signs a NIP-98 auth event, POSTs multipart, and maps the NIP-94 result', async () => {
      const signEvent = signer();
      const fetchFn = vi.fn(async () => nip96Response());
      const uploader = createHttpUploader({
        rails: { nip96: { servers: ['https://files.test/upload'] } },
        signEvent,
        fetch: fetchFn as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });

      const result = await uploader.upload(
        { rail: 'nip96', data: new ArrayBuffer(8), filename: 'x.png', mimeType: 'image/png' },
        ctx(),
      );

      // Auth: NIP-98 (kind 27235) with u / method / payload tags.
      expect(signEvent).toHaveBeenCalledTimes(1);
      const authTmpl = (signEvent as ReturnType<typeof vi.fn>).mock.calls[0][0] as EventTemplate;
      expect(authTmpl.kind).toBe(27235);
      const tagMap = Object.fromEntries(authTmpl.tags.map((t) => [t[0], t[1]]));
      expect(tagMap.u).toBe('https://files.test/upload');
      expect(tagMap.method).toBe('POST');
      expect(tagMap.payload).toBe(SHA);

      // Transport: POST to the configured server with a Nostr auth header + FormData.
      expect(fetchFn).toHaveBeenCalledTimes(1);
      const [url, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('https://files.test/upload');
      expect(init.method).toBe('POST');
      expect(String(init.headers.Authorization)).toMatch(/^Nostr /);
      expect(init.body).toBeInstanceOf(FormData);

      // Result mapping from the nip94_event tags.
      expect(result).toMatchObject({
        ok: true,
        uploadId: 'up-1',
        status: 'complete',
        rail: 'nip96',
        url: 'https://files.test/abc.png',
        sha256: SHA,
        originalSha256: OX,
        size: 8,
        mimeType: 'image/png',
        dimensions: { width: 1280, height: 720 },
      });
      expect(result.nip94).toEqual([
        ['url', 'https://files.test/abc.png'],
        ['ox', OX],
        ['x', SHA],
        ['size', '8'],
        ['m', 'image/png'],
        ['dim', '1280x720'],
      ]);
    });

    it('maps an HTTP failure to a failed result (server rejected)', async () => {
      const fetchFn = vi.fn(async () => ({ ok: false, status: 413, json: async () => ({}) }) as unknown as Response);
      const uploader = createHttpUploader({
        rails: { nip96: { servers: ['https://files.test/upload'] } },
        signEvent: signer(),
        fetch: fetchFn as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });
      const result = await uploader.upload({ rail: 'nip96', data: new ArrayBuffer(8) }, ctx());
      expect(result.ok).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toMatch(/413|server/i);
    });

    it('maps a NIP-96 error status body to a failed result', async () => {
      const fetchFn = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: 'error', message: 'quota exceeded' }),
      }) as unknown as Response);
      const uploader = createHttpUploader({
        rails: { nip96: { servers: ['https://files.test/upload'] } },
        signEvent: signer(),
        fetch: fetchFn as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });
      const result = await uploader.upload({ rail: 'nip96', data: new ArrayBuffer(8) }, ctx());
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/quota exceeded/);
    });
  });

  describe('blossom rail', () => {
    it('signs a kind 24242 auth event, PUTs the bytes, and maps the descriptor', async () => {
      const signEvent = signer();
      const fetchFn = vi.fn(async () => blossomResponse());
      const uploader = createHttpUploader({
        rails: { blossom: { servers: ['https://blossom.test'] } },
        signEvent,
        fetch: fetchFn as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });

      const uploadContext = ctx('up-2');
      const result = await uploader.upload(
        { rail: 'blossom', data: new ArrayBuffer(8), filename: 'x.pdf' },
        uploadContext,
      );

      expect(uploadContext.onStatus).toHaveBeenCalledWith({
        ok: true,
        uploadId: 'up-2',
        status: 'uploading',
        rail: 'blossom',
        bytesTotal: 8,
        updatedAt: 1_700_000_000_000,
      });

      const authTmpl = (signEvent as ReturnType<typeof vi.fn>).mock.calls[0][0] as EventTemplate;
      expect(authTmpl.kind).toBe(24242);
      const tags = authTmpl.tags;
      expect(tags).toContainEqual(['t', 'upload']);
      expect(tags).toContainEqual(['x', SHA]);
      expect(tags.some((t) => t[0] === 'expiration')).toBe(true);

      const [url, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toBe('https://blossom.test/upload');
      expect(init.method).toBe('PUT');
      expect(String(init.headers.Authorization)).toMatch(/^Nostr /);
      expect(init.signal).toBeInstanceOf(AbortSignal);
      expect(new Uint8Array(init.body as ArrayBuffer)).toEqual(new Uint8Array(8));

      expect(result).toMatchObject({
        ok: true,
        uploadId: 'up-2',
        status: 'complete',
        rail: 'blossom',
        url: 'https://blossom.test/abc.pdf',
        sha256: SHA,
        size: 8,
        mimeType: 'application/pdf',
      });
      expect(result.nip94).toEqual([
        ['url', 'https://blossom.test/abc.pdf'],
        ['m', 'application/pdf'],
        ['x', SHA],
        ['size', '8'],
      ]);
    });

    it('encodes a complete 300-second BUD-11 event and binary PUT headers', async () => {
      const signed = {
        id: 'e'.repeat(64),
        pubkey: 'p'.repeat(64),
        sig: 'f'.repeat(128),
      };
      const signEvent = vi.fn(async (tmpl: EventTemplate): Promise<NostrEvent> => ({ ...tmpl, ...signed }));
      const fetchFn = vi.fn(async () => ({
        ok: true,
        status: 201,
        json: async () => ({
          url: 'https://blossom.test/blob.bin',
          sha256: BINARY_SHA,
          size: 6,
          type: 'application/octet-stream',
          uploaded: 1,
        }),
      }) as unknown as Response);
      const data = new Uint8Array([0, 1, 2, 3, 254, 255]);
      const uploader = createHttpUploader({
        rails: { blossom: { servers: ['https://BLOSSOM.TEST'] } },
        signEvent,
        fetch: fetchFn as unknown as typeof fetch,
        digestSha256: async () => BINARY_SHA,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? 'application/octet-stream',
        }),
      });

      await uploader.upload({ rail: 'blossom', data: data.buffer, mimeType: 'application/octet-stream' }, ctx('bud-11'));

      const auth = String((fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][1].headers.Authorization);
      const encoded = auth.slice('Nostr '.length);
      expect(auth).toMatch(/^Nostr [A-Za-z0-9_-]+$/);
      expect(encoded).not.toContain('=');
      const padded = encoded.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (encoded.length % 4)) % 4);
      const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)))) as NostrEvent;
      expect(decoded).toEqual({
        kind: 24242,
        created_at: NOW(),
        content: 'Upload file',
        tags: [
          ['t', 'upload'],
          ['x', BINARY_SHA],
          ['server', 'blossom.test'],
          ['expiration', String(NOW() + 300)],
        ],
        ...signed,
      });
      expect(signEvent).toHaveBeenCalledWith({
        kind: 24242,
        created_at: NOW(),
        content: 'Upload file',
        tags: decoded.tags,
      });

      const [, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(init.headers).toMatchObject({
        'X-SHA-256': BINARY_SHA,
        'Content-Length': '6',
        'Content-Type': 'application/octet-stream',
      });
      expect(new Uint8Array(init.body as ArrayBuffer)).toEqual(data);
    });

    it('uses only a host-produced stored-byte proof for its standard NIP-94 result', async () => {
      const verifyBlossomStoredBlob = vi.fn(async () => ({
        url: 'https://cdn.test/verified.bin',
        sha256: SHA,
        size: 8,
        mimeType: 'application/octet-stream',
      }));
      const uploader = createHttpUploader({
        rails: { blossom: { servers: ['https://blossom.test'] } },
        signEvent: signer(),
        fetch: vi.fn(async () => ({
          ok: true,
          status: 200,
          json: async () => ({
            url: 'https://forged.test/descriptor.bin',
            sha256: SHA,
            size: 8,
            type: 'text/plain',
            uploaded: 1,
            nip94: [['url', 'https://forged.test/descriptor.bin'], ['m', 'text/plain']],
          }),
        }) as unknown as Response) as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob,
      });

      const result = await uploader.upload({ rail: 'blossom', data: new ArrayBuffer(8), mimeType: 'application/octet-stream' }, ctx());

      expect(verifyBlossomStoredBlob).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://forged.test/descriptor.bin',
        sha256: SHA,
        size: 8,
        descriptorMimeType: 'text/plain',
      }));
      expect(result).toMatchObject({
        ok: true,
        url: 'https://cdn.test/verified.bin',
        mimeType: 'application/octet-stream',
        sha256: SHA,
        size: 8,
      });
      expect(result.nip94).toEqual([
        ['url', 'https://cdn.test/verified.bin'],
        ['m', 'application/octet-stream'],
        ['x', SHA],
        ['size', '8'],
      ]);
    });

    it.each([
      ['missing hash', { url: 'https://blossom.test/blob', size: 8 }, /sha256/i],
      ['mismatched hash', { url: 'https://blossom.test/blob', sha256: OX, size: 8 }, /mismatched sha256/i],
      ['missing size', { url: 'https://blossom.test/blob', sha256: SHA }, /size/i],
      ['negative size', { url: 'https://blossom.test/blob', sha256: SHA, size: -1 }, /invalid size/i],
      ['fractional size', { url: 'https://blossom.test/blob', sha256: SHA, size: 8.5 }, /invalid size/i],
      ['unsafe size', { url: 'https://blossom.test/blob', sha256: SHA, size: Number.MAX_SAFE_INTEGER + 1 }, /invalid size/i],
      ['mismatched size', { url: 'https://blossom.test/blob', sha256: SHA, size: 7 }, /mismatched size/i],
      ['missing type', { url: 'https://blossom.test/blob', sha256: SHA, size: 8, uploaded: 1 }, /type/i],
      ['missing uploaded timestamp', { url: 'https://blossom.test/blob', sha256: SHA, size: 8, type: 'application/octet-stream' }, /uploaded/i],
      ['negative uploaded timestamp', { url: 'https://blossom.test/blob', sha256: SHA, size: 8, type: 'application/octet-stream', uploaded: -1 }, /uploaded/i],
      ['missing URL', { sha256: SHA, size: 8 }, /url/i],
      ['malformed URL', { url: 42, sha256: SHA, size: 8 }, /url/i],
    ])('rejects a descriptor with %s', async (_case, descriptor, error) => {
      const uploader = createHttpUploader({
        rails: { blossom: { servers: ['https://blossom.test'] } },
        signEvent: signer(),
        fetch: vi.fn(async () => ({
          ok: true,
          status: 200,
          json: async () => descriptor,
        }) as unknown as Response) as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });

      const result = await uploader.upload({ rail: 'blossom', data: new ArrayBuffer(8) }, ctx());

      expect(result).toMatchObject({ ok: false, status: 'failed' });
      expect(result.error).toMatch(error);
    });

    it('maps malformed response JSON and HTTP rejection to failures', async () => {
      const malformed = createHttpUploader({
        rails: { blossom: { servers: ['https://blossom.test'] } },
        signEvent: signer(),
        fetch: vi.fn(async () => ({
          ok: true,
          status: 200,
          json: async () => { throw new SyntaxError('bad JSON'); },
        }) as unknown as Response) as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });
      const rejected = createHttpUploader({
        rails: { blossom: { servers: ['https://blossom.test'] } },
        signEvent: signer(),
        fetch: vi.fn(async () => ({ ok: false, status: 403 }) as Response) as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });

      await expect(malformed.upload({ rail: 'blossom', data: new ArrayBuffer(8) }, ctx('bad-json')))
        .resolves.toMatchObject({ ok: false, status: 'failed', error: 'bad JSON' });
      await expect(rejected.upload({ rail: 'blossom', data: new ArrayBuffer(8) }, ctx('rejected')))
        .resolves.toMatchObject({ ok: false, status: 'failed', error: 'server rejected (HTTP 403)' });
    });

    it('aborts an in-flight request and returns a cancelled result', async () => {
      const fetchFn = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }));
      const uploader = createHttpUploader({
        rails: { blossom: { servers: ['https://blossom.test'] } },
        signEvent: signer(),
        fetch: fetchFn as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });

      const pending = uploader.upload({ rail: 'blossom', data: new ArrayBuffer(8) }, ctx('cancel-me'));
      await vi.waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));
      uploader.cancel?.('cancel-me');

      await expect(pending).resolves.toMatchObject({
        ok: false,
        uploadId: 'cancel-me',
        status: 'cancelled',
        rail: 'blossom',
        error: 'user cancelled',
      });
    });

    it('registers cancellation before hashing can yield to teardown', async () => {
      let finishDigest: ((sha256: string) => void) | undefined;
      const digestSha256 = vi.fn(() => new Promise<string>((resolve) => {
        finishDigest = resolve;
      }));
      const signEvent = signer();
      const fetchFn = vi.fn();
      const uploader = createHttpUploader({
        rails: { blossom: { servers: ['https://blossom.test'] } },
        signEvent,
        fetch: fetchFn as unknown as typeof fetch,
        digestSha256,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });

      const pending = uploader.upload({ rail: 'blossom', data: new ArrayBuffer(8) }, ctx('cancel-hash'));
      await vi.waitFor(() => expect(digestSha256).toHaveBeenCalledTimes(1));
      uploader.cancel?.('cancel-hash');
      finishDigest?.(SHA);

      await expect(pending).resolves.toMatchObject({
        ok: false,
        uploadId: 'cancel-hash',
        status: 'cancelled',
        error: 'user cancelled',
      });
      expect(signEvent).not.toHaveBeenCalled();
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });

  describe('rail selection', () => {
    it('uses the configured default rail when the request omits one', async () => {
      const fetchFn = vi.fn(async () => blossomResponse());
      const uploader = createHttpUploader({
        rails: { blossom: { servers: ['https://blossom.test'] } },
        defaultRail: 'blossom',
        signEvent: signer(),
        fetch: fetchFn as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });
      const result = await uploader.upload({ data: new ArrayBuffer(8) }, ctx());
      expect(result.rail).toBe('blossom');
      expect(result.ok).toBe(true);
    });

    it('fails with "unsupported rail" for a rail it cannot serve', async () => {
      const fetchFn = vi.fn();
      const uploader = createHttpUploader({
        rails: { nip96: { servers: ['https://files.test/upload'] } },
        signEvent: signer(),
        fetch: fetchFn as unknown as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });
      const result = await uploader.upload({ rail: 'torrent', data: new ArrayBuffer(8) }, ctx());
      expect(result.ok).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toMatch(/unsupported rail/);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('fails with "no server configured" when the rail has no servers', async () => {
      const uploader = createHttpUploader({
        rails: { nip96: { servers: [] } },
        signEvent: signer(),
        fetch: (vi.fn() as unknown) as typeof fetch,
        digestSha256: DIGEST,
        now: NOW,
        verifyBlossomStoredBlob: async (request) => ({
          url: request.url,
          sha256: request.sha256,
          size: request.size,
          mimeType: request.descriptorMimeType ?? request.requestMimeType ?? 'application/octet-stream',
        }),
      });
      const result = await uploader.upload({ rail: 'nip96', data: new ArrayBuffer(8) }, ctx());
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/no server configured/);
    });
  });
});
