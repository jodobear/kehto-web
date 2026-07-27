/**
 * Retained NAP-INTENT target lifecycle policy for the playground host.
 *
 * The controller retains immutable delivery responsibility before source
 * acceptance, then relies on injected shell-host callbacks for verified target
 * creation, registered-source readiness, current-generation checks, and one
 * target-only delivery. It has no iframe or INC routing state of its own.
 *
 * @packageDocumentation
 */

import type {
  IntentRetentionParams,
  IntentRetainedDelivery,
  IntentTargetController,
} from '@kehto/services';

/** Opaque shell-host generation for a target iframe/source pair. */
export interface PlaygroundIntentGeneration {
  /** Host-owned generation identifier. */
  readonly id: string;
}

/** Terminal post-acceptance reasons visible only to host policy. */
export type PlaygroundIntentTerminalReason =
  | 'open-failed'
  | 'ready-failed'
  | 'no-current-target'
  | 'send-failed';

/** Lifecycle callbacks supplied by the playground shell host. */
export interface PlaygroundIntentControllerOptions {
  /** Open a verified cold target or reuse a compatible current target. */
  openOrReuse(
    params: IntentRetentionParams,
    attempt: number,
  ): PlaygroundIntentGeneration | null | Promise<PlaygroundIntentGeneration | null>;
  /** Await NAP-SHELL readiness from the generation's registered current source. */
  waitForReady(generation: PlaygroundIntentGeneration): void | Promise<void>;
  /** Return true only while this generation remains current for its target d-tag. */
  isCurrent(generation: PlaygroundIntentGeneration): boolean | Promise<boolean>;
  /** Send the retained delivery once to that current ready source. */
  send(
    generation: PlaygroundIntentGeneration,
    delivery: IntentRetentionParams['delivery'],
  ): void | Promise<void>;
  /** Maximum open/replacement attempts after acceptance. Finite values clamp to 1–10; defaults to two. */
  maxAttempts?: number;
  /** Observe terminal policy without manufacturing a second source result. */
  onTerminal?(params: IntentRetentionParams, reason: PlaygroundIntentTerminalReason): void;
}

const MAX_INTENT_DELIVERY_ATTEMPTS = 10;

/**
 * Retains target delivery before the resolver returns acceptance.
 *
 * @example
 * ```ts
 * const controller = new PlaygroundIntentController({ openOrReuse, waitForReady, isCurrent, send });
 * const retained = controller.retain(params);
 * // The intent service sends acceptance, then starts this task.
 * ```
 */
export class PlaygroundIntentController implements IntentTargetController {
  private readonly maxAttempts: number;

  constructor(private readonly options: PlaygroundIntentControllerOptions) {
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
    let reason: PlaygroundIntentTerminalReason = 'no-current-target';
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      let generation: PlaygroundIntentGeneration | null;
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
  if (!Number.isFinite(value)) throw new TypeError('maxAttempts must be finite');
  return Math.min(MAX_INTENT_DELIVERY_ATTEMPTS, Math.max(1, Math.floor(value)));
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
