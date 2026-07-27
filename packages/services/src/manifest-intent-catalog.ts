/**
 * manifest-intent-catalog.ts — signed-manifest → NAP-INTENT catalog adapter.
 *
 * Adapts a resolved NIP-5A/5D napplet manifest's archetype tags into an
 * {@link IntentCatalogEntry} — the shape `createCatalogIntentResolver.loadCatalog`
 * consumes. This lets NAP-INTENT availability and handler candidacy flow from
 * verified manifest tags rather than host-injected catalog data.
 *
 * To avoid a `@kehto/services → @kehto/nip` dependency cycle (services must stay
 * dependency-light and `@kehto/nip` is a lower-level NIP utility), the adapter
 * takes a minimal STRUCTURAL input {@link ManifestArchetypeInput} that the
 * `@kehto/nip/5d` `NappletManifest` satisfies by duck typing — callers pass
 * `resolved.manifest` directly without any package coupling.
 *
 * @packageDocumentation
 */

import type { IntentContract } from '@napplet/core';
import type { IntentArchetypeSupport, IntentCatalogEntry } from './catalog-intent-resolver.js';

/**
 * The structural subset of `@kehto/nip/5d` `NappletManifest` the adapter needs.
 * Intentionally a duck-typed shape so the playground (or any caller) can pass a
 * resolved manifest without importing `@kehto/nip`.
 */
export interface ManifestArchetypeInput {
  /** The napplet's `d` identifier. */
  dTag: string;
  /** Optional human-readable title from the manifest. */
  title?: string;
  /**
   * Ordered convention contracts from the manifest's `archetype` tags.
   */
  archetypes: Array<{ slug: string; convention: string; eventKinds?: number[] }>;
}

function actionFromConvention(slug: string, convention: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new TypeError('manifest archetype slug is invalid');
  }
  const match = /^napplet:([^/?#\s]+)\/([^/?#\s]+)$/.exec(convention);
  if (!match || match[1] !== slug) {
    throw new TypeError('manifest archetype convention is invalid or mismatched');
  }
  return match[2];
}

/**
 * Map a resolved napplet manifest's archetype data into an
 * {@link IntentCatalogEntry}.
 *
 * Each manifest tag remains one ordered contract. Repeated slugs group into one
 * support record while repeated conventions remain distinct contracts; action
 * and convention arrays are stable, deduplicated indexes derived from those
 * contracts.
 *
 * @param manifest - A resolved manifest's structural archetype data.
 * @returns The `IntentCatalogEntry` for `createCatalogIntentResolver`.
 *
 * @example
 * ```ts
 * manifestToIntentCatalogEntry({
 *   dTag: 'profile-viewer',
 *   title: 'Profile',
 *   archetypes: [{ slug: 'profile', convention: 'napplet:profile/open' }],
 * });
 * // → { dTag: 'profile-viewer', title: 'Profile',
 * //     archetypes: { profile: {
 * //       actions: ['open'],
 * //       conventions: ['napplet:profile/open'],
 * //       contracts: [{ convention: 'napplet:profile/open' }],
 * //     } } }
 * ```
 */
export function manifestToIntentCatalogEntry(manifest: ManifestArchetypeInput): IntentCatalogEntry {
  const archetypes: Record<string, IntentArchetypeSupport> = {};
  for (const { slug, convention, eventKinds } of manifest.archetypes) {
    const action = actionFromConvention(slug, convention);
    if (eventKinds?.some((kind) => !Number.isSafeInteger(kind) || kind < 0)) {
      throw new TypeError('manifest archetype event kinds must be unsigned safe integers');
    }
    const support = archetypes[slug] ??= {
      actions: [],
      conventions: [],
      contracts: [],
    };
    const contract: IntentContract = {
      convention,
      ...(eventKinds === undefined || eventKinds.length === 0
        ? {}
        : { eventKinds: [...eventKinds] }),
    };
    support.contracts.push(contract);
    if (!support.actions.includes(action)) support.actions.push(action);
    if (!support.conventions.includes(convention)) support.conventions.push(convention);
  }
  return {
    dTag: manifest.dTag,
    ...(manifest.title === undefined ? {} : { title: manifest.title }),
    archetypes,
  };
}
