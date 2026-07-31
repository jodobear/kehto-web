---
phase: 107-readable-responsive-paja-system
reviewed: 2026-07-31T09:58:17Z
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
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 107: Code Review Report

**Reviewed:** 2026-07-31T09:58:17Z
**Depth:** standard  
**Files Reviewed:** 27  
**Status:** issues_found

## Summary

All eight findings from the first review are fixed at HEAD `9290e8c4`: duplicate exits restore the active runtime, external navigation settles missing handshakes into retryable recovery, lifecycle projection is active-tab scoped, readiness waits for the trusted handshake, automatic reloads preserve focus, recovery remains inside its controlled tabpanel, the obsolete renderer is gone, and browser tests now cover the controller transitions. One new lifecycle blocker remains in the presentation-only hide operation used by the pointer resolver.

Verification completed with a clean build, focused Vitest (8 files, 69/69), and the focused Chromium run through all Phase 107 recovery cases. Chromium passed the pointer suite and the external recovery/timeout cases; its later upload test hit the registered inherited defect 28 (`Required shell domains unavailable`) and is not reported as a Phase 107 regression.

## Narrative Findings (AI reviewer)

### Prior Finding Verification

- Original CR-01: fixed by hiding the pointer overlay on both duplicate exits and restoring active lifecycle projection.
- Original CR-02: fixed by current-generation timeout/error settlement in `browser-host-runtime.ts`, with successful retry coverage.
- Original CR-03: fixed by separating internal status from active-tab lifecycle projection.
- Original CR-04: fixed; pointer resolution hides its overlay and only current-source `shell.ready` reports readiness.
- Original CR-05: fixed; reload focus intent defaults false and is true only for `Retry target`.
- Original CR-06: fixed by the stable tabpanel wrapper containing both frame and recovery surface.
- Original WR-01: fixed; `renderTargetErrorHtml()` was removed.
- Original WR-02: fixed; browser behavior now covers duplicate exits, lifecycle isolation/order, handshake timeout, and focus intent.

## Critical Issues

### CR-07: Hiding the pointer overlay suppresses the next loading announcement

**Classification:** BLOCKER
**File:** `packages/paja/src/browser-target-surface.ts:42-46,87-90`
**Issue:** Lifecycle deduplication is stored per surface in `lastLifecycleStatus`, but `hide()` leaves that value unchanged. After a successful or duplicate pointer resolution, `browser-host.ts:381-398` hides the surface while the active tab later changes the shared live region to `Target ready`. On the next initial pointer load, `showLoading('initial')` again produces `Loading target…`, sees that same value in the hidden surface's stale local cache, and suppresses the callback. During a slow second resolution, the visible polite status therefore remains `Target ready` even though Paja is resolving another target. The current browser test starts observing only after duplicate handling and asserts loading after the new tab exists, so it does not cover this resolver interval.

**Fix:** Invalidate the surface-local lifecycle cache when hiding without emitting a new status, or deduplicate against the actual shared lifecycle projection instead. Add a regression that performs two successful initial pointer resolutions, delays the second resolver before tab creation, and asserts that `Loading target…` is announced immediately on the second attempt.

---

_Reviewed: 2026-07-31T09:58:17Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
