import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import {
  createPajaShareUrl,
  parseRuntimeTabsSnapshot,
  runtimeTabGenerationId,
  snapshotRuntimeTabs,
} from './browser-runtime-tabs.js';

describe('@kehto/paja runtime tabs', () => {
  it('builds clean share links for naddr, nevent, and fallback pointers', () => {
    expect(createPajaShareUrl(' naddr1test ', 'https://kehto.github.io/web/paja/?old=1#ignored'))
      .toBe('https://kehto.github.io/web/paja/?naddr=naddr1test');
    expect(createPajaShareUrl('nevent1test', 'https://kehto.github.io/web/paja/'))
      .toBe('https://kehto.github.io/web/paja/?nevent=nevent1test');
    expect(createPajaShareUrl('custom pointer', 'https://example.test/paja/'))
      .toBe('https://example.test/paja/?pointer=custom+pointer');
  });

  it('serializes open pointer tabs with the active tab index', () => {
    const state = {
      activeTabId: 'tab-2',
      tabs: [
        { id: 'tab-1', pointerValue: 'naddr1one' },
        { id: 'tab-2', pointerValue: 'nevent1two' },
      ],
    };

    expect(snapshotRuntimeTabs(state)).toEqual({
      version: 1,
      pointers: ['naddr1one', 'nevent1two'],
      activeIndex: 1,
    });
  });

  it('parses only valid persisted runtime tab snapshots', () => {
    const valid = JSON.stringify({
      version: 1,
      pointers: [' naddr1one ', '', 42, 'nevent1two'],
      activeIndex: 10,
    });

    expect(parseRuntimeTabsSnapshot(valid)).toEqual({
      version: 1,
      pointers: ['naddr1one', 'nevent1two'],
      activeIndex: 1,
    });
    expect(parseRuntimeTabsSnapshot('{bad json')).toBeNull();
    expect(parseRuntimeTabsSnapshot(JSON.stringify({ version: 2, pointers: ['naddr1one'] }))).toBeNull();
    expect(parseRuntimeTabsSnapshot(JSON.stringify({ version: 1, pointers: [] }))).toBeNull();
  });

  it('keys retained readiness to the exact tab generation rather than the pointer descriptor', () => {
    expect(runtimeTabGenerationId({ id: 'tab-3', generation: 7 })).toBe('tab-3:7');
    expect(runtimeTabGenerationId({ id: 'tab-3', generation: 8 })).toBe('tab-3:8');
  });

  it('cancels a generation-scoped readiness deadline and settles an expiry only once', async () => {
    vi.useFakeTimers();
    try {
      const runtimeTabs = await import('./browser-runtime-tabs.js') as Record<string, unknown>;
      const factory = runtimeTabs.createRuntimeTabReadinessDeadline;
      expect(factory).toBeTypeOf('function');
      if (typeof factory !== 'function') return;
      const createDeadline = factory as (
        timeoutMs: number,
        generation: number,
        onTimeout: (generation: number) => void,
      ) => { cancel(): void };
      const expired: number[] = [];
      const deadline = createDeadline(100, 7, (generation) => expired.push(generation));

      await vi.advanceTimersByTimeAsync(99);
      expect(expired).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      await vi.runAllTimersAsync();
      expect(expired).toEqual([7]);

      const cancelled = createDeadline(100, 8, (generation) => expired.push(generation));
      cancelled.cancel();
      cancelled.cancel();
      await vi.advanceTimersByTimeAsync(100);
      expect(expired).toEqual([7]);
      deadline.cancel();
    } finally {
      vi.useRealTimers();
    }
  });

  it('routes active-tab failure recovery through the existing generation-guarded reload', () => {
    const source = readFileSync(new URL('./browser-runtime-tabs.ts', import.meta.url), 'utf8');
    const reload = source.slice(
      source.indexOf('export function reloadActiveRuntimeTab('),
      source.indexOf('export function showDuplicatePointerDialog()'),
    );
    const navigation = source.slice(
      source.indexOf('function startRuntimeTabNavigation('),
      source.indexOf('function runtimeTabWindowId('),
    );

    expect(source).toContain("from './browser-target-surface.js';");
    expect(source).toContain('onRetry: () => reloadActiveRuntimeTab(state, context, { focusFrameOnReady: true })');
    expect(reload).toContain('tab.generation = ++state.generation;');
    expect(reload).toContain('tab.focusFrameOnReady = options.focusFrameOnReady === true;');
    expect(navigation).toContain('const isCurrentGeneration = () => tab.generation === generation');
    expect(navigation).toContain('if (!isCurrentGeneration()) return;');
    expect(navigation).toContain('handleRuntimeTabError(tab, state, context, error, generation);');
    expect(navigation).toContain('createRuntimeTabReadinessDeadline(');
    expect(source).toContain('destroyRuntimeTabSession(tab, context);');
    expect(navigation).toContain('projectRuntimeTabLifecycle(tab, state, context, generation);');
    expect(navigation).not.toContain('renderTargetErrorHtml');
    expect(navigation).not.toContain('srcdoc =');
  });

  it('renders a roving composite tab with sibling native actions and bounded reveal', () => {
    const source = readFileSync(new URL('./browser-runtime-tabs.ts', import.meta.url), 'utf8');
    const renderTab = source.slice(
      source.indexOf('function renderTab('),
      source.indexOf('function renderShareButton('),
    );

    expect(renderTab).toContain("const trigger = document.createElement('button');");
    expect(renderTab).toContain("trigger.setAttribute('role', 'tab');");
    expect(renderTab).toContain("trigger.setAttribute('aria-controls', runtimeTabPanelId(tab));");
    expect(renderTab).toContain('trigger.tabIndex = active ? 0 : -1;');
    expect(renderTab).toContain("case 'ArrowLeft':");
    expect(renderTab).toContain("case 'ArrowRight':");
    expect(renderTab).toContain("case 'Home':");
    expect(renderTab).toContain("case 'End':");
    expect(renderTab).toContain('wrapper.append(trigger, renderShareButton(tab), renderCloseButton(state, tab));');
    expect(renderTab).not.toContain('trigger.append(label, renderShareButton');
    expect(source).toContain("tabsEl.scrollTo({ left: nextScrollLeft, behavior: 'auto' });");
    expect(source).not.toContain('scrollIntoView');
  });

  it('synchronizes active verified target context and exact action labels without changing wire state', () => {
    const source = readFileSync(new URL('./browser-runtime-tabs.ts', import.meta.url), 'utf8');
    const hostSource = readFileSync(new URL('./browser-host.ts', import.meta.url), 'utf8');
    const activation = source.slice(
      source.indexOf('export function activateRuntimeTab('),
      source.indexOf('export function closeRuntimeTab('),
    );

    expect(activation).toContain('context.setActiveTarget(tab);');
    expect(source).toContain('context.setActiveTarget(null);');
    expect(source).toContain('share.title = `Copy share link for ${tab.title}`;');
    expect(source).toContain('close.title = `Close ${tab.title}`;');
    expect(source).toContain("surfaceHost.setAttribute('role', 'tabpanel');");
    expect(source).toContain("surfaceHost.setAttribute('aria-labelledby', runtimeTabTriggerId(id));");
    expect(source).toContain('surfaceHost.append(frame);');
    expect(source).toContain("frame.className = 'tab-frame';");
    expect(source).not.toContain("frame.setAttribute('role', 'tabpanel');");
    expect(hostSource).toContain('function setTargetDisplay(label: string, frame?: HTMLIFrameElement | null): void');
    expect(hostSource).toContain("targetEl.setAttribute('aria-label', label);");
    expect(hostSource).toContain('setActiveTarget: (tab) => setTargetDisplay(');
  });
});
