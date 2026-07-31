---
phase: 107-readable-responsive-paja-system
plan: 02
subsystem: ui
tags: [paja, accessibility, runtime-tabs, recovery, nip-5d, nap-shell]

requires:
  - phase: 107-readable-responsive-paja-system
    plan: 01
    provides: Stable host-owned target surface and current-source readiness projection
provides:
  - Single-flight pre-tab and active-tab recovery through existing verified loaders
  - Semantic roving runtime tabs with adjacent native share and close actions
  - Active verified-target header synchronization and dual-Paja scoped E2E selection
affects: [107-03, 107-05, paja, nip-5d-conformance, scoped-ci]

tech-stack:
  added: []
  patterns:
    - Request-generation and tab-generation guards reject stale pointer and iframe settlements
    - Dedicated tab triggers own composite-tab semantics while native actions remain siblings
    - Active-tab reveal changes only bounded strip scrollLeft with immediate motion

key-files:
  created: []
  modified:
    - packages/paja/src/browser-host.ts
    - packages/paja/src/browser-host.test.ts
    - packages/paja/src/browser-runtime-tabs.ts
    - packages/paja/src/browser-runtime-tabs.test.ts
    - tests/e2e/paja-runtime-pointer.spec.ts
    - scripts/select-e2e-tests.mjs
    - tests/unit/select-e2e-tests.test.ts

key-decisions:
  - "Retry delegates only to state.loadPointer(preservedPointer) or reloadActiveRuntimeTab(); verification, registration, iframe, session, and protocol ownership remain unchanged."
  - "Keep one target surface per runtime tab and reuse its stable iframe across generation-guarded retries."
  - "Use dedicated roving tab buttons plus adjacent native share and close buttons; reveal the active trigger by changing only the tab strip scroll position."
  - "Show the exact active verified pointer in visible, title, and accessible header context without mutating host configuration or wire identity."

patterns-established:
  - "Verified pointer recovery: current request and current tab generations are the only settlements allowed to update UI or session state."
  - "Accessible tab composition: one active tabindex=0 trigger, inactive tabindex=-1 triggers, valid tabpanel linkage, and sibling actions."

requirements-completed: [PAJA-01, PAJA-02, PAJA-03, PAJA-04]

coverage:
  - id: D1
    description: "Pre-tab and active-tab failures retain their pointer/tab context and retry through the existing verified loader without duplicate work or stale settlement."
    requirement: PAJA-03
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-host.test.ts and packages/paja/src/browser-runtime-tabs.test.ts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/paja-runtime-pointer.spec.ts#recovers resolver and active-frame failures without duplicating verified tabs or sessions"
        status: pass
    human_judgment: false
  - id: D2
    description: "Recovered runtime pointers retain signed-event, aggregate, Relay, Blossom, CSP, srcdoc, sandbox, source-binding, and one-session boundaries."
    requirement: PAJA-04
    verification:
      - kind: unit
        ref: "tests/unit/nip5d-conformance-guard.test.ts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/paja-runtime-pointer.spec.ts#verified recovery provenance and session assertions"
        status: pass
    human_judgment: false
  - id: D3
    description: "Runtime tabs expose roving composite semantics, exact adjacent action labels, bounded keyboard reveal, close focus fallback, and active verified-target context."
    requirement: PAJA-01
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-runtime-tabs.test.ts#renders a roving composite tab with sibling native actions and bounded reveal"
        status: pass
      - kind: e2e
        ref: "tests/e2e/paja-runtime-pointer.spec.ts#completes a verified intent and delivers its convention once to a cold target"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every Paja source change selects both real Paja browser specs exactly once in sorted order."
    requirement: PAJA-02
    verification:
      - kind: unit
        ref: "tests/unit/select-e2e-tests.test.ts"
        status: pass
      - kind: cli
        ref: "node scripts/select-e2e-tests.mjs packages/paja/src/browser-host.ts"
        status: pass
    human_judgment: false

duration: 25 min
completed: 2026-07-31
status: complete
---

# Phase 107 Plan 02: Verified Pointer Recovery and Accessible Runtime Tabs Summary

**Verified pointer failures now recover through one current loader/session while semantic roving tabs preserve active target context, keyboard focus, and bounded phone-width reveal.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-31T05:01:36Z
- **Completed:** 2026-07-31T05:27:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added a request-generation single-flight guard for pre-tab pointer resolution and retained the current ready tab when another pointer fails.
- Added one stable recovery surface per verified runtime tab; retry destroys the prior session, advances the generation, and re-enters the existing verified navigation path.
- Replaced nested interactive tab markup with dedicated roving tab triggers, valid panel relationships, Arrow/Home/End activation, exact sibling action names/titles, deterministic close focus, and bounded strip-only reveal.
- Synchronized the header target to the exact active verified pointer and made every Paja source change select both sorted real Paja browser specs.

## Task Commits

Each TDD gate was committed atomically:

1. **Task 1 RED: Verified pointer recovery contracts** - `88eaead0`
2. **Task 1 GREEN: Verified pointer recovery and dual selector** - `19c23b94`
3. **Task 2 RED: Accessible runtime-tab contracts** - `3e25df9b`
4. **Task 2 GREEN: Semantic runtime tabs and target context** - `e802b054`

**Plan metadata:** this closeout commit

## Files Created/Modified

- `packages/paja/src/browser-host.ts` - Preserved-pointer request generation, stable pre-tab recovery, and active-target header projection.
- `packages/paja/src/browser-host.test.ts` - Single-flight, stale-result, source-bound, and protocol-neutral pointer guards.
- `packages/paja/src/browser-runtime-tabs.ts` - Per-tab recovery surfaces, generation-safe reload, semantic roving triggers, exact actions, and bounded reveal.
- `packages/paja/src/browser-runtime-tabs.test.ts` - Recovery routing, tab semantics, target synchronization, and share/snapshot preservation contracts.
- `tests/e2e/paja-runtime-pointer.spec.ts` - Real signed pointer recovery, concurrency, provenance, accessibility, focus, and phone-width proof.
- `scripts/select-e2e-tests.mjs` - Dual real-Paja spec mapping.
- `tests/unit/select-e2e-tests.test.ts` - Exact sorted selection and deduplication proof.

## Decisions Made

- Recovery presentation remains host-owned. Relay/Blossom resolution, signature and aggregate verification, CSP-before-bootstrap ordering, `srcdoc`, sandboxing, origin registration, and `shell.ready` source checks remain in their existing owners.
- The pre-tab controller accepts only one current request generation; runtime-tab reload accepts only one current tab generation. No alternate fetch, iframe, session, or protocol route was added.
- Runtime tab actions are native sibling buttons. Only the dedicated trigger owns `role=tab`, selection, panel linkage, and roving focus.
- Header synchronization projects the active tab's preserved pointer into text, `title`, and `aria-label`; it never changes configuration, resolved identity, or wire payloads.

## Authority and Conformance Evidence

- Live pre-edit checks resolved `napplet/naps` `master` to `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24` and `nostr-protocol/nips` PR 2303 head to `eb45dfd7335b7f88cb53781984c553581d2b4c34`; neither ref moved from Phase 107 research.
- Re-read NAP-SHELL and NAP-THEME at the NAP ref and NIP-5D at the draft head. Required verified signed bytes, aggregate validation, Blossom retrieval, CSP-before-bootstrap, `srcdoc`, `sandbox="allow-scripts"` without `allow-same-origin`, registered source binding, and one `shell.ready`/`shell.init` lifecycle remain intact.
- Result: conformant. Plan 107-02 changes local host recovery and interaction only; no NAP message type, field, capability, route, lifecycle transition, or security boundary changed.

## Verification

- Task 1 focused Vitest (`browser-host`, runtime tabs, NIP-5D guard, selector) - 48/48 passed.
- Final focused Vitest (`browser-target-surface`, browser host, runtime tabs, NIP-5D guard, selector) - 53/53 passed.
- `paja-runtime-pointer.spec.ts` - 3/3 runnable tests passed; the explicit live-relay test remained skipped by its existing environment gate.
- Verified-pointer recovery test alone - 1/1 passed, including rapid retry, stale settlement, signed bytes, aggregate, CSP, sandbox, source, lifecycle, and new-window-generation assertions.
- Accessible multi-tab browser test alone - 1/1 passed at desktop and 375x812 viewports.
- Combined dual-Paja run - 8 tests passed before the inherited upload-domain assertion failed at `tests/e2e/paja-single-window.spec.ts:536`; 1 live-only test skipped and 2 serial tests did not run. Those two serially skipped NAP-SHELL/INC guards were rerun directly and passed 2/2.
- `corepack pnpm --filter @kehto/paja type-check` and `build` - passed.
- `node scripts/select-e2e-tests.mjs packages/paja/src/browser-host.ts` - returned exactly `paja-runtime-pointer.spec.ts` then `paja-single-window.spec.ts`, without duplicates.
- `corepack pnpm dlx aislop@0.12.0 scan --changes --base 88eaead0` and `--base 3e25df9b` - both 100/100 with no issues.
- `git diff --check` - passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Kept injected NIP-5D bootstrap as the sole fixture readiness sender**
- **Found during:** Task 1 verified recovery browser proof
- **Issue:** The recovery HTML fixture sent its own early `shell.ready`, duplicating the lifecycle signal supplied by the real injected bootstrap and invalidating one-ready assertions.
- **Fix:** Removed the fixture-authored signal so readiness still flows exclusively through the real registered-source bootstrap.
- **Files modified:** `tests/e2e/paja-runtime-pointer.spec.ts`
- **Commit:** `19c23b94`

**2. [Rule 3 - Blocking] Exposed a temporary Corepack pnpm shim to Playwright child servers**
- **Found during:** Task 1 and Task 2 browser verification
- **Issue:** The environment provides `corepack pnpm`, but Playwright child server commands invoke bare `pnpm`.
- **Fix:** Generated a temporary Corepack shim under `/tmp` and prepended it to `PATH` for verification only.
- **Files modified:** None in the repository.
- **Commit:** Not applicable; environment-only fix.

**3. [Rule 1 - Bug] Rounded bounded tab reveal past sub-pixel layout edges**
- **Found during:** Task 2 375x812 Playwright proof
- **Issue:** Integer scroll rounding left the active trigger 0.48px beyond the strip boundary.
- **Fix:** Rounded reveal deltas outward before clamping the strip-only `scrollLeft`.
- **Files modified:** `packages/paja/src/browser-runtime-tabs.ts`
- **Commit:** `e802b054`

---

**Total deviations:** 3 auto-fixed (2 behavior/test bugs, 1 blocking environment issue)
**Impact on plan:** No additional production surface, dependency, protocol behavior, or repository tooling was added.

## Issues Encountered

- **Inherited upload-domain browser failure:** the exact dual-Paja command still fails at `tests/e2e/paja-single-window.spec.ts:536`, expecting `shell-init received` but receiving `Required shell domains unavailable`. This is the unchanged approved baseline from Plan 107-01 and is recorded in `.planning/WINDOWS.md`; upload behavior is outside Plan 107-02. All Plan 107-02 pointer recovery/accessibility flows and the two tests skipped by serial abort pass independently.
- **Known nested-worktree package-alignment debt:** unchanged from the Phase 107 baseline. This plan did not run, edit, or traverse registered `.claude/worktrees/*`; Plan 107-05 owns its scoped exclusion.

## Known Stubs

None. The environment-gated live-relay test predates this plan and the deterministic Relay/Blossom fixture covers the same plan-owned verified-pointer boundary.

## User Setup Required

None.

## Next Phase Readiness

- Plan 107-03 can style the semantic wrapper/trigger/action structure and target surfaces without changing recovery or protocol ownership.
- Plan 107-05 must preserve the recorded upload-domain and nested-worktree baseline dispositions while auditing complete phase acceptance.

## Self-Check: PASSED

- All seven modified files exist.
- All four RED/GREEN task commits exist.
- Requirements, immutable authority refs, completion status, and coverage records are present.
- All plan-owned acceptance criteria are proven; the one broader command failure is inherited, explicitly recorded, and outside the approved plan scope.

---
*Phase: 107-readable-responsive-paja-system*
*Completed: 2026-07-31*
