'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FieldRecord, NDVIReading, FieldAdvisorNote, isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  fetchAndStoreFieldNdvi,
  fetchFieldNdviHistory,
  calculateRealIrrigationRecommendation,
  NdviResult,
  RealIrrigationAdvice,
  formatNdviScore,
  getNdviStatusBadge,
  getCachedNdvi,
  calculateFieldNdviTelemetry,
} from '@/lib/ndviService';
import { calculateGrowthStage } from '@/lib/cropGuidesData';
import { getFieldSeasonProgress } from '@/lib/seasonMilestones';
import { FieldMonitoringMap } from '@/components/FieldMonitoringMap';
import { CROP_OPTIONS } from '@/components/FarmerOnboardingModal';
import { getFieldCenterCoordinates } from '@/components/FieldWeatherCard';
import { WeatherStripSkeleton } from '@/components/ui/StateFeedback';
import { Button } from '@/components/ui/Button';
import { InfoTooltip } from '@/components/InfoTooltip';
import {
  Satellite,
  Droplets,
  CloudRain,
  Sun,
  Cloud,
  CloudSun,
  CloudDrizzle,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CloudOff,
  RefreshCw,
  MapPin,
  Calendar,
  Layers,
  Sprout,
  Bug,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  Info,
  Check,
  Zap,
  Volume2,
  Copy,
  Sparkles,
  Award,
  KeyRound,
  FileCheck,
  Activity,
  Send,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface UnifiedFieldDetailViewProps {
  field: FieldRecord;
  allFields?: FieldRecord[];
  currentLang: Language;
  onSelectField?: (field: FieldRecord) => void;
  onBack?: () => void;
  onNavigateToGuides?: () => void;
}

interface DailyWeather {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
  rainSum: number;
  weatherCode: number;
}

function getWeatherMeta(code: number) {
  if (code === 0) return { icon: <Sun className="w-4 h-4 text-amber-500" />, labelUz: "Aftobli", labelRu: "Ясно", labelEn: "Sunny" };
  if (code >= 1 && code <= 3) return { icon: <CloudSun className="w-4 h-4 text-amber-400" />, labelUz: "Bulutli", labelRu: "Облачно", labelEn: "Partly Cloudy" };
  if (code >= 45 && code <= 48) return { icon: <Cloud className="w-4 h-4 text-slate-400" />, labelUz: "Tumanli", labelRu: "Туман", labelEn: "Foggy" };
  if (code >= 51 && code <= 67) return { icon: <CloudDrizzle className="w-4 h-4 text-sky-500" />, labelUz: "Yomg'ir", labelRu: "Морось", labelEn: "Drizzle" };
  if (code >= 80 && code <= 82) return { icon: <CloudRain className="w-4 h-4 text-blue-600" />, labelUz: "Jala", labelRu: "Ливень", labelEn: "Heavy Rain" };
  return { icon: <Cloud className="w-4 h-4 text-slate-500" />, labelUz: "Bulutli", labelRu: "Пасмурно", labelEn: "Overcast" };
}

export const UnifiedFieldDetailView: React.FC<UnifiedFieldDetailViewProps> = ({
  field,
  allFields = [],
  currentLang,
  onSelectField,
  onBack,
  onNavigateToGuides,
}) => {
  const t = translations[currentLang];

  // Underlined detail tab state
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'ndvi' | 'irrigation' | 'guide'>('overview');

  // Telemetry State
  const [ndviResult, setNdviResult] = useState<NdviResult | null>(() => getCachedNdvi(field.id) || calculateFieldNdviTelemetry(field));
  const [ndviHistory, setNdviHistory] = useState<NDVIReading[]>([]);
  const [loadingNdvi, setLoadingNdvi] = useState(false);
  const [simulateCloudMode, setSimulateCloudMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Weather State
  const [weatherDays, setWeatherDays] = useState<DailyWeather[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // UI & AI State
  const [selectedChartPoint, setSelectedChartPoint] = useState<NDVIReading | null>(null);
  const [fieldSwitcherOpen, setFieldSwitcherOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const seasonProgress = useMemo(() => {
    return getFieldSeasonProgress(field.crop_type, field.planting_date);
  }, [field.crop_type, field.planting_date]);

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // AI Field Summary
  const [aiSummaryData, setAiSummaryData] = useState<{
    executive_summary: string;
    what_happened: string;
    concerns_and_risks: string;
    recommended_actions: string[];
    irrigation_tip: string;
    confidence_score: number;
  } | null>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [copiedAi, setCopiedAi] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Watering Log Confirmation State
  const [isMarkingWatered, setIsMarkingWatered] = useState(false);
  const [wateredSuccessTime, setWateredSuccessTime] = useState<string | null>(null);

  const handleMarkAsWatered = async () => {
    setIsMarkingWatered(true);
    try {
      const volume = irrigationAdvice.recommendedVolumeM3PerHa || 35;
      if (isSupabaseConfigured && supabase) {
        await supabase.from('watering_log').insert({
          field_id: field.id,
          watered_at: new Date().toISOString(),
          water_volume_m3: volume,
          method: 'drip',
          notes: 'Veb-ilova orqali tasdiqlandi',
        });
      }
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setWateredSuccessTime(timeStr);
    } catch (err) {
      console.error('Error marking field as watered:', err);
    } finally {
      setIsMarkingWatered(false);
    }
  };

  const [aiSummaryAttempted, setAiSummaryAttempted] = useState(false);

  const generateAiSummary = useCallback(async () => {
    setLoadingAiSummary(true);
    setAiSummaryAttempted(true);
    try {
      const res = await fetch('/api/gemini/field-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName: field.name,
          cropType: field.crop_type,
          areaHectares: field.area_hectares,
          region: field.region,
          plantingDate: field.planting_date,
          growthStage: seasonProgress.currentMilestone.nameUz,
          ndviScore: ndviResult?.ndviScore ?? 0.68,
          moisturePercentage: ndviResult?.moisturePercentage ?? 60,
          status: ndviResult?.statusTier ?? 'healthy',
          weatherSummary: weatherDays.length > 0 ? `${weatherDays[0].tempMax}°C, ${weatherDays[0].rainProb}% yog'ingarchilik` : '',
          lang: currentLang,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAiSummaryData(data);
    } catch (err) {
      console.warn("AI Summary notice:", err);
    } finally {
      setLoadingAiSummary(false);
    }
  }, [field.name, field.crop_type, field.area_hectares, field.region, field.planting_date, seasonProgress.currentMilestone.nameUz, ndviResult, weatherDays, currentLang]);

  useEffect(() => {
    let isMounted = true;
    if (!loadingNdvi && !aiSummaryData && !loadingAiSummary && !aiSummaryAttempted) {
      const timer = setTimeout(() => {
        if (isMounted) generateAiSummary();
      }, 100);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [loadingNdvi, aiSummaryData, loadingAiSummary, aiSummaryAttempted, generateAiSummary]);

  const handleToggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    if (aiSummaryData?.executive_summary) {
      const utterance = new SpeechSynthesisUtterance(
        `${aiSummaryData.executive_summary}. ${aiSummaryData.what_happened}. ${aiSummaryData.concerns_and_risks}`
      );
      utterance.lang = currentLang === 'ru' ? 'ru-RU' : currentLang === 'en' ? 'en-US' : 'uz-UZ';
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopyAiReport = () => {
    if (!aiSummaryData) return;
    const text = `EKINIX AI HISOBOTI - ${field.name}\n\n1. XULOSA:\n${aiSummaryData.executive_summary}\n\n2. NIMA YUZ BERDI:\n${aiSummaryData.what_happened}\n\n3. XAVFLAR:\n${aiSummaryData.concerns_and_risks}\n\n4. AMALIY HARAKATLAR:\n${aiSummaryData.recommended_actions?.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 3000);
  };

  const [fieldAdvisorNotes] = useState<FieldAdvisorNote[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ekinix_advisor_notes');
        const list: FieldAdvisorNote[] = saved ? JSON.parse(saved) : [];
        return list.filter((n) => n.field_id === field.id || n.field_id === 'f-demo-1');
      } catch {
        return [];
      }
    }
    return [];
  });

  const [lat, lon] = useMemo(() => getFieldCenterCoordinates(field), [field]);

  const cropOption = useMemo(() => {
    return CROP_OPTIONS.find((c) => c.id === field.crop_type) || {
      id: field.crop_type,
      nameKey: 'cropCotton',
      icon: '🌱',
    };
  }, [field.crop_type]);

  const cropTitle = t[cropOption.nameKey as keyof typeof t] || field.crop_type;

  const growthStageData = useMemo(() => {
    return calculateGrowthStage(field.crop_type, field.planting_date);
  }, [field.crop_type, field.planting_date]);

  const { currentStage, stageIndex, totalStages, daysElapsed } = growthStageData;

  useEffect(() => {
    let isMounted = true;
    const initial = getCachedNdvi(field.id) || calculateFieldNdviTelemetry(field);
    if (initial) {
      setNdviResult(initial);
    }

    async function loadTelemetry() {
      try {
        const [currentReading, history] = await Promise.all([
          fetchAndStoreFieldNdvi(field, simulateCloudMode),
          fetchFieldNdviHistory(field),
        ]);

        if (isMounted) {
          setNdviResult(currentReading);
          setNdviHistory(history);
          if (history.length > 0) setSelectedChartPoint(history[history.length - 1]);
          setLoadingNdvi(false);
        }
      } catch {
        if (isMounted) setLoadingNdvi(false);
      }
    }
    loadTelemetry();
    return () => { isMounted = false; };
  }, [field, simulateCloudMode]);

  useEffect(() => {
    let isMounted = true;
    async function fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather failed");
        const data = await res.json();

        if (data.daily && data.daily.time) {
          const times: string[] = data.daily.time;
          const codeArr: number[] = data.daily.weathercode || [];
          const maxArr: number[] = data.daily.temperature_2m_max || [];
          const minArr: number[] = data.daily.temperature_2m_min || [];
          const probArr: number[] = data.daily.precipitation_probability_max || [];
          const sumArr: number[] = data.daily.precipitation_sum || [];

          const dayNamesUz = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
          const dayNamesRu = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

          const list: DailyWeather[] = times.slice(0, 5).map((timeStr, idx) => {
            const dateObj = new Date(timeStr);
            const dayName = idx === 0 ? (currentLang === 'ru' ? 'Сегодня' : 'Bugun') : (currentLang === 'uz' ? dayNamesUz[dateObj.getDay()] : dayNamesRu[dateObj.getDay()]);

            return {
              date: timeStr,
              dayName,
              tempMax: Math.round(maxArr[idx] ?? 32),
              tempMin: Math.round(minArr[idx] ?? 20),
              rainProb: probArr[idx] ?? 10,
              rainSum: parseFloat((sumArr[idx] ?? 0).toFixed(1)),
              weatherCode: codeArr[idx] ?? 0,
            };
          });

          if (isMounted) {
            setWeatherDays(list);
            setLoadingWeather(false);
          }
        }
      } catch {
        if (isMounted) {
          setWeatherDays([
            { date: '2026-08-18', dayName: 'Bugun', tempMax: 34, tempMin: 22, rainProb: 15, rainSum: 0, weatherCode: 0 },
            { date: '2026-08-19', dayName: 'Ertaga', tempMax: 31, tempMin: 20, rainProb: 65, rainSum: 6.8, weatherCode: 80 },
            { date: '2026-08-20', dayName: 'Indin', tempMax: 29, tempMin: 19, rainProb: 40, rainSum: 1.5, weatherCode: 61 },
            { date: '2026-08-21', dayName: 'Jum', tempMax: 33, tempMin: 21, rainProb: 10, rainSum: 0, weatherCode: 1 },
            { date: '2026-08-22', dayName: 'Shan', tempMax: 35, tempMin: 23, rainProb: 5, rainSum: 0, weatherCode: 0 },
          ]);
          setLoadingWeather(false);
        }
      }
    }
    fetchWeather();
    return () => { isMounted = false; };
  }, [lat, lon, currentLang]);

  const irrigationAdvice: RealIrrigationAdvice = calculateRealIrrigationRecommendation(field, ndviResult, weatherDays);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [currentReading, history] = await Promise.all([
        fetchAndStoreFieldNdvi(field, simulateCloudMode),
        fetchFieldNdviHistory(field),
      ]);
      setNdviResult(currentReading);
      setNdviHistory(history);
      if (history.length > 0) setSelectedChartPoint(history[history.length - 1]);
    } catch {}
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. TOP NAVIGATION BAR WITH BACK ARROW, FIELD NAME, AND UNDERLINED TAB SWITCHER */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{currentLang === 'ru' ? '← Назад к полям' : currentLang === 'en' ? '← Back to Fields' : "← Barcha maydonlarga qaytish"}</span>
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-xl p-1 bg-slate-100 rounded-md border border-slate-200">
                {cropOption.icon}
              </span>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {field.name}
              </h1>
              <span className="text-xs text-slate-500 font-medium">
                ({cropTitle} &bull; {field.area_hectares} ha &bull; {field.region})
              </span>
            </div>

            {allFields.length > 1 && onSelectField && (
              <div className="relative">
                <button
                  onClick={() => setFieldSwitcherOpen(!fieldSwitcherOpen)}
                  className="h-7 px-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md flex items-center gap-1 transition-all"
                >
                  <span>{currentLang === 'ru' ? 'Сменить поле' : 'Almashtirish'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {fieldSwitcherOpen && (
                  <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg border border-slate-200 shadow-lg z-50 p-1 space-y-0.5">
                    {allFields.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          onSelectField(f);
                          setFieldSwitcherOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
                          f.id === field.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{f.name}</span>
                        {f.id === field.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ekinix-open-telegram'));
              }}
              className="h-8 px-2.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Bot</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 px-3 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? '...' : (currentLang === 'ru' ? 'Обновить' : currentLang === 'en' ? 'Refresh Telemetry' : 'Yangilash')}</span>
            </button>
          </div>
        </div>

        {/* UNDERLINED TAB SWITCHER */}
        <div className="flex items-center gap-6 border-b border-slate-200 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveDetailTab('overview')}
            className={`text-xs font-medium pb-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeDetailTab === 'overview'
                ? 'border-emerald-800 text-emerald-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {currentLang === 'ru' ? 'Обзор' : currentLang === 'en' ? 'Overview' : 'Umumiy ko\'rinish'}
          </button>
          <button
            onClick={() => setActiveDetailTab('ndvi')}
            className={`text-xs font-medium pb-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeDetailTab === 'ndvi'
                ? 'border-emerald-800 text-emerald-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {currentLang === 'ru' ? 'Спутник NDVI' : currentLang === 'en' ? 'Satellite NDVI' : "Sun'iy yo'ldosh NDVI"}
          </button>
          <button
            onClick={() => setActiveDetailTab('irrigation')}
            className={`text-xs font-medium pb-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeDetailTab === 'irrigation'
                ? 'border-emerald-800 text-emerald-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {currentLang === 'ru' ? 'График полива' : currentLang === 'en' ? 'Irrigation Schedule' : "Sug'orish jadvali"}
          </button>
          <button
            onClick={() => setActiveDetailTab('guide')}
            className={`text-xs font-medium pb-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeDetailTab === 'guide'
                ? 'border-emerald-800 text-emerald-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {currentLang === 'ru' ? 'Агро-руководство' : currentLang === 'en' ? 'Agronomy Guide' : "Agronomiya qo'llanmasi"}
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeDetailTab === 'overview' && (
        <div className="space-y-5">
          {/* Smart Irrigation Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg shrink-0 ${
                irrigationAdvice.urgency === 'urgent' ? 'bg-rose-100 text-rose-700' :
                irrigationAdvice.urgency === 'warning' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                <Droplets className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {currentLang === 'ru' ? 'Рекомендация по поливу' : 'Sug\'orish tavsiyasi'}
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {currentLang === 'ru' ? irrigationAdvice.headlineRu : irrigationAdvice.headlineUz}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {currentLang === 'ru' ? irrigationAdvice.explanationRu : irrigationAdvice.explanationUz}
                </p>
              </div>
            </div>

            {irrigationAdvice.recommendedVolumeM3PerHa > 0 && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shrink-0 text-right space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-medium text-slate-500 block">{currentLang === 'ru' ? 'Норма полива' : 'Me\'yor'}</span>
                  <span className="text-lg font-mono font-bold text-slate-900">{irrigationAdvice.recommendedVolumeM3PerHa} m³/ha</span>
                </div>
                {wateredSuccessTime ? (
                  <span className="text-[11px] font-medium text-emerald-700 block">✓ Sug&apos;orildi ({wateredSuccessTime})</span>
                ) : (
                  <Button onClick={handleMarkAsWatered} disabled={isMarkingWatered} className="w-full h-8 text-xs bg-emerald-800 text-white rounded-lg">
                    {isMarkingWatered ? '...' : '✅ Sug\'orildi deb belgilash'}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Map & Core Telemetry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>{currentLang === 'ru' ? 'Контур и снимки' : 'Maydon xaritasi'}</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-500">{lat.toFixed(4)}°N, {lon.toFixed(4)}°E</span>
              </div>
              <FieldMonitoringMap field={field} height={320} />
            </div>

            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Satellite className="w-4 h-4 text-slate-500" />
                <span>{currentLang === 'ru' ? 'Текущая телеметрия' : 'Joriy Telemetriya'}</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase text-slate-500 block">NDVI Score</span>
                    <InfoTooltip preset="ndvi" lang={currentLang} size="xs" id={`detail-overview-ndvi-${field.id}`} />
                  </div>
                  <div className="text-xl font-mono font-bold text-slate-900">{formatNdviScore(ndviResult?.ndviScore, currentLang)}</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600"
                      style={{
                        width: `${typeof ndviResult?.ndviScore === 'number' ? Math.min(100, Math.max(0, (ndviResult.ndviScore / 1.0) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium uppercase text-slate-500 block">{currentLang === 'ru' ? 'Влажность' : 'Tuproq Namligi'}</span>
                    <InfoTooltip preset="soil_moisture" lang={currentLang} size="xs" id={`detail-overview-moisture-${field.id}`} />
                  </div>
                  <div className="text-xl font-mono font-bold text-slate-900">{ndviResult?.moisturePercentage ?? 68}%</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-600" style={{ width: `${ndviResult?.moisturePercentage ?? 68}%` }} />
                  </div>
                </div>
              </div>

              {/* Weather 5-Day Strip */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block">{currentLang === 'ru' ? 'Прогноз погоды' : 'Ob-havo prognozi'}</span>
                {loadingWeather ? (
                  <WeatherStripSkeleton />
                ) : (
                  <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                    {weatherDays.map((w, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-500 font-medium block">{w.dayName}</span>
                        <div className="flex justify-center">{getWeatherMeta(w.weatherCode).icon}</div>
                        <div className="font-mono text-xs font-bold text-slate-900">{w.tempMax}°C</div>
                        <span className="text-[9px] text-sky-700 font-medium block">{w.rainProb}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SATELLITE NDVI */}
      {activeDetailTab === 'ndvi' && (
        <div className="space-y-5">
          {/* Top Live Satellite Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {currentLang === 'ru' ? 'Текущий индекс NDVI' : currentLang === 'en' ? 'Current NDVI Score' : "Joriy NDVI Indeksi"}
                </span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-slate-900">
                  {formatNdviScore(ndviResult?.ndviScore, currentLang)}
                </span>
                {(() => {
                  const badge = getNdviStatusBadge(ndviResult?.ndviScore, currentLang);
                  return (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600"
                  style={{
                    width: `${typeof ndviResult?.ndviScore === 'number' ? Math.min(100, Math.max(0, (ndviResult.ndviScore / 1.0) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {currentLang === 'ru' ? 'Влажность биомассы' : currentLang === 'en' ? 'Canopy Hydration' : "Vegetatsiya Namligi"}
                </span>
                <Droplets className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900">
                {ndviResult?.moisturePercentage ?? 68}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-sky-600" style={{ width: `${ndviResult?.moisturePercentage ?? 68}%` }} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {currentLang === 'ru' ? 'Дата пролета Sentinel-2' : currentLang === 'en' ? 'Pass Date' : "Oxirgi O'tish Sanasi"}
                </span>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-sm font-mono font-bold text-slate-900">
                {ndviResult?.satelliteDate || new Date().toISOString().split('T')[0]}
              </div>
              <span className="text-[10px] text-slate-500 block truncate">
                Sentinel-2 MSI (10m Resolution)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {currentLang === 'ru' ? 'История спутниковых измерений Sentinel-2' : "Sun'iy yo'ldosh NDVI Telemetriyasi Tarixi"}
                  </h3>
                  <InfoTooltip preset="ndvi" lang={currentLang} size="xs" id="detail-tab2-ndvi-header-tooltip" />
                </div>
                <p className="text-xs text-slate-500">
                  {currentLang === 'ru' ? 'Хронология спектрального анализа вегетации' : "Ekin vegetatsiyasi va spektral tahlil o'lchovlari xronologiyasi (eng yangi o'lchov yuqorida)"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSimulateCloudMode(!simulateCloudMode)}
                  className={`h-7 px-2.5 text-xs font-medium rounded-lg border transition-colors ${
                    simulateCloudMode ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  ☁️ {simulateCloudMode ? 'Bulutli test faol' : 'Bulut testi'}
                </button>
              </div>
            </div>

            {/* Clean Tabular Telemetry Table with border-b border-slate-100 */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-sans font-medium text-[11px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <span>NDVI Index</span>
                        <InfoTooltip preset="ndvi" lang={currentLang} size="xs" id="table-col-ndvi-tooltip" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <span>Soil Moisture</span>
                        <InfoTooltip preset="soil_moisture" lang={currentLang} size="xs" id="table-col-moisture-tooltip" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3">Trend</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const currentScore = ndviResult?.ndviScore ?? null;
                    const currentDate = ndviResult?.satelliteDate || new Date().toISOString().split('T')[0];
                    const currentMoisture = ndviResult?.moisturePercentage ?? 68;

                    const list = [...ndviHistory];
                    const hasCurrent = list.some((item) => item.satellite_date === currentDate);
                    if (!hasCurrent && currentScore !== null) {
                      list.push({
                        id: `current_${field.id}`,
                        field_id: field.id,
                        ndvi_score: currentScore,
                        moisture_percentage: currentMoisture,
                        status: currentScore >= 0.65 ? 'good' : currentScore >= 0.45 ? 'warning' : 'critical',
                        satellite_date: currentDate,
                        recommendation_uz: "Joriy sun'iy yo'ldosh monitoringi",
                        recommendation_ru: "Текущий спутниковый мониторинг",
                        recommendation_en: "Current satellite monitoring",
                      });
                    }

                    // Sort descending: newest on top
                    const sorted = list.sort((a, b) => new Date(b.satellite_date).getTime() - new Date(a.satellite_date).getTime());

                    if (sorted.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 font-sans text-xs">
                            <p className="font-medium text-slate-700">{currentLang === 'ru' ? 'Спутниковые данные пока не поступили' : currentLang === 'en' ? 'No satellite telemetry recorded yet' : "Sun'iy yo'ldosh ma'lumoti hozircha mavjud emas"}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{currentLang === 'ru' ? 'Следующий пролет Sentinel-2 ожидается в течение 3-5 дней' : currentLang === 'en' ? 'Next Sentinel-2 pass scheduled within 3-5 days' : "Sentinel-2 sun'iy yo'ldoshi navbatdagi tahlili 3-5 kunda amalga oshiriladi"}</p>
                          </td>
                        </tr>
                      );
                    }

                    return sorted.map((item, idx) => {
                      const badge = getNdviStatusBadge(item.ndvi_score, currentLang);
                      const isLatest = idx === 0;

                      return (
                        <tr key={item.id || item.satellite_date} className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${isLatest ? 'bg-emerald-50/40 font-semibold' : ''}`}>
                          <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center gap-1.5">
                            <span>{item.satellite_date}</span>
                            {isLatest && (
                              <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {currentLang === 'ru' ? 'Текущий' : currentLang === 'en' ? 'Latest' : 'Joriy'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{formatNdviScore(item.ndvi_score, currentLang)}</td>
                          <td className="py-2.5 px-3 text-slate-600">{item.moisture_percentage}%</td>
                          <td className="py-2.5 px-3 font-sans text-[11px] text-slate-600">
                            {item.ndvi_score >= 0.65 ? (
                              <span className="text-emerald-700 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> High</span>
                            ) : item.ndvi_score >= 0.45 ? (
                              <span className="text-amber-700 flex items-center gap-1"><Minus className="w-3.5 h-3.5" /> Moderate</span>
                            ) : (
                              <span className="text-rose-700 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Stress</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IRRIGATION SCHEDULE */}
      {activeDetailTab === 'irrigation' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              {currentLang === 'ru' ? 'График и норма полива' : "Sug'orish Jadvali va Suv Hisobi"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-medium text-slate-500 block">Joriy Tavsiya</span>
                <span className="text-lg font-bold text-slate-900 block">{irrigationAdvice.recommendedVolumeM3PerHa} m³/ha</span>
                <p className="text-xs text-slate-600">{irrigationAdvice.explanationUz}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-medium text-slate-500 block">Jami Suv Hajmi</span>
                <span className="text-lg font-bold text-slate-900 block">~{irrigationAdvice.totalFieldWaterM3} m³</span>
                <p className="text-xs text-slate-600">Maydon ({field.area_hectares} ha) uchun umumiy hisob</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] uppercase font-medium text-slate-500 block">Navbatdagi Sug&apos;orish</span>
                <span className="text-lg font-bold text-slate-900 block">
                  {irrigationAdvice.nextWindowDays === 0 ? "Bugun" : `${irrigationAdvice.nextWindowDays} kundan so'ng`}
                </span>
                <p className="text-xs text-slate-600">Ob-havo namlik balansiga asosan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AGRONOMY GUIDE */}
      {activeDetailTab === 'guide' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {cropTitle} Parvarishi: {currentStage.stage_name_uz}
                </h3>
                <p className="text-xs text-slate-500">
                  Ekilganiga {daysElapsed} kun bo&apos;ldi ({totalStages} bosqichdan {stageIndex + 1}-bosqich)
                </p>
              </div>

              {onNavigateToGuides && (
                <button
                  onClick={onNavigateToGuides}
                  className="h-8 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  To&apos;liq qo&apos;llanmalar →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-700 block uppercase">Sug&apos;orish Tartibi</span>
                <p className="text-xs text-slate-600">{currentStage.irrigation_notes_uz}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-700 block uppercase">Zararkunandalar Nazorati</span>
                <p className="text-xs text-slate-600">{currentStage.pest_notes_uz || "Zararkunandalarga qarshi doimiy tekshiring."}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[11px] font-semibold text-slate-700 block uppercase">Oziqlantirish</span>
                <p className="text-xs text-slate-600">{currentStage.harvest_notes_uz || "O'g'itlash rejasiga rioya qiling."}</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
