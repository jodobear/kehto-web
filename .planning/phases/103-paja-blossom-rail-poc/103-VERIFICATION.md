---
phase: 103-paja-blossom-rail-poc
verified: 2026-07-31T00:00:00Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 103: Paja Blossom Rail PoC Verification Report

**Phase Goal:** A standard-NAP client can request the Paja-owned Blossom rail and receive a mediated, truthful upload result without gaining upload authority or direct network access.

**Verified:** 2026-07-31T00:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Verification Basis

This report does not accept the planning summaries as proof. The actual source checkout was verified at `/workspace/projects/kehto/paja-blossom-rail`, branch `feat/103-paja-blossom-rail`, commit `2bc4dc39d304832a354494eaef83dfb354131db6`:

- the source working tree is clean and `git diff --quiet 2bc4dc39 --` succeeded;
- the required integration ancestor `b004f20341d87b04bbb6e46ad293b4615108058b` exists and is an ancestor of that exact source tip;
- the recorded full-gate evidence is therefore applicable to the unchanged source artifact rather than a prior or different checkout;
- the external PR comment was independently fetched from GitHub as comment `5136360580` and matches the required URL.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A standard `upload.upload` request reaches the Paja-owned Blossom rail; Paja, rather than the napplet, owns configured-server selection, consent, kind-24242 signing, transfer, policy, and verification. | VERIFIED | `packages/paja/src/browser-upload.ts` creates an operation per upload, loops over prepared configured servers, creates a single-server host delegate, signs through the captured host signer, and returns only a normalized `UploadResult`. The targeted `browser-upload.test.ts -t 'configured replica operations'` passed: 7/7 tests. |
| 2 | An upload result URL is exposed only after a host-side full stored-byte GET proves exact SHA-256, byte count, and MIME; untrusted descriptor metadata cannot supply the standard result fields. | VERIFIED | `packages/paja/src/blossom-verifier.ts` validates HTTPS/address policy, follows bounded redirects, recomputes digest/size, and sniffs MIME before returning `VerifiedStoredBlob`. The browser fixture asserts altered-byte rejection and the result builder consumes the verifier tuple. The recorded final focused and full browser gates ran against the same unchanged source tip. |
| 3 | Verified bytes can be read with standard `resource.bytes` only for the exact verified URL and owning active window/identity; teardown revokes the grant. | VERIFIED | `ResourceService` exposes the host-only `grantVerifiedResource(VerifiedResourceGrant)` capability, whose required fields include exact URL, window ID, identity, bytes, and MIME. The Paja delegate passes its current window/identity to the verifier callback. Recorded Plan 01/04 tests exercise cross-window, arbitrary-URL, and teardown denial; the final browser gate passed on the unchanged source tip. |
| 4 | Configured replicas are attempted sequentially; only verified configured-order successes appear as `url` then `fallbackUrls`, while retry/failure diagnostics remain host-only. | VERIFIED | `executeReplicas()` loops sequentially, retains only `result.ok && result.url`, permits the one retry path, and `completeWithVerifiedReplicas()` derives `fallbackUrls` from later verified results. `PajaReplicaDiagnostic` goes only through `onDiagnostic`. The targeted replica suite passed 7/7, and the controlled opaque-iframe fixture contains assertions for 503 retry, ordered attempts, failed proof continuation, and fallback URL order. |
| 5 | Cancellation, signer change, and teardown stop the operation without returning success URLs; possible durable copies are host-only diagnostics. | VERIFIED | `stopOperation()` aborts the operation and delegates; `cancelledOperation()` emits `paja.upload.partial-copy` only to the host callback and returns a cancelled `UploadResult` without URL fields. The browser test contains the partial-copy assertion and the recorded focused/full Playwright runs passed on the same source commit. |
| 6 | The opaque iframe receives standard NAP upload/resource methods, but no low-level Blossom API, direct network credential, authorization event, `window.nostr`, or private-key authority. | VERIFIED | `makeUpload()` exports only `info`, `upload`, `status`, and `onStatus`; `makeResource()` performs ordinary `resource.bytes` requests. The browser test explicitly asserts no `window.nostr`, no `window.napplet.blossom`, and no authorization/credential in iframe messages. Shell namespace and browser boundary tests were included in the verified final gate. |
| 7 | The contribution is focused, package outputs have appropriate changesets, and public docs describe the configured-only mediated rail without claiming current-master conformance. | VERIFIED | `b004f203..2bc4dc39` contains only 27 Phase-103 source/test/doc/changeset paths; a direct excluded-path scan found no planning, Graphify, Writer, manifest/lockfile, NIP-96, or low-level-operation paths. Both required changesets exist and name `@kehto/paja` and `@kehto/services`. Recorded `docs:check`, build, and full release gates apply to the unchanged tip. |
| 8 | The remaining per-replica/structured-error wire gap is visibly raised upstream without altering current Kehto wire fields or claiming current-master conformance. | VERIFIED | GitHub API returned the required PR #33 comment at `https://github.com/napplet/naps/pull/33#issuecomment-5136360580`. Its text describes ordered configured replication, current `url`/`fallbackUrls`, host-only failures, and asks about backward-compatible per-attempt outcomes/error codes while expressly saying it proposes no schema and Kehto added no custom field. |

**Score:** 8/8 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/paja/src/blossom-verifier.ts` | Host-only stored-object verifier | VERIFIED | Substantive verifier validates URL/address policy, redirects, byte size, SHA-256, and sniffed MIME before a verified tuple is returned. |
| `packages/services/src/http-uploader.ts` | BUD-11 Blossom transport and verified-result mapper | VERIFIED | Wired from Paja's single-server delegate; browser fixture inspects kind-24242/base64url/header behavior. |
| `packages/services/src/resource-service.ts` | Exact verified-resource grant and teardown revocation | VERIFIED | Host-only `grantVerifiedResource` is typed in `ResourceService`; Paja composition uses the grant handoff only after verification. |
| `packages/paja/src/browser-upload.ts` | Configured replica orchestration, consent, cancellation, diagnostics | VERIFIED | Substantive per-operation controller with ordered execution, retry classification, result projection, and host-only diagnostics. |
| `packages/paja/src/browser-adapter.ts` | Upload/resource composition boundary | VERIFIED | Part of the exact pinned source diff and covered by final integration/browser evidence; no public Paja upload API was added. |
| `packages/shell/src/napplet-namespace.ts` | Standard-only injected upload/resource method set | VERIFIED | `makeUpload()` exposes only normal NAP-UPLOAD methods; browser and namespace tests verify the authority boundary. |
| `tests/e2e/paja-single-window.spec.ts` | Controlled opaque-iframe upload-to-preview proof | VERIFIED | Substantive in-process multi-server fixture asserts PUT authorization, verification, preview bytes, cancellation, ordering, and authority absence. |
| `.changeset/paja-blossom-rail.md` | Paja shipped-output release record | VERIFIED | Valid minor changeset for `@kehto/paja`, limited to host-owned verified configured replicas. |
| `.changeset/services-verified-resource-grants.md` | Services shipped-output release record | VERIFIED | Valid minor changeset for `@kehto/services`, limited to exact window-owned verified-resource grants. |
| PR #33 comment `#issuecomment-5136360580` | Focused upstream schema-gap feedback | VERIFIED | Independently fetched through GitHub API; content is scoped to the existing wire gap. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Opaque iframe | Runtime/Paja upload controller | Standard `upload.upload` envelope | WIRED | Browser fixture drives standard envelopes through the real opaque iframe. |
| Paja replica controller | `createHttpUploader()` | One host delegate for each sequential configured server | WIRED | `attemptReplica()` constructs `createHttpUploader({ rails: { blossom: { servers: [server] }}})` for each attempt. |
| HTTP upload result | Paja stored-blob verifier | Host-private `verifyBlossomStoredBlob` callback | WIRED | Delegate callback carries the current window/identity to `verifyStoredBlob`; success requires verifier output. |
| Verified blob | Resource service | Exact `grantVerifiedResource` handoff | WIRED | The host-only grant API accepts the verifier-produced blob/identity/URL tuple rather than an origin wildcard. |
| Resource service | Iframe | Standard `resource.bytes.result` | WIRED | Browser test requests the returned URL through `resource.bytes` and compares fixture and result bytes. |
| Shell namespace | Standard NAP client | `makeUpload()` / `makeResource()` | WIRED | No Blossom namespace is injected; standard domains make correlated parent messages only. |
| Current Kehto result shape | PR #33 feedback | Existing `url`/`fallbackUrls` plus described schema gap | WIRED | The independently fetched comment correctly describes the existing result shape without a local field extension. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| Paja replica controller | `verifiedResults` | Real `createHttpUploader()` calls to controlled/configured servers | Only verifier-approved `UploadResult.url` values are accumulated | FLOWING |
| Stored-blob verifier | `VerifiedStoredBlob.bytes` | Host-owned GET response under URL/address/redirect policy | Digest, exact size, and sniffed MIME are calculated from retrieved bytes | FLOWING |
| Resource service | `VerifiedResourceGrant.blob` | Verifier-retained bytes | Browser test proves standard preview returns `[0,1,2,3,254,255]` | FLOWING |
| Browser fixture | `resource.bytes.result` | Real Paja server, runtime, opaque iframe, and controlled Blossom servers | Fixture asserts matching base64 and Blob bytes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Configured ordered replica operation | `PATH=/tmp/kehto-pnpm-shim:$PATH npx --no-install vitest run packages/paja/src/browser-upload.test.ts -t 'configured replica operations'` | 1 file, 7 tests passed in 823 ms | PASS |
| Full release chain on final source tip | Recorded Plan 06 chain, reused only after clean exact-tip and ancestor validation | Build, type-check, 129-file/1,577-test unit suite, docs, focused/full Playwright, whitespace, and AI-slop all recorded green | PASS (validated-recorded evidence) |
| AI-slop quality gate | Recorded `npx --no-install aislop scan -d` on exact source tip | `100 / 100 Healthy` | PASS (validated-recorded evidence) |
| Upstream feedback artifact | `gh api repos/napplet/naps/issues/comments/5136360580` | Returned required URL and scoped comment text | PASS |

### Protocol Authority and Scope

All exact pinned documents exist in `/workspace/projects/napplets/jodobear/naps` at the recorded commits:

- NAP-UPLOAD: `a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-UPLOAD.md`
- NAP-RESOURCE: `fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1:naps/NAP-RESOURCE.md`
- NAP-BLOSSOM: `ca1d7ba594e6790785dc770227085d8648d39631:naps/NAP-BLOSSOM.md`
- NAP-SHELL: `a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-SHELL.md`

Current `master` lacks the checked UPLOAD, RESOURCE, and BLOSSOM paths (while it contains NAP-SHELL). The implementation and comment are therefore **pinned-draft aligned only**, deliberately retain the current result shape, and make no current-master conformance claim.

### Requirement Coverage

| Requirement | Source Plans | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| UPLOAD-02 | 103-01 through 103-06 | Paja owns Blossom selection, consent, signing, transfer, policy, and validation; client gets standard results/statuses only. | SATISFIED | Host controller/verifier/resource handoff, BUD-11 and replica tests, opaque-iframe proof, scope audit, changesets, and final gates. |
| POC-02 | 103-01 through 103-06 | Standard NAP boundaries only; no Paja-specific API, direct network/relay/WebSocket, `window.nostr`, private keys, or napplet Blossom authorization. | SATISFIED | Standard namespace implementation plus actual opaque-iframe assertions; direct scope/static inspection found no introduced client Blossom API. |

No Phase 103 requirement is orphaned: `UPLOAD-02` and `POC-02` are declared by every implementation plan and mapped to Phase 103 in `REQUIREMENTS.md`.

### Prohibition Checks

| Prohibition | Status | Evidence |
| --- | --- | --- |
| Descriptor-only completion/grant is not accepted | VERIFIED | Verifier recomputes stored bytes and the browser fixture asserts altered-byte failure without preview. |
| Preview does not broaden to arbitrary origin/window | VERIFIED | Exact grant model plus cross-window/arbitrary-URL/teardown regression coverage. |
| No Paja-only replica field is added to current upload result | VERIFIED | Result projection uses existing `url`, `fallbackUrls`, and `error`; installed declaration and source checks show no local per-replica field. |
| Configured target or consent scope is not silently broadened | VERIFIED | Sequential controller uses prepared configured servers; consent keys include window, signer, ordered servers, MIME, and ceiling. |
| Cancellation neither claims deletion nor exposes successful URLs | VERIFIED | Cancelled result construction omits URL fields; partial-copy diagnostic is host-only. |
| Browser flow needs no proprietary or low-level Blossom API | VERIFIED | Opaque-frame namespace/browser assertions establish standard upload/resource-only use. |
| Docs and external feedback do not overstate current-master conformance | VERIFIED | All checked docs and the fetched comment use pinned-draft/current-wire-gap framing. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| None in Phase 103 source/test files | — | No `TBD`, `FIXME`, or `XXX` debt marker found in the changed TypeScript paths. | — | No blocker. |

## Gaps Summary

No implementation or wiring gaps were found. The upstream per-attempt outcome / structured-error representation remains an intentional protocol-schema gap, but it is not silently omitted: local behavior stays within the pinned existing shape and the required focused PR #33 feedback has been posted. It does not prevent the Phase 103 goal from being achieved.

---

_Verified: 2026-07-31T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
