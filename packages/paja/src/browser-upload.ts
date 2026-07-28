import type { NostrEvent } from '@napplet/core';
import type { Signer } from '@kehto/runtime';
import {
  createHttpUploader,
  type UploadInfo,
  type UploadRequest,
  type UploadResult,
  type Uploader,
  type VerifiedBlossomResult,
} from '@kehto/services';

import type { PajaConfirmationRequest } from './browser-adapter.js';
import type { PajaSimulation } from './simulation.js';

const PUBLIC_UPLOAD_WARNING = 'This upload is public and durable.';
const RETRY_DELAY_MS = 250;

interface NappletIdentity {
  readonly dTag: string;
  readonly aggregateHash: string;
}

/** Paja-private verified tuple retained for the matching resource grant. */
export interface PajaVerifiedStoredBlob extends VerifiedBlossomResult {
  readonly bytes: ArrayBuffer;
}

/** Stable result error codes used within the existing NAP-UPLOAD error field. */
export type PajaUploadErrorCode =
  | 'upload-unavailable'
  | 'upload-policy-denied'
  | 'upload-consent-denied'
  | 'upload-server-failed'
  | 'upload-identity-changed'
  | 'upload-teardown-cancelled';

/** One host-only attempt record for a configured Blossom replica. */
export interface PajaReplicaDiagnostic {
  readonly server: string;
  readonly attempt: number;
  readonly verified: boolean;
  readonly error?: string;
}

/** Host-only warning emitted when cancellation follows a verified remote copy. */
export interface PajaUploadDiagnostic {
  readonly type: 'paja.upload.partial-copy';
  readonly windowId: string;
  readonly retainedUrls: readonly string[];
  readonly reason: Extract<PajaUploadErrorCode, 'upload-identity-changed' | 'upload-teardown-cancelled'>;
}

/** Exact session-consent scope for one Paja upload operation. */
export interface PajaUploadConsentKey {
  readonly windowId: string;
  readonly signerPubkey: string;
  readonly servers: readonly string[];
  readonly mimeType: string;
  readonly maxBytes: number;
}

/** In-flight configured-server operation owned by one requesting Paja window. */
export interface PajaReplicaOperation {
  readonly uploadId: string;
  readonly windowId: string;
  readonly generation: number;
  readonly signerPubkey: string;
  readonly controller: AbortController;
  readonly delegates: Set<Uploader>;
  readonly verifiedResults: UploadResult[];
  readonly diagnostics: PajaReplicaDiagnostic[];
  stopReason?: Extract<PajaUploadErrorCode, 'upload-identity-changed' | 'upload-teardown-cancelled'>;
}

/** Host-owned dependencies for Paja's configured Blossom replica operation. */
export interface PajaUploadRuntimeOptions {
  readonly getSimulation: () => PajaSimulation;
  readonly getSigner: () => Signer | null;
  readonly getProviderPubkey: () => string | null;
  readonly confirmRequest: (request: PajaConfirmationRequest) => boolean;
  readonly getNappletIdentity: (windowId: string) => NappletIdentity;
  readonly fetch?: typeof fetch;
  /** Host-only stored-byte proof plus exact-grant handoff. */
  readonly verifyStoredBlob?: (request: {
    readonly windowId: string;
    readonly identity: NappletIdentity;
    readonly url: string;
    readonly sha256: string;
    readonly size: number;
    readonly requestMimeType?: string;
    readonly descriptorMimeType?: string;
    readonly signal: AbortSignal;
  }) => Promise<PajaVerifiedStoredBlob>;
  /** Host-only replica evidence; never crosses the napplet wire boundary. */
  readonly onDiagnostic?: (diagnostic: PajaReplicaDiagnostic | PajaUploadDiagnostic) => void;
  /** Injected only for deterministic retry tests; production waits 250 ms. */
  readonly waitForRetry?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
  readonly subscribeSignerChange?: (listener: () => void) => () => void;
}

/** One cache-only upload runtime shared by Paja's service and capability hooks. */
export interface PajaUploadRuntime {
  readonly uploader: Uploader;
  readonly uploadInfo: () => UploadInfo;
  readonly getBackend: () => { rails: string[] } | null;
  refreshIdentity(): Promise<void>;
  dispose(): void;
}

interface IdentitySnapshot {
  readonly pubkey: string;
  readonly signer: Signer & Required<Pick<Signer, 'getPublicKey' | 'signEvent'>>;
}

/**
 * Create Paja's shell-owned configured Blossom replica operation.
 *
 * The runtime never uses BUD-03 discovery as an upload target. It applies host
 * policy, takes one tuple-scoped consent decision, then serially proves every
 * configured replica before returning only standard NAP-UPLOAD success fields.
 */
export function createPajaUploadRuntime(options: PajaUploadRuntimeOptions): PajaUploadRuntime {
  let generation = 0;
  let identity: IdentitySnapshot | null = null;
  const activeOperations = new Map<string, PajaReplicaOperation>();
  const sessionConsents = new Map<string, PajaUploadConsentKey>();
  const waitForRetry = options.waitForRetry ?? sleep;

  async function refreshIdentity(): Promise<void> {
    generation += 1;
    for (const operation of activeOperations.values()) {
      stopOperation(operation, 'upload-identity-changed');
    }
    identity = null;
    const simulation = options.getSimulation();
    if (simulation.upload.mode !== 'blossom') return;

    const configuredPubkey = simulation.identity.pubkey.trim();
    const providerPubkey = options.getProviderPubkey()?.trim() ?? '';
    if (configuredPubkey && providerPubkey && configuredPubkey !== providerPubkey) return;

    const signer = options.getSigner();
    if (!hasWritableIdentity(signer)) return;
    let signerPubkey: string;
    try {
      signerPubkey = (await signer.getPublicKey()).trim();
    } catch {
      return;
    }
    if (!isHexPubkey(signerPubkey)) return;
    const candidates = [configuredPubkey, providerPubkey, signerPubkey].filter(Boolean);
    if (candidates.some((candidate) => candidate !== signerPubkey)) return;

    identity = { pubkey: signerPubkey, signer };
  }

  const uploader: Uploader = {
    async upload(request, ctx) {
      const simulation = options.getSimulation();
      if (simulation.upload.mode !== 'blossom') return failure(ctx.uploadId, 'upload-unavailable');
      if (request.rail && request.rail !== 'blossom') return failure(ctx.uploadId, 'upload-unavailable');

      const size = uploadSize(request);
      const mimeType = normalizedMimeType(request);
      const maxBytes = simulation.upload.maxBytes;
      const mimeTypes = simulation.upload.mimeTypes;
      if (
        !Number.isSafeInteger(size) ||
        size < 0 ||
        !Number.isSafeInteger(maxBytes) ||
        !maxBytes ||
        size > maxBytes ||
        !mimeType ||
        !mimeTypes?.includes(mimeType)
      ) {
        return failure(ctx.uploadId, 'upload-policy-denied');
      }

      const servers = [...simulation.upload.servers];
      if (servers.length === 0 || !options.verifyStoredBlob) return failure(ctx.uploadId, 'upload-unavailable');
      const worstCaseBytes = size * servers.length * 3;
      if (!Number.isSafeInteger(worstCaseBytes)) return failure(ctx.uploadId, 'upload-policy-denied');

      const snapshot = identity;
      if (!snapshot) return failure(ctx.uploadId, 'upload-unavailable');
      const nappletIdentity = options.getNappletIdentity(ctx.windowId);
      const consentKey: PajaUploadConsentKey = {
        windowId: ctx.windowId,
        signerPubkey: snapshot.pubkey,
        servers,
        mimeType,
        maxBytes,
      };
      const serializedConsentKey = serializeConsentKey(consentKey);
      if (!sessionConsents.has(serializedConsentKey)) {
        if (!options.confirmRequest({
          action: 'upload',
          windowId: ctx.windowId,
          napplet: nappletIdentity,
          filename: request.filename,
          size,
          mimeType,
          servers,
          replicaCount: servers.length,
          worstCaseBytes,
          warning: PUBLIC_UPLOAD_WARNING,
        })) {
          return cancelled(ctx.uploadId, 'upload-consent-denied');
        }
        sessionConsents.set(serializedConsentKey, consentKey);
      }

      const operation: PajaReplicaOperation = {
        uploadId: ctx.uploadId,
        windowId: ctx.windowId,
        generation,
        signerPubkey: snapshot.pubkey,
        controller: new AbortController(),
        delegates: new Set(),
        verifiedResults: [],
        diagnostics: [],
      };
      activeOperations.set(ctx.uploadId, operation);
      try {
        for (const server of servers) {
          const first = await attemptReplica({ operation, server, attempt: 1, request, ctx, snapshot, nappletIdentity, mimeType });
          if (operation.stopReason) return cancelledOperation(operation);
          if (first.ok) operation.verifiedResults.push(first.result);
          else if (first.retryable) {
            await waitForRetry(RETRY_DELAY_MS, operation.controller.signal);
            if (operation.stopReason || operation.controller.signal.aborted || !isCurrentOperation(operation, snapshot)) return cancelledOperation(operation);
            const retry = await attemptReplica({ operation, server, attempt: 2, request, ctx, snapshot, nappletIdentity, mimeType });
            if (operation.stopReason) return cancelledOperation(operation);
            if (retry.ok) operation.verifiedResults.push(retry.result);
          }
          if (operation.stopReason || operation.controller.signal.aborted || !isCurrentOperation(operation, snapshot)) {
            return cancelledOperation(operation);
          }
        }
        return operation.verifiedResults.length > 0
          ? completeWithVerifiedReplicas(operation.verifiedResults)
          : failure(ctx.uploadId, 'upload-server-failed');
      } finally {
        activeOperations.delete(ctx.uploadId);
      }
    },
    cancel(uploadId) {
      const operation = activeOperations.get(uploadId);
      if (operation) stopOperation(operation, 'upload-teardown-cancelled');
    },
    onWindowDestroyed(windowId) {
      for (const [key, operation] of activeOperations) {
        if (operation.windowId === windowId) {
          stopOperation(operation, 'upload-teardown-cancelled');
          activeOperations.delete(key);
        }
      }
      for (const [key, consent] of sessionConsents) {
        if (consent.windowId === windowId) sessionConsents.delete(key);
      }
    },
  };

  function uploadInfo(): UploadInfo {
    const simulation = options.getSimulation();
    const configured = simulation.upload.mode === 'blossom' ? simulation.upload.servers : [];
    const ready = Boolean(identity && configured.length > 0);
    return {
      rails: [{
        rail: 'blossom',
        enabled: ready,
        ...(ready ? { returns: [...new Set(configured.map((server) => new URL(server).protocol.slice(0, -1)))] } : {}),
      }],
      ...(simulation.upload.mode === 'blossom' && simulation.upload.maxBytes !== undefined ? { maxBytes: simulation.upload.maxBytes } : {}),
      ...(simulation.upload.mode === 'blossom' && simulation.upload.mimeTypes ? { mimeTypes: [...simulation.upload.mimeTypes] } : {}),
    };
  }

  function getBackend(): { rails: string[] } | null {
    return uploadInfo().rails[0]?.enabled ? { rails: ['blossom'] } : null;
  }

  const unsubscribe = options.subscribeSignerChange?.(() => {
    void refreshIdentity();
  });

  return {
    uploader,
    uploadInfo,
    getBackend,
    refreshIdentity,
    dispose: () => {
      unsubscribe?.();
      for (const operation of activeOperations.values()) stopOperation(operation, 'upload-teardown-cancelled');
    },
  };

  async function attemptReplica(args: {
    operation: PajaReplicaOperation;
    server: string;
    attempt: number;
    request: UploadRequest;
    ctx: Parameters<Uploader['upload']>[1];
    snapshot: IdentitySnapshot;
    nappletIdentity: NappletIdentity;
    mimeType: string;
  }): Promise<{ ok: true; result: UploadResult } | { ok: false; retryable: boolean }> {
    const { operation, server, attempt, request, ctx, snapshot, nappletIdentity, mimeType } = args;
    if (operation.stopReason || operation.controller.signal.aborted || !isCurrentOperation(operation, snapshot)) {
      return { ok: false, retryable: false };
    }
    const delegate = createHttpUploader({
      rails: { blossom: { servers: [server] } },
      defaultRail: 'blossom',
      signEvent: async (template) => {
        const event = await snapshot.signer.signEvent(template);
        if (event.pubkey !== snapshot.pubkey) throw new Error('signer identity mismatch');
        return event;
      },
      ...(options.fetch ? { fetch: options.fetch } : {}),
      verifyBlossomStoredBlob: (verification) => options.verifyStoredBlob!({
        windowId: ctx.windowId,
        identity: nappletIdentity,
        ...verification,
      }),
    });
    operation.delegates.add(delegate);
    try {
      const result = await delegate.upload({ ...request, rail: 'blossom', mimeType }, ctx);
      if (operation.stopReason || operation.controller.signal.aborted || !isCurrentOperation(operation, snapshot)) {
        return { ok: false, retryable: false };
      }
      if (result.ok && result.url) {
        recordDiagnostic(operation, { server, attempt, verified: true });
        return { ok: true, result };
      }
      const error = result.error ?? 'upload-server-failed';
      recordDiagnostic(operation, { server, attempt, verified: false, error });
      return { ok: false, retryable: isTransientFailure(error) };
    } finally {
      operation.delegates.delete(delegate);
    }
  }

  function isCurrentOperation(operation: PajaReplicaOperation, snapshot: IdentitySnapshot): boolean {
    return operation.generation === generation && identity?.pubkey === snapshot.pubkey;
  }

  function recordDiagnostic(operation: PajaReplicaOperation, diagnostic: PajaReplicaDiagnostic): void {
    operation.diagnostics.push(diagnostic);
    options.onDiagnostic?.(diagnostic);
  }

  function cancelledOperation(operation: PajaReplicaOperation): UploadResult {
    const reason = operation.stopReason ?? 'upload-teardown-cancelled';
    if (operation.verifiedResults.length > 0) {
      options.onDiagnostic?.({
        type: 'paja.upload.partial-copy',
        windowId: operation.windowId,
        retainedUrls: operation.verifiedResults.flatMap((result) => result.url ? [result.url] : []),
        reason,
      });
    }
    return cancelled(operation.uploadId, reason);
  }
}

function stopOperation(
  operation: PajaReplicaOperation,
  reason: Extract<PajaUploadErrorCode, 'upload-identity-changed' | 'upload-teardown-cancelled'>,
): void {
  if (operation.stopReason) return;
  operation.stopReason = reason;
  operation.controller.abort();
  for (const delegate of operation.delegates) delegate.cancel?.(operation.uploadId);
}

function completeWithVerifiedReplicas(results: readonly UploadResult[]): UploadResult {
  const [primary] = results;
  if (!primary?.url) return failure(primary?.uploadId ?? 'unknown', 'upload-server-failed');
  const fallbackUrls = results.slice(1).flatMap((result) => result.url ? [result.url] : []);
  return { ...primary, ...(fallbackUrls.length > 0 ? { fallbackUrls } : {}) };
}

function serializeConsentKey(key: PajaUploadConsentKey): string {
  return JSON.stringify([key.windowId, key.signerPubkey, key.servers, key.mimeType, key.maxBytes]);
}

function isTransientFailure(error: string): boolean {
  const httpStatus = /^server rejected \(HTTP (\d{3})\)$/.exec(error)?.[1];
  if (httpStatus) return Number(httpStatus) >= 500;
  return !(
    error.startsWith('server returned') ||
    error.startsWith('upload-verification-failed') ||
    error === 'signer identity mismatch' ||
    error === 'unsupported rail' ||
    error === 'no server configured'
  );
}

function hasWritableIdentity(signer: Signer | null): signer is Signer & Required<Pick<Signer, 'getPublicKey' | 'signEvent'>> {
  return typeof signer?.getPublicKey === 'function' && typeof signer.signEvent === 'function';
}

function isHexPubkey(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value);
}

function uploadSize(request: UploadRequest): number {
  return request.data instanceof Blob ? request.data.size : request.data.byteLength;
}

function normalizedMimeType(request: UploadRequest): string | undefined {
  const value = request.mimeType || (request.data instanceof Blob ? request.data.type : undefined);
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function failure(uploadId: string, error: PajaUploadErrorCode): UploadResult {
  return { ok: false, uploadId, status: 'failed', rail: 'blossom', error };
}

function cancelled(uploadId: string, error: Extract<PajaUploadErrorCode, 'upload-consent-denied' | 'upload-identity-changed' | 'upload-teardown-cancelled'>): UploadResult {
  return { ok: false, uploadId, status: 'cancelled', rail: 'blossom', error };
}

function sleep(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, milliseconds);
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}
