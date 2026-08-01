/**
 * Target dev-server CORS diagnostics.
 *
 * Paja loads the napplet target into a `srcdoc` iframe sandboxed without
 * `allow-same-origin`, so the napplet document has an opaque origin and sends
 * `Origin: null` on cross-origin module requests. These public helpers let
 * callers probe one known resource. Paja readiness itself follows actual
 * sandbox-browser loading instead of attempting to crawl module source.
 */

/** Whether the target dev server will serve the sandboxed frame's subresources. */
export type PajaTargetCorsStatus = 'allowed' | 'blocked' | 'unreachable';

/** Result of probing a target dev server for opaque-origin CORS support. */
export interface PajaTargetCorsDiagnostic {
  /** Classification of the probe result. */
  readonly status: PajaTargetCorsStatus;
  /** Target URL that was probed. */
  readonly targetUrl: string;
  /** `access-control-allow-origin` value the target returned, when any. */
  readonly allowOrigin: string | null;
  /** Human-readable explanation of the classification. */
  readonly detail: string;
  /** Actionable remedy, present only when `status` is not `allowed`. */
  readonly hint: string | null;
}

/** Remedy shown whenever the target rejects the sandboxed frame's `null` origin. */
export const PAJA_TARGET_CORS_HINT =
  "Paja sandboxes the napplet frame without allow-same-origin, so its assets are requested with `Origin: null`. "
  + "Allow that origin in the napplet dev server, e.g. Vite `server: { cors: { origin: '*' } }`.";

/**
 * Classify an `access-control-allow-origin` response value for an opaque origin.
 *
 * @param targetUrl - Target URL the header came from.
 * @param allowOrigin - Raw `access-control-allow-origin` header value, or `null` when absent.
 * @returns Diagnostic describing whether the sandboxed frame can load assets.
 * @example
 * ```ts
 * classifyTargetCors('http://127.0.0.1:5173/', '*').status; // 'allowed'
 * classifyTargetCors('http://127.0.0.1:5173/', null).status; // 'blocked'
 * ```
 */
export function classifyTargetCors(
  targetUrl: string,
  allowOrigin: string | null,
): PajaTargetCorsDiagnostic {
  const value = allowOrigin?.trim() ?? null;
  if (value === '*' || value === 'null') {
    return {
      status: 'allowed',
      targetUrl,
      allowOrigin: value,
      detail: `Target allows the sandboxed frame's null origin (access-control-allow-origin: ${value}).`,
      hint: null,
    };
  }
  if (value === null || value === '') {
    return {
      status: 'blocked',
      targetUrl,
      allowOrigin: null,
      detail: 'Target sent no access-control-allow-origin for an Origin: null request.',
      hint: PAJA_TARGET_CORS_HINT,
    };
  }
  return {
    status: 'blocked',
    targetUrl,
    allowOrigin: value,
    detail: `Target only allows origin "${value}", not the sandboxed frame's null origin.`,
    hint: PAJA_TARGET_CORS_HINT,
  };
}

/** Minimal fetch surface the probe depends on. */
export type PajaTargetCorsFetch = (
  input: string,
  init: { method: string; headers: Record<string, string> },
) => Promise<{ headers: { get(name: string): string | null } }>;

const defaultTargetCorsFetch: PajaTargetCorsFetch = (input, init) => fetch(input, init);

/**
 * Probe one target resource for opaque-origin CORS support.
 *
 * Sends `Origin: null` explicitly. This low-level helper is useful when a
 * caller already knows which resource needs testing. Paja host readiness does
 * not use it because browser fetch, redirect, credential, and import semantics
 * must remain browser-authoritative.
 *
 * @param targetUrl - Absolute target resource URL.
 * @param fetchImpl - Fetch implementation; defaults to the global `fetch`.
 * @returns Diagnostic describing whether the sandboxed frame can load the resource.
 * @example
 * ```ts
 * const diagnostic = await probeTargetCors('http://127.0.0.1:5173/entry.js');
 * if (diagnostic.status === 'blocked') console.warn(diagnostic.hint);
 * ```
 */
export async function probeTargetCors(
  targetUrl: string,
  fetchImpl: PajaTargetCorsFetch = defaultTargetCorsFetch,
): Promise<PajaTargetCorsDiagnostic> {
  try {
    const response = await fetchImpl(targetUrl, {
      method: 'GET',
      headers: {
        origin: 'null',
        accept: 'text/javascript, application/javascript, */*;q=0.8',
      },
    });
    return classifyTargetCors(targetUrl, response.headers.get('access-control-allow-origin'));
  } catch (error) {
    return {
      status: 'unreachable',
      targetUrl,
      allowOrigin: null,
      detail: `Target CORS probe failed: ${error instanceof Error ? error.message : String(error)}`,
      hint: 'Confirm the target resource is reachable and served by the napplet dev server.',
    };
  }
}
