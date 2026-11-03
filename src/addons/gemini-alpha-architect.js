/**
 * Gemini AI + Yahoo Finance Direct 1-Minute Candle Architect (USD Edition)
 * Evaluates S-Tier, T-Tier, and A-Tier candidates across Trading212 Desk 1 & Desk 2
 * by inspecting the live Yahoo Finance 1-minute candle sequence (https://finance.yahoo.com/quote/{SYMBOL}/?guccounter=1)
 * and vetoing fading tops where the last 3 consecutive 1-minute Yahoo candles are dropping.
 */

import envConfig from '../core/auto-resolver.js';
import t212LiveClient from './trading212-live-client.js';

export class GeminiAlphaArchitect {
  constructor() {
    this.model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    this.latestInsights = {
      T212: null,
      DEX: null
    };
  }

  get apiKey() {
    return process.env.GEMINI_API_KEY || '';
  }

  async auditCandidate(candidate, tierResult, platformType = 'T212') {
    const [yahooQuote, googleQuote] = await Promise.all([
      t212LiveClient.fetchLiveExecutionQuote(candidate.symbol, candidate.exchange),
      t212LiveClient.fetchGoogleFinanceQuote(candidate.symbol, candidate.exchange)
    ]);
    const klines = yahooQuote?.klines || [];
    const last5Closes = klines.slice(-5).map(k => Number(k.c.toFixed(4)));

    // Yahoo Finance 1-Minute Real-Time Uptrend Verification Gate:
    // 1. Block if 15-minute real Yahoo Finance change is negative (never buy a stock bleeding in pre-market/intraday)
    if (yahooQuote && Number(yahooQuote.change15mPct) < 0) {
      return {
        approved: false,
        tier: 'DECLINED',
        score: tierResult.score,
        confidencePct: 0,
        summary: `Yahoo Finance 15m Momentum Veto: 15m trend is negative (${yahooQuote.change15mPct}%)`
      };
    }

    // 2. Block if latest 1m Yahoo candle is below the 5-candle SMA or dropping over the last 2 bars
    if (last5Closes.length >= 3) {
      const n = last5Closes.length;
      const c1 = last5Closes[n - 3];
      const c2 = last5Closes[n - 2];
      const c3 = last5Closes[n - 1];
      const avg5 = last5Closes.reduce((s, v) => s + v, 0) / n;

      if ((c3 < c2 && c2 < c1) || c3 < avg5) {
        return {
          approved: false,
          tier: 'DECLINED',
          score: tierResult.score,
          confidencePct: 0,
          summary: `Yahoo Finance 1m Candle Veto: Price ($${c3}) below 5m SMA ($${avg5.toFixed(2)}) or declining (${c1} -> ${c2} -> ${c3})`
        };
      }
    }

    const fallback = {
      approved: tierResult.accepted,
      tier: tierResult.tier,
      score: tierResult.score,
      confidencePct: Math.min(96, Math.max(60, tierResult.score)),
      summary: tierResult.rationale
    };

    if (!this.apiKey || !tierResult.accepted) {
      this.latestInsights[platformType] = {
        symbol: candidate.symbol,
        tier: tierResult.tier,
        score: tierResult.score,
        summary: tierResult.rationale,
        timestamp: new Date().toLocaleTimeString()
      };
      return fallback;
    }

    const yahooUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(candidate.yahooSymbol || candidate.symbol)}/?guccounter=1`;
    const googleUrl = googleQuote?.googleUrl || `https://www.google.com/finance/quote/${candidate.symbol}:${candidate.exchange || 'NASDAQ'}`;
    const prompt = `You are the Chief Institutional Quant Architect managing a Dual-Desk Trading212 Live Demo Construct ($100 Desk 1 + $100 Desk 2 = $200 GBP) synced 1:1 with Yahoo Finance (${yahooUrl}) and Google Finance (${googleUrl}).
Evaluate this ${platformType} candidate already pre-screened as ${tierResult.tier} (${tierResult.score}/100):
- Symbol: ${candidate.symbol} (${candidate.name || candidate.symbol})
- Exact Yahoo Finance Live Price: $${yahooQuote?.price || candidate.price} (Google Finance Cross-Check: $${googleQuote?.price || yahooQuote?.price || candidate.price})
- Last 5 Yahoo Finance 1-Minute Candle Closes: [${last5Closes.join(', ')}]
- 15m Change: ${yahooQuote?.change15mPct ?? candidate.change15m}% | 24h Change: ${yahooQuote?.changePct ?? candidate.change24h}%
- RSI(14): ${candidate.rsi} | Relative Volume: ${candidate.relativeVolume || 1.2}x
- TradingView Technical Rating: ${candidate.tvRating || 'BUY'}
- Microstructure Regime: ${tierResult.microstructure?.regime} (Hurst ${tierResult.microstructure?.hurst}, OBI ${tierResult.microstructure?.obi})

If the 1-minute Yahoo Finance candles show exhaustion or a bull trap, set "approved": false. Otherwise set "approved": true.
Respond strictly in valid JSON (no markdown, no backticks):
{
  "approved": true,
  "confidencePct": <number 70 to 97>,
  "summary": "<1 concise sentence referencing the Yahoo Finance 1m price action and exit plan>"
}`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 160 }
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) return fallback;
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const finalResult = {
        approved: parsed.approved !== false,
        tier: tierResult.tier,
        score: tierResult.score,
        confidencePct: Number(parsed.confidencePct || fallback.confidencePct),
        summary: parsed.summary || fallback.summary
      };

      this.latestInsights[platformType] = {
        symbol: candidate.symbol,
        tier: finalResult.tier,
        score: finalResult.score,
        confidencePct: finalResult.confidencePct,
        summary: finalResult.summary,
        timestamp: new Date().toLocaleTimeString()
      };

      return finalResult;
    } catch (_) {
      this.latestInsights[platformType] = {
        symbol: candidate.symbol,
        tier: tierResult.tier,
        score: tierResult.score,
        summary: tierResult.rationale,
        timestamp: new Date().toLocaleTimeString()
      };
      return fallback;
    }
  }
}

export default new GeminiAlphaArchitect();
