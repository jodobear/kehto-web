# Phase 101: Baseline & Writer Contribution Preflight - Research

**Researched:** 2026-07-24
**Domain:** Cross-repository Git baseline audit and approval-gated Writer contribution preparation
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Delivery posture
- **D-01:** Skip further discovery questions. Plan from the frozen roadmap, requirements, project research, repository evidence, and pinned protocol references.
- **D-02:** Optimize for the fastest safe route to working Paja functionality and the real Writer integration. Preflight work must remain bounded to evidence, isolation, dependency ordering, and approval controls; it must not become a broad repository cleanup or architecture phase.
- **D-03:** Downstream agents may choose routine reversible details, but they may not weaken the standard-NAP boundary, Writer WIP preservation, focused-PR hygiene, or explicit approval requirement.

### Kehto baseline and contribution path
- **D-04:** Treat `https://github.com/kehto/web` default branch `main` at `d4ba157dfb14876f878cb9055da3d17150d0b01d` as the verified implementation baseline checked on 2026-07-24. The local fork's implementation history is identical through that commit; commits above it are milestone planning only.
- **D-05:** Configure or verify a local `upstream` remote for `kehto/web`, fetch it, and record the exact upstream SHA immediately before Paja implementation begins. If upstream advanced, review Paja-affecting commits and rebase the implementation branch before source work. Planning commits remain on the fork and never enter upstream implementation PRs.
- **D-06:** Phase 101 records baseline evidence and the future branch/PR topology. It does not mix implementation into this context branch. Upstream PRs remain one coherent concern and include only implementation, tests, required docs, and changesets.

### Writer WIP isolation
- **D-07:** Preserve `/workspace/projects/writer` exactly as found: branch `chore/writer-source-baseline` at `57595d2b60d4ae61ce2f245b2061ecbd957b1c66`, 14 commits ahead of local `master`, with dirty shortcut/settings source and test changes plus unrelated planning deletions and two untracked images. Do not stash, commit, reset, checkout, clean, stage, or otherwise normalize that working tree during Phase 101.
- **D-08:** Use a separate Writer worktree and dedicated integration branch for milestone source work. Never reuse the dirty shortcut working tree. Default branch slug: `feat/paja-social-blossom-integration`; planner may adjust only to match the canonical Writer repository's naming rules.
- **D-09:** Writer currently has no configured remote. Until a canonical Writer repository URL and default branch are verified, local `master@3a43897d2c97fce53512f95b43f17b395198c60d` is a provisional comparison point only, not authoritative upstream. The Writer plan must name remote setup and SHA verification as blocking preconditions before the clean integration worktree is created.
- **D-10:** Phase 101 may inspect Writer read-only and document exact setup commands. It must not mutate Writer remotes, refs, branches, worktrees, index, or source before the explicit approval checkpoint.

### Paja dependency and fast cross-repository proof
- **D-11:** Implement and verify the required Paja host functionality first. Writer source work begins only after the Paja phases provide an exact consumable implementation commit/artifact and the user approves the Writer plan.
- **D-12:** For fastest pre-release PoC feedback, run Paja from the exact Kehto implementation branch/worktree against Writer's target URL. Do not add ad hoc workspace links, cross-repository source copies, or unpublished dependency noise to Writer. Before a Writer upstream PR, replace any temporary test command with the approved released or explicitly stacked dependency and record the dependency order.

### Writer approval checkpoint
- **D-13:** No automated chain may cross into Writer source edits. The checkpoint requires the user to review: preserved-WIP inventory, canonical Writer remote/default branch and baseline SHA, clean worktree/branch commands, exact Paja dependency commit/artifact, Writer file list, standard-NAP changes, focused tests, full verification commands, and PR exclusions.
- **D-14:** Source work starts only after an explicit approval such as `approve Writer implementation`. Approval authorizes creating the clean Writer worktree/integration branch and editing the scoped source files; it does not authorize touching the preserved shortcut WIP.

### Protocol conformance recorded for the Writer plan
- **D-15:** NAP-IDENTITY at `6461e4b37c29dc09a20dff35d9515889c4433874` is the authority for `identity.getPublicKey`, `identity.getFollows`, and push-only `identity.changed`. Planned Writer behavior is conformant: read-only identity, empty pubkey for signed-out state, no polling, no private-key/signing exposure.
- **D-16:** NAP-OUTBOX draft at `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e` is the authority for batched `outbox.query` kind-0 reads. It provides query-wide `events`, `incomplete`, and `error`, but no ordering or newest-per-author guarantee; deterministic newest-profile reduction remains Writer responsibility under NIP-01.
- **D-17:** NAP-RESOURCE draft at `fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1` is the authority for `resource.bytes`/`resource.cancel` and Blob-based media delivery. Writer must never assign remote metadata or upload-server URLs directly to media elements.
- **D-18:** NAP-UPLOAD draft at `a7cc17463cbf5d9cb87884b31071bc4fc826034c` is the Writer-facing upload authority. Writer explicitly requests `rail: "blossom"` and supplies bytes/metadata only; Paja/shell selects the server, obtains consent, signs authorization, transfers, and validates.
- **D-19:** NAP-BLOSSOM draft at `ca1d7ba594e6790785dc770227085d8648d39631` defines the lower-level Blossom rail but is not a Writer API for this milestone. Its upload descriptor does not fully require request-bound URL/hash/size validation; Kehto's stronger validation is an intentional product-security rule and must be documented as a draft-spec gap, not misrepresented as current NAP-BLOSSOM text.

### Claude's Discretion
- Exact audit-document names and table layout.
- Reversible git command sequencing after all baseline URLs and SHAs are known.
- Focused test-file grouping and plan granularity, provided the approval checkpoint and phase boundaries remain explicit.

### Deferred Ideas (OUT OF SCOPE)
None added during this discussion. Future `blossom:sha256`, low-level NAP-BLOSSOM operations, social expansion, and upload-progress/multi-rail features remain deferred exactly as listed in `.planning/REQUIREMENTS.md`.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- Keep Phase 101 on its current planning branch; never place planning artifacts, Graphify output, generated noise, unrelated cleanup, or preserved Writer WIP in an upstream implementation PR. [VERIFIED: AGENTS.md]
- Do not edit, stage, reset, stash, clean, checkout, commit, or otherwise normalize Writer during this phase; Writer inspection is read-only. [VERIFIED: Phase 101 CONTEXT.md]
- A future Kehto source branch must start from current `upstream/main`, not this planning branch; upstream PRs must be focused and use explicit-path staging. [VERIFIED: AGENTS.md]
- Any later NAP/NIP-5D change must check the owning pinned `napplet/naps` specification first and record the exact ref plus a conformance, intentional-spec-gap, or upstream-drift determination. [VERIFIED: AGENTS.md]
- Future code changes require relevant tests, `pnpm build`, `pnpm type-check`, `pnpm test:unit`, applicable browser tests, synced documentation, and the AI-slop gate before shipping. [VERIFIED: AGENTS.md]
- Writer later remains a framework-light sandboxed napplet: use SDK helpers, retain shell-owned network/signing/upload/resource authority, and avoid direct browser networking, browser storage, keys, or `window.nostr`. [VERIFIED: /workspace/projects/writer/AGENTS.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRE-01 | Before implementation, Kehto is rebased onto the latest upstream implementation baseline and affected incoming Paja changes are reviewed; Writer's dirty shortcut WIP, branch history, missing remote, and intended upstream baseline are classified without discarding or absorbing unrelated work. | Two audit artifacts, an evidence command set, the observed upstream divergence, and immutable Writer snapshot fields are specified below. |
| PRE-02 | Writer receives an implementation plan that names its preserved WIP, required upstream/remote setup, dedicated integration branch, Paja dependency, exact standard-NAP changes, tests, and approval checkpoint; no Writer source file changes occur before explicit user approval. | The approval-gated contribution plan, future worktree sequence, exact tentative file/test list, standard-NAP matrix, and validation gate are specified below. |
</phase_requirements>

## Summary

Phase 101 is a documentation-and-evidence phase. Create two committed planning artifacts in this Kehto phase directory: `101-BASELINE-AUDIT.md` for reproducible Git/GitHub evidence and `101-WRITER-CONTRIBUTION-PLAN.md` for the blocked future Writer change. Do not modify Writer or create its remote, branch, ref, or worktree. [VERIFIED: Phase 101 CONTEXT.md]

The historical verified Kehto implementation baseline is `d4ba157dfb14876f878cb9055da3d17150d0b01d`, but a live read-only lookup found `kehto/web` `main` at `50d5787b5bd6a75479f72654de98cdfcaa902f50`, seven commits ahead. The incoming range includes the Paja target-CORS diagnostic (`0af445b`), which changes `packages/paja/src/{browser-host,index,server,target-cors}.ts` and tests; this is relevant because Writer's Paja runtime starts a Vite target server. Record the range and require the future Paja implementation branch to start from the then-fetched `upstream/main`, with a fresh range review immediately before source work. [VERIFIED: GitHub API and git ls-remote]

At the initial Phase 101 read-only observation, Writer was a local-only, dirty worktree on `chore/writer-source-baseline` at `0a2c2a9`, 17 commits ahead of local `master@3a43897`, with no remote configured. Its then-observed unstaged state included `.planning` deletions, modified shortcut/settings source and test files, a modified `src/main.ts`, and two untracked PNG files. A later read-only check during this research observed a new Writer `HEAD` (`df52240`) and additional dirty documentation changes; this confirms the audit artifact must record its own timestamped snapshot and never treat this research observation as a fixed contract. The earlier frozen snapshot at `57595d2`/14 commits remains a preservation decision. [VERIFIED: local Writer git inspection]

**Primary recommendation:** Plan one short evidence task and one short approval-gated contribution-plan task; make every Writer-mutating command a clearly marked Phase 104 action that cannot run until the user explicitly says `approve Writer implementation`. [VERIFIED: Phase 101 CONTEXT.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Kehto upstream reconciliation | Local VCS / developer workflow | GitHub remote | A source branch must be derived from a verified upstream commit, while the planning branch remains documentation-only. [VERIFIED: Phase 101 CONTEXT.md] |
| Preserved Writer WIP inventory | Local VCS / developer workflow | — | Dirty files, index state, local-only history, remotes, and worktrees exist in Writer's local Git state. [VERIFIED: local Writer git inspection] |
| Future followed-profile hydration | Browser / Client | Paja host services | Writer owns candidate reduction and mention UI; Paja supplies identity and outbox data only through standard NAP services. [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md] |
| Future Blossom upload | Browser / Client | Paja host services | Writer submits bytes and explicit rail selection; Paja/shell owns policy, consent, signing, network transfer, and validation. [CITED: https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |
| Approval checkpoint | Human release / contribution control | Local VCS / developer workflow | Approval is the intentional boundary before remote setup, clean worktree creation, or any Writer source edit. [VERIFIED: Phase 101 CONTEXT.md] |

## Standard Stack

### Core

| Tool | Verified Version | Purpose | Why Standard |
|------|------------------|---------|--------------|
| Git | `2.51.2` | Capture refs/status/ranges and later create an isolated linked worktree. | `git worktree add -b` gives the clean worktree an independent `HEAD` and index, leaving the existing dirty worktree untouched. [CITED: https://git-scm.com/docs/git-worktree] |
| GitHub CLI / GitHub API | `gh 2.83.2` | Read current upstream head and changed Paja files without changing local refs. | Use it for evidence only; `git ls-remote` is the no-CLI fallback. [VERIFIED: local environment audit] |
| Corepack + Node | Corepack `0.34.0`, Node `v22.22.0` | Invoke Writer's pinned pnpm commands after approval. | The Writer repository pins `pnpm@10.8.0`; bare `pnpm` is absent in this environment, so use `corepack pnpm`. [VERIFIED: local Writer package.json and environment audit] |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Existing Writer SDK | installed `@napplet/sdk@0.24.4` | Supplies the existing `identity`, `outbox`, `upload`, and `resource` client helpers. | Reuse it in the later Writer branch; do not add a relay, upload, crypto, or social SDK. [VERIFIED: local Writer package.json and installed package metadata] |
| Existing Kehto Paja | current upstream branch at execution time | Hosts standard identity/outbox/resource/upload services. | Complete Paja functionality first and record the exact usable commit/artifact in the approval packet. [VERIFIED: Phase 101 CONTEXT.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate Writer worktree based on verified canonical baseline | Reuse `chore/writer-source-baseline` | Rejected: it would absorb or disturb unrelated dirty WIP and has no verified canonical remote. [VERIFIED: Phase 101 CONTEXT.md] |
| Standard NAP services | A custom Paja profile/upload API or direct Writer network client | Rejected: it violates the locked shell-mediation and standard-NAP boundary. [VERIFIED: REQUIREMENTS.md] |

**Installation:** None. This phase installs no package. [VERIFIED: Phase 101 scope]

## Architecture Patterns

### System Architecture Diagram

```text
Read-only evidence inputs
  Kehto local refs + GitHub upstream ──> 101-BASELINE-AUDIT.md
  Writer status/refs/remotes/worktrees ──> preserved-WIP inventory
                                             │
                                             v
                                     101-WRITER-CONTRIBUTION-PLAN.md
                                     - canonical remote: BLOCKED
                                     - Paja commit/artifact: BLOCKED
                                     - source-file/test list
                                     - conformance vs draft gaps
                                             │
                    explicit user: "approve Writer implementation"
                                             │
                         ┌───────────────────┴───────────────────┐
                         v                                       v
       create verified clean Writer worktree            retain dirty Writer worktree
       and integration branch (Phase 104)              unchanged in place
                         │
                         v
  Paja implementation commit/artifact ──> Writer standard NAP calls ──> focused PRs
```

### Recommended Artifact Structure

```text
.planning/phases/101-baseline-writer-contribution-preflight/
├── 101-CONTEXT.md
├── 101-RESEARCH.md
├── 101-BASELINE-AUDIT.md              # immutable read-only evidence snapshot
└── 101-WRITER-CONTRIBUTION-PLAN.md    # blocked Phase 104 setup and source plan
```

### Pattern 1: Immutable before/after evidence, not cleanup

**What:** Capture Writer's branch, refs, ahead/behind count, porcelain status, unstaged and staged name-status, untracked files, remotes, and worktrees before producing the contribution plan. Repeat exactly those read-only commands as the plan's closing verification and compare the output to the recorded inventory. [VERIFIED: local Writer git inspection]

**When to use:** Use for this phase because Writer is intentionally dirty and its WIP must remain independent of the milestone. [VERIFIED: Phase 101 CONTEXT.md]

**Evidence commands:**

```bash
# All commands are read-only and safe during Phase 101.
git -C /workspace/projects/writer status --porcelain=v1
git -C /workspace/projects/writer rev-parse HEAD master
git -C /workspace/projects/writer rev-list --left-right --count master...HEAD
git -C /workspace/projects/writer diff --name-status
git -C /workspace/projects/writer diff --cached --name-status
git -C /workspace/projects/writer ls-files --others --exclude-standard
git -C /workspace/projects/writer remote -v
git -C /workspace/projects/writer worktree list --porcelain
```

### Pattern 2: Fresh branch from verified commit, never an operation on the dirty checkout

**What:** After approval, resolve the canonical Writer default-branch ref to an exact commit and make a new linked worktree with a new integration branch at that commit. `-b` must be used, not `-B` or `--force`. [CITED: https://git-scm.com/docs/git-worktree]

**When to use:** Only after the canonical Writer URL/default branch and the exact Paja dependency have been recorded and the user has approved Writer implementation. [VERIFIED: Phase 101 CONTEXT.md]

**Post-approval command template (document it now; do not execute it in Phase 101):**

```bash
# Fill the user-verified canonical values only after approval.
git -C /workspace/projects/writer remote add origin <CANONICAL_WRITER_URL>
git -C /workspace/projects/writer fetch origin --prune --tags
BASE="$(git -C /workspace/projects/writer rev-parse --verify 'origin/<DEFAULT_BRANCH>^{commit}')"
git -C /workspace/projects/writer worktree add \
  -b feat/paja-social-blossom-integration \
  /workspace/projects/writer-paja-social-blossom \
  "$BASE"
```

### Pattern 3: Record protocol conformance separately from draft-spec gaps

**What:** The Writer plan must have a per-interface table with `Authority`, `planned use`, `conformance result`, and `draft gap / Kehto policy`. Do not say that a Kehto hardening rule is required by a draft when the draft does not require it. [VERIFIED: Phase 101 CONTEXT.md]

| Interface | Writer plan must state | Classification |
|-----------|------------------------|----------------|
| NAP-IDENTITY `6461e4b` | Snapshot with `getPublicKey`, get follows through `getFollows`, subscribe to pushed `identity.changed`, clear on `""`, and expose no keys/signing. | Conformant planned usage. [CITED: https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md] |
| NAP-OUTBOX `4589a8f` | Query bounded author batches for kind `0`; preserve valid events under query-wide `incomplete`/`error`; locally choose greatest `created_at`, then lexically lowest event ID. | Conformant planned usage; no ordering guarantee from OUTBOX. [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md] [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md] |
| NAP-RESOURCE `fa6bcc6` | Render only `resource.bytes` Blob object URLs and revoke them; never assign remote metadata/upload-server URLs directly. | Conformant planned usage. [CITED: https://raw.githubusercontent.com/napplet/naps/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md] |
| NAP-UPLOAD `a7cc174` | Call `upload.upload` with bytes, metadata, and `rail: "blossom"`; leave server/consent/authorization/transfer to Paja. | Conformant planned usage. [CITED: https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |
| NAP-BLOSSOM `ca1d7ba` | Do not call it from Writer; record request-bound descriptor URL/hash/size validation as Kehto product security. | Intentional draft-spec gap, not a claim of current draft conformance. [CITED: https://raw.githubusercontent.com/napplet/naps/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md] |

### Anti-Patterns to Avoid

- **“Cleaning” Writer to make the audit easier:** Do not stash, commit, reset, checkout, stage, clean, or remove its WIP. It destroys the audit's isolation guarantee. [VERIFIED: Phase 101 CONTEXT.md]
- **Using local Writer `master` as an upstream base:** It is only provisional because Writer has no configured remote. [VERIFIED: local Writer git inspection]
- **Creating a Writer worktree before approval:** Worktree creation mutates Writer Git state and is expressly deferred until approval. [VERIFIED: Phase 101 CONTEXT.md]
- **Starting Paja code from this planning branch:** It contains planning history and is not the implementation baseline. [VERIFIED: Phase 101 CONTEXT.md]
- **Treating a low-level Blossom descriptor as a Writer API:** Writer must use NAP-UPLOAD and NAP-RESOURCE instead. [CITED: https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dirty-WIP isolation | A copied directory, stash workflow, or manual patch transfer | Git linked worktree created with `git worktree add -b` after approval | Git keeps independent `HEAD` and index state without copying dirty changes. [CITED: https://git-scm.com/docs/git-worktree] |
| Follow/profile transport | Per-author `common.getProfile` fan-out or a Writer relay client | Bounded standard `outbox.query` batches after `identity.getFollows` | OUTBOX has query-level event/partial-result semantics and preserves shell relay mediation. [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md] |
| Event winner selection | Arrival-order or cache-order winner | Pure local NIP-01 reducer | OUTBOX does not guarantee event order; kind-0 tie handling requires deterministic ID ordering. [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md] |
| Upload/network/signing | Writer-side Blossom HTTP, authorization, relay client, or crypto | Existing Paja NAP-UPLOAD implementation | The shell owns policy, consent, credentials, network transfer, and authorization. [CITED: https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |

**Key insight:** The fastest safe path is not a shortcut around WIP or host mediation; it is evidence now, Paja first, then a fresh Writer branch based on an approved canonical commit. [VERIFIED: Phase 101 CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Treating the historical baseline as still current
**What goes wrong:** A Paja source branch starts from `d4ba157` even though live upstream `main` has advanced. [VERIFIED: GitHub API and git ls-remote]

**Why it happens:** The historical baseline was correctly recorded during discuss-phase, but an upstream head is time-sensitive. [VERIFIED: Phase 101 CONTEXT.md]

**How to avoid:** Preserve `d4ba157` as historical evidence; immediately before implementation, fetch/verify `upstream/main`, record its SHA, inspect the intervening range, and create/rebase the implementation branch against that SHA. [VERIFIED: Phase 101 CONTEXT.md]

**Warning signs:** No `upstream` remote exists locally, or the audit contains only an old SHA without a fresh `ls-remote`/fetch record. [VERIFIED: local Kehto git inspection]

### Pitfall 2: A “read-only” Writer audit silently changes Writer
**What goes wrong:** A convenience `git checkout`, `stash`, worktree creation, or remote fetch changes refs/index/files and violates preservation. [VERIFIED: Phase 101 CONTEXT.md]

**How to avoid:** Restrict Phase 101 Writer commands to status, ref, log, diff, remote, worktree, and config reads; write future mutation commands only as fenced post-approval templates. [VERIFIED: Phase 101 CONTEXT.md]

**Warning signs:** Any Writer `git status` difference from the audit snapshot, a new remote/ref/worktree, or a changed `HEAD`. [VERIFIED: local Writer git inspection]

### Pitfall 3: Unreviewable Writer plan
**What goes wrong:** The plan says “integrate Paja” without naming the canonical base, dependency commit, exact file set, NAP boundary, tests, or approval gate. [VERIFIED: REQUIREMENTS.md]

**How to avoid:** Make unresolved canonical remote/default branch and Paja commit explicit blocking fields, not placeholders that an executor can guess past. [VERIFIED: Phase 101 CONTEXT.md]

**Warning signs:** The plan can be executed without a human decision, or it names local `master` as authoritative. [VERIFIED: Phase 101 CONTEXT.md]

### Pitfall 4: Calling draft hardening rules protocol requirements
**What goes wrong:** Reviewers are told NAP-BLOSSOM mandates request-bound URL/hash/size validation when it does not. [CITED: https://raw.githubusercontent.com/napplet/naps/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md]

**How to avoid:** Label stronger validation as a Kehto product-security rule and a draft-spec gap in each later PR and test. [VERIFIED: Phase 101 CONTEXT.md]

## Code Examples

### Future clean-worktree creation

```bash
# Execute only after explicit user approval and verified canonical Writer values.
BASE="$(git -C /workspace/projects/writer rev-parse --verify 'origin/<DEFAULT_BRANCH>^{commit}')"
git -C /workspace/projects/writer worktree add \
  -b feat/paja-social-blossom-integration \
  /workspace/projects/writer-paja-social-blossom \
  "$BASE"
```

Source: [Git worktree documentation](https://git-scm.com/docs/git-worktree). [CITED: https://git-scm.com/docs/git-worktree]

### Future Writer standard-NAP shape

```ts
// Implement in the approved clean Writer worktree, never in Phase 101.
const sessionPubkey = await identity.getPublicKey();
const identitySubscription = identity.onChanged((pubkey) => {
  // Reset candidates and reject work from the prior session generation.
});

const result = await outbox.query([{ kinds: [0], authors: authorBatch }]);
// Retain valid results even when result.incomplete or result.error is present.
// Reduce each author by greatest created_at; on ties use lexically lowest id.

await upload.upload({
  rail: 'blossom',
  data: file,
  filename: file.name,
  mimeType: file.type,
});
```

Sources: [NAP-IDENTITY](https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md), [NAP-OUTBOX](https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md), [NAP-UPLOAD](https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md), and [NIP-01](https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md). [CITED: official pinned protocol references]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Writer calls `common.getProfile` once per followed pubkey in groups of 12. | Planned migration is bounded `outbox.query` batches for kind-0 events with a deterministic reducer. | Phase 104 after Paja dependency and explicit approval. | Keeps relay access shell-mediated and makes partial result semantics explicit. [VERIFIED: local Writer source inspection] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md] |
| Writer upload omits a rail. | Planned call supplies `rail: "blossom"`. | Phase 104 after Paja dependency and explicit approval. | Requests the selected host-owned rail without giving Writer direct authority. [VERIFIED: local Writer source inspection] [CITED: https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |
| Historical upstream check at `d4ba157`. | Fresh upstream check at source-branch creation. | Required immediately before Paja source work. | Prevents implementation from omitting new upstream Paja work such as the target-CORS diagnostic. [VERIFIED: GitHub API and Phase 101 CONTEXT.md] |

## Open Questions (RESOLVED)

All three values are intentionally unavailable external prerequisites for Phase 101. The phase resolves them only by failing closed: each remains `BLOCKED` until its external source is available, and no value is inferred or invented.

1. **Canonical Writer repository URL, default branch, naming rules, and authoritative base SHA**
   - Resolution for Phase 101: `BLOCKED` — intentionally unavailable external prerequisite. Writer has no configured remote, and local `master@3a43897` remains comparison-only. No Writer remote or worktree command runs until the Phase 104 gate refreshes and verifies the canonical values. [VERIFIED: Phase 101 CONTEXT.md]

2. **Exact Paja implementation commit or consumable artifact**
   - Resolution for Phase 101: `BLOCKED` — intentionally unavailable external prerequisite. The exact Phase 102/103 completion SHA or released/stacked artifact does not yet exist; Phase 101 records the dependency slot without assigning a value. [VERIFIED: ROADMAP.md]

3. **Exact canonical-Writer source and test seams**
   - Resolution for Phase 101: `BLOCKED` — intentionally unavailable external prerequisite. The canonical remote may have moved the observed local architecture, so the Phase 101 plan records only tentative scope and requires Phase 104 revalidation against the refreshed canonical base before edits. [VERIFIED: Phase 101 CONTEXT.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Git | All audit evidence and later worktree isolation | ✓ | `2.51.2` | — [VERIFIED: local environment audit] |
| GitHub CLI | Read-only changed-file/range evidence | ✓ | `2.83.2` | `git ls-remote` and GitHub web/API access. [VERIFIED: local environment audit] |
| Corepack | Writer's pinned package-manager invocation | ✓ | `0.34.0` | — [VERIFIED: local environment audit] |
| pnpm executable | Future Writer verification | ✗ | — | Use `corepack pnpm`, as Writer documents. [VERIFIED: local environment audit and Writer README] |
| Canonical Writer remote/default branch | Clean Writer integration worktree | ✗ | — | None; blocks Writer setup and source work. [VERIFIED: local Writer git inspection] |

**Missing dependencies with no fallback:**
- Canonical Writer repository URL/default branch and its verified SHA. [VERIFIED: Phase 101 CONTEXT.md]

**Missing dependencies with fallback:**
- Bare `pnpm`; invoke the pinned manager through `corepack pnpm`. [VERIFIED: local Writer package.json and environment audit]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Kehto framework | Vitest `^4.1.2`; Playwright `^1.54.0` is configured for browser tests. [VERIFIED: local Kehto package.json and config] |
| Writer framework | Vitest `4.1.10` through `corepack pnpm test`; no Writer Vitest config file is present. [VERIFIED: local Writer package.json and file inspection] |
| Phase 101 quick run | Read-only evidence commands plus `git diff --check` on the two new planning artifacts. [VERIFIED: Phase 101 scope] |
| Phase 101 full run | Re-run the complete evidence snapshot and compare it to `101-BASELINE-AUDIT.md`; do not run Writer source verification because Writer is intentionally untouched. [VERIFIED: Phase 101 CONTEXT.md] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRE-01 | Kehto baseline/range and Writer WIP/remote/history are recorded without Writer mutation. | Audit / manual evidence | Read-only Git/GitHub command set in the audit artifact; compare current Writer snapshot to recorded values. | ❌ Wave 0 artifact |
| PRE-02 | Contribution plan has blockers, exact setup, dependency, source/test scope, NAP matrix, PR exclusions, and human approval gate. | Documentation static review | `rg -n 'BLOCKED|approve Writer implementation|feat/paja-social-blossom-integration|identity.getFollows|outbox.query|rail: "blossom"' .planning/phases/101-baseline-writer-contribution-preflight/101-WRITER-CONTRIBUTION-PLAN.md` | ❌ Wave 0 artifact |

### Sampling Rate

- **Per task commit:** `git diff --check -- .planning/phases/101-baseline-writer-contribution-preflight`
- **Per wave merge:** Repeat Writer evidence commands and verify `git -C /workspace/projects/writer status --porcelain=v1` still matches the audit snapshot.
- **Phase gate:** The two artifacts are complete, no Writer-mutating command ran, and the plan visibly stops at the human approval checkpoint. [VERIFIED: Phase 101 CONTEXT.md]

### Wave 0 Gaps

- [ ] `101-BASELINE-AUDIT.md` — timestamped baseline/WIP inventory and reproducible command output summary for PRE-01.
- [ ] `101-WRITER-CONTRIBUTION-PLAN.md` — post-approval setup template, blockers, Paja dependency slot, exact tentative Writer scope, protocol matrix, tests, full gates, and PR exclusions for PRE-02.
- [ ] Future Phase 104: `src/integrations/followed-profiles.test.ts` — deterministic event selection and partial-result vectors after the canonical base is approved. [VERIFIED: local Writer source structure]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes, for future Writer identity state | Use read-only `identity.getPublicKey`/`getFollows` and pushed `identity.changed`; no Writer key or signing access. [CITED: https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md] |
| V3 Session Management | Yes, for future account switch/logout | Clear candidates and fence async work by active identity generation on identity changes. [VERIFIED: Phase 101 CONTEXT.md] |
| V4 Access Control | Yes | Preserve Paja ACL/consent ownership; Writer does not obtain direct relay, HTTP, upload, or credential authority. [CITED: https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |
| V5 Input Validation | Yes | Verify canonical Git refs before basing worktrees; validate kind-0 author/event fields in the later reducer; do not evaluate command values from audit text. [CITED: https://git-scm.com/docs/git-worktree] |
| V6 Cryptography | Yes | Paja/shell signs Blossom authorization; Writer never implements signing or cryptography. [CITED: https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |

### Known Threat Patterns for this Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Dirty WIP is accidentally incorporated into milestone source | Tampering | Use read-only audit commands now and an approved linked worktree later. [CITED: https://git-scm.com/docs/git-worktree] |
| Unverified local branch is treated as canonical Writer upstream | Tampering | Block on canonical remote/default branch/SHA; local `master` is comparison-only. [VERIFIED: Phase 101 CONTEXT.md] |
| Writer gains direct network, credential, or signing authority | Elevation of Privilege | Keep all relay/resource/upload/signing work behind standard Paja NAP services. [VERIFIED: REQUIREMENTS.md] |
| Draft behavior is represented as mandatory protocol behavior | Repudiation | Record the pinned document SHA and separate conformance from intentional product-security gaps. [VERIFIED: AGENTS.md] |

## Assumptions Log

All claims in this research were verified against local repository/Git evidence or cited official documentation; no training-only claims are used.

## Sources

### Primary (HIGH confidence)

- Local Kehto and Writer Git inspection — refs, history, status, worktrees, remotes, source seams, package metadata, and environment availability. [VERIFIED: local git inspection]
- GitHub API `kehto/web` compare and commit endpoints plus `git ls-remote` — current upstream SHA and Paja-affecting incoming change list. [VERIFIED: GitHub API and git ls-remote]
- [Git worktree documentation](https://git-scm.com/docs/git-worktree) — linked-worktree isolation and `-b` workflow. [CITED: https://git-scm.com/docs/git-worktree]

### Secondary (MEDIUM confidence)

- [NAP-IDENTITY pinned `6461e4b`](https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md) — identity snapshot/change/authority rules.
- [NAP-OUTBOX pinned `4589a8f`](https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md) and [NIP-01](https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md) — batched events, partial result semantics, and deterministic replacement ordering.
- [NAP-RESOURCE pinned `fa6bcc6`](https://raw.githubusercontent.com/napplet/naps/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md), [NAP-UPLOAD pinned `a7cc174`](https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md), and [NAP-BLOSSOM pinned `ca1d7ba`](https://raw.githubusercontent.com/napplet/naps/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md) — mediated resource/upload boundary and draft gap.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Git, installed tool versions, and existing Writer/Kehto dependencies were inspected locally.
- Architecture: MEDIUM — The locked cross-repository boundary and local seams are clear, but canonical Writer remote/default branch and Paja implementation SHA are intentionally unresolved.
- Pitfalls: HIGH — Dirty-state, upstream divergence, and protocol-draft distinctions are directly evidenced by Git/GitHub inspection and pinned documentation.

**Research date:** 2026-07-24
**Valid until:** Re-check Kehto upstream and Writer state immediately before Phase 101 execution closes and again before any Phase 102/104 source branch is created; both are mutable Git state. [VERIFIED: Phase 101 CONTEXT.md]
