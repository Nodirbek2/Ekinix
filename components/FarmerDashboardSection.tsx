'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FieldRecord, FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { fetchAndStoreFieldNdvi, NdviResult } from '@/lib/ndviService';
import { calculateGrowthStage } from '@/lib/cropGuidesData';
import { CROP_OPTIONS } from '@/components/FarmerOnboardingModal';
import { FieldCardThumbnail } from '@/components/FieldCardThumbnail';
import { FieldMonitoringMap } from '@/components/FieldMonitoringMap';
import { UnifiedFieldDetailView } from '@/components/UnifiedFieldDetailView';
import { calculateIrrigationRecommendation } from '@/lib/irrigationAdvisor';
import { Button } from '@/components/ui/Button';
import {
  LayoutDashboard, Plus, Sprout, MapPin, Sparkles, RefreshCw,
  AlertTriangle, ShieldAlert, CheckCircle2, Droplets, CloudRain,
  Sun, CloudSun, Calendar, Activity, ChevronRight, X, ExternalLink,
  Layers, ArrowUpRight, TrendingUp, TrendingDown, Minus, Info,
  Flame, Bug, BookOpen, Clock, Waves, Compass
} from 'lucide-react';

interface FarmerDashboardSectionProps {
  currentLang: Language;
  userProfile?: FarmerProfile | null;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onNavigateToFields?: () => void;
}

interface AlertItem {
  id: string;
  fieldId: string;
  fieldName: string;
  cropType: string;
  category: 'weather' | 'stress' | 'pest' | 'info';
  severity: 'critical' | 'warning' | 'info';
  urgencyScore: number; // 0 to 100
  titleUz: string;
  titleRu: string;
  titleEn: string;
  descUz: string;
  descRu: string;
  descEn: string;
  actionTextUz: string;
  actionTextRu: string;
  actionTextEn: string;
}

interface FieldWeatherInfo {
  tempMax: number;
  tempMin: number;
  rainProbMax: number;
  rainSum: number;
  condition: string;
}

const DEMO_DASHBOARD_FIELDS: FieldRecord[] = [
  {
    id: 'dash_field_1',
    name: "Toshkent Paxta Maydoni #1",
    crop_type: 'cotton',
    planting_date: '2026-04-12',
    area_hectares: 14.2,
    region: "Toshkent viloyati",
    coordinates: [
      [41.2995, 69.2401],
      [41.3025, 69.2435],
      [41.3000, 69.2480],
      [41.2970, 69.2440],
    ],
  },
  {
    id: 'dash_field_2',
    name: "Samarqand Kuzgi Bug'doy",
    crop_type: 'wheat',
    planting_date: '2025-11-01',
    area_hectares: 9.5,
    region: "Samarqand viloyati",
    coordinates: [
      [39.6542, 66.9597],
      [39.6570, 66.9630],
      [39.6530, 66.9670],
      [39.6500, 66.9620],
    ],
  },
  {
    id: 'dash_field_3',
    name: "Farg'ona Anor Bog'i",
    crop_type: 'pomegranate',
    planting_date: '2024-03-15',
    area_hectares: 4.6,
    region: "Farg'ona viloyati",
    coordinates: [
      [40.3842, 71.7843],
      [40.3870, 71.7880],
      [40.3830, 71.7920],
      [40.3810, 71.7870],
    ],
  },
];

export const FarmerDashboardSection: React.FC<FarmerDashboardSectionProps> = ({
  currentLang,
  userProfile,
  onOpenAuth,
  onNavigateToFields,
}) => {
  const t = translations[currentLang];
  const [fields, setFields] = useState<FieldRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Field Telemetry & Weather Map
  const [ndviMap, setNdviMap] = useState<Record<string, NdviResult>>({});
  const [weatherMap, setWeatherMap] = useState<Record<string, FieldWeatherInfo>>({});

  // Active Alert Filter Tab
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'weather' | 'pest'>('all');

  // Selected Field for Deep-Dive Modal (Map + NDVI + Irrigation + Crop Guide)
  const [selectedFieldForDetail, setSelectedFieldForDetail] = useState<FieldRecord | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'overview' | 'map' | 'ndvi' | 'weather' | 'guide'>('overview');

  // Helper for crop metadata
  const getCropMeta = React.useCallback((cropId: string) => {
    const match = CROP_OPTIONS.find((c) => c.id === cropId);
    if (match) {
      return {
        icon: match.icon,
        label: t[match.nameKey as keyof typeof t] || cropId,
      };
    }
    return { icon: '🌱', label: cropId };
  }, [t]);

  // 1. Load registered fields from Supabase or localStorage
  useEffect(() => {
    let active = true;

    async function initFields() {
      let list: FieldRecord[] = [];

      try {
        const saved = localStorage.getItem('ekinix_farmer_fields');
        if (saved) {
          list = JSON.parse(saved);
        }
      } catch {
        // ignore
      }

      const client = supabase;
      if (isSupabaseConfigured && client && userProfile?.user_id) {
        try {
          const { data, error } = await client
            .from('fields')
            .select('*')
            .or(`user_id.eq.${userProfile.user_id},farmer_id.eq.${userProfile.id || 'none'}`)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const parsed = data.map((item: any) => ({
              id: item.id,
              user_id: item.user_id,
              farmer_id: item.farmer_id,
              name: item.name,
              crop_type: item.crop_type,
              planting_date: item.planting_date || '2026-04-10',
              area_hectares: Number(item.area_hectares) || 1.5,
              region: item.region || userProfile.region || "Toshkent viloyati",
              coordinates: item.coordinates_json || item.coordinates || [],
            }));
            list = parsed;
          }
        } catch (err) {
          console.warn("Supabase dashboard load notice:", err);
        }
      }

      if (list.length === 0 && !userProfile) {
        list = DEMO_DASHBOARD_FIELDS;
      }

      if (active) {
        setFields(list);
        setLoading(false);
      }
    }

    initFields();

    return () => {
      active = false;
    };
  }, [userProfile]);

  // 2. Fetch live telemetry (NDVI + Open-Meteo Weather) for all loaded fields
  useEffect(() => {
    if (fields.length === 0) return;

    let isMounted = true;

    async function loadAllTelemetry() {
      const newNdviMap: Record<string, NdviResult> = {};
      const newWeatherMap: Record<string, FieldWeatherInfo> = {};

      for (const field of fields) {
        // Fetch NDVI (cached or live Sentinel)
        try {
          const ndvi = await fetchAndStoreFieldNdvi(field);
          newNdviMap[field.id] = ndvi;
        } catch {
          newNdviMap[field.id] = {
            fieldId: field.id,
            ndviScore: 0.68,
            statusTier: 'healthy',
            moisturePercentage: 55,
            satelliteDate: new Date().toISOString().split('T')[0],
            isCloudy: false,
            cloudCoverPercent: 12,
            cloudMessageUz: '',
            cloudMessageRu: '',
            cloudMessageEn: '',
            trend: { direction: 'improving', diff: 0.04 },
          };
        }

        // Fetch Weather
        try {
          const lat = field.coordinates?.[0]?.[0] || 41.2995;
          const lon = field.coordinates?.[0]?.[1] || 69.2401;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const maxTemp = Math.round(data.daily?.temperature_2m_max?.[0] ?? 32);
            const minTemp = Math.round(data.daily?.temperature_2m_min?.[0] ?? 20);
            const rainProb = Math.round(data.daily?.precipitation_probability_max?.[0] ?? 15);
            const rainSum = parseFloat((data.daily?.precipitation_sum?.[0] ?? 0).toFixed(1));

            newWeatherMap[field.id] = {
              tempMax: maxTemp,
              tempMin: minTemp,
              rainProbMax: rainProb,
              rainSum,
              condition: rainProb >= 60 ? 'rainy' : maxTemp >= 38 ? 'hot' : 'clear',
            };
          }
        } catch {
          newWeatherMap[field.id] = {
            tempMax: 33,
            tempMin: 21,
            rainProbMax: 20,
            rainSum: 0,
            condition: 'clear',
          };
        }
      }

      if (isMounted) {
        setNdviMap(newNdviMap);
        setWeatherMap(newWeatherMap);
      }
    }

    loadAllTelemetry();

    return () => {
      isMounted = false;
    };
  }, [fields]);

  const handleRefresh = async () => {
    setRefreshing(true);
    let list: FieldRecord[] = [];
    try {
      const saved = localStorage.getItem('ekinix_farmer_fields');
      if (saved) {
        list = JSON.parse(saved);
      }
    } catch {
      // ignore
    }

    const client = supabase;
    if (isSupabaseConfigured && client && userProfile?.user_id) {
      try {
        const { data, error } = await client
          .from('fields')
          .select('*')
          .or(`user_id.eq.${userProfile.user_id},farmer_id.eq.${userProfile.id || 'none'}`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const parsed = data.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            farmer_id: item.farmer_id,
            name: item.name,
            crop_type: item.crop_type,
            planting_date: item.planting_date || '2026-04-10',
            area_hectares: Number(item.area_hectares) || 1.5,
            region: item.region || userProfile.region || "Toshkent viloyati",
            coordinates: item.coordinates_json || item.coordinates || [],
          }));
          list = parsed;
        }
      } catch (err) {
        console.warn("Supabase dashboard refresh notice:", err);
      }
    }

    if (list.length === 0 && !userProfile) {
      list = DEMO_DASHBOARD_FIELDS;
    }

    setFields(list);
    setTimeout(() => setRefreshing(false), 600);
  };

  // 3. STATS CALCULATIONS
  const totalHectares = useMemo(() => {
    return fields.reduce((acc, f) => acc + (f.area_hectares || 0), 0);
  }, [fields]);

  const averageNdvi = useMemo(() => {
    const scores = Object.values(ndviMap)
      .filter((n) => !n.isCloudy && n.ndviScore > 0)
      .map((n) => n.ndviScore);

    if (scores.length === 0) return 0.71;
    const sum = scores.reduce((a, b) => a + b, 0);
    return parseFloat((sum / scores.length).toFixed(2));
  }, [ndviMap]);

  const estimatedWaterSaved = useMemo(() => {
    // Estimating ~280 m3 saved water per hectare per month with precision weather-guided scheduling
    return Math.round(totalHectares * 280);
  }, [totalHectares]);

  // 4. DYNAMIC ALERTS GENERATOR (Across all registered fields, sorted by urgency)
  const alertsList = useMemo(() => {
    const list: AlertItem[] = [];

    fields.forEach((field) => {
      const ndvi = ndviMap[field.id];
      const weather = weatherMap[field.id];
      const cropMeta = getCropMeta(field.crop_type);
      const calc = calculateGrowthStage(field.crop_type, field.planting_date);
      const stage = calc.currentStage;

      // Alert 1: Severe / Moderate NDVI Vegetation Stress
      if (ndvi && !ndvi.isCloudy) {
        if (ndvi.ndviScore < 0.45 || ndvi.statusTier === 'stressed') {
          list.push({
            id: `alert_stress_${field.id}`,
            fieldId: field.id,
            fieldName: field.name,
            cropType: field.crop_type,
            category: 'stress',
            severity: 'critical',
            urgencyScore: 95,
            titleUz: "🚨 Yuqori o'simlik stressi / suvsizlik aniqlandi",
            titleRu: "🚨 Обнаружен высокий стресс растений / дефицит влаги",
            titleEn: "🚨 High crop stress / moisture deficiency detected",
            descUz: `${field.name} maydonida NDVI ko'rsatkichi kritik darajada (${ndvi.ndviScore}). Ildiz tizimini va namlikni zudlik bilan tekshiring.`,
            descRu: `На поле ${field.name} индекс NDVI на критическом уровне (${ndvi.ndviScore}). Срочно проверьте корневую систему и влажность.`,
            descEn: `Critical NDVI reading (${ndvi.ndviScore}) on ${field.name}. Inspect root moisture immediately.`,
            actionTextUz: "Maydonni ko'rish",
            actionTextRu: "Открыть поле",
            actionTextEn: "View field",
          });
        } else if (ndvi.ndviScore < 0.58 || ndvi.statusTier === 'moderate') {
          list.push({
            id: `alert_moderate_${field.id}`,
            fieldId: field.id,
            fieldName: field.name,
            cropType: field.crop_type,
            category: 'stress',
            severity: 'warning',
            urgencyScore: 65,
            titleUz: "⚠️ Vegetatsiya sur'ati biroz sustlashgan",
            titleRu: "⚠️ Умеренное замедление вегетации",
            titleEn: "⚠️ Moderate vegetation slowdown detected",
            descUz: `${field.name} (${cropMeta.label}) NDVI darajasi ${ndvi.ndviScore}. Oziqlantirish va tuproq yumshatish tavsiya etiladi.`,
            descRu: `Поле ${field.name} (${cropMeta.label}) NDVI: ${ndvi.ndviScore}. Рекомендуется подкормка и рыхление.`,
            descEn: `Field ${field.name} (${cropMeta.label}) NDVI is ${ndvi.ndviScore}. Foliar feeding and soil aerating recommended.`,
            actionTextUz: "Tahlilni ko'rish",
            actionTextRu: "Смотреть анализ",
            actionTextEn: "Check telemetry",
          });
        }
      }

      // Alert 2: Weather Rain Event (Save Water & Stop Irrigation)
      if (weather && weather.rainProbMax >= 60) {
        list.push({
          id: `alert_rain_${field.id}`,
          fieldId: field.id,
          fieldName: field.name,
          cropType: field.crop_type,
          category: 'weather',
          severity: 'warning',
          urgencyScore: 85,
          titleUz: "🌧️ Yaqin 24 soatda yomg'ir kutilmoqda: Sug'orishni to'xtating",
          titleRu: "🌧️ Ожидается дождь в ближайшие 24ч: Приостановите полив",
          titleEn: "🌧️ Heavy rain expected next 24h: Pause irrigation to save water",
          descUz: `${field.region} hududida yog'ingarchilik ehtimoli ${weather.rainProbMax}% (~${weather.rainSum} mm). Sug'orishni kechiktirib, suv va yoqilg'ini tejang.`,
          descRu: `В регионе ${field.region} вероятность осадков ${weather.rainProbMax}% (~${weather.rainSum} мм). Отложите полив для экономии воды.`,
          descEn: `Rain probability is ${weather.rainProbMax}% (~${weather.rainSum} mm) in ${field.region}. Delay irrigation to save resources.`,
          actionTextUz: "Sug'orish grafigi",
          actionTextRu: "График полива",
          actionTextEn: "Irrigation plan",
        });
      }

      // Alert 3: Extreme Heatwave Alert
      if (weather && weather.tempMax >= 38) {
        list.push({
          id: `alert_heat_${field.id}`,
          fieldId: field.id,
          fieldName: field.name,
          cropType: field.crop_type,
          category: 'weather',
          severity: 'warning',
          urgencyScore: 75,
          titleUz: `🔥 Yuqori harorat (${weather.tempMax}°C): Erta tongda sug'orish zarur`,
          titleRu: `🔥 Сильная жара (${weather.tempMax}°C): Полив только рано утром`,
          titleEn: `🔥 Extreme heat (${weather.tempMax}°C): Irrigate early morning only`,
          descUz: `Jazirama kunlarda kunduzgi sug'orish bug'lanish va barg kuyishiga olib keladi. Faqat erta tong yoki kechqurun sug'oring.`,
          descRu: `В жару дневной полив вызывает ожоги листьев и испарение. Поливайте на рассвете или после заката.`,
          descEn: `Midday watering during heatwaves causes rapid evaporation and leaf scald. Irrigate at dawn or dusk.`,
          actionTextUz: "Ob-havo ko'rish",
          actionTextRu: "Смотреть погоду",
          actionTextEn: "View weather",
        });
      }

      // Alert 4: Growth Stage Agronomy / Pest Risk
      if (stage && stage.pest_notes_uz) {
        list.push({
          id: `alert_pest_${field.id}`,
          fieldId: field.id,
          fieldName: field.name,
          cropType: field.crop_type,
          category: 'pest',
          severity: calc.stageIndex >= 1 ? 'warning' : 'info',
          urgencyScore: 60,
          titleUz: `🐛 ${cropMeta.label}: ${calc.stageIndex + 1}-bosqich zararkunanda nazorati`,
          titleRu: `🐛 ${cropMeta.label}: Контроль вредителей (${calc.stageIndex + 1}-я фаза)`,
          titleEn: `🐛 ${cropMeta.label}: Pest monitoring (Stage ${calc.stageIndex + 1})`,
          descUz: currentLang === 'ru' ? stage.pest_notes_ru || stage.pest_notes_uz : currentLang === 'en' ? stage.pest_notes_en || stage.pest_notes_uz : stage.pest_notes_uz,
          descRu: stage.pest_notes_ru || stage.pest_notes_uz,
          descEn: stage.pest_notes_en || stage.pest_notes_uz,
          actionTextUz: "Qo'llanmani ochish",
          actionTextRu: "Открыть гид",
          actionTextEn: "Read agronomy guide",
        });
      }
    });

    // Default friendly alert if list is empty
    if (list.length === 0 && fields.length > 0) {
      list.push({
        id: 'alert_all_good',
        fieldId: fields[0].id,
        fieldName: fields[0].name,
        cropType: fields[0].crop_type,
        category: 'info',
        severity: 'info',
        urgencyScore: 20,
        titleUz: "✅ Barcha maydonlarda holat barqaror",
        titleRu: "✅ Состояние всех полей стабильное",
        titleEn: "✅ All registered fields in good condition",
        descUz: "Sun'iy yo'ldosh va ob-havo telemetriyasi barcha ekinlarda sog'lom o'sish va yetarli namlikni ko'rsatmoqda.",
        descRu: "Спутниковая телеметрия показывает здоровый рост и достаточный уровень влажности.",
        descEn: "Satellite telemetry shows optimal vegetation health and balanced moisture levels across all fields.",
        actionTextUz: "Tafsilotlar",
        actionTextRu: "Подробнее",
        actionTextEn: "Details",
      });
    }

    // Sort strictly by urgency score descending
    return list.sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [fields, ndviMap, weatherMap, currentLang, getCropMeta]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'all') return alertsList;
    if (alertFilter === 'critical') return alertsList.filter((a) => a.severity === 'critical');
    if (alertFilter === 'weather') return alertsList.filter((a) => a.category === 'weather');
    if (alertFilter === 'pest') return alertsList.filter((a) => a.category === 'pest');
    return alertsList;
  }, [alertsList, alertFilter]);

  // Generate "Today's Priority Action" for a specific field
  const getFieldPriorityAction = (field: FieldRecord) => {
    const weather = weatherMap[field.id];
    const ndvi = ndviMap[field.id];

    // Evaluate rules-based recommendation engine
    const rec = calculateIrrigationRecommendation({
      cropType: field.crop_type,
      plantingDate: field.planting_date,
      ndviValue: ndvi ? ndvi.ndviScore : 0.70,
      ndviTrend: ndvi?.trend?.direction || 'stable',
      soilMoisture: ndvi?.moisturePercentage || 55,
      rainForecast: weather
        ? [{ rainProb: weather.rainProbMax, rainSum: weather.rainSum, tempMax: weather.tempMax }]
        : [],
      areaHectares: field.area_hectares || 1,
      soilType: 'loam',
      irrigationMethod: 'drip',
    });

    if (rec.action === 'stop_harvest') {
      return {
        type: 'harvest',
        icon: '🍂',
        bg: 'bg-amber-50 border-amber-300 text-amber-950',
        textUz: rec.reasoning.uz,
        textRu: rec.reasoning.ru,
        textEn: rec.reasoning.en,
      };
    }

    if (rec.action === 'wait' && weather && weather.rainProbMax >= 50) {
      return {
        type: 'rain',
        icon: '🌧️',
        bg: 'bg-sky-50 border-sky-300 text-sky-950',
        textUz: rec.reasoning.uz,
        textRu: rec.reasoning.ru,
        textEn: rec.reasoning.en,
      };
    }

    if (rec.action === 'irrigate_now') {
      return {
        type: 'irrigate',
        icon: '💧',
        bg: 'bg-rose-50 border-rose-300 text-rose-950',
        textUz: rec.reasoning.uz,
        textRu: rec.reasoning.ru,
        textEn: rec.reasoning.en,
      };
    }

    if (rec.action === 'reduce') {
      return {
        type: 'reduce',
        icon: '⏳',
        bg: 'bg-teal-50 border-teal-300 text-teal-950',
        textUz: rec.reasoning.uz,
        textRu: rec.reasoning.ru,
        textEn: rec.reasoning.en,
      };
    }

    return {
      type: 'ok',
      icon: '✅',
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
      textUz: rec.reasoning.uz,
      textRu: rec.reasoning.ru,
      textEn: rec.reasoning.en,
    };
  };

  // Open Field Detail View
  const handleOpenFieldDetail = (field: FieldRecord) => {
    setSelectedFieldForDetail(field);
    setDetailActiveTab('overview');
  };

  if (selectedFieldForDetail) {
    return (
      <section id="farmer-dashboard-field-detail" className="py-6 sm:py-8 max-w-7xl mx-auto space-y-6">
        <UnifiedFieldDetailView
          field={selectedFieldForDetail}
          allFields={fields}
          currentLang={currentLang}
          onSelectField={(f) => setSelectedFieldForDetail(f)}
          onBack={() => setSelectedFieldForDetail(null)}
          onNavigateToGuides={onNavigateToFields}
        />
      </section>
    );
  }

  return (
    <section id="farmer-dashboard-command-center" className="py-4 sm:py-6 max-w-7xl mx-auto space-y-6">
      
      {/* 1. TOP COMMAND-CENTER HERO BANNER */}
      <div className="bg-[#1F3D2B] text-[#FAF7F0] rounded-2xl p-6 sm:p-7 border border-[#FAF7F0]/10 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D9A441] text-[#1F3D2B] rounded-full text-xs font-bold uppercase tracking-wider shadow-xs">
              <Compass className="w-3.5 h-3.5" />
              <span>{currentLang === 'ru' ? 'Командный центр фермера' : currentLang === 'en' ? 'Farmer Command Center' : "Fermer Boshqaruv Markazi"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF7F0] tracking-tight">
              {userProfile ? `Xush kelibsiz, ${userProfile.full_name}!` : "Dehqon Boshqaruv Paneli"}
            </h1>

            <p className="text-xs sm:text-sm text-[#FAF7F0]/80 leading-relaxed">
              {currentLang === 'ru'
                ? 'Сводка по всем полям, спутниковый индекс NDVI, прогноз осадков и срочные рекомендации на сегодня.'
                : currentLang === 'en'
                ? 'Command overview for all fields, satellite NDVI telemetry, rainfall forecasts, and urgent priority actions.'
                : "Barcha maydonlaringiz bo'yicha sun'iy yo'ldosh NDVI holati, yog'ingarchilik prognozi va bugungi ustuvor tavsiyalar."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="dark-ghost"
              size="sm"
              isLoading={refreshing}
              leftIcon={<RefreshCw className={`w-4 h-4 text-[#D9A441] ${refreshing ? 'animate-spin' : ''}`} />}
            >
              {currentLang === 'ru' ? 'Обновить' : currentLang === 'en' ? 'Refresh' : 'Yangilash'}
            </Button>

            {onNavigateToFields && (
              <Button
                onClick={onNavigateToFields}
                variant="accent"
                size="sm"
                leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
              >
                {currentLang === 'ru' ? '+ Добавить поле' : currentLang === 'en' ? '+ Add Field' : "+ Maydon Qo'shish"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SIMPLE STATS ROW (Total Fields, Hectares, Avg NDVI, Water Saved) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Stat 1: Total Fields */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6C7C6F] truncate">
              {currentLang === 'ru' ? 'Всего полей' : currentLang === 'en' ? 'Total Fields' : 'Jami Maydonlar'}
            </p>
            <p className="text-xl sm:text-2xl font-serif font-bold text-[#1F3D2B] mt-0.5">
              {fields.length} <span className="text-xs font-sans font-medium text-[#6C7C6F]">ta</span>
            </p>
          </div>
        </div>

        {/* Stat 2: Total Hectares */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#D9A441] text-[#1F3D2B] flex items-center justify-center shrink-0 shadow-xs">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6C7C6F] truncate">
              {currentLang === 'ru' ? 'Общая площадь' : currentLang === 'en' ? 'Total Area' : 'Jami Maydon'}
            </p>
            <p className="text-xl sm:text-2xl font-serif font-bold text-[#1F3D2B] mt-0.5">
              {totalHectares.toFixed(1)} <span className="text-xs font-sans font-medium text-[#6C7C6F]">ga</span>
            </p>
          </div>
        </div>

        {/* Stat 3: Average NDVI across all fields */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs border border-emerald-200">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6C7C6F] truncate">
              {currentLang === 'ru' ? 'Средний NDVI' : currentLang === 'en' ? 'Avg Field NDVI' : "O'rtacha NDVI"}
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#1F3D2B]">
                {averageNdvi}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {averageNdvi >= 0.65 ? 'Sog\'lom' : 'Mo\'tadil'}
              </span>
            </div>
          </div>
        </div>

        {/* Stat 4: Water Saved Estimate this Month */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center shrink-0 shadow-xs border border-sky-200">
            <Waves className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6C7C6F] truncate">
              {currentLang === 'ru' ? 'Сэкономлено воды' : currentLang === 'en' ? 'Water Saved (Est.)' : 'Tejalgan Suv'}
            </p>
            <p className="text-xl sm:text-2xl font-serif font-bold text-[#1F3D2B] mt-0.5 truncate">
              ~{estimatedWaterSaved.toLocaleString()} <span className="text-xs font-sans font-medium text-[#6C7C6F]">m³</span>
            </p>
          </div>
        </div>

      </div>

      {/* 3. URGENT ALERTS FEED AT THE TOP (Sorted by Urgency) */}
      <div className="bg-white rounded-2xl border border-[#E4D9C4] p-5 sm:p-6 shadow-xs space-y-4">
        
        {/* Header & Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4D9C4] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1F3D2B]">
                {currentLang === 'ru' ? 'Лента срочных оповещений' : currentLang === 'en' ? 'Priority Alerts Feed' : "Shoshilinch Bildirishnomalar & Xavflar"}
              </h2>
              <p className="text-xs text-[#6C7C6F]">
                {currentLang === 'ru'
                  ? 'Отсортировано по важности для всех зарегистрированных полей'
                  : currentLang === 'en'
                  ? 'Sorted by urgency across all active fields'
                  : "Barcha maydonlar bo'yicha muhimlilik darajasiga qarab tartiblangan"}
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold">
            <button
              onClick={() => setAlertFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                alertFilter === 'all'
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                  : 'bg-[#FAF7F0] text-[#6C7C6F] hover:text-[#1F3D2B] border border-[#E4D9C4]'
              }`}
            >
              {currentLang === 'ru' ? 'Все' : currentLang === 'en' ? 'All' : 'Barchasi'} ({alertsList.length})
            </button>

            <button
              onClick={() => setAlertFilter('critical')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                alertFilter === 'critical'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-[#6C7C6F] hover:text-rose-700 border border-[#E4D9C4]'
              }`}
            >
              🚨 {currentLang === 'ru' ? 'Критичные' : currentLang === 'en' ? 'Critical' : 'Shoshilinch'}
            </button>

            <button
              onClick={() => setAlertFilter('weather')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                alertFilter === 'weather'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-[#6C7C6F] hover:text-sky-700 border border-[#E4D9C4]'
              }`}
            >
              🌧️ {currentLang === 'ru' ? 'Погода' : currentLang === 'en' ? 'Weather' : 'Ob-havo'}
            </button>

            <button
              onClick={() => setAlertFilter('pest')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                alertFilter === 'pest'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-[#6C7C6F] hover:text-amber-700 border border-[#E4D9C4]'
              }`}
            >
              🐛 {currentLang === 'ru' ? 'Вредители' : currentLang === 'en' ? 'Pests' : 'Zararkunandalar'}
            </button>
          </div>
        </div>

        {/* Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#6C7C6F] bg-[#FAF7F0] rounded-2xl border border-[#E4D9C4]">
            {currentLang === 'ru' ? 'Нет активных оповещений в этой категории' : currentLang === 'en' ? 'No alerts in this category' : 'Ushbu toifada yangi bildirishnomalar mavjud emas'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const matchedField = fields.find((f) => f.id === alert.fieldId);
              const isCrit = alert.severity === 'critical';
              const isWarn = alert.severity === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCrit
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : isWarn
                      ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                      : 'bg-[#FAF7F0] border-[#E4D9C4] text-[#1F3D2B]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isCrit
                          ? 'bg-rose-600 text-white'
                          : isWarn
                          ? 'bg-amber-500 text-white'
                          : 'bg-[#1F3D2B] text-[#D9A441]'
                      }`}
                    >
                      {isCrit ? <ShieldAlert className="w-5 h-5" /> : isWarn ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold">
                          {currentLang === 'ru' ? alert.titleRu : currentLang === 'en' ? alert.titleEn : alert.titleUz}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-current/20">
                          {alert.fieldName}
                        </span>
                      </div>

                      <p className="text-xs opacity-90 leading-relaxed">
                        {currentLang === 'ru' ? alert.descRu : currentLang === 'en' ? alert.descEn : alert.descUz}
                      </p>
                    </div>
                  </div>

                  {matchedField && (
                    <Button
                      onClick={() => handleOpenFieldDetail(matchedField)}
                      variant={isCrit ? 'destructive' : isWarn ? 'accent' : 'primary'}
                      size="sm"
                      className="self-start sm:self-center shrink-0"
                      rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    >
                      {currentLang === 'ru' ? alert.actionTextRu : currentLang === 'en' ? alert.actionTextEn : alert.actionTextUz}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 4. REGISTERED FIELDS COMMAND CARDS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4D9C4] pb-3">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1F3D2B] flex items-center gap-2">
              <Sprout className="w-6 h-6 text-[#D9A441]" />
              <span>{currentLang === 'ru' ? 'Сводные карточки полей' : currentLang === 'en' ? 'Field Telemetry & Summary Cards' : "Maydonlar Xulosasi & Holati"}</span>
            </h2>
            <p className="text-xs text-[#6C7C6F]">
              {currentLang === 'ru'
                ? 'Нажмите на любую карточку, чтобы открыть детальную страницу с картой, NDVI, поливом и агро-гидом'
                : currentLang === 'en'
                ? 'Click any card to open the combined field detail page (map + NDVI + irrigation + guide)'
                : "Batafsil xarita, sun'iy yo'ldosh NDVI, sug'orish rejasi va parvarish qo'llanmasini ochish uchun maydon ustiga bosing"}
            </p>
          </div>

          <div className="text-xs font-bold text-[#6C7C6F] bg-[#FAF7F0] px-3 py-1.5 rounded-xl border border-[#E4D9C4] self-start sm:self-auto flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Sentinel-2 & Open-Meteo Jonli</span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center space-y-3 bg-[#FAF7F0] rounded-2xl border border-[#E4D9C4]">
            <div className="w-8 h-8 border-3 border-[#1F3D2B] border-t-[#D9A441] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#6C7C6F]">
              {currentLang === 'ru' ? 'Загрузка данных полей...' : currentLang === 'en' ? 'Loading fields telemetry...' : 'Maydonlar ma\'lumotlari yuklanmoqda...'}
            </p>
          </div>
        ) : fields.length === 0 ? (
          /* ZERO-FIELDS STATE WITH PROMINENT CTA */
          <div className="py-12 px-6 text-center bg-white rounded-2xl border-2 border-dashed border-[#D9A441] space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 bg-[#F0E8D8] text-[#D9A441] rounded-2xl flex items-center justify-center mx-auto border border-[#E4D9C4]">
              <Sprout className="w-7 h-7" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1F3D2B]">
                {currentLang === 'ru' ? 'У вас пока нет зарегистрированных полей' : currentLang === 'en' ? 'No fields registered yet' : "Hali birorta maydon ro'yxatdan o'tkazilmagan"}
              </h3>
              <p className="text-xs text-[#6C7C6F] leading-relaxed max-w-md mx-auto">
                {currentLang === 'ru'
                  ? 'Отметьте границы вашего первого поля на карте, чтобы активировать спутниковый мониторинг NDVI, прогноз погоды и персональные нормы полива.'
                  : currentLang === 'en'
                  ? 'Draw your first field boundaries on the map to activate Sentinel-2 NDVI satellite monitoring, Open-Meteo weather forecasts, and smart irrigation schedules.'
                  : "Ekinlaringiz holatini sun'iy yo'ldosh orqali monitoring qilish, aniq ob-havo va aqlli sug'orish tavsiyalarini olish uchun birinchi maydoningizni xaritada belgilang."}
              </p>
            </div>

            {onNavigateToFields && (
              <Button
                onClick={onNavigateToFields}
                variant="accent"
                size="md"
                leftIcon={<Plus className="w-5 h-5 stroke-[2.5]" />}
              >
                {currentLang === 'ru' ? 'Добавить первое поле' : currentLang === 'en' ? 'Add your first field' : "Birinchi maydonni qo'shish"}
              </Button>
            )}
          </div>
        ) : (
          /* FIELD SUMMARY CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {fields.map((field) => {
              const cropMeta = getCropMeta(field.crop_type);
              const ndvi = ndviMap[field.id];
              const weather = weatherMap[field.id];
              const priorityAction = getFieldPriorityAction(field);
              const calc = calculateGrowthStage(field.crop_type, field.planting_date);

              const ndviScore = ndvi ? ndvi.ndviScore : 0.70;
              const moisture = ndvi ? ndvi.moisturePercentage : 50;

              return (
                <div
                  key={field.id}
                  onClick={() => handleOpenFieldDetail(field)}
                  className="bg-white rounded-2xl border border-[#E4D9C4] hover:border-[#1F3D2B] p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer group relative overflow-hidden"
                >
                  {/* Top Accent Line */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1F3D2B] group-hover:bg-[#D9A441] transition-colors" />

                  {/* Header: Field Name & Crop Badge */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#D9A441] tracking-wider">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{field.region}</span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-[#1F3D2B] group-hover:text-[#B8852B] transition-colors">
                          {field.name}
                        </h3>
                      </div>

                      <span className="bg-[#1F3D2B] text-[#FAF7F0] px-3 py-1 rounded-full text-xs font-bold border border-[#D9A441]/40 flex items-center gap-1.5 shrink-0 shadow-xs">
                        <span>{cropMeta.icon}</span>
                        <span>{cropMeta.label}</span>
                      </span>
                    </div>

                    {/* Satellite Map Thumbnail */}
                    <div className="rounded-2xl overflow-hidden border border-[#E4D9C4] group-hover:border-[#1F3D2B] transition-colors">
                      <FieldCardThumbnail coordinates={field.coordinates} height={120} />
                    </div>

                    {/* Growth stage indicator */}
                    <div className="flex items-center justify-between text-[11px] text-[#6C7C6F] font-semibold pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#D9A441]" />
                        <span>{calc.daysElapsed} kunlik ekin</span>
                      </span>
                      <span className="bg-[#FAF7F0] px-2 py-0.5 rounded border border-[#E4D9C4] text-[#1F3D2B] font-bold text-[10px]">
                        {calc.stageIndex + 1}-bosqich: {calc.currentStage.growth_stage}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Row: NDVI + Soil Moisture + Area + Today Weather */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    
                    {/* NDVI Score & Health */}
                    <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#E4D9C4]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#6C7C6F] font-bold uppercase">NDVI Holati</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          ndviScore >= 0.65 ? 'bg-emerald-100 text-emerald-800' : ndviScore >= 0.45 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {ndviScore >= 0.65 ? 'Sog\'lom' : ndviScore >= 0.45 ? 'Mo\'tadil' : 'Stress'}
                        </span>
                      </div>
                      <p className="font-serif font-bold text-lg text-[#1F3D2B] mt-0.5">
                        {ndviScore.toFixed(2)}
                      </p>
                    </div>

                    {/* Soil Moisture */}
                    <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#E4D9C4]">
                      <span className="text-[10px] text-[#6C7C6F] font-bold uppercase">Tuproq Namligi</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <p className="font-serif font-bold text-lg text-[#1F3D2B]">
                          ~{moisture}%
                        </p>
                        <span className="text-[10px] text-[#6C7C6F]">
                          ({moisture >= 45 ? 'Yetarli' : 'Sug\'orish zarur'})
                        </span>
                      </div>
                    </div>

                    {/* Area */}
                    <div className="bg-[#FAF7F0] p-2.5 rounded-2xl border border-[#E4D9C4]">
                      <span className="text-[10px] text-[#6C7C6F] font-bold uppercase">Maydoni</span>
                      <p className="font-bold text-[#1F3D2B] text-xs mt-0.5">
                        {field.area_hectares} {t.hectaresUnit}
                      </p>
                    </div>

                    {/* Today Weather Forecast */}
                    <div className="bg-[#FAF7F0] p-2.5 rounded-2xl border border-[#E4D9C4]">
                      <span className="text-[10px] text-[#6C7C6F] font-bold uppercase">Bugungi Harorat</span>
                      <p className="font-bold text-[#1F3D2B] text-xs mt-0.5 flex items-center gap-1">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>{weather?.tempMax || 32}°C</span>
                        <span className="text-[10px] text-blue-600 font-normal">({weather?.rainProbMax || 10}% yog&apos;in)</span>
                      </p>
                    </div>

                  </div>

                  {/* ONE-LINE "TODAY'S PRIORITY ACTION" BANNER */}
                  <div className={`p-3 rounded-2xl border-2 text-xs transition-all space-y-0.5 ${priorityAction.bg}`}>
                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                      <span>{priorityAction.icon}</span>
                      <span className="uppercase tracking-wider">
                        {currentLang === 'ru' ? 'Главная задача на сегодня:' : currentLang === 'en' ? 'Today\'s Priority Action:' : "Bugungi ustuvor vazifa:"}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold leading-snug pl-5">
                      {currentLang === 'ru' ? priorityAction.textRu : currentLang === 'en' ? priorityAction.textEn : priorityAction.textUz}
                    </p>
                  </div>

                  {/* Card Bottom Link */}
                  <div className="pt-2 border-t border-[#E4D9C4] flex items-center justify-between text-xs text-[#1F3D2B] font-bold group-hover:text-[#B8852B] transition-colors">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{currentLang === 'ru' ? 'Открыть карту, NDVI и гид' : currentLang === 'en' ? 'Full detail & agronomy guide' : "To'liq xarita & telemetriya"}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </section>
  );
};
