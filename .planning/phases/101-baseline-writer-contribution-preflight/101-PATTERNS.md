# Phase 101: Baseline & Writer Contribution Preflight - Pattern Map

**Mapped:** 2026-07-24  
**Files analyzed:** 2 planned artifacts  
**Analogs found:** 2 / 2

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.planning/phases/101-baseline-writer-contribution-preflight/101-BASELINE-AUDIT.md` | audit / immutable evidence snapshot | batch / transform | `.planning/milestones/v1.6-MILESTONE-AUDIT.md` | role-match |
| `.planning/phases/101-baseline-writer-contribution-preflight/101-WRITER-CONTRIBUTION-PLAN.md` | configuration / contribution plan | approval-gated request-response | `.planning/quick/260711-r4p-implement-usable-nap-upload-in-kehto-paj/260711-r4p-PLAN.md` | partial role-match |

The existing `101-VALIDATION.md` is an input contract, not a Phase 101 implementation artifact to change. `101-PATTERNS.md` is this mapper's required output and is not an execution artifact.

## Pattern Assignments

### `.planning/phases/101-baseline-writer-contribution-preflight/101-BASELINE-AUDIT.md` (audit, batch/transform)

**Analog:** `.planning/milestones/v1.6-MILESTONE-AUDIT.md`

Use the audit's machine-readable header, explicit verdict/status, evidence tables, and separately named deferred/upstream-risk sections. Phase 101 differs materially: it records a timestamped *read-only* snapshot and unresolved blocks rather than a completed-milestone verdict. Do not claim a stable Writer SHA/status after the audit timestamp, because the Writer tree is concurrently mutable.

**Metadata and status pattern** (lines 1-19):
```yaml
---
milestone: v1.6
milestone_name: "Downstream Unblock & Shell Service Surface"
audited: 2026-04-23
status: passed
scores:
  requirements: 21/21
  phases: 5/5
  integration: 12/12
  flows: 1/1
---
```

Copy the concise metadata structure, but use fields such as `phase`, `audited_at`, `kehto_upstream_checked_at`, `writer_snapshot_at`, and `status: recorded`. Do not use `passed` until PRE-01 evidence and preservation review are complete.

**Requirement-to-evidence matrix pattern** (lines 61-85):
```markdown
## Requirements Coverage (21/21)

| REQ-ID | Phase | Description | Status | Evidence |
|--------|-------|-------------|--------|----------|
| DEP-01 | 32 | ... | ✓ Complete | packages/{acl,runtime,shell,services}/package.json |
```

For PRE-01, use a row per independently checkable fact: historical Kehto baseline `d4ba157...`; fresh `upstream/main` result/range; Paja-affecting incoming commits; Writer branch/HEAD; local `master` comparison; porcelain status; staged/unstaged name-status; untracked paths; remotes; and worktrees. Each row must identify the exact read-only command and observation timestamp.

**Risk and deferral separation pattern** (lines 117-136):
```markdown
## Upstream Work Filed

- **napplet/napplet#3** — "Receive-side NIP-44 decrypt surface ..."

## Seeds Planted

- **SEED-001** — File upstream issue for ...

## Tech Debt Summary

8 items across 4 phases (no blockers):
```

Use the same separated headings to avoid converting unresolved facts into implementation instructions: `Blocking Preconditions` must contain the canonical Writer remote/default branch/SHA and Paja dependency SHA/artifact; `Excluded From This Phase` must explicitly list Writer remote/ref/worktree/source mutation and implementation-PR content.

**Core evidence commands** (research lines 159-171; include as a fenced reproducibility section, do not execute any mutating counterpart):
```bash
git -C /workspace/projects/writer status --porcelain=v1
git -C /workspace/projects/writer rev-parse HEAD master
git -C /workspace/projects/writer rev-list --left-right --count master...HEAD
git -C /workspace/projects/writer diff --name-status
git -C /workspace/projects/writer diff --cached --name-status
git -C /workspace/projects/writer ls-files --others --exclude-standard
git -C /workspace/projects/writer remote -v
git -C /workspace/projects/writer worktree list --porcelain
```

The audit must also record the no-mutation invariant: Phase 101 never runs `stash`, `commit`, `reset`, `checkout`, `clean`, `add`, `fetch`, `remote add`, `worktree add`, or any Writer source command. A later snapshot difference is evidence to classify, not permission to normalize the dirty checkout.

---

### `.planning/phases/101-baseline-writer-contribution-preflight/101-WRITER-CONTRIBUTION-PLAN.md` (configuration / contribution plan, approval-gated request-response)

**Analog:** `.planning/quick/260711-r4p-implement-usable-nap-upload-in-kehto-paj/260711-r4p-PLAN.md`

This is the closest local analog for a concrete, reviewable contribution plan: it establishes scope, protocol authority, explicit constraints, staged work, verification, and exclusions. Phase 101's Writer plan must be more restrictive: it documents actions for Phase 104 but terminates before any mutating Writer command. It is a human approval gate, not an executable autonomous plan.

**Plan frontmatter and file-scope pattern** (lines 1-30):
```yaml
---
phase: quick-260711-r4p
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [NAP-UPLOAD]
files_modified:
  - packages/services/src/http-uploader.ts
  - packages/services/src/http-uploader.test.ts
---
```

Adapt to the contribution-plan role: `phase: 101`, `status: blocked`, `requires_explicit_approval: true`, `future_phase: 104`, and `requirements: [PRE-02]`. Include a **tentative** Writer source/test list that must be revalidated against the canonical approved base. Do not describe listed files as modified in Phase 101.

**Authority-and-boundary pattern** (lines 89-104):
```markdown
## Objective

Replace Paja's protocol-shaped upload mock with an opt-in real Blossom path ...
The implementation must conform to `naps/NAP-UPLOAD.md` at `napplet/naps`
`a7cc17463cbf5d9cb87884b31071bc4fc826034c`: the shell owns policy,
server selection, consent, authorization signing, HTTP egress, and integrity claims.
```

Copy this direct authority declaration style into a NAP reference matrix. The matrix must include the exact pinned source, intended Writer call, conformance determination, and draft gap/product-policy distinction:

| Authority | Planned Writer use | Required statement |
|---|---|---|
| NAP-IDENTITY `6461e4b...` | `identity.getPublicKey`, `identity.getFollows`, pushed `identity.changed` | read-only identity; empty pubkey for signed-out; no polling/keys/signing |
| NAP-OUTBOX `4589a8f...` plus NIP-01 | bounded kind-0 `outbox.query` batches | retain valid events under query-wide `incomplete`/`error`; reduce greatest `created_at`, then lexically lowest ID |
| NAP-RESOURCE `fa6bcc6...` | `resource.bytes` / cancellation | Blob object URLs only; revoke URLs; never assign remote metadata/upload URLs to media |
| NAP-UPLOAD `a7cc174...` | `upload.upload({ rail: "blossom", ... })` | bytes and metadata only; Paja selects server, obtains consent, signs, transfers, and validates |
| NAP-BLOSSOM `ca1d7ba...` | no Writer call | request-bound descriptor URL/hash/size validation is Kehto product security, not a claimed draft mandate |

**Explicit decisions/exclusions pattern** (lines 106-130):
```markdown
## Scope decisions

- Keep `memory` as the backwards-compatible default; `blossom` is enabled explicitly ...
- Resolve upload servers in this order: ...
- Upload to the first effective server ...
- Accept HTTPS servers everywhere. Accept HTTP only for loopback development hosts ...
```

Use equivalent bullets for the Writer plan's non-negotiable exclusions: no direct relay/HTTP/WebSocket requests, no `window.nostr`, no private keys/signer access, no Paja-specific API, no workspace link/source copy/unpublished dependency change, no `.planning/**` or Graphify output in upstream implementation PRs, and no preserved shortcut WIP in the integration branch.

**Checkpoint / blocked-sequence pattern** (lines 132-146):
```markdown
## GSD quick and recovery checkpoints

... three sequential, recoverable vertical checkpoints:

1. hardened ... + focused green tests + ... commit;
2. ... + focused green tests + ... commit;
3. ... + full green gates + ... final commit, push, and PR.

... stage only the owning task paths. If interrupted, leave the latest green
checkpoint committed and record the exact next task/gate ...
```

For Phase 101, replace executable checkpoints with a hard human gate. The last pre-approval section must say exactly that no command below the heading **Post-approval-only commands** may run until the user says `approve Writer implementation` (or equivalent). The approval packet must contain: preserved-WIP inventory and timestamp; canonical remote/default branch/verified SHA; clean worktree/branch commands; exact Paja dependency commit/artifact; source/test list; NAP matrix; focused/full checks; and PR exclusions.

**Post-approval worktree template** (research lines 179-190; document verbatim as a template only):
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

Label this as `BLOCKED — Phase 104 only`. It must not be executed in Phase 101. In particular, `remote add`, `fetch`, and `worktree add` mutate Writer state.

**Verification and focused-PR pattern** (lines 329-368):
```markdown
## Verification

- Focused services and Paja unit/type/build checks pass after their owning tasks.
- ...
- `pnpm build`, `pnpm type-check`, `pnpm test:unit`, `pnpm test:e2e`, and
  `pnpm docs:check` pass on the final source tree.
- ... `git diff --check` is clean.

## Success criteria

- ...
- The open PR reports conformance against the pinned draft and records deferred
  non-required ... features without implying they shipped.
```

For the future Writer change, preserve the separation between focused and full gates. Use Writer's documented commands from `AGENTS.md` lines 35-50: `corepack pnpm type-check`, `corepack pnpm build`, and `corepack pnpm test:conformance`, followed by focused Writer tests and a Paja-hosted runtime smoke test using the URL Paja prints. Include Kehto's applicable gates separately. State that an upstream Writer PR includes only its scoped source/tests/docs, and a Kehto upstream PR includes only implementation/tests/required docs/changesets; neither carries planning files, screenshots, generated artifacts, or the preserved WIP.

## Shared Patterns

### Immutable evidence snapshots
**Sources:** `101-RESEARCH.md` lines 153-171; `.planning/milestones/v1.6-MILESTONE-AUDIT.md` lines 61-85  
**Apply to:** `101-BASELINE-AUDIT.md`, contribution-plan approval packet

Use a timestamped fact table with commands and raw output summaries, retain a separate historical record rather than overwriting it, and mark mutable Writer facts as observed-at rather than permanent. Repeat the exact read-only commands at close; report a difference without changing the Writer checkout.

### Standard-NAP authority matrix
**Sources:** `101-RESEARCH.md` lines 192-202; `.planning/quick/260711-r4p-implement-usable-nap-upload-in-kehto-paj/260711-r4p-VERIFICATION.md` lines 15-21  
**Apply to:** `101-WRITER-CONTRIBUTION-PLAN.md`, later Writer PR body/tests

The matrix must cite immutable NAP refs and distinguish: conformant planned behavior, unresolved upstream drift, and an intentional draft-spec/product-security gap. It must not treat local code, the plan, or draft assumptions as authority.

### Explicit approval and dirty-state preservation
**Sources:** `101-CONTEXT.md` lines 27-38; `CLAUDE.md` lines 12-29  
**Apply to:** both artifacts

The baseline audit states exactly what was preserved. The contribution plan names the only approval phrase that unlocks Phase 104, makes canonical remote/default branch/Paja artifact blocking fields, and keeps all Writer-mutating commands below a visibly labelled post-approval boundary. No automation may infer that approval.

### Focused contribution scope
**Sources:** `.planning/ROADMAP.md` lines 37-49 and 109-117; `.planning/quick/260711-r4p-implement-usable-nap-upload-in-kehto-paj/260711-r4p-PLAN.md` lines 303-316  
**Apply to:** future Kehto and Writer implementation PRs

Separate the two repositories' changes and list exclusions explicitly: `.planning/**`, `graphify-out/**`, screenshots, generated noise, unrelated cleanup, and Writer shortcut WIP. Stage by explicit path. Record the Paja dependency SHA/artifact and dependency order without adding ad hoc cross-repository links or source copies.

## No Exact Analog Found

| File | Role | Data Flow | Reason / planner instruction |
|---|---|---|---|
| `101-WRITER-CONTRIBUTION-PLAN.md` | approval-gated cross-repository contribution plan | request-response | No prior repository artifact combines a dirty external worktree preservation inventory, unresolved canonical upstream, required human approval, and a NAP matrix. Use the quick-plan structure above, but retain the explicit Phase 104 block from `101-RESEARCH.md` lines 173-202 and 299-314. |

## Metadata

**Analog search scope:** `.planning/milestones/**`, `.planning/quick/**`, root planning governance, `CLAUDE.md`, current phase inputs, and read-only Writer guidance/state  
**Files scanned:** 14 primary planning/workflow artifacts plus Git metadata queries  
**Graph query:** existing `graphify-out/graph.json` queried for preflight terms; it surfaced dirty-state and Paja/runtime context but no closer planning-artifact analog  
**Pattern extraction date:** 2026-07-24
