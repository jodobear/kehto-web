import { describe, expect, it, vi } from 'vitest';
import type { NostrEvent } from '@napplet/core';
import type { RelayEventResult } from '@kehto/runtime';
import type {
  OutboxEventOptions,
  OutboxEventResult,
  OutboxPublishOptions,
  OutboxPublishResult,
  OutboxQueryOptions,
  OutboxRelayPlan,
  OutboxResult,
  OutboxRouter,
  OutboxRouterSubscription,
  OutboxSubscribeOptions,
  OutboxSubscriptionSink,
  OutboxTarget,
} from '@kehto/services';

import { createPajaSocialCache } from './browser-social-cache.js';

const ACCOUNT_A = 'a'.repeat(64);
const ACCOUNT_B = 'b'.repeat(64);
const FOLLOWED_A = 'c'.repeat(64);
const FOLLOWED_B = 'd'.repeat(64);

function event(
  id: string,
  pubkey: string,
  kind: number,
  tags: unknown = [],
  createdAt = 1,
): NostrEvent {
  return {
    id: id.repeat(64).slice(0, 64),
    pubkey,
    kind,
    created_at: createdAt,
    tags: tags as string[][],
    content: '',
    sig: 'e'.repeat(128),
  };
}

function result(value: NostrEvent): RelayEventResult {
  return { event: value };
}

function createRouter(query: (filters: Parameters<OutboxRouter['query']>[0]) => Promise<OutboxResult>): OutboxRouter {
  return {
    query,
    subscribe: (_filters: Parameters<OutboxRouter['subscribe']>[0], _options: OutboxSubscribeOptions | undefined, _sink: OutboxSubscriptionSink): OutboxRouterSubscription => ({ close() {} }),
    publish: async (_template, _options?: OutboxPublishOptions): Promise<OutboxPublishResult> => ({ ok: true }),
    resolveRelays: async (_target: OutboxTarget): Promise<OutboxRelayPlan> => ({ relays: [], source: 'fallback' }),
    getEvent: async (_eventId: string, _options?: OutboxEventOptions): Promise<OutboxEventResult> => ({}),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('createPajaSocialCache', () => {
  it('returns verified follows for the captured account and warms normal kind-0 results through its base router', async () => {
    let activePubkey = ACCOUNT_A;
    const profile = event('2', FOLLOWED_A, 0);
    const baseRouter = createRouter(vi.fn(async () => ({ events: [result(profile)] })));
    const cache = createPajaSocialCache({
      baseRouter,
      loadContactList: vi.fn(async () => [event('1', ACCOUNT_A, 3, [['p', FOLLOWED_A]])]),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => activePubkey,
    });

    await cache.refreshActiveIdentity();

    expect(await cache.getFollows(ACCOUNT_A)).toEqual([FOLLOWED_A]);
    expect(baseRouter.query).toHaveBeenCalledWith(
      [{ kinds: [0], authors: [FOLLOWED_A] }],
      { authors: [FOLLOWED_A] },
    );

    const decorated = cache.decorate(baseRouter);
    await expect(decorated.query([{ kinds: [0], authors: [FOLLOWED_A] }], {} as OutboxQueryOptions)).resolves.toEqual({
      events: [result(profile)],
    });

    activePubkey = ACCOUNT_B;
  });

  it('accepts only an exactly 64-hex p tag and ignores malformed contact-list tags', async () => {
    const extraFollow = 'f'.repeat(64);
    const baseRouter = createRouter(vi.fn(async () => ({ events: [] })));
    const cache = createPajaSocialCache({
      baseRouter,
      loadContactList: vi.fn(async () => [event('1', ACCOUNT_A, 3, [
        null,
        ['p'],
        ['p', FOLLOWED_A.slice(1)],
        ['p', `${FOLLOWED_A}0`],
        ['p', `${FOLLOWED_A.slice(0, 63)}z`],
        ['p', ` ${FOLLOWED_A} `],
        ['p', FOLLOWED_A.toUpperCase()],
        ['p', FOLLOWED_A],
        ['p', extraFollow],
      ])]),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => ACCOUNT_A,
    });

    await expect(cache.getFollows(` ${ACCOUNT_A}`)).resolves.toEqual([]);
    await expect(cache.getFollows(ACCOUNT_A)).resolves.toEqual([FOLLOWED_A, extraFollow]);
    expect(baseRouter.query).not.toHaveBeenCalled();
  });

  it('selects the newest verified same-author kind-3 event with a lowest-ID tie independent of arrival order', async () => {
    const lowerId = event('1', ACCOUNT_A, 3, [['p', FOLLOWED_A]], 20);
    const higherId = event('2', ACCOUNT_A, 3, [['p', FOLLOWED_B]], 20);
    const newer = event('3', ACCOUNT_A, 3, [['p', FOLLOWED_B]], 21);
    const invalidSignature = event('4', ACCOUNT_A, 3, [['p', '9'.repeat(64)]], 22);
    const wrongAuthor = event('5', ACCOUNT_B, 3, [['p', '8'.repeat(64)]], 23);
    const wrongKind = event('6', ACCOUNT_A, 0, [['p', '7'.repeat(64)]], 24);
    const baseRouter = createRouter(vi.fn(async () => ({ events: [] })));
    const cache = createPajaSocialCache({
      baseRouter,
      loadContactList: vi.fn(async () => [wrongKind, higherId, invalidSignature, wrongAuthor, lowerId, newer]),
      verifyEvent: vi.fn(async (candidate: NostrEvent) => candidate !== invalidSignature),
      getActivePubkey: () => ACCOUNT_A,
    });

    await expect(cache.getFollows(ACCOUNT_A)).resolves.toEqual([FOLLOWED_B]);

    const tiedCache = createPajaSocialCache({
      baseRouter,
      loadContactList: vi.fn(async () => [higherId, lowerId]),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => ACCOUNT_A,
    });
    await expect(tiedCache.getFollows(ACCOUNT_A)).resolves.toEqual([FOLLOWED_A]);
  });

  it('does not warm broad profiles for signed-out accounts or empty selected follows', async () => {
    const baseQuery = vi.fn(async () => ({ events: [] }));
    const baseRouter = createRouter(baseQuery);
    const cache = createPajaSocialCache({
      baseRouter,
      loadContactList: vi.fn(async () => [event('1', ACCOUNT_A, 3)]),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => null,
    });

    await cache.refreshActiveIdentity();
    expect(baseQuery).not.toHaveBeenCalled();

    const emptyCache = createPajaSocialCache({
      baseRouter,
      loadContactList: vi.fn(async () => [event('1', ACCOUNT_A, 3)]),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => ACCOUNT_A,
    });
    await emptyCache.refreshActiveIdentity();
    expect(baseQuery).not.toHaveBeenCalled();
  });

  it('keeps correlated A follows while discarding a late A background warm after account B becomes active', async () => {
    let activePubkey = ACCOUNT_A;
    const contactsA = deferred<NostrEvent[]>();
    const contactsB = deferred<NostrEvent[]>();
    const baseQuery = vi.fn(async (filters: Parameters<OutboxRouter['query']>[0]) => ({
      events: filters[0]?.authors?.[0] === FOLLOWED_B ? [result(event('b', FOLLOWED_B, 0))] : [result(event('a', FOLLOWED_A, 0))],
    }));
    const cache = createPajaSocialCache({
      baseRouter: createRouter(baseQuery),
      loadContactList: vi.fn((pubkey) => pubkey === ACCOUNT_A ? contactsA.promise : contactsB.promise),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => activePubkey,
    });

    const requestForA = cache.getFollows(ACCOUNT_A);
    const refreshA = cache.refreshActiveIdentity();
    activePubkey = ACCOUNT_B;
    const refreshB = cache.refreshActiveIdentity();
    contactsB.resolve([event('b', ACCOUNT_B, 3, [['p', FOLLOWED_B]])]);
    await refreshB;
    contactsA.resolve([event('a', ACCOUNT_A, 3, [['p', FOLLOWED_A]])]);
    await expect(requestForA).resolves.toEqual([FOLLOWED_A]);
    await refreshA;

    await expect(cache.getFollows(ACCOUNT_B)).resolves.toEqual([FOLLOWED_B]);
    expect(baseQuery).toHaveBeenCalledTimes(1);
    expect(baseQuery).toHaveBeenCalledWith([{ kinds: [0], authors: [FOLLOWED_B] }], { authors: [FOLLOWED_B] });
  });

  it('merges the request-start account snapshot when the active account switches while the base query is pending', async () => {
    let activePubkey = ACCOUNT_A;
    const baseQuery = deferred<OutboxResult>();
    const profileA = event('a', FOLLOWED_A, 0);
    const profileB = event('b', FOLLOWED_B, 0);
    const router = createRouter(async (filters) => {
      if (filters[0]?.authors?.[0] === FOLLOWED_A) return { events: [result(profileA)] };
      if (filters[0]?.authors?.[0] === FOLLOWED_B) return { events: [result(profileB)] };
      return baseQuery.promise;
    });
    const cache = createPajaSocialCache({
      baseRouter: router,
      loadContactList: vi.fn(async (pubkey) => [event(pubkey === ACCOUNT_A ? '1' : '2', pubkey, 3, [
        ['p', pubkey === ACCOUNT_A ? FOLLOWED_A : FOLLOWED_B],
      ])]),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => activePubkey,
    });
    await cache.refreshActiveIdentity();

    const queryForA = cache.decorate(router).query([{ kinds: [0] }]);
    activePubkey = ACCOUNT_B;
    await cache.refreshActiveIdentity();
    baseQuery.resolve({ events: [] });

    await expect(queryForA).resolves.toEqual({ events: [result(profileA)] });
  });

  it('keeps only the newest same-account refresh generation', async () => {
    const first = deferred<NostrEvent[]>();
    const second = deferred<NostrEvent[]>();
    const baseQuery = vi.fn(async (filters: Parameters<OutboxRouter['query']>[0]) => ({
      events: [result(event('p', filters[0]?.authors?.[0] ?? FOLLOWED_A, 0))],
    }));
    let calls = 0;
    const cache = createPajaSocialCache({
      baseRouter: createRouter(baseQuery),
      loadContactList: vi.fn(() => (++calls === 1 ? first.promise : second.promise)),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => ACCOUNT_A,
    });

    const firstRefresh = cache.refreshActiveIdentity();
    const secondRefresh = cache.refreshActiveIdentity();
    second.resolve([event('2', ACCOUNT_A, 3, [['p', FOLLOWED_B]])]);
    await secondRefresh;
    first.resolve([event('1', ACCOUNT_A, 3, [['p', FOLLOWED_A]])]);
    await firstRefresh;

    await expect(cache.getFollows(ACCOUNT_A)).resolves.toEqual([FOLLOWED_B]);
    expect(baseQuery).toHaveBeenCalledTimes(1);
  });

  it('adds only cached kind-0 values matching the query filters and their result limit', async () => {
    const profileA = event('1', FOLLOWED_A, 0, [['t', 'alpha']], 10);
    const profileB = event('2', FOLLOWED_B, 0, [['t', 'beta']], 9);
    let queryCount = 0;
    const baseRouter = createRouter(vi.fn(async () => {
      queryCount += 1;
      return { events: queryCount === 1 ? [result(profileA), result(profileB)] : [] };
    }));
    const cache = createPajaSocialCache({
      baseRouter,
      loadContactList: vi.fn(async () => [event('3', ACCOUNT_A, 3, [['p', FOLLOWED_A], ['p', FOLLOWED_B]])]),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => ACCOUNT_A,
    });
    await cache.refreshActiveIdentity();
    const decorated = cache.decorate(baseRouter);

    await expect(decorated.query([{ ids: [profileA.id] }])).resolves.toEqual({ events: [result(profileA)] });
    await expect(decorated.query([{ authors: ['f'.repeat(64)] }])).resolves.toEqual({ events: [] });
    await expect(decorated.query([{ kinds: [1] }])).resolves.toEqual({ events: [] });
    await expect(decorated.query([{ since: 11 }])).resolves.toEqual({ events: [] });
    await expect(decorated.query([{ until: 8 }])).resolves.toEqual({ events: [] });
    await expect(decorated.query([{ '#t': ['missing'] }])).resolves.toEqual({ events: [] });
    await expect(decorated.query([{ kinds: [0], limit: 1 }])).resolves.toEqual({ events: [result(profileA)] });
  });

  it('deduplicates cache/base event IDs in favor of base while preserving its degraded result exactly', async () => {
    const cached = event('1', FOLLOWED_A, 0, [], 10);
    const cachedOnly = event('2', FOLLOWED_A, 0, [], 9);
    let queryCount = 0;
    const baseEntry = { event: cached, sidecar: { relayHints: ['wss://base.example'] } };
    const baseRouter = createRouter(vi.fn(async () => {
      queryCount += 1;
      return queryCount === 1
        ? { events: [result(cached), result(cachedOnly)] }
        : { events: [baseEntry], incomplete: true, error: 'relay timeout' };
    }));
    const cache = createPajaSocialCache({
      baseRouter,
      loadContactList: vi.fn(async () => [event('3', ACCOUNT_A, 3, [['p', FOLLOWED_A]])]),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => ACCOUNT_A,
    });
    await cache.refreshActiveIdentity();

    await expect(cache.decorate(baseRouter).query([{ kinds: [0], authors: [FOLLOWED_A] }])).resolves.toEqual({
      events: [baseEntry, result(cachedOnly)],
      incomplete: true,
      error: 'relay timeout',
    });
  });

  it('delegates every non-query router operation to the base router unchanged', async () => {
    const getEvent = vi.fn(async () => ({}));
    const publish = vi.fn(async () => ({ ok: true }));
    const resolveRelays = vi.fn(async () => ({ relays: [], source: 'fallback' as const }));
    const subscribe = vi.fn(() => ({ close: vi.fn() }));
    const baseRouter = createRouter(vi.fn(async () => ({ events: [] })));
    baseRouter.getEvent = getEvent;
    baseRouter.publish = publish;
    baseRouter.resolveRelays = resolveRelays;
    baseRouter.subscribe = subscribe;
    const decorated = createPajaSocialCache({
      baseRouter,
      loadContactList: vi.fn(async () => []),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => ACCOUNT_A,
    }).decorate(baseRouter);
    const sink: OutboxSubscriptionSink = { event() {}, closed() {} };

    await decorated.getEvent?.('1'.repeat(64));
    decorated.subscribe([{ kinds: [0] }], { timeoutMs: 1 }, sink).close();
    await decorated.publish({ kind: 1, content: '', tags: [], created_at: 1 });
    await decorated.resolveRelays({ pubkey: ACCOUNT_A });

    expect(getEvent).toHaveBeenCalledWith('1'.repeat(64));
    expect(subscribe).toHaveBeenCalledWith([{ kinds: [0] }], { timeoutMs: 1 }, sink);
    expect(publish).toHaveBeenCalledWith({ kind: 1, content: '', tags: [], created_at: 1 });
    expect(resolveRelays).toHaveBeenCalledWith({ pubkey: ACCOUNT_A });
  });
});
