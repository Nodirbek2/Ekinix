'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { User, MapPin, Check, ChevronRight, ChevronLeft, Sprout, Tractor, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface FarmerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  initialProfile?: FarmerProfile | null;
  onProfileSaved: (profile: FarmerProfile) => void;
  userId?: string | null;
  userPhone?: string | null;
}

export const REGIONS_LIST = [
  "Toshkent viloyati",
  "Toshkent shahri",
  "Samarqand viloyati",
  "Farg'ona viloyati",
  "Buxoro viloyati",
  "Namangan viloyati",
  "Andijon viloyati",
  "Qashqadaryo viloyati",
  "Surxondaryo viloyati",
  "Xorazm viloyati",
  "Navoiy viloyati",
  "Sirdaryo viloyati",
  "Qoraqalpog'iston Respublikasi"
];

export const CROP_OPTIONS = [
  { id: 'cotton', nameKey: 'cropCotton', icon: '🌿' },
  { id: 'wheat', nameKey: 'cropWheat', icon: '🌾' },
  { id: 'apple', nameKey: 'cropApple', icon: '🍎' },
  { id: 'grape', nameKey: 'cropGrape', icon: '🍇' },
  { id: 'pomegranate', nameKey: 'cropPomegranate', icon: '🔴' },
  { id: 'tomato', nameKey: 'cropTomato', icon: '🍅' },
  { id: 'other', nameKey: 'cropOther', icon: '🌱' },
] as const;

export const FarmerOnboardingModal: React.FC<FarmerOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  initialProfile,
  onProfileSaved,
  userId,
  userPhone,
}) => {
  const t = translations[currentLang];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState(() => initialProfile?.full_name || '');
  const [region, setRegion] = useState(() => initialProfile?.region || REGIONS_LIST[0]);
  const [farmType, setFarmType] = useState<'smallholder' | 'commercial'>(
    () => initialProfile?.farm_type || 'smallholder'
  );
  const [selectedCrops, setSelectedCrops] = useState<string[]>(
    () => initialProfile?.primary_crops || ['cotton', 'wheat']
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCrop = (cropId: string) => {
    if (selectedCrops.includes(cropId)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter(c => c !== cropId));
      }
    } else {
      setSelectedCrops([...selectedCrops, cropId]);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && !fullName.trim()) {
      setErrorMsg(currentLang === 'uz' ? "Iltimos, ismingizni kiriting" : "Пожалуйста, введите ваше имя");
      return;
    }
    setErrorMsg(null);
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    setErrorMsg(null);

    const profileData: FarmerProfile = {
      id: initialProfile?.id || (userId ? `farmer_${userId}` : `demo_${Date.now()}`),
      user_id: userId || undefined,
      full_name: fullName.trim() || 'Dehqon',
      phone: userPhone || initialProfile?.phone || '+998 90 123 45 67',
      region: region,
      farm_type: farmType,
      primary_crops: selectedCrops,
    };

    try {
      if (isSupabaseConfigured && supabase && userId) {
        // Upsert into Supabase farmers table
        const { error } = await supabase.from('farmers').upsert(
          {
            user_id: userId,
            full_name: profileData.full_name,
            phone: profileData.phone,
            region: profileData.region,
            farm_type: profileData.farm_type,
            primary_crops: profileData.primary_crops,
          },
          { onConflict: 'user_id' }
        );

        if (error) {
          console.warn("Supabase insert warning:", error);
        }
      }

      // Store in localStorage for instant offline/offline fallback
      localStorage.setItem('ekinix_farmer_profile', JSON.stringify(profileData));
      onProfileSaved(profileData);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      // Fallback save anyway so user is never blocked
      localStorage.setItem('ekinix_farmer_profile', JSON.stringify(profileData));
      onProfileSaved(profileData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-[#1F3D2B] shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#6C7C6F] hover:text-[#1F3D2B] rounded-full hover:bg-[#F0E8D8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title & Step Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider bg-[#F0E8D8] text-[#1F3D2B] px-3 py-1 rounded-full border border-[#E4D9C4]">
              {t.stepCounter} {step} / 3
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-6 bg-[#D9A441]'
                      : s < step
                      ? 'w-2 bg-[#1F3D2B]'
                      : 'w-2 bg-[#E4D9C4]'
                  }`}
                />
              ))}
            </div>
          </div>

          <h3 className="font-serif text-2xl font-bold text-[#1F3D2B]">
            {step === 1 && t.onboardingStep1Title}
            {step === 2 && t.onboardingStep2Title}
            {step === 3 && t.onboardingStep3Title}
          </h3>
          <p className="text-xs text-[#6C7C6F] font-medium">
            {step === 1 && t.onboardingStep1Sub}
            {step === 2 && t.onboardingStep2Sub}
            {step === 3 && t.onboardingStep3Sub}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Farmer Name & Region */}
        {step === 1 && (
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                {t.fullName} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#D9A441] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Masalan: Karimjon Rahimov"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-[#E4D9C4] rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
                {t.region} *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#D9A441] absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-white border border-[#E4D9C4] rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                >
                  {REGIONS_LIST.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Farm Type */}
        {step === 2 && (
          <div className="space-y-3 pt-1">
            {/* Smallholder Card */}
            <button
              type="button"
              onClick={() => setFarmType('smallholder')}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
                farmType === 'smallholder'
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] border-[#D9A441] shadow-md'
                  : 'bg-white text-[#1F3D2B] border-[#E4D9C4] hover:border-[#1F3D2B]/40'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${
                farmType === 'smallholder' ? 'bg-[#D9A441] text-[#1F3D2B]' : 'bg-[#F0E8D8] text-[#1F3D2B]'
              }`}>
                <Sprout className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-base font-bold">
                    {t.farmTypeSmallholderTitle}
                  </h4>
                  {farmType === 'smallholder' && (
                    <Check className="w-5 h-5 text-[#D9A441]" />
                  )}
                </div>
                <p className={`text-xs mt-1 leading-relaxed ${
                  farmType === 'smallholder' ? 'text-[#E4D9C4]' : 'text-[#6C7C6F]'
                }`}>
                  {t.farmTypeSmallholderDesc}
                </p>
              </div>
            </button>

            {/* Commercial Farm Card */}
            <button
              type="button"
              onClick={() => setFarmType('commercial')}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
                farmType === 'commercial'
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] border-[#D9A441] shadow-md'
                  : 'bg-white text-[#1F3D2B] border-[#E4D9C4] hover:border-[#1F3D2B]/40'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${
                farmType === 'commercial' ? 'bg-[#D9A441] text-[#1F3D2B]' : 'bg-[#F0E8D8] text-[#1F3D2B]'
              }`}>
                <Tractor className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-base font-bold">
                    {t.farmTypeCommercialTitle}
                  </h4>
                  {farmType === 'commercial' && (
                    <Check className="w-5 h-5 text-[#D9A441]" />
                  )}
                </div>
                <p className={`text-xs mt-1 leading-relaxed ${
                  farmType === 'commercial' ? 'text-[#E4D9C4]' : 'text-[#6C7C6F]'
                }`}>
                  {t.farmTypeCommercialDesc}
                </p>
              </div>
            </button>
          </div>
        )}

        {/* STEP 3: Primary Crops Grown */}
        {step === 3 && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
              {CROP_OPTIONS.map((crop) => {
                const isSelected = selectedCrops.includes(crop.id);
                const labelName = t[crop.nameKey as keyof typeof t] || crop.id;

                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => toggleCrop(crop.id)}
                    className={`p-3 rounded-xl text-left border-2 font-bold text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#1F3D2B] text-[#FAF7F0] border-[#D9A441]'
                        : 'bg-white text-[#1F3D2B] border-[#E4D9C4] hover:border-[#1F3D2B]/40'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{crop.icon}</span>
                      <span className="truncate">{labelName}</span>
                    </span>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#D9A441] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#6C7C6F] italic text-center">
              * Istalgan paytda profil sozlamalarida ekin turlarini o&apos;zgartirishingiz mumkin.
            </p>
          </div>
        )}

        {/* Modal Bottom Action Controls */}
        <div className="pt-4 border-t border-[#E4D9C4] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#1F3D2B] text-[#1F3D2B] font-bold text-xs hover:bg-[#F0E8D8] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.btnBack}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all ml-auto"
            >
              <span>{t.btnNext}</span>
              <ChevronRight className="w-4 h-4 text-[#D9A441]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-2 bg-[#D9A441] hover:bg-[#B8852B] text-[#1F3D2B] hover:text-[#FAF7F0] font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all ml-auto disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saqlanmoqda...' : t.btnFinish}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
