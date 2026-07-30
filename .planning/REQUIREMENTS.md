# Requirements: fork-v1.29-paja-social-blossom Paja Social Cache + Writer Blossom PoC

**Defined:** 2026-07-24
**Core Value:** Provide a modular, framework-agnostic runtime for hosting napplet applications — so any Nostr client can embed sandboxed mini-apps by integrating `@kehto/shell`.

## v1 Requirements

Requirements for milestone fork-v1.29-paja-social-blossom. Planning lives on this fork's planning branch and merges only to the fork's `master`; planning artifacts never enter upstream implementation PRs. Implementation spans Kehto/Paja and, only after explicit user approval, `/workspace/projects/writer`. Each requirement maps to exactly one roadmap phase. Phase order must reconcile upstream/WIP first, produce a working PoC next, then refine and harden.

### Preflight and Contribution Hygiene

- [ ] **PRE-01**: Before implementation, Kehto is rebased onto the latest upstream implementation baseline and affected incoming Paja changes are reviewed; Writer's dirty shortcut WIP, branch history, missing remote, and intended upstream baseline are classified without discarding or absorbing unrelated work.
- [ ] **PRE-02**: Writer receives an implementation plan that names its preserved WIP, required upstream/remote setup, dedicated integration branch, Paja dependency, exact standard-NAP changes, tests, and approval checkpoint; no Writer source file changes occur before explicit user approval.

### Paja Social Data Boundary

- [x] **PAJA-01**: After login, Paja can provide the active public key and relay-backed follow list through standard `identity.getPublicKey` and `identity.getFollows`, with lookups bound to the public key captured when each request begins.
- [x] **PAJA-02**: After login, Paja prefetches and keeps followed authors' kind-0 profiles in an internal cache that refreshes for the active identity and is never exposed through a Paja-specific application API.
- [x] **PAJA-03**: A napplet can query followed authors' kind-0 events through standard `outbox.query`; Paja may satisfy or refresh results from its internal cache while preserving normal OUTBOX events, deduplication, `incomplete`, and `error` semantics.

### Writer Followed-Profile Tagging

- [ ] **WRITER-01**: Writer obtains follows through `identity.getFollows` and hydrates tagging candidates through bounded batched `outbox.query` calls with `kinds: [0]`, replacing its per-author `common.getProfile` follow-hydration path.
- [ ] **WRITER-02**: Writer chooses one kind-0 profile per followed pubkey deterministically: greatest `created_at`, then lexicographically lowest event ID when timestamps tie, independent of cache, relay, or batch arrival order.
- [ ] **WRITER-03**: Writer's existing mention search can select a followed profile, insert the existing `nostr:nprofile` Markdown mention, and retain the pubkey so publishing emits the corresponding NIP-23 `p` tag.
- [ ] **WRITER-04**: Writer subscribes to standard `identity.changed`, clears prior-account follow/profile candidates on logout or account switch, rejects stale async results, and reloads candidates for the new identity without a custom Paja signal.

### Writer Blossom Upload

- [ ] **UPLOAD-01**: Writer's existing paste-upload flow calls `upload.upload` with explicit `rail: "blossom"` plus the selected bytes and media metadata.
- [ ] **UPLOAD-02**: Paja owns Blossom server selection, consent, kind-24242 authorization signing, network transfer, credentials, rate/size/MIME policy, and result validation; Writer receives only standard NAP-UPLOAD results and statuses.
- [ ] **UPLOAD-03**: A completed Writer upload inserts the returned HTTPS URL into the draft and renders preview bytes only through standard `resource.bytes` Blob object URLs, never through direct upload-server or media networking.

### PoC-First Delivery

- [ ] **POC-01**: The real Writer app running through Paja demonstrates both immediate journeys as soon as their minimum paths work: login → followed-profile tagging, and pasted media → explicit Blossom upload → preview.
- [ ] **POC-02**: The PoC uses only standard NAP-IDENTITY, NAP-OUTBOX, NAP-RESOURCE, and NAP-UPLOAD boundaries; it adds no Paja-specific Writer API, direct relay/HTTP/WebSocket path, `window.nostr`, private-key access, or napplet-side Blossom authorization.

### Refinement and Hardening

- [ ] **HARD-01**: Paja emits `identity.changed` for connect, account switch, disconnect, and logout without replacing Writer's iframe; Paja cache and Writer state reset atomically enough that old-account results cannot repopulate the new session.
- [ ] **HARD-02**: Writer keeps valid profile candidates when OUTBOX returns query-wide `incomplete` or `error`, exposes a degraded state, and distinguishes signed-out, no-follows, no-usable-profile, complete, degraded, and failed states without claiming author-level completeness.
- [ ] **HARD-03**: Profile and uploaded media requests are scoped to the requesting window and active identity generation; origin policy, cancellation, stale-response discard, Blob URL replacement, revocation, and teardown prevent cross-window aborts, direct remote assignment, and leaks.
- [ ] **HARD-04**: Paja validates Blossom authorization and completed result URL/hash/size against confirmed stored bytes, with tested denied, unavailable, cancelled, malformed-result, and failed outcomes.

### Cross-Repository Proof and Release Readiness

- [ ] **E2E-01**: Browser coverage drives the real Writer app through Paja with controlled signer, relay, media, and Blossom services and proves tagging, upload, partial data, identity switch/logout, no iframe replacement, RESOURCE-mediated previews, and absence of direct network/key access.
- [ ] **VERIFY-01**: Focused and full required gates pass in each repository actually changed; changed Kehto packages have changesets; implementation branches are pushed with verification evidence, checked NAP refs, conformance status, draft-spec gaps, and cross-repo dependency/order notes.
- [ ] **VERIFY-02**: Every upstream PR contains only focused implementation, tests, required docs, and changesets for one coherent concern; it excludes `.planning/**`, Graphify output, unrelated cleanup, preserved WIP, generated noise, and cross-repo work that belongs in a separate PR.

## Future Requirements

Deferred beyond fork-v1.29-paja-social-blossom and excluded from this roadmap.

### Content-Addressed Blossom Reads

- **BLOSSOM-01**: Writer can resolve and fetch `blossom:sha256:<hex>` resources through NAP-RESOURCE with digest verification.
- **BLOSSOM-02**: Writer can use low-level NAP-BLOSSOM server-specific operations such as check, mirror, list, media transforms, and delete.

### Social Expansion

- **SOCIAL-01**: Paja exposes generalized durable social-cache management, eviction, observability, and offline controls for multiple napplets.
- **SOCIAL-02**: Writer can edit profiles, mutate follows, paginate large social graphs, retry missing authors, and browse posts or an infinite feed.
- **SOCIAL-03**: Writer exposes per-author completeness, moderation, richer profile cards, and broader media UX once protocol support exists.

### Upload Expansion

- **UPLOAD-04**: Writer can initiate upload cancellation and display detailed byte progress through a stable upstream contract.
- **UPLOAD-05**: Paja exposes multiple upload rails with rail-specific policy and user choice beyond the explicit Blossom PoC.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Paja-specific profile-cache API injected into Writer | User selected standard NAP boundary; internal Paja caching must remain implementation detail. |
| Direct Writer relay, HTTP, WebSocket, or Blossom networking | Violates NIP-5D shell mediation and the PoC security boundary. |
| Writer-visible private keys, signer credentials, Blossom auth events, or server credentials | Signing and authorization remain Paja/shell-owned. |
| `blossom:sha256` reads and low-level NAP-BLOSSOM | HTTPS upload result plus NAP-RESOURCE preview proves the immediate need; content-addressed reads are follow-up. |
| Profile editing, follow mutation, feed browsing, moderation, and pagination | Immediate need is followed-profile tagging plus upload, not a full social client. |
| Per-author completeness claims | NAP-OUTBOX exposes query-wide `incomplete`/`error`, not author-level coverage metadata. |
| New framework, social SDK, relay client, crypto library, or uploader dependency | Existing Paja, Writer, Napplet, browser, and Playwright stack covers the PoC. |
| Synthetic social fixture as primary acceptance target | Real Writer is the requested integration target; small fixtures may remain focused protocol tests only. |
| Planning artifacts in upstream PRs | Planning merges only to the fork's `master`; upstream reviewers receive focused source, tests, required docs, and changesets only. |
| Writer implementation before explicit approval | Current Writer WIP must be preserved and its integration branch may start only after user approval. |

## Traceability

Every v1 requirement maps to exactly one roadmap phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PRE-01 | Phase 101 | Pending |
| PRE-02 | Phase 101 | Pending |
| PAJA-01 | Phase 102 | Complete |
| PAJA-02 | Phase 102 | Complete |
| PAJA-03 | Phase 102 | Complete |
| UPLOAD-02 | Phase 103 | Pending |
| POC-02 | Phase 103 | Pending |
| WRITER-01 | Phase 104 | Pending |
| WRITER-02 | Phase 104 | Pending |
| WRITER-03 | Phase 104 | Pending |
| WRITER-04 | Phase 104 | Pending |
| UPLOAD-01 | Phase 104 | Pending |
| UPLOAD-03 | Phase 104 | Pending |
| POC-01 | Phase 104 | Pending |
| HARD-01 | Phase 105 | Pending |
| HARD-02 | Phase 105 | Pending |
| HARD-03 | Phase 105 | Pending |
| HARD-04 | Phase 105 | Pending |
| E2E-01 | Phase 106 | Pending |
| VERIFY-01 | Phase 106 | Pending |
| VERIFY-02 | Phase 106 | Pending |

**Coverage:**

- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-07-24*
*Last updated: 2026-07-24 — fork-v1.29-paja-social-blossom roadmap traceability assigned to Phases 101-106.*
