/**
 * intent-service.test.ts — authenticated NAP-INTENT envelope orchestration.
 *
 * Exercises normalized request validation, runtime-attested sender context,
 * retained result-before-start ordering, failure containment, ordinary
 * availability calls, and policy-aware live-session change broadcasts.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NappletMessage } from '@napplet/core';
import type { ServiceRuntimeContext } from '@kehto/runtime';

import { createIntentService } from './intent-service.js';
import type {
  IntentResolver,
  IntentResolverOutcome,
  IntentRetainedDelivery,
} from './intent-service.js';
import type {
  IntentAvailability,
  IntentRequest,
} from './intent-types.js';

const WINDOW = 'win-1';
const SENDER = 'source-dtag';
const CONVENTION = 'napplet:note/open';
const REQUEST: IntentRequest = {
  archetype: 'note',
  action: 'open',
  convention: CONVENTION,
  payload: { target: 'abc' },
};

const AVAILABILITY: IntentAvailability = {
  archetype: 'note',
  available: true,
  candidates: [{
    dTag: 'noteview',
    title: 'Note',
    actions: ['open'],
    conventions: [CONVENTION],
    contracts: [{ convention: CONVENTION }],
    isDefault: true,
  }],
  hasDefault: true,
};

interface MockResolver extends IntentResolver {
  emitChanged(availability: IntentAvailability): void;
}

function acceptedOutcome(retained: IntentRetainedDelivery = { start() {} }): IntentResolverOutcome {
  return {
    result: {
      ok: true,
      archetype: 'note',
      action: 'open',
      convention: CONVENTION,
      handler: 'noteview',
    },
    retained,
  };
}

function mockResolver(overrides: Partial<IntentResolver> = {}): MockResolver {
  let changeListener: ((availability: IntentAvailability) => void) | undefined;
  return {
    invoke: vi.fn(async () => acceptedOutcome()),
    available: vi.fn(async () => AVAILABILITY),
    handlers: vi.fn(async () => [AVAILABILITY]),
    onChanged: vi.fn((listener) => {
      changeListener = listener;
      return () => {
        changeListener = undefined;
      };
    }),
    emitChanged(availability) {
      changeListener?.(availability);
    },
    ...overrides,
  };
}

function runtimeContext(
  overrides: Partial<ServiceRuntimeContext> = {},
): ServiceRuntimeContext {
  return {
    resolveDTag: vi.fn((windowId: string) => windowId === WINDOW ? SENDER : undefined),
    listWindowIds: vi.fn(() => Object.freeze(['win-a', 'win-b'])),
    sendToEligibleNapplet: vi.fn(() => true),
    ...overrides,
  };
}

function collector(onSend?: (message: NappletMessage) => void) {
  const sent: NappletMessage[] = [];
  return {
    sent,
    send(message: NappletMessage) {
      sent.push(message);
      onSend?.(message);
    },
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('createIntentService', () => {
  it('throws when resolver is missing', () => {
    // @ts-expect-error — exercising the runtime guard
    expect(() => createIntentService({})).toThrow(/resolver is required/);
  });

  it('exposes the intent descriptor', () => {
    expect(createIntentService({ resolver: mockResolver() }).descriptor.name).toBe('intent');
  });

  describe('intent.invoke validation and attestation', () => {
    let resolver: MockResolver;
    let service: ReturnType<typeof createIntentService>;

    beforeEach(() => {
      resolver = mockResolver();
      service = createIntentService({ resolver });
      service.onRegistered?.(runtimeContext());
    });

    it('passes only the normalized request and runtime-attested sender to the resolver', async () => {
      const c = collector();
      service.handleMessage(
        WINDOW,
        { type: 'intent.invoke', id: 'i1', request: REQUEST } as NappletMessage,
        c.send,
      );
      await flushPromises();

      expect(resolver.invoke).toHaveBeenCalledWith(REQUEST, { sender: SENDER });
      expect(c.sent).toEqual([{
        type: 'intent.invoke.result',
        id: 'i1',
        result: acceptedOutcome().result,
      }]);
    });

    it('keeps sender-looking payload data opaque and derives provenance from runtime context', async () => {
      const request = {
        ...REQUEST,
        payload: { sender: 'payload-value', event: { kind: 1 } },
      };
      const c = collector();
      service.handleMessage(
        WINDOW,
        { type: 'intent.invoke', id: 'i-payload', request } as unknown as NappletMessage,
        c.send,
      );
      await flushPromises();

      expect(resolver.invoke).toHaveBeenCalledWith(request, { sender: SENDER });
      expect(c.sent[0]).toMatchObject({
        type: 'intent.invoke.result',
        result: { ok: true },
      });
    });

    it.each([
      ['missing request', undefined, 'invalid convention'],
      ['array request', [], 'invalid convention'],
      ['missing archetype', { action: 'open', convention: CONVENTION }, 'invalid convention'],
      ['empty archetype', { ...REQUEST, archetype: '' }, 'invalid convention'],
      ['missing action', { archetype: 'note', convention: CONVENTION }, 'invalid convention'],
      ['empty action', { ...REQUEST, action: '' }, 'invalid convention'],
      ['missing convention', { archetype: 'note', action: 'open' }, 'invalid convention'],
      ['query convention', { ...REQUEST, convention: `${CONVENTION}?x=1` }, 'invalid convention'],
      ['fragment convention', { ...REQUEST, convention: `${CONVENTION}#x` }, 'invalid convention'],
      ['archetype mismatch', { ...REQUEST, archetype: 'profile' }, 'invalid convention'],
      ['action mismatch', { ...REQUEST, action: 'edit' }, 'invalid convention'],
      ['caller sender', { ...REQUEST, sender: 'forged' }, 'invoke rejected'],
      ['empty handler', { ...REQUEST, handler: '' }, 'invoke rejected'],
      ['non-text handler', { ...REQUEST, handler: 7 }, 'invoke rejected'],
      ['null behavior', { ...REQUEST, behavior: null }, 'invoke rejected'],
      ['array behavior', { ...REQUEST, behavior: [] }, 'invoke rejected'],
      ['malformed focus', { ...REQUEST, behavior: { focus: 'yes' } }, 'invoke rejected'],
      ['unknown behavior field', { ...REQUEST, behavior: { focus: true, closeSource: true } }, 'invoke rejected'],
      ['legacy protocol field', { ...REQUEST, protocol: 'NAP-1' }, 'invoke rejected'],
    ])('rejects %s before resolver selection', async (_label, request, error) => {
      const c = collector();
      service.handleMessage(
        WINDOW,
        { type: 'intent.invoke', id: `bad-${String(_label)}`, request } as unknown as NappletMessage,
        c.send,
      );
      await flushPromises();

      expect(c.sent).toEqual([{
        type: 'intent.invoke.result',
        id: `bad-${String(_label)}`,
        result: { ok: false, error },
      }]);
      expect(resolver.invoke).not.toHaveBeenCalled();
    });

    it('rejects when the service is unattached or the source session is missing', async () => {
      const unattached = createIntentService({ resolver });
      const unattachedCollector = collector();
      unattached.handleMessage(
        WINDOW,
        { type: 'intent.invoke', id: 'no-runtime', request: REQUEST } as NappletMessage,
        unattachedCollector.send,
      );

      const missingSession = createIntentService({ resolver });
      missingSession.onRegistered?.(runtimeContext({ resolveDTag: () => undefined }));
      const missingCollector = collector();
      missingSession.handleMessage(
        WINDOW,
        { type: 'intent.invoke', id: 'no-session', request: REQUEST } as NappletMessage,
        missingCollector.send,
      );
      await flushPromises();

      expect(unattachedCollector.sent[0]).toEqual({
        type: 'intent.invoke.result',
        id: 'no-runtime',
        result: { ok: false, error: 'invoke rejected' },
      });
      expect(missingCollector.sent[0]).toEqual({
        type: 'intent.invoke.result',
        id: 'no-session',
        result: { ok: false, error: 'invoke rejected' },
      });
      expect(resolver.invoke).not.toHaveBeenCalled();
    });
  });

  describe('retained acceptance ordering', () => {
    it('sends the one correlated result after retention and before task start', async () => {
      const sequence: string[] = [];
      const retained = {
        start: vi.fn(() => {
          sequence.push('task start');
          sequence.push('target policy');
        }),
      };
      const resolver = mockResolver({
        invoke: vi.fn(async () => {
          sequence.push('retain');
          return acceptedOutcome(retained);
        }),
      });
      const service = createIntentService({ resolver });
      service.onRegistered?.(runtimeContext());
      const c = collector((message) => {
        if (message.type === 'intent.invoke.result') sequence.push('source result');
      });

      service.handleMessage(
        WINDOW,
        { type: 'intent.invoke', id: 'ordered', request: REQUEST } as NappletMessage,
        c.send,
      );
      await flushPromises();

      expect(sequence).toEqual(['retain', 'source result', 'task start', 'target policy']);
      expect(c.sent).toHaveLength(1);
      expect(retained.start).toHaveBeenCalledOnce();
    });

    it('contains synchronous and asynchronous task failure without a second result', async () => {
      for (const start of [
        vi.fn(() => {
          throw new Error('sync terminal failure');
        }),
        vi.fn(() => Promise.reject(new Error('async terminal failure'))),
      ]) {
        const resolver = mockResolver({
          invoke: vi.fn(async () => acceptedOutcome({ start })),
        });
        const service = createIntentService({ resolver });
        service.onRegistered?.(runtimeContext());
        const c = collector();

        service.handleMessage(
          WINDOW,
          { type: 'intent.invoke', id: 'terminal', request: REQUEST } as NappletMessage,
          c.send,
        );
        await flushPromises();

        expect(c.sent).toEqual([{
          type: 'intent.invoke.result',
          id: 'terminal',
          result: acceptedOutcome().result,
        }]);
      }
    });

    it('normalizes resolver throw or rejection to one structured pre-acceptance result', async () => {
      for (const invoke of [
        vi.fn(() => {
          throw new Error('sync resolver failure');
        }),
        vi.fn(async () => Promise.reject(new Error('async resolver failure'))),
      ]) {
        const resolver = mockResolver({ invoke });
        const service = createIntentService({ resolver });
        service.onRegistered?.(runtimeContext());
        const c = collector();

        service.handleMessage(
          WINDOW,
          { type: 'intent.invoke', id: 'resolver-failed', request: REQUEST } as NappletMessage,
          c.send,
        );
        await flushPromises();

        expect(c.sent).toEqual([{
          type: 'intent.invoke.result',
          id: 'resolver-failed',
          result: { ok: false, error: 'invoke rejected' },
        }]);
      }
    });

    it('passes a resolver structured rejection through without a retained task', async () => {
      const resolver = mockResolver({
        invoke: vi.fn(async () => ({
          result: { ok: false as const, error: 'unsupported convention' },
        })),
      });
      const service = createIntentService({ resolver });
      service.onRegistered?.(runtimeContext());
      const c = collector();

      service.handleMessage(
        WINDOW,
        { type: 'intent.invoke', id: 'unsupported', request: REQUEST } as NappletMessage,
        c.send,
      );
      await flushPromises();

      expect(c.sent).toEqual([{
        type: 'intent.invoke.result',
        id: 'unsupported',
        result: { ok: false, error: 'unsupported convention' },
      }]);
    });
  });

  describe('availability and handler queries', () => {
    it('returns availability and handler snapshots', async () => {
      const resolver = mockResolver();
      const service = createIntentService({ resolver });
      const c = collector();

      service.handleMessage(
        WINDOW,
        { type: 'intent.available', id: 'a1', archetype: 'note' } as NappletMessage,
        c.send,
      );
      service.handleMessage(
        WINDOW,
        { type: 'intent.handlers', id: 'h1' } as NappletMessage,
        c.send,
      );
      await flushPromises();

      expect(c.sent).toEqual([
        { type: 'intent.available.result', id: 'a1', availability: AVAILABILITY },
        { type: 'intent.handlers.result', id: 'h1', handlers: [AVAILABILITY] },
      ]);
    });

    it('keeps infrastructure failures as top-level errors', async () => {
      const resolver = mockResolver({
        available: vi.fn(async () => Promise.reject(new Error('catalog unavailable'))),
        handlers: vi.fn(() => {
          throw new Error('catalog unavailable');
        }),
      });
      const service = createIntentService({ resolver });
      const c = collector();

      service.handleMessage(
        WINDOW,
        { type: 'intent.available', id: 'a2', archetype: 'note' } as NappletMessage,
        c.send,
      );
      service.handleMessage(
        WINDOW,
        { type: 'intent.handlers', id: 'h2' } as NappletMessage,
        c.send,
      );
      await flushPromises();

      expect(c.sent).toEqual([
        { type: 'intent.handlers.result', id: 'h2', error: 'catalog unavailable' },
        { type: 'intent.available.result', id: 'a2', error: 'catalog unavailable' },
      ]);
    });
  });

  describe('intent.changed live-client broadcast', () => {
    it('enumerates current windows without request history and attempts one policy-aware send each', () => {
      const resolver = mockResolver();
      const sendToEligibleNapplet = vi.fn(() => true);
      const listWindowIds = vi.fn(() => Object.freeze(['win-a', 'win-b']));
      const service = createIntentService({ resolver });
      service.onRegistered?.(runtimeContext({ listWindowIds, sendToEligibleNapplet }));

      resolver.emitChanged(AVAILABILITY);

      const changed = { type: 'intent.changed', availability: AVAILABILITY };
      expect(listWindowIds).toHaveBeenCalledOnce();
      expect(sendToEligibleNapplet).toHaveBeenNthCalledWith(1, 'win-a', changed);
      expect(sendToEligibleNapplet).toHaveBeenNthCalledWith(2, 'win-b', changed);
    });

    it('subscribes only while registered and releases attachment state on unregister', () => {
      const unsubscribe = vi.fn();
      let listener: ((availability: IntentAvailability) => void) | undefined;
      const resolver = mockResolver({
        onChanged: vi.fn((next) => {
          listener = next;
          return unsubscribe;
        }),
      });
      const sendToEligibleNapplet = vi.fn(() => true);
      const context = runtimeContext({ sendToEligibleNapplet });
      const service = createIntentService({ resolver });

      expect(resolver.onChanged).not.toHaveBeenCalled();
      service.onRegistered?.(context);
      expect(resolver.onChanged).toHaveBeenCalledOnce();
      listener?.(AVAILABILITY);
      expect(sendToEligibleNapplet).toHaveBeenCalledTimes(2);

      service.onUnregistered?.();
      expect(unsubscribe).toHaveBeenCalledOnce();
      listener?.(AVAILABILITY);
      expect(sendToEligibleNapplet).toHaveBeenCalledTimes(2);
    });
  });

  it('rejects an invalid availability request and silently ignores unknown intent actions', () => {
    const resolver = mockResolver();
    const service = createIntentService({ resolver });
    const c = collector();

    service.handleMessage(
      WINDOW,
      { type: 'intent.available', id: 'bad' } as NappletMessage,
      c.send,
    );
    service.handleMessage(
      WINDOW,
      { type: 'intent.bogus', id: 'unknown' } as NappletMessage,
      c.send,
    );

    expect(c.sent).toEqual([{
      type: 'intent.available.result',
      id: 'bad',
      error: 'invalid archetype',
    }]);
  });
});
