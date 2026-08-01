import { appendPajaMessageLog } from './browser-devtools.js';
import type { PajaBrowserState } from './browser-host.js';
import type { PajaTargetCorsDiagnostic } from './target-cors.js';

/**
 * Require the target dev server to serve the sandboxed frame's assets.
 *
 * The napplet frame is sandboxed without `allow-same-origin`, so its module
 * scripts are fetched with `Origin: null`. Dev servers that only allow
 * localhost origins (Vite's default) block them, and the frame renders blank
 * with no signal from Paja. The probe runs on the Paja server because a browser
 * cannot send a forged `Origin` header.
 *
 * @param state - Current Paja browser state that owns the diagnostics log.
 * @param signal - Attempt-owned cancellation signal.
 * @returns Completion when the target accepts opaque-origin asset requests.
 * @throws When the diagnostic cannot run or the target rejects the opaque origin.
 */
export async function requireTargetCorsAllowed(
  state: PajaBrowserState,
  signal: AbortSignal,
): Promise<void> {
  let diagnostic: PajaTargetCorsDiagnostic;
  try {
    const response = await fetch(new URL('./__kehto/target-cors.json', window.location.href), {
      cache: 'no-store',
      signal,
    });
    if (!response.ok) {
      throw new Error(`Target CORS diagnostic failed with HTTP ${response.status}.`);
    }
    diagnostic = await response.json() as PajaTargetCorsDiagnostic;
  } catch (error) {
    if (signal.aborted) throw signal.reason ?? error;
    throw error;
  }
  if (diagnostic.status === 'allowed') return;
  const message = `${diagnostic.detail} ${diagnostic.hint ?? ''}`.trim();
  appendPajaMessageLog(state, 'paja', {
    type: 'paja.target.cors.error',
    status: diagnostic.status,
    targetUrl: diagnostic.targetUrl,
    allowOrigin: diagnostic.allowOrigin,
    message,
  });
  console.warn(`[paja] ${diagnostic.detail}\n[paja] ${diagnostic.hint ?? ''}`.trimEnd());
  throw new Error(message);
}
