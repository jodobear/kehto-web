---
phase: 103-paja-blossom-rail-poc
plan: "01"
subsystem: Paja Blossom upload and mediated resource preview
tags: [paja, blossom, nap-upload, nap-resource, security, playwright]
requires:
  - Phase 102 PR #217 stack base `81185b45c99544fbb63271da4bcfc69334e759e1`
provides:
  - Host-owned stored-blob verification and exact verified-resource grants
  - BUD-11 upload authorization plus standard upload-to-resource browser tracer
affects: [packages/paja, packages/services, tests/e2e]
tech-stack:
  added: []
  patterns:
    - host-private verifier callback
    - DNS-pinned stored-blob retrieval
    - exact URL/window/identity resource grants
key-files:
  created:
    - packages/paja/src/blossom-verifier.ts
    - packages/paja/src/blossom-verifier.test.ts
  modified:
    - packages/paja/src/server.ts
    - packages/paja/src/browser-upload.ts
    - packages/paja/src/browser-adapter.ts
    - packages/services/src/http-uploader.ts
    - packages/services/src/resource-service.ts
    - packages/services/src/index.ts
    - packages/services/src/http-uploader.test.ts
    - packages/services/src/resource-service.test.ts
    - packages/paja/src/browser-upload.test.ts
    - tests/e2e/paja-single-window.spec.ts
decisions:
  - "Stacked on the frozen open PR #217 head `81185b45`; no branch creation was repeated because the orchestrator had already created `feat/103-paja-blossom-rail` at that base."
  - "Kehto remains aligned only with the pinned NAP drafts; it makes no current-master conformance claim and adds no per-replica wire field."
  - "Blossom success and NIP-94 tags are derived solely from a host-verified stored-byte tuple, never descriptor metadata."
  - "The verifier resolves and blocks private addresses before each request, pins the outbound connection to the validated address, and revalidates manual redirects."
metrics:
  tasks_completed: 3
  source_commits: 4
  focused_unit_tests: 52
  browser_tests: 7
  completed: 2026-07-29
status: complete
---

# Phase 103 Plan 01: Verified Blossom Foundation Summary

Implemented the first secure Paja Blossom vertical slice: a standard `upload.upload` performs host-owned BUD-11 authorization, Paja proves the stored object bytes before reporting success, and only the requesting window and active identity can preview the retained verified bytes through standard `resource.bytes`.

## Task Completion

| Task | Result | Commit |
| --- | --- | --- |
| 1. RED and verified-upload foundation | Added failing verifier/resource/transport tests, then implemented the host verifier, BUD-11 transport, private verification route, and exact resource grants. | `468ea525`, `33719617` |
| 2. Recovery gate | Focused type and unit suites green; whitespace clean; source tree clean; required RED and feature commits present. | validation only |
| 3. Browser upload-to-preview tracer | Extended the opaque-iframe tracer to prove PUT, stored GET, proof, BUD-11 fields, resource preview bytes, and altered-byte rejection. | `f1d7cf8b` |
| Security correction | DNS-resolution check and pinned HTTP(S) connection now protect descriptor retrieval rather than trusting a URL parse alone. | `7664fde6` |

## Preflight Evidence

Before any source edit, the dedicated source worktree was clean and asserted:

- Worktree: `/workspace/projects/kehto/paja-blossom-rail`
- Branch: `feat/103-paja-blossom-rail`
- `HEAD`: `81185b45c99544fbb63271da4bcfc69334e759e1`
- Refreshed `upstream/main`: `a3e73e75a2cda7253474147a56f066e808a97624`
- PR #217: `OPEN`, base `main`, head `81185b45c99544fbb63271da4bcfc69334e759e1`, merge commit `null`
- Selected route: explicit stack on `SOURCE_BASE=81185b45c99544fbb63271da4bcfc69334e759e1`
- Source-HEAD equality assertion: passed

## Protocol Authority Check

Checked before source changes:

| Authority | Pinned ref | Result |
| --- | --- | --- |
| NAP-UPLOAD | `a7cc17463cbf5d9cb87884b31071bc4fc826034c` | Standard upload envelopes, status/result fields, shell-owned server/signing authority retained. |
| NAP-RESOURCE | `fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1` | Standard mediated `resource.bytes`, identity scope, MIME classification, and late-result suppression retained. |
| NAP-BLOSSOM | `ca1d7ba594e6790785dc770227085d8648d39631` | High-level storage remains NAP-UPLOAD; no `window.napplet.blossom` surface was added. |
| NAP-SHELL | `a7cc17463cbf5d9cb87884b31071bc4fc826034c` | Existing mandatory handshake and support/availability distinction retained. |
| Installed declarations | `@napplet/nap@0.29.0` upload/resource declarations | Current `url`, `fallbackUrls`, and string `error` shape retained; no per-replica outcome field exists. |

All four pinned document paths were absent from the local `napplet/naps` `master` check. This implementation is aligned to pinned drafts only. It deliberately makes no current-master conformance claim.

## Implementation Highlights

- `createPajaStoredBlobVerifier` enforces production HTTPS, blocks private and loopback DNS answers, follows redirects manually with a five-hop cap, pins every HTTP(S) connection to the validated IP, caps bytes, recomputes SHA-256/size, and classifies bytes before returning a tuple.
- The verifier is reachable only through private `POST /__kehto/blossom/verify`; the browser-side Paja runtime forwards only untrusted descriptor claims and receives the verified tuple plus bytes.
- Blossom `PUT /upload` now creates kind `24242` authorization with `t=upload`, `x`, lowercase `server`, expiry, unpadded base64url authorization, `X-SHA-256`, request MIME, and exact content length.
- `toVerifiedBlossomNip94()` emits only verified `url`, `m`, `x`, and `size`; optional descriptor `nip94`/imeta fields are ignored.
- `ResourceService.grantVerifiedResource()` stores verifier-retained bytes by exact URL, window, and `(dTag, aggregateHash)`. Teardown removes grants and suppresses late responses.
- The browser tracer verifies `[0,1,2,3,254,255]`, its SHA-256 `7ea646958715ed687aa9ac2f5d785feb1a93411f4f25fdd6c7fcc6ab07fdf0e3`, one stored GET, BUD-11 headers/tags, mediated preview bytes, and altered stored-byte failure.

## Verification

Passed:

```text
corepack pnpm --filter @kehto/paja type-check
corepack pnpm exec vitest run packages/paja/src/blossom-verifier.test.ts packages/services/src/resource-service.test.ts packages/services/src/http-uploader.test.ts packages/paja/src/browser-upload.test.ts
# 4 files, 52 tests passed

PATH=/tmp/kehto-pnpm-shim:$PATH pnpm --filter @kehto/paja build
# passed

CI=1 PATH=/tmp/kehto-pnpm-shim:$PATH pnpm exec playwright test --config=tests/e2e/phase-103-ci.config.ts paja-single-window.spec.ts
# isolated temporary CI configuration, 7 passed

git diff --check
# passed

git status --short
# empty

npx --no-install aislop scan -d
# 85/100 Healthy, 0 errors; four pre-existing runtime tautological-test warnings only
```

The plan's literal standard Playwright command first stopped because an unrelated Writer preview owned port 4173. That process was preserved. The isolated CI-mode configuration omitted the conflicting unrelated web servers; this tracer starts and owns its Paja, target, and Blossom servers, so it exercised the same browser behavior and passed.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 2 - Security] Added explicit DNS resolution and connection pinning for verifier retrieval**
   - **Found during:** Task 1 implementation and final security scan.
   - **Issue:** URL syntax checks alone cannot prevent private DNS answers or DNS rebinding between validation and connection.
   - **Fix:** Resolve each URL, reject private/link-local/loopback answers, and provide the validated address through the Node HTTP(S) lookup callback for every redirect hop.
   - **Files modified:** `packages/paja/src/blossom-verifier.ts`, `packages/paja/src/blossom-verifier.test.ts`, `packages/paja/src/server.ts`
   - **Commit:** `7664fde6`

2. **[Rule 2 - Public API correctness] Re-exported new service-layer types**
   - **Found during:** Task 1 type integration.
   - **Issue:** The public `@kehto/services` barrel did not expose the new verifier and verified-resource grant types.
   - **Fix:** Added type re-exports with the existing public service exports.
   - **Files modified:** `packages/services/src/index.ts`
   - **Commit:** `33719617`

3. **[Rule 3 - Environment] Used the existing Corepack pnpm shim and isolated browser configuration**
   - **Found during:** Tasks 1 and 3 validation.
   - **Issue:** Turbo child processes could not locate `pnpm`; the literal CI Playwright configuration collided with an unrelated Writer server on port 4173.
   - **Fix:** Used the pre-existing `/tmp/kehto-pnpm-shim` Corepack wrapper and a temporary, removed CI Playwright configuration that runs this tracer without the unrelated web-server entries.
   - **Impact:** No dependency install, source configuration change, process termination, or generated artifact was committed.

## Known Stubs

None. The verified tuple is real data from a stored-byte retrieval, and the browser preview consumes the verifier-retained Blob rather than empty/mock state.

## Orchestrator Post-Wave Gate

- Full monorepo build passed: 32/32 tasks.
- Full unit gate passed: 128 files, 1,612 tests.
- AI-slop remained 85/100 from four source-base warnings; no new Plan 103-01 error. Final 100/100 release gate remains tracked for Plan 103-06.

## Self-Check: PASSED

- Verified required source artifacts exist in the dedicated source worktree.
- Verified commits `468ea525`, `33719617`, `f1d7cf8b`, and `7664fde6` via Git commit-object lookup.
- Confirmed branch `feat/103-paja-blossom-rail` and an empty final `git status --short`.
