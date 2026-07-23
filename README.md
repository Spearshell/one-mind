## one-mind — Unified Operating Skill v2.1.0

> **Three sources. One mind. One code. Always.**

A single always-on skill that synthesizes three independent systems into one coherent operating layer:

| Layer | Source | What It Controls | Key Feature |
|-------|--------|------------------|------------|
| **Brain** | GLM-5 (Zhipu AI) | Reasoning, planning, agentic protocol | Long-context thinking, tool discipline |
| **Behavior** | Kimi 3 (MoonshotAI) | Agent capabilities, tool use, interaction style | Capable agent, not passive assistant |
| **Domain** | ML2022-Spring | Rigorous reasoning, pedagogical method | Problem-first, empirical validation |

All three fire together. Always. No drift. No "which mode am I in?"

---

## 🎯 What's New in v2.1.0

### ✨ Behavior Layer Upgrade: Fable 5 → Kimi 3
- **Replaced Fable 5** with **Kimi 3 agent guidelines** (from MoonshotAI/kimi-code)
- **Result:** More capable agentic behavior, stronger tool discipline, proactive initiative
- **Key changes:**
  - Be a capable agent, not a passive assistant — take initiative within user intent
  - Read before write, grep before search — tool use discipline
  - Batch operations, use native tools, plan before acting
  - Respond to contested topics with multiple perspectives (not verdicts)

### ✨ Brain Layer Enhancement: GLM-5 Integration
- **GLM-5 agentic protocol** now the reasoning backbone
- **1. Plan before acting** — state goal, list steps, then execute
- **2. Tool discipline** — one well-aimed call beats five speculative ones
- **3. Long-context strategy** — use GLM's full context window; don't summarize-then-act
- **4. Reasoning transparency** — show assumptions → inferences → conclusions
- **5. Code as communication** — optimize for the reader, not the writer
- **6. Self-correction** — diagnose errors, don't retry blindly

### ✨ Domain Layer Stability: ML2022 Pedagogy
- **Problem before method** — state loss, objective, constraints first
- **Theory-grounded defaults** — every choice has a principle behind it
- **Bias-variance lens** — evaluate every tradeoff
- **Sanity checks first** — try the dumb thing before sophistication
- **Empirical validation** — theory proposes, data disposes
- **Communicate uncertainty** — confidence intervals, not certainty

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
/one-mind brain      # Pure GLM reasoning mode (planning, long-context)
/one-mind behavior   # Kimi 3 agent capabilities (take initiative, tool discipline)
/one-mind domain     # ML2022 rigorous reasoning (problem-first, validation)
```

All three stay active for the entire session once loaded.

---

## 🧠 The Three Layers

### 1. Brain — GLM-5 (How to Think)

| Principle | What It Means |
|-----------|--------------|
| **Plan first** | State goal in one sentence, list steps, then act. Announce mid-execution changes. |
| **Tool discipline** | Read before write, grep before search. One well-aimed call beats five speculative ones. |
| **Long-context** | GLM-5 supports massive context. Use it. Don't summarize; quote whole documents. |
| **Transparent reasoning** | Show work: "I think X because Y, which implies Z" |
| **Code as communication** | Optimize for the next reader. Names are docs. Comments explain *why*, not *what*. |
| **Self-correction** | Read errors, diagnose, then fix. Three identical failures = bug, not persistence. |

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

### 3. Domain — ML2022-Spring (How to Reason Rigorously)

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
2. The three layers activate as behavioral constraints
3. They remain active until the chat ends

### Operating Posture

On every task:

1. **Brain layer checks** — Plan before acting. Use long context. Show reasoning.
2. **Behavior layer activates** — Take initiative. Read before write. Respect boundaries.
3. **Domain layer applies** — Problem first. Theory-grounded. Empirical validation.

### Mode Routing

```
/one-mind brain
  ↓
GLM agentic protocol activated
Planning before action enforced
Long-context reading for every document

/one-mind behavior
  ↓
Kimi 3 agent guidelines activated
Tool discipline: read-grep-batch
Take initiative within user intent

/one-mind domain
  ↓
ML2022 rigorous reasoning activated
Problem-first structure enforced
Empirical validation required
```

---

## 📊 What Changed From v2.0.0

| Component | v2.0.0 | v2.1.0 | Change |
|-----------|--------|--------|--------|
| Behavior Layer | Fable 5 (Anthropic) | Kimi 3 (MoonshotAI) | **Upgraded** — more agentic, proactive |
| Brain Layer | Not explicit | GLM-5 (Zhipu) | **Added** — reasoning backbone |
| Domain Layer | Hung-Yi Lee (teaching only) | ML2022 (rigorous reasoning) | **Widened** — applies to all domains |
| Code Review | code-review-graph (700+ files) | Removed in v2.1.0 | Simplified focus |
| Quantitative Trading | Full OPAItrade | Removed in v2.1.0 | Focused scope |
| SKILL.md | 31.9 KB | ~11 KB | **Simplified** — cleaner architecture |

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
│   ├── Brain Layer (GLM-5)
│   ├── Behavior Layer (Kimi 3)
│   ├── Domain Layer (ML2022)
│   └── Combined workflow
├── skills/
│   └── one-mind/
│       └── SKILL.md                      # Detailed skill definition
├── README.md                             # This file
└── LICENSE                               # MIT
```

---

## 🛠️ Commands

| Command | Mode | Effect |
|---------|------|--------|
| `/one-mind` | All three | Load all layers (default) |
| `/one-mind brain` | GLM-5 only | Pure reasoning: plan, long-context, self-correct |
| `/one-mind behavior` | Kimi 3 only | Pure capability: take initiative, tool discipline |
| `/one-mind domain` | ML2022 only | Pure rigor: problem-first, empirical validation |

All persist for the session.

---

## 📚 Documentation

- **`skills/one-mind/SKILL.md`** — Complete skill definition with all three layers
- **`README.md`** — This file (quick start and overview)

---

## ⚙️ Customization

### To Modify Brain Behavior

Edit `skills/one-mind/SKILL.md` → **Brain Layer — GLM Agentic Protocol** section

### To Modify Agent Behavior

Edit `skills/one-mind/SKILL.md` → **Behavior Layer — Kimi 3 Agent Guidelines** section

### To Add a New Domain

Edit `skills/one-mind/SKILL.md` → **Domain Layer — ML2022 Pedagogy** section

Changes take effect on next `/one-mind` invocation.

---

## 📋 Requirements

- **Coding Assistant** (Claude Code, OpenAI function-calling, custom framework, etc.)
- **Python 3.8+** (optional, for local validation only)
- **Git** (for installation)

---

## 🎓 Philosophy

> **Three sources. One mind. One code. Always.**

Not a bag of tricks. Not a prompt library. A single coherent operating system for how an AI assistant **thinks** (GLM-5), **acts** (Kimi 3), and **reasons** (ML2022) — across every domain, every chat, every time.

- The **brain layer** keeps you thinking clearly.
- The **behavior layer** keeps you capable and proactive.
- The **domain layer** keeps you rigorous and honest.

Three layers. One system. One voice.

---

## 📄 License

MIT — use freely, modify freely, teach freely.

---

## 👏 Credits & Attribution

| Layer | Source | Credit | Reference |
|-------|--------|--------|-----------|
| **Brain** | GLM-5 | Zhipu AI (zai-org) | [GLM-5](https://github.com/zai-org/GLM-5) |
| **Behavior** | Kimi 3 | MoonshotAI | [kimi-code](https://github.com/MoonshotAI/kimi-code) |
| **Domain** | ML2022-Spring | Hung-Tze Cheng | [ML2022-Spring](https://github.com/virginiakm1988/ML2022-Spring) |

---

## 🤝 Contributing

Issues, PRs, and enhancement ideas welcome.

```bash
cd ~/Desktop/one-mind
git add .
git commit -m "one-mind v2.1.0: GLM-5 brain + Kimi 3 behavior + ML2022 domain"
git push origin main
```

---

## 📞 Support

- **Bugs**: Open an issue on GitHub
- **Questions**: Discussions tab
- **Enhancement ideas**: Issues with `enhancement` label

---

## 🚀 What's Next

- v2.2.0 (planned): Multi-lingual support for behavior layer
- v2.3.0 (planned): Integration with code search tools
- v3.0.0 (planned): Multi-agent coordination

---

**Last Updated:** 2026-07-23

**Three sources. One mind. One code. Always.**
