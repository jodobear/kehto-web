---
phase: 102-paja-standard-nap-social-poc
plan: "03"
subsystem: paja-social-cache
tags: [paja, nap-identity, nap-outbox, nostr, vitest, cors]

requires:
  - phase: 102-02
    provides: "Private Paja follows/profile cache composed through standard identity and OUTBOX services."
provides:
  - "Signature-validated, author-scoped kind-3 selection with deterministic replacement ordering and exact p-tag validation."
  - "Generation-safe, account-scoped social-cache warm behavior that preserves correlated identity requests."
  - "Bounded cache-aware OUTBOX results that retain base IDs, incomplete, error, and router lifecycle semantics."
affects: [102-04, Paja browser verification, Writer integration]

tech-stack:
  added: []
  patterns:
    - "Validate untrusted replaceable contacts before deriving follows; use greatest created_at then lowest event ID."
    - "Apply existing Paja filter matching and filter limits to cached RelayEventResult additions without changing base transport truth."

key-files:
  created: []
  modified:
    - packages/paja/src/browser-social-cache.ts
    - packages/paja/src/browser-social-cache.test.ts
    - packages/paja/src/browser-host.test.ts

key-decisions:
  - "Treat contact pubkeys and captured account keys as valid only when they are already exact 64-character hexadecimal strings; normalize accepted keys to lowercase only."
  - "Keep the Paja social cache private, account-scoped, and memory-only behind the existing identity/outbox services and one base router."
  - "Preserve base OUTBOX event representations and incomplete/error properties exactly; cache additions obey original filters and limits."

patterns-established:
  - "Account-correlated reads may complete for their captured key after an account switch, while background profile commits require both generation and active-account agreement."
  - "Static host guards protect established standard-service composition and the target CORS diagnostic boot call."

requirements-completed: [PAJA-01, PAJA-02, PAJA-03]

coverage:
  - id: D1
    description: "Paja accepts only verified, captured-account kind-3 contacts with deterministic replacement ordering and exact normalized p tags, while stale refreshes cannot replace active account state."
    requirement: PAJA-01
    verification:
      - kind: unit
        ref: "./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts packages/services/src/identity-service.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Private cached kind-0 values are filter- and limit-matched, ID-deduplicated with base precedence, and preserve base degraded result fields and router delegation."
    requirement: PAJA-03
    verification:
      - kind: unit
        ref: "./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts packages/paja/src/browser-host.test.ts packages/services/src/outbox-service.test.ts"
        status: pass
      - kind: other
        ref: "corepack pnpm --filter @kehto/paja type-check"
        status: pass
    human_judgment: false
  - id: D3
    description: "Paja retains its identity/outbox-only composition, existing relay bootstrap path, and target CORS diagnostic call after frame navigation."
    requirement: PAJA-02
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-host.test.ts#keeps the private social cache inside the established identity and outbox host boundary"
        status: pass
    human_judgment: false

metrics:
  duration: 6 min
  completed: 2026-07-24
status: complete
---

# Phase 102 Plan 03: Deterministic Paja Social Cache Summary

**Paja now deterministically validates replaceable follows, isolates active-account cache warm races, and merges bounded cached profile results without changing standard OUTBOX transport truth.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-24T14:13:14Z
- **Completed:** 2026-07-24T14:19:17Z
- **Tasks:** 2/2 complete
- **Files modified:** 3

## Accomplishments

- Rejected invalid, wrong-account, malformed, and unverified contact-list candidates; accepted only exact 64-hex `p` tags, normalized/deduplicated their keys, and chose kind-3 replacements by timestamp then lexical event ID.
- Proved signed-out, empty-follow, account-switch, and repeated-refresh cases keep follows request-correlated and prevent obsolete background profile writes from changing the active account snapshot.
- Completed cache-aware OUTBOX merge coverage for NIP-style filters and limits, duplicate event IDs, degraded base results, router-operation delegation, and static Paja host composition/CORS diagnostic wiring.

## Task Commits

Each TDD task was committed as a RED/GREEN pair:

1. **Task 1: Make contact selection and active-account warm behavior deterministic** — `ef643606` (`test`, RED) and `1f959ef8` (`feat`, GREEN)
2. **Task 2: Complete cache-aware OUTBOX merge semantics and host-boundary guards** — `e533b4e7` (`test`, RED) and `ba2e0b63` (`feat`, GREEN)

## Files Created/Modified

- `packages/paja/src/browser-social-cache.ts` — exact contact-key validation, deterministic replaceable-event ordering, account/generation safety, and bounded cached-result selection.
- `packages/paja/src/browser-social-cache.test.ts` — deterministic contact boundaries, races, filters/limits, base/cache dedupe, degraded-result, and router-delegation regressions.
- `packages/paja/src/browser-host.test.ts` — source guard for private social-cache composition, standard identity/outbox services, and retained target-CORS boot wiring.

## Protocol Conformance

The recorded Phase 102 authority remains applicable: NAP-IDENTITY at `6461e4b37c29dc09a20dff35d9515889c4433874` is byte-identical to the captured `napplet/naps` master document and the read-only identity follows behavior is conformant. Pinned NAP-OUTBOX `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e`, together with installed `@napplet/nap@0.28.0` types, governs query/result behavior under the already-recorded upstream-drift disposition; no current-master OUTBOX conformance claim is made. NIP-01/NIP-02 replacement and contact-tag behavior is applied through deterministic selection and exact public-key validation.

## Decisions Made

- Require the supplied account key and every accepted `p` tag to be exactly 64 hexadecimal characters before lowercase normalization. Trimming boundary-adjacent input would allow invalid identifiers into a follow set.
- Keep correlated `getFollows` responses bound to their supplied account key while accepting background writes only when their generation and active account still agree.
- Respect a query filter's limit when adding cached values, reuse Paja's existing filter helper, and keep the base router's event representation and incomplete/error fields authoritative.

## TDD Gate Compliance

- Task 1 RED failed on malformed contact tags before the validation hardening and passed after the GREEN implementation.
- Task 2 RED failed because the decorator added more cached values than a `limit: 1` filter permits and passed after bounded cache selection was implemented.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Applied NIP-style filter limits to cached profile additions**
- **Found during:** Task 2 RED verification
- **Issue:** The cache reused event-level matching but could append more cached profile values than an original filter's `limit`, diverging from the bounded OUTBOX query contract.
- **Fix:** Added per-filter cached-result limiting while retaining the existing Paja filter helper, base-event precedence, and exact base degradation fields.
- **Files modified:** `packages/paja/src/browser-social-cache.ts`, `packages/paja/src/browser-social-cache.test.ts`
- **Verification:** Focused cache/host/outbox tests passed (43 tests); Paja type-check passed.
- **Committed in:** `ba2e0b63`

**2. [Rule 3 - Blocking environment] Used Corepack for the repository-pinned pnpm command**
- **Found during:** Task 2 verification
- **Issue:** `pnpm` is not available on the executor PATH, while the plan requires Paja type checking through the repository package manager.
- **Fix:** Ran `corepack pnpm --filter @kehto/paja type-check` without installing or modifying dependencies.
- **Files modified:** None
- **Verification:** Paja TypeScript check completed successfully.
- **Committed in:** Not applicable; verification-environment adjustment only.

**3. [Rule 1 - Metadata] Corrected the plan-decision phase labels in state tracking**
- **Found during:** Post-summary state update
- **Issue:** The state helper recorded the two Plan 03 decisions as `[Phase ?]` because its `--summary` invocation supplies no phase identifier.
- **Fix:** Corrected both labels to `[Phase 102]` before committing the state/roadmap metadata.
- **Files modified:** `.planning/STATE.md`
- **Verification:** Both new decision entries identify Phase 102.
- **Committed in:** `e819f7d4`

**Total deviations:** 3 (1 correctness hardening, 1 blocking environment adjustment, 1 metadata correction).
**Impact on plan:** All corrections preserve the planned private standard-NAP composition and add no public API, ACL, relay-client, Writer, or Blossom scope.

## Issues Encountered

- `npx --no-install aislop scan -d` completed with 0 errors and 0 lint warnings at 85/100 Healthy. Its four remaining `tautological-test` warnings are pre-existing unrelated runtime tests: `packages/runtime/src/discovery.test.ts` and `packages/runtime/src/dispatch.test.ts`. They were not changed under this Paja-only plan.

## Known Stubs

None.

## User Setup Required

None - no external service configuration is required.

## Next Phase Readiness

- Plan 102-04 can run the reserved Chromium/browser-inclusive and full repository gates over the hardened standard identity/OUTBOX path.
- The Paja host still exposes no custom social service, retains the unchanged ACL mapping and one base router, and preserves `reportTargetCorsDiagnostic` target-url boot wiring.
- No Writer path, Phase 103 Blossom feature, package manifest, or lockfile changed.

## Self-Check: PASSED

- Modified product and test files exist at all three recorded paths.
- Task commits `ef643606`, `1f959ef8`, `e533b4e7`, and `ba2e0b63` exist in git history.
- Focused Plan 03 tests, Paja type check, and `git diff --check` passed; the only remaining working-tree change is the intentional unstaged `.planning/config.json` auto-chain setting.
