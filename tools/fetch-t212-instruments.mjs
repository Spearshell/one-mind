// Downloads the list of instruments your Trading212 account can actually trade (read-only, practice server only)
// and saves it to state/t212-instruments.json. The bot uses it to skip stocks/ETFs Trading212 doesn't offer
// (many US-listed ETFs, e.g. 2x/3x leveraged ones, are not available to UK accounts).
// Run from the live-demo-main-project folder:  node tools/fetch-t212-instruments.mjs
// Your key is read the same way the bot reads it and is never printed or written anywhere.
import fs from 'node:fs';
import path from 'node:path';
import envConfig from '../src/core/auto-resolver.js';

const key = (process.env.TRADING212_API_KEY || '').trim();
const secret = (process.env.TRADING212_API_SECRET || '').trim();
if (!key || !secret) { console.log('No Trading212 key found - nothing fetched.'); process.exit(1); }
const auth = key.startsWith('Basic ') ? key : `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`;

const res = await fetch('https://demo.trading212.com/api/v0/equity/metadata/instruments', {
  headers: { Authorization: auth, Accept: 'application/json' },
  signal: AbortSignal.timeout(30000)
});
if (!res.ok) { console.log(`Trading212 answered HTTP ${res.status} - list not saved (the key may not have the "Metadata" permission).`); process.exit(1); }
const list = await res.json();
if (!Array.isArray(list) || !list.length) { console.log('Empty instrument list - not saved.'); process.exit(1); }

fs.mkdirSync(envConfig.stateDir, { recursive: true });
const file = path.join(envConfig.stateDir, 't212-instruments.json');
fs.writeFileSync(file, JSON.stringify({ fetchedAt: new Date().toISOString(), count: list.length, instruments: list }));
const us = list.filter(i => String(i.ticker || '').endsWith('_US_EQ'));
const types = {}; for (const i of us) types[i.type] = (types[i.type] || 0) + 1;
console.log(`Saved ${list.length} instruments to ${file} (US-listed: ${us.length} ${JSON.stringify(types)})`);
