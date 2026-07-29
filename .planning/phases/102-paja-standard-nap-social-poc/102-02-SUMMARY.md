---
phase: 102-paja-standard-nap-social-poc
plan: "02"
subsystem: paja-social-cache
tags: [paja, nap-identity, nap-outbox, nostr, vitest, playwright]

requires:
  - phase: 102-01
    provides: "Fail-closed NAP authority evidence, installed @napplet/nap@0.28.0 type contracts, and configured Chromium readiness."
provides:
  - "Private, account-scoped Paja follows and kind-0 profile cache behind existing identity and OUTBOX services."
  - "Request-start public-key regression coverage for the generic identity follows provider seam."
  - "Deterministic standard-envelope Paja iframe tracer for the Plan 04 browser gate."
affects: [102-03, 102-04, Paja browser verification, Writer integration]

tech-stack:
  added: []
  patterns:
    - "Compose a private cache around one existing OUTBOX router; warm and decorate it without adding a service namespace."
    - "Capture the signer public key before awaits and pass that snapshot through a standard identity provider result."

key-files:
  created:
    - packages/paja/src/browser-social-cache.ts
    - packages/paja/src/browser-social-cache.test.ts
  modified:
    - packages/paja/src/browser-relay-runtime.ts
    - packages/paja/src/browser-adapter.ts
    - packages/services/src/identity-service.test.ts
    - tests/e2e/paja-single-window.spec.ts

key-decisions:
  - "Keep follows and kind-0 profiles in Paja-only memory, composed through existing identity and OUTBOX services rather than a social namespace."
  - "Protect the generic identity contract with a test-only deferred-signer regression; identity-service.ts remains unchanged."
  - "Use corepack's repository-pinned pnpm command when pnpm is absent from the agent PATH."

patterns-established:
  - "A provider called after async signer resolution must receive the public key captured at request start, not a later mutable signer selection."
  - "Focused Paja builds may use corepack pnpm without modifying the locked dependency tree."

requirements-completed: [PAJA-01, PAJA-02, PAJA-03]

coverage:
  - id: D1
    description: "Private Paja social cache refreshes verified follows and kind-0 profiles through one base OUTBOX router while standard identity and OUTBOX services retain their envelopes."
    requirement: PAJA-02
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-social-cache.test.ts via ./node_modules/.bin/vitest run packages/paja/src/browser-social-cache.test.ts packages/services/src/identity-service.test.ts"
        status: pass
      - kind: other
        ref: "corepack pnpm --filter @kehto/paja build"
        status: pass
    human_judgment: false
  - id: D2
    description: "identity.getFollows binds the host provider and result correlation to account A when the mutable signer changes to B while getPublicKey is pending."
    requirement: PAJA-01
    verification:
      - kind: unit
        ref: "packages/services/src/identity-service.test.ts#uses the public key captured at request start when the signer changes"
        status: pass
    human_judgment: false
  - id: D3
    description: "Paja's deterministic iframe tracer sends only standard identity and OUTBOX envelopes and checks the opaque-origin CORS diagnostic path."
    requirement: PAJA-03
    verification:
      - kind: other
        ref: "tests/e2e/paja-single-window.spec.ts; browser execution is owned by Plan 102-04"
        status: unknown
    human_judgment: true
    rationale: "The plan explicitly reserves the configured Chromium browser run for Plan 102-04."

metrics:
  duration: 3 min
  completed: 2026-07-24
status: complete
---

# Phase 102 Plan 02: Standard Paja Social Tracer Summary

**Paja now keeps a private memory-only follows/profile cache behind standard identity and OUTBOX services, while the generic identity service is regression-tested to preserve request-start account correlation.**

## Performance

- **Duration:** 3 min continuation (Task 1 was committed before this checkpoint continuation)
- **Started:** 2026-07-24T14:03:44Z
- **Completed:** 2026-07-24T14:07:42Z
- **Tasks:** 2/2 complete
- **Files modified:** 6 product and test files

## Accomplishments

- Delivered the Task 1 Paja tracer: a private account-scoped social cache, verified contact-list loader, one-router adapter composition, and a deterministic standard-envelope iframe tracer with opaque-origin CORS fixture coverage.
- Added a deferred-signer regression proving `identity.getFollows` passes account A's request-start public key to its host provider and returns the original correlated result after the active signer switches to B.
- Preserved the generic service implementation, existing ACL/service names, and Writer scope fence; no Writer source, test, fixture, smoke, or documentation path changed.
- Re-ran focused cache and identity tests (20 tests) and built `@kehto/paja` through `corepack pnpm` successfully.

## Task Commits

Each task was committed atomically:

1. **Task 1: Deliver one signed-in identity-to-followed-profile path through Paja** — `f5b0590f` (`test`, RED) and `975efad8` (`feat`, GREEN)
2. **Task 2: Assert the existing request-start identity snapshot contract** — `2ffc6fbd` (`test`)

**Follow-up correction:** `23e73635` (`fix`) removes an unused type import found by the plan quality scan.

## Files Created/Modified

- `packages/paja/src/browser-social-cache.ts` — private memory-only, account-scoped follows/profile snapshot and base-router decorator.
- `packages/paja/src/browser-social-cache.test.ts` — focused verified-contact, snapshot, merge, and standard-result regressions.
- `packages/paja/src/browser-relay-runtime.ts` — host-owned captured-account kind-3 loader using existing bootstrap relays.
- `packages/paja/src/browser-adapter.ts` — creates one base OUTBOX router, composes the private cache, and starts a non-blocking warm refresh.
- `packages/services/src/identity-service.test.ts` — deferred signer-switch request-snapshot regression.
- `tests/e2e/paja-single-window.spec.ts` — deterministic iframe identity/OUTBOX tracer with `Origin: null` CORS-probe completion assertion for Plan 102-04.

## Protocol Conformance

The source-adjacent authority note cites Plan 102-01 evidence: pinned NAP-IDENTITY `6461e4b37c29dc09a20dff35d9515889c4433874` is byte-identical to the recorded `napplet/naps` master path, and the read-only `identity.getFollows` request/result behavior is conformant to that authority. Pinned NAP-OUTBOX `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e` with installed `@napplet/nap@0.28.0` types governs the standard query/result behavior under documented upstream drift; this plan makes no current-master OUTBOX conformance claim.

## Decisions Made

- Kept social data as private Paja memory state and passed it only through existing `identity` and `outbox` service seams, so the iframe receives no social namespace, signer authority, direct relay access, or custom envelope.
- Added the signer-switch scenario as a regression only. The generic `identity-service.ts` already captures the current signer before awaiting its key, and the plan explicitly prohibits expanding that source-file scope.
- Used `corepack pnpm` for the Paja build because `pnpm` was absent from the agent PATH. This used the repository's existing locked toolchain and did not install or alter dependencies.

## TDD Gate Compliance

- Task 1 has the required RED (`f5b0590f`) followed by GREEN (`975efad8`) commits.
- Task 2 is a test-only regression against an intentionally unchanged generic service. Its newly added assertion passed immediately because the existing implementation already fulfills the captured-key contract; the plan prohibits a redundant source edit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Code quality] Removed an unused `NostrFilter` type import from the private social cache**
- **Found during:** Overall focused quality scan after Task 2
- **Issue:** The new cache module produced the only Plan 102-02 lint warning in `aislop`.
- **Fix:** Removed the unused type-only import without changing cache behavior.
- **Files modified:** `packages/paja/src/browser-social-cache.ts`
- **Verification:** Focused cache and identity tests passed; `corepack pnpm --filter @kehto/paja build` passed; the rerun `aislop` scan reported zero lint warnings.
- **Committed in:** `23e73635`

**2. [Rule 3 - Blocking environment] Used Corepack for the repository-pinned pnpm command**
- **Found during:** Task 1 verification continuation and final focused build
- **Issue:** `pnpm` was not available on the agent PATH, while the plan's build command requires pnpm.
- **Fix:** Ran `corepack pnpm --filter @kehto/paja build`, using the existing dependency tree without installing, replacing, or updating a package.
- **Files modified:** None
- **Verification:** The Paja tsup and declaration builds completed successfully.
- **Committed in:** Not applicable; verification-environment adjustment only.

**Total deviations:** 2 (1 code-quality correction, 1 blocking environment adjustment).
**Impact on plan:** Both changes preserve the planned standard-NAP composition and focused scope; no protocol, package, ACL, or Writer surface expanded.

## Issues Encountered

- The Paja build emitted an existing `@kehto/nip` side-effect warning but completed successfully.
- The final `npx --no-install aislop scan -d` reported `85 / 100 Healthy`, with zero errors and zero lint warnings after the correction. Its four remaining `tautological-test` warnings are pre-existing, unrelated runtime-test findings documented in `deferred-items.md`; they were not modified under this Paja/identity plan.

## Known Stubs

| File | Line | Stub | Reason |
| --- | ---: | --- | --- |
| `packages/services/src/identity-service.test.ts` | 384 | `TODO(12-10)` for a runtime-level ACL-denial integration test | Pre-existing test-scope follow-up; it does not block the new request-start provider regression or Paja tracer. |

## User Setup Required

None - no external service configuration is required.

## Next Phase Readiness

- Plan 102-03 can build on the private Paja social-cache composition without exposing it as a public package or napplet service.
- Plan 102-04 owns the configured Chromium execution of the deterministic browser tracer and the final browser-inclusive gate.
- No Writer work is authorized by this plan.

## Self-Check: PASSED

- All six planned product/test files and this summary exist at their recorded paths.
- Task commits `f5b0590f`, `975efad8`, `2ffc6fbd`, and follow-up correction `23e73635` exist and are ancestors of the current plan head.
