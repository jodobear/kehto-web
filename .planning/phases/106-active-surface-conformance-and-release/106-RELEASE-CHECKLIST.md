---
phase: 106
status: evidence-in-progress
checked_at: 2026-07-27T15:54:58Z
authority_verdict: conformant
tested_branch: chore/napplet-scheme-conformance
tested_source_sha: 1302489f71a2a065bf314d729128f27d852629b4
---

# Phase 106 Release Checklist

This checklist records Phase 106 PR-readiness evidence only. It does not
authorize merge, release metadata creation, tagging, or publishing.

## Authority and focused unit evidence

- Authority verdict: [conformant Phase 106 authority revalidation](./106-AUTHORITY-REVALIDATION.md).
- Focused conformance matrix: [47 requirements / 9 files / 94 tests passed](./106-CONFORMANCE-MATRIX.md).
- The full release gate, changeset accounting, target-main CI evidence, and PR
  check state are deliberately unexecuted at this task boundary.

## Focused real-shell browser evidence

- **Command:** `pnpm test:e2e -- tests/e2e/napplet-auth.spec.ts tests/e2e/inc-roundtrip.spec.ts tests/e2e/nap-inc-playground.spec.ts tests/e2e/identity-flow.spec.ts tests/e2e/theme-broadcast.spec.ts tests/e2e/playground-profile-intent.spec.ts tests/e2e/profile-open.spec.ts`
- **Started:** `2026-07-27T15:54:41Z`
- **Finished:** `2026-07-27T15:54:58Z`
- **Duration:** 17 seconds (including the repository `test:build` prerequisite)
- **Exit status:** 0
- **Playwright result:** 9 passed, 0 failed, 0 skipped, one configured worker.
- **Tested branch/source:** `chore/napplet-scheme-conformance` at `1302489f71a2a065bf314d729128f27d852629b4`.

| Required flow class | Real-shell test result | Trust-boundary evidence exercised |
| --- | --- | --- |
| Pre-session and domain-gated shell startup | `tests/e2e/napplet-auth.spec.ts` — `chat napplet reaches ready state at :4174`; `bot napplet reaches ready state at :4174` — PASS | The built playground frames complete the host-owned `shell.ready`/`shell.init` startup path; no page-visibility-only substitute was used. |
| Exact INC event and symmetric-channel routing | `tests/e2e/inc-roundtrip.spec.ts` — `chat input triggers inc envelope; bot reply appears in chat messages`; `tests/e2e/nap-inc-playground.spec.ts` — `two live playground frames retain exact NAP-INC events and symmetric channel lifecycle` — PASS | The live sibling frames exercise exact event routing plus symmetric handles, retained closures, and trusted parent/source ordering. |
| URI-authoritative, buffered, source-independent intent delivery | `tests/e2e/playground-profile-intent.spec.ts` — `accepts the feed profile convention before its source closes and cold-starts one profile delivery without INC`; `tests/e2e/profile-open.spec.ts` — `profile-viewer receives the published profile convention from the feed frame` — PASS | The accepted `napplet:profile/open` delivery survives source closure, cold-starts the verified target once, and proves `intent.deliver` without an `inc.*` carrier. |
| Identity sign-out and resource-mediated revocable media | `tests/e2e/identity-flow.spec.ts` — `profile-viewer waits for NAP-INTENT delivery instead of reading identity directly` — PASS | The real profile frame exposes canonical identity/intent APIs while rejecting direct identity access and legacy signer/Nostr terms; the Phase 105 verified profile path remains resource-mediated and revocable rather than remote-image based. |
| State-before-one-push atomic theme updates | `tests/e2e/theme-broadcast.spec.ts` — `clicking host dark button stores then pushes one complete theme through the injected API`; `a required-theme profile reads current state and receives one matching change` — PASS | A forged sibling `shell.ready` produces no update; eligible frames receive exactly one complete stored theme and `theme.get()` observes the same atomic value. |

## Allowed-skip evidence

No test was skipped in this run. The existing optional live-network Good Morning
Protocol case was not part of this focused seven-file command, so there is no
optional skip to record here. Any mandatory skip or failure would have blocked
this checklist.

## PR and release state at this task boundary

| Item | State |
| --- | --- |
| PR #204 URL/head/check state | Not queried or claimed by this task; final PR evidence remains pending the Plan 106-03 gate. |
| Seven-package changeset state | Not assessed by this task; pending the Plan 106-03 release gate. |
| Branch synchronization | Focused evidence was collected from the recorded worktree branch and source SHA above; synchronization with target `main` is not yet claimed. |
| Full build/type/unit/docs/AI-slop gate | Not executed by this evidence task; pending the Plan 106-03 release gate. |

## UI audit disposition — explicit non-blocking protocol-release debt

The [Phase 105 UI audit](../105-published-convention-adoption-and-host-flows/105-UI-REVIEW.md)
scored the Paja and playground hosts **12/24** from automated desktop (1280×720)
and mobile (375×812) captures. This is **not a visual pass or visual sign-off**.
It remains visible, non-blocking protocol-release debt because the focused Phase
106 evidence proves the protocol/runtime behavior required for PR #204 without
claiming that its hosts meet the audit's visual bar.

- **recoverability:** profile/feed denial, unavailable, and not-found states lack
  keyboard-accessible retry or reconnect actions; Paja can expose an unstyled raw
  target-load error.
- **Legibility and type scale:** embedded status, label, and metadata content is
  commonly 9–10px, below a robust readable default.
- **Semantic tokens and spacing:** Paja and embedded napplets retain hard-coded
  colors and ungoverned pixel increments instead of a shared token and spacing
  scale.
- **Mobile composition:** the playground's tall sparse topology loses hierarchy
  at 375px, while Paja hides target context, clips dense controls, and wraps its
  footer into fragments.

**Owner and scope:** Kehto maintainers own a separately scoped post-merge UI
follow-up. Phase 106 includes no broad UI redesign, token migration, or visual
approval. The functional and security dependency record remains the [Phase 105
verification](../105-published-convention-adoption-and-host-flows/105-VERIFICATION.md)
and the [closed Phase 105 ASVS L1 report (29/29 threats,
0 open)](../105-published-convention-adoption-and-host-flows/105-SECURITY.md).

## Boundary

The authorized endpoint for Phase 106 is a green, merge-ready
[PR #204](https://github.com/kehto/web/pull/204). This Plan 106-02 does not
claim the final PR head/check state or mergeability; that evidence remains
pending the Plan 106-03 release gate. It does not authorize merge of PR #204,
creating a Version Packages PR, exact-target-`main` CI confirmation, a tag,
`release.yml` dispatch, or any publish operation.

The following are informational, unexecuted post-merge steps owned by the
release process:

1. A Kehto maintainer merges the green PR #204.
2. After `main` CI is green, `publish.yml` creates or updates the generated
   Version Packages PR.
3. The generated release-metadata guard verifies docs package-version rows and
   JSR metadata, then a maintainer merges that Version Packages PR.
4. The maintainer identifies the exact target `main` SHA and verifies the CI
   run for that same SHA before release.
5. Only then may a maintainer push the release tag or dispatch `release.yml`,
   which is the sole npm/JSR publisher.
