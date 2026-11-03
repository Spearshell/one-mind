# Live demo: what was changed, why, and how to check it yourself

Every number below comes from `backtest-lab\replay.mjs`, which runs the bot's own code minute by minute over
Oct 8-30 2026 (17 trading days, 130 Trading212 stocks, $100 per desk) and charges Trading212's real costs
(0.15% currency fee each way + spread). Results are in `backtest-lab\results\<name>.json` / `<name>-trades.csv`.

## Reproduce any number (PowerShell, in `Metamask 2026\backtest-lab`)

```
$env:SRC="src-v6"; $env:TAG="my-check"; node replay.mjs          # current live rules
$env:T212_ENTRY_WINDOW_ET="global"; $env:T212_FLAT_BEFORE_CLOSE="false"; node replay.mjs   # the 24/7 version
$env:T212_MARKET_FILTER="off"; node replay.mjs                    # without the S&P filter
```
Takes ~2 minutes. Open `results\my-check-trades.csv` in Excel to see every trade.

## Changes (file -> what -> evidence -> how to undo)

| # | File | Change | Replay result | Undo in `.env` |
|---|---|---|---|---|
| 1 | core/market-hours.js | Buy only 09:45-12:00 New York time | as originally running: -$112 -> -$7.67 together with 2-5 | `T212_ENTRY_WINDOW_ET=global` |
| 2 | core/market-hours.js, core/smart-chart-exit.js | Sell everything 5 min before the US close | part of the above; 24/7 + no close-out = -$62 | `T212_FLAT_BEFORE_CLOSE=false` |
| 3 | core/tier-classifier.js | Stops 1.5-4% scaled to the stock's volatility (was max 1.65%) | tighter 0.35x stop -$38, 0.5x -$27, 0.8x -$21 | `T212_WIDE_STOPS=false` |
| 4 | core/smart-chart-exit.js | Break-even "rotation" exit and -0.65% "support break" exit off | -$26.8 -> -$8.6 | `T212_ANTI_STAGNATION_EXIT=true`, `T212_SUPPORT_BREAK_EXIT=true` |
| 5 | core/learner-guardian.js | One buy per stock per day | -$26.8 -> -$21.1 | `T212_ONE_ENTRY_PER_SYMBOL_PER_DAY=false` |
| 6 | addons/t212-instruments.js, tradingview-scanner.js | Only stocks Trading212 lists (23% of picks were US ETFs a UK account can't buy) | correctness | `T212_TRADABLE_ONLY=false` |
| 7 | addons/trading212-live-client.js | Trading212's own ticker codes (SOFI = IPOE_US_EQ etc.); order errors printed | correctness | - |
| 8 | addons/trading212-live-client.js | Orders only to the PRACTICE server | safety | `ALLOW_LIVE_MONEY_ORDERS=true` |
| 9 | core/portfolio-manager.js | Closed trades include the real fee + spread | dashboard honesty | `BOOK_REAL_COSTS=false` |
| 10 | core/market-regime.js, platforms/*.js | Buy only while SPY is up on the day and above VWAP | -$7.67 / -$10.69 -> -$2.05 / -$2.24 (2 seeds); QQQ version -$8.95 (weak evidence) | `T212_MARKET_FILTER=off` |
| 11 | index.js | Idle (no scanning) when nothing can be bought or is held | efficiency only, no trading effect | - |
| 12 | addons/trading212-live-client.js | Google quotes reused for 20 s | efficiency only | - |
| 13 | agents/learner-agent.js | State file saved once a minute instead of every 10 s | efficiency only | - |
| 14 | core/learner-guardian.js | Optional daily loss limit, OFF ($1 limit made it worse: -$12.37) | tested, not adopted | `T212_DAILY_LOSS_LIMIT_USD=2` |

Tested and rejected: anti-chase (skip >10% movers) -$16.40; only 3/5/8%+ movers -$8.23/-$12.88/-$6.44;
VWAP-extension cap -$7.34; Stockbee 4% breakout swing (2 years daily, 2,238 trades) +0.45%/trade vs +0.43% for
buying the same stocks on any random day = no edge.

## Honest status
Best version: about -$2 over 17 days on $200 after costs, about +$2.5 without the currency fee.
No version has yet beaten "buy the same stocks on a random day" in both halves of the test. Keep it on paper.

Backups of every earlier version: `Metamask 2026\_backup_2026-11-0*`.
