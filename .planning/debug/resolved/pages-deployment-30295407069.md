---
slug: pages-deployment-30295407069
status: resolved
trigger: "fix ghp deployment https://github.com/kehto/web/actions/runs/30295407069"
created: 2026-07-27
updated: 2026-07-27T19:16:57Z
---

# Debug: Pages Deployment Run 30295407069

## Symptoms

**Expected:** GitHub Pages workflow run 30295407069 builds, audits, uploads, and deploys the unified Kehto `/web/` site successfully.

**Actual:** The workflow run fails and the Pages deployment does not complete.

**Error messages:** Not yet classified; inspect the failed job and exact command output from the supplied run.

**Timeline:** Reported 2026-07-27 after PR #204 merged to `main`.

**Reproduction:** Inspect or rerun GitHub Actions run 30295407069 for its exact `main` head SHA and failed Pages job.

## Current Focus

hypothesis: Confirmed and fixed. PR #204 extracted loader behavior to playground-frame-loader.ts, but the executable Pages audit retained three shell-host.ts predicates.
test: The regression, direct audit, exact Pages job sequence, full unit suite, and pinned quality gate all pass.
expecting: The Pages build reaches artifact upload/deployment with all NIP-5D/NAP-SHELL loader invariants still enforced.
next_action: None. Keep the executable-audit ownership regression aligned with future loader refactors.

## Evidence

- Run 30295407069 is a push run for exact `main` SHA `b85db51db838866de753b275b9d34ec908785bd2`, the merge commit for PR #204.
- Build, type-check, Pages-base playground/Paja rebuilds, and the docs quality gate all passed before the failure.
- `pnpm audit:gateway-artifacts` is the first failing command.
- The audit reports exactly three structural violations: no `iframe.srcdoc` injection, no creation-time computed-identity registration, and no explicit `sandbox` `allow-scripts` addition in `shell-host.ts`.
- Artifact packing, upload, and deployment were skipped only because the audit exited 1.
- The current code graph traces exported `shell-host.loadNapplet()` directly to `playground-frame-loader.loadPlaygroundNapplet()`.
- `loadPlaygroundNapplet()` still resolves and verifies bytes, freezes `{ dTag, aggregateHash }`, registers that identity and environment before execution, adds `sandbox="allow-scripts"`, injects CSP, and assigns verified content through `iframe.srcdoc`.
- `tests/unit/playground-gateway-guard.test.ts` was updated by PR #204 to scan `playground-frame-loader.ts`; the executable `scripts/audit-gateway-artifacts.mjs` was not.
- Protocol check: merged `napplet/naps@5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`, `naps/NAP-SHELL.md` and `projections/web.md`, requires creation-time runtime identity, trusted `MessageEvent.source`, and `sandbox="allow-scripts"` web frames. The extracted loader remains conformant; the audit is stale.
- The new focused regression failed before the repair because the executable audit had no `frameLoader` source, while the other 17 guard tests passed.
- After redirecting only loader-owned predicates to `playground-frame-loader.ts`, the focused guard passes 18/18.
- The exact Pages workflow sequence passes locally with `PLAYGROUND_BASE_PATH=/web/playground/` and `VITEPRESS_BASE=/web/docs/`: build, type-check, playground/Paja rebuilds, docs, gateway audit, Pages packing, and Pages audit.
- The repaired direct audit reports `OK — checked 15 napplet gateway artifact(s)`.
- The unified artifact audit verifies `/web/`, `/web/playground/`, `/web/paja/`, `/web/docs/`, gateway routes, and TypeDoc output.
- Full unit regression passes 125 files / 1,574 tests.
- Pinned `aislop@0.12.0` passes at 100/100, and `git diff --check` is clean.

## Eliminated

- GitHub Pages infrastructure failure: the workflow fails before artifact upload or deployment.
- Missing loader behavior: the live extracted loader contains all three rejected operations in the required trust order.

## Resolution

root_cause:
PR #204 decomposed playground frame loading from `apps/playground/src/shell-host.ts` into `apps/playground/src/playground-frame-loader.ts`. The unit conformance guard followed the move, but `scripts/audit-gateway-artifacts.mjs` still searched `shell-host.ts` for `iframe.srcdoc`, creation-time identity registration, and `sandbox.add('allow-scripts')`, so the first post-merge Pages run rejected conformant code.
fix:
Read the extracted frame loader in `assertSourceInvariants()` and apply every loader-owned positive and retired-navigation check there, while retaining the `shell.ready` identity-binding check against `shell-host.ts`. Add a unit regression that requires the executable audit to follow the frame-loader ownership boundary.
verification:
Red/green focused guard (1 expected failure, then 18/18 pass); exact Pages workflow build/type/rebuild/docs/gateway-audit/pack/pages-audit sequence; direct audit of 15 napplets; full unit suite 125 files / 1,574 tests; `aislop@0.12.0` 100/100; `git diff --check`.
files_changed:
`scripts/audit-gateway-artifacts.mjs`; `tests/unit/playground-gateway-guard.test.ts`; `.planning/debug/resolved/pages-deployment-30295407069.md`.
