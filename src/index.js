/**
 * Master Dual-Desk Trading212 Live Demo Orchestrator (Construct 2026 • Option A)
 * Unifies:
 * 1. Trading212 Desk 1: Volatility Squeeze & Momentum Breakout Engine ($100.00 Live Demo Capital)
 * 2. Trading212 Desk 2: Institutional Volume (VWAP/VWMA/RVOL) & Global Macro Engine ($100.00 Live Demo Capital)
 * Under S-Tier / T-Tier / A-Tier Confluence, TradingView Built-In Volatility & Volume Strategy Suite,
 * Cost-Aware Anti-Bleed Gate (~0.10%-0.16% zero-commission equity friction), Smart Chart-Reading Exit Engine,
 * and Self-Learning Feature Optimizer.
 */

import envConfig from './core/auto-resolver.js';
import trading212Platform from './platforms/trading212-platform.js';
import metamaskDexPlatform from './platforms/metamask-dex-platform.js';
import futurePiggyBankVault from './core/future-piggybank-vault.js';
import t212LiveClient from './addons/trading212-live-client.js';
import learnerAgent from './agents/learner-agent.js';
import globalMarketRelay from './core/global-market-relay.js';
import { inEntryWindow } from './core/market-hours.js';
import { createCommandCenterServer } from './ui/command-center.js';
import telegramBridge from './addons/telegram-command-bridge.js';

export class MasterConstructOrchestrator {
  constructor() {
    this.trading212 = trading212Platform;
    this.metamaskDex = metamaskDexPlatform; // Desk 2: Trading212 Institutional Volume & VWAP Desk
    this.piggyBank = futurePiggyBankVault;
    this.learnerAgent = learnerAgent;
    this.globalMarketRelay = globalMarketRelay;
    this.port = parseInt(process.env.PORT || '8800', 10);
    this.scanIntervalMs = parseInt(process.env.SCAN_INTERVAL_MS || '10000', 10);
    this.running = false;
    this.paused = false;
    this.server = null;
  }

  resetAllPortfoliosTo100() {
    this.trading212.portfolio.resetTo100();
    this.metamaskDex.portfolio.resetTo100();
    this.piggyBank.resetVault();
  }

  getMasterStatus() {
    const t212Status = this.trading212.getStatus();
    const dexStatus = this.metamaskDex.getStatus();
    const combinedEq = Number((t212Status.portfolio.totalEquityUsd + dexStatus.portfolio.totalEquityUsd).toFixed(2));

    return {
      constructVersion: '6.0.0-24/7-AUTONOMOUS-LEARNER-RELAY',
      mode: process.env.CONSTRUCT_MODE || 'live_demo',
      paused: this.paused,
      combinedStartingEquityUsd: 200.00,
      combinedCurrentEquityUsd: combinedEq,
      liveExecutionStats: t212LiveClient.executionStats,
      learnerAgent: this.learnerAgent.getStatus(),
      globalMarketRelay: this.globalMarketRelay.getRelayStatus(),
      piggyBank: this.piggyBank.getStatus(combinedEq),
      trading212: t212Status,
      metamaskDex: dexStatus,
      timestamp: new Date().toISOString()
    };
  }

  async start() {
    console.log('================================================================================');
    console.log('⚡ CONSTRUCT 2026: 100% FULL-POWER TRADING212 DUAL-DESK LIVE DEMO (USD + MT5)');
    console.log('================================================================================');
    console.log(`• Trading212 Desk 1 (Volatility Squeeze): $${this.trading212.portfolio.state.totalEquityUsd.toFixed(2)} (API Key: ${envConfig.trading212KeySource})`);
    console.log(`• Trading212 Desk 2 (VWAP & RVOL Macro):  $${this.metamaskDex.portfolio.state.totalEquityUsd.toFixed(2)} (Zero-Commission Institutional Flow)`);
    console.log(`• Combined Master Capital:                $${(this.trading212.portfolio.state.totalEquityUsd + this.metamaskDex.portfolio.state.totalEquityUsd).toFixed(2)}`);
    console.log(`• Strategy Engine:                        TradingView Volatility & Volume Suite + MT5 24/5 Live Tick Feed`);
    console.log(`• Command Center UI:                      http://127.0.0.1:${this.port}`);
    console.log('================================================================================');

    this.running = true;
    this.server = createCommandCenterServer(this, this.port);
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`[Command Center] 🖥️ Trading212 Dual-Desk Command Center (USD) online at http://127.0.0.1:${this.port}`);
    });

    await telegramBridge.sendAlert(
      `⚡ <b>CONSTRUCT 2026: FULL-POWER TRADING212 DUAL-DESK ONLINE (USD + MT5)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• <b>Desk 1 (Volatility & Squeeze):</b> $${this.trading212.portfolio.state.totalEquityUsd.toFixed(2)}\n` +
      `• <b>Desk 2 (VWAP & RVOL Macro):</b> $${this.metamaskDex.portfolio.state.totalEquityUsd.toFixed(2)}\n` +
      `• <b>Strategy Engine:</b> TradingView Volatility & Volume + MT5 24/5 Live Tick Bridge\n` +
      `• <b>Command Center:</b> http://127.0.0.1:${this.port}`
    );

    this._runPatrolLoop();
  }

  async _runPatrolLoop() {
    while (this.running) {
      if (!this.paused) {
        try {
          // 1. Run Autonomous 24/7 Learner Agent (Fill audit, regime calibration & strategy weights)
          await this.learnerAgent.runOptimizationCycle(this.trading212.portfolio, this.metamaskDex.portfolio);

          // Efficiency: nothing can be bought and nothing is held -> skip the scans (no TradingView/Yahoo/Google
          // traffic overnight and at weekends); check again in a minute.
          const anyOpen = this.trading212.portfolio.state.openPositions.length + this.metamaskDex.portfolio.state.openPositions.length;
          if (!anyOpen && !inEntryWindow()) {
            this.idleSince = this.idleSince || Date.now();
            await new Promise(r => setTimeout(r, Math.max(this.scanIntervalMs, 60000)));
            continue;
          }
          if (this.idleSince) { console.log('[Patrol] Buy window open / positions held - scanning resumed'); this.idleSince = null; }

          const desk2Symbols = new Set(this.metamaskDex.portfolio.state.openPositions.map(p => p.symbol.toUpperCase()));
          await this.trading212.runCycle(desk2Symbols);

          const desk1Symbols = new Set(this.trading212.portfolio.state.openPositions.map(p => p.symbol.toUpperCase()));
          await this.metamaskDex.runCycle(desk1Symbols);

          await this.piggyBank.checkAndAutoSiphon(this.trading212.portfolio, this.metamaskDex.portfolio);
        } catch (err) {
          console.error('[Patrol-Loop Guardian] Recovered from cycle error:', err?.message || err);
        }
      }
      await new Promise(r => setTimeout(r, this.scanIntervalMs));
    }
  }
}

// Only start if invoked directly as main entrypoint
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('src/index.js');
if (isMain) {
  // Prevent accidental Ctrl+C (when copying console text in Windows CMD) from killing the engine
  process.on('SIGINT', () => {
    console.log('\n[Copy-Shield] 🛡️ Ctrl+C intercepted (Safe Text-Copy Mode) — Engine remains 100% ONLINE!');
  });
  process.on('uncaughtException', (err) => {
    console.error('[Self-Healing Guardian] Recovered from runtime exception:', err?.message || err);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[Self-Healing Guardian] Recovered from async rejection:', reason?.message || reason);
  });

  const orchestrator = new MasterConstructOrchestrator();
  orchestrator.start().catch(err => {
    console.error('[Fatal] Orchestrator error:', err);
  });
}
