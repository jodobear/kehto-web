/**
 * intent-service.ts — NAP-INTENT (archetype intent dispatch) reference service.
 *
 * Shell-side handler for the NAP-INTENT wire protocol. It is a pure envelope
 * router: it validates `intent.*` envelopes, delegates archetype resolution,
 * default handling and retained target delivery to an injected
 * {@link IntentResolver}, then posts correlated result and push messages back
 * to the napplet.
 *
 * The resolver is injected (options-as-bridge) so this service has no shell or
 * target-lifecycle dependency and is fully unit-testable. A concrete
 * catalog-backed resolver ships alongside as {@link createCatalogIntentResolver}.
 *
 * ──────────────────────────── Responsibilities ────────────────────────────
 *   Inbound:  intent.invoke, intent.available, intent.handlers
 *   Outbound: intent.invoke.result, intent.available.result,
 *             intent.handlers.result, intent.changed
 *
 * The shell owns archetype→handler resolution, the user's default-handler
 * preference, chooser, and retained target policy behind the
 * {@link IntentResolver}. This service only marshals the wire protocol and
 * fans `intent.changed` pushes out to eligible napplets.
 *
 * @example
 * ```ts
 * import { createIntentService, createCatalogIntentResolver } from '@kehto/services';
 *
 * const resolver = createCatalogIntentResolver({ loadCatalog, targets });
 * runtime.registerService('intent', createIntentService({ resolver }));
 * ```
 *
 * @packageDocumentation
 */

import type { NappletMessage } from '@napplet/core';
import type {
  ServiceDescriptor,
  ServiceHandler,
  ServiceRuntimeContext,
} from '@kehto/runtime';
import type {
  IntentAcceptedResult,
  IntentAvailability,
  IntentRejectedResult,
  IntentRequest,
} from './intent-types.js';

/** Intent service version — follows semver. */
const INTENT_SERVICE_VERSION = '1.0.0';

/** Context passed to {@link IntentResolver.invoke} for trust/attribution. */
export interface IntentResolverContext {
  /** Runtime-attested dTag of the napplet that issued the request. */
  sender: string;
}

/**
 * Opaque runtime-owned delivery responsibility retained before acceptance.
 *
 * Starting the task may wait for target readiness and apply host retry,
 * replacement, or terminal-failure policy. It never produces a second source
 * result.
 */
export interface IntentRetainedDelivery {
  /**
   * Begin target lifecycle and eventual delivery policy.
   *
   * @returns Nothing, or a promise settled when controller policy completes.
   */
  start(): void | Promise<void>;
}

/** A resolver rejection before delivery responsibility was retained. */
export interface IntentRejectedResolverOutcome {
  /** Exact canonical pre-acceptance rejection. */
  result: IntentRejectedResult;
}

/** A resolver acceptance backed by already-retained delivery responsibility. */
export interface IntentAcceptedResolverOutcome {
  /** Exact canonical acceptance result. */
  result: IntentAcceptedResult;
  /** Opaque task that the service starts only after sending the source result. */
  retained: IntentRetainedDelivery;
}

/** Pre-acceptance rejection or accepted retained-delivery responsibility. */
export type IntentResolverOutcome =
  | IntentRejectedResolverOutcome
  | IntentAcceptedResolverOutcome;

/**
 * Abstract intent resolver. Implementors own the installed-napplet catalog,
 * archetype→handler resolution, the user's default-handler preference, the
 * chooser and retained target delivery policy. The
 * service translates wire envelopes into these calls and back.
 */
export interface IntentResolver {
  /**
   * Resolve the request and retain target delivery responsibility.
   *
   * @param request - Validated normalized intent request.
   * @param context - Runtime-attested source identity.
   * @returns A structured rejection, or an acceptance plus an unstarted task.
   */
  invoke(
    request: IntentRequest,
    context: IntentResolverContext,
  ): IntentResolverOutcome | Promise<IntentResolverOutcome>;
  /** Report whether the runtime can currently satisfy `archetype`, and how. */
  available(archetype: string): IntentAvailability | Promise<IntentAvailability>;
  /** Report availability for every archetype the runtime can currently satisfy. */
  handlers(): IntentAvailability[] | Promise<IntentAvailability[]>;
  /**
   * Register for availability changes (a napplet installed/removed, or a default
   * handler changed). The service forwards each change to served napplets as an
   * `intent.changed` push. Returns an unsubscribe handle. Resolvers whose
   * catalog never changes at runtime MAY omit this.
   */
  onChanged?(listener: (availability: IntentAvailability) => void): () => void;
}

/** Options for {@link createIntentService}. */
export interface IntentServiceOptions {
  /** The intent resolver the shell uses to route archetypes. Required. */
  resolver: IntentResolver;
}

type Send = (msg: NappletMessage) => void;

const INTENT_DESCRIPTOR: ServiceDescriptor = {
  name: 'intent',
  version: INTENT_SERVICE_VERSION,
  description: 'NAP-INTENT archetype intent dispatch — invoke/available/handlers',
};

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'intent request failed';
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

type RequestValidation =
  | { request: IntentRequest }
  | { error: 'invalid convention' | 'invoke rejected' };

function validateIntentRequest(value: unknown): RequestValidation {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: 'invalid convention' };
  }
  const request = value as Record<string, unknown>;
  if (
    typeof request.archetype !== 'string'
    || request.archetype.length === 0
    || typeof request.action !== 'string'
    || request.action.length === 0
    || typeof request.convention !== 'string'
    || request.convention.length === 0
  ) {
    return { error: 'invalid convention' };
  }

  const match = /^napplet:([^/?#\s]+)\/([^/?#\s]+)$/.exec(request.convention);
  if (!match || match[1] !== request.archetype || match[2] !== request.action) {
    return { error: 'invalid convention' };
  }

  const allowedKeys = ['archetype', 'action', 'convention', 'payload', 'handler', 'behavior'];
  if (Object.keys(request).some((key) => !allowedKeys.includes(key))) {
    return { error: 'invoke rejected' };
  }

  if (
    hasOwn(request, 'handler')
    && request.handler !== undefined
    && (typeof request.handler !== 'string' || request.handler.length === 0)
  ) {
    return { error: 'invoke rejected' };
  }

  let behavior: IntentRequest['behavior'];
  if (hasOwn(request, 'behavior') && request.behavior !== undefined) {
    if (
      typeof request.behavior !== 'object'
      || request.behavior === null
      || Array.isArray(request.behavior)
    ) {
      return { error: 'invoke rejected' };
    }
    const record = request.behavior as Record<string, unknown>;
    if (
      Object.keys(record).some((key) => key !== 'focus' && key !== 'reuse')
      || (hasOwn(record, 'focus') && typeof record.focus !== 'boolean')
      || (hasOwn(record, 'reuse') && typeof record.reuse !== 'boolean')
    ) {
      return { error: 'invoke rejected' };
    }
    behavior = {
      ...(record.focus === undefined ? {} : { focus: record.focus as boolean }),
      ...(record.reuse === undefined ? {} : { reuse: record.reuse as boolean }),
    };
  }

  return {
    request: {
      archetype: request.archetype,
      action: request.action,
      convention: request.convention,
      ...(hasOwn(request, 'payload') ? { payload: request.payload } : {}),
      ...(typeof request.handler === 'string' ? { handler: request.handler } : {}),
      ...(behavior === undefined ? {} : { behavior }),
    },
  };
}

/**
 * Create the NAP-INTENT service handler.
 *
 * @param options - Must provide an {@link IntentResolver}.
 * @returns A `ServiceHandler` ready for `runtime.registerService('intent', handler)`.
 * @throws If `options.resolver` is missing.
 */
export function createIntentService(options: IntentServiceOptions): ServiceHandler {
  if (!options || typeof options.resolver !== 'object' || options.resolver === null) {
    throw new Error('createIntentService: options.resolver is required');
  }
  const { resolver } = options;
  let runtimeContext: ServiceRuntimeContext | undefined;
  let unsubscribeChanged: (() => void) | undefined;

  /**
   * Run a resolver call and marshal its outcome onto `resultType`. The resolver
   * method may be sync or async — `settle` normalizes it to a promise and
   * catches a synchronous throw (e.g. a sync resolver that rejects an input)
   * the same way it catches an async rejection.
   */
  function settle<T>(
    call: () => T | Promise<T>,
    send: Send,
    resultType: string,
    id: string,
    onValue: (value: T) => NappletMessage,
  ): void {
    let pending: Promise<T>;
    try {
      pending = Promise.resolve(call());
    } catch (err) {
      send({ type: resultType, id, error: toErrorMessage(err) } as NappletMessage);
      return;
    }
    pending
      .then((value) => send(onValue(value)))
      .catch((err) => send({ type: resultType, id, error: toErrorMessage(err) } as NappletMessage));
  }

  function handleInvoke(windowId: string, msg: NappletMessage, send: Send): void {
    const m = msg as NappletMessage & { id?: string; request?: unknown };
    const id = m.id ?? '';
    const validation = validateIntentRequest(m.request);
    if ('error' in validation) {
      send({
        type: 'intent.invoke.result',
        id,
        result: { ok: false, error: validation.error },
      } as NappletMessage);
      return;
    }
    const sender = runtimeContext?.resolveDTag(windowId);
    if (!sender) {
      send({
        type: 'intent.invoke.result',
        id,
        result: { ok: false, error: 'invoke rejected' },
      } as NappletMessage);
      return;
    }

    let pending: Promise<IntentResolverOutcome>;
    try {
      pending = Promise.resolve(resolver.invoke(validation.request, { sender }));
    } catch {
      send({
        type: 'intent.invoke.result',
        id,
        result: { ok: false, error: 'invoke rejected' },
      } as NappletMessage);
      return;
    }
    void pending.then(
      (outcome) => {
        if (
          outcome.result.ok
          && (!('retained' in outcome) || typeof outcome.retained.start !== 'function')
        ) {
          send({
            type: 'intent.invoke.result',
            id,
            result: { ok: false, error: 'invoke rejected' },
          } as NappletMessage);
          return;
        }
        send({
          type: 'intent.invoke.result',
          id,
          result: outcome.result,
        } as NappletMessage);
        if (!outcome.result.ok || !('retained' in outcome)) return;
        try {
          const started = outcome.retained.start();
          void Promise.resolve(started).catch(() => {
            // Post-acceptance terminal policy never creates a second result.
          });
        } catch {
          // A synchronous post-acceptance failure is likewise controller policy.
        }
      },
      () => {
        send({
          type: 'intent.invoke.result',
          id,
          result: { ok: false, error: 'invoke rejected' },
        } as NappletMessage);
      },
    ).catch(() => {
      // Adapter send failures must not manufacture a second source result.
    });
  }

  function handleAvailable(msg: NappletMessage, send: Send): void {
    const m = msg as NappletMessage & { id?: string; archetype?: unknown };
    const id = m.id ?? '';
    if (typeof m.archetype !== 'string' || m.archetype.length === 0) {
      send({ type: 'intent.available.result', id, error: 'invalid archetype' } as NappletMessage);
      return;
    }
    const archetype = m.archetype;
    settle(
      () => resolver.available(archetype),
      send, 'intent.available.result', id,
      (availability) => ({ type: 'intent.available.result', id, availability } as NappletMessage),
    );
  }

  function handleHandlers(msg: NappletMessage, send: Send): void {
    const m = msg as NappletMessage & { id?: string };
    const id = m.id ?? '';
    settle(
      () => resolver.handlers(),
      send, 'intent.handlers.result', id,
      (handlers) => ({ type: 'intent.handlers.result', id, handlers } as NappletMessage),
    );
  }

  return {
    descriptor: INTENT_DESCRIPTOR,
    onRegistered(context): void {
      try {
        unsubscribeChanged?.();
      } catch {
        // Resolver cleanup is best-effort during replacement.
      }
      runtimeContext = context;
      unsubscribeChanged = resolver.onChanged?.((availability) => {
        const current = runtimeContext;
        if (!current) return;
        const message = { type: 'intent.changed', availability } as NappletMessage;
        for (const windowId of current.listWindowIds()) {
          current.sendToEligibleNapplet(windowId, message);
        }
      });
    },
    onUnregistered(): void {
      const unsubscribe = unsubscribeChanged;
      unsubscribeChanged = undefined;
      runtimeContext = undefined;
      try {
        unsubscribe?.();
      } catch {
        // Resolver cleanup cannot block runtime teardown.
      }
    },
    handleMessage(windowId: string, message: NappletMessage, send: Send): void {
      switch (message.type) {
        case 'intent.invoke':
          handleInvoke(windowId, message, send);
          return;
        case 'intent.available':
          handleAvailable(message, send);
          return;
        case 'intent.handlers':
          handleHandlers(message, send);
          return;
        default:
          // Unknown intent.* action — silently ignored (forward-compatible).
          return;
      }
    },
  };
}
