'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Language, translations } from '@/lib/i18n';
import {
  Sun,
  CloudRain,
  Droplets,
  Wind,
  Thermometer,
  Calendar,
  MapPin,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Zap,
  Clock,
  Sparkles,
  Info,
  ShieldAlert,
  Compass,
  Sliders,
  Sprout,
  Activity,
  Layers,
  Check,
  ChevronRight
} from 'lucide-react';
import { calculateIrrigationRecommendation, IrrigationRecommendation, IrrigationActionType } from '@/lib/irrigationAdvisor';
import { CROP_GUIDES } from '@/lib/cropGuidesData';
import { Button } from '@/components/ui/Button';
import { WeatherStripSkeleton, ErrorState } from '@/components/ui/StateFeedback';

interface WeatherIrrigationSectionProps {
  currentLang: Language;
}

const REGIONS_LIST = [
  { nameUz: "Toshkent viloyati", nameRu: "Ташкентская область", nameEn: "Tashkent Region", lat: 41.2995, lon: 69.2401 },
  { nameUz: "Samarqand viloyati", nameRu: "Самаркандская область", nameEn: "Samarkand Region", lat: 39.6542, lon: 66.9597 },
  { nameUz: "Farg'ona viloyati", nameRu: "Ферганская область", nameEn: "Fergana Region", lat: 40.3842, lon: 71.7843 },
  { nameUz: "Andijon viloyati", nameRu: "Андижанская область", nameEn: "Andijan Region", lat: 40.7821, lon: 72.3442 },
  { nameUz: "Namangan viloyati", nameRu: "Наманганская область", nameEn: "Namangan Region", lat: 40.9983, lon: 71.6726 },
  { nameUz: "Buxoro viloyati", nameRu: "Бухарская область", nameEn: "Bukhara Region", lat: 39.7747, lon: 64.4286 },
  { nameUz: "Qashqadaryo viloyati", nameRu: "Кашкадарьинская область", nameEn: "Kashkadarya Region", lat: 38.8605, lon: 65.7891 },
  { nameUz: "Surxondaryo viloyati", nameRu: "Сурхандарьинская область", nameEn: "Surkhandarya Region", lat: 37.2242, lon: 67.2783 },
  { nameUz: "Xorazm viloyati", nameRu: "Хорезмская область", nameEn: "Khorezm Region", lat: 41.5503, lon: 60.6317 },
  { nameUz: "Navoiy viloyati", nameRu: "Навоийская область", nameEn: "Navoiy Region", lat: 40.1031, lon: 65.3688 },
  { nameUz: "Sirdaryo viloyati", nameRu: "Сырдарьинская область", nameEn: "Syrdarya Region", lat: 40.4897, lon: 68.7842 },
  { nameUz: "Jizzax viloyati", nameRu: "Джизакская область", nameEn: "Jizzakh Region", lat: 40.1158, lon: 67.8422 },
  { nameUz: "Qoraqalpog'iston Respublikasi", nameRu: "Республика Каракалпакстан", nameEn: "Republic of Karakalpakstan", lat: 43.7683, lon: 59.0214 },
];

interface DailyForecastItem {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
  rainSum: number;
  weatherCode: number;
  windSpeedMax: number;
  evapotranspiration: number;
}

export const WeatherIrrigationSection: React.FC<WeatherIrrigationSectionProps> = ({ currentLang }) => {
  const [selectedRegionIndex, setSelectedRegionIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [currentWeather, setCurrentWeather] = useState({
    temp: 29,
    apparentTemp: 30,
    humidity: 42,
    wind: 12,
    windGusts: 18,
    precipitation: 0,
    pressure: 1012,
    uvIndex: 7,
    weatherCode: 0,
  });
  const [forecastDays, setForecastDays] = useState<DailyForecastItem[]>([]);

  // Recommendation Engine Interactive State
  const [calcCrop, setCalcCrop] = useState<string>('cotton');
  const [calcArea, setCalcArea] = useState<number>(3.5);
  const [calcSoil, setCalcSoil] = useState<string>('loam'); // sandy, loam, clay
  const [calcMethod, setCalcMethod] = useState<string>('drip'); // drip, furrow, sprinkler
  const [calcDaysSincePlanting, setCalcDaysSincePlanting] = useState<number>(65);
  const [calcSoilMoisture, setCalcSoilMoisture] = useState<number>(54); // percentage
  const [calcNdviValue, setCalcNdviValue] = useState<number>(0.72);
  const [calcNdviTrend, setCalcNdviTrend] = useState<'improving' | 'stable' | 'declining'>('stable');

  const region = REGIONS_LIST[selectedRegionIndex];

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setIsOffline(false);

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration&timezone=Asia%2FTashkent`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch from Open-Meteo API');

        const data = await res.json();

        if (isMounted) {
          if (data.current) {
            setCurrentWeather({
              temp: Math.round(data.current.temperature_2m),
              apparentTemp: Math.round(data.current.apparent_temperature ?? data.current.temperature_2m),
              humidity: Math.round(data.current.relative_humidity_2m),
              wind: Math.round(data.current.wind_speed_10m),
              windGusts: Math.round(data.current.wind_gusts_10m ?? data.current.wind_speed_10m * 1.3),
              precipitation: data.current.precipitation || 0,
              pressure: Math.round(data.current.surface_pressure || 1013),
              uvIndex: 7,
              weatherCode: data.current.weather_code || 0,
            });
          }

          if (data.daily && data.daily.time) {
            const days: DailyForecastItem[] = data.daily.time.slice(0, 7).map((d: string, idx: number) => {
              const dateObj = new Date(d);
              const dayNamesUz = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
              const dayNamesRu = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
              const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              
              let dayName = dayNamesUz[dateObj.getDay()];
              if (currentLang === 'ru') dayName = dayNamesRu[dateObj.getDay()];
              if (currentLang === 'en') dayName = dayNamesEn[dateObj.getDay()];

              if (idx === 0) {
                dayName = currentLang === 'ru' ? 'Сегодня' : currentLang === 'en' ? 'Today' : 'Bugun';
              } else if (idx === 1) {
                dayName = currentLang === 'ru' ? 'Завтра' : currentLang === 'en' ? 'Tomorrow' : 'Ertaga';
              }

              return {
                date: d,
                dayName,
                tempMax: Math.round(data.daily.temperature_2m_max[idx]),
                tempMin: Math.round(data.daily.temperature_2m_min[idx]),
                rainProb: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[idx] : 10,
                rainSum: data.daily.precipitation_sum ? Math.round(data.daily.precipitation_sum[idx] * 10) / 10 : 0,
                weatherCode: data.daily.weather_code[idx] || 0,
                windSpeedMax: Math.round(data.daily.wind_speed_10m_max ? data.daily.wind_speed_10m_max[idx] : 14),
                evapotranspiration: data.daily.et0_fao_evapotranspiration ? Math.round(data.daily.et0_fao_evapotranspiration[idx] * 10) / 10 : 5.2,
              };
            });
            setForecastDays(days);
          }
          setLoading(false);
        }
      } catch (err) {
        console.warn('Weather fetch fallback triggered:', err);
        if (isMounted) {
          setIsOffline(true);
          setLoading(false);

          // Baseline fallback 7-day forecast
          const fallbackDays: DailyForecastItem[] = [
            { date: '2026-08-16', dayName: 'Bugun', tempMax: 33, tempMin: 21, rainProb: 5, rainSum: 0, weatherCode: 0, windSpeedMax: 12, evapotranspiration: 5.8 },
            { date: '2026-08-17', dayName: 'Ertaga', tempMax: 34, tempMin: 22, rainProb: 10, rainSum: 0, weatherCode: 1, windSpeedMax: 14, evapotranspiration: 6.1 },
            { date: '2026-08-18', dayName: 'Seshanba', tempMax: 31, tempMin: 20, rainProb: 25, rainSum: 1.2, weatherCode: 2, windSpeedMax: 16, evapotranspiration: 4.9 },
            { date: '2026-08-19', dayName: 'Chorshanba', tempMax: 29, tempMin: 18, rainProb: 65, rainSum: 7.5, weatherCode: 80, windSpeedMax: 22, evapotranspiration: 3.5 },
            { date: '2026-08-20', dayName: 'Payshanba', tempMax: 30, tempMin: 19, rainProb: 20, rainSum: 0.5, weatherCode: 1, windSpeedMax: 13, evapotranspiration: 5.0 },
            { date: '2026-08-21', dayName: 'Juma', tempMax: 32, tempMin: 20, rainProb: 10, rainSum: 0, weatherCode: 0, windSpeedMax: 11, evapotranspiration: 5.6 },
            { date: '2026-08-22', dayName: 'Shanba', tempMax: 34, tempMin: 22, rainProb: 5, rainSum: 0, weatherCode: 0, windSpeedMax: 10, evapotranspiration: 6.0 },
          ];
          setForecastDays(fallbackDays);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [region.lat, region.lon, currentLang]);

  const handleManualRefresh = () => {
    setLoading(true);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration&timezone=Asia%2FTashkent`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.current) {
          setCurrentWeather({
            temp: Math.round(data.current.temperature_2m),
            apparentTemp: Math.round(data.current.apparent_temperature ?? data.current.temperature_2m),
            humidity: Math.round(data.current.relative_humidity_2m),
            wind: Math.round(data.current.wind_speed_10m),
            windGusts: Math.round(data.current.wind_gusts_10m ?? data.current.wind_speed_10m * 1.3),
            precipitation: data.current.precipitation || 0,
            pressure: Math.round(data.current.surface_pressure || 1013),
            uvIndex: 7,
            weatherCode: data.current.weather_code || 0,
          });
        }
        setIsOffline(false);
        setLoading(false);
      })
      .catch(() => {
        setIsOffline(true);
        setLoading(false);
      });
  };

  // Weather condition metadata
  const getWeatherInfo = (code: number) => {
    if (code === 0) return { labelUz: "Ochiq, oftobli", labelRu: "Ясно, солнечно", labelEn: "Clear & Sunny", icon: Sun, color: "text-amber-500" };
    if (code <= 3) return { labelUz: "Qisman bulutli", labelRu: "Переменная облачность", labelEn: "Partly Cloudy", icon: Sun, color: "text-amber-400" };
    if (code >= 51 && code <= 67) return { labelUz: "Yomg'ir / Shivalash", labelRu: "Дождь / Морось", labelEn: "Rain / Drizzle", icon: CloudRain, color: "text-blue-500" };
    if (code >= 80) return { labelUz: "Jala / Kuchli yog'ingarchilik", labelRu: "Ливень / Осадки", labelEn: "Showers", icon: CloudRain, color: "text-blue-600" };
    return { labelUz: "Bulutli", labelRu: "Пасмурно", labelEn: "Overcast", icon: Sun, color: "text-emerald-700" };
  };

  // --------------------------------------------------------------------------
  // REAL RULES-BASED IRRIGATION RECOMMENDATION ENGINE
  // --------------------------------------------------------------------------
  const recommendation: IrrigationRecommendation = useMemo(() => {
    return calculateIrrigationRecommendation({
      cropType: calcCrop,
      daysSincePlanting: calcDaysSincePlanting,
      ndviValue: calcNdviValue,
      ndviTrend: calcNdviTrend,
      soilMoisture: calcSoilMoisture,
      rainForecast: forecastDays.map((d) => ({
        date: d.date,
        rainProb: d.rainProb,
        rainSum: d.rainSum,
        tempMax: d.tempMax,
        dayName: d.dayName,
      })),
      areaHectares: calcArea,
      soilType: calcSoil,
      irrigationMethod: calcMethod,
    });
  }, [calcCrop, calcDaysSincePlanting, calcNdviValue, calcNdviTrend, calcSoilMoisture, forecastDays, calcArea, calcSoil, calcMethod]);

  const activeReasoningSentence =
    currentLang === 'ru'
      ? recommendation.reasoning.ru
      : currentLang === 'en'
      ? recommendation.reasoning.en
      : recommendation.reasoning.uz;

  const activeActionBadge =
    currentLang === 'ru'
      ? recommendation.actionBadge.textRu
      : currentLang === 'en'
      ? recommendation.actionBadge.textEn
      : recommendation.actionBadge.textUz;

  const activeCropTitle =
    currentLang === 'ru'
      ? recommendation.growthStage.cropTitleRu
      : currentLang === 'en'
      ? recommendation.growthStage.cropTitleEn
      : recommendation.growthStage.cropTitleUz;

  const activeStageName =
    currentLang === 'ru'
      ? recommendation.growthStage.stageNameRu
      : currentLang === 'en'
      ? recommendation.growthStage.stageNameEn
      : recommendation.growthStage.stageNameUz;

  const activeWaterNotes =
    currentLang === 'ru'
      ? recommendation.waterAmountNotes.ru
      : currentLang === 'en'
      ? recommendation.waterAmountNotes.en
      : recommendation.waterAmountNotes.uz;

  const activeTimingAdvice =
    currentLang === 'ru'
      ? recommendation.timingAdvice.ru
      : currentLang === 'en'
      ? recommendation.timingAdvice.en
      : recommendation.timingAdvice.uz;

  return (
    <div className="py-4 sm:py-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-[#1F3D2B] text-[#FAF7F0] rounded-2xl p-6 sm:p-7 border border-[#FAF7F0]/10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D9A441] text-[#1F3D2B] rounded-full text-xs font-bold uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5" />
              <span>Agro-Meteorologiya & Sug&apos;orish Markazi</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF7F0]">
              {currentLang === 'ru'
                ? 'Агро-прогноз погоды и расчёт полива'
                : currentLang === 'en'
                ? 'Agro-Weather Forecast & Precision Irrigation'
                : "Ob-havo Bashorati & Aniq Sug'orish Rejasi"}
            </h1>
            <p className="text-xs sm:text-sm text-[#FAF7F0]/80 max-w-2xl">
              {currentLang === 'ru'
                ? 'Точные метеорологические данные Open-Meteo для всех 14 регионов Узбекистана и интеллектуальный расчёт норм полива на основе NDVI и влажности.'
                : currentLang === 'en'
                ? 'Live Open-Meteo meteorological telemetry for all 14 regions of Uzbekistan coupled with a rules-based agronomic irrigation engine.'
                : "O'zbekistonning 14 ta hududi bo'yicha Open-Meteo jonli agrometeorologiyasi hamda sun'iy yo'ldosh NDVI va tuproq namligiga asoslangan aniq sug'orish tavsiyalari."}
            </p>
          </div>

          {/* Region Select & Refresh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-[#14281C] p-2.5 rounded-xl border border-white/10 shrink-0">
            <div className="flex items-center gap-2 px-2 text-xs font-bold text-[#D9A441]">
              <MapPin className="w-3.5 h-3.5" />
              <span>Viloyat:</span>
            </div>
            <select
              value={selectedRegionIndex}
              onChange={(e) => setSelectedRegionIndex(Number(e.target.value))}
              className="bg-[#1F3D2B] text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#D9A441] cursor-pointer"
            >
              {REGIONS_LIST.map((r, i) => (
                <option key={r.nameUz} value={i} className="bg-[#1F3D2B] text-white">
                  {currentLang === 'ru' ? r.nameRu : currentLang === 'en' ? r.nameEn : r.nameUz}
                </option>
              ))}
            </select>
            <Button
              onClick={handleManualRefresh}
              disabled={loading}
              variant="accent"
              size="sm"
              isLoading={loading}
              title="Yangilash"
              className="p-2 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Offline Resilient Notification */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 text-xs sm:text-sm font-medium shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <p className="font-bold text-amber-900">
              {currentLang === 'ru'
                ? '⚠️ Не удалось связаться с сервером погоды. Отображаются сохранённые региональные нормы.'
                : currentLang === 'en'
                ? '⚠️ Live weather server unreachable. Displaying cached regional agricultural averages.'
                : "⚠️ Jonli ob-havo serveriga ulanib bo'lmadi. Oxirgi ma'lumotlar ko'rsatilmoqda."}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              // Trigger reload
              const currentIdx = selectedRegionIndex;
              setSelectedRegionIndex(-1);
              setTimeout(() => setSelectedRegionIndex(currentIdx), 10);
            }}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="shrink-0 text-xs"
          >
            {currentLang === 'ru' ? 'Повторить' : currentLang === 'en' ? 'Retry' : 'Qayta urinish'}
          </Button>
        </div>
      )}

      {/* 4 Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Temp */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6C7C6F] text-xs font-semibold">
            <span>Harorat</span>
            <Thermometer className="w-4 h-4 text-[#D9A441]" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
            {loading ? '...' : `${currentWeather.temp}°C`}
          </div>
          <p className="text-[11px] text-[#6C7C6F]">
            His qilinishi: {currentWeather.apparentTemp}°C
          </p>
        </div>

        {/* Metric 2: Humidity */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6C7C6F] text-xs font-semibold">
            <span>Havo Namligi</span>
            <Droplets className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
            {loading ? '...' : `${currentWeather.humidity}%`}
          </div>
          <p className="text-[11px] text-[#6C7C6F]">
            Bosim: {currentWeather.pressure} hPa
          </p>
        </div>

        {/* Metric 3: Wind */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6C7C6F] text-xs font-semibold">
            <span>Shamol Tezligi</span>
            <Wind className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
            {loading ? '...' : `${currentWeather.wind} km/soat`}
          </div>
          <p className="text-[11px] text-[#6C7C6F]">
            Shiddat: {currentWeather.windGusts} km/soat
          </p>
        </div>

        {/* Metric 4: UV / Sun */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6C7C6F] text-xs font-semibold">
            <span>Yog&apos;ingarchilik</span>
            <CloudRain className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]">
            {loading ? '...' : `${currentWeather.precipitation} mm`}
          </div>
          <p className="text-[11px] text-[#6C7C6F]">
            UV indeksi: {currentWeather.uvIndex} (Yuqori)
          </p>
        </div>
      </div>

      {/* 7-Day Weather Strip */}
      <div className="bg-white rounded-2xl border border-[#E4D9C4] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D9A441]" />
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1F3D2B]">
              7 Kunlik Agrometeorologik Prognoz
            </h3>
          </div>
          <span className="text-xs text-[#6C7C6F] font-medium hidden sm:inline">
            Open-Meteo &bull; {region.nameUz}
          </span>
        </div>

        {loading ? (
          <WeatherStripSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {forecastDays.map((d, idx) => {
              const wInfo = getWeatherInfo(d.weatherCode);
              const Icon = wInfo.icon;
              const isRainHigh = d.rainProb >= 50;

              return (
                <div
                  key={d.date}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                    idx === 0
                      ? 'bg-[#1F3D2B] text-white border-[#1F3D2B] shadow-xs'
                      : 'bg-[#FAF7F0] text-[#1F3D2B] border-[#E4D9C4] hover:border-[#D9A441]'
                  }`}
                >
                  <div className="text-center">
                    <span className={`text-xs font-bold block ${idx === 0 ? 'text-[#D9A441]' : 'text-[#1F3D2B]'}`}>
                      {d.dayName}
                    </span>
                    <span className={`text-[10px] ${idx === 0 ? 'text-white/60' : 'text-[#6C7C6F]'}`}>
                      {d.date.slice(5)}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center my-1">
                    <Icon className={`w-7 h-7 ${idx === 0 ? 'text-[#D9A441]' : wInfo.color}`} />
                    <span className={`text-[10px] mt-1 font-medium text-center line-clamp-1 ${idx === 0 ? 'text-white/80' : 'text-[#6C7C6F]'}`}>
                      {currentLang === 'ru' ? wInfo.labelRu : currentLang === 'en' ? wInfo.labelEn : wInfo.labelUz}
                    </span>
                  </div>

                  <div className="text-center pt-2 border-t border-black/5 space-y-1">
                    <div className="text-sm font-bold">
                      <span>{d.tempMax}°</span>
                      <span className={`text-xs ml-1 ${idx === 0 ? 'text-white/60' : 'text-[#6C7C6F]'}`}>
                        / {d.tempMin}°C
                      </span>
                    </div>

                    <div
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center justify-center gap-0.5 ${
                        idx === 0
                          ? 'bg-white/10 text-white'
                          : isRainHigh
                          ? 'bg-blue-100 text-blue-900 font-extrabold'
                          : 'bg-white text-[#6C7C6F] border border-[#E4D9C4]'
                      }`}
                    >
                      <Droplets className="w-2.5 h-2.5" />
                      <span>{d.rainProb}% yog&apos;in</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* REAL RULES-BASED PRECISION IRRIGATION ENGINE SECTION                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#E4D9C4] p-6 sm:p-7 space-y-6 shadow-xs">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4D9C4] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center shadow-md shrink-0">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D9A441] bg-[#1F3D2B] px-2 py-0.5 rounded-md">
                  QOIDALARGA ASOSLANGAN DVI & OBY-HAVO ENGINE
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F3D2B] mt-0.5">
                {currentLang === 'ru'
                  ? 'Интеллектуальный советник по поливу'
                  : currentLang === 'en'
                  ? 'Rules-Based Precision Irrigation Advisor'
                  : "Aqlli Sug'orish Tavsiya Tizimi"}
              </h2>
              <p className="text-xs sm:text-sm text-[#6C7C6F]">
                Sentinel-2 NDVI, tuproq namligi, 48 soatlik yomg&apos;ir prognozi va o&apos;sish fazasi normasi asosida
              </p>
            </div>
          </div>

          {/* Action Badge */}
          <div className={`px-4 py-2 rounded-2xl border font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs self-start md:self-center ${recommendation.actionBadge.bg} ${recommendation.actionBadge.color} ${recommendation.actionBadge.border}`}>
            <span className="text-base">{recommendation.actionBadge.icon}</span>
            <span>{activeActionBadge}</span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* HIGHLIGHTED TRANSPARENT REASONING BANNER (User requirement: plain sentence WHY) */}
        {/* ----------------------------------------------------------------------- */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border-2 transition-all shadow-xs ${
            recommendation.action === 'irrigate_now'
              ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
              : recommendation.action === 'wait'
              ? 'bg-blue-50/90 border-blue-400 text-blue-950'
              : recommendation.action === 'reduce'
              ? 'bg-teal-50/90 border-teal-400 text-teal-950'
              : 'bg-amber-50/90 border-amber-400 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white shadow-xs shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-[#1F3D2B]" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-75 block">
                Shaffof Qaror Sababi (Reasoning):
              </span>
              <p className="font-serif text-base sm:text-lg font-bold leading-snug">
                {activeReasoningSentence}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-90 pt-1">
                <span>⏱️ <strong>Vaqt tavsiyasi:</strong> {activeTimingAdvice}</span>
                <span>🌱 <strong>Bosqich:</strong> {activeStageName} ({recommendation.growthStage.daysElapsed} kun)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Columns: Interactive Parameters Form vs Scientific Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 7 COLS: Controls Form */}
          <div className="lg:col-span-7 space-y-5 bg-[#FAF7F0] p-5 sm:p-6 rounded-2xl border border-[#E4D9C4]">
            
            <div className="flex items-center justify-between border-b border-[#E4D9C4] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#1F3D2B]" />
                <span className="font-serif font-bold text-sm text-[#1F3D2B]">
                  Maydon Parametrlari & Telemetriya Sinovi
                </span>
              </div>
              <span className="text-[11px] text-[#6C7C6F]">
                O&apos;zgartirib, tavsiyani real vaqtda kuzating
              </span>
            </div>

            {/* Row 1: Crop Type & Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                  Ekin Turi
                </label>
                <select
                  value={calcCrop}
                  onChange={(e) => setCalcCrop(e.target.value)}
                  className="w-full bg-white text-[#1F3D2B] font-bold text-sm px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] cursor-pointer"
                >
                  <option value="cotton">G&apos;o&apos;za (Paxta)</option>
                  <option value="wheat">Kuzgi Bug&apos;doy</option>
                  <option value="tomato">Pomidor / Sabzavot</option>
                  <option value="apple">Olma va Mevali Bog&apos;</option>
                  <option value="grape">Uzum / Tokzor</option>
                  <option value="pomegranate">Anorzor</option>
                  <option value="corn">Makkajo&apos;xori</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                  Maydon Hajmi (Gektar)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={calcArea}
                    onChange={(e) => setCalcArea(Math.max(0.1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-white text-[#1F3D2B] font-bold text-sm px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#6C7C6F]">
                    ga
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Soil Type & Irrigation Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                  Tuproq Turi
                </label>
                <select
                  value={calcSoil}
                  onChange={(e) => setCalcSoil(e.target.value)}
                  className="w-full bg-white text-[#1F3D2B] font-bold text-sm px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] cursor-pointer"
                >
                  <option value="sandy">Yengil qumloq (Tez singadi)</option>
                  <option value="loam">O&apos;rta qumoq (Tipik bo&apos;z tuproq)</option>
                  <option value="clay">Og&apos;ir gil tuproq (Ko&apos;p ushlaydi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                  Sug&apos;orish Tizimi
                </label>
                <select
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value)}
                  className="w-full bg-white text-[#1F3D2B] font-bold text-sm px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] cursor-pointer"
                >
                  <option value="drip">Tomchilatib sug&apos;orish (35% tejash)</option>
                  <option value="sprinkler">Yomg&apos;irlatib sug&apos;orish (15% tejash)</option>
                  <option value="furrow">An&apos;anaviy egatlab sug&apos;orish</option>
                </select>
              </div>
            </div>

            {/* Row 3: Days Since Planting (Growth Stage estimation) */}
            <div className="space-y-2 pt-2 border-t border-[#E4D9C4]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#6C7C6F] uppercase tracking-wider">
                  Ekilganiga o&apos;tgan kunlar:
                </span>
                <span className="font-bold text-[#1F3D2B] bg-white px-2 py-0.5 rounded-md border border-[#E4D9C4]">
                  {calcDaysSincePlanting} kun &bull; {activeStageName}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="160"
                step="5"
                value={calcDaysSincePlanting}
                onChange={(e) => setCalcDaysSincePlanting(Number(e.target.value))}
                className="w-full accent-[#1F3D2B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#6C7C6F] px-1">
                <span>Unib chiqish (1-20 kun)</span>
                <span>Vegetatsiya (20-60 kun)</span>
                <span>Gullash (60-110 kun)</span>
                <span>Pishish (110+ kun)</span>
              </div>
            </div>

            {/* Row 4: Soil Moisture & NDVI Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E4D9C4]">
              {/* Soil Moisture Slider */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-[#E4D9C4]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1F3D2B]">Tuproq Namligi:</span>
                  <span className={`font-extrabold px-2 py-0.5 rounded-md text-xs ${
                    calcSoilMoisture < 45
                      ? 'bg-rose-100 text-rose-900'
                      : calcSoilMoisture < 62
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {calcSoilMoisture}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  step="2"
                  value={calcSoilMoisture}
                  onChange={(e) => setCalcSoilMoisture(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#6C7C6F]">
                  <span>Qurg&apos;oq (&lt;45%)</span>
                  <span>O&apos;rta (55%)</span>
                  <span>To&apos;liq (&gt;65%)</span>
                </div>
              </div>

              {/* NDVI Index & Trend */}
              <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-[#E4D9C4]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1F3D2B]">NDVI Qiymati:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-[#1F3D2B] bg-[#FAF7F0] px-1.5 py-0.5 rounded border border-[#E4D9C4]">
                      {calcNdviValue.toFixed(2)}
                    </span>
                    <select
                      value={calcNdviTrend}
                      onChange={(e) => setCalcNdviTrend(e.target.value as any)}
                      className="text-[11px] font-bold bg-[#FAF7F0] border border-[#E4D9C4] rounded px-1 py-0.5 cursor-pointer"
                    >
                      <option value="improving">↗ O&apos;sishda</option>
                      <option value="stable">→ Barqaror</option>
                      <option value="declining">↘ Pasayishda</option>
                    </select>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.30"
                  max="0.90"
                  step="0.02"
                  value={calcNdviValue}
                  onChange={(e) => setCalcNdviValue(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#6C7C6F]">
                  <span>Stress (&lt;0.50)</span>
                  <span>O&apos;rta (0.65)</span>
                  <span>Zich (0.85)</span>
                </div>
              </div>
            </div>

            {/* Quick Test Scenario Presets */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-[#6C7C6F] uppercase tracking-wider block mb-2">
                Tezkor Ssenariylar:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCalcSoilMoisture(36);
                    setCalcNdviValue(0.52);
                    setCalcNdviTrend('declining');
                    setCalcDaysSincePlanting(70);
                  }}
                  className="w-full justify-start text-xs py-2"
                >
                  🚨 Qurg&apos;oqchilik
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCalcSoilMoisture(68);
                    setCalcNdviValue(0.78);
                    setCalcNdviTrend('improving');
                    setCalcDaysSincePlanting(55);
                  }}
                  className="w-full justify-start text-xs py-2"
                >
                  🌿 Optimal Namlik
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCalcSoilMoisture(50);
                    setCalcDaysSincePlanting(125);
                  }}
                  className="w-full justify-start text-xs py-2"
                >
                  🍂 Hosil Pishishi
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setCalcSoilMoisture(54);
                    setCalcNdviValue(0.72);
                    setCalcNdviTrend('stable');
                    setCalcDaysSincePlanting(65);
                  }}
                  className="w-full justify-start text-xs py-2"
                >
                  🔄 Standart Reja
                </Button>
              </div>
            </div>

          </div>

          {/* RIGHT 5 COLS: Scientific Water Calculation Card & Factor Breakdown */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            
            {/* Output Main Card */}
            <div className="bg-[#1F3D2B] text-[#FAF7F0] rounded-2xl p-5 sm:p-6 border border-[#FAF7F0]/10 shadow-xs space-y-4">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-[#D9A441] uppercase tracking-wider">
                  Hisoblangan Suv Me&apos;yori
                </span>
                <span className="text-xs px-2.5 py-0.5 bg-white/10 rounded-full font-semibold">
                  {calcArea} gektar maydon
                </span>
              </div>

              <div>
                <div className="text-4xl sm:text-5xl font-extrabold text-[#FAF7F0] tracking-tight">
                  {recommendation.totalWaterM3.toLocaleString('ru-RU').replace(/,/g, ' ')} <span className="text-2xl text-[#D9A441] font-bold">m³</span>
                </div>
                <p className="text-xs text-white/70 mt-1">
                  (Jami {recommendation.totalWaterLiters} litr suv talab qilinadi)
                </p>
              </div>

              {/* Breakdown details */}
              <div className="space-y-2 text-xs text-white/90 border-t border-white/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">1 Gektar normasi:</span>
                  <span className="font-bold text-[#D9A441]">{recommendation.recommendedVolumeM3PerHa} m³/ga</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">O&apos;sish bosqichi:</span>
                  <span className="font-bold">{activeStageName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Sug&apos;orish usuli tejamkorligi:</span>
                  <span className="font-bold text-emerald-400">
                    {calcMethod === 'drip' ? '-35% (Tomchilatish)' : calcMethod === 'sprinkler' ? '-15% (Yomg&apos;irlatish)' : '0% (Egatlab)'}
                  </span>
                </div>
              </div>

              {/* Crop Guide Stage Irrigation Notes */}
              <div className="p-3.5 bg-[#14281C] rounded-xl border border-white/10 text-xs text-[#FAF7F0]/90 space-y-1">
                <span className="font-bold text-[#D9A441] block">
                  📖 {activeCropTitle} agronom qo&apos;llanmasidan:
                </span>
                <p className="leading-relaxed text-[11px] text-white/80">
                  {activeWaterNotes}
                </p>
              </div>

            </div>

            {/* Transparent Factor Matrix Card */}
            <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] space-y-3">
              <span className="text-[10px] font-bold text-[#6C7C6F] uppercase tracking-wider block">
                Qaror Qabul Qilish Omillari Matritsasi:
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-[#E4D9C4]">
                  <span className="text-[#6C7C6F] block text-[10px]">Tuproq namligi</span>
                  <span className="font-bold text-[#1F3D2B]">{calcSoilMoisture}%</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E4D9C4]">
                  <span className="text-[#6C7C6F] block text-[10px]">Yaqin 48s yomg&apos;ir</span>
                  <span className="font-bold text-[#1F3D2B]">
                    {recommendation.factors.rainSumNext48h} mm ({recommendation.factors.rainProbNext48h}%)
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E4D9C4]">
                  <span className="text-[#6C7C6F] block text-[10px]">NDVI indeksi</span>
                  <span className="font-bold text-[#1F3D2B]">{calcNdviValue} ({calcNdviTrend})</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-[#E4D9C4]">
                  <span className="text-[#6C7C6F] block text-[10px]">Bugungi eng yuqori harorat</span>
                  <span className="font-bold text-[#1F3D2B]">{recommendation.factors.tempMaxToday}°C</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
