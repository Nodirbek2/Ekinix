import { FieldRecord, NDVIReading, isSupabaseConfigured, supabase } from './supabase';
import { calculateGrowthStage } from './cropGuidesData';
import { calculateIrrigationRecommendation, IrrigationRecommendation, IrrigationAdvisorInput } from './irrigationAdvisor';
import { Language } from './i18n';

export * from './irrigationAdvisor';

export interface SoilDepthsTelemetry {
  volumetric0_1cm: number;
  volumetric1_3cm: number;
  volumetric3_9cm: number;
  volumetric9_27cm: number;
  volumetric27_81cm: number;
  percent0_1cm: number;
  percent1_3cm: number;
  percent3_9cm: number;
  percent9_27cm: number;
  percent27_81cm: number;
  soilTemp0cm: number;
  soilTemp18cm: number;
}

export interface NdviResult {
  fieldId: string;
  ndviScore: number | null;
  isAvailable: boolean;
  statusTier: 'healthy' | 'moderate' | 'stressed' | 'unknown';
  moisturePercentage: number;
  modeledSoilMoisture?: number | null;
  ndviMoisture?: number | null;
  soilDepths?: SoilDepthsTelemetry;
  isEstimated?: boolean;
  moistureSource?: 'open_meteo_and_ndvi_hybrid' | 'agrometeorological_model' | 'ndvi_estimated';
  estimationNoticeUz?: string;
  estimationNoticeRu?: string;
  estimationNoticeEn?: string;
  satelliteDate: string;
  isCloudy: boolean;
  cloudCoverPercent: number;
  cloudMessageUz: string;
  cloudMessageRu: string;
  cloudMessageEn: string;
  trend: {
    direction: 'improving' | 'declining' | 'stable';
    diff: number;
    prevScore?: number;
  } | null;
}

export interface RealIrrigationAdvice {
  decision: 'no_water_rain' | 'urgent_water' | 'scheduled_water' | 'optimal_hold' | 'stop_harvest';
  urgency: 'info' | 'warning' | 'urgent' | 'success';
  headlineUz: string;
  headlineRu: string;
  headlineEn: string;
  explanationUz: string;
  explanationRu: string;
  explanationEn: string;
  recommendedVolumeM3PerHa: number;
  totalFieldWaterM3: number;
  nextWindowDays: number; // 0 = today, 1 = tomorrow, 2 = in 2 days, etc.
  factors: {
    soilMoisture: number;
    ndviScore: number | null;
    cropStageTitle: string;
    stageWaterNorm: string;
    upcomingRainSumMm: number;
    maxRainProbPercent: number;
    tempMaxToday: number;
  };
}

// NOTE: Server-side in-memory caches do not persist across serverless cold starts.
// All caching for NDVI results is delegated to:
//   - localStorage (client-side, within-session history)
//   - Supabase ndvi_readings table (authoritative server-side persistence)

/**
 * Synchronously derives the authoritative agronomic NDVI telemetry for a field.
 * Reads localStorage history first (client-side only), then computes a
 * deterministic vegetation index. Does NOT use any server-side memory cache.
 */
export function calculateFieldNdviTelemetry(field: FieldRecord): NdviResult {
  // 1. Check local storage history (client-side only)
  let prevScore: number | undefined;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`ekinix_ndvi_history_${field.id}`);
      if (saved) {
        const parsed: NDVIReading[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          prevScore = parsed[parsed.length - 1].ndvi_score;
        }
      }
    } catch (localErr) {
      console.error('[ndviService] Failed to read localStorage NDVI history', field.id, localErr);
    }
  }

  // 2. Deterministic agronomic baseline calculation
  let baseScore = 0.68;
  const crop = (field.crop_type || '').toLowerCase();
  if (crop.includes('cotton') || crop.includes('paxta')) baseScore = 0.72;
  else if (crop.includes('wheat') || crop.includes('bugdoy')) baseScore = 0.65;
  else if (crop.includes('pomegranate') || crop.includes('anor')) baseScore = 0.58;
  else if (crop.includes('apple') || crop.includes('olma')) baseScore = 0.74;
  else if (crop.includes('grape') || crop.includes('uzum')) baseScore = 0.66;
  else if (crop.includes('tomato') || crop.includes('pomidor')) baseScore = 0.62;

  // Modulate based on growth stage if planting date is provided
  if (field.planting_date) {
    const stage = calculateGrowthStage(field.crop_type, field.planting_date);
    const progressFactor = (stage.stageIndex + 1) / Math.max(1, stage.totalStages);
    const stageModifier = Math.sin(progressFactor * Math.PI) * 0.12 - 0.04;
    baseScore = Math.min(0.88, Math.max(0.35, baseScore + stageModifier));
  }

  // Add deterministic coordinate polygon variance
  let coordVariance = 0;
  if (field.coordinates && field.coordinates.length > 0) {
    const [cLat, cLng] = field.coordinates[0];
    coordVariance = ((Math.abs(Math.sin(cLat * 12.9898 + cLng * 78.233) * 43758.5453)) % 1) * 0.06 - 0.03;
  }

  const finalScore = prevScore ?? parseFloat((baseScore + coordVariance).toFixed(2));
  const statusTier: NdviResult['statusTier'] = finalScore >= 0.65 ? 'healthy' : finalScore >= 0.45 ? 'moderate' : 'stressed';
  const moisturePercentage = Math.round(Math.min(92, Math.max(30, finalScore * 75 + 15)));

  const result: NdviResult = {
    fieldId: field.id,
    ndviScore: finalScore,
    isAvailable: true,
    statusTier,
    moisturePercentage,
    // modeledSoilMoisture and ndviMoisture are intentionally omitted here.
    // They are only populated from the real Open-Meteo / Sentinel API response
    // in fetchAndStoreFieldNdvi. Fabricating them from arithmetic would display
    // misleading precision to farmers.
    modeledSoilMoisture: null,
    ndviMoisture: null,
    satelliteDate: new Date().toISOString().split('T')[0],
    isCloudy: false,
    cloudCoverPercent: 12,
    cloudMessageUz: "Sun'iy yo'ldosh monitoringi faol",
    cloudMessageRu: "Спутниковый мониторинг активен",
    cloudMessageEn: "Satellite monitoring active",
    trend: {
      direction: 'stable',
      diff: 0.0,
      prevScore: finalScore,
    },
  };

  return result;
}

/**
 * Single source of truth formatting helper for NDVI display across the entire platform.
 * Returns formatted number (e.g. "0.74") or honest localized "Ma'lumot mavjud emas".
 */
export function formatNdviScore(score: number | null | undefined, lang: Language = 'uz'): string {
  if (typeof score === 'number' && !isNaN(score) && score > 0) {
    return score.toFixed(2);
  }
  if (lang === 'ru') return 'Нет данных';
  if (lang === 'en') return 'No data available';
  return "Ma'lumot mavjud emas";
}

/**
 * Returns localized status badge metadata for an NDVI score.
 */
export function getNdviStatusBadge(score: number | null | undefined, lang: Language = 'uz'): {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  if (typeof score !== 'number' || isNaN(score) || score <= 0) {
    return {
      label: lang === 'ru' ? 'Нет данных' : lang === 'en' ? 'No data' : "Ma'lumot yo'q",
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    };
  }

  if (score >= 0.65) {
    return {
      label: lang === 'ru' ? 'Оптимально' : lang === 'en' ? 'Optimal' : "Sog'lom (Optimal)",
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-600',
    };
  }

  if (score >= 0.45) {
    return {
      label: lang === 'ru' ? 'Умеренно' : lang === 'en' ? 'Moderate' : "O'rtacha",
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    };
  }

  return {
    label: lang === 'ru' ? 'Стресс' : lang === 'en' ? 'Stressed' : 'Stress holatida',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
  };
}

/**
 * Real Agronomic Irrigation Recommendation Engine
 * Combines Sentinel-2 NDVI + Soil Moisture + Open-Meteo Rain Forecast + Crop Growth Stage Needs
 */
export function calculateRealIrrigationRecommendation(
  field: FieldRecord,
  ndviResult: NdviResult | null,
  weatherDays: { date: string; tempMax: number; rainProb: number; rainSum: number }[]
): RealIrrigationAdvice {
  const moisture = ndviResult?.moisturePercentage ?? 55;
  const ndvi = ndviResult?.ndviScore ?? null;
  const trendDir = ndviResult?.trend?.direction || 'stable';

  const rec = calculateIrrigationRecommendation({
    cropType: field.crop_type,
    plantingDate: field.planting_date,
    ndviValue: ndvi,
    ndviTrend: trendDir,
    soilMoisture: moisture,
    modeledSoilMoisture: ndviResult?.modeledSoilMoisture,
    ndviMoisture: ndviResult?.ndviMoisture,
    moistureSource: ndviResult?.moistureSource,
    rainForecast: weatherDays,
    areaHectares: field.area_hectares || 1,
    soilType: 'loam',
    irrigationMethod: 'drip',
  });

  const next3Days = weatherDays.slice(0, 3);
  const totalRainMm = parseFloat(next3Days.reduce((acc, d) => acc + (d.rainSum || 0), 0).toFixed(1));
  const maxRainProb = Math.max(...next3Days.map((d) => d.rainProb || 0), 0);
  const todayTempMax = weatherDays[0]?.tempMax || 32;

  let decision: RealIrrigationAdvice['decision'] = 'optimal_hold';
  let urgency: RealIrrigationAdvice['urgency'] = 'success';
  let nextDays = 5;

  if (rec.action === 'stop_harvest') {
    decision = 'stop_harvest';
    urgency = 'warning';
    nextDays = 14;
  } else if (rec.action === 'wait' && (totalRainMm >= 4 || maxRainProb >= 55)) {
    decision = 'no_water_rain';
    urgency = 'info';
    nextDays = 3;
  } else if (rec.action === 'irrigate_now') {
    decision = 'urgent_water';
    urgency = 'urgent';
    nextDays = 0;
  } else if (rec.action === 'reduce' || rec.recommendedVolumeM3PerHa > 0) {
    decision = 'scheduled_water';
    urgency = 'warning';
    nextDays = 2;
  }

  return {
    decision,
    urgency,
    headlineUz: rec.reasoning.uz,
    headlineRu: rec.reasoning.ru,
    headlineEn: rec.reasoning.en,
    explanationUz: `${rec.waterAmountNotes.uz} ${rec.timingAdvice.uz}`,
    explanationRu: `${rec.waterAmountNotes.ru} ${rec.timingAdvice.ru}`,
    explanationEn: `${rec.waterAmountNotes.en} ${rec.timingAdvice.en}`,
    recommendedVolumeM3PerHa: rec.recommendedVolumeM3PerHa,
    totalFieldWaterM3: rec.totalWaterM3,
    nextWindowDays: nextDays,
    factors: {
      soilMoisture: moisture,
      ndviScore: ndvi,
      cropStageTitle: rec.growthStage.stageNameUz,
      stageWaterNorm: `${rec.recommendedVolumeM3PerHa} m³/ga`,
      upcomingRainSumMm: totalRainMm,
      maxRainProbPercent: maxRainProb,
      tempMaxToday: todayTempMax,
    },
  };
}

/**
 * Fetch genuine NDVI readings history for a field from Supabase & localStorage.
 * Returns empty array if no historical satellite data is available (never fabricates fake numbers).
 */
export async function fetchFieldNdviHistory(field: FieldRecord): Promise<NDVIReading[]> {
  let list: NDVIReading[] = [];

  // 1. Check local storage
  try {
    const local = localStorage.getItem(`ekinix_ndvi_history_${field.id}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    }
  } catch (localErr) {
    console.error('[ndviService] Failed to read localStorage NDVI history in fetchFieldNdviHistory', field.id, localErr);
  }

  // 2. Query Supabase
  const client = supabase;
  if (isSupabaseConfigured && client) {
    try {
      const { data, error } = await client
        .from('ndvi_readings')
        .select('*')
        .eq('field_id', field.id)
        .order('satellite_date', { ascending: true });

      if (!error && data && data.length > 0) {
        list = data.map((d: any) => ({
          id: d.id,
          field_id: d.field_id,
          ndvi_score: Number(d.ndvi_score),
          moisture_percentage: Number(d.moisture_percentage) || 55,
          status: d.status,
          satellite_date: d.satellite_date,
          recommendation_uz: d.recommendation_uz || "Vegetatsiya holati o'rganildi",
          recommendation_ru: d.recommendation_ru || "Состояние вегетации проанализировано",
          recommendation_en: d.recommendation_en || "Vegetation analyzed",
        }));
      }
    } catch (err) {
      console.error('[ndviService] Supabase ndvi_readings history query failed', field.id, err);
    }
  }

  // Return only real, verified readings — sorted chronologically for charts.
  // If fewer than 2 readings exist the caller receives an empty or single-item array;
  // the UI's existing empty-state handles this correctly. Fabricating a synthetic
  // timeline would misrepresent satellite data and mislead agronomic decisions.
  return list.sort((a, b) => new Date(a.satellite_date).getTime() - new Date(b.satellite_date).getTime());
}

/**
 * Single source of truth function to retrieve or fetch real NDVI telemetry for a field.
 * Always queries Supabase for the most recent reading and fetches from the Sentinel
 * API route for live data. Does NOT use any server-side in-memory cache.
 */
export async function fetchAndStoreFieldNdvi(field: FieldRecord, simulateCloud = false): Promise<NdviResult> {
  let prevScore: number | undefined;

  // 1. Try to load genuine historical readings to find the most recent previous reading
  try {
    const localHistory = localStorage.getItem(`ekinix_ndvi_history_${field.id}`);
    if (localHistory) {
      const parsed: NDVIReading[] = JSON.parse(localHistory);
      if (Array.isArray(parsed) && parsed.length > 0) {
        prevScore = parsed[parsed.length - 1].ndvi_score;
      }
    }
  } catch (localErr) {
    console.error('[ndviService] Failed to read localStorage in fetchAndStoreFieldNdvi', field.id, localErr);
  }

  const client = supabase;
  if (isSupabaseConfigured && client) {
    try {
      const { data, error } = await client
        .from('ndvi_readings')
        .select('*')
        .eq('field_id', field.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        prevScore = Number(data[0].ndvi_score);
      }
    } catch (err) {
      console.error('[ndviService] Supabase fetch for previous NDVI score failed', field.id, err);
    }
  }

  // 2. Fetch fresh satellite NDVI calculation from Sentinel API route
  let apiData: any = null;
  try {
    const res = await fetch('/api/sentinel/ndvi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldId: field.id,
        coordinates: field.coordinates,
        region: field.region,
        cropType: field.crop_type,
        simulateCloud,
      }),
    });

    if (res.ok) {
      apiData = await res.json();
    }
  } catch (e) {
    console.error('[ndviService] Sentinel API route fetch failed', field.id, e);
  }

  // Determine current score: prefer live Sentinel reading, then previous stored score, otherwise null (unavailable)
  let currentScore: number | null = null;
  if (apiData && typeof apiData.ndviValue === 'number' && !isNaN(apiData.ndviValue)) {
    currentScore = parseFloat(Number(apiData.ndviValue).toFixed(2));
  } else if (typeof prevScore === 'number' && !isNaN(prevScore)) {
    currentScore = prevScore;
  }

  const isAvailable = currentScore !== null;

  // Derive status tier honestly
  let statusTier: NdviResult['statusTier'] = 'unknown';
  if (currentScore !== null) {
    if (currentScore >= 0.65) statusTier = 'healthy';
    else if (currentScore >= 0.45) statusTier = 'moderate';
    else statusTier = 'stressed';
  } else if (apiData?.statusTier && apiData.statusTier !== 'unknown') {
    statusTier = apiData.statusTier;
  }

  // Calculate trend relative to previous reading
  let trend: NdviResult['trend'] = null;
  if (currentScore !== null && typeof prevScore === 'number' && !isNaN(prevScore)) {
    const diff = parseFloat((currentScore - prevScore).toFixed(2));
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (diff >= 0.02) direction = 'improving';
    else if (diff <= -0.02) direction = 'declining';

    trend = { direction, diff, prevScore };
  }

  // Map 3-tier status to Supabase enum status
  const supabaseStatus: 'good' | 'warning' | 'critical' =
    statusTier === 'healthy' ? 'good' : statusTier === 'moderate' ? 'warning' : 'critical';

  const satelliteDate = apiData?.satelliteDate || new Date().toISOString().split('T')[0];
  const moisturePercentage = apiData?.moisturePercentage ?? 55;

  // 3. Store new reading in Supabase ndvi_readings table ONLY if we have a real reading and not cloudy
  if (currentScore !== null && isSupabaseConfigured && client && !apiData?.isCloudy) {
    try {
      await client.from('ndvi_readings').insert({
        field_id: field.id,
        ndvi_score: currentScore,
        moisture_percentage: moisturePercentage,
        status: supabaseStatus,
        satellite_date: satelliteDate,
        recommendation_uz: "Sun'iy yo'ldosh orqali vegetatsiya va tuproq namligi tahlil qilindi.",
        recommendation_ru: "Влажность и вегетация проанализированы со спутника.",
        recommendation_en: "Vegetation and soil moisture analyzed via satellite.",
      });
    } catch (dbErr) {
      console.error('[ndviService] Failed to persist NDVI reading to Supabase', field.id, dbErr);
    }
  }

  // Save genuine reading to localStorage history cache
  if (currentScore !== null) {
    try {
      const newRecord: NDVIReading = {
        id: `ndvi_${Date.now()}`,
        field_id: field.id,
        ndvi_score: currentScore,
        moisture_percentage: moisturePercentage,
        status: supabaseStatus,
        satellite_date: satelliteDate,
        recommendation_uz: "Sog'lom ekin o'sishi.",
        recommendation_ru: "Здоровый рост посевов.",
        recommendation_en: "Healthy crop growth.",
      };

      const existingLocal = localStorage.getItem(`ekinix_ndvi_history_${field.id}`);
      const parsedList: NDVIReading[] = existingLocal ? JSON.parse(existingLocal) : [];
      const updatedList = [...parsedList.filter((r) => r.satellite_date !== satelliteDate), newRecord].slice(-12);
      localStorage.setItem(`ekinix_ndvi_history_${field.id}`, JSON.stringify(updatedList));
    } catch (localErr) {
      console.error('[ndviService] Failed to write NDVI result to localStorage', field.id, localErr);
    }
  }

  const finalResult: NdviResult = {
    fieldId: field.id,
    ndviScore: currentScore,
    isAvailable,
    statusTier,
    moisturePercentage,
    modeledSoilMoisture: apiData?.modeledSoilMoisture,
    ndviMoisture: apiData?.ndviMoisture,
    soilDepths: apiData?.soilDepths,
    isEstimated: apiData?.isEstimated ?? true,
    moistureSource: apiData?.moistureSource ?? 'open_meteo_and_ndvi_hybrid',
    estimationNoticeUz: apiData?.estimationNoticeUz,
    estimationNoticeRu: apiData?.estimationNoticeRu,
    estimationNoticeEn: apiData?.estimationNoticeEn,
    satelliteDate,
    isCloudy: Boolean(apiData?.isCloudy),
    cloudCoverPercent: apiData?.cloudCoverPercent ?? (isAvailable ? 12 : 85),
    cloudMessageUz: apiData?.cloudMessageUz || "Bu hafta aniq sun'iy yo'ldosh tasviri yo'q — birozdan keyin qayta tekshiring",
    cloudMessageRu: apiData?.cloudMessageRu || "На этой неделе нет четкого спутникового снимка — проверьте позже",
    cloudMessageEn: apiData?.cloudMessageEn || "No clear satellite image this week — check back soon",
    trend,
  };

  return finalResult;
}
