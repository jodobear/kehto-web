---
phase: 107-readable-responsive-paja-system
fixed_at: 2026-07-31T09:49:36Z
review_path: .planning/phases/107-readable-responsive-paja-system/107-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 107: Code Review Fix Report

**Fixed at:** 2026-07-31T09:49:36Z
**Source review:** `.planning/phases/107-readable-responsive-paja-system/107-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 8
- Fixed: 8
- Skipped: 0

## Fixed Issues

### CR-01: Duplicate-pointer exits leave the loading surface over the active runtime

**Status:** fixed: requires human verification
**Files modified:** `packages/paja/src/browser-host.ts`, `packages/paja/src/browser-target-surface.test.ts`, `packages/paja/src/browser-target-surface.ts`, `tests/e2e/paja-runtime-pointer.spec.ts`
**Commit:** e4a15abd
**Applied fix:** Added a presentation-only surface hide operation, used it for both duplicate exits, restored the active lifecycle projection, and covered cancel/open-tab behavior in Chromium.

### CR-02: External frame failures can lock recovery forever

**Status:** fixed: requires human verification
**Files modified:** `packages/paja/src/browser-host-runtime.ts`, `packages/paja/src/browser-host.test.ts`, `packages/paja/src/browser-host.ts`, `tests/e2e/paja-single-window.spec.ts`
**Commits:** 568fb6cd, 48d3ef2c, 35170858
**Applied fix:** Added a bounded current-generation `shell.ready` deadline and one settlement path that clears attempt state, focus intent, timeout, and failed registration before showing retryable recovery. Extracted the controller into the host-runtime helper and added a deterministic missing-handshake/retry browser regression.

### CR-03: Runtime-tab loading announcements are immediately replaced by internal enum values

**Status:** fixed: requires human verification
**Files modified:** `packages/paja/src/browser-host.ts`, `packages/paja/src/browser-runtime-tabs.test.ts`, `packages/paja/src/browser-runtime-tabs.ts`, `tests/e2e/paja-runtime-pointer.spec.ts`
**Commit:** a7639d1f
**Applied fix:** Separated internal status mutation from lifecycle copy, projected only the active current-generation tab, refreshed projection on activation, and asserted exact user-facing transitions.

### CR-04: Pointer resolution reports “Target ready” before the shell handshake

**Status:** fixed: requires human verification
**Files modified:** `packages/paja/src/browser-host.ts`
**Commit:** ac61cfbd
**Applied fix:** Pointer resolution now hides its overlay without announcing readiness; the trusted current-frame `shell.ready` path remains the readiness boundary.

### CR-05: Automatic runtime-tab reloads can steal keyboard focus

**Status:** fixed: requires human verification
**Files modified:** `packages/paja/src/browser-runtime-tabs.test.ts`, `packages/paja/src/browser-runtime-tabs.ts`, `tests/e2e/paja-runtime-pointer.spec.ts`
**Commit:** e0105232
**Applied fix:** Reloads default to preserving focus, while only the recovery Retry path requests frame focus. Chromium coverage proves the header reload retains its focused control.

### CR-06: The visible loading/error content is not the tabpanel controlled by its tab

**Status:** fixed: requires human verification
**Files modified:** `packages/paja/src/browser-runtime-tabs.test.ts`, `packages/paja/src/browser-runtime-tabs.ts`, `packages/paja/src/host-page.test.ts`, `packages/paja/src/host-page.ts`, `tests/e2e/paja-runtime-pointer.spec.ts`
**Commits:** 2e858740, c2840a7a
**Applied fix:** Introduced one stable ARIA tabpanel wrapper containing both frame and recovery surface, asserted loading/error relationships, and ensured the global iframe display rule cannot override a hidden runtime frame.

### WR-01: Obsolete iframe error renderer remains exported and unreferenced

**Status:** fixed
**Files modified:** `packages/paja/src/browser-target-frame.ts`
**Commit:** e1acab1d
**Applied fix:** Removed the dead `renderTargetErrorHtml()` export while retaining the escaping helper still required by base-URL injection.

### WR-02: Controller tests assert source substrings instead of recovery behavior

**Status:** fixed
**Files modified:** `packages/paja/src/browser-host.test.ts`, `tests/e2e/paja-runtime-pointer.spec.ts`
**Commits:** 051d987f, 84b7f472
**Applied fix:** Removed the brittle recovery source-slice checks and replaced them with browser assertions for duplicate exits, loading/error/retry lifecycle order, inactive-tab isolation, and retry-only focus intent. Retained only source guards that enforce architectural boundaries, updating them for the runtime-helper extraction.

---

_Fixed: 2026-07-31T09:49:36Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
