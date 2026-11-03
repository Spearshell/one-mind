/**
 * Which US stocks Trading212 actually offers, and their Trading212 ticker.
 *
 * Why: the backtest showed ~23% of the desks' picks were US-listed ETFs (2x/3x leveraged etc.) that a UK Trading212
 * account cannot buy, and ~1,450 US stocks use a different ticker on Trading212 than on the exchange
 * (e.g. SOFI is IPOE_US_EQ, ASTS is NPA_US_EQ), so "SYMBOL_US_EQ" orders would fail or hit the wrong instrument.
 *
 * Source: state/t212-instruments.json, downloaded read-only from the practice server
 * (node tools/fetch-t212-instruments.mjs, refreshed automatically about once a week).
 * Set T212_TRADABLE_ONLY=false in .env to switch the filter off.
 */
import fs from 'node:fs';
import path from 'node:path';
import envConfig from '../core/auto-resolver.js';

const FILE = path.join(envConfig.stateDir, 't212-instruments.json');

class T212Instruments {
  constructor() {
    this.map = null;        // exchange symbol -> Trading212 ticker (US stocks only)
    this.fetchedAt = null;
    this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(FILE)) {
        console.warn('[T212] No tradable-instrument list yet (state/t212-instruments.json) - every symbol allowed until it is downloaded.');
        return;
      }
      const j = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      const m = new Map();
      for (const i of j.instruments || []) {
        const ticker = String(i.ticker || '');
        if (!ticker.endsWith('_US_EQ') || i.type !== 'STOCK' || i.currencyCode !== 'USD') continue;
        const sym = String(i.shortName || '').trim().toUpperCase();
        if (!sym) continue;
        if (!m.has(sym) || ticker === `${sym}_US_EQ`) m.set(sym, ticker);
      }
      if (!m.size) return;
      this.map = m;
      this.fetchedAt = j.fetchedAt || null;
      console.log(`[T212] Tradable list: ${m.size} US stocks (downloaded ${this.fetchedAt || 'unknown'}) - ETFs/instruments Trading212 doesn't offer are skipped`);
    } catch (e) {
      console.warn(`[T212] Could not read the tradable-instrument list: ${e.message}`);
    }
  }

  get filterOn() {
    return Boolean(this.map) && String(process.env.T212_TRADABLE_ONLY || 'true').trim().toLowerCase() !== 'false';
  }

  /** true if Trading212 offers this US stock (always true while no list is loaded or the filter is off) */
  isTradable(symbol) {
    if (!this.filterOn) return true;
    return this.map.has(String(symbol || '').trim().toUpperCase());
  }

  /** Trading212 ticker for an exchange symbol, e.g. SOFI -> IPOE_US_EQ (null if unknown) */
  tickerFor(symbol) {
    if (!this.map) return null;
    return this.map.get(String(symbol || '').trim().toUpperCase()) || null;
  }

  isStale(maxAgeDays = 7) {
    if (!this.fetchedAt) return true;
    return (Date.now() - new Date(this.fetchedAt).getTime()) > maxAgeDays * 86400000;
  }

  save(list) {
    if (!Array.isArray(list) || list.length < 1000) return false; // never replace a good list with a broken answer
    fs.mkdirSync(envConfig.stateDir, { recursive: true });
    const tmp = `${FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ fetchedAt: new Date().toISOString(), count: list.length, instruments: list }));
    fs.renameSync(tmp, FILE);
    this._load();
    return true;
  }
}

export default new T212Instruments();
