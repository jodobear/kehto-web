---
phase: 106-active-surface-conformance-and-release
reviewed: 2026-07-27T16:35:49Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - docs/superpowers/specs/2026-06-15-nap-intent-design.md
  - scripts/verify-napplet-authorities.mjs
  - scripts/verify-phase-106-conformance-matrix.mjs
  - tests/unit/sdk-migration-guard.test.ts
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: issues_found
---

# Phase 106: Code Review Report

**Reviewed:** 2026-07-27T16:35:49Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the Phase 106 authority and matrix verifiers, the active-surface migration guard, and the superseded-design banner. The focused matrix verifier passed 94 tests, the migration guard passed 13 tests, and the live authority verifier passed. Those results are insufficient because the migration guard can silently omit live source roots, does not inspect the guidance files it claims to audit, and only searches one source line at a time for several obsolete intent shapes.

## Critical Issues

### CR-01: Declared active guidance is never audited

**Classification:** BLOCKER

**File:** `tests/unit/sdk-migration-guard.test.ts:174-190`

**Issue:** `activeMigrationTextFiles` is only checked for membership and existence. It is never passed to `sourceFiles`, read for obsolete vocabulary, or otherwise validated (the later scans at lines 354-364 use only `obsoleteActivePatterns` source roots). As a result, a current README, policy, or API reference can reintroduce a legacy NAP contract while this guard remains green, contrary to its stated independent audit of current user-facing guidance.

**Fix:** Define text-specific forbidden/current-authority assertions and apply them to every `activeMigrationTextFiles` entry. Keep the dated design as a special case that checks only its supersession banner, rather than scanning its preserved historical body. For example:

```ts
for (const file of activeMigrationTextFiles) {
  const text = readFileSync(join(process.cwd(), file), 'utf8');
  if (file !== HISTORICAL_INTENT_DESIGN) {
    expect(text).not.toMatch(OBSOLETE_GUIDANCE_PATTERN);
  }
}
```

### CR-02: Missing protected source roots are accepted as clean

**Classification:** BLOCKER

**File:** `tests/unit/sdk-migration-guard.test.ts:136-151`

**Issue:** `sourceFiles()` returns an empty list when its root is absent. Every active-source scan then treats that empty list as no violations (lines 319-325 and 354-364), and the only guard at line 349 verifies merely that the configured array is nonempty. Moving or deleting a protected directory can therefore remove it from conformance coverage without causing this test to fail; code reintroduced at its new location is not inspected.

**Fix:** Fail closed for every configured active source root before scanning it, and keep the returned list only for an existing directory:

```ts
function sourceFiles(root: string): string[] {
  expect(existsSync(root), `active migration root is missing: ${relative(process.cwd(), root)}`).toBe(true);
  // continue recursive collection
}
```

Alternatively, assert all configured roots exist before both scan loops and make `sourceFiles` throw for a missing root.

### CR-03: Line-by-line matching misses ordinary multi-line obsolete intent objects

**Classification:** BLOCKER

**File:** `tests/unit/sdk-migration-guard.test.ts:354-362`

**Issue:** The obsolete-shape loop splits each source file into individual lines before testing. Several patterns require both an intent message and prohibited fields or INC coupling (lines 104-107), so standard multi-line object literals evade detection. For example, `type: 'intent.invoke.result'` on one line and `handled: true` on the next will not match `intent-completion-fields`, allowing the deprecated result shape back into an active service while the guard passes.

**Fix:** Match those semantic patterns against complete file content (or a bounded multi-line window) and translate each match offset to a line number for diagnostics. Preserve per-line checks only for patterns that are deliberately line-local:

```ts
const text = readFileSync(abs, 'utf8');
for (const match of text.matchAll(pattern)) {
  const line = text.slice(0, match.index).split(/\r?\n/).length;
  violations.push(`${patternId}:${file}:${line}`);
}
```

Update the relevant intent/INC regexes to allow whitespace and line breaks between the message name and the prohibited field.

---

_Reviewed: 2026-07-27T16:35:49Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
