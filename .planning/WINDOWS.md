---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 3
total_count: 4
last_updated: 2026-07-24T14:22:01.390Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 102 | todo | packages/services/src/identity-service.test.ts | 384 | Pre-existing TODO(12-10) leaves ACL denial coverage at a service-shape assertion rather than runtime integration. | open |  | 2026-07-24T14:10:32.364Z |  |
| 2 | 102 | deviation | packages/paja/src/browser-social-cache.ts |  | Added per-filter limits to cached OUTBOX profile additions. | fixed |  | 2026-07-24T14:21:35.716Z | 2026-07-24T14:22:01.268Z |
| 3 | 102 | deviation | packages/paja/src/browser-social-cache.ts |  | Used Corepack because pnpm is absent from the executor PATH. | fixed |  | 2026-07-24T14:21:35.777Z | 2026-07-24T14:22:01.327Z |
| 4 | 102 | deviation | .planning/STATE.md |  | Corrected plan-decision phase labels emitted by the state helper. | fixed |  | 2026-07-24T14:21:35.836Z | 2026-07-24T14:22:01.390Z |

````json
[
  {
    "id": 1,
    "kind": "todo",
    "phase": "102",
    "file": "packages/services/src/identity-service.test.ts",
    "line": 384,
    "description": "Pre-existing TODO(12-10) leaves ACL denial coverage at a service-shape assertion rather than runtime integration.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-24T14:10:32.364Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "102",
    "file": "packages/paja/src/browser-social-cache.ts",
    "line": null,
    "description": "Added per-filter limits to cached OUTBOX profile additions.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-07-24T14:21:35.716Z",
    "resolved_at": "2026-07-24T14:22:01.268Z"
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "102",
    "file": "packages/paja/src/browser-social-cache.ts",
    "line": null,
    "description": "Used Corepack because pnpm is absent from the executor PATH.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-07-24T14:21:35.777Z",
    "resolved_at": "2026-07-24T14:22:01.327Z"
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "102",
    "file": ".planning/STATE.md",
    "line": null,
    "description": "Corrected plan-decision phase labels emitted by the state helper.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-07-24T14:21:35.836Z",
    "resolved_at": "2026-07-24T14:22:01.390Z"
  }
]
````
