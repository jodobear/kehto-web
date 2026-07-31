---
phase: 107-readable-responsive-paja-system
reviewed: 2026-07-31T09:14:16Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - .changeset/readable-responsive-paja.md
  - apps/playground/napplets/feed/index.html
  - apps/playground/napplets/feed/src/main.ts
  - apps/playground/napplets/profile-viewer/index.html
  - apps/playground/napplets/profile-viewer/src/main.ts
  - docs/how-tos/paja-getting-started.md
  - docs/how-tos/paja-local-authoring.md
  - docs/packages/paja.md
  - packages/paja/README.md
  - packages/paja/src/browser-devtools.ts
  - packages/paja/src/browser-host.test.ts
  - packages/paja/src/browser-host.ts
  - packages/paja/src/browser-runtime-tabs.test.ts
  - packages/paja/src/browser-runtime-tabs.ts
  - packages/paja/src/browser-target-frame.ts
  - packages/paja/src/browser-target-surface.test.ts
  - packages/paja/src/browser-target-surface.ts
  - packages/paja/src/host-page.test.ts
  - packages/paja/src/host-page.ts
  - scripts/select-e2e-tests.mjs
  - tests/e2e/paja-runtime-pointer.spec.ts
  - tests/e2e/paja-single-window.spec.ts
  - tests/e2e/theme-broadcast.spec.ts
  - tests/unit/napplet-package-alignment.test.ts
  - tests/unit/phase-107-visual-system.test.ts
  - tests/unit/playground-gateway-guard.test.ts
  - tests/unit/select-e2e-tests.test.ts
findings:
  critical: 6
  warning: 2
  info: 0
  total: 8
status: issues_found
---

# Phase 107: Code Review Report

**Reviewed:** 2026-07-31T09:14:16Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

The responsive and host-owned recovery implementation contains six shipping blockers. Duplicate-pointer exits can leave a loading panel over the active runtime; external navigation can become permanently unrecoverable; the lifecycle live region exposes incorrect and premature states; automatic tab reloads can steal focus; and recovery content is not the tabpanel referenced by its tab. Two maintainability/test-reliability defects also remain. The focused Vitest selection passed 70/70, but the source-string controller tests do not exercise the failing transitions below.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Duplicate-pointer exits leave the loading surface over the active runtime

**Classification:** BLOCKER
**File:** `packages/paja/src/browser-host.ts:403-433`
**Issue:** `loadRuntimePointer()` shows the global pointer loading surface before resolving the pointer. When the resolved target is a duplicate, both `cancel` and `open-tab` return without transitioning or hiding that surface. The panel is an absolute, z-indexed child of the stage, so it continues to cover the active runtime with “Loading target…” even after the dialog closes or the duplicate tab is activated. The `finally` block only clears the attempt token and button busy state.

**Fix:** Add a presentation-only `hide()`/restore operation to `PajaTargetSurface`, and call it before both early returns. Restore the active tab surface without announcing a new readiness transition; do not use `showReady()` on the dummy pointer frame.

### CR-02: External frame failures can lock recovery forever

**Classification:** BLOCKER
**File:** `packages/paja/src/browser-host.ts:266-303,344,705-707`
**Issue:** The external attempt token is cleared only on a stale navigation, a rejected `navigateFrame()`, or a trusted `shell.ready`. After `srcdoc` assignment, `navigateFrame()` resolves even if the injected document never reaches the handshake. The iframe `error` listener merely writes `error`; it does not clear `externalAttemptGeneration` or expose `showError()`. In either case the loading surface remains visible, while `reloadPajaTarget()` rejects every reload because the attempt token is still non-null. The user has no enabled Retry action and cannot recover without reloading the whole Paja page.

**Fix:** Treat the ready handshake as the completion boundary. Install a bounded current-generation handshake timeout and route frame/load failures through one settlement helper that clears `externalAttemptGeneration`, resets focus intent, unregisters the failed session, and calls `targetSurface.showError(...)`. Ensure retry can cancel/supersede a wedged attempt safely.

### CR-03: Runtime-tab loading announcements are immediately replaced by internal enum values

**Classification:** BLOCKER
**File:** `packages/paja/src/browser-runtime-tabs.ts:256-263,534-544`
**Issue:** `showLoading()` correctly announces “Loading target…” or “Retrying target…”, but the next statement calls `setStatus()` with the internal values `booting` or `reloading`, overwriting the same `#lifecycle-status` live region. In addition, every tab surface receives the same global lifecycle callback, including inactive tabs, so a background tab's load/error/ready transition can overwrite the active target's status. Users and assistive technology therefore receive neither the specified loading copy nor a status reliably belonging to the visible target.

**Fix:** Separate internal runtime state mutation from lifecycle presentation. Gate lifecycle writes by active tab and current generation, map states to the required user-facing copy, and refresh that projection on tab activation. Inactive surfaces must update their local phase without writing the global live region.

### CR-04: Pointer resolution reports “Target ready” before the shell handshake

**Classification:** BLOCKER
**File:** `packages/paja/src/browser-host.ts:436-438`
**Issue:** `addRuntimeTab()` starts navigation asynchronously and returns while the new tab is still `booting`. The following `pointerTargetSurface.showReady()` immediately announces “Target ready” through the global live region. A delayed or failed `shell.ready` therefore leaves Paja claiming readiness for a frame that is still hidden and unready. This violates the phase's explicit current-source handshake boundary.

**Fix:** Hide the pointer-resolution overlay without emitting a ready lifecycle event. Only the trusted, current-frame `shell.ready` branch should call the runtime tab surface's `showReady()` and announce readiness.

### CR-05: Automatic runtime-tab reloads can steal keyboard focus

**Classification:** BLOCKER
**File:** `packages/paja/src/browser-runtime-tabs.ts:286-298`
**Issue:** Every call to `reloadActiveRuntimeTab()` sets `focusFrameOnReady = true`. The same reload route is used not only by the recovery Retry button but also by host/system reloads, including signer-driven reloads. Consequently an automatic signer connection or other background refresh can move focus into the iframe on readiness. This directly contradicts the shipped documentation that only a successful user retry focuses the frame and that background restoration never moves focus (`packages/paja/README.md:79-83`; `docs/packages/paja.md:166-171`).

**Fix:** Pass explicit reload intent, for example `reloadActiveRuntimeTab(state, context, { focusFrameOnReady: true })` only from `Retry target`. All signer, restoration, configuration, and ordinary reload paths must pass `false`.

### CR-06: The visible loading/error content is not the tabpanel controlled by its tab

**Classification:** BLOCKER
**File:** `packages/paja/src/browser-runtime-tabs.ts:249-263,500-513`
**Issue:** The tab trigger's `aria-controls` points to the iframe, and only that iframe has `role="tabpanel"`. During loading or error the iframe is hidden and the visible recovery UI is rendered in a separate sibling `surfaceHost` with no panel role, ID, or `aria-labelledby`. Thus the selected tab controls a hidden panel while its actual visible content is outside the tab relationship. The existing E2E assertion checks the relationship only after the iframe is ready, so it misses both recovery states.

**Fix:** Create one stable wrapper per tab with the panel ID, `role="tabpanel"`, and `aria-labelledby`, then render both the iframe and recovery surface inside it. Toggle children by phase while keeping the same controlled panel exposed to accessibility APIs.

## Warnings

### WR-01: Obsolete iframe error renderer remains exported and unreferenced

**Classification:** WARNING
**File:** `packages/paja/src/browser-target-frame.ts:108-111`
**Issue:** Phase 107 removed all callers of `renderTargetErrorHtml()` in favor of host-owned recovery DOM, but left the old helper exported. It is now dead code and preserves an obsolete error-document path that future changes could accidentally reintroduce.

**Fix:** Remove `renderTargetErrorHtml()` and its now-unneeded escaping dependency if no other code uses it.

### WR-02: Controller tests assert source substrings instead of recovery behavior

**Classification:** WARNING
**File:** `packages/paja/src/browser-host.test.ts:240-293`
**Issue:** The new recovery tests prove only that particular strings occur in source slices. They do not execute duplicate choices, attempt settlement, lifecycle ordering, or focus intent, so all five controller/state defects above coexist with a green focused suite. These tests will also fail on harmless refactors while missing semantically broken ordering.

**Fix:** Extract/inject the navigation and resolver dependencies, then exercise the controller with a DOM fixture or browser test. Assert each duplicate choice clears the overlay, a missing ready handshake reaches a retryable error, lifecycle messages follow exact order, inactive tabs cannot write the global status, and only Retry sets focus intent.

---

_Reviewed: 2026-07-31T09:14:16Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
