---
phase: 107-readable-responsive-paja-system
fixed_at: 2026-07-31T12:34:20Z
review_path: .planning/phases/107-readable-responsive-paja-system/107-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 107: Code Review Fix Report

**Fixed at:** 2026-07-31T12:34:20Z
**Source review:** `.planning/phases/107-readable-responsive-paja-system/107-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: Use mode-aware host teardown on pagehide

**Status:** fixed: requires human verification
**Files modified:** `packages/paja/src/browser-runtime-tabs.ts`, `packages/paja/src/browser-host.ts`, `packages/paja/src/browser-runtime-tabs.test.ts`, `packages/paja/src/browser-host.test.ts`, `tests/e2e/paja-runtime-pointer.spec.ts`
**Commit:** 29e20500
**Applied fix:** Added one idempotent all-tab host teardown that clears deadlines, iframe error listeners, focus intent, retained intent waiters, runtime/session/origin/readiness ownership, and every tab window ID. Persisted BFCache pagehide/pageshow retains tab and catalog ownership; final pagehide dispatches teardown by target mode. Chromium covers inactive-ready and active-booting tabs across persisted restore, final teardown, repeated pagehide, and stale readiness.

### CR-02: Bind external iframe errors to the attempt that installed them

**Status:** fixed: requires human verification
**Files modified:** `packages/paja/src/browser-host-runtime.ts`, `packages/paja/src/browser-host.ts`, `packages/paja/src/browser-host.test.ts`, `tests/e2e/paja-single-window.spec.ts`
**Commit:** 2f730b0c
**Applied fix:** Replaced the permanent iframe error listener with an attempt-owned disposer installed only when that generation registers and arms the frame. Settlement now requires exact generation and AbortController identity, and ready, failure, cancel, replacement, and destroy remove the listener. Chromium proves a delayed old-frame error cannot abort a newer Retry while its proxy fetch is pending.

### CR-03: Refresh the browser target when the server replaces an in-flight target

**Status:** fixed: requires human verification
**Files modified:** `packages/paja/src/browser-host-runtime.ts`, `packages/paja/src/browser-host.ts`, `packages/paja/src/browser-host.test.ts`, `tests/e2e/paja-single-window.spec.ts`
**Commit:** 8050402e
**Applied fix:** Each external attempt refreshes `/__kehto/config.json` under the same attempt AbortSignal and readiness deadline, atomically adopts the returned config, updates target label/frame metadata, then performs proxy fetch and base injection. Chromium holds target A, replaces it with B, observes cancellation, and proves one Retry uses B HTML, B `<base>`, B label, and trusted readiness inside the configured attempt budget.

### WR-01: Correct the documented lifecycle-status location

**Status:** fixed
**Files modified:** `docs/packages/paja.md`, `packages/paja/src/host-page.test.ts`
**Commit:** f45cbdb6
**Applied fix:** The guide now locates lifecycle status in the context-header command row and lists only Mode, HMR, Runtime, and Simulation in the footer. A regression compares the rendered header/footer DOM with the documented location and exact footer labels.

## Authority and Conformance Evidence

- `napplet/naps` `master`: `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`.
- `nostr-protocol/nips` PR 2303 head: `eb45dfd7335b7f88cb53781984c553581d2b4c34` (`dskvr/nips`, `nip/5d`).
- Re-read immutable `NAP-SHELL.md`, `NAP-THEME.md`, `projections/web.md`, and `5D.md` clauses covering one-shot shell readiness, current `MessageEvent.source`, verified bytes through `srcdoc`, host injection outside signed bytes, CSP order, and `sandbox="allow-scripts"` without same-origin.
- Result: refs match `107-06-SUMMARY.md` and `107-VERIFICATION.md`; no semantic contradiction or missing decision. Fixes change host-local lifecycle ownership, attempt cancellation/config refresh, and documentation only. No NAP message, capability, routing, sandbox, identity, authorization, verified-byte, upload defect 28, or Phase 108 behavior changed.

## Verification

- Focused Vitest/conformance matrix: 7 files, 79/79 passed.
- Chromium lifecycle/race matrix: 6/6 passed, including runtime-pointer BFCache/final teardown, never-ready recovery, stale external iframe error during Retry, never-settling external fetch, missing readiness, and target A-to-B replacement.
- `corepack pnpm --filter @kehto/paja type-check`: passed.
- `corepack pnpm --filter @kehto/paja build`: passed with the pre-existing `@kehto/nip` side-effects warning.
- `corepack pnpm docs:check`: passed.
- `npx -y aislop@0.12.0 scan --changes --base 5ff55974`: 100/100, zero issues.
- `git diff --check`: passed.
- All four commits used normal hooks and include `Co-Authored-By: OpenAI Codex <codex@openai.com>`.

---

_Fixed: 2026-07-31T12:34:20Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
