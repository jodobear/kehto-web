---
phase: 103-paja-blossom-rail-poc
plan: "03"
subsystem: Paja Blossom transport, consent, and host diagnostics
status: complete
source_worktree: /workspace/projects/kehto/paja-blossom-rail
source_branch: feat/103-paja-blossom-rail
requires:
  - "103-01 verified stored-blob result grants"
  - "103-02 single-server BUD-11 transport and lifecycle fencing"
provides:
  - "Configured-only, ordered Blossom replica controller with one retry for transient failures"
  - "Tuple-scoped session consent with safe size and MIME defaults"
  - "Host-only partial-copy diagnostics with standard NAP-UPLOAD results"
affects:
  - packages/paja
  - Phase 103 Plan 04 opaque-iframe proof
  - Phase 103 Plan 05 documentation and release metadata
tech-stack:
  added: []
  patterns:
    - configured-order replica operation with per-operation abort state
    - tuple-keyed in-memory consent cache
    - host-only replica diagnostics outside the NAP result wire shape
key-files:
  created: []
  modified:
    - packages/paja/src/browser-upload.ts
    - packages/paja/src/browser-upload.test.ts
    - packages/paja/src/browser-adapter.ts
    - packages/paja/src/simulation.ts
    - packages/paja/src/browser-host.ts
    - packages/paja/src/browser-host-signer.ts
    - packages/paja/src/browser-host.test.ts
key-decisions:
  - "Only simulation.upload.servers can become upload targets; BUD-03 remains outside the runtime target selector."
  - "The first verified configured-order URL is url and later verified URLs are fallbackUrls; per-replica evidence stays host-only."
  - "Consent keys bind window, signer pubkey, exact ordered target array, normalized MIME class, and effective ceiling."
  - "Cancellation after verification discards every result URL and logs only that durable copies may remain."
patterns-established:
  - "Paja policy rejects before consent, signing, verifier authorization, or network activity."
  - "Paja support remains installed while upload.info.enabled truthfully reflects current signer and configured-server readiness."
requirements-completed: [UPLOAD-02, POC-02]
coverage:
  - id: D1
    description: "Configured sequential replicas retry one transient 5xx, continue after malformed descriptors, and expose only ordered verified URLs."
    requirement: UPLOAD-02
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-upload.test.ts#createPajaUploadRuntime configured replica operations"
        status: pass
      - kind: unit
        ref: "corepack pnpm exec vitest run packages/paja/src/browser-upload.test.ts packages/services/src/http-uploader.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Safe defaults, tuple-scoped consent, truthful availability, and cancellation-safe partial-copy reporting remain inside the host boundary."
    requirement: POC-02
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-host.test.ts#discloses every replica target before authorization and retains partial-copy truth in the host only"
        status: pass
      - kind: unit
        ref: "corepack pnpm exec vitest run packages/paja/src/browser-host.test.ts packages/paja/src/browser-upload.test.ts"
        status: pass
    human_judgment: false
metrics:
  duration: 11m 51s
  tasks_completed: 2
  source_commits: 5
  files_modified: 7
  completed: 2026-07-28
---

# Phase 103 Plan 03: Configured Blossom Replication Summary

Paja now owns a configured-only Blossom replication operation that applies safe pre-egress policy, tuple-scoped consent, verified URL ordering, and honest host-only cancellation diagnostics without extending the standard NAP-UPLOAD wire result.

## Source Preconditions

- Dedicated source worktree: `/workspace/projects/kehto/paja-blossom-rail`
- Branch: `feat/103-paja-blossom-rail`
- The required Plan 103-01 commits `468ea525`, `33719617`, `f1d7cf8b`, and `7664fde6` were ancestors before edits.
- The required Plan 103-02 commits `2775e7c6`, `8670cd92`, `49ca533c`, and `dd4eb4de` were ancestors before edits.
- The source range `dd4eb4de..HEAD` had no existing 103-03 commit before execution.

## Protocol Authority Check

Checked before changes and rechecked against the installed declarations:

| Authority | Exact source | Evidence retained in implementation |
| --- | --- | --- |
| NAP-UPLOAD | `napplet/naps@a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-UPLOAD.md` | Retained shell-owned consent, server selection, signing, and network authority plus existing `upload.info`, `upload.upload`, `upload.status`, `url`, `fallbackUrls`, and string `error` fields. |
| NAP-RESOURCE | `napplet/naps@fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1:naps/NAP-RESOURCE.md` | Retained the existing verified result-grant bridge; no direct iframe resource/network path was added. |
| NAP-BLOSSOM | `napplet/naps@ca1d7ba594e6790785dc770227085d8648d39631:naps/NAP-BLOSSOM.md` | Kept Blossom below high-level upload. BUD-03 discovery cannot create an egress target and no `window.napplet.blossom` surface was added. |
| NAP-SHELL | `napplet/naps@a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-SHELL.md` | Kept capability support separate from runtime readiness: the installed rail remains advertised while `upload.info().rails[0].enabled` reports current availability. |
| Installed declarations | `@napplet/nap@0.29.0`, `dist/upload/types.d.ts` and `dist/resource/types.d.ts` | Confirmed the current result carries `url`, `fallbackUrls`, and `error`, with no per-replica wire field. Replica diagnostics remain host-only. |

Current `napplet/naps` `master` exposes only `naps/NAP-SHELL.md` among the checked document paths. This plan is aligned to the pinned drafts and makes no current-master conformance claim.

## Accomplishments

- Replaced first-server and discovery fallback behavior with a Paja-owned ordered controller over `simulation.upload.servers`. Every configured server is attempted sequentially; only transport failures or HTTP 5xx responses receive one injected 250 ms retry.
- Collected only host-verified replica URLs, assigning the first configured-order success to `url` and later verified successes to `fallbackUrls`; failed replica evidence is a Paja diagnostic, not a NAP field.
- Added a 10 MiB (`10485760`) default ceiling and image MIME baseline. Policy rejects `10485761` bytes, unsupported MIME, and unsafe transfer totals before consent, signing, hashing-dependent authorization, or fetch.
- Added session-memory consent keyed by window, signer pubkey, JSON-preserved server order, normalized MIME, and effective ceiling. The host disclosure names every target, replica count, file metadata, public/durable effect, and exact worst-case transferred bytes.
- Added operation-wide cancellation fencing on signer change and window teardown. Cancellation after a verified replica returns a standard cancelled result without URLs and emits a host message-log warning that durable copies may remain.

## Task Commits

1. **Task 1: Implement ordered configured-replica operations, policy defaults, and tuple consent**
   - `ed8d4e42` `test(103-03): add failing replica and consent contracts`
   - `e00e37ad` `feat(103-03): orchestrate verified configured Blossom replicas`
   - `68869ffd` `refactor(103-03): split replica runtime coordinator`
2. **Task 2: Render replica-aware consent and host-only retained-copy diagnostics**
   - `b9f22222` `test(103-03): define replica consent and cancellation diagnostics`
   - `b7e8cf87` `feat(103-03): disclose replica consent and retained copies`

## Files Created/Modified

- `packages/paja/src/browser-upload.ts` — Configured-order replica coordinator, retry classification, operation cancellation, consent scope, diagnostic types, and standard-result ordering.
- `packages/paja/src/browser-upload.test.ts` — Regression vectors for retries, descriptor continuation, availability, tuple invalidation, exact byte limits, generic host policy, signer change, and partial-copy cancellation.
- `packages/paja/src/simulation.ts` — Safe Blossom defaults: `DEFAULT_BLOSSOM_MAX_BYTES = 10485760` and the image MIME baseline.
- `packages/paja/src/browser-adapter.ts` — Expanded host-only consent shape and filtered host diagnostic callback wiring.
- `packages/paja/src/browser-host-signer.ts` — Ordered target, replica, and exact transfer disclosure in the confirmation prompt.
- `packages/paja/src/browser-host.ts` — `paja.upload.partial-copy` message-log entry stating durable copies may remain.
- `packages/paja/src/browser-host.test.ts` — Static host-boundary guard for disclosure, diagnostics, and absence from the injected namespace.

## Verification

Passed from `/workspace/projects/kehto/paja-blossom-rail` with `PATH=/tmp/kehto-phase103-corepack-bin:$PATH`:

```text
corepack pnpm exec vitest run packages/paja/src/browser-upload.test.ts packages/services/src/http-uploader.test.ts
# 2 files, 31 tests passed

corepack pnpm exec vitest run packages/paja/src/browser-host.test.ts packages/paja/src/browser-upload.test.ts
# 2 files, 26 tests passed

corepack pnpm --filter @kehto/paja type-check
# passed

git diff --check
# passed

git status --short
# empty
```

The Task 1 RED run failed as intended: the previous first-server implementation did not retry or continue to later configured servers, reused no tuple consent, used no safe default policy, and did not cancel active work on signer change. The Task 2 RED run failed as intended because the host did not yet produce `paja.upload.partial-copy` diagnostics.

`npx --no-install aislop scan -d` completed at the existing `85/100 Healthy` baseline with four unrelated tautological-test warnings in `packages/runtime/src/discovery.test.ts` and `packages/runtime/src/dispatch.test.ts`; it reported zero new errors, lint warnings, security findings, or changed-source quality warnings.

## Decisions Made

- Used Paja configuration as the sole upload-target authority. Discovery remains unavailable to the replica target selector.
- Preserved the standard NAP result shape rather than inventing per-replica wire fields; host callbacks carry replica-local outcomes and retained-copy truth.
- Treated an identity-generation change and teardown as operation-stopping causes. Both discard accumulated success URLs before terminal result construction.
- Calculated `worstCaseBytes` exactly as `size * (replicaCount * 3)` and reject overflow rather than displaying a rounded or unsafe value.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Test assertion correctness] Corrected cancellation assertions to prove field absence**
- **Found during:** Task 1 GREEN verification.
- **Issue:** `toMatchObject({ url: undefined, fallbackUrls: undefined })` requires those properties to exist, the opposite of the required cancelled-result guarantee.
- **Fix:** Asserted the standard cancelled fields and used `not.toHaveProperty` for both success URL fields.
- **Files modified:** `packages/paja/src/browser-upload.test.ts`
- **Verification:** Focused Paja and transport unit suites pass.
- **Committed in:** `e00e37ad`

**2. [Rule 3 - Blocking plan/source mapping] Updated the actual confirmation renderer helper**
- **Found during:** Task 1 type-check.
- **Issue:** The plan named `browser-host.ts`, but `confirmPajaRequest()` is implemented in `browser-host-signer.ts`; removing the legacy singular `server` field would otherwise leave the host compilation broken and disclosure stale.
- **Fix:** Updated `browser-host-signer.ts` alongside the planned host files to render ordered targets, replica count, and exact worst-case transfer bytes.
- **Files modified:** `packages/paja/src/browser-host-signer.ts`
- **Verification:** `@kehto/paja` type-check and `browser-host.test.ts` pass.
- **Committed in:** `e00e37ad`

**3. [Rule 1 - Quality regression] Split the replica coordinator after the source-quality scan**
- **Found during:** Final quality scan.
- **Issue:** The initial coordinator left a newly introduced function-length warning and unused import, lowering the scanner score from the inherited 85 baseline to 82.
- **Fix:** Extracted identity refresh, policy preparation, consent, operation execution, and attempt helpers; removed the unused import.
- **Files modified:** `packages/paja/src/browser-upload.ts`
- **Verification:** 50 focused tests, Paja type-check, `git diff --check`, and the quality scan all pass; scanner returned to the inherited 85 baseline with no changed-source finding.
- **Committed in:** `68869ffd`

**Total deviations:** 3 auto-fixed (2 Rule 1, 1 Rule 3).

**Impact on plan:** All changes were required for correct test semantics, compilation, and the project quality baseline. No dependency, lockfile, NAP wire extension, discovery target, or napplet-visible Paja surface was introduced.

## Known Stubs

None. The changed files contain no placeholder data path, skipped test, unrun required verification, or napplet-visible diagnostic stub.

## Next Phase Readiness

The configured replica behavior is ready for the Plan 04 opaque-iframe fixture expansion. The next proof can exercise ordered server requests, standard-only wire results, mediated resource preview, and host-only partial-copy reporting end to end.

## Orchestrator Post-Wave Gate

- Full monorepo build passed: 32/32 tasks.
- Full unit gate passed: 128 files, 1,615 tests.
- AI-slop returned to source-base-identical 85/100 after executor removed changed-source warnings; four unrelated runtime warnings remain. Final 100/100 release gate remains tracked for Plan 103-06.

## Self-Check: PASSED

- Confirmed all seven modified Paja source/test files exist in `/workspace/projects/kehto/paja-blossom-rail`.
- Confirmed commit objects `ed8d4e42`, `e00e37ad`, `b9f22222`, `b7e8cf87`, and `68869ffd` exist.
- Confirmed no deletions in `dd4eb4de..HEAD`, an empty source `git status --short`, and branch `feat/103-paja-blossom-rail`.
