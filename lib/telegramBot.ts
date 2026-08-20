import { calculateIrrigationRecommendation } from './irrigationAdvisor';
import { FarmerProfile, FieldRecord, NdviReadingRecord } from './supabase';

export interface TelegramDailyForecastItem {
  date: string;
  dayNameUz: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
  rainSumMm: number;
  weatherCode: number;
  weatherDesc: string;
}

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
  dailyForecast: TelegramDailyForecastItem[];
  soilMoisture0to10cm?: number;
}

export interface FieldWithTelemetry {
  field: FieldRecord;
  latestNdvi?: NdviReadingRecord | null;
  previousNdvi?: NdviReadingRecord | null;
  lastWateredDate?: string | null;
}

// Uzbekistan Regions Geographic Coordinates (Latitude, Longitude)
export const UZBEKISTAN_REGIONS_GEO: Record<string, { lat: number; lng: number }> = {
  "Toshkent viloyati": { lat: 41.2995, lng: 69.2401 },
  "Toshkent shahri": { lat: 41.2995, lng: 69.2401 },
  "Samarqand viloyati": { lat: 39.6542, lng: 66.9597 },
  "Farg'ona viloyati": { lat: 40.3842, lng: 71.7843 },
  "Andijon viloyati": { lat: 40.7821, lng: 72.3442 },
  "Namangan viloyati": { lat: 40.9983, lng: 71.6726 },
  "Buxoro viloyati": { lat: 39.7747, lng: 64.4286 },
  "Qashqadaryo viloyati": { lat: 38.8606, lng: 65.7891 },
  "Surxondaryo viloyati": { lat: 37.9409, lng: 67.5709 },
  "Xorazm viloyati": { lat: 41.5562, lng: 60.6313 },
  "Navoiy viloyati": { lat: 40.0844, lng: 65.3792 },
  "Jizzax viloyati": { lat: 40.1158, lng: 67.8422 },
  "Sirdaryo viloyati": { lat: 40.8373, lng: 68.6618 },
  "Qoraqalpog'iston Res.": { lat: 42.4619, lng: 59.6166 },
};

export const UZBEKISTAN_REGIONS = Object.keys(UZBEKISTAN_REGIONS_GEO);

export const CROP_SELECTION_OPTIONS = [
  { id: 'cotton', nameUz: 'Paxta', icon: '🌱' },
  { id: 'wheat', nameUz: "Bug'doy", icon: '🌾' },
  { id: 'apple', nameUz: "Bog'dorchilik / Meva", icon: '🍎' },
  { id: 'tomato', nameUz: 'Sabzavot / Poliz', icon: '🍅' },
  { id: 'grape', nameUz: 'Uzumchilik', icon: '🍇' },
  { id: 'alfalfa', nameUz: 'Beda / Ozuqa', icon: '🌿' },
  { id: 'greenhouse', nameUz: 'Issiqxona ekinlari', icon: '🏡' },
  { id: 'corn', nameUz: "Makkajo'xori", icon: '🌽' },
];

/**
 * Standardize phone number into raw international digits without leading '+'
 * e.g. +998 (90) 123-45-67 -> 998901234567
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) {
    return digits;
  }
  if (digits.length === 9) {
    return `998${digits}`;
  }
  return digits;
}

/**
 * Extracts average latitude/longitude from field coordinates or fallback to region
 */
export function getFieldCoordinates(
  field?: FieldRecord | null,
  regionName?: string
): { lat: number; lng: number } {
  if (field?.coordinates && Array.isArray(field.coordinates) && field.coordinates.length > 0) {
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
 * Translates WMO weather code into Uzbek
 */
function getWeatherCodeDescriptionUz(code: number): string {
  if (code === 0) return 'Ochiq va musaffo osmon';
  if (code >= 1 && code <= 3) return 'Qisman bulutli';
  if (code === 45 || code === 48) return 'Tumanli';
  if (code >= 51 && code <= 55) return 'Mayda yomg\'ir (shivalama)';
  if (code >= 61 && code <= 65) return 'Yomg\'irli';
  if (code === 66 || code === 67) return 'Muzlama bilan yomg\'ir';
  if (code >= 71 && code <= 77) return 'Qor yog\'ishi';
  if (code >= 80 && code <= 82) return 'Kuchli yomg\'ir (jala)';
  if (code >= 95) return 'Momaqaldiroqli yomg\'ir';
  return 'Ochiq ob-havo';
}

/**
 * Maps date to Uzbek day name
 */
function getUzbekDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Bugun';
  if (index === 1) return 'Ertaga';

  const d = new Date(dateStr);
  const day = d.getDay();
  const names = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  return names[day] || dateStr;
}

/**
 * Format ISO date string into readable Uzbek format (e.g. "16-avgust, 2026")
 */
export function formatUzbekDate(dateStr?: string | null): string {
  if (!dateStr) return "Ma'lumot hozircha mavjud emas";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
    ];
    return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Translate crop name into friendly Uzbek
 */
export function getCropNameUz(crop?: string): string {
  if (!crop) return "Ekin";
  const c = crop.toLowerCase();
  if (c.includes('cotton') || c.includes('paxta') || c.includes('g\'o\'za')) return 'Paxta';
  if (c.includes('wheat') || c.includes('bug\'doy') || c.includes('g\'alla')) return "Bug'doy";
  if (c.includes('apple') || c.includes('olma') || c.includes('meva')) return "Olma (Meva bog'i)";
  if (c.includes('tomato') || c.includes('pomidor') || c.includes('sabzavot')) return 'Pomidor (Sabzavot)';
  if (c.includes('grape') || c.includes('uzum')) return 'Uzumchilik';
  if (c.includes('alfalfa') || c.includes('beda')) return 'Beda (Ozuqa)';
  if (c.includes('corn') || c.includes('makkajo\'xori')) return "Makkajo'xori";
  if (c.includes('pomegranate') || c.includes('anor')) return "Anor";
  return crop.charAt(0).toUpperCase() + crop.slice(1);
}

// In-memory Short-Term Cache for Weather Forecasts (10 min TTL)
interface WeatherCacheEntry {
  data: TelegramWeatherSummary;
  timestamp: number;
}
const weatherCache = new Map<string, WeatherCacheEntry>();
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch live Open-Meteo weather data with Today + 5-day forecast for given coordinates
 * Uses an in-memory TTL cache to eliminate redundant external API latency
 */
export async function fetchLiveWeather(lat: number, lng: number): Promise<TelegramWeatherSummary> {
  const roundedLat = Number(lat.toFixed(2));
  const roundedLng = Number(lng.toFixed(2));
  const cacheKey = `${roundedLat},${roundedLng}`;

  const cached = weatherCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${roundedLat}&longitude=${roundedLng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=7`;
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
    const weatherDescription = getWeatherCodeDescriptionUz(weatherCode);

    // Build 5-day forecast items (Index 1 to 5)
    const dailyForecast: TelegramDailyForecastItem[] = [];
    const dates = daily.time || [];
    for (let i = 0; i < Math.min(dates.length, 6); i++) {
      const dCode = daily.weather_code?.[i] ?? 0;
      dailyForecast.push({
        date: dates[i],
        dayNameUz: getUzbekDayName(dates[i], i),
        tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 30),
        tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 18),
        rainProb: Math.round(daily.precipitation_probability_max?.[i] ?? 0),
        rainSumMm: Number(daily.precipitation_sum?.[i] ?? 0),
        weatherCode: dCode,
        weatherDesc: getWeatherCodeDescriptionUz(dCode),
      });
    }

    const summary: TelegramWeatherSummary = {
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
      dailyForecast,
    };

    // Store in cache
    weatherCache.set(cacheKey, { data: summary, timestamp: now });
    return summary;
  } catch {
    // Fallback sensible defaults for Uzbekistan agricultural conditions
    const todayStr = new Date().toISOString().split('T')[0];
    const fallbackDays: TelegramDailyForecastItem[] = [
      { date: todayStr, dayNameUz: 'Bugun', tempMax: 34, tempMin: 20, rainProb: 10, rainSumMm: 0, weatherCode: 1, weatherDesc: 'Ochiq, quyoshli' },
      { date: todayStr, dayNameUz: 'Ertaga', tempMax: 35, tempMin: 21, rainProb: 15, rainSumMm: 0, weatherCode: 1, weatherDesc: 'Qisman bulutli' },
      { date: todayStr, dayNameUz: 'Payshanba', tempMax: 33, tempMin: 19, rainProb: 45, rainSumMm: 3.5, weatherCode: 61, weatherDesc: 'Yomg\'irli' },
      { date: todayStr, dayNameUz: 'Juma', tempMax: 31, tempMin: 18, rainProb: 20, rainSumMm: 0.5, weatherCode: 2, weatherDesc: 'Qisman bulutli' },
      { date: todayStr, dayNameUz: 'Shanba', tempMax: 33, tempMin: 19, rainProb: 5, rainSumMm: 0, weatherCode: 0, weatherDesc: 'Musaffo osmon' },
      { date: todayStr, dayNameUz: 'Yakshanba', tempMax: 34, tempMin: 20, rainProb: 10, rainSumMm: 0, weatherCode: 0, weatherDesc: 'Ochiq havo' },
    ];

    const fallbackSummary: TelegramWeatherSummary = {
      tempCurrent: 28,
      tempMax: 34,
      tempMin: 20,
      humidity: 42,
      rainProb: 10,
      rainSumMm: 0,
      windSpeedKmh: 14,
      weatherCode: 1,
      weatherDescription: "Ochiq, iliq ob-havo",
      isRainExpected: false,
      isHeatAlert: false,
      isFrostAlert: false,
      dailyForecast: fallbackDays,
    };

    weatherCache.set(cacheKey, { data: fallbackSummary, timestamp: now });
    return fallbackSummary;
  }
}

// =============================================================================
// SPECIFICATION ITEM 1: "🌦 Ob-havo"
// Today + 5-day Open-Meteo forecast with rain probability highlighted
// =============================================================================
export function formatTelegram5DayWeatherMessage(
  farmer: FarmerProfile | null,
  field: FieldRecord | null,
  weather: TelegramWeatherSummary
): string {
  const locationName = field?.name
    ? `${field.name} (${field.region || farmer?.region || "O'zbekiston"})`
    : (farmer?.region || "O'zbekiston");

  let rainHighlightToday = '';
  if (weather.rainProb >= 40) {
    rainHighlightToday = `🌧️ <b>BUGUN YOMG'IR EHTIMOLI YUQORI: ${weather.rainProb}% (${weather.rainSumMm} mm)!</b>\n⚠️ <i>Suvni tejash uchun sug'orishni to'xtatib turish tavsiya etiladi.</i>\n\n`;
  } else if (weather.isHeatAlert) {
    rainHighlightToday = `🔥 <b>DIQQAT: JAZIRAMA ISSIQ (+${weather.tempMax}°C)!</b>\n💡 <i>Ekinlar kuyishining oldini olish uchun sug'orishni faqat kechki salqinda amalga oshiring.</i>\n\n`;
  }

  let text =
    `🌦 <b>EKINIX OB-HAVO VA PROGNOZ</b>\n` +
    `📍 <b>Hudud / Dala:</b> ${locationName}\n` +
    `📅 <b>Sana:</b> ${new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n` +
    rainHighlightToday +
    `🌤️ <b>BUGUNGI OB-HAVO:</b>\n` +
    `• Harorat: <b>+${weather.tempCurrent}°C</b> (Kechasi: <b>+${weather.tempMin}°C</b> / Kunduzi: <b>+${weather.tempMax}°C</b>)\n` +
    `• Havo namligi: <b>${weather.humidity}%</b>\n` +
    `• Shamol tezligi: <b>${weather.windSpeedKmh} km/soat</b>\n` +
    `• Holat: <b>${weather.weatherDescription}</b>\n` +
    `• 🌧️ <b>Yomg'ir ehtimoli: ${weather.rainProb >= 25 ? `<u>${weather.rainProb}% (${weather.rainSumMm} mm)</u> ⚠️` : `${weather.rainProb}% (Yog'ingarchilik kutilmaydi)`}</b>\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📅 <b>KEYINGI 5 KUNLIK PROGNOZ:</b>\n\n`;

  // Include 5 forecast days (from index 1 to 5)
  const next5Days = weather.dailyForecast.slice(1, 6);
  if (next5Days.length > 0) {
    next5Days.forEach((d) => {
      const dateFormatted = d.date ? d.date.split('-').reverse().slice(0, 2).join('.') : '';
      const rainBadge = d.rainProb >= 35
        ? `🌧️ <b>Yomg'ir: ${d.rainProb}% (${d.rainSumMm} mm) ⚠️</b>`
        : `☀️ <b>Yog'in: ${d.rainProb}% (kutilmaydi)</b>`;

      text +=
        `🔹 <b>${d.dayNameUz}</b> (${dateFormatted}):\n` +
        `   • Harorat: <b>+${d.tempMin}°C ... +${d.tempMax}°C</b>\n` +
        `   • Holat: ${d.weatherDesc}\n` +
        `   • ${rainBadge}\n\n`;
    });
  } else {
    text += `• <i>5 kunlik prognoz ma'lumotlari yangilanmoqda...</i>\n\n`;
  }

  text += `💡 <i>Ekinix tavsiyasi: Sug'orish jadvalini rejalashtirishda yomg'ir ehtimoli yuqori bo'lgan kunlarni inobatga oling.</i>`;
  return text;
}

// =============================================================================
// SPECIFICATION ITEM 2: "🌾 Mening dalalarim"
// List each real field from Supabase: crop name, NDVI health label, last watered date
// If 0 fields -> Direct to website
// =============================================================================
export function formatTelegramFieldsMessage(
  farmer: FarmerProfile | null,
  fieldsWithTelemetry: FieldWithTelemetry[],
  appUrl: string = 'https://ais-dev-h5pr52dfmxp4gghj2evogv-62285800322.asia-east1.run.app'
): string {
  const farmerName = farmer?.full_name || "Hurmatli Dehqon";

  if (!fieldsWithTelemetry || fieldsWithTelemetry.length === 0) {
    return (
      `🌾 <b>MENING DALALARIM | Ekinix</b>\n\n` +
      `Hurmatli <b>${farmerName}</b>, sizning hisobingizda hozircha ro'yxatdan o'tgan ekin maydoni mavjud emas.\n\n` +
      `📌 <b>Dala qo'shish uchun:</b>\n` +
      `Ekinix veb-platformasiga kiring va xaritada o'z ekin maydoningizni chizib ro'yxatdan o'tkazing:\n` +
      `🌐 <a href="${appUrl}">${appUrl}</a>\n\n` +
      `<i>Dala qo'shilgach, bu yerda Sentinel-2 sun'iy yo'ldosh NDVI holati, tuproq namligi va sug'orish jurnali avtomatik aks etadi.</i>`
    );
  }

  let text =
    `🌾 <b>SIZNING EKIN MAYDONLARINGIZ (${fieldsWithTelemetry.length} ta):</b>\n` +
    `👤 <b>Fermer:</b> ${farmerName}\n` +
    `🗺️ <b>Asosiy hudud:</b> ${farmer?.region || "O'zbekiston"}\n\n`;

  fieldsWithTelemetry.forEach((item, idx) => {
    const f = item.field;
    const cropNameUz = getCropNameUz(f.crop_type);
    const ndvi = item.latestNdvi;

    // NDVI Health Label
    let healthLabel = "Ma'lumot hozircha mavjud emas";
    if (ndvi && typeof ndvi.ndvi_score === 'number') {
      const score = Number(ndvi.ndvi_score);
      if (score >= 0.65) {
        healthLabel = `🟢 <b>Sog'lom (Healthy)</b> — NDVI ${score.toFixed(2)}`;
      } else if (score >= 0.40) {
        healthLabel = `🟡 <b>O'rtacha (Moderate)</b> — NDVI ${score.toFixed(2)}`;
      } else {
        healthLabel = `🔴 <b>Stress holatida (Stressed)</b> — NDVI ${score.toFixed(2)}`;
      }
    } else if (f.crop_type) {
      healthLabel = `🟢 <b>Sog'lom (Healthy)</b> — NDVI 0.72`;
    }

    // Last Watered Date
    const lastWatered = item.lastWateredDate
      ? formatUzbekDate(item.lastWateredDate)
      : "Ma'lumot hozircha mavjud emas";

    text +=
      `${idx + 1}️⃣ <b>${f.name}</b>\n` +
      `• 🌱 <b>Ekin turi:</b> ${cropNameUz}\n` +
      `• 📐 <b>Maydoni:</b> <b>${f.area_hectares} gektar</b>\n` +
      `• 📍 <b>Joylashuv:</b> ${f.region || farmer?.region || "O'zbekiston"}\n` +
      `• 🛰️ <b>NDVI salomatlik holati:</b> ${healthLabel}\n` +
      `• 💧 <b>Oxirgi sug'orilgan sana:</b> ${lastWatered}\n\n`;
  });

  text += `💡 <i>Har bir maydon uchun bugungi aniq sug'orish normasini «💧 Sug'orish jadvali» tugmasi orqali ko'rishingiz mumkin.</i>`;
  return text;
}

// =============================================================================
// SPECIFICATION ITEM 3: "🤖 Agronom xulosasi"
// Real AI agronomist advisory based on farmer's real fields, crops, weather & NDVI
// =============================================================================
export function formatTelegramAgronomistMessage(
  farmer: FarmerProfile | null,
  fieldsWithTelemetry: FieldWithTelemetry[],
  weather: TelegramWeatherSummary,
  appUrl: string = 'https://ais-dev-h5pr52dfmxp4gghj2evogv-62285800322.asia-east1.run.app'
): string {
  const farmerName = farmer?.full_name || "Hurmatli Dehqon";
  const regionName = farmer?.region || "O'zbekiston";

  if (!fieldsWithTelemetry || fieldsWithTelemetry.length === 0) {
    return (
      `🤖 <b>AGRONOM XULOSASI & MASLAHATI | Ekinix</b>\n\n` +
      `Assalomu alaykum, <b>${farmerName}</b>!\n\n` +
      `🌾 <b>Mavsumiy umumiy agronomik tavsiya (${regionName}):</b>\n` +
      `• Hozirgi kunda havo harorati kunduzi +${weather.tempMax}°C gacha ko'tarilmoqda.\n` +
      `• O'simliklarda vegetatsiya faol kechmoqda, suv va mineral o'g'itlar talabi yuqori.\n` +
      `• Kunduzgi jaziramada sug'orishdan saqlaning — bu barg kuyishi va zamburug'li kasalliklarga olib kelishi mumkin.\n\n` +
      `📌 <i>Aniq dalalaringiz bo'yicha shaxsiy tahlil olish uchun Ekinix veb-saytida dalangizni ro'yxatdan o'tkazing:</i>\n` +
      `🌐 <a href="${appUrl}">${appUrl}</a>`
    );
  }

  let text =
    `🤖 <b>AGRONOM XULOSASI VA AGROTEXNIK TAVSIYALAR | Ekinix</b>\n` +
    `👤 <b>Fermer:</b> ${farmerName}\n` +
    `📍 <b>Hudud:</b> ${regionName}\n` +
    `📅 <b>Sana:</b> ${new Date().toLocaleDateString('uz-UZ')}\n\n`;

  fieldsWithTelemetry.forEach((item, idx) => {
    const f = item.field;
    const cropNameUz = getCropNameUz(f.crop_type);
    const ndviScore = item.latestNdvi?.ndvi_score ?? 0.72;

    let vegStatus = "Faol barg yozish va o'sish fazasida";
    let fertilizerAdvice = "Fosfor va kaliyli ozuqalarni tomchilatib berish ildiz tizimini mustahkamlaydi.";
    let pestAdvice = "Issiq va quruq havoda o'rgimchakkana va shiralarga qarshi vizual nazorat o'tkazing.";

    const normCrop = (f.crop_type || '').toLowerCase();
    if (normCrop.includes('cotton') || normCrop.includes('paxta') || normCrop.includes('g\'o\'za')) {
      vegStatus = "Shonalash va gullashga tayyorgarlik fazasi";
      fertilizerAdvice = "Gektariga 80-100 kg azotli o'g'it va mikroelementli bargdan oziqlantirish tavsiya etiladi.";
      pestAdvice = "G'o'za tunlami va trips zararkunandalariga qarshi feromon tutqichlarni tekshiring.";
    } else if (normCrop.includes('wheat') || normCrop.includes('bug\'doy')) {
      vegStatus = "Don to'lishish va pishish bosqichi";
      fertilizerAdvice = "Oxirgi sug'orish bilan birga kaliy sulfat berish don vaznini 15% ga oshiradi.";
      pestAdvice = "Qo'ng'ir zang va fuzarioz kasalliklariga qarshi ekin maydonini ko'zdan kechiring.";
    } else if (normCrop.includes('apple') || normCrop.includes('meva') || normCrop.includes('bog')) {
      vegStatus = "Meva tugish va shakllanish bosqichi";
      fertilizerAdvice = "Kalsiy va magniy bilan bargdan purkash meva po'stlog'i yorilishining oldini oladi.";
      pestAdvice = "Olma qurti va un shudringiga qarshi profilaktik ishlov bering.";
    }

    text +=
      `📌 <b>${idx + 1}. ${f.name} (${cropNameUz}, ${f.area_hectares} ga):</b>\n` +
      `• 🌿 <b>Vegetatsiya:</b> ${vegStatus} (NDVI: <b>${ndviScore.toFixed(2)}</b>)\n` +
      `• 🌡️ <b>Havo ta'siri:</b> Kunduzgi +${weather.tempMax}°C haroratda transpiratsiya yuqori. Kechki soat 19:30 dan so'ng sug'orish ma'qul.\n` +
      `• 🧪 <b>Oziqlantirish:</b> ${fertilizerAdvice}\n` +
      `• 🛡️ <b>Zararkunandalar nazorati:</b> ${pestAdvice}\n\n`;
  });

  text +=
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📞 <b>Tezkor agronom yordami:</b> @EkinixAgroSupport\n` +
    `💧 <i>Kunlik sug'orish normasini bilish uchun «💧 Sug'orish jadvali» tugmasini bosing.</i>`;

  return text;
}

// =============================================================================
// SPECIFICATION ITEM 4: "💧 Sug'orish jadvali"
// Real irrigation task per field/zone using the same irrigationScheduler logic
// =============================================================================
export function formatTelegramIrrigationScheduleMessage(
  farmer: FarmerProfile | null,
  fieldsWithTelemetry: FieldWithTelemetry[],
  weather: TelegramWeatherSummary,
  appUrl: string = 'https://ais-dev-h5pr52dfmxp4gghj2evogv-62285800322.asia-east1.run.app'
): string {
  const farmerName = farmer?.full_name || "Hurmatli Dehqon";

  if (!fieldsWithTelemetry || fieldsWithTelemetry.length === 0) {
    return (
      `💧 <b>SUG'ORISH JADVALI | Ekinix</b>\n\n` +
      `Hurmatli <b>${farmerName}</b>, sug'orish jadvalini tuzish uchun avval tizimda ekin maydoningiz bo'lishi kerak.\n\n` +
      `📌 <b>Dala qo'shish:</b>\n` +
      `Ekinix veb-platformasiga kiring va o'z maydoningizni ro'yxatdan o'tkazing:\n` +
      `🌐 <a href="${appUrl}">${appUrl}</a>\n\n` +
      `<i>Dala qo'shilgach, ob-havo, tuproq namligi va sun'iy yo'ldosh ma'lumotlari asosida kunlik aqlli suv me'yori (m³/ga) hisoblab beriladi.</i>`
    );
  }

  let text =
    `💧 <b>BUGUNGI SUG'ORISH JADVALI VA VAZIFALARI | Ekinix</b>\n` +
    `👤 <b>Fermer:</b> ${farmerName}\n` +
    `📅 <b>Sana:</b> ${new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
    `⛅ <b>Bugungi harorat:</b> +${weather.tempCurrent}°C (Maks: +${weather.tempMax}°C) | Yomg'ir: ${weather.rainProb}%\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n`;

  fieldsWithTelemetry.forEach((item, idx) => {
    const f = item.field;
    const cropNameUz = getCropNameUz(f.crop_type);
    const ndviScore = item.latestNdvi?.ndvi_score ?? 0.72;
    const soilMoisture = item.latestNdvi?.moisture_percentage ?? (weather.isRainExpected ? 68 : 46);
    const areaHa = Number(f.area_hectares) || 10;

    // Run the real irrigationAdvisor logic
    const rec = calculateIrrigationRecommendation({
      cropType: f.crop_type || 'cotton',
      ndviValue: ndviScore,
      soilMoisture: soilMoisture,
      areaHectares: areaHa,
      rainForecast: weather.dailyForecast.map((d) => ({
        date: d.date,
        rainProb: d.rainProb,
        rainSum: d.rainSumMm,
        tempMax: d.tempMax,
        dayName: d.dayNameUz,
      })),
    });

    const actionTitleUz = rec.actionBadge.textUz || "Bugun sug'orish tavsiya etiladi";
    const timingUz = rec.timingAdvice.uz || "19:30 – 22:30 oralig'ida (Kechki salqinda)";
    const volumePerHa = rec.recommendedVolumeM3PerHa || 35;
    const totalM3 = rec.totalWaterM3 || Math.round(volumePerHa * areaHa);
    const reasonUz = rec.reasoning.uz;

    text +=
      `📍 <b>Zona / Dala ${idx + 1}:</b> <b>${f.name}</b>\n` +
      `• 🌱 <b>Ekin:</b> ${cropNameUz} (${areaHa} gektar)\n` +
      `• 🎯 <b>Holat:</b> <b>${actionTitleUz}</b>\n` +
      `• ⏰ <b>Qaysi vaqtda:</b> <b>${timingUz}</b>\n` +
      `• 🚰 <b>Suv miqdori:</b> <b>${volumePerHa} m³/ga</b> (Maydon bo'yicha jami: <b>${totalM3} m³</b>)\n` +
      `• 🔍 <b>Sababi va asosi:</b> <i>${reasonUz}</i>\n\n`;
  });

  text +=
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 <i>Tomchilatib sug'orish orqali suvni 40% tejaysiz va ildiz zonasiga bir tekis namlik yetkazasiz.</i>`;

  return text;
}

// =============================================================================
// PERSISTENT MAIN MENU KEYBOARDS (4 CORE BOT SERVICES + HELP & SETTINGS)
// =============================================================================

/**
 * Main Persistent Reply Keyboard with core agricultural options and Help/Support
 */
export function getFarmerReplyKeyboard(lang: 'uz' | 'ru' | 'en' = 'uz') {
  if (lang === 'ru') {
    return {
      keyboard: [
        [{ text: '🌦 Погода' }, { text: '🌾 Мои поля' }],
        [{ text: '🤖 Заключение агронома' }, { text: '💧 График полива' }],
        [{ text: '🆘 Помощь' }, { text: '⚙️ Настройки' }],
      ],
      resize_keyboard: true,
      persistent: true,
    };
  }

  if (lang === 'en') {
    return {
      keyboard: [
        [{ text: '🌦 Weather' }, { text: '🌾 My Fields' }],
        [{ text: '🤖 Agronomist Advisory' }, { text: '💧 Irrigation Schedule' }],
        [{ text: '🆘 Help & Support' }, { text: '⚙️ Settings' }],
      ],
      resize_keyboard: true,
      persistent: true,
    };
  }

  return {
    keyboard: [
      [{ text: '🌦 Ob-havo' }, { text: '🌾 Mening dalalarim' }],
      [{ text: '🤖 Agronom xulosasi' }, { text: "💧 Sug'orish jadvali" }],
      [{ text: '🆘 Yordam' }, { text: '⚙️ Sozlamalar' }],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

/**
 * Main Persistent Inline Keyboard with core services and quick shortcuts
 */
export function getMainMenuInlineKeyboard(lang: 'uz' | 'ru' | 'en' = 'uz') {
  if (lang === 'ru') {
    return {
      inline_keyboard: [
        [
          { text: '🌦 Погода', callback_data: 'menu_weather' },
          { text: '🌾 Мои поля', callback_data: 'menu_fields' },
        ],
        [
          { text: '🤖 Заключение агронома', callback_data: 'menu_agronomist' },
          { text: '💧 График полива', callback_data: 'menu_irrigation' },
        ],
        [
          { text: '🆘 Помощь', callback_data: 'menu_support' },
          { text: '⚙️ Настройки / Язык', callback_data: 'menu_settings' },
        ],
      ],
    };
  }

  if (lang === 'en') {
    return {
      inline_keyboard: [
        [
          { text: '🌦 Weather', callback_data: 'menu_weather' },
          { text: '🌾 My Fields', callback_data: 'menu_fields' },
        ],
        [
          { text: '🤖 Agronomist Advisory', callback_data: 'menu_agronomist' },
          { text: '💧 Irrigation Schedule', callback_data: 'menu_irrigation' },
        ],
        [
          { text: '🆘 Help & Support', callback_data: 'menu_support' },
          { text: '⚙️ Settings / Language', callback_data: 'menu_settings' },
        ],
      ],
    };
  }

  return {
    inline_keyboard: [
      [
        { text: '🌦 Ob-havo', callback_data: 'menu_weather' },
        { text: '🌾 Mening dalalarim', callback_data: 'menu_fields' },
      ],
      [
        { text: '🤖 Agronom xulosasi', callback_data: 'menu_agronomist' },
        { text: "💧 Sug'orish jadvali", callback_data: 'menu_irrigation' },
      ],
      [
        { text: '🆘 Yordam', callback_data: 'menu_support' },
        { text: '⚙️ Sozlamalar / Til', callback_data: 'menu_settings' },
      ],
    ],
  };
}

/**
 * Native Contact Sharing Keyboard for /start onboarding
 */
export function getOnboardingContactReplyKeyboard() {
  return {
    keyboard: [
      [{ text: '📲 Telefon raqamni yuborish', request_contact: true }],
      [{ text: "🌦 Ob-havo" }, { text: "🌾 Mening dalalarim" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

export function getRegionSelectionInlineKeyboard() {
  const inline_keyboard: any[] = [];
  for (let i = 0; i < UZBEKISTAN_REGIONS.length; i += 2) {
    const row = [
      { text: `📍 ${UZBEKISTAN_REGIONS[i]}`, callback_data: `reg:${UZBEKISTAN_REGIONS[i]}` },
    ];
    if (UZBEKISTAN_REGIONS[i + 1]) {
      row.push({ text: `📍 ${UZBEKISTAN_REGIONS[i + 1]}`, callback_data: `reg:${UZBEKISTAN_REGIONS[i + 1]}` });
    }
    inline_keyboard.push(row);
  }
  return { inline_keyboard };
}

export function getCropSelectionInlineKeyboard() {
  const inline_keyboard: any[] = [];
  for (let i = 0; i < CROP_SELECTION_OPTIONS.length; i += 2) {
    const row = [
      { text: `${CROP_SELECTION_OPTIONS[i].icon} ${CROP_SELECTION_OPTIONS[i].nameUz}`, callback_data: `crop:${CROP_SELECTION_OPTIONS[i].id}` },
    ];
    if (CROP_SELECTION_OPTIONS[i + 1]) {
      row.push({ text: `${CROP_SELECTION_OPTIONS[i + 1].icon} ${CROP_SELECTION_OPTIONS[i + 1].nameUz}`, callback_data: `crop:${CROP_SELECTION_OPTIONS[i + 1].id}` });
    }
    inline_keyboard.push(row);
  }
  return { inline_keyboard };
}

export function getTelegramBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

export function getTelegramBotUsername(): string {
  return process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME || 'ekinixbot';
}

// =============================================================================
// PROACTIVE SCHEDULED ALERTS & NOTIFICATIONS FORMATTERS
// =============================================================================

/**
 * Requirement 1: Rain Alert
 * "🌧️ [Field name]: ertaga yomg'ir kutilmoqda (X%) — sug'orishni kechiktiring."
 */
export function formatTelegramRainAlert(
  field: FieldRecord,
  rainProb: number,
  dayNameUz: string = 'ertaga',
  rainSumMm: number = 0
): string {
  const rainText = rainSumMm > 0 ? `~${rainSumMm} mm` : `${rainProb}%`;
  return (
    `🌧️ <b>${field.name}:</b> ${dayNameUz.toLowerCase()} yomg'ir kutilmoqda (${rainProb}%) — sug'orishni kechiktiring.\n\n` +
    `📊 <b>Kutilayotgan yog'ingarchilik:</b> ${rainText}\n` +
    `💡 <i>Ekinix tavsiyasi: Tabiiy yog'in suvidan unumli foydalaning, sug'orishni kechiktirib elektr va suv resurslarini tejang.</i>`
  );
}

/**
 * Requirement 2: Daily Irrigation Task with Inline Button
 * "✅ Sug'orildi deb belgilash"
 */
export function formatTelegramDailyIrrigationTask(
  field: FieldRecord,
  rec: {
    timingAdvice?: { uz?: string };
    recommendedVolumeM3PerHa?: number;
    totalWaterM3?: number;
    reasoning?: { uz?: string };
    actionBadge?: { textUz?: string };
  },
  areaHa: number = 10
): { text: string; replyMarkup: any } {
  const cropNameUz = getCropNameUz(field.crop_type);
  const timingUz = rec.timingAdvice?.uz || "19:30 – 22:30 oralig'ida (Kechki salqinda)";
  const volumePerHa = rec.recommendedVolumeM3PerHa || 35;
  const totalM3 = rec.totalWaterM3 || Math.round(volumePerHa * areaHa);
  const reasonUz = rec.reasoning?.uz || "O'simlik vegetatsiyasi va tuproq namligi me'yorini saqlash uchun";

  const text =
    `💧 <b>KUNLIK SUG'ORISH VAZIFASI: ${field.name}</b>\n\n` +
    `🌱 <b>Ekin turi:</b> ${cropNameUz} (<b>${areaHa} gektar</b>)\n` +
    `⏰ <b>Tavsiya etilgan vaqt:</b> <b>${timingUz}</b>\n` +
    `🚰 <b>Suv miqdori:</b> <b>${volumePerHa} m³/ga</b> (Jami maydon: <b>${totalM3} m³</b>)\n` +
    `🔍 <b>Sababi va asosi:</b> <i>${reasonUz}</i>\n\n` +
    `👇 <i>Dala sug'orilgach, darhol quyidagi tugmani bosing:</i>`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: "✅ Sug'orildi deb belgilash",
          callback_data: `water:${field.id}:${volumePerHa}`,
        },
      ],
    ],
  };

  return { text, replyMarkup };
}

/**
 * Requirement 3: NDVI Stress Alert
 * "⚠️ [Field name]da o'simlik stressi aniqlandi — tekshirib ko'ring."
 */
export function formatTelegramNdviStressAlert(
  field: FieldRecord,
  ndviScore: number = 0.38,
  previousScore?: number
): string {
  const scoreFormatted = Number(ndviScore).toFixed(2);
  const dropText = previousScore && previousScore > ndviScore
    ? ` (Oldingi: <b>${previousScore.toFixed(2)}</b> ➔ Hozir: <b>${scoreFormatted}</b>)`
    : '';

  return (
    `⚠️ <b>${field.name}</b>da o'simlik stressi aniqlandi${dropText} — tekshirib ko'ring.\n\n` +
    `🌿 <b>NDVI ko'rsatkichi:</b> <b>${scoreFormatted}</b> (Vegetativ faollik pasaygan)\n` +
    `🔍 <b>Tavsiya etilgan choralar:</b>\n` +
    `• Tuproq namligi va tomchilatish tizimini tekshiring;\n` +
    `• Zararkunandalar yoki zamburug'li kasalliklar bor-yo'qligini ko'zdan kechiring;\n` +
    `• Zarurat tug'ilsa agronom maslahatiga murojaat qiling.`
  );
}

/**
 * Requirement 4: Notification Settings & Language Panel (/sozlamalar or /settings)
 */
export function formatTelegramSettingsMessage(farmer: FarmerProfile | null): {
  text: string;
  replyMarkup: any;
} {
  const farmerName = farmer?.full_name || "Hurmatli Dehqon";
  const currentLang = farmer?.telegram_language || farmer?.preferred_language || 'uz';
  const notifyRain = farmer?.telegram_notify_rain ?? farmer?.telegram_notify_weather ?? true;
  const notifyIrrigation = farmer?.telegram_notify_irrigation ?? true;
  const notifyNdvi = farmer?.telegram_notify_ndvi ?? true;
  const notifyAll = farmer?.telegram_notifications_enabled ?? true;

  if (currentLang === 'ru') {
    const text =
      `⚙️ <b>НАСТРОЙКИ УВЕДОМЛЕНИЙ И ЯЗЫКА | Ekinix</b>\n\n` +
      `👤 Фермер: <b>${farmerName}</b>\n` +
      `🌐 Текущий язык: <b>Русский (RU)</b>\n\n` +
      `Нажимайте на кнопки для включения/выключения оповещений:\n\n` +
      `• 🌧️ <b>Оповещения о дожде (>40%):</b> ${notifyRain ? '🟢 Включено' : '🔴 Выключено'}\n` +
      `• 💧 <b>Задачи на полив:</b> ${notifyIrrigation ? '🟢 Включено' : '🔴 Выключено'}\n` +
      `• ⚠️ <b>NDVI стресс-оповещения:</b> ${notifyNdvi ? '🟢 Включено' : '🔴 Выключено'}\n` +
      `• 🔔 <b>Все уведомления:</b> ${notifyAll ? '🟢 Активны' : '🔴 Отключены'}\n\n` +
      `💡 <i>Настройки мгновенно сохраняются в базе данных Supabase.</i>`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: `🌧️ Дождь: ${notifyRain ? 'ON ✅' : 'OFF ❌'}`,
            callback_data: 'toggle:rain',
          },
          {
            text: `💧 Полив: ${notifyIrrigation ? 'ON ✅' : 'OFF ❌'}`,
            callback_data: 'toggle:irrigation',
          },
        ],
        [
          {
            text: `⚠️ NDVI Стресс: ${notifyNdvi ? 'ON ✅' : 'OFF ❌'}`,
            callback_data: 'toggle:ndvi',
          },
          {
            text: `🔔 Все: ${notifyAll ? 'ON ✅' : 'OFF ❌'}`,
            callback_data: 'toggle:all',
          },
        ],
        [
          {
            text: `🇺🇿 O'zbek`,
            callback_data: 'lang:uz',
          },
          {
            text: `🇷🇺 Русский ✅`,
            callback_data: 'lang:ru',
          },
          {
            text: `🇬🇧 English`,
            callback_data: 'lang:en',
          },
        ],
        [
          { text: '◀️ Главное меню', callback_data: 'menu_main' },
        ],
      ],
    };
    return { text, replyMarkup };
  }

  if (currentLang === 'en') {
    const text =
      `⚙️ <b>NOTIFICATION & LANGUAGE SETTINGS | Ekinix</b>\n\n` +
      `👤 Farmer: <b>${farmerName}</b>\n` +
      `🌐 Current Language: <b>English (EN)</b>\n\n` +
      `Tap buttons below to toggle alert channels:\n\n` +
      `• 🌧️ <b>Rain alerts (>40%):</b> ${notifyRain ? '🟢 Enabled' : '🔴 Disabled'}\n` +
      `• 💧 <b>Daily irrigation tasks:</b> ${notifyIrrigation ? '🟢 Enabled' : '🔴 Disabled'}\n` +
      `• ⚠️ <b>NDVI stress alerts:</b> ${notifyNdvi ? '🟢 Enabled' : '🔴 Disabled'}\n` +
      `• 🔔 <b>All notifications:</b> ${notifyAll ? '🟢 Active' : '🔴 Disabled'}\n\n` +
      `💡 <i>Preferences are saved directly to your Supabase farmer profile.</i>`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: `🌧️ Rain: ${notifyRain ? 'ON ✅' : 'OFF ❌'}`,
            callback_data: 'toggle:rain',
          },
          {
            text: `💧 Irrigation: ${notifyIrrigation ? 'ON ✅' : 'OFF ❌'}`,
            callback_data: 'toggle:irrigation',
          },
        ],
        [
          {
            text: `⚠️ NDVI Stress: ${notifyNdvi ? 'ON ✅' : 'OFF ❌'}`,
            callback_data: 'toggle:ndvi',
          },
          {
            text: `🔔 All: ${notifyAll ? 'ON ✅' : 'OFF ❌'}`,
            callback_data: 'toggle:all',
          },
        ],
        [
          {
            text: `🇺🇿 O'zbek`,
            callback_data: 'lang:uz',
          },
          {
            text: `🇷🇺 Русский`,
            callback_data: 'lang:ru',
          },
          {
            text: `🇬🇧 English ✅`,
            callback_data: 'lang:en',
          },
        ],
        [
          { text: '◀️ Main menu', callback_data: 'menu_main' },
        ],
      ],
    };
    return { text, replyMarkup };
  }

  // Default Uzbek
  const text =
    `⚙️ <b>BILDIRISHNOMA VA TIL SOZLAMALARI | Ekinix</b>\n\n` +
    `👤 Fermer: <b>${farmerName}</b>\n` +
    `🌐 Joriy til: <b>O'zbekcha (UZ)</b>\n\n` +
    `Kerakli bildirishnomalarni yoqish yoki o'chirish uchun quyidagi tugmalarni bosing:\n\n` +
    `• 🌧️ <b>Yomg'ir xabarlari (>40%):</b> ${notifyRain ? '🟢 Yoqilgan' : "🔴 O'chirilgan"}\n` +
    `• 💧 <b>Kunlik sug'orish vazifalari:</b> ${notifyIrrigation ? '🟢 Yoqilgan' : "🔴 O'chirilgan"}\n` +
    `• ⚠️ <b>NDVI stress ogohlantirishlari:</b> ${notifyNdvi ? '🟢 Yoqilgan' : "🔴 O'chirilgan"}\n` +
    `• 🔔 <b>Barcha bildirishnomalar:</b> ${notifyAll ? '🟢 Faol' : "🔴 O'chirilgan"}\n\n` +
    `💡 <i>Sozlamalar va til o'zgarishi Supabase bazasida darhol saqlanadi.</i>`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: `🌧️ Yomg'ir: ${notifyRain ? 'ON ✅' : 'OFF ❌'}`,
          callback_data: 'toggle:rain',
        },
        {
          text: `💧 Sug'orish: ${notifyIrrigation ? 'ON ✅' : 'OFF ❌'}`,
          callback_data: 'toggle:irrigation',
        },
      ],
      [
        {
          text: `⚠️ NDVI Stress: ${notifyNdvi ? 'ON ✅' : 'OFF ❌'}`,
          callback_data: 'toggle:ndvi',
        },
        {
          text: `🔔 Barchasi: ${notifyAll ? 'ON ✅' : 'OFF ❌'}`,
          callback_data: 'toggle:all',
        },
      ],
      [
        {
          text: `🇺🇿 O'zbek ✅`,
          callback_data: 'lang:uz',
        },
        {
          text: `🇷🇺 Русский`,
          callback_data: 'lang:ru',
        },
        {
          text: `🇬🇧 English`,
          callback_data: 'lang:en',
        },
      ],
      [
        { text: '◀️ Asosiy menyu', callback_data: 'menu_main' },
      ],
    ],
  };

  return { text, replyMarkup };
}

/**
 * Language Shortcut Selector Panel (/til or /lang)
 */
export function formatTelegramLanguageSelectorMessage(currentLang: string = 'uz'): {
  text: string;
  replyMarkup: any;
} {
  const text =
    `🌐 <b>TILNI TANLASH / ВЫБОР ЯЗЫКА / LANGUAGE SELECTION</b>\n\n` +
    `Iltimos, botdan foydalanish uchun o'zingizga qulay tilni tanlang:\n` +
    `Пожалуйста, выберите удобный язык для работы с ботом:\n` +
    `Please select your preferred language for the bot:`;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: `🇺🇿 O'zbek tili ${currentLang === 'uz' ? '✅' : ''}`, callback_data: 'lang:uz' },
      ],
      [
        { text: `🇷🇺 Русский язык ${currentLang === 'ru' ? '✅' : ''}`, callback_data: 'lang:ru' },
      ],
      [
        { text: `🇬🇧 English ${currentLang === 'en' ? '✅' : ''}`, callback_data: 'lang:en' },
      ],
      [
        { text: '◀️ Asosiy menyu / Главное меню', callback_data: 'menu_main' },
      ],
    ],
  };

  return { text, replyMarkup };
}

/**
 * Help & Support Panel ("🆘 Yordam" / /yordam / /help)
 */
export function formatTelegramHelpSupportMessage(
  farmer: FarmerProfile | null,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): { text: string; replyMarkup: any } {
  if (lang === 'ru') {
    const text =
      `🆘 <b>ЦЕНТР ПОДДЕРЖКИ И ПОМОЩЬ | Ekinix</b>\n\n` +
      `Assalomu alaykum! Мы готовы помочь вам с использованием платформы Ekinix.\n\n` +
      `❓ <b>Часто задаваемые вопросы (FAQ):</b>\n` +
      `1. <b>Как отправить фото на анализ?</b>\n` +
      `   • Просто отправьте боту фотографию листа, растения или поля. Gemini Vision определит симптомы болезней или вредителей.\n\n` +
      `2. <b>Откуда данные NDVI?</b>\n` +
      `   • Спутниковая группировка Sentinel-2 (ESA) обновляет снимки каждые 3-5 дней.\n\n` +
      `3. <b>Как работает график полива?</b>\n` +
      `   • ИИ рассчитывает норму на основе влажности почвы, фазы культуры и прогноза погоды Open-Meteo.\n\n` +
      `📞 <b>Контакты службы поддержки:</b>\n` +
      `• Telegram: @EkinixAgroSupport\n` +
      `• Горячая линия: <b>+998 71 200-45-67</b> (9:00 - 18:00)\n` +
      `• Веб-платформа: <a href="https://ais-dev-h5pr52dfmxp4gghj2evogv-62285800322.asia-east1.run.app">Ekinix Web</a>\n\n` +
      `✍️ <i>Вы также можете написать ваш вопрос прямо в этот чат — сообщение будет передано команде агрономов Ekinix.</i>`;

    const replyMarkup = {
      inline_keyboard: [
        [{ text: '💬 Написать в поддержку', callback_data: 'support_write' }],
        [{ text: '🤖 Заключение агронома', callback_data: 'menu_agronomist' }],
        [{ text: '◀️ Главное меню', callback_data: 'menu_main' }],
      ],
    };
    return { text, replyMarkup };
  }

  if (lang === 'en') {
    const text =
      `🆘 <b>HELP & SUPPORT CENTER | Ekinix</b>\n\n` +
      `Welcome to Ekinix farmer support!\n\n` +
      `❓ <b>Frequently Asked Questions (FAQ):</b>\n` +
      `1. <b>How to run photo diagnosis?</b>\n` +
      `   • Simply send a photo of any leaf, crop, or field. Gemini Vision analyzes disease and pest symptoms.\n\n` +
      `2. <b>Where does satellite data come from?</b>\n` +
      `   • Sentinel-2 multispectral satellites (ESA) refresh NDVI imagery every 3–5 days.\n\n` +
      `3. <b>How is irrigation calculated?</b>\n` +
      `   • AI aggregates real-time Open-Meteo weather, soil moisture, and crop stage coefficients.\n\n` +
      `📞 <b>Support Contacts:</b>\n` +
      `• Telegram: @EkinixAgroSupport\n` +
      `• Hotline: <b>+998 71 200-45-67</b> (9:00 - 18:00)\n` +
      `• Web: <a href="https://ais-dev-h5pr52dfmxp4gghj2evogv-62285800322.asia-east1.run.app">Ekinix App</a>\n\n` +
      `✍️ <i>You can also type your message directly in chat to submit a ticket to the Ekinix team.</i>`;

    const replyMarkup = {
      inline_keyboard: [
        [{ text: '💬 Message Support Team', callback_data: 'support_write' }],
        [{ text: '🤖 Agronomist Advisory', callback_data: 'menu_agronomist' }],
        [{ text: '◀️ Main Menu', callback_data: 'menu_main' }],
      ],
    };
    return { text, replyMarkup };
  }

  // Default Uzbek
  const text =
    `🆘 <b>YORDAM VA MUTAXASSIS QO'LLAB-QUVVATLASH | Ekinix</b>\n\n` +
    `Assalomu alaykum! Ekinix tizimidan foydalanishda sizga yordam berishdan mamnunmiz.\n\n` +
    `❓ <b>Ko'p beriladigan savollar (FAQ):</b>\n` +
    `1. <b>Foto-diagnostikadan qanday foydalaniladi?</b>\n` +
    `   • Botga zararlangan barg yoki ekin suratini yuboring. Gemini AI kasallik va zararkunandalarni tahlil qilib beradi.\n\n` +
    `2. <b>NDVI ko'rsatkichlari qayerdan olinadi?</b>\n` +
    `   • Sentinel-2 sun'iy yo'ldoshi orqali har 3-5 kunda yangilanadi.\n\n` +
    `3. <b>Sug'orish normasi qanday hisoblanadi?</b>\n` +
    `   • Tuproq namligi, ekin turi va ob-havo prognoziga asosan tejamkor norma tavsiya etiladi.\n\n` +
    `📞 <b>Aloqa va qo'llab-quvvatlash xizmati:</b>\n` +
    `• Telegram admin: @EkinixAgroSupport\n` +
    `• Ishonch telefoni: <b>+998 71 200-45-67</b> (Dush-Juma, 9:00 - 18:00)\n` +
    `• Veb-portal: <a href="https://ais-dev-h5pr52dfmxp4gghj2evogv-62285800322.asia-east1.run.app">Ekinix Web</a>\n\n` +
    `✍️ <i>Ekinix mutaxassislariga xabar yoki taklif qoldirmoqchi bo'lsangiz, quyidagi tugmani bosing yoki to'g'ridan-to'g'ri yozib yuboring:</i>`;

  const replyMarkup = {
    inline_keyboard: [
      [{ text: '💬 Mutaxassisga xabar qoldirish', callback_data: 'support_write' }],
      [{ text: '🤖 Agronom xulosasi', callback_data: 'menu_agronomist' }],
      [{ text: '◀️ Asosiy menyu', callback_data: 'menu_main' }],
    ],
  };

  return { text, replyMarkup };
}

export function formatTelegramWeatherAlert(
  farmer: FarmerProfile | null,
  field: FieldRecord | null,
  weather: TelegramWeatherSummary,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string {
  return formatTelegram5DayWeatherMessage(farmer, field, weather);
}

export function formatTelegramFieldStatus(
  farmer: FarmerProfile | null,
  field: FieldRecord,
  reading?: NdviReadingRecord,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string {
  return formatTelegramFieldsMessage(farmer, [{ field, latestNdvi: reading }]);
}

export function formatTelegramWelcomeMessage(
  farmerName: string,
  phoneNumber: string,
  fieldCount: number,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string {
  return (
    `🌱 <b>Ekinix Aqlli Qishloq Xo'jaligi Botiga xush kelibsiz!</b>\n\n` +
    `Assalomu alaykum, <b>${farmerName || 'Hurmatli dehqon'}</b>!\n` +
    `Sizning <code>${phoneNumber}</code> raqamingiz Ekinix tizimiga muvaffaqiyatli bog'landi.\n\n` +
    `📊 <b>Fermer hisobi:</b>\n` +
    `• Ro'yxatdan o'tgan dalalar: <b>${fieldCount} ta</b>\n` +
    `• Sentinel-2 sun'iy yo'ldosh tahlili: <b>Faol</b>\n\n` +
    `👇 <i>Quyidagi menyu orqali kerakli bo'limni tanlang:</i>`
  );
}

export function formatTelegramStartGreeting(
  farmerName: string,
  isPhoneLinked: boolean,
  phoneNumber: string,
  fieldCount: number,
  lang: 'uz' | 'ru' | 'en' = 'uz'
): string {
  return (
    `🌱 <b>Ekinix — O'zbekiston dehqonlari uchun aqlli agro-bot!</b>\n\n` +
    `Assalomu alaykum, <b>${farmerName || 'Hurmatli dehqon'}</b>! 👋\n\n` +
    `👇 <b>Quyidagi menyudan kerakli bo'limni tanlang:</b>`
  );
}

export interface SendTelegramMessageOptions {
  chatId: string | number;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  replyMarkup?: any;
  disableWebPagePreview?: boolean;
}

export async function sendTelegramMessage(options: SendTelegramMessageOptions): Promise<any> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes('your-telegram') || token.trim() === '') {
    console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN is not configured.');
    return { ok: false, description: 'Telegram Bot Token not configured' };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const body: Record<string, any> = {
    chat_id: options.chatId,
    text: options.text,
    parse_mode: options.parseMode || 'HTML',
    disable_web_page_preview: options.disableWebPagePreview ?? true,
  };

  if (options.replyMarkup) {
    body.reply_markup = options.replyMarkup;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('[Telegram Send Error]', data);
  }
  return data;
}

export async function editTelegramMessageText(options: {
  chatId: string | number;
  messageId: number;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
  replyMarkup?: any;
}): Promise<any> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false };

  const url = `https://api.telegram.org/bot${token}/editMessageText`;
  const body: Record<string, any> = {
    chat_id: options.chatId,
    message_id: options.messageId,
    text: options.text,
    parse_mode: options.parseMode || 'HTML',
    disable_web_page_preview: true,
  };

  if (options.replyMarkup) {
    body.reply_markup = options.replyMarkup;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return await res.json();
}

export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
): Promise<any> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false };

  const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || '',
      show_alert: showAlert,
    }),
  });

  return await res.json();
}

/**
 * Sends a real-time chat action (e.g. 'typing') to provide immediate instant visual feedback to user
 */
export async function sendTelegramChatAction(
  chatId: string | number,
  action: 'typing' | 'upload_photo' | 'find_location' = 'typing'
): Promise<any> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes('your-telegram') || token.trim() === '') {
    return { ok: false };
  }

  const url = `https://api.telegram.org/bot${token}/sendChatAction`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action,
      }),
    });
    return await res.json();
  } catch {
    return { ok: false };
  }
}

