---
phase: 106
fixed_at: 2026-07-27T16:42:40Z
review_path: /Users/sandwich/.worktrees/kehto/napplet-scheme-conformance/.planning/phases/106-active-surface-conformance-and-release/106-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 106: Code Review Fix Report

**Fixed at:** 2026-07-27T16:42:40Z
**Source review:** `/Users/sandwich/.worktrees/kehto/napplet-scheme-conformance/.planning/phases/106-active-surface-conformance-and-release/106-REVIEW.md`
**Iteration:** 1

**Summary:**

- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### CR-01: Declared active guidance is never audited

**Files modified:** `tests/unit/sdk-migration-guard.test.ts`
**Commit:** 80b9381
**Applied fix:** Audited every current guidance file with documentation-specific obsolete-shape patterns, kept the dated design limited to its supersession banner, and asserted current NAP-INTENT authority references in the policy and relevant package guidance.

### CR-02: Missing protected source roots are accepted as clean

**Files modified:** `tests/unit/sdk-migration-guard.test.ts`
**Commit:** 80b9381
**Applied fix:** Made source-root collection fail closed and added a regression assertion that a missing configured root throws instead of yielding an empty scan.

### CR-03: Line-by-line matching misses ordinary multi-line obsolete intent objects

**Files modified:** `tests/unit/sdk-migration-guard.test.ts`
**Commit:** 80b9381
**Applied fix:** Switched semantic pattern matching to full file content with match-offset line diagnostics, bounded multiline intent/INC patterns, and regression examples for multiline completion and INC-coupled objects.

---

_Fixed: 2026-07-27T16:42:40Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
