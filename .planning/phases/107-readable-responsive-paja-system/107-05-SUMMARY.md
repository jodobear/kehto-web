---
phase: 107-readable-responsive-paja-system
plan: 05
subsystem: ui
tags: [paja, responsive-ui, recovery, documentation, changesets, conformance]

requires:
  - phase: 107-readable-responsive-paja-system
    plans: [01, 02, 03, 04]
    provides: External and pointer recovery, accessible runtime tabs, semantic responsive Paja UI, and aligned feed/profile presentation
provides:
  - Exact operator and author documentation for the shipped desktop, phone, and host-DOM recovery contract
  - Patch-only release intent for the shipped @kehto/paja changes
  - Phase-base verification across build, types, units, browser surfaces, docs, conformance, and AI-slop
affects: [phase-108, paja, playground, release, documentation]

tech-stack:
  added: []
  patterns:
    - Protocol-facing docs name exact UI actions while preserving loader, session, sandbox, and verified-byte boundaries
    - Release metadata is staged and committed by one explicit changeset path
    - Recursive verification excludes registered nested worktrees and audits the immutable phase-base range

key-files:
  created:
    - .changeset/readable-responsive-paja.md
    - .planning/phases/107-readable-responsive-paja-system/deferred-items.md
  modified:
    - packages/paja/README.md
    - docs/packages/paja.md
    - docs/how-tos/paja-getting-started.md
    - docs/how-tos/paja-local-authoring.md
    - tests/unit/napplet-package-alignment.test.ts
    - tests/unit/playground-gateway-guard.test.ts

key-decisions:
  - "Keep the current NAP-SHELL, NAP-THEME, and NIP-5D boundaries unchanged; document only the shipped host presentation and existing recovery delegation."
  - "Apply the explicit Phase 107 handoff as one @kehto/paja patch changeset, without editing package versions, JSR metadata, changelogs, or docs version rows."
  - "Treat the upload-domain browser assertion as inherited open defect 28; preserve its evidence while requiring every Phase 107-owned browser case to pass."

patterns-established:
  - "Recovery documentation: name exact action copy, focus behavior, literal diagnostics, and the existing verified loader used by each target path."
  - "Phase closeout: validate from the recorded pre-phase SHA and keep nested registered worktrees outside discovery and diffs."

requirements-completed: [VIS-01, VIS-02, VIS-03, PAJA-01, PAJA-02, PAJA-03, PAJA-04]

coverage:
  - id: D1
    description: "Paja package and how-to documentation describe the exact desktop/phone composition, host-DOM failure surface, recovery controls, focus behavior, and unchanged protocol/security boundaries."
    requirement: PAJA-04
    verification:
      - kind: other
        ref: "corepack pnpm docs:check"
        status: pass
      - kind: unit
        ref: "tests/unit/nip5d-conformance-guard.test.ts and tests/unit/phase-107-visual-system.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Release intent contains exactly one patch entry for @kehto/paja and no direct package, JSR, changelog, or documentation version-row edit."
    requirement: PAJA-04
    verification:
      - kind: other
        ref: "corepack pnpm changeset status and phase-base metadata diff"
        status: pass
    human_judgment: false
  - id: D3
    description: "All seven Phase 107 requirements, 12 decision mappings, 16 fallback edge items, 46 UI considerations, and three kept prohibitions have explicit implementation and verification coverage."
    verification:
      - kind: unit
        ref: "corepack pnpm exec vitest run --exclude .claude/worktrees/** (130 files, 1581 tests)"
        status: pass
      - kind: automated_ui
        ref: "Phase-owned Paja Chromium cases plus theme-broadcast Chromium suite"
        status: pass
      - kind: other
        ref: "aislop 0.12.0 phase-base scan"
        status: pass
    human_judgment: false

duration: 2h 24m
completed: 2026-07-31
status: complete
---

# Phase 107 Plan 05: Paja Documentation and Phase Closeout Summary

**Paja now has exact responsive/recovery guidance and a patch-only release record, backed by phase-base build, type, unit, browser, documentation, conformance, and 100/100 quality evidence.**

## Performance

- **Duration:** 2h 24m, including the browser approval checkpoint
- **Started:** 2026-07-31T06:33:01Z
- **Completed:** 2026-07-31T08:57:13Z
- **Tasks:** 2
- **Task-owned files modified or created:** 7

## Accomplishments

- Updated all four Paja package/reference/how-to documents with the exact 1280x720 desktop split, max-width 640px phone composition, 375x812 containment, action labels, focus outcomes, host-DOM failure behavior, literal diagnostics, and existing-loader delegation.
- Added one patch changeset for `@kehto/paja` while preserving package versions, JSR metadata, changelogs, and the documented `0.11.0` version row.
- Closed the full Phase 107 source audit with all requirements and planning inputs covered, no nested-worktree path in the phase range, and a pinned AI-slop score of 100/100.

## Task Commits

Each task was committed atomically:

1. **Task 1: Document responsive Paja recovery** - `52c061c6`
2. **Task 2: Add scoped Paja patch changeset** - `fb70cab0`

Supporting execution commits:

- **Rule 3 gate repair:** `a91439aa`
- **Approval-checkpoint recovery state:** `005fb173`
- **Plan metadata:** this closeout commit

All Task 107-01 through 107-05 implementation/test commits and both Plan 107-05 task commits exist with machine-readable `Co-Authored-By: Codex <noreply@openai.com>` trailers. The older Plan 107-01 metadata-only closeout commit is not a task commit and has no trailer.

## Files Created/Modified

- `packages/paja/README.md` - Exact responsive host, recovery action, focus, and unchanged security-boundary guidance.
- `docs/packages/paja.md` - Complete public Paja host/runtime-pointer reference while preserving version `0.11.0`.
- `docs/how-tos/paja-getting-started.md` - User flow for loading, retrying, returning, and inspecting failures.
- `docs/how-tos/paja-local-authoring.md` - Local author workflow with current CORS, verified-loader, sandbox, source/session, and shell-handshake facts.
- `.changeset/readable-responsive-paja.md` - Single patch release entry for `@kehto/paja`.
- `tests/unit/napplet-package-alignment.test.ts` - Recursive repository audit excludes active `.claude` worktrees.
- `tests/unit/playground-gateway-guard.test.ts` - Guard follows the shipped semantic `danger` tone name.
- `.planning/phases/107-readable-responsive-paja-system/deferred-items.md` - Durable note for the inherited upload-domain browser assertion.

## Decisions Made

- The final live authority check matched the initial refs, so no documentation adaptation or protocol code change was required.
- Recovery documentation describes the existing external, pointer, and active-tab loader paths; it does not claim new messages, capabilities, session behavior, iframe content, or feed/profile recovery.
- The user-requested patch handoff overrides the research suggestion of a 0.x minor and remains scoped to the only shipped package changed by this phase.
- The combined Paja command's inherited upload-domain assertion remains open rather than being altered during a visual/recovery phase.

## Authority and Conformance Evidence

- **Phase base SHA:** `b7d045f560d6945e7974f9719fcd9c02314f9588`, extracted from `107-01-SUMMARY.md` and verified as an ancestor of the final task commit.
- **Initial and final NAP authority:** `napplet/naps` `master` at `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`.
- **Initial and final NIP-5D draft authority:** `nostr-protocol/nips` PR 2303 head at `eb45dfd7335b7f88cb53781984c553581d2b4c34`.
- Rechecked NAP-SHELL's mandatory injected receiver and one-shot ready/init lifecycle, NAP-THEME's host-pushed theme payload, and NIP-5D's verified-byte/source/sandbox boundaries against the implementation and documentation.
- **Result:** conformant. Phase 107 changes presentation, local host recovery, tests, and guidance only; wire fields, directions, capabilities, registered-source sessions, verified bytes, CSP/prelude, and sandbox policy are unchanged.

## Verification

- `corepack pnpm build` - 32/32 package tasks passed.
- `corepack pnpm type-check` - 17/17 package tasks passed.
- Full Vitest with explicit `.claude/worktrees/**` exclusion - 130 files and 1581/1581 tests passed.
- Final focused visual/theme/NIP/selector/controller Vitest - 8 files and 69/69 tests passed.
- Task 1 docs/conformance/action/stale-string gate - docs passed, 24/24 focused tests passed, every exact action/protocol string present, forbidden legacy guidance absent, and changed-file AI-slop scored 100/100.
- Theme-broadcast Chromium suite - 4/4 passed.
- Omitted serial NAP-SHELL/INC Paja guards - 2/2 passed.
- Combined Paja Chromium command - 11 passed and 1 intentional live-only case skipped before the inherited upload-domain assertion failed at `tests/e2e/paja-single-window.spec.ts:628`; two later serial cases did not run in that command and passed in the direct 2/2 rerun. Every Phase 107-owned non-live browser case passed.
- Paja E2E selector - `packages/paja/src/browser-host.ts` maps to both `tests/e2e/paja-runtime-pointer.spec.ts` and `tests/e2e/paja-single-window.spec.ts` in one source mapping.
- `corepack pnpm docs:check` - TypeDoc strict conversion, VitePress build, and nine-package documentation audit passed.
- `aislop@0.12.0 scan --changes --base b7d045f560d6945e7974f9719fcd9c02314f9588` - 9 changed source files, 0 issues, 100/100.
- `corepack pnpm changeset status` - only `@kehto/paja` is scheduled for a patch bump.
- Phase-base metadata audit - no `package.json`, `jsr.json`, changelog, or docs version-row change.
- `git diff --check b7d045f560d6945e7974f9719fcd9c02314f9588..HEAD` - passed.
- Source audit - 7/7 requirements, 12/12 decision mappings, 16/16 fallback edges, 46/46 UI considerations, and 3/3 kept prohibitions covered; zero missing or unresolved rows.

## Nested Worktree Preservation Evidence

- `git worktree list --porcelain` still lists both registered `.claude/worktrees/agent-*` checkouts at their original nested paths.
- The Phase 107 range contains no `.claude/worktrees/**` path.
- Build/type/docs selection stayed inside `pnpm-workspace.yaml`; full Vitest explicitly excluded `.claude/worktrees/**`; repository package discovery now excludes `.claude`.
- Full registry checksums were `3fbfd047a1623ba8710a66bcfb198e27bcf8db9a22b7ba67fdae477498d73eac` before the browser checkpoint and `6a92f5f4ae06ae356ac15f01887eb99b59d549c0ab93e293dfb120fd536cb30b` on resume. That full stream includes the primary checkout HEAD and therefore changes on ordinary task commits. At closeout, the two nested records alone hash to `c657e7d83d0484cf2e091d39b7d99bc495b70f48446a101b09243d6a52dd6b08`; their paths, HEADs, branches, and recorded lock state match the resumed read-only registry output. No Phase 107 commit contains a nested-worktree path, and this execution performed no registry or nested-checkout mutation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Excluded active nested worktrees from package discovery**

- **Found during:** Task 2 full unit gate
- **Issue:** The package-alignment walk recursively entered `.claude/worktrees`, violating the plan's active-foreign-state boundary and discovering duplicate repositories.
- **Fix:** Excluded `.claude` at the repository walker boundary while preserving all declared package-root checks.
- **Files modified:** `tests/unit/napplet-package-alignment.test.ts`
- **Verification:** Focused guards passed 22/22; full Vitest passed 1581/1581 with the explicit nested-worktree exclusion; phase-base nested-path diff is empty.
- **Committed in:** `a91439aa`

**2. [Rule 3 - Blocking] Updated stale semantic-tone guard**

- **Found during:** Task 2 full unit gate
- **Issue:** A static playground guard still asserted the pre-Phase-107 `red` tone name after the shipped semantic vocabulary changed it to `danger`.
- **Fix:** Updated the guard to assert the current `danger` semantic tone.
- **Files modified:** `tests/unit/playground-gateway-guard.test.ts`
- **Verification:** Focused guards passed 22/22 and full Vitest passed 1581/1581.
- **Committed in:** `a91439aa`

**3. [Rule 3 - Blocking] Normalized inconsistent GSD closeout state**

- **Found during:** Plan closeout
- **Issue:** Canonical handlers counted 5/5 summaries and wrote the 100% body bar, but retained the expired approval blocker/partial-task activity, emitted `Phase ?` decision labels, wrote a 50% frontmatter value, and malformed the roadmap row.
- **Fix:** Preserved handler-written metrics/session/plan counts, set Phase 107 to ready-for-verification, removed only resolved blockers, labeled decisions as Phase 107, aligned plan progress to 100%, and restored the roadmap row format while leaving phase status In Progress until UAT.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** STATE reports 5/5 plans and ready-for-verification with 100% plan progress; ROADMAP reports 5/5 and In Progress; all requirements remain complete.
- **Committed in:** plan closeout commit

---

**Total deviations:** 3 auto-fixed (3 blocking execution/tracking issues)
**Impact on plan:** The fixes corrected test discovery, a stale expectation, and generated tracking only. No production, protocol, package, or release scope was added.

## Issues Encountered

- The exact combined Paja browser command retains inherited `.planning/WINDOWS.md` defect 28: expected `shell-init received`, received `Required shell domains unavailable` in the upload-domain fixture. This behavior predates and lies outside Phase 107's presentation/local-recovery scope. The direct rerun proves both serial guards omitted after the aggregate failure.
- Browser and pinned package-based quality commands required execution outside the restricted sandbox for local server/browser startup and package resolution; the same repository commands then completed without a code workaround.
- An approval checkpoint paused Task 2 after staged changeset recovery. The parent checkpoint commit and untouched recovery stash were preserved, and the resumed tree contained only the staged changeset plus the phase defect note.

## Known Stubs

None. Existing `placeholder` attributes are user-facing hints for real Paja inputs, not unwired UI or mock data.

## Threat Mitigations

- Protocol guidance cites exact immutable refs and retains the existing verified-byte, CSP/prelude, sandbox, source/session, capability, and message seams.
- The release boundary is one explicit patch changeset; no direct version metadata changed.
- Recursive gates never operated inside registered nested worktrees, and the immutable phase range contains no nested path.
- Gate output used deterministic public fixtures and contains no signer material, token, passphrase, bunker URI, or secret.
- No new endpoint, auth path, file-access trust boundary, schema change, or other unplanned security surface was introduced.

## User Setup Required

None.

## Next Phase Readiness

- Phase 107 is locally release-ready with a scoped Paja patch changeset and complete evidence for every phase-owned behavior.
- Phase 108 retains ownership of feed/profile retry, reconnect, recovery copy, and state-transition work.
- The inherited upload-domain browser assertion remains open as defect 28 and must be resolved separately; it does not erase the preserved Phase 107 browser evidence.

## Self-Check: PASSED

- All task-owned documentation, test, changeset, defect-note, and summary files exist.
- All 18 implementation/task commits across Plans 107-01 through 107-05 exist with required Codex co-author trailers; both supporting Plan 107-05 execution commits also exist.
- Completion status, all seven requirement IDs, coverage records, exact authority/base refs, verification evidence, inherited-defect disposition, and nested-worktree evidence are present.

---
*Phase: 107-readable-responsive-paja-system*
*Completed: 2026-07-31*
