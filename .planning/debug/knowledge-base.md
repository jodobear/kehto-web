# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## phase-102-supersession-audit — Current upstream did not supersede the Phase 102 Paja social cache
- **Date:** 2026-07-28
- **Error patterns:** upstream baseline drift, pre-PR-204 Paja composition, @napplet/nap 0.28 versus 0.29, rebase audit, port 4173 Writer preview, launcher status 143, HTTP 200
- **Root cause(s):** The preserved Phase 102 branch targeted pre-PR-204 Paja composition and 0.28 authority evidence; current upstream changed integration surfaces but did not provide the branch's validated private social-cache behavior.
- **Fix:** In isolated probe `audit/phase-102-rebase-probe`, retain and adapt/shrink the 12-path social-cache delta, drop the unrelated firewall-doc correction, adapt Paja E2E/host tests and docs to current APIs, and update authority evidence to `@napplet/nap` 0.29 while retaining the NAP-OUTBOX-draft qualification. The Chromium tracer passed; human verification accepted the operational Writer restoration.
- **Files changed:** .changeset/paja-standard-nap-social-cache.md, docs/how-tos/paja-local-authoring.md, docs/packages/paja.md, packages/paja/README.md, packages/paja/src/browser-adapter.ts, packages/paja/src/browser-host.test.ts, packages/paja/src/browser-relay-runtime.test.ts, packages/paja/src/browser-relay-runtime.ts, packages/paja/src/browser-social-cache.test.ts, packages/paja/src/browser-social-cache.ts, packages/services/src/identity-service.test.ts, tests/e2e/paja-single-window.spec.ts
- **Why not caught:** The existing build, unit, and browser gates proved the old baseline only; no mandatory supersession/rebase gate ran after upstream advanced and before PR preparation.
- **Recurrence guard:** Knowledge-base pattern `phase-102-supersession-audit` requires an exact file/symbol/wire/truth matrix and isolated rebase onto current upstream before a retained contribution is proposed. The rebased focused regression `tests/e2e/paja-single-window.spec.ts` proves the standard identity/OUTBOX browser path when the rebased contribution is resumed.
- **Prevention:**
  - **Code branch:** Treat adjacent convention, intent, or profile PRs as candidates only; compare exact files, symbols, wire operations, and verified truths before declaring supersession.
  - **Environment branch:** When CI requires exclusive port 4173, capture listener cwd/argv, stop only the authorized listener, and judge restoration by sustained listener identity and HTTP health. Keep any full-environment snapshot and its hash serialization if exact equivalence is required.
  - **AND gate:** Yes for end-to-end audit closure: the contribution required both a current-baseline rebase proof and an exclusive-port browser proof. The Writer operational restoration was accepted separately; no exact full-environment-equivalence claim is made.
---

## phase-102-supersession-verify — Full CI E2E passed with exact Writer restoration evidence
- **Date:** 2026-07-28
- **Error patterns:** CI port 4173 collision, non-reused Playwright preview, Writer restart, raw NUL environment digest, snapshot cleanup
- **Root cause(s):** CI Playwright requires exclusive non-reused previews on 4173/4174 while Writer normally owns 4173; the earlier audit lacked a reproducible environment-digest serialization, so exact restoration proof required a fresh canonical raw-NUL snapshot.
- **Fix:** No source change. Captured Writer cwd/executable/raw argv/raw NUL environment in a mode-0600 canonical JSON snapshot, stopped only its 4173 listener, ran the complete CI suite, restored from the captured inputs, verified ownership/HTTP/digests, and securely deleted the snapshot. E2E PASS was 80 passed, 1 skipped, 0 failed; Writer restoration PASS was seven HTTP-200 samples with exact argv/environment digest matches and an unchanged Paja/5173 chain.
- **Files changed:** .planning/debug/resolved/phase-102-supersession-verify.md
- **Why not caught:** No existing gate combined a full isolated browser run with preservation of a live on-host Writer process and a documented raw-NUL metadata equivalence method; the prior audit had removed its snapshot without retaining that digest procedure.
- **Recurrence guard:** Knowledge-base pattern `phase-102-supersession-verify`: before a port-4173 pause, capture a mode-0600 canonical snapshot whose ordered `/proc/<pid>/environ` bytes include terminal NUL and are SHA-256 hashed before JSON base64 transport; retain separate full-suite and post-restore proofs, then securely delete the snapshot only after digest and health verification.
- **Prevention:**
  - **Environment branch:** CI's non-reused preview servers need a vacant 4173, while the unrelated Writer service normally occupies it; identify and signal only the verified listener and preserve the Paja/5173 process chain.
  - **Config branch:** `CI=1` disables preview-server reuse; test the suite only during an explicitly bounded port-release window rather than sharing Writer's listener.
  - **Data branch:** The historical environment hash was not reproducible after snapshot deletion; use the recorded raw-NUL byte-order, terminal-NUL, pre-base64 SHA-256, and canonical JSON procedure for any future exact-input claim.
  - **AND gate:** Yes — conclusive closeout required both an exclusive-port E2E pass and independently proven exact Writer restoration, including secure deletion of the sensitive snapshot.
---

## phase-102-final-postfix-verify — Final full E2E pause/test/restore window preserved exact Writer state
- **Date:** 2026-07-28
- **Error patterns:** CI port 4173 collision, non-reused Playwright preview, raw-NUL Writer restart snapshot, exact environment digest, Paja 5173 preservation, HTTP 200
- **Root cause(s):** CI=1 Playwright requires fresh non-reused previews including exclusive 4173 while Writer normally owns that port; restoration fidelity requires its captured raw argv/environment bytes rather than inferred process inputs.
- **Fix:** No source change. Captured a mode-0600 canonical raw-NUL Writer snapshot, SIGTERM'd only its guarded 4173 PID, ran full CI Playwright, restored exact cwd/executable/argv/environment, byte-compared restoration inputs, verified health, then shredded the snapshot.
- **Files changed:** .planning/debug/resolved/phase-102-final-postfix-verify.md
- **Why not caught:** No existing CI or local gate combines a full isolated browser run with mandatory preservation and byte-exact restoration of an unrelated live Writer listener.
- **Recurrence guard:** Knowledge-base pattern `phase-102-final-postfix-verify`: use a guarded mode-0600 canonical raw-NUL snapshot, independently record full E2E and restoration outcomes, prove exact raw-byte equality plus repeated HTTP health, and delete the snapshot only after those checks pass.
- **Prevention:**
  - **Environment branch:** A live unrelated Writer service can occupy CI's exclusive preview port; identify the listener directly and signal only its identity-guarded PID.
  - **Config branch:** CI Playwright intentionally disables preview reuse; schedule the suite inside an explicit bounded pause/test/restore transaction rather than sharing the service port.
  - **Data branch:** Full restoration proof depends on preserving raw terminal-NUL argv/environment sequences and their pre-base64 SHA-256 method, not merely process arguments rendered as text.
  - **AND gate:** Yes — valid completion requires both an E2E pass with 4173 vacant and a later exact Writer restoration that leaves the Paja/5173 chain unchanged.
---

## pr-217-typecheck — Synthetic PR merge combined incompatible test-contract halves
- **Date:** 2026-07-29
- **Error patterns:** TS2741, hasCapability missing, ServiceRuntimeContext fixture, synthetic pull-request merge, type-check
- **Root cause(s):** PR #217 added required `ServiceRuntimeContext.hasCapability` while its actual base retained a three-method test fixture. GitHub pull-request CI type-checks the synthetic base-plus-head merge, where the base fixture and PR contract combined into TS2741; both the code-contract change and merge-checkout configuration were required.
- **Fix:** Fast-forward-pushed content-preserving reconciliation merge `fd2615dd` that makes base `4fd4affd` an ancestor while retaining the type-complete PR tree. GitHub regenerated a byte-identical synthetic merge and all required checks passed.
- **Files changed:** none; Git history only (`fd2615dd` content-preserving reconciliation merge)
- **Why not caught:** GitHub's synthetic-merge type-check correctly caught the failure after PR creation, but local head-only type-checking and review had no pre-push gate that constructed the actual base-plus-head integration tree.
- **Recurrence guard:** Knowledge-base pattern `pr-217-typecheck`: when a PR makes a runtime interface field required, type-check the actual GitHub synthetic merge ref or a clean no-commit merge of the exact PR base and head before accepting head-only local checks. The existing GitHub Build & Type-Check synthetic-merge job remains the authoritative integration gate.
- **Prevention:**
  - **Code branch:** Independently valid base fixtures and PR interface changes can form an invalid contract only when merged; trace the exact fixture owner and interface declaration in both parents.
  - **Config branch:** `pull_request` checkout semantics use GitHub's synthetic merge rather than the fork head; reproduce that topology when local validation must predict CI.
  - **AND gate:** Yes — the diagnostic required both the base's obsolete fixture and the PR's new required contract; ancestry reconciliation eliminated their incompatible combination without weakening either.
---

## pr-217-dependency-regress — Stale PR tree rolled back current Napplet contracts
- **Date:** 2026-07-29
- **Error patterns:** `@napplet/*` dependency downgrade, stale feature branch, stale-tree reconciliation, package contract rollback, dependency direction, 112 manifest decreases
- **Root cause(s):** AND-gate: a social-cache snapshot predating current contracts was retained during the `fd2615dd` ancestry reconciliation instead of content-rebased onto current main, and CI had no base-to-head dependency-direction gate. The result rolled 112 `@napplet/*` declarations, lock resolution, metadata, imports, and static assertions from current `0.31/0.29/0.27/0.14` to stale `0.29/0.27/0.25/0.12`.
- **Fix:** Reconstructed PR #217 from `upstream/main` `7fef1d51`, applied only the validated social-cache delta and necessary current-contract fixture adaptation, then replaced only the PR head with lease protection. Added a fail-closed semver base-to-head dependency-direction guard, CI invocation, and regression fixtures. The new head `5a1cd985` has no package-manifest, lockfile, or JSR metadata diff and was not merged.
- **Files changed:** .changeset/paja-standard-nap-social-cache.md, .github/workflows/ci.yml, docs/how-tos/paja-local-authoring.md, docs/packages/paja.md, packages/paja/README.md, packages/paja/src/browser-adapter-intent.test.ts, packages/paja/src/browser-adapter.ts, packages/paja/src/browser-host.test.ts, packages/paja/src/browser-relay-runtime.test.ts, packages/paja/src/browser-relay-runtime.ts, packages/paja/src/browser-social-cache.test.ts, packages/paja/src/browser-social-cache.ts, packages/runtime/src/intent-dispatch.test.ts, packages/runtime/src/runtime.ts, packages/runtime/src/types.ts, packages/services/src/identity-service.test.ts, packages/services/src/intent-service.test.ts, packages/services/src/manifest-intent-dispatch.test.ts, packages/services/src/outbox-service.test.ts, packages/services/src/outbox-service.ts, scripts/check-napplet-dependency-direction.mjs, tests/e2e/paja-single-window.spec.ts, tests/unit/napplet-dependency-direction-guard.test.ts
- **Why not caught:** No dependency-direction gate existed. Existing package-alignment tests validated only the branch's internally declared matrix, which the stale tree changed coherently; code review did not compare the matrix to current base.
- **Recurrence guard:** `.github/workflows/ci.yml` runs `scripts/check-napplet-dependency-direction.mjs` using PR/push base and head SHAs. `tests/unit/napplet-dependency-direction-guard.test.ts` proves unchanged/upgraded declarations pass and dependency, pnpm override, and removed-declaration regressions fail; the suite and live PR CI passed.
- **Prevention:** Data/history branch: rebase retained feature deltas onto current upstream. Code/integration branch: resolve content against the current base rather than retaining an obsolete first-parent tree. Config/verification branch: fail CI on base-to-head `@napplet/*` decreases. AND gate: the stale snapshot and stale-tree reconciliation created the rollback; missing CI comparison allowed review.
---
