'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { Sprout, Globe, User, UserPlus, Database, Menu, X, ChevronDown, LogOut, Settings } from 'lucide-react';
import { FarmerProfile, isSupabaseConfigured } from '@/lib/supabase';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDbModal: () => void;
  activeNavSection: string;
  setActiveNavSection: (section: string) => void;
  userProfile?: FarmerProfile | null;
  onOpenOnboarding?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  onOpenAuth,
  onOpenDbModal,
  activeNavSection,
  setActiveNavSection,
  userProfile,
  onOpenOnboarding,
  onOpenSettings,
  onLogout,
}) => {
  const t = translations[currentLang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'home', label: t.home },
    { id: 'dashboard', label: t.dashboardNavTab },
    { id: 'fields', label: t.fields },
    { id: 'weather', label: t.weatherIrrigation },
    { id: 'market', label: t.marketplace },
    { id: 'guides', label: t.guides },
  ];

  const handleNavClick = (id: string) => {
    setActiveNavSection(id);
    setMobileMenuOpen(false);

    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'dashboard') {
      const el = document.getElementById('farmer-dashboard');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      const targetId = id === 'fields' ? 'my-fields' : `section-${id}`;
      const el = document.getElementById(targetId) || document.getElementById('section-[#interactive-demo]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const languageNames: Record<Language, { label: string; flag: string }> = {
    uz: { label: "O'zbekcha (UZ)", flag: "🇺🇿" },
    ru: { label: "Русский (RU)", flag: "🇷🇺" },
    en: { label: "English (EN)", flag: "🇬🇧" },
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E4D9C4] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <button 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 group text-left focus:outline-none"
        >
          <div className="w-11 h-11 rounded-xl bg-[#1F3D2B] flex items-center justify-center text-[#D9A441] shadow-md group-hover:bg-[#14281C] transition-colors">
            <Sprout className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#1F3D2B]">Ekinix</span>
              <span className="bg-[#D9A441]/20 text-[#B8852B] text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#D9A441]/30">
                Uzbekistan
              </span>
            </div>
            <p className="text-xs text-[#6C7C6F] font-medium hidden sm:block">
              Aqlli Agro Platforma
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 bg-[#F0E8D8]/60 p-1.5 rounded-full border border-[#E4D9C4]">
          {navItems.map((item) => {
            const isActive = activeNavSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-sm'
                    : 'text-[#2D3A2F] hover:text-[#1F3D2B] hover:bg-[#FAF7F0]/80'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Bar: Language Switcher, Supabase Status & Auth Buttons */}
        <div className="hidden lg:flex items-center space-x-3">
          
          {/* Supabase Status Indicator */}
          <button
            onClick={onOpenDbModal}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
              isSupabaseConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="Supabase Ulanish Sozlamalari"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConfigured ? 'Supabase: Aktiv' : 'Supabase Code'}</span>
          </button>

          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#1F3D2B] bg-[#FAF7F0] border border-[#E4D9C4] hover:border-[#D9A441] px-3.5 py-2 rounded-lg transition-all shadow-xs"
            >
              <Globe className="w-4 h-4 text-[#D9A441]" />
              <span>{languageNames[currentLang].flag} {currentLang.toUpperCase()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#6C7C6F]" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#FAF7F0] rounded-xl shadow-xl border border-[#E4D9C4] py-1.5 z-50">
                {(['uz', 'ru', 'en'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      onLanguageChange(lang);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between font-medium transition-colors ${
                      currentLang === lang
                        ? 'bg-[#1F3D2B] text-[#FAF7F0] font-bold'
                        : 'text-[#1F3D2B] hover:bg-[#F0E8D8]'
                    }`}
                  >
                    <span>{languageNames[lang].flag} {languageNames[lang].label}</span>
                    {currentLang === lang && <span className="text-xs bg-[#D9A441] text-[#1F3D2B] font-bold px-1.5 py-0.5 rounded">Aktiv</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth Buttons / Logged-in Farmer Profile */}
          <div className="flex items-center gap-2 pl-1">
            {userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-[#1F3D2B] text-[#FAF7F0] hover:bg-[#14281C] px-3.5 py-2 rounded-xl transition-all shadow-sm border border-[#D9A441]/40"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#D9A441] text-[#1F3D2B] font-bold text-xs flex items-center justify-center">
                    {userProfile.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'D'}
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="text-xs font-bold leading-tight truncate max-w-[120px]">
                      {userProfile.full_name}
                    </p>
                    <p className="text-[10px] text-[#D9A441] font-medium leading-none">
                      {userProfile.region ? userProfile.region.split(' ')[0] : 'O\'zbekiston'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#D9A441]" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#FAF7F0] rounded-2xl shadow-xl border border-[#E4D9C4] py-2 z-50 space-y-1">
                    <div className="px-4 py-2 border-b border-[#E4D9C4]">
                      <p className="text-xs font-bold text-[#1F3D2B] truncate">{userProfile.full_name}</p>
                      <p className="text-[11px] text-[#6C7C6F]">{userProfile.phone}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold bg-[#F0E8D8] text-[#1F3D2B] px-2 py-0.5 rounded-md border border-[#E4D9C4]">
                        {userProfile.farm_type === 'commercial' ? 'Fermer Xo\'jaligi' : 'Tomorqa Dehqoni'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onOpenSettings) onOpenSettings();
                        else onOpenOnboarding?.();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#1F3D2B] hover:bg-[#F0E8D8] flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#D9A441]" />
                      <span>{t.myProfile}</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout?.();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 transition-colors border-t border-[#E4D9C4]"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#1F3D2B] hover:bg-[#F0E8D8] px-3.5 py-2 rounded-lg transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>{t.login}</span>
                </button>

                <button
                  onClick={() => onOpenAuth('register')}
                  className="flex items-center gap-2 text-sm font-bold text-[#1F3D2B] bg-[#D9A441] hover:bg-[#B8852B] hover:text-[#FAF7F0] px-4 py-2 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t.register}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 md:hidden">
          {/* Quick Language Toggle on Mobile */}
          <button
            onClick={() => {
              const next: Record<Language, Language> = { uz: 'ru', ru: 'en', en: 'uz' };
              onLanguageChange(next[currentLang]);
            }}
            className="text-xs font-bold bg-[#F0E8D8] text-[#1F3D2B] px-2.5 py-1.5 rounded-md border border-[#E4D9C4]"
          >
            {currentLang.toUpperCase()}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-lg text-[#1F3D2B] hover:bg-[#F0E8D8] transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF7F0] border-b border-[#E4D9C4] px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2">
          
          {userProfile && (
            <div className="p-3 bg-[#1F3D2B] text-[#FAF7F0] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D9A441] text-[#1F3D2B] font-bold text-sm flex items-center justify-center">
                  {userProfile.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'D'}
                </div>
                <div>
                  <p className="text-xs font-bold">{userProfile.full_name}</p>
                  <p className="text-[10px] text-[#D9A441]">{userProfile.region}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenSettings) onOpenSettings();
                  else onOpenOnboarding?.();
                }}
                className="p-2 bg-[#FAF7F0]/10 hover:bg-[#FAF7F0]/20 rounded-lg text-[#D9A441]"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
                  activeNavSection === item.id
                    ? 'bg-[#1F3D2B] text-[#FAF7F0]'
                    : 'text-[#1F3D2B] hover:bg-[#F0E8D8]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#E4D9C4] flex flex-col space-y-2.5">
            {userProfile ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenSettings) onOpenSettings();
                    else onOpenOnboarding?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#D9A441] text-[#1F3D2B] font-bold text-sm shadow-md"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t.myProfile}</span>
                </button>

                <button
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 font-bold text-sm"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>{t.logout}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[#1F3D2B] text-[#1F3D2B] font-bold text-sm"
                >
                  <User className="w-4 h-4" />
                  <span>{t.login}</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#D9A441] text-[#1F3D2B] font-bold text-sm shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t.register}</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                onOpenDbModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#F0E8D8] text-[#5C4033] text-xs font-semibold"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase SQL Kodini Ko&apos;rish</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
