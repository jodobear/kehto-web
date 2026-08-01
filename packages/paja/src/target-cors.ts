/**
 * Target dev-server CORS diagnostics.
 *
 * Paja loads the napplet target into a `srcdoc` iframe sandboxed without
 * `allow-same-origin`, so the napplet document has an opaque origin and sends
 * `Origin: null` on every subresource fetch. `<script type="module">` is always
 * fetched in CORS mode, so a dev server that does not allow the `null` origin
 * blocks the napplet's entry module and the iframe renders blank.
 *
 * These helpers probe the target with an explicit `Origin: null` request so
 * Paja can report the cause instead of leaving an empty frame behind.
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

type PajaTargetModuleCorsFetch = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    signal: AbortSignal;
  },
) => Promise<{
  readonly ok?: boolean;
  readonly status?: number;
  readonly headers: { get(name: string): string | null };
  text(): Promise<string>;
}>;

const defaultTargetModuleCorsFetch: PajaTargetModuleCorsFetch = (input, init) => fetch(input, init);

/**
 * Probe a target dev server for opaque-origin CORS support.
 *
 * Sends `Origin: null` explicitly — a browser cannot forge that header, but the
 * Paja server can, which is why the probe runs server-side.
 *
 * @param targetUrl - Absolute target URL served by the napplet dev server.
 * @param fetchImpl - Fetch implementation; defaults to the global `fetch`.
 * @returns Diagnostic describing whether the sandboxed frame can load assets.
 * @example
 * ```ts
 * const diagnostic = await probeTargetCors('http://127.0.0.1:5173/');
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
        accept: 'text/html, application/xhtml+xml;q=0.9, */*;q=0.8',
      },
    });
    return classifyTargetCors(targetUrl, response.headers.get('access-control-allow-origin'));
  } catch (error) {
    return {
      status: 'unreachable',
      targetUrl,
      allowOrigin: null,
      detail: `Target CORS probe failed: ${error instanceof Error ? error.message : String(error)}`,
      hint: 'Confirm the napplet dev server is running and --target-url points at it.',
    };
  }
}

/**
 * Probe the configured document's actual external module scripts for opaque-origin CORS support.
 *
 * The HTML document itself is fetched by Paja's server and injected through
 * `srcdoc`, so its response does not need a CORS header. Only external module
 * resources discovered in that document are classified as browser CORS gates.
 *
 * @param targetUrl - Absolute configured target document URL.
 * @param timeoutMs - Existing host readiness budget for the complete scan.
 * @param fetchImpl - Fetch implementation used by the Paja server.
 * @returns Diagnostic for the first blocked module, or an allowed/unreachable result.
 * @example
 * ```ts
 * const diagnostic = await probeTargetModuleCors('http://127.0.0.1:5173/', 10_000);
 * ```
 */
export async function probeTargetModuleCors(
  targetUrl: string,
  timeoutMs: number,
  fetchImpl: PajaTargetModuleCorsFetch = defaultTargetModuleCorsFetch,
): Promise<PajaTargetCorsDiagnostic> {
  const controller = new AbortController();
  const budgetMs = Math.max(1, timeoutMs);
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error(`Target module CORS probe timed out after ${budgetMs}ms.`));
  }, budgetMs);
  try {
    const documentResponse = await fetchImpl(targetUrl, {
      method: 'GET',
      headers: {
        origin: 'null',
        accept: 'text/html, application/xhtml+xml;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    });
    if (documentResponse.ok === false) {
      throw new Error(`Target document request failed with HTTP ${documentResponse.status ?? 'unknown'}.`);
    }
    const moduleUrls = readExternalModuleUrls(await documentResponse.text(), targetUrl);
    if (moduleUrls.length === 0) {
      return {
        status: 'allowed',
        targetUrl,
        allowOrigin: null,
        detail: 'Target HTML has no external module scripts that require an Origin: null CORS probe.',
        hint: null,
      };
    }

    const allowOrigins: string[] = [];
    for (const moduleUrl of moduleUrls) {
      const moduleResponse = await fetchImpl(moduleUrl, {
        method: 'GET',
        headers: {
          origin: 'null',
          accept: 'text/javascript, application/javascript, */*;q=0.8',
        },
        signal: controller.signal,
      });
      if (moduleResponse.ok === false) {
        throw new Error(
          `Target module ${moduleUrl} request failed with HTTP ${moduleResponse.status ?? 'unknown'}.`,
        );
      }
      const diagnostic = classifyTargetCors(
        moduleUrl,
        moduleResponse.headers.get('access-control-allow-origin'),
      );
      if (diagnostic.status !== 'allowed') return diagnostic;
      if (diagnostic.allowOrigin) allowOrigins.push(diagnostic.allowOrigin);
    }

    const distinctAllowOrigins = [...new Set(allowOrigins)];
    return {
      status: 'allowed',
      targetUrl,
      allowOrigin: distinctAllowOrigins.length === 1 ? distinctAllowOrigins[0]! : null,
      detail: `All ${moduleUrls.length} external module script${moduleUrls.length === 1 ? '' : 's'} allow the sandboxed frame's null origin.`,
      hint: null,
    };
  } catch (error) {
    const detail = timedOut
      ? `Target module CORS probe timed out after ${budgetMs}ms.`
      : `Target module CORS probe failed: ${error instanceof Error ? error.message : String(error)}`;
    return {
      status: 'unreachable',
      targetUrl,
      allowOrigin: null,
      detail,
      hint: 'Confirm the napplet dev server is running and --target-url points at it.',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function readExternalModuleUrls(html: string, targetUrl: string): string[] {
  const urls = new Set<string>();
  for (const tag of html.match(/<script\b[^>]*>/gi) ?? []) {
    if (readHtmlAttribute(tag, 'type')?.trim().toLowerCase() !== 'module') continue;
    const source = readHtmlAttribute(tag, 'src');
    if (!source) continue;
    try {
      const url = new URL(source.replaceAll('&amp;', '&'), targetUrl);
      if (url.protocol === 'http:' || url.protocol === 'https:') urls.add(url.href);
    } catch {
      // The browser will reject malformed URLs; they are not valid probe targets.
    }
  }
  return [...urls];
}

function readHtmlAttribute(tag: string, name: string): string | undefined {
  const match = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  ).exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}
