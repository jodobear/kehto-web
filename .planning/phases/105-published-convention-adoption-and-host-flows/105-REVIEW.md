---
phase: 105-published-convention-adoption-and-host-flows
reviewed: 2026-07-27T12:39:07Z
depth: standard
files_reviewed: 92
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
  - apps/playground/napplets/profile-viewer/src/profile-load-controller.ts
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
  - tests/unit/profile-load-controller.test.ts
  - tests/unit/profile-resource-media.test.ts
  - tests/unit/published-napplet-contract.test.ts
  - tests/unit/sdk-migration-guard.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# Phase 105: Code Review Report

**Reviewed:** 2026-07-27T12:39:07Z
**Depth:** standard
**Files Reviewed:** 92
**Status:** clean

## Summary

Final integration re-review retains the 92-file scope and includes every change in `1748b2d` (`fix(105): align catalog token API vocabulary`). The changed catalog, host, and regression-test code was reviewed against NAP-INTENT PR 91 head `a718915ddefa2f03a0126579601f59d8bd86f7c4` and NAP-IDENTITY, NAP-THEME, and NAP-SHELL master `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`; there is no standalone NAP-RESOURCE authority.

WR-01 remains closed: profile callbacks, timers, and subscriptions are generation-scoped. WR-02 remains closed: both controllers reject non-finite limits and cap finite retries at 1–10. `validateCurrent` is a mechanical API rename: both implementations retain exact selected-record object identity plus dTag/aggregate validation, every host caller was updated, and no active legacy API caller or source-string assertion remains. The catalog listeners still synchronously invalidate stale waits on install, same-identity replacement, and removal; final delivery remains synchronous after its token check. The focused suite passes: 45 tests across six files, including the SDK migration guard.

All reviewed files meet the required correctness and security standard. No findings remain.

---

_Reviewed: 2026-07-27T12:39:07Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
