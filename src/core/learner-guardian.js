/**
 * ScanTrade System Health Guardian & TradingView Volatility + Volume Self-Learning Engine
 * Synthesizes:
 * - Metamask 2026/cexio-trading-bot/src/scantrade-quant.js (Health Score 0-100 & No-Trade Guardian)
 * - Ready/212/lib/rotation-blacklist.mjs (Per-Symbol Cooldown & Revenge-Trade Prevention)
 * - solana-sniper-bot/src/learner.js (Self-Learning Tier & Feature Expectancy Optimizer)
 * - TradingView Built-In Volatility & Volume Strategy Feature Attribution (Stocks + Crypto)
 */

import fs from 'node:fs';
import path from 'node:path';
import envConfig from './auto-resolver.js';
import inhouseBuilder from '../addons/inhouse-strategy-builder.js';
import { nyTime, envFlag } from './market-hours.js';

// Backtest fix (2026-11-02): buying the same stock again later the same day (usually after it already stopped us out)
// lost money in both halves of the test -> at most one buy per symbol per New York trading day.
// .env: T212_ONE_ENTRY_PER_SYMBOL_PER_DAY=false to switch off.
const ONE_ENTRY_PER_DAY = () => envFlag('T212_ONE_ENTRY_PER_SYMBOL_PER_DAY', true);

const LEARNED_FILE = path.join(envConfig.stateDir, 'learned-tier-weights.json');

const DEFAULT_FEATURE_WEIGHTS = {
  volSqueeze: 1.0,      // TTM Bollinger + Keltner Volatility Squeeze & Expansion
  atrTrend: 1.0,        // ATR Volatility Stop + Parabolic SAR Trend
  vwapVolume: 1.0,      // VWAP + VWMA Institutional Volume Accumulation
  rvolMfi: 1.0,         // Relative Volume (RVOL) + Money Flow Index (MFI 14)
  channelBreakout: 1.0  // Volatility Channel & Bollinger %B Breakout
};

const DEFAULT_FEATURE_STATS = {
  volSqueeze: { name: 'TTM Volatility Squeeze & BB Expansion', wins: 0, losses: 0, netPnlUsd: 0 },
  atrTrend: { name: 'ATR Volatility Stop & Parabolic SAR', wins: 0, losses: 0, netPnlUsd: 0 },
  vwapVolume: { name: 'VWAP + VWMA Institutional Volume', wins: 0, losses: 0, netPnlUsd: 0 },
  rvolMfi: { name: 'Relative Volume (RVOL) + Money Flow (MFI)', wins: 0, losses: 0, netPnlUsd: 0 },
  channelBreakout: { name: 'Volatility Channel & %B Thrust', wins: 0, losses: 0, netPnlUsd: 0 }
};

export class LearnerGuardianEngine {
  constructor() {
    this.symbolCooldowns = new Map(); // symbol -> expiry timestamp
    this.learned = this._loadLearnedState();
  }

  _loadLearnedState() {
    try {
      if (fs.existsSync(LEARNED_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(LEARNED_FILE, 'utf8'));
        parsed.weights = { S: 1.0, T: 1.0, A: 1.0, ...(parsed.weights || {}) };
        parsed.featureWeights = { ...DEFAULT_FEATURE_WEIGHTS, ...(parsed.featureWeights || {}) };
        parsed.featureStats = { ...DEFAULT_FEATURE_STATS, ...(parsed.featureStats || {}) };
        parsed.recentEntries = Array.isArray(parsed.recentEntries) ? parsed.recentEntries : [];
        return parsed;
      }
    } catch (_) {}
    const initial = {
      weights: { S: 1.0, T: 1.0, A: 1.0 },
      featureWeights: { ...DEFAULT_FEATURE_WEIGHTS },
      stats: {
        'S-TIER': { wins: 0, losses: 0, netPnlUsd: 0 },
        'T-TIER': { wins: 0, losses: 0, netPnlUsd: 0 },
        'A-TIER': { wins: 0, losses: 0, netPnlUsd: 0 }
      },
      featureStats: JSON.parse(JSON.stringify(DEFAULT_FEATURE_STATS)),
      recentEntries: ['ACCO', 'NFE', 'CVEO', 'CHPT', 'JAGA', 'HYSD', '0A2V'],
      updatedAt: new Date().toISOString()
    };
    this._saveLearnedState(initial);
    return initial;
  }

  _saveLearnedState(state = this.learned) {
    try {
      if (!fs.existsSync(envConfig.stateDir)) {
        fs.mkdirSync(envConfig.stateDir, { recursive: true });
      }
      fs.writeFileSync(LEARNED_FILE, JSON.stringify(state, null, 2));
    } catch (_) {}
  }

  getFeatureWeights() {
    return this.learned.featureWeights || DEFAULT_FEATURE_WEIGHTS;
  }

  /**
   * Resets learned stats when portfolios are reset to $100.00 (preserving recentEntries rotation so it never repeats the same 6 stocks!)
   */
  resetLearnedStats() {
    const prevRecent = this.learned?.recentEntries?.length
      ? this.learned.recentEntries
      : ['ACCO', 'NFE', 'CVEO', 'CHPT', 'JAGA', 'HYSD', '0A2V'];
    this.symbolCooldowns.clear();
    inhouseBuilder.resetState();
    this.learned = {
      weights: { S: 1.0, T: 1.0, A: 1.0 },
      featureWeights: { ...DEFAULT_FEATURE_WEIGHTS },
      stats: {
        'S-TIER': { wins: 0, losses: 0, netPnlUsd: 0 },
        'T-TIER': { wins: 0, losses: 0, netPnlUsd: 0 },
        'A-TIER': { wins: 0, losses: 0, netPnlUsd: 0 }
      },
      featureStats: JSON.parse(JSON.stringify(DEFAULT_FEATURE_STATS)),
      recentEntries: prevRecent,
      updatedAt: new Date().toISOString()
    };
    this._saveLearnedState(this.learned);
  }

  /**
   * Persistent Anti-Repeat Rotation:
   * Records a newly entered symbol on disk so even across restarts the bot rotates through
   * fresh stocks instead of buying the exact same 6 stocks every time.
   */
  recordSymbolEntry(symbol) {
    const key = String(symbol).toUpperCase();
    const list = (this.learned.recentEntries || []).filter(s => s !== key);
    list.unshift(key);
    this.learned.recentEntries = list.slice(0, 12);
    const today = nyTime().day;
    const entered = {};
    for (const [s, d] of Object.entries(this.learned.enteredOnDay || {})) if (d === today) entered[s] = d;
    entered[key] = today;
    this.learned.enteredOnDay = entered;
    this._saveLearnedState();
  }

  /**
   * Checks if a symbol is currently in post-exit cooldown OR in the recent-entry rotation buffer
   */
  isSymbolOnCooldown(symbol) {
    const key = String(symbol).toUpperCase();
    if ((this.learned.recentEntries || []).slice(0, 9).includes(key)) {
      return true;
    }
    if (ONE_ENTRY_PER_DAY() && (this.learned.enteredOnDay || {})[key] === nyTime().day) {
      return true;
    }
    const exp = this.symbolCooldowns.get(key);
    if (!exp) return false;
    if (Date.now() > exp) {
      this.symbolCooldowns.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Records a closed trade and updates both:
   * 1. S-Tier / T-Tier / A-Tier portfolio weights
   * 2. TradingView Volatility & Volume sub-strategy weights (volSqueeze, atrTrend, vwapVolume, rvolMfi, channelBreakout)
   */
  recordTradeOutcome({ symbol, tier = 'T-TIER', netPnlUsd = 0, netPnlPct = 0, activeSignals = [], strategyId = null, passedBlocks = [] }) {
    const key = String(symbol).toUpperCase();
    // Ignore flat break-even rotations ($0.00 / 0.00%) so they neither inflate wins nor penalize strategy weights
    if (Math.abs(netPnlUsd) <= 0.001 && Math.abs(netPnlPct) <= 0.001) {
      this.symbolCooldowns.set(key, Date.now() + 15 * 60 * 1000);
      return;
    }
    const isWin = netPnlUsd > 0.001 || netPnlPct > 0.001;

    if (strategyId || passedBlocks.length > 0) {
      inhouseBuilder.recordStrategyOutcome({
        strategyId,
        passedBlocks,
        netPnlUsd,
        netPnlPct
      });
    }

    // Apply 10-minute cooldown after win, 30-minute cooldown after loss (prevents churn)
    const cooldownMs = isWin ? 10 * 60 * 1000 : 30 * 60 * 1000;
    this.symbolCooldowns.set(key, Date.now() + cooldownMs);

    // 1. Update Tier Stats & Weights
    const bucket = this.learned.stats[tier] || { wins: 0, losses: 0, netPnlUsd: 0 };
    if (isWin) {
      bucket.wins += 1;
    } else {
      bucket.losses += 1;
    }
    bucket.netPnlUsd = Number((bucket.netPnlUsd + netPnlUsd).toFixed(4));
    this.learned.stats[tier] = bucket;

    const total = bucket.wins + bucket.losses;
    if (total >= 2) {
      const winRate = bucket.wins / total;
      const shortKey = tier.charAt(0); // 'S', 'T', or 'A'
      if (winRate >= 0.60 && bucket.netPnlUsd > 0) {
        this.learned.weights[shortKey] = Number(Math.min(1.18, (this.learned.weights[shortKey] || 1.0) + 0.025).toFixed(3));
      } else if (winRate < 0.40 && bucket.netPnlUsd < 0) {
        this.learned.weights[shortKey] = Number(Math.max(0.88, (this.learned.weights[shortKey] || 1.0) - 0.025).toFixed(3));
      }
    }

    // 2. Update TradingView Volatility & Volume Sub-Strategy Attribution
    for (const sig of activeSignals) {
      if (!this.learned.featureStats[sig]) continue;
      const fStat = this.learned.featureStats[sig];
      if (isWin) {
        fStat.wins += 1;
      } else {
        fStat.losses += 1;
      }
      fStat.netPnlUsd = Number((fStat.netPnlUsd + netPnlUsd).toFixed(4));

      const fTotal = fStat.wins + fStat.losses;
      const currWeight = Number(this.learned.featureWeights[sig] || 1.0);
      if (isWin) {
        // Reinforce winning Volatility/Volume strategy feature
        const boost = fTotal >= 2 && (fStat.wins / fTotal) >= 0.6 ? 0.03 : 0.015;
        this.learned.featureWeights[sig] = Number(Math.min(1.25, currWeight + boost).toFixed(3));
      } else {
        // Dampen underperforming Volatility/Volume strategy feature
        const penalty = fTotal >= 2 && (fStat.wins / fTotal) < 0.4 ? 0.03 : 0.015;
        this.learned.featureWeights[sig] = Number(Math.max(0.80, currWeight - penalty).toFixed(3));
      }
    }

    this.learned.updatedAt = new Date().toISOString();
    this._saveLearnedState();
  }

  /**
   * Computes ScanTrade System Health Score (0 - 100) for a Platform Portfolio
   */
  computeHealthStatus(portfolio) {
    const starting = Number(portfolio.startingCapitalUsd || 100.0);
    const equity = Number(portfolio.totalEquityUsd || starting);
    const peak = Math.max(Number(portfolio.peakEquityUsd || starting), equity);
    const drawdownPct = peak > 0 ? ((peak - equity) / peak) * 100 : 0;

    let score = 100.0;
    score -= Math.min(45, drawdownPct * 6.0);

    const closed = portfolio.closedTrades || [];
    if (closed.length >= 2) {
      const wins = closed.filter(t => t.netPnlUsd > 0).length;
      const wr = (wins / closed.length) * 100;
      if (wr >= 60) score += 4;
      if (wr < 45) score -= 12;
    }

    const finalScore = Number(Math.max(0, Math.min(100, score)).toFixed(1));
    // Daily loss guard (2026-11-03): once a desk's realized P&L for the current New York day (after costs)
    // falls to -T212_DAILY_LOSS_LIMIT_USD, it stops opening new trades until tomorrow. Exits keep running.
    const dayLimit = Number(process.env.T212_DAILY_LOSS_LIMIT_USD || 0);
    const today = nyTime().day;
    const todayNet = closed.filter(t => t.closeTime && nyTime(new Date(t.closeTime)).day === today).reduce((a, t) => a + Number(t.netPnlUsd || 0), 0);
    const dailyLossHit = dayLimit > 0 && todayNet <= -dayLimit;
    const guardianLocked = finalScore < 40.0 || dailyLossHit;

    return {
      healthScore: finalScore,
      guardianLocked,
      todayNetPnlUsd: Number(todayNet.toFixed(2)),
      dailyLossLimitHit: dailyLossHit,
      status: dailyLossHit ? 'DAILY_LOSS_LIMIT' : guardianLocked ? 'GUARDIAN_LOCKDOWN' : (finalScore >= 85 ? 'OPTIMAL_S_TIER' : 'ACTIVE_VIGILANCE'),
      drawdownPct: Number(drawdownPct.toFixed(2)),
      learnedWeights: this.learned.weights,
      featureWeights: this.learned.featureWeights,
      tierStats: this.learned.stats,
      featureStats: this.learned.featureStats,
      strategyBuilder: inhouseBuilder.getOverview()
    };
  }
}

export default new LearnerGuardianEngine();
