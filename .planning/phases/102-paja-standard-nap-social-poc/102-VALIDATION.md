---
phase: 102
slug: paja-standard-nap-social-poc
status: draft
nyquist_compliant: true
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

- **After every task commit:** Run only the focused Phase 102 Vitest files and package-level build/type check named by that task.
- **After every plan wave:** Run the affected Paja type check and focused Phase 102 test set; do not run Playwright or repository-wide gates before Plan 04.
- **Plan 04 final gate:** Run `pnpm build`, `pnpm type-check`, `pnpm test:unit`, `pnpm test:e2e`, `pnpm docs:check`, and the AI-slop gate after all implementation and documentation tasks are complete.
- **Max feedback latency:** 60 seconds for focused unit checks.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 102-01-01 | 01 | 0 | PAJA-01, PAJA-02, PAJA-03 | T-102-01, T-102-02 | Current-master/pinned authority and installed type evidence are recorded before source changes | source/spec gate | `test -s .planning/phases/102-paja-standard-nap-social-poc/102-IMPLEMENTATION-NOTE.md && rg -n 'Executable checks|MASTER_SHA|IdentityGetFollows|OutboxQuery|OutboxResult' .planning/phases/102-paja-standard-nap-social-poc/102-IMPLEMENTATION-NOTE.md` | ❌ implementation note W0 | ⬜ pending |
| 102-01-02 | 01 | 0 | PAJA-01, PAJA-02, PAJA-03 | T-102-03 | Browser proof has the configured executable or execution stops explicitly | environment | `test -x /usr/bin/chromium && /usr/bin/chromium --version` | ❌ W0 | ⬜ pending |
| 102-02-01 | 02 | 1 | PAJA-01, PAJA-02, PAJA-03 | T-102-05 through T-102-09 | Standard tracer warms a private social cache and builds Paja; its browser fixture also permits the target CORS probe | unit/build | `./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts && pnpm --filter @kehto/paja build` | ❌ social-cache test | ⬜ pending |
| 102-02-02 | 02 | 1 | PAJA-01 | T-102-05 | The standard follows provider receives the request-start identity key | unit | `./node_modules/.bin/vitest run packages/services/src/identity-service.test.ts packages/paja/src/browser-social-cache.test.ts` | ✅ identity test / ❌ social-cache test | ⬜ pending |
| 102-03-01 | 03 | 2 | PAJA-01, PAJA-02 | T-102-10, T-102-11, T-102-14 | Contact selection, account isolation, and refresh generations are deterministic | unit | `./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts packages/services/src/identity-service.test.ts` | ❌ social-cache test | ⬜ pending |
| 102-03-02 | 03 | 2 | PAJA-03 | T-102-12, T-102-13 | Cache merge preserves base degradation and the host guard retains standard plus target-CORS boot wiring | unit/static | `./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts packages/paja/src/browser-host.test.ts packages/services/src/outbox-service.test.ts && pnpm --filter @kehto/paja type-check` | ✅ host/outbox tests / ❌ social-cache test | ⬜ pending |
| 102-04-01 | 04 | 3 | PAJA-01, PAJA-02, PAJA-03 | T-102-15, T-102-16 | Docs retain target-CORS guidance, repair the Paja package row to 0.8.2, and add one feature changeset | docs | `pnpm docs:check` | ✅ docs surfaces / ❌ changeset | ⬜ pending |
| 102-04-02 | 04 | 3 | PAJA-01, PAJA-02, PAJA-03 | T-102-17, T-102-18 | Complete Paja implementation passes the required browser-inclusive repository gate | final | `pnpm build && pnpm type-check && pnpm test:unit && pnpm test:e2e && pnpm docs:check && npx --no-install aislop scan -d && git diff --check` | ❌ execution | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Record `.planning/phases/102-paja-standard-nap-social-poc/102-IMPLEMENTATION-NOTE.md` with executable current-master SHA, identity-byte comparison, OUTBOX-path absence, and installed type-contract evidence.
- [ ] Provision executable `/usr/bin/chromium`, or preserve the browser gate as an explicit unresolved environment blocker. No source edit and no silent e2e skip occur after a failed assertion.
- [ ] After Plan 01 passes, Plan 02 creates `packages/paja/src/browser-social-cache.test.ts` for account capture, verified contact selection, kind-0 warm, cache/base merge, duplicate IDs, and degraded base result semantics.
- [ ] Plan 02 adds the deferred-provider regression in `packages/services/src/identity-service.test.ts`; Plan 03 adds the Paja host composition guard for standard services and target-CORS boot wiring.
- [ ] Plan 04 alone runs the completed browser fixture and the full repository gates.

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
