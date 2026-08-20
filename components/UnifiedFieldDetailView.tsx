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
} from '@/lib/ndviService';
import { calculateGrowthStage, CROP_GUIDES_DATA } from '@/lib/cropGuidesData';
import { getFieldSeasonProgress, FieldSeasonProgress } from '@/lib/seasonMilestones';
import { FieldMonitoringMap } from '@/components/FieldMonitoringMap';
import { CROP_OPTIONS } from '@/components/FarmerOnboardingModal';
import { getFieldCenterCoordinates } from '@/components/FieldWeatherCard';
import { SectionLoader, WeatherStripSkeleton, ErrorState, EmptyState } from '@/components/ui/StateFeedback';
import { Button } from '@/components/ui/Button';
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
  Clock,
  ExternalLink,
  Sparkles,
  Volume2,
  Copy,
  Share2,
  Printer,
  Users,
  ShieldCheck,
  Award,
  KeyRound,
  FileCheck,
  Activity,
  Send,
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

// Weather code mapping
function getWeatherMeta(code: number) {
  if (code === 0) return { icon: <Sun className="w-5 h-5 text-amber-500" />, labelUz: "Aftobli / Ochiq", labelRu: "Ясно", labelEn: "Clear / Sunny" };
  if (code >= 1 && code <= 3) return { icon: <CloudSun className="w-5 h-5 text-amber-400" />, labelUz: "Biroz bulutli", labelRu: "Облачно", labelEn: "Partly Cloudy" };
  if (code >= 45 && code <= 48) return { icon: <Cloud className="w-5 h-5 text-slate-400" />, labelUz: "Tumanli", labelRu: "Туман", labelEn: "Foggy" };
  if (code >= 51 && code <= 67) return { icon: <CloudDrizzle className="w-5 h-5 text-sky-500" />, labelUz: "Mayin yomg'ir", labelRu: "Морось", labelEn: "Light Drizzle" };
  if (code >= 80 && code <= 82) return { icon: <CloudRain className="w-5 h-5 text-blue-600" />, labelUz: "Jala / Yomg'ir", labelRu: "Ливень / Дождь", labelEn: "Heavy Rain" };
  return { icon: <Cloud className="w-5 h-5 text-emerald-700" />, labelUz: "Bulutli", labelRu: "Пасмурно", labelEn: "Overcast" };
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

  // 1. Telemetry State
  const [ndviResult, setNdviResult] = useState<NdviResult | null>(null);
  const [ndviHistory, setNdviHistory] = useState<NDVIReading[]>([]);
  const [loadingNdvi, setLoadingNdvi] = useState(true);
  const [simulateCloudMode, setSimulateCloudMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 2. Weather State
  const [weatherDays, setWeatherDays] = useState<DailyWeather[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // 3. UI & AI State
  const [selectedChartPoint, setSelectedChartPoint] = useState<NDVIReading | null>(null);
  const [fieldSwitcherOpen, setFieldSwitcherOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Season Milestones calculation
  const seasonProgress = useMemo(() => {
    return getFieldSeasonProgress(field.crop_type, field.planting_date);
  }, [field.crop_type, field.planting_date]);

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // AI Field Summary (Gemini 3.7 Flash)
  const [aiSummaryData, setAiSummaryData] = useState<{
    executive_summary: string;
    what_happened: string;
    concerns_and_risks: string;
    recommended_actions: string[];
    irrigation_tip: string;
    confidence_score: number;
    source?: string;
  } | null>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
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

  // Fetch AI Summary
  const generateAiSummary = useCallback(async () => {
    setLoadingAiSummary(true);
    setAiError(null);
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

      if (!res.ok) throw new Error("Failed to generate summary");
      const data = await res.json();
      setAiSummaryData(data);
    } catch (err: any) {
      console.warn("AI Summary fetch error:", err);
      setAiError(err.message || "Xatolik yuz berdi");
    } finally {
      setLoadingAiSummary(false);
    }
  }, [field, seasonProgress.currentMilestone.nameUz, ndviResult, weatherDays, currentLang]);

  // Auto-generate initial AI report once NDVI loads
  useEffect(() => {
    let isMounted = true;
    if (!loadingNdvi && !aiSummaryData && !loadingAiSummary) {
      const timer = setTimeout(() => {
        if (isMounted) {
          generateAiSummary();
        }
      }, 100);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [loadingNdvi, aiSummaryData, loadingAiSummary, generateAiSummary]);

  // Text to Speech
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

  // Agronomist Notes for this field
  const [fieldAdvisorNotes, setFieldAdvisorNotes] = useState<FieldAdvisorNote[]>(() => {
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

  // Field Center Coordinates
  const [lat, lon] = useMemo(() => getFieldCenterCoordinates(field), [field]);

  // Crop Metadata & Growth Stage Information
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

  // 4. Fetch Live NDVI & History
  useEffect(() => {
    let isMounted = true;

    async function loadTelemetry() {
      try {
        const [currentReading, history] = await Promise.all([
          fetchAndStoreFieldNdvi(field, simulateCloudMode),
          fetchFieldNdviHistory(field),
        ]);

        if (isMounted) {
          setNdviResult(currentReading);
          setNdviHistory(history);
          if (history.length > 0) {
            setSelectedChartPoint(history[history.length - 1]);
          }
          setLoadingNdvi(false);
        }
      } catch (err) {
        console.warn("Unified field telemetry load notice:", err);
        if (isMounted) setLoadingNdvi(false);
      }
    }

    loadTelemetry();

    return () => {
      isMounted = false;
    };
  }, [field, simulateCloudMode]);

  // 5. Fetch Open-Meteo 5-Day Forecast
  useEffect(() => {
    let isMounted = true;

    async function fetchWeather() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Open-Meteo failed");
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
          const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

          const list: DailyWeather[] = times.slice(0, 5).map((timeStr, idx) => {
            const dateObj = new Date(timeStr);
            const dayName = idx === 0
              ? t.today
              : currentLang === 'uz'
              ? dayNamesUz[dateObj.getDay()]
              : currentLang === 'ru'
              ? dayNamesRu[dateObj.getDay()]
              : dayNamesEn[dateObj.getDay()];

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
      } catch (err) {
        console.warn("Open-Meteo fallback:", err);
        if (isMounted) {
          const fallback: DailyWeather[] = [
            { date: '2026-08-18', dayName: t.today, tempMax: 34, tempMin: 22, rainProb: 15, rainSum: 0, weatherCode: 0 },
            { date: '2026-08-19', dayName: 'Ertaga', tempMax: 31, tempMin: 20, rainProb: 65, rainSum: 6.8, weatherCode: 80 },
            { date: '2026-08-20', dayName: 'Indin', tempMax: 29, tempMin: 19, rainProb: 40, rainSum: 1.5, weatherCode: 61 },
            { date: '2026-08-21', dayName: 'Jum', tempMax: 33, tempMin: 21, rainProb: 10, rainSum: 0, weatherCode: 1 },
            { date: '2026-08-22', dayName: 'Shan', tempMax: 35, tempMin: 23, rainProb: 5, rainSum: 0, weatherCode: 0 },
          ];
          setWeatherDays(fallback);
          setLoadingWeather(false);
        }
      }
    }

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [lat, lon, currentLang, t.today]);

  // 6. REAL IRRIGATION RECOMMENDATION CALCULATION
  const irrigationAdvice: RealIrrigationAdvice = calculateRealIrrigationRecommendation(field, ndviResult, weatherDays);

  // Handle Refresh Action
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
    } catch {
      // ignore
    }
    setTimeout(() => setRefreshing(false), 600);
  };

  // NDVI SVG Trend Chart Coordinates Calculation
  const chartWidth = 560;
  const chartHeight = 180;
  const chartPadding = { top: 20, right: 25, bottom: 35, left: 45 };

  const chartPoints = useMemo(() => {
    if (ndviHistory.length === 0) return [];

    const minScore = 0.0;
    const maxScore = 1.0;
    const innerW = chartWidth - chartPadding.left - chartPadding.right;
    const innerH = chartHeight - chartPadding.top - chartPadding.bottom;

    return ndviHistory.map((item, idx) => {
      const x = chartPadding.left + (idx / Math.max(1, ndviHistory.length - 1)) * innerW;
      const normalizedY = (item.ndvi_score - minScore) / (maxScore - minScore);
      const y = chartPadding.top + innerH - normalizedY * innerH;

      return {
        ...item,
        x,
        y,
      };
    });
  }, [ndviHistory, chartWidth, chartHeight, chartPadding.left, chartPadding.right, chartPadding.top, chartPadding.bottom]);

  const svgPathD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [chartPoints]);

  const svgAreaD = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const bottomY = chartHeight - chartPadding.bottom;
    const firstX = chartPoints[0].x;
    const lastX = chartPoints[chartPoints.length - 1].x;
    return `${svgPathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [chartPoints, svgPathD, chartHeight, chartPadding.bottom]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & FIELD SWITCHER / METADATA BAR                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E4D9C4] p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          <div className="space-y-2">
            {/* Breadcrumb / Back button */}
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6C7C6F] hover:text-[#1F3D2B] transition-colors py-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{currentLang === 'ru' ? 'Назад ко всем полям' : currentLang === 'en' ? 'Back to all fields' : "Barcha maydonlarga qaytish"}</span>
              </button>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl p-2.5 bg-[#FAF7F0] rounded-2xl border border-[#E4D9C4] shadow-xs">
                {cropOption.icon}
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F3D2B] tracking-tight">
                    {field.name}
                  </h1>

                  {/* Field Switcher dropdown if multiple fields available */}
                  {allFields.length > 1 && onSelectField && (
                    <div className="relative">
                      <button
                        onClick={() => setFieldSwitcherOpen(!fieldSwitcherOpen)}
                        className="px-2.5 py-1 text-xs font-bold text-[#1F3D2B] bg-[#FAF7F0] hover:bg-[#F0E8D8] border border-[#E4D9C4] rounded-xl flex items-center gap-1 transition-all"
                      >
                        <span>Maydonni almashtirish</span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#D9A441]" />
                      </button>

                      {fieldSwitcherOpen && (
                        <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl border-2 border-[#E4D9C4] shadow-xl z-50 p-1.5 space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#6C7C6F] px-2.5 py-1">
                            Ro&apos;yxatdagi maydonlar:
                          </p>
                          {allFields.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => {
                                onSelectField(f);
                                setFieldSwitcherOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                                f.id === field.id
                                  ? 'bg-[#1F3D2B] text-[#D9A441]'
                                  : 'text-[#1F3D2B] hover:bg-[#FAF7F0]'
                              }`}
                            >
                              <div className="truncate">
                                <p className="truncate">{f.name}</p>
                                <p className="text-[10px] opacity-70 font-normal">{f.area_hectares} ha &bull; {f.region}</p>
                              </div>
                              {f.id === field.id && <Check className="w-4 h-4 text-[#D9A441] shrink-0" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Key metadata pills */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#5C6B5E]">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1F3D2B] bg-[#FAF7F0] px-2.5 py-0.5 rounded-lg border border-[#E4D9C4]">
                    🌾 {cropTitle}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1F3D2B] bg-[#FAF7F0] px-2.5 py-0.5 rounded-lg border border-[#E4D9C4]">
                    📏 {field.area_hectares} {t.hectaresUnit}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#6C7C6F]">
                    <MapPin className="w-3.5 h-3.5 text-[#D9A441]" />
                    {field.region}
                  </span>
                  {field.planting_date && (
                    <span className="inline-flex items-center gap-1 text-[#6C7C6F]">
                      <Calendar className="w-3.5 h-3.5 text-[#D9A441]" />
                      Ekilgan sana: {field.planting_date} ({daysElapsed}-kun)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons (Telemetry refresh, Telegram & Cloud test toggle) */}
          <div className="flex items-center flex-wrap gap-2 self-start lg:self-center">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('ekinix-open-telegram'));
                }
              }}
              className="px-3.5 py-2 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] font-bold text-xs rounded-xl border border-[#0088cc]/30 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Telegram botga dala ob-havosi va NDVI hisobotini yuborish"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Bot</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-[#FAF7F0] hover:bg-[#F0E8D8] text-[#1F3D2B] font-bold text-xs rounded-xl border border-[#E4D9C4] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Sentinel-2 va Ob-havo telemetriyasini qayta yangilash"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D9A441] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Yangilanmoqda...' : 'Telemetriyani yangilash'}</span>
            </button>

            <button
              onClick={() => setSimulateCloudMode(!simulateCloudMode)}
              className={`px-3 py-2 font-bold text-xs rounded-xl border transition-all flex items-center gap-1.5 ${
                simulateCloudMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-[#6C7C6F] hover:text-[#1F3D2B] border-[#E4D9C4]'
              }`}
              title="Bulutli sun'iy yo'ldosh holatini sinab ko'rish"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{simulateCloudMode ? '☁️ Bulutli rejim faol' : '☁️ Bulut testi'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REAL IRRIGATION RECOMMENDATION BANNER (THE PRODUCT DECISION)           */}
      {/* ========================================================================= */}
      <div
        className={`rounded-3xl border-2 p-5 sm:p-7 shadow-sm transition-all ${
          irrigationAdvice.urgency === 'urgent'
            ? 'bg-rose-50/90 border-rose-400 text-rose-950'
            : irrigationAdvice.urgency === 'info'
            ? 'bg-sky-50/90 border-sky-400 text-sky-950'
            : irrigationAdvice.urgency === 'warning'
            ? 'bg-amber-50/90 border-amber-400 text-amber-950'
            : 'bg-[#FAF7F0] border-[#D9A441] text-[#1F3D2B]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 shadow-xs ${
                irrigationAdvice.urgency === 'urgent'
                  ? 'bg-rose-600 text-white'
                  : irrigationAdvice.urgency === 'info'
                  ? 'bg-sky-600 text-white'
                  : irrigationAdvice.urgency === 'warning'
                  ? 'bg-amber-500 text-white'
                  : 'bg-[#1F3D2B] text-[#D9A441]'
              }`}
            >
              {irrigationAdvice.urgency === 'info' ? (
                <CloudRain className="w-7 h-7 animate-pulse" />
              ) : irrigationAdvice.urgency === 'urgent' ? (
                <Droplets className="w-7 h-7 animate-bounce" />
              ) : irrigationAdvice.urgency === 'warning' ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <CheckCircle2 className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/80 px-2.5 py-0.5 rounded-md border border-black/10">
                  💧 Aqlli Sug&apos;orish Tahlili
                </span>
                <span className="text-[11px] font-bold opacity-80">
                  {irrigationAdvice.nextWindowDays === 0
                    ? "⚡ Zudlik bilan"
                    : irrigationAdvice.nextWindowDays === 3
                    ? "🌧️ Yomg'irdan keyin"
                    : `🗓️ ${irrigationAdvice.nextWindowDays} kundan so'ng`}
                </span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-bold leading-tight">
                {currentLang === 'ru'
                  ? irrigationAdvice.headlineRu
                  : currentLang === 'en'
                  ? irrigationAdvice.headlineEn
                  : irrigationAdvice.headlineUz}
              </h2>

              <p className="text-xs sm:text-sm leading-relaxed opacity-90 max-w-3xl">
                {currentLang === 'ru'
                  ? irrigationAdvice.explanationRu
                  : currentLang === 'en'
                  ? irrigationAdvice.explanationEn
                  : irrigationAdvice.explanationUz}
              </p>
            </div>
          </div>

          {/* Water norm calculator card & Action button */}
          {irrigationAdvice.recommendedVolumeM3PerHa > 0 && (
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-black/10 shrink-0 min-w-[220px] text-right md:text-left space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#6C7C6F] uppercase tracking-wider block">
                  Tavsiya etilgan suv hajmi:
                </span>
                <p className="text-xl font-serif font-bold text-[#1F3D2B]">
                  {irrigationAdvice.recommendedVolumeM3PerHa} m³ <span className="text-xs font-sans font-normal text-[#6C7C6F]">/ gektar</span>
                </p>
                <p className="text-xs font-semibold text-[#D9A441] border-t border-black/5 pt-1">
                  Jami: ~{irrigationAdvice.totalFieldWaterM3.toLocaleString()} m³ suv
                </p>
              </div>

              {wateredSuccessTime ? (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sug&apos;orildi deb belgilandi ({wateredSuccessTime})</span>
                </div>
              ) : (
                <Button
                  onClick={handleMarkAsWatered}
                  disabled={isMarkingWatered}
                  className="w-full bg-[#1F3D2B] hover:bg-[#2A5239] text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Droplets className="w-3.5 h-3.5 text-[#D9A441]" />
                  {isMarkingWatered ? "Yozilmoqda..." : "✅ Sug'orildi deb belgilash"}
                </Button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TWO-COLUMN CORE GRID: MAP & NDVI TELEMETRY WITH TREND CHART            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 6 COLS: Leaflet Satellite Map with Real Polygon & Overlays */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E4D9C4] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#1F3D2B] text-[#D9A441] rounded-xl">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1F3D2B]">
                    Chegara va Sun&apos;iy Yo&apos;ldosh Xaritasi
                  </h3>
                  <p className="text-[11px] text-[#6C7C6F] font-semibold">
                    Sentinel-2 L2A Spektral tasvir &bull; GPS kontur
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-[#6C7C6F] bg-[#FAF7F0] px-2 py-1 rounded-md border border-[#E4D9C4]">
                {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
              </span>
            </div>

            {/* The Real Leaflet Map Component */}
            <FieldMonitoringMap field={field} height={380} />

            {/* Map Telemetry legend footer */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px]">
              <div className="bg-[#FAF7F0] p-2 rounded-xl border border-[#E4D9C4]">
                <span className="text-[#6C7C6F] block text-[10px]">Ekin turi</span>
                <span className="font-bold text-[#1F3D2B]">{cropTitle}</span>
              </div>
              <div className="bg-[#FAF7F0] p-2 rounded-xl border border-[#E4D9C4]">
                <span className="text-[#6C7C6F] block text-[10px]">Maydon hajmi</span>
                <span className="font-bold text-[#1F3D2B]">{field.area_hectares} ga</span>
              </div>
              <div className="bg-[#FAF7F0] p-2 rounded-xl border border-[#E4D9C4]">
                <span className="text-[#6C7C6F] block text-[10px]">Kontur nuqtalari</span>
                <span className="font-bold text-[#1F3D2B]">{field.coordinates?.length || 4} ta nuqta</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 6 COLS: NDVI Health Score & Historical Trend Timeline Chart */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E4D9C4] p-5 sm:p-6 shadow-xs space-y-5">
            
            {/* NDVI Current Score Header & 3-Tier Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4D9C4] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#1F3D2B] text-[#D9A441] rounded-xl">
                    <Satellite className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#1F3D2B]">
                      NDVI Vegetatsiya & Tuproq Namligi
                    </h3>
                    <p className="text-[11px] text-[#6C7C6F] font-semibold">
                      Sentinel Hub tahlili ({ndviResult?.satelliteDate || new Date().toISOString().split('T')[0]})
                    </p>
                  </div>
                </div>
              </div>

              {/* 3-Tier Health Badge */}
              <div>
                {loadingNdvi ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F0] text-[#6C7C6F] border border-[#E4D9C4] animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D9A441]" />
                    <span>Sentinel yuklanmoqda...</span>
                  </span>
                ) : ndviResult?.isCloudy ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    <CloudOff className="w-4 h-4 text-slate-500" />
                    <span>Bulutli</span>
                  </span>
                ) : ndviResult?.statusTier === 'healthy' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-950 border-2 border-emerald-400 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t.statusHealthy}</span>
                  </span>
                ) : ndviResult?.statusTier === 'moderate' ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-950 border-2 border-amber-400 shadow-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{t.statusModerateStress}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-950 border-2 border-rose-400 shadow-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>{t.statusHighStress}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Cloud Cover Graceful Fallback Banner if cloudy */}
            {ndviResult?.isCloudy && (
              <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 text-slate-700 rounded-xl">
                    <CloudOff className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {currentLang === 'uz'
                        ? ndviResult.cloudMessageUz
                        : currentLang === 'ru'
                        ? ndviResult.cloudMessageRu
                        : ndviResult.cloudMessageEn}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Bulutlilik: {ndviResult.cloudCoverPercent}% &bull; Qaytadan tekshirish tavsiya etiladi.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSimulateCloudMode(false)}
                  className="text-xs font-bold text-[#1F3D2B] bg-white hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-300 shadow-xs shrink-0 cursor-pointer"
                >
                  Qayta tekshirish
                </button>
              </div>
            )}

            {/* Score & Moisture Metric Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              
              <div className="bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#E4D9C4]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C7C6F] block">
                  NDVI Indeksi
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-serif font-bold text-[#1F3D2B]">
                    {ndviResult?.ndviScore ?? 0.74}
                  </span>
                  <span className="text-[10px] text-[#6C7C6F]">/ 1.0</span>
                </div>
                <div className="w-full bg-[#E4D9C4] h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(10, ((ndviResult?.ndviScore ?? 0.7) / 1.0) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#E4D9C4] relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C7C6F] block truncate">
                    {t.soilMoisture}
                  </span>
                  <div className="relative cursor-help">
                    <Info className="w-3.5 h-3.5 text-[#D9A441]" />
                    <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block w-64 p-2.5 bg-[#1F3D2B] text-[#FAF7F0] text-[11px] rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed border border-[#D9A441]/30">
                      <p className="font-bold text-[#D9A441] mb-1">
                        {currentLang === 'ru' ? 'Смешанная модель влажности' : currentLang === 'en' ? 'Blended Moisture Model' : 'Aralash namlik modeli'}
                      </p>
                      <p>{t.soilMoistureTooltip}</p>
                      {ndviResult?.soilDepths && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] space-y-0.5">
                          <p>🌱 0-9cm: <strong>{ndviResult.soilDepths.percent3_9cm}%</strong></p>
                          <p>🌾 9-27cm: <strong>{ndviResult.soilDepths.percent9_27cm}%</strong></p>
                          <p>🌳 27-81cm: <strong>{ndviResult.soilDepths.percent27_81cm}%</strong></p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-serif font-bold text-[#1F3D2B]">
                    {ndviResult?.moisturePercentage ?? 68}%
                  </span>
                  <span className="text-[10px] text-[#6C7C6F] font-semibold">
                    (taxminiy)
                  </span>
                </div>
                <div className="w-full bg-[#E4D9C4] h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${ndviResult?.moisturePercentage ?? 68}%` }}
                  />
                </div>
              </div>

              <div className="bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#E4D9C4] col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C7C6F] block">
                  O&apos;sish Tendensiyasi
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  {ndviResult?.trend?.direction === 'improving' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <TrendingUp className="w-4 h-4" />
                      <span>+{ndviResult.trend.diff} (Yaxshi)</span>
                    </span>
                  ) : ndviResult?.trend?.direction === 'declining' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
                      <TrendingDown className="w-4 h-4" />
                      <span>{ndviResult.trend.diff} (Pasayish)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                      <Minus className="w-4 h-4" />
                      <span>Barqaror</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#6C7C6F] mt-1 block">
                  Oldingi o&apos;lchovga nisbatan
                </span>
              </div>

            </div>

            {/* NDVI Historical Trend Chart over Time */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F3D2B] flex items-center gap-1.5">
                  <span>📈 NDVI O&apos;zgarish Grafigi (Vaqt Bo&apos;yicha)</span>
                </h4>
                {selectedChartPoint && (
                  <span className="text-[11px] font-bold text-[#1F3D2B] bg-[#FAF7F0] px-2.5 py-0.5 rounded-lg border border-[#E4D9C4]">
                    {selectedChartPoint.satellite_date}: NDVI <span className="text-[#D9A441]">{selectedChartPoint.ndvi_score}</span>
                  </span>
                )}
              </div>

              {/* Responsive SVG Chart */}
              <div className="relative bg-[#FAF7F0] rounded-2xl border border-[#E4D9C4] p-3 overflow-hidden">
                
                {/* Visual zone baseline legend */}
                <div className="absolute top-2 right-3 flex items-center gap-2 text-[10px] font-semibold text-[#6C7C6F] z-10 pointer-events-none">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> 0.6-0.9 Sog&apos;lom
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> 0.4-0.6 O&apos;rta
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;0.4 Stress
                  </span>
                </div>

                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-44 select-none"
                  >
                    <defs>
                      <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1F3D2B" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#D9A441" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Zone background reference lines */}
                    {/* 0.8 Line */}
                    <line x1={chartPadding.left} y1={chartPadding.top + 25} x2={chartWidth - chartPadding.right} y2={chartPadding.top + 25} stroke="#1F3D2B" strokeOpacity="0.08" strokeDasharray="3 3" />
                    <text x={chartPadding.left - 8} y={chartPadding.top + 28} textAnchor="end" fontSize="9" fill="#6C7C6F" fontFamily="sans-serif">0.8</text>

                    {/* 0.6 Line */}
                    <line x1={chartPadding.left} y1={chartPadding.top + 55} x2={chartWidth - chartPadding.right} y2={chartPadding.top + 55} stroke="#D9A441" strokeOpacity="0.25" strokeDasharray="3 3" />
                    <text x={chartPadding.left - 8} y={chartPadding.top + 58} textAnchor="end" fontSize="9" fill="#6C7C6F" fontFamily="sans-serif">0.6</text>

                    {/* 0.4 Line */}
                    <line x1={chartPadding.left} y1={chartPadding.top + 85} x2={chartWidth - chartPadding.right} y2={chartPadding.top + 85} stroke="#E57373" strokeOpacity="0.25" strokeDasharray="3 3" />
                    <text x={chartPadding.left - 8} y={chartPadding.top + 88} textAnchor="end" fontSize="9" fill="#6C7C6F" fontFamily="sans-serif">0.4</text>

                    {/* 0.2 Line */}
                    <line x1={chartPadding.left} y1={chartPadding.top + 115} x2={chartWidth - chartPadding.right} y2={chartPadding.top + 115} stroke="#6C7C6F" strokeOpacity="0.1" strokeDasharray="3 3" />
                    <text x={chartPadding.left - 8} y={chartPadding.top + 118} textAnchor="end" fontSize="9" fill="#6C7C6F" fontFamily="sans-serif">0.2</text>

                    {/* Area under curve */}
                    {svgAreaD && (
                      <path d={svgAreaD} fill="url(#ndviGradient)" />
                    )}

                    {/* Trend Line */}
                    {svgPathD && (
                      <path
                        d={svgPathD}
                        fill="none"
                        stroke="#1F3D2B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Interactive Data Points */}
                    {chartPoints.map((pt, idx) => {
                      const isSelected = selectedChartPoint?.id === pt.id;
                      return (
                        <g
                          key={pt.id || idx}
                          onClick={() => setSelectedChartPoint(pt)}
                          className="cursor-pointer group"
                        >
                          {/* Point Outer Ring */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isSelected ? 6.5 : 4.5}
                            fill="#FAF7F0"
                            stroke={pt.ndvi_score >= 0.6 ? '#1F3D2B' : pt.ndvi_score >= 0.45 ? '#D9A441' : '#E53935'}
                            strokeWidth={isSelected ? 3 : 2}
                            className="transition-all hover:scale-125"
                          />

                          {/* Point Value label above dot */}
                          <text
                            x={pt.x}
                            y={pt.y - 8}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill="#1F3D2B"
                          >
                            {pt.ndvi_score}
                          </text>

                          {/* Date label on X-axis */}
                          <text
                            x={pt.x}
                            y={chartHeight - 12}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#6C7C6F"
                            fontWeight={isSelected ? 'bold' : 'normal'}
                          >
                            {pt.satellite_date.slice(5)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. HYPER-LOCAL 5-DAY WEATHER FORECAST FOR THIS FIELD'S EXACT GPS          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E4D9C4] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4D9C4] pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#1F3D2B] text-[#D9A441] rounded-xl">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F3D2B]">
                Maydon Bo&apos;yicha 5 Kunlik Ob-Havo & Yomg&apos;ir Ehtimoli
              </h3>
              <p className="text-[11px] text-[#6C7C6F] font-semibold">
                Open-Meteo aniq koordinatalar prognozi ({lat.toFixed(3)}°N, {lon.toFixed(3)}°E)
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-[#1F3D2B] bg-[#FAF7F0] px-3 py-1 rounded-xl border border-[#E4D9C4] self-start sm:self-auto">
            📍 {field.region}
          </span>
        </div>

        {loadingWeather ? (
          <div className="py-2">
            <WeatherStripSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {weatherDays.map((w, idx) => {
              const meta = getWeatherMeta(w.weatherCode);
              const isRainProbHigh = w.rainProb >= 40;

              return (
                <div
                  key={w.date || idx}
                  className={`p-3.5 rounded-2xl border transition-all text-center space-y-2 ${
                    idx === 0
                      ? 'bg-[#1F3D2B] text-white border-[#1F3D2B] shadow-sm'
                      : isRainProbHigh
                      ? 'bg-sky-50/80 border-sky-300 text-sky-950 shadow-xs'
                      : 'bg-[#FAF7F0] border-[#E4D9C4] text-[#1F3D2B] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold opacity-80">
                    <span>{w.dayName}</span>
                    <span className="text-[10px] font-mono opacity-60">{w.date.slice(5)}</span>
                  </div>

                  <div className="py-1 flex justify-center">{meta.icon}</div>

                  <div>
                    <div className="text-sm font-bold">
                      <span>{w.tempMax}°</span>
                      <span className={`text-xs ml-1 font-normal ${idx === 0 ? 'text-white/60' : 'text-[#6C7C6F]'}`}>
                        / {w.tempMin}°C
                      </span>
                    </div>
                    <p className={`text-[10px] font-medium truncate mt-0.5 ${idx === 0 ? 'text-white/80' : 'text-[#6C7C6F]'}`}>
                      {currentLang === 'uz' ? meta.labelUz : currentLang === 'ru' ? meta.labelRu : meta.labelEn}
                    </p>
                  </div>

                  {/* Highlighted Rain Probability Pill */}
                  <div
                    className={`pt-1.5 border-t text-[11px] font-bold flex items-center justify-center gap-1 ${
                      idx === 0
                        ? 'border-white/10 text-sky-300'
                        : isRainProbHigh
                        ? 'border-sky-200 text-blue-700 font-extrabold'
                        : 'border-[#E4D9C4] text-[#6C7C6F]'
                    }`}
                  >
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>{w.rainProb}% yog&apos;in</span>
                    {w.rainSum > 0 && <span className="text-[10px] opacity-80">({w.rainSum}mm)</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. CROP CARE ADVICE FOR THIS FIELD'S CURRENT GROWTH STAGE                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E4D9C4] p-5 sm:p-7 shadow-xs space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4D9C4] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1F3D2B] text-[#D9A441] rounded-xl">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1F3D2B]">
                {cropTitle} Parvarishi: {currentLang === 'ru' ? currentStage.stage_name_ru : currentLang === 'en' ? currentStage.stage_name_en : currentStage.stage_name_uz}
              </h3>
              <p className="text-xs text-[#6C7C6F] font-semibold">
                Ekilganiga {daysElapsed} kun bo&apos;ldi &bull; {totalStages} bosqichdan {stageIndex + 1}-bosqich
              </p>
            </div>
          </div>

          {onNavigateToGuides && (
            <button
              onClick={onNavigateToGuides}
              className="px-3 py-1.5 text-xs font-bold text-[#1F3D2B] hover:text-[#D9A441] bg-[#FAF7F0] hover:bg-[#F0E8D8] border border-[#E4D9C4] rounded-xl flex items-center gap-1 transition-all self-start sm:self-auto cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#D9A441]" />
              <span>To&apos;liq agronom qo&apos;llanmasi</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
            </button>
          )}
        </div>

        {/* Growth Stage Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1F3D2B]">
            <span>O&apos;sish bosqichi rivojlanishi</span>
            <span className="text-[#D9A441]">{stageIndex + 1} / {totalStages} bosqich</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: totalStages }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx < stageIndex
                    ? 'bg-emerald-600'
                    : idx === stageIndex
                    ? 'bg-[#D9A441] animate-pulse'
                    : 'bg-[#E4D9C4]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 3 Agronomic Care Tip Cards for Current Stage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          
          {/* Tip 1: Irrigation Advice */}
          <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E4D9C4] space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1F3D2B]">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Droplets className="w-4 h-4" />
              </div>
              <span className="uppercase tracking-wider">Sug&apos;orish Tartibi</span>
            </div>
            <p className="text-xs text-[#4A5A4D] leading-relaxed">
              {currentLang === 'ru'
                ? currentStage.irrigation_notes_ru
                : currentLang === 'en'
                ? currentStage.irrigation_notes_en
                : currentStage.irrigation_notes_uz}
            </p>
          </div>

          {/* Tip 2: Pest & Disease Protection */}
          <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E4D9C4] space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1F3D2B]">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <Bug className="w-4 h-4" />
              </div>
              <span className="uppercase tracking-wider">Zararkunandalar Nazorati</span>
            </div>
            <p className="text-xs text-[#4A5A4D] leading-relaxed">
              {currentLang === 'ru'
                ? currentStage.pest_notes_ru || "Профилактический осмотр посевов."
                : currentLang === 'en'
                ? currentStage.pest_notes_en || "Regular pest inspection on leaves."
                : currentStage.pest_notes_uz || "Zararkunandalar va kasalliklarga qarshi barg ostini muntazam tekshiring."}
            </p>
          </div>

          {/* Tip 3: Fertilization & Field Action */}
          <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E4D9C4] space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1F3D2B]">
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <span className="uppercase tracking-wider">Oziqlantirish & Parvarish</span>
            </div>
            <p className="text-xs text-[#4A5A4D] leading-relaxed">
              {currentLang === 'ru'
                ? currentStage.harvest_notes_ru || "Подкормка минеральными удобрениями."
                : currentLang === 'en'
                ? currentStage.harvest_notes_en || "Apply balanced fertilization."
                : currentStage.harvest_notes_uz || "Ushbu bosqichda fosfor-kaliyli o'g'itlar bilan oziqlantirish hosil sifatini kafolatlaydi."}
            </p>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. SEASON MILESTONES (TARANIS LIFECYCLE TRACKER & CHECKLIST)              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E4D9C4] p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4D9C4] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1F3D2B] text-[#D9A441] rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1F3D2B]">
                {currentLang === 'ru'
                  ? 'Сезонные вехи и агрономический чек-лист'
                  : currentLang === 'en'
                  ? 'Season Milestones & Agronomic Checklist'
                  : "Mavsumiy bosqichlar va agrotexnik tekshiruvlar"}
              </h3>
              <p className="text-xs text-[#6C7C6F] font-semibold">
                {currentLang === 'ru'
                  ? `Вегетационный прогресс: ${seasonProgress.overallProgressPercent}% • День ${seasonProgress.daysElapsed} из ${seasonProgress.totalSeasonDays}`
                  : currentLang === 'en'
                  ? `Season progress: ${seasonProgress.overallProgressPercent}% • Day ${seasonProgress.daysElapsed} of ${seasonProgress.totalSeasonDays}`
                  : `Mavsumiy rivojlanish: ${seasonProgress.overallProgressPercent}% • ${seasonProgress.totalSeasonDays} kundan ${seasonProgress.daysElapsed}-kun`}
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#D9A441]/20 text-[#1F3D2B] border border-[#D9A441]/40 self-start sm:self-auto">
            {seasonProgress.currentMilestone.nameUz} ({seasonProgress.daysRemainingInMilestone} kun qoldi)
          </span>
        </div>

        {/* 4 Stepper Milestones Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {seasonProgress.allMilestones.map((ms, idx) => {
            const isDone = idx < seasonProgress.currentMilestoneIndex;
            const isCurrent = idx === seasonProgress.currentMilestoneIndex;

            return (
              <div
                key={ms.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-[#1F3D2B] text-white border-[#1F3D2B] shadow-md ring-2 ring-[#D9A441]/50'
                    : isDone
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-[#FAF7F0] border-[#E4D9C4] text-[#6C7C6F]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="flex items-center gap-1.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-4 h-4 rounded-full bg-[#D9A441] text-[#1F3D2B] text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-[#E4D9C4] text-[#6C7C6F] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                    )}
                    <span>{idx + 1}-bosqich</span>
                  </span>
                  <span className={`text-[10px] font-semibold ${isCurrent ? 'text-[#D9A441]' : ''}`}>
                    {ms.startDay}–{ms.endDay} kun
                  </span>
                </div>

                <div className={`font-serif text-sm font-bold ${isCurrent ? 'text-[#FAF7F0]' : 'text-[#1F3D2B]'}`}>
                  {currentLang === 'ru' ? ms.nameRu : currentLang === 'en' ? ms.nameEn : ms.nameUz}
                </div>

                <p className={`text-[11px] mt-1 line-clamp-2 ${isCurrent ? 'text-emerald-100' : 'text-[#6C7C6F]'}`}>
                  {currentLang === 'ru' ? ms.shortDescRu : currentLang === 'en' ? ms.shortDescEn : ms.shortDescUz}
                </p>
              </div>
            );
          })}
        </div>

        {/* Current Milestone Checklist Tasks */}
        <div className="bg-[#FAF7F0] p-4 sm:p-5 rounded-2xl border border-[#E4D9C4] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-sm font-bold text-[#1F3D2B] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#D9A441]" />
              <span>{seasonProgress.currentMilestone.nameUz} — Agrotexnik vazifalar nazorati</span>
            </h4>
            <span className="text-[11px] font-bold text-[#6C7C6F]">
              {(currentLang === 'ru'
                ? seasonProgress.currentMilestone.checklistRu
                : currentLang === 'en'
                ? seasonProgress.currentMilestone.checklistEn
                : seasonProgress.currentMilestone.checklistUz
              ).filter((t) => completedTasks[t.id]).length} /{' '}
              {(currentLang === 'ru'
                ? seasonProgress.currentMilestone.checklistRu
                : currentLang === 'en'
                ? seasonProgress.currentMilestone.checklistEn
                : seasonProgress.currentMilestone.checklistUz
              ).length} bajarildi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(currentLang === 'ru'
              ? seasonProgress.currentMilestone.checklistRu
              : currentLang === 'en'
              ? seasonProgress.currentMilestone.checklistEn
              : seasonProgress.currentMilestone.checklistUz
            ).map((task) => {
              const isChecked = !!completedTasks[task.id];
              return (
                <button
                  type="button"
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-white border-[#E4D9C4] text-[#1F3D2B] hover:border-[#1F3D2B]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                      isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-[#6C7C6F] bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isChecked ? 'line-through opacity-70' : ''}`}>
                      {task.text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. AI SEASONAL SUMMARY REPORT (GEMINI 3.7 FLASH - AG ASSISTANT)           */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#1F3D2B] via-[#1B3626] to-[#12261A] text-white rounded-3xl p-6 sm:p-8 border border-[#2D543C] shadow-lg space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D9A441]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#D9A441] text-[#1F3D2B] rounded-2xl shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D9A441]/20 text-[#D9A441] px-2.5 py-0.5 rounded-full border border-[#D9A441]/30">
                  Ekin Yordamchisi • Gemini AI
                </span>
                {aiSummaryData?.confidence_score && (
                  <span className="text-[10px] font-bold text-emerald-300">
                    {Math.round(aiSummaryData.confidence_score * 100)}% ishonchlilik
                  </span>
                )}
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F0] mt-1">
                {currentLang === 'ru'
                  ? 'Сезонный AI-отчёт агрономического помощника'
                  : currentLang === 'en'
                  ? 'AI Seasonal Agronomic Intelligence Summary'
                  : "Mavsumiy AI hisoboti va agronomik xulosa"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={generateAiSummary}
              disabled={loadingAiSummary}
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loadingAiSummary ? 'animate-spin' : ''}`} />}
            >
              {loadingAiSummary
                ? currentLang === 'ru' ? 'Генерация...' : currentLang === 'en' ? 'Generating...' : 'Hisoblanmoqda...'
                : currentLang === 'ru' ? 'Обновить AI' : currentLang === 'en' ? 'Regenerate AI' : 'Qayta hisoblash'}
            </Button>

            {aiSummaryData && (
              <>
                <button
                  onClick={handleToggleSpeak}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    speaking ? 'bg-[#D9A441] text-[#1F3D2B] border-[#D9A441]' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                  title="Ovozli eshitish"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopyAiReport}
                  className="p-2 rounded-xl border bg-white/10 text-white border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                  title="Nusxa olish"
                >
                  {copiedAi ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* AI Content Presentation */}
        {loadingAiSummary ? (
          <div className="py-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#D9A441] mx-auto" />
            <p className="font-serif text-lg font-bold text-[#FAF7F0]">
              {currentLang === 'ru'
                ? 'Gemini 3.7 Flash анализирует спутниковые данные и погоду...'
                : currentLang === 'en'
                ? 'Gemini 3.7 Flash is analyzing satellite NDVI and weather models...'
                : "Gemini 3.7 Flash sun'iy yo'ldosh va meteo ma'lumotlarini tahlil qilmoqda..."}
            </p>
            <p className="text-xs text-emerald-200">
              {currentLang === 'ru'
                ? 'Формируются персонализированные рекомендации на 7 дней'
                : currentLang === 'en'
                ? 'Synthesizing actionable 7-day field advisory'
                : "7 kunlik amaliy agrotexnik tavsiyalar tayyorlanmoqda"}
            </p>
          </div>
        ) : aiSummaryData ? (
          <div className="space-y-5">
            {/* Executive Summary Quote */}
            <div className="bg-white/10 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-white/15">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9A441] block mb-1">
                1. Bosh Xulosa (Executive Summary)
              </span>
              <p className="font-serif text-base sm:text-lg text-[#FAF7F0] leading-relaxed">
                «{aiSummaryData.executive_summary}»
              </p>
            </div>

            {/* 2-Column Telemetry Analysis & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  2. Sun&apos;iy Yo&apos;ldosh va Namlik Dinamikasi
                </span>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  {aiSummaryData.what_happened}
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  3. Xavf Omili va E&apos;tibor Talab Joylar
                </span>
                <p className="text-xs text-amber-100 leading-relaxed">
                  {aiSummaryData.concerns_and_risks}
                </p>
              </div>
            </div>

            {/* 7-Day Actionable Recommendations */}
            <div className="bg-white/10 p-5 rounded-2xl border border-white/15 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9A441] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                4. Yaqin 7 kun uchun ustuvor agrotexnik qadamlar
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {aiSummaryData.recommended_actions?.map((act, idx) => (
                  <div key={idx} className="bg-black/20 p-3 rounded-xl border border-white/10 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#D9A441] text-[#1F3D2B] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-[#FAF7F0] leading-relaxed">{act}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-xs text-emerald-200">Hisobotni shakllantirish uchun yuqoridagi tugmani bosing.</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 8. AGRONOMIST ADVISORY NOTES & ACCESS INVITE (COLLABORATION)             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E4D9C4] p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4D9C4] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1F3D2B] text-[#D9A441] rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1F3D2B]">
                {currentLang === 'ru'
                  ? 'Агрономические предписания и экспертная поддержка'
                  : currentLang === 'en'
                  ? 'Agronomist Action Orders & Advisory'
                  : "Agronom xulosalari va rasmiy ko'rsatmalar"}
              </h3>
              <p className="text-xs text-[#6C7C6F] font-semibold">
                {currentLang === 'ru'
                  ? 'Прямые указания от прикрепленного агронома по результатам осмотра'
                  : currentLang === 'en'
                  ? 'Direct action orders from your certified field agronomist'
                  : "Biriktirilgan agronom tomonidan berilgan amaliy tavsiyalar"}
              </p>
            </div>
          </div>

          {/* Invite Agronomist Button */}
          <Button
            onClick={() => setInviteModalOpen(true)}
            variant="secondary"
            size="sm"
            leftIcon={<KeyRound className="w-4 h-4 text-[#D9A441]" />}
          >
            {currentLang === 'ru' ? 'Пригласить агронома' : currentLang === 'en' ? 'Invite Agronomist' : 'Agronomni taklif qilish'}
          </Button>
        </div>

        {/* List of Advisory Notes */}
        {fieldAdvisorNotes.length === 0 ? (
          <div className="bg-[#FAF7F0] rounded-2xl p-6 text-center border border-[#E4D9C4] space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#1F3D2B] mx-auto opacity-50" />
            <p className="text-xs font-bold text-[#1F3D2B]">
              {currentLang === 'ru'
                ? 'Пока нет персональных предписаний от агронома'
                : currentLang === 'en'
                ? 'No advisor notes issued for this field yet'
                : "Hozircha ushbu maydon uchun agronom ko'rsatmalari mavjud emas"}
            </p>
            <p className="text-[11px] text-[#6C7C6F] max-w-md mx-auto">
              {currentLang === 'ru'
                ? 'Вы можете поделиться своим инвайт-кодом с районным агрономом для получения экспертных рекомендаций.'
                : currentLang === 'en'
                ? 'Share your unique invite code with your regional advisor to receive professional guidance.'
                : "Tuman agronomiga o'z taklif kodingizni taqdim etib, ekspert ko'rsatmalarini olishingiz mumkin."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fieldAdvisorNotes.map((note) => (
              <div
                key={note.id}
                className="bg-[#FAF7F0] rounded-2xl p-5 border border-[#E4D9C4] space-y-3"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        note.urgency === 'critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : note.urgency === 'high'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {note.urgency === 'critical' ? '🔴 Shoshilinch' : note.urgency === 'high' ? '🟡 Muhim' : '🟢 Rejali'}
                    </span>
                    <span className="text-xs font-bold text-[#1F3D2B]">{note.agronomist_name}</span>
                    <span className="text-[10px] text-[#6C7C6F]">({note.agronomist_phone})</span>
                  </div>

                  <span className="text-[10px] text-[#6C7C6F] font-mono">
                    {new Date(note.created_at).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'uz-UZ', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h4 className="font-serif text-base font-bold text-[#1F3D2B]">{note.title}</h4>
                <p className="text-xs text-[#4A5A4D] leading-relaxed">{note.note}</p>

                {note.recommendations && note.recommendations.length > 0 && (
                  <div className="pt-2 border-t border-[#E4D9C4] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F3D2B]">
                      Agrotexnik topshiriqlar:
                    </span>
                    <ul className="space-y-1">
                      {note.recommendations.map((rec, rIdx) => (
                        <li key={rIdx} className="text-xs text-[#2D4A3E] flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal for Farmer */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E4D9C4] shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="font-serif text-2xl font-bold text-[#1F3D2B] mb-1">
              {currentLang === 'ru' ? 'Инвайт-код для агронома' : currentLang === 'en' ? 'Farmer Invite Code' : 'Agronom uchun taklif kodi'}
            </h3>
            <p className="text-xs text-[#6C7C6F] mb-6">
              {currentLang === 'ru'
                ? 'Передайте этот 6-значный код вашему агроному, чтобы он подключил ваши поля к своему мониторингу.'
                : currentLang === 'en'
                ? 'Share this 6-digit code with your agronomist to link your fields to their monitoring console.'
                : "Ushbu 6 xonali kodni o'z agronomingizga taqdim eting, shunda u maydonlaringizni o'z nazoratiga qo'sha oladi."}
            </p>

            <div className="bg-[#FAF7F0] p-4 rounded-2xl border-2 border-dashed border-[#D9A441] text-center mb-6">
              <span className="text-[10px] uppercase font-bold text-[#6C7C6F] block mb-1">Sizning kodingiz</span>
              <span className="font-mono text-3xl font-black text-[#1F3D2B] tracking-widest">EKIN-7842</span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 justify-center"
                onClick={() => setInviteModalOpen(false)}
              >
                {currentLang === 'ru' ? 'Закрыть' : currentLang === 'en' ? 'Close' : 'Yopish'}
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 justify-center"
                onClick={() => {
                  navigator.clipboard.writeText('EKIN-7842');
                  alert("Kod nusxalandi!");
                  setInviteModalOpen(false);
                }}
                leftIcon={<Copy className="w-4 h-4 text-[#D9A441]" />}
              >
                {currentLang === 'ru' ? 'Копировать' : currentLang === 'en' ? 'Copy Code' : 'Nusxa olish'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
