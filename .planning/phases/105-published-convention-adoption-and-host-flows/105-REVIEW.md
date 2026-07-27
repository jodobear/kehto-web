---
phase: 105-published-convention-adoption-and-host-flows
reviewed: 2026-07-27T11:51:15Z
depth: standard
files_reviewed: 90
files_reviewed_list:
  - .changeset/phase-105-published-package-line.md
  - apps/playground/README.md
  - apps/playground/napplets/feed/package.json
  - apps/playground/napplets/feed/src/main.ts
  - apps/playground/napplets/feed/src/profile-media.ts
  - apps/playground/napplets/lists-demo/package.json
  - apps/playground/napplets/preferences/package.json
  - apps/playground/napplets/profile-viewer/package.json
  - apps/playground/napplets/profile-viewer/src/main.ts
  - apps/playground/napplets/profile-viewer/src/profile-media.ts
  - apps/playground/napplets/profile-viewer/vite.config.ts
  - apps/playground/napplets/resource-demo/package.json
  - apps/playground/napplets/serial-demo/package.json
  - apps/playground/napplets/toaster/package.json
  - apps/playground/napplets/webrtc-demo/package.json
  - apps/playground/package.json
  - apps/playground/src/acl-panel.ts
  - apps/playground/src/installed-napplet-catalog.ts
  - apps/playground/src/main.ts
  - apps/playground/src/playground-intent-controller.ts
  - apps/playground/src/shell-host.ts
  - docs/how-tos/paja-getting-started.md
  - docs/how-tos/paja-local-authoring.md
  - docs/packages/acl.md
  - docs/packages/firewall.md
  - docs/packages/paja.md
  - docs/packages/playground.md
  - docs/packages/runtime.md
  - docs/packages/services.md
  - docs/packages/shell.md
  - docs/policies/NIP-5D-CONFORMANCE.md
  - docs/policies/SHELL-RESOURCE-POLICY.md
  - packages/acl/README.md
  - packages/acl/jsr.json
  - packages/acl/package.json
  - packages/cli/package.json
  - packages/firewall/README.md
  - packages/firewall/jsr.json
  - packages/firewall/package.json
  - packages/firewall/src/evaluate.ts
  - packages/firewall/src/types.ts
  - packages/paja/README.md
  - packages/paja/jsr.json
  - packages/paja/package.json
  - packages/paja/src/browser-adapter-intent.test.ts
  - packages/paja/src/browser-adapter.ts
  - packages/paja/src/browser-host.test.ts
  - packages/paja/src/browser-host.ts
  - packages/paja/src/browser-intent-controller.test.ts
  - packages/paja/src/browser-intent-controller.ts
  - packages/paja/src/browser-runtime-tabs.test.ts
  - packages/paja/src/browser-runtime-tabs.ts
  - packages/paja/src/index.ts
  - packages/paja/src/installed-napplet-catalog.test.ts
  - packages/paja/src/installed-napplet-catalog.ts
  - packages/runtime/README.md
  - packages/runtime/jsr.json
  - packages/runtime/package.json
  - packages/runtime/src/firewall-dispatch.test.ts
  - packages/runtime/src/runtime.ts
  - packages/services/README.md
  - packages/services/jsr.json
  - packages/services/package.json
  - packages/services/src/catalog-intent-resolver.ts
  - packages/services/src/index.ts
  - packages/services/src/intent-service.ts
  - packages/services/src/manifest-intent-catalog.ts
  - packages/shell/README.md
  - packages/shell/jsr.json
  - packages/shell/package.json
  - packages/shell/src/napplet-namespace.test.ts
  - tests/e2e/identity-flow.spec.ts
  - tests/e2e/paja-runtime-pointer.spec.ts
  - tests/e2e/playground-profile-intent.spec.ts
  - tests/e2e/profile-open.spec.ts
  - tests/e2e/theme-broadcast.spec.ts
  - tests/fixtures/napplets/nap-identity/package.json
  - tests/fixtures/napplets/nap-inc/package.json
  - tests/fixtures/napplets/nap-notify/package.json
  - tests/fixtures/napplets/nap-relay/package.json
  - tests/fixtures/napplets/nap-storage/package.json
  - tests/fixtures/napplets/nap-theme/package.json
  - tests/unit/napplet-package-alignment.test.ts
  - tests/unit/nip5d-conformance-guard.test.ts
  - tests/unit/playground-gateway-guard.test.ts
  - tests/unit/playground-installed-catalog.test.ts
  - tests/unit/playground-intent-controller.test.ts
  - tests/unit/profile-resource-media.test.ts
  - tests/unit/published-napplet-contract.test.ts
  - tests/unit/sdk-migration-guard.test.ts
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 105: Code Review Report

**Reviewed:** 2026-07-27T11:51:15Z
**Depth:** standard
**Files Reviewed:** 90
**Status:** issues_found

## Summary

The published package pins, generated metadata, resource-Blob handling, and NAP-SHELL/INTENT authority references were reviewed against the Phase 105 authorities: NAP-INTENT at `a718915ddefa2f03a0126579601f59d8bd86f7c4`, and NAP-IDENTITY/THEME/SHELL at `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`. The implementation has an artifact-identity violation in both host flows and two lifecycle robustness defects. This conflicts with NAP-INTENT's requirement to retain delivery independently after acceptance and to route through installed manifest authority.

Focused relevant unit tests passed (106 tests), and `pnpm type-check` completed successfully. Those checks do not exercise the replacement and overlapping-request races below.

## Critical Issues

### CR-01: Intent delivery may target a live artifact that no longer matches the installed verified record

**Classification:** BLOCKER

**File:** `/Users/sandwich/.worktrees/kehto/napplet-scheme-conformance/apps/playground/src/shell-host.ts:282-283`; `/Users/sandwich/.worktrees/kehto/napplet-scheme-conformance/packages/paja/src/browser-host.ts:332-336`

**Issue:** Both hosts select a live target only by `dTag` after handler selection was made from the installed catalog. If the catalog is refreshed with a different verified aggregate under the same d-tag while an older iframe/tab remains live, they reuse that older artifact. Paja can select the first matching live tab even when several versions are open. The subsequent delivery is therefore sent to code whose `(dTag, aggregateHash)` does not match the manifest record that authorized the accepted intent. This violates the documented verified-catalog boundary and can execute an intent in stale, potentially less-restricted code.

**Fix:** Require the live target's aggregate hash to equal the selected installed record before reuse. Otherwise tear down/reload the stale target (or open a fresh one from the current verified descriptor), then re-check the d-tag, aggregate hash, and supported convention before delivery. Add regression coverage for replacing an installed record with the same d-tag and a different aggregate while its old iframe/tab remains live.

```ts
const live = [...napplets.values()].find((info) =>
  info.dTag === params.handler && info.aggregateHash === record.aggregateHash,
);
if (live) return replaceIntentGeneration(live);
// A same-dTag frame with a different aggregate must not receive this delivery.
```

## Warnings

### WR-01: Profile subscription callbacks can overwrite a newer profile and cancel its timeout

**Classification:** WARNING

**File:** `/Users/sandwich/.worktrees/kehto/napplet-scheme-conformance/apps/playground/napplets/profile-viewer/src/main.ts:202-231`

**Issue:** A second `loadProfile()` closes the prior subscription and starts a new timer, but the old subscription's already-queued `finish` callback still closes over the shared `profileLoadTimer` and DOM. If it runs after the newer load starts, it clears the newer request's timeout and may render the old pubkey/profile. This is a user-visible stale-state race when intents arrive close together.

**Fix:** Use a monotonically increasing request/generation token. Capture it in `finish` and the event callback, and return unless it is still current before clearing timers, closing subscriptions, or rendering. Keep each request's timer local rather than relying solely on the shared timer slot. Add a test that queues the first completion after starting a second delivery.

### WR-02: Invalid controller attempt limits can silently abandon or spin accepted delivery

**Classification:** WARNING

**File:** `/Users/sandwich/.worktrees/kehto/napplet-scheme-conformance/apps/playground/src/playground-intent-controller.ts:125-128`; `/Users/sandwich/.worktrees/kehto/napplet-scheme-conformance/packages/paja/src/browser-intent-controller.ts:122-125`

**Issue:** `normalizeAttempts()` accepts `NaN` and infinity. `NaN` makes the retry loop execute zero times after the source was already accepted; `Infinity` can create an unbounded retry loop when the target remains unavailable. Both contradict the stated bounded terminal policy.

**Fix:** Require a finite integer and apply an explicit maximum (or reject invalid construction input).

```ts
function normalizeAttempts(value: number | undefined): number {
  if (value === undefined) return 2;
  if (!Number.isFinite(value)) throw new TypeError('maxAttempts must be finite');
  return Math.min(MAX_ATTEMPTS, Math.max(1, Math.floor(value)));
}
```

---

_Reviewed: 2026-07-27T11:51:15Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
