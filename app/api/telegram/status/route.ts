import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const username = process.env.TELEGRAM_BOT_USERNAME || 'EkinixAgroBot';
  const isConfigured = Boolean(token && !token.includes('your-telegram') && token.trim() !== '');

  let botInfo: any = {
    username,
    first_name: 'Ekinix Agro Yordamchi Bot',
    can_join_groups: false,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
  };

  if (isConfigured) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      if (data.ok) {
        botInfo = data.result;
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({
    ok: true,
    isConfigured,
    botUsername: botInfo.username || username,
    botName: botInfo.first_name || 'Ekinix Agro Bot',
    botDeepLink: `https://t.me/${botInfo.username || username}`,
  });
}
