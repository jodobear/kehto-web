/**
 * catalog-intent-resolver.test.ts — exact NAP-INTENT catalog resolution.
 *
 * Exercises installed-manifest compatibility, user defaults and chooser policy,
 * explicit-handler authorization, availability, and catalog change reporting.
 */

import { describe, it, expect, vi } from 'vitest';
import { createCatalogIntentResolver } from './catalog-intent-resolver.js';
import type {
  CatalogIntentResolver,
  CatalogIntentResolverOptions,
  IntentCatalogEntry,
  IntentRetentionParams,
} from './catalog-intent-resolver.js';
import type { IntentRequest, IntentResult } from './intent-types.js';

const NOTE_OPEN = 'napplet:note/open';
const NOTE_EDIT = 'napplet:note/edit';
const EMOJI_OPEN = 'napplet:emoji-list/open';

const CATALOG: IntentCatalogEntry[] = [
  {
    dTag: 'noteview',
    title: 'Note',
    archetypes: {
      note: {
        actions: ['open', 'edit'],
        conventions: [NOTE_OPEN, NOTE_EDIT],
        contracts: [
          { convention: NOTE_OPEN, eventKinds: [1, 30023] },
          { convention: NOTE_EDIT, eventKinds: [30023] },
        ],
      },
    },
  },
  {
    dTag: 'notealt',
    title: 'Alt Note',
    archetypes: {
      note: {
        actions: ['open'],
        conventions: [NOTE_OPEN],
        contracts: [{ convention: NOTE_OPEN }],
      },
    },
  },
  {
    dTag: 'noteprefix',
    title: 'Prefix Note',
    archetypes: {
      note: {
        actions: ['open-long'],
        conventions: ['napplet:note/open-long'],
        contracts: [{ convention: 'napplet:note/open-long' }],
      },
    },
  },
  {
    dTag: 'emojilistr',
    title: 'Emoji',
    archetypes: {
      'emoji-list': {
        actions: ['open'],
        conventions: [EMOJI_OPEN],
        contracts: [{ convention: EMOJI_OPEN }],
      },
    },
  },
];

const NOTE_REQUEST: IntentRequest = {
  archetype: 'note',
  action: 'open',
  convention: NOTE_OPEN,
};

function makeResolver(opts: Partial<CatalogIntentResolverOptions> = {}) {
  const retainCalls: IntentRetentionParams[] = [];
  const retained = { start: vi.fn() };
  const targets = {
    retain: vi.fn((params: IntentRetentionParams) => {
      retainCalls.push(params);
      return retained;
    }),
  };
  const resolver = createCatalogIntentResolver({
    loadCatalog: () => CATALOG,
    targets,
    ...opts,
  });
  return { resolver, targets, retainCalls, retained };
}

async function invokeResult(
  resolver: CatalogIntentResolver,
  request: IntentRequest,
  sender = 'caller',
): Promise<IntentResult> {
  return (await resolver.invoke(request, { sender })).result;
}

describe('createCatalogIntentResolver', () => {
  it('throws when loadCatalog is missing', () => {
    // @ts-expect-error — exercising the runtime guard
    expect(() => createCatalogIntentResolver({ targets: { retain: () => ({ start() {} }) } })).toThrow(
      /loadCatalog is required/,
    );
  });

  it('throws when the target controller is missing', () => {
    // @ts-expect-error — exercising the runtime guard
    expect(() => createCatalogIntentResolver({ loadCatalog: () => [] })).toThrow(/targets is required/);
  });

  describe('compatible selection policy', () => {
    it('returns no handler when the archetype has no installed candidate', async () => {
      const { resolver } = makeResolver();
      const result = await invokeResult(
        resolver,
        { archetype: 'missing', action: 'open', convention: 'napplet:missing/open' },
      );
      expect(result).toEqual({ ok: false, error: 'no handler' });
    });

    it('returns unsupported convention when installed candidates have no exact contract', async () => {
      const { resolver, targets } = makeResolver();
      const nearMatches = [
        'napplet:note/open?kind=1',
        'napplet:note/open#fragment',
        'napplet:note/open/',
        'napplet:note/op',
      ];
      for (const convention of nearMatches) {
        const result = await invokeResult(
          resolver,
          { ...NOTE_REQUEST, convention },
        );
        expect(result).toEqual({ ok: false, error: 'unsupported convention' });
      }
      expect(targets.retain).not.toHaveBeenCalled();
    });

    it('uses a compatible user default and ignores an incompatible default', async () => {
      const getDefaultHandler = vi.fn(() => 'notealt');
      const { resolver } = makeResolver({ getDefaultHandler });
      await expect(invokeResult(resolver, NOTE_REQUEST)).resolves.toMatchObject({
        ok: true,
        handler: 'notealt',
      });

      const incompatible = makeResolver({ getDefaultHandler: () => 'noteprefix' });
      await expect(
        invokeResult(incompatible.resolver, { ...NOTE_REQUEST, convention: NOTE_EDIT, action: 'edit' }),
      ).resolves.toMatchObject({ ok: true, handler: 'noteview' });
    });

    it('selects the sole compatible candidate without requiring it to be running', async () => {
      const { resolver } = makeResolver();
      const result = await invokeResult(
        resolver,
        { ...NOTE_REQUEST, action: 'edit', convention: NOTE_EDIT },
      );
      expect(result).toMatchObject({ ok: true, handler: 'noteview' });
    });

    it('uses a chooser for ambiguity and never falls back to catalog order', async () => {
      const noPolicy = makeResolver();
      await expect(invokeResult(noPolicy.resolver, NOTE_REQUEST)).resolves.toEqual({
        ok: false,
        error: 'invoke rejected',
      });

      const chooseHandler = vi.fn(() => 'notealt');
      const withPolicy = makeResolver({ chooseHandler });
      await expect(invokeResult(withPolicy.resolver, NOTE_REQUEST)).resolves.toMatchObject({
        ok: true,
        handler: 'notealt',
      });
      expect(chooseHandler).toHaveBeenCalledWith(
        'note',
        expect.arrayContaining([
          expect.objectContaining({ dTag: 'noteview' }),
          expect.objectContaining({ dTag: 'notealt' }),
        ]),
        'caller',
      );
    });

    it('always invokes the chooser for an explicit choose preference', async () => {
      const chooseHandler = vi.fn(() => 'notealt');
      const { resolver } = makeResolver({
        getDefaultHandler: () => 'noteview',
        chooseHandler,
      });
      await expect(
        invokeResult(resolver, { ...NOTE_REQUEST, handler: 'choose' }),
      ).resolves.toMatchObject({ ok: true, handler: 'notealt' });
      expect(chooseHandler).toHaveBeenCalledOnce();
    });

    it('reports user cancelled when the chooser returns no candidate', async () => {
      const { resolver } = makeResolver({ chooseHandler: () => undefined });
      await expect(
        invokeResult(resolver, { ...NOTE_REQUEST, handler: 'choose' }),
      ).resolves.toEqual({ ok: false, error: 'user cancelled' });
    });

    it('revalidates chooser and default outputs against the compatible set', async () => {
      const invalidChoice = makeResolver({ chooseHandler: () => 'noteprefix' });
      await expect(
        invokeResult(invalidChoice.resolver, { ...NOTE_REQUEST, handler: 'choose' }),
      ).resolves.toEqual({ ok: false, error: 'invoke rejected' });

      const explicitDefault = makeResolver({ getDefaultHandler: () => 'noteprefix' });
      await expect(
        invokeResult(explicitDefault.resolver, { ...NOTE_REQUEST, handler: 'default' }),
      ).resolves.toEqual({ ok: false, error: 'invoke rejected' });
    });

    it('requires positive explicit-handler authorization after compatibility', async () => {
      const missingPolicy = makeResolver();
      await expect(
        invokeResult(missingPolicy.resolver, { ...NOTE_REQUEST, handler: 'notealt' }),
      ).resolves.toEqual({ ok: false, error: 'invoke rejected' });

      const deny = vi.fn(() => false);
      const denied = makeResolver({ authorizeExplicitHandler: deny });
      await expect(
        invokeResult(denied.resolver, { ...NOTE_REQUEST, handler: 'notealt' }),
      ).resolves.toEqual({ ok: false, error: 'invoke rejected' });

      const allow = vi.fn(() => true);
      const authorized = makeResolver({ authorizeExplicitHandler: allow });
      await expect(
        invokeResult(authorized.resolver, { ...NOTE_REQUEST, handler: 'notealt' }),
      ).resolves.toMatchObject({ ok: true, handler: 'notealt' });
      expect(allow).toHaveBeenCalledWith(
        'caller',
        'notealt',
        expect.objectContaining(NOTE_REQUEST),
        expect.objectContaining({ dTag: 'notealt' }),
      );
    });

    it('rejects an explicit handler that is absent or convention-incompatible before authorization', async () => {
      const authorizeExplicitHandler = vi.fn(() => true);
      const { resolver, targets } = makeResolver({ authorizeExplicitHandler });
      for (const handler of ['missing', 'noteprefix', 'emojilistr']) {
        await expect(
          invokeResult(resolver, { ...NOTE_REQUEST, handler }),
        ).resolves.toEqual({ ok: false, error: 'invoke rejected' });
      }
      expect(authorizeExplicitHandler).not.toHaveBeenCalled();
      expect(targets.retain).not.toHaveBeenCalled();
    });

    it('does not infer compatibility from action, event-kind-like payload, convention, or target payload fields', async () => {
      const { resolver, targets } = makeResolver({
        getDefaultHandler: () => 'noteview',
      });
      const result = await invokeResult(
        resolver,
        {
          ...NOTE_REQUEST,
          convention: 'napplet:note/unknown',
          payload: {
            action: 'open',
            convention: NOTE_OPEN,
            eventKind: 1,
            kind: 30023,
            handler: 'noteview',
            target: 'noteview',
          },
        },
      );
      expect(result).toEqual({ ok: false, error: 'unsupported convention' });
      expect(targets.retain).not.toHaveBeenCalled();
    });
  });

  describe('retained delivery responsibility', () => {
    it('retains one immutable exact target delivery before returning acceptance', async () => {
      const sequence: string[] = [];
      const retained = {
        start: vi.fn(() => {
          sequence.push('start');
        }),
      };
      const retain = vi.fn((params: IntentRetentionParams) => {
        sequence.push('retain');
        expect(Object.isFrozen(params)).toBe(true);
        expect(Object.isFrozen(params.delivery)).toBe(true);
        expect(Object.isFrozen(params.behavior)).toBe(true);
        return retained;
      });
      const resolver = createCatalogIntentResolver({
        loadCatalog: () => CATALOG,
        targets: { retain },
        getDefaultHandler: () => 'noteview',
      });
      const payload = { event: { kind: 1 }, targetWindowId: 'forged' };
      const outcome = await resolver.invoke(
        {
          ...NOTE_REQUEST,
          payload,
          behavior: { focus: true, reuse: false },
        },
        { sender: 'source-dtag' },
      );

      expect(sequence).toEqual(['retain']);
      expect(retain).toHaveBeenCalledWith({
        handler: 'noteview',
        delivery: {
          sender: 'source-dtag',
          archetype: 'note',
          action: 'open',
          convention: NOTE_OPEN,
          payload,
        },
        behavior: { focus: true, reuse: false },
      });
      expect(outcome).toEqual({
        result: {
          ok: true,
          archetype: 'note',
          action: 'open',
          convention: NOTE_OPEN,
          handler: 'noteview',
        },
        retained,
      });
      expect(retained.start).not.toHaveBeenCalled();

      const params = retain.mock.calls[0][0] as unknown as Record<string, unknown>;
      expect(params).not.toHaveProperty('windowId');
      expect(params).not.toHaveProperty('sourceWindowId');
      expect(params).not.toHaveProperty('targetWindowId');
      expect(params).not.toHaveProperty('protocol');
      expect(params).not.toHaveProperty('handled');
      expect(params.delivery).not.toHaveProperty('id');
      expect(params.delivery).not.toHaveProperty('protocol');
      expect(params.delivery).not.toHaveProperty('handled');
    });

    it('copies canonical delivery fields instead of retaining mutable request routing', async () => {
      const { resolver, retainCalls } = makeResolver({
        getDefaultHandler: () => 'noteview',
      });
      const request: IntentRequest = {
        ...NOTE_REQUEST,
        payload: { value: 1 },
        behavior: { focus: true },
      };
      await resolver.invoke(request, { sender: 'source-dtag' });
      request.archetype = 'forged';
      request.action = 'forged';
      request.convention = 'napplet:forged/forged';
      request.behavior!.focus = false;

      expect(retainCalls[0].delivery).toMatchObject({
        sender: 'source-dtag',
        archetype: 'note',
        action: 'open',
        convention: NOTE_OPEN,
        payload: { value: 1 },
      });
      expect(retainCalls[0].behavior).toEqual({ focus: true });
    });

    it('returns a structured pre-acceptance rejection when retention fails', async () => {
      const targets = {
        retain: vi.fn(() => {
          throw new Error('target unavailable');
        }),
      };
      const resolver = createCatalogIntentResolver({
        loadCatalog: () => CATALOG,
        targets,
        getDefaultHandler: () => 'noteview',
      });

      await expect(resolver.invoke(NOTE_REQUEST, { sender: 'caller' })).resolves.toEqual({
        result: { ok: false, error: 'invoke rejected' },
      });
      expect(targets.retain).toHaveBeenCalledOnce();
    });

    it('awaits asynchronous retention and never starts the returned task', async () => {
      let release!: (value: { start(): void }) => void;
      const retained = { start: vi.fn() };
      const pending = new Promise<{ start(): void }>((resolve) => {
        release = resolve;
      });
      const resolver = createCatalogIntentResolver({
        loadCatalog: () => CATALOG,
        targets: { retain: () => pending },
        getDefaultHandler: () => 'noteview',
      });
      let settled = false;
      const outcome = Promise.resolve(resolver.invoke(NOTE_REQUEST, { sender: 'caller' })).then((value) => {
        settled = true;
        return value;
      });

      await Promise.resolve();
      expect(settled).toBe(false);
      release(retained);
      await expect(outcome).resolves.toMatchObject({ result: { ok: true }, retained });
      expect(retained.start).not.toHaveBeenCalled();
    });
  });

  describe('available / handlers', () => {
    it('reports every installed contract candidate and compatible default metadata', async () => {
      const { resolver } = makeResolver({ getDefaultHandler: () => 'noteview' });
      const availability = await resolver.available('note');
      expect(availability).toEqual({
        archetype: 'note',
        available: true,
        candidates: [
          {
            dTag: 'noteview',
            title: 'Note',
            actions: ['open', 'edit'],
            conventions: [NOTE_OPEN, NOTE_EDIT],
            contracts: [
              { convention: NOTE_OPEN, eventKinds: [1, 30023] },
              { convention: NOTE_EDIT, eventKinds: [30023] },
            ],
            isDefault: true,
          },
          {
            dTag: 'notealt',
            title: 'Alt Note',
            actions: ['open'],
            conventions: [NOTE_OPEN],
            contracts: [{ convention: NOTE_OPEN }],
          },
          {
            dTag: 'noteprefix',
            title: 'Prefix Note',
            actions: ['open-long'],
            conventions: ['napplet:note/open-long'],
            contracts: [{ convention: 'napplet:note/open-long' }],
          },
        ],
        hasDefault: true,
      });
    });

    it('reports unavailable for an unknown archetype', async () => {
      const { resolver } = makeResolver();
      await expect(resolver.available('nope')).resolves.toEqual({
        archetype: 'nope',
        available: false,
        candidates: [],
        hasDefault: false,
      });
    });

    it('lists availability for every archetype in the catalog', async () => {
      const { resolver } = makeResolver();
      const all = await resolver.handlers();
      expect(all.map((availability) => availability.archetype).sort()).toEqual(['emoji-list', 'note']);
    });
  });

  describe('onChanged / notifyChanged', () => {
    it('notifies subscribed listeners with recomputed availability', async () => {
      const { resolver } = makeResolver({ getDefaultHandler: () => 'noteview' });
      const seen: string[] = [];
      resolver.onChanged?.((availability) => seen.push(availability.archetype));
      resolver.notifyChanged('note');
      await Promise.resolve();
      await Promise.resolve();
      expect(seen).toEqual(['note']);
    });

    it('stops notifying after unsubscribe', async () => {
      const { resolver } = makeResolver();
      const seen: string[] = [];
      const unsubscribe = resolver.onChanged!((availability) => seen.push(availability.archetype));
      unsubscribe();
      resolver.notifyChanged('note');
      await Promise.resolve();
      await Promise.resolve();
      expect(seen).toEqual([]);
    });
  });
});
