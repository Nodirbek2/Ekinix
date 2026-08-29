'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FieldRecord, FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { FieldMapDrawer } from '@/components/FieldMapDrawer';
import FieldCardThumbnail from '@/components/FieldCardThumbnail';
import { UnifiedFieldDetailView } from '@/components/UnifiedFieldDetailView';
import { InfoTooltip } from '@/components/InfoTooltip';
import { CROP_OPTIONS } from '@/components/FarmerOnboardingModal';
import { calculateGrowthStage } from '@/lib/cropGuidesData';
import { useMultipleFieldsNdvi } from '@/hooks/useFieldNdvi';
import { formatNdviScore, getNdviStatusBadge } from '@/lib/ndviService';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  MapPin, 
  Activity, 
  Droplets, 
  Calendar, 
  Search, 
  Layers, 
  ChevronRight, 
  SlidersHorizontal,
  TrendingUp,
  AlertTriangle,
  Sprout,
  Check,
  Eye,
  Trash2,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export interface FieldItem {
  id: string;
  name: string;
  cropType?: string;
  crop_type?: string;
  cropVariety?: string;
  hectares?: number;
  area_hectares?: number;
  region: string;
  district?: string;
  plantingDate?: string;
  planting_date?: string;
  coordinates: [number, number][];
  currentNdvi?: number;
  soilMoisturePct?: number;
  healthStatus?: 'healthy' | 'moderate' | 'critical';
  priorityAction?: string;
  farmer_id?: string;
  user_id?: string;
}

export interface MyFieldsSectionProps {
  currentLang?: Language;
  lang?: 'uz' | 'ru' | 'en';
  userProfile?: FarmerProfile | null;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  selectedFieldId?: string | null;
  onNavigateToGuides?: () => void;
  fields?: FieldItem[] | FieldRecord[] | any[];
  onSelectField?: (field: any) => void;
  onOpenDrawer?: () => void;
}

export function MyFieldsSection({
  currentLang: propCurrentLang,
  lang: propLang,
  userProfile,
  onOpenAuth,
  selectedFieldId,
  onNavigateToGuides,
  fields: externalFields,
  onSelectField: externalOnSelectField,
  onOpenDrawer: externalOnOpenDrawer,
}: MyFieldsSectionProps) {
  const effectiveLang: Language = propCurrentLang || propLang || 'uz';
  const t = translations[effectiveLang] || translations.uz;

  const [internalFields, setInternalFields] = useState<FieldRecord[]>([]);
  const [activeDetailField, setActiveDetailField] = useState<FieldRecord | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Single source of truth NDVI telemetry across all fields
  const { ndviMap } = useMultipleFieldsNdvi(internalFields, effectiveLang);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load fields from Supabase or localStorage if externalFields not provided
  useEffect(() => {
    let isMounted = true;

    async function loadFields() {
      if (externalFields && externalFields.length > 0) {
        const normalized: FieldRecord[] = externalFields.map((f: any) => ({
          id: f.id,
          farmer_id: f.farmer_id,
          name: f.name,
          crop_type: f.crop_type || f.cropType || 'cotton',
          planting_date: f.planting_date || f.plantingDate || '2026-04-10',
          area_hectares: Number(f.area_hectares || f.hectares || 1.5),
          region: f.region || "Toshkent viloyati",
          coordinates: f.coordinates || [],
        }));
        if (isMounted) {
          setInternalFields(normalized);
          setLoading(false);
        }
        return;
      }

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
      if (isSupabaseConfigured && client) {
        try {
          const { data: sessionData } = await client.auth.getSession();
          const targetUserId = sessionData.session?.user?.id || userProfile?.user_id;

          if (targetUserId) {
            const { data: farmerRec } = await client
              .from('farmers')
              .select('id')
              .eq('user_id', targetUserId)
              .maybeSingle();

            let fieldsQuery = client.from('fields').select('*');
            if (farmerRec?.id) {
              // fields table has NO user_id column — filter exclusively by farmer_id
              fieldsQuery = fieldsQuery.eq('farmer_id', farmerRec.id);
            } else {
              // No farmer record found — cannot query fields; nothing to load
              return;
            }

            const { data, error } = await fieldsQuery.order('created_at', { ascending: false });

            if (!error && data) {
              const parsedDbFields: FieldRecord[] = data.map((item: any) => ({
                id: item.id,
                farmer_id: item.farmer_id,
                name: item.name,
                crop_type: item.crop_type,
                planting_date: item.planting_date || '2026-04-15',
                area_hectares: Number(item.area_hectares) || 1.5,
                region: item.region || userProfile?.region || "Toshkent viloyati",
                coordinates: item.coordinates_json || item.coordinates || [],
              }));

              loaded = parsedDbFields;
              localStorage.setItem('ekinix_farmer_fields', JSON.stringify(parsedDbFields));
            }
          }
        } catch (err) {
          console.warn("Error fetching fields from Supabase:", err);
        }
      }

      if (isMounted) {
        setInternalFields(loaded);
        if (selectedFieldId) {
          const found = loaded.find((f) => f.id === selectedFieldId);
          if (found) setActiveDetailField(found);
        }
        setLoading(false);
      }
    }

    loadFields();

    return () => {
      isMounted = false;
    };
  }, [userProfile, selectedFieldId, externalFields]);

  const handleSaveField = async (fieldData: {
    name: string;
    crop_type: string;
    planting_date: string;
    area_hectares: number;
    region?: string;
    coordinates: [number, number][];
  }) => {
    const selectedRegion = fieldData.region || userProfile?.region || "Toshkent viloyati";
    const client = supabase;
    let savedRecordId = `field_${Date.now()}`;
    let activeUserId = userProfile?.user_id;
    let activeFarmerId = userProfile?.id;

    if (isSupabaseConfigured && client) {
      try {
        const { data: sessionData } = await client.auth.getSession();
        if (sessionData.session?.user) {
          activeUserId = sessionData.session.user.id;
        }

        if (!activeUserId) {
          console.error('[Ekinix] Cannot save field: no active auth session. User must be logged in.');
          setNotification({
            type: 'error' as any,
            text: "Maydonni saqlash uchun tizimga kirgan bo'lishingiz kerak.",
          });
          setLoading(false);
          return;
        }

        // Look up farmer UUID in public.farmers; if not found, create profile first
        let farmerId = activeFarmerId;
        if (!farmerId) {
          const { data: farmerRec } = await client
            .from('farmers')
            .select('id')
            .eq('user_id', activeUserId)
            .maybeSingle();

          if (farmerRec?.id) {
            farmerId = farmerRec.id;
            activeFarmerId = farmerRec.id;
          } else {
            // Auto-create farmer record if one doesn't exist yet for this auth user
            const { data: newFarmer } = await client
              .from('farmers')
              .insert({
                user_id: activeUserId,
                full_name: userProfile?.full_name || 'Dehqon',
                phone: userProfile?.phone || '',
                region: selectedRegion,
                farm_type: 'smallholder',
                primary_crops: [fieldData.crop_type || 'cotton'],
              })
              .select('id')
              .single();

            if (newFarmer?.id) {
              farmerId = newFarmer.id;
              activeFarmerId = newFarmer.id;
            }
          }
        }

        const { data: insertedField, error: insertError } = await client
          .from('fields')
          .insert({
            // fields table only has farmer_id (FK -> farmers.id); NO user_id column
            farmer_id: farmerId,
            name: fieldData.name.trim(),
            crop_type: fieldData.crop_type,
            planting_date: fieldData.planting_date,
            area_hectares: fieldData.area_hectares,
            region: selectedRegion,
            coordinates_json: fieldData.coordinates,
          })
          .select()
          .single();

        if (!insertError && insertedField) {
          savedRecordId = insertedField.id;
        } else if (insertError) {
          console.error('[Ekinix] Supabase field insertion error:', insertError.message, insertError.details);
        }
      } catch (e) {
        console.warn('Failed saving field to Supabase:', e);
      }
    }

    const newRecord: FieldRecord = {
      id: savedRecordId,
      farmer_id: activeFarmerId,
      name: fieldData.name.trim(),
      crop_type: fieldData.crop_type,
      planting_date: fieldData.planting_date,
      area_hectares: fieldData.area_hectares,
      region: selectedRegion,
      coordinates: fieldData.coordinates,
    };

    const updatedList = [newRecord, ...internalFields.filter((f) => f.id !== savedRecordId)];
    setInternalFields(updatedList);
    localStorage.setItem('ekinix_farmer_fields', JSON.stringify(updatedList));

    setNotification({
      type: 'success',
      text: effectiveLang === 'uz'
        ? "Yangi maydon muvaffaqiyatli saqlandi! Sun'iy yo'ldosh monitoringi faollashtirildi."
        : effectiveLang === 'ru'
        ? "Новое поле успешно сохранено! Спутниковый мониторинг активирован."
        : "New field saved successfully! Satellite telemetry activated.",
    });

    setIsRegistering(false);

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleDeleteField = async (id: string) => {
    const updated = internalFields.filter((f) => f.id !== id);
    setInternalFields(updated);
    localStorage.setItem('ekinix_farmer_fields', JSON.stringify(updated));

    const client = supabase;
    if (isSupabaseConfigured && client && !id.startsWith('field_sample') && !id.startsWith('field_')) {
      try {
        await client.from('fields').delete().eq('id', id);
      } catch (err) {
        console.warn("Error deleting field from Supabase:", err);
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

  const handleOpenDrawerClick = () => {
    if (externalOnOpenDrawer) {
      externalOnOpenDrawer();
    } else {
      setIsRegistering(!isRegistering);
    }
  };

  const handleCardClick = (field: FieldRecord) => {
    if (externalOnSelectField) {
      externalOnSelectField(field);
    }
    setActiveDetailField(field);
  };

  // Filtered Fields calculation
  const filteredFields = useMemo(() => {
    return internalFields.filter((field) => {
      const cropName = field.crop_type || '';
      const matchesSearch = 
        field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cropName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCrop = selectedCrop === 'all' || cropName.toLowerCase() === selectedCrop.toLowerCase();

      // Simple status evaluation logic based on field id or attributes
      let healthStatus: 'healthy' | 'moderate' | 'critical' = 'healthy';
      if (field.id.includes('2')) healthStatus = 'moderate';
      if (field.id.includes('5')) healthStatus = 'critical';

      const matchesStatus = statusFilter === 'all' || healthStatus === statusFilter;

      return matchesSearch && matchesCrop && matchesStatus;
    });
  }, [internalFields, searchQuery, selectedCrop, statusFilter]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            {effectiveLang === 'ru' ? 'Здоровое' : effectiveLang === 'en' ? 'Healthy' : 'Sog‘lom'}
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            {effectiveLang === 'ru' ? 'Среднее' : effectiveLang === 'en' ? 'Moderate' : 'O‘rtacha'}
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            {effectiveLang === 'ru' ? 'Опасность' : effectiveLang === 'en' ? 'Critical' : 'Xavfli'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {effectiveLang === 'ru' ? 'Здоровое' : effectiveLang === 'en' ? 'Healthy' : 'Sog‘lom'}
          </span>
        );
    }
  };

  if (activeDetailField) {
    return (
      <section id="my-fields" className="py-4 sm:py-6 max-w-7xl mx-auto space-y-6">
        <UnifiedFieldDetailView
          field={activeDetailField}
          allFields={internalFields}
          currentLang={effectiveLang}
          onSelectField={setActiveDetailField}
          onBack={() => setActiveDetailField(null)}
          onNavigateToGuides={onNavigateToGuides}
        />
      </section>
    );
  }

  return (
    <section id="my-fields" className="py-4 sm:py-6 max-w-7xl mx-auto space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4D9C4]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D9A441]/15 text-[#B8852B] rounded-full border border-[#D9A441]/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sprout className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Interaktiv Xarita & Monitoring</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B] tracking-tight">
            {t.myFieldsTitle || 'Mening maydonlarim'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6C7C6F] mt-0.5">
            Ro‘yxatga olingan barcha ekin maydonlari va sun’iy yo‘ldosh telemetriyasi
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {!userProfile && onOpenAuth && (
            <Button
              onClick={() => onOpenAuth('login')}
              variant="secondary"
              size="sm"
            >
              Kirish va Saqlash
            </Button>
          )}

          <button
            onClick={handleOpenDrawerClick}
            className="h-10 px-4 bg-[#1F3D2B] hover:bg-[#163020] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs flex items-center gap-2 transition-all border border-[#D9A441]/40 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D9A441]" />
            {isRegistering ? 'Xaritani Yopish' : (t.addFieldBtn || 'Yangi maydon chizish')}
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div className="p-4 bg-[#1F3D2B] text-[#FAF7F0] border border-[#D9A441] rounded-2xl shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-[#D9A441]" />
            <span className="text-xs sm:text-sm font-bold">{notification.text}</span>
          </div>
          <Button
            onClick={() => setNotification(null)}
            variant="dark-ghost"
            size="sm"
          >
            Yopish
          </Button>
        </div>
      )}

      {/* Map Drawer Component (when adding new field) */}
      {isRegistering && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <FieldMapDrawer
            currentLang={effectiveLang}
            defaultRegion={userProfile?.region}
            onSaveField={handleSaveField}
            onCancel={() => setIsRegistering(false)}
          />
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E4D9C4] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6C7C6F]" />
          <input
            type="text"
            placeholder="Maydon nomi yoki hudud bo‘yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-[#FAF7F0] border border-[#E4D9C4] rounded-xl text-xs text-[#1F3D2B] placeholder:text-[#6C7C6F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F3D2B] transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-[#FAF7F0] p-1 rounded-xl text-xs font-semibold text-[#6C7C6F] border border-[#E4D9C4]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-[#1F3D2B] text-white shadow-xs font-bold' : 'hover:text-[#1F3D2B]'
              }`}
            >
              Barchasi ({internalFields.length})
            </button>
            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'healthy' ? 'bg-emerald-700 text-white shadow-xs font-bold' : 'hover:text-[#1F3D2B]'
              }`}
            >
              Sog‘lom
            </button>
            <button
              onClick={() => setStatusFilter('moderate')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'moderate' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'hover:text-[#1F3D2B]'
              }`}
            >
              Stress
            </button>
          </div>
        </div>
      </div>

      {/* Field Grid / Content */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-[#FAF7F0] rounded-2xl border border-[#E4D9C4]">
          <div className="w-8 h-8 border-3 border-[#1F3D2B] border-t-[#D9A441] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#6C7C6F]">Maydonlar ma&apos;lumotlari yuklanmoqda...</p>
        </div>
      ) : filteredFields.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4D9C4] p-12 text-center space-y-3 max-w-md mx-auto shadow-xs">
          <Layers className="w-10 h-10 text-[#D9A441] mx-auto" />
          <h3 className="text-base font-serif font-bold text-[#1F3D2B]">Hech qanday maydon topilmadi</h3>
          <p className="text-xs text-[#6C7C6F]">
            Qidiruv so‘rovingizni o‘zgartiring yoki yangi ekin maydoni konturini xaritadan belgilang.
          </p>
          <button
            onClick={handleOpenDrawerClick}
            className="mt-2 h-9 px-4 text-xs font-bold bg-[#1F3D2B] text-white rounded-xl hover:bg-[#163020] transition-colors border border-[#D9A441]/40 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#D9A441]" />
            Maydon qo‘shish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFields.map((field) => {
            const cropMeta = getCropMeta(field.crop_type);
            const calc = calculateGrowthStage(field.crop_type, field.planting_date || '2026-04-10');
            const stage = calc.currentStage;

            const ndviData = ndviMap[field.id];
            const ndviScore = ndviData?.ndviScore ?? null;
            const badge = getNdviStatusBadge(ndviScore, effectiveLang);
            const formattedScore = formatNdviScore(ndviScore, effectiveLang);

            return (
              <div
                key={field.id}
                onClick={() => handleCardClick(field)}
                className="group bg-white rounded-2xl border border-[#E4D9C4] hover:border-[#1F3D2B] hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer overflow-hidden p-5 space-y-4"
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-serif font-bold text-[#1F3D2B] group-hover:text-[#B8852B] transition-colors flex items-center gap-1.5">
                        {field.name}
                        <ChevronRight className="w-4 h-4 text-[#6C7C6F] group-hover:translate-x-0.5 transition-transform" />
                      </h3>
                      <p className="text-xs text-[#6C7C6F] flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#D9A441]" />
                        {field.region}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>

                  {/* Satellite Thumbnail Map */}
                  <div className="relative rounded-xl overflow-hidden border border-[#E4D9C4]">
                    <FieldCardThumbnail coordinates={field.coordinates} height={120} />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-[#1F3D2B]/90 backdrop-blur-xs text-[10px] font-bold text-[#FAF7F0] border border-[#D9A441]/40 flex items-center gap-1">
                      <span>{cropMeta.icon}</span>
                      <span>{cropMeta.label}</span>
                    </div>
                  </div>

                  {/* Metrics 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4D9C4]">
                      <span className="text-[10px] uppercase font-bold text-[#6C7C6F] block">Maydon hajmi</span>
                      <span className="text-xs font-mono font-bold text-[#1F3D2B]">
                        {field.area_hectares.toFixed(1)} <span className="text-[10px] font-normal text-[#6C7C6F]">ga</span>
                      </span>
                    </div>
                    <div className="bg-[#FAF7F0] p-2.5 rounded-xl border border-[#E4D9C4]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[#6C7C6F] block">NDVI indeksi</span>
                        <InfoTooltip preset="ndvi" lang={effectiveLang} size="xs" id={`myfields-ndvi-tooltip-${field.id}`} />
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                        <Activity className="w-3 h-3 text-emerald-600" />
                        {formattedScore}
                      </span>
                    </div>
                  </div>

                  {/* Growth Stage Summary Card */}
                  <div className="bg-[#1F3D2B] text-[#FAF7F0] p-3 rounded-xl border border-[#D9A441]/30 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[#D9A441] text-[11px]">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{calc.stageIndex + 1}-bosqich ({calc.daysElapsed} kun)</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-emerald-300">
                        {field.planting_date || '2026-04-10'}
                      </span>
                    </div>
                    <p className="font-semibold text-white text-xs truncate">
                      {effectiveLang === 'ru' ? stage.stage_name_ru : effectiveLang === 'en' ? stage.stage_name_en : stage.stage_name_uz}
                    </p>
                  </div>
                </div>

                {/* Bottom Action strip */}
                <div className="pt-3 border-t border-[#E4D9C4] flex items-center justify-between gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(field);
                    }}
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs font-bold"
                    leftIcon={<Eye className="w-3.5 h-3.5 text-[#D9A441]" />}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Batafsil Tahlil
                  </Button>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteField(field.id);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-[#6C7C6F] hover:text-rose-700 hover:bg-rose-50 px-2.5"
                    title="Maydonni o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MyFieldsSection;
