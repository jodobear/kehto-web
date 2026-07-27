import { appendPajaMessageLog } from './browser-devtools.js';
import type { PajaBrowserState } from './browser-host.js';
import type { PajaTargetCorsDiagnostic } from './target-cors.js';

/**
 * Report whether the target dev server will serve the sandboxed frame's assets.
 *
 * The napplet frame is sandboxed without `allow-same-origin`, so its module
 * scripts are fetched with `Origin: null`. Dev servers that only allow
 * localhost origins (Vite's default) block them, and the frame renders blank
 * with no signal from Paja. The probe runs on the Paja server because a browser
 * cannot send a forged `Origin` header.
 *
 * @param state - Current Paja browser state that owns the diagnostics log.
 */
export async function reportTargetCorsDiagnostic(state: PajaBrowserState): Promise<void> {
  let diagnostic: PajaTargetCorsDiagnostic;
  try {
    const response = await fetch(new URL('./__kehto/target-cors.json', window.location.href), {
      cache: 'no-store',
    });
    if (!response.ok) return;
    diagnostic = await response.json() as PajaTargetCorsDiagnostic;
  } catch {
    return;
  }
  if (diagnostic.status === 'allowed') return;
  appendPajaMessageLog(state, 'paja', {
    type: 'paja.target.cors.error',
    status: diagnostic.status,
    targetUrl: diagnostic.targetUrl,
    allowOrigin: diagnostic.allowOrigin,
    message: `${diagnostic.detail} ${diagnostic.hint ?? ''}`.trim(),
  });
  console.warn(`[paja] ${diagnostic.detail}\n[paja] ${diagnostic.hint ?? ''}`.trimEnd());
}
