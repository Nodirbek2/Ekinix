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
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 bg-[#F0E8D8] border border-[#E4D9C4] px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-[#1F3D2B] shadow-xs">
              <Sprout className="w-4 h-4 text-[#D9A441]" />
              <span>{t.heroTagline}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] animate-pulse" />
            </div>

            {/* Main Title - Serif typography */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#1F3D2B] leading-[1.15]">
              {t.heroTitle}
            </h1>

            {/* Subtitle - Exactly one clean sentence explaining the app */}
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

            {/* Value Trust Markers */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-[#E4D9C4] max-w-lg">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2D3A2F]">
                <CheckCircle2 className="w-4 h-4 text-[#D9A441] shrink-0" />
                <span>Open-Meteo &amp; Sentinel</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2D3A2F]">
                <ShieldCheck className="w-4 h-4 text-[#D9A441] shrink-0" />
                <span>Supabase Xavfsiz</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2D3A2F]">
                <Layers className="w-4 h-4 text-[#D9A441] shrink-0" />
                <span>100% Bepul Boshlash</span>
              </div>
            </div>

          </div>

          {/* Hero Right Visual Area - Live Card Widgets Showcase */}
          <div className="lg:col-span-5 relative">
            
            {/* Background Frame Box */}
            <div className="relative mx-auto max-w-md lg:max-w-none bg-[#1F3D2B] p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-[#FAF7F0]">
              
              {/* Header inside Dark Green Card Showcase */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white text-sm font-bold tracking-wide">
                    Yangiyo&apos;l Maydoni #1
                  </span>
                </div>
                <span className="bg-[#D9A441] text-[#1F3D2B] text-xs font-extrabold px-2.5 py-1 rounded-full uppercase">
                  Jonli Monitoring
                </span>
              </div>

              {/* Widget Card 1: Soil Moisture */}
              <div className="bg-[#FAF7F0] p-4 rounded-2xl shadow-md border border-[#E4D9C4] mb-4 transform hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider">
                        {t.moistureCardTitle}
                      </h4>
                      <p className="text-base font-extrabold text-[#1F3D2B]">
                        {t.moistureStatus}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">
                    Optimal
                  </span>
                </div>

                {/* Progress Gauge */}
                <div className="w-full bg-[#E4D9C4] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#1F3D2B] h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: '68%' }}
                  />
                </div>
              </div>

              {/* Widget Card 2: Field Area & Crop */}
              <div className="bg-[#FAF7F0] p-4 rounded-2xl shadow-md border border-[#E4D9C4] mb-4 transform hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider">
                        {t.fieldAreaCardTitle}
                      </h4>
                      <p className="text-base font-extrabold text-[#1F3D2B]">
                        {t.fieldAreaValue}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#5C4033] bg-[#F0E8D8] px-2.5 py-1 rounded-md border border-[#E4D9C4]">
                    NDVI 0.76
                  </span>
                </div>
              </div>

              {/* Widget Card 3: Next Irrigation Plan */}
              <div className="bg-[#FAF7F0] p-4 rounded-2xl shadow-md border border-[#E4D9C4] transform hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-900">
                      <Sun className="w-5 h-5 text-[#B8852B]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#6C7C6F] uppercase tracking-wider">
                        {t.nextIrrigationTitle}
                      </h4>
                      <p className="text-sm font-extrabold text-[#1F3D2B]">
                        {t.nextIrrigationValue}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-[#D9A441]/20 text-[#B8852B] px-2 py-1 rounded-md border border-[#D9A441]/40">
                    Tavsiya
                  </span>
                </div>
              </div>

              {/* Bottom Water Saving Note */}
              <p className="text-center text-xs text-emerald-100/80 pt-4 font-medium">
                💧 Har faslda 25% gacha suv va elektr energiyasini tejang
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
