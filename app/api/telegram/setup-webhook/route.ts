import { NextRequest, NextResponse } from 'next/server';
import { getTelegramBotToken } from '@/lib/telegramBot';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const token = getTelegramBotToken();

  if (!token || token.includes('your-telegram') || token.trim() === '') {
    return NextResponse.json(
      {
        ok: false,
        error: "TELEGRAM_BOT_TOKEN sozlanmagan. Iltimos, sozlamalar orqali haqiqiy bot tokeningizni kiriting.",
      },
      { status: 400 }
    );
  }

  const origin = req.nextUrl.origin;
  const appUrl = process.env.APP_URL || origin;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  try {
    // 1. Verify Bot Token via getMe
    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      cache: 'no-store',
    });
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Telegram bot token noto'g'ri: ${getMeData.description || 'Invalid token'}`,
        },
        { status: 400 }
      );
    }

    const botUsername = getMeData.result.username;

    // 2. Set Webhook with full allowed updates
    const setWebhookUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
      webhookUrl
    )}&allowed_updates=${encodeURIComponent(JSON.stringify(['message', 'callback_query']))}&drop_pending_updates=true`;

    const setRes = await fetch(setWebhookUrl, { cache: 'no-store' });
    const setData = await setRes.json();

    if (!setData.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Webhook o'rnatishda xatolik: ${setData.description || 'Failed to set webhook'}`,
        },
        { status: 500 }
      );
    }

    // 3. Confirm Webhook Info
    const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, {
      cache: 'no-store',
    });
    const infoData = await infoRes.json();

    return NextResponse.json({
      ok: true,
      botUsername,
      botName: getMeData.result.first_name,
      webhookUrl,
      webhookInfo: infoData.result,
      message: `✅ Webhook muvaffaqiyatli ulandi! Endi @${botUsername} barcha buyruqlarni qabul qiladi.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Telegram serveriga ulanishda xatolik',
      },
      { status: 500 }
    );
  }
}
