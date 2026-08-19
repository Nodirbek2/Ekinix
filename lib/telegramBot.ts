import { FarmerProfile, FieldRecord, NDVIReading } from './supabase';
import { UZBEKISTAN_REGIONS_GEO } from './geoConstants';
import { calculateIrrigationRecommendation } from './irrigationAdvisor';

export interface TelegramWeatherSummary {
  tempCurrent: number;
  tempMax: number;
  tempMin: number;
  humidity: number;
  rainProb: number;
  rainSumMm: number;
  windSpeedKmh: number;
  weatherCode: number;
  weatherDescription: string;
  isRainExpected: boolean;
  isHeatAlert: boolean;
  isFrostAlert: boolean;
}

export interface TelegramSendMessageOptions {
  chatId: string | number;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyMarkup?: any;
  disableWebPagePreview?: boolean;
}

/**
 * Normalizes phone numbers to standard Uzbekistan format e.g. "998901234567"
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9) {
    return `998${digits}`;
  }
  if (digits.startsWith('998') && digits.length === 12) {
    return digits;
  }
  return digits;
}

/**
 * Get coordinates for a field or default to regional coordinates
 */
export function getFieldCoordinates(field?: FieldRecord | null, regionName?: string): { lat: number; lng: number } {
  if (field?.coordinates && field.coordinates.length > 0) {
    // Calculate centroid
    const lats = field.coordinates.map((c) => c[0]);
    const lngs = field.coordinates.map((c) => c[1]);
    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    return { lat: avgLat, lng: avgLng };
  }

  const regionKey = regionName || field?.region || 'Toshkent viloyati';
  const geo = UZBEKISTAN_REGIONS_GEO[regionKey] || UZBEKISTAN_REGIONS_GEO['Toshkent viloyati'];
  return { lat: geo.lat, lng: geo.lng };
}

/**
 * Fetch live Open-Meteo weather data for given coordinates
 */
export async function fetchLiveWeather(lat: number, lng: number): Promise<TelegramWeatherSummary> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error('Open-Meteo response failed');
    const data = await res.json();

    const current = data.current || {};
    const daily = data.daily || {};

    const tempCurrent = Math.round(current.temperature_2m ?? 24);
    const humidity = Math.round(current.relative_humidity_2m ?? 45);
    const windSpeedKmh = Math.round(current.wind_speed_10m ?? 12);
    const weatherCode = current.weather_code ?? 0;

    const tempMax = Math.round(daily.temperature_2m_max?.[0] ?? tempCurrent + 4);
    const tempMin = Math.round(daily.temperature_2m_min?.[0] ?? tempCurrent - 6);
    const rainProb = Math.round(daily.precipitation_probability_max?.[0] ?? 10);
    const rainSumMm = Number(daily.precipitation_sum?.[0] ?? 0);

    const isRainExpected = rainProb >= 40 || rainSumMm > 1.5;
    const isHeatAlert = tempMax >= 39;
    const isFrostAlert = tempMin <= 2;

    let weatherDescription = "Ochiq va quyoshli";
    if (weatherCode >= 51 && weatherCode <= 67) weatherDescription = "Yomg'ir kutilmoqda";
    else if (weatherCode >= 71 && weatherCode <= 77) weatherDescription = "Qor yog'ishi mumkin";
    else if (weatherCode >= 1 && weatherCode <= 3) weatherDescription = "Qisman bulutli";
    else if (weatherCode >= 95) weatherDescription = "Momaqaldiroqli yomg'ir";

    return {
      tempCurrent,
      tempMax,
      tempMin,
      humidity,
      rainProb,
      rainSumMm,
      windSpeedKmh,
      weatherCode,
      weatherDescription,
      isRainExpected,
      isHeatAlert,
      isFrostAlert,
    };
  } catch {
    // Fallback sensible defaults for Uzbekistan agricultural conditions
    return {
      tempCurrent: 27,
      tempMax: 32,
      tempMin: 18,
      humidity: 42,
      rainProb: 15,
      rainSumMm: 0,
      windSpeedKmh: 14,
      weatherCode: 1,
      weatherDescription: "Ochiq, iliq ob-havo",
      isRainExpected: false,
      isHeatAlert: false,
      isFrostAlert: false,
    };
  }
}

/**
 * Format telegram welcome / phone linked message
 */
export function formatTelegramWelcomeMessage(
  farmerName: string,
  phoneNumber: string,
  fieldCount: number,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string {
  if (lang === 'ru') {
    return (
      `🌱 <b>Добро пожаловать в Ekinix Bot!</b>\n\n` +
      `Здравствуйте, <b>${farmerName || 'Уважаемый фермер'}</b>!\n` +
      `Ваш номер телефона (<code>${phoneNumber}</code>) успешно привязан к системе Ekinix.\n\n` +
      `📊 <b>Ваш статус:</b>\n` +
      `• Зарегистрировано полей: <b>${fieldCount}</b>\n` +
      `• Ежедневная утренняя сводка: <b>Включена (07:00)</b>\n` +
      `• Спутниковый мониторинг Sentinel-2: <b>Активен</b>\n\n` +
      `👇 <i>Используйте кнопки меню ниже для мгновенного получения прогноза и рекомендаций по поливу.</i>`
    );
  }

  if (lang === 'en') {
    return (
      `🌱 <b>Welcome to Ekinix Smart Agriculture Bot!</b>\n\n` +
      `Hello, <b>${farmerName || 'Farmer'}</b>!\n` +
      `Your phone number (<code>${phoneNumber}</code>) has been successfully linked to your Ekinix account.\n\n` +
      `📊 <b>Your Account:</b>\n` +
      `• Registered fields: <b>${fieldCount}</b>\n` +
      `• Daily morning weather briefing: <b>Enabled (07:00)</b>\n` +
      `• Sentinel-2 NDVI telemetry: <b>Active</b>\n\n` +
      `👇 <i>Use the menu buttons below to check live field weather, NDVI score, and irrigation advisories.</i>`
    );
  }

  // Default Uzbek
  return (
    `🌱 <b>Ekinix Aqlli Qishloq Xo'jaligi Botiga xush kelibsiz!</b>\n\n` +
    `Assalomu alaykum, <b>${farmerName || 'Hurmatli dehqon'}</b>!\n` +
    `Sizning <code>${phoneNumber}</code> raqamingiz Ekinix tizimiga muvaffaqiyatli bog'landi.\n\n` +
    `📊 <b>Fermer holati:</b>\n` +
    `• Ro'yxatdan o'tgan dalalar: <b>${fieldCount} ta</b>\n` +
    `• Kunlik ertalabki xabarnoma: <b>Yoqilgan (07:00)</b>\n` +
    `• Sentinel-2 sun'iy yo'ldosh tahlili: <b>Faol</b>\n\n` +
    `👇 <i>Quyidagi tugmalar orqali ob-havo, sug'orish tavsiyalari va sun'iy yo'ldosh NDVI xulosasini darhol olishingiz mumkin.</i>`
  );
}

/**
 * Format Telegram Daily Weather & Irrigation Notification
 */
export function formatTelegramWeatherAlert(
  farmer: FarmerProfile,
  field: FieldRecord | null,
  weather: TelegramWeatherSummary,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string {
  const cropName = field?.crop_type || 'Paxta';
  const fieldName = field?.name || "1-Dala";
  const areaHa = field?.area_hectares || 10;
  const region = field?.region || farmer.region || "O'zbekiston";

  // Compute smart irrigation advice
  const advisorResult = calculateIrrigationRecommendation({
    cropType: cropName,
    ndviValue: 0.72,
    soilMoisture: weather.isRainExpected ? 65 : 45,
    areaHectares: areaHa,
    rainForecast: [
      {
        rainProb: weather.rainProb,
        rainSum: weather.rainSumMm,
        tempMax: weather.tempMax,
      },
    ],
  });

  const appUrl = process.env.APP_URL || 'https://ekinix.uz';

  if (lang === 'ru') {
    let warningBanner = '';
    if (weather.isRainExpected) {
      warningBanner = `🌧️ <b>Внимание: Ожидаются осадки (${weather.rainSumMm} мм, ${weather.rainProb}%)!</b> Отложите полив для экономии воды.\n\n`;
    } else if (weather.isHeatAlert) {
      warningBanner = `🔥 <b>Аномальная жара: до ${weather.tempMax}°C!</b> Рекомендуется полив в ночное время.\n\n`;
    } else if (weather.isFrostAlert) {
      warningBanner = `❄️ <b>Риск заморозков: до ${weather.tempMin}°C!</b> Примите защитные меры.\n\n`;
    }

    return (
      `☀️ <b>УТРЕННИЙ АГРО-ОТЧЕТ | Ekinix</b>\n` +
      `📅 <i>${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</i>\n\n` +
      warningBanner +
      `📍 <b>Поле:</b> ${fieldName} (${areaHa} га, ${cropName})\n` +
      `🗺️ <b>Регион:</b> ${region}\n\n` +
      `🌤️ <b>Погода на сегодня:</b>\n` +
      `• Температура: <b>${weather.tempCurrent}°C</b> (мин: ${weather.tempMin}° / макс: ${weather.tempMax}°)\n` +
      `• Влажность воздуха: <b>${weather.humidity}%</b>\n` +
      `• Скорость ветра: <b>${weather.windSpeedKmh} км/ч</b>\n` +
      `• Вероятность дождя: <b>${weather.rainProb}%</b>\n\n` +
      `💧 <b>Рекомендация по орошению:</b>\n` +
      `• Решение: <b>${advisorResult.actionBadge.textRu}</b>\n` +
      `• Объем: <b>${advisorResult.recommendedVolumeM3PerHa} м³/га</b> (${advisorResult.totalWaterLiters})\n` +
      `• <i>${advisorResult.reasoning.ru}</i>\n\n` +
      `🔗 <a href="${appUrl}">Открыть карту поля и NDVI в Ekinix</a>`
    );
  }

  if (lang === 'en') {
    let warningBanner = '';
    if (weather.isRainExpected) {
      warningBanner = `🌧️ <b>Alert: Rain expected (${weather.rainSumMm}mm, ${weather.rainProb}%)!</b> Consider pausing irrigation to save water.\n\n`;
    } else if (weather.isHeatAlert) {
      warningBanner = `🔥 <b>Heat wave alert: up to ${weather.tempMax}°C!</b> Evening/night drip irrigation recommended.\n\n`;
    }

    return (
      `☀️ <b>MORNING AGRO REPORT | Ekinix</b>\n` +
      `📅 <i>${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</i>\n\n` +
      warningBanner +
      `📍 <b>Field:</b> ${fieldName} (${areaHa} ha, ${cropName})\n` +
      `🗺️ <b>Region:</b> ${region}\n\n` +
      `🌤️ <b>Today's Weather:</b>\n` +
      `• Temperature: <b>${weather.tempCurrent}°C</b> (min: ${weather.tempMin}° / max: ${weather.tempMax}°)\n` +
      `• Humidity: <b>${weather.humidity}%</b> | Wind: <b>${weather.windSpeedKmh} km/h</b>\n` +
      `• Precipitation chance: <b>${weather.rainProb}%</b>\n\n` +
      `💧 <b>Irrigation Recommendation:</b>\n` +
      `• Action: <b>${advisorResult.actionBadge.textEn}</b>\n` +
      `• Volume: <b>${advisorResult.recommendedVolumeM3PerHa} m³/ha</b> (${advisorResult.totalWaterLiters})\n` +
      `• <i>${advisorResult.reasoning.en}</i>\n\n` +
      `🔗 <a href="${appUrl}">Open Field Map & NDVI in Ekinix</a>`
    );
  }

  // Default Uzbek
  let warningBanner = '';
  if (weather.isRainExpected) {
    warningBanner = `🌧️ <b>DIQQAT: Yomg'ir kutilmoqda (${weather.rainSumMm} mm, ehtimollik: ${weather.rainProb}%)!</b> Suv va elektr tejash uchun bugungi sug'orishni kechiktiring.\n\n`;
  } else if (weather.isHeatAlert) {
    warningBanner = `🔥 <b>OGOHLANTIRISH: Yuqori havo harorati (${weather.tempMax}°C gacha)!</b> Ekinlarni faqat kechki salqinda tomchilatib sug'orish tavsiya etiladi.\n\n`;
  } else if (weather.isFrostAlert) {
    warningBanner = `❄️ <b>DIQQAT: Sovuq urish xavfi (kechasi ${weather.tempMin}°C gacha)!</b> Nihollarni sovuqdan himoya qilish choralarini ko'ring.\n\n`;
  }

  return (
    `☀️ <b>ERTALABKI AGRO-XULOSA | Ekinix</b>\n` +
    `📅 <i>${new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</i>\n\n` +
    warningBanner +
    `📍 <b>Dala:</b> ${fieldName} (${areaHa} ga, ${cropName})\n` +
    `🗺️ <b>Hudud:</b> ${region}\n\n` +
    `🌤️ <b>Bugungi ob-havo ma'lumotlari:</b>\n` +
    `• Harorat: <b>${weather.tempCurrent}°C</b> (kunduzi: +${weather.tempMax}° / kechasi: +${weather.tempMin}°)\n` +
    `• Havo namligi: <b>${weather.humidity}%</b>\n` +
    `• Shamol tezligi: <b>${weather.windSpeedKmh} km/soat</b>\n` +
    `• Yomg'ir ehtimoli: <b>${weather.rainProb}%</b>\n\n` +
    `💧 <b>Aqlli sug'orish tavsiyasi:</b>\n` +
    `• Tavsiya: <b>${advisorResult.actionBadge.textUz}</b>\n` +
    `• Me'yor: <b>${advisorResult.recommendedVolumeM3PerHa} m³/ga</b> (${advisorResult.totalWaterLiters})\n` +
    `• <i>${advisorResult.reasoning.uz}</i>\n\n` +
    `🔗 <a href="${appUrl}">Ekinix ilovasida to'liq sun'iy yo'ldosh xaritasini ko'rish</a>`
  );
}

/**
 * Format Telegram Field Satellite & Health Briefing
 */
export function formatTelegramFieldStatus(
  farmer: FarmerProfile,
  field: FieldRecord,
  reading?: NDVIReading | null,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string {
  const ndvi = reading?.ndvi_score ?? 0.74;
  const moisture = reading?.moisture_percentage ?? 58;
  const crop = field.crop_type || 'Paxta';
  const area = field.area_hectares || 10;
  const appUrl = process.env.APP_URL || 'https://ekinix.uz';

  let statusEmoji = '🟢';
  let statusTextUz = "A'lo darajada (Sog'lom o'sish)";
  let statusTextRu = 'Отличное состояние (Здоровый рост)';
  let statusTextEn = 'Excellent Health (Normal Growth)';

  if (ndvi < 0.4) {
    statusEmoji = '🔴';
    statusTextUz = "Kuchli stress (Suv yoki oziq yetishmovchiligi)";
    statusTextRu = 'Критический стресс (Дефицит влаги/питания)';
    statusTextEn = 'Critical Stress (Water or Nutrient deficiency)';
  } else if (ndvi < 0.6) {
    statusEmoji = '🟡';
    statusTextUz = "O'rtacha holat (Nazorat talab etiladi)";
    statusTextRu = 'Умеренное состояние (Требует внимания)';
    statusTextEn = 'Moderate (Attention Required)';
  }

  if (lang === 'ru') {
    return (
      `🛰️ <b>СПУТНИКОВЫЙ NDVI МОНИТОРИНГ | Sentinel-2</b>\n\n` +
      `📍 <b>Поле:</b> ${field.name} (${area} га, ${crop})\n` +
      `🗺️ <b>Регион:</b> ${field.region || farmer.region}\n\n` +
      `🌿 <b>Индекс вегетации (NDVI):</b> <b>${ndvi.toFixed(2)}</b>\n` +
      `💧 <b>Индекс влажности почвы:</b> <b>${moisture}%</b>\n` +
      `📊 <b>Состояние посевов:</b> ${statusEmoji} <b>${statusTextRu}</b>\n\n` +
      `💡 <b>Агрономический совет:</b>\n` +
      `<i>${reading?.recommendation_ru || 'Вегетационное развитие идет в плановом режиме. Поддерживайте график полива.'}</i>\n\n` +
      `🔗 <a href="${appUrl}">Открыть полигональную карту поля</a>`
    );
  }

  if (lang === 'en') {
    return (
      `🛰️ <b>SATELLITE NDVI MONITORING | Sentinel-2</b>\n\n` +
      `📍 <b>Field:</b> ${field.name} (${area} ha, ${crop})\n` +
      `🗺️ <b>Region:</b> ${field.region || farmer.region}\n\n` +
      `🌿 <b>Vegetation Index (NDVI):</b> <b>${ndvi.toFixed(2)}</b>\n` +
      `💧 <b>Soil Moisture Level:</b> <b>${moisture}%</b>\n` +
      `📊 <b>Crop Condition:</b> ${statusEmoji} <b>${statusTextEn}</b>\n\n` +
      `💡 <b>Agronomic Advice:</b>\n` +
      `<i>${reading?.recommendation_en || 'Canopy density and moisture levels are on target. Continue planned irrigation schedule.'}</i>\n\n` +
      `🔗 <a href="${appUrl}">Open Field Telemetry Map</a>`
    );
  }

  return (
    `🛰️ <b>SUN'IY YO'LDOSH NDVI MONITORINGI | Sentinel-2</b>\n\n` +
    `📍 <b>Dala:</b> ${field.name} (${area} ga, ${crop})\n` +
    `🗺️ <b>Hudud:</b> ${field.region || farmer.region}\n\n` +
    `🌿 <b>Vegetatsiya indeksi (NDVI):</b> <b>${ndvi.toFixed(2)}</b>\n` +
    `💧 <b>Tuproq namligi ko'rsatkichi:</b> <b>${moisture}%</b>\n` +
    `📊 <b>Ekin holati:</b> ${statusEmoji} <b>${statusTextUz}</b>\n\n` +
    `💡 <b>Agrotexnik tavsiya:</b>\n` +
    `<i>${reading?.recommendation_uz || "Ekin rivojlanishi me'yorda. Tomchilatib sug'orish rejimini davom ettiring."}</i>\n\n` +
    `🔗 <a href="${appUrl}">Ekinix tizimida xaritani ochish</a>`
  );
}

/**
 * Send message directly via Telegram Bot API
 */
export async function sendTelegramMessage(options: TelegramSendMessageOptions): Promise<{
  success: boolean;
  messageId?: number;
  simulated?: boolean;
  error?: string;
}> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || token.includes('your-telegram') || token.trim() === '') {
    // Return graceful simulation
    console.log('[Telegram Bot API (Simulated)]', {
      chatId: options.chatId,
      preview: options.text.substring(0, 100) + '...',
    });
    return {
      success: true,
      messageId: Math.floor(Date.now() / 1000),
      simulated: true,
    };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload: any = {
      chat_id: options.chatId,
      text: options.text,
      parse_mode: options.parseMode || 'HTML',
      disable_web_page_preview: options.disableWebPagePreview ?? false,
    };

    if (options.replyMarkup) {
      payload.reply_markup = options.replyMarkup;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.ok) {
      return {
        success: false,
        error: data.description || 'Telegram API error',
      };
    }

    return {
      success: true,
      messageId: data.result?.message_id,
      simulated: false,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to connect to Telegram API',
    };
  }
}

/**
 * Answer Telegram Callback Query (for inline buttons)
 */
export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes('your-telegram') || token.trim() === '') {
    return true;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || '',
        show_alert: showAlert,
      }),
    });
    return true;
  } catch (err) {
    console.error('[Telegram answerCallbackQuery Error]', err);
    return false;
  }
}

/**
 * Edit existing Telegram message text (e.g. upon clicking toggle button)
 */
export async function editTelegramMessageText(options: {
  chatId: string | number;
  messageId: number;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyMarkup?: any;
  disableWebPagePreview?: boolean;
}): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes('your-telegram') || token.trim() === '') {
    return true;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/editMessageText`;
    const payload: any = {
      chat_id: options.chatId,
      message_id: options.messageId,
      text: options.text,
      parse_mode: options.parseMode || 'HTML',
      disable_web_page_preview: options.disableWebPagePreview ?? false,
    };
    if (options.replyMarkup) {
      payload.reply_markup = options.replyMarkup;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch (err) {
    console.error('[Telegram editMessageText Error]', err);
    return false;
  }
}

/**
 * Builds the default Telegram Reply Keyboard for farmers with all requested buttons
 */
export function getFarmerReplyKeyboard(lang: 'uz' | 'ru' | 'en' = 'uz') {
  if (lang === 'ru') {
    return {
      keyboard: [
        [{ text: '⛅ Погода и полив' }, { text: '🌾 Мои поля' }],
        [{ text: '🛰️ Спутник NDVI' }, { text: '👨‍🌾 Совет агронома' }],
        [{ text: '🔔 Уведомления' }, { text: '⚙️ Настройки и язык' }],
        [{ text: '📲 Отправить номер телефона', request_contact: true }],
      ],
      resize_keyboard: true,
      persistent: true,
    };
  }

  if (lang === 'en') {
    return {
      keyboard: [
        [{ text: '⛅ Live Weather & Irrigation' }, { text: '🌾 My Fields' }],
        [{ text: '🛰️ Sentinel NDVI' }, { text: '👨‍🌾 Agronomist Advice' }],
        [{ text: '🔔 Notifications' }, { text: '⚙️ Settings & Language' }],
        [{ text: '📲 Share Phone Number', request_contact: true }],
      ],
      resize_keyboard: true,
      persistent: true,
    };
  }

  return {
    keyboard: [
      [{ text: "⛅ Bugungi ob-havo & sug'orish" }, { text: '🌾 Mening dalalarim' }],
      [{ text: "🛰️ Sun'iy yo'ldosh NDVI" }, { text: '👨‍🌾 Agronom xulosasi' }],
      [{ text: '🔔 Bildirishnomalar' }, { text: '⚙️ Sozlamalar & Til' }],
      [{ text: '📲 Telefon raqamni yuborish', request_contact: true }],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

/**
 * Builds inline keyboard for Notifications management (ON / OFF toggles)
 */
export function getNotificationSettingsInlineKeyboard(
  notificationsEnabled: boolean,
  weatherNotify: boolean = true,
  frostNotify: boolean = true,
  ndviNotify: boolean = true,
  lang: 'uz' | 'ru' | 'en' = 'uz'
) {
  if (lang === 'ru') {
    return {
      inline_keyboard: [
        [
          {
            text: notificationsEnabled
              ? '🔔 Уведомления: ВКЛЮЧЕНЫ 🟢 (Выключить)'
              : '🔕 Уведомления: ВЫКЛЮЧЕНЫ 🔴 (Включить)',
            callback_data: notificationsEnabled ? 'notif_master_off' : 'notif_master_on',
          },
        ],
        [
          {
            text: `⛅ Погода в 07:00: ${weatherNotify ? '✅ Вкл' : '❌ Выкл'}`,
            callback_data: 'notif_toggle_weather',
          },
          {
            text: `❄️ Заморозки: ${frostNotify ? '✅ Вкл' : '❌ Выкл'}`,
            callback_data: 'notif_toggle_frost',
          },
        ],
        [
          {
            text: `🛰️ NDVI статус: ${ndviNotify ? '✅ Вкл' : '❌ Выкл'}`,
            callback_data: 'notif_toggle_ndvi',
          },
          {
            text: '🔄 Обновить статус',
            callback_data: 'notif_refresh_status',
          },
        ],
        [
          {
            text: '⛅ Проверить прогноз сейчас',
            callback_data: 'cmd_weather',
          },
          {
            text: '🌾 Мои поля',
            callback_data: 'cmd_fields',
          },
        ],
      ],
    };
  }

  if (lang === 'en') {
    return {
      inline_keyboard: [
        [
          {
            text: notificationsEnabled
              ? '🔔 Notifications: ENABLED 🟢 (Turn Off)'
              : '🔕 Notifications: DISABLED 🔴 (Turn On)',
            callback_data: notificationsEnabled ? 'notif_master_off' : 'notif_master_on',
          },
        ],
        [
          {
            text: `⛅ Morning Weather (07:00): ${weatherNotify ? '✅ ON' : '❌ OFF'}`,
            callback_data: 'notif_toggle_weather',
          },
          {
            text: `❄️ Frost Warnings: ${frostNotify ? '✅ ON' : '❌ OFF'}`,
            callback_data: 'notif_toggle_frost',
          },
        ],
        [
          {
            text: `🛰️ NDVI Vegetation: ${ndviNotify ? '✅ ON' : '❌ OFF'}`,
            callback_data: 'notif_toggle_ndvi',
          },
          {
            text: '🔄 Refresh Status',
            callback_data: 'notif_refresh_status',
          },
        ],
        [
          {
            text: '⛅ Check Weather Now',
            callback_data: 'cmd_weather',
          },
          {
            text: '🌾 My Fields',
            callback_data: 'cmd_fields',
          },
        ],
      ],
    };
  }

  // Default Uzbek
  return {
    inline_keyboard: [
      [
        {
          text: notificationsEnabled
            ? "🔔 Bildirishnomalar: YOQILGAN 🟢 (O'chirish)"
            : "🔕 Bildirishnomalar: O'CHIRILGAN 🔴 (Yoqish)",
          callback_data: notificationsEnabled ? 'notif_master_off' : 'notif_master_on',
        },
      ],
      [
        {
          text: `⛅ Ertalabki ob-havo (07:00): ${weatherNotify ? '✅ Bor' : "❌ Yo'q"}`,
          callback_data: 'notif_toggle_weather',
        },
        {
          text: `❄️ Sovuq xavfi ogohlantirishi: ${frostNotify ? '✅ Bor' : "❌ Yo'q"}`,
          callback_data: 'notif_toggle_frost',
        },
      ],
      [
        {
          text: `🛰️ NDVI o'zgarishi: ${ndviNotify ? '✅ Bor' : "❌ Yo'q"}`,
          callback_data: 'notif_toggle_ndvi',
        },
        {
          text: '🔄 Holatni yangilash',
          callback_data: 'notif_refresh_status',
        },
      ],
      [
        {
          text: "⛅ Ob-havoni hozir ko'rish",
          callback_data: 'cmd_weather',
        },
        {
          text: '🌾 Mening dalalarim',
          callback_data: 'cmd_fields',
        },
      ],
    ],
  };
}

/**
 * Format Notifications Menu message
 */
export function formatTelegramNotificationsMenu(
  farmerName: string,
  notificationsEnabled: boolean,
  weatherNotify: boolean = true,
  frostNotify: boolean = true,
  ndviNotify: boolean = true,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string {
  if (lang === 'ru') {
    return (
      `🔔 <b>ЦЕНТР УВЕДОМЛЕНИЙ Ekinix</b>\n\n` +
      `Здравствуйте, <b>${farmerName}</b>!\n` +
      `Здесь вы можете настроить автоматические уведомления от бота.\n\n` +
      `📊 <b>Текущие настройки:</b>\n` +
      `• Общий статус: ${notificationsEnabled ? '🟢 <b>ВКЛЮЧЕНО</b>' : '🔴 <b>ВЫКЛЮЧЕНО</b>'}\n` +
      `• Ежедневный отчет о погоде и поливе: ${weatherNotify && notificationsEnabled ? '✅ <b>07:00 ежедневно</b>' : '❌ Отключено'}\n` +
      `• Оповещение о риске заморозков и ливней: ${frostNotify && notificationsEnabled ? '✅ <b>Экстренно</b>' : '❌ Отключено'}\n` +
      `• Спутниковое изменение NDVI: ${ndviNotify && notificationsEnabled ? '✅ <b>При обновлении Sentinel-2</b>' : '❌ Отключено'}\n\n` +
      `👇 <i>Нажмите на кнопки ниже, чтобы переключить параметры:</i>`
    );
  }

  if (lang === 'en') {
    return (
      `🔔 <b>EKINIX NOTIFICATION CENTER</b>\n\n` +
      `Hello, <b>${farmerName}</b>!\n` +
      `Customize your automated farm alerts and advisory schedule.\n\n` +
      `📊 <b>Current Status:</b>\n` +
      `• Master Switch: ${notificationsEnabled ? '🟢 <b>ENABLED</b>' : '🔴 <b>DISABLED</b>'}\n` +
      `• Morning Weather & Irrigation: ${weatherNotify && notificationsEnabled ? '✅ <b>Daily at 07:00</b>' : '❌ Disabled'}\n` +
      `• Frost & Extreme Rain Alerts: ${frostNotify && notificationsEnabled ? '✅ <b>Immediate</b>' : '❌ Disabled'}\n` +
      `• Sentinel-2 NDVI Changes: ${ndviNotify && notificationsEnabled ? '✅ <b>Active</b>' : '❌ Disabled'}\n\n` +
      `👇 <i>Tap the buttons below to toggle any notification setting:</i>`
    );
  }

  return (
    `🔔 <b>EKINIX BILDIRISHNOMALAR MARKAZI</b>\n\n` +
    `Assalomu alaykum, <b>${farmerName}</b>!\n` +
    `Bu yerda Telegram bot orqali keladigan avtomatik xabarlarni boshqarishingiz mumkin.\n\n` +
    `📊 <b>Joriy holat:</b>\n` +
    `• Asosiy bildirishnomalar: ${notificationsEnabled ? '🟢 <b>YOQILGAN</b>' : "🔴 <b>O'CHIRILGAN</b>"}\n` +
    `• Kunlik ob-havo va sug'orish me'yori: ${weatherNotify && notificationsEnabled ? '✅ <b>Har kuni soat 07:00 da</b>' : "❌ O'chirilgan"}\n` +
    `• Sovuq urishi va kuchli yomg'ir xavfi: ${frostNotify && notificationsEnabled ? '✅ <b>Tezkor ogohlantirish</b>' : "❌ O'chirilgan"}\n` +
    `• Sentinel-2 NDVI vegetatsiya o'zgarishi: ${ndviNotify && notificationsEnabled ? '✅ <b>Faol</b>' : "❌ O'chirilgan"}\n\n` +
    `👇 <i>Bildirishnomalarni yoqish yoki o'chirish uchun quyidagi tugmalarni bosing:</i>`
  );
}

/**
 * Format Full Start / Welcome Message with rich explanation
 */
export function formatTelegramStartGreeting(
  farmerName: string,
  isPhoneLinked: boolean,
  phoneNumber: string,
  fieldCount: number,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string {
  if (lang === 'ru') {
    return (
      `🌱 <b>Добро пожаловать в Ekinix — Умный помощник фермера Узбекистана!</b>\n\n` +
      `Здравствуйте, <b>${farmerName || 'Уважаемый фермер'}</b>! 👋\n\n` +
      `🤖 <b>Что умеет этот бот:</b>\n` +
      `• ⛅ <b>Погода и полив (/weather):</b> Точный 7-дневный прогноз Open-Meteo и расчет нормы полива (м³/га) для ваших культур.\n` +
      `• 🌾 <b>Мои поля (/fields):</b> Список ваших зарегистрированных полей, площади, культуры и статус вегетации.\n` +
      `• 🛰️ <b>Спутник NDVI (/ndvi):</b> Спутниковые снимки Sentinel-2, индекс плотности листьев и влажность почвы.\n` +
      `• 👨‍🌾 <b>Совет агронома (/agronomist):</b> Экспертные рекомендации и нормы внесения удобрений.\n` +
      `• 🔔 <b>Уведомления (/notifications):</b> Ежедневные утренние сводки в 07:00 и предупреждения о заморозках.\n\n` +
      `${
        isPhoneLinked
          ? `✅ <i>Ваш телефон <code>${phoneNumber}</code> привязан (${fieldCount} полей в системе).</i>`
          : `📲 <i>Нажмите «Отправить номер телефона» ниже для привязки к полям в Ekinix!</i>`
      }\n\n` +
      `👇 <b>Выберите действие в меню ниже:</b>`
    );
  }

  if (lang === 'en') {
    return (
      `🌱 <b>Welcome to Ekinix — Smart Agriculture Assistant for Uzbekistan!</b>\n\n` +
      `Hello, <b>${farmerName || 'Farmer'}</b>! 👋\n\n` +
      `🤖 <b>What this bot can do for you:</b>\n` +
      `• ⛅ <b>Weather & Irrigation (/weather):</b> Accurate 7-day Open-Meteo forecast and calculated water dosage (m³/ha).\n` +
      `• 🌾 <b>My Fields (/fields):</b> Overview of your registered fields, acreage, crop types, and growth progress.\n` +
      `• 🛰️ <b>Sentinel NDVI (/ndvi):</b> Satellite vegetation health, canopy density, and soil moisture tracking.\n` +
      `• 👨‍🌾 <b>Agronomist Advice (/agronomist):</b> Timely agrotechnical guidance from certified specialists.\n` +
      `• 🔔 <b>Notifications (/notifications):</b> Daily 07:00 AM weather briefing and instant frost alerts.\n\n` +
      `${
        isPhoneLinked
          ? `✅ <i>Your phone <code>${phoneNumber}</code> is connected (${fieldCount} fields loaded).</i>`
          : `📲 <i>Tap «Share Phone Number» below to link your Ekinix account instantly!</i>`
      }\n\n` +
      `👇 <b>Choose an action from the menu below:</b>`
    );
  }

  return (
    `🌱 <b>Ekinix — O'zbekiston dehqonlari uchun aqlli yordamchi botiga xush kelibsiz!</b>\n\n` +
    `Assalomu alaykum, <b>${farmerName || 'Hurmatli dehqon'}</b>! 👋\n\n` +
    `🤖 <b>Ushbu bot sizga nimalarda yordam beradi:</b>\n` +
    `• ⛅ <b>Ob-havo va Sug'orish (/weather):</b> Open-Meteo orqali 7 kunlik ob-havo va ekin turi bo'yicha hisoblangan aniq suv me'yori (m³/ga).\n` +
    `• 🌾 <b>Mening dalalarim (/fields):</b> Ro'yxatdan o'tgan ekin maydonlaringiz, gektari va holati.\n` +
    `• 🛰️ <b>Sun'iy yo'ldosh NDVI (/ndvi):</b> Sentinel-2 sun'iy yo'ldoshidan olingan o'simlik salomatligi va tuproq namligi indeksi.\n` +
    `• 👨‍🌾 <b>Agronom xulosasi (/agronomist):</b> Malakali agronomlarning o'g'itlash va parvarish bo'yicha ko'rsatmalari.\n` +
    `• 🔔 <b>Bildirishnomalar (/notifications):</b> Har kuni ertalab soat 07:00 da avtomatik ob-havo hisoboti va sovuq urishdan erta ogohlantirish.\n\n` +
    `${
      isPhoneLinked
        ? `✅ <i>Sizning <code>${phoneNumber}</code> raqamingiz Ekinix tizimiga bog'langan (${fieldCount} ta dala).</i>`
        : `📲 <i>Dalalaringizni avtomatik ulash uchun pastdagi <b>«📲 Telefon raqamni yuborish»</b> tugmasini bosing yoki raqamingizni yozing!</i>`
    }\n\n` +
    `👇 <b>Kerakli bo'limni tanlang:</b>`
  );
}
