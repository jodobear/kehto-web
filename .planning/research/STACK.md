# Stack Research

**Domain:** Kehto v1.29 shell-mediated social profile and Blossom upload vertical slice
**Researched:** 2026-07-24
**Confidence:** MEDIUM

## Recommendation

**Add no runtime, UI-framework, networking, upload, or cryptography dependency.** The vertical slice is an integration change on the repository's already-pinned NAP stack: extend existing host wiring in `@kehto/paja` and the playground, evolve the existing feed napplet, and add a built SDK fixture for the Paja E2E. The only client-side media lifecycle tools required are built-in `Blob`, `URL.createObjectURL()`, and `URL.revokeObjectURL()`.

The existing exact `@napplet` graph is coherent and must remain pinned rather than upgraded: both `@napplet/sdk@0.24.4` and `@napplet/shim@0.26.8` resolve against `@napplet/core@0.28.0` and `@napplet/nap@0.28.0`. The root lockfile contains one matching resolution for each package, and `tests/unit/sdk-migration-guard.test.ts` enforces these exact fixture pins. Official npm-registry metadata matched the lockfile integrity/version data; the research confidence classifier labels the npm provider LOW, so that external confirmation is corroborative rather than the sole basis for the recommendation.

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Existing Kehto workspace services and Paja | `@kehto/services@0.16.5`, `@kehto/paja@0.8.1` | Shell-owned identity, outbox, resource, upload, signer, policy, and transport integration | These packages already expose the required factory seams. Extend their host wiring; creating another social client, HTTP uploader, or relay client would duplicate policy-bearing code and weaken the shell boundary. |
| Napplet SDK fixture graph | `@napplet/core@0.28.0`, `@napplet/nap@0.28.0`, `@napplet/sdk@0.24.4`, `@napplet/shim@0.26.8` | A real browser napplet that uses injected NAP domains inside Paja's sandbox | This is the graph already used by `feed` and existing Layer-A fixtures. `sdk` and `shim` both resolve to the same core/nap 0.28 contract, avoiding a duplicate protocol instance or an untested upgrade. |
| Native browser binary-media APIs | Browser built-ins | Convert shell-returned profile bytes to renderable local URLs and clean them up | `Blob` plus `URL.createObjectURL()` / `URL.revokeObjectURL()` satisfies the image/banner requirement without React state, an image loader, a fetch client, or a URL-management package. The resource service already uses host-side `AbortController` for cancellation. |
| Existing Paja Blossom runtime | `@kehto/paja@0.8.1` + existing `@kehto/services` HTTP uploader | Host-selected server, NIP-98-style authorization signing, consent, byte transfer, and result validation for `upload.upload` | `createPajaUploadRuntime` already requires `rail: 'blossom'`, refreshes signer state, delegates to `createHttpUploader`, and rejects an unpermitted result URL. The napplet needs only its existing mediated `upload.upload` surface. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `nostr-tools` | resolved `2.23.3` | Host-side signer/event/relay primitives used by Paja, services, and the Vite plugin | Keep it host-side. Do not import it into the social napplet: the napplet must query through `outbox` and upload through `upload`, never create a `SimplePool`, fetch relays, or access signing keys. |
| `@napplet/vite-plugin` | `0.11.2` | Builds a signed NIP-5A artifact for the SDK fixture | Use the existing fixture pattern (`vite build`, `nip5aManifest`) for the new Paja social fixture. It has an npm peer requirement of Vite `>=5.0.0`; the workspace resolves Vite `6.4.2`. |
| Vite | resolved `6.4.2` | Builds the feed and test-fixture browser artifacts | Retain the existing Vite setup. Package manifests state `^6.3.0`, while the root override/lockfile resolves `6.4.2`; do not add a second fixture bundler. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turborepo `2.9.14` | Builds workspace packages and browser artifacts | `pnpm build` runs the workspace `build` task. `pnpm-workspace.yaml` includes `tests/fixtures/napplets/*`, and `turbo.json` records their `dist/**` output in `build:napplets`; put the real Paja fixture there so `pnpm test:e2e`'s `test:build` prerequisite produces it. |
| Vitest `4.1.2` | Locks unit-level service/wiring and lifecycle behavior | Add focused tests for follows sourcing, one freshest kind-0 selection per author, incomplete-result retention, `identity.changed` reset/reload, resource URL cleanup, and host policy inputs. |
| Playwright `1.54.0` | Drives the real Paja browser host and sandboxed iframe | Extend `tests/e2e/paja-single-window.spec.ts` or add a focused Paja social spec. Drive login → follows → profiles → proxied media → Blossom upload against a controlled relay/Blossom server; assert the iframe remains `sandbox="allow-scripts"` without `allow-same-origin`. |

## Required Integration Changes (No New Packages)

| Surface | Change required for the slice | Stack consequence |
|---------|-------------------------------|-------------------|
| `packages/paja/src/browser-adapter.ts` | Keep the existing registered `identity`, `outbox`, `resource`, and `upload` services; use the existing Paja identity providers and outbox router during the fixture flow. | Wiring/test work only. `createDevServices()` already constructs all four required service families. |
| `packages/paja/src/browser-relay-runtime.ts` | Reuse `createPajaIdentityProviders().getFollows`, which queries the newest kind-3 contact list through the Paja relay backend. | No relay package or Paja service API addition is needed for follows. |
| Paja identity lifecycle | Add host-to-iframe `identity.changed` propagation when the Paja signer changes, and test login, identity replacement, and logout. A repository search found this event in playground `shell-host.ts`, but not in Paja source/tests. | This is the principal missing runtime integration, not a dependency gap. The feed must cancel/ignore stale work, clear on `pubkey: ''`, then re-read follows and profiles. |
| `apps/playground/src/demo-hooks.ts` | Supply the existing `createIdentityService` `getFollows` provider from the playground relay-backed state, rather than relying on its intentional empty fallback. | Existing service extension point; no new identity SDK. |
| `apps/playground/napplets/feed` | Replace the current direct remote `img.src = profile.picture` behavior with `resource.bytes` for HTTPS profile picture/banner URLs. Retain an active object URL per rendered asset, revoke the preceding URL before replacement and on logout/pagehide, and show fallback UI on resource failure. | Use native `Blob`/`URL`; do not add an image/network dependency. Profile-event reduction stays napplet-side because the outbox result makes no newest-per-author guarantee. |
| Resource policy | Configure the playground's connect/resource grants for the selected HTTPS media origins; preserve the shell-owned `fetch` and grant enforcement. For Paja's dev adapter, do not let the current permissive development resource policy become a production pattern. | The host, not the napplet, remains the network authority. `resource.cancel` and the service's existing `AbortController` handling are the cancellation rail. |
| `tests/fixtures/napplets/*` + Paja E2E | Add a purpose-built, built SDK social fixture alongside existing workspace fixtures, with the exact SDK/shim/nap/plugin pins. Serve its built artifact to Paja in the test rather than using only the current raw-HTML Paja target helper. | No build-system dependency addition: the fixture workspace is already included in `pnpm build` / `test:build`. |
| Blossom upload | Call the current `upload.upload` request with `request.rail: 'blossom'`; accept the HTTPS result URL and read it back only through `resource.bytes`. | Keep content-addressed `blossom:sha256` reads and low-level NAP-BLOSSOM operations deferred as explicitly scoped. |

## Installation

```bash
# No package installation or version upgrade is required for this milestone.
# Keep the fixture dependencies exactly pinned to the existing protocol graph.

# Build the SDK fixture and all host artifacts before browser E2E.
pnpm build
pnpm test:e2e
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Existing `outbox.query` through the shell | Direct `nostr-tools` relay pool in the napplet | Never for this slice. A host application outside the napplet sandbox may use it to implement the injected Paja/playground router, but a napplet must not gain relay/network access. |
| Existing Paja/Kehto Blossom uploader | New Blossom SDK/client inside the napplet | Never for this slice. Paja already owns discovery, signer authorization, consent, network transfer, and result validation. |
| Native `Blob` + object URLs | React/Vue state, a media query/cache package, or an image loader | Only introduce a framework/cache later if the product deliberately adopts one across the project. This single-screen, framework-free napplet needs explicit browser lifecycle cleanup, not another abstraction. |
| HTTPS result URL via `resource.bytes` | `blossom:sha256` resolution | Use only in the deferred content-addressed Blossom milestone, after the low-level NAP-BLOSSOM surface and desired cache/integrity semantics are separately designed. |
| Workspace SDK fixture | Raw postMessage test target only | Raw envelopes remain useful for Paja transport tests, but they cannot satisfy the milestone's proof that a built SDK napplet works through the real Paja shell path. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| A napplet-visible `window.nostr`, signer injection, or direct signing SDK | Violates the existing read-only identity and shell-mediated signing boundary. | `identity.getPublicKey`, `identity.getFollows`, `outbox.query`, and `upload.upload`; signer access remains in Paja/host code. |
| Napplet-side `fetch`, WebSocket, relay client, or `nostr-tools` import | Bypasses resource grants, outbox routing, relay selection, signing/consent, and testable shell policy. | `resource.bytes` for HTTPS bytes and `outbox.query` for event retrieval. |
| Assigning a profile's remote `picture`/`banner` URL directly to an image element | Reintroduces direct napplet networking and loses shell policy enforcement. | Request bytes through `resource.bytes`, create a local object URL, and revoke it when replaced or cleared. |
| A new upload/Blossom package or custom authorization implementation | Duplicates the Paja upload runtime and risks moving server choice or key use into the napplet. | Existing `createPajaUploadRuntime` + `createUploadService` + `createHttpUploader`. |
| A package upgrade during the vertical slice | The milestone needs integration evidence, while the exact fixture graph is already lockfile-verified and guarded. Upgrading can introduce unrelated NAP compatibility drift. | Keep the pins; make a separately researched upgrade milestone if upstream APIs need to change. |

## Stack Patterns by Variant

**If the signed-in identity changes while the iframe remains alive:**
- Have the host publish `identity.changed` with the new pubkey, including `''` on logout.
- Increment a napplet-local generation/reset state, clear profiles and object URLs on empty identity, then re-run `getFollows` and kind-0 `outbox.query` for the new identity.
- Because outbox incompleteness is query-wide, retain successful reduced profiles while displaying degraded state; do not claim every followed author was resolved.

**If media is present in profile metadata:**
- Validate the profile URL as HTTPS, request it only through `resource.bytes`, and create the displayed media source from the returned bytes.
- Revoke the previous object URL before replacing it and revoke outstanding URLs on logout and `pagehide`. Ignore late responses from an obsolete identity generation; request `resource.cancel` when the NAP helper/surface exposes it for the outstanding request.

**If testing the Paja proof:**
- Build a fixture package using the same exact `@napplet/shim` / domain-SDK import pattern as existing fixtures.
- Serve the produced artifact to Paja, then assert visible fixture state and controlled relay/Blossom observations—not merely intercepted raw envelopes. Keep the iframe opaque-origin sandbox unchanged.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `@napplet/sdk@0.24.4` | `@napplet/core@0.28.0`, `@napplet/nap@0.28.0` | npm metadata and the repository lockfile both identify these exact SDK dependencies. |
| `@napplet/shim@0.26.8` | `@napplet/core@0.28.0`, `@napplet/nap@0.28.0` | Use one shim import in the browser fixture before domain SDK calls. |
| `@napplet/nap@0.28.0` | `@napplet/core@0.28.0` | The package declares `@napplet/core ^0.28.0`; the repository lock resolves 0.28.0. |
| `@napplet/vite-plugin@0.11.2` | Vite `>=5.0.0`; repository resolution `6.4.2` | Its npm metadata declares the Vite peer and `nostr-tools ^2.23.3`; the root override keeps the lock on the patched Vite 6.4 line. |
| `@kehto/paja@0.8.1` / `@kehto/services@0.16.5` | `@napplet/core`, `@napplet/nap` `>=0.23.0 <=0.28.x`; `nostr-tools >=2.23.3 <=2.x` | Current workspace peer ranges admit the pinned 0.28/2.23.3 graph; do not widen them for this slice. |

## Sources

### Repository evidence (HIGH for the checked checkout)

- [`apps/playground/napplets/feed/package.json`](../../apps/playground/napplets/feed/package.json) and [`pnpm-lock.yaml`](../../pnpm-lock.yaml) — exact fixture/runtime package pins and resolved Vite 6.4.2 graph.
- [`tests/unit/sdk-migration-guard.test.ts`](../../tests/unit/sdk-migration-guard.test.ts) — regression guard for exact active `@napplet` package graph and fixture manifests.
- [`packages/services/src/identity-service.ts`](../../packages/services/src/identity-service.ts), [`outbox-service.ts`](../../packages/services/src/outbox-service.ts), [`resource-service.ts`](../../packages/services/src/resource-service.ts), and [`upload-service.ts`](../../packages/services/src/upload-service.ts) — existing extension seams and shell-owned policy/transport boundaries.
- [`packages/paja/src/browser-adapter.ts`](../../packages/paja/src/browser-adapter.ts), [`browser-relay-runtime.ts`](../../packages/paja/src/browser-relay-runtime.ts), and [`browser-upload.ts`](../../packages/paja/src/browser-upload.ts) — current Paja service construction, follows provider, outbox router, and Blossom runtime.
- [`apps/playground/src/shell-host.ts`](../../apps/playground/src/shell-host.ts) and [`tests/e2e/paja-single-window.spec.ts`](../../tests/e2e/paja-single-window.spec.ts) — playground identity-change precedent and current Paja E2E baseline.
- [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) and [`turbo.json`](../../turbo.json) — fixture workspace/build inclusion.

### Official external evidence

- [npm registry: `@napplet/sdk@0.24.4`](https://registry.npmjs.org/@napplet/sdk/0.24.4), [shim `0.26.8`](https://registry.npmjs.org/@napplet/shim/0.26.8), [nap `0.28.0`](https://registry.npmjs.org/@napplet/nap/0.28.0), [core `0.28.0`](https://registry.npmjs.org/@napplet/core/0.28.0), and [Vite plugin `0.11.2`](https://registry.npmjs.org/@napplet/vite-plugin/0.11.2) — queried through `npm view` on 2026-07-24; versions/dependency edges match the lockfile. Source-classifier confidence: LOW.
- [MDN: `URL.createObjectURL()`](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static), [MDN: `URL.revokeObjectURL()`](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static), and [MDN: `AbortController.abort()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) — object-URL cleanup and cancellation behavior. Cross-checked source-classifier confidence: MEDIUM.

---
*Stack research for: Kehto v1.29 Social + Blossom Vertical Slice*
*Researched: 2026-07-24*
