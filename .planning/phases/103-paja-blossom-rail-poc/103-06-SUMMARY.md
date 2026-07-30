---
phase: 103-paja-blossom-rail-poc
plan: "06"
subsystem: release evidence and upstream NAP-UPLOAD follow-up
tags: [paja, blossom, nap-upload, release-gates, scope-audit]
requires:
  - "origin/integration/v1.29-pr217-pinned@b004f20341d87b04bbb6e46ad293b4615108058b"
provides:
  - "Task 1 verified release-gate and scope evidence for Phase 103"
affects: [packages/paja, packages/services, packages/runtime, packages/shell]
tech-stack:
  added: []
  patterns: ["pinned integration route", "explicit scope audit", "existing Corepack shim"]
key-files:
  created: [".planning/phases/103-paja-blossom-rail-poc/103-06-SUMMARY.md"]
decisions:
  - "Retain b004f203 integration pin; do not wait for or alter PR #217."
  - "Kehto is pinned-draft aligned only; no current-master NAP conformance claim."
  - "User selected a focused PR #33 comment rather than a normative draft schema PR."
metrics:
  tasks_completed: 2
  tasks_total: 3
  completed: 2026-07-31
status: blocked-auth
---

# Phase 103 Plan 06: Release Evidence Summary

Task 1 revalidated the focused Phase 103 source contribution at `2bc4dc39d304832a354494eaef83dfb354131db6` above the preserved fork integration pin, with all required local quality gates passing after applying the pre-existing Corepack pnpm shim.

## Task Completion

| Task | Result | Commit |
| --- | --- | --- |
| 1. Full gates and scope audit | Complete; all required local evidence is green. | pending planning-worktree commit |
| 2. Upstream feedback form | Complete; user selected `comment`. | no repository change |
| 3. Submit selected feedback | Blocked by GitHub comment authorization. | no repository change |

## Upstream Feedback Decision and Authentication Gate

The selected form is a focused PR #33 comment. The live PR remains open at `https://github.com/napplet/naps/pull/33`, head `a7cc17463cbf5d9cb87884b31071bc4fc826034c`.

Posting was attempted with `gh pr comment 33 --repo napplet/naps --body ...` and was refused before creating a comment:

```text
GraphQL: Resource not accessible by personal access token (addComment)
```

No external feedback artifact was created. The unrelated most-recent existing comment remains `https://github.com/napplet/naps/pull/33#issuecomment-4803690992`; it is not Phase 103 feedback.

Paste-ready Markdown after authenticating a GitHub token with PR comment permission:

```markdown
Phase 103 Kehto upload-rail feedback (pinned authority checked: NAP-UPLOAD `a7cc17463cbf5d9cb87884b31071bc4fc826034c`; NAP-RESOURCE `fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1`; NAP-BLOSSOM `ca1d7ba594e6790785dc770227085d8648d39631`; NAP-SHELL `a7cc17463cbf5d9cb87884b31071bc4fc826034c`).

Kehto has a verified Paja Blossom upload rail that attempts only configured servers, sequentially in configured order. It returns the first verified success through the existing `url` field and later verified successes in `fallbackUrls`. Per-server network, rejection, malformed-descriptor, and stored-byte-proof outcomes remain host-only diagnostics; napplets receive only the current standard result fields.

The implementation and focused/full release gates are green, including browser coverage and a 100/100 AI-slop scan. The remaining interoperability gap is that the current draft result shape cannot represent one structured outcome and machine-readable error code for every attempted replica, particularly where some replicas fail while another succeeds.

This is feedback on the gap, not a proposed final schema: Kehto ships no new field and remains aligned only with the pinned drafts above. The current master tree does not contain these draft paths, so this is not a current-master conformance claim. A future NAP-UPLOAD discussion could decide whether and how to represent per-attempt outcomes while preserving the existing `url` and `fallbackUrls` behavior.
```

## Source Route and Scope

- `upstream/main`, `origin/main`, and local `main` all resolve to `3a4d71a8f8860890cdcbf8fa25a11780fbe7a55f`; no ref was rewritten.
- Selected preserved source route: `origin/integration/v1.29-pr217-pinned@b004f20341d87b04bbb6e46ad293b4615108058b` → `feat/103-paja-blossom-rail@2bc4dc39d304832a354494eaef83dfb354131db6`.
- The integration pin is an ancestor of source `HEAD`.
- PR #217 is `OPEN`, targets `main`, has head `5a1cd985cbf05a31c1789aecf32a4bac4dc4d3c3`, and has no merge commit. It was not modified or awaited.
- The selected-base diff contains only Phase 103 source/tests/Paja docs and the two required changesets. It contains no planning, graph, Writer, generated, NIP-96, low-level Blossom, dependency-manifest, lockfile, or unrelated-cleanup path.

## Protocol Authority Revalidation

| Authority | Exact ref | Disposition |
| --- | --- | --- |
| NAP-UPLOAD | `a7cc17463cbf5d9cb87884b31071bc4fc826034c` | Pinned draft checked: current result has `url`, `fallbackUrls`, and string `error`; it has no per-attempt replica-outcome or structured-error field. |
| NAP-RESOURCE | `fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1` | Pinned draft checked. |
| NAP-BLOSSOM | `ca1d7ba594e6790785dc770227085d8648d39631` | Pinned draft checked; no napplet-visible low-level Blossom surface was added. |
| NAP-SHELL | `a7cc17463cbf5d9cb87884b31071bc4fc826034c` | Pinned draft checked; standard shell boundary retained. |

The documented `naps/NAP-*.md` paths remain absent from the available current `master` tree. Kehto is pinned-draft aligned, retains the intentional current-wire schema gap for per-replica outcomes, and makes no current-master conformance claim. The checked local authority clone was `/workspace/projects/napplets/jodobear/naps` because the historical `/workspace/projects/napplets/naps` path is absent.

## Verification

Passed from `/workspace/projects/kehto/paja-blossom-rail`:

- focused changed-path Vitest smoke: 9 files, 141 tests
- `git diff --check`
- `pnpm build`
- `pnpm type-check`
- `pnpm test:unit`: 129 files, 1,577 tests
- `pnpm docs:check`
- focused `paja-single-window` Playwright
- full `CI=1 pnpm exec playwright test`
- `npx --no-install aislop scan -d`: `100 / 100 Healthy`
- clean source status after gates

The literal Corepack invocation exposed an inherited environment issue: Turbo child processes could not find `pnpm`. Re-running the required chain with the pre-existing `/tmp/kehto-pnpm-shim` on `PATH` passed end-to-end; no dependency or lockfile changed.

## Coverage and Changesets

`COVERAGE.md` accounts for the integrated BUD-01, BUD-02, BUD-08, and BUD-11 paths and explicitly scopes all opt-outs. Both required changesets are present:

- `.changeset/paja-blossom-rail.md`
- `.changeset/services-verified-resource-grants.md`

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 3 - Environment] Restored the existing pnpm shim for child-process gates**
   - **Found during:** Task 1 release-gate run.
   - **Issue:** `corepack pnpm` launched Turbo, docs, and Playwright child processes without a discoverable `pnpm` binary.
   - **Fix:** Re-ran the exact release chain with the pre-existing `/tmp/kehto-pnpm-shim` on `PATH`.
   - **Files modified:** None.
   - **Commit:** pending this evidence commit.

## Known Stubs

None.

## Self-Check: PASSED

- Source `HEAD`, integration pin, all three `main` refs, two changesets, required test paths, and the clean scoped diff were verified.
- Full source gates completed successfully with the documented existing shim.
