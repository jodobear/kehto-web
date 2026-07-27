import { describe, expect, it, vi } from 'vitest';
import type { IntentRetentionParams } from '@kehto/services';
import { BrowserIntentController } from './browser-intent-controller.js';

const delivery = {
  sender: 'social-feed',
  archetype: 'profile',
  action: 'open',
  convention: 'napplet:profile/open',
  payload: { pubkey: 'a'.repeat(64) },
};

function params(overrides: Partial<IntentRetentionParams> = {}): IntentRetentionParams {
  return {
    handler: 'profile-viewer',
    delivery,
    ...overrides,
  };
}

describe('BrowserIntentController', () => {
  it('freezes retained handler and delivery before returning an unstarted idempotent task', async () => {
    let releaseReady!: () => void;
    const ready = new Promise<void>((resolve) => { releaseReady = resolve; });
    let retainedParams: IntentRetentionParams | undefined;
    const openOrReuse = vi.fn((value: IntentRetentionParams) => {
      retainedParams = value;
      return { id: 'generation-1' };
    });
    const send = vi.fn();
    const controller = new BrowserIntentController({
      openOrReuse,
      waitForReady: () => ready,
      isCurrent: () => true,
      send,
    });

    const task = controller.retain(params());
    expect(openOrReuse).not.toHaveBeenCalled();

    const started = task.start();
    const startedAgain = task.start();
    expect(openOrReuse).toHaveBeenCalledOnce();
    expect(startedAgain).toBe(started);
    expect(retainedParams).toEqual(expect.objectContaining({ handler: 'profile-viewer' }));
    expect(retainedParams).toBeDefined();
    expect(Object.isFrozen(retainedParams)).toBe(true);
    expect(Object.isFrozen(retainedParams?.delivery)).toBe(true);
    expect(Object.isFrozen(retainedParams?.delivery.payload)).toBe(true);

    releaseReady();
    await started;
    expect(send).toHaveBeenCalledOnce();
  });

  it('delivers at most once to a current ready generation despite replacement and repeated readiness', async () => {
    const current = vi.fn((generation: { id: string }) => generation.id === 'generation-2');
    const openOrReuse = vi.fn()
      .mockResolvedValueOnce({ id: 'generation-1' })
      .mockResolvedValueOnce({ id: 'generation-2' });
    const waitForReady = vi.fn().mockResolvedValue(undefined);
    const send = vi.fn().mockResolvedValue(undefined);
    const controller = new BrowserIntentController({
      openOrReuse,
      waitForReady,
      isCurrent: current,
      send,
      maxAttempts: 2,
    });

    const task = controller.retain(params());
    await Promise.all([task.start(), task.start()]);

    expect(openOrReuse).toHaveBeenCalledTimes(2);
    expect(waitForReady).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ id: 'generation-2' }, expect.objectContaining(delivery));
  });

  it('terminates bounded retries without duplicate sends when no current generation becomes ready', async () => {
    const onTerminal = vi.fn();
    const controller = new BrowserIntentController({
      openOrReuse: vi.fn(() => ({ id: 'stale' })),
      waitForReady: vi.fn().mockResolvedValue(undefined),
      isCurrent: () => false,
      send: vi.fn(),
      maxAttempts: 2,
      onTerminal,
    });

    await controller.retain(params()).start();

    expect(onTerminal).toHaveBeenCalledWith(expect.objectContaining({ handler: 'profile-viewer' }), 'no-current-target');
  });

  it('rejects non-finite maxAttempts and bounds finite attempt limits', async () => {
    const callbacks = {
      openOrReuse: vi.fn(() => null),
      waitForReady: () => undefined,
      isCurrent: () => false,
      send: () => {},
    };

    for (const value of [Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => new BrowserIntentController({ ...callbacks, maxAttempts: value }))
        .toThrow('maxAttempts must be finite');
    }

    for (const value of [0, -1]) {
      const normalized = new BrowserIntentController({ ...callbacks, maxAttempts: value });
      await normalized.retain(params()).start();
      expect(callbacks.openOrReuse).toHaveBeenCalledTimes(1);
      callbacks.openOrReuse.mockClear();
    }

    const bounded = new BrowserIntentController({ ...callbacks, maxAttempts: 999 });
    await bounded.retain(params()).start();
    expect(callbacks.openOrReuse).toHaveBeenCalledTimes(10);
  });
});
