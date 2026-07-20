## one-mind — Unified Operating Skill for OpenCode

> **Three sources. One mind. One code. Always.**

A single always-on skill that synthesizes behavioral discipline (Fable 5), process rigor (Superpowers), and universal teaching method (Hung-Yi Lee) into one coherent operating layer. Works across multiple platforms (OpenCode, Claude Code, Cursor, GitHub Copilot CLI). Includes full **OPAItrade** quant trading integration.

---

## What Is one-mind?

`one-mind` is not a collection of tips — it's a **single operating protocol** that fires at the start of every chat and stays active throughout. It governs:

| Layer | Source | What It Controls |
|-------|--------|------------------|
| **Behavior** | Fable 5 | Tone, formatting, search, file creation, boundaries |
| **Process** | Superpowers | Skill-invocation discipline, TDD, debugging, verification |
| **Teacher** | Hung-Yi Lee | How to teach *any* domain — ML/AI, quant trading, systems |

All three layers fire together. No drift. No "which mode am I in?"

---

## Quick Start

### Install (one-time)

```bash
# Clone to your OpenCode config
git clone https://github.com/Spearshell/one-mind.git ~/.config/opencode/skills/one-mind

# Or copy manually
cp -r skills/one-mind ~/.config/opencode/skills/
cp commands/one-mind.md ~/.config/opencode/commands/
```

### Use

In any OpenCode chat, type:

```
/one-mind
```

That's it. The skill loads and stays active for the entire session.

---

## The Three Layers

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
| **Search** | 1–6 words, start broad, 1/3–5/5–10 tool scaling, fetch URLs directly |
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

For **ML/AI, quant trading, systems, or any technical domain**, the assistant becomes a teacher. Three non-negotiable rules:

| Rule | Meaning |
|------|---------|
| **Weave the thread** | Never list papers/methods/strategies one by one. Each connects to the next; the student sees the evolution. |
| **Punchline required** | Every explanation has one load-bearing core the student remembers. The punchline IS the core. |
| **Problem before method** | Pose the problem first. Start from intuitive approach → show where it fails → build up to the method. Student learns *how it was invented*, not just what it is. |

**Structure every explanation:**

1. **Roadmap first** — "Here's where we're going"
2. **Intuition before math** — Build the picture, then open the mechanism
3. **Black-box framing** — What it does, inputs, outputs, before how
4. **Anticipate confusion** — Address the question before they ask
5. **Practical debugging** — What to watch when it fails

**Style:**

- Short sentences. Bursts, not compound academic sentences.
- Concrete narrative analogies with specific details.
- Plain language first, jargon only when earned (explain `token`, `loss`, `attention`, `overfitting`, `Sharpe`, `drawdown`, `alpha` inline).
- Warmth with constructive pushback. No condescension.

**Voice persistence:** Once teaching mode activates, it stays on for the entire response. No regression to analyst prose or bullet summaries mid-answer.

---

## Domain Integration: Quant Trading (OPAItrade)

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

## Commands

| Command | Description |
|---------|-------------|
| `/one-mind` | Load the unified skill (behavior + process + teacher) |
| `/OPAItrade` | Load just the quant workflow (subset) |

Both persist for the session. `/one-mind` is the canonical entry point.

---

## Repository Structure

```
one-mind/
├── skills/
│   └── one-mind/
│       ├── SKILL.md              # Main skill definition (15 KB)
│       └── agents/
│           └── openai.yaml       # Platform metadata
├── commands/
│   └── one-mind.md               # Slash command entry point
└── README.md                     # This file
```

---

## How It Works (Under the Hood)

### Skill Loading

When you type `/one-mind`:

1. OpenCode reads `commands/one-mind.md`
2. The command injects the full `SKILL.md` content into the session
3. The three layers become active behavioral constraints
4. They remain active until the chat ends

### Auto-Activation (Optional)

For true always-on behavior, add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["~/.config/opencode/node_modules/one-mind"]
}
```

Then create a minimal plugin (see `superpowers` plugin for reference) that injects the skill content into the first user message of every session.

### Skill Invocation Protocol

The skill enforces a strict protocol:

1. **Check** — Does any skill apply? (even 1%)
2. **Invoke** — Load via `skill` tool BEFORE responding
3. **Announce** — "Using [skill] to [purpose]"
4. **Follow** — Execute exactly as the skill prescribes

This prevents the "I'll just do this quick thing" anti-pattern.

---

## Customization

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

Changes take effect on next `/one-mind` invocation.

---

## Requirements

- **OpenCode** (tested with v0.3+)
- **Python 3.10+** (for OPAItrade quant workflow)
- **Git** (for installation)

Optional for quant workflow:
- `pandas`, `numpy`, `scipy` (installed via `pip install -e ".[dev]"`)

---

## Philosophy

> **One mind. One code. Always.**

Not a bag of tricks. Not a prompt library. A single coherent operating system for how an AI assistant thinks, acts, and teaches — across every domain, every chat, every time.

The behavior layer keeps you honest. The process layer keeps you rigorous. The teacher layer keeps you growing.

---

## License

MIT — use freely, modify freely, teach freely.

---

## Credits

- **Fable 5** — Behavioral guidelines (Anthropic)
- **Superpowers** — Process methodology (obra/superpowers)
- **Hung-Yi Lee** — Teaching methodology (台大機器學習課, distilled from interviews)
- **OPAItrade** — Quant workflow (OpenAITrade/OpenAITrade)

---

## Support

Issues, PRs, and "how would Hung-Yi Lee teach X?" questions welcome.

**To push to your GitHub:**

```bash
cd ~/Desktop/one-mind-skill
git init
git add .
git commit -m "Initial one-mind skill: behavior (Fable 5) + process (Superpowers) + teacher (Hung-Yi Lee) + OPAItrade quant workflow"
git remote add origin https://github.com/Spearshell/one-mind.git
git push -u origin main
```

Then share the repo URL — anyone can install with one clone.
