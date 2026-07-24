# Pitfalls Research

**Domain:** Kehto v1.29 Social + Blossom vertical slice: live identity, outbox profile lookup, resource-mediated media, shell-mediated upload, and Paja browser proof
**Researched:** 2026-07-24
**Confidence:** MEDIUM — the pinned NAP sources were checked, but NAP-OUTBOX, NAP-RESOURCE, NAP-UPLOAD, and NAP-BLOSSOM remain drafts. Draft omissions are called out separately from confirmed implementation hazards.

## Critical Pitfalls

### Pitfall 1: An old identity request repopulates a newly signed-out or switched account

**What goes wrong:** `identity.changed` arrives with a new pubkey (or `""`), state is reset, and then a prior `getPublicKey`, `getFollows`, profile query, image fetch, or outbox response resolves and writes the old account back into the DOM. This leaks the previous identity's follows/profile media into the new session without reloading the iframe.

**Why it happens:** `identity.changed` is unsolicited and uncorrelated. NAP-IDENTITY defines neither an identity revision nor ordering/atomicity between the initial snapshot and later pushes; it also does not bind a `getFollows` result to an identity version. The existing feed identity controller has an `inFlight` guard, but its awaited snapshot can still complete after an `identity.changed` callback and overwrite the newer value (`apps/playground/napplets/feed/src/feed-identity-events.ts:47-63`).

**How to avoid:**

- Make an identity epoch/generation the single ownership token for the social slice. Increment it synchronously for every `identity.changed`, including `pubkey: ""`.
- Capture `{ epoch, pubkey }` before every async follow, outbox, resource, and rendering operation. On completion, mutate state only when both still match current state.
- On logout, immediately close subscriptions, abort cancellable resource work, clear profiles/degraded state, detach/revoke media URLs, and render signed-out UI. Do not wait for pending work to settle.
- Subscribe before requesting the startup snapshot, then make the snapshot conditional on the same epoch. Treat duplicate `identity.changed` messages as harmless; do not reload the iframe.
- Have the host provider capture the pubkey it is answering for rather than re-reading the current signer after an async relay lookup.

**Warning signs:** Brief flashes of the prior account after signer switch; logout followed by a populated list; tests pass when promises resolve in request order but fail when the first deferred promise is released last.

**Phase to address:** Phase 1 — identity lifecycle and follow/profile state foundation. Add deferred-promise tests for startup-snapshot-versus-change, A→B switch, B→logout, duplicate change, and `pagehide` while work is pending.

---

### Pitfall 2: Profile reduction is arrival-order dependent instead of NIP-01 replaceable-event resolution

**What goes wrong:** More than one valid kind-0 event for an author is returned by outbox routing, and the UI chooses whichever arrived last. Equal `created_at` values make profile results nondeterministic across relays, batches, and test runs. The current feed/profile code only rejects a strictly older timestamp, so equal-timestamp arrival overwrites the first event (`feed-store.ts:206-213`; `profile-viewer/src/main.ts:201-205`).

**Why it happens:** NAP-OUTBOX deduplicates only by event ID and explicitly does not guarantee ordering or newest-per-author selection. Relays often return the latest replaceable event, but the client cannot rely on that across several relays.

**How to avoid:**

- Reduce only signature-validated kind-0 events keyed by `(pubkey, kind)` after collecting all batches.
- Use the NIP-01 comparator exactly: larger `created_at` wins; when equal, lexicographically **lower** event ID wins. Parse metadata only after the winner is selected; malformed winning JSON renders a safe metadata fallback, never a different stale event.
- Centralize this comparator as a pure exported helper. Apply it across batches, not once per response.
- Test reverse arrival, identical timestamp/different IDs, duplicate IDs, wrong kind/author, malformed JSON, and a newer event from a later incomplete batch.

**Warning signs:** Screenshots intermittently show a different display name for identical fixture data; a sort uses only `created_at`; per-profile subscriptions specify `limit: 1` and assume relay ordering.

**Phase to address:** Phase 2 — outbox profile batching and reducer. This is a confirmed client responsibility, not a NAP-OUTBOX feature request.

---

### Pitfall 3: `incomplete` is mistaken for “no usable data”

**What goes wrong:** A timeout, missing relay list, or one failed relay causes the entire followed-profile view to be cleared or reported as a hard error even though other author profiles were returned. Conversely, success UI silently hides that the list may be incomplete.

**Why it happens:** NAP-OUTBOX exposes query-wide `incomplete?: true` and `error?: string`; neither is per-author and both can coexist with non-empty `events`. There is no per-author completeness or newest-profile guarantee in the draft.

**How to avoid:**

- Always reduce and render returned valid events, even when `incomplete` or `error` is present.
- Store a separate degraded descriptor (`incomplete`, optional diagnostic) rather than encoding it as an empty/error data state. Preserve it through pagination/batch aggregation with logical OR for `incomplete` and a bounded diagnostic summary.
- State honestly: “Some profiles could not be loaded”; do not claim which authors are missing. A retry must begin a new identity epoch/request generation.
- Use bounded, configurable author batches and a bounded concurrency pool. Avoid one request per author (relay/follow-list amplification) and avoid an unbounded author filter or a low global result limit that can starve later authors.

**Warning signs:** `if (error) return` appears before processing `events`; an empty view uses the same state for no follows, all failures, and partial results; users see a green “loaded” state after relay errors.

**Phase to address:** Phase 2 — outbox batching. Add fixtures containing one successful and one failed relay/batch, with profiles retained plus a visible degraded warning.

---

### Pitfall 4: Remote profile URLs bypass the resource boundary, or stale object URLs leak memory/content

**What goes wrong:** A napplet assigns metadata `picture`/`banner` directly to `img.src`. The browser then makes a napplet-origin network request outside the shell policy and reveals the user’s IP/referrer to arbitrary profile-controlled hosts. Replacing this with `URL.createObjectURL()` can introduce retained blobs, premature revocation that breaks images, and late stale responses that overwrite new-account media.

**Why it happens:** Existing demo code validates only `http:`/`https:` and directly assigns the remote string (`feed/src/main.ts:86-146`, `profile-viewer/src/main.ts:102-153`). Object URLs do not self-revoke when `src` changes. NAP-RESOURCE deliberately does not prescribe object-URL ownership/cleanup timing; that is napplet implementation work.

**How to avoid:**

- Treat profile media URLs as opaque input. Fetch bytes only through `resource.bytes`; never put the remote URL in a DOM media attribute, CSS URL, link, or prefetch API.
- Keep a media-controller record per rendered slot: current epoch, abort handle/request identity, and owned object URL. On replace/reset/pagehide, remove `src`/background first, then revoke the prior URL exactly once.
- Create a new object URL only after the epoch check. If a late result has already created one, revoke it without attaching it. Do not revoke the active URL until it has been replaced/reset (or after an intentional load/error lifecycle), because early revocation can make the image unusable.
- Require the host `resource` fetch implementation to enforce redirect, SSRF/private-address, byte-limit, MIME sniffing, and SVG-safety policy. The Kehto reference service delegates those controls to the host (`packages/services/src/resource-service.ts:14-26`).

**Warning signs:** Network panel shows profile-image requests from the iframe; `img.src` receives `http`/`https`; `createObjectURL` has no corresponding reset/replacement cleanup; memory rises after changing profiles; an old avatar appears after identity change.

**Phase to address:** Phase 3 — resource-mediated profile media. Unit-test URL ownership/revocation and stale completion; browser-test that no remote profile URL is assigned and only the shell-owned resource route contacts the image server.

---

### Pitfall 5: Cancellation and teardown are treated as sufficient race protection

**What goes wrong:** Closing an outbox subscription or aborting `resource.bytes` is assumed to prevent a callback. A relay/event or resource terminal message races with teardown and updates destroyed/cleared state; a service emits a late cancellation error after its window was removed.

**Why it happens:** Abort is cooperative and does not retract already queued callbacks. NAP-RESOURCE expects late terminal messages after cancellation to be discarded, but its draft does not define the application state model. The current resource service aborts per-window requests (`resource-service.ts:520-537`), yet callers still need epoch checks before UI mutation; deletion from its tracking map alone is not a proof that no response is in flight.

**How to avoid:**

- Use cancellation for resource conservation and subscriptions for relay cleanup, but use the identity/request epoch as the correctness gate.
- Scope all subscriptions, timers, pending batch controllers, and object URLs to the active session; dispose them as one idempotent `resetSocialState()` operation.
- Ensure terminal callbacks check both `active` and epoch before any render, status update, or new chained fetch. Ignore late completions rather than turning them into a new visible error after logout.
- Test destroy/pagehide after request dispatch, cancellation before and after the response is queued, and switch-account while one image/profile batch is delayed.

**Warning signs:** “set state after destroy” errors; status switches from signed-out to network-error after logout; cancellation test only verifies `AbortSignal.aborted`, not absence of later UI mutation.

**Phase to address:** Phase 1 (state reset contract) and Phase 3 (media cancellation). Add runtime/service regression tests for per-window cleanup and E2E assertions that cleared UI remains cleared after deferred completions resolve.

---

### Pitfall 6: Blossom authorization or completion is accepted without proof-bound validation

**What goes wrong:** The napplet chooses a storage server or supplies its own authorization, bytes are uploaded before user consent, a wrong/expired authorization is sent, or the shell reports success from an unvalidated descriptor. This can leak identity/signing authority, store different bytes than shown, or make a malicious response appear successful.

**Why it happens:** NAP-UPLOAD makes the shell—not the napplet—responsible for server selection, policy, signer access, authorization, and transport. NAP-BLOSSOM is still a draft, so exact BUD-11 tag/URL requirements must be pinned rather than inferred. Current `createHttpUploader` correctly hashes the actual byte payload and rejects mismatched hash/size, but accepts any non-empty descriptor URL and its auth template lacks the `server` tag expected by the pinned NAP-BLOSSOM draft (`packages/services/src/http-uploader.ts:243-307`).

**How to avoid:**

- Keep rail and server configuration shell-owned. `request.rail: "blossom"` is a rail request, never server/credential/authorization input. Structured-clone `Blob`/`ArrayBuffer` bytes only; no base64 conversion contract.
- Before PUT, obtain consent and validate MIME/size/quota. Hash the exact bytes; sign a fresh kind-24242 event using the pinned draft’s required action/hash/expiration/server-domain fields. Never expose event, key, token, or signer APIs to the iframe.
- Require a valid signed authorization in E2E: verified signature, kind 24242, `t=upload`, exact payload hash, future bounded expiration, and the configured server domain. Assert no PUT and no signing follow a denial or teardown.
- Fail closed unless response URL, SHA-256, and size are type-valid and match the submitted bytes. Encode the milestone’s HTTPS result policy explicitly (the draft itself does not require every descriptor URL to be HTTPS), and consume an accepted result through NAP-RESOURCE rather than direct browser networking.

**Warning signs:** `server`/auth fields accepted from iframe input; upload server is selected from `request.metadata`; a test asserts only “Authorization starts with Nostr”; successful descriptors permit `javascript:`, `data:`, or an unexpected origin; consent is asserted after PUT count increases.

**Phase to address:** Phase 4 — Blossom rail hardening and host wiring. Pin the exact NAP-BLOSSOM commit in source/tests and add negative descriptor/auth/consent/abort cases before the Paja proof phase.

---

### Pitfall 7: “E2E” exercises a friendly raw fixture rather than the SDK napplet and real shell path

**What goes wrong:** A test sends a hand-written `postMessage` envelope into a host fixture and observes a canned result. It passes while the built shim/SDK napplet cannot negotiate `shell.ready`/`shell.init`, structured cloning differs, the Paja source registry rejects the frame, service capability wiring is absent, or a direct-network path remains in the real UI.

**Why it happens:** Raw-wire tests are valuable for protocol error cases, but they are not SDK integration evidence. The existing Paja test uses a custom inline target that sends raw messages through `window.parent.postMessage(..., '*')` (`tests/e2e/paja-single-window.spec.ts:485-556`). It proves many host services, including a real local Blossom PUT, but cannot alone prove the social vertical slice through a built `@napplet/shim`/SDK artifact.

**How to avoid:**

- Retain raw-envelope tests for malformed/unknown/error cases, but add one separately built SDK/shim fixture napplet with the real identity, outbox, resource, and upload calls.
- Drive UI through Playwright’s real iframe boundary using `frameLocator`/`contentFrame`; Paja `srcdoc` frames all have `about:srcdoc`, so select the iframe element/container rather than a frame URL (`tests/e2e/helpers/napplet-frame.ts:3-18`).
- Run a deterministic local signer, outbox relay simulation, HTTPS-capable media/resource server or controlled transport, and Blossom server. Assert the actual sequence: identity change without iframe reload; follows → batched kind-0 query → deterministic profile DOM → resource-produced object URL → signed/validated Blossom upload.
- Assert security boundaries as observable facts: no `window.nostr` in iframe, no direct image request, no raw private key/token, source-bound message handling, and test-server PUT only after consent.
- Keep fixture build/asset resolution in the test command. Failing to build the fixture must fail the spec rather than silently falling back to handwritten HTML.

**Warning signs:** Tests import a napplet receiver and call it directly; `page.evaluate` changes internal host state instead of driving a signer/identity event; a fixture does not import `@napplet/shim` or SDK; assertions stop at a wire log with no iframe-visible result; browser traffic never reaches a controlled relay/resource/Blossom server.

**Phase to address:** Phase 5 — Paja end-to-end vertical-slice proof. It depends on the lifecycle, reducer, resource, and upload contracts from Phases 1–4.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Use a boolean `inFlight` instead of an identity epoch | Fewer state fields | Cannot distinguish stale completion from current work after a switch | Never for live identity refresh |
| Rely on relay `limit: 1` for kind-0 correctness | Less reducer code | Tied timestamps and multi-relay delivery become nondeterministic | Never; central reducer is small |
| Clear all profiles on any outbox error | Simple error UI | Loses valid data and falsely claims an empty follow set | Never; preserve partial successes |
| Set `img.src` to metadata URL | One line of rendering | Direct network/privacy regression and policy bypass | Never in a sandboxed napplet |
| Keep object URLs until iframe reload | Easy demo behavior | Blob retention and stale media across live identity changes | Only an isolated throwaway test fixture |
| Treat a non-empty Blossom URL as success | Minimal descriptor parsing | Unsafe scheme/origin, incorrect proof binding, opaque failed uploads | Never; validate and enforce the product HTTPS policy |
| Use only handwritten raw envelopes for Paja browser tests | Fast fixtures | SDK/shim and real source/clone/capability paths can drift undetected | Only as a complement to built-fixture E2E |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| NAP-IDENTITY | Assume `identity.changed` orders or cancels outstanding calls | Subscribe then snapshot; use local epoch checks because the protocol has no revision/cancellation guarantee |
| NAP-OUTBOX | Treat `incomplete` as a failure and assume response ordering | Preserve valid events, display query-wide degraded status, and perform client-side NIP-01 reduction |
| NAP-RESOURCE | Regard the reference service as complete SSRF/MIME protection | Wire a hardened host fetch implementation and make browser rendering use returned bytes only |
| Browser object URLs | Revoke immediately after assigning `src`, or never revoke | Revoke superseded/reset URLs after detaching; retain current URL while it is in use |
| NAP-UPLOAD / Blossom | Let the iframe control server/auth or trust descriptor claims | Shell selects server, signs and validates proof, checks response against submitted bytes, and owns consent |
| Paja `srcdoc` | Find frames by URL or test only direct host calls | Locate the iframe element, use its real `FrameLocator`, and drive a built SDK fixture through production message listeners |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| One kind-0 request per followed author | Relay/socket churn, slow first paint, rate-limit failures | Bounded author batches with bounded concurrency; reduce across all responses | As soon as a user follows more than a small handful of accounts |
| Unlimited image loads after each profile refresh | Pending requests and blobs survive identity churn | Deduplicate desired media, abort/reset by epoch, enforce resource limits | Rapid signer changes or large follow lists |
| Re-render every partial profile arrival without batching | DOM/layout churn and flickering status | Coalesce UI updates per batch/animation frame while retaining deterministic reducer state | Medium follow lists and multi-relay arrival bursts |
| Overly small global outbox `limit` | Some authors always lack profiles | Budget per batch and document that results are query-wide/incomplete, not per-author complete | Any batch with more events than its limit |

## Security Mistakes

| Mistake | Risk | Prevention |
|---|---|---|
| Direct media URL assignment | Profile author tracks users and bypasses shell policy/ACL/resource controls | Static guard plus browser network assertion; only resource bytes become object URLs |
| Stale result after logout/account switch | Cross-account data disclosure in a live iframe | Epoch-gated async work and synchronous state/media cleanup |
| Incomplete Blossom auth validation | Mis-scoped/replayed authorization or signing against wrong bytes/server | Verify signed kind-24242 event and pinned tags, hash actual bytes, use fresh bounded expiration |
| Trusting descriptor URL/MIME from storage response | Unsafe scheme/origin or rendering unexpected content | Parse/enforce runtime HTTPS policy; keep result reads resource-mediated and apply host MIME/SVG policy |
| Test-only signer/token exposed to frame | False assurance about key isolation | Assert iframe cannot access signer/authorization/private key and keep test hooks on parent only |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---|---|---|
| Reset waits for a refresh to finish | Old follows/media remain visible after logout | Clear immediately on `pubkey: ""`; show signed-out state |
| Partial outbox failure appears as empty follows | User thinks they follow nobody or loses trust | Render successful profiles with a visible, nonfatal “some profiles unavailable” warning |
| Image failure makes the whole profile fail | One remote media issue hides usable metadata | Keep textual profile, show fallback avatar/banner, and report media failure locally |
| Upload success is declared before proof validation | User believes a file is stored when it is not | Show complete only after validated descriptor; otherwise retain explicit failed/cancelled state |

## "Looks Done But Isn't" Checklist

- [ ] **Live identity:** A deferred old `getFollows`/outbox/image completion cannot alter UI after A→B, B→logout, duplicate change, or `pagehide`; iframe generation is unchanged.
- [ ] **Profiles:** Batches are bounded; kind-0 winner uses `created_at` then lexicographically lowest ID; valid results remain rendered under `incomplete` plus an explicit degraded warning.
- [ ] **Resource media:** No remote metadata URL is assigned to a media element; every created object URL is revoked on replacement/reset/late discard; no revocation occurs before the active image can use it.
- [ ] **Host resource boundary:** Connect grant, redirect/private-address, size, MIME, and SVG policy are exercised through the actual host fetch adapter, not only mocked service calls.
- [ ] **Blossom:** The iframe supplies bytes and rail only; consent precedes network/signing; signed auth and returned hash/size/URL satisfy pinned policy; denial, malformed descriptor, and abort fail closed.
- [ ] **Paja proof:** A built `@napplet/shim`/SDK social fixture—not solely raw HTML—completes login → follows → profiles → resource image → Blossom upload through real iframe messaging.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| Stale identity/media state shipped | HIGH | Disable further refresh writes behind a session epoch, clear affected UI/media, add deferred-order regression tests, audit telemetry/screenshots for cross-account visibility |
| Nondeterministic profile selection | MEDIUM | Replace ad hoc comparisons with the shared NIP-01 comparator, rebuild profile map from cached events, add equal-timestamp fixtures |
| Partial results discarded | MEDIUM | Separate data from query health state, retain valid events, add degraded warning and retry path |
| Object URL leak/direct image fetch | MEDIUM | Remove direct DOM URL path, introduce media ownership controller, revoke existing slots, add browser network/memory-oriented regression checks |
| Invalid Blossom proof/result accepted | HIGH | Stop completion publication, rotate/revoke affected server configuration if needed, enforce proof/descriptor validation before retry, add adversarial test server cases |
| False-positive Paja E2E | MEDIUM | Preserve raw tests as unit/protocol checks, add compiled SDK fixture and browser-level assertions to CI |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---|---|---|
| Identity snapshot/change races and cleanup | Phase 1: identity lifecycle | Deferred promises prove stale responses cannot write; iframe remains mounted on identity changes |
| Replaceable kind-0 and batch reduction | Phase 2: outbox profiles | Pure comparator vectors including equal timestamps/IDs; multi-batch incomplete fixture |
| Partial query semantics | Phase 2: outbox profiles | Non-empty profiles plus visible degraded warning after a relay/batch failure |
| Direct network, object URLs, and cancellation | Phase 3: resource media | Browser network assertion, unit URL ownership tests, reset/pagehide stale-result tests |
| Blossom proof, consent, and result validation | Phase 4: upload rail | Local Blossom server asserts PUT bytes, signed auth, no transfer on denial, reject malformed/mismatched results |
| Real Paja journey | Phase 5: built-fixture E2E | Built SDK/shim napplet drives the full social/upload path through Paja FrameLocator and actual host services |

## Sources

- [NAP-IDENTITY, `master` at `6461e4b`](https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md) — snapshot/push lifecycle; **MEDIUM** confidence via verified search plus pinned primary source.
- [NAP-OUTBOX PR #32 at `4589a8f`](https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md) — query-wide incomplete/error and no ordering guarantee; **MEDIUM** confidence. Draft.
- [NIP-01 replaceable events](https://github.com/nostr-protocol/nips/blob/master/01.md) — kind-0 timestamp then lexicographically lowest-ID tie rule; **MEDIUM** confidence via verified search.
- [NAP-RESOURCE PR #80 at `fa6bcc6`](https://raw.githubusercontent.com/napplet/naps/fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1/naps/NAP-RESOURCE.md) — shell mediation and cancellation; **MEDIUM** confidence. Draft.
- [MDN `URL.revokeObjectURL()`](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static) — browser object-URL lifecycle; **LOW** confidence under the research-provider classifier, used only for standard cleanup guidance.
- [NAP-UPLOAD PR #33 at `a7cc174`](https://raw.githubusercontent.com/napplet/naps/a7cc17463cbf5d9cb87884b31071bc4fc826034c/naps/NAP-UPLOAD.md) and [NAP-BLOSSOM PR #71 at `ca1d7ba`](https://raw.githubusercontent.com/napplet/naps/ca1d7ba594e6790785dc770227085d8648d39631/naps/NAP-BLOSSOM.md) — upload responsibility/proof boundary; **MEDIUM** confidence. Both drafts.
- [Playwright Frames](https://playwright.dev/docs/frames) — real iframe test boundary; **LOW** confidence under the research-provider classifier, corroborated by repository E2E helpers.
- Repository evidence: `apps/playground/napplets/feed/src/feed-identity-events.ts`, `feed-store.ts`, `profile-viewer/src/main.ts`; `packages/services/src/{resource-service,http-uploader,upload-service}.ts`; and `tests/e2e/paja-single-window.spec.ts`.

---
*Pitfalls research for: Kehto v1.29 Social + Blossom Vertical Slice*
*Researched: 2026-07-24*
