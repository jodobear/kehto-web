# Roadmap: Kehto Runtime

## Milestones

- [x] **v1.0-v1.17** — foundational runtime, NIP-5D migration, service/demo parity, docs, quality, and web portal milestones (see `.planning/MILESTONES.md`).
- [x] **v1.18: Napplet Firewall** — phases 80-82.
- [x] **v1.19: NAP Ontology Alignment** — phase 83.
- [ ] **v1.20: NIP-5D Content-Addressed Runtime Resolution** — phases 84-85 complete on historical branches; PRs remain separately tracked.
- [x] **v1.21: NIP-5D + NAP-SHELL/INTENT Conformance** — phases 86-89.
- [x] **v1.22: Single-Window Development Runtime** — phases 90-94.
- [ ] **v1.23-v1.27: NAP Runtime Parity Series** — phases 95-99 complete on historical branches; PR state remains separately tracked.
- [x] **v1.28: NAP-WEBRTC Runtime Parity** — phase 100.
- [x] **v1.29: Napplet Convention and Runtime Conformance** — phases 101-106; published and downstream verified.
- [ ] **v1.30: Visual Recovery** — phases 107-108; active.

## Current Milestone: v1.30 Visual Recovery

Close the archived Phase 105 `12/24` UI review debt across Paja and playground feed/profile surfaces. Establish readable semantic styling, recoverable and accessible failure states, phone-specific Paja composition, and browser-backed regression proof without changing NAP behavior.

## Phases

- [ ] **Phase 107: Readable Responsive Paja System** - Establish scoped semantic tokens and make Paja readable, responsive, and recoverable on its existing host path.
- [ ] **Phase 108: Recoverable Napplet States and Visual Proof** - Make feed/profile failures actionable and accessible, then prove the complete milestone across desktop, mobile, and repository gates.

## Phase Details

### Phase 107: Readable Responsive Paja System

**Goal**: Paja users retain clear product/target context and usable controls across desktop, phone, and target-load failure states within one coherent visual system.
**Depends on**: Nothing
**Requirements**: VIS-01, VIS-02, VIS-03, PAJA-01, PAJA-02, PAJA-03, PAJA-04
**Success Criteria** (what must be TRUE):

1. Paja, feed, and profile expose one bounded semantic color/type/spacing vocabulary; routine operational text computes to at least 12px and scoped component rules no longer repeat raw palette values.
2. At 1280×720, Paja retains its working console/runtime split; at 375×812, users still see product and target context, essential controls/status, and a useful active-runtime viewport without clipped footer or console content.
3. A failed target displays a host-styled explanation, secondary diagnostics, keyboard retry, and clear return path instead of raw iframe `<pre>` output.
4. Retry reuses the existing verified target loader and all protocol/conformance guards prove no NAP message, capability, routing, lifecycle, or package behavior changed.

**Plans**: 7/7 plans executed

Plans:

- [x] 107-06-PLAN.md
- [x] 107-07-PLAN.md

**Wave 1**

- [x] 107-01-PLAN.md — Prove host-owned external target recovery through the existing verified loader.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 107-02-PLAN.md — Extend recovery to verified pointers/runtime tabs and complete tab/CI path coverage.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 107-03-PLAN.md — Implement and browser-prove the semantic responsive Paja composition.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 107-04-PLAN.md — Apply the semantic visual system to feed/profile without behavior drift.

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 107-05-PLAN.md — Synchronize docs, add the Paja patch changeset, and run full protected-state gates.

**UI hint**: yes

### Phase 108: Recoverable Napplet States and Visual Proof

**Goal**: Feed and profile users can understand and recover from failures, and maintainers have durable evidence that every v1.30 visual and accessibility outcome works on real host paths.
**Depends on**: Phase 107
**Requirements**: RECOV-01, RECOV-02, RECOV-03, A11Y-01, A11Y-02, PROOF-01, PROOF-02, PROOF-03
**Success Criteria** (what must be TRUE):

1. Profile users can distinguish denied, unavailable, no-metadata, relay, and resource failures and recover through a specific visible retry/reconnect action.
2. Feed users can distinguish signed-out, denied, unavailable, and relay failures and recover through a specific visible retry/reconnect action.
3. Recovery controls work by keyboard, retain visible focus, announce meaningful state changes without duplicate chatter, prevent concurrent duplicate attempts, and settle without reopening the iframe.
4. Browser evidence at 1280×720 and 375×812 covers normal, failure, retry, and recovered Paja/feed/profile states and directly rechecks the Phase 105 typography, color, spacing, and composition findings.
5. Unit/static/Playwright regressions plus build, type, unit, relevant E2E, conditional docs, AI-slop, conformance, and diff gates pass with no protocol drift.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** Phase 107 → Phase 108

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 107. Readable Responsive Paja System | 7/7 | In Progress | - |
| 108. Recoverable Napplet States and Visual Proof | 0/TBD | Not started | - |

## Backlog

### Backlog 999.1: Fix decrypt-demo fixture delivery pending state

Investigate and fix the playground `decrypt-demo` remaining in `waiting for fixtures` / `[pending]`. Context: `.planning/backlog/999.1-fix-decrypt-demo-fixture-pending/999.1-CONTEXT.md`.

---
*ROADMAP.md last updated: 2026-07-31 for v1.30 initialization.*
