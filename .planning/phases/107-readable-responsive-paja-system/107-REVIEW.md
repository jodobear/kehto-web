---
phase: 107-readable-responsive-paja-system
reviewed: 2026-07-31T12:40:29Z
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
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 107: Code Review Report

**Reviewed:** 2026-07-31T12:40:29Z
**Depth:** standard
**Files Reviewed:** 33
**Status:** issues_found

## Summary

The submitted fixes correctly scope external iframe errors to their owning attempt, refresh target configuration before Retry navigation, and align the lifecycle-status documentation with the rendered DOM. Runtime-tab teardown now preserves BFCache state and releases existing ready/booting tab sessions on final `pagehide`, but it does not invalidate a runtime-pointer resolution that is still awaiting relay or artifact work. That continuation can create and register a new tab after the host teardown has completed, so the destroy contract remains incomplete.

The focused seven-file Vitest matrix passed 66/66. The six focused Chromium cases were also attempted, but local Chromium exited with `SIGTRAP`/`no ptrace` before test bodies ran; this was an execution-environment failure, not an observed implementation failure.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Final teardown can be undone by an in-flight pointer resolution

**Classification:** BLOCKER
**File:** `packages/paja/src/browser-host.ts:368-378,407-410,682-686`
**Issue:** `loadRuntimePointer` considers an attempt current solely while `context.pointerAttemptGeneration` still equals its captured token. The final non-persisted `pagehide` path stops catalog notifications and destroys sessions for tabs that already exist, but it never clears or advances that pointer-attempt token. If `resolvePajaPointer` is still awaiting relay EOSE or artifact fetch when `pagehide` fires, its later settlement still passes `isCurrentAttempt()`, installs the catalog record, calls `addRuntimeTab`, registers a fresh runtime/session/origin entry, and arms a new readiness deadline after `destroyRuntimeTabHost` has returned. The new BFCache test covers a tab that already reached `addRuntimeTab`; it does not cover teardown while resolution is still pre-tab, so it cannot detect this late re-acquisition of host ownership.
**Fix:** Add host-owned cancellation/invalidation for runtime-pointer work and invoke it before `destroyRuntimeTabHost` on final `pagehide`. At minimum, advance/clear the current pointer attempt so every post-`await` guard fails; for complete cleanup, retain an `AbortController`, pass its signal through relay subscription and artifact fetch, and close/abort those resources during teardown. Apply the same destroyed-state guard immediately before catalog installation and tab creation. Add a Chromium regression that holds pointer resolution before `addRuntimeTab`, dispatches a non-persisted `pagehide`, releases resolution, and proves no tab, session, origin registration, deadline, or resolved log entry is created afterward.

---

_Reviewed: 2026-07-31T12:40:29Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
