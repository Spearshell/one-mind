/**
 * Dynamic Auto-Resolver & Secret Discovery Engine
 * Automatically locates credentials, API keys (Trading212, Gemini, Telegram, MetaMask)
 * by scanning relative workspace directories and sibling folders (e.g. Ready/exe/secrets)
 * with ZERO hardcoded absolute file paths.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function parseKeyValueFile(filePath) {
  const result = {};
  try {
    if (!fs.existsSync(filePath)) return result;
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key) result[key] = val;
    }
  } catch (_) {}
  return result;
}

/**
 * Recursively searches candidate roots for a target filename (depth-limited)
 */
function findFileInRoots(roots, targetFilename, maxDepth = 4) {
  const visited = new Set();

  function walk(dir, depth) {
    if (depth > maxDepth || visited.has(dir)) return null;
    visited.add(dir);
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      return null;
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.toLowerCase() === targetFilename.toLowerCase()) {
        return path.join(dir, entry.name);
      }
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('node_modules') && !entry.name.startsWith('.git')) {
        const found = walk(path.join(dir, entry.name), depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  for (const r of roots) {
    if (fs.existsSync(r)) {
      const found = walk(r, 0);
      if (found) return found;
    }
  }
  return null;
}

export function resolveEnvironment() {
  // 1. Load local project .env first
  const localEnv = parseKeyValueFile(path.join(PROJECT_ROOT, '.env'));
  for (const [k, v] of Object.entries(localEnv)) {
    if (!process.env[k] && v !== '') process.env[k] = v;
  }

  // 2. Determine dynamic search roots (Workspace parent, Desktop, Ready folder)
  const parentDir = path.resolve(PROJECT_ROOT, '..');
  const desktopDir = path.resolve(parentDir, '..');
  const homeDesktop = path.join(os.homedir(), 'Desktop');

  const searchRoots = Array.from(new Set([
    PROJECT_ROOT,
    parentDir,
    path.join(desktopDir, 'Ready'),
    path.join(homeDesktop, 'Ready'),
    desktopDir,
    homeDesktop
  ]));

  // 3. Auto-discover trading212.key if Trading212 credentials are not already in process.env
  const t212KeyPath = findFileInRoots(searchRoots, 'trading212.key', 4);
  if (t212KeyPath) {
    const t212Secrets = parseKeyValueFile(t212KeyPath);
    if (!process.env.TRADING212_API_KEY && t212Secrets.API_KEY) {
      process.env.TRADING212_API_KEY = t212Secrets.API_KEY;
    }
    if (!process.env.TRADING212_API_SECRET && t212Secrets.API_SECRET) {
      process.env.TRADING212_API_SECRET = t212Secrets.API_SECRET;
    }
    if (!process.env.TRADING212_BASE_URL && t212Secrets.BASE_URL) {
      process.env.TRADING212_BASE_URL = t212Secrets.BASE_URL;
    }
    process.env.DISCOVERED_T212_KEY_PATH = t212KeyPath;
  }

  // 4. Auto-discover sibling .env files for Gemini / Telegram / MetaMask fallbacks
  const siblingBotDirs = ['1inch-trading-bot', 'cexio-trading-bot', 'solana-sniper-bot'];
  for (const dirName of siblingBotDirs) {
    const candidateEnv = path.join(parentDir, dirName, '.env');
    if (fs.existsSync(candidateEnv)) {
      const parsed = parseKeyValueFile(candidateEnv);
      for (const [k, v] of Object.entries(parsed)) {
        if (!process.env[k] && v !== '') process.env[k] = v;
      }
    }
  }

  return {
    projectRoot: PROJECT_ROOT,
    stateDir: path.join(PROJECT_ROOT, 'state'),
    trading212Configured: Boolean(process.env.TRADING212_API_KEY && process.env.TRADING212_API_SECRET),
    trading212KeySource: process.env.DISCOVERED_T212_KEY_PATH || 'Environment',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    startingCapitalPerPlatform: {
      trading212: parseFloat(process.env.TRADING212_STARTING_USD || '100.00'),
      metamaskDex: parseFloat(process.env.METAMASK_STARTING_USD || '100.00')
    }
  };
}

export default resolveEnvironment();
