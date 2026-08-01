---
phase: 107-readable-responsive-paja-system
plan: 08
subsystem: ui-runtime
tags: [paja, recovery, playwright, cors, module-loading, external-review]

requires:
  - phase: 107-readable-responsive-paja-system
    plans: [01, 02, 03, 04, 05, 06, 07]
    provides: Responsive Paja host, verified loaders, retry surfaces, immutable-base acceptance, and preserved protocol boundaries
provides:
  - Generation-owned reload and pointer-resolution recovery under one readiness budget
  - Browser-authoritative external module failure and document-completion settlement
  - Inert failed-document teardown for external and verified-pointer targets
  - Exact-head remote CI and external Codex review with fourteen resolved threads
affects: [phase-107-verification, phase-108, paja, release-readiness]

tech-stack:
  added: []
  removed: [es-module-lexer direct paja dependency]
  patterns:
    - Trusted external readiness requires both bare shell.ready and token-bound browser document completion
    - Browser-native module parsing and fetching remain authoritative over terminal source approximation
    - Failed target sessions unregister before their iframe is replaced with inert srcdoc

key-files:
  created:
    - .planning/phases/107-readable-responsive-paja-system/107-08-SUMMARY.md
  modified:
    - packages/paja/src/browser-host.ts
    - packages/paja/src/browser-host-runtime.ts
    - packages/paja/src/browser-target-frame.ts
    - packages/paja/src/browser-runtime-pointer.ts
    - packages/paja/src/target-cors.ts
    - packages/paja/src/server.ts
    - tests/e2e/paja-single-window.spec.ts
    - tests/e2e/paja-runtime-pointer.spec.ts
    - docs/packages/paja.md
    - packages/paja/README.md

key-decisions:
  - "Remove terminal module crawling after exact-head review proved browser parsing, redirects, credentials, data URLs, concurrency, and cancellation could not be reproduced safely."
  - "Keep one bare shell.ready and one shell.init, but expose external readiness only after a per-attempt-token-bound document-complete signal from the registered current frame."
  - "Treat the historical upload-domain failure as not reproduced on the final head without claiming this unrelated recovery change fixed it."

patterns-established:
  - "Browser-authority settlement: private lifecycle messages are source-checked, token-checked, consumed before ShellBridge, and never become NAP messages."
  - "Review convergence: every exact-head finding receives a regression or structural removal, a thread reply, resolution, and a final exact-head reviewer verdict."

requirements-completed: [PAJA-03, PAJA-04]

coverage:
  - id: D1
    description: "Reload supersedes owned external work, pointer resolution shares readyTimeoutMs, and late generations cannot overwrite the current attempt."
    requirement: PAJA-04
    verification:
      - kind: automated_ui
        ref: "tests/e2e/paja-single-window.spec.ts#reload supersedes an in-flight external attempt"
        status: pass
      - kind: automated_ui
        ref: "tests/e2e/paja-runtime-pointer.spec.ts#times out hanging Blossom pointer resolution"
        status: pass
    human_judgment: false
  - id: D2
    description: "The sandbox browser decides external module viability, and Paja settles ready only after trusted shell.ready plus document completion."
    requirement: PAJA-03
    verification:
      - kind: automated_ui
        ref: "tests/e2e/paja-single-window.spec.ts module root, dependency, inert markup, data module, and forged completion cases"
        status: pass
      - kind: unit
        ref: "packages/paja/src/browser-host.test.ts#uses browser lifecycle events instead of terminal module graph crawling"
        status: pass
    human_judgment: false
  - id: D3
    description: "Readiness-failed external and verified-pointer documents stop executing behind recovery and Retry remains actionable."
    requirement: PAJA-04
    verification:
      - kind: automated_ui
        ref: "tests/e2e/paja-single-window.spec.ts and tests/e2e/paja-runtime-pointer.spec.ts timeout/retry/pagehide cases"
        status: pass
    human_judgment: false
  - id: D4
    description: "No NAP message, capability, route, sandbox permission, verified-byte rule, or package API changed while adding private Paja lifecycle settlement."
    verification:
      - kind: unit
        ref: "tests/unit/nip5d-conformance-guard.test.ts and packages/paja/src/browser-host.test.ts"
        status: pass
    human_judgment: true
    rationale: "The plan preserves this negative protocol-scope prohibition as an explicit human judgment despite passing guards and authority checks."
  - id: D5
    description: "PR #2 exact head passes protected CI, pinned quality gates, and external Codex review with all fourteen findings resolved."
    verification:
      - kind: other
        ref: "PR #2 head a0f8dac4345155b5cbf2b710cbe7f7a3bcf2e0cd: all GitHub checks pass; external Codex found no major issues"
        status: pass
      - kind: other
        ref: "aislop 0.12.0 exact-base scan: 100/100, zero findings"
        status: pass
    human_judgment: false

duration: 1h51m
completed: 2026-08-01
status: complete
---

# Phase 107 Plan 08: Exact-Head Review Gap Closure Summary

**Paja recovery now trusts real sandbox-browser module loading, owns reload and pointer deadlines, tears down failed documents, and has clean exact-head CI plus external review.**

## Performance

- **Duration:** 1h51m
- **Started:** 2026-08-01T17:56:50+05:30
- **Completed:** 2026-08-01T19:47:28+05:30
- **Tasks:** 6
- **Files modified:** 14

## Accomplishments

- Made external Reload authoritative during in-flight work and bounded full pointer resolution with the existing `readyTimeoutMs` and owned abort controller.
- Replaced terminal module crawling with a self-removing, per-attempt-token-bound observer in the real sandbox; readiness now requires trusted `shell.ready` plus document completion, while an actual module failure wins first.
- Preserved browser-native import-map, inert-markup, concurrency, redirect, `data:`, credential, and cancellation behavior by removing the crawler endpoint and direct lexer dependency.
- Passed full local gates and GitHub CI at `a0f8dac4`; external Codex reported no major issues on that exact head, and all fourteen review threads were answered and resolved.

## Task Commits

1. **Task 1: Add exact regressions for first-round defects** - `342bfc29` (test)
2. **Task 2: Supersede external work and own navigation** - `adb07611` (fix)
3. **Task 3: Bound pointer resolution attempts** - `6e66dc90`, `4e883d23` (fix/test)
4. **Task 4: Correct CORS precision and failed-document teardown** - `4d47e3fb`, `596453f6` (test/fix)
5. **Task 5: Reproduce and close module-graph gaps** - `f33fed8d`, `bd4813a3` (test/fix)
6. **Task 6: Replace terminal crawling with browser authority** - `8e54b460`, `9f76e045`, `a0f8dac4` (test/fix/docs)

**Plan metadata:** `d9d1d7d8`, `902881e0`, `02d2b55c`, `3e70de2b`, `a124ba54`

## Files Created/Modified

- `packages/paja/src/browser-host.ts` - Trusts private lifecycle events only from the registered frame and matching attempt token.
- `packages/paja/src/browser-host-runtime.ts` - Owns external generation, deadline, token, dual readiness gates, failure, and Retry settlement.
- `packages/paja/src/browser-target-frame.ts` - Injects the external-only observer and resets failed content to inert `srcdoc`.
- `packages/paja/src/browser-runtime-pointer.ts` - Bounds pre-tab relay and Blossom resolution with the existing readiness budget.
- `packages/paja/src/target-cors.ts` - Retains only the stable public single-resource diagnostic helpers.
- `packages/paja/src/server.ts` - Removes the terminal crawler endpoint while retaining owned target-document proxy cancellation.
- `tests/e2e/paja-single-window.spec.ts` - Proves reload, timeout, real module failures, inert markup, data modules, token forgery rejection, Retry, and source ownership.
- `tests/e2e/paja-runtime-pointer.spec.ts` - Proves resolver timeout, retry, stale completion, and pagehide cancellation.
- `docs/packages/paja.md` and `packages/paja/README.md` - Document browser-authoritative module recovery and unchanged public boundaries.

## Decisions Made

- A terminal scanner cannot safely reproduce browser HTML parsing, import maps, redirect bases, fetch concurrency, credentials, non-network modules, or cancellation. Removing it closes the entire reviewed defect class.
- The standard injected `shell.ready` still establishes the shell session immediately, but host-visible ready waits for actual document completion. Module-script error before completion settles recovery and unregisters that session.
- Private lifecycle events carry an unguessable per-attempt token; the injected script removes itself before authored code runs, and the parent consumes these messages before protocol logging or ShellBridge dispatch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced the planned terminal graph scanner after exact-head review exposed seven browser-semantic defects**

- **Found during:** Tasks 4 and 5 exact-head external re-review
- **Issue:** Each scanner expansion created new false positives, false negatives, serial timing drift, credential drift, or detached work that the browser already handles correctly.
- **Fix:** Added Task 6, removed crawler implementation/endpoint/dependency, and used the registered sandbox frame as the loading authority.
- **Verification:** External Chromium 22/22, pointer Chromium 9 pass plus one live-only skip, full unit 1589/1589, all GitHub checks, and clean exact-head external Codex review.
- **Committed in:** `9f76e045`

**2. [Rule 2 - Missing Critical] Bound private lifecycle completion to one self-removing per-attempt token**

- **Found during:** Task 6 source-trust review
- **Issue:** A predictable private message type alone could be forged by authored target code before a later real module failure.
- **Fix:** Generate one owned token per navigation, remove the observer script while it executes, require token plus registered current source, and discard private messages before ShellBridge.
- **Verification:** `ignores an authored forged completion before a real module failure` passes in Chromium.
- **Committed in:** `9f76e045`

---

**Total deviations:** 2 auto-fixed (1 blocking architecture correction, 1 missing source-trust guard)
**Impact on plan:** Both changes narrow false terminal behavior and strengthen the existing source boundary. No Phase 108, NAP, capability, route, sandbox, verified-byte, or public API scope entered.

## Issues Encountered

- Four exact-head review rounds were required. The first three found 3, 2, 2, and then 7 actionable defects; the final browser-authority head received a clean external verdict.
- Restricted execution blocked loopback unit/browser tests; exact commands passed in the approved local-server/browser environment without repository workarounds.
- The historical upload-domain failure did not reproduce in the final 22/22 external Chromium run. No upload behavior changed, so this plan makes no causal fix claim.

## Verification

| Gate | Result |
|---|---|
| `corepack pnpm build` | PASS — 32/32 tasks |
| `corepack pnpm type-check` | PASS — 17/17 tasks |
| `corepack pnpm test:unit` | PASS — 130 files, 1589/1589 tests |
| `corepack pnpm docs:check` | PASS — strict TypeDoc, VitePress, and nine-package audit |
| External-target Chromium | PASS — 22/22 |
| Runtime-pointer Chromium | PASS — 9 passed, one deliberate live-only skip |
| NAP/theme Chromium | PASS — 5/5 |
| Pinned `aislop@0.12.0` exact-base JSON scan | PASS — 100/100, zero findings |
| Exact-base `git diff --check` and config integrity | PASS |
| GitHub CI at `a0f8dac4` | PASS — build/type, Vitest, Playwright, scope, and changeset guards |
| External Codex exact-head review | PASS — no major issues; fourteen threads resolved |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 107 implementation and remote review are ready for re-verification. Resume the existing four-item UAT; do not start Phase 108 until Phase 107 is verified and the requested pause is honored.

---
*Phase: 107-readable-responsive-paja-system*
*Completed: 2026-08-01*
