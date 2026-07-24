import { describe, expect, it, vi } from 'vitest';
import type { NostrEvent } from '@napplet/core';

const livePool = vi.hoisted(() => ({
  close: undefined as ReturnType<typeof vi.fn> | undefined,
  delivered: 0,
  events: [] as unknown[],
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
import { normalizePajaSimulation } from './simulation.js';

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
});
