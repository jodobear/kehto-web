import { appendPajaMessageLog } from './browser-devtools.js';
import { pajaPointerResolverOptions } from './browser-intent-host.js';
import type { PajaBrowserState, PajaBrowserStateContext } from './browser-host.js';
import {
  activateRuntimeTab,
  addRuntimeTab,
  getActiveTab,
  projectActiveRuntimeTabLifecycle,
  resolvedTargetKey,
  setEmptyStageVisible,
  showDuplicatePointerDialog,
  type PajaRuntimeTabsSnapshot,
} from './browser-runtime-tabs.js';
import { resolvePajaPointer } from './runtime-resolver.js';

interface LoadRuntimePointerOptions {
  readonly skipDuplicatePrompt?: boolean;
  readonly persist?: boolean;
}

/**
 * Resolve and load one verified runtime pointer while the host owns its attempt.
 *
 * @param state - Mutable Paja browser state.
 * @param context - Host-owned runtime and cancellation context.
 * @param value - NIP-19 pointer value.
 * @param options - Duplicate-dialog and persistence controls.
 * @returns Completion after the attempt settles or becomes stale.
 */
export async function loadRuntimePointer(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  value: string,
  options: LoadRuntimePointerOptions = {},
): Promise<void> {
  const { config, runtime } = context;
  if (config.target.mode !== 'runtime-pointer' || context.destroyed) return;
  const pointer = value.trim();
  if (context.pointerAttemptGeneration !== null) return;
  const input = document.getElementById('runtime-pointer-input');
  if (input instanceof HTMLInputElement) input.value = pointer;
  state.pointerValue = pointer;
  if (!pointer) {
    context.setPointerStatus(state, 'idle');
    return;
  }
  const attemptGeneration = ++context.pointerRequestGeneration;
  const controller = new AbortController();
  context.pointerAttemptGeneration = attemptGeneration;
  context.pointerAttemptController = controller;
  const isCurrentAttempt = () => !context.destroyed
    && context.pointerAttemptGeneration === attemptGeneration
    && context.pointerAttemptController === controller
    && !controller.signal.aborted;
  const focusRetry = context.pointerFocusFrameOnReady;
  context.setPointerAttemptBusy(true);
  context.pointerTargetSurface?.showLoading(focusRetry ? 'retry' : 'initial');
  setEmptyStageVisible(false);
  context.setPointerStatus(state, 'resolving');
  if (!getActiveTab(state)) context.setStatus(state, 'booting');
  appendPajaMessageLog(state, 'paja', { type: 'paja.pointer.resolve', pointer });
  try {
    const resolvedTarget = await resolvePajaPointer(
      pointer,
      pajaPointerResolverOptions(context, controller.signal),
    );
    if (!isCurrentAttempt()) return;
    runtime.catalog.install(resolvedTarget);
    if (!isCurrentAttempt()) return;
    const pointerStatus = `${resolvedTarget.dTag}:${resolvedTarget.aggregateHash.slice(0, 12)}`;
    context.setPointerStatus(state, pointerStatus);
    if (!isCurrentAttempt()) return;
    appendPajaMessageLog(state, 'paja', {
      type: 'paja.pointer.resolved',
      dTag: resolvedTarget.dTag,
      aggregateHash: resolvedTarget.aggregateHash,
    });
    const duplicate = options.skipDuplicatePrompt
      ? undefined
      : state.tabs.find((tab) => tab.key === resolvedTargetKey(resolvedTarget));
    if (duplicate) {
      const choice = await showDuplicatePointerDialog();
      if (!isCurrentAttempt()) return;
      if (choice === 'cancel') {
        context.pointerTargetSurface?.hide();
        context.setStatus(state, getActiveTab(state)?.status ?? 'ready');
        projectActiveRuntimeTabLifecycle(state, context);
        context.setPointerStatus(state, `already running: ${duplicate.title}`);
        appendPajaMessageLog(state, 'paja', { type: 'paja.pointer.duplicate.cancelled', tabId: duplicate.id });
        return;
      }
      if (choice === 'open-tab') {
        activateRuntimeTab(state, context, duplicate.id);
        context.pointerTargetSurface?.hide();
        if (options.persist !== false) context.persistRuntimeTabs(state);
        appendPajaMessageLog(state, 'paja', { type: 'paja.pointer.duplicate.opened', tabId: duplicate.id });
        return;
      }
    }
    if (!isCurrentAttempt()) return;
    const tab = addRuntimeTab(state, context, pointer, resolvedTarget);
    tab.focusFrameOnReady = focusRetry;
    context.pointerTargetSurface?.hide();
    if (options.persist !== false) context.persistRuntimeTabs(state);
  } catch (error) {
    if (!isCurrentAttempt()) return;
    const message = error instanceof Error ? error.message : String(error);
    state.resolvedTarget = getActiveTab(state)?.resolvedTarget ?? null;
    context.setPointerStatus(state, message);
    context.setStatus(state, getActiveTab(state)?.status ?? 'error');
    context.pointerTargetSurface?.showError(error, { focusRetry });
    setEmptyStageVisible(state.tabs.length === 0 ? false : !getActiveTab(state));
    appendPajaMessageLog(state, 'paja', { type: 'paja.pointer.error', error: message });
  } finally {
    if (isCurrentAttempt()) {
      context.pointerAttemptGeneration = null;
      context.pointerAttemptController = null;
      context.pointerFocusFrameOnReady = false;
      context.setPointerAttemptBusy(false);
    }
  }
}

/** Cancel every pre-tab runtime-pointer effect owned by the host. */
export function destroyRuntimePointerWork(context: PajaBrowserStateContext): void {
  context.destroyed = true;
  context.pointerRequestGeneration += 1;
  context.pointerAttemptGeneration = null;
  const controller = context.pointerAttemptController;
  context.pointerAttemptController = null;
  if (controller && !controller.signal.aborted) {
    controller.abort(new Error('Pointer resolution cancelled because the Paja host was destroyed.'));
  }
  context.pointerFocusFrameOnReady = false;
  context.setPointerAttemptBusy(false);
}

/** Restore serialized pointers without continuing after host destruction. */
export async function restorePersistedRuntimeTabs(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  snapshot: PajaRuntimeTabsSnapshot,
): Promise<void> {
  for (const pointer of snapshot.pointers) {
    await loadRuntimePointer(state, context, pointer, { skipDuplicatePrompt: true, persist: false });
    if (context.destroyed) return;
  }
  if (context.destroyed) return;
  const activeTab = state.tabs[snapshot.activeIndex] ?? state.tabs[0];
  if (activeTab) activateRuntimeTab(state, context, activeTab.id);
  context.persistRuntimeTabs(state);
}
