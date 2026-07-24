---
phase: 102
slug: paja-standard-nap-social-poc
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-24
---

# Phase 102 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 + Playwright 1.59.1 |
| **Config file** | `vitest.config.ts`; `playwright.config.ts` |
| **Quick run command** | `./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts packages/services/src/identity-service.test.ts packages/services/src/outbox-service.test.ts` |
| **Full suite command** | `pnpm build && pnpm type-check && pnpm test:unit && pnpm test:e2e` |
| **Estimated runtime** | Focused unit: <60s; full suite: environment-dependent |

---

## Sampling Rate

- **After every task commit:** Run focused Phase 102 Vitest files.
- **After every plan wave:** Run `pnpm type-check && pnpm test:unit`.
- **Before `/gsd-verify-work`:** `pnpm build`, `pnpm type-check`, `pnpm test:unit`, relevant `pnpm test:e2e`, docs gate when docs change, AI-slop gate.
- **Max feedback latency:** 60 seconds for focused unit checks.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 102-01-01 | 01 | 0 | PAJA-01, PAJA-02, PAJA-03 | T-102-01 | Governing NAP refs and upstream OUTBOX drift recorded before code changes | source/spec gate | `grep -R "4589a8f\|6461e4b" .planning/phases/102-paja-standard-nap-social-poc packages/paja -n` | ✅ research / ❌ implementation note W0 | ⬜ pending |
| 102-01-02 | 01 | 0 | PAJA-01, PAJA-02, PAJA-03 | — | Browser proof can run or blocker remains explicit | environment | `test -x /usr/bin/chromium && pnpm test:e2e` | ❌ W0 | ⬜ pending |
| 102-02-01 | 02 | 1 | PAJA-01 | T-102-02 | Follow request remains bound to captured account | unit | `./node_modules/.bin/vitest run packages/services/src/identity-service.test.ts packages/paja/src/browser-social-cache.test.ts` | ❌ social-cache test W0 | ⬜ pending |
| 102-02-02 | 02 | 1 | PAJA-02 | T-102-03 | Verified kind-3 selection and account-scoped kind-0 warm reject stale writes | unit | `./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts` | ❌ W0 | ⬜ pending |
| 102-03-01 | 03 | 2 | PAJA-03 | T-102-04 | Cache merge preserves filters, ID dedupe, `incomplete`, and `error` | unit/integration | `./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts packages/services/src/outbox-service.test.ts` | ❌ social-cache test W0 | ⬜ pending |
| 102-03-02 | 03 | 2 | PAJA-01, PAJA-02, PAJA-03 | T-102-05 | Paja exposes only standard identity/outbox services; Writer untouched | static/browser | `git diff --name-only upstream/main...HEAD | grep -E 'writer' && exit 1 || true; pnpm test:e2e` | ✅ static guard / ❌ browser env W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/paja/src/browser-social-cache.test.ts` — account capture, verified contact selection, kind-0 warm, account isolation, cache/base merge, duplicate IDs, degraded base result semantics.
- [ ] Paja adapter composition coverage — prove only standard `identity` and `outbox` services consume cache.
- [ ] `packages/services/src/identity-service.test.ts` deferred-provider regression — captured request pubkey reaches `getFollows` despite later signer changes.
- [ ] Record explicit authority: NAP-IDENTITY pinned `6461e4b37c29dc09a20dff35d9515889c4433874` is master-conformant; NAP-OUTBOX pinned `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e` plus `@napplet/nap@0.28.0` types govern PoC under documented upstream drift.
- [ ] Provision executable `/usr/bin/chromium`, or preserve browser gate as explicit unresolved environment blocker. No silent e2e skip.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real Paja relay-backed identity/follows and followed kind-0 smoke | PAJA-01, PAJA-02, PAJA-03 | Requires real signer identity and relay state | After Phases 102 and 103 pass automated gates, launch Paja with authorized test napplet; call `identity.getPublicKey`, `identity.getFollows`, then `outbox.query` for followed authors kind 0; verify standard envelopes and useful relay-backed results. |
| Current NAP-OUTBOX authority | PAJA-03 | Current `napplet/naps` master lacks document | Confirm no replacement upstream spec supersedes pinned `4589a8f`; record result in PR/final report. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all missing references.
- [ ] No watch-mode flags.
- [ ] Focused feedback latency <60s.
- [ ] Browser gate either runs green or blocks completion explicitly.
- [ ] No Writer files changed.
- [ ] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
