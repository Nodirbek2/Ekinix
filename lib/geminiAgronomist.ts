import { GoogleGenAI } from '@google/genai';
import { FieldRecord, NdviReadingRecord, FarmerProfile } from './supabase';
import { TelegramWeatherSummary, FieldWithTelemetry, getCropNameUz } from './telegramBot';

export interface AgronomistReport {
  fieldId: string;
  fieldName: string;
  cropType: string;
  areaHectares: number;
  ndviScore: number;
  ndviTrend: 'rising' | 'stable' | 'declining' | 'unknown';
  moisturePercentage: number;
  executiveSummary: string;
  growthStageText: string;
  weatherImpact: string;
  actionItems: string[];
  irrigationAdvice: string;
  agronomistTip: string;
  generatedAt: string;
  isCached?: boolean;
  source: 'gemini-3.7-flash' | 'expert_heuristic' | 'cache';
}

// In-Memory Agronomist Summary Cache (4 hours TTL)
interface CacheEntry {
  report: AgronomistReport;
  expiresAt: number;
  dataHash: string;
}

const agronomistCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Generate or retrieve cached Gemini agronomist summary for a specific field
 */
export async function getOrGenerateAgronomistSummary(params: {
  field: FieldRecord;
  latestNdvi?: NdviReadingRecord | null;
  previousNdvi?: NdviReadingRecord | null;
  weather: TelegramWeatherSummary;
  farmer?: FarmerProfile | null;
  forceRefresh?: boolean;
  lang?: 'uz' | 'ru' | 'en';
}): Promise<AgronomistReport> {
  const {
    field,
    latestNdvi,
    previousNdvi,
    weather,
    forceRefresh = false,
    lang = 'uz',
  } = params;

  const currentNdvi = latestNdvi?.ndvi_score ?? 0.72;
  const prevNdvi = previousNdvi?.ndvi_score;
  let ndviTrend: 'rising' | 'stable' | 'declining' | 'unknown' = 'unknown';

  if (prevNdvi !== undefined && prevNdvi !== null) {
    const diff = currentNdvi - prevNdvi;
    if (diff > 0.03) ndviTrend = 'rising';
    else if (diff < -0.03) ndviTrend = 'declining';
    else ndviTrend = 'stable';
  }

  const moisture = latestNdvi?.moisture_percentage ?? (weather.isRainExpected ? 65 : 48);
  const dataHash = `${field.id}_${currentNdvi.toFixed(2)}_${latestNdvi?.satellite_date || ''}_${weather.tempMax}_${weather.rainProb}_${lang}`;
  const cacheKey = `agro_${field.id}_${lang}`;

  // 1. Check in-memory cache
  const cached = agronomistCache.get(cacheKey);
  const now = Date.now();
  if (
    !forceRefresh &&
    cached &&
    cached.expiresAt > now &&
    cached.dataHash === dataHash
  ) {
    return {
      ...cached.report,
      isCached: true,
    };
  }

  // 2. Build agronomic prompt for Gemini
  const cropNameUz = getCropNameUz(field.crop_type);
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `Siz O'zbekistonning tajribali yetakchi agronomi va Ekinix sun'iy intellekt tahlilchisisiz.
Quyidagi dala va ob-havo ma'lumotlari asosida fermer uchun qisqa, tushunarli va amaliy agronomik xulosa tayyorlang.

DALA VA SUN'IY YO'LDOSH MA'LUMOTLARI:
- Maydon: "${field.name}"
- Ekin turi: ${cropNameUz} (${field.crop_type})
- Maydon hajmi: ${field.area_hectares || 10} gektar
- Hudud: ${field.region || "Farg'ona vodiysi"}
- Ekish sanasi: ${field.planting_date || "2026-04-10"}
- Sun'iy yo'ldosh NDVI ko'rsatkichi: ${currentNdvi.toFixed(2)} (0.1 dan 0.9 gacha, o'sish holati: ${currentNdvi >= 0.65 ? "Yaxshi/Yuqori" : currentNdvi >= 0.45 ? "O'rtacha" : "Stress/Past"})
- NDVI dinamikasi (oxirgi o'lchovlarga nisbatan): ${ndviTrend === 'rising' ? "O'smoqda ↗" : ndviTrend === 'declining' ? "Pasaymoqda ↘" : "Barqaror →"}
- Tuproq namlik darajasi: ${moisture}%
- Bugungi ob-havo: Kunduzgi +${weather.tempMax}°C, tungi +${weather.tempMin}°C, yog'ingarchilik ehtimoli ${weather.rainProb}%, shamol ${weather.windSpeedKmh} km/soat.

TALABLAR:
1. Javob faqat sof JSON formatida bo'lsin.
2. Til: O'zbek tili (Lotin yozuvida, fermer tushunadigan sodda va samimiy so'zlar).
3. Matnlar lo'nda va ixcham bo'lsin (Telegram messenjerida o'qish qulay bo'lishi uchun, ortiqcha cho'zma gaplarsiz).

JSON FORMAT:
{
  "executiveSummary": "Maydonning hozirgi holati bo'yicha 2 jumlali aniq va tushunarli umumiy xulosa.",
  "growthStageText": "Ekinning joriy o'sish bosqichi (masalan: Paxta shonalash va gullash arafasida).",
  "weatherImpact": "Bugungi +${weather.tempMax}°C harorat va ob-havoning ekinga ta'siri (1 ta qisqa jumla).",
  "actionItems": [
    "Sug'orish: Aniq vaqt va me'yor (masalan: Kechki 19:30 dan so'ng 70-80 m³/ga).",
    "Oziqlantirish: Kerakli o'g'it yoki mikroelement (masalan: Kaliy va fosfor bilan oziqlantirish).",
    "Himoya/Nazorat: Zararkunanda yoki kasallik nazorati (masalan: G'o'za tunlami va tripsga qarshi ko'rik)."
  ],
  "irrigationAdvice": "Tavsiya etiladigan sug'orish normasi va vaqti.",
  "agronomistTip": "Fermer uchun 1 ta amaliy va foydali maslahat."
}`;

  let report: AgronomistReport;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          temperature: 0.25,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');

      report = {
        fieldId: field.id,
        fieldName: field.name,
        cropType: field.crop_type,
        areaHectares: field.area_hectares || 10,
        ndviScore: currentNdvi,
        ndviTrend,
        moisturePercentage: moisture,
        executiveSummary:
          parsed.executiveSummary ||
          `«${field.name}» maydonida ${cropNameUz} vegetatsiyasi yaxshi holatda. NDVI ko'rsatkichi (${currentNdvi.toFixed(2)}) ekin biomassasining barqaror rivojlanayotganini ko'rsatmoqda.`,
        growthStageText:
          parsed.growthStageText || `${cropNameUz} faol rivojlanish va barg yozish bosqichida.`,
        weatherImpact:
          parsed.weatherImpact ||
          `Kunduzgi +${weather.tempMax}°C issiqlik tufayli suv bug'lanishi kuchaymoqda, kechki sug'orish tavsiya etiladi.`,
        actionItems:
          Array.isArray(parsed.actionItems) && parsed.actionItems.length > 0
            ? parsed.actionItems
            : [
                `Sug'orish: Kechki salqinda 65-75 m³/ga me'yorda suv bering.`,
                `Oziqlantirish: Fosfor va kaliy bilan bargdan oziqlantirish o'tkazing.`,
                `Nazorat: Dala chetlarida trips va o'rgimchakkanaga qarshi ko'rik o'tkazing.`,
              ],
        irrigationAdvice:
          parsed.irrigationAdvice ||
          `Kechki 19:30 dan so'ng 65-75 m³/ga me'yorda tomchilatib sug'orish.`,
        agronomistTip:
          parsed.agronomistTip ||
          `Issiq kunlarda kunduzi sug'ormang — suvning 40% bug'lanib ketadi va ildiz qizib ketishi mumkin.`,
        generatedAt: new Date().toISOString(),
        source: 'gemini-3.7-flash',
      };
    } catch (apiErr) {
      console.warn('[Gemini Agronomist API Error - Using Expert Fallback]', apiErr);
      report = generateExpertHeuristicReport(field, currentNdvi, ndviTrend, moisture, weather);
    }
  } else {
    report = generateExpertHeuristicReport(field, currentNdvi, ndviTrend, moisture, weather);
  }

  // 3. Store in cache
  agronomistCache.set(cacheKey, {
    report,
    expiresAt: now + CACHE_TTL_MS,
    dataHash,
  });

  return report;
}

/**
 * Domain-grounded fallback agronomic report when API is offline or key missing
 */
function generateExpertHeuristicReport(
  field: FieldRecord,
  ndviScore: number,
  ndviTrend: 'rising' | 'stable' | 'declining' | 'unknown',
  moisture: number,
  weather: TelegramWeatherSummary
): AgronomistReport {
  const cropNameUz = getCropNameUz(field.crop_type);
  const normCrop = (field.crop_type || '').toLowerCase();

  let growthStage = `${cropNameUz} faol vegetatsiya davrida`;
  let execSummary = `«${field.name}» maydonida ${cropNameUz} rivojlanishi me'yorida. Sun'iy yo'ldosh NDVI ko'rsatkichi (${ndviScore.toFixed(2)}) ekin salomatligi barqarorligini tasdiqlaydi.`;
  let actions: string[] = [];
  let irrigation = `Kechki 19:30 dan so'ng 70 m³/ga`;
  let tip = `Kechki paytda sug'orish suvni 35-40% tejaydi va ekin ildiziga to'liq yetib boradi.`;

  if (normCrop.includes('cotton') || normCrop.includes('paxta') || normCrop.includes("g'o'za")) {
    growthStage = "G'o'za shonalash va gullashga tayyorgarlik pallasida";
    if (ndviScore < 0.5) {
      execSummary = `«${field.name}» paxtazorida biomassada biroz sustlik kuzatilmoqda (NDVI: ${ndviScore.toFixed(2)}). Suv va mikroelementlar yetishmovchiligini bartaraf etish zarur.`;
      actions = [
        "Sug'orish: Kechki salqinda 75-80 m³/ga me'yorda namlikni to'ldiring.",
        "Oziqlantirish: Azot va rux-bor mikroelementlari bilan bargdan purkang.",
        "Nazorat: G'o'za tunlami tuxum qo'yishini aniqlash uchun feromon tutqichlarni ko'ring.",
      ];
    } else {
      actions = [
        "Sug'orish: Kechki 19:30 dan so'ng 65-70 m³/ga me'yorda sug'orish o'tkazing.",
        "Oziqlantirish: Shonalashni kuchaytirish uchun fosfor-kaliy o'g'itlarini bering.",
        "Nazorat: Pastki barglarda trips va o'rgimchakkana alomatlarini tekshiring.",
      ];
    }
    tip = "G'o'za gullash davrida fosforli ozuqalar ko'saklar to'kilishini 25% ga kamaytiradi.";
  } else if (normCrop.includes('wheat') || normCrop.includes("bug'doy")) {
    growthStage = "Bug'doy don to'lishish va pishish arafasida";
    actions = [
      "Sug'orish: Don to'lishi uchun 50-60 m³/ga me'yorda yengil sug'oring.",
      "Oziqlantirish: Kaliy sulfat o'g'itini berish don vaznini oshiradi.",
      "Nazorat: Sariq va qo'ng'ir zang kasalliklariga qarshi monitoring o'tkazing.",
    ];
    tip = "Pishish davrida ortiqcha suv berish yotib qolish xavfini oshiradi, me'yorga qat'iy rioya qiling.";
  } else {
    actions = [
      `Sug'orish: Kunduzgi +${weather.tempMax}°C issiqlikni hisobga olib, kechqurun 60-70 m³/ga sug'oring.`,
      "Oziqlantirish: Kompleks NPK mikroelementlari bilan ildizdan yoki bargdan oziqlantiring.",
      "Nazorat: Barg osti va ildiz bo'g'zini zararkunandalarga tekshiring.",
    ];
  }

  const weatherImpact = weather.isRainExpected
    ? `Yaqin 48 soatda yomg'ir ehtimoli (${weather.rainProb}%) bor, navbatdagi sug'orishni kechiktirish mumkin.`
    : `Kunduzgi +${weather.tempMax}°C haroratda o'simlikda transpiratsiya yuqori, ildiz qatlami namligini saqlang.`;

  return {
    fieldId: field.id,
    fieldName: field.name,
    cropType: field.crop_type,
    areaHectares: field.area_hectares || 10,
    ndviScore,
    ndviTrend,
    moisturePercentage: moisture,
    executiveSummary: execSummary,
    growthStageText: growthStage,
    weatherImpact,
    actionItems: actions,
    irrigationAdvice: irrigation,
    agronomistTip: tip,
    generatedAt: new Date().toISOString(),
    source: 'expert_heuristic',
  };
}

/**
 * Format a clean, elegant Telegram HTML message for the Agronomist Field Report
 */
export function formatTelegramAgronomistFieldReport(
  report: AgronomistReport,
  hasMultipleFields: boolean = false
): { text: string; replyMarkup: any } {
  const cropNameUz = getCropNameUz(report.cropType);
  const trendEmoji =
    report.ndviTrend === 'rising' ? '↗️' : report.ndviTrend === 'declining' ? '↘️' : '➡️';
  const ndviBadge =
    report.ndviScore >= 0.65
      ? '🟢 Yuqori'
      : report.ndviScore >= 0.45
      ? "🟡 O'rtacha"
      : '🔴 Past';

  const actionBullets = report.actionItems
    .map((item) => `• <b>${item.split(':')[0] || 'Tavsiya'}:</b> ${item.split(':').slice(1).join(':').trim() || item}`)
    .join('\n');

  const text =
    `🤖 <b>AGRONOM XULOSASI: ${report.fieldName.toUpperCase()}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🌱 <b>Ekin:</b> ${cropNameUz} (${report.areaHectares} ga)\n` +
    `🛰️ <b>NDVI indeksi:</b> <b>${report.ndviScore.toFixed(2)}</b> ${trendEmoji} (${ndviBadge})\n` +
    `💧 <b>Tuproq namligi:</b> ~${report.moisturePercentage}%\n` +
    `🌿 <b>Bosqich:</b> <i>${report.growthStageText}</i>\n\n` +
    `📊 <b>UMUMIY TAHLIL:</b>\n` +
    `${report.executiveSummary}\n\n` +
    `⛅ <b>OB-HAVO TA'SIRI:</b>\n` +
    `${report.weatherImpact}\n\n` +
    `🎯 <b>AMALIY KO'RSATMALAR:</b>\n` +
    `${actionBullets}\n\n` +
    `💡 <i><b>Agronom maslahati:</b> ${report.agronomistTip}</i>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ <i>AI Ekinix Agronomist ${report.source === 'gemini-3.7-flash' ? '(Gemini 3.7 Flash)' : ''}</i>`;

  const inline_keyboard: any[][] = [];

  // Action row 1
  const row1: any[] = [];
  if (hasMultipleFields) {
    row1.push({ text: '🌾 Boshqa maydon', callback_data: 'agro_select_field' });
  }
  row1.push({ text: '🔄 Yangilash', callback_data: `agro_refresh:${report.fieldId}` });
  inline_keyboard.push(row1);

  // Action row 2: Links to Irrigation & Fields
  inline_keyboard.push([
    { text: "💧 Sug'orish jadvali", callback_data: 'menu_irrigation' },
    { text: '🌾 Mening dalalarim', callback_data: 'menu_fields' },
  ]);

  return {
    text,
    replyMarkup: { inline_keyboard },
  };
}

/**
 * Format Field Selection Menu when the farmer owns multiple fields
 */
export function formatTelegramFieldSelectionMenu(
  fieldsWithTelemetry: FieldWithTelemetry[],
  farmerName: string
): { text: string; replyMarkup: any } {
  const text =
    `🤖 <b>AGRONOM XULOSASI | Maydonni tanlang</b>\n\n` +
    `Hurmatli <b>${farmerName}</b>, sizning hisobingizda <b>${fieldsWithTelemetry.length} ta</b> maydon mavjud.\n\n` +
    `Sun'iy yo'ldosh va ob-havo asosidagi chuqur tahlilni olish uchun quyidagi maydonlardan birini tanlang:`;

  const inline_keyboard: any[][] = [];

  fieldsWithTelemetry.forEach((item, idx) => {
    const f = item.field;
    const cropUz = getCropNameUz(f.crop_type);
    const ndvi = item.latestNdvi?.ndvi_score?.toFixed(2) || '0.70';
    inline_keyboard.push([
      {
        text: `🌾 ${idx + 1}. ${f.name} (${cropUz} • NDVI: ${ndvi})`,
        callback_data: `agro_field:${f.id}`,
      },
    ]);
  });

  // Also an option for all fields overview
  inline_keyboard.push([
    { text: '📊 Barcha maydonlar umumiy sharhi', callback_data: 'agro_field:all' },
  ]);

  inline_keyboard.push([
    { text: '🌦 Ob-havo', callback_data: 'menu_weather' },
    { text: "💧 Sug'orish jadvali", callback_data: 'menu_irrigation' },
  ]);

  return {
    text,
    replyMarkup: { inline_keyboard },
  };
}
