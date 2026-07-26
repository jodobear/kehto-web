/**
 * catalog-intent-resolver.test.ts — exact NAP-INTENT catalog resolution.
 *
 * Exercises installed-manifest compatibility, user defaults and chooser policy,
 * explicit-handler authorization, availability, and catalog change reporting.
 */

import { describe, it, expect, vi } from 'vitest';
import { createCatalogIntentResolver } from './catalog-intent-resolver.js';
import type {
  CatalogIntentResolverOptions,
  IntentCatalogEntry,
  IntentOpenParams,
} from './catalog-intent-resolver.js';
import type { IntentRequest } from './intent-types.js';

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
  const openCalls: IntentOpenParams[] = [];
  const windows = {
    open: vi.fn((params: IntentOpenParams) => {
      openCalls.push(params);
      return { windowId: `win-${params.dTag}` };
    }),
  };
  const resolver = createCatalogIntentResolver({
    loadCatalog: () => CATALOG,
    windows,
    ...opts,
  });
  return { resolver, windows, openCalls };
}

describe('createCatalogIntentResolver', () => {
  it('throws when loadCatalog is missing', () => {
    // @ts-expect-error — exercising the runtime guard
    expect(() => createCatalogIntentResolver({ windows: { open: () => ({ windowId: 'w' }) } })).toThrow(
      /loadCatalog is required/,
    );
  });

  it('throws when the target controller is missing', () => {
    // @ts-expect-error — exercising the runtime guard
    expect(() => createCatalogIntentResolver({ loadCatalog: () => [] })).toThrow(/windows is required/);
  });

  describe('compatible selection policy', () => {
    it('returns no handler when the archetype has no installed candidate', async () => {
      const { resolver } = makeResolver();
      const result = await resolver.invoke(
        { archetype: 'missing', action: 'open', convention: 'napplet:missing/open' },
        { sender: 'caller' },
      );
      expect(result).toEqual({ ok: false, error: 'no handler' });
    });

    it('returns unsupported convention when installed candidates have no exact contract', async () => {
      const { resolver, windows } = makeResolver();
      const nearMatches = [
        'napplet:note/open?kind=1',
        'napplet:note/open#fragment',
        'napplet:note/open/',
        'napplet:note/op',
      ];
      for (const convention of nearMatches) {
        const result = await resolver.invoke(
          { ...NOTE_REQUEST, convention },
          { sender: 'caller' },
        );
        expect(result).toEqual({ ok: false, error: 'unsupported convention' });
      }
      expect(windows.open).not.toHaveBeenCalled();
    });

    it('uses a compatible user default and ignores an incompatible default', async () => {
      const getDefaultHandler = vi.fn(() => 'notealt');
      const { resolver } = makeResolver({ getDefaultHandler });
      await expect(resolver.invoke(NOTE_REQUEST, { sender: 'caller' })).resolves.toMatchObject({
        ok: true,
        handler: 'notealt',
      });

      const incompatible = makeResolver({ getDefaultHandler: () => 'noteprefix' });
      await expect(
        incompatible.resolver.invoke({ ...NOTE_REQUEST, convention: NOTE_EDIT, action: 'edit' }, { sender: 'caller' }),
      ).resolves.toMatchObject({ ok: true, handler: 'noteview' });
    });

    it('selects the sole compatible candidate without requiring it to be running', async () => {
      const { resolver } = makeResolver();
      const result = await resolver.invoke(
        { ...NOTE_REQUEST, action: 'edit', convention: NOTE_EDIT },
        { sender: 'caller' },
      );
      expect(result).toMatchObject({ ok: true, handler: 'noteview' });
    });

    it('uses a chooser for ambiguity and never falls back to catalog order', async () => {
      const noPolicy = makeResolver();
      await expect(noPolicy.resolver.invoke(NOTE_REQUEST, { sender: 'caller' })).resolves.toEqual({
        ok: false,
        error: 'invoke rejected',
      });

      const chooseHandler = vi.fn(() => 'notealt');
      const withPolicy = makeResolver({ chooseHandler });
      await expect(withPolicy.resolver.invoke(NOTE_REQUEST, { sender: 'caller' })).resolves.toMatchObject({
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
        resolver.invoke({ ...NOTE_REQUEST, handler: 'choose' }, { sender: 'caller' }),
      ).resolves.toMatchObject({ ok: true, handler: 'notealt' });
      expect(chooseHandler).toHaveBeenCalledOnce();
    });

    it('reports user cancelled when the chooser returns no candidate', async () => {
      const { resolver } = makeResolver({ chooseHandler: () => undefined });
      await expect(
        resolver.invoke({ ...NOTE_REQUEST, handler: 'choose' }, { sender: 'caller' }),
      ).resolves.toEqual({ ok: false, error: 'user cancelled' });
    });

    it('revalidates chooser and default outputs against the compatible set', async () => {
      const invalidChoice = makeResolver({ chooseHandler: () => 'noteprefix' });
      await expect(
        invalidChoice.resolver.invoke({ ...NOTE_REQUEST, handler: 'choose' }, { sender: 'caller' }),
      ).resolves.toEqual({ ok: false, error: 'invoke rejected' });

      const explicitDefault = makeResolver({ getDefaultHandler: () => 'noteprefix' });
      await expect(
        explicitDefault.resolver.invoke({ ...NOTE_REQUEST, handler: 'default' }, { sender: 'caller' }),
      ).resolves.toEqual({ ok: false, error: 'invoke rejected' });
    });

    it('requires positive explicit-handler authorization after compatibility', async () => {
      const missingPolicy = makeResolver();
      await expect(
        missingPolicy.resolver.invoke({ ...NOTE_REQUEST, handler: 'notealt' }, { sender: 'caller' }),
      ).resolves.toEqual({ ok: false, error: 'invoke rejected' });

      const deny = vi.fn(() => false);
      const denied = makeResolver({ authorizeExplicitHandler: deny });
      await expect(
        denied.resolver.invoke({ ...NOTE_REQUEST, handler: 'notealt' }, { sender: 'caller' }),
      ).resolves.toEqual({ ok: false, error: 'invoke rejected' });

      const allow = vi.fn(() => true);
      const authorized = makeResolver({ authorizeExplicitHandler: allow });
      await expect(
        authorized.resolver.invoke({ ...NOTE_REQUEST, handler: 'notealt' }, { sender: 'caller' }),
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
      const { resolver, windows } = makeResolver({ authorizeExplicitHandler });
      for (const handler of ['missing', 'noteprefix', 'emojilistr']) {
        await expect(
          resolver.invoke({ ...NOTE_REQUEST, handler }, { sender: 'caller' }),
        ).resolves.toEqual({ ok: false, error: 'invoke rejected' });
      }
      expect(authorizeExplicitHandler).not.toHaveBeenCalled();
      expect(windows.open).not.toHaveBeenCalled();
    });

    it('does not infer compatibility from action, event-kind-like payload, convention, or target payload fields', async () => {
      const { resolver, windows } = makeResolver({
        getDefaultHandler: () => 'noteview',
      });
      const result = await resolver.invoke(
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
        { sender: 'caller' },
      );
      expect(result).toEqual({ ok: false, error: 'unsupported convention' });
      expect(windows.open).not.toHaveBeenCalled();
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
