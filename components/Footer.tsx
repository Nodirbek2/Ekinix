'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { Sprout, Globe, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenDbModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentLang,
  onLanguageChange,
  onOpenDbModal,
}) => {
  const t = translations[currentLang];

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Brand & Tagline */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#164E35] text-white flex items-center justify-center font-bold">
                <Sprout className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-slate-200">
                Ekinix AGRO
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-md">
              O&apos;zbekiston dehqonlari va fermer xo&apos;jaliklari uchun B2B aqlli agrotexnologiyalar platformasi.
            </p>
          </div>

          {/* Quick Links & Language Toggle */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <a href="#interactive-demo" className="hover:text-slate-200 transition-colors">{t.tabSatellite}</a>
            <a href="#interactive-demo" className="hover:text-slate-200 transition-colors">{t.tabWeather}</a>
            <a href="#interactive-demo" className="hover:text-slate-200 transition-colors">{t.tabMarket}</a>
            <button onClick={onOpenDbModal} className="hover:text-emerald-400 transition-colors cursor-pointer">{t.dbSetup}</button>
            
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-md border border-slate-700/60">
              {[
                { code: 'uz' as const, label: "UZ" },
                { code: 'ru' as const, label: "RU" },
                { code: 'en' as const, label: "EN" },
              ].map(item => (
                <button
                  key={item.code}
                  onClick={() => onLanguageChange(item.code)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                    currentLang === item.code
                      ? 'bg-slate-700 text-slate-100 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Ekinix Platform. {t.allRightsReserved}</p>
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Precision Agritech Standard</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
