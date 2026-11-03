/**
 * S-Tier / T-Tier / A-Tier Multi-Factor Classification & Capital Allocation Engine
 * Unified across Stocks (Trading212) and Crypto (MetaMask DEX):
 * - TradingView Built-In Volatility & Volume Strategy Suite (TTM Squeeze, ATR/PSAR, VWAP+VWMA, RVOL+MFI, Channel %B)
 * - Hydra 4-Layer Confluence (Ready/212)
 * - ScanTrade Liquidity Sweep & Orderflow OBI (cexio-trading-bot + New bot 2026)
 * - Anti-Chase & Falling-Knife Filters (solana-sniper-bot)
 */

import chartMicro from '../addons/chart-microstructure.js';
import tvVolStrategy from '../addons/tv-volatility-volume-strategy.js';
import learnerGuardian from './learner-guardian.js';
import { envFlag, envNum } from './market-hours.js';

/**
 * Backtest fix (2026-11-02): the old stop (max 1.65%) sat inside the normal 1-minute noise of stocks that move
 * 5-10% a day, so most trades were stopped out before they could work. Stops now scale with the stock's daily
 * volatility: stop = 0.5 x max(ATR%, Volatility.D), kept between 1.5% and 4%.
 * .env: T212_WIDE_STOPS=false to go back, or tune T212_STOP_VOL_MULT / T212_STOP_MIN_PCT / T212_STOP_MAX_PCT.
 */
function volatilityStopPct(candidate, oldStopPct, platformType) {
  if (platformType !== 'T212' || !envFlag('T212_WIDE_STOPS', true)) return oldStopPct;
  const vol = Math.max(Number(candidate.atrPct || 0), Number(candidate.volatilityD || 0));
  const stop = vol * envNum('T212_STOP_VOL_MULT', 0.5);
  return Number(Math.min(envNum('T212_STOP_MAX_PCT', 4), Math.max(envNum('T212_STOP_MIN_PCT', 1.5), stop)).toFixed(2));
}

export class TierClassifier {
  /**
   * Evaluates a live market candidate (Trading212 Equity/Commodity OR MetaMask DEX Token)
   * and classifies it into S-TIER, T-TIER, A-TIER, or DECLINED.
   */
  classify(candidate, platformType = 'DEX', learnedWeights = { S: 1.0, T: 1.0, A: 1.0 }) {
    const micro = chartMicro.analyzeCandidate(candidate);
    const featureWeights = learnerGuardian.getFeatureWeights();
    const tvVol = tvVolStrategy.evaluate(candidate, platformType, featureWeights);

    // 1. Pre-Entry Anti-Chase & Falling-Knife Filters (ported from solana-sniper-bot/src/strategy.js)
    const ch1h = Number(candidate.change1h || 0);
    const ch24h = Number(candidate.change24h || 0);
    const rsi = Number(candidate.rsi || 50);
    const adx = Number(candidate.adx || 18);
    const relVol = Number(candidate.relativeVolume || 1.0);
    const macdHist = Number(candidate.macdHistogram || 0);

    if (candidate.chartHeading === 'BLEEDING_BEARISH' || ch24h < -1.0 || Number(candidate.change15m || 0) < -0.10) {
      return this._decline(
        candidate,
        micro,
        tvVol,
        22,
        `Live Chart Bleeding ▼: Price ($${candidate.price}) below Live VWAP ($${candidate.vwap}) / Support Line (15m: ${candidate.change15m || 0}%, 24h: ${ch24h.toFixed(2)}%)`
      );
    }
    // Entry filters (2026-11-03, env-controlled, off unless the backtest supports them)
    const maxChg24h = Number(process.env.T212_MAX_CHANGE24H_PCT || 0);
    if (platformType === 'T212' && maxChg24h > 0 && ch24h > maxChg24h) {
      return this._decline(candidate, micro, tvVol, 30, `Anti-chase: already +${ch24h.toFixed(2)}% today (limit +${maxChg24h}%)`);
    }
    const minChg24h = Number(process.env.T212_MIN_CHANGE24H_PCT || 0);
    if (platformType === 'T212' && minChg24h > 0 && ch24h < minChg24h) {
      return this._decline(candidate, micro, tvVol, 30, `Not in play: +${ch24h.toFixed(2)}% today (needs +${minChg24h}%)`);
    }
    const maxVwapExt = Number(process.env.T212_MAX_VWAP_EXT_PCT || 0);
    const vwapNow = Number(candidate.vwap || 0);
    if (platformType === 'T212' && maxVwapExt > 0 && vwapNow > 0 && (Number(candidate.price) / vwapNow - 1) * 100 > maxVwapExt) {
      return this._decline(candidate, micro, tvVol, 30, `Too far above VWAP (${((Number(candidate.price) / vwapNow - 1) * 100).toFixed(2)}% > ${maxVwapExt}%)`);
    }
    if (ch1h < -8) {
      return this._decline(candidate, micro, tvVol, 25, `Falling knife protection: ${ch1h.toFixed(2)}% drop in 1h`);
    }
    if (platformType === 'DEX' && ch24h > 180) {
      return this._decline(candidate, micro, tvVol, 35, `Anti-chase protection: +${ch24h.toFixed(0)}% in 24h (distribution risk)`);
    }
    if (rsi > 78 && ch1h > 12) {
      return this._decline(candidate, micro, tvVol, 40, `Blow-off top exhaustion: RSI ${rsi.toFixed(1)} with overextended 1h spike`);
    }
    if (platformType === 'DEX' && (candidate.liquidityUsd || 0) < 25000) {
      return this._decline(candidate, micro, tvVol, 20, `Shallow DEX pool ($${Math.round(candidate.liquidityUsd || 0).toLocaleString()} < $25,000 minimum)`);
    }

    // 2. Evaluate Hydra 4-Layer Confluence + TradingView Volatility & Volume Strategy
    const layers = {
      regime: (micro.trendAligned && adx >= 18) || tvVol.abovePsar,
      orderFlow: relVol >= 1.15 || micro.obi >= 0.14 || (tvVol.aboveVwap && tvVol.vwmaBullish),
      catalystTv: candidate.tvRating === 'STRONG_BUY' || (candidate.tvRating === 'BUY' && ch1h >= 0.25) || tvVol.confirmedCount >= 4,
      structure: micro.bos.signal === 'BUY' || micro.sweep.isSweep || tvVol.isExpansionBreakout || (macdHist >= 0 && rsi >= 52 && rsi <= 74 && ch24h > 0.4)
    };

    const confirmedCount = Object.values(layers).filter(Boolean).length;

    // 3. Calculate Granular Multi-Factor Composite Score (blending Hydra Confluence + TV Volatility/Volume Strategy)
    let hydraScore = 36;
    if (layers.regime) hydraScore += 12 + Math.min(5, Math.round((adx - 18) * 0.25));
    if (layers.orderFlow) hydraScore += 12 + Math.min(7, Math.round((relVol - 1.0) * 4));
    if (layers.catalystTv) hydraScore += candidate.tvRating === 'STRONG_BUY' ? 15 : 10;
    if (layers.structure) hydraScore += micro.bos.signal === 'BUY' ? 13 : 9;
    if (micro.sweep.isSweep) hydraScore += 6;
    if (ch1h > 0.5) hydraScore += Math.min(6, Math.round(ch1h * 1.4));

    // Blend 55% Hydra Microstructure + 45% TradingView Volatility & Volume Strategy Builder Score
    let score = Math.round(hydraScore * 0.55 + tvVol.strategyScore * 0.45);
    score = Math.max(0, Math.min(99, score));

    // 4. Tier Assignment & Volatility-Scaled Execution Profile
    if (score >= 83 && confirmedCount === 4 && tvVol.confirmedCount >= 3) {
      const adjScore = Math.min(99, Math.round(score * (learnedWeights.S || 1.0)));
      return {
        accepted: true,
        tier: 'S-TIER',
        tierName: 'Sovereign Volatility & Volume Confluence',
        score: adjScore,
        confluenceLayers: `${confirmedCount}/4`,
        tvVolConfirmed: `${tvVol.confirmedCount}/5`,
        activeSignals: tvVol.activeSignals,
        tvVolStrategy: tvVol,
        allocationPct: 0.32, // $32 on $100 portfolio
        targetGainPct: Number((tvVol.dynamicTargetPct * 1.15).toFixed(2)),
        stopLossPct: volatilityStopPct(candidate, tvVol.dynamicStopPct, platformType),
        stagnationMaxMin: platformType === 'T212' ? 45 : 30,
        ladderSteps: tvVol.dynamicLadders,
        microstructure: micro,
        rationale: `[S-TIER 4/4 • TV Vol/Vol ${tvVol.confirmedCount}/5] ${tvVol.summaryTag} | TV: ${candidate.tvRating}`
      };
    }

    if (score >= 71 && confirmedCount >= 3 && tvVol.confirmedCount >= 2) {
      const adjScore = Math.min(95, Math.round(score * (learnedWeights.T || 1.0)));
      return {
        accepted: true,
        tier: 'T-TIER',
        tierName: 'Tactical Volatility & Volume Scalper',
        score: adjScore,
        confluenceLayers: `${confirmedCount}/4`,
        tvVolConfirmed: `${tvVol.confirmedCount}/5`,
        activeSignals: tvVol.activeSignals,
        tvVolStrategy: tvVol,
        allocationPct: 0.24, // $24 on $100 portfolio
        targetGainPct: tvVol.dynamicTargetPct,
        stopLossPct: volatilityStopPct(candidate, tvVol.dynamicStopPct, platformType),
        stagnationMaxMin: platformType === 'T212' ? 30 : 20,
        ladderSteps: tvVol.dynamicLadders,
        microstructure: micro,
        rationale: `[T-TIER (${confirmedCount}/4) • TV Vol/Vol ${tvVol.confirmedCount}/5] ${tvVol.summaryTag} | 1h: ${ch1h >= 0 ? '+' : ''}${ch1h}%`
      };
    }

    if (score >= 63 && confirmedCount >= 2 && (micro.sweep.isSweep || tvVol.confirmedCount >= 3 || layers.structure)) {
      const adjScore = Math.min(90, Math.round(score * (learnedWeights.A || 1.0)));
      return {
        accepted: true,
        tier: 'A-TIER',
        tierName: 'Algorithmic Liquidity Sweep & Vol Rebound',
        score: adjScore,
        confluenceLayers: `${confirmedCount}/4`,
        tvVolConfirmed: `${tvVol.confirmedCount}/5`,
        activeSignals: tvVol.activeSignals,
        tvVolStrategy: tvVol,
        allocationPct: 0.18, // $18 on $100 portfolio
        targetGainPct: Number((tvVol.dynamicTargetPct * 0.85).toFixed(2)),
        stopLossPct: volatilityStopPct(candidate, Number((tvVol.dynamicStopPct * 0.90).toFixed(2)), platformType),
        stagnationMaxMin: platformType === 'T212' ? 25 : 18,
        ladderSteps: tvVol.dynamicLadders,
        microstructure: micro,
        rationale: `[A-TIER (${confirmedCount}/4) • TV Vol/Vol ${tvVol.confirmedCount}/5] ${tvVol.summaryTag}`
      };
    }

    return this._decline(
      candidate,
      micro,
      tvVol,
      score,
      `Filtered out: Score ${score}/100, Confluence ${confirmedCount}/4, TV Vol/Vol ${tvVol.confirmedCount}/5 (${tvVol.summaryTag})`
    );
  }

  _decline(candidate, micro, tvVol, score, reason) {
    return {
      accepted: false,
      tier: 'DECLINED',
      tierName: 'Filtered Out',
      score,
      confluenceLayers: '0/4',
      tvVolConfirmed: `${tvVol?.confirmedCount || 0}/5`,
      activeSignals: tvVol?.activeSignals || [],
      tvVolStrategy: tvVol,
      allocationPct: 0,
      microstructure: micro,
      rationale: reason
    };
  }
}

export default new TierClassifier();
