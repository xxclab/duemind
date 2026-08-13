interface NotificationPayload {
  type: string;
  name: string;
  config: Record<string, unknown>;
  title: string;
  body: string;
  thingUrl?: string;
}

export async function sendNotification(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  const { type, config, title, body } = payload;

  try {
    switch (type) {
      case 'telegram':
        return await sendTelegram(config, title, body);
      case 'email':
        // Email notifications via Resend or similar can be added later
        // For MVP, we log it
        console.log(`Email notification: ${title} - ${body}`);
        return { success: true };
      case 'webhook':
        return await sendWebhook(config, title, body);
      default:
        console.log(`Unsupported channel type: ${type}`);
        return { success: false, error: `Unsupported channel type: ${type}` };
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

async function sendTelegram(config: Record<string, unknown>, title: string, body: string): Promise<{ success: boolean; error?: string }> {
  const botToken = config.bot_token as string;
  const chatId = config.chat_id as string;

  if (!botToken || !chatId) {
    return { success: false, error: 'Missing bot_token or chat_id in Telegram config' };
  }

  const message = `🔔 *${escapeMarkdown(title)}*\n\n${escapeMarkdown(body)}`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'MarkdownV2',
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    return { success: false, error: `Telegram API error: ${error}` };
  }

  return { success: true };
}

async function sendWebhook(config: Record<string, unknown>, title: string, body: string): Promise<{ success: boolean; error?: string }> {
  const url = config.url as string;
  if (!url) {
    return { success: false, error: 'Missing url in webhook config' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, timestamp: new Date().toISOString() }),
  });

  if (!res.ok) {
    return { success: false, error: `Webhook error: ${res.status}` };
  }

  return { success: true };
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}
