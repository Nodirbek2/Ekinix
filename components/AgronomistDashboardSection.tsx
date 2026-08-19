'use client';

import React, { useState, useMemo } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FarmerProfile, FieldRecord, FieldAdvisorNote, NDVIReading } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
  Users,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Plus,
  ArrowRight,
  ExternalLink,
  MapPin,
  Calendar,
  Droplets,
  Sprout,
  FileText,
  Clock,
  Sparkles,
  Send,
  UserPlus,
  KeyRound,
  Check,
  X,
  Eye,
  Activity,
  Layers,
  Phone,
  BookmarkCheck,
} from 'lucide-react';

interface AgronomistDashboardSectionProps {
  currentLang: Language;
  userProfile?: FarmerProfile | null;
  allFields?: FieldRecord[];
  onSelectField?: (field: FieldRecord) => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

// Sample multi-farmer dataset for Agronomist mode demonstration and client farms
const MOCK_CLIENT_FARMS: {
  farmerName: string;
  farmerPhone: string;
  region: string;
  fields: FieldRecord[];
}[] = [
  {
    farmerName: "Anvar Qodirov",
    farmerPhone: "+998 90 123 45 67",
    region: "Samarqand viloyati, Pastdarg'om",
    fields: [
      {
        id: 'f-demo-1',
        name: "Paxtazor - 1-dala",
        crop_type: "cotton",
        area_hectares: 12.5,
        region: "Samarqand",
        planting_date: "2026-04-12",
      },
      {
        id: 'f-demo-2',
        name: "Intensiv Olmazor",
        crop_type: "apple",
        area_hectares: 4.2,
        region: "Samarqand",
        planting_date: "2024-03-15",
      },
    ],
  },
  {
    farmerName: "Rustam Ikromov",
    farmerPhone: "+998 93 456 78 90",
    region: "Qashqadaryo viloyati, Qarshi",
    fields: [
      {
        id: 'f-demo-3',
        name: "G'allazor - Janubiy sektor",
        crop_type: "wheat",
        area_hectares: 24.0,
        region: "Qashqadaryo",
        planting_date: "2025-10-20",
      },
    ],
  },
  {
    farmerName: "Dilshod Usmonov",
    farmerPhone: "+998 97 888 12 34",
    region: "Farg'ona viloyati, Quva",
    fields: [
      {
        id: 'f-demo-4',
        name: "Uzumzor va Anorzor",
        crop_type: "grape",
        area_hectares: 8.0,
        region: "Farg'ona",
        planting_date: "2023-04-10",
      },
      {
        id: 'f-demo-5',
        name: "Issiqxona Pomidori",
        crop_type: "tomato",
        area_hectares: 2.5,
        region: "Farg'ona",
        planting_date: "2026-02-28",
      },
    ],
  },
];

export interface TriageFieldItem {
  field: FieldRecord;
  farmerName: string;
  farmerPhone: string;
  ndviScore: number;
  moisturePercentage: number;
  urgency: 'critical' | 'warning' | 'optimal';
  urgencyScore: number; // 100 is highest urgency
  urgencyReasonUz: string;
  urgencyReasonRu: string;
  urgencyReasonEn: string;
  growthStage: string;
}

export const AgronomistDashboardSection: React.FC<AgronomistDashboardSectionProps> = ({
  currentLang,
  userProfile,
  allFields = [],
  onSelectField,
}) => {
  const t = translations[currentLang];

  // State
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'critical' | 'warning' | 'optimal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);

  // Field Advisory Note Creation Modal State
  const [activeTriageField, setActiveTriageField] = useState<TriageFieldItem | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteUrgency, setNoteUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [recList, setRecList] = useState<string[]>(['']);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSavedSuccess, setNoteSavedSuccess] = useState(false);

  // Local storage advisor notes
  const [advisorNotes, setAdvisorNotes] = useState<FieldAdvisorNote[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ekinix_advisor_notes');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Consolidate user fields + client demo farms into triage list
  const triageList: TriageFieldItem[] = useMemo(() => {
    const list: TriageFieldItem[] = [];

    // User's own fields (if any)
    allFields.forEach((f, idx) => {
      // Deterministic synthetic telemetry for triage
      const isCrit = idx % 3 === 0;
      const isWarn = idx % 3 === 1;
      const ndvi = isCrit ? 0.38 : isWarn ? 0.54 : 0.76;
      const moisture = isCrit ? 38 : isWarn ? 52 : 72;
      const urgency = isCrit ? 'critical' : isWarn ? 'warning' : 'optimal';
      const urgencyScore = isCrit ? 92 : isWarn ? 68 : 25;

      list.push({
        field: f,
        farmerName: userProfile?.full_name || "Mening xo'jaligim",
        farmerPhone: userProfile?.phone || "+998 90 000 00 00",
        ndviScore: ndvi,
        moisturePercentage: moisture,
        urgency,
        urgencyScore,
        urgencyReasonUz: isCrit
          ? "NDVI 0.38 ga tushib ketgan, tuproq namligi keskin kam (38%) — zudlik bilan sug'orish va oziqlantirish zarur"
          : isWarn
          ? "Tuproq namligi 52% (chegara holat), o'g'itlash vaqti kelgan"
          : "NDVI 0.76 va tuproq namligi 72% — o'sish holati optimal",
        urgencyReasonRu: isCrit
          ? "Критическое падение NDVI до 0.38, дефицит влаги (38%) — требуется срочный полив"
          : isWarn
          ? "Влажность почвы 52% (пограничное состояние), требуется плановая подкормка"
          : "NDVI 0.76 и влажность 72% — вегетативное состояние оптимальное",
        urgencyReasonEn: isCrit
          ? "Critical NDVI drop to 0.38, severe moisture deficit (38%) — immediate irrigation needed"
          : isWarn
          ? "Soil moisture at 52% (moderate stress threshold), schedule top-dressing"
          : "NDVI 0.76 and soil moisture 72% — healthy optimal canopy condition",
        growthStage: "Vegetatsiya",
      });
    });

    // Client multi-farmer fields
    MOCK_CLIENT_FARMS.forEach((farm) => {
      farm.fields.forEach((f, idx) => {
        const isCrit = f.crop_type === 'cotton';
        const isWarn = f.crop_type === 'wheat';
        const ndvi = isCrit ? 0.41 : isWarn ? 0.56 : 0.78;
        const moisture = isCrit ? 42 : isWarn ? 55 : 74;
        const urgency = isCrit ? 'critical' : isWarn ? 'warning' : 'optimal';
        const urgencyScore = isCrit ? 95 : isWarn ? 70 : 20;

        list.push({
          field: f,
          farmerName: farm.farmerName,
          farmerPhone: farm.farmerPhone,
          ndviScore: ndvi,
          moisturePercentage: moisture,
          urgency,
          urgencyScore,
          urgencyReasonUz: isCrit
            ? "Suv tanqisligi va qurg'oqchilik xavfi: NDVI 0.41 ga tushdi, zudlik bilan 80 m³/ga sug'orish tavsiya etiladi"
            : isWarn
            ? "G'alla to'lishish davrida: tuproq namligi 55%, zang kasalligiga qarshi profilaktika zarur"
            : "Vegetativ rivojlanish a'lo darajada (NDVI 0.78), namlik barqaror",
          urgencyReasonRu: isCrit
            ? "Водный дефицит: падение NDVI до 0.41, требуется полив 80 м³/га"
            : isWarn
            ? "Налив зерна: влажность 55%, необходима профилактика ржавчины"
            : "Отличное состояние вегетации (NDVI 0.78), влажность стабильна",
          urgencyReasonEn: isCrit
            ? "Water deficit stress: NDVI at 0.41, 80 m³/ha irrigation required immediately"
            : isWarn
            ? "Grain fill stage: 55% moisture, preventative rust scouting advised"
            : "Optimal canopy health (NDVI 0.78), moisture balanced",
          growthStage: f.crop_type === 'cotton' ? "Gullash" : f.crop_type === 'wheat' ? "Sut-mum pishish" : "Meva tugish",
        });
      });
    });

    // Sort by Urgency Score descending (Taranis AgTech Triage model)
    return list.sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [allFields, userProfile]);

  // Filtered triage list
  const filteredTriageList = useMemo(() => {
    return triageList.filter((item) => {
      const matchUrgency = filterUrgency === 'all' || item.urgency === filterUrgency;
      const matchSearch =
        searchQuery === '' ||
        item.field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.field.region.toLowerCase().includes(searchQuery.toLowerCase());
      return matchUrgency && matchSearch;
    });
  }, [triageList, filterUrgency, searchQuery]);

  // Counts
  const criticalCount = triageList.filter((i) => i.urgency === 'critical').length;
  const warningCount = triageList.filter((i) => i.urgency === 'warning').length;
  const optimalCount = triageList.filter((i) => i.urgency === 'optimal').length;

  // Handle link farmer by code
  const handleLinkFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    setLinkSuccess(true);
    setTimeout(() => {
      setLinkSuccess(false);
      setLinkModalOpen(false);
      setInviteCodeInput('');
    }, 2500);
  };

  // Open Advisory Note Modal
  const handleOpenAdvisoryModal = (item: TriageFieldItem) => {
    setActiveTriageField(item);
    setNoteTitle(
      currentLang === 'ru'
        ? `Агрономическое предписание для ${item.field.name}`
        : currentLang === 'en'
        ? `Agronomic Advisory for ${item.field.name}`
        : `«${item.field.name}» maydoni uchun agronomik ko'rsatma`
    );
    setNoteContent(
      currentLang === 'ru'
        ? `На основе анализа спутниковых данных NDVI (${item.ndviScore}) и влажности почвы (${item.moisturePercentage}%), рекомендуется провести следующие срочные агротехнические мероприятия:`
        : currentLang === 'en'
        ? `Based on satellite NDVI analysis (${item.ndviScore}) and soil moisture (${item.moisturePercentage}%), the following priority agronomic actions are advised:`
        : `Sun'iy yo'ldosh NDVI (${item.ndviScore}) va tuproq namligi (${item.moisturePercentage}%) tahliliga asosan, zudlik bilan quyidagi agrotexnik tadbirlarni amalga oshirish tavsiya etiladi:`
    );
    setNoteUrgency(item.urgency === 'critical' ? 'critical' : item.urgency === 'warning' ? 'high' : 'medium');
    setRecList([
      item.urgency === 'critical'
        ? "Ertaga ertalab soat 05:00 dan 09:00 gacha 75-80 m³/ga me'yorda sug'orishni amalga oshirish"
        : "Rejali sug'orish jadvalini saqlash",
      "Kaliy va fosforli mikroo'g'it bilan bargdan oziqlantirish (2.5 kg/ga)",
      "Dala chetlarida zararkunandalarga qarshi nazorat ko'rigini o'tkazish",
    ]);
    setNoteSavedSuccess(false);
  };

  const handleSaveAdvisoryNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTriageField) return;
    setSavingNote(true);

    const newNote: FieldAdvisorNote = {
      id: `note-${Date.now()}`,
      field_id: activeTriageField.field.id,
      agronomist_id: userProfile?.id || 'agronom-1',
      agronomist_name: userProfile?.full_name || "Katta Agronom (Ekinix)",
      agronomist_phone: userProfile?.phone || "+998 90 123 45 67",
      title: noteTitle,
      note: noteContent,
      urgency: noteUrgency,
      recommendations: recList.filter((r) => r.trim().length > 0),
      created_at: new Date().toISOString(),
    };

    setTimeout(() => {
      const updated = [newNote, ...advisorNotes];
      setAdvisorNotes(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('ekinix_advisor_notes', JSON.stringify(updated));
        } catch (err) {
          console.warn("Storage err:", err);
        }
      }
      setSavingNote(false);
      setNoteSavedSuccess(true);
      setTimeout(() => {
        setActiveTriageField(null);
        setNoteSavedSuccess(false);
      }, 2500);
    }, 700);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#1F3D2B] via-[#1B3626] to-[#0F1E15] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden border border-[#2D543C] shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9A441]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/30 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              {currentLang === 'ru'
                ? 'Режим Агронома-Консультанта (Taranis AgTech)'
                : currentLang === 'en'
                ? 'Advisor / Agronomist Triage Dashboard'
                : "Agronom Xonasi & Dala Triaji (Taranis modeli)"}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#FAF7F0]">
              {currentLang === 'ru'
                ? 'Консолидированный триаж полей по срочности'
                : currentLang === 'en'
                ? 'Field Health Triage Sorted by Urgency'
                : "Shoshilinchlik bo'yicha saralangan maydonlar nazorati"}
            </h1>

            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              {currentLang === 'ru'
                ? 'Консолидированный дашборд агронома: автоматическое ранжирование всех подопечных фермерских полей по уровню водного стресса, отклонению NDVI и необходимости вмешательства.'
                : currentLang === 'en'
                ? 'Advisor triage engine: Automatically ranks linked client fields by water deficit, NDVI anomalies, and urgent agronomic intervention needs.'
                : "Barcha biriktirilgan dehqonlar maydonlari sun'iy yo'ldosh NDVI pasayishi va namlik tanqisligi bo'yicha saralangan. Shoshilinch yordam talab qiluvchi dalalarga to'g'ridan-to'g'ri ko'rsatma yuboring."}
            </p>
          </div>

          {/* Quick Invite / Link Farmer CTA */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setLinkModalOpen(true)}
              variant="secondary"
              size="md"
              leftIcon={<UserPlus className="w-4 h-4 text-[#1F3D2B]" />}
            >
              {currentLang === 'ru' ? 'Привязать фермера' : currentLang === 'en' ? 'Link Farmer' : 'Dehqonni biriktirish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Urgency Triage Metric Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Critical Card */}
        <button
          onClick={() => setFilterUrgency(filterUrgency === 'critical' ? 'all' : 'critical')}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            filterUrgency === 'critical'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400'
              : 'bg-white border-[#E4D9C4] hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              {currentLang === 'ru' ? 'Критично / Срочно' : currentLang === 'en' ? 'Critical Action' : 'Shoshilinch / Xavfli'}
            </span>
            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center">
              {criticalCount}
            </span>
          </div>
          <div className="font-serif text-2xl font-black text-[#1F3D2B]">{criticalCount} ta maydon</div>
          <p className="text-[11px] text-[#6C7C6F] mt-1">
            {currentLang === 'ru'
              ? 'Резкое падение NDVI / сильный дефицит влаги'
              : currentLang === 'en'
              ? 'Steep NDVI drop / severe water deficit'
              : "NDVI pasaygan, zudlik bilan sug'orish zarur"}
          </p>
        </button>

        {/* Warning Card */}
        <button
          onClick={() => setFilterUrgency(filterUrgency === 'warning' ? 'all' : 'warning')}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            filterUrgency === 'warning'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400'
              : 'bg-white border-[#E4D9C4] hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              {currentLang === 'ru' ? 'Внимание / Подкормка' : currentLang === 'en' ? 'Needs Attention' : 'Diqqat talab'}
            </span>
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">
              {warningCount}
            </span>
          </div>
          <div className="font-serif text-2xl font-black text-[#1F3D2B]">{warningCount} ta maydon</div>
          <p className="text-[11px] text-[#6C7C6F] mt-1">
            {currentLang === 'ru'
              ? 'Пограничная влажность / плановая защита'
              : currentLang === 'en'
              ? 'Moderate moisture deficit / top-dressing'
              : "O'rtacha namlik / oziqlantirish zarur"}
          </p>
        </button>

        {/* Optimal Card */}
        <button
          onClick={() => setFilterUrgency(filterUrgency === 'optimal' ? 'all' : 'optimal')}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
            filterUrgency === 'optimal'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400'
              : 'bg-white border-[#E4D9C4] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {currentLang === 'ru' ? 'Оптимальное состояние' : currentLang === 'en' ? 'Optimal Health' : 'Optimal / Sog\'lom'}
            </span>
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
              {optimalCount}
            </span>
          </div>
          <div className="font-serif text-2xl font-black text-[#1F3D2B]">{optimalCount} ta maydon</div>
          <p className="text-[11px] text-[#6C7C6F] mt-1">
            {currentLang === 'ru'
              ? 'NDVI > 0.70, достаточная влажность'
              : currentLang === 'en'
              ? 'NDVI > 0.70, balanced soil hydration'
              : "Yashillik yuqori, namlik me'yorda"}
          </p>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E4D9C4] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C7C6F]" />
          <input
            type="text"
            placeholder={
              currentLang === 'ru'
                ? 'Поиск по полю, фермеру или району...'
                : currentLang === 'en'
                ? 'Search by field, farmer, or region...'
                : "Dala, dehqon yoki hudud bo'yicha qidiruv..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E4D9C4] text-xs text-[#1F3D2B] bg-[#FAF7F0] focus:ring-2 focus:ring-[#1F3D2B] outline-none"
          />
        </div>

        {/* Urgency Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', labelUz: "Barchasi", labelRu: "Все", labelEn: "All" },
            { id: 'critical', labelUz: "Shoshilinch", labelRu: "Критичные", labelEn: "Critical" },
            { id: 'warning', labelUz: "Diqqat talab", labelRu: "Внимание", labelEn: "Warning" },
            { id: 'optimal', labelUz: "Optimal", labelRu: "Оптимальные", labelEn: "Optimal" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterUrgency(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterUrgency === f.id
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                  : 'bg-[#FAF7F0] text-[#6C7C6F] hover:text-[#1F3D2B]'
              }`}
            >
              {currentLang === 'ru' ? f.labelRu : currentLang === 'en' ? f.labelEn : f.labelUz}
            </button>
          ))}
        </div>
      </div>

      {/* Triage Fields List */}
      <div className="space-y-4">
        {filteredTriageList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E4D9C4]">
            <p className="text-sm font-bold text-[#1F3D2B]">
              {currentLang === 'ru' ? 'Полей не найдено' : currentLang === 'en' ? 'No fields matched' : 'Maydonlar topilmadi'}
            </p>
          </div>
        ) : (
          filteredTriageList.map((item) => {
            const isCrit = item.urgency === 'critical';
            const isWarn = item.urgency === 'warning';

            return (
              <div
                key={item.field.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all hover:shadow-md ${
                  isCrit
                    ? 'border-rose-300 shadow-xs ring-1 ring-rose-200'
                    : isWarn
                    ? 'border-amber-300'
                    : 'border-[#E4D9C4]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Urgency Badge + Field & Farmer Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                          isCrit
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isWarn
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {isCrit ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>
                          {isCrit
                            ? currentLang === 'ru'
                              ? 'Срочное вмешательство'
                              : currentLang === 'en'
                              ? 'Critical Triage'
                              : 'Zudlik bilan choralar zarur'
                            : isWarn
                            ? currentLang === 'ru'
                              ? 'Требует внимания'
                              : currentLang === 'en'
                              ? 'Moderate Warning'
                              : 'Diqqat talab holat'
                            : currentLang === 'ru'
                            ? 'В норме'
                            : currentLang === 'en'
                            ? 'Optimal'
                            : 'Optimal holat'}
                        </span>
                      </span>

                      <span className="text-xs font-bold text-[#6C7C6F] bg-[#FAF7F0] px-2.5 py-1 rounded-lg border border-[#E4D9C4]">
                        {item.growthStage}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#1F3D2B]">{item.field.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-[#6C7C6F] mt-1 flex-wrap">
                        <span className="font-bold text-[#1F3D2B]">{item.farmerName}</span>
                        <span>•</span>
                        <span>{item.farmerPhone}</span>
                        <span>•</span>
                        <span>{item.field.region}</span>
                        <span>•</span>
                        <span>{item.field.area_hectares} ga</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#2D4A3E] leading-relaxed max-w-2xl bg-[#FAF7F0] p-3 rounded-xl border border-[#E4D9C4]">
                      {currentLang === 'ru'
                        ? item.urgencyReasonRu
                        : currentLang === 'en'
                        ? item.urgencyReasonEn
                        : item.urgencyReasonUz}
                    </p>
                  </div>

                  {/* Middle: Live NDVI & Soil Moisture Readouts */}
                  <div className="flex items-center gap-4 bg-[#FAF7F0] p-4 rounded-2xl border border-[#E4D9C4] shrink-0">
                    <div className="text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C7C6F]">NDVI</div>
                      <div
                        className={`font-serif text-2xl font-black ${
                          item.ndviScore < 0.45 ? 'text-rose-600' : item.ndviScore < 0.6 ? 'text-amber-600' : 'text-emerald-700'
                        }`}
                      >
                        {item.ndviScore.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#6C7C6F]">
                        {item.ndviScore < 0.45 ? "Past" : item.ndviScore < 0.6 ? "O'rtacha" : "A'lo"}
                      </div>
                    </div>

                    <div className="w-px h-10 bg-[#E4D9C4]" />

                    <div className="text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C7C6F]">
                        {currentLang === 'ru' ? 'Влажность' : currentLang === 'en' ? 'Moisture' : 'Namlik'}
                      </div>
                      <div
                        className={`font-serif text-2xl font-black ${
                          item.moisturePercentage < 45
                            ? 'text-rose-600'
                            : item.moisturePercentage < 60
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {item.moisturePercentage}%
                      </div>
                      <div className="text-[10px] text-[#6C7C6F]">
                        {item.moisturePercentage < 45 ? "Kam" : "Normal"}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Write Advisory Note & Inspect Field */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <Button
                      onClick={() => handleOpenAdvisoryModal(item)}
                      id={`write-advisory-${item.field.id}`}
                      variant={isCrit ? 'primary' : 'secondary'}
                      size="sm"
                      leftIcon={<FileText className="w-3.5 h-3.5" />}
                    >
                      {currentLang === 'ru' ? 'Дать указание' : currentLang === 'en' ? 'Issue Advisory' : 'Xulosa yozish'}
                    </Button>
                    <Button
                      onClick={() => onSelectField?.(item.field)}
                      variant="secondary"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      {currentLang === 'ru' ? 'Открыть карту' : currentLang === 'en' ? 'Inspect Field' : "Dalani ko'rish"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Link Farmer by Invite Code Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E4D9C4] shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <button
                onClick={() => setLinkModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-serif text-2xl font-bold text-[#1F3D2B] mb-1">
              {currentLang === 'ru' ? 'Привязать поле фермера' : currentLang === 'en' ? 'Link Client Farm' : 'Dehqon maydonini biriktirish'}
            </h3>
            <p className="text-xs text-[#6C7C6F] mb-5">
              {currentLang === 'ru'
                ? 'Введите 6-значный инвайт-код фермера (например: EKIN-7842) или номер телефона'
                : currentLang === 'en'
                ? 'Enter the 6-digit farmer invite code (e.g. EKIN-7842) or mobile number'
                : "Dehqonning 6 xonali taklif kodini (masalan: EKIN-7842) yoki telefon raqamini kiriting"}
            </p>

            {linkSuccess ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm text-emerald-900">
                  {currentLang === 'ru' ? 'Фермер успешно привязан!' : currentLang === 'en' ? 'Farmer Linked Successfully!' : 'Dehqon muvaffaqiyatli biriktirildi!'}
                </p>
                <p className="text-xs text-emerald-700">
                  {currentLang === 'ru'
                    ? 'Поля добавлены в ваш список агрономического триажа.'
                    : currentLang === 'en'
                    ? 'Fields added to your monitoring triage queue.'
                    : "Maydonlar sizning monitoring ro'yxatingizga qo'shildi."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleLinkFarmer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Инвайт-код или Телефон' : currentLang === 'en' ? 'Invite Code or Phone' : 'Taklif kodi yoki Telefon'}
                  </label>
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    placeholder="EKIN-7842 yoki +998..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] bg-white text-xs font-bold text-[#1F3D2B] focus:ring-2 focus:ring-[#1F3D2B] outline-none tracking-wider uppercase placeholder:normal-case"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="flex-1 justify-center"
                    onClick={() => setLinkModalOpen(false)}
                  >
                    {currentLang === 'ru' ? 'Отмена' : currentLang === 'en' ? 'Cancel' : 'Bekor qilish'}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="flex-1 justify-center"
                  >
                    {currentLang === 'ru' ? 'Привязать' : currentLang === 'en' ? 'Link Farm' : 'Biriktirish'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Issue Agronomic Advisory Note Modal */}
      {activeTriageField && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#E4D9C4] shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-[#FAF7F0] border border-[#E4D9C4] text-[#1F3D2B] text-xs font-bold">
                  {activeTriageField.farmerName} • {activeTriageField.field.name}
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#1F3D2B] mt-2">
                  {currentLang === 'ru'
                    ? 'Официальное агрономическое предписание'
                    : currentLang === 'en'
                    ? 'Official Agronomic Action Advisory'
                    : "Rasmiy agronomik xulosa va ko'rsatma"}
                </h3>
              </div>
              <button
                onClick={() => setActiveTriageField(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {noteSavedSuccess ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-300">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-serif text-xl font-bold text-emerald-900">
                  {currentLang === 'ru'
                    ? 'Предписание отправлено фермеру!'
                    : currentLang === 'en'
                    ? 'Advisory Sent to Farmer!'
                    : "Ko'rsatma dehqonga muvaffaqiyatli yuborildi!"}
                </h4>
                <p className="text-xs text-emerald-700">
                  {currentLang === 'ru'
                    ? 'Фермер увидит ваши рекомендации в карточке своего поля.'
                    : currentLang === 'en'
                    ? 'The farmer will see these instructions highlighted on their field screen.'
                    : "Ushbu ko'rsatma dehqonning dala monitoringi sahifasida aks etadi."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveAdvisoryNote} className="space-y-4">
                {/* Urgency Selector */}
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1.5">
                    {currentLang === 'ru' ? 'Уровень срочности' : currentLang === 'en' ? 'Urgency Level' : 'Shoshilinchlik darajasi'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'low', label: 'Past', color: 'bg-emerald-100 text-emerald-800' },
                      { id: 'medium', label: "O'rtacha", color: 'bg-blue-100 text-blue-800' },
                      { id: 'high', label: 'Yuqori', color: 'bg-amber-100 text-amber-800' },
                      { id: 'critical', label: 'Kritik', color: 'bg-rose-100 text-rose-800' },
                    ].map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => setNoteUrgency(u.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          noteUrgency === u.id
                            ? `${u.color} border-current ring-2 ring-current/20`
                            : 'bg-[#FAF7F0] border-[#E4D9C4] text-[#6C7C6F]'
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Тема предписания' : currentLang === 'en' ? 'Advisory Title' : 'Xulosa mavzusi'}
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E4D9C4] bg-white text-xs text-[#1F3D2B] focus:ring-2 focus:ring-[#1F3D2B] outline-none"
                  />
                </div>

                {/* Note Content */}
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Агрономическое заключение' : currentLang === 'en' ? 'Agronomic Evaluation' : 'Agronom xulosasi'}
                  </label>
                  <textarea
                    rows={3}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E4D9C4] bg-white text-xs text-[#1F3D2B] focus:ring-2 focus:ring-[#1F3D2B] outline-none resize-none"
                  />
                </div>

                {/* Actionable Recommendations Checklist */}
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Конкретные действия (пункты)' : currentLang === 'en' ? 'Actionable Checklist Items' : 'Aniq amaliy ko\'rsatmalar ro\'yxati'}
                  </label>
                  <div className="space-y-2">
                    {recList.map((rec, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1F3D2B] text-[#D9A441] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={rec}
                          onChange={(e) => {
                            const copy = [...recList];
                            copy[idx] = e.target.value;
                            setRecList(copy);
                          }}
                          placeholder={`Amaliy harakat #${idx + 1}`}
                          className="w-full px-3 py-1.5 rounded-xl border border-[#E4D9C4] bg-white text-xs text-[#1F3D2B] focus:ring-2 focus:ring-[#1F3D2B] outline-none"
                        />
                        {recList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRecList(recList.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setRecList([...recList, ''])}
                      className="text-xs font-bold text-[#1F3D2B] hover:text-[#D9A441] flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{currentLang === 'ru' ? '+ Добавить пункт' : currentLang === 'en' ? '+ Add action' : "+ Ko'rsatma qo'shish"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#E4D9C4]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="flex-1 justify-center"
                    onClick={() => setActiveTriageField(null)}
                    disabled={savingNote}
                  >
                    {currentLang === 'ru' ? 'Отмена' : currentLang === 'en' ? 'Cancel' : 'Bekor qilish'}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="flex-1 justify-center"
                    disabled={savingNote}
                    leftIcon={<Send className="w-4 h-4 text-[#D9A441]" />}
                  >
                    {savingNote
                      ? currentLang === 'ru'
                        ? 'Отправка...'
                        : currentLang === 'en'
                        ? 'Sending...'
                        : 'Yuborilmoqda...'
                      : currentLang === 'ru'
                      ? 'Отправить фермеру'
                      : currentLang === 'en'
                      ? 'Send Advisory'
                      : "Ko'rsatmani yuborish"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
