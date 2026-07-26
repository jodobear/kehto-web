/**
 * manifest-intent-catalog.test.ts — manifestToIntentCatalogEntry adapter.
 *
 * Covers lossless repeated convention contracts, derived quick indexes, empty
 * archetypes, and title passthrough/omission.
 */

import { describe, it, expect } from 'vitest';
import { manifestToIntentCatalogEntry } from './manifest-intent-catalog.js';

describe('manifestToIntentCatalogEntry', () => {
  it('maps a convention to one authoritative contract and derived indexes', () => {
    const entry = manifestToIntentCatalogEntry({
      dTag: 'profile-viewer',
      title: 'Profile',
      archetypes: [{ slug: 'profile', convention: 'napplet:profile/open' }],
    });
    expect(entry).toEqual({
      dTag: 'profile-viewer',
      title: 'Profile',
      archetypes: {
        profile: {
          actions: ['open'],
          conventions: ['napplet:profile/open'],
          contracts: [{ convention: 'napplet:profile/open' }],
        },
      },
    });
  });

  it('groups repeated actions under one slug without overwriting contracts', () => {
    const entry = manifestToIntentCatalogEntry({
      dTag: 'profile-tools',
      archetypes: [
        { slug: 'profile', convention: 'napplet:profile/open', eventKinds: [0] },
        { slug: 'profile', convention: 'napplet:profile/edit', eventKinds: [0, 10002] },
      ],
    });
    expect(entry.archetypes.profile).toEqual({
      actions: ['open', 'edit'],
      conventions: ['napplet:profile/open', 'napplet:profile/edit'],
      contracts: [
        { convention: 'napplet:profile/open', eventKinds: [0] },
        { convention: 'napplet:profile/edit', eventKinds: [0, 10002] },
      ],
    });
  });

  it('retains duplicate convention records with distinct kind scopes while deduplicating indexes', () => {
    const entry = manifestToIntentCatalogEntry({
      dTag: 'note-viewer',
      archetypes: [
        { slug: 'note', convention: 'napplet:note/open', eventKinds: [1] },
        { slug: 'note', convention: 'napplet:note/open', eventKinds: [30023] },
      ],
    });
    expect(entry.archetypes.note).toEqual({
      actions: ['open'],
      conventions: ['napplet:note/open'],
      contracts: [
        { convention: 'napplet:note/open', eventKinds: [1] },
        { convention: 'napplet:note/open', eventKinds: [30023] },
      ],
    });
  });

  it('maps multiple archetypes to multiple keyed supports', () => {
    const entry = manifestToIntentCatalogEntry({
      dTag: 'multi',
      archetypes: [
        { slug: 'profile', convention: 'napplet:profile/open' },
        { slug: 'feed', convention: 'napplet:feed/open' },
      ],
    });
    expect(entry.archetypes).toEqual({
      profile: {
        actions: ['open'],
        conventions: ['napplet:profile/open'],
        contracts: [{ convention: 'napplet:profile/open' }],
      },
      feed: {
        actions: ['open'],
        conventions: ['napplet:feed/open'],
        contracts: [{ convention: 'napplet:feed/open' }],
      },
    });
  });

  it('maps empty archetypes to archetypes:{}', () => {
    const entry = manifestToIntentCatalogEntry({ dTag: 'bare', archetypes: [] });
    expect(entry.archetypes).toEqual({});
  });

  it('omits title when absent (no title key emitted)', () => {
    const entry = manifestToIntentCatalogEntry({ dTag: 'no-title', archetypes: [] });
    expect('title' in entry).toBe(false);
  });

  it('passes title through when present', () => {
    const entry = manifestToIntentCatalogEntry({ dTag: 't', title: 'Titled', archetypes: [] });
    expect(entry.title).toBe('Titled');
  });

  it.each([
    ['mismatched slug', { slug: 'profile', convention: 'napplet:note/open' }],
    ['query-bearing convention', { slug: 'profile', convention: 'napplet:profile/open?x=1' }],
    ['numbered protocol', { slug: 'profile', convention: 'NAP-1' }],
  ])('does not invent support for %s', (_name, archetype) => {
    expect(() => manifestToIntentCatalogEntry({
      dTag: 'invalid',
      archetypes: [archetype],
    })).toThrow();
  });
});
