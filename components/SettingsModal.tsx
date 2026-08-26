'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, User, Bell, Globe, ShieldCheck, Phone, MapPin, Sprout, Save, AlertTriangle, Send, ExternalLink } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';
import { FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

const UZBEKISTAN_REGIONS = [
  "Toshkent viloyati",
  "Samarqand viloyati",
  "Farg'ona viloyati",
  "Andijon viloyati",
  "Namangan viloyati",
  "Qashqadaryo viloyati",
  "Surxondaryo viloyati",
  "Buxoro viloyati",
  "Xorazm viloyati",
  "Navoiy viloyati",
  "Jizzax viloyati",
  "Sirdaryo viloyati",
  "Qoraqalpog'iston Respublikasi"
];

const COMMON_CROPS = [
  { id: 'paxta', name: 'Paxta' },
  { id: 'bugdoy', name: "Bug'doy" },
  { id: 'pomidor', name: 'Pomidor' },
  { id: 'bodring', name: 'Bodring' },
  { id: 'makkajoxori', name: "Makkajo'xori" },
  { id: 'qovun', name: 'Qovun va Tarvuz' },
  { id: 'uzum', name: 'Uzum' },
  { id: 'olma', name: 'Olma va Meva' }
];

export interface NotificationPreferences {
  frost_alerts: boolean;
  irrigation_reminders: boolean;
  marketplace_inquiries: boolean;
  satellite_ndvi_updates: boolean;
  channel: 'sms' | 'telegram' | 'app';
}

const DEFAULT_NOTIFS: NotificationPreferences = {
  frost_alerts: true,
  irrigation_reminders: true,
  marketplace_inquiries: true,
  satellite_ndvi_updates: false,
  channel: 'sms'
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  userProfile?: FarmerProfile | null;
  onUpdateProfile?: (updated: Partial<FarmerProfile>) => void;
  onOpenTelegramModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onLanguageChange,
  userProfile,
  onUpdateProfile,
  onOpenTelegramModal
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'language'>('profile');

  // Profile state
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [region, setRegion] = useState(userProfile?.region || 'Toshkent viloyati');
  const [district, setDistrict] = useState('');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [farmType, setFarmType] = useState<'smallholder' | 'commercial'>(userProfile?.farm_type || 'smallholder');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(userProfile?.primary_crops || ['paxta', 'bugdoy']);

  // Notification state
  const [notifs, setNotifs] = useState<NotificationPreferences>(DEFAULT_NOTIFS);

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userProfile) {
        setFullName(userProfile.full_name || '');
        setRegion(userProfile.region || 'Toshkent viloyati');
        setPhone(userProfile.phone || '');
        if (userProfile.farm_type) setFarmType(userProfile.farm_type);
        if (userProfile.primary_crops) setSelectedCrops(userProfile.primary_crops);
      }

      // Load saved notification preferences
      try {
        const saved = localStorage.getItem('ekinix_notification_prefs');
        if (saved) {
          setNotifs(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [userProfile, isOpen]);

  if (!isOpen) return null;

  const toggleCrop = (cropId: string) => {
    if (selectedCrops.includes(cropId)) {
      setSelectedCrops(selectedCrops.filter(c => c !== cropId));
    } else {
      setSelectedCrops([...selectedCrops, cropId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const updatedData: Partial<FarmerProfile> = {
      full_name: fullName.trim() || 'Dehqon',
      region: region,
      phone: phone.trim(),
      farm_type: farmType,
      primary_crops: selectedCrops
    };

    // Save profile to LocalStorage
    try {
      localStorage.setItem('ekinix_farmer_profile', JSON.stringify({
        ...userProfile,
        ...updatedData
      }));
      localStorage.setItem('ekinix_notification_prefs', JSON.stringify(notifs));
    } catch (err) {
      console.warn("LocalStorage save error:", err);
    }

    // Save to Supabase if available
    if (isSupabaseConfigured && supabase && userProfile?.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            full_name: updatedData.full_name,
            region: updatedData.region,
            phone: updatedData.phone,
            farm_type: updatedData.farm_type,
            primary_crops: updatedData.primary_crops
          })
          .eq('id', userProfile.id);
      } catch (err) {
        console.warn("Supabase profile update error:", err);
      }
    }

    if (onUpdateProfile) {
      onUpdateProfile(updatedData);
    }

    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-[#1F3D2B]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#FAF7F0] rounded-3xl shadow-2xl border-2 border-[#E4D9C4] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#1F3D2B] text-[#FAF7F0] p-5 sm:p-6 flex items-center justify-between border-b border-[#D9A441]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9A441] text-[#1F3D2B] font-bold flex items-center justify-center shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F0]">
                {currentLang === 'uz' ? "Dehqon Sozlamalari" : currentLang === 'ru' ? "Настройки фермера" : "Farmer Settings"}
              </h2>
              <p className="text-xs text-[#D9A441] font-medium">
                {currentLang === 'uz' 
                  ? "Shaxsiy profilingiz va xabarnomalarni boshqarish" 
                  : currentLang === 'ru' 
                  ? "Управление профилем и уведомлениями" 
                  : "Manage profile & notification preferences"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#FAF7F0]/10 text-[#FAF7F0] hover:bg-[#FAF7F0]/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-[#E4D9C4] bg-[#F0E8D8]/60 p-1.5 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'profile'
                ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-sm'
                : 'text-[#1F3D2B] hover:bg-[#FAF7F0]'
            }`}
          >
            <User className="w-4 h-4 text-[#D9A441]" />
            <span>{currentLang === 'uz' ? "Profil" : currentLang === 'ru' ? "Профиль" : "Profile"}</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'notifications'
                ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-sm'
                : 'text-[#1F3D2B] hover:bg-[#FAF7F0]'
            }`}
          >
            <Bell className="w-4 h-4 text-[#D9A441]" />
            <span>{currentLang === 'uz' ? "Xabarnomalar" : currentLang === 'ru' ? "Уведомления" : "Notifications"}</span>
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'language'
                ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-sm'
                : 'text-[#1F3D2B] hover:bg-[#FAF7F0]'
            }`}
          >
            <Globe className="w-4 h-4 text-[#D9A441]" />
            <span>{currentLang === 'uz' ? "Til" : currentLang === 'ru' ? "Язык" : "Language"}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {savedSuccess && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-bold">
                {currentLang === 'uz'
                  ? "Sozlamalaringiz muvaffaqiyatli saqlandi!"
                  : currentLang === 'ru'
                  ? "Настройки успешно сохранены!"
                  : "Settings saved successfully!"}
              </p>
            </div>
          )}

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#1F3D2B] mb-1.5 uppercase tracking-wider">
                  {currentLang === 'uz' ? "Ismingiz va Familiyangiz" : "ФИО / Имя"}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6C7C6F]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masalan: Anvar Jabborov"
                    className="w-full bg-white border border-[#E4D9C4] rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>
              </div>

              {/* Region & District Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1.5 uppercase tracking-wider">
                    {currentLang === 'uz' ? "Joylashgan Viloyatingiz" : "Регион"}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6C7C6F]" />
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-white border border-[#E4D9C4] rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] appearance-none"
                    >
                      {UZBEKISTAN_REGIONS.map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1.5 uppercase tracking-wider">
                    {currentLang === 'uz' ? "Tuman yoki Qishloq" : "Район / Сход граждан"}
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Masalan: Payariq tumani"
                    className="w-full bg-white border border-[#E4D9C4] rounded-2xl px-4 py-3 text-sm font-semibold text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-[#1F3D2B] mb-1.5 uppercase tracking-wider">
                  {currentLang === 'uz' ? "Telefon Raqamingiz" : "Номер телефона"}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#6C7C6F]" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full bg-white border border-[#E4D9C4] rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>
                <p className="text-[11px] text-[#6C7C6F] mt-1">
                  {currentLang === 'uz' 
                    ? "SMS ob-havo va xaridorlar qo'ng'iroqlari uchun ishlatiladi."
                    : "Используется для SMS-оповещений и связи с покупателями."}
                </p>
              </div>

              {/* Farm Type */}
              <div>
                <label className="block text-xs font-bold text-[#1F3D2B] mb-1.5 uppercase tracking-wider">
                  {currentLang === 'uz' ? "Xo'jalik Turi" : "Тип хозяйства"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFarmType('smallholder')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      farmType === 'smallholder'
                        ? 'border-[#1F3D2B] bg-[#1F3D2B] text-[#FAF7F0] font-bold shadow-md'
                        : 'border-[#E4D9C4] bg-white text-[#1F3D2B] hover:border-[#D9A441]'
                    }`}
                  >
                    <Sprout className="w-5 h-5 text-[#D9A441]" />
                    <div>
                      <p className="text-xs font-bold">Tomorqa / Dehqon</p>
                      <p className="text-[10px] opacity-80">1-5 gektar</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFarmType('commercial')}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      farmType === 'commercial'
                        ? 'border-[#1F3D2B] bg-[#1F3D2B] text-[#FAF7F0] font-bold shadow-md'
                        : 'border-[#E4D9C4] bg-white text-[#1F3D2B] hover:border-[#D9A441]'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 text-[#D9A441]" />
                    <div>
                      <p className="text-xs font-bold">Fermer Xo&apos;jaligi</p>
                      <p className="text-[10px] opacity-80">5+ gektar</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Primary Crops */}
              <div>
                <label className="block text-xs font-bold text-[#1F3D2B] mb-2 uppercase tracking-wider">
                  {currentLang === 'uz' ? "Asosiy Ekinlaringiz (Tanlang)" : "Основное выращивание"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_CROPS.map(crop => {
                    const isSelected = selectedCrops.includes(crop.id);
                    return (
                      <button
                        type="button"
                        key={crop.id}
                        onClick={() => toggleCrop(crop.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#D9A441] text-[#1F3D2B] border-[#D9A441] shadow-xs'
                            : 'bg-white text-[#1F3D2B] border-[#E4D9C4] hover:border-[#D9A441]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {crop.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Telegram Bot Quick Connect Box */}
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0088cc] text-white flex items-center justify-center shadow-xs shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <span>Telegram Agro Bot</span>
                      <span className="text-[10px] bg-sky-200 text-sky-900 px-1.5 py-0.5 rounded font-mono font-bold">@ekinix_bot</span>
                    </h4>
                    <p className="text-[11px] text-sky-800">
                      {currentLang === 'uz'
                        ? "Tezkor ogohlantirishlar va sun'iy yo'ldosh xabarlari"
                        : currentLang === 'ru'
                        ? "Мгновенные уведомления и спутниковые снимки"
                        : "Instant alerts & satellite NDVI updates"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {onOpenTelegramModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTelegramModal();
                      }}
                      className="flex-1 sm:flex-none px-3 py-2 bg-white hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      {currentLang === 'uz' ? "Botni sozlash" : currentLang === 'ru' ? "Настроить бота" : "Configure Bot"}
                    </button>
                  )}
                  <a
                    href="https://t.me/ekinix_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>{currentLang === 'uz' ? "Ochish" : currentLang === 'ru' ? "Открыть" : "Open"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F0E8D8] rounded-2xl border border-[#E4D9C4]">
                <p className="text-xs text-[#1F3D2B] font-medium leading-relaxed">
                  {currentLang === 'uz'
                    ? "Ob-havo kutilmagan sovuqlaridan ogoh bo'ling. Ekinix sizga eng muhim vaqtlarda eslatma yuboradi."
                    : "Будьте в курсе заморозков и поливов. Ekinix напомнит вам в самый нужный момент."}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                
                {/* Frost alert */}
                <label className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-[#E4D9C4] cursor-pointer hover:border-[#1F3D2B] transition-all">
                  <input
                    type="checkbox"
                    checked={notifs.frost_alerts}
                    onChange={(e) => setNotifs({ ...notifs, frost_alerts: e.target.checked })}
                    className="mt-1 w-4 h-4 text-[#1F3D2B] accent-[#1F3D2B] rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1F3D2B]">
                      ❄️ {currentLang === 'uz' ? "Ayoz va Sovuq urishi ogohlantirishlari" : "Заморозки и резкое похолодание"}
                    </p>
                    <p className="text-[11px] text-[#6C7C6F]">
                      {currentLang === 'uz'
                        ? "Harorat 0°C dan pastga tushishi kutilganda zudlik bilan xabar berish."
                        : "Экстренное оповещение при падении температуры ниже 0°C."}
                    </p>
                  </div>
                </label>

                {/* Irrigation reminder */}
                <label className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-[#E4D9C4] cursor-pointer hover:border-[#1F3D2B] transition-all">
                  <input
                    type="checkbox"
                    checked={notifs.irrigation_reminders}
                    onChange={(e) => setNotifs({ ...notifs, irrigation_reminders: e.target.checked })}
                    className="mt-1 w-4 h-4 text-[#1F3D2B] accent-[#1F3D2B] rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1F3D2B]">
                      💧 {currentLang === 'uz' ? "Sug'orish va O'g'itlash vaqti eslatmasi" : "График полива и внесения удобрений"}
                    </p>
                    <p className="text-[11px] text-[#6C7C6F]">
                      {currentLang === 'uz'
                        ? "Tuproq namligi kamayganda ekinlarni sug'orishni eslatib turish."
                        : "Напоминание о поливе при снижении влажности почвы."}
                    </p>
                  </div>
                </label>

                {/* Marketplace alerts */}
                <label className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-[#E4D9C4] cursor-pointer hover:border-[#1F3D2B] transition-all">
                  <input
                    type="checkbox"
                    checked={notifs.marketplace_inquiries}
                    onChange={(e) => setNotifs({ ...notifs, marketplace_inquiries: e.target.checked })}
                    className="mt-1 w-4 h-4 text-[#1F3D2B] accent-[#1F3D2B] rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1F3D2B]">
                      🛒 {currentLang === 'uz' ? "Bozor va Xaridor so'rovlari" : "Запросы покупателей на базаре"}
                    </p>
                    <p className="text-[11px] text-[#6C7C6F]">
                      {currentLang === 'uz'
                        ? "E'lon qilgan mahsulotingiz bo'yicha xaridorlar qiziqsa xabar qilish."
                        : "Уведомление при проявлении интереса покупателей к урожаю."}
                    </p>
                  </div>
                </label>

                {/* Satellite updates */}
                <label className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-[#E4D9C4] cursor-pointer hover:border-[#1F3D2B] transition-all">
                  <input
                    type="checkbox"
                    checked={notifs.satellite_ndvi_updates}
                    onChange={(e) => setNotifs({ ...notifs, satellite_ndvi_updates: e.target.checked })}
                    className="mt-1 w-4 h-4 text-[#1F3D2B] accent-[#1F3D2B] rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1F3D2B]">
                      🛰️ {currentLang === 'uz' ? "Sun'iy yo'ldosh NDVI xaritasi yangilanishi" : "Обновление снимков Sentinel-2"}
                    </p>
                    <p className="text-[11px] text-[#6C7C6F]">
                      {currentLang === 'uz'
                        ? "Har hafta ekinlaringizning sun'iy yo'ldosh rasmi yangilanganda tahlilni yuborish."
                        : "Еженедельный отчет по индексу вегетации (NDVI)."}
                    </p>
                  </div>
                </label>

              </div>

              {/* Notification Channel */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-[#1F3D2B] mb-2 uppercase tracking-wider">
                  {currentLang === 'uz' ? "Xabarnoma yuborish kanali" : "Канал уведомлений"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sms', label: '📱 SMS', sub: 'Tezkor' },
                    { id: 'telegram', label: '💬 Telegram', sub: 'Bot xabari' },
                    { id: 'app', label: '🔔 Ilova', sub: 'Bildirishnoma' }
                  ].map(ch => (
                    <button
                      type="button"
                      key={ch.id}
                      onClick={() => setNotifs({ ...notifs, channel: ch.id as any })}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        notifs.channel === ch.id
                          ? 'bg-[#1F3D2B] text-[#FAF7F0] border-[#1F3D2B] font-bold shadow-sm'
                          : 'bg-white text-[#1F3D2B] border-[#E4D9C4] hover:border-[#D9A441]'
                      }`}
                    >
                      <p className="text-xs font-bold">{ch.label}</p>
                      <p className="text-[10px] opacity-75">{ch.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Telegram Bot Details Card */}
              <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#E4D9C4] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0088cc] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1F3D2B]">Ekinix Telegram Bot (@ekinix_bot)</h4>
                      <p className="text-[11px] text-[#6C7C6F]">
                        {currentLang === 'uz' ? "Kodi: EKX-9824 • Sun'iy yo'ldosh & Sovuq xabarlari" : "Код: EKX-9824 • Снимки и заморозки"}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    {currentLang === 'uz' ? "Tayyor" : "Готов"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <a
                    href="https://t.me/ekinix_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 py-2 px-3 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{currentLang === 'uz' ? "Telegram botda ochish" : "Открыть в Telegram"}</span>
                  </a>

                  {onOpenTelegramModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTelegramModal();
                      }}
                      className="w-full sm:w-auto py-2 px-3.5 bg-white hover:bg-slate-100 text-[#1F3D2B] border border-[#E4D9C4] rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      {currentLang === 'uz' ? "Batafsil sozlamalar" : "Подробные настройки"}
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: LANGUAGE */}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <p className="text-xs text-[#6C7C6F] font-medium">
                {currentLang === 'uz' 
                  ? "Platformadan foydalanish uchun o'zingizga qulay tilni tanlang:"
                  : currentLang === 'ru'
                  ? "Выберите удобный язык приложения:"
                  : "Choose your preferred interface language:"}
              </p>

              <div className="space-y-3">
                {[
                  { code: 'uz', name: "O'zbekcha (Lotin)", flag: "🇺🇿", desc: "O'zbekiston dehqonlari uchun asosiy til" },
                  { code: 'ru', name: "Русский", flag: "🇷🇺", desc: "Для русскоязычных фермеров" },
                  { code: 'en', name: "English", flag: "🇬🇧", desc: "International overview" }
                ].map(langItem => (
                  <button
                    type="button"
                    key={langItem.code}
                    onClick={() => onLanguageChange(langItem.code as Language)}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all ${
                      currentLang === langItem.code
                        ? 'border-[#1F3D2B] bg-[#1F3D2B] text-[#FAF7F0] shadow-md'
                        : 'border-[#E4D9C4] bg-white text-[#1F3D2B] hover:border-[#D9A441]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{langItem.flag}</span>
                      <div>
                        <p className="text-sm font-bold">{langItem.name}</p>
                        <p className={`text-xs ${currentLang === langItem.code ? 'text-[#D9A441]' : 'text-[#6C7C6F]'}`}>
                          {langItem.desc}
                        </p>
                      </div>
                    </div>
                    {currentLang === langItem.code && (
                      <span className="bg-[#D9A441] text-[#1F3D2B] font-bold text-xs px-2.5 py-1 rounded-full">
                        Aktiv
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#E4D9C4] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              {currentLang === 'uz' ? "Bekor qilish" : "Отмена"}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={saving}
              isLoading={saving}
              leftIcon={<Save className="w-4 h-4 text-[#D9A441]" />}
            >
              {saving 
                ? "Saqlanmoqda..." 
                : currentLang === 'uz' ? "Sozlamalarni Saqlash" : "Сохранить настройки"}
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};
