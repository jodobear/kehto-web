import type { NappletMessage, NostrEvent } from '@napplet/core';
import { createRelayPoolService } from '@kehto/services';
import type { SimplePool } from 'nostr-tools/pool';
import { describe, expect, it, vi } from 'vitest';

const livePool = vi.hoisted(() => ({
  close: undefined as ReturnType<typeof vi.fn> | undefined,
  closeRejects: false,
  delivered: 0,
  events: [] as unknown[],
  querySyncEvents: [] as unknown[],
  querySyncRequests: [] as Array<{ relayUrls: string[]; filter: Record<string, unknown> }>,
  requests: [] as Array<{ relayUrls: string[]; filter: Record<string, unknown> }>,
}));

vi.mock('nostr-tools/pool', () => ({
  SimplePool: class {
    subscribeEose(
      relayUrls: string[],
      filter: Record<string, unknown>,
      params: { onevent(event: unknown): void; onclose(): void },
    ) {
      let closed = false;
      const close = vi.fn(async () => {
        closed = true;
        if (livePool.closeRejects) throw new Error('close rejected');
        params.onclose();
      });
      livePool.close = close;
      livePool.requests.push({ relayUrls, filter });
      queueMicrotask(() => {
        for (const event of livePool.events) {
          if (closed) break;
          livePool.delivered += 1;
          params.onevent(event);
        }
      });
      return { close };
    }

    querySync(relayUrls: string[], filter: Record<string, unknown>) {
      livePool.querySyncRequests.push({ relayUrls, filter });
      return Promise.resolve(livePool.querySyncEvents);
    }

    destroy() {}
  },
}));

import {
  PAJA_CONTACT_LIST_CANDIDATE_LIMIT,
  createPajaContactListLoader,
  createPajaRelayBackend,
  getPajaRelayUrls,
  type PajaRelayBackend,
} from './browser-relay-runtime.js';
import { createPajaAdapter } from './browser-adapter.js';
import type { PajaHostConfig } from './options.js';
import { normalizePajaSimulation } from './simulation.js';

const TEST_RELAYS = ['wss://relay-one.example', 'wss://relay-two.example'];

function testEvent(id: string): NostrEvent {
  return {
    id,
    pubkey: 'a'.repeat(64),
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [],
    content: 'Paja publish',
    sig: 'b'.repeat(128),
  };
}

function createPajaRelayService(backend: PajaRelayBackend) {
  return createRelayPoolService({
    subscribe: (filters, callback, relayUrls) =>
      backend.subscription(relayUrls ?? TEST_RELAYS, filters).subscribe((item) => {
        callback(item as NostrEvent | 'EOSE');
      }),
    publish: (event) => backend.publish(TEST_RELAYS, event),
    selectRelayTier: () => TEST_RELAYS,
    isAvailable: () => backend.isAvailable(),
  });
}

describe('@kehto/paja effective relay URLs', () => {
  it('returns configured live relay URLs in their configured order', () => {
    const simulation = normalizePajaSimulation({
      relay: {
        mode: 'live',
        urls: ['wss://first.example', 'wss://second.example'],
      },
    });

    expect(getPajaRelayUrls(simulation)).toEqual([
      'wss://first.example',
      'wss://second.example',
    ]);
  });

  it('returns no fallback relay URLs when relay simulation is disabled', () => {
    const simulation = normalizePajaSimulation({
      relay: { mode: 'disabled', urls: ['wss://must-not-connect.example'] },
    });

    expect(getPajaRelayUrls(simulation)).toEqual([]);
  });

  it('bounds raw contact candidates deterministically before consumers verify them', async () => {
    const pubkey = 'a'.repeat(64);
    const candidates = Array.from({ length: PAJA_CONTACT_LIST_CANDIDATE_LIMIT + 3 }, (_, index): NostrEvent => ({
      id: index.toString(16).padStart(64, '0'),
      pubkey,
      kind: 3,
      created_at: index,
      tags: [],
      content: '',
      sig: 'e'.repeat(128),
    }));
    const query = vi.fn(async () => [...candidates].reverse());
    const backend = { query } as unknown as PajaRelayBackend;
    const loader = createPajaContactListLoader(
      backend,
      () => normalizePajaSimulation({ relay: { mode: 'memory' } }),
    );

    const loaded = await loader(pubkey);

    expect(loaded).toHaveLength(PAJA_CONTACT_LIST_CANDIDATE_LIMIT);
    expect(loaded.map((event) => event.created_at)).toEqual(
      Array.from({ length: PAJA_CONTACT_LIST_CANDIDATE_LIMIT }, (_, index) => candidates.length - 1 - index),
    );
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.any(Array),
      [expect.objectContaining({ limit: PAJA_CONTACT_LIST_CANDIDATE_LIMIT })],
      expect.any(Number),
    );
  });

  it('closes a live contact-list query once its requested candidate limit is collected', async () => {
    const pubkey = 'a'.repeat(64);
    livePool.close = undefined;
    livePool.closeRejects = false;
    livePool.delivered = 0;
    livePool.requests = [];
    livePool.events = Array.from({ length: PAJA_CONTACT_LIST_CANDIDATE_LIMIT + 3 }, (_, index): NostrEvent => ({
      id: index.toString(16).padStart(64, '0'),
      pubkey,
      kind: 3,
      created_at: index,
      tags: [],
      content: '',
      sig: 'e'.repeat(128),
    }));
    const simulation = normalizePajaSimulation({
      relay: { mode: 'live', urls: ['wss://relay.example'] },
    });
    const loader = createPajaContactListLoader(
      createPajaRelayBackend(() => simulation, () => true),
      () => simulation,
    );

    const loaded = await loader(pubkey);

    expect(livePool.requests).toEqual([{
      relayUrls: ['wss://relay.example'],
      filter: {
        authors: [pubkey],
        kinds: [3],
        limit: PAJA_CONTACT_LIST_CANDIDATE_LIMIT,
      },
    }]);
    expect(livePool.delivered).toBe(PAJA_CONTACT_LIST_CANDIDATE_LIMIT);
    expect(livePool.close).toHaveBeenCalledWith('paja query limit reached');
    expect(loaded).toHaveLength(PAJA_CONTACT_LIST_CANDIDATE_LIMIT);
  });

  it('settles a bounded contact-list query when close rejects without an unhandled rejection', async () => {
    const pubkey = 'a'.repeat(64);
    livePool.closeRejects = true;
    livePool.delivered = 0;
    livePool.events = Array.from({ length: PAJA_CONTACT_LIST_CANDIDATE_LIMIT }, (_, index) => ({
      id: index.toString(16).padStart(64, '0'),
      pubkey,
      kind: 3,
      created_at: index,
      tags: [],
      content: '',
      sig: 'e'.repeat(128),
    }));
    try {
      const simulation = normalizePajaSimulation({ relay: { mode: 'live', urls: ['wss://relay.example'] } });
      const loader = createPajaContactListLoader(createPajaRelayBackend(() => simulation, () => true), () => simulation);

      await expect(loader(pubkey)).resolves.toHaveLength(PAJA_CONTACT_LIST_CANDIDATE_LIMIT);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    } finally {
      livePool.closeRejects = false;
    }
  });

  it('keeps generic limited live queries on querySync and preserves sorted results', async () => {
    const older = { id: '1'.repeat(64), pubkey: 'a'.repeat(64), kind: 1, created_at: 1, tags: [], content: '', sig: 'e'.repeat(128) };
    const newer = { ...older, id: '2'.repeat(64), created_at: 2 };
    livePool.querySyncRequests = [];
    livePool.querySyncEvents = [older, newer];
    const simulation = normalizePajaSimulation({ relay: { mode: 'live', urls: ['wss://relay.example'] } });
    const backend = createPajaRelayBackend(() => simulation, () => true);

    await expect(backend.query(['wss://relay.example'], [{ kinds: [1], limit: 1 }])).resolves.toEqual([newer, older]);
    expect(livePool.querySyncRequests).toEqual([{
      relayUrls: ['wss://relay.example'],
      filter: { kinds: [1], limit: 1 },
    }]);
  });
});

describe('@kehto/paja relay publish settlement', () => {
  it('settles scoped relay publication and reports denied publication as false', async () => {
    const simulation = normalizePajaSimulation({
      relay: { mode: 'memory', urls: TEST_RELAYS },
    });
    const adapter = createPajaAdapter(
      {
        window: {
          id: 'paja-window',
          dTag: 'paja',
          aggregateHash: 'aggregate',
        },
      } as PajaHostConfig,
      () => simulation,
      () => {},
      () => {},
      () => false,
    );
    const event = testEvent('e'.repeat(64));
    const publishResult = adapter.relayPool.publishToScopedRelay('paja-window', event);

    expect(publishResult).toBeInstanceOf(Promise);
    await expect(publishResult).resolves.toBe(false);

    const backend = adapter.relayPool.getRelayPool() as PajaRelayBackend;
    expect(await backend.query(TEST_RELAYS, [{ ids: [event.id] }])).toEqual([]);
    backend.close();
  });

  it('returns a canonical failure and retains nothing when confirmation is denied', async () => {
    const simulation = normalizePajaSimulation({
      relay: { mode: 'memory', urls: TEST_RELAYS },
    });
    const backend = createPajaRelayBackend(() => simulation, () => false);
    const service = createPajaRelayService(backend);
    const event = testEvent('c'.repeat(64));
    const sent: NappletMessage[] = [];

    service.handleMessage(
      'paja-window',
      { type: 'relay.publish', id: 'denied', event } as NappletMessage,
      (message) => sent.push(message),
    );

    await vi.waitFor(() => {
      expect(sent).toEqual([{
        type: 'relay.publish.result',
        id: 'denied',
        ok: false,
        error: 'publish denied',
      }]);
    });
    expect(await backend.query(TEST_RELAYS, [{ ids: [event.id] }])).toEqual([]);
    backend.close();
  });

  it('reports all-live-relay rejection without retaining service or outbox events', async () => {
    let simulation = normalizePajaSimulation({
      relay: { mode: 'live', urls: TEST_RELAYS },
    });
    const rejectingPool = {
      publish: (relayUrls: string[]) =>
        relayUrls.map(() => Promise.reject(new Error('relay rejected'))),
      destroy: () => {},
    } as unknown as SimplePool;
    const backend = createPajaRelayBackend(() => simulation, () => true, rejectingPool);
    const service = createPajaRelayService(backend);
    const event = testEvent('d'.repeat(64));
    const sent: NappletMessage[] = [];

    service.handleMessage(
      'paja-window',
      { type: 'relay.publish', id: 'rejected', event } as NappletMessage,
      (message) => sent.push(message),
    );

    await vi.waitFor(() => {
      expect(sent).toEqual([{
        type: 'relay.publish.result',
        id: 'rejected',
        ok: false,
        error: 'publish failed',
      }]);
    });
    expect(await backend.publishToRelays(TEST_RELAYS, event)).toEqual({
      [TEST_RELAYS[0]!]: false,
      [TEST_RELAYS[1]!]: false,
    });
    simulation = normalizePajaSimulation({
      relay: { mode: 'memory', urls: TEST_RELAYS },
    });
    expect(await backend.query(TEST_RELAYS, [{ ids: [event.id] }])).toEqual([]);
    backend.close();
  });
});
