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
    <footer className="bg-[#14281C] text-[#FAF7F0] border-t-4 border-[#D9A441] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Brand Info */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9A441] text-[#1F3D2B] flex items-center justify-center font-bold shadow-md">
                <Sprout className="w-6 h-6" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#FAF7F0]">
                Ekinix
              </span>
            </div>

            <p className="text-sm text-[#E4D9C4] max-w-md leading-relaxed">
              {t.footerDesc}
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#D9A441]">
              <ShieldCheck className="w-4 h-4" />
              <span>O&apos;zbekiston dehqonlari va fermer xo&apos;jaliklari uchun</span>
            </div>
          </div>

          {/* Quick Links & Languages */}
          <div className="md:col-span-6 grid grid-cols-2 gap-6">
            
            <div className="space-y-3">
              <h5 className="font-serif text-sm font-bold text-[#D9A441] uppercase tracking-wider">
                Platforma
              </h5>
              <ul className="space-y-2 text-xs text-[#E4D9C4] font-medium">
                <li><a href="#interactive-demo" className="hover:text-white transition-colors">{t.tabSatellite}</a></li>
                <li><a href="#interactive-demo" className="hover:text-white transition-colors">{t.tabWeather}</a></li>
                <li><a href="#interactive-demo" className="hover:text-white transition-colors">{t.tabMarket}</a></li>
                <li><button onClick={onOpenDbModal} className="hover:text-[#D9A441] transition-colors">{t.dbSetup}</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-serif text-sm font-bold text-[#D9A441] uppercase tracking-wider">
                Tilni Tanlash
              </h5>
              <div className="flex flex-col space-y-2">
                {[
                  { code: 'uz' as const, label: "O'zbekcha (UZ)", flag: "🇺🇿" },
                  { code: 'ru' as const, label: "Русский (RU)", flag: "🇷🇺" },
                  { code: 'en' as const, label: "English (EN)", flag: "🇬🇧" },
                ].map(item => (
                  <button
                    key={item.code}
                    onClick={() => onLanguageChange(item.code)}
                    className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg w-fit transition-colors ${
                      currentLang === item.code
                        ? 'bg-[#D9A441] text-[#1F3D2B] font-bold'
                        : 'text-[#E4D9C4] hover:bg-white/10'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{item.flag} {item.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#E4D9C4]">
          <p>© {new Date().getFullYear()} Ekinix. {t.allRightsReserved}</p>
        </div>

      </div>
    </footer>
  );
};
