import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { computeAggregateHash } from '../../packages/nip/dist/5a/index.js';
import { NAPPLET_KIND_NAMED } from '../../packages/nip/dist/5d/index.js';
import { finalizeEvent } from 'nostr-tools/pure';
import { naddrEncode } from 'nostr-tools/nip19';
import {
  createPajaRuntimeHostConfig,
  normalizePajaSimulation,
  renderPajaHtml,
  type PajaHostConfig,
} from '../../packages/paja/dist/index.js';

const LIVE_NADDR = 'naddr1qqxxwmm0vskk6mmjde5kueczyqnxs90qeyssm73jf3kt5dtnk997ujw6ggy6j3t0jjzw2yrv6sy22qcyqqqgjwgpz4mhxue69uhhyetvv9ujuerfw36x7tnsw43qzd3wc3';
const LIVE_EVENT_ID = 'f39dfca7dbaeacbddf294977c5654c912fced30d8b839b32a1910a988ccc1f5a';
const LIVE_AGGREGATE = 'c922cf30dc1e12b135462057631ba3017cdaeea591725f077c5a20a6d9967b68';
const classOnePrefix = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:;";
const classOneSuffix = "worker-src 'none'; child-src 'none'; frame-src 'none'; media-src 'none'; object-src 'none'; manifest-src 'none'; prefetch-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";

interface PointerServer {
  readonly url: string;
  readonly blobs: Map<string, Buffer>;
  setConfig(config: PajaHostConfig): void;
  close(): Promise<void>;
}

test('keeps the zero-tab pointer state readable, bounded, and keyboard reachable', async ({ page }, testInfo) => {
  test.setTimeout(30_000);
  const server = await startPointerServer();
  try {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(server.url);
    await expect(page.getByRole('tablist', { name: 'Loaded napplets' }).getByRole('tab')).toHaveCount(0);
    await expect(page.locator('#empty-runtime-stage')).toBeVisible();
    await expect(page.locator('#empty-runtime-stage h2')).toHaveText('No runtime loaded');
    await expect(page.locator('#empty-runtime-stage p')).toHaveText(
      'Enter a napplet pointer in Target controls, then choose Load target.',
    );
    await expect(page.locator('#runtime-pointer-load')).toHaveText('Load target');
    await expect(page.locator('#clear-log')).toBeDisabled();
    await page.locator('#runtime-pointer-input').fill('   ');
    await page.locator('#runtime-pointer-load').focus();
    await page.locator('#runtime-pointer-load').press('Enter');
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs.length)).toBe(0);
    await expect(page.locator('#runtime-pointer-status')).toHaveText('idle');
    await attachPointerScreenshot(page, testInfo, 'pointer-empty-desktop');

    await page.setViewportSize({ width: 375, height: 812 });
    const phone = await measurePointerLayout(page);
    expect(phone.documentScrollWidth, JSON.stringify(phone)).toBe(phone.documentClientWidth);
    expect(phone.consoleHeight, JSON.stringify(phone)).toBe(224);
    expect(phone.stageHeight, JSON.stringify(phone)).toBeGreaterThanOrEqual(320);
    expect(phone.footerColumns, JSON.stringify(phone)).toBe(2);
    expect(Math.min(...phone.actionHeights), JSON.stringify(phone)).toBeGreaterThanOrEqual(48);
    expect(phone.fontSizes.every((size) => size >= 12), JSON.stringify(phone)).toBe(true);
    await attachPointerScreenshot(page, testInfo, 'pointer-empty-phone');
  } finally {
    await server.close();
  }
});

test('announces loading immediately for each initial pointer resolution', async ({ page }) => {
  test.setTimeout(30_000);
  const server = await startPointerServer();
  const first = createPointerFixture(
    server.url,
    'first-lifecycle-target',
    '<!doctype html><html><body>first lifecycle target</body></html>',
    ['shell'],
  );
  const second = createPointerFixture(
    server.url,
    'second-lifecycle-target',
    '<!doctype html><html><body>second lifecycle target</body></html>',
    ['shell'],
  );
  const relay = 'wss://lifecycle-fixture.example';
  let resolutionRequests = 0;
  let releaseSecondResolution: (() => void) | null = null;
  server.blobs.set(first.hash, first.bytes);
  server.blobs.set(second.hash, second.bytes);
  server.setConfig({
    ...createPajaRuntimeHostConfig({ pointer: first.pointer, maxWaitMs: 2_000 }),
    simulation: normalizePajaSimulation({ relay: { mode: 'live', urls: [relay] } }),
  });
  await page.routeWebSocket(`${relay}/`, (socket) => {
    socket.onMessage((message) => {
      const request = JSON.parse(String(message)) as unknown[];
      if (request[0] !== 'REQ' || typeof request[1] !== 'string') return;
      resolutionRequests += 1;
      const subscriptionId = request[1];
      if (resolutionRequests === 1) {
        socket.send(JSON.stringify(['EVENT', subscriptionId, first.event]));
        socket.send(JSON.stringify(['EOSE', subscriptionId]));
        return;
      }
      releaseSecondResolution = () => {
        socket.send(JSON.stringify(['EVENT', subscriptionId, second.event]));
        socket.send(JSON.stringify(['EOSE', subscriptionId]));
      };
    });
  });

  try {
    await page.goto(server.url);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[0]?.status))
      .toBe('ready');
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready');

    await page.evaluate((pointer) => {
      void window.__KEHTO_PAJA__?.loadPointer(pointer);
    }, second.pointer);
    await expect.poll(() => resolutionRequests).toBe(2);
    await expect(page.locator('#lifecycle-status')).toHaveText('Loading target…');
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs.length)).toBe(1);

    releaseSecondResolution?.();
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs
      .find((tab) => tab.title === 'second-lifecycle-target')?.status)).toBe('ready');
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready');
  } finally {
    await server.close();
  }
});

test('resolves a stale embedded hint through configured live relays in the running browser', async ({ page }) => {
  test.setTimeout(30_000);
  const server = await startPointerServer();
  const html = '<!doctype html><html><head><title>Configured Relay Target</title></head><body>verified fallback</body></html>';
  const bytes = Buffer.from(html);
  const hash = createHash('sha256').update(bytes).digest('hex');
  const aggregateHash = computeAggregateHash([{ path: '/index.html', sha256: hash }]);
  const event = finalizeEvent({
    kind: NAPPLET_KIND_NAMED,
    created_at: 1_700_000_000,
    tags: [
      ['d', 'configured-relay-target'],
      ['path', '/index.html', hash],
      ['x', aggregateHash, 'aggregate'],
      ['server', `${server.url}blossom`],
    ],
    content: '',
  }, Uint8Array.from('22'.repeat(32).match(/.{2}/g)!.map((part) => parseInt(part, 16))));
  const pointer = naddrEncode({
    identifier: 'configured-relay-target',
    pubkey: event.pubkey,
    kind: NAPPLET_KIND_NAMED,
    relays: ['wss://stale-hint.example'],
  });
  const fallbackRelay = 'wss://configured-fallback.example';
  const baseConfig = createPajaRuntimeHostConfig({ pointer, maxWaitMs: 2_000 });
  server.blobs.set(hash, bytes);
  server.setConfig({
    ...baseConfig,
    simulation: normalizePajaSimulation({
      relay: { mode: 'live', urls: [fallbackRelay] },
    }),
  });

  for (const relay of ['wss://stale-hint.example/', `${fallbackRelay}/`]) {
    await page.routeWebSocket(relay, (socket) => {
      socket.onMessage((message) => {
        const request = JSON.parse(String(message)) as unknown[];
        if (request[0] !== 'REQ' || typeof request[1] !== 'string') return;
        const subscriptionId = request[1];
        if (relay === `${fallbackRelay}/`) {
          socket.send(JSON.stringify(['EVENT', subscriptionId, event]));
        }
        socket.send(JSON.stringify(['EOSE', subscriptionId]));
      });
    });
  }

  try {
    await page.goto(server.url);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().resolvedTarget?.dTag))
      .toBe('configured-relay-target');
    const state = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(state?.resolvedTarget).toMatchObject({
      aggregateHash,
      relays: ['wss://stale-hint.example', fallbackRelay],
      indexHtml: expect.stringContaining('verified fallback'),
    });
    await expect(page.locator('iframe')).toHaveCount(1);
    await expect(page.locator('iframe')).toHaveAttribute('srcdoc', /Configured Relay Target/);
    const frame = page.locator('iframe');
    const srcdoc = await frame.getAttribute('srcdoc');
    expect(srcdoc).toContain(classOnePrefix);
    expect(srcdoc).toContain(`connect-src wss://configured-fallback.example wss://stale-hint.example; ${classOneSuffix}`);
    expect(srcdoc!.indexOf('Content-Security-Policy')).toBeLessThan(
      srcdoc!.indexOf('data-kehto-nip5d-injection'),
    );
    await expect(frame).toHaveAttribute('sandbox', /allow-scripts/);
    await expect(frame).not.toHaveAttribute('sandbox', /allow-same-origin/);
  } finally {
    await server.close();
  }
});

test('recovers resolver and active-frame failures without duplicating verified tabs or sessions', async ({ page }, testInfo) => {
  test.setTimeout(45_000);
  const server = await startPointerServer();
  const target = createPointerFixture(
    server.url,
    'recovery-target',
    '<!doctype html><html><head><title>Recovery Target</title></head><body>verified recovery</body></html>',
    ['shell'],
  );
  const relay = 'wss://recovery-fixture.example';
  let resolutionRequests = 0;
  let releaseRetry: (() => void) | null = null;
  server.blobs.set(target.hash, target.bytes);
  const recoveryConfig = createPajaRuntimeHostConfig({ pointer: target.pointer, maxWaitMs: 2_000 });
  server.setConfig({
    ...recoveryConfig,
    runtime: { ...recoveryConfig.runtime, readyTimeoutMs: 2_000 },
    simulation: normalizePajaSimulation({ relay: { mode: 'live', urls: [relay] } }),
  });
  await page.routeWebSocket(`${relay}/`, (socket) => {
    socket.onMessage((message) => {
      const request = JSON.parse(String(message)) as unknown[];
      if (request[0] !== 'REQ' || typeof request[1] !== 'string') return;
      resolutionRequests += 1;
      const subscriptionId = request[1];
      if (resolutionRequests === 1) {
        socket.send(JSON.stringify(['EOSE', subscriptionId]));
        return;
      }
      releaseRetry = () => {
        socket.send(JSON.stringify(['EVENT', subscriptionId, target.event]));
        socket.send(JSON.stringify(['EOSE', subscriptionId]));
      };
    });
  });

  try {
    await page.goto(server.url);
    const pointerSurface = page.locator('.paja-target-surface:visible');
    await expect(pointerSurface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    await expect(pointerSurface.locator('.paja-target-return')).toHaveText('Back to target controls');
    await expect(page.locator('#runtime-pointer-input')).toHaveValue(target.pointer);
    await expect.poll(() => resolutionRequests).toBe(1);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs.length)).toBe(0);
    await attachPointerViewportEvidence(page, testInfo, 'pointer-resolution-error');

    const retry = pointerSurface.locator('.paja-target-retry');
    await retry.evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
    await expect.poll(() => resolutionRequests).toBe(2);
    await expect(retry).toBeDisabled();
    await attachPointerViewportEvidence(page, testInfo, 'pointer-resolution-retrying');
    releaseRetry?.();

    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[0]?.status))
      .toBe('ready');
    const firstState = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(firstState?.tabs).toHaveLength(1);
    expect(firstState?.iframeCount).toBe(1);
    expect(firstState?.initSent).toBe(true);
    expect(firstState?.messageLog.filter((entry) => entry.type === 'shell.ready')).toHaveLength(1);

    const frame = page.locator('iframe.tab-frame');
    const srcdoc = await frame.getAttribute('srcdoc');
    expect(srcdoc).toContain('verified recovery');
    expect(srcdoc).toContain(classOnePrefix);
    expect(srcdoc!.indexOf('Content-Security-Policy')).toBeLessThan(
      srcdoc!.indexOf('data-kehto-nip5d-injection'),
    );
    await expect(frame).toHaveAttribute('sandbox', /allow-scripts/);
    await expect(frame).not.toHaveAttribute('sandbox', /allow-same-origin/);
    await attachPointerViewportEvidence(page, testInfo, 'pointer-resolution-recovered');

    await frame.evaluate((element) => element.dispatchEvent(new Event('error')));
    const tabSurface = page.locator('.paja-target-surface:visible');
    await expect(tabSurface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    const firstWindowId = firstState?.tabs[0]?.windowId;
    const tabRetry = tabSurface.locator('.paja-target-retry');
    await attachPointerViewportEvidence(page, testInfo, 'pointer-tab-error');
    await tabRetry.evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
    await expect(tabRetry).toBeDisabled();
    await attachPointerViewportEvidence(page, testInfo, 'pointer-tab-retrying');

    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[0]?.status))
      .toBe('ready');
    const recoveredState = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(recoveredState?.tabs).toHaveLength(1);
    expect(recoveredState?.iframeCount).toBe(1);
    expect(recoveredState?.tabs[0]?.windowId).not.toBe(firstWindowId);
    expect(recoveredState?.initSent).toBe(true);
    expect(recoveredState?.messageLog.filter((entry) => entry.type === 'shell.ready')).toHaveLength(2);
    await attachPointerViewportEvidence(page, testInfo, 'pointer-tab-recovered');
  } finally {
    await server.close();
  }
});

test('times out hanging Blossom pointer resolution and retries through the same verified loader', async ({ page }) => {
  test.setTimeout(30_000);
  const server = await startPointerServer();
  const target = createPointerFixture(
    server.url,
    'pointer-resolution-timeout',
    '<!doctype html><html><head><title>Pointer Timeout Target</title></head><body>verified retry target</body></html>',
    ['shell'],
  );
  const relay = 'wss://intent-fixture.example';
  let blossomRequests = 0;
  let releaseFirstBlossom = (): void => {};
  const firstBlossom = new Promise<void>((resolve) => {
    releaseFirstBlossom = resolve;
  });
  server.blobs.set(target.hash, target.bytes);
  const baseConfig = createPajaRuntimeHostConfig({ pointer: target.pointer, maxWaitMs: 2_000 });
  server.setConfig({
    ...baseConfig,
    runtime: { ...baseConfig.runtime, readyTimeoutMs: 1_000 },
    simulation: normalizePajaSimulation({ relay: { mode: 'live', urls: [relay] } }),
  });
  await page.routeWebSocket(`${relay}/`, (socket) => {
    socket.onMessage((message) => {
      const request = JSON.parse(String(message)) as unknown[];
      if (request[0] !== 'REQ' || typeof request[1] !== 'string') return;
      socket.send(JSON.stringify(['EVENT', request[1], target.event]));
      socket.send(JSON.stringify(['EOSE', request[1]]));
    });
  });
  await page.route(`**/blossom/${target.hash}`, async (route) => {
    blossomRequests += 1;
    if (blossomRequests === 1) {
      await firstBlossom;
      await route.continue().catch(() => {});
      return;
    }
    await route.continue();
  });

  try {
    await page.goto(server.url);
    await expect.poll(() => blossomRequests).toBe(1);
    const surface = page.locator('.paja-target-surface:visible');
    await expect(surface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    await expect(surface.locator('.paja-target-diagnostic')).toContainText(
      'Pointer resolution timed out after 1000ms.',
    );
    await expect(surface.locator('.paja-target-retry')).toBeEnabled();
    await expect(page.locator('#runtime-pointer-load')).toBeEnabled();
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs.length)).toBe(0);

    releaseFirstBlossom();
    await surface.locator('.paja-target-retry').click();
    await expect.poll(() => blossomRequests).toBe(2);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[0]?.status))
      .toBe('ready');
    const recovered = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(recovered?.tabs).toHaveLength(1);
    expect(recovered?.iframeCount).toBe(1);
    expect(recovered?.initSent).toBe(true);
    expect(recovered?.messageLog.filter((entry) => entry.type === 'paja.pointer.error')).toHaveLength(1);
  } finally {
    releaseFirstBlossom();
    await server.close();
  }
});

test('times out a never-ready verified runtime generation and ignores stale readiness before retry', async ({ page }) => {
  test.setTimeout(30_000);
  const server = await startPointerServer();
  const target = createPointerFixture(
    server.url,
    'never-ready-target',
    '<!doctype html><html><head><title>Never Ready Target</title></head><body>verified timeout target</body></html>',
    ['shell'],
  );
  const relay = 'wss://never-ready-fixture.example';
  server.blobs.set(target.hash, target.bytes);
  const baseConfig = createPajaRuntimeHostConfig({ pointer: target.pointer, maxWaitMs: 2_000 });
  server.setConfig({
    ...baseConfig,
    runtime: { ...baseConfig.runtime, readyTimeoutMs: 100 },
    simulation: normalizePajaSimulation({ relay: { mode: 'live', urls: [relay] } }),
  });
  await page.routeWebSocket(`${relay}/`, (socket) => {
    socket.onMessage((message) => {
      const request = JSON.parse(String(message)) as unknown[];
      if (request[0] !== 'REQ' || typeof request[1] !== 'string') return;
      socket.send(JSON.stringify(['EVENT', request[1], target.event]));
      socket.send(JSON.stringify(['EOSE', request[1]]));
    });
  });
  await installShellReadyHold(page, { holdFirst: true });

  try {
    await page.goto(server.url);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[0]?.status))
      .toBe('error');
    const failed = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(failed?.tabs).toHaveLength(1);
    expect(failed?.tabs[0]?.windowId).toBeNull();
    expect(failed?.tabs[0]?.initSent).toBe(false);
    expect(failed?.messageLog.filter((entry) => entry.type === 'paja.target.error')).toHaveLength(1);
    await expect(page.locator('iframe.tab-frame')).toHaveCount(1);
    const surface = page.locator('.paja-target-surface:visible');
    await expect(surface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    await expect(surface.locator('.paja-target-retry')).toBeEnabled();

    await releaseHeldShellReady(page);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[0]?.status))
      .toBe('error');
    expect(await page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'shell.ready').length)).toBe(0);

    await surface.locator('.paja-target-retry').click();
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[0]?.status))
      .toBe('ready');
    const recovered = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(recovered?.tabs).toHaveLength(1);
    expect(recovered?.iframeCount).toBe(1);
    expect(recovered?.tabs[0]?.windowId).not.toBeNull();
    expect(recovered?.tabs[0]?.initSent).toBe(true);
    expect(recovered?.messageLog.filter((entry) => entry.type === 'paja.target.error')).toHaveLength(1);
    expect(recovered?.messageLog.filter((entry) => entry.type === 'shell.ready')).toHaveLength(1);
  } finally {
    await server.close();
  }
});

test('keeps BFCache runtime ownership and destroys ready and booting tabs on final pagehide', async ({ page }) => {
  test.setTimeout(30_000);
  const server = await startPointerServer();
  const first = createPointerFixture(
    server.url,
    'bfcache-first-target',
    '<!doctype html><html><body><p>first BFCache target</p></body></html>',
    ['shell'],
  );
  const second = createPointerFixture(
    server.url,
    'bfcache-second-target',
    '<!doctype html><html><body><p>second BFCache target</p></body></html>',
    ['shell'],
  );
  const relay = 'wss://bfcache-fixture.example';
  server.blobs.set(first.hash, first.bytes);
  server.blobs.set(second.hash, second.bytes);
  const baseConfig = createPajaRuntimeHostConfig({ pointer: first.pointer, maxWaitMs: 2_000 });
  server.setConfig({
    ...baseConfig,
    runtime: { ...baseConfig.runtime, readyTimeoutMs: 5_000 },
    simulation: normalizePajaSimulation({ relay: { mode: 'live', urls: [relay] } }),
  });
  await page.routeWebSocket(`${relay}/`, (socket) => {
    socket.onMessage((message) => {
      const request = JSON.parse(String(message)) as unknown[];
      if (request[0] !== 'REQ' || typeof request[1] !== 'string') return;
      socket.send(JSON.stringify(['EVENT', request[1], first.event]));
      socket.send(JSON.stringify(['EVENT', request[1], second.event]));
      socket.send(JSON.stringify(['EOSE', request[1]]));
    });
  });
  await installShellReadyHold(page);

  try {
    await page.goto(server.url);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[0]?.status))
      .toBe('ready');
    await holdNextShellReady(page);
    await page.evaluate((pointer) => window.__KEHTO_PAJA__?.loadPointer(pointer), second.pointer);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[1]?.status))
      .toBe('booting');
    const beforeCache = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(beforeCache?.tabs.map((tab) => tab.status)).toEqual(['ready', 'booting']);
    expect(beforeCache?.tabs.every((tab) => tab.windowId !== null)).toBe(true);

    await page.evaluate(() => {
      for (const type of ['pagehide', 'pageshow']) {
        const event = new Event(type);
        Object.defineProperty(event, 'persisted', { value: true });
        window.dispatchEvent(event);
      }
    });
    expect(await page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs)).toEqual(beforeCache?.tabs);
    await releaseHeldShellReady(page);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[1]?.status))
      .toBe('ready');

    await holdNextShellReady(page);
    await page.locator('#reload-target').click();
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[1]?.status))
      .toBe('reloading');
    const readyLogCount = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'shell.ready').length ?? -1);
    await page.evaluate(() => {
      for (let index = 0; index < 2; index += 1) {
        const event = new Event('pagehide');
        Object.defineProperty(event, 'persisted', { value: false });
        window.dispatchEvent(event);
      }
    });
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs
      .map((tab) => tab.windowId))).toEqual([null, null]);
    await releaseHeldShellReady(page);
    expect(await page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'shell.ready').length ?? -1)).toBe(readyLogCount);
  } finally {
    await server.close();
  }
});

test('final pagehide cancels held pointer resolution before tab ownership', async ({ page }) => {
  test.setTimeout(30_000);
  const server = await startPointerServer();
  const target = createPointerFixture(
    server.url,
    'pagehide-held-resolution',
    '<!doctype html><html><body><p>must not run after teardown</p></body></html>',
    ['shell'],
  );
  const relay = 'wss://pagehide-held-resolution.example';
  let resolutionRequests = 0;
  let releaseResolution: (() => void) | null = null;
  server.blobs.set(target.hash, target.bytes);
  const baseConfig = createPajaRuntimeHostConfig({ pointer: target.pointer, maxWaitMs: 2_000 });
  server.setConfig({
    ...baseConfig,
    runtime: { ...baseConfig.runtime, readyTimeoutMs: 100 },
    simulation: normalizePajaSimulation({ relay: { mode: 'live', urls: [relay] } }),
  });
  await page.routeWebSocket(`${relay}/`, (socket) => {
    socket.onMessage((message) => {
      const request = JSON.parse(String(message)) as unknown[];
      if (request[0] !== 'REQ' || typeof request[1] !== 'string') return;
      resolutionRequests += 1;
      const subscriptionId = request[1];
      releaseResolution = () => {
        socket.send(JSON.stringify(['EVENT', subscriptionId, target.event]));
        socket.send(JSON.stringify(['EOSE', subscriptionId]));
      };
    });
  });

  try {
    await page.goto(server.url);
    await expect.poll(() => resolutionRequests).toBe(1);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs.length)).toBe(0);
    await page.evaluate(() => {
      const event = new Event('pagehide');
      Object.defineProperty(event, 'persisted', { value: false });
      window.dispatchEvent(event);
    });
    releaseResolution?.();
    await page.waitForTimeout(250);

    const state = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(state?.tabs).toEqual([]);
    expect(state?.iframeCount).toBe(0);
    expect(state?.resolvedTarget).toBeNull();
    expect(state?.messageLog.filter((entry) => entry.type === 'paja.pointer.resolved')).toEqual([]);
    expect(state?.messageLog.filter((entry) => entry.type === 'paja.pointer.error')).toEqual([]);
    expect(state?.messageLog.filter((entry) => entry.type === 'paja.target.error')).toEqual([]);
    expect(state?.messageLog.filter((entry) => entry.type === 'shell.ready')).toEqual([]);
  } finally {
    await server.close();
  }
});

test('completes a verified intent and delivers its convention once to a cold target', async ({ page }) => {
  test.setTimeout(60_000);
  const server = await startPointerServer();
  const source = createPointerFixture(server.url, 'intent-source', sourceIntentHtml(), ['intent']);
  const target = createPointerFixture(server.url, 'profile-target', targetIntentHtml(), ['inc', 'theme'], [
    ['archetype', 'profile', 'napplet:profile/open'],
  ]);
  const longTitle = `long-${'target'.repeat(27)}`;
  const longTarget = createPointerFixture(server.url, longTitle, heldTargetHtml(), ['shell']);
  const relay = 'wss://intent-fixture.example';
  server.blobs.set(source.hash, source.bytes);
  server.blobs.set(target.hash, target.bytes);
  server.blobs.set(longTarget.hash, longTarget.bytes);
  server.setConfig({
    ...createPajaRuntimeHostConfig({ pointer: source.pointer, maxWaitMs: 2_000 }),
    simulation: normalizePajaSimulation({ relay: { mode: 'live', urls: [relay] } }),
  });
  await page.routeWebSocket(`${relay}/`, (socket) => {
    socket.onMessage((message) => {
      const request = JSON.parse(String(message)) as unknown[];
      if (request[0] !== 'REQ' || typeof request[1] !== 'string') return;
      const subscriptionId = request[1];
      socket.send(JSON.stringify(['EVENT', subscriptionId, source.event]));
      socket.send(JSON.stringify(['EVENT', subscriptionId, target.event]));
      socket.send(JSON.stringify(['EVENT', subscriptionId, longTarget.event]));
      socket.send(JSON.stringify(['EOSE', subscriptionId]));
    });
  });

  try {
    await installShellReadyHold(page);
    await page.goto(server.url);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs.length)).toBe(1);
    await page.evaluate((pointer) => window.__KEHTO_PAJA__?.loadPointer(pointer), target.pointer);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs
      .find((tab) => tab.title === 'profile-target')?.status)).toBe('ready');

    const tablist = page.getByRole('tablist', { name: 'Loaded napplets' });
    await expect(tablist.getByRole('tab')).toHaveCount(2);
    const sourceTrigger = tablist.getByRole('tab', { name: 'intent-source' });
    const targetTrigger = tablist.getByRole('tab', { name: 'profile-target' });
    await expect(sourceTrigger).toHaveAttribute('tabindex', '-1');
    await expect(sourceTrigger).toHaveAttribute('aria-selected', 'false');
    await expect(targetTrigger).toHaveAttribute('tabindex', '0');
    await expect(targetTrigger).toHaveAttribute('aria-selected', 'true');
    await expect(targetTrigger).toHaveAttribute('title', 'profile-target');
    const targetPanelId = await targetTrigger.getAttribute('aria-controls');
    expect(targetPanelId).toBeTruthy();
    await expect(page.locator(`#${targetPanelId}`)).toHaveAttribute('role', 'tabpanel');
    await expect(page.locator(`#${targetPanelId}`)).toHaveAttribute('aria-labelledby', await targetTrigger.getAttribute('id') ?? '');
    await expect(targetTrigger.getByRole('button')).toHaveCount(0);

    const targetGroup = targetTrigger.locator('..');
    const share = targetGroup.getByRole('button', { name: 'Copy share link for profile-target' });
    const close = targetGroup.getByRole('button', { name: 'Close profile-target' });
    await expect(share).toHaveAttribute('title', 'Copy share link for profile-target');
    await expect(close).toHaveAttribute('title', 'Close profile-target');
    await expect(page.locator('.target')).toHaveText(target.pointer);
    await expect(page.locator('.target')).toHaveAttribute('title', target.pointer);
    await expect(page.locator('.target')).toHaveAttribute('aria-label', target.pointer);

    await page.evaluate((pointer) => {
      void window.__KEHTO_PAJA__?.loadPointer(pointer);
    }, source.pointer);
    await expect(page.locator('#duplicate-pointer-dialog')).toBeVisible();
    await page.locator('#duplicate-cancel').click();
    await expect(page.locator('#duplicate-pointer-dialog')).toBeHidden();
    await expect(page.locator('.paja-target-surface:visible')).toHaveCount(0);
    await expect(targetTrigger).toHaveAttribute('aria-selected', 'true');

    await page.evaluate((pointer) => {
      void window.__KEHTO_PAJA__?.loadPointer(pointer);
    }, source.pointer);
    await expect(page.locator('#duplicate-pointer-dialog')).toBeVisible();
    await page.locator('#duplicate-open-tab').click();
    await expect(page.locator('#duplicate-pointer-dialog')).toBeHidden();
    await expect(page.locator('.paja-target-surface:visible')).toHaveCount(0);
    await expect(sourceTrigger).toHaveAttribute('aria-selected', 'true');
    await targetTrigger.click();

    await holdNextShellReady(page);
    const headerReload = page.locator('#reload-target');
    await headerReload.focus();
    await headerReload.click();
    await releaseHeldShellReady(page);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs
      .find((tab) => tab.title === 'profile-target')?.status), { timeout: 15_000 }).toBe('ready');
    await expect(headerReload).toBeFocused();

    await page.evaluate(() => {
      const status = document.getElementById('lifecycle-status');
      if (!status) throw new Error('Missing lifecycle status');
      const host = window as Window & { __pajaLifecycleTransitions?: string[] };
      host.__pajaLifecycleTransitions = [status.textContent ?? ''];
      new MutationObserver(() => {
        host.__pajaLifecycleTransitions?.push(status.textContent ?? '');
      }).observe(status, { childList: true, characterData: true, subtree: true });
    });

    await holdNextShellReady(page);
    await page.evaluate((pointer) => window.__KEHTO_PAJA__?.loadPointer(pointer), longTarget.pointer);
    await expect(tablist.getByRole('tab')).toHaveCount(3);
    const longTrigger = tablist.getByRole('tab', { name: longTitle });
    await expect(longTrigger).toHaveAttribute('title', longTitle);
    await expect(page.locator('.target')).toHaveText(longTarget.pointer);
    await expect(page.locator('.target')).toHaveAttribute('title', longTarget.pointer);
    await expect(page.locator('.target')).toHaveAttribute('aria-label', longTarget.pointer);
    await expect.poll(async () => page.evaluate((title) => window.__KEHTO_PAJA__?.getState().tabs
      .find((tab) => tab.title === title)?.status, longTitle)).toBe('booting');
    const longPanelId = await longTrigger.getAttribute('aria-controls');
    expect(longPanelId).toBeTruthy();
    const longPanel = page.locator(`#${longPanelId}`);
    await expect(longPanel).toHaveAttribute('role', 'tabpanel');
    await expect(longPanel).toHaveAttribute('aria-labelledby', await longTrigger.getAttribute('id') ?? '');
    await expect(longPanel).toBeVisible();
    await expect(longPanel.locator('iframe')).toBeHidden();
    await expect(page.locator('#lifecycle-status')).toHaveText('Loading target…');
    const loadingStatuses = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs.map((tab) => tab.status));
    expect(loadingStatuses.filter((status) => status === 'ready')).toHaveLength(2);
    expect(loadingStatuses).toContain('booting');
    await targetTrigger.click();
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready');
    await releaseHeldShellReady(page);
    await expect.poll(async () => page.evaluate((title) => window.__KEHTO_PAJA__?.getState().tabs
      .find((tab) => tab.title === title)?.status, longTitle), { timeout: 15_000 }).toBe('ready');
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready');
    await longPanel.locator('iframe').evaluate((frame) => frame.dispatchEvent(new Event('error')));
    await expect.poll(async () => page.evaluate((title) => window.__KEHTO_PAJA__?.getState().tabs
      .find((tab) => tab.title === title)?.status, longTitle)).toBe('error');
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready');
    const errorStatuses = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs.map((tab) => tab.status));
    expect(errorStatuses.filter((status) => status === 'ready')).toHaveLength(2);
    expect(errorStatuses).toContain('error');
    await longTrigger.click();
    await expect(page.locator('#lifecycle-status')).toHaveText("Target couldn't load");
    const longSurface = page.locator('.paja-target-surface:visible');
    await expect(longSurface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    await expect(longPanel).toBeVisible();
    await expect(longPanel.locator('iframe')).toBeHidden();
    await holdNextShellReady(page);
    await longSurface.locator('.paja-target-retry').focus();
    await longSurface.locator('.paja-target-retry').press('Space');
    await expect(longSurface.locator('.paja-target-retry')).toBeDisabled();
    await expect(page.locator('#lifecycle-status')).toHaveText('Retrying target…');
    await releaseHeldShellReady(page);
    await expect.poll(async () => page.evaluate((title) => window.__KEHTO_PAJA__?.getState().tabs
      .find((tab) => tab.title === title)?.status, longTitle), { timeout: 15_000 }).toBe('ready');
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready');
    expect(await page.evaluate(() => (window as Window & {
      __pajaLifecycleTransitions?: string[];
    }).__pajaLifecycleTransitions)).toEqual([
      'Target ready',
      'Loading target…',
      'Target ready',
      "Target couldn't load",
      'Retrying target…',
      'Target ready',
    ]);

    await page.setViewportSize({ width: 375, height: 812 });
    await longTrigger.focus();
    await longTrigger.press('End');
    const phoneLayout = await measurePointerLayout(page);
    expect(phoneLayout.documentScrollWidth, JSON.stringify(phoneLayout)).toBe(phoneLayout.documentClientWidth);
    expect(phoneLayout.consoleHeight, JSON.stringify(phoneLayout)).toBe(224);
    expect(phoneLayout.stageHeight, JSON.stringify(phoneLayout)).toBeGreaterThanOrEqual(320);
    expect(phoneLayout.tabScrollWidth, JSON.stringify(phoneLayout)).toBeGreaterThan(phoneLayout.tabClientWidth);
    expect(phoneLayout.activeTabWithinStrip, JSON.stringify(phoneLayout)).toBe(true);
    expect(phoneLayout.footerColumns, JSON.stringify(phoneLayout)).toBe(2);
    expect(Math.min(...phoneLayout.actionHeights), JSON.stringify(phoneLayout)).toBeGreaterThanOrEqual(48);
    await page.setViewportSize({ width: 1280, height: 720 });

    const longGroup = longTrigger.locator('..');
    const longShare = longGroup.getByRole('button', { name: `Copy share link for ${longTitle}` });
    const longClose = longGroup.getByRole('button', { name: `Close ${longTitle}` });
    await expect(longShare).toHaveAttribute('title', `Copy share link for ${longTitle}`);
    await expect(longClose).toHaveAttribute('title', `Close ${longTitle}`);
    page.once('dialog', async (dialog) => dialog.dismiss());
    await longShare.focus();
    await longShare.press('Enter');
    await expect(tablist.getByRole('tab')).toHaveCount(3);
    await longClose.focus();
    await longClose.press('Enter');
    await expect(tablist.getByRole('tab')).toHaveCount(2);
    await expect(targetTrigger).toBeFocused();

    await targetTrigger.press('Home');
    await expect(sourceTrigger).toBeFocused();
    await expect(sourceTrigger).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.target')).toHaveText(source.pointer);
    await sourceTrigger.press('End');
    await expect(targetTrigger).toBeFocused();
    await targetTrigger.press('ArrowLeft');
    await expect(sourceTrigger).toBeFocused();
    await sourceTrigger.press('ArrowRight');
    await expect(targetTrigger).toBeFocused();

    await page.setViewportSize({ width: 375, height: 812 });
    await targetTrigger.press('Home');
    await sourceTrigger.press('End');
    const reveal = await targetTrigger.evaluate((trigger) => {
      const strip = trigger.closest('[role="tablist"]');
      if (!(strip instanceof HTMLElement)) throw new Error('Missing tab strip');
      const triggerRect = trigger.getBoundingClientRect();
      const stripRect = strip.getBoundingClientRect();
      return {
        pageScrollX: window.scrollX,
        triggerLeft: triggerRect.left,
        triggerRight: triggerRect.right,
        stripLeft: stripRect.left,
        stripRight: stripRect.right,
      };
    });
    expect(reveal.pageScrollX).toBe(0);
    expect(reveal.triggerLeft).toBeGreaterThanOrEqual(reveal.stripLeft);
    expect(reveal.triggerRight).toBeLessThanOrEqual(reveal.stripRight);
    await page.setViewportSize({ width: 1280, height: 720 });

    await close.press('Enter');
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs.length)).toBe(1);
    await expect(sourceTrigger).toBeFocused();
    await expect(sourceTrigger).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.target')).toHaveText(source.pointer);

    await page.evaluate(() => {
      const state = window.__KEHTO_PAJA__;
      const sourceTab = state?.getState().tabs.find((tab) => tab.title === 'intent-source');
      const frame = sourceTab ? document.getElementById(`napplet-frame-${sourceTab.id}-content`) : null;
      if (!(frame instanceof HTMLIFrameElement)) throw new Error('Missing verified source frame');
      frame.contentWindow?.postMessage({ type: 'test.invoke' }, '*');
    });
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'test.source.accepted').length ?? 0)).toBe(1);

    await page.evaluate(() => {
      const state = window.__KEHTO_PAJA__;
      const sourceTab = state?.getState().tabs.find((tab) => tab.title === 'intent-source');
      if (sourceTab) state?.closeTab(sourceTab.id);
    });
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs
      .filter((tab) => tab.title === 'profile-target').length)).toBe(1);
    const targetTabId = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs
      .find((tab) => tab.title === 'profile-target')?.id ?? null);
    expect(targetTabId).toBeTruthy();
    const targetFrame = page.frameLocator(`#napplet-frame-${targetTabId}-content`);
    await expect(targetFrame.locator('#delivery-count')).toHaveText('1', { timeout: 15_000 });
    await expect(targetFrame.locator('#delivery-pubkey')).toHaveText('f'.repeat(64));
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'inc.event').length ?? 0)).toBe(1);

    await page.evaluate(() => {
      const forged = document.createElement('iframe');
      forged.id = 'forged-ready';
      forged.sandbox.add('allow-scripts');
      forged.srcdoc = '<div id="messages">0</div><script>let count=0;window.addEventListener("message",()=>document.getElementById("messages").textContent=String(++count));parent.postMessage({type:"shell.ready"},"*");</script>';
      document.body.append(forged);
    });
    await expect(page.frameLocator('#forged-ready').locator('#messages')).toHaveText('0');
  } finally {
    await server.close();
  }
});

test('resolves the supplied Good Morning Protocol naddr through verified HTML', async ({ page }) => {
  test.skip(process.env.PAJA_LIVE_POINTER_TEST !== '1', 'requires live Nostr relays and Blossom availability');
  test.setTimeout(90_000);
  const server = await startPointerServer();
  server.setConfig(createPajaRuntimeHostConfig({ pointer: LIVE_NADDR, maxWaitMs: 15_000 }));

  try {
    await page.goto(server.url);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().resolvedTarget?.dTag), {
      timeout: 45_000,
    }).toBe('good-morning');
    const state = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(state?.resolvedTarget).toMatchObject({
      event: { id: LIVE_EVENT_ID },
      aggregateHash: LIVE_AGGREGATE,
      manifest: { title: 'Good Morning Protocol' },
      indexHtml: expect.stringContaining('Good Morning Protocol'),
    });
    await expect(page.locator('iframe')).toHaveCount(1);
    await expect(page.locator('iframe')).toHaveAttribute('srcdoc', /Good Morning Protocol/);
  } finally {
    await server.close();
  }
});

async function measurePointerLayout(page: Page) {
  return page.evaluate(() => {
    const bounds = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing Paja element: ${selector}`);
      return element.getBoundingClientRect();
    };
    const consoleElement = document.querySelector<HTMLElement>('.console');
    const tablist = document.querySelector<HTMLElement>('#napplet-tabs');
    const footer = document.querySelector<HTMLElement>('footer.bottom');
    if (!consoleElement || !tablist || !footer) throw new Error('Missing pointer layout landmark');
    const visible = (element: Element) => element.getClientRects().length > 0;
    const activeTab = tablist.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    const stripRect = tablist.getBoundingClientRect();
    const activeRect = activeTab?.getBoundingClientRect();
    const footerColumns = getComputedStyle(footer).gridTemplateColumns === 'none'
      ? []
      : getComputedStyle(footer).gridTemplateColumns.split(/\s+/).filter(Boolean);
    return {
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      consoleHeight: bounds('.console').height,
      consoleScrollHeight: consoleElement.scrollHeight,
      stageHeight: bounds('#napplet-stage').height,
      footerColumns: footerColumns.length,
      tabClientWidth: tablist.clientWidth,
      tabScrollWidth: tablist.scrollWidth,
      activeTabWithinStrip: !activeRect
        || (activeRect.left >= stripRect.left - 1 && activeRect.right <= stripRect.right + 1),
      actionHeights: [...document.querySelectorAll<HTMLElement>('button, input, select, summary')]
        .filter(visible)
        .map((element) => element.getBoundingClientRect().height),
      fontSizes: [
        '.brand',
        '.target',
        '#lifecycle-status',
        '.section-title',
        '.pointer-status',
        '.console button',
        '.console input',
        '.tab-label',
        'footer.bottom',
      ].flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)])
        .filter(visible)
        .map((element) => parseFloat(getComputedStyle(element).fontSize)),
    };
  });
}

async function attachPointerScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot({ animations: 'disabled', fullPage: true }),
    contentType: 'image/png',
  });
}

async function attachPointerViewportEvidence(
  page: Page,
  testInfo: TestInfo,
  state: string,
): Promise<void> {
  for (const viewport of [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'phone', width: 375, height: 812 },
  ] as const) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await attachPointerScreenshot(page, testInfo, `${state}-${viewport.name}`);
  }
}

async function holdNextShellReady(page: Page): Promise<void> {
  await page.evaluate(() => {
    const host = window as Window & {
      __pajaHoldNextReady?: boolean;
    };
    host.__pajaHoldNextReady = true;
  });
}

async function installShellReadyHold(
  page: Page,
  options: { readonly holdFirst?: boolean } = {},
): Promise<void> {
  await page.addInitScript((holdFirst) => {
    const host = window as Window & {
      __pajaHoldNextReady?: boolean;
      __pajaHeldReady?: {
        readonly data: unknown;
        readonly source: MessageEventSource | null;
        readonly origin: string;
      };
    };
    host.__pajaHoldNextReady = holdFirst;
    window.addEventListener('message', (event) => {
      const data = event.data as { type?: unknown } | null;
      if (!host.__pajaHoldNextReady || !data || data.type !== 'shell.ready') return;
      event.stopImmediatePropagation();
      host.__pajaHoldNextReady = false;
      host.__pajaHeldReady = { data: event.data, source: event.source, origin: event.origin };
    }, true);
  }, options.holdFirst === true);
}

async function releaseHeldShellReady(page: Page): Promise<void> {
  await expect.poll(async () => page.evaluate(() => Boolean((window as Window & {
    __pajaHeldReady?: unknown;
  }).__pajaHeldReady))).toBe(true);
  await page.evaluate(() => {
    const host = window as Window & {
      __pajaHeldReady?: {
        readonly data: unknown;
        readonly source: MessageEventSource | null;
        readonly origin: string;
      };
    };
    const held = host.__pajaHeldReady;
    delete host.__pajaHeldReady;
    if (!held) throw new Error('No held shell.ready event');
    window.dispatchEvent(new MessageEvent('message', held));
  });
}

async function startPointerServer(): Promise<PointerServer> {
  const browserHost = readFileSync(new URL('../../packages/paja/dist/browser-host.js', import.meta.url), 'utf8');
  const blobs = new Map<string, Buffer>();
  let config = createPajaRuntimeHostConfig();
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (path === '/') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(renderPajaHtml(config));
      return;
    }
    if (path === '/__kehto/config.json') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(config));
      return;
    }
    if (path === '/__kehto/browser-host.js') {
      response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
      response.end(browserHost);
      return;
    }
    const match = /^\/blossom\/([0-9a-f]{64})$/.exec(path);
    const blob = match ? blobs.get(match[1]!) : undefined;
    if (blob) {
      response.writeHead(200, {
        'access-control-allow-origin': '*',
        'content-type': 'text/html; charset=utf-8',
      });
      response.end(blob);
      return;
    }
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Pointer test server did not bind a TCP port.');

  return {
    url: `http://127.0.0.1:${address.port}/`,
    blobs,
    setConfig(nextConfig) {
      config = nextConfig;
    },
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeIdleConnections();
      server.closeAllConnections();
    }),
  };
}

function createPointerFixture(
  serverUrl: string,
  dTag: string,
  html: string,
  requires: readonly string[],
  extraTags: readonly string[][] = [],
) {
  const bytes = Buffer.from(html);
  const hash = createHash('sha256').update(bytes).digest('hex');
  const aggregateHash = computeAggregateHash([{ path: '/index.html', sha256: hash }]);
  const event = finalizeEvent({
    kind: NAPPLET_KIND_NAMED,
    created_at: 1_700_000_001,
    tags: [
      ['d', dTag],
      ['title', dTag],
      ['path', '/index.html', hash],
      ['x', aggregateHash, 'aggregate'],
      ['server', `${serverUrl}blossom`],
      ...requires.map((name) => ['requires', name]),
      ...extraTags,
    ],
    content: '',
  }, Uint8Array.from('33'.repeat(32).match(/.{2}/g)!.map((part) => parseInt(part, 16))));
  return {
    bytes,
    hash,
    event,
    pointer: naddrEncode({
      identifier: dTag,
      pubkey: event.pubkey,
      kind: NAPPLET_KIND_NAMED,
      relays: ['wss://intent-fixture.example'],
    }),
  };
}

function sourceIntentHtml(): string {
  return `<!doctype html><html><body><div id="source-status">booting</div><script>
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'shell.init') document.getElementById('source-status').textContent = 'ready';
      if (event.data && event.data.type === 'test.invoke') {
        window.parent.postMessage({ type: 'intent.invoke', id: 'source-intent', request: {
          archetype: 'profile', action: 'open', convention: 'napplet:profile/open', payload: { pubkey: '${'f'.repeat(64)}' },
        } }, '*');
      }
      if (event.data && event.data.type === 'intent.invoke.result' && event.data.result && event.data.result.ok) {
        window.parent.postMessage({ type: 'test.source.accepted' }, '*');
      }
    });
    window.parent.postMessage({ type: 'shell.ready' }, '*');
  </script></body></html>`;
}

function targetIntentHtml(): string {
  return `<!doctype html><html><body><div id="delivery-count">0</div><div id="delivery-pubkey"></div><script>
    let count = 0;
    window.napplet.inc.on('napplet:profile/open', (event) => {
      count += 1;
      document.getElementById('delivery-count').textContent = String(count);
      document.getElementById('delivery-pubkey').textContent = event.payload && event.payload.pubkey || '';
    });
    window.parent.postMessage({ type: 'shell.ready' }, '*');
  </script></body></html>`;
}

function heldTargetHtml(): string {
  return '<!doctype html><html><body><div id="held-status">verified target</div></body></html>';
}
