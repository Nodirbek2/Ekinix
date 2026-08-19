'use client';

import React, { useState, useMemo } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FarmerProfile, FieldRecord } from '@/lib/supabase';
import { matchFarmerPrograms, ProgramMatchResult, GovernmentProgram } from '@/lib/governmentProgramsData';
import { Button } from '@/components/ui/Button';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Clock,
  Calculator,
  ChevronRight,
  Building,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

interface GovernmentProgramsSectionProps {
  currentLang: Language;
  userProfile?: FarmerProfile | null;
  fields?: FieldRecord[];
  onNavigateToFields?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const GovernmentProgramsSection: React.FC<GovernmentProgramsSectionProps> = ({
  currentLang,
  userProfile,
  fields = [],
  onNavigateToFields,
  onOpenAuth,
}) => {
  const t = translations[currentLang];
  const [selectedProgram, setSelectedProgram] = useState<ProgramMatchResult | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State for assistance request
  const [contactName, setContactName] = useState(userProfile?.full_name || '');
  const [contactPhone, setContactPhone] = useState(userProfile?.phone || '');
  const [contactNotes, setContactNotes] = useState('');

  // Calculate matching programs
  const matchResults = useMemo(() => {
    return matchFarmerPrograms(fields);
  }, [fields]);

  // Aggregate stats
  const totalEligibleSubsidy = useMemo(() => {
    return matchResults.reduce((acc, curr) => acc + curr.totalEstimatedSubsidyUzs, 0);
  }, [matchResults]);

  const totalFieldsArea = useMemo(() => {
    return fields.reduce((acc, curr) => acc + (Number(curr.area_hectares) || 0), 0);
  }, [fields]);

  const handleOpenApply = (result: ProgramMatchResult) => {
    setSelectedProgram(result);
    setApplyModalOpen(true);
    setAppliedSuccess(false);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setAppliedSuccess(true);
      setTimeout(() => {
        setApplyModalOpen(false);
        setAppliedSuccess(false);
      }, 3500);
    }, 900);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Hero Section */}
      <div className="bg-gradient-to-br from-[#1F3D2B] via-[#1E3A29] to-[#122419] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden border border-[#2D543C] shadow-lg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D9A441]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/30 text-xs font-bold uppercase tracking-wider">
              <Landmark className="w-4 h-4" />
              {currentLang === 'ru'
                ? 'Государственная поддержка и субсидии'
                : currentLang === 'en'
                ? 'Government Subsidies & Grants'
                : "Davlat Subsidiyalari & Imtiyozlar"}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#FAF7F0]">
              {currentLang === 'ru'
                ? 'Подбор субсидий под ваши поля'
                : currentLang === 'en'
                ? 'Subsidy Matching for Your Farm'
                : "Maydoningizga mos davlat subsidiyalari"}
            </h1>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-2xl">
              {currentLang === 'ru'
                ? 'Автоматический анализ ваших культур и площадей на соответствие государственным программам поддержки сельского хозяйства Узбекистана (субсидии на капельное орошение, льготные кредиты и гранты).'
                : currentLang === 'en'
                ? 'Automated eligibility verification and subsidy matching for Uzbekistan agricultural support programs (water-saving irrigation grants, preferential loans, and orchard development).'
                : "Ekinix tizimi ekin turlaringiz va maydonlaringizni O'zbekiston Respublikasi Qishloq xo'jaligi va Suv xo'jaligi vazirligining rasmiy subsidiya dasturlariga avtomatik taqqoslaydi."}
            </p>
          </div>

          {/* Potential Subsidy Value Box */}
          <div className="bg-[#FAF7F0] rounded-3xl p-6 border-2 border-[#D9A441] shadow-xl text-[#1F3D2B]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6C7C6F] mb-1">
              <Sparkles className="w-4 h-4 text-[#D9A441]" />
              {currentLang === 'ru' ? 'Расчётная сумма субсидий' : currentLang === 'en' ? 'Potential Subsidy Pool' : 'Hisoblangan jami subsidiya'}
            </div>
            <div className="font-serif text-3xl sm:text-4xl font-black text-[#1F3D2B] mb-2">
              {totalEligibleSubsidy > 0
                ? `${totalEligibleSubsidy.toLocaleString('uz-UZ')} UZS`
                : '24 000 000 UZS+'}
            </div>
            <p className="text-xs text-[#6C7C6F] leading-snug">
              {currentLang === 'ru'
                ? `На основе ${fields.length} полей (${totalFieldsArea.toFixed(1)} га)`
                : currentLang === 'en'
                ? `Based on ${fields.length} registered field(s) (${totalFieldsArea.toFixed(1)} ha)`
                : `Sizning ${fields.length} ta maydoningiz (${totalFieldsArea.toFixed(1)} ga) asosida`}
            </p>
          </div>
        </div>
      </div>

      {/* Programs List Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1F3D2B]">
              {currentLang === 'ru'
                ? 'Доступные государственные программы'
                : currentLang === 'en'
                ? 'Matched Support Programs'
                : 'Mavjud davlat dasturlari va imtiyozlar'}
            </h2>
            <p className="text-xs sm:text-sm text-[#6C7C6F] mt-0.5">
              {currentLang === 'ru'
                ? 'Программы, прошедшие верификацию соответствия вашим культурам'
                : currentLang === 'en'
                ? 'Programs verified against your registered crop types'
                : "Maydonlaringiz ko'rsatkichlariga mos keluvchi rasmiy dasturlar"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matchResults.map((item) => {
            const prog = item.program;
            const title = currentLang === 'ru' ? prog.title_ru : currentLang === 'en' ? prog.title_en : prog.title_uz;
            const org = currentLang === 'ru' ? prog.organization_ru : currentLang === 'en' ? prog.organization_en : prog.organization_uz;
            const desc = currentLang === 'ru' ? prog.description_ru : currentLang === 'en' ? prog.description_en : prog.description_uz;
            const maxSubsidy = currentLang === 'ru' ? prog.max_subsidy_ru : currentLang === 'en' ? prog.max_subsidy_en : prog.max_subsidy_uz;
            const badge = currentLang === 'ru' ? prog.badge_text_ru : currentLang === 'en' ? prog.badge_text_en : prog.badge_text_uz;
            const reasons = currentLang === 'ru' ? item.matchReasonsRu : currentLang === 'en' ? item.matchReasonsEn : item.matchReasonsUz;
            const docs = currentLang === 'ru' ? prog.required_documents_ru : currentLang === 'en' ? prog.required_documents_en : prog.required_documents_uz;

            return (
              <div
                key={prog.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4D9C4] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Badge + Match Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#FAF7F0] border border-[#E4D9C4] text-[#1F3D2B] text-xs font-bold">
                      {badge}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {item.matchScore}% {currentLang === 'ru' ? 'Совпадение' : currentLang === 'en' ? 'Match' : 'Mos keladi'}
                    </span>
                  </div>

                  {/* Title & Organization */}
                  <h3 className="font-serif text-xl font-bold text-[#1F3D2B] mb-2 leading-snug">
                    {title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#6C7C6F] font-medium mb-4">
                    <Building className="w-3.5 h-3.5 text-[#D9A441]" />
                    <span>{org}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#2D4A3E] leading-relaxed mb-5">
                    {desc}
                  </p>

                  {/* Subsidy Value Pill */}
                  <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#E4D9C4] mb-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6C7C6F]">
                      {currentLang === 'ru' ? 'Размер субсидии / льготы:' : currentLang === 'en' ? 'Subsidy Cap / Grant:' : 'Subsidiya yoki imtiyoz miqdori:'}
                    </div>
                    <div className="font-serif text-2xl font-black text-[#1F3D2B] mt-0.5">
                      {maxSubsidy}
                    </div>
                    {item.totalEstimatedSubsidyUzs > 0 && (
                      <p className="text-xs text-emerald-700 font-bold mt-1">
                        {currentLang === 'ru'
                          ? `Ваш потенциальный объём: ~${item.totalEstimatedSubsidyUzs.toLocaleString('uz-UZ')} UZS`
                          : currentLang === 'en'
                          ? `Your estimated benefit: ~${item.totalEstimatedSubsidyUzs.toLocaleString('uz-UZ')} UZS`
                          : `Sizning hisoblangan umumiy foydangiz: ~${item.totalEstimatedSubsidyUzs.toLocaleString('uz-UZ')} UZS`}
                      </p>
                    )}
                  </div>

                  {/* Match Criteria Points */}
                  <div className="space-y-2 mb-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#1F3D2B]">
                      {currentLang === 'ru' ? 'Основания соответствия:' : currentLang === 'en' ? 'Match Qualifications:' : 'Moslik mezonlari:'}
                    </p>
                    {reasons.map((r, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#2D4A3E]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-[#E4D9C4] flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleOpenApply(item)}
                    className="text-xs font-bold text-[#1F3D2B] hover:text-[#D9A441] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{currentLang === 'ru' ? 'Список документов' : currentLang === 'en' ? 'Required Docs' : 'Talab qilinadigan hujjatlar'}</span>
                  </button>

                  <Button
                    onClick={() => handleOpenApply(item)}
                    id={`apply-btn-${prog.id}`}
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    {currentLang === 'ru' ? 'Получить помощь' : currentLang === 'en' ? 'Apply Assistance' : 'Ariza berish ko\'magi'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Application Assistance & Required Docs Modal */}
      {applyModalOpen && selectedProgram && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#E4D9C4] shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF7F0] border border-[#E4D9C4] text-[#1F3D2B] text-xs font-bold mb-2">
                  <Landmark className="w-3.5 h-3.5 text-[#D9A441]" />
                  {currentLang === 'ru' ? selectedProgram.program.organization_ru : currentLang === 'en' ? selectedProgram.program.organization_en : selectedProgram.program.organization_uz}
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1F3D2B]">
                  {currentLang === 'ru' ? selectedProgram.program.title_ru : currentLang === 'en' ? selectedProgram.program.title_en : selectedProgram.program.title_uz}
                </h3>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {appliedSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-2xl font-bold text-[#1F3D2B]">
                  {currentLang === 'ru' ? 'Заявка успешно принята!' : currentLang === 'en' ? 'Assistance Request Submitted!' : 'Arizangiz qabul qilindi!'}
                </h4>
                <p className="text-xs sm:text-sm text-[#6C7C6F] max-w-md mx-auto">
                  {currentLang === 'ru'
                    ? 'Агроном-консультант Ekinix свяжется с вами в течение 24 часов для подготовки пакета документов и расчёта сметы.'
                    : currentLang === 'en'
                    ? 'An Ekinix agricultural consultant will contact you within 24 hours to help compile the documentation package.'
                    : "Ekinix agronom-mutaxassisi 24 soat ichida siz bilan bog'lanadi va loyiha-smeta hujjatlarini tayyorlashda to'liq ko'maklashadi."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Required Documents Checklist */}
                <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#E4D9C4]">
                  <h4 className="font-serif text-base font-bold text-[#1F3D2B] mb-3 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#D9A441]" />
                    {currentLang === 'ru' ? 'Необходимые документы:' : currentLang === 'en' ? 'Required Documentation Package:' : 'Talab qilinadigan hujjatlar ro\'yxati:'}
                  </h4>
                  <ul className="space-y-2.5">
                    {(currentLang === 'ru'
                      ? selectedProgram.program.required_documents_ru
                      : currentLang === 'en'
                      ? selectedProgram.program.required_documents_en
                      : selectedProgram.program.required_documents_uz
                    ).map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[#2D4A3E]">
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                        <span className="leading-snug">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Application Form */}
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <h4 className="font-serif text-base font-bold text-[#1F3D2B]">
                    {currentLang === 'ru' ? 'Контактные данные для консультации:' : currentLang === 'en' ? 'Contact Details for Filing Help:' : 'Bog\'lanish va ariza ma\'lumotlari:'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                        {currentLang === 'ru' ? 'ФИО заявителя' : currentLang === 'en' ? 'Full Name' : 'F.I.Sh.'}
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] bg-white text-xs text-[#1F3D2B] focus:ring-2 focus:ring-[#1F3D2B] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                        {currentLang === 'ru' ? 'Телефон' : currentLang === 'en' ? 'Phone Number' : 'Telefon raqam'}
                      </label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] bg-white text-xs text-[#1F3D2B] focus:ring-2 focus:ring-[#1F3D2B] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                      {currentLang === 'ru' ? 'Дополнительные вопросы / примечания' : currentLang === 'en' ? 'Notes / Questions' : 'Qo\'shimcha savollar yoki izohlar'}
                    </label>
                    <textarea
                      rows={3}
                      value={contactNotes}
                      onChange={(e) => setContactNotes(e.target.value)}
                      placeholder={
                        currentLang === 'ru'
                          ? 'Например: планируем установку капельного орошения на 10 га в Самаркандской области...'
                          : currentLang === 'en'
                          ? 'E.g. planning to install drip irrigation on 10 ha...'
                          : "Masalan: 10 gektar paxta maydoniga tomchilatib sug'orish uskunalarini o'rnatmoqchimiz..."
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D9C4] bg-white text-xs text-[#1F3D2B] focus:ring-2 focus:ring-[#1F3D2B] outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      className="flex-1 justify-center"
                      onClick={() => setApplyModalOpen(false)}
                      disabled={submitting}
                    >
                      {currentLang === 'ru' ? 'Отмена' : currentLang === 'en' ? 'Cancel' : 'Bekor qilish'}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="flex-1 justify-center"
                      disabled={submitting}
                    >
                      {submitting
                        ? currentLang === 'ru'
                          ? 'Отправка...'
                          : currentLang === 'en'
                          ? 'Submitting...'
                          : 'Yuborilmoqda...'
                        : currentLang === 'ru'
                        ? 'Отправить заявку'
                        : currentLang === 'en'
                        ? 'Submit Application'
                        : 'Arizani topshirish'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
