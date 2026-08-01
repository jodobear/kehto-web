# Deferred Items

- `tests/e2e/paja-single-window.spec.ts:628` retains the inherited upload-domain
  fixture failure: expected `shell-init received`, received
  `Required shell domains unavailable`. Phase 107 changes presentation and local
  recovery only; upload-domain behavior remains outside its scope. The defect is
  already open as `.planning/WINDOWS.md` entry 28.
