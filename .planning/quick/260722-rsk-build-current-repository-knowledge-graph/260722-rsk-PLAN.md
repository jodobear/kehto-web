---
quick_id: 260722-rsk
status: planned
description: Build a current, local knowledge graph for the repository with graphify's default pipeline and HTML visualization.
created: 2026-07-22
execution_mode: graphify-default
must_haves:
  truths:
    - The repository root is extracted as one default-mode, undirected graph rather than a partial or incremental scan.
    - The completed local output contains a non-empty GraphRAG JSON graph, a labeled audit report, and the default interactive HTML visualization.
    - Graphify reports corpus scope, skipped-sensitive-file count when present, extraction token totals, and graph-health diagnostics honestly.
    - Generated graph artifacts remain untracked and unstaged because this repository has no explicit graphify-out tracking policy.
  artifacts:
    - graphify-out/graph.json
    - graphify-out/GRAPH_REPORT.md
    - graphify-out/graph.html
    - graphify-out/cost.json
    - graphify-out/.graphify_manifest.json
  key_links:
    - graphify-out/.graphify_root records /workspace/projects/kehto-web as the scan root used by detection, extraction, build, labeling, and manifest persistence.
    - graphify-out/graph.json and GRAPH_REPORT.md are generated from the same merged extraction and labeled community analysis.
    - graphify export html reads the finalized graph and labels from graphify-out to produce graph.html.
---

# Quick Task 260722-rsk: Build current repository knowledge graph

## Execution context

- Read and follow `/home/at/.claude/skills/graphify/SKILL.md` before each graphify step. It is the authoritative runbook for this quick task.
- Execute from `/workspace/projects/kehto-web` with `INPUT_PATH=.`. This is an explicit fresh build request; `graphify-out/graph.json` was absent at planning time, so the existing-graph query fast path does not apply.
- Use default mode only: no `--mode deep`, `--update`, `--cluster-only`, `--directed`, `--no-viz`, `--obsidian`, or optional export flags. Keep `IS_DIRECTED=False`, and generate the default HTML output.
- The installed CLI reported `graphify 0.9.13`. Still run Step 1's prescribed interpreter resolver so all subsequent Python calls use `graphify-out/.graphify_python`.
- Repository policy audit: `.gitignore`, `.git/info/exclude`, and tracked-file checks contain no `graphify-out/` rule or tracked graph artifact. Generated graph outputs must remain local, untracked, and unstaged; do not change ignore rules in this task.

## Task 1: Extract the repository root through graphify Steps 1–4.5

**Files:** `graphify-out/.graphify_python`, `graphify-out/.graphify_root`, `graphify-out/.graphify_detect.json`, `graphify-out/.graphify_ast.json`, `graphify-out/.graphify_semantic.json`, `graphify-out/.graphify_extract.json`, `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`, `graphify-out/.graphify_analysis.json`, and transient semantic cache/chunk files under `graphify-out/`.

**Action:** From the repository root, execute graphify SKILL.md Steps 1 through 4.5 in their documented order with `INPUT_PATH=.` and `IS_DIRECTED=False`. Step 1 must resolve/import the installed interpreter, persist `.graphify_python`, and persist the absolute repository scan root. Step 2 must write and inspect the detection JSON, show the prescribed corpus summary, surface only the count of sensitive files skipped, and stop if no supported files exist. If the documented corpus threshold is exceeded, calculate and show the five first-level directory counts, then pause for the required scope decision rather than silently narrowing the scan. If media is detected, execute Step 2.5 before extraction.

Run Step 3 exactly: start AST extraction and semantic extraction in parallel; use the code-only empty-semantic fast path only when detection has no documents, papers, or images. For semantic files, honor the documented Gemini environment-variable path when available; otherwise use the required cache check, 20–25-file directory-aware chunks, absolute chunk output paths, `general-purpose` agents dispatched together, and `DEEP_MODE=false`. Check every chunk on disk, record real agent token usage in its JSON before merging, cache successful results, clean temporary semantic intermediates, and merge AST plus semantic data into `.graphify_extract.json`. Build, cluster, score, analyze, export, and shrink-guard the graph in Step 4; do not continue if the run reports an empty graph or refuses a graph shrink. Run Step 4.5 after a successful build and retain any graph-health warning for the final quick-task summary.

**Verify:** Run `test -s graphify-out/graph.json && test -s graphify-out/GRAPH_REPORT.md`, then use `$(cat graphify-out/.graphify_python)` to parse `graphify-out/graph.json` and assert it has at least one node and one edge. Confirm the Step 4.5 diagnostic is either the documented clean result or a surfaced warning with its exact counts.

**Done:** A non-empty default undirected graph and matching preliminary report exist for the complete approved root scope, with an honest detection/extraction audit trail available for labeling.

## Task 2: Label, render, preserve the manifest, and keep graph artifacts local

**Files:** `graphify-out/.graphify_labels.json`, `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.html`, `graphify-out/.graphify_manifest.json`, `graphify-out/cost.json`, `graphify-out/graph.json`, and `.planning/quick/260722-rsk-build-current-repository-knowledge-graph/260722-rsk-SUMMARY.md`.

**Action:** Complete graphify SKILL.md Steps 5, 6, and 9 in order. Read the actual community membership in `.graphify_analysis.json`, assign each community a truthful two-to-five-word label based on its node labels, regenerate the report and questions with those labels, and save `.graphify_labels.json`. Run `graphify export html` as the default visualization export; do not create Obsidian, SVG, GraphML, database, MCP, wiki, or watch outputs. Save the update manifest and cumulative token cost, remove only the documented temporary detection/extraction/analysis/chunk files, then inspect the final GRAPH_REPORT.md. Record graph node/edge/community totals, graph-health result, token totals, and the report's God Nodes, Surprising Connections, and Suggested Questions in the required quick-task summary. Offer the report's single most cross-community suggested question for a follow-up graph query.

Before any planning-artifact commit, re-check `git check-ignore -v graphify-out graphify-out/graph.json` and `git ls-files --error-unmatch graphify-out/graph.json`. Because no explicit tracking policy exists, never stage, commit, push, or add an ignore rule for `graphify-out/**`; stage only the required `.planning/quick/260722-rsk-build-current-repository-knowledge-graph/` artifacts by explicit path if the quick workflow records completion.

**Verify:** Run `test -s graphify-out/graph.html && test -s graphify-out/GRAPH_REPORT.md && test -s graphify-out/cost.json && test -s graphify-out/.graphify_manifest.json`; assert all documented Step 9 temporary files are absent; and run `! git diff --cached --name-only -- graphify-out | grep -q .` plus `! git ls-files --error-unmatch graphify-out/graph.json >/dev/null 2>&1` to prove generated graph output is neither staged nor tracked.

**Done:** `graphify-out/` holds the complete default HTML, JSON, report, manifest, and cost artifacts for the current repository, while version-controlled changes are limited to the required quick-task planning records.

## Source coverage audit

| Source | Item | Coverage |
|---|---|---|
| GOAL | Build the current repository knowledge graph. | Tasks 1–2 run the full root pipeline, build the graph, label it, and export HTML. |
| REQ | No roadmap requirement IDs apply to this quick task. | Not applicable. |
| RESEARCH | No phase research artifact applies; graphify SKILL.md is the operational authority. | Tasks 1–2 cite and execute its Steps 1–9. |
| CONTEXT | Outputs are limited to graphify-out plus required quick-task artifacts; source code remains unchanged. | Tasks 1–2 list only graph output and `.planning/quick` artifacts. |
| CONTEXT | Use the current directory in default mode with default HTML output. | Tasks 1–2 lock `INPUT_PATH=.`, default undirected mode, and `graphify export html`. |
| CONTEXT | Do not commit generated graph output unless existing policy explicitly tracks it. | Task 2 re-checks policy and prohibits staging or committing `graphify-out/**`. |

## Completion criteria

- The graph is a fresh full-root build, not an incremental update, directed graph, or partial subdirectory scan unless graphify's mandatory corpus-scope checkpoint is explicitly resolved.
- `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`, and `graphify-out/graph.html` are all non-empty and describe the same labeled graph.
- The final summary exposes token cost and every graph-health warning without omission.
- No source, test, documentation, configuration, or package file is modified, and no generated `graphify-out/**` file is version-controlled.
