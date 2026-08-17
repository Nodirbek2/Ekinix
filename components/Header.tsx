'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { NavTabId } from './Sidebar';
import { FarmerProfile, isSupabaseConfigured } from '@/lib/supabase';
import {
  Menu,
  Sprout,
  ChevronRight,
  Database,
  User,
  LogIn,
  Home,
  LayoutDashboard,
  MapPin,
  Sun,
  ShoppingBag,
  BookOpen
} from 'lucide-react';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: NavTabId;
  onToggleSidebar: () => void;
  userProfile?: FarmerProfile | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDbModal: () => void;
  onOpenSettings?: () => void;
}

const TAB_ICONS: Record<NavTabId, React.ElementType> = {
  overview: Home,
  dashboard: LayoutDashboard,
  fields: MapPin,
  weather: Sun,
  marketplace: ShoppingBag,
  guides: BookOpen,
};

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  activeTab,
  onToggleSidebar,
  userProfile,
  onOpenAuth,
  onOpenDbModal,
  onOpenSettings,
}) => {
  const t = translations[currentLang];

  const getTabTitle = (tab: NavTabId) => {
    switch (tab) {
      case 'overview':
        return currentLang === 'ru' ? 'Главная / Обзор' : currentLang === 'en' ? 'Platform Overview' : 'Bosh sahifa';
      case 'dashboard':
        return currentLang === 'ru' ? 'Панель фермера' : currentLang === 'en' ? 'Farmer Dashboard' : 'Fermer Paneli';
      case 'fields':
        return currentLang === 'ru' ? 'Мои поля' : currentLang === 'en' ? 'My Fields Map' : 'Mening Maydonlarim';
      case 'weather':
        return currentLang === 'ru' ? 'Погода и полив' : currentLang === 'en' ? 'Weather & Irrigation' : "Ob-havo & Sug'orish";
      case 'marketplace':
        return currentLang === 'ru' ? 'Рынок урожая' : currentLang === 'en' ? 'Crop Marketplace' : 'Hosil Bozori';
      case 'guides':
        return currentLang === 'ru' ? 'Агро-справочник' : currentLang === 'en' ? 'Crop Guides' : "Agro Qo'llanma";
    }
  };

  const ActiveIcon = TAB_ICONS[activeTab] || Home;

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E4D9C4] px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Hamburger button + Brand Logo + Active breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          
          {/* Top-Left Rounded Hamburger Button with Hover Ring */}
          <button
            onClick={onToggleSidebar}
            id="sidebar-toggle-btn"
            className="p-2 sm:p-2.5 rounded-full bg-white hover:bg-[#1F3D2B]/10 active:scale-95 text-[#1F3D2B] border border-[#E4D9C4] shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]/20"
            aria-label="Toggle navigation sidebar"
            title="Menyu (Sidebar)"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Brand Logo & Name */}
          <button
            onClick={onToggleSidebar}
            className="flex items-center gap-2.5 text-left focus:outline-none group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1F3D2B] flex items-center justify-center text-[#D9A441] shadow-xs group-hover:bg-[#14281C] transition-colors">
              <Sprout className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="hidden xs:block">
              <div className="flex items-center gap-1">
                <span className="font-serif text-xl font-bold tracking-tight text-[#1F3D2B]">Ekinix</span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#D9A441] text-[#1F3D2B]">
                  AGRO
                </span>
              </div>
            </div>
          </button>

          {/* Divider & Active View Title Pill */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#E4D9C4]">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E4D9C4] shadow-xs">
              <ActiveIcon className="w-4 h-4 text-[#1F3D2B]" />
              <span className="font-bold text-xs sm:text-sm text-[#1F3D2B] truncate max-w-[200px]">
                {getTabTitle(activeTab)}
              </span>
            </div>
          </div>

        </div>

        {/* Right Controls: Language Switcher, Supabase Status, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Language Switcher Bar */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#E4D9C4] shadow-xs text-xs font-bold">
            {(['uz', 'ru', 'en'] as Language[]).map((lang) => {
              const isActive = currentLang === lang;
              return (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                      : 'text-[#6C7C6F] hover:text-[#1F3D2B] hover:bg-[#F0E8D8]'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* User Profile / Login Button */}
          {userProfile ? (
            <button
              onClick={onOpenSettings}
              id="user-profile-header-btn"
              className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] transition-all shadow-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-[#D9A441] text-[#1F3D2B] font-bold text-xs flex items-center justify-center">
                {userProfile.full_name?.charAt(0) || 'D'}
              </div>
              <span className="hidden sm:inline font-bold text-xs truncate max-w-[130px]">
                {userProfile.full_name}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('login')}
                id="header-login-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F0E8D8] text-[#1F3D2B] text-xs font-bold border border-[#E4D9C4] shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-[#1F3D2B]" />
                <span className="hidden xs:inline">{t.login}</span>
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                id="header-register-btn"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] text-xs font-bold transition-all shadow-xs"
              >
                <Sprout className="w-3.5 h-3.5 text-[#D9A441]" />
                <span>{t.register}</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
