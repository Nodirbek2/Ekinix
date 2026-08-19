'use client';

import React, { useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { User, Phone, Lock, MapPin, Database, CheckCircle, AlertCircle, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
  currentLang: Language;
  onAuthSuccess: (profile: Partial<FarmerProfile>, isNewUser: boolean) => void;
}

const REGIONS = [
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

const normalizePhoneToEmail = (input: string): string => {
  if (input.includes('@')) return input.trim().toLowerCase();
  const digits = input.replace(/\D/g, '');
  const nationalDigits = digits.length === 9 ? digits : digits.slice(-9);
  const standardPhone = `998${nationalDigits}`;
  return `${standardPhone}@ekinix.uz`;
};

const formatStandardUzbekPhone = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  const nationalDigits = digits.length === 9 ? digits : digits.slice(-9);
  return `+998${nationalDigits}`;
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  mode,
  onClose,
  onSwitchMode,
  currentLang,
  onAuthSuccess,
}) => {
  const t = translations[currentLang];

  const [fullName, setFullName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState(REGIONS[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const cleanInput = phoneOrEmail.trim();
    const digitsOnly = cleanInput.replace(/\D/g, '');

    // Mandatory phone number validation on registration
    if (mode === 'register') {
      if (digitsOnly.length < 9) {
        setLoading(false);
        setMessage({
          type: 'error',
          text: currentLang === 'uz'
            ? "Iltimos, haqiqiy telefon raqamingizni to'liq kiriting (masalan: +998 90 123 45 67)"
            : currentLang === 'ru'
            ? "Пожалуйста, введите корректный номер телефона (например: +998 90 123 45 67)"
            : "Please enter a valid phone number (e.g. +998 90 123 45 67)",
        });
        return;
      }
      if (!fullName.trim()) {
        setLoading(false);
        setMessage({
          type: 'error',
          text: currentLang === 'uz'
            ? "Iltimos, ism va familiyangizni kiriting"
            : currentLang === 'ru'
            ? "Пожалуйста, введите имя и фамилию"
            : "Please enter your full name",
        });
        return;
      }
    }

    const sanitizedEmail = normalizePhoneToEmail(cleanInput);
    const standardPhone = digitsOnly.length >= 9 ? formatStandardUzbekPhone(cleanInput) : cleanInput;

    try {
      if (isSupabaseConfigured && supabase) {
        if (mode === 'register') {
          const { data, error } = await supabase.auth.signUp({
            email: sanitizedEmail,
            password,
            options: {
              data: {
                full_name: fullName.trim(),
                phone: standardPhone,
                region,
              },
            },
          });

          if (error) throw error;

          const createdUserId = data.user?.id || `user_${Date.now()}`;
          const newProfile: Partial<FarmerProfile> = {
            id: `farmer_${createdUserId}`,
            user_id: createdUserId,
            full_name: fullName.trim(),
            phone: standardPhone,
            region: region,
            farm_type: 'smallholder',
            primary_crops: ['cotton', 'wheat'],
            telegram_notifications_enabled: true,
          };

          // Also insert/upsert into farmers table immediately
          try {
            await supabase.from('farmers').upsert({
              user_id: createdUserId,
              full_name: fullName.trim(),
              phone: standardPhone,
              region: region,
              farm_type: 'smallholder',
              primary_crops: ['cotton', 'wheat'],
              telegram_notifications_enabled: true,
            }, { onConflict: 'user_id' });
          } catch (dbErr) {
            console.warn('[Supabase Farmer Record Upsert Warning]', dbErr);
          }

          localStorage.setItem('ekinix_farmer_profile', JSON.stringify(newProfile));

          setMessage({
            type: 'success',
            text: currentLang === 'uz'
              ? `Ro'yxatdan o'tdingiz! Telegram bot orqali ${standardPhone} raqamingizni ulab, dalalaringizni boshqarishingiz mumkin.`
              : currentLang === 'ru'
              ? `Регистрация завершена! Вы можете подключить номер ${standardPhone} к Telegram-боту.`
              : `Registration complete! You can connect ${standardPhone} to the Telegram bot.`,
          });

          setTimeout(() => {
            onAuthSuccess(newProfile, true);
            onClose();
          }, 900);

        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: sanitizedEmail,
            password,
          });

          if (error) throw error;

          const loggedUserId = data.user?.id || `user_${Date.now()}`;
          const loggedProfile: Partial<FarmerProfile> = {
            id: `farmer_${loggedUserId}`,
            user_id: loggedUserId,
            full_name: data.user?.user_metadata?.full_name || fullName || 'Dehqon',
            phone: data.user?.user_metadata?.phone || standardPhone,
            region: data.user?.user_metadata?.region || region,
          };

          // Fetch from farmers table if exists
          try {
            const { data: dbFarmer } = await supabase
              .from('farmers')
              .select('*')
              .eq('user_id', loggedUserId)
              .maybeSingle();

            if (dbFarmer) {
              loggedProfile.full_name = dbFarmer.full_name;
              loggedProfile.phone = dbFarmer.phone;
              loggedProfile.region = dbFarmer.region;
              loggedProfile.telegram_chat_id = dbFarmer.telegram_chat_id;
            }
          } catch {}

          localStorage.setItem('ekinix_farmer_profile', JSON.stringify(loggedProfile));

          setMessage({
            type: 'success',
            text: currentLang === 'uz'
              ? "Tizimga muvaffaqiyatli kirdingiz!"
              : currentLang === 'ru'
              ? "Успешный вход в систему!"
              : "Signed in successfully!",
          });

          setTimeout(() => {
            onAuthSuccess(loggedProfile, false);
            onClose();
          }, 800);
        }
      } else {
        // Demo / Standalone Mode Simulation
        setTimeout(() => {
          const demoProfile: Partial<FarmerProfile> = {
            id: `farmer_demo_${Date.now()}`,
            user_id: `demo_${Date.now()}`,
            full_name: fullName.trim() || 'Nodirbek Baratov',
            phone: standardPhone || '+998 90 123 45 67',
            region: region,
            farm_type: 'smallholder',
            primary_crops: ['cotton', 'wheat'],
            telegram_notifications_enabled: true,
          };

          localStorage.setItem('ekinix_farmer_profile', JSON.stringify(demoProfile));

          setMessage({
            type: 'success',
            text: mode === 'register'
              ? (currentLang === 'uz'
                  ? `Xush kelibsiz, ${fullName || 'Dehqon'}! Telefoningiz (${standardPhone}) saqlandi.`
                  : `Добро пожаловать! Номер (${standardPhone}) сохранен.`)
              : (currentLang === 'uz'
                  ? "Tizimga muvaffaqiyatli kirdingiz!"
                  : "Успешный вход!"),
          });

          setLoading(false);

          setTimeout(() => {
            onAuthSuccess(demoProfile, mode === 'register');
            onClose();
          }, 600);
        }, 500);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMessage({
        type: 'error',
        text: errorMessage || "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-3xl max-w-md w-full p-6 sm:p-8 border-2 border-[#1F3D2B] shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#6C7C6F] hover:text-[#1F3D2B] rounded-full hover:bg-[#F0E8D8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <h3 className="font-serif text-2xl font-bold text-[#1F3D2B]">
            {mode === 'login' ? t.authLoginTitle : t.authRegisterTitle}
          </h3>
          
          {/* Supabase Connection Status Badge */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              isSupabaseConfigured 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              <Database className="w-3 h-3" />
              {isSupabaseConfigured ? t.supabaseConnected : t.supabaseNotConnected}
            </span>
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1">
                {t.fullName} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#D9A441] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Masalan: Nodirbek Baratov"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-[#E4D9C4] rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1">
              {t.phoneOrEmail} *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#D9A441] absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="+998 90 123 45 67"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                className="w-full bg-white border border-[#E4D9C4] rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1">
                {t.region} *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#D9A441] absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-white border border-[#E4D9C4] rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                >
                  {REGIONS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1">
              {t.password} *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#D9A441] absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-[#E4D9C4] rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-sm py-3.5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            {loading 
              ? 'Kutilmoqda...' 
              : mode === 'login' 
              ? t.authSubmitLogin 
              : t.authSubmitRegister}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="pt-2 text-center border-t border-[#E4D9C4]">
          <button
            onClick={() => onSwitchMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs font-bold text-[#1F3D2B] hover:text-[#D9A441] transition-colors"
          >
            {mode === 'login' ? t.noAccount : t.hasAccount}
          </button>
        </div>

      </div>
    </div>
  );
};
