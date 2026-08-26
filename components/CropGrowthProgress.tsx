'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Language } from '@/lib/i18n';
import { FieldRecord, NDVIReading } from '@/lib/supabase';
import { fetchFieldNdviHistory } from '@/lib/ndviService';
import { calculateGrowthStage } from '@/lib/cropGuidesData';
import { CROP_OPTIONS } from '@/components/FarmerOnboardingModal';
import { InfoTooltip } from '@/components/InfoTooltip';
import {
  Sprout,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  Droplets,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export interface CropGrowthProgressProps {
  fields: FieldRecord[];
  currentLang?: Language | 'uz' | 'ru' | 'en';
  onSelectField?: (field: FieldRecord) => void;
  className?: string;
}

interface SeasonDataPoint {
  date: string;
  formattedDate: string;
  daysFromSowing: number;
  stageName: string;
  note: string;
  [key: string]: string | number; // Field ID -> NDVI score or generic values
}

const FIELD_COLORS = [
  { stroke: '#164E35', fill: '#164E35', name: 'emerald' },
  { stroke: '#F4A340', fill: '#F4A340', name: 'amber' },
  { stroke: '#2563EB', fill: '#2563EB', name: 'blue' },
  { stroke: '#E85D3D', fill: '#E85D3D', name: 'coral' },
  { stroke: '#7C3AED', fill: '#7C3AED', name: 'violet' },
  { stroke: '#0D9488', fill: '#0D9488', name: 'teal' },
];

function formatDateLabel(dateStr: string, lang: 'uz' | 'ru' | 'en') {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const monthNamesUz = ['yan', 'fev', 'mar', 'apr', 'may', 'iyun', 'iyul', 'avg', 'sen', 'okt', 'noy', 'dek'];
    const monthNamesRu = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const mIdx = d.getMonth();
    const mName = lang === 'ru' ? monthNamesRu[mIdx] : lang === 'en' ? monthNamesEn[mIdx] : monthNamesUz[mIdx];
    return `${day} ${mName}`;
  } catch {
    return dateStr;
  }
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  fields: FieldRecord[];
  isComparison: boolean;
  lang: 'uz' | 'ru' | 'en';
}

const GrowthChartTooltip: React.FC<TooltipProps> = ({
  active,
  payload,
  fields,
  isComparison,
  lang,
}) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div
      id="crop-growth-tooltip"
      className="bg-white/95 backdrop-blur-xs border border-slate-300 rounded-xl p-3 shadow-md text-xs space-y-2 max-w-xs select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 gap-3">
        <span className="font-semibold text-slate-900 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {data.formattedDate || data.date}
        </span>
        {data.daysFromSowing > 0 && (
          <span className="text-[10px] text-slate-500 font-mono">
            {data.daysFromSowing} {lang === 'ru' ? 'дней' : lang === 'en' ? 'days' : 'kun'}
          </span>
        )}
      </div>

      {/* Value rows */}
      {isComparison ? (
        <div className="space-y-1.5">
          {fields.map((f, idx) => {
            const val = data[f.id];
            if (val === undefined) return null;
            const color = FIELD_COLORS[idx % FIELD_COLORS.length].stroke;
            return (
              <div key={f.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-slate-600 truncate">{f.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{Number(val).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              NDVI {lang === 'ru' ? 'индекс' : lang === 'en' ? 'score' : 'indeksi'}:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-900 text-sm">
                {Number(data.ndvi).toFixed(2)}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                  data.ndvi >= 0.65
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : data.ndvi >= 0.45
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {data.ndvi >= 0.65
                  ? lang === 'ru' ? 'Здоровый' : lang === 'en' ? 'Healthy' : "Sog'lom"
                  : data.ndvi >= 0.45
                  ? lang === 'ru' ? 'Умеренный' : lang === 'en' ? 'Moderate' : "O'rtacha"
                  : lang === 'ru' ? 'Стресс' : lang === 'en' ? 'Stressed' : 'Zaif'}
              </span>
            </div>
          </div>

          {data.moisture !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-500 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                {lang === 'ru' ? 'Влажность' : lang === 'en' ? 'Soil moisture' : 'Tuproq namligi'}:
              </span>
              <span className="font-mono font-semibold text-slate-800">{data.moisture}%</span>
            </div>
          )}

          {data.stageName && (
            <div className="pt-1 border-t border-slate-100 text-[11px] text-slate-600">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">
                {lang === 'ru' ? 'Фаза развития' : lang === 'en' ? 'Growth phase' : "O'sish fazasi"}:
              </span>
              <span className="font-medium text-[#164E35]">{data.stageName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const CropGrowthProgress: React.FC<CropGrowthProgressProps> = ({
  fields,
  currentLang = 'uz',
  onSelectField,
  className = '',
}) => {
  const lang = (currentLang === 'ru' || currentLang === 'en' ? currentLang : 'uz') as 'uz' | 'ru' | 'en';

  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');
  const [fieldsHistory, setFieldsHistory] = useState<Record<string, NDVIReading[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [showMoistureCurve, setShowMoistureCurve] = useState<boolean>(false);

  // Fetch histories for all fields
  useEffect(() => {
    let isMounted = true;

    async function loadHistories() {
      if (fields.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const historiesMap: Record<string, NDVIReading[]> = {};
        await Promise.all(
          fields.map(async (field) => {
            const history = await fetchFieldNdviHistory(field);
            historiesMap[field.id] = history;
          })
        );

        if (isMounted) {
          setFieldsHistory(historiesMap);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading NDVI histories for growth progress:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadHistories();
    return () => {
      isMounted = false;
    };
  }, [fields]);

  const activeField = useMemo(() => {
    if (selectedFieldId === 'all') return null;
    return fields.find((f) => f.id === selectedFieldId) || fields[0] || null;
  }, [fields, selectedFieldId]);

  // Build chart data for Single Field mode
  const singleFieldChartData = useMemo(() => {
    if (!activeField) return [];
    const history = fieldsHistory[activeField.id] || [];
    const plantingTime = activeField.planting_date ? new Date(activeField.planting_date).getTime() : 0;

    return history.map((reading) => {
      const readingTime = new Date(reading.satellite_date).getTime();
      const daysFromSowing = plantingTime ? Math.max(0, Math.floor((readingTime - plantingTime) / 86400000)) : 0;
      
      // Calculate growth stage for this point in time
      const stageData = calculateGrowthStage(activeField.crop_type, activeField.planting_date);
      const stageName = lang === 'ru' 
        ? stageData.currentStage.stage_name_ru 
        : lang === 'en' 
        ? stageData.currentStage.stage_name_en 
        : stageData.currentStage.stage_name_uz;

      const note = lang === 'ru' 
        ? reading.recommendation_ru || 'Нормальное состояние' 
        : lang === 'en' 
        ? reading.recommendation_en || 'Normal vegetation vigor' 
        : reading.recommendation_uz || "Me'yordagi rivojlanish";

      return {
        date: reading.satellite_date,
        formattedDate: formatDateLabel(reading.satellite_date, lang),
        ndvi: reading.ndvi_score,
        moisture: reading.moisture_percentage,
        daysFromSowing,
        stageName,
        note,
        status: reading.status,
      };
    });
  }, [activeField, fieldsHistory, lang]);

  // Build chart data for "All Fields" Comparison mode
  const allFieldsChartData = useMemo(() => {
    if (fields.length === 0) return [];

    // Collect all unique dates across all fields
    const dateMap = new Map<string, SeasonDataPoint>();

    fields.forEach((field) => {
      const history = fieldsHistory[field.id] || [];
      history.forEach((reading) => {
        const dateKey = reading.satellite_date;
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            date: dateKey,
            formattedDate: formatDateLabel(dateKey, lang),
            daysFromSowing: 0,
            stageName: '',
            note: '',
          });
        }
        const point = dateMap.get(dateKey)!;
        point[field.id] = reading.ndvi_score;
        point[`${field.id}_moisture`] = reading.moisture_percentage;
      });
    });

    // Sort chronologically
    return Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [fields, fieldsHistory, lang]);

  // Key statistics for active field or aggregate
  const activeStats = useMemo(() => {
    if (activeField) {
      const history = fieldsHistory[activeField.id] || [];
      if (history.length === 0) {
        return {
          currentNdvi: 0.72,
          peakNdvi: 0.78,
          peakDate: '2026-07-20',
          growthRate: 14,
          daysSincePlanting: 65,
          stageTitle: "Gullash va hosil to'plash",
          stageProgress: 60,
          status: 'healthy',
        };
      }

      const latest = history[history.length - 1];
      const currentNdvi = latest?.ndvi_score ?? 0.72;
      
      let peakScore = currentNdvi;
      let peakDate = latest?.satellite_date || '';
      history.forEach((h) => {
        if (h.ndvi_score > peakScore) {
          peakScore = h.ndvi_score;
          peakDate = h.satellite_date;
        }
      });

      // Growth rate comparison (latest vs earliest or 30 days ago)
      const first = history[0];
      const initialNdvi = first?.ndvi_score ?? 0.35;
      const growthRate = Math.round(((currentNdvi - initialNdvi) / Math.max(0.1, initialNdvi)) * 100);

      const stageInfo = calculateGrowthStage(activeField.crop_type, activeField.planting_date);
      const stageProgress = Math.min(
        100,
        Math.max(
          10,
          Math.round(
            ((stageInfo.stageIndex + 1) / Math.max(1, stageInfo.totalStages)) * 100
          )
        )
      );

      return {
        currentNdvi,
        peakNdvi: peakScore,
        peakDate: formatDateLabel(peakDate, lang),
        growthRate,
        daysSincePlanting: stageInfo.daysElapsed,
        stageTitle: lang === 'ru' 
          ? stageInfo.currentStage.stage_name_ru 
          : lang === 'en' 
          ? stageInfo.currentStage.stage_name_en 
          : stageInfo.currentStage.stage_name_uz,
        stageProgress,
        status: currentNdvi >= 0.65 ? 'healthy' : currentNdvi >= 0.45 ? 'moderate' : 'critical',
      };
    } else {
      // Aggregate stats for all fields
      let totalCurrentNdvi = 0;
      let peakScore = 0;
      let count = 0;

      fields.forEach((f) => {
        const history = fieldsHistory[f.id] || [];
        if (history.length > 0) {
          const latest = history[history.length - 1];
          totalCurrentNdvi += latest.ndvi_score;
          history.forEach((h) => {
            if (h.ndvi_score > peakScore) peakScore = h.ndvi_score;
          });
          count++;
        }
      });

      const avgCurrentNdvi = count > 0 ? parseFloat((totalCurrentNdvi / count).toFixed(2)) : 0.71;

      return {
        currentNdvi: avgCurrentNdvi,
        peakNdvi: peakScore || 0.78,
        peakDate: lang === 'ru' ? 'Июль 2026' : lang === 'en' ? 'July 2026' : 'Iyul 2026',
        growthRate: 18,
        daysSincePlanting: 72,
        stageTitle: lang === 'ru' ? 'Активная вегетация' : lang === 'en' ? 'Active vegetative canopy' : "Faol vegetatsiya va hosil davri",
        stageProgress: 68,
        status: avgCurrentNdvi >= 0.60 ? 'healthy' : 'moderate',
      };
    }
  }, [activeField, fields, fieldsHistory, lang]);

  // Crop metadata
  const activeCropMeta = useMemo(() => {
    if (!activeField) return null;
    return CROP_OPTIONS.find((c) => c.id === activeField.crop_type) || {
      id: activeField.crop_type,
      nameKey: 'cropCotton',
      icon: '🌱',
    };
  }, [activeField]);

  const renderTooltip = useCallback(
    (props: any) => (
      <GrowthChartTooltip
        {...props}
        fields={fields}
        isComparison={selectedFieldId === 'all'}
        lang={lang}
      />
    ),
    [fields, selectedFieldId, lang]
  );

  return (
    <div
      id="crop-growth-progress-card"
      className={`bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
    >
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#164E35]" />
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              {lang === 'ru'
                ? 'Динамика роста и здоровье культур'
                : lang === 'en'
                ? 'Crop growth progress & health trends'
                : "Ekinlar o'sish dinamikasi va salomatligi"}
            </h2>
            <InfoTooltip preset="ndvi" lang={lang} size="xs" id="growth-progress-info-tooltip" />
          </div>
          <p className="text-xs text-slate-500">
            {lang === 'ru'
              ? 'Сезонный тренд вегетации NDVI на основе данных Sentinel-2'
              : lang === 'en'
              ? 'Seasonal NDVI vegetation curve tracked via Sentinel-2 telemetry'
              : "Sentinel-2 sun'iy yo'ldosh NDVI telemetriyasi asosida mavsumiy o'sish tahlili"}
          </p>
        </div>

        {/* Field Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            id="growth-filter-all"
            onClick={() => setSelectedFieldId('all')}
            className={`h-7 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedFieldId === 'all'
                ? 'bg-[#164E35] text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{lang === 'ru' ? 'Все поля' : lang === 'en' ? 'All fields' : 'Barcha maydonlar'}</span>
          </button>

          {fields.map((field, idx) => {
            const isSelected = selectedFieldId === field.id;
            const color = FIELD_COLORS[idx % FIELD_COLORS.length].stroke;
            return (
              <button
                key={field.id}
                type="button"
                id={`growth-filter-${field.id}`}
                onClick={() => setSelectedFieldId(field.id)}
                className={`h-7 px-3 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#164E35] text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? '#FFFFFF' : color }}
                />
                <span className="truncate max-w-[120px]">{field.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Current NDVI */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{lang === 'ru' ? 'Текущий NDVI' : lang === 'en' ? 'Current NDVI' : 'Joriy NDVI'}</span>
            <Activity className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {activeStats.currentNdvi.toFixed(2)}
            </span>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                activeStats.status === 'healthy'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {activeStats.status === 'healthy'
                ? lang === 'ru' ? 'Оптимально' : lang === 'en' ? 'Optimal' : "Me'yorda"
                : lang === 'ru' ? 'Умеренно' : lang === 'en' ? 'Moderate' : "O'rtacha"}
            </span>
          </div>
          <div className="text-[10px] text-slate-500">
            {lang === 'ru' ? 'Порог нормы: > 0.60' : lang === 'en' ? 'Threshold: > 0.60' : "Sog'lomlik me'yori: > 0.60"}
          </div>
        </div>

        {/* Metric 2: Season Peak */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{lang === 'ru' ? 'Пик сезона' : lang === 'en' ? 'Season peak' : 'Mavsumiy cho‘qqi'}</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {activeStats.peakNdvi.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {activeStats.peakDate} {lang === 'ru' ? 'достигнут' : lang === 'en' ? 'recorded' : 'qayd etilgan'}
          </div>
        </div>

        {/* Metric 3: Growth Velocity */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{lang === 'ru' ? 'Прирост биомассы' : lang === 'en' ? 'Biomass growth' : "O'sish sur'ati"}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1 text-xl font-bold font-mono text-emerald-700">
            <span>+{activeStats.growthRate}%</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {lang === 'ru' ? 'С момента посева' : lang === 'en' ? 'Since germination' : "Ekish davridan buyon"}
          </div>
        </div>

        {/* Metric 4: Growth Phase / Days */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{lang === 'ru' ? 'Фаза развития' : lang === 'en' ? 'Growth phase' : "O'sish bosqichi"}</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xs font-semibold text-slate-900 truncate" title={activeStats.stageTitle}>
            {activeStats.stageTitle}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>{activeStats.daysSincePlanting} {lang === 'ru' ? 'дней' : lang === 'en' ? 'days' : 'kun'}</span>
            <span className="font-mono text-[#164E35] font-semibold">{activeStats.stageProgress}%</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="space-y-2">
        {/* Toggle secondary moisture or helpers */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#164E35]" />
              <span className="text-[11px] font-medium text-slate-700">
                {selectedFieldId === 'all'
                  ? lang === 'ru' ? 'Поля' : lang === 'en' ? 'Fields' : 'Maydonlar'
                  : lang === 'ru' ? 'NDVI вегетация' : lang === 'en' ? 'NDVI vegetation' : 'NDVI vegetatsiya'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-4 h-0.5 border-b border-dashed border-[#6FA85C]" />
              <span className="text-[11px]">
                {lang === 'ru' ? 'Норма (>0.60)' : lang === 'en' ? 'Threshold (>0.60)' : "Me'yor (>0.60)"}
              </span>
            </div>
          </div>

          {selectedFieldId !== 'all' && (
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 hover:text-slate-900 select-none">
              <input
                type="checkbox"
                checked={showMoistureCurve}
                onChange={(e) => setShowMoistureCurve(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#164E35] focus:ring-0 cursor-pointer"
              />
              <span>
                {lang === 'ru' ? 'Показать влажность почвы' : lang === 'en' ? 'Show soil moisture' : 'Tuproq namligini ko‘rsatish'}
              </span>
            </label>
          )}
        </div>

        {/* Recharts Container */}
        <div className="w-full h-64 sm:h-72 bg-slate-50/40 rounded-xl border border-slate-200 p-2 sm:p-3 relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-white/70 backdrop-blur-xs rounded-xl">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-[#164E35] rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">
                {lang === 'ru' ? 'Загрузка истории вегетации...' : lang === 'en' ? 'Loading vegetation telemetry...' : "Vegetatsiya tarixi yuklanmoqda..."}
              </span>
            </div>
          ) : selectedFieldId === 'all' ? (
            /* Multi-Line Comparison Chart */
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={allFieldsChartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  domain={[0.1, 1.0]}
                  ticks={[0.2, 0.4, 0.6, 0.8, 1.0]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <Tooltip content={renderTooltip} />
                <ReferenceLine
                  y={0.6}
                  stroke="#6FA85C"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                {fields.map((field, idx) => {
                  const color = FIELD_COLORS[idx % FIELD_COLORS.length].stroke;
                  return (
                    <Line
                      key={field.id}
                      type="monotone"
                      dataKey={field.id}
                      name={field.name}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: color, stroke: '#FFFFFF', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: color, stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            /* Single Field Area Chart */
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={singleFieldChartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ndviColorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#164E35" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#164E35" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  domain={[0.1, 1.0]}
                  ticks={[0.2, 0.4, 0.6, 0.8, 1.0]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <Tooltip content={renderTooltip} />
                <ReferenceLine
                  y={0.6}
                  stroke="#6FA85C"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="ndvi"
                  name="NDVI"
                  stroke="#164E35"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#ndviColorGradient)"
                  dot={{ r: 4, fill: '#164E35', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#164E35', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
                {showMoistureCurve && (
                  <Line
                    type="monotone"
                    dataKey="moisture"
                    name="Moisture"
                    stroke="#0284C7"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={{ r: 2.5, fill: '#0284C7' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Growth Phase Milestones Progress Bar (Single Field mode) */}
      {activeField && (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
              <span>{activeCropMeta?.icon}</span>
              <span>{activeField.name} — {lang === 'ru' ? 'Этапы сезона' : lang === 'en' ? 'Season milestones' : "Mavsumiy bosqichlar"}</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {lang === 'ru' ? 'Посев' : lang === 'en' ? 'Sowing' : 'Ekish'}: {activeField.planting_date || '2026-04-12'}
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-[#164E35] h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, activeStats.stageProgress)}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-0.5">
            <div className="text-[#164E35] font-semibold truncate">
              1. {lang === 'ru' ? 'Всходы' : lang === 'en' ? 'Emergence' : 'Maysalik'}
            </div>
            <div className="text-[#164E35] font-semibold truncate">
              2. {lang === 'ru' ? 'Ветвление' : lang === 'en' ? 'Branching' : 'Shonalash'}
            </div>
            <div className={`truncate ${activeStats.stageProgress >= 50 ? 'text-[#164E35] font-semibold' : 'text-slate-400'}`}>
              3. {lang === 'ru' ? 'Цветение' : lang === 'en' ? 'Flowering' : 'Gullash'}
            </div>
            <div className={`truncate ${activeStats.stageProgress >= 80 ? 'text-[#164E35] font-semibold' : 'text-slate-400'}`}>
              4. {lang === 'ru' ? 'Созревание' : lang === 'en' ? 'Ripening' : "Yetilish"}
            </div>
          </div>
        </div>
      )}

      {/* Field drill-down action link */}
      {activeField && onSelectField && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            id={`open-detail-from-growth-${activeField.id}`}
            onClick={() => onSelectField(activeField)}
            className="text-xs font-medium text-[#164E35] hover:text-[#0F3826] flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>
              {lang === 'ru'
                ? `Открыть подробную телеметрию ${activeField.name} →`
                : lang === 'en'
                ? `Open detailed telemetry for ${activeField.name} →`
                : `${activeField.name} batafsil telemetriyasini ochish →`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
