/**
 * In-House Strategy Builder, Strategy Finder & TradingView Bridge Playground
 * Option A (100% Full-Power Trading212 Dual-Desk Construct):
 * - Runs 100% standalone in-house (does NOT require the TradingView Desktop GUI window open)
 * - Still optionally launches TradingView Desktop on demand via `openDesktopApp(tvSymbol)`
 * - Demonstrates the In-House Strategy Builder, Strategy Finder, 6 Volatility Options,
 *   6 Volume Options, and the Self-Evolving Custom Strategy across both $100 Trading212 Desks.
 */

import { exec } from 'node:child_process';
import tvScanner from './tradingview-scanner.js';
import tierClassifier from '../core/tier-classifier.js';
import learnerGuardian from '../core/learner-guardian.js';
import inhouseBuilder from './inhouse-strategy-builder.js';

export class TradingViewDesktopBridge {
  constructor() {
    this.appId = 'TradingView.Desktop_n534cwy3pjxzj!TradingView.Desktop';
  }

  /**
   * Optional: Opens the installed TradingView Desktop application on Windows if requested
   */
  openDesktopApp(tvSymbol = null) {
    return new Promise((resolve) => {
      const cmd = tvSymbol
        ? `powershell -Command "Start-Process 'tradingview://chart?symbol=${encodeURIComponent(tvSymbol)}'"`
        : `powershell -Command "Start-Process 'shell:AppsFolder\\${this.appId}'"`;

      exec(cmd, (err) => {
        if (err) {
          exec(`powershell -Command "Start-Process 'shell:AppsFolder\\${this.appId}'"`, () => {
            resolve({ launched: true, method: 'AppsFolder', symbol: tvSymbol });
          });
        } else {
          resolve({ launched: true, method: tvSymbol ? 'ProtocolURI' : 'AppsFolder', symbol: tvSymbol });
        }
      });
    });
  }

  /**
   * Runs a live In-House Strategy Finder, Volatility & Volume Scan across both Trading212 Desks
   */
  async runLivePlaygroundScan() {
    const [desk1Raw, desk2Raw] = await Promise.all([
      tvScanner.scanVolatilityBreakouts(12),
      tvScanner.scanInstitutionalVolumeMacro(12)
    ]);

    const formatRow = (item) => {
      const tier = tierClassifier.classify(item, 'T212', learnerGuardian.learned.weights);
      const tvVol = tier.tvVolStrategy || {};
      const strat = tvVol.selectedStrategy || {};
      return {
        tvSymbol: item.tvSymbol,
        price: `$${item.price.toFixed(2)}`,
        strategyPicked: `${(strat.strategyName || 'Default').slice(0, 32)} (${strat.matchedBlocks || '0/6'})`,
        volD: `${tvVol.volatilityD || item.volatilityD}%`,
        vwapVwma: `${tvVol.aboveVwap ? '>VWAP' : '<VWAP'}${tvVol.vwmaBullish ? '+VWMA' : ''}`,
        rvolMfi: `${item.relativeVolume}x / MFI:${Math.round(tvVol.mfi || 50)}`,
        tier: tier.tier,
        score: `${tier.score}/100`,
        dynTpSl: tier.accepted ? `+${tier.targetGainPct}% / -${tier.stopLossPct}%` : '-'
      };
    };

    const desk1Volatility = desk1Raw.map(formatRow);
    const desk2VolumeMacro = desk2Raw.map(formatRow);

    return { desk1Volatility, desk2VolumeMacro };
  }
}

export default new TradingViewDesktopBridge();

// If executed directly, run the live In-House Strategy Builder & Strategy Finder scan
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('tradingview-desktop-bridge.js');
if (isMain) {
  const bridge = new TradingViewDesktopBridge();
  (async () => {
    console.log('🛠️ Running In-House Strategy Builder, Strategy Finder, Volatility & Volume Engine (100% Standalone)...');
    const { desk1Volatility, desk2VolumeMacro } = await bridge.runLivePlaygroundScan();

    console.log('\n🏛️ === DESK 1 ($100): TRADING212 VOLATILITY SQUEEZE & MOMENTUM BREAKOUTS ===');
    console.table(desk1Volatility.slice(0, 8));

    console.log('\n📊 === DESK 2 ($100): TRADING212 INSTITUTIONAL VOLUME, VWAP & MACRO ===');
    console.table(desk2VolumeMacro.slice(0, 8));

    const overview = inhouseBuilder.getOverview();
    console.log('\n🧬 === LEARNER AUTO-SYNTHESIZED CUSTOM STRATEGY ===');
    console.log(JSON.stringify(overview.synthesizedCustomStrategy, null, 2));
  })();
}
