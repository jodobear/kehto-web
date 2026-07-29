---
phase: 102-paja-standard-nap-social-poc
plan: "04"
subsystem: paja-social-cache-release
status: complete
tags: [paja, nap-identity, nap-outbox, playwright, chromium, documentation, changesets]

requires:
  - phase: 102-03
    provides: "Deterministic private Paja social-cache validation, race isolation, and degraded OUTBOX merge semantics."
provides:
  - "Consumer and package documentation for Paja's private active-account, memory-only social cache behind standard identity and OUTBOX messages."
  - "A minor @kehto/paja changeset and corrected 0.8.2 Paja package-doc manifest row."
  - "A passing fresh Chromium suite, including the deterministic Paja social tracer using standard identity and OUTBOX messages."
affects: [103-paja-blossom-rail-poc, 104-writer-integration, Paja release review]

tech-stack:
  added: []
  patterns:
    - "Use a complete NIP-07 test signer and explicitly connect it before asserting signed-in Paja identity behavior."
    - "Run Playwright with temporary Corepack shims when root scripts invoke nested pnpm commands but pnpm is absent from PATH."

key-files:
  created:
    - .changeset/paja-standard-nap-social-cache.md
    - .planning/phases/102-paja-standard-nap-social-poc/102-04-SUMMARY.md
  modified:
    - packages/paja/README.md
    - docs/packages/paja.md
    - docs/how-tos/paja-local-authoring.md
    - docs/packages/firewall.md
    - tests/e2e/paja-single-window.spec.ts
    - .planning/phases/102-paja-standard-nap-social-poc/deferred-items.md

key-decisions:
  - "NAP-IDENTITY 6461e4b37c29dc09a20dff35d9515889c4433874 remains byte-identical to the recorded napplet/naps master document; the standard identity behavior is conformant to that authority."
  - "Pinned NAP-OUTBOX 4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e and installed @napplet/nap@0.28.0 types remain the Phase 102 PoC contract because current napplet/naps master lacks NAP-OUTBOX.md; this is upstream drift, not a current-master OUTBOX conformance claim."
  - "The real Paja/Writer smoke remains sequenced after Phase 103; Phase 102 proves only its deterministic Paja fixture and standard wire boundary."

requirements-completed: [PAJA-01, PAJA-02, PAJA-03]

coverage:
  - id: D1
    description: "Paja's consumer documentation and minor release record describe standard identity.getFollows and outbox.query mediation while keeping the social cache private, account-scoped, memory-only, and degradation-preserving."
    requirement: PAJA-02
    verification:
      - kind: other
        ref: "Task 1 commit 3f18d01a; required documentation/content assertions passed"
        status: pass
      - kind: other
        ref: "corepack pnpm docs:check"
        status: pass
    human_judgment: false
    rationale: "The Paja content is present and the repository-wide audit passes after repairing the pre-existing @kehto/firewall package-doc version row."
  - id: D2
    description: "The deterministic Paja iframe tracer connects a complete NIP-07 fixture and proves standard identity follows plus OUTBOX kind-0 result routing without an opaque-origin target-CORS false positive."
    requirement: PAJA-01
    verification:
      - kind: e2e
        ref: "tests/e2e/paja-single-window.spec.ts#routes standard identity follows and OUTBOX profile queries without a target-CORS false positive"
        status: pass
      - kind: e2e
        ref: "corepack pnpm test:e2e (fresh Kehto harness :4173 and playground :4174 servers)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The full Phase 102 Paja implementation builds, type-checks, and passes 1,400 unit tests while preserving the limited contribution scope and no-new-package rule."
    requirement: PAJA-03
    verification:
      - kind: other
        ref: "corepack pnpm build && corepack pnpm type-check"
        status: pass
      - kind: unit
        ref: "corepack pnpm test:unit (107 files, 1,400 tests)"
        status: pass
      - kind: other
        ref: "git diff --check and Phase 102 explicit scope review"
        status: pass
    human_judgment: false

metrics:
  duration: 9 min
  completed: 2026-07-24
---

# Phase 102 Plan 04: Paja Social Cache Release Closeout Summary

**Paja's standard identity/OUTBOX social-cache boundary is release-documented with a minor changeset, and fresh Chromium evidence proves the deterministic signed-in follows/profile path without crossing into Writer or Blossom work.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-24T16:09:18Z
- **Completed:** 2026-07-24T16:18:47Z
- **Tasks:** 2/2 complete
- **Files modified:** 5 Phase 102 product, test, documentation, and changeset files; 2 closeout records

## Accomplishments

- Verified Task 1 commit `3f18d01a`, which synchronizes the Paja README, package guide, and local-authoring guide; repairs the Paja manifest row to `0.8.2`; preserves the integrated opaque `Origin: null` target-CORS guidance and `paja.target.cors.error` diagnostic; and adds the sole `@kehto/paja` minor changeset.
- Corrected the deterministic Paja browser tracer so it installs a complete NIP-07 signer after the host page is ready and explicitly connects it before asserting standard `identity.getPublicKey`, `identity.getFollows`, and `outbox.query` behavior.
- Ran `corepack pnpm test:e2e` against no pre-existing listeners on ports 4173/4174. Playwright started the configured Kehto `@test/harness` preview at 4173 and `@kehto/playground` preview at 4174; the fresh Chromium run completed with 74 passed and 1 intentionally skipped test.
- Re-ran repository build, type, unit, docs, slop, and diff gates. Build and type-check passed; Vitest passed 107 files and 1,400 tests; `docs:check` passed after repairing the stale firewall package-doc version row; the slop scanner reported no errors or lint warnings; and `git diff --check` passed.
- Kept the contribution scope limited to Phase 102 Paja implementation/tests/docs/changeset work. No Writer path, Phase 103 Blossom implementation, package/dependency change, repository-topology action, or contribution-selection operation was performed.

## Task Commits

1. **Task 1: Document the standard Paja social boundary and add its release record** — `3f18d01a` (`docs`)
2. **Task 2: Run complete Phase 102 gates and record the precise closeout** — `1d4eceee` (`test`, Rule 1 correction to the deterministic browser tracer)
3. **Release-gate repair: Align the stale firewall package-doc manifest row** — `7931b87a` (`docs`, baseline gate repair)

## Files Created/Modified

- `packages/paja/README.md` — consumer-facing standard identity/OUTBOX cache boundary and retained target-CORS guidance.
- `docs/packages/paja.md` — package reference, exact `0.8.2` row, protocol authority/drift language, and retained CORS diagnostic material.
- `docs/how-tos/paja-local-authoring.md` — standard social-message authoring guidance without a custom Paja API.
- `docs/packages/firewall.md` — repaired the pre-existing manifest row from `0.3.9` to the shipped `0.3.10`, restoring the repository docs gate.
- `.changeset/paja-standard-nap-social-cache.md` — sole minor release record for the shipped `@kehto/paja` social-cache behavior.
- `tests/e2e/paja-single-window.spec.ts` — complete NIP-07 fixture and explicit connection for the standard social tracer.
- `.planning/phases/102-paja-standard-nap-social-poc/deferred-items.md` — out-of-scope repository gate findings retained for follow-up.

## Protocol Conformance

NAP-IDENTITY `6461e4b37c29dc09a20dff35d9515889c4433874` is byte-identical to the Phase 102 recorded `napplet/naps` master document, so the read-only standard identity behavior is conformant to that authority. Pinned NAP-OUTBOX `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e`, together with installed `@napplet/nap@0.28.0` declarations, remains the PoC's implementation contract under documented upstream drift: the recorded current-master tree has no `naps/NAP-OUTBOX.md`, so no current-master OUTBOX conformance claim is made.

## Decisions Made

- Retained Paja's social data as an active-account-scoped, memory-only host snapshot. Napplets continue to use only standard `identity.getPublicKey`, `identity.getFollows`, and kind-0 `outbox.query`; matching cache values never erase base `incomplete` or `error` fields.
- Preserved the integrated target-CORS baseline in each existing Paja documentation surface. It remains the opaque-origin `Origin: null` requirement, `GET /__kehto/target-cors.json` diagnostic, and `paja.target.cors.error` message-log remedy, rather than a duplicate social-cache feature.
- Used temporary Corepack shims only for verification because bare `pnpm` is absent from PATH and root scripts invoke nested `pnpm`. This did not install, upgrade, or modify any package or lockfile.
- Kept real Paja/Writer smoke after Phase 103. This plan is deterministic Paja proof only and does not claim a real downstream journey.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Browser-test bug] Connected the deterministic social fixture to a complete NIP-07 signer**
- **Found during:** Task 2 fresh full browser gate
- **Issue:** The new social tracer sent `identity.getPublicKey` before selecting a signer, then supplied an incomplete NIP-07 object that the signer controller correctly rejected because it lacked `signEvent`.
- **Fix:** Installed the signer after Paja host readiness, supplied `signEvent`, clicked the NIP-07 control, and asserted the connected signer before sending standard identity/OUTBOX messages.
- **Files modified:** `tests/e2e/paja-single-window.spec.ts`
- **Verification:** Focused Paja browser spec passed 6/6; the fresh full Chromium suite then passed 74 tests with 1 intentional skip.
- **Committed in:** `1d4eceee`

**2. [Rule 3 - Blocking environment] Supplied temporary Corepack command shims for nested workspace scripts**
- **Found during:** Task 2 initial `corepack pnpm test:e2e` attempt
- **Issue:** Corepack could invoke pnpm, but the root `test:e2e` script invokes a nested bare `pnpm test:build` and no pnpm shim existed on PATH.
- **Fix:** Created an ephemeral Corepack shim directory outside the repository and prepended it only to the verification command PATH.
- **Files modified:** None
- **Verification:** The rerun used the exact repository Playwright configuration and passed the fresh 74-test Chromium suite.
- **Committed in:** Not applicable; verification-environment adjustment only.

**3. [Rule 1 - Metadata] Corrected phase labels emitted by the state helper**
- **Found during:** Task 2 closeout state update
- **Issue:** The state helper recorded both new decisions with its default `[Phase ?]` label despite this plan belonging to Phase 102.
- **Fix:** Replaced the labels with `[Phase 102]` before committing completion metadata.
- **Files modified:** `.planning/STATE.md`
- **Verification:** Both added state decisions now identify Phase 102.
- **Committed in:** Completion metadata commit.

**4. [Rule 3 - Blocking baseline] Repaired stale firewall package-doc version metadata**
- **Found during:** Task 2 repository-wide docs gate
- **Issue:** `docs/packages/firewall.md` retained version `0.3.9` after upstream released `@kehto/firewall` `0.3.10`, causing the mandatory docs audit to fail.
- **Fix:** Aligned the manifest row with `packages/firewall/package.json` and reran the complete docs gate.
- **Files modified:** `docs/packages/firewall.md`
- **Verification:** `corepack pnpm docs:check` passed, including TypeDoc, VitePress, and package-doc audit.
- **Committed in:** `7931b87a`

**Total deviations:** 4 auto-fixed (2 Rule 1 corrections, 2 blocking environment/baseline adjustments).
**Impact on plan:** The corrections strengthen the intended signed-in standard-message proof, preserve accurate state tracking, and restore the mandatory docs gate. They add no public API, service namespace, dependency, Writer path, or Blossom behavior.

## Issues Encountered

- `corepack pnpm docs:check` initially reported one unrelated audit failure: `docs/packages/firewall.md` said `@kehto/firewall` version `0.3.9` while its package manifest is `0.3.10`. The stale baseline row was repaired to `0.3.10`; the complete docs gate then passed.
- `npx --no-install aislop scan -d` completed at `85 / 100 Healthy` with 0 errors and 0 lint warnings. Its four `tautological-test` warnings remain the documented pre-existing findings in `packages/runtime/src/discovery.test.ts` and `packages/runtime/src/dispatch.test.ts`; no Phase 102 file triggered a new warning.
- The Paja build retains its pre-existing `@kehto/nip` ignored-bare-import warning and the documentation site retains its existing chunk-size advisory; both builds completed successfully.

## User Setup Required

None - no external service configuration is required.

## Next Phase Readiness

- Phase 103 can proceed with the documented Paja social boundary and passing deterministic browser proof; it must keep the real Paja/Writer smoke deferred until its Blossom work is complete.
- Repository-wide `pnpm docs:check` is green after the stale firewall package-doc version row was aligned with its `0.3.10` manifest.
- A later focused upstream contribution selects only Phase 102 implementation, test, documentation, and changeset commits onto a clean upstream/main base. It excludes planning artifacts, Graphify output, generated files, unrelated cleanup, and external Writer work.

## Self-Check: PASSED

- Task 1 commit `3f18d01a`, Task 2 correction commit `1d4eceee`, and docs-gate repair commit `7931b87a` exist in git history.
- Required Phase 102 Paja documentation, changeset, browser tracer, and this summary exist at the recorded paths.
- Fresh Playwright, build, type-check, unit, docs, slop, and whitespace gates completed successfully as recorded.
