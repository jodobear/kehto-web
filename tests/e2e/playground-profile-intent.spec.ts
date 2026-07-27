import { expect, test } from '@playwright/test';
import { demoBeforeEach, getNappletFrame } from './helpers/index.js';

test.use({ baseURL: process.env.KEHTO_PLAYGROUND_BASE_URL ?? 'http://localhost:4174' });
test.describe.configure({ mode: 'serial' });

const PROFILE_PUBKEY = 'b'.repeat(64);

test('accepts the feed profile convention before its source closes and delivers once to the ready profile target', async ({ page }) => {
  test.setTimeout(120_000);
  await demoBeforeEach(page);

  const feed = await getNappletFrame(page, 'feed-frame-container');
  const profile = await getNappletFrame(page, 'profile-viewer-frame-container');
  if (!feed || !profile) throw new Error('feed and profile frames must be ready');

  await expect(page.frameLocator('#profile-viewer-frame-container iframe').locator('#profile-status'))
    .toContainText('waiting', { timeout: 15_000 });

  await profile.evaluate(() => {
    const target = window as Window & {
      __profileDeliveries?: Array<Record<string, unknown>>;
      napplet?: { intent?: { onDelivery(handler: (delivery: Record<string, unknown>) => void): { close(): void } } };
    };
    target.__profileDeliveries = [];
    target.napplet?.intent?.onDelivery((delivery) => target.__profileDeliveries?.push(delivery));
  });

  const accepted = await feed.evaluate(async (pubkey) => {
    const napplet = (window as Window & {
      napplet?: { intent?: { invoke(uri: string): Promise<unknown> } };
    }).napplet;
    if (!napplet?.intent) throw new Error('published intent API unavailable');
    return napplet.intent.invoke(`napplet:profile/open?pubkey=${encodeURIComponent(pubkey)}`);
  }, PROFILE_PUBKEY);
  expect(accepted).toMatchObject({ ok: true, convention: 'napplet:profile/open' });

  await page.locator('#feed-frame-container iframe').evaluate((frame) => frame.remove());
  await expect(page.frameLocator('#profile-viewer-frame-container iframe').locator('#profile-pubkey'))
    .toHaveText(PROFILE_PUBKEY, { timeout: 15_000 });

  const deliveries = await profile.evaluate(() => {
    const target = window as Window & { __profileDeliveries?: Array<Record<string, unknown>> };
    return target.__profileDeliveries ?? [];
  });
  expect(deliveries).toHaveLength(1);
  expect(deliveries[0]).toMatchObject({
    sender: 'feed',
    archetype: 'profile',
    action: 'open',
    convention: 'napplet:profile/open',
    payload: { pubkey: PROFILE_PUBKEY },
  });
});
