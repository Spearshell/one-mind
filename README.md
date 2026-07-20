## one-mind — Unified Operating Skill v2.0.0

> **Four sources. One mind. One code. Always.**

A single always-on skill that synthesizes four independent systems into one coherent operating layer:

| Layer | Source | What It Controls | Token Reduction |
|-------|--------|------------------|-----------------|
| **Behavior** | Fable 5 | Tone, formatting, search, file creation, boundaries | — |
| **Process** | Superpowers | Skill-invocation discipline, TDD, debugging, verification | — |
| **Teacher** | Hung-Yi Lee | Problem → intuition → limit → method → punchline (ML/AI/Quant) | — |
| **Code Intelligence** | code-review-graph | Blast radius, minimal context, affected flows, 30 MCP tools | **38x–528x** |

All four layers fire together. No drift. No "which mode am I in?"

---

## 🎯 What's New in v2.0.0

### ✨ Four-Layer Architecture
- **SKILL.md**: Expanded from 19.8KB → 31.9KB (+61%)
  - User Input / focus routing (`$ARGUMENTS`)
  - WHAT/WHY/HOW structure
  - Reference Files section
  - Output Format Standards
  - Anti-Patterns & Validation Checklist
  - 12-Layer Stack diagnostic
  - Action Space discipline

### ✨ code-review-graph Integration (NEW)
- **Token reduction:** ~82x median per question (38x–528x range)
- **30 MCP tools** for code context retrieval
- **Blast-radius analysis** — what does this change affect?
- **Risk-scored diffs** for PR reviews
- **Multi-language support** — 30+ languages with Tree-sitter
- Always invoked FIRST on code questions (no Grep/Read before graph)

### ✨ Command Upgrade
- `commands/one-mind.md`: Expanded 4.7KB → 9.8KB (+108%)
- Focus routing via `$ARGUMENTS`: `identity | format | process | graph | teach | debug`
- Activation flow spelled out
- Reference files linked

### ✨ Skills Repo Added
- `skills/code-review-graph/` — ~700 files, full integration
- Wrapper `SKILL.md` (301 lines)
- MCP tool reference
- GitHub Action for CI/CD

---

## 🚀 Quick Start

### Install (one-time)

```bash
# Clone to your OpenCode config
git clone https://github.com/Spearshell/one-mind.git ~/.config/opencode/skills/one-mind

# Or copy manually
cp -r . ~/.config/opencode/skills/one-mind
```

### Use

In any OpenCode chat, type:

```
/one-mind
```

Or with focus routing:

```
/one-mind teach           # Activate Hung-Yi Lee teaching mode
/one-mind graph           # Activate code-review-graph intelligence
/one-mind debug           # Activate systematic debugging mode
/one-mind process         # Activate Superpowers process discipline
```

That's it. All four layers load and stay active for the entire session.

---

## 🧠 The Four Layers

### 1. Behavior — Fable 5 (How to Talk)

| Rule | What It Means |
|------|---------------|
| **Identity** | "I'm an AI, I search for current info, I don't guess platform details" |
| **Knowledge cutoff** | Not a disclaimer — search when recency matters |
| **Mistakes** | Own them, fix them, one sentence acknowledgment |
| **Contested topics** | Substantive answers, multiple perspectives, no verdicts |
| **Tone** | Warm, adult-to-adult, no profanity unless user does |
| **Formatting** | Prose by default; bullets only for code reviews, bug lists, step-by-step, tables |
| **Boundaries** | No over-reliance bait, no prying, reflect don't diagnose |
| **Search** | 1–6 words, start broad, strategic tool scaling, fetch URLs directly |
| **Files** | Standalone artifact → file; conversational answer → inline |

### 2. Process — Superpowers (How to Act)

**The Golden Rule:** *Check skills BEFORE any action. Even 1% chance → invoke.*

```
User: "Let's build X"
Assistant: [checks skills] → "Using brainstorming to explore..." 
  → [brainstorms] → "Using test-driven-development to implement..." 
  → [TDD cycle]
```

**Skill Priority:**
1. **Process skills first** — brainstorming, systematic-debugging, verification-before-completion
2. **Implementation skills second** — domain expertise, code patterns

**Workflow Defaults:**
- New feature → brainstorming → TDD
- Bug → systematic-debugging → domain skill
- Code change → TDD (red-green-refactor)
- PR ready → requesting-code-review
- Branch done → finishing-a-development-branch

**Red Flags (stop and re-check):**
- "This is just a simple question"
- "I'll just do this one thing first"
- "The skill is overkill"
- "I know what that means"

### 3. Teacher — Hung-Yi Lee (How to Teach Everything)

For **ML/AI, quantitative trading, systems**, the assistant becomes a teacher. Three non-negotiable rules:

| Rule | Meaning |
|------|---------|
| **Weave the thread** | Never list papers/methods/strategies one by one. Each connects to the next; the student sees the evolution. |
| **Punchline required** | Every explanation has one load-bearing core the student remembers. The punchline IS the core. |
| **Problem before method** | Pose the problem first. Start from intuitive approach → show where it fails → build up to the method. Student learns *how it was invented*. |

**Structure every explanation:**
1. **Roadmap first** — "Here's where we're going"
2. **Intuition before math** — Build the picture, then open the mechanism
3. **Black-box framing** — What it does, inputs, outputs, before how
4. **Anticipate confusion** — Address the question before they ask
5. **Practical debugging** — What to watch when it fails

**Style:**
- Short sentences. Bursts, not compound academic sentences.
- Concrete narrative analogies with specific details.
- Plain language first, jargon only when earned (explain `token`, `loss`, `Sharpe`, `drawdown` inline).
- Warmth with constructive pushback. No condescension.

**Voice persistence:** Once teaching mode activates, it stays on for the entire response. No regression to analyst prose.

### 4. Code Intelligence — code-review-graph (How to Read Code Efficiently)

When **ANY code question** arrives, the graph is invoked FIRST.

**Token Savings Benchmark:**
- ~82x median reduction (range: 38x–528x)
- Blast-radius analysis in < 2 seconds
- 30 MCP tools for context retrieval
- Incremental updates < 2 seconds on 2,900-file repos

**When to Force the Graph:**
```
Code review         → detect_changes_tool + get_review_context_tool
"What does this affect?"  → get_impact_radius_tool
"Who calls X?"      → query_graph_tool(pattern="callers_of")
Architecture        → get_architecture_overview_tool + list_communities_tool
Refactor planning   → refactor_tool (rename preview, dead code)
Token-heavy reads   → get_minimal_context_tool first
```

**Multi-Language Support:**
Python, JavaScript/TypeScript, Go, Rust, Java, C/C++, C#, Ruby, PHP, Kotlin, Swift, Scala, Solidity, Dart, Elixir, Haskell, Clojure, Groovy, Lua, Perl, R, Shell, SQL, YAML, Dockerfile, TOML, JSON, XML, CSS, SCSS, Vue, Angular, JSX/TSX, and more.

**GitHub Action (CI/CD):**
```yaml
- uses: tirth8205/code-review-graph@v2.3.6
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```
Posts sticky PR comments with risk scores, affected flows, test gaps — fully local-first.

---

## 📊 Quantitative Trading Integration (OPAItrade)

`one-mind` includes full **OPAItrade** integration — a complete quant workflow taught through Hung-Yi Lee's method.

### What You Get

| Pillar | Content |
|--------|---------|
| **Free Data** | yfinance, CCXT, AkShare, Baostock, OpenBB adapters + bundled CSVs (SPY, BTC, ETH, GLD, QQQ, TLT, IWM, HSI, Tencent) |
| **Free Strategies** | 20+ across 5 categories: Arbitrage, Factor, Mean Reversion, Momentum, Trend |
| **Free Workflow** | Backtest engine → parameter optimizer → strategy packs (YAML+README) → live trading notes |

### Teaching Quant the Hung-Yi Lee Way

Every strategy taught as an evolutionary thread:

```
Mean Reversion
  ├── Problem: "Price always reverts... right?" (intuitive but dangerous)
  ├── Naive: Buy when RSI < 30 → fails in trends
  ├── Bollinger: Statistical bands → better but whipsaws
  ├── Z-Score: Cross-sectional → works for pairs
  └── Punchline: "Mean reversion isn't a law — it's a bet on stationarity. 
                   The backtest tells you if the bet held; the live market 
                   tells you if it still holds."
```

**Strategy Catalog (taught as evolution, not list):**

| Category | Strategies | Core Problem |
|----------|------------|--------------|
| **Mean Reversion** | Bollinger, RSI Reversal, Z-Score | Price deviates from fair value |
| **Momentum** | Dual Momentum, Low-Vol Momentum, Sector Rotation, Top-N | Winners keep winning... until they don't |
| **Trend** | ATR Trailing Stop, Donchian Breakout, SMA Crossover, Triple MA | Trend is your friend... until the bend |
| **Factor** | Multi-Factor, Quality, Size, Value | Systematic risk premia, not stock picking |
| **Arbitrage** | Basis, Basket StatArb, ETF Premium, Funding Rate, Pairs | Risk-free-ish profit from mispricing |

### Quickstart Commands

Run from OpenAITrade repo root:

```bash
# 1. Install
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

```bash
# 2. Load bundled data
python -c "from pathlib import Path; import pandas as pd; \
df=pd.read_csv(Path('data/market_data/spy.csv')); \
print(df.head(5).to_string(index=False))"
```

```bash
# 3. List all strategies
python -c "from openaitrade.strategies.factory import STRATEGIES; \
[print(f'{sid:24s} {cls.category:18s} {cls.name}') \
for sid, cls in STRATEGIES.items()]"
```

```bash
# 4. Run quickstart backtest
python examples/quickstart.py
```

```bash
# 5. Validate skill flow
python -m pytest -q tests/test_skill_installation.py
```

---

## 📁 Repository Structure

```
one-mind/
├── SKILL.md                              # Main skill definition (31.9 KB)
│   ├── Four Layers (Behavior, Process, Teacher, Code Intelligence)
│   ├── User Input / $ARGUMENTS routing
│   ├── 12-Layer Stack diagnostic
│   ├── Verification Contract
│   └── Anti-Patterns & Validation Checklist
├── commands/
│   └── one-mind.md                       # Slash command entry point (9.8 KB)
│       ├── Focus routing ($ARGUMENTS)
│       ├── Activation flow
│       └── Reference files
├── skills/
│   ├── one-mind/
│   │   └── SKILL.md
│   └── code-review-graph/                # NEW (700+ files)
│       ├── SKILL.md (301 lines)
│       ├── 30 MCP tools
│       ├── GitHub Action
│       └── Multi-language support
├── hung-yi-lee-skill/
│   ├── SKILL.md
│   ├── wiki/
│   │   ├── index.md
│   │   ├── topic-map.md
│   │   ├── query-playbook.md
│   │   ├── topics/
│   │   ├── series/
│   │   └── graph/
│   ├── raw/youtube/
│   ├── references/
│   └── scripts/
├── superpowers/
│   ├── README.md
│   ├── skills/
│   └── docs/
└── README.md                             # This file (UPGRADED)
```

---

## 🔌 How It Works (Under the Hood)

### Skill Loading

When you type `/one-mind`:

1. OpenCode reads `commands/one-mind.md`
2. The command injects the full `SKILL.md` content into the session
3. The four layers become active behavioral constraints
4. They remain active until the chat ends

### Focus Routing

```
/one-mind teach
  ↓
Hung-Yi Lee teaching mode activated (ML/AI/Quant questions only)
Problem-first structure enforced
Voice persistence for entire response

/one-mind graph
  ↓
code-review-graph layer activated
No Grep/Read before graph MCP tools
Blast-radius analysis + context savings panel

/one-mind debug
  ↓
Systematic-debugging + code-review-graph skills
4-phase root-cause process
Evidence-first verification
```

### Auto-Activation (Optional)

For true always-on behavior, add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["~/.config/opencode/node_modules/one-mind"]
}
```

Then create a minimal plugin that injects the skill into the first user message of every session.

### Skill Invocation Protocol

The skill enforces a strict protocol:

1. **Check** — Does any skill apply? (even 1%)
2. **Invoke** — Load via skill tool BEFORE responding
3. **Announce** — "Using [skill] to [purpose]"
4. **Follow** — Execute exactly as the skill prescribes

This prevents the "I'll just do this quick thing" anti-pattern.

---

## 🛠️ Commands

| Command | What It Does |
|---------|--------------|
| `/one-mind` | Load unified skill (all 4 layers, balanced) |
| `/one-mind identity` | Focus on behavioral/tone layer |
| `/one-mind format` | Focus on formatting layer |
| `/one-mind process` | Focus on Superpowers process discipline |
| `/one-mind graph` | Focus on code-review-graph intelligence |
| `/one-mind teach` | Focus on Hung-Yi Lee teaching mode |
| `/one-mind debug` | Focus on systematic debugging (graph + process) |

All persist for the session. `/one-mind` is the canonical entry point.

---

## 📈 What Changed From v1.5.0

| Component | v1.5.0 | v2.0.0 | Change |
|-----------|--------|--------|--------|
| SKILL.md | 19.8 KB | 31.9 KB | +61% (added User Input, 12-Layer Stack, validation) |
| commands/one-mind.md | 4.7 KB | 9.8 KB | +108% (added focus routing, reference files) |
| code-review-graph | Not bundled | 700+ files | NEW — 38x–528x token reduction |
| Quant Teaching | OPAItrade subset | Full integration | Upgraded (5-module curriculum) |
| Verification Contract | Basic | Detailed | Anti-patterns + validation checklist |

---

## 🚀 Installation

### Option 1: Clone (Recommended)

```bash
git clone https://github.com/Spearshell/one-mind.git ~/.config/opencode/skills/one-mind
cd ~/.config/opencode/skills/one-mind
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # if present
```

### Option 2: Manual Copy

```bash
cp -r . ~/.config/opencode/skills/one-mind
```

### Option 3: For Code-Review-Graph Users

```bash
pip install code-review-graph
code-review-graph install  # auto-detects and configures all platforms
code-review-graph build    # parse your codebase
```

---

## 📚 Documentation

### Core Skills
- **`hung-yi-lee-skill/SKILL.md`** — 758 lines, teaching DNA + first-person calibration
- **`skills/one-mind/SKILL.md`** — 725 lines, four-layer architecture
- **`skills/code-review-graph/SKILL.md`** — 301 lines, MCP tools reference
- **`superpowers/`** — Complete TDD/debugging/process methodology

### References
- **`hung-yi-lee-skill/references/persona.md`** — Teaching style definition
- **`hung-yi-lee-skill/references/spirit.md`** — Teaching philosophy
- **`hung-yi-lee-skill/references/work.md`** — Technical scope
- **`hung-yi-lee-skill/wiki/`** — Knowledge graph (916 nodes, 3,664 edges)

### Commands
- **`commands/one-mind.md`** — Main entry point
- **`commands/` (other)** — Quant, debug, graph subcommands (if present)

---

## 🧪 Validation

Run these commands to verify installation:

```bash
# Check SKILL.md loads
python -c "from pathlib import Path; print(Path('skills/one-mind/SKILL.md').read_text()[:200])"

# Check code-review-graph MCP tools are registered
code-review-graph status

# Check hung-yi-lee knowledge graph
python hung-yi-lee-skill/scripts/hungyi_kb.py graph report

# Validate quant workflow
python -c "from openaitrade.strategies.factory import STRATEGIES; print(f'{len(STRATEGIES)} strategies loaded')"
```

---

## ⚙️ Customization

### Adding New Domains

To teach a new domain through Hung-Yi Lee's method:

1. Identify the **core problems** the domain solves
2. Map the **intuitive approaches** students reach for first
3. Show where each **hits its limit**
4. Build the **method** as the natural evolution
5. Extract the **punchline** — the one thing they remember
6. Add **practical debugging** — what breaks in practice

### Modifying Behavior

Edit `skills/one-mind/SKILL.md`:

- **Behavior layer** → Fable 5 section
- **Process layer** → Superpowers section
- **Teacher layer** → Hung-Yi Lee section
- **Graph layer** → code-review-graph section

Changes take effect on next `/one-mind` invocation.

---

## 📋 Requirements

- **OpenCode** (tested with v0.3+)
- **Python 3.10+** (for OPAItrade quant workflow + code-review-graph)
- **Git** (for installation)

Optional for quant workflow:
- `pandas`, `numpy`, `scipy` (installed via `pip install -e ".[dev]"`)

Optional for code-review-graph:
- `sentence-transformers` (local embeddings)
- `igraph` (community detection)
- `jedi` (Python call resolution)

---

## 🎓 Philosophy

> **One mind. One code. Always.**

Not a bag of tricks. Not a prompt library. A single coherent operating system for how an AI assistant thinks, acts, and teaches — across every domain, every chat, every time.

- The **behavior layer** keeps you honest.
- The **process layer** keeps you rigorous.
- The **teacher layer** keeps you growing.
- The **code intelligence layer** keeps you efficient.

Four layers. One system. One voice.

---

## 📄 License

MIT — use freely, modify freely, teach freely.

---

## 👏 Credits & Attribution

| Layer | Source | Credit | Version |
|-------|--------|--------|---------|
| **Behavior** | Fable 5 | Anthropic | Claude family guidelines |
| **Process** | Superpowers | Jesse Vincent (obra) | TDD + debugging methodology |
| **Teacher** | Hung-Yi Lee | 李宏毅老師 + interviews | ML/AI teaching (台大, distilled with permission) |
| **Graph** | code-review-graph | Tirth Patel (tirth8205) | Tree-sitter + MCP integration |
| **Quant** | OPAItrade | OpenAITrade community | Backtest + factor methodology |
| **Architecture** | ECC | affaan-m | 12-Layer Stack diagnostic |
| **Structure** | claude-howto | luongnv89 | Skill structure patterns |

---

## 🤝 Contributing

Issues, PRs, and "how would Hung-Yi Lee teach X?" questions welcome.

**To push to your GitHub:**

```bash
cd ~/Desktop/one-mind
git init
git add .
git commit -m "one-mind v2.0.0: 4-layer unified system + code-review-graph + verification contract"
git remote add origin https://github.com/<your-username>/one-mind.git
git push -u origin main
```

Then share the repo URL — anyone can install with one clone.

---

## 📞 Support

- **Bugs**: Open an issue on GitHub
- **Questions**: Discussions tab
- **"How would Hung-Yi Lee teach X?"**: Definitely ask — that's what this is for
- **Code-review-graph issues**: See [tirth8205/code-review-graph](https://github.com/tirth8205/code-review-graph)

---

## 🚀 What's Next

- v2.1.0 (planned): Multi-modal support (images, audio, video)
- v2.2.0 (planned): Custom language support for code-review-graph
- v2.3.0 (planned): Live trading integration checkpoint (paper → small capital)
- v3.0.0 (planned): Agent federation (multiple `one-mind` instances coordinating)

---

**Last Updated:** 2026-07-20

**One mind. One code. Always.**
