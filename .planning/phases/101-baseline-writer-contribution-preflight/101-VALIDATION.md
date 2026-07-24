---
phase: 101
slug: baseline-writer-contribution-preflight
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-24
---

# Phase 101 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Read-only Git/GitHub evidence commands plus markdown static checks |
| **Config file** | none — Phase 101 creates planning/audit artifacts only |
| **Quick run command** | `git diff --check -- .planning/phases/101-baseline-writer-contribution-preflight` |
| **Full suite command** | `git diff --check -- .planning/phases/101-baseline-writer-contribution-preflight && test -f .planning/phases/101-baseline-writer-contribution-preflight/101-BASELINE-AUDIT.md && test -f .planning/phases/101-baseline-writer-contribution-preflight/101-WRITER-CONTRIBUTION-PLAN.md` |
| **Estimated runtime** | ~5 seconds, excluding read-only remote evidence refresh |

---

## Sampling Rate

- **After every task commit:** Run `git diff --check -- .planning/phases/101-baseline-writer-contribution-preflight`
- **After every plan wave:** Refresh Kehto upstream and Writer read-only evidence, then compare it with `101-BASELINE-AUDIT.md`
- **Before `/gsd-verify-work`:** Both required artifacts must exist, static markers must pass, and Writer mutation evidence must remain absent
- **Max feedback latency:** 30 seconds for local checks; remote SHA refresh may take longer

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 101-01-01 | 01 | 1 | PRE-01 | T-101-01 / T-101-02 | Dirty Writer WIP remains outside milestone work; canonical refs are verified before use | audit | `test -f .planning/phases/101-baseline-writer-contribution-preflight/101-BASELINE-AUDIT.md && git diff --check -- .planning/phases/101-baseline-writer-contribution-preflight/101-BASELINE-AUDIT.md` | ❌ W0 | ⬜ pending |
| 101-01-02 | 01 | 1 | PRE-02 | T-101-03 / T-101-04 | Writer plan keeps network/signing authority in Paja and visibly stops before source mutation | static | `rg -n 'BLOCKED|approve Writer implementation|feat/paja-social-blossom-integration|identity.getFollows|outbox.query|rail: "blossom"' .planning/phases/101-baseline-writer-contribution-preflight/101-WRITER-CONTRIBUTION-PLAN.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `101-BASELINE-AUDIT.md` — timestamped Kehto upstream range plus mutable Writer branch/status/history/remote inventory for PRE-01
- [ ] `101-WRITER-CONTRIBUTION-PLAN.md` — post-approval-only setup template, dependency slot, standard-NAP matrix, scoped source/tests, gates, and PR exclusions for PRE-02

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Writer working tree was not mutated by Phase 101 | PRE-01, PRE-02 | Concurrent external work makes byte-for-byte equality unstable; verification must distinguish outside changes from commands executed by this phase | Review execution transcript and audit timestamps; confirm Phase 101 used only read-only Writer commands and created no Writer remote/ref/worktree/index/source changes |
| Canonical Writer upstream is resolved before integration setup | PRE-02 | No canonical remote URL/default branch exists in current evidence | At approval checkpoint, supply/verify URL, default branch, and SHA; compare against local provisional `master` before creating clean worktree |
| User explicitly approves Writer implementation | PRE-02 | Human authorization is intentionally non-automatable | Review required evidence package and provide `approve Writer implementation` or equivalent explicit approval; no automated chain may substitute |

---

## Validation Sign-Off

- [ ] All tasks have automated verification or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s for local checks
- [ ] `nyquist_compliant: true` set in frontmatter after validation

**Approval:** pending
