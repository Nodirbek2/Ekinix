'use client';

import React, { useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FarmerProfile } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
  Sprout,
  LayoutDashboard,
  MapPin,
  Sun,
  ShoppingBag,
  BookOpen,
  LogIn,
  Settings,
  LogOut,
  X,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Activity,
  CreditCard,
  Building2,
  Crown,
  Users,
  MessageSquare,
} from 'lucide-react';

export type NavTabId = 'dashboard' | 'fields' | 'agronomist' | 'plans' | 'subsidies' | 'weather' | 'marketplace' | 'guides' | 'chat';

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
      id: 'chat',
      labelUz: 'Xabarlar & Chat',
      labelRu: 'Сообщения и чат',
      labelEn: 'Messages & Chat',
      descUz: 'Savdo & agronom maslahatlari',
      descRu: 'Чат по сделкам и агрономия',
      descEn: 'B2B deals & agronomist chat',
      icon: MessageSquare,
      badge: 'Jonli',
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
    <div className="flex flex-col h-full bg-white text-slate-900 select-none">
      
      {/* Top Brand & Workspace Switcher Header */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#164E35] flex items-center justify-center text-white shadow-xs">
              <Sprout className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">Ekinix AGRO</span>
          </div>

          {/* Mobile Close Button (✕) */}
          {isMobile && (
            <button
              onClick={onClose}
              id="close-sidebar-btn"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Yopish"
              title="Yopish (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Workspace / Farm Switcher Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 transition-colors hover:bg-slate-100/80 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {userProfile?.full_name ? `${userProfile.full_name} Dalasi` : "Ekinix Asosiy Xo'jaligi"}
              </p>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>{userProfile?.region || 'Toshkent viloyati'}</span>
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* Language Switcher Bar inside drawer */}
      <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between gap-1 bg-slate-100 p-0.5 rounded-md text-[11px] font-semibold text-slate-600">
          {(['uz', 'ru', 'en'] as Language[]).map((lang) => {
            const isActive = currentLang === lang;
            return (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`flex-1 py-1 text-[11px] font-semibold rounded transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{lang.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Items List */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {currentLang === 'ru' ? 'РАЗДЕЛЫ СИСТЕМЫ' : currentLang === 'en' ? 'APPLICATION MODULES' : 'TIZIM BO\'LIMLARI'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full h-9 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-between group text-left cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-900 font-semibold border-r-2 border-emerald-700 rounded-r-none'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-800' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{getLabel(item)}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Panel: Farmer Profile & Settings */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
        {userProfile ? (
          <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-medium text-xs flex items-center justify-center shrink-0">
                  {userProfile.full_name?.charAt(0) || 'D'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs text-slate-900 truncate">
                    {userProfile.full_name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {userProfile.region || 'Toshkent'}
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
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              {onOpenOnboarding && (
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    if (isMobile) onClose();
                  }}
                  className="flex-1 text-[11px] font-medium py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-center transition-colors truncate cursor-pointer"
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
                  className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors shrink-0 cursor-pointer"
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
              className="h-8 text-xs"
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
            >
              {t.login}
            </Button>
            <Button
              onClick={() => {
                if (onOpenAuth) onOpenAuth('register');
                if (isMobile) onClose();
              }}
              variant="primary"
              size="sm"
              className="h-8 text-xs"
              leftIcon={<Sprout className="w-3.5 h-3.5" />}
            >
              {t.register}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP FIXED SIDEBAR (ALWAYS VISIBLE ON lg: SCREENS - FIXED 256px w-64) */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-slate-200 z-40 bg-white">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. MOBILE SLIDE-OUT DRAWER (FOR <lg SCREENS) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 z-0"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-Out Drawer Panel */}
          <div
            className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 bg-white border-r border-slate-200"
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
