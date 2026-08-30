/**
 * lib/alert-webhook.ts
 * 
 * Sistema de alertas y notificaciones automáticas 100% gratuito (0€).
 * Soporta webhooks de Discord y bots de Telegram para recibir el estado de las
 * sincronizaciones de precios y avisos de errores críticos en tu móvil o PC.
 */

interface SyncReportPayload {
  title: string;
  status: 'success' | 'warning' | 'error';
  summaryText: string;
  details?: Record<string, unknown>;
  durationMs?: number;
}

/**
 * Envía una notificación a un Webhook de Discord (100% gratuito)
 */
async function sendDiscordAlert(webhookUrl: string, payload: SyncReportPayload) {
  const color = payload.status === 'success' ? 0x22c55e : payload.status === 'warning' ? 0xeab308 : 0xef4444;

  const fields = payload.details
    ? Object.entries(payload.details).map(([key, val]) => ({
        name: key,
        value: typeof val === 'object' ? JSON.stringify(val) : String(val),
        inline: true,
      }))
    : [];

  const body = {
    username: 'NutriCompare SyncBot',
    avatar_url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/activity.png',
    embeds: [
      {
        title: payload.title,
        description: payload.summaryText,
        color,
        fields,
        footer: {
          text: `NutriCompare Data Engine • Duración: ${payload.durationMs ? `${(payload.durationMs / 1000).toFixed(1)}s` : 'N/A'}`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Envía una notificación a un Chat de Telegram mediante Bot API (100% gratuito)
 */
async function sendTelegramAlert(botToken: string, chatId: string, payload: SyncReportPayload) {
  const icon = payload.status === 'success' ? '✅' : payload.status === 'warning' ? '⚠️' : '❌';
  const text = `${icon} *${payload.title}*\n\n${payload.summaryText}\n\n⏱ *Duración:* ${
    payload.durationMs ? `${(payload.durationMs / 1000).toFixed(1)}s` : 'N/A'
  }\n📅 *Fecha:* ${new Date().toLocaleString('es-ES')}`;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });
}

/**
 * Función principal para despachar alertas a los canales configurados
 */
export async function dispatchSyncAlert(payload: SyncReportPayload) {
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  const promises: Promise<void>[] = [];

  if (discordUrl) {
    promises.push(
      sendDiscordAlert(discordUrl, payload).catch((err) =>
        console.error('[Alert] Error enviando a Discord:', err)
      )
    );
  }

  if (telegramToken && telegramChatId) {
    promises.push(
      sendTelegramAlert(telegramToken, telegramChatId, payload).catch((err) =>
        console.error('[Alert] Error enviando a Telegram:', err)
      )
    );
  }

  if (promises.length > 0) {
    await Promise.allSettled(promises);
  }
}
