/**
 * Unified Telegram Command & Notification Bridge
 * Dispatches real-time S-Tier / T-Tier / A-Tier trade execution receipts
 * and portfolio status alerts across Trading212 ($100) and MetaMask 1inch DEX ($100).
 */

import envConfig from '../core/auto-resolver.js';

export class TelegramCommandBridge {
  get token() {
    return process.env.TELEGRAM_BOT_TOKEN || '';
  }

  get chatId() {
    return process.env.TELEGRAM_CHAT_ID || '';
  }

  async sendAlert(htmlText) {
    if (!this.token || !this.chatId) return false;
    try {
      const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: htmlText,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }),
        signal: AbortSignal.timeout(5000)
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  async notifyEntry(platformName, position) {
    const msg =
      `🚀 <b>[${position.tier}] LIVE DEMO BUY EXECUTED (USD)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• <b>Platform:</b> ${platformName}\n` +
      `• <b>Asset:</b> <b>${position.symbol}</b> (${position.name})\n` +
      `• <b>Entry Price:</b> $${Number(position.entryPrice).toFixed(4)}\n` +
      `• <b>Allocated:</b> $${position.notionalUsd.toFixed(2)}\n` +
      `• <b>Target / Stop:</b> +${position.targetGainPct}% / -${position.stopLossPct}%\n` +
      `• <b>Edge:</b> ${position.rationale}`;
    return this.sendAlert(msg);
  }

  async notifyExit(platformName, closedTrade) {
    const sign = closedTrade.netPnlUsd >= 0 ? '+' : '';
    const icon = closedTrade.netPnlUsd >= 0 ? '🏆' : '🛡️';
    const msg =
      `${icon} <b>[${closedTrade.tier}] POSITION SETTLED (USD)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `• <b>Platform:</b> ${platformName}\n` +
      `• <b>Asset:</b> <b>${closedTrade.symbol}</b>\n` +
      `• <b>Net PnL:</b> <b>${sign}$${closedTrade.netPnlUsd.toFixed(2)} (${sign}${closedTrade.netPnlPct.toFixed(2)}%)</b>\n` +
      `• <b>Duration:</b> ${closedTrade.heldMinutes} mins\n` +
      `• <b>Reason:</b> ${closedTrade.exitReason}`;
    return this.sendAlert(msg);
  }
}

export default new TelegramCommandBridge();
