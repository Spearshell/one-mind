/**
 * Redesigned Next-Gen Dual-Platform Web Command Center (Trading212 + MetaMask 1inch DEX)
 * Features:
 * - Side-by-Side $100.00 + $100.00 ($200.00 Combined) Live-Demo Portfolio Decks
 * - Embedded Interactive TradingView Advanced Real-Time Chart Widget (Click any asset to load chart)
 * - S-Tier, T-Tier, and A-Tier Performance & Self-Learning Matrix
 * - Live Dynamic Discovery & Cost-Aware Gate Decision Stream
 * - Clean 'MetaMask' & 'Trading212' status pills (no raw hex wallet clutter)
 */

import http from 'node:http';
import tvDesktopBridge from '../addons/tradingview-desktop-bridge.js';
import t212LiveClient from '../addons/trading212-live-client.js';

export function createCommandCenterServer(orchestrator, port = 8800) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);

    if (url.pathname === '/api/chart' && req.method === 'GET') {
      const rawSym = url.searchParams.get('symbol') || 'NASDAQ:PERI';
      const parts = rawSym.includes(':') ? rawSym.split(':') : ['NASDAQ', rawSym];
      const exchange = parts[0] || 'NASDAQ';
      const cleanSym = (parts[1] || parts[0] || 'PERI').trim().toUpperCase();

      const [liveQuote, googleQuote] = await Promise.all([
        t212LiveClient.fetchLiveExecutionQuote(cleanSym, exchange),
        t212LiveClient.fetchGoogleFinanceQuote(cleanSym, exchange)
      ]);

      const master = orchestrator.getMasterStatus();
      const allOpen = [
        ...(master?.trading212?.portfolio?.openPositions || []),
        ...(master?.metamaskDex?.portfolio?.openPositions || [])
      ];
      const pos = allOpen.find(p => String(p.symbol).toUpperCase() === cleanSym) || null;
      let openPosition = null;
      if (pos) {
        const entry = Number(pos.entryPrice || 0);
        const tpPct = Number(pos.targetGainPct || 2.5);
        const slPct = Number(pos.stopLossPct || 1.5);
        openPosition = {
          symbol: pos.symbol,
          tier: pos.tier,
          entryPrice: entry,
          currentPrice: Number(pos.currentPrice || entry),
          targetPrice: Number((entry * (1 + tpPct / 100)).toFixed(entry < 1 ? 4 : 2)),
          stopPrice: Number((entry * (1 - slPct / 100)).toFixed(entry < 1 ? 4 : 2)),
          netRoiPct: pos.netRoiPct,
          strategyName: pos.strategyName || 'In-House Strategy'
        };
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      });
      res.end(JSON.stringify({
        ok: true,
        tvSymbol: `${exchange}:${cleanSym}`,
        symbol: cleanSym,
        exchange,
        googleUrl: googleQuote?.googleUrl || `https://www.google.com/finance/quote/${cleanSym}:${exchange}`,
        yahooUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(liveQuote?.yahooSymbol || cleanSym)}/?guccounter=1`,
        liveQuote,
        googleQuote,
        openPosition
      }));
      return;
    }

    if (url.pathname === '/api/learner-agent' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      });
      res.end(JSON.stringify({
        ok: true,
        learnerAgent: orchestrator.learnerAgent?.getStatus(),
        globalMarketRelay: orchestrator.globalMarketRelay?.getRelayStatus()
      }));
      return;
    }

    if (url.pathname === '/api/open-tv-desktop' && req.method === 'POST') {
      const sym = url.searchParams.get('symbol') || 'NASDAQ:NVDA';
      const out = await tvDesktopBridge.openDesktopApp(sym);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...out }));
      return;
    }

    if (url.pathname === '/api/status' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(orchestrator.getMasterStatus()));
      return;
    }

    if (url.pathname === '/api/toggle-pause' && req.method === 'POST') {
      orchestrator.paused = !orchestrator.paused;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, paused: orchestrator.paused }));
      return;
    }

    if (url.pathname === '/api/reset-100' && req.method === 'POST') {
      orchestrator.resetAllPortfoliosTo100();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: 'Both platforms reset to $100.00' }));
      return;
    }

    if (url.pathname === '/api/piggybank-deposit' && req.method === 'POST') {
      const amt = parseFloat(url.searchParams.get('amount') || '15');
      const status = await orchestrator.piggyBank.allocateTranche(amt, `MANUAL_SAVE_$${amt}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, piggyBank: status }));
      return;
    }

    // Unknown API routes answer 404 instead of the dashboard page (QA 2026-11-02)
    if (url.pathname.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Not found: ' + url.pathname }));
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Construct 2026 • Trading212 & MetaMask DEX Live Demo ($100 + $100)</title>
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <style>
    :root {
      --bg: #070a12;
      --panel: #0f1523;
      --panel-alt: #151d30;
      --border: #1e293b;
      --text: #f8fafc;
      --muted: #94a3b8;
      --blue: #38bdf8;
      --indigo: #6366f1;
      --purple: #a855f7;
      --green: #22c55e;
      --red: #ef4444;
      --amber: #f59e0b;
      --orange: #f97316;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px 26px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif;
      font-size: 13px;
    }
    /* Top Master Bar */
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(90deg, #0f172a 0%, #131c31 100%);
      border: 1px solid #263554;
      border-radius: 14px;
      padding: 16px 22px;
      margin-bottom: 20px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-title {
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.4px;
      background: linear-gradient(90deg, #38bdf8, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-sub {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn {
      background: var(--panel-alt);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn:hover { border-color: var(--blue); color: var(--blue); }
    .btn-primary {
      background: rgba(56, 189, 248, 0.14);
      border-color: rgba(56, 189, 248, 0.45);
      color: var(--blue);
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: var(--green);
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
    }

    /* Master KPIs */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: var(--muted);
    }
    .kpi-val {
      font-size: 21px;
      font-weight: 800;
      margin-top: 5px;
    }
    .kpi-sub {
      font-size: 11px;
      color: var(--muted);
      margin-top: 3px;
    }

    /* Dual Platform Split Grid */
    .dual-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 20px;
    }
    .platform-deck {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 18px;
    }
    .deck-t212 { border-top: 3px solid var(--blue); }
    .deck-dex { border-top: 3px solid var(--orange); }

    .deck-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .deck-title {
      font-size: 16px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mini-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .mini-box {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
    }

    /* Tier Badges */
    .tier-s {
      background: linear-gradient(90deg, rgba(168, 85, 247, 0.25), rgba(56, 189, 248, 0.25));
      border: 1px solid #a855f7;
      color: #e9d5ff;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 10px;
    }
    .tier-t {
      background: rgba(56, 189, 248, 0.16);
      border: 1px solid #38bdf8;
      color: #7dd3fc;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 10px;
    }
    .tier-a {
      background: rgba(34, 197, 94, 0.16);
      border: 1px solid #22c55e;
      color: #86efac;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 10px;
    }
    .tier-dec {
      background: rgba(148, 163, 184, 0.12);
      color: var(--muted);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 10px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid var(--border);
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 9px 10px;
      border-bottom: 1px solid rgba(30, 41, 59, 0.55);
    }
    tr:hover td { background: rgba(255,255,255,0.02); }
    .pos { color: var(--green); font-weight: 700; }
    .neg { color: var(--red); font-weight: 700; }
    .sym-btn {
      color: var(--blue);
      font-weight: 700;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    /* TradingView & Tier Matrix Row */
    .tv-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 18px;
      margin-bottom: 20px;
    }
    .tv-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      height: 460px;
      display: flex;
      flex-direction: column;
    }
    #tv-chart-container {
      flex: 1;
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
    .section-hdr {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      margin: 12px 0 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title { margin: 0; }
    /* Phone / narrow screens (QA 2026-11-02: page was 872px wide on a 375px screen) */
    @media (max-width: 900px) {
      .topbar { flex-wrap: wrap; gap: 10px; }
      .controls { flex-wrap: wrap; }
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .dual-grid, .tv-row { grid-template-columns: minmax(0, 1fr); }
      .mini-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      [style*="grid-template-columns"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      table { display: block; overflow-x: auto; white-space: nowrap; }
      body { overflow-x: hidden; }
    }
    @media (max-width: 480px) {
      .kpi-grid { grid-template-columns: minmax(0, 1fr); }
    }
  </style>
</head>
<body>

  <!-- MASTER HEADER -->
  <div class="topbar">
    <div class="brand">
      <span style="font-size: 28px;">⚡</span>
      <div>
        <h1 class="brand-title">CONSTRUCT 2026 • 100% FULL-POWER TRADING212 DUAL-DESK LIVE DEMO (USD)</h1>
        <div class="brand-sub">S-Tier / T-Tier / A-Tier • Desk 1: Volatility Squeeze ($100.00) + Desk 2: Institutional VWAP & Volume ($100.00) • MT5 24/5 Live Tick Boost</div>
      </div>
    </div>
    <div class="controls">
      <div class="status-pill" id="engine-pill">
        <div class="dot" id="engine-dot"></div>
        <span id="engine-status-text">LIVE DEMO PATROL ACTIVE (USD)</span>
      </div>
      <button class="btn btn-primary" onclick="togglePause()" id="pause-btn">⏸ Pause Patrol</button>
      <button class="btn" onclick="resetPortfolios()">↺ Reset Both Desks to $100.00</button>
    </div>
  </div>

  <!-- COMBINED MASTER KPI BAR -->
  <div class="kpi-grid">
    <div class="kpi-card" style="border-left: 3px solid var(--purple);">
      <div class="kpi-label">Combined Trading212 Equity (USD)</div>
      <div class="kpi-val" id="master-equity">$200.00</div>
      <div class="kpi-sub" id="master-pnl">+$0.00 (+0.00%) Combined</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid var(--blue);">
      <div class="kpi-label">T212 Desk 1 (Volatility Squeeze)</div>
      <div class="kpi-val" id="t212-kpi-eq">$100.00</div>
      <div class="kpi-sub" id="t212-kpi-sub">🏛️ TTM Squeeze & ATR Trend • $100 Base</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid var(--orange);">
      <div class="kpi-label">T212 Desk 2 (VWAP & RVOL Macro)</div>
      <div class="kpi-val" id="dex-kpi-eq">$100.00</div>
      <div class="kpi-sub" id="dex-kpi-sub">📊 Institutional VWAP/VWMA • $100 Base</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid var(--green);">
      <div class="kpi-label">S / T / A Tier Win Rate</div>
      <div class="kpi-val" id="master-wr">0W / 0L</div>
      <div class="kpi-sub" id="master-fees">0% Commission • MT5 24/5 Tick Feed</div>
    </div>
    <div class="kpi-card" style="border-left: 3px solid var(--amber);">
      <div class="kpi-label">🐷 $500+ Future Stocks & Bonds Vault</div>
      <div class="kpi-val" id="master-scanned">$0.00 Saved</div>
      <div class="kpi-sub" id="piggy-kpi-sub">Target: $500.00 Auto-Siphon ($10-$20)</div>
    </div>
  </div>

  <!-- DUAL PLATFORM COMMAND DECKS -->
  <div class="dual-grid">

    <!-- LEFT DECK: TRADING212 DESK 1 ($100) -->
    <div class="platform-deck deck-t212">
      <div class="deck-header">
        <div class="deck-title" role="heading" aria-level="2">
          <span>🏛️</span>
          <span>Desk 1: Trading212 Volatility & Squeeze Breakouts</span>
          <span style="font-size:11px; background:rgba(56,189,248,0.15); color:var(--blue); padding:2px 8px; border-radius:8px;">$100.00 Allocation</span>
        </div>
        <div style="font-size:11px; color:var(--green); font-weight:600;" id="t212-health-badge">Health: 100/100</div>
      </div>

      <div class="mini-stats">
        <div class="mini-box">
          <div class="kpi-label">Total Equity</div>
          <div class="value" style="font-size:15px; font-weight:800; margin-top:3px;" id="t212-eq">$100.00</div>
        </div>
        <div class="mini-box">
          <div class="kpi-label">Liquid Cash</div>
          <div class="value" style="font-size:15px; font-weight:700; color:var(--blue); margin-top:3px;" id="t212-cash">$100.00</div>
        </div>
        <div class="mini-box">
          <div class="kpi-label">Realized PnL</div>
          <div class="value" style="font-size:15px; font-weight:700; margin-top:3px;" id="t212-realized">$0.00</div>
        </div>
        <div class="mini-box">
          <div class="kpi-label">Session Mode</div>
          <div class="value" style="font-size:11px; font-weight:700; color:var(--amber); margin-top:5px;" id="t212-session">24/5 Active</div>
        </div>
      </div>

      <div class="section-hdr">
        <span>⚡ Active Desk 1 Positions (Click Symbol for TradingView Chart)</span>
        <span id="t212-open-count" style="color:var(--muted); font-size:11px;">0 Open</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Tier</th>
            <th>Size</th>
            <th>Entry / Live</th>
            <th>Net PnL</th>
            <th>Protocol D Sentinel</th>
          </tr>
        </thead>
        <tbody id="t212-open-body">
          <tr><td colspan="6" style="text-align:center; color:var(--muted); padding:14px;">Scanning TradingView Volatility Squeeze & ATR Breakouts...</td></tr>
        </tbody>
      </table>

      <div class="section-hdr" style="margin-top:16px;">
        <span>🏆 Desk 1 Realized Closed Trades</span>
        <span id="t212-closed-count" style="color:var(--muted); font-size:11px;">0 Settled</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Tier</th>
            <th>Spent</th>
            <th>Net PnL</th>
            <th>Held</th>
            <th>Exit Reason</th>
          </tr>
        </thead>
        <tbody id="t212-closed-body">
          <tr><td colspan="6" style="text-align:center; color:var(--muted); padding:12px;">No closed trades yet — $100.00 ready.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- RIGHT DECK: TRADING212 DESK 2 ($100) -->
    <div class="platform-deck deck-dex">
      <div class="deck-header">
        <div class="deck-title" role="heading" aria-level="2">
          <span>📊</span>
          <span>Desk 2: Trading212 Institutional Volume & VWAP Macro</span>
          <span style="font-size:11px; background:rgba(249,115,22,0.15); color:var(--orange); padding:2px 8px; border-radius:8px;">$100.00 Allocation</span>
        </div>
        <div style="font-size:11px; color:var(--green); font-weight:600;" id="dex-health-badge">Health: 100/100</div>
      </div>

      <div class="mini-stats">
        <div class="mini-box">
          <div class="kpi-label">Total Equity</div>
          <div class="value" style="font-size:15px; font-weight:800; margin-top:3px;" id="dex-eq">$100.00</div>
        </div>
        <div class="mini-box">
          <div class="kpi-label">Liquid Cash</div>
          <div class="value" style="font-size:15px; font-weight:700; color:var(--orange); margin-top:3px;" id="dex-cash">$100.00</div>
        </div>
        <div class="mini-box">
          <div class="kpi-label">Realized PnL</div>
          <div class="value" style="font-size:15px; font-weight:700; margin-top:3px;" id="dex-realized">$0.00</div>
        </div>
        <div class="mini-box">
          <div class="kpi-label">Broker Status</div>
          <div class="value" style="font-size:12px; font-weight:700; color:var(--green); margin-top:5px;">🏛️ Trading212 (USD)</div>
        </div>
      </div>

      <div class="section-hdr">
        <span>⚡ Active Desk 2 Positions (Click Symbol for TradingView Chart)</span>
        <span id="dex-open-count" style="color:var(--muted); font-size:11px;">0 Open</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Tier</th>
            <th>Size</th>
            <th>Entry / Live</th>
            <th>Net PnL</th>
            <th>Protocol D Sentinel</th>
          </tr>
        </thead>
        <tbody id="dex-open-body">
          <tr><td colspan="6" style="text-align:center; color:var(--muted); padding:14px;">Scanning NASDAQ, NYSE, AMEX & LSE for Institutional VWAP/RVOL Inflows...</td></tr>
        </tbody>
      </table>

      <div class="section-hdr" style="margin-top:16px;">
        <span>🏆 Desk 2 Realized Closed Trades</span>
        <span id="dex-closed-count" style="color:var(--muted); font-size:11px;">0 Settled</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>Tier</th>
            <th>Spent</th>
            <th>Net PnL</th>
            <th>Held</th>
            <th>Exit Reason</th>
          </tr>
        </thead>
        <tbody id="dex-closed-body">
          <tr><td colspan="6" style="text-align:center; color:var(--muted); padding:12px;">No closed trades yet — $100.00 ready.</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- INTERACTIVE GOOGLE FINANCE LIVE DATA & STRATEGY AUTO-LINE CHART + S/T/A TIER MATRIX -->
  <div class="tv-row">
    <div class="tv-card" style="display:flex; flex-direction:column; justify-content:space-between;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px;">
        <div style="font-weight:800; font-size:14px; display:flex; align-items:center; gap:8px;">
          <span>🌐</span>
          <span>Google Finance Live Data & Auto-Line Strategy Terminal</span>
          <span id="current-tv-symbol" style="color:var(--blue); background:rgba(56,189,248,0.12); padding:2px 8px; border-radius:6px;">NASDAQ:PERI</span>
          <span id="gf-heading-badge" style="font-size:11px; padding:2px 8px; border-radius:6px; font-weight:800;">Loading Live Chart...</span>
        </div>
        <div style="display:flex; gap:5px; align-items:center; flex-wrap:wrap;">
          <a id="gf-direct-link" href="https://www.google.com/finance/quote/AVR:NASDAQ" target="_blank" class="btn btn-primary" style="padding:4px 10px; font-size:11px; text-decoration:none;">🌐 Open Google Finance ↗</a>
          <button class="btn" style="padding:4px 8px; font-size:11px; border-color:var(--green); color:var(--green); font-weight:700;" onclick="loadTvSymbol('NASDAQ:AVR')">★ AVR ($6.77)</button>
          <button class="btn" style="padding:4px 8px; font-size:11px;" onclick="loadTvSymbol('NASDAQ:PERI')">PERI</button>
          <button class="btn" style="padding:4px 8px; font-size:11px;" onclick="loadTvSymbol('NASDAQ:TSLL')">TSLL</button>
          <button class="btn" style="padding:4px 8px; font-size:11px;" onclick="loadTvSymbol('NYSE:NKE')">NKE</button>
          <button class="btn" style="padding:4px 8px; font-size:11px;" onclick="loadTvSymbol('NASDAQ:RKLX')">RKLX</button>
          <button class="btn" style="padding:4px 8px; font-size:11px;" onclick="loadTvSymbol('NASDAQ:CRWD')">CRWD</button>
          <button class="btn" style="padding:4px 8px; font-size:11px;" onclick="loadTvSymbol('NASDAQ:NVDA')">NVDA</button>
        </div>
      </div>

      <!-- Google Finance Live Analytics & Auto-Line Telemetry Strip -->
      <div id="gf-analytics-strip" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:6px; margin-bottom:8px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:8px 10px; font-size:11px;">
        <div><span style="color:var(--muted);">Google Live Price:</span><br><b id="gf-px" style="font-size:14px;">$--</b></div>
        <div><span style="color:var(--muted);">Pre-Market / Today:</span><br><b id="gf-vel">--</b></div>
        <div><span style="color:var(--muted);">Market Cap:</span><br><b id="gf-mktcap" style="color:var(--text);">--</b></div>
        <div><span style="color:var(--blue);">Upper Resistance:</span><br><b id="gf-upper-line" style="color:var(--blue);">$-- ➔ $--</b></div>
        <div><span style="color:var(--amber);">Lower Support:</span><br><b id="gf-lower-line" style="color:var(--amber);">$-- ➔ $--</b></div>
        <div><span style="color:var(--purple);">Live 1m VWAP / EMA:</span><br><b id="gf-vwap">$-- / $--</b></div>
        <div><span style="color:var(--green);">15m Heading Target:</span><br><b id="gf-proj">$-- (--%)</b></div>
      </div>

      <!-- High-Speed SVG Google Finance + Strategy Auto-Line Chart Canvas -->
      <div id="tv-chart-container" style="position:relative; background:#070b14; border:1px solid #1e293b; border-radius:10px; overflow:hidden; height:365px; display:flex; align-items:center; justify-content:center;">
        <div style="color:var(--muted);">Loading Google Finance Live Data & Auto-Drawn Strategy Lines...</div>
      </div>
    </div>

    <div class="tv-card" style="overflow-y:auto;">
      <div style="font-weight:800; font-size:14px; margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:8px;">
        🧬 S-Tier / T-Tier / A-Tier & TradingView Volatility/Volume Learner
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div class="mini-box" style="border-left:3px solid var(--purple); padding:8px 10px;">
          <div style="display:flex; justify-content:space-between;">
            <span class="tier-s">S-TIER • SOVEREIGN CONFLUENCE</span>
            <span id="weight-s" style="font-size:11px; color:var(--muted);">Weight: 1.00x</span>
          </div>
          <div style="font-size:11px; color:var(--muted); margin-top:4px;">
            4/4 Hydra Confluence + TradingView Volatility Squeeze & Institutional VWAP/VWMA Accumulation. Allocates 32% ($32).
          </div>
          <div style="font-size:11px; font-weight:700; margin-top:4px;" id="stats-s">0W / 0L • Net: $0.00</div>
        </div>

        <div class="mini-box" style="border-left:3px solid var(--blue); padding:8px 10px;">
          <div style="display:flex; justify-content:space-between;">
            <span class="tier-t">T-TIER • TACTICAL VOL/VOL SCALPER</span>
            <span id="weight-t" style="font-size:11px; color:var(--muted);">Weight: 1.00x</span>
          </div>
          <div style="font-size:11px; color:var(--muted); margin-top:4px;">
            ATR/Parabolic SAR Uptrend + RVOL & Money Flow Index (MFI) Thrust. Allocates 24% ($24) with dynamic Volatility.D ladders.
          </div>
          <div style="font-size:11px; font-weight:700; margin-top:4px;" id="stats-t">0W / 0L • Net: $0.00</div>
        </div>

        <div class="mini-box" style="border-left:3px solid var(--green); padding:8px 10px;">
          <div style="display:flex; justify-content:space-between;">
            <span class="tier-a">A-TIER • ALGORITHMIC SWEEP & %B</span>
            <span id="weight-a" style="font-size:11px; color:var(--muted);">Weight: 1.00x</span>
          </div>
          <div style="font-size:11px; color:var(--muted); margin-top:4px;">
            Stop-run liquidity sweep & Bollinger/Keltner volatility compression rebound. Allocates 18% ($18).
          </div>
          <div style="font-size:11px; font-weight:700; margin-top:4px;" id="stats-a">0W / 0L • Net: $0.00</div>
        </div>

        <div class="mini-box" style="border-left:3px solid var(--amber); padding:8px 10px;">
          <div style="font-size:11px; font-weight:800; color:var(--amber); margin-bottom:5px;">
            🧠 IN-HOUSE STRATEGY BUILDER & LEARNER WEIGHTS (100% STANDALONE + TV CONNECTED)
          </div>
          <div id="tv-feature-weights-box" style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:11px; color:var(--muted);">
            <div>• TTM Vol Squeeze: <b style="color:var(--text);" id="fw-volSqueeze">1.00x</b></div>
            <div>• ATR / P.SAR Trend: <b style="color:var(--text);" id="fw-atrTrend">1.00x</b></div>
            <div>• VWAP + VWMA Vol: <b style="color:var(--text);" id="fw-vwapVolume">1.00x</b></div>
            <div>• RVOL + MFI Thrust: <b style="color:var(--text);" id="fw-rvolMfi">1.00x</b></div>
            <div>• Channel %B Break: <b style="color:var(--text);" id="fw-channelBreakout">1.00x</b></div>
            <div>• Custom Synth Gen: <b style="color:var(--green);" id="fw-customGen">v1 Active</b></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- IN-HOUSE STRATEGY BUILDER, STRATEGY FINDER, VOLATILITY & VOLUME ENGINE -->
  <div class="platform-deck" style="margin-bottom:20px; border-top:3px solid var(--purple);">
    <div class="deck-header">
      <div class="deck-title" role="heading" aria-level="2">
        <span>🛠️</span>
        <span>In-House Strategy Builder, Strategy Finder & Volatility/Volume Engine (No TradingView App Window Required)</span>
      </div>
      <div style="font-size:11px; color:var(--green); font-weight:700;" id="custom-strat-banner">
        Auto-Synthesized Strategy: Learner Alpha v1 (Active)
      </div>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 1fr 1.3fr; gap:14px;">
      <div class="mini-box">
        <div class="kpi-label" style="color:var(--blue); margin-bottom:6px;">⚡ 6 In-House Volatility Options</div>
        <div id="vol-options-list" style="font-size:11px; color:var(--muted); display:flex; flex-direction:column; gap:5px;">
          <div>1. <b>VOL_TTM_SQUEEZE:</b> BB(20,2) inside Keltner(1.5*ATR)</div>
          <div>2. <b>VOL_EXPANSION_RATIO:</b> Volatility.D / Volatility.W &ge; 0.90x</div>
          <div>3. <b>VOL_ATR_PSAR_STOP:</b> Close &gt; P.SAR (Daily &amp; 15m) + ATR Stop</div>
          <div>4. <b>VOL_BB_PERCENT_B:</b> Bollinger %B &ge; 0.65 Upper Thrust</div>
          <div>5. <b>VOL_DONCHIAN_CHANNEL:</b> Top 38% of Session High/Low Range</div>
          <div>6. <b>VOL_BANDWIDTH_REBOUND:</b> Compressed BB + 15m RSI Bounce</div>
        </div>
      </div>
      <div class="mini-box">
        <div class="kpi-label" style="color:var(--orange); margin-bottom:6px;">📊 6 In-House Volume Options</div>
        <div id="volm-options-list" style="font-size:11px; color:var(--muted); display:flex; flex-direction:column; gap:5px;">
          <div>1. <b>VOLM_VWAP_ANCHOR:</b> Close &ge; Session VWAP &amp; 15m VWAP</div>
          <div>2. <b>VOLM_VWMA_ACCUMULATION:</b> VWMA(20) &ge; SMA(20) Up-Bar Vol</div>
          <div>3. <b>VOLM_RVOL_SURGE:</b> 10d Relative Volume (RVOL) &ge; 1.25x</div>
          <div>4. <b>VOLM_MFI_SMART_FLOW:</b> Money Flow Index (MFI 14) 48–85</div>
          <div>5. <b>VOLM_MFI_INTRADAY_ACCEL:</b> 15m MFI &ge; 52 Rising Acceleration</div>
          <div>6. <b>VOLM_LIQUIDITY_DEPTH:</b> Institutional Dollar Vol &ge; $15M</div>
        </div>
      </div>
      <div class="mini-box">
        <div class="kpi-label" style="color:var(--purple); margin-bottom:6px;">🔎 Autonomous Strategy Finder Templates (5 Built-In + 1 Self-Evolving)</div>
        <div id="strat-templates-list" style="font-size:11px; color:var(--muted); display:flex; flex-direction:column; gap:5px;">
          <div>• <b>STRAT_01:</b> TTM Squeeze + Institutional VWAP Ignition (TP 1.15x)</div>
          <div>• <b>STRAT_02:</b> Institutional VWMA + RVOL Accumulation Trend (TP 1.05x)</div>
          <div>• <b>STRAT_03:</b> ATR Volatility Expansion + P.SAR Runner (TP 1.25x)</div>
          <div>• <b>STRAT_04:</b> Catalyst &amp; Earnings RVOL + MFI Explosion (TP 1.30x)</div>
          <div>• <b>STRAT_05:</b> Volatility Compression &amp; VWAP Reclaim Rebound (TP 0.90x)</div>
          <div style="color:var(--green);">• <b>STRAT_CUSTOM:</b> Learner Auto-Synthesized Top-Block Strategy (Self-Evolving)</div>
        </div>
      </div>
    </div>
  </div>

  <!-- AUTONOMOUS 24/7 REAL-TIME LEARNER & GLOBAL MARKET RELAY AGENT -->
  <div class="platform-deck" style="margin-bottom:20px; border-top:3px solid var(--blue);">
    <div class="deck-header">
      <div class="deck-title" role="heading" aria-level="2">
        <span>🤖</span>
        <span>Autonomous 24/7 Real-Time Learner & Global Market Relay Agent</span>
        <span style="font-size:11px; background:rgba(34,197,94,0.18); color:var(--green); padding:2px 8px; border-radius:8px;" id="agent-relay-badge">24/7/365 ZERO-DOWNTIME ACTIVE</span>
      </div>
      <div style="font-size:11px; color:var(--blue); font-weight:700;" id="agent-cycle-count">
        Optimizing Cycle #0
      </div>
    </div>
    <div class="mini-stats" style="grid-template-columns: repeat(4, 1fr); margin-bottom:12px;">
      <div class="mini-box">
        <div class="kpi-label">Active Market Session</div>
        <div class="value" style="font-size:14px; font-weight:800; color:var(--blue); margin-top:3px;" id="relay-session-name">--</div>
        <div style="font-size:10px; color:var(--muted); margin-top:2px;" id="relay-session-region">Global Relay Window</div>
      </div>
      <div class="mini-box">
        <div class="kpi-label">Real-Life Fill Health</div>
        <div class="value" style="font-size:14px; font-weight:800; color:var(--green); margin-top:3px;" id="relay-fill-health">OPTIMAL_TIGHT_FILLS</div>
        <div style="font-size:10px; color:var(--muted); margin-top:2px;" id="relay-slippage-sub">Avg Slippage: 0.04%</div>
      </div>
      <div class="mini-box">
        <div class="kpi-label">Active Alpha Strategy</div>
        <div class="value" style="font-size:13px; font-weight:700; color:var(--purple); margin-top:3px;" id="relay-active-strat">--</div>
        <div style="font-size:10px; color:var(--muted); margin-top:2px;" id="relay-strat-sub">Self-Evolving In-House</div>
      </div>
      <div class="mini-box">
        <div class="kpi-label">Dynamic Risk & Trailing</div>
        <div class="value" style="font-size:14px; font-weight:800; color:var(--amber); margin-top:3px;" id="relay-risk-state">Buffer: 30m • Trail 1.0x</div>
        <div style="font-size:10px; color:var(--muted); margin-top:2px;">Regime Adaptive</div>
      </div>
    </div>
    <div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px;">
      <div style="font-size:11px; font-weight:800; color:var(--muted); margin-bottom:6px; display:flex; justify-content:space-between;">
        <span>🧠 AGENT REAL-TIME AUTONOMOUS OPTIMIZATION JOURNAL</span>
        <span style="color:var(--blue);" id="agent-last-eval">Updated Just Now</span>
      </div>
      <div id="agent-notes-stream" style="font-size:11px; color:var(--text); display:flex; flex-direction:column; gap:4px; max-height:100px; overflow-y:auto;">
        <div>Loading Autonomous Learner Agent telemetry...</div>
      </div>
    </div>
  </div>

  <!-- FUTURE STOCKS & SOVEREIGN BONDS PIGGY BANK VAULT ($500+ AUTO-SIPHON • 2026-2034 ARCTIC SHIPPING & BONDS) -->
  <div class="platform-deck" style="margin-bottom:20px; border-top:3px solid var(--amber);">
    <div class="deck-header">
      <div class="deck-title" role="heading" aria-level="2">
        <span>🐷</span>
        <span>Future Growth Stocks & Sovereign Bonds "Piggy Bank" Vault (2026–2034 Arctic Shipping & Bonds • USD)</span>
        <span style="font-size:11px; background:rgba(245,158,11,0.16); color:var(--amber); padding:2px 8px; border-radius:8px;" id="piggy-unlock-badge">Auto-Unlocks at $500.00 Equity ($10–$20 Siphon)</span>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="btn btn-primary" style="padding:5px 11px; font-size:11px;" onclick="depositPiggyBank(10)">🐷 Save +$10.00 Tranche</button>
        <button class="btn" style="padding:5px 11px; font-size:11px; border-color:var(--amber); color:var(--amber);" onclick="depositPiggyBank(20)">🐷 Save +$20.00 Tranche</button>
      </div>
    </div>

    <div class="mini-stats" style="grid-template-columns: repeat(5, 1fr);">
      <div class="mini-box">
        <div class="kpi-label">Piggy Bank Live Value</div>
        <div class="value" style="font-size:16px; font-weight:800; color:var(--amber); margin-top:3px;" id="piggy-val">$0.00</div>
      </div>
      <div class="mini-box">
        <div class="kpi-label">Total Principal Saved</div>
        <div class="value" style="font-size:15px; font-weight:700; margin-top:3px;" id="piggy-invested">$0.00 (0 Tranches)</div>
      </div>
      <div class="mini-box">
        <div class="kpi-label">Vault Unrealized PnL</div>
        <div class="value" style="font-size:15px; font-weight:700; margin-top:3px;" id="piggy-pnl">+$0.00 (0.00%)</div>
      </div>
      <div class="mini-box">
        <div class="kpi-label">Est. Bond & Div Yield</div>
        <div class="value" style="font-size:15px; font-weight:700; color:var(--green); margin-top:3px;" id="piggy-yield">+$0.00 / yr (~4.4%)</div>
      </div>
      <div class="mini-box">
        <div class="kpi-label">$500 Auto-Siphon Progress</div>
        <div style="font-size:12px; font-weight:800; color:var(--blue); margin-top:3px;" id="piggy-progress-txt">40.0% ($300.00 to $500)</div>
        <div style="width:100%; height:6px; background:#1e293b; border-radius:4px; margin-top:5px; overflow:hidden;">
          <div id="piggy-progress-bar" style="width:40%; height:100%; background:linear-gradient(90deg, #38bdf8, #f59e0b);"></div>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Asset & Sleeve (55% Arctic 2026–2034 / 45% Bonds)</th>
          <th>Strategic Horizon & Yield</th>
          <th>Weight</th>
          <th>Live Price</th>
          <th>Accumulated Shares & Value</th>
          <th>2026–2034 Strategic Thesis</th>
        </tr>
      </thead>
      <tbody id="piggy-holdings-body">
        <tr><td colspan="7" style="text-align:center; color:var(--muted); padding:12px;">Loading 2026–2034 Arctic Shipping (MATX, AMKBY, ZIM, FCT, HII, FLNG) & Sovereign Bonds (SGOV, TLT, BND, SCHD) Vault...</td></tr>
      </tbody>
    </table>
  </div>

  <!-- UNIFIED DYNAMIC DISCOVERY & DECISION AUDIT STREAM -->
  <div class="platform-deck">
    <div class="deck-header">
      <div class="deck-title" role="heading" aria-level="2">
        <span>📡</span>
        <span>Live Dynamic Discovery & Multi-Factor Decision Audit Journal (Zero Hardcoded Assets)</span>
      </div>
      <div style="font-size:11px; color:var(--muted);" id="audit-total-count">Streaming live evaluations...</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Platform</th>
          <th>Symbol (Click for Chart)</th>
          <th>Live Price</th>
          <th>1h / 24h Vel</th>
          <th>RSI / TV Rating</th>
          <th>Tier & Score</th>
          <th>Cost-Aware & Microstructure Audit Rationale</th>
        </tr>
      </thead>
      <tbody id="master-audit-body">
        <tr><td colspan="8" style="text-align:center; color:var(--muted); padding:16px;">Initializing dynamic TradingView, Trading212, DexScreener & GeckoTerminal scanners...</td></tr>
      </tbody>
    </table>
  </div>

  <script>
    let currentTvSym = 'NASDAQ:PERI';

    async function loadTvSymbol(tvSym) {
      if (!tvSym) return;
      currentTvSym = tvSym;
      document.getElementById('current-tv-symbol').innerText = tvSym;
      try {
        const res = await fetch('/api/chart?symbol=' + encodeURIComponent(tvSym));
        if (!res.ok) return;
        const data = await res.json();
        renderGoogleStrategyChart(data);
      } catch (_) {}
    }

    function renderGoogleStrategyChart(data) {
      const container = document.getElementById('tv-chart-container');
      if (!container) return;

      const lq = data.liveQuote || {};
      const gq = data.googleQuote || {};
      const ca = lq.chartAnalytics || {};
      const pos = data.openPosition || null;
      const klines = Array.isArray(lq.klines) && lq.klines.length > 0 ? lq.klines : [];

      const livePx = Number(gq.price || lq.price || pos?.currentPrice || 0);
      const ch15m = Number(lq.change15mPct || 0);
      const ch24h = Number(gq.changePct ?? lq.changePct ?? 0);
      const dig = livePx < 1 ? 4 : 2;

      const linkEl = document.getElementById('gf-direct-link');
      if (linkEl && data.googleUrl) linkEl.href = data.googleUrl;

      const badge = document.getElementById('gf-heading-badge');
      const isBleeding = ca.headingState === 'BLEEDING_BEARISH';
      const isUp = ca.headingState === 'GOING_UP_BULLISH';
      if (badge) {
        badge.innerText = ca.headingLabel || (isBleeding ? 'BLEEDING DOWN ▼' : 'GOING UP ▲');
        badge.style.background = isBleeding ? 'rgba(239,68,68,0.22)' : (isUp ? 'rgba(34,197,94,0.22)' : 'rgba(245,158,11,0.20)');
        badge.style.border = '1px solid ' + (isBleeding ? '#ef4444' : (isUp ? '#22c55e' : '#f59e0b'));
        badge.style.color = isBleeding ? '#fca5a5' : (isUp ? '#86efac' : '#fde68a');
      }

      document.getElementById('gf-px').innerHTML = '$' + livePx.toFixed(dig) + (gq.price ? ' <span style="font-size:10px; color:#22c55e;">(Google Verified)</span>' : '');
      const velEl = document.getElementById('gf-vel');
      velEl.className = (ch15m >= 0 && ch24h >= 0) ? 'pos' : (ch15m < 0 ? 'neg' : '');
      velEl.innerText = (ch15m >= 0 ? '+' : '') + ch15m.toFixed(2) + '% / ' + (ch24h >= 0 ? '+' : '') + ch24h.toFixed(2) + '%';

      const mktCapEl = document.getElementById('gf-mktcap');
      if (mktCapEl) {
        mktCapEl.innerText = gq.marketCap ? ('$' + (gq.marketCap >= 1e9 ? (gq.marketCap / 1e9).toFixed(2) + 'B' : (gq.marketCap / 1e6).toFixed(1) + 'M')) : '--';
      }

      document.getElementById('gf-upper-line').innerText = '$' + Number(ca.upperLineStart || livePx).toFixed(dig) + ' ➔ $' + Number(ca.upperLineEnd || livePx).toFixed(dig);
      document.getElementById('gf-lower-line').innerText = '$' + Number(ca.lowerLineStart || livePx).toFixed(dig) + ' ➔ $' + Number(ca.lowerLineEnd || livePx).toFixed(dig);
      document.getElementById('gf-vwap').innerText = '$' + Number(ca.liveVwap || livePx).toFixed(dig) + ' / $' + Number(ca.liveEma20 || livePx).toFixed(dig);

      const projPx = Number(ca.projectedPrice15m || livePx);
      const projPct = Number(ca.projectedChangePct || 0);
      const projEl = document.getElementById('gf-proj');
      projEl.style.color = projPct >= 0 ? '#22c55e' : '#ef4444';
      projEl.innerText = '$' + projPx.toFixed(dig) + ' (' + (projPct >= 0 ? '+' : '') + projPct.toFixed(2) + '%)';

      const dataPoints = (Array.isArray(gq.chartPoints) && gq.chartPoints.length >= 5)
        ? gq.chartPoints
        : (klines.map(k => ({ price: k.c, volume: k.v, change: 0, changePct: 0 })));

      if (dataPoints.length < 2) {
        container.innerHTML = '<div style="color:var(--muted);">Waiting for Google Finance live data on ' + data.symbol + '... (Current Price: $' + livePx.toFixed(dig) + ')</div>';
        return;
      }

      const W = 920;
      const H = 355;
      const padL = 18;
      const padR = 135;
      const padT = 24;
      const padB = 34; // room for volume bars
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;

      let minP = Infinity;
      let maxP = -Infinity;
      let maxV = 1;
      for (const p of dataPoints) {
        if (p.price < minP) minP = p.price;
        if (p.price > maxP) maxP = p.price;
        if (p.volume > maxV) maxV = p.volume;
      }

      const prevClose = Number(gq.prevClose || gq.regularPrice || livePx);
      const extraPrices = [
        prevClose,
        ca.upperLineStart, ca.upperLineEnd,
        ca.lowerLineStart, ca.lowerLineEnd,
        ca.liveVwap, ca.liveEma20, projPx
      ];
      if (pos) {
        extraPrices.push(pos.entryPrice, pos.targetPrice, pos.stopPrice);
      }
      for (const p of extraPrices) {
        if (Number.isFinite(p) && p > 0) {
          if (p < minP) minP = p;
          if (p > maxP) maxP = p;
        }
      }
      const rangeP = Math.max(maxP - minP, livePx * 0.004, 0.02);
      minP -= rangeP * 0.08;
      maxP += rangeP * 0.08;
      const fullRange = maxP - minP;

      const xForIdx = (i) => padL + (i / Math.max(1, dataPoints.length - 1)) * (plotW * 0.84);
      const yForPrice = (p) => padT + ((maxP - p) / fullRange) * plotH;

      // Grid lines
      let gridSvg = '';
      for (let g = 0; g <= 4; g++) {
        const gp = maxP - (g / 4) * fullRange;
        const gy = yForPrice(gp).toFixed(1);
        gridSvg += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - 10) + '" y2="' + gy + '" stroke="#162033" stroke-width="1" />';
        gridSvg += '<text x="' + (W - 8) + '" y="' + (Number(gy) - 4) + '" fill="#64748b" font-size="10" text-anchor="end">$' + gp.toFixed(dig) + '</text>';
      }

      // Prev. Close Reference Guideline (Exact Google Finance Styling)
      const prevCloseY = yForPrice(prevClose).toFixed(1);
      const prevCloseSvg =
        '<line x1="' + padL + '" y1="' + prevCloseY + '" x2="' + (W - 10) + '" y2="' + prevCloseY + '" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,3" />' +
        '<circle cx="' + (padL + plotW * 0.84).toFixed(1) + '" cy="' + prevCloseY + '" r="3.5" fill="#64748b" />' +
        '<text x="' + (padL + plotW * 0.84 - 8).toFixed(1) + '" y="' + (Number(prevCloseY) - 5) + '" fill="#94a3b8" font-size="10" text-anchor="end">Prev. close $' + prevClose.toFixed(dig) + '</text>';

      // Google Finance Area + Price Curve + Volume Bars
      const mainColor = isBleeding ? '#ef4444' : (isUp ? '#22c55e' : '#38bdf8');
      const fillGradId = isBleeding ? 'gfGradRed' : (isUp ? 'gfGradGreen' : 'gfGradBlue');
      let polyPts = '';
      let volumeSvg = '';
      const vBarW = Math.max(1.8, Math.min(6, (plotW * 0.84) / dataPoints.length * 0.65));

      for (let i = 0; i < dataPoints.length; i++) {
        const pt = dataPoints[i];
        const cx = xForIdx(i);
        const cy = yForPrice(pt.price);
        polyPts += cx.toFixed(1) + ',' + cy.toFixed(1) + ' ';

        // Volume histogram along bottom
        if (pt.volume > 0) {
          const vH = Math.max(2, Math.min(26, (pt.volume / maxV) * 26));
          const vy = (H - 6 - vH).toFixed(1);
          const vCol = (pt.change >= 0) ? '#22c55e' : '#ef4444';
          volumeSvg += '<rect x="' + (cx - vBarW / 2).toFixed(1) + '" y="' + vy + '" width="' + vBarW.toFixed(1) + '" height="' + vH.toFixed(1) + '" fill="' + vCol + '" opacity="0.45" />';
        }
      }

      const firstX = xForIdx(0).toFixed(1);
      const lastX = xForIdx(dataPoints.length - 1).toFixed(1);
      const lastY = yForPrice(livePx).toFixed(1);
      const areaPts = firstX + ',' + (H - padB) + ' ' + polyPts + lastX + ',' + (H - padB);

      // Trendlines across last 20 bars
      const startIdx20 = Math.max(0, klines.length - 20);
      const tlX1 = xForIdx(startIdx20).toFixed(1);
      const tlX2 = lastX;
      const upY1 = yForPrice(ca.upperLineStart || livePx).toFixed(1);
      const upY2 = yForPrice(ca.upperLineEnd || livePx).toFixed(1);
      const loY1 = yForPrice(ca.lowerLineStart || livePx).toFixed(1);
      const loY2 = yForPrice(ca.lowerLineEnd || livePx).toFixed(1);
      const vwapY = yForPrice(ca.liveVwap || livePx).toFixed(1);
      const emaY = yForPrice(ca.liveEma20 || livePx).toFixed(1);

      // Future 15-Minute Heading Vector
      const projX = (padL + plotW).toFixed(1);
      const projY = yForPrice(projPx).toFixed(1);
      const projCol = projPct >= 0 ? '#22c55e' : '#ef4444';

      // Active Position Horizontal Lines (Entry / Target TP / Stop Loss)
      let posLinesSvg = '';
      if (pos) {
        const ey = yForPrice(pos.entryPrice).toFixed(1);
        const ty = yForPrice(pos.targetPrice).toFixed(1);
        const sy = yForPrice(pos.stopPrice).toFixed(1);
        posLinesSvg +=
          '<line x1="' + padL + '" y1="' + ty + '" x2="' + projX + '" y2="' + ty + '" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="6,4" />' +
          '<text x="' + (padL + 6) + '" y="' + (Number(ty) - 5) + '" fill="#22c55e" font-size="10" font-weight="800">🎯 TARGET TP $' + pos.targetPrice.toFixed(dig) + '</text>' +
          '<line x1="' + padL + '" y1="' + ey + '" x2="' + projX + '" y2="' + ey + '" stroke="#e2e8f0" stroke-width="1.4" stroke-dasharray="3,3" />' +
          '<text x="' + (padL + 6) + '" y="' + (Number(ey) - 5) + '" fill="#e2e8f0" font-size="10" font-weight="800">⚡ POSITION ENTRY $' + pos.entryPrice.toFixed(dig) + '</text>' +
          '<line x1="' + padL + '" y1="' + sy + '" x2="' + projX + '" y2="' + sy + '" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="6,4" />' +
          '<text x="' + (padL + 6) + '" y="' + (Number(sy) + 12) + '" fill="#ef4444" font-size="10" font-weight="800">🛡️ HARD STOP $' + pos.stopPrice.toFixed(dig) + '</text>';
      }

      container.innerHTML =
        '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%" preserveAspectRatio="none">' +
          '<defs>' +
            '<linearGradient id="gfGradGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#22c55e" stop-opacity="0.24"/><stop offset="100%" stop-color="#22c55e" stop-opacity="0.0"/></linearGradient>' +
            '<linearGradient id="gfGradRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ef4444" stop-opacity="0.24"/><stop offset="100%" stop-color="#ef4444" stop-opacity="0.0"/></linearGradient>' +
            '<linearGradient id="gfGradBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8" stop-opacity="0.22"/><stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/></linearGradient>' +
          '</defs>' +
          gridSvg +
          prevCloseSvg +
          '<polygon points="' + areaPts + '" fill="url(#' + fillGradId + ')" />' +
          volumeSvg +
          candlesSvg +
          '<polyline fill="none" stroke="' + mainColor + '" stroke-width="2.2" points="' + polyPts + '" />' +
          // Live VWAP Line
          '<line x1="' + padL + '" y1="' + vwapY + '" x2="' + lastX + '" y2="' + vwapY + '" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="4,3" />' +
          '<text x="' + (Number(lastX) + 6) + '" y="' + (Number(vwapY) + 3) + '" fill="#c084fc" font-size="10" font-weight="700">VWAP $' + Number(ca.liveVwap || livePx).toFixed(dig) + '</text>' +
          // Auto-Drawn Upper Resistance Trendline
          '<line x1="' + tlX1 + '" y1="' + upY1 + '" x2="' + tlX2 + '" y2="' + upY2 + '" stroke="#38bdf8" stroke-width="2" stroke-dasharray="5,3" />' +
          '<text x="' + tlX1 + '" y="' + (Number(upY1) - 6) + '" fill="#38bdf8" font-size="10" font-weight="800">─── UPPER RESISTANCE LINE ($' + Number(ca.upperLineEnd || livePx).toFixed(dig) + ')</text>' +
          // Auto-Drawn Lower Support Trendline
          '<line x1="' + tlX1 + '" y1="' + loY1 + '" x2="' + tlX2 + '" y2="' + loY2 + '" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5,3" />' +
          '<text x="' + tlX1 + '" y="' + (Number(loY1) + 13) + '" fill="#fbbf24" font-size="10" font-weight="800">─── LOWER SUPPORT LINE ($' + Number(ca.lowerLineEnd || livePx).toFixed(dig) + ')</text>' +
          posLinesSvg +
          // Future 15m Heading Vector Arrow
          '<line x1="' + lastX + '" y1="' + lastY + '" x2="' + projX + '" y2="' + projY + '" stroke="' + projCol + '" stroke-width="2.5" stroke-dasharray="4,4" />' +
          '<circle cx="' + lastX + '" cy="' + lastY + '" r="4.5" fill="' + mainColor + '" stroke="#fff" stroke-width="1.5" />' +
          '<circle cx="' + projX + '" cy="' + projY + '" r="4.5" fill="' + projCol + '" />' +
          '<text x="' + (Number(projX) + 6) + '" y="' + (Number(projY) - 4) + '" fill="' + projCol + '" font-size="11" font-weight="800">' + (projPct >= 0 ? '▲ HEADING' : '▼ HEADING') + '</text>' +
          '<text x="' + (Number(projX) + 6) + '" y="' + (Number(projY) + 10) + '" fill="' + projCol + '" font-size="11" font-weight="800">$' + projPx.toFixed(dig) + '</text>' +
        '</svg>';
    }

    function renderTierBadge(tier) {
      if (tier === 'S-TIER') return '<span class="tier-s">S-TIER</span>';
      if (tier === 'T-TIER') return '<span class="tier-t">T-TIER</span>';
      if (tier === 'A-TIER') return '<span class="tier-a">A-TIER</span>';
      return '<span class="tier-dec">' + (tier || 'DECLINED') + '</span>';
    }

    function fmtMoney(n) {
      const val = Number(n || 0);
      const sign = val < 0 ? '-' : '';
      return sign + '$' + Math.abs(val).toFixed(2);
    }

    function fmtSignedMoney(n) {
      const val = Number(n || 0);
      const sign = val >= 0 ? '+' : '-';
      return sign + '$' + Math.abs(val).toFixed(2);
    }

    async function togglePause() {
      await fetch('/api/toggle-pause', { method: 'POST' });
      refreshStatus();
    }

    async function openInNativeTvDesktop() {
      await fetch('/api/open-tv-desktop?symbol=' + encodeURIComponent(currentTvSym), { method: 'POST' });
    }

    async function resetPortfolios() {
      if (!confirm('Reset both Trading212 Live Demo Desks back to $100.00 each ($200.00 Combined)?')) return;
      await fetch('/api/reset-100', { method: 'POST' });
      refreshStatus();
    }

    async function depositPiggyBank(amount) {
      await fetch('/api/piggybank-deposit?amount=' + encodeURIComponent(amount), { method: 'POST' });
      refreshStatus();
    }

    function renderOpenPositions(list, tbodyId, countId) {
      document.getElementById(countId).innerText = list.length + ' Active';
      const el = document.getElementById(tbodyId);
      if (!list.length) {
        el.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:14px;">100% Liquid — Hunting S/T/A-Tier Confluences...</td></tr>';
        return;
      }
      let html = '';
      for (const p of list) {
        const isPos = (p.unrealizedPnlUsd || 0) >= 0;
        const pxDigits = p.currentPrice < 0.01 ? 6 : (p.currentPrice < 1 ? 4 : 2);
        const ySym = encodeURIComponent(p.yahooSymbol || p.symbol);
        const gExch = (p.exchange === 'LSE' ? 'LON' : (p.exchange || 'NASDAQ'));
        const gPair = encodeURIComponent(p.symbol + ':' + gExch);
        html += '<tr>' +
          '<td><span class="sym-btn" onclick="loadTvSymbol(\\'' + (p.tvSymbol || p.symbol) + '\\')">' + p.symbol + '</span> ' +
          '<a href="https://finance.yahoo.com/quote/' + ySym + '/?guccounter=1" target="_blank" style="font-size:10px; color:var(--blue); text-decoration:none; margin-left:4px;" title="Verify on Yahoo Finance">[Yahoo ↗]</a>' +
          '<a href="https://www.google.com/finance/quote/' + gPair + '" target="_blank" style="font-size:10px; color:var(--green); text-decoration:none; margin-left:3px;" title="Verify on Google Finance">[Google ↗]</a></td>' +
          '<td>' + renderTierBadge(p.tier) + '</td>' +
          '<td>$' + Number(p.notionalUsd).toFixed(2) + '</td>' +
          '<td>$' + Number(p.entryPrice).toFixed(pxDigits) + ' ➔ <b>$' + Number(p.currentPrice).toFixed(pxDigits) + '</b></td>' +
          '<td class="' + (isPos ? 'pos' : 'neg') + '">' + fmtSignedMoney(p.unrealizedPnlUsd) + ' (' + (p.netRoiPct >= 0 ? '+' : '') + Number(p.netRoiPct).toFixed(2) + '%)</td>' +
          '<td style="font-size:11px; color:var(--muted);">' + (p.statusHeader || 'Monitoring') + '</td>' +
        '</tr>';
      }
      el.innerHTML = html;
    }

    function renderClosedTrades(list, tbodyId, countId) {
      document.getElementById(countId).innerText = list.length + ' Settled';
      const el = document.getElementById(tbodyId);
      if (!list.length) {
        el.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:12px;">No closed trades yet.</td></tr>';
        return;
      }
      let html = '';
      for (const c of list.slice(0, 8)) {
        const isPos = (c.netPnlUsd || 0) >= 0;
        html += '<tr>' +
          '<td><span class="sym-btn" onclick="loadTvSymbol(\\'' + (c.tvSymbol || c.symbol) + '\\')">' + c.symbol + '</span></td>' +
          '<td>' + renderTierBadge(c.tier) + '</td>' +
          '<td>$' + Number(c.notionalUsd).toFixed(2) + '</td>' +
          '<td class="' + (isPos ? 'pos' : 'neg') + '">' + fmtSignedMoney(c.netPnlUsd) + ' (' + (c.netPnlPct >= 0 ? '+' : '') + Number(c.netPnlPct).toFixed(2) + '%)</td>' +
          '<td>' + c.heldMinutes + 'm</td>' +
          '<td style="font-size:11px; color:var(--muted);">' + c.exitReason + '</td>' +
        '</tr>';
      }
      el.innerHTML = html;
    }

    async function refreshStatus() {
      try {
        const r = await fetch('/api/status');
        if (!r.ok) return;
        const data = await r.json();

        // Engine Pause state
        document.getElementById('pause-btn').innerText = data.paused ? '▶ Resume Patrol' : '⏸ Pause Patrol';
        document.getElementById('engine-status-text').innerText = data.paused ? 'PATROL PAUSED' : 'LIVE DEMO PATROL ACTIVE';

        const t212 = data.trading212;
        const dex = data.metamaskDex;

        // Master Totals
        const masterEq = Number(t212.portfolio.totalEquityUsd + dex.portfolio.totalEquityUsd);
        const masterPnl = masterEq - 200.0;
        const masterPct = (masterPnl / 200.0) * 100;
        document.getElementById('master-equity').innerText = fmtMoney(masterEq);
        const mPnlEl = document.getElementById('master-pnl');
        mPnlEl.innerText = fmtSignedMoney(masterPnl) + ' (' + (masterPct >= 0 ? '+' : '') + masterPct.toFixed(2) + '%) Combined';
        mPnlEl.className = 'kpi-sub ' + (masterPnl >= 0 ? 'pos' : 'neg');

        const totalWins = (t212.portfolio.winCount || 0) + (dex.portfolio.winCount || 0);
        const totalLosses = (t212.portfolio.lossCount || 0) + (dex.portfolio.lossCount || 0);
        document.getElementById('master-wr').innerText = totalWins + 'W / ' + totalLosses + 'L';

        const pb = data.piggyBank;
        if (pb) {
          document.getElementById('master-scanned').innerText = fmtMoney(pb.totalCurrentValueUsd) + ' Vault';
          document.getElementById('piggy-kpi-sub').innerText = pb.progressTo500Pct + '% to $500 Auto-Siphon • ' + (pb.siphonCount || 0) + ' Tranches';
          document.getElementById('piggy-val').innerText = fmtMoney(pb.totalCurrentValueUsd);
          document.getElementById('piggy-invested').innerText = fmtMoney(pb.totalDepositedUsd) + ' (' + (pb.siphonCount || 0) + ' Tranches)';
          const pPnlEl = document.getElementById('piggy-pnl');
          pPnlEl.innerText = fmtSignedMoney(pb.totalUnrealizedPnlUsd);
          pPnlEl.className = 'value ' + ((pb.totalUnrealizedPnlUsd || 0) >= 0 ? 'pos' : 'neg');
          document.getElementById('piggy-yield').innerText = '+' + fmtMoney(pb.estimatedAnnualIncomeUsd) + ' / yr (~4.4% Yield)';
          document.getElementById('piggy-progress-txt').innerText = pb.progressTo500Pct + '% (' + fmtMoney(pb.remainingToUnlockUsd) + ' to $500 Auto-Siphon)';
          document.getElementById('piggy-progress-bar').style.width = Math.min(100, pb.progressTo500Pct || 40) + '%';
          document.getElementById('piggy-unlock-badge').innerText = pb.isUnlocked
            ? '🟢 UNLOCKED: Auto-Siphoning $15 ($10-$20) Every +$25 Milestone'
            : '🔒 Auto-Unlocks at $500.00 Equity ($' + Number(pb.remainingToUnlockUsd || 300).toFixed(2) + ' away)';

          const hList = pb.holdingsList || [];
          if (hList.length > 0) {
            let pHtml = '';
            for (const h of hList) {
              const isArctic = h.category === 'ARCTIC_SHIPPING_2026_2034';
              const badge = isArctic
                ? '<span class="tier-t">🚢 ARCTIC 2026–2034</span>'
                : '<span class="tier-a">🏛️ SOVEREIGN BOND / YIELD</span>';
              pHtml += '<tr>' +
                '<td><span class="sym-btn" onclick="loadTvSymbol(\\'' + (h.tvSymbol || h.symbol) + '\\')">' + h.symbol + '</span></td>' +
                '<td><b>' + h.name + '</b> &nbsp;' + badge + '</td>' +
                '<td style="font-size:11px; color:var(--amber);">' + h.horizon + ' • <b>' + h.estYieldPct + '% Yield</b></td>' +
                '<td><b>' + h.weightPct + '%</b></td>' +
                '<td>$' + Number(h.currentPrice || 0).toFixed(2) + '</td>' +
                '<td><b>$' + Number(h.currentValueUsd || 0).toFixed(2) + '</b> <span style="color:var(--muted); font-size:11px;">(' + Number(h.shares || 0).toFixed(4) + ' sh)</span></td>' +
                '<td style="font-size:11px; color:var(--muted);">' + h.thesis + '</td>' +
              '</tr>';
            }
            document.getElementById('piggy-holdings-body').innerHTML = pHtml;
          }
        }

        // Autonomous Learner Agent & Global Market Relay Telemetry
        const la = data.learnerAgent;
        const gmr = data.globalMarketRelay;
        if (la && gmr) {
          document.getElementById('agent-cycle-count').innerText = 'Optimizing Cycle #' + (la.optimizationCycleCount || 0);
          document.getElementById('relay-session-name').innerText = gmr.sessionName || '24/7 Global Active';
          document.getElementById('relay-session-region').innerText = gmr.region || gmr.utcWindow || 'Continuous Relay';
          document.getElementById('relay-fill-health').innerText = la.slippageAudit?.slippageHealth || 'OPTIMAL_TIGHT_FILLS';
          document.getElementById('relay-slippage-sub').innerText = 'Avg Slippage: ' + (la.slippageAudit?.avgSlippagePct || 0.04) + '% • ' + (la.slippageAudit?.totalEvaluated || 0) + ' audited';
          document.getElementById('relay-active-strat').innerText = la.dynamicAdjustments?.activeStrategyTemplate || 'STRAT_CUSTOM_LEARNER_SYNTH';
          document.getElementById('relay-risk-state').innerText = 'Buffer ' + (la.dynamicAdjustments?.antiStagnationBufferMin || 30) + 'm • Trail ' + (la.dynamicAdjustments?.trailingFloorMultiplier || 1.0) + 'x';
          document.getElementById('agent-last-eval').innerText = 'Evaluated: ' + (la.lastEvaluatedAt || 'Just Now');

          const notesStream = document.getElementById('agent-notes-stream');
          if (Array.isArray(la.recentNotes) && la.recentNotes.length > 0) {
            let nHtml = '';
            for (const n of la.recentNotes) {
              const col = n.type === 'MARKET_HANDOVER' ? 'var(--blue)' : (n.type === 'AGENT_INIT' ? 'var(--green)' : 'var(--amber)');
              nHtml += '<div><span style="color:var(--muted); font-size:10px;">[' + n.timestamp + ']</span> <b style="color:' + col + ';">' + n.type + ':</b> ' + n.message + '</div>';
            }
            notesStream.innerHTML = nHtml;
          }
        }

        // Trading212 Deck
        document.getElementById('t212-kpi-eq').innerText = fmtMoney(t212.portfolio.totalEquityUsd);
        document.getElementById('t212-eq').innerText = fmtMoney(t212.portfolio.totalEquityUsd);
        document.getElementById('t212-cash').innerText = fmtMoney(t212.portfolio.cashUsd);
        const t212Real = document.getElementById('t212-realized');
        t212Real.innerText = fmtSignedMoney(t212.portfolio.realizedPnlUsd);
        t212Real.className = 'value ' + (t212.portfolio.realizedPnlUsd >= 0 ? 'pos' : 'neg');
        document.getElementById('t212-session').innerText = t212.broker?.sessionMode?.replace(/_/g, ' ') || '24/7 Active';
        document.getElementById('t212-health-badge').innerText = 'Health: ' + (t212.health?.healthScore || 100) + '/100';

        renderOpenPositions(t212.portfolio.openPositions || [], 't212-open-body', 't212-open-count');
        renderClosedTrades(t212.portfolio.closedTrades || [], 't212-closed-body', 't212-closed-count');

        // MetaMask DEX Deck
        document.getElementById('dex-kpi-eq').innerText = fmtMoney(dex.portfolio.totalEquityUsd);
        document.getElementById('dex-eq').innerText = fmtMoney(dex.portfolio.totalEquityUsd);
        document.getElementById('dex-cash').innerText = fmtMoney(dex.portfolio.cashUsd);
        const dexReal = document.getElementById('dex-realized');
        dexReal.innerText = fmtSignedMoney(dex.portfolio.realizedPnlUsd);
        dexReal.className = 'value ' + (dex.portfolio.realizedPnlUsd >= 0 ? 'pos' : 'neg');
        document.getElementById('dex-health-badge').innerText = 'Health: ' + (dex.health?.healthScore || 100) + '/100';

        renderOpenPositions(dex.portfolio.openPositions || [], 'dex-open-body', 'dex-open-count');
        renderClosedTrades(dex.portfolio.closedTrades || [], 'dex-closed-body', 'dex-closed-count');

        // Learned Tier Matrix & TradingView Volatility/Volume Feature Weights
        const weights = t212.health?.learnedWeights || { S: 1.0, T: 1.0, A: 1.0 };
        const fWeights = t212.health?.featureWeights || {};
        const tStats = t212.health?.tierStats || {};
        document.getElementById('weight-s').innerText = 'Weight: ' + Number(weights.S || 1).toFixed(2) + 'x';
        document.getElementById('weight-t').innerText = 'Weight: ' + Number(weights.T || 1).toFixed(2) + 'x';
        document.getElementById('weight-a').innerText = 'Weight: ' + Number(weights.A || 1).toFixed(2) + 'x';

        for (const k of ['volSqueeze', 'atrTrend', 'vwapVolume', 'rvolMfi', 'channelBreakout']) {
          const el = document.getElementById('fw-' + k);
          if (el && fWeights[k] !== undefined) {
            el.innerText = Number(fWeights[k]).toFixed(2) + 'x';
          }
        }

        if (tStats['S-TIER']) {
          document.getElementById('stats-s').innerText = tStats['S-TIER'].wins + 'W / ' + tStats['S-TIER'].losses + 'L • Net: ' + fmtSignedMoney(tStats['S-TIER'].netPnlUsd);
        }
        if (tStats['T-TIER']) {
          document.getElementById('stats-t').innerText = tStats['T-TIER'].wins + 'W / ' + tStats['T-TIER'].losses + 'L • Net: ' + fmtSignedMoney(tStats['T-TIER'].netPnlUsd);
        }
        if (tStats['A-TIER']) {
          document.getElementById('stats-a').innerText = tStats['A-TIER'].wins + 'W / ' + tStats['A-TIER'].losses + 'L • Net: ' + fmtSignedMoney(tStats['A-TIER'].netPnlUsd);
        }

        // Combined Audit Journal
        const combinedAudits = [...(t212.decisionAuditLog || []), ...(dex.decisionAuditLog || [])].slice(0, 20);
        document.getElementById('audit-total-count').innerText = combinedAudits.length + ' Recent Multi-Factor Evaluations';
        const auditBody = document.getElementById('master-audit-body');
        if (combinedAudits.length > 0) {
          let aHtml = '';
          for (const a of combinedAudits) {
            const pxDig = a.price < 0.01 ? 6 : (a.price < 1 ? 4 : 2);
            aHtml += '<tr>' +
              '<td>' + a.time + '</td>' +
              '<td><b>' + a.platform + '</b></td>' +
              '<td><span class="sym-btn" onclick="loadTvSymbol(\\'' + (a.tvSymbol || a.symbol) + '\\')">' + a.symbol + '</span></td>' +
              '<td>$' + Number(a.price).toFixed(pxDig) + '</td>' +
              '<td class="' + (a.change1h >= 0 ? 'pos' : 'neg') + '">' + (a.change1h >= 0 ? '+' : '') + a.change1h + '% / ' + (a.change24h >= 0 ? '+' : '') + a.change24h + '%</td>' +
              '<td>RSI ' + a.rsi + ' • <b>' + (a.tvRating || 'NEUTRAL') + '</b></td>' +
              '<td>' + renderTierBadge(a.tier) + ' <b>' + a.score + '/100</b></td>' +
              '<td style="font-size:11px; color:var(--muted);">' + a.reason + '</td>' +
            '</tr>';
          }
          auditBody.innerHTML = aHtml;
        }
      } catch (_) {}
    }

    window.addEventListener('DOMContentLoaded', () => {
      loadTvSymbol(currentTvSym);
      refreshStatus();
      setInterval(refreshStatus, 2500);
      setInterval(() => loadTvSymbol(currentTvSym), 5000);
    });
  </script>
</body>
</html>`;

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    res.end(html);
  });

  return server;
}
