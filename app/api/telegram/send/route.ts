import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLiveWeather,
  formatTelegramWeatherAlert,
  formatTelegramFieldStatus,
  sendTelegramMessage,
  getFieldCoordinates,
  normalizePhoneNumber,
} from '@/lib/telegramBot';
import { supabase, isSupabaseConfigured, FarmerProfile, FieldRecord } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      farmerProfile,
      field,
      notificationType = 'weather', // 'weather' | 'ndvi' | 'frost' | 'advisory' | 'custom'
      customMessage,
      chatId,
      lang = 'uz',
    } = body;

    const phone = farmerProfile?.phone || '+998901234567';
    const cleanPhone = normalizePhoneNumber(phone);
    const targetChatId = chatId || farmerProfile?.telegram_chat_id || 'demo_chat_123';

    // 1. Fetch live Open-Meteo weather
    const coords = getFieldCoordinates(field, farmerProfile?.region || 'Toshkent viloyati');
    const weather = await fetchLiveWeather(coords.lat, coords.lng);

    // 2. Prepare message based on notification type
    let messageText = '';
    const farmer: FarmerProfile = farmerProfile || {
      id: 'farmer_demo',
      full_name: "Otabek Qodirov",
      phone: "+998901234567",
      region: "Farg'ona viloyati",
    };

    const targetField: FieldRecord = field || {
      id: 'f1',
      name: "1-Maydon (Paxtazor)",
      crop_type: "cotton",
      area_hectares: 24.5,
      region: farmer.region || "Farg'ona viloyati",
      planting_date: "2026-04-12",
    };

    if (notificationType === 'weather') {
      messageText = formatTelegramWeatherAlert(farmer, targetField, weather, lang);
    } else if (notificationType === 'ndvi') {
      messageText = formatTelegramFieldStatus(
        farmer,
        targetField,
        {
          id: 'read_1',
          field_id: targetField.id,
          ndvi_score: 0.74,
          moisture_percentage: 58,
          status: 'good',
          satellite_date: new Date().toISOString().split('T')[0],
          recommendation_uz:
            "Vegetatsiya holati faol o'sish fazasida. Havo harorati ko'tarilishi sababli kechki payt 32 m³/ga tomchilatib sug'orish tavsiya qilinadi.",
          recommendation_ru:
            "Вегетация в активной фазе роста. Рекомендуется полив 32 м³/га в вечернее время.",
          recommendation_en:
            "Vegetation in active growth stage. Evening drip irrigation of 32 m³/ha recommended.",
        },
        lang
      );
    } else if (notificationType === 'frost') {
      messageText =
        lang === 'ru'
          ? `❄️ <b>ЭКСТРЕННОЕ ПРЕДУПРЕЖДЕНИЕ О ЗАМОРОЗКАХ | Ekinix</b>\n\n` +
            `📍 <b>Поле:</b> ${targetField.name} (${targetField.crop_type})\n` +
            `🌡️ <b>Ожидаемая ночная температура:</b> -1°C ... +2°C\n` +
            `🛡️ <b>Рекомендованные меры:</b> Проведите дымление или легкий полив для защиты корневой системы и молодых побегов.`
          : lang === 'en'
          ? `❄️ <b>EMERGENCY FROST ALERT | Ekinix</b>\n\n` +
            `📍 <b>Field:</b> ${targetField.name} (${targetField.crop_type})\n` +
            `🌡️ <b>Expected Night Temp:</b> -1°C ... +2°C\n` +
            `🛡️ <b>Action Needed:</b> Apply protective smoke screens or light water spray to insulate sensitive crop shoots.`
          : `❄️ <b>FAVQULODDA SOVUQ URISH XAVFI | Ekinix</b>\n\n` +
            `📍 <b>Dala:</b> ${targetField.name} (${targetField.crop_type})\n` +
            `🌡️ <b>Kutilayotgan tungi harorat:</b> -1°C ... +2°C\n` +
            `🛡️ <b>Tavsiya etilgan chora:</b> Nihollarni sovuq urishidan saqlash uchun tutatish yoki kechki engil sug'orishni amalga oshiring.`;
    } else if (notificationType === 'custom' && customMessage) {
      messageText = customMessage;
    } else {
      messageText = formatTelegramWeatherAlert(farmer, targetField, weather, lang);
    }

    // 3. Send message via Telegram Bot API
    const result = await sendTelegramMessage({
      chatId: targetChatId,
      text: messageText,
      parseMode: 'HTML',
    });

    // 4. Record event in Supabase if configured
    if (isSupabaseConfigured && supabase && farmer.id) {
      try {
        await supabase.from('notifications_log').insert({
          farmer_id: farmer.id,
          phone: cleanPhone,
          chat_id: String(targetChatId),
          type: notificationType,
          status: result.success ? 'sent' : 'failed',
          payload: { message: messageText },
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        // non-blocking
      }
    }

    return NextResponse.json({
      ok: true,
      success: result.success,
      simulated: result.simulated ?? false,
      messageId: result.messageId,
      error: result.error,
      formattedMessage: messageText,
      weatherSummary: weather,
    });
  } catch (err: any) {
    console.error('[Telegram Send API Error]', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
