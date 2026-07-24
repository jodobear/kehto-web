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

const ACCOUNT = 'a'.repeat(64);
const FOLLOWED = 'b'.repeat(64);

function event(id: string, pubkey: string, kind: number, tags: string[][] = []): NostrEvent {
  return {
    id: id.repeat(64).slice(0, 64),
    pubkey,
    kind,
    created_at: 1,
    tags,
    content: '',
    sig: 'c'.repeat(128),
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

describe('createPajaSocialCache', () => {
  it('returns verified follows for the captured account and warms normal kind-0 results through its base router', async () => {
    let activePubkey = ACCOUNT;
    const profile = event('2', FOLLOWED, 0);
    const baseRouter = createRouter(vi.fn(async () => ({ events: [result(profile)] })));
    const cache = createPajaSocialCache({
      baseRouter,
      loadContactList: vi.fn(async () => [event('1', ACCOUNT, 3, [['p', FOLLOWED]])]),
      verifyEvent: vi.fn(async () => true),
      getActivePubkey: () => activePubkey,
    });

    await cache.refreshActiveIdentity();

    expect(await cache.getFollows(ACCOUNT)).toEqual([FOLLOWED]);
    expect(baseRouter.query).toHaveBeenCalledWith(
      [{ kinds: [0], authors: [FOLLOWED] }],
      { authors: [FOLLOWED] },
    );

    const decorated = cache.decorate(baseRouter);
    await expect(decorated.query([{ kinds: [0], authors: [FOLLOWED] }], {} as OutboxQueryOptions)).resolves.toEqual({
      events: [result(profile)],
    });

    activePubkey = 'd'.repeat(64);
  });
});
