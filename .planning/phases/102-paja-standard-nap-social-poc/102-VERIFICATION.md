---
phase: 102-paja-standard-nap-social-poc
verified: 2026-07-28T21:25:30+05:30
status: passed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
upstream_baseline: 297b5478ead54508a881909e658fda0c8ee19984
contribution_head: 81185b45c99544fbb63271da4bcfc69334e759e1
re_verification:
  previous_status: passed
  previous_score: 9/9
  gaps_closed:
    - "Rebased and adapted the contribution to current Kehto upstream after PR #204."
    - "Updated NAP package evidence from @napplet/nap 0.28.0 to 0.29.0."
    - "Passed the fresh full CI Chromium suite: 80 passed, 1 skipped."
    - "Closed final adversarial review findings: response-time identity revocation, per-author failure isolation, and superseded live contact-list cancellation."
  gaps_remaining: []
  regressions: []
---

# Phase 102: Paja Standard-NAP Social PoC Verification Report

**Phase Goal:** A logged-in napplet can discover the active Paja identity, follows, and followed kind-0 profile events through standard NAP interfaces.

**Verified:** 2026-07-28T21:25:30+05:30
**Status:** `passed`
**Re-verification:** Yes — against current `kehto/web` upstream `297b5478`

## Verdict

**PASS.** PR #204 and current upstream alter Paja composition, host topology, intent handling, and dependency versions, but do not replace Phase 102's private follows/profile cache. A nine-truth supersession audit classified the contribution as **retain and adapt/shrink**. The isolated contribution was rebased onto `upstream/main@297b5478`, dropped unrelated scope, adapted to current Paja/runtime/services topology, and preserved every verified follow through sequential per-author profile hydration. Final adversarial review found and closed three lifecycle/security defects: response-time `identity:read` revocation, per-author relay failure isolation, and cancellation of superseded live contact-list reads. Independent re-review is clean. The focused contribution is verified at `81185b45` against `@napplet/nap@0.29.0`. Build, type-check, 1,605 unit tests, docs, focused tests, AI-slop no-regression, and the fresh full `CI=1` Chromium suite passed with **80 passed and 1 skipped**. Writer's unrelated port-4173 preview was restored with exact argv/environment/cwd digests and seven HTTP-200 probes.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A napplet receives the active public key and relay-backed follows associated with the request-start public key through `identity.getPublicKey` and `identity.getFollows`. | VERIFIED | `createIdentityService` captures the signer key before invoking the follows provider. The signer-switch regression covers pending account A followed by signer B. The cache validates and selects account A kind-3 records, and the standard iframe tracer passed. |
| 2 | Paja keeps a private, active-account-scoped, memory-only cache of followed kind-0 profiles and refreshes it after signer connection without a social API. | VERIFIED | `browser-adapter.ts` constructs one private cache around one base router, starts non-blocking refresh, and subscribes to signer transitions. `browser-social-cache.ts` partitions data by account and guards refresh writes with generation plus active-key checks. |
| 3 | Normal `outbox.query` returns ordinary router event results with normal filter, limit, dedupe, `incomplete`, and `error` semantics. | VERIFIED | The decorator always awaits the base router, requires source-bound `identity:read` both before the request and immediately before augmentation, filter-matches and limits cache additions, preserves base entries by ID, and copies base degradation fields. Stable deny and mid-query revocation regressions plus browser tracer coverage passed. |
| 4 | Only verified, captured-account replaceable kind-3 events determine follows, with greatest `created_at` then lexicographically lowest ID ordering. | VERIFIED | `verifiedFollows`, `isContactCandidate`, `selectReplacement`, and `contactPubkeys` constrain signature, kind, author, deterministic ordering, exact 64-hex p tags, normalization, and dedupe. Focused boundary and ordering tests passed. |
| 5 | Account and generation races cannot write old background data into the active account, while a correlated request can complete for its original key. | VERIFIED | `refreshActiveIdentity` increments a generation, aborts the superseded contact-list read, and checks captured active identity after contact and profile awaits. Deferred A/B, same-account, relay-abort, and per-author failure-isolation tests passed; generic service coverage proves original-ID and captured-key correlation. |
| 6 | The target-CORS diagnostic remains live; an allowed opaque-origin target does not produce a false `paja.target.cors.error`. | VERIFIED | `browser-host.test.ts` guards post-navigation `reportTargetCorsDiagnostic`. The Phase 102 browser tracer observes `Origin: null` and asserts no false diagnostic; it passed in both focused and fresh complete E2E evidence. |
| 7 | The shipped Paja behavior has synchronized consumer docs and a package-specific changeset without overclaiming OUTBOX authority. | VERIFIED | Paja README, package guide, and authoring guide consistently describe standard identity/outbox access, private memory scope, preserved degradation, exact NAP refs, and current-master OUTBOX limitation. `.changeset/paja-standard-nap-social-cache.md` declares a minor Paja release. `docs:check` passed. |
| 8 | Phase 102 uses the stated NAP authority and does not claim current-master NAP-OUTBOX conformance. | VERIFIED | Rechecked `napplet/naps` master remains `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`; pinned NAP-IDENTITY is byte-identical; master lacks `naps/NAP-OUTBOX.md`; NAP-OUTBOX PR #32 remains open at `4589a8f`; and current `@napplet/nap@0.29.0` declarations retain `IdentityGetFollows`, `OutboxQuery`, and `OutboxResult`. |
| 9 | The completed release passes the required browser-inclusive project gate. | VERIFIED | Fresh probe-scoped `CI=1` full E2E run started exclusive Kehto servers and completed **80 passed, 1 skipped in 1.6m**. The Phase 102 standard identity/OUTBOX/CORS tracer passed. |

**Score:** 9/9 truths verified (0 present-but-behavior-unverified)

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `packages/paja/src/browser-social-cache.ts` | Private active-account cache, contact validation, warm, and router decorator | VERIFIED | Substantive implementation wired from the adapter. Dynamic values come from verified relay candidates and the base router, not hardcoded profiles. |
| `packages/paja/src/browser-relay-runtime.ts` | Host-owned captured-account kind-3 loader | VERIFIED | `createPajaContactListLoader` validates a 64-hex account and uses existing bootstrap relay selection for `{ kinds: [3], authors: [pubkey] }`. |
| `packages/paja/src/browser-adapter.ts` | One base router composed with standard identity/outbox services | VERIFIED | Creates `baseOutboxRouter` once; supplies cache follows to identity and a decorated base router to outbox. |
| `packages/paja/src/browser-social-cache.test.ts` | Cache validation, ordering, race, merge, authorization, cancellation, and failure-isolation coverage | VERIFIED | The final Paja suite passed 149 tests, including mid-query authorization revocation, failed middle-author continuation, and superseded contact-load abort regressions. |
| `packages/services/src/identity-service.test.ts` | Request-start key regression | VERIFIED | Captured-key signer-switch test is present and passed. |
| `tests/e2e/paja-single-window.spec.ts` | Standard iframe tracer and CORS assertion | VERIFIED | The named tracer passed independently and again in the fresh full suite. |
| Paja README, package guide, and authoring guide | Consistent public boundary and protocol-drift documentation | VERIFIED | Standard methods, private memory scope, base degradation, authority refs, current-master limitation, and CORS guidance are present on all three surfaces. |
| `.changeset/paja-standard-nap-social-cache.md` | Release record for changed Paja output | VERIFIED | Exists and declares `"@kehto/paja": minor`. |
| `102-IMPLEMENTATION-NOTE.md` plus supersession audit records | Fail-closed authority, current-upstream rebase, and Chromium evidence | VERIFIED | The original note preserves initial authority evidence; `.planning/debug/resolved/phase-102-supersession-audit.md` and `phase-102-supersession-verify.md` record the current `0.29.0` contract check, nine-truth matrix, isolated rebase, full gates, and exact Writer restoration proof. |

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
| Contact validation, ordering, races, filter/limit/dedupe, degradation, delegation, relay bounds, authorization revocation, per-author failure isolation, and live-query cancellation | Complete Paja Vitest run plus focused review regressions | 19 files, 149 tests passed; focused 2 files, 30 tests passed | PASS |
| Current-upstream workspace build and Paja type-check | `PATH=/tmp/kehto-pnpm-shim:$PATH pnpm build` plus `pnpm type-check` | Full dependency-aware workspace build and type-check passed against `@napplet/nap@0.29.0` | PASS |
| Standard iframe tracer with no false target-CORS diagnostic | Probe-scoped focused Chromium test | 1 passed in 9.3s | PASS |
| Full browser-inclusive release gate | `CI=1 PATH=/tmp/kehto-pnpm-shim:$PATH pnpm exec playwright test` | 80 passed, 1 skipped in 1.6m; fresh exclusive Kehto harness and playground servers | PASS |

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|---|---|---|---|---|
| PAJA-01 | 102-02, 102-03 | Active public key and relay-backed follows use the request-start key | SATISFIED | Captured-key generic-service test, verified kind-3 selection tests, bootstrap relay loader, and passing iframe identity/follows tracer. |
| PAJA-02 | 102-02, 102-03, 102-04 | Private active-identity cache warms followed kind-0 profiles without a custom application API | SATISFIED | Account-scoped in-memory map, refresh/subscription, base-router warm, no public export/service, race tests, and docs. |
| PAJA-03 | 102-02, 102-03, 102-04 | Standard outbox query preserves events, dedupe, `incomplete`, and `error` | SATISFIED | Decorator implementation; filter/limit/base-precedence/degraded-result tests; passing standard-envelope browser tracer. |

No Phase 102 requirement is orphaned from the phase plans.

## Protocol Conformance and Scope

- **NAP-IDENTITY:** Conformant to pinned `6461e4b37c29dc09a20dff35d9515889c4433874`, independently confirmed byte-identical to `napplet/naps` master `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`.
- **NAP-OUTBOX:** Governed by open PR #32 pinned at `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e` and current `@napplet/nap@0.29.0` declarations. `napplet/naps` master still lacks `naps/NAP-OUTBOX.md`; this remains upstream drift, and the rebased implementation/docs correctly make no current-master OUTBOX conformance claim.
- **Standard-only boundary:** The code exposes only existing `identity` and `outbox` services. No `services.social`, `paja.social`, cache barrel export, direct napplet relay client, ACL remapping, or second relay client was found.
- **Scope fence:** Current-upstream probe diff contains exactly 19 focused Paja/runtime/services/test/docs/changeset paths and no Writer path or Phase-103 Blossom implementation. The rebase dropped the unrelated firewall package-doc correction; final review-required runtime/services paths provide request-scoped capability enforcement and matching regressions.
- **Deferred real smoke:** Live signer/relay and real downstream Writer proof remain intentionally sequenced after Phase 103; the passing deterministic standard-envelope tracer is the appropriate Phase 102 proof.

## Gate Status

| Gate | Actual verifier result | Status |
|---|---|---|
| Chromium prerequisite | `/usr/bin/chromium` executable; Fedora Chromium 150.0.7871.128 | PASS |
| Build | Current-upstream dependency-aware workspace build passed | PASS |
| Type check | Full workspace type-check passed | PASS |
| Unit tests | 127 files, 1,605 tests passed | PASS |
| Focused Phase 102 tests | Final Paja suite: 19 files, 149 tests; review regressions: 2 files, 30 tests | PASS |
| Focused Phase 102 Playwright tracer | 1 passed in 9.3s | PASS |
| Full Playwright suite | Fresh probe-scoped `CI=1` run: 80 passed, 1 skipped in 1.6m | PASS |
| Documentation | `docs:check` completed TypeDoc, VitePress, API-copy, and audit successfully | PASS |
| AI-slop | 85/100 Healthy, 0 errors, same 4 unrelated warnings as pristine `upstream/main` | PASS — NO REGRESSION |
| Whitespace | `git diff --check` passed on the clean rebased probe | PASS |

Final re-verification used an isolated contribution worktree rooted on `upstream/main@297b5478`, a temporary Corepack-pnpm wrapper required by Turbo, and `CI=1` so Playwright started exclusive non-reused servers. Writer's unrelated port-4173 preview was paused only after fresh user authorization and process capture, then restored with byte-identical raw NUL-delimited argv/environment hashes, identical cwd, and seven HTTP-200 probes. The post-`81185b45` 80-pass suite is the authoritative browser gate.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `packages/services/src/identity-service.test.ts` | 384 | `TODO(12-10)` with formal follow-up reference | Info | Pre-existing runtime-level ACL integration follow-up; not a Phase 102 stub or untracked debt marker. |
| `packages/runtime/src/discovery.test.ts`, `packages/runtime/src/dispatch.test.ts` | AI-slop report | Four pre-existing tautological-test warnings | Info | Outside Phase 102 changed files; scanner reports 0 errors and no Phase 102 warning. |
| Phase 102 cache/adapter/relay/test/docs artifacts | — | Valid empty returns for input guards and no unresolved `TBD`/`FIXME`/`XXX` markers | None | No user-visible stub or unresolved Phase 102 debt marker found. |

---

_Verified: 2026-07-28T21:25:30+05:30 against `upstream/main@297b5478`_
_Verifier: Claude (GSD supersession audit + current-upstream re-verification)_
