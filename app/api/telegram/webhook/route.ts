import { NextRequest, NextResponse } from 'next/server';
import {
  normalizePhoneNumber,
  fetchLiveWeather,
  getFieldCoordinates,
  formatTelegram5DayWeatherMessage,
  formatTelegramFieldsMessage,
  formatTelegramAgronomistMessage,
  formatTelegramIrrigationScheduleMessage,
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
} from '@/lib/telegramBot';
import {
  supabase,
  isSupabaseConfigured,
  FarmerProfile,
  FieldRecord,
  NdviReadingRecord,
} from '@/lib/supabase';

// In-memory registration session store for multi-step onboarding
interface RegistrationSession {
  phone: string;
  full_name: string;
  region?: string;
  primary_crop?: string;
  step: 'ask_region' | 'ask_crop';
  startedAt: number;
}

const registrationSessions = new Map<string, RegistrationSession>();

// In-memory Short-term cache for Farmer & Fields Telemetry (60-second TTL)
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
          .or(`farmer_id.eq.${farmer.id},user_id.eq.${farmer.user_id || farmer.id}`)
          .order('created_at', { ascending: false });

        const fieldsList = (fieldsData as FieldRecord[]) || [];

        if (fieldsList.length > 0) {
          // Parallelized queries for all fields
          const telemetryPromises = fieldsList.map(async (field) => {
            let latestNdvi: NdviReadingRecord | null = null;
            let lastWateredDate: string | null = null;

            const [ndviResult, waterResult] = await Promise.all([
              (async () => {
                try {
                  const { data } = await supabase!
                    .from('ndvi_readings')
                    .select('*')
                    .eq('field_id', field.id)
                    .order('satellite_date', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                  return data as NdviReadingRecord | null;
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

            latestNdvi = ndviResult;
            if (waterResult && (waterResult.watered_at || waterResult.created_at)) {
              lastWateredDate = waterResult.watered_at || waterResult.created_at;
            }

            return {
              field,
              latestNdvi,
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
        let session = registrationSessions.get(String(chatId));

        if (!session) {
          session = {
            phone: '998901234567',
            full_name: userFullName,
            region: selectedRegion,
            step: 'ask_crop',
            startedAt: Date.now(),
          };
        } else {
          session.region = selectedRegion;
          session.step = 'ask_crop';
        }
        registrationSessions.set(String(chatId), session);

        const [answerRes] = await Promise.all([
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

        const session = registrationSessions.get(String(chatId));
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

        registrationSessions.delete(String(chatId));
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
          `👇 <b>Quyidagi menyu orqali kerakli bo'limni tanlang:</b>`;

        await Promise.all([
          sendTelegramMessage({
            chatId,
            text: successMsg,
            replyMarkup: getMainMenuInlineKeyboard(),
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

      // 1C. EXACT 4 SPECIFICATION BUTTONS FROM INLINE KEYBOARD
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
      const actionName = data;

      if (data === 'menu_weather') {
        msgText = formatTelegram5DayWeatherMessage(farmer, primaryField, weather);
      } else if (data === 'menu_fields') {
        msgText = formatTelegramFieldsMessage(farmer, fieldsWithTelemetry);
      } else if (data === 'menu_agronomist') {
        msgText = formatTelegramAgronomistMessage(farmer, fieldsWithTelemetry, weather);
      } else if (data === 'menu_irrigation') {
        msgText = formatTelegramIrrigationScheduleMessage(farmer, fieldsWithTelemetry, weather);
      }

      if (msgText) {
        const t0Send = performance.now();
        await sendTelegramMessage({
          chatId,
          text: msgText,
          replyMarkup: getMainMenuInlineKeyboard(),
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
          `👇 <b>Quyidagi menyu orqali kerakli bo'limni tanlang:</b>`;

        await Promise.all([
          sendTelegramMessage({
            chatId,
            text: linkedGreetingMsg,
            replyMarkup: getMainMenuInlineKeyboard(),
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
      registrationSessions.set(String(chatId), {
        phone: incomingPhone,
        full_name: userFullName,
        step: 'ask_region',
        startedAt: Date.now(),
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
      return NextResponse.json({ ok: true, action: 'weather_sent', durationMs: totalMs });
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
      const fieldsText = formatTelegramFieldsMessage(currentFarmer, fieldsWithTelemetry);
      const t0Send = performance.now();
      await sendTelegramMessage({
        chatId,
        text: fieldsText,
        replyMarkup: getMainMenuInlineKeyboard(),
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
      const agronomistText = formatTelegramAgronomistMessage(currentFarmer, fieldsWithTelemetry, weather);
      const t0Send = performance.now();
      await sendTelegramMessage({
        chatId,
        text: agronomistText,
        replyMarkup: getMainMenuInlineKeyboard(),
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

    // Default Fallback: Prompt with the 4-button menu
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
