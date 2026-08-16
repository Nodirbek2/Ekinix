'use client';

import React, { useEffect, useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FieldRecord } from '@/lib/supabase';
import { fetchAndStoreFieldNdvi, NdviResult } from '@/lib/ndviService';
import {
  CloudRain, Sun, Cloud, CloudSun, CloudDrizzle, Droplets, Thermometer, ShieldAlert,
  CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Minus, CloudOff,
  Satellite, RefreshCw
} from 'lucide-react';

interface FieldWeatherCardProps {
  field: FieldRecord;
  currentLang: Language;
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

// Weather code mapping to friendly icon & description
function getWeatherMeta(code: number) {
  if (code === 0) return { icon: <Sun className="w-5 h-5 text-amber-500" />, labelUz: "Aftobli / Ochiq", labelRu: "Ясно", labelEn: "Clear / Sunny" };
  if (code >= 1 && code <= 3) return { icon: <CloudSun className="w-5 h-5 text-amber-400" />, labelUz: "Biroq bulutli", labelRu: "Облачно", labelEn: "Partly Cloudy" };
  if (code >= 45 && code <= 48) return { icon: <Cloud className="w-5 h-5 text-slate-400" />, labelUz: "Tumanli", labelRu: "Туман", labelEn: "Foggy" };
  if (code >= 51 && code <= 67) return { icon: <CloudDrizzle className="w-5 h-5 text-sky-500" />, labelUz: "Mayin yomg'ir", labelRu: "Морось", labelEn: "Light Drizzle" };
  if (code >= 80 && code <= 82) return { icon: <CloudRain className="w-5 h-5 text-blue-600" />, labelUz: "Jala / Yomg'ir", labelRu: "Дождь", labelEn: "Showers" };
  return { icon: <Cloud className="w-5 h-5 text-emerald-600" />, labelUz: "Bulutli", labelRu: "Пасмурно", labelEn: "Overcast" };
}

// Map region name to fallback coordinates in Uzbekistan
const REGION_COORDS_FALLBACK: Record<string, [number, number]> = {
  "Toshkent viloyati": [41.2995, 69.2401],
  "Toshkent shahri": [41.2995, 69.2401],
  "Samarqand viloyati": [39.6542, 66.9597],
  "Farg'ona viloyati": [40.3842, 71.7843],
  "Buxoro viloyati": [39.7747, 64.4286],
  "Namangan viloyati": [40.9983, 71.6726],
  "Andijon viloyati": [40.7821, 72.3442],
  "Qashqadaryo viloyati": [38.8605, 65.7891],
  "Surxondaryo viloyati": [37.2242, 67.2783],
  "Xorazm viloyati": [41.5503, 60.6317],
  "Navoiy viloyati": [40.1031, 65.3688],
  "Sirdaryo viloyati": [40.4897, 68.7842],
  "Qoraqalpog'iston Respublikasi": [43.7683, 59.0214],
};

export function getFieldCenterCoordinates(field: FieldRecord): [number, number] {
  if (field.coordinates && field.coordinates.length > 0) {
    let latSum = 0;
    let lonSum = 0;
    field.coordinates.forEach(([lat, lon]) => {
      latSum += lat;
      lonSum += lon;
    });
    return [
      parseFloat((latSum / field.coordinates.length).toFixed(4)),
      parseFloat((lonSum / field.coordinates.length).toFixed(4)),
    ];
  }
  return REGION_COORDS_FALLBACK[field.region] || [41.2995, 69.2401];
}

export const FieldWeatherCard: React.FC<FieldWeatherCardProps> = ({ field, currentLang }) => {
  const t = translations[currentLang];
  const [daily, setDaily] = useState<DailyWeather[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Sentinel Hub NDVI Telemetry State
  const [ndviData, setNdviData] = useState<NdviResult | null>(null);
  const [loadingNdvi, setLoadingNdvi] = useState(true);
  const [simulateCloudMode, setSimulateCloudMode] = useState(false);

  // Field center lat & lon
  const [lat, lon] = getFieldCenterCoordinates(field);

  // Fetch Sentinel Hub NDVI telemetry
  useEffect(() => {
    let isMounted = true;

    async function loadNdvi() {
      try {
        const result = await fetchAndStoreFieldNdvi(field, simulateCloudMode);
        if (isMounted) {
          setNdviData(result);
          setLoadingNdvi(false);
        }
      } catch (err) {
        console.warn("NDVI fetch error:", err);
        if (isMounted) {
          setLoadingNdvi(false);
        }
      }
    }

    loadNdvi();

    return () => {
      isMounted = false;
    };
  }, [field, simulateCloudMode]);

  // Fetch Open-Meteo Weather
  useEffect(() => {
    let isMounted = true;

    async function fetchOpenMeteoWeather() {
      setLoadingWeather(true);

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Open-Meteo response failed");
        const data = await res.json();

        if (data.daily && data.daily.time) {
          const times: string[] = data.daily.time;
          const codeArr: number[] = data.daily.weathercode || [];
          const maxArr: number[] = data.daily.temperature_2m_max || [];
          const minArr: number[] = data.daily.temperature_2m_min || [];
          const probArr: number[] = data.daily.precipitation_probability_max || [];
          const sumArr: number[] = data.daily.precipitation_sum || [];

          const list: DailyWeather[] = times.slice(0, 6).map((timeStr, idx) => {
            const dateObj = new Date(timeStr);
            const dayNamesUz = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
            const dayNamesRu = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
            const dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
              tempMax: Math.round(maxArr[idx] ?? 30),
              tempMin: Math.round(minArr[idx] ?? 18),
              rainProb: probArr[idx] ?? 15,
              rainSum: parseFloat((sumArr[idx] ?? 0).toFixed(1)),
              weatherCode: codeArr[idx] ?? 0,
            };
          });

          if (isMounted) {
            setDaily(list);
            setLoadingWeather(false);
          }
        }
      } catch (err) {
        console.warn("Open-Meteo fetch notice:", err);
        if (isMounted) {
          const mockList: DailyWeather[] = [
            { date: '2026-08-16', dayName: t.today, tempMax: 34, tempMin: 21, rainProb: 15, rainSum: 0, weatherCode: 0 },
            { date: '2026-08-17', dayName: 'Ertaga', tempMax: 33, tempMin: 20, rainProb: 65, rainSum: 8.5, weatherCode: 80 },
            { date: '2026-08-18', dayName: 'Indin', tempMax: 29, tempMin: 18, rainProb: 40, rainSum: 2.1, weatherCode: 61 },
            { date: '2026-08-19', dayName: 'Pay', tempMax: 31, tempMin: 19, rainProb: 10, rainSum: 0, weatherCode: 1 },
            { date: '2026-08-20', dayName: 'Jum', tempMax: 35, tempMin: 22, rainProb: 5, rainSum: 0, weatherCode: 0 },
            { date: '2026-08-21', dayName: 'Shan', tempMax: 36, tempMin: 23, rainProb: 0, rainSum: 0, weatherCode: 0 },
          ];
          setDaily(mockList);
          setLoadingWeather(false);
        }
      }
    }

    fetchOpenMeteoWeather();

    return () => {
      isMounted = false;
    };
  }, [lat, lon, currentLang, t.today]);

  // Rain probability in next 2 days
  const maxRainNext2Days = React.useMemo(() => {
    if (daily.length === 0) return 0;
    const day1 = daily[0]?.rainProb || 0;
    const day2 = daily[1]?.rainProb || 0;
    return Math.max(day1, day2);
  }, [daily]);

  const isRainHigh = maxRainNext2Days >= 60;

  // Render 3-Tier Health Badge
  const renderHealthBadge = () => {
    if (loadingNdvi) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F0] text-[#6C7C6F] border border-[#E4D9C4] animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D9A441]" />
          <span>Sentinel Hub...</span>
        </span>
      );
    }

    if (!ndviData || ndviData.isCloudy) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <CloudOff className="w-4 h-4 text-slate-500" />
          <span>Bulutli (Kuzatib bo&apos;lmadi)</span>
        </span>
      );
    }

    const { statusTier } = ndviData;

    if (statusTier === 'healthy') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-950 border-2 border-emerald-400 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{t.statusHealthy}</span>
        </span>
      );
    }

    if (statusTier === 'moderate') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-950 border-2 border-amber-400 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>{t.statusModerateStress}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-950 border-2 border-rose-400 shadow-xs">
        <ShieldAlert className="w-4 h-4 text-rose-600" />
        <span>{t.statusHighStress}</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E4D9C4] p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all space-y-5">
      
      {/* Field Title & Health Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4D9C4] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9A441]" />
            <h3 className="font-serif text-xl font-bold text-[#1F3D2B]">
              {field.name}
            </h3>
          </div>
          <p className="text-xs font-semibold text-[#6C7C6F] mt-1">
            📍 {field.region} &bull; {field.area_hectares} {t.hectaresUnit}
          </p>
        </div>

        {/* Health Status Indicator (3-Tier Real NDVI) */}
        <div className="self-start sm:self-auto flex items-center gap-2">
          {renderHealthBadge()}
        </div>
      </div>

      {/* Cloud Cover Graceful Fallback Banner */}
      {ndviData?.isCloudy && (
        <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 text-slate-700 rounded-xl">
              <CloudOff className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {currentLang === 'uz' ? ndviData.cloudMessageUz : currentLang === 'ru' ? ndviData.cloudMessageRu : ndviData.cloudMessageEn}
              </p>
              <p className="text-[11px] text-slate-500">
                Bulutlilik darajasi: {ndviData.cloudCoverPercent}% &bull; Sentinel-2 tasvir olish sanasi: {ndviData.satelliteDate}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSimulateCloudMode(false)}
            className="text-xs font-bold text-[#1F3D2B] hover:underline bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs shrink-0"
          >
            Qayta yuklash
          </button>
        </div>
      )}

      {/* Real Sentinel Hub NDVI Telemetry Bar & Historical Trend Indicator */}
      {ndviData && !ndviData.isCloudy && (
        <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E4D9C4] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1F3D2B] text-[#D9A441] rounded-xl shrink-0">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6C7C6F]">
                  {t.satelliteSource}
                </span>
                <span className="text-[10px] bg-[#1F3D2B] text-[#FAF7F0] px-2 py-0.5 rounded-md font-mono">
                  {ndviData.satelliteDate}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-serif font-bold text-[#1F3D2B]">
                  NDVI {ndviData.ndviScore}
                </span>
                <span className="text-xs font-semibold text-[#6C7C6F]">
                  (Tuproq namligi ~{ndviData.moisturePercentage}%)
                </span>
              </div>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {ndviData.trend ? (
              <div className="flex items-center gap-2">
                {ndviData.trend.direction === 'improving' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+{ndviData.trend.diff} ({t.trendImproving})</span>
                  </span>
                )}
                {ndviData.trend.direction === 'declining' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    <span>{ndviData.trend.diff} ({t.trendDeclining})</span>
                  </span>
                )}
                {ndviData.trend.direction === 'stable' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                    <Minus className="w-3.5 h-3.5 text-slate-600" />
                    <span>0.00 ({t.trendStable})</span>
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-[#6C7C6F] bg-[#F0E8D8] px-2.5 py-1 rounded-lg">
                Birinchi o&apos;lchov
              </span>
            )}

            <button
              onClick={() => setSimulateCloudMode(!simulateCloudMode)}
              className="text-[11px] font-bold text-[#6C7C6F] hover:text-[#1F3D2B] bg-white hover:bg-[#F0E8D8] px-2.5 py-1 rounded-lg border border-[#E4D9C4] transition-all"
              title="Bulutli holatni sinab ko'rish"
            >
              ☁️ Sinov
            </button>
          </div>
        </div>
      )}

      {/* Irrigation Recommendation Banner */}
      <div
        className={`p-4 rounded-2xl border-2 shadow-xs transition-all flex items-start gap-3.5 ${
          isRainHigh
            ? 'bg-sky-50 border-sky-300 text-sky-950'
            : 'bg-[#FAF7F0] border-[#D9A441] text-[#1F3D2B]'
        }`}
      >
        <div className={`p-2.5 rounded-xl shrink-0 ${isRainHigh ? 'bg-sky-200 text-sky-800' : 'bg-[#D9A441] text-[#1F3D2B]'}`}>
          {isRainHigh ? <CloudRain className="w-5 h-5 animate-bounce" /> : <Droplets className="w-5 h-5" />}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#B8852B]">
            💧 Aqlli Sug&apos;orish Tavsiyasi
          </p>
          <h4 className="text-sm font-bold leading-snug">
            {isRainHigh ? t.rainExpectedTitle : t.noRainTitle}
          </h4>
          <p className="text-xs text-[#5C6B5E] leading-relaxed">
            {isRainHigh ? t.rainExpectedMsg : t.noRainMsg}
          </p>
        </div>
      </div>

      {/* Open-Meteo Weather Widget */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6C7C6F] flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-[#D9A441]" />
            <span>{t.weatherForecastTitle} (Open-Meteo)</span>
          </h4>
          <span className="text-[10px] text-[#6C7C6F] bg-[#F0E8D8] px-2 py-0.5 rounded-md font-mono">
            {lat.toFixed(2)}°N, {lon.toFixed(2)}°E
          </span>
        </div>

        {loadingWeather ? (
          <div className="p-6 text-center text-xs text-[#6C7C6F] bg-[#FAF7F0] rounded-2xl border border-[#E4D9C4] space-y-2">
            <div className="w-5 h-5 border-2 border-[#1F3D2B] border-t-[#D9A441] rounded-full animate-spin mx-auto" />
            <p>{t.loadingWeather}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {daily.map((item, idx) => {
              const meta = getWeatherMeta(item.weatherCode);
              const isToday = idx === 0;

              return (
                <div
                  key={item.date}
                  className={`p-3 rounded-2xl border text-center space-y-1.5 transition-all ${
                    isToday
                      ? 'bg-[#1F3D2B] text-[#FAF7F0] border-[#D9A441] shadow-md'
                      : 'bg-[#FAF7F0] text-[#1F3D2B] border-[#E4D9C4] hover:border-[#1F3D2B]'
                  }`}
                >
                  <p className={`text-xs font-bold ${isToday ? 'text-[#D9A441]' : 'text-[#6C7C6F]'}`}>
                    {item.dayName}
                  </p>

                  <div className="flex justify-center my-1">
                    {meta.icon}
                  </div>

                  <p className="text-xs font-bold">
                    {item.tempMax}° / <span className={`${isToday ? 'text-emerald-200' : 'text-[#6C7C6F]'}`}>{item.tempMin}°</span>
                  </p>

                  <div className={`mt-1 py-0.5 px-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 ${
                    item.rainProb >= 50
                      ? isToday ? 'bg-[#D9A441] text-[#1F3D2B]' : 'bg-sky-100 text-sky-800 border border-sky-300'
                      : isToday ? 'bg-[#FAF7F0]/20 text-[#FAF7F0]' : 'bg-[#E4D9C4]/50 text-[#6C7C6F]'
                  }`}>
                    <Droplets className="w-3 h-3 shrink-0" />
                    <span>{item.rainProb}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
