import {
  originRegistry,
  type ShellBridge,
} from '@kehto/shell';

import { appendPajaMessageLog } from './browser-devtools.js';
import { requireTargetCorsAllowed } from './browser-target-diagnostics.js';
import type {
  PajaBrowserState,
  PajaBrowserStateContext,
  PajaHostRuntimeState,
} from './browser-host.js';
import { navigateFrame } from './browser-target-frame.js';

/**
 * Remove a single-frame runtime session from every host-owned registry.
 *
 * @param bridge - Shell bridge that owns the protocol session.
 * @param runtime - Paja host runtime state.
 * @param windowId - Registered frame window ID, when one exists.
 */
export function unregisterSingleFrameWindow(
  bridge: ShellBridge,
  runtime: PajaHostRuntimeState,
  windowId: string | null,
): void {
  if (!windowId) return;
  bridge.runtime.destroyWindow(windowId);
  bridge.runtime.sessionRegistry.unregister(windowId);
  originRegistry.unregister(windowId);
  runtime.readyWindowIds.delete(windowId);
  if (runtime.currentWindowId === windowId) runtime.currentWindowId = null;
}

/** Start one external-target navigation and arm its shell.ready deadline. */
export function startExternalFrameNavigation(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
): void {
  const { frame, bridge, adapter, runtime } = context;
  if (!frame || context.externalAttemptGeneration !== null) return;
  const attemptBudgetMs = context.config.runtime.readyTimeoutMs;
  const generation = state.generation;
  const isCurrentGeneration = () => state.generation === generation;
  cancelExternalFrameNavigation(
    context,
    new Error('Target navigation cancelled because a newer attempt started.'),
  );
  const controller = new AbortController();
  context.externalAttemptGeneration = generation;
  context.externalAttemptController = controller;
  const isCurrentAttempt = () => isCurrentGeneration()
    && context.externalAttemptGeneration === generation
    && context.externalAttemptController === controller;
  context.targetSurface?.showLoading(context.externalFocusFrameOnReady ? 'retry' : 'initial');
  context.externalAttemptTimeoutId = window.setTimeout(() => {
    settleExternalNavigationFailure(
      state,
      context,
      generation,
      controller,
      new Error(`Target readiness timed out after ${attemptBudgetMs}ms without shell.ready.`),
    );
  }, attemptBudgetMs);
  void context.refreshExternalConfig(controller.signal).then((attemptConfig) => {
    if (!isCurrentAttempt()) return null;
    context.config = attemptConfig;
    state.config = attemptConfig;
    context.setActiveTarget(null);
    return requireTargetCorsAllowed(state, controller.signal).then(() => {
      if (!isCurrentAttempt()) return null;
      return navigateFrame(
        frame, attemptConfig, generation, adapter, state.resolvedTarget, undefined, isCurrentAttempt,
        (windowId) => {
          if (isCurrentAttempt()) {
            runtime.currentWindowId = windowId;
            armExternalFrameErrorHandler(state, context, generation, controller);
          }
        },
        controller.signal,
      );
    });
  }).then((windowId) => {
    if (!isCurrentAttempt()) {
      unregisterSingleFrameWindow(bridge, runtime, windowId);
      if (context.externalAttemptController === controller) {
        cancelExternalFrameNavigation(
          context,
          new Error('Target navigation cancelled after a stale settlement.'),
        );
      }
      return;
    }
    runtime.currentWindowId = windowId;
  }).catch((error) => {
    if (settleExternalNavigationFailure(state, context, generation, controller, error)) console.error(error);
  });
}

/** Clear the active external-target readiness deadline. */
export function clearExternalAttemptTimeout(context: PajaBrowserStateContext): void {
  if (context.externalAttemptTimeoutId === null) return;
  window.clearTimeout(context.externalAttemptTimeoutId);
  context.externalAttemptTimeoutId = null;
}

/** Cancel the current external-target attempt without projecting a new UI state. */
export function cancelExternalFrameNavigation(
  context: PajaBrowserStateContext,
  reason: Error,
): void {
  clearExternalAttemptTimeout(context);
  clearExternalFrameErrorHandler(context);
  const controller = context.externalAttemptController;
  context.externalAttemptController = null;
  context.externalAttemptGeneration = null;
  if (controller && !controller.signal.aborted) controller.abort(reason);
}

/** Settle trusted external readiness without aborting the live frame. */
export function settleExternalNavigationReady(context: PajaBrowserStateContext): void {
  clearExternalAttemptTimeout(context);
  clearExternalFrameErrorHandler(context);
  context.externalAttemptController = null;
  context.externalAttemptGeneration = null;
}

/** Release external attempt and session ownership when the host is destroyed. */
export function destroyExternalFrameNavigation(context: PajaBrowserStateContext): void {
  cancelExternalFrameNavigation(
    context,
    new Error('Target navigation cancelled because the Paja host was destroyed.'),
  );
  context.externalFocusFrameOnReady = false;
  unregisterSingleFrameWindow(context.bridge, context.runtime, context.runtime.currentWindowId);
}

/** Settle the current external-target attempt into retryable recovery. */
export function settleExternalNavigationFailure(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  generation: number,
  controller: AbortController,
  error: unknown,
): boolean {
  if (
    state.generation !== generation
    || context.externalAttemptGeneration !== generation
    || context.externalAttemptController !== controller
  ) return false;
  const focusRetry = context.externalFocusFrameOnReady;
  const failure = error instanceof Error ? error : new Error(String(error));
  cancelExternalFrameNavigation(context, failure);
  context.externalFocusFrameOnReady = false;
  unregisterSingleFrameWindow(context.bridge, context.runtime, context.runtime.currentWindowId);
  state.status = 'error';
  context.targetSurface?.showError(failure, { focusRetry });
  appendPajaMessageLog(state, 'paja', {
    type: 'paja.target.error',
    error: failure.message,
  });
  return true;
}

/** Route native iframe load failures through the current external attempt. */
export function armExternalFrameErrorHandler(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  generation: number,
  controller: AbortController,
): void {
  const frame = context.frame;
  if (!frame || context.externalAttemptController !== controller) return;
  clearExternalFrameErrorHandler(context);
  const handleError = () => {
    settleExternalNavigationFailure(
      state,
      context,
      generation,
      controller,
      new Error('Target frame failed to load.'),
    );
  };
  const dispose = () => {
    frame.removeEventListener('error', handleError);
    if (context.externalAttemptErrorDisposer === dispose) context.externalAttemptErrorDisposer = null;
  };
  context.externalAttemptErrorDisposer = dispose;
  frame.addEventListener('error', handleError, { once: true });
}

function clearExternalFrameErrorHandler(context: PajaBrowserStateContext): void {
  context.externalAttemptErrorDisposer?.();
  context.externalAttemptErrorDisposer = null;
}
