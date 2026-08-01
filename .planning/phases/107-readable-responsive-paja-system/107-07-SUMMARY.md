---
phase: 107-readable-responsive-paja-system
plan: 07
subsystem: verification
tags: [paja, immutable-base, whitespace, aislop, playwright, conformance]

requires:
  - phase: 107-readable-responsive-paja-system
    plans: [01, 02, 03, 04, 05, 06]
    provides: Responsive Paja presentation, host recovery, verified loaders, timeout settlement, documentation, and release intent
provides:
  - Whitespace-clean Phase 107 review evidence with no semantic content changes
  - Reproducible immutable-base quality, build, type, unit, docs, conformance, and Chromium acceptance
  - Separate exact-title evidence for inherited upload defect 28 without an upload-domain change
affects: [phase-107-verification, phase-108, paja, release-readiness]

tech-stack:
  added: []
  patterns:
    - Literal immutable commit reused across parent Git validation, diff checks, and pinned changed-file scanning
    - Inherited browser debt reproduced by exact test title outside the Phase-owned passing set
    - Descriptor-less prohibitions remain explicit human judgments even when automated evidence supports them

key-files:
  created:
    - .planning/phases/107-readable-responsive-paja-system/107-07-SUMMARY.md
  modified:
    - .planning/phases/107-readable-responsive-paja-system/107-REVIEW-FIX.iter2.md
    - .planning/phases/107-readable-responsive-paja-system/107-REVIEW.iter2.md
    - .planning/phases/107-readable-responsive-paja-system/107-REVIEW.iter3.md

key-decisions:
  - "Use literal commit b7d045f560d6945e7974f9719fcd9c02314f9588 for every Phase 107 range gate; the known sandbox child-Git rerun changes environment only, never base or score policy."
  - "Keep upload defect 28 explicit and inherited after one exact-title failure with Required shell domains unavailable; make no upload code, test, expectation, allowlist, or capability change."
  - "Retain all three descriptor-less prohibitions as human-judgment gates rather than converting supporting automation into authoritative approval."

patterns-established:
  - "Evidence-only cleanup: prove the working-tree diff is empty under --ignore-space-at-eol before committing."
  - "Baseline separation: run all owned browser cases with the inherited title excluded, then reproduce that title alone and assert its exact failure signature."

requirements-completed: [VIS-01, VIS-02, VIS-03, PAJA-01, PAJA-02, PAJA-03, PAJA-04]

coverage:
  - id: D1
    description: "The three named review artifacts contain no trailing whitespace, preserve all non-EOL-space content, and leave the complete immutable-base range diff-check clean."
    verification:
      - kind: other
        ref: "git diff --ignore-space-at-eol --exit-code -- <three review artifacts>"
        status: pass
      - kind: other
        ref: "git diff --check b7d045f560d6945e7974f9719fcd9c02314f9588"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pinned aislop 0.12.0 scores the exact Phase 107 range at 100/100, and all owned build, type, unit, docs, conformance, selector, controller, Paja Chromium, and theme gates pass while defect 28 remains separate."
    verification:
      - kind: other
        ref: "corepack pnpm dlx aislop@0.12.0 scan --changes --base b7d045f560d6945e7974f9719fcd9c02314f9588 --json"
        status: pass
      - kind: integration
        ref: "corepack pnpm build; corepack pnpm type-check; corepack pnpm exec vitest run --exclude .claude/worktrees/**; corepack pnpm docs:check"
        status: pass
      - kind: automated_ui
        ref: "Paja owned Chromium grep-invert suite and tests/e2e/theme-broadcast.spec.ts"
        status: pass
      - kind: other
        ref: "Exact-title defect 28 reproduction: one expected nonzero Required shell domains unavailable failure"
        status: pass
    human_judgment: false
  - id: D3
    description: "No NAP message, capability, routing, lifecycle, sandbox, verified-byte, or package-version expansion entered Phase 107."
    verification:
      - kind: unit
        ref: "tests/unit/identity-theme-conformance-guard.test.ts and tests/unit/nip5d-conformance-guard.test.ts"
        status: pass
    human_judgment: true
    rationale: "PLAN frontmatter classifies this negative protocol-scope prohibition as a non-authoritative human judgment."
  - id: D4
    description: "At 375x812, Paja identity/current target and host content remain perceptibly reachable without page-level horizontal scrolling."
    verification:
      - kind: automated_ui
        ref: "tests/e2e/paja-single-window.spec.ts and tests/e2e/paja-runtime-pointer.spec.ts phone geometry/keyboard cases"
        status: pass
    human_judgment: true
    rationale: "Automated geometry is strong evidence, but perceived reachability and unobscured focus remain judgment-tier."
  - id: D5
    description: "Feed/profile behavioral recovery remains Phase 108 scope and did not enter Phase 107."
    verification:
      - kind: automated_ui
        ref: "tests/e2e/theme-broadcast.spec.ts existing-state desktop/phone cases"
        status: pass
    human_judgment: true
    rationale: "Negative behavioral scope is explicitly a human-judgment prohibition in the plan."

duration: 10m
completed: 2026-07-31
status: complete
---

# Phase 107 Plan 07: Immutable-Base Acceptance Summary

**Phase 107 now has a whitespace-clean immutable-base range, pinned 100/100 quality proof, complete owned acceptance, and separately preserved evidence for inherited upload defect 28.**

## Performance

- **Duration:** 10m
- **Started:** 2026-07-31T11:47:12Z
- **Completed:** 2026-07-31T11:57:24Z
- **Tasks:** 1
- **Task-owned files modified:** 3

## Accomplishments

- Removed only trailing spaces from the three named review artifacts and proved their working-tree changes disappear under `--ignore-space-at-eol`; findings, refs, statuses, evidence, and prose remain unchanged.
- Validated exact Phase base `b7d045f560d6945e7974f9719fcd9c02314f9588`, restored the complete range diff gate, and produced pinned `aislop@0.12.0` JSON evidence with `scoreable: true`, numeric score `100`, and zero issues.
- Passed every Phase 107-owned build/type/unit/docs/conformance/controller/Chromium gate after Plan 107-06, while exact-title defect 28 reproduced as one inherited nonzero `Required shell domains unavailable` failure.
- Reconfirmed 13/13 source-audit rows, 16/16 spec-less edge items, 46/46 applicable UI considerations, seven requirements, and D-01 through D-12 coverage, with all three human prohibitions still explicitly unverified judgments.

## Task Commits

1. **Task 1: Reproduce clean Phase 107 acceptance from the exact base** - `d6b58f16` (style)

**Plan metadata:** this closeout commit

## Files Created/Modified

- `.planning/phases/107-readable-responsive-paja-system/107-REVIEW-FIX.iter2.md` - Removed trailing spaces only from review-fix evidence.
- `.planning/phases/107-readable-responsive-paja-system/107-REVIEW.iter2.md` - Removed trailing spaces only from the first review evidence.
- `.planning/phases/107-readable-responsive-paja-system/107-REVIEW.iter3.md` - Removed trailing spaces only from the second review evidence.
- `.planning/phases/107-readable-responsive-paja-system/107-07-SUMMARY.md` - Records exact base, scanner, full gates, edge/source audit, defect disposition, and judgment flags.

## Decisions Made

- The same literal 40-hex Phase base was resolved as an exact commit, verified as an ancestor of HEAD, and reused for `.aislop/config.yml` integrity, `git diff --check`, and the pinned changed-file scan.
- The scanner's sandbox attempt failed only with the pre-authorized child-Git base-resolution signature. The exact command was rerun outside the sandbox with the same literal SHA, pinned version, JSON mode, and numeric assertion; this was not an override.
- Defect 28 remains inherited baseline debt. Its isolated failure is evidence, not a Phase-owned passing gate, and no upload behavior or expectation changed.
- Supporting automation does not resolve the three human-judgment prohibitions.

## Immutable Base and Quality Evidence

- `git rev-parse 'b7d045f560d6945e7974f9719fcd9c02314f9588^{commit}'` returned the same 40-hex commit.
- `git merge-base --is-ancestor b7d045f560d6945e7974f9719fcd9c02314f9588 HEAD` exited 0.
- `git diff --quiet b7d045f560d6945e7974f9719fcd9c02314f9588 -- .aislop/config.yml` exited 0.
- The three task files contained no trailing spaces after cleanup; their diff against pre-task HEAD was empty under `--ignore-space-at-eol`.
- `git diff --check b7d045f560d6945e7974f9719fcd9c02314f9588` exited 0 before and after the task commit.
- Sandboxed pinned scan exited 1 with `Could not resolve base ref` after parent Git had validated the SHA. Exact unsandboxed rerun returned `scoreable: true`, `score: 100`, zero issues, and passed the numeric `jq` assertion. No config, threshold, rule, ignore, base, or accepted override changed.

## Verification

| Gate | Result |
|---|---|
| `corepack pnpm build` | PASS — 33 packages/tasks succeeded |
| `corepack pnpm type-check` | PASS — 17/17 tasks |
| Full Vitest excluding `.claude/worktrees/**` | PASS — 130 files, 1583/1583 tests |
| `corepack pnpm docs:check` | PASS — strict TypeDoc, VitePress, and nine-package audit |
| Focused visual/theme/NIP/selector/Paja controllers | PASS — 10 files, 92/92 tests |
| Owned Paja Chromium cases with defect title inverted | PASS — 17 passed, one live-only case skipped |
| Exact-title inherited upload defect 28 | EXPECTED NONZERO — status 1, one failed case, `Required shell domains unavailable` |
| Theme-broadcast Chromium | PASS — 4/4 tests |
| Pinned `aislop@0.12.0` exact-base JSON scan | PASS — scoreable, 100/100, zero issues |
| Final exact-base `git diff --check` | PASS |

The full Vitest sandbox attempt produced only restricted-environment failures (`spawnSync git/node EPERM` and loopback `listen EPERM`); its exact unsandboxed rerun passed 1583/1583. Browser gates used the temporary Corepack shim under `/tmp` and approved local-server/browser execution; repository dependencies were unchanged.

## Defect 28 Disposition

- Exact test title: `stores disclosed bytes through a signed Blossom upload and fails closed on denial or incomplete proof`.
- Suite-qualified exact-title selection ran one test at `tests/e2e/paja-single-window.spec.ts:703`.
- Exit status was 1; Playwright reported exactly one failed case.
- Expected `shell-init received`; received the inherited `Required shell domains unavailable` symptom.
- Base/blame evidence from `107-VERIFICATION.md` establishes that the upload expectation predates Phase 107. This plan changed no upload code, test, expectation, allowlist, capability mapping, or fixture behavior.

## Edge, Source, UI, and Decision Audit

- **Source audit:** 13/13 rows `COVERED`; zero `MISSING` rows.
- **Spec-less edges:** 16/16 accounted for — VIS-01 empty/encoding; VIS-02 adjacency/empty/encoding/ordering; VIS-03 empty/encoding; PAJA-01/02 unclassified browser evidence; PAJA-03 idempotency/concurrency; PAJA-04 boundary/precision/idempotency/concurrency.
- **UI considerations:** 46/46 applicable considerations retain static or browser evidence, including 24 browser backstops for loading/error/overflow/long-text/partial/viewport states.
- **Requirements:** VIS-01, VIS-02, VIS-03, PAJA-01, PAJA-02, PAJA-03, and PAJA-04 are covered by the passing final gates.
- **Locked decisions:** D-01 through D-07 visual/viewport behavior, D-08 through D-10 recovery/loader boundaries, and D-11/D-12 semantic-only feed/profile scope retain evidence.
- **API matrix:** non-applicable; Plan 107-07 changes evidence whitespace only and Plan 107-06 bounded an existing path without adding an external API.

## Human Verification Required

These remain explicit, non-authoritative judgment gates:

1. Review the Phase 107 base diff against current NAP-SHELL/NAP-THEME/NIP-5D refs and confirm no protocol, capability, routing, lifecycle, sandbox, verified-byte, or package-version expansion.
2. At 375x812, confirm identity/current target, controls, stage, diagnostics, footer, and focus remain perceptibly reachable without page-level horizontal scrolling.
3. Exercise feed/profile states and confirm behavioral recovery remains Phase 108 scope.

Automated evidence supports all three; this summary does not silently mark them human-approved.

## Authority and Conformance Evidence

- **NAP authority inherited from 107-06:** `napplet/naps` master `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`.
- **NIP-5D authority inherited from 107-06:** PR 2303 head `eb45dfd7335b7f88cb53781984c553581d2b4c34`.
- Focused identity/theme and NIP-5D conformance guards passed. Verified bytes, CSP/prelude order, `sandbox="allow-scripts"` without same-origin, current-source trust, session lifecycle, message shapes, capabilities, and routing remain unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted exact defect selection and log assertion to installed CLI semantics**

- **Found during:** Task 1 exact defect-28 reproduction
- **Issue:** Playwright applies `--grep` to a suite-qualified full title, so the plan's `^title$` regex selected zero tests. Installed ripgrep also interprets combined `-Eq` as an encoding flag, not grep-style extended-regex plus quiet mode.
- **Fix:** Required the unchanged exact title as the terminal full-title segment (`title$`), asserted the unique source location and one selected/failed case, and used ripgrep's native `-q` assertion for `1 failed`.
- **Files modified:** None
- **Verification:** One exact titled test ran, exited 1, reported exactly one failure, and contained `Required shell domains unavailable`.
- **Committed in:** No file change; verification-only deviation recorded here.

**2. [Rule 3 - Blocking] Normalized generated phase-tracking metadata**

- **Found during:** Plan closeout
- **Issue:** Canonical handlers counted 7/7 summaries but retained `ready_to_execute` copy, wrote 50 percent in frontmatter against the 100 percent current-phase plan bar, left stale 6/7 activity/metrics, malformed the roadmap row, and did not replace `Gaps Found` in the seven requirement traceability rows.
- **Fix:** Preserved handler-written plan count, metric, decisions, and session data; set Phase 107 to ready for verification with 7/7 and 100 percent plan progress, restored the roadmap row format, and aligned all seven Phase 107 traceability rows to `Complete`.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`
- **Verification:** STATE reports 7/7 and ready for verification; ROADMAP reports 7/7 In Progress pending verification; all seven requirement checkboxes and traceability rows are complete.
- **Committed in:** Plan closeout commit.

---

**Total deviations:** 2 auto-fixed (2 blocking verification/tracking compatibility issues)
**Impact on plan:** The selected test title, failure expectation, output checks, product files, and defect disposition are unchanged. Tracking now matches on-disk execution; no product or upload scope entered the task.

## Issues Encountered

- Restricted sandbox execution blocked nested child processes, loopback listeners, and one synthetic mount. Exact commands were rerun in the permitted environment; all passed without repository changes.
- Paja build retained its pre-existing `@kehto/nip` side-effects warning while succeeding. This evidence-only plan did not change package metadata.

## Known Stubs

None. The three task-owned Markdown files contain no TODO/FIXME/placeholder or unwired data-source additions.

## Threat Mitigations

- T-107-07-01: literal commit-object and ancestor checks prevent base substitution; the same SHA drives diff and scanner evidence.
- T-107-07-02: pinned scanner version, JSON output, unchanged policy, and numeric score assertion prevent verdict weakening.
- T-107-07-03: owned browser cases and inherited defect run separately; no upload-path mutation masks either result.
- Gate logs use deterministic public fixtures and contain no signer material, token, passphrase, bunker URI, or secret.
- No new endpoint, auth path, file-access pattern, schema, dependency, or other threat surface was introduced.

## User Setup Required

None.

## Next Phase Readiness

- All seven Phase 107 plans are executed and automated acceptance is green; Phase 107 is ready for verification/human judgment.
- Phase 108 retains exclusive ownership of feed/profile retry, reconnect, recovery copy, and state-transition work.
- Inherited upload defect 28 remains visible baseline debt and is not a Phase 107 regression.

## Self-Check: PASSED

- All three modified review artifacts and this summary exist.
- Task commit `d6b58f16` exists and contains only the three named whitespace-clean review artifacts.
- Exact base/config/diff evidence, pinned scanner score, all gate totals, exact authority refs, defect output, source/edge/UI audit, seven requirements, and three human-judgment flags are recorded.
- Stub and threat-surface scans found no new stub or unplanned security surface.

---
*Phase: 107-readable-responsive-paja-system*
*Completed: 2026-07-31*
