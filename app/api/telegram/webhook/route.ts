import { NextRequest, NextResponse } from 'next/server';
import {
  normalizePhoneNumber,
  fetchLiveWeather,
  getFieldCoordinates,
  formatTelegram5DayWeatherMessage,
  formatTelegramFieldsMessage,
  formatTelegramAgronomistMessage,
  formatTelegramIrrigationScheduleMessage,
  formatTelegramSettingsMessage,
  formatTelegramLanguageSelectorMessage,
  formatTelegramHelpSupportMessage,
  getFarmerReplyKeyboard,
  getMainMenuInlineKeyboard,
  getOnboardingContactReplyKeyboard,
  getRegionSelectionInlineKeyboard,
  getCropSelectionInlineKeyboard,
  CROP_SELECTION_OPTIONS,
  sendTelegramMessage,
  sendTelegramChatAction,
  answerTelegramCallbackQuery,
  editTelegramMessageText,
  FieldWithTelemetry,
  getTelegramBotToken,
  getAppProductionUrl,
  getFarmerOnboardingFieldsInlineKeyboard,
  formatTelegramExistingFieldsMenu,
  formatTelegramSingleFieldDetailMessage,
} from '@/lib/telegramBot';
import {
  getOrGenerateAgronomistSummary,
  formatTelegramAgronomistFieldReport,
  formatTelegramFieldSelectionMenu,
} from '@/lib/geminiAgronomist';
import {
  downloadTelegramPhotoAsBase64,
  diagnoseCropPhotoWithGemini,
  formatTelegramPhotoDiagnosisMessage,
} from '@/lib/geminiPhotoDiagnosis';
import {
  supabase,
  isSupabaseConfigured,
  FarmerProfile,
  FieldRecord,
  NdviReadingRecord,
} from '@/lib/supabase';

/**
 * Persistent registration session helpers backed by Supabase `telegram_sessions` table.
 *
 * SQL to run once in Supabase SQL Editor:
 * -----------------------------------------------------------------------
 * CREATE TABLE IF NOT EXISTS public.telegram_sessions (
 *   chat_id      TEXT PRIMARY KEY,
 *   phone        TEXT NOT NULL,
 *   full_name    TEXT NOT NULL,
 *   region       TEXT,
 *   step         TEXT NOT NULL DEFAULT 'ask_region',
 *   created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;
 * -- Service role (used server-side) bypasses RLS, so no extra policy needed.
 * -----------------------------------------------------------------------
 */
async function upsertRegistrationSession(chatId: string, data: {
  phone?: string;
  full_name?: string;
  region?: string;
  step: 'ask_region' | 'ask_crop';
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('telegram_sessions').upsert(
      { chat_id: chatId, ...data },
      { onConflict: 'chat_id' }
    );
  } catch (err) {
    console.error('[Supabase upsertRegistrationSession error]', err);
  }
}

async function getRegistrationSession(chatId: string): Promise<{
  phone: string;
  full_name: string;
  region?: string;
  step: string;
} | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('telegram_sessions')
      .select('phone, full_name, region, step')
      .eq('chat_id', chatId)
      .maybeSingle();
    if (error) {
      console.error('[Supabase getRegistrationSession error]', error);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('[Supabase getRegistrationSession exception]', err);
    return null;
  }
}

async function deleteRegistrationSession(chatId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('telegram_sessions').delete().eq('chat_id', chatId);
  } catch (err) {
    console.error('[Supabase deleteRegistrationSession error]', err);
  }
}

// Short-term cache for Farmer & Fields Telemetry (60-second TTL per instance).
// NOTE: This is intentionally kept for within-request and warm-instance deduplication
// (avoids redundant DB roundtrips within a single request). It is NOT relied upon
// for cross-request state correctness — every cold start fetches fresh from Supabase.
interface FarmerTelemetryCacheEntry {
  data: {
    farmer: FarmerProfile | null;
    fieldsWithTelemetry: FieldWithTelemetry[];
    isRealDbRecord: boolean;
  };
  timestamp: number;
}
const farmerTelemetryCache = new Map<string, FarmerTelemetryCacheEntry>();
const FARMER_CACHE_TTL_MS = 60 * 1000; // 60 seconds

function invalidateFarmerCache(chatId?: string | number, phone?: string) {
  if (chatId) farmerTelemetryCache.delete(`chat:${chatId}`);
  if (phone) {
    const norm = normalizePhoneNumber(phone);
    farmerTelemetryCache.delete(`phone:${norm}`);
  }
}

/**
 * Finds a farmer, their real fields, latest NDVI telemetry, and watering logs from Supabase
 * Optimizations:
 * 1. 60-second in-memory caching to eliminate redundant roundtrips.
 * 2. Parallelized Promise.all query execution for all field NDVI and watering records.
 */
async function getFarmerAndTelemetryData(
  chatId: string | number,
  phone?: string
): Promise<{
  farmer: FarmerProfile | null;
  fieldsWithTelemetry: FieldWithTelemetry[];
  isRealDbRecord: boolean;
  timing: { farmerDbMs: number; fieldsDbMs: number };
}> {
  const cacheKey = phone ? `phone:${normalizePhoneNumber(phone)}` : `chat:${chatId}`;
  const cached = farmerTelemetryCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < FARMER_CACHE_TTL_MS) {
    return {
      ...cached.data,
      timing: { farmerDbMs: 0, fieldsDbMs: 0 },
    };
  }

  let farmer: FarmerProfile | null = null;
  const fieldsWithTelemetry: FieldWithTelemetry[] = [];
  let isRealDbRecord = false;

  let farmerDbMs = 0;
  let fieldsDbMs = 0;

  if (isSupabaseConfigured && supabase) {
    try {
      const t0Farmer = performance.now();

      // 1. Check by phone number if provided
      if (phone) {
        const norm = normalizePhoneNumber(phone);
        const national = norm.slice(-9);
        const { data: farmerData } = await supabase
          .from('farmers')
          .select('*')
          .or(`phone.eq.+${norm},phone.eq.${norm},phone.ilike.%${national}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (farmerData) {
          farmer = farmerData as FarmerProfile;
          isRealDbRecord = true;
        }
      }

      // 2. Check by telegram_chat_id
      if (!farmer) {
        const { data: farmerData } = await supabase
          .from('farmers')
          .select('*')
          .eq('telegram_chat_id', String(chatId))
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (farmerData) {
          farmer = farmerData as FarmerProfile;
          isRealDbRecord = true;
        }
      }

      farmerDbMs = performance.now() - t0Farmer;

      // 3. Fetch real fields and latest NDVI + watering logs concurrently in parallel
      if (farmer) {
        const t0Fields = performance.now();
        const { data: fieldsData } = await supabase
          .from('fields')
          .select('*')
          // fields table has NO user_id column — filter exclusively by farmer_id
          .eq('farmer_id', farmer.id)
          .order('created_at', { ascending: false });

        const fieldsList = (fieldsData as FieldRecord[]) || [];

        if (fieldsList.length > 0) {
          // Parallelized queries for all fields
          const telemetryPromises = fieldsList.map(async (field) => {
            let latestNdvi: NdviReadingRecord | null = null;
            let previousNdvi: NdviReadingRecord | null = null;
            let lastWateredDate: string | null = null;

            const [ndviResult, waterResult] = await Promise.all([
              (async () => {
                try {
                  const { data } = await supabase!
                    .from('ndvi_readings')
                    .select('*')
                    .eq('field_id', field.id)
                    .order('satellite_date', { ascending: false })
                    .limit(2);
                  return (data as NdviReadingRecord[]) || null;
                } catch {
                  return null;
                }
              })(),
              (async () => {
                try {
                  const { data } = await supabase!
                    .from('watering_log')
                    .select('*')
                    .eq('field_id', field.id)
                    .order('watered_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                  return data;
                } catch {
                  return null;
                }
              })(),
            ]);

            if (ndviResult && ndviResult.length > 0) {
              latestNdvi = ndviResult[0];
              if (ndviResult.length > 1) {
                previousNdvi = ndviResult[1];
              }
            }

            if (waterResult && (waterResult.watered_at || waterResult.created_at)) {
              lastWateredDate = waterResult.watered_at || waterResult.created_at;
            }

            return {
              field,
              latestNdvi,
              previousNdvi,
              lastWateredDate,
            };
          });

          const results = await Promise.all(telemetryPromises);
          fieldsWithTelemetry.push(...results);
        }

        fieldsDbMs = performance.now() - t0Fields;
      }
    } catch (err) {
      console.warn('[DB Lookup Error in Telegram Webhook]', err);
    }
  }

  const resultData = { farmer, fieldsWithTelemetry, isRealDbRecord };
  farmerTelemetryCache.set(cacheKey, { data: resultData, timestamp: now });

  return {
    ...resultData,
    timing: { farmerDbMs, fieldsDbMs },
  };
}

export async function POST(req: NextRequest) {
  // =========================================================================
  // SECURITY: Verify Telegram Webhook Secret Token
  // =========================================================================
  const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
  if (!secretHeader || secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reqStart = performance.now();

  try {
    const body = await req.json();

    // =========================================================================
    // 1. HANDLE INLINE CALLBACK QUERIES
    // =========================================================================
    if (body.callback_query) {
      const cq = body.callback_query;
      const callbackId = cq.id;
      const data = cq.data || '';
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;
      const fromUser = cq.from || {};
      const telegramUsername = fromUser.username ? `@${fromUser.username}` : '';
      const userFirstName = fromUser.first_name || '';
      const userLastName = fromUser.last_name || '';
      const userFullName = `${userFirstName} ${userLastName}`.trim() || 'Hurmatli Dehqon';

      // Immediate visual feedback: send 'typing' chat action and answer callback query concurrently
      const t0Typing = performance.now();
      const typingPromise = chatId ? sendTelegramChatAction(chatId, 'typing').catch(() => {}) : Promise.resolve();

      // 1A. Region Selection during in-bot registration
      if (data.startsWith('reg:')) {
        const selectedRegion = data.replace('reg:', '').trim();

        // Retrieve existing session from DB (may have phone/full_name from step 1)
        const existingSession = await getRegistrationSession(String(chatId));

        // Upsert the updated state (region + advance step) into Supabase
        await upsertRegistrationSession(String(chatId), {
          phone: existingSession?.phone || '998901234567',
          full_name: existingSession?.full_name || userFullName,
          region: selectedRegion,
          step: 'ask_crop',
        });

        await Promise.all([
          answerTelegramCallbackQuery(callbackId, `📍 ${selectedRegion} tanlandi!`, false),
          typingPromise,
        ]);

        const cropPrompt =
          `🌱 <b>Ro'yxatdan o'tish (2-qadam / 2)</b>\n\n` +
          `📍 Tanlangan hudud: <b>${selectedRegion}</b> ✅\n\n` +
          `🌾 Yetishtiradigan asosiy <b>ekin turingizni</b> tanlang:`;

        if (messageId) {
          await editTelegramMessageText({
            chatId,
            messageId,
            text: cropPrompt,
            replyMarkup: getCropSelectionInlineKeyboard(),
          });
        } else {
          await sendTelegramMessage({
            chatId,
            text: cropPrompt,
            replyMarkup: getCropSelectionInlineKeyboard(),
          });
        }

        console.log(`[Telegram Latency] Callback "reg" handled in ${(performance.now() - reqStart).toFixed(1)}ms`);
        return NextResponse.json({ ok: true, action: 'region_selected' });
      }

      // 1B. Crop Selection -> Complete Registration and Create Farmer in Supabase
      if (data.startsWith('crop:')) {
        const cropId = data.replace('crop:', '').trim();
        const cropOption = CROP_SELECTION_OPTIONS.find((c) => c.id === cropId);
        const cropName = cropOption ? cropOption.nameUz : cropId;

        // Retrieve persisted session from Supabase (survives serverless cold starts)
        const session = await getRegistrationSession(String(chatId));
        const finalPhone = session?.phone ? `+${session.phone}` : '+998901234567';
        const finalName = session?.full_name || userFullName;
        const finalRegion = session?.region || 'Toshkent viloyati';

        // Save to Supabase farmers table
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('farmers').insert({
              full_name: finalName,
              phone: finalPhone,
              region: finalRegion,
              primary_crops: [cropName],
              farm_type: 'smallholder',
              telegram_chat_id: String(chatId),
              telegram_username: telegramUsername,
              telegram_linked_at: new Date().toISOString(),
              telegram_notifications_enabled: true,
              tier: 'standart',
            });
            invalidateFarmerCache(chatId, finalPhone);
          } catch (dbErr) {
            console.error('[Supabase in-bot registration error]', dbErr);
          }
        }

        // Delete the now-complete session from the DB
        await deleteRegistrationSession(String(chatId));

        await Promise.all([
          answerTelegramCallbackQuery(callbackId, `🎉 Ro'yxatdan muvaffaqiyatli o'tdingiz!`, false),
          typingPromise,
        ]);

        const successMsg =
          `🎉 <b>Tabriklaymiz, ${finalName}!</b>\n\n` +
          `Siz Ekinix aqlli agro-platformasida muvaffaqiyatli ro'yxatdan o'tdingiz!\n\n` +
          `📋 <b>Profilingiz:</b>\n` +
          `• 👤 Fermer: <b>${finalName}</b>\n` +
          `• 📱 Telefon: <code>${finalPhone}</code>\n` +
          `• 📍 Hudud: <b>${finalRegion}</b>\n` +
          `• 🌱 Asosiy ekin: <b>${cropName}</b>\n\n` +
          `📌 <i>Ekinix imkoniyatlaridan to'liq foydalanish uchun birinchi ekin maydoningizni qo'shing:</i>`;

        await Promise.all([
          sendTelegramMessage({
            chatId,
            text: successMsg,
            replyMarkup: getFarmerOnboardingFieldsInlineKeyboard(0),
          }),
          sendTelegramMessage({
            chatId,
            text: `Menyudan foydalanishingiz mumkin:`,
            replyMarkup: getFarmerReplyKeyboard(),
          }),
        ]);

        console.log(`[Telegram Latency] Registration completed in ${(performance.now() - reqStart).toFixed(1)}ms`);
        return NextResponse.json({ ok: true, action: 'registration_completed' });
      }

      // 1C. WATERING TASK CONFIRMATION (Inline button: "✅ Sug'orildi deb belgilash")
      if (data.startsWith('water:')) {
        const parts = data.split(':');
        const fieldId = parts[1] || 'f1';
        const volumeM3 = Number(parts[2]) || 35;

        // Fetch field name if possible
        let fieldName = 'Dala';
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: fieldData } = await supabase
              .from('fields')
              .select('name')
              .eq('id', fieldId)
              .maybeSingle();
            if (fieldData?.name) fieldName = fieldData.name;
          } catch (fieldErr) {
            console.error('[Webhook] Failed to fetch field name for watering log', fieldId, fieldErr);
          }
        }

        // Write directly to Supabase `watering_log` table
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('watering_log').insert({
              field_id: fieldId,
              watered_at: new Date().toISOString(),
              water_volume_m3: volumeM3,
              method: 'drip',
              notes: "Telegram bot orqali tasdiqlandi",
            });
          } catch (dbErr) {
            console.error('[Supabase watering_log insert error]', dbErr);
          }
        }

        const nowFormatted = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        const dateFormatted = new Date().toLocaleDateString('uz-UZ');

        await Promise.all([
          answerTelegramCallbackQuery(callbackId, `✅ Sug'orildi deb belgilandi va jurnalga yozildi!`, false),
          typingPromise,
        ]);

        const confirmationMsg =
          `✅ <b>BAJARILDI: DALA SUG'ORILDI DEB BELGILANDI!</b>\n\n` +
          `📍 <b>Dala:</b> <b>${fieldName}</b>\n` +
          `💧 <b>Berilgan suv hajmi:</b> <b>${volumeM3} m³/ga</b>\n` +
          `⏰ <b>Qayd etilgan vaqt:</b> ${nowFormatted} (${dateFormatted})\n` +
          `📝 <i>Ma'lumot Supabase sug'orish jurnaliga (watering_log) muvaffaqiyatli saqlandi.</i>`;

        if (messageId) {
          await editTelegramMessageText({
            chatId,
            messageId,
            text: confirmationMsg,
            replyMarkup: {
              inline_keyboard: [
                [{ text: '✅ Qayd etildi (Bajarildi)', callback_data: 'water_done' }],
                [{ text: '🌾 Mening dalalarim', callback_data: 'menu_fields' }],
              ],
            },
          });
        }

        console.log(`[Telegram Latency] Watering task marked in ${(performance.now() - reqStart).toFixed(1)}ms`);
        return NextResponse.json({ ok: true, action: 'watering_logged', fieldId, volumeM3 });
      }

      if (data === 'water_done') {
        await answerTelegramCallbackQuery(callbackId, `Bu sug'orish vazifasi allaqachon bajarilgan va qayd etilgan.`, false);
        return NextResponse.json({ ok: true });
      }

      // 1D. NOTIFICATION SETTINGS TOGGLE (Rain, Irrigation, NDVI, Master All)
      if (data.startsWith('toggle:')) {
        const toggleType = data.replace('toggle:', '').trim(); // 'rain' | 'irrigation' | 'ndvi' | 'all'
        const farmerData = await getFarmerAndTelemetryData(chatId);
        const { farmer } = farmerData;

        let currentRain = farmer?.telegram_notify_rain ?? farmer?.telegram_notify_weather ?? true;
        let currentIrrigation = farmer?.telegram_notify_irrigation ?? true;
        let currentNdvi = farmer?.telegram_notify_ndvi ?? true;
        let currentAll = farmer?.telegram_notifications_enabled ?? true;

        if (toggleType === 'rain') currentRain = !currentRain;
        if (toggleType === 'irrigation') currentIrrigation = !currentIrrigation;
        if (toggleType === 'ndvi') currentNdvi = !currentNdvi;
        if (toggleType === 'all') currentAll = !currentAll;

        const updatedFarmer: FarmerProfile = {
          id: farmer?.id || 'demo_farmer',
          full_name: farmer?.full_name || 'Hurmatli Dehqon',
          phone: farmer?.phone || '+998901234567',
          region: farmer?.region || 'Toshkent viloyati',
          telegram_chat_id: String(chatId),
          telegram_notifications_enabled: currentAll,
          telegram_notify_weather: currentRain,
          telegram_notify_rain: currentRain,
          telegram_notify_irrigation: currentIrrigation,
          telegram_notify_ndvi: currentNdvi,
        };

        if (isSupabaseConfigured && supabase && farmer?.id) {
          try {
            await supabase
              .from('farmers')
              .update({
                telegram_notifications_enabled: currentAll,
                telegram_notify_weather: currentRain,
                telegram_notify_rain: currentRain,
                telegram_notify_irrigation: currentIrrigation,
                telegram_notify_ndvi: currentNdvi,
              })
              .eq('id', farmer.id);
            invalidateFarmerCache(chatId, farmer.phone);
          } catch (dbErr) {
            console.error('[Supabase notification settings update error]', dbErr);
          }
        }

        await answerTelegramCallbackQuery(callbackId, `Sozlama yangilandi!`, false);

        const settingsMsg = formatTelegramSettingsMessage(updatedFarmer);
        if (messageId) {
          await editTelegramMessageText({
            chatId,
            messageId,
            text: settingsMsg.text,
            replyMarkup: settingsMsg.replyMarkup,
          });
        }

        console.log(`[Telegram Latency] Settings toggle "${toggleType}" handled in ${(performance.now() - reqStart).toFixed(1)}ms`);
        return NextResponse.json({ ok: true, action: 'settings_toggled', toggleType });
      }

      // 1D-2. LANGUAGE SWITCHING (lang:uz | lang:ru | lang:en)
      if (data.startsWith('lang:')) {
        const selectedLang = data.replace('lang:', '').trim() as 'uz' | 'ru' | 'en';
        const farmerData = await getFarmerAndTelemetryData(chatId);
        const { farmer } = farmerData;

        const updatedFarmer: FarmerProfile = {
          id: farmer?.id || 'demo_farmer',
          full_name: farmer?.full_name || 'Hurmatli Dehqon',
          phone: farmer?.phone || '+998901234567',
          region: farmer?.region || 'Toshkent viloyati',
          telegram_chat_id: String(chatId),
          telegram_language: selectedLang,
          preferred_language: selectedLang,
        };

        if (isSupabaseConfigured && supabase && farmer?.id) {
          try {
            await supabase
              .from('farmers')
              .update({
                telegram_language: selectedLang,
                preferred_language: selectedLang,
              })
              .eq('id', farmer.id);
            invalidateFarmerCache(chatId, farmer.phone);
          } catch (dbErr) {
            console.error('[Supabase language update error]', dbErr);
          }
        }

        const langLabels = { uz: "O'zbek tili (Lotin)", ru: "Русский язык", en: "English" };
        await answerTelegramCallbackQuery(callbackId, `🌐 ${langLabels[selectedLang] || selectedLang} tanlandi!`, false);

        const settingsMsg = formatTelegramSettingsMessage(updatedFarmer);
        if (messageId) {
          await editTelegramMessageText({
            chatId,
            messageId,
            text: settingsMsg.text,
            replyMarkup: settingsMsg.replyMarkup,
          });
        }

        // Update persistent reply keyboard to match newly chosen language
        await sendTelegramMessage({
          chatId,
          text: selectedLang === 'ru' ? `✅ Язык интерфейса изменен на Русский.` : selectedLang === 'en' ? `✅ Interface language changed to English.` : `✅ Til o'zgartirildi: O'zbek tili.`,
          replyMarkup: getFarmerReplyKeyboard(selectedLang),
        });

        return NextResponse.json({ ok: true, action: 'language_changed', selectedLang });
      }

      // 1D-3. SUPPORT & HELP CALLBACK
      if (data === 'menu_support') {
        await answerTelegramCallbackQuery(callbackId);
        const farmerData = await getFarmerAndTelemetryData(chatId);
        const currentLang = farmerData.farmer?.telegram_language || farmerData.farmer?.preferred_language || 'uz';
        const helpMsg = formatTelegramHelpSupportMessage(farmerData.farmer, currentLang);
        if (messageId) {
          await editTelegramMessageText({
            chatId,
            messageId,
            text: helpMsg.text,
            replyMarkup: helpMsg.replyMarkup,
          });
        } else {
          await sendTelegramMessage({
            chatId,
            text: helpMsg.text,
            replyMarkup: helpMsg.replyMarkup,
          });
        }
        return NextResponse.json({ ok: true, action: 'menu_support_rendered' });
      }

      if (data === 'support_write') {
        await answerTelegramCallbackQuery(callbackId, "✍️ Savolingiz yoki murojaatingizni yozing!", false);
        await sendTelegramMessage({
          chatId,
          text:
            `✍️ <b>Ekinix jamoasiga murojaat:</b>\n\n` +
            `Iltimos, o'zingizni qiziqtirgan savol yoki taklifingizni quyida oddiy xabar sifatida yozib yuboring.\n` +
            `Xabaringiz zudlik bilan qayd etiladi va agronomlarimiz siz bilan bog'lanishadi.`,
        });
        return NextResponse.json({ ok: true, action: 'support_write_prompted' });
      }

      // 1E. RETURN TO MAIN MENU
      if (data === 'menu_main') {
        await answerTelegramCallbackQuery(callbackId);
        const farmerData = await getFarmerAndTelemetryData(chatId);
        const farmerName = farmerData.farmer?.full_name || 'Hurmatli Dehqon';
        const currentLang = farmerData.farmer?.telegram_language || farmerData.farmer?.preferred_language || 'uz';
        const startMsg =
          currentLang === 'ru'
            ? `🌱 <b>Главное меню управления Ekinix</b>\n\nЗдравствуйте, <b>${farmerName}</b>! 👋\n\nВыберите нужный раздел:`
            : currentLang === 'en'
            ? `🌱 <b>Ekinix Agro Dashboard Menu</b>\n\nWelcome, <b>${farmerName}</b>! 👋\n\nSelect an option:`
            : `🌱 <b>Ekinix Agro Boshqaruv Menyusi</b>\n\nAssalomu alaykum, <b>${farmerName}</b>! 👋\n\nKerakli bo'limni tanlang:`;

        if (messageId) {
          await editTelegramMessageText({
            chatId,
            messageId,
            text: startMsg,
            replyMarkup: getMainMenuInlineKeyboard(currentLang),
          });
        }
        return NextResponse.json({ ok: true, action: 'menu_main_rendered' });
      }

      if (data === 'menu_settings') {
        await answerTelegramCallbackQuery(callbackId);
        const farmerData = await getFarmerAndTelemetryData(chatId);
        const settingsMsg = formatTelegramSettingsMessage(farmerData.farmer);
        if (messageId) {
          await editTelegramMessageText({
            chatId,
            messageId,
            text: settingsMsg.text,
            replyMarkup: settingsMsg.replyMarkup,
          });
        }
        return NextResponse.json({ ok: true, action: 'menu_settings_rendered' });
      }

      // 1F. FIELD SELECTION AND FIELD ACTIONS
      if (data === 'choose_existing_field') {
        await answerTelegramCallbackQuery(callbackId);
        const farmerData = await getFarmerAndTelemetryData(chatId);
        const { farmer, fieldsWithTelemetry } = farmerData;
        const fieldsMenu = formatTelegramExistingFieldsMenu(
          farmer,
          fieldsWithTelemetry,
          getAppProductionUrl()
        );

        if (messageId) {
          await editTelegramMessageText({
            chatId,
            messageId,
            text: fieldsMenu.text,
            replyMarkup: fieldsMenu.replyMarkup,
          });
        } else {
          await sendTelegramMessage({
            chatId,
            text: fieldsMenu.text,
            replyMarkup: fieldsMenu.replyMarkup,
          });
        }
        return NextResponse.json({ ok: true, action: 'choose_existing_field_rendered' });
      }

      if (data.startsWith('field_detail:')) {
        const targetFieldId = data.replace('field_detail:', '').trim();
        await answerTelegramCallbackQuery(callbackId);
        const farmerData = await getFarmerAndTelemetryData(chatId);
        const { farmer, fieldsWithTelemetry } = farmerData;
        const fieldItem = fieldsWithTelemetry.find((item) => item.field.id === targetFieldId);

        if (fieldItem) {
          const detail = formatTelegramSingleFieldDetailMessage(
            farmer,
            fieldItem,
            getAppProductionUrl()
          );

          if (messageId) {
            await editTelegramMessageText({
              chatId,
              messageId,
              text: detail.text,
              replyMarkup: detail.replyMarkup,
            });
          } else {
            await sendTelegramMessage({
              chatId,
              text: detail.text,
              replyMarkup: detail.replyMarkup,
            });
          }
          return NextResponse.json({ ok: true, action: 'field_detail_rendered', fieldId: targetFieldId });
        }
      }

      // 1G. AGRONOMIST SPECIFIC ACTIONS (FIELD SELECTION, SINGLE FIELD REPORT, REFRESH)
      if (data === 'agro_select_field') {
        await answerTelegramCallbackQuery(callbackId);
        const farmerData = await getFarmerAndTelemetryData(chatId);
        const { farmer, fieldsWithTelemetry } = farmerData;
        const selectMenu = formatTelegramFieldSelectionMenu(
          fieldsWithTelemetry,
          farmer?.full_name || 'Hurmatli Dehqon'
        );

        if (messageId) {
          await editTelegramMessageText({
            chatId,
            messageId,
            text: selectMenu.text,
            replyMarkup: selectMenu.replyMarkup,
          });
        } else {
          await sendTelegramMessage({
            chatId,
            text: selectMenu.text,
            replyMarkup: selectMenu.replyMarkup,
          });
        }
        return NextResponse.json({ ok: true, action: 'agro_select_field_rendered' });
      }

      if (data.startsWith('agro_field:')) {
        const targetFieldId = data.replace('agro_field:', '').trim();
        await answerTelegramCallbackQuery(callbackId, "🤖 Agronom tahlili yuklanmoqda...");
        sendTelegramChatAction(chatId, 'typing').catch(() => {});

        const farmerData = await getFarmerAndTelemetryData(chatId);
        const { farmer, fieldsWithTelemetry } = farmerData;
        const primaryField = fieldsWithTelemetry[0]?.field || null;
        const coords = getFieldCoordinates(primaryField, farmer?.region);
        const weather = await fetchLiveWeather(coords.lat, coords.lng);

        if (targetFieldId === 'all') {
          const allMsg = formatTelegramAgronomistMessage(farmer, fieldsWithTelemetry, weather);
          const replyMarkup = {
            inline_keyboard: [
              [{ text: '🌾 Maydonlar bo\'yicha alohida tahlil', callback_data: 'agro_select_field' }],
              [{ text: '◀️ Asosiy menyu', callback_data: 'menu_main' }],
            ],
          };

          if (messageId) {
            await editTelegramMessageText({
              chatId,
              messageId,
              text: allMsg,
              replyMarkup,
            });
          } else {
            await sendTelegramMessage({
              chatId,
              text: allMsg,
              replyMarkup,
            });
          }
          return NextResponse.json({ ok: true, action: 'agro_field_all_sent' });
        }

        const selectedItem =
          fieldsWithTelemetry.find((f) => f.field.id === targetFieldId) || fieldsWithTelemetry[0];

        if (!selectedItem) {
          const emptyMsg = formatTelegramAgronomistMessage(farmer, [], weather);
          await sendTelegramMessage({
            chatId,
            text: emptyMsg,
            replyMarkup: getMainMenuInlineKeyboard(),
          });
          return NextResponse.json({ ok: true, action: 'agro_empty_sent' });
        }

        const report = await getOrGenerateAgronomistSummary({
          field: selectedItem.field,
          latestNdvi: selectedItem.latestNdvi,
          previousNdvi: selectedItem.previousNdvi,
          weather,
          farmer,
          forceRefresh: false,
        });

        const formatted = formatTelegramAgronomistFieldReport(
          report,
          fieldsWithTelemetry.length > 1
        );

        if (messageId) {
          await editTelegramMessageText({
            chatId,
            messageId,
            text: formatted.text,
            replyMarkup: formatted.replyMarkup,
          });
        } else {
          await sendTelegramMessage({
            chatId,
            text: formatted.text,
            replyMarkup: formatted.replyMarkup,
          });
        }

        return NextResponse.json({ ok: true, action: 'agro_field_report_sent' });
      }

      if (data.startsWith('agro_refresh:')) {
        const targetFieldId = data.replace('agro_refresh:', '').trim();
        await answerTelegramCallbackQuery(callbackId, "🔄 Gemini AI yangi tahlil tayyorlamoqda...", false);
        sendTelegramChatAction(chatId, 'typing').catch(() => {});

        const farmerData = await getFarmerAndTelemetryData(chatId);
        const { farmer, fieldsWithTelemetry } = farmerData;
        const primaryField = fieldsWithTelemetry[0]?.field || null;
        const coords = getFieldCoordinates(primaryField, farmer?.region);
        const weather = await fetchLiveWeather(coords.lat, coords.lng);

        const selectedItem =
          fieldsWithTelemetry.find((f) => f.field.id === targetFieldId) || fieldsWithTelemetry[0];

        if (selectedItem) {
          const report = await getOrGenerateAgronomistSummary({
            field: selectedItem.field,
            latestNdvi: selectedItem.latestNdvi,
            previousNdvi: selectedItem.previousNdvi,
            weather,
            farmer,
            forceRefresh: true, // Bypass cache
          });

          const formatted = formatTelegramAgronomistFieldReport(
            report,
            fieldsWithTelemetry.length > 1
          );

          if (messageId) {
            await editTelegramMessageText({
              chatId,
              messageId,
              text: formatted.text,
              replyMarkup: formatted.replyMarkup,
            });
          } else {
            await sendTelegramMessage({
              chatId,
              text: formatted.text,
              replyMarkup: formatted.replyMarkup,
            });
          }
        }
        return NextResponse.json({ ok: true, action: 'agro_refreshed' });
      }

      // 1G. EXACT 4 SPECIFICATION BUTTONS FROM INLINE KEYBOARD
      // Concurrent fetching: start answerCallbackQuery + getFarmerAndTelemetryData in parallel
      const [answerResult, farmerData] = await Promise.all([
        answerTelegramCallbackQuery(callbackId),
        getFarmerAndTelemetryData(chatId),
        typingPromise,
      ]);

      const { farmer, fieldsWithTelemetry, timing } = farmerData;
      const primaryField = fieldsWithTelemetry[0]?.field || null;
      const coords = getFieldCoordinates(primaryField, farmer?.region);

      const t0Weather = performance.now();
      const weather = await fetchLiveWeather(coords.lat, coords.lng);
      const weatherMs = performance.now() - t0Weather;

      let msgText = '';
      let customReplyMarkup: any = null;
      const actionName = data;

      if (data === 'menu_weather') {
        msgText = formatTelegram5DayWeatherMessage(farmer, primaryField, weather);
      } else if (data === 'menu_fields') {
        msgText = formatTelegramFieldsMessage(farmer, fieldsWithTelemetry, getAppProductionUrl());
        customReplyMarkup = getFarmerOnboardingFieldsInlineKeyboard(fieldsWithTelemetry.length);
      } else if (data === 'menu_agronomist') {
        if (fieldsWithTelemetry.length === 0) {
          msgText = formatTelegramAgronomistMessage(farmer, fieldsWithTelemetry, weather);
        } else if (fieldsWithTelemetry.length === 1) {
          const item = fieldsWithTelemetry[0];
          const report = await getOrGenerateAgronomistSummary({
            field: item.field,
            latestNdvi: item.latestNdvi,
            previousNdvi: item.previousNdvi,
            weather,
            farmer,
            forceRefresh: false,
          });
          const formatted = formatTelegramAgronomistFieldReport(report, false);
          msgText = formatted.text;
          customReplyMarkup = formatted.replyMarkup;
        } else {
          // Multiple fields -> show selection menu
          const selection = formatTelegramFieldSelectionMenu(
            fieldsWithTelemetry,
            farmer?.full_name || 'Hurmatli Dehqon'
          );
          msgText = selection.text;
          customReplyMarkup = selection.replyMarkup;
        }
      } else if (data === 'menu_irrigation') {
        msgText = formatTelegramIrrigationScheduleMessage(farmer, fieldsWithTelemetry, weather);
      }

      if (msgText) {
        const t0Send = performance.now();
        await sendTelegramMessage({
          chatId,
          text: msgText,
          replyMarkup: customReplyMarkup || getMainMenuInlineKeyboard(),
        });
        const sendMs = performance.now() - t0Send;
        const totalMs = performance.now() - reqStart;

        console.log(
          `[Telegram Timing Breakdown] Cmd: "${actionName}" | Total: ${totalMs.toFixed(1)}ms | FarmerDB: ${timing.farmerDbMs.toFixed(1)}ms | FieldsDB: ${timing.fieldsDbMs.toFixed(1)}ms | Weather: ${weatherMs.toFixed(1)}ms | Send: ${sendMs.toFixed(1)}ms`
        );

        return NextResponse.json({ ok: true, action: actionName, durationMs: totalMs });
      }

      return NextResponse.json({ ok: true });
    }

    // =========================================================================
    // 2. HANDLE STANDARD CHAT MESSAGES & NATIVE CONTACT SHARING
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
    const userLastName = fromUser.last_name || '';
    const userFullName = `${userFirstName} ${userLastName}`.trim() || 'Hurmatli Dehqon';

    // Immediate instant feedback: send 'typing' chat action right away
    const typingPromise = sendTelegramChatAction(chatId, 'typing').catch(() => {});

    // -------------------------------------------------------------------------
    // 2-PHOTO. PHOTO DIAGNOSIS WITH GEMINI 3.7 FLASH VISION
    // If a farmer sends a photo (leaf, plant, field), diagnose signs of pest, disease, or deficiency
    // -------------------------------------------------------------------------
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      const bestPhoto = message.photo[message.photo.length - 1]; // Highest resolution photo
      const caption = message.caption || '';
      const botToken = getTelegramBotToken();

      await sendTelegramChatAction(chatId, 'upload_photo').catch(() => {});

      const [downloadRes, farmerData] = await Promise.all([
        downloadTelegramPhotoAsBase64(bestPhoto.file_id, botToken),
        getFarmerAndTelemetryData(chatId),
      ]);

      const { farmer: currentFarmer } = farmerData;
      const currentLang = currentFarmer?.telegram_language || currentFarmer?.preferred_language || 'uz';

      if (!downloadRes) {
        await sendTelegramMessage({
          chatId,
          text:
            `⚠️ <b>Suratni yuklab olishda xatolik yuz berdi.</b>\n\n` +
            `Iltimos, fotosuratni qaytadan yuborib ko'ring yoki bot bilan aloqa sifatini tekshiring.`,
          replyMarkup: getMainMenuInlineKeyboard(currentLang),
        });
        return NextResponse.json({ ok: false, error: 'photo_download_failed' });
      }

      // Initial friendly progress notification to farmer
      await sendTelegramMessage({
        chatId,
        text: `🔬 <b>Fotosurat qabul qilindi.</b> Gemini AI vizual tahlil o'tkazmoqda (kasallik, zararkunanda va ozuqa holati)...`,
      });

      const diagnosis = await diagnoseCropPhotoWithGemini({
        base64Data: downloadRes.base64Data,
        mimeType: downloadRes.mimeType,
        caption,
        farmer: currentFarmer,
        lang: currentLang,
      });

      const formatted = formatTelegramPhotoDiagnosisMessage(diagnosis, currentFarmer?.full_name);

      await sendTelegramMessage({
        chatId,
        text: formatted.text,
        replyMarkup: formatted.replyMarkup,
      });

      console.log(
        `[Telegram Photo Diagnosis] Processed photo ${bestPhoto.file_id} for chat ${chatId} in ${(performance.now() - reqStart).toFixed(1)}ms`
      );
      return NextResponse.json({ ok: true, action: 'photo_diagnosed', diagnosis });
    }

    // -------------------------------------------------------------------------
    // 2A. DETECT INCOMING PHONE NUMBER (NATIVE CONTACT OR TEXT)
    // -------------------------------------------------------------------------
    let incomingPhone = '';
    if (contact && contact.phone_number) {
      incomingPhone = normalizePhoneNumber(contact.phone_number);
    } else if (text.startsWith('/start phone_')) {
      incomingPhone = normalizePhoneNumber(text.replace('/start phone_', '').trim());
    } else if (/^(\+?998|\d{9,12}$)/.test(text.replace(/[\s\-()]/g, '')) && !text.startsWith('/')) {
      incomingPhone = normalizePhoneNumber(text);
    }

    if (incomingPhone) {
      const [typingRes, farmerData] = await Promise.all([
        typingPromise,
        getFarmerAndTelemetryData(chatId, incomingPhone),
      ]);

      const { farmer: matchedFarmer, fieldsWithTelemetry: matchedFields, isRealDbRecord } = farmerData;

      // CASE 1: MATCH FOUND in Supabase `farmers`
      if (matchedFarmer && isRealDbRecord) {
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase
              .from('farmers')
              .update({
                telegram_chat_id: String(chatId),
                telegram_username: telegramUsername,
                telegram_linked_at: new Date().toISOString(),
                telegram_notifications_enabled: true,
              })
              .eq('id', matchedFarmer.id);
            invalidateFarmerCache(chatId, incomingPhone);
          } catch (updateErr) {
            console.error('[Supabase link error]', updateErr);
          }
        }

        const totalArea = matchedFields.reduce((sum, item) => sum + (Number(item.field.area_hectares) || 0), 0);
        const cropsList = Array.from(new Set(matchedFields.map((item) => item.field.crop_type || 'Ekin'))).join(', ') ||
          (matchedFarmer.primary_crops?.join(', ') || "Paxta, Bug'doy");

        const linkedGreetingMsg =
          `✅ <b>Assalomu alaykum, ${matchedFarmer.full_name}!</b>\n\n` +
          `Sizning <code>+${incomingPhone}</code> telefon raqamingiz Ekinix hisobingizga muvaffaqiyatli bog'landi!\n\n` +
          `🌾 <b>Sizning dalalaringiz:</b>\n` +
          `• Maydonlar soni: <b>${matchedFields.length} ta</b> (${totalArea > 0 ? totalArea.toFixed(1) : '0'} ga)\n` +
          `• Asosiy hudud: <b>${matchedFarmer.region || "O'zbekiston"}</b>\n` +
          `• Ekinlar: <b>${cropsList}</b>\n\n` +
          (matchedFields.length > 0
            ? `👇 <b>Quyidagi tugmalar orqali mavjud maydonni tanlang yoki yangi maydon qo'shing:</b>`
            : `👇 <b>Sizda hali maydonlar ro'yxatdan o'tmagan. Yangi maydon qo'shish uchun quyidagi tugmani bosing:</b>`);

        await Promise.all([
          sendTelegramMessage({
            chatId,
            text: linkedGreetingMsg,
            replyMarkup: getFarmerOnboardingFieldsInlineKeyboard(matchedFields.length),
          }),
          sendTelegramMessage({
            chatId,
            text: `Boshqaruv paneli faollashtirildi.`,
            replyMarkup: getFarmerReplyKeyboard(),
          }),
        ]);

        console.log(`[Telegram Latency] Account linked in ${(performance.now() - reqStart).toFixed(1)}ms`);
        return NextResponse.json({ ok: true, action: 'existing_farmer_linked', farmer: matchedFarmer.full_name });
      }

      // CASE 2: NO MATCH in Supabase -> In-bot registration
      // Persist session to DB so it survives serverless cold starts between steps
      await upsertRegistrationSession(String(chatId), {
        phone: incomingPhone,
        full_name: userFullName,
        step: 'ask_region',
      });

      const askRegionMsg =
        `📋 <b>Ekinixda ro'yxatdan o'tish (1-qadam / 2)</b>\n\n` +
        `Telefon raqamingiz: <code>+${incomingPhone}</code> ✅\n` +
        `Fermer: <b>${userFullName}</b>\n\n` +
        `📍 Iltimos, ekin maydoningiz joylashgan <b>viloyatni</b> tanlang:`;

      await sendTelegramMessage({
        chatId,
        text: askRegionMsg,
        replyMarkup: getRegionSelectionInlineKeyboard(),
      });

      console.log(`[Telegram Latency] Ask region prompted in ${(performance.now() - reqStart).toFixed(1)}ms`);
      return NextResponse.json({ ok: true, action: 'onboarding_ask_region' });
    }

    // -------------------------------------------------------------------------
    // 2B. RESOLVE FARMER & TELEMETRY DATA CONCURRENTLY
    // -------------------------------------------------------------------------
    const [typingRes, farmerData] = await Promise.all([
      typingPromise,
      getFarmerAndTelemetryData(chatId),
    ]);

    const { farmer: currentFarmer, fieldsWithTelemetry, isRealDbRecord, timing } = farmerData;
    const lowerText = text.toLowerCase();

    // -------------------------------------------------------------------------
    // 2C. /start COMMAND
    // -------------------------------------------------------------------------
    if (lowerText === '/start' || lowerText.startsWith('/start')) {
      if (currentFarmer && isRealDbRecord) {
        const totalArea = fieldsWithTelemetry.reduce(
          (sum, item) => sum + (Number(item.field.area_hectares) || 0),
          0
        );
        const cropsList = Array.from(new Set(fieldsWithTelemetry.map((item) => item.field.crop_type || 'Ekin'))).join(', ') ||
          (currentFarmer.primary_crops?.join(', ') || "Paxta, Bug'doy");

        const startMsg =
          `🌱 <b>Ekinix Agro Botiga xush kelibsiz, ${currentFarmer.full_name}!</b>\n\n` +
          `✅ Sizning hisobingiz <code>${currentFarmer.phone}</code> raqami orqali bog'langan.\n\n` +
          `🌾 <b>Sizning dalalaringiz:</b>\n` +
          `• Maydonlar soni: <b>${fieldsWithTelemetry.length} ta</b> (${totalArea.toFixed(1)} ga)\n` +
          `• Hudud: <b>${currentFarmer.region || "O'zbekiston"}</b>\n` +
          `• Asosiy ekinlar: <b>${cropsList}</b>\n\n` +
          `👇 <b>Kerakli xizmatni tanlang:</b>`;

        await Promise.all([
          sendTelegramMessage({
            chatId,
            text: startMsg,
            replyMarkup: getMainMenuInlineKeyboard(),
          }),
          sendTelegramMessage({
            chatId,
            text: `Asosiy menyu:`,
            replyMarkup: getFarmerReplyKeyboard(),
          }),
        ]);

        console.log(`[Telegram Latency] /start handled in ${(performance.now() - reqStart).toFixed(1)}ms`);
        return NextResponse.json({ ok: true, action: 'start_linked_greeted' });
      }

      // Not linked yet -> Request phone number
      const onboardingStartMsg =
        `🌱 <b>Ekinix — O'zbekiston dehqonlari uchun aqlli agro-botiga xush kelibsiz!</b>\n\n` +
        `Assalomu alaykum, <b>${userFirstName || 'Hurmatli Dehqon'}</b>! 👋\n\n` +
        `Ekinix platformasidagi profilingizni va dalalaringizni aniqlash hamda hisobingizni bog'lash uchun quyidagi <b>«📲 Telefon raqamni yuborish»</b> tugmasini bosing:`;

      await sendTelegramMessage({
        chatId,
        text: onboardingStartMsg,
        replyMarkup: getOnboardingContactReplyKeyboard(),
      });

      console.log(`[Telegram Latency] /start unlinked prompt in ${(performance.now() - reqStart).toFixed(1)}ms`);
      return NextResponse.json({ ok: true, action: 'start_contact_requested' });
    }

    // Resolve coordinates & live weather concurrently
    const primaryField = fieldsWithTelemetry[0]?.field || null;
    const coords = getFieldCoordinates(primaryField, currentFarmer?.region);

    const t0Weather = performance.now();
    const weather = await fetchLiveWeather(coords.lat, coords.lng);
    const weatherMs = performance.now() - t0Weather;

    // -------------------------------------------------------------------------
    // 2D. BUTTON 1: "🌦 Ob-havo"
    // -------------------------------------------------------------------------
    if (
      lowerText === '🌦 ob-havo' ||
      lowerText.includes('ob-havo') ||
      lowerText.includes('ob havo') ||
      lowerText === '/weather' ||
      lowerText.includes('погода') ||
      lowerText.includes('weather')
    ) {
      const weatherText = formatTelegram5DayWeatherMessage(currentFarmer, primaryField, weather);
      const t0Send = performance.now();
      await sendTelegramMessage({
        chatId,
        text: weatherText,
        replyMarkup: getMainMenuInlineKeyboard(),
      });
      const sendMs = performance.now() - t0Send;
      const totalMs = performance.now() - reqStart;

      console.log(
        `[Telegram Timing Breakdown] Cmd: "weather" | Total: ${totalMs.toFixed(1)}ms | FarmerDB: ${timing.farmerDbMs.toFixed(1)}ms | FieldsDB: ${timing.fieldsDbMs.toFixed(1)}ms | Weather: ${weatherMs.toFixed(1)}ms | Send: ${sendMs.toFixed(1)}ms`
      );
      return NextResponse.json({ ok: true, action: 'weather_sent', replyText: weatherText, durationMs: totalMs });
    }

    // -------------------------------------------------------------------------
    // 2E. BUTTON 2: "🌾 Mening dalalarim"
    // -------------------------------------------------------------------------
    if (
      lowerText === '🌾 mening dalalarim' ||
      lowerText.includes('dalalarim') ||
      lowerText.includes('dala') ||
      lowerText === '/fields' ||
      lowerText.includes('поля') ||
      lowerText.includes('fields')
    ) {
      const fieldsText = formatTelegramFieldsMessage(currentFarmer, fieldsWithTelemetry, getAppProductionUrl());
      const t0Send = performance.now();
      await sendTelegramMessage({
        chatId,
        text: fieldsText,
        replyMarkup: getFarmerOnboardingFieldsInlineKeyboard(fieldsWithTelemetry.length),
      });
      const sendMs = performance.now() - t0Send;
      const totalMs = performance.now() - reqStart;

      console.log(
        `[Telegram Timing Breakdown] Cmd: "fields" | Total: ${totalMs.toFixed(1)}ms | FarmerDB: ${timing.farmerDbMs.toFixed(1)}ms | FieldsDB: ${timing.fieldsDbMs.toFixed(1)}ms | Send: ${sendMs.toFixed(1)}ms`
      );
      return NextResponse.json({ ok: true, action: 'fields_sent', durationMs: totalMs });
    }

    // -------------------------------------------------------------------------
    // 2F. BUTTON 3: "🤖 Agronom xulosasi"
    // -------------------------------------------------------------------------
    if (
      lowerText === '🤖 agronom xulosasi' ||
      lowerText.includes('agronom') ||
      lowerText.includes('xulosa') ||
      lowerText === '/agronomist' ||
      lowerText.includes('агроном') ||
      lowerText.includes('advisory')
    ) {
      let agronomistText = '';
      let replyMarkup: any = null;

      if (fieldsWithTelemetry.length === 0) {
        agronomistText = formatTelegramAgronomistMessage(currentFarmer, fieldsWithTelemetry, weather);
        replyMarkup = getMainMenuInlineKeyboard();
      } else if (fieldsWithTelemetry.length === 1) {
        const item = fieldsWithTelemetry[0];
        const report = await getOrGenerateAgronomistSummary({
          field: item.field,
          latestNdvi: item.latestNdvi,
          previousNdvi: item.previousNdvi,
          weather,
          farmer: currentFarmer,
          forceRefresh: false,
        });
        const formatted = formatTelegramAgronomistFieldReport(report, false);
        agronomistText = formatted.text;
        replyMarkup = formatted.replyMarkup;
      } else {
        // Multiple fields -> show inline keyboard to select field
        const selection = formatTelegramFieldSelectionMenu(
          fieldsWithTelemetry,
          currentFarmer?.full_name || 'Hurmatli Dehqon'
        );
        agronomistText = selection.text;
        replyMarkup = selection.replyMarkup;
      }

      const t0Send = performance.now();
      await sendTelegramMessage({
        chatId,
        text: agronomistText,
        replyMarkup: replyMarkup || getMainMenuInlineKeyboard(),
      });
      const sendMs = performance.now() - t0Send;
      const totalMs = performance.now() - reqStart;

      console.log(
        `[Telegram Timing Breakdown] Cmd: "agronomist" | Total: ${totalMs.toFixed(1)}ms | FarmerDB: ${timing.farmerDbMs.toFixed(1)}ms | FieldsDB: ${timing.fieldsDbMs.toFixed(1)}ms | Send: ${sendMs.toFixed(1)}ms`
      );
      return NextResponse.json({ ok: true, action: 'agronomist_sent', durationMs: totalMs });
    }

    // -------------------------------------------------------------------------
    // 2G. BUTTON 4: "💧 Sug'orish jadvali"
    // -------------------------------------------------------------------------
    if (
      lowerText === "💧 sug'orish jadvali" ||
      lowerText.includes("sug'orish") ||
      lowerText.includes('jadval') ||
      lowerText === '/irrigation' ||
      lowerText === '/schedule' ||
      lowerText.includes('полив')
    ) {
      const irrigationText = formatTelegramIrrigationScheduleMessage(currentFarmer, fieldsWithTelemetry, weather);
      const t0Send = performance.now();
      await sendTelegramMessage({
        chatId,
        text: irrigationText,
        replyMarkup: getMainMenuInlineKeyboard(),
      });
      const sendMs = performance.now() - t0Send;
      const totalMs = performance.now() - reqStart;

      console.log(
        `[Telegram Timing Breakdown] Cmd: "irrigation" | Total: ${totalMs.toFixed(1)}ms | FarmerDB: ${timing.farmerDbMs.toFixed(1)}ms | FieldsDB: ${timing.fieldsDbMs.toFixed(1)}ms | Send: ${sendMs.toFixed(1)}ms`
      );
      return NextResponse.json({ ok: true, action: 'irrigation_sent', durationMs: totalMs });
    }

    // -------------------------------------------------------------------------
    // 2H. NOTIFICATION SETTINGS: /sozlamalar or /settings or "⚙️ Sozlamalar"
    // -------------------------------------------------------------------------
    if (
      lowerText === '/sozlamalar' ||
      lowerText === '/settings' ||
      lowerText === '/notifications' ||
      lowerText.includes('sozlama') ||
      lowerText.includes('настройки') ||
      lowerText.includes('bildirishnoma')
    ) {
      const settingsMsg = formatTelegramSettingsMessage(currentFarmer);
      const t0Send = performance.now();
      await sendTelegramMessage({
        chatId,
        text: settingsMsg.text,
        replyMarkup: settingsMsg.replyMarkup,
      });
      const sendMs = performance.now() - t0Send;
      const totalMs = performance.now() - reqStart;

      console.log(
        `[Telegram Timing Breakdown] Cmd: "settings" | Total: ${totalMs.toFixed(1)}ms | Send: ${sendMs.toFixed(1)}ms`
      );
      return NextResponse.json({ ok: true, action: 'settings_sent', durationMs: totalMs });
    }

    // -------------------------------------------------------------------------
    // 2I. QUICK LANGUAGE SWITCH COMMAND: /til or /lang or /language
    // -------------------------------------------------------------------------
    if (
      lowerText === '/til' ||
      lowerText === '/lang' ||
      lowerText === '/language' ||
      lowerText === '/язык' ||
      lowerText === '🌐 til' ||
      lowerText === '🌐 язык'
    ) {
      const currentLang = currentFarmer?.telegram_language || currentFarmer?.preferred_language || 'uz';
      const langSelector = formatTelegramLanguageSelectorMessage(currentLang);
      await sendTelegramMessage({
        chatId,
        text: langSelector.text,
        replyMarkup: langSelector.replyMarkup,
      });
      return NextResponse.json({ ok: true, action: 'language_selector_sent' });
    }

    // -------------------------------------------------------------------------
    // 2J. HELP & SUPPORT COMMAND: /yordam or /help or "🆘 Yordam" / "Помощь"
    // -------------------------------------------------------------------------
    if (
      lowerText === '/yordam' ||
      lowerText === '/help' ||
      lowerText === '/support' ||
      lowerText.includes('yordam') ||
      lowerText.includes('помощь') ||
      lowerText.includes('help')
    ) {
      const currentLang = currentFarmer?.telegram_language || currentFarmer?.preferred_language || 'uz';
      const helpMsg = formatTelegramHelpSupportMessage(currentFarmer, currentLang);
      await sendTelegramMessage({
        chatId,
        text: helpMsg.text,
        replyMarkup: helpMsg.replyMarkup,
      });
      return NextResponse.json({ ok: true, action: 'help_support_sent' });
    }

    // -------------------------------------------------------------------------
    // 2K. SUPPORT MESSAGE LOGGING (If farmer typed a message that is not a known command)
    // -------------------------------------------------------------------------
    if (text.length > 5 && !text.startsWith('/') && isRealDbRecord && currentFarmer) {
      // Log as support ticket to Supabase support_tickets if configured
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('support_tickets').insert([
            {
              farmer_id: currentFarmer.id,
              farmer_name: currentFarmer.full_name,
              farmer_phone: currentFarmer.phone,
              telegram_chat_id: String(chatId),
              message: text,
              status: 'open',
              created_at: new Date().toISOString(),
            },
          ]);
        } catch (ticketErr) {
          // Table might not exist or network error; log softly
          console.warn('[Supabase support ticket log error]', ticketErr);
        }
      }

      const currentLang = currentFarmer?.telegram_language || currentFarmer?.preferred_language || 'uz';
      const ackText =
        currentLang === 'ru'
          ? `✅ <b>Ваше сообщение принято!</b>\n\nАгрономическая служба поддержки Ekinix свяжется с вами в ближайшее время.`
          : currentLang === 'en'
          ? `✅ <b>Your inquiry has been received!</b>\n\nThe Ekinix agronomist support team will follow up shortly.`
          : `✅ <b>Xabaringiz qabul qilindi!</b>\n\nEkinix agronomik qo'llab-quvvatlash xizmati tez orada siz bilan bog'lanadi.`;

      await sendTelegramMessage({
        chatId,
        text: ackText,
        replyMarkup: getFarmerReplyKeyboard(currentLang),
      });

      return NextResponse.json({ ok: true, action: 'support_ticket_logged', messageSnippet: text.slice(0, 50) });
    }

    // Default Fallback: Prompt with the main menu
    if (currentFarmer && isRealDbRecord) {
      await sendTelegramMessage({
        chatId,
        text: `🌱 <b>Ekinix Boshqaruv Menyusi:</b>\n\nQuyidagi tugmalardan birini tanlang:`,
        replyMarkup: getMainMenuInlineKeyboard(),
      });
    } else {
      await sendTelegramMessage({
        chatId,
        text: `🌱 Ekinix tizimiga ulanish uchun <b>«📲 Telefon raqamni yuborish»</b> tugmasini bosing:`,
        replyMarkup: getOnboardingContactReplyKeyboard(),
      });
    }

    console.log(`[Telegram Latency] Fallback prompt in ${(performance.now() - reqStart).toFixed(1)}ms`);
    return NextResponse.json({ ok: true });
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
    service: 'Ekinix Telegram Bot (4-Button Specification)',
    botConfigured: isConfigured,
    botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME || 'ekinixbot',
    menuItems: [
      '🌦 Ob-havo',
      '🌾 Mening dalalarim',
      '🤖 Agronom xulosasi',
      "💧 Sug'orish jadvali",
    ],
  });
}
