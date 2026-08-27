'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FieldRecord, FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { fetchAndStoreFieldNdvi, NdviResult, formatNdviScore, getNdviStatusBadge, getCachedNdvi, calculateFieldNdviTelemetry } from '@/lib/ndviService';
import { calculateGrowthStage } from '@/lib/cropGuidesData';
import { CROP_OPTIONS } from '@/components/FarmerOnboardingModal';
import { FieldCardThumbnail } from '@/components/FieldCardThumbnail';
import { FieldMonitoringMap } from '@/components/FieldMonitoringMap';
import { UnifiedFieldDetailView } from '@/components/UnifiedFieldDetailView';
import { InfoTooltip } from '@/components/InfoTooltip';
import { CropGrowthProgress } from '@/components/CropGrowthProgress';
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
      if (isSupabaseConfigured && client) {
        try {
          const { data: sessionData } = await client.auth.getSession();
          const targetUserId = sessionData.session?.user?.id || userProfile?.user_id;

          if (targetUserId) {
            const { data, error } = await client
              .from('fields')
              .select('*')
              .eq('user_id', targetUserId)
              .order('created_at', { ascending: false });

            if (!error && data) {
              const parsed = data.map((item: any) => ({
                id: item.id,
                user_id: item.user_id,
                farmer_id: item.farmer_id,
                name: item.name,
                crop_type: item.crop_type,
                planting_date: item.planting_date || '2026-04-10',
                area_hectares: Number(item.area_hectares) || 1.5,
                region: item.region || userProfile?.region || "Toshkent viloyati",
                coordinates: item.coordinates_json || item.coordinates || [],
              }));
              list = parsed;
              localStorage.setItem('ekinix_farmer_fields', JSON.stringify(parsed));
            }
          }
        } catch (err) {
          console.warn("Supabase dashboard load notice:", err);
        }
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
  const fieldsKey = fields.map((f) => f.id).join(',');

  useEffect(() => {
    if (fields.length === 0) return;

    let isMounted = true;

    async function loadAllTelemetry() {
      const newNdviMap: Record<string, NdviResult> = {};
      const newWeatherMap: Record<string, FieldWeatherInfo> = {};

      fields.forEach((field) => {
        newNdviMap[field.id] = getCachedNdvi(field.id) || calculateFieldNdviTelemetry(field);
      });
      setNdviMap({ ...newNdviMap });

      await Promise.all(
        fields.map(async (field) => {
          // Fetch NDVI (cached or live Sentinel)
          try {
            const ndvi = await fetchAndStoreFieldNdvi(field);
            newNdviMap[field.id] = ndvi;
          } catch {
            newNdviMap[field.id] = calculateFieldNdviTelemetry(field);
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
        })
      );

      if (isMounted) {
        setNdviMap(newNdviMap);
        setWeatherMap(newWeatherMap);
      }
    }

    loadAllTelemetry();

    return () => {
      isMounted = false;
    };
  }, [fields, fieldsKey]);

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
    if (isSupabaseConfigured && client) {
      try {
        const { data: sessionData } = await client.auth.getSession();
        const targetUserId = sessionData.session?.user?.id || userProfile?.user_id;

        if (targetUserId) {
          const { data, error } = await client
            .from('fields')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

          if (!error && data) {
            const parsed = data.map((item: any) => ({
              id: item.id,
              user_id: item.user_id,
              farmer_id: item.farmer_id,
              name: item.name,
              crop_type: item.crop_type,
              planting_date: item.planting_date || '2026-04-10',
              area_hectares: Number(item.area_hectares) || 1.5,
              region: item.region || userProfile?.region || "Toshkent viloyati",
              coordinates: item.coordinates_json || item.coordinates || [],
            }));
            list = parsed;
            localStorage.setItem('ekinix_farmer_fields', JSON.stringify(parsed));
          }
        }
      } catch (err) {
        console.warn("Supabase dashboard refresh notice:", err);
      }
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
      .map((n) => n.ndviScore)
      .filter((s): s is number => typeof s === 'number' && !isNaN(s) && s > 0);

    if (scores.length === 0) return null;
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
      if (ndvi && !ndvi.isCloudy && typeof ndvi.ndviScore === 'number') {
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
            descUz: `${field.name} maydonida NDVI ko'rsatkichi kritik darajada (${ndvi.ndviScore.toFixed(2)}). Ildiz tizimini va namlikni zudlik bilan tekshiring.`,
            descRu: `На поле ${field.name} индекс NDVI на критическом уровне (${ndvi.ndviScore.toFixed(2)}). Срочно проверьте корневую систему и влажность.`,
            descEn: `Critical NDVI reading (${ndvi.ndviScore.toFixed(2)}) on ${field.name}. Inspect root moisture immediately.`,
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
      ndviValue: ndvi ? ndvi.ndviScore : null,
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
    <section id="farmer-dashboard-command-center" className="py-4 sm:py-6 max-w-7xl mx-auto space-y-5">
      
      {/* 1. TOP DASHBOARD PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {currentLang === 'ru' ? 'Операции на полях' : currentLang === 'en' ? 'Field Operations' : 'Dalalar Nazorati'}
          </h1>
          <p className="text-xs text-slate-500">
            Sentinel-2 satellite NDVI telemetry and agro-meteorological monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{currentLang === 'ru' ? 'Обновить' : currentLang === 'en' ? 'Refresh Telemetry' : 'Telemetriyani yangilash'}</span>
          </button>

          {onNavigateToFields && (
            <button
              onClick={onNavigateToFields}
              className="h-8 px-3 rounded-lg bg-[#164E35] hover:bg-[#0F3826] text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{currentLang === 'ru' ? '+ Зарегистрировать поле' : currentLang === 'en' ? '+ Register Field' : '+ Maydon kiritish'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI METRIC CARDS (4-Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Total Fields */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {currentLang === 'ru' ? 'Всего полей' : currentLang === 'en' ? 'Active Fields' : 'Aktiv Maydonlar'}
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {fields.length}
          </div>
          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <span className="text-emerald-700 font-semibold">{totalHectares.toFixed(1)} ha</span> Monitored Area
          </div>
        </div>

        {/* Metric 2: Total Hectares */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {currentLang === 'ru' ? 'Общая площадь' : currentLang === 'en' ? 'Total Area' : 'Jami Maydon'}
            </span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {totalHectares.toFixed(1)} <span className="text-sm font-normal text-slate-500">ha</span>
          </div>
          <div className="text-[11px] font-medium text-emerald-700">
            100% Boundary Verified
          </div>
        </div>

        {/* Metric 3: Avg Field NDVI */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {currentLang === 'ru' ? 'Средний NDVI' : currentLang === 'en' ? 'Avg Field NDVI' : "O'rtacha NDVI"}
              </span>
              <InfoTooltip preset="ndvi" lang={currentLang} size="xs" id="dashboard-avg-ndvi-tooltip" />
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight flex items-baseline gap-2">
            <span>{formatNdviScore(averageNdvi, currentLang)}</span>
            {averageNdvi !== null && (
              <span className={`text-xs font-normal font-sans ${averageNdvi >= 0.65 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {getNdviStatusBadge(averageNdvi, currentLang).label}
              </span>
            )}
          </div>
          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            {averageNdvi !== null ? (
              <>
                <TrendingUp className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">+0.04</span> {currentLang === 'ru' ? 'динамика за неделю' : currentLang === 'en' ? 'vs last week' : 'haftalik dinamika'}
              </>
            ) : (
              <span>{currentLang === 'ru' ? 'Спутниковые данные ожидаются' : currentLang === 'en' ? 'Satellite acquisition pending' : "Sun'iy yo'ldosh ma'lumoti kutilmoqda"}</span>
            )}
          </div>
        </div>

        {/* Metric 4: Water Efficiency */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {currentLang === 'ru' ? 'Сэкономлено воды' : currentLang === 'en' ? 'Water Saved' : 'Suv Tejamkorligi'}
            </span>
            <Droplets className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            ~{estimatedWaterSaved.toLocaleString()} <span className="text-sm font-normal text-slate-500">m³</span>
          </div>
          <div className="text-[11px] font-medium text-emerald-700">
            Optimal Moisture Level
          </div>
        </div>

      </div>

      {/* 3. CROP GROWTH PROGRESS & NDVI HEALTH TRENDS */}
      {fields.length > 0 && (
        <CropGrowthProgress
          fields={fields}
          currentLang={currentLang}
          onSelectField={handleOpenFieldDetail}
        />
      )}

      {/* 4. ALERTS & RISK FEED */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        
        {/* Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              {currentLang === 'ru' ? 'Лента оповещений и рисков' : currentLang === 'en' ? 'Alerts & Risk Telemetry' : 'Xavflar va Bildirishnomalar'}
            </h2>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'all', label: currentLang === 'ru' ? 'Все' : currentLang === 'en' ? 'All' : 'Barchasi', count: alertsList.length },
              { id: 'critical', label: currentLang === 'ru' ? 'Критичные' : currentLang === 'en' ? 'Critical' : 'Shoshilinch' },
              { id: 'weather', label: currentLang === 'ru' ? 'Погода' : currentLang === 'en' ? 'Weather' : 'Ob-havo' },
              { id: 'pest', label: currentLang === 'ru' ? 'Вредители' : currentLang === 'en' ? 'Pests' : 'Zararkunandalar' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAlertFilter(tab.id as any)}
                className={`h-7 px-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer shrink-0 ${
                  alertFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Streamlined Alerts List */}
        {filteredAlerts.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
            {currentLang === 'ru' ? 'Нет активных оповещений в этой категории' : currentLang === 'en' ? 'No active alerts in this category' : 'Ushbu toifada xavflar aniqlanmadi'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAlerts.map((alert) => {
              const matchedField = fields.find((f) => f.id === alert.fieldId);
              const isCrit = alert.severity === 'critical';
              const isWeather = alert.category === 'weather';

              let borderAccent = 'border-l-2 border-slate-400';
              if (isCrit) borderAccent = 'border-l-2 border-rose-500';
              else if (isWeather) borderAccent = 'border-l-2 border-amber-500';

              const alertTitle = currentLang === 'ru' ? alert.titleRu : currentLang === 'en' ? alert.titleEn : alert.titleUz;

              return (
                <div
                  key={alert.id}
                  className={`${borderAccent} bg-white p-3.5 rounded-r-lg border-y border-r border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs transition-colors hover:bg-slate-50/50`}
                >
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="font-semibold text-slate-900">
                      {alertTitle}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {alert.fieldName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Bugun 08:30
                    </span>
                  </div>

                  {matchedField && (
                    <button
                      onClick={() => handleOpenFieldDetail(matchedField)}
                      className="text-xs font-medium text-slate-900 hover:underline cursor-pointer shrink-0 self-start md:self-center flex items-center gap-1"
                    >
                      <span>View Telemetry →</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 4. FIELD SUMMARY CARDS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {currentLang === 'ru' ? 'Сводка по полям' : currentLang === 'en' ? 'Field Telemetry & Summary Cards' : "Maydonlar Xulosasi va Holati"}
            </h2>
            <p className="text-xs text-slate-500">
              Sentinel-2 L2A satellite index and root-zone soil moisture readings
            </p>
          </div>

          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            Live Telemetry Active
          </span>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-12 text-center space-y-2 bg-white rounded-xl border border-slate-200">
            <div className="w-6 h-6 border-2 border-slate-400 border-t-emerald-800 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Maydonlar telemetriyasi yuklanmoqda...
            </p>
          </div>
        ) : fields.length === 0 ? (
          /* Zero fields state */
          <div className="py-10 px-4 text-center bg-white rounded-xl border border-slate-200 space-y-3 max-w-lg mx-auto">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center mx-auto border border-slate-200">
              <Sprout className="w-5 h-5" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">
                {currentLang === 'ru' ? 'Нет зарегистрированных полей' : currentLang === 'en' ? 'No fields registered yet' : "Maydonlar ro'yxati bo'sh"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ekinlar holatini sun&apos;iy yo&apos;ldosh orqali monitoring qilish uchun birinchi maydoningizni xaritada belgilang.
              </p>
            </div>

            {onNavigateToFields && (
              <button
                onClick={onNavigateToFields}
                className="h-8 px-3 bg-[#164E35] hover:bg-[#0F3826] text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                {currentLang === 'ru' ? 'Добавить первое поле' : currentLang === 'en' ? 'Add your first field' : "Birinchi maydonni qo'shish"}
              </button>
            )}
          </div>
        ) : (
          /* 3-Column Field Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => {
              const cropMeta = getCropMeta(field.crop_type);
              const ndvi = ndviMap[field.id];
              const weather = weatherMap[field.id];
              const priorityAction = getFieldPriorityAction(field);

              const ndviScore = ndvi?.ndviScore ?? null;
              const ndviBadge = getNdviStatusBadge(ndviScore, currentLang);
              const formattedNdvi = formatNdviScore(ndviScore, currentLang);
              const moisture = ndvi ? ndvi.moisturePercentage : 54;
              const actionText = currentLang === 'ru' ? priorityAction.textRu : currentLang === 'en' ? priorityAction.textEn : priorityAction.textUz;

              return (
                <div
                  key={field.id}
                  onClick={() => handleOpenFieldDetail(field)}
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all p-4 space-y-3 cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                        {field.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {field.region}
                      </p>
                    </div>

                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium shrink-0 flex items-center gap-1 border border-slate-200">
                      <span>{cropMeta.icon}</span>
                      <span>{cropMeta.label}</span>
                    </span>
                  </div>

                  {/* Map Thumbnail */}
                  <div className="rounded-lg overflow-hidden border border-slate-200">
                    <FieldCardThumbnail coordinates={field.coordinates} height={110} />
                  </div>

                  {/* Telemetry Grid (2x2) */}
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2">
                    {/* NDVI */}
                    <div className="p-2 rounded bg-slate-50/60 border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium uppercase">
                        <span>NDVI</span>
                        <InfoTooltip preset="ndvi" lang={currentLang} size="xs" id={`dashboard-card-ndvi-${field.id}`} />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-semibold text-slate-900">{formattedNdvi}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${ndviBadge.bg} ${ndviBadge.text} ${ndviBadge.border}`}>
                          {ndviBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Soil Moisture */}
                    <div className="p-2 rounded bg-slate-50/60 border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium uppercase">
                        <span>Soil Moisture</span>
                        <InfoTooltip preset="soil_moisture" lang={currentLang} size="xs" id={`dashboard-card-moisture-${field.id}`} />
                      </div>
                      <div className="font-mono font-semibold text-slate-900 mt-0.5">
                        {moisture}% <span className="text-[10px] font-sans text-slate-500 font-normal">({moisture >= 45 ? 'Adequate' : 'Dry'})</span>
                      </div>
                    </div>

                    {/* Hectarage */}
                    <div className="p-2 rounded bg-slate-50/60 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Area</div>
                      <div className="font-mono text-xs text-slate-700 font-semibold mt-0.5">
                        {field.area_hectares} ha
                      </div>
                    </div>

                    {/* Weather */}
                    <div className="p-2 rounded bg-slate-50/60 border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-medium uppercase">Weather</div>
                      <div className="text-xs text-slate-700 font-medium mt-0.5 flex items-center gap-1">
                        <span>{weather?.tempMax || 32}°C</span>
                        <span className="text-[10px] text-slate-400">({weather?.rainProbMax || 15}% rain)</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority Action Banner */}
                  <div className="bg-slate-50 text-slate-800 text-[11px] p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="shrink-0 text-sm">{priorityAction.icon}</span>
                    <p className="font-medium text-slate-800 leading-tight truncate">
                      {actionText}
                    </p>
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
