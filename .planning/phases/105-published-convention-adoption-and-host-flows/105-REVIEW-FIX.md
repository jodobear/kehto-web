---
phase: 105
fixed_at: 2026-07-27T12:32:14Z
review_path: /Users/sandwich/.worktrees/kehto/napplet-scheme-conformance/.planning/phases/105-published-convention-adoption-and-host-flows/105-REVIEW.md
iteration: 5
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 105: Code Review Fix Report

**Fixed at:** 2026-07-27T12:32:14Z  
**Source review:** `/Users/sandwich/.worktrees/kehto/napplet-scheme-conformance/.planning/phases/105-published-convention-adoption-and-host-flows/105-REVIEW.md`  
**Iteration:** 5 (manual blocker cycle)

**Summary:**

- Findings in scope: 1
- Fixed: 1
- Skipped: 0

## Fixed Issues

### CR-01: Catalog replacement leaves retained delivery waiting indefinitely on a stale unready target

**Files modified:** `apps/playground/src/shell-host.ts`, `packages/paja/src/browser-host.ts`, `tests/unit/playground-intent-controller.test.ts`, `packages/paja/src/browser-host.test.ts`  
**Commit:** `b9d5f07`  
**Applied fix:** Both hosts now subscribe their active readiness-wait registry to installed-catalog changes. A changed or removed selected record synchronously rejects and clears the stale readiness wait, allowing the bounded controller to retry the current catalog record. Paja unsubscribes on `pagehide`; Playground installs one listener per shell lifecycle and removes it on `pagehide`. Real-host regressions keep A permanently unready, cover an equal-record object replacement followed by B, and verify that only ready B receives one `intent.deliver`.

---

_Fixed: 2026-07-27T12:32:14Z_  
_Fixer: the agent (gsd-code-fixer)_  
_Iteration: 5_
