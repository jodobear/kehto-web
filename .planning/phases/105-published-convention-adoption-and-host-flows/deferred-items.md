# Deferred Items

## 2026-07-27 — Paja single-window INC reload regression

- **Scope:** `tests/e2e/paja-single-window.spec.ts`
- **Observed:** The required command exits nonzero only because `keeps canonical INC protected through the real shim assignment in an opaque Paja srcdoc` fails after its reload: the second direct `inc.event` does not reach the reloaded fixture. The other five single-window cases pass, including the live ThemeService state/one-change assertion.
- **Why deferred:** Plan 105-07 changes verified pointer tab/catalog/controller ownership; its deterministic pointer E2E passes. The failing case is a pre-existing single-frame INC reload surface, and this plan must not broaden into shell/prelude protocol changes.
- **Suggested owner:** A focused NAP-INC/Paja single-frame reload investigation.
