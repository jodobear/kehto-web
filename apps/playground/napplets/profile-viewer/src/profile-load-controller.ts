/** Generation-scoped lifecycle management for one profile relay load. */

export interface ProfileLoadSubscription {
  close(): void;
}

export interface ProfileLoadControllerOptions<TEvent> {
  readonly timeoutMs: number;
  subscribe(
    pubkey: string,
    onEvent: (event: TEvent) => void,
    onComplete: () => void,
  ): ProfileLoadSubscription;
  setTimeout(callback: () => void, timeoutMs: number): number;
  clearTimeout(timer: number): void;
  onStart(pubkey: string): void;
  onEvent(pubkey: string, event: TEvent): void;
  onEmpty(pubkey: string): void;
}

export interface ProfileLoadController {
  load(pubkey: string): void;
  clear(): void;
}

/**
 * Starts profile subscriptions with a monotonically increasing request token.
 * Queued callbacks from superseded subscriptions are inert and cannot affect
 * the active request's DOM, subscription, or timeout.
 */
export function createProfileLoadController<TEvent>(
  options: ProfileLoadControllerOptions<TEvent>,
): ProfileLoadController {
  let generation = 0;
  let activeSubscription: ProfileLoadSubscription | null = null;
  let activeTimer: number | null = null;

  const clear = () => {
    generation += 1;
    activeSubscription?.close();
    activeSubscription = null;
    if (activeTimer !== null) options.clearTimeout(activeTimer);
    activeTimer = null;
  };

  return {
    clear,
    load(pubkey) {
      clear();
      const requestGeneration = ++generation;
      let received = false;
      let complete = false;
      let subscription: ProfileLoadSubscription | null = null;
      let timer: number | null = null;
      const isCurrent = () => generation === requestGeneration;
      const finish = () => {
        if (!isCurrent() || complete) return;
        complete = true;
        if (timer !== null) options.clearTimeout(timer);
        if (activeTimer === timer) activeTimer = null;
        if (!received) options.onEmpty(pubkey);
        subscription?.close();
        if (activeSubscription === subscription) activeSubscription = null;
      };

      options.onStart(pubkey);
      timer = options.setTimeout(finish, options.timeoutMs);
      activeTimer = timer;
      subscription = options.subscribe(
        pubkey,
        (event) => {
          if (!isCurrent() || complete) return;
          received = true;
          options.onEvent(pubkey, event);
        },
        finish,
      );
      if (!isCurrent() || complete) subscription.close();
      else activeSubscription = subscription;
    },
  };
}
