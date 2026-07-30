# Phase 102 Implementation Authority Note

**Recorded:** 2026-07-24T13:20:15Z
**Scope:** Plan 102-01 preflight only. This note records external protocol authority and installed published declarations before Phase 102 source, test, or package-documentation changes.

## Executable checks

The following strict, rerunnable command sequence was run from the orchestrator-supplied repository root. It intentionally writes fetched authority inputs only to a temporary directory outside tracked files.

```bash
set -euo pipefail
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
PINNED_IDENTITY=6461e4b37c29dc09a20dff35d9515889c4433874
PINNED_OUTBOX=4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e
REMOTE=https://github.com/napplet/naps.git

LS_REMOTE=$(git ls-remote --refs "$REMOTE" refs/heads/master)
LINE_COUNT=$(printf '%s\n' "$LS_REMOTE" | grep -c . || true)
[ "$LINE_COUNT" -eq 1 ]
MASTER_SHA=$(printf '%s\n' "$LS_REMOTE" | cut -f1)
printf '%s' "$MASTER_SHA" | grep -Eq '^[0-9a-f]{40}$'

IDENTITY_PINNED_URL="https://raw.githubusercontent.com/napplet/naps/${PINNED_IDENTITY}/naps/NAP-IDENTITY.md"
IDENTITY_MASTER_URL="https://raw.githubusercontent.com/napplet/naps/${MASTER_SHA}/naps/NAP-IDENTITY.md"
OUTBOX_PINNED_URL="https://raw.githubusercontent.com/napplet/naps/${PINNED_OUTBOX}/naps/NAP-OUTBOX.md"
TREE_URL="https://api.github.com/repos/napplet/naps/git/trees/${MASTER_SHA}?recursive=1"

curl --fail --silent --show-error --location "$IDENTITY_PINNED_URL" -o "$TMP/NAP-IDENTITY.pinned.md"
curl --fail --silent --show-error --location "$IDENTITY_MASTER_URL" -o "$TMP/NAP-IDENTITY.master.md"
curl --fail --silent --show-error --location "$OUTBOX_PINNED_URL" -o "$TMP/NAP-OUTBOX.pinned.md"
curl --fail --silent --show-error --location "$TREE_URL" -o "$TMP/master-tree.json"

cmp -s "$TMP/NAP-IDENTITY.pinned.md" "$TMP/NAP-IDENTITY.master.md"
node -e 'const fs = require("node:fs"); const source = process.argv[1]; const parsed = JSON.parse(fs.readFileSync(source, "utf8")); if (!Array.isArray(parsed.tree)) { throw new Error("GitHub tree JSON lacks an array tree"); } if (parsed.tree.some((entry) => entry && entry.path === "naps/NAP-OUTBOX.md")) { throw new Error("Current master tree contains naps/NAP-OUTBOX.md"); } console.log(`TREE_ENTRIES=${parsed.tree.length}`); console.log("OUTBOX_PATH_ABSENT=true");' "$TMP/master-tree.json"

sha256sum "$TMP/NAP-IDENTITY.pinned.md" | cut -d' ' -f1
sha256sum "$TMP/NAP-IDENTITY.master.md" | cut -d' ' -f1
sha256sum "$TMP/NAP-OUTBOX.pinned.md" | cut -d' ' -f1
sha256sum "$TMP/master-tree.json" | cut -d' ' -f1

IDENTITY_TYPES=node_modules/.pnpm/@napplet+nap@0.28.0/node_modules/@napplet/nap/dist/identity/types.d.ts
OUTBOX_TYPES=node_modules/.pnpm/@napplet+nap@0.28.0/node_modules/@napplet/nap/dist/outbox/types.d.ts
[ -f "$IDENTITY_TYPES" ]
[ -f "$OUTBOX_TYPES" ]
rg -n 'IdentityGetFollows' "$IDENTITY_TYPES"
rg -n 'OutboxQuery|OutboxResult' "$OUTBOX_TYPES"
```

## Current-master authority evidence

- `git ls-remote --refs https://github.com/napplet/naps.git refs/heads/master` returned exactly:

  ```text
  5ac0490461ca6fec2f0d2e45b4835cf9bc08de24	refs/heads/master
  ```

- `MASTER_SHA`: `5ac0490461ca6fec2f0d2e45b4835cf9bc08de24` (one lowercase 40-hex SHA).
- Pinned NAP-IDENTITY URL: <https://raw.githubusercontent.com/napplet/naps/6461e4b37c29dc09a20dff35d9515889c4433874/naps/NAP-IDENTITY.md>
- Current-master NAP-IDENTITY URL: <https://raw.githubusercontent.com/napplet/naps/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24/naps/NAP-IDENTITY.md>
- Pinned NAP-OUTBOX URL: <https://raw.githubusercontent.com/napplet/naps/4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e/naps/NAP-OUTBOX.md>
- Current-master recursive tree API URL: <https://api.github.com/repos/napplet/naps/git/trees/5ac0490461ca6fec2f0d2e45b4835cf9bc08de24?recursive=1>

| Fetched input | SHA-256 |
| --- | --- |
| Pinned `NAP-IDENTITY.md` | `f599c0b0cf68fb2bf4c2f6f08a3675d09cca1d53c620e7863957f3ab3dc45bce` |
| Master `NAP-IDENTITY.md` | `f599c0b0cf68fb2bf4c2f6f08a3675d09cca1d53c620e7863957f3ab3dc45bce` |
| Pinned `NAP-OUTBOX.md` | `1761cd6515b125f2ab802343c19749d9da09863ce62a90a7a156714a0239d0f4` |
| Master recursive tree JSON | `6c78a987957422786dbbc00a5a8f028cc7d0ad1fce95954f97ffeb4efa4b5373` |

- `cmp -s` exited zero: the pinned and master NAP-IDENTITY documents are **byte-identical**.
- The parsed current-master tree contained 24 entries and `naps/NAP-OUTBOX.md` was **absent**. The Node inspection rejects malformed tree JSON and rejects a tree that contains that exact path.

## Installed published type-contract evidence

The installed contract is `@napplet/nap@0.28.0` at these required declaration paths:

- `node_modules/.pnpm/@napplet+nap@0.28.0/node_modules/@napplet/nap/dist/identity/types.d.ts`
- `node_modules/.pnpm/@napplet+nap@0.28.0/node_modules/@napplet/nap/dist/outbox/types.d.ts`

The declaration inspection matched the required identifiers:

| Identifier | Installed declaration evidence |
| --- | --- |
| `IdentityGetFollows` | `IdentityGetFollowsMessage` at line 84; `IdentityGetFollowsResultMessage` at line 257; request/result unions at lines 372 and 374; both types exported at line 397. |
| `OutboxQuery` | `OutboxQueryOptions` at line 38; `OutboxQueryMessage` at line 177; `OutboxQueryResultMessage` at line 187; query message and result message included in outbound/inbound unions at lines 299 and 301; public exports at line 305. |
| `OutboxResult` | `interface OutboxResult` at line 87 and its type export at line 305. |

## Authority disposition

Pinned NAP-OUTBOX 4589a8f9a16d8aa29b3740e2b3b0cdca11e0976e plus installed @napplet/nap@0.28.0 types govern the Phase 102 PoC under upstream drift; no current-master conformance claim.

This preflight did not inspect, mutate, stage, schedule, or otherwise enter Writer source, test, fixture, smoke, or documentation paths.

## Browser prerequisite evidence

**Rechecked:** 2026-07-24T13:49:36Z

The configured executable gate now passes without changing `playwright.config.ts`:

```bash
test -x /usr/bin/chromium && /usr/bin/chromium --version
# Chromium 150.0.7871.128 Built from source for Fedora release 43 (Forty Three)
```

The configured Playwright project was then enumerated without running the browser suite, as required for Wave 0:

```bash
./node_modules/.bin/playwright test --list --project=chromium
# Total: 74 tests in 39 files
```

The list command loaded the repository's `chromium` project, which keeps `/usr/bin/chromium` as its `executablePath`. The final browser-inclusive test run remains owned by Plan 102-04.
