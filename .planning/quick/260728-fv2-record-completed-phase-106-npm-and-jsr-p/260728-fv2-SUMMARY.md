---
quick_id: 260728-fv2
slug: record-completed-phase-106-npm-and-jsr-p
date: 2026-07-28
status: complete
branch: chore/phase-106-publication-closeout
commits:
  - bec8074 docs(106): record completed package publication
---

# Summary

Phase 106 now distinguishes its historical PR-readiness endpoint from the
separately authorized and completed registry publication.

## Delivered

- Added a 5/5 post-merge publication follow-up to the Phase 106 verification
  report without rewriting the original 13/13 PR-readiness verdict.
- Added exact merge, main-CI, Pages, release-workflow, npm, JSR, and clean
  downstream evidence to the Phase 106 release checklist.
- Updated current `PROJECT.md`, `ROADMAP.md`, and `STATE.md` claims so they no
  longer describe PR #204 or the package release as pending.
- Preserved the Phase 105 12/24 UI audit as explicit non-passing debt; registry
  publication does not convert it into visual sign-off.

## Published package proof

Release [#30350331202](https://github.com/kehto/web/actions/runs/30350331202)
completed successfully on exact source
`54ef2ead03ee0c37783727468b8658b6dc224137`. Its npm OIDC and JSR publish steps
both passed.

Direct npm and JSR assertions passed for:

- `@kehto/acl@0.16.0`
- `@kehto/cli@0.3.0`
- `@kehto/firewall@0.4.0`
- `@kehto/paja@0.9.0`
- `@kehto/runtime@0.19.0`
- `@kehto/services@0.17.0`
- `@kehto/shell@0.18.0`

The npm packages expose the Napplet 0.29 peer window, and published JSR
manifests use the matching `^0.29.0` mappings wherever core/nap is imported
directly.

## Downstream proof

A clean temporary npm project installed `@kehto/paja@latest`,
`@napplet/core@latest`, and `@napplet/nap@latest` without peer-resolution
errors. It resolved Paja/core/nap as 0.9.0/0.29.0/0.29.0, imported Paja's ESM
entry successfully, and produced a 182,507-byte Node-platform esbuild bundle.
The Node target is intentional because Paja's root exports include its Node
server APIs.

## Verification

- Main CI #30299386244 — successful on the exact release SHA.
- Pages #30299386308 — artifact build, audit, and deploy successful on the
  exact release SHA.
- Release #30350331202 — npm and JSR steps successful.
- PRs #204, #209, #210, and #211 — merged.
- Seven npm `latest`, peer-range, JSR `latest`, and published JSR-manifest
  assertions — passed.
- `pnpm build` — passed.
- `pnpm type-check` — passed.
- `pnpm test:unit` — 126 files / 1,576 tests passed.
- `pnpm docs:check` — 9 public package docs and site/API gates passed.
- `npx --yes aislop@0.12.0 scan -d` — 100/100 clean.
- `git diff --check` — passed.

## NAP conformance

No NAP or NIP-5D behavior changed. This task records the release of the
already-verified Phase 106 implementation.
