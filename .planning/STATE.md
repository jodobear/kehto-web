---
gsd_state_version: 1.0
milestone: fork-v1.29-paja-social-blossom
milestone_name: Paja Social Cache + Writer Blossom PoC
current_phase: 104
current_phase_name: approved-writer-integration
status: blocked
stopped_at: Phase 103 complete; awaiting explicit Writer approval for Phase 104
last_updated: "2026-07-30T22:31:32.821Z"
last_activity: 2026-07-31
last_activity_desc: Completed and verified Phase 103 on pinned PR #217 integration
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 11
  completed_plans: 10
  percent: 33
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-07-24)

**Core value:** Provide a modular, framework-agnostic runtime for hosting napplet applications.
**Current focus:** Phase 104 — approved-writer-integration (blocked pending explicit approval)

## Current Position

Phase: 104 (approved-writer-integration) — BLOCKED
Plan: 0 of TBD
Status: Phase 103 complete and verified; Phase 104 requires explicit Writer approval and dedicated branch setup
Last activity: 2026-07-31 — Completed Phase 103 on pinned PR #217 integration and posted NAP-UPLOAD feedback

Progress: [███░░░░░░░] 33%

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (fork-v1.29-paja-social-blossom)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 101 | 1 | - | - |
| 102 | TBD | - | - |
| 103 | 6 | - | - |
| 104 | TBD | - | - |
| 105 | TBD | - | - |
| 106 | TBD | - | - |
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 102 P01 | 31 min | 2 tasks | 2 files |
| Phase 102 P02 | 3 min | 2 tasks | 6 files |
| Phase 102 P03 | 6 min | 2 tasks | 3 files |
| Phase 102 P04 | 9 min | 2 tasks | 5 files |
| Phase 103 P01 | 33 min | 3 tasks | 12 files |
| Phase 103 P02 | 10 min | 2 tasks | 5 files |
| Phase 103 P03 | 16 min | 2 tasks | 7 files |
| Phase 103 P04 | 14 min | 2 tasks | 4 files |
| Phase 103 P05 | 9 min | 2 tasks | 5 files |

## Accumulated Context

### Decisions

- Planning merges only to this fork's `master`; upstream implementation PRs exclude `.planning/**`, Graphify output, generated noise, unrelated cleanup, and cross-repository work.
- Kehto implementation starts from the current upstream implementation baseline, not this planning branch.
- Paja's follows/profile cache is internal; Writer consumes only standard NAP-IDENTITY, NAP-OUTBOX, NAP-RESOURCE, and NAP-UPLOAD boundaries.
- Writer shortcut WIP on `chore/writer-source-baseline` is preserved. Phase 101 writes its integration plan; no Writer source edit is allowed until explicit user approval establishes Phase 104's dedicated integration branch.
- Recheck NAP-IDENTITY `6461e4b`, NAP-OUTBOX `4589a8f`, NAP-RESOURCE `fa6bcc6`, NAP-UPLOAD `a7cc174`, and NAP-BLOSSOM `ca1d7ba` before every NAP-touching phase; record conformity, upstream drift, or an intentional draft-spec gap.
- [Phase 102]: Phase 102 uses pinned NAP-OUTBOX 4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e plus installed @napplet/nap@0.28.0 types under upstream drift; no current-master conformance claim.
- [Phase 102]: Keep /usr/bin/chromium as the required Playwright executable; Wave 0 lists the chromium project and Plan 102-04 runs the browser-inclusive suite.
- [Phase 102]: Keep follows and kind-0 profiles in private Paja memory behind existing identity and OUTBOX services; expose no social namespace.
- [Phase 102]: Protect the existing captured-key identity contract with a deferred-signer regression and leave identity-service.ts unchanged.
- [Phase 102]: Use corepack pnpm when pnpm is absent from the executor PATH; do not alter the locked dependency tree.
- [Phase 102]: Enforce exact 64-hex account and p-tag values before lowercasing to keep malformed identifiers out of Paja follows.
- [Phase 102]: Cache additions honor original OUTBOX filters and limits while base events and incomplete/error remain authoritative.
- [Phase 102]: Phase 102 browser proof requires an explicitly connected complete NIP-07 fixture; a window.nostr stub without signEvent is not a connected signer.
- [Phase 102]: Phase 102 remains NAP-IDENTITY master-identical and uses pinned NAP-OUTBOX plus installed @napplet/nap@0.28.0 under recorded upstream drift, not current-master OUTBOX conformance.
- [Phase 102 revalidation]: Kehto PR #204 is adjacent, not superseding. Retain and adapt/shrink the private social-cache contribution against `upstream/main@297b5478`.
- [Phase 102 revalidation]: Current contribution head is `0e7b1f56`; local branch is two commits ahead of remote and retains the focused Paja/runtime/services/test/docs/changeset scope.
- [Phase 102 review]: Preserve all verified follows and incrementally hydrate every author with per-author `limit: 1`, sequential scheduling, event-loop yields, Map-backed state, and stale-generation cancellation. Cache augmentation still requires source-bound `identity:read`.
- [Phase 102 review]: Final full gates, adversarial review, and Chromium evidence must be rerun after `0e7b1f56`; prior green results are pre-latest-change evidence.
- [Phase 102 revalidation]: Current authority is NAP-IDENTITY byte-identical on `napplet/naps` master plus open NAP-OUTBOX PR #32 at `4589a8f`, implemented through `@napplet/nap@0.29.0` declarations.
- [Phase 102 revalidation]: Final post-review gates pass at `81185b45`: build, type-check, 1,605 unit tests, docs, focused tests, AI-slop no-regression, and Chromium 80 passed / 1 skipped.
- [Phase 102 final review]: Recheck source-bound `identity:read` after awaited base OUTBOX work, isolate each author warm failure, and abort superseded live contact-list reads; independent re-review found no surviving defect.
- [Phase 102 publication]: Focused 19-path contribution opened as kehto/web PR #217 at `81185b45`; planning, Graphify output, Writer work, generated artifacts, and Blossom scope remain excluded.
- [Phase 103]: Continue without waiting for PR #217 by pinning `origin/integration/v1.29-pr217-pinned@b004f203`; rebase only the Phase 103 suffix onto that pin and repin after PR #217 eventually merges.
- [Phase 103]: Full source gates pass at `feat/103-paja-blossom-rail@2bc4dc39`: build, type-check, 1,577 unit tests, docs, focused/full Playwright, dependency-direction guard, whitespace, and AI-slop 100/100.
- [Phase 103]: Keep configured-order replica diagnostics host-private and use existing `url`/`fallbackUrls`; document the per-attempt structured-outcome gap through focused PR #33 feedback rather than adding a custom field or premature normative schema.
- [Phase 103]: Phase result is pinned-draft aligned against NAP-UPLOAD `a7cc174`, NAP-RESOURCE `fa6bcc6`, NAP-BLOSSOM `ca1d7ba`, and NAP-SHELL `a7cc174`; make no current-master conformance claim.
- [Quick 260729-9sr]: Preserve the mixed planning history at `82b4238b` and use the fork-owned `docs/v1.29-planning-only` branch for planning-only publication; source work remains on focused topic branches.

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 104 is explicitly blocked pending user approval of the Writer plan and Writer remote/upstream-baseline setup.
- Current Writer shortcut WIP is unrelated, dirty, local-only, ahead of `master`, and has no remote; never absorb, discard, or mix it into the Writer integration branch.
- The real Writer/Paja browser journey is the acceptance target; a controlled fixture is only a focused PoC aid.
- PR #217 remains under maintainer review. This does not block fork development because the verified integration pin `b004f203` is the active base; repin after merge.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Content-addressed reads | `blossom:sha256` reads and low-level NAP-BLOSSOM operations | Future scope | fork-v1.29-paja-social-blossom planning |
| Social expansion | Profile editing, follows mutation, pagination, moderation, and per-author completeness | Future scope | fork-v1.29-paja-social-blossom planning |
| Upload expansion | Progress, user cancellation initiation, and multi-rail choice | Future scope | fork-v1.29-paja-social-blossom planning |

## Session Continuity

Last session: 2026-07-31
Stopped at: Phase 103 complete; Phase 104 blocked pending explicit Writer approval
Resume file: none

## Fork integration continuation

- Active fork milestone: `fork-v1.29-paja-social-blossom` (Paja Social Cache + Writer Blossom PoC).
- Pinned integration: `b004f20341d87b04bbb6e46ad293b4615108058b`; rebased Phase 103: `2bc4dc39d304832a354494eaef83dfb354131db6`; PR #217 remains pending review at `5a1cd985cbf05a31c1789aecf32a4bac4dc4d3c3`.
- Upstream convention/runtime planning remains imported at `.planning/imported/upstream-v1.29-convention-runtime/` from `3a4d71a8f8860890cdcbf8fa25a11780fbe7a55f`.
