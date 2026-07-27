# Deferred Items

- `pnpm exec tsc -p apps/playground/tsconfig.json --noEmit` remains blocked by pre-existing `dm:read`/`dm:write` capability-map omissions in `apps/playground/src/acl-panel.ts` and `apps/playground/src/shell-host.ts`, and direct package-resolution errors in `apps/playground/src/demo-hooks.ts`/`apps/playground/src/shell-host.ts`. Plan 105-08's focused tests and Vite build pass; this plan did not modify the unrelated capability map or dependency resolution setup.
