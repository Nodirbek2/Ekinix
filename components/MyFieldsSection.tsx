'use client';

import React, { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FieldRecord, FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { FieldMapDrawer } from '@/components/FieldMapDrawer';
import { FieldCardThumbnail } from '@/components/FieldCardThumbnail';
import { CROP_OPTIONS } from '@/components/FarmerOnboardingModal';
import { calculateGrowthStage } from '@/lib/cropGuidesData';
import { MapPin, Plus, Calendar, Sparkles, Trash2, Sprout, Activity, Database, Check, AlertCircle, Droplets, Bug, BookOpen } from 'lucide-react';

interface MyFieldsSectionProps {
  currentLang: Language;
  userProfile?: FarmerProfile | null;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

// Initial demo fields located in Uzbekistan
const SAMPLE_FIELDS: FieldRecord[] = [
  {
    id: 'field_sample_1',
    name: "Paxta maydoni #4",
    crop_type: 'cotton',
    planting_date: '2026-04-10',
    area_hectares: 12.5,
    region: "Namangan viloyati",
    coordinates: [
      [40.9983, 71.6726],
      [41.0015, 71.6760],
      [40.9990, 71.6810],
      [40.9958, 71.6775],
    ],
  },
  {
    id: 'field_sample_2',
    name: "Samarqand Kuzgi Bug'doy",
    crop_type: 'wheat',
    planting_date: '2025-11-05',
    area_hectares: 8.2,
    region: "Samarqand viloyati",
    coordinates: [
      [39.6542, 66.9597],
      [39.6570, 66.9630],
      [39.6530, 66.9670],
      [39.6500, 66.9620],
    ],
  },
  {
    id: 'field_sample_3',
    name: "Quva Anor Bog'i",
    crop_type: 'pomegranate',
    planting_date: '2024-03-20',
    area_hectares: 3.8,
    region: "Farg'ona viloyati",
    coordinates: [
      [40.3842, 71.7843],
      [40.3870, 71.7880],
      [40.3830, 71.7920],
      [40.3810, 71.7870],
    ],
  },
];

export const MyFieldsSection: React.FC<MyFieldsSectionProps> = ({
  currentLang,
  userProfile,
  onOpenAuth,
}) => {
  const t = translations[currentLang];
  const [fields, setFields] = useState<FieldRecord[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load fields from Supabase or localStorage
  useEffect(() => {
    let isMounted = true;

    async function loadFields() {
      setLoading(true);
      let loaded: FieldRecord[] = [];

      try {
        const local = localStorage.getItem('ekinix_farmer_fields');
        if (local) {
          loaded = JSON.parse(local);
        }
      } catch {
        // ignore
      }

      const client = supabase;
      if (isSupabaseConfigured && client && userProfile?.user_id) {
        try {
          const { data, error } = await client
            .from('fields')
            .select('*')
            .or(`user_id.eq.${userProfile.user_id},farmer_id.eq.${userProfile.id || 'none'}`)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const parsedDbFields: FieldRecord[] = data.map((item: any) => ({
              id: item.id,
              farmer_id: item.farmer_id,
              user_id: item.user_id,
              name: item.name,
              crop_type: item.crop_type,
              planting_date: item.planting_date || '2026-04-15',
              area_hectares: Number(item.area_hectares) || 1.5,
              region: item.region || userProfile.region || "Toshkent viloyati",
              coordinates: item.coordinates_json || item.coordinates || [],
            }));

            loaded = parsedDbFields;
          }
        } catch (err) {
          console.warn("Error fetching fields from Supabase:", err);
        }
      }

      if (loaded.length === 0) {
        loaded = SAMPLE_FIELDS;
      }

      if (isMounted) {
        setFields(loaded);
        setLoading(false);
      }
    }

    loadFields();

    return () => {
      isMounted = false;
    };
  }, [userProfile]);

  const handleSaveField = async (fieldData: {
    name: string;
    crop_type: string;
    planting_date: string;
    area_hectares: number;
    region?: string;
    coordinates: [number, number][];
  }) => {
    const selectedRegion = fieldData.region || userProfile?.region || "Toshkent viloyati";
    const newRecord: FieldRecord = {
      id: `field_${Date.now()}`,
      user_id: userProfile?.user_id,
      farmer_id: userProfile?.id,
      name: fieldData.name,
      crop_type: fieldData.crop_type,
      planting_date: fieldData.planting_date,
      area_hectares: fieldData.area_hectares,
      region: selectedRegion,
      coordinates: fieldData.coordinates,
    };

    const updatedList = [newRecord, ...fields];
    setFields(updatedList);
    localStorage.setItem('ekinix_farmer_fields', JSON.stringify(updatedList));

    const client = supabase;
    if (isSupabaseConfigured && client) {
      try {
        const { error } = await client.from('fields').insert({
          user_id: userProfile?.user_id || null,
          farmer_id: userProfile?.id || null,
          name: fieldData.name,
          crop_type: fieldData.crop_type,
          planting_date: fieldData.planting_date,
          area_hectares: fieldData.area_hectares,
          region: selectedRegion,
          coordinates_json: fieldData.coordinates,
        });

        if (error) {
          console.warn("Supabase field save notice:", error);
        }
      } catch (e) {
        console.warn("Failed saving field to Supabase:", e);
      }
    }

    setNotification({
      type: 'success',
      text: currentLang === 'uz'
        ? "Yangi maydon muvaffaqiyatli saqlandi! Sun'iy yo'ldosh monitoringi faollashtirildi."
        : currentLang === 'ru'
        ? "Новое поле успешно сохранено! Спутниковый мониторинг активирован."
        : "New field saved successfully! Satellite telemetry activated.",
    });

    setIsRegistering(false);

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleDeleteField = async (id: string) => {
    const updated = fields.filter((f) => f.id !== id);
    setFields(updated);
    localStorage.setItem('ekinix_farmer_fields', JSON.stringify(updated));

    const client = supabase;
    if (isSupabaseConfigured && client && !id.startsWith('field_sample')) {
      try {
        await client.from('fields').delete().eq('id', id);
      } catch {
        // ignore
      }
    }
  };

  const getCropMeta = (cropId: string) => {
    const match = CROP_OPTIONS.find((c) => c.id === cropId);
    if (match) {
      return {
        icon: match.icon,
        label: t[match.nameKey as keyof typeof t] || cropId,
      };
    }
    return { icon: '🌱', label: cropId };
  };

  return (
    <section id="my-fields" className="py-12 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E4D9C4] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D9A441]/15 text-[#B8852B] rounded-md border border-[#D9A441]/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sprout className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Interaktiv Xarita & Monitoring</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
            {t.myFieldsTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {!userProfile && onOpenAuth && (
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-bold text-[#1F3D2B] bg-[#F0E8D8] hover:bg-[#E4D9C4] px-4 py-2.5 rounded-xl border border-[#E4D9C4] transition-all"
            >
              Kirish va Bazaga Saqlash
            </button>
          )}

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="flex items-center gap-2 bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-sm px-6 py-3 rounded-xl shadow-lg border border-[#D9A441]/40 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#D9A441]" />
            <span>{isRegistering ? 'Xaritani Yopish' : t.addFieldBtn}</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div className="p-4 bg-[#1F3D2B] text-[#FAF7F0] border-2 border-[#D9A441] rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-[#D9A441]" />
            <span className="text-xs sm:text-sm font-bold">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold text-[#D9A441] hover:underline"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Map Drawer Component (when adding new field) */}
      {isRegistering && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <FieldMapDrawer
            currentLang={currentLang}
            defaultRegion={userProfile?.region}
            onSaveField={handleSaveField}
            onCancel={() => setIsRegistering(false)}
          />
        </div>
      )}

      {/* Fields List View / Cards */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-[#FAF7F0] rounded-3xl border border-[#E4D9C4]">
          <div className="w-8 h-8 border-3 border-[#1F3D2B] border-t-[#D9A441] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#6C7C6F]">Maydonlar ma&apos;lumotlari yuklanmoqda...</p>
        </div>
      ) : fields.length === 0 ? (
        <div className="py-16 px-6 text-center bg-[#FAF7F0] rounded-3xl border-2 border-dashed border-[#E4D9C4] space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-[#F0E8D8] text-[#D9A441] rounded-2xl flex items-center justify-center mx-auto border border-[#E4D9C4]">
            <Sprout className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#1F3D2B]">
            {t.noFieldsYet}
          </h3>
          <p className="text-xs text-[#6C7C6F] leading-relaxed">
            {t.noFieldsSub}
          </p>
          <button
            onClick={() => setIsRegistering(true)}
            className="inline-flex items-center gap-2 bg-[#D9A441] hover:bg-[#B8852B] text-[#1F3D2B] hover:text-[#FAF7F0] font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addFieldBtn}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => {
            const cropMeta = getCropMeta(field.crop_type);

            return (
              <div
                key={field.id}
                className="bg-white rounded-3xl border border-[#E4D9C4] hover:border-[#1F3D2B] p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group"
              >
                {/* Field Top Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#D9A441] tracking-wider mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{field.region}</span>
                      </div>
                      <h4 className="font-serif text-lg font-bold text-[#1F3D2B] group-hover:text-[#B8852B] transition-colors">
                        {field.name}
                      </h4>
                    </div>

                    <span className="bg-[#1F3D2B] text-[#FAF7F0] px-3 py-1 rounded-full text-xs font-bold border border-[#D9A441]/40 flex items-center gap-1.5 shrink-0">
                      <span>{cropMeta.icon}</span>
                      <span>{cropMeta.label}</span>
                    </span>
                  </div>

                  {/* Satellite Thumbnail Map */}
                  <FieldCardThumbnail coordinates={field.coordinates} height={140} />

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4D9C4]">
                      <p className="text-[10px] text-[#6C7C6F] font-semibold uppercase">Maydon Maydoni</p>
                      <p className="font-bold text-[#1F3D2B] text-sm mt-0.5">
                        {field.area_hectares} <span className="text-xs font-normal text-[#6C7C6F]">{t.hectaresUnit}</span>
                      </p>
                    </div>

                    <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4D9C4]">
                      <p className="text-[10px] text-[#6C7C6F] font-semibold uppercase">{t.plantingDateLabel}</p>
                      <p className="font-bold text-[#1F3D2B] text-xs mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#D9A441]" />
                        <span>{field.planting_date || '2026-04-10'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Calculated Growth Stage Care Tip Card */}
                  {(() => {
                    const calc = calculateGrowthStage(field.crop_type, field.planting_date);
                    const stage = calc.currentStage;
                    return (
                      <div className="bg-[#1F3D2B] text-[#FAF7F0] p-3.5 rounded-2xl border border-[#D9A441]/40 space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-[#D9A441] text-[11px]">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Joriy Parvarish ({calc.daysElapsed} kun)</span>
                          </div>
                          <span className="bg-[#D9A441] text-[#1F3D2B] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {calc.stageIndex + 1}-bosqich
                          </span>
                        </div>

                        <p className="font-semibold text-white text-xs">
                          {currentLang === 'ru' ? stage.stage_name_ru : currentLang === 'en' ? stage.stage_name_en : stage.stage_name_uz}
                        </p>

                        <div className="space-y-1 text-[11px] text-white/90 pt-1">
                          <p className="flex items-start gap-1">
                            <Droplets className="w-3 h-3 text-blue-300 shrink-0 mt-0.5" />
                            <span><strong>Sug&apos;orish:</strong> {currentLang === 'ru' ? stage.irrigation_notes_ru : currentLang === 'en' ? stage.irrigation_notes_en : stage.irrigation_notes_uz}</span>
                          </p>
                          <p className="flex items-start gap-1">
                            <Bug className="w-3 h-3 text-amber-300 shrink-0 mt-0.5" />
                            <span><strong>Zararkunanda:</strong> {currentLang === 'ru' ? stage.pest_notes_ru : currentLang === 'en' ? stage.pest_notes_en : stage.pest_notes_uz}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-[#E4D9C4] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1F3D2B] bg-[#F5F9F7] px-2.5 py-1 rounded-lg border border-[#2D4D3D]/20">
                    <Activity className="w-3.5 h-3.5 text-[#2D4D3D]" />
                    <span>NDVI: Normal (0.68)</span>
                  </div>

                  <button
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 text-[#6C7C6F] hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Maydonni o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};
