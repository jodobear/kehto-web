# Deferred Items

- `packages/runtime/src/discovery.test.ts:51,57,72` and `packages/runtime/src/dispatch.test.ts:856` retain four pre-existing `aislop/tautological-test` warnings. The Phase 102-02 quality scan reported `85 / 100 Healthy` with no errors after the plan's own unused-import warning was corrected. These unrelated runtime-test warnings remain outside this plan's Paja and identity-service scope.
- `docs/packages/firewall.md:22` states `@kehto/firewall` version `0.3.9` while its package manifest is `0.3.10`; the Plan 102-04 `pnpm docs:check` audit consequently reports one unrelated documentation violation. The stale row predates both the integrated `738c3ce5` baseline and Task 1, so it remains outside the Paja-only Phase 102 scope.
