/**
 * TradingView & In-House Volatility + Volume Strategy Suite (100% Standalone + TV Connected)
 * Combines:
 * 1. In-House Volatility Engine (TTM Bollinger/Keltner Squeeze, Volatility.D/W Expansion, ATR+P.SAR, %B, Channel, Bandwidth)
 * 2. In-House Volume Engine (Dual-VWAP Anchor, VWMA > SMA20 Accumulation, RVOL 10d Surge, MFI 14 Smart Flow, 15m MFI Accel, Depth)
 * 3. Autonomous Strategy Finder (Matches every stock to the highest-expectancy built-in or Learner-synthesized strategy)
 */

import inhouseBuilder from './inhouse-strategy-builder.js';

export class TvVolatilityVolumeStrategy {
  /**
   * Evaluates a candidate using the In-House Volatility, Volume & Strategy Finder Suite
   */
  evaluate(c, platformType = 'T212', featureWeights = {}) {
    const weights = {
      volSqueeze: Number(featureWeights.volSqueeze || 1.0),
      atrTrend: Number(featureWeights.atrTrend || 1.0),
      vwapVolume: Number(featureWeights.vwapVolume || 1.0),
      rvolMfi: Number(featureWeights.rvolMfi || 1.0),
      channelBreakout: Number(featureWeights.channelBreakout || 1.0)
    };

    const price = Number(c.price || 0);
    const ch15m = Number(c.change15m || 0);
    const ch1h = Number(c.change1h || 0);
    const ch24h = Number(c.change24h || 0);

    // --- VOLATILITY PRIMITIVES (Daily + 15m Intraday) ---
    const atr = Number(c.atr || price * (platformType === 'T212' ? 0.018 : 0.035));
    const atr15m = Number(c.atr15m || atr * 0.20);
    const atrPct = price > 0 ? Number(c.atrPct || ((atr / price) * 100)) : 1.8;
    const atr15mPct = price > 0 ? Number(c.atr15mPct || ((atr15m / price) * 100)) : 0.45;

    const volatilityD = Number(c.volatilityD || atrPct || 1.8);
    const volatilityW = Number(c.volatilityW || volatilityD);
    const volExpansionRatio = volatilityW > 0 ? Number((volatilityD / volatilityW).toFixed(2)) : 1.0;

    const ema20 = Number(c.ema20 || price);
    const sma20 = Number(c.sma20 || ema20 || price);
    const ema20_15m = Number(c.ema20_15m || price);

    const bbUpper = Number(c.bbUpper || price * 1.02);
    const bbLower = Number(c.bbLower || price * 0.98);
    const bbUpper15m = Number(c.bbUpper15m || price * 1.01);
    const bbLower15m = Number(c.bbLower15m || price * 0.99);

    // Exact In-House Keltner Channel (EMA20 +/- 1.5 * ATR)
    const kcUpper = ema20 + 1.5 * atr;
    const kcLower = ema20 - 1.5 * atr;
    const kcUpper15m = ema20_15m + 1.5 * atr15m;
    const kcLower15m = ema20_15m - 1.5 * atr15m;

    const bbWidthPct = sma20 > 0 ? ((bbUpper - bbLower) / sma20) * 100 : 4.0;
    const kcWidthPct = ema20 > 0 ? ((kcUpper - kcLower) / ema20) * 100 : 4.0;

    // Bollinger %B
    const bbRange = Math.max(1e-9, bbUpper - bbLower);
    const bbRange15m = Math.max(1e-9, bbUpper15m - bbLower15m);
    const percentB = Number(((price - bbLower) / bbRange).toFixed(2));
    const percentB15m = Number(((price - bbLower15m) / bbRange15m).toFixed(2));

    // Parabolic SAR Volatility Stop
    const psar = Number(c.psar || price * 0.985);
    const psar15m = Number(c.psar15m || price * 0.992);

    // --- VOLUME PRIMITIVES (VWAP, VWMA, RVOL, MFI) ---
    const vwap = Number(c.vwap || price * 0.998);
    const vwap15m = Number(c.vwap15m || vwap);
    const vwma = Number(c.vwma || sma20);
    const vwma15m = Number(c.vwma15m || ema20_15m);
    const relVol = Number(c.relativeVolume || 1.0);
    const mfi = Number(c.moneyFlow !== undefined ? c.moneyFlow : (50 + ch1h * 2.5));
    const mfi15m = Number(c.moneyFlow15m !== undefined ? c.moneyFlow15m : mfi);

    // Session High / Low Channel Position
    const high = Number(c.high || price * 1.01);
    const low = Number(c.low || price * 0.99);
    const sessionRange = Math.max(1e-9, high - low);
    const rangePosition = Number(((price - low) / sessionRange).toFixed(2));

    // 1. TTM Bollinger + Keltner Volatility Squeeze & Breakout
    const isSqueezeCoiled = (bbUpper <= kcUpper && bbLower >= kcLower) ||
                            (bbUpper15m <= kcUpper15m && bbLower15m >= kcLower15m) ||
                            (bbWidthPct <= kcWidthPct * 1.08);
    const isExpansionBreakout = (percentB15m >= 0.65 || percentB >= 0.65) && (ch15m >= 0 || ch1h > 0.25) && volExpansionRatio >= 0.85;
    const s1Passed = (isSqueezeCoiled && (ch15m > 0 || ch1h > 0)) || isExpansionBreakout;
    const s1State = isSqueezeCoiled && isExpansionBreakout
      ? 'SQUEEZE_FIRING_UP'
      : (isExpansionBreakout ? 'VOL_EXPANSION_THRUST' : (isSqueezeCoiled ? 'SQUEEZE_COILING' : 'NORMAL_VOL'));

    // 2. ATR Volatility Stop & Parabolic SAR Trend Strategy
    const abovePsarDaily = price > psar;
    const abovePsar15m = price > psar15m;
    const healthyVolRegime = volatilityD >= 0.45 && volatilityD <= 38.0;
    const s2Passed = (abovePsarDaily || abovePsar15m) && healthyVolRegime && (ch1h >= -0.3);

    // 3. VWAP + VWMA Institutional Volume Accumulation Strategy
    const aboveVwap = price >= vwap * 0.998 || price >= vwap15m * 0.998;
    const vwmaBullish = vwma >= sma20 * 0.999 || vwma15m >= ema20_15m * 0.999;
    const s3Passed = aboveVwap && vwmaBullish;

    // 4. Relative Volume (RVOL) + Money Flow Index (MFI) Thrust
    const strongRvol = relVol >= 1.15;
    const healthyMfi = (mfi >= 48 && mfi <= 85) || (mfi15m >= 50 && mfi15m <= 86);
    const s4Passed = strongRvol && healthyMfi;

    // 5. Volatility Channel / Bollinger %B Upper Thrust
    const s5Passed = (rangePosition >= 0.60 || percentB15m >= 0.62) && (ch1h > 0 || ch24h > 0.4);

    const activeSignals = [];
    if (s1Passed) activeSignals.push('volSqueeze');
    if (s2Passed) activeSignals.push('atrTrend');
    if (s3Passed) activeSignals.push('vwapVolume');
    if (s4Passed) activeSignals.push('rvolMfi');
    if (s5Passed) activeSignals.push('channelBreakout');

    const baseMetrics = {
      isSqueezeCoiled,
      isExpansionBreakout,
      squeezeState: s1State,
      volatilityD: Number(volatilityD.toFixed(2)),
      volatilityW: Number(volatilityW.toFixed(2)),
      volExpansionRatio,
      atrPct: Number(atrPct.toFixed(2)),
      atr15mPct: Number(atr15mPct.toFixed(2)),
      percentB,
      percentB15m,
      aboveVwap,
      vwmaBullish,
      abovePsar: abovePsarDaily || abovePsar15m,
      relVol: Number(relVol.toFixed(2)),
      mfi: Number(mfi.toFixed(1)),
      mfi15m: Number(mfi15m.toFixed(1)),
      rangePosition
    };

    // Run In-House Strategy Finder & Custom Strategy Synthesizer
    const finderResult = inhouseBuilder.findBestStrategy(c, baseMetrics);
    const selectedStrategy = finderResult.selectedStrategy;

    let rawPoints = 30;
    if (s1Passed) rawPoints += Math.round(16 * weights.volSqueeze);
    if (s2Passed) rawPoints += Math.round(14 * weights.atrTrend);
    if (s3Passed) rawPoints += Math.round(16 * weights.vwapVolume);
    if (s4Passed) rawPoints += Math.round(14 * weights.rvolMfi);
    if (s5Passed) rawPoints += Math.round(10 * weights.channelBreakout);
    if (s1Passed && s3Passed && s4Passed) rawPoints += 6;

    // Blend with Strategy Finder match score
    const strategyScore = Math.max(
      0,
      Math.min(99, Math.round(rawPoints * 0.7 + (selectedStrategy?.matchScore || 70) * 0.3))
    );

    // Dynamic Volatility-Scaled Risk/Reward calibrated by the Strategy Finder's multipliers
    const effectiveVolPct = Math.max(atrPct, volatilityD);
    const tMult = selectedStrategy?.targetMultiplier || 1.0;
    const sMult = selectedStrategy?.stopMultiplier || 1.0;

    const dynamicTargetPct = Number(Math.min(5.2, Math.max(1.35, effectiveVolPct * 0.85 * tMult)).toFixed(2));
    const dynamicStopPct = Number(Math.min(1.65, Math.max(0.60, effectiveVolPct * 0.38 * sMult)).toFixed(2));

    const dynamicLadders = [
      [Number((dynamicTargetPct * 0.32).toFixed(2)), Number((dynamicTargetPct * 0.14).toFixed(2))],
      [Number((dynamicTargetPct * 0.62).toFixed(2)), Number((dynamicTargetPct * 0.42).toFixed(2))],
      [Number((dynamicTargetPct * 0.95).toFixed(2)), Number((dynamicTargetPct * 0.72).toFixed(2))]
    ];

    const summaryTag = `[${selectedStrategy?.strategyName || s1State} (${selectedStrategy?.matchedBlocks || '4/6'})] ${s1State} | Vol.D: ${volatilityD.toFixed(2)}% | RVOL: ${relVol.toFixed(2)}x | MFI: ${mfi.toFixed(0)} | ${aboveVwap ? '>VWAP' : '<VWAP'}${vwmaBullish ? '+VWMA' : ''}`;

    return {
      ...baseMetrics,
      strategyScore,
      confirmedCount: activeSignals.length,
      activeSignals,
      selectedStrategy,
      passedBlocks: finderResult.passedBlocks,
      dynamicTargetPct,
      dynamicStopPct,
      dynamicLadders,
      summaryTag
    };
  }
}

export default new TvVolatilityVolumeStrategy();
