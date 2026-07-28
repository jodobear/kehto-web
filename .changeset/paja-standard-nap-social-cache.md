---
"@kehto/paja": minor
"@kehto/runtime": minor
"@kehto/services": minor
---

Add Paja's batch-warmed, active-account-scoped social cache behind standard identity and OUTBOX services, with request-scoped capability checks that prevent OUTBOX-only callers from observing private follow-derived cache entries.
