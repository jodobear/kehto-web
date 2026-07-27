---
phase: 105-published-convention-adoption-and-host-flows
plan: 08
subsystem: playground intent host
tags: [playground, nap-intent, verified-manifest, retained-delivery]
requires:
  - phase: 105-05
    provides: "Published NAP-INTENT values plus exact installed-contract resolver policy."
  - phase: 105-06
    provides: "Persistent verified-install and retained-target patterns proven in Paja."
provides:
  - "Persistent resolver-verified playground install catalog independent of live iframes."
  - "Retained source-bound playground intent controller with current-generation exactly-once delivery."
  - "Catalog-backed playground intent service with fail-closed chooser and explicit-target policy."
affects: [105-09-playground-profile-flow, playground-browser-host]
tech-stack:
  added: []
  patterns: [verified-install-catalog, retained-target-controller, source-bound-ready-delivery]
key-files:
  created:
    - apps/playground/src/installed-napplet-catalog.ts
    - apps/playground/src/playground-intent-controller.ts
    - tests/unit/playground-installed-catalog.test.ts
    - tests/unit/playground-intent-controller.test.ts
  modified:
    - apps/playground/src/shell-host.ts
    - apps/playground/src/main.ts
key-decisions:
  - "Resolver-verified manifest facts and restart descriptors persist independently of frames, sessions, and source generations."
  - "Only a registered current `shell.ready` source can receive a target-only `intent.deliver`; the host exposes no INC route."
  - "Playground remains fail-closed for ambiguous chooser and explicit handler selections until Plan 09 supplies live user policy."
patterns-established:
  - "Install catalog changes notify the resolver by archetype while frame replacement clears only live generation state."
  - "Retained delivery revalidates the exact installed manifest contract before opening a cold target."
requirements-completed: [PKG-01, ARCH-03]
coverage:
  - id: D1
    description: "Verified playground installations remain eligible for discovery after frame teardown and disappear only on explicit uninstall."
    requirement: PKG-01
    verification:
      - kind: unit
        ref: tests/unit/playground-installed-catalog.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: "Playground retains, starts, source-binds, and delivers an accepted intent exactly once with fail-closed target selection."
    requirement: ARCH-03
    verification:
      - kind: unit
        ref: tests/unit/playground-intent-controller.test.ts
        status: pass
      - kind: unit
        ref: tests/unit/playground-shell-host-proxy.test.ts
        status: pass
    human_judgment: false
metrics:
  duration: 13m
  completed: 2026-07-27
status: complete
---

# Phase 105 Plan 08: Playground Verified Catalog and Retained Intent Controller Summary

**Playground now resolves handlers from persistent verified manifests and delivers accepted intents once to a current `shell.ready` target source.**

## Performance

- **Duration:** 13m
- **Started:** 2026-07-27T09:40:00Z
- **Completed:** 2026-07-27T09:53:38Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments

- Added an immutable, serializable installed catalog that records only resolver-verified aggregate, manifest-contract, and restart facts; live frame lifecycle cannot alter availability.
- Inserted installations immediately after successful resolver verification, added explicit uninstall/default discovery notifications, and retained the lossless manifest adapter.
- Composed `createCatalogIntentResolver`, `createIntentService`, and a retained target controller before shell creation so `intent` is present in each frozen playground shell environment.
- Bound target readiness and `intent.deliver` to the registered current iframe source, with replacement/retry/current-generation checks and no INC delivery path.

## NAP Authority

Checked `napplet/naps` NAP-INTENT PR #91 head `a718915ddefa2f03a0126579601f59d8bd86f7c4` at `naps/NAP-INTENT.md`. This implementation is conformant with manifest-backed availability, acceptance-before-start, source-independent retention, target-ready delivery, runtime-attested sender, exact compatible selection, and the required absence of a visible INC dependency.

## Verification

- `pnpm exec vitest run tests/unit/playground-installed-catalog.test.ts tests/unit/playground-intent-catalog.test.ts tests/unit/playground-shell-host-proxy.test.ts` — passed (7 tests).
- `pnpm exec vitest run tests/unit/playground-intent-controller.test.ts tests/unit/playground-installed-catalog.test.ts tests/unit/playground-shell-host-proxy.test.ts` — passed (9 tests).
- Wave 6 aggregate Vitest gate — passed (7 files, 22 tests).
- `pnpm --filter @kehto/playground build` — passed.
- `git diff --check` — passed.
- `npx --no-install aislop scan -d` — completed with the existing 71/100 warning baseline and no errors.

## Task Commits

1. **Task 1: Keep a verified profile candidate installed after frame close** — `c343cd5` (test), `ded3572` (feat)
2. **Task 2: Select, retain, start, and deliver through playground** — `1f3c65f` (test), `9ffb9aa` (feat)

## Files Created/Modified

- `apps/playground/src/installed-napplet-catalog.ts` — persistent verified manifest records, exact catalog entries, defaults, and discovery changes.
- `apps/playground/src/playground-intent-controller.ts` — immutable retention and bounded current-generation delivery policy.
- `apps/playground/src/shell-host.ts` — verified catalog insertion, target lifecycle callbacks, registered-source ready mapping, and target-only send.
- `apps/playground/src/main.ts` — catalog resolver and intent-service composition before shell boot.
- `tests/unit/playground-installed-catalog.test.ts` — installation persistence and explicit-uninstall coverage.
- `tests/unit/playground-intent-controller.test.ts` — cold/replacement/exactly-once and fail-closed selection coverage.

## Decisions Made

- Kept catalog authority separate from browser state: only `resolvePlaygroundNapplet` output becomes an installation record, and only explicit uninstall removes it.
- Kept user policy fail-closed: stale defaults, cancelled/invalid choice, and every explicit handler request reject until a user authorization surface exists.
- Used a real `intent.deliver` host push only after current source registration rather than adapting the pre-existing INC route.

## Deviations from Plan

None - plan execution stayed within the catalog/controller/host composition scope.

## Issues Encountered

- The mandated `pnpm exec tsc -p apps/playground/tsconfig.json --noEmit` was run twice but remains blocked by unrelated existing errors: missing `dm:read`/`dm:write` entries in `acl-panel.ts` and `shell-host.ts`, plus direct-package resolution failures for `@napplet/core` and `@napplet/nap/theme/types` in `demo-hooks.ts`/`shell-host.ts`. The new controller and composition introduced no TypeScript diagnostics; the focused tests and Vite build pass. This out-of-scope blocker is tracked in `deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 09 can wire the live feed/profile UI onto an installed, cold-start-capable profile handler without deriving availability from frames. It must preserve the controller's exact-contract, ready-source, and target-only delivery seams.

## Self-Check: PASSED

- All six planned implementation/test artifacts exist.
- Task commits `c343cd5`, `ded3572`, `1f3c65f`, and `9ffb9aa` exist and each has the required `Co-Authored-By: Codex <noreply@openai.com>` trailer.
- Stub scan found no placeholder data or incomplete rendering path in the plan-owned files.
