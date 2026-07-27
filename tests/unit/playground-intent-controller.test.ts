import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { IntentRetentionParams } from '@kehto/services';
import { createCatalogIntentResolver } from '@kehto/services';
import { PlaygroundIntentController } from '../../apps/playground/src/playground-intent-controller.js';
import {
  InstalledNappletCatalog,
  matchesInstalledNappletRecord,
} from '../../apps/playground/src/installed-napplet-catalog.js';

const delivery = {
  sender: 'social-feed',
  archetype: 'profile',
  action: 'open',
  convention: 'napplet:profile/open',
  payload: { pubkey: 'a'.repeat(64) },
};

function params(overrides: Partial<IntentRetentionParams> = {}): IntentRetentionParams {
  return { handler: 'profile-viewer', delivery, ...overrides };
}

function installProfile(catalog: InstalledNappletCatalog, dTag = 'profile-viewer'): void {
  catalog.install({
    dTag,
    aggregateHash: `${dTag}-aggregate`,
    requires: ['intent'],
    archetypes: [{ slug: 'profile', convention: 'napplet:profile/open' }],
    indexHtml: '<main>verified</main>',
  }, { name: dTag, containerId: `${dTag}-frame` });
}

describe('PlaygroundIntentController', () => {
  it('freezes retained delivery before an idempotent unstarted task begins', async () => {
    let releaseReady!: () => void;
    const ready = new Promise<void>((resolve) => { releaseReady = resolve; });
    const openOrReuse = vi.fn(() => ({ id: 'profile-generation-1' }));
    const send = vi.fn();
    const controller = new PlaygroundIntentController({
      openOrReuse,
      waitForReady: () => ready,
      isCurrent: () => true,
      send,
    });

    const task = controller.retain(params());
    expect(openOrReuse).not.toHaveBeenCalled();
    const started = task.start();
    expect(task.start()).toBe(started);
    expect(openOrReuse).toHaveBeenCalledOnce();

    releaseReady();
    await started;
    expect(send).toHaveBeenCalledOnce();
  });

  it('retries a replaced target and delivers only once to the current ready generation', async () => {
    const openOrReuse = vi.fn()
      .mockResolvedValueOnce({ id: 'replaced' })
      .mockResolvedValueOnce({ id: 'current' });
    const send = vi.fn();
    const controller = new PlaygroundIntentController({
      openOrReuse,
      waitForReady: vi.fn().mockResolvedValue(undefined),
      isCurrent: (generation) => generation.id === 'current',
      send,
      maxAttempts: 2,
    });

    const task = controller.retain(params());
    await Promise.all([task.start(), task.start()]);

    expect(openOrReuse).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ id: 'current' }, expect.objectContaining(delivery));
  });

  it('does not create an INC delivery route', () => {
    expect(() => new PlaygroundIntentController({
      openOrReuse: () => null,
      waitForReady: () => {},
      isCurrent: () => false,
      send: () => {},
    })).not.toThrow();
  });

  it('fails closed for stale defaults, cancelled or invalid chooser output, and unauthorized explicit targets', async () => {
    const controller = new PlaygroundIntentController({
      openOrReuse: () => ({ id: 'current' }),
      waitForReady: () => {},
      isCurrent: () => true,
      send: () => {},
    });
    const request = {
      archetype: 'profile',
      action: 'open',
      convention: 'napplet:profile/open',
    };
    const invoke = async (chooseHandler: () => string | undefined, handler?: string) => {
      const catalog = new InstalledNappletCatalog();
      installProfile(catalog, 'profile-a');
      installProfile(catalog, 'profile-b');
      catalog.setDefaultHandler('profile', 'removed-profile');
      const resolver = createCatalogIntentResolver({
        loadCatalog: () => catalog.intentCatalog(),
        targets: controller,
        getDefaultHandler: (archetype) => catalog.getDefaultHandler(archetype),
        chooseHandler,
        authorizeExplicitHandler: () => false,
      });
      return resolver.invoke({ ...request, ...(handler === undefined ? {} : { handler }) }, { sender: 'social-feed' });
    };

    await expect(invoke(() => undefined, 'default')).resolves.toMatchObject({
      result: { ok: false, error: 'invoke rejected' },
    });
    await expect(invoke(() => undefined, 'choose')).resolves.toMatchObject({
      result: { ok: false, error: 'user cancelled' },
    });
    await expect(invoke(() => 'not-installed', 'choose')).resolves.toMatchObject({
      result: { ok: false, error: 'invoke rejected' },
    });
    await expect(invoke(() => 'profile-a', 'profile-a')).resolves.toMatchObject({
      result: { ok: false, error: 'invoke rejected' },
    });
  });

  it('composes catalog selection with registered-source readiness and target-only delivery', () => {
    const main = readFileSync(new URL('../../apps/playground/src/main.ts', import.meta.url), 'utf8');
    const shellHost = readFileSync(new URL('../../apps/playground/src/shell-host.ts', import.meta.url), 'utf8');

    expect(main).toContain('createCatalogIntentResolver');
    expect(main).toContain('createIntentService');
    expect(main).toContain('createPlaygroundIntentTargetOptions');
    expect(main).toContain('authorizeExplicitHandler: () => false');
    expect(shellHost).toContain('markIntentTargetReady(windowId, sourceWindow)');
    expect(shellHost).toContain("type: 'intent.deliver'");
    expect(shellHost).not.toContain("type: 'inc.emit'");
  });

  it('does not reuse a same-dTag frame after its installed aggregate is replaced', () => {
    const installed = { dTag: 'profile-viewer', aggregateHash: 'verified-new' };
    const staleLiveFrame = { dTag: 'profile-viewer', aggregateHash: 'verified-old' };
    const shellHost = readFileSync(new URL('../../apps/playground/src/shell-host.ts', import.meta.url), 'utf8');

    expect(matchesInstalledNappletRecord(installed, staleLiveFrame)).toBe(false);
    expect(shellHost).toContain('closeNapplet(stale.windowId)');
    expect(shellHost).toContain('find((info) => matchesInstalledNappletRecord(record, info))');
  });
});
