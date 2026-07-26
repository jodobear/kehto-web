---
phase: 104-nap-intent-and-manifest-contract-parity
verified: 2026-07-26T15:18:14Z
status: gaps_found
score: 12/13 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "Malformed, numbered, query/fragment-bearing, mismatched, missing, or unsafe contract metadata fails closed at parse and build-authoring boundaries."
    status: failed
    reason: "Playground authoring trims leading/trailing whitespace from a slug and convention before validating, silently accepting malformed input rather than rejecting it."
    artifacts:
      - path: "apps/playground/napplets/shared-vite-config.ts"
        issue: "validateArchetypes() calls rawSlug.trim() and rawConvention.trim() before its strict regex checks."
      - path: "tests/unit/playground-gateway-guard.test.ts"
        issue: "The invalid-authoring matrix omits leading/trailing whitespace cases, so the focused test passes without exercising the fail-closed boundary."
    missing:
      - "Validate raw slug and convention values without trimming, rejecting any leading/trailing whitespace."
      - "Add regression vectors for whitespace-prefixed/suffixed slugs and conventions."
---

# Phase 104: NAP-INTENT and Manifest Contract Parity Verification Report

**Phase Goal:** Kehto resolves authoritative convention URIs through installed verified manifest contracts, accepts source-independent delivery responsibility, and sends runtime-attested carrier-neutral delivery only after target readiness.
**Verified:** 2026-07-26T15:18:14Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Authority and Method

Verified against `napplet/naps@a718915ddefa2f03a0126579601f59d8bd86f7c4`,
`naps/NAP-INTENT.md`. The draft requires a queryless
`napplet:<archetype>/<intent>` convention for each manifest tag and requires
the binding/runtime to reject invalid convention forms. I read all five Phase
104 plans, all five summaries, 104 context/research, requirements, and the
relevant prior Phase 103 verification; summary claims were not used as proof.

The disconfirmation pass found that the parser correctly rejects whitespace,
but the playground build authoring path normalizes it away. This is not a
future-host-flow concern: Phase 104 explicitly owns build-time convention
validation (ARCH-04), and no later phase specifically schedules this fix.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | The injected API derives canonical request fields from one shared URI normalizer, rejects invalid/conflicting calls before transport, buffers parent-only delivery FIFO, and survives namespace replacement. | ✓ VERIFIED | `napplet-namespace.ts:163-200` is the shared normalizer; `:1202-1325` builds/filters intent messages and buffers only parent-authenticated canonical deliveries; `:1496-1565` caches and protects the binding. The focused binding suite exercised normalization, invalid no-post behavior, FIFO, close/re-register, forged source, and namespace attacks. |
| 2 | Canonical public, resolver, runtime, and carrier objects have exact convention shapes with no legacy protocol/lifecycle/identifier/caller-sender fields. | ✓ VERIFIED | `intent-types.ts:23-130` contains the required request, contract, candidate, result union, and delivery shapes. `intent-service.ts:151-217` rejects all noncanonical request keys; public exports are present in `services/src/index.ts`. Focused type, guard, and integration tests passed. |
| 3 | Verified-manifest tags retain one exact queryless contract per tag, including independent ordered scoped kinds; indexes are derived rather than authoritative. | ✓ VERIFIED | `nip/src/5d/index.ts:143-205` validates/parses each tag without collapsing repetitions; `manifest-intent-catalog.ts:75-101` preserves contracts and derives unique action/convention indexes. Parser and catalog tests cover repetitions and payload non-inference. |
| 4 | Malformed contract metadata fails closed in both parser and playground build authoring. | ✗ FAILED | The parser rejects whitespace, but `shared-vite-config.ts:79,85` invokes `.trim()` before its strict checks. Thus `{ slug: ' profile', convention: 'napplet:profile/open' }` and `{ slug: 'profile', convention: ' napplet:profile/open ' }` are silently accepted and signed. The gateway test’s invalid matrix omits these vectors. |
| 5 | The profile fixture and signed-manifest recomputation use `napplet:profile/open`, not numbered NAP metadata. | ✓ VERIFIED | `profile-viewer/vite.config.ts:3` declares the stable convention; `shared-vite-config.ts:430-454` emits repeated convention tags; the gateway guard asserts final exact tags and absence of `NAP-1`. |
| 6 | Resolver selection uses exact compatible installed contracts, user defaults/chooser policy, and authorized explicit dTags; ambiguity never falls back to catalog order. | ✓ VERIFIED | `catalog-intent-resolver.ts:237-326` filters on exact `contract.convention`, authorizes explicit targets, uses defaults/sole/chooser, and rejects unresolved ambiguity. The named resolver tests cover incompatible/default/chooser/authorization/payload cases. |
| 7 | Acceptance is produced only after a source-independent immutable delivery is retained, with no public window, protocol, handled, or carrier state. | ✓ VERIFIED | `catalog-intent-resolver.ts:288-326` freezes canonical delivery, awaits `targets.retain`, and returns an unstarted opaque task only with the exact accepted result. Retention-before-acceptance and no-start tests passed. |
| 8 | Runtime validates every normalized field, attests sender from the live session, sends one result before task start, and emits no second result on terminal task failure. | ✓ VERIFIED | `intent-service.ts:151-217` validates exact fields; `:260-330` derives sender from runtime context, sends the result, then starts and contains the task. Unit tests and the real-runtime integration tracer prove ordering and terminal behavior. |
| 9 | Ready target delivery survives source destruction, targets only the selected handler, contains authenticated source dTag and canonical carrier fields, and exposes no INC envelope. | ✓ VERIFIED | `manifest-intent-dispatch.test.ts:340-501` executes runtime/session/service/resolver/controller flow through source removal and delayed target readiness, asserting exact source result, target-only delivery, dTag, and no `inc.*` message. |
| 10 | Current eligible loaded sessions receive discovery changes without needing prior intent requests; destroyed/ineligible recipients do not. | ✓ VERIFIED | `runtime.ts:402-430` provides current, ACL/domain-gated delivery and `intent-service.ts:358-385` enumerates it only while registered. Runtime/service tests exercise live eligibility and cleanup. |
| 11 | Ready/reused, delayed target, replacement/retry, and terminal-policy seams remain private rather than becoming public contract fields. | ✓ VERIFIED | `manifest-intent-dispatch.test.ts:201-337,503-557` proves ready, deferred, retry/replacement, and terminal cases retain exactly one acceptance and canonical target delivery/no second result. |
| 12 | Transitional Paja/playground consumers and package docs describe the exact Phase 104 contract without presenting the Phase 105 persistent host flow as complete. | ✓ VERIFIED | Paja type-check, playground catalog tests, active-source guards, and `pnpm docs:check` pass; source/docs identify these consumers as transitional rather than live-host authority. |
| 13 | Active surfaces reject obsolete numbered/protocol/lifecycle intent vocabulary. | ✓ VERIFIED | `tests/unit/nip5d-conformance-guard.test.ts` and `tests/unit/intent-active-source-guard.test.ts` passed; source inspection found no Phase-104 `TBD`, `FIXME`, `XXX`, placeholder, or empty user-visible implementation. |

**Score:** 12/13 truths verified (0 present but behavior-unverified)

### Required Artifacts

| Artifact group | Status | Details |
| --- | --- | --- |
| Intent types, exports, protected namespace binding, and binding tests (Plan 01) | ✓ VERIFIED | All 4 declared artifacts passed substantive checks and the binding is live through the exported prelude. |
| NIP parser, manifest adapter, playground authoring, and gateway proof (Plan 02) | ✗ PARTIAL | All artifacts exist and are wired, but authoring silently trims malformed whitespace; it cannot be called fail-closed. |
| Resolver, retained delivery service/types, and resolver tests (Plan 03) | ✓ VERIFIED | Exact contracts drive compatibility and retention occurs before acceptance. |
| Runtime context/lifecycle, canonical denial, ACL direction, and runtime tests (Plan 04) | ✓ VERIFIED | Attachment, session attestation, policy-aware target send, and sanctioned intent direction are wired. |
| Integration tracer, active guards, transitional consumers, and package docs (Plan 05) | ✓ VERIFIED | The tracer executes the end-to-end behavioral invariants; docs build cleanly. |

### Key Link Verification

`gsd-tools query verify.key-links` reported all declared links present: Plan 01
3/3, Plan 02 3/3, Plan 03 3/3, Plan 04 4/4, and Plan 05 4/4 (17/17).
Direct tracing also confirmed the substantive chain:

`parseNappletManifest` → `manifestToIntentCatalogEntry` →
`createCatalogIntentResolver` → `createIntentService` → runtime-attested
session context → retained controller → target-only `intent.deliver`.

The failed build-authoring validation is upstream of this otherwise-wired chain:
invalid source metadata can be normalized into a trusted signed tag.

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
| --- | --- | --- | --- | --- |
| Manifest adapter | `archetypes` / `contracts` | Parsed `NappletManifest.archetypes` | Parser preserves exact tag records and scoped kinds | ✓ FLOWING |
| Catalog resolver | compatible candidate + frozen delivery | Manifest-derived contracts + runtime-attested sender | Exact equality and `targets.retain()` precede acceptance | ✓ FLOWING |
| Intent service | target pushes / source results | Live session registry and retained task outcome | Runtime context rechecks target liveness, domain, ACL before transport | ✓ FLOWING |
| Playground manifest authoring | `archetypes` emitted into signed tags | Build config input | ⚠️ Normalizes malformed whitespace before signing | ✗ HOLLOW VALIDATION |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Binding, parser, adapter, resolver, service, runtime, integration, and active guards | `pnpm exec vitest run` on 11 Phase-104 focused files | 181 tests passed | ✓ PASS |
| Build metadata regression currently claimed by the phase | `pnpm exec vitest run tests/unit/playground-gateway-guard.test.ts -t 'validates exact convention-bearing archetype build metadata'` | 1 passed, 14 skipped | ✓ PASS — but incomplete coverage; whitespace vectors are absent |
| Affected package type checking | `pnpm --filter @kehto/{nip,runtime,services,shell,paja} type-check` | all passed | ✓ PASS |
| Phase-local docs | `pnpm docs:check` | TypeDoc, VitePress, docs audit passed | ✓ PASS |
| Patch integrity | `git diff --check` | exit 0 | ✓ PASS |

### Requirements Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| BASE-01 | ✓ SATISFIED | Exact public model, active-source guards, and docs remove canonical numbered/protocol vocabulary. |
| BASE-02 | ✓ SATISFIED | Binding, parser, adapter, and resolver use queryless `napplet:<archetype>/<intent>` identities. |
| INTENT-01 | ✓ SATISFIED | Protected `invoke`/`open` URI boundary and rejection matrix are exercised. |
| INTENT-02 | ✓ SATISFIED | Service validates required identity/field consistency before resolver call. |
| INTENT-03 | ✓ SATISFIED | Exact canonical types and public exports are present; negative shape guard passes. |
| INTENT-04 | ✓ SATISFIED | Parsed manifest contracts remain distinct and flow to catalog candidates. |
| INTENT-05 | ✓ SATISFIED | Resolver filters only exact `contract.convention`; payload and indexes do not select. |
| INTENT-06 | ✓ SATISFIED | Default, chooser, and explicit dTag authorization paths are fail-closed. |
| INTENT-07 | ✓ SATISFIED | One structured accepted/rejected result; no post-acceptance result path. |
| INTENT-08 | ✓ SATISFIED | Retention precedes result/task start; source teardown and delayed readiness integration run passed. |
| INTENT-09 | ✓ SATISFIED | Session-derived sender, exact carrier, selected target only, and no ID/INC evidence. |
| INTENT-10 | ✓ SATISFIED | Parent-only FIFO binding buffer plus private lifecycle-policy matrix. |
| INTENT-11 | ✓ SATISFIED | Registered service enumerates current eligible sessions with no request-history map. |
| ARCH-01 | ✓ SATISFIED | Parser preserves one ordered queryless contract/tag and local kind scope. |
| ARCH-02 | ✓ SATISFIED | Action/convention indexes are derived; tests prove no payload/event-kind/default inference. |
| ARCH-04 | ✗ BLOCKED | Playground authoring silently accepts whitespace-padded malformed metadata through `.trim()`, violating fail-closed validation. |

No Phase 104 requirement is orphaned from plan coverage. The ARCH-04 failure
is not deferred: Phase 105's documented responsibility is dependency adoption
and persistent live-host flows, while this phase owns the build-validation
boundary itself.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- |
| `apps/playground/napplets/shared-vite-config.ts` | 79, 85 | Input normalization before validation | 🛑 BLOCKER | Makes malformed contract metadata acceptable and hides it from later signed-manifest checks. |

No unreferenced `TBD`, `FIXME`, or `XXX` debt markers, placeholder render paths,
or hard-coded empty data stubs were found in the Phase 104 modified surface.

## Gaps Summary

The phase almost completes its intended chain, and the runtime lifecycle claims
have direct behavioral evidence. However, the build boundary contradicts its
own strict-parser policy: whitespace-padded input is converted to a different,
valid convention before regex validation and signing. This leaves an observable
ARCH-04/Plan-02 must-have false. Remove the trimming, test rejection of both
slug and convention padding, then re-run the focused suite and verification.

---

_Verified: 2026-07-26T15:18:14Z_
_Verifier: gsd-verifier_
