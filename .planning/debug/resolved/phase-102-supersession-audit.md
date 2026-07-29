---
slug: phase-102-supersession-audit
status: resolved
trigger: "Phase 102 supersession/rebase audit. Start from .planning/HANDOFF.json and .planning/phases/102-paja-standard-nap-social-poc/.continue-here.md. Recreate or validate isolated contribution checkout from feat/paja-standard-nap-social-cache@05fa2e6c, fetch current kehto/web upstream, compare exact implementation against upstream main and merged PR #204 by files/symbols/wire behavior/9 verified truths, inspect current @napplet/nap identity/outbox contracts and owning napplet/naps specs, produce a supersession matrix, then retain/shrink/drop decision. Do not alter implementation or open PR until matrix and NAP authority checks are complete. Preserve planning/source separation and unrelated Writer state."
created: 2026-07-28
updated: 2026-07-28T18:11:00+05:30
---

# Debug: Phase 102 Supersession Audit

## Symptoms

**Expected:** Determine against current authoritative upstream whether the reviewed Phase 102 Paja social-cache contribution remains necessary, which parts survive, and whether it should be retained, reduced, or dropped. Only after an exact supersession matrix and NAP authority check may the contribution be rebased, adapted, fully revalidated, pushed, and proposed upstream.

**Actual:** Phase 102 passed 9/9 verification on an older Kehto baseline, but `kehto/web` subsequently merged PR #204 and advanced through broad Paja, package, convention, and intent changes. No exact file/symbol/wire/behavior comparison has established equivalence or obsolescence. The preserved contribution refs remain at `05fa2e6c`, while the expected isolated checkout `/workspace/projects/kehto/paja-social-cache-contribution` is absent.

**Error messages:** Upstream PR creation previously failed with `GraphQL: Resource not accessible by personal access token`. No implementation failure is currently established; baseline drift is the blocking uncertainty.

**Timeline:** Phase 102 implementation and old-baseline verification completed 2026-07-24. Related Napplet/NAP changes merged 2026-07-24 through 2026-07-27. Work paused for supersession audit on 2026-07-28.

**Reproduction:** Compare `origin/feat/paja-standard-nap-social-cache@05fa2e6c` with freshly fetched `kehto/web` upstream `main`, including merged PR #204. Trace each changed file, symbol, standard identity/outbox wire operation, and all nine truths in `102-VERIFICATION.md`. Inspect current packaged `@napplet/nap` declarations and owning `napplet/naps` authority before changing code.

## Current Focus

bug_class: mandelbug — Writer preview restoration was an environment/process-lifecycle investigation. SBFL was not applicable.
hypothesis: CONFIRMED — the `b5g111pz2` status 143 belonged to its launcher rather than Vite: its artifact records successful startup while detached PID 1437992 continuously owned 4173 and served HTTP 200. Exact full-environment equivalence remains unprovable because the protected snapshot was deleted and its hash serialization is undocumented.
test: Completed — validated the supersession matrix, successful isolated rebase probe, focused/build/type/browser signals, and a 60-second seven-sample Writer health run with listener/process identity checks.
expecting: Met — the human accepted operational Writer restoration as sufficient for this audit. The environment-fidelity limitation is retained as evidence, not reported as a restoration failure.
next_action: Commit the knowledge-base entry, then report closure. Do not restart the healthy 4173 preview, signal Paja PID 4090308 or its 5173 descendants, alter Writer or implementation source, update unrelated planning state, or open a PR.
restoration_outcomes:
  chromium_tracer: "PASS — isolated-probe Chromium standard-envelope tracer: 1 passed / 0 failed in 9.3 seconds."
  writer_preview: "ACCEPTED OPERATIONAL RESTORATION — detached PID 1437992 is the sole 127.0.0.1:4173 listener; its Writer cwd and Vite 6.4.3 preview argv match captured metadata; seven HTTP probes over 60 seconds returned 200."
  environment_fidelity: "LIMITED — exact full-environment equality cannot be reproduced because the protected snapshot was removed and the historical environment-digest serialization was not retained."
  protected_paja: "PRESERVED — PID 4090308, its 5173 launcher child 4090321, and Vite listener 4090334 remained alive and unchanged."
restoration_scope:
  authorized_listener: "Writer Vite preview on 127.0.0.1:4173 only"
  protected_processes: "Paja parent PID 4090308 and its Vite 5173 child"
  prohibited_changes: "Writer source files, implementation files, PR creation"
  success_criteria: "Reconstructable Writer startup metadata; listener remains healthy over repeated HTTP probes; protected Paja processes unchanged."

## Evidence

- timestamp: 2026-07-28T16:25:55+05:30
  source: `.planning/HANDOFF.json`, `.planning/phases/102-paja-standard-nap-social-poc/.continue-here.md`, local Git refs
  finding: The contribution branch exists locally and remotely at `05fa2e6c01691f2d6892aae63389a8142b3c22b6`; local `upstream/main` was `297b5478ead54508a881909e658fda0c8ee19984`; the expected isolated contribution directory is missing.
  confirms: Work is preserved, but the audit must recreate isolation and refresh mutable upstream state before judgment.
- timestamp: 2026-07-28T16:25:55+05:30
  source: GitHub PR metadata
  finding: `kehto/web#204`, `napplet/web#186`, and `napplet/naps#89/#90/#92` are merged. Their titles and domains are adjacent to Phase 102 but do not alone prove behavioral supersession.
  confirms: File/symbol/wire/truth comparison is mandatory; PR-title equivalence is unsafe.
- timestamp: 2026-07-28T16:28:57+05:30
  source: local Git refs/worktree registry; project-skill discovery; existing Graphify query
  finding: The preserved contribution and cached `upstream/main` still resolve to `05fa2e6c` and `297b5478`, respectively. The contribution worktree is registered but marked prunable because its path is absent. No project-defined skill or configured debugger skill was found. The existing graph reached Paja, identity, intent, and outbox nodes but the broad traversal is insufficient to establish contribution/PR-204 equivalence.
  confirms: Recreate the isolated worktree after authoritative fetch; use direct Git and contract evidence rather than graph traversal or planning assertions to decide supersession.
- timestamp: 2026-07-28T16:28:57+05:30
  source: Phase-0 knowledge-base check
  finding: `.planning/debug/knowledge-base.md` is absent; semantic recall has no durable local fallback candidate.
  confirms: Query MemPalace if available, log its result, then continue with independent hypotheses.
- timestamp: 2026-07-28T16:29:58+05:30
  source: `mempalace search`; `git fetch --prune upstream main`; `git fetch --prune origin feat/paja-standard-nap-social-cache`; `git ls-remote`
  finding: MemPalace is unavailable and no local knowledge base exists, so no known-pattern candidate applies. Fetching both remotes succeeded; cached and remote `upstream/main` agree at `297b5478ead54508a881909e658fda0c8ee19984`, and the preserved contribution remains `05fa2e6c01691f2d6892aae63389a8142b3c22b6`.
  confirms: The audit baseline is current and immutable for this session; direct differential evidence can now test the retain/adapt hypothesis.
- timestamp: 2026-07-28T16:31:04+05:30
  source: recreated contribution worktree; `git merge-base`; `git diff --name-status/--stat upstream/main...feat/paja-standard-nap-social-cache`
  finding: The stale worktree registration was safely pruned and `/workspace/projects/kehto/paja-social-cache-contribution` was recreated cleanly at `05fa2e6c`. Its merge base with current upstream is `738c3ce5`. The net contribution delta is 13 files and 1,164 additions / 15 deletions: a new `packages/paja/src/browser-social-cache.ts` plus its test, Paja adapter/relay runtime integration and tests, identity-service test, Paja browser E2E test, docs, and a Paja changeset.
  confirms: There is a bounded implementation delta to classify. The raw symmetric-history listing contains both branch histories, so only direct file/symbol/wire comparison can establish supersession.
- timestamp: 2026-07-28T16:32:36+05:30
  source: detached `upstream/main` audit worktree; Phase 102 verification; full contribution `browser-social-cache.ts`, `browser-adapter.ts`, and `browser-relay-runtime.ts`; PR #204 metadata
  finding: A clean detached audit checkout was created at `297b5478`. The nine truths require request-start identity correlation, account/generation-isolated private kind-3/kind-0 cache warming, base-first outbox semantics, validated deterministic kind-3 replacement, race safety, CORS diagnostic retention, docs/changeset, scoped NAP authority, and browser-inclusive proof. Contribution code implements this through `createPajaSocialCache`, adapter injection into standard identity/outbox services, and a bounded host-owned kind-3 loader.
  confirms: PR #204's broad convention/intent summary is not behavioral equivalence evidence; the next falsifiable test is its Paja-only diff and current upstream symbol/wire inventory.
- timestamp: 2026-07-28T16:36:10+05:30
  source: filtered `b85db51d^1..b85db51d` Paja diff; complete current Paja adapter/relay/host and services identity/outbox sources; current-versus-contribution docs search
  finding: PR #204 changed 26 Paja files for intent catalog/target handling, theme delivery, host split, diagnostics, and publish settlement. Its adapter diff does not alter identity/outbox composition; its relay diff changes publish settlement only. Current upstream has no `browser-social-cache.ts` or `createPajaSocialCache`; it wires a plain base router to outbox and `createPajaIdentityProviders` to identity. That provider does a raw `limit: 1` kind-3 query, orders only by timestamp, does not verify signatures, does not warm kind-0 profiles, and does not decorate outbox results. Current host still invokes `reportTargetCorsDiagnostic`. Current docs contain no social-cache or standard follows/outbox description, while all three contribution docs describe the private standard-NAP cache.
  confirms: Truths 4, 5, 7, and the kind-0/cache portion of 2–3 are not supplied upstream; truth 1 is only partially supplied (generic request-key capture plus basic follows); truth 6 is already retained but its regression must adapt; PR #204 causes rebase mechanics, not behavioral supersession.
- timestamp: 2026-07-28T16:37:29+05:30
  source: GitHub `napplet/naps` master and PR #32 metadata; local planning-checkout lock/store inspection
  finding: NAP master is still `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24` and lists NAP-IDENTITY but no NAP-OUTBOX. NAP-OUTBOX PR #32 remains open at the pinned `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e`. Current upstream Paja source requires `@napplet/nap >=0.29.0 <0.30.0`; however the planning checkout's lock/store contains only 0.28.0, so it is stale environment evidence and cannot establish the current-upstream package contract.
  confirms: NAP-OUTBOX remains a draft authority and planning/source separation is material; inspect the detached upstream lock/declarations rather than reusing the planning worktree installation.
- timestamp: 2026-07-28T16:40:04+05:30
  source: raw `napplet/naps` NAP-IDENTITY at `5ac0490` and NAP-OUTBOX at `4589a8f`; SHA-256 byte comparison against pinned identity `6461e4b`; detached upstream lock; npm `@napplet/nap@0.29.0` tarball declarations
  finding: NAP-IDENTITY remains byte-identical to pinned `6461e4b` and requires read-only correlated `identity.getFollows` / `identity.getFollows.result` with `id`, `pubkeys`, and optional `error`. Master still omits NAP-OUTBOX; its open pinned draft defines correlated `outbox.query` / `outbox.query.result` with `id`, NIP-01 filters, required deduplicated `events`, optional `incomplete` and `error`, and shell-owned routing/signature validation. The detached upstream lock resolves `@napplet/nap@0.29.0`; its published declarations expose the same identity and outbox envelope/result fields. The cache's standard identity/outbox wire use remains conformant, but its authority note must move from installed 0.28 to 0.29 and retain the OUTBOX-draft qualification.
  confirms: Authority does not supersede or prohibit the cache; it precisely constrains the rebase and documentation adaptation.
- timestamp: 2026-07-28T16:40:04+05:30
  source: exact file/symbol/wire comparison of `05fa2e6c` against `upstream/main@297b5478`, PR #204 Paja diff, and current NAP/package authority
  finding: "Supersession matrix — T1 request-start identity/follows: PARTIAL upstream, RETAIN contribution wiring (generic identity preserves captured key but Paja supplies only raw kind-3 follows); T2 private active-account kind-0 cache: ABSENT upstream, RETAIN; T3 base-first outbox query/degradation: BASE PRESENT upstream, RETAIN decorator and regression; T4 verified deterministic kind-3 selection: ABSENT upstream, RETAIN; T5 account/generation race isolation: ABSENT upstream, RETAIN; T6 target-CORS diagnostic: PRESENT upstream, DROP duplicate behavior but ADAPT the regression to current host topology; T7 social-cache docs/changeset: ABSENT upstream, RETAIN and rewrite against current Paja docs/version; T8 NAP authority: COMPATIBLE but old evidence stale, ADAPT from 0.28 to 0.29 while preserving NAP-OUTBOX-draft wording; T9 browser-inclusive release evidence: OLD-BASELINE ONLY, RETEST after rebase. PR #204 is ADJACENT, not a behavioral replacement."
  confirms: Decision is RETAIN AND ADAPT/SHRINK: retain the unique social-cache behavior, omit any duplicate CORS implementation, adapt composition/tests/docs/authority evidence, and do not drop the contribution.
- timestamp: 2026-07-28T16:42:15+05:30
  source: clean `audit/phase-102-rebase-probe` worktree and bounded `git rebase --rebase-merges upstream/main`
  finding: The probe began replaying 23 contribution-only commits. Its first substantive social-cache commit auto-merged adapter and relay-runtime changes, added the missing social-cache module, and produced exactly one conflict: `tests/e2e/paja-single-window.spec.ts`. No implementation conflict occurred before the E2E topology conflict. The rebase was aborted, restoring the probe cleanly at `05fa2e6c`; the preserved contribution branch was not modified.
  confirms: The retain/adapt decision survives a causal rebase experiment. The next change is a targeted test-topology adaptation, not a broad rewrite or a behavioral drop.
- timestamp: 2026-07-28T16:43:35+05:30
  source: complete old and current `paja-single-window.spec.ts`; contribution cache/relay/host tests
  finding: The conflict is structural: current E2E owns shim-prelude, INC, theme, and expanded fixture topology, while the contribution adds a self-contained signed kind-3/kind-0 standard-envelope tracer plus `Origin: null` CORS oracle. The tracer can retain current fixtures and helpers, add only `finalizeEvent`/key imports, origin capture plus CORS header, and the focused social test. Contribution cache tests cover validation/order/races/filter/limit/dedupe/degradation/delegation; host static guards also need current-path adaptation because CORS diagnostics moved to `browser-target-diagnostics.ts`.
  confirms: The conflict resolution has a minimal, explicit merge shape and preserves both current Paja test coverage and the Phase 102 oracle.
- timestamp: 2026-07-28T16:46:16+05:30
  source: resumed isolated probe rebase after the E2E merge
  finding: The Paja E2E resolution committed as `5227499c`: current shim/INC/theme topology was preserved and the signed standard social tracer/CORS assertion was added. The rebase then auto-applied six more contribution commits and reached its next, sole conflict in `docs/packages/paja.md`; the changeset, Paja README, and authoring guide auto-merged. No additional source-code conflict has appeared.
  confirms: Rebase adaptation remains bounded to known changed surfaces; resolve package documentation against the current 0.29 authority before testing code behavior.
- timestamp: 2026-07-28T16:47:59+05:30
  source: current/contribution/probe Paja package documentation; resumed rebase
  finding: The Paja package-doc conflict was only the old `0.8.2` version row. Resolution retained current `0.9.0`, preserved current documentation, added the social-cache boundary, and updated all three contribution doc surfaces from installed `@napplet/nap@0.28.0` to current `0.29.0` while preserving the NAP-OUTBOX-draft limitation. The next conflict is an unrelated firewall-package version-row commit (`5575dd54`), explicitly outside Phase 102 social-cache behavior.
  confirms: This unrelated documentation correction must be dropped rather than carried into the focused contribution; this is scope shrink, not a social-cache regression.
- timestamp: 2026-07-28T16:48:57+05:30
  source: probe rebase after skipping `5575dd54`
  finding: The rebase passed six further commits and reached a single conflict in `packages/paja/src/browser-relay-runtime.test.ts` while applying the bounded contact-list candidate fix. Its paired runtime source auto-merged. This is a Paja-specific test conflict expected from PR #204's new relay publish-settlement tests, not a behavior conflict in the contact loader itself.
  confirms: Merge current relay test coverage with the contribution's bounded candidate, early close, and close-rejection oracles; do not drop the resource-boundary regression.
- timestamp: 2026-07-28T16:50:54+05:30
  source: completed isolated `audit/phase-102-rebase-probe` rebase
  finding: The probe rebase completed cleanly at `6a69494c291a2899585a2b805d044e643b36e02b`. The relay-test resolution retained current publish-settlement tests and all later contribution commits correctly added bounded live-query, close-rejection, and generic-query regressions. The probe worktree is clean. The preserved contribution branch remains unchanged at `05fa2e6c`.
  confirms: The exact supersession matrix and NAP authority checks now have a successful rebase result: retain/adapt is mechanically feasible and excludes the unrelated firewall correction.
- timestamp: 2026-07-28T16:52:07+05:30
  source: post-rebase ancestry and diff audit; dependency preflight
  finding: The rebased probe has `upstream/main@297b5478` as its direct merge base, a clean worktree, and exactly 12 changed paths / 1,155 additions / 11 deletions. It excludes the unrelated firewall document and retains only Paja cache/integration/tests, identity regression, E2E tracer, Paja docs, and Paja changeset. `git diff --check` passes. The probe has no node_modules, while Corepack supplies pnpm 10.8.0, so a frozen install is required to test current 0.29 declarations rather than stale planning dependencies.
  confirms: Scope hygiene is now exact; dependency installation is verification setup, not a source or authority change.
- timestamp: 2026-07-28T16:53:40+05:30
  source: verification command root and Git status inspection
  finding: REVOKED — the earlier frozen install and 47-passing focused test command lacked a probe workdir and ran under `/workspace/projects/kehto/web` (the planning checkout), so they do not verify the rebased 0.29 probe. Git status confirms no source changes were introduced: planning retains only pre-existing `.planning/STATE.md` plus this debug file, and the probe remains clean.
  confirms: Repeat every acceptance signal with explicit probe `-C` paths; no prior test result may be used to accept the rebase.
- timestamp: 2026-07-28T16:55:05+05:30
  source: probe-scoped frozen install and focused Vitest run
  finding: The frozen 0.29 install completed in the probe. Focused tests ran from `/workspace/projects/kehto/paja-social-cache-rebase-probe`: 82 passed, 2 failed, both in `browser-host.test.ts`. One asserts the old in-file `reportTargetCorsDiagnostic` function even though current host imports/invokes it from `browser-target-diagnostics.ts`; the other expects Dev signer priority over fixed simulation but observed the fixed key. Cache, identity, and relay tests all passed.
  confirms: The only observed adaptation defects are isolated static-test/identity-priority reconciliation, not social-cache algorithm or standard-wire failures.
- timestamp: 2026-07-28T16:56:13+05:30
  source: complete final probe adapter/host/diagnostic/test sources; rebased `fix(paja): align development signer identity` commit `320567bf`
  finding: `getRuntimePubkey` correctly preserves the contribution's order: connected provider, then selected Dev signer, then fixed simulation. The failed test passed its signer object into the new `confirmRequest` slot because PR #204 inserted `onThemeBroadcast`, leaving `signerProvider` undefined. The CORS reporter is correctly exported from `browser-target-diagnostics.ts`, imported by host, and invoked after target navigation; only the static assertion still names the old in-file function.
  confirms: Modify the test only. Changing adapter source would undo a confirmed social identity safeguard, while retaining old path/signature assertions would create a false failure.
- timestamp: 2026-07-28T16:57:56+05:30
  source: probe-scoped focused Vitest rerun after the minimal browser-host test adaptation
  finding: All focused files pass from the rebased probe: 4 files, 84 tests, 0 failures. This includes social cache validation/race/outbox semantics, identity request-key correlation, bounded live contact queries, current publish settlement, extracted CORS diagnostic wiring, and Dev signer priority under the post-PR-204 adapter signature.
  confirms: The minimal test-only rebase adaptation fixes the observed failures; proceed to build/type and browser integration verification.
- timestamp: 2026-07-28T16:59:04+05:30
  source: probe-scoped filtered Paja build and type-check
  finding: Both commands correctly ran in the probe but failed before evaluating Paja behavior because fresh workspace links point to unbuilt `@kehto/shell`, `@kehto/services`, `@kehto/nip`, and `@kehto/runtime` `dist` entries. The error set is missing-module/derived implicit-any noise, not a social-cache type mismatch. The filtered Paja build is therefore not an applicable independent signal until the workspace dependency build prerequisite is satisfied.
  confirms: Run the root dependency-aware build rather than changing Paja code or accepting the failed filtered commands as a rebase defect.
- timestamp: 2026-07-28T17:00:24+05:30
  source: probe-scoped root `pnpm build`
  finding: The root build began with the correct 33-package Turbo scope but exited before executing a package because Turbo could not locate a `pnpm` binary in PATH; Corepack was invoked as a wrapper rather than exposed as the package-manager binary. This is the known Corepack/Turbo runner precondition, not a source compilation error.
  confirms: Supply a temporary PATH shim, as required by prior Phase 102 verification, then rerun before interpreting build/type status.
- timestamp: 2026-07-28T17:01:29+05:30
  source: temporary `pnpm -> corepack` symlink experiment
  finding: REVOKED — the symlink exposes Corepack as version 0.34.0, not pnpm, and rejects pnpm's `-C` option. It cannot satisfy Turbo's package-manager discovery.
  confirms: The shim must be an executable wrapper that invokes `corepack pnpm`, not a symlink. No source files or worktree state changed.
- timestamp: 2026-07-28T17:03:26+05:30
  source: probe-scoped root build and filtered Paja type-check with explicit Corepack-pnpm wrapper
  finding: The wrapper reported pnpm 10.8.0 and enabled the full 32-task Turbo build: 32 successful, including `@kehto/paja` ESM and DTS outputs. The subsequent Paja `tsc --noEmit` completed successfully. Only known nonfatal build warnings remained (Playground chunk size; wm Turbo output declaration).
  confirms: Current 0.29 workspace dependencies and rebased Paja source compile cleanly; the remaining required acceptance signal is real browser standard-envelope behavior.
- timestamp: 2026-07-28T17:05:29+05:30
  source: probe-scoped `CI=1` focused Playwright invocation
  finding: Playwright exited before running the tracer because `config.webServer` did not become ready within 60 seconds. No browser assertion, social-cache message, or CORS result was produced.
  confirms: Browser behavior is unverified, but no implementation hypothesis is supported. Inspect and execute the configured server command before retrying.
- timestamp: 2026-07-28T17:05:29+05:30
  source: complete probe `playwright.config.ts` and root scripts
  finding: Playwright requires two preview servers: `@test/harness` at 4173 and `@kehto/playground` at 4174. In CI both set `reuseExistingServer: false`, which correctly prevents Writer-preview reuse. Both commands are raw `pnpm` invocations and therefore depend on the temporary wrapper being propagated to child processes.
  confirms: Test the two server commands and port ownership directly; the timeout is a runner-environment investigation, not evidence against the rebased cache.
- timestamp: 2026-07-28T17:09:08+05:30
  source: socket inspection and direct 15-second probe preview commands
  finding: An unrelated Node process owns `127.0.0.1:4173`. With the explicit Corepack-pnpm wrapper, both exact probe preview commands start successfully and announce `http://localhost:4173` / `:4174`; they were terminated only by the diagnostic timeout. The only browser-run blocker is the configured CI requirement for exclusive 4173, not a missing artifact, bad command, or social-cache assertion.
  confirms: Do not stop the unrelated Writer process. A coordinated human pause/restart is required before final browser verification.
- timestamp: 2026-07-28T17:26:36+05:30
  source: user-authorized Writer restart-metadata capture for `127.0.0.1:4173`
  finding: Exactly one listener owns 4173: PID `2959448`, a Writer Vite 6.4.3 preview running from `/workspace/projects/napplets/writer` with argv `node ./node_modules/.bin/../.pnpm/vite@6.4.3/node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort`. Its full environment and fd/ancestry details are captured in an ephemeral mode-0600 `/tmp/phase-102-writer-preview-20260728T115632Z.json` restart snapshot; no Writer repository file was changed.
  confirms: The tracer window can stop only PID `2959448` and restore the exact listener command/environment afterward, without terminating its parent Corepack or unrelated Writer processes.
- timestamp: 2026-07-28T17:27:33+05:30
  source: user-authorized port-release operation
  finding: Sent SIGTERM only to captured Writer listener PID `2959448`; a bounded post-signal socket check found no remaining TCP listener on 4173.
  confirms: The CI Playwright configuration can now claim its exclusive harness port. No parent/Corepack process or unrelated Writer file was modified.
- timestamp: 2026-07-28T17:29:00+05:30
  source: probe-scoped bounded `CI=1` Playwright run after exclusive port release
  finding: `tests/e2e/paja-single-window.spec.ts` test `routes standard identity follows and OUTBOX profile queries without a target-CORS false positive` passed in Chromium: 1 passed, 0 failed, 9.3 seconds under the 180-second bound. It used the probe's exclusive harness/playground preview configuration and the temporary Corepack-pnpm wrapper.
  confirms: Current 0.29 rebased Paja independently proves the standard `identity.getFollows` and `outbox.query` tracer plus target-CORS diagnostic oracle in a real browser; the remaining obligation is restoring the unrelated Writer preview.
- timestamp: 2026-07-28T17:30:07+05:30
  source: Writer restart from protected metadata snapshot
  finding: Restarted the captured Writer Vite preview as PID `1437992` from `/workspace/projects/napplets/writer` using the exact captured Vite 6.4.3 argv and environment. PID `1437992` is the sole 4173 listener and returned HTTP 200 `text/html` from `http://127.0.0.1:4173/`.
  confirms: The coordinated browser window restored Writer listener health after the bounded tracer without stopping its former parent process or writing any Writer source file.
- timestamp: 2026-07-28T17:31:26+05:30
  source: post-restart process and worktree inspection
  finding: Restored PID `1437992` is the sole 4173 listener; its cwd, argv, and full environment exactly match the pre-stop snapshot (environment SHA-256 `9140e3bae41efc82fbc2243de8b83775571e3a6b3f1e1f143d25b2fce6c3f258`), and loopback health remains HTTP 200. Writer status shows only two untracked PNG files (`Screenshot_20260724_102004.png`, `search-on-ctrl+f.png`); the probe has one modified expected adaptation path, `packages/paja/src/browser-host.test.ts`.
  confirms: Writer process restoration is faithful. Inspect the known probe test diff before accepting that no unanticipated source change occurred; do not touch either Writer image.
- timestamp: 2026-07-28T17:32:07+05:30
  source: exact rebased-probe diff and Writer artifact timestamp inspection
  finding: `git diff --check` passes. The probe's only uncommitted modification is precisely the prior `browser-host.test.ts` adaptation: static CORS assertions moved from the pre-PR-204 host-local function to exported `browser-target-diagnostics.ts`, and the new `onThemeBroadcast` callback slot is supplied before the existing Dev signer provider. The two Writer PNGs were last changed on 2026-07-24, before this 2026-07-28 coordinated window.
  confirms: The tracer/restart did not introduce a source change or Writer artifact. The sole probe diff is the minimal current-topology test reconciliation already validated by 84 focused tests and the browser tracer.
- timestamp: 2026-07-28T17:32:45+05:30
  source: post-restoration cleanup and health probe
  finding: The mode-0600 restart snapshot containing the Writer environment was removed from `/tmp`; the restored Writer process remains the sole 4173 listener and returns HTTP 200.
  confirms: No sensitive restart metadata remains after a successful faithful restoration; the operational checkpoint is complete.
- timestamp: 2026-07-28T17:34:41+05:30
  source: time-bounded guardrail revert-and-reconfirm in isolated probe
  finding: Stashing only the uncommitted `browser-host.test.ts` adaptation made its Vitest file fail exactly two relevant assertions: stale host-local `reportTargetCorsDiagnostic` placement and the shifted Dev signer callback position. Popping the stash restored the exact prior diff byte-for-byte, and the same file then passed 18/18 tests. Writer remained sole listener on 4173 and HTTP 200 throughout.
  confirms: The test adaptation is causal, not a coincidental green result; it corrects current Paja topology coverage without weakening the social-cache oracle.
- timestamp: 2026-07-28T17:35:36+05:30
  source: fix-acceptance guardrail completion
  finding: The probe delta against `upstream/main` comprises 12 behavior/doc/test paths with 1,158 additions and 11 deletions, including new cache implementation and regression files; it is not deletion-only or behavior-short-circuiting. No Stryker configuration or dependency exists, so mutation testing is explicitly unavailable. Target browser tracer passed, 84 focused tests passed, the full 32-task build and Paja type-check passed, and the one-file revert-and-reconfirm succeeded.
  confirms: All applicable fix-acceptance signals pass and the guardrail verdict is accepted; end-to-end human confirmation is the only remaining resolution step.
- timestamp: 2026-07-28T18:00:00+05:30
  source: human restoration-correction checkpoint
  finding: The replacement Writer background command `b5g111pz2` printed `Local http://127.0.0.1:4173/` then exited with status 143; current `ss` reports no 4173 listener. Writer Paja parent PID `4090308` and its Vite 5173 child remain.
  confirms: The previous operational-restoration pass is invalid. Chromium tracer verification remains a separate passing result, but Writer restoration is failed/incomplete and must be re-established without signalling the protected Paja processes.
- timestamp: 2026-07-28T18:02:00+05:30
  source: read-only socket and process inspection
  finding: Contrary to the checkpoint's prior socket snapshot, PID `1437992` now owns `127.0.0.1:4173` with argv `node …vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort`; PID `4090308` remains the protected Paja parent and its child `4090321` continues to run the Vite command for port 5173, whose listener is PID `4090334`. No signal was sent to either protected process. Writer's only worktree changes remain the two pre-existing untracked PNGs.
  confirms: The failed background-command handle is not sufficient evidence that the actual Vite child died. Restoration must be judged from the live listener's identity, metadata, and sustained health, while independently explaining the command's 143 status.
- timestamp: 2026-07-28T18:04:00+05:30
  source: read-only listener/session and immediate health inspection
  finding: PID `1437992` has PPID/PGID/SID `1/1437992/1437992`, cwd `/workspace/projects/napplets/writer`, Node executable `/nix/store/…/bin/node`, and the captured Vite 6.4.3 `preview --host 127.0.0.1 --port 4173 --strictPort` argv. Its three immediate loopback HTTP probes all returned 200. Its session/cgroup differs from the protected Paja chain, whose PID/PGID/SID remain `4090308/4090252/4090252`; port 5173 remains owned by child Vite PID `4090334`.
  confirms: The live Writer listener is independently detached from the terminating restart handle and has not disturbed the protected Paja process group. It remains necessary to confirm Writer's declared startup metadata and sustained health before accepting restoration.
- timestamp: 2026-07-28T18:05:00+05:30
  source: Writer declared startup metadata and in-progress stability probe
  finding: Writer declares `preview: vite preview --host 127.0.0.1`; its Vite configuration is a build/manifest configuration with no conflicting host or port override. The live listener adds the captured authorized `--port 4173 --strictPort` constraints. The first four 10-second-interval samples from the bounded probe retained PID `1437992` as listener owner and each returned HTTP 200.
  confirms: The live listener's reconstructed command is compatible with Writer's declared preview mode and has already remained healthy beyond the failed command-handle event; complete the bounded probe and metadata checksum before final acceptance.
- timestamp: 2026-07-28T18:07:00+05:30
  source: completed 60-second health probe and final process snapshot
  finding: All seven 10-second-interval loopback samples returned HTTP 200 while `1437992` stayed the sole 4173 listener. Final process state remains PID `1437992`, PPID/PGID/SID `1/1437992/1437992`, captured Vite 6.4.3 preview argv, and Writer cwd; Paja PIDs `4090308`, `4090321`, and `4090334` retain their original process group/session and 5173 listener. The raw current `/proc/1437992/environ` SHA-256 is `9efe94d49a952842e14d4497da35d99ede0d8ea0a9604d7a19c105718c6bf37f`, which differs from the earlier report's `9140e3…` value.
  confirms: Writer operational health and protected-process preservation are directly proven. The full-environment equivalence portion of the earlier restoration claim is not yet reproducible and requires a metadata-format check; do not claim faithful restoration until it is resolved.
- timestamp: 2026-07-28T18:08:00+05:30
  source: bounded retained-metadata lookup
  finding: The named protected snapshot `/tmp/phase-102-writer-preview-20260728T115632Z.json` and all narrowly matching Writer snapshot files are absent, as the prior cleanup recorded. The named background-command artifact exists at `/tmp/claude-1000/-workspace-projects-kehto-web/2e4bc815-6768-4194-b39a-1e9bd46637c2/tasks/b5g111pz2.output`. The debug record provides only the earlier environment digest, with no serialization method.
  confirms: No sensitive environment snapshot remains to compare directly, but the command artifact can still determine whether exit 143 described the Vite listener itself or merely its supervising launcher.
- timestamp: 2026-07-28T18:10:00+05:30
  source: `b5g111pz2` artifact and final restoration evaluation
  finding: The background artifact contains only Vite's successful `Local: http://127.0.0.1:4173/` startup line; the listener process it launched/observed is still PID `1437992`, an orphaned session leader, after seven HTTP-200 samples across 60 seconds. It therefore does not evidence Vite shutdown despite the background job's 143 result. The original full-environment snapshot is absent, the historical hash serialization is undocumented, and the current raw environment hash differs, so exact full-environment equality cannot be reproduced.
  confirms: Chromium tracer verification remains a separate PASS. Writer is operationally restored and protected Paja processes were preserved, but the requested standard of faithful restoration cannot be established from retained evidence; stop at a metadata-proof blocker rather than claim success.

## Eliminated

- hypothesis: The contribution was lost when the expected worktree disappeared.
  reason: Local and remote contribution refs both resolve to the preserved full commit `05fa2e6c01691f2d6892aae63389a8142b3c22b6`.
- hypothesis: Merged PR titles alone prove Phase 102 obsolete.
  reason: Existing handoff inspection found no direct browser social-cache file or follows plus followed-kind-0 cache implementation; exact equivalence remains untested.
- hypothesis: The prior firewall package-doc version correction belongs in the focused social-cache contribution.
  evidence: Probe rebase reached only an unrelated `docs/packages/firewall.md` version-row conflict after the social-cache docs were integrated; it is not part of the retained Paja implementation, authority, or regression surface.
  timestamp: 2026-07-28T16:47:59+05:30
- hypothesis: The Writer Vite listener exited when background command `b5g111pz2` returned status 143.
  evidence: PID `1437992` remains the same sole 4173 listener, is an orphaned session leader, and returned HTTP 200 in all seven samples over 60 seconds; its output artifact contains only the successful Vite startup banner.
  timestamp: 2026-07-28T18:10:00+05:30

- timestamp: 2026-07-28T18:11:00+05:30
  source: human verification checkpoint acceptance; prior tracer and restoration evidence
  finding: The user accepted operational Writer restoration as sufficient for audit closure. PID `1437992` is the stable sole 4173 listener with captured Writer cwd/argv and seven HTTP-200 samples over 60 seconds; Paja PIDs `4090308`, `4090321`, and `4090334` were not signalled or changed. The isolated Chromium standard-envelope tracer remains PASS (1 passed, 0 failed, 9.3 seconds).
  limitation: The protected full-environment snapshot was deliberately removed; its historical SHA-256 has no retained serialization method and differs from the current raw `/proc` environment hash. Exact full-environment equality is therefore not demonstrable and is explicitly outside the accepted operational-restoration claim.
  confirms: The supersession audit, rebase-probe acceptance signals, browser proof, and operational-restoration obligation are complete. Archive without implementation changes, Writer-file changes, or PR creation.

## Resolution

root_cause: "The preserved Phase 102 branch targets pre-PR-204 Paja composition and 0.28 authority evidence, while current upstream has new adapter/host/intent and dependency surfaces but does not implement the branch's validated private social-cache behavior."
supersession_decision: "RETAIN AND ADAPT/SHRINK — PR #204 is adjacent rather than a behavioral replacement. Keep the unique social-cache behavior; omit duplicate CORS behavior; adapt composition, tests, docs, and authority evidence after rebase."
fix: "Completed in isolated probe `audit/phase-102-rebase-probe`: retained only the 12-path social-cache delta, dropped the unrelated firewall-doc correction, adapted Paja E2E/host static tests and docs to current APIs, and updated authority evidence to @napplet/nap 0.29 with NAP-OUTBOX-draft wording. No implementation change was made in this planning checkout during audit closure."
verification:
  target_test:
    result: pass
    oracle_type: specified
    test: "tests/e2e/paja-single-window.spec.ts — routes standard identity follows and OUTBOX profile queries without a target-CORS false positive"
    command: "CI=1 PATH=/tmp/kehto-pnpm-shim:$PATH timeout 180s pnpm -C probe exec playwright test … --project=chromium --grep exact-name"
    result_detail: "1 passed, 0 failed, 9.3 seconds"
  mutation_check:
    result: skipped
    reason_if_skipped: "No Stryker configuration or dependency exists in the rebased probe."
    mutant_killed: null
  no_op_deletion:
    result: pass
    deletion_justified_by_rca: false
    result_detail: "12-path delta is 1,158 additions / 11 deletions and adds cache implementation, regression tests, docs, and changeset; no behavior-deleting or assertion-weakening hunk found."
  adjacent_tests:
    result: pass
    suites_run:
      - "84 focused Paja/cache/identity/relay/host tests"
      - "32-task root build"
      - "Paja type-check"
      - "focused Chromium standard-envelope tracer"
  revert_and_reconfirm:
    result: pass
    bug_returned_on_revert: true
    fixed_on_reapply: true
    result_detail: "Stashing only browser-host.test.ts produced the two expected stale-topology failures; restoring its byte-identical diff passed 18/18."
  operational_restoration:
    result: pass
    acceptance: "Human accepted operational Writer restoration as sufficient for audit closure."
    result_detail: "Writer PID 1437992 is the sole 127.0.0.1:4173 listener, matches captured Writer cwd and Vite 6.4.3 preview argv, and returned HTTP 200 in seven samples across 60 seconds without changing or signalling Paja PIDs 4090308/4090321/4090334."
    environment_fidelity_limitation: "The original protected full-environment snapshot was removed; its recorded hash has no retained serialization specification and differs from the current raw /proc environment checksum. Exact full-environment equality cannot be proven and was not claimed."
  chromium_tracer:
    result: pass
    result_detail: "Previously completed isolated-probe Chromium tracer: 1 passed, 0 failed in 9.3 seconds. This remains independent of the Writer restoration blocker."
  guardrail_verdict: accepted
  audit_closeout: "Human verification accepted operational Writer restoration; Chromium tracer PASS and the environment-fidelity limitation are separately recorded."
files_changed: [".changeset/paja-standard-nap-social-cache.md", "docs/how-tos/paja-local-authoring.md", "docs/packages/paja.md", "packages/paja/README.md", "packages/paja/src/browser-adapter.ts", "packages/paja/src/browser-host.test.ts", "packages/paja/src/browser-relay-runtime.test.ts", "packages/paja/src/browser-relay-runtime.ts", "packages/paja/src/browser-social-cache.test.ts", "packages/paja/src/browser-social-cache.ts", "packages/services/src/identity-service.test.ts", "tests/e2e/paja-single-window.spec.ts"]
