'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { NavTabId } from './Sidebar';
import { FarmerProfile } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
  Menu,
  Sprout,
  LogIn,
  LayoutDashboard,
  MapPin,
  Sun,
  ShoppingBag,
  BookOpen,
  LogOut,
  Activity,
  Crown,
  Building2,
  Send,
} from 'lucide-react';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  isLoggedIn?: boolean;
  activeTab?: NavTabId;
  onToggleSidebar?: () => void;
  userProfile?: FarmerProfile | null;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onOpenDbModal?: () => void;
  onOpenSettings?: () => void;
  onOpenTelegram?: () => void;
  onLogout?: () => void;
}

const TAB_ICONS: Record<NavTabId, React.ElementType> = {
  dashboard: LayoutDashboard,
  fields: MapPin,
  agronomist: Activity,
  plans: Crown,
  subsidies: Building2,
  weather: Sun,
  marketplace: ShoppingBag,
  guides: BookOpen,
};

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  isLoggedIn = false,
  activeTab = 'dashboard',
  onToggleSidebar,
  userProfile,
  onOpenAuth,
  onOpenDbModal,
  onOpenSettings,
  onOpenTelegram,
  onLogout,
}) => {
  const t = translations[currentLang];

  const getTabTitle = (tab: NavTabId) => {
    switch (tab) {
      case 'dashboard':
        return currentLang === 'ru' ? 'Панель управления' : currentLang === 'en' ? 'Farmer Dashboard' : 'Boshqaruv Paneli';
      case 'fields':
        return currentLang === 'ru' ? 'Мои поля' : currentLang === 'en' ? 'My Fields Map' : 'Mening Maydonlarim';
      case 'agronomist':
        return currentLang === 'ru' ? 'Агроном-триаж (Taranis)' : currentLang === 'en' ? 'Agronomist Triage Console' : 'Agronom Triaji & Nazorat';
      case 'plans':
        return currentLang === 'ru' ? 'Тарифные планы' : currentLang === 'en' ? 'Service Plans & Pricing' : 'Xizmat Rejalari';
      case 'subsidies':
        return currentLang === 'ru' ? 'Государственные субсидии' : currentLang === 'en' ? 'Government Subsidies & Programs' : 'Davlat Subsidiyalari & Dasturlar';
      case 'weather':
        return currentLang === 'ru' ? 'Погода и полив' : currentLang === 'en' ? 'Weather & Irrigation' : "Ob-havo & Sug'orish";
      case 'marketplace':
        return currentLang === 'ru' ? 'Рынок урожая' : currentLang === 'en' ? 'Crop Marketplace' : 'Hosil Bozori';
      case 'guides':
        return currentLang === 'ru' ? 'Агро-справочник' : currentLang === 'en' ? 'Crop Guides' : "Agro Qo'llanma";
    }
  };

  const ActiveIcon = TAB_ICONS[activeTab] || LayoutDashboard;

  // ==========================================
  // 1. PUBLIC MARKETING LANDING HEADER (LOGGED OUT)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <header className="sticky top-0 z-30 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E4D9C4] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1F3D2B] flex items-center justify-center text-[#D9A441] shadow-xs">
              <Sprout className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#1F3D2B]">Ekinix</span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#D9A441] text-[#1F3D2B]">
                  AGRO
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Language Switcher & Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-[#E4D9C4] shadow-xs text-xs font-bold">
              {(['uz', 'ru', 'en'] as Language[]).map((lang) => {
                const isActive = currentLang === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => onLanguageChange(lang)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
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

            {/* Auth CTA Buttons */}
            {onOpenAuth && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onOpenAuth('login')}
                  id="header-login-btn"
                  variant="secondary"
                  size="sm"
                  leftIcon={<LogIn className="w-3.5 h-3.5 text-[#1F3D2B]" />}
                >
                  {t.login}
                </Button>
                <Button
                  onClick={() => onOpenAuth('register')}
                  id="header-register-btn"
                  variant="primary"
                  size="sm"
                  className="hidden sm:inline-flex"
                  leftIcon={<Sprout className="w-3.5 h-3.5 text-[#D9A441]" />}
                >
                  {t.register}
                </Button>
              </div>
            )}
          </div>

        </div>
      </header>
    );
  }

  // ==========================================
  // 2. AUTHENTICATED IN-APP HEADER (LOGGED IN)
  // ==========================================
  return (
    <header className="sticky top-0 z-20 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E4D9C4] px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        
        {/* Left: Mobile Drawer Toggle + Active Breadcrumb Pill */}
        <div className="flex items-center gap-3 min-w-0">
          
          {/* Mobile Hamburger Toggle (<lg screens) */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              id="sidebar-toggle-btn"
              className="lg:hidden p-2 rounded-xl bg-white hover:bg-[#1F3D2B]/10 active:scale-95 text-[#1F3D2B] border border-[#E4D9C4] shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]/20 cursor-pointer"
              aria-label="Menyuni ochish"
              title="Menyu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          {/* Active Section Indicator Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E4D9C4] shadow-xs">
            <ActiveIcon className="w-4 h-4 text-[#D9A441]" />
            <span className="font-bold text-xs sm:text-sm text-[#1F3D2B] truncate">
              {getTabTitle(activeTab)}
            </span>
          </div>

        </div>

        {/* Right Controls: Language Switcher + User Profile Menu + Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          
          {/* Language Switcher Bar */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#E4D9C4] shadow-xs text-xs font-bold">
            {(['uz', 'ru', 'en'] as Language[]).map((lang) => {
              const isActive = currentLang === lang;
              return (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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

          {/* Telegram Bot Hub Button */}
          {onOpenTelegram && (
            <button
              onClick={onOpenTelegram}
              id="header-telegram-btn"
              title="Telegram Agro Bot (@ekinixbot)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/30 transition-all shadow-xs cursor-pointer text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Telegram Bot</span>
            </button>
          )}

          {/* Farmer Profile Button */}
          {userProfile && (
            <button
              onClick={onOpenSettings}
              id="user-profile-header-btn"
              title="Profil va sozlamalar"
              className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#1F3D2B] hover:bg-[#162E20] text-[#FAF7F0] transition-all shadow-xs cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#D9A441] text-[#1F3D2B] font-bold text-xs flex items-center justify-center">
                {userProfile.full_name?.charAt(0) || 'D'}
              </div>
              <span className="hidden sm:inline font-bold text-xs truncate max-w-[130px]">
                {userProfile.full_name}
              </span>
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <Button
              onClick={onLogout}
              id="header-logout-btn"
              variant="destructive"
              size="icon-sm"
              title={currentLang === 'ru' ? 'Выйти' : currentLang === 'en' ? 'Log out' : 'Chiqish'}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}

        </div>

      </div>
    </header>
  );
};
