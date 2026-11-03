/**
 * Desk 1: Trading212 Volatility Squeeze & Momentum Breakout Engine ($100.00 Live Demo)
 * Option A (100% Full-Power Trading212 Construct):
 * - Authenticates with Trading212 API using auto-discovered credentials from Ready/exe/secrets/trading212.key
 * - Dynamically discovers high-volatility US (NASDAQ, NYSE, AMEX) equities & ETFs via TradingView's
 *   Built-In Volatility Strategy Builder (TTM Bollinger/Keltner Squeeze, ATR/P.SAR Trend, Volatility.D Expansion).
 * - ZERO hardcoded symbol lists and zero DEX gas bleed (~0.10%-0.16% ultra-low institutional friction).
 */

import envConfig from '../core/auto-resolver.js';
import { PlatformPortfolio } from '../core/portfolio-manager.js';
import tierClassifier from '../core/tier-classifier.js';
import costAwareGate from '../core/cost-aware-gate.js';
import smartChartExit from '../core/smart-chart-exit.js';
import learnerGuardian from '../core/learner-guardian.js';
import tvScanner from '../addons/tradingview-scanner.js';
import t212LiveClient from '../addons/trading212-live-client.js';
import geminiArchitect from '../addons/gemini-alpha-architect.js';
import telegramBridge from '../addons/telegram-command-bridge.js';
import marketRegime from '../core/market-regime.js';
import { usSession, entryWindow } from '../core/market-hours.js';

export class Trading212Platform {
  constructor() {
    this.platformId = 'trading212';
    this.platformName = 'Trading212 • Desk 1 (Volatility & Squeeze Breakouts)';
    this.portfolio = new PlatformPortfolio(
      this.platformId,
      this.platformName,
      envConfig.startingCapitalPerPlatform.trading212
    );
    this.decisionAuditLog = [];
    this.discoveredCandidates = [];
    this.brokerStatus = {
      connected: envConfig.trading212Configured,
      keySource: envConfig.trading212KeySource,
      sessionMode: this._detectMarketSession(),
      instrumentsSynced: 0,
      liveAccountCash: null
    };
  }

  _detectMarketSession() {
    const labels = { regular: 'US REGULAR SESSION', 'pre-market': 'US PRE-MARKET', 'after-hours': 'US AFTER-HOURS', closed: 'US MARKET CLOSED' };
    const w = entryWindow();
    return `${labels[usSession()] || 'US MARKET'} • BUYS ${w ? w.label + ' NEW YORK' : '24/5'}`;
  }

  _getAuthHeader() {
    const key = process.env.TRADING212_API_KEY || '';
    const secret = process.env.TRADING212_API_SECRET || '';
    if (!key || !secret) return null;
    return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`;
  }

  /**
   * Probes live Trading212 API account summary (Demo & Live endpoints)
   */
  async syncBrokerTelemetry() {
    this.brokerStatus.sessionMode = this._detectMarketSession();
    const stats = await t212LiveClient.syncAccountTelemetry();
    if (stats.accountCash !== null) {
      this.brokerStatus.connected = true;
      this.brokerStatus.liveAccountCash = stats.accountCash;
      this.brokerStatus.liveEnv = stats.lastConnectedEnv;
    }
    return this.brokerStatus;
  }

  /**
   * Dynamic Zero-Hardcode Discovery via TradingView Volatility Breakout Screener
   */
  async discoverLiveUniverse() {
    const breakouts = await tvScanner.scanVolatilityBreakouts(25);
    const seen = new Set();
    const combined = [];

    for (const eq of breakouts) {
      if (seen.has(eq.symbol)) continue;
      seen.add(eq.symbol);
      combined.push({
        ...eq,
        assetClass: 'T212_VOL_BREAKOUT',
        t212Ticker: `${eq.symbol}_US_EQ`
      });
    }

    // Rank by Volatility Expansion + 1h Velocity + TradingView Rating with light stochastic tie-breaking
    combined.sort((a, b) => {
      const scoreA = (a.tvScore * 16) + (a.change1h * 1.8) + (a.volatilityD * 0.35) + (Math.random() * 4.5);
      const scoreB = (b.tvScore * 16) + (b.change1h * 1.8) + (b.volatilityD * 0.35) + (Math.random() * 4.5);
      return scoreB - scoreA;
    });

    this.discoveredCandidates = combined.slice(0, 30);
    await t212LiveClient.enrichWithLiveQuotes(this.discoveredCandidates, 16);
    this.brokerStatus.instrumentsSynced = this.discoveredCandidates.length;
    return this.discoveredCandidates;
  }

  /**
   * Executes one full autonomous cycle for Trading212 Desk 1 ($100.00 Live Demo)
   */
  async runCycle(peerOpenSymbols = new Set()) {
    await this.syncBrokerTelemetry();
    const candidates = await this.discoverLiveUniverse();
    const candidateMap = new Map(candidates.map(c => [c.symbol.toUpperCase(), c]));

    // 1. Update & Evaluate Open Positions with Live 1m + MT5 24/5 Boosted Quotes
    for (const pos of [...this.portfolio.state.openPositions]) {
      let liveItem = candidateMap.get(pos.symbol.toUpperCase());
      const mt5Quote = await t212LiveClient.resolveMt5BoostedPositionQuote(pos, liveItem);
      if (mt5Quote && mt5Quote.price > 0) {
        liveItem = { ...(liveItem || {}), price: mt5Quote.price };
      }
      const exitCheck = smartChartExit.evaluatePositionExit(pos, liveItem || { price: pos.currentPrice });
      const latestPrice = exitCheck.latestPrice || (liveItem ? liveItem.price : pos.currentPrice);
      this.portfolio.updatePositionPrice(pos.symbol, latestPrice, exitCheck.reason);

      if (exitCheck.shouldExit) {
        await t212LiveClient.executeLiveDemoOrder({
          symbol: pos.symbol,
          side: 'SELL',
          notionalUsd: pos.notionalUsd,
          brokerQty: pos.brokerQty || 0,
          referencePrice: latestPrice
        });
        const closed = this.portfolio.closePosition(
          pos.symbol,
          latestPrice,
          exitCheck.reason,
          exitCheck.exitType
        );
        if (closed) {
          costAwareGate.recordClosedTrade('T212', closed.netPnlPct);
          learnerGuardian.recordTradeOutcome({
            symbol: closed.symbol,
            tier: closed.tier,
            netPnlUsd: closed.netPnlUsd,
            netPnlPct: closed.netPnlPct,
            activeSignals: closed.activeSignals || [],
            strategyId: closed.strategyId || null,
            passedBlocks: closed.passedBlocks || []
          });
          await telegramBridge.notifyExit(this.platformName, closed);
        }
      }
    }

    // 2. Check Guardian & Max Open Positions
    const health = learnerGuardian.computeHealthStatus(this.portfolio.state);
    const maxOpen = parseInt(process.env.MAX_OPEN_PER_PLATFORM || '3', 10);
    if (health.guardianLocked) return;
    const regime = await marketRegime.allowsBuys();
    this.marketRegimeNote = regime.reason;
    if (!regime.ok) return;

    // 3. Evaluate Discovered Volatility Breakout Candidates for New Entries
    for (const candidate of candidates.slice(0, 12)) {
      if (this.portfolio.state.openPositions.length >= maxOpen) break;
      if (this.portfolio.hasOpenSymbol(candidate.symbol)) continue;
      if (peerOpenSymbols.has(candidate.symbol.toUpperCase())) continue;
      if (learnerGuardian.isSymbolOnCooldown(candidate.symbol)) continue;

      const tierRes = tierClassifier.classify(candidate, 'T212', health.learnedWeights);
      const plannedSpendUsd = Number((this.portfolio.state.totalEquityUsd * (tierRes.allocationPct || 0.24)).toFixed(2));

      const gateRes = costAwareGate.evaluateGate({
        platformType: 'T212',
        score: tierRes.score,
        targetGainPct: tierRes.targetGainPct || 2.2,
        atrPct: candidate.volatilityD || candidate.atrPct || 1.5,
        notionalUsd: plannedSpendUsd
      });

      const yahooActive = candidate.isActivelyTradingNow !== false && (candidate.change24h >= -0.2 || candidate.change15m > 0);
      const finalAccepted = tierRes.accepted && gateRes.passed && yahooActive && this.portfolio.state.cashUsd >= 10.0;

      const auditEntry = {
        time: new Date().toLocaleTimeString(),
        platform: 'T212 • Desk 1 (Volatility)',
        symbol: candidate.symbol,
        name: candidate.name,
        tvSymbol: candidate.tvSymbol,
        price: candidate.price,
        change1h: candidate.change1h,
        change24h: candidate.change24h,
        rsi: candidate.rsi,
        tvRating: candidate.tvRating,
        tier: finalAccepted ? tierRes.tier : 'DECLINED',
        score: tierRes.score,
        confluence: tierRes.confluenceLayers,
        status: finalAccepted ? 'EXECUTED' : 'FILTERED',
        reason: finalAccepted ? `${tierRes.rationale} | ${gateRes.reason}` : (!tierRes.accepted ? tierRes.rationale : gateRes.reason)
      };

      this.decisionAuditLog.unshift(auditEntry);
      if (this.decisionAuditLog.length > 35) this.decisionAuditLog.pop();

      if (finalAccepted) {
        const aiAudit = await geminiArchitect.auditCandidate(candidate, tierRes, 'T212');
        if (aiAudit.approved) {
          const liveFill = await t212LiveClient.executeLiveDemoOrder({
            symbol: candidate.symbol,
            side: 'BUY',
            notionalUsd: plannedSpendUsd,
            referencePrice: candidate.price,
            exchange: candidate.exchange
          });
          const opened = this.portfolio.openPosition({
            symbol: candidate.symbol,
            brokerQty: liveFill.brokerDispatched ? liveFill.brokerQty : 0,
            name: candidate.name,
            tvSymbol: candidate.tvSymbol,
            exchange: candidate.exchange,
            yahooSymbol: liveFill.yahooSymbol || candidate.yahooSymbol || candidate.symbol,
            tier: tierRes.tier,
            score: tierRes.score,
            entryPrice: liveFill.fillPrice || candidate.price,
            notionalUsd: plannedSpendUsd,
            roundTripCostPct: gateRes.roundTripCostPct,
            targetGainPct: tierRes.targetGainPct,
            stopLossPct: tierRes.stopLossPct,
            stagnationMaxMin: tierRes.stagnationMaxMin,
            ladderSteps: tierRes.ladderSteps,
            activeSignals: tierRes.activeSignals || [],
            strategyId: tierRes.tvVolStrategy?.selectedStrategy?.strategyId || null,
            strategyName: tierRes.tvVolStrategy?.selectedStrategy?.strategyName || null,
            passedBlocks: tierRes.tvVolStrategy?.passedBlocks || [],
            volatilityD: tierRes.tvVolStrategy?.volatilityD || candidate.volatilityD || 1.8,
            tvVolConfirmed: tierRes.tvVolConfirmed || '3/5',
            rationale: aiAudit.summary
          });
          if (opened) {
            learnerGuardian.recordSymbolEntry(candidate.symbol);
            await telegramBridge.notifyEntry(this.platformName, opened);
          }
        }
      }
    }
  }

  getStatus() {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      broker: this.brokerStatus,
      portfolio: this.portfolio.state,
      health: learnerGuardian.computeHealthStatus(this.portfolio.state),
      aiInsight: geminiArchitect.latestInsights.T212,
      discoveredCandidates: this.discoveredCandidates.slice(0, 15),
      decisionAuditLog: this.decisionAuditLog.slice(0, 20)
    };
  }
}

export default new Trading212Platform();
