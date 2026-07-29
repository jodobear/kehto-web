---
phase: 103-paja-blossom-rail-poc
plan: "05"
subsystem: Paja Blossom documentation and release metadata
tags: [paja, blossom, nap-upload, nap-resource, docs, changesets]
requires:
  - "103-03 configured replica and verified-resource implementation at 68869ffd"
provides:
  - Consumer documentation for the configured-only verified Blossom rail
  - Focused minor-release changesets for @kehto/paja and @kehto/services
affects: [packages/paja, packages/services, docs, release-metadata]
tech_stack:
  added: []
  patterns:
    - pinned-draft protocol authority disclosure
    - standard NAP-UPLOAD plus NAP-RESOURCE client boundary
key_files:
  modified:
    - packages/paja/README.md
    - docs/packages/paja.md
    - docs/how-tos/paja-local-authoring.md
  created:
    - .changeset/paja-blossom-rail.md
    - .changeset/services-verified-resource-grants.md
decisions:
  - "Documentation names configured servers as the sole upload targets; BUD-03 can inform configuration but cannot become an implicit target."
  - "Paja remains pinned-draft aligned only; installed types have no per-replica wire outcome, so diagnostics remain host-only."
metrics:
  tasks_completed: 2
  source_commits: 2
  files_changed: 5
  completed: 2026-07-29
status: complete
---

# Phase 103 Plan 05: Paja Blossom Documentation and Release Metadata Summary

Documented the host-owned, configured-replica Blossom rail and added focused minor changesets for Paja's verified uploads and services' exact verified-resource grants.

## Source Preconditions

Before edits, the dedicated worktree assertions passed:

- Worktree: `/workspace/projects/kehto/paja-blossom-wave4-05`
- Branch: `worktree-agent-103-05`
- Expected base: `68869ffdf4eb81246c6e85bf7bc8abf67f2cbe94`
- Working tree: clean
- All Plan 103-01, 103-02, and 103-03 source commits were ancestors of `HEAD`.
- No Plan 103-05 commit existed in `68869ffdf4eb81246c6e85bf7bc8abf67f2cbe94..HEAD`.

## Task Completion

| Task | Result | Commit |
| --- | --- | --- |
| 1. Synchronize Paja documentation | Replaced first-server and descriptor-only guidance in the README, package reference, and local-authoring guide with the configured-only sequential replica, consent, stored-byte proof, resource-preview, cancellation, availability, and protocol-drift contract. | `f8d3377d` |
| 2. Add focused release records | Added valid minor changesets for shipped `@kehto/paja` verified configured-replica behavior and `@kehto/services` scoped verified-resource grants. | `1f7c4c7c` |

## Documentation Contract

All three consumer documents now agree that:

- Only explicitly configured normalized servers are upload targets; configured order determines attempts, primary `url`, and later `fallbackUrls`.
- Paja retries transient network or HTTP 5xx failure once on the same target, then continues after replica-local server, descriptor, or stored-byte-proof failure.
- BUD-03 can inform host configuration but is never an implicit target; pointer hints are not upload endpoints.
- Host policy runs before consent, signing, or egress. The defaults are a 10 MiB ceiling and PNG/JPEG/WebP/GIF MIME baseline, with explicit host configuration controlling the effective policy.
- One session consent scope binds requesting window, active identity, exact ordered targets, normalized MIME class, and effective ceiling. The prompt discloses targets, replica count, file data, public durable storage, and worst-case bytes.
- Support remains advertised independently of run-time readiness; `upload.info.enabled` reports current configuration and signer availability truthfully.
- Paja signs BUD-11 and sends bytes, then its server-side verifier retrieves stored bytes under public-HTTPS, redirect, and DNS policy, checks SHA-256 and size, and sniffs MIME before accepting a result.
- The napplet uses only standard `upload.upload`, `upload.status`, and `resource.bytes`. Verified bytes receive an exact requesting-window grant that teardown revokes. No Paja-specific API, direct storage network access, signer access, credential, or low-level Blossom surface is documented.
- Cancellation returns no success URL. If a replica was already stored, only host diagnostics report that durable copies may remain; Paja does not claim deletion.

## Protocol Authority Check

Rechecked before NAP-facing documentation edits:

| Authority | Exact checked source | Result |
| --- | --- | --- |
| NAP-UPLOAD | `napplet/naps@a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-UPLOAD.md` | Preserved generic shell-mediated upload authority, standard statuses, `url`, and `fallbackUrls`. |
| NAP-RESOURCE | `napplet/naps@fa6bcc6935aa19e7b70ab2a2c721dafca77c78e1:naps/NAP-RESOURCE.md` | Preserved standard shell-mediated `resource.bytes` preview and cancellation boundary. |
| NAP-BLOSSOM | `napplet/naps@ca1d7ba594e6790785dc770227085d8648d39631:naps/NAP-BLOSSOM.md` | Kept low-level Blossom outside this client surface; Paja exposes generic upload and resource only. |
| NAP-SHELL | `napplet/naps@a7cc17463cbf5d9cb87884b31071bc4fc826034c:naps/NAP-SHELL.md` | Retained mandatory shell handshake and capability support versus run-time availability distinction. |
| Installed declarations | `@napplet/nap@0.29.0` upload/resource declarations in this worktree | Current upload result types expose `url`, `fallbackUrls`, and string `error`, but no per-replica outcome field. |

The four pinned sources are the documentation authority. Current local `napplet/naps` master has none of these checked paths, so all docs label Kehto as pinned-draft aligned and make no current-master conformance claim. The absent per-replica outcome is documented as an upstream schema gap; replica evidence remains host-only.

## Verification

Passed from `/workspace/projects/kehto/paja-blossom-wave4-05` with `PATH=/tmp/kehto-phase103-corepack-bin:$PATH`:

```text
corepack pnpm build
# 32/32 workspace build tasks successful

corepack pnpm docs:check
# strict TypeDoc, VitePress build, API copy, and docs audit passed

corepack pnpm --filter @kehto/paja build
# passed

corepack pnpm --filter @kehto/services build
# passed

corepack pnpm exec changeset status
# @kehto/paja and @kehto/services reported as minor bumps

git diff --check
# passed

stale first-server / descriptor-only documentation audit
# passed

npx --no-install aislop scan -d
# 85/100 Healthy, 0 errors; four inherited tautological-test warnings only
```

The first strict docs gate exposed that this freshly created worktree had no ignored package build outputs for TypeDoc workspace resolution. Running the existing root build restored only ignored generated outputs; the rerun passed. No install, lockfile, source, generated-output, or planning artifact was added to the committed contribution.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 3 - Environment] Restored local build outputs before the strict TypeDoc gate**
   - **Found during:** Task 1 documentation verification.
   - **Issue:** Strict TypeDoc could not resolve workspace package declarations because this worktree lacked ignored `dist` outputs.
   - **Fix:** Ran the existing `corepack pnpm build` command with the supplied Corepack PATH shim, then reran the required docs gate successfully.
   - **Files modified:** Ignored local build outputs only; no tracked source files beyond the planned documentation files.
   - **Commit:** none; environment-only remediation.

No dependency install, lockfile update, source-scope drift, NIP-96 behavior, low-level Blossom API, planning artifact, Writer file, or Plan 04 test was included.

## Known Stubs

None. The changed files contain no UI data path, placeholder, TODO, FIXME, skipped test, or unrun required verification.

## Threat Flags

None. This plan changed documentation and release metadata only; it introduced no new endpoint, authentication path, schema boundary, or file-access behavior. The documentation explicitly mitigates the plan's operator-configuration and pinned-reference risks.

## Orchestrator Post-Wave Gate

- Full merged-wave gates passed: build 32/32, type-check, 128 unit files / 1,617 tests, docs check.
- Both focused changesets survived merge; AI-slop stayed source-base-identical at 85/100.

## Self-Check: PASSED

- Confirmed all five planned documentation and changeset files exist.
- Confirmed commits `f8d3377d` and `1f7c4c7c` exist.
- Confirmed the commit range from `68869ffdf4eb81246c6e85bf7bc8abf67f2cbe94` contains exactly the five planned paths and no deletions.
- Confirmed the final worktree is clean and remains on `worktree-agent-103-05` at `1f7c4c7c01f87b9dde82b42604400027369e52c0`.
