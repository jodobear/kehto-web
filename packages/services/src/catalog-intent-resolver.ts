/**
 * catalog-intent-resolver.ts — NAP-INTENT concrete {@link IntentResolver}.
 *
 * A reference resolver backed by installed, verified NIP-5A manifest contracts
 * plus host-supplied user policy. Contract compatibility is exact complete
 * convention equality. Catalog order, payload contents, quick action indexes,
 * and event-kind metadata never select a handler.
 *
 * Selection policy:
 *   1. Filter installed candidates by exact manifest contract.
 *   2. Require positive host authorization for an explicit handler dTag.
 *   3. Otherwise use an explicit chooser, a compatible user default, the sole
 *      compatible candidate, or an injected chooser.
 *   4. Reject ambiguity when no chooser policy exists.
 *
 * The catalog, defaults, chooser, authorization hook, and target controller are
 * injected, so this resolver has no shell, manifest, or DOM dependency.
 *
 * @packageDocumentation
 */

import type {
  IntentAvailability,
  IntentBehavior,
  IntentCandidate,
  IntentContract,
  IntentRequest,
  IntentResult,
} from './intent-types.js';
import type { IntentResolver, IntentResolverContext } from './intent-service.js';

/** The exact manifest-derived conventions a napplet fulfills for one archetype. */
export interface IntentArchetypeSupport {
  /** Verbs derived from this napplet's accepted conventions. */
  actions: string[];
  /** Stable queryless convention identities derived from {@link contracts}. */
  conventions: string[];
  /** Authoritative ordered contracts parsed from the installed manifest. */
  contracts: IntentContract[];
}

/**
 * One installed napplet's intent surface, derived from its signed NIP-5A
 * manifest. Keyed by archetype slug so a single napplet can fulfill several
 * roles.
 */
export interface IntentCatalogEntry {
  /** The napplet's dTag. */
  dTag: string;
  /** Human-readable title from the manifest. */
  title?: string;
  /** Archetype slug to exact manifest-derived support. */
  archetypes: Record<string, IntentArchetypeSupport>;
}

/**
 * Transitional target parameters used until retained-delivery orchestration is
 * introduced by the next execution task.
 */
export interface IntentOpenParams {
  /** dTag of the resolved handler napplet. */
  dTag: string;
  /** Runtime-attested source napplet dTag. */
  sender: string;
  /** The normalized archetype being dispatched. */
  archetype: string;
  /** The normalized action being dispatched. */
  action: string;
  /** The exact compatible convention. */
  convention: string;
  /** The opaque payload to deliver. */
  payload?: unknown;
  /** Non-authoritative target lifecycle hints. */
  behavior?: IntentBehavior;
}

/** Transitional target controller replaced by retained delivery in the next task. */
export interface IntentWindowController {
  /**
   * Prepare or focus the selected target.
   *
   * @param params - Exact selected target and normalized intent values.
   * @returns An implementation-private target marker.
   */
  open(params: IntentOpenParams): { windowId: string } | Promise<{ windowId: string }>;
}

/** Options for {@link createCatalogIntentResolver}. */
export interface CatalogIntentResolverOptions {
  /** Return the installed-napplet catalog sourced from signed manifests. */
  loadCatalog(): IntentCatalogEntry[] | Promise<IntentCatalogEntry[]>;
  /** Transitional target controller; retained delivery replaces it next. */
  windows: IntentWindowController;
  /**
   * Return the user's default handler dTag for an archetype.
   *
   * @param archetype - Normalized archetype slug.
   * @returns The user-selected default dTag, or `undefined`.
   */
  getDefaultHandler?(archetype: string): string | undefined;
  /**
   * Ask user policy to select one exact-compatible candidate.
   *
   * @param archetype - Normalized archetype slug.
   * @param candidates - Only candidates with an exact matching contract.
   * @param sender - Runtime-attested source napplet dTag.
   * @returns A candidate dTag, or `undefined` when the user cancels.
   */
  chooseHandler?(
    archetype: string,
    candidates: IntentCandidate[],
    sender: string,
  ): string | undefined | Promise<string | undefined>;
  /**
   * Authorize a caller's explicit handler dTag preference.
   *
   * @param sender - Runtime-attested source napplet dTag.
   * @param handler - Explicit requested handler dTag.
   * @param request - Normalized intent request.
   * @param candidate - Installed exact-compatible candidate.
   * @returns `true` only when explicit targeting is user-authorized.
   */
  authorizeExplicitHandler?(
    sender: string,
    handler: string,
    request: IntentRequest,
    candidate: IntentCandidate,
  ): boolean | Promise<boolean>;
}

/**
 * A {@link IntentResolver} backed by a catalog, with a host hook to announce
 * catalog/default changes.
 */
export interface CatalogIntentResolver extends IntentResolver {
  /**
   * Announce that the catalog or default handler for `archetype` changed.
   *
   * @param archetype - Changed archetype slug.
   * @returns Nothing.
   */
  notifyChanged(archetype: string): void;
}

/** Build the candidate list for an archetype, marking the user's default. */
function candidatesFor(
  catalog: IntentCatalogEntry[],
  archetype: string,
  defaultHandler: string | undefined,
): IntentCandidate[] {
  const candidates: IntentCandidate[] = [];
  for (const entry of catalog) {
    const support = entry.archetypes[archetype];
    if (!support) continue;
    candidates.push({
      dTag: entry.dTag,
      ...(entry.title === undefined ? {} : { title: entry.title }),
      actions: [...support.actions],
      conventions: [...support.conventions],
      contracts: support.contracts.map((contract) => ({
        convention: contract.convention,
        ...(contract.eventKinds === undefined ? {} : { eventKinds: [...contract.eventKinds] }),
      })),
      ...(entry.dTag === defaultHandler ? { isDefault: true } : {}),
    });
  }
  return candidates;
}

function reject(error: string): IntentResult {
  return { ok: false, error };
}

type HandlerSelection =
  | { candidate: IntentCandidate }
  | { error: 'invoke rejected' | 'user cancelled' };

/**
 * Create a catalog-backed NAP-INTENT resolver.
 *
 * @param options - Catalog loader and target controller plus optional user
 *   default, chooser, and explicit-handler authorization hooks.
 * @returns A catalog-backed resolver.
 * @throws If required catalog or target-controller options are missing.
 *
 * @example
 * ```ts
 * const resolver = createCatalogIntentResolver({
 *   loadCatalog: () => installedNapplets,
 *   windows: { open: (params) => prepareTarget(params) },
 *   getDefaultHandler: (archetype) => userDefaults[archetype],
 * });
 * ```
 */
export function createCatalogIntentResolver(options: CatalogIntentResolverOptions): CatalogIntentResolver {
  if (!options || typeof options.loadCatalog !== 'function') {
    throw new Error('createCatalogIntentResolver: options.loadCatalog is required');
  }
  if (!options.windows || typeof options.windows.open !== 'function') {
    throw new Error('createCatalogIntentResolver: options.windows is required');
  }
  const {
    loadCatalog,
    windows,
    getDefaultHandler,
    chooseHandler,
    authorizeExplicitHandler,
  } = options;
  const listeners = new Set<(availability: IntentAvailability) => void>();

  async function availabilityFor(archetype: string): Promise<IntentAvailability> {
    const catalog = await loadCatalog();
    const defaultHandler = getDefaultHandler?.(archetype);
    const candidates = candidatesFor(catalog, archetype, defaultHandler);
    return {
      archetype,
      available: candidates.length > 0,
      candidates,
      hasDefault: defaultHandler !== undefined
        && candidates.some((candidate) => candidate.dTag === defaultHandler),
    };
  }

  async function chooseCompatible(
    request: IntentRequest,
    candidates: IntentCandidate[],
    sender: string,
  ): Promise<HandlerSelection> {
    if (!chooseHandler) {
      return request.handler === 'choose'
        ? { error: 'user cancelled' }
        : { error: 'invoke rejected' };
    }
    const picked = await chooseHandler(request.archetype, candidates, sender);
    if (picked === undefined) return { error: 'user cancelled' };
    const candidate = candidates.find((item) => item.dTag === picked);
    return candidate ? { candidate } : { error: 'invoke rejected' };
  }

  async function pickHandler(
    request: IntentRequest,
    compatible: IntentCandidate[],
    sender: string,
  ): Promise<HandlerSelection> {
    const preference = request.handler;
    if (typeof preference === 'string' && preference !== 'default' && preference !== 'choose') {
      const candidate = compatible.find((item) => item.dTag === preference);
      if (!candidate || !authorizeExplicitHandler) return { error: 'invoke rejected' };
      let authorized = false;
      try {
        authorized = await authorizeExplicitHandler(sender, preference, request, candidate);
      } catch {
        return { error: 'invoke rejected' };
      }
      return authorized ? { candidate } : { error: 'invoke rejected' };
    }

    if (preference === 'choose') {
      return chooseCompatible(request, compatible, sender);
    }

    const defaultCandidate = compatible.find((candidate) => candidate.isDefault === true);
    if (preference === 'default') {
      return defaultCandidate ? { candidate: defaultCandidate } : { error: 'invoke rejected' };
    }
    if (defaultCandidate) return { candidate: defaultCandidate };
    if (compatible.length === 1) return { candidate: compatible[0] };
    return chooseCompatible(request, compatible, sender);
  }

  async function invoke(request: IntentRequest, context: IntentResolverContext): Promise<IntentResult> {
    const catalog = await loadCatalog();
    const defaultHandler = getDefaultHandler?.(request.archetype);
    const candidates = candidatesFor(catalog, request.archetype, defaultHandler);
    if (candidates.length === 0) return reject('no handler');

    const compatible = candidates.filter((candidate) =>
      candidate.contracts.some((contract) => contract.convention === request.convention));
    if (compatible.length === 0) return reject('unsupported convention');

    const sender = context.sender;
    if (typeof sender !== 'string' || sender.length === 0) return reject('invoke rejected');
    const selected = await pickHandler(request, compatible, sender);
    if ('error' in selected) return reject(selected.error);

    try {
      await windows.open({
        dTag: selected.candidate.dTag,
        sender,
        archetype: request.archetype,
        action: request.action,
        convention: request.convention,
        ...(request.payload === undefined ? {} : { payload: request.payload }),
        ...(request.behavior === undefined ? {} : { behavior: request.behavior }),
      });
    } catch {
      return reject('invoke rejected');
    }

    return {
      ok: true,
      archetype: request.archetype,
      action: request.action,
      convention: request.convention,
      handler: selected.candidate.dTag,
    };
  }

  async function handlers(): Promise<IntentAvailability[]> {
    const catalog = await loadCatalog();
    const archetypes = new Set<string>();
    for (const entry of catalog) {
      for (const slug of Object.keys(entry.archetypes)) archetypes.add(slug);
    }
    return Promise.all([...archetypes].map((archetype) => availabilityFor(archetype)));
  }

  return {
    invoke,
    available: availabilityFor,
    handlers,
    onChanged(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    notifyChanged(archetype) {
      if (listeners.size === 0) return;
      void availabilityFor(archetype).then((availability) => {
        for (const listener of listeners) listener(availability);
      });
    },
  };
}
