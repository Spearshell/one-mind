/**
 * In-House Autonomous Strategy Builder, Strategy Finder, Volatility & Volume Engine
 * ---------------------------------------------------------------------------------
 * Runs 100% standalone in-house (no need to open the TradingView Desktop GUI app),
 * while remaining connected to TradingView's real-time data stream in the background.
 *
 * Capabilities:
 * 1. VOLATILITY MODULE OPTIONS (6 Institutional Volatility Primitives)
 * 2. VOLUME MODULE OPTIONS (6 Institutional Volume Primitives)
 * 3. STRATEGY FINDER (Scans every stock against 6 Built-In Templates + 1 Self-Evolving Custom Strategy
 *    and automatically selects the highest-expectancy strategy for that stock's exact chart regime)
 * 4. CUSTOM STRATEGY SYNTHESIZER (Combines the Learner's highest-performing Volatility + Volume
 *    blocks to create and evolve new custom strategies automatically during the Live Demo)
 */

import fs from 'node:fs';
import path from 'node:path';
import envConfig from '../core/auto-resolver.js';

const CUSTOM_STRATEGIES_FILE = path.join(envConfig.stateDir, 'inhouse-custom-strategies.json');

export const VOLATILITY_OPTIONS = {
  VOL_TTM_SQUEEZE: {
    id: 'VOL_TTM_SQUEEZE',
    name: 'TTM Bollinger/Keltner Squeeze',
    formula: 'BB(20,2) inside KC(EMA20 ± 1.5*ATR14) coiling & expansion',
    defaultWeight: 1.0
  },
  VOL_EXPANSION_RATIO: {
    id: 'VOL_EXPANSION_RATIO',
    name: 'Volatility.D / Volatility.W Expansion',
    formula: 'Volatility.D >= 0.90 * Volatility.W & Volatility.D >= 1.2%',
    defaultWeight: 1.0
  },
  VOL_ATR_PSAR_STOP: {
    id: 'VOL_ATR_PSAR_STOP',
    name: 'ATR(14) + Parabolic SAR Dual Trend Stop',
    formula: 'Close > P.SAR(Daily) & Close > P.SAR(15m) with ATR-scaled stops',
    defaultWeight: 1.0
  },
  VOL_BB_PERCENT_B: {
    id: 'VOL_BB_PERCENT_B',
    name: 'Bollinger %B Upper Band Thrust',
    formula: '%B(15m) >= 0.65 or %B(Daily) >= 0.65 with positive 15m/1h slope',
    defaultWeight: 1.0
  },
  VOL_DONCHIAN_CHANNEL: {
    id: 'VOL_DONCHIAN_CHANNEL',
    name: 'Intraday High/Low Channel Breakout',
    formula: '(Close - Low) / (High - Low) >= 0.62 (Top 38% of session range)',
    defaultWeight: 1.0
  },
  VOL_BANDWIDTH_REBOUND: {
    id: 'VOL_BANDWIDTH_REBOUND',
    name: 'Bollinger Bandwidth Compression Rebound',
    formula: 'BB Width compressed + 15m RSI 34-55 mean-reversion ignition',
    defaultWeight: 1.0
  }
};

export const VOLUME_OPTIONS = {
  VOLM_VWAP_ANCHOR: {
    id: 'VOLM_VWAP_ANCHOR',
    name: 'Institutional Dual-VWAP Anchor',
    formula: 'Close >= Session VWAP & Close >= 15m Intraday VWAP',
    defaultWeight: 1.0
  },
  VOLM_VWMA_ACCUMULATION: {
    id: 'VOLM_VWMA_ACCUMULATION',
    name: 'VWMA(20) > SMA(20) Up-Bar Accumulation',
    formula: 'VWMA(20) >= SMA(20) & 15m VWMA >= 15m EMA(20) (up-candle volume dominance)',
    defaultWeight: 1.0
  },
  VOLM_RVOL_SURGE: {
    id: 'VOLM_RVOL_SURGE',
    name: '10-Day Relative Volume (RVOL) Surge',
    formula: 'RVOL >= 1.25x (2.5x+ for Catalyst Surge) vs 10d average volume',
    defaultWeight: 1.0
  },
  VOLM_MFI_SMART_FLOW: {
    id: 'VOLM_MFI_SMART_FLOW',
    name: 'Money Flow Index (MFI 14) Inflow',
    formula: 'MFI(14) between 48 and 85 (Strong institutional inflow, < 88 climax)',
    defaultWeight: 1.0
  },
  VOLM_MFI_INTRADAY_ACCEL: {
    id: 'VOLM_MFI_INTRADAY_ACCEL',
    name: '15m Intraday Money Flow Acceleration',
    formula: '15m MFI >= 52 & rising faster than Daily MFI baseline',
    defaultWeight: 1.0
  },
  VOLM_LIQUIDITY_DEPTH: {
    id: 'VOLM_LIQUIDITY_DEPTH',
    name: 'Institutional Dollar-Volume Depth Filter',
    formula: 'Session Dollar Volume (Price * Volume) >= $15,000,000',
    defaultWeight: 1.0
  }
};

export const BUILTIN_STRATEGY_TEMPLATES = [
  {
    strategyId: 'STRAT_01_SQUEEZE_VWAP',
    name: 'TTM Squeeze + Institutional VWAP Ignition',
    category: 'VOLATILITY_BREAKOUT',
    description: 'Catches stocks coiling inside a Bollinger/Keltner squeeze that fire above Session VWAP on high Relative Volume.',
    volatilityBlocks: ['VOL_TTM_SQUEEZE', 'VOL_BB_PERCENT_B', 'VOL_ATR_PSAR_STOP'],
    volumeBlocks: ['VOLM_VWAP_ANCHOR', 'VOLM_RVOL_SURGE', 'VOLM_MFI_SMART_FLOW'],
    targetMultiplier: 1.15,
    stopMultiplier: 0.95
  },
  {
    strategyId: 'STRAT_02_VWMA_RVOL_TREND',
    name: 'Institutional VWMA + RVOL Accumulation Trend',
    category: 'VOLUME_ACCUMULATION',
    description: 'Follows heavy institutional accumulation where VWMA > SMA20, Price > VWAP, and RVOL exceeds 1.5x.',
    volatilityBlocks: ['VOL_ATR_PSAR_STOP', 'VOL_DONCHIAN_CHANNEL'],
    volumeBlocks: ['VOLM_VWAP_ANCHOR', 'VOLM_VWMA_ACCUMULATION', 'VOLM_RVOL_SURGE', 'VOLM_LIQUIDITY_DEPTH'],
    targetMultiplier: 1.05,
    stopMultiplier: 0.90
  },
  {
    strategyId: 'STRAT_03_ATR_PSAR_MOMENTUM',
    name: 'ATR Volatility Expansion + Parabolic SAR Runner',
    category: 'MOMENTUM_RUNNER',
    description: 'Rides high-velocity intraday runners where Volatility.D expands above Volatility.W and both 15m & Daily P.SAR trail price.',
    volatilityBlocks: ['VOL_EXPANSION_RATIO', 'VOL_ATR_PSAR_STOP', 'VOL_BB_PERCENT_B', 'VOL_DONCHIAN_CHANNEL'],
    volumeBlocks: ['VOLM_VWAP_ANCHOR', 'VOLM_MFI_INTRADAY_ACCEL'],
    targetMultiplier: 1.25,
    stopMultiplier: 1.05
  },
  {
    strategyId: 'STRAT_04_CATALYST_RVOL_EXPLOSION',
    name: 'Catalyst & Earnings RVOL + MFI Surge',
    category: 'CATALYST_SURGE',
    description: 'Targets stocks with 3x-20x Relative Volume surges and strong Money Flow (MFI 52-84) holding upper channel structure.',
    volatilityBlocks: ['VOL_EXPANSION_RATIO', 'VOL_DONCHIAN_CHANNEL'],
    volumeBlocks: ['VOLM_RVOL_SURGE', 'VOLM_MFI_SMART_FLOW', 'VOLM_MFI_INTRADAY_ACCEL', 'VOLM_VWAP_ANCHOR'],
    targetMultiplier: 1.30,
    stopMultiplier: 1.00
  },
  {
    strategyId: 'STRAT_05_COMPRESSION_SWEEP_REBOUND',
    name: 'Volatility Compression & VWAP Reclaim Rebound',
    category: 'ASYMMETRIC_REVERSAL',
    description: 'Captures low-risk mean-reversion rebounds when Bollinger bandwidth compresses and 15m VWAP +VWMA are reclaimed.',
    volatilityBlocks: ['VOL_BANDWIDTH_REBOUND', 'VOL_ATR_PSAR_STOP'],
    volumeBlocks: ['VOLM_VWAP_ANCHOR', 'VOLM_VWMA_ACCUMULATION', 'VOLM_MFI_SMART_FLOW'],
    targetMultiplier: 0.90,
    stopMultiplier: 0.80
  }
];

export class InHouseStrategyBuilder {
  constructor() {
    this.state = this._loadState();
  }

  _loadState() {
    try {
      if (fs.existsSync(CUSTOM_STRATEGIES_FILE)) {
        return JSON.parse(fs.readFileSync(CUSTOM_STRATEGIES_FILE, 'utf8'));
      }
    } catch (_) {}

    const initial = {
      blockWeights: {
        VOL_TTM_SQUEEZE: 1.0,
        VOL_EXPANSION_RATIO: 1.0,
        VOL_ATR_PSAR_STOP: 1.0,
        VOL_BB_PERCENT_B: 1.0,
        VOL_DONCHIAN_CHANNEL: 1.0,
        VOL_BANDWIDTH_REBOUND: 1.0,
        VOLM_VWAP_ANCHOR: 1.0,
        VOLM_VWMA_ACCUMULATION: 1.0,
        VOLM_RVOL_SURGE: 1.0,
        VOLM_MFI_SMART_FLOW: 1.0,
        VOLM_MFI_INTRADAY_ACCEL: 1.0,
        VOLM_LIQUIDITY_DEPTH: 1.0
      },
      strategyPerformance: {
        STRAT_01_SQUEEZE_VWAP: { wins: 0, losses: 0, netPnlUsd: 0, weight: 1.0 },
        STRAT_02_VWMA_RVOL_TREND: { wins: 0, losses: 0, netPnlUsd: 0, weight: 1.0 },
        STRAT_03_ATR_PSAR_MOMENTUM: { wins: 0, losses: 0, netPnlUsd: 0, weight: 1.0 },
        STRAT_04_CATALYST_RVOL_EXPLOSION: { wins: 0, losses: 0, netPnlUsd: 0, weight: 1.0 },
        STRAT_05_COMPRESSION_SWEEP_REBOUND: { wins: 0, losses: 0, netPnlUsd: 0, weight: 1.0 },
        STRAT_CUSTOM_LEARNER_SYNTH: { wins: 0, losses: 0, netPnlUsd: 0, weight: 1.05 }
      },
      synthesizedCustomStrategy: {
        strategyId: 'STRAT_CUSTOM_LEARNER_SYNTH',
        name: 'Learner Auto-Synthesized Alpha Strategy v1',
        generation: 1,
        category: 'CUSTOM_AUTO_SYNTHESIZED',
        description: 'Dynamically synthesized in-house from the highest-scoring Volatility & Volume building blocks.',
        volatilityBlocks: ['VOL_TTM_SQUEEZE', 'VOL_ATR_PSAR_STOP', 'VOL_BB_PERCENT_B'],
        volumeBlocks: ['VOLM_VWAP_ANCHOR', 'VOLM_VWMA_ACCUMULATION', 'VOLM_RVOL_SURGE'],
        targetMultiplier: 1.15,
        stopMultiplier: 0.92
      },
      updatedAt: new Date().toISOString()
    };

    this._saveState(initial);
    return initial;
  }

  _saveState(state = this.state) {
    try {
      if (!fs.existsSync(envConfig.stateDir)) {
        fs.mkdirSync(envConfig.stateDir, { recursive: true });
      }
      fs.writeFileSync(CUSTOM_STRATEGIES_FILE, JSON.stringify(state, null, 2));
    } catch (_) {}
  }

  resetState() {
    if (fs.existsSync(CUSTOM_STRATEGIES_FILE)) {
      try { fs.unlinkSync(CUSTOM_STRATEGIES_FILE); } catch (_) {}
    }
    this.state = this._loadState();
    return this.state;
  }

  /**
   * Evaluates all 12 In-House Volatility & Volume Primitive Blocks on a candidate
   */
  evaluatePrimitiveBlocks(c, metrics) {
    const price = Number(c.price || 0);
    const volUsd = price * Number(c.volume || 0);
    const ch15m = Number(c.change15m || 0);
    const ch1h = Number(c.change1h || 0);
    const rsi15m = Number(c.rsi15m || c.rsi || 52);

    const blocks = {
      // 6 Volatility Primitives
      VOL_TTM_SQUEEZE: Boolean(metrics.isSqueezeCoiled || metrics.squeezeState === 'SQUEEZE_FIRING_UP'),
      VOL_EXPANSION_RATIO: Boolean(metrics.volExpansionRatio >= 0.90 && metrics.volatilityD >= 1.2),
      VOL_ATR_PSAR_STOP: Boolean(metrics.abovePsar && metrics.volatilityD >= 0.45),
      VOL_BB_PERCENT_B: Boolean((metrics.percentB15m >= 0.65 || metrics.percentB >= 0.65) && (ch15m >= 0 || ch1h > 0)),
      VOL_DONCHIAN_CHANNEL: Boolean(metrics.rangePosition >= 0.62),
      VOL_BANDWIDTH_REBOUND: Boolean(metrics.isSqueezeCoiled && rsi15m >= 34 && rsi15m <= 58 && ch15m >= 0),

      // 6 Volume Primitives
      VOLM_VWAP_ANCHOR: Boolean(metrics.aboveVwap),
      VOLM_VWMA_ACCUMULATION: Boolean(metrics.vwmaBullish),
      VOLM_RVOL_SURGE: Boolean(metrics.relVol >= 1.25),
      VOLM_MFI_SMART_FLOW: Boolean(metrics.mfi >= 48 && metrics.mfi <= 85),
      VOLM_MFI_INTRADAY_ACCEL: Boolean(metrics.mfi15m >= 52 && metrics.mfi15m >= metrics.mfi * 0.95),
      VOLM_LIQUIDITY_DEPTH: Boolean(volUsd >= 15000000 || Number(c.volume || 0) >= 2000000)
    };

    const passedBlocks = Object.keys(blocks).filter(k => blocks[k]);
    return { blocks, passedBlocks };
  }

  /**
   * STRATEGY FINDER:
   * Tests all 5 Built-In Strategy Templates + the Learner's Custom Synthesized Strategy
   * against the candidate's active Volatility & Volume blocks, and selects the best-matching strategy.
   */
  findBestStrategy(c, metrics) {
    const { blocks, passedBlocks } = this.evaluatePrimitiveBlocks(c, metrics);
    const allStrategies = [
      ...BUILTIN_STRATEGY_TEMPLATES,
      this.state.synthesizedCustomStrategy
    ];

    let bestMatch = null;
    let highestMatchScore = -1;

    for (const strat of allStrategies) {
      const reqBlocks = [...strat.volatilityBlocks, ...strat.volumeBlocks];
      let matchedCount = 0;
      let weightedSum = 0;
      let maxPossibleSum = 0;

      for (const bId of reqBlocks) {
        const bw = Number(this.state.blockWeights[bId] || 1.0);
        maxPossibleSum += bw;
        if (blocks[bId]) {
          matchedCount += 1;
          weightedSum += bw;
        }
      }

      const matchRatio = maxPossibleSum > 0 ? weightedSum / maxPossibleSum : 0;
      const stratPerf = this.state.strategyPerformance[strat.strategyId] || { weight: 1.0 };
      const stratScore = Math.round(matchRatio * 100 * Number(stratPerf.weight || 1.0));

      if (stratScore > highestMatchScore) {
        highestMatchScore = stratScore;
        bestMatch = {
          strategyId: strat.strategyId,
          strategyName: strat.name,
          category: strat.category,
          matchedBlocks: `${matchedCount}/${reqBlocks.length}`,
          matchScore: Math.min(99, stratScore),
          targetMultiplier: strat.targetMultiplier || 1.0,
          stopMultiplier: strat.stopMultiplier || 1.0
        };
      }
    }

    return {
      selectedStrategy: bestMatch,
      passedBlocks,
      blocks
    };
  }

  /**
   * Self-Learning Feedback Loop:
   * Updates weights for individual Volatility & Volume blocks AND mutates/evolves
   * the Custom Synthesized Strategy (`STRAT_CUSTOM_LEARNER_SYNTH`) using the top blocks!
   */
  recordStrategyOutcome({ strategyId, passedBlocks = [], netPnlUsd = 0, netPnlPct = 0 }) {
    const isWin = netPnlUsd > 0 || netPnlPct > 0;

    // 1. Update primitive block weights
    for (const bId of passedBlocks) {
      if (this.state.blockWeights[bId] === undefined) continue;
      const curr = Number(this.state.blockWeights[bId] || 1.0);
      this.state.blockWeights[bId] = isWin
        ? Number(Math.min(1.30, curr + 0.02).toFixed(3))
        : Number(Math.max(0.75, curr - 0.02).toFixed(3));
    }

    // 2. Update Strategy Template performance
    if (strategyId && this.state.strategyPerformance[strategyId]) {
      const perf = this.state.strategyPerformance[strategyId];
      if (isWin) perf.wins += 1;
      else perf.losses += 1;
      perf.netPnlUsd = Number((perf.netPnlUsd + netPnlUsd).toFixed(4));
      const total = perf.wins + perf.losses;
      if (total >= 2) {
        const wr = perf.wins / total;
        if (wr >= 0.60 && perf.netPnlUsd > 0) {
          perf.weight = Number(Math.min(1.22, (perf.weight || 1.0) + 0.025).toFixed(3));
        } else if (wr < 0.40 && perf.netPnlUsd < 0) {
          perf.weight = Number(Math.max(0.82, (perf.weight || 1.0) - 0.025).toFixed(3));
        }
      }
    }

    // 3. Auto-Synthesize / Evolve Custom Strategy from Top-Ranked Volatility & Volume Blocks
    this._evolveCustomStrategy();
    this.state.updatedAt = new Date().toISOString();
    this._saveState();
  }

  /**
   * Builds or updates the In-House Custom Strategy either automatically from top-weighted blocks
   * or from explicit operator block selections.
   */
  _evolveCustomStrategy(customVolBlocks = null, customVolmBlocks = null, customName = null) {
    const topVol = customVolBlocks || Object.keys(VOLATILITY_OPTIONS)
      .sort((a, b) => (this.state.blockWeights[b] || 1) - (this.state.blockWeights[a] || 1))
      .slice(0, 3);

    const topVolm = customVolmBlocks || Object.keys(VOLUME_OPTIONS)
      .sort((a, b) => (this.state.blockWeights[b] || 1) - (this.state.blockWeights[a] || 1))
      .slice(0, 3);

    const nextGen = (this.state.synthesizedCustomStrategy?.generation || 1) + 1;
    this.state.synthesizedCustomStrategy = {
      strategyId: 'STRAT_CUSTOM_LEARNER_SYNTH',
      name: customName || `Learner Auto-Synthesized Alpha Strategy v${nextGen}`,
      generation: nextGen,
      category: 'CUSTOM_AUTO_SYNTHESIZED',
      description: `Synthesized from top Volatility [${topVol.join(', ')}] + top Volume [${topVolm.join(', ')}] blocks.`,
      volatilityBlocks: topVol,
      volumeBlocks: topVolm,
      targetMultiplier: 1.15,
      stopMultiplier: 0.92
    };
    this._saveState();
    return this.state.synthesizedCustomStrategy;
  }

  getOverview() {
    return {
      volatilityOptions: Object.values(VOLATILITY_OPTIONS).map(o => ({
        ...o,
        learnedWeight: this.state.blockWeights[o.id] || 1.0
      })),
      volumeOptions: Object.values(VOLUME_OPTIONS).map(o => ({
        ...o,
        learnedWeight: this.state.blockWeights[o.id] || 1.0
      })),
      builtinTemplates: BUILTIN_STRATEGY_TEMPLATES.map(t => ({
        ...t,
        performance: this.state.strategyPerformance[t.strategyId] || { wins: 0, losses: 0, netPnlUsd: 0, weight: 1.0 }
      })),
      synthesizedCustomStrategy: {
        ...this.state.synthesizedCustomStrategy,
        performance: this.state.strategyPerformance.STRAT_CUSTOM_LEARNER_SYNTH || { wins: 0, losses: 0, netPnlUsd: 0, weight: 1.05 }
      }
    };
  }
}

export default new InHouseStrategyBuilder();
