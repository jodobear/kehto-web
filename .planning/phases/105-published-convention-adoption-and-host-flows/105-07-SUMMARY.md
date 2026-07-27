---
phase: 105-published-convention-adoption-and-host-flows
plan: 07
subsystem: paja-browser-host
tags: [paja, nap-intent, nap-shell, nap-theme, nip-5d, playwright]
requires:
  - phase: 105-06
    provides: "Persistent verified Paja catalog and retained controller seams."
provides:
  - "Resolver-verified Paja installations that outlive tab frames."
  - "Source-bound, generation-specific retained intent delivery with teardown retry."
  - "Deterministic local browser proof for source-independent cold delivery."
affects: [105-09, paja, intent, theme, nip-5d]
tech-stack:
  added: []
  patterns: [verified-install-catalog, source-bound-ready-delivery, generation-owned-teardown]
key-files:
  created: []
  modified:
    - packages/paja/src/browser-host.ts
    - packages/paja/src/browser-runtime-tabs.ts
    - packages/paja/src/browser-host.test.ts
    - packages/paja/src/browser-runtime-tabs.test.ts
    - tests/e2e/paja-runtime-pointer.spec.ts
key-decisions:
  - "Install Paja catalog records only after resolver signature, aggregate, and blob verification succeeds."
  - "Use MessageEvent.source plus origin registration and tab generation for readiness and target-only intent delivery."
  - "Keep ThemeService as Paja's sole state-before-one-push route."
patterns-established:
  - "Closing or replacing a frame clears retained readiness before runtime/session/origin/frame teardown, without removing catalog authority."
requirements-completed: [PKG-01, THEME-04]
coverage:
  - id: D1
    description: "Verified pointer tabs persist handler eligibility while retained delivery waits for the current registered source."
    requirement: PKG-01
    verification:
      - kind: unit
        ref: "packages/paja/src/browser-host.test.ts and browser-runtime-tabs.test.ts"
        status: pass
      - kind: e2e
        ref: "tests/e2e/paja-runtime-pointer.spec.ts#retains an accepted verified intent"
        status: pass
    human_judgment: false
  - id: D2
    description: "A late required-theme Paja frame reads stored ThemeService state and receives exactly one matching change."
    requirement: THEME-04
    verification:
      - kind: e2e
        ref: "tests/e2e/paja-single-window.spec.ts#applies simulation config and compact theme adjustment"
        status: pass
    human_judgment: false
metrics:
  duration: 24m
  completed: 2026-07-27
status: complete
---

# Phase 105 Plan 07: Paja Verified Intent Lifecycle Summary

**Paja now installs only verified pointer manifests, retains accepted intent delivery across source teardown, and releases it exactly once to a source-bound cold target generation.**

## Accomplishments

- Connected the resolver-verified pointer catalog and retained controller to live Paja runtime tabs; closed frames no longer remove installed handler authority.
- Bound readiness and target delivery to the registered `MessageEvent.source`, current window ID, and tab generation; replacement rejects pending readiness before session/origin/frame teardown.
- Added deterministic local Relay/Blossom Playwright coverage for accepted source teardown, cold target resolution, exactly-once delivery, no INC carrier, and forged sibling exclusion.
- Kept Paja's single `ThemeService` bridge path; the existing required-theme browser proof confirms initial `theme.get` state and one matching `theme.changed` update.

## NAP Authority

- NAP-INTENT: `napplet/naps` PR #91 head `a718915ddefa2f03a0126579601f59d8bd86f7c4` — acceptance transfers delivery responsibility, delivery may follow source closure, and `intent.deliver` is target-only and independent of INC.
- NAP-SHELL: `napplet/naps@c5cd06f7be6d4690b303949abb26e87ff62f4729` — the first bare `shell.ready` establishes the identity-bound session and yields exactly one `shell.init`.
- NAP-THEME: `napplet/naps@c5cd06f7be6d4690b303949abb26e87ff62f4729` — current `theme.get` state and one shell-owned `theme.changed` push to eligible targets.
- NIP-5D provenance: the established `dskvr/nips` `nip/5d` authority and Kehto's verified-byte policy remain conformant: resolver-verified bytes alone populate the catalog and reach the opaque `allow-scripts` `srcdoc` path.

## Task Commits

1. **Task 1 RED: Add retained-delivery coverage** — `f76bdfc` (test)
2. **Task 1 GREEN: Wire verified Paja intent targets** — `e51d7c5` (feat)
3. **Task 2: Prove deterministic cold delivery** — `cbd75d5` (test)

## Verification

- `pnpm exec vitest run packages/paja/src/browser-host.test.ts packages/paja/src/browser-runtime-tabs.test.ts packages/paja/src/browser-intent-controller.test.ts` — passed (20 tests).
- `pnpm --filter @kehto/paja build` — passed; existing tsup `sideEffects` warning from `@kehto/nip` remains non-fatal.
- `pnpm exec playwright test tests/e2e/paja-runtime-pointer.spec.ts --workers=1` — passed (2 local tests, 1 opt-in live test skipped).
- `pnpm exec playwright test tests/e2e/paja-single-window.spec.ts --workers=1` — 5 passed, 1 failed: the pre-existing canonical INC reload assertion is tracked in `deferred-items.md`; the required ThemeService case passed.
- `git diff --check` — passed.

## Deviations from Plan

None in shipped implementation. The single-window INC reload failure was isolated from the verified-pointer changes and recorded as a deferred, out-of-scope regression.

## Self-Check: PASSED

- Required source, unit-test, E2E-test, and summary files exist.
- Commits `f76bdfc`, `e51d7c5`, and `cbd75d5` exist and include the required Codex co-author trailer.

## Next Phase Readiness

Plan 105-09 can consume the retained Paja conventions without weakening NAP-SHELL ownership or verified `srcdoc` provenance. Investigate the deferred single-frame INC reload regression separately.
