---
phase: 103-paja-blossom-rail-poc
plan: "02"
subsystem: Blossom transport, NAP-UPLOAD lifecycle, runtime ACL
status: complete
source_worktree: /workspace/projects/kehto/paja-blossom-rail
source_branch: feat/103-paja-blossom-rail
requires:
  - "103-01 verified Blossom foundation at 7664fde6"
provides:
  - "BUD-11-complete single-server authorization serialization"
  - "Service-owned upload lifecycle terminal fencing"
  - "Explicit upload and resource ACL denial regression coverage"
affects:
  - packages/services
  - packages/runtime
tech_stack:
  added: []
  patterns:
    - service-owned lifecycle snapshots
    - per-window async delivery fence
    - unpadded Base64url authorization serialization
key_files:
  modified:
    - packages/services/src/http-uploader.ts
    - packages/services/src/http-uploader.test.ts
    - packages/services/src/upload-service.ts
    - packages/services/src/upload-service.test.ts
    - packages/runtime/src/upload-dispatch.test.ts
commits:
  - 2775e7c6
  - 8670cd92
  - 49ca533c
  - dd4eb4de
---

# Phase 103 Plan 02: BUD-11 Transport and Upload Lifecycle Summary

Hardened the reusable Blossom upload path so its authorization is BUD-11 encoded and short-lived, while the generic upload service emits one authoritative uploading state followed by one fenced terminal state per live window.

## Source Preconditions

All source-lane assertions passed before edits:

- Worktree: `/workspace/projects/kehto/paja-blossom-rail`
- Branch: `feat/103-paja-blossom-rail`
- Working tree: clean
- Plan 103-01 commits `468ea525`, `33719617`, `f1d7cf8b`, and `7664fde6` were ancestors of `HEAD`.
- No Phase 103 Plan 02 commit was present in `81185b45..HEAD`.

## Task Completion

| Task | Result | Commits |
| --- | --- | --- |
| 1. Make the single-attempt Blossom transport BUD-11-complete | Added RED transport contracts, then reduced bearer lifetime to 300 seconds and isolated unpadded UTF-8 Base64url encoding for the Blossom authorization path. Existing NIP-96 serialization remains on its original Base64 serializer. | `2775e7c6`, `8670cd92` |
| 2. Enforce truthful upload lifecycle and ACL denial boundaries | Made `createUploadService` the single status authority; it creates one uploading snapshot, emits one normalized terminal snapshot/result only while the entry is live, drops late sends after teardown, scopes status lookup to the owner window, and calls the uploader teardown hook. Added the parallel denied `resource.bytes` dispatch proof. | `49ca533c`, `dd4eb4de` |

## Protocol Authority Check

Checked before source changes:

| Authority | Exact source | Result |
| --- | --- | --- |
| NAP-UPLOAD | `napplet/naps@a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-UPLOAD.md` | Retained the standard `upload.upload`, `upload.status`, `upload.status.changed`, `UploadResult.error`, `url`, and `fallbackUrls` shape. Shell ownership of signing, server selection, and policy remains intact. |
| NAP-RESOURCE | `napplet/naps@fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1:naps/NAP-RESOURCE.md` | Preserved `resource.bytes` error envelopes and added an ACL regression showing a denied request never reaches the registered service. The service's teardown fence remains consistent with the draft's late-terminal-envelope requirement. |
| NAP-BLOSSOM | `napplet/naps@ca1d7ba594e6790785dc770227085d8648d39631:naps/NAP-BLOSSOM.md` | Retained high-level NAP-UPLOAD only; BUD-11 `server` scope is a lowercase hostname and no Blossom namespace or napplet-visible authorization event was added. |
| BUD-02 / BUD-11 | `hzrd149/blossom` `buds/02.md` and `buds/11.md`, rechecked 2026-07-29 | Descriptor validation requires `url`, `sha256`, safe exact `size`, `type`, and `uploaded`; PUT authorization is kind 24242 with `t=upload`, hash `x`, lowercase server scope, expiration, `X-SHA-256`, content length, and unpadded Base64url JSON. |
| Installed declarations | `@napplet/nap@0.29.0` `upload/types.d.ts` and `resource/types.d.ts` | Current typed wire shape has `url`, `fallbackUrls`, and string `error`, but no Paja-specific per-replica field. No wire extension was added. |

The local `napplet/naps` `master` lacks the three phase-owned NAP document paths. This work is aligned with the pinned drafts only and makes no current-master conformance claim.

## Implementation Highlights

- `http-uploader.ts` now uses `BLOSSOM_AUTH_TTL_S = 300` and a dedicated `base64UrlUtf8()` helper for BUD-11. NIP-96 continues to use `nostrAuthHeader()` and `base64Utf8()` unchanged.
- Transport tests decode the actual raw `Authorization: Nostr` payload emitted for bytes `[0, 1, 2, 3, 254, 255]`. They assert URL-safe unpadded encoding, kind `24242`, hash `7ea646958715ed687aa9ac2f5d785feb1a93411f4f25fdd6c7fcc6ab07fdf0e3`, lowercase `server`, 300-second expiry, `X-SHA-256`, and exact content length.
- `createUploadService` stores an initial `uploading` entry before invoking the uploader, ignores uploader-owned status injection, normalizes the resolved result to a single terminal `complete`, `failed`, or `cancelled` state, and sends no status or result when teardown has removed that entry.
- Global uploader status fallback was removed from `upload.status`; only the window-scoped entry may answer the request, preventing another window's upload snapshot from being disclosed.
- The optional `Uploader.onWindowDestroyed(windowId)` callback runs after active uploads are cancelled and removed, allowing Paja to delete its matching private operation state.
- Runtime ACL tests now prove that both `upload.upload` and `resource.bytes` denials emit their normal domain error envelopes without entering the registered service handler.

## Verification

Passed from `/workspace/projects/kehto/paja-blossom-rail` with `PATH=/tmp/kehto-phase103-corepack-bin:$PATH`:

```text
corepack pnpm exec vitest run packages/services/src/http-uploader.test.ts
# 1 file, 24 tests passed

corepack pnpm exec vitest run packages/services/src/upload-service.test.ts packages/runtime/src/upload-dispatch.test.ts
# 2 files, 22 tests passed

corepack pnpm --filter @kehto/services type-check
# passed

git diff --check
# passed

git status --short
# empty
```

The Task 1 RED gate failed as intended before implementation: decoded authorization expiration was `1700003600`, rather than the required `1700000300`. The Task 2 RED gate failed as intended before implementation with duplicate/pending statuses, post-teardown status/result sends, and an uploader-global cross-window status fallback.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Test type correctness] Corrected strict TypeScript assertions in new lifecycle tests**
   - **Found during:** Task 2 focused `@kehto/services` type-check.
   - **Issue:** Narrow casts from generic `NappletMessage` test fixtures and an inferred string lifecycle status did not satisfy strict TypeScript.
   - **Fix:** Made fixture casts explicit and declared the mock status return as `UploadStatus`.
   - **Files modified:** `packages/services/src/upload-service.test.ts`
   - **Commit:** `dd4eb4de`

No architectural deviations, dependency changes, lockfile changes, NAP wire extensions, or Paja-specific result fields were introduced.

## Known Stubs

None. The modified code has no placeholder data path, skipped test, or unrun required verification.

## Orchestrator Post-Wave Gate

- Full monorepo build passed: 32/32 tasks after restoring ignored exact-base workspace dependency links.
- Full unit gate passed: 128 files, 1,619 tests.
- AI-slop remained source-base-identical at 85/100: four unrelated runtime warnings, zero new errors. Final 100/100 release gate remains tracked for Plan 103-06.

## Self-Check: PASSED

- Confirmed all five modified source/test files exist.
- Confirmed commit objects `2775e7c6`, `8670cd92`, `49ca533c`, and `dd4eb4de` exist.
- Confirmed the source worktree is clean and remains on `feat/103-paja-blossom-rail`.
