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

import { init as initModuleLexer, parse as parseModule } from 'es-module-lexer';

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
        accept: 'text/html, application/xhtml+xml;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    });
    if (documentResponse.ok === false) {
      throw new Error(`Target document request failed with HTTP ${documentResponse.status ?? 'unknown'}.`);
    }
    const targetHtml = await documentResponse.text();
    const documentModules = readDocumentModules(targetHtml, targetUrl);
    await initModuleLexer;
    const moduleQueue = documentModules.external.map((url) => ({ url, parseImports: true }));
    for (const source of documentModules.inline) {
      moduleQueue.push(...readImportedModules(source, targetUrl, documentModules.importMap));
    }
    if (moduleQueue.length === 0) {
      return {
        status: 'allowed',
        targetUrl,
        allowOrigin: null,
        detail: 'Target HTML has no external module scripts that require an Origin: null CORS probe.',
        hint: null,
      };
    }

    const allowOrigins: string[] = [];
    const visitedModules = new Set<string>();
    for (let index = 0; index < moduleQueue.length; index += 1) {
      const moduleResource = moduleQueue[index]!;
      if (visitedModules.has(moduleResource.url)) continue;
      visitedModules.add(moduleResource.url);
      const moduleResponse = await fetchImpl(moduleResource.url, {
        method: 'GET',
        headers: {
          origin: 'null',
          accept: 'text/javascript, application/javascript, */*;q=0.8',
        },
        signal: controller.signal,
      });
      if (moduleResponse.ok === false) {
        throw new Error(
          `Target module ${moduleResource.url} request failed with HTTP ${moduleResponse.status ?? 'unknown'}.`,
        );
      }
      const diagnostic = classifyTargetCors(
        moduleResource.url,
        moduleResponse.headers.get('access-control-allow-origin'),
      );
      if (diagnostic.status !== 'allowed') return diagnostic;
      if (diagnostic.allowOrigin) allowOrigins.push(diagnostic.allowOrigin);
      const source = await moduleResponse.text();
      if (moduleResource.parseImports) {
        moduleQueue.push(...readImportedModules(
          source,
          moduleResource.url,
          documentModules.importMap,
        ));
      }
    }

    const distinctAllowOrigins = [...new Set(allowOrigins)];
    return {
      status: 'allowed',
      targetUrl,
      allowOrigin: distinctAllowOrigins.length === 1 ? distinctAllowOrigins[0]! : null,
      detail: `All ${visitedModules.size} statically resolvable module resource${visitedModules.size === 1 ? '' : 's'} allow the sandboxed frame's null origin.`,
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

interface PajaDocumentModules {
  readonly external: string[];
  readonly inline: string[];
  readonly importMap: PajaImportMap;
}

interface PajaImportMap {
  readonly imports: Readonly<Record<string, string | null>>;
  readonly scopes: Readonly<Record<string, Readonly<Record<string, string | null>>>>;
}

interface PajaModuleResource {
  readonly url: string;
  readonly parseImports: boolean;
}

const EMPTY_IMPORT_MAP: PajaImportMap = Object.freeze({
  imports: Object.freeze({}),
  scopes: Object.freeze({}),
});

function readDocumentModules(html: string, targetUrl: string): PajaDocumentModules {
  const external = new Set<string>();
  const inline: string[] = [];
  let importMap = EMPTY_IMPORT_MAP;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attributes = match[1] ?? '';
    const body = match[2] ?? '';
    const type = readHtmlAttribute(attributes, 'type')?.trim().toLowerCase();
    if (type === 'importmap') {
      importMap = mergeImportMap(importMap, body, targetUrl);
      continue;
    }
    if (type !== 'module') continue;
    const source = readHtmlAttribute(attributes, 'src');
    if (!source) {
      inline.push(body);
      continue;
    }
    const url = resolveHttpUrl(source.replaceAll('&amp;', '&'), targetUrl);
    if (url) external.add(url);
  }
  return { external: [...external], inline, importMap };
}

function readImportedModules(
  source: string,
  importerUrl: string,
  importMap: PajaImportMap,
): PajaModuleResource[] {
  const [imports] = parseModule(source, importerUrl);
  const modules: PajaModuleResource[] = [];
  for (const imported of imports) {
    if (!imported.n) continue;
    const url = resolveModuleSpecifier(imported.n, importerUrl, importMap);
    if (!url) {
      throw new Error(`Target module ${importerUrl} has unresolved import "${imported.n}".`);
    }
    const resourceType = imported.at?.find(([name]) => name === 'type')?.[1];
    modules.push({ url, parseImports: resourceType !== 'json' && resourceType !== 'css' });
  }
  return modules;
}

function mergeImportMap(current: PajaImportMap, source: string, targetUrl: string): PajaImportMap {
  const parsed = JSON.parse(source) as {
    imports?: Record<string, string | null>;
    scopes?: Record<string, Record<string, string | null>>;
  };
  const imports = { ...current.imports };
  for (const [specifier, address] of Object.entries(parsed.imports ?? {})) {
    imports[specifier] = resolveImportMapAddress(address, targetUrl);
  }
  const scopes: Record<string, Record<string, string | null>> = {};
  for (const [scope, mappings] of Object.entries(current.scopes)) scopes[scope] = { ...mappings };
  for (const [scope, mappings] of Object.entries(parsed.scopes ?? {})) {
    const scopeUrl = resolveHttpUrl(scope, targetUrl);
    if (!scopeUrl) continue;
    const resolved = { ...scopes[scopeUrl] };
    for (const [specifier, address] of Object.entries(mappings)) {
      resolved[specifier] = resolveImportMapAddress(address, targetUrl);
    }
    scopes[scopeUrl] = resolved;
  }
  return { imports, scopes };
}

function resolveImportMapAddress(address: string | null, targetUrl: string): string | null {
  return address === null ? null : resolveHttpUrl(address, targetUrl);
}

function resolveModuleSpecifier(
  specifier: string,
  importerUrl: string,
  importMap: PajaImportMap,
): string | null {
  const scope = Object.keys(importMap.scopes)
    .filter((prefix) => importerUrl.startsWith(prefix))
    .sort((left, right) => right.length - left.length)[0];
  const scoped = scope ? resolveImportMapMatch(specifier, importMap.scopes[scope]!) : undefined;
  if (scoped !== undefined) return scoped;
  const mapped = resolveImportMapMatch(specifier, importMap.imports);
  if (mapped !== undefined) return mapped;
  return isUrlLikeModuleSpecifier(specifier) ? resolveHttpUrl(specifier, importerUrl) : null;
}

function isUrlLikeModuleSpecifier(specifier: string): boolean {
  return specifier.startsWith('/')
    || specifier.startsWith('./')
    || specifier.startsWith('../')
    || /^[a-z][a-z\d+.-]*:/i.test(specifier);
}

function resolveImportMapMatch(
  specifier: string,
  mappings: Readonly<Record<string, string | null>>,
): string | null | undefined {
  if (Object.hasOwn(mappings, specifier)) return mappings[specifier];
  const prefix = Object.keys(mappings)
    .filter((key) => key.endsWith('/') && specifier.startsWith(key))
    .sort((left, right) => right.length - left.length)[0];
  if (!prefix) return undefined;
  const address = mappings[prefix];
  return address === null || address === undefined
    ? address
    : `${address}${specifier.slice(prefix.length)}`;
}

function resolveHttpUrl(value: string, baseUrl: string): string | null {
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function readHtmlAttribute(tag: string, name: string): string | undefined {
  const match = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  ).exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}
