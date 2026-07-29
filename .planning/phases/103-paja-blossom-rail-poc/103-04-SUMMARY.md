---
phase: 103-paja-blossom-rail-poc
plan: "04"
subsystem: Paja Blossom opaque-iframe proof and shell namespace boundary
status: complete
source_worktree: /workspace/projects/kehto/paja-blossom-wave4-04
source_branch: worktree-agent-103-04
expected_base: 68869ffdf4eb81246c6e85bf7bc8abf67f2cbe94
requires:
  - "103-03 configured, verified replica operation"
provides:
  - "Controlled multi-server opaque-iframe proof for standard upload/resource messages"
  - "Shell upload-capability readiness regression and canonical upload/resource namespace enforcement"
affects:
  - tests/e2e/paja-single-window.spec.ts
  - packages/shell/src/napplet-namespace.ts
  - packages/shell/src/shell-init.test.ts
  - packages/shell/src/napplet-namespace.test.ts
commits:
  - a987989d
  - a9d34abc
  - a74dd5dd
---

# Phase 103 Plan 04: Adversarial Browser and Shell Boundary Proof Summary

Expanded the real opaque Paja iframe tracer into a controlled multi-Replica Blossom proof that exercises only standard NAP-UPLOAD and NAP-RESOURCE messages, then hardened the injected upload/resource namespace against authored replacement objects.

## Source Preconditions

- Worktree: `/workspace/projects/kehto/paja-blossom-wave4-04`
- Branch: `worktree-agent-103-04`
- Expected base and initial `HEAD`: `68869ffdf4eb81246c6e85bf7bc8abf67f2cbe94`
- Working tree was clean before work.
- All Plan 103-01, 103-02, and 103-03 commits were verified as ancestors.
- No Plan 103-04 commit existed in the expected-base range before work.

## Task Completion

| Task | Result | Commits |
| --- | --- | --- |
| 1. Expand opaque-iframe Blossom fixture into adversarial proof | Added persistent stored blobs, scripted PUT queues, GET capture, stored-byte replacement, and held request controls. The real Paja server and opaque iframe now prove retry/order, malformed descriptor continuation, altered-byte proof continuation, exact preview bytes, consent before egress, teardown diagnostics, BUD-11 serialization, and absence of napplet-visible Blossom/key/credential authority. | `a987989d`, `a9d34abc` |
| 2. Lock shell capability and injected namespace to the standard surface | Added support-versus-readiness and namespace correlation tests. Fixed injected `upload` and `resource` so pre-existing authored/shim objects cannot replace the standard shell-mediated method sets. | `a74dd5dd` |

## Protocol Authority Check

Rechecked before NAP-facing test changes:

| Authority | Exact source | Result |
| --- | --- | --- |
| NAP-UPLOAD | `napplet/naps@a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-UPLOAD.md` | Preserved standard `upload.info`, `upload.upload`, `upload.status`, `upload.status.changed`, `url`, `fallbackUrls`, and string `error` semantics. Shell retains server, signer, authorization, consent, and network authority. |
| NAP-RESOURCE | `napplet/naps@fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1:naps/NAP-RESOURCE.md` | Preview proof uses only `resource.bytes`; the browser compares both `bodyBase64` and Blob bytes to the verified fixture vector. |
| NAP-BLOSSOM | `napplet/naps@ca1d7ba594e6790785dc770227085d8648d39631:naps/NAP-BLOSSOM.md` | High-level upload remains under NAP-UPLOAD. The test asserts no `window.napplet.blossom`, authorization event, credential, or low-level Blossom authority crosses into the iframe. |
| NAP-SHELL | `napplet/naps@a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-SHELL.md` | The new shell test keeps the wired `upload` domain advertised independently of current rail readiness reported by `upload.info.enabled`. |
| Installed declarations | `@napplet/nap@0.29.0` upload/resource declarations | Confirmed existing URL/fallback and resource envelope shapes; no per-replica outcome field or Paja-specific wire extension was added. |

The current local `napplet/naps` master lacks all four checked document paths. This work is aligned to the pinned drafts and makes no current-master conformance claim.

## Browser Evidence

The Playwright fixture uses only in-process loopback servers via the explicit test-only verifier adapter. It proves:

- configured attempt order `first`, `first` (single transient 503 retry), `second` (malformed descriptor), then `third` (verified fallback);
- BUD-11 `Nostr` authorization uses unpadded Base64url, kind `24242`, `t=upload`, exact SHA-256 `x`, lowercase `server`, 300-second expiration, `X-SHA-256`, and exact content length;
- the known vector `[0,1,2,3,254,255]` has SHA-256 `7ea646958715ed687aa9ac2f5d785feb1a93411f4f25fdd6c7fcc6ab07fdf0e3`, is stored, independently verified, and returns through `resource.bytes` as matching base64 and Blob bytes;
- failed stored-byte proof continues to later configured replicas and only verified configured-order URLs populate `url` and `fallbackUrls`;
- consent denial makes no PUT request;
- teardown after the durable first copy records the host-only retained-copy warning and exposes no successful terminal URL to the destroyed iframe;
- the iframe has standard upload/resource methods, no `window.nostr`, no `window.napplet.blossom`, and no authorization or credential message.

## Verification

Passed from `/workspace/projects/kehto/paja-blossom-wave4-04` with `PATH=/tmp/kehto-phase103-corepack-bin:$PATH`:

```text
corepack pnpm --filter @kehto/paja... build
# 8 workspace projects passed

corepack pnpm exec vitest run packages/shell/src/shell-init.test.ts packages/shell/src/napplet-namespace.test.ts packages/paja/src/browser-upload.test.ts
# 3 files, 56 tests passed

CI=1 corepack pnpm exec playwright test --config=/tmp/kehto-103-04-playwright.config.mjs paja-single-window.spec.ts
# 8 browser tests passed

npx --no-install aislop scan -d
# 85/100 Healthy; 0 errors, 4 pre-existing runtime tautological-test warnings

git diff --check
# passed

git status --short
# empty
```

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Test correctness] Corrected stale single-server consent and terminal-error expectations**
   - **Found during:** Task 1 RED execution.
   - **Issue:** Existing browser assertions expected a new consent dialog after an accepted session-scoped grant and expected replica-local error text after the controller correctly normalizes all-no-success outcomes to `upload-server-failed`.
   - **Fix:** Exercise denied consent before the first accepted request, then assert reused session consent and the established terminal code.
   - **Files modified:** `tests/e2e/paja-single-window.spec.ts`
   - **Commit:** `a987989d`

2. **[Rule 1 - Security boundary] Prevented existing upload/resource objects from bypassing canonical injected methods**
   - **Found during:** Task 2 focused namespace test.
   - **Issue:** The generic prelude preserved a non-empty existing object for unprotected domains. A pre-existing `window.napplet.upload` object could therefore expose an arbitrary `directNetwork` method instead of the standard shell-mediated upload methods.
   - **Fix:** Treat `upload` and `resource` as canonical shell-owned mediation boundaries and always create their standard interfaces; added regression coverage for exact method sets and trusted-parent correlation.
   - **Files modified:** `packages/shell/src/napplet-namespace.ts`, `packages/shell/src/napplet-namespace.test.ts`
   - **Commit:** `a74dd5dd`

3. **[Rule 3 - Verification environment] Used an isolated temporary Playwright configuration**
   - **Found during:** Task 1 RED execution.
   - **Issue:** The plan's literal Playwright invocation could not start because an unrelated Writer preview already owned port `4173`. The process was preserved.
   - **Fix:** Built the Paja workspace dependency closure and used `/tmp/kehto-103-04-playwright.config.mjs`, which starts no unrelated web servers while retaining the real Paja server, opaque iframe, controlled Blossom servers, and Chromium browser path.
   - **Impact:** No dependency installation, lockfile change, source configuration change, process termination, or untracked repository artifact.

### Teardown Delivery Clarification

The plan text requested one cancelled terminal result after teardown. The established `createUploadService` lifecycle fence deletes the owning entry on window destruction and intentionally suppresses all late status/result sends to the destroyed recipient. The browser proof therefore asserts the stronger existing security behavior: a host-only retained-copy diagnostic is recorded and no success result can reach the destroyed iframe. No production lifecycle behavior was weakened or changed.

## Known Stubs

None. The fixture persists and retrieves real byte vectors, and all required focused verification commands ran.

## Threat Flags

None. The only production change narrows the existing iframe namespace authority surface; it adds no network endpoint, auth path, file access pattern, or schema boundary.

## Orchestrator Post-Wave Gate

- Full merged-wave gates passed: build 32/32, type-check, 128 unit files / 1,617 tests, docs check.
- AI-slop stayed source-base-identical at 85/100 with four unrelated runtime warnings; no changed-source error.

## Self-Check: PASSED

- Confirmed required files exist: `tests/e2e/paja-single-window.spec.ts`, `packages/shell/src/shell-init.test.ts`, `packages/shell/src/napplet-namespace.test.ts`, and `packages/shell/src/napplet-namespace.ts`.
- Confirmed task commits `a987989d`, `a9d34abc`, and `a74dd5dd` exist.
- Confirmed `git diff --check 68869ffd..HEAD` passes, branch remains `worktree-agent-103-04`, and the final worktree is clean.
