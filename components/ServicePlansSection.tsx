'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FarmerProfile, ServicePlan } from '@/lib/supabase';
import { SERVICE_PLANS_DATA } from '@/lib/servicePlansData';
import { Button } from '@/components/ui/Button';
import {
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
  TrendingUp,
  Award,
  Crown,
  Info,
  Layers,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';

interface ServicePlansSectionProps {
  currentLang: Language;
  userProfile?: FarmerProfile | null;
  onUpdateTier?: (tier: 'free' | 'standart' | 'pro') => void;
  onPlanSelected?: (planId: string) => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const ServicePlansSection: React.FC<ServicePlansSectionProps> = ({
  currentLang,
  userProfile,
  onUpdateTier,
  onPlanSelected,
  onOpenAuth,
}) => {
  const t = translations[currentLang];
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'season'>('season');
  const [selectedPlanModal, setSelectedPlanModal] = useState<ServicePlan | null>(null);
  const [activating, setActivating] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const currentTier = userProfile?.tier || 'free';

  const formatPrice = (uzs: number) => {
    if (uzs === 0) {
      return currentLang === 'ru' ? 'Бесплатно' : currentLang === 'en' ? 'Free' : 'Bepul';
    }
    const finalPrice = billingPeriod === 'season' ? Math.round(uzs * 0.8) : uzs;
    return `${finalPrice.toLocaleString('uz-UZ')} UZS`;
  };

  const handleSelectPlan = (plan: ServicePlan) => {
    if (!userProfile) {
      onOpenAuth?.();
      return;
    }
    setSelectedPlanModal(plan);
  };

  const handleConfirmPlan = () => {
    if (!selectedPlanModal) return;
    setActivating(true);
    setTimeout(() => {
      onUpdateTier?.(selectedPlanModal.id);
      onPlanSelected?.(selectedPlanModal.id);
      setActivating(false);
      setSelectedPlanModal(null);
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 5000);
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#1F3D2B] via-[#1B3626] to-[#122419] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden border border-[#2D543C] shadow-lg">
        {/* Subtle Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9A441]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/30 text-xs font-bold uppercase tracking-wider mb-4">
            <Crown className="w-4 h-4" />
            {currentLang === 'ru'
              ? 'Тарифные планы Ekinix'
              : currentLang === 'en'
              ? 'Ekinix Service Plans'
              : 'Ekinix Xizmat Rejalari'}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#FAF7F0] mb-4">
            {currentLang === 'ru'
              ? 'Точные агротехнологии для каждого гектара'
              : currentLang === 'en'
              ? 'Precision AgTech Scaled for Every Farm'
              : "Har bir gektar uchun zamonaviy agrotexnologiyalar"}
          </h1>
          <p className="text-emerald-100/90 text-base sm:text-lg leading-relaxed mb-8">
            {currentLang === 'ru'
              ? 'От бесплатного спутникового мониторинга небольших полей до продвинутого ИИ-анализа урожайности и прямой консультации ведущих агрономов.'
              : currentLang === 'en'
              ? 'From free satellite NDVI monitoring for smallholders to advanced AI seasonal yields and direct agronomist triage advisory.'
              : "Kichik tomorqa xo'jaliklaridan tortib yirik paxta va g'alla klasterlarigacha — sun'iy yo'ldosh, sun'iy intellekt va agronomlar tajribasi bir joyda."}
          </p>

          {/* Billing Switcher */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10">
            <button
              onClick={() => setBillingPeriod('season')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingPeriod === 'season'
                  ? 'bg-[#D9A441] text-[#1F3D2B] shadow-md'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <span>{currentLang === 'ru' ? 'Сезонная подписка' : currentLang === 'en' ? 'Seasonal Pass' : 'Mavsumiy to\'lov'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1F3D2B] text-[#FAF7F0] font-black">
                -20%
              </span>
            </button>
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-[#D9A441] text-[#1F3D2B] shadow-md'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              {currentLang === 'ru' ? 'Ежемесячно' : currentLang === 'en' ? 'Monthly' : 'Oylik'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">
              {currentLang === 'ru'
                ? 'Тарифный план успешно обновлен!'
                : currentLang === 'en'
                ? 'Service plan successfully updated!'
                : 'Xizmat rejasi muvaffaqiyatli yangilandi!'}
            </p>
            <p className="text-xs text-emerald-700">
              {currentLang === 'ru'
                ? 'Все новые возможности тарифа активированы для ваших полей.'
                : currentLang === 'en'
                ? 'All plan features are now active for your registered fields.'
                : "Barcha imkoniyatlar sizning ro'yxatdan o'tgan maydonlaringiz uchun faollashtirildi."}
            </p>
          </div>
        </div>
      )}

      {/* 3 Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        {SERVICE_PLANS_DATA.map((plan) => {
          const isCurrent = currentTier === plan.id;
          const isPro = plan.id === 'pro';
          const isStandart = plan.id === 'standart';

          const title = currentLang === 'ru' ? plan.name_ru : currentLang === 'en' ? plan.name_en : plan.name_uz;
          const tagline = currentLang === 'ru' ? plan.tagline_ru : currentLang === 'en' ? plan.tagline_en : plan.tagline_uz;
          const features = currentLang === 'ru' ? plan.features_ru : currentLang === 'en' ? plan.features_en : plan.features_uz;
          const limitations = currentLang === 'ru' ? plan.limitations_ru : currentLang === 'en' ? plan.limitations_en : plan.limitations_uz;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-8 transition-all flex flex-col justify-between ${
                isStandart
                  ? 'bg-[#FAF7F0] border-2 border-[#D9A441] shadow-xl shadow-[#D9A441]/10 md:-translate-y-2'
                  : isPro
                  ? 'bg-[#FAF7F0] border-2 border-[#1F3D2B] shadow-lg'
                  : 'bg-white border border-[#E4D9C4] shadow-sm'
              }`}
            >
              {/* Most Popular Badge */}
              {isStandart && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#D9A441] text-[#1F3D2B] font-bold text-xs shadow-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {currentLang === 'ru' ? 'Хит выбора фермеров' : currentLang === 'en' ? 'Most Popular' : 'Eng ko\'p tanlangan'}
                </div>
              )}

              {/* Active Plan Tag */}
              {isCurrent && (
                <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {currentLang === 'ru' ? 'Текущий план' : currentLang === 'en' ? 'Active' : 'Faol reja'}
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="font-serif text-2xl font-bold text-[#1F3D2B]">{title}</h3>
                  <p className="text-xs sm:text-sm text-[#6C7C6F] mt-1 line-clamp-2">{tagline}</p>
                </div>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-[#E4D9C4]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-3xl sm:text-4xl font-black text-[#1F3D2B]">
                      {formatPrice(plan.price_monthly_uzs)}
                    </span>
                    {plan.price_monthly_uzs > 0 && (
                      <span className="text-xs text-[#6C7C6F] font-medium">
                        / {currentLang === 'ru' ? 'мес.' : currentLang === 'en' ? 'mo' : 'oy'}
                      </span>
                    )}
                  </div>
                  {plan.price_per_ha_uzs && (
                    <p className="text-[11px] text-[#6C7C6F] mt-1 font-medium">
                      {currentLang === 'ru'
                        ? `или ~${plan.price_per_ha_uzs.toLocaleString('uz-UZ')} сум/га в месяц`
                        : currentLang === 'en'
                        ? `or ~${plan.price_per_ha_uzs.toLocaleString('uz-UZ')} UZS/ha/mo`
                        : `yoki oyiga ~${plan.price_per_ha_uzs.toLocaleString('uz-UZ')} so'm/ga`}
                    </p>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1F3D2B]">
                    {currentLang === 'ru' ? 'Включено в тариф:' : currentLang === 'en' ? 'Features Included:' : 'Imkoniyatlar:'}
                  </p>
                  <ul className="space-y-2.5">
                    {features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#2D4A3E]">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations (if any) */}
                  {limitations && limitations.length > 0 && (
                    <div className="pt-3 border-t border-[#E4D9C4]/60 space-y-2">
                      {limitations.map((limit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-500 list-none">
                          <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-2.5 h-2.5" />
                          </div>
                          <span>{limit}</span>
                        </li>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action CTA Button */}
              <div className="pt-2">
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  id={`select-plan-${plan.id}`}
                  variant={isCurrent ? 'secondary' : isStandart ? 'primary' : isPro ? 'accent' : 'secondary'}
                  size="md"
                  className="w-full justify-center"
                  disabled={isCurrent}
                >
                  {isCurrent
                    ? currentLang === 'ru'
                      ? 'Ваш текущий тариф'
                      : currentLang === 'en'
                      ? 'Current Plan'
                      : 'Amaldagi faol reja'
                    : currentLang === 'ru'
                    ? `Выбрать ${title}`
                    : currentLang === 'en'
                    ? `Choose ${title}`
                    : `${title} rejasiga o'tish`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4D9C4] shadow-sm">
        <div className="mb-6">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1F3D2B]">
            {currentLang === 'ru'
              ? 'Подробное сравнение возможностей'
              : currentLang === 'en'
              ? 'Feature-by-Feature Comparison Matrix'
              : 'Xizmat imkoniyatlarining to\'liq taqqoslanishi'}
          </h3>
          <p className="text-xs sm:text-sm text-[#6C7C6F] mt-1">
            {currentLang === 'ru'
              ? 'Выберите подходящий уровень технологического контроля для ваших полей'
              : currentLang === 'en'
              ? 'Select the optimal precision level for your acreage'
              : "Maydoningiz ko'lami va talablariga mos optimal reja darajasini tanlang"}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#E4D9C4] text-[#1F3D2B]">
                <th className="py-3 px-4 font-bold w-1/3">
                  {currentLang === 'ru' ? 'Функционал' : currentLang === 'en' ? 'Feature' : 'Funksiyalar'}
                </th>
                <th className="py-3 px-4 font-bold text-center">Asosiy</th>
                <th className="py-3 px-4 font-bold text-center bg-[#FAF7F0] rounded-t-xl text-[#1F3D2B]">
                  Standart
                </th>
                <th className="py-3 px-4 font-bold text-center">Professional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4D9C4]/60 text-[#2D4A3E]">
              <tr>
                <td className="py-3 px-4 font-medium">
                  {currentLang === 'ru' ? 'Количество полей' : currentLang === 'en' ? 'Max Registered Fields' : 'Ro\'yxatdagi maydonlar soni'}
                </td>
                <td className="py-3 px-4 text-center">1 ta</td>
                <td className="py-3 px-4 text-center bg-[#FAF7F0] font-bold text-[#1F3D2B]">Cheksiz</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-800">Cheksiz</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">
                  {currentLang === 'ru' ? 'Частота обновления NDVI' : currentLang === 'en' ? 'Satellite NDVI Frequency' : 'NDVI yangilanish tezligi'}
                </td>
                <td className="py-3 px-4 text-center">7 kunda 1 marta</td>
                <td className="py-3 px-4 text-center bg-[#FAF7F0] font-bold text-[#1F3D2B]">3-5 kunda 1 marta</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-800">Kundalik / 3 kun</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">
                  {currentLang === 'ru' ? 'Калькулятор норм полива' : currentLang === 'en' ? 'Irrigation Calculator' : 'Sug\'orish normasi kalkulyatori'}
                </td>
                <td className="py-3 px-4 text-center text-slate-400">Umumiy</td>
                <td className="py-3 px-4 text-center bg-[#FAF7F0] font-bold text-[#1F3D2B]">7 kunlik aniq</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-800">Sensor & AI integratsiya</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">
                  {currentLang === 'ru' ? 'Сезонный трекер фаз (Milestones)' : currentLang === 'en' ? 'Season Milestone Stages' : 'Mavsumiy bosqichlar (Milestones)'}
                </td>
                <td className="py-3 px-4 text-center text-emerald-700">✓</td>
                <td className="py-3 px-4 text-center bg-[#FAF7F0] font-bold text-emerald-700">✓</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-800">✓ + Tekshiruvlar</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">
                  {currentLang === 'ru' ? 'ИИ-ассистент «Ekin Yordamchisi» (Gemini)' : currentLang === 'en' ? 'AI Ag Assistant (Gemini)' : 'AI Ekin Yordamchisi (Gemini)'}
                </td>
                <td className="py-3 px-4 text-center text-slate-300">—</td>
                <td className="py-3 px-4 text-center bg-[#FAF7F0] text-slate-600">3 marta / hafta</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-800">Cheksiz & Chuqur</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">
                  {currentLang === 'ru' ? 'Режим Агронома и консультации' : currentLang === 'en' ? 'Agronomist Collaboration' : 'Agronom bilan to\'g\'ridan-to\'g\'ri hamkorlik'}
                </td>
                <td className="py-3 px-4 text-center text-slate-300">—</td>
                <td className="py-3 px-4 text-center bg-[#FAF7F0] text-slate-400">—</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-800">✓ (Taranis AgTech)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">
                  {currentLang === 'ru' ? 'Подбор гос. субсидий Узбекистана' : currentLang === 'en' ? 'Uzbekistan Subsidy Matching' : 'Davlat subsidiyalarini moslashtirish'}
                </td>
                <td className="py-3 px-4 text-center text-emerald-700">Ko&apos;rish</td>
                <td className="py-3 px-4 text-center bg-[#FAF7F0] font-bold text-emerald-700">Ko&apos;rish &amp; Hisoblash</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-800">To&apos;liq ariza ko&apos;magi</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">
                  {currentLang === 'ru' ? 'Экспорт официальных PDF отчётов' : currentLang === 'en' ? 'Export PDF Telemetry Reports' : 'Rasmiy PDF hisobotlarni yuklash'}
                </td>
                <td className="py-3 px-4 text-center text-slate-300">—</td>
                <td className="py-3 px-4 text-center bg-[#FAF7F0] text-emerald-700">✓</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-800">✓ Muhr & Xulosalar</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Activation Modal */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E4D9C4] shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center mx-auto mb-3">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1F3D2B]">
                {currentLang === 'ru'
                  ? `Подключение тарифа «${selectedPlanModal.name_ru}»`
                  : currentLang === 'en'
                  ? `Activate "${selectedPlanModal.name_en}" Plan`
                  : `«${selectedPlanModal.name_uz}» rejasini faollashtirish`}
              </h3>
              <p className="text-xs text-[#6C7C6F] mt-1">
                {currentLang === 'ru'
                  ? 'Тариф мгновенно применится к вашему аккаунту и полям'
                  : currentLang === 'en'
                  ? 'This plan will immediately activate for all your fields'
                  : "Ushbu reja darhol profilingiz va ekin maydonlaringiz uchun biriktiriladi"}
              </p>
            </div>

            <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E4D9C4] mb-6 space-y-2 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-[#6C7C6F]">Tarif narxi:</span>
                <span className="font-bold text-[#1F3D2B]">{formatPrice(selectedPlanModal.price_monthly_uzs)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-[#6C7C6F]">To&apos;lov davri:</span>
                <span className="font-bold text-[#1F3D2B]">
                  {billingPeriod === 'season' ? "Mavsumiy (20% chegirma)" : "Oylik"}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-[#6C7C6F]">Faollashtirish:</span>
                <span className="font-bold text-emerald-700">Darhol (Onlayn)</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 justify-center"
                onClick={() => setSelectedPlanModal(null)}
                disabled={activating}
              >
                {currentLang === 'ru' ? 'Отмена' : currentLang === 'en' ? 'Cancel' : 'Bekor qilish'}
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 justify-center"
                onClick={handleConfirmPlan}
                disabled={activating}
              >
                {activating
                  ? currentLang === 'ru'
                    ? 'Активация...'
                    : currentLang === 'en'
                    ? 'Activating...'
                    : 'Faollashtirilmoqda...'
                  : currentLang === 'ru'
                  ? 'Подтвердить'
                  : currentLang === 'en'
                  ? 'Confirm'
                  : 'Tasdiqlash'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
