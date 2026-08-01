import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test, type FrameLocator, type Locator, type Page, type TestInfo } from '@playwright/test';
import { finalizeEvent, generateSecretKey, getPublicKey, verifyEvent } from 'nostr-tools/pure';
import { startPajaServer, type PajaServer } from '../../packages/paja/dist/index.js';

interface TargetServer {
  readonly url: string;
  readonly requestOrigins: string[];
  readonly htmlRequestCount: number;
  failNext(message: string, options?: { readonly hold?: boolean }): void;
  setCorsAllowed(allowed: boolean): void;
  setExternalModule(enabled: boolean): void;
  setModuleCorsAllowed(allowed: boolean): void;
  releaseHeldFailure(): void;
  close(): Promise<void>;
}

interface BlossomPut {
  readonly bytes: Buffer;
  readonly authorization: string;
  readonly contentType: string;
}

interface BlossomTestServer extends TargetServer {
  readonly puts: BlossomPut[];
  readonly requestMethods: string[];
  omitSizeOnce(): void;
}

const shimPrelude = readFileSync(
  new URL('../../packages/shell/node_modules/@napplet/shim/dist/prelude.global.js', import.meta.url),
  'utf8',
);

let targetServer: TargetServer;
let runtimeServer: PajaServer;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  targetServer = await startTargetServer();
  runtimeServer = await startPajaServer({
    options: {
      targetUrl: targetServer.url,
      port: 0,
    },
    now: new Date('2026-06-21T00:00:00.000Z'),
  });
});

test.afterAll(async () => {
  await runtimeServer.close();
  await targetServer.close();
});

test('recovers an external target through stable host error controls', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const recoveryTarget = await startTargetServer();
  const diagnostic = '<img data-paja-diagnostic="unsafe" src=x onerror=alert(1)>';
  recoveryTarget.failNext(diagnostic, { hold: true });
  const recoveryRuntime = await startPajaServer({
    options: {
      targetUrl: recoveryTarget.url,
      port: 0,
    },
    now: new Date('2026-07-31T00:00:00.000Z'),
  });

  try {
    await page.goto(recoveryRuntime.url);
    await expect.poll(() => recoveryTarget.htmlRequestCount).toBe(1);
    await page.locator('#message-filter').focus();
    recoveryTarget.releaseHeldFailure();

    const surface = page.locator('.paja-target-surface');
    await expect(surface).toBeVisible();
    await expect(surface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    await expect(surface.locator('.paja-target-message')).toHaveText(
      'Check that the target is running and reachable, then retry.',
    );
    await expect(surface.locator('.paja-target-retry')).toHaveText('Retry target');
    await expect(surface.locator('.paja-target-return')).toHaveText('Back to Paja controls');
    await expect(surface.locator('.paja-target-details-summary')).toHaveText('Show technical details');
    await expect(surface.locator('.paja-target-details')).not.toHaveAttribute('open', '');
    await expect(surface.locator('.paja-target-diagnostic')).toContainText(diagnostic);
    await expect(page.locator('[data-paja-diagnostic="unsafe"]')).toHaveCount(0);
    await expect(page.locator('#lifecycle-status')).toHaveText("Target couldn't load");
    expect(await page.locator('#napplet-frame').getAttribute('srcdoc')).toBeNull();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('message-filter');
    await attachViewportEvidence(page, testInfo, 'external-error');

    await surface.locator('.paja-target-details-summary').click();
    await expect(surface.locator('.paja-target-details-summary')).toHaveText('Hide technical details');
    await surface.locator('.paja-target-details-summary').click();
    await expect(surface.locator('.paja-target-details-summary')).toHaveText('Show technical details');

    const retry = surface.locator('.paja-target-retry');
    const retryNode = await retry.elementHandle();
    const failedGeneration = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation ?? -1);
    const repeatDiagnostic = 'second failure <strong data-repeat-diagnostic="unsafe">still inert</strong>';
    recoveryTarget.failNext(repeatDiagnostic, { hold: true });
    await retry.focus();
    await retry.press('Enter');
    await expect.poll(() => recoveryTarget.htmlRequestCount).toBe(2);
    await expect(surface).toHaveAttribute('aria-busy', 'true');
    await expect(surface.locator('.paja-target-heading')).toHaveText('Retrying target…');
    await expect(retry).toBeVisible();
    await expect(retry).toBeDisabled();
    await attachViewportEvidence(page, testInfo, 'external-retrying');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await retry.evaluate((button) => button.click());
    await expect.poll(() => recoveryTarget.htmlRequestCount).toBe(2);
    await expect.poll(() => page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation ?? -1))
      .toBe(failedGeneration + 1);

    recoveryTarget.releaseHeldFailure();
    await expect(surface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    await expect(surface.locator('.paja-target-diagnostic')).toContainText(repeatDiagnostic);
    await expect(page.locator('[data-repeat-diagnostic="unsafe"]')).toHaveCount(0);
    await expect(retry).toBeEnabled();
    await expect.poll(() => retry.evaluate((button) => button === document.activeElement)).toBe(true);
    expect(await retry.evaluate((button, original) => button === original, retryNode)).toBe(true);

    const repeatFailureGeneration = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation ?? -1);
    const repeatFailureRequests = recoveryTarget.htmlRequestCount;
    await surface.locator('.paja-target-return').focus();
    await surface.locator('.paja-target-return').press('Space');
    await expect.poll(() => page.evaluate(() => document.activeElement?.matches(
      '.console button:not(:disabled), .console input:not(:disabled), .console select:not(:disabled)',
    ) ?? false)).toBe(true);
    expect(recoveryTarget.htmlRequestCount).toBe(repeatFailureRequests);
    expect(await page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation ?? -1))
      .toBe(repeatFailureGeneration);

    await retry.click();
    await expect.poll(() => recoveryTarget.htmlRequestCount).toBe(3);
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready', { timeout: 15_000 });
    await expect(page.frameLocator('#napplet-frame').locator('#target-status')).toHaveText(
      'shell-init received',
      { timeout: 15_000 },
    );
    await expect(page.locator('iframe')).toHaveCount(1);
    await expect(page.locator('#napplet-frame')).toHaveAttribute('sandbox', 'allow-scripts');
    await expect(page.locator('#napplet-frame')).not.toHaveAttribute('sandbox', /allow-same-origin/);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState())).toMatchObject({
      generation: failedGeneration + 2,
      status: 'ready',
      iframeCount: 1,
      initSent: true,
    });
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('napplet-frame');
    await attachViewportEvidence(page, testInfo, 'external-recovered');
  } finally {
    await recoveryRuntime.close();
    await recoveryTarget.close();
  }
});

test('settles a missing external shell.ready handshake into retryable recovery', async ({ page }) => {
  test.setTimeout(30_000);
  const target = await startTargetServer();
  const runtime = await startPajaServer({
    options: {
      targetUrl: target.url,
      port: 0,
      readyTimeoutMs: 100,
    },
    now: new Date('2026-07-31T00:00:00.000Z'),
  });
  await page.addInitScript(() => {
    const host = window as Window & { __pajaWithholdReady?: boolean };
    host.__pajaWithholdReady = true;
    window.addEventListener('message', (event) => {
      const data = event.data as { type?: unknown } | null;
      if (!host.__pajaWithholdReady || !data || data.type !== 'shell.ready') return;
      event.stopImmediatePropagation();
    }, true);
  });
  try {
    await page.goto(runtime.url);
    const surface = page.locator('.paja-target-surface');
    await expect(surface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    await expect(surface.locator('.paja-target-diagnostic')).toContainText(
      'Target readiness timed out after 100ms without shell.ready.',
    );
    await expect(surface.locator('.paja-target-retry')).toBeEnabled();
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState())).toMatchObject({
      status: 'error',
      initSent: false,
    });
    await expect(page.locator('#napplet-frame')).toHaveAttribute('srcdoc', /Paja inactive target/);

    await page.evaluate(() => {
      (window as Window & { __pajaWithholdReady?: boolean }).__pajaWithholdReady = false;
    });
    await surface.locator('.paja-target-retry').click();
    await expect.poll(() => target.htmlRequestCount).toBe(2);
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready', { timeout: 15_000 });
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('napplet-frame');
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState())).toMatchObject({
      status: 'ready',
      initSent: true,
    });
  } finally {
    await runtime.close();
    await target.close();
  }
});

test('settles a never-settling external target fetch and retries through the same loader', async ({ page }) => {
  test.setTimeout(30_000);
  const target = await startTargetServer();
  const runtime = await startPajaServer({
    options: {
      targetUrl: target.url,
      port: 0,
      readyTimeoutMs: 100,
    },
    now: new Date('2026-07-31T00:00:00.000Z'),
  });
  let proxyRequestCount = 0;
  let releaseHeldFetch = (): void => {};
  const heldFetch = new Promise<void>((resolve) => {
    releaseHeldFetch = resolve;
  });
  await page.route('**/__kehto/target.html', async (route) => {
    proxyRequestCount += 1;
    if (proxyRequestCount === 1) {
      await heldFetch;
      await route.continue().catch(() => {});
      return;
    }
    await route.continue();
  });

  try {
    await page.goto(runtime.url);
    await expect.poll(() => proxyRequestCount).toBe(1);
    const surface = page.locator('.paja-target-surface');
    await expect(surface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    await expect(surface.locator('.paja-target-diagnostic')).toContainText(
      'Target readiness timed out after 100ms without shell.ready.',
    );
    await expect(surface.locator('.paja-target-retry')).toBeEnabled();
    const failedGeneration = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation ?? -1);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState())).toMatchObject({
      status: 'error',
      iframeCount: 1,
      initSent: false,
    });

    releaseHeldFetch();
    await page.waitForTimeout(150);
    await expect(surface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    expect(proxyRequestCount).toBe(1);
    await expect.poll(() => page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'paja.target.error').length ?? -1)).toBe(1);

    await surface.locator('.paja-target-retry').click();
    await expect.poll(() => proxyRequestCount).toBe(2);
    await expect.poll(() => target.htmlRequestCount).toBe(1);
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready', { timeout: 15_000 });
    await expect(page.frameLocator('#napplet-frame').locator('#target-status')).toHaveText(
      'shell-init received',
      { timeout: 15_000 },
    );
    await expect(page.locator('iframe')).toHaveCount(1);
    await expect(page.locator('#napplet-frame')).toHaveAttribute('sandbox', 'allow-scripts');
    await expect(page.locator('#napplet-frame')).not.toHaveAttribute('sandbox', /allow-same-origin/);
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('napplet-frame');
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState())).toMatchObject({
      generation: failedGeneration + 1,
      status: 'ready',
      iframeCount: 1,
      initSent: true,
    });
  } finally {
    releaseHeldFetch();
    await runtime.close();
    await target.close();
  }
});

test('reload supersedes an in-flight external attempt and ignores its late settlement', async ({ page }) => {
  test.setTimeout(30_000);
  const target = await startTargetServer();
  const runtime = await startPajaServer({
    options: {
      targetUrl: target.url,
      port: 0,
      readyTimeoutMs: 2_000,
    },
    now: new Date('2026-08-01T00:00:00.000Z'),
  });
  let proxyRequestCount = 0;
  let releaseFirstFetch = (): void => {};
  const firstFetch = new Promise<void>((resolve) => {
    releaseFirstFetch = resolve;
  });
  await page.route('**/__kehto/target.html', async (route) => {
    proxyRequestCount += 1;
    if (proxyRequestCount === 1) {
      await firstFetch;
      await route.continue().catch(() => {});
      return;
    }
    await route.continue();
  });

  try {
    await page.goto(runtime.url);
    await expect.poll(() => proxyRequestCount).toBe(1);
    const firstGeneration = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation ?? -1);

    await page.locator('#reload-target').click();
    await expect.poll(() => proxyRequestCount).toBe(2);
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready', { timeout: 15_000 });
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState())).toMatchObject({
      generation: firstGeneration + 1,
      status: 'ready',
      initSent: true,
    });

    releaseFirstFetch();
    await page.waitForTimeout(150);
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready');
    expect(await page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'paja.target.error').length ?? -1)).toBe(0);
  } finally {
    releaseFirstFetch();
    await runtime.close();
    await target.close();
  }
});

test('loads a self-contained target whose proxied HTML has no CORS header', async ({ page }) => {
  test.setTimeout(30_000);
  const target = await startTargetServer();
  target.setCorsAllowed(false);
  const runtime = await startPajaServer({
    options: {
      targetUrl: target.url,
      port: 0,
      readyTimeoutMs: 2_000,
    },
    now: new Date('2026-08-01T00:00:00.000Z'),
  });

  try {
    await page.goto(runtime.url);
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready', { timeout: 15_000 });
    await expect(page.frameLocator('#napplet-frame').locator('#target-status')).toHaveText(
      'shell-init received',
      { timeout: 15_000 },
    );
    expect(await page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'paja.target.cors.error').length ?? -1)).toBe(0);
  } finally {
    await runtime.close();
    await target.close();
  }
});

test('keeps a CORS-blocked target module in recovery until retry can load it', async ({ page }) => {
  test.setTimeout(30_000);
  const target = await startTargetServer();
  target.setCorsAllowed(false);
  target.setExternalModule(true);
  target.setModuleCorsAllowed(false);
  const runtime = await startPajaServer({
    options: {
      targetUrl: target.url,
      port: 0,
      readyTimeoutMs: 2_000,
    },
    now: new Date('2026-08-01T00:00:00.000Z'),
  });

  try {
    await page.goto(runtime.url);
    const surface = page.locator('.paja-target-surface');
    await expect(surface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    await expect(surface.locator('.paja-target-diagnostic')).toContainText(
      'Target sent no access-control-allow-origin for an Origin: null request.',
    );
    await expect(surface.locator('.paja-target-retry')).toBeEnabled();
    expect(await page.locator('#napplet-frame').getAttribute('srcdoc')).toBeNull();
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState())).toMatchObject({
      status: 'error',
      initSent: false,
    });
    expect(await page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'paja.target.cors.error').length ?? -1)).toBe(1);

    target.setModuleCorsAllowed(true);
    await surface.locator('.paja-target-retry').click();
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready', { timeout: 15_000 });
    await expect(page.frameLocator('#napplet-frame').locator('#target-status')).toHaveText(
      'shell-init received',
      { timeout: 15_000 },
    );
  } finally {
    await runtime.close();
    await target.close();
  }
});

test('ignores a stale iframe error while a newer Retry attempt is fetching', async ({ page }) => {
  test.setTimeout(30_000);
  const target = await startTargetServer();
  const runtime = await startPajaServer({
    options: {
      targetUrl: target.url,
      port: 0,
      readyTimeoutMs: 2_000,
    },
    now: new Date('2026-07-31T00:00:00.000Z'),
  });
  await page.addInitScript(() => {
    const host = window as Window & { __pajaWithholdReady?: boolean };
    host.__pajaWithholdReady = true;
    window.addEventListener('message', (event) => {
      const data = event.data as { type?: unknown } | null;
      if (!host.__pajaWithholdReady || !data || data.type !== 'shell.ready') return;
      event.stopImmediatePropagation();
    }, true);
  });
  let holdRetry = false;
  let retryProxyRequests = 0;
  let releaseRetry = (): void => {};
  const retryGate = new Promise<void>((resolve) => {
    releaseRetry = resolve;
  });
  await page.route('**/__kehto/target.html', async (route) => {
    if (!holdRetry) {
      await route.continue();
      return;
    }
    retryProxyRequests += 1;
    await retryGate;
    await route.continue().catch(() => {});
  });

  try {
    await page.goto(runtime.url);
    await expect(page.locator('#napplet-frame')).toHaveAttribute('srcdoc', /target-status/);
    await page.locator('#napplet-frame').evaluate((frame) => frame.dispatchEvent(new Event('error')));
    const surface = page.locator('.paja-target-surface');
    await expect(surface.locator('.paja-target-heading')).toHaveText("Target couldn't load");
    await expect.poll(() => page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'paja.target.error').length ?? -1)).toBe(1);

    await page.evaluate(() => {
      (window as Window & { __pajaWithholdReady?: boolean }).__pajaWithholdReady = false;
    });
    holdRetry = true;
    await surface.locator('.paja-target-retry').click();
    await expect.poll(() => retryProxyRequests).toBe(1);
    await expect(surface.locator('.paja-target-heading')).toHaveText('Retrying target…');
    await page.locator('#napplet-frame').evaluate((frame) => frame.dispatchEvent(new Event('error')));
    await page.waitForTimeout(100);
    await expect(surface.locator('.paja-target-heading')).toHaveText('Retrying target…');
    expect(await page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'paja.target.error').length ?? -1)).toBe(1);

    releaseRetry();
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready', { timeout: 15_000 });
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState())).toMatchObject({
      status: 'ready',
      initSent: true,
    });
  } finally {
    releaseRetry();
    await runtime.close();
    await target.close();
  }
});

test('refreshes target A to B before Retry base injection and readiness', async ({ page }) => {
  test.setTimeout(30_000);
  const targetA = await startTargetServer();
  const targetB = await startTargetServer();
  targetA.failNext('target A replaced', { hold: true });
  const runtime = await startPajaServer({
    options: {
      targetUrl: targetA.url,
      port: 0,
      readyTimeoutMs: 2_000,
    },
    now: new Date('2026-07-31T00:00:00.000Z'),
  });

  try {
    await page.goto(runtime.url);
    await expect.poll(() => targetA.htmlRequestCount).toBe(1);
    runtime.updateTargetUrl(targetB.url);
    const surface = page.locator('.paja-target-surface');
    await expect(surface.locator('.paja-target-heading')).toHaveText("Target couldn't load");

    await surface.locator('.paja-target-retry').click();
    await expect.poll(() => targetB.htmlRequestCount).toBe(1);
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready', { timeout: 2_000 });
    await expect(page.locator('.target')).toHaveText(targetB.url);
    await expect(page.locator('#napplet-frame')).toHaveAttribute('data-target-url', targetB.url);
    await expect(page.locator('#napplet-frame')).toHaveAttribute(
      'srcdoc',
      new RegExp(`<base href="${targetB.url.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`),
    );
    await expect(page.frameLocator('#napplet-frame').locator('#target-status')).toHaveText(
      'shell-init received',
      { timeout: 2_000 },
    );
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState())).toMatchObject({
      status: 'ready',
      initSent: true,
    });
    expect(await page.evaluate(() => window.__KEHTO_PAJA__?.config.target.url)).toBe(targetB.url);
  } finally {
    targetA.releaseHeldFailure();
    await runtime.close();
    await targetA.close();
    await targetB.close();
  }
});

test('hosts one sandboxed target iframe and reinitializes it on reload', async ({ page }) => {
  test.setTimeout(60_000);
  const dialogMessages: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogMessages.push(dialog.message());
    await dialog.accept();
  });
  await page.goto(runtimeServer.url);

  await expect(page.locator('header.top')).toBeVisible();
  await expect(page.locator('.brand')).toHaveText('@kehto/paja');
  await expect.poll(async () => page.locator('.brand').evaluate((brand) => {
    const product = brand.querySelector('.brand-product');
    if (!(product instanceof HTMLElement)) return false;
    return getComputedStyle(brand).color !== getComputedStyle(product).color;
  })).toBe(true);
  await expect(page.locator('footer.bottom')).toBeVisible();
  await expect(page.locator('.console')).toBeVisible();
  await expect(page.locator('#interface-toggles [data-interface-domain="identity"]')).toHaveAttribute('data-enabled', 'true');
  await expect(page.locator('#acl-controls [data-acl-capability="state:write"]')).toHaveAttribute('data-enabled', 'true');
  await expect(page.locator('#signer-status')).toContainText('every sign/publish request prompts');
  await expect(page.locator('iframe')).toHaveCount(1);
  await expect(page.locator('#napplet-frame')).toHaveAttribute('sandbox', 'allow-scripts');
  await expect(page.locator('#napplet-frame')).not.toHaveAttribute('sandbox', /allow-same-origin/);

  const targetFrame = page.frameLocator('#napplet-frame');
  await expect(targetFrame.locator('#target-status')).toHaveText('shell-init received', { timeout: 15_000 });
  await expect(targetFrame.locator('#injected-domains')).toHaveText('identity,outbox,resource,keys');
  await expect(targetFrame.locator('#shell-init-type')).toHaveText('shell.init');
  await expect(targetFrame.locator('#shell-init-domains')).toContainText('relay,identity,storage,inc');
  await expect(targetFrame.locator('#shell-init-domains')).toContainText('upload,intent');
  await expect.poll(async () => targetFrame.locator('body').evaluate(() => {
    const napplet = (window as Window & {
      napplet?: { media?: unknown; shell?: { supports(domain: string): boolean; services: readonly string[] } };
    }).napplet;
    return {
      mediaReceiver: typeof napplet?.media,
      mediaSupported: napplet?.shell?.supports('media'),
      mediaService: napplet?.shell?.services.includes('media'),
    };
  })).toEqual({ mediaReceiver: 'object', mediaSupported: true, mediaService: true });
  await expect(targetFrame.locator('#service-results')).toContainText('storage.set.result');
  await expect(targetFrame.locator('#service-results')).toContainText('config.values');
  await expect(targetFrame.locator('#service-results')).toContainText('theme.get.result');
  await expect(targetFrame.locator('#service-results')).toContainText('notify.send.result');
  await expect(targetFrame.locator('#service-results')).toContainText('identity.getPublicKey.result');
  await expect(targetFrame.locator('#service-results')).toContainText('upload.upload.result');
  await expect(targetFrame.locator('#service-results')).toContainText('intent.available.result');
  await expect(targetFrame.locator('#service-results')).toContainText('cvm.discover.result');
  await expect(targetFrame.locator('#service-results')).toContainText('outbox.publish.result');
  await expect(targetFrame.locator('#identity-pubkey')).toHaveText('');
  expect(dialogMessages.filter((message) => message.includes('Paja sign request'))).toHaveLength(0);
  expect(dialogMessages.filter((message) => message.includes('Paja publish request'))).toHaveLength(0);
  await expect(page.locator('#message-log .log-row')).not.toHaveCount(0);
  await page.locator('#message-filter').fill('identity.getPublicKey');
  await expect(page.locator('#message-log .log-row')).not.toHaveCount(0);
  await expect(page.locator('#message-log .log-row').first()).toContainText('identity.getPublicKey');
  await page.locator('#message-filter').fill('');
  await expect(page.locator('#lifecycle-status')).toHaveText('Target ready');
  await expect(page.locator('#simulation-status')).toContainText('identity:anon relay:live:4 storage:local upload:memory:simulator theme:dark off:none');

  const firstLoadId = await targetFrame.locator('#load-id').textContent();
  expect(firstLoadId).toBeTruthy();

  const firstGeneration = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation ?? -1);
  await page.locator('#reload-target').focus();
  await page.locator('#reload-target').press('Enter');

  await expect(page.locator('iframe')).toHaveCount(1);
  await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation)).toBe(firstGeneration + 1);
  await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');
  await expect.poll(() => page.frames().some((frame) => frame.url() === 'about:srcdoc'), { timeout: 15_000 }).toBe(true);
  await expect(page.locator('#napplet-frame')).toHaveAttribute('data-target-url', targetServer.url);
  const reloadedFrame = page.frameLocator('#napplet-frame');
  await expect(reloadedFrame.locator('#target-status')).toHaveText('shell-init received', { timeout: 15_000 });
  const secondLoadId = await reloadedFrame.locator('#load-id').textContent();
  expect(secondLoadId).toBeTruthy();
  expect(secondLoadId).not.toBe(firstLoadId);

  const state = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
  expect(state).toMatchObject({
    generation: 1,
    status: 'ready',
    iframeCount: 1,
    initSent: true,
  });
  expect(state?.services).toEqual(expect.arrayContaining([
    'config',
    'common',
    'cvm',
    'identity',
    'intent',
    'keys',
    'media',
    'notify',
    'outbox',
    'relay',
    'resource',
    'theme',
    'upload',
  ]));

  await page.locator('#acl-controls [data-acl-capability="state:write"]').click();
  await expect(page.locator('#acl-controls [data-acl-capability="state:write"]')).toHaveAttribute('data-enabled', 'false');
  await page.locator('#reload-target').click();
  await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');
  await expect(page.frameLocator('#napplet-frame').locator('#storage-error')).toContainText('denied', { timeout: 15_000 });

  await page.locator('#interface-toggles [data-interface-domain="media"]').click();
  await expect(page.locator('#interface-toggles [data-interface-domain="media"]')).toHaveAttribute('data-enabled', 'false');
  await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');
  await expect(page.frameLocator('#napplet-frame').locator('#shell-init-domains')).not.toContainText('media', { timeout: 15_000 });
  await expect.poll(async () => page.frameLocator('#napplet-frame').locator('body').evaluate(() => {
    const napplet = (window as Window & {
      napplet?: { media?: unknown; shell?: { supports(domain: string): boolean; services: readonly string[] } };
    }).napplet;
    return {
      mediaReceiver: typeof napplet?.media,
      mediaSupported: napplet?.shell?.supports('media'),
      mediaService: napplet?.shell?.services.includes('media'),
    };
  })).toEqual({ mediaReceiver: 'undefined', mediaSupported: false, mediaService: false });
});

test('keeps desktop, phone, and 200 percent effective-viewport geometry readable', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(runtimeServer.url);
  await expect(page.locator('#lifecycle-status')).toHaveText('Target ready', { timeout: 15_000 });

  const desktop = await measurePajaLayout(page);
  expect(desktop.document.scrollWidth, JSON.stringify(desktop)).toBe(desktop.document.clientWidth);
  expect(desktop.header.height, JSON.stringify(desktop)).toBe(48);
  expect(desktop.console.width, JSON.stringify(desktop)).toBe(360);
  expect(desktop.stage.width, JSON.stringify(desktop)).toBeGreaterThan(800);
  expect(desktop.footer.height, JSON.stringify(desktop)).toBeGreaterThanOrEqual(32);
  expect(Math.min(...desktop.actionHeights), JSON.stringify(desktop)).toBeGreaterThanOrEqual(32);
  expect(desktop.fontSizes.every((size) => size >= 12), JSON.stringify(desktop)).toBe(true);
  expect(desktop.fontSizes.every((size) => [12, 14, 18, 24].includes(size)), JSON.stringify(desktop)).toBe(true);
  await expectVisibleFocusRing(page.locator('#reload-target'));
  await attachPajaScreenshot(page, testInfo, 'external-normal-desktop');

  await page.locator('#clear-log').click();
  await expect(page.locator('#message-log .log-row')).toHaveCount(0);
  await expect(page.locator('#clear-log')).toBeDisabled();
  expect(await page.locator('#message-log').evaluate((log) => getComputedStyle(log, '::before').content))
    .toBe('"No messages yet. Runtime traffic appears here."');
  const targetFrame = page.frameLocator('#napplet-frame');
  await sendFixtureMessage(targetFrame, { type: 'test.one', value: 'one' });
  await expect(page.locator('#message-log .log-row')).toHaveCount(1);
  await expect(page.locator('#clear-log')).toBeEnabled();
  await sendFixtureMessage(targetFrame, {
    type: 'test.two.error',
    error: '<strong data-log-unsafe>two</strong>',
  });
  await expect(page.locator('#message-log .log-row')).toHaveCount(2);
  await expect(page.locator('[data-log-unsafe]')).toHaveCount(0);
  await expect(page.locator('#message-log .log-row').last()).toContainText('<strong data-log-unsafe>two</strong>');

  await page.setViewportSize({ width: 375, height: 812 });
  const phone = await measurePajaLayout(page);
  expect(phone.document.scrollWidth, JSON.stringify(phone)).toBe(phone.document.clientWidth);
  expect(phone.console.height, JSON.stringify(phone)).toBe(224);
  expect(phone.console.overflowY, JSON.stringify(phone)).toBe('auto');
  expect(phone.console.scrollHeight, JSON.stringify(phone)).toBeGreaterThan(phone.console.clientHeight);
  expect(phone.stage.height, JSON.stringify(phone)).toBeGreaterThanOrEqual(320);
  expect(phone.footer.columnCount, JSON.stringify(phone)).toBe(2);
  expect(phone.footer.bottom, JSON.stringify(phone)).toBeLessThanOrEqual(phone.document.scrollHeight);
  expect(Math.min(...phone.actionHeights), JSON.stringify(phone)).toBeGreaterThanOrEqual(48);
  expect(phone.fontSizes.every((size) => size >= 12), JSON.stringify(phone)).toBe(true);
  await expectVisibleFocusRing(page.locator('#simulation-theme'));
  await attachPajaScreenshot(page, testInfo, 'external-normal-phone');

  await page.setViewportSize({ width: 640, height: 360 });
  const reflow = await measurePajaLayout(page);
  expect(reflow.document.scrollWidth, JSON.stringify(reflow)).toBe(reflow.document.clientWidth);
  expect(reflow.document.scrollHeight, JSON.stringify(reflow)).toBeGreaterThan(reflow.document.clientHeight);
  expect(reflow.footer.bottom, JSON.stringify(reflow)).toBeLessThanOrEqual(reflow.document.scrollHeight);
  expect(reflow.fontSizes.every((size) => size >= 12), JSON.stringify(reflow)).toBe(true);
  await attachPajaScreenshot(page, testInfo, 'external-200-percent-reflow');
});

test('keeps a 160-character target accessible and bounded on phone', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const longTarget = `${targetServer.url}?target=${'x'.repeat(160)}`;
  const longRuntime = await startPajaServer({
    options: { targetUrl: longTarget, port: 0 },
    now: new Date('2026-07-31T00:00:00.000Z'),
  });
  try {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(longRuntime.url);
    await expect(page.locator('#lifecycle-status')).toHaveText('Target ready', { timeout: 15_000 });
    const normalizedTarget = await page.locator('.target').textContent();
    expect(normalizedTarget?.length).toBeGreaterThanOrEqual(160);
    await expect(page.locator('.target')).toHaveAttribute('title', normalizedTarget ?? '');
    await expect(page.locator('.target')).toHaveAttribute('aria-label', normalizedTarget ?? '');
    const targetMetrics = await page.locator('.target').evaluate((target) => ({
      height: target.getBoundingClientRect().height,
      lineHeight: parseFloat(getComputedStyle(target).lineHeight),
      documentWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
    }));
    expect(targetMetrics.height, JSON.stringify(targetMetrics)).toBeLessThanOrEqual(targetMetrics.lineHeight * 2);
    expect(targetMetrics.documentScrollWidth, JSON.stringify(targetMetrics)).toBe(targetMetrics.documentWidth);
    await attachPajaScreenshot(page, testInfo, 'external-long-target-phone');
  } finally {
    await longRuntime.close();
  }
});

test('applies simulation config and compact theme adjustment', async ({ page }) => {
  test.setTimeout(60_000);
  const pubkey = '4'.repeat(64);
  const customTargetUrl = `${targetServer.url}?required=identity,resource,keys,theme`;
  const customRuntime = await startPajaServer({
    options: {
      targetUrl: customTargetUrl,
      port: 0,
      simulation: {
        identity: { mode: 'fixed', pubkey },
        relay: { mode: 'disabled' },
        capabilities: { domains: { relay: false, outbox: false } },
        theme: { mode: 'light' },
        config: { values: { density: 'compact' } },
      },
    },
    now: new Date('2026-06-21T00:00:00.000Z'),
  });

  try {
    await page.goto(customRuntime.url);
    await expect(page.locator('#simulation-status')).toContainText('identity:fixed relay:off');
    await expect(page.locator('#simulation-status')).toContainText('theme:light');

    const targetFrame = page.frameLocator('#napplet-frame');
    await expect(targetFrame.locator('#target-status')).toHaveText('shell-init received');
    await expect(targetFrame.locator('#shell-init-domains')).not.toContainText('relay');
    await expect(targetFrame.locator('#shell-init-domains')).not.toContainText('outbox');
    await expect(targetFrame.locator('#identity-pubkey')).toHaveText(pubkey);
    await expect(targetFrame.locator('#config-density')).toHaveText('compact');
    await expect(targetFrame.locator('#theme-background')).toHaveText('#f7f5ed');
    await expect(targetFrame.locator('#theme-changed-count')).toHaveText('0');
    await expect(targetFrame.locator('#theme-changed-background')).toHaveText('');
    await expect(targetFrame.locator('#theme-callback-get-background')).toHaveText('');
    const themeChangedBefore = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.direction === 'shell->napplet' && entry.type === 'theme.changed').length ?? 0);
    const themeSubscriptionsBefore = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.direction === 'napplet->shell' && /^theme\.(subscribe|unsubscribe)$/.test(entry.type)).length ?? 0);

    await page.locator('#simulation-theme').selectOption('dark');
    await expect(page.locator('#simulation-status')).toContainText('theme:dark');
    await expect(targetFrame.locator('#theme-changed-count')).toHaveText('1');
    await expect(targetFrame.locator('#theme-changed-background')).toHaveText('#101211');
    await expect(targetFrame.locator('#theme-callback-get-background')).toHaveText('#101211');
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.direction === 'shell->napplet' && entry.type === 'theme.changed').length ?? 0)).toBe(themeChangedBefore + 1);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.direction === 'napplet->shell' && /^theme\.(subscribe|unsubscribe)$/.test(entry.type)).length ?? 0)).toBe(themeSubscriptionsBefore);
    const firstGeneration = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation ?? -1);
    await page.locator('#reload-target').click();
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation)).toBe(firstGeneration + 1);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');
    await expect.poll(() => page.frames().some((frame) => frame.url() === 'about:srcdoc'), { timeout: 15_000 }).toBe(true);
    await expect(page.locator('#napplet-frame')).toHaveAttribute('data-target-url', customTargetUrl);
    const reloadedFrame = page.frameLocator('#napplet-frame');
    await expect(reloadedFrame.locator('#target-status')).toHaveText('shell-init received', { timeout: 15_000 });
    await expect(reloadedFrame.locator('#theme-background')).toHaveText('#101211', { timeout: 15_000 });
  } finally {
    await customRuntime.close();
  }
});

test('shows error details and routes signing through NIP-07', async ({ page }) => {
  test.setTimeout(60_000);
  const pubkey = '7'.repeat(64);
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });
  await page.addInitScript((signerPubkey) => {
    const signedEvents: unknown[] = [];
    const host = window as unknown as {
      nostr?: unknown;
      __pajaTestSignerEvents?: unknown[];
    };
    host.__pajaTestSignerEvents = signedEvents;
    host.nostr = {
      getPublicKey: async () => signerPubkey,
      getRelays: async () => ({ 'wss://relay.test': { read: true, write: true } }),
      signEvent: async (event: Record<string, unknown>) => {
        signedEvents.push(event);
        return {
          ...event,
          id: '8'.repeat(64),
          pubkey: signerPubkey,
          sig: '9'.repeat(128),
          kind: typeof event.kind === 'number' ? event.kind : 1,
          tags: Array.isArray(event.tags) ? event.tags : [],
          content: typeof event.content === 'string' ? event.content : '',
          created_at: typeof event.created_at === 'number' ? event.created_at : Math.floor(Date.now() / 1000),
        };
      },
    };
  }, pubkey);

  await page.goto(runtimeServer.url);
  await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');

  await page.locator('#signer-nip07').click();
  await expect(page.locator('#signer-status')).toContainText('NIP-07 connected');
  await expect(page.locator('#signer-status')).toContainText(pubkey);
  await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().signer.method)).toBe('nip07');
  await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');

  const targetFrame = page.frameLocator('#napplet-frame');
  await expect(targetFrame.locator('#identity-pubkey')).toHaveText(pubkey, { timeout: 15_000 });
  await expect.poll(async () => page.evaluate(() => {
    const host = window as unknown as { __pajaTestSignerEvents?: unknown[] };
    return host.__pajaTestSignerEvents?.length ?? 0;
  })).toBeGreaterThan(0);

  await targetFrame.locator('body').evaluate(() => {
    window.parent.postMessage({
      type: 'resource.info.error',
      id: 'manual-error',
      error: 'visible boom',
    }, '*');
  });
  await page.locator('#message-filter').fill('visible boom');
  await expect(page.locator('#message-log')).toContainText('resource.info.error');
  await expect(page.locator('#message-log .log-row[data-error="true"]')).toContainText('visible boom');
});

test('routes standard identity follows and OUTBOX profile queries without a target-CORS false positive', async ({ page }) => {
  test.setTimeout(60_000);
  const accountSecret = generateSecretKey();
  const followedSecret = generateSecretKey();
  const accountPubkey = getPublicKey(accountSecret);
  const followedPubkey = getPublicKey(followedSecret);
  const contactList = finalizeEvent({
    kind: 3,
    created_at: 1_700_000_000,
    tags: [['p', followedPubkey]],
    content: '',
  }, accountSecret);
  const profile = finalizeEvent({
    kind: 0,
    created_at: 1_700_000_001,
    tags: [],
    content: JSON.stringify({ name: 'followed fixture' }),
  }, followedSecret);
  const socialRuntime = await startPajaServer({
    options: {
      targetUrl: `${targetServer.url}?manualTraffic=1`,
      port: 0,
      simulation: {
        relay: {
          mode: 'memory',
          fixtures: [contactList, profile],
        },
      },
    },
    now: new Date('2026-06-21T00:00:00.000Z'),
  });

  try {
    await page.goto(socialRuntime.url);
    await expect.poll(() => targetServer.requestOrigins.includes('null')).toBe(true);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');
    await page.evaluate((pubkey) => {
      const host = window as Window & { nostr?: unknown };
      host.nostr = {
        getPublicKey: async () => pubkey,
        getRelays: async () => ({ 'wss://relay.test': { read: true, write: true } }),
        signEvent: async (event: Record<string, unknown>) => ({
          ...event,
          id: '8'.repeat(64),
          pubkey,
          sig: '9'.repeat(128),
          kind: typeof event.kind === 'number' ? event.kind : 1,
          tags: Array.isArray(event.tags) ? event.tags : [],
          content: typeof event.content === 'string' ? event.content : '',
          created_at: typeof event.created_at === 'number' ? event.created_at : Math.floor(Date.now() / 1000),
        }),
      };
    }, accountPubkey);
    await page.locator('#signer-nip07').click();
    await expect(page.locator('#signer-status')).toContainText('NIP-07 connected');
    await expect(page.locator('#signer-status')).toContainText(accountPubkey);

    const corsErrorLogged = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .some((entry) => entry.type === 'paja.target.cors.error') ?? false);
    expect(corsErrorLogged).toBe(false);

    const frame = page.frameLocator('#napplet-frame');
    await expect(frame.locator('#target-status')).toHaveText('shell-init received', { timeout: 15_000 });
    await sendFixtureMessage(frame, { type: 'identity.getPublicKey', id: 'social-pubkey' });
    await expect.poll(() => readFixtureMessage(frame, 'identity.getPublicKey.result', 'social-pubkey')).toMatchObject({
      pubkey: accountPubkey,
    });

    await sendFixtureMessage(frame, { type: 'identity.getFollows', id: 'social-follows' });
    await expect.poll(() => readFixtureMessage(frame, 'identity.getFollows.result', 'social-follows')).toMatchObject({
      pubkeys: [followedPubkey],
    });

    await sendFixtureMessage(frame, {
      type: 'outbox.query',
      id: 'social-profile',
      filters: [{ kinds: [0], authors: [followedPubkey] }],
      options: { authors: [followedPubkey] },
    });
    await expect.poll(() => readFixtureMessage(frame, 'outbox.query.result', 'social-profile')).toMatchObject({
      events: [expect.objectContaining({ event: expect.objectContaining({ id: profile.id, kind: 0 }) })],
    });
  } finally {
    await socialRuntime.close();
  }
});

test('stores disclosed bytes through a signed Blossom upload and fails closed on denial or incomplete proof', async ({ page }) => {
  test.setTimeout(60_000);
  const blossom = await startBlossomServer();
  const uploadTargetUrl = `${targetServer.url}?required=upload&manualTraffic=1`;
  const uploadRuntime = await startPajaServer({
    options: {
      targetUrl: uploadTargetUrl,
      port: 0,
      simulation: {
        relay: { mode: 'disabled' },
        capabilities: { domains: { relay: false, outbox: false } },
        upload: {
          mode: 'blossom',
          servers: [blossom.url],
          maxBytes: 1024,
          mimeTypes: ['application/octet-stream'],
        },
      },
    },
    now: new Date('2026-06-21T00:00:00.000Z'),
  });
  const dialogs: string[] = [];
  let denyNextUpload = false;
  let putsBeforeConsent = 0;
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    if (dialog.message().includes('Paja upload request')) {
      expect(blossom.puts).toHaveLength(putsBeforeConsent);
      expect(dialog.message()).toContain('dev-target');
      expect(dialog.message()).toContain('application/octet-stream');
      expect(dialog.message()).toContain(blossom.url);
      expect(dialog.message()).toContain('public and durable');
      if (denyNextUpload) {
        denyNextUpload = false;
        await dialog.dismiss();
        return;
      }
    }
    await dialog.accept();
  });

  try {
    await page.goto(uploadRuntime.url);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');
    await page.locator('#signer-dev').click();
    await expect(page.locator('#signer-status')).toContainText('dev connected');
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');

    const frame = page.frameLocator('#napplet-frame');
    await expect(frame.locator('#target-status')).toHaveText('shell-init received', { timeout: 15_000 });
    await sendFixtureMessage(frame, { type: 'upload.info', id: 'info-1' });
    await expect.poll(() => readFixtureMessage(frame, 'upload.info.result', 'info-1')).toMatchObject({
      info: {
        rails: [{ rail: 'blossom', enabled: true, returns: ['http'] }],
        maxBytes: 1024,
        mimeTypes: ['application/octet-stream'],
      },
    });
    expect(blossom.requestMethods).toEqual([]);

    const bytes = [0, 1, 2, 3, 254, 255];
    const expectedSha = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    await sendUploadMessage(frame, 'real-upload', bytes);
    await expect.poll(() => readFixtureMessage(frame, 'upload.upload.result', 'real-upload')).toMatchObject({
      result: {
        ok: true,
        status: 'complete',
        rail: 'blossom',
        url: `${blossom.url}/${expectedSha}`,
        sha256: expectedSha,
        size: bytes.length,
        mimeType: 'application/octet-stream',
        nip94: [
          ['url', `${blossom.url}/${expectedSha}`],
          ['m', 'application/octet-stream'],
          ['x', expectedSha],
          ['size', String(bytes.length)],
        ],
      },
    });
    expect(blossom.puts).toHaveLength(1);
    expect([...blossom.puts[0]!.bytes]).toEqual(bytes);
    expect(blossom.puts[0]!.contentType).toBe('application/octet-stream');
    const authEvent = decodeNostrAuthorization(blossom.puts[0]!.authorization);
    expect(verifyEvent(authEvent as Parameters<typeof verifyEvent>[0])).toBe(true);
    expect(authEvent.kind).toBe(24_242);
    expect(authEvent.tags).toContainEqual(['t', 'upload']);
    expect(authEvent.tags).toContainEqual(['x', expectedSha]);
    expect(Number(authEvent.tags.find((tag) => tag[0] === 'expiration')?.[1])).toBeGreaterThan(authEvent.created_at);

    putsBeforeConsent = 1;
    denyNextUpload = true;
    await sendUploadMessage(frame, 'denied-upload', [9, 9]);
    await expect.poll(() => readFixtureMessage(frame, 'upload.upload.result', 'denied-upload')).toMatchObject({
      result: { ok: false, status: 'cancelled', error: 'user cancelled' },
    });
    expect(blossom.puts).toHaveLength(1);

    blossom.omitSizeOnce();
    await sendUploadMessage(frame, 'missing-size', [7, 8, 9]);
    await expect.poll(() => readFixtureMessage(frame, 'upload.upload.result', 'missing-size')).toMatchObject({
      result: { ok: false, status: 'failed', error: 'server returned invalid size' },
    });
    expect(blossom.puts).toHaveLength(2);
    expect(dialogs.filter((message) => message.includes('Paja upload request'))).toHaveLength(3);
    expect(dialogs.filter((message) => message.includes('Paja sign request'))).toHaveLength(2);
  } finally {
    await uploadRuntime.close();
    await blossom.close();
  }
});

test('boots modern injected-domain targets through mandatory NAP-SHELL', async ({ page }) => {
  test.setTimeout(60_000);
  const modernRuntime = await startPajaServer({
    options: {
      targetUrl: `${targetServer.url}?shellReady=0&required=identity,keys`,
      port: 0,
    },
    now: new Date('2026-06-21T00:00:00.000Z'),
  });

  try {
    await page.goto(modernRuntime.url);

    const targetFrame = page.frameLocator('#napplet-frame');
    await expect(targetFrame.locator('#injected-domains')).toHaveText('identity,keys');
    await expect.poll(async () => targetFrame.locator('body').evaluate(() => {
      const shell = (window as Window & {
        napplet?: { shell?: Record<string, unknown> };
      }).napplet?.shell;
      return typeof shell?.ready === 'function'
        && typeof shell.supports === 'function'
        && typeof shell.onReady === 'function'
        && Array.isArray(shell.services);
    })).toBe(true);
    await expect(targetFrame.locator('#target-status')).toHaveText('napplet namespace ready', { timeout: 15_000 });
    await expect(targetFrame.locator('#identity-pubkey')).toHaveText('');
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');

    const state = await page.evaluate(() => window.__KEHTO_PAJA__?.getState());
    expect(state).toMatchObject({
      status: 'ready',
      initSent: true,
    });
  } finally {
    await modernRuntime.close();
  }
});

test('keeps canonical INC protected through the real shim assignment in an opaque Paja srcdoc', async ({ page }) => {
  test.setTimeout(120_000);
  const incRuntime = await startPajaServer({
    options: {
      targetUrl: `${targetServer.url}?incProbe=1`,
      port: 0,
    },
    now: new Date('2026-06-21T00:00:00.000Z'),
  });

  try {
    await page.goto(incRuntime.url);
    const frame = page.frameLocator('#napplet-frame');
    await expect(frame.locator('#target-status')).toHaveText('shell-init received', { timeout: 15_000 });
    await expect(frame.locator('#inc-shim-status')).toHaveText('protected callable');
    await expect(frame.locator('#inc-emit-topic')).toHaveText('napplet:phase102/probe');
    await expect(frame.locator('#inc-emit-payload')).toHaveText('{"value":"a b","plus":"a+b"}');
    await expect(frame.locator('#inc-emit-return')).toHaveText('undefined');
    await expect(frame.locator('#inc-channel-list')).toHaveText('empty');
    await expect(frame.locator('#inc-channel-open')).toHaveText('target not found');
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().messageLog
      .filter((entry) => entry.type === 'inc.emit')
      .map((entry) => entry.preview) ?? [])).toEqual([
      '{"type":"inc.emit","topic":"napplet:phase102/probe","payload":{"value":"a b","plus":"a+b"}}',
    ]);

    await sendIncEvent(page, { value: 'delivered' });
    await expect(frame.locator('#inc-event')).toHaveText('napplet:phase102/probe|paja-parent|{"value":"delivered"}');
    await expect(frame.locator('#inc-callback-count')).toHaveText('1');

    const firstLoadId = await frame.locator('#load-id').textContent();
    const firstGeneration = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation ?? -1);
    await page.locator('#reload-target').click();
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation)).toBe(firstGeneration + 1);
    await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().status)).toBe('ready');
    const reloadedFrame = page.frameLocator('#napplet-frame');
    await expect(reloadedFrame.locator('#target-status')).toHaveText('shell-init received', { timeout: 15_000 });
    expect(await reloadedFrame.locator('#load-id').textContent()).not.toBe(firstLoadId);
    await expect(reloadedFrame.locator('#inc-shim-status')).toHaveText('protected callable');
    await expect(reloadedFrame.locator('#inc-callback-count')).toHaveText('0');

    await sendIncEvent(page, { value: 'fresh' });
    await expect(reloadedFrame.locator('#inc-event')).toHaveText('napplet:phase102/probe|paja-parent|{"value":"fresh"}');
    await expect(reloadedFrame.locator('#inc-callback-count')).toHaveText('1');
  } finally {
    await incRuntime.close();
  }
});

async function measurePajaLayout(page: Page) {
  return page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing layout element: ${selector}`);
      const bounds = element.getBoundingClientRect();
      return {
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      };
    };
    const consoleElement = document.querySelector<HTMLElement>('.console');
    const footerElement = document.querySelector<HTMLElement>('footer.bottom');
    if (!consoleElement || !footerElement) throw new Error('Missing Paja console or footer');
    const visible = (element: Element) => element.getClientRects().length > 0;
    const fontSizes = [
      '.brand',
      '.target',
      '#lifecycle-status',
      '.section-title',
      '.console button',
      '.console input',
      '.signer',
      '.log-row',
      'footer.bottom',
    ].flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)])
      .filter(visible)
      .map((element) => parseFloat(getComputedStyle(element).fontSize));
    const actionHeights = [...document.querySelectorAll<HTMLElement>('button, input, select, summary')]
      .filter(visible)
      .map((element) => element.getBoundingClientRect().height);
    const footerStyle = getComputedStyle(footerElement);
    const footerColumns = footerStyle.gridTemplateColumns === 'none'
      ? []
      : footerStyle.gridTemplateColumns.split(/\s+/).filter(Boolean);
    return {
      document: {
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      header: rect('header.top'),
      console: {
        ...rect('.console'),
        clientHeight: consoleElement.clientHeight,
        scrollHeight: consoleElement.scrollHeight,
        overflowY: getComputedStyle(consoleElement).overflowY,
      },
      stage: rect('#napplet-stage'),
      footer: {
        ...rect('footer.bottom'),
        columnCount: footerColumns.length,
      },
      actionHeights,
      fontSizes,
    };
  });
}

async function expectVisibleFocusRing(locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  const focus = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      top: bounds.top,
      bottom: bounds.bottom,
      viewportHeight: window.innerHeight,
    };
  });
  expect(focus.outlineWidth, JSON.stringify(focus)).toBe('2px');
  expect(focus.outlineOffset, JSON.stringify(focus)).toBe('4px');
  expect(focus.bottom, JSON.stringify(focus)).toBeGreaterThan(0);
  expect(focus.top, JSON.stringify(focus)).toBeLessThan(focus.viewportHeight);
}

async function attachPajaScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot({ animations: 'disabled', fullPage: true }),
    contentType: 'image/png',
  });
}

async function attachViewportEvidence(
  page: Page,
  testInfo: TestInfo,
  state: string,
): Promise<void> {
  for (const viewport of [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'phone', width: 375, height: 812 },
  ] as const) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await attachPajaScreenshot(page, testInfo, `${state}-${viewport.name}`);
  }
}

async function startTargetServer(): Promise<TargetServer> {
  let loadCount = 0;
  let htmlRequestCount = 0;
  const requestOrigins: string[] = [];
  const failures: Array<{ readonly message: string; readonly hold: boolean }> = [];
  let corsAllowed = true;
  let externalModule = false;
  let moduleCorsAllowed = true;
  let releaseHeldFailure: (() => void) | null = null;
  const server = createServer((request, response) => {
    requestOrigins.push(typeof request.headers.origin === 'string' ? request.headers.origin : '');
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (requestUrl.pathname === '/shim-prelude.js') {
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': 'text/javascript; charset=utf-8',
      });
      response.end(shimPrelude);
      return;
    }
    if (requestUrl.pathname === '/entry.js') {
      response.writeHead(200, {
        ...(moduleCorsAllowed ? { 'access-control-allow-origin': '*' } : {}),
        'cache-control': 'no-store',
        'content-type': 'text/javascript; charset=utf-8',
      });
      response.end("document.documentElement.dataset.pajaModule = 'loaded';");
      return;
    }
    if (requestUrl.pathname !== '/') {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    if (typeof request.headers.origin !== 'string') {
      htmlRequestCount += 1;
      const failure = failures.shift();
      if (failure) {
        const respond = () => {
          (response as typeof response & { statusMessage: string }).statusMessage = failure.message;
          response.writeHead(503, {
            'access-control-allow-origin': '*',
            'cache-control': 'no-store',
            'content-type': 'text/plain; charset=utf-8',
          });
          response.end(failure.message);
        };
        if (failure.hold) releaseHeldFailure = respond;
        else respond();
        return;
      }
    }

    loadCount += 1;
    response.writeHead(200, {
      ...(corsAllowed ? { 'access-control-allow-origin': '*' } : {}),
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
    });
    response.end(renderTargetHtml(loadCount, {
      requiredDomains: readRequiredDomains(requestUrl),
      shellReady: requestUrl.searchParams.get('shellReady') !== '0',
      manualTraffic: requestUrl.searchParams.get('manualTraffic') === '1',
      incProbe: requestUrl.searchParams.get('incProbe') === '1',
      externalModule,
    }));
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (typeof address !== 'object' || address === null) {
    throw new Error('Target server did not bind to a TCP port.');
  }

  return {
    url: `http://127.0.0.1:${address.port}/`,
    requestOrigins,
    get htmlRequestCount() {
      return htmlRequestCount;
    },
    failNext(message, options) {
      failures.push({ message, hold: options?.hold === true });
    },
    setCorsAllowed(allowed) {
      corsAllowed = allowed;
    },
    setExternalModule(enabled) {
      externalModule = enabled;
    },
    setModuleCorsAllowed(allowed) {
      moduleCorsAllowed = allowed;
    },
    releaseHeldFailure() {
      const release = releaseHeldFailure;
      releaseHeldFailure = null;
      release?.();
    },
    close: () => new Promise((resolve, reject) => {
      const release = releaseHeldFailure;
      releaseHeldFailure = null;
      release?.();
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    }),
  };
}

function readRequiredDomains(url: URL): string[] {
  const raw = url.searchParams.get('required');
  if (!raw) return ['identity', 'outbox', 'resource', 'keys'];
  return raw.split(',').map((domain) => domain.trim()).filter(Boolean);
}

function renderTargetHtml(
  loadCount: number,
  options: {
    requiredDomains: readonly string[];
    shellReady: boolean;
    manualTraffic: boolean;
    incProbe: boolean;
    externalModule: boolean;
  },
): string {
  const requiredDomainsJson = JSON.stringify(options.requiredDomains);
  const shellReadyJson = JSON.stringify(options.shellReady);
  const manualTrafficJson = JSON.stringify(options.manualTraffic);
  const incProbeJson = JSON.stringify(options.incProbe);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Kehto Paja fixture</title>
    ${options.externalModule ? '<script type="module" src="/entry.js"></script>' : ''}
  </head>
  <body>
    <div id="target-status">booting</div>
    <div id="injected-domains"></div>
    <div id="load-id">${loadCount}</div>
    <div id="shell-init-type"></div>
    <div id="shell-init-domains"></div>
    <div id="service-results"></div>
    <div id="identity-pubkey"></div>
    <div id="config-density"></div>
    <div id="theme-background"></div>
    <div id="theme-changed-count">0</div>
    <div id="theme-changed-background"></div>
    <div id="theme-callback-get-background"></div>
    <div id="storage-error"></div>
    <div id="inc-shim-status"></div>
    <div id="inc-emit-topic"></div>
    <div id="inc-emit-payload"></div>
    <div id="inc-emit-return"></div>
    <div id="inc-event"></div>
    <div id="inc-callback-count"></div>
    <div id="inc-channel-list"></div>
    <div id="inc-channel-open"></div>
    ${options.incProbe ? `<script src="/shim-prelude.js"></script>
    <script>window.NappletShimPrelude.install({ domains: ${requiredDomainsJson} });</script>` : ''}
    <script>
      const seenTypes = new Set();
      const pajaTestMessages = [];
      window.__pajaTestMessages = pajaTestMessages;
      window.__sendPajaMessage = (message) => window.parent.postMessage(message, '*');
      const serviceResults = document.getElementById('service-results');
      const requiredDomains = ${requiredDomainsJson};
      const injectedDomains = requiredDomains.filter((domain) =>
        window.napplet && typeof window.napplet[domain] === 'object'
      );
      document.getElementById('injected-domains').textContent = injectedDomains.join(',');
      if (injectedDomains.length !== requiredDomains.length) {
        document.getElementById('target-status').textContent = 'Required shell domains unavailable';
        throw new Error('Required shell domains unavailable');
      }
      const theme = window.napplet && window.napplet.theme;
      let themeChangedCount = 0;
      if (theme && typeof theme.onChanged === 'function' && typeof theme.get === 'function') {
        theme.onChanged((changedTheme) => {
          themeChangedCount += 1;
          document.getElementById('theme-changed-count').textContent = String(themeChangedCount);
          document.getElementById('theme-changed-background').textContent = changedTheme && changedTheme.colors && changedTheme.colors.background || '';
          void theme.get().then((currentTheme) => {
            document.getElementById('theme-callback-get-background').textContent = currentTheme && currentTheme.colors && currentTheme.colors.background || '';
          });
        });
      }
      const sendShellReady = ${shellReadyJson};
      const incProbe = ${incProbeJson};
      let incCallbackCount = 0;
      function runIncProbe() {
        const inc = window.napplet && window.napplet.inc;
        const protectedInc = inc
          && typeof inc.emit === 'function'
          && typeof inc.on === 'function'
          && inc.channel
          && typeof inc.channel.list === 'function'
          && typeof inc.channel.open === 'function';
        document.getElementById('inc-shim-status').textContent = protectedInc ? 'protected callable' : 'missing protected INC';
        if (!protectedInc) return;
        inc.on('napplet:phase102/probe', (event) => {
          incCallbackCount += 1;
          document.getElementById('inc-event').textContent = [event.topic, event.sender, JSON.stringify(event.payload)].join('|');
          document.getElementById('inc-callback-count').textContent = String(incCallbackCount);
        });
        const emitResult = inc.emit('napplet:phase102/probe?value=a%20b&plus=a+b');
        document.getElementById('inc-emit-topic').textContent = 'napplet:phase102/probe';
        document.getElementById('inc-emit-payload').textContent = '{"value":"a b","plus":"a+b"}';
        document.getElementById('inc-emit-return').textContent = String(emitResult);
        document.getElementById('inc-callback-count').textContent = String(incCallbackCount);
        void inc.channel.list().then((channels) => {
          document.getElementById('inc-channel-list').textContent = channels.length === 0 ? 'empty' : 'unexpected channels';
        });
        void inc.channel.open('missing-paja-peer').then(
          () => { document.getElementById('inc-channel-open').textContent = 'unexpected open'; },
          (error) => { document.getElementById('inc-channel-open').textContent = error instanceof Error ? error.message : String(error); },
        );
      }
      function renderResult(message) {
        pajaTestMessages.push(message);
        const type = message.type;
        seenTypes.add(type);
        serviceResults.textContent = Array.from(seenTypes).sort().join(',');
        if (type === 'identity.getPublicKey.result') {
          document.getElementById('identity-pubkey').textContent = message.pubkey || '';
        }
        if (type === 'config.values') {
          document.getElementById('config-density').textContent = message.values && message.values.density || '';
        }
        if (type === 'theme.get.result') {
          document.getElementById('theme-background').textContent = message.theme && message.theme.colors && message.theme.colors.background || '';
        }
        if (type === 'storage.set.result') {
          document.getElementById('storage-error').textContent = message.error || '';
        }
      }
      function sendServiceTraffic() {
        const bytes = new TextEncoder().encode('kehto-paja').buffer;
        const messages = [
          { type: 'storage.set', id: 'storage-1', key: 'phase', value: '92' },
          { type: 'config.get', id: 'config-1' },
          { type: 'theme.get', id: 'theme-1' },
          { type: 'notify.send', id: 'notify-1', title: 'hello from fixture' },
          { type: 'identity.getPublicKey', id: 'identity-1' },
          { type: 'upload.upload', id: 'upload-1', request: { data: bytes, mimeType: 'text/plain', filename: 'paja.txt' } },
          { type: 'intent.available', id: 'intent-1', archetype: 'paja-target' },
          { type: 'cvm.discover', id: 'cvm-1' },
          { type: 'outbox.publish', id: 'outbox-1', event: { kind: 1, content: 'hello from paja fixture', tags: [] } },
        ];
        for (const message of messages) window.parent.postMessage(message, '*');
      }
      let shellInitialized = false;
      function handleShellInit(environment) {
        if (shellInitialized) return;
        shellInitialized = true;
        document.getElementById('shell-init-type').textContent = 'shell.init';
        document.getElementById('shell-init-domains').textContent = environment.capabilities.domains.join(',');
        document.getElementById('target-status').textContent = 'shell-init received';
        if (!${manualTrafficJson}) sendServiceTraffic();
        if (incProbe) runIncProbe();
      }
      if (sendShellReady) {
        window.addEventListener('message', (event) => {
          if (!event.data || typeof event.data.type !== 'string') return;
          if (event.data.type === 'shell.init') {
            handleShellInit(event.data);
            return;
          }
          renderResult(event.data);
        });
        if (incProbe) window.napplet.shell.onReady(handleShellInit);
        window.parent.postMessage({ type: 'shell.ready' }, '*');
      } else {
        window.napplet.identity.getPublicKey()
          .then((pubkey) => {
            document.getElementById('identity-pubkey').textContent = pubkey || '';
            document.getElementById('target-status').textContent = 'napplet namespace ready';
          })
          .catch((error) => {
            document.getElementById('target-status').textContent = error instanceof Error ? error.message : String(error);
          });
      }
    </script>
  </body>
</html>`;
}

async function sendFixtureMessage(frame: FrameLocator, message: Record<string, unknown>): Promise<void> {
  await frame.locator('body').evaluate((_body, payload) => {
    const fixtureWindow = window as Window & {
      __sendPajaMessage?: (message: Record<string, unknown>) => void;
    };
    fixtureWindow.__sendPajaMessage?.(payload);
  }, message);
}

async function sendIncEvent(page: Page, payload: Record<string, unknown>): Promise<void> {
  await page.locator('#napplet-frame').evaluate((frame, eventPayload) => {
    if (!(frame instanceof HTMLIFrameElement)) throw new Error('Missing Paja iframe.');
    frame.contentWindow?.postMessage({
      type: 'inc.event',
      topic: 'napplet:phase102/probe',
      sender: 'paja-parent',
      payload: eventPayload,
    }, '*');
  }, payload);
}

async function sendUploadMessage(frame: FrameLocator, id: string, bytes: number[]): Promise<void> {
  await frame.locator('body').evaluate((_body, payload) => {
    const fixtureWindow = window as Window & {
      __sendPajaMessage?: (message: Record<string, unknown>) => void;
    };
    fixtureWindow.__sendPajaMessage?.({
      type: 'upload.upload',
      id: payload.id,
      request: {
        data: new Uint8Array(payload.bytes).buffer,
        filename: `${payload.id}.bin`,
        mimeType: 'application/octet-stream',
      },
    });
  }, { id, bytes });
}

async function readFixtureMessage(
  frame: FrameLocator,
  type: string,
  id: string,
): Promise<Record<string, unknown> | null> {
  return frame.locator('body').evaluate((_body, expected) => {
    const messages = (window as Window & {
      __pajaTestMessages?: Array<Record<string, unknown>>;
    }).__pajaTestMessages ?? [];
    return messages.find((message) => message.type === expected.type && message.id === expected.id) ?? null;
  }, { type, id });
}

function decodeNostrAuthorization(value: string): {
  readonly kind: number;
  readonly created_at: number;
  readonly tags: string[][];
  readonly [key: string]: unknown;
} {
  expect(value).toMatch(/^Nostr /);
  return JSON.parse(Buffer.from(value.slice('Nostr '.length), 'base64').toString('utf8')) as {
    kind: number;
    created_at: number;
    tags: string[][];
  };
}

async function startBlossomServer(): Promise<BlossomTestServer> {
  const puts: BlossomPut[] = [];
  const requestMethods: string[] = [];
  let omitSize = false;
  let url = '';
  const server = createServer((request, response) => {
    requestMethods.push(request.method ?? 'UNKNOWN');
    response.setHeader('access-control-allow-origin', '*');
    response.setHeader('access-control-allow-methods', 'PUT, OPTIONS');
    response.setHeader('access-control-allow-headers', 'authorization, content-type');
    if (request.method === 'OPTIONS') {
      response.writeHead(204);
      response.end();
      return;
    }
    if (request.method !== 'PUT' || request.url !== '/upload') {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('Not found');
      return;
    }
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      const bytes = Buffer.concat(chunks);
      const authorization = String(request.headers.authorization ?? '');
      const contentType = String(request.headers['content-type'] ?? '');
      puts.push({ bytes, authorization, contentType });
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      const descriptor = {
        url: `${url}/${sha256}`,
        sha256,
        ...(!omitSize ? { size: bytes.byteLength } : {}),
        type: contentType,
      };
      omitSize = false;
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(descriptor));
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  const address = server.address();
  if (typeof address !== 'object' || address === null) {
    throw new Error('Blossom server did not bind to a TCP port.');
  }
  url = `http://127.0.0.1:${address.port}`;
  return {
    url,
    puts,
    requestMethods,
    omitSizeOnce() {
      omitSize = true;
    },
    close: () => new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    }),
  };
}
