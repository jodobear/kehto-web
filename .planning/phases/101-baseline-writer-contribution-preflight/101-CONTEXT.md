# Phase 101: Baseline & Writer Contribution Preflight - Context

**Gathered:** 2026-07-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the smallest safe preflight needed to begin the v1.29 Paja and Writer work quickly: pin Kehto's upstream implementation baseline, classify the existing Writer branch and dirty shortcut WIP without changing it, and produce an executable Writer contribution plan with a hard approval checkpoint. This phase may create planning/audit artifacts in this Kehto fork. It does not implement Paja social/upload behavior and does not edit Writer source files.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and repository rules
- `.planning/ROADMAP.md` — Phase 101 goal, PRE-01/PRE-02 ownership, dependencies, and success criteria.
- `.planning/REQUIREMENTS.md` — frozen v1.29 requirements, Writer approval boundary, standard-NAP constraints, and PR exclusions.
- `.planning/PROJECT.md` — milestone goal, Paja/Writer scope, protocol pins, and contribution hygiene.
- `.planning/STATE.md` — current phase position, preserved Writer WIP decision, blockers, and protocol-ref recheck requirement.
- `AGENTS.md` — dirty-state protocol, branch/PR workflow, NAP conformance guardrails, verification gates, and explicit-path staging rules.

### Milestone research
- `.planning/research/SUMMARY.md` — PoC-first architecture, standard-NAP boundary, priority risks, and cross-repository delivery order.
- `.planning/research/ARCHITECTURE.md` — Paja integration points, identity/outbox/resource/upload data flows, and test architecture.
- `.planning/research/PITFALLS.md` — stale identity, deterministic kind-0 reduction, partial results, media ownership, Blossom validation, and real-Writer E2E hazards.

### Current Paja and Writer evidence
- `packages/paja/src/parity.ts` — Paja already advertises and expects identity, outbox, resource, and upload domains/services.
- `packages/paja/src/browser-host.ts` — current signer-connect reload behavior and host/runtime integration seam used by later Paja phases.
- `../../writer/README.md` — Writer's existing mention, upload, resource, optional-capability, and no-direct-network contracts.
- `../../writer/package.json` — Writer verification commands and pinned `@napplet`/Kehto tool dependencies.
- `../../writer/.napplet/config.json` — current Paja command, relay list, Blossom candidates, and interactive signing setup.

### Pinned protocol authority
- `https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md` — identity request/result and `identity.changed` lifecycle.
- `https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md` — aggregate query, partial-result semantics, routing, deduplication, and validation.
- `https://raw.githubusercontent.com/napplet/naps/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md` — shell-mediated bytes, runtime-classified MIME, cancellation, and resource identity scope.
- `https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md` — Writer-facing upload request, rail selection, statuses, results, and shell authority.
- `https://raw.githubusercontent.com/napplet/naps/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md` — lower-level Blossom transport, authorization, and descriptor behavior.
- `https://github.com/nostr-protocol/nips/blob/master/01.md` — replaceable kind-0 event ordering and equal-timestamp event-ID tie rule.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/paja/src/parity.ts`: existing identity/outbox/resource/upload capability inventory prevents inventing a custom social API.
- `packages/paja/src/browser-host.ts`: established ShellBridge, signer controller, iframe lifecycle, and message-log seams for later Paja work.
- Writer's current mention and paste-upload flows: later plans should migrate existing behavior rather than build parallel UI paths.

### Established Patterns
- Shell-owned authority: identity, relays, resources, uploads, consent, signing, and external network access stay outside the napplet.
- Dirty-state isolation: preserve unrelated work in place; branch/worktree new implementation from a verified clean baseline.
- Cross-repository proof without dependency contamination: run the exact Kehto/Paja implementation against Writer's target URL, then normalize dependencies before upstream PRs.
- Focused contribution hygiene: planning remains in the fork; each upstream PR excludes `.planning/**`, Graphify output, screenshots, preserved WIP, and unrelated cleanup.

### Integration Points
- Kehto fork `origin` is `jodobear/kehto-web`; canonical implementation upstream is `kehto/web` `main`.
- Writer runtime delegates to `kehto` through `../../writer/.napplet/config.json`; this is the fast PoC seam once Paja functionality exists.
- Writer's clean milestone worktree must be created from a verified canonical upstream ref, never from the dirty shortcut branch.

</code_context>

<specifics>
## Specific Ideas

- User priority: stop discussion overhead and get Paja functionality plus the real Writer flow working as soon as safely possible.
- Current Writer WIP is valuable unrelated shortcut/settings work, not disposable noise. Its paused checkpoint also records blocking shortcut-collision and placeholder-profile issues; those remain outside the clean milestone branch unless the v1.29 plan explicitly requires the corresponding profile/upload seam.
- Kehto upstream baseline check on 2026-07-24 found `kehto/web/main` identical to local implementation commit `d4ba157`; Phase 101 should record this as a no-op rebase result rather than manufacture source churn.

</specifics>

<deferred>
## Deferred Ideas

None added during this discussion. Future `blossom:sha256`, low-level NAP-BLOSSOM operations, social expansion, and upload-progress/multi-rail features remain deferred exactly as listed in `.planning/REQUIREMENTS.md`.

</deferred>

---

*Phase: 101-baseline-writer-contribution-preflight*
*Context gathered: 2026-07-24*
