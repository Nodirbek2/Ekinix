'use client';

import React from 'react';
import { Language, translations } from '@/lib/i18n';
import { MapPin, Satellite, TrendingUp, CheckCircle2 } from 'lucide-react';

interface HowItWorksProps {
  currentLang: Language;
  onOpenRegister: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ currentLang, onOpenRegister }) => {
  const t = translations[currentLang];

  const steps = [
    {
      number: "01",
      icon: MapPin,
      title: t.step1Title,
      desc: t.step1Desc,
      badge: "Xarita & Koordinata"
    },
    {
      number: "02",
      icon: Satellite,
      title: t.step2Title,
      desc: t.step2Desc,
      badge: "Sentinel NDVI & Sun'iy Yo'ldosh"
    },
    {
      number: "03",
      icon: TrendingUp,
      title: t.step3Title,
      desc: t.step3Desc,
      badge: "To'g'ridan-to'g'ri Savdo"
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-[#1F3D2B] text-[#FAF7F0] relative overflow-hidden">
      {/* Background Decorative Grid Accent */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#D9A441 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 bg-[#FAF7F0]/10 border border-[#D9A441]/30 px-4 py-1.5 rounded-full text-xs font-bold text-[#D9A441] tracking-wider uppercase">
            <span>Oddiy va Tushunarli</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#FAF7F0] tracking-tight">
            {t.howItWorksTitle}
          </h2>
          <p className="text-base sm:text-lg text-[#E4D9C4] font-sans font-normal leading-relaxed">
            {t.howItWorksSubtitle}
          </p>
        </div>

        {/* 3 Step Visual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-[#14281C] rounded-2xl p-8 border border-white/10 hover:border-[#D9A441]/50 transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div>
                  {/* Step Top Bar: Icon + Step Number */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-[#D9A441]/10 border border-[#D9A441]/30 flex items-center justify-center text-[#D9A441] group-hover:bg-[#D9A441] group-hover:text-[#1F3D2B] transition-all duration-300">
                      <Icon className="w-7 h-7 stroke-[2]" />
                    </div>
                    <span className="font-serif text-3xl font-extrabold text-[#D9A441]/40 group-hover:text-[#D9A441] transition-colors">
                      {step.number}
                    </span>
                  </div>

                  {/* Badge */}
                  <div className="mb-3">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#D9A441] bg-[#D9A441]/10 px-2.5 py-1 rounded-md border border-[#D9A441]/20">
                      {step.badge}
                    </span>
                  </div>

                  {/* Step Title & Description */}
                  <h3 className="font-serif text-xl font-bold text-[#FAF7F0] mb-3 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#E4D9C4] leading-relaxed font-sans font-normal">
                    {step.desc}
                  </p>
                </div>

                {/* Bottom Highlight Line */}
                <div className="pt-6 mt-6 border-t border-white/10 flex items-center gap-2 text-xs text-[#D9A441] font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#D9A441]" />
                  <span>Tezkor va oson faollashtirish</span>
                </div>
              </div>
            );
          })}

        </div>

        {/* Bottom CTA Band inside HowItWorks */}
        <div className="mt-16 bg-[#2A5238] rounded-2xl p-8 border border-[#D9A441]/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F0]">
              Maydoningizni bugunoq tizimga qo&apos;shing
            </h4>
            <p className="text-sm text-[#E4D9C4]">
              Ro&apos;yxatdan o&apos;tish mutlaqo bepul va 1 daqiqadan kam vaqt oladi.
            </p>
          </div>

          <button
            onClick={onOpenRegister}
            className="shrink-0 bg-[#D9A441] hover:bg-[#B8852B] text-[#1F3D2B] font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
          >
            Maydon qo&apos;shish va ro&apos;yxatdan o&apos;tish
          </button>
        </div>

      </div>
    </section>
  );
};
