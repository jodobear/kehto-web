# Feature Research

**Domain:** Kehto v1.29 social profile and Blossom-upload vertical slice
**Researched:** 2026-07-24
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Snapshot-and-live identity lifecycle | A signed-in view must show the active account, and must neither retain the prior account nor require a page reload after a signer change. | MEDIUM | Call `identity.getPublicKey()` once at startup, subscribe to `identity.changed`, and use an identity/work generation to discard old async results. `pubkey: ""` is a normal signed-out state: cancel/reset identity-derived work and clear profiles, media object URLs, and upload availability. |
| Follow-list profile discovery | The social view must resolve the current account's follows into recognizable profiles. | MEDIUM | After a non-empty pubkey, call `identity.getFollows()`, issue bounded/batched `outbox.query` filters with `authors` and `kinds: [0]`, then select one newest kind-0 event per pubkey locally. Kind-0 JSON must be parsed defensively; malformed metadata is skipped, not fatal. |
| Honest partial-result rendering | A multi-relay query can return useful events while some routes fail. Users should see the results that arrived rather than an empty failure screen. | MEDIUM | Render every valid reduced profile from `events` even if `incomplete` or `error` is present. Show a persistent, non-blocking warning such as “Some profiles could not be loaded; retry to refresh.” Do not claim a complete follow list because the protocol result has no per-author completeness signal. |
| Shell-mediated profile media | Avatar/banner rendering must preserve the napplet isolation boundary. | HIGH | For HTTPS picture/banner URLs, call `resource.bytes`; create an object URL from the returned Blob; revoke the prior object URL on replacement, identity reset, and `pagehide`. Never assign the remote profile URL to `img.src`, and fall back to initials/placeholder when media fails. |
| Explicit Blossom upload through the shell | A user-triggered upload needs the requested `blossom` rail while keeping credentials, authorization, server selection, policy, and networking in the host. | MEDIUM | Send `upload.upload` with `rail: 'blossom'` and structured-clone binary data. Surface consent denial, unavailable signer/rail, policy rejection, and server failure as distinct UI outcomes. A successful HTTPS URL may be read later via `resource.bytes`; the napplet never fetches or signs directly. |
| Real Paja browser proof | The slice's value is conformance through the real host, not a mocked API demo. | HIGH | Build a fixture that imports the real `@napplet/shim` and SDK subpaths, load it through Paja's real shell path, log in, exercise identity → profiles → mediated media → Blossom upload, and assert actual visible states in Playwright. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| One coherent cross-domain proof | Demonstrates that Kehto can host a realistic social workflow across identity, relay/outbox, resource, and upload domains without weakening the sandbox. | HIGH | Keep the fixture intentionally narrow: profiles, media, and one upload control. It proves composition rather than becoming a social-client product. |
| Deterministic profile reduction | Relay disagreement or duplicate events cannot make displayed identity depend on arrival order. | MEDIUM | Reduce by normalized pubkey, newest `created_at`, then a deterministic event-id tiebreaker. The NAP-OUTBOX draft only guarantees event-id deduplication, not newest-per-author selection. |
| Degraded-state transparency | Makes distributed failures understandable while retaining successful data, unlike all-or-nothing social loading. | MEDIUM | Separate “partial profile results” from “no usable results,” and image-level failures from profile-query degradation. This is a stronger UX contract than simply logging relay errors. |
| Live account switching without iframe reload | Proves the shell/napplet lifecycle is safe when the signer changes in place. | HIGH | A changed pubkey must reset old follows/profiles/media immediately, then refresh the new account. Late outbox and resource completions must be ignored. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Direct napplet networking or direct remote image URLs | It is the shortest path to render pictures or call a Blossom server. | It bypasses shell policy, SSRF and MIME controls, observability, cache isolation, and the security claim the slice exists to prove. Existing direct-image playground patterns are not reusable for this fixture. | Use `resource.bytes` for every HTTPS picture/banner and render a short-lived object URL. |
| Private-key, `window.nostr`, or signer-object access | It appears to simplify Blossom authorization. | It violates NAP-IDENTITY's read-only boundary and exposes credentials/capabilities to untrusted iframe code. | Request `upload.upload({ rail: 'blossom' })`; the shell signs the authorization and performs HTTP. |
| `blossom:sha256` / low-level content-addressed reads | Hash-addressed reads sound like a natural companion to Blossom upload. | They introduce a separate NAP-BLOSSOM operation and full-response verification work that is unnecessary to prove the HTTPS result flow. | Defer it. Treat the upload result URL as an HTTPS resource and access it through NAP-RESOURCE. |
| Polling identity or keeping old state until refresh finishes | It can look simpler than lifecycle subscriptions. | Polling is explicitly discouraged; retaining prior-account profiles/media misattributes data after sign-out or account switch. | Startup snapshot plus `identity.changed`, immediate reset, and generation-based stale-result rejection. |
| One outbox request per followed author | It makes per-profile loading superficially straightforward. | It fans out relay work, increases latency and rate-limit exposure, and makes degradation noisy; query-wide `incomplete` cannot honestly identify which author failed anyway. | Batch bounded author groups in `outbox.query`, then reduce locally. |
| All-or-nothing handling of partial outbox results | It avoids explaining distributed failure. | It hides valid profiles and contradicts the draft result contract, which deliberately returns discovered events with `incomplete`. | Render successful profiles and a degraded warning; reserve blocking error UI for no usable result. |
| Full social-client scope (posts, follow/unfollow, infinite scroll, editing profiles) | A profile list can invite broader social functionality. | It obscures protocol-host validation with unrelated product work and requires separate write, pagination, moderation, and UX decisions. | Keep read-only followed-profile discovery plus a demonstrative upload action. |

## Feature Dependencies

```text
[Real signer/login in Paja]
    └──requires──> [identity.getPublicKey startup snapshot]
                           └──requires──> [identity.getFollows for active pubkey]
                                                  └──requires──> [bounded/batched outbox.query kinds:[0]]
                                                                         └──requires──> [deterministic newest kind-0 reduction]
                                                                                              └──requires──> [profile rendering]

[Profile rendering]
    └──enhances──> [resource.bytes HTTPS media]
                           └──requires──> [object-URL replacement and revocation]

[Real signer/login in Paja]
    └──requires──> [upload.upload rail:'blossom']
                           └──requires──> [shell policy/consent/signing/network]

[identity.changed]
    └──invalidates──> [follows, outbox results, media object URLs, upload readiness]
    └──requires──> [generation guard for non-cancellable outbox queries]

[Built shim/SDK fixture] + [Paja real shell wiring]
    └──requires──> [Playwright end-to-end proof of the complete flow]
```

### Dependency Notes

- **Follow discovery requires the identity snapshot:** follows are meaningful only for the active shell user. Do not issue a follow/profile query for `pubkey: ""`.
- **Profile rendering requires local reduction:** NAP-OUTBOX provides query-wide results and event-ID deduplication, but it does not promise one newest kind-0 profile per author. Selection is napplet responsibility.
- **Media enhances profiles but must not block them:** the text profile renders first; each media resource request independently replaces a placeholder only on success.
- **`identity.changed` conflicts with naïve async state updates:** NAP-RESOURCE accepts an abort signal, but the one-shot outbox query has no cancellation protocol. Reset immediately, abort outstanding resource work, and reject stale query completions by generation/pubkey.
- **Upload is parallel to profile loading, not a prerequisite:** it shares the active identity/signer lifecycle and must disable or fail safely when no signer or permitted Blossom rail exists.
- **E2E depends on fixture realism:** unit tests can validate reduction and state transitions, but only the built SDK/shim fixture under Paja proves the napplet cannot rely on direct networking or a mocked host namespace.

## User-Visible State Contract

| Situation | Required visible behavior | Testable assertion |
|-----------|---------------------------|--------------------|
| Initial startup / pending identity | Neutral loading state; no stale profiles or media. | Before the snapshot resolves, the list has no prior-account content. |
| Signed out (`pubkey: ""`) | “Not logged in”/equivalent empty state; profiles, media, warning, and upload-ready state are cleared. | An `identity.changed('')` event clears DOM cards and revokes/removes object-URL media without reloading the iframe. |
| Logged in with no follows | Clear empty state, not an error. | `getFollows()` returns `[]`; no outbox query is sent and UI explains there are no followed profiles. |
| Profile query loading | Loading indicator while the current generation's bounded queries run. | The indicator ends only for the current identity generation. |
| Complete query, usable events | Render one deterministic current profile per valid author. | Duplicate/conflicting kind-0 events yield the newest event, with stable tie handling. |
| Partial query (`incomplete` or query-wide `error`) with usable events | Render successes and a non-blocking degraded warning. | Cards remain visible and warning communicates that results may be incomplete; no per-author failure claim is made. |
| No usable events plus query failure | Blocking degraded/error state with retry/refresh affordance; do not display stale prior-account cards. | `events: []` plus error/incomplete produces an error/empty view, distinct from no-follows. |
| Malformed kind-0 metadata or unusable picture/banner URL | Keep the profile with pubkey/name fallback; omit invalid media. | Bad JSON, non-HTTP(S) metadata URL, or absent fields do not crash or remove other profiles. |
| `resource.bytes` failure or abort | Keep profile text and placeholder; media-specific unavailable state is silent or concise. | Policy, timeout, quota, decode, or network failure never inserts the remote URL into an element and never leaves a leaked object URL. |
| Identity changes mid-load | Immediately clear old account state; only the newest identity's results may render. | Resolve older outbox/resource promises after a change and assert they do not mutate the DOM. |
| Upload denied/unavailable/failed | Distinct status such as cancelled, sign-in required, unsupported, policy denied, or upload failed; no false success URL. | No direct fetch/signing happens in the fixture; host-mediated upload status controls UI. |
| Blossom upload succeeds | Show success and the returned HTTPS location as data/action, not proof of direct access. | Upload request carries `rail: 'blossom'`; response contains an HTTPS URL; any subsequent bytes read uses `resource.bytes`. |

## MVP Definition

### Launch With (v1)

- [ ] **Identity snapshot, follow read, and live reset** — establishes correct active-account semantics and eliminates stale identity-derived state.
- [ ] **Bounded/batched kind-0 outbox query with deterministic reduction** — turns follows into one profile per pubkey without per-author fan-out.
- [ ] **Partial-result and empty/error state UI** — preserves successes while honestly communicating query-wide degradation.
- [ ] **HTTPS media via `resource.bytes` and object-URL lifecycle** — proves the resource boundary and prevents direct-network regressions.
- [ ] **`upload.upload` on the Blossom rail** — proves shell-owned consent, signing, transport, and validated result handling.
- [ ] **Built real SDK/shim Paja fixture plus Playwright flow** — validates the integration surface end-to-end, including login and identity changes.

### Add After Validation (v1.x)

- [ ] **Explicit retry/refresh controls with bounded backoff** — add when users need recovery beyond a full fixture restart; preserve generation safety and do not imply per-author completeness.
- [ ] **Per-card media loading states and accessibility refinements** — add after the central profile/media contract is stable.
- [ ] **Upload progress UI** — add only when the shell exposes an asynchronous status path in the host scenario being demonstrated.

### Future Consideration (v2+)

- [ ] **`blossom:sha256` / `blossom.get` reads** — defer until the product needs content-addressed retrieval and can implement complete-response hash verification.
- [ ] **Rich social-client behavior** — publishing, following mutations, feed pagination, moderation, and profile editing require separate domain and product decisions.
- [ ] **Per-author result accounting** — defer unless NAP-OUTBOX gains an authoritative per-author completeness contract; do not invent one in this vertical slice.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Identity snapshot/change reset with stale-work protection | HIGH | MEDIUM | P1 |
| Batched kind-0 profile loading and deterministic reduction | HIGH | MEDIUM | P1 |
| Partial-result warnings with successes retained | HIGH | MEDIUM | P1 |
| Resource-mediated media and object-URL cleanup | HIGH | HIGH | P1 |
| Shell-mediated Blossom upload | HIGH | MEDIUM | P1 |
| Real SDK/shim Paja Playwright proof | HIGH | HIGH | P1 |
| Retry/backoff and rich media progress | MEDIUM | MEDIUM | P2 |
| `blossom:sha256` reads and full social-client features | LOW for this slice | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have after the integrated contract is stable
- P3: Future consideration

## Competitor Feature Analysis

This milestone is a protocol-host conformance slice, not a social-product comparison. The relevant comparison is architectural:

| Feature | Direct-client pattern | Kehto slice approach |
|---------|-----------------------|----------------------|
| Profile images | Set a remote image URL directly and let the iframe fetch it. | Request bytes through the shell, render a revocable object URL, and retain a placeholder on failure. |
| Blossom upload | App selects a server, owns authorization signing, and sends HTTP. | Napplet requests the `blossom` rail; the host selects/enforces policy, signs, sends, and validates. |
| Relay degradation | Often hide individual relay failure or fail the entire view. | Retain query successes and expose only the accurate query-wide degraded state. |
| Account switching | Reload or let old async work win. | Push-driven reset with current-generation-only rendering. |

## Sources

- Local milestone authority: `/workspace/projects/kehto/web/.planning/PROJECT.md` (v1.29 goal, scope, and pinned protocol references).
- [NAP-IDENTITY at pinned `6461e4b`](https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md) — startup snapshot, `identity.changed`, signed-out semantics, and read-only boundary.
- [NAP-OUTBOX at draft PR #32 pinned `4589a8f`](https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md) — one-shot results, query-wide `incomplete`/`error`, event-ID deduplication, and no query cancellation/newest-per-author guarantee.
- [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) — kind-0 replaceable-event context and deterministic newest-event rationale.
- [NAP-RESOURCE at draft PR #80 pinned `fa6bcc6`](https://raw.githubusercontent.com/napplet/naps/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md) — shell fetching, Blob result, cancellation, and typed resource failures.
- [NAP-UPLOAD at draft PR #33 pinned `a7cc174`](https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md) — rail selection and shell-owned signing/network/policy.
- [NAP-BLOSSOM at draft PR #71 pinned `ca1d7ba`](https://raw.githubusercontent.com/napplet/naps/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md) — descriptor URL and deferred content-addressed read boundary.
- Existing local Paja/upload/identity tests and fixtures, especially `packages/paja/src/browser-upload.test.ts` and `tests/unit/playground-feed-identity-events.test.ts`.

---
*Feature research for: Kehto v1.29 Social + Blossom Vertical Slice*
*Researched: 2026-07-24*
