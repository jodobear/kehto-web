---
status: resolved
trigger: "PR #217 went in the wrong direction by changing packages back to older versions. Read all GitHub comments, identify what we did wrong, why we regressed, whether we misunderstood Napplet philosophy, required fixes, and prevention."
created: 2026-07-29
updated: 2026-07-29T17:00:48Z
---

# Debug Session: PR #217 dependency-direction regression

## Symptoms

- Expected: PR #217 preserves or advances current upstream `@napplet/*` package contracts while adding focused Paja social-cache behavior.
- Actual: Maintainer feedback says PR #217 changes packages back to older versions, opposite intended direction.
- Error/messages: GitHub review comments and user message must be treated as claims to verify against current PR diff, upstream main, package manifests, lockfile, NAP specs, and Napplet package philosophy.
- Timeline: Feedback received after PR #217 head `fd2615dda1d08102a9fad8a70f38fdf7daba70e4` reached green CI on 2026-07-29.
- Reproduction: Inspect every PR review/comment and compare `kehto/web:main...jodobear:feat/paja-standard-nap-social-cache-current` across package manifests, lockfile, source imports/types, generated metadata, and docs.

## Current Focus

- hypothesis: RESOLVED. The reconstructed PR #217 preserves the focused social-cache delta on current contracts and CI now rejects base-to-head `@napplet/*` dependency regressions.
- test: Original stale-head comparison reproduced 112 decreases and failed the guard; reconstructed head has no package manifest, lockfile, or JSR metadata diff and passes local/live checks.
- expecting: The planning-only archive diff contains exactly this resolved session and its knowledge-base entry; PR #217 stays open for maintainer re-review and is not merged.
- next_action: Validate the two-file planning-only diff, stage those exact paths, commit and push the archive record, then post the requested factual PR comment.

## Evidence

- timestamp: 2026-07-29T11:10:00Z
  observation: Existing code graph links runtime, services, Paja manifests, package.json dependency sections, intent services, and Runtime types, but broad graph traversal cannot establish version direction without exact Git diff and comments.
  source: graphify-out/graph.json query

- timestamp: 2026-07-29T12:00:00Z
  observation: A read-only Graphify query found the current graph contains Paja package metadata, root dependency/override sections, NIP artifact-cache and shell manifest-cache code, and an internal workspace-range guard, but its broad traversal has no PR-217 ref/comment facts; exact GitHub and Git evidence remains required.
  source: /workspace/projects/kehto/web/graphify-out/graph.json via `graphify query`

- timestamp: 2026-07-29T12:00:00Z
  observation: MemPalace is unavailable, so durable knowledge-base fallback was used. `phase-102-supersession-audit` is a strong candidate: it requires an isolated rebase onto current upstream plus an exact file/symbol/wire/truth matrix before retaining a Paja social-cache delta. `pr-217-typecheck` is a related candidate: commit `fd2615dd` reconciled PR ancestry without changing content after a synthetic-merge contract failure.
  source: /workspace/projects/kehto/v129-planning-only/.planning/debug/knowledge-base.md

- timestamp: 2026-07-29T12:00:00Z
  observation: Neither audit worktree has project-local `.claude/skills` or `.agents/skills` directories, and no configured `gsd-debugger` agent skills were returned. No additional project-skill rule applies to this read-only diagnosis.
  source: directory inventory and `gsd-tools query agent-skills gsd-debugger`

- timestamp: 2026-07-29T12:15:00Z
  observation: PR #217 is open against `main` at base `4fd4affd`; its current head is reconciliation merge `fd2615dd`. All listed CI checks passed on that head, but the subsequent review requests changes because it downgrades packages. The only unresolved review thread is a direct regression annotation on `apps/playground/napplets/ble-demo/package.json`, whose removed base line is `"@napplet/nap": "0.31.0"`.
  source: GitHub PR #217 metadata, reviews, comments, and review-thread API

- timestamp: 2026-07-29T12:15:00Z
  observation: The reviewer explicitly reports that the PR changes all packages to older versions that are no longer aligned with upstream specification. The earlier approval covers the runtime/Paja behavior; it does not validate the final dependency movement. There are no issue comments and no other unresolved technical threads.
  source: GitHub review `PRR_kwDOR8P3P88AAAABHrTtDw` and PR comment API

- timestamp: 2026-07-29T12:15:00Z
  observation: The PR changes package manifests across playground napplets, fixtures, Kehto packages, lockfile, generated JSR metadata, docs, and source imports; therefore the regression cannot be classified as a single incidental demo-only pin until the exact base-to-head diff and lock resolution are inspected.
  source: GitHub changed-file inventory for PR #217

- timestamp: 2026-07-29T12:15:00Z
  observation: Nine worktrees are present, including the retained social-cache contribution, rebase probe, detached upstream audit, and planning-only worktree. The audit performed no checkout, fetch, branch/ref write, PR action, or source modification.
  source: `git worktree list --porcelain` from /workspace/projects/kehto/web

- timestamp: 2026-07-29T12:30:00Z
  observation: Exact base-to-head manifest comparison found 112 downgraded `@napplet/*` dependency entries. The full set moves `core` and `nap` 0.31.0/range `>=0.31.0 <0.32.0` to 0.29.0/`>=0.29.0 <0.30.0`; `shim` 0.29.0 to 0.27.0; `sdk` 0.27.0 to 0.25.0; and `vite-plugin` 0.14.0 to 0.12.0. The change spans 16 playground napplets, six fixture napplets, the playground host, and seven Kehto packages.
  source: read-only parsed `git diff 4fd4affd fd2615dd -- '**/package.json'`

- timestamp: 2026-07-29T12:30:00Z
  observation: The dependency downgrade is not metadata-only: the same diff lowers published `@kehto/*` versions, generated JSR ranges, lockfile package resolution, source/import paths, and static version-contract tests. Examples include `incOn`/`IncEvent` being replaced with older `intentOnDelivery`/`IntentDelivery` usage and package paths/types being rewritten from 0.31/0.14 to 0.29/0.12.
  source: read-only scoped Git diff of package manifests, pnpm-lock.yaml, TypeScript source, and package-alignment tests

- timestamp: 2026-07-29T12:30:00Z
  observation: `fd2615dd` has parents `b540d9c1` and current base `4fd4affd`; its tree is byte-identical to first parent `b540d9c1` and differs from current base. Therefore the reconciliation merge itself added no content relative to the stale PR parent, but made that stale parent tree the PR head against the modern base instead of rebasing and resolving the dependency/API delta.
  source: `git show --format=raw fd2615dd` and read-only parent-to-head tree comparisons

- timestamp: 2026-07-29T12:30:00Z
  observation: npm reports the current `@napplet/nap` release and `latest` tag as 0.31.0, matching the PR base and contradicting the PR head's 0.29.0 package authority claim.
  source: `npm view @napplet/nap version dist-tags --json`

- timestamp: 2026-07-29T12:45:00Z
  observation: The PR first-parent branch and current main share merge base `297b5478`. At that merge base and at stale PR parent `b540d9c1`, representative manifest values are the older 0.29/0.27/0.12 set; at PR base `4fd4affd`, they are the current 0.31/0.29/0.14 set. The stale branch contains no post-divergence changes to the representative package manifests.
  source: read-only Git object values/history; representative paths `apps/playground/napplets/ble-demo/package.json` and `packages/paja/package.json`

- timestamp: 2026-07-29T12:45:00Z
  observation: Main advanced the protocol contracts in `9390eca7` (`feat(protocol): adopt current Napplet contracts (#220)`) and then release metadata in `b61b8cf5` (`Version Packages (#221)`). PR #217's social-cache branch remained based on the pre-`#220` snapshot. This confirms a stale-branch/rebase failure, not an intentional dependency downgrade in the social-cache commits.
  source: read-only `git log 297b5478..4fd4affd -- <representative manifests>`

- timestamp: 2026-07-29T12:45:00Z
  observation: npm current `latest` versions exactly match PR-base manifests: `@napplet/core` 0.31.0, `@napplet/nap` 0.31.0, `@napplet/shim` 0.29.0, `@napplet/sdk` 0.27.0, and `@napplet/vite-plugin` 0.14.0. All are sourced from `sandwichfarm/napplet`; the PR head's coherent package set is two release steps behind for core/nap and one step behind for the remaining packages.
  source: `npm view` release metadata for all five packages

- timestamp: 2026-07-29T12:45:00Z
  observation: `napplet/naps` master is commit `5ac0490`, and NAP-IDENTITY is present at `naps/NAP-IDENTITY.md` blob `48e0488`. NAP-OUTBOX is not on master, consistent with PR #217's stated draft qualification; the exact draft PR/ref must be inspected before making an OUTBOX conformance conclusion.
  source: GitHub API tree and branch metadata for `napplet/naps`

- timestamp: 2026-07-29T13:00:00Z
  observation: Explicit predicates confirm `297b5478` is an ancestor of both current base and stale branch parent, while current base is not an ancestor of the stale branch. The causal stale-branch hypothesis is therefore directly confirmed; the earlier failed ancestry wrapper was a zsh word-splitting command defect, not contrary Git evidence.
  source: read-only explicit `git merge-base --is-ancestor` checks

- timestamp: 2026-07-29T13:00:00Z
  observation: NAP-IDENTITY at `napplet/naps` master `5ac0490` specifies read-only `identity.getFollows` as a correlated request/result pair returning public-key arrays with optional error. It permits shell cache/relay resolution and ACL restrictions, and prohibits private-key/signing/decrypt exposure. Paja's stated use of standard follows is philosophically aligned if its actual handler preserves that shape and boundary.
  source: `napplet/naps:naps/NAP-IDENTITY.md` at master commit `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`

- timestamp: 2026-07-29T13:00:00Z
  observation: NAP-OUTBOX is an open draft in napplet/naps PR #32, exact head `4589a8f9`. The authority defines `outbox.query(filters, options?)`, requires shell-owned relay discovery/routing/deduplication/signature validation and permits ACL/limits/timeouts; it returns deduplicated `RelayEventResult[]` with optional `incomplete` and `error`. The PR's stated private cache augmentation can align with this philosophy only if it remains shell-owned, bounds/filter-matches/deduplicates the augmentation, preserves result envelope fields, and does not expose direct napplet relay control.
  source: `napplet/naps` PR #32, `naps/NAP-OUTBOX.md` at `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e`

- timestamp: 2026-07-29T13:15:00Z
  observation: The PR-head Paja implementation keeps the social cache host-private: it is not a public Paja capability, `createIdentityService` exposes only standard `identity.getFollows`, and `createOutboxService` exposes only standard `outbox.query` with a request-scoped decorated router. No custom social wire operation or direct napplet relay API is introduced.
  source: full read of PR-head `packages/paja/src/browser-social-cache.ts` and `packages/paja/src/browser-adapter.ts`

- timestamp: 2026-07-29T13:15:00Z
  observation: `identity.getFollows` preserves NAP-IDENTITY's required correlated result shape (`id`, `pubkeys`, optional `error`), takes the active signer public key per request, returns verified kind-3 follows, and retains no signer private-key/signing/decrypt path. This focused behavior is conformant with NAP-IDENTITY master `5ac0490`.
  source: full read of PR-head `packages/services/src/identity-service.ts`, Paja adapter/cache, and NAP-IDENTITY master

- timestamp: 2026-07-29T13:15:00Z
  observation: The private profile warming and `outbox.query` augmentation use the existing host-owned router; cached values are kind-0/filter-matched, bounded, deduplicated with base events taking precedence, sorted/limited, and preserve base `incomplete`/`error`. ACL is checked before and after the base query through source-bound `identity:read`. These characteristics align with NAP-OUTBOX draft `4589a8f9` shell ownership, routing, deduplication, limits, policy, and result-envelope requirements.
  source: full read of PR-head Paja adapter/social-cache/relay-runtime, outbox service, and focused social-cache regression tests

- timestamp: 2026-07-29T13:15:00Z
  observation: No NAP-OUTBOX master conformance claim is valid because the document is still an open draft. The limited conclusion is conformance of this focused `identity.getFollows` + `outbox.query` behavior to NAP-IDENTITY master `5ac0490` and NAP-OUTBOX PR #32 head `4589a8f9`; its package API declarations still require a forward-port to current published contracts.
  source: current `napplet/naps` master/tree, PR #32 metadata, and PR-head source

- timestamp: 2026-07-29T13:30:00Z
  observation: The existing isolated rebase-probe at clean head `466dbc0` contains the social-cache implementation internally (adapter import and tests only, no public Paja entry export) while every sampled host/package manifest retains the current-base `@napplet/*` values. This directly falsifies the claim that social-cache behavior requires the old 0.29/0.27/0.25/0.12 set.
  source: read-only rebase-probe status, Git object manifest comparisons, and Paja reference/export searches

- timestamp: 2026-07-29T13:30:00Z
  observation: The probe's adaptation has no package-manifest downgrade relative to `4fd4affd`; it adds the focused private cache, source-bound query-router selector, host/test/docs work, and current-topology adjustments. The larger planning-file history in that preserved probe is unrelated to package compatibility and must not be copied wholesale into a corrective PR.
  source: read-only `git diff 4fd4affd..466dbc0`, manifest comparison, and commit/scope inventory

- timestamp: 2026-07-29T14:15:00Z
  observation: The live PR remains open with changes requested at stale head `fd2615dd` and all old-head checks passing. Local `upstream/main` is `a3e73e75`, while the retained no-downgrade probe is `466dbc0` and is 32 commits behind that upstream ref. The working checkout's unrelated `.planning/STATE.md` modification is active Phase-103 tracking and must not be touched.
  source: live GitHub PR/check query; `git worktree list`; `git branch -avv`; status/diff inspection

- timestamp: 2026-07-29T14:15:00Z
  observation: The existing Graphify graph identifies the relevant Paja/browser adapter/relay runtime, service outbox/identity, package manifest, and host/test nodes, but it cannot establish live Git ref or GitHub review state; Git/GitHub remain the authority for reconstruction.
  source: `/workspace/projects/kehto/web/graphify-out/graph.json` via `graphify query`

- timestamp: 2026-07-29T14:30:00Z
  observation: The current live `upstream/main` is `7fef1d51` (Version Packages #228), four commits beyond the previously fetched `a3e73e75`; it includes #218 and #226/#227. The upstream tracking ref was safely fast-forwarded from `a3e73e75` to the verified remote tip.
  source: `git ls-remote upstream refs/heads/main`; `git fetch upstream main`; `git log upstream/main`

- timestamp: 2026-07-29T14:30:00Z
  observation: Relative to its then-current base, the retained rebase-probe changes only one release artifact (`.changeset/paja-standard-nap-social-cache.md`) and no package manifest, lockfile, or JSR metadata. Its intended implementation is contained in Paja cache/adapter/runtime files, runtime intent types, services identity/outbox files and tests, one e2e test, and Paja docs; unrelated milestone planning changes are separable.
  source: parsed complete `upstream/main...466dbc0` file matrix and numstat (pre-fetch upstream tip)

- timestamp: 2026-07-29T14:30:00Z
  observation: NAP authority remains NAP-IDENTITY on `napplet/naps` master `5ac0490` blob `48e0488`; NAP-OUTBOX remains open PR #32 head `4589a8f9` blob `4f7bda6`. The prior scoped-conformance conclusion remains valid: identity behavior is checked against merged master; outbox behavior is checked against the explicitly named draft, not claimed as master authority.
  source: GitHub API and napplet/naps PR #32 metadata

- timestamp: 2026-07-29T15:15:00Z
  observation: The new isolated worktree `/workspace/projects/kehto/pr-217-current-contract-reconstruction` and branch `fix/pr-217-current-contract-reconstruction` were created from verified `upstream/main` `7fef1d51` without modifying existing worktrees or PR refs. The first cherry-pick command performed no commit because a mistakenly concatenated hash was rejected before application.
  source: `git worktree add -b ... upstream/main`; Git revision validation failure

- timestamp: 2026-07-29T15:20:00Z
  observation: All 28 selected social-cache commits resolve as commit objects in the local object database in the intended chronological order.
  source: explicit `git rev-parse --verify <sha>^{commit}` for each selected SHA

- timestamp: 2026-07-29T15:30:00Z
  observation: The complete 28-commit social-cache series applied successfully to new branch `fix/pr-217-current-contract-reconstruction` from `upstream/main` `7fef1d51`. Git auto-merged the only known overlapping path (`packages/runtime/src/intent-dispatch.test.ts`) with no conflict; no retained worktree or remote PR ref was modified.
  source: ordered `git cherry-pick` output in the isolated reconstruction worktree

- timestamp: 2026-07-29T15:40:00Z
  observation: Static reconstruction checks pass: the branch is clean and 28 commits ahead of `upstream/main`; `git diff --check` is clean; the exact diff is the intended 19 source/test/docs/changeset paths with no `.planning/**`; and no package manifest, lockfile, or JSR metadata path differs from current upstream. Paja retains `@napplet/core` and `@napplet/nap` `>=0.31.0 <0.32.0` ranges.
  source: reconstruction worktree status and base-to-head Git diff checks

- timestamp: 2026-07-29T15:40:00Z
  observation: No Stryker configuration exists, so mutation signal will be recorded as skipped. The repository contains `tests/unit/napplet-package-alignment.test.ts` for package-contract validation and focused Paja/runtime/services test suites for adjacent behavior.
  source: repository file inventory and root package scripts

- timestamp: 2026-07-29T15:50:00Z
  observation: Full source/test inspection confirms the reconstructed cache remains host-private and tests its specified boundary: verified active-account kind-3 follows, malformed candidate rejection, bounded/deduplicated kind-0 augmentation, base-result precedence, request-start identity correlation, and source-bound identity ACL checks before and after base queries. The sole stale artifact was a comment falsely naming installed `@napplet/nap@0.29.0` authority; it was corrected to the verified NAP-IDENTITY master / NAP-OUTBOX draft scope without changing behavior.
  source: complete read of reconstructed `browser-social-cache.ts` and `browser-social-cache.test.ts`; NAP source refs verified at 15:30

- timestamp: 2026-07-29T15:50:00Z
  observation: The reconstruction has no project-defined or configured debugger skills to apply.
  source: project `.claude/skills` / `.agents/skills` inventory and `gsd-tools query agent-skills gsd-debugger`

- timestamp: 2026-07-29T16:05:00Z
  observation: The comment correction is whitespace-clean and its only working-tree change replaces stale authority text; no package manifest, lockfile, or JSR metadata differs either from `upstream/main` or in the uncommitted change.
  source: `git diff --check`; scoped base-to-head and working-tree artifact comparisons

- timestamp: 2026-07-29T16:10:00Z
  observation: The corrected NAP authority comment was committed as `a889b2ee` by explicit source path; the reconstruction branch now contains 29 commits ahead of `upstream/main`.
  source: isolated-worktree Git commit result

- timestamp: 2026-07-29T16:15:00Z
  observation: The focused Vitest command did not start: `pnpm exec vitest ...` exited 127 with no test output. This is an environment/tool-resolution finding, not evidence that the reconstruction fails its target tests.
  source: focused test subprocess result

- timestamp: 2026-07-29T16:20:00Z
  observation: Node 22.22.0 and Corepack 0.34.0 are available, but `pnpm` is not on PATH and the new reconstruction worktree has no `node_modules`; the unrelated main worktree has its own materialized dependencies. The focused test failure is therefore explained by absent package-manager/dependency materialization in the isolated worktree.
  source: command/path and node_modules inventory

- timestamp: 2026-07-29T16:25:00Z
  observation: Corepack resolves the repository's configured package manager as pnpm 10.8.0, so isolated frozen-lockfile materialization is available.
  source: `corepack pnpm --version`

- timestamp: 2026-07-29T16:30:00Z
  observation: Frozen-lockfile dependency materialization completed in the isolated reconstruction worktree with no lockfile resolution change. pnpm reused 442 packages and warned that esbuild's install script was ignored; this environment warning must be considered if a build-dependent gate fails.
  source: `corepack pnpm install --frozen-lockfile`

- timestamp: 2026-07-29T16:35:00Z
  observation: Dependency materialization left the reconstruction worktree clean; no tracked lockfile or manifest change was introduced.
  source: `git status --short --branch` and scoped Git diff

- timestamp: 2026-07-29T16:40:00Z
  observation: The agent-authored focused social-cache suite passes: 20 tests across identity capture, hostile inputs, cache bounds, cancellation, ACL, merge, and router delegation behavior.
  source: `corepack pnpm exec vitest run packages/paja/src/browser-social-cache.test.ts`

- timestamp: 2026-07-29T16:45:00Z
  observation: The preserved current-base package-alignment suite passes all four assertions, verifying every active manifest, JSR map, lock importer/final snapshot, and installed package against the current 0.31/0.29/0.27/0.14 published matrix.
  source: `corepack pnpm exec vitest run tests/unit/napplet-package-alignment.test.ts`

- timestamp: 2026-07-29T16:50:00Z
  observation: All seven adjacent Paja/runtime/services import-graph suites pass (127 tests), including the sole current-upstream overlap in runtime intent dispatch.
  source: focused Vitest run for browser adapter/host/relay, services identity/intent/outbox, and runtime intent dispatch

- timestamp: 2026-07-29T17:00:00Z
  observation: The current CI checkout uses `fetch-depth: 0` and exposes exact PR base/head SHA values to Node scripts. It currently runs only a changed-file scope classifier; it has no dependency-direction step. The preserved package-alignment suite validates a fixed in-tree version matrix, but cannot detect a PR that coherently rewrites that matrix to older values, which is exactly how stale PR #217 passed.
  source: complete read of `.github/workflows/ci.yml` and `tests/unit/napplet-package-alignment.test.ts`; old-head audit evidence

- timestamp: 2026-07-29T17:00:00Z
  observation: Existing repository scripts use base/head Git CLI arguments and fail-closed nonzero exits, providing a tested integration pattern for a small CI dependency-direction guard.
  source: complete read of `scripts/check-changeset-deletions.mjs`

- timestamp: 2026-07-29T17:20:00Z
  observation: The new agent-authored direction-guard suite is RED as required: all four fixtures fail solely because `scripts/check-napplet-dependency-direction.mjs` does not yet exist, proving the test exercises the intended executable guard rather than a pre-existing static assertion.
  source: focused Vitest red run; module-not-found failure for the absent guard

- timestamp: 2026-07-29T17:35:00Z
  observation: The new dependency-direction suite is GREEN: four isolated Git histories prove the guard accepts unchanged/newer `@napplet/*` declarations and unrelated manifests, while rejecting a lower dependency, a lower pnpm override, and a removed declaration. CI now invokes the guard with its established PR/push base/head SHAs and skips only the all-zero initial-push sentinel.
  source: focused Vitest green run; CI workflow implementation

- timestamp: 2026-07-29T17:40:00Z
  observation: The first preserved-head validation command used the controller checkout as its process directory, so Node could not locate the new guard. Both resulting status 1 values are invalid environment observations and provide no evidence about either historical or reconstructed dependency direction.
  source: failed guard invocation from `/workspace/projects/kehto/web`

- timestamp: 2026-07-29T17:45:00Z
  observation: From the reconstruction repository, the new guard rejects the preserved historical PR range `4fd4affd..fd2615dd` with the exact 112 downgraded manifest declarations and accepts `upstream/main..HEAD` with no dependency-direction violations. This is the direct before/after reproduction of the original regression condition.
  source: direct guard run against immutable stale head and reconstructed head

- timestamp: 2026-07-29T17:50:00Z
  observation: The prevention implementation is whitespace-clean and syntactically valid under Node; the only pending tracked changes are the intended CI invocation plus new guard and regression-test files.
  source: `git diff --check`; `node --check`; isolated worktree status

- timestamp: 2026-07-29T18:00:00Z
  observation: The CI dependency-direction guard and its regression suite were committed as `2f41295b`; the reconstruction remains isolated and no PR ref has been pushed yet.
  source: explicit-path Git commit result

- timestamp: 2026-07-29T18:10:00Z
  observation: The final reconstruction is clean and 30 commits ahead of `upstream/main`; its whitespace-clean 22-path diff contains only the focused social-cache source/tests/docs/changeset plus the CI guard/script/test. It contains no `.planning/**`, package manifest, lockfile, or JSR metadata change. The repository pins AI-slop badge tooling to aislop 0.12.0 and has a local `.aislop/config.yml`.
  source: final Git diff/status inventory and AI-slop workflow/config discovery

- timestamp: 2026-07-29T18:15:00Z
  observation: The configured AI-slop policy scans format, lint, code quality, AI-slop, and security (without live dependency audit), with CI fail-below 50; it does not identify a project-local command, so the pinned 0.12.0 CLI must be invoked directly during final verification.
  source: complete read of `.aislop/config.yml` and badge workflow discovery

- timestamp: 2026-07-29T18:20:00Z
  observation: The full build did not begin package compilation: Turbo could not locate a `pnpm` binary even though Corepack ran the parent command. This is an environment PATH/shim failure, distinct from the prior ignored-esbuild-script warning and not source-failure evidence.
  source: `corepack pnpm build` subprocess output

- timestamp: 2026-07-29T18:30:00Z
  observation: With the ephemeral Corepack pnpm shim on PATH, the full build passes: 32/32 tasks successful. Vite emitted existing dynamic-import and >500 kB chunk-size warnings, but no build error.
  source: `PATH=/tmp/kehto-pnpm-bin:$PATH corepack pnpm build`

- timestamp: 2026-07-29T18:35:00Z
  observation: The aggregate `pnpm type-check` command exits 2 after its build stage, but the terminal output was truncated before the definitive type-check diagnostic. The failure is unclassified until captured output identifies whether it is a reconstruction defect or inherited/tooling condition.
  source: full type-check subprocess exit status and truncated output

- timestamp: 2026-07-29T18:45:00Z
  observation: Captured type-check output identifies a concrete reconstruction compatibility failure: `packages/services/src/manifest-intent-dispatch.test.ts:18` constructs `ServiceRuntimeContext` without required `hasCapability`. The social-cache series introduced that required context method; current upstream added this services test after the probe base, so it was not updated by the forward-port. This is a source-level adaptation defect, not an environment issue.
  source: complete captured type-check log at `/tmp/kehto-typecheck.log`

- timestamp: 2026-07-29T18:50:00Z
  observation: The exhaustive fixture search finds one missing method only: Paja's adapter fixture and the pre-existing intent-service fixture already supply `hasCapability`, while the current-upstream manifest-intent fixture does not. Its tests exercise dispatch behavior and do not request capability, so a deterministic false stub is the minimal type-complete adaptation.
  source: complete manifest fixture read and all `ServiceRuntimeContext` / `sendToEligibleNapplet` references

- timestamp: 2026-07-29T18:55:00Z
  observation: The adapted manifest-intent dispatch suite passes both service scenarios after adding the false capability stub.
  source: focused Vitest run for `packages/services/src/manifest-intent-dispatch.test.ts`

- timestamp: 2026-07-29T19:00:00Z
  observation: The minimal current-contract fixture adaptation was committed as `5a1cd985` by explicit path.
  source: isolated-worktree Git commit result

- timestamp: 2026-07-29T19:15:00Z
  observation: The complete type-check now passes: 17/17 tasks successful. The one current-upstream fixture adaptation eliminated the only compiler failure.
  source: rerun type-check output (32 build tasks plus 17 type-check tasks)

- timestamp: 2026-07-29T19:20:00Z
  observation: The full unit suite passes: 128 test files and 1,565 tests green, including the social-cache, direction-guard, package-alignment, manifest-intent, and all adjacent runtime/services coverage.
  source: `corepack pnpm test:unit`

- timestamp: 2026-07-29T19:30:00Z
  observation: The docs quality gate passes after regenerating TypeDoc and VitePress; it audited all nine public package docs, route/TypeDoc targets, and docs-gate wiring. It emitted only the existing VitePress >500 kB chunk warning.
  source: `corepack pnpm docs:check`

- timestamp: 2026-07-29T19:45:00Z
  observation: The relevant Paja Playwright specification passes all seven Chromium scenarios, including the identity-follows and OUTBOX profile-query boundary plus the mandatory NAP-SHELL behavior.
  source: `corepack pnpm test:e2e -- tests/e2e/paja-single-window.spec.ts`

- timestamp: 2026-07-29T19:50:00Z
  observation: The pinned aislop 0.12.0 CLI supports full and `--changes --base` scans; its scanner invocation is now verified locally.
  source: `npx -y aislop@0.12.0 --help`

- timestamp: 2026-07-29T19:55:00Z
  observation: The full pinned AI-slop quality gate passes at 100/100 across 247 files: zero formatting, AI-slop, security, and lint issues; three configured code-quality warnings remain suppressed by existing directives.
  source: `npx -y aislop@0.12.0 scan`

- timestamp: 2026-07-29T20:05:00Z
  observation: Final no-op/deletion inspection passes: the clean 23-path reconstruction has 1,796 additions and 16 deletions, including 616 behavioral social-cache test lines, 299 cache implementation lines, and additive CI guard/test coverage. The small authority-comment deletion is explicitly justified by its stale 0.29 claim.
  source: final `git diff --check`, `--shortstat`, and scoped numstat

- timestamp: 2026-07-29T20:05:00Z
  observation: Final revert-and-reconfirm equivalent passes: preserving/reverting the PR head to immutable `fd2615dd` reproduces the exact 112 dependency decreases and is rejected by the new guard; the final reconstructed head against `upstream/main` passes. The live PR head is still exactly expected lease SHA `fd2615dd`, with PR #217 open and changes requested.
  source: final direct guard comparison and `git ls-remote` / GitHub PR metadata

- timestamp: 2026-07-29T20:10:00Z
  observation: The authorized lease-protected remote replacement succeeded: only PR #217's head branch changed from `fd2615dd` to reconstructed `5a1cd985`; no merge was performed.
  source: `git push --force-with-lease=refs/heads/feat/paja-standard-nap-social-cache-current:fd2615dd...`

- timestamp: 2026-07-29T20:20:00Z
  observation: GitHub CI for the reconstructed PR head passes all reported technical checks: Changeset deletion guard, Detect CI Scope, Build & Type-Check, Vitest, Detect Playwright Scope, and Playwright. PR #217 remains open; no merge action was taken.
  source: `gh pr checks 217 --watch` completed on the pushed head

- timestamp: 2026-07-29T17:00:48Z
  observation: Independent human verification confirmed the original issue is fixed. A fresh GitHub check confirms PR #217 remains open at head `5a1cd985` on base `7fef1d51`; its 23 changed paths contain no `package.json`, `pnpm-lock.yaml`, or `jsr.json`, and all six reported checks pass. `mergeStateStatus` remains `BLOCKED` solely with the prior `CHANGES_REQUESTED` review decision; no merge was performed.
  source: human-verify response; `gh api repos/kehto/web/pulls/217/files`; `gh pr checks 217`; `gh pr view 217`

- timestamp: 2026-07-29T17:00:48Z
  observation: The resolved-session entry, including prevention branches and the verified recurrence guard, was appended to the durable planning knowledge base. MemPalace indexing is skipped because planning configuration sets `mempalace.enabled: false`.
  source: `.planning/debug/knowledge-base.md`; `gsd-tools query state.load`

## Eliminated

- hypothesis: The Paja social-cache feature intrinsically requires old @napplet package versions or a custom public protocol surface.
  evidence: The clean current-baseline rebase-probe retains the internal social-cache composition without changing sampled current package pins, and the implementation exposes only NAP-IDENTITY/OUTBOX operations.
  timestamp: 2026-07-29T13:30:00Z

- hypothesis: Green CI established that PR #217 was compatible with current upstream Napplet contracts.
  evidence: CI passed only after source declarations, lock resolution, static alignment tests, JSR metadata, and package manifests were all coherently reset to the obsolete package set; npm latest and PR base are the newer current authority.
  timestamp: 2026-07-29T13:30:00Z

## Resolution

- root_cause: "AND-gate confirmed: (1) the social-cache branch retained pre-`9390eca7` package/API state from merge base `297b5478`; (2) `fd2615dd` reconciled ancestry while retaining that stale first-parent tree byte-for-byte instead of content-rebasing it onto current base; and (3) no supersession/dependency-direction gate checked that green CI's declared contract set had regressed from current upstream. This rolled 112 @napplet manifest entries, lock resolution, metadata, imports, and alignment tests back from current 0.31/0.29/0.27/0.14 to stale 0.29/0.27/0.25/0.12."
- fix: "Reconstructed PR #217 from fetched `upstream/main` `7fef1d51` by applying only the 28 validated social-cache commits, correcting its inherited NAP authority comment, and adapting the one post-probe ServiceRuntimeContext fixture. The new head preserves all current manifest, lockfile, and JSR values. Added a fail-closed base-to-head semver guard for changed `@napplet/*` dependencies/devDependencies/peerDependencies/pnpm overrides, a CI invocation with actual PR/push base/head SHAs, and four red/green regression fixtures. Replaced only the PR head with `--force-with-lease`; PR #217 was not merged."
- verification:
    target_test: { result: pass, suites: ["browser-social-cache: 20", "napplet-package-alignment: 4", "manifest-intent-dispatch: 2"] }
    mutation_check: { result: skipped, reason_if_skipped: "No Stryker configuration or binary exists in the repository." }
    no_op_deletion: { result: pass, deletion_justified_by_rca: true, evidence: "1,796 additions / 16 deletions; behavior and guard coverage are additive; stale 0.29 authority comment deletion is RCA-justified." }
    adjacent_tests: { result: pass, suites_run: ["Paja/runtime/services focused: 127", "all Vitest: 1,565", "Paja Playwright: 7"] }
    revert_and_reconfirm: { result: pass, bug_returned_on_revert: true, fixed_on_reapply: true, evidence: "Immutable stale head fd2615dd is rejected for all 112 decreases; final upstream/main..HEAD passes the same guard." }
    technical_gates: { build: pass, type_check: pass, unit: pass, docs: pass, e2e: pass, ai_slop: "pass (100/100)" }
    guardrail_verdict: accepted
    remote_ci: pass (Build & Type-Check, Vitest, Playwright, scope, and changeset checks)
    human_verification: pass (independent audit confirmed the current-main rewrite, zero dependency rollback, guard addition, and green CI)
- files_changed:
    - .changeset/paja-standard-nap-social-cache.md
    - .github/workflows/ci.yml
    - docs/how-tos/paja-local-authoring.md
    - docs/packages/paja.md
    - packages/paja/README.md
    - packages/paja/src/browser-adapter-intent.test.ts
    - packages/paja/src/browser-adapter.ts
    - packages/paja/src/browser-host.test.ts
    - packages/paja/src/browser-relay-runtime.test.ts
    - packages/paja/src/browser-relay-runtime.ts
    - packages/paja/src/browser-social-cache.test.ts
    - packages/paja/src/browser-social-cache.ts
    - packages/runtime/src/intent-dispatch.test.ts
    - packages/runtime/src/runtime.ts
    - packages/runtime/src/types.ts
    - packages/services/src/identity-service.test.ts
    - packages/services/src/intent-service.test.ts
    - packages/services/src/manifest-intent-dispatch.test.ts
    - packages/services/src/outbox-service.test.ts
    - packages/services/src/outbox-service.ts
    - scripts/check-napplet-dependency-direction.mjs
    - tests/e2e/paja-single-window.spec.ts
    - tests/unit/napplet-dependency-direction-guard.test.ts

## Specialist Review

- specialist: typescript-expert
- verdict: SUGGEST_CHANGE
- response: Define the dependency guard as a base-to-head, semver-aware manifest-and-lockfile comparison with narrowly reviewed exceptions; test allowed upgrades, rejected downgrades, workspace/override cases, stale JSR metadata, and current-API contract paths for `identity.getFollows`/`outbox.query` including malformed and host-boundary failures.

## Prevention

- and_gate: The rollback reached review only because a stale pre-current-contract snapshot was retained during ancestry reconciliation and CI lacked a base-to-head dependency-direction check.
- branch_data_history: The social-cache work started before current `@napplet/*` contracts landed; the correction now begins from `upstream/main` and carries only the validated feature delta.
- branch_code_integration: The reconciliation merge reused the stale first-parent tree instead of resolving content against the current base; the correction uses a content rebase/reconstruction with current imports, types, and one necessary fixture adaptation.
- branch_config_verification: Existing fixed-matrix package alignment checks were editable in the same stale tree and therefore could pass after a coherent rollback. CI now invokes a fail-closed base-to-head comparison on actual PR/push SHAs.
- why_not_caught: No dependency-direction gate existed. Existing static alignment tests verified only the branch's internally declared package matrix, while code review did not compare it to the current base.
- recurrence_guard: `.github/workflows/ci.yml` runs `scripts/check-napplet-dependency-direction.mjs` against base/head SHAs; `tests/unit/napplet-dependency-direction-guard.test.ts` verifies unchanged/upgraded declarations pass and dependency, pnpm override, and removed-declaration regressions fail. The full suite and live CI passed this guard.
