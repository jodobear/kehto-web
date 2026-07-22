---
quick_id: 260722-rsk
status: complete
description: Build current repository knowledge graph via graphify, generating graphify-out artifacts only; do not modify source code.
commit: a544333
completed: 2026-07-22T20:41:54+05:30
---

# Quick Task 260722-rsk Summary

Built fresh undirected repository knowledge graph from user-approved code and documentation scope. Planning artifacts and media were excluded. Generated graph outputs remain local, unstaged, and untracked; no source, test, package, configuration, or product documentation files changed.

## Scope and Outputs

- Scanned 603 files: 478 code files and 125 documentation files, totaling about 407,232 words.
- Built 5,730 nodes, 9,744 undirected graph edges, 15 hyperedges, and 356 communities.
- Labeled all 356 communities; report displays 313 and omits 43 thin communities.
- Wrote GraphRAG data to `graphify-out/graph.json`.
- Wrote labeled audit report to `graphify-out/GRAPH_REPORT.md`.
- Wrote interactive visualization to `graphify-out/graph.html`.
- Graph exceeded 5,000-node browser limit, so HTML uses an aggregated community view with 356 community nodes and 437 cross-community edges.
- Wrote incremental cache/manifest data to `graphify-out/cache/stat-index.json` and `graphify-out/manifest.json`.
- Wrote extraction cost audit to `graphify-out/cost.json`.

## Extraction Audit

- Deterministic AST extraction produced 5,471 nodes and 10,737 edges.
- Semantic extraction produced 259 deduplicated nodes, 281 edges, and 15 final hyperedges.
- Final report classifies edges as 98% EXTRACTED, 2% INFERRED, and 0% AMBIGUOUS.
- Agent tooling exposed 534,226 aggregate subagent tokens without an input/output split. Cost record stores that available aggregate as input tokens and records output tokens as zero rather than inventing unavailable usage data.
- Sensitive files skipped: 0.

## Graph Health

`GRAPH HEALTH WARNING: 831 dangling-endpoint edges; 423 collapsed (directed) edges; 443 collapsed (undirected) edges - graph may be incomplete/corrupt.`

Additional diagnostics:

- 0 missing-endpoint edges
- 0 self-loops
- 108 exact duplicate edges
- 325 same-endpoint groups
- 124 relation-variant groups
- 157 source-location variant groups
- 17 context-variant groups
- 1,663 isolated or weakly connected nodes called out as knowledge gaps

Warning retained in `graphify-out/.graphify_health.json`; no producer behavior was silently repaired.

## God Nodes

1. `RuntimeAdapter` — 41 edges
2. `scripts` — 33 edges
3. `getMissingNapDomains()` — 32 edges
4. `createRuntime()` — 31 edges
5. `installPajaHost()` — 30 edges
6. `DemoConfig` — 29 edges
7. `CacheStorageNappletArtifactCache` — 28 edges
8. `demoBeforeEach()` — 28 edges
9. `PlaygroundRelayRuntimeImpl` — 24 edges
10. `installNapTheme()` — 24 edges

## Surprising Connections

All listed connections are inferred and should be treated as hypotheses, especially links into minified vendor code:

- `makeKind30166()` → `n()`: `packages/nip/src/66/index.test.ts` to `apps/playground/public/vendor/leader-line.min.js`
- `delay()` → `r()`: `packages/services/src/relay-pool-outbox-router.test.ts` to `apps/playground/public/vendor/leader-line.min.js`
- `tick()` → `r()`: `packages/services/src/relay-pool-outbox-router.test.ts` to `apps/playground/public/vendor/leader-line.min.js`
- `resolvePlaygroundNapplet()` → `sha256Hex()`: `apps/playground/src/napplet-resolver.ts` to `packages/paja/src/browser-upload.test.ts`
- `runIdentityProbe()` → `matches()`: `apps/playground/src/signer-modal.ts` to `packages/services/src/dm-service.test.ts`

## Suggested Questions

- Why does `createThemeService()` connect Theme Service Publishing to Playground User Preferences and CVM Service Messaging?
- Why does `sha256Hex()` connect NIP Artifact Cache Tests to Playground Resolution Tests, Browser Upload Relay Tests, and Paja Pointer Resolution?
- Why does `ShellBridge` connect Shell Bridge Lifecycle to Theme Service Publishing, Shell Domain Proxies, and Shell Ready Handshake?
- Are two inferred relationships involving `installPajaHost()` with `navigateFrame()` and `renderTargetErrorHtml()` correct?
- What connects `$schema`, `changelog`, and `commit` to rest of system?
- Should Direct Messaging Adapters be split into smaller, more focused modules?
- Should Runtime Dispatch Tests be split into smaller, more focused modules?

Most cross-community suggested question: why `createThemeService()` bridges Theme Service Publishing, Playground User Preferences, and CVM Service Messaging. It has highest listed betweenness centrality at 0.060.

## Token-Reduction Benchmark

```text
Corpus:          286,500 words → ~382,000 tokens (naive)
Graph:           5,730 nodes, 9,744 edges
Avg query cost:  ~2,713 tokens
Reduction:       140.8x fewer tokens per query

Per question:
  [292.5x] what is the main entry point
  [51.3x] how are errors handled
  [345.4x] what connects the data layer to the api
  [386.2x] what are the core abstractions
```

## Verification

- Required `graph.json`, `GRAPH_REPORT.md`, `graph.html`, `cost.json`, and `manifest.json` files exist and are non-empty.
- Parsed `graph.json` successfully and verified 5,730 nodes plus 9,744 `links` edges.
- Documented temporary detection, extraction, analysis, semantic chunk, and update-marker files were removed.
- `graphify-out/**` remains unstaged and untracked.
- No source files changed.
