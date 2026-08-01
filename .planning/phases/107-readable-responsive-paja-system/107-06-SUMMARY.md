---
phase: 107-readable-responsive-paja-system
plan: 06
subsystem: reliability
tags: [paja, timeout, recovery, abort-controller, tdd, playwright, conformance]

requires:
  - phase: 107-readable-responsive-paja-system
    plans: [01, 02, 03, 04, 05]
    provides: Responsive host surfaces, verified pointer loading, external target recovery, runtime tabs, and release documentation
provides:
  - Generation-scoped runtime-tab readiness deadlines with failed-session teardown and stale-ready rejection
  - One external-attempt timeout and AbortController spanning proxy fetch through trusted shell.ready
  - Bounded server-side target fetching using the existing serialized readiness budget
affects: [paja, phase-108, local-authoring, target-recovery]

tech-stack:
  added: []
  patterns:
    - One existing readyTimeoutMs authority drives runtime-tab, browser-attempt, and server-proxy availability bounds
    - Current-generation and registered-source checks make timer, abort, iframe error, promise, and shell.ready races idempotent
    - Failure destroys runtime, session, origin, and readiness ownership before projecting the existing host recovery surface

key-files:
  created: []
  modified:
    - packages/paja/src/browser-runtime-tabs.ts
    - packages/paja/src/browser-host-runtime.ts
    - packages/paja/src/browser-target-frame.ts
    - packages/paja/src/server.ts
    - packages/paja/src/browser-host.ts
    - tests/e2e/paja-runtime-pointer.spec.ts
    - tests/e2e/paja-single-window.spec.ts

key-decisions:
  - "Keep PajaHostConfig.runtime.readyTimeoutMs as the sole availability budget; runtime-pointer hosts now serialize the existing 30-second default instead of a sentinel."
  - "Treat one external navigation as a single owned attempt from browser proxy fetch through trusted current-source shell.ready, clearing its controller without aborting a ready frame."
  - "Preserve NAP-SHELL, NAP-THEME, NIP-5D verified-byte, CSP/prelude, sandbox, capability, routing, and message contracts unchanged."

patterns-established:
  - "Deadline ownership: arm before navigation, settle only the current generation, clear on every terminal path, and unregister failed ownership before recovery appears."
  - "Proxy availability: pass AbortSignal only through the external target branch and use the serialized timeout for the server's untrusted outbound fetch."

requirements-completed: [PAJA-03, PAJA-04]

coverage:
  - id: T1
    description: "A verified runtime iframe that withholds shell.ready times out once, loses failed session ownership, ignores stale readiness, and retries through one new verified generation."
    requirement: PAJA-03
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-runtime-tabs.test.ts"
        status: pass
      - kind: automated_ui
        ref: "tests/e2e/paja-runtime-pointer.spec.ts never-ready and recovery cases"
        status: pass
    human_judgment: false
  - id: T2
    description: "A server target fetch that never completes returns a stable 502 timeout diagnostic and releases controller/timer resources."
    requirement: PAJA-03
    verification:
      - kind: unit
        ref: "packages/paja/src/server.test.ts and packages/paja/src/options.test.ts"
        status: pass
    human_judgment: false
  - id: T3
    description: "The external browser attempt owns one timeout/controller from proxy fetch through trusted readiness, logs one failure, ignores late settlement, and recovers through the unchanged loader."
    requirement: PAJA-04
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-host.test.ts and tests/unit/nip5d-conformance-guard.test.ts"
        status: pass
      - kind: automated_ui
        ref: "tests/e2e/paja-single-window.spec.ts external timeout and recovery cases"
        status: pass
    human_judgment: false

duration: 21m
completed: 2026-07-31
status: complete
---

# Phase 107 Plan 06: Paja Timeout Settlement Summary

**Paja now bounds verified runtime readiness and the complete external target attempt with one serialized timeout authority, tears down failed ownership, and recovers through the unchanged loaders.**

## Performance

- **Duration:** 21m
- **Started:** 2026-07-31T11:19:00Z
- **Completed:** 2026-07-31T11:40:27Z
- **Tasks:** 3
- **Task-owned files modified:** 13

## Accomplishments

- Added per-generation runtime-tab deadlines that settle exactly once, destroy failed runtime/session/origin/readiness ownership, reject stale `shell.ready`, preserve target context, and enable the existing Retry action.
- Reused `PajaHostConfig.runtime.readyTimeoutMs` for runtime-pointer hosts and bounded the server's outbound target fetch with stable 502 timeout diagnostics plus response, replacement, and shutdown cleanup.
- Moved the external deadline before proxy navigation, propagated its AbortSignal through only the external branch, and covered fetch, injection, and trusted readiness as one attempt budget.
- Added RED/GREEN fake-timer, local-server, source-ownership, and Chromium proofs for never-ready and never-settling cases, late settlement safety, focus, one iframe/session, sandbox preservation, and same-loader recovery.

## Task Commits

Each TDD task was committed atomically:

1. **Task 1 RED: never-ready runtime proof** - `eb0ab8a4`
2. **Task 1 GREEN: generation-scoped runtime timeout** - `a7a47583`
3. **Task 2 RED: bounded proxy/server proof** - `34d6b1e6`
4. **Task 2 GREEN: abortable bounded target fetches** - `7fb5c35c`
5. **Task 3 RED: whole external-attempt proof** - `92b0715d`
6. **Task 3 GREEN: external deadline/controller ownership** - `630c2d86`

Supporting quality commit:

- **AI-slop 100/100 restoration:** `bde32cfc`

## Files Modified

- `packages/paja/src/browser-runtime-tabs.ts` - Generation-scoped readiness deadline, failed-session teardown, stale safety, and retryable settlement.
- `packages/paja/src/browser-runtime-tabs.test.ts` - Fake-timer single-fire/cancellation and source contract coverage.
- `packages/paja/src/browser-host-runtime.ts` - Whole external-attempt timeout, AbortController lifecycle, idempotent failure, trusted-ready settlement, and host teardown.
- `packages/paja/src/browser-host.ts` - External controller ownership, current-source ready cleanup, pagehide cleanup, and extracted message listener.
- `packages/paja/src/browser-host.test.ts` - Deadline/controller/source/session/provenance guards.
- `packages/paja/src/browser-target-frame.ts` - Optional AbortSignal transport for only the external proxy request.
- `packages/paja/src/options.ts` and `options.test.ts` - Production readiness default for runtime-pointer host config.
- `packages/paja/src/server.ts` and `server.test.ts` - Bounded outbound target fetch, stable diagnostic, and lifecycle cleanup proof.
- `packages/paja/src/node-compat.d.ts` - Existing local Node shim aligned with the response lifecycle and connection-close methods used by the bounded proxy.
- `tests/e2e/paja-runtime-pointer.spec.ts` - Real verified-byte never-ready, stale-ready, cleanup, and retry proof.
- `tests/e2e/paja-single-window.spec.ts` - Never-settling browser proxy, one-log settlement, focus, sandbox, and same-loader retry proof.

## Decisions Made

- `readyTimeoutMs` remains the only timeout/config surface. No new option, public export, package, or protocol field was introduced.
- Runtime-pointer verified bytes, CSP injection, namespace prelude order, register-before-srcdoc, and `sandbox="allow-scripts"` without `allow-same-origin` remain unchanged.
- External trusted readiness clears controller ownership without aborting the live ready frame; every failure or destroy path aborts first and unregisters failed ownership before showing recovery.
- The inherited upload-domain defect 28 remains outside this plan and was neither repaired nor masked.

## Authority and Conformance Evidence

- **Plan base SHA:** `8dae63fdbdfde775363a6f3a3d5e60ef5decc95e`.
- **Current NAP authority:** `napplet/naps` `master` at `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`.
- **Current NIP-5D draft authority:** `nostr-protocol/nips` PR 2303 head at `eb45dfd7335b7f88cb53781984c553581d2b4c34` (`dskvr/nips`, `nip/5d`).
- Re-read immutable NAP-SHELL, NAP-THEME, `projections/web.md`, and NIP-5D clauses covering the one-shot `shell.ready`/`shell.init` lifecycle, current `MessageEvent.source`, verified bytes through `srcdoc`, host-injected CSP/bootstrap outside signed bytes, and `allow-scripts` without same-origin.
- **Result:** the live refs match `107-VERIFICATION.md`; no semantic contradiction or missing decision exists. This plan changes availability settlement only and remains conformant.
- The research heading was already `## Open Questions (RESOLVED)` at the immutable plan base with its explicit no-blocker resolution intact, so no duplicate metadata edit was made.

## Verification

- Task-level RED gates failed for the intended reasons: missing runtime deadline factory/loading forever, pointer timeout sentinel, unbounded server fetch, and external proxy fetch loading forever.
- Focused final Vitest/conformance matrix - 7 files, 76/76 tests passed.
- `corepack pnpm --filter @kehto/paja build` - passed.
- `corepack pnpm --filter @kehto/paja type-check` - passed.
- Runtime-pointer Chromium timeout/recovery cases - 2/2 passed.
- External-target Chromium timeout/recovery cases - 3/3 passed.
- Exact-head repository `corepack pnpm build` - 32/32 tasks passed.
- Exact-head repository `corepack pnpm type-check` - 17/17 tasks passed.
- Exact-head repository `corepack pnpm test:unit` - 130 files, 1583/1583 tests passed.
- `aislop@0.12.0 scan --changes --base 8dae63fdbdfde775363a6f3a3d5e60ef5decc95e` - 100/100, zero issues.
- `git diff --check` - passed.
- Existing `.changeset/readable-responsive-paja.md` continues to carry the Phase 107 `@kehto/paja` patch release intent; no direct version metadata changed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Kept the existing recovery fixture usable after enabling the real pointer timeout**

- **Found during:** Task 1 GREEN Chromium verification
- **Issue:** The existing recovery fixture serialized a `1ms` sentinel that became a real deadline and raced its unrelated resolver/error assertions.
- **Fix:** Gave that fixture a bounded 2000ms readiness budget while the new never-ready case uses the explicit 100ms proof.
- **Files modified:** `tests/e2e/paja-runtime-pointer.spec.ts`
- **Committed in:** `a7a47583`

**2. [Rule 3 - Blocking] Aligned the local Node compatibility declarations with bounded proxy lifecycle methods**

- **Found during:** Task 2 GREEN type-check
- **Issue:** The repository's minimal `node:http` declarations omitted response close events, response writes, and connection-close methods already provided by the runtime and required for deterministic cleanup tests.
- **Fix:** Extended the local compatibility declarations only for those existing Node methods.
- **Files modified:** `packages/paja/src/node-compat.d.ts`
- **Committed in:** `7fb5c35c`

**3. [Rule 3 - Blocking] Restored the pinned AI-slop gate to 100/100**

- **Found during:** Final quality gate
- **Issue:** External controller wiring pushed `installPajaHost` over the configured 150-line function threshold, scoring 99/100.
- **Fix:** Extracted the unchanged registered-source message listener into a focused helper and reran unit, type, build, both Chromium paths, and the scanner.
- **Files modified:** `packages/paja/src/browser-host.ts`
- **Committed in:** `bde32cfc`

**4. [Rule 3 - Blocking] Normalized inconsistent generated GSD position metadata**

- **Found during:** Plan closeout
- **Issue:** Canonical handlers counted 6/7 summaries but advanced the body to Plan 2, left the frontmatter at 0 percent, emitted `Phase ?` decision labels, and malformed the roadmap row.
- **Fix:** Preserved handler-written metrics/session/summary counts, set Plan 6 of 7 and 86 percent, labeled decisions as Phase 107, retained Plan 107-07 as ready to execute, and restored the roadmap row format.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Committed in:** plan closeout commit

---

**Total deviations:** 4 auto-fixed (1 correctness, 3 blocking quality/type/tracking issues)
**Impact on plan:** All fixes stay inside the timeout lifecycle and test/tooling boundary. No protocol, presentation, dependency, schema, auth, package-version, or release scope was added.

## Issues Encountered

- Restricted execution could not bind loopback ports or expose `pnpm` to Turbo/Playwright child processes. The same repository commands passed with approved local-server execution and a temporary Corepack shim under `/tmp`; no repository dependency or runtime change was needed.
- The Paja build retains its pre-existing `@kehto/nip` side-effects warning while succeeding; this plan did not change package side-effect metadata.

## Known Stubs

None. Empty/null assignments in the touched runtime files are lifecycle cleanup state, and fixture arrays are populated by real test traffic.

## Threat Mitigations

- Runtime and external deadlines settle only a matching current generation; stale timer, promise, iframe error, or readiness callbacks cannot mutate a newer attempt.
- Failed registered windows are destroyed and removed from runtime, session, origin, and ready ownership before recovery UI is shown.
- Browser and server requests to untrusted target availability are abortable and bounded, with timers/controllers cleared on success, error, replacement, client disconnect, and shutdown.
- Verified-byte content, CSP/prelude order, current-source trust, sandbox policy, messages, capabilities, routing, identity, and authorization remain unchanged.
- No new endpoint, auth path, file-access boundary, schema, or unplanned threat surface was introduced.

## User Setup Required

None.

## Next Phase Readiness

- Plan 107-07 can run the final verification-gap closeout against complete timeout settlement evidence.
- Phase 108 retains exclusive ownership of feed/profile recovery behavior.
- Inherited upload-domain defect 28 remains open and unchanged.

## Self-Check: PASSED

- All 13 task-owned modified files exist; the plan summary exists at the required path.
- All seven RED/GREEN/quality commits exist on `milestone/v1.30-visual-recovery` with the required OpenAI Codex co-author trailer.
- PAJA-03 and PAJA-04 coverage, exact authority refs, verification totals, deviation evidence, no-stub result, and unchanged protocol/security boundaries are recorded.

---
*Phase: 107-readable-responsive-paja-system*
*Completed: 2026-07-31*
