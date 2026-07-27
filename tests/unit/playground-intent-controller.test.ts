import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { IntentRetentionParams } from '@kehto/services';
import { createCatalogIntentResolver } from '@kehto/services';
import { PlaygroundIntentController } from '../../apps/playground/src/playground-intent-controller.js';
import {
  bootShell,
  createPlaygroundIntentTargetOptions,
  getInstalledNappletCatalog,
  getNapplets,
  markIntentTargetReady,
} from '../../apps/playground/src/shell-host.js';
import { originRegistry, type ShellEnvironment } from '@kehto/shell';
import type { NappletInfo } from '../../apps/playground/src/shell-host.js';
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

function installProfile(
  catalog: InstalledNappletCatalog,
  dTag = 'profile-viewer',
  aggregateHash = `${dTag}-aggregate`,
) {
  return catalog.install({
    dTag,
    aggregateHash,
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

  it('rejects non-finite maxAttempts and bounds finite attempt limits', async () => {
    const callbacks = {
      openOrReuse: vi.fn(() => null),
      waitForReady: () => undefined,
      isCurrent: () => false,
      send: () => {},
    };

    for (const value of [Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new PlaygroundIntentController({ ...callbacks, maxAttempts: value }))
        .toThrow('maxAttempts must be finite');
    }

    for (const value of [0, -1]) {
      const normalized = new PlaygroundIntentController({ ...callbacks, maxAttempts: value });
      await normalized.retain(params()).start();
      expect(callbacks.openOrReuse).toHaveBeenCalledTimes(1);
      callbacks.openOrReuse.mockClear();
    }

    const bounded = new PlaygroundIntentController({ ...callbacks, maxAttempts: 999 });
    await bounded.retain(params()).start();
    expect(callbacks.openOrReuse).toHaveBeenCalledTimes(10);
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

  it('abandons a held cold resolution after its selected installed record is replaced', async () => {
    const catalog = new InstalledNappletCatalog();
    const selected = installProfile(catalog, 'profile-viewer', 'aggregate-a');
    let releaseResolution!: (identity: { dTag: string; aggregateHash: string }) => void;
    const resolution = new Promise<{ dTag: string; aggregateHash: string }>((resolve) => {
      releaseResolution = resolve;
    });
    const send = vi.fn();
    const onTerminal = vi.fn();
    let attempts = 0;
    const controller = new PlaygroundIntentController({
      openOrReuse: async () => {
        attempts += 1;
        if (attempts !== 1) return null;
        const resolved = await resolution;
        return catalog.useIfCurrent(selected, resolved) ? { id: 'aggregate-a' } : null;
      },
      waitForReady: () => undefined,
      isCurrent: () => true,
      send,
      maxAttempts: 2,
      onTerminal,
    });

    const deliveryTask = controller.retain(params()).start();
    await Promise.resolve();
    installProfile(catalog, 'profile-viewer', 'aggregate-b');
    releaseResolution({ dTag: 'profile-viewer', aggregateHash: 'aggregate-a' });
    await deliveryTask;

    expect(catalog.get('profile-viewer')).toMatchObject({ aggregateHash: 'aggregate-b' });
    expect(send).not.toHaveBeenCalled();
    expect(attempts).toBe(2);
    expect(onTerminal).toHaveBeenCalledWith(expect.objectContaining({ handler: 'profile-viewer' }), 'open-failed');

    const shellHost = readFileSync(new URL('../../apps/playground/src/shell-host.ts', import.meta.url), 'utf8');
    expect(shellHost).toContain('installInCatalog: false');
    expect(shellHost).toContain('acceptResolved: (identity) => installedNapplets.useIfCurrent(record, identity) !== null');
  });

  it('rejects unready stale records and delivers only to live B after catalog replacement', async () => {
    const priorWindow = globalThis.window;
    const addEventListener = vi.fn();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { addEventListener, location: { search: '' } },
    });
    const catalog = getInstalledNappletCatalog();
    const napplets = getNapplets();
    const dTag = 'profile-viewer';
    const makeLive = (windowId: string, aggregateHash: string) => {
      const source = { postMessage: vi.fn() } as unknown as Window;
      const info: NappletInfo = {
        windowId,
        name: dTag,
        iframe: { contentWindow: source, remove: vi.fn() } as unknown as HTMLIFrameElement,
        dTag,
        aggregateHash,
        environment: {} as ShellEnvironment,
        identityBound: true,
      };
      napplets.set(windowId, info);
      originRegistry.register(source, windowId, { dTag, aggregateHash });
      return { info, source };
    };

    try {
      bootShell();
      catalog.remove(dTag);
      napplets.clear();
      const sourceA = makeLive('intent-a', 'aggregate-a');
      installProfile(catalog, dTag, 'aggregate-a');
      const controller = new PlaygroundIntentController({
        ...createPlaygroundIntentTargetOptions(),
        maxAttempts: 3,
      });
      const task = controller.retain(params()).start();
      await Promise.resolve();

      // An equal reinstallation changes the record-reference token and must
      // proactively reject A's readiness promise, even without shell.ready.
      installProfile(catalog, dTag, 'aggregate-a');
      for (let turn = 0; turn < 4; turn += 1) await Promise.resolve();
      const sourceB = makeLive('intent-b', 'aggregate-b');
      installProfile(catalog, dTag, 'aggregate-b');
      for (let turn = 0; turn < 4; turn += 1) await Promise.resolve();
      markIntentTargetReady(sourceB.info.windowId, sourceB.source);
      await task;

      expect(catalog.get(dTag)).toMatchObject({ aggregateHash: 'aggregate-b' });
      expect((sourceA.source as unknown as { postMessage: ReturnType<typeof vi.fn> }).postMessage).not.toHaveBeenCalled();
      expect((sourceB.source as unknown as { postMessage: ReturnType<typeof vi.fn> }).postMessage).toHaveBeenCalledTimes(1);
      expect((sourceB.source as unknown as { postMessage: ReturnType<typeof vi.fn> }).postMessage)
        .toHaveBeenCalledWith(expect.objectContaining({ type: 'intent.deliver' }), '*', undefined);
    } finally {
      catalog.remove(dTag);
      napplets.clear();
      originRegistry.clear();
      Object.defineProperty(globalThis, 'window', { configurable: true, value: priorWindow });
    }
  });
});
