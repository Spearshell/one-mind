/**
 * Unified Chart Reading & Market Microstructure Engine
 * Synthesized from:
 * 1. Ready/212/lib/chart-analysis.mjs (Break of Structure, Candlestick Reversals, Volume Climax)
 * 2. Metamask 2026/cexio-trading-bot/src/scantrade-quant.js (Bullish Liquidity Sweep & Bollinger Squeeze)
 * 3. Ready/shared/live-demo/lib/hybrid-trader.mjs (Hurst Exponent Regime Classifier)
 * 4. Ready/hft_bot_core.py (Volume-Weighted Microprice & Order Book Imbalance)
 */

export class ChartMicrostructureEngine {
  constructor() {
    this.priceHistory = new Map(); // key -> array of { o, h, l, c, v, ts }
  }

  /**
   * Records a price/candle tick into rolling memory for real-time structure analysis
   */
  recordTick(symbol, { open, high, low, close, volume = 0 }) {
    const key = String(symbol).toUpperCase();
    const list = this.priceHistory.get(key) || [];
    const c = Number(close || 0);
    if (c <= 0) return list;

    list.push({
      o: Number(open || c),
      h: Number(high || c * 1.002),
      l: Number(low || c * 0.998),
      c,
      v: Number(volume || 0),
      ts: Date.now()
    });

    if (list.length > 60) list.shift();
    this.priceHistory.set(key, list);
    return list;
  }

  /**
   * Computes Hurst Exponent (H) to classify market regime:
   * - H > 0.55: Persistent Trending Regime (Momentum / Breakout favorable)
   * - H < 0.45: Mean-Reverting Regime (Liquidity Sweep / Dip-Buy favorable)
   * - 0.45 <= H <= 0.55: Geometric Brownian Noise
   */
  computeHurst(closes = []) {
    if (!Array.isArray(closes) || closes.length < 12) return 0.54;
    const slice = closes.slice(-32);
    const returns = [];
    for (let i = 1; i < slice.length; i++) {
      if (slice[i] > 0 && slice[i - 1] > 0) {
        returns.push(Math.log(slice[i] / slice[i - 1]));
      }
    }
    const n = returns.length;
    if (n < 8) return 0.54;
    const mean = returns.reduce((a, b) => a + b, 0) / n;
    let cumDev = 0;
    let maxDev = -Infinity;
    let minDev = Infinity;
    let varSum = 0;
    for (let i = 0; i < n; i++) {
      const dev = returns[i] - mean;
      cumDev += dev;
      if (cumDev > maxDev) maxDev = cumDev;
      if (cumDev < minDev) minDev = cumDev;
      varSum += dev * dev;
    }
    const std = Math.sqrt(varSum / n);
    if (std === 0) return 0.5;
    const rs = (maxDev - minDev) / std;
    if (rs <= 0) return 0.5;
    const h = Math.log(rs) / Math.log(n);
    return Number(Math.max(0.2, Math.min(0.85, h)).toFixed(3));
  }

  /**
   * Detects Break of Structure (BOS) using swing high/low pivots
   */
  detectBreakOfStructure(bars = []) {
    if (!bars || bars.length < 6) {
      return { signal: 'NEUTRAL', confidence: 0, reason: 'Accumulating structure bars' };
    }
    const prior = bars.slice(0, -1);
    const cur = bars[bars.length - 1];
    const swingHigh = Math.max(...prior.map(b => b.h));
    const swingLow = Math.min(...prior.map(b => b.l));

    if (cur.c > swingHigh && swingHigh > 0) {
      return {
        signal: 'BUY',
        confidence: 0.85,
        pattern: 'BOS_BULLISH',
        reason: `Bullish Break-of-Structure: Closed (${cur.c.toFixed(4)}) above swing high (${swingHigh.toFixed(4)})`
      };
    }
    if (cur.c < swingLow && swingLow > 0) {
      return {
        signal: 'SELL',
        confidence: 0.85,
        pattern: 'BOS_BEARISH',
        reason: `Bearish Break-of-Structure: Closed (${cur.c.toFixed(4)}) below swing low (${swingLow.toFixed(4)})`
      };
    }
    return { signal: 'NEUTRAL', confidence: 0.5, pattern: 'INSIDE_STRUCTURE', reason: 'Trading inside recent swing structure' };
  }

  /**
   * Detects Bullish Liquidity Sweep (Sweep below equal lows followed by rapid reclamation)
   */
  detectLiquiditySweep(bars = [], candidate = {}) {
    const change5m = Number(candidate.change5m || 0);
    const change1h = Number(candidate.change1h || 0);
    const rsi = Number(candidate.rsi || 50);

    // Classic liquidity sweep signature: oversold dip or 1h pullback followed by strong 5m buyer reclamation
    if ((rsi < 42 || change1h < -0.5) && change5m >= 0.35) {
      return {
        isSweep: true,
        confidence: 0.82,
        reason: `Bullish Liquidity Sweep: Sellers exhausted (RSI ${rsi.toFixed(1)}), aggressive +${change5m.toFixed(2)}% buyer reclamation`
      };
    }

    if (bars.length >= 4) {
      const prevLow = Math.min(...bars.slice(-4, -1).map(b => b.l));
      const cur = bars[bars.length - 1];
      if (cur.l < prevLow && cur.c > prevLow && cur.c > cur.o) {
        return {
          isSweep: true,
          confidence: 0.88,
          reason: `Stop-Run Wick Reversal: Swept below ${prevLow.toFixed(4)} and closed green at ${cur.c.toFixed(4)}`
        };
      }
    }

    return { isSweep: false, confidence: 0, reason: 'No sweep detected' };
  }

  /**
   * Computes Order Book Imbalance (OBI) & Buyer Dominance Score (-1.0 to +1.0)
   */
  computeOrderFlowImbalance(candidate = {}) {
    const buys = Number(candidate.buys1h ?? candidate.buys5m ?? 0);
    const sells = Number(candidate.sells1h ?? candidate.sells5m ?? 0);
    if (buys + sells > 0) {
      const obi = (buys - sells) / (buys + sells);
      return Number(obi.toFixed(3));
    }
    // Fallback for Equities using TradingView Oscillator + Relative Volume + Intraday push
    const tvScore = Number(candidate.tvScore || 0);
    const relVol = Number(candidate.relativeVolume || 1.0);
    const push = Number(candidate.change15m || candidate.change1h || 0);
    const syntheticObi = Math.max(-1, Math.min(1, (tvScore * 0.6) + (push > 0 ? 0.25 : -0.25) * Math.min(1.5, relVol)));
    return Number(syntheticObi.toFixed(3));
  }

  /**
   * Full Composite Microstructure Audit for any Candidate (Equity or Crypto DEX)
   */
  analyzeCandidate(candidate) {
    const bars = this.recordTick(candidate.symbol, {
      open: candidate.price * (1 - (candidate.change5m || 0) / 100),
      high: candidate.bbUpper || candidate.price * 1.01,
      low: candidate.bbLower || candidate.price * 0.99,
      close: candidate.price,
      volume: candidate.volume || candidate.volume24h || 0
    });

    const closes = bars.map(b => b.c);
    const hurst = this.computeHurst(closes);
    const bos = this.detectBreakOfStructure(bars);
    const sweep = this.detectLiquiditySweep(bars, candidate);
    const obi = this.computeOrderFlowImbalance(candidate);

    const price = Number(candidate.price || 0);
    const ema20 = Number(candidate.ema20 || price);
    const ema50 = Number(candidate.ema50 || price);
    const trendAligned = price >= ema20 && ema20 >= ema50 * 0.995;

    const regime = hurst >= 0.55
      ? 'TRENDING_EXPANSION'
      : (hurst <= 0.45 ? 'MEAN_REVERSION_SWEEP' : 'BALANCED_FLOW');

    return {
      hurst,
      regime,
      bos,
      sweep,
      obi,
      trendAligned,
      buyerSharePct: Number((((obi + 1) / 2) * 100).toFixed(1))
    };
  }
}

export default new ChartMicrostructureEngine();
