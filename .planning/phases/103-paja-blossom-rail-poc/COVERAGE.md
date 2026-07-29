# Phase 103 Blossom API Coverage

This matrix treats each relevant Blossom capability as integrated unless the Phase 103 boundary expressly excludes it. `OPT-OUT` rows are deliberate scope decisions, not unexamined omissions. The authoritative transport references are BUD-01, BUD-02, and BUD-11; NAP-UPLOAD remains the only napplet-facing upload surface.

| capability | decision | reason |
|---|---|---|
| BUD-00 blob terminology and SHA-256 content-address model | INTEGRATE | Phase 103 validates the exact SHA-256 and byte length of shell-retrieved stored bytes before exposing a result URL. |
| BUD-01 `GET /<sha256>[.<ext>]` stored-blob retrieval | INTEGRATE | The Paja-owned verifier performs a full stored-byte GET under its public-HTTPS, redirect, DNS, size, and MIME policy; verified bytes populate an exact window-scoped `resource.bytes` grant. |
| BUD-01 `HEAD /<sha256>[.<ext>]` availability metadata | OPT-OUT | A metadata-only response cannot prove stored bytes; Phase 103 uses the required full GET proof instead. |
| BUD-02 `PUT /upload` raw blob upload | INTEGRATE | Paja signs and sends exact request bytes to each configured server in order, then validates the required descriptor fields. |
| BUD-03 kind `10063` user server-list discovery | OPT-OUT | It may inform a human or host configuration workflow, but it must not select an upload target. Only explicitly configured servers can receive bytes, per D-04. |
| BUD-04 `PUT /mirror` | OPT-OUT | Mirroring is a low-level Blossom operation outside the generic NAP-UPLOAD rail and Phase 103 scope. |
| BUD-05 `PUT /media` transform upload | OPT-OUT | Server-side transformations are outside the selected unmodified-byte upload contract. |
| BUD-05 `HEAD /media` transform preflight | OPT-OUT | Transform capability probing is outside scope and cannot expand Paja's host policy. |
| BUD-06 `HEAD /upload` upload preflight | OPT-OUT | It creates pre-consent server egress and cannot override host size/MIME policy; Paja applies policy locally before its single disclosed upload operation. |
| BUD-07 paid upload/download challenge and payment proof headers | OPT-OUT | Paja does not expose payment credentials or authorize payment flows in this rail; HTTP 402 is retained as a replica-local server failure diagnostic. |
| BUD-08 optional descriptor `nip94` metadata | INTEGRATE | Plan 01 derives NIP-94 only through `toVerifiedBlossomNip94()` from verified URL, sniffed MIME, exact digest, and size; forged descriptor tags must not reach `UploadResult`. |
| BUD-09 `PUT /report` blob reporting | OPT-OUT | Abuse-report workflows are not needed to mediate upload, proof, or preview and introduce another low-level server action. |
| BUD-10 `blossom:<sha256>` URI creation and resolution | OPT-OUT | Content-addressed reads are explicitly deferred; Phase 103 returns verified HTTPS URLs through NAP-RESOURCE only. |
| BUD-11 kind `24242` `upload` authorization and `PUT /upload` headers | INTEGRATE | Paja signs per-server short-lived, hash-bound, lowercase-server-scoped authorization and sends unpadded Base64url `Authorization`, `X-SHA-256`, MIME, and byte-length headers. |
| BUD-11 `get`, `delete`, `list`, `media`, and `mirror` permissions | OPT-OUT | Only the `upload` permission is required for the selected high-level rail; the other permissions would expose deferred low-level operations. |
| BUD-12 `GET /list/<pubkey>` | OPT-OUT | Blob listing is a deferred low-level operation and is not required to prove upload or preview. |
| BUD-12 `DELETE /<sha256>` | OPT-OUT | Phase 103 must not imply cancellation removes durable copies; delete authority and remote lifecycle management are deferred. |
| NIP-96 upload/discovery expansion | OPT-OUT | The generic NAP-UPLOAD surface remains transport-neutral, but Blossom is the sole implemented Phase 103 rail. |
| Napplet direct Blossom authority | OPT-OUT | Direct HTTP, credentials, auth events, and a blossom namespace violate D-01/D-02 mediation. |
