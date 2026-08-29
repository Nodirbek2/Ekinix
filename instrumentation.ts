export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || token.includes('your-telegram') || token.trim() === '') {
      return;
    }

    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || '';

    // Always use the STABLE production URL for webhook registration.
    //
    // Priority:
    //   1. PRODUCTION_URL env var — set this explicitly in Vercel project settings
    //      to "https://ekinix.vercel.app" so it never changes between deployments.
    //   2. APP_URL — may be a deployment-specific preview URL on Vercel; avoid relying
    //      on it alone for production webhook registration.
    //   3. Hard-coded stable production fallback.
    //
    // DO NOT use req.nextUrl.origin or VERCEL_URL here — those resolve to the
    // per-deployment preview URL and cause 401s because Telegram calls the old URL.
    const productionUrl =
      process.env.PRODUCTION_URL ||
      process.env.APP_URL ||
      'https://ekinix.vercel.app';

    const webhookUrl = `${productionUrl}/api/telegram/webhook`;

    (async () => {
      try {
        console.log(`[Ekinix Telegram Service] Configuring instant Webhook mode -> ${webhookUrl}`);

        // Build the setWebhook URL.
        // secret_token MUST match TELEGRAM_WEBHOOK_SECRET so the webhook handler's
        // 401 guard (x-telegram-bot-api-secret-token header check) passes every request.
        const params = new URLSearchParams({
          url: webhookUrl,
          allowed_updates: JSON.stringify(['message', 'callback_query', 'edited_message']),
          drop_pending_updates: 'false',
          ...(webhookSecret ? { secret_token: webhookSecret } : {}),
        });

        const setWebhookApiUrl = `https://api.telegram.org/bot${token}/setWebhook?${params.toString()}`;

        const res = await fetch(setWebhookApiUrl);
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
                  headers: {
                    'Content-Type': 'application/json',
                    // Pass the secret header even in fallback polling so the handler
                    // doesn't reject locally-forwarded updates.
                    ...(webhookSecret ? { 'x-telegram-bot-api-secret-token': webhookSecret } : {}),
                  },
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
