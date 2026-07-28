/**
 * upload-service.test.ts — NAP-UPLOAD envelope-router service.
 *
 * Exercises createUploadService against a mock Uploader: upload.info result,
 * upload.upload result
 * marshalling + uploadId stamping, progress (upload.status.changed) streaming,
 * upload.status tracking + lookup, missing-data rejection, uploader-rejection
 * handling, and window-teardown cleanup (cancel).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUploadService } from './upload-service.js';
import type {
  Uploader,
  UploaderContext,
  UploadRequest,
  UploadResult,
  UploadStatus,
} from './upload-service.js';
import type { NappletMessage } from '@napplet/core';

const WINDOW = 'win-1';

function bytes(n = 8): ArrayBuffer {
  return new ArrayBuffer(n);
}

function baseResult(overrides: Partial<UploadResult> = {}): UploadResult {
  return {
    ok: true,
    uploadId: 'will-be-overwritten',
    status: 'complete',
    rail: 'nip96',
    url: 'https://files.test/abc.png',
    sha256: 'a'.repeat(64),
    size: 8,
    mimeType: 'image/png',
    ...overrides,
  };
}

interface MockUploader extends Uploader {
  lastCtx: UploaderContext | null;
  cancel: (uploadId: string) => void;
}

function mockUploader(overrides: Partial<Uploader> = {}): MockUploader {
  const cancel = vi.fn((_uploadId: string): void => {});
  const u: MockUploader = {
    lastCtx: null,
    cancel,
    upload: vi.fn(async (_req: UploadRequest, ctx: UploaderContext): Promise<UploadResult> => {
      u.lastCtx = ctx;
      return baseResult();
    }),
    ...overrides,
  };
  return u;
}

function collector() {
  const sent: NappletMessage[] = [];
  return { sent, send: (m: NappletMessage) => { sent.push(m); } };
}

const ID = () => 'upload-1';
const NOW = () => 1_000;

describe('createUploadService', () => {
  it('throws when uploader is missing', () => {
    // @ts-expect-error — exercising the runtime guard
    expect(() => createUploadService({})).toThrow(/uploader is required/);
  });

  it('exposes the upload descriptor', () => {
    const svc = createUploadService({ uploader: mockUploader() });
    expect(svc.descriptor.name).toBe('upload');
  });

  describe('upload.info', () => {
    it('returns advisory upload rails and coarse limits', async () => {
      const uploader = mockUploader();
      const svc = createUploadService({
        uploader,
        uploadInfo: {
          rails: [
            { rail: 'nip96', enabled: true, returns: ['https'] },
            { rail: 'blossom', enabled: false, returns: ['https', 'blossom'] },
          ],
          maxBytes: 1024,
          mimeTypes: ['image/png', 'application/pdf'],
        },
      });
      const c = collector();

      svc.handleMessage(WINDOW, { type: 'upload.info', id: 'info-1' } as NappletMessage, c.send);
      await Promise.resolve();
      await Promise.resolve();

      expect(uploader.upload).not.toHaveBeenCalled();
      expect(c.sent).toEqual([
        {
          type: 'upload.info.result',
          id: 'info-1',
          info: {
            rails: [
              { rail: 'nip96', enabled: true, returns: ['https'] },
              { rail: 'blossom', enabled: false, returns: ['https', 'blossom'] },
            ],
            maxBytes: 1024,
            mimeTypes: ['image/png', 'application/pdf'],
          },
        },
      ]);
    });

    it('maps upload info provider failures to upload.info.result error', async () => {
      const svc = createUploadService({
        uploader: mockUploader(),
        uploadInfo: () => {
          throw new Error('policy unavailable');
        },
      });
      const c = collector();

      svc.handleMessage(WINDOW, { type: 'upload.info', id: 'info-fail' } as NappletMessage, c.send);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(c.sent).toEqual([
        {
          type: 'upload.info.result',
          id: 'info-fail',
          error: 'policy unavailable',
        },
      ]);
    });
  });

  describe('upload.upload', () => {
    let uploader: MockUploader;
    let svc: ReturnType<typeof createUploadService>;
    let c: ReturnType<typeof collector>;

    beforeEach(() => {
      uploader = mockUploader();
      svc = createUploadService({ uploader, generateId: ID, now: NOW });
      c = collector();
    });

    it('calls the uploader with the request and a context carrying uploadId + windowId', async () => {
      const request: UploadRequest = { rail: 'nip96', data: bytes(), filename: 'x.png' };
      svc.handleMessage(WINDOW, { type: 'upload.upload', id: 'u1', request } as NappletMessage, c.send);
      await Promise.resolve();
      expect(uploader.upload).toHaveBeenCalledTimes(1);
      const [reqArg, ctxArg] = (uploader.upload as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(reqArg).toBe(request);
      expect(ctxArg.uploadId).toBe('upload-1');
      expect(ctxArg.windowId).toBe(WINDOW);
    });

    it('returns upload.upload.result with the result, stamping the service uploadId', async () => {
      svc.handleMessage(WINDOW, { type: 'upload.upload', id: 'u1', request: { data: bytes() } } as NappletMessage, c.send);
      await Promise.resolve();
      await Promise.resolve();
      expect(c.sent.filter((message) => message.type === 'upload.status.changed')).toHaveLength(2);
      expect(c.sent.find((message) => message.type === 'upload.upload.result')).toMatchObject({
        type: 'upload.upload.result',
        id: 'u1',
        result: { ok: true, uploadId: 'upload-1', status: 'complete', url: 'https://files.test/abc.png' },
      });
    });

    it('rejects a request with no data via a top-level error (no upload created)', async () => {
      svc.handleMessage(WINDOW, { type: 'upload.upload', id: 'u2', request: { filename: 'x' } } as unknown as NappletMessage, c.send);
      await Promise.resolve();
      expect(uploader.upload).not.toHaveBeenCalled();
      expect(c.sent).toHaveLength(1);
      expect(c.sent[0]).toMatchObject({ type: 'upload.upload.result', id: 'u2', error: expect.any(String) });
      expect((c.sent[0] as { result?: unknown }).result).toBeUndefined();
    });

    it('maps an uploader rejection to a terminal failed result', async () => {
      uploader.upload = vi.fn(async () => { throw new Error('server rejected'); });
      svc.handleMessage(WINDOW, { type: 'upload.upload', id: 'u3', request: { data: bytes() } } as NappletMessage, c.send);
      await Promise.resolve();
      await Promise.resolve();
      expect(c.sent.filter((message) => message.type === 'upload.status.changed').map((message) => (message as unknown as { status: UploadStatus }).status.status))
        .toEqual(['uploading', 'failed']);
      expect(c.sent.find((message) => message.type === 'upload.upload.result')).toMatchObject({
        type: 'upload.upload.result',
        id: 'u3',
        result: { ok: false, uploadId: 'upload-1', status: 'failed', error: 'server rejected' },
      });
    });

    it('emits one uploading snapshot, then one terminal snapshot and correlated result', async () => {
      uploader.upload = vi.fn(async (_req, ctx) => {
        ctx.onStatus({ ok: true, uploadId: 'ignored', status: 'pending', rail: 'nip96', updatedAt: 0 });
        ctx.onStatus({ ok: true, uploadId: 'ignored', status: 'uploading', rail: 'nip96', bytesSent: 4, bytesTotal: 8, updatedAt: 0 });
        ctx.onStatus({ ...baseResult({ status: 'complete' }), updatedAt: 0 });
        return baseResult();
      });
      svc.handleMessage(WINDOW, { type: 'upload.upload', id: 'u4', request: { data: bytes() } } as NappletMessage, c.send);
      await vi.waitFor(() => expect(c.sent.some((m) => m.type === 'upload.upload.result')).toBe(true));

      const changed = c.sent.filter((m) => m.type === 'upload.status.changed') as unknown as Array<{ status: UploadStatus }>;
      expect(changed.map((message) => message.status.status)).toEqual(['uploading', 'complete']);
      expect(changed[0]?.status).toMatchObject({ uploadId: 'upload-1', rail: 'unknown', updatedAt: 1000 });
      expect(changed[1]?.status).toMatchObject({ uploadId: 'upload-1', status: 'complete', updatedAt: 1000 });
      expect(c.sent.filter((m) => m.type === 'upload.upload.result')).toHaveLength(1);
    });
  });

  describe('upload.status', () => {
    it('returns the latest tracked status for a known upload', async () => {
      const uploader = mockUploader();
      const svc = createUploadService({ uploader, generateId: ID, now: NOW });
      const c = collector();

      svc.handleMessage(WINDOW, { type: 'upload.upload', id: 'u1', request: { data: bytes() } } as NappletMessage, c.send);
      await Promise.resolve();
      await Promise.resolve();

      svc.handleMessage(WINDOW, { type: 'upload.status', id: 's1', uploadId: 'upload-1' } as NappletMessage, c.send);
      const res = c.sent.find((m) => m.type === 'upload.status.result') as { status?: UploadStatus } | undefined;
      expect(res).toBeDefined();
      expect(res?.status).toMatchObject({ uploadId: 'upload-1', status: 'complete', updatedAt: 1000 });
    });

    it('does not fall back to uploader-global state for an unowned upload', async () => {
      const uploader = mockUploader({
        status: vi.fn(async (): Promise<UploadStatus> => ({ ok: true, uploadId: 'remote-9', status: 'complete', rail: 'blossom', updatedAt: 5 })),
      });
      const svc = createUploadService({ uploader, generateId: ID, now: NOW });
      const c = collector();

      svc.handleMessage(WINDOW, { type: 'upload.status', id: 's2', uploadId: 'remote-9' } as NappletMessage, c.send);
      await Promise.resolve();
      expect(uploader.status).not.toHaveBeenCalled();
      expect(c.sent).toContainEqual({ type: 'upload.status.result', id: 's2', error: 'unknown upload' });
    });

    it('errors when an unknown upload cannot be resolved', async () => {
      const uploader = mockUploader();
      const svc = createUploadService({ uploader, generateId: ID, now: NOW });
      const c = collector();
      svc.handleMessage(WINDOW, { type: 'upload.status', id: 's3', uploadId: 'nope' } as NappletMessage, c.send);
      await Promise.resolve();
      expect(c.sent[0]).toMatchObject({ type: 'upload.status.result', id: 's3', error: expect.any(String) });
    });
  });

  describe('lifecycle', () => {
    it('cancels in-flight uploads and clears tracking on window teardown', async () => {
      const uploader = mockUploader();
      const svc = createUploadService({ uploader, generateId: ID, now: NOW });
      const c = collector();

      svc.handleMessage(WINDOW, { type: 'upload.upload', id: 'u1', request: { data: bytes() } } as NappletMessage, c.send);
      await Promise.resolve();
      await Promise.resolve();

      svc.onWindowDestroyed?.(WINDOW);
      expect(uploader.cancel).toHaveBeenCalledWith('upload-1');

      // After teardown the status is no longer tracked.
      const c2 = collector();
      svc.handleMessage(WINDOW, { type: 'upload.status', id: 's1', uploadId: 'upload-1' } as NappletMessage, c2.send);
      await Promise.resolve();
      expect(c2.sent[0]).toMatchObject({ type: 'upload.status.result', id: 's1', error: expect.any(String) });
    });

    it('suppresses every late status and result after teardown, then notifies the uploader', async () => {
      let resolveUpload: ((result: UploadResult) => void) | undefined;
      const onWindowDestroyed = vi.fn();
      const uploader = mockUploader({
        upload: vi.fn((_request, ctx) => {
          uploader.lastCtx = ctx;
          return new Promise<UploadResult>((resolve) => {
            resolveUpload = resolve;
          });
        }),
        onWindowDestroyed,
      });
      const svc = createUploadService({ uploader, generateId: ID, now: NOW });
      const c = collector();

      svc.handleMessage(WINDOW, { type: 'upload.upload', id: 'late', request: { data: bytes() } } as NappletMessage, c.send);
      await vi.waitFor(() => expect(uploader.lastCtx).not.toBeNull());
      svc.onWindowDestroyed?.(WINDOW);
      const beforeLateCompletion = [...c.sent];
      uploader.lastCtx?.onStatus({ ...baseResult({ status: 'complete' }), updatedAt: NOW() });
      resolveUpload?.(baseResult());
      await Promise.resolve();
      await Promise.resolve();

      expect(c.sent).toEqual(beforeLateCompletion);
      expect(uploader.cancel).toHaveBeenCalledWith('upload-1');
      expect(onWindowDestroyed).toHaveBeenCalledWith(WINDOW);
    });

    it('keeps terminal snapshots scoped to the owning window', async () => {
      const uploader = mockUploader({
        status: vi.fn(async () => ({ ...baseResult(), uploadId: 'upload-2', updatedAt: NOW() })),
      });
      const ids = ['upload-1', 'upload-2'];
      const svc = createUploadService({ uploader, generateId: () => ids.shift()!, now: NOW });
      const one = collector();
      const two = collector();

      svc.handleMessage('window-one', { type: 'upload.upload', id: 'one', request: { data: bytes() } } as NappletMessage, one.send);
      svc.handleMessage('window-two', { type: 'upload.upload', id: 'two', request: { data: bytes() } } as NappletMessage, two.send);
      await vi.waitFor(() => expect(two.sent.some((m) => m.type === 'upload.upload.result')).toBe(true));

      svc.handleMessage('window-one', { type: 'upload.status', id: 'cross-window', uploadId: 'upload-2' } as NappletMessage, one.send);
      expect(one.sent.at(-1)).toMatchObject({ type: 'upload.status.result', id: 'cross-window', error: 'unknown upload' });
      expect(uploader.status).not.toHaveBeenCalled();
      expect(two.sent.filter((m) => m.type === 'upload.status.changed').map((m) => (m as unknown as { status: UploadStatus }).status.status))
        .toEqual(['uploading', 'complete']);
    });

    it('ignores unknown upload.* actions (forward-compatible)', () => {
      const uploader = mockUploader();
      const svc = createUploadService({ uploader, generateId: ID, now: NOW });
      const c = collector();
      svc.handleMessage(WINDOW, { type: 'upload.frobnicate', id: 'x' } as NappletMessage, c.send);
      expect(c.sent).toHaveLength(0);
    });
  });
});
