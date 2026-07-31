---
phase: 107-readable-responsive-paja-system
plan: 03
subsystem: ui
tags: [paja, responsive-layout, semantic-tokens, accessibility, playwright]

requires:
  - phase: 107-readable-responsive-paja-system
    plan: 01
    provides: Stable host-owned target surface and external recovery states
  - phase: 107-readable-responsive-paja-system
    plan: 02
    provides: Verified-pointer recovery and accessible runtime tabs
provides:
  - Exact mechanically enforced Paja palette, type, and spacing vocabulary
  - Locked desktop, phone, and 200-percent reflow compositions
  - Dual-host browser evidence for normal, empty, loading, error, retrying, recovered, tab, and message states
affects: [107-04, 107-05, phase-108, paja]

tech-stack:
  added: []
  patterns:
    - Root-only raw design values with declaration-aware component-consumption guards
    - Desktop grid plus max-width 640px phone composition with bounded internal scrollers
    - Real-browser state matrices measured through both external and verified-pointer hosts

key-files:
  created:
    - tests/unit/phase-107-visual-system.test.ts
  modified:
    - packages/paja/src/host-page.ts
    - packages/paja/src/host-page.test.ts
    - packages/paja/src/browser-devtools.ts
    - tests/e2e/paja-single-window.spec.ts
    - tests/e2e/paja-runtime-pointer.spec.ts

key-decisions:
  - "Declare the approved semantic palette, type scale, and spacing scale exactly once; component declarations consume only named tokens."
  - "Use max-width:640px as the sole phone/reflow composition boundary, preserving visible identity, target, commands, stage, and footer."
  - "Hold and release the real injected shell.ready event in the partial-tab fixture instead of synthesizing protocol readiness."
  - "Synchronize Clear messages disabled state natively from the empty append-only log rather than styling a clickable empty action."

patterns-established:
  - "Property-aware visual guards: classify color, typography, and spacing declarations independently and report exact source lines."
  - "Responsive Paja shell: fixed context/console rows, flexible stage, bounded local scrolling, and wrap-anywhere identifier seams."
  - "State evidence: one deterministic browser matrix covers geometry, focus, overflow, long content, lifecycle copy, and screenshots."

requirements-completed: [VIS-01, VIS-02, VIS-03, PAJA-01, PAJA-02, PAJA-03]

coverage:
  - id: D1
    description: "The exact bounded semantic palette and 4/8/16/24/32/48/64 spacing scale are declared once; component rules contain no raw color literals and consume classified semantic tokens."
    requirement: VIS-01
    verification:
      - kind: unit
        ref: "tests/unit/phase-107-visual-system.test.ts#locks the exact palette and restricts raw colors to the root declaration block"
        status: pass
    human_judgment: false
  - id: D2
    description: "Scoped Paja text uses only 12/14/18/24px and 400/600, while routine text, empty-state roles, controls, and diagnostics remain readable at every reference viewport."
    requirement: VIS-02
    verification:
      - kind: unit
        ref: "tests/unit/phase-107-visual-system.test.ts#accepts only the declared type scale and named spacing declarations"
        status: pass
      - kind: e2e
        ref: "tests/e2e/paja-single-window.spec.ts#keeps exact desktop geometry, semantic type, actions, and state surfaces"
        status: pass
    human_judgment: false
  - id: D3
    description: "Named spacing, min-width containment, bounded internal scrollers, and long-content wrapping prevent collapse, clipping, and page-level horizontal overflow."
    requirement: VIS-03
    verification:
      - kind: unit
        ref: "tests/unit/phase-107-visual-system.test.ts and packages/paja/src/host-page.test.ts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/paja-single-window.spec.ts#keeps phone context, controls, stage, footer, long target, and focus reachable"
        status: pass
    human_judgment: false
  - id: D4
    description: "At 1280x720 Paja retains a 48px header, 360px console, flexible visible stage, at least 32px footer, distinct product/target context, and desktop-size actions."
    requirement: PAJA-01
    verification:
      - kind: e2e
        ref: "tests/e2e/paja-single-window.spec.ts and tests/e2e/paja-runtime-pointer.spec.ts#desktop layout snapshots"
        status: pass
    human_judgment: false
  - id: D5
    description: "At 375x812 and effective 640x360, Paja retains identity, tabs, commands, 224px controls, at least 320px stage, reachable two-column footer, 48px actions, readable text, and zero horizontal page overflow."
    requirement: PAJA-02
    verification:
      - kind: e2e
        ref: "tests/e2e/paja-single-window.spec.ts#phone layout and 200 percent reflow cases"
        status: pass
    human_judgment: false
  - id: D6
    description: "External and verified-pointer hosts preserve readable, reachable normal, empty, loading, error, retrying, recovered, zero/one/many/partial tab, and zero/one/many message states without changing recovery ownership."
    requirement: PAJA-03
    verification:
      - kind: e2e
        ref: "tests/e2e/paja-single-window.spec.ts and tests/e2e/paja-runtime-pointer.spec.ts#state and screenshot matrices"
        status: pass
      - kind: unit
        ref: "packages/paja/src/browser-target-surface.test.ts and packages/paja/src/browser-runtime-tabs.test.ts"
        status: pass
    human_judgment: false

duration: 30 min
completed: 2026-07-31
status: complete
---

# Phase 107 Plan 03: Paja Semantic Responsive System Summary

**Paja now uses one exact semantic token vocabulary and a browser-proven desktop/phone composition that keeps every host state, target, action, stage, log, and footer readable and reachable.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-07-31T05:31:29Z
- **Completed:** 2026-07-31T06:01:31Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Rebuilt the Paja host template around the approved semantic landmarks, exact palette/type/spacing tokens, 48px/360px desktop grid, and purpose-built max-width 640px phone composition.
- Added a declaration-aware unit guard that reports line-numbered raw-color, irregular-type, and unnamed-spacing offenders without misclassifying borders, line heights, radii, focus strokes, or fixed layout dimensions.
- Proved external and verified-pointer Paja paths at 1280x720, 375x812, and effective 640x360 with measured geometry, computed text, keyboard focus, local overflow ownership, long identifiers/diagnostics, lifecycle states, and stable visual attachments.
- Made the empty append-only message log explicit and native: exact empty copy is visible and Clear messages remains disabled until a row exists.

## Task Commits

Each TDD gate was committed atomically:

1. **Task 1 RED: Paja visual-system contracts** - `fa2218cc`
2. **Task 1 GREEN: Semantic responsive Paja system** - `3590dce9`
3. **Task 2 RED: Responsive state and geometry proof** - `04512312`
4. **Task 2 GREEN: Dual-host visual and responsive evidence** - `b0c5b5ec`

**Plan metadata:** this closeout commit

## Files Created/Modified

- `tests/unit/phase-107-visual-system.test.ts` - Exact root declarations plus declaration-aware component color/type/spacing enforcement with line-numbered failures.
- `packages/paja/src/host-page.ts` - Semantic tokens, landmarks, state copy, fixed desktop grid, purpose-built phone/reflow composition, containment, and target context.
- `packages/paja/src/host-page.test.ts` - Exact roles, copy, token values, breakpoint, escaping, and sandbox contracts.
- `packages/paja/src/browser-devtools.ts` - Native Clear messages disabled-state synchronization for zero versus populated log states.
- `tests/e2e/paja-single-window.spec.ts` - External-target desktop/phone/reflow measurements, message/state/long-content/focus proof, and screenshots.
- `tests/e2e/paja-runtime-pointer.spec.ts` - Verified-pointer multi-tab, loading/error/recovery, accessible-label, focus, overflow, and screenshot proof.

## Decisions Made

- Raw palette, type, and spacing values belong only to the root token declaration block. Component rules reference tokens, keeping future feed/profile reuse mechanically enforceable.
- Desktop keeps the approved stage-first visual split while DOM/focus order remains identity, tabs, commands, controls, stage, then footer. Phone uses one 640px breakpoint with bounded console, stage, tab, diagnostic, and log scrolling.
- Partial-tab browser proof intercepts and later redispatches the real injected `shell.ready` MessageEvent. It does not create a second readiness sender or alter source binding, session ownership, or protocol timing.
- Empty-log action state is behavior, not a color-only affordance: the actual Clear messages button is disabled at zero rows and enabled from the first rendered row.

## Authority and Conformance Evidence

- Live pre-edit checks resolved `napplet/naps` `master` to `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24` and `nostr-protocol/nips` PR 2303 head to `eb45dfd7335b7f88cb53781984c553581d2b4c34`; neither authority ref moved from Plans 107-01/02.
- Re-read NAP-SHELL and the NIP-5D draft before changing Paja. The exact one-ready/one-init lifecycle, creation-bound identity, registered-source trust, escaped host template, `srcdoc`, and `sandbox="allow-scripts"` without `allow-same-origin` remain intact.
- Result: conformant. Plan 107-03 changes host presentation and deterministic browser evidence only; no NAP message, domain, capability, loader, session, iframe trust, or recovery route changed.

## Verification

- Task 1 focused Vitest (`phase-107-visual-system`, host page) - 5/5 passed.
- Final focused Vitest (`host-page`, target surface, runtime tabs, browser host, visual system, NIP-5D guard, selector) - 7 files and 58/58 tests passed.
- Exact dual-Paja Playwright command - 11 tests passed before the unchanged inherited upload-domain assertion failed at `tests/e2e/paja-single-window.spec.ts:628`; 1 existing live-only test skipped and 2 serial tests did not run. The two serially omitted NAP-SHELL/INC tests were rerun directly and passed 2/2, so all 13 plan-runnable non-baseline tests passed.
- Focused geometry and 160-character target proof - 2/2 passed.
- `corepack pnpm --filter @kehto/paja type-check` - passed.
- `corepack pnpm --filter @kehto/paja build` - passed with only the existing tsup side-effects warning for the generated NIP chunk.
- `corepack pnpm dlx aislop@0.12.0 scan --changes --base fa2218cc` and `--base 04512312` - both 100/100 with no issues.
- `git diff --check` - passed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Synchronized native empty-log action state**
- **Found during:** Task 2 zero/one/many message-state proof
- **Issue:** The exact empty message copy existed, but Clear messages was not behaviorally disabled while the append-only log had zero rows.
- **Fix:** Initialized the action disabled and synchronized it from `state.messageLog.length === 0` after every render.
- **Files modified:** `packages/paja/src/host-page.ts`, `packages/paja/src/browser-devtools.ts`
- **Commit:** `b0c5b5ec`

**2. [Rule 1 - Bug] Used the renderer-consumed error field in the long-message fixture**
- **Found during:** Task 2 long escaped diagnostic proof
- **Issue:** The initial fixture populated an arbitrary value field that the message renderer intentionally does not display, so it could not prove real long-row containment.
- **Fix:** Sent a real error envelope and asserted its escaped literal diagnostic within the bounded chronological log.
- **Files modified:** `tests/e2e/paja-single-window.spec.ts`
- **Commit:** `b0c5b5ec`

**3. [Rule 3 - Blocking] Exposed a temporary Corepack pnpm shim to Playwright child servers**
- **Found during:** Task 2 browser verification
- **Issue:** The environment provides `corepack pnpm`, while Playwright child server commands invoke bare `pnpm`.
- **Fix:** Prepended the existing temporary `/tmp/kehto-corepack-bin` Corepack shim to `PATH` for verification only.
- **Files modified:** None in the repository.
- **Commit:** Not applicable; environment-only fix.

**4. [Rule 3 - Blocking] Normalized inconsistent GSD tracking output**
- **Found during:** Plan closeout
- **Issue:** The state handlers reported 60 percent and Phase 107 in their result envelopes but wrote `percent: 0`, stale activity text, `Phase ?` decision labels, and a malformed roadmap row.
- **Fix:** Preserved the handler-updated plan/session/metrics data and corrected only those inconsistent generated tracking fields to the verified Plan 107-03 values.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Commit:** This closeout commit.

---

**Total deviations:** 4 auto-fixed (1 missing behavioral state, 1 fixture bug, 2 blocking environment/tooling issues)
**Impact on plan:** The message-log fix completes the approved UI contract. No dependency, protocol, loader, session, sandbox, or new production surface was introduced.

## Issues Encountered

- **Inherited upload-domain browser failure:** the exact combined browser command still fails at `tests/e2e/paja-single-window.spec.ts:628`, expecting `shell-init received` but receiving `Required shell domains unavailable`. This is the approved unchanged Plan 107-01/02 baseline already recorded in `.planning/WINDOWS.md`; all Plan 107-03 browser cases and serially omitted guards pass independently.
- **Known nested-worktree package-alignment debt:** unchanged from the Phase 107 baseline. This plan did not run, edit, or traverse registered `.claude/worktrees/*`; Plan 107-05 owns its scoped exclusion.

## Known Stubs

None. The existing live-relay test remains environment-gated, while deterministic signed Relay/Blossom fixtures exercise the plan-owned UI and verified-pointer boundaries.

## Threat Mitigations

- Long targets remain escaped, visible, and preserved in full `title` and accessible-name context while bounded visual text wraps/clamps safely.
- `min-width:0`, local scrollers, wrap-anywhere seams, and exact scroll-width assertions prevent phone clipping or denial of access to host controls.
- Labelled host stage/context surfaces remain distinct from the sandboxed target iframe; malicious target/config renderer vectors and sandbox assertions remain green.
- Screenshot fixtures are synthetic and contain no signer material, tokens, or user data.

## User Setup Required

None.

## Next Phase Readiness

- Plan 107-04 can reuse the locked palette, type, spacing, focus, and responsive containment contracts for feed/profile surfaces.
- Plan 107-05 can audit the full phase while preserving the existing upload-domain and nested-worktree baseline dispositions.

## Self-Check: PASSED

- All six created/modified files exist.
- All four RED/GREEN task commits exist.
- Completion status, requirement IDs, coverage records, authority refs, and verification evidence are present.
- All plan-owned acceptance criteria pass; the one broader browser failure is inherited, already recorded, and independently isolated from Plan 107-03 evidence.

---
*Phase: 107-readable-responsive-paja-system*
*Completed: 2026-07-31*
