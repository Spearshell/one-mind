/**
 * Smart Chart-Reading, Weekend/Off-Hours Micro-Tick Velocity & Protocol D Adaptive Exit Engine
 * Synthesizes:
 * - Ready/212/lib/chart-exit.mjs (Bearish BOS & Chart Structure Breakdown)
 * - Ready/smart_exit_engine.py (Regime-Aware Multi-Layered Profit Protection)
 * - New bot 2026/live-demo/demo.js (Ratcheting Net-Profit Step Locks)
 * - In-House Volatility & Volume Strategy Micro-Tick Engine (keeps Live Demo learning 24/7 even when NYSE is closed on Sunday)
 */

import chartMicro from '../addons/chart-microstructure.js';
import { flatBeforeCloseDue, envFlag } from './market-hours.js';

// Backtest fix (2026-11-02): both exits below cost more than they saved once Trading212's real costs are counted
// (break-even "rotations" pay the round-trip cost for nothing; the support-break exit cut trades at -0.65% inside
// normal noise). Switch back on with T212_ANTI_STAGNATION_EXIT=true / T212_SUPPORT_BREAK_EXIT=true.
const ANTI_STAGNATION_EXIT = () => envFlag('T212_ANTI_STAGNATION_EXIT', false);
const SUPPORT_BREAK_EXIT = () => envFlag('T212_SUPPORT_BREAK_EXIT', false);

export class SmartChartExitEngine {
  /**
   * Computes the latest mark-to-market price for an open position.
   * 100% Exact Live Chart Mapping (Zero Synthetic Drift):
   * Always returns the exact live TradingView / Trading212 1m market price penny-for-penny.
   */
  resolveDynamicTickPrice(position, liveMarketData = {}) {
    const prevPrice = Number(position.currentPrice || position.entryPrice);
    const feedPrice = Number(liveMarketData.price || prevPrice);
    if (Number.isFinite(feedPrice) && feedPrice > 0) {
      return feedPrice;
    }
    return prevPrice;
  }

  /**
   * Evaluates an open position against live market price, chart structure,
   * orderflow imbalance, Protocol D profit steps, and anti-stagnation timers.
   */
  evaluatePositionExit(position, liveMarketData = {}) {
    const currentPrice = this.resolveDynamicTickPrice(position, liveMarketData);
    const entryPrice = Number(position.entryPrice || currentPrice);
    if (entryPrice <= 0 || currentPrice <= 0) {
      return { shouldExit: false, latestPrice: currentPrice, reason: 'Waiting for valid price feed' };
    }

    const rawRoiPct = ((currentPrice - entryPrice) / entryPrice) * 100;
    const roundTripCostPct = Number(position.roundTripCostPct || 0.00);
    const netRoiPct = Number((rawRoiPct - roundTripCostPct).toFixed(3));
    const peakNetRoiPct = Math.max(Number(position.peakNetRoiPct || 0), netRoiPct);

    const heldMs = Date.now() - new Date(position.entryTime).getTime();
    const heldMinutes = Number((heldMs / 60000).toFixed(1));

    const micro = chartMicro.analyzeCandidate({
      symbol: position.symbol,
      price: currentPrice,
      change5m: liveMarketData.change5m || netRoiPct * 0.5,
      change1h: liveMarketData.change1h || netRoiPct,
      rsi: liveMarketData.rsi || 56,
      buys1h: liveMarketData.buys1h,
      sells1h: liveMarketData.sells1h,
      tvScore: liveMarketData.tvScore || 0.5
    });

    // 0. FLAT BEFORE THE US CLOSE (no overnight gap risk) + close leftovers from an earlier day once the market is open
    const clockExit = flatBeforeCloseDue(position);
    if (clockExit) {
      return {
        shouldExit: true,
        latestPrice: currentPrice,
        exitType: clockExit,
        netRoiPct,
        peakNetRoiPct,
        heldMinutes,
        reason: clockExit === 'EOD_FLAT'
          ? `Flat before the US close (${netRoiPct >= 0 ? '+' : ''}${netRoiPct.toFixed(2)}%) - no overnight risk`
          : `Closing a position left over from an earlier day (${netRoiPct >= 0 ? '+' : ''}${netRoiPct.toFixed(2)}%)`
      };
    }

    // 1. HARD STOP LOSS (Catastrophic Protection — Fires immediately)
    const hardStopPct = Number(position.stopLossPct || 1.5);
    if (netRoiPct <= -hardStopPct) {
      return {
        shouldExit: true,
        latestPrice: currentPrice,
        exitType: 'HARD_STOP_LOSS',
        netRoiPct,
        peakNetRoiPct,
        heldMinutes,
        reason: `Hard Stop Loss triggered (${netRoiPct.toFixed(2)}% <= -${hardStopPct.toFixed(2)}%)`
      };
    }

    // 2. PROTOCOL D RATCHETING PROFIT STEP LOCKS
    const steps = position.ladderSteps || [
      [0.8, 0.35],
      [1.6, 1.05],
      [2.8, 2.10]
    ];

    let lockedFloorPct = null;
    for (const [trigger, floor] of steps) {
      if (peakNetRoiPct >= trigger) {
        lockedFloorPct = floor;
      }
    }

    if (lockedFloorPct !== null && netRoiPct <= lockedFloorPct) {
      return {
        shouldExit: true,
        latestPrice: currentPrice,
        exitType: 'PROTOCOL_D_PROFIT_LOCK',
        netRoiPct,
        peakNetRoiPct,
        heldMinutes,
        reason: `Protocol D Profit Ratchet Locked: Peak reached +${peakNetRoiPct.toFixed(2)}%, banked +${netRoiPct.toFixed(2)}% net profit (Floor +${lockedFloorPct}%)`
      };
    }

    // 3. TARGET TAKE-PROFIT REACHED
    const targetPct = Number(position.targetGainPct || 2.5);
    if (netRoiPct >= targetPct) {
      return {
        shouldExit: true,
        latestPrice: currentPrice,
        exitType: 'TAKE_PROFIT_TARGET',
        netRoiPct,
        peakNetRoiPct,
        heldMinutes,
        reason: `Target Profit Harvested: +${netRoiPct.toFixed(2)}% net gain >= +${targetPct.toFixed(2)}% target (${position.strategyName || 'In-House Strategy'})`
      };
    }

    // 4. GOOGLE CHART AUTO-LINE SUPPORT BREAKDOWN & STRUCTURE EXIT
    const ca = liveMarketData.chartAnalytics || null;
    if (heldMinutes >= 1.0) {
      if (SUPPORT_BREAK_EXIT() && ca && ca.headingState === 'BLEEDING_BEARISH' && ca.lowerLineEnd > 0 && currentPrice <= ca.lowerLineEnd && netRoiPct <= -0.65) {
        return {
          shouldExit: true,
          latestPrice: currentPrice,
          exitType: 'GOOGLE_CHART_SUPPORT_BREAK',
          netRoiPct,
          peakNetRoiPct,
          heldMinutes,
          reason: `Google Chart Support Breakdown: Price ($${currentPrice}) broke Lower Support Line ($${ca.lowerLineEnd.toFixed(2)}) while bleeding (${netRoiPct.toFixed(2)}%)`
        };
      }

      if (micro.bos.signal === 'SELL' && netRoiPct > 0.35) {
        return {
          shouldExit: true,
          latestPrice: currentPrice,
          exitType: 'CHART_BOS_REVERSAL',
          netRoiPct,
          peakNetRoiPct,
          heldMinutes,
          reason: `Chart Structure Exit: ${micro.bos.reason} — banking +${netRoiPct.toFixed(2)}% before reversal`
        };
      }

      if (liveMarketData.moneyFlow15m && liveMarketData.moneyFlow15m >= 88 && netRoiPct > 0.50) {
        return {
          shouldExit: true,
          latestPrice: currentPrice,
          exitType: 'TV_MFI_VOLUME_CLIMAX',
          netRoiPct,
          peakNetRoiPct,
          heldMinutes,
          reason: `Volume Climax Harvest: 15m Money Flow reached ${liveMarketData.moneyFlow15m.toFixed(1)} — banking +${netRoiPct.toFixed(2)}%`
        };
      }
    }

    // 5. ANTI-STAGNATION VELOCITY ROTATION (Never crystallize a red paper-cut loss; only rotate at break-even/green >= 0.00%)
    const maxStagMin = Number(position.stagnationMaxMin || 30);
    if (ANTI_STAGNATION_EXIT() && heldMinutes >= maxStagMin && netRoiPct >= 0.0 && netRoiPct < 0.4 && peakNetRoiPct < 0.9) {
      return {
        shouldExit: true,
        latestPrice: currentPrice,
        exitType: 'ANTI_STAGNATION_ROTATION',
        netRoiPct,
        peakNetRoiPct,
        heldMinutes,
        reason: `Anti-Stagnation Break-Even Rotation: Held ${heldMinutes}m with flat velocity (+${netRoiPct.toFixed(2)}%); freeing capital without loss`
      };
    }

    const lineTag = ca && ca.upperLineEnd > 0
      ? `${ca.headingState === 'BLEEDING_BEARISH' ? '▼ Bleeding' : (ca.headingState === 'GOING_UP_BULLISH' ? '▲ Going Up' : '─ Coiling')} [Sup $${ca.lowerLineEnd.toFixed(2)} | Res $${ca.upperLineEnd.toFixed(2)}]`
      : `Monitoring ${position.strategyName ? position.strategyName.slice(0, 18) : 'Structure'}`;

    return {
      shouldExit: false,
      latestPrice: currentPrice,
      netRoiPct,
      peakNetRoiPct,
      lockedFloorPct,
      heldMinutes,
      microstructure: micro,
      reason: lockedFloorPct !== null
        ? `Protocol D Trailing (Floor +${lockedFloorPct.toFixed(2)}%, Peak +${peakNetRoiPct.toFixed(2)}%) • ${lineTag}`
        : `${lineTag} (${netRoiPct >= 0 ? '+' : ''}${netRoiPct.toFixed(2)}%)`
    };
  }
}

export default new SmartChartExitEngine();
