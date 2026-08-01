---
phase: 107
slug: readable-responsive-paja-system
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-31
---

# Phase 107 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 plus Playwright 1.59.1 with system Chromium |
| **Config file** | `vitest.config.ts`; `playwright.config.ts` |
| **Quick run command** | `corepack pnpm exec vitest run packages/paja/src/host-page.test.ts packages/paja/src/browser-target-surface.test.ts packages/paja/src/browser-runtime-tabs.test.ts packages/paja/src/browser-host.test.ts tests/unit/identity-theme-conformance-guard.test.ts tests/unit/nip5d-conformance-guard.test.ts tests/unit/select-e2e-tests.test.ts tests/unit/phase-107-visual-system.test.ts` |
| **Full suite command** | `corepack pnpm build && corepack pnpm type-check && corepack pnpm test:unit` followed by `corepack pnpm test:e2e -- tests/e2e/paja-single-window.spec.ts tests/e2e/paja-runtime-pointer.spec.ts` |
| **Estimated runtime** | Quick Vitest under 10 seconds; focused browser plus full gates under 10 minutes |

## Sampling Rate

- **After every task commit:** Run the quick Vitest command, narrowed only when the task cannot affect the omitted files.
- **After every browser-visible task:** Also run the immediately affected Paja Playwright spec.
- **After every plan wave:** Run both focused Paja Playwright specs plus build, type-check, and unit tests.
- **Before `$gsd-verify-work`:** Run all required repository gates, including conditional docs, pinned AI-slop, conformance, and `git diff --check`.
- **Max feedback latency:** 10 seconds for unit/static feedback; 10 minutes for the full phase gate.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 107-W0-01 | 107-03 T1, 107-04 T1 | 0 | VIS-01, VIS-02, VIS-03 | — | Component CSS consumes bounded semantic declarations; no raw inline status colors | unit/static | `corepack pnpm exec vitest run tests/unit/phase-107-visual-system.test.ts` | ❌ W0 | ⬜ pending |
| 107-W0-02 | 107-01 T1/T2, 107-02 T1 | 0 | PAJA-03, PAJA-04 | T-107-01, T-107-02, T-107-06 | Diagnostics remain literal host text; retries cannot create stale or duplicate sessions | unit | `corepack pnpm exec vitest run packages/paja/src/browser-target-surface.test.ts packages/paja/src/browser-host.test.ts packages/paja/src/browser-runtime-tabs.test.ts tests/unit/nip5d-conformance-guard.test.ts` | ❌ W0 + ✅ extend | ⬜ pending |
| 107-W0-03 | 107-01 T1, 107-02 T1, 107-03 T2 | 0 | PAJA-01, PAJA-02, PAJA-03 | T-107-01, T-107-06 | Real loader paths preserve sandbox and verified content while failure UI stays host-owned | e2e | `corepack pnpm test:e2e -- tests/e2e/paja-single-window.spec.ts tests/e2e/paja-runtime-pointer.spec.ts` | ✅ extend | ⬜ pending |
| 107-W0-04 | 107-02 T1 | 0 | PROOF support | — | Paja source changes cannot omit either real Paja browser path from scoped CI | unit/static | `corepack pnpm exec vitest run tests/unit/select-e2e-tests.test.ts` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

- [ ] `tests/unit/phase-107-visual-system.test.ts` — declaration-aware palette, type, and spacing guards for Paja, feed, and profile.
- [ ] `tests/e2e/paja-single-window.spec.ts` — failure, repeat-failure, recovery, long-target, focus, and viewport fixtures on the real external loader.
- [ ] `tests/e2e/paja-runtime-pointer.spec.ts` — failure and recovery while retaining verified pointer, byte, CSP, sandbox, and source-binding paths.
- [ ] `scripts/select-e2e-tests.mjs` and `tests/unit/select-e2e-tests.test.ts` — select both Paja specs for Paja source changes.
- [ ] Focused controller tests — pre-tab pointer failure, retry concurrency, stale settlement, stable surface nodes, and focus outcomes.

## Manual-Only Verifications

All phase behaviors have automated source, unit, or Chromium verification. Stable screenshots or Playwright attachments provide human-inspectable evidence without replacing assertions.

## Validation Sign-Off

- [x] All planned behaviors have an automated command or Wave 0 dependency.
- [x] Sampling continuity: no three consecutive tasks may omit automated verification.
- [x] Wave 0 covers every currently missing test reference.
- [x] No watch-mode flags.
- [x] Fast feedback target is under 10 seconds; full-gate target is under 10 minutes.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-07-31 for planning; task IDs must be reconciled when PLAN.md files are finalized.
