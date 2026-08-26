'use client';

import React, { useState, useMemo } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FarmerProfile, FieldRecord, FieldAdvisorNote } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { InfoTooltip } from '@/components/InfoTooltip';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  FileText,
  ArrowUpRight,
  Droplets,
  Bug,
  ThermometerSnowflake,
  Sprout,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  KeyRound,
  X,
  Send,
  Plus,
  Eye,
  Activity,
  Calendar,
  MapPin,
  Phone,
  Check
} from 'lucide-react';

export interface TriageCase {
  id: string;
  farmerName: string;
  fieldTitle: string;
  region: string;
  phone?: string;
  issueType: 'water_stress' | 'pest_risk' | 'frost_alert' | 'nutrient_deficiency';
  severity: 'critical' | 'warning' | 'info';
  ndviDropPct: number;
  detectedDate: string;
  status: 'pending' | 'resolved' | 'in_review';
  recommendation: string;
  cropType?: string;
  areaHectares?: number;
}

const DEMO_CASES: TriageCase[] = [
  {
    id: 'case-101',
    farmerName: 'Rustam Aliyev',
    fieldTitle: '12-Kontur Paxta',
    region: 'Jizzax, Zafarobod',
    phone: '+998 90 123 45 67',
    issueType: 'water_stress',
    severity: 'critical',
    ndviDropPct: -14.2,
    detectedDate: '2026-08-21 14:30',
    status: 'pending',
    recommendation: 'Shoshilinch 550 m³/ga me’yorda tomchilatib sug‘orish va vegetatsiya kuchaytirgich berish.',
    cropType: 'Paxta (Buxoro-102)',
    areaHectares: 18.5
  },
  {
    id: 'case-102',
    farmerName: 'Alisher Qodirov',
    fieldTitle: 'Bog‘zor 4-uchastka',
    region: 'Samarqand, Toyloq',
    phone: '+998 91 234 56 78',
    issueType: 'pest_risk',
    severity: 'warning',
    ndviDropPct: -6.5,
    detectedDate: '2026-08-20 09:15',
    status: 'in_review',
    recommendation: 'G‘o‘za tunlami tuxum qo‘yishi aniqlandi, feromon tutqichlar va insektitsid bilan ishlov berish.',
    cropType: 'Intensiv bog‘',
    areaHectares: 6.2
  },
  {
    id: 'case-103',
    farmerName: 'Sherzodbek Boboyev',
    fieldTitle: 'Bug‘doy 8-dala',
    region: 'Sirdaryo, Boyovut',
    phone: '+998 93 345 67 89',
    issueType: 'nutrient_deficiency',
    severity: 'warning',
    ndviDropPct: -8.1,
    detectedDate: '2026-08-19 16:45',
    status: 'resolved',
    recommendation: 'Azotli oziqlantirish (karbamid 100 kg/ga) va barg orqali mikroelementlar purkash.',
    cropType: 'Kuzgi bug‘doy',
    areaHectares: 24.0
  },
  {
    id: 'case-104',
    farmerName: 'Dilshod Usmonov',
    fieldTitle: 'Issiqxona Pomidori',
    region: 'Farg‘ona, Quva',
    phone: '+998 97 456 78 90',
    issueType: 'frost_alert',
    severity: 'critical',
    ndviDropPct: -11.0,
    detectedDate: '2026-08-21 06:10',
    status: 'pending',
    recommendation: 'Tungi harorat pasayishi xavfi: plyonka qoplamasini zichlash va isitish tizimini yoqish.',
    cropType: 'Issiqxona sabzavot',
    areaHectares: 2.5
  }
];

interface AgronomistDashboardSectionProps {
  currentLang?: Language;
  userProfile?: FarmerProfile | null;
  allFields?: FieldRecord[];
  onSelectField?: (field: FieldRecord) => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export function AgronomistDashboardSection({
  currentLang = 'uz',
  userProfile,
  allFields = [],
  onSelectField,
  onOpenAuth
}: AgronomistDashboardSectionProps) {
  const [cases, setCases] = useState<TriageCase[]>(DEMO_CASES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // Modals state
  const [activeCase, setActiveCase] = useState<TriageCase | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);

  // Advisory note editing state inside modal
  const [customNote, setCustomNote] = useState('');
  const [prescriptions, setPrescriptions] = useState<string[]>(['']);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSentSuccess, setNoteSentSuccess] = useState(false);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        item.farmerName.toLowerCase().includes(q) ||
        item.fieldTitle.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.recommendation.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'all' || item.issueType === selectedCategory;

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [cases, search, selectedCategory, statusFilter]);

  // Counts
  const criticalCount = cases.filter((c) => c.severity === 'critical' && c.status !== 'resolved').length;
  const pendingCount = cases.filter((c) => c.status === 'pending').length;
  const inReviewCount = cases.filter((c) => c.status === 'in_review').length;
  const resolvedCount = cases.filter((c) => c.status === 'resolved').length;

  const handleOpenCase = (c: TriageCase) => {
    setActiveCase(c);
    setCustomNote(c.recommendation);
    setPrescriptions([
      c.recommendation,
      "Dala chetlarida tuproq namligi va o'simlik barglarini vizual ko'zdan kechirish",
      "Bajarilgan agrotexnik tadbirlar to'g'risida hisobot kiritish"
    ]);
    setNoteSentSuccess(false);
  };

  const handleStatusChange = (caseId: string, newStatus: 'pending' | 'in_review' | 'resolved') => {
    setCases((prev) =>
      prev.map((item) => (item.id === caseId ? { ...item, status: newStatus } : item))
    );
    if (activeCase && activeCase.id === caseId) {
      setActiveCase({ ...activeCase, status: newStatus });
    }
  };

  const handleSendAdvisory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase) return;
    setSavingNote(true);

    setTimeout(() => {
      setSavingNote(false);
      setNoteSentSuccess(true);
      // Auto move pending to in_review
      if (activeCase.status === 'pending') {
        handleStatusChange(activeCase.id, 'in_review');
      }
      setTimeout(() => {
        setActiveCase(null);
        setNoteSentSuccess(false);
      }, 2000);
    }, 600);
  };

  const handleLinkFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    setLinkSuccess(true);
    setTimeout(() => {
      setLinkSuccess(false);
      setLinkModalOpen(false);
      setInviteCodeInput('');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4D9C4]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] text-xs font-bold uppercase tracking-wider mb-1.5">
            <Activity className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>
              {currentLang === 'ru'
                ? 'Агрономическая Экспертиза'
                : currentLang === 'en'
                ? 'Agronomic Triage Engine'
                : 'Agronomik Ekspertiza'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B] tracking-tight">
            {currentLang === 'ru'
              ? 'Агрономическая Экспертиза и Триаж'
              : currentLang === 'en'
              ? 'Agronomic Expertise & Triage'
              : 'Agronomik Ekspertiza va Triaj'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6C7C6F] mt-1">
            {currentLang === 'ru'
              ? 'Автоматически выявленные аномалии полей по спектральному анализу Sentinel-2'
              : currentLang === 'en'
              ? 'Automated field anomalies identified by Sentinel-2 spectral analysis'
              : 'Sentinel-2 spektral tahlili bo‘yicha avtomatik aniqlangan dala anomaliyalari'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {criticalCount > 0 && (
            <span className="h-9 px-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5 shadow-xs animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{criticalCount} ta tezkor ko‘rik zarur</span>
            </span>
          )}
          <Button
            onClick={() => setLinkModalOpen(true)}
            variant="secondary"
            size="sm"
            leftIcon={<UserPlus className="w-4 h-4 text-[#1F3D2B]" />}
          >
            {currentLang === 'ru' ? 'Привязать фермера' : currentLang === 'en' ? 'Link Farmer' : 'Dehqonni biriktirish'}
          </Button>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#E4D9C4] shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#6C7C6F] font-medium">
            <span>Jami holatlar</span>
            <Activity className="w-4 h-4 text-[#1F3D2B]" />
          </div>
          <div className="font-serif text-2xl font-bold text-[#1F3D2B] mt-1">{cases.length}</div>
          <div className="text-[11px] text-[#6C7C6F] mt-0.5">Monitoringdagi maydonlar</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-800 font-bold">
            <span>Kritik / Shoshilinch</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-rose-700 mt-1">{criticalCount}</div>
          <div className="text-[11px] text-rose-600/90 mt-0.5">NDVI pasayishi &gt; 10%</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>Jarayonda</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-amber-700 mt-1">{inReviewCount}</div>
          <div className="text-[11px] text-amber-600/90 mt-0.5">Ko‘rsatma yuborilgan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span>Hal qilingan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-emerald-700 mt-1">{resolvedCount}</div>
          <div className="text-[11px] text-emerald-600/90 mt-0.5">Vegetatsiya tiklandi</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E4D9C4] shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C7C6F]" />
          <input
            type="text"
            placeholder={
              currentLang === 'ru'
                ? 'Фермер, поле или регион...'
                : currentLang === 'en'
                ? 'Farmer, field, or region...'
                : 'Fermer, maydon yoki hudud...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3.5 bg-[#FAF7F0] border border-[#E4D9C4] rounded-xl text-xs text-[#1F3D2B] placeholder:text-[#6C7C6F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] transition-all"
          />
        </div>

        {/* Anomaly Type Filter Pills */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Barchasi', icon: null },
            { id: 'water_stress', label: 'Suv tanqisligi', icon: Droplets },
            { id: 'pest_risk', label: 'Zararkunanda', icon: Bug },
            { id: 'nutrient_deficiency', label: 'Ozuqa', icon: Sprout },
            { id: 'frost_alert', label: 'Sovuq xavfi', icon: ThermometerSnowflake },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`h-8 px-3 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs font-semibold'
                    : 'bg-[#FAF7F0] text-[#6C7C6F] hover:bg-[#F0E8D8] hover:text-[#1F3D2B]'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-white rounded-2xl border border-[#E4D9C4] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E4D9C4] bg-[#FAF7F0]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[#1F3D2B] uppercase tracking-wider">
              {currentLang === 'ru' ? 'Очередь выявленных аномалий' : currentLang === 'en' ? 'Triage Case Queue' : 'Navbatdagi holatlar ro‘yxati'}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] text-[10px] font-bold">
              {filteredCases.length} ta
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6C7C6F]">
            <span className="text-[11px] font-mono">Real vaqt yangilanishi</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E4D9C4] bg-[#FAF7F0] text-[11px] font-bold text-[#6C7C6F] uppercase tracking-wider">
                <th className="py-3 px-4">Fermer & Maydon</th>
                <th className="py-3 px-4">Anomaliya turi</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <span>NDVI o‘zgarishi</span>
                    <InfoTooltip preset="ndvi" lang={currentLang} size="xs" id="agronomist-table-ndvi-tooltip" />
                  </div>
                </th>
                <th className="py-3 px-4">Holat</th>
                <th className="py-3 px-4">Tavsiya</th>
                <th className="py-3 px-4 text-right">Harakat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4D9C4]/60">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6C7C6F]">
                    Mos keladigan holatlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredCases.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F0]/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1F3D2B]">{item.farmerName}</div>
                      <div className="text-[11px] text-[#6C7C6F] mt-0.5">
                        {item.fieldTitle} <span className="text-[#6C7C6F]/60">({item.region})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.issueType === 'water_stress' && (
                        <span className="inline-flex items-center gap-1 text-sky-900 text-[11px] font-semibold bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                          <Droplets className="w-3.5 h-3.5 text-sky-600" /> Suv tanqisligi
                        </span>
                      )}
                      {item.issueType === 'pest_risk' && (
                        <span className="inline-flex items-center gap-1 text-amber-900 text-[11px] font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <Bug className="w-3.5 h-3.5 text-amber-600" /> Zararkunanda xavfi
                        </span>
                      )}
                      {item.issueType === 'nutrient_deficiency' && (
                        <span className="inline-flex items-center gap-1 text-emerald-900 text-[11px] font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <Sprout className="w-3.5 h-3.5 text-emerald-600" /> Ozuqa yetishmovchiligi
                        </span>
                      )}
                      {item.issueType === 'frost_alert' && (
                        <span className="inline-flex items-center gap-1 text-indigo-900 text-[11px] font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                          <ThermometerSnowflake className="w-3.5 h-3.5 text-indigo-600" /> Sovuq xavfi
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                      {item.ndviDropPct}%
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'pending' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                          Kutilmoqda
                        </span>
                      )}
                      {item.status === 'in_review' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                          Jarayonda
                        </span>
                      )}
                      {item.status === 'resolved' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                          Bajarildi
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#4A5D4E] text-xs max-w-xs truncate">
                      {item.recommendation}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenCase(item)}
                        className="h-7 px-3 text-xs font-semibold text-[#1F3D2B] hover:text-[#B8852B] bg-[#FAF7F0] hover:bg-[#F0E8D8] border border-[#E4D9C4] rounded-lg transition-colors cursor-pointer"
                      >
                        Ko‘rish
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details & Agronomic Action Modal */}
      {activeCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#E4D9C4] shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-[#E4D9C4]">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#1F3D2B] text-[#D9A441] text-[10px] font-bold uppercase tracking-wider">
                    {activeCase.id}
                  </span>
                  <span className="text-xs text-[#6C7C6F]">
                    {activeCase.detectedDate}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#1F3D2B] mt-1.5">
                  {activeCase.fieldTitle} ({activeCase.farmerName})
                </h3>
                <p className="text-xs text-[#6C7C6F] mt-0.5 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#D9A441]" /> {activeCase.region}
                  {activeCase.phone && (
                    <>
                      <span>•</span>
                      <Phone className="w-3.5 h-3.5 text-[#1F3D2B]" /> {activeCase.phone}
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setActiveCase(null)}
                className="p-2 rounded-xl text-[#6C7C6F] hover:text-[#1F3D2B] hover:bg-[#FAF7F0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {noteSentSuccess ? (
              <div className="p-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-300">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-serif text-xl font-bold text-emerald-900">
                  Ko‘rsatma dehqonga muvaffaqiyatli yuborildi!
                </h4>
                <p className="text-xs text-emerald-700">
                  Ushbu tavsiyalar dehqonning shaxsiy kabinetida va SMS/Telegram bildirishnomasida aks etadi.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendAdvisory} className="space-y-4">
                {/* Telemetry Summary Card */}
                <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E4D9C4] grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#6C7C6F]">Anomaliya</div>
                    <div className="text-xs font-bold text-[#1F3D2B] mt-1">
                      {activeCase.issueType === 'water_stress' ? 'Suv tanqisligi' :
                       activeCase.issueType === 'pest_risk' ? 'Zararkunanda' :
                       activeCase.issueType === 'nutrient_deficiency' ? 'Ozuqa kamchiligi' : 'Sovuq xavfi'}
                    </div>
                  </div>
                  <div className="border-x border-[#E4D9C4]">
                    <div className="text-[10px] uppercase font-bold text-[#6C7C6F]">NDVI Pasayishi</div>
                    <div className="font-mono text-base font-bold text-rose-600 mt-0.5">
                      {activeCase.ndviDropPct}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#6C7C6F]">Holat</div>
                    <div className="mt-1">
                      <select
                        value={activeCase.status}
                        onChange={(e) => handleStatusChange(activeCase.id, e.target.value as any)}
                        className="text-xs font-bold bg-white px-2 py-1 rounded-lg border border-[#E4D9C4] text-[#1F3D2B] outline-none"
                      >
                        <option value="pending">Kutilmoqda</option>
                        <option value="in_review">Jarayonda</option>
                        <option value="resolved">Bajarildi</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Agronomic Prescriptions */}
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1.5">
                    Rasmiy agronomik tavsiya va ko‘rsatma matni
                  </label>
                  <textarea
                    rows={3}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] bg-[#FAF7F0] text-xs text-[#1F3D2B] focus:bg-white focus:ring-2 focus:ring-[#1F3D2B] outline-none resize-none"
                  />
                </div>

                {/* Checklist */}
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1.5">
                    Dehqon uchun ketma-ket harakatlar ro‘yxati (Checklist)
                  </label>
                  <div className="space-y-2">
                    {prescriptions.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1F3D2B] text-[#D9A441] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={p}
                          onChange={(e) => {
                            const copy = [...prescriptions];
                            copy[idx] = e.target.value;
                            setPrescriptions(copy);
                          }}
                          placeholder={`Amaliy harakat #${idx + 1}`}
                          className="w-full px-3 py-1.5 rounded-xl border border-[#E4D9C4] bg-[#FAF7F0] text-xs text-[#1F3D2B] focus:bg-white focus:ring-2 focus:ring-[#1F3D2B] outline-none"
                        />
                        {prescriptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))}
                            className="p-1 text-[#6C7C6F] hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPrescriptions([...prescriptions, ''])}
                      className="text-xs font-bold text-[#1F3D2B] hover:text-[#D9A441] flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Ko‘rsatma qo‘shish</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-[#E4D9C4]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="flex-1 justify-center"
                    onClick={() => setActiveCase(null)}
                    disabled={savingNote}
                  >
                    Yopish
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="flex-1 justify-center"
                    disabled={savingNote}
                    leftIcon={<Send className="w-4 h-4 text-[#D9A441]" />}
                  >
                    {savingNote ? 'Yuborilmoqda...' : 'Ko‘rsatmani yuborish'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Link Farmer Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E4D9C4] shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <button
                onClick={() => setLinkModalOpen(false)}
                className="p-2 rounded-xl text-[#6C7C6F] hover:text-[#1F3D2B] hover:bg-[#FAF7F0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-serif text-2xl font-bold text-[#1F3D2B] mb-1">
              Dehqon maydonini biriktirish
            </h3>
            <p className="text-xs text-[#6C7C6F] mb-5">
              Dehqonning 6 xonali taklif kodini (masalan: EKIN-7842) yoki telefon raqamini kiriting.
            </p>

            {linkSuccess ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm text-emerald-900">
                  Dehqon muvaffaqiyatli biriktirildi!
                </p>
                <p className="text-xs text-emerald-700">
                  Maydonlar sizning agronomik triaj monitoringingizga qo‘shildi.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLinkFarmer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    Taklif kodi yoki Telefon
                  </label>
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    placeholder="EKIN-7842 yoki +998..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] bg-[#FAF7F0] text-xs font-bold text-[#1F3D2B] focus:bg-white focus:ring-2 focus:ring-[#1F3D2B] outline-none uppercase tracking-wider placeholder:normal-case"
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
                    Bekor qilish
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="flex-1 justify-center"
                  >
                    Biriktirish
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgronomistDashboardSection;
