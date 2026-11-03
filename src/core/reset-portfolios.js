import trading212Platform from '../platforms/trading212-platform.js';
import metamaskDexPlatform from '../platforms/metamask-dex-platform.js';
import learnerGuardian from './learner-guardian.js';

trading212Platform.portfolio.resetTo100();
metamaskDexPlatform.portfolio.resetTo100();
learnerGuardian.resetLearnedStats();

console.log('✅ Both Live Demo Portfolios ($100.00 + $100.00) & Learner Volatility/Volume Strategy Weights initialized.');
