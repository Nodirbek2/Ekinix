import { calculateGrowthStage, CropStageCare, CropGuideItem } from './cropGuidesData';

export type IrrigationActionType = 'irrigate_now' | 'wait' | 'reduce' | 'stop_harvest';

export interface IrrigationAdvisorInput {
  cropType: string; // 'cotton' | 'wheat' | 'apple' | 'grape' | 'tomato' | 'pomegranate' | 'corn' | 'orchard'
  daysSincePlanting?: number;
  plantingDate?: string;
  ndviValue: number; // 0.0 - 1.0 (e.g. 0.72)
  ndviTrend?: 'improving' | 'stable' | 'declining' | null;
  soilMoisture: number; // 0 - 100 percentage (e.g. 54)
  modeledSoilMoisture?: number; // Open-Meteo root-zone model (0-27cm)
  ndviMoisture?: number; // Sentinel-2 NDVI derived estimate
  moistureSource?: 'open_meteo_and_ndvi_hybrid' | 'agrometeorological_model' | 'ndvi_estimated';
  rainForecast?: Array<{
    date?: string;
    rainProb?: number; // 0 - 100
    rainSum?: number; // mm
    tempMax?: number; // °C
    dayName?: string;
  }>;
  areaHectares?: number; // default 1
  soilType?: 'sandy' | 'loam' | 'clay' | string; // default 'loam'
  irrigationMethod?: 'drip' | 'sprinkler' | 'furrow' | string; // default 'drip'
}

export interface IrrigationRecommendation {
  action: IrrigationActionType;
  actionBadge: {
    textUz: string;
    textRu: string;
    textEn: string;
    color: string;
    bg: string;
    border: string;
    icon: string;
  };
  recommendedVolumeM3PerHa: number;
  totalWaterM3: number;
  totalWaterLiters: string;
  waterAmountNotes: {
    uz: string;
    ru: string;
    en: string;
  };
  reasoning: {
    uz: string;
    ru: string;
    en: string;
  };
  transparencyNote: {
    uz: string;
    ru: string;
    en: string;
  };
  growthStage: {
    stageKey: string;
    stageNameUz: string;
    stageNameRu: string;
    stageNameEn: string;
    stageIndex: number;
    totalStages: number;
    daysElapsed: number;
    cropTitleUz: string;
    cropTitleRu: string;
    cropTitleEn: string;
  };
  timingAdvice: {
    uz: string;
    ru: string;
    en: string;
  };
  factors: {
    ndviValue: number;
    ndviTrend: 'improving' | 'stable' | 'declining' | 'unknown';
    soilMoisture: number;
    modeledSoilMoisture?: number;
    ndviMoisture?: number;
    moistureSource: string;
    isEstimated: boolean;
    rainProbNext48h: number;
    rainSumNext48h: number;
    tempMaxToday: number;
    soilType: string;
    irrigationMethod: string;
  };
}

/**
 * Extracts base water volume (m3 / ha) for a given crop and stage
 */
function getStageBaseWaterVolume(cropName: string, growthStageKey: string): number {
  const normCrop = cropName.toLowerCase();

  // Cotton / Paxta
  if (normCrop.includes('cotton') || normCrop.includes('paxta') || normCrop.includes('g\'o\'za')) {
    if (growthStageKey === 'germination') return 280;
    if (growthStageKey === 'vegetative') return 420;
    if (growthStageKey === 'flowering') return 580;
    if (growthStageKey === 'maturation_harvest') return 0;
    return 450;
  }

  // Wheat / Bug'doy
  if (normCrop.includes('wheat') || normCrop.includes('bug\'doy') || normCrop.includes('g\'alla')) {
    if (growthStageKey === 'germination') return 350;
    if (growthStageKey === 'vegetative') return 400;
    if (growthStageKey === 'flowering') return 450;
    if (growthStageKey === 'maturation_harvest') return 0;
    return 380;
  }

  // Tomato & Vegetables / Pomidor
  if (normCrop.includes('tomato') || normCrop.includes('pomidor') || normCrop.includes('sabzavot')) {
    if (growthStageKey === 'germination') return 250;
    if (growthStageKey === 'vegetative') return 350;
    if (growthStageKey === 'flowering') return 450;
    if (growthStageKey === 'maturation_harvest') return 200;
    return 320;
  }

  // Apple & Orchards / Olma
  if (normCrop.includes('apple') || normCrop.includes('olma') || normCrop.includes('bog\'') || normCrop.includes('orchard')) {
    if (growthStageKey === 'germination') return 300;
    if (growthStageKey === 'vegetative') return 500;
    if (growthStageKey === 'flowering') return 450;
    if (growthStageKey === 'maturation_harvest') return 0;
    return 420;
  }

  // Grape / Uzum
  if (normCrop.includes('grape') || normCrop.includes('uzum') || normCrop.includes('tokzor')) {
    if (growthStageKey === 'germination') return 300;
    if (growthStageKey === 'vegetative') return 450;
    if (growthStageKey === 'flowering') return 400;
    if (growthStageKey === 'maturation_harvest') return 0;
    return 350;
  }

  // Pomegranate / Anor
  if (normCrop.includes('pomegranate') || normCrop.includes('anor')) {
    if (growthStageKey === 'germination') return 250;
    if (growthStageKey === 'vegetative') return 400;
    if (growthStageKey === 'flowering') return 450;
    if (growthStageKey === 'maturation_harvest') return 0;
    return 360;
  }

  // Corn / Makkajo'xori
  if (normCrop.includes('corn') || normCrop.includes('makka')) {
    if (growthStageKey === 'germination') return 300;
    if (growthStageKey === 'vegetative') return 500;
    if (growthStageKey === 'flowering') return 600;
    if (growthStageKey === 'maturation_harvest') return 0;
    return 480;
  }

  // Default fallback
  if (growthStageKey === 'germination') return 280;
  if (growthStageKey === 'vegetative') return 420;
  if (growthStageKey === 'flowering') return 520;
  return 300;
}

/**
 * Main Precision Rules-Based Irrigation Recommendation Engine
 */
export function calculateIrrigationRecommendation(
  input: IrrigationAdvisorInput
): IrrigationRecommendation {
  const {
    cropType,
    daysSincePlanting,
    plantingDate,
    ndviValue = 0.70,
    ndviTrend = 'stable',
    soilMoisture = 55,
    rainForecast = [],
    areaHectares = 1,
    soilType = 'loam',
    irrigationMethod = 'drip',
  } = input;

  // 1. Calculate Growth Stage from Crop Guide Data
  let stageCalc;
  if (daysSincePlanting !== undefined && daysSincePlanting >= 0) {
    // Generate simulated planting date from daysSincePlanting
    const mockDate = new Date();
    mockDate.setDate(mockDate.getDate() - daysSincePlanting);
    stageCalc = calculateGrowthStage(cropType, mockDate.toISOString().split('T')[0]);
  } else {
    stageCalc = calculateGrowthStage(cropType, plantingDate);
  }

  const { guide, currentStage, stageIndex, totalStages, daysElapsed } = stageCalc;
  const stageGrowthKey = currentStage.growth_stage;

  // 2. Weather Aggregations for Next 48-72 Hours
  const next3Days = rainForecast.slice(0, 3);
  const rainSumNext48h = parseFloat(
    next3Days.reduce((acc, d) => acc + (d.rainSum || 0), 0).toFixed(1)
  );
  const rainProbNext48h = Math.max(...next3Days.map((d) => d.rainProb || 0), 0);
  const tempMaxToday = rainForecast[0]?.tempMax || 32;

  // 3. Modifiers (Soil & Method)
  const soilMultipliers: Record<string, number> = {
    sandy: 0.85, // drains quickly -> lighter volume, more frequent
    loam: 1.0,   // balanced typical loamy soil
    clay: 1.20,  // holds moisture -> heavier saturation required
  };

  const methodMultipliers: Record<string, number> = {
    drip: 0.65,      // 35% water savings
    sprinkler: 0.85, // 15% water savings
    furrow: 1.20,    // traditional flood / furrow loss
  };

  const soilFactor = soilMultipliers[soilType] || 1.0;
  const methodFactor = methodMultipliers[irrigationMethod] || 0.65;

  const baseVolume = getStageBaseWaterVolume(guide.crop_name, stageGrowthKey);
  const adjustedVolumePerHa = Math.round(baseVolume * soilFactor * methodFactor);
  const totalWaterM3 = Math.round(adjustedVolumePerHa * areaHectares);
  const totalWaterLiters = (totalWaterM3 * 1000).toLocaleString('ru-RU').replace(/,/g, ' ');

  // Trend descriptors for reasoning sentences
  const trendLabelUz = ndviTrend === 'improving' ? "o'sishda" : ndviTrend === 'declining' ? "pasayishda" : "barqaror";
  const trendLabelRu = ndviTrend === 'improving' ? "растёт" : ndviTrend === 'declining' ? "снижается" : "стабилен";
  const trendLabelEn = ndviTrend === 'improving' ? "improving" : ndviTrend === 'declining' ? "declining" : "stable";

  const transparencyNote = {
    uz: "Ushbu sug'orish tavsiyasi Open-Meteo agrometeorologik ildiz qatlami (0-27 sm) modeli va Sentinel-2 NDVI o'simlik salomatligi tahliliga asoslangan.",
    ru: "Эта рекомендация по поливу основана на агрометеорологической модели корневого слоя Open-Meteo (0-27 см) и анализе NDVI Sentinel-2.",
    en: "This irrigation recommendation is based on the Open-Meteo root-zone (0-27cm) physical model and Sentinel-2 NDVI canopy health analysis.",
  };

  const factorMetadata: IrrigationRecommendation['factors'] = {
    ndviValue,
    ndviTrend: (ndviTrend === 'improving' || ndviTrend === 'stable' || ndviTrend === 'declining') ? ndviTrend : 'unknown',
    soilMoisture,
    modeledSoilMoisture: input.modeledSoilMoisture,
    ndviMoisture: input.ndviMoisture,
    moistureSource: input.moistureSource || 'open_meteo_and_ndvi_hybrid',
    isEstimated: true,
    rainProbNext48h,
    rainSumNext48h,
    tempMaxToday,
    soilType,
    irrigationMethod,
  };

  // 4. Decision Rule Tree

  // RULE 1: Crop in Maturation / Pre-Harvest Drying Stage
  if (stageGrowthKey === 'maturation_harvest') {
    return {
      action: 'stop_harvest',
      actionBadge: {
        textUz: "Sug'orishni to'xtating",
        textRu: "Прекратить полив",
        textEn: "Stop Irrigation",
        color: "text-amber-900",
        bg: "bg-amber-100",
        border: "border-amber-300",
        icon: "🛑",
      },
      recommendedVolumeM3PerHa: 0,
      totalWaterM3: 0,
      totalWaterLiters: "0",
      waterAmountNotes: {
        uz: currentStage.irrigation_notes_uz,
        ru: currentStage.irrigation_notes_ru,
        en: currentStage.irrigation_notes_en,
      },
      reasoning: {
        uz: `Tavsiya: sug'ormang — ekin "${currentStage.stage_name_uz}" bosqichida bo'lib (taxminiy namlik ${soilMoisture}%), ortiqcha suv hosil pishishini kechiktiradi va tola/meva sifatini pasaytiradi.`,
        ru: `Рекомендация: не поливать — культура в фазе "${currentStage.stage_name_ru}" (оценочная влажность ${soilMoisture}%), избыточная влага задерживает созревание урожая.`,
        en: `Recommendation: do not irrigate — crop is in "${currentStage.stage_name_en}" phase (estimated moisture ${soilMoisture}%), excess water delays ripening.`,
      },
      transparencyNote,
      growthStage: {
        stageKey: stageGrowthKey,
        stageNameUz: currentStage.stage_name_uz,
        stageNameRu: currentStage.stage_name_ru,
        stageNameEn: currentStage.stage_name_en,
        stageIndex,
        totalStages,
        daysElapsed,
        cropTitleUz: guide.crop_title_uz,
        cropTitleRu: guide.crop_title_ru,
        cropTitleEn: guide.crop_title_en,
      },
      timingAdvice: {
        uz: "Hosil to'liq pishib yetilgunga qadar sug'orish tavsiya etilmaydi.",
        ru: "Полив не рекомендуется до полного сбора урожая.",
        en: "No irrigation recommended until harvesting is complete.",
      },
      factors: factorMetadata,
    };
  }

  // RULE 2: Significant Rain Incoming (Rain Sum >= 4mm OR Rain Probability >= 55%)
  if (rainSumNext48h >= 4 || rainProbNext48h >= 55) {
    return {
      action: 'wait',
      actionBadge: {
        textUz: "Kuting — Yomg'ir kutilmoqda",
        textRu: "Подождите — Ожидается дождь",
        textEn: "Wait — Rain Forecasted",
        color: "text-blue-900",
        bg: "bg-blue-100",
        border: "border-blue-300",
        icon: "🌧️",
      },
      recommendedVolumeM3PerHa: 0,
      totalWaterM3: 0,
      totalWaterLiters: "0",
      waterAmountNotes: {
        uz: currentStage.irrigation_notes_uz,
        ru: currentStage.irrigation_notes_ru,
        en: currentStage.irrigation_notes_en,
      },
      reasoning: {
        uz: `Tavsiya: kuting — yaqin 48 soatda ${rainSumNext48h > 0 ? `~${rainSumNext48h} mm ` : ''}yomg'ir ehtimoli ${rainProbNext48h}% bo'lib, hozirgi taxminiy namlik (${soilMoisture}%) hisobi bilan sug'orishni to'xtatib turish maqsadga muvofiq.`,
        ru: `Рекомендация: подождите — в течение 48 часов ожидаются осадки ${rainSumNext48h > 0 ? `(~${rainSumNext48h} мм) ` : ''}с вероятностью ${rainProbNext48h}%, при текущей оценке влажности ${soilMoisture}% полив не требуется.`,
        en: `Recommendation: wait — ${rainSumNext48h > 0 ? `~${rainSumNext48h} mm ` : ''}rain forecasted in next 48 hours (${rainProbNext48h}% chance), current estimated moisture ${soilMoisture}% is sufficient.`,
      },
      transparencyNote,
      growthStage: {
        stageKey: stageGrowthKey,
        stageNameUz: currentStage.stage_name_uz,
        stageNameRu: currentStage.stage_name_ru,
        stageNameEn: currentStage.stage_name_en,
        stageIndex,
        totalStages,
        daysElapsed,
        cropTitleUz: guide.crop_title_uz,
        cropTitleRu: guide.crop_title_ru,
        cropTitleEn: guide.crop_title_en,
      },
      timingAdvice: {
        uz: "Yomg'irdan so'ng tuproq namligi modelini qayta tekshirib, shunga ko'ra rejalashtiring.",
        ru: "Проверьте показатели влажности почвы после осадков для корректировки графика.",
        en: "Re-evaluate soil moisture telemetry after rainfall before scheduling next watering.",
      },
      factors: factorMetadata,
    };
  }

  // RULE 3: Light Rain Incoming (Rain Sum 1.5 - 3.9mm or Prob 35 - 54%) -> Reduce Water Volume by 40-50%
  if ((rainSumNext48h >= 1.5 || rainProbNext48h >= 35) && soilMoisture < 60) {
    const reducedVolumePerHa = Math.round(adjustedVolumePerHa * 0.55);
    const reducedTotalM3 = Math.round(reducedVolumePerHa * areaHectares);
    return {
      action: 'reduce',
      actionBadge: {
        textUz: "Suv me'yorini kamaytiring",
        textRu: "Уменьшите объём полива",
        textEn: "Reduce Water Volume",
        color: "text-teal-900",
        bg: "bg-teal-100",
        border: "border-teal-300",
        icon: "💧",
      },
      recommendedVolumeM3PerHa: reducedVolumePerHa,
      totalWaterM3: reducedTotalM3,
      totalWaterLiters: (reducedTotalM3 * 1000).toLocaleString('ru-RU').replace(/,/g, ' '),
      waterAmountNotes: {
        uz: currentStage.irrigation_notes_uz,
        ru: currentStage.irrigation_notes_ru,
        en: currentStage.irrigation_notes_en,
      },
      reasoning: {
        uz: `Tavsiya: suv me'yorini kamaytiring — ${rainSumNext48h > 0 ? `${rainSumNext48h} mm ` : ''}engil yomg'ir ehtimoli ${rainProbNext48h}% va taxminiy namlik ${soilMoisture}% bo'lgani uchun me'yorni ${reducedVolumePerHa} m³/ga gacha pasaytirish kifoya.`,
        ru: `Рекомендация: уменьшите норму полива — ожидается небольшой дождь (${rainProbNext48h}%), поэтому достаточно дать ${reducedVolumePerHa} м³/га при расчетной влажности ${soilMoisture}%.`,
        en: `Recommendation: reduce water volume — light rain possible (${rainProbNext48h}%), reducing rate to ${reducedVolumePerHa} m³/ha is sufficient for estimated ${soilMoisture}% moisture.`,
      },
      transparencyNote,
      growthStage: {
        stageKey: stageGrowthKey,
        stageNameUz: currentStage.stage_name_uz,
        stageNameRu: currentStage.stage_name_ru,
        stageNameEn: currentStage.stage_name_en,
        stageIndex,
        totalStages,
        daysElapsed,
        cropTitleUz: guide.crop_title_uz,
        cropTitleRu: guide.crop_title_ru,
        cropTitleEn: guide.crop_title_en,
      },
      timingAdvice: {
        uz: "05:00 - 08:30 oralig'ida yoki quyosh botgach (19:30 dan keyin) sug'oring.",
        ru: "Поливайте с 05:00 до 08:30 утра или после захода солнца (после 19:30).",
        en: "Irrigate between 05:00 - 08:30 AM or after sunset (past 19:30).",
      },
      factors: factorMetadata,
    };
  }

  // RULE 4: Moisture Deficit / Plant Stress (Moisture < 48% OR NDVI < 0.58 / declining OR Heat > 36°C with moisture < 54%)
  if (soilMoisture < 48 || ndviValue < 0.58 || ndviTrend === 'declining' || (tempMaxToday >= 36 && soilMoisture < 54)) {
    return {
      action: 'irrigate_now',
      actionBadge: {
        textUz: "Bugun sug'oring (Zarur)",
        textRu: "Полейте сегодня (Срочно)",
        textEn: "Irrigate Today (Urgent)",
        color: "text-emerald-900",
        bg: "bg-emerald-100",
        border: "border-emerald-300",
        icon: "🚰",
      },
      recommendedVolumeM3PerHa: adjustedVolumePerHa,
      totalWaterM3,
      totalWaterLiters,
      waterAmountNotes: {
        uz: currentStage.irrigation_notes_uz,
        ru: currentStage.irrigation_notes_ru,
        en: currentStage.irrigation_notes_en,
      },
      reasoning: {
        uz: `Tavsiya: zudlik bilan sug'oring — ildiz namligi ${soilMoisture}% (Open-Meteo va NDVI tahliliga ko'ra me'yordan past), ekin "${currentStage.stage_name_uz}" bosqichida suvga muhtoj.`,
        ru: `Рекомендация: полейте сейчас — влажность корневого слоя ${soilMoisture}% (по анализу Open-Meteo и NDVI ниже нормы), культуре в фазе "${currentStage.stage_name_ru}" требуется влага.`,
        en: `Recommendation: irrigate now — root moisture is ${soilMoisture}% (below threshold via Open-Meteo model & NDVI), crop in "${currentStage.stage_name_en}" requires watering.`,
      },
      transparencyNote,
      growthStage: {
        stageKey: stageGrowthKey,
        stageNameUz: currentStage.stage_name_uz,
        stageNameRu: currentStage.stage_name_ru,
        stageNameEn: currentStage.stage_name_en,
        stageIndex,
        totalStages,
        daysElapsed,
        cropTitleUz: guide.crop_title_uz,
        cropTitleRu: guide.crop_title_ru,
        cropTitleEn: guide.crop_title_en,
      },
      timingAdvice: {
        uz: "Eng ma'qul vaqt: 05:00 - 08:30 yoki 19:00 dan so'ng (kun issig'ida bug'lanish 35% ga oshadi).",
        ru: "Лучшее время: 05:00 - 08:30 или после 19:00 (в полуденную жару испарение возрастает на 35%).",
        en: "Optimal window: 05:00 - 08:30 AM or after 19:00 (midday heat increases evaporative loss by 35%).",
      },
      factors: factorMetadata,
    };
  }

  // RULE 5: Optimal Moisture Level (Moisture >= 62%, NDVI >= 0.65)
  if (soilMoisture >= 62) {
    return {
      action: 'wait',
      actionBadge: {
        textUz: "Kuting — Namlik yetarli",
        textRu: "Подождите — Влажность в норме",
        textEn: "Wait — Moisture Optimal",
        color: "text-emerald-900",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: "🌿",
      },
      recommendedVolumeM3PerHa: 0,
      totalWaterM3: 0,
      totalWaterLiters: "0",
      waterAmountNotes: {
        uz: currentStage.irrigation_notes_uz,
        ru: currentStage.irrigation_notes_ru,
        en: currentStage.irrigation_notes_en,
      },
      reasoning: {
        uz: `Tavsiya: kuting — taxminiy namlik ${soilMoisture}% (yetarli) va NDVI ${ndviValue} barqaror rivojlanishni ko'rsatmoqda. Hozircha sug'orish talab etilmaydi.`,
        ru: `Рекомендация: подождите — оценочная влажность ${soilMoisture}% (в норме) и NDVI ${ndviValue} подтверждают стабильное развитие. Полив пока не требуется.`,
        en: `Recommendation: wait — estimated moisture is ${soilMoisture}% (optimal) and NDVI ${ndviValue} indicates healthy vegetative vigor. No irrigation needed now.`,
      },
      transparencyNote,
      growthStage: {
        stageKey: stageGrowthKey,
        stageNameUz: currentStage.stage_name_uz,
        stageNameRu: currentStage.stage_name_ru,
        stageNameEn: currentStage.stage_name_en,
        stageIndex,
        totalStages,
        daysElapsed,
        cropTitleUz: guide.crop_title_uz,
        cropTitleRu: guide.crop_title_ru,
        cropTitleEn: guide.crop_title_en,
      },
      timingAdvice: {
        uz: "3-4 kundan so'ng tuproq namligi va sun'iy yo'ldosh suratini qayta tekshiring.",
        ru: "Повторно проверьте влажность почвы и спутниковый снимок через 3-4 дня.",
        en: "Re-check soil moisture telemetry in 3-4 days.",
      },
      factors: factorMetadata,
    };
  }

  // RULE 6: Standard Approaching Irrigation Cycle (Moisture 48% - 61%)
  const daysUntilNext = tempMaxToday >= 34 ? 2 : 3;
  return {
    action: 'wait',
    actionBadge: {
      textUz: `Rejali sug'orish (${daysUntilNext} kunda)`,
      textRu: `Плановый полив (через ${daysUntilNext} дн.)`,
      textEn: `Scheduled (${daysUntilNext} days)`,
      color: "text-amber-900",
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "⏳",
    },
    recommendedVolumeM3PerHa: adjustedVolumePerHa,
    totalWaterM3,
    totalWaterLiters,
    waterAmountNotes: {
      uz: currentStage.irrigation_notes_uz,
      ru: currentStage.irrigation_notes_ru,
      en: currentStage.irrigation_notes_en,
    },
    reasoning: {
      uz: `Tavsiya: ${daysUntilNext} kundan so'ng sug'oring — ildiz namligi ${soilMoisture}% (o'rtacha), o'simlik "${currentStage.stage_name_uz}" bosqichida me'yoriy suv talab qiladi (${adjustedVolumePerHa} m³/ga).`,
      ru: `Рекомендация: запланируйте полив через ${daysUntilNext} дня — влажность корневого слоя ${soilMoisture}% (умеренная), культуре в фазе "${currentStage.stage_name_ru}" потребуется плановый объём (${adjustedVolumePerHa} м³/га).`,
      en: `Recommendation: schedule irrigation in ${daysUntilNext} days — moisture is ${soilMoisture}% (moderate), crop in "${currentStage.stage_name_en}" will require standard volume (${adjustedVolumePerHa} m³/ha).`,
    },
    transparencyNote,
    growthStage: {
      stageKey: stageGrowthKey,
      stageNameUz: currentStage.stage_name_uz,
      stageNameRu: currentStage.stage_name_ru,
      stageNameEn: currentStage.stage_name_en,
      stageIndex,
      totalStages,
      daysElapsed,
      cropTitleUz: guide.crop_title_uz,
      cropTitleRu: guide.crop_title_ru,
      cropTitleEn: guide.crop_title_en,
    },
    timingAdvice: {
      uz: `Yaqin ${daysUntilNext} kun ichida 05:00 - 08:30 yoki 19:00 dan so'ng sug'orishni amalga oshiring.`,
      ru: `Осуществите полив в течение ${daysUntilNext} дней с 05:00 до 08:30 или после 19:00.`,
      en: `Carry out irrigation in the next ${daysUntilNext} days from 05:00 - 08:30 AM or after 19:00.`,
    },
    factors: factorMetadata,
  };
}
