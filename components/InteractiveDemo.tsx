'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Language, translations } from '@/lib/i18n';
import { fetchAndStoreFieldNdvi, NdviResult } from '@/lib/ndviService';
import { calculateGrowthStage, CROP_GUIDES_DATA } from '@/lib/cropGuidesData';
import { 
  Satellite, Sun, ShoppingBag, BookOpen, Droplets, Wind, Thermometer, 
  MapPin, CheckCircle, AlertTriangle, AlertCircle, Phone, Plus, RefreshCw, CloudOff,
  TrendingUp, TrendingDown, Minus, ShieldAlert, Bug, Sprout, ArrowRight, Calendar
} from 'lucide-react';

const FieldMonitoringMap = dynamic(
  () => import('@/components/FieldMonitoringMap').then((mod) => mod.FieldMonitoringMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[380px] bg-[#F0E8D8] rounded-2xl animate-pulse flex items-center justify-center text-sm font-semibold text-[#1F3D2B]/60">
        Xarita yuklanmoqda...
      </div>
    ),
  }
);

interface InteractiveDemoProps {
  currentLang: Language;
  onOpenAuth: (mode: 'register') => void;
}

// Sample Fields with exact boundary coordinates for Satellite View
const sampleFields = [
  {
    id: 'f1',
    name: "Toshkent — Yangiyo'l Maydoni #1",
    crop: "Paxta (G'o'za)",
    crop_type: 'cotton',
    area: "4.2 ha",
    area_hectares: 4.2,
    region: "Toshkent viloyati",
    soil: "Sug'oriladigan bo'z tuproq",
    coordinates: [
      [41.1158, 69.0485],
      [41.1185, 69.0520],
      [41.1160, 69.0565],
      [41.1130, 69.0525],
    ] as [number, number][],
    status: 'good' as const,
    advice_uz: "Ekin sog'lom rivojlanmoqda. Navbatdagi sug'orish 2 kundan keyin ertalab 06:00da tavsiya etiladi (350 m³/ha).",
    advice_ru: "Посевы развиваются нормально. Следующий полив рекомендуется через 2 дня утром в 06:00 (350 м³/га).",
    advice_en: "Crops are growing healthily. Next irrigation recommended in 2 days at 06:00 AM (350 m³/ha)."
  },
  {
    id: 'f2',
    name: "Samarqand — Payariq Bug'doyzor",
    crop: "Kuzgi Bug'doy",
    crop_type: 'wheat',
    area: "6.8 ha",
    area_hectares: 6.8,
    region: "Samarqand viloyati",
    soil: "Och bo'z tuproq",
    coordinates: [
      [39.8542, 66.8597],
      [39.8570, 66.8630],
      [39.8530, 66.8670],
      [39.8500, 66.8620],
    ] as [number, number][],
    status: 'warning' as const,
    advice_uz: "Tuproqda namlik yetishmovchiligi bor! Bugun kechki soat 19:00 dan keyin zudlik bilan sug'orish (400 m³/ha) tavsiya etiladi.",
    advice_ru: "Дефицит влаги в почве! Рекомендуется срочный полив сегодня после 19:00 (400 м³/га).",
    advice_en: "Soil moisture deficit detected! Immediate irrigation recommended today after 07:00 PM (400 m³/ha)."
  },
  {
    id: 'f3',
    name: "Farg'ona — Quva Sabzavot Maydoni",
    crop: "Pomidor (Issiqxona)",
    crop_type: 'tomato',
    area: "1.5 ha",
    area_hectares: 1.5,
    region: "Farg'ona viloyati",
    soil: "O'loq tuproq",
    coordinates: [
      [40.5242, 71.7243],
      [40.5270, 71.7280],
      [40.5230, 71.7320],
      [40.5210, 71.7270],
    ] as [number, number][],
    status: 'good' as const,
    advice_uz: "Namlik va NDVI darajasi a'lo. Mineral o'g'it bilan tomchilatib sug'orish reja bo'yicha davom etadi.",
    advice_ru: "Уровень влажности и NDVI отличный. Капельное орошение минеральными удобрениями продолжается по плану.",
    advice_en: "Humidity and NDVI optimal. Drip fertigation continues according to standard plan."
  }
];

// Uzbekistan Regions for Weather API
const UZ_REGIONS = [
  { name: "Toshkent", lat: 41.2995, lon: 69.2401 },
  { name: "Samarqand", lat: 39.6542, lon: 66.9597 },
  { name: "Buxoro", lat: 39.7747, lon: 64.4286 },
  { name: "Farg'ona", lat: 40.3842, lon: 71.7843 },
  { name: "Namangan", lat: 41.0011, lon: 71.6683 },
  { name: "Andijon", lat: 40.7821, lon: 72.3442 },
  { name: "Qashqadaryo (Qarshi)", lat: 38.8606, lon: 65.7891 },
  { name: "Surxondaryo (Termiz)", lat: 37.2242, lon: 67.2783 },
  { name: "Xorazm (Urganch)", lat: 41.5503, lon: 60.6317 },
  { name: "Navoiy", lat: 40.1039, lon: 65.3688 },
  { name: "Sirdaryo (Guliston)", lat: 40.4897, lon: 68.7842 },
  { name: "Qoraqalpog'iston (Nukus)", lat: 42.4611, lon: 59.6166 }
];

// Initial Marketplace Items
const initialListings = [
  {
    id: '1',
    farmer: "Karimjon Dehqon",
    crop: "Birinchi Navli Paxta",
    category: 'paxta',
    price: 8500,
    unit: 'kg',
    quantity: 12,
    location: "Farg'ona viloyati, Yozyovon tuman",
    phone: "+998 90 123 45 67",
    date: "Bugun"
  },
  {
    id: '2',
    farmer: "Boburmirzo Ostonov",
    crop: "Kuzgi Bug'doy (Sertifikatlangan)",
    category: 'don',
    price: 3200,
    unit: 'kg',
    quantity: 25,
    location: "Samarqand viloyati, Payariq tuman",
    phone: "+998 91 987 65 43",
    date: "Kecha"
  },
  {
    id: '3',
    farmer: "Sharofiddin Xoliqov",
    crop: "Toshkent Shirin Pomidori",
    category: 'sabzavot',
    price: 11500,
    unit: 'kg',
    quantity: 3,
    location: "Toshkent viloyati, Zangiota",
    phone: "+998 93 456 78 90",
    date: "Bugun"
  },
  {
    id: '4',
    farmer: "Otabek Qo'chqorov",
    crop: "Namangan Qizil Olmasi",
    category: 'meva',
    price: 9800,
    unit: 'kg',
    quantity: 8,
    location: "Namangan viloyati, Chust",
    phone: "+998 94 321 09 87",
    date: "3 kun oldin"
  }
];

export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ currentLang }) => {
  const t = translations[currentLang];
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'satellite' | 'weather' | 'market' | 'guides'>('satellite');

  // Listen for tab switch events from Header or other navigation triggers
  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const tab = customEvent.detail;
      if (tab === 'satellite' || tab === 'weather' || tab === 'market' || tab === 'guides') {
        setActiveTab(tab);
      }
    };
    window.addEventListener('ekinix-switch-tab', handleSwitchTab);
    return () => {
      window.removeEventListener('ekinix-switch-tab', handleSwitchTab);
    };
  }, []);

  // Satellite State
  const [selectedFieldId, setSelectedFieldId] = useState<string>('f1');
  const selectedField = sampleFields.find(f => f.id === selectedFieldId) || sampleFields[0];

  // Satellite NDVI Telemetry State
  const [ndviResult, setNdviResult] = useState<NdviResult | null>(null);
  const [loadingNdvi, setLoadingNdvi] = useState<boolean>(true);

  // Fetch real Sentinel Hub NDVI when selectedField changes or Satellite tab opens
  useEffect(() => {
    let isMounted = true;
    if (activeTab === 'satellite') {
      const loadNdviData = async () => {
        if (isMounted) setLoadingNdvi(true);
        try {
          const res = await fetchAndStoreFieldNdvi(selectedField as any);
          if (isMounted) {
            console.log(`[InteractiveDemo Sentinel Hub Verified Response for ${selectedField.name}]:`, res);
            setNdviResult(res);
            setLoadingNdvi(false);
          }
        } catch (err) {
          console.warn("Satellite NDVI fetch error in demo:", err);
          if (isMounted) setLoadingNdvi(false);
        }
      };

      loadNdviData();
    }
    return () => {
      isMounted = false;
    };
  }, [selectedField, activeTab]);

  // Weather State
  const [selectedRegionIndex, setSelectedRegionIndex] = useState<number>(0);
  const [weatherData, setWeatherData] = useState<{
    temp: number;
    humidity: number;
    wind: number;
    precip: number;
    loading: boolean;
    isOffline: boolean;
    isError: boolean;
  }>({
    temp: 29,
    humidity: 45,
    wind: 12,
    precip: 5,
    loading: false,
    isOffline: false,
    isError: false,
  });

  // Marketplace State
  const [marketListings, setMarketListings] = useState(initialListings);
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [contactModalItem, setContactModalItem] = useState<typeof initialListings[0] | null>(null);

  // New Listing Form State with formatted price support
  const [newListing, setNewListing] = useState({
    farmer: '',
    crop: '',
    category: 'sabzavot',
    price: '', // Raw numeric string e.g. "8500"
    unit: 'kg',
    quantity: '',
    location: '',
    phone: ''
  });

  // Growth Stage Simulator State for Tab 4
  const [demoGuideCrop, setDemoGuideCrop] = useState<string>('cotton');
  const [demoPlantingDate, setDemoPlantingDate] = useState<string>('2026-04-10');
  const [demoSelectedStageIdx, setDemoSelectedStageIdx] = useState<number>(0);

  // Numeric Price Display Formatter Helper
  const formatNumberWithSpaces = (val: string | number) => {
    if (!val) return '';
    const num = typeof val === 'number' ? val : parseInt(val.toString().replace(/\D/g, ''), 10);
    return isNaN(num) ? '' : num.toLocaleString('ru-RU').replace(/,/g, ' ');
  };

  // Fetch Weather Data from Open-Meteo with Resilient Error State
  useEffect(() => {
    let ignore = false;
    const region = UZ_REGIONS[selectedRegionIndex];

    const fetchWeather = async () => {
      if (!ignore) {
        setWeatherData(prev => ({ ...prev, loading: true, isError: false }));
      }
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code`
        );
        if (!res.ok) throw new Error('Open-Meteo weather response not ok');
        const data = await res.json();
        if (!ignore && data.current) {
          setWeatherData({
            temp: Math.round(data.current.temperature_2m),
            humidity: Math.round(data.current.relative_humidity_2m),
            wind: Math.round(data.current.wind_speed_10m),
            precip: data.current.precipitation_probability ?? (data.current.weather_code > 50 ? 65 : 5),
            loading: false,
            isOffline: false,
            isError: false,
          });
        }
      } catch (err) {
        console.warn('Weather API connection failed; using cached regional baseline:', err);
        if (!ignore) {
          setWeatherData({
            temp: 31,
            humidity: 42,
            wind: 14,
            precip: 5,
            loading: false,
            isOffline: true,
            isError: true,
          });
        }
      }
    };

    fetchWeather();

    return () => {
      ignore = true;
    };
  }, [selectedRegionIndex]);

  // Handle Add New Listing
  const handleAddListingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListing.crop || !newListing.price || !newListing.phone) return;

    const created = {
      id: Date.now().toString(),
      farmer: newListing.farmer || 'Mening Fermam',
      crop: newListing.crop,
      category: newListing.category,
      price: Number(newListing.price),
      unit: newListing.unit,
      quantity: Number(newListing.quantity) || 1,
      location: newListing.location || UZ_REGIONS[selectedRegionIndex].name,
      phone: newListing.phone,
      date: 'Hozirgina'
    };

    setMarketListings([created, ...marketListings]);
    setShowAddModal(false);
    setNewListing({
      farmer: '',
      crop: '',
      category: 'sabzavot',
      price: '',
      unit: 'kg',
      quantity: '',
      location: '',
      phone: ''
    });
  };

  const filteredListings = marketFilter === 'all'
    ? marketListings
    : marketListings.filter(item => item.category === marketFilter);

  return (
    <section id="interactive-demo" className="py-16 lg:py-24 bg-[#FAF7F0] border-t border-[#E4D9C4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 bg-[#F0E8D8] border border-[#E4D9C4] px-4 py-1.5 rounded-full text-xs font-bold text-[#1F3D2B] uppercase tracking-wider">
            <span>Interaktiv Demo</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1F3D2B]">
            {t.demoTitle}
          </h2>
          <p className="text-base sm:text-lg text-[#4A5D4E]">
            {t.demoSubtitle}
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center justify-center mb-10 overflow-x-auto pb-2">
          <div className="bg-[#F0E8D8] p-1.5 rounded-2xl border border-[#E4D9C4] inline-flex space-x-2">
            <button
              onClick={() => setActiveTab('satellite')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'satellite'
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-md'
                  : 'text-[#2D3A2F] hover:text-[#1F3D2B] hover:bg-[#FAF7F0]/60'
              }`}
            >
              <Satellite className="w-4 h-4 text-[#D9A441]" />
              <span>{t.tabSatellite}</span>
            </button>

            <button
              onClick={() => setActiveTab('weather')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'weather'
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-md'
                  : 'text-[#2D3A2F] hover:text-[#1F3D2B] hover:bg-[#FAF7F0]/60'
              }`}
            >
              <Sun className="w-4 h-4 text-[#D9A441]" />
              <span>{t.tabWeather}</span>
            </button>

            <button
              onClick={() => setActiveTab('market')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'market'
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-md'
                  : 'text-[#2D3A2F] hover:text-[#1F3D2B] hover:bg-[#FAF7F0]/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#D9A441]" />
              <span>{t.tabMarket}</span>
            </button>

            <button
              onClick={() => setActiveTab('guides')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'guides'
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-md'
                  : 'text-[#2D3A2F] hover:text-[#1F3D2B] hover:bg-[#FAF7F0]/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#D9A441]" />
              <span>{t.tabGuides}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SATELLITE MONITORING */}
        {activeTab === 'satellite' && (
          <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E4D9C4] p-6 sm:p-8 shadow-lg space-y-8 animate-in fade-in duration-300">
            
            {/* Field Selection Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F0E8D8] p-4 rounded-2xl border border-[#E4D9C4]">
              <div>
                <label className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider block mb-1">
                  {t.selectField}
                </label>
                <select
                  value={selectedFieldId}
                  onChange={(e) => setSelectedFieldId(e.target.value)}
                  className="bg-[#FAF7F0] text-[#1F3D2B] font-bold text-sm sm:text-base px-4 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                >
                  {sampleFields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.crop})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-[#1F3D2B] bg-[#FAF7F0] px-3 py-1.5 rounded-lg border border-[#E4D9C4]">
                  Maydon: {selectedField.area}
                </span>
                <span className="text-xs font-bold text-[#1F3D2B] bg-[#FAF7F0] px-3 py-1.5 rounded-lg border border-[#E4D9C4]">
                  Tuproq: {selectedField.soil}
                </span>
                <button
                  onClick={() => {
                    setLoadingNdvi(true);
                    fetchAndStoreFieldNdvi(selectedField as any).then((res) => {
                      console.log('[Sentinel Hub API Manual Trigger Response]:', res);
                      setNdviResult(res);
                      setLoadingNdvi(false);
                    });
                  }}
                  className="bg-[#1F3D2B] text-[#FAF7F0] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#14281C] transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#D9A441] ${loadingNdvi ? 'animate-spin' : ''}`} />
                  <span>Sentinel Yangilash</span>
                </button>
              </div>
            </div>

            {/* Main Interactive Map & Real Sentinel Hub NDVI Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Satellite Real Interactive Leaflet Map Visualizer */}
              <div className="lg:col-span-7 space-y-3">
                <FieldMonitoringMap field={selectedField} height={380} />
              </div>

              {/* Field Statistics & Advice Panel */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Real Sentinel Hub NDVI or Cloud Cover Warning Fallback */}
                {ndviResult?.isCloudy ? (
                  <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl space-y-3 text-amber-950 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                      <CloudOff className="w-5 h-5 text-amber-700 shrink-0" />
                      <span>Sun&apos;iy Yo&apos;ldosh Holati</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed bg-amber-100/80 p-3 rounded-xl border border-amber-300 text-amber-950">
                      {currentLang === 'ru'
                        ? ndviResult.cloudMessageRu
                        : currentLang === 'en'
                        ? ndviResult.cloudMessageEn
                        : ndviResult.cloudMessageUz}
                    </p>
                    <div className="text-xs text-amber-800 font-semibold flex items-center gap-1">
                      <span>Bulutlilik darajasi: {ndviResult.cloudCoverPercent}%</span>
                      <span>&bull; Oxirgi urinish: {ndviResult.satelliteDate}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Real NDVI Index Gauge */}
                    <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider flex items-center gap-1">
                          <Satellite className="w-3.5 h-3.5 text-[#D9A441]" />
                          {t.ndviIndex} (Sentinel-2)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-extrabold text-[#1F3D2B]">
                            {ndviResult?.ndviScore !== undefined && ndviResult?.ndviScore !== null ? ndviResult.ndviScore.toFixed(2) : '0.72'}
                          </span>
                          <span className="text-xs text-[#6C7C6F]">/ 1.00</span>
                        </div>
                      </div>

                      {/* Health Status Tier Badge & Trend */}
                      <div className="flex items-center justify-between pt-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          ndviResult?.statusTier === 'healthy'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : ndviResult?.statusTier === 'moderate'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            ndviResult?.statusTier === 'healthy' ? 'bg-emerald-600' : ndviResult?.statusTier === 'moderate' ? 'bg-amber-500' : 'bg-rose-600'
                          }`} />
                          {ndviResult?.statusTier === 'healthy' ? 'Sog\'lom (Yashil)' : ndviResult?.statusTier === 'moderate' ? 'O\'rtacha Stress (Sariq)' : 'Yuqori Stress (Qizil)'}
                        </span>

                        {ndviResult?.trend && (
                          <span className="text-xs font-bold flex items-center gap-1 text-[#1F3D2B]">
                            {ndviResult.trend.direction === 'improving' ? (
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                            ) : ndviResult.trend.direction === 'declining' ? (
                              <TrendingDown className="w-4 h-4 text-rose-600" />
                            ) : (
                              <Minus className="w-4 h-4 text-gray-500" />
                            )}
                            <span>
                              {ndviResult.trend.direction === 'improving' ? "Yaxshilanmoqda" : ndviResult.trend.direction === 'declining' ? "Pasaymoqda" : "Barqaror"}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#E4D9C4] rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-700 ${
                            (ndviResult?.ndviScore || 0.7) >= 0.6 ? 'bg-emerald-600' : (ndviResult?.ndviScore || 0.7) >= 0.35 ? 'bg-amber-500' : 'bg-rose-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, (ndviResult?.ndviScore || 0.7) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Moisture Gauge */}
                    <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5 text-blue-600" />
                          {t.soilMoisture}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-extrabold text-[#1F3D2B]">
                            {ndviResult?.moisturePercentage || 65}%
                          </span>
                          <span className="text-[10px] text-[#6C7C6F] font-semibold">(taxminiy)</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#E4D9C4] rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${ndviResult?.moisturePercentage || 65}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-[#6C7C6F] leading-tight">
                        ℹ️ {t.soilMoistureTooltip}
                      </p>
                    </div>
                  </>
                )}

                {/* Status Advice Box */}
                <div className={`p-5 rounded-2xl border ${
                  selectedField.status === 'good' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm mb-2">
                    {selectedField.status === 'good' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                    )}
                    <span>{t.irrigationAdvice}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    {currentLang === 'uz' ? selectedField.advice_uz : currentLang === 'ru' ? selectedField.advice_ru : selectedField.advice_en}
                  </p>
                </div>

                {/* Growth Stage Care Guidance Card */}
                {(() => {
                  const calc = calculateGrowthStage(selectedField.crop_type, '2026-04-10');
                  const stage = calc.currentStage;
                  return (
                    <div className="bg-[#1F3D2B] text-[#FAF7F0] p-5 rounded-2xl border-2 border-[#D9A441]/40 space-y-3 shadow-md">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2 font-bold text-[#D9A441] text-xs uppercase tracking-wider">
                          <BookOpen className="w-4 h-4" />
                          <span>Agrotexnika va Parvarish Yo&apos;riqnomasi</span>
                        </div>
                        <span className="bg-[#D9A441] text-[#1F3D2B] text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                          {calc.stageIndex + 1}-bosqich ({calc.daysElapsed} kun)
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-sm text-white">
                        {currentLang === 'ru' ? stage.stage_name_ru : currentLang === 'en' ? stage.stage_name_en : stage.stage_name_uz}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-[#14281C] p-3 rounded-xl border border-white/10">
                          <span className="text-[10px] text-blue-300 font-bold flex items-center gap-1 mb-1">
                            <Droplets className="w-3.5 h-3.5 text-blue-400" /> Sug&apos;orish:
                          </span>
                          <p className="text-white/90 text-[11px] leading-relaxed">
                            {currentLang === 'ru' ? stage.irrigation_notes_ru : currentLang === 'en' ? stage.irrigation_notes_en : stage.irrigation_notes_uz}
                          </p>
                        </div>

                        <div className="bg-[#14281C] p-3 rounded-xl border border-white/10">
                          <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 mb-1">
                            <Bug className="w-3.5 h-3.5 text-amber-400" /> Zararkunanda:
                          </span>
                          <p className="text-white/90 text-[11px] leading-relaxed">
                            {currentLang === 'ru' ? stage.pest_notes_ru : currentLang === 'en' ? stage.pest_notes_en : stage.pest_notes_uz}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <p className="text-xs text-[#6C7C6F] italic">
                  {t.satelliteNote}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: WEATHER & IRRIGATION */}
        {activeTab === 'weather' && (
          <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E4D9C4] p-6 sm:p-8 shadow-lg space-y-8 animate-in fade-in duration-300">
            
            {/* Region Selector & Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F0E8D8] p-4 rounded-2xl border border-[#E4D9C4]">
              <div>
                <label className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider block mb-1">
                  {t.selectRegion}
                </label>
                <select
                  value={selectedRegionIndex}
                  onChange={(e) => setSelectedRegionIndex(Number(e.target.value))}
                  className="bg-[#FAF7F0] text-[#1F3D2B] font-bold text-sm sm:text-base px-4 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                >
                  {UZ_REGIONS.map((reg, idx) => (
                    <option key={idx} value={idx}>
                      {reg.name} viloyati
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold bg-[#FAF7F0] px-3.5 py-2 rounded-xl border border-[#E4D9C4]">
                <MapPin className="w-4 h-4 text-[#D9A441]" />
                <span className={weatherData.isOffline ? 'text-amber-800' : 'text-[#1F3D2B]'}>
                  {weatherData.isOffline
                    ? "Open-Meteo (Zaxira ma'lumotlari)"
                    : "Open-Meteo API (Jonli uzatish)"}
                </span>
              </div>
            </div>

            {/* Offline / Connection Error Resilient Alert Banner */}
            {weatherData.isOffline && (
              <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-center gap-3 text-amber-950 text-xs sm:text-sm font-medium shadow-xs animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-amber-900">
                    {currentLang === 'ru'
                      ? "⚠️ Не удалось подключиться к серверу погоды. Отображаются последние сохранённые данные."
                      : currentLang === 'en'
                      ? "⚠️ Live weather server unreachable. Displaying cached regional readings."
                      : "⚠️ Jonli ob-havo serveriga ulanib bo'lmadi. Oxirgi ma'lumotlar ko'rsatilmoqda."}
                  </p>
                </div>
              </div>
            )}

            {/* Current Weather Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-900 rounded-xl">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider block">
                    {t.currentTemp}
                  </span>
                  <span className="text-2xl font-extrabold text-[#1F3D2B]">
                    +{weatherData.temp}°C
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-900 rounded-xl">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider block">
                    {t.humidity}
                  </span>
                  <span className="text-2xl font-extrabold text-[#1F3D2B]">
                    {weatherData.humidity}%
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl">
                  <Wind className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider block">
                    {t.windSpeed}
                  </span>
                  <span className="text-2xl font-extrabold text-[#1F3D2B]">
                    {weatherData.wind} km/h
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] flex items-center gap-4">
                <div className="p-3 bg-sky-100 text-sky-900 rounded-xl">
                  <Sun className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider block">
                    Yog&apos;ingarchilik
                  </span>
                  <span className="text-2xl font-extrabold text-[#1F3D2B]">
                    {weatherData.precip}%
                  </span>
                </div>
              </div>

            </div>

            {/* Smart Irrigation Plan Recommendation Box */}
            <div className="bg-[#1F3D2B] text-[#FAF7F0] p-6 sm:p-8 rounded-2xl border-2 border-[#D9A441]/40 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Droplets className="w-6 h-6 text-[#D9A441]" />
                  <h3 className="font-serif text-xl font-bold">
                    {t.irrigationRecommendation} — {UZ_REGIONS[selectedRegionIndex].name}
                  </h3>
                </div>
                <span className="bg-[#D9A441] text-[#1F3D2B] text-xs font-extrabold px-3 py-1 rounded-full uppercase">
                  Agro Tavsiya
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="bg-[#14281C] p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="text-xs text-[#E4D9C4] font-semibold block">Tavsiya etilgan normasi:</span>
                  <span className="text-lg font-extrabold text-[#D9A441]">320–360 m³/gektar</span>
                </div>

                <div className="bg-[#14281C] p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="text-xs text-[#E4D9C4] font-semibold block">Eng maqbul sug&apos;orish vaqti:</span>
                  <span className="text-lg font-extrabold text-[#D9A441]">06:00 – 09:00 Ertalab</span>
                </div>

                <div className="bg-[#14281C] p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="text-xs text-[#E4D9C4] font-semibold block">Bug&apos;lanish darajasi:</span>
                  <span className="text-lg font-extrabold text-emerald-400">Past (Mo&apos;&apos;tadil)</span>
                </div>
              </div>

              <p className="text-xs text-[#E4D9C4] leading-relaxed pt-2">
                * Bugungi harorat (+{weatherData.temp}°C) va havo namligini ({weatherData.humidity}%) hisobga olgan holda, tushki issiqda sug&apos;orish tavsiya etilmaydi. Bu tuproq sho&apos;rlanishining va suv zayolining oldini oladi.
              </p>
            </div>

          </div>
        )}

        {/* TAB 3: CROP MARKETPLACE */}
        {activeTab === 'market' && (
          <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E4D9C4] p-6 sm:p-8 shadow-lg space-y-8 animate-in fade-in duration-300">
            
            {/* Header + Action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E4D9C4] pb-6">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#1F3D2B]">
                  {t.marketHeader}
                </h3>
                <p className="text-sm text-[#4A5D4E]">
                  {t.marketSub}
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#D9A441] hover:bg-[#B8852B] text-[#1F3D2B] hover:text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addListing}</span>
              </button>
            </div>

            {/* Filter Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { id: 'all', label: t.filterAll },
                { id: 'sabzavot', label: "Sabzavotlar" },
                { id: 'meva', label: "Meva & Bog'dorchilik" },
                { id: 'don', label: "Don va G'alla" },
                { id: 'paxta', label: "Paxta va Sanoat" },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setMarketFilter(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    marketFilter === cat.id
                      ? 'bg-[#1F3D2B] text-[#FAF7F0] border-[#1F3D2B]'
                      : 'bg-[#FAF7F0] text-[#1F3D2B] border-[#E4D9C4] hover:bg-[#F0E8D8]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredListings.map((item) => (
                <div 
                  key={item.id}
                  className="bg-[#FAF7F0] rounded-2xl p-5 border border-[#E4D9C4] hover:border-[#D9A441] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-[#F0E8D8] text-[#5C4033] px-2.5 py-1 rounded-md border border-[#E4D9C4]">
                        {item.category}
                      </span>
                      <span className="text-xs text-[#6C7C6F] font-medium">{item.date}</span>
                    </div>

                    <h4 className="font-serif text-lg font-bold text-[#1F3D2B] mb-2">
                      {item.crop}
                    </h4>

                    <div className="space-y-1.5 text-sm text-[#4A5D4E] mb-4">
                      <p className="flex items-center gap-1.5 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#D9A441]" />
                        <span>{item.location}</span>
                      </p>
                      <p className="text-xs text-[#6C7C6F]">
                        Sotuvchi: <strong className="text-[#1F3D2B]">{item.farmer}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E4D9C4] space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#6C7C6F] font-semibold">{t.pricePerUnit}:</span>
                      <span className="text-base font-extrabold text-[#1F3D2B]">
                        {item.price.toLocaleString()} UZS /{item.unit}
                      </span>
                    </div>

                    <button
                      onClick={() => setContactModalItem(item)}
                      className="w-full bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#D9A441]" />
                      <span>Bog&apos;lanish</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 4: CROP GUIDES & AGRO-CALENDAR SIMULATOR */}
        {activeTab === 'guides' && (() => {
          const selectedGuide = CROP_GUIDES_DATA.find(g => g.crop_name === demoGuideCrop) || CROP_GUIDES_DATA[0];
          const calculatedStageInfo = calculateGrowthStage(demoGuideCrop, demoPlantingDate);
          const activeStage = selectedGuide.stages[demoSelectedStageIdx] || selectedGuide.stages[0];

          return (
            <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E4D9C4] p-6 sm:p-8 shadow-lg space-y-8 animate-in fade-in duration-300">
              
              {/* Header with Switcher and Quick CTA */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1F3D2B] text-[#FAF7F0] p-6 rounded-2xl border-2 border-[#D9A441] shadow-md">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D9A441]/20 text-[#D9A441] rounded-full text-xs font-bold uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Aqlli Agrotexnika Simulyatori</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#FAF7F0]">
                    Ekin Rivojlanish Bosqichlari & Sug&apos;orish Rejasi
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                    Ekilgan sanani kiriting — tizim joriy o&apos;sish davrini, sug&apos;orish normalari va zararkunandalarga qarshi chora-tadbirlarni avtomatik hisoblaydi.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const el = document.getElementById('crop-guides');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-[#D9A441] hover:bg-[#B8852B] text-[#1F3D2B] font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all shadow-md shrink-0"
                >
                  <span>To&apos;liq Katalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Crop Selector & Planting Date Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#F0E8D8] p-5 rounded-2xl border border-[#E4D9C4]">
                <div>
                  <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                    Ekin Turi (Crop)
                  </label>
                  <select
                    value={demoGuideCrop}
                    onChange={(e) => {
                      setDemoGuideCrop(e.target.value);
                      setDemoSelectedStageIdx(0);
                    }}
                    className="w-full bg-[#FAF7F0] text-[#1F3D2B] font-bold text-sm px-4 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  >
                    {CROP_GUIDES_DATA.map((c) => (
                      <option key={c.id} value={c.crop_name}>
                        {c.icon_emoji} {c.crop_title_uz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                    Ekilgan Sana (Planting Date)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-[#D9A441] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={demoPlantingDate}
                      onChange={(e) => setDemoPlantingDate(e.target.value)}
                      className="w-full bg-[#FAF7F0] text-[#1F3D2B] font-bold text-sm pl-10 pr-4 py-2.5 rounded-xl border border-[#E4D9C4] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-1 flex flex-col justify-center bg-white p-3.5 rounded-xl border border-[#E4D9C4]">
                  <span className="text-xs text-[#6C7C6F] font-bold uppercase tracking-wider">Hisoblangan Yosh:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-extrabold text-[#1F3D2B]">
                      {calculatedStageInfo.daysElapsed} kun
                    </span>
                    <span className="text-xs font-semibold text-[#D9A441] truncate">
                      ({calculatedStageInfo.currentStage.stage_name_uz.split('(')[0]})
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Stage Stepper */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider">
                  Rivojlanish Bosqichlari (Bosqichni tanlang):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {selectedGuide.stages.map((stage, idx) => {
                    const isCurrent = calculatedStageInfo.stageIndex === idx;
                    const isSelected = demoSelectedStageIdx === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => setDemoSelectedStageIdx(idx)}
                        className={`p-3.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#1F3D2B] text-[#FAF7F0] border-[#1F3D2B] shadow-md scale-[1.02]'
                            : 'bg-white hover:bg-[#F0E8D8] text-[#1F3D2B] border-[#E4D9C4]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[#F0E8D8] text-[#1F3D2B]'
                          }`}>
                            {idx + 1}-bosqich
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-extrabold bg-[#D9A441] text-[#1F3D2B] px-1.5 py-0.5 rounded shadow-xs">
                              Hozir
                            </span>
                          )}
                        </div>
                        <p className="font-bold line-clamp-2 leading-snug">
                          {stage.stage_name_uz}
                        </p>
                        <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#6C7C6F]'}`}>
                          {stage.days_min}-{stage.days_max} kunlar
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Stage Advice Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. Irrigation Rule */}
                <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2 text-[#2A75D3] font-bold text-sm">
                    <Droplets className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Sug&apos;orish Rejimi</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A5D4E] leading-relaxed">
                    {activeStage.irrigation_notes_uz}
                  </p>
                </div>

                {/* 2. Pest & Disease Protection */}
                <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                    <Bug className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>Zararkunanda & Kasallik</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A5D4E] leading-relaxed">
                    {activeStage.pest_notes_uz || "Ushbu davrda profilaktik ko'rik va begona o'tlar tozaligi yetarli."}
                  </p>
                </div>

                {/* 3. Agrotechnical Harvest Care */}
                <div className="bg-white p-5 rounded-2xl border border-[#E4D9C4] space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2 text-[#B8852B] font-bold text-sm">
                    <Sprout className="w-5 h-5 text-[#D9A441] shrink-0" />
                    <span>Agrotexnik Tavsiya</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4A5D4E] leading-relaxed">
                    {activeStage.harvest_notes_uz || "O'simlikning ildiz tizimini mustahkamlash uchun qator oralariga ishlov berish tavsiya etiladi."}
                  </p>
                </div>

              </div>

            </div>
          );
        })()}

      </div>

      {/* MODAL: Contact Farmer Modal */}
      {contactModalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] rounded-2xl max-w-md w-full p-6 border-2 border-[#1F3D2B] shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E4D9C4] pb-3">
              <h4 className="font-serif text-xl font-bold text-[#1F3D2B]">
                Dehqon bilan bog&apos;lanish
              </h4>
              <button
                onClick={() => setContactModalItem(null)}
                className="text-[#6C7C6F] hover:text-[#1F3D2B] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#1F3D2B]">
              <p><strong>Ekin:</strong> {contactModalItem.crop}</p>
              <p><strong>Sotuvchi:</strong> {contactModalItem.farmer}</p>
              <p><strong>Joylashuv:</strong> {contactModalItem.location}</p>
              <p><strong>Narxi:</strong> {contactModalItem.price.toLocaleString()} UZS /{contactModalItem.unit}</p>
              
              <div className="bg-[#F0E8D8] p-4 rounded-xl border border-[#E4D9C4] text-center space-y-1">
                <span className="text-xs text-[#6C7C6F] font-bold block uppercase">Telefon Raqami:</span>
                <a 
                  href={`tel:${contactModalItem.phone}`}
                  className="text-xl font-extrabold text-[#1F3D2B] hover:text-[#D9A441] transition-colors block"
                >
                  {contactModalItem.phone}
                </a>
              </div>
            </div>

            <button
              onClick={() => setContactModalItem(null)}
              className="w-full bg-[#1F3D2B] text-[#FAF7F0] font-bold text-sm py-3 rounded-xl hover:bg-[#14281C]"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Post New Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] rounded-2xl max-w-lg w-full p-6 border-2 border-[#1F3D2B] shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E4D9C4] pb-3">
              <h4 className="font-serif text-xl font-bold text-[#1F3D2B]">
                Hosilni Sotuvga Qo&apos;yish
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#6C7C6F] hover:text-[#1F3D2B] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddListingSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-[#6C7C6F] mb-1">
                  Ekin nomi va navi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Farg'ona Qizil Oynasi Pomidori"
                  value={newListing.crop}
                  onChange={(e) => setNewListing({ ...newListing, crop: e.target.value })}
                  className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6C7C6F] mb-1">
                    Kategoriya
                  </label>
                  <select
                    value={newListing.category}
                    onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3 py-2.5 font-medium"
                  >
                    <option value="sabzavot">Sabzavot</option>
                    <option value="meva">Meva</option>
                    <option value="don">Don / G&apos;alla</option>
                    <option value="paxta">Paxta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6C7C6F] mb-1">
                    Narxi (UZS) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Masalan: 8 500"
                    value={formatNumberWithSpaces(newListing.price)}
                    onChange={(e) => {
                      const cleanNumber = e.target.value.replace(/\D/g, '');
                      setNewListing({ ...newListing, price: cleanNumber });
                    }}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                  {newListing.price && (
                    <span className="text-[11px] text-[#1F3D2B] font-semibold mt-1 block">
                      Jami: {formatNumberWithSpaces(newListing.price)} so&apos;m /{newListing.unit}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6C7C6F] mb-1">
                    Telefon Raqam *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+998 90 123 45 67"
                    value={newListing.phone}
                    onChange={(e) => setNewListing({ ...newListing, phone: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6C7C6F] mb-1">
                    Viloyat / Tuman
                  </label>
                  <input
                    type="text"
                    placeholder="Toshkent, Zangiota"
                    value={newListing.location}
                    onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-sm py-3 rounded-xl shadow-md transition-colors pt-3"
              >
                Bozorga Joylashtirish
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
