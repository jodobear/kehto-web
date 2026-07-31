---
phase: 101-baseline-writer-contribution-preflight
future_phase: 104-approved-writer-integration
status: BLOCKED/PENDING
requires_explicit_approval: true
approval_phrase: approve Writer implementation
requirements: [PRE-02]
---

# Writer Contribution Plan: Approval-Gated Phase 104

## Status and Authority

**BLOCKED/PENDING — this document is not authorization to change Writer.** No Writer remote, ref, branch, linked worktree, index, source file, dependency, or configuration may be changed during Phase 101. The only authorization boundary is a later Phase 104 review that has refreshed all blocking values and receives explicit user wording such as `approve Writer implementation`.

Phase 101 observed the real local checkout at `/workspace/projects/napplets/writer`, not `/workspace/projects/writer` (which is a filesystem directory but not a Git checkout). The observed local shortcut/settings WIP on `chore/writer-source-baseline` remains preserved and excluded. It must never become the integration base or receive milestone edits.

## Blocking Preconditions

All values are fail-closed. Blank, absent, stale, or unverifiable values stop setup and source work.

| Required field | Current value | Status | Phase 104 requirement |
| --- | --- | --- | --- |
| Canonical Writer URL | `https://github.com/jodobear/writer` | Verified | Existing `origin` SSH URL resolves to this same repository; no rewrite was needed. |
| Canonical Writer default branch | `master` | Verified | Verified against the canonical remote. |
| Canonical Writer full baseline SHA | `51c854affca96a159840a6da7cfa81e3772a36f8` | Verified | Canonical HTTPS, configured `origin`, local `master`, and `origin/master` all resolved to this exact full SHA. |
| Exact Paja dependency | Observed preservation refs: `origin/integration/v1.29-pr217-pinned@b004f20341d87b04bbb6e46ad293b4615108058b` and `feat/103-paja-blossom-rail@2bc4dc39d304832a354494eaef83dfb354131db6` | **BLOCKED** | Phase 104 selects and verifies the exact completed implementation commit or consumable artifact, its branch/worktree, and whether the proof is temporary or a released/explicitly stacked dependency. Neither observed ref authorizes Writer work by itself. |
| Canonical-base source/test scope | Local-only observation available | **BLOCKED** | Re-inspect the verified canonical base before editing; do not assume local WIP architecture is canonical. |
| Explicit user authorization | Not given | **BLOCKED/PENDING** | A Phase 104 reviewer must approve the refreshed packet with `approve Writer implementation` or equivalent. |

## Preserved-WIP Inventory

The preflight audit recorded at `2026-07-30T23:32:30Z` and rechecked at `2026-07-30T23:35:49Z`:

- actual Writer checkout: `/workspace/projects/napplets/writer`;
- branch and HEAD: `chore/writer-source-baseline@2e0f9bd3b5601f8a5e2e35342e2bb6cb2ffc688b`;
- local comparison-only baseline: `master@3a43897d2c97fce53512f95b43f17b395198c60d`;
- local topology: `0 29` for `master...HEAD`;
- porcelain: only `Screenshot_20260724_102004.png` and `search-on-ctrl+f.png` untracked at both timestamps; no staged or unstaged name-status rows at the observation times;
- no configured remotes and one attached worktree.

The frozen D-07 snapshot at `57595d2b60d4ae61ce2f245b2061ecbd957b1c66` with its then-dirty shortcut/settings changes remains a preservation decision. Differences between the frozen and current snapshots are external concurrency evidence, not permission to tidy, discard, absorb, or rebase WIP.

## Delivery Order and Repository Boundaries

1. Complete and verify the required Paja functionality first. Preserve the observed integration pin `b004f20341d87b04bbb6e46ad293b4615108058b` and Phase 103 tip `2bc4dc39d304832a354494eaef83dfb354131db6`; do not reset, replace, or fold either into planning history.
2. Before Phase 104 source work, refresh the canonical Writer base and select the exact Paja implementation commit/artifact. Record its full SHA, branch/worktree, package/release status, and any expected host command.
3. For fastest controlled feedback, run the exact selected Kehto/Paja implementation branch/worktree against Writer's Paja target URL. Do not create a workspace link, copy cross-repository source, or add unpublished dependency noise to Writer.
4. Before an upstream Writer PR, decide and record a released or explicitly stacked dependency. An ad hoc local proof command is not a publishable dependency strategy.
5. Keep Kehto and Writer upstream PRs separate. Planning artifacts remain on `/workspace/projects/kehto/v129-planning-only` branch `docs/v1.29-planning-only` and never enter an upstream implementation PR.

## Tentative Writer Scope: Revalidate After Canonical Base Verification

No file in this table is changed by this plan. It maps observations from the local-only checkout and names the expected Phase 104 ownership boundaries.

| Classification | Tentative path | Observed or planned responsibility | Revalidation requirement |
| --- | --- | --- | --- |
| Existing orchestration seam | `src/main.ts` | Existing identity reads, followed-profile hydration through `common.getProfile`, upload invocation, and `resource.bytes` object-URL handling. | Confirm the canonical base retains this composition root before edits. |
| Focused social reducer | `src/integrations/followed-profiles.ts` | Tentative new pure reducer for valid kind-0 events: select greatest `created_at`, then lexically lowest event ID. | Create only if canonical base has no equivalent seam. |
| Focused social reducer tests | `src/integrations/followed-profiles.test.ts` | Tentative vectors for out-of-order batches, equal timestamps, invalid events, query-wide `incomplete` / `error`, and identity-generation staleness. | Revalidate exact test placement and existing helpers. |
| Existing settings seam, excluded | `src/integrations/writing-settings.ts`, `src/integrations/writing-settings.test.ts` | Current local settings work. | Preserve; do not absorb unless canonical inspected scope makes a direct, approved dependency unavoidable. |
| Existing UI seam, excluded | `src/ui/action-hints.ts`, `src/ui/action-hints.test.ts` | Shortcut/UI work outside this milestone. | Preserve; do not absorb. |

## Standard-NAP Authority Matrix

The following immutable sources were checked for this plan. The first four entries are **conformant planned behavior**; NAP-BLOSSOM is not a Writer API in this milestone.

| Authority | Planned Writer use | Determination | Required implementation boundary |
| --- | --- | --- | --- |
| [NAP-IDENTITY `6461e4b37c29dc09a20dff35d9515889c4433874`](https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md) | `identity.getPublicKey`, `identity.getFollows`, and pushed `identity.changed` | **conformant planned behavior** | Read-only identity. Treat the empty pubkey for signed-out state as a state reset; use pushed change notifications, no polling, and no private-key/signing exposure. Fence stale asynchronous follow/profile work by active identity generation. |
| [NAP-OUTBOX `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e`](https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md) and [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) | Bounded batched `outbox.query` reads for kind `0` and followed authors | **conformant planned behavior** | This pinned draft is the authority for query-wide `events`, `incomplete`, and `error`; it provides no ordering or newest-per-author guarantee. Retain valid events when the query is incomplete or reports an error. Writer performs deterministic per-author reduction: greatest `created_at`, then lexically lowest ID. Do not use per-author `common.getProfile` for followed-profile hydration. |
| [NAP-RESOURCE `fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1`](https://raw.githubusercontent.com/napplet/naps/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md) | `resource.bytes`, cancellation through the request signal / `resource.cancel`, and Blob object URLs | **conformant planned behavior** | Use runtime-mediated bytes, make object URLs revocable on replacement and teardown, and keep request ownership scoped to the active Writer window/session. Writer must never assign remote metadata or upload-server URLs directly to media elements. |
| [NAP-UPLOAD `a7cc17463cbf5d9cb87884b31071bc4fc826034c`](https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md) | `upload.upload` with `rail: "blossom"`, selected bytes, filename, and MIME metadata | **conformant planned behavior** | Paja/shell selects the server, obtains consent, signs authorization, transfers bytes, applies policy, and validates the result. Writer receives only standard statuses/results; it gains no server credential, signing, or network authority. |
| [NAP-BLOSSOM `ca1d7ba594e6790785dc770227085d8648d39631`](https://raw.githubusercontent.com/napplet/naps/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md) | No Writer call | **intentional draft-spec gap** | Request-bound descriptor URL/hash/size validation is Kehto product security. Do not claim this draft mandates the stronger rule; document it as a draft-spec gap in future Kehto tests/PR discussion. |

### Non-Negotiable Authority Exclusions

Writer must not introduce a custom Paja API, direct relay/HTTP/WebSocket path, `fetch`, `XMLHttpRequest`, `EventSource`, `window.nostr`, private-key access, signer exposure, upload authorization, or direct remote media loading. Identity, relay selection, resource access, upload server choice, consent, signing, transfer, and network policy stay in Paja/shell.

## Planned Phase 104 Work Sequence

After all blocking fields are resolved and the user explicitly authorizes implementation:

1. Revalidate canonical source layout, local source/test ownership, installed `@napplet/*` declarations, and the exact pinned NAP documents.
2. Add the deterministic followed-profile reducer and focused tests before integrating UI behavior.
3. Replace only the followed-profile hydration path with bounded kind-0 `outbox.query` batches, retaining valid partial events and reacting to `identity.changed` without replacing the iframe.
4. Preserve the existing mention UX: selected profile inserts the existing `nostr:nprofile` Markdown mention and publishing retains the corresponding NIP-23 `p` tag.
5. Update the existing paste-upload path to request `rail: "blossom"`; insert only a successful returned HTTPS URL and render preview bytes exclusively through `resource.bytes` Blob URLs.
6. Prove the real Writer journey through the exact selected Paja host: login to followed-profile tagging and pasted media to explicit Blossom upload to resource-mediated preview.

## Verification Plan

### Focused Writer checks

- Run focused deterministic reducer, identity-generation, partial-result, mention insertion/p-tag, upload-rail, and Blob URL lifecycle tests after their owning change.
- Run `corepack pnpm type-check`.
- Run `corepack pnpm build` and confirm output remains only `dist/index.html`.
- Run `corepack pnpm test:conformance`.
- Run `corepack pnpm runtime` only with the URL printed by the selected Paja/Kehto host. Raw Vite and static artifact-preview URLs are not valid runtime smoke tests.
- Prove no direct network/key authority in the built Writer artifact and Paja-hosted opaque iframe.

### Applicable Kehto checks

- Re-run the selected Paja branch's focused unit/browser coverage and all applicable Kehto build, type-check, unit, docs, Playwright, dependency-direction, and AI-slop gates after Kehto changes.
- Reconfirm that `main` is a freshly fetched exact upstream mirror before starting any new Kehto source branch.
- Keep PR #217 dedicated and retain `b004f20341d87b04bbb6e46ad293b4615108058b` plus `2bc4dc39d304832a354494eaef83dfb354131db6` as preserved evidence refs.

## Focused PR Rules

Stage by explicit path. A Writer upstream PR contains only the approved Writer source, focused tests, required docs, and any appropriate changeset. A Kehto upstream PR contains only its own implementation, tests, required docs, and changeset. Exclude in every case:

- `.planning/**` and this Phase 101 packet;
- Graphify output;
- generated artifacts and screenshots;
- unrelated cleanup;
- preserved Writer shortcut/settings WIP and the two observed untracked images;
- any cross-repository change that belongs in the other repository.

## Post-approval-only commands

**BLOCKED — Phase 104 only. No command below this heading may run during Phase 101.** Fill only human-verified canonical values after an explicit Phase 104 `approve Writer implementation` authorization. These commands are a template, not a request to execute them now.

```bash
# The existing dirty Writer checkout is observed, never reused as the source base.
git -C /workspace/projects/napplets/writer remote add origin <CANONICAL_WRITER_URL>
git -C /workspace/projects/napplets/writer fetch origin --prune --tags
BASE="$(git -C /workspace/projects/napplets/writer rev-parse --verify 'origin/<DEFAULT_BRANCH>^{commit}')"
git -C /workspace/projects/napplets/writer worktree add \
  -b feat/paja-social-blossom-integration \
  /workspace/projects/writer-paja-social-blossom \
  "$BASE"
```

The Phase 104 packet must record the canonical URL, default branch, full `$BASE`, selected exact Paja commit/artifact, fresh preserved-WIP inventory, canonical-base source/test revalidation, protocol determinations, test results, and PR exclusions before any source edit.

## Approval Packet and Decision

Phase 101 records only **BLOCKED/PENDING**. It does not ask for or grant implementation authorization. At the Phase 104 gate, present:

1. preserved-WIP inventory with refreshed timestamps;
2. canonical Writer URL, default branch, and full verified baseline SHA;
3. selected exact Paja commit/artifact and dependency order;
4. clean worktree/branch commands;
5. revalidated Writer source/test file list;
6. this pinned standard-NAP matrix and NAP-BLOSSOM draft-spec/product-policy distinction;
7. focused/full verification results and PR exclusions.

Only then may a user say `approve Writer implementation`. That approval authorizes the clean worktree and scoped source edits only; it never authorizes touching the preserved shortcut WIP.
