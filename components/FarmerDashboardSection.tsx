'use client';

import React, { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FieldRecord, FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { FieldWeatherCard } from '@/components/FieldWeatherCard';
import { LayoutDashboard, Plus, Sprout, MapPin, Sparkles, User, RefreshCw, CheckCircle2 } from 'lucide-react';

interface FarmerDashboardSectionProps {
  currentLang: Language;
  userProfile?: FarmerProfile | null;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onNavigateToFields?: () => void;
}

const DEMO_DASHBOARD_FIELDS: FieldRecord[] = [
  {
    id: 'dash_field_1',
    name: "Toshkent Paxta Maydoni #1",
    crop_type: 'cotton',
    planting_date: '2026-04-12',
    area_hectares: 14.2,
    region: "Toshkent viloyati",
    coordinates: [
      [41.2995, 69.2401],
      [41.3025, 69.2435],
      [41.3000, 69.2480],
      [41.2970, 69.2440],
    ],
  },
  {
    id: 'dash_field_2',
    name: "Samarqand Kuzgi Bug'doy",
    crop_type: 'wheat',
    planting_date: '2025-11-01',
    area_hectares: 9.5,
    region: "Samarqand viloyati",
    coordinates: [
      [39.6542, 66.9597],
      [39.6570, 66.9630],
      [39.6530, 66.9670],
      [39.6500, 66.9620],
    ],
  },
  {
    id: 'dash_field_3',
    name: "Farg'ona Anor Bog'i",
    crop_type: 'pomegranate',
    planting_date: '2024-03-15',
    area_hectares: 4.6,
    region: "Farg'ona viloyati",
    coordinates: [
      [40.3842, 71.7843],
      [40.3870, 71.7880],
      [40.3830, 71.7920],
      [40.3810, 71.7870],
    ],
  },
];

export const FarmerDashboardSection: React.FC<FarmerDashboardSectionProps> = ({
  currentLang,
  userProfile,
  onOpenAuth,
  onNavigateToFields,
}) => {
  const t = translations[currentLang];
  const [fields, setFields] = useState<FieldRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardFields() {
      setLoading(true);
      let list: FieldRecord[] = [];

      try {
        const saved = localStorage.getItem('ekinix_farmer_fields');
        if (saved) {
          list = JSON.parse(saved);
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
            .or(`user_id.eq.${userProfile.user_id},farmer_id.eq.${userProfile.id || 'none'}`);

          if (!error && data && data.length > 0) {
            const parsed = data.map((item: any) => ({
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
            list = parsed;
          }
        } catch (err) {
          console.warn("Supabase dashboard load notice:", err);
        }
      }

      if (list.length === 0) {
        list = DEMO_DASHBOARD_FIELDS;
      }

      if (isMounted) {
        setFields(list);
        setLoading(false);
      }
    }

    loadDashboardFields();

    return () => {
      isMounted = false;
    };
  }, [userProfile]);

  const totalHectares = fields.reduce((acc, f) => acc + (f.area_hectares || 0), 0);

  return (
    <section id="farmer-dashboard" className="py-12 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Dashboard Section Header */}
      <div className="bg-[#1F3D2B] text-[#FAF7F0] rounded-3xl p-6 sm:p-8 border-2 border-[#D9A441] shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#D9A441]/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D9A441] text-[#1F3D2B] rounded-full text-xs font-bold uppercase tracking-wider">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t.dashboardTitle}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF7F0]">
              {userProfile ? `Xush kelibsiz, ${userProfile.full_name}!` : "Dehqon Boshqaruv Paneli"}
            </h2>

            <p className="text-xs sm:text-sm text-[#D9A441] max-w-2xl leading-relaxed">
              {t.dashboardSubtitle}
            </p>

            {userProfile && (
              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                <span className="bg-[#FAF7F0]/10 px-3 py-1 rounded-lg border border-[#D9A441]/30 flex items-center gap-1.5 text-white">
                  <MapPin className="w-3.5 h-3.5 text-[#D9A441]" />
                  <span>{userProfile.region}</span>
                </span>

                <span className="bg-[#FAF7F0]/10 px-3 py-1 rounded-lg border border-[#D9A441]/30 flex items-center gap-1.5 text-white">
                  <Sprout className="w-3.5 h-3.5 text-[#D9A441]" />
                  <span>{fields.length} ta Maydon ({totalHectares.toFixed(1)} {t.hectaresUnit})</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!userProfile && onOpenAuth && (
              <button
                onClick={() => onOpenAuth('login')}
                className="bg-[#D9A441] hover:bg-[#B8852B] text-[#1F3D2B] font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Kirish / Ro&apos;yxatdan o&apos;tish</span>
              </button>
            )}

            {onNavigateToFields && (
              <button
                onClick={onNavigateToFields}
                className="bg-[#FAF7F0] hover:bg-[#F0E8D8] text-[#1F3D2B] font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all border border-[#E4D9C4] flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-[#D9A441]" />
                <span>Yangi Maydon Qo&apos;shish</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Field Weather & Irrigation Recommendation Cards List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E4D9C4] pb-3">
          <h3 className="font-serif text-2xl font-bold text-[#1F3D2B] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D9A441]" />
            <span>Maydonlar Tahlili va Ob-Havo</span>
          </h3>

          <div className="text-xs font-semibold text-[#6C7C6F] flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Open-Meteo Avto-Yangilanish</span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3 bg-[#FAF7F0] rounded-3xl border border-[#E4D9C4]">
            <div className="w-8 h-8 border-3 border-[#1F3D2B] border-t-[#D9A441] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#6C7C6F]">Boshqaruv paneli yuklanmoqda...</p>
          </div>
        ) : fields.length === 0 ? (
          <div className="py-16 px-6 text-center bg-[#FAF7F0] rounded-3xl border-2 border-dashed border-[#E4D9C4] space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-[#F0E8D8] text-[#D9A441] rounded-2xl flex items-center justify-center mx-auto border border-[#E4D9C4]">
              <Sprout className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1F3D2B]">
              Hali birorta maydon ro&apos;yxatdan o&apos;tkazilmagan
            </h3>
            <p className="text-xs text-[#6C7C6F]">
              Xaritada maydon burchaklarini belgilab, jonli ob-havo va sug&apos;orish tavsiyalarini oling.
            </p>
            {onNavigateToFields && (
              <button
                onClick={onNavigateToFields}
                className="inline-flex items-center gap-2 bg-[#D9A441] text-[#1F3D2B] font-bold text-xs px-6 py-3 rounded-xl shadow-md hover:bg-[#B8852B] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Maydon Belgilash</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {fields.map((field) => (
              <FieldWeatherCard
                key={field.id}
                field={field}
                currentLang={currentLang}
              />
            ))}
          </div>
        )}
      </div>

    </section>
  );
};
