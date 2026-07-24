import type { NostrEvent } from '@napplet/core';
import type { RelayEventResult } from '@kehto/runtime';
import type {
  OutboxResult,
  OutboxRouter,
} from '@kehto/services';

import { matchesAnyFilter } from './browser-relay-runtime.js';

/** Dependencies Paja supplies to its private active-account social snapshot. */
export interface PajaSocialCacheOptions {
  /** The one host-owned router used for profile warming. */
  readonly baseRouter: OutboxRouter;
  /** Reads raw contact-list candidates through Paja's existing bootstrap relays. */
  readonly loadContactList: (pubkey: string) => Promise<NostrEvent[]>;
  /** Verifies an untrusted contact-list candidate before it is used. */
  readonly verifyEvent: (event: NostrEvent) => boolean | Promise<boolean>;
  /** Returns the active Paja account, if present. */
  readonly getActivePubkey: () => string | null;
  /** Observes signer transitions without exposing cache state to napplets. */
  readonly subscribeSignerChange?: (listener: () => void) => () => void;
}

/** Paja-private social-cache operations used only by browser adapter composition. */
export interface PajaSocialCache {
  /** Returns a copied, normalized follow list for the request-start account key. */
  getFollows(pubkey: string): Promise<string[]>;
  /** Refreshes the active account without delaying adapter construction. */
  refreshActiveIdentity(): Promise<void>;
  /** Decorates the existing router while preserving its non-query operations. */
  decorate(router: OutboxRouter): OutboxRouter;
  /** Removes the signer-change observer. */
  dispose(): void;
}

interface SocialSnapshot {
  readonly follows: string[];
  readonly profiles: RelayEventResult[];
}

// Authority recorded in 102-IMPLEMENTATION-NOTE.md: NAP-IDENTITY
// 6461e4b37c29dc09a20dff35d9515889c4433874 is byte-identical to recorded
// master. Pinned NAP-OUTBOX 4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e plus
// installed @napplet/nap@0.28.0 types govern under upstream drift; this makes
// no current-master OUTBOX conformance claim.
const HEX_PUBKEY = /^[0-9a-f]{64}$/i;

/**
 * Creates Paja's memory-only, account-scoped social cache.
 *
 * The cache is intentionally not re-exported from Paja's package entrypoint.
 * NAPplets use ordinary identity and outbox messages; Paja retains relay,
 * verification, and cache authority behind those standard services.
 */
export function createPajaSocialCache(options: PajaSocialCacheOptions): PajaSocialCache {
  let generation = 0;
  const snapshots = new Map<string, SocialSnapshot>();

  async function loadFollows(capturedPubkey: string): Promise<string[]> {
    const normalizedPubkey = normalizePubkey(capturedPubkey);
    if (!normalizedPubkey) return [];
    const existing = snapshots.get(normalizedPubkey);
    if (existing) return [...existing.follows];

    const follows = await verifiedFollows(normalizedPubkey);
    snapshots.set(normalizedPubkey, { follows, profiles: [] });
    return [...follows];
  }

  async function verifiedFollows(capturedPubkey: string): Promise<string[]> {
    const candidates = await options.loadContactList(capturedPubkey);
    const verified: NostrEvent[] = [];
    for (const candidate of candidates) {
      if (candidate.kind !== 3 || normalizePubkey(candidate.pubkey) !== capturedPubkey) continue;
      try {
        if (await options.verifyEvent(candidate)) verified.push(candidate);
      } catch {
        // An unverifiable relay event cannot influence the active social graph.
      }
    }
    return contactPubkeys(selectReplacement(verified));
  }

  async function refreshActiveIdentity(): Promise<void> {
    const currentGeneration = ++generation;
    const capturedPubkey = normalizePubkey(options.getActivePubkey() ?? '');
    if (!capturedPubkey) return;

    try {
      const follows = await verifiedFollows(capturedPubkey);
      if (!isCurrent(capturedPubkey, currentGeneration)) return;
      if (follows.length === 0) {
        snapshots.set(capturedPubkey, { follows, profiles: [] });
        return;
      }

      const warmed = await options.baseRouter.query(
        [{ kinds: [0], authors: follows }],
        { authors: follows },
      );
      if (!isCurrent(capturedPubkey, currentGeneration)) return;
      snapshots.set(capturedPubkey, {
        follows,
        profiles: profileResults(warmed, follows),
      });
    } catch {
      // Background warming is best-effort and must never delay Paja startup.
    }
  }

  function isCurrent(capturedPubkey: string, currentGeneration: number): boolean {
    return generation === currentGeneration
      && normalizePubkey(options.getActivePubkey() ?? '') === capturedPubkey;
  }

  function decorate(router: OutboxRouter): OutboxRouter {
    return {
      ...(router.getEvent ? { getEvent: router.getEvent.bind(router) } : {}),
      async query(filters, queryOptions) {
        const base = await router.query(filters, queryOptions);
        const activePubkey = normalizePubkey(options.getActivePubkey() ?? '');
        const snapshot = activePubkey ? snapshots.get(activePubkey) : undefined;
        const cached = snapshot?.profiles.filter((entry) => matchesAnyFilter(entry.event, filters)) ?? [];
        return mergeResult(base, cached);
      },
      subscribe: router.subscribe.bind(router),
      publish: router.publish.bind(router),
      resolveRelays: router.resolveRelays.bind(router),
    };
  }

  const unsubscribe = options.subscribeSignerChange?.(() => {
    void refreshActiveIdentity();
  });

  return {
    getFollows: loadFollows,
    refreshActiveIdentity,
    decorate,
    dispose: () => unsubscribe?.(),
  };
}

function normalizePubkey(value: string): string | null {
  const trimmed = value.trim();
  return HEX_PUBKEY.test(trimmed) ? trimmed.toLowerCase() : null;
}

function selectReplacement(events: NostrEvent[]): NostrEvent | undefined {
  return [...events].sort((left, right) =>
    right.created_at - left.created_at || left.id.localeCompare(right.id),
  )[0];
}

function contactPubkeys(event: NostrEvent | undefined): string[] {
  if (!event) return [];
  const follows = new Set<string>();
  for (const tag of event.tags) {
    if (tag[0] !== 'p' || typeof tag[1] !== 'string') continue;
    const pubkey = normalizePubkey(tag[1]);
    if (pubkey) follows.add(pubkey);
  }
  return [...follows];
}

function profileResults(result: OutboxResult, follows: readonly string[]): RelayEventResult[] {
  const followed = new Set(follows);
  return result.events.filter(({ event }) => event.kind === 0 && followed.has(normalizePubkey(event.pubkey) ?? ''));
}

function mergeResult(base: OutboxResult, cached: RelayEventResult[]): OutboxResult {
  const events = new Map<string, RelayEventResult>();
  for (const entry of base.events) events.set(entry.event.id, entry);
  for (const entry of cached) {
    if (!events.has(entry.event.id)) events.set(entry.event.id, entry);
  }
  return {
    events: [...events.values()],
    ...(base.incomplete === undefined ? {} : { incomplete: base.incomplete }),
    ...(base.error === undefined ? {} : { error: base.error }),
  };
}
