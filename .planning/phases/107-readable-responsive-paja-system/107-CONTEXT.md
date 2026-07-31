# Phase 107: Readable Responsive Paja System - Context

**Gathered:** 2026-07-31
**Status:** Ready for planning
**Mode:** Auto-generated (discussion skipped by `workflow.skip_discuss` under the authorized milestone handoff)

<domain>
## Phase Boundary

Close `VIS-01` through `VIS-03` and `PAJA-01` through `PAJA-04`: establish the shared semantic visual vocabulary, make Paja readable and intentionally responsive, and replace target-load failure output with a recoverable host-owned state. Preserve all NAP messages, capabilities, routing, lifecycle behavior, security boundaries, and package versions.
</domain>

<decisions>
## Implementation Decisions

### Approved design contract
- `.planning/phases/107-readable-responsive-paja-system/107-UI-SPEC.md` is the implementation authority for presentation and interaction details. It passed all six UI-checker dimensions and the 46-item consideration probe.
- Use native HTML/CSS/TypeScript. Do not introduce a framework, component registry, or icon library.
- Use the bounded `--ui-*` semantic palette and the approved 4/8/16/24/32/48/64 spacing scale.
- Use exactly 12/14/18/24px type sizes and 400/600 weights on scoped surfaces. Routine operational text must compute to at least 12px.

### Paja composition
- Preserve the desktop console/runtime split at 1280x720.
- At `max-width: 640px`, use the approved phone composition: visible identity and target context, horizontally scrollable runtime tabs, essential command row, 224px independently scrollable controls, at least 320px active stage height, and a wrapping footer.
- Validate the phone contract at 375x812; page-level horizontal overflow and unreachable host controls are failures.

### Target recovery
- Render failures as host DOM in or adjacent to the active stage, never as injected HTML inside the sandboxed iframe.
- Keep the target label and active-tab context visible. Show plain-language failure copy, `Retry target`, a context-appropriate return action, and collapsed escaped diagnostics.
- Retry must call the existing verified single-frame reload/load path, prevent concurrent attempts, retain useful focus, and create no new protocol message.

### Feed/profile boundary
- Phase 107 changes feed/profile semantic token, type, and spacing consumption only.
- Feed/profile recovery actions and state-specific copy remain Phase 108 work.

### Agent's Discretion
- Exact internal decomposition and test-file placement, provided the approved UI contract and repository conventions are followed.
- Small source-local naming choices that do not alter public API or wire behavior.
</decisions>

<code_context>
## Existing Code Insights

- Paja host composition begins in `packages/paja/src/host-page.ts` and is supported by `browser-host.ts`, `browser-runtime-tabs.ts`, and `browser-target-frame.ts`.
- Feed/profile HTML and `apps/playground/src/theme.ts` already expose the theme values that must be mapped to the canonical `--ui-*` vocabulary.
- The archived Phase 105 UI review at `.planning/milestones/v1.29-phases/105-published-convention-adoption-and-host-flows/105-UI-REVIEW.md` is the `12/24` debt baseline.
- Existing NIP-5D conformance guards must remain green and should prove the recovery work adds no NAP behavior.
</code_context>

<specifics>
## Specific Ideas

- Use the exact copy, focus behavior, live-region semantics, component states, and viewport criteria already locked in `107-UI-SPEC.md`.
- Browser evidence must exercise the real Paja host path at 1280x720 and 375x812, including normal, failure, retry, and recovered states.
</specifics>

<deferred>
## Deferred Ideas

- Feed/profile recovery behavior, broader milestone browser proof, and accessibility convergence belong to Phase 108.
- Playground topology redesign remains future requirement `TOPO-01`.
- Runtime conformance suite issue `kehto/web#187` remains v1.31.
</deferred>

---

*Phase: 107-readable-responsive-paja-system*
*Context auto-generated: 2026-07-31*
