import type { NappletMessage, NostrEvent } from '@napplet/core';
import { createRelayPoolService } from '@kehto/services';
import type { SimplePool } from 'nostr-tools/pool';
import { describe, expect, it, vi } from 'vitest';

import {
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
