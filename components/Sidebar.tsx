'use client';

import React, { useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FarmerProfile, isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
  Sprout,
  LayoutDashboard,
  MapPin,
  Sun,
  ShoppingBag,
  BookOpen,
  LogIn,
  Database,
  Settings,
  LogOut,
  X,
  ChevronRight,
  UserCheck,
  Activity,
  CreditCard,
  Building2,
  Crown,
  Users,
  Send,
} from 'lucide-react';

export type NavTabId = 'dashboard' | 'fields' | 'agronomist' | 'plans' | 'subsidies' | 'weather' | 'marketplace' | 'guides';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  userProfile?: FarmerProfile | null;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onOpenDbModal: () => void;
  onOpenSettings?: () => void;
  onOpenOnboarding?: () => void;
  onOpenTelegram?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentLang,
  onLanguageChange,
  activeTab,
  onTabChange,
  userProfile,
  onOpenAuth,
  onOpenDbModal,
  onOpenSettings,
  onOpenOnboarding,
  onOpenTelegram,
  onLogout,
}) => {
  const t = translations[currentLang];

  // Close on Escape key on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems: {
    id: NavTabId;
    labelUz: string;
    labelRu: string;
    labelEn: string;
    descUz: string;
    descRu: string;
    descEn: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      labelUz: 'Boshqaruv Paneli',
      labelRu: 'Панель управления',
      labelEn: 'Farmer Dashboard',
      descUz: 'NDVI & jonli telemetriya',
      descRu: 'NDVI и телеметрия',
      descEn: 'NDVI & live telemetry',
      icon: LayoutDashboard,
      badge: 'Jonli',
    },
    {
      id: 'fields',
      labelUz: 'Mening Maydonlarim',
      labelRu: 'Мои поля',
      labelEn: 'My Fields',
      descUz: 'Xaritalar & ro‘yxatga olish',
      descRu: 'Карты и регистрация',
      descEn: 'Map boundaries & fields',
      icon: MapPin,
    },
    {
      id: 'agronomist',
      labelUz: 'Agronom Triaji',
      labelRu: 'Агроном-триаж',
      labelEn: 'Agronomist Triage',
      descUz: 'Shoshilinch dalalar & xulosalar',
      descRu: 'Консолидация и предписания',
      descEn: 'Taranis-style urgent triage',
      icon: Activity,
      badge: 'Taranis',
    },
    {
      id: 'plans',
      labelUz: 'Xizmat Rejalari',
      labelRu: 'Тарифные планы',
      labelEn: 'Service Plans',
      descUz: 'Asosiy, Standart, Professional',
      descRu: 'Тарифы и возможности',
      descEn: 'Tiered subscription pricing',
      icon: Crown,
    },
    {
      id: 'subsidies',
      labelUz: 'Davlat Subsidiyalari',
      labelRu: 'Госсубсидии',
      labelEn: 'Gov Subsidies',
      descUz: 'Tomchilatib sug‘orish & lazer',
      descRu: 'Программы поддержки агро',
      descEn: 'Subsidy match & eligibility',
      icon: Building2,
      badge: 'Yangi',
    },
    {
      id: 'weather',
      labelUz: "Ob-havo & Sug'orish",
      labelRu: 'Погода и полив',
      labelEn: 'Weather & Irrigation',
      descUz: '7 kunlik prognoz & kalkulyator',
      descRu: 'Прогноз и расчёт полива',
      descEn: '7-day forecast & model',
      icon: Sun,
    },
    {
      id: 'marketplace',
      labelUz: 'Hosil Bozori',
      labelRu: 'Рынок урожая',
      labelEn: 'Crop Marketplace',
      descUz: 'Dehqonlar savdo maydoni',
      descRu: 'Площадка для фермеров',
      descEn: 'Direct peer marketplace',
      icon: ShoppingBag,
      badge: 'Bozor',
    },
    {
      id: 'guides',
      labelUz: "Agro Qo'llanma",
      labelRu: 'Агро-справочник',
      labelEn: 'Crop Guides',
      descUz: 'Parvarish, sug‘orish, kasalliklar',
      descRu: 'Уход, полив и защита',
      descEn: 'Growth stages & agronomy',
      icon: BookOpen,
    },
  ];

  const getLabel = (item: (typeof navItems)[0]) => {
    if (currentLang === 'ru') return item.labelRu;
    if (currentLang === 'en') return item.labelEn;
    return item.labelUz;
  };

  const getDesc = (item: (typeof navItems)[0]) => {
    if (currentLang === 'ru') return item.descRu;
    if (currentLang === 'en') return item.descEn;
    return item.descUz;
  };

  const handleSelectTab = (tab: NavTabId) => {
    onTabChange(tab);
    onClose();
  };

  // Reusable Sidebar Internal Content
  const renderSidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-[#1F3D2B] text-[#FAF7F0] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#FAF7F0]/10 flex items-center justify-between bg-[#1A3324]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] flex items-center justify-center text-[#1F3D2B] shadow-md">
            <Sprout className="w-6 h-6 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#FAF7F0]">Ekinix</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#D9A441] text-[#1F3D2B]">
                AGRO
              </span>
            </div>
            <p className="text-[11px] text-[#FAF7F0]/70 font-medium">
              {currentLang === 'ru'
                ? 'Агро-платформа Узбекистана'
                : currentLang === 'en'
                ? 'Smart Agriculture Platform'
                : "Aqlli Dehqonchilik Tizimi"}
            </p>
          </div>
        </div>

        {/* Mobile Close Button (✕) */}
        {isMobile && (
          <button
            onClick={onClose}
            id="close-sidebar-btn"
            className="p-2 text-[#FAF7F0]/80 hover:text-white hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Yopish"
            title="Yopish (Esc)"
          >
            <X className="w-5 h-5 stroke-[2.4]" />
          </button>
        )}
      </div>

      {/* Language Switcher Bar inside drawer */}
      <div className="px-5 py-3 border-b border-[#FAF7F0]/10 bg-[#14281C]">
        <div className="flex items-center justify-between gap-1 bg-[#1F3D2B] p-1 rounded-xl border border-white/10">
          {(['uz', 'ru', 'en'] as Language[]).map((lang) => {
            const isActive = currentLang === lang;
            return (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  isActive
                    ? 'bg-[#D9A441] text-[#1F3D2B] shadow-sm'
                    : 'text-[#FAF7F0]/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{lang === 'uz' ? '🇺🇿 UZ' : lang === 'ru' ? '🇷🇺 RU' : '🇬🇧 EN'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Items List */}
      <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-bold text-[#FAF7F0]/50 uppercase tracking-widest">
          {currentLang === 'ru' ? 'РАЗДЕЛЫ СИСТЕМЫ' : currentLang === 'en' ? 'APPLICATION MODULES' : 'TIZIM BO\'LIMLARI'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm transition-all duration-200 group text-left cursor-pointer ${
                isActive
                  ? 'bg-[#D9A441] text-[#1F3D2B] font-bold shadow-md shadow-[#D9A441]/15 ring-1 ring-[#D9A441]'
                  : 'text-[#FAF7F0]/85 hover:bg-white/10 hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#1F3D2B] text-[#D9A441]'
                      : 'bg-white/10 text-[#D9A441] group-hover:bg-white/15 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-sm leading-tight">{getLabel(item)}</p>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-[#1F3D2B]/80 font-medium' : 'text-[#FAF7F0]/60'
                    }`}
                  >
                    {getDesc(item)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#1F3D2B] text-[#FAF7F0]'
                        : 'bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-[#1F3D2B] stroke-[2.5]" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Panel: Farmer Profile & Settings */}
      <div className="p-4 border-t border-[#FAF7F0]/10 bg-[#14281C] space-y-2.5">
        {userProfile ? (
          <div className="bg-[#1F3D2B] rounded-2xl p-3 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#D9A441] flex items-center justify-center text-[#1F3D2B] font-bold text-xs shrink-0">
                  {userProfile.full_name?.charAt(0) || 'D'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#FAF7F0] truncate">
                    {userProfile.full_name}
                  </p>
                  <p className="text-[10px] text-[#FAF7F0]/70 truncate flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-[#D9A441]" />
                    {userProfile.region || 'Toshkent viloyati'}
                  </p>
                </div>
              </div>

              {onOpenSettings && (
                <button
                  onClick={() => {
                    onOpenSettings();
                    if (isMobile) onClose();
                  }}
                  title="Sozlamalar"
                  className="p-1.5 text-[#FAF7F0]/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1.5 border-t border-white/10">
              {onOpenOnboarding && (
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    if (isMobile) onClose();
                  }}
                  className="flex-1 text-[11px] font-semibold py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-lg text-center transition-colors truncate cursor-pointer text-[#FAF7F0]"
                >
                  {currentLang === 'ru' ? 'Моя ферма' : currentLang === 'en' ? 'Farm Profile' : "Xo'jalik profili"}
                </button>
              )}
              {onLogout && (
                <button
                  onClick={() => {
                    onLogout();
                    if (isMobile) onClose();
                  }}
                  title="Chiqish"
                  className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Logged-out Buttons */
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                if (onOpenAuth) onOpenAuth('login');
                if (isMobile) onClose();
              }}
              variant="secondary"
              size="sm"
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
            >
              {t.login}
            </Button>
            <Button
              onClick={() => {
                if (onOpenAuth) onOpenAuth('register');
                if (isMobile) onClose();
              }}
              variant="accent"
              size="sm"
              leftIcon={<Sprout className="w-3.5 h-3.5" />}
            >
              {t.register}
            </Button>
          </div>
        )}

        {/* Telegram Bot Notification Hub Trigger */}
        {onOpenTelegram && (
          <button
            onClick={() => {
              onOpenTelegram();
              if (isMobile) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#0088cc]/15 hover:bg-[#0088cc]/25 rounded-xl text-[11px] font-semibold text-[#FAF7F0] transition-colors border border-[#0088cc]/30 cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#0088cc] text-white flex items-center justify-center">
                <Send className="w-3 h-3 -translate-x-0.2" />
              </div>
              <span className="group-hover:text-white">Telegram Agro Bot</span>
            </div>
            <span className="text-[9px] bg-[#0088cc] text-white font-bold px-1.5 py-0.5 rounded shadow-xs">
              @EkinixAgroBot
            </span>
          </button>
        )}

        {/* Database Setup Button */}
        <button
          onClick={() => {
            onOpenDbModal();
            if (isMobile) onClose();
          }}
          className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-semibold text-[#FAF7F0]/80 transition-colors border border-white/5 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Supabase Cloud DB</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {isSupabaseConfigured ? 'Ulangan' : 'SQL Tayyor'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP FIXED SIDEBAR (ALWAYS VISIBLE ON lg: SCREENS) */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-72 border-r border-[#14281C] z-30 shadow-xl">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. MOBILE SLIDE-OUT DRAWER (FOR <lg SCREENS) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-Out Drawer Panel */}
          <div
            className="relative w-80 max-w-[88vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-250 border-r border-[#14281C]"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
