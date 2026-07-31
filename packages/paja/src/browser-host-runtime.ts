import {
  originRegistry,
  type ShellBridge,
} from '@kehto/shell';

import { appendPajaMessageLog } from './browser-devtools.js';
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
  const { config, frame, bridge, adapter, runtime } = context;
  if (!frame || context.externalAttemptGeneration !== null) return;
  const generation = state.generation;
  const isCurrentGeneration = () => state.generation === generation;
  context.externalAttemptGeneration = generation;
  context.targetSurface?.showLoading(context.externalFocusFrameOnReady ? 'retry' : 'initial');
  void navigateFrame(
    frame, config, generation, adapter, state.resolvedTarget, undefined, isCurrentGeneration,
    (windowId) => {
      if (isCurrentGeneration()) runtime.currentWindowId = windowId;
    },
  ).then((windowId) => {
    if (!isCurrentGeneration()) {
      unregisterSingleFrameWindow(bridge, runtime, windowId);
      if (context.externalAttemptGeneration === generation) context.externalAttemptGeneration = null;
      return;
    }
    if (context.externalAttemptGeneration !== generation) {
      unregisterSingleFrameWindow(bridge, runtime, windowId);
      return;
    }
    runtime.currentWindowId = windowId;
    clearExternalAttemptTimeout(context);
    context.externalAttemptTimeoutId = window.setTimeout(() => {
      settleExternalNavigationFailure(
        state,
        context,
        generation,
        new Error(`Target readiness timed out after ${config.runtime.readyTimeoutMs}ms without shell.ready.`),
      );
    }, config.runtime.readyTimeoutMs);
  }).catch((error) => {
    if (settleExternalNavigationFailure(state, context, generation, error)) console.error(error);
  });
}

/** Clear the active external-target readiness deadline. */
export function clearExternalAttemptTimeout(context: PajaBrowserStateContext): void {
  if (context.externalAttemptTimeoutId === null) return;
  window.clearTimeout(context.externalAttemptTimeoutId);
  context.externalAttemptTimeoutId = null;
}

/** Settle the current external-target attempt into retryable recovery. */
export function settleExternalNavigationFailure(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  generation: number,
  error: unknown,
): boolean {
  if (state.generation !== generation || context.externalAttemptGeneration !== generation) return false;
  clearExternalAttemptTimeout(context);
  context.externalAttemptGeneration = null;
  const focusRetry = context.externalFocusFrameOnReady;
  context.externalFocusFrameOnReady = false;
  unregisterSingleFrameWindow(context.bridge, context.runtime, context.runtime.currentWindowId);
  state.status = 'error';
  context.targetSurface?.showError(error, { focusRetry });
  appendPajaMessageLog(state, 'paja', {
    type: 'paja.target.error',
    error: error instanceof Error ? error.message : String(error),
  });
  return true;
}

/** Route native iframe load failures through the current external attempt. */
export function installExternalFrameErrorHandler(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  frame: HTMLIFrameElement | null,
): void {
  frame?.addEventListener('error', () => {
    const generation = context.externalAttemptGeneration;
    if (generation === null) return;
    settleExternalNavigationFailure(state, context, generation, new Error('Target frame failed to load.'));
  });
}
