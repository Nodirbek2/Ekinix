import { FieldRecord, NDVIReading, isSupabaseConfigured, supabase } from './supabase';

export interface NdviResult {
  fieldId: string;
  ndviScore: number;
  statusTier: 'healthy' | 'moderate' | 'stressed';
  moisturePercentage: number;
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

export async function fetchAndStoreFieldNdvi(field: FieldRecord, simulateCloud = false): Promise<NdviResult> {
  let prevScore: number | undefined;

  // 1. Try to load historical readings to find the most recent previous reading
  try {
    const localHistory = localStorage.getItem(`ekinix_ndvi_history_${field.id}`);
    if (localHistory) {
      const parsed: NDVIReading[] = JSON.parse(localHistory);
      if (parsed.length > 0) {
        prevScore = parsed[0].ndvi_score;
      }
    }
  } catch {
    // ignore
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
      console.warn("Error loading NDVI history from Supabase:", err);
    }
  }

  // 2. Fetch fresh satellite NDVI calculation from Sentinel API route
  let apiData;
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
      console.log(`[Sentinel Hub API Response for ${field.name || field.id}]:`, apiData);
    } else {
      console.warn(`[Sentinel Hub API Route returned status ${res.status}]`);
    }
  } catch (e) {
    console.warn("Sentinel route fetch error:", e);
  }

  // Fallback if API route is unreachable
  if (!apiData) {
    apiData = {
      fieldId: field.id,
      satelliteDate: new Date().toISOString().split('T')[0],
      ndviValue: null,
      statusTier: 'moderate',
      isCloudy: true,
      cloudCoverPercent: 85,
      moisturePercentage: 40,
      cloudMessageUz: "Bu hafta aniq sun'iy yo'ldosh tasviri yo'q — birozdan keyin qayta tekshiring",
      cloudMessageRu: "На этой неделе нет четкого спутникового снимка — проверьте позже",
      cloudMessageEn: "No clear satellite image this week — check back soon",
    };
  }

  const currentScore: number = apiData.ndviValue ?? 0;
  const statusTier: 'healthy' | 'moderate' | 'stressed' = apiData.statusTier;

  // Calculate trend relative to previous reading
  let trend: NdviResult['trend'] = null;
  if (typeof prevScore === 'number' && !isNaN(prevScore)) {
    const diff = parseFloat((currentScore - prevScore).toFixed(2));
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (diff >= 0.02) direction = 'improving';
    else if (diff <= -0.02) direction = 'declining';

    trend = { direction, diff, prevScore };
  }

  // Map 3-tier status to Supabase enum status
  const supabaseStatus: 'good' | 'warning' | 'critical' =
    statusTier === 'healthy' ? 'good' : statusTier === 'moderate' ? 'warning' : 'critical';

  // 3. Store new reading in Supabase ndvi_readings table
  if (isSupabaseConfigured && client && !apiData.isCloudy) {
    try {
      await client.from('ndvi_readings').insert({
        field_id: field.id,
        ndvi_score: currentScore,
        moisture_percentage: apiData.moisturePercentage,
        status: supabaseStatus,
        satellite_date: apiData.satelliteDate,
        recommendation_uz: "Sun'iy yo'ldosh orqali vegetatsiya va tuproq namligi tahlil qilindi.",
        recommendation_ru: "Влажность и вегетация проанализированы со спутника.",
        recommendation_en: "Vegetation and soil moisture analyzed via satellite.",
      });
    } catch (dbErr) {
      console.warn("Failed saving NDVI reading to Supabase:", dbErr);
    }
  }

  // Also save to localStorage history cache
  try {
    const newRecord: NDVIReading = {
      id: `ndvi_${Date.now()}`,
      field_id: field.id,
      ndvi_score: currentScore,
      moisture_percentage: apiData.moisturePercentage,
      status: supabaseStatus,
      satellite_date: apiData.satelliteDate,
      recommendation_uz: "Sog'lom ekin o'sishi.",
      recommendation_ru: "Здоровый рост посевов.",
      recommendation_en: "Healthy crop growth.",
    };

    const existingLocal = localStorage.getItem(`ekinix_ndvi_history_${field.id}`);
    const parsedList: NDVIReading[] = existingLocal ? JSON.parse(existingLocal) : [];
    const updatedList = [newRecord, ...parsedList].slice(0, 10);
    localStorage.setItem(`ekinix_ndvi_history_${field.id}`, JSON.stringify(updatedList));
  } catch {
    // ignore
  }

  return {
    fieldId: field.id,
    ndviScore: currentScore,
    statusTier,
    moisturePercentage: apiData.moisturePercentage,
    satelliteDate: apiData.satelliteDate,
    isCloudy: apiData.isCloudy,
    cloudCoverPercent: apiData.cloudCoverPercent,
    cloudMessageUz: apiData.cloudMessageUz,
    cloudMessageRu: apiData.cloudMessageRu,
    cloudMessageEn: apiData.cloudMessageEn,
    trend,
  };
}
