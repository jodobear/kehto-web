---
phase: 103
slug: paja-blossom-rail-poc
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-29
---

# Phase 103 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2; Playwright 1.54.0 |
| **Config file** | `vitest.config.ts`; `playwright.config.ts` |
| **Quick run command** | `corepack pnpm exec vitest run packages/services/src/http-uploader.test.ts packages/services/src/upload-service.test.ts packages/services/src/resource-service.test.ts packages/runtime/src/upload-dispatch.test.ts packages/paja/src/blossom-verifier.test.ts packages/paja/src/browser-upload.test.ts packages/paja/src/browser-host.test.ts packages/shell/src/shell-init.test.ts packages/shell/src/napplet-namespace.test.ts && git diff --check` |
| **Full suite command** | `corepack pnpm build && corepack pnpm type-check && corepack pnpm test:unit && corepack pnpm docs:check && CI=1 corepack pnpm exec playwright test` |
| **Estimated runtime** | ~60 seconds for focused Vitest run; measure during Wave 0 |

---

## Sampling Rate

- **After every task commit:** Run focused Vitest command above, narrowed only when changed files cannot affect omitted upload/resource/Paja surfaces
- **After every plan wave:** Run full suite command above; Playwright may wait until browser fixture exists, but must run after every later Paja wiring wave
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds for focused unit feedback

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 103-01-01 | 01 | 1 | UPLOAD-02, POC-02 | T-103-01 / T-103-02 / T-103-03 / T-103-04 | Host-composed verifier, BUD-11 transport, exact resource grant, and Paja callback pass focused type and regression coverage before browser work | unit/integration | `corepack pnpm --filter @kehto/paja type-check && corepack pnpm exec vitest run packages/paja/src/blossom-verifier.test.ts packages/services/src/resource-service.test.ts packages/services/src/http-uploader.test.ts packages/paja/src/browser-upload.test.ts` | ❌ | ⬜ pending |
| 103-01-02 | 01 | 1 | UPLOAD-02, POC-02 | T-103-01 / T-103-02 / T-103-03 / T-103-04 | Automated recovery gate requires the focused suite, clean diff and status, plus recoverable test and feature commit hashes before E2E edits | recovery gate | `set -e; corepack pnpm --filter @kehto/paja type-check; corepack pnpm exec vitest run packages/paja/src/blossom-verifier.test.ts packages/services/src/resource-service.test.ts packages/services/src/http-uploader.test.ts packages/paja/src/browser-upload.test.ts; git diff --check; git status --short; test -z "$(git status --short)"; test "$(git log -2 --format='%s' | grep -Ec '^(test\(103-01\): specify verified Blob foundation|feat\(103-01\): add verified Blossom foundation)$')" -eq 2; git log -2 --format='%H %s'` | — | ⬜ pending |
| 103-01-03 | 01 | 1 | UPLOAD-02, POC-02 | T-103-01 / T-103-02 / T-103-03 / T-103-04 | One configured server crosses real BUD-11 PUT, server-owned stored-byte proof, exact resource grant, and opaque-iframe preview after the recovery gate | e2e | `CI=1 corepack pnpm exec playwright test tests/e2e/paja-single-window.spec.ts` | ✅ | ⬜ pending |
| 103-02-01 | 02 | 2 | UPLOAD-02 | T-103-05 | Kind-24242 upload authorization is server-scoped, 300-second, hash-bound, Base64url-encoded, and carries required BUD-11 headers | unit | `corepack pnpm exec vitest run packages/services/src/http-uploader.test.ts` | ✅ | ⬜ pending |
| 103-02-02 | 02 | 2 | UPLOAD-02, POC-02 | T-103-01 / T-103-06 | Upload emits uploading plus one terminal state, suppresses teardown late sends, and ACL denies upload/resource before handlers | unit | `corepack pnpm exec vitest run packages/services/src/upload-service.test.ts packages/runtime/src/upload-dispatch.test.ts` | ✅ | ⬜ pending |
| 103-03-01 | 03 | 3 | UPLOAD-02 | T-103-01 / T-103-05 / T-103-06 | Paja uses configured-only ordered replicas, one transient retry, safe policy defaults, tuple consent, and identity/teardown aborts | unit | `corepack pnpm exec vitest run packages/paja/src/browser-upload.test.ts packages/services/src/http-uploader.test.ts` | ✅ | ⬜ pending |
| 103-03-02 | 03 | 3 | UPLOAD-02, POC-02 | T-103-01 / T-103-06 | Replica-aware consent is complete and retained-copy cancellation truth stays in host diagnostics | unit | `corepack pnpm exec vitest run packages/paja/src/browser-host.test.ts packages/paja/src/browser-upload.test.ts` | ✅ | ⬜ pending |
| 103-04-01 | 04 | 4 | UPLOAD-02, POC-02 | T-103-01 / T-103-02 / T-103-04 / T-103-06 | Opaque iframe proves replica ordering, proof failures, resource preview bytes, consent denial, cancellation, and authority absence | e2e | `CI=1 corepack pnpm exec playwright test tests/e2e/paja-single-window.spec.ts` | ✅ | ⬜ pending |
| 103-04-02 | 04 | 4 | POC-02 | T-103-01 | Shell keeps upload support distinct from readiness and injects only standard upload/resource methods | unit | `corepack pnpm exec vitest run packages/shell/src/shell-init.test.ts packages/shell/src/napplet-namespace.test.ts packages/paja/src/browser-upload.test.ts` | ✅ | ⬜ pending |
| 103-05-01 | 05 | 4 | UPLOAD-02, POC-02 | T-103-08 | Consumer/package/how-to docs accurately state pinned-draft configured replica and resource behavior | static | `corepack pnpm docs:check && git diff --check` | ✅ | ⬜ pending |
| 103-05-02 | 05 | 4 | UPLOAD-02, POC-02 | T-103-SC | Paja and services shipped outputs have focused changesets and documented public types | static/build | `corepack pnpm docs:check && corepack pnpm --filter @kehto/paja build && corepack pnpm --filter @kehto/services build` | ✅ | ⬜ pending |
| 103-06-01 | 06 | 5 | UPLOAD-02, POC-02 | T-103-08 / T-103-09 | Focused changed-path Vitest/static smoke runs before full gates, 100/100 AI-slop, scope audit, exact refs, API coverage, changesets, focused browser proof, and full browser proof | full | `corepack pnpm exec vitest run packages/services/src/http-uploader.test.ts packages/services/src/upload-service.test.ts packages/services/src/resource-service.test.ts packages/runtime/src/upload-dispatch.test.ts packages/paja/src/blossom-verifier.test.ts packages/paja/src/browser-upload.test.ts packages/paja/src/browser-host.test.ts packages/shell/src/shell-init.test.ts packages/shell/src/napplet-namespace.test.ts && git diff --check && corepack pnpm build && corepack pnpm type-check && corepack pnpm test:unit && corepack pnpm docs:check && CI=1 corepack pnpm exec playwright test tests/e2e/paja-single-window.spec.ts && CI=1 corepack pnpm exec playwright test && npx --no-install aislop scan -d && git diff --check` | ✅ | ⬜ pending |
| 103-06-02 | 06 | 5 | UPLOAD-02 | T-103-10 | User selects a comment or draft PR before a public per-replica schema proposal | decision | `gh pr view 33 --repo napplet/naps --json number,state,headRefName,headRefOid,url,comments` | ✅ | ⬜ pending |
| 103-06-03 | 06 | 5 | UPLOAD-02 | T-103-10 | Selected PR #33 feedback names the current wire gap without asserting proposed fields | external | `gh pr view 33 --repo napplet/naps --json url,comments || gh pr list --repo napplet/naps --state open --search "NAP-UPLOAD replica outcomes" --json url,title` | ✅ | ⬜ pending |

*Task IDs match the finalized Phase 103 PLAN.md files. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Task `103-01-01` creates `packages/paja/src/blossom-verifier.test.ts`, extends `packages/services/src/resource-service.test.ts` with exact-window URL grants, teardown revocation, and ignored-late-response coverage, and proves forged optional descriptor NIP-94 metadata cannot reach `UploadResult` in `packages/services/src/http-uploader.test.ts`.
- [ ] Task `103-01-02` records green Paja type/Vitest output, a clean `git diff --check`, empty `git status --short`, and the Task 1 test/feature commit hashes before browser integration is allowed.
- [ ] Task `103-01-03` extends the Blossom E2E fixture with stored GET bytes, request-header capture, and the production-safe public-HTTPS/test-only-loopback verifier seam.
- [ ] Task `103-04-01` adds direct browser `resource.bytes` preview assertions, scripted per-server responses, ordered replica outcomes, and partial-copy cancellation coverage.
- [ ] Task `103-02-02` adds denied `resource:fetch` ACL coverage beside existing denied `upload:write` coverage.

---

## Manual-Only Verifications

All shipped Phase 103 behavior has automated verification. Upstream NAP-UPLOAD feedback still needs human review before posting, but its existence and exact pinned-spec rationale can be checked from the plan artifact and resulting GitHub URL.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
