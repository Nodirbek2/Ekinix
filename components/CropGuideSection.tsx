'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Language, translations } from '@/lib/i18n';
import { 
  CROP_GUIDES_DATA, 
  CropGuideItem, 
  CropStageCare, 
  calculateGrowthStage 
} from '@/lib/cropGuidesData';
import { FarmerProfile, FieldRecord, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, SectionLoader } from '@/components/ui/StateFeedback';
import { 
  BookOpen, Droplets, Bug, Sparkles, Calendar, 
  ChevronRight, ChevronDown, CheckCircle2, ShieldAlert, 
  Sprout, Filter, Database, ArrowRight, Search, X, 
  FlaskConical, Check, Layers, AlertCircle, Compass, 
  ArrowUpRight, Info, Eye, ExternalLink, Leaf, Plus
} from 'lucide-react';

interface CropGuideSectionProps {
  currentLang: Language;
  userProfile?: FarmerProfile | null;
  onNavigateToFields?: () => void;
}

type CarePillarId = 'irrigation' | 'fertilization' | 'pests' | 'harvest';

export const CropGuideSection: React.FC<CropGuideSectionProps> = ({ 
  currentLang, 
  userProfile,
  onNavigateToFields 
}) => {
  const t = translations[currentLang];

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyMyCrops, setOnlyMyCrops] = useState<boolean>(false);

  // Active Stage Index per crop
  const [selectedStageIndex, setSelectedStageIndex] = useState<Record<string, number>>({
    cotton: 0,
    wheat: 0,
    apple: 0,
    grape: 0,
    pomegranate: 0,
    tomato: 0,
  });

  // Active care pillar per crop card (default to irrigation)
  const [activeCarePillar, setActiveCarePillar] = useState<Record<string, CarePillarId>>({
    cotton: 'irrigation',
    wheat: 'irrigation',
    apple: 'irrigation',
    grape: 'irrigation',
    pomegranate: 'irrigation',
    tomato: 'irrigation',
  });

  // Expanded Accordion sections per crop (if viewing all 4 pillars)
  const [expandedSections, setExpandedSections] = useState<Record<string, Record<CarePillarId, boolean>>>({});

  // View mode per crop: 'tabbed' (clean tabs) or 'accordion' (expandable cards)
  const [viewMode, setViewMode] = useState<'tabbed' | 'accordion'>('tabbed');

  // Interactive Estimator state
  const [testPlantingDate, setTestPlantingDate] = useState<string>('2026-04-10');
  const [testCrop, setTestCrop] = useState<string>('cotton');

  // Supabase sync & Farmer fields state
  const [supabaseSynced, setSupabaseSynced] = useState<boolean>(false);
  const [userFields, setUserFields] = useState<FieldRecord[]>([]);
  const [loadingFields, setLoadingFields] = useState<boolean>(true);

  // Target card ref map for smooth scrolling from top highlights
  const cropCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Load farmer's registered fields
  useEffect(() => {
    let isMounted = true;

    async function loadFields() {
      setLoadingFields(true);
      let list: FieldRecord[] = [];

      // 1. Try local storage
      try {
        const saved = localStorage.getItem('ekinix_farmer_fields');
        if (saved) {
          list = JSON.parse(saved);
        }
      } catch {
        // ignore
      }

      // 2. Try Supabase
      const client = supabase;
      if (isSupabaseConfigured && client && userProfile?.user_id) {
        try {
          const { data, error } = await client
            .from('fields')
            .select('*')
            .or(`user_id.eq.${userProfile.user_id},farmer_id.eq.${userProfile.id || 'none'}`)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            list = data.map((item: any) => ({
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
          }
        } catch (err) {
          console.warn('[CropGuideSection] Supabase field fetch notice:', err);
        }
      }

      // 3. Fallback demo fields if logged in with demo profile or no fields yet
      if (list.length === 0 && userProfile?.primary_crops && userProfile.primary_crops.length > 0) {
        list = userProfile.primary_crops.map((cropId, idx) => ({
          id: `profile_crop_${cropId}_${idx}`,
          name: `${userProfile.region || 'Toshkent'} ${cropId === 'cotton' ? 'Paxta maydoni' : cropId === 'wheat' ? 'Bug\'doy maydoni' : 'Bog\'i'}`,
          crop_type: cropId,
          planting_date: cropId === 'wheat' ? '2025-11-10' : '2026-04-12',
          area_hectares: 5.0 + idx * 2.5,
          region: userProfile.region || 'Toshkent viloyati',
          coordinates: [],
        }));
      }

      if (isMounted) {
        setUserFields(list);
        setLoadingFields(false);

        if (list.length > 0) {
          const initialStageMap: Record<string, number> = {};
          list.forEach(f => {
            const stageCalc = calculateGrowthStage(f.crop_type, f.planting_date);
            initialStageMap[stageCalc.guide.crop_name] = stageCalc.stageIndex;
          });
          setSelectedStageIndex(prev => ({ ...prev, ...initialStageMap }));
          setTestCrop(list[0].crop_type);
          if (list[0].planting_date) {
            setTestPlantingDate(list[0].planting_date);
          }
        }
      }
    }

    loadFields();

    return () => {
      isMounted = false;
    };
  }, [userProfile]);

  // Distinct crops that the user actually grows
  const userCropNames = useMemo(() => {
    const set = new Set<string>();
    userFields.forEach(f => {
      const norm = (f.crop_type || '').toLowerCase();
      if (norm.includes('cotton') || norm.includes('paxta')) set.add('cotton');
      else if (norm.includes('wheat') || norm.includes('bugdoy')) set.add('wheat');
      else if (norm.includes('apple') || norm.includes('olma')) set.add('apple');
      else if (norm.includes('grape') || norm.includes('uzum')) set.add('grape');
      else if (norm.includes('pomegranate') || norm.includes('anor')) set.add('pomegranate');
      else if (norm.includes('tomato') || norm.includes('pomidor')) set.add('tomato');
      else set.add(norm);
    });
    return Array.from(set);
  }, [userFields]);

  // User Field Growth Stage Calculations
  const userFieldGrowthStages = useMemo(() => {
    return userFields.map(f => {
      const calc = calculateGrowthStage(f.crop_type, f.planting_date);
      return {
        field: f,
        calc,
      };
    });
  }, [userFields]);

  // Filtered crop guides based on category, search query, and "only my crops" toggle
  const filteredCrops = useMemo(() => {
    return CROP_GUIDES_DATA.filter((crop) => {
      // Category filter
      const matchesCat = selectedCategory === 'all' || crop.category === selectedCategory;

      // "My crops" filter
      const matchesMyCrops = !onlyMyCrops || userCropNames.includes(crop.crop_name);

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        crop.crop_title_uz.toLowerCase().includes(q) ||
        crop.crop_title_ru.toLowerCase().includes(q) ||
        crop.crop_title_en.toLowerCase().includes(q) ||
        crop.summary_uz.toLowerCase().includes(q) ||
        crop.summary_ru.toLowerCase().includes(q) ||
        crop.category.toLowerCase().includes(q) ||
        crop.crop_name.toLowerCase().includes(q);

      return matchesCat && matchesMyCrops && matchesSearch;
    });
  }, [selectedCategory, onlyMyCrops, searchQuery, userCropNames]);

  // Helper to switch stage on a crop card
  const handleStageSelect = (cropName: string, stageIdx: number) => {
    setSelectedStageIndex((prev) => ({
      ...prev,
      [cropName]: stageIdx,
    }));
  };

  // Helper to switch care pillar tab
  const handlePillarSelect = (cropName: string, pillar: CarePillarId) => {
    setActiveCarePillar((prev) => ({
      ...prev,
      [cropName]: pillar,
    }));
  };

  // Helper to toggle accordion section
  const handleAccordionToggle = (cropName: string, pillar: CarePillarId) => {
    setExpandedSections((prev) => {
      const cropSecs = prev[cropName] || {
        irrigation: true,
        fertilization: false,
        pests: false,
        harvest: false,
      };
      return {
        ...prev,
        [cropName]: {
          ...cropSecs,
          [pillar]: !cropSecs[pillar],
        },
      };
    });
  };

  // Jump from top user field highlight card down to that crop's guide
  const handleJumpToCrop = (cropName: string, stageIdx: number) => {
    setSelectedStageIndex((prev) => ({ ...prev, [cropName]: stageIdx }));
    // Reset "only my crops" if needed so crop is visible
    if (selectedCategory !== 'all') setSelectedCategory('all');
    setSearchQuery('');

    // Scroll smoothly to target card
    setTimeout(() => {
      const targetElem = cropCardRefs.current[cropName];
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add subtle flash animation
        targetElem.classList.add('ring-4', 'ring-[#D9A441]');
        setTimeout(() => {
          targetElem.classList.remove('ring-4', 'ring-[#D9A441]');
        }, 2000);
      }
    }, 100);
  };

  // Calculated stage from interactive test estimator
  const currentCalc = calculateGrowthStage(testCrop, testPlantingDate);

  return (
    <section id="crop-guides" className="space-y-8 pb-16">
      
      {/* 1. HEADER BANNER */}
      <div className="bg-[#1F3D2B] text-[#FAF7F0] rounded-3xl p-6 sm:p-8 border-2 border-[#D9A441]/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-[#D9A441]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#D9A441]/20 border border-[#D9A441]/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#D9A441]">
            <BookOpen className="w-4 h-4 text-[#D9A441]" />
            <span>
              {currentLang === 'ru'
                ? 'Агротехника и защита растений Узбекистана'
                : currentLang === 'en'
                ? 'Uzbekistan Crop Agronomy & Plant Care'
                : "O'zbekiston Dehqonchilik Agrotexnikasi"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            {currentLang === 'ru'
              ? 'Руководство по уходу за культурами'
              : currentLang === 'en'
              ? 'Smart Crop Care & Agronomy Guides'
              : "Ekinlar Parvarishi va Agrotexnika Qoidalari"}
          </h1>

          <p className="text-sm sm:text-base text-white/80 leading-relaxed font-sans">
            {currentLang === 'ru'
              ? 'Пошаговые научно обоснованные рекомендации по поливу, удобрению, борьбе с вредителями и уборке урожая для каждой фазы вегетации.'
              : currentLang === 'en'
              ? 'Scientific stage-by-stage norms for irrigation dosage, fertilizer formulas, integrated pest defense, and harvest timing.'
              : "Har bir o'sish bosqichida sug'orish me'yori (m³/ga), NPK o'g'itlash dozasi, zararkunandalarga biologik himoya va hosil yig'imi qoidalari."}
          </p>

          {/* User Fields Summary Badge */}
          {userFields.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-white/10 text-white px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#D9A441]" />
                <span>
                  {currentLang === 'ru' 
                    ? `У вас ${userFields.length} зарегистрированных полей` 
                    : `Sizda ${userFields.length} ta ro'yxatdan o'tgan maydon bor`}
                </span>
              </span>

              <span className="bg-[#D9A441]/20 text-[#D9A441] px-3 py-1.5 rounded-xl border border-[#D9A441]/40 font-semibold">
                {currentLang === 'ru'
                  ? 'Культуры привязаны к вашим фазам роста'
                  : "Ekinlar joriy o'sish bosqichiga moslashtirilgan"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. LOGGED-IN FARMER'S ACTUAL FIELDS & LIVE GROWTH STAGE HIGHLIGHTS (TOP PRIORITY) */}
      {loadingFields ? (
        <div className="bg-[#FAF7F0] rounded-3xl p-6 border-2 border-[#1F3D2B]/30 shadow-md space-y-4">
          <div className="h-6 bg-[#F0E8D8] rounded-md w-48 animate-pulse" />
          <CardSkeleton count={3} height="h-44" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />
        </div>
      ) : userFieldGrowthStages.length > 0 ? (
        <div className="bg-[#FAF7F0] rounded-3xl p-6 border-2 border-[#1F3D2B]/30 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E4D9C4] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#1F3D2B] text-white flex items-center justify-center text-base shadow-xs">
                🌾
              </span>
              <div>
                <h2 className="text-lg font-serif font-bold text-[#1F3D2B]">
                  {currentLang === 'ru'
                    ? 'Ваши посевы — Текущие фазы и рекомендации'
                    : currentLang === 'en'
                    ? 'Your Active Crops — Live Growth Stages'
                    : "Sizning Ekinlaringiz — Joriy Rivojlanish Bosqichlari"}
                </h2>
                <p className="text-xs text-[#6C7C6F]">
                  {currentLang === 'ru'
                    ? 'Рассчитано на основе дат посадки ваших зарегистрированных полей'
                    : "Maydonlaringiz ekilgan sanasi bo'yicha hisoblangan joriy agrotexnika holati"}
                </p>
              </div>
            </div>

            {onNavigateToFields && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onNavigateToFields}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Maydonlar boshqaruvi
              </Button>
            )}
          </div>

          {/* Cards for each user field */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userFieldGrowthStages.map(({ field, calc }) => {
              const stage = calc.currentStage;
              const guide = calc.guide;
              const stagePercent = Math.round(((calc.stageIndex + 1) / calc.totalStages) * 100);

              return (
                <div
                  key={field.id}
                  className="bg-white rounded-2xl p-4 border border-[#E4D9C4] shadow-xs hover:shadow-md hover:border-[#1F3D2B]/40 transition-all flex flex-col justify-between space-y-3"
                >
                  {/* Field Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-1 bg-[#FAF7F0] rounded-xl border border-[#E4D9C4]">
                          {guide.icon_emoji}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-[#1F3D2B] line-clamp-1">{field.name}</h3>
                          <p className="text-[11px] text-[#6C7C6F] flex items-center gap-1">
                            <span>{field.region || userProfile?.region || 'Toshkent'}</span>
                            <span>•</span>
                            <span>{field.area_hectares} ga</span>
                          </p>
                        </div>
                      </div>

                      <span className="bg-[#D9A441]/20 text-[#1F3D2B] text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap">
                        {calc.daysElapsed} kun o&apos;tdi
                      </span>
                    </div>

                    {/* Growth Stage Progress */}
                    <div className="mt-3 bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4D9C4]/70 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#1F3D2B]">
                          {currentLang === 'ru' ? stage.stage_name_ru : currentLang === 'en' ? stage.stage_name_en : stage.stage_name_uz}
                        </span>
                        <span className="text-[#6C7C6F] font-mono text-[10px]">
                          {calc.stageIndex + 1}/{calc.totalStages}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-[#E4D9C4] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#1F3D2B] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${stagePercent}%` }} 
                        />
                      </div>
                    </div>

                    {/* Quick 2-Pillar Reminders */}
                    <div className="mt-2 space-y-1.5 text-[11px]">
                      <div className="flex items-start gap-1.5 text-blue-900 bg-blue-50/60 p-2 rounded-lg border border-blue-100">
                        <Droplets className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">
                          <strong className="text-blue-800">Sug&apos;orish:</strong> {currentLang === 'ru' ? stage.irrigation_notes_ru : stage.irrigation_notes_uz}
                        </span>
                      </div>

                      {stage.fertilization_notes_uz && (
                        <div className="flex items-start gap-1.5 text-emerald-900 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                          <FlaskConical className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-tight">
                            <strong className="text-emerald-800">O&apos;g&apos;it:</strong> {currentLang === 'ru' ? stage.fertilization_notes_ru : stage.fertilization_notes_uz}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Jump Action Button */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleJumpToCrop(guide.crop_name, calc.stageIndex)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5 text-[#D9A441]" />}
                    className="w-full mt-2 text-xs"
                  >
                    To&apos;liq Yo&apos;riqnomani Ko&apos;rish
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Encouragement banner for visitors / farmers without fields */
        <div className="bg-white rounded-3xl p-6 border border-[#E4D9C4] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D9A441]/20 text-[#1F3D2B] flex items-center justify-center text-2xl shrink-0">
              🌱
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F3D2B]">
                {currentLang === 'ru'
                  ? 'Привяжите свои поля для персонализированного ухода'
                  : "Maydonlaringizni kiriting va shaxsiy agrotexnika tavsiyalarini oling"}
              </h3>
              <p className="text-xs text-[#6C7C6F] mt-0.5">
                {currentLang === 'ru'
                  ? 'Система автоматически рассчитает точную фазу роста вашей культуры по дате посадки.'
                  : "Ekilgan sana asosida ekinning joriy rivojlanish bosqichi va bugungi sug'orish/o'g'itlash me'yori avtomatik ko'rsatiladi."}
              </p>
            </div>
          </div>

          {onNavigateToFields && (
            <Button
              variant="primary"
              size="md"
              onClick={onNavigateToFields}
              leftIcon={<Plus className="w-4 h-4 text-[#D9A441]" />}
              className="shrink-0"
            >
              + Maydon Qo&apos;shish
            </Button>
          )}
        </div>
      )}

      {/* 3. SEARCH & CATEGORY FILTER BAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E4D9C4] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6C7C6F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentLang === 'ru'
                  ? "Поиск по культуре или слову (пахта, помидор, оидиум, NPK)..."
                  : currentLang === 'en'
                  ? "Search by crop or keyword (cotton, tomato, irrigation, pests)..."
                  : "Ekin nomi yoki kalit so'z bo'yicha qidiruv (paxta, bug'doy, o'g'it, zararkunanda)..."
              }
              className="w-full pl-10 pr-10 py-2.5 bg-[#FAF7F0] border border-[#E4D9C4] rounded-2xl text-xs sm:text-sm text-[#1A281E] focus:outline-none focus:border-[#1F3D2B] focus:ring-1 focus:ring-[#1F3D2B]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C7C6F] hover:text-[#1A281E]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Tabbed vs Accordion */}
          <div className="flex items-center gap-1.5 bg-[#FAF7F0] p-1 rounded-2xl border border-[#E4D9C4] self-start sm:self-auto">
            <button
              onClick={() => setViewMode('tabbed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'tabbed'
                  ? 'bg-[#1F3D2B] text-white shadow-xs'
                  : 'text-[#6C7C6F] hover:text-[#1F3D2B]'
              }`}
              title="Kategoriyalar bo'yicha toza ko'rinish"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ichki Bo&apos;limlar (Tab)</span>
            </button>

            <button
              onClick={() => setViewMode('accordion')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'accordion'
                  ? 'bg-[#1F3D2B] text-white shadow-xs'
                  : 'text-[#6C7C6F] hover:text-[#1F3D2B]'
              }`}
              title="Barcha bo'limlarni yoyilgan ko'rinishda ochish"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Yoyilma (Akkordeon)</span>
            </button>
          </div>

        </div>

        {/* Category Pills & "My Crops" Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          
          {/* All Crops */}
          <button
            onClick={() => { setSelectedCategory('all'); setOnlyMyCrops(false); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'all' && !onlyMyCrops
                ? 'bg-[#1F3D2B] text-[#FAF7F0] ring-2 ring-[#D9A441]'
                : 'bg-[#FAF7F0] text-[#6C7C6F] hover:bg-[#F0E8D8] border border-[#E4D9C4]'
            }`}
          >
            <span>Barcha Ekinlar ({CROP_GUIDES_DATA.length})</span>
          </button>

          {/* My Crops Filter Pill */}
          {userCropNames.length > 0 && (
            <button
              onClick={() => setOnlyMyCrops(!onlyMyCrops)}
              className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                onlyMyCrops
                  ? 'bg-[#D9A441] text-[#1F3D2B] border-[#D9A441] ring-2 ring-[#1F3D2B]'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span>🌿 Mening Ekinlarim ({userCropNames.length})</span>
            </button>
          )}

          {/* Category: Paxta */}
          <button
            onClick={() => { setSelectedCategory('paxta'); setOnlyMyCrops(false); }}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'paxta' && !onlyMyCrops
                ? 'bg-[#1F3D2B] text-[#FAF7F0] ring-2 ring-[#D9A441]'
                : 'bg-[#FAF7F0] text-[#6C7C6F] hover:bg-[#F0E8D8] border border-[#E4D9C4]'
            }`}
          >
            <span>☁️ Paxtachilik</span>
          </button>

          {/* Category: Don */}
          <button
            onClick={() => { setSelectedCategory('don'); setOnlyMyCrops(false); }}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'don' && !onlyMyCrops
                ? 'bg-[#1F3D2B] text-[#FAF7F0] ring-2 ring-[#D9A441]'
                : 'bg-[#FAF7F0] text-[#6C7C6F] hover:bg-[#F0E8D8] border border-[#E4D9C4]'
            }`}
          >
            <span>🌾 Don Ekinlari</span>
          </button>

          {/* Category: Meva */}
          <button
            onClick={() => { setSelectedCategory('meva'); setOnlyMyCrops(false); }}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'meva' && !onlyMyCrops
                ? 'bg-[#1F3D2B] text-[#FAF7F0] ring-2 ring-[#D9A441]'
                : 'bg-[#FAF7F0] text-[#6C7C6F] hover:bg-[#F0E8D8] border border-[#E4D9C4]'
            }`}
          >
            <span>🍎 Bog&apos;dorchilik & Meva</span>
          </button>

          {/* Category: Sabzavot */}
          <button
            onClick={() => { setSelectedCategory('sabzavot'); setOnlyMyCrops(false); }}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === 'sabzavot' && !onlyMyCrops
                ? 'bg-[#1F3D2B] text-[#FAF7F0] ring-2 ring-[#D9A441]'
                : 'bg-[#FAF7F0] text-[#6C7C6F] hover:bg-[#F0E8D8] border border-[#E4D9C4]'
            }`}
          >
            <span>🍅 Sabzavotlar</span>
          </button>
        </div>
      </div>

      {/* 4. CROP GUIDES CARDS LIST */}
      {filteredCrops.length > 0 ? (
        <div className="space-y-10">
          {filteredCrops.map((crop) => {
            const activeIdx = selectedStageIndex[crop.crop_name] ?? 0;
            const activeStage = crop.stages[activeIdx] || crop.stages[0];
            const activePillar = activeCarePillar[crop.crop_name] || 'irrigation';
            const isFarmerCrop = userCropNames.includes(crop.crop_name);

            return (
              <div
                key={crop.id}
                ref={(el) => { cropCardRefs.current[crop.crop_name] = el; }}
                className="bg-white rounded-3xl border-2 border-[#E4D9C4] shadow-sm hover:shadow-md transition-all overflow-hidden scroll-mt-24"
              >
                
                {/* 4.1 CROP CARD HEADER */}
                <div className="bg-[#FAF7F0] p-6 border-b border-[#E4D9C4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-13 h-13 rounded-2xl bg-[#1F3D2B] text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                      {crop.icon_emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1F3D2B]">
                          {currentLang === 'ru'
                            ? crop.crop_title_ru
                            : currentLang === 'en'
                            ? crop.crop_title_en
                            : crop.crop_title_uz}
                        </h3>
                        
                        <span className="bg-[#D9A441]/20 text-[#1F3D2B] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          {crop.category}
                        </span>

                        {isFarmerCrop && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Siz ekkan ekin</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#6C7C6F] mt-1 max-w-2xl">
                        {currentLang === 'ru'
                          ? crop.summary_ru
                          : currentLang === 'en'
                          ? crop.summary_en
                          : crop.summary_uz}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-[#1F3D2B] font-bold bg-white px-3 py-1.5 rounded-xl border border-[#E4D9C4] shrink-0 self-start sm:self-auto shadow-2xs">
                    {crop.stages.length} ta o&apos;sish bosqichi
                  </span>
                </div>

                {/* 4.2 STAGE SELECTOR STEP BAR */}
                <div className="bg-[#F0E8D8]/60 px-6 py-3 border-b border-[#E4D9C4] overflow-x-auto scrollbar-none">
                  <div className="flex items-center gap-2 min-w-max">
                    {crop.stages.map((st, idx) => {
                      const isCurrent = idx === activeIdx;
                      return (
                        <button
                          key={st.growth_stage}
                          onClick={() => handleStageSelect(crop.crop_name, idx)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            isCurrent
                              ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-sm ring-1 ring-[#D9A441]'
                              : 'bg-white text-[#6C7C6F] hover:bg-white/90 border border-[#E4D9C4]'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-mono ${
                            isCurrent ? 'bg-[#D9A441] text-[#1F3D2B] font-bold' : 'bg-[#E4D9C4] text-[#1F3D2B]'
                          }`}>
                            {idx + 1}
                          </span>
                          <span>
                            {currentLang === 'ru' ? st.stage_name_ru : currentLang === 'en' ? st.stage_name_en : st.stage_name_uz}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4.3 ACTIVE STAGE DETAILS CONTAINER */}
                <div className="p-6 sm:p-8 space-y-6">
                  
                  {/* Stage Headline & Duration Pill */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4D9C4] pb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#D9A441] shrink-0" />
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-[#1F3D2B]">
                          {activeIdx + 1}-Bosqich: {currentLang === 'ru' ? activeStage.stage_name_ru : currentLang === 'en' ? activeStage.stage_name_en : activeStage.stage_name_uz}
                        </h4>
                        <p className="text-xs text-[#6C7C6F]">
                          Ekilgandan boshlab {activeStage.days_min} – {activeStage.days_max} kunlar oralig&apos;i
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-[#1F3D2B] bg-[#FAF7F0] px-3.5 py-1.5 rounded-xl border border-[#E4D9C4] shrink-0 self-start sm:self-auto">
                      ⏳ Muddat: {activeStage.days_min} – {activeStage.days_max} kun
                    </span>
                  </div>

                  {/* 4.4 CARE SECTIONS: TABBED MODE OR ACCORDION MODE */}
                  {viewMode === 'tabbed' ? (
                    <div className="space-y-4">
                      
                      {/* 4-Pillar Tabs Navigation Switcher */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#FAF7F0] p-1.5 rounded-2xl border border-[#E4D9C4]">
                        
                        {/* Tab 1: Sug'orish */}
                        <button
                          onClick={() => handlePillarSelect(crop.crop_name, 'irrigation')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            activePillar === 'irrigation'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-blue-900/80 hover:bg-blue-50'
                          }`}
                        >
                          <Droplets className="w-4 h-4" />
                          <span>Sug&apos;orish</span>
                        </button>

                        {/* Tab 2: O'g'itlash */}
                        <button
                          onClick={() => handlePillarSelect(crop.crop_name, 'fertilization')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            activePillar === 'fertilization'
                              ? 'bg-emerald-700 text-white shadow-sm'
                              : 'text-emerald-900/80 hover:bg-emerald-50'
                          }`}
                        >
                          <FlaskConical className="w-4 h-4" />
                          <span>O&apos;g&apos;itlash</span>
                        </button>

                        {/* Tab 3: Zararkunandalar */}
                        <button
                          onClick={() => handlePillarSelect(crop.crop_name, 'pests')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            activePillar === 'pests'
                              ? 'bg-amber-700 text-white shadow-sm'
                              : 'text-amber-900/80 hover:bg-amber-50'
                          }`}
                        >
                          <Bug className="w-4 h-4" />
                          <span>Zararkunandalar</span>
                        </button>

                        {/* Tab 4: Hosil */}
                        <button
                          onClick={() => handlePillarSelect(crop.crop_name, 'harvest')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            activePillar === 'harvest'
                              ? 'bg-[#1F3D2B] text-white shadow-sm'
                              : 'text-[#1F3D2B]/80 hover:bg-[#FAF7F0]'
                          }`}
                        >
                          <Sprout className="w-4 h-4" />
                          <span>Hosil Yig&apos;ish</span>
                        </button>
                      </div>

                      {/* Active Pillar Card Body */}
                      <div className="bg-[#FAF7F0] p-6 rounded-2xl border border-[#E4D9C4] min-h-[160px] flex flex-col justify-between">
                        
                        {/* 1. Irrigation Content */}
                        {activePillar === 'irrigation' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                              <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>Sug&apos;orish Rejimi va Suv Me&apos;yori (m³/ga)</span>
                            </div>

                            <p className="text-sm text-[#1A281E] leading-relaxed">
                              {currentLang === 'ru'
                                ? activeStage.irrigation_notes_ru
                                : currentLang === 'en'
                                ? activeStage.irrigation_notes_en
                                : activeStage.irrigation_notes_uz}
                            </p>

                            <div className="pt-3 border-t border-[#E4D9C4] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6C7C6F]">
                              <span className="font-semibold text-blue-800 bg-blue-100/70 px-2.5 py-1 rounded-lg">
                                💧 Tavsiya: Tuproq namligini 70-75% saqlang
                              </span>
                              <span className="text-[#1F3D2B] font-medium">
                                Optimal vaqt: Ertalab 06:00 – 09:00 yoki kechqurun
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 2. Fertilization Content */}
                        {activePillar === 'fertilization' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                              <FlaskConical className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>O&apos;g&apos;itlash va Oziqlantirish (Mineral NPK + Mikroelementlar)</span>
                            </div>

                            <p className="text-sm text-[#1A281E] leading-relaxed">
                              {currentLang === 'ru'
                                ? (activeStage.fertilization_notes_ru || "Внесение комплексных удобрений согласно фазе развития.")
                                : currentLang === 'en'
                                ? (activeStage.fertilization_notes_en || "Apply balanced fertilizers suitable for this growth stage.")
                                : (activeStage.fertilization_notes_uz || "Ushbu bosqichda azot, fosfor va kaliy mutanosibligiga rioya qilgan holda oziqlantiriladi.")}
                            </p>

                            <div className="pt-3 border-t border-[#E4D9C4] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6C7C6F]">
                              <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                                🧪 Bargdan oziqlantirish: Mikroelementlar eritmasi
                              </span>
                              <span className="text-[#1F3D2B] font-medium">
                                Quruq ob-havoda, shamolsiz vaqtda purkash tavsiya etiladi
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 3. Pests Content */}
                        {activePillar === 'pests' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                              <Bug className="w-4 h-4 text-amber-700 shrink-0" />
                              <span>Zararkunanda va Kasalliklarga Qarshi Biologik Himoya</span>
                            </div>

                            <p className="text-sm text-[#1A281E] leading-relaxed">
                              {currentLang === 'ru'
                                ? (activeStage.pest_notes_ru || "Регулярный мониторинг и биозащита.")
                                : currentLang === 'en'
                                ? (activeStage.pest_notes_en || "Regular field scouting and integrated pest protection.")
                                : (activeStage.pest_notes_uz || "Zararkunanda va kasalliklarga qarshi doimiy biologik nazorat va profilaktik ko'rik o'tkaziladi.")}
                            </p>

                            <div className="pt-3 border-t border-[#E4D9C4] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6C7C6F]">
                              <span className="font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg">
                                🛡️ Nazorat: Haftada 2 marta dalani aylanib ko&apos;rik o&apos;tkazish
                              </span>
                              <span className="text-[#1F3D2B] font-medium">
                                Feromon tutqichlar va foydali entomofaglar (trixogramma)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 4. Harvest Content */}
                        {activePillar === 'harvest' && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[#1F3D2B] font-bold text-sm bg-[#FAF7F0] p-2.5 rounded-xl border border-[#D9A441]">
                              <Sprout className="w-4 h-4 text-[#D9A441] shrink-0" />
                              <span>Hosil Yig&apos;imi, Saqlash va Agrotexnik Tadbirlar</span>
                            </div>

                            <p className="text-sm text-[#1A281E] leading-relaxed">
                              {currentLang === 'ru'
                                ? (activeStage.harvest_notes_ru || "Своевременный сбор и закладка на хранение.")
                                : currentLang === 'en'
                                ? (activeStage.harvest_notes_en || "Timely harvesting and appropriate post-harvest storage.")
                                : (activeStage.harvest_notes_uz || "Hosil pishib yetilganda me'yorda terib olinadi va agrotexnik qoidalarga rioya qilinadi.")}
                            </p>

                            <div className="pt-3 border-t border-[#E4D9C4] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6C7C6F]">
                              <span className="font-semibold text-[#1F3D2B] bg-[#E4D9C4]/70 px-2.5 py-1 rounded-lg">
                                🌾 Sifat standarti: Quruq ob-havoda terish
                              </span>
                              <span className="text-[#1F3D2B] font-medium">
                                Maxsus ventilyatsiyalangan omborxonalarda saqlash
                              </span>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  ) : (
                    /* ACCORDION MODE: 4 COLLAPSIBLE SECTIONS */
                    <div className="space-y-3">
                      
                      {/* Section 1: Sug'orish Accordion */}
                      <div className="border border-[#E4D9C4] rounded-2xl overflow-hidden bg-[#FAF7F0]">
                        <button
                          onClick={() => handleAccordionToggle(crop.crop_name, 'irrigation')}
                          className="w-full p-4 flex items-center justify-between bg-blue-50/70 hover:bg-blue-100/70 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <Droplets className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-sm text-blue-900">Sug&apos;orish va Suv Me&apos;yori</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-blue-800 transition-transform ${
                            expandedSections[crop.crop_name]?.irrigation !== false ? 'rotate-180' : ''
                          }`} />
                        </button>

                        {expandedSections[crop.crop_name]?.irrigation !== false && (
                          <div className="p-4 bg-white border-t border-[#E4D9C4] space-y-2 text-xs text-[#1A281E]">
                            <p className="leading-relaxed">
                              {currentLang === 'ru' ? activeStage.irrigation_notes_ru : activeStage.irrigation_notes_uz}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Section 2: O'g'itlash Accordion */}
                      <div className="border border-[#E4D9C4] rounded-2xl overflow-hidden bg-[#FAF7F0]">
                        <button
                          onClick={() => handleAccordionToggle(crop.crop_name, 'fertilization')}
                          className="w-full p-4 flex items-center justify-between bg-emerald-50/70 hover:bg-emerald-100/70 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <FlaskConical className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-sm text-emerald-900">O&apos;g&apos;itlash va Oziqlantirish (NPK)</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-emerald-800 transition-transform ${
                            expandedSections[crop.crop_name]?.fertilization ? 'rotate-180' : ''
                          }`} />
                        </button>

                        {expandedSections[crop.crop_name]?.fertilization && (
                          <div className="p-4 bg-white border-t border-[#E4D9C4] space-y-2 text-xs text-[#1A281E]">
                            <p className="leading-relaxed">
                              {currentLang === 'ru' 
                                ? (activeStage.fertilization_notes_ru || "Внесение комплексных удобрений.")
                                : (activeStage.fertilization_notes_uz || "Ushbu bosqichda azot, fosfor va kaliy mutanosibligiga rioya qilinadi.")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Section 3: Zararkunandalar Accordion */}
                      <div className="border border-[#E4D9C4] rounded-2xl overflow-hidden bg-[#FAF7F0]">
                        <button
                          onClick={() => handleAccordionToggle(crop.crop_name, 'pests')}
                          className="w-full p-4 flex items-center justify-between bg-amber-50/70 hover:bg-amber-100/70 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <Bug className="w-4 h-4 text-amber-700" />
                            <span className="font-bold text-sm text-amber-900">Zararkunanda va Kasalliklar Himoyasi</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-amber-800 transition-transform ${
                            expandedSections[crop.crop_name]?.pests ? 'rotate-180' : ''
                          }`} />
                        </button>

                        {expandedSections[crop.crop_name]?.pests && (
                          <div className="p-4 bg-white border-t border-[#E4D9C4] space-y-2 text-xs text-[#1A281E]">
                            <p className="leading-relaxed">
                              {currentLang === 'ru' 
                                ? (activeStage.pest_notes_ru || "Регулярный мониторинг и биозащита.")
                                : (activeStage.pest_notes_uz || "Zararkunandalarga qarshi doimiy biologik nazorat o'tkaziladi.")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Section 4: Hosil Yig'ish Accordion */}
                      <div className="border border-[#E4D9C4] rounded-2xl overflow-hidden bg-[#FAF7F0]">
                        <button
                          onClick={() => handleAccordionToggle(crop.crop_name, 'harvest')}
                          className="w-full p-4 flex items-center justify-between bg-[#FAF7F0] hover:bg-[#F0E8D8] transition-colors text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <Sprout className="w-4 h-4 text-[#D9A441]" />
                            <span className="font-bold text-sm text-[#1F3D2B]">Hosil Yig&apos;imi va Agrotexnik Qoidalar</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-[#1F3D2B] transition-transform ${
                            expandedSections[crop.crop_name]?.harvest ? 'rotate-180' : ''
                          }`} />
                        </button>

                        {expandedSections[crop.crop_name]?.harvest && (
                          <div className="p-4 bg-white border-t border-[#E4D9C4] space-y-2 text-xs text-[#1A281E]">
                            <p className="leading-relaxed">
                              {currentLang === 'ru'
                                ? (activeStage.harvest_notes_ru || "Своевременный сбор урожая.")
                                : (activeStage.harvest_notes_uz || "Hosil pishib yetilganda sifatli terib olinadi.")}
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state when search or category filter has no matches */
        <EmptyState
          icon={<Search className="w-7 h-7 text-[#D9A441]" />}
          title={
            currentLang === 'ru'
              ? 'Культуры по вашему запросу не найдены'
              : currentLang === 'en'
              ? 'No crop guides found for this search'
              : "Qidiruv bo'yicha ekin yo'riqnomasi topilmadi"
          }
          description={
            currentLang === 'ru'
              ? 'Попробуйте изменить поисковый запрос или сбросить фильтры категорий.'
              : currentLang === 'en'
              ? 'Try adjusting your search terms or clearing the selected category filters.'
              : "Iltimos, qidiruv so'zini o'zgartiring yoki filtrlarni tozalang."
          }
          actionText={
            currentLang === 'ru' ? 'Сбросить фильтры' : currentLang === 'en' ? 'Reset filters' : 'Filtrlarni tozalash'
          }
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setOnlyMyCrops(false);
          }}
          className="my-6"
        />
      )}

      {/* 5. INTERACTIVE GROWTH STAGE CALCULATOR WIDGET */}
      <div className="bg-[#1F3D2B] text-[#FAF7F0] p-6 sm:p-8 rounded-3xl border-2 border-[#14281C] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-48 h-48 bg-[#D9A441]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-5 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#D9A441] bg-white/10 px-3 py-1 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ekin Bosqichini Hisoblash Kalkulyatori</span>
            </div>
            <h3 className="text-xl font-serif font-bold text-white">
              Ekilgan sanani kiriting — joriy bosqich tavsiyasini ko&apos;ring
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Yangi ekin ekishni rejalashtiryapsizmi? Ekin turi va taxminiy ekish sanangizni tanlang, tizim avtomatik bosqichni hisoblab beradi.
            </p>

            {/* Form Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-white/80 font-medium mb-1">Ekin turini tanlang:</label>
                <select
                  value={testCrop}
                  onChange={(e) => setTestCrop(e.target.value)}
                  className="w-full bg-[#14281C] text-white border border-white/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D9A441]"
                >
                  {CROP_GUIDES_DATA.map((g) => (
                    <option key={g.id} value={g.crop_name}>
                      {g.icon_emoji} {g.crop_title_uz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-white/80 font-medium mb-1">Ekilgan sana (Planting date):</label>
                <input
                  type="date"
                  value={testPlantingDate}
                  onChange={(e) => setTestPlantingDate(e.target.value)}
                  className="w-full bg-[#14281C] text-white border border-white/20 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D9A441]"
                />
              </div>
            </div>
          </div>

          {/* Calculated Output Display Box */}
          <div className="lg:col-span-7 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentCalc.guide.icon_emoji}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{currentCalc.guide.crop_title_uz}</h4>
                  <p className="text-[11px] text-[#D9A441]">Ekilganidan beri {currentCalc.daysElapsed} kun o&apos;tdi</p>
                </div>
              </div>

              <span className="bg-[#D9A441] text-[#1F3D2B] text-xs font-extrabold px-3 py-1 rounded-full">
                Bosqich {currentCalc.stageIndex + 1} / {currentCalc.totalStages}
              </span>
            </div>

            {/* Stage Title */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Joriy o&apos;sish bosqichi:</p>
              <p className="text-sm font-bold text-[#D9A441]">
                {currentLang === 'ru'
                  ? currentCalc.currentStage.stage_name_ru
                  : currentLang === 'en'
                  ? currentCalc.currentStage.stage_name_en
                  : currentCalc.currentStage.stage_name_uz}
              </p>
            </div>

            {/* Rapid Action Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              
              {/* Sug'orish */}
              <div className="bg-[#14281C]/90 p-2.5 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-blue-300 font-bold flex items-center gap-1 mb-1">
                    <Droplets className="w-3 h-3 text-blue-400" /> Sug&apos;orish:
                  </span>
                  <p className="text-[11px] text-white/90 line-clamp-3 leading-snug">
                    {currentLang === 'ru'
                      ? currentCalc.currentStage.irrigation_notes_ru
                      : currentLang === 'en'
                      ? currentCalc.currentStage.irrigation_notes_en
                      : currentCalc.currentStage.irrigation_notes_uz}
                  </p>
                </div>
              </div>

              {/* O'g'itlash */}
              <div className="bg-[#14281C]/90 p-2.5 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 mb-1">
                    <FlaskConical className="w-3 h-3 text-emerald-400" /> O&apos;g&apos;itlash:
                  </span>
                  <p className="text-[11px] text-white/90 line-clamp-3 leading-snug">
                    {currentLang === 'ru'
                      ? (currentCalc.currentStage.fertilization_notes_ru || "Комплексное питание.")
                      : (currentCalc.currentStage.fertilization_notes_uz || "NPK mutanosib oziqlantirish.")}
                  </p>
                </div>
              </div>

              {/* Zararkunanda */}
              <div className="bg-[#14281C]/90 p-2.5 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 mb-1">
                    <Bug className="w-3 h-3 text-amber-400" /> Zararkunanda:
                  </span>
                  <p className="text-[11px] text-white/90 line-clamp-3 leading-snug">
                    {currentLang === 'ru'
                      ? (currentCalc.currentStage.pest_notes_ru || "Мониторинг вредителей.")
                      : (currentCalc.currentStage.pest_notes_uz || "Zararkunandalarga qarshi doimiy profilaktika.")}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </section>
  );
};
