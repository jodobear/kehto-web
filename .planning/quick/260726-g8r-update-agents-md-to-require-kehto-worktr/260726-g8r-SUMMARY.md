---
status: complete
quick_id: 260726-g8r
completed: 2026-07-26
---

# Quick Task 260726-g8r Summary

Updated `AGENTS.md` so additional Kehto worktrees must live under
`~/.worktrees/kehto/` and must not be created as `/Users/sandwich/Develop/kehto-*`
siblings. The policy also tells agents to run `git worktree list`, reuse an
existing branch checkout when present, and move misplaced worktrees with
`git worktree move`.

Moved the existing `chore/napplet-scheme-conformance` checkout to
`/Users/sandwich/.worktrees/kehto/napplet-scheme-conformance` before the doc
change. A follow-up `find /Users/sandwich/Develop -maxdepth 1 -type d -name
'kehto-*' -print` returned no leftover sibling directories.

During verification, `pnpm docs:check` exposed stale release metadata rows for
`@kehto/firewall` and `@kehto/paja`. Updated those package docs from `0.3.9` to
`0.3.10` and from `0.8.1` to `0.8.2`, respectively, then reran the docs gate
successfully.

Verification:

- `git worktree list` shows only the primary checkout in `/Users/sandwich/Develop/kehto`
  plus the extra checkout under `~/.worktrees/kehto/napplet-scheme-conformance`.
- `find /Users/sandwich/Develop -maxdepth 1 -type d -name 'kehto-*' -print`
  returned no paths.
- `git diff --check` passed.
- `pnpm docs:check` passed.
- `pnpm build` passed.
- `pnpm type-check` passed.
- `pnpm test:unit` passed: 106 files, 1389 tests.
- Full `npx --yes aislop scan` exited 0 with an existing 85/100 baseline from
  `packages/runtime/src/discovery.test.ts`; no errors or fixable issues.
- `npx --yes aislop scan --staged` exited 0 at 100/100, but this scanner
  version reported `0 staged file(s)` for the Markdown-only staged diff.
