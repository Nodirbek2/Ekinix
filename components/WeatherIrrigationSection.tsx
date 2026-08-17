'use client';

import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Zap,
  Clock,
  Sparkles,
  Info,
  ShieldAlert,
  Compass
} from 'lucide-react';

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

  // Precision Irrigation Calculator State
  const [calcCrop, setCalcCrop] = useState<string>('cotton');
  const [calcArea, setCalcArea] = useState<number>(5);
  const [calcSoil, setCalcSoil] = useState<string>('loam'); // sandy, loam, clay
  const [calcMethod, setCalcMethod] = useState<string>('drip'); // drip, furrow, sprinkler
  const [calcDaysSinceRain, setCalcDaysSinceRain] = useState<number>(4);

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

  // Calculate Precision Irrigation Metrics
  const cropWaterCoefficients: Record<string, { nameUz: string; nameRu: string; nameEn: string; baseM3PerHa: number }> = {
    cotton: { nameUz: "G'o'za (Paxta)", nameRu: "Хлопчатник", nameEn: "Cotton", baseM3PerHa: 750 },
    wheat: { nameUz: "Kuzgi Bug'doy", nameRu: "Озимая пшеница", nameEn: "Winter Wheat", baseM3PerHa: 600 },
    corn: { nameUz: "Makkajo'xori", nameRu: "Кукуруза", nameEn: "Maize / Corn", baseM3PerHa: 700 },
    tomato: { nameUz: "Pomidor / Sabzavotlar", nameRu: "Томаты / Овощи", nameEn: "Tomatoes / Veg", baseM3PerHa: 450 },
    orchard: { nameUz: "Mevali Bog' (Uzum, Olma)", nameRu: "Сады и виноградники", nameEn: "Fruit Orchard", baseM3PerHa: 550 },
  };

  const soilMultiplier: Record<string, number> = {
    sandy: 0.8, // Qumloq - tez singadi, tez-tez lekin kam hajm
    loam: 1.0, // Qumoq - ideal
    clay: 1.25, // Gil - suvni ushlaydi, kamroq marta katta hajm
  };

  const methodEfficiency: Record<string, number> = {
    drip: 0.65, // Tomchilatib - 35% tejamkor
    sprinkler: 0.85, // Yomg'irlatib
    furrow: 1.2, // Egatlab - ko'proq bug'lanish
  };

  const currentCropInfo = cropWaterCoefficients[calcCrop] || cropWaterCoefficients.cotton;
  const recommendedVolumePerHa = Math.round(
    currentCropInfo.baseM3PerHa * (soilMultiplier[calcSoil] || 1) * (methodEfficiency[calcMethod] || 1)
  );
  const totalVolumeM3 = Math.round(recommendedVolumePerHa * calcArea);
  const totalVolumeLiters = (totalVolumeM3 * 1000).toLocaleString('ru-RU').replace(/,/g, ' ');

  // Upcoming Rain Warning
  const next2DaysRainSum = forecastDays.slice(0, 2).reduce((sum, d) => sum + d.rainSum, 0);
  const rainExpected = next2DaysRainSum >= 5 || forecastDays.slice(0, 2).some(d => d.rainProb >= 55);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-[#1F3D2B] text-[#FAF7F0] rounded-3xl p-6 sm:p-8 border-2 border-[#D9A441] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#D9A441]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D9A441]/20 text-[#D9A441] rounded-full text-xs font-bold uppercase tracking-wider">
              <Sun className="w-4 h-4" />
              <span>Agro-Meteorologiya & Sug&apos;orish Markazi</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#FAF7F0]">
              {currentLang === 'ru'
                ? 'Агро-прогноз погоды и расчёт полива'
                : currentLang === 'en'
                ? 'Agro-Weather Forecast & Precision Irrigation'
                : "Ob-havo Bashorati & Aniq Sug'orish Rejasi"}
            </h1>
            <p className="text-sm text-[#FAF7F0]/80 max-w-2xl">
              {currentLang === 'ru'
                ? 'Точные метеорологические данные Open-Meteo для всех 14 регионов Узбекистана и научный калькулятор норм полива.'
                : currentLang === 'en'
                ? 'Live Open-Meteo meteorological readings across all 14 regions of Uzbekistan with scientific irrigation schedule modeling.'
                : "O'zbekistonning 14 ta hududi bo'yicha Open-Meteo jonli agrometeorologik ma'lumotlari hamda ilmiy sug'orish me'yorlari kalkulyatori."}
            </p>
          </div>

          {/* Region Select & Refresh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#14281C] p-3 rounded-2xl border border-white/10 shrink-0">
            <div className="flex items-center gap-2 px-2 text-xs font-bold text-[#D9A441]">
              <MapPin className="w-4 h-4" />
              <span>Viloyat:</span>
            </div>
            <select
              value={selectedRegionIndex}
              onChange={(e) => setSelectedRegionIndex(Number(e.target.value))}
              className="bg-[#1F3D2B] text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#D9A441]"
            >
              {REGIONS_LIST.map((r, i) => (
                <option key={r.nameUz} value={i} className="bg-[#1F3D2B] text-white">
                  {currentLang === 'ru' ? r.nameRu : currentLang === 'en' ? r.nameEn : r.nameUz}
                </option>
              ))}
            </select>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              title="Yangilash"
              className="p-2.5 bg-[#D9A441] hover:bg-[#B8852B] text-[#1F3D2B] rounded-xl font-bold transition-all flex items-center justify-center shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Offline Resilient Notification */}
      {isOffline && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-center gap-3 text-amber-950 text-xs sm:text-sm font-medium shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
          <p className="font-bold text-amber-900">
            {currentLang === 'ru'
              ? '⚠️ Не удалось связаться с сервером погоды. Отображаются сохранённые региональные нормы.'
              : currentLang === 'en'
              ? '⚠️ Live weather server unreachable. Displaying cached regional agricultural averages.'
              : "⚠️ Jonli ob-havo serveriga ulanib bo'lmadi. Oxirgi ma'lumotlar ko'rsatilmoqda."}
          </p>
        </div>
      )}

      {/* Rain Delay Agro-Alert */}
      {rainExpected ? (
        <div className="bg-blue-50 border-2 border-blue-300 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-blue-950 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-blue-950">
                {currentLang === 'ru'
                  ? '🌧️ Ожидаются осадки — рекомендуется отложить полив'
                  : currentLang === 'en'
                  ? '🌧️ Rain Expected — Consider Delaying Irrigation'
                  : "🌧️ Yaqin 2 kunda yomg'ir kutilmoqda — sug'orishni kechiktirish tavsiya etiladi"}
              </h3>
              <p className="text-xs sm:text-sm text-blue-800/90 mt-0.5">
                {currentLang === 'ru'
                  ? 'Высокая вероятность осадков. Отложите полив для экономии воды и защиты корневой системы от переувлажнения.'
                  : currentLang === 'en'
                  ? 'High precipitation probability in the next 48 hours. Delay watering to save resources and prevent root rot.'
                  : "Yaqin 48 soatda yog'ingarchilik ehtimoli yuqori. Suvni tejash va ildiz chirishining oldini olish uchun rejali sug'orishni to'xtatib turing."}
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-blue-200 text-blue-900 font-bold text-xs rounded-full shrink-0 self-start sm:self-center">
            {next2DaysRainSum > 0 ? `~${next2DaysRainSum} mm yog'in` : "60%+ ehtimol"}
          </span>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-emerald-950 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p>
            {currentLang === 'ru'
              ? '☀️ Сухая и стабильная погода: благоприятные условия для планового полива и подкормки растений.'
              : currentLang === 'en'
              ? '☀️ Stable dry conditions: optimal window for planned irrigation and fertilizer application.'
              : "☀️ Quruq va barqaror ob-havo: ekinlarni rejali sug'orish va mineral oziqlantirish uchun qulay sharoit."}
          </p>
        </div>
      )}

      {/* 4 Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Temp */}
        <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6C7C6F] text-xs font-bold uppercase tracking-wider">
            <span>Havo Harorati</span>
            <Thermometer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-[#1F3D2B]">
            {currentWeather.temp}°C
          </div>
          <p className="text-[11px] text-[#6C7C6F]">
            His qilinishi: {currentWeather.apparentTemp}°C
          </p>
        </div>

        {/* Metric 2: Humidity */}
        <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6C7C6F] text-xs font-bold uppercase tracking-wider">
            <span>Nisbiy Namlik</span>
            <Droplets className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-3xl font-extrabold text-[#1F3D2B]">
            {currentWeather.humidity}%
          </div>
          <p className="text-[11px] text-[#6C7C6F]">
            {currentWeather.humidity < 35 ? "Quruq havo (Bug'lanish yuqori)" : "Optimal agronomik namlik"}
          </p>
        </div>

        {/* Metric 3: Wind */}
        <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6C7C6F] text-xs font-bold uppercase tracking-wider">
            <span>Shamol Tezligi</span>
            <Wind className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#1F3D2B]">
            {currentWeather.wind} <span className="text-sm font-normal">km/soat</span>
          </div>
          <p className="text-[11px] text-[#6C7C6F]">
            {currentWeather.wind > 18 ? "⚠️ Dorilash tavsiya etilmaydi" : "Dorilashga qulay shabada"}
          </p>
        </div>

        {/* Metric 4: Pressure / Evapotranspiration */}
        <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6C7C6F] text-xs font-bold uppercase tracking-wider">
            <span>Evapotranspiratsiya</span>
            <Compass className="w-4 h-4 text-[#D9A441]" />
          </div>
          <div className="text-3xl font-extrabold text-[#1F3D2B]">
            {forecastDays[0]?.evapotranspiration || 5.4} <span className="text-sm font-normal">mm/kun</span>
          </div>
          <p className="text-[11px] text-[#6C7C6F]">
            O&apos;rtacha kunlik suv yo&apos;qotish
          </p>
        </div>
      </div>

      {/* 7-Day Forecast Cards */}
      <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E4D9C4] p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#1F3D2B]">
                7 Kunlik Agrometeorologik Prognoz
              </h3>
              <p className="text-xs text-[#6C7C6F]">
                Open-Meteo ECMWF & GFS integratsiyasi orqali
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {forecastDays.map((d, i) => {
            const meta = getWeatherInfo(d.weatherCode);
            const Icon = meta.icon;
            const isToday = i === 0;

            return (
              <div
                key={d.date}
                className={`p-4 rounded-2xl border transition-all text-center flex flex-col justify-between gap-3 ${
                  isToday
                    ? 'bg-[#1F3D2B] text-[#FAF7F0] border-[#1F3D2B] shadow-md'
                    : 'bg-white text-[#1F3D2B] border-[#E4D9C4] hover:border-[#1F3D2B]'
                }`}
              >
                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                    isToday ? 'text-[#D9A441]' : 'text-[#6C7C6F]'
                  }`}>
                    {d.dayName}
                  </span>
                  <span className={`text-[10px] ${isToday ? 'text-white/60' : 'text-slate-400'}`}>
                    {d.date.split('-').slice(1).join('.')}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center my-1">
                  <Icon className={`w-8 h-8 ${isToday ? 'text-[#D9A441]' : meta.color}`} />
                  <span className={`text-[11px] font-semibold mt-1 line-clamp-1 ${
                    isToday ? 'text-white/80' : 'text-[#4A5D4E]'
                  }`}>
                    {meta.labelUz}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-mono text-sm font-bold">
                    <span className={isToday ? 'text-white' : 'text-[#1F3D2B]'}>+{d.tempMax}°</span>
                    <span className={isToday ? 'text-white/60' : 'text-slate-400'}>/ +{d.tempMin}°</span>
                  </div>

                  <div className={`flex items-center justify-center gap-1 text-[11px] font-medium ${
                    d.rainProb >= 40
                      ? 'text-blue-500 font-bold'
                      : isToday ? 'text-white/60' : 'text-slate-400'
                  }`}>
                    <Droplets className="w-3 h-3" />
                    <span>{d.rainProb}% yog&apos;in</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Precision Irrigation Calculator Section */}
      <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E4D9C4] p-6 sm:p-8 space-y-8 shadow-md">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2A75D3] text-white flex items-center justify-center shadow-md">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#1F3D2B]">
              Ilmiy Sug&apos;orish Me&apos;yori Kalkulyatori
            </h3>
            <p className="text-xs sm:text-sm text-[#6C7C6F]">
              Ekin turi, maydon hajmi va tuproq xususiyatiga qarab aniq suv hajmini hisoblang
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Form (7 cols) */}
          <div className="lg:col-span-7 space-y-5 bg-[#F0E8D8] p-6 rounded-2xl border border-[#E4D9C4]">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Crop */}
              <div>
                <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                  Ekin Turi
                </label>
                <select
                  value={calcCrop}
                  onChange={(e) => setCalcCrop(e.target.value)}
                  className="w-full bg-white text-[#1F3D2B] font-bold text-sm px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                >
                  {Object.entries(cropWaterCoefficients).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.nameUz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area */}
              <div>
                <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                  Maydon O&apos;lchami (Gektar)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={calcArea}
                  onChange={(e) => setCalcArea(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="w-full bg-white text-[#1F3D2B] font-bold text-sm px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Soil */}
              <div>
                <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                  Tuproq Mexanik Tarkibi
                </label>
                <select
                  value={calcSoil}
                  onChange={(e) => setCalcSoil(e.target.value)}
                  className="w-full bg-white text-[#1F3D2B] font-bold text-sm px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                >
                  <option value="sandy">Yengil qumloq tuproq</option>
                  <option value="loam">O&apos;rta qumoq (tipik bo&apos;z)</option>
                  <option value="clay">Og&apos;ir gil tuproq / Sho&apos;rxok</option>
                </select>
              </div>

              {/* Irrigation Method */}
              <div>
                <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                  Sug&apos;orish Usuli
                </label>
                <select
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value)}
                  className="w-full bg-white text-[#1F3D2B] font-bold text-sm px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                >
                  <option value="drip">Tomchilatib sug&apos;orish (Tejamkor)</option>
                  <option value="sprinkler">Yomg&apos;irlatib sug&apos;orish</option>
                  <option value="furrow">An&apos;anaviy egatlab sug&apos;orish</option>
                </select>
              </div>
            </div>

          </div>

          {/* Result Output Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#1F3D2B] text-[#FAF7F0] rounded-2xl p-6 border-2 border-[#D9A441] flex flex-col justify-between space-y-5 shadow-lg">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#D9A441] uppercase tracking-wider">
                  Tavsiya Etiladigan Suv Hajmi
                </span>
                <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
                  {calcArea} ga maydon
                </span>
              </div>

              <div>
                <div className="text-4xl font-extrabold text-[#FAF7F0] tracking-tight">
                  {totalVolumeM3.toLocaleString('ru-RU').replace(/,/g, ' ')} <span className="text-xl text-[#D9A441] font-bold">m³</span>
                </div>
                <p className="text-xs text-white/70 mt-1">
                  (Jami {totalVolumeLiters} litr suv talab qilinadi)
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-white/90">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">1 Gektar me&apos;yori:</span>
                  <span className="font-bold text-[#D9A441]">{recommendedVolumePerHa} m³/ga</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Eng ma&apos;qul vaqt:</span>
                  <span className="font-bold">05:00 - 08:30 yoki 19:00 dan so&apos;ng</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#14281C] rounded-xl border border-white/10 text-[11px] text-[#FAF7F0]/80 leading-relaxed">
              💡 <strong>Agronom tavsiyasi:</strong> Kun issig&apos;ida (11:00 - 17:00) sug&apos;ormang — suvning 30-40% qismi ekin ildiziga yetib bormasdan bug&apos;lanib ketadi.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
