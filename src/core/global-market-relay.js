/**
 * 24/7/365 Global Market Relay Engine (Construct 2026)
 * ---------------------------------------------------
 * Ensures trading continuity 24 hours a day, 7 days a week, 365 days a year.
 * When one global financial market closes, another immediately opens:
 * 
 * 1. LONDON / EUROPE (LSE, Euronext, XETRA): 08:00 - 16:30 UTC
 * 2. US PRE-MARKET (NASDAQ / NYSE Pre-Market): 09:00 - 14:30 UTC (04:00 - 09:30 ET)
 * 3. US REGULAR SESSION (Wall Street Peak Liquidity): 14:30 - 21:00 UTC (09:30 - 16:00 ET)
 * 4. US POST-MARKET / AFTER-HOURS (Earnings & Catalyst Movers): 21:00 - 01:00 UTC (16:00 - 20:00 ET)
 * 5. ASIA-PACIFIC (Tokyo TSE, Hong Kong HKEX, Sydney ASX): 00:00 - 08:00 UTC
 * 6. WEEKEND CRYPTO & SYNTHETIC 24/7 RELAY: Friday 21:00 UTC to Sunday 22:00 UTC
 */

export class GlobalMarketRelay {
  constructor() {
    this.forcedSession = null;
    this.sessionHistory = [];
  }

  /**
   * Evaluates the current UTC timestamp and determines the active global market session.
   */
  getActiveSession(date = new Date()) {
    if (this.forcedSession) {
      return this._formatSession(this.forcedSession, date);
    }

    const utcDay = date.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const utcHour = date.getUTCHours();
    const utcMinute = date.getUTCMinutes();
    const utcTotalMin = utcHour * 60 + utcMinute;

    // Weekend Crypto & 24/7 Global DEX Session
    // Runs from Friday 21:00 UTC (1260m) through Sunday 22:00 UTC (1320m)
    if (utcDay === 6 || (utcDay === 5 && utcTotalMin >= 1260) || (utcDay === 0 && utcTotalMin < 1320)) {
      return {
        id: 'WEEKEND_CRYPTO_24_7',
        name: '24/7 Global Crypto & DEX Session',
        marketType: 'crypto',
        primaryExchanges: ['DEX', 'UNISWAP', '1INCH', 'COINBASE'],
        region: 'Global 24/7 Decentralized Liquidity',
        utcWindow: 'Friday 21:00 UTC – Sunday 22:00 UTC',
        quoteSource: 'GOOGLE_&_YAHOO_LIVE_CHART_1M',
        scannerMarket: 'crypto',
        description: '24/7 Crypto DEX & digital asset trading across MetaMask 1inch + Trading212 global crypto proxies.',
        isWeekend: true,
        recommendedStrategy: 'STRAT_01_SQUEEZE_VWAP'
      };
    }

    // Weekdays (Monday through Friday):
    // 1. Asia-Pacific Session: 00:00 - 08:00 UTC
    if (utcTotalMin >= 0 && utcTotalMin < 480) {
      return {
        id: 'ASIA_PACIFIC',
        name: 'Asia-Pacific Session (Tokyo / HK / Sydney)',
        marketType: 'global',
        primaryExchanges: ['TSE', 'HKEX', 'ASX', 'GLOBAL_ADR'],
        region: 'Tokyo / Hong Kong / Sydney / Singapore',
        utcWindow: '00:00 – 08:00 UTC',
        quoteSource: 'GOOGLE_&_YAHOO_LIVE_CHART_1M',
        scannerMarket: 'america', // queries global ADRs & 24/5 global equities
        description: 'Trading212 24/5 Global Equities, Asian Mega-Cap ADRs (BABA, TSM, SONY, HMC), and Global Crosses.',
        isWeekend: false,
        recommendedStrategy: 'STRAT_05_COMPRESSION_SWEEP_REBOUND'
      };
    }

    // 2. London & European Session: 08:00 - 16:30 UTC
    // Overlaps with US Pre-Market (09:00 - 14:30 UTC)
    if (utcTotalMin >= 480 && utcTotalMin < 870) {
      // 09:00 - 14:30 UTC: US Pre-Market is simultaneously alive and printing real 1m candles!
      if (utcTotalMin >= 540) {
        return {
          id: 'US_PRE_MARKET',
          name: 'US Pre-Market & London Dual Relay',
          marketType: 'america',
          primaryExchanges: ['NASDAQ', 'NYSE', 'AMEX', 'LSE'],
          region: 'New York (04:00–09:30 ET) & London (LSE)',
          utcWindow: '09:00 – 14:30 UTC',
          quoteSource: 'GOOGLE_&_YAHOO_LIVE_CHART_1M',
          scannerMarket: 'america',
          description: 'High-momentum US Pre-Market movers actively printing 1m candles + London European large caps.',
          isWeekend: false,
          recommendedStrategy: 'STRAT_04_CATALYST_RVOL_EXPLOSION'
        };
      }

      return {
        id: 'LONDON_EUROPE',
        name: 'London Stock Exchange & European Session',
        marketType: 'uk',
        primaryExchanges: ['LSE', 'EURONEXT', 'XETRA'],
        region: 'London (LSE) & Continental Europe',
        utcWindow: '08:00 – 16:30 UTC',
        quoteSource: 'GOOGLE_&_YAHOO_LIVE_CHART_1M',
        scannerMarket: 'uk',
        description: 'LSE FTSE large caps, European growth equities, and UK institutional order flows.',
        isWeekend: false,
        recommendedStrategy: 'STRAT_02_VWMA_RVOL_TREND'
      };
    }

    // 3. US Regular Session (Peak Wall Street Volume): 14:30 - 21:00 UTC (09:30 - 16:00 ET)
    if (utcTotalMin >= 870 && utcTotalMin < 1260) {
      return {
        id: 'US_REGULAR',
        name: 'US Regular Session (Wall Street Peak Liquidity)',
        marketType: 'america',
        primaryExchanges: ['NASDAQ', 'NYSE', 'AMEX'],
        region: 'New York (09:30–16:00 ET)',
        utcWindow: '14:30 – 21:00 UTC',
        quoteSource: 'GOOGLE_&_YAHOO_LIVE_CHART_1M',
        scannerMarket: 'america',
        description: 'Peak institutional liquidity across NASDAQ, NYSE, and AMEX with tightest spreads and deepest volume.',
        isWeekend: false,
        recommendedStrategy: 'STRAT_03_ATR_PSAR_MOMENTUM'
      };
    }

    // 4. US Post-Market / After-Hours: 21:00 - 01:00 UTC (16:00 - 20:00 ET)
    return {
      id: 'US_AFTER_HOURS',
      name: 'US Post-Market & Extended Catalyst Session',
      marketType: 'america',
      primaryExchanges: ['NASDAQ', 'NYSE'],
      region: 'New York Extended Hours (16:00–20:00 ET)',
      utcWindow: '21:00 – 01:00 UTC',
      quoteSource: 'GOOGLE_&_YAHOO_LIVE_CHART_1M',
      scannerMarket: 'america',
      description: 'Earnings announcements, post-close guidance breakouts, and institutional rebalancing.',
      isWeekend: false,
      recommendedStrategy: 'STRAT_01_SQUEEZE_VWAP'
    };
  }

  /**
   * Returns whether live buying is permitted right now (Always true under 24/7/365 Global Relay).
   */
  isTradingPermitted() {
    return true; // 24/7/365 continuous trading across active global relay markets
  }

  /**
   * Provides a live telemetry summary of the relay state.
   */
  getRelayStatus() {
    const session = this.getActiveSession();
    return {
      activeSessionId: session.id,
      sessionName: session.name,
      region: session.region,
      utcWindow: session.utcWindow,
      scannerMarket: session.scannerMarket,
      primaryExchanges: session.primaryExchanges,
      recommendedStrategy: session.recommendedStrategy,
      is247Active: true,
      timestamp: new Date().toISOString()
    };
  }
}

export default new GlobalMarketRelay();
