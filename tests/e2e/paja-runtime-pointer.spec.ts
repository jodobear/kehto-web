import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
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

test('recovers resolver and active-frame failures without duplicating verified tabs or sessions', async ({ page }) => {
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
  server.setConfig({
    ...createPajaRuntimeHostConfig({ pointer: target.pointer, maxWaitMs: 2_000 }),
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

    const retry = pointerSurface.locator('.paja-target-retry');
    await retry.evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
    await expect.poll(() => resolutionRequests).toBe(2);
    await expect(retry).toBeDisabled();
    releaseRetry?.();

    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[0]?.status))
      .toBe('ready');
    const firstState = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(firstState?.tabs).toHaveLength(1);
    expect(firstState?.iframeCount).toBe(1);
    expect(firstState?.initSent).toBe(true);
    expect(firstState?.messageLog.filter((entry) => entry.type === 'shell.ready')).toHaveLength(1);

    const frame = page.locator('iframe.tab-panel');
    const srcdoc = await frame.getAttribute('srcdoc');
    expect(srcdoc).toContain('verified recovery');
    expect(srcdoc).toContain(classOnePrefix);
    expect(srcdoc!.indexOf('Content-Security-Policy')).toBeLessThan(
      srcdoc!.indexOf('data-kehto-nip5d-injection'),
    );
    await expect(frame).toHaveAttribute('sandbox', /allow-scripts/);
    await expect(frame).not.toHaveAttribute('sandbox', /allow-same-origin/);

    await frame.evaluate((element) => element.dispatchEvent(new Event('error')));
    const tabSurface = page.locator('.paja-target-surface:visible');
    await expect(tabSurface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    const firstWindowId = firstState?.tabs[0]?.windowId;
    const tabRetry = tabSurface.locator('.paja-target-retry');
    await tabRetry.evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });

    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().tabs[0]?.status))
      .toBe('ready');
    const recoveredState = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(recoveredState?.tabs).toHaveLength(1);
    expect(recoveredState?.iframeCount).toBe(1);
    expect(recoveredState?.tabs[0]?.windowId).not.toBe(firstWindowId);
    expect(recoveredState?.initSent).toBe(true);
    expect(recoveredState?.messageLog.filter((entry) => entry.type === 'shell.ready')).toHaveLength(2);
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
  const relay = 'wss://intent-fixture.example';
  server.blobs.set(source.hash, source.bytes);
  server.blobs.set(target.hash, target.bytes);
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
      socket.send(JSON.stringify(['EOSE', subscriptionId]));
    });
  });

  try {
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
      const frame = sourceTab ? document.getElementById(`napplet-frame-${sourceTab.id}`) : null;
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
    const targetFrame = page.frameLocator(`#napplet-frame-${targetTabId}`);
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
