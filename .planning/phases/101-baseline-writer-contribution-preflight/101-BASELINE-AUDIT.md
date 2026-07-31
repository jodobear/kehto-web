---
phase: 101-baseline-writer-contribution-preflight
artifact: baseline-audit
audited_at: 2026-07-30T23:33:05Z
kehto_upstream_checked_at: 2026-07-30T23:33:05Z
writer_opening_snapshot_at: 2026-07-30T23:32:30Z
status: recorded
writer_status: mutable-observation
---

# Phase 101 Baseline Audit

This is a UTC-timestamped, reproducible evidence record for the fork milestone only. It does not authorize source work, change the Writer checkout, or describe the imported upstream `101-nap-shell-session-integrity` directory as this fork's Phase 101.

## Verdict

- **Kehto baseline:** `upstream/main`, local `main`, and `origin/main` were identical at `3a4d71a8f8860890cdcbf8fa25a11780fbe7a55f` after the fetch completed at `2026-07-30T23:33:05Z`.
- **Historical baseline:** `d4ba157dfb14876f878cb9055da3d17150d0b01d` remains the historical 2026-07-24 implementation baseline. The full current incoming range is `d4ba157dfb14876f878cb9055da3d17150d0b01d..3a4d71a8f8860890cdcbf8fa25a11780fbe7a55f`.
- **Writer evidence:** `/workspace/projects/writer` is a directory but not a Git checkout. The actual observed Writer checkout is `/workspace/projects/napplets/writer`. Its state is externally mutable and was observed only; it was not normalized.
- **Writer authorization:** **BLOCKED/PENDING.** Canonical Writer remote/default branch/full base SHA and the exact Paja dependency decision remain human-gated fields.

## Kehto Upstream Evidence

| UTC | Command / check | Observation |
| --- | --- | --- |
| 2026-07-30T23:32:48Z | `git -C /workspace/projects/kehto/v129-planning-only remote -v` | `upstream` existed before this task and was exactly `https://github.com/kehto/web.git` for fetch and push. It was not rewritten. `origin` is the fork `git@github.com:jodobear/kehto-web.git`. |
| 2026-07-30T23:33:04Z–23:33:05Z | `git -C /workspace/projects/kehto/v129-planning-only fetch upstream main` | Refresh completed successfully. This was a Kehto remote-ref refresh only; it did not access Writer. |
| 2026-07-30T23:33:05Z | `git rev-parse upstream/main main origin/main` | Each ref resolved to `3a4d71a8f8860890cdcbf8fa25a11780fbe7a55f`. |
| 2026-07-30T23:33:05Z | `git rev-list --left-right --count main...upstream/main` | `0 0`: the fork's `main` remained an exact mirror of live `kehto/web` `upstream/main`. |
| 2026-07-30T23:33:05Z | `git log --reverse --format='%H%x09%s' d4ba157..upstream/main` | The complete historical incoming range is reproducible from the full IDs above. It contains the Paja target-CORS sequence and later upstream convention/runtime history; no imported upstream phase directory is a fork-Phase-101 execution target. |

### Incoming Range: Paja-Relevant Commit Subjects

The following subjects establish the Paja-affecting history in the full range. The reproducibility command in the appendix emits every subject in the range, including non-Paja commits.

| Commit | Subject | Paja relevance |
| --- | --- | --- |
| `0af445bf73d893eca9ff657ddcd646794dbfa3fe` | `fix(paja): diagnose dev servers that block the sandboxed napplet frame` | Introduced target-CORS diagnosis. |
| `f705ecc7f554ba80b33a069c3eb9cee170121b18` | `docs(paja): document the dev-server Origin: null requirement` | Documents sandbox-frame target requirement. |
| `19e532a7321b276ac074cdf7723bffabeb535297` | `chore(changeset): patch @kehto/paja for target CORS diagnostic` | Packages target-CORS diagnostic. |
| `daba0023dd932fd23372976b312cbb8e23146cc7` | `feat(101-04): align Paja parity environments` | Imported upstream history only; not the fork's Phase 101. |
| `8110a9b09e6616b597860ce322ab64b354462bd1` | `feat(101-04): bind Paja shell sessions to frames` | Imported upstream history only; review when rebasing future Paja source work. |
| `68fb3dfce626acbde051ecdffd2dc0a68f2f9787` | `test(102-05): guard Paja shared INC prelude ownership` | Paja behavior changed in upstream convention work. |
| `72ef95cdf8ac8c19c389f62ad9a75a8b8d794e3a` | `test(102-05): prove INC through Paja post-shim srcdoc` | Paja browser proof changed in upstream convention work. |
| `b42031ca79b7e5186db85ae09211234d73fc6774` | `feat(105-06): retain verified Paja intent targets` | Paja host behavior changed after the historical baseline. |
| `138c6e4cda3dba5e46ecfb9fcd12b701edf40f4d` | `feat(105-06): resolve Paja intents from installed catalog` | Paja catalog behavior changed after the historical baseline. |
| `e51d7c5f57171c9f4c5d6dfd88d4f97725318750` | `feat(105-07): wire Paja verified intent targets` | Paja intent integration changed after the historical baseline. |
| `1bd16c2ef48ee92cf4c561376146d6c652c2a67d` | `feat(105-09): adopt profile intent and safe media` | Paja profile/resource behavior changed after the historical baseline. |
| `8a8745546c4c028aab88c2c57ef8d69ec8c923d3` | `fix(paja): reject unacknowledged relay publishes` | Paja relay behavior changed after the historical baseline. |
| `644c2d12c343cd2459dfa7cd1097b33ef818c686` | `fix(paja): settle scoped relay publication` | Paja relay lifecycle changed after the historical baseline. |

### Paja Path Impact in the Full Range

`git diff --name-status d4ba157dfb14876f878cb9055da3d17150d0b01d..upstream/main -- packages/paja` reported the following Paja paths. `A` means added and `M` means modified in the range.

| Status | Paths |
| --- | --- |
| M | `packages/paja/CHANGELOG.md`, `README.md`, `jsr.json`, `package.json` |
| A | `src/browser-adapter-intent.test.ts`, `src/browser-devtools.test.ts`, `src/browser-host-runtime.ts`, `src/browser-host-signer.ts`, `src/browser-intent-controller.test.ts`, `src/browser-intent-host.ts`, `src/browser-target-diagnostics.ts`, `src/installed-napplet-catalog.test.ts`, `src/installed-napplet-catalog.ts`, `src/target-cors.test.ts`, `src/target-cors.ts`, `src/theme-broadcast.ts` |
| M | `src/browser-adapter.ts`, `src/browser-devtools.ts`, `src/browser-host.test.ts`, `src/browser-host.ts`, `src/browser-relay-runtime.test.ts`, `src/browser-relay-runtime.ts`, `src/browser-runtime-tabs.test.ts`, `src/browser-runtime-tabs.ts`, `src/browser-target-frame.ts`, `src/index.ts`, `src/node-compat.d.ts`, `src/parity.test.ts`, `src/parity.ts`, `src/server.test.ts`, `src/server.ts` |

`50d5787b5bd6a75479f72654de98cdfcaa902f50` and `0af445bf73d893eca9ff657ddcd646794dbfa3fe` are both ancestors of refreshed `upstream/main`; the historical target-CORS evidence remains in this range.

### Future Paja Source Rule

Any later Paja implementation branch starts from a freshly fetched `upstream/main`, never from this planning branch. Immediately before source work, re-run the historical-range and Paja-path commands above, review new Paja-impacting commits, and record any rebase. Planning artifacts stay on the fork planning branch and never enter an upstream implementation PR.

## Preserved Writer Snapshot

### Path Classification

| UTC | Path | Observation |
| --- | --- | --- |
| 2026-07-30T23:31:39Z | `/workspace/projects/writer` | Filesystem directory exists but `git -C` reported “not a git repository.” It is filesystem evidence only, not assumed to be the Writer checkout. |
| 2026-07-30T23:32:30Z | `/workspace/projects/napplets/writer` | `git rev-parse --show-toplevel` identified this as the actual observed Writer checkout. |

### Opening Read-Only Inventory

All following commands ran against `/workspace/projects/napplets/writer` at `2026-07-30T23:32:30Z`.

| Check | Observation |
| --- | --- |
| Branch / HEAD | `chore/writer-source-baseline` at `2e0f9bd3b5601f8a5e2e35342e2bb6cb2ffc688b` (`wip: add Writer publish after verification`). |
| Local `master` | `3a43897d2c97fce53512f95b43f17b395198c60d` (`docs: create roadmap (7 phases)`). It remains **comparison-only**, not canonical upstream. |
| `master...HEAD` | `0 29`: current branch is 29 commits ahead of local `master`, with zero commits on local `master` absent from `HEAD`. |
| Porcelain status | Two untracked files: `Screenshot_20260724_102004.png` and `search-on-ctrl+f.png`. |
| Unstaged and staged name-status | Both empty at this observation. |
| Remotes | No remotes configured. |
| Worktrees | One worktree only: `/workspace/projects/napplets/writer`, attached to `refs/heads/chore/writer-source-baseline`. |
| Local config | No local `remote.*`, `branch.*`, or `core.worktree` entries returned. |
| Recent local history | The head includes local shortcut/settings WIP and commits; no history was amended, reset, staged, or otherwise changed by this phase. |

### Comparison With Frozen Planning Snapshot

D-07 preserves the historical planning observation of `57595d2b60d4ae61ce2f245b2061ecbd957b1c66`, 14 commits ahead of local `master`, with dirty shortcut/settings source/test changes, unrelated planning deletions, and two images. The current observed state differs: `HEAD` is now `2e0f9bd3b5601f8a5e2e35342e2bb6cb2ffc688b`, it is 29 commits ahead, and the current porcelain output shows only the two untracked images. This is **concurrent external activity evidence**, not a correction, cleanup instruction, or assertion that historical WIP was absent. The preserved checkout was left exactly as observed.

### Writer Mutation Invariant

This task did not run any Writer `stash`, `commit`, `reset`, `checkout`, `clean`, `add`, `fetch`, `remote add`, `worktree add`, branch/ref operation, index operation, or source-edit command. No Writer source file was read for modification, and no Writer remote, ref, worktree, or source state was created.

## Current Paja / PR Preservation Evidence

| Check time (UTC) | Evidence | Result |
| --- | --- | --- |
| 2026-07-30T23:32:48Z | `origin/integration/v1.29-pr217-pinned` | Preserved at `b004f20341d87b04bbb6e46ad293b4615108058b` (`test(services): complete runtime context fixture`). |
| 2026-07-30T23:32:48Z | `feat/103-paja-blossom-rail` and `origin/feat/103-paja-blossom-rail` | Preserved at `2bc4dc39d304832a354494eaef83dfb354131db6`. |
| 2026-07-30T23:33:05Z | `gh pr view 217 --repo kehto/web` | PR #217 is OPEN, non-draft, base `main@7fef1d516df3c98b27cb9a12544113f169a88882`, head `feat/paja-standard-nap-social-cache-current@5a1cd985cbf05a31c1789aecf32a4bac4dc4d3c3`, with 31 commits and a Paja social-cache focused file list. It remains dedicated and separate from this planning artifact. |

Existing backup refs and worktrees were inspected but not changed.

## Blocking Preconditions

All values below are fail-closed: absent, blank, or unverifiable values cannot unlock Writer setup or source work.

| Required field | Status | Phase 101 determination |
| --- | --- | --- |
| Canonical Writer repository URL | Verified | User confirmed `https://github.com/jodobear/writer`. The existing `origin` SSH form resolves to the same repository and was not rewritten. |
| Canonical Writer default branch | Verified | `master`. |
| Canonical Writer full baseline SHA | Verified | `51c854affca96a159840a6da7cfa81e3772a36f8`, independently returned by canonical HTTPS `ls-remote`, configured `origin`, local `master`, and `origin/master` at `2026-07-31T00:01:56Z`. |
| Exact completed Paja commit or consumable artifact | **BLOCKED** | Must be selected from completed Phase 102/103 work and refreshed in the Phase 104 approval packet; no value is inferred here. |
| Canonical-base source/test scope | **BLOCKED** | Observed local paths are tentative only and must be revalidated against the canonical base. |

## Flagged Assumptions

| Requirement | Category | Disposition |
| --- | --- | --- |
| PRE-01 | unclassified | Audit facts are observations at their command timestamps. A reviewer must use the transcript and this evidence, not assume mutable state remained stable. |
| PRE-02 | empty | Missing canonical URL/default branch/SHA or Paja artifact remains BLOCKED. |
| PRE-02 | encoding | Git object IDs and ref spelling are recorded exactly as emitted; full 40-hex IDs are not replaced with abbreviated or prose-equivalent identifiers. |
| PRE-02 | concurrency | A changed closing Writer snapshot is concurrent external evidence unless the Phase 101 transcript shows a Writer-mutating command; this task shows none. |

## Excluded From This Phase

- Writer remote/ref/worktree/branch/index/source mutation.
- Kehto/Paja source implementation, rebase, or upstream PR content.
- Imported upstream `101-nap-shell-session-integrity` plan execution.
- Planning files, Graphify output, generated artifacts, screenshots, unrelated cleanup, and preserved Writer WIP in future focused implementation PRs.

## Reproducibility Commands

```bash
# Kehto upstream and full historical range
git -C /workspace/projects/kehto/v129-planning-only fetch upstream main
git -C /workspace/projects/kehto/v129-planning-only rev-parse upstream/main main origin/main
git -C /workspace/projects/kehto/v129-planning-only rev-list --left-right --count main...upstream/main
git -C /workspace/projects/kehto/v129-planning-only log --reverse --format='%H%x09%s' \
  d4ba157dfb14876f878cb9055da3d17150d0b01d..upstream/main
git -C /workspace/projects/kehto/v129-planning-only diff --name-status \
  d4ba157dfb14876f878cb9055da3d17150d0b01d..upstream/main -- packages/paja

# Writer observations only: do not substitute mutation commands.
git -C /workspace/projects/napplets/writer status --porcelain=v1
git -C /workspace/projects/napplets/writer rev-parse HEAD master
git -C /workspace/projects/napplets/writer rev-list --left-right --count master...HEAD
git -C /workspace/projects/napplets/writer diff --name-status
git -C /workspace/projects/napplets/writer diff --cached --name-status
git -C /workspace/projects/napplets/writer ls-files --others --exclude-standard
git -C /workspace/projects/napplets/writer remote -v
git -C /workspace/projects/napplets/writer worktree list --porcelain
```

## Closing Snapshot

The same read-only Writer command set was repeated at `2026-07-30T23:35:49Z`.

| Check | Opening | Closing | Classification |
| --- | --- | --- | --- |
| Branch / HEAD | `chore/writer-source-baseline` / `2e0f9bd3b5601f8a5e2e35342e2bb6cb2ffc688b` | identical | No observed change. |
| Local `master` / left-right count | `3a43897d2c97fce53512f95b43f17b395198c60d` / `0 29` | identical | No observed change. |
| Porcelain / untracked paths | two `??` PNG files | identical two `??` PNG files | No observed change. |
| Unstaged / staged name-status | empty / empty | empty / empty | No observed change. |
| Remotes | none | none | No observed change. |
| Worktrees | one `chore/writer-source-baseline` worktree at `/workspace/projects/napplets/writer` | identical | No observed change. |

The opening and closing snapshots match. This proves only that the recorded observations were stable across this audit interval; it does not freeze Writer state or alter the historical D-07 preservation decision.

## Post-Audit Canonical-Base Refresh and User Confirmation

At `2026-07-31T00:01:30Z`, the actual Writer worktree was externally observed clean on `master@51c854affca96a159840a6da7cfa81e3772a36f8`; its earlier active shortcut checkout and two untracked images were no longer present in the worktree. The preserved branch still exists at `chore/writer-source-baseline@2e0f9bd3b5601f8a5e2e35342e2bb6cb2ffc688b`, and `master...chore/writer-source-baseline` is `2 0`.

At `2026-07-31T00:01:56Z`, canonical HTTPS `https://github.com/jodobear/writer` and existing `origin` both reported `refs/heads/master` at `51c854affca96a159840a6da7cfa81e3772a36f8`; `origin/master` matches. The existing SSH remote was not rewritten and no fetch was needed. The user confirmed the checkout switch/cleanup was intentional and the former WIP is safe or no longer needed. This resolves the preservation-review concern, but does not authorize Phase 104 source work.
