import {
  type PajaConfirmationRequest,
} from './browser-adapter.js';
import { appendPajaMessageLog } from './browser-devtools.js';
import { createPajaSignerController } from './browser-signers.js';
import type { PajaBrowserState } from './browser-host.js';

/**
 * Ask the user to approve a signer or upload operation and record the result.
 *
 * @param state - Current Paja browser state, when the host is installed.
 * @param request - Confirmation request raised by the browser adapter.
 * @returns Whether the user approved the operation.
 */
export function confirmPajaRequest(
  state: PajaBrowserState | null,
  request: PajaConfirmationRequest,
): boolean {
  if (request.action === 'upload') {
    const filename = request.filename ?? '(unnamed blob)';
    const mimeType = request.mimeType ?? 'application/octet-stream';
    const allowed = window.confirm([
      'Paja upload request',
      `napplet: ${request.napplet.dTag} (${request.windowId})`,
      `file: ${filename}`,
      `size: ${request.size} bytes`,
      `type: ${mimeType}`,
      `replicas: ${request.replicaCount}`,
      'ordered targets:',
      ...request.servers.map((server, index) => `${index + 1}. ${server}`),
      `worst-case transferred bytes: ${request.worstCaseBytes}`,
      request.warning,
    ].join('\n'));
    appendPajaMessageLog(state, 'paja', {
      type: `paja.upload.${allowed ? 'confirmed' : 'denied'}`,
      windowId: request.windowId,
      dTag: request.napplet.dTag,
      aggregateHash: request.napplet.aggregateHash,
      filename,
      size: request.size,
      mimeType,
      servers: request.servers,
      replicaCount: request.replicaCount,
      worstCaseBytes: request.worstCaseBytes,
      warning: request.warning,
    });
    return allowed;
  }
  const event = request.event as { kind?: unknown; content?: unknown };
  const kind = typeof event.kind === 'number' ? event.kind : 'unknown';
  const content = typeof event.content === 'string' && event.content.length > 0
    ? `\n\n${event.content.slice(0, 240)}`
    : '';
  const allowed = window.confirm(`Paja ${request.action} request\nkind: ${kind}${content}`);
  appendPajaMessageLog(state, 'paja', {
    type: `paja.${request.action}.${allowed ? 'confirmed' : 'denied'}`,
    kind,
  });
  return allowed;
}

/**
 * Create the signer controller used by the browser host.
 *
 * @param getState - Returns the current Paja browser state.
 * @param refreshState - Refreshes host UI derived from signer state.
 * @returns A signer controller bound to the current host state.
 */
export function createHostSignerController(
  getState: () => PajaBrowserState | null,
  refreshState: (state: PajaBrowserState) => void,
) {
  return createPajaSignerController({
    confirmRequest: (request) => confirmPajaRequest(getState(), request),
    onChange(signer) {
      const state = getState();
      if (!state) return;
      state.signer = signer;
      appendPajaMessageLog(state, 'paja', {
        type: `paja.signer.${signer.method}.${signer.status}`,
        pubkey: signer.pubkey,
        relay: signer.relay,
        error: signer.error,
      });
      refreshState(state);
      if (signer.status === 'connected') state.reload();
    },
  });
}

/**
 * Report whether a NIP-07 signer is injected into the current page.
 *
 * @returns Whether a non-null signer object is available.
 */
export function hasNip07Signer(): boolean {
  const signer = (globalThis as { nostr?: unknown }).nostr;
  return typeof signer === 'object' && signer !== null;
}
