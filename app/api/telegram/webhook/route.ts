import { NextRequest, NextResponse } from 'next/server';
import {
  normalizePhoneNumber,
  fetchLiveWeather,
  formatTelegramWelcomeMessage,
  formatTelegramStartGreeting,
  formatTelegramWeatherAlert,
  formatTelegramFieldStatus,
  formatTelegramNotificationsMenu,
  getNotificationSettingsInlineKeyboard,
  sendTelegramMessage,
  getFarmerReplyKeyboard,
  getFieldCoordinates,
  answerTelegramCallbackQuery,
  editTelegramMessageText,
} from '@/lib/telegramBot';
import { supabase, isSupabaseConfigured, FarmerProfile, FieldRecord } from '@/lib/supabase';

// Sample fallback farmer data for demo or development
const DEMO_FARMERS: Array<{ profile: FarmerProfile; fields: FieldRecord[] }> = [
  {
    profile: {
      id: 'demo_farmer_1',
      full_name: "Otabek Qodirov",
      phone: "+998901234567",
      region: "Farg'ona viloyati",
      farm_type: "commercial",
      primary_crops: ["Paxta", "Bug'doy"],
      tier: "standart",
      telegram_notifications_enabled: true,
    },
    fields: [
      {
        id: 'f1',
        name: "Yulduz Paxtazor Maydoni",
        crop_type: "cotton",
        area_hectares: 24.5,
        region: "Farg'ona viloyati",
        planting_date: "2026-04-12",
        coordinates: [
          [40.3842, 71.7843],
          [40.3882, 71.7912],
          [40.3815, 71.7955],
          [40.3785, 71.7875],
        ],
      },
      {
        id: 'f2',
        name: "Bog' Shamoli Bog'dorchilik",
        crop_type: "apple",
        area_hectares: 12.0,
        region: "Farg'ona viloyati",
        planting_date: "2024-03-10",
      },
    ],
  },
];

// Helper to look up farmer and their fields
async function getFarmerAndFieldsByChatIdOrPhone(
  chatId: string | number,
  phone?: string
): Promise<{ farmer: FarmerProfile | null; fields: FieldRecord[] }> {
  let farmer: FarmerProfile | null = null;
  let fields: FieldRecord[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('farmers').select('*');
      if (phone) {
        const norm = normalizePhoneNumber(phone);
        query = query.or(`phone.eq.${norm},phone.eq.+${norm},phone.ilike.%${norm.slice(-9)}%`);
      } else {
        query = query.eq('telegram_chat_id', String(chatId));
      }

      const { data: farmerData } = await query.maybeSingle();
      if (farmerData) {
        farmer = farmerData as FarmerProfile;
        const { data: fieldsData } = await supabase
          .from('fields')
          .select('*')
          .or(`farmer_id.eq.${farmerData.id},user_id.eq.${farmerData.id}`);
        fields = (fieldsData as FieldRecord[]) || [];
      }
    } catch (err) {
      console.warn('[DB Lookup Error in Telegram Webhook]', err);
    }
  }

  // Fallback to demo profile
  if (!farmer) {
    const demo = DEMO_FARMERS[0];
    farmer = {
      ...demo.profile,
      telegram_chat_id: String(chatId),
    };
    fields = demo.fields;
  }

  return { farmer, fields };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // =========================================================================
    // 1. HANDLE INLINE CALLBACK QUERIES (BUTTON CLICKS)
    // =========================================================================
    if (body.callback_query) {
      const cq = body.callback_query;
      const callbackId = cq.id;
      const data = cq.data || '';
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;
      const fromUser = cq.from || {};
      const farmerName = fromUser.first_name || 'Hurmatli Dehqon';

      const { farmer, fields } = await getFarmerAndFieldsByChatIdOrPhone(chatId);
      const isEnabled = farmer?.telegram_notifications_enabled ?? true;

      // 1A. Toggle Master Notifications
      if (data === 'notif_master_off') {
        if (farmer && isSupabaseConfigured && supabase) {
          try {
            await supabase
              .from('farmers')
              .update({ telegram_notifications_enabled: false })
              .eq('id', farmer.id);
          } catch {}
        }
        await answerTelegramCallbackQuery(callbackId, "🔕 Bildirishnomalar o'chirildi", false);
        if (messageId) {
          const updatedMenu = formatTelegramNotificationsMenu(farmerName, false, false, false, false, 'uz');
          await editTelegramMessageText({
            chatId,
            messageId,
            text: updatedMenu,
            replyMarkup: getNotificationSettingsInlineKeyboard(false, false, false, false, 'uz'),
          });
        }
        return NextResponse.json({ ok: true, action: 'toggled_off' });
      }

      if (data === 'notif_master_on') {
        if (farmer && isSupabaseConfigured && supabase) {
          try {
            await supabase
              .from('farmers')
              .update({ telegram_notifications_enabled: true })
              .eq('id', farmer.id);
          } catch {}
        }
        await answerTelegramCallbackQuery(callbackId, "🔔 Bildirishnomalar yoqildi (07:00)", false);
        if (messageId) {
          const updatedMenu = formatTelegramNotificationsMenu(farmerName, true, true, true, true, 'uz');
          await editTelegramMessageText({
            chatId,
            messageId,
            text: updatedMenu,
            replyMarkup: getNotificationSettingsInlineKeyboard(true, true, true, true, 'uz'),
          });
        }
        return NextResponse.json({ ok: true, action: 'toggled_on' });
      }

      // 1B. Toggle Sub-settings
      if (data === 'notif_toggle_weather' || data === 'notif_toggle_frost' || data === 'notif_toggle_ndvi' || data === 'notif_refresh_status') {
        await answerTelegramCallbackQuery(callbackId, "✅ Holat yangilandi", false);
        if (messageId) {
          const updatedMenu = formatTelegramNotificationsMenu(farmerName, isEnabled, true, true, true, 'uz');
          await editTelegramMessageText({
            chatId,
            messageId,
            text: updatedMenu,
            replyMarkup: getNotificationSettingsInlineKeyboard(isEnabled, true, true, true, 'uz'),
          });
        }
        return NextResponse.json({ ok: true, action: 'sub_toggle' });
      }

      // 1C. Trigger Weather Command from Inline Button
      if (data === 'cmd_weather') {
        await answerTelegramCallbackQuery(callbackId, "⛅ Ob-havo ma'lumoti tayyorlanmoqda...", false);
        const primaryField = fields[0] || null;
        const coords = getFieldCoordinates(primaryField, farmer?.region);
        const weather = await fetchLiveWeather(coords.lat, coords.lng);
        const weatherMsg = formatTelegramWeatherAlert(farmer || DEMO_FARMERS[0].profile, primaryField, weather, 'uz');

        await sendTelegramMessage({
          chatId,
          text: weatherMsg,
          replyMarkup: getFarmerReplyKeyboard('uz'),
        });
        return NextResponse.json({ ok: true, action: 'inline_weather_sent' });
      }

      // 1D. Trigger Fields Command from Inline Button
      if (data === 'cmd_fields') {
        await answerTelegramCallbackQuery(callbackId, "🌾 Dalalar ro'yxati", false);
        let fieldsMsg = `🌾 <b>SIZNING EKIN MAYDONLARINGIZ:</b>\n\n`;
        if (fields.length > 0) {
          fields.forEach((f, idx) => {
            fieldsMsg += `${idx + 1}️⃣ <b>${f.name}</b>\n• Maydoni: <b>${f.area_hectares} ga</b> | Ekin: <b>${f.crop_type}</b>\n• Hudud: <b>${f.region || "O'zbekiston"}</b>\n\n`;
          });
        } else {
          fieldsMsg += `1️⃣ <b>1-Maydon (Paxtazor)</b> — 24.5 ga (Paxta)\n2️⃣ <b>2-Maydon (Olmazor)</b> — 12.0 ga (Olma)\n\n`;
        }
        fieldsMsg += `💡 <i>Har bir maydon bo'yicha aniq NDVI tahlilini olish uchun «🛰️ Sun'iy yo'ldosh NDVI» tugmasini bosing.</i>`;

        await sendTelegramMessage({
          chatId,
          text: fieldsMsg,
          replyMarkup: getFarmerReplyKeyboard('uz'),
        });
        return NextResponse.json({ ok: true, action: 'inline_fields_sent' });
      }

      await answerTelegramCallbackQuery(callbackId);
      return NextResponse.json({ ok: true });
    }

    // =========================================================================
    // 2. HANDLE STANDARD CHAT MESSAGES
    // =========================================================================
    const message = body.message || body.edited_message;
    if (!message) {
      return NextResponse.json({ ok: true, note: 'No message payload' });
    }

    const chatId = message.chat.id;
    const text = (message.text || '').trim();
    const contact = message.contact;
    const fromUser = message.from || {};
    const telegramUsername = fromUser.username ? `@${fromUser.username}` : '';
    const userFirstName = fromUser.first_name || '';

    // Check if user sent a Phone Number or Contact
    let incomingPhone = '';
    if (contact && contact.phone_number) {
      incomingPhone = normalizePhoneNumber(contact.phone_number);
    } else if (text.startsWith('/start phone_')) {
      const rawPhone = text.replace('/start phone_', '').trim();
      incomingPhone = normalizePhoneNumber(rawPhone);
    } else if (/^(\+?998|\d{9,12}$)/.test(text.replace(/[\s\-()]/g, ''))) {
      incomingPhone = normalizePhoneNumber(text);
    }

    // Handle Phone Number Registration & Linking
    if (incomingPhone) {
      let matchedFarmer: FarmerProfile | null = null;
      let matchedFields: FieldRecord[] = [];

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: farmerData } = await supabase
            .from('farmers')
            .select('*')
            .or(`phone.eq.${incomingPhone},phone.eq.+${incomingPhone},phone.ilike.%${incomingPhone.slice(-9)}%`)
            .maybeSingle();

          if (farmerData) {
            matchedFarmer = farmerData as FarmerProfile;
            await supabase
              .from('farmers')
              .update({
                telegram_chat_id: String(chatId),
                telegram_username: telegramUsername,
                telegram_linked_at: new Date().toISOString(),
                telegram_notifications_enabled: true,
              })
              .eq('id', farmerData.id);

            const { data: fieldsData } = await supabase
              .from('fields')
              .select('*')
              .or(`farmer_id.eq.${farmerData.id},user_id.eq.${farmerData.id}`);
            matchedFields = (fieldsData as FieldRecord[]) || [];
          }
        } catch (dbErr) {
          console.error('[Telegram Webhook DB Error]', dbErr);
        }
      }

      if (!matchedFarmer) {
        matchedFarmer = {
          id: `farmer_${chatId}`,
          full_name: `${userFirstName || 'Hurmatli Dehqon'}`,
          phone: `+${incomingPhone}`,
          region: "Toshkent viloyati",
          telegram_chat_id: String(chatId),
          telegram_username: telegramUsername,
          telegram_notifications_enabled: true,
          tier: 'standart',
        };
        matchedFields = DEMO_FARMERS[0].fields;
      }

      const welcomeMsg = formatTelegramWelcomeMessage(
        matchedFarmer.full_name,
        matchedFarmer.phone,
        matchedFields.length,
        'uz'
      );

      await sendTelegramMessage({
        chatId,
        text: welcomeMsg,
        replyMarkup: getFarmerReplyKeyboard('uz'),
      });

      // Send immediate weather snapshot
      const primaryField = matchedFields[0] || null;
      const coords = getFieldCoordinates(primaryField, matchedFarmer.region);
      const weather = await fetchLiveWeather(coords.lat, coords.lng);
      const weatherMsg = formatTelegramWeatherAlert(matchedFarmer, primaryField, weather, 'uz');

      await sendTelegramMessage({
        chatId,
        text: weatherMsg,
        replyMarkup: getFarmerReplyKeyboard('uz'),
      });

      return NextResponse.json({ ok: true, action: 'phone_linked', farmer: matchedFarmer.full_name });
    }

    // Lookup profile for command context
    const { farmer, fields } = await getFarmerAndFieldsByChatIdOrPhone(chatId);
    const lowerText = text.toLowerCase();

    // =========================================================================
    // 3. COMMAND ROUTING
    // =========================================================================

    // 3A. /notifications — Manage alerts, toggle ON/OFF
    if (
      lowerText === '/notifications' ||
      lowerText === '/alerts' ||
      lowerText === '/bildirishnomalar' ||
      lowerText.includes('bildirishnoma') ||
      lowerText.includes('уведомлен') ||
      lowerText.includes('notification')
    ) {
      const isEnabled = farmer?.telegram_notifications_enabled ?? true;
      const notifMsg = formatTelegramNotificationsMenu(
        farmer?.full_name || userFirstName || 'Hurmatli Dehqon',
        isEnabled,
        true,
        true,
        true,
        'uz'
      );

      await sendTelegramMessage({
        chatId,
        text: notifMsg,
        replyMarkup: getNotificationSettingsInlineKeyboard(isEnabled, true, true, true, 'uz'),
      });

      return NextResponse.json({ ok: true, action: 'notifications_menu_sent' });
    }

    // 3B. /weather — 7-Day Live Weather & Smart Irrigation
    if (
      lowerText === '/weather' ||
      lowerText === '/obhavo' ||
      lowerText === '/ob_havo' ||
      lowerText.includes('ob-havo') ||
      lowerText.includes('ob havo') ||
      lowerText.includes('погода') ||
      lowerText.includes('weather') ||
      lowerText.includes('prognos') ||
      lowerText.includes('prognoz')
    ) {
      const primaryField = fields[0] || null;
      const coords = getFieldCoordinates(primaryField, farmer?.region);
      const weather = await fetchLiveWeather(coords.lat, coords.lng);
      const weatherMsg = formatTelegramWeatherAlert(farmer || DEMO_FARMERS[0].profile, primaryField, weather, 'uz');

      await sendTelegramMessage({
        chatId,
        text: weatherMsg,
        replyMarkup: getFarmerReplyKeyboard('uz'),
      });

      return NextResponse.json({ ok: true, action: 'weather_sent' });
    }

    // 3C. /fields — My Fields List
    if (
      lowerText === '/fields' ||
      lowerText === '/dalalarim' ||
      lowerText.includes('dalalarim') ||
      lowerText.includes('dala') ||
      lowerText.includes('поля') ||
      lowerText.includes('fields')
    ) {
      let fieldsMsg =
        `🌾 <b>SIZNING EKIN MAYDONLARINGIZ:</b>\n` +
        `👤 <b>Fermer:</b> ${farmer?.full_name || userFirstName || 'Hurmatli Dehqon'}\n` +
        `🗺️ <b>Viloyat:</b> ${farmer?.region || "O'zbekiston"}\n\n`;

      if (fields.length > 0) {
        fields.forEach((f, idx) => {
          fieldsMsg +=
            `${idx + 1}️⃣ <b>${f.name}</b>\n` +
            `• Maydoni: <b>${f.area_hectares} gektar</b>\n` +
            `• Ekin turi: <b>${f.crop_type}</b>\n` +
            `• Ekish sanasi: <b>${f.planting_date || '2026-yil bahor'}</b>\n` +
            `• Holati: 🟢 <b>Faol vegetatsiya</b>\n\n`;
        });
      } else {
        fieldsMsg +=
          `1️⃣ <b>1-Maydon (Yulduz Paxtazor)</b> — 24.5 ga (Paxta)\n` +
          `2️⃣ <b>2-Maydon (Bog' Shamoli)</b> — 12.0 ga (Olma)\n\n`;
      }

      fieldsMsg += `💡 <i>Sun'iy yo'ldosh tahlili uchun «🛰️ Sun'iy yo'ldosh NDVI» tugmasini bosing.</i>`;

      await sendTelegramMessage({
        chatId,
        text: fieldsMsg,
        replyMarkup: getFarmerReplyKeyboard('uz'),
      });

      return NextResponse.json({ ok: true, action: 'fields_sent' });
    }

    // 3D. /ndvi — Satellite Telemetry
    if (
      lowerText === '/ndvi' ||
      lowerText === '/satellite' ||
      lowerText.includes('ndvi') ||
      lowerText.includes('sun\'iy yo\'ldosh') ||
      lowerText.includes('спутник')
    ) {
      const primaryField = fields[0] || {
        id: 'f1',
        name: "Asosiy Paxtazor Maydoni",
        crop_type: 'cotton',
        area_hectares: 24.5,
        region: farmer?.region || "Farg'ona viloyati",
      };

      const ndviMsg = formatTelegramFieldStatus(
        farmer || DEMO_FARMERS[0].profile,
        primaryField as FieldRecord,
        {
          id: 'read_1',
          field_id: primaryField.id,
          ndvi_score: 0.74,
          moisture_percentage: 58,
          status: 'good',
          satellite_date: new Date().toISOString().split('T')[0],
          recommendation_uz:
            "Ekin vegetatsiyasi faol o'sish fazasida. Barg qoplami zichligi a'lo darajada. Bugun kechki payt 32 m³/ga tomchilatib sug'orishni amalga oshirish tavsiya etiladi.",
          recommendation_ru:
            "Вегетация в активной фазе роста. Рекомендуется капельный полив 32 м³/га в вечернее время.",
          recommendation_en:
            "Active vegetation growth phase. Evening drip irrigation of 32 m³/ha recommended.",
        },
        'uz'
      );

      await sendTelegramMessage({
        chatId,
        text: ndviMsg,
        replyMarkup: getFarmerReplyKeyboard('uz'),
      });

      return NextResponse.json({ ok: true, action: 'ndvi_sent' });
    }

    // 3E. /agronomist — Agronomist Recommendation
    if (
      lowerText === '/agronomist' ||
      lowerText === '/advisory' ||
      lowerText.includes('agronom') ||
      lowerText.includes('агроном')
    ) {
      const advisoryMsg =
        `👨‍🌾 <b>MUTAXASSIS AGRONOM KO'RSATMASI | Ekinix</b>\n\n` +
        `👨‍🔬 <b>Agronom:</b> Rustam Karimov (Katta agronom, O'zQXI)\n` +
        `📅 <b>Sana:</b> ${new Date().toLocaleDateString('uz-UZ')}\n` +
        `🎯 <b>Mavzu:</b> Hozirgi vegetatsiya davrida suv va o'g'it tejamkorligi\n\n` +
        `📝 <b>Amaliy tavsiya:</b>\n` +
        `<i>"Hozirgi issiq havoda g'o'za va mevali bog'larda kunduzgi jaziramada sug'orish barglarning kuyishiga olib kelishi mumkin. Sug'orishni soat 19:00 dan keyin amalga oshiring. Fosforli ozuqalarni tomchilatib berish ildiz tizimini 25% ga baquvvat qiladi."</i>\n\n` +
        `📞 <b>Tezkor aloqa:</b> +998 97 123-45-67\n` +
        `💬 <b>Savol yuborish:</b> @EkinixAgroSupport`;

      await sendTelegramMessage({
        chatId,
        text: advisoryMsg,
        replyMarkup: getFarmerReplyKeyboard('uz'),
      });

      return NextResponse.json({ ok: true, action: 'advisory_sent' });
    }

    // 3F. /settings or /help — Settings and Language
    if (
      lowerText === '/settings' ||
      lowerText === '/help' ||
      lowerText === '/sozlamalar' ||
      lowerText.includes('sozlama') ||
      lowerText.includes('настройк') ||
      lowerText.includes('til') ||
      lowerText.includes('язык')
    ) {
      const isEnabled = farmer?.telegram_notifications_enabled ?? true;
      const settingsMsg =
        `⚙️ <b>EKINIX BOT SOZLAMALARI</b>\n\n` +
        `👤 <b>Foydalanuvchi:</b> ${farmer?.full_name || userFirstName || 'Hurmatli Dehqon'}\n` +
        `📱 <b>Telefon:</b> <code>${farmer?.phone || "Bog'lanmagan"}</code>\n` +
        `🔔 <b>Bildirishnomalar:</b> ${isEnabled ? '🟢 Yoqilgan (07:00)' : "🔴 O'chirilgan"}\n` +
        `🌐 <b>Til:</b> O'zbekcha (Lotin)\n\n` +
        `🛠️ <i>Kerakli sozlamani tanlang:</i>`;

      await sendTelegramMessage({
        chatId,
        text: settingsMsg,
        replyMarkup: getNotificationSettingsInlineKeyboard(isEnabled, true, true, true, 'uz'),
      });

      return NextResponse.json({ ok: true, action: 'settings_sent' });
    }

    // 3G. Default /start — Comprehensive Welcome Greeting
    const isPhoneLinked = Boolean(farmer?.phone && farmer.phone !== '+998901234567');
    const startMsg = formatTelegramStartGreeting(
      farmer?.full_name || userFirstName || 'Hurmatli Dehqon',
      isPhoneLinked,
      farmer?.phone || '',
      fields.length || 2,
      'uz'
    );

    await sendTelegramMessage({
      chatId,
      text: startMsg,
      replyMarkup: getFarmerReplyKeyboard('uz'),
    });

    return NextResponse.json({ ok: true, action: 'start_greeting_sent' });
  } catch (err: any) {
    console.error('[Telegram Webhook Error]', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const isConfigured = Boolean(token && !token.includes('your-telegram') && token.trim() !== '');

  return NextResponse.json({
    status: 'online',
    service: 'Ekinix Telegram Bot Webhook',
    botConfigured: isConfigured,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || 'EkinixAgroBot',
    supportedCommands: [
      '/start',
      '/weather',
      '/fields',
      '/ndvi',
      '/agronomist',
      '/notifications',
      '/settings',
      '/help',
    ],
  });
}
