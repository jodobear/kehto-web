import type { Signer } from '@kehto/runtime';
import {
  createHttpUploader,
  type UploadInfo,
  type UploadRequest,
  type UploadResult,
  type Uploader,
  type UploaderContext,
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

interface RuntimeState {
  generation: number;
  identity: IdentitySnapshot | null;
  readonly activeOperations: Map<string, PajaReplicaOperation>;
  readonly sessionConsents: Map<string, PajaUploadConsentKey>;
}

interface PreparedUpload {
  readonly size: number;
  readonly mimeType: string;
  readonly maxBytes: number;
  readonly servers: readonly string[];
  readonly worstCaseBytes: number;
}

/**
 * Create Paja's shell-owned configured Blossom replica operation.
 *
 * The runtime never uses BUD-03 discovery as an upload target. It applies host
 * policy, takes one tuple-scoped consent decision, then serially proves every
 * configured replica before returning only standard NAP-UPLOAD success fields.
 */
export function createPajaUploadRuntime(options: PajaUploadRuntimeOptions): PajaUploadRuntime {
  const state: RuntimeState = {
    generation: 0,
    identity: null,
    activeOperations: new Map(),
    sessionConsents: new Map(),
  };
  const uploader = createConfiguredReplicaUploader(options, state, options.waitForRetry ?? sleep);
  const refreshIdentity = () => refreshPajaUploadIdentity(options, state);
  const unsubscribe = options.subscribeSignerChange?.(() => { void refreshIdentity(); });

  return {
    uploader,
    uploadInfo: () => getUploadInfo(options.getSimulation(), state.identity),
    getBackend: () => getUploadInfo(options.getSimulation(), state.identity).rails[0]?.enabled
      ? { rails: ['blossom'] }
      : null,
    refreshIdentity,
    dispose: () => {
      unsubscribe?.();
      for (const operation of state.activeOperations.values()) stopOperation(operation, 'upload-teardown-cancelled');
    },
  };
}

function createConfiguredReplicaUploader(
  options: PajaUploadRuntimeOptions,
  state: RuntimeState,
  waitForRetry: (milliseconds: number, signal: AbortSignal) => Promise<void>,
): Uploader {
  return {
    async upload(request, ctx) {
      const simulation = options.getSimulation();
      const prepared = prepareUpload(simulation, request, options.verifyStoredBlob);
      if ('error' in prepared) return failure(ctx.uploadId, prepared.error);
      const snapshot = state.identity;
      if (!snapshot) return failure(ctx.uploadId, 'upload-unavailable');
      const nappletIdentity = options.getNappletIdentity(ctx.windowId);
      if (!requestConsent(options, state, ctx, request, snapshot, nappletIdentity, prepared)) {
        return cancelled(ctx.uploadId, 'upload-consent-denied');
      }
      const operation = createOperation(ctx, state, snapshot);
      state.activeOperations.set(ctx.uploadId, operation);
      try {
        return await executeReplicas({
          options,
          state,
          operation,
          request,
          ctx,
          snapshot,
          nappletIdentity,
          prepared,
          waitForRetry,
        });
      } finally {
        state.activeOperations.delete(ctx.uploadId);
      }
    },
    cancel(uploadId) {
      const operation = state.activeOperations.get(uploadId);
      if (operation) stopOperation(operation, 'upload-teardown-cancelled');
    },
    onWindowDestroyed(windowId) {
      for (const [key, operation] of state.activeOperations) {
        if (operation.windowId === windowId) {
          stopOperation(operation, 'upload-teardown-cancelled');
          state.activeOperations.delete(key);
        }
      }
      for (const [key, consent] of state.sessionConsents) {
        if (consent.windowId === windowId) state.sessionConsents.delete(key);
      }
    },
  };
}

async function refreshPajaUploadIdentity(options: PajaUploadRuntimeOptions, state: RuntimeState): Promise<void> {
  state.generation += 1;
  for (const operation of state.activeOperations.values()) stopOperation(operation, 'upload-identity-changed');
  state.identity = null;
  const simulation = options.getSimulation();
  if (simulation.upload.mode !== 'blossom') return;

  const configuredPubkey = simulation.identity.pubkey.trim();
  const providerPubkey = options.getProviderPubkey()?.trim() ?? '';
  if (configuredPubkey && providerPubkey && configuredPubkey !== providerPubkey) return;
  const signer = options.getSigner();
  if (!hasWritableIdentity(signer)) return;
  try {
    const signerPubkey = (await signer.getPublicKey()).trim();
    const candidates = [configuredPubkey, providerPubkey, signerPubkey].filter(Boolean);
    if (isHexPubkey(signerPubkey) && !candidates.some((candidate) => candidate !== signerPubkey)) {
      state.identity = { pubkey: signerPubkey, signer };
    }
  } catch {
    // A failed signer refresh leaves the rail installed but currently unavailable.
  }
}

function prepareUpload(
  simulation: PajaSimulation,
  request: UploadRequest,
  verifier: PajaUploadRuntimeOptions['verifyStoredBlob'],
): PreparedUpload | { readonly error: Extract<PajaUploadErrorCode, 'upload-unavailable' | 'upload-policy-denied'> } {
  if (simulation.upload.mode !== 'blossom' || (request.rail && request.rail !== 'blossom') || !verifier) {
    return { error: 'upload-unavailable' };
  }
  const size = uploadSize(request);
  const mimeType = normalizedMimeType(request);
  const maxBytes = simulation.upload.maxBytes;
  const servers = [...simulation.upload.servers];
  if (
    !Number.isSafeInteger(size) || size < 0 || !Number.isSafeInteger(maxBytes) || !maxBytes ||
    size > maxBytes || !mimeType || !simulation.upload.mimeTypes?.includes(mimeType)
  ) {
    return { error: 'upload-policy-denied' };
  }
  const worstCaseBytes = size * servers.length * 3;
  if (servers.length === 0 || !Number.isSafeInteger(worstCaseBytes)) {
    return servers.length === 0 ? { error: 'upload-unavailable' } : { error: 'upload-policy-denied' };
  }
  return { size, mimeType, maxBytes, servers, worstCaseBytes };
}

function requestConsent(
  options: PajaUploadRuntimeOptions,
  state: RuntimeState,
  ctx: UploaderContext,
  request: UploadRequest,
  snapshot: IdentitySnapshot,
  napplet: NappletIdentity,
  prepared: PreparedUpload,
): boolean {
  const consent: PajaUploadConsentKey = {
    windowId: ctx.windowId,
    signerPubkey: snapshot.pubkey,
    servers: prepared.servers,
    mimeType: prepared.mimeType,
    maxBytes: prepared.maxBytes,
  };
  const key = serializeConsentKey(consent);
  if (state.sessionConsents.has(key)) return true;
  const accepted = options.confirmRequest({
    action: 'upload',
    windowId: ctx.windowId,
    napplet,
    filename: request.filename,
    size: prepared.size,
    mimeType: prepared.mimeType,
    servers: prepared.servers,
    replicaCount: prepared.servers.length,
    worstCaseBytes: prepared.worstCaseBytes,
    warning: PUBLIC_UPLOAD_WARNING,
  });
  if (accepted) state.sessionConsents.set(key, consent);
  return accepted;
}

function createOperation(ctx: UploaderContext, state: RuntimeState, snapshot: IdentitySnapshot): PajaReplicaOperation {
  return {
    uploadId: ctx.uploadId,
    windowId: ctx.windowId,
    generation: state.generation,
    signerPubkey: snapshot.pubkey,
    controller: new AbortController(),
    delegates: new Set(),
    verifiedResults: [],
    diagnostics: [],
  };
}

async function executeReplicas(args: {
  readonly options: PajaUploadRuntimeOptions;
  readonly state: RuntimeState;
  readonly operation: PajaReplicaOperation;
  readonly request: UploadRequest;
  readonly ctx: UploaderContext;
  readonly snapshot: IdentitySnapshot;
  readonly nappletIdentity: NappletIdentity;
  readonly prepared: PreparedUpload;
  readonly waitForRetry: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}): Promise<UploadResult> {
  const { operation, prepared } = args;
  for (const server of prepared.servers) {
    const first = await attemptReplica({ ...args, server, attempt: 1 });
    if (operation.stopReason) return cancelledOperation(args.options, operation);
    if (first.ok) operation.verifiedResults.push(first.result);
    else if (first.retryable) {
      await args.waitForRetry(RETRY_DELAY_MS, operation.controller.signal);
      if (!isOperationCurrent(args.state, operation, args.snapshot)) return cancelledOperation(args.options, operation);
      const retry = await attemptReplica({ ...args, server, attempt: 2 });
      if (operation.stopReason) return cancelledOperation(args.options, operation);
      if (retry.ok) operation.verifiedResults.push(retry.result);
    }
    if (!isOperationCurrent(args.state, operation, args.snapshot)) return cancelledOperation(args.options, operation);
  }
  return operation.verifiedResults.length > 0
    ? completeWithVerifiedReplicas(operation.verifiedResults)
    : failure(operation.uploadId, 'upload-server-failed');
}

async function attemptReplica(args: {
  readonly options: PajaUploadRuntimeOptions;
  readonly state: RuntimeState;
  readonly operation: PajaReplicaOperation;
  readonly request: UploadRequest;
  readonly ctx: UploaderContext;
  readonly snapshot: IdentitySnapshot;
  readonly nappletIdentity: NappletIdentity;
  readonly prepared: PreparedUpload;
  readonly server: string;
  readonly attempt: number;
}): Promise<{ ok: true; result: UploadResult } | { ok: false; retryable: boolean }> {
  const { options, operation, request, ctx, snapshot, nappletIdentity, prepared, server, attempt } = args;
  if (!isOperationCurrent(args.state, operation, snapshot)) return { ok: false, retryable: false };
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
    const result = await delegate.upload({ ...request, rail: 'blossom', mimeType: prepared.mimeType }, ctx);
    if (!isOperationCurrent(args.state, operation, snapshot)) return { ok: false, retryable: false };
    if (result.ok && result.url) {
      recordDiagnostic(options, operation, { server, attempt, verified: true });
      return { ok: true, result };
    }
    const error = result.error ?? 'upload-server-failed';
    recordDiagnostic(options, operation, { server, attempt, verified: false, error });
    return { ok: false, retryable: isTransientFailure(error) };
  } finally {
    operation.delegates.delete(delegate);
  }
}

function getUploadInfo(simulation: PajaSimulation, identity: IdentitySnapshot | null): UploadInfo {
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

function stopOperation(
  operation: PajaReplicaOperation,
  reason: Extract<PajaUploadErrorCode, 'upload-identity-changed' | 'upload-teardown-cancelled'>,
): void {
  if (operation.stopReason) return;
  operation.stopReason = reason;
  operation.controller.abort();
  for (const delegate of operation.delegates) delegate.cancel?.(operation.uploadId);
}

function isOperationCurrent(state: RuntimeState, operation: PajaReplicaOperation, snapshot: IdentitySnapshot): boolean {
  return !operation.stopReason && !operation.controller.signal.aborted && operation.generation === state.generation && state.identity?.pubkey === snapshot.pubkey;
}

function recordDiagnostic(options: PajaUploadRuntimeOptions, operation: PajaReplicaOperation, diagnostic: PajaReplicaDiagnostic): void {
  operation.diagnostics.push(diagnostic);
  options.onDiagnostic?.(diagnostic);
}

function cancelledOperation(options: PajaUploadRuntimeOptions, operation: PajaReplicaOperation): UploadResult {
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
