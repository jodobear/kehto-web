---
phase: 107-readable-responsive-paja-system
verified: 2026-07-31T10:25:19Z
status: gaps_found
score: 87/91 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "External-target and runtime-pointer loading failures always settle into stable host-owned recovery with an available Retry target action."
    status: failed
    reason: "The active runtime-tab loader has no shell.ready deadline, and the external target fetch is unbounded. Either path can remain Loading forever with Retry disabled instead of reaching the required error state."
    artifacts:
      - path: "packages/paja/src/browser-runtime-tabs.ts"
        issue: "startRuntimeTabNavigation has generation guards and an iframe error handler, but no readiness timer or missing-shell.ready settlement path."
      - path: "packages/paja/src/browser-target-frame.ts"
        issue: "The external navigation promise waits for /__kehto/target.html without an AbortSignal or timeout; its readiness timer starts only after this promise resolves."
      - path: "packages/paja/src/server.ts"
        issue: "The target proxy fetch has no timeout or abort signal, so a hanging upstream can keep the browser attempt permanently busy."
      - path: "tests/e2e/paja-runtime-pointer.spec.ts"
        issue: "Tests hold and later release shell.ready, but no regression proves a never-ready verified runtime times out into recovery."
    missing:
      - "Apply config.runtime.readyTimeoutMs to each current runtime-tab generation and to the complete external attempt, including target fetch."
      - "Clear deadlines on trusted ready, error, reload, close, replacement, and destroy; stale deadlines must not affect a newer generation."
      - "On timeout, unregister the failed session and route through the existing host error surface so Retry target can re-enter reloadActiveRuntimeTab or the external loader."
      - "Add unit and Chromium regressions for a verified iframe that never emits shell.ready and an external target fetch that never settles."
  - truth: "All focused/static/browser/build/type/unit/docs/slop/conformance/diff gates pass after the complete phase."
    status: failed
    reason: "Build, type-check, docs, focused unit, conformance, and Phase 107 browser checks pass, but the complete phase-range diff check currently fails on trailing whitespace in generated review artifacts. The pinned AI-slop result also could not be independently reproduced because aislop 0.12.0 rejected Git-resolvable base refs."
    artifacts:
      - path: ".planning/phases/107-readable-responsive-paja-system/107-REVIEW-FIX.iter2.md"
        issue: "Contains Git-diff whitespace errors, including lines 14-15 and 28-30."
      - path: ".planning/phases/107-readable-responsive-paja-system/107-REVIEW.iter2.md"
        issue: "Contains Git-diff whitespace errors in review metadata and finding fields."
      - path: ".planning/phases/107-readable-responsive-paja-system/107-REVIEW.iter3.md"
        issue: "Contains Git-diff whitespace errors at lines 45-46."
    missing:
      - "Remove the phase-range trailing whitespace and rerun git diff --check from the recorded Phase 107 base."
      - "Produce a reproducible aislop 0.12.0 changed-file run against the recorded base, or record an accepted override for the tool's base-ref failure."
prohibition_flags:
  - statement: "Phase 107 visual recovery must not add, remove, reshape, or reinterpret any NAP message, capability, routing rule, lifecycle contract, sandbox permission, verified-byte boundary, or package version."
    status: unverified
    non_authoritative_verdict: "Code, conformance tests, phase diff, and current upstream specifications support compliance."
    flag: "unverified-prohibition — human review recommended"
  - statement: "Phone presentation must not hide Paja identity/current target, create page-level horizontal scrolling, or make host content permanently unreachable."
    status: unverified
    non_authoritative_verdict: "Measured Chromium coverage at 375x812 and 640x360 supports compliance."
    flag: "unverified-prohibition — human review recommended"
  - statement: "Feed/profile work must not add Phase 108 recovery behavior."
    status: unverified
    non_authoritative_verdict: "Diff inspection, static guards, and browser state coverage found only semantic visual changes."
    flag: "unverified-prohibition — human review recommended"
---

# Phase 107: Readable, Responsive Paja System Verification Report

**Phase Goal:** Paja users retain product/target context and usable controls on desktop, phone, failure, and recovery within one coherent visual system.
**Verified:** 2026-07-31T10:25:19Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

The five PLAN files declare 91 must-have truths. The four ROADMAP success criteria are represented by those more specific truths and were deduplicated rather than added again. The table folds related items together; the score counts the individual truths.

| # | Truth group | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Paja, feed, and profile use the bounded semantic palette/type/spacing system, with routine text at least 12px. | ✓ VERIFIED | Declaration-aware static tests passed; source inspection confirms component rules consume `--ui-*`; two real theme/state Chromium tests passed. |
| 2 | Desktop and phone layouts retain identity, target, tabs, status, controls, stage, focus, and footer without clipping or page-level horizontal overflow. | ✓ VERIFIED | Exact 1280x720, 375x812, 640x360, 200%-effective viewport, and 160-character target browser cases passed. |
| 3 | External target failures always settle into host-owned explanation, literal diagnostics, Retry, and return controls. | ✗ FAILED | Immediate HTTP/load and missing-shell.ready cases are covered, but the fetch at `browser-target-frame.ts:96` and proxy fetch at `server.ts:130-139` have no deadline. A hanging fetch never reaches the existing timer or error surface. |
| 4 | Pre-tab and active runtime-tab failures use the same recoverable host contract while retaining context. | ✗ FAILED | Resolver and iframe-error recovery are wired and tested, but `startRuntimeTabNavigation` at `browser-runtime-tabs.ts:546-588` has no shell.ready deadline. A verified iframe that never becomes ready remains `booting`/`reloading`, with Retry disabled. |
| 5 | Retry uses the existing verified loader and preserves generation, source/session, verified-byte, CSP, sandbox, capability, routing, and lifecycle boundaries. | ✓ VERIFIED | Retry handlers route to existing reload functions; frame registration precedes srcdoc; sandbox is allow-scripts without same-origin; current registered source gates shell.ready; focused unit/conformance/browser checks passed. |
| 6 | Runtime tabs, labels, actions, active target projection, and scoped-CI selection remain coherent and keyboard operable. | ✓ VERIFIED | Source and real browser evidence cover tablist/tab/tabpanel relationships, roving focus, Home/End, full action labels, duplicate choices, active-only lifecycle, and dual-Paja selector coverage. |
| 7 | Feed/profile retain existing behavior while consuming semantic aliases and tones only. | ✓ VERIFIED | `dataset.tone` flows into `[data-tone]`; no recovery controls were added; two real iframe theme/state tests passed. |
| 8 | Paja docs and one scoped patch changeset match the implemented visual/recovery contract without pre-versioning. | ✓ VERIFIED | Four docs contain exact actions, geometry, security boundaries, and checked refs; Changesets reports only `@kehto/paja` at patch; no package/json/changelog version mutation exists. |
| 9 | Complete final gates pass from the recorded Phase 107 base. | ✗ FAILED | Build, type-check, docs, 68 focused unit tests, and 10 Phase 107 Chromium tests pass. Current phase-range `git diff --check` fails on review Markdown. AI-slop's 100/100 claim was not reproducible because 0.12.0 rejected both the valid SHA and named refs. |
| 10 | Registered nested worktrees were physically untouched and excluded. | ? UNCERTAIN | Current registry/locks remain present and the phase-range diff names no `.claude/worktrees` path. Historical physical non-mutation cannot be proven from the current checkout alone; human confirmation is required. |

**Score:** 87/91 truths verified (3 failed, 1 uncertain, 0 present-but-behavior-unverified)

### Roadmap Contract

| Success criterion | Status | Evidence |
| --- | --- | --- |
| Semantic palette, type, and spacing across Paja/feed/profile | ✓ VERIFIED | Static declaration guards plus browser computed-theme/state evidence. |
| Desktop split and phone context/control/status/runtime composition without clipping | ✓ VERIFIED | Focused Chromium geometry, keyboard, overflow, and long-content checks. |
| Host-owned failure explanation, diagnostics, keyboard retry, and return instead of iframe error HTML | ✗ FAILED | Implemented for detected errors, but a runtime tab missing shell.ready and a hanging external fetch never transition to error. |
| Retry re-enters existing verified loader with no protocol/capability/routing/lifecycle/package change | ✓ VERIFIED | Existing retry routes, provenance/source guards, current upstream spec comparison, and unchanged package surfaces; prohibition remains human-flagged as required. |

## Required Artifacts

All 22 declared artifacts exist and are substantive. Dynamic artifacts are wired into real host/browser paths.

| Artifact group | Status | Details |
| --- | --- | --- |
| `packages/paja/src/browser-target-surface.ts` and tests | ✓ VERIFIED | Stable empty/loading/ready/error DOM, literal diagnostics, disclosure, retry/return, busy state, focus, hide/reset, and destroy behavior. |
| `packages/paja/src/browser-host.ts`, `browser-host-runtime.ts`, `browser-target-frame.ts` | ⚠️ PARTIAL | Real external/pointer wiring and source/session safeguards exist. External ready timeout exists only after target fetch resolves; runtime-tab timeout is absent. |
| `packages/paja/src/browser-runtime-tabs.ts` and tests | ⚠️ PARTIAL | Accessible tabs, target context, retry wiring, and generation guards are substantive. Missing current-generation shell.ready deadline leaves one required failure path hollow. |
| `packages/paja/src/host-page.ts` and tests | ✓ VERIFIED | Exact tokens, landmarks, desktop grid, phone composition, state styling, and minimum type sizes. |
| Feed/profile HTML and TypeScript | ✓ VERIFIED | Semantic aliases and dataset tones are wired to real rendered states and live theme broadcasts. |
| Paja/theme E2E and selector/static guard tests | ✓ VERIFIED | Real host paths and scoped selection exist and the selected Phase 107 checks pass. |
| Paja package/reference/how-to docs | ✓ VERIFIED | Exact UI actions, viewports, recovery flow, and unchanged security/protocol boundaries are synchronized. |
| `.changeset/readable-responsive-paja.md` | ✓ VERIFIED | Only `@kehto/paja: patch`; no direct version/changelog mutation. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Browser host | Target frame loader | `navigateFrame` / reload | ⚠️ PARTIAL | Calls and response handling are real; whole-attempt timeout does not cover the target fetch. |
| Runtime tabs | Target surface | one surface per tab | ✓ WIRED | Loading/error/ready projection and existing retry callback are used. |
| Runtime tabs | Verified navigation | `reloadActiveRuntimeTab` → destroy/register → `navigateFrame` | ⚠️ PARTIAL | Existing route is preserved, but missing-ready cannot expose Retry. |
| Host message listener | Runtime/session registry | `MessageEvent.source`, registered/current window ID, `shell.ready` | ✓ WIRED | Unknown, stale, and forged sources are rejected before ready projection. |
| Host template | Browser controllers | stable IDs/roles | ✓ WIRED | Identity, tabs, command, controls, stage, error, log, and footer nodes are consumed. |
| Theme broadcaster | Feed/profile CSS | existing `--nap-theme-*` → local `--ui-*` | ✓ WIRED | Real iframe computed styles change on theme broadcast. |
| Feed/profile state | Semantic tone CSS | `dataset.tone` → `[data-tone]` | ✓ WIRED | Status text is unchanged and color selection is semantic. |
| Documentation | Runtime implementation | exact action names and loader/security wording | ✓ WIRED | `Load target`, `Reload target`, `Retry target`, return actions, and diagnostics match source. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
| --- | --- | --- | --- | --- |
| Paja context/header | target, identity, lifecycle | resolved config, active verified tab, runtime state | Yes | ✓ FLOWING |
| Runtime tab surface | tab status/error/window ID | pointer resolver, verified frame navigation, trusted shell.ready | Yes, except never-ready has no settlement | ⚠️ HOLLOW FAILURE EDGE |
| External surface | attempt generation/status/error | target proxy fetch, frame injection, trusted shell.ready | Yes, except hanging fetch has no settlement | ⚠️ HOLLOW FAILURE EDGE |
| Message log | protocol envelopes | real bridge traffic | Yes | ✓ FLOWING |
| Feed/profile status tones | text and tone | existing load/theme/data/error paths | Yes | ✓ FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Focused Phase 107 unit/conformance/controller coverage | `corepack pnpm exec vitest run` with eight named files | 8 files, 68 tests passed | ✓ PASS |
| Paja recovery/layout/runtime-pointer flows | Focused Chromium command selecting eight named cases | 8 passed | ✓ PASS |
| Feed/profile theme and state readability | Focused Chromium theme command | 2 passed | ✓ PASS |
| Build | `corepack pnpm build` | 33-package build succeeded | ✓ PASS |
| Type check | `corepack pnpm type-check` | 17 tasks succeeded | ✓ PASS |
| Documentation | `corepack pnpm docs:check` | TypeDoc, VitePress, and docs audit succeeded | ✓ PASS |
| Changeset scope | `corepack pnpm changeset status` | only `@kehto/paja` patch | ✓ PASS |
| Phase-range whitespace | `git diff --check b7d045f560d6945e7974f9719fcd9c02314f9588` | review Markdown trailing-whitespace errors | ✗ FAIL |
| Pinned changed-file AI-slop | `aislop@0.12.0 scan --changes --base <phase-base>` | tool rejected the Git-resolvable SHA; repeated with named refs in isolated clone and failed identically | ? UNVERIFIED |

## Probe Execution

Step 7c: SKIPPED — no Phase 107 probe script is declared or present. Browser, unit, build, type, docs, conformance, and static commands are the declared executable checks.

## Requirements Coverage

| Requirement | Source plans | Status | Evidence |
| --- | --- | --- | --- |
| VIS-01 | 107-03, 107-04, 107-05 | ✓ SATISFIED | Bounded semantic palette and real theme consumption across all three surfaces. |
| VIS-02 | 107-03, 107-04, 107-05 | ✓ SATISFIED | Exact type roles/sizes/weights, hierarchy, and computed browser evidence. |
| VIS-03 | 107-03, 107-04, 107-05 | ✓ SATISFIED | Named spacing scale and bounded responsive layouts/long content. |
| PAJA-01 | 107-02, 107-03, 107-05 | ✓ SATISFIED | Desktop split, context, controls, stage, and measured browser geometry. |
| PAJA-02 | 107-02, 107-03, 107-05 | ✓ SATISFIED | Phone composition, keyboard reachability, internal scrolling, and no horizontal overflow. |
| PAJA-03 | 107-01, 107-02, 107-03, 107-05 | ✗ BLOCKED | Detected failures recover, but a never-ready runtime tab or hanging external fetch never exposes recovery. |
| PAJA-04 | 107-01, 107-02, 107-05 | ⚠️ PARTIAL | Retry preserves the existing verified loader and boundaries when available; the missing failure settlement prevents Retry from being available on all required paths. |

No Phase 107 requirement is orphaned from the PLAN frontmatter.

## Upstream Protocol Boundary

Independent live checks resolved:

- `napplet/naps` master: `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24`
- NIP-5D PR 2303 head: `eb45dfd7335b7f88cb53781984c553581d2b4c34`

Current code retains bare `shell.ready`, one creation-bound/current-source `shell.init` lifecycle, NAP-THEME push consumption, verified bytes through srcdoc, injected bootstrap outside signed bytes, `sandbox="allow-scripts"` without same-origin, and registered `MessageEvent.source` checks. The focused NIP-5D and identity/theme conformance guards passed. This is strong supporting evidence, but the judgment-tier prohibition remains explicitly flagged for human review.

## Review-Fix Verification

The earlier CR-01 through CR-07 fixes exist in code and focused regressions pass, including stable duplicate exits, external missing-ready timeout, tab lifecycle cleanup, active-only lifecycle projection, and target-surface hide/reset. CR-02 fixed the external post-injection handshake path, but the analogous runtime-tab path was not given a deadline. The current blocker is therefore a distinct uncovered sibling path, not a reversal of the external fix.

## Inherited Upload-Flow Assessment

The exact reported test was rerun independently:

`tests/e2e/paja-single-window.spec.ts:629` fails at line 678 because the fixture reports `Required shell domains unavailable` instead of `shell-init received`.

Blame places the failing upload-flow expectation before the Phase 107 base, and Phase 107 does not change upload-domain capability mapping or the upload handler. Focused Phase 107 external, pointer, visual, provenance, and conformance cases pass. This upload defect is inherited and unrelated to the Phase 107 visual/recovery implementation, so it is recorded as baseline debt rather than a Phase 107 goal blocker. It still prevents claiming that the entire unfiltered Paja E2E file is green.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `browser-runtime-tabs.ts` | 546-588 | No readiness timeout after verified frame injection | 🛑 BLOCKER | Runtime tab can remain Loading forever; host recovery never becomes actionable. |
| `browser-target-frame.ts` / `server.ts` | 96, 125-131 / 130-139 | Fetch without AbortSignal/deadline | 🛑 BLOCKER | External attempt can remain busy before the existing shell.ready timer starts. |
| Phase review Markdown | multiple | trailing whitespace | ⚠️ WARNING | Current complete phase-range diff gate fails. |

No unreferenced TBD, FIXME, or XXX markers were found in Phase 107 modified source. Empty/default values found by the scan are initialized state or test fixtures that are populated by real paths, not user-visible stubs.

## Human Verification Recommended

### 1. Judgment-tier protocol prohibition

**Test:** Review the Phase 107 source diff against the cited NAP-SHELL, NAP-THEME, and NIP-5D refs.
**Expected:** No message, capability, routing, lifecycle, sandbox, verified-byte, or package-version contract changed.
**Why human:** The prohibition is explicitly judgment-tier; autonomous LLM review is non-authoritative.

### 2. Judgment-tier phone reachability prohibition

**Test:** At 375x812 and 640x360, traverse every control with keyboard and touch, expand long diagnostics, and scroll tabs/controls/stage/footer.
**Expected:** Identity/current target stay visible; no page horizontal scroll; every focus ring/control/value remains reachable.
**Why human:** Automated geometry is strong evidence but cannot certify perceived reachability and focus visibility.

### 3. Judgment-tier Phase 108 boundary prohibition

**Test:** Exercise feed/profile empty, loading, data, partial, and failure states.
**Expected:** Existing copy and transitions remain; no retry/reconnect/recovery behavior was added.
**Why human:** Negative behavioral scope is judgment-tier in PLAN frontmatter.

### 4. Nested-worktree physical preservation

**Test:** Confirm the two registered `.claude/worktrees` checkouts retain expected files, registration, HEAD, and lock ownership from before Phase 107.
**Expected:** No move, deletion, overwrite, lock change, or absorbed output occurred.
**Why human:** Git range and current registry prove no tracked phase output, not historical physical non-mutation.

## Gaps Summary

Phase 107 is not ready to pass. The primary goal blocker is incomplete failure settlement: detected errors recover well, but a verified runtime iframe that never emits shell.ready and an external target fetch that never settles can each strand the user in Loading with Retry unavailable. A second release-readiness gap remains because the current complete phase-range diff check fails and the pinned AI-slop result could not be independently reproduced. Phase 108 does not explicitly cover either concern, so neither gap is deferred.

The reported upload-flow E2E failure is independently reproduced but predates the phase and is unrelated to its visual/recovery changes. It is baseline debt, not the reason for the Phase 107 blocker.

---

_Verified: 2026-07-31T10:25:19Z_
_Verifier: the agent (gsd-verifier)_
