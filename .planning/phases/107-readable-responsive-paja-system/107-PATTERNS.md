# Phase 107: Readable Responsive Paja System - Pattern Map

**Mapped:** 2026-07-31
**Files analyzed:** 24 new/modified files
**Analogs found:** 24 / 24 (one partial DOM-role analog; no exact existing recovery surface)

## Scope Readout

Phase 107 is a presentation and host-state refactor. Keep `navigateFrame()`, pointer verification, iframe sandboxing, window registration, generation checks, `MessageEvent.source` checks, bridge/session teardown, NAP message shapes, capabilities, and package versions unchanged. Add no dependency and no public package export for the target-surface helper.

Feed/profile scope is token, type, spacing, and semantic tone consumption only. Recovery behavior and state-specific copy for those napplets remain Phase 108.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/paja/src/host-page.ts` | component | transform | same file, especially lines 20-95 and 99-191 | exact-current |
| `packages/paja/src/browser-target-surface.ts` (new, private) | component | event-driven | `packages/paja/src/browser-devtools.ts:282-358` | partial role/data-flow match |
| `packages/paja/src/browser-host.ts` | controller | event-driven / request-response | same file, lines 237-356 and 387-440 | exact-current |
| `packages/paja/src/browser-runtime-tabs.ts` | controller | event-driven | same file, lines 162-260 and 396-468 | exact-current |
| `packages/paja/src/browser-target-frame.ts` | service | request-response | same file, lines 64-105 | exact-current |
| `apps/playground/napplets/feed/index.html` | component | transform | `apps/playground/napplets/profile-viewer/index.html` | role-match |
| `apps/playground/napplets/feed/src/main.ts` | controller | event-driven | `apps/playground/napplets/profile-viewer/src/main.ts:44-58` | exact role/data-flow match |
| `apps/playground/napplets/profile-viewer/index.html` | component | transform | `apps/playground/napplets/feed/index.html` | role-match |
| `apps/playground/napplets/profile-viewer/src/main.ts` | controller | event-driven | `apps/playground/napplets/feed/src/main.ts:24-38` | exact role/data-flow match |
| `packages/paja/src/host-page.test.ts` | test | transform | same file, lines 5-69 | exact-current |
| `packages/paja/src/browser-target-surface.test.ts` (new) | test | event-driven | `packages/paja/src/browser-runtime-tabs.test.ts` | role-match |
| `packages/paja/src/browser-host.test.ts` | test | event-driven / source-contract | same file, lines 61-106 and 108-146 | exact-current |
| `packages/paja/src/browser-runtime-tabs.test.ts` | test | event-driven / transform | same file, lines 10-56 | exact-current |
| `tests/unit/phase-107-visual-system.test.ts` (new) | test | batch source analysis | `tests/unit/playground-dom-safety-guard.test.ts` | role-match |
| `tests/e2e/paja-single-window.spec.ts` | test | request-response / event-driven | same file, lines 36-173 and 583-643 | exact-current |
| `tests/e2e/paja-runtime-pointer.spec.ts` | test | request-response / event-driven | same file, lines 29-101 and 206-299 | exact-current |
| `tests/e2e/theme-broadcast.spec.ts` | test | pub-sub / browser transform | same file, lines 31-128 and 130-159 | exact-current |
| `scripts/select-e2e-tests.mjs` | utility | batch | same file, lines 48-122 and 175-273 | exact-current |
| `tests/unit/select-e2e-tests.test.ts` | test | batch | same file, lines 31-51 | exact-current |
| `packages/paja/README.md` | config (documentation) | transform | same file, lines 26-68 and 98-107 | exact-current |
| `docs/packages/paja.md` | config (documentation) | transform | same file, lines 112-188 and 338-341 | exact-current |
| `docs/how-tos/paja-getting-started.md` | config (documentation) | transform | same file, lines 30-37 and 54-78 | exact-current |
| `docs/how-tos/paja-local-authoring.md` | config (documentation) | transform | same file, lines 62-96 | exact-current |
| `.changeset/readable-responsive-paja.md` (new) | config | batch | historical `.changeset/paja-standard-nap-social-cache.md` at `a8cc3cfc` | role-match |

## Pattern Assignments

### `packages/paja/src/host-page.ts` (component, transform)

**Analog:** current `packages/paja/src/host-page.ts`

**Import and renderer convention** (lines 1-14):

```typescript
import type { PajaHostConfig } from './options.js';
import { summarizePajaSimulation } from './simulation.js';

export function renderPajaHtml(config: PajaHostConfig): string {
  const configJson = escapeJsonForHtml(JSON.stringify(config));
  const targetLabel = escapeAttribute(getTargetLabel(config));

  return `<!doctype html>
```

Keep the complete document renderer, relative `.js` import convention, and HTML escaping helpers. Replace the current raw presentation vocabulary inside this template; do not move to a framework or component registry.

**Desktop grid seam** (lines 33-55):

```css
body { height: 100vh; display: grid; grid-template-rows: 38px minmax(0, 1fr) 30px; overflow: hidden; }
.top { display: grid; grid-template-columns: var(--paja-console-column) minmax(0, 1fr); }
main { min-height: 0; display: grid; grid-template-columns: var(--paja-console-column) minmax(0, 1fr); }
.console { min-height: 0; overflow: auto; border-right: 1px solid var(--line); }
```

Copy grid ownership, then apply locked geometry: 48px header, 360px console, flexible `minmax(0, 1fr)` stage, wrapping footer of at least 32px. At `max-width: 640px`, replace the current 900px rule with identity/tabs/command rows, 224px independently scrolling controls, and a stage of at least 320px.

**Semantic scaffold seam** (lines 99-150, 157-191):

```html
<header class="bar top">
  <div class="top-console">
    <div class="brand">@kehto/<span class="brand-product">paja</span></div>
    <div class="target" title="${targetLabel}">${targetLabel}</div>
  </div>
  <div class="top-stage">
    <div class="tabs" id="napplet-tabs" role="tablist" aria-label="Loaded napplets"></div>
  </div>
</header>
<main>
  <aside class="console" aria-label="Paja development controls">
```

Preserve landmark ownership and IDs used by controllers/tests. Add one persistent lifecycle status region (`role="status" aria-live="polite" aria-atomic="true"`), labelled stage, empty/loading/error containers, exact Phase 107 copy, and stable retry/return/details nodes. Long target text needs `title` plus an accessible full value.

**Tests to update:** `packages/paja/src/host-page.test.ts` uses direct string contracts:

```typescript
const html = renderPajaHtml(config);
expect(html).toContain('<header class="bar top">');
expect(html).toContain('sandbox="allow-scripts"');
expect(html).not.toContain('src="about:blank"');
```

Extend this style for exact tokens, copy, semantic landmarks, one status region, stage states, 640px breakpoint, and unchanged `sandbox="allow-scripts"` / config escaping.

---

### `packages/paja/src/browser-target-surface.ts` and `.test.ts` (new component/controller)

**Closest analog:** `packages/paja/src/browser-devtools.ts` for private DOM construction and safe text projection. There is no exact existing empty/loading/ready/error recovery controller.

**Safe DOM/text pattern** (lines 282-316):

```typescript
export function renderPajaMessageLog(state: PajaDevtoolsState): void {
  const container = document.getElementById('message-log');
  if (!container) return;
  const rows = state.messageLog.map((entry) => {
    const row = document.createElement('div');
    row.className = 'log-row';
    const detail = document.createElement('div');
    detail.className = 'log-detail';
    detail.textContent = entry.detail;
    detail.title = entry.preview;
    row.append(detail);
    return row;
  });
  container.replaceChildren(...rows);
}
```

Copy `createElement`, `textContent`, `dataset`, native buttons, and early type/element checks. For recovery, create the subtree once and mutate stable nodes; do **not** copy `replaceChildren()` on each error transition because retry focus must survive.

**Native control/focus pattern** from `browser-runtime-tabs.ts` (lines 263-299):

```typescript
return new Promise((resolve) => {
  const cleanup = (choice: PajaDuplicateChoice) => {
    backdrop.hidden = true;
    loadAgain.removeEventListener('click', onLoadAgain);
    resolve(choice);
  };
  loadAgain.addEventListener('click', onLoadAgain);
  backdrop.hidden = false;
  loadAgain.focus();
});
```

Adapt to a narrow private API such as `showEmpty()`, `showLoading()`, `showReady(frame)`, `showError(error)`, `setRetryHandler()`, `focusRetry()`, and `focusReturnTarget()`. Required implementation details:

- Set diagnostic with `textContent`, initially collapsed in native `<details>`.
- Only concise error sentence gets `role="alert"`; controls/details stay outside it.
- Set stage `aria-busy="true"` during load/retry.
- Disable Retry during one active attempt; on repeat failure re-enable and refocus the same node.
- On success focus iframe only for user-initiated load/retry.
- Keep exact copy from UI-SPEC; no protocol postMessage or loader logic in this module.

**Test analog:** `packages/paja/src/browser-runtime-tabs.test.ts:10-56` uses focused pure contracts with direct state fixtures. Vitest runs in `node` (`vitest.config.ts:23-29`), so either keep the surface core DOM-agnostic/pure and test projections directly, or use source-contract tests plus Playwright for real DOM. Do not assume jsdom exists.

---

### `packages/paja/src/browser-host.ts` and `browser-host.test.ts` (controller, event-driven/request-response)

**Analog:** current controller; preserve its state/context split and inject the new surface through the existing context seam.

**Generation-safe single-frame load** (lines 275-310):

```typescript
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
  // Replace current error srcdoc writes with host-surface projection.
});
```

Keep this exact loader call, current-generation predicate, stale-result cleanup, and message logging. The catch must stop assigning `frame.srcdoc = renderTargetErrorHtml(error)` and instead report to the host surface.

**Existing retry route** (lines 345-357):

```typescript
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
```

Wire `Retry target` to `state.reload()` for external targets. Add one in-flight guard at this controller boundary; do not add another fetch or iframe navigation implementation.

**Pre-tab pointer-resolution seam** (lines 387-440):

```typescript
const pointer = value.trim();
state.pointerValue = pointer;
if (!pointer) {
  setPointerStatus(state, 'idle');
  return;
}
setPointerStatus(state, 'resolving');
setStatus(state, 'booting');
try {
  const resolvedTarget = await resolvePajaPointer(pointer, pajaPointerResolverOptions(context));
  // ... duplicate handling and addRuntimeTab(...)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  state.resolvedTarget = null;
  setPointerStatus(state, message);
  setStatus(state, 'error');
}
```

Preserve typed pointer for retry. Add a request-generation/in-flight guard around resolution because no tab exists yet. Retry delegates to `state.loadPointer(pointer)`. A failed new pointer must not destroy an already-ready tab.

**Source/auth guard** (lines 613-647):

```typescript
const sourceTab = source ? state.tabs.find((tab) => tab.frame.contentWindow === source) ?? null : null;
const isSingleFrameMessage = frame ? event.source === frame.contentWindow : false;
if (!sourceTab && !isSingleFrameMessage) return;
const registeredWindowId = source ? originRegistry.getWindowId(source) ?? null : null;
if (sourceTab && (!source || !sourceWindowId || registeredWindowId !== sourceWindowId)) return;
if (isSingleFrameMessage && (!sourceWindowId || sourceWindowId !== runtime.currentWindowId)) return;
bridge.handleMessage(syntheticEvent);
if (data && typeof data === 'object' && data.type === 'shell.ready') {
  // mark ready only here
}
```

Do not change this trust boundary. Surface success only after current-source `shell.ready`, not after `srcdoc` assignment.

**Test pattern:** `browser-host.test.ts:61-106` reads source and asserts registration/CSP ordering. Add negative guards that visible error handling no longer calls `renderTargetErrorHtml`, retry adds no `postMessage`/message type, and source/generation checks remain present. Add focused pure tests for the pre-tab attempt token and stale settlement where feasible.

---

### `packages/paja/src/browser-runtime-tabs.ts` and `.test.ts` (controller, event-driven)

**Analog:** current tab controller.

**Reload/teardown pattern** (lines 247-260 and 396-405):

```typescript
const tab = getActiveTab(state);
if (!tab) return;
destroyRuntimeTab(tab, context);
tab.generation = ++state.generation;
tab.windowId = null;
tab.status = 'reloading';
tab.frame = createRuntimeTabFrame(tab, state, context);
context.stage.append(tab.frame);
activateRuntimeTab(state, context, tab.id);
startRuntimeTabNavigation(tab, state, context);
```

```typescript
context.onTabDestroyed?.(tab);
if (tab.windowId) {
  context.bridge.runtime.destroyWindow(tab.windowId);
  context.bridge.runtime.sessionRegistry.unregister(tab.windowId);
  originRegistry.unregister(tab.windowId);
  context.runtime.readyWindowIds.delete(tab.windowId);
}
tab.frame.remove();
```

Retry an existing tab only through `reloadActiveRuntimeTab()`. Preserve teardown order, new generation, current-tab checks, and one iframe per tab. The host surface belongs beside each tab frame/panel, not inside target `srcdoc`.

**Navigation error seam** (lines 430-468):

```typescript
const generation = tab.generation;
void context.navigateFrame(
  tab.frame,
  context.config,
  generation,
  context.adapter,
  tab.resolvedTarget,
  runtimeTabWindowId(context.config, tab),
  () => tab.generation === generation,
).catch((error) => {
  if (tab.generation !== generation) return;
  tab.status = 'error';
  appendPajaMessageLog(state, 'paja', {
    type: 'paja.target.error',
    error: error instanceof Error ? error.message : String(error),
  }, tab.windowId ?? undefined);
});
```

Replace only error `srcdoc` presentation. Keep the existing log event and generation rejection.

**Tab action naming pattern** (lines 324-349):

```typescript
share.setAttribute('aria-label', `Copy share link for ${tab.title}`);
share.title = 'Copy share link';
close.setAttribute('aria-label', `Close ${tab.title}`);
```

Update `title` to the same specific full label required by UI-SPEC. Do not copy current nesting of share/close inside the `role="tab"` wrapper. Render a separate tab trigger with `aria-selected`, `aria-controls`, and roving `tabindex` beside separate share/close buttons. Add Arrow/Home/End keyboard navigation and immediately reveal active trigger in the horizontal strip.

**Tests:** keep current pure snapshot/share-link coverage (`browser-runtime-tabs.test.ts:10-56`) and add roving-focus/tab activation, separate action ownership, active target-label callback, reload concurrency, stale generation, and close/focus fallback contracts.

---

### `packages/paja/src/browser-target-frame.ts` (service, request-response)

**Analog:** same file. This is preserved security-sensitive code, not the place for recovery UI.

**Verified navigation pattern** (lines 64-105):

```typescript
export async function navigateFrame(/* ... */): Promise<string | null> {
  const identity = getTargetOriginIdentity(config, resolvedTarget);
  const environment = resolvePajaFrameEnvironment(adapter, identity);
  const domains = environment.capabilities.domains;
  if (config.target.mode === 'runtime-pointer') {
    if (isCurrent && !isCurrent()) return null;
    const registeredWindowId = registerFrameForGeneration(frame, config, generation, identity, environment, windowId);
    onRegistered?.(registeredWindowId);
    frame.removeAttribute('src');
    frame.srcdoc = injectNappletNamespacePrelude(
      injectPajaRuntimeCsp(resolvedTarget.indexHtml, connectOrigins(/* ... */)),
      { domains },
    );
    return registeredWindowId;
  }
  const html = await fetchTargetHtml();
  if (isCurrent && !isCurrent()) return null;
  // same register-before-srcdoc order for external target
}
```

Keep register-before-execute order, verified bytes, CSP injection, namespace prelude, `srcdoc`, and current-generation callback. Remove `renderTargetErrorHtml()` (lines 108-111) once callers use host DOM. Do not move error rendering into this service.

---

### Feed/profile HTML token consumers

**Files:**

- `apps/playground/napplets/feed/index.html`
- `apps/playground/napplets/profile-viewer/index.html`

**Closest analog:** each file's current scoped single-document CSS; canonical dynamic inputs come from `apps/playground/src/theme.ts:116-139`:

```typescript
setThemeVariable('--nap-theme-background', background);
setThemeVariable('--nap-theme-text', text);
setThemeVariable('--nap-theme-primary', primary);
setThemeVariable('--nap-theme-surface-1', mixHexColors(background, text, isLight ? 0.08 : 0.12));
setThemeVariable('--nap-theme-surface-2', mixHexColors(background, text, isLight ? 0.12 : 0.18));
setThemeVariable('--nap-theme-border', mixHexColors(background, text, isLight ? 0.22 : 0.30));
setThemeVariable('--nap-theme-muted', mixHexColors(text, background, isLight ? 0.38 : 0.55));
setThemeVariable('--nap-theme-success', '#39ff14');
setThemeVariable('--nap-theme-danger', '#ff3b3b');
```

Declare local `--ui-*` aliases once in each HTML `:root`; component rules consume only those aliases. Do not change `theme.ts` or the NAP-THEME payload.

Current feed/profile rules show exactly what must be normalized:

```css
/* feed/index.html:10-34 */
body { background: var(--nap-theme-background, #f6f5ef); font-size: 11px; }
.feed-status { color: var(--nap-theme-muted, #666); font-size: 10px; padding: 2px 0; }

/* profile-viewer/index.html:31-40 */
.profile-title { color: var(--nap-theme-muted, #666); font-size: 9px; }
#profile-status { color: var(--nap-theme-muted, #666); font-size: 10px; }
```

Use only 12/14/18/24px, weights 400/600, and 4/8/16/24/32/48/64px spacing tokens. Preserve current semantic DOM, `min-width: 0`, `overflow-wrap:anywhere`, media behavior, and loading/data behavior.

---

### Feed/profile TypeScript tone controllers

**Files:**

- `apps/playground/napplets/feed/src/main.ts`
- `apps/playground/napplets/profile-viewer/src/main.ts`

**Analog:** the files mirror one another. Current seam (feed lines 24-38; profile lines 44-58):

```typescript
function formatError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.length > 0) return error;
  return fallback;
}

function setStatus(text: string, color: 'gray' | 'green' | 'red' = 'gray'): void {
  statusEl.textContent = text;
  statusEl.style.color = /* raw semantic color selection */;
}
```

Keep `textContent` and existing call sites. Replace color names/inline `style.color` with a semantic tone union and `statusEl.dataset.tone = tone` (`neutral | success | danger`). CSS owns the mapping. Do not add recovery actions or rewrite status copy in Phase 107.

---

### `tests/unit/phase-107-visual-system.test.ts` (new batch/static guard)

**Analog:** `tests/unit/playground-dom-safety-guard.test.ts:12-38`:

```typescript
function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) return listSourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

const offenders = roots.flatMap(/* ... */).flatMap((file) => {
  const source = readFileSync(file, 'utf8');
  return source.split('\n')
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => /\.\s*innerHTML\s*=/.test(line));
});
expect(offenders).toEqual([]);
```

Copy filesystem/source-analysis conventions and line-numbered offender output. Build declaration-aware helpers rather than whole-file color/number regexes:

1. Extract the token declaration block separately from component rules.
2. Allow raw colors only in Paja token declarations and feed/profile alias fallbacks.
3. Inspect only spacing-bearing declarations (`margin*`, `padding*`, `gap`, grid/flex gaps), excluding border widths, radii, line heights, dimensions, and focus strokes.
4. Assert font-size declarations are 12/14/18/24px and weights 400/600.
5. Assert feed/profile TypeScript has no `statusEl.style.color` and uses semantic tone data.
6. Assert error diagnostics use `textContent`, no failure path writes iframe error `srcdoc`, and no new NAP message type is introduced.

No exact declaration-aware CSS parser exists in the repository; this new guard must encode the UI-SPEC distinctions explicitly.

---

### `tests/e2e/paja-single-window.spec.ts` (external target browser proof)

**Analog:** same real Paja server/target fixture. Setup pattern (lines 36-59):

```typescript
test.beforeAll(async () => {
  targetServer = await startTargetServer();
  runtimeServer = await startPajaServer({
    options: { targetUrl: targetServer.url, port: 0 },
    now: new Date('2026-06-21T00:00:00.000Z'),
  });
});

await page.goto(runtimeServer.url);
```

**Current security/reload assertions** (lines 73-128):

```typescript
await expect(page.locator('iframe')).toHaveCount(1);
await expect(page.locator('#napplet-frame')).toHaveAttribute('sandbox', 'allow-scripts');
await expect(page.locator('#napplet-frame')).not.toHaveAttribute('sandbox', /allow-same-origin/);
const firstGeneration = await page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation ?? -1);
await page.locator('#reload-target').click();
await expect.poll(async () => page.evaluate(() => window.__KEHTO_PAJA__?.getState().generation)).toBe(firstGeneration + 1);
await expect(page.locator('iframe')).toHaveCount(1);
```

Extend fixture server controls to fail, repeat-fail, delay, then recover. Prove host-owned error DOM, exact copy, literal HTML-like diagnostic, initially collapsed details, Enter/Space retry, one request while busy, focus retained after repeat failure, iframe focus after success, return action, and no error document assigned to iframe.

Run geometry twice with `page.setViewportSize({ width: 1280, height: 720 })` and `{ width: 375, height: 812 }`. Follow repository measurement style from `shell-ui-state-surfaces.spec.ts:246-259`: collect `clientWidth`/layout values in one `page.evaluate()`, then assert with diagnostic messages. Measure console/stage columns, 224px phone controls, >=320px stage, target sizes, footer reachability, and `documentElement.scrollWidth === clientWidth`.

Keep message-shape/session assertions surrounding recovery; compare message types before/after retry to prove no new NAP traffic.

---

### `tests/e2e/paja-runtime-pointer.spec.ts` (verified pointer browser proof)

**Analog:** same in-process pointer server and real resolver path.

**Verified fixture pattern** (lines 29-99):

```typescript
const server = await startPointerServer();
const bytes = Buffer.from(html);
const hash = createHash('sha256').update(bytes).digest('hex');
const aggregateHash = computeAggregateHash([{ path: '/index.html', sha256: hash }]);
// signed NIP-5D event + relay websocket fixture
await page.goto(server.url);
await expect(page.locator('iframe')).toHaveAttribute('srcdoc', /Configured Relay Target/);
const srcdoc = await page.locator('iframe').getAttribute('srcdoc');
expect(srcdoc!.indexOf('Content-Security-Policy')).toBeLessThan(
  srcdoc!.indexOf('data-kehto-nip5d-injection'),
);
await expect(page.locator('iframe')).toHaveAttribute('sandbox', /allow-scripts/);
await expect(page.locator('iframe')).not.toHaveAttribute('sandbox', /allow-same-origin/);
```

Use `startPointerServer()` (`paja-runtime-pointer.spec.ts:206-261`) and `createPointerFixture()` (`264-299`); add deterministic relay/Blossom failure and recovery controls without bypassing signature/hash/verified-byte resolution. Cover:

- pre-tab pointer failure and retry through preserved `loadPointer(pointer)`;
- active-tab navigation failure and retry through `reloadActiveRuntimeTab()`;
- no duplicate tabs/attempts from rapid activation;
- ready/loading/error tab coexistence and active target label sync;
- existing CSP-before-bootstrap, sandbox, registered source, and one `shell.ready` session after recovery;
- no new message type.

Repeat 1280x720 and 375x812 layout/tab-strip/keyboard assertions on the real verified pointer path.

---

### `tests/e2e/theme-broadcast.spec.ts` (feed/profile computed-style proof)

**Analog:** same spec already resolves a real profile iframe and reads computed CSS (`theme-broadcast.spec.ts:120-145`):

```typescript
const bodyBg = await prefFrameDirect.evaluate(() => getComputedStyle(document.body).backgroundColor);
expect(bodyBg).toBe(DARK_BG_RGB);

const profileFrame = await getNappletFrame(page, 'profile-viewer-frame-container');
if (!profileFrame) throw new Error('profile frame not found');
const initial = await profileFrame.evaluate(async () => {
  // read live injected theme
});
```

Extend with feed and profile selectors and `getComputedStyle(...).fontSize` assertions for status, author/time/content, title/name/pubkey/about/detail. Assert every routine value parses to >=12px and semantic colors update through the existing NAP-THEME route. Do not add feed/profile recovery behavior.

---

### E2E selector files

**Files:** `scripts/select-e2e-tests.mjs`, `tests/unit/select-e2e-tests.test.ts`

**Current group seam** (`scripts/select-e2e-tests.mjs:83-85`):

```javascript
paja: [
  'tests/e2e/paja-single-window.spec.ts',
],
```

Add `tests/e2e/paja-runtime-pointer.spec.ts`. Preserve `uniq(...).sort()` (`148-150`), direct-spec selection (`175-178`), package classification (`192-194`), and existing-spec filtering (`156-158`).

**Unit contract** (`tests/unit/select-e2e-tests.test.ts:44-51`):

```typescript
const result = selectE2eTests(['packages/paja/src/server.ts']);
expect(result.runE2e).toBe(true);
expect(result.specs).toEqual(['tests/e2e/paja-single-window.spec.ts']);
```

Change expected sorted list to both Paja specs. Keep planning/docs/changeset skip behavior unchanged.

---

### Documentation files

**Files:**

- `packages/paja/README.md`
- `docs/packages/paja.md`
- `docs/how-tos/paja-getting-started.md`
- `docs/how-tos/paja-local-authoring.md`

Update the existing browser-host sections rather than adding a disconnected design appendix.

**Package README seam** (`packages/paja/README.md:26-31`, `98-107`):

```markdown
Local target-url mode keeps one target iframe with a reload loop and a
development console wired through a real `ShellBridge`...

Each loaded pointer becomes a closeable header tab...
```

Document desktop/phone composition and host-owned failure/retry/return behavior while stating retry reuses existing verified load paths and adds no NAP message.

**Package docs seam** (`docs/packages/paja.md:112-126`, `166-188`, `338-341`) already owns the full browser-host and runtime-pointer descriptions. Update those passages and exact button names (`Load target`, `Reload target`, `Retry target`). Keep the manifest version row at `0.11.0`; Phase 107 must not directly change package versions.

**How-to seams:** `paja-getting-started.md:30-37` and `paja-local-authoring.md:62-96` currently describe blank/failure signaling and the reload button. Replace stale blank-frame-only language with the host error card, collapsed diagnostics, Retry, and return path. Preserve CORS guidance and protocol/security wording.

---

### `.changeset/readable-responsive-paja.md` (config, batch)

**Historical analog:** `.changeset/paja-standard-nap-social-cache.md` from commit `a8cc3cfc`:

```markdown
---
"@kehto/paja": minor
---

Describe the shipped Paja behavior in one user-facing sentence.
```

Only `@kehto/paja` ships changed package output; playground feed/profile files are app code, not packages. Use `minor` because this is a new 0.x user-facing capability. Keep the changeset intact; do not edit `packages/paja/package.json`, `jsr.json`, changelog, or docs version row in this phase.

## Shared Patterns

### Semantic visual vocabulary

**Source:** locked `107-UI-SPEC.md`; current raw defaults begin at `host-page.ts:21-30`.

Apply to Paja root and feed/profile alias blocks:

```css
--ui-color-background: #101211;
--ui-color-surface: #181b19;
--ui-color-surface-raised: #20241f;
--ui-color-foreground: #f4f0df;
--ui-color-muted: #a9ad9f;
--ui-color-border: #626a60;
--ui-color-accent: #d8c36a;
--ui-color-danger: #f0a0a0;
--ui-color-danger-surface: #2b1e1e;
--ui-color-success: #a9d38f;
```

Feed/profile values are local fallbacks over matching `--nap-theme-*` inputs. Raw literals stay only in declaration/fallback blocks. Components use `var(--ui-...)`.

### Safe untrusted diagnostic text

**Source:** `browser-devtools.ts:289-314`; apply to target error surface and logs.

```typescript
const detail = document.createElement('div');
detail.className = 'log-detail';
detail.textContent = entry.detail;
detail.title = entry.preview;
```

Never interpolate error text through `innerHTML` or iframe `srcdoc`. The existing repository-wide guard (`tests/unit/playground-dom-safety-guard.test.ts:24-38`) shows line-numbered sink detection style.

### Session teardown and stale-result rejection

**Sources:** `browser-host.ts:275-310`, `browser-runtime-tabs.ts:396-405`, and `browser-runtime-tabs.ts:430-468`.

Apply to every retry path: unregister/destroy old window/session/origin state, increment generation, reject stale settlement, then use the existing loader. UI busy flags supplement; they do not replace generation/source checks.

### Message source trust

**Source:** `browser-host.ts:613-647`.

Accept lifecycle/message traffic only from the currently registered iframe window and matching window ID. Retry controls remain host-local; do not post a recovery message into the napplet.

### Change-only lifecycle announcements

No exact codebase analog exists. Preserve the existing single `setStatus()` seam (`browser-host.ts:237-255`), but add an equality guard before changing text. One pre-existing `role="status"` region owns `Loading target…`, `Retrying target…`, and `Target ready`; concise changed failure copy alone uses `role="alert"`.

### Native control construction

**Source:** `browser-devtools.ts:318-358` and `browser-runtime-tabs.ts:324-360`.

Use `document.createElement('button')`, `type = 'button'`, visible `textContent`, exact `aria-label`, exact `title`, and click listeners. Native buttons supply Enter/Space; custom keyboard handling is only for the composite tablist navigation model.

### Testing split

- Vitest source/static guards: tokens, typography, spacing, safe DOM sinks, no error `srcdoc`, no new message type.
- Playwright: computed styles, viewport geometry, horizontal overflow, focus, native keyboard activation, concurrency, failure/retry/recovery, real verified loader/session behavior.
- Existing NIP-5D conformance guards remain unchanged and green; do not weaken allowlists or snapshots for visual work.

## No Analog Found

None. Every planned file has at least a role-match or historical analog. Three concerns have only partial analogs and therefore require the locked research/UI contract:

| File/Concern | Closest Partial Match | Why Planner Must Use Research/UI-SPEC |
|---|---|---|
| `packages/paja/src/browser-target-surface.ts` | `browser-devtools.ts:282-358` | Repository has private safe DOM renderers but no stable empty/loading/error/retry surface with focus restoration. |
| Change-only lifecycle announcer | `browser-host.ts:237-255` | Existing setter writes every call; UI-SPEC requires one polite atomic region and unchanged-text suppression. |
| Declaration-aware CSS contract parser | `tests/unit/playground-dom-safety-guard.test.ts:12-38` | Existing static guards scan source but do not distinguish token declarations, component consumption, spacing properties, strokes, and computed type. |

## Planner Guardrails

- Do not export `browser-target-surface.ts` from `packages/paja/src/index.ts`; it is browser-host private and bundled through `browser-host.ts`.
- Do not modify `apps/playground/src/theme.ts`; map its current `--nap-theme-*` variables locally.
- Do not add feed/profile recovery actions or new copy.
- Do not change `navigateFrame()` behavior beyond removing the obsolete visible error-HTML helper after all callers migrate.
- Do not count iframe `srcdoc` assignment as ready; only current-source `shell.ready` makes a target ready.
- Do not change sandbox permissions, NIP-5D verified bytes/CSP ordering, NAP capabilities/messages, or package versions.
- Refresh NIP-5D draft PR 2303 head before implementation/shipping; research authority was `eb45dfd7335b7f88cb53781984c553581d2b4c34`. NAP-SHELL and NAP-THEME authority was `napplet/naps` master `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`.

## Metadata

**Analog search scope:** `packages/paja/src`, `apps/playground/napplets/feed`, `apps/playground/napplets/profile-viewer`, `apps/playground/src/theme.ts`, `tests/unit`, `tests/e2e`, `scripts`, package docs/how-tos, and changeset history.

**Strong analogs used:** `host-page.ts`, `browser-host.ts`, `browser-runtime-tabs.ts`, `browser-target-frame.ts`, `browser-devtools.ts`, plus directly corresponding test/docs files.

**Pattern extraction date:** 2026-07-31
