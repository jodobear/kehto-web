---
phase: 106
slug: active-surface-conformance-and-release
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-27
---

# Phase 106 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 and Playwright 1.54.0 |
| **Config file** | `vitest.config.ts` and `playwright.config.ts` |
| **Quick run command** | `pnpm exec vitest run tests/unit/nip5d-conformance-guard.test.ts tests/unit/sdk-migration-guard.test.ts tests/unit/playground-gateway-guard.test.ts tests/unit/napplet-package-alignment.test.ts tests/unit/published-napplet-contract.test.ts packages/shell/src/napplet-namespace.test.ts packages/shell/src/shell-supports-conformance.test.ts tests/unit/identity-theme-conformance-guard.test.ts tests/unit/nap-inc-conformance.test.ts` |
| **Full suite command** | `pnpm test:unit && pnpm test:e2e` |
| **Estimated runtime** | ~150 seconds |

---

## Sampling Rate

- **After every task commit:** Run the focused nine-file Vitest command above plus `git diff --check`
- **After every plan wave:** Run `pnpm test:unit` plus the Playwright files affected by that wave
- **Before `$gsd-verify-work`:** `pnpm build`, `pnpm type-check`, `pnpm test:unit`, `pnpm test:e2e`, `pnpm docs:check`, the repository-pinned AI-slop scan, and `git diff --check` must be green
- **Max feedback latency:** 15 seconds for focused Vitest sampling

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 106-01-01 | 01 | 1 | VERIFY-06 | T-106-01 | Mutable upstream and registry authorities cannot drift without a recorded semantic verdict. | external integration | `node scripts/verify-napplet-authorities.mjs --check` | ❌ W0 | ⬜ pending |
| 106-01-02 | 01 | 1 | BASE-03, VERIFY-02 | T-106-02 | Live sources reject obsolete shapes while classified historical evidence remains untouched. | unit/static | `pnpm exec vitest run tests/unit/sdk-migration-guard.test.ts tests/unit/nip5d-conformance-guard.test.ts tests/unit/playground-gateway-guard.test.ts` | ✅ | ⬜ pending |
| 106-01-03 | 01 | 1 | VERIFY-01 | T-106-03 | Negative wire shapes, source/session isolation, sender spoofing, and query drift fail closed. | unit/integration | focused nine-file Vitest command from Test Infrastructure | ✅ | ⬜ pending |
| 106-02-01 | 02 | 2 | VERIFY-03 | T-106-04 | Real Paja and playground paths preserve trusted startup, exact routing, resource mediation, and atomic theme delivery. | E2E | `pnpm test:e2e -- tests/e2e/napplet-auth.spec.ts tests/e2e/inc-roundtrip.spec.ts tests/e2e/nap-inc-playground.spec.ts tests/e2e/identity-flow.spec.ts tests/e2e/theme-broadcast.spec.ts tests/e2e/playground-profile-intent.spec.ts tests/e2e/profile-open.spec.ts` | ✅ | ⬜ pending |
| 106-02-02 | 02 | 2 | VERIFY-03, VERIFY-04 | — | Phase 105 visual risks receive an explicit fix-or-defer disposition backed by desktop/mobile evidence. | browser/manual review | `test -f .planning/phases/106-active-surface-conformance-and-release/106-RELEASE-CHECKLIST.md` | ❌ W0 | ⬜ pending |
| 106-03-01 | 03 | 3 | VERIFY-04, VERIFY-05 | T-106-05 | Only a fully gated branch with complete shipped-output changesets can reach PR readiness. | release gate | `pnpm build && pnpm type-check && pnpm test:unit && pnpm test:e2e && pnpm docs:check && npx --yes aislop@0.12.0 scan -d && git diff --check && pnpm changeset status` | ✅ | ⬜ pending |
| 106-03-02 | 03 | 3 | VERIFY-05 | T-106-05 | PR and eventual release evidence refer to the exact pushed SHA; release tagging remains outside this branch task. | external integration/manual | `gh pr checks 204 --watch` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/verify-napplet-authorities.mjs` — reproducible GitHub/npm/JSR authority and published-package drift report for VERIFY-06
- [ ] `.planning/phases/106-active-surface-conformance-and-release/106-RELEASE-CHECKLIST.md` — exact command results, allowed E2E skip, changeset status, pushed SHA/CI evidence, and Phase 105 UI-risk disposition

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Semantic meaning of upstream NAP text matches Kehto behavior | VERIFY-06 | A text diff can identify changed clauses but cannot responsibly infer protocol equivalence. | Record each PR’s immutable ref and state, compare the changed NAP sections, and classify Kehto as conformant, repaired, deferred spec gap, or blocked. |
| Phase 105 UI warning disposition | VERIFY-03, VERIFY-04 | Whether the documented visual debt blocks this protocol release is a product-scope decision. | Link `105-UI-REVIEW.md`; either close release-blocking findings or record an owned follow-up and explicit non-blocking rationale. |
| Exact pushed commit and GitHub checks | VERIFY-05 | PR mergeability and CI status exist outside the local repository. | Push the branch, inspect PR #204 at the pushed SHA, wait for required checks, and record the URL/status in the release checklist. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
