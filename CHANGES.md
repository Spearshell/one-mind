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
| 1 | core/market-hours.js | Buy only 09:45-10:30 New York time (was 09:45-12:00 until 2026-11-03) | as originally running: -$112 -> -$7.67 together with 2-5 | `T212_ENTRY_WINDOW_ET=global` |
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

## 2026-11-03 research round (18 days, SPY filter on, 3 random seeds)

| Buy window | Result after costs (seeds 1 / 7 / 99) | Worst drop | 1st half / 2nd half (seed 1) |
|---|---|---|---|
| 09:45-12:00 (old) | -2.01 / -8.55 / - | 6.9 / 11.8 | -0.95 / -1.06 |
| **09:45-10:30 (new default)** | **+4.96 / +3.19 / +5.35** | 2.1 / 3.5 / 2.1 | +5.40 / -0.44 |
| 09:45-11:00 | +2.56 / -2.94 / +4.14 | 5.1 / 6.0 / 4.7 | +1.77 / +0.79 |
| 09:45-10:30 without SPY filter | -8.18 | 10.3 | -2.97 / -5.21 |
| max 1 / 2 positions per desk | -4.76 / -1.63 | | |
| wider stops (0.8x, max 6%) | -1.57 | | |

Versus buying the same stock at a random time the same day, held as long (after costs):
old window -0.54%/trade, 09:45-10:30 +0.48%/trade, 09:45-11:00 +0.31%/trade (standard error ~0.37, so not yet
statistically proven). About 2 trades a day. The nightly backtest keeps checking it as days are added.
Reproduce: `$env:SRC="src-r"; $env:T212_ENTRY_WINDOW_ET="09:45-10:30"; node replay.mjs`, random check: `backtest-lab\randbase.py`.

## Honest status
Best version: about +$3 to +$5 over 18 days on $200 after costs (09:45-10:30 + SPY filter), first real positive result, still a small sample.
It beats random entries by ~0.5%/trade but not yet with statistical confidence, and the second half is flat. Keep it on paper.

Backups of every earlier version: `Metamask 2026\_backup_2026-11-0*`.

## 2026-11-03 Trading212 order fixes (from real broker rejections in the console)

| Error | Cause | Fix (addons/trading212-live-client.js, platforms/*.js, core/portfolio-manager.js) |
|---|---|---|
| quantity-precision-mismatch | 4-decimal quantities | round DOWN to 2 decimals, retry 1 then 0 on that error, remember per ticker |
| min-opened-position-exceeded (SELL) | sold paper quantity the broker never bought | each position stores brokerQty (what Trading212 really filled); SELL sends exactly that, or stays paper-only |
| orders silently skipped | 2.2 s spacing rule dropped the second order in a cycle | it now waits its turn |

Tested with a mocked broker: BUY 4.27 rejected, 4.2 accepted, SELL -4.2 sent, sell of a never-filled position not sent.
Positions bought before this fix (JD, RIVN, BE today) close paper-only; your own practice holdings are never touched.
