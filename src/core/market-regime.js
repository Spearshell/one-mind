/**
 * Market-direction filter (2026-11-03, backtest-tested before switching on).
 * T212_MARKET_FILTER=spy|qqq|off : only allow new buys while the index is up on the day and above its live VWAP.
 * Default spy. Replay Oct 8-30 (real costs): no filter -7.67 / -10.69 (2 seeds), SPY filter -2.05 / -2.24,
 * max drawdown 10.6/13.5 -> 8.2/6.9. Second half clearly better, first half about the same.
 * The QQQ version did NOT help (-8.95), so treat the evidence as thin.
 */
import t212LiveClient from '../addons/trading212-live-client.js';

class MarketRegime {
  constructor() { this.cache = null; }

  async allowsBuys() {
    const mode = String(process.env.T212_MARKET_FILTER || 'spy').trim().toLowerCase();
    if (mode === 'off' || mode === 'false') return { ok: true, reason: 'market filter off' };
    if (this.cache && Date.now() - this.cache.ts < 30000) return this.cache.v;
    const sym = mode === 'spy' ? 'SPY' : 'QQQ';
    let v;
    try {
      const q = await t212LiveClient.fetchLiveExecutionQuote(sym, 'NASDAQ');
      if (!q || !(q.price > 0)) v = { ok: true, reason: `${sym} quote unavailable - filter skipped` };
      else {
        const vwap = Number(q.chartAnalytics?.liveVwap || 0);
        const up = Number(q.changePct) > 0;
        const above = !vwap || q.price >= vwap;
        v = { ok: up && above, reason: `${sym} ${q.changePct >= 0 ? '+' : ''}${q.changePct}% today, ${above ? 'above' : 'below'} VWAP` };
      }
    } catch (e) { v = { ok: true, reason: `${sym} check failed - filter skipped` }; }
    this.cache = { ts: Date.now(), v };
    return v;
  }
}

export default new MarketRegime();
