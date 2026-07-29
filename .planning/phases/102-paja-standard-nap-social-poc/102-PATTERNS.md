# Phase 102: Paja Standard-NAP Social PoC - Pattern Map

**Mapped:** 2026-07-24  
**Files analyzed:** 7 planned new/modified files  
**Analogs found:** 7 / 7

## Scope and Authority Boundaries

- This phase changes only Paja's internal host composition and focused Kehto tests. Do not create a Paja-specific napplet API, alter the ACL mappings, or edit Writer.
- Reuse `createIdentityService` and `createOutboxService`; they own standard NAP envelope correlation and errors. The social cache is an injected Paja-private provider/router decorator, not a new service.
- Keep `identity.getFollows` request-correlated: capture the identity once in `identity-service.ts`, then ensure the provider uses the supplied `pubkey` throughout its asynchronous work.
- Keep OUTBOX transport truth: the cache can add matching cached `RelayEventResult`s by event ID, but it must preserve the base result's `incomplete` and `error` properties exactly, including a result containing events plus an error.
- NAP authority checkpoint before execution: NAP-IDENTITY may use pinned `napplet/naps` commit `6461e4b37c29dc09a20dff35d9515889c4433874` (reported byte-identical to the researched master). NAP-OUTBOX must use the installed `@napplet/nap@0.28.0` types plus pinned draft `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e`; current `napplet/naps` master has no NAP-OUTBOX path, an upstream-drift/spec-gap that must be recorded rather than claimed as master conformance.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/paja/src/browser-social-cache.ts` | service / utility | request-response, transform | `packages/paja/src/browser-upload.ts` | role-match |
| `packages/paja/src/browser-social-cache.test.ts` | test | request-response, transform | `packages/paja/src/browser-upload.test.ts` | exact |
| `packages/paja/src/browser-adapter.ts` | provider / composition root | request-response | `packages/paja/src/browser-adapter.ts` | exact (modify in place) |
| `packages/paja/src/browser-relay-runtime.ts` | utility / relay backend | request-response, transform | `packages/paja/src/browser-relay-runtime.ts` | exact (modify in place) |
| `packages/paja/src/browser-host.test.ts` | test / static wiring guard | request-response | `packages/paja/src/browser-host.test.ts` | exact (modify in place) |
| `packages/services/src/identity-service.test.ts` | test | request-response | `packages/services/src/identity-service.test.ts` | exact (modify in place) |
| `packages/services/src/outbox-service.test.ts` | test | request-response | `packages/services/src/outbox-service.test.ts` | exact (modify in place) |

`packages/services/src/identity-service.ts` and `packages/services/src/outbox-service.ts` are read-only service-envelope analogs for this phase, not intended implementation targets unless an actual contract defect is found. The planned cache is Paja-private and should compose those services unchanged.

## Pattern Assignments

### `packages/paja/src/browser-social-cache.ts` (private service / utility, request-response + transform)

**Analog 1:** `packages/paja/src/browser-upload.ts`

**Imports and dependency injection pattern** (lines 1-15, 26-45):
```ts
import type { NostrEvent, NostrFilter } from '@napplet/core';
import type { Signer } from '@kehto/runtime';
import {
  createHttpUploader,
  type UploadInfo,
  type UploadRequest,
  type UploadResult,
  type Uploader,
} from '@kehto/services';

export interface PajaUploadRuntimeOptions {
  readonly getSimulation: () => PajaSimulation;
  readonly getSigner: () => Signer | null;
  readonly getProviderPubkey: () => string | null;
  readonly queryDiscovery: (relayUrls: string[], filters: NostrFilter[]) => Promise<NostrEvent[]>;
  readonly getRelayUrls: () => string[];
  readonly confirmRequest: (request: PajaConfirmationRequest) => boolean;
  readonly getNappletIdentity: (windowId: string) => NappletIdentity;
  readonly fetch?: typeof fetch;
  readonly subscribeSignerChange?: (listener: () => void) => () => void;
}
```
Copy the options-as-host-dependencies seam. The social cache options should accept the already-built base `OutboxRouter`, the Paja contact-list loader/query seam, and active-signer/pubkey access; it must not instantiate a second relay pool or expose a public service descriptor.

**Generation-scoped async snapshot pattern** (lines 58-110):
```ts
let generation = 0;
let identity: IdentitySnapshot | null = null;
let discovered: { pubkey: string; servers: string[] } | null = null;

async function refreshIdentity(): Promise<void> {
  const currentGeneration = ++generation;
  identity = null;
  discovered = null;
  // ... resolve and validate the current signer ...
  if (currentGeneration !== generation) return;

  identity = { pubkey: signerPubkey, signer };
  // ... await discovery ...
  if (currentGeneration !== generation || identity?.pubkey !== signerPubkey) return;
  discovered = { pubkey: signerPubkey, servers: newest ? normalizeDiscoveredServers(newest.tags) : [] };
}
```
Use this structure for active-account profile warm writes: increment before refresh, partition follows/profiles by captured account pubkey, and discard post-await writes when the generation or active snapshot no longer matches. Do not apply the guard by changing the result of an already-correlated identity request.

**Validate untrusted relay data before committing pattern** (lines 216-227):
```ts
function normalizeDiscoveredServers(tags: string[][]): string[] {
  const servers: string[] = [];
  for (const tag of tags) {
    if (tag[0] !== 'server' || typeof tag[1] !== 'string') continue;
    try {
      const [server] = normalizeUploadServers([tag[1]]);
      if (server && !servers.includes(server)) servers.push(server);
    } catch {
      // Ignore invalid URLs in an untrusted relay event.
    }
  }
  return servers;
}
```
Adapt the defensive normalization, not the upload-specific data shape: verify kind-3 candidates with Paja's existing `verifyEvent`, choose greatest `created_at` then lexicographically lowest ID, accept only valid 64-hex `p` tags, normalize lowercase, and deduplicate.

**Router decoration type and base semantics:** `packages/services/src/outbox-service.ts` lines 107-115 and 159-179 define `OutboxResult` and `OutboxRouter`. Implement the decorator as an `OutboxRouter` that delegates all non-query methods unchanged. For `query`, always await the base router and merge only cache values that match the original filters, retaining `RelayEventResult` (not raw `NostrEvent`) and deduplicating by `event.id`.

**OUTBOX result construction boundary:** `packages/services/src/relay-pool-outbox-router.ts` lines 256-270:
```ts
const result: OutboxResult = { events };
if (incomplete || !subscribedAny) result.incomplete = true;
if (!subscribedAny) result.error = 'relay list unavailable';
return result;
```
The Paja decorator must not reconstruct this policy. Return `{ events: mergedEvents, ...(base.incomplete === undefined ? {} : { incomplete: base.incomplete }), ...(base.error === undefined ? {} : { error: base.error }) }` so base degradation remains untouched.

---

### `packages/paja/src/browser-social-cache.test.ts` (test, request-response + transform)

**Analog:** `packages/paja/src/browser-upload.test.ts`

**Fixture and injected-host test pattern** (lines 1-45, 48-76):
```ts
import { describe, expect, it, vi } from 'vitest';
import type { EventTemplate, NostrEvent, NostrFilter } from '@napplet/core';
import type { Signer } from '@kehto/runtime';

function signer(pubkey = PUBKEY): Signer {
  return {
    getPublicKey: vi.fn(async () => pubkey),
    signEvent: vi.fn(async (template: EventTemplate) => signedEvent(template, pubkey)),
  };
}

const runtime = createPajaUploadRuntime({
  getSimulation: () => normalizePajaSimulation({ upload: { mode: 'blossom' } }),
  getSigner: () => activeSigner,
  getProviderPubkey: () => PUBKEY,
  queryDiscovery,
  getRelayUrls: () => ['wss://relay.example'],
  confirmRequest: () => true,
  getNappletIdentity: () => ({ dTag: 'demo', aggregateHash: 'hash' }),
  fetch: fetchFn as unknown as typeof fetch,
});
```
Use deterministic Nostr event factories, injected async seams, and spies. Do not use a live relay. The cache test should make the active pubkey, kind-3 results, base-router `OutboxResult`, and deferred promise all explicit fixtures.

**Identity-change and refresh assertion pattern** (lines 204-234):
```ts
let listener: (() => void) | undefined;
// ...construct runtime with subscribeSignerChange... 
await runtime.refreshIdentity();

pubkey = 'b'.repeat(64);
activeSigner = signer(pubkey);
listener?.();

await vi.waitFor(() => expect(queryDiscovery).toHaveBeenCalledTimes(2));
expect(queryDiscovery.mock.calls[1]?.[1]).toEqual([{ kinds: [10_063], authors: [pubkey], limit: 1 }]);
```
Adapt to prove active-account cache isolation: begin an account-A refresh, change to B before its promise settles, settle A, and assert A cannot overwrite B. Separately prove the request-start pubkey passed to `getFollows` remains A.

**Required focused cases:** verified deterministic kind-3 choice (including equal timestamp/lowest ID); invalid-signature and invalid-tag exclusion; per-account cache partition; warm kind-0 query through base router; cache/base duplicate-ID merge; cache filtering; and cached events alongside base `{ incomplete: true, error: 'relay timeout' }` with those two fields unchanged.

---

### `packages/paja/src/browser-adapter.ts` (provider / composition root, request-response)

**Analog:** `packages/paja/src/browser-adapter.ts`

**Existing router construction pattern** (lines 227-250):
```ts
function createOutboxRouter(
  backend: PajaRelayBackend,
  getSimulation: () => PajaSimulation,
  confirmRequest: (request: PajaConfirmationRequest) => boolean,
  signerProvider?: PajaSignerProvider,
) {
  return createRelayPoolOutboxRouter({
    relayPool: createPajaOutboxRelayPool(backend),
    loadRelayLists: createPajaRelayListLoader(backend, getSimulation, signerProvider),
    fallbackRelays: getPajaRelayUrls(getSimulation()),
    // signEvent and verifyEvent use the existing host-owned signer/verifier
    verifyEvent: (event) => verifyEvent(event as Parameters<typeof verifyEvent>[0]),
    defaultTimeoutMs: PAJA_LIVE_QUERY_WAIT_MS,
  });
}
```
Build this base router once. Pass it to the social cache for profile warming and use the cache's decorated router only for `createOutboxService`; do not create a second router, verifier, or relay client.

**Service composition pattern** (lines 348-395):
```ts
const services: Record<string, ServiceHandler> = {
  keys: createKeysService(),
  resource: createResourceService({ /* host-owned resource policy */ }),
};

if (getSimulation().relay.mode !== 'disabled') {
  services.relay = createRelayPoolService({ /* backend delegates */ });
  services.outbox = createOutboxService({ router: createOutboxRouter(backend, getSimulation, confirmRequest, signerProvider) });
}

if (getSimulation().capabilities.domains.identity) {
  services.identity = createIdentityService({
    getSigner: () => createRuntimeSigner(getSimulation, confirmRequest, signerProvider),
    ...createPajaIdentityProviders(backend, getSimulation, signerProvider),
  });
}
```
Replace the final two service inputs with one local social-cache composition: build base router, build the private cache using it, wire `getFollows: socialCache.getFollows` into identity, wire `router: socialCache.decorate(baseRouter)` into outbox, then call the warm refresh without adding a service key. Keep current relay/identity domain guards and service names.

**Creation-time background warm pattern** (lines 496-513):
```ts
const uploadRuntime = getSimulation().upload.mode === 'blossom'
  ? createPajaUploadRuntime({ /* injected host dependencies */ })
  : undefined;
void uploadRuntime?.refreshIdentity();
```
Use the same non-blocking construction-time warm for the social cache after it is composed. A background failure must remain inside cache state/provider behavior; it must not prevent Paja adapter creation.

---

### `packages/paja/src/browser-relay-runtime.ts` (relay utility, request-response + transform)

**Analog:** `packages/paja/src/browser-relay-runtime.ts`

**Bootstrap relay and safe fallback pattern** (lines 241-267):
```ts
async function getSignerRelayUrls(
  signerProvider: PajaSignerProvider | undefined,
  direction: 'read' | 'write',
): Promise<string[]> {
  const signer = signerProvider?.getSigner();
  if (!signer?.getRelays) return [];
  try {
    const relays = await signer.getRelays();
    return dedupeRelayUrls(Object.entries(relays).flatMap(([url, permissions]) => {
      if (direction === 'read' && permissions.read) return [url];
      if (direction === 'write' && permissions.write) return [url];
      return [];
    }));
  } catch {
    return [];
  }
}

async function getBootstrapRelayUrls(...) {
  return dedupeRelayUrls([
    ...getPajaRelayUrls(getSimulation()),
    ...await getSignerRelayUrls(signerProvider, 'read'),
  ]);
}
```
Keep contact-list acquisition host-owned and use the established bootstrap-relay helper. If the helper must be exposed to the new private module, export the narrow helper rather than duplicating signer relay handling.

**Existing lazy identity-provider seam to replace, not extend** (lines 334-355):
```ts
export function createPajaIdentityProviders(...) {
  const followsCache = new Map<string, string[]>();
  return {
    async getFollows(pubkey) {
      if (!/^[0-9a-fA-F]{64}$/.test(pubkey)) return [];
      const cached = followsCache.get(pubkey);
      if (cached) return [...cached];
      const events = await backend.query(await getBootstrapRelayUrls(...), [{
        kinds: [PAJA_CONTACT_LIST_KIND], authors: [pubkey], limit: 1,
      }], PAJA_LIVE_QUERY_WAIT_MS);
      const follows = contactPubkeys(latestEvent(events, PAJA_CONTACT_LIST_KIND, pubkey));
      followsCache.set(pubkey, follows);
      return [...follows];
    },
  };
}
```
Do not make this raw, lazy, timestamp-only provider the Phase 102 implementation. Move/reuse only the host relay seam and contact-list constants needed by `browser-social-cache.ts`; let the new cache own verification, NIP-01 tie-breaking, account snapshots, prefetch, and decoration.

**Existing filter helpers** (lines 26-47):
```ts
function matchesFilter(event: NostrEvent, filter: NostrFilter): boolean { /* ids/authors/kinds/time/tag checks */ }
export function matchesAnyFilter(event: NostrEvent, filters: NostrFilter[]): boolean {
  return filters.length === 0 || filters.some((filter) => matchesFilter(event, filter));
}
```
The cache must apply matching semantics before merging cached kind-0 records. Export/refactor only as needed for Paja-private reuse; preserve currently tested memory/backend behavior.

---

### `packages/paja/src/browser-host.test.ts` (test / static wiring guard, request-response)

**Analog:** `packages/paja/src/browser-host.test.ts` lines 81-97.

```ts
it('keeps Paja wired to real relay, outbox, and identity bootstrap paths', () => {
  const adapterSource = readFileSync(new URL('./browser-adapter.ts', import.meta.url), 'utf8');
  const relaySource = readFileSync(new URL('./browser-relay-runtime.ts', import.meta.url), 'utf8');

  expect(adapterSource).toContain('createRelayPoolOutboxRouter');
  expect(adapterSource).toContain('createPajaRelayListLoader(backend, getSimulation, signerProvider)');
  expect(relaySource).toContain('createNip65Registry');
  expect(relaySource).toContain('export const PAJA_CONTACT_LIST_KIND = 3;');
  expect(relaySource).toContain('export function createPajaIdentityProviders(');
  expect(relaySource).toContain('backend.query(await getBootstrapRelayUrls(getSimulation, signerProvider), [{');
});
```
Update this guard to assert the new adapter imports/composes the private social cache and still builds its normal router/identity/outbox services. Keep assertions broad enough to protect the required host boundaries, not private implementation spelling. Assert the absence of a `paja.social` service/API if a source guard is useful.

---

### `packages/services/src/identity-service.test.ts` (test, request-response)

**Analog:** `packages/services/src/identity-service.test.ts`

**Service-message collector pattern** (lines 17-44, 173-199):
```ts
const WINDOW_ID = 'win-test-1';

function makeIdentityMessage(type: string, fields: Record<string, unknown> = {}): NappletMessage {
  return { type, id: 'corr-1', ...fields } as NappletMessage;
}

const service = createIdentityService({
  getSigner: () => signer,
  getFollows: async (pubkey) => {
    seen.push(pubkey);
    return followedPubkeys;
  },
});
const sent: NappletMessage[] = [];
const send = (msg: NappletMessage): void => { sent.push(msg); };

service.handleMessage(WINDOW_ID, makeIdentityMessage('identity.getFollows', { id: 'corr-follows' }), send);
await nextTick();
expect(seen).toEqual([MOCK_SIGNER_PUBKEY]);
expect(sent[0].type).toBe('identity.getFollows.result');
```
Add the request-snapshot regression here only if the existing generic service needs proof: use a deferred `getPublicKey()` for account A, change the signer source to B before resolution, then resolve A and assert the provider was invoked with A and the result retained the original correlation ID. This proves the standard service seam; social-cache stale-write races belong in `browser-social-cache.test.ts`.

**Provider-error envelope pattern** (lines 201-222):
```ts
getFollows: async () => { throw new Error('contacts unavailable'); },
// ...
expect(sent[0].type).toBe('identity.getFollows.result');
expect((sent[0] as any).pubkeys).toEqual([]);
expect((sent[0] as any).error).toBe('contacts unavailable');
```
Retain the result-envelope error shape for a failed relay-backed follows provider; do not turn it into a Paja-specific message or change signed-out `getPublicKey` semantics.

---

### `packages/services/src/outbox-service.test.ts` (test, request-response)

**Analog:** `packages/services/src/outbox-service.test.ts`

**Mock `OutboxRouter` pattern** (lines 38-64):
```ts
interface MockRouter extends OutboxRouter {
  lastSink: OutboxSubscriptionSink | null;
  subClose: ReturnType<typeof vi.fn>;
}

function mockRouter(overrides: Partial<OutboxRouter> = {}): MockRouter {
  const subClose = vi.fn();
  const router: MockRouter = {
    lastSink: null,
    subClose,
    query: vi.fn(async (): Promise<OutboxResult> => ({ events: [RESULT] })),
    subscribe: vi.fn((_filters, _options, sink): OutboxRouterSubscription => {
      router.lastSink = sink;
      return { close: subClose };
    }),
    // remaining required OutboxRouter operations are mocked
    ...overrides,
  };
  return router;
}
```
Use this only to preserve the service-level wire contract after a decorated Paja router is introduced. The cache merge behavior itself belongs in the Paja cache test, not in `@kehto/services`.

**Degraded query envelope assertion** (lines 171-182):
```ts
router.query = vi.fn(async () => ({ events: [], incomplete: true, error: 'relay timeout' }));
svc.handleMessage(WINDOW, {
  type: 'outbox.query',
  id: 'q2',
  filters: [{ authors: ['ab'] }],
  options: { authors: ['ab'], timeoutMs: 1000 },
} as NappletMessage, c.send);
await Promise.resolve();
expect(c.sent[0]).toMatchObject({
  type: 'outbox.query.result', id: 'q2', incomplete: true, error: 'relay timeout',
});
```
Do not modify this service simply to add cached events. Its existing forwarding is the contract that the Paja decorator must satisfy. If touched for a regression, retain this exact result forwarding and no cache-specific wire fields.

## Shared Patterns

### Standard identity envelope and request snapshot
**Source:** `packages/services/src/identity-service.ts` lines 67-93 and 289-303

```ts
async function getCurrentPubkey(options: IdentityServiceOptions): Promise<string> {
  const currentSigner = options.getSigner();
  if (!currentSigner?.getPublicKey) return '';
  try {
    return (await currentSigner.getPublicKey()) ?? '';
  } catch {
    return '';
  }
}

Promise.resolve(getCurrentPubkey(options))
  .then((pubkey) => buildResult(pubkey))
  .then((result) => send(result))
  .catch((err: unknown) => sendProviderError(send, fallbackResult, errorFallback, err));
```

**Apply to:** identity provider wiring and identity-service regression tests. The cache provider must use its received `pubkey`, never retrieve mutable signer state after an `await`.

### Standard OUTBOX wire forwarding
**Source:** `packages/services/src/outbox-service.ts` lines 358-380

```ts
void router
  .query(filters, sanitizeQueryOptions(m.options))
  .then((result) =>
    send({
      type: 'outbox.query.result',
      id,
      events: result.events,
      ...(result.incomplete === undefined ? {} : { incomplete: result.incomplete }),
      ...(result.error === undefined ? {} : { error: result.error }),
    } as NappletMessage),
  )
  .catch((err) =>
    send({ type: 'outbox.query.result', id, events: [], error: toErrorMessage(err) } as NappletMessage),
  );
```

**Apply to:** cache decorator behavior and its tests. Preserve the base query's `incomplete` and `error`; never add cache metadata to the standard result.

### Host-owned validation and deduplication
**Source:** `packages/services/src/relay-pool-outbox-router.ts` lines 226-254

```ts
if (collector.admitted.has(event.id)) return;
collector.admitted.add(event.id);
void ctx.verify(event).then((ok) => {
  if (!isOpen()) return;
  if (!ok) {
    collector.relayMap.delete(event.id);
    return;
  }
  collector.seen.set(event.id, event);
  sink.event(collectedEventResult(collector, event));
});
```

**Apply to:** cache warm and merge. Warm profiles through the existing base router so entries are already `RelayEventResult`s. Verify kind-3 bootstrap events before deriving follows; merge cached/base values by `event.id` without replacing the base router's relay policy or failure semantics.

### Existing ACL gates remain unchanged
**Source:** `packages/acl/src/resolve.ts` lines 85-94 and 244-267

```ts
function identityMap(action: string): CapabilityResolution {
  if (action === 'getPublicKey' || action === 'getRelays') {
    return { senderCap: null, recipientCap: null };
  }
  return { senderCap: 'identity:read', recipientCap: null };
}

function outboxMap(action: string): CapabilityResolution {
  if (action === 'event' || action === 'closed' || action.endsWith('.result') || action.endsWith('.error')) {
    return { senderCap: null, recipientCap: 'outbox:read' };
  }
  if (action === 'publish') return { senderCap: 'outbox:write', recipientCap: null };
  return { senderCap: 'outbox:read', recipientCap: null };
}
```

**Apply to:** all Phase 102 composition. Do not change `resolve.ts` or bypass it; `identity.getFollows` remains `identity:read`, and both query request/result delivery remain `outbox:read`.

## No Analog Found

None. The closest structural analog is Paja's private, generation-guarded upload runtime; the closest protocol analogs are the existing injected identity provider and outbox router. Social-cache-specific selection/merge logic is new, but it can be implemented entirely by combining those patterns.

## Metadata

**Graphify query used:** existing `graphify-out/graph.json`; expanded graph-vocabulary tokens: `paja`, `browser`, `adapter`, `identity`, `outbox`, `cache`, `relay`, `router`, `service`, `follows`. It identified the Paja adapter, relay runtime, identity/outbox services, relay-pool router, and browser host guard as the relevant code cluster.

**Analog search scope:** `packages/paja/src`, `packages/services/src`, `packages/acl/src`, `graphify-out/graph.json`  
**Files scanned/read:** 11 source/test analogs plus planning inputs  
**Pattern extraction date:** 2026-07-24
