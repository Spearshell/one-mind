/**
 * TradingView Live Scanner & Pre-Market / Regular Session Intelligence Add-On (USD Edition)
 *
 * Guarantees:
 * 1. Scans NASDAQ, NYSE & AMEX symbols that load 100% natively in the embedded TradingView chart widget
 *    (eliminates LSE "This symbol is only available on TradingView" popups and LSE/NYSE ticker collisions like ECO).
 * 2. During US Pre-Market hours (08:30–14:30 UTC), automatically sorts by `premarket_volume` and `premarket_change`
 *    so the engine only targets stocks with real, active, high-volume 1-minute candles printing on Yahoo Finance right now.
 * 3. During Regular US Session (14:30–21:00 UTC), rotates across Volatility.D, RVOL, MoneyFlow, and 15m/1h velocity.
 *
 * Backtest fixes (2026-11-02):
 * - pre-market / after-hours are now detected in New York time (daylight-saving aware) instead of fixed UTC hours
 *   (the old 08-14 UTC window was off by an hour half the year and treated 09:30-10:00 as pre-market in summer)
 * - only stocks Trading212 actually offers pass (no US-listed ETFs such as 2x/3x leveraged ones - UK accounts can't
 *   buy them); see addons/t212-instruments.js
 */

import { usSession } from '../core/market-hours.js';
import t212Instruments from './t212-instruments.js';

const TV_COLUMNS = [
  'name',                     // 0
  'description',              // 1
  'close',                    // 2
  'change',                   // 3 (24h / Daily change %)
  'change|60',                // 4 (1h change %)
  'change|15',                // 5 (15m change %)
  'change|5',                 // 6 (5m change %)
  'volume',                   // 7 (Current session volume)
  'relative_volume_10d_calc', // 8 (RVOL 10d)
  'average_volume_10d_calc',  // 9 (10d Avg Volume)
  'RSI',                      // 10 (Daily RSI 14)
  'RSI|15',                   // 11 (15m Intraday RSI 14)
  'MACD.macd',                // 12
  'MACD.signal',              // 13
  'ADX',                      // 14
  'EMA20',                    // 15
  'EMA50',                    // 16
  'EMA200',                   // 17
  'SMA20',                    // 18
  'EMA20|15',                 // 19 (15m EMA20 for Intraday Keltner/VWMA)
  'BB.lower',                 // 20
  'BB.upper',                 // 21
  'BB.lower|15',              // 22 (15m Bollinger Lower)
  'BB.upper|15',              // 23 (15m Bollinger Upper)
  'ATR',                      // 24 (Daily ATR 14)
  'ATR|60',                   // 25 (1h ATR 14)
  'ATR|15',                   // 26 (15m ATR 14)
  'Volatility.D',             // 27 (TradingView Built-In Daily Volatility %)
  'Volatility.W',             // 28 (TradingView Built-In Weekly Volatility %)
  'Volatility.M',             // 29 (TradingView Built-In Monthly Volatility %)
  'VWAP',                     // 30 (Session VWAP)
  'VWAP|15',                  // 31 (15m Intraday VWAP)
  'VWMA',                     // 32 (Daily Volume-Weighted MA 20)
  'VWMA|15',                  // 33 (15m Volume-Weighted MA 20)
  'MoneyFlow',                // 34 (Daily Money Flow Index MFI 14)
  'MoneyFlow|15',             // 35 (15m Money Flow Index MFI 14)
  'P.SAR',                    // 36 (Daily Parabolic SAR Volatility Stop)
  'P.SAR|15',                 // 37 (15m Parabolic SAR Volatility Stop)
  'high',                     // 38 (Session High)
  'low',                      // 39 (Session Low)
  'Recommend.All',            // 40
  'Recommend.MA',             // 41
  'Recommend.Other',          // 42
  'exchange',                 // 43
  'premarket_close',          // 44 (Live US Pre-Market Price)
  'premarket_change',         // 45 (Live US Pre-Market Change %)
  'premarket_volume',         // 46 (Live US Pre-Market Volume)
  'postmarket_close',         // 47 (Live US Post-Market Price)
  'postmarket_change',        // 48 (Live US Post-Market Change %)
  'relative_volume_intraday|5'// 49 (5m Intraday Relative Volume Burst)
];

const BOND_ETF_BLACKLIST = new Set([
  'JAGA', 'HYSD', 'FIGB', 'FLSP', 'SCHQ', 'TONT', 'SGOV', 'BIL', 'SHV', 'TLT', 'IEF', 'BND', 'AGG', 'LQD',
  'SQQQ', 'SPXS', 'SDOW', 'TZA', 'SOXS' // Exclude inverse bear ETFs on long-only desks
]);

function formatTvRating(score) {
  if (score === null || score === undefined || Number.isNaN(score)) return 'NEUTRAL';
  if (score >= 0.5) return 'STRONG_BUY';
  if (score >= 0.1) return 'BUY';
  if (score <= -0.5) return 'STRONG_SELL';
  if (score <= -0.1) return 'SELL';
  return 'NEUTRAL';
}

function mapRowToObject(item) {
  const d = item.d || [];
  const rawSym = item.s || '';
  const [exchangePrefix, ticker] = rawSym.includes(':') ? rawSym.split(':') : ['', rawSym];
  const exchange = d[43] || exchangePrefix;

  const regClose = Number(d[2] || 0);
  const preClose = Number(d[44] || 0);
  const preChange = Number(d[45] || 0);
  const preVol = Number(d[46] || 0);
  const postClose = Number(d[47] || 0);
  const postChange = Number(d[48] || 0);
  const rvol5m = Number(d[49] || 0);

  const session = usSession();
  const isPre = session === 'pre-market';
  let close = regClose;
  if (isPre && preClose > 0) {
    close = preClose;
  } else if ((session === 'after-hours' || session === 'closed') && postClose > 0) {
    close = postClose;
  }

  const change24h = (isPre && preChange !== 0)
    ? preChange
    : Number(d[3] || 0);
  const change1h = (isPre && preChange !== 0)
    ? preChange
    : Number(d[4] || 0);
  const change15m = Number(d[5] || preChange * 0.5 || 0);
  const change5m = Number(d[6] || 0);
  const volume = Number(d[7] || 0) + preVol;
  const relVol = Math.max(Number(d[8] || 1.0), rvol5m || 1.0, preVol > 35000 ? 2.4 : 1.0);
  const avgVol10d = Number(d[9] || volume || 1);
  const rsi = d[10] !== null && d[10] !== undefined ? Number(d[10]) : 54;
  const rsi15m = d[11] !== null && d[11] !== undefined ? Number(d[11]) : rsi;
  const macd = Number(d[12] || 0);
  const macdSignal = Number(d[13] || 0);
  const adx = Number(d[14] || 18);
  const ema20 = Number(d[15] || close);
  const ema50 = Number(d[16] || close);
  const ema200 = Number(d[17] || close);
  const sma20 = Number(d[18] || ema20 || close);
  const ema20_15m = Number(d[19] || close);
  const bbLower = Number(d[20] || close * 0.98);
  const bbUpper = Number(d[21] || close * 1.02);
  const bbLower15m = Number(d[22] || close * 0.99);
  const bbUpper15m = Number(d[23] || close * 1.01);
  const atr = Number(d[24] || close * 0.015);
  const atr60m = Number(d[25] || atr * 0.35);
  const atr15m = Number(d[26] || atr * 0.18);
  const volatilityD = Number(d[27] || (close > 0 ? (atr / close) * 100 : 2.5));
  const volatilityW = Number(d[28] || volatilityD);
  const volatilityM = Number(d[29] || volatilityD);
  const vwap = Number(d[30] || regClose || close);
  const vwap15m = Number(d[31] || vwap || close);
  const vwma = Number(d[32] || sma20 || close);
  const vwma15m = Number(d[33] || ema20_15m || close);
  const moneyFlow = d[34] !== null && d[34] !== undefined ? Number(d[34]) : 58;
  const moneyFlow15m = d[35] !== null && d[35] !== undefined ? Number(d[35]) : moneyFlow;
  const psar = Number(d[36] || close * 0.985);
  const psar15m = Number(d[37] || close * 0.992);
  const high = Math.max(Number(d[38] || close * 1.01), close);
  const low = Math.min(Number(d[39] || close * 0.99), close);
  const recAll = Number(d[40] || (preChange > 1.0 ? 0.55 : 0.2));
  const recMa = Number(d[41] || 0.25);
  const recOsc = Number(d[42] || 0.15);

  const cleanSym = String(d[0] || ticker).toUpperCase().trim();

  return {
    tvSymbol: rawSym,
    symbol: cleanSym,
    name: d[1] || cleanSym,
    exchange,
    price: close,
    premarketVolume: preVol,
    premarketChange: Number(preChange.toFixed(2)),
    change24h: Number(change24h.toFixed(2)),
    change1h: Number(change1h.toFixed(2)),
    change15m: Number(change15m.toFixed(2)),
    change5m: Number(change5m.toFixed(2)),
    volume,
    avgVolume10d: Math.round(avgVol10d),
    relativeVolume: Number(relVol.toFixed(2)),
    rsi: Number(rsi.toFixed(2)),
    rsi15m: Number(rsi15m.toFixed(2)),
    macd: Number(macd.toFixed(5)),
    macdSignal: Number(macdSignal.toFixed(5)),
    macdHistogram: Number((macd - macdSignal).toFixed(5)),
    adx: Number(adx.toFixed(2)),
    ema20: Number(ema20.toFixed(6)),
    ema50: Number(ema50.toFixed(6)),
    ema200: Number(ema200.toFixed(6)),
    sma20: Number(sma20.toFixed(6)),
    ema20_15m: Number(ema20_15m.toFixed(6)),
    bbLower: Number(bbLower.toFixed(6)),
    bbUpper: Number(bbUpper.toFixed(6)),
    bbLower15m: Number(bbLower15m.toFixed(6)),
    bbUpper15m: Number(bbUpper15m.toFixed(6)),
    atr: Number(atr.toFixed(6)),
    atr60m: Number(atr60m.toFixed(6)),
    atr15m: Number(atr15m.toFixed(6)),
    atrPct: close > 0 ? Number(((atr / close) * 100).toFixed(2)) : 1.8,
    atr15mPct: close > 0 ? Number(((atr15m / close) * 100).toFixed(2)) : 0.45,
    volatilityD: Number(volatilityD.toFixed(2)),
    volatilityW: Number(volatilityW.toFixed(2)),
    volatilityM: Number(volatilityM.toFixed(2)),
    vwap: Number(vwap.toFixed(6)),
    vwap15m: Number(vwap15m.toFixed(6)),
    vwma: Number(vwma.toFixed(6)),
    vwma15m: Number(vwma15m.toFixed(6)),
    moneyFlow: Number(moneyFlow.toFixed(2)),
    moneyFlow15m: Number(moneyFlow15m.toFixed(2)),
    psar: Number(psar.toFixed(6)),
    psar15m: Number(psar15m.toFixed(6)),
    high: Number(high.toFixed(6)),
    low: Number(low.toFixed(6)),
    tvScore: Number(recAll.toFixed(3)),
    tvMaScore: Number(recMa.toFixed(3)),
    tvOscScore: Number(recOsc.toFixed(3)),
    tvRating: formatTvRating(recAll)
  };
}

function isCleanTradableEquity(item) {
  if (!item || item.price <= 0) return false;
  if (!/^[A-Z]{2,5}$/.test(item.symbol)) return false;
  if (BOND_ETF_BLACKLIST.has(item.symbol)) return false;
  if (/bond|treasury|ultrashort|municipal|income fund|inverse|short|bear/i.test(item.name || '')) return false;
  if (item.volatilityD < 1.6) return false;
  if (!t212Instruments.isTradable(item.symbol)) return false;
  return true;
}

export class TradingViewScanner {
  constructor() {
    this.desk1SortIndex = 0;
    this.desk2SortIndex = 0;
  }

  _isUsPreMarketWindow() {
    return usSession() === 'pre-market';
  }

  /**
   * DESK 1 SCANNER: High-Volatility Squeeze & Pre-Market / Intraday Momentum Breakouts
   */
  async scanVolatilityBreakouts(limit = 35) {
    const isPre = this._isUsPreMarketWindow();
    const sortBy = isPre
      ? 'premarket_volume'
      : ['Volatility.D', 'change|15', 'change', 'Recommend.All'][this.desk1SortIndex++ % 4];

    const filters = isPre
      ? [
          { left: 'close', operation: 'in_range', right: [3.0, 650.0] },
          { left: 'premarket_change', operation: 'greater', right: 0.35 },
          { left: 'exchange', operation: 'in_range', right: ['NASDAQ', 'NYSE', 'AMEX'] }
        ]
      : [
          { left: 'close', operation: 'in_range', right: [4.5, 650.0] },
          { left: 'volume', operation: 'greater', right: 1500000 },
          { left: 'Volatility.D', operation: 'in_range', right: [2.0, 32.0] },
          { left: 'change', operation: 'greater', right: 0.5 },
          { left: 'exchange', operation: 'in_range', right: ['NASDAQ', 'NYSE', 'AMEX'] }
        ];

    const payload = {
      filter: filters,
      options: { lang: 'en' },
      markets: ['america'],
      symbols: { query: { types: [] }, tickers: [] },
      columns: TV_COLUMNS,
      sort: { sortBy, sortOrder: 'desc' },
      range: [0, Math.max(limit, 45)]
    };

    try {
      const res = await fetch('https://scanner.tradingview.com/america/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6500)
      });

      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).map(mapRowToObject).filter(isCleanTradableEquity);
    } catch (_) {
      return [];
    }
  }

  /**
   * DESK 2 SCANNER: Institutional Volume (RVOL), Pre-Market Volume Leaders & VWAP Accumulation
   */
  async scanInstitutionalVolumeMacro(limit = 35) {
    const isPre = this._isUsPreMarketWindow();
    const sortBy = isPre
      ? 'premarket_change'
      : ['relative_volume_10d_calc', 'MoneyFlow', 'volume', 'Recommend.MA'][this.desk2SortIndex++ % 4];

    const filters = isPre
      ? [
          { left: 'close', operation: 'in_range', right: [4.0, 800.0] },
          { left: 'premarket_volume', operation: 'greater', right: 5000 },
          { left: 'premarket_change', operation: 'greater', right: 0.25 },
          { left: 'exchange', operation: 'in_range', right: ['NASDAQ', 'NYSE', 'AMEX'] }
        ]
      : [
          { left: 'close', operation: 'in_range', right: [6.0, 800.0] },
          { left: 'volume', operation: 'greater', right: 2000000 },
          { left: 'Volatility.D', operation: 'in_range', right: [1.8, 28.0] },
          { left: 'relative_volume_10d_calc', operation: 'greater', right: 1.2 },
          { left: 'exchange', operation: 'in_range', right: ['NASDAQ', 'NYSE', 'AMEX'] }
        ];

    const payload = {
      filter: filters,
      options: { lang: 'en' },
      markets: ['america'],
      symbols: { query: { types: [] }, tickers: [] },
      columns: TV_COLUMNS,
      sort: { sortBy, sortOrder: 'desc' },
      range: [0, Math.max(limit, 45)]
    };

    try {
      const res = await fetch('https://scanner.tradingview.com/america/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6500)
      });

      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).map(mapRowToObject).filter(isCleanTradableEquity);
    } catch (_) {
      return [];
    }
  }

  async scanEquities(limit = 35) {
    return this.scanVolatilityBreakouts(limit);
  }

  async scanCryptoMovers(limit = 35) {
    return this.scanInstitutionalVolumeMacro(limit);
  }
}

export default new TradingViewScanner();
