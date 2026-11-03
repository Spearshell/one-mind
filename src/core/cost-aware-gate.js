/**
 * Cost-Aware Execution Gate (Ported & Enhanced from Ready/212/lib/cost-aware-gate.mjs)
 * Implements arXiv:2606.00060 ("Trading Under Transaction Costs"):
 * - Explicitly computes round-trip spread, LP pool fee, and gas drag before entry.
 * - Blocks any trade whose expected move does not clear >= 2.8x round-trip friction.
 * - Self-tunes minimum required score based on rolling realized net PnL.
 *
 * Backtest fix (2026-11-02): T212 buys are only allowed inside the New York entry window (default 09:45-15:30,
 * see core/market-hours.js) and the friction includes Trading212's 0.15% currency-conversion fee per side
 * (GBP account buying USD shares; set T212_FX_FEE_PCT=0 if you trade from a USD balance).
 */

import { inEntryWindow, entryWindow, envNum } from './market-hours.js';

export class CostAwareGate {
  constructor() {
    this.platformFriction = {
      T212: {
        feePerSidePct: 0.05 + envNum('T212_FX_FEE_PCT', 0.15), // spread/execution + Trading212 FX conversion fee
        slippagePerSidePct: 0.03,
        fixedGasUsd: 0.00
      },
      DEX: {
        feePerSidePct: 0.25,   // 1inch / Uniswap V3 single-hop LP fee (~25 bps)
        slippagePerSidePct: 0.08,
        fixedGasUsd: 0.012     // Ethereum / Base low-gwei execution gas (~$0.012)
      }
    };
    this.rollingTrades = { T212: [], DEX: [] };
    this.dynamicScoreFloor = { T212: 64, DEX: 66 };
  }

  /**
   * Computes exact round-trip friction percentage for a given trade size (USD)
   */
  computeRoundTripCostPct(platformType = 'DEX', notionalUsd = 25.0) {
    const f = this.platformFriction[platformType] || this.platformFriction.DEX;
    const variableRoundTripPct = (f.feePerSidePct + f.slippagePerSidePct) * 2;
    const gasRoundTripPct = notionalUsd > 0 ? ((f.fixedGasUsd * 2) / notionalUsd) * 100 : 0;
    return Number((variableRoundTripPct + gasRoundTripPct).toFixed(3));
  }

  /**
   * Evaluates whether a candidate trade clears the Cost-Aware Gate
   */
  evaluateGate({ platformType = 'DEX', score = 70, targetGainPct = 3.0, atrPct = 1.5, notionalUsd = 25.0 }) {
    const roundTripCostPct = this.computeRoundTripCostPct(platformType, notionalUsd);
    const minRequiredScore = this.dynamicScoreFloor[platformType] || 65;

    if (platformType === 'T212' && !inEntryWindow()) {
      return {
        passed: false,
        roundTripCostPct,
        reason: `Outside the buy window (${entryWindow()?.label || ''} New York time) - no pre-market / after-hours buys`
      };
    }

    if (score < minRequiredScore) {
      return {
        passed: false,
        roundTripCostPct,
        reason: `Blocked by Cost-Aware Gate: Score ${score} < Dynamic Floor ${minRequiredScore}`
      };
    }

    const expectedMovePct = Math.max(targetGainPct, atrPct * 1.2);
    const costMultiple = roundTripCostPct > 0 ? expectedMovePct / roundTripCostPct : 10;

    if (costMultiple < 2.5) {
      return {
        passed: false,
        roundTripCostPct,
        reason: `Anti-Bleed Filter: Expected move (+${expectedMovePct.toFixed(2)}%) is only ${costMultiple.toFixed(1)}x round-trip friction (${roundTripCostPct}%)`
      };
    }

    return {
      passed: true,
      roundTripCostPct,
      costMultiple: Number(costMultiple.toFixed(2)),
      netExpectedGainPct: Number((targetGainPct - roundTripCostPct).toFixed(2)),
      reason: `Clears Cost-Aware Gate (${costMultiple.toFixed(1)}x friction coverage; RT cost ${roundTripCostPct}%)`
    };
  }

  /**
   * Records closed trade outcome to self-tune the confidence floor
   */
  recordClosedTrade(platformType, netPnlPct) {
    const list = this.rollingTrades[platformType] || [];
    list.push(Number(netPnlPct || 0));
    if (list.length > 20) list.shift();
    this.rollingTrades[platformType] = list;

    if (list.length >= 3) {
      const avgNet = list.reduce((a, b) => a + b, 0) / list.length;
      if (avgNet < 0) {
        this.dynamicScoreFloor[platformType] = Math.min(82, (this.dynamicScoreFloor[platformType] || 65) + 3);
      } else if (avgNet > 0.5) {
        this.dynamicScoreFloor[platformType] = Math.max(62, (this.dynamicScoreFloor[platformType] || 65) - 1);
      }
    }
  }
}

export default new CostAwareGate();
