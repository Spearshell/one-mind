---
name: code-review-graph
description: "Local-first code intelligence graph that builds a persistent map of your codebase so AI tools read only what matters — 38x to 528x token reduction on reviews with blast-radius, semantic search, and risk-scored analysis. Invoked as /code-review-graph."
---

# code-review-graph — Code Intelligence for AI Tools

**Stop burning tokens. Start reviewing smarter.**

Builds a structural map of your code with Tree-sitter, tracks changes incrementally, and gives your AI assistant precise context via MCP so it reads only what matters.

---

## When to Load

Load this skill when the user asks for:
- Token-efficient code review (PR review, change analysis, delta review)
- Blast-radius analysis ("what does this change affect?")
- Risk-scored impact reports for commits or PRs
- Semantic search of code entities by name or meaning
- Architecture overview, community detection, hub/bridge nodes
- Refactoring preview (renames, dead code, suggestions)
- Knowledge graph generation, wiki building, Obsidian/Neo4j exports
- Multi-language code parsing (Python, JS/TS, Go, Rust, Java, C/C++, C#, etc.)
- Custom language addition (no fork, .toml config)
- GitHub Action for risk-scored PR reviews (sticky comment)

---

## Three Layers of Value

| Layer | What it gives you |
|-------|-------------------|
| **Graph** | Persistent structural map (functions, classes, calls, imports, tests) — stored locally in SQLite |
| **MCP** | 30 tools exposed to AI assistants — blast radius, review context, semantic search, affected flows |
| **Action** | GitHub Action posts sticky PR comments with risk scores — fully local-first in CI |

---

## Headline Benchmarks

| Metric | Result |
|--------|--------|
| **Token reduction** | ~82x median per question (38x – 528x range) |
| **Impact F1** | 0.71 average against graph-derived ground truth (recall 1.0 is the upper bound, not "100% recall") |
| **Search latency** | 0.4 – 1.5 ms |
| **Incremental update** | < 2 seconds for a 2,900-file project |
| **Languages** | 30+ languages including Jupyter/Databricks notebooks |

---

## Quick Start

```bash
pip install code-review-graph        # or: pipx install code-review-graph
code-review-graph install            # auto-detects and configures all supported platforms
code-review-graph build              # parse your codebase
```

To target a specific platform:
```bash
code-review-graph install --platform codex
code-review-graph install --platform claude-code
code-review-graph install --platform cursor
code-review-graph install --platform copilot
```

Then ask your AI assistant:
```
Build the code review graph for this project
```

Initial build: ~10 seconds for a 500-file project. After that, hooks/watch mode keep the graph updated automatically.

---

## CLI Reference (Key Commands)

| Command | What it does |
|---------|--------------|
| `install` | Auto-detect and configure all platforms |
| `build` | Parse entire codebase |
| `update` | Incremental update (changed files only) |
| `watch` | Auto-update on file changes |
| `status` | Graph statistics |
| `visualize` | Generate interactive HTML graph (json/graphml/svg/obsidian/cypher) |
| `detect-changes --brief` | Risk panel + token savings (read-only) |
| `eval` | Run evaluation benchmarks |
| `serve` | Start MCP server |
| `wiki` | Generate markdown wiki from communities |

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
| `list_flows_tool` / `get_flow_tool` | Execution flows sorted by criticality |
| `get_architecture_overview_tool` | High-level architecture map |
| `get_hub_nodes_tool` | Most-connected nodes (hotspots) |
| `get_bridge_nodes_tool` | Architectural chokepoints |
| `get_knowledge_gaps_tool` | Untested hotspots, thin communities |
| `get_surprising_connections_tool` | Unexpected coupling |
| `get_suggested_questions_tool` | Auto-generated review questions |
| `refactor_tool` | Rename preview, dead code detection |
| `generate_wiki_tool` | Markdown wiki from communities |

Plus 12 more for: embeddings, docs sections, large functions, communities, repos, cross-repo search, and refactoring apply.

---

## Token Savings Panel

`detect-changes --brief` prints a compact panel:

```
┌─────────────────────── Token Savings ────────────────────────┐
│ Full context would be:     12,921 tokens                     │
│ Graph context used:           762 tokens                     │
│ Saved:                     12,159 tokens (~94%)              │
│ Breakdown: Functions 244 · Tests 191 · Risk 244 · Other 83   │
└──────────────────────────────────────────────────────────────┘
```

Same panel is attached to MCP responses as `context_savings` metadata.

---

## Built-in Skills (7)

The repo ships its own skill pack — invoke these directly:

| Skill | When |
|-------|------|
| `build-graph` | Build or rebuild the code graph |
| `review-delta` | Review only changes since last commit |
| `review-pr` | Full PR review with blast-radius analysis |
| `review-changes` | Review working-tree changes |
| `debug-issue` | Debug a specific issue using graph context |
| `explore-codebase` | Get high-level architecture overview |
| `refactor-safely` | Plan and verify refactor before applying |

Located at: `skills/build-graph/SKILL.md`, `skills/review-delta/SKILL.md`, etc.

---

## Multi-Platform MCP Setup

Auto-detects and configures: **Codex, Claude Code, CodeBuddy Code, Cursor, Windsurf, Zed, Continue, OpenCode, Antigravity, Gemini CLI, Qwen, Qoder, Kiro, GitHub Copilot**

Generate platform-specific config:
```bash
code-review-graph install --platform codex       # Codex only
code-review-graph install --platform cursor      # Cursor only
code-review-graph install --platform claude-code  # Claude Code only
code-review-graph install --platform gemini-cli   # Gemini CLI only
```

Requires **Python 3.10+**. Best experience with [uv](https://docs.astral.sh/uv/) — uses `uvx` when available.

---

## Multi-Repo Daemon

For editors without file hooks (Cursor, OpenCode), the daemon watches repos in the background:

```bash
crg-daemon add ~/project-a --alias proj-a
crg-daemon start
crg-daemon status              # health of all watchers
crg-daemon logs --repo proj-a -f  # tail logs
crg-daemon stop
```

Config at `~/.code-review-graph/watch.toml`. Health checks every 30s restart dead watchers.

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

Posts a single sticky comment with risk-scored functions, affected execution flows, and test gaps, updated in place on every push. Optional `fail-on-risk` input turns the review into a merge gate.

---

## Custom Languages

Add a new language via `.code-review-graph/languages.toml` — no fork, no code changes:

```toml
[languages.erlang]
extensions = [".erl"]
grammar = "erlang"
function_node_types = ["function_clause"]
class_node_types = ["record_decl"]
import_node_types = ["import_attribute"]
call_node_types = ["call"]
```

The generic tree-sitter walker handles extraction. Built-in languages cannot be overridden.

---

## Limitations & Honest Caveats

- **Impact "recall 1.0" is graph-derived and circular** — ground truth comes from the same graph edges the predictor walks; upper bound by construction.
- **Small single-file changes** — graph context can exceed naive reads for trivial edits (the overhead is the structural metadata that enables multi-file analysis).
- **Search quality (MRR 0.35)** — keyword search finds the right result in the top-4 for most queries, but ranking needs improvement.
- **Flow detection (33% recall)** — strongest for Python and PHP/Laravel. JavaScript and Go flow detection needs work.
- **Precision vs recall trade-off** — impact analysis is deliberately conservative; better to flag too many files than miss a broken dependency.

---

## CLI Optional Dependencies

```bash
pip install "code-review-graph[embeddings]"        # Local vector embeddings (sentence-transformers)
pip install "code-review-graph[google-embeddings]"  # Google Gemini embeddings
pip install "code-review-graph[communities]"        # Community detection (igraph)
pip install "code-review-graph[enrichment]"         # Python call-resolution enrichment (Jedi)
pip install "code-review-graph[eval]"               # Evaluation benchmarks (matplotlib)
pip install "code-review-graph[wiki]"               # Wiki generation with LLM summaries (ollama)
pip install "code-review-graph[all]"                # All optional dependencies
```

OpenAI-compatible endpoints (real OpenAI, Azure, or self-hosted vLLM/LiteLLM/LocalAI) need no extra install — just set `CRG_OPENAI_BASE_URL`, `CRG_OPENAI_API_KEY`, `CRG_OPENAI_MODEL`.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CRG_DATA_DIR` | Override graph databases directory | — |
| `CRG_EMBEDDING_MODEL` | Default embedding model | `all-MiniLM-L6-v2` |
| `CRG_MAX_IMPACT_NODES` | Max nodes in impact analysis | `500` |
| `CRG_MAX_IMPACT_DEPTH` | Blast-radius search depth | `2` |
| `CRG_TOOLS` | Comma-separated MCP tool allowlist | — |
| `GOOGLE_API_KEY` | Google Gemini embeddings key | — |
| `MINIMAX_API_KEY` | MiniMax embeddings key | — |
| `CRG_OPENAI_BASE_URL` | OpenAI-compatible embeddings endpoint | — |
| `CRG_OPENAI_API_KEY` | OpenAI-compatible embeddings key | — |
| `CRG_OPENAI_MODEL` | OpenAI embedding model name | — |
| `CRG_OPENAI_DIMENSION` | Pin embedding dimension | — |
| `NO_COLOR` | Disable ANSI colors | — |

---

## Integration with /one-mind

When `one-mind` is active, this skill activates automatically when the user asks about:
- Code review (delta, PR, working tree)
- Token-efficient context retrieval
- Impact analysis ("what does this change affect?")
- Architecture understanding
- Refactor planning

**Workflow pairing:**
1. `one-mind` enforces process discipline (TDD, brainstorming before coding)
2. `code-review-graph` provides token-efficient context (38x–528x reduction)
3. Together: catch the right issues with minimal context cost

---

## Repo Location

`~/.opencode/skills/code-review-graph/`

Full source at: https://github.com/tirth8205/code-review-graph

---

**One-liner:** Build the graph once, query forever — 38x–528x fewer tokens per review.
