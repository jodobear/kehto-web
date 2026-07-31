# Requirements: Kehto Runtime v1.30 Visual Recovery

**Defined:** 2026-07-31
**Core Value:** Provide a modular, framework-agnostic runtime for hosting napplet applications.
**Authority:** `.planning/milestones/v1.29-phases/105-published-convention-adoption-and-host-flows/105-UI-REVIEW.md` (`12/24` baseline)

## v1.30 Requirements

### Readable Visual System

- [x] **VIS-01**: Users see one coherent semantic palette across Paja, feed, and profile surfaces for foreground, muted text, surfaces, borders, accent, danger, and success states; scoped rules do not repeat raw color literals outside the token declarations.
- [x] **VIS-02**: Users can read every routine status, label, control, author, and detail at a computed size of at least 12px; only explicitly nonessential metadata may use one smaller semantic text token.
- [x] **VIS-03**: Users see consistent spacing built from a named compact scale across the scoped surfaces, with no clipped controls, status text, or footer content at the 375×812 phone viewport.

### Paja Host Recovery

- [x] **PAJA-01**: Desktop Paja preserves its working console/runtime split while keeping product identity, target context, active tabs, controls, and status visually distinct.
- [x] **PAJA-02**: Phone Paja uses a purpose-built narrow-screen composition that keeps the Kehto/Paja identity and current target visible, exposes essential controls and status without clipping, and gives the active runtime useful first-viewport space.
- [x] **PAJA-03**: A target-load failure renders inside Paja's semantic error surface with a plain-language cause, a keyboard-accessible retry action, a clear return path, and secondary diagnostic detail instead of a raw iframe `<pre>`.
- [x] **PAJA-04**: Retrying a failed Paja target uses the existing verified host loading path and preserves the current NAP/session security boundary; visual recovery does not add, remove, or reshape protocol messages.

### Feed and Profile Recovery

- [ ] **RECOV-01**: Profile users can distinguish denied, unavailable, no-metadata, relay failure, and resource failure states; each recoverable state explains the next action and offers a keyboard-accessible retry or reconnect control.
- [ ] **RECOV-02**: Feed users can distinguish signed-out, denied, unavailable, and relay failure states; each recoverable state explains the next action and offers a keyboard-accessible retry or reconnect control.
- [ ] **RECOV-03**: Feed and profile retry/reconnect actions deterministically re-enter their existing load flows, prevent duplicate concurrent attempts, and settle into a specific success or failure state without requiring the iframe to be reopened.

### Accessibility

- [ ] **A11Y-01**: Meaningful feed, profile, and Paja failure/recovery changes are exposed through appropriate live-region semantics without repeatedly announcing unchanged status text.
- [ ] **A11Y-02**: Every new recovery control is reachable and operable by keyboard, has a visible focus state and specific accessible name, and communicates status through text rather than color alone.

### Regression Proof

- [ ] **PROOF-01**: Browser evidence covers Paja plus feed/profile at 1280×720 and 375×812, including normal, failure, retry, and recovered states and the Phase 105 audit's typography, color, spacing, and composition claims.
- [ ] **PROOF-02**: Automated unit/static/Playwright regressions prove recovery transitions, keyboard/ARIA behavior, mobile non-clipping, target-load replacement, and unchanged NAP message behavior on the real host paths.
- [ ] **PROOF-03**: `pnpm build`, `pnpm type-check`, `pnpm test:unit`, relevant `pnpm test:e2e`, `pnpm docs:check` when docs change, the pinned AI-slop gate, conformance guards, and `git diff --check` pass before shipping.

## Future Requirements

### Runtime Conformance Suite (v1.31)

- **CONF-01**: Maintainers can run the issue `kehto/web#187` runtime conformance suite after refreshing NIP-5D PR #2303, `napplet/naps` master, installed `@napplet/nap` types, and Napplet reference-suite semantics to exact current refs.

### Playground Topology

- **TOPO-01**: Phone users can inspect the playground topology without traversing thousands of pixels of sparse canvas space; relationships retain a useful mobile focal hierarchy.

## Out of Scope

| Feature | Reason |
|---------|--------|
| NAP message, capability, routing, lifecycle, or package-version changes | v1.30 is visual/accessibility repair; protocol work would violate the locked milestone boundary. |
| Runtime Conformance Suite from `kehto/web#187` | Sequenced as v1.31 because it requires a separate live-authority refresh and larger engine/CLI/browser scope. |
| Playground topology-canvas redesign | Phase 105 identified it, but the locked v1.30 acceptance scope is Paja plus feed/profile recovery; retained as `TOPO-01`. |
| Blossom or upload-rail work | Already shipped and unrelated unless a new concrete acceptance criterion appears. |
| Framework adoption or broad brand redesign | Existing framework-agnostic, no-framework implementation and product identity remain constraints. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VIS-01 | Phase 107 | Complete |
| VIS-02 | Phase 107 | Complete |
| VIS-03 | Phase 107 | Complete |
| PAJA-01 | Phase 107 | Complete |
| PAJA-02 | Phase 107 | Complete |
| PAJA-03 | Phase 107 | Complete |
| PAJA-04 | Phase 107 | Complete |
| RECOV-01 | Phase 108 | Pending |
| RECOV-02 | Phase 108 | Pending |
| RECOV-03 | Phase 108 | Pending |
| A11Y-01 | Phase 108 | Pending |
| A11Y-02 | Phase 108 | Pending |
| PROOF-01 | Phase 108 | Pending |
| PROOF-02 | Phase 108 | Pending |
| PROOF-03 | Phase 108 | Pending |

**Coverage:**

- v1.30 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-31*
*Last updated: 2026-07-31 after v1.30 roadmap creation*
