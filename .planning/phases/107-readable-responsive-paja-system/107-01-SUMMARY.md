---
phase: 107-readable-responsive-paja-system
plan: 01
subsystem: ui
tags: [paja, accessibility, recovery, iframe, nip-5d, nap-shell]

requires:
  - phase: 105-published-convention-adoption-and-host-flows
    provides: Published NAP conventions and retained host-owned NAP-SHELL prelude
provides:
  - Stable host-owned external-target empty/loading/ready/error surface
  - Existing-loader retry with single-flight, repeat-failure, return, and focus contracts
  - Safe literal diagnostics with current-source shell.ready readiness projection
affects: [107-02, 107-03, 107-05, paja, nip-5d-conformance]

tech-stack:
  added: []
  patterns:
    - Stable native DOM projection controller separated from loader and protocol ownership
    - Current-generation single-flight recovery with user-intent focus handoff

key-files:
  created:
    - packages/paja/src/browser-target-surface.ts
    - packages/paja/src/browser-target-surface.test.ts
  modified:
    - packages/paja/src/browser-host.ts
    - packages/paja/src/browser-target-frame.ts
    - packages/paja/src/browser-host.test.ts
    - tests/e2e/paja-single-window.spec.ts

key-decisions:
  - "Keep recovery UI in stable privileged host DOM; loader, verification, session, sandbox, and protocol ownership remain unchanged."
  - "Project ready only after current-source shell.ready; user retry success focuses the frame, while background restoration does not."
  - "Treat the existing upload-domain injection failure as inherited baseline debt and leave upload behavior untouched."

patterns-established:
  - "Stable recovery nodes: transitions mutate text, visibility, disabled state, and aria-busy without replacing controls."
  - "Safe diagnostics: untrusted error strings enter one pre element only through textContent."

requirements-completed: [PAJA-03, PAJA-04]

coverage:
  - id: D1
    description: "External target failures render exact actionable copy and inert diagnostics in stable host DOM, then recover through the existing loader."
    requirement: PAJA-03
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-target-surface.test.ts#projects an inert host-owned error without stealing initial focus"
        status: pass
      - kind: e2e
        ref: "tests/e2e/paja-single-window.spec.ts#recovers an external target through stable host error controls"
        status: pass
    human_judgment: false
  - id: D2
    description: "Retry remains visible-disabled and single-flight while busy; repeat failure restores the same button and return focuses Paja controls without reload."
    requirement: PAJA-03
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-target-surface.test.ts#keeps the same retry control visible, single-fire, and focused across repeat failure"
        status: pass
      - kind: e2e
        ref: "tests/e2e/paja-single-window.spec.ts#repeat-failure request, generation, node identity, and return assertions"
        status: pass
    human_judgment: false
  - id: D3
    description: "Readiness remains bound to current-source shell.ready with one iframe/session, allow-scripts sandboxing, verified srcdoc loading, and no recovery message vocabulary."
    requirement: PAJA-04
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-host.test.ts#keeps external recovery single-flight, source-bound, and protocol-neutral"
        status: pass
      - kind: unit
        ref: "tests/unit/nip5d-conformance-guard.test.ts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/paja-single-window.spec.ts#one iframe, current session, sandbox, and shell.ready assertions"
        status: pass
    human_judgment: false

duration: 29 min
completed: 2026-07-31
status: complete
---

# Phase 107 Plan 01: External Target Recovery Summary

**Host-owned external-target recovery now preserves one verified iframe/session while providing safe diagnostics, deterministic retry/return focus, and single-flight repeat-failure handling.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-07-31T04:27:39Z
- **Completed:** 2026-07-31T04:56:33Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added one private native target-surface controller with exact empty, loading, ready, and error copy; stable controls; collapsed disclosure; literal diagnostic text; and change-only lifecycle status.
- Routed external retry through the existing `state.reload()` / `navigateFrame()` path with one in-flight generation, one iframe, current-source `shell.ready`, repeat-failure refocus, and user-success frame focus.
- Proved keyboard/pointer-safe busy behavior and return-to-controls behavior without adding a fetch, session, iframe, `postMessage`, NAP discriminator, public export, or dependency.

## Task Commits

Each TDD gate was committed atomically:

1. **Task 1 RED: External recovery tests** - `db93e256`
2. **Task 1 GREEN: External target recovery tracer** - `365262e4`
3. **Task 2 RED: Recovery concurrency contracts** - `c0894e3e`
4. **Task 2 GREEN: External recovery focus and concurrency** - `806d98fa`

**Plan metadata:** this closeout commit

## Files Created/Modified

- `packages/paja/src/browser-target-surface.ts` - Stable private host surface and deterministic focus/lifecycle projection.
- `packages/paja/src/browser-target-surface.test.ts` - Safe-text, disclosure, stable-node, busy, repeat-failure, and focus contracts.
- `packages/paja/src/browser-host.ts` - Existing-loader recovery binding, single-flight generation state, and current-source ready projection.
- `packages/paja/src/browser-target-frame.ts` - External failure returns to the host without rendering an iframe error document.
- `packages/paja/src/browser-host.test.ts` - Static guards for generation, source, cleanup, and protocol-neutral recovery wiring.
- `tests/e2e/paja-single-window.spec.ts` - Real failure, busy retry, repeat failure, return, recovery, sandbox, request, generation, and session proof.

## Decisions Made

- Recovery owns presentation and focus only. `navigateFrame()` remains authoritative for fetch, verified bytes, registration, CSP/prelude injection, and `srcdoc`.
- Native button disablement plus the external controller generation guard is the one single-flight boundary; catch branches do not own independent busy flags.
- Existing upload-domain injection failure is outside Phase 107 recovery scope. Per approved disposition, no upload behavior changed and the broader-spec failure is reported separately from focused Phase 107 passes.

## Authority and Conformance Evidence

Phase base SHA: b7d045f560d6945e7974f9719fcd9c02314f9588

- Pre-edit and final live checks both resolved `napplet/naps` `master` to `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24` and `nostr-protocol/nips` PR 2303 head to `eb45dfd7335b7f88cb53781984c553581d2b4c34`.
- Re-read `NAP-SHELL.md`, `NAP-THEME.md`, `projections/web.md`, and NIP-5D `5D.md` at those immutable refs. Relevant authority still requires bare one-shot `shell.ready`/`shell.init`, current `MessageEvent.source` binding, verified bytes delivered through `srcdoc`, `sandbox="allow-scripts"` without `allow-same-origin`, and runtime injection outside signed artifact bytes.
- Result: conformant. Plan 107-01 changes host presentation and local control flow only; no NAP lifecycle, direction, field, capability, theme payload, wire discriminator, sandbox permission, or verified-byte boundary changed.

## Verification

- `corepack pnpm exec vitest run packages/paja/src/browser-target-surface.test.ts packages/paja/src/browser-host.test.ts` - 22/22 passed.
- Recovery-only Playwright selector - 1/1 passed, including busy/repeat-failure/return/request/generation/focus/session assertions.
- Plan-level focused Vitest (`host-page`, target surface, browser host, NIP-5D guard) - 41/41 passed.
- Remaining non-upload tests in `paja-single-window.spec.ts` - 6 legacy tests plus the recovery test passed (7/7 total non-upload tests). The two tests skipped after serial abort were rerun directly and passed 2/2.
- `corepack pnpm --filter @kehto/paja build` and `type-check` - passed.
- Root `corepack pnpm build` - 32/32 tasks passed; root `type-check` - 17/17 tasks passed.
- `corepack pnpm dlx aislop@0.12.0 scan --changes --base 365262e4` - 100/100, no issues.
- `git diff --check` - passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exposed the Corepack pnpm shim to child processes**
- **Found during:** Task 2 browser and root verification
- **Issue:** Playwright and Turborepo child commands failed with `pnpm: command not found` / `cannot find binary path` although `corepack pnpm` itself was available.
- **Fix:** Generated a temporary Corepack shim under `/tmp/kehto-corepack-bin` and prepended it to `PATH` for verification only.
- **Files modified:** None in the repository.
- **Verification:** Focused and broader Playwright, build, and type-check commands ran normally afterward.
- **Committed in:** Not applicable; environment-only fix.

---

**Total deviations:** 1 auto-fixed (1 blocking environment issue)
**Impact on plan:** No production scope or repository configuration changed.

## Issues Encountered

- **Inherited upload-domain browser failure:** the full serial `paja-single-window.spec.ts` command passed its first five tests, including all Phase 107 recovery coverage, then failed at `tests/e2e/paja-single-window.spec.ts:536`. Exact assertion: expected `#target-status` to be `shell-init received`; received `Required shell domains unavailable` because `window.napplet.upload` is absent despite upload service availability. Per approved scope disposition, upload behavior remains untouched. The two serial tests not run after that failure were rerun directly and passed.
- **Known nested-worktree unit-suite contamination:** authoritative unsandboxed `corepack pnpm test:unit` passed 1,566/1,569 assertions across 128/129 files. Three existing `tests/unit/napplet-package-alignment.test.ts` assertions recurse into `.claude/worktrees/agent-ab41bf84dc8b97866` and fail on its older package metadata. This concern predates Plan 107-01, is recorded in `STATE.md`, and Plan 107-05 owns scoped exclusion without touching registered worktrees.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- External recovery seam is production-proven and ready for runtime-pointer parity in Plan 107-02 and semantic styling in Plan 107-03.
- Plan 107-05 must use the recorded Phase base SHA above, preserve nested worktrees, and distinguish the inherited upload failure from Phase 107-owned recovery proof.

## Self-Check: PASSED

- Both created files exist.
- All four RED/GREEN task commits exist.
- Phase base SHA, requirement IDs, completion status, and coverage schema validated.
- All plan-owned acceptance criteria are proven under the approved baseline-debt disposition.

---
*Phase: 107-readable-responsive-paja-system*
*Completed: 2026-07-31*
