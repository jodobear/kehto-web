---
phase: 102-paja-standard-nap-social-poc
status: clean
reviewed: 2026-07-28
baseline: 297b5478ead54508a881909e658fda0c8ee19984
head: 81185b45c99544fbb63271da4bcfc69334e759e1
findings: 3
blockers: 0
warnings: 0
re_review: clean
---

# Phase 102 Code Review

Target: `/workspace/projects/kehto/paja-social-cache-rebase-probe`

## Verdict

**CLEAN.** Adversarial review found one high-severity authorization race and two medium-severity hydration lifecycle defects at `0e7b1f56`. Commit `81185b45` fixes all three with focused regressions. Independent re-review found no surviving concrete defect.

## Resolved Findings

### 1. Resolved — Recheck `identity:read` after the base OUTBOX query

**Severity:** High
**Files:** `packages/paja/src/browser-social-cache.ts`, `packages/paja/src/browser-social-cache.test.ts`

A query that began while identity-authorized could previously append follow-derived cached profiles after `identity:read` was revoked during the awaited base query. The decorator now requires authorization both at request start and immediately before cache augmentation. Revocation returns the unmodified base result, preserving its `events`, `incomplete`, and `error` fields.

Regression: a deferred base query revokes identity authorization before resolution and proves no cached profile is appended.

### 2. Resolved — Isolate one failed author warm from later follows

**Severity:** Medium
**Files:** `packages/paja/src/browser-social-cache.ts`, `packages/paja/src/browser-social-cache.test.ts`

A rejected per-author kind-0 query previously escaped to the outer best-effort catch and stopped hydration for every later verified follow. Each author query now has its own failure boundary. The scheduler rechecks account/generation state, skips only the failed author, continues sequentially, and retains event-loop yields.

Regression: a middle author rejects while earlier and later authors still become available through normal OUTBOX augmentation.

### 3. Resolved — Abort superseded live contact-list reads

**Severity:** Medium
**Files:** `packages/paja/src/browser-social-cache.ts`, `packages/paja/src/browser-social-cache.test.ts`, `packages/paja/src/browser-relay-runtime.ts`, `packages/paja/src/browser-relay-runtime.test.ts`

Generation checks previously prevented stale writes but left obsolete live kind-3 relay reads running until their deadline. Background refreshes now abort the prior generation. The signal reaches the contact-list loader and bounded live subscription, which closes with `paja query aborted`. Disposal also aborts active refresh work.

Regressions prove a new account aborts the prior cache load before warming and the underlying live relay subscription closes on abort.

## Preserved Invariants

- Every verified unique follow remains stored; no total-data cap was restored.
- Contact tags retain deterministic first-valid-tag order with exact 64-hex normalization and deduplication.
- Each profile warm remains one sequential `{ kinds: [0], authors: [author], limit: 1 }` query.
- Follow parsing and profile hydration yield every 64 operations.
- Profile state remains incremental and `Map`-backed.
- Stale generation/account writes remain blocked; superseded live contact reads now stop too.
- Cache augmentation requires source-bound `identity:read` at request start and response time.
- Base OUTBOX events remain authoritative on ID collisions; `incomplete` and `error` remain unchanged.

## Verification

| Gate | Result |
|---|---|
| Focused review regressions | 2 files, 30 tests passed |
| Complete Paja unit suite | 19 files, 149 tests passed |
| Full unit suite | 127 files, 1,605 tests passed |
| Build | Passed |
| Type check | Passed |
| Documentation | Passed |
| AI-slop | 85/100 Healthy, 0 errors, same 4 unrelated warnings |
| Full Chromium | 80 passed, 1 skipped in 1.6m |
| Writer restore | Exact argv/environment/cwd digests; 7 HTTP 200 probes |
| Whitespace and worktree | `git diff --check` passed; contribution worktree clean after commit |

## NAP Authority

- **NAP-IDENTITY:** `napplet/naps` master `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`; `naps/NAP-IDENTITY.md` blob `48e048828888d9693baa4523df8d687b2e531e93` is identical to pinned commit `6461e4b37c29dc09a20dff35d9515889c4433874`.
- **NAP-OUTBOX:** open PR #32 remains pinned at `4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e`; master still has no `naps/NAP-OUTBOX.md`.
- **Packaged contract:** `@napplet/nap@0.29.0`.
- **Determination:** identity behavior remains conformant to pinned/current master. OUTBOX behavior remains governed by the pinned open draft plus packaged declarations under documented upstream drift; no current-master OUTBOX conformance claim is made.

---

_Reviewed: 2026-07-28T21:25:30+05:30 against `upstream/main@297b5478`_
_Final contribution head: `81185b45c99544fbb63271da4bcfc69334e759e1`_
