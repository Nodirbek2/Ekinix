import { NextRequest, NextResponse } from 'next/server';
import { getTelegramBotToken, getTelegramBotUsername } from '@/lib/telegramBot';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const token = getTelegramBotToken();
  const defaultUsername = getTelegramBotUsername();
  const isConfigured = Boolean(token && !token.includes('your-telegram') && token.trim() !== '');

  let botInfo: {
    id?: number;
    username?: string;
    first_name?: string;
    can_join_groups?: boolean;
    is_bot?: boolean;
  } = {
    username: defaultUsername || 'ekinixbot',
    first_name: 'Ekinix',
  };

  let webhookInfo: any = null;
  let webhookStatus: string = 'unconfigured';
  let apiError: string | null = null;

  // Resolve base app URL
  const origin = req.nextUrl.origin;
  const appUrl = process.env.APP_URL || origin;
  const targetWebhookUrl = `${appUrl}/api/telegram/webhook`;

  if (isConfigured && token) {
    try {
      // 1. Fetch real bot details directly from Telegram
      const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        cache: 'no-store',
      });
      const getMeData = await getMeRes.json();

      if (getMeData.ok && getMeData.result) {
        botInfo = getMeData.result;
      } else {
        apiError = getMeData.description || 'Noto\'g\'ri bot token (Invalid Token)';
      }

      // 2. Fetch current webhook status
      const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, {
        cache: 'no-store',
      });
      const whData = await whRes.json();
      if (whData.ok) {
        webhookInfo = whData.result;
        if (webhookInfo.url === targetWebhookUrl) {
          webhookStatus = 'active';
        } else if (webhookInfo.url) {
          webhookStatus = 'url_mismatch';
        } else {
          webhookStatus = 'pending';
        }
      }

      // 3. If webhook is not set or mismatched, automatically register it
      if (webhookStatus !== 'active') {
        const setWhRes = await fetch(
          `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
            targetWebhookUrl
          )}&allowed_updates=${encodeURIComponent(JSON.stringify(['message', 'callback_query']))}`,
          { cache: 'no-store' }
        );
        const setWhData = await setWhRes.json();
        if (setWhData.ok) {
          webhookStatus = 'active';
          webhookInfo = { url: targetWebhookUrl };
        }
      }
    } catch (err: any) {
      apiError = err.message || 'Telegram serveriga ulanishda xatolik';
    }
  }

  const finalUsername = botInfo.username || defaultUsername || 'ekinixbot';

  return NextResponse.json({
    ok: true,
    isConfigured: isConfigured && !apiError,
    botUsername: finalUsername,
    botName: botInfo.first_name || 'Ekinix',
    botId: botInfo.id,
    botDeepLink: `https://t.me/${finalUsername}`,
    webhookStatus,
    webhookUrl: targetWebhookUrl,
    activeWebhookUrl: webhookInfo?.url || null,
    pendingUpdateCount: webhookInfo?.pending_update_count ?? 0,
    lastErrorMessage: webhookInfo?.last_error_message || apiError,
  });
}
