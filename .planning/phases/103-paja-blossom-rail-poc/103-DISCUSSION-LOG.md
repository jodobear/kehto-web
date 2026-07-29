# Phase 103: Paja Blossom Rail PoC - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-28
**Phase:** 103-paja-blossom-rail-poc
**Areas discussed:** Replication strategy, completion proof, policy and consent, lifecycle and failures

---

## Replication Strategy

### Overall server behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Ordered failover | Configured order wins, otherwise discovery order; stop after first verified success. | |
| Single primary | Keep first-server-only behavior. | |
| Replication | Attempt multiple servers and return primary plus fallback URLs. | ✓ |

**User's choice:** Replication.
**Notes:** Upload remains generic NAP-UPLOAD; Blossom is the only current rail. Replication is high-level host behavior, not exposure of low-level `blossom.mirror`.

### Completion threshold and result shape

| Option | Description | Selected |
|--------|-------------|----------|
| One or more | Complete when at least one selected target verifies. | ✓ |
| All replicas | Fail the entire upload if any selected target fails. | |
| Quorum | Require a configurable success count. | |

**User's choice:** Try every configured server in order and return a result for each.
**Notes:** Current NAP-UPLOAD has one correlated result, so verified successes map to ordered `url` and `fallbackUrls`. If two of three servers verify, return those two successes and retain the failed target in host diagnostics. User requested an upstream NAP-UPLOAD comment or PR for explicit per-server outcomes.

### Replica target set

| Option | Description | Selected |
|--------|-------------|----------|
| Configured else discovered | Use every configured server; fall back to all newest BUD-03 servers when configuration is empty. | |
| Merge both lists | Configured servers first, then deduplicated discovered servers. | |
| Configured only | Upload only to explicitly configured servers. | ✓ |

**User's choice:** Configured only.
**Notes:** No configured server means upload unavailable. Discovery may inform host setup but cannot silently authorize egress.

### Execution ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Sequential order | Run one server at a time in configured order. | ✓ |
| Bounded parallel | Run a small number concurrently while preserving result order. | |
| All parallel | Start every replica together. | |

**User's choice:** Sequential order.
**Notes:** Configured order determines attempt order, primary URL, and fallback URL order.

---

## Completion Proof

### Stored-byte evidence

| Option | Description | Selected |
|--------|-------------|----------|
| GET + hash/size | Retrieve stored bytes and recompute exact SHA-256 and size. | ✓ |
| Descriptor only | Trust matching upload-response metadata. | |
| HEAD metadata | Verify reachability and Content-Length only. | |

**User's choice:** GET + hash/size.
**Notes:** Descriptor-only success is insufficient. Every exposed replica URL must represent independently verified stored bytes.

### Returned URL policy

| Option | Description | Selected |
|--------|-------------|----------|
| Public HTTPS + byte proof | Permit CDN/object-store origins under SSRF policy and exact proof. | ✓ |
| Same server origin | Require result origin to equal configured server origin. | |
| Explicit allowlist | Require separate result-origin configuration. | |

**User's choice:** Public HTTPS + byte proof.
**Notes:** Verification must reject private-network/SSRF targets and non-HTTPS URLs even when descriptor metadata matches.

### MIME validation

| Option | Description | Selected |
|--------|-------------|----------|
| Sniff + enforce | Sniff stored bytes, enforce allowlist, reject conflicting non-generic metadata. | ✓ |
| Sniff overrides | Trust sniffed type and ignore metadata conflicts. | |
| Metadata only | Use request/descriptor MIME without sniffing. | |

**User's choice:** Sniff + enforce.
**Notes:** Host policy applies to actual stored bytes, not only caller or server claims.

### Preview authorization

| Option | Description | Selected |
|--------|-------------|----------|
| Scoped auto-grant | Grant only verified result URLs to the requesting window/session. | ✓ |
| Separate resource consent | Require a second resource consent after upload. | |
| No special grant | Rely solely on pre-existing resource policy. | |

**User's choice:** Scoped auto-grant.
**Notes:** Preview remains standard `resource.bytes`; grant revokes on teardown and never expands to arbitrary origin access.

---

## Policy and Consent

### Replication disclosure

| Option | Description | Selected |
|--------|-------------|----------|
| One prompt, all targets | Disclose every target, replica count, file details, and worst-case egress once. | ✓ |
| Prompt per server | Ask separately before each replica. | |
| First server only | Prompt for primary while silently covering replicas. | |

**User's choice:** One prompt, all targets.
**Notes:** Prompt must explain public/durable storage and total possible bytes across replicas.

### Consent cadence

| Option | Description | Selected |
|--------|-------------|----------|
| Every upload | Prompt for every public write. | |
| Per session grant | Remember bounded approval until session end. | ✓ |
| Persistent grant | Remember across sessions until revoked. | |

**User's choice:** Per session grant.
**Notes:** Grant is not blanket approval; its exact scope is separately constrained.

### Session-grant key

| Option | Description | Selected |
|--------|-------------|----------|
| Exact policy tuple | Napplet/window, identity, ordered server set, MIME class, and size ceiling. | ✓ |
| Napplet + servers | Allow any policy-permitted file for same napplet/server set. | |
| Napplet only | Broad session approval across servers and file classes. | |

**User's choice:** Exact policy tuple.
**Notes:** Any identity, server-set, MIME-class, or size-ceiling change re-prompts.

### File policy authority

| Option | Description | Selected |
|--------|-------------|----------|
| Host config + safe defaults | Host owns ceilings/allowlist; server may narrow only. | ✓ |
| Fixed Paja policy | Hard-code one policy for all hosts. | |
| Server policy | Let server metadata define accepted files. | |

**User's choice:** Host config + safe defaults.
**Notes:** Reject before consent, signing, or network activity.

---

## Lifecycle and Failures

### Failure continuation

| Option | Description | Selected |
|--------|-------------|----------|
| Replica-local failures | Continue after local transport/server/validation failures; stop on global trust changes. | ✓ |
| Any failure | Continue even after identity/policy changes. | |
| Stop first failure | Abort replication on any target failure. | |

**User's choice:** Replica-local failures.
**Notes:** Consent cancellation, teardown, policy denial, and identity/signer changes stop the operation.

### Timeout behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Per-server + total budget | Bound each target and the whole operation. | |
| Per-server only | Bound each target without total cap. | |
| No timeout | Wait until request settles or teardown aborts it. | ✓ |

**User's choice:** No timeout.
**Notes:** User accepted the consequence that a hung earlier target can block later sequential replicas.

### Same-server retry

| Option | Description | Selected |
|--------|-------------|----------|
| No retry | Use replication as the only resilience mechanism. | |
| One transient retry | Retry network/5xx once; never retry trust/validation failures. | ✓ |
| Host-configured retries | Expose retry count/backoff configuration. | |

**User's choice:** One transient retry.
**Notes:** Retry is limited to transient network or HTTP 5xx failures.

### Capability availability

| Option | Description | Selected |
|--------|-------------|----------|
| Advertise feature, report unavailable | Keep domain present and report current readiness truthfully. | ✓ |
| Ready only | Advertise only while signer/server backend is currently usable. | |
| Always available | Advertise without explicit readiness semantics. | |

**User's choice:** Advertise feature, report unavailable.
**Notes:** Capability support and current backend readiness are distinct.

### Status pushes

| Option | Description | Selected |
|--------|-------------|----------|
| Full lifecycle | Emit pending, uploading, and terminal. | |
| Uploading + terminal | Emit uploading and exactly one terminal status. | ✓ |
| Result only | Rely on correlated result without terminal push. | |

**User's choice:** Uploading + terminal.
**Notes:** No initial `pending` push.

### Error representation

| Option | Description | Selected |
|--------|-------------|----------|
| Stable codes in current fields | Use documented code strings without adding local schema fields. | ✓ |
| Structured code extension | Add new wire fields immediately. | |
| Prose messages | Keep human-only errors. | |

**User's choice:** Stable codes in current fields.
**Notes:** Propose structured codes upstream separately rather than claiming local extension conformance.

### Cancelled versus failed

| Option | Description | Selected |
|--------|-------------|----------|
| User/teardown only | Cancellation and teardown use cancelled; other errors use failed. | ✓ |
| User only | Treat teardown as failed/interrupted. | |
| All non-success | Collapse all failures into cancelled. | |

**User's choice:** User/teardown only.
**Notes:** Consent denial and teardown have distinct stable cancellation codes.

### Cancellation after partial storage

| Option | Description | Selected |
|--------|-------------|----------|
| Cancelled, disclose copies | Hide success result from napplet but tell user which copies may exist. | ✓ |
| Complete partial result | Return already verified URLs despite cancellation. | |
| Cancelled silently | Hide both result and already-stored-copy information. | |

**User's choice:** Cancelled, disclose copies.
**Notes:** Stop remaining work, drop late responses, and never imply that cancellation deleted already-written public copies.

---

## Claude's Discretion

- Exact safe default size and MIME allowlist values.
- Stable error-code spelling and host diagnostic structure within existing NAP fields.
- Backoff details for the one transient retry.
- Upstream follow-up form: focused PR if a complete schema patch is ready; otherwise a concrete comment on NAP-UPLOAD PR #33.

## Deferred Ideas

- Low-level NAP-BLOSSOM operations, `blossom:sha256` reads, NIP-96 expansion, multi-rail choice, detailed byte-progress contracts, and napplet-initiated cancellation remain future work.
- Writer source work remains blocked until Phase 104 approval.
