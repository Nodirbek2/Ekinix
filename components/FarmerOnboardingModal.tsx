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
    <div className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl relative space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title & Step Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              {t.stepCounter} {step} / 3
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-5 bg-emerald-800'
                      : s < step
                      ? 'w-2 bg-emerald-600'
                      : 'w-2 bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900">
            {step === 1 && t.onboardingStep1Title}
            {step === 2 && t.onboardingStep2Title}
            {step === 3 && t.onboardingStep3Title}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {step === 1 && t.onboardingStep1Sub}
            {step === 2 && t.onboardingStep2Sub}
            {step === 3 && t.onboardingStep3Sub}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Farmer Name & Region */}
        {step === 1 && (
          <div className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.fullName} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Masalan: Karimjon Rahimov"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t.region} *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-9 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800"
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
          <div className="space-y-2.5 pt-1">
            {/* Smallholder Card */}
            <button
              type="button"
              onClick={() => setFarmType('smallholder')}
              className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                farmType === 'smallholder'
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-300 shadow-2xs'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-md shrink-0 ${
                farmType === 'smallholder' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
              }`}>
                <Sprout className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">
                    {t.farmTypeSmallholderTitle}
                  </h4>
                  {farmType === 'smallholder' && (
                    <Check className="w-4 h-4 text-emerald-700" />
                  )}
                </div>
                <p className={`text-[11px] mt-0.5 leading-relaxed ${
                  farmType === 'smallholder' ? 'text-emerald-800' : 'text-slate-500'
                }`}>
                  {t.farmTypeSmallholderDesc}
                </p>
              </div>
            </button>

            {/* Commercial Farm Card */}
            <button
              type="button"
              onClick={() => setFarmType('commercial')}
              className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer ${
                farmType === 'commercial'
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-300 shadow-2xs'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-md shrink-0 ${
                farmType === 'commercial' ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
              }`}>
                <Tractor className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold">
                    {t.farmTypeCommercialTitle}
                  </h4>
                  {farmType === 'commercial' && (
                    <Check className="w-4 h-4 text-emerald-700" />
                  )}
                </div>
                <p className={`text-[11px] mt-0.5 leading-relaxed ${
                  farmType === 'commercial' ? 'text-emerald-800' : 'text-slate-500'
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
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-0.5">
              {CROP_OPTIONS.map((crop) => {
                const isSelected = selectedCrops.includes(crop.id);
                const labelName = t[crop.nameKey as keyof typeof t] || crop.id;

                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => toggleCrop(crop.id)}
                    className={`p-2.5 rounded-lg text-left border font-medium text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-sm">{crop.icon}</span>
                      <span className="truncate">{labelName}</span>
                    </span>

                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic text-center">
              * Istalgan paytda profil sozlamalarida ekin turlarini o&apos;zgartirishingiz mumkin.
            </p>
          </div>
        )}

        {/* Modal Bottom Action Controls */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t.btnBack}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center gap-1.5 h-8 bg-[#164E35] hover:bg-[#0F3826] text-white font-medium text-xs px-4 rounded-lg transition-colors ml-auto cursor-pointer"
            >
              <span>{t.btnNext}</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-200" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-1.5 h-8 bg-[#164E35] hover:bg-[#0F3826] text-white font-medium text-xs px-4 rounded-lg transition-colors ml-auto disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-200" />
              <span>{saving ? 'Saqlanmoqda...' : t.btnFinish}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
