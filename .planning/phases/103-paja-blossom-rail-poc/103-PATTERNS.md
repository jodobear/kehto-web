# Phase 103: Paja Blossom Rail PoC - Pattern Map

**Mapped:** 2026-07-29  
**Files analyzed:** 19 planned repository artifacts plus one external upstream follow-up  
**Analogs found:** 19 / 19 repository artifacts

## Scope, dependency, and authority checkpoint

- This is a hardening pass over the existing generic `upload` and `resource` NAP surfaces. Do not add `window.napplet.blossom`, an iframe network path, an iframe signer/key path, a Paja-specific wire message, or a local per-replica result field.
- The source baseline remains Phase 102 PR #217 / commit `81185b45c99544fbb63271da4bcfc69334e759e1` (`fix(paja): close social hydration review gaps`). Before source work, refresh `upstream/main`; either wait for the PR to merge or explicitly stack the focused Phase 103 work on that SHA. The Phase 102 composition seam already instantiates `createPajaSocialCache`, calls its non-blocking `refreshActiveIdentity()`, and passes signer-change subscription through `browser-adapter.ts` lines 349-356 and 507-522. Preserve that lifecycle instead of regressing it while adding upload abort/generation logic.
- Protocol authority is the pinned draft set, not current `napplet/naps` master: NAP-UPLOAD `a7cc17463cbf5d9cb87884b31071bc4fc826034c`, NAP-BLOSSOM `ca1d7ba594e6790785dc770227085d8648d39631`, and NAP-RESOURCE `fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1`. Installed `@napplet/nap@0.28.0` has no per-replica-outcome field. Record pinned-draft alignment and the upstream/master drift; do not claim current-master conformance.
- Graphify `graphify-out/graph.json` was queried for the Paja/upload/resource cluster, then all assignments below were verified against current source. Its relationships are hints only; live files are authoritative.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/services/src/http-uploader.ts` | service / transport | file-I/O, request-response | same file `uploadBlossom()` | exact |
| `packages/services/src/http-uploader.test.ts` | test | file-I/O, request-response | same file Blossom test block | exact |
| `packages/services/src/upload-service.ts` | service / protocol controller | request-response, event-driven | same file `handleUpload()` / teardown | exact |
| `packages/services/src/upload-service.test.ts` | test | request-response, event-driven | same file lifecycle/status tests | exact |
| `packages/services/src/resource-service.ts` | service / authorization middleware | file-I/O, request-response | same file request tracking and grants bridge | exact |
| `packages/services/src/resource-service.test.ts` | test | file-I/O, request-response | same file cancellation/grant tests | exact |
| `packages/services/src/index.ts` | config / public barrel | transform | same file resource/upload export blocks | exact |
| `packages/paja/src/browser-upload.ts` | provider / orchestration service | file-I/O, request-response, event-driven | same file identity generation + injected uploader | exact |
| `packages/paja/src/browser-upload.test.ts` | test | file-I/O, request-response, event-driven | same file host-injected upload runtime tests | exact |
| `packages/paja/src/browser-adapter.ts` | provider / composition root | request-response, event-driven | same file `createDevServices()` and `createPajaAdapter()` | exact |
| `packages/paja/src/browser-host.ts` | controller / host consent UI | event-driven | same file `confirmPajaRequest()` / teardown | exact |
| `packages/paja/src/browser-host.test.ts` | test / static wiring guard | request-response | Phase 102 static wiring guard in same file | exact |
| `packages/paja/src/simulation.ts` | config / policy normalization | transform | same file upload normalization | exact |
| `packages/paja/src/browser-upload.test.ts` | test | transform, request-response | same file policy-before-egress tests | exact |
| `packages/runtime/src/upload-dispatch.test.ts` | test / ACL boundary | request-response | same file upload ACL dispatch test | exact |
| `tests/e2e/paja-single-window.spec.ts` | browser E2E / fixture | file-I/O, request-response, event-driven | same file Blossom fixture and standard-envelope tracer | exact |
| `packages/paja/README.md` | documentation | transform | same file NAP-UPLOAD section | exact |
| `docs/packages/paja.md` | documentation | transform | same file NAP-UPLOAD section and manifest convention | exact |
| `docs/how-tos/paja-local-authoring.md` | documentation | transform | same file real Blossom instructions | exact |
| `.changeset/<phase-103-paja>.md` | release config | batch | `.changeset/paja-standard-nap-social-cache.md` | exact |
| `napplet/naps` PR #33 comment or PR | external protocol proposal | request-response | no repository-file analog | no local analog |

`packages/paja/src/browser-upload.test.ts` appears twice above because it carries both runtime orchestration and simulation-policy normalization proof; keep the assertions in the one existing test file rather than creating parallel fixture infrastructure.

## Pattern Assignments

### `packages/services/src/http-uploader.ts` (transport service, file-I/O + request-response)

**Analog:** `packages/services/src/http-uploader.ts`

**Imports/options-as-host-bridge pattern** (lines 35-44, 70-84):
```ts
import type { EventTemplate, NostrEvent } from '@napplet/core';
import type {
  NostrTag, UploadDimensions, UploadRail, UploadRequest,
  UploadResult, Uploader, UploaderContext,
} from './upload-service.js';

export interface HttpUploaderOptions {
  rails: HttpUploaderRails;
  defaultRail?: UploadRail;
  signEvent: SignEvent;
  fetch?: typeof fetch;
  digestSha256?: (bytes: Uint8Array) => Promise<string>;
  now?: () => number;
}
```
Retain injected `fetch`, signer, digest, and clock. Add any stored-byte verification as an injected host-policy seam rather than granting the generic services package a browser or Paja policy dependency.

**One-server primitive and cancellation registration** (lines 108-145):
```ts
const controller = new AbortController();
inFlight.set(ctx.uploadId, controller);
try {
  const bytes = await toBytes(request.data);
  sha256 = await digest(bytes);
  if (controller.signal.aborted) return cancelled(ctx.uploadId, rail, sha256);
  return rail === 'nip96'
    ? await uploadNip96(...)
    : await uploadBlossom(...);
} catch (err) {
  if (controller.signal.aborted) return cancelled(ctx.uploadId, rail, sha256);
  return failed(ctx.uploadId, rail, toErrorMessage(err), sha256);
} finally {
  inFlight.delete(ctx.uploadId);
}
```
Keep this module a correct single-attempt primitive. Paja owns the configured sequential replica loop, consent cache, retry decision, and result ordering. Preserve controller creation before any await so teardown can cancel a hashing operation.

**Existing Blossom serialization seam to harden** (lines 243-307):
```ts
const auth = await signEvent({
  kind: KIND_BLOSSOM_AUTH,
  created_at: nowS(),
  content: `Upload ${request.filename ?? 'file'}`,
  tags: [['t', 'upload'], ['x', sha256], ['expiration', String(nowS() + BLOSSOM_AUTH_TTL_S)]],
});
const endpoint = `${trimTrailingSlash(server)}/upload`;
const headers: Record<string, string> = { Authorization: nostrAuthHeader(auth) };
if (request.mimeType) headers['Content-Type'] = request.mimeType;
const res = await fetchFn(endpoint, { method: 'PUT', headers, body: bytesToArrayBuffer(bytes), signal: controller.signal });
```
Extend this exact seam with BUD-11 lowercase `server` tag, `X-SHA-256`, `Content-Length`, unpadded base64url encoding, required descriptor `type`/`uploaded`, and a verification callback/result boundary. Do not reuse the generic `nostrAuthHeader()` for the stricter Blossom form if NIP-96 must preserve its current serialization.

**Result construction pattern** (lines 291-307): build `nip94` only from verified values. `url` and `fallbackUrls` are standard NAP-UPLOAD successes; host-only replica diagnostics must not be injected into this result.

**Tests:** expand `packages/services/src/http-uploader.test.ts` lines 161-328. The `ctx()` helper (lines 19-21), injected signer/fetch (lines 23-33), descriptor matrix (lines 220-247), abortable deferred fetch (lines 275-298), and hash-yield teardown regression (lines 300-328) are the concrete fixture patterns. Add decoded base64url/header/tag checks, required descriptor fields, exact stored-byte proof failure, and no retry for malformed/proof failures.

---

### `packages/services/src/upload-service.ts` (generic protocol service, request-response + event-driven)

**Analog:** `packages/services/src/upload-service.ts`

**Per-window correlated state pattern** (lines 268-303):
```ts
const uploadId = generateId();
const key = `${windowId}:${uploadId}`;
entries.set(key, { uploadId });
const ctx: UploaderContext = {
  uploadId,
  windowId,
  onStatus: (status) => {
    const stamped = { ...status, uploadId, updatedAt: status.updatedAt || now() };
    const entry = entries.get(key);
    if (entry) entry.status = stamped;
    send({ type: 'upload.status.changed', status: stamped } as NappletMessage);
  },
};
```
Strengthen this existing ownership boundary: allow exactly one `uploading` push and exactly one terminal snapshot/result; gate every post-await send on a still-live entry/generation. After `onWindowDestroyed`, no late status/result may reach the destroyed recipient.

**Status lookup pattern** (lines 306-337): first return the tracked window-scoped snapshot, then use optional `uploader.status`, otherwise emit `unknown upload`. Retain this public wire behavior and current fields; terminal stable codes belong in `result.error`, not new fields.

**Teardown pattern** (lines 358-365):
```ts
for (const [key, entry] of entries) {
  if (key.startsWith(prefix)) {
    uploader.cancel?.(entry.uploadId);
    entries.delete(key);
  }
}
```
Use this as the service-level cancellation fence; the Paja uploader must make its one operation controller abort all current/future replica work.

**Tests:** copy `packages/services/src/upload-service.test.ts` lines 47-67 (mock/collector), 193-204 (status push assertion), 207-243 (latest status), and 246-264 (teardown cleanup). Add status sequence tests for `uploading` then one terminal state, truthful status after failed/cancelled operation, and no terminal envelope after teardown.

---

### `packages/services/src/resource-service.ts` (resource authorization service, file-I/O + request-response)

**Analog:** `packages/services/src/resource-service.ts`

**Required host-policy bridge** (lines 86-148 and 213-225):
```ts
fetch(url, init): Promise<Response>;
isOriginGranted(origin, grants): boolean;
getConnectGrants(dTag, aggregateHash): readonly string[];
resolveIdentity(windowId): { dTag: string; aggregateHash: string } | null;
```
The factory deliberately rejects missing policy components. Extend it backward-compatibly with a narrow exact URL plus owning-window/session grant controller/seam; do not replace it with Paja-only direct fetch or `['*']` origin access.

**Authorization-before-fetch pattern** (lines 376-425):
```ts
const parsedUrl = parseResourceUrl(url);
if (!parsedUrl) return resourceInvalidRequest(url, `invalid URL: ${url}`);
const grants = options.getConnectGrants(identity.dTag, identity.aggregateHash);
if (!options.isOriginGranted(parsedUrl.origin, grants)) return { ok: false, ... };
const response = await options.fetch(url, { method: init?.method, headers: ..., signal });
```
Adapt this check to admit an exact, verified URL only for its requesting window/session while retaining the host-owned fetch security policy. A passed exact grant does not bypass the production fetch implementation's HTTPS, DNS-time SSRF, redirect, size, and MIME-sniff obligations.

**Cancellation/late-result seam to repair** (lines 429-464 and 520-538):
```ts
trackRequest(state, requestId, windowId, controller);
try {
  const item = await fetchResourceItem(..., controller.signal);
  if (!item.ok) { sendResourceError(...); return; }
  send({ type: 'resource.bytes.result', id: requestId, requestId, blob: item.blob, mime: item.mime, ... });
} finally {
  untrackRequest(state, requestId);
}
```
After each await, verify the request remains tracked/live before sending. `resource.cancel` and `onWindowDestroyed` must suppress a late successful response, not merely abort the signal. Revoke exact upload-result grants in the same `onWindowDestroyed` path.

**Tests:** follow `packages/services/src/resource-service.test.ts` lines 34-68 for injected policy fixtures, lines 94-153 for deny-before-fetch/success assertions, lines 155-197 for deferred cancellation, and lines 244-283 for multi-request teardown. Wave 0 must add exact URL permitted only for the owning window, other URL/origin denial, teardown grant revocation, and a fetch that resolves despite abort producing no response envelope.

**Public exports:** if the grant controller/options are public, copy `packages/services/src/index.ts` lines 97-105 and add its type re-export beside the resource exports. Every exported public API requires JSDoc and must satisfy `pnpm docs:check`.

---

### `packages/paja/src/browser-upload.ts` (Paja-private replica orchestrator, file-I/O + request-response + event-driven)

**Analog:** `packages/paja/src/browser-upload.ts`

**Dependency injection and identity snapshot pattern** (lines 25-50, 58-63):
```ts
export interface PajaUploadRuntimeOptions {
  readonly getSimulation: () => PajaSimulation;
  readonly getSigner: () => Signer | null;
  readonly getProviderPubkey: () => string | null;
  readonly confirmRequest: (request: PajaConfirmationRequest) => boolean;
  readonly getNappletIdentity: (windowId: string) => NappletIdentity;
  readonly fetch?: typeof fetch;
  readonly subscribeSignerChange?: (listener: () => void) => () => void;
}
let generation = 0;
let identity: IdentitySnapshot | null = null;
const activeUploads = new Map<string, Uploader>();
```
Keep host authority injected and private. Add the exact-grant callback/controller, host-safe stored-GET/byte-sniff policy seam, and host diagnostic callback here; none belong in the napplet API.

**Generation-safe identity refresh** (lines 64-110):
```ts
const currentGeneration = ++generation;
identity = null;
discovered = null;
// ... await signer / relay work ...
if (currentGeneration !== generation) return;
identity = { pubkey: signerPubkey, signer };
// ... await discovery ...
if (currentGeneration !== generation || identity?.pubkey !== signerPubkey) return;
```
Use this exact stale-async fence for a whole replica operation: capture an operation generation and signer snapshot before consent; after every await, stop/abort and return terminal `cancelled` with the identity/teardown stable code if identity changes. Drop accumulated successful URLs in that case, while retaining only host diagnostics about possible durable copies.

**Current policy-before-egress ordering** (lines 113-145): rail → byte size → request MIME → identity → server → consent. Preserve the ordering but make policy defaults fail safe, use configured servers only, and run one tuple-keyed consent decision before any hash authorization or egress. BUD-03 may remain a configuration aid but `effectiveServers()` (lines 207-214) must no longer make discovery an implicit upload target.

**Existing delegate composition seam** (lines 147-171): construct a one-server `createHttpUploader`, bind `signEvent` to the captured identity, put it in `activeUploads`, `await delegate.upload`, validate its returned URL, and delete it in `finally`. Replace the first-server delegate flow with one operation controller covering ordered configured replicas. Retry only transport/HTTP-5xx once on the same server; continue on local descriptor/verification/network/server failure; do not add a timeout; stop on cancellation, teardown, identity/signature change, or policy denial.

**Availability versus support:** `uploadInfo()` lines 175-187 already returns a `blossom` rail with `enabled` determined by current runtime readiness. Maintain that truthful availability result, while `browser-adapter.ts` supplies the upload host hook so shell capability advertisement remains a support declaration. Do not remove upload capability merely because a signer/configuration is currently absent.

**Tests:** expand `packages/paja/src/browser-upload.test.ts`: use its real SHA helper at lines 10-14, injected signer/event helpers at lines 16-45, configured server fixture at lines 48-109, signer-change fixture at lines 204-234, and pre-egress policy test at lines 285-319. Required vectors are the binary `[0, 1, 2, 3, 254, 255]`, ordered multi-server successes (`url`, then `fallbackUrls`), 503-once retry, malformed/proof-failing replica continuation, configured-empty unavailable/no egress, tuple consent reuse/invalidation, identity-change abort, and cancellation after a verified first copy with no napplet success URLs.

---

### `packages/paja/src/browser-adapter.ts` and `packages/paja/src/browser-host.ts` (composition root and consent controller)

**Analogs:** same files.

**Compose services once and keep host policy at the boundary** (`browser-adapter.ts` lines 322-365, 415-422):
```ts
const services: Record<string, ServiceHandler> = {
  keys: createKeysService(),
  resource: createResourceService({
    fetch: (url, init) => fetch(url, init),
    isOriginGranted: () => true,
    getConnectGrants: () => ['*'],
    resolveIdentity: () => ({ dTag: 'dev-target', aggregateHash: 'paja' }),
  }),
};
// ...
services.upload = createUploadService({
  uploader: uploadRuntime.uploader,
  uploadInfo: uploadRuntime.uploadInfo as UploadInfoProvider,
});
```
Replace the wildcard development resource wiring for the Blossom path with a single narrow grant store/controller shared by the resource service and upload runtime. Its identity resolver must use the real requesting `windowId`, not a universal identity. Wire window teardown through the runtime's existing `destroyWindow()` lifecycle (runtime lines 379-387 invokes every service's `onWindowDestroyed`).

**Host consent UI pattern** (`browser-host.ts` lines 255-294): it builds the prompt, calls `window.confirm`, and records a Paja-only diagnostic in the host message log. Change the upload variant to disclose ordered target servers, replica count, MIME, file size, public/durable storage, and worst-case bytes. Keep only the boolean consent result across the runtime boundary; replica diagnostics and partial-copy warnings remain host-only.

**Teardown/navigation pattern** (`browser-host.ts` lines 297-308 and 341-375): `bridge.runtime.destroyWindow(windowId)` occurs before session/origin unregister. Keep that order so upload/resource service cleanup and grant revocation execute before transport references disappear.

**Static composition guard:** use the Phase 102 pattern in `packages/paja/src/browser-host.test.ts` (documented in `102-PATTERNS.md` lines 283-300): read source with `readFileSync`, assert the Paja adapter composes the real runtime services, and assert prohibited custom surfaces are absent. Add focused source guard coverage for the narrow grant bridge and absence of `blossom` namespace/direct credential surface only if behavioral tests cannot make the boundary visible.

---

### `packages/paja/src/simulation.ts` (policy config transform)

**Analog:** `packages/paja/src/simulation.ts` lines 277-343 and 368-413.

```ts
const uploadServers = normalizeUploadServers(raw?.upload?.servers ?? []);
const maxBytes = raw?.upload?.maxBytes;
if (maxBytes !== undefined && (!Number.isSafeInteger(maxBytes) || maxBytes <= 0)) {
  throw new PajaSimulationError('Invalid simulation: upload.maxBytes must be a positive safe integer.');
}
const mimeTypes = normalizeMimeTypes(raw?.upload?.mimeTypes);
```
Add conservative default max bytes and MIME allowlist here so Paja policy is normalized once and every upload path sees it. Keep explicit host configuration authoritative; normalize ordered configured URLs without credentials/query/fragments and retain the loopback HTTP development exception only for configured server endpoints. Do not treat BUD-03 metadata as authorization to widen limits or add targets.

---

### Runtime, shell, and browser boundary regressions

**ACL dispatch analog:** `packages/runtime/src/upload-dispatch.test.ts` lines 38-112 registers the real domain name and asserts a blocked request produces `upload.upload.error` without reaching the service. Keep `upload` registration unchanged (`packages/runtime/src/runtime.ts` lines 140-161). Add the parallel denied `resource:fetch` regression using the established ACL/resource test setup; do not bypass `resource` dispatch to support an upload preview.

**Shell capability/API analog:** `packages/shell/src/shell-init.ts` lines 80-138 advertises `upload` when `hooks.upload` exists, while `packages/shell/src/napplet-namespace.ts` lines 791-824 and 942-955 expose only normal `resource` and `upload` methods. These are read-only API-boundary analogs unless an implementation change truly needs a regression. Preserve the distinction: capability means host support; `upload.info.enabled` and upload result errors tell current readiness. Do not add a Blossom namespace, low-level operation, or cancellation method.

**Browser E2E analog:** `tests/e2e/paja-single-window.spec.ts` lines 344-454 and 707-773. Extend the existing real opaque-iframe fixture instead of adding a mock-only test:
- retain `startBlossomServer()` as an in-process Node server but add persistent GET bytes, per-server scripted responses, request header capture, and explicit test-only loopback policy handling;
- assert decoded BUD-11 event, `X-SHA-256`, content length, and unpadded base64url authorization;
- send standard `upload.upload`, wait on `upload.upload.result`, then send standard `resource.bytes` via `sendFixtureMessage()` (lines 654-690) and compare returned bytes;
- prove ordered configured replicas, altered stored GET failure/no grant, denied consent before PUT, teardown cancellation after a verified replica, and no iframe `window.napplet.blossom`, `window.nostr`, authorization event, or credentials;
- retain `sandbox="allow-scripts"`/no `allow-same-origin` checks (lines 66-70). Browser changes require Playwright coverage.

---

### Documentation and release metadata

**Documentation analogs:** update the existing matching NAP-UPLOAD sections together:
- `packages/paja/README.md` lines 145-177;
- `docs/packages/paja.md` lines 248-284;
- `docs/how-tos/paja-local-authoring.md` lines 142-181.

Replace “first server only”/descriptor-only language with configured-only ordered sequential replicas, one tuple-scoped consent prompt, failed-replica continuation, stored-byte SHA-256/size/sniffed-MIME verification, standard URL/fallback URL semantics, exact requesting-window `resource.bytes` preview grants, cancellation honesty, and the pinned-draft/spec-gap statement. Preserve all existing opaque-origin CORS and safety text. State no current-master conformance and that per-server outcomes remain host diagnostics pending PR #33.

**Changeset pattern:** copy `.changeset/paja-standard-nap-social-cache.md` exactly: YAML frontmatter, quoted package key, then a concise imperative release description. Add at minimum `@kehto/paja`; add `@kehto/services` only if the exported resource grant or HTTP uploader contract changes shipped output. No changeset for tests/docs alone.

## Shared Patterns

### ACL and service lifecycle

**Sources:** `packages/runtime/src/runtime.ts` lines 379-387; `packages/services/src/upload-service.ts` lines 358-365; `packages/services/src/resource-service.ts` lines 520-538.

Apply to upload, resource grants, and Paja navigation: state is keyed by window, `destroyWindow()` calls each registered handler's `onWindowDestroyed`, controllers abort, state/grants are deleted, and late async results are suppressed. A partial stored replica after cancellation is a host diagnostic, never a terminal success result.

### Host-only authority boundary

**Sources:** `packages/paja/src/browser-upload.ts` lines 113-171; `packages/paja/src/browser-adapter.ts` lines 507-550; `packages/shell/src/napplet-namespace.ts` lines 942-955.

Paja retains server lists, consent, signer, BUD-11 events, HTTP, verification, and diagnostics. The iframe gets only `upload.info/upload/status/upload.upload` and `resource.bytes` through standard envelopes. Runtime ACL continues to guard `upload:write` and `resource:fetch`.

### Resource security policy

**Source:** `docs/policies/SHELL-RESOURCE-POLICY.md` lines 31-42, 67-90, 142-160, and 199-216.

The stored-URL verifier and later resource fetch must require public HTTPS in production, DNS-time private-address blocking and revalidation on redirects, byte sniffing rather than upstream `Content-Type`, scheme/size limits, and an allowlist. Loopback HTTP is a test/development adapter exception only; never weaken production policy to make E2E convenient.

### NAP fixture and transport tests

**Sources:** `packages/services/src/http-uploader.test.ts` lines 19-67; `packages/paja/src/browser-upload.test.ts` lines 10-45; `tests/e2e/paja-single-window.spec.ts` lines 392-452.

Use injected signer/fetch/clock/digest seams for unit tests and real binary/hash vectors. Use the current opaque iframe and Node Blossom fixture for browser proof. Do not use a live relay or public Blossom server in deterministic tests.

### Validation and contribution hygiene

Run focused feedback after every task:
```bash
corepack pnpm exec vitest run packages/services/src/http-uploader.test.ts packages/services/src/upload-service.test.ts packages/services/src/resource-service.test.ts packages/paja/src/browser-upload.test.ts packages/runtime/src/upload-dispatch.test.ts
```
Run browser proof after Paja/shell wiring:
```bash
CI=1 corepack pnpm exec playwright test tests/e2e/paja-single-window.spec.ts
```
Run release gates before ship:
```bash
corepack pnpm build && corepack pnpm type-check && corepack pnpm test:unit && corepack pnpm docs:check && CI=1 corepack pnpm exec playwright test
npx --no-install aislop scan -d
git diff --check
```
Keep the eventual upstream contribution limited to Phase 103 implementation, tests, docs, and changesets. Exclude `.planning/**`, Graphify output, Writer work, generated output, NIP-96 expansion, and unrelated cleanup.

## No Analog Found

| Artifact | Role | Data Flow | Reason / planner direction |
|---|---|---|---|
| Focused comment or PR on `napplet/naps` PR #33 | external protocol proposal | request-response | No local source analog. Use the pinned NAP-UPLOAD draft and installed type gap as evidence. Propose per-attempt replica outcomes/structured codes without shipping them in Kehto's current wire fields. Read `/workspace/projects/napplets/naps/AGENTS.md` before any upstream work. |
| Per-window exact verified-URL grant controller, if factored into a new file | authorization utility | request-response, event-driven | No existing narrow URL-grant implementation exists. Prefer a backward-compatible seam in `resource-service.ts`; if extracted, use its `ResourceServiceOptions`/state-map pattern and re-export only intentionally public types. |

## Metadata

**Graphify query used:** `graphify-out/graph.json`, queried for Paja browser upload/adapter, services upload/resource, runtime, shell, and E2E nodes; live-file reads above supersede graph data.  
**Analog search scope:** `packages/paja/src`, `packages/services/src`, `packages/runtime/src`, `packages/shell/src`, `tests/e2e`, `docs`, `.changeset`, Phase 102 planning artifacts.  
**Files scanned/read:** 22 source/test/doc/plan analogs plus CONTEXT.md, RESEARCH.md, VALIDATION.md, CLAUDE.md, and Graphify hints.  
**Pattern extraction date:** 2026-07-29
