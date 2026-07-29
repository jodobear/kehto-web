---
status: resolved
trigger: "Investigate and fix type-check failures in kehto/web PR #217 from GitHub Actions run 30438274634 job 90531181723."
created: 2026-07-29
updated: 2026-07-29T11:03:22Z
---

# Debug Session: PR #217 type-check failure

## Symptoms

- Expected: PR #217 `Build & Type-Check` job passes on current head.
- Actual: GitHub Actions job 90531181723 fails during `pnpm type-check`.
- Error: `packages/services/src/manifest-intent-dispatch.test.ts(18,3): error TS2741: Property 'hasCapability' is missing ... but required in type 'ServiceRuntimeContext'.`
- Timeline: Current PR head `146b2f03401c928b71085fb76805a821a545da98` after branch update on 2026-07-29.
- Reproduction: Checkout PR head, run frozen install and `corepack pnpm type-check`.

## Current Focus

- bug_class: bohrbug (a compiler diagnostic at a fixed source location reproduced deterministically in the pre-fix GitHub merge tree)
- hypothesis: Confirmed. The base fixture and PR-required `hasCapability` contract were incompatible only in GitHub's pull-request merge tree. Reconciliation merge `fd2615dd` retained the type-complete PR tree while making base `4fd4affd` an ancestor, preventing the obsolete three-method fixture from returning.
- test: Reporter independently verified PR #217's exact head, mergeability, clean merge state, and all required checks in GitHub.
- expecting: The independent GitHub result agrees with the self-verification and clears the human-verify checkpoint.
- next_action: Verify the planning-only diff contains exactly the archived session and knowledge-base entry, then stage those paths explicitly, commit the artifacts, and push `docs/v1.29-planning-only`.
- human_verification: "Confirmed fixed through independent GitHub verification: head fd2615dda1d08102a9fad8a70f38fdf7daba70e4; base 4fd4affd; state OPEN; mergeable MERGEABLE; mergeStateStatus CLEAN; Build & Type-Check, Vitest, Playwright, scope detection, and Changeset Guard pass in run 30444798619."
- reasoning_checkpoint:
    hypothesis: "The automatic GitHub PR merge combines base `4fd4affd`'s three-method test fixture with the PR's required `hasCapability` contract; `fd2615dd` resolves this topology while preserving the PR source tree."
    confirming_evidence:
      - "The local CI-equivalent merge of base `4fd4affd` with pre-fix head `b540d9c1` reproduces exactly one TS2741 at the short fixture."
      - "The reconciliation commit has no tree diff from `b540d9c1`, and GitHub's regenerated merge tree is byte-identical to `fd2615dd`."
      - "Fresh upstream CI run `30444798619` passes Build & Type-Check, Vitest, and Playwright; PR metadata currently reports base SHA `4fd4affd`."
    falsification_test: "A regenerated GitHub merge tree that differs from `fd2615dd` or again reports TS2741 would disprove that the ancestry reconciliation controls the result."
    fix_rationale: "The merge commit records the base as an ancestor without accepting its obsolete fixture, allowing GitHub's normal merge to retain the type-complete PR tree."
    blind_spots: "The historical observation that PR metadata temporarily named `297b5478` needs reconciliation with the current API's `4fd4affd` base. It does not affect the direct pass/fail evidence for the current merge topology."
    candidate_causes:
      - "code: Base fixture omits required `hasCapability` after the PR's API addition."
      - "config: Pull-request CI checks GitHub's synthetic merge ref rather than the fork head directly."
      - "environment: The fork's direct local checkout and GitHub's merge checkout have different source trees."
    and_gate: "yes — TS2741 requires both the PR API addition and the inherited base fixture; reconciliation addresses their integration without weakening either contract."
- superseded_reasoning_checkpoint:
    hypothesis: "The code incompatibility is already absent from the current PR ancestry; only GitHub's stale synthetic merge ref preserves the old failure."
    confirming_evidence:
      - "Current base 297b5478 is already an ancestor of PR head 146b2f03, so a merge produces no source change."
      - "The historical merge reproduces TS2741, but direct PR-head services type-check passes and current base has replaced the stale fixture."
      - "GitHub's live refs/pull/217/merge remains historical 6d41e76 with old base 4fd4affd despite current PR metadata naming base 297b5478."
    falsification_test: "After a new PR-head commit, if GitHub's pull-request merge ref still uses the old base or its new Build & Type-Check check reports TS2741, stale-ref refresh is not sufficient."
    fix_rationale: "A no-content commit preserves the confirmed compatible source tree while triggering GitHub's pull-request synchronize event, which must regenerate the stale merge ref and rerun CI."
    blind_spots: "GitHub may delay or decline merge-ref regeneration; a new CI failure unrelated to TS2741 would require a separate investigation."
    candidate_causes:
      - "code: Historical required-context API and old fixture incompatibility, now resolved in current ancestry."
      - "config: Stale GitHub pull-request merge-ref/check state after base advancement."
      - "environment: GitHub Actions exposes the obsolete synthetic revision while local checkout uses the compatible current ancestry."
    and_gate: "no for the present fix — stale synthetic merge-ref state alone explains the current failing status after source compatibility was restored."
- reasoning_checkpoint: Preserve stale local PR worktree and backup refs; make any patch on a branch starting at the exact current remote head and only fast-forward-push if the remote has not changed.
- tdd_checkpoint: not_started

## Evidence

- timestamp: 2026-07-29T09:08:00Z
  observation: CI reports TS2741 only at packages/services/src/manifest-intent-dispatch.test.ts:18.
  source: GitHub Actions run 30438274634 job 90531181723
- timestamp: 2026-07-29T09:15:00Z
  observation: PR #217 remote head is 146b2f03401c928b71085fb76805a821a545da98; local checked-out PR branch is a different preserved rebased tip.
  source: gh pr view and git fetch origin

- timestamp: 2026-07-29T00:00:00Z
  observation: The existing repository graph connects the failing manifest-intent test to the services intent-dispatch area (`packages/services/src/intent-service.ts` and catalog resolver), but does not establish the current remote-head fixture shape; source inspection at the exact commit remains required.
  source: graphify query at `/workspace/projects/kehto/web/graphify-out/graph.json`

- timestamp: 2026-07-29T00:00:00Z
  observation: Created clean worktree `/workspace/projects/kehto/.tmp-pr-217-typecheck-260729` on `fix/pr-217-typecheck-260729` at exact remote PR head `146b2f03401c928b71085fb76805a821a545da98`; it is clean and does not alter the stale local PR worktree.
  source: local git worktree and fetched `origin/feat/paja-standard-nap-social-cache-current`

- timestamp: 2026-07-29T00:00:00Z
  observation: Local candidate protocol authorities include `NAP-INTENT.md`; the apparent upstream checkout is `/workspace/projects/napplets/og/naps`, while a separate `jodobear/naps` checkout may be a fork and must not be treated as authority without remote/ref verification.
  source: local specification inventory

- timestamp: 2026-07-29T00:00:00Z
  observation: Verified protocol authority: `/workspace/projects/napplets/og/naps` is `git@github.com:napplet/naps.git`, on `master` at `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`. It has unrelated untracked `.playwright-cli/`; only the tracked specification will be read. The `jodobear/naps` checkout is a fork and is not authority.
  source: local git remote/ref inspection

- timestamp: 2026-07-29T00:00:00Z
  observation: NAP-INTENT at upstream `master` `5ac0490` specifies catalog-based handler resolution and request/result behavior, but it does not define an implementation-level `ServiceRuntimeContext.hasCapability` field. The field therefore must be traced as a Kehto runtime/service contract rather than copied into the fixture as a new wire behavior.
  source: `napplet/naps` `naps/NAP-INTENT.md` lines 98-126 and 200-210

- timestamp: 2026-07-29T00:00:00Z
  observation: At the PR head, `intent-service.test.ts` has a `ServiceRuntimeContext` factory that already includes `hasCapability: vi.fn(() => true)`. The PR also substantially changed `manifest-intent-dispatch.test.ts`; the remaining error must be checked in that separate fixture and against the runtime interface, not assumed to affect every services fixture.
  source: exact-head `rg` inventory and PR diff stat

- timestamp: 2026-07-29T00:00:00Z
  observation: The full failing integration test does not construct a `ServiceRuntimeContext` directly; it only passes a `RuntimeAdapter` to `createRuntime`. The authoritative interface is in `packages/runtime/src/types.ts:428`; the already-correct unit-test factory in `intent-service.test.ts` includes `hasCapability`.
  source: exact-head source inspection

- hypothesis: the first local type-check invocation reproduced the CI diagnostic
  evidence: disproved as a valid test because the agent shell reset to `/workspace/projects/kehto/web`; output identified that worktree, not the exact PR checkout, and failed before TypeScript because the shell lacked a `pnpm` shim.
  timestamp: 2026-07-29T00:00:00Z

- timestamp: 2026-07-29T00:00:00Z
  observation: The first local type-check command was invalid: the command ran in `/workspace/projects/kehto/web` after shell reset, not the exact PR worktree, and stopped before TypeScript with `sh: line 1: pnpm: command not found`.
  source: local command output

- timestamp: 2026-07-29T00:00:00Z
  observation: The clean exact-head worktree installed from the frozen lockfile and `pnpm type-check` exited successfully. However, Turbo replayed the services type-check cache from another worktree, so this pass alone cannot disprove a merge-commit failure or a cache/input-hash problem; a direct uncached services compilation is required.
  source: exact-head command output, lines 1-30 and 744-770 of saved log
- timestamp: 2026-07-29T00:00:00Z
  observation: SBFL skipped: this is a compile-time diagnostic, not a suite with one passing and one failing test plus per-test coverage.
  source: local reproduction setup

- timestamp: 2026-07-29T00:00:00Z
  observation: Directly invoking `tsc --noEmit` through `pnpm --filter @kehto/services type-check` at exact remote head passed, so a services source-level TS2741 does not exist on the unmerged PR head. The earlier Turbo cache did not hide this particular branch-local type error.
  source: uncached exact-head services type-check

- hypothesis: GitHub Actions checked a synthetic pull-request merge ref different from PR head `146b2f03`
  evidence: the immutable Actions job metadata reports `head_sha: 146b2f03401c928b71085fb76805a821a545da98`, exactly matching the checked-out local PR head.
  timestamp: 2026-07-29T00:00:00Z

- timestamp: 2026-07-29T00:00:00Z
  observation: Failed GitHub Actions job `90531181723` records the exact PR-head SHA `146b2f03401c928b71085fb76805a821a545da98`; the merge-ref explanation is contradicted by the job metadata.
  source: GitHub Actions job API

- hypothesis: CI's TypeScript/package resolution differed from the exact PR-head source while checking the same checkout tree
  evidence: CI's raw log identifies `@kehto/services@0.18.0`, `@kehto/paja@0.10.0`, and a line-18 object literal, whereas the local tree at job SHA `146b2f03` has `@kehto/services@0.17.0`, `@kehto/paja@0.9.0`, and an import at line 18. This is a source-tree mismatch, not a declaration-resolution mismatch within one tree.
  timestamp: 2026-07-29T00:00:00Z

- timestamp: 2026-07-29T00:00:00Z
  observation: The raw failed CI log ran `@kehto/services@0.18.0` and `@kehto/paja@0.10.0`; its failing line 18 is a three-method runtime-context object missing `hasCapability`. In the local exact job SHA tree, services is `0.17.0`, Paja is `0.9.0`, and line 18 of the named test imports the catalog resolver. CI therefore compiled a different source tree despite reporting the PR SHA in job metadata.
  source: failed GitHub Actions job log and exact-head local file inspection

- timestamp: 2026-07-29T00:00:00Z
  observation: At PR head, `ci.yml` uses `actions/checkout@v4` with no explicit `ref` for the `pull_request` build job. This makes a synthesized pull-request merge checkout plausible and means job metadata `head_sha` is insufficient to identify the workspace tree.
  source: exact-head `.github/workflows/ci.yml` lines 54-63
- timestamp: 2026-07-29T00:00:00Z
  observation: The prior merge-ref elimination was premature: it relied only on job API `head_sha`, whereas the workflow's default pull-request checkout semantics can use a synthesized merge revision. The raw checkout step log is required to settle the branch.
  source: workflow inspection following job-log source-tree mismatch

- timestamp: 2026-07-29T00:00:00Z
  observation: The full Actions checkout log proves the build checked out synthetic merge commit `6d41e763455d866418d8395fb6cc715876794934` (`refs/remotes/pull/217/merge`), merging PR head `146b2f03` into base `4fd4affdd0043ea093c6b56a866f0f9f333e5375`. This explains why job metadata's PR head differs from the source tree CI compiled.
  source: failed job checkout log lines 108-136 and 155-156

- timestamp: 2026-07-29T00:00:00Z
  observation: Fetched the immutable CI merge commit into `/workspace/projects/kehto/.tmp-pr-217-ci-merge-260729`. Its parents are exactly base `4fd4affd` and PR `146b2f03`; its package versions (`services 0.18.0`, `paja 0.10.0`) match the failed CI log.
  source: exact CI merge worktree inspection

- timestamp: 2026-07-29T00:00:00Z
  observation: The exact CI merge-tree fixture directly matches the CI diagnostic: its `runtime(): ServiceRuntimeContext` returns only `resolveDTag`, `listWindowIds`, and `sendToEligibleNapplet` at lines 17-22, with no `hasCapability`.
  source: `/workspace/projects/kehto/.tmp-pr-217-ci-merge-260729/packages/services/src/manifest-intent-dispatch.test.ts`
- timestamp: 2026-07-29T00:00:00Z
  observation: A first direct services compilation of the merge worktree was confounded by missing `@kehto/runtime` build declarations (`TS2307`); `pnpm install` alone does not generate workspace `dist` outputs. Reproduce only after building the runtime dependency, matching CI's build-before-type-check sequence.
  source: exact merge-worktree type-check output

- timestamp: 2026-07-29T00:00:00Z
  observation: Building only runtime was also insufficient: its DTS build requires `@kehto/acl/capabilities`, and services consequently saw incomplete runtime declarations. A full ordered workspace build is necessary to recreate CI's declaration graph.
  source: exact merge-worktree build/type-check output

- timestamp: 2026-07-29T00:00:00Z
  observation: The attempted `pnpm build -- --force` was invalid because pnpm forwarded `--force` into every package build script, including tsup, which rejects that option. It must not be used for reproduction.
  source: exact merge-worktree build output

- timestamp: 2026-07-29T00:00:00Z
  observation: After the CI-equivalent full workspace build supplied runtime declarations, direct merge-tree `@kehto/services` type-check reproduced exactly one diagnostic: `manifest-intent-dispatch.test.ts(18,3) TS2741` for missing `hasCapability`.
  source: exact CI merge worktree direct type-check

- timestamp: 2026-07-29T00:00:00Z
  observation: `hasCapability` is a required runtime-owned ACL predicate (`ServiceRuntimeContext` lines 428-461) implemented from the live session and ACL state in `runtime.ts`. It is not part of NAP-INTENT wire behavior, and `intent-service.ts` does not consume it in the tested invoke path. The fixture needs a type-complete local stub only.
  source: complete merge-tree `types.ts` and `intent-service.ts`, plus `hasCapability` call-site inventory
- timestamp: 2026-07-29T00:00:00Z
  observation: The failing merge-tree test is a short 117-line test whose `runtime()` fixture is absent from the 557-line PR-head version previously inspected. Before patching, parent diffs must establish whether this stale fixture originates in the base parent, the PR parent, or an anomalous merge result.
  source: complete source comparison between exact CI merge tree and exact PR head

- timestamp: 2026-07-29T00:00:00Z
  observation: Parent diff proves the synthetic merge preserves `manifest-intent-dispatch.test.ts` exactly from base `4fd4affd` (no base→merge change) while replacing the PR parent's long version. The stale three-method fixture is a base-branch file, not PR #217 source.
  source: exact merge-parent `git diff` comparison

- timestamp: 2026-07-29T00:00:00Z
  observation: Created clean detached worktree `/workspace/projects/kehto/.tmp-pr-217-base-260729` at the exact CI base parent `4fd4affd`, ready to test the inherited baseline independently.
  source: local git worktree creation

- timestamp: 2026-07-29T00:00:00Z
  observation: The exact base parent `4fd4affd` completes frozen install, full build, and direct `@kehto/services` type-check without a TS2741. Therefore the base fixture alone is not defective; the failure requires a contract change contributed by the PR merge.
  source: exact base-worktree CI-equivalent build and direct type-check log

- timestamp: 2026-07-29T00:00:00Z
  observation: Direct parent diff confirms PR #217 adds both required `ServiceRuntimeContext.hasCapability` and its ACL-backed runtime implementation, while replacing the base short manifest-intent test with an older long integration version. The CI merge combines the new contract with the base test, which explains the exact TS2741.
  source: base→PR parent diff for `runtime.ts`, `types.ts`, and `manifest-intent-dispatch.test.ts`
- timestamp: 2026-07-29T00:00:00Z
  observation: PR #217 remains open and mergeable, but its current base has advanced from CI's `4fd4affd` to `297b5478`; the repair must be validated against that current base, not only the historical failed merge.
  source: GitHub PR metadata

- timestamp: 2026-07-29T00:00:00Z
  observation: Current base `297b5478` has already advanced `manifest-intent-dispatch.test.ts` to the same long runtime-integration form as PR head, eliminating the historical three-method `ServiceRuntimeContext` fixture. The PR head belongs to `jodobear/kehto-web`, which is the local `origin` push remote.
  source: current-base source inspection and GitHub PR/local-remote metadata

- timestamp: 2026-07-29T00:00:00Z
  observation: GitHub's current `refs/pull/217/merge` is still historical merge `6d41e76` with base `4fd4affd`, even though PR metadata now names base `297b5478`. A new PR-head commit is needed to regenerate GitHub's merge check against the updated base.
  source: live PR metadata and fetched pull-request merge ref

- timestamp: 2026-07-29T00:00:00Z
  observation: The planned no-commit merge reports `Already up to date`, proving current base `297b5478` is already contained in PR head `146b2f03`. The local source is compatible; the remaining failing status comes solely from GitHub retaining old merge ref `6d41e76`.
  source: isolated PR branch merge probe

- timestamp: 2026-07-29T00:00:00Z
  observation: Pushed fast-forward empty commit `b540d9c1458bb770af7e26df61ad12ade85dcbb5` to the PR head branch. It leaves the compatible source tree unchanged while triggering GitHub to regenerate the stale pull-request merge ref and CI status.
  source: `origin/feat/paja-standard-nap-social-cache-current` push result

- timestamp: 2026-07-29T00:00:00Z
  observation: GitHub accepted pushed head `b540d9c1` and started fresh CI run `30443931007`; the Changeset Guard already passed, while CI is in progress.
  source: GitHub Actions run list for pushed commit

- timestamp: 2026-07-29T00:00:00Z
  observation: The pushed-head full type-check completed successfully (32 build tasks and 17 type-check tasks). Its captured output did not contain the subsequent focused-test invocation, so that adjacent regression signal must be run separately rather than inferred.
  source: local pushed-head `pnpm type-check` output

- timestamp: 2026-07-29T00:00:00Z
  observation: The first focused Vitest command used a package-local path that does not match this repository's root-relative Vitest include glob, so it found no tests. This was a command-selection error, not a test failure.
  source: Vitest output

- timestamp: 2026-07-29T00:00:00Z
  observation: The root-relative focused regression test passed: `manifest-intent-dispatch.test.ts` ran 5 tests with zero failures on pushed head `b540d9c1`.
  source: local Vitest run

- timestamp: 2026-07-29T00:00:00Z
  observation: Fresh CI run `30443931007` for pushed head `b540d9c1` regenerated and completed, but its Build & Type-Check job `90549618830` failed at Type-check all packages while build, CSP audit, and Vitest passed. The stale-ref refresh hypothesis is falsified; inspect the new job's exact diagnostic before any further fix.
  source: GitHub Actions run status

- timestamp: 2026-07-29T00:00:00Z
  observation: The fresh CI log still reports the identical sole error, `manifest-intent-dispatch.test.ts(18,3) TS2741` for the three-method context fixture. Refreshing the PR head did not remove the source combination that produces the historical diagnostic.
  source: fresh Build & Type-Check job log lines 1775-1793

- timestamp: 2026-07-29T00:00:00Z
  observation: Fresh CI checked out new merge `f9d9a0b1`, but its checkout log explicitly says it merged new PR head `b540d9c1` into the old base `4fd4affd`, not current metadata base `297b5478`. This retains the historical incompatible fixture and explains the repeated TS2741.
  source: fresh CI checkout log lines 108-156

- timestamp: 2026-07-29T00:00:00Z
  observation: A local no-commit merge of obsolete CI base `4fd4affd` into pushed PR head `b540d9c1` completes without conflicts but stages the same broad base delta GitHub is using. The reconciliation branch now has old base as `MERGE_HEAD`; this is the precise tree to inspect and repair before committing.
  source: isolated merge probe (`MERGE_HEAD=4fd4affd`, no unmerged paths)

- timestamp: 2026-07-29T00:00:00Z
  observation: The local regular reconciliation merge contains the short 117-line old-base fixture and directly reproduces the sole TS2741 after a CI-equivalent build. This matches fresh CI exactly and proves the proposed topology-level repair targets the actual failing tree.
  source: reconciliation worktree source and direct services type-check

- timestamp: 2026-07-29T00:00:00Z
  observation: Created content-preserving merge commit `fd2615dd` with parents `b540d9c1` and obsolete base `4fd4affd`. Its source-tree diff from `b540d9c1` is empty, so it preserves the local full type-check and focused-test results while recording the stale base as an ancestor.
  source: isolated reconciliation branch commit and diff

- timestamp: 2026-07-29T00:00:00Z
  observation: Fast-forward-pushed reconciliation merge `fd2615dd` to PR #217's head branch, triggering a new GitHub Actions run against the ancestry that contains obsolete CI base `4fd4affd`.
  source: origin push result

- timestamp: 2026-07-29T00:00:00Z
  observation: Fresh CI run `30444798619` is in progress for reconciliation head `fd2615dd`; its Changeset Guard has already passed.
  source: GitHub Actions run list

- timestamp: 2026-07-29T00:00:00Z
  observation: Fresh reconciliation CI Build & Type-Check job `90552439669` completed its Type-check all packages step successfully. The original TS2741 is absent; only the docs quality gate remained in progress at observation time.
  source: GitHub Actions run `30444798619` job status

- timestamp: 2026-07-29T00:00:00Z
  observation: Reconciliation CI's Build & Type-Check job `90552439669` passed every executed step, including Build, CSP audit, Type-check all packages, and Docs quality gate. CI Vitest also passed; only the scoped Playwright job remained in progress.
  source: GitHub Actions run `30444798619` job status

- timestamp: 2026-07-29T00:00:00Z
  observation: GitHub regenerated PR merge `cc93d055` with parents old base `4fd4affd` and reconciliation head `fd2615dd`; its tree is byte-identical to `fd2615dd`. The topology fix therefore prevents the obsolete fixture from being reapplied and directly explains the fresh type-check pass.
  source: fetched current `refs/pull/217/merge` topology/tree comparison

- timestamp: 2026-07-29T10:50:28Z
  observation: An initial status query against `jodobear/kehto-web` returned GitHub API 404 for CI run `30444798619`; the run belongs to a different GitHub repository or is not visible through that remote. This is a monitoring-target error, not evidence against the reconciliation fix.
  source: `gh run view --repo jodobear/kehto-web 30444798619`

- timestamp: 2026-07-29T10:51:00Z
  observation: The exact PR worktree has fork remote `jodobear/kehto-web` but upstream `kehto/web`; GitHub CLI's default repository is `kehto/web`. The CI run IDs must be queried through upstream, while the PR head push correctly went to the fork remote.
  source: exact worktree `git remote -v` and `gh repo view`

- timestamp: 2026-07-29T10:52:00Z
  observation: Upstream `kehto/web` CI run `30444798619` completed successfully for reconciliation head `fd2615dd`. Build & Type-Check passed build, CSP audit, Type-check all packages, and docs quality; Vitest and scoped Playwright both passed. The original TS2741 is absent in the exact fresh GitHub synthetic-merge workflow.
  source: GitHub Actions run `30444798619`, Build & Type-Check job `90552439669`, and Playwright job `90552798306`

- timestamp: 2026-07-29T10:54:00Z
  observation: Reconciliation commit `fd2615dd` has an empty tree diff from pre-fix head `b540d9c1`; it cannot be a behavior-deleting code patch. No Stryker configuration exists in the exact reconciliation worktree, so mutation testing is inapplicable to this topology-only fix. PR #217 is open, mergeable, at `fd2615dd`, with all six required checks successful; its current GitHub metadata reports base SHA `4fd4affd`.
  source: exact-worktree Git tree comparison, scoped `stryker` inventory, and upstream PR API

- timestamp: 2026-07-29T10:56:00Z
  observation: PR #217's actual upstream base is `kehto/web` `main` at `4fd4affd`, exactly the parent used by GitHub's fresh merge. The PR API and upstream ref agree, and its public timeline contains no base-ref-change event. The final diagnosis must not claim that GitHub currently ignores PR base metadata.
  source: GitHub pull API, upstream `ls-remote`, and PR timeline API

- timestamp: 2026-07-29T10:58:14Z
  observation: Reporter independently confirmed PR #217 head `fd2615dda1d08102a9fad8a70f38fdf7daba70e4`, base `4fd4affd`, open/mergeable/clean state, and successful Build & Type-Check, Vitest, Playwright, scope-detection, and Changeset Guard checks in upstream run `30444798619`.
  source: human-verify checkpoint response

- timestamp: 2026-07-29T10:58:14Z
  observation: The initial temporary-worktree preflight was invalid because zsh reserves `path` for `$PATH`; the loop variable shadowed command lookup and caused every `git` subcommand to fail before inspecting a worktree. No worktree or ref was modified.
  source: local cleanup preflight output

- timestamp: 2026-07-29T10:59:55Z
  observation: All five session-owned temporary worktrees are clean. Their heads are `4fd4affd`, `6d41e76`, `b540d9c1`, `fd2615dd`, and `146b2f03`; three retain their named local branches. Removal can safely unregister only those worktrees without deleting branches or refs.
  source: local worktree cleanliness preflight

- timestamp: 2026-07-29T11:00:29Z
  observation: Removed exactly the five clean temporary worktrees created for this debug session using `git worktree remove`, without force removal or branch/ref deletion.
  source: local worktree removal command

- timestamp: 2026-07-29T11:01:04Z
  observation: The five session-owned `.tmp-pr-217-*` worktrees are absent from the registered worktree list. The three session branches remain present, and all other worktrees (including the unrelated fork-sync temporary worktree and locked agent worktrees) remain registered.
  source: local worktree and branch inventory

- timestamp: 2026-07-29T11:03:22Z
  observation: MemPalace indexing was skipped because its CLI is unavailable in this environment. The durable, redacted knowledge-base entry was written successfully and remains the fallback for future keyword recall.
  source: local tool availability check

## Eliminated

- hypothesis: GitHub's final reconciliation run ignores current PR base metadata and independently pins an obsolete base
  evidence: Current GitHub PR metadata and `upstream/main` both resolve to `4fd4affd`, the exact base in the successful synthetic merge. The final observed state is ordinary pull-request merge behavior, not a metadata-versus-merge mismatch.
  timestamp: 2026-07-29T10:56:00Z
- hypothesis: refreshing GitHub's stale synthetic merge ref alone makes the fresh PR CI pass
  evidence: disproved by CI run `30443931007`: after pushed head `b540d9c1` triggered a fresh run, Build & Type-Check failed again at its Type-check step.
  timestamp: 2026-07-29T00:00:00Z
- hypothesis: PR #217's own manifest-intent fixture omitted required `hasCapability`
  evidence: disproved by parent diffs: CI merge `6d41e76` has no change to `manifest-intent-dispatch.test.ts` from base parent `4fd4affd`, while it differs from PR parent `146b2f03`. The failing short fixture comes from the base branch, not PR #217.
  timestamp: 2026-07-29T00:00:00Z
- hypothesis: a direct `@kehto/services` type-check immediately after frozen install reproduces CI
  evidence: disproved as a valid experiment because workspace `@kehto/runtime` declarations had not been built; the compiler stopped on many `TS2307` missing-module errors before it could faithfully type-check the required context fixture.
  timestamp: 2026-07-29T00:00:00Z
- hypothesis: building only `@kehto/runtime` creates the declaration set required to type-check services
  evidence: disproved because runtime's declaration build requires `@kehto/acl/capabilities` declarations, so the build stopped on TS2307 and services then saw incomplete runtime declarations. CI's full ordered build must be mirrored.
  timestamp: 2026-07-29T00:00:00Z
- hypothesis: `pnpm build -- --force` forces Turbo without altering package build commands
  evidence: disproved because pnpm forwarded `--force` to every package script (`tsup --force`/`vite build --force`), where tsup rejects it. The build therefore did not recreate CI's outputs.
  timestamp: 2026-07-29T00:00:00Z
- hypothesis: package-local Vitest path `src/manifest-intent-dispatch.test.ts` selects the regression test
  evidence: disproved as an invalid test command because root Vitest configuration glob patterns are repository-relative (`packages/*/src/**/*.test.ts`); the command found no test files.
  timestamp: 2026-07-29T00:00:00Z
- hypothesis: merging current base `297b5478` into PR head creates a new integration commit
  evidence: disproved because Git reports `Already up to date`: current base is already an ancestor of PR head `146b2f03`. There is no source merge to commit; only the stale GitHub pull-request merge ref remains.
  timestamp: 2026-07-29T00:00:00Z

## Resolution

- root_cause: PR #217's actual base (`kehto/web` `main` at `4fd4affd`) and the PR head carried incompatible pieces of the services test contract: the base fixture constructs `ServiceRuntimeContext` without required `hasCapability`, while the PR adds that required runtime API. Because pull-request CI type-checks GitHub's synthetic merge rather than the fork head, the combined tree emits TS2741. The failure requires both conditions; no current evidence supports a GitHub metadata-staleness defect.
- fix: Created and fast-forward-pushed content-preserving reconciliation merge `fd2615dd` with base `4fd4affd` as a parent while retaining the type-complete PR tree (empty source-tree diff from `b540d9c1`). GitHub's regenerated merge tree is byte-identical to `fd2615dd`, so it no longer reintroduces the three-method base fixture.
- verification:
    target_test:
      result: pass
      evidence: "Fresh GitHub synthetic-merge Build & Type-Check job 90552439669 passed its Type-check all packages step with no TS2741."
    mutation_check:
      result: skipped
      reason_if_skipped: "No Stryker configuration exists, and this fix changes Git ancestry rather than mutable source lines."
      mutant_killed: not_applicable
    no_op_deletion:
      result: pass
      evidence: "The fix is an empty source-tree diff from b540d9c1; it deletes no behavior and only reconciles merge ancestry."
      deletion_justified_by_rca: not_applicable
    adjacent_tests:
      result: pass
      suites_run:
        - "Focused packages/services/src/manifest-intent-dispatch.test.ts: 5 passed"
        - "GitHub CI Vitest job 90552439658: passed"
        - "GitHub CI Playwright job 90552798306: passed"
    revert_and_reconfirm:
      result: pass
      bug_returned_on_revert: true
      fixed_on_reapply: true
      evidence: "The pre-fix topology (b540d9c1 merged with 4fd4affd) reproduced TS2741 locally and in GitHub CI run 30443931007; reapplying ancestry reconciliation as fd2615dd produced a byte-identical GitHub merge tree and passed run 30444798619."
    human_confirmation:
      result: pass
      evidence: "Reporter independently confirmed the exact reconciliation head, clean merge state, and all required GitHub checks in run 30444798619."
    guardrail_verdict: accepted
- files_changed: []
- git_history_changed:
    - "fd2615dda1d08102a9fad8a70f38fdf7daba70e4 (content-preserving reconciliation merge)"
