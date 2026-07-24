---
phase: 102-paja-standard-nap-social-poc
verified: 2026-07-24T16:45:06Z
status: passed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 8/9
  gaps_closed:
    - "The required browser-inclusive project gate passes for the completed Phase 102 release."
  gaps_remaining: []
  regressions: []
---

# Phase 102: Paja Standard-NAP Social PoC Verification Report

**Phase Goal:** A logged-in napplet can discover the active Paja identity, follows, and followed kind-0 profile events through standard NAP interfaces.

**Verified:** 2026-07-24T16:45:06Z  
**Status:** `passed`  
**Re-verification:** Yes — after gate-environment closure

## Verdict

**PASS.** The Phase 102 goal is achieved in the codebase and all required release gates now have passing evidence. The prior full-E2E failure was environmental contamination: Playwright reused an unrelated Writer preview at port 4173. The coordinator paused that process, ran the exact suite with `CI=1` and an ephemeral Corepack pnpm shim so Playwright started fresh Kehto harness and playground servers, then restored the Writer process. The complete suite passed with **74 passed and 1 skipped**. No implementation edit was required or made during closure.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A napplet receives the active public key and relay-backed follows associated with the request-start public key through `identity.getPublicKey` and `identity.getFollows`. | VERIFIED | `createIdentityService` captures the signer key before invoking the follows provider. The signer-switch regression covers pending account A followed by signer B. The cache validates and selects account A kind-3 records, and the standard iframe tracer passed. |
| 2 | Paja keeps a private, active-account-scoped, memory-only cache of followed kind-0 profiles and refreshes it after signer connection without a social API. | VERIFIED | `browser-adapter.ts` constructs one private cache around one base router, starts non-blocking refresh, and subscribes to signer transitions. `browser-social-cache.ts` partitions data by account and guards refresh writes with generation plus active-key checks. |
| 3 | Normal `outbox.query` returns ordinary router event results with normal filter, limit, dedupe, `incomplete`, and `error` semantics. | VERIFIED | The decorator always awaits the base router, filter-matches and limits cache additions, preserves base entries by ID, and copies base degradation fields. Unit and browser tracer coverage passed. |
| 4 | Only verified, captured-account replaceable kind-3 events determine follows, with greatest `created_at` then lexicographically lowest ID ordering. | VERIFIED | `verifiedFollows`, `isContactCandidate`, `selectReplacement`, and `contactPubkeys` constrain signature, kind, author, deterministic ordering, exact 64-hex p tags, normalization, and dedupe. Focused boundary and ordering tests passed. |
| 5 | Account and generation races cannot write old background data into the active account, while a correlated request can complete for its original key. | VERIFIED | `refreshActiveIdentity` increments a generation and checks captured active identity after both contact and profile awaits. Deferred A/B and same-account tests passed; generic service coverage proves original-ID and captured-key correlation. |
| 6 | The target-CORS diagnostic remains live; an allowed opaque-origin target does not produce a false `paja.target.cors.error`. | VERIFIED | `browser-host.test.ts` guards post-navigation `reportTargetCorsDiagnostic`. The Phase 102 browser tracer observes `Origin: null` and asserts no false diagnostic; it passed in both focused and fresh complete E2E evidence. |
| 7 | The shipped Paja behavior has synchronized consumer docs and a package-specific changeset without overclaiming OUTBOX authority. | VERIFIED | Paja README, package guide, and authoring guide consistently describe standard identity/outbox access, private memory scope, preserved degradation, exact NAP refs, and current-master OUTBOX limitation. `.changeset/paja-standard-nap-social-cache.md` declares a minor Paja release. `docs:check` passed. |
| 8 | Phase 102 uses the stated NAP authority and does not claim current-master NAP-OUTBOX conformance. | VERIFIED | Rechecked master is `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`; pinned NAP-IDENTITY is byte-identical; master lacks `naps/NAP-OUTBOX.md`; and installed `@napplet/nap@0.28.0` declarations contain `IdentityGetFollows`, `OutboxQuery`, and `OutboxResult`. |
| 9 | The completed release passes the required browser-inclusive project gate. | VERIFIED | Fresh `CI=1` full E2E run used new Kehto servers and completed **74 passed, 1 skipped in 2.0m**. Its output explicitly includes the Phase 102 tracer at `paja-single-window.spec.ts:257` as passed. |

**Score:** 9/9 truths verified (0 present-but-behavior-unverified)

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `packages/paja/src/browser-social-cache.ts` | Private active-account cache, contact validation, warm, and router decorator | VERIFIED | Substantive implementation wired from the adapter. Dynamic values come from verified relay candidates and the base router, not hardcoded profiles. |
| `packages/paja/src/browser-relay-runtime.ts` | Host-owned captured-account kind-3 loader | VERIFIED | `createPajaContactListLoader` validates a 64-hex account and uses existing bootstrap relay selection for `{ kinds: [3], authors: [pubkey] }`. |
| `packages/paja/src/browser-adapter.ts` | One base router composed with standard identity/outbox services | VERIFIED | Creates `baseOutboxRouter` once; supplies cache follows to identity and a decorated base router to outbox. |
| `packages/paja/src/browser-social-cache.test.ts` | Cache validation, ordering, race, merge, and delegation coverage | VERIFIED | Nine focused social-cache tests passed inside the 62-test Phase 102 focused set. |
| `packages/services/src/identity-service.test.ts` | Request-start key regression | VERIFIED | Captured-key signer-switch test is present and passed. |
| `tests/e2e/paja-single-window.spec.ts` | Standard iframe tracer and CORS assertion | VERIFIED | The named tracer passed independently and again in the fresh full suite. |
| Paja README, package guide, and authoring guide | Consistent public boundary and protocol-drift documentation | VERIFIED | Standard methods, private memory scope, base degradation, authority refs, current-master limitation, and CORS guidance are present on all three surfaces. |
| `.changeset/paja-standard-nap-social-cache.md` | Release record for changed Paja output | VERIFIED | Exists and declares `"@kehto/paja": minor`. |
| `102-IMPLEMENTATION-NOTE.md` | Fail-closed authority and Chromium evidence | VERIFIED | Contains rerunnable authority commands, hashes, declaration evidence, precise drift disposition, and configured Chromium evidence. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `browser-adapter.ts` | `browser-social-cache.ts` | One base router, refresh, follows provider, decorated outbox router | WIRED | Direct import and active calls at adapter lines 349–405. |
| `browser-social-cache.ts` | `browser-relay-runtime.ts` | Injected `createPajaContactListLoader` | WIRED | Adapter supplies the bootstrap-relay loader as `loadContactList`. |
| `browser-social-cache.ts` | `@kehto/services` outbox service | Decorated normal `OutboxRouter` | WIRED | Decorator returns standard `OutboxResult`; adapter supplies it to `createOutboxService`. |
| `identity-service.ts` | social-cache follows provider | Captured public key passed into `getFollows` | WIRED | Existing identity service delegates with the request-start public key; unit and browser evidence exercise the result envelope. |
| `paja-single-window.spec.ts` | Paja service map | Standard identity/outbox envelopes | WIRED | Actual iframe messages cross the built Paja service map and assert the returned profile event. |
| Paja host boot | target-CORS diagnostic | `reportTargetCorsDiagnostic` after frame navigation | WIRED | Static host guard plus passing browser tracer prove this diagnostic remains active. |

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `browser-social-cache.ts` | `follows`, account snapshots | Verified kind-3 candidates from Paja bootstrap relay backend | Yes — live backend queries configured/signer-read relays; deterministic fixtures exercise the same backend seam | FLOWING |
| `browser-social-cache.ts` | `profiles` | One base-router kind-0 query for validated followed authors | Yes — only base-returned `RelayEventResult` values are cached | FLOWING |
| Decorated `query` | Cached additions and `base.events` | Original `OutboxRouter.query` result | Yes — base query is always awaited and remains authoritative | FLOWING |
| Browser tracer | Iframe result messages | Actual Paja server/service map and signed memory-relay fixtures | Yes — actual standard envelopes and returned kind-0 ID are asserted | FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Contact validation, ordering, races, filter/limit/dedupe, degradation, delegation, and host composition | `./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts packages/services/src/identity-service.test.ts packages/paja/src/browser-host.test.ts packages/services/src/outbox-service.test.ts` | 4 files, 62 tests passed | PASS |
| Built Paja package | `corepack pnpm --filter @kehto/paja build` | Build and declaration generation passed; only pre-existing ignored bare-import warning from `@kehto/nip` appeared | PASS |
| Standard iframe tracer with no false target-CORS diagnostic | Focused Chromium test for `paja-single-window.spec.ts:257` | 1 passed | PASS |
| Full browser-inclusive release gate | `CI=1 PATH=<ephemeral Corepack pnpm shim> pnpm test:e2e` | 74 passed, 1 skipped in 2.0m; fresh Kehto harness and playground servers | PASS |

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|---|---|---|---|---|
| PAJA-01 | 102-02, 102-03 | Active public key and relay-backed follows use the request-start key | SATISFIED | Captured-key generic-service test, verified kind-3 selection tests, bootstrap relay loader, and passing iframe identity/follows tracer. |
| PAJA-02 | 102-02, 102-03, 102-04 | Private active-identity cache warms followed kind-0 profiles without a custom application API | SATISFIED | Account-scoped in-memory map, refresh/subscription, base-router warm, no public export/service, race tests, and docs. |
| PAJA-03 | 102-02, 102-03, 102-04 | Standard outbox query preserves events, dedupe, `incomplete`, and `error` | SATISFIED | Decorator implementation; filter/limit/base-precedence/degraded-result tests; passing standard-envelope browser tracer. |

No Phase 102 requirement is orphaned from the phase plans.

## Protocol Conformance and Scope

- **NAP-IDENTITY:** Conformant to pinned `6461e4b37c29dc09a20dff35d9515889c4433874`, independently confirmed byte-identical to `napplet/naps` master `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`.
- **NAP-OUTBOX:** Governed by pinned `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e` and installed `@napplet/nap@0.28.0` types. Master lacks `naps/NAP-OUTBOX.md`; this is upstream drift, and the implementation/docs correctly make no current-master OUTBOX conformance claim.
- **Standard-only boundary:** The code exposes only existing `identity` and `outbox` services. No `services.social`, `paja.social`, cache barrel export, direct napplet relay client, ACL remapping, or second relay client was found.
- **Scope fence:** Phase-102 commit/diff inspection found no Writer path and no Phase-103 Blossom implementation. Existing Blossom material and documentation that keeps Blossom in Phase 103 are not Phase 102 implementation changes. The unrelated firewall package-doc version correction only restored the documentation gate.
- **Deferred real smoke:** Live signer/relay and real downstream Writer proof remain intentionally sequenced after Phase 103; the passing deterministic standard-envelope tracer is the appropriate Phase 102 proof.

## Gate Status

| Gate | Actual verifier result | Status |
|---|---|---|
| Chromium prerequisite | `/usr/bin/chromium` executable; Fedora Chromium 150.0.7871.128 | PASS |
| Build | 32 Turbo tasks successful | PASS |
| Type check | 32 Turbo tasks successful | PASS |
| Unit tests | 107 files, 1,400 tests passed | PASS |
| Focused Phase 102 tests | 4 files, 62 tests passed | PASS |
| Focused Phase 102 Playwright tracer | 1 passed | PASS |
| Full Playwright suite | Fresh `CI=1` run: 74 passed, 1 skipped in 2.0m | PASS |
| Documentation | `docs:check` completed TypeDoc, VitePress, API-copy, and audit successfully | PASS |
| AI-slop | 0 errors; 4 pre-existing `tautological-test` warnings in unrelated runtime tests | PASS WITH EXISTING WARNINGS |
| Whitespace | `git diff --check` passed | PASS |

The initial local full-E2E attempt used Playwright's non-CI server reuse and encountered a pre-existing Writer listener at the harness port. Re-verification used `CI=1`, which disables server reuse; the coordinated clean run is the authoritative complete-gate result. The Writer preview was restored after evidence collection, so E2E was not rerun again.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `packages/services/src/identity-service.test.ts` | 384 | `TODO(12-10)` with formal follow-up reference | Info | Pre-existing runtime-level ACL integration follow-up; not a Phase 102 stub or untracked debt marker. |
| `packages/runtime/src/discovery.test.ts`, `packages/runtime/src/dispatch.test.ts` | AI-slop report | Four pre-existing tautological-test warnings | Info | Outside Phase 102 changed files; scanner reports 0 errors and no Phase 102 warning. |
| Phase 102 cache/adapter/relay/test/docs artifacts | — | Valid empty returns for input guards and no unresolved `TBD`/`FIXME`/`XXX` markers | None | No user-visible stub or unresolved Phase 102 debt marker found. |

---

_Verified: 2026-07-24T16:45:06Z_  
_Verifier: Claude (gsd-verifier)_
