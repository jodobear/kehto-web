import { expect, test } from '@playwright/test';
import { demoBeforeEach, getNappletFrame } from './helpers/index.js';

test.use({ baseURL: process.env.KEHTO_PLAYGROUND_BASE_URL ?? 'http://localhost:4174' });
test.describe.configure({ mode: 'serial' });

const PROFILE_PUBKEY = 'b'.repeat(64);

test('accepts the feed profile convention before its source closes and cold-starts one profile delivery without INC', async ({ page }) => {
  test.setTimeout(120_000);
  await demoBeforeEach(page);

  const feed = await getNappletFrame(page, 'feed-frame-container');
  if (!feed) throw new Error('feed frame must be ready');

  await expect(page.frameLocator('#profile-viewer-frame-container iframe').locator('#profile-status'))
    .toContainText('waiting', { timeout: 15_000 });

  const closedTarget = await page.evaluate(() => {
    const host = window as Window & {
      __closeNappletForTest__?: (dTag: string) => boolean;
      __clearPlaygroundTapForTest__?: () => void;
    };
    const closed = host.__closeNappletForTest__?.('profile-viewer') ?? false;
    host.__clearPlaygroundTapForTest__?.();
    return closed;
  });
  expect(closedTarget).toBe(true);
  await expect(page.locator('#profile-viewer-frame-container iframe')).toHaveCount(0);

  const accepted = await feed.evaluate(async (pubkey) => {
    const napplet = (window as Window & {
      napplet?: { intent?: { invoke(uri: string): Promise<unknown> } };
    }).napplet;
    if (!napplet?.intent) throw new Error('published intent API unavailable');
    return napplet.intent.invoke(`napplet:profile/open?pubkey=${encodeURIComponent(pubkey)}`);
  }, PROFILE_PUBKEY);
  expect(accepted).toMatchObject({ ok: true, convention: 'napplet:profile/open' });

  const closedSource = await page.evaluate(() => {
    const host = window as Window & { __closeNappletForTest__?: (dTag: string) => boolean };
    return host.__closeNappletForTest__?.('feed') ?? false;
  });
  expect(closedSource).toBe(true);

  // The accepted request must revive the verified profile handler, rather than
  // carrying the intent through a profile-specific INC topic or query identity.
  await expect(page.locator('#profile-viewer-frame-container iframe')).toHaveCount(1, { timeout: 15_000 });
  await expect(page.frameLocator('#profile-viewer-frame-container iframe').locator('#profile-pubkey'))
    .toHaveText(PROFILE_PUBKEY, { timeout: 15_000 });

  await expect.poll(async () => page.evaluate(() => {
    const host = window as Window & {
      __getPlaygroundEnvelopeTapForTest__?: () => Array<{
        direction: string;
        windowId?: string;
        type?: string;
        delivery?: unknown;
      }>;
    };
    return (host.__getPlaygroundEnvelopeTapForTest__?.() ?? [])
      .filter((message) => message.type === 'intent.deliver').length;
  }), { timeout: 15_000 }).toBe(1);

  const messages = await page.evaluate(() => {
    const host = window as Window & {
      __getPlaygroundEnvelopeTapForTest__?: () => Array<{
        direction: string;
        windowId?: string;
        type?: string;
        delivery?: unknown;
      }>;
    };
    return host.__getPlaygroundEnvelopeTapForTest__?.() ?? [];
  });

  const deliveries = messages.filter((message) => message.type === 'intent.deliver');
  expect(deliveries).toHaveLength(1);
  expect(deliveries[0]).toMatchObject({
    direction: 'shell->napplet',
  });
  expect(deliveries[0]?.delivery).toMatchObject({
    sender: 'feed',
    archetype: 'profile',
    action: 'open',
    convention: 'napplet:profile/open',
    payload: { pubkey: PROFILE_PUBKEY },
  });
  expect(messages.filter((message) => message.type?.startsWith('inc.'))).toHaveLength(0);
});
