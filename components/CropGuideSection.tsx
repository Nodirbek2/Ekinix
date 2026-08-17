'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/lib/i18n';
import { CROP_GUIDES_DATA, CropGuideItem, CropStageCare, calculateGrowthStage } from '@/lib/cropGuidesData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  BookOpen, Droplets, Bug, Sparkles, Calendar, 
  ChevronRight, CheckCircle2, ShieldAlert, Sprout, Filter, Database, ArrowRight
} from 'lucide-react';

interface CropGuideSectionProps {
  currentLang: Language;
}

export const CropGuideSection: React.FC<CropGuideSectionProps> = ({ currentLang }) => {
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedStageIndex, setSelectedStageIndex] = useState<Record<string, number>>({
    cotton: 0,
    wheat: 0,
    apple: 0,
    grape: 0,
    pomegranate: 0,
    tomato: 0,
  });

  // Planting date interactive estimator state
  const [testPlantingDate, setTestPlantingDate] = useState<string>('2026-04-10');
  const [testCrop, setTestCrop] = useState<string>('cotton');

  // Supabase sync status
  const [supabaseSynced, setSupabaseSynced] = useState<boolean>(false);
  const [guidesData, setGuidesData] = useState<CropGuideItem[]>(CROP_GUIDES_DATA);

  // Fetch or sync from Supabase `crop_guides` table if available
  useEffect(() => {
    let isMounted = true;
    async function loadSupabaseGuides() {
      const client = supabase;
      if (isSupabaseConfigured && client) {
        try {
          const { data, error } = await client.from('crop_guides').select('*');
          if (!error && data && data.length > 0) {
            console.log('[CropGuideSection] Loaded records from Supabase crop_guides:', data.length);
            if (isMounted) setSupabaseSynced(true);
          }
        } catch (e) {
          console.warn("[CropGuideSection] Supabase load error:", e);
        }
      }
    }
    loadSupabaseGuides();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStageSelect = (cropName: string, stageIdx: number) => {
    setSelectedStageIndex((prev) => ({
      ...prev,
      [cropName]: stageIdx,
    }));
  };

  const filteredCrops = selectedCrop === 'all'
    ? guidesData
    : guidesData.filter((g) => g.crop_name === selectedCrop);

  // Calculated stage from test estimator
  const currentCalc = calculateGrowthStage(testCrop, testPlantingDate);

  return (
    <section id="crop-guides" className="py-16 bg-[#FAF7F0] border-t border-[#E4D9C4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] text-xs font-bold uppercase tracking-wider mb-3">
            <BookOpen className="w-4 h-4 text-[#D9A441]" />
            <span>
              {currentLang === 'ru'
                ? 'Agrotekhnika i Zashchita Rasteniy'
                : currentLang === 'en'
                ? 'Agro Guide & Crop Care'
                : "Ekin Yo'riqnomasi va Agrotexnika"}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B] tracking-tight">
            {currentLang === 'ru'
              ? 'Rukovodstvo po Ukhodu za Ekinami'
              : currentLang === 'en'
              ? 'Smart Crop Care Guides'
              : "Ekinlar Parvarishi va Agrotexnika Qoidalari"}
          </h2>

          <p className="mt-3 text-base text-[#6C7C6F] leading-relaxed">
            {currentLang === 'ru'
              ? 'Poshagovyye rekomendatsii po polivu, bor’be s vreditelyami i sboru urozhaya dlya kazhdoy fazy rosta.'
              : currentLang === 'en'
              ? 'Stage-by-stage irrigation targets, pest prevention, and harvest timing for major crops in Uzbekistan.'
              : "O'zbekiston iqlimi uchun har bir rivojlanish bosqichida sug'orish me'yorlari, zararkunandalardan himoya va hosil yig'im tavsiyalari."}
          </p>

          {/* Supabase Status Indicator */}
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-[#6C7C6F] bg-white px-3 py-1.5 rounded-xl border border-[#E4D9C4] shadow-xs">
            <Database className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>
              {supabaseSynced
                ? "Supabase crop_guides ba'zasi bilan bog'langan"
                : "Strukturalashgan ma'lumotlar ba'zasi (crop_guides)"}
            </span>
          </div>
        </div>

        {/* Dynamic Growth Stage Interactive Calculator Widget */}
        <div className="mb-12 bg-[#1F3D2B] text-[#FAF7F0] p-6 sm:p-8 rounded-3xl border-2 border-[#14281C] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-48 h-48 bg-[#D9A441]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="lg:col-span-5 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#D9A441] bg-white/10 px-3 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ekin Bosqichini Aniqlash Kalkaulyatori</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-white">
                Ekilgan sanani kiriting — joriy parvarish tavsiyasini ko&apos;ring
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Ekin turi va ekilgan sanangizga qarab, tizim avtomatik ravishda ekin qaysi rivojlanish bosqichida ekanligini va nima qilish kerakligini ko&apos;rsatib beradi.
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
                    {guidesData.map((g) => (
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
                <div className="bg-[#14281C]/90 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-blue-300 font-bold flex items-center gap-1 mb-1">
                    <Droplets className="w-3 h-3 text-blue-400" /> Sug&apos;orish:
                  </span>
                  <p className="text-[11px] text-white/90 line-clamp-3">
                    {currentLang === 'ru'
                      ? currentCalc.currentStage.irrigation_notes_ru
                      : currentLang === 'en'
                      ? currentCalc.currentStage.irrigation_notes_en
                      : currentCalc.currentStage.irrigation_notes_uz}
                  </p>
                </div>

                <div className="bg-[#14281C]/90 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 mb-1">
                    <Bug className="w-3 h-3 text-amber-400" /> Zararkunanda:
                  </span>
                  <p className="text-[11px] text-white/90 line-clamp-3">
                    {currentLang === 'ru'
                      ? currentCalc.currentStage.pest_notes_ru
                      : currentLang === 'en'
                      ? currentCalc.currentStage.pest_notes_en
                      : currentCalc.currentStage.pest_notes_uz}
                  </p>
                </div>

                <div className="bg-[#14281C]/90 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1 mb-1">
                    <Sprout className="w-3 h-3 text-emerald-400" /> Hosil Yig&apos;imi:
                  </span>
                  <p className="text-[11px] text-white/90 line-clamp-3">
                    {currentLang === 'ru'
                      ? currentCalc.currentStage.harvest_notes_ru
                      : currentLang === 'en'
                      ? currentCalc.currentStage.harvest_notes_en
                      : currentCalc.currentStage.harvest_notes_uz}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Crop Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <button
            onClick={() => setSelectedCrop('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shadow-xs ${
              selectedCrop === 'all'
                ? 'bg-[#1F3D2B] text-[#FAF7F0] ring-2 ring-[#D9A441]'
                : 'bg-white text-[#6C7C6F] hover:bg-[#F0E8D8] border border-[#E4D9C4]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Barcha Ekinlar ({guidesData.length})</span>
          </button>

          {guidesData.map((crop) => {
            const isActive = selectedCrop === crop.crop_name;
            return (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop.crop_name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 shadow-xs ${
                  isActive
                    ? 'bg-[#1F3D2B] text-[#FAF7F0] ring-2 ring-[#D9A441]'
                    : 'bg-white text-[#6C7C6F] hover:bg-[#F0E8D8] border border-[#E4D9C4]'
                }`}
              >
                <span>{crop.icon_emoji}</span>
                <span>{crop.crop_title_uz}</span>
              </button>
            );
          })}
        </div>

        {/* Crop Guides Grid */}
        <div className="space-y-12">
          {filteredCrops.map((crop) => {
            const activeIdx = selectedStageIndex[crop.crop_name] || 0;
            const activeStage = crop.stages[activeIdx] || crop.stages[0];

            return (
              <div
                key={crop.id}
                className="bg-white rounded-3xl border-2 border-[#E4D9C4] shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Crop Card Header */}
                <div className="bg-[#FAF7F0] p-6 border-b border-[#E4D9C4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B] text-white flex items-center justify-center text-2xl shadow-md">
                      {crop.icon_emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-serif font-bold text-[#1F3D2B]">
                          {currentLang === 'ru'
                            ? crop.crop_title_ru
                            : currentLang === 'en'
                            ? crop.crop_title_en
                            : crop.crop_title_uz}
                        </h3>
                        <span className="bg-[#D9A441]/20 text-[#1F3D2B] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          {crop.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#6C7C6F] mt-0.5">
                        {currentLang === 'ru'
                          ? crop.summary_ru
                          : currentLang === 'en'
                          ? crop.summary_en
                          : crop.summary_uz}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-[#1F3D2B] font-bold bg-[#E4D9C4]/50 px-3 py-1.5 rounded-xl border border-[#E4D9C4] shrink-0 self-start sm:self-auto">
                    {crop.stages.length} ta o&apos;sish bosqichi
                  </span>
                </div>

                {/* Stage Interactive Selector Step Bar */}
                <div className="bg-[#F0E8D8]/50 px-6 py-3 border-b border-[#E4D9C4] overflow-x-auto scrollbar-none">
                  <div className="flex items-center gap-2 min-w-max">
                    {crop.stages.map((st, idx) => {
                      const isCurrent = idx === activeIdx;
                      return (
                        <button
                          key={st.growth_stage}
                          onClick={() => handleStageSelect(crop.crop_name, idx)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            isCurrent
                              ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-sm'
                              : 'bg-white text-[#6C7C6F] hover:bg-white/80 border border-[#E4D9C4]'
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

                {/* Active Growth Stage Care Details Grid — Clean, Scannable Cards */}
                <div className="p-6 sm:p-8">
                  <div className="mb-6 flex items-center justify-between border-b border-[#E4D9C4] pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#D9A441]" />
                      <h4 className="text-base font-bold text-[#1F3D2B]">
                        {activeIdx + 1}-Bosqich: {currentLang === 'ru' ? activeStage.stage_name_ru : currentLang === 'en' ? activeStage.stage_name_en : activeStage.stage_name_uz}
                      </h4>
                    </div>

                    <span className="text-xs font-bold text-[#6C7C6F] bg-[#FAF7F0] px-3 py-1 rounded-lg border border-[#E4D9C4]">
                      Muddat: {activeStage.days_min} – {activeStage.days_max} kun
                    </span>
                  </div>

                  {/* 3 Main Action Cards: Irrigation, Pests, Harvest */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* 1. Irrigation Needs Card */}
                    <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] shadow-xs hover:border-[#1F3D2B]/40 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-3 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                          <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Sug&apos;orish va Suv Me&apos;yori</span>
                        </div>
                        <p className="text-xs text-[#1A281E] leading-relaxed">
                          {currentLang === 'ru'
                            ? activeStage.irrigation_notes_ru
                            : currentLang === 'en'
                            ? activeStage.irrigation_notes_en
                            : activeStage.irrigation_notes_uz}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E4D9C4] flex items-center justify-between text-[11px] text-[#6C7C6F]">
                        <span className="font-semibold text-blue-700">💧 Tavsiya</span>
                        <span>Ertalab 06:00 – 09:00</span>
                      </div>
                    </div>

                    {/* 2. Pest & Diseases Notes Card */}
                    <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] shadow-xs hover:border-[#1F3D2B]/40 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-3 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                          <Bug className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Zararkunanda va Kasalliklar</span>
                        </div>
                        <p className="text-xs text-[#1A281E] leading-relaxed">
                          {currentLang === 'ru'
                            ? (activeStage.pest_notes_ru || "Zararkunandalarga qarshi doimiy profilaktika o'tkaziladi.")
                            : currentLang === 'en'
                            ? (activeStage.pest_notes_en || "Perform regular monitoring against pests.")
                            : (activeStage.pest_notes_uz || "Zararkunanda va kasalliklarga qarshi doimiy biologik nazorat va ko'rik o'tkaziladi.")}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E4D9C4] flex items-center justify-between text-[11px] text-[#6C7C6F]">
                        <span className="font-semibold text-amber-700">🛡️ Nazorat</span>
                        <span>Haftada 2 marta ko&apos;rik</span>
                      </div>
                    </div>

                    {/* 3. Harvest Timing Guidance Card */}
                    <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4] shadow-xs hover:border-[#1F3D2B]/40 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-3 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Hosil Yig&apos;imi va Saqlash</span>
                        </div>
                        <p className="text-xs text-[#1A281E] leading-relaxed">
                          {currentLang === 'ru'
                            ? (activeStage.harvest_notes_ru || "Sbor urozhaya provoditsya po mere sozrevaniya.")
                            : currentLang === 'en'
                            ? (activeStage.harvest_notes_en || "Harvest upon reaching full maturity.")
                            : (activeStage.harvest_notes_uz || "Hosil pishib yetilganda yig'ib olinadi va quruq joyda saqlanadi.")}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E4D9C4] flex items-center justify-between text-[11px] text-[#6C7C6F]">
                        <span className="font-semibold text-emerald-700">🌾 Sifat</span>
                        <span>Quruq ob-havoda</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
