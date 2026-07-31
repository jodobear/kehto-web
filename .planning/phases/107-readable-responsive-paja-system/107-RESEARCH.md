# Phase 107: Readable Responsive Paja System - Research

**Researched:** 2026-07-31
**Domain:** Native HTML/CSS/TypeScript responsive host UI, recoverable iframe loading, and protocol-preserving browser state
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Phase Boundary

Close `VIS-01` through `VIS-03` and `PAJA-01` through `PAJA-04`: establish the shared semantic visual vocabulary, make Paja readable and intentionally responsive, and replace target-load failure output with a recoverable host-owned state. Preserve all NAP messages, capabilities, routing, lifecycle behavior, security boundaries, and package versions.

### Locked Decisions

#### Approved design contract
- `.planning/phases/107-readable-responsive-paja-system/107-UI-SPEC.md` is the implementation authority for presentation and interaction details. It passed all six UI-checker dimensions and the 46-item consideration probe.
- Use native HTML/CSS/TypeScript. Do not introduce a framework, component registry, or icon library.
- Use the bounded `--ui-*` semantic palette and the approved 4/8/16/24/32/48/64 spacing scale.
- Use exactly 12/14/18/24px type sizes and 400/600 weights on scoped surfaces. Routine operational text must compute to at least 12px.

#### Paja composition
- Preserve the desktop console/runtime split at 1280x720.
- At `max-width: 640px`, use the approved phone composition: visible identity and target context, horizontally scrollable runtime tabs, essential command row, 224px independently scrollable controls, at least 320px active stage height, and a wrapping footer.
- Validate the phone contract at 375x812; page-level horizontal overflow and unreachable host controls are failures.

#### Target recovery
- Render failures as host DOM in or adjacent to the active stage, never as injected HTML inside the sandboxed iframe.
- Keep the target label and active-tab context visible. Show plain-language failure copy, `Retry target`, a context-appropriate return action, and collapsed escaped diagnostics.
- Retry must call the existing verified single-frame reload/load path, prevent concurrent attempts, retain useful focus, and create no new protocol message.

#### Feed/profile boundary
- Phase 107 changes feed/profile semantic token, type, and spacing consumption only.
- Feed/profile recovery actions and state-specific copy remain Phase 108 work.

### Agent's Discretion

- Exact internal decomposition and test-file placement, provided the approved UI contract and repository conventions are followed.
- Small source-local naming choices that do not alter public API or wire behavior.

### Deferred Ideas (OUT OF SCOPE)

- Feed/profile recovery behavior, broader milestone browser proof, and accessibility convergence belong to Phase 108.
- Playground topology redesign remains future requirement `TOPO-01`.
- Runtime conformance suite issue `kehto/web#187` remains v1.31.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Users see one coherent semantic palette across Paja, feed, and profile surfaces for foreground, muted text, surfaces, borders, accent, danger, and success states; scoped rules do not repeat raw color literals outside the token declarations. | The UI-SPEC supplies the complete palette and the code audit identifies all three declaration/consumption surfaces; add declaration-aware static guards rather than brittle whole-file literal counts. [VERIFIED: codebase and 107-UI-SPEC.md] |
| VIS-02 | Users can read every routine status, label, control, author, and detail at a computed size of at least 12px; only explicitly nonessential metadata may use one smaller semantic text token. | The locked UI contract is stricter: only 12/14/18/24px tokens exist and no smaller exception exists for this phase; verify both source declarations and browser-computed values. [VERIFIED: 107-CONTEXT.md and 107-UI-SPEC.md] |
| VIS-03 | Users see consistent spacing built from a named compact scale across the scoped surfaces, with no clipped controls, status text, or footer content at the 375×812 phone viewport. | Parse only spacing-bearing CSS declarations for scale conformance, then prove reachability and zero page-level horizontal overflow in Chromium at 375×812. [VERIFIED: codebase and 107-UI-SPEC.md] |
| PAJA-01 | Desktop Paja preserves its working console/runtime split while keeping product identity, target context, active tabs, controls, and status visually distinct. | Preserve the existing host/controller boundary and assert the 360px console plus flexible runtime stage, header context, tab strip, and wrapping footer at 1280×720. [VERIFIED: codebase and 107-UI-SPEC.md] |
| PAJA-02 | Phone Paja uses a purpose-built narrow-screen composition that keeps the Kehto/Paja identity and current target visible, exposes essential controls and status without clipping, and gives the active runtime useful first-viewport space. | Replace the current 900px hide/reflow rule with the locked 640px identity/tabs/command/main/footer grid and browser measurements at 375×812. [VERIFIED: codebase and 107-UI-SPEC.md] |
| PAJA-03 | A target-load failure renders inside Paja's semantic error surface with a plain-language cause, a keyboard-accessible retry action, a clear return path, and secondary diagnostic detail instead of a raw iframe `<pre>`. | Introduce a stable host-owned target surface shared by external-target and runtime-tab paths; use native buttons, `<details>`, and `textContent`, with the exact locked copy and focus transitions. [VERIFIED: codebase, 107-UI-SPEC.md; CITED: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent] |
| PAJA-04 | Retrying a failed Paja target uses the existing verified host loading path and preserves the current NAP/session security boundary; visual recovery does not add, remove, or reshape protocol messages. | Wire retry to `state.reload()`, `state.loadPointer(pointer)`, or `reloadActiveRuntimeTab()` according to the failed attempt; retain generation/source checks, bridge cleanup, verified-byte injection, and existing message snapshots. [VERIFIED: codebase and upstream NAP/NIP specs] |
</phase_requirements>

## Summary

Phase 107 should be planned as a bounded presentation/state refactor around existing, security-sensitive loaders—not as a loader rewrite. Paja already has the correct verification, iframe registration, session teardown, generation, and `MessageEvent.source` boundaries. Its visible failure handling is the wrong layer: both single-window and runtime-tab catches replace the target iframe with generated `<pre>` HTML, while the host has no durable empty/loading/error surface. The clean seam is a small host-owned target-surface module used by both controllers, leaving `navigateFrame()` and all protocol wiring intact. [VERIFIED: codebase]

The visual work is also bounded. `host-page.ts`, feed HTML, and profile HTML currently contain raw colors, sub-12px text, irregular spacing, and a phone rule that hides identity and gives no explicit 224px/320px contract. The approved UI-SPEC already resolves every design choice, so implementation should mechanically consume its tokens and compositions. Feed/profile TypeScript should replace inline raw status colors with semantic tone attributes/classes only; their loading and recovery behavior remains untouched. [VERIFIED: codebase, 105-UI-REVIEW.md, and 107-UI-SPEC.md]

The highest planning risk is false proof. Existing Paja unit tests are largely source-string guards, and `scripts/select-e2e-tests.mjs` maps Paja changes only to `paja-single-window.spec.ts`, omitting the real runtime-pointer path in `paja-runtime-pointer.spec.ts`. Plan Wave 0 around durable static parsers plus real Chromium flows for both loaders, and update E2E selection before relying on CI scope detection. [VERIFIED: codebase]

**Primary recommendation:** Add one stable host-owned target surface/state controller, adapt both existing Paja loading paths to it without changing wire/session logic, implement the exact UI-SPEC tokens/layout, and prove the result through focused static guards plus both real Paja Playwright paths. [VERIFIED: codebase and 107-UI-SPEC.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Semantic visual vocabulary | Browser / Client | — | CSS custom-property declarations and local aliases own presentation; no service or protocol payload changes are allowed. [VERIFIED: 107-CONTEXT.md and codebase] |
| Responsive Paja composition | Browser / Client | — | Header, console, tabs, stage, and footer are generated by `host-page.ts` and laid out entirely in browser CSS. [VERIFIED: codebase] |
| Target attempt state and recovery UI | Browser / Client | API / Backend | Browser controllers own empty/loading/ready/error presentation and retry dispatch; existing Paja endpoints/relay/Blossom resolution remain unchanged service boundaries. [VERIFIED: codebase] |
| Target verification and iframe injection | Browser / Client | API / Backend | `navigateFrame()` fetches through existing Paja routes or verified resolution and injects verified bytes under the existing sandbox policy; Phase 107 must not replace that path. [VERIFIED: codebase and upstream NIP-5D draft] |
| NAP session, source trust, and capability routing | Browser / Client | API / Backend | Browser bridge registries bind the iframe window and creation-time identity; runtime/service handlers remain downstream and unchanged. [VERIFIED: codebase and upstream NAP-SHELL/NIP-5D specs] |
| Feed/profile token consumption | Browser / Client | — | Each sandboxed napplet owns its scoped HTML/CSS and consumes existing `--nap-theme-*` values through local `--ui-*` aliases. [VERIFIED: codebase and 107-UI-SPEC.md] |

## Project Constraints (from AGENTS.md)

- Work must remain in the active GSD lifecycle, preserve dirty-tree work, stay off `main`, use explicit-path staging, and make atomic Conventional Commits with a co-author trailer. [VERIFIED: AGENTS.md]
- TypeScript remains strict, ESM-only, framework-free, two-space indented, with lowercase hyphenated filenames; public exports require complete JSDoc. [VERIFIED: AGENTS.md and codebase]
- Code, tests, package documentation, and a changeset for shipped `@kehto/paja` output must move together; a changeset records a future release and must not directly change the current package version. [VERIFIED: AGENTS.md and packages/paja/package.json]
- Before and after NAP/NIP-5D work, the exact upstream authority must be checked. This research checked `napplet/naps` master commit `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24` for NAP-SHELL and NAP-THEME, and NIP-5D draft PR 2303 head `eb45dfd7335b7f88cb53781984c553581d2b4c34`. [VERIFIED: GitHub API and upstream specs]
- Runtime-pointer changes must retain verified bytes through `srcdoc`, keep injected bootstraps outside signed artifact bytes, keep `sandbox="allow-scripts"` without `allow-same-origin`, bind messages to the registered iframe source, and preserve the one-session shell lifecycle. [VERIFIED: AGENTS.md, codebase, and upstream specs]
- Relevant gates are `pnpm build`, `pnpm type-check`, `pnpm test:unit`, both affected Paja Playwright specs, `pnpm docs:check` when documentation changes, `pnpm dlx aislop@0.12.0 scan --changes --base HEAD`, conformance guards, and `git diff --check`; the repository slop policy must remain unchanged and return 100/100. [VERIFIED: AGENTS.md and repository planning history]
- Definition of done is a pushed branch and open PR through the GSD ship flow, not merely local implementation. [VERIFIED: AGENTS.md]

## Standard Stack

### Core

| Library / Platform | Version | Purpose | Why Standard |
|--------------------|---------|---------|--------------|
| Browser HTML/CSS/DOM APIs | Chromium 1.59 runner / native platform | Semantic host markup, responsive layout, focus, disclosure, and safe diagnostic text | Locked framework-free implementation; native buttons and `<details>` supply keyboard behavior without a dependency. [VERIFIED: 107-CONTEXT.md; CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details] |
| TypeScript | 5.9.3 installed | Strict state/controller code | Existing monorepo language and compiler; no new public API is required. [VERIFIED: package.json and local executable] |
| Existing `@kehto/paja` loader stack | 0.11.0 source version | Target URL fetch, NIP-5D resolution, verified `srcdoc`, iframe registration, bridge lifecycle | It already enforces the boundary PAJA-04 requires; only presentation and orchestration around it should change. [VERIFIED: packages/paja/package.json and codebase] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.1.2 installed | Unit/static contract guards | Token declarations, spacing/type declarations, safe host error rendering, controller transitions, conformance snapshots, and E2E selector mapping. [VERIFIED: local executable and vitest.config.ts] |
| Playwright | 1.59.1 installed | Real-browser layout, keyboard, focus, loading/failure/recovery, and screenshot evidence | Required for measurements and real loader behavior that source-string tests cannot prove. [VERIFIED: local executable and playwright.config.ts] |
| pnpm through Corepack | 10.8.0 | Workspace scripts and test execution | Repository package manager is pinned to 10.8.0; this machine exposes it through `corepack pnpm`. [VERIFIED: package.json and local executable] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native HTML/CSS/TypeScript | Framework or component library | Not eligible: explicitly prohibited and unnecessary for this bounded host refactor. [VERIFIED: 107-CONTEXT.md] |
| Existing target loaders | A new fetch/retry abstraction | Not eligible: duplicates verification/session behavior and risks protocol/security drift. [VERIFIED: 107-CONTEXT.md and codebase] |
| Existing `--nap-theme-*` wire values with local aliases | New theme payload fields | Not eligible: Phase 107 may not reshape NAP-THEME or other wire messages. [VERIFIED: 107-CONTEXT.md and upstream NAP-THEME] |

**Installation:** none. Phase 107 must add no external package. [VERIFIED: 107-CONTEXT.md]

## Locked Visual Contract Snapshot

The planner should copy these values directly into task acceptance; they are implementation constraints, not option space. [VERIFIED: 107-UI-SPEC.md]

### Semantic Palette

| Token | Value | Required role |
|-------|-------|---------------|
| `--ui-color-background` | `#101211` | Dominant page/stage background. [VERIFIED: 107-UI-SPEC.md] |
| `--ui-color-surface` | `#181b19` | Standard console/header/card surface. [VERIFIED: 107-UI-SPEC.md] |
| `--ui-color-surface-raised` | `#20241f` | Raised/selected surface. [VERIFIED: 107-UI-SPEC.md] |
| `--ui-color-foreground` | `#f4f0df` | Routine foreground text. [VERIFIED: 107-UI-SPEC.md] |
| `--ui-color-muted` | `#a9ad9f` | Secondary text. [VERIFIED: 107-UI-SPEC.md] |
| `--ui-color-border` | `#626a60` | Surface/control separation. [VERIFIED: 107-UI-SPEC.md] |
| `--ui-color-accent` | `#d8c36a` | Wordmark emphasis, active tab indicator, retry primary action, selected signer/simulation state, and focus-visible indicator only. [VERIFIED: 107-UI-SPEC.md] |
| `--ui-color-danger` | `#f0a0a0` | Error foreground. [VERIFIED: 107-UI-SPEC.md] |
| `--ui-color-danger-surface` | `#2b1e1e` | Error card surface. [VERIFIED: 107-UI-SPEC.md] |
| `--ui-color-success` | `#a9d38f` | Success foreground. [VERIFIED: 107-UI-SPEC.md] |

Feed and profile may place these same `--ui-*` names in their local `:root`, with fallback values sourced from the existing `--nap-theme-*` variables; no component selector may repeat a raw literal. [VERIFIED: codebase and 107-UI-SPEC.md]

### Type, Spacing, and Targets

| Contract | Exact values |
|----------|--------------|
| Font stacks | UI: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`; identifiers/logs only: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. [VERIFIED: 107-UI-SPEC.md] |
| Font sizes | Exactly `12px`, `14px`, `18px`, and `24px`; all scoped routine text is at least `12px`. [VERIFIED: 107-UI-SPEC.md] |
| Weights | Exactly `400` and `600`. [VERIFIED: 107-UI-SPEC.md] |
| Spacing | Exactly `4px`, `8px`, `16px`, `24px`, `32px`, `48px`, and `64px` through named tokens; one-pixel borders and two-pixel focus indicators are strokes, not spacing. [VERIFIED: 107-UI-SPEC.md] |
| Action targets | At least `32px` on desktop and `48px` on phone, including tab share/close actions. [VERIFIED: 107-UI-SPEC.md] |
| Motion | No new motion; active-tab reveal must be immediate. [VERIFIED: 107-UI-SPEC.md] |

### Paja Geometry

| Viewport | Required composition |
|----------|----------------------|
| 1280×720 | 48px context header; two-column main with 360px console and flexible runtime stage; footer at least 32px and wrapping rather than clipping. [VERIFIED: 107-UI-SPEC.md] |
| 375×812 under `max-width:640px` | Identity row, horizontal tabs row, essential command row; 224px independently scrollable controls followed by an active stage at least 320px high; two-column wrapping footer; no page horizontal overflow or unreachable host control. [VERIFIED: 107-UI-SPEC.md] |
| Long target | Wrap to two lines before ellipsis; preserve the full value in both accessible name and `title`. [VERIFIED: 107-UI-SPEC.md] |

### Exact Recovery and Empty-State Copy

| Element/state | Exact copy |
|---------------|------------|
| Pointer submit | `Load target` [VERIFIED: 107-UI-SPEC.md] |
| Header reload | `Reload target` [VERIFIED: 107-UI-SPEC.md] |
| Empty heading | `No runtime loaded` [VERIFIED: 107-UI-SPEC.md] |
| Empty body | `Enter a napplet pointer in Target controls, then choose Load target.` [VERIFIED: 107-UI-SPEC.md] |
| Error heading | `Target couldn't load` [VERIFIED: 107-UI-SPEC.md] |
| Error body | `Check that the target is running and reachable, then retry.` [VERIFIED: 107-UI-SPEC.md] |
| Primary recovery | `Retry target` [VERIFIED: 107-UI-SPEC.md] |
| Pointer return | `Back to target controls` [VERIFIED: 107-UI-SPEC.md] |
| External return | `Back to Paja controls` [VERIFIED: 107-UI-SPEC.md] |
| Diagnostic disclosure | `Show technical details` / `Hide technical details` [VERIFIED: 107-UI-SPEC.md] |
| Lifecycle | `Loading target…`, `Retrying target…`, `Target ready` [VERIFIED: 107-UI-SPEC.md] |
| Empty message log | `No messages yet.` with `Clear messages` disabled [VERIFIED: 107-UI-SPEC.md] |
| Tab actions | `Copy share link for {target name}` and `Close {target name}` as accessible names and visible `title` values [VERIFIED: 107-UI-SPEC.md] |

Technical strings never replace the user copy; they appear only as literal text in the initially collapsed diagnostic disclosure. [VERIFIED: 107-UI-SPEC.md]

## Package Legitimacy Audit

Not applicable. The prescribed stack is already installed in the repository and the phase installs no external package, so the package-legitimacy gate has no candidates. [VERIFIED: codebase and 107-CONTEXT.md]

**Packages removed due to SLOP verdict:** none.

**Packages flagged as suspicious SUS:** none.

## Architecture Patterns

### System Architecture Diagram

```text
External target URL / napplet pointer / Retry target
                       |
                       v
              Host attempt controller
        (empty -> loading -> ready | error)
             /                         \
            v                           v
  Existing single-frame path      Existing runtime-tab path
  state.load()/state.reload()      loadPointer()/reloadActiveRuntimeTab()
            \                           /
             v                         v
          Existing navigateFrame + verified resolver/service boundary
          fetch -> verify bytes -> register identity/window -> srcdoc
                              |
                    +---------+---------+
                    | success           | failure
                    v                   v
             sandboxed iframe     host-owned error surface
             shell.ready          alert sentence + Retry + return
                    |             + collapsed text diagnostic
                    v                   |
           existing NAP bridge          +---- retry loops to same path
     source/session/capability guards

NAP-THEME values -> feed/profile local --ui-* aliases -> scoped CSS only
```

This flow keeps failure presentation in host DOM while the sandboxed iframe remains only the successful target content boundary. [VERIFIED: codebase, 107-UI-SPEC.md, and upstream NIP-5D draft]

### Recommended Project Structure

```text
packages/paja/src/
├── host-page.ts                 # semantic DOM scaffold, exact copy, tokens, responsive CSS
├── browser-target-surface.ts    # recommended private host state/error/focus renderer
├── browser-host.ts              # single-frame orchestration; delegates existing load/reload
├── browser-runtime-tabs.ts      # tab lifecycle plus per-tab target surfaces
├── browser-target-frame.ts      # verified fetch/register/srcdoc only; no error HTML UI
└── *.test.ts                    # focused controller and source-contract tests
apps/playground/napplets/
├── feed/index.html              # local semantic aliases and scale consumption
├── feed/main.ts                 # semantic status tone, no raw inline color
├── profile-viewer/index.html    # local semantic aliases and scale consumption
└── profile-viewer/main.ts       # semantic status tone, no recovery change
tests/
├── unit/phase-107-visual-system.test.ts # recommended declaration-aware contract guard
└── e2e/
    ├── paja-single-window.spec.ts       # external target failure/retry/recovery/layout
    └── paja-runtime-pointer.spec.ts     # verified pointer failure/retry/security/layout
```

The new module name is discretionary, but one shared private surface abstraction avoids two divergent copies of error, focus, busy, and diagnostic behavior. [VERIFIED: codebase and 107-CONTEXT.md]

### Pattern 1: Stable Host-Owned Target Surface

**What:** Create the stage surface once, keep its buttons and live region stable, and mutate state through a narrow API such as `showEmpty`, `showLoading`, `showReady`, and `showError`. Store a surface per runtime tab and one for the single-frame host; hide/show the iframe without writing error HTML into it. [VERIFIED: codebase and 107-UI-SPEC.md]

**When to use:** Every external-target, pointer-resolution, runtime-tab navigation, retry, and recovered transition. [VERIFIED: codebase]

**Recommended state ownership:**

| Concern | Owner | Required behavior |
|---------|-------|-------------------|
| User-facing surface state | `browser-target-surface.ts` | Exact copy, host DOM, `aria-busy`, alert sentence only, collapsed diagnostic, deterministic focus. [VERIFIED: 107-UI-SPEC.md] |
| Single-frame retry | `browser-host.ts` | Call existing `state.reload()`; do not start while one attempt is active. [VERIFIED: codebase and 107-UI-SPEC.md] |
| Pre-tab pointer resolution retry | `browser-host.ts` | Re-submit the preserved pointer through existing `state.loadPointer(pointer)`; use a local attempt token/guard so stale or concurrent resolves cannot add a tab. [VERIFIED: codebase and 107-UI-SPEC.md] |
| Existing runtime-tab retry | `browser-runtime-tabs.ts` | Call existing `reloadActiveRuntimeTab()` and retain its generation/current-tab checks. [VERIFIED: codebase and 107-UI-SPEC.md] |
| Fetch/verify/register/inject | `browser-target-frame.ts` | Stay behaviorally unchanged; return/reject to the host controller and remove `renderTargetErrorHtml()` from the user-surface path. [VERIFIED: codebase and 107-UI-SPEC.md] |

### Pattern 2: Semantic Tabs with Separate Actions

**What:** Render each tab trigger as a semantic tab control with `aria-selected`, `aria-controls`, roving `tabindex`, and keyboard navigation; keep share/close as adjacent action buttons rather than descendants of an element with `role="tab"`. Connect each active trigger to its host stage panel and reveal it in the horizontal strip without animated scrolling. [CITED: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/]

**When to use:** The runtime tab strip at both viewports. The current wrapper is `role="tab" tabindex="0"` while nesting share/close buttons and making every tab tabbable, so merely restyling it would preserve an invalid/awkward interaction model. [VERIFIED: codebase]

### Pattern 3: One Status Region, Change-Only Announcements

**What:** Keep one pre-existing lifecycle status container with `role="status" aria-live="polite" aria-atomic="true"`; write only when the visible text changes. Use `aria-busy="true"` on the active stage during loading/retry. The error card's concise error sentence alone receives `role="alert"`; its controls and diagnostic details stay outside the assertive region. [CITED: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22.html; CITED: https://www.w3.org/TR/wai-aria/]

**When to use:** Boot, load, retry, success, and changed failure transitions. Remove redundant live semantics from pointer status/message-log surfaces when they would announce the same lifecycle transition. [VERIFIED: codebase and 107-UI-SPEC.md]

### Pattern 4: Declaration-Only Tokens, Consumption-Only Components

**What:** Declare the exact raw palette once in Paja's root token block. In feed/profile, declare only the approved local aliases whose fallbacks mirror existing `--nap-theme-*` values. Component rules consume `var(--ui-...)` for colors, type, and spacing; TypeScript changes semantic tone through a class or `data-tone`, not `style.color`. [VERIFIED: codebase and 107-UI-SPEC.md]

**When to use:** All Paja, feed, and profile CSS touched by VIS-01 through VIS-03. Static tests must parse declaration blocks and spacing-bearing properties rather than reject legitimate border widths, radii, line heights, or token fallbacks. [VERIFIED: 107-UI-SPEC.md]

### Anti-Patterns to Avoid

- **Error `srcdoc`:** Do not call `renderTargetErrorHtml()` or assign a failure document to `iframe.srcdoc`; it mixes host recovery with the sandboxed content boundary and is the exact debt PAJA-03 removes. [VERIFIED: codebase and 107-UI-SPEC.md]
- **Parallel retry loader:** Do not create a second fetch, resolution, CSP injection, window registration, or bridge path. [VERIFIED: codebase and 107-CONTEXT.md]
- **Destructive panel rerender:** Do not replace the full error-card subtree after failure; replacing the focused button makes deterministic focus restoration fragile. [VERIFIED: 107-UI-SPEC.md]
- **Global CSS token replacement:** Do not rename/change NAP-THEME wire values or application-wide theme payloads; alias inside the scoped surfaces. [VERIFIED: upstream NAP-THEME and 107-CONTEXT.md]
- **CSS-only tab restyle:** Do not retain all tabs in the tab sequence or nest action buttons inside a `role="tab"` wrapper. [CITED: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/]
- **Broad Phase 108 work:** Do not add feed/profile retry actions, state copy, or topology/accessibility-wide refactors. [VERIFIED: 107-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Safe diagnostic rendering | HTML escaping plus `innerHTML`/template injection | A text node or `textContent` inside native `<details><summary>` | `textContent` treats the diagnostic as text; `innerHTML` parses markup and creates an injection sink. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent; CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details] |
| Target retry/verification | A new fetch/retry pipeline | Existing `state.reload()`, `state.loadPointer()`, and `reloadActiveRuntimeTab()` | These paths already own verified bytes, environment injection, bridge registration, generation, and cleanup. [VERIFIED: codebase] |
| Theme protocol | New colors, payload fields, or bridge messages | Local `--ui-*` aliases over current `--nap-theme-*` values | Keeps NAP-THEME message shape and package behavior unchanged. [VERIFIED: upstream NAP-THEME and 107-CONTEXT.md] |
| Keyboard activation | Click-only divs or keyCode simulation for ordinary actions | Native `<button>` controls; APG tab keyboard behavior only for the composite tab widget | Native controls already supply Enter/Space and disabled semantics. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button; CITED: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/] |
| Loading concurrency | Independent Boolean flags in each catch branch | One attempt token/guard at each controller boundary plus existing frame generation checks | Prevents duplicate retries and stale pointer-resolution settlement without changing protocol. [VERIFIED: codebase and 107-UI-SPEC.md] |

**Key insight:** The hard parts—verified target acquisition, sandboxing, bridge lifecycle, and NAP routing—already exist. Phase 107 should add only host state projection and presentation around those seams. [VERIFIED: codebase]

## Common Pitfalls

### Pitfall 1: Pointer-Resolution Failure Has No Tab Yet

**What goes wrong:** A plan handles iframe navigation failures but leaves malformed/unreachable pointer resolution as a console string, so PAJA-03 is only half implemented. [VERIFIED: codebase]

**Why it happens:** Runtime tabs are created only after `resolveRuntimePointer()` succeeds. [VERIFIED: codebase]

**How to avoid:** Give the overall stage an attempt/error surface independent of tab existence. Preserve the typed pointer; its Retry calls the existing `loadPointer(pointer)` path, while failures after tab creation call active-tab reload. Do not destroy an already-ready tab's session just to present the failed new attempt. [VERIFIED: codebase and 107-UI-SPEC.md]

**Warning signs:** Tests cover only `navigateFrame()` rejection or only external `--target-url` mode. [VERIFIED: codebase]

### Pitfall 2: Disabled Retry Loses Useful Focus

**What goes wrong:** The retry button is focused, becomes disabled, and a rerender or browser focus fallback leaves keyboard focus nowhere useful after failure. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled]

**Why it happens:** Disabled form controls do not accept browsing events/focus, and replacing the subtree discards the original node. [CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled]

**How to avoid:** Keep the card and control nodes stable, remember retry as the focus intent, set busy/disabled during the attempt, then re-enable and explicitly focus the same button after failure; on success focus the active iframe. [VERIFIED: 107-UI-SPEC.md; CITED: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus]

**Warning signs:** A Playwright failure shows `document.activeElement` as `body`, or focus lands in a hidden iframe/error panel. [VERIFIED: 107-UI-SPEC.md]

### Pitfall 3: Stale Settlement Recreates a Dead Session

**What goes wrong:** Two pointer loads or reloads overlap; the older result wins, adds a tab, or reports ready after its iframe/window was replaced. [VERIFIED: codebase]

**Why it happens:** Runtime-tab navigation has generation/current checks, but the pre-tab pointer-resolution call currently has no equivalent attempt guard. [VERIFIED: codebase]

**How to avoid:** Disable submit/retry while the current controller attempt runs and add a local request-generation check around pointer resolution. Preserve `unregisterSingleFrameWindow()` and runtime-tab destruction before replacement. [VERIFIED: codebase and 107-UI-SPEC.md]

**Warning signs:** Two rapid Enter/Space activations create two tabs, duplicate `shell.ready`, or leave more than one registered window. [VERIFIED: upstream NAP-SHELL and 107-UI-SPEC.md]

### Pitfall 4: Mobile Looks Narrow but Still Clips

**What goes wrong:** The page appears stacked yet long target text, tab minimum widths, grid min-content, or the footer produces horizontal overflow/unreachable controls at 375×812. [VERIFIED: codebase and 105-UI-REVIEW.md]

**Why it happens:** Grid/flex children default to content-based minimum sizing; unbreakable identifiers and `100vw`-style sizing can widen the page. [CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap]

**How to avoid:** Apply `min-width: 0` at the relevant grid/flex seams, `overflow-wrap:anywhere` to identifiers, constrain the tab strip to its own horizontal scroller, use the exact 224px/320px rows, and measure `document.documentElement.scrollWidth === clientWidth`. [VERIFIED: 107-UI-SPEC.md; CITED: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap]

**Warning signs:** Screenshot looks acceptable but `scrollWidth` is larger, the active tab is offscreen, or keyboard focus can move to an invisible control. [CITED: https://www.w3.org/TR/WCAG22/]

### Pitfall 5: Active Tab and Header Target Drift Apart

**What goes wrong:** Activating a runtime tab updates the pointer input but leaves the header target context at its boot value, so the prominent label does not identify the active target/error. [VERIFIED: codebase]

**Why it happens:** `activateRuntimeTab()` updates the pointer input and panels but does not call the host target-label setter. [VERIFIED: codebase]

**How to avoid:** Add a private callback from the tab controller to update visible target text, `title`, and accessible name whenever activation/add/close changes the active target. This is presentation-only and must not mutate config or wire identity. [VERIFIED: codebase and 107-UI-SPEC.md]

**Warning signs:** A multi-tab Playwright fixture reports a different active tab label and header target. [VERIFIED: 107-UI-SPEC.md]

### Pitfall 6: Static Visual Guards Become Brittle or Misclassify Values

**What goes wrong:** A regex bans `1px` borders as invalid spacing, flags permitted raw fallbacks in the token declaration block, or passes CSS while computed browser text is still under 12px. [VERIFIED: codebase and 107-UI-SPEC.md]

**Why it happens:** The current tests use broad source-string assertions, while visual contracts distinguish declarations, consumption, spacing properties, strokes, and computed values. [VERIFIED: codebase]

**How to avoid:** Extract each CSS block; separately check token declarations, component color consumption, `margin`/`padding`/`gap` values, font-size/weight declarations, then add computed-style assertions in Playwright. [VERIFIED: codebase and 107-UI-SPEC.md]

**Warning signs:** A harmless selector reorder breaks tests, or a visible 9px timestamp survives a green static suite. [VERIFIED: codebase and 105-UI-REVIEW.md]

### Pitfall 7: CI Omits the Verified-Pointer Browser Path

**What goes wrong:** Paja source changes select only `paja-single-window.spec.ts`; runtime-pointer recovery and security regressions never run in scoped CI. [VERIFIED: scripts/select-e2e-tests.mjs]

**Why it happens:** `GROUPS.paja` currently contains only one of the repository's two Paja specs. [VERIFIED: codebase]

**How to avoid:** Add `tests/e2e/paja-runtime-pointer.spec.ts` to the Paja group and update `tests/unit/select-e2e-tests.test.ts` before treating scoped E2E as proof. [VERIFIED: codebase]

**Warning signs:** Selector unit output for `packages/paja/src/*` lists only the single-window spec. [VERIFIED: codebase]

## Code Examples

Verified patterns from official sources and the locked contract:

### Safe Diagnostic Disclosure

```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
const diagnostic = document.createElement('pre');
diagnostic.className = 'target-error-diagnostic';
diagnostic.textContent = error instanceof Error ? error.message : String(error);

const details = document.createElement('details');
const summary = document.createElement('summary');
summary.textContent = 'Show technical details';
details.append(summary, diagnostic);
```

Use a listener on `<details>` only to switch the locked `Show technical details` / `Hide technical details` label; never serialize the diagnostic into HTML. [VERIFIED: 107-UI-SPEC.md; CITED: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details]

### Change-Only Status Update

```typescript
// Source: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22.html
function announceStatus(element: HTMLElement, next: string): void {
  if (element.textContent === next) return;
  element.textContent = next;
}
```

The container must exist before updates and carry `role="status" aria-live="polite" aria-atomic="true"`; repeated writes of the same string should be skipped. [CITED: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22.html]

### Retry Delegates to Existing Loader

```typescript
// Source: packages/paja/src/browser-host.ts and browser-runtime-tabs.ts
async function retryCurrentTarget(): Promise<void> {
  if (attemptInFlight) return;
  attemptInFlight = true;
  surface.showRetrying();

  try {
    await retryExistingPath(); // state.reload(), state.loadPointer(), or active-tab reload
  } catch (error) {
    surface.showError(error);
    surface.focusRetry();
  } finally {
    attemptInFlight = false;
  }
}
```

This is structural guidance, not a new public API. The real controller must keep existing generation checks and decide success only from the current iframe's `shell.ready`, not merely from `srcdoc` assignment. [VERIFIED: codebase and upstream NAP-SHELL]

### Scoped Semantic Status Tone

```typescript
// Source: apps/playground/napplets/feed/main.ts and 107-UI-SPEC.md
statusElement.dataset.tone = tone; // "neutral" | "success" | "danger"
statusElement.textContent = message;
```

```css
/* Source: 107-UI-SPEC.md */
.status[data-tone='neutral'] { color: var(--ui-color-muted); }
.status[data-tone='success'] { color: var(--ui-color-success); }
.status[data-tone='danger'] { color: var(--ui-color-danger); }
```

This removes inline raw color fallbacks without changing feed/profile recovery behavior or NAP-THEME payloads. [VERIFIED: codebase and 107-UI-SPEC.md]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw colors and local one-off typography/spacing in each surface | Bounded semantic tokens declared once per scoped surface, with component consumption only | Locked for Phase 107 on 2026-07-31 | Makes palette, type, and spacing mechanically auditable across Paja/feed/profile. [VERIFIED: 107-UI-SPEC.md] |
| Generic `max-width:900px` stack that hides product identity | Purpose-built `max-width:640px` phone composition with fixed controls/stage minima and local scrollers | Locked for Phase 107 on 2026-07-31 | Preserves target context and host controls at 375×812. [VERIFIED: codebase and 107-UI-SPEC.md] |
| Escaped `<pre>` generated as iframe error `srcdoc` | Stable semantic host error card adjacent to the active stage | Locked for Phase 107 on 2026-07-31 | Keeps failure UI outside signed/sandboxed target content and permits retry/focus control. [VERIFIED: codebase and 107-UI-SPEC.md] |
| Styling-oriented source-string tests | Declaration-aware unit guards plus real Chromium layout/state/security assertions | Required by Phase 107 acceptance | Proves computed behavior and real loader transitions rather than implementation spelling. [VERIFIED: codebase and 107-UI-SPEC.md] |

**Deprecated/outdated:**

- `renderTargetErrorHtml()` as the visible failure surface is obsolete for Phase 107; `navigateFrame()` itself remains authoritative. [VERIFIED: codebase and 107-UI-SPEC.md]
- The current 900px breakpoint, hidden `.top-console`, sub-12px text, 700 weights, and direct inline status colors are outside the approved contract. [VERIFIED: codebase and 107-UI-SPEC.md]
- A tab strip where every tab is tabbable and action buttons are nested inside `role="tab"` is not the recommended WAI-ARIA tabs pattern. [CITED: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | None. All implementation claims were checked against the repository, locked phase artifacts, live upstream specs, or cited standards documentation. | — | — |

## Open Questions

No blocking product or protocol questions remain. Exact private module names, test-file placement, and fixture mechanics are intentionally delegated to the implementing agent by `107-CONTEXT.md`; the plan should lock behavior and verification, not those incidental spellings. [VERIFIED: 107-CONTEXT.md]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Build/test/tooling | ✓ | 22.22.0 | — [VERIFIED: local executable] |
| Corepack | Pinned package-manager access | ✓ | 0.34.0 | — [VERIFIED: local executable] |
| pnpm | Workspace commands | ✓ through Corepack; bare shim absent | 10.8.0 | Use `corepack pnpm ...` for local commands. [VERIFIED: local executable and package.json] |
| Vitest | Unit/static tests | ✓ | 4.1.2 | `corepack pnpm exec vitest`. [VERIFIED: local executable] |
| Playwright | Browser proof | ✓ | 1.59.1 | `corepack pnpm exec playwright`. [VERIFIED: local executable] |
| Chromium | Configured Playwright browser | ✓ | System executable at `/usr/bin/chromium` | Playwright config already points to this binary. [VERIFIED: local filesystem and playwright.config.ts] |

**Missing dependencies with no fallback:** none. [VERIFIED: local environment]

**Missing dependencies with fallback:** bare `pnpm` is not on this shell's PATH; the pinned Corepack invocation is available. [VERIFIED: local environment]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 for node/static contracts; Playwright 1.59.1 with system Chromium for real browser behavior. [VERIFIED: local executable and config] |
| Config file | `vitest.config.ts`; `playwright.config.ts`. [VERIFIED: codebase] |
| Quick run command | `corepack pnpm exec vitest run packages/paja/src/host-page.test.ts packages/paja/src/browser-runtime-tabs.test.ts packages/paja/src/browser-host.test.ts tests/unit/identity-theme-conformance-guard.test.ts tests/unit/nip5d-conformance-guard.test.ts tests/unit/select-e2e-tests.test.ts` (baseline: 6 files / 53 tests passed in 0.75s). [VERIFIED: local test run] |
| Focused browser command | `corepack pnpm test:e2e -- tests/e2e/paja-single-window.spec.ts tests/e2e/paja-runtime-pointer.spec.ts`. [VERIFIED: package.json and codebase] |
| Full suite command | `corepack pnpm build && corepack pnpm type-check && corepack pnpm test:unit`; run relevant Playwright plus docs/slop/diff gates separately so failures remain attributable. [VERIFIED: AGENTS.md and package.json] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Exact palette exists; raw color literals occur only in allowed declaration/fallback blocks; feed/profile TS uses semantic tones. | unit/static | `corepack pnpm exec vitest run tests/unit/phase-107-visual-system.test.ts` | ❌ Wave 0 |
| VIS-02 | Only 12/14/18/24px and 400/600 are declared; routine Paja/feed/profile text computes to at least 12px. | unit + e2e | Static command above plus both Paja specs' computed-style assertions | ❌ Wave 0 extension |
| VIS-03 | Spacing-bearing declarations consume the named scale; 375×812 has no host clipping or page horizontal overflow. | unit + e2e | Static command above plus `corepack pnpm test:e2e -- tests/e2e/paja-single-window.spec.ts tests/e2e/paja-runtime-pointer.spec.ts` | ❌ Wave 0 extension |
| PAJA-01 | 1280×720 retains 360px console/flexible stage and distinct visible identity, target, tabs, controls, status, footer. | e2e | `corepack pnpm test:e2e -- tests/e2e/paja-single-window.spec.ts` | ✅ extend existing |
| PAJA-02 | 375×812 uses identity/tabs/command rows, 224px scrollable controls, ≥320px stage, wrapping footer, revealed active tab. | e2e | Both Paja specs | ✅ extend existing |
| PAJA-03 | External and pointer failures show host card, exact copy, keyboard retry/return, collapsed literal diagnostic, deterministic focus. | unit + e2e | Focused Vitest plus both Paja specs | ❌ Wave 0 fixtures/guards |
| PAJA-04 | Retry traverses existing loaders; one attempt/session survives; source/generation/sandbox/message contracts remain unchanged. | unit + e2e + conformance | `corepack pnpm exec vitest run packages/paja/src/browser-host.test.ts packages/paja/src/browser-runtime-tabs.test.ts tests/unit/nip5d-conformance-guard.test.ts && corepack pnpm test:e2e -- tests/e2e/paja-single-window.spec.ts tests/e2e/paja-runtime-pointer.spec.ts` | ✅ extend existing |

### Required Browser Assertions

1. At 1280×720, measure the console/runtime columns and assert product, full target context, active tab, controls, lifecycle, and footer are visible. [VERIFIED: 107-UI-SPEC.md]
2. At 375×812, assert `scrollWidth === clientWidth`, controls panel is 224px and independently scrollable, active stage is at least 320px, footer values are reachable, every phone action target is at least 48px, and a 160-character target remains fully available through accessible name/title. [VERIFIED: 107-UI-SPEC.md]
3. Exercise zero/one/many tabs and ready/loading/error coexistence; activate an offscreen tab by keyboard and prove it becomes visible without page-level scroll drift. [VERIFIED: 107-UI-SPEC.md]
4. Force a diagnostic containing HTML-like text (for example `<img src=x onerror=...>`) and assert it remains literal text, no matching element is created, the disclosure begins collapsed, and the iframe never receives error `srcdoc`. [VERIFIED: 107-UI-SPEC.md; CITED: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent]
5. Activate Retry with Enter and Space; assert exactly one request/attempt, `aria-busy`, disabled retry during work, focus restored after repeat failure, iframe focused after success, and return focuses the correct console control without reloading. [VERIFIED: 107-UI-SPEC.md]
6. On recovered runtime-pointer load, assert the verified-byte/CSP/sandbox/source-bound handshake still succeeds and no new NAP message type appears. On external load, assert old window/session state is unregistered before the replacement becomes current. [VERIFIED: codebase and upstream specs]
7. Capture stable screenshots or Playwright attachments for normal, error, retrying, and recovered Paja states at both viewports; Phase 108 may reuse but must not be required to establish Phase 107 correctness. [VERIFIED: 107-CONTEXT.md and 107-UI-SPEC.md]

### Sampling Rate

- **Per task commit:** Run the focused Vitest command above; add the immediately affected Paja spec after a browser-visible task. [VERIFIED: repository test performance and AGENTS.md]
- **Per wave merge:** Run both Paja specs plus `corepack pnpm build`, `corepack pnpm type-check`, and `corepack pnpm test:unit`. [VERIFIED: AGENTS.md]
- **Phase gate:** Full required gates green, including docs when changed, pinned AI-slop 100/100, both Paja browser paths, conformance guards, and `git diff --check`, before `$gsd-verify-work`. [VERIFIED: AGENTS.md]

### Wave 0 Gaps

- [ ] `tests/unit/phase-107-visual-system.test.ts` — declaration-aware palette/type/spacing guards for Paja, feed, and profile. [VERIFIED: codebase gap]
- [ ] Failure/retry fixture controls in `tests/e2e/paja-single-window.spec.ts` — fail, repeat-fail, recover, long target, focus, and viewport measurements on the real external loader. [VERIFIED: codebase gap]
- [ ] Failure/retry fixture controls in `tests/e2e/paja-runtime-pointer.spec.ts` — fail and recover without bypassing verified pointer/byte/CSP paths. [VERIFIED: codebase gap]
- [ ] `scripts/select-e2e-tests.mjs` and `tests/unit/select-e2e-tests.test.ts` — select both Paja specs for Paja source changes. [VERIFIED: codebase gap]
- [ ] Focused controller tests for pre-tab pointer failure, retry concurrency, stale settlement, and stable focus nodes. [VERIFIED: codebase gap]

The current focused baseline is green: 53/53 tests passed before implementation. [VERIFIED: local test run]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No new authentication work | Preserve the existing creation-bound verified napplet identity; Phase 107 adds no credential/auth flow. [VERIFIED: upstream NIP-5D draft and codebase] |
| V3 Session Management | Yes | Unregister/destroy the old bridge, session registry, origin registry, and ready state before a replacement; accept readiness only from the current generation/source. [VERIFIED: codebase and upstream NAP-SHELL] |
| V4 Access Control | Yes | Preserve the existing ACL/capability mappings and source-bound runtime dispatch; recovery controls are host-local and emit no NAP message. [VERIFIED: codebase and 107-CONTEXT.md] |
| V5 Input Validation | Yes | Preserve existing target/pointer parsing and verified resolution; render error values with `textContent`, not parsed HTML. [VERIFIED: codebase; CITED: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent] |
| V6 Cryptography | No new cryptography | Preserve the installed NIP-5D event/signature/verified-byte path unchanged; do not implement alternate verification. [VERIFIED: codebase and upstream NIP-5D draft] |

### Known Threat Patterns for Browser/Iframe Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Error text becomes executable host markup | Tampering / Elevation of Privilege | Host DOM nodes plus `textContent`; no `innerHTML` and no error `srcdoc`. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent] |
| Stale retry result binds a replaced iframe/window | Spoofing / Tampering | Existing generation/current-frame checks, explicit unregister/destroy, plus a pre-tab attempt token. [VERIFIED: codebase] |
| Forged message from another window | Spoofing | Preserve `MessageEvent.source` lookup and creation-bound verified identity; never trust a claimed identity in payload data. [VERIFIED: upstream NIP-5D draft and codebase] |
| Retry accidentally adds protocol traffic/capability | Tampering / Elevation of Privilege | Host-local UI state calls only existing loaders; retain exact conformance snapshots and assert no new message type. [VERIFIED: 107-CONTEXT.md and codebase] |
| Loading content weakens sandbox/provenance | Elevation of Privilege | Preserve `sandbox="allow-scripts"`, verified bytes through `srcdoc`, bootstrap injection outside signed bytes, and no `allow-same-origin`. [VERIFIED: upstream NIP-5D draft, AGENTS.md, and codebase] |
| Rapid activation creates duplicate attempts/sessions | Denial of Service / Tampering | Disable the current action, use one in-flight token, ignore stale settlements, and re-enable only after settlement. [VERIFIED: 107-UI-SPEC.md and codebase] |

## Sources

### Primary (HIGH confidence)

- Repository source and tests: `packages/paja/src/host-page.ts`, `browser-host.ts`, `browser-runtime-tabs.ts`, `browser-target-frame.ts`, `browser-host-runtime.ts`, feed/profile HTML and TypeScript, theme code, Playwright specs/config, Vitest config, and E2E selection. [VERIFIED: codebase]
- `.planning/phases/107-readable-responsive-paja-system/107-CONTEXT.md` and `107-UI-SPEC.md` — locked scope, visual contract, state/focus/copy, implementation boundaries, and verification. [VERIFIED: codebase]
- `.planning/milestones/v1.29-phases/105-published-convention-adoption-and-host-flows/105-UI-REVIEW.md` — 12/24 visual-debt baseline. [VERIFIED: codebase]
- [NAP-SHELL at napplet/naps master commit 5ac0490](https://github.com/napplet/naps/blob/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24/naps/NAP-SHELL.md) — mandatory shell lifecycle, one ready/init exchange, and creation-bound identity. [VERIFIED: GitHub API and upstream spec]
- [NAP-THEME at napplet/naps master commit 5ac0490](https://github.com/napplet/naps/blob/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24/naps/NAP-THEME.md) — existing theme values and update contract. [VERIFIED: GitHub API and upstream spec]
- [NIP-5D draft PR 2303](https://github.com/nostr-protocol/nips/pull/2303) at head `eb45dfd7335b7f88cb53781984c553581d2b4c34` — verified bytes, `srcdoc`, sandbox, source binding, and injected bootstrap boundary. [VERIFIED: GitHub API and upstream spec]

### Secondary (MEDIUM confidence)

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) — reflow, visible/unobscured focus, target size, and status-message criteria. [CITED: https://www.w3.org/TR/WCAG22/]
- [W3C ARIA22 status technique](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22.html) — pre-existing polite/atomic status container. [CITED: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22.html]
- [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) — roles, relationships, roving focus, and keyboard interaction. [CITED: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/]
- [WAI-ARIA specification](https://www.w3.org/TR/wai-aria/) — `alert`, `status`, and `aria-busy` behavior. [CITED: https://www.w3.org/TR/wai-aria/]
- [MDN `textContent`](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent), [`<details>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details), [`disabled`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/disabled), [`focus()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus), and [`overflow-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap) — safe text, native disclosure, focus/disabled behavior, and long-token wrapping. [CITED: MDN documentation]

### Tertiary (LOW confidence)

- None. No training-only or community-only claim is needed for the plan. [VERIFIED: research record]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — locked to existing installed tools and verified local versions; no package selection. [VERIFIED: local environment and codebase]
- Architecture: HIGH — based on exact live controller/loader/session code and locked UI implementation boundaries. [VERIFIED: codebase and 107-UI-SPEC.md]
- Pitfalls: HIGH for repository-specific findings and MEDIUM for cited browser/ARIA behavior. [VERIFIED: codebase; CITED: W3C and MDN documentation]
- Protocol/security: HIGH — exact upstream refs were fetched and compared with the current code seams. [VERIFIED: GitHub API, upstream specs, and codebase]

**Research date:** 2026-07-31
**Valid until:** 2026-08-30 for the stable local design; refresh the open NIP-5D PR head immediately before implementation or shipping because it remains draft. [VERIFIED: GitHub API and AGENTS.md]
