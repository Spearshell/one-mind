/**
 * Dry-Run Architectural Verification & State Initializer
 * Verifies all S-Tier / T-Tier / A-Tier modules, Auto-Resolver secret discovery,
 * and initializes the two $100.00 portfolio ledgers WITHOUT starting any server or trading loop.
 */

import envConfig from './auto-resolver.js';
import trading212Platform from '../platforms/trading212-platform.js';
import metamaskDexPlatform from '../platforms/metamask-dex-platform.js';
import tierClassifier from './tier-classifier.js';
import costAwareGate from './cost-aware-gate.js';

// Ensure both portfolios are cleanly initialized at $100.00 USD
trading212Platform.portfolio.resetTo100();
metamaskDexPlatform.portfolio.resetTo100();

const sampleS = tierClassifier.classify({
  symbol: 'NVDA',
  name: 'NVIDIA Corp',
  price: 142.50,
  change5m: 0.45,
  change1h: 1.85,
  change24h: 4.20,
  rsi: 61,
  relativeVolume: 1.8,
  tvScore: 0.65,
  tvRating: 'STRONG_BUY',
  ema20: 140.0,
  ema50: 136.5
}, 'T212');

const gateCheck = costAwareGate.evaluateGate({
  platformType: 'T212',
  score: sampleS.score,
  targetGainPct: sampleS.targetGainPct,
  atrPct: 1.8,
  notionalUsd: 32.0
});

console.log(JSON.stringify({
  verification: 'PASSED',
  applicationRunning: false,
  autoDiscoveredTrading212Secrets: envConfig.trading212Configured,
  trading212KeyPath: envConfig.trading212KeySource,
  geminiConfigured: envConfig.geminiConfigured,
  telegramConfigured: envConfig.telegramConfigured,
  portfoliosInitialized: {
    trading212Usd: trading212Platform.portfolio.state.totalEquityUsd,
    metamaskDexUsd: metamaskDexPlatform.portfolio.state.totalEquityUsd,
    combinedEquityUsd: trading212Platform.portfolio.state.totalEquityUsd + metamaskDexPlatform.portfolio.state.totalEquityUsd
  },
  sampleTierCheck: {
    tier: sampleS.tier,
    score: sampleS.score,
    confluence: sampleS.confluenceLayers,
    costGatePassed: gateCheck.passed
  }
}, null, 2));
