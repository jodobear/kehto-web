# Phase 103: Paja Blossom Rail PoC - Context

**Gathered:** 2026-07-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver production-solid, generic NAP-UPLOAD behavior in Paja, with Blossom as the only implemented transport rail. Paja/shell owns configured-server selection, replication, consent, kind-24242 authorization, network transfer, stored-byte verification, policy, cancellation, and result reporting. Napplets receive only standard upload statuses/results and later read verified result URLs through standard `resource.bytes`.

This is gap-audit and hardening work over existing upload code, not a greenfield uploader or a controlled-fixture PoC. Planning must revise the current Phase 103/requirement terminology and placement so this phase owns the solid upload behavior selected here rather than silently deferring it to Phase 105.

Writer source work, NIP-96 expansion, napplet-visible server choice, low-level NAP-BLOSSOM APIs, `blossom:sha256` reads, and napplet-initiated upload cancellation remain outside this phase.

</domain>

<decisions>
## Implementation Decisions

### Public capability and transport boundary
- **D-01:** Upload is the product capability; Blossom is the only rail implemented now. Preserve the generic NAP-UPLOAD surface and expose no Paja-specific or low-level Blossom API.
- **D-02:** Paja/shell retains all server, consent, signer, authorization, networking, policy, verification, cancellation, and diagnostics authority. Napplets never receive credentials, kind-24242 events, direct network access, or private-key access.
- **D-03:** Advertise upload when the host supports the feature, even if current configuration, signer, identity, or session readiness makes it unavailable. `upload.info` and upload results must report that unavailability truthfully instead of implying readiness.

### Configured-server replication
- **D-04:** Replicate to configured Blossom servers only. If no server is configured, upload is unavailable. BUD-03 discovery may inform host configuration but must not silently become an upload target. — **Reversibility:** costly — changing this later affects consent scope, authorization targets, egress policy, result ordering, and tests.
- **D-05:** Attempt every configured server sequentially in configured order. One configured server therefore produces one attempt; multiple configured servers produce ordered replica attempts.
- **D-06:** A replicated upload is `complete` when at least one replica passes every completion check. The first successful URL in configured order is `url`; later ordered successes are `fallbackUrls`. Replica-local failures remain host diagnostics under the current NAP result shape.
- **D-07:** Continue to later servers after replica-local network failure, retry exhaustion, server rejection, malformed descriptor, or failed stored-byte proof. Stop the operation on consent cancellation, teardown/host abort, policy denial, or active identity/signer change.
- **D-08:** Retry transient network or HTTP 5xx failure once on the same server before continuing. Do not retry consent/policy denial, malformed descriptors, or failed byte proof.
- **D-09:** Do not add an automatic timeout. A hung server may block later sequential replicas until its request settles or teardown aborts it.

### Completion and media proof
- **D-10:** Descriptor URL/hash/size agreement is insufficient. Before a replica URL can enter `url` or `fallbackUrls`, shell-owned networking must GET the stored bytes and recompute exact SHA-256 and byte size.
- **D-11:** Returned URLs may use a CDN or object-store origin rather than the configured server origin, but must be public HTTPS, pass SSRF/private-network policy, and pass exact stored-byte verification.
- **D-12:** Sniff the retrieved bytes for MIME. Enforce the host allowlist on the sniffed type and reject conflicting non-generic request or descriptor MIME claims.
- **D-13:** Successful verification creates a requesting-window/session-scoped resource grant for exactly the verified result URLs. Later preview remains standard `resource.bytes`; grants are revoked on teardown. Upload success never grants arbitrary origin access.

### Policy and consent
- **D-14:** Present one consent prompt before any upload egress. It must disclose every ordered target server, replica count, file size, MIME, public/durable storage, and worst-case total transferred bytes.
- **D-15:** Consent is remembered for the current session, not permanently and not per individual upload. — **Reversibility:** costly — the grant key becomes part of host consent behavior and security expectations.
- **D-16:** Key a session grant by napplet/window, active identity, exact ordered server set, MIME class, and size ceiling. Any tuple change invalidates the grant and requires new consent.
- **D-17:** Paja host configuration controls maximum bytes and allowed MIME types using safe defaults. Server metadata may narrow but never expand host policy. Reject policy violations before consent, signing, hashing-dependent authorization, or network activity.

### Lifecycle, status, and failure truthfulness
- **D-18:** Emit `uploading` plus exactly one terminal `complete`, `failed`, or `cancelled` status. Do not add an initial `pending` push. `upload.status` must return the latest matching state.
- **D-19:** Use existing NAP state/error fields with documented machine-stable code strings for consent denial, teardown cancellation, unavailable backend, policy denial, malformed descriptor, server/network failure, and failed verification. Do not add local wire fields that falsely claim draft conformance.
- **D-20:** Only user/consent cancellation and teardown/host abort use terminal `cancelled`, with distinct stable codes. Unavailable, policy, malformed, network, server, and verification outcomes use `failed`.
- **D-21:** If cancellation occurs after one replica verified but before the operation finishes, stop remaining work, drop late responses, return `cancelled`, and expose no success URLs to the napplet. Host UI/diagnostics must tell the user which durable copies may already exist; cancellation cannot claim those copies were deleted.

### Upstream specification follow-up
- **D-22:** Current NAP-UPLOAD can return ordered successful URLs through `url` and `fallbackUrls`, but cannot report one outcome per attempted server. Phase 103 must submit either a focused comment or a PR to `napplet/naps` PR #33 proposing per-server replica outcomes and structured error codes. The local fork is `/workspace/projects/napplets/naps`. — **Reversibility:** one-way — an accepted wire-schema change becomes a cross-implementation protocol contract.
- **D-23:** Keep Kehto behavior conformant to the pinned existing draft while the upstream proposal is unresolved: use current fields now, document the spec gap, and do not represent proposed fields as standardized.

### Planning and contribution boundary
- **D-24:** Recheck exact NAP-UPLOAD, NAP-BLOSSOM, and NAP-RESOURCE refs before source planning and report pinned-draft alignment, upstream drift, or explicit product-security gaps. No current-`master` conformance claim is allowed while the proposals remain unmerged.
- **D-25:** Phase 102 PR #217 remains the source dependency. Before Phase 103 source edits, refresh `upstream/main` and record whether implementation waits for merge or stacks explicitly on `81185b45c99544fbb63271da4bcfc69334e759e1`.
- **D-26:** Keep Phase 103 implementation, tests, required docs, and changesets focused. Exclude `.planning/**`, Graphify output, Writer WIP, generated noise, NIP-96, low-level NAP-BLOSSOM operations, and unrelated cleanup from the Kehto upstream contribution.

### Claude's Discretion
- Exact safe default size and MIME allowlist values, provided host config remains authoritative and defaults fail safely.
- Exact stable error-code spelling and host diagnostic shape within existing NAP fields.
- Retry backoff details for the one allowed transient retry.
- Whether the upstream NAP-UPLOAD follow-up is a comment or PR: use a PR only if research yields a complete, reviewable wire-schema patch; otherwise post the concrete use case and schema gap as a focused comment.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and repository rules
- `.planning/PROJECT.md` — fork-v1.29-paja-social-blossom standard-NAP boundary, contribution hygiene, Writer approval gate, and pinned protocol refs.
- `.planning/REQUIREMENTS.md` — current UPLOAD-02/POC-02 ownership plus terminology and hardening placement that planning must re-scope.
- `.planning/ROADMAP.md` — current Phase 103 goal/dependencies and Phase 102→103→104 ordering; PoC wording is superseded by this discussion and must be revised during planning.
- `.planning/STATE.md` — current phase position, PR #217 dependency, and carried Writer/branch constraints.
- `.planning/phases/101-baseline-writer-contribution-preflight/101-CONTEXT.md` — Paja-first delivery, Writer source prohibition, focused-PR hygiene, and NAP authority matrix.
- `AGENTS.md` — dirty-state protocol, NAP conformance guardrails, full Kehto wiring requirements, tests/docs/changeset rules, and shipping gates.

### Existing upload and resource implementation
- `packages/services/src/upload-service.ts` — generic NAP-UPLOAD request/result/status service, per-window tracking, and teardown cancellation seam.
- `packages/services/src/http-uploader.ts` — current first-server HTTP transport, kind-24242 authorization, descriptor validation, progress emission, abort handling, and NIP-96/Blossom branching.
- `packages/services/src/upload-service.test.ts` — service lifecycle, status lookup, and teardown coverage.
- `packages/services/src/http-uploader.test.ts` — descriptor hash/size validation, malformed results, cancellation during hashing/fetch, and transport failures.
- `packages/services/src/resource-service.ts` — standard resource fetch, request tracking, cancellation, and origin-policy integration that scoped upload-result grants must use.
- `docs/policies/SHELL-RESOURCE-POLICY.md` — SSRF/private-network and resource-origin policy requirements; development shortcuts are not production conformance.

### Paja integration
- `packages/paja/src/browser-upload.ts` — current configured/discovered server selection, per-upload consent, signer binding, policy checks, first-server delegation, and returned-URL normalization.
- `packages/paja/src/browser-upload.test.ts` — discovery, signer identity, policy ordering, consent, and descriptor URL coverage.
- `packages/paja/src/browser-adapter.ts` — upload/resource service registration and current resource grant bridge.
- `packages/paja/src/browser-host.ts` — host consent UI and window teardown integration.
- `packages/paja/src/simulation.ts` — upload configuration normalization and mode defaults.
- `docs/how-tos/paja-local-authoring.md` — current documented first-server behavior and Blossom upload safety model that Phase 103 must update.

### Runtime and shell surfaces
- `packages/runtime/src/upload-dispatch.test.ts` — upload domain routing and ACL-enforced wire behavior.
- `packages/runtime/src/runtime.ts` — service registration and window-destruction lifecycle.
- `packages/shell/src/napplet-namespace.ts` — injected standard upload API.
- `packages/shell/src/shell-init.ts` — capability advertisement behavior that must distinguish support from current availability.

### Pinned protocol authority checked 2026-07-28
- `napplet/naps@a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-UPLOAD.md` — high-level upload messages, rail selection, status/result shape, shell authority, integrity reporting, and server-confirmed success requirement. PR #33 remains open.
- `napplet/naps@ca1d7ba594e6790785dc770227085d8648d39631:naps/NAP-BLOSSOM.md` — low-level Blossom transport, ordered BUD-03 lists, BUD-11 authorization details, and descriptor fields. PR #71 remains draft and is not a napplet API for this phase.
- `napplet/naps@fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1:naps/NAP-RESOURCE.md` — mediated bytes, MIME classification, cancellation, policy, and late-response suppression. PR #80 remains open.
- `/workspace/projects/napplets/naps/AGENTS.md` — repository workflow and contribution rules to read before any upstream comment branch or PR work.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createUploadService`: retain generic envelope handling, status map, and per-window teardown rather than creating a Paja-specific protocol.
- `createHttpUploader`: extend the existing hashing, kind-24242 signing, `AbortController`, descriptor parsing, and progress seams to one sequential operation per configured server.
- `createPajaBrowserUploadRuntime`: retain fail-closed signer/identity checks, policy-before-egress ordering, consent hook, and host-owned server configuration.
- `createResourceService`: use its normal request scoping and cancellation path for verified-result previews; add narrow upload-result grants rather than direct fetch access for napplets.

### Established Patterns
- Shell-owned external authority: napplets send bytes/metadata and receive standard results; shell performs signing, policy, network, and verification.
- Per-window cleanup: service state, in-flight requests, resource grants, and late envelopes are destroyed or ignored when the owning window ends.
- Exact-source validation: local request bytes define expected SHA-256/size; remote descriptors and retrieved bytes are claims to verify.
- Focused contribution hygiene: planning stays on the fork, implementation starts from refreshed upstream/stacked baseline, and upstream PRs exclude planning/Writer/unrelated files.

### Integration Points
- Paja upload runtime must pass the full ordered configured-server set to the transport instead of selecting index zero.
- HTTP uploader must produce ordered verified successes and replica diagnostics while preserving one correlated NAP-UPLOAD result.
- Resource service needs a narrow API for window/session-scoped grants created only after upload verification and revoked on teardown.
- Shell capability/info behavior must separate feature support from current backend readiness.
- Host UI needs one replica-aware consent prompt and truthful disclosure of already-stored copies after mid-operation cancellation.
- Tests must cover generic service, reference HTTP transport, Paja runtime, resource grants, runtime/shell surface, and browser-level standard-NAP flow together.

</code_context>

<specifics>
## Specific Ideas

- Configured order is product-significant: attempt order, primary `url`, and `fallbackUrls` order all follow it.
- A single configured server is the natural one-replica case; no separate behavior mode is needed.
- The user wants one result for each attempted server upstream, not just successful fallback URLs. Until NAP-UPLOAD gains that shape, Kehto exposes successes through current fields and keeps failures in host diagnostics.
- Cancellation after partial storage must be honest: the napplet sees cancellation, while host UI warns that already-written public copies may remain.
- No automatic timeout is intentional even though a hung first server can block later replicas.

</specifics>

<deferred>
## Deferred Ideas

- Napplet-visible per-server replica outcomes and structured error fields depend on upstream NAP-UPLOAD resolution; Kehto uses current fields until accepted.
- `blossom:sha256` reads, low-level NAP-BLOSSOM check/mirror/list/delete/transform APIs, NIP-96 expansion, multi-rail user choice, detailed stable byte-progress contracts, and napplet-initiated upload cancellation remain future requirements.
- Writer source integration remains Phase 104 and still requires explicit approval after the Paja implementation artifact and canonical Writer baseline are ready.

</deferred>

---

*Phase: 103-paja-blossom-rail-poc*
*Context gathered: 2026-07-28*
