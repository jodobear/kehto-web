# Project Research Summary

**Project:** Kehto v1.29 Social + Blossom Vertical Slice
**Domain:** Shell-mediated social-profile and Blossom-upload integration proof
**Researched:** 2026-07-24
**Confidence:** MEDIUM

## Executive Summary

Kehto v1.29 is a focused conformance slice, not a new social client or uploader. It proves that a built SDK napplet can compose live identity, relay-backed followed-profile discovery, resource-mediated media, and Blossom upload inside an opaque-origin Paja iframe. The napplet owns UI, deterministic profile selection, identity-scoped state, and Blob URLs. The shell retains signer access, relay routing, network policy, consent, authorization, transport, and validation.

No new runtime dependencies or protocol extensions are justified. Harden host seams before the fixture: requester-scoped resource cancellation, playground follows/outbox registration, explicit Paja session and media-origin policy, and in-place `identity.changed`. Build one Vite SDK/shim fixture that batches kind-0 queries, keeps usable partial results, and renders only `resource.bytes` Blob URLs. The capstone is a real Paja Playwright journey, not a raw-envelope test.

The primary risks are stale cross-account async updates, arrival-order profile selection, direct media networking or Blob leaks, and under-validated Blossom authorization/results. Use a generation plus pubkey fence, NIP-01 ordering, host-controlled fetch policy, explicit object-URL ownership, pinned-draft upload checks, and adversarial browser coverage.

## Key Findings

### Recommended Stack

Extend the existing pinned Kehto and `@napplet` integration graph. Do not add a social SDK, relay client, HTTP uploader, UI framework, or cryptography library. Browser-native Blob/object URL APIs are sufficient for profile media.

**Core technologies:**
- **Kehto services and Paja** (`@kehto/services@0.16.5`, `@kehto/paja@0.8.1`): preserves shell-owned identity, outbox, resource, upload, signer, policy, and transport boundaries.
- **Pinned fixture graph** (`@napplet/core@0.28.0`, `@napplet/nap@0.28.0`, `@napplet/sdk@0.24.4`, `@napplet/shim@0.26.8`): existing lockfile-verified SDK/shim contract for the real fixture.
- **Native `Blob`, `URL.createObjectURL`, `URL.revokeObjectURL`**: renders shell-returned bytes locally without direct napplet fetches.
- **Existing Paja Blossom runtime/uploader**: shell selects server, obtains consent, signs, transfers bytes, and validates `upload.upload({ rail: "blossom" })`.
- **Vite 6.4.2, `@napplet/vite-plugin@0.11.2`, Playwright 1.54.0**: build the workspace fixture and verify the real browser path.

Keep protocol pins stable during this slice. Do not use napplet-side `nostr-tools`, `fetch`, WebSocket, `window.nostr`, signer exposure, or direct profile URLs.

### Expected Features

**Must have (table stakes):**
- Startup identity snapshot and live `identity.changed` reset, including signed-out empty-pubkey behavior and stale-work rejection.
- Bounded/batched `outbox.query({ kinds: [0], authors })` follow-profile discovery with deterministic local reduction.
- Partial-result rendering that preserves valid profiles under query-wide `incomplete`/`error` and distinguishes no follows from no usable results.
- HTTPS media only through `resource.bytes`, with fallbacks and object URL cleanup on replacement, reset, and `pagehide`.
- Explicit Blossom-rail upload with distinct denied, unavailable, failed, and validated success states.
- Built SDK/shim fixture and real Paja Playwright proof.

**Should have (competitive):**
- In-place account switching without iframe reload.
- Deterministic profile display despite relay disagreement or arrival order.
- Transparent degraded-query and media-failure states.

**Defer (v2+):**
- `blossom:sha256` and low-level content-addressed reads.
- Publishing, profile editing, follow mutations, pagination, moderation, and infinite scroll.
- Per-author completeness claims, retry/backoff, upload progress, and broader media UX.

### Architecture Approach

Reuse `ShellBridge → runtime ACL/firewall/dispatch → identity | outbox | resource | upload services`. Put social application behavior in the built fixture; keep policy and external integration in Paja/playground adapters and existing services.

**Major components:**
1. **Identity session controller** — subscribe before snapshot, increment a generation on each identity change, reset synchronously, and commit only current `{generation, pubkey}` work.
2. **Profile batch loader/reducer** — normalize follows, batch authors, aggregate query health, and select one valid kind-0 event per author with NIP-01 ordering.
3. **Media controller** — request granted bytes, track request/generation/object URL per slot, cancel safely, and revoke exactly once.
4. **Paja/playground adapters** — provide follows/outbox, publish in-place identity changes, resolve active sessions, and constrain resource origins.
5. **Existing upload runtime/service** — keeps server selection, consent, kind-24242 authorization, transfer, and descriptor validation host-side.

### Critical Pitfalls

1. **Old identity work repopulates a switched or signed-out UI** — gate every async completion by generation and pubkey; cancellation alone is not correctness.
2. **Kind-0 selection follows arrival order** — centralize a pure NIP-01 reducer: greatest `created_at`, then lexicographically lower event ID; reduce across all batches.
3. **Partial outbox data is discarded or falsely treated as complete** — preserve valid events and store degradation separately; do not infer missing authors.
4. **Metadata media bypasses resource policy or leaks Blob URLs** — never attach remote URLs; use resource-returned Blob URLs and cleanup on replacement/reset/pagehide.
5. **Blossom success lacks proof-bound validation** — host controls server/auth, obtains consent before transfer, and validates authorization plus result URL/hash/size against submitted bytes.
6. **Raw-envelope tests are mistaken for SDK proof** — test a compiled SDK/shim fixture through actual Paja `srcdoc` iframe messaging.

## Implications for Roadmap

Based on research, use five dependency-ordered phases.

### Phase 1: Host Boundaries and Live Identity Lifecycle
**Rationale:** Fixture behavior depends on safe host capabilities and in-place identity semantics.
**Delivers:** Requester-scoped `resource.cancel`; playground follows/outbox; Paja session identity and explicit media policy; connect/switch/logout `identity.changed` without iframe recreation.
**Addresses:** Active-account lifecycle and shell-owned policy.
**Avoids:** Cross-window cancellation, stale-account disclosure, reload-masked races, permissive resource defaults.

### Phase 2: Social Fixture Session and Profile Discovery
**Rationale:** Follow/profile behavior must be correct and fixture-local before binary media complicates it.
**Delivers:** Built `nap-social` fixture, generation controller, bounded kind-0 batches, pure NIP-01 reducer, metadata fallback, and complete/empty/partial/error UI.
**Uses:** Existing SDK/shim, `identity`, and `outbox` domains.
**Implements:** Identity session controller and profile batch loader.
**Avoids:** Per-author fan-out, low global limits, arrival-order selection, discarded partial data.

### Phase 3: Resource-Mediated Profile Media
**Rationale:** Media enriches profiles but cannot weaken host networking or block text rendering.
**Delivers:** HTTPS validation, `resource.bytes`, generation-scoped media ownership, Blob rendering, placeholders, cancellation, and URL cleanup.
**Addresses:** Shell-mediated picture and banner rendering.
**Avoids:** Direct iframe networking, metadata-driven grants, stale images, Blob leakage or premature revocation.

### Phase 4: Blossom Rail Hardening and Fixture Upload UX
**Rationale:** Upload shares identity/security semantics and needs proof/result validation before full integration proof.
**Delivers:** Blossom upload UI and host wiring; pinned kind-24242 authorization validation; HTTPS URL/hash/size policy; consent, denial, teardown, and malformed-result tests.
**Addresses:** Shell-mediated upload and truthful status outcomes.
**Avoids:** Iframe-selected server/auth, pre-consent transfer, unchecked descriptors, false success.

### Phase 5: Real Paja Vertical-Slice E2E
**Rationale:** The capstone should integrate correct boundaries rather than diagnose them first.
**Delivers:** Playwright journey using the built fixture and controlled signer/relay/media/Blossom servers: login, follows, profiles, partial results, Blob media, in-place switch/logout, and upload.
**Addresses:** Real browser conformance across P1 features.
**Avoids:** Raw-HTML false positives, URL-based frame selection, unbuilt-fixture fallback, direct network/key regressions.

### Phase Ordering Rationale

- Host capabilities and isolation corrections come first because they are security boundaries for every feature.
- Establish profile lifecycle and query semantics before independent binary-media lifecycle work.
- Stabilize upload under the same identity/security contract before browser integration proof.
- Use E2E as a final composition test, not the first detector of lower-level defects.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Validate Paja signer lifecycle, session/resource-policy details, and every caller of the resource-service API change.
- **Phase 4:** Re-check pinned NAP-UPLOAD/NAP-BLOSSOM drafts and BUD-11 authorization/result rules immediately before implementation; current uploader validation has known gaps.
- **Phase 5:** Inspect Paja E2E helpers and fixture asset-build mechanics for deterministic controlled-server tests.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Generation fencing, bounded batching, pure local reduction, and partial-result UI are documented; plan directly with vector tests first.
- **Phase 3:** Blob URL ownership and mediated rendering are well-bounded after host policy selection; use focused unit and browser-network tests.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Strong repository/lockfile evidence supports existing pins and no dependencies; external corroboration is lower-rated. |
| Features | MEDIUM | Grounded in scope and pinned NAP behavior, but several NAPs are drafts. |
| Architecture | MEDIUM | Concrete repository paths/services were inspected; required host edits remain integration work. |
| Pitfalls | MEDIUM | Specific hazards and protocol behavior were checked; Blossom draft ambiguity remains. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Pinned draft drift:** Re-check NAP-OUTBOX `4589a8f`, NAP-RESOURCE `fa6bcc6`, NAP-UPLOAD `a7cc174`, and NAP-BLOSSOM `ca1d7ba` at every NAP-touching phase and record upstream changes.
- **Blossom detail:** Confirm kind-24242 tags, server-domain validation, and descriptor acceptance against the pinned draft before changing `http-uploader`.
- **Host fetch policy:** Test concrete redirect, SSRF/private-address, size, MIME-sniffing, and SVG policy in Paja/playground fetch adapters.
- **Batch/concurrency limits:** Set measurable limits for test conditions; 100 authors is a starting recommendation, not a protocol maximum.
- **Identity provider binding:** Ensure `getFollows` captures the requested active identity through async relay lookup rather than reading a newer signer on completion.

## Sources

### Primary (HIGH confidence)
- Repository evidence in [STACK.md](./STACK.md), [ARCHITECTURE.md](./ARCHITECTURE.md), and [PITFALLS.md](./PITFALLS.md): Paja, services, playground feed, fixture build, and E2E paths.
- [NAP-IDENTITY pinned `6461e4b`](https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md) — identity lifecycle and read-only boundary.
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) — kind-0 replaceable-event ordering.

### Secondary (MEDIUM confidence)
- [NAP-OUTBOX `4589a8f`](https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md) — aggregate results and query-wide incomplete/error.
- [NAP-RESOURCE `fa6bcc6`](https://raw.githubusercontent.com/napplet/naps/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md) — host mediation, Blob responses, cancellation.
- [NAP-UPLOAD `a7cc174`](https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md) and [NAP-BLOSSOM `ca1d7ba`](https://raw.githubusercontent.com/napplet/naps/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md) — shell-owned upload boundary.

### Tertiary (LOW confidence)
- npm package metadata — corroborates lockfile pins.
- MDN object-URL and Playwright frame documentation — standard guidance corroborated by local patterns.

---
*Research completed: 2026-07-24*
*Ready for roadmap: yes*
