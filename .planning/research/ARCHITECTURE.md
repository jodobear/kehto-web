# Architecture Research

**Domain:** Kehto v1.29 Social + Blossom Vertical Slice
**Researched:** 2026-07-24
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Built SDK social napplet — sandboxed opaque iframe                     │
│                                                                        │
│ Identity session controller                                            │
│ identity.getPublicKey / identity.changed / identity.getFollows         │
│       │                                                                │
│ Profile batch loader ────── Media controller ────── Upload action      │
│ outbox.query kind:0         resource.bytes → Blob URL   rail: blossom │
└───────────────────────────────┬────────────────────────────────────────┘
                                │ NAP envelopes only
┌───────────────────────────────▼────────────────────────────────────────┐
│ ShellBridge → Runtime ACL/firewall/dispatch → registered services       │
│  identity | outbox | resource | upload                                  │
└──────────────┬────────────────────┬────────────────────┬───────────────┘
               │                    │                    │
┌──────────────▼───────────┐ ┌──────▼───────────┐ ┌──────▼───────────────┐
│ signer + kind-3 follows  │ │ relay pools/NIP65 │ │ host fetch + Blossom │
│ host-owned providers     │ │ host-owned policy │ │ server/signing policy │
└──────────────────────────┘ └──────────────────┘ └──────────────────────┘
```

Use the existing ShellBridge mediation boundary. `ShellBridge` routes napplet
messages to `runtime.handleMessage()` and already broadcasts `identity.changed`
through `publishIdentityChanged()` (`packages/shell/src/shell-bridge.ts:190-274`).
Runtime already dispatches `resource`, `outbox`, and `upload` to service handlers
(`packages/runtime/src/domain-handlers.ts:42-62`). Do not add social-specific
transport, direct relay access, `window.nostr`, or napplet-visible private-key access.

### Component Responsibilities

| Component | Responsibility | Typical implementation |
|-----------|----------------|------------------------|
| Built social fixture | UI, identity generation, profile reduction, object URL ownership, SDK calls | New Vite fixture in `tests/fixtures/napplets/nap-social` |
| Identity session controller | Atomically replace active user/session-derived state | New generation-fenced fixture module |
| Profile batch loader | Batched kind-0 reads and deterministic newest profile selection | New fixture module using `outbox.query` |
| Media controller | Fetch granted HTTPS bytes and safely manage object URLs | New fixture module using `resource.bytes`/`resource.cancel` |
| Identity service | Resolve active pubkey and follows through host callbacks | Existing `createIdentityService` |
| Outbox service/router | Relay discovery, policy, verification, dedup, incomplete outcome | Existing `createOutboxService` + `createRelayPoolOutboxRouter` |
| Resource service | Session identity/grant check and host-owned fetch | Existing service, cancellation isolation correction required |
| Upload service/Paja runtime | Server selection, consent, signing, HTTP Blossom upload | Existing `createUploadService` and `PajaUploadRuntime` |

## Recommended Project Structure

```text
apps/playground/
├── src/
│   ├── demo-hooks.ts                    # Modify: follows provider + outbox registration
│   ├── playground-relay-service.ts       # Modify: outbox-router adapters
│   └── shell-host.ts                     # Existing identity.changed browser host path
└── napplets/feed/                        # Modify direct profile media or use as reference

packages/
├── services/src/
│   ├── resource-service.ts               # Modify: requester-scoped cancellation
│   ├── outbox-service.ts                 # Reuse envelope adapter
│   └── relay-pool-outbox-router.ts       # Reuse routing/partial-result behavior
└── paja/src/
    ├── browser-host.ts                   # Modify: broadcast identity change, no reload
    ├── browser-adapter.ts                # Modify: session resolver + explicit media policy
    ├── browser-relay-runtime.ts          # Reuse follows provider
    └── browser-upload.ts                 # Reuse Blossom policy/signing backend

tests/
├── fixtures/napplets/nap-social/         # New built released-SDK fixture
├── e2e/paja-social.spec.ts               # New full browser proof
└── unit/                                 # New session, reducer, media, isolation tests
```

### Structure Rationale

- **Fixture modules own social application behavior.** Replaceable-event reduction,
  partial-result presentation, stale-result fencing, and object URLs must not leak
  into generic runtime services.
- **Services remain shell boundaries.** Relay policy, identity providers, origin
  authorization, signer access, and byte transfer stay injected and shell-owned.
- **Paja and playground remain host integrations.** Both use the same NAP services
  while retaining their own relay/signer implementations.

## Architectural Patterns

### Pattern 1: Generation-Fenced Identity Session

**What:** Keep a monotonic identity generation. Every asynchronous identity,
follows, profile, and media operation captures the generation and may commit only
if it still matches current state.

**When to use:** Initial identity snapshot and every `identity.changed` push.
Subscribe to identity changes before issuing the snapshot.

**Trade-offs:** It cannot physically cancel current `outbox.query` through the
existing public protocol, but it prevents stale state corruption without adding a
draft-protocol extension.

**Example:**
```typescript
let generation = 0;
let pubkey = '';

function replaceIdentity(next: string): number {
  if (next === pubkey) return generation;
  generation += 1;
  pubkey = next;
  cancelMediaAndRevokeUrls();
  clearIdentityDerivedState();
  return generation;
}

async function refresh(next: string): Promise<void> {
  const token = replaceIdentity(next);
  if (!next) return;
  const follows = await identityGetFollows();
  if (token !== generation || pubkey !== next) return;
  void loadProfileBatches(follows, token);
}
```

The current feed controller subscribes before its initial snapshot
(`apps/playground/napplets/feed/src/feed-identity-events.ts:47-64`), but lacks a
generation guard: a late snapshot can overwrite a newer pushed identity. Extend
that controller or use a dedicated social controller.

### Pattern 2: Batched Query, Local Replaceable-Event Reduction

**What:** Normalize/deduplicate follows, split into batches of 100 authors, and
issue one `outbox.query` per batch with `{ kinds: [0], authors: batch }`. Reduce
valid events locally by pubkey, choosing greatest `(created_at, id)`.

**When to use:** Follow-profile loading. It bounds message/filter size without
creating one query per author.

**Trade-offs:** NAP-OUTBOX query outcomes are query-wide. `incomplete`/`error`
do not identify missing authors or guarantee newest-per-author data. Keep successful
profiles while surfacing degraded state. Do not set a global event limit equal to
batch size: one prolific author can consume it.

**Example:**
```typescript
function newestProfiles(events: readonly NostrEvent[]): Map<string, NostrEvent> {
  const result = new Map<string, NostrEvent>();
  for (const event of events) {
    if (event.kind !== 0 || !validProfileJson(event.content)) continue;
    const old = result.get(event.pubkey);
    if (!old || event.created_at > old.created_at ||
      (event.created_at === old.created_at && event.id > old.id)) {
      result.set(event.pubkey, event);
    }
  }
  return result;
}
```

`createOutboxService` returns `events`, `incomplete`, and `error` for a query
(`packages/services/src/outbox-service.ts:358-380`). The concrete router owns
relay discovery, verification, EOSE/deadline completion, and partial results
(`packages/services/src/relay-pool-outbox-router.ts:283-408`). It has internal
`queryStream().close()`, but public `outbox.query` is aggregate; do not invent a
custom napplet cancellation wire message.

### Pattern 3: Resource-Mediated Blob URL Ownership

**What:** Treat profile metadata URLs as untrusted references. Request bytes through
`resource.bytes`, create a local Blob URL, and render only that URL. Store
`{requestId, generation, objectUrl}` per `pubkey:picture` or `pubkey:banner`.

**When to use:** All profile media and any displayed result of an upload.

**Trade-offs:** Every URL must be revoked on replacement, identity reset, and
`pagehide`. Use individual bounded-concurrency requests rather than unbounded
`resource.bytesMany`; the current `bytesMany` path is sequential
(`packages/services/src/resource-service.ts:467-517`).

**Example:**
```typescript
async function replaceAsset(key: string, url: string, token: number): Promise<void> {
  const requestId = `${token}:${key}:${crypto.randomUUID()}`;
  pending.set(key, requestId);
  const blob = await resourceBytes(url, requestId);
  if (token !== generation || pending.get(key) !== requestId) return;
  const next = URL.createObjectURL(blob);
  const old = objectUrls.get(key);
  objectUrls.set(key, next);
  setImageSource(key, next);
  if (old) URL.revokeObjectURL(old);
}
```

The existing feed violates this milestone boundary: it allows HTTP(S) profile
URLs and assigns `img.src = picture` directly
(`apps/playground/napplets/feed/src/main.ts:86-147`). Replace that behavior.

## Data Flow

### Request Flow

```text
identity.changed(pubkey)
    ↓
fixture increments generation, clears follows/profiles/media URLs
    ↓
identity.getFollows → createIdentityService → host relay-backed provider
    ↓
batches: outbox.query({ kinds:[0], authors:[...] })
    ↓
relay-pool router → NIP-65/fallback relays → verified partial/full result
    ↓
fixture reduces newest valid profile per pubkey
    ↓
resource.bytes(HTTPS picture/banner) → host grants + fetch → Blob
    ↓
URL.createObjectURL(Blob) → image element
```

### State Management

```text
identity event or initial snapshot
    ↓
identityGeneration++
    ↓
cancel media + revoke URLs + clear all identity-derived UI state
    ↓
all async work carries captured generation
    ↓
commit only when captured generation === current generation
```

### Key Data Flows

1. **Identity lifecycle:** Playground already publishes signer changes through
   `relay.publishIdentityChanged(pubkey)` (`apps/playground/src/main.ts:174-182`)
   and synchronizes newly bound frames (`apps/playground/src/shell-host.ts:193-215`).
   Paja must use the same in-place push semantics.
2. **Follows:** Paja’s `createPajaIdentityProviders` already queries the newest
   kind-3 event and normalizes `p` tags (`packages/paja/src/browser-relay-runtime.ts:334-355`).
   Playground must inject an equivalent `getFollows` callback.
3. **Blossom:** The fixture requests `rail: 'blossom'`; Paja handles consent,
   server policy, signer ownership, and upload delegate (`packages/paja/src/browser-upload.ts:113-172`).
   The HTTP uploader signs kind 24242 and validates returned URL/hash/size
   (`packages/services/src/http-uploader.ts:243-307`).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Nostr relays | Shell-owned `OutboxRouter` | NIP-65, fallback relays, verification, and timeouts are host policy. |
| HTTPS profile media | `resource.bytes` through host fetch/grants | Never derive grants automatically from untrusted kind-0 metadata. |
| Blossom | `upload.upload` with `rail: "blossom"` | Server choice, consent, authorization event, and HTTP PUT are shell-owned. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| napplet ↔ shell | NAP envelopes via ShellBridge | No direct network/key access. |
| shell ↔ runtime | `runtime.handleMessage(windowId, message)` | Existing ACL/firewall choke point. |
| runtime ↔ services | `ServiceHandler.handleMessage(windowId, message, send)` | Reuse identity/outbox/resource/upload domains. |
| identity service ↔ host | Dynamic `getSigner`/`getFollows` callbacks | Service calls signer/provider per request, allowing active identity changes. |
| resource service ↔ host | fetch + grants + session identity | Constructor already requires all four dependencies. |

## Required Host-Path Changes

### Playground

Modify `apps/playground/src/demo-hooks.ts` to supply a relay-backed `getFollows`
provider and register an `outbox` service. It currently constructs identity with
only `getSigner` (`:150`) and includes `relay` but not `outbox` in `services`
(`:168-185`).

Extend `apps/playground/src/playground-relay-service.ts` to expose an
`OutboxRelayPool` adapter and a NIP-65 loader using existing relay selection,
request timeout, observable completion, and activity accounting. Build
`createRelayPoolOutboxRouter` and `createOutboxService` from that host adapter;
do not place relay selection in the napplet.

### Paja

Modify `packages/paja/src/browser-host.ts`:

- `createHostSignerController` currently calls `state.reload()` when a signer
  connects (`:346-362`). Replace it with `bridge.publishIdentityChanged(activePubkey)`.
- Publish `''` for transition/error/disconnect state and preserve iframe/session
  identity. User login identity is distinct from the NIP-5D dTag/aggregate hash.
- Paja upload’s signer subscription can continue refreshing upload identity; it
  is already wired in `browser-upload.ts:194-204`.

Modify `packages/paja/src/browser-adapter.ts`:

- Replace the current permissive resource setup at `:348-355` (`isOriginGranted:
  () => true`, wildcard grants, fixed `dev-target` identity) with a session-registry
  resolver and configured explicit profile-media origins.
- Preserve the existing Paja follows provider and relay-pool outbox router.

## Cancellation and Isolation

`createResourceService` stores in-flight requests by raw request ID
(`packages/services/src/resource-service.ts:171-175`) and handles `resource.cancel`
without the requester window (`:520-525,628-632`). Change storage keys to
`windowId:requestId`, pass `windowId` into cancellation, and retain raw IDs only
on response envelopes. Add a two-iframe regression: one iframe must not cancel
another’s same/guessed request ID.

Fixture cancellation rules:

| Work | Transport cancellation | Required behavior |
|------|------------------------|-------------------|
| Initial identity / follows | None | Generation-fence late response. |
| `outbox.query` | None through public service | Generation-fence each batch result. |
| `resource.bytes` | `resource.cancel` | Cancel on reset/replacement and still reject stale results. |
| Object URLs | N/A | Revoke on replacement/reset/pagehide. |
| Upload | Service teardown cancellation | Shell cancels on destroyed window; fixture ignores stale status/result. |

## Testing Architecture

### Unit

- Late initial public-key snapshot after an `identity.changed` push; A → B;
  B → signed-out; duplicate pushes; stopped controller.
- Batching and reduction: malformed kind-0 JSON rejected; newest `(created_at,id)`
  selected; partial batch retains successes.
- Media: stale responses do not install object URLs; reset/replacement/pagehide
  revoke every URL; request IDs are generation-scoped.
- Host boundary: playground follows/outbox registration; Paja no-reload identity
  push; resource cross-window cancellation isolation.

### Browser E2E

Add `tests/e2e/paja-social.spec.ts`, modeled on the built-package Paja proof in
`tests/e2e/paja-single-window.spec.ts`, but load a **built released-SDK fixture**.
Start controlled relay, HTTPS/media, and Blossom servers. Prove:

1. Login exposes active pubkey/follows and loads batched kind-0 profiles.
2. Partial responses retain successful profiles with degraded status.
3. Media element `src` values are `blob:` URLs; the media server observes
   host-mediated resource reads; remote profile URLs are never assigned directly.
4. Identity switch and logout update the existing iframe without reload and stale
   earlier results cannot repopulate state.
5. Explicit Blossom upload sends bytes, receives a valid kind-24242 shell-signed
   authorization, and returns validated upload data. Any preview reads returned
   HTTPS through `resource.bytes` again.
6. In-frame checks prove no `window.nostr`, direct fetch, relay pool, or key path.

Add `nap-social` to `tests/unit/sdk-migration-guard.test.ts`, which currently
pins fixture package versions and rejects legacy SDK import patterns.

## Anti-Patterns

### Anti-Pattern 1: Reload on identity change

**What people do:** Recreate Paja’s iframe on signer connection.

**Why it is wrong:** It masks identity races and fails in-place lifecycle proof.
Paja currently reloads at `packages/paja/src/browser-host.ts:360`.

**Do this instead:** Broadcast `identity.changed`, retain the iframe, and
make fixture state generation-fenced.

### Anti-Pattern 2: Profile URL equals permission

**What people do:** Assign a kind-0 picture/banner URL directly, or dynamically
grant its origin because metadata requested it.

**Why it is wrong:** Relay metadata is untrusted input; this bypasses the proxy
or lets metadata select potentially dangerous host fetch targets.

**Do this instead:** Use explicit host-configured/consented origins, resource
bytes, and local Blob URLs only.

### Anti-Pattern 3: Custom outbox cancellation envelope

**What people do:** Add an unrecognized cancel operation because profile queries
become stale.

**Why it is wrong:** Current public `outbox.query` is aggregate while the
router’s stream-close facility is internal; adding wire behavior drifts from the
draft specification.

**Do this instead:** Bound batches and fence stale results by identity generation.

## Suggested Build Order

1. **Complete and harden host boundaries:** resource cancellation isolation;
   playground relay-backed follows and outbox; Paja actual session identity and
   explicit resource origin policy.
2. **Implement in-place identity lifecycle:** replace Paja reload-on-connect with
   `identity.changed`; cover connect, switch, and empty-pubkey behavior.
3. **Build the social fixture:** SDK package, generation controller, batched
   profile reducer, partial-state UI, and Blob URL manager.
4. **Capstone real Paja E2E:** login → profiles → mediated media → in-place
   switch/reset → Blossom upload with no direct napplet network/key surface.

This ordering establishes host mediation and lifecycle correctness before the
fixture depends on them; the browser test then proves cross-package integration
rather than compensating for missing lower-level guarantees.

## Sources

- Repository graph query and source inspection, 2026-07-24.
- `packages/shell/src/shell-bridge.ts`
- `packages/runtime/src/domain-handlers.ts`
- `packages/services/src/identity-service.ts`
- `packages/services/src/outbox-service.ts`
- `packages/services/src/relay-pool-outbox-router.ts`
- `packages/services/src/resource-service.ts`
- `packages/services/src/upload-service.ts`
- `packages/services/src/http-uploader.ts`
- `packages/paja/src/browser-adapter.ts`
- `packages/paja/src/browser-host.ts`
- `packages/paja/src/browser-relay-runtime.ts`
- `packages/paja/src/browser-upload.ts`
- `apps/playground/src/demo-hooks.ts`
- `apps/playground/src/playground-relay-service.ts`
- `apps/playground/napplets/feed/src/main.ts`
- `tests/e2e/paja-single-window.spec.ts`
- Milestone protocol references in `.planning/PROJECT.md:9-22`: NAP-IDENTITY
  master `6461e4b`; draft NAP-OUTBOX PR #32 `4589a8f`; draft NAP-RESOURCE PR
  #80 `fa6bcc6`; draft NAP-UPLOAD PR #33 `a7cc174`; draft NAP-BLOSSOM PR #71
  `ca1d7ba`.

---
*Architecture research for: Kehto v1.29 Social + Blossom Vertical Slice*
*Researched: 2026-07-24*
