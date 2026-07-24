# Roadmap: Kehto Runtime

## Milestones

- [x] **v1.0: NIP-5D Migration & Gap Analysis** - Phases 1-5
- [x] **v1.1: NIP-5D Migration Implementation** - Phases 6-9
- [x] **v1.2: NIP-5D Conformance & Full NUB Coverage** - Phases 10-15
- [x] **v1.3: Demo Functional & Playwright Parity** - Phases 16-22
- [x] **v1.4: Productionization & Upstream Unblock** - Phases 23-28
- [x] **v1.5: Demo Stability & UAT Coverage** - Phases 29-31
- [x] **v1.6: Downstream Unblock & Shell Service Surface** - Phases 32-36
- [x] **v1.7: NIP-5D Spec Adoption & New NUB Domains** - Phases 37-41
- [x] **v1.8: Upstream Alignment & NIP-44 Decrypt** - Phases 42-46
- [x] **v1.9: Napplet SDK Migration** - Phases 47-49
- [x] **v1.10: Compatibility Window Cleanup & Decrypt Demo Parity** - Phases 50-52
- [x] **v1.11: NIP-5A Gateway Artifact Parity** - Phases 53-55
- [x] **v1.12: NIP-5D Contract Conformance** - Phases 56-59
- [x] **v1.13: Documentation Strategy & Monorepo Docs Site** - Phases 60-64
- [x] **v1.14: GitHub Pages Web Portal** - Phases 65-67
- [x] **v1.15: Address AI Slop** - Phases 68-72
- [x] **v1.16: Structural Code Quality Refactor** - Phases 73-76
- [x] **v1.17: Beautify the SPA Landing Page** - Phases 77-79
- [x] **v1.18: Napplet Firewall** - Phases 80-82
- [x] **v1.19: NAP Ontology Alignment** - Phase 83
- [x] **v1.20: NIP-5D Content-Addressed Runtime Resolution** - Phases 84-85
- [x] **v1.21: NIP-5D + NAP-SHELL/INTENT Conformance** - Phases 86-89
- [x] **v1.22: Single-Window Development Runtime** - Phases 90-94
- [x] **v1.23: NAP-LINK Runtime Parity** - Phase 95
- [x] **v1.24: NAP-COMMON Runtime Parity** - Phase 96
- [x] **v1.25: NAP-LISTS Runtime Parity** - Phase 97
- [x] **v1.26: NAP-SERIAL Runtime Parity** - Phase 98
- [x] **v1.27: NAP-BLE Runtime Parity** - Phase 99
- [x] **v1.28: NAP-WEBRTC Runtime Parity** - Phase 100

---

## Active Milestone: v1.29 Paja Social Cache + Writer Blossom PoC

**Milestone Goal:** The real Writer napplet can use Paja's standard NAP identity/outbox path for followed-profile tagging and Paja's explicit Blossom upload rail for media, before those journeys are hardened and proven in a real browser.

**Planning constraints:** Planning artifacts merge only to this fork's `master`. Kehto implementation branches start from the latest upstream implementation baseline, never from this planning branch. Upstream implementation PRs stay narrow and exclude `.planning/**`, Graphify output, unrelated cleanup, generated noise, and Writer WIP. Writer's existing dirty shortcut work on `chore/writer-source-baseline` is preserved; no Writer source edit may begin until the user explicitly approves the Writer implementation plan and a dedicated Writer integration branch is based on its established remote/upstream baseline. Paja's profile cache remains internal: Writer uses only standard NAP-IDENTITY, NAP-OUTBOX, NAP-RESOURCE, and NAP-UPLOAD interfaces.

## Phases

- [ ] **Phase 101: Baseline & Writer Contribution Preflight** - Reconcile upstream bases, preserve Writer WIP, and produce the approval-gated Writer integration plan.
- [ ] **Phase 102: Paja Standard-NAP Social PoC** - Make Paja expose login-bound identity, follows, and followed kind-0 profiles through normal identity/outbox behavior.
- [ ] **Phase 103: Paja Blossom Rail PoC** - Prove a standard-NAP Blossom upload path and resource-mediated result with a controlled integration fixture.
- [ ] **Phase 104: Approved Writer Integration** - After explicit approval, move Writer's real tagging and paste-upload journeys onto the completed standard-NAP paths.
- [ ] **Phase 105: Session, Profile, Resource & Upload Hardening** - Make identity changes, partial data, media lifecycle, and Blossom outcomes safe and truthful.
- [ ] **Phase 106: Cross-Repository Browser Proof & PR Readiness** - Demonstrate the real Writer/Paja composition and prepare focused, independently reviewable contributions.

## Phase Details

### Phase 101: Baseline & Writer Contribution Preflight
**Goal**: Maintainers have a safe, reviewable starting point for Kehto/Paja and Writer work without losing Writer's unrelated shortcut WIP.
**Depends on**: Nothing (first phase of v1.29)
**Requirements**: PRE-01, PRE-02
**Success Criteria** (what must be TRUE):
  1. A maintainer can identify the latest upstream implementation baseline for Kehto, review incoming Paja changes against it, and see Writer's dirty `chore/writer-source-baseline` shortcut WIP, local history, missing remote, and intended upstream baseline classified without any discarded or absorbed work.
  2. A maintainer can review a Writer implementation plan that names the preserved WIP, required remote/upstream setup, dedicated integration branch, Paja dependency, exact standard-NAP changes, tests, and the explicit user-approval checkpoint.
  3. Before user approval, the Writer working tree remains free of source edits for this milestone and the documented contribution strategy keeps planning-only files out of upstream implementation PRs.
**Plans**: 1 plan

Plans:
- [ ] 101-01-PLAN.md — Refresh and record Kehto/Writer baseline evidence, author the blocked Writer contribution plan, and obtain explicit approval.

### Phase 102: Paja Standard-NAP Social PoC
**Goal**: A logged-in napplet can discover the active Paja identity, follows, and followed kind-0 profile events through standard NAP interfaces.
**Depends on**: Phase 101
**Requirements**: PAJA-01, PAJA-02, PAJA-03
**Success Criteria** (what must be TRUE):
  1. After login, a napplet can call `identity.getPublicKey` and `identity.getFollows` and receive the active public key and relay-backed follows associated with the public key captured when that request started.
  2. Paja keeps an internal, active-identity-scoped cache of followed authors' kind-0 profiles that refreshes after login without exposing a Paja-specific application API.
  3. A napplet can issue normal `outbox.query` requests for followed authors' kind-0 events and receive ordinary OUTBOX events with normal deduplication, `incomplete`, and `error` semantics whether Paja serves or refreshes its internal cache.
**Plans**: TBD

### Phase 103: Paja Blossom Rail PoC
**Goal**: A standard-NAP client can request the Paja-owned Blossom rail and receive a mediated, truthful upload result without gaining upload authority or direct network access.
**Depends on**: Phase 102
**Requirements**: UPLOAD-02, POC-02
**Success Criteria** (what must be TRUE):
  1. A controlled integration fixture that requests `upload.upload` with `rail: "blossom"` receives only standard NAP-UPLOAD statuses while Paja selects the server, obtains consent, signs kind-24242 authorization, transfers bytes, applies policy, and validates the returned descriptor.
  2. The fixture can obtain preview bytes through standard `resource.bytes` after a successful upload, while no custom Paja API, direct relay/HTTP/WebSocket access, `window.nostr`, private-key access, or napplet-side Blossom authorization is available.
**Plans**: TBD

### Phase 104: Approved Writer Integration
**Goal**: Once explicitly approved, the real Writer app can tag followed profiles and paste-upload media through the same standard Paja NAP paths.
**Depends on**: Phase 103
**Execution gate**: Record explicit user approval of the Phase 101 Writer plan, establish Writer's remote/upstream baseline, and create its dedicated integration branch before any Writer source edit.
**Requirements**: WRITER-01, WRITER-02, WRITER-03, WRITER-04, UPLOAD-01, UPLOAD-03, POC-01
**Success Criteria** (what must be TRUE):
  1. Writer obtains follows with `identity.getFollows`, hydrates candidates through bounded batched `outbox.query({ kinds: [0], authors })` calls rather than its per-author `common.getProfile` path, and selects one profile per pubkey by greatest `created_at` then lexicographically lowest event ID.
  2. In Writer's existing mention interface, a user can select a followed profile, insert the existing `nostr:nprofile` Markdown mention, and publish with the corresponding NIP-23 `p` tag.
  3. Writer reacts to standard `identity.changed` by clearing prior-account candidates on logout or account switch, rejecting stale async work, and loading candidates for the new identity without a Paja-specific signal.
  4. A user can paste media into Writer, which calls `upload.upload` with `rail: "blossom"`, inserts the returned HTTPS URL into the draft, and renders preview bytes only through `resource.bytes` Blob object URLs.
  5. The real Writer app running through Paja demonstrates both minimum journeys: login to followed-profile tagging, and pasted media to explicit Blossom upload to preview.
**Plans**: TBD
**UI hint**: yes

### Phase 105: Session, Profile, Resource & Upload Hardening
**Goal**: Users receive correct, safe social and media behavior despite identity changes, partial relay results, cancelled requests, and adverse Blossom outcomes.
**Depends on**: Phase 104
**Requirements**: HARD-01, HARD-02, HARD-03, HARD-04
**Success Criteria** (what must be TRUE):
  1. Connecting, switching accounts, disconnecting, or logging out emits `identity.changed` without replacing Writer's iframe, and old-account cache or async results cannot repopulate the active session.
  2. Writer's tagging UI preserves valid candidates from query-wide `incomplete` or `error` responses and visibly distinguishes signed-out, no-follows, no-usable-profile, complete, degraded, and failed states without claiming per-author completeness.
  3. Profile and uploaded-media requests stay scoped to their requesting window and active identity generation; cancellation, stale-response discard, origin policy, Blob URL replacement/revocation, and teardown prevent cross-window aborts, direct remote assignment, and leaks.
  4. Paja reports denied, unavailable, cancelled, malformed-result, and failed Blossom outcomes distinctly, and only accepts a completed result whose URL, hash, and size validate against confirmed stored bytes and authorization.
**Plans**: TBD
**UI hint**: yes

### Phase 106: Cross-Repository Browser Proof & PR Readiness
**Goal**: Maintainers can verify the real Writer/Paja composition end to end and review focused implementation contributions in dependency order.
**Depends on**: Phase 105
**Requirements**: E2E-01, VERIFY-01, VERIFY-02
**Success Criteria** (what must be TRUE):
  1. Controlled browser coverage drives the real Writer app through Paja and proves tagging, explicit Blossom upload, partial data, identity switch/logout without iframe replacement, RESOURCE-mediated previews, and no direct network or key access.
  2. Every changed repository passes its focused and full required gates; changed Kehto package outputs have changesets; implementation branches carry verification evidence, checked NAP refs, conformance status, draft-spec gaps, and cross-repository dependency/order notes.
  3. Each upstream PR contains one coherent concern's implementation, tests, required docs, and changesets only, excluding `.planning/**`, Graphify output, preserved Writer WIP, generated noise, unrelated cleanup, and cross-repository work that belongs in a separate PR.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** Phase 101 → Phase 102 → Phase 103 → Phase 104 (after explicit user approval) → Phase 105 → Phase 106

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 101. Baseline & Writer Contribution Preflight | 0/1 | Not started | - |
| 102. Paja Standard-NAP Social PoC | 0/TBD | Not started | - |
| 103. Paja Blossom Rail PoC | 0/TBD | Not started | - |
| 104. Approved Writer Integration | 0/TBD | Blocked pending explicit user approval | - |
| 105. Session, Profile, Resource & Upload Hardening | 0/TBD | Not started | - |
| 106. Cross-Repository Browser Proof & PR Readiness | 0/TBD | Not started | - |

---

*ROADMAP.md last updated: 2026-07-24 — v1.29 roadmap created with Phases 101-106 and 21/21 requirements mapped.*
