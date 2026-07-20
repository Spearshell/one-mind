---
command: code-review-graph
description: "Local-first code intelligence graph — build a structural map of your codebase so AI tools read only what matters. Invoked as /code-review-graph."
---

# code-review-graph — Code Intelligence for AI Tools

**Stop burning tokens. Start reviewing smarter.**

Builds a persistent map of your code with Tree-sitter, exposes 30 MCP tools to your AI assistant, and delivers 38x–528x token reduction on code reviews.

---

## When to Activate

Load this skill when the user asks for:
- Token-efficient code review (PR review, change analysis, delta review)
- Blast-radius analysis ("what does this change affect?")
- Risk-scored impact reports for commits or PRs
- Semantic search of code entities
- Architecture overview, community detection, hub/bridge nodes
- Refactoring preview (renames, dead code, suggestions)
- Wiki generation, Obsidian/Neo4j export
- Multi-language code parsing
- Custom language addition
- GitHub Action for risk-scored PR reviews

---

## Headline Numbers

| Metric | Result |
|--------|--------|
| Token reduction | ~82x median per question (38x–528x range) |
| Impact F1 | 0.71 average |
| Search latency | 0.4–1.5 ms |
| Incremental update | < 2s for 2,900 files |
| Languages | 30+ |

---

## Quick Start

```bash
pip install code-review-graph        # or: pipx install code-review-graph
code-review-graph install            # auto-detect and configure all platforms
code-review-graph build              # parse your codebase
```

Then ask the AI assistant:
```
Build the code review graph for this project
```

---

## CLI Reference

| Command | What it does |
|---------|--------------|
| `install` | Auto-detect and configure platforms |
| `build` | Parse entire codebase |
| `update` | Incremental update |
| `watch` | Auto-update on file changes |
| `status` | Graph statistics |
| `visualize` | Generate HTML graph (json/graphml/svg/obsidian/cypher) |
| `detect-changes --brief` | Risk panel + token savings |
| `eval` | Run evaluation benchmarks |
| `serve` | Start MCP server |
| `wiki` | Generate markdown wiki from communities |

---

## Token Savings Panel

`detect-changes --brief` prints:

```
┌─────────────────────── Token Savings ────────────────────────┐
│ Full context would be:     12,921 tokens                     │
│ Graph context used:           762 tokens                     │
│ Saved:                     12,159 tokens (~94%)              │
└──────────────────────────────────────────────────────────────┘
```

Same panel is attached to MCP responses as `context_savings` metadata.

---

## 30 MCP Tools

| Tool | When |
|------|------|
| `build_or_update_graph_tool` | Build or incrementally update |
| `get_minimal_context_tool` | Ultra-compact context (~100 tokens) — call first |
| `get_impact_radius_tool` | Blast radius of changes |
| `get_review_context_tool` | Token-optimised review context |
| `query_graph_tool` | Callers, callees, tests, imports, inheritance |
| `traverse_graph_tool` | BFS/DFS with token budget |
| `semantic_search_nodes_tool` | Find code by name or meaning |
| `detect_changes_tool` | Risk-scored change analysis |
| `get_affected_flows_tool` | Find affected execution paths |
| `get_architecture_overview_tool` | High-level architecture map |
| `get_hub_nodes_tool` | Most-connected nodes (hotspots) |
| `get_bridge_nodes_tool` | Architectural chokepoints |
| `refactor_tool` | Rename preview, dead code detection |

Plus 17 more for: embeddings, communities, flows, repos, cross-repo search, and refactoring apply.

---

## Built-in Skills (7 sub-skills)

The repo ships its own skill pack at `~/.opencode/skills/code-review-graph/skills/`:

| Skill | Use |
|-------|-----|
| `build-graph` | Build or rebuild the graph |
| `review-delta` | Review only changes since last commit |
| `review-pr` | Full PR review with blast-radius |
| `review-changes` | Review working-tree changes |
| `debug-issue` | Debug using graph context |
| `explore-codebase` | Get architecture overview |
| `refactor-safely` | Plan and verify refactor |

---

## Multi-Platform MCP Setup

Auto-detects and configures: **Codex, Claude Code, Cursor, Windsurf, Zed, Continue, OpenCode, Antigravity, Gemini CLI, Qwen, Qoder, Kiro, GitHub Copilot**

```bash
code-review-graph install --platform codex
code-review-graph install --platform cursor
code-review-graph install --platform claude-code
code-review-graph install --platform gemini-cli
code-review-graph install --platform copilot
code-review-graph install --platform copilot-cli
code-review-graph install --platform codebuddy
```

---

## Multi-Repo Daemon

For editors without file hooks:

```bash
crg-daemon add ~/project-a --alias proj-a
crg-daemon start
crg-daemon status
crg-daemon logs --repo proj-a -f
crg-daemon stop
```

Config at `~/.code-review-graph/watch.toml`.

---

## GitHub Action

Risk-scored PR comments, fully local-first in CI:

```yaml
# .github/workflows/code-review-graph.yml
on: pull_request

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: tirth8205/code-review-graph@v2.3.6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

Optional `fail-on-risk` input turns the review into a merge gate.

---

## Custom Languages (no fork)

`.code-review-graph/languages.toml`:

```toml
[languages.erlang]
extensions = [".erl"]
grammar = "erlang"
function_node_types = ["function_clause"]
class_node_types = ["record_decl"]
import_node_types = ["import_attribute"]
call_node_types = ["call"]
```

---

## Pairing with /one-mind

When `/one-mind` is active, this skill activates for any code review question. The pairing is:

1. `one-mind` enforces process discipline (TDD, brainstorming before coding)
2. `code-review-graph` provides token-efficient context (38x–528x reduction)
3. Together: catch the right issues with minimal context cost

---

## Installation

```bash
# Install the package
pip install code-review-graph

# Auto-configure your AI platform
code-review-graph install

# Build the graph
code-review-graph build
```

CLI works directly. MCP integration requires platform config — `install` does it automatically.

---

## Limitations

- **Impact "recall 1.0" is graph-derived and circular** — ground truth comes from same graph edges the predictor walks; upper bound by construction.
- **Small single-file changes** — graph context can exceed naive reads for trivial edits.
- **Search quality (MRR 0.35)** — keyword search finds top-4 but ranking needs improvement.
- **Flow detection (33% recall)** — strongest for Python and PHP/Laravel.

These are honest measurements, not marketing.

---

**One-liner:** Build the graph once, query forever — 38x–528x fewer tokens per review.
