/**
 * Dual-Desk $100.00 Live-Demo Portfolio & Real-Time Mark-to-Market Ledger
 * Option A (Trading212 0% Commission Institutional Equity Mode):
 * - Zero entry/exit commission bleed (new entries start at $0.00 / 0.00% instead of instant red -0.16%)
 * - Real-time mark-to-market equity, unrealized PnL, realized PnL, and closed trade journal
 *
 * Backtest fix (2026-11-02): Trading212 charges no commission, but a GBP account pays a 0.15% currency fee on every
 * buy and every sell of a US stock, plus the spread. Closed trades now book those real costs, so the dashboard's
 * realized P&L shows what the trade really made. .env: BOOK_REAL_COSTS=false to switch off,
 * T212_FX_FEE_PCT (0.15; 0 if you trade from a USD balance), T212_SPREAD_PCT (0.05), T212_EXT_SPREAD_PCT (0.25,
 * pre/after-hours).
 */

import fs from 'node:fs';
import path from 'node:path';
import envConfig from './auto-resolver.js';
import { usSession, envFlag, envNum } from './market-hours.js';

function sideCostPct(session) {
  return envNum('T212_FX_FEE_PCT', 0.15) + (session === 'regular' ? envNum('T212_SPREAD_PCT', 0.05) : envNum('T212_EXT_SPREAD_PCT', 0.25));
}

export class PlatformPortfolio {
  constructor(platformId, platformName, startingCapitalUsd = 100.00) {
    this.platformId = platformId;
    this.platformName = platformName;
    this.startingCapitalUsd = Number(startingCapitalUsd);
    this.filePath = path.join(envConfig.stateDir, `${platformId}-portfolio.json`);
    this.state = this._loadOrInit();
  }

  _createFreshState() {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      startingCapitalUsd: this.startingCapitalUsd,
      cashUsd: this.startingCapitalUsd,
      investedUsd: 0.00,
      unrealizedPnlUsd: 0.00,
      realizedPnlUsd: 0.00,
      totalFeesPaidUsd: 0.00,
      totalEquityUsd: this.startingCapitalUsd,
      peakEquityUsd: this.startingCapitalUsd,
      totalReturnPct: 0.00,
      winCount: 0,
      lossCount: 0,
      openPositions: [],
      closedTrades: [],
      equityCurve: [
        { ts: new Date().toISOString(), equityUsd: this.startingCapitalUsd }
      ],
      updatedAt: new Date().toISOString()
    };
  }

  _loadOrInit() {
    try {
      if (!fs.existsSync(envConfig.stateDir)) {
        fs.mkdirSync(envConfig.stateDir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        if (parsed && typeof parsed.cashUsd === 'number') {
          return parsed;
        }
      }
    } catch (_) {}
    const fresh = this._createFreshState();
    this.save(fresh);
    return fresh;
  }

  save(state = this.state) {
    try {
      if (!fs.existsSync(envConfig.stateDir)) {
        fs.mkdirSync(envConfig.stateDir, { recursive: true });
      }
      const tmp = `${this.filePath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
      fs.renameSync(tmp, this.filePath);
    } catch (_) {}
  }

  resetTo100() {
    this.state = this._createFreshState();
    this.save();
    return this.state;
  }

  hasOpenSymbol(symbol) {
    const s = String(symbol).toUpperCase();
    return this.state.openPositions.some(p => p.symbol.toUpperCase() === s);
  }

  openPosition({
    symbol,
    name,
    tvSymbol,
    exchange = 'NASDAQ',
    yahooSymbol = null,
    address = null,
    tier = 'S-TIER',
    score = 85,
    entryPrice,
    notionalUsd,
    roundTripCostPct = 0.00,
    targetGainPct = 4.0,
    stopLossPct = 1.5,
    stagnationMaxMin = 25,
    ladderSteps = [],
    activeSignals = [],
    strategyId = null,
    strategyName = null,
    passedBlocks = [],
    volatilityD = 2.5,
    tvVolConfirmed = '4/5',
    rationale = '',
    brokerQty = 0
  }) {
    const px = Number(entryPrice);
    const spend = Math.min(Number(notionalUsd), this.state.cashUsd);
    if (px <= 0 || spend < 5.0) return null;

    // Trading212 has 0% commission — entry starts at exact $0.00 (0.00%) PnL
    const quantity = spend / px;

    const pos = {
      id: `${this.platformId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      platformId: this.platformId,
      symbol: String(symbol).toUpperCase(),
      name: name || symbol,
      tvSymbol: tvSymbol || symbol,
      exchange: exchange || 'NASDAQ',
      yahooSymbol: yahooSymbol || String(symbol).toUpperCase(),
      address,
      tier,
      score,
      entryPrice: px,
      currentPrice: px,
      quantity,
      notionalUsd: Number(spend.toFixed(2)),
      entryFeeUsd: 0.00,
      roundTripCostPct: 0.00,
      targetGainPct,
      stopLossPct,
      stagnationMaxMin,
      ladderSteps,
      activeSignals,
      strategyId,
      strategyName,
      passedBlocks,
      volatilityD,
      tvVolConfirmed,
      netRoiPct: 0.00,
      peakNetRoiPct: 0.00,
      unrealizedPnlUsd: 0.00,
      statusHeader: 'Monitoring Structure (+0.00%)',
      rationale,
      brokerQty: Number(brokerQty) || 0, // shares the Trading212 practice account really bought
      entrySession: usSession(),
      entryTime: new Date().toISOString()
    };

    this.state.cashUsd = Number((this.state.cashUsd - spend).toFixed(4));
    this.state.openPositions.push(pos);
    this.recalculateMarkToMarket();
    return pos;
  }

  updatePositionPrice(symbol, currentPrice, statusHeader = null) {
    const s = String(symbol).toUpperCase();
    const px = Number(currentPrice);
    if (px <= 0) return;

    for (const pos of this.state.openPositions) {
      if (pos.symbol === s) {
        pos.currentPrice = px;
        const grossValueUsd = pos.quantity * px;
        const netPnlUsd = grossValueUsd - pos.notionalUsd;
        const netRoiPct = (netPnlUsd / pos.notionalUsd) * 100;

        pos.unrealizedPnlUsd = Number(netPnlUsd.toFixed(2));
        pos.netRoiPct = Number(netRoiPct.toFixed(2));
        pos.peakNetRoiPct = Number(Math.max(pos.peakNetRoiPct || 0, pos.netRoiPct).toFixed(2));
        if (statusHeader) pos.statusHeader = statusHeader;
      }
    }
    this.recalculateMarkToMarket();
  }

  closePosition(symbol, exitPrice, exitReason = 'Target Reached', exitType = 'TAKE_PROFIT') {
    const s = String(symbol).toUpperCase();
    const idx = this.state.openPositions.findIndex(p => p.symbol === s);
    if (idx === -1) return null;

    const pos = this.state.openPositions[idx];
    const px = Number(exitPrice || pos.currentPrice || pos.entryPrice);
    const grossReturnedUsd = pos.quantity * px;
    const exitSession = usSession();
    const entrySession = pos.entrySession || exitSession;
    const estCostUsd = envFlag('BOOK_REAL_COSTS', true)
      ? (pos.notionalUsd * sideCostPct(entrySession) + grossReturnedUsd * sideCostPct(exitSession)) / 100
      : 0;
    const netReturnedUsd = Number((grossReturnedUsd - estCostUsd).toFixed(4));
    const grossPnlUsd = Number((grossReturnedUsd - pos.notionalUsd).toFixed(2));
    const netPnlUsd = Number((netReturnedUsd - pos.notionalUsd).toFixed(2));
    const netPnlPct = Number(((netPnlUsd / pos.notionalUsd) * 100).toFixed(2));
    const heldMinutes = Number(((Date.now() - new Date(pos.entryTime).getTime()) / 60000).toFixed(1));

    this.state.openPositions.splice(idx, 1);
    this.state.cashUsd = Number((this.state.cashUsd + netReturnedUsd).toFixed(4));
    this.state.realizedPnlUsd = Number((this.state.realizedPnlUsd + netPnlUsd).toFixed(2));

    if (netPnlUsd > 0.001) {
      this.state.winCount += 1;
    } else if (netPnlUsd < -0.001) {
      this.state.lossCount += 1;
    }

    const closedRecord = {
      id: pos.id,
      platformId: this.platformId,
      symbol: pos.symbol,
      name: pos.name,
      tvSymbol: pos.tvSymbol,
      tier: pos.tier,
      score: pos.score,
      activeSignals: pos.activeSignals || [],
      strategyId: pos.strategyId || null,
      strategyName: pos.strategyName || null,
      passedBlocks: pos.passedBlocks || [],
      volatilityD: pos.volatilityD || 2.5,
      tvVolConfirmed: pos.tvVolConfirmed || '4/5',
      notionalUsd: pos.notionalUsd,
      netReturnedUsd: Number(netReturnedUsd.toFixed(2)),
      entryPrice: pos.entryPrice,
      exitPrice: px,
      netPnlUsd,
      netPnlPct,
      grossPnlUsd,
      estCostUsd: Number(estCostUsd.toFixed(2)),
      peakNetRoiPct: pos.peakNetRoiPct,
      heldMinutes,
      exitType,
      exitReason,
      entrySession,
      exitSession,
      entryTime: pos.entryTime,
      closeTime: new Date().toISOString()
    };

    this.state.closedTrades.unshift(closedRecord);
    if (this.state.closedTrades.length > 100) {
      this.state.closedTrades = this.state.closedTrades.slice(0, 100);
    }

    this.recalculateMarkToMarket();
    return closedRecord;
  }

  recalculateMarkToMarket() {
    let invested = 0;
    let unrealized = 0;
    let openMarketVal = 0;

    for (const pos of this.state.openPositions) {
      invested += pos.notionalUsd;
      unrealized += pos.unrealizedPnlUsd;
      openMarketVal += pos.notionalUsd + pos.unrealizedPnlUsd;
    }

    this.state.investedUsd = Number(invested.toFixed(2));
    this.state.unrealizedPnlUsd = Number(unrealized.toFixed(2));
    this.state.totalEquityUsd = Number((this.state.cashUsd + openMarketVal).toFixed(2));
    this.state.peakEquityUsd = Number(Math.max(this.state.peakEquityUsd || this.startingCapitalUsd, this.state.totalEquityUsd).toFixed(2));
    this.state.totalReturnPct = Number((((this.state.totalEquityUsd - this.startingCapitalUsd) / this.startingCapitalUsd) * 100).toFixed(2));
    this.state.updatedAt = new Date().toISOString();

    const curve = this.state.equityCurve || [];
    curve.push({ ts: this.state.updatedAt, equityUsd: this.state.totalEquityUsd });
    if (curve.length > 120) curve.shift();
    this.state.equityCurve = curve;

    this.save();
    return this.state;
  }
}
