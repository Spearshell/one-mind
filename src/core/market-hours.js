/**
 * US market clock (New York time, daylight-saving aware) + the backtest-confirmed trading rules.
 *
 * Backtest (Oct 8-30 2026, real code replayed minute by minute) showed:
 *  - buys in pre-market / after-hours lost in both halves of the test (thin books, gaps fade)
 *  - holding overnight made results worse
 *  - afternoon buys (12:00-15:30) were roughly zero-edge before costs and lost after costs in every variant tested
 * so by default the desks only BUY between 09:45 and 12:00 New York time (14:45-17:00 UK time in winter)
 * and go flat 5 minutes before the close.
 *
 * Every rule can be switched back in .env:
 *   T212_ENTRY_WINDOW_ET=09:45-12:00     (e.g. 09:45-15:30 for longer, or "off" to allow buying 24/5 like before)
 *   T212_FLAT_BEFORE_CLOSE=true          (false = allow holding overnight)
 *   T212_FLAT_MINUTES_BEFORE_CLOSE=5
 *   T212_EARLY_CLOSE_DAYS=2026-11-27,2026-12-24   (13:00 New York close days)
 */

const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', hour12: false, weekday: 'short',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
});
const WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export const PRE_OPEN = 240;    // 04:00
export const REG_OPEN = 570;    // 09:30
export const REG_CLOSE = 960;   // 16:00
export const POST_CLOSE = 1200; // 20:00

export function envFlag(name, def) {
  const v = String(process.env[name] ?? '').trim().toLowerCase();
  if (!v) return def;
  return !['false', '0', 'off', 'no'].includes(v);
}

export function envNum(name, def) {
  const v = parseFloat(process.env[name]);
  return Number.isFinite(v) ? v : def;
}

/** New York calendar day ('YYYY-MM-DD'), minute of the day and weekday (0 = Sunday). */
export function nyTime(date = new Date()) {
  const p = {};
  for (const x of fmt.formatToParts(date)) p[x.type] = x.value;
  return {
    day: `${p.year}-${p.month}-${p.day}`,
    minute: (Number(p.hour) % 24) * 60 + Number(p.minute),
    weekday: WEEKDAY[p.weekday]
  };
}

function earlyCloseDays() {
  return new Set(String(process.env.T212_EARLY_CLOSE_DAYS || '2026-11-27,2026-12-24').split(',').map(s => s.trim()).filter(Boolean));
}

/** Regular-session close (minute of day) for a New York day: 13:00 on early-close days, else 16:00. */
export function closeMinute(day) {
  return earlyCloseDays().has(day) ? 780 : REG_CLOSE;
}

/** 'regular' | 'pre-market' | 'after-hours' | 'closed' */
export function usSession(date = new Date()) {
  const t = nyTime(date);
  if (t.weekday === 0 || t.weekday === 6) return 'closed';
  const close = closeMinute(t.day);
  if (t.minute >= REG_OPEN && t.minute < close) return 'regular';
  if (t.minute >= PRE_OPEN && t.minute < REG_OPEN) return 'pre-market';
  if (t.minute >= close && t.minute < POST_CLOSE) return 'after-hours';
  return 'closed';
}

import globalMarketRelay from './global-market-relay.js';

const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };

export function entryWindow() {
  const raw = String(process.env.T212_ENTRY_WINDOW_ET || '09:45-10:30').trim().toLowerCase();
  if (['off', 'false', 'any', '24/5', '24/7', 'global', 'none'].includes(raw)) return null;
  const [a, b] = raw.split('-');
  const from = toMin(a), to = toMin(b);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return { from: 585, to: 630, label: '09:45-10:30' };
  return { from, to, label: raw };
}

/**
 * Backtest 2026-11-03: the 24/7 relay (buy at any hour, hold overnight) replayed to -$62 vs -$7.67 for
 * 09:45-12:00 + flat before the close (Oct 8-30, same code, real costs). The relay is now opt-in:
 * set T212_ENTRY_WINDOW_ET=global in .env to buy around the clock again.
 * 24/7/365 Global Market Relay:
 * Always returns true when global relay is enabled, allowing seamless trading handovers
 * between London, US Pre-Market, US Regular, US Post-Market, Asia-Pacific, and Weekend Crypto.
 */
export function inEntryWindow(date = new Date()) {
  const w = entryWindow();
  if (!w) {
    return globalMarketRelay.isTradingPermitted();
  }
  const t = nyTime(date);
  if (t.weekday === 0 || t.weekday === 6) return false;
  const to = Math.min(w.to, closeMinute(t.day) - 30);
  return t.minute >= w.from && t.minute < to;
}

/**
 * Returns an exit type when an open position must be closed because of the clock, else null:
 *  - 'EOD_FLAT'                 the last minutes before the US close
 *  - 'OVERNIGHT_LEFTOVER_FLAT'  a position from an earlier day (e.g. the bot was off at the close), once the market is open
 */
export function flatBeforeCloseDue(position, date = new Date()) {
  if (!envFlag('T212_FLAT_BEFORE_CLOSE', true)) return null;
  const t = nyTime(date);
  if (t.weekday === 0 || t.weekday === 6) return null;
  const close = closeMinute(t.day);
  if (t.minute >= close - envNum('T212_FLAT_MINUTES_BEFORE_CLOSE', 5) && t.minute < close) return 'EOD_FLAT';
  const entryDay = position && position.entryTime ? nyTime(new Date(position.entryTime)).day : t.day;
  if (entryDay < t.day && t.minute >= REG_OPEN + 1 && t.minute < close) return 'OVERNIGHT_LEFTOVER_FLAT';
  return null;
}

export default { nyTime, usSession, inEntryWindow, entryWindow, flatBeforeCloseDue, closeMinute, envFlag, envNum };
