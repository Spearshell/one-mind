/**
 * Future Stocks & Bonds "Piggy Bank" Vault ($500+ Auto-Siphon • 2026–2034 Horizon)
 *
 * Implements the Chief Commander's Long-Term Strategic Wealth Vault:
 * 1. Activation Gate: Monitors combined Trading212 Dual-Desk equity toward the $500.00 threshold.
 * 2. Auto-Siphon Tranches ($10–$20): Once combined equity reaches >= $500.00 (and every +$25.00 milestone
 *    thereafter), automatically siphons $15.00 ($10–$20 range) into the long-term Piggy Bank portfolio.
 * 3. Strategic Portfolio Basket:
 *    - 55% Arctic Shipping Routes & Polar Infrastructure (2026–2034 Strategic Timeline Analysis):
 *      • MATX (Matson, Inc.) — Alaskan & Northern Water Container Leader (12%)
 *      • AMKBY (A.P. Moller-Maersk) — Global Mega-Carrier & Polar Terminal Infrastructure (11%)
 *      • ZIM (ZIM Integrated Shipping Services) — High-Yield Agile Polar & Trans-Pacific Carrier (10%)
 *      • FCT (Fincantieri S.p.A.) — Ice-Class Hulls & Polar Marine Engineering (8%)
 *      • HII (Huntington Ingalls Industries) — Heavy Ice-Capable Shipbuilding & Defense (7%)
 *      • FLNG (Flex LNG Ltd.) — Arctic LNG Corridor & Polar Energy Transport (7%)
 *    - 45% Sovereign Bonds & Compounding Yield Anchors:
 *      • SGOV (iShares 0-3 Month US Treasury Bond ETF) — Sovereign Risk-Free Yield Anchor (14%)
 *      • TLT (iShares 20+ Year US Treasury Bond ETF) — Long-Duration Sovereign Bond Anchor (12%)
 *      • BND (Vanguard Total Bond Market ETF) — Investment-Grade Bond Core (10%)
 *      • SCHD (Schwab US Dividend Equity ETF) — Compounding Dividend Growth (9%)
 */

import fs from 'node:fs';
import path from 'node:path';
import envConfig from './auto-resolver.js';
import t212LiveClient from '../addons/trading212-live-client.js';
import telegramBridge from '../addons/telegram-command-bridge.js';

export const PIGGYBANK_BASKET = [
  {
    symbol: 'MATX',
    yahooSymbol: 'MATX',
    tvSymbol: 'NYSE:MATX',
    name: 'Matson, Inc.',
    category: 'ARCTIC_SHIPPING_2026_2034',
    horizon: '2026–2030 Alaskan & Northern Corridor',
    weightPct: 12,
    estYieldPct: 1.15,
    fallbackPrice: 134.50,
    thesis: 'Dominant Alaskan & northern-water container operator with proven sub-polar logistics.'
  },
  {
    symbol: 'AMKBY',
    yahooSymbol: 'AMKBY',
    tvSymbol: 'OTC:AMKBY',
    name: 'A.P. Moller-Maersk ADR',
    category: 'ARCTIC_SHIPPING_2026_2034',
    horizon: '2028–2034 Trans-Arctic Mega-Carrier',
    weightPct: 11,
    estYieldPct: 4.20,
    fallbackPrice: 8.65,
    thesis: 'Global container titan positioned to dominate trans-polar hub ports once commercial viability matures.'
  },
  {
    symbol: 'ZIM',
    yahooSymbol: 'ZIM',
    tvSymbol: 'NYSE:ZIM',
    name: 'ZIM Integrated Shipping Services',
    category: 'ARCTIC_SHIPPING_2026_2034',
    horizon: '2026–2032 Agile Polar Freight',
    weightPct: 10,
    estYieldPct: 8.50,
    fallbackPrice: 18.40,
    thesis: 'High-beta specialized regional & trans-Pacific operator capturing early northern route spot premiums.'
  },
  {
    symbol: 'FCT',
    yahooSymbol: 'FCT.MI',
    tvSymbol: 'MIL:FCT',
    name: 'Fincantieri S.p.A. (Ice-Class Shipbuilding)',
    category: 'ARCTIC_SHIPPING_2026_2034',
    horizon: '2026–2034 Ice-Class Hull Engineering',
    weightPct: 8,
    estYieldPct: 1.50,
    fallbackPrice: 5.85,
    thesis: 'Specialized polar marine engineering & reinforced ice-class vessel construction before routes fully open.'
  },
  {
    symbol: 'HII',
    yahooSymbol: 'HII',
    tvSymbol: 'NYSE:HII',
    name: 'Huntington Ingalls Industries',
    category: 'ARCTIC_SHIPPING_2026_2034',
    horizon: '2026–2034 Polar Defense & Icebreakers',
    weightPct: 7,
    estYieldPct: 2.10,
    fallbackPrice: 258.00,
    thesis: 'Premier heavy naval shipbuilder for polar security, ice-hardened hulls, and Arctic sovereignty.'
  },
  {
    symbol: 'FLNG',
    yahooSymbol: 'FLNG',
    tvSymbol: 'NYSE:FLNG',
    name: 'Flex LNG Ltd.',
    category: 'ARCTIC_SHIPPING_2026_2034',
    horizon: '2026–2034 Northern LNG Corridor',
    weightPct: 7,
    estYieldPct: 10.40,
    fallbackPrice: 25.90,
    thesis: 'High-yield modern LNG fleet serving northern energy corridors with strong cash distributions.'
  },
  {
    symbol: 'SGOV',
    yahooSymbol: 'SGOV',
    tvSymbol: 'AMEX:SGOV',
    name: 'iShares 0-3 Month US Treasury Bond ETF',
    category: 'SOVEREIGN_BONDS_PIGGYBANK',
    horizon: 'Risk-Free Sovereign Treasury Yield',
    weightPct: 14,
    estYieldPct: 5.15,
    fallbackPrice: 100.42,
    thesis: 'Ultra-safe US Sovereign T-Bill piggy-bank anchor paying monthly risk-free yield.'
  },
  {
    symbol: 'TLT',
    yahooSymbol: 'TLT',
    tvSymbol: 'NASDAQ:TLT',
    name: 'iShares 20+ Year US Treasury Bond ETF',
    category: 'SOVEREIGN_BONDS_PIGGYBANK',
    horizon: '2026–2034 Sovereign Duration Bond',
    weightPct: 12,
    estYieldPct: 4.35,
    fallbackPrice: 92.80,
    thesis: 'Long-duration US Treasury bond hedge capturing macro rate-cut capital appreciation + monthly yield.'
  },
  {
    symbol: 'BND',
    yahooSymbol: 'BND',
    tvSymbol: 'NASDAQ:BND',
    name: 'Vanguard Total Bond Market ETF',
    category: 'SOVEREIGN_BONDS_PIGGYBANK',
    horizon: 'Core Investment-Grade Bond Vault',
    weightPct: 10,
    estYieldPct: 4.45,
    fallbackPrice: 73.10,
    thesis: 'Broad institutional bond anchor stabilizing the long-term Arctic shipping equity sleeve.'
  },
  {
    symbol: 'SCHD',
    yahooSymbol: 'SCHD',
    tvSymbol: 'AMEX:SCHD',
    name: 'Schwab U.S. Dividend Equity ETF',
    category: 'SOVEREIGN_BONDS_PIGGYBANK',
    horizon: '2026–2034 Compounding Dividend Growth',
    weightPct: 9,
    estYieldPct: 3.65,
    fallbackPrice: 28.45,
    thesis: '100 high-cash-flow US dividend compounders providing steady quarterly income growth.'
  }
];

export class FuturePiggyBankVault {
  constructor() {
    this.stateFile = path.join(envConfig.stateDir, 'future-piggybank-vault.json');
    this.unlockThresholdUsd = 500.00;
    this.milestoneStepUsd = 25.00;
    this.defaultTrancheUsd = 15.00; // Right in the middle of user's $10-$20 slowly-grow spec
    this.state = this._loadOrInit();
    this.lastQuoteSyncTs = 0;
  }

  _defaultState() {
    const holdings = {};
    for (const item of PIGGYBANK_BASKET) {
      holdings[item.symbol] = {
        symbol: item.symbol,
        yahooSymbol: item.yahooSymbol,
        tvSymbol: item.tvSymbol,
        name: item.name,
        category: item.category,
        horizon: item.horizon,
        weightPct: item.weightPct,
        estYieldPct: item.estYieldPct,
        thesis: item.thesis,
        shares: 0,
        totalInvestedUsd: 0,
        avgCostPrice: item.fallbackPrice,
        currentPrice: item.fallbackPrice,
        currentValueUsd: 0,
        unrealizedPnlUsd: 0,
        unrealizedPnlPct: 0
      };
    }

    return {
      vaultName: 'Future Growth & Sovereign Bonds Piggy Bank (2026–2034 Arctic & Bonds)',
      unlockThresholdUsd: this.unlockThresholdUsd,
      trancheRangeUsd: '$10.00 – $20.00 ($15.00 Auto-Siphon)',
      isUnlocked: false,
      nextSiphonTargetEquityUsd: 500.00,
      totalDepositedUsd: 0,
      totalCurrentValueUsd: 0,
      totalUnrealizedPnlUsd: 0,
      estimatedAnnualIncomeUsd: 0,
      siphonCount: 0,
      holdings,
      depositHistory: [],
      lastUpdatedAt: new Date().toISOString()
    };
  }

  _loadOrInit() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const raw = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        const def = this._defaultState();
        const mergedHoldings = { ...def.holdings };
        if (raw.holdings) {
          for (const k of Object.keys(mergedHoldings)) {
            if (raw.holdings[k]) {
              mergedHoldings[k] = { ...mergedHoldings[k], ...raw.holdings[k] };
            }
          }
        }
        return {
          ...def,
          ...raw,
          holdings: mergedHoldings
        };
      }
    } catch (_) {}
    const fresh = this._defaultState();
    this._save(fresh);
    return fresh;
  }

  _save(stateObj = this.state) {
    try {
      stateObj.lastUpdatedAt = new Date().toISOString();
      fs.writeFileSync(this.stateFile, JSON.stringify(stateObj, null, 2), 'utf8');
    } catch (_) {}
  }

  resetVault() {
    this.state = this._defaultState();
    this._save(this.state);
    return this.state;
  }

  /**
   * Refreshes live prices for the 10 Piggy Bank stocks & bonds from Yahoo 1m Live Feed
   */
  async refreshLiveVaultPrices() {
    if (Date.now() - this.lastQuoteSyncTs < 30000) return;
    this.lastQuoteSyncTs = Date.now();

    await Promise.allSettled(
      PIGGYBANK_BASKET.map(async (item) => {
        const quote = await t212LiveClient.fetchLiveExecutionQuote(item.yahooSymbol || item.symbol);
        const h = this.state.holdings[item.symbol];
        if (!h) return;
        if (quote && quote.price > 0) {
          h.currentPrice = quote.price;
        }
        if (h.shares > 0) {
          h.currentValueUsd = Number((h.shares * h.currentPrice).toFixed(2));
          h.unrealizedPnlUsd = Number((h.currentValueUsd - h.totalInvestedUsd).toFixed(2));
          h.unrealizedPnlPct = h.totalInvestedUsd > 0
            ? Number(((h.unrealizedPnlUsd / h.totalInvestedUsd) * 100).toFixed(2))
            : 0;
        }
      })
    );

    this._recomputeTotals();
    this._save();
  }

  _recomputeTotals() {
    let totalInvested = 0;
    let totalVal = 0;
    let estAnnualYieldUsd = 0;

    for (const sym of Object.keys(this.state.holdings)) {
      const h = this.state.holdings[sym];
      h.currentValueUsd = Number((h.shares * h.currentPrice).toFixed(2));
      h.unrealizedPnlUsd = Number((h.currentValueUsd - h.totalInvestedUsd).toFixed(2));
      h.unrealizedPnlPct = h.totalInvestedUsd > 0
        ? Number(((h.unrealizedPnlUsd / h.totalInvestedUsd) * 100).toFixed(2))
        : 0;
      totalInvested += h.totalInvestedUsd;
      totalVal += h.currentValueUsd;
      estAnnualYieldUsd += h.currentValueUsd * ((h.estYieldPct || 3.5) / 100);
    }

    this.state.totalDepositedUsd = Number(totalInvested.toFixed(2));
    this.state.totalCurrentValueUsd = Number(totalVal.toFixed(2));
    this.state.totalUnrealizedPnlUsd = Number((totalVal - totalInvested).toFixed(2));
    this.state.estimatedAnnualIncomeUsd = Number(estAnnualYieldUsd.toFixed(2));
  }

  /**
   * Checks if Combined Trading212 Equity (Desk 1 + Desk 2 + Vault) has reached >= $500.00
   * and automatically siphons a $15.00 ($10-$20) tranche from liquid cash into the Piggy Bank!
   */
  async checkAndAutoSiphon(desk1Portfolio, desk2Portfolio) {
    await this.refreshLiveVaultPrices();

    const combinedActiveEquity = Number(
      (desk1Portfolio.state.totalEquityUsd + desk2Portfolio.state.totalEquityUsd).toFixed(2)
    );
    const totalWealthWithVault = Number((combinedActiveEquity + this.state.totalCurrentValueUsd).toFixed(2));

    if (totalWealthWithVault >= this.unlockThresholdUsd) {
      this.state.isUnlocked = true;
    }

    const targetMilestone = this.state.nextSiphonTargetEquityUsd || 500.00;
    if (totalWealthWithVault >= targetMilestone) {
      // Siphon $15.00 ($7.50 from each desk if liquid cash permits)
      const trancheUsd = this.defaultTrancheUsd;
      const half = Number((trancheUsd / 2).toFixed(2));

      if (desk1Portfolio.state.cashUsd >= half + 10 && desk2Portfolio.state.cashUsd >= half + 10) {
        desk1Portfolio.state.cashUsd = Number((desk1Portfolio.state.cashUsd - half).toFixed(2));
        desk2Portfolio.state.cashUsd = Number((desk2Portfolio.state.cashUsd - half).toFixed(2));
        desk1Portfolio.recalculateMarkToMarket();
        desk2Portfolio.recalculateMarkToMarket();

        const nextTarget = Math.max(
          targetMilestone + this.milestoneStepUsd,
          Math.floor(totalWealthWithVault / this.milestoneStepUsd) * this.milestoneStepUsd + this.milestoneStepUsd
        );
        this.state.nextSiphonTargetEquityUsd = Number(nextTarget.toFixed(2));
        await this.allocateTranche(trancheUsd, `AUTO-SIPHON AT $${totalWealthWithVault.toFixed(2)} MILESTONE`);
      }
    }
  }

  /**
   * Allocates a $10.00 or $20.00 tranche across the 10 Arctic Shipping (2026-2034) & Sovereign Bond holdings
   */
  async allocateTranche(trancheUsd = 15.00, sourceReason = 'MANUAL_TEST_TRANCHE') {
    const cleanAmount = Math.max(5, Math.min(100, Number(trancheUsd) || 15.00));
    await this.refreshLiveVaultPrices();

    for (const item of PIGGYBANK_BASKET) {
      const h = this.state.holdings[item.symbol];
      if (!h) continue;
      const sliceUsd = Number(((cleanAmount * item.weightPct) / 100).toFixed(2));
      const execPrice = h.currentPrice > 0 ? h.currentPrice : item.fallbackPrice;
      const boughtShares = execPrice > 0 ? Number((sliceUsd / execPrice).toFixed(6)) : 0;

      const prevInvested = h.totalInvestedUsd || 0;
      const prevShares = h.shares || 0;
      h.shares = Number((prevShares + boughtShares).toFixed(6));
      h.totalInvestedUsd = Number((prevInvested + sliceUsd).toFixed(2));
      h.avgCostPrice = h.shares > 0 ? Number((h.totalInvestedUsd / h.shares).toFixed(2)) : execPrice;
    }

    this.state.siphonCount = (this.state.siphonCount || 0) + 1;
    this.state.depositHistory.unshift({
      id: `PIGGY-${Date.now().toString(36).toUpperCase()}`,
      amountUsd: cleanAmount,
      reason: sourceReason,
      timestamp: new Date().toLocaleTimeString()
    });
    if (this.state.depositHistory.length > 25) this.state.depositHistory.pop();

    this._recomputeTotals();
    this._save();

    await telegramBridge.sendAlert(
      `🐷 <b>FUTURE STOCKS & BONDS PIGGY BANK DEPOSIT EXECUTED (USD)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• <b>Tranche Saved:</b> +$${cleanAmount.toFixed(2)} (${sourceReason})\n` +
      `• <b>Total Piggy Bank Value:</b> $${this.state.totalCurrentValueUsd.toFixed(2)}\n` +
      `• <b>55% Arctic Shipping (2026–2034):</b> MATX, AMKBY, ZIM, FCT, HII, FLNG\n` +
      `• <b>45% Sovereign Bonds & Yield:</b> SGOV, TLT, BND, SCHD`
    );

    return this.getStatus(200);
  }

  getStatus(combinedActiveEquityUsd = 200.00) {
    const totalWealth = Number((combinedActiveEquityUsd + this.state.totalCurrentValueUsd).toFixed(2));
    const progressPct = Math.min(100, Number(((totalWealth / this.unlockThresholdUsd) * 100).toFixed(1)));
    const remainingToUnlockUsd = Math.max(0, Number((this.unlockThresholdUsd - totalWealth).toFixed(2)));

    return {
      ...this.state,
      combinedActiveEquityUsd,
      totalWealthWithVaultUsd: totalWealth,
      progressTo500Pct: progressPct,
      remainingToUnlockUsd,
      holdingsList: Object.values(this.state.holdings)
    };
  }
}

export default new FuturePiggyBankVault();
