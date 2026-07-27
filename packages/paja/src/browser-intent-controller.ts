/**
 * Browser-owned retained NAP-INTENT target lifecycle policy.
 *
 * Retention is intentionally independent from browser frames. The host supplies
 * generation creation/reuse, source-bound readiness, current-generation checks,
 * and delivery. This controller freezes responsibility before an accepted
 * result, then starts that policy only afterward.
 *
 * @packageDocumentation
 */

import type {
  IntentRetentionParams,
  IntentRetainedDelivery,
  IntentTargetController,
} from '@kehto/services';

/** Opaque current target generation controlled by the browser host. */
export interface BrowserIntentGeneration {
  /** Host-owned stable identifier for one target generation. */
  readonly id: string;
}

/** Terminal reasons exposed only to host observability and cleanup policy. */
export type BrowserIntentTerminalReason =
  | 'open-failed'
  | 'ready-failed'
  | 'no-current-target'
  | 'send-failed';

/** Browser lifecycle callbacks injected by the Paja host. */
export interface BrowserIntentControllerOptions {
  /** Open a compatible target or reuse its current generation. */
  openOrReuse(
    params: IntentRetentionParams,
    attempt: number,
  ): BrowserIntentGeneration | null | Promise<BrowserIntentGeneration | null>;
  /** Await source-bound NAP-SHELL readiness for a selected generation. */
  waitForReady(generation: BrowserIntentGeneration): void | Promise<void>;
  /** Return true only while the generation remains the selected current target. */
  isCurrent(generation: BrowserIntentGeneration): boolean | Promise<boolean>;
  /** Send the retained delivery to the current ready generation exactly once. */
  send(
    generation: BrowserIntentGeneration,
    delivery: IntentRetentionParams['delivery'],
  ): void | Promise<void>;
  /** Maximum open/replacement attempts after acceptance. Defaults to two. */
  maxAttempts?: number;
  /** Observe terminal post-acceptance policy without producing another result. */
  onTerminal?(params: IntentRetentionParams, reason: BrowserIntentTerminalReason): void;
}

/**
 * Retains immutable delivery responsibility before the intent service accepts.
 *
 * It has no public lifecycle state: host callbacks own generation identity,
 * readiness, reuse, and replacement. A returned task is inert until its
 * `start()` method is invoked by the intent service after sending acceptance.
 */
export class BrowserIntentController implements IntentTargetController {
  private readonly maxAttempts: number;

  constructor(private readonly options: BrowserIntentControllerOptions) {
    this.maxAttempts = normalizeAttempts(options.maxAttempts);
  }

  retain(params: IntentRetentionParams): IntentRetainedDelivery {
    const retained = freezeRetention(params);
    let started: Promise<void> | undefined;
    let delivered = false;

    return {
      start: () => {
        started ??= this.start(retained, () => delivered, () => { delivered = true; });
        return started;
      },
    };
  }

  private async start(
    params: IntentRetentionParams,
    isDelivered: () => boolean,
    markDelivered: () => void,
  ): Promise<void> {
    let reason: BrowserIntentTerminalReason = 'no-current-target';
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      let generation: BrowserIntentGeneration | null;
      try {
        generation = await this.options.openOrReuse(params, attempt);
      } catch {
        reason = 'open-failed';
        continue;
      }
      if (!generation) {
        reason = 'open-failed';
        continue;
      }
      try {
        await this.options.waitForReady(generation);
      } catch {
        reason = 'ready-failed';
        continue;
      }
      if (!await this.options.isCurrent(generation)) {
        reason = 'no-current-target';
        continue;
      }
      if (isDelivered()) return;
      markDelivered();
      try {
        await this.options.send(generation, params.delivery);
        return;
      } catch {
        this.options.onTerminal?.(params, 'send-failed');
        return;
      }
    }
    this.options.onTerminal?.(params, reason);
  }
}

function normalizeAttempts(value: number | undefined): number {
  if (value === undefined) return 2;
  return Math.max(1, Math.floor(value));
}

function freezeRetention(params: IntentRetentionParams): IntentRetentionParams {
  if (!params || typeof params.handler !== 'string' || params.handler.length === 0) {
    throw new TypeError('Intent retention requires a handler');
  }
  const delivery = freezeValue({ ...params.delivery }) as IntentRetentionParams['delivery'];
  const behavior = params.behavior === undefined
    ? undefined
    : freezeValue({ ...params.behavior }) as NonNullable<IntentRetentionParams['behavior']>;
  return Object.freeze({
    handler: params.handler,
    delivery,
    ...(behavior === undefined ? {} : { behavior }),
  });
}

function freezeValue<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (typeof value !== 'object' || value === null) return value;
  const existing = seen.get(value);
  if (existing !== undefined) return existing as T;
  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    for (const item of value) copy.push(freezeValue(item, seen));
    return Object.freeze(copy) as T;
  }
  const copy: Record<string, unknown> = {};
  seen.set(value, copy);
  for (const [key, item] of Object.entries(value)) copy[key] = freezeValue(item, seen);
  return Object.freeze(copy) as T;
}
