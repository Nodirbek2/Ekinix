import { NextRequest, NextResponse } from 'next/server';
import {
  supabase,
  isSupabaseConfigured,
  FarmerProfile,
  FieldRecord,
  NdviReadingRecord,
} from '@/lib/supabase';
import {
  fetchLiveWeather,
  getFieldCoordinates,
  formatTelegramRainAlert,
  formatTelegramDailyIrrigationTask,
  formatTelegramNdviStressAlert,
  sendTelegramMessage,
} from '@/lib/telegramBot';
import { calculateIrrigationRecommendation } from '@/lib/irrigationAdvisor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CronAlertLogItem {
  farmerName: string;
  phone: string;
  chatId: string;
  fieldName: string;
  fieldId: string;
  alertType: 'rain_alert' | 'irrigation_task' | 'ndvi_stress';
  status: 'sent' | 'skipped_duplicate' | 'skipped_muted' | 'simulated' | 'failed';
  reason?: string;
  details?: any;
}

export async function GET(req: NextRequest) {
  return handleDailyAlertsJob(req);
}

export async function POST(req: NextRequest) {
  return handleDailyAlertsJob(req);
}

async function handleDailyAlertsJob(req: NextRequest) {
  const startTime = performance.now();
  const url = new URL(req.url);
  const isForce = url.searchParams.get('force') === 'true'; // Ignore 1-per-day dedup for testing
  const specificChatId = url.searchParams.get('chat_id');
  const isDryRun = url.searchParams.get('dry_run') === 'true';

  const todayStr = new Date().toISOString().split('T')[0];
  const logs: CronAlertLogItem[] = [];
  let farmersProcessed = 0;
  let fieldsProcessed = 0;
  let alertsSentCount = 0;
  let alertsSkippedCount = 0;

  try {
    // 1. Fetch all linked farmers from Supabase
    let linkedFarmers: FarmerProfile[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('farmers')
          .select('*')
          .not('telegram_chat_id', 'is', null);

        if (specificChatId) {
          query = query.eq('telegram_chat_id', specificChatId);
        }

        const { data: dbFarmers, error: farmerErr } = await query;
        if (!farmerErr && dbFarmers && dbFarmers.length > 0) {
          linkedFarmers = dbFarmers as unknown as FarmerProfile[];
        }
      } catch (dbErr) {
        console.error('[Cron Job Supabase Farmers Fetch Error]', dbErr);
      }
    }

    // Fallback demo farmer for demonstration / testing if no linked DB farmers yet
    if (linkedFarmers.length === 0) {
      linkedFarmers = [
        {
          id: 'farmer_demo_1',
          full_name: 'Otabek Qodirov (Namuna Fermer)',
          phone: '+998901234567',
          region: "Farg'ona viloyati",
          telegram_chat_id: specificChatId || 'demo_chat_123',
          telegram_notifications_enabled: true,
          telegram_notify_weather: true,
          telegram_notify_rain: true,
          telegram_notify_irrigation: true,
          telegram_notify_ndvi: true,
        },
      ];
    }

    // 2. Process each linked farmer
    for (const farmer of linkedFarmers) {
      farmersProcessed++;

      // Check master mute toggle
      if (farmer.telegram_notifications_enabled === false) {
        logs.push({
          farmerName: farmer.full_name,
          phone: farmer.phone,
          chatId: farmer.telegram_chat_id || '',
          fieldName: 'All',
          fieldId: 'all',
          alertType: 'rain_alert',
          status: 'skipped_muted',
          reason: "Fermer barcha bildirishnomalarni o'chirib qo'ygan (telegram_notifications_enabled = false)",
        });
        alertsSkippedCount++;
        continue;
      }

      // 3. Fetch fields for this farmer
      let fields: FieldRecord[] = [];
      if (isSupabaseConfigured && supabase && farmer.id && !farmer.id.startsWith('farmer_demo')) {
        try {
          const { data: dbFields } = await supabase
            .from('fields')
            .select('*')
            .eq('farmer_id', farmer.id);
          if (dbFields && dbFields.length > 0) {
            fields = dbFields as unknown as FieldRecord[];
          }
        } catch {}
      }

      // Default fields if empty
      if (fields.length === 0) {
        fields = [
          {
            id: 'field_demo_1',
            name: "1-Maydon (Paxtazor)",
            crop_type: farmer.primary_crops?.[0] || 'cotton',
            area_hectares: 24.5,
            region: farmer.region || "Farg'ona viloyati",
            planting_date: '2026-04-12',
          },
        ];
      }

      // 4. Fetch past notifications sent today for deduplication
      const sentTodaySet = new Set<string>(); // Format: `${field_id}:${type}`
      if (isSupabaseConfigured && supabase && farmer.id && !isForce) {
        try {
          const { data: pastNotifications } = await supabase
            .from('notifications_log')
            .select('type, field_id')
            .eq('farmer_id', farmer.id)
            .gte('created_at', `${todayStr}T00:00:00.000Z`);

          if (pastNotifications) {
            for (const notif of pastNotifications) {
              if (notif.field_id && notif.type) {
                sentTodaySet.add(`${notif.field_id}:${notif.type}`);
              }
            }
          }
        } catch (notifErr) {
          console.warn('[Cron Deduplication Check Error]', notifErr);
        }
      }

      // 5. Evaluate each field for alerts
      for (const field of fields) {
        fieldsProcessed++;
        const coords = getFieldCoordinates(field, farmer.region);

        // Fetch live weather from Open-Meteo
        const weather = await fetchLiveWeather(coords.lat, coords.lng);

        // Fetch latest NDVI reading for field
        let latestNdvi: NdviReadingRecord | null = null;
        let previousNdvi: NdviReadingRecord | null = null;

        if (isSupabaseConfigured && supabase && field.id && !field.id.startsWith('field_demo')) {
          try {
            const { data: readings } = await supabase
              .from('ndvi_readings')
              .select('*')
              .eq('field_id', field.id)
              .order('satellite_date', { ascending: false })
              .limit(2);

            if (readings && readings.length > 0) {
              const typedReadings = readings as unknown as NdviReadingRecord[];
              latestNdvi = typedReadings[0];
              if (typedReadings.length > 1) previousNdvi = typedReadings[1];
            }
          } catch {}
        }

        // Mock telemetry if no readings exist yet
        if (!latestNdvi) {
          latestNdvi = {
            id: `ndvi_${field.id}`,
            field_id: field.id,
            ndvi_score: 0.72,
            moisture_percentage: 55,
            status: 'good',
            satellite_date: todayStr,
            recommendation_uz: "Vegetatsiya me'yorida.",
            recommendation_ru: 'Вегетация в норме.',
            recommendation_en: 'Vegetation in normal condition.',
          };
        }

        // =====================================================================
        // ALERT 1: RAIN ALERT (> 60% probability in next 2 days)
        // =====================================================================
        const notifyRainEnabled = farmer.telegram_notify_rain ?? farmer.telegram_notify_weather ?? true;
        const rainKey = `${field.id}:rain_alert`;

        // Check rain probability across today and next 2 days
        let triggerRainAlert = false;
        let maxRainProb = weather.rainProb || 0;
        let rainSumMm = weather.rainSumMm || 0;
        let rainDayName = 'bugun';

        if (weather.dailyForecast && weather.dailyForecast.length > 0) {
          // Check today and next 2 days (index 0, 1, 2)
          for (let i = 0; i < Math.min(3, weather.dailyForecast.length); i++) {
            const day = weather.dailyForecast[i];
            const prob = day.rainProb ?? 0;
            if (prob >= 60 && prob >= maxRainProb) {
              maxRainProb = prob;
              rainSumMm = day.rainSumMm ?? 0;
              rainDayName = i === 0 ? 'bugun' : i === 1 ? 'ertaga' : day.dayNameUz || 'indiniga';
              triggerRainAlert = true;
            }
          }
        }

        if (maxRainProb >= 60) {
          triggerRainAlert = true;
        }

        if (triggerRainAlert) {
          if (!notifyRainEnabled) {
            logs.push({
              farmerName: farmer.full_name,
              phone: farmer.phone,
              chatId: farmer.telegram_chat_id || '',
              fieldName: field.name,
              fieldId: field.id,
              alertType: 'rain_alert',
              status: 'skipped_muted',
              reason: "Yomg'ir xabarlari fermer tomonidan o'chirilgan (telegram_notify_rain = false)",
            });
            alertsSkippedCount++;
          } else if (sentTodaySet.has(rainKey) && !isForce) {
            logs.push({
              farmerName: farmer.full_name,
              phone: farmer.phone,
              chatId: farmer.telegram_chat_id || '',
              fieldName: field.name,
              fieldId: field.id,
              alertType: 'rain_alert',
              status: 'skipped_duplicate',
              reason: "Ushbu maydon uchun bugun yomg'ir xabarnomasi allaqachon yuborilgan (Anti-spam)",
            });
            alertsSkippedCount++;
          } else {
            // Send Rain Alert!
            const rainMsg = formatTelegramRainAlert(field, maxRainProb, rainDayName, rainSumMm);
            let sendSuccess = true;

            if (!isDryRun && farmer.telegram_chat_id) {
              const sendRes = await sendTelegramMessage({
                chatId: farmer.telegram_chat_id,
                text: rainMsg,
                parseMode: 'HTML',
              });
              sendSuccess = sendRes.ok;

              // Record in Supabase notifications_log
              if (isSupabaseConfigured && supabase && farmer.id) {
                try {
                  await supabase.from('notifications_log').insert({
                    farmer_id: farmer.id,
                    field_id: field.id,
                    phone: farmer.phone,
                    chat_id: String(farmer.telegram_chat_id),
                    type: 'rain_alert',
                    status: sendSuccess ? 'sent' : 'failed',
                    payload: { maxRainProb, rainDayName, rainSumMm, message: rainMsg },
                    created_at: new Date().toISOString(),
                  });
                } catch {}
              }
            }

            sentTodaySet.add(rainKey);
            alertsSentCount++;
            logs.push({
              farmerName: farmer.full_name,
              phone: farmer.phone,
              chatId: farmer.telegram_chat_id || '',
              fieldName: field.name,
              fieldId: field.id,
              alertType: 'rain_alert',
              status: isDryRun ? 'simulated' : sendSuccess ? 'sent' : 'failed',
              details: { maxRainProb, rainDayName, rainSumMm },
            });
          }
        }

        // =====================================================================
        // ALERT 2: DAILY IRRIGATION TASK (Due for watering with Inline button)
        // =====================================================================
        const notifyIrrigationEnabled = farmer.telegram_notify_irrigation ?? true;
        const irrigationKey = `${field.id}:irrigation_task`;

        // Calculate irrigation recommendation
        const irrigationRec = calculateIrrigationRecommendation({
          cropType: field.crop_type || 'cotton',
          areaHectares: field.area_hectares || 10,
          plantingDate: field.planting_date,
          ndviValue: latestNdvi.ndvi_score || 0.72,
          soilMoisture: latestNdvi.moisture_percentage || 50,
          modeledSoilMoisture: weather.soilMoisture0to10cm,
          rainForecast: weather.dailyForecast?.map((d) => ({
            date: d.date,
            rainProb: d.rainProb,
            rainSum: d.rainSumMm,
            tempMax: d.tempMax,
            dayName: d.dayNameUz,
          })),
        });

        // Trigger task if irrigation is needed ('irrigate_now' or soil moisture is deficient)
        const isIrrigationDue =
          irrigationRec.action === 'irrigate_now' ||
          (latestNdvi.moisture_percentage !== undefined && latestNdvi.moisture_percentage < 55 && maxRainProb < 60);

        if (isIrrigationDue) {
          if (!notifyIrrigationEnabled) {
            logs.push({
              farmerName: farmer.full_name,
              phone: farmer.phone,
              chatId: farmer.telegram_chat_id || '',
              fieldName: field.name,
              fieldId: field.id,
              alertType: 'irrigation_task',
              status: 'skipped_muted',
              reason: "Sug'orish vazifalari fermer tomonidan o'chirilgan (telegram_notify_irrigation = false)",
            });
            alertsSkippedCount++;
          } else if (sentTodaySet.has(irrigationKey) && !isForce) {
            logs.push({
              farmerName: farmer.full_name,
              phone: farmer.phone,
              chatId: farmer.telegram_chat_id || '',
              fieldName: field.name,
              fieldId: field.id,
              alertType: 'irrigation_task',
              status: 'skipped_duplicate',
              reason: "Ushbu maydon uchun bugungi sug'orish vazifasi allaqachon yuborilgan (Anti-spam)",
            });
            alertsSkippedCount++;
          } else {
            // Send Daily Irrigation Task with Inline Button!
            const irrigationTaskObj = formatTelegramDailyIrrigationTask(
              field,
              irrigationRec,
              field.area_hectares || 10
            );

            let sendSuccess = true;
            if (!isDryRun && farmer.telegram_chat_id) {
              const sendRes = await sendTelegramMessage({
                chatId: farmer.telegram_chat_id,
                text: irrigationTaskObj.text,
                replyMarkup: irrigationTaskObj.replyMarkup,
                parseMode: 'HTML',
              });
              sendSuccess = sendRes.ok;

              // Record in Supabase notifications_log
              if (isSupabaseConfigured && supabase && farmer.id) {
                try {
                  await supabase.from('notifications_log').insert({
                    farmer_id: farmer.id,
                    field_id: field.id,
                    phone: farmer.phone,
                    chat_id: String(farmer.telegram_chat_id),
                    type: 'irrigation_task',
                    status: sendSuccess ? 'sent' : 'failed',
                    payload: {
                      volumeM3PerHa: irrigationRec.recommendedVolumeM3PerHa,
                      totalWaterM3: irrigationRec.totalWaterM3,
                      action: irrigationRec.action,
                    },
                    created_at: new Date().toISOString(),
                  });
                } catch {}
              }
            }

            sentTodaySet.add(irrigationKey);
            alertsSentCount++;
            logs.push({
              farmerName: farmer.full_name,
              phone: farmer.phone,
              chatId: farmer.telegram_chat_id || '',
              fieldName: field.name,
              fieldId: field.id,
              alertType: 'irrigation_task',
              status: isDryRun ? 'simulated' : sendSuccess ? 'sent' : 'failed',
              details: {
                volumeM3PerHa: irrigationRec.recommendedVolumeM3PerHa,
                totalWaterM3: irrigationRec.totalWaterM3,
                timing: irrigationRec.timingAdvice.uz,
              },
            });
          }
        }

        // =====================================================================
        // ALERT 3: NDVI STRESS ALERT (Drop in vegetation index or < threshold)
        // =====================================================================
        const notifyNdviEnabled = farmer.telegram_notify_ndvi ?? true;
        const ndviKey = `${field.id}:ndvi_stress`;

        const currentNdviScore = Number(latestNdvi.ndvi_score) || 0.72;
        const prevNdviScore = previousNdvi ? Number(previousNdvi.ndvi_score) : null;
        const hasNdviDrop = prevNdviScore !== null && prevNdviScore - currentNdviScore >= 0.10;
        const isStressedScore = currentNdviScore < 0.45 || latestNdvi.status === 'critical' || latestNdvi.status === 'warning';

        if (hasNdviDrop || isStressedScore) {
          if (!notifyNdviEnabled) {
            logs.push({
              farmerName: farmer.full_name,
              phone: farmer.phone,
              chatId: farmer.telegram_chat_id || '',
              fieldName: field.name,
              fieldId: field.id,
              alertType: 'ndvi_stress',
              status: 'skipped_muted',
              reason: "NDVI stress ogohlantirishlari fermer tomonidan o'chirilgan (telegram_notify_ndvi = false)",
            });
            alertsSkippedCount++;
          } else if (sentTodaySet.has(ndviKey) && !isForce) {
            logs.push({
              farmerName: farmer.full_name,
              phone: farmer.phone,
              chatId: farmer.telegram_chat_id || '',
              fieldName: field.name,
              fieldId: field.id,
              alertType: 'ndvi_stress',
              status: 'skipped_duplicate',
              reason: "Ushbu maydon uchun bugun NDVI stress ogohlantirishi yuborilgan (Anti-spam)",
            });
            alertsSkippedCount++;
          } else {
            // Send NDVI Stress Alert!
            const ndviMsg = formatTelegramNdviStressAlert(
              field,
              currentNdviScore,
              prevNdviScore || undefined
            );

            let sendSuccess = true;
            if (!isDryRun && farmer.telegram_chat_id) {
              const sendRes = await sendTelegramMessage({
                chatId: farmer.telegram_chat_id,
                text: ndviMsg,
                parseMode: 'HTML',
              });
              sendSuccess = sendRes.ok;

              // Record in Supabase notifications_log
              if (isSupabaseConfigured && supabase && farmer.id) {
                try {
                  await supabase.from('notifications_log').insert({
                    farmer_id: farmer.id,
                    field_id: field.id,
                    phone: farmer.phone,
                    chat_id: String(farmer.telegram_chat_id),
                    type: 'ndvi_stress',
                    status: sendSuccess ? 'sent' : 'failed',
                    payload: { currentNdviScore, prevNdviScore, message: ndviMsg },
                    created_at: new Date().toISOString(),
                  });
                } catch {}
              }
            }

            sentTodaySet.add(ndviKey);
            alertsSentCount++;
            logs.push({
              farmerName: farmer.full_name,
              phone: farmer.phone,
              chatId: farmer.telegram_chat_id || '',
              fieldName: field.name,
              fieldId: field.id,
              alertType: 'ndvi_stress',
              status: isDryRun ? 'simulated' : sendSuccess ? 'sent' : 'failed',
              details: { currentNdviScore, prevNdviScore },
            });
          }
        }
      }
    }

    const durationMs = performance.now() - startTime;

    return NextResponse.json({
      ok: true,
      job: 'Ekinix Proactive Daily Telegram Alerts Job',
      timestamp: new Date().toISOString(),
      date: todayStr,
      durationMs: Number(durationMs.toFixed(1)),
      stats: {
        farmersProcessed,
        fieldsProcessed,
        alertsSentCount,
        alertsSkippedCount,
        totalEvaluations: alertsSentCount + alertsSkippedCount,
      },
      logs,
    });
  } catch (err: any) {
    console.error('[Cron Job Daily Alerts Fatal Error]', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Internal error in daily alerts cron job',
        durationMs: Number((performance.now() - startTime).toFixed(1)),
      },
      { status: 500 }
    );
  }
}
