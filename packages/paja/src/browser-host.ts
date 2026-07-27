import {
  buildShellCapabilities,
  createShellBridge,
  originRegistry,
  type Capability,
  type ShellBridge,
  type ShellCapabilities,
} from '@kehto/shell';

import {
  createDevTheme,
  createPajaAdapter,
  PAJA_DEV_SIGNER_PUBKEY,
  type PajaConfirmationRequest,
} from './browser-adapter.js';
import { BrowserIntentController } from './browser-intent-controller.js';
import { InstalledNappletCatalog, matchesInstalledNappletRecord } from './installed-napplet-catalog.js';
import { createPajaThemeBroadcastLink } from './theme-broadcast.js';
import {
  createPajaSignerController,
  type PajaSignerState,
} from './browser-signers.js';
import {
  activateRuntimeTab,
  addRuntimeTab,
  closeRuntimeTab,
  getActiveTab,
  PAJA_RUNTIME_TABS_STORAGE_KEY,
  parseRuntimeTabsSnapshot,
  reloadActiveRuntimeTab,
  renderRuntimeTabs,
  resolvedTargetKey,
  runtimeTabGenerationId,
  setEmptyStageVisible,
  showDuplicatePointerDialog,
  snapshotRuntimeTabs,
  type PajaRuntimeTabsSnapshot,
  type PajaRuntimeTab,
  type PajaRuntimeTabContext,
  type PajaRuntimeTabRuntime,
} from './browser-runtime-tabs.js';
import type { BrowserIntentGeneration } from './browser-intent-controller.js';
import type { IntentRetentionParams } from '@kehto/services';
import {
  appendPajaMessageLog,
  createPajaPostMessageProxy,
  installPajaOriginRegistryProxy,
  renderPajaDevtools,
  renderPajaMessageLog,
  type PajaMessageLogEntry,
} from './browser-devtools.js';
import type { PajaHostConfig } from './options.js';
import {
  getTargetIdentity,
  navigateFrame,
  renderTargetErrorHtml,
} from './browser-target-frame.js';
import {
  resolvePajaPointer,
  type PajaResolvedPointer,
} from './runtime-resolver.js';
import { getPajaRelayUrls } from './browser-relay-runtime.js';
import type { PajaTargetCorsDiagnostic } from './target-cors.js';
import {
  PAJA_SIMULATION_DOMAINS,
  summarizePajaSimulation,
  type PajaSimulation,
  type PajaCapabilityDomain,
} from './simulation.js';

export interface PajaBrowserState {
  readonly config: PajaHostConfig;
  readonly capabilities: ShellCapabilities;
  services: string[];
  simulation: PajaSimulation;
  signer: PajaSignerState;
  resolvedTarget: PajaResolvedPointer | null;
  pointerValue: string;
  pointerStatus: string;
  tabs: PajaRuntimeTab[];
  activeTabId: string | null;
  generation: number;
  status: 'booting' | 'ready' | 'reloading' | 'error';
  messageFilter: string;
  messageLog: PajaMessageLogEntry[];
  reload(): void;
  activateTab(tabId: string): void;
  closeTab(tabId: string): void;
  setThemeMode(mode: PajaSimulation['theme']['mode']): void;
  setDomainEnabled(domain: PajaCapabilityDomain, enabled: boolean): void;
  setAclCapability(capability: Capability, enabled: boolean): void;
  useDevSigner(): void;
  connectNip07(): Promise<void>;
  connectBunker(uri: string): Promise<void>;
  loadPointer(value: string): Promise<void>;
  clearLog(): void;
  getState(): {
    generation: number;
    status: PajaBrowserState['status'];
    iframeCount: number;
    initSent: boolean;
    services: string[];
    simulation: PajaSimulation;
    signer: PajaSignerState;
    resolvedTarget: PajaResolvedPointer | null;
    pointerStatus: string;
    activeTabId: string | null;
    tabs: Array<{
      id: string;
      title: string;
      pointerValue: string;
      windowId: string | null;
      status: PajaBrowserState['status'];
      initSent: boolean;
    }>;
    messageLog: PajaMessageLogEntry[];
  };
}

declare global {
  interface Window {
    __KEHTO_PAJA__?: PajaBrowserState;
  }
}

let bridgeRef: ShellBridge | null = null;

type PajaThemeService = { publishTheme(theme: ReturnType<typeof createDevTheme>): unknown };
type PajaSignerController = ReturnType<typeof createHostSignerController>;

interface PajaHostRuntimeState extends PajaRuntimeTabRuntime {
  currentSimulation: PajaSimulation;
  themeService: PajaThemeService | null;
  catalog: InstalledNappletCatalog;
  readonly readyWaiters: Map<BrowserIntentGeneration, Set<{
    resolve(): void;
    reject(reason: Error): void;
  }>>;
  /** Immutable selected catalog record for each retained intent generation. */
  readonly intentRecords: WeakMap<BrowserIntentGeneration, ReturnType<InstalledNappletCatalog['get']>>;
}

export interface PajaBrowserStateContext extends PajaRuntimeTabContext {
  config: PajaHostConfig;
  frame: HTMLIFrameElement | null;
  stage: HTMLElement;
  bridge: ShellBridge;
  adapter: ReturnType<typeof createPajaAdapter>;
  signerController: PajaSignerController;
  capabilities: ShellCapabilities;
  runtime: PajaHostRuntimeState;
}

function readConfig(): PajaHostConfig {
  const script = document.getElementById('kehto-paja-config');
  if (!script?.textContent) {
    throw new Error('Missing Kehto Paja config.');
  }
  return JSON.parse(script.textContent) as PajaHostConfig;
}

async function readLatestConfig(fallback: PajaHostConfig): Promise<PajaHostConfig> {
  try {
    const response = await fetch(new URL('./__kehto/config.json', window.location.href), { cache: 'no-store' });
    if (!response.ok) return fallback;
    return await response.json() as PajaHostConfig;
  } catch (error) {
    console.warn('[paja] config refresh failed; using embedded config', error);
    return fallback;
  }
}

function setTargetUrlDisplay(config: PajaHostConfig, frame?: HTMLIFrameElement | null): void {
  const label = getTargetLabel(config);
  const targetEl = document.querySelector('.target');
  if (targetEl) {
    targetEl.textContent = label;
    targetEl.setAttribute('title', label);
  }
  if (frame) frame.dataset.targetUrl = label;
}

function getTargetLabel(config: PajaHostConfig): string {
  if (config.target.mode === 'runtime-pointer') return config.target.pointer?.value ?? 'runtime pointer';
  return config.target.url;
}

function readInitialPointerValue(config: PajaHostConfig): string {
  if (config.target.mode !== 'runtime-pointer') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('naddr')
    ?? params.get('nevent')
    ?? params.get('pointer')
    ?? config.target.pointer?.value
    ?? '';
}

function getRuntimeTabsStorage(config: PajaHostConfig): Storage | null {
  if (config.target.mode !== 'runtime-pointer') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readPersistedRuntimeTabs(config: PajaHostConfig): PajaRuntimeTabsSnapshot | null {
  const storage = getRuntimeTabsStorage(config);
  if (!storage) return null;
  try {
    return parseRuntimeTabsSnapshot(storage.getItem(PAJA_RUNTIME_TABS_STORAGE_KEY));
  } catch {
    return null;
  }
}

function persistRuntimeTabs(state: PajaBrowserState): void {
  const storage = getRuntimeTabsStorage(state.config);
  if (!storage) return;
  const snapshot = snapshotRuntimeTabs(state);
  try {
    if (snapshot) storage.setItem(PAJA_RUNTIME_TABS_STORAGE_KEY, JSON.stringify(snapshot));
    else storage.removeItem(PAJA_RUNTIME_TABS_STORAGE_KEY);
  } catch {
    // Storage persistence is best-effort; Paja runtime loading must keep working.
  }
}

function setStatus(state: PajaBrowserState, status: PajaBrowserState['status']): void {
  state.status = status;
  const statusEl = document.getElementById('lifecycle-status');
  if (statusEl) statusEl.textContent = status;
}

function setSimulationStatus(state: PajaBrowserState): void {
  const statusEl = document.getElementById('simulation-status');
  if (statusEl) statusEl.textContent = summarizePajaSimulation(state.simulation);
  const themeSelect = document.getElementById('simulation-theme');
  if (themeSelect instanceof HTMLSelectElement) themeSelect.value = state.simulation.theme.mode;
  renderPajaDevtools(state, { bridge: bridgeRef, devSignerPubkey: PAJA_DEV_SIGNER_PUBKEY });
}

function setPointerStatus(state: PajaBrowserState, message: string): void {
  state.pointerStatus = message;
  const statusEl = document.getElementById('runtime-pointer-status');
  if (statusEl) statusEl.textContent = message;
}

function getStage(): HTMLElement {
  const stage = document.getElementById('napplet-stage');
  if (!(stage instanceof HTMLElement)) {
    throw new Error('Missing Kehto Paja stage.');
  }
  return stage;
}

function getFrame(): HTMLIFrameElement {
  const frame = document.getElementById('napplet-frame');
  if (!(frame instanceof HTMLIFrameElement)) {
    throw new Error('Missing Kehto Paja iframe.');
  }
  frame.sandbox.add('allow-scripts');
  frame.sandbox.remove('allow-same-origin');
  return frame;
}

function confirmPajaRequest(
  state: PajaBrowserState | null,
  request: PajaConfirmationRequest,
): boolean {
  if (request.action === 'upload') {
    const filename = request.filename ?? '(unnamed blob)';
    const mimeType = request.mimeType ?? 'application/octet-stream';
    const allowed = window.confirm([
      'Paja upload request',
      `napplet: ${request.napplet.dTag} (${request.windowId})`,
      `file: ${filename}`,
      `size: ${request.size} bytes`,
      `type: ${mimeType}`,
      `server: ${request.server}`,
      request.warning,
    ].join('\n'));
    appendPajaMessageLog(state, 'paja', {
      type: `paja.upload.${allowed ? 'confirmed' : 'denied'}`,
      windowId: request.windowId,
      dTag: request.napplet.dTag,
      aggregateHash: request.napplet.aggregateHash,
      filename,
      size: request.size,
      mimeType,
      server: request.server,
      warning: request.warning,
    });
    return allowed;
  }
  const event = request.event as { kind?: unknown; content?: unknown };
  const kind = typeof event.kind === 'number' ? event.kind : 'unknown';
  const content = typeof event.content === 'string' && event.content.length > 0
    ? `\n\n${event.content.slice(0, 240)}`
    : '';
  const allowed = window.confirm(`Paja ${request.action} request\nkind: ${kind}${content}`);
  appendPajaMessageLog(state, 'paja', {
    type: `paja.${request.action}.${allowed ? 'confirmed' : 'denied'}`,
    kind,
  });
  return allowed;
}

function unregisterSingleFrameWindow(
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

export function createPajaIntentTargetOptions(
  getState: () => PajaBrowserState | null,
  getContext: () => PajaBrowserStateContext | null,
): ConstructorParameters<typeof BrowserIntentController>[0] {
  return {
    async openOrReuse(params) {
      const state = getState();
      const context = getContext();
      if (!state || !context) return null;
      const record = context.runtime.catalog.get(params.handler);
      if (!record || !recordSupportsDelivery(record, params)) return null;

      // A catalog replacement may retain the d-tag while replacing the verified
      // aggregate. Remove stale tabs before choosing any live delivery target.
      for (const stale of [...state.tabs]) {
        if (
          stale.resolvedTarget.dTag === params.handler
          && !matchesInstalledNappletRecord(record, stale.resolvedTarget)
        ) closeRuntimeTab(state, context, stale.id);
      }

      const current = state.tabs.find((tab) =>
        matchesInstalledNappletRecord(record, tab.resolvedTarget)
        && isCurrentRuntimeTabGeneration(state, context, tab),
      );
      if (current && params.behavior?.reuse !== false) {
        return bindPajaIntentGeneration(current, record, context.runtime);
      }

      const resolved = await resolvePajaPointer(record.pointer.value, pointerResolverOptions(context));
      if (
        resolved.dTag !== record.dTag
        || resolved.aggregateHash !== record.aggregateHash
        || !resolvedSupportsDelivery(resolved, params)
      ) return null;

      const currentRecord = context.runtime.catalog.validateCurrent(record, resolved);
      if (!currentRecord) return null;
      const tab = addRuntimeTab(state, context, currentRecord.pointer.value, resolved);
      persistRuntimeTabs(state);
      return bindPajaIntentGeneration(tab, currentRecord, context.runtime);
    },
    waitForReady(generation) {
      const state = getState();
      const context = getContext();
      if (!state || !context) return Promise.reject(new Error('Paja host is not available'));
      const tab = findRuntimeTabGeneration(state, generation);
      if (!tab || !isCurrentPajaIntentGeneration(generation, state, context, tab)) {
        invalidatePajaIntentGeneration(generation, context.runtime);
        return Promise.reject(new Error('intent target generation is not current'));
      }
      if (tab.windowId && context.runtime.readyWindowIds.has(tab.windowId)) return undefined;
      return new Promise<void>((resolve, reject) => {
        const waiters = context.runtime.readyWaiters.get(generation) ?? new Set();
        waiters.add({ resolve, reject });
        context.runtime.readyWaiters.set(generation, waiters);
      });
    },
    isCurrent(generation) {
      const state = getState();
      const context = getContext();
      const tab = state && context ? findRuntimeTabGeneration(state, generation) : null;
      if (!tab || !state || !context || !isCurrentPajaIntentGeneration(generation, state, context, tab)) {
        if (context) invalidatePajaIntentGeneration(generation, context.runtime);
        return false;
      }
      return true;
    },
    send(generation, delivery) {
      const state = getState();
      const context = getContext();
      const tab = state && context ? findRuntimeTabGeneration(state, generation) : null;
      if (!state || !context || !tab || !tab.windowId || !isCurrentPajaIntentGeneration(generation, state, context, tab)) {
        if (context) invalidatePajaIntentGeneration(generation, context.runtime);
        throw new Error('intent target generation is not current and ready');
      }
      const source = tab.frame.contentWindow;
      if (!source || originRegistry.getWindowId(source) !== tab.windowId) {
        throw new Error('intent target source is no longer registered');
      }
      createPajaPostMessageProxy(source, state, tab.windowId).postMessage({
        type: 'intent.deliver',
        delivery,
      }, '*');
    },
  };
}

function pointerResolverOptions(context: PajaBrowserStateContext) {
  return {
    relays: [
      ...(context.config.target.pointer?.relays ?? []),
      ...getPajaRelayUrls(context.runtime.currentSimulation),
    ],
    blossomServers: context.config.target.pointer?.blossomServers ?? [],
    maxWaitMs: context.config.target.pointer?.maxWaitMs,
  };
}

function recordSupportsDelivery(
  record: ReturnType<InstalledNappletCatalog['installed']>[number],
  params: IntentRetentionParams,
): boolean {
  return record.archetypes.some((archetype) =>
    archetype.slug === params.delivery.archetype
    && archetype.convention === params.delivery.convention,
  );
}

function resolvedSupportsDelivery(
  resolved: PajaResolvedPointer,
  params: IntentRetentionParams,
): boolean {
  return resolved.manifest.archetypes.some((archetype) =>
    archetype.slug === params.delivery.archetype
    && archetype.convention === params.delivery.convention,
  );
}

function findRuntimeTabGeneration(
  state: PajaBrowserState,
  generation: BrowserIntentGeneration,
): PajaRuntimeTab | null {
  return state.tabs.find((tab) => runtimeTabGenerationId(tab) === generation.id) ?? null;
}

function bindPajaIntentGeneration(
  tab: PajaRuntimeTab,
  record: NonNullable<ReturnType<InstalledNappletCatalog['get']>>,
  runtime: PajaHostRuntimeState,
): BrowserIntentGeneration {
  const generation = { id: runtimeTabGenerationId(tab) };
  runtime.intentRecords.set(generation, record);
  return generation;
}

function isCurrentPajaIntentGeneration(
  generation: BrowserIntentGeneration,
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  tab: PajaRuntimeTab,
): boolean {
  const record = context.runtime.intentRecords.get(generation);
  return record !== undefined
    && context.runtime.catalog.validateCurrent(record, tab.resolvedTarget) !== null
    && isCurrentRuntimeTabGeneration(state, context, tab);
}

function invalidatePajaIntentGeneration(
  generation: BrowserIntentGeneration,
  runtime: PajaHostRuntimeState,
): void {
  const waiters = runtime.readyWaiters.get(generation);
  if (!waiters) return;
  runtime.readyWaiters.delete(generation);
  for (const waiter of waiters) waiter.reject(new Error('intent target catalog record was replaced'));
}

/**
 * Reject retained readiness waits as soon as their selected catalog record is
 * replaced or removed. Without this subscription, an unready stale frame can
 * leave a retained delivery pending forever and prevent the controller from
 * retrying the current installed record.
 */
export function subscribePajaIntentCatalogChanges(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
): () => void {
  return context.runtime.catalog.onChanged((dTag) => {
    for (const [generation] of [...context.runtime.readyWaiters]) {
      const record = context.runtime.intentRecords.get(generation);
      if (!record || record.dTag !== dTag) continue;
      const tab = findRuntimeTabGeneration(state, generation);
      if (!tab || !isCurrentPajaIntentGeneration(generation, state, context, tab)) {
        invalidatePajaIntentGeneration(generation, context.runtime);
      }
    }
  });
}

function isCurrentRuntimeTabGeneration(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  tab: PajaRuntimeTab,
): boolean {
  const source = tab.frame.contentWindow;
  return state.tabs.includes(tab)
    && tab.windowId !== null
    && source !== null
    && originRegistry.getWindowId(source) === tab.windowId
    && runtimeTabGenerationId(tab) === `${tab.id}:${tab.generation}`;
}

export function markRuntimeTabReady(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  tab: PajaRuntimeTab,
  source: Window,
  registeredWindowId: string | null,
): boolean {
  if (
    !tab.windowId
    || tab.frame.contentWindow !== source
    || registeredWindowId !== tab.windowId
    || !isCurrentRuntimeTabGeneration(state, context, tab)
  ) return false;
  context.runtime.readyWindowIds.add(tab.windowId);
  for (const [generation, waiters] of [...context.runtime.readyWaiters]) {
    if (findRuntimeTabGeneration(state, generation) !== tab) continue;
    context.runtime.readyWaiters.delete(generation);
    if (!isCurrentPajaIntentGeneration(generation, state, context, tab)) {
      for (const waiter of waiters) waiter.reject(new Error('intent target catalog record was replaced'));
      continue;
    }
    for (const waiter of waiters) waiter.resolve();
  }
  tab.status = 'ready';
  if (state.activeTabId === tab.id) setStatus(state, 'ready');
  renderRuntimeTabs(state);
  return true;
}

function clearRuntimeTabGeneration(
  tab: PajaRuntimeTab,
  runtime: PajaHostRuntimeState,
): void {
  for (const [generation, waiters] of [...runtime.readyWaiters]) {
    if (generation.id !== runtimeTabGenerationId(tab)) continue;
    runtime.readyWaiters.delete(generation);
    for (const waiter of waiters) waiter.reject(new Error('intent target generation replaced'));
  }
}

/**
 * Report whether the target dev server will serve the sandboxed frame's assets.
 *
 * The napplet frame is sandboxed without `allow-same-origin`, so its module
 * scripts are fetched with `Origin: null`. Dev servers that only allow
 * localhost origins (Vite's default) block them, and the frame renders blank
 * with no signal from Paja. The probe runs on the Paja server because a browser
 * cannot send a forged `Origin` header.
 */
async function reportTargetCorsDiagnostic(state: PajaBrowserState): Promise<void> {
  let diagnostic: PajaTargetCorsDiagnostic;
  try {
    const response = await fetch(new URL('./__kehto/target-cors.json', window.location.href), {
      cache: 'no-store',
    });
    if (!response.ok) return;
    diagnostic = await response.json() as PajaTargetCorsDiagnostic;
  } catch {
    return;
  }
  if (diagnostic.status === 'allowed') return;
  appendPajaMessageLog(state, 'paja', {
    type: 'paja.target.cors.error',
    status: diagnostic.status,
    targetUrl: diagnostic.targetUrl,
    allowOrigin: diagnostic.allowOrigin,
    message: `${diagnostic.detail} ${diagnostic.hint ?? ''}`.trim(),
  });
  console.warn(`[paja] ${diagnostic.detail}\n[paja] ${diagnostic.hint ?? ''}`.trimEnd());
}

function startFrameNavigation(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
): void {
  const { config, frame, bridge, adapter, runtime } = context;
  if (!frame) return;
  const generation = state.generation;
  const isCurrentGeneration = () => state.generation === generation;
  void navigateFrame(
    frame,
    config,
    generation,
    adapter,
    state.resolvedTarget,
    undefined,
    isCurrentGeneration,
    (windowId) => {
      if (isCurrentGeneration()) runtime.currentWindowId = windowId;
    },
  ).then((windowId) => {
    if (!isCurrentGeneration()) {
      unregisterSingleFrameWindow(bridge, runtime, windowId);
      return;
    }
    runtime.currentWindowId = windowId;
  }).catch((error) => {
    if (!isCurrentGeneration()) return;
    frame.removeAttribute('src');
    frame.srcdoc = renderTargetErrorHtml(error);
    setStatus(state, 'error');
    appendPajaMessageLog(state, 'paja', {
      type: 'paja.target.error',
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(error);
  });
}

function createHostSignerController(getState: () => PajaBrowserState | null) {
  return createPajaSignerController({
    confirmRequest: (request) => confirmPajaRequest(getState(), request),
    onChange(signer) {
      const state = getState();
      if (!state) return;
      state.signer = signer;
      appendPajaMessageLog(state, 'paja', {
        type: `paja.signer.${signer.method}.${signer.status}`,
        pubkey: signer.pubkey,
        relay: signer.relay,
        error: signer.error,
      });
      setSimulationStatus(state);
      if (signer.status === 'connected') state.reload();
    },
  });
}

function hasNip07Signer(): boolean {
  const signer = (globalThis as { nostr?: unknown }).nostr;
  return typeof signer === 'object' && signer !== null;
}

function installPajaControlListeners(state: PajaBrowserState): void {
  document.getElementById('reload-target')?.addEventListener('click', () => {
    state.reload();
  });

  document.getElementById('simulation-theme')?.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (target.value === 'dark' || target.value === 'light') {
      state.setThemeMode(target.value);
    }
  });

  document.getElementById('message-filter')?.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    state.messageFilter = target.value;
    renderPajaMessageLog(state);
  });

  document.getElementById('clear-log')?.addEventListener('click', () => {
    state.clearLog();
  });

  document.getElementById('runtime-pointer-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('runtime-pointer-input');
    if (!(input instanceof HTMLInputElement)) return;
    void state.loadPointer(input.value);
  });
}

function reloadPajaTarget(state: PajaBrowserState, context: PajaBrowserStateContext): void {
  const { config, bridge, runtime } = context;
  if (config.target.mode === 'runtime-pointer') {
    reloadActiveRuntimeTab(state, context);
    return;
  }
  if (runtime.currentWindowId) {
    unregisterSingleFrameWindow(bridge, runtime, runtime.currentWindowId);
  }
  state.generation += 1;
  setStatus(state, 'reloading');
  startFrameNavigation(state, context);
}

function setRuntimeDomainEnabled(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  domain: PajaCapabilityDomain,
  enabled: boolean,
): void {
  const { adapter, runtime } = context;
  runtime.currentSimulation = {
    ...runtime.currentSimulation,
    capabilities: {
      domains: {
        ...runtime.currentSimulation.capabilities.domains,
        [domain]: enabled,
      },
      disabledDomains: PAJA_SIMULATION_DOMAINS.filter((entry) =>
        entry === domain ? !enabled : !runtime.currentSimulation.capabilities.domains[entry],
      ),
    },
  };
  state.simulation = runtime.currentSimulation;
  state.services = Object.keys(adapter.services ?? {})
    .filter((name) => runtime.currentSimulation.capabilities.domains[name as PajaCapabilityDomain] !== false)
    .sort();
  setSimulationStatus(state);
  appendPajaMessageLog(state, 'paja', { type: `paja.interface.${enabled ? 'enabled' : 'disabled'}`, domain });
  state.reload();
}

async function loadRuntimePointer(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  value: string,
  options: { readonly skipDuplicatePrompt?: boolean; readonly persist?: boolean } = {},
): Promise<void> {
  const { config, runtime } = context;
  if (config.target.mode !== 'runtime-pointer') return;
  const pointer = value.trim();
  const input = document.getElementById('runtime-pointer-input');
  if (input instanceof HTMLInputElement) input.value = pointer;
  state.pointerValue = pointer;
  if (!pointer) {
    setPointerStatus(state, 'idle');
    return;
  }
  setPointerStatus(state, 'resolving');
  setStatus(state, 'booting');
  appendPajaMessageLog(state, 'paja', { type: 'paja.pointer.resolve', pointer });
  try {
    const resolvedTarget = await resolvePajaPointer(pointer, pointerResolverOptions(context));
    runtime.catalog.install(resolvedTarget);
    const pointerStatus = `${resolvedTarget.dTag}:${resolvedTarget.aggregateHash.slice(0, 12)}`;
    setPointerStatus(state, pointerStatus);
    appendPajaMessageLog(state, 'paja', {
      type: 'paja.pointer.resolved',
      dTag: resolvedTarget.dTag,
      aggregateHash: resolvedTarget.aggregateHash,
    });
    const duplicate = options.skipDuplicatePrompt ? undefined : state.tabs.find((tab) => tab.key === resolvedTargetKey(resolvedTarget));
    if (duplicate) {
      const choice = await showDuplicatePointerDialog();
      if (choice === 'cancel') {
        setStatus(state, getActiveTab(state)?.status ?? 'ready');
        setPointerStatus(state, `already running: ${duplicate.title}`);
        appendPajaMessageLog(state, 'paja', { type: 'paja.pointer.duplicate.cancelled', tabId: duplicate.id });
        return;
      }
      if (choice === 'open-tab') {
        activateRuntimeTab(state, context, duplicate.id);
        if (options.persist !== false) persistRuntimeTabs(state);
        appendPajaMessageLog(state, 'paja', { type: 'paja.pointer.duplicate.opened', tabId: duplicate.id });
        return;
      }
    }
    addRuntimeTab(state, context, pointer, resolvedTarget);
    if (options.persist !== false) persistRuntimeTabs(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    state.resolvedTarget = null;
    setPointerStatus(state, message);
    setStatus(state, 'error');
    appendPajaMessageLog(state, 'paja', { type: 'paja.pointer.error', error: message });
  }
}

async function restorePersistedRuntimeTabs(
  state: PajaBrowserState,
  context: PajaBrowserStateContext,
  snapshot: PajaRuntimeTabsSnapshot,
): Promise<void> {
  for (const pointer of snapshot.pointers) {
    await loadRuntimePointer(state, context, pointer, { skipDuplicatePrompt: true, persist: false });
  }
  const activeTab = state.tabs[snapshot.activeIndex] ?? state.tabs[0];
  if (activeTab) activateRuntimeTab(state, context, activeTab.id);
  persistRuntimeTabs(state);
}

function snapshotPajaBrowserState(state: PajaBrowserState, runtime: PajaHostRuntimeState): ReturnType<PajaBrowserState['getState']> {
  return {
    generation: state.generation,
    status: state.status,
    iframeCount: document.querySelectorAll('iframe').length,
    initSent: runtime.currentWindowId ? runtime.readyWindowIds.has(runtime.currentWindowId) : false,
    services: state.services,
    simulation: runtime.currentSimulation,
    signer: state.signer,
    resolvedTarget: state.resolvedTarget,
    pointerStatus: state.pointerStatus,
    activeTabId: state.activeTabId,
    tabs: state.tabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      pointerValue: tab.pointerValue,
      windowId: tab.windowId,
      status: tab.status,
      initSent: tab.windowId ? runtime.readyWindowIds.has(tab.windowId) : false,
    })),
    messageLog: [...state.messageLog],
  };
}

function createPajaBrowserState(context: PajaBrowserStateContext): PajaBrowserState {
  const { config, bridge, adapter, signerController, capabilities, runtime } = context;
  return {
    config,
    capabilities,
    services: Object.keys(adapter.services ?? {}).sort(),
    simulation: runtime.currentSimulation,
    signer: signerController.getState(),
    resolvedTarget: null,
    pointerValue: readInitialPointerValue(config),
    pointerStatus: config.target.mode === 'runtime-pointer' ? 'idle' : '',
    tabs: [],
    activeTabId: null,
    generation: 0,
    status: 'booting',
    messageFilter: '',
    messageLog: [],
    reload() {
      reloadPajaTarget(this, context);
    },
    activateTab(tabId) {
      activateRuntimeTab(this, context, tabId);
      persistRuntimeTabs(this);
    },
    closeTab(tabId) {
      closeRuntimeTab(this, context, tabId);
      persistRuntimeTabs(this);
    },
    setThemeMode(mode) {
      runtime.currentSimulation = {
        ...runtime.currentSimulation,
        theme: {
          ...runtime.currentSimulation.theme,
          mode,
        },
      };
      this.simulation = runtime.currentSimulation;
      runtime.themeService?.publishTheme(createDevTheme(runtime.currentSimulation.theme.mode, runtime.currentSimulation.theme.values));
      setSimulationStatus(this);
    },
    setDomainEnabled(domain, enabled) {
      setRuntimeDomainEnabled(this, context, domain, enabled);
    },
    setAclCapability(capability, enabled) {
      const identity = getTargetIdentity(config, this.resolvedTarget);
      if (enabled) bridge.runtime.aclState.grant(identity.pubkey, identity.dTag, identity.aggregateHash, capability);
      else bridge.runtime.aclState.revoke(identity.pubkey, identity.dTag, identity.aggregateHash, capability);
      bridge.runtime.aclState.persist();
      appendPajaMessageLog(this, 'paja', { type: `paja.acl.${enabled ? 'grant' : 'revoke'}`, capability });
      renderPajaDevtools(this, { bridge, devSignerPubkey: PAJA_DEV_SIGNER_PUBKEY });
    },
    useDevSigner() {
      signerController.useDevSigner();
    },
    connectNip07() {
      return signerController.connectNip07();
    },
    connectBunker(uri) {
      return signerController.connectBunker(uri);
    },
    async loadPointer(value) {
      await loadRuntimePointer(this, context, value);
    },
    clearLog() {
      this.messageLog.length = 0;
      renderPajaMessageLog(this);
    },
    getState() {
      return snapshotPajaBrowserState(this, runtime);
    },
  };
}

async function installPajaHost(): Promise<void> {
  const config = await readLatestConfig(readConfig());
  const stage = getStage();
  const frame = config.target.mode === 'runtime-pointer' ? null : getFrame();
  setTargetUrlDisplay(config, frame);
  const runtime: PajaHostRuntimeState = {
    currentSimulation: config.simulation,
    themeService: null,
    catalog: new InstalledNappletCatalog(),
    readyWaiters: new Map(),
    intentRecords: new WeakMap(),
    currentWindowId: null,
    readyWindowIds: new Set(),
  };
  const getSimulation = () => runtime.currentSimulation;
  const themeBroadcast = createPajaThemeBroadcastLink();
  let stateRef: PajaBrowserState | null = null;
  let contextRef: PajaBrowserStateContext | null = null;
  const intentController = new BrowserIntentController(createPajaIntentTargetOptions(
    () => stateRef,
    () => contextRef,
  ));
  const signerController = createHostSignerController(() => stateRef);
  const adapter = createPajaAdapter(config, getSimulation, (theme) => {
    runtime.themeService = theme;
  }, themeBroadcast.onBroadcast, (request) => confirmPajaRequest(stateRef, request), signerController, () =>
    getTargetIdentity(config, stateRef?.resolvedTarget), () => stateRef?.reload(), {
      catalog: runtime.catalog,
      controller: intentController,
    });
  const bridge = createShellBridge(adapter);
  themeBroadcast.attach(bridge);
  bridgeRef = bridge;
  installPajaOriginRegistryProxy(originRegistry, () => stateRef);
  const capabilities = buildShellCapabilities(adapter);
  const context: PajaBrowserStateContext = {
    config,
    frame,
    stage,
    bridge,
    adapter,
    signerController,
    capabilities,
    runtime,
    navigateFrame,
    renderTargetErrorHtml,
    onTabDestroyed: (tab) => clearRuntimeTabGeneration(tab, runtime),
    setPointerStatus: (state, message) => setPointerStatus(state as PajaBrowserState, message),
    setStatus: (state, status) => setStatus(state as PajaBrowserState, status),
  };
  contextRef = context;
  const state = createPajaBrowserState(context);
  stateRef = state;

  const stopIntentCatalogChanges = subscribePajaIntentCatalogChanges(state, context);
  window.addEventListener('pagehide', stopIntentCatalogChanges, { once: true });

  window.__KEHTO_PAJA__ = state;

  window.addEventListener('message', (event) => {
    const source = event.source as Window | null;
    const sourceTab = source ? state.tabs.find((tab) => tab.frame.contentWindow === source) ?? null : null;
    const isSingleFrameMessage = frame ? event.source === frame.contentWindow : false;
    if (!sourceTab && !isSingleFrameMessage) return;
    const registeredWindowId = source ? originRegistry.getWindowId(source) ?? null : null;
    const sourceWindowId = sourceTab?.windowId ?? registeredWindowId ?? undefined;
    if (sourceTab && (!source || !sourceWindowId || registeredWindowId !== sourceWindowId)) return;
    if (isSingleFrameMessage && (!sourceWindowId || sourceWindowId !== runtime.currentWindowId)) return;
    appendPajaMessageLog(state, 'napplet->shell', event.data, sourceWindowId);
    const proxiedSource = createPajaPostMessageProxy(event.source as Window, state, sourceWindowId);
    const syntheticEvent = new Proxy(event, {
      get(target, prop) {
        if (prop === 'source') return proxiedSource;
        const val = Reflect.get(target, prop, target) as unknown;
        return typeof val === 'function' ? (val as Function).bind(target) : val;
      },
    }) as MessageEvent;
    bridge.handleMessage(syntheticEvent);
    const data = event.data as { type?: unknown } | null;
    if (data && typeof data === 'object' && data.type === 'shell.ready') {
      if (sourceTab) {
        if (source && !markRuntimeTabReady(state, context, sourceTab, source, registeredWindowId)) return;
      } else {
        if (sourceWindowId) runtime.readyWindowIds.add(sourceWindowId);
        setStatus(state, 'ready');
      }
    }
  });

  frame?.addEventListener('error', () => {
    setStatus(state, 'error');
  });

  installPajaControlListeners(state);

  setStatus(state, 'booting');
  setSimulationStatus(state);
  setPointerStatus(state, state.pointerStatus);
  if (config.target.mode === 'runtime-pointer') {
    const persistedTabs = readPersistedRuntimeTabs(config);
    const input = document.getElementById('runtime-pointer-input');
    if (input instanceof HTMLInputElement) input.value = state.pointerValue;
    if (state.pointerValue) void state.loadPointer(state.pointerValue);
    else if (persistedTabs) void restorePersistedRuntimeTabs(state, context, persistedTabs);
    else {
      setStatus(state, 'ready');
      setEmptyStageVisible(true);
      renderRuntimeTabs(state);
    }
  } else {
    startFrameNavigation(state, context);
    void reportTargetCorsDiagnostic(state);
  }
  if (hasNip07Signer()) void state.connectNip07();
}

if (typeof document !== 'undefined') {
  try {
    void installPajaHost().catch((error) => {
      const statusEl = document.getElementById('lifecycle-status');
      if (statusEl) statusEl.textContent = 'error';
      console.error(error);
    });
  } catch (error) {
    const statusEl = document.getElementById('lifecycle-status');
    if (statusEl) statusEl.textContent = 'error';
    console.error(error);
  }
}
