---
phase: 107-readable-responsive-paja-system
reviewed: 2026-07-31T12:15:26Z
depth: standard
files_reviewed: 33
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
  - packages/paja/src/browser-host-runtime.ts
  - packages/paja/src/browser-host.test.ts
  - packages/paja/src/browser-host.ts
  - packages/paja/src/browser-runtime-tabs.test.ts
  - packages/paja/src/browser-runtime-tabs.ts
  - packages/paja/src/browser-target-frame.ts
  - packages/paja/src/browser-target-surface.test.ts
  - packages/paja/src/browser-target-surface.ts
  - packages/paja/src/host-page.test.ts
  - packages/paja/src/host-page.ts
  - packages/paja/src/node-compat.d.ts
  - packages/paja/src/options.test.ts
  - packages/paja/src/options.ts
  - packages/paja/src/server.test.ts
  - packages/paja/src/server.ts
  - scripts/select-e2e-tests.mjs
  - tests/e2e/paja-runtime-pointer.spec.ts
  - tests/e2e/paja-single-window.spec.ts
  - tests/e2e/theme-broadcast.spec.ts
  - tests/unit/napplet-package-alignment.test.ts
  - tests/unit/phase-107-visual-system.test.ts
  - tests/unit/playground-gateway-guard.test.ts
  - tests/unit/select-e2e-tests.test.ts
findings:
  critical: 3
  warning: 1
  info: 0
  total: 4
status: issues_found
---

# Phase 107: Code Review Report

**Reviewed:** 2026-07-31T12:15:26Z
**Depth:** standard
**Files Reviewed:** 33
**Status:** issues_found

## Summary

Phase 107's new timeout paths bound the browser and server fetches and settle the covered happy/error cases, but teardown and replacement behavior is incomplete. Runtime-pointer page teardown is routed through the external-frame owner, external iframe error callbacks are not generation-owned, and an in-flight server target replacement strands Retry on the old browser config. The package type-check, diff check, 52 non-server focused tests, and all 8 server tests passed; those tests do not exercise these three races. The inherited upload-domain defect 28 was treated as baseline and is not reported below.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Use mode-aware host teardown on pagehide

**Classification:** BLOCKER
**File:** `packages/paja/src/browser-host.ts:675-679`
**Issue:** The `pagehide` handler always calls `destroyExternalFrameNavigation(context)`, including in `runtime-pointer` mode. In that mode `runtime.currentWindowId` is the active tab's window ID, so the external helper unregisters only that tab's runtime/session/origin entry while leaving `tab.windowId`, its deadline/error handler, retained readiness state, and every inactive tab untouched. A back-forward-cache restore therefore presents a ready tab whose source is no longer registered, while inactive sessions remain live; a booting active tab can also resume its uncleared timer and fail after restore. The same handler permanently removes the catalog subscription because it is `{ once: true }`. This is neither complete destroy cleanup nor a resumable pagehide lifecycle.
**Fix:** Make page teardown target-mode aware. Export one idempotent runtime-tab host destroy helper that clears every tab deadline/error listener/focus intent, rejects retained waiters, destroys/unregisters every tab session, and nulls each `windowId`; call the external helper only in iframe-url mode. Handle `PageTransitionEvent.persisted` explicitly: either keep resources and the catalog subscription intact for BFCache, or rebuild all ownership on `pageshow`. Add browser coverage for ready and booting runtime tabs across pagehide/pageshow, including active and inactive registrations.

#### CR-02: Bind external iframe errors to the attempt that installed them

**Classification:** BLOCKER
**File:** `packages/paja/src/browser-host-runtime.ts:143-153`
**Issue:** One permanent iframe `error` listener reads `context.externalAttemptGeneration` when the event fires instead of capturing the generation/controller that owns the navigation. After an attempt times out or is reloaded, a late error from the old iframe navigation can fire while Retry is fetching the next generation; the listener then passes the new generation to `settleExternalNavigationFailure`, aborting the valid Retry and logging it as the failure. Ready, cancel, failure, replacement, and destroy never remove this callback, contrary to the generation-scoped cleanup contract. Current Chromium coverage releases stale work before starting Retry, so it cannot detect this race.
**Fix:** Store an external attempt's error-listener disposer beside its generation/controller. Install a closure bound to those immutable values at the point the current frame navigation is armed, guard settlement with the exact controller identity, and remove it on ready, failure, cancel, reload/replacement, and destroy. Add a regression that starts Retry, dispatches the prior attempt's delayed error, and proves the new attempt still reaches ready with one failure log.

#### CR-03: Refresh the browser target when the server replaces an in-flight target

**Classification:** BLOCKER
**File:** `packages/paja/src/server.ts:58-64`
**Issue:** `setHostConfig` now aborts every in-flight target request before switching the server to the new URL. An already-open Paja page correctly reaches host recovery, but its `context.config` was read only once during installation. Retry therefore fetches the new server-side HTML while `navigateFrame` still injects `<base href>` from the old `config.target.url` and keeps the old target label. This is common when a user opens the printed Paja URL before managed-command port discovery calls `updateTargetUrl`; relative module/HMR assets then resolve against the obsolete server, the new target never emits `shell.ready`, and every Retry times out.
**Fix:** Make replacement carry the current target URL across the proxy boundary. For example, return the effective target URL with `/__kehto/target.html` and use it for base injection and target display, or refresh and atomically adopt `/__kehto/config.json` before every external reload. Keep that refresh inside the owned attempt budget. Add an integration/browser test that holds target A, calls `updateTargetUrl(B)`, observes cancellation, then proves Retry injects B's HTML with B's base/label and reaches ready.

### Warnings

#### WR-01: Correct the documented lifecycle-status location

**Classification:** WARNING
**File:** `docs/packages/paja.md:379-382`
**Issue:** The package guide says the footer summarizes lifecycle status, but the Phase 107 template moved `#lifecycle-status` into the header command row and the footer now contains only Mode, HMR, Runtime, and Simulation. This sends users looking in the wrong responsive region and contradicts the shipped DOM.
**Fix:** State that lifecycle status appears in the context-header command row, and list only the four values actually rendered in the environment footer.

---

_Reviewed: 2026-07-31T12:15:26Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
