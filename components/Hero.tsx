'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { Sprout, ArrowRight, Droplets, Compass, Sun, ShieldCheck, CheckCircle2, Layers } from 'lucide-react';

interface HeroProps {
  currentLang: Language;
  onOpenRegister: () => void;
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ currentLang, onOpenRegister, onExploreClick }) => {
  const t = translations[currentLang];

  return (
    <section className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden bg-[#FAF7F0]">
      {/* Organic Background Accent Shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#D9A441]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-[#1F3D2B]/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Hero Left Text Area */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Main Title - Serif typography */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#1F3D2B] leading-[1.15]">
              {t.heroTitle}
            </h1>

            {/* Subtitle - Clean sentence explaining the app */}
            <p className="text-base sm:text-lg md:text-xl text-[#4A5D4E] leading-relaxed max-w-2xl font-sans font-normal">
              {t.heroSub}
            </p>

            {/* CTA Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onOpenRegister}
                className="inline-flex items-center justify-center gap-3 bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-base px-7 py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{t.getStarted}</span>
                <ArrowRight className="w-5 h-5 text-[#D9A441]" />
              </button>

              <button
                onClick={onExploreClick}
                className="inline-flex items-center justify-center gap-2 bg-[#FAF7F0] hover:bg-[#F0E8D8] text-[#1F3D2B] font-bold text-base px-6 py-4 rounded-xl border-2 border-[#1F3D2B]/20 transition-all"
              >
                <Compass className="w-5 h-5 text-[#1F3D2B]" />
                <span>{t.tryDemo}</span>
              </button>
            </div>

          </div>

          {/* Hero Right Visual Area - Clean Single Card Showcase */}
          <div className="lg:col-span-5 relative">
            
            {/* Background Frame Box */}
            <div className="relative mx-auto max-w-md lg:max-w-none bg-[#1F3D2B] p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-[#FAF7F0]">
              
              {/* Header inside Dark Green Card Showcase */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white text-base font-bold tracking-wide">
                    Yangiyo&apos;l Maydoni #1
                  </span>
                </div>
                <span className="bg-[#D9A441] text-[#1F3D2B] text-xs font-extrabold px-3 py-1 rounded-full uppercase">
                  Jonli Monitoring
                </span>
              </div>

              {/* Combined Clean Card */}
              <div className="bg-[#FAF7F0] p-5 rounded-2xl shadow-md border border-[#E4D9C4] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                      <Sprout className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider">
                        {t.fieldAreaCardTitle}
                      </h4>
                      <p className="text-lg font-extrabold text-[#1F3D2B]">
                        {t.fieldAreaValue}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#1F3D2B] bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
                    NDVI 0.76 (Sog&apos;lom)
                  </span>
                </div>

                <div className="pt-2 border-t border-[#E4D9C4] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-[#2D3A2F]">{t.moistureCardTitle}:</span>
                    <span className="font-bold text-emerald-800">{t.moistureStatus}</span>
                  </div>
                  <span className="font-semibold text-[#6C7C6F]">Keyingi sug&apos;orish: 2 kundan so&apos;ng</span>
                </div>
              </div>

              {/* Bottom Water Saving Note */}
              <p className="text-center text-xs text-emerald-100/80 pt-4 font-medium">
                💧 Aqlli sug&apos;orish va sun&apos;iy yo&apos;ldosh tahlili
              </p>

            </div>

            {/* Decorative Gold Badge */}
            <div className="absolute -bottom-6 -left-6 bg-[#D9A441] text-[#1F3D2B] font-extrabold text-xs px-4 py-3 rounded-xl shadow-xl hidden sm:flex items-center gap-2 border-2 border-[#FAF7F0]">
              <span className="text-base">🇺🇿</span>
              <span>O&apos;zbekiston hududiy sharoitlariga moslashtirilgan</span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
