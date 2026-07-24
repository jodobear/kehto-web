---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-07-24T14:10:32.364Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 102 | todo | packages/services/src/identity-service.test.ts | 384 | Pre-existing TODO(12-10) leaves ACL denial coverage at a service-shape assertion rather than runtime integration. | open |  | 2026-07-24T14:10:32.364Z |  |

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
  }
]
````
