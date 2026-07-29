# Phase 103: Paja Blossom Rail PoC - Research

**Researched:** 2026-07-29
**Domain:** Shell-mediated NAP-UPLOAD over Blossom with scoped NAP-RESOURCE preview grants
**Confidence:** MEDIUM — implementation seams are directly verified in the repository, while the governing UPLOAD/RESOURCE/BLOSSOM NAP documents are pinned drafts that are absent from current `napplet/naps` master. [VERIFIED: codebase grep] [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)
- Napplet-visible per-server replica outcomes and structured error fields depend on upstream NAP-UPLOAD resolution; Kehto uses current fields until accepted.
- `blossom:sha256` reads, low-level NAP-BLOSSOM check/mirror/list/delete/transform APIs, NIP-96 expansion, multi-rail user choice, detailed stable byte-progress contracts, and napplet-initiated upload cancellation remain future requirements.
- Writer source integration remains Phase 104 and still requires explicit approval after the Paja implementation artifact and canonical Writer baseline are ready.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| UPLOAD-02 | Paja owns server selection, consent, kind-24242 signing, networking, policy, and validation; the client sees standard NAP-UPLOAD only. | Keep the generic `upload` service and Paja adapter, then harden `createHttpUploader`, `createPajaUploadRuntime`, ACL, and the browser fixture. [VERIFIED: codebase grep] |
| POC-02 | The PoC uses only NAP-IDENTITY/OUTBOX/RESOURCE/UPLOAD, with no Paja-specific, direct-network, Nostr-key, or napplet-side Blossom authority. | Use `upload.upload` plus a post-success `resource.bytes` fixture assertion; do not inject `blossom`, `relay`, or signer primitives into the iframe. [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Make no production/source changes from this research task; source execution must begin through the prescribed GSD workflow. [VERIFIED: CLAUDE.md]
- Implement on a non-default branch from a refreshed `upstream/main`; do not mix `.planning/**`, Graphify output, Writer WIP, generated files, or unrelated cleanup into an upstream PR. [VERIFIED: CLAUDE.md]
- Before every NAP/NIP-5D change, check the owning `napplet/naps` source and record its exact ref, wire direction, required/optional fields, lifecycle, security, capability, and package-type drift. [VERIFIED: CLAUDE.md]
- Preserve ESM-only, strict TypeScript, lowercase-hyphen filenames, JSDoc on public exports, and the zero-framework-dependency posture. [VERIFIED: CLAUDE.md]
- Update tests and user-facing documentation with implementation changes; run `pnpm build`, `pnpm type-check`, `pnpm test:unit`, `pnpm docs:check`, the AI-slop gate, and Playwright when Paja/shell wiring changes. [VERIFIED: CLAUDE.md]
- Add changesets for changed shipped package output; do not publish locally. [VERIFIED: CLAUDE.md]

## Summary

Phase 103 is a hardening-and-integration phase, not a new upload API. The repository already has a standard `upload` domain, a Paja Blossom adapter, a kind-24242 PUT transport, runtime ACL mapping, and a browser fixture. The present path selects only `servers[0]`, prompts per upload, trusts descriptor-only proof, permits Paja resource access with `['*']`, and never verifies the stored bytes. Those seams must become one Paja-owned sequential replication operation with a narrow verified-URL resource grant. [VERIFIED: codebase grep]

Use the pinned NAP-UPLOAD draft for napplet-facing envelopes and current installed `@napplet/nap@0.28.0` declarations for local type compatibility. The pinned NAP-UPLOAD, NAP-RESOURCE, and NAP-BLOSSOM files are all absent from local `napplet/naps` `master` at `5fd99465892fbead3888d7146e1737f77b0ed0b4`; Phase 103 must state pinned-draft alignment, not current-master conformance. [VERIFIED: codebase grep]

**Primary recommendation:** Extend the existing generic service/transport seams, but make Paja own a single abortable replica workflow that performs policy → one tuple-keyed consent → per-server BUD-11 authorization/PUT/retry → descriptor checks → policy-guarded stored-byte GET/hash/MIME proof → exact window URL grant; expose only the existing NAP-UPLOAD and NAP-RESOURCE envelopes. [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] [CITED: https://github.com/napplet/naps/blob/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Standard upload envelopes/status tracking | API / Backend | Browser / Client | `createUploadService` owns correlated `upload.*` messages and the iframe only posts/receives standard envelopes. [VERIFIED: codebase grep] |
| Configured replica selection, policy, consent, signer snapshot, and cancellation | Frontend Server (host runtime) | API / Backend | Paja is the browser host and retains the authority prohibited to the sandboxed napplet. [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |
| Kind-24242 authorization and raw PUT / stored GET | Frontend Server (host runtime) | External Blossom servers | The Paja-side transport signs and fetches; Blossom stores/retrieves raw bytes. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/02.md] |
| Verified-result preview | API / Backend | Frontend Server (host runtime) | `resource.bytes` remains the sole napplet byte path while Paja grants only proven URLs to the owning window. [CITED: https://github.com/napplet/naps/blob/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md] |
| Direct-network/key authority denial | Browser / Client | API / Backend | The opaque iframe receives a selective `window.napplet` namespace and ACL-gated NAP messages, not host credentials or relay/blossom APIs. [VERIFIED: codebase grep] |

## Protocol Authority and Drift Audit

| Authority | Exact source checked | Planning consequence |
|---|---|---|
| NAP-UPLOAD | `napplet/naps@a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-UPLOAD.md`; SHA-256 `fa9ef6df…1466e8`. [VERIFIED: codebase grep] | Use `upload.info`, `upload.upload`, `upload.status`, and `upload.status.changed`; retain `url`, `fallbackUrls`, and string `error` only. [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |
| NAP-RESOURCE | `napplet/naps@fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1:naps/NAP-RESOURCE.md`; SHA-256 `109f7f91…f446d`. [VERIFIED: codebase grep] | Preview through `resource.bytes`; enforce runtime MIME classification, identity scope, cancellation, and late-response suppression. [CITED: https://github.com/napplet/naps/blob/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md] |
| NAP-BLOSSOM | `napplet/naps@ca1d7ba594e6790785dc770227085d8648d39631:naps/NAP-BLOSSOM.md`; SHA-256 `2deb9ed1…0c16e5`. [VERIFIED: codebase grep] | Do not expose `window.napplet.blossom`; it explicitly says high-level storage belongs in NAP-UPLOAD. [CITED: https://github.com/napplet/naps/blob/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md] |
| NAP-SHELL / NIP-5D relevance | `napplet/naps@a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-SHELL.md`; SHA-256 `82c2f4cf…37a70a`. [VERIFIED: codebase grep] | Advertise the upload capability after the mandatory handshake based on host support; report run-time unavailability through standard `upload.info`/result fields. [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-SHELL.md] |
| Installed package contract | `node_modules/.pnpm/@napplet+nap@0.28.0/.../upload/types.d.ts` and `resource/types.d.ts`. [VERIFIED: codebase grep] | Existing types include `upload.info` and current RESOURCE envelopes, but no per-replica-outcome field; this confirms the upstream schema gap. [VERIFIED: codebase grep] |

**Drift:** local `napplet/naps` master has only NAP-SHELL among these paths; the three phase-owned draft files are absent. Keep the Phase 103 PR and docs explicitly pinned to the three draft refs. [VERIFIED: codebase grep]

### Blossom protocol requirements versus PoC policy

| Item | Protocol requirement | Phase 103 policy |
|---|---|---|
| Upload transfer | BUD-02 requires `PUT /upload`, exact raw bytes, server-side SHA-256, and descriptor response. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/02.md] | Upload every configured Paja server sequentially, retry one transient network/5xx failure, and never use discovery as an implicit target. [VERIFIED: 103-CONTEXT.md] |
| Authorization | BUD-11 authenticated upload requires kind `24242`, `t=upload`, future `expiration`, `X-SHA-256`, matching lowercase `x`, and an unpadded-base64url `Authorization: Nostr` event. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/11.md] | Add exact lowercase domain `server` scope for every attempt; Paja holds and signs the event. [CITED: https://github.com/napplet/naps/blob/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md] |
| Descriptor | BUD-02 requires `url`, `sha256`, `size`, `type`, and `uploaded`; `url` is publicly reachable and includes an extension. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/02.md] | Treat the descriptor as an untrusted claim, then GET the URL under resource/SSRF policy and prove exact bytes, size, and sniffed MIME before returning it. [VERIFIED: 103-CONTEXT.md] |
| Retrieval | BUD-01 defines `GET /<sha256>` and allows a filename extension; redirects preserve the hash-bearing URL. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/01.md] | Accept a public HTTPS CDN/object URL only after SSRF policy and stored-byte proof; do not promise deletion after a partial/cancelled replication. [VERIFIED: 103-CONTEXT.md] |
| Deletion | BUD-11 deletion uses `t=delete` and an `x` matching exactly the URL hash; an unscoped token can be replayed until expiry. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/11.md] | Do not attempt deletion on cancellation in this phase; disclose possible durable copies to the host user instead. [VERIFIED: 103-CONTEXT.md] |

## Standard Stack

### Core

| Library / existing module | Version | Purpose | Why standard |
|---|---:|---|---|
| `@kehto/services` `createUploadService` / `createHttpUploader` | `0.16.5` workspace manifest | Standard NAP envelope router and injected HTTP transport seam. [VERIFIED: codebase grep] | Extend its existing generic abstractions rather than creating a Paja upload protocol. [VERIFIED: codebase grep] |
| `@kehto/services` `createResourceService` | `0.16.5` workspace manifest | Standard `resource.bytes` mediation and teardown cancellation seam. [VERIFIED: codebase grep] | It is the existing standard preview route; add exact URL grants instead of iframe fetch. [CITED: https://github.com/napplet/naps/blob/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md] |
| `@kehto/paja` `createPajaUploadRuntime` | `0.8.2` workspace manifest | Host-owned signer, simulation policy, consent, and transport composition. [VERIFIED: codebase grep] | It is already the right Paja authority boundary and should become the replica orchestrator. [VERIFIED: codebase grep] |
| Browser Web Crypto / injected `Signer` | platform / existing runtime | SHA-256 verification and signed event creation. [VERIFIED: codebase grep] | Do not implement cryptography or private-key access in the napplet. [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |

### Supporting

| Existing tool | Purpose | When to use |
|---|---|---|
| Vitest `4.1.2` | Deterministic transport, lifecycle, grant, and policy regression coverage. [VERIFIED: codebase grep] | Every service and Paja-runtime behavior branch. |
| Playwright `1.54.0` | Real opaque-iframe Paja tracer with a local Blossom fixture. [VERIFIED: codebase grep] | Assert only standard messages cross the sandbox boundary and preview is mediated. |
| Node HTTP fixture | Controlled BUD-02/BUD-01 server behavior. [VERIFIED: codebase grep] | Extend `startBlossomServer()` to store/GET bytes, produce malformed descriptors, and model transient responses. |

**Installation:** No external packages are required or authorized for this phase. [VERIFIED: REQUIREMENTS.md]

## Architecture Patterns

### System Architecture Diagram

```text
Sandboxed standard-NAP fixture
  │ upload.upload { rail:"blossom", data, metadata }
  ▼
Runtime ACL: upload:write ──deny──> upload.upload.error
  │ allow
  ▼
createUploadService (correlation + latest status + teardown cancel)
  │
  ▼
Paja upload runtime
  ├─ policy: rail / default MIME / size ──deny──> failed stable code
  ├─ session tuple consent (ordered servers, identity, MIME class, ceiling) ──deny──> cancelled stable code
  └─ sequential configured replicas
       │ each: BUD-11 sign -> PUT /upload -> descriptor validation
       │       -> safe HTTPS GET -> SHA-256/size/MIME proof
       ├─ transient network or 5xx: one retry on same server
       ├─ replica-local failure: next configured server
       └─ verified success: ordered URL collection + exact window grant
  │
  ├─ uploading status, then exactly one terminal status
  ▼
upload.upload.result { url, fallbackUrls, NIP-94, standard error }
  │
  ▼
Sandboxed fixture resource.bytes(verified URL)
  │
  ▼
createResourceService -> exact window/session URL grant -> host-safe GET -> Blob/mime
```

The flow assigns no network, authorization event, server selector, signer, or credentials to the iframe. [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md]

### Component Responsibilities and likely files

| File / symbol | Current role | Required Phase 103 change |
|---|---|---|
| `packages/services/src/upload-service.ts` `createUploadService` | Correlates requests, retains per-window status, and calls `uploader.cancel()` on teardown. [VERIFIED: codebase grep] | Centralize allowed status transition emission: one `uploading`, one terminal snapshot, latest status lookup, and no late terminal push after teardown. |
| `packages/services/src/http-uploader.ts` `uploadBlossom` | Signs one kind-24242 event, PUTs to the first server, validates descriptor hash/size. [VERIFIED: codebase grep] | Make a one-server primitive correct: BUD-11 base64url, `X-SHA-256`, server tag, content-length, required descriptor fields, and an injected verification/response seam. Keep sequential orchestration above this primitive. |
| `packages/paja/src/browser-upload.ts` `createPajaUploadRuntime` | Selects effective server index zero, per-upload prompts, delegates one upload, and tracks active delegates. [VERIFIED: codebase grep] | Own the full configured-only replica workflow, tuple-keyed consent cache, identity-generation abort, retry, diagnostics, result ordering, and verified-URL grant callback. Remove BUD-03 as an implicit upload target. |
| `packages/paja/src/browser-adapter.ts` `createDevServices` / `createPajaAdapter` | Wires upload and a development resource service with `getConnectGrants: () => ['*']`. [VERIFIED: codebase grep] | Construct a narrow resource-grant store/service before the upload runtime; pass grant callback into upload runtime; revoke with the owning window. Replace universal origin grant for the Blossom path. |
| `packages/services/src/resource-service.ts` `createResourceService` | Current grant lookup is identity-wide, and its cancellation path can still emit if a fetch resolves after abort. [VERIFIED: codebase grep] | Introduce a backward-compatible window-aware exact-URL grant seam (or returned grant controller), suppress late terminal results, and retain the general host-provided fetch policy boundary. |
| `packages/paja/src/simulation.ts` | Normalizes upload server and optional limits, but has no safe default upload policy. [VERIFIED: codebase grep] | Normalize fail-safe defaults and preserve explicit configuration as the only replica target list. |
| `packages/shell/src/shell-init.ts` and `napplet-namespace.ts` | Advertise/inject upload only when host hook exists and expose only normal upload methods. [VERIFIED: codebase grep] | Add focused regressions only if capability semantics change; do not add a Blossom namespace or key/network surface. |
| `tests/e2e/paja-single-window.spec.ts` | Already validates a signed one-server upload/denial/missing-size path. [VERIFIED: codebase grep] | Expand the controlled fixture into the authoritative end-to-end proof for replication, stored-byte proof, resource preview, and authority absence. |

### Recommended implementation sequence

1. **Close transport and generic-service correctness first.** Make one Blossom attempt BUD-11-correct and status/lifecycle-safe before adding replication. The current authorization has no `X-SHA-256` header or server tag and uses generic base64 rather than BUD-11 base64url. [VERIFIED: codebase grep] [CITED: https://github.com/hzrd149/blossom/blob/master/buds/11.md]
2. **Add Paja policy/orchestration and scoped grants second.** Paja must own all decisions, but the reusable resource service needs a narrow per-window URL capability rather than the present wildcard origin configuration. [VERIFIED: codebase grep]
3. **Prove browser behavior and ship documentation/release metadata last.** The E2E fixture already exercises a real sandboxed Paja path and should assert the standard-only boundary; update Paja README, package docs, and local-authoring guide from “first server only” to configured sequential replicas. [VERIFIED: codebase grep]
4. **Record upstream feedback independently from local source behavior.** Recommend a focused PR #33 comment unless a complete wire-schema patch is ready; current wire types cannot represent per-attempt outcomes. [VERIFIED: codebase grep]

### Code pattern: separate one-server attempt from Paja orchestration

```ts
// Existing pattern source: packages/paja/src/browser-upload.ts + http-uploader.ts
// Keep this host-only; it is never injected into window.napplet.
for (const server of configuredServers) {
  const attempt = await uploadAndVerifyOneServer({ server, bytes, signal });
  if (attempt.kind === 'verified') successes.push(attempt);
  else if (attempt.kind === 'cancelled' || attempt.kind === 'policy-denied') break;
  // Otherwise continue only after one allowed retry for transient failure.
}

return successes.length > 0
  ? completeWithOrderedUrls(successes)
  : terminalFailure();
```

The loop preserves configured order so the first verified URL becomes `url` and later verified URLs become `fallbackUrls`. [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md]

### Anti-patterns to avoid

- **A Paja-specific `blossom.*` API:** it violates D-01 and bypasses the intentionally generic NAP-UPLOAD boundary. [CITED: https://github.com/napplet/naps/blob/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md]
- **Using BUD-03 discovery as a silent replica source:** discovery is currently selected when configured servers are empty, which conflicts with D-04. [VERIFIED: codebase grep]
- **Treating descriptor equality as stored-byte proof:** it cannot prove the retrieval object or CDN URL returns the bytes Paja authorized. [VERIFIED: 103-CONTEXT.md]
- **Granting the returned URL’s whole origin:** the current Paja `['*']` resource grant is broader than D-13; grant exact URL strings per window/session. [VERIFIED: codebase grep]
- **Adding an upload timeout:** D-09 deliberately permits a hung configured server to block later replicas until abort/settlement. [VERIFIED: 103-CONTEXT.md]
- **Returning success after cancellation:** discard collected successes and suppress late results; durable remote copies may remain and are host diagnostics only. [VERIFIED: 103-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Upload NAP wire/API | Paja custom postMessage schema | Existing `createUploadService` and `window.napplet.upload` | It preserves correlation, ACL routing, status lookup, and standard client compatibility. [VERIFIED: codebase grep] |
| Browser crypto | Napplet hashing/signing/private-key bridge | Web Crypto digest plus existing host `Signer.signEvent` | NAP-UPLOAD requires shell-owned signing and forbids exposing signing keys. [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |
| Preview networking | iframe `fetch()` / `<img src=remote>` | Standard `resource.bytes` plus Blob/object URL | RESOURCE requires host mediation, runtime MIME classification, and scoped state. [CITED: https://github.com/napplet/naps/blob/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md] |
| URL parsing/policy | Ad hoc hostname checks | Existing host resource-policy seam with DNS-time SSRF enforcement | URL string checks do not protect redirects, DNS rebinding, or private-address resolution. [CITED: docs/policies/SHELL-RESOURCE-POLICY.md] |
| Nostr event signing | Local event/key implementation | Existing signer provider and `nostr-tools` peer implementation | Signer ownership and pubkey matching already exist in Paja. [VERIFIED: codebase grep] |

## Common Pitfalls

### Pitfall 1: BUD-11 request incompleteness
**What goes wrong:** The current Blossom attempt sends kind `24242`, `t`, `x`, and `expiration`, but not BUD-11’s `X-SHA-256` request header, a domain `server` tag, or base64url authorization encoding. [VERIFIED: codebase grep]

**Avoidance:** Split Blossom authorization serialization from the NIP-96 serializer; add exact headers/tags and test decoded event plus raw header encoding. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/11.md]

### Pitfall 2: Descriptor-only success
**What goes wrong:** Current code accepts a descriptor after checking URL/hash/size, but does not fetch the stored URL, recompute its bytes/hash/size, or sniff MIME. [VERIFIED: codebase grep]

**Avoidance:** Only add a URL to the success list after a host-safe GET proves stored bytes; require descriptor `type`/`uploaded` as BUD-02 fields and reject non-generic MIME conflicts. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/02.md]

### Pitfall 3: Scope leak in resource grants
**What goes wrong:** Paja currently creates RESOURCE with an always-true origin check and `['*']` grants, so it cannot satisfy a verified-result-only preview boundary. [VERIFIED: codebase grep]

**Avoidance:** Give the resource service an exact URL, window-owned grant interface; erase it from the map in its `onWindowDestroyed` path and reject post-teardown late responses. [CITED: https://github.com/napplet/naps/blob/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md]

### Pitfall 4: Incorrect lifecycle with replica cancellation
**What goes wrong:** A per-server delegate map does not model an operation spanning several replicas; cancellation after the first remote write can leak an accidental successful result or allow a late second request. [VERIFIED: codebase grep]

**Avoidance:** Keep one operation controller/generation fence for the whole replica loop; after cancellation or identity change, abort current I/O, ignore late completion, expose terminal `cancelled`, and retain only host diagnostics of possible copies. [VERIFIED: 103-CONTEXT.md]

### Pitfall 5: Overclaiming protocol conformance
**What goes wrong:** The draft NAP files are absent on current master and the installed package is `@napplet/nap@0.28.0`; calling this current-master conformance would be false. [VERIFIED: codebase grep]

**Avoidance:** Cite the three pinned refs, disclose package/spec drift, and make no local per-replica wire extension. [VERIFIED: 103-CONTEXT.md]

## Code Examples

### BUD-11 authorization shape

```ts
// Source: https://github.com/hzrd149/blossom/blob/master/buds/11.md
const auth = await signer.signEvent({
  kind: 24242,
  created_at: nowSeconds(),
  content: `Upload ${filename}`,
  tags: [
    ['t', 'upload'],
    ['x', sha256],
    ['server', new URL(server).hostname.toLowerCase()],
    ['expiration', String(nowSeconds() + 3600)],
  ],
});

const headers = {
  Authorization: `Nostr ${toUnpaddedBase64Url(JSON.stringify(auth))}`,
  'X-SHA-256': sha256,
  'Content-Type': requestMime,
  'Content-Length': String(bytes.byteLength),
};
```

The exact authorization TTL is a host decision; use a short expiration and do not expose the event or headers to the napplet. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/11.md]

### Exact result grant after proof

```ts
// Host-only: grant only after public-HTTPS validation + full stored-byte proof.
const verified = await verifyStoredBlob({ url: descriptor.url, sha256, size, signal });
if (!verified.ok) return replicaFailure('verification-failed');

resourceGrants.grant({
  windowId: ctx.windowId,
  urls: [verified.url],
});
```

`resource.bytes` must still run its normal policy and return a runtime-classified MIME, not the descriptor/header claim. [CITED: https://github.com/napplet/naps/blob/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest `4.1.2`; Playwright `1.54.0`. [VERIFIED: codebase grep] |
| Config files | `vitest.config.ts`, `playwright.config.ts`. [VERIFIED: codebase grep] |
| Quick run | `corepack pnpm exec vitest run packages/services/src/http-uploader.test.ts packages/services/src/upload-service.test.ts packages/services/src/resource-service.test.ts packages/paja/src/browser-upload.test.ts packages/runtime/src/upload-dispatch.test.ts`. [VERIFIED: package.json] |
| Browser-focused run | `CI=1 corepack pnpm exec playwright test tests/e2e/paja-single-window.spec.ts`. [VERIFIED: package.json] |
| Full suite | `corepack pnpm build && corepack pnpm type-check && corepack pnpm test:unit && corepack pnpm docs:check && CI=1 corepack pnpm exec playwright test`. [VERIFIED: CLAUDE.md] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test type | Automated command | File exists? |
|---|---|---|---|---|
| UPLOAD-02 | Auth header/tag serialization, one retry, descriptor rejection, stored-byte hash/size/MIME proof, cancellation, status sequence | unit | focused Vitest quick run above | Existing files; expand `http-uploader.test.ts`, `upload-service.test.ts`, `browser-upload.test.ts` |
| UPLOAD-02 | Configured-only ordered replicas, tuple consent, signer-change abort, exact resource grants | unit/integration | focused Vitest quick run above | Grant-store/controller coverage is a Wave 0 addition |
| POC-02 | Sandbox sends only standard `upload.*`/`resource.*`; no direct host APIs/key/network authority; successful preview bytes equal stored fixture bytes | browser E2E | focused Playwright run above | Existing `paja-single-window.spec.ts`; expand Blossom fixture and tracer |

### Required real vectors

- Use the existing binary vector `[0, 1, 2, 3, 254, 255]` and its Node SHA-256 value, not a mocked hash. [VERIFIED: codebase grep]
- Make two ordered servers return different valid descriptor URLs and assert primary/fallback order follows configuration. [VERIFIED: 103-CONTEXT.md]
- Make a descriptor claim the correct digest but serve altered GET bytes; assert `failed`, no result URL grant, and no preview. [VERIFIED: 103-CONTEXT.md]
- Make server one return 503 once then 201, server two malformed descriptor, and server three valid; assert the single retry and ordered continuation behavior. [VERIFIED: 103-CONTEXT.md]
- Deny consent before any PUT; then cancel teardown after one verified replica and before the next; assert zero URLs in the napplet terminal result and host-only copy warning/diagnostic. [VERIFIED: 103-CONTEXT.md]
- Assert `window.napplet.blossom`, iframe `window.nostr`, and any direct credential/auth event are absent, while `window.napplet.upload` and `window.napplet.resource` are present only when advertised. [VERIFIED: codebase grep]

### Wave 0 Gaps

- [ ] Add resource-service exact-window-grant and ignored-late-response tests before integration wiring. [VERIFIED: codebase grep]
- [ ] Extend the local Blossom E2E server with persistent GET bytes, per-server scripted response queues, request header capture, and a public-HTTPS test strategy or explicit test-only loopback policy adapter. [VERIFIED: codebase grep]
- [ ] Add a direct browser `resource.bytes` assertion after upload; the current E2E proves PUT/descriptor only. [VERIFIED: codebase grep]
- [ ] Add an ACL regression for denied `resource:fetch` as well as existing denied `upload:write`. [VERIFIED: codebase grep]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard control |
|---|---|---|
| V2 Authentication | Yes | Paja requires a current writable host signer and fails closed when signer/provider/configured identity disagree. [VERIFIED: codebase grep] |
| V3 Session Management | Yes | Session tuple consent and per-window upload/resource teardown revocation. [VERIFIED: 103-CONTEXT.md] |
| V4 Access Control | Yes | Runtime maps upload to `upload:write` and resource to `resource:fetch`, including recipient gating for responses. [VERIFIED: codebase grep] |
| V5 Input Validation | Yes | Validate configuration URLs, every untrusted descriptor, MIME claims, public HTTPS result URL, and all request payload boundaries. [CITED: https://github.com/napplet/naps/blob/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md] |
| V6 Cryptography | Yes | Use Web Crypto SHA-256 and the existing host signer; do not hand-roll hashes, signatures, or authorization tokens. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/11.md] |

### Known Threat Patterns

| Pattern | STRIDE | Standard mitigation |
|---|---|---|
| Malicious napplet exfiltrates arbitrary data | Information disclosure | `upload:write` ACL, pre-egress MIME/size policy, explicit tuple-scoped consent, and no napplet server selection. [CITED: https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md] |
| Forged/misleading descriptor or CDN object | Tampering | GET and recompute exact SHA-256/size; sniff content; never grant/return an unproven URL. [VERIFIED: 103-CONTEXT.md] |
| SSRF via descriptor URL/redirect/DNS rebinding | Elevation of privilege | Public HTTPS requirement plus DNS-time private-IP block and revalidation on redirects in the host fetch policy. [CITED: docs/policies/SHELL-RESOURCE-POLICY.md] |
| Bearer-token replay against a different server | Spoofing | BUD-11 short expiry, `x` digest, and exact lowercase domain `server` tag. [CITED: https://github.com/hzrd149/blossom/blob/master/buds/11.md] |
| Cross-window preview access | Information disclosure | Exact URL + requesting-window/session grant, capability gate, and teardown revocation. [CITED: https://github.com/napplet/naps/blob/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md] |
| Late success after cancellation/identity change | Repudiation / Tampering | One operation controller and generation checks around every await; suppress late terminal envelopes and URLs. [VERIFIED: 103-CONTEXT.md] |

## State of the Art

| Old/current repository behavior | Phase 103 behavior | Impact |
|---|---|---|
| First effective server is uploaded to; BUD-03 discovery can become effective server. [VERIFIED: codebase grep] | Configured-only sequential ordered replicas. [VERIFIED: 103-CONTEXT.md] | Removes unconsented discovery routing and supports controlled replication. |
| Descriptor URL/hash/size completes the upload. [VERIFIED: codebase grep] | Full stored-byte retrieval/hash/size/MIME proof completes each replica. [VERIFIED: 103-CONTEXT.md] | A successful napplet result becomes materially truthful. |
| Paja RESOURCE uses wildcard origin grant. [VERIFIED: codebase grep] | Exact verified URL grant scoped to requesting window/session. [VERIFIED: 103-CONTEXT.md] | Preview cannot become arbitrary origin access. |
| Per-upload single-server consent. [VERIFIED: codebase grep] | One session tuple grant with replica disclosure. [VERIFIED: 103-CONTEXT.md] | Consent reflects actual egress and reduces repetitive prompts without becoming permanent authority. |

## Documentation, release, and dependency implications

- Update `packages/paja/README.md`, `docs/packages/paja.md`, and `docs/how-tos/paja-local-authoring.md`; all three currently state that Paja uses the first server only and descriptor proof is sufficient. [VERIFIED: codebase grep]
- Update public JSDoc and barrel exports if `@kehto/services` exposes a new resource-grant controller/type; `pnpm docs:check` treats TypeDoc warnings as errors. [VERIFIED: CLAUDE.md]
- Plan changesets for every package with shipped output: at minimum `@kehto/paja`; add `@kehto/services` if resource-service or HTTP-uploader public contracts change. [VERIFIED: CLAUDE.md]
- Do not include this research file, planning files, Graphify output, Writer work, or generated documentation output in the Kehto source contribution. [VERIFIED: 103-CONTEXT.md]
- The Phase 102 dependency is open as `kehto/web` PR #217 at `81185b45c99544fbb63271da4bcfc69334e759e1`, targeting `main` and currently `CLEAN`; source execution must either wait for merge or deliberately stack on that SHA after refreshing `upstream/main`. [VERIFIED: gh pr view]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | A 10 MiB default maximum and image-focused MIME allowlist are appropriate safe Paja defaults; operators can narrow/override them. [ASSUMED] | Architecture / policy implementation | A legitimate intended media type/size may be rejected, or defaults may not fit the host’s risk posture. |
| A2 | A single short backoff such as 250 ms is acceptable for the one permitted transient retry. [ASSUMED] | Replica orchestration | Retry timing could be too aggressive for a server or too slow for user expectations. |

## Open Questions (RESOLVED)

1. **Upstream follow-up form — resolved by the Plan 06 human decision gate.**
   - Existing `UploadResult`/installed types expose successes through `url` and `fallbackUrls` but have no per-attempt outcome collection. [VERIFIED: codebase grep]
   - The local implementation retains the pinned existing wire shape. After local gates pass and the live PR #33 discussion is inspected, Plan 06 Task 2 requires the user to select either a focused comment or a dedicated draft schema PR. This is intentionally a human decision about an external one-way contract, not an unresolved local implementation question. [VERIFIED: 103-CONTEXT.md]
2. **E2E public-HTTPS versus loopback fixture — resolved.**
   - Production `createPajaStoredBlobVerifier` uses public-HTTPS-only policy with DNS, redirect, and private-address controls. The browser fixture constructs a distinct verifier with an explicit test-only loopback adapter solely inside `startPajaServer()`/test setup; it is never selectable through simulation, host configuration, or napplet input. [VERIFIED: 103-CONTEXT.md]
   - The deterministic E2E fixture therefore uses its in-process loopback Blossom server without weakening production verifier policy. Plan 01 unit tests prove both the public-HTTPS production default and the narrowly constructed test adapter. [VERIFIED: 103-01-PLAN.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| Node.js | TypeScript tests and Paja fixture | Yes | `v22.22.0` | — [VERIFIED: command -v] |
| pnpm | workspace commands | No direct binary | — | `corepack pnpm` is available via Corepack `0.34.0`. [VERIFIED: command -v] |
| Chromium | Paja browser proof | Yes | `150.0.7871.181` | Google Chrome `150.0.7871.186` also exists. [VERIFIED: command -v] |
| Git / GitHub CLI | upstream refresh and PR #217 dependency check | Yes | Git `2.51.2`, GH `2.83.2` | — [VERIFIED: command -v] |
| External Blossom server | Production rail | Not required for deterministic tests | — | Existing in-process Node Blossom fixture. [VERIFIED: codebase grep] |

**Missing dependencies with no fallback:** None. [VERIFIED: command -v]

**Missing dependencies with fallback:** Direct `pnpm` binary is absent; invoke it through `corepack pnpm`. [VERIFIED: command -v]

## Sources

### Primary (pinned protocol authority)
- [NAP-UPLOAD at `a7cc174`](https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md) — standard envelopes, authority, policy, integrity, and status contract.
- [NAP-RESOURCE at `fa6bcc6`](https://github.com/napplet/naps/blob/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md) — mediated bytes, grant/policy boundary, MIME, cancellation, and state scope.
- [NAP-BLOSSOM at `ca1d7ba`](https://github.com/napplet/naps/blob/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md) — high-level versus low-level scope and shell-owned BUD authorization.
- [NAP-SHELL at `a7cc174`](https://github.com/napplet/naps/blob/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-SHELL.md) — mandatory handshake and capability advertisement.
- [BUD-01](https://github.com/hzrd149/blossom/blob/master/buds/01.md), [BUD-02](https://github.com/hzrd149/blossom/blob/master/buds/02.md), and [BUD-11](https://github.com/hzrd149/blossom/blob/master/buds/11.md) — authoritative Blossom retrieval, raw upload, descriptor, and authorization rules.

### Repository evidence
- `packages/paja/src/browser-upload.ts`, `browser-adapter.ts`, `simulation.ts`, and their tests — current Paja ownership and gaps. [VERIFIED: codebase grep]
- `packages/services/src/upload-service.ts`, `http-uploader.ts`, `resource-service.ts`, and their tests — reusable generic seams and lifecycle gaps. [VERIFIED: codebase grep]
- `tests/e2e/paja-single-window.spec.ts` — current real browser fixture, signer, local Blossom server, and message tracer. [VERIFIED: codebase grep]
- `docs/policies/SHELL-RESOURCE-POLICY.md` — Kehto-host SSRF, MIME, redirect, and size policy requirements. [CITED: docs/policies/SHELL-RESOURCE-POLICY.md]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all recommendations extend existing workspace modules and add no dependencies. [VERIFIED: codebase grep]
- Architecture: HIGH — upload, resource, ACL, Paja composition, and browser fixture seams were read directly. [VERIFIED: codebase grep]
- Protocol/pitfalls: MEDIUM — pinned draft documents and BUD authority were checked, but UPLOAD/RESOURCE/BLOSSOM drafts are absent from current `napplet/naps` master. [VERIFIED: codebase grep]

**Research date:** 2026-07-29
**Valid until:** Recheck immediately before source work because the governing NAP drafts and upstream PR #217 are active. [VERIFIED: 103-CONTEXT.md]
