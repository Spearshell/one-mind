# ⚡ CONSTRUCT 2026: Dual-Platform Autonomous Live Demo (`live-demo-main-project`)

> **Status:** 🟢 **DESIGNED, VERIFIED & STANDING BY (NOT STARTED PER USER DIRECTIVE)**  
> **Platform 1:** **Trading212 Autonomous Engine** (`$100.00 USD` Starting Capital)  
> **Platform 2:** **MetaMask 1inch Aqua & Multi-DEX Engine** (`$100.00 USD` Starting Capital)  
> **Combined Master Equity:** **`$200.00 USD`**  
> **Command Center UI (When Launched):** `http://127.0.0.1:8800`

---

## 🏛️ 1. Architectural Synthesis (What Was Harvested From Your Systems)

This construct unifies the highest-performing modules discovered across your entire machine (`Desktop/Ready`, `Desktop/New bot 2026`, and `Desktop/Metamask 2026`):

| Source System | Harvested Infrastructure | Construct 2026 Module |
| :--- | :--- | :--- |
| **`Ready/exe/secrets/trading212.key`** | Auto-discovered Trading212 Live API Key & Secret (`HTTP Basic Auth`) | [`src/core/auto-resolver.js`](./src/core/auto-resolver.js) |
| **`Ready/212/lib/confluence-scanner.mjs`** | 4-Layer Hydra Confluence (`Regime` + `OrderFlow OBI` + `Catalyst` + `Structure`) | [`src/core/tier-classifier.js`](./src/core/tier-classifier.js) |
| **`Ready/212/lib/cost-aware-gate.mjs`** | ArXiv:2606.00060 Anti-Bleed Cost-Aware Execution Gate (`>= 2.5x` round-trip friction) | [`src/core/cost-aware-gate.js`](./src/core/cost-aware-gate.js) |
| **`Ready/212/lib/chart-analysis.mjs` & `chart-exit.mjs`** | Break-of-Structure (`BOS`), Reversal Candlesticks, & Chart-Reading Exits | [`src/core/smart-chart-exit.js`](./src/core/smart-chart-exit.js) |
| **`Ready/shared/live-demo/lib/hybrid-trader.mjs`** | Hurst Exponent Regime Classifier (`H > 0.55` Expansion vs `H < 0.45` Sweep) | [`src/addons/chart-microstructure.js`](./src/addons/chart-microstructure.js) |
| **`Ready/hft_bot_core.py` & `New bot 2026/demo.js`** | Order Book Imbalance (`OBI`) & Omega Ratcheting Profit Ladders | [`src/core/smart-chart-exit.js`](./src/core/smart-chart-exit.js) |
| **`Metamask 2026/cexio-trading-bot`** | ScanTrade System Health Score (`0–100`) & Bullish Liquidity Sweep Detector | [`src/core/learner-guardian.js`](./src/core/learner-guardian.js) |
| **`Metamask 2026/solana-sniper-bot`** | Falling-Knife Filter, Anti-Chase Gate, Escape-Sell-Ratio, & Self-Learning Weights | [`src/core/tier-classifier.js`](./src/core/tier-classifier.js) |
| **`Metamask 2026/1inch-trading-bot`** | Dynamic DexScreener + GeckoTerminal + 1inch Aqua Protocol D Stepping | [`src/platforms/metamask-dex-platform.js`](./src/platforms/metamask-dex-platform.js) |
| **TradingView Screener & Charting** | Live TradingView Screener API (`america` + `crypto`) & Embedded Interactive Chart | [`src/addons/tradingview-scanner.js`](./src/addons/tradingview-scanner.js) |

---

## 🧬 2. S-Tier, T-Tier, and A-Tier Execution Hierarchy

Every dynamically discovered asset on both **Trading212** and **MetaMask DEX** is scored from `0–100` across 4 Confluence Layers and assigned an execution tier:

### 🟣 `S-TIER` • Sovereign Institutional Confluence (`Score >= 82`, `3–4/4 Layers`)
* **Criteria:** Hurst Trending Regime (`H >= 0.48`), Strong Buyer Orderflow (`OBI >= +0.08`), TradingView `STRONG_BUY` rating, and Bullish Break-of-Structure (`BOS`).
* **Capital Allocation:** **32% of Platform Equity** (`$32.00` on a `$100.00` account).
* **Exit Protocol:** Protocol D Sovereign Ratchet + Chart Structure Breakdown protection.

### 🔵 `T-TIER` • Tactical Tape & Velocity Scalper (`Score 70–81`)
* **Criteria:** High 15m/1h velocity push, Relative Volume surge (`>= 1.15x`), and net buyer dominance.
* **Capital Allocation:** **24% of Platform Equity** (`$24.00` on a `$100.00` account).
* **Exit Protocol:** Fast Omega Profit-Locking Steps + strict Anti-Stagnation Velocity Timer (`20–30m max`).

### 🟢 `A-TIER` • Algorithmic Liquidity Sweep (`Score 62–69`)
* **Criteria:** Stop-run wick reversal below recent swing low or oversold Bollinger squeeze rebound with positive buyer absorption.
* **Capital Allocation:** **18% of Platform Equity** (`$18.00` on a `$100.00` account).
* **Exit Protocol:** Mean-Reversion Harvest with tight capital preservation floor.

---

## 🚀 3. How to Launch (When You Are Ready)

Per your instructions, **no application or background process has been started**. When you want to launch the construct:

1. **Double-click** [`LAUNCH-LIVE-DEMO.bat`](./LAUNCH-LIVE-DEMO.bat) (or run `node src/index.js`).
2. Open the unified Command Center in your browser at **`http://127.0.0.1:8800`**.
3. To reset both platforms back to `$100.00 USD` at any time, click **`↺ Reset Both to $100.00`** in the web UI or double-click [`RESET-PORTFOLIOS-TO-100.bat`](./RESET-PORTFOLIOS-TO-100.bat).
