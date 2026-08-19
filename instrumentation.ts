export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token.includes('your-telegram') || token.trim() === '') {
      return;
    }

    // Determine the public URL for Telegram Webhook
    const publicUrl =
      process.env.APP_URL ||
      'https://ais-dev-h5pr52dfmxp4gghj2evogv-62285800322.asia-east1.run.app';

    const webhookUrl = `${publicUrl}/api/telegram/webhook`;

    (async () => {
      try {
        console.log(`[Ekinix Telegram Service] Configuring instant Webhook mode -> ${webhookUrl}`);
        
        // 1. Set Webhook on Telegram's servers for instant zero-latency push delivery
        const setWebhookUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
          webhookUrl
        )}&allowed_updates=${encodeURIComponent(
          JSON.stringify(['message', 'callback_query', 'edited_message'])
        )}&drop_pending_updates=false`;

        const res = await fetch(setWebhookUrl);
        const data = await res.json();

        if (data.ok) {
          console.log('[Ekinix Telegram Service] ✅ Telegram Webhook registered successfully! Updates will be delivered instantly.');
          return;
        } else {
          console.warn('[Ekinix Telegram Service] Webhook registration response:', data);
        }
      } catch (err: any) {
        console.error('[Ekinix Telegram Service] Failed to register webhook:', err.message);
      }

      // Fallback: only if webhook registration fails, use short-interval zero-timeout polling
      console.log('[Ekinix Telegram Service] Starting low-latency fallback poller...');
      let lastOffset = 0;

      while (true) {
        try {
          const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastOffset}&timeout=1&limit=25`;
          const res = await fetch(url);
          const data = await res.json();

          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              lastOffset = Math.max(lastOffset, update.update_id + 1);

              try {
                await fetch('http://localhost:3000/api/telegram/webhook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(update),
                });
              } catch (postErr: any) {
                console.error('[Telegram Poller POST Error]:', postErr.message);
              }
            }
          } else {
            await new Promise((r) => setTimeout(r, 1000));
          }
        } catch {
          await new Promise((r) => setTimeout(r, 1000));
        }

        await new Promise((r) => setTimeout(r, 100));
      }
    })().catch((err) => {
      console.error('[Ekinix Telegram Service Fatal Error]:', err);
    });
  }
}
