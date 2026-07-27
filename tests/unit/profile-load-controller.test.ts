import { describe, expect, it, vi } from 'vitest';
import {
  createProfileLoadController,
  type ProfileLoadSubscription,
} from '../../apps/playground/napplets/profile-viewer/src/profile-load-controller.js';

type QueuedSubscription = ProfileLoadSubscription & {
  readonly complete: () => void;
};

describe('profile load controller', () => {
  it('ignores an old queued completion after a newer load begins', () => {
    let nextTimer = 0;
    const timers = new Map<number, () => void>();
    const clearedTimers: number[] = [];
    const subscriptions: QueuedSubscription[] = [];
    const onEmpty = vi.fn();
    const onStart = vi.fn();
    const controller = createProfileLoadController<string>({
      timeoutMs: 8_000,
      subscribe: (_pubkey, _onEvent, complete) => {
        const subscription: QueuedSubscription = {
          close: vi.fn(),
          complete,
        };
        subscriptions.push(subscription);
        return subscription;
      },
      setTimeout: (callback) => {
        nextTimer += 1;
        timers.set(nextTimer, callback);
        return nextTimer;
      },
      clearTimeout: (timer) => {
        clearedTimers.push(timer);
        timers.delete(timer);
      },
      onStart,
      onEvent: vi.fn(),
      onEmpty,
    });

    controller.load('old-pubkey');
    controller.load('new-pubkey');
    subscriptions[0].complete();

    expect(onStart).toHaveBeenNthCalledWith(2, 'new-pubkey');
    expect(onEmpty).not.toHaveBeenCalled();
    expect(clearedTimers).toEqual([1]);
    expect(subscriptions[1].close).not.toHaveBeenCalled();

    timers.get(2)?.();
    expect(onEmpty).toHaveBeenCalledWith('new-pubkey');
  });
});
