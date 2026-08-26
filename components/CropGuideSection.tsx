'use client';

import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Sprout, 
  Droplets, 
  ShieldAlert, 
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';
import { Language } from '@/lib/i18n';
import { FarmerProfile } from '@/lib/supabase';
import { CROP_GUIDES_DATA, CropGuideItem, CropStageCare } from '@/lib/cropGuidesData';

interface CropGuideSectionProps {
  currentLang?: Language;
  userProfile?: FarmerProfile | null;
  onNavigateToFields?: () => void;
}

export function CropGuideSection({
  currentLang = 'uz',
  userProfile,
  onNavigateToFields
}: CropGuideSectionProps) {
  const [selectedCropIndex, setSelectedCropIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [selectedFieldDay, setSelectedFieldDay] = useState<number>(45);

  // Localization strings
  const labels = {
    uz: {
      tag: "AGROTEXNIK XARITA VA TAVSIYALAR",
      title: "O‘zbekiston sharoitida Agrotexnik qo‘llanma",
      subtitle: "Vegetatsiya bosqichlari bo‘yicha aniq agronomik tavsiyalar, sug‘orish me’yorlari va himoya choralari",
      searchPlaceholder: "Bosqich, o‘g‘it, dori yoki vazifani qidirish...",
      allStages: "Barcha bosqichlar",
      stageBadge: "Bosqich",
      tasksHeader: "Asosiy agrotexnik vazifalar",
      irrigationHeader: "Sug‘orish rejimi",
      protectionHeader: "Himoya va Oziqlantirish",
      fertilizerSub: "O‘g‘itlash me’yori:",
      pestSub: "Zararkunandalar himoyasi:",
      harvestSub: "Maxsus tavsiya:",
      myFieldsLink: "Mening maydonlarim holatini ko‘rish",
      fieldStatusNotice: "Sizning maydoningizdagi ekin uchun tavsiya:",
      dayEstimate: "kunlik vegetatsiya",
      noResults: "Qidiruv bo‘yicha agrotexnik bosqich topilmadi",
      clearSearch: "Qidiruvni tozalash"
    },
    ru: {
      tag: "АГРОТЕХНОЛОГИЧЕСКАЯ КАРТА",
      title: "Агрономическое руководство по культурам",
      subtitle: "Точные нормы полива, внесения удобрений и защиты растений по всем фазам вегетации",
      searchPlaceholder: "Поиск по фазе, удобрению или задаче...",
      allStages: "Все фазы",
      stageBadge: "Этап",
      tasksHeader: "Основные агротехнические задачи",
      irrigationHeader: "Режим и нормы полива",
      protectionHeader: "Защита и питание растений",
      fertilizerSub: "Нормы удобрений:",
      pestSub: "Защита от вредителей:",
      harvestSub: "Особые рекомендации:",
      myFieldsLink: "Перейти к моим полям",
      fieldStatusNotice: "Рекомендация для вашей культуры:",
      dayEstimate: "дней вегетации",
      noResults: "По вашему запросу этапы не найдены",
      clearSearch: "Сбросить поиск"
    },
    en: {
      tag: "AGRONOMIC FIELD GUIDE",
      title: "Uzbekistan Crop Agronomy Guide",
      subtitle: "Precise irrigation volumes, fertilization schedules, and integrated pest management per growth stage",
      searchPlaceholder: "Search growth stage, fertilizer, or task...",
      allStages: "All stages",
      stageBadge: "Stage",
      tasksHeader: "Core Agronomic Tasks",
      irrigationHeader: "Irrigation Regimes",
      protectionHeader: "Crop Protection & Nutrition",
      fertilizerSub: "Fertilization rates:",
      pestSub: "Pest & Disease control:",
      harvestSub: "Specific advice:",
      myFieldsLink: "View My Fields Status",
      fieldStatusNotice: "Recommendation for your crop:",
      dayEstimate: "days of vegetation",
      noResults: "No matching agronomy stages found",
      clearSearch: "Clear search"
    }
  }[currentLang];

  const activeCrop = CROP_GUIDES_DATA[selectedCropIndex] || CROP_GUIDES_DATA[0];

  // Title helper
  const getCropTitle = (item: CropGuideItem) => {
    if (currentLang === 'ru') return item.crop_title_ru;
    if (currentLang === 'en') return item.crop_title_en;
    return item.crop_title_uz;
  };

  // Summary helper
  const getCropSummary = (item: CropGuideItem) => {
    if (currentLang === 'ru') return item.summary_ru;
    if (currentLang === 'en') return item.summary_en;
    return item.summary_uz;
  };

  // Stage details helper
  const getStageTitle = (stage: CropStageCare) => {
    if (currentLang === 'ru') return stage.stage_name_ru;
    if (currentLang === 'en') return stage.stage_name_en;
    return stage.stage_name_uz;
  };

  const getStageTasks = (stage: CropStageCare): string[] => {
    if (currentLang === 'ru' && stage.tasks_ru?.length) return stage.tasks_ru;
    if (currentLang === 'en' && stage.tasks_en?.length) return stage.tasks_en;
    return stage.tasks_uz || [];
  };

  const getIrrigationNotes = (stage: CropStageCare): string => {
    if (currentLang === 'ru') return stage.irrigation_notes_ru;
    if (currentLang === 'en') return stage.irrigation_notes_en;
    return stage.irrigation_notes_uz;
  };

  const getFertilizationNotes = (stage: CropStageCare): string => {
    if (currentLang === 'ru') return stage.fertilization_notes_ru || '';
    if (currentLang === 'en') return stage.fertilization_notes_en || '';
    return stage.fertilization_notes_uz || '';
  };

  const getPestNotes = (stage: CropStageCare): string => {
    if (currentLang === 'ru') return stage.pest_notes_ru || '';
    if (currentLang === 'en') return stage.pest_notes_en || '';
    return stage.pest_notes_uz || '';
  };

  // Filter stages based on search query
  const filteredStages = useMemo(() => {
    if (!searchQuery.trim()) return activeCrop.stages;
    const query = searchQuery.toLowerCase();

    return activeCrop.stages.filter((stage) => {
      const title = (
        currentLang === 'ru' ? stage.stage_name_ru :
        currentLang === 'en' ? stage.stage_name_en : stage.stage_name_uz
      ).toLowerCase();

      const tasksList = (
        currentLang === 'ru' && stage.tasks_ru?.length ? stage.tasks_ru :
        currentLang === 'en' && stage.tasks_en?.length ? stage.tasks_en : stage.tasks_uz || []
      ).join(' ').toLowerCase();

      const irrig = (
        currentLang === 'ru' ? stage.irrigation_notes_ru :
        currentLang === 'en' ? stage.irrigation_notes_en : stage.irrigation_notes_uz
      ).toLowerCase();

      const fert = (
        currentLang === 'ru' ? (stage.fertilization_notes_ru || '') :
        currentLang === 'en' ? (stage.fertilization_notes_en || '') : (stage.fertilization_notes_uz || '')
      ).toLowerCase();

      const pest = (
        currentLang === 'ru' ? (stage.pest_notes_ru || '') :
        currentLang === 'en' ? (stage.pest_notes_en || '') : (stage.pest_notes_uz || '')
      ).toLowerCase();

      return (
        title.includes(query) ||
        tasksList.includes(query) ||
        irrig.includes(query) ||
        fert.includes(query) ||
        pest.includes(query)
      );
    });
  }, [activeCrop, searchQuery, currentLang]);

  return (
    <div id="crop-guide-section" className="space-y-6">
      
      {/* 1. SECTION HERO & SEARCH HEADER */}
      <div className="bg-[#1F3D2B] text-[#FAF7F0] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#2B4F39] relative overflow-hidden">
        {/* Subtle background grain / glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#D9A441]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F0]/10 border border-[#FAF7F0]/20 text-[#D9A441] text-xs font-semibold tracking-wider uppercase mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{labels.tag}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
            {labels.title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#FAF7F0]/80 leading-relaxed max-w-2xl">
            {labels.subtitle}
          </p>

          {/* Search bar inside header */}
          <div className="mt-5 relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FAF7F0]/60" />
            <input
              type="text"
              id="guide-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F0]/10 border border-[#FAF7F0]/20 text-white placeholder-[#FAF7F0]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A441] focus:bg-[#FAF7F0]/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#FAF7F0]/60 hover:text-white bg-[#FAF7F0]/10 px-2 py-0.5 rounded-md"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CROP SELECTOR TABS */}
      <div className="bg-white rounded-xl p-2 sm:p-3 border border-[#E4D9C4] shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {CROP_GUIDES_DATA.map((crop, idx) => {
            const isSelected = selectedCropIndex === idx;
            return (
              <button
                key={crop.id}
                id={`crop-tab-${crop.id}`}
                onClick={() => {
                  setSelectedCropIndex(idx);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#1F3D2B] text-white shadow-xs'
                    : 'bg-[#FAF7F0] text-[#1F3D2B] hover:bg-[#EFE9DC] border border-transparent'
                }`}
              >
                <span className="text-base">{crop.icon_emoji}</span>
                <span>{getCropTitle(crop)}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE CROP BRIEFING BANNER */}
      <div className="bg-[#FAF7F0] rounded-xl p-4 sm:p-5 border border-[#E4D9C4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#1F3D2B]/10 border border-[#1F3D2B]/20 flex items-center justify-center text-2xl shrink-0">
            {activeCrop.icon_emoji}
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1F3D2B] flex items-center gap-2">
              <span>{getCropTitle(activeCrop)}</span>
              <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] font-medium uppercase tracking-wider">
                {activeCrop.stages.length} {labels.stageBadge.toLowerCase()}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6E5F] mt-0.5 max-w-2xl leading-relaxed">
              {getCropSummary(activeCrop)}
            </p>
          </div>
        </div>

        {onNavigateToFields && (
          <button
            id="navigate-to-fields-btn"
            onClick={onNavigateToFields}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#D9A441] text-[#1F3D2B] text-xs font-medium hover:bg-[#FAF7F0] transition-colors shadow-2xs"
          >
            <span>{labels.myFieldsLink}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#D9A441]" />
          </button>
        )}
      </div>

      {/* 4. GROWTH STAGES BREAKDOWN LIST */}
      <div className="space-y-4">
        {filteredStages.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-[#E4D9C4] text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#D9A441] mx-auto opacity-70" />
            <p className="text-sm text-[#5A6E5F]">{labels.noResults}</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#1F3D2B] font-semibold underline underline-offset-2 hover:text-[#D9A441]"
            >
              {labels.clearSearch}
            </button>
          </div>
        ) : (
          filteredStages.map((stage, sIdx) => {
            const stageNumber = sIdx + 1;
            const tasks = getStageTasks(stage);
            const irrigation = getIrrigationNotes(stage);
            const fertilization = getFertilizationNotes(stage);
            const pestNotes = getPestNotes(stage);

            return (
              <div
                key={`${stage.growth_stage}-${sIdx}`}
                id={`stage-card-${stage.growth_stage}`}
                className="bg-white rounded-xl border border-[#E4D9C4] hover:border-[#1F3D2B]/40 transition-all p-5 sm:p-6 shadow-xs relative overflow-hidden"
              >
                {/* Stage Header Line */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F0EAE1]">
                  <div className="flex items-center gap-3">
                    {/* Circle Stage Number Badge */}
                    <div className="w-8 h-8 rounded-lg bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center font-bold text-sm shadow-2xs">
                      {stageNumber}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8C7A65]">
                        {labels.stageBadge} {stageNumber}
                      </span>
                      <h3 className="text-base sm:text-lg font-serif font-bold text-[#1F3D2B]">
                        {getStageTitle(stage)}
                      </h3>
                    </div>
                  </div>

                  {/* Duration pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#E4D9C4] text-[#1F3D2B] text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-[#D9A441]" />
                    <span>{stage.days_range || `${stage.days_min} - ${stage.days_max} kun`}</span>
                  </div>
                </div>

                {/* 3-Column Responsive Grid for Tasks, Irrigation, and Protection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-4">
                  
                  {/* Column 1: Core Tasks */}
                  <div className="bg-[#FAF7F0]/70 rounded-lg p-4 border border-[#E8DFD1] flex flex-col">
                    <div className="flex items-center gap-2 mb-3 text-[#1F3D2B]">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-800">
                        <Sprout className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F3D2B]">
                        {labels.tasksHeader}
                      </h4>
                    </div>

                    <ul className="space-y-2 text-xs text-[#2C3E30] leading-relaxed flex-1">
                      {tasks.map((task, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1F3D2B] shrink-0 mt-0.5" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Irrigation Regime */}
                  <div className="bg-[#FAF7F0]/70 rounded-lg p-4 border border-[#E8DFD1] flex flex-col">
                    <div className="flex items-center gap-2 mb-3 text-[#1F3D2B]">
                      <div className="w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center text-sky-800">
                        <Droplets className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F3D2B]">
                        {labels.irrigationHeader}
                      </h4>
                    </div>

                    <p className="text-xs text-[#2C3E30] leading-relaxed flex-1">
                      {irrigation}
                    </p>
                  </div>

                  {/* Column 3: Protection & Nutrition */}
                  <div className="bg-[#FAF7F0]/70 rounded-lg p-4 border border-[#E8DFD1] flex flex-col">
                    <div className="flex items-center gap-2 mb-3 text-[#1F3D2B]">
                      <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-amber-800">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F3D2B]">
                        {labels.protectionHeader}
                      </h4>
                    </div>

                    <div className="space-y-2.5 text-xs leading-relaxed flex-1">
                      {fertilization && (
                        <div>
                          <span className="font-semibold text-[#1F3D2B] block mb-0.5">
                            {labels.fertilizerSub}
                          </span>
                          <span className="text-[#3F4F42]">{fertilization}</span>
                        </div>
                      )}
                      {pestNotes && (
                        <div>
                          <span className="font-semibold text-[#1F3D2B] block mb-0.5">
                            {labels.pestSub}
                          </span>
                          <span className="text-[#3F4F42]">{pestNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
export default CropGuideSection;
