/**
 * manifest-intent-dispatch.test.ts — NAP-INTENT runtime integration proof.
 *
 * Exercises the production manifest adapter, catalog resolver, intent service,
 * runtime dispatch/policy gate, authenticated session registry, and host target
 * controller together. The host controller is deliberately private transport
 * policy: public wire messages contain only the canonical NAP-INTENT contract.
 */

import { describe, expect, it } from 'vitest';
import {
  createRuntime,
  type Runtime,
  type RuntimeAdapter,
  type SessionEntry,
} from '@kehto/runtime';
import type { NappletMessage } from '@napplet/core';
import { createCatalogIntentResolver } from './catalog-intent-resolver.js';
import { createIntentService } from './intent-service.js';
import { manifestToIntentCatalogEntry } from './manifest-intent-catalog.js';
import type { IntentDelivery } from './intent-types.js';

const SOURCE_WINDOW = 'window-source';
const SOURCE_DTAG = 'social-feed';
const TARGET_WINDOW = 'window-profile';
const TARGET_DTAG = 'profile-viewer';
const UNRELATED_WINDOW = 'window-unrelated';

const PROFILE_MANIFEST = {
  dTag: TARGET_DTAG,
  title: 'Profile Viewer',
  archetypes: [{ slug: 'profile', convention: 'napplet:profile/open' }],
};

interface SentMessage {
  windowId: string;
  message: unknown[] | NappletMessage;
}

interface Deferred {
  readonly promise: Promise<void>;
  resolve(): void;
}

function deferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function session(windowId: string, dTag: string): SessionEntry {
  return {
    pubkey: '',
    windowId,
    origin: '',
    type: 'nip5d',
    dTag,
    aggregateHash: dTag.padEnd(64, '0').slice(0, 64),
    registeredAt: Date.now(),
    instanceId: `instance-${windowId}`,
    provenance: 'nip-5d',
  };
}

function createHostAdapter(
  sent: SentMessage[],
  onSend?: (windowId: string, message: unknown[] | NappletMessage) => void,
): RuntimeAdapter {
  const state = new Map<string, string>();
  return {
    sendToNapplet(windowId, message) {
      sent.push({ windowId, message });
      onSend?.(windowId, message);
    },
    relayPool: {
      subscribe() {
        return { unsubscribe() {} };
      },
      publish() {},
      selectRelayTier() {
        return [];
      },
      trackSubscription() {},
      untrackSubscription() {},
      openScopedRelay() {},
      closeScopedRelay() {},
      publishToScopedRelay() {
        return false;
      },
      isAvailable() {
        return false;
      },
    },
    cache: {
      query() {
        return Promise.resolve([]);
      },
      store() {},
      isAvailable() {
        return false;
      },
    },
    auth: {
      getUserPubkey() {
        return null;
      },
      getSigner() {
        return null;
      },
    },
    config: {
      getNappUpdateBehavior() {
        return 'auto-grant';
      },
    },
    hotkeys: {
      executeHotkeyFromForward() {},
    },
    crypto: {
      verifyEvent() {
        return Promise.resolve(true);
      },
      randomUUID() {
        return '00000000-0000-4000-8000-000000000000';
      },
      randomBytes(length) {
        return new Uint8Array(length);
      },
    },
    aclPersistence: {
      persist() {},
      load() {
        return null;
      },
    },
    manifestPersistence: {
      persist() {},
      load() {
        return null;
      },
    },
    statePersistence: {
      get(key) {
        return state.get(key) ?? null;
      },
      set(key, value) {
        state.set(key, value);
        return true;
      },
      remove(key) {
        state.delete(key);
      },
      clear(prefix) {
        for (const key of state.keys()) {
          if (key.startsWith(prefix)) state.delete(key);
        }
      },
      keys(prefix) {
        return [...state.keys()].filter((key) => key.startsWith(prefix));
      },
      calculateBytes(prefix) {
        return [...state.entries()]
          .filter(([key]) => key.startsWith(prefix))
          .reduce((total, [key, value]) => total + key.length + value.length, 0);
      },
    },
    windowManager: {
      createWindow() {
        return TARGET_WINDOW;
      },
    },
    relayConfig: {
      addRelay() {},
      removeRelay() {},
      getRelayConfig() {
        return { discovery: [], super: [], outbox: [] };
      },
      getNip66Suggestions() {
        return [];
      },
    },
  };
}

async function flushUntil(predicate: () => boolean): Promise<void> {
  for (let iteration = 0; iteration < 50 && !predicate(); iteration++) {
    await Promise.resolve();
  }
  expect(predicate()).toBe(true);
}

function envelopesFor(sent: SentMessage[], windowId: string): NappletMessage[] {
  return sent
    .filter((item) => item.windowId === windowId && !Array.isArray(item.message))
    .map((item) => item.message as NappletMessage);
}

describe('manifest-backed intent runtime integration', () => {
  it('attests, accepts, retains, and delivers after source teardown and target readiness', async () => {
    const sent: SentMessage[] = [];
    const sequence: string[] = [];
    const ready = deferred();
    let runtime!: Runtime;

    const hooks = createHostAdapter(sent, (windowId, message) => {
      if (
        windowId === SOURCE_WINDOW
        && !Array.isArray(message)
        && message.type === 'intent.invoke.result'
      ) {
        sequence.push('source result');
      }
      if (
        windowId === TARGET_WINDOW
        && !Array.isArray(message)
        && message.type === 'intent.deliver'
      ) {
        sequence.push('target delivery');
      }
    });
    const catalogEntry = manifestToIntentCatalogEntry(PROFILE_MANIFEST);
    const resolver = createCatalogIntentResolver({
      loadCatalog: () => [catalogEntry],
      targets: {
        retain({ handler, delivery }) {
          const retainedHandler = handler;
          const retainedDelivery = delivery;
          sequence.push('retain');
          return {
            async start() {
              sequence.push('task start');
              await ready.promise;
              const targetWindow = runtime.sessionRegistry.getWindowIdByDTag(retainedHandler);
              if (!targetWindow) throw new Error('target not ready');
              hooks.sendToNapplet(targetWindow, {
                type: 'intent.deliver',
                delivery: retainedDelivery,
              } as NappletMessage);
            },
          };
        },
      },
    });
    runtime = createRuntime(hooks);
    runtime.registerService('intent', createIntentService({ resolver }));
    runtime.sessionRegistry.register(
      SOURCE_WINDOW,
      session(SOURCE_WINDOW, SOURCE_DTAG),
    );
    runtime.sessionRegistry.register(
      UNRELATED_WINDOW,
      session(UNRELATED_WINDOW, 'unrelated-napplet'),
    );

    runtime.handleMessage(SOURCE_WINDOW, {
      type: 'intent.available',
      id: 'availability-1',
      archetype: 'profile',
    } as NappletMessage);
    await flushUntil(() => sent.length === 1);
    expect(sent).toEqual([{
      windowId: SOURCE_WINDOW,
      message: {
        type: 'intent.available.result',
        id: 'availability-1',
        availability: {
          archetype: 'profile',
          available: true,
          candidates: [{
            dTag: TARGET_DTAG,
            title: 'Profile Viewer',
            actions: ['open'],
            conventions: ['napplet:profile/open'],
            contracts: [{ convention: 'napplet:profile/open' }],
          }],
          hasDefault: false,
        },
      },
    }]);

    sent.length = 0;
    runtime.handleMessage(SOURCE_WINDOW, {
      type: 'intent.invoke',
      id: 'forged',
      request: {
        archetype: 'profile',
        action: 'open',
        convention: 'napplet:profile/open',
        sender: 'forged-source',
      },
    } as unknown as NappletMessage);
    expect(sent).toEqual([{
      windowId: SOURCE_WINDOW,
      message: {
        type: 'intent.invoke.result',
        id: 'forged',
        result: { ok: false, error: 'invoke rejected' },
      },
    }]);

    sent.length = 0;
    sequence.length = 0;
    runtime.handleMessage(SOURCE_WINDOW, {
      type: 'intent.invoke',
      id: 'invoke-1',
      request: {
        archetype: 'profile',
        action: 'open',
        convention: 'napplet:profile/open',
        payload: { pubkey: 'abc123' },
      },
    } as NappletMessage);
    await flushUntil(() => sequence.includes('task start'));

    expect(sequence).toEqual(['retain', 'source result', 'task start']);
    expect(envelopesFor(sent, SOURCE_WINDOW)).toEqual([{
      type: 'intent.invoke.result',
      id: 'invoke-1',
      result: {
        ok: true,
        archetype: 'profile',
        action: 'open',
        convention: 'napplet:profile/open',
        handler: TARGET_DTAG,
      },
    }]);
    expect(envelopesFor(sent, UNRELATED_WINDOW)).toEqual([]);

    runtime.destroyWindow(SOURCE_WINDOW);
    runtime.sessionRegistry.unregister(SOURCE_WINDOW);
    runtime.sessionRegistry.register(
      TARGET_WINDOW,
      session(TARGET_WINDOW, TARGET_DTAG),
    );
    ready.resolve();
    await flushUntil(() => sequence.includes('target delivery'));

    const expectedDelivery: IntentDelivery = {
      sender: SOURCE_DTAG,
      archetype: 'profile',
      action: 'open',
      convention: 'napplet:profile/open',
      payload: { pubkey: 'abc123' },
    };
    expect(sequence).toEqual([
      'retain',
      'source result',
      'task start',
      'target delivery',
    ]);
    expect(envelopesFor(sent, TARGET_WINDOW)).toEqual([{
      type: 'intent.deliver',
      delivery: expectedDelivery,
    }]);
    expect(envelopesFor(sent, UNRELATED_WINDOW)).toEqual([]);
    expect(envelopesFor(sent, SOURCE_WINDOW)).toHaveLength(1);
    expect(sent.some((item) => (
      !Array.isArray(item.message) && item.message.type.startsWith('inc.')
    ))).toBe(false);
  });
});
