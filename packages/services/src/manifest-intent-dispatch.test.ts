/**
 * manifest-intent-dispatch.test.ts — ARCH-04 end-to-end dispatch proof.
 *
 * Exercises the full archetype axis: an archetype-tagged fixture manifest →
 * manifestToIntentCatalogEntry → createCatalogIntentResolver → createIntentService
 * → handleMessage. Asserts intent.available reports the candidate and intent.invoke
 * resolves to it (ok:true, handler === the manifest dTag). The catalog is built
 * from the adapter, NOT stubbed, so this proves the manifest-tag → dispatch path.
 */

import { describe, it, expect } from 'vitest';
import { createIntentService } from './intent-service.js';
import { createCatalogIntentResolver } from './catalog-intent-resolver.js';
import { manifestToIntentCatalogEntry } from './manifest-intent-catalog.js';
import type { NappletMessage } from '@napplet/core';

const WINDOW = 'win-caller';

/** A resolved manifest carrying an archetype tag (the structural input shape). */
const MANIFEST = {
  dTag: 'profile-viewer',
  title: 'Profile Viewer',
  archetypes: [{ slug: 'profile', convention: 'napplet:profile/open' }],
};

function collector() {
  const sent: NappletMessage[] = [];
  return { sent, send: (m: NappletMessage) => { sent.push(m); } };
}

/** Flush microtasks until at least one message is captured (the dispatch chain
 * awaits loadCatalog → selection → target retention across several microtasks). */
async function flushUntilSent(sent: NappletMessage[]): Promise<void> {
  for (let i = 0; i < 20 && sent.length === 0; i++) {
    await Promise.resolve();
  }
}

function buildService() {
  const catalogEntry = manifestToIntentCatalogEntry(MANIFEST);
  const resolver = createCatalogIntentResolver({
    loadCatalog: () => [catalogEntry],
    targets: { retain: () => ({ start() {} }) },
  });
  const service = createIntentService({ resolver });
  service.onRegistered?.({
    resolveDTag: () => 'source-napplet',
    listWindowIds: () => [],
    sendToEligibleNapplet: () => false,
  });
  return service;
}

describe('ARCH-04 manifest → adapter → resolver → dispatch', () => {
  it('intent.available reports the archetype-tagged candidate', async () => {
    const svc = buildService();
    const c = collector();
    svc.handleMessage(
      WINDOW,
      { type: 'intent.available', id: 'a1', archetype: 'profile' } as NappletMessage,
      c.send,
    );
    await flushUntilSent(c.sent);
    expect(c.sent).toHaveLength(1);
    const msg = c.sent[0] as NappletMessage & { availability?: { available: boolean; candidates: { dTag: string }[] } };
    expect(msg.type).toBe('intent.available.result');
    expect(msg.availability?.available).toBe(true);
    expect(msg.availability?.candidates.map((x) => x.dTag)).toContain('profile-viewer');
  });

  it('intent.invoke resolves to the candidate (ok:true, handler === dTag)', async () => {
    const svc = buildService();
    const c = collector();
    svc.handleMessage(
      WINDOW,
      {
        type: 'intent.invoke',
        id: 'i1',
        request: {
          archetype: 'profile',
          action: 'open',
          convention: 'napplet:profile/open',
        },
      } as NappletMessage,
      c.send,
    );
    await flushUntilSent(c.sent);
    expect(c.sent).toHaveLength(1);
    const msg = c.sent[0] as NappletMessage & { result?: { ok: boolean; handler?: string } };
    expect(msg.type).toBe('intent.invoke.result');
    expect(msg.result?.ok).toBe(true);
    expect(msg.result?.handler).toBe('profile-viewer');
  });
});
