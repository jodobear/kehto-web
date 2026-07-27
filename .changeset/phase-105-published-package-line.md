---
'@kehto/acl': minor
'@kehto/cli': minor
'@kehto/firewall': minor
'@kehto/paja': minor
'@kehto/runtime': minor
'@kehto/services': minor
'@kehto/shell': minor
---

Raise the published Napplet compatibility floor to core/nap 0.29.0. This is a
breaking 0.x change: all affected packages now require the verified
`>=0.29.0 <0.30.0` peer line. Services publish canonical intent ownership and
retained acceptance-before-delivery behavior; Paja publishes the corresponding
host flow. Shell is included because its published peer manifest changed while
Kehto retains the host-owned mandatory NAP-SHELL prelude for the released
core/shim omission; this changeset does not publish packages locally.
Runtime and services also complete the NAP-RELAY publish boundary: the shell
signs event templates, relay backends receive the signed event, and successful
results return the full event through canonical `ok` / `event` / `eventId`
fields. Async relay settlement now precedes success, rejected publishes never
enter host caches, and failed pending replay reservations are released for
deterministic retry while concurrent duplicates remain blocked.
Shell keeps the merged NAP-INC `IncEvent` callback contract; package-based demo
consumers bridge the released 0.29.0 `(payload, NostrEvent)` projection as
documented upstream drift.
