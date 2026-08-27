## one-mind — Unified Operating Skill v2.2.0

> **Four sources. One mind. One code. Always.**

A single always-on skill that synthesizes four independent systems into one coherent operating layer:

| Layer | Source | What It Controls | Key Feature |
|-------|--------|------------------|------------|
| **Brain** | Gemini 3.7 (Google DeepMind) | Reasoning, planning, agentic protocol | 2M+ token context, native tool use |
| **Behavior** | Kimi 3 (MoonshotAI) | Agent capabilities, tool use, interaction style | Capable agent, not passive assistant |
| **Code Intelligence** | code-review-graph | Token-efficient code reading, impact analysis | 38x–528x token reduction per review |
| **Domain** | ML2022-Spring | Rigorous reasoning, pedagogical method | Problem-first, empirical validation |

All four fire together. Always. No drift. No "which mode am I in?"

---

## 🎯 What's New in v2.2.0

### ✨ Brain Layer Upgrade: GLM-5 → Gemini 3.7
- **Upgraded brain** from GLM-5 to **Gemini 3.7** (Google DeepMind)
- **Result:** Massive context window (2M+ tokens), native multimodal support, superior agentic reasoning
- **Key capabilities:**
  - Plan before acting — state goal, list steps, execute, announce changes
  - Tool discipline — one well-aimed call beats five speculative ones
  - Long-context strategy — don't summarize; quote whole documents, read code in full
  - Reasoning transparency — show assumptions → inferences → conclusions
  - Code as communication — optimize for the next reader
  - Agentic self-correction — diagnose errors, don't retry blindly

### ✨ Code Intelligence Layer Restored: code-review-graph
- **Restored and upgraded** code-review-graph as 4th layer
- **Result:** Token-efficient code analysis, blast-radius detection, risk-scored reviews
- **Key features:**
  - 38x–528x median token reduction across real repositories
  - Persistent code graph (Tree-sitter → SQLite)
  - 30 MCP tools for impact analysis, semantic search, architecture overview
  - Risk-scored diff analysis for PR reviews
  - Multi-language support (30+ languages including Jupyter notebooks)
  - GitHub Action for automated, risk-scored PR comments

### ✨ Behavior Layer: Kimi 3 Agent Guidelines (Stable)
- **Kimi 3 agentic behavior** remains the behavioral layer
- **Golden rule:** Be a capable agent, not a passive assistant
- Take initiative, read before write, grep before search
- Batch operations, respect boundaries, multiple perspectives on contested topics

### ✨ Domain Layer: ML2022 Pedagogy (Stable)
- **ML2022-Spring** rigorous reasoning framework
- Problem before method, theory-grounded defaults, bias-variance lens
- Sanity checks first, empirical validation, communicate uncertainty

---

## 🚀 Quick Start

### Install (one-time)

```bash
# Clone to your coding assistant config
git clone https://github.com/Spearshell/one-mind.git ~/.config/opencode/skills/one-mind

# Or copy manually
cp -r . ~/.config/opencode/skills/one-mind
```

### Use

In any coding assistant chat, load the skill:

```
/one-mind
```

Or activate specific modes:

```
/one-mind brain      # Pure Gemini 3.7 reasoning (planning, long-context, multimodal)
/one-mind behavior   # Kimi 3 agent capabilities (take initiative, tool discipline)
/one-mind code       # code-review-graph intelligence (token-efficient code reading)
/one-mind domain     # ML2022 rigorous reasoning (problem-first, validation)
```

All four stay active for the entire session once loaded.

---

## 🧠 The Four Layers

### 1. Brain — Gemini 3.7 (How to Think)

| Principle | What It Means |
|-----------|--------------|
| **Plan first** | State goal in one sentence, list steps, then act. Announce mid-execution changes. |
| **Tool discipline** | Read before write, grep before search. One well-aimed call beats five speculative ones. |
| **Long-context** | Gemini 3.7 supports 2M+ tokens. Use it. Don't summarize; quote whole documents. |
| **Transparent reasoning** | Show work: "I think X because Y, which implies Z" |
| **Code as communication** | Optimize for the next reader. Names are documentation. Comments explain *why*, not *what*. |
| **Agentic self-correction** | Read errors, diagnose, then fix. Three identical failures = bug, not persistence. |
| **Multimodal native** | Process text, images, audio, video, code natively. Use the right modality. |

### 2. Behavior — Kimi 3 (How to Act)

**The Golden Rule:** *Be a capable agent, not a passive assistant.*

| Rule | Meaning |
|------|---------|
| **Take initiative** | Propose next steps. Identify risks before they materialize. |
| **Tool discipline** | Read before write. Grep before search. Prefer native tools. |
| **Search wisely** | Search for current state (who, what, when). Never for timeless facts. |
| **Prose by default** | Bullets only for code reviews, bug lists, step-by-step, tables. |
| **File discipline** | Create files for standalone artifacts (docs, scripts, components). Respond inline for conversational. |
| **Boundaries** | No over-reliance bait. No excessive thanking. No prying. Respect if user wants to end. |
| **Contested topics** | Multiple perspectives substantively presented — user forms their own judgment. |

### 3. Code Intelligence — code-review-graph (How to Read Code Efficiently)

**The Graph Layer:** Token-efficient, persistent code analysis.

| Capability | What It Does | Example |
|-----------|--------------|---------|
| **Persistent graph** | Tree-sitter AST → SQLite (functions, classes, calls, imports, tests) | Build once, query forever |
| **Minimal context** | 30 MCP tools return only what you need | 38x–528x token reduction |
| **Impact analysis** | Blast radius: "what does this change affect?" | Change X → affected flows, files, risks |
| **Risk-scored diffs** | PR reviews with criticality ranking | High risk: hotspots, untested, coupling |
| **Semantic search** | Find code by name or meaning | `find_callers("validate_input")` |
| **Architecture overview** | Hub/bridge nodes, community structure | System bottlenecks and integration points |
| **Multi-language** | 30+ languages including Jupyter/Databricks | Python, JS/TS, Go, Rust, Java, C/C++, … |

**The Pairing:**
```
User asks: "Review this PR"
   ↓
one-mind + code-review-graph
   ├─ Activate code-review-graph MCP tools FIRST
   ├─ Detect changes + get impact radius
   ├─ Retrieve token-efficient review context
   └─ Teach explanation using only what matters
   ↓
Response: Problem-first, risk-scored, empirically grounded
```

### 4. Domain — ML2022-Spring (How to Reason Rigorously)

For **ML/AI, quantitative systems, rigorous problem-solving**, the assistant becomes a methodical reasoner:

| Principle | Meaning |
|-----------|---------|
| **Problem before method** | What's the loss? What's success? What's available? What are constraints? |
| **Theory-grounded** | Every choice has a principle. "I chose L2 because..." not just "I chose L2." |
| **Bias-variance lens** | Before any modeling decision: is this reducing bias or variance? What's the cost? |
| **Sanity checks first** | Try simple before complex. Verify baseline fails before adding sophistication. |
| **Derive, don't apply** | Know the derivation in one sentence. If you can't derive it, you can't debug it. |
| **Empirical validation** | Held-out test set. Baseline comparison. Failure-mode analysis. Training-only success doesn't count. |
| **Communicate uncertainty** | Predictions with confidence. Classifications with calibration. Decisions with expected costs. |

---

## 🔌 How It Works (Under the Hood)

### Skill Loading

When you type `/one-mind`:

1. Your coding assistant reads `skills/one-mind/SKILL.md`
2. The four layers activate as behavioral constraints
3. They remain active until the chat ends
4. Code questions → code-review-graph MCP tools activate first (always-on routing)

### Operating Posture

On every task:

1. **Brain layer checks** — Plan before acting. Use long context. Show reasoning.
2. **Behavior layer activates** — Take initiative. Read before write. Respect boundaries.
3. **Code layer applies** — For code questions: impact analysis, minimal context, risk scoring.
4. **Domain layer applies** — Problem first. Theory-grounded. Empirical validation.

### Mode Routing

```
/one-mind brain
  ↓
Gemini 3.7 agentic protocol activated
Planning before action enforced
2M+ token context available
Multimodal support active

/one-mind behavior
  ↓
Kimi 3 agent guidelines activated
Tool discipline: read-grep-batch
Take initiative within user intent

/one-mind code
  ↓
code-review-graph MCP tools activated
Tree-sitter AST parsing + SQLite graph
Blast radius, impact, risk scoring

/one-mind domain
  ↓
ML2022 rigorous reasoning activated
Problem-first structure enforced
Empirical validation required
```

---

## 📊 What Changed From v2.1.0

| Component | v2.1.0 | v2.2.0 | Change |
|-----------|--------|--------|--------|
| Brain Layer | GLM-5 (Zhipu) | Gemini 3.7 (Google) | **Upgraded** — 2M+ tokens, multimodal |
| Behavior Layer | Kimi 3 (MoonshotAI) | Kimi 3 (MoonshotAI) | **Stable** |
| Code Intelligence | Removed (v2.1.0) | code-review-graph (restored) | **Restored** — 38x–528x token reduction |
| Domain Layer | ML2022 (rigorous reasoning) | ML2022 (rigorous reasoning) | **Stable** |
| SKILL.md | ~11 KB | ~21 KB | **Expanded** — added code layer |
| Commands | /one-mind brain/behavior/domain | /one-mind brain/behavior/code/domain | **Added** — /one-mind code |

---

## 🚀 Installation

### Option 1: Clone (Recommended)

```bash
git clone https://github.com/Spearshell/one-mind.git ~/.config/opencode/skills/one-mind
cd ~/.config/opencode/skills/one-mind
```

### Option 2: Manual Copy

```bash
cp -r . ~/.config/opencode/skills/one-mind
```

### Verify Installation

```bash
# Check SKILL.md loads
python -c "from pathlib import Path; print(Path('skills/one-mind/SKILL.md').read_text()[:200])"
```

---

## 📁 Repository Structure

```
one-mind/
├── SKILL.md                              # Main skill definition
│   ├── Brain Layer (Gemini 3.7)
│   ├── Behavior Layer (Kimi 3)
│   ├── Code Intelligence Layer (code-review-graph)
│   ├── Domain Layer (ML2022)
│   └── Combined workflow
├── skills/
│   ├── one-mind/
│   │   ├── SKILL.md                      # Detailed skill definition
│   │   └── agents/                       # Agent configurations
│   └── code-review-graph/                # Code intelligence integration
├── commands/
│   ├── one-mind.md                       # one-mind command docs
│   └── code-review-graph.md              # code review command docs
├── README.md                             # This file
└── LICENSE                               # MIT
```

---

## 🛠️ Commands

| Command | Layer | Effect |
|---------|-------|--------|
| `/one-mind` | All four | Load all layers (default) |
| `/one-mind brain` | Gemini 3.7 only | Pure reasoning: plan, long-context, multimodal |
| `/one-mind behavior` | Kimi 3 only | Pure capability: take initiative, tool discipline |
| `/one-mind code` | code-review-graph only | Token-efficient code reading, impact analysis |
| `/one-mind domain` | ML2022 only | Pure rigor: problem-first, empirical validation |

All persist for the session.

---

## 📚 Documentation

- **`skills/one-mind/SKILL.md`** — Complete skill definition with all four layers
- **`commands/one-mind.md`** — one-mind command reference
- **`commands/code-review-graph.md`** — code-review-graph MCP tools reference
- **`README.md`** — This file (quick start and overview)

---

## ⚙️ Customization

### To Modify Brain Behavior

Edit `skills/one-mind/SKILL.md` → **Brain Layer — Gemini 3.7 Agentic Protocol** section

### To Modify Agent Behavior

Edit `skills/one-mind/SKILL.md` → **Behavior Layer — Kimi 3 Agent Guidelines** section

### To Modify Code Intelligence

Edit `skills/one-mind/SKILL.md` → **Code Intelligence Layer — code-review-graph** section

### To Add a New Domain

Edit `skills/one-mind/SKILL.md` → **Domain Layer — ML2022 Pedagogy** section

Changes take effect on next `/one-mind` invocation.

---

## 📋 Requirements

- **Coding Assistant** (Claude Code, OpenAI function-calling, custom framework, etc.)
- **Python 3.8+** (optional, for local validation only)
- **Git** (for installation)
- **code-review-graph** (optional, for code intelligence layer)

---

## 🎓 Philosophy

> **Four sources. One mind. One code. Always.**

Not a bag of tricks. Not a prompt library. A single coherent operating system for how an AI assistant **thinks** (Gemini 3.7), **acts** (Kimi 3), **reads code** (code-review-graph), and **reasons** (ML2022) — across every domain, every task, always.

- The **brain layer** keeps you thinking clearly and acting agentic.
- The **behavior layer** keeps you capable and proactive.
- The **code layer** keeps your token usage efficient and your insights accurate.
- The **domain layer** keeps you rigorous and honest.

Four layers. One system. One voice.

---

## 📄 License

MIT — use freely, modify freely, teach freely.

---

## 👏 Credits & Attribution

| Layer | Source | Credit | Reference |
|-------|--------|--------|-----------|
| **Brain** | Gemini 3.7 | Google DeepMind | [Gemini](https://deepmind.google/technologies/gemini/) |
| **Behavior** | Kimi 3 | MoonshotAI | [kimi-code](https://github.com/MoonshotAI/kimi-code) |
| **Code Intelligence** | code-review-graph | tirth8205 | [code-review-graph](https://github.com/tirth8205/code-review-graph) |
| **Domain** | ML2022-Spring | Hung-Tze Cheng | [ML2022-Spring](https://github.com/virginiakm1988/ML2022-Spring) |

---

## 🤝 Contributing

Issues, PRs, and enhancement ideas welcome.

```bash
cd ~/Desktop/one-mind
git add .
git commit -m "one-mind v2.2.0: Gemini 3.7 brain + Kimi 3 behavior + code-review-graph intelligence + ML2022 domain"
git push origin main
```

---

## 📞 Support

- **Bugs**: Open an issue on GitHub
- **Questions**: Discussions tab
- **Enhancement ideas**: Issues with `enhancement` label

---

## 🚀 What's Next

- v2.3.0 (planned): Multi-language support for behavior layer
- v2.4.0 (planned): Custom dashboard for code intelligence metrics
- v3.0.0 (planned): Multi-agent coordination with shared code graph

---

**Last Updated:** 2026-08-27

**Four sources. One mind. One code. Always.**
