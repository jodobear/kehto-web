# Phase 102: Paja Standard-NAP Social PoC - Research

**Researched:** 2026-07-24
**Domain:** Paja-hosted NAP-IDENTITY and NAP-OUTBOX social-data cache
**Confidence:** LOW

<user_constraints>
## User Constraints

> No `102-CONTEXT.md` exists. The following locked constraints are copied from the Phase 102 objective and user-provided scope.

### Locked Decisions

- **Phase description:** A logged-in napplet can discover the active Paja identity, follows, and followed kind-0 profile events through standard NAP interfaces.
- **User ordering is locked:**
  1. Phase 102 first: identity/follows + kind-0 OUTBOX cache.
  2. Phase 103 later: shell-owned Blossom upload.
  3. Real Paja smoke after both.
  4. Writer integration only after both work.
- **Hard scope fence:** NO Writer edits in Phase 102. Do not execute Phase 101. Preserve normal NAP interfaces; no Paja-specific app API.
- **NAP/NIP-5D guardrail:** identify owning `napplet/naps` specs for identity and OUTBOX; check exact merged master path/ref/commit if available. Compare message direction, fields, lifecycle, error/incomplete/dedup semantics, security. Record spec gaps/upstream drift explicitly. Treat packaged `@napplet/nap` types as implementation contract, never local code as authority.

### Claude's Discretion

- Use a Paja-internal, memory-only social-cache composition and organize its tests as long as it exposes only existing `identity` and `outbox` services. [ASSUMED]
- Keep the cache implementation and its adapter wiring in `packages/paja`; do not expand the public NAP surface or introduce a new package. [VERIFIED: .planning/REQUIREMENTS.md]

### Deferred Ideas (OUT OF SCOPE)

- Phase 103's Paja-owned Blossom rail, all real Writer smoke work, and all Writer source changes. [VERIFIED: .planning/ROADMAP.md]
- Follow mutation, profile editing, pagination, offline/eviction controls, moderation, feed browsing, and per-author completeness. [VERIFIED: .planning/REQUIREMENTS.md]
</user_constraints>

## Project Constraints (from CLAUDE.md)

- Start Phase 102 source work from a clean implementation branch based on a freshly verified `kehto/web` `upstream/main`, never from this planning branch; retain planning and Graphify artifacts outside upstream implementation PRs. [VERIFIED: CLAUDE.md]
- Preserve the existing unrelated `.planning/config.json` auto-chain change; stage only the Phase 102 files explicitly and never discard work not created by this phase. [VERIFIED: git status and CLAUDE.md]
- Before any NAP/NIP-5D code or test change, check the owning `napplet/naps` document, record the exact ref, and report conformant behavior, upstream drift, or an intentional spec gap. The published `@napplet/nap/*/types` contract outranks Kehto-local code. [VERIFIED: CLAUDE.md]
- Keep NAP-SHELL mandatory and distinct from optional domain availability: the shell receiver is ready before one bare `shell.ready`, caches the first `shell.init`, and does not expose a service before the authorized session exists. [VERIFIED: CLAUDE.md] [CITED: https://raw.githubusercontent.com/napplet/naps/master/naps/NAP-SHELL.md]
- Preserve existing ACL gates: `identity.getFollows` requires `identity:read`; `outbox.query` and its result delivery require `outbox:read`. Do not bypass or weaken those gates for the cache. [VERIFIED: packages/acl/src/resolve.ts]
- Keep Paja and napplet responsibilities separated: the host owns relay routing, signature verification, policy, and cache implementation; napplets receive only standard NAP messages and no signer/private-key/direct-network surface. [VERIFIED: CLAUDE.md] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md]
- Follow project conventions: strict ESM TypeScript, 2-space indentation, lowercase-hyphenated file names, JSDoc on any new public export, and no framework dependency. [VERIFIED: CLAUDE.md]
- For changed Paja behavior, add focused tests, run `pnpm build`, `pnpm type-check`, `pnpm test:unit`, applicable `pnpm test:e2e`, documentation checks when public docs change, and the AI-slop gate before shipping. Add a changeset for shipped package output. [VERIFIED: CLAUDE.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAJA-01 | After login, Paja can provide the active public key and relay-backed follow list through standard `identity.getPublicKey` and `identity.getFollows`, with lookups bound to the public key captured when each request begins. [VERIFIED: .planning/REQUIREMENTS.md] | Reuse `createIdentityService` request/result envelopes; replace Paja's lazy unsigned follow loader with an account-keyed, verified contact-list loader and add request-snapshot regressions. [VERIFIED: packages/services/src/identity-service.ts] |
| PAJA-02 | After login, Paja prefetches and keeps followed authors' kind-0 profiles in an internal cache that refreshes for the active identity and is never exposed through a Paja-specific application API. [VERIFIED: .planning/REQUIREMENTS.md] | Add a private Paja social-cache composition that loads kind 3, then asks the existing outbox router for followed kind-0 events, retains only validated events, and warms immediately after adapter creation. [ASSUMED] |
| PAJA-03 | A napplet can query followed authors' kind-0 events through standard `outbox.query`; Paja may satisfy or refresh results from its internal cache while preserving normal OUTBOX events, deduplication, `incomplete`, and `error` semantics. [VERIFIED: .planning/REQUIREMENTS.md] | Decorate the existing Paja `OutboxRouter`; retain the base result's envelope semantics and merge only validated, matching cached `RelayEventResult` values by event ID. [ASSUMED] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md] |
</phase_requirements>

## Summary

Paja already exposes the two required standard services: `createIdentityService` maps `identity.getPublicKey` and the optional `getFollows` host provider to standard result envelopes, while `createOutboxService` delegates query routing, event signature verification, deduplication, and partial-result semantics to `createRelayPoolOutboxRouter`. Paja currently wires a lazy `createPajaIdentityProviders()` follow cache keyed by pubkey, but it fetches only kind-3 data on first `getFollows`, does not validate the fetched contact event, does not resolve equal timestamp ties by event ID, and has no followed kind-0 profile cache. [VERIFIED: packages/paja/src/browser-adapter.ts] [VERIFIED: packages/paja/src/browser-relay-runtime.ts] [VERIFIED: packages/services/src/identity-service.ts] [VERIFIED: packages/services/src/relay-pool-outbox-router.ts]

The implementation should therefore add one Paja-private social-cache layer, not a new NAP service and not a Writer API. It must snapshot the active account before any asynchronous cache load, fetch the active account's replacement kind-3 contact event from host-owned bootstrap relays, extract validated `p` tags, prime followed-author kind-0 events through the existing standard outbox router, and make the existing `outbox.query` router cache-aware. The cache decorator must never erase, downgrade, or synthesize `incomplete` or `error`; it may add valid cached events but must preserve standard `RelayEventResult` event identity, filtering, and ID deduplication. [ASSUMED] [CITED: https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md]

**Primary recommendation:** Implement a Paja-internal `browser-social-cache.ts` that is composed into the existing identity provider and `OutboxRouter`, warm it on adapter creation after login, and prove the standard envelopes through the existing services rather than inventing a social protocol. [ASSUMED]

**Protocol status gate:** NAP-IDENTITY is byte-identical at pinned commit `6461e4b37c29dc09a20dff35d9515889c4433874` and current `napplet/naps` master `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`; the pinned commit is an ancestor of master. In contrast, the pinned NAP-OUTBOX commit `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e` diverges from master and current master contains no `NAP-OUTBOX` path. Treat this as upstream drift: verify the published `@napplet/nap@0.28.0` types still match the pinned OUTBOX wire contract, record the drift in the implementation PR, and do not claim current-master NAP-OUTBOX conformance without an upstream replacement or explicit maintainer decision. [CITED: https://api.github.com/repos/napplet/naps/commits/master] [CITED: https://api.github.com/repos/napplet/naps/compare/6461e4b37c29dc09a20dff35d9515889c4433874...master] [CITED: https://api.github.com/repos/napplet/naps/compare/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e...master] [CITED: https://api.github.com/repos/napplet/naps/git/trees/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24?recursive=1]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Public-key snapshot for `identity.getPublicKey` | Paja browser host / shell service | Signer provider | The host receives the request and supplies the active user identity; a napplet only receives the standard result envelope. [VERIFIED: packages/services/src/identity-service.ts] |
| Follow-list acquisition from kind 3 | Paja browser host / relay backend | NIP-07/NIP-46 signer relay hints | Paja queries host-selected bootstrap relays and extracts contact-list `p` tags for the captured account. [VERIFIED: packages/paja/src/browser-relay-runtime.ts] [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/02.md] |
| Followed kind-0 prefetch and account cache | Paja browser host / memory | Existing outbox router | This is shell implementation state; it must not become an app-visible service or durable napplet storage. [ASSUMED] |
| Normal kind-0 lookup | Standard `outbox` service | Paja cache decorator | The napplet sends ordinary `outbox.query`; Paja retains routing, validation, deduplication, timeout, and partial-failure ownership. [VERIFIED: packages/services/src/outbox-service.ts] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md] |
| Capability authorization | Runtime / ACL | Paja adapter | Existing NIP-5D dispatch gates follows by `identity:read` and query/result messages by `outbox:read`. [VERIFIED: packages/acl/src/resolve.ts] |
| Profile selection and presentation | Napplet client | — | Phase 102 returns ordinary kind-0 events; choosing a display winner or editing Writer is deferred to Phase 104. [VERIFIED: .planning/ROADMAP.md] |

## Standard Stack

### Core

| Library / component | Version | Purpose | Why Standard |
|---------------------|---------|---------|--------------|
| `@kehto/paja` workspace | `0.8.1` | Owns the browser host, signer controller, relay backend, and service composition. | The Phase requirement is Paja behavior; changing this existing package avoids a parallel host or app API. [VERIFIED: packages/paja/package.json] |
| `@kehto/services` workspace | workspace source | Provides `createIdentityService`, `createOutboxService`, and the relay-pool outbox router. | These are the existing NAP envelope, validation, deduplication, and lifecycle implementations; reuse them rather than fork them. [VERIFIED: packages/services/src/index.ts] |
| `@napplet/nap` | `0.28.0` installed/locked | Published identity and OUTBOX TypeScript message contract. | Project guardrails require the packaged types as the implementation contract. [VERIFIED: pnpm-lock.yaml] [VERIFIED: node_modules/.pnpm/@napplet+nap@0.28.0/node_modules/@napplet/nap/dist/{identity,outbox}/types.d.ts] |
| `nostr-tools` | `2.23.3` project dependency | Existing Paja relay pool and Nostr signature verifier. | Paja already uses `SimplePool` and `verifyEvent`; do not add another relay or crypto client. [VERIFIED: package.json] [VERIFIED: packages/paja/src/{browser-adapter,browser-relay-runtime}.ts] |

### Supporting

| Library / component | Version | Purpose | When to Use |
|---------------------|---------|---------|-------------|
| Vitest | `4.1.2` installed | Paja social-cache unit and adapter/service-composition tests. | Add focused tests beside Paja source and retain service-level envelope tests. [VERIFIED: package.json] [VERIFIED: `./node_modules/.bin/vitest --version`] |
| Playwright | `1.59.1` installed | Browser proof for Paja host wiring once the configured Chromium executable is available. | Required for Paja iframe/shell wiring under project policy, but currently blocked by the missing configured browser. [VERIFIED: `./node_modules/.bin/playwright --version`] [VERIFIED: playwright.config.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Internal Paja cache behind existing services | `paja.social.getProfiles` or another custom service | Rejected: it violates PAJA-02/03 and makes a host optimization into an application protocol. [VERIFIED: .planning/REQUIREMENTS.md] |
| Existing outbox-router decoration | A Paja-specific relay client invoked by the napplet | Rejected: it bypasses host ACL, relay policy, signature validation, and normal partial-result semantics. [VERIFIED: packages/services/src/relay-pool-outbox-router.ts] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md] |
| Validated in-memory account snapshots | Browser storage or a new database | Rejected for this PoC: durable social-cache policy, eviction, and offline controls are explicitly future scope. [VERIFIED: .planning/REQUIREMENTS.md] |
| Existing `nostr-tools` verifier and outbox router | Hand-written Nostr signature, filter, relay, or dedupe code | Rejected: correctness and security behavior already belongs in the host stack. [VERIFIED: packages/paja/src/browser-adapter.ts] [VERIFIED: packages/services/src/relay-pool-outbox-router.ts] |

**Installation:** None. Do not add or upgrade external packages, and do not change `package.json` or `pnpm-lock.yaml` for Phase 102. [VERIFIED: .planning/REQUIREMENTS.md]

**Package Legitimacy Audit:** Not applicable. Phase 102 adds no external package; it composes currently locked workspace and published dependencies. [VERIFIED: .planning/REQUIREMENTS.md]

## Architecture Patterns

### System Architecture Diagram

```text
                    Paja signer controller
                  (NIP-07 / NIP-46 / dev)
                              |
                 capture active public key
                              v
napplet --identity.getPublicKey/getFollows--> createIdentityService
                              |                      |
                              |                      v
                              |        Paja social cache (private, per account)
                              |          1. kind-3 contacts from bootstrap relays
                              |          2. validated p-tag follow set
                              |          3. kind-0 prefetch through base outbox router
                              |                      |
                              |                      v
                              |            account-scoped memory snapshot
                              |
napplet --outbox.query(kind:0, authors)--> createOutboxService
                                              |
                                              v
                                     social cache router decorator
                                       |                 |
                            cached validated matches     | base query
                                       |                 v
                                       +--> merge by ID --> relay-pool outbox router
                                                              |
                                                              v
                                            NIP-65 routing, relay policy, signature
                                            verification, dedupe, incomplete/error
                                                              |
                                                              v
                                      standard outbox.query.result to napplet
```

The napplet has no direct relay, cache, storage, signer, or Paja-specific API path in this design. [VERIFIED: .planning/REQUIREMENTS.md] [CITED: https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md]

### Recommended Project Structure

```text
packages/paja/src/
├── browser-social-cache.ts           # new private account-scoped kind-3/kind-0 cache
├── browser-social-cache.test.ts      # new cache races, validation, merge semantics
├── browser-relay-runtime.ts          # retain backend/bootstrap relay helpers
├── browser-adapter.ts                # construct, warm, and compose cache with services
└── browser-host.test.ts              # update Paja wiring guard if source seams change

packages/services/src/
├── identity-service.ts               # existing standard identity envelopes
├── identity-service.test.ts          # add request-snapshot regression if service behavior needs proof
└── outbox-service.test.ts            # existing standard result-envelope semantics
```

The new cache should remain Paja-internal. Export it only if package-local testability requires an exported symbol; if it becomes public API, add required JSDoc and package documentation. [ASSUMED] [VERIFIED: CLAUDE.md]

### Pattern 1: Capture the account before asynchronous work

**What:** Accept the captured pubkey as an explicit social-cache method argument. Never re-read the currently selected signer after the contact-list or profile query begins. Return/request results from that captured account, or discard a background-cache write when the cache generation is no longer current. [ASSUMED]

**When to use:** Every `getFollows` fallback and proactive post-login refresh. It directly supports PAJA-01's request-bound identity requirement. [VERIFIED: .planning/REQUIREMENTS.md]

**Existing pattern to reuse:** Paja's Blossom runtime increments a generation before refresh and verifies it before committing identity/discovery state. [VERIFIED: packages/paja/src/browser-upload.ts]

```ts
// Source: packages/paja/src/browser-upload.ts
const currentGeneration = ++generation;
identity = null;
discovered = null;

// ...await signer and relay work...
if (currentGeneration !== generation) return;
identity = { pubkey: signerPubkey, signer };
```

Apply the same generation guard to social-cache writes; do not use it to rewrite an already-correlated identity response for another account. [ASSUMED]

### Pattern 2: Warm cache through the standard router, then decorate the same router

**What:** Build the existing Paja relay-pool `OutboxRouter` first. The cache's background profile refresh calls that router with a kind-0/followed-authors filter, so cached profiles have already passed router signature validation and ID deduplication. The cache decorator then merges matching stored `RelayEventResult`s with a real base query result. [ASSUMED]

**When to use:** Only for normal `outbox.query` calls that request kind `0` for authors in the active account's follow set. Pass every other OUTBOX operation and non-social query through unchanged. [ASSUMED]

**Required merge contract:**

1. Execute the base query; do not turn a cache hit into a protocol-specific result type. [ASSUMED]
2. Keep the base `incomplete` and `error` fields exactly as returned, including the combination of useful events plus an error. [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md]
3. Add only cache records that satisfy the original NIP-01 filters and deduplicate the combined collection by `event.id`. [ASSUMED] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md]
4. Preserve the `RelayEventResult` representation rather than returning raw `NostrEvent` objects or inventing cache metadata on the wire. [VERIFIED: packages/services/src/outbox-service.ts] [VERIFIED: node_modules/.pnpm/@napplet+nap@0.28.0/node_modules/@napplet/nap/dist/outbox/types.d.ts]

### Pattern 3: Replaceable contact data must be deterministic and verified

**What:** Before deriving follows, validate candidate kind-3 events with Paja's existing `verifyEvent`, then select the newest replacement by `created_at`; if timestamps tie, select the lexicographically lowest event ID. Extract only valid hexadecimal pubkeys from `p` tags and return a normalized deduplicated list. [ASSUMED]

**When to use:** Kind-3 contact-list refresh and any comparison of candidate kind-0 replacements owned by the cache. [ASSUMED]

**Why:** NIP-01 treats kinds 0 and 3 as replaceable and specifies the lowest-ID tie behavior; NIP-02 defines a kind-3 follow as a `p` tag whose first value is the followed key. [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md] [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/02.md]

### Anti-Patterns to Avoid

- **A custom social RPC:** Do not add `paja.*`, custom postMessage envelopes, or an app-visible cache accessor. [VERIFIED: .planning/REQUIREMENTS.md]
- **Cache-only success masking:** Do not clear `incomplete` or `error` merely because the cache yielded events; OUTBOX reports query-wide transport truth. [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md]
- **Raw bootstrap data as trusted cache data:** Do not copy Paja relay-backend events into the profile cache before signature validation. [VERIFIED: packages/paja/src/browser-relay-runtime.ts] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md]
- **One global follow/profile map:** Do not key data only by followed author; cache records must be partitioned by the active account that follows them. [ASSUMED]
- **A Phase 102 identity-change rewrite:** Do not replace the iframe or add a Writer-specific identity signal for this PoC; the no-iframe-replacement and atomic session-reset work belongs to Phase 105. [VERIFIED: .planning/ROADMAP.md]
- **Writer edits or real Writer smoke:** Do not touch Writer until after Phase 103 and the explicit Phase 104 approval gate. [VERIFIED: .planning/ROADMAP.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| NAP envelope handling | A new identity/outbox request dispatcher | `createIdentityService` and `createOutboxService` | They retain standard IDs, result envelopes, subscription lifecycle, and error marshalling. [VERIFIED: packages/services/src/{identity-service,outbox-service}.ts] |
| Relay selection and fanout | A social-cache relay client or per-napplet relay plan | `createRelayPoolOutboxRouter` | It owns NIP-65 routing, fallback, policy gates, signature checks, and event-ID deduplication. [VERIFIED: packages/services/src/relay-pool-outbox-router.ts] |
| Nostr validation and signatures | A custom verifier or crypto utility | Existing `nostr-tools` `verifyEvent` integration | Paja already uses the verifier for its outbox router. [VERIFIED: packages/paja/src/browser-adapter.ts] |
| Social transport | A Paja-specific profile/follow API | Standard `identity.getFollows` and `outbox.query` | This is the locked protocol boundary and lets any authorized napplet consume the data. [VERIFIED: .planning/REQUIREMENTS.md] |
| Cache persistence/eviction | Browser storage, database schema, sync, or eviction service | Account-scoped in-memory PoC cache | Durable social-cache policy is future scope, while Phase 102 needs an internal refresh cache only. [VERIFIED: .planning/REQUIREMENTS.md] |
| Profile winner selection for UI | A Writer-specific profile reducer in Paja | Return all ordinary kind-0 events | Deterministic app-level candidate selection is Phase 104's Writer responsibility. [VERIFIED: .planning/REQUIREMENTS.md] |

**Key insight:** The cache should optimize trusted host work behind the existing interface; it must not become another protocol layer or claim stronger OUTBOX completeness than the relay query supplied. [ASSUMED] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md]

## Common Pitfalls

### Pitfall 1: Fetching follows for whichever signer is active when the promise resolves

**What goes wrong:** A request that began for account A returns account B's follows after the user connects or switches signers. [ASSUMED]

**Why it happens:** The cache reads mutable signer state after an awaited relay operation instead of passing a captured pubkey through the entire operation. [ASSUMED]

**How to avoid:** Capture the signer/public key at request start; key cache snapshots by that public key; use a generation guard for background writes. [ASSUMED]

**Warning signs:** A deferred A request invokes a provider with B's pubkey, or an A profile appears in B's account snapshot. [ASSUMED]

### Pitfall 2: Letting cached events erase query-wide degradation

**What goes wrong:** A cached kind-0 event makes the result look complete even though some relay lists or connections failed. [ASSUMED]

**Why it happens:** The decorator treats cache availability as a replacement for router outcome metadata. [ASSUMED]

**How to avoid:** Merge events by ID but forward the base router's `incomplete` and `error` unchanged. [ASSUMED] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md]

**Warning signs:** A test has cached events plus a base `relay timeout`, but emitted `outbox.query.result` omits `incomplete` or `error`. [ASSUMED]

### Pitfall 3: Caching an unverified or non-deterministically selected kind-3 event

**What goes wrong:** A malformed, forged, or older contact list changes the social graph. [ASSUMED]

**Why it happens:** Current Paja helper logic selects by timestamp only and extracts tags from raw backend results. [VERIFIED: packages/paja/src/browser-relay-runtime.ts]

**How to avoid:** Verify the candidate, apply NIP-01 replacement ordering including lowest-ID ties, validate `p` tag pubkeys, then deduplicate. [ASSUMED] [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md] [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/02.md]

**Warning signs:** Equal-timestamp fixtures choose different follows depending on relay arrival order, or an invalid signature is accepted. [ASSUMED]

### Pitfall 4: Warming profiles through raw relay data instead of the outbox router

**What goes wrong:** Cache records lack normal `RelayEventResult` provenance or bypass the host's signature/dedup behavior. [ASSUMED]

**Why it happens:** The new cache is implemented as a second relay implementation rather than a decorator around the established router. [ASSUMED]

**How to avoid:** Use the existing base router to refresh kind-0 data and cache only its validated results. [ASSUMED] [VERIFIED: packages/services/src/relay-pool-outbox-router.ts]

**Warning signs:** The cache imports a second relay pool, returns raw `NostrEvent`s to the service, or no test exercises duplicate IDs from cache and base results. [ASSUMED]

### Pitfall 5: Treating the old OUTBOX draft as current master

**What goes wrong:** An implementation PR claims conformance to current `napplet/naps` master even though master no longer contains NAP-OUTBOX and the pinned commit has divergent history. [CITED: https://api.github.com/repos/napplet/naps/compare/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e...master] [CITED: https://api.github.com/repos/napplet/naps/git/trees/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24?recursive=1]

**Why it happens:** The milestone's pinned draft remains reflected in `@napplet/nap@0.28.0` types, but the documentation repository changed independently. [VERIFIED: node_modules/.pnpm/@napplet+nap@0.28.0/node_modules/@napplet/nap/dist/outbox/types.d.ts] [CITED: https://api.github.com/repos/napplet/naps/commits/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e]

**How to avoid:** Record the exact pinned draft and installed types, link the master-path absence as upstream drift, and obtain an explicit authority decision before representing any new semantics as standard. [ASSUMED]

**Warning signs:** A plan lists only `master/NAP-OUTBOX.md`, a file that is absent from the current master tree. [CITED: https://api.github.com/repos/napplet/naps/git/trees/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24?recursive=1]

## Code Examples

### Existing identity request correlation and host provider seam

```ts
// Source: packages/services/src/identity-service.ts
Promise.resolve(getCurrentPubkey(options))
  .then((pubkey) => buildResult(pubkey))
  .then((result) => send(result))
  .catch((err) => sendProviderError(send, fallbackResult, errorFallback, err));
```

Use Paja's social-cache `getFollows(capturedPubkey)` as the provider. The provider must use its `pubkey` argument rather than reading current signer state again. [ASSUMED] [VERIFIED: packages/services/src/identity-service.ts]

### Existing OUTBOX result forwarding contract

```ts
// Source: packages/services/src/outbox-service.ts
send({
  type: 'outbox.query.result',
  id,
  events: result.events,
  ...(result.incomplete === undefined ? {} : { incomplete: result.incomplete }),
  ...(result.error === undefined ? {} : { error: result.error }),
});
```

Make the decorator return a normal `OutboxResult`; do not modify this envelope handler or append cache-specific fields. [ASSUMED] [VERIFIED: packages/services/src/outbox-service.ts]

### Cache decorator sketch

```ts
// Prescriptive sketch; function names are proposed, not existing API.
const baseRouter = createOutboxRouter(backend, getSimulation, confirmRequest, signerProvider);
const socialCache = createPajaSocialCache({
  baseRouter,
  loadContactList: (pubkey) => loadPajaContactList(pubkey),
  getActiveSigner: () => createRuntimeSigner(getSimulation, confirmRequest, signerProvider),
});

void socialCache.refreshActiveIdentity();
services.identity = createIdentityService({
  getSigner: () => createRuntimeSigner(getSimulation, confirmRequest, signerProvider),
  getFollows: socialCache.getFollows,
});
services.outbox = createOutboxService({ router: socialCache.decorate(baseRouter) });
```

The implementation must preserve the existing service names and wire types; this sketch is a planning guide only. [ASSUMED] [VERIFIED: packages/paja/src/browser-adapter.ts]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Paja lazily loads and caches follows only, on the first `identity.getFollows` request. | Phase 102 should proactively refresh active-account follows and followed kind-0 events after adapter construction/login. | Phase 102 planned. | Meets PAJA-02 without exposing a new app API. [ASSUMED] [VERIFIED: packages/paja/src/browser-relay-runtime.ts] |
| Raw Paja contact-list selection sorts only `created_at`. | Apply NIP-01's lowest-event-ID tie rule and signature validation before caching. | Phase 102 planned. | Prevents relay-arrival-dependent follows. [ASSUMED] [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md] |
| Base router alone answers all OUTBOX queries. | A private cache decorator may supplement matching kind-0 results but returns the same standard `OutboxResult` semantics. | Phase 102 planned. | Retains router ownership of partial-result truth and policy. [ASSUMED] |
| Pinned NAP-OUTBOX draft exists at `4589a8f`. | Current `napplet/naps` master has no OUTBOX spec file; the installed typed contract remains the only packaged implementation reference. | Observed 2026-07-24. | Requires an upstream-drift note and authority decision, not a silent master-conformance claim. [CITED: https://api.github.com/repos/napplet/naps/git/trees/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24?recursive=1] [VERIFIED: node_modules/.pnpm/@napplet+nap@0.28.0/node_modules/@napplet/nap/dist/outbox/types.d.ts] |

**Deprecated/outdated:** Do not extend `createPajaIdentityProviders()` as the long-lived social feature. Its raw, lazy kind-3-only cache is insufficient for profile prefetch and lacks the required validation/tie behavior. [ASSUMED] [VERIFIED: packages/paja/src/browser-relay-runtime.ts]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A new `browser-social-cache.ts` is the best private seam, rather than keeping all logic in `browser-relay-runtime.ts`. | Primary recommendation / structure | Low: file placement can change without changing the public boundary. |
| A2 | The social cache should warm kind-0 profiles through the base outbox router, then decorate that router for cache-aware normal queries. | Architecture Patterns | Medium: another composition could be valid, but it must still preserve validated events and OUTBOX semantics. |
| A3 | The Phase 102 cache is memory-only and should not be coupled to Paja's generic `simulation.cache.mode`. | Standard Stack / Architecture | Medium: a product decision about simulation controls may be needed if disabled-cache mode must remain meaningful. |
| A4 | Cache merge should retain the base result's `incomplete`/`error` exactly, even when cached events add data. | Architecture Patterns | Medium: protocol intent supports it, but the removed current-master OUTBOX document means authority must be confirmed. |
| A5 | Existing Paja signer-triggered adapter reload is sufficient for Phase 102 cache refresh; no non-reloading `identity.changed` implementation belongs here. | Anti-Patterns | Medium: Phase 105 explicitly owns no-iframe-replacement lifecycle hardening. |

## Open Questions

1. **Which authority governs NAP-OUTBOX while current `napplet/naps` master has no OUTBOX document?**
   - What we know: pinned draft `4589a8f` specifies the existing envelope and published `@napplet/nap@0.28.0` types match its query/result fields; the commit is not merged into current master. [VERIFIED: node_modules/.pnpm/@napplet+nap@0.28.0/node_modules/@napplet/nap/dist/outbox/types.d.ts] [CITED: https://api.github.com/repos/napplet/naps/compare/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e...master]
   - What's unclear: whether an upstream replacement document or a current maintainer-approved ref supersedes the pinned draft. [CITED: https://api.github.com/repos/napplet/naps/git/trees/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24?recursive=1]
   - Recommendation: make a first-plan checkpoint record the master SHA/path absence and explicitly adopt the pinned draft plus installed types for this PoC, or stop for the replacement authority. Do not infer a current-master OUTBOX spec. [ASSUMED]

2. **Should Paja's generic `simulation.cache.mode: "disabled"` disable the required social cache?**
   - What we know: the simulation configuration defines the mode, but the current Paja relay/identity implementation does not consume it for follows/profile caching. [VERIFIED: packages/paja/src/simulation.ts] [VERIFIED: packages/paja/src/browser-relay-runtime.ts]
   - What's unclear: whether the simulation control is intended to govern this new required cache. [ASSUMED]
   - Recommendation: keep the required Phase 102 cache internal and in memory regardless of the generic simulator mode; revisit cache controls with the deferred social-cache-management work. [ASSUMED]

3. **How will the required Paja browser test run in this environment?**
   - What we know: Playwright is installed, but `playwright.config.ts` hardcodes `/usr/bin/chromium` and that executable is absent. [VERIFIED: `./node_modules/.bin/playwright --version`] [VERIFIED: playwright.config.ts]
   - What's unclear: whether the execution environment can provision system Chromium at that exact path or whether test-infrastructure policy allows a separately reviewed configuration change. [ASSUMED]
   - Recommendation: treat this as a Wave 0 environment blocker for the final `pnpm test:e2e` gate; do not silently skip browser proof. [ASSUMED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TypeScript build and Vitest | Yes | `v22.22.0` | — [VERIFIED: `node --version`] |
| pnpm | Workspace scripts | Yes | `10.9.4` | Direct local binaries work for focused diagnosis only; project scripts remain the normal command. [VERIFIED: `pnpm --version`] |
| Vitest binary | Focused Paja unit tests | Yes | `4.1.2` | — [VERIFIED: `./node_modules/.bin/vitest --version`] |
| Paja relay baseline test | Baseline test command | Yes | 2 tests passed | `./node_modules/.bin/vitest run packages/paja/src/browser-relay-runtime.test.ts` passed. [VERIFIED: local test run] |
| Playwright package | Browser proof | Yes | `1.59.1` | — [VERIFIED: `./node_modules/.bin/playwright --version`] |
| `/usr/bin/chromium` | `playwright.config.ts` Chromium launch | No | — | None without system provisioning or an explicitly approved test-infrastructure change. [VERIFIED: playwright.config.ts] |
| Live Nostr relay | Unit cache fixtures | Not required | — | Use existing deterministic Paja memory fixtures and mocked base-router results. [VERIFIED: packages/paja/src/browser-relay-runtime.ts] |

**Missing dependencies with no fallback:**
- System Chromium at `/usr/bin/chromium` for the configured end-to-end browser gate. [VERIFIED: playwright.config.ts]

**Missing dependencies with fallback:**
- None for focused unit tests; existing relay fixtures and mocks avoid live-network dependence. [VERIFIED: packages/paja/src/browser-relay-runtime.ts]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.2`; Playwright package `1.59.1` for browser coverage. [VERIFIED: local binary version checks] |
| Config file | `vitest.config.ts` for unit tests; `playwright.config.ts` for browser tests. [VERIFIED: vitest.config.ts] [VERIFIED: playwright.config.ts] |
| Quick run command | `./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts packages/services/src/identity-service.test.ts packages/services/src/outbox-service.test.ts` [ASSUMED] |
| Full suite command | `pnpm build && pnpm type-check && pnpm test:unit && pnpm test:e2e` after Chromium is provisioned. [VERIFIED: package.json] [VERIFIED: CLAUDE.md] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAJA-01 | `identity.getPublicKey` returns its standard signed-in/signed-out shape, while `getFollows` receives the request-start pubkey and returns a standard correlated result/error. | Unit + service composition | `./node_modules/.bin/vitest run packages/services/src/identity-service.test.ts packages/paja/src/browser-social-cache.test.ts` | Social-cache test: Wave 0 |
| PAJA-02 | Post-login warm sequence selects one verified kind-3 contact list, derives follows, requests followed kind-0 events, and isolates cached data by account/generation without a public service. | Unit | `./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts` | Wave 0 |
| PAJA-03 | Standard `outbox.query` merges matching validated cached events with base-router events by ID and forwards `events`, `incomplete`, and `error` without custom fields. | Unit + service integration | `./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts packages/services/src/outbox-service.test.ts` | Wave 0 |
| PAJA-01–03 | An authorized Paja iframe receives only standard identity/outbox interfaces and no custom social surface. | Browser / static guard | `pnpm test:e2e` after Chromium provision; retain/update `packages/paja/src/browser-host.test.ts` source guard. | Existing guard; browser environment blocked |

### Sampling Rate

- **Per task commit:** Run the focused social-cache and affected service tests. [ASSUMED]
- **Per wave merge:** Run `pnpm type-check` and `pnpm test:unit`. [VERIFIED: CLAUDE.md]
- **Phase gate:** Full build/type/unit/e2e gates green, the upstream-drift note is recorded, and no Writer path is modified. [VERIFIED: CLAUDE.md] [VERIFIED: .planning/ROADMAP.md]

### Wave 0 Gaps

- [ ] `packages/paja/src/browser-social-cache.test.ts` — account capture, verified contact selection, kind-0 warm, cache/base merge, duplicates, and degraded base results for PAJA-01 through PAJA-03. [ASSUMED]
- [ ] Paja adapter composition coverage — add to the social-cache test or create `browser-adapter.test.ts` to prove only `identity`/`outbox` services consume the cache. [ASSUMED]
- [ ] `packages/services/src/identity-service.test.ts` deferred-signer regression — prove a follow provider receives the signer identity captured at request start. [ASSUMED]
- [ ] System Chromium provisioning at `/usr/bin/chromium` — required before the project-mandated Paja browser gate. [VERIFIED: playwright.config.ts]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Resolve public identity through the existing read-only identity service; `getPublicKey` returns `""` without error when signed out and never exposes signing. [CITED: https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md] |
| V3 Session Management | Yes | Partition cache data by captured account and reject stale background writes with a generation guard. [ASSUMED] |
| V4 Access Control | Yes | Preserve `identity:read` for follows and `outbox:read` for standard queries/results; do not add a bypass service. [VERIFIED: packages/acl/src/resolve.ts] |
| V5 Input Validation | Yes | Validate hex pubkeys from kind-3 `p` tags, apply event filters before merge, retain service filter validation, and bound behavior through existing OUTBOX options/policy. [ASSUMED] [VERIFIED: packages/services/src/outbox-service.ts] |
| V6 Cryptography | Yes | Use existing Nostr event verification; do not hand-roll signature verification or expose signer capabilities. [VERIFIED: packages/paja/src/browser-adapter.ts] [CITED: https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md] |

### Known Threat Patterns for Paja Social Cache

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Old-account async result writes new-account cache | Information Disclosure / Tampering | Explicit captured account key plus generation-guarded writes and account-scoped snapshots. [ASSUMED] |
| Forged/stale contact event alters follows | Tampering | Verify event signature, deterministic replaceable-event ordering, and valid hex `p` tag extraction. [ASSUMED] [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md] |
| Cache bypasses NIP-65/policy/ACL routing | Elevation of Privilege | Refresh through/decorate the existing outbox router; retain existing ACL map and host relay gate. [ASSUMED] [VERIFIED: packages/acl/src/resolve.ts] |
| Cache hides relay failure | Repudiation / Tampering | Preserve query-wide `incomplete` and `error` from the base result even when events are cached. [ASSUMED] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md] |
| Huge/broad social refresh exhausts host or relays | Denial of Service | Use narrowly scoped kind-0 and followed-author filters; do not expand this PoC into pagination or broad feed reads. [ASSUMED] [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md] |

## Sources

### Primary (HIGH confidence)

- None. The research-provider confidence seam classified available fetches as LOW; no Context7 provider was available in this session. [VERIFIED: `ctx7` availability probe] [VERIFIED: `gsd-tools query classify-confidence --provider webfetch`]

### Secondary (MEDIUM confidence)

- None. [VERIFIED: `gsd-tools query classify-confidence --provider context7`]

### Tertiary (LOW confidence)

- [NAP-IDENTITY pinned `6461e4b`](https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md) — standard identity wire direction, result fields, signed-out behavior, push lifecycle, and authority. [CITED: https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md]
- [NAP-OUTBOX pinned `4589a8f`](https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md) — query fields, result semantics, routing, validation, deduplication, and security. [CITED: https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md]
- [napplet/naps master commit](https://api.github.com/repos/napplet/naps/commits/master) and [master tree](https://api.github.com/repos/napplet/naps/git/trees/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24?recursive=1) — current master SHA and absence of an OUTBOX document. [CITED: https://api.github.com/repos/napplet/naps/commits/master] [CITED: https://api.github.com/repos/napplet/naps/git/trees/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24?recursive=1]
- [NIP-01](https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md) and [NIP-02](https://raw.githubusercontent.com/nostr-protocol/nips/master/02.md) — replaceable kind ordering and contact-list tag semantics. [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md] [CITED: https://raw.githubusercontent.com/nostr-protocol/nips/master/02.md]
- Local Paja, services, ACL, package-lock, type-contract, config, and test evidence cited inline. [VERIFIED: packages/paja/src] [VERIFIED: packages/services/src] [VERIFIED: packages/acl/src] [VERIFIED: pnpm-lock.yaml]

## Metadata

**Confidence breakdown:**
- Standard stack: LOW — installed versions and existing dependency usage were inspected, but the required confidence classifier returned LOW for local and web evidence. [VERIFIED: `gsd-tools query classify-confidence --provider codebase`]
- Architecture: LOW — existing Paja seams are clear, but the social-cache composition is prescriptive and NAP-OUTBOX has current-master drift. [ASSUMED] [CITED: https://api.github.com/repos/napplet/naps/compare/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e...master]
- Pitfalls: LOW — they derive from direct source inspection and official documents, whose available provider classification was LOW. [VERIFIED: `gsd-tools query classify-confidence --provider webfetch`]

**Research date:** 2026-07-24
**Valid until:** Re-check `napplet/naps` master, the authoritative OUTBOX replacement decision, `@napplet/nap` package types, `kehto/web` upstream baseline, and Chromium availability immediately before Phase 102 execution. [ASSUMED]
