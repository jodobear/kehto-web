/**
 * theme-broadcast.spec.ts — E2E-07 (theme-broadcast subset, Phase 20 NAP-08).
 *
 * Full round-trip: host #theme-dark-btn click (theme-switcher-host.ts, task
 * 260616-8iv) → preferences.applyTheme → relay.publishTheme (theme) →
 * shell-bridge fan-out theme.changed to every napplet → preferences observer
 * (Plan 20-05) updates document.body.backgroundColor + #preferences-theme-applied
 * textContent.
 *
 * The Dark button is now a host-side element (no sandbox boundary), so Playwright
 * can click it directly on the page without frame evaluation tricks.
 *
 * The DARK_THEME preset has:
 *   colors.background: '#0a0a0a' (DARK_BG_HEX)
 * Chromium-normalizes '#0a0a0a' to 'rgb(10, 10, 10)' in getComputedStyle (DARK_BG_RGB).
 *
 * Serial mode prevents postMessage timing interference when multiple napplet specs run in the
 * same Playwright worker.
 */
import { test, expect, type Frame } from '@playwright/test';
import { demoBeforeEach, getNappletFrame } from './helpers/index.js';

test.use({ baseURL: process.env.KEHTO_PLAYGROUND_BASE_URL ?? 'http://localhost:4174' });
test.describe.configure({ mode: 'serial' });

const ANTI_TERM_RE = /window\.nostr|signer-service|BusKind|AUTH_KIND|kind === 2900[12]/;

const DARK_BG_HEX = '#0a0a0a';
const DARK_BG_RGB = 'rgb(10, 10, 10)';
const LIGHT_BG_RGB = 'rgb(250, 250, 250)';
const ALLOWED_FONT_SIZES = [12, 14, 18, 24];
const ALLOWED_FONT_WEIGHTS = [400, 600];
const RECOVERY_COPY_RE = /\b(?:retry|reconnect)\b/i;

type FeedFixture = 'empty' | 'loading' | 'error' | 'one' | 'many';
type ProfileFixture = 'empty' | 'loading' | 'error' | 'partial' | 'populated';

async function projectFeedFixture(frame: Frame, fixture: FeedFixture): Promise<void> {
  await frame.evaluate((state) => {
    const status = document.getElementById('feed-status');
    const list = document.getElementById('feed-list');
    if (!status || !list) throw new Error('feed fixture surface missing');

    const setStatus = (text: string, tone: 'neutral' | 'success' | 'danger') => {
      status.textContent = text;
      status.dataset['tone'] = tone;
    };
    list.replaceChildren();
    if (state === 'loading') {
      setStatus('loading', 'neutral');
      return;
    }
    if (state === 'error') {
      setStatus('denied: identity:read or relay:read', 'danger');
      return;
    }

    const itemCount = state === 'many' ? 18 : state === 'one' ? 1 : 0;
    setStatus(`loaded (${itemCount})`, 'success');
    for (let index = 0; index < itemCount; index += 1) {
      const long = state === 'many' && index === 0;
      const pubkey = `${(index % 10).toString()}`.repeat(64);
      const authorName = long ? `Long feed author ${'A'.repeat(180)}` : `Author ${index + 1}`;
      const item = document.createElement('li');
      item.className = 'feed-item';
      item.dataset['eventId'] = `${index}`.repeat(64);

      const avatarButton = document.createElement('button');
      avatarButton.type = 'button';
      avatarButton.className = 'feed-profile-button feed-profile-avatar-button';
      avatarButton.setAttribute('aria-label', `Open ${authorName} profile`);
      const avatar = document.createElement('span');
      avatar.className = 'feed-item-avatar';
      const fallback = document.createElement('span');
      fallback.className = 'feed-item-avatar-fallback';
      fallback.textContent = 'AU';
      avatar.append(fallback);
      avatarButton.append(avatar);

      const body = document.createElement('div');
      body.className = 'feed-item-body';
      const meta = document.createElement('div');
      meta.className = 'feed-item-meta';
      const author = document.createElement('button');
      author.type = 'button';
      author.className = 'feed-item-author feed-profile-button feed-profile-name-button';
      author.textContent = authorName;
      const time = document.createElement('time');
      time.className = 'feed-item-time';
      time.dateTime = '2026-07-31T00:00:00.000Z';
      time.title = '7/31/2026, 12:00:00 AM';
      time.textContent = `${index + 1}m ago`;
      const content = document.createElement('span');
      content.className = 'feed-item-content';
      content.textContent = long
        ? `Long feed content ${'content'.repeat(160)} <script>stays text</script>`
        : `Feed item ${index + 1}`;
      meta.append(author, time);
      body.append(meta, content);
      item.append(avatarButton, body);
      list.append(item);

      if (long) {
        author.dataset['expectedAccessibleName'] = authorName;
        content.dataset['expectedContent'] = content.textContent;
        item.dataset['pubkey'] = pubkey;
      }
    }
  }, fixture);
}

async function projectProfileFixture(frame: Frame, fixture: ProfileFixture): Promise<void> {
  await frame.evaluate((state) => {
    const status = document.getElementById('profile-status');
    const name = document.getElementById('profile-name');
    const pubkey = document.getElementById('profile-pubkey');
    const about = document.getElementById('profile-about');
    const details = document.getElementById('profile-details');
    const picture = document.getElementById('profile-picture') as HTMLImageElement | null;
    const banner = document.getElementById('profile-banner') as HTMLImageElement | null;
    if (!status || !name || !pubkey || !about || !details || !picture || !banner) {
      throw new Error('profile fixture surface missing');
    }

    const setStatus = (text: string, tone: 'neutral' | 'success' | 'danger') => {
      status.textContent = text;
      status.dataset['tone'] = tone;
    };
    const clearMedia = () => {
      picture.alt = 'profile';
      picture.style.display = 'none';
      banner.alt = 'profile banner';
      banner.style.display = 'none';
    };
    const addDetail = (label: string, value: string) => {
      const row = document.createElement('div');
      row.className = 'profile-detail-row';
      const key = document.createElement('span');
      key.className = 'profile-detail-label';
      key.textContent = label;
      const detail = document.createElement('span');
      detail.className = 'profile-detail-value';
      detail.textContent = value;
      row.append(key, detail);
      details.append(row);
    };

    name.textContent = '';
    pubkey.textContent = '';
    details.replaceChildren();
    clearMedia();
    if (state === 'empty') {
      about.textContent = 'Select a profile from the feed.';
      setStatus('waiting', 'neutral');
      return;
    }

    const fullPubkey = 'b'.repeat(64);
    pubkey.textContent = fullPubkey;
    if (state === 'loading') {
      about.textContent = 'Select a profile from the feed.';
      setStatus('loading', 'neutral');
      return;
    }
    if (state === 'error') {
      about.textContent = 'Select a profile from the feed.';
      setStatus('denied: inc, relay, or resource unavailable', 'danger');
      return;
    }
    if (state === 'partial') {
      name.textContent = 'bbbbbbbb...bbbb';
      about.textContent = 'No profile metadata found.';
      setStatus('not found', 'neutral');
      return;
    }

    const fullName = `Long profile name ${'N'.repeat(180)}`;
    const fullAbout = `Long profile about ${'metadata'.repeat(180)} <script>stays text</script>`;
    name.textContent = fullName;
    name.dataset['expectedContent'] = fullName;
    about.textContent = fullAbout;
    about.dataset['expectedContent'] = fullAbout;
    addDetail('nip05', `${'identity'.repeat(80)}@example.test`);
    addDetail('lud16', `${'payment'.repeat(80)}@example.test`);
    setStatus('loaded', 'success');
  }, fixture);
}

async function expectReadableType(frame: Frame, selectors: string[]): Promise<void> {
  const metrics = await frame.evaluate((targets) => targets.flatMap((selector) =>
    [...document.querySelectorAll<HTMLElement>(selector)].map((element) => {
      const style = getComputedStyle(element);
      return {
        selector,
        size: Number.parseFloat(style.fontSize),
        weight: Number.parseInt(style.fontWeight, 10),
      };
    }),
  ), selectors);

  for (const metric of metrics) {
    expect(metric.size, `${metric.selector} font size`).toBeGreaterThanOrEqual(12);
    expect(ALLOWED_FONT_SIZES, `${metric.selector} approved font size`).toContain(metric.size);
    expect(ALLOWED_FONT_WEIGHTS, `${metric.selector} approved font weight`).toContain(metric.weight);
  }
}

async function expectBoundedSurface(frame: Frame, selectors: string[]): Promise<void> {
  const metrics = await frame.evaluate((targets) => {
    const viewportWidth = document.documentElement.clientWidth;
    return {
      viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      elements: targets.flatMap((selector) =>
        [...document.querySelectorAll<HTMLElement>(selector)].map((element) => {
          const rect = element.getBoundingClientRect();
          return { selector, left: rect.left, right: rect.right, width: rect.width, height: rect.height };
        }),
      ),
    };
  }, selectors);

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  for (const element of metrics.elements) {
    expect(element.left, `${element.selector} left bound`).toBeGreaterThanOrEqual(-0.5);
    expect(element.right, `${element.selector} right bound`).toBeLessThanOrEqual(metrics.viewportWidth + 0.5);
    expect(element.width, `${element.selector} width`).toBeGreaterThan(0);
    expect(element.height, `${element.selector} height`).toBeGreaterThan(0);
  }
}

test('clicking host dark button stores then pushes one complete theme through the injected API', async ({ page }) => {
  test.setTimeout(60_000);
  const consoleMessages: string[] = [];
  page.on('console', (msg) => consoleMessages.push(msg.text()));
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  await demoBeforeEach(page);

  const prefFrame = page.frameLocator('#preferences-frame-container iframe');

  // Step 1: wait for preferences to reach usable state.
  // preferences reaches 'loaded' after storageGetItem completes (Phase 19 behavior).
  await expect(prefFrame.locator('#preferences-status')).toContainText(/^(loaded|denied:)/, { timeout: 10_000 });

  const prefFrameDirect = await getNappletFrame(page, 'preferences-frame-container');
  if (!prefFrameDirect) throw new Error('preferences frame not found in page.frames()');

  const themeApiShape = await prefFrameDirect.evaluate(() => {
    const theme = (window as Window & { napplet?: { theme?: Record<string, unknown> } }).napplet?.theme;
    return {
      get: typeof theme?.get,
      onChanged: typeof theme?.onChanged,
      subscribe: typeof theme?.subscribe,
      unsubscribe: typeof theme?.unsubscribe,
    };
  });
  expect(themeApiShape).toEqual({ get: 'function', onChanged: 'function', subscribe: 'undefined', unsubscribe: 'undefined' });

  await prefFrameDirect.evaluate(() => {
    const target = window as Window & {
      __themeChanges?: unknown[];
      napplet?: { theme?: { onChanged(handler: (theme: unknown) => void): { unsubscribe?: () => void } } };
    };
    target.__themeChanges = [];
    target.napplet?.theme?.onChanged((theme) => target.__themeChanges?.push(theme));
  });

  // An untrusted sibling frame can forge the old global `shell.ready` shape.
  // Readiness is consumed only by the bridge's source-bound receiver, so this
  // must not produce a theme.changed delivery.
  await page.evaluate(() => {
    const attacker = document.createElement('iframe');
    attacker.srcdoc = '<script>parent.postMessage({ type: "shell.ready" }, "*")<\\/script>';
    attacker.setAttribute('aria-hidden', 'true');
    document.body.appendChild(attacker);
  });
  await page.waitForTimeout(150);
  const forgedChanges = await prefFrameDirect.evaluate(() => {
    const target = window as Window & { __themeChanges?: unknown[] };
    return target.__themeChanges ?? [];
  });
  expect(forgedChanges).toHaveLength(0);

  // Step 2: wait for the host theme-switcher to be mounted (topology card must be present).
  await expect(page.locator('#theme-dark-btn')).toBeVisible({ timeout: 10_000 });

  // Step 3: click the Dark button — host-side, no postMessage needed.
  await page.locator('#theme-dark-btn').click();

  // Step 4: verify host button's active-state toggle (data-active='true').
  await expect(page.locator('#theme-dark-btn')).toHaveAttribute('data-active', 'true', { timeout: 5_000 });

  // Step 5: debugger should log the theme set message with the dark bg hex.
  await expect(page.locator('napplet-debugger')).toContainText('theme set — bg: ' + DARK_BG_HEX, { timeout: 8_000 });

  // Step 5b: the host shell should adopt the selected theme too.
  const hostBodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(hostBodyBg).toBe(DARK_BG_RGB);

  // Step 6: preferences napplet receives exactly one complete theme.changed.
  // #preferences-theme-applied textContent should equal the dark bg hex.
  await expect(prefFrame.locator('#preferences-theme-applied')).toHaveText(DARK_BG_HEX, { timeout: 8_000 });

  const changeAndRead = await prefFrameDirect.evaluate(async () => {
    const target = window as Window & {
      __themeChanges?: unknown[];
      napplet?: { theme?: { get(): Promise<unknown> } };
    };
    const theme = await target.napplet?.theme?.get();
    return { changes: target.__themeChanges, theme };
  });
  expect(changeAndRead.changes).toHaveLength(1);
  expect(changeAndRead.changes?.[0]).toEqual({
    title: 'Dark',
    colors: { background: DARK_BG_HEX, text: '#e0e0e0', primary: '#7aa2f7' },
  });
  expect(changeAndRead.theme).toEqual(changeAndRead.changes?.[0]);

  // Step 7: preferences iframe body computed backgroundColor should be rgb(10, 10, 10).
  const bodyBg = await prefFrameDirect.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bodyBg, `preferences body backgroundColor after theme.changed`).toBe(DARK_BG_RGB);

  const antiConsole = consoleMessages.filter((m) => ANTI_TERM_RE.test(m));
  expect(antiConsole, `anti-term found in console: ${antiConsole.join(' | ')}`).toHaveLength(0);
  const antiErrors = pageErrors.filter((m) => ANTI_TERM_RE.test(m));
  expect(antiErrors, `anti-term found in page errors: ${antiErrors.join(' | ')}`).toHaveLength(0);
});

test('a required-theme profile reads current state and receives one matching change', async ({ page }) => {
  test.setTimeout(120_000);
  await demoBeforeEach(page);

  const profileFrame = await getNappletFrame(page, 'profile-viewer-frame-container');
  if (!profileFrame) throw new Error('profile frame not found');
  const initial = await profileFrame.evaluate(async () => {
    const theme = (window as Window & {
      napplet?: { theme?: { get(): Promise<unknown>; onChanged(handler: (value: unknown) => void): { close(): void } } };
      __profileThemeChanges?: unknown[];
    });
    theme.__profileThemeChanges = [];
    theme.napplet?.theme?.onChanged((value) => theme.__profileThemeChanges?.push(value));
    return theme.napplet?.theme?.get();
  });
  expect(initial).toEqual(expect.objectContaining({ colors: expect.any(Object) }));

  await page.locator('#theme-dark-btn').click();
  const changedAndCurrent = await expect.poll(async () => profileFrame.evaluate(async () => {
    const target = window as Window & {
      napplet?: { theme?: { get(): Promise<unknown> } };
      __profileThemeChanges?: unknown[];
    };
    return { changes: target.__profileThemeChanges ?? [], current: await target.napplet?.theme?.get() };
  }), { timeout: 15_000 }).toMatchObject({
    changes: [{ title: 'Dark', colors: { background: DARK_BG_HEX } }],
    current: { title: 'Dark', colors: { background: DARK_BG_HEX } },
  });
  void changedAndCurrent;
});

test('feed and profile semantic aliases consume each real theme broadcast', async ({ page }) => {
  test.setTimeout(120_000);
  await demoBeforeEach(page);

  const feedFrame = await getNappletFrame(page, 'feed-frame-container');
  const profileFrame = await getNappletFrame(page, 'profile-viewer-frame-container');
  if (!feedFrame || !profileFrame) throw new Error('feed and profile frames must be ready');
  await projectFeedFixture(feedFrame, 'one');
  await projectProfileFixture(profileFrame, 'populated');

  const readToneSelectors = (frame: Frame) => frame.evaluate(() =>
    [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules])
      .map((rule) => 'selectorText' in rule ? String(rule.selectorText) : '')
      .filter((selector) => selector.includes('[data-tone=')),
  );
  const toneSelectors = await Promise.all([feedFrame, profileFrame].map(readToneSelectors));
  expect(toneSelectors[0]).toEqual(expect.arrayContaining([
    '#feed-status[data-tone="neutral"]',
    '#feed-status[data-tone="success"]',
    '#feed-status[data-tone="danger"]',
  ]));
  expect(toneSelectors[1]).toEqual(expect.arrayContaining([
    '#profile-status[data-tone="neutral"]',
    '#profile-status[data-tone="success"]',
    '#profile-status[data-tone="danger"]',
  ]));

  const readSemanticColors = async () => {
    const feed = await feedFrame.evaluate(() => {
      const resolveColor = (value: string) => {
        const probe = document.createElement('span');
        probe.style.color = value.trim();
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      const root = getComputedStyle(document.documentElement);
      const list = document.getElementById('feed-list');
      const content = document.querySelector<HTMLElement>('.feed-item-content');
      const avatarButton = document.querySelector<HTMLButtonElement>('.feed-profile-avatar-button');
      if (!list || !content || !avatarButton) throw new Error('feed semantic color targets missing');
      avatarButton.focus();
      return {
        background: getComputedStyle(document.body).backgroundColor,
        surface: getComputedStyle(list).backgroundColor,
        foreground: getComputedStyle(content).color,
        accent: getComputedStyle(avatarButton).outlineColor,
        expectedSurface: resolveColor(root.getPropertyValue('--nap-theme-surface-1')),
        expectedForeground: resolveColor(root.getPropertyValue('--nap-theme-text')),
        expectedAccent: resolveColor(root.getPropertyValue('--nap-theme-primary')),
      };
    });
    const profile = await profileFrame.evaluate(() => {
      const resolveColor = (value: string) => {
        const probe = document.createElement('span');
        probe.style.color = value.trim();
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
      };
      const root = getComputedStyle(document.documentElement);
      const title = document.querySelector<HTMLElement>('.profile-title');
      const about = document.getElementById('profile-about');
      if (!title || !about) throw new Error('profile semantic color targets missing');
      return {
        background: getComputedStyle(document.body).backgroundColor,
        muted: getComputedStyle(title).color,
        foreground: getComputedStyle(about).color,
        expectedMuted: resolveColor(root.getPropertyValue('--nap-theme-muted')),
        expectedForeground: resolveColor(root.getPropertyValue('--nap-theme-text')),
      };
    });
    return { feed, profile };
  };

  await page.locator('#theme-light-btn').click();
  await expect.poll(() => feedFrame.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe(LIGHT_BG_RGB);
  const light = await readSemanticColors();
  expect(light.feed.surface).toBe(light.feed.expectedSurface);
  expect(light.feed.foreground).toBe(light.feed.expectedForeground);
  expect(light.feed.accent).toBe(light.feed.expectedAccent);
  expect(light.profile.muted).toBe(light.profile.expectedMuted);
  expect(light.profile.foreground).toBe(light.profile.expectedForeground);

  await page.locator('#theme-dark-btn').click();
  await expect.poll(() => profileFrame.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe(DARK_BG_RGB);
  const dark = await readSemanticColors();
  expect(dark.feed.surface).toBe(dark.feed.expectedSurface);
  expect(dark.feed.foreground).toBe(dark.feed.expectedForeground);
  expect(dark.feed.accent).toBe(dark.feed.expectedAccent);
  expect(dark.profile.muted).toBe(dark.profile.expectedMuted);
  expect(dark.profile.foreground).toBe(dark.profile.expectedForeground);
  expect(dark.feed.background).not.toBe(light.feed.background);
  expect(dark.feed.surface).not.toBe(light.feed.surface);
  expect(dark.feed.accent).not.toBe(light.feed.accent);
  expect(dark.profile.background).not.toBe(light.profile.background);
  expect(dark.profile.muted).not.toBe(light.profile.muted);
});

test('feed and profile retain readable existing states at desktop and phone widths', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await demoBeforeEach(page);

  const feedFrame = await getNappletFrame(page, 'feed-frame-container');
  const profileFrame = await getNappletFrame(page, 'profile-viewer-frame-container');
  if (!feedFrame || !profileFrame) throw new Error('feed and profile frames must be ready');

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await projectFeedFixture(feedFrame, 'empty');
    await projectProfileFixture(profileFrame, 'empty');
    const hostScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    await expect(feedFrame.locator('#feed-status')).toHaveText('loaded (0)');
    await expect(feedFrame.locator('.feed-item')).toHaveCount(0);
    await expect(profileFrame.locator('#profile-status')).toHaveText('waiting');
    await expect(profileFrame.locator('#profile-about')).toHaveText('Select a profile from the feed.');

    await projectFeedFixture(feedFrame, 'loading');
    await projectProfileFixture(profileFrame, 'loading');
    await expect(feedFrame.locator('#feed-status')).toHaveText('loading');
    await expect(profileFrame.locator('#profile-status')).toHaveText('loading');
    await expectReadableType(feedFrame, ['#feed-status']);
    await expectReadableType(profileFrame, ['#profile-status', '#profile-pubkey']);

    await projectFeedFixture(feedFrame, 'error');
    await projectProfileFixture(profileFrame, 'error');
    await expect(feedFrame.locator('#feed-status')).toHaveAttribute('data-tone', 'danger');
    await expect(profileFrame.locator('#profile-status')).toHaveAttribute('data-tone', 'danger');
    const failureCopy = await Promise.all([
      feedFrame.locator('body').innerText(),
      profileFrame.locator('body').innerText(),
    ]);
    expect(failureCopy.join('\n')).not.toMatch(RECOVERY_COPY_RE);

    await projectFeedFixture(feedFrame, 'one');
    await projectProfileFixture(profileFrame, 'partial');
    await expect(feedFrame.locator('.feed-item')).toHaveCount(1);
    await expect(profileFrame.locator('#profile-status')).toHaveText('not found');
    await expect(profileFrame.locator('#profile-about')).toHaveText('No profile metadata found.');
    await expect(profileFrame.locator('#profile-picture')).toBeHidden();
    await expect(profileFrame.locator('#profile-banner')).toBeHidden();

    await projectFeedFixture(feedFrame, 'many');
    await projectProfileFixture(profileFrame, 'populated');
    await expect(feedFrame.locator('.feed-item')).toHaveCount(18);
    await expect(feedFrame.locator('#feed-status')).toHaveText('loaded (18)');
    await expect(profileFrame.locator('#profile-status')).toHaveText('loaded');
    await expect(feedFrame.locator('.feed-item-avatar img')).toHaveCount(0);
    await expect(feedFrame.locator('.feed-item-avatar-fallback').first()).toBeVisible();

    await expectReadableType(feedFrame, [
      '#feed-status',
      '.feed-item-author',
      '.feed-item-time',
      '.feed-item-content',
    ]);
    await expectReadableType(profileFrame, [
      '.profile-title',
      '#profile-status',
      '#profile-name',
      '#profile-pubkey',
      '#profile-about',
      '.profile-detail-label',
      '.profile-detail-value',
    ]);
    await expectBoundedSurface(feedFrame, [
      '#feed-status',
      '#feed-list',
      '.feed-item',
      '.feed-item-author',
      '.feed-item-content',
    ]);
    await expectBoundedSurface(profileFrame, [
      '.profile-header',
      '#profile-name',
      '#profile-pubkey',
      '#profile-about',
      '.profile-detail-row',
      '.profile-detail-value',
    ]);

    const expectedAuthor = await feedFrame.locator('[data-expected-accessible-name]').getAttribute('data-expected-accessible-name');
    if (!expectedAuthor) throw new Error('long author fixture missing');
    await expect(feedFrame.locator('[data-expected-accessible-name]')).toHaveAccessibleName(expectedAuthor);
    const fullValuesRemain = await Promise.all([
      feedFrame.evaluate(() => {
        const content = document.querySelector<HTMLElement>('[data-expected-content]');
        return content?.textContent === content?.dataset['expectedContent'];
      }),
      profileFrame.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-expected-content]')]
        .every((element) => element.textContent === element.dataset['expectedContent'])),
    ]);
    expect(fullValuesRemain).toEqual([true, true]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(hostScrollWidth);
  }
});
