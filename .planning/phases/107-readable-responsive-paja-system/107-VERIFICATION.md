---
phase: 107-readable-responsive-paja-system
verified: 2026-07-31T13:24:18Z
status: human_needed
score: 90/91 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 87/91
  gaps_closed:
    - "External targets whose fetch or shell.ready never settles now enter stable host-owned recovery with Retry enabled."
    - "Verified runtime tabs that never emit shell.ready now enter stable host-owned recovery with failed session ownership removed and stale readiness ignored."
    - "The immutable-base diff and pinned AI-slop gates now pass reproducibly."
  gaps_remaining: []
  regressions: []
prohibition_flags:
  - statement: "Phase 107 visual recovery must not add, remove, reshape, or reinterpret any NAP message, capability, routing rule, lifecycle contract, sandbox permission, verified-byte boundary, or package version."
    status: unverified
    non_authoritative_verdict: "Code, phase diff, current-source checks, conformance tests, and browser provenance tests support compliance."
    flag: "unverified-prohibition — human review recommended"
  - statement: "Phone presentation must not hide Paja identity/current target, create page-level horizontal scrolling, or make host content permanently unreachable."
    status: unverified
    non_authoritative_verdict: "Chromium geometry, keyboard, overflow, and long-content tests at 375x812 and 640x360 support compliance."
    flag: "unverified-prohibition — human review recommended"
  - statement: "Feed/profile work must not add Phase 108 recovery behavior."
    status: unverified
    non_authoritative_verdict: "Diff inspection, static guards, and real-iframe state tests show semantic styling/tone changes only."
    flag: "unverified-prohibition — human review recommended"
human_verification:
  - test: "Review the Phase 107 source diff against the recorded NAP-SHELL, NAP-THEME, and NIP-5D authority refs."
    expected: "No message, capability, routing, lifecycle, sandbox, verified-byte, or package-version contract changed."
    why_human: "PLAN frontmatter classifies this prohibition as judgment-tier; automated evidence is non-authoritative."
  - test: "At 375x812 and 640x360, traverse all controls with keyboard and touch, expand long diagnostics, and scroll tabs, controls, stage, and footer."
    expected: "Identity and current target remain visible; no page horizontal scroll appears; every focus ring, control, and value remains reachable."
    why_human: "Automated geometry proves bounds but cannot certify perceived reachability and focus visibility."
  - test: "Exercise feed/profile empty, loading, data, partial, and failure states."
    expected: "Existing copy and transitions remain; no retry, reconnect, or behavioral recovery was added."
    why_human: "Negative behavioral scope is a judgment-tier prohibition in PLAN frontmatter."
  - test: "Confirm the two registered .claude/worktrees checkouts retain their expected files, registration, HEAD, and lock ownership from before Phase 107."
    expected: "No move, deletion, overwrite, lock change, or absorbed output occurred."
    why_human: "Current registry and Git range prove no tracked phase output, but cannot prove historical physical non-mutation."
---

# Phase 107: Readable Responsive Paja System Verification Report

**Phase Goal:** Paja users retain clear product/target context and usable controls across desktop, phone, and target-load failure states within one coherent visual system.
**Verified:** 2026-07-31T13:24:18Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure
**Verified HEAD:** `2290f8c5b4b467227f983883d024f3bdd7b5e206`

## Goal Achievement

### Observable Truths

Re-verification used the prior report's 91 truths. Previously failed behavior received full existence, substance, wiring, and behavioral checks; previously passed behavior received regression checks. The three judgment-tier prohibitions remain explicit and non-authoritative.

| # | Truth group | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Paja, feed, and profile use the bounded semantic palette/type/spacing system, with routine text at least 12px. | ✓ VERIFIED | Source declares the canonical `--ui-*` vocabulary; component rules consume it; exact-head Vitest and real-iframe Playwright passed. |
| 2 | Desktop and phone layouts retain identity, target, tabs, status, controls, stage, focus, and footer without clipping or page-level horizontal overflow. | ✓ VERIFIED | Chromium geometry, focus, long-target, phone, and 200%-effective viewport cases passed in the complete PR run. Judgment-tier perceived reachability remains human. |
| 3 | External target failures always settle into host-owned explanation, literal diagnostics, Retry, and return controls. | ✓ VERIFIED | `browser-host-runtime.ts` arms one timeout before config/target fetch, propagates one AbortSignal, unregisters failure ownership, and shows the stable error surface. Exact-head never-settling-fetch Chromium test passed. |
| 4 | Pre-tab and active runtime-tab failures use the same recoverable host contract while retaining context. | ✓ VERIFIED | `browser-runtime-tabs.ts` owns a deadline per generation, clears it on ready/error/reload/close/destroy, unregisters failed sessions, and rejects stale readiness. Exact-head never-ready Chromium test passed. |
| 5 | Retry uses the existing verified loader and preserves generation, source/session, verified-byte, CSP, sandbox, capability, routing, and lifecycle boundaries. | ✓ VERIFIED | Retry still routes through `reloadActiveRuntimeTab()` or external `state.reload()`/`navigateFrame()`; current registered source gates ready; provenance/conformance tests passed. Judgment-tier protocol prohibition remains human. |
| 6 | Runtime tabs, labels, actions, active target projection, teardown, and scoped-CI selection remain coherent and keyboard operable. | ✓ VERIFIED | Stable tabpanel wiring, roving focus, exact actions, active lifecycle projection, teardown guards, selector output, and browser cases passed. |
| 7 | Feed/profile retain existing behavior while consuming semantic aliases and tones only. | ✓ VERIFIED | `dataset.tone` flows into explicit `[data-tone]` CSS; no Retry/Reconnect code exists in either napplet; theme/state Chromium cases passed. Judgment-tier scope prohibition remains human. |
| 8 | Paja docs and one scoped patch changeset match the implementation without pre-versioning. | ✓ VERIFIED | Four docs contain exact action and boundary wording; changeset names only `@kehto/paja: patch`; no package/json/changelog version file changed. |
| 9 | Complete final gates pass from the immutable Phase 107 base. | ✓ VERIFIED | Literal base resolves and is an ancestor; exact-base `git diff --check` passed; unchanged `.aislop/config.yml`; pinned 0.12.0 scan returned scoreable 100/100; remote build/type/docs/Vitest/Playwright all passed. |
| 10 | Registered nested worktrees were physically untouched and excluded. | ? UNCERTAIN | Current registry still lists both nested checkouts at their recorded HEADs, the phase range contains no `.claude/worktrees` path, and test discovery excludes them. Historical physical non-mutation still needs human confirmation. |

**Score:** 90/91 truths verified (0 present-but-behavior-unverified)

### Roadmap Contract

| Success criterion | Status | Evidence |
| --- | --- | --- |
| Semantic palette, type, and spacing across Paja/feed/profile | ✓ VERIFIED | Declaration-aware guards, source inspection, and real theme/state Chromium coverage. |
| Desktop split and phone context/control/status/runtime composition without clipping | ✓ VERIFIED | Chromium desktop, phone, reflow, keyboard, overflow, and long-content tests passed. |
| Host-owned failure explanation, diagnostics, keyboard retry, and return instead of iframe error HTML | ✓ VERIFIED | Stable host DOM is wired for immediate, missing-ready, never-ready, and never-settling-fetch failures; exact-head named Chromium tests passed. |
| Retry re-enters the verified loader without protocol/capability/routing/lifecycle/package change | ✓ VERIFIED | Loader and source/session/provenance links remain intact; conformance tests pass. The stricter judgment prohibition remains human. |

## Required Artifacts

All declared artifacts exist and are substantive. `verify.artifacts` passed 32/32 declarations across Plans 107-01 through 107-07.

| Artifact group | Expected | Status | Details |
| --- | --- | --- | --- |
| `browser-target-surface.ts` and tests | Stable host-owned empty/loading/ready/error UI | ✓ VERIFIED | Stable nodes, literal diagnostic `textContent`, retry/return, disclosure, busy/focus, hide/reset, and destroy behavior. |
| `browser-runtime-tabs.ts` and tests | Per-generation deadline, cleanup, retry, accessible tabs | ✓ VERIFIED | Deadline armed before navigation; idempotent generation guard; session/origin/readiness teardown; retry through existing loader. |
| `browser-host-runtime.ts`, `browser-target-frame.ts`, `server.ts` and tests | Whole external attempt bounded through proxy, server fetch, injection, and ready | ✓ VERIFIED | One controller/signal spans config and browser fetch; server outbound fetch has matching timeout and stable 502 diagnostic; all cleanup paths are substantive. |
| `browser-runtime-pointer.ts`, `browser-intent-host.ts`, `runtime-resolver.ts` and tests | Final teardown cannot regain pointer/tab ownership | ✓ VERIFIED | Destroyed state, exact-attempt controller, relay/artifact abort propagation, and post-await ownership checks exist; exact-head pagehide Chromium test passed. |
| `host-page.ts`, feed/profile HTML/TypeScript, visual tests | Semantic responsive system with real data/state flow | ✓ VERIFIED | Canonical tokens, bounded layouts, local theme aliases, dataset tones, and browser state matrices are wired. |
| Paja/theme E2E and selector/static guards | Real host and scoped-CI proof | ✓ VERIFIED | Paja source selects both Paja specs; the [GitHub Playwright run](https://github.com/jodobear/kehto-web/actions/runs/30633268149) ran 96 tests with 95 pass/1 intentional live skip. |
| Paja docs and changeset | Exact shipped behavior and patch-only release intent | ✓ VERIFIED | Docs gate passed; exact action strings match source; one package-only patch entry. |
| Review evidence cleanup | Reproducible immutable-base range | ✓ VERIFIED | Three review artifacts pass artifact checks and exact-base whitespace check. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Runtime-tab navigation | Host recovery surface | generation deadline -> `handleRuntimeTabError` -> session teardown -> `showError` | ✓ WIRED | Current generation only; Retry calls `reloadActiveRuntimeTab()`. |
| Trusted runtime `shell.ready` | Runtime-tab deadline | registered source/window checks -> `markRuntimeTabReady` -> `settleRuntimeTabReady` | ✓ WIRED | Deadline clears only after current-source acceptance. |
| External host | Target proxy/frame | attempt controller -> config refresh -> `navigateFrame(..., signal)` | ✓ WIRED | Timer begins before fetch and spans through trusted readiness. |
| Local target proxy | Untrusted target URL | `readyTimeoutMs` -> AbortController -> outbound fetch -> stable 502 | ✓ WIRED | Named local server test passed. |
| Final `pagehide` | Pointer and tab ownership | `destroyRuntimePointerWork` before `destroyRuntimeTabHost` | ✓ WIRED | Held resolver cannot install catalog, log resolution, or create a tab after teardown. |
| Host message listener | Runtime/session registry | current `MessageEvent.source`, registered window ID, generation | ✓ WIRED | Unknown, stale, and destroyed sources are ignored. |
| Theme broadcaster | Feed/profile CSS and state | existing `--nap-theme-*` -> local `--ui-*`; `dataset.tone` -> `[data-tone]` | ✓ WIRED | Real iframe light/dark and state tests passed. |
| Source selector | Both Paja browser specs | `GROUPS.paja` sorted output | ✓ WIRED | Direct command returned both specs exactly once. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
| --- | --- | --- | --- | --- |
| Runtime tab surface | status, generation, window ID, error | verified pointer resolver, frame registration, trusted `shell.ready`, deadline | Yes | ✓ FLOWING |
| External target surface | attempt generation, controller, status, error | config refresh, browser proxy, server target fetch, trusted `shell.ready` | Yes | ✓ FLOWING |
| Paja context/header | target, identity, active tab, lifecycle | resolved config and active verified tab | Yes | ✓ FLOWING |
| Message log | protocol and host lifecycle envelopes | real bridge traffic and host settlement | Yes | ✓ FLOWING |
| Feed/profile tones | status text and semantic tone | existing load/theme/data/error paths | Yes | ✓ FLOWING |

## Behavioral Spot-Checks

| Behavior | Command/evidence | Result | Status |
| --- | --- | --- | --- |
| Runtime deadline fires once and cancellation is idempotent | Named Vitest in `browser-runtime-tabs.test.ts` | 1 passed | ✓ PASS |
| Server target fetch is bounded with stable timeout diagnostic | Named Vitest in `server.test.ts` | 1 passed; loopback-required rerun | ✓ PASS |
| Held pointer relay work aborts before artifact fetch | Named Vitest in `runtime-resolver.test.ts` | 1 passed | ✓ PASS |
| Never-ready runtime generation tears down, ignores stale ready, and retries | Exact-head named Chromium case | passed | ✓ PASS |
| Never-settling external fetch enters recovery and retries through same loader | Exact-head named Chromium case | passed | ✓ PASS |
| Final pagehide prevents post-destroy pointer/tab ownership | Exact-head named Chromium case | passed | ✓ PASS |
| Full unit suite | [GitHub Vitest check](https://github.com/jodobear/kehto-web/actions/runs/30633268149) for PR head | 130 files, 1588 tests passed | ✓ PASS |
| Full browser suite | [GitHub Playwright check](https://github.com/jodobear/kehto-web/actions/runs/30633268149) associated with head `2290f8c5` | 95 passed, 1 intentional live skip; all Phase 107 cases passed | ✓ PASS |
| Build, type, docs | [GitHub Build & Type-Check job](https://github.com/jodobear/kehto-web/actions/runs/30633268149) | build passed; 17/17 type tasks; strict TypeDoc/VitePress/9-package audit passed | ✓ PASS |
| Immutable-base diff | `git diff --check b7d045f...` | exit 0 | ✓ PASS |
| Pinned AI-slop | `aislop@0.12.0 ... --base b7d045f... --json` | scoreable, 100/100, zero issues | ✓ PASS |

## Probe Execution

Step 7c: SKIPPED — no Phase 107 probe script is declared or present. Unit, browser, build, type, docs, conformance, static, diff, and quality commands are the declared executable checks.

## Requirements Coverage

| Requirement | Source plans | Status | Evidence |
| --- | --- | --- | --- |
| VIS-01 | 107-03, 107-04, 107-05, 107-07 | ✓ SATISFIED | Canonical palette across Paja/feed/profile; declaration guard and real theme tests pass. |
| VIS-02 | 107-03, 107-04, 107-05, 107-07 | ✓ SATISFIED | Exact type roles/sizes/weights and 12px floor have static and computed-browser proof. |
| VIS-03 | 107-03, 107-04, 107-05, 107-07 | ✓ SATISFIED | Named spacing, containment, phone/reflow geometry, and long-content tests pass. |
| PAJA-01 | 107-02, 107-03, 107-05, 107-07 | ✓ SATISFIED | Desktop split, context, tabs, controls, stage, status, and footer are browser-proven. |
| PAJA-02 | 107-02, 107-03, 107-05, 107-07 | ✓ SATISFIED | Purpose-built phone composition, keyboard reachability, and no horizontal overflow are browser-proven. |
| PAJA-03 | 107-01, 107-02, 107-03, 107-05, 107-06, 107-07 | ✓ SATISFIED | Immediate, missing-ready, never-ready, and never-settling failures all expose host recovery and Retry. |
| PAJA-04 | 107-01, 107-02, 107-05, 107-06, 107-07 | ✓ SATISFIED | Retry reuses existing loaders; source/session/provenance/conformance tests pass. Judgment prohibition remains human. |

No Phase 107 requirement is orphaned from PLAN frontmatter. Phase 108 requirements are specifically scoped to feed/profile behavioral recovery and do not absorb a Phase 107 gap.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| None | — | No added unreferenced TBD/FIXME/XXX debt markers, TODO/HACK/PLACEHOLDER completion markers, raw iframe error renderer, or alternate loader | — | No blocker or warning found. |

Source-slice unit guards alone would be misleading evidence for the state transitions. They are not used as sole proof: exact-head Chromium exercises never-ready recovery, held-fetch recovery, and final teardown; all three passed. One non-goal cleanup edge—intent-driven resolver work may finish before its post-await destroyed check—does not reacquire host ownership and is covered by current-generation guards; no Phase 107 must-have failure results.

## Human Verification Required

### 1. Judgment-tier protocol prohibition

**Test:** Review the Phase 107 source diff against the recorded NAP-SHELL, NAP-THEME, and NIP-5D refs.
**Expected:** No message, capability, routing, lifecycle, sandbox, verified-byte, or package-version contract changed.
**Why human:** PLAN frontmatter explicitly classifies this as judgment-tier; autonomous review remains non-authoritative.

### 2. Judgment-tier phone reachability prohibition

**Test:** At 375x812 and 640x360, traverse every control with keyboard and touch, expand long diagnostics, and scroll tabs, controls, stage, and footer.
**Expected:** Identity/current target stay visible; no page horizontal scroll; every focus ring, control, and value remains reachable.
**Why human:** Automated geometry is strong evidence but cannot certify perceived reachability and focus visibility.

### 3. Judgment-tier Phase 108 boundary prohibition

**Test:** Exercise feed/profile empty, loading, data, partial, and failure states.
**Expected:** Existing copy and transitions remain; no retry, reconnect, or behavioral recovery was added.
**Why human:** Negative behavioral scope is judgment-tier in PLAN frontmatter.

### 4. Nested-worktree physical preservation

**Test:** Confirm the two registered `.claude/worktrees` checkouts retain expected files, registration, HEAD, and lock ownership from before Phase 107.
**Expected:** No move, deletion, overwrite, lock change, or absorbed output occurred.
**Why human:** Git range and current registry prove no tracked phase output, not historical physical non-mutation.

## Gaps Summary

No automated implementation or gate gap remains. Both original recovery blockers and the immutable-base quality/diff blocker are closed with independent exact-head evidence. Phase status is `human_needed` solely because three judgment-tier prohibitions and historical nested-worktree preservation require human confirmation.

Phase 108 was not inspected, planned, or started.

---

_Verified: 2026-07-31T13:24:18Z_
_Verifier: the agent (gsd-verifier)_
