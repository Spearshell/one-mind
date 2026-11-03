/**
 * Desk 2: Trading212 Institutional Volume (VWAP/VWMA), RVOL & Global Macro Engine ($100.00 Live Demo)
 * Option A (100% Full-Power Trading212 Construct):
 * - Dedicated to TradingView's Built-In Volume Strategy Builder:
 *   - Institutional VWAP + VWMA Accumulation (close > VWAP and VWMA > SMA20)
 *   - Relative Volume (RVOL 10d) Surge + Money Flow Index (MFI 14) Inflow
 *   - Covers NASDAQ, NYSE, AMEX, ETFs, Crypto-Proxy Equities (MSTR/COIN/MARA), and UK LSE
 * - Cross-checks Desk 1 open positions so Desk 1 and Desk 2 never hold duplicate tickers.
 * - Zero DEX gas fees (~0.10%-0.16% institutional equity spread friction).
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

export class Trading212VolumeMacroDesk {
  constructor() {
    this.platformId = 'metamask-dex'; // Preserves state ledger filename for seamless reset/verify scripts
    this.platformName = 'Trading212 • Desk 2 (Institutional Volume & VWAP Macro)';
    this.portfolio = new PlatformPortfolio(
      this.platformId,
      this.platformName,
      envConfig.startingCapitalPerPlatform.metamaskDex
    );
    this.decisionAuditLog = [];
    this.discoveredCandidates = [];
    this.walletTelemetry = {
      label: 'Trading212 Institutional Volume',
      connected: envConfig.trading212Configured,
      network: 'NYSE / NASDAQ / AMEX / LSE',
      poolsScanned: 0
    };
  }

  /**
   * Dynamic Zero-Hardcode Institutional Volume & VWAP Discovery via TradingView Screener
   */
  async discoverLiveVolumeUniverse() {
    const rawList = await tvScanner.scanInstitutionalVolumeMacro(30);
    const seen = new Set();
    const candidates = [];

    for (const item of rawList) {
      if (seen.has(item.symbol)) continue;
      seen.add(item.symbol);
      candidates.push({
        ...item,
        assetClass: 'T212_INSTITUTIONAL_VWAP',
        t212Ticker: `${item.symbol}_EQ`
      });
    }

    // Rank by Relative Volume (RVOL) + VWAP/VWMA alignment + Money Flow Index (MFI) with dynamic exploration
    candidates.sort((a, b) => {
      const aVwapBonus = a.price >= a.vwap && a.vwma >= a.sma20 ? 15 : 0;
      const bVwapBonus = b.price >= b.vwap && b.vwma >= b.sma20 ? 15 : 0;
      const scoreA = (a.relativeVolume * 2.2) + aVwapBonus + (a.tvScore * 14) + (a.change24h * 0.5) + (Math.random() * 4.5);
      const scoreB = (b.relativeVolume * 2.2) + bVwapBonus + (b.tvScore * 14) + (b.change24h * 0.5) + (Math.random() * 4.5);
      return scoreB - scoreA;
    });

    this.discoveredCandidates = candidates.slice(0, 30);
    await t212LiveClient.enrichWithLiveQuotes(this.discoveredCandidates, 16);
    this.walletTelemetry.poolsScanned = this.discoveredCandidates.length;
    return this.discoveredCandidates;
  }

  /**
   * Executes one full autonomous cycle for Trading212 Desk 2 ($100.00 Live Demo)
   */
  async runCycle(peerOpenSymbols = new Set()) {
    const candidates = await this.discoverLiveVolumeUniverse();
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

    // 3. Evaluate Discovered Institutional Volume Candidates for New Entries
    for (const candidate of candidates.slice(0, 12)) {
      if (this.portfolio.state.openPositions.length >= maxOpen) break;
      if (this.portfolio.hasOpenSymbol(candidate.symbol)) continue;
      if (peerOpenSymbols.has(candidate.symbol.toUpperCase())) continue;
      if (learnerGuardian.isSymbolOnCooldown(candidate.symbol)) continue;

      // Classify using T212 institutional equity profile (0% commission, zero gas bleed)
      const tierRes = tierClassifier.classify(candidate, 'T212', health.learnedWeights);
      const plannedSpendUsd = Number((this.portfolio.state.totalEquityUsd * (tierRes.allocationPct || 0.24)).toFixed(2));

      const gateRes = costAwareGate.evaluateGate({
        platformType: 'T212',
        score: tierRes.score,
        targetGainPct: tierRes.targetGainPct || 2.0,
        atrPct: candidate.volatilityD || candidate.atrPct || 1.4,
        notionalUsd: plannedSpendUsd
      });

      const yahooActive = candidate.isActivelyTradingNow !== false && (candidate.change24h >= -0.2 || candidate.change15m > 0);
      const finalAccepted = tierRes.accepted && gateRes.passed && yahooActive && this.portfolio.state.cashUsd >= 10.0;

      const auditEntry = {
        time: new Date().toLocaleTimeString(),
        platform: 'T212 • Desk 2 (VWAP Volume)',
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
            volatilityD: tierRes.tvVolStrategy?.volatilityD || candidate.volatilityD || 1.5,
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
      wallet: this.walletTelemetry,
      portfolio: this.portfolio.state,
      health: learnerGuardian.computeHealthStatus(this.portfolio.state),
      aiInsight: geminiArchitect.latestInsights.T212,
      discoveredCandidates: this.discoveredCandidates.slice(0, 15),
      decisionAuditLog: this.decisionAuditLog.slice(0, 20)
    };
  }
}

export default new Trading212VolumeMacroDesk();
