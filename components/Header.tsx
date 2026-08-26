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
  MessageSquare,
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
  chat: MessageSquare,
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
      case 'chat':
        return currentLang === 'ru' ? 'Сообщения и чат' : currentLang === 'en' ? 'Messages & Chat' : 'Xabarlar & Chat';
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
      <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center transition-all">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#164E35] flex items-center justify-center text-white shadow-xs">
              <Sprout className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-900">Ekinix</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                AGRO
              </span>
            </div>
          </div>

          {/* Right Controls: Language Switcher & Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center h-7 bg-slate-100 p-0.5 rounded-md text-[11px] font-semibold text-slate-600">
              {(['uz', 'ru', 'en'] as Language[]).map((lang) => {
                const isActive = currentLang === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => onLanguageChange(lang)}
                    className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
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
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  leftIcon={<LogIn className="w-3.5 h-3.5 text-slate-600" />}
                >
                  {t.login}
                </Button>
                <Button
                  onClick={() => onOpenAuth('register')}
                  id="header-register-btn"
                  variant="primary"
                  size="sm"
                  className="h-8 hidden sm:inline-flex"
                  leftIcon={<Sprout className="w-3.5 h-3.5 text-white" />}
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
    <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center transition-all">
      <div className="w-full flex items-center justify-between gap-3">
        
        {/* Left: Mobile Drawer Toggle + Compact Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          
          {/* Mobile Hamburger Toggle (<lg screens) */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              id="sidebar-toggle-btn"
              className="lg:hidden p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
              aria-label="Menyuni ochish"
              title="Menyu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Compact Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <ActiveIcon className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="text-xs font-semibold text-slate-800 truncate">
              {getTabTitle(activeTab)}
            </span>
          </div>

        </div>

        {/* Right Controls: Language Switcher + User Profile Menu + Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Language Selector */}
          <div className="flex items-center h-7 bg-slate-100 p-0.5 rounded-md text-[11px] font-semibold text-slate-600">
            {(['uz', 'ru', 'en'] as Language[]).map((lang) => {
              const isActive = currentLang === lang;
              return (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
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
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-all cursor-pointer text-[11px] font-semibold"
            >
              <Send className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden md:inline">Telegram Bot</span>
            </button>
          )}

          {/* Farmer Profile Button */}
          {userProfile && (
            <button
              onClick={onOpenSettings}
              id="user-profile-header-btn"
              title="Profil va sozlamalar"
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-slate-800"
            >
              <div className="w-7 h-7 bg-slate-800 text-white text-xs font-medium rounded-full flex items-center justify-center shrink-0">
                {userProfile.full_name?.charAt(0) || 'D'}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-slate-800 truncate max-w-[120px]">
                {userProfile.full_name}
              </span>
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <Button
              onClick={onLogout}
              id="header-logout-btn"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 text-slate-500 hover:text-slate-800"
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

