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
});
