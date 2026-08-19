'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Bell,
  Sun,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Bot,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  Clock,
  Droplets,
  Layers,
  ThermometerSnowflake,
} from 'lucide-react';
import { Language, translations } from '@/lib/i18n';
import { FarmerProfile, FieldRecord } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

interface TelegramNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  userProfile?: FarmerProfile | null;
  fields?: FieldRecord[];
  onUpdateProfile?: (updated: Partial<FarmerProfile>) => void;
}

interface SimulatedChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  buttons?: string[];
}

export const TelegramNotificationModal: React.FC<TelegramNotificationModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  userProfile,
  fields = [],
  onUpdateProfile,
}) => {
  const t = translations[currentLang];

  // Active Tab inside modal: 'settings' | 'simulator' | 'guide'
  const [activeTab, setActiveTab] = useState<'settings' | 'simulator' | 'guide'>('settings');

  // Phone number state
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phone || '+998 90 123 45 67');
  const [isCopied, setIsCopied] = useState(false);

  // Notification Toggles
  const [notifyWeather, setNotifyWeather] = useState(userProfile?.telegram_notify_weather ?? true);
  const [notifyNdvi, setNotifyNdvi] = useState(userProfile?.telegram_notify_ndvi ?? true);
  const [notifyFrost, setNotifyFrost] = useState(userProfile?.telegram_notify_frost ?? true);
  const [notifyAdvisories, setNotifyAdvisories] = useState(userProfile?.telegram_notify_advisories ?? true);
  const [preferredTime, setPreferredTime] = useState(userProfile?.telegram_preferred_time || '07:00');

  // Test send state
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    simulated?: boolean;
    rawText?: string;
  } | null>(null);

  // Telegram Bot Info
  const [botUsername, setBotUsername] = useState(() => process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'ekinixbot');
  const [botName, setBotName] = useState('Ekinix Agro Yordamchi Bot');
  const [isBotConfigured, setIsBotConfigured] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string>('unconfigured');
  const [isSyncingWebhook, setIsSyncingWebhook] = useState(false);
  const [webhookSyncMsg, setWebhookSyncMsg] = useState<{ success: boolean; message: string } | null>(null);

  // Chat simulator state with default initial message
  const [simulatedChat, setSimulatedChat] = useState<SimulatedChatMessage[]>(() => [
    {
      id: 'msg_initial',
      sender: 'bot',
      text: `🌱 <b>Ekinix — O'zbekiston dehqonlari uchun aqlli yordamchi botiga xush kelibsiz!</b>\n\nAssalomu alaykum, <b>Hurmatli dehqon!</b> 👋\n\n🤖 <b>Ushbu bot sizga quyidagilarda yordam beradi:</b>\n• ⛅ <b>Ob-havo va Sug'orish (/weather):</b> Open-Meteo orqali 7 kunlik ob-havo va aniq suv me'yori (m³/ga)\n• 🌾 <b>Mening dalalarim (/fields):</b> Barcha ro'yxatdan o'tgan ekin maydonlaringiz va gektari\n• 🛰️ <b>Sun'iy yo'ldosh NDVI (/ndvi):</b> Sentinel-2 sun'iy yo'ldoshidan o'simlik salomatligi va tuproq namligi\n• 👨‍🌾 <b>Agronom xulosasi (/agronomist):</b> Mutaxassis agronomlarning o'g'itlash va himoya ko'rsatmalari\n• 🔔 <b>Bildirishnomalar (/notifications):</b> Har kuni ertalab 07:00 da avtomatik ob-havo va sovuq xavfidan ogohlantirish\n\n👇 <i>Kerakli buyruqni tanlang:</i>`,
      time: '07:00',
      buttons: [
        "⛅ Bugungi ob-havo & sug'orish",
        "🌾 Mening dalalarim",
        "🛰️ Sun'iy yo'ldosh NDVI",
        "👨‍🌾 Agronom xulosasi",
        "🔔 Bildirishnomalar",
        "📲 Telefon raqamni yuborish",
      ],
    },
  ]);
  const [userInput, setUserInput] = useState('');

  const fetchBotStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status', { cache: 'no-store' });
      const data = await res.json();
      if (data.botUsername) setBotUsername(data.botUsername);
      if (data.botName) setBotName(data.botName);
      if (data.isConfigured !== undefined) setIsBotConfigured(data.isConfigured);
      if (data.webhookStatus) setWebhookStatus(data.webhookStatus);
    } catch {}
  };

  const handleSyncWebhook = async () => {
    setIsSyncingWebhook(true);
    setWebhookSyncMsg(null);
    try {
      const res = await fetch('/api/telegram/setup-webhook', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setWebhookSyncMsg({
          success: true,
          message: data.message || "Webhook muvaffaqiyatli bog'landi!",
        });
        if (data.botUsername) setBotUsername(data.botUsername);
        if (data.botName) setBotName(data.botName);
        setIsBotConfigured(true);
        setWebhookStatus('active');
      } else {
        setWebhookSyncMsg({
          success: false,
          message: data.error || 'Webhook bog‘lanishida xatolik',
        });
      }
    } catch (err: any) {
      setWebhookSyncMsg({
        success: false,
        message: err.message || 'Tarmoq xatosi',
      });
    } finally {
      setIsSyncingWebhook(false);
      fetchBotStatus();
    }
  };

  // Fetch bot status on mount
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetch('/api/telegram/status', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.botUsername) setBotUsername(data.botUsername);
        if (data.botName) setBotName(data.botName);
        if (data.isConfigured !== undefined) setIsBotConfigured(data.isConfigured);
        if (data.webhookStatus) setWebhookStatus(data.webhookStatus);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  const botDeepLink = `https://t.me/${botUsername}?start=phone_${cleanPhone.replace('+', '')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(botDeepLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSavePreferences = () => {
    const updated: Partial<FarmerProfile> = {
      phone: phoneNumber,
      telegram_notifications_enabled: true,
      telegram_notify_weather: notifyWeather,
      telegram_notify_ndvi: notifyNdvi,
      telegram_notify_frost: notifyFrost,
      telegram_notify_advisories: notifyAdvisories,
      telegram_preferred_time: preferredTime,
    };

    if (onUpdateProfile) {
      onUpdateProfile(updated);
    }

    try {
      localStorage.setItem('ekinix_telegram_prefs', JSON.stringify(updated));
    } catch {}
  };

  const handleSendTestNotification = async (type: 'weather' | 'ndvi' | 'frost') => {
    setIsSendingTest(true);
    setTestResult(null);

    const primaryField = fields[0] || null;

    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerProfile: userProfile || {
            id: 'demo_farmer',
            full_name: 'Otabek Qodirov',
            phone: phoneNumber,
            region: "Farg'ona viloyati",
          },
          field: primaryField,
          notificationType: type,
          lang: currentLang,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setTestResult({
          success: true,
          simulated: data.simulated,
          rawText: data.formattedMessage,
          message:
            currentLang === 'ru'
              ? 'Уведомление успешно сформировано и передано в Telegram Bot!'
              : currentLang === 'en'
              ? 'Notification successfully compiled and dispatched to Telegram Bot!'
              : "Xabarnoma muvaffaqiyatli tayyorlandi va Telegram botga uzatildi!",
        });

        // Add to simulator chat view
        if (data.formattedMessage) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setSimulatedChat((prev) => [
            ...prev,
            {
              id: `test_msg_${prev.length + 1}`,
              sender: 'bot',
              text: data.formattedMessage,
              time: nowStr,
              buttons: ["⛅ Bugungi ob-havo & sug'orish", "🌾 Mening dalalarim", "🛰️ Sun'iy yo'ldosh NDVI"],
            },
          ]);
        }
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Xatolik yuz berdi',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Tarmoq xatosi',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSimulateUserCommand = async (command: string) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setSimulatedChat((prev) => [
      ...prev,
      {
        id: `user_msg_${prev.length + 1}`,
        sender: 'user',
        text: command,
        time: nowStr,
      },
    ]);
    setUserInput('');

    // Trigger webhook simulation
    try {
      const res = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            chat: { id: 123456789 },
            text: command,
            from: {
              first_name: userProfile?.full_name || 'Dehqon',
              username: 'farmer_uz',
            },
          },
        }),
      });

      const data = await res.json();
      // Generate bot reply in chat
      let replyText = '';
      let replyButtons: string[] = [
        "⛅ Bugungi ob-havo & sug'orish",
        "🌾 Mening dalalarim",
        "🛰️ Sun'iy yo'ldosh NDVI",
        "👨‍🌾 Agronom xulosasi",
        "🔔 Bildirishnomalar",
      ];

      const lowerCmd = command.toLowerCase();

      if (lowerCmd.includes('start') || lowerCmd === '/start') {
        replyText = `🌱 <b>Ekinix — O'zbekiston dehqonlari uchun aqlli yordamchi botiga xush kelibsiz!</b>\n\nAssalomu alaykum, <b>Hurmatli dehqon!</b> 👋\n\n🤖 <b>Ushbu bot sizga quyidagilarda yordam beradi:</b>\n• ⛅ <b>Ob-havo va Sug'orish (/weather):</b> Open-Meteo orqali 7 kunlik ob-havo va aniq suv me'yori (m³/ga)\n• 🌾 <b>Mening dalalarim (/fields):</b> Barcha ro'yxatdan o'tgan ekin maydonlaringiz va gektari\n• 🛰️ <b>Sun'iy yo'ldosh NDVI (/ndvi):</b> Sentinel-2 sun'iy yo'ldoshidan o'simlik salomatligi va tuproq namligi\n• 👨‍🌾 <b>Agronom xulosasi (/agronomist):</b> Mutaxassis agronomlarning o'g'itlash va himoya ko'rsatmalari\n• 🔔 <b>Bildirishnomalar (/notifications):</b> Har kuni ertalab 07:00 da avtomatik ob-havo va sovuq xavfidan ogohlantirish\n\n👇 <i>Kerakli buyruqni tanlang:</i>`;
      } else if (lowerCmd.includes('ob-havo') || lowerCmd === '/weather' || lowerCmd.includes('prognos')) {
        replyText = `☀️ <b>BUGUNGI OB-HAVO & SUG'ORISH (Jonli Open-Meteo)</b>\n\n📍 <b>Dala:</b> 1-Maydon (Paxta, 24.5 ga)\n🌡️ <b>Harorat:</b> +28°C (Kunduzi: +33° / Kechasi: +19°)\n💧 <b>Havo namligi:</b> 42% | <b>Shamol:</b> 12 km/soat\n🌧️ <b>Yomg'ir ehtimoli:</b> 10% (Yog'ingarchilik kutilmaydi)\n\n💧 <b>Sug'orish tavsiyasi:</b> Me'yorda — bugun kechki payt 32 m³/ga tomchilatib sug'orish tavsiya etiladi.`;
      } else if (lowerCmd.includes('dalalarim') || lowerCmd === '/fields' || lowerCmd.includes('dala')) {
        replyText = `🌾 <b>SIZNING EKIN MAYDONLARINGIZ:</b>\n\n1️⃣ <b>1-Maydon (Yulduz Paxtazor)</b>\n• Maydoni: <b>24.5 gektar</b> | Ekin: <b>Paxta (G'o'za)</b>\n• NDVI ko'rsatkichi: <b>0.74 (A'lo)</b> 🟢\n\n2️⃣ <b>2-Maydon (Bog' Shamoli)</b>\n• Maydoni: <b>12.0 gektar</b> | Ekin: <b>Olmazor</b>\n• NDVI ko'rsatkichi: <b>0.68 (Me'yorda)</b> 🟡\n\n💡 <i>Har bir maydon bo'yicha sun'iy yo'ldosh xaritasi Ekinix ilovasida mavjud.</i>`;
      } else if (lowerCmd.includes('ndvi') || lowerCmd === '/ndvi' || lowerCmd.includes('sun\'iy yo\'ldosh')) {
        replyText = `🛰️ <b>SENTINEL-2 SUN'IY YO'LDOSH TELEMETRIYASI</b>\n\n📍 <b>Dala:</b> 1-Maydon (Paxtazor, 24.5 ga)\n🌿 <b>O'rtacha NDVI:</b> <b>0.74</b> (Sog'lom barg qoplami)\n💧 <b>Tuproq namligi:</b> <b>58%</b>\n🟢 <b>Holati:</b> Faol vegetatsiya davri, kasallik yoki qurg'oqchilik xavfi aniqlanmadi.`;
      } else if (lowerCmd.includes('agronom') || lowerCmd === '/agronomist') {
        replyText = `👨‍🌾 <b>MUTAXASSIS AGRONOM KO'RSATMASI | Ekinix</b>\n\n👨‍🔬 <b>Agronom:</b> Rustam Karimov (Katta agronom, O'zQXI)\n📅 <b>Sana:</b> ${new Date().toLocaleDateString('uz-UZ')}\n\n📝 <b>Tavsiya:</b> <i>"Hozirgi issiq havoda g'o'za shonalash davrida fosforli va kaliyli ozuqalarni tomchilatib berish samaradorlikni 20% ga oshiradi. Kunduzgi jaziramada sug'ormang, faqat soat 19:00 dan keyin sug'orishni amalga oshiring."</i>\n\n📞 <b>Bog'lanish:</b> +998 97 123-45-67`;
      } else if (
        lowerCmd.includes('bildirishnoma') ||
        lowerCmd === '/notifications' ||
        lowerCmd.includes('yoqish') ||
        lowerCmd.includes("o'chirish") ||
        lowerCmd.includes('ochirish')
      ) {
        if (lowerCmd.includes("o'chirish") || lowerCmd.includes('ochirish')) {
          setNotifyWeather(false);
          replyText = `🔕 <b>Bildirishnomalar muvaffaqiyatli o'chirildi!</b>\n\nEndi avtomatik xabarlar yuborilmaydi. Qayta yoqish uchun quyidagi tugmani bosing:`;
          replyButtons = ["🔔 Bildirishnomalarni yoqish (07:00)", "⛅ Bugungi ob-havo & sug'orish", "🌾 Mening dalalarim"];
        } else if (lowerCmd.includes('yoqish')) {
          setNotifyWeather(true);
          replyText = `🔔 <b>Bildirishnomalar yoqildi!</b>\n\nHar kuni ertalab soat <b>07:00 da</b> ob-havo, ekin sug'orish me'yori va sovuq xavfi ogohlantirishlari Telegramingizga yetkaziladi.`;
          replyButtons = ["🔕 Bildirishnomalarni o'chirish", "⛅ Bugungi ob-havo & sug'orish", "🌾 Mening dalalarim"];
        } else {
          replyText = `🔔 <b>EKINIX BILDIRISHNOMALAR MARKAZI</b>\n\n📊 <b>Joriy holat:</b>\n• Kunlik ob-havo va sug'orish: 🟢 <b>Yoqilgan (07:00)</b>\n• Sovuq urish xavfi ogohlantirishi: 🟢 <b>Faol</b>\n• Sentinel-2 NDVI o'zgarishi: 🟢 <b>Faol</b>\n\nKerakli holatni o'zgartirish uchun pastdagi tugmani bosing:`;
          replyButtons = ["🔕 Bildirishnomalarni o'chirish", "🔔 Bildirishnomalarni yoqish (07:00)", "⛅ Bugungi ob-havo & sug'orish"];
        }
      } else if (lowerCmd.includes('telefon') || lowerCmd.includes('998') || lowerCmd.includes('+998')) {
        replyText = `✅ <b>Raqamingiz muvaffaqiyatli bog'landi!</b>\n\nEndi har kuni soat <b>07:00 da</b> dalalaringiz uchun avtomatik ob-havo va ekin sug'orish tavsiyalari Telegramingizga yuboriladi.`;
      } else {
        replyText = `🌱 Ekinix tizimida buyrug'ingiz qabul qilindi. Menyudan kerakli bo'limni tanlang:`;
      }

      setSimulatedChat((prev) => [
        ...prev,
        {
          id: `bot_reply_${prev.length + 1}`,
          sender: 'bot',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          buttons: replyButtons,
        },
      ]);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F3D2B]/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#FAF7F0] rounded-3xl shadow-2xl border-2 border-[#E4D9C4] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1F3D2B] via-[#1B3626] to-[#122419] text-[#FAF7F0] p-5 sm:p-6 flex items-center justify-between border-b border-[#D9A441]/30">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0088cc] text-white flex items-center justify-center shadow-md shrink-0">
              <Send className="w-6 h-6 -translate-x-0.5 translate-y-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF7F0]">
                  Telegram Bot & Xabarnomalar
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0088cc]/30 text-[#0088cc] border border-[#0088cc]/40">
                  @{botUsername}
                </span>
              </div>
              <p className="text-xs text-[#D9A441] font-medium">
                {currentLang === 'ru'
                  ? 'Ежедневный прогноз погоды, полив и спутниковый NDVI прямо в Telegram'
                  : currentLang === 'en'
                  ? 'Daily weather briefing, smart irrigation & Sentinel NDVI directly on Telegram'
                  : "Kunlik ob-havo, aqlli sug'orish va sun'iy yo'ldosh NDVI xabarlari to'g'ridan-to'g'ri Telegramda"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-[#FAF7F0] hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#E4D9C4] bg-white px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#1F3D2B] text-[#1F3D2B]'
                : 'border-transparent text-[#6C7C6F] hover:text-[#1F3D2B]'
            }`}
          >
            <Bell className="w-4 h-4 text-[#D9A441]" />
            <span>
              {currentLang === 'ru' ? 'Настройки и подключение' : currentLang === 'en' ? 'Settings & Connection' : "Ulanish & Sozlamalar"}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'simulator'
                ? 'border-[#1F3D2B] text-[#1F3D2B]'
                : 'border-transparent text-[#6C7C6F] hover:text-[#1F3D2B]'
            }`}
          >
            <Bot className="w-4 h-4 text-[#0088cc]" />
            <span>
              {currentLang === 'ru' ? 'Симулятор бота (Тест)' : currentLang === 'en' ? 'Live Bot Simulator' : "Bot Sinov Simulyatori"}
            </span>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
              Jonli
            </span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-[#1F3D2B] text-[#1F3D2B]'
                : 'border-transparent text-[#6C7C6F] hover:text-[#1F3D2B]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#D9A441]" />
            <span>{currentLang === 'ru' ? 'Команды бота' : currentLang === 'en' ? 'Commands' : "Buyruqlar"}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {/* ========================================================================= */}
          {/* TAB 1: SETTINGS & DIRECT CONNECTION                                       */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Connection Status Banner */}
              <div className="bg-white rounded-2xl p-5 border border-[#E4D9C4] shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isBotConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-serif text-base font-bold text-[#1F3D2B]">
                        {isBotConfigured
                          ? botName
                          : currentLang === 'ru'
                          ? 'Telegram Bot (Режим тестирования)'
                          : currentLang === 'en'
                          ? 'Telegram Bot (Test Mode)'
                          : "Telegram Bot (Sinov rejimi)"}
                      </span>
                      <a
                        href={botDeepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] font-bold px-2.5 py-0.5 rounded-full border border-[#0088cc]/30 inline-flex items-center gap-1 transition-colors"
                      >
                        @{botUsername}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-[#6C7C6F]">
                      {currentLang === 'ru'
                        ? 'Привязанный номер телефона: '
                        : currentLang === 'en'
                        ? 'Linked phone number: '
                        : "Biriktirilgan telefon raqam: "}
                      <b className="text-[#1F3D2B]">{phoneNumber || '+998 90 123 45 67'}</b>
                      <span className="mx-2 text-[#D4C4A8]">•</span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Webhook:{' '}
                        {webhookStatus === 'active'
                          ? '🟢 Faol (Ulangan)'
                          : webhookStatus === 'pending'
                          ? '🟡 Kutilyapti'
                          : '🔵 Jonli aloqa'}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <a
                      href={botDeepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>{currentLang === 'ru' ? 'Открыть в Telegram' : currentLang === 'en' ? 'Open in Telegram' : "Telegramda ochish"}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    <button
                      onClick={handleCopyLink}
                      title="Havolani nusxalash"
                      className="p-2.5 bg-[#FAF7F0] hover:bg-[#F0E8D8] text-[#1F3D2B] border border-[#E4D9C4] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    <Button
                      onClick={handleSyncWebhook}
                      variant="secondary"
                      size="sm"
                      isLoading={isSyncingWebhook}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#1F3D2B]" />}
                      title="Webhookni qayta tekshirish va sinxronlash"
                    >
                      {currentLang === 'ru' ? 'Синхронизировать' : 'Sinxronlash'}
                    </Button>
                  </div>
                </div>

                {webhookSyncMsg && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                      webhookSyncMsg.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    {webhookSyncMsg.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{webhookSyncMsg.message}</span>
                  </div>
                )}
              </div>

              {/* 2-Step Simple Activation Instructions */}
              <div className="bg-[#FAF7F0] rounded-2xl p-5 border border-[#E4D9C4] space-y-3">
                <h4 className="font-serif text-sm font-bold text-[#1F3D2B] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#D9A441]" />
                  <span>
                    {currentLang === 'ru'
                      ? 'Как активировать бота за 30 секунд:'
                      : currentLang === 'en'
                      ? 'How to activate in 30 seconds:'
                      : "Botni 30 soniyada ulash tartibi:"}
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#5C6B5F]">
                  <div className="p-3 bg-white rounded-xl border border-[#E4D9C4] space-y-1">
                    <span className="w-5 h-5 rounded-full bg-[#1F3D2B] text-[#D9A441] font-bold text-[11px] flex items-center justify-center">
                      1
                    </span>
                    <p className="font-bold text-[#1F3D2B]">
                      {currentLang === 'ru' ? 'Перейдите в бота' : currentLang === 'en' ? 'Open the Bot' : "Botga kiring"}
                    </p>
                    <p>
                      {currentLang === 'ru'
                        ? 'Нажмите «Открыть в Telegram» выше или найдите @' + botUsername + ' в поиске.'
                        : currentLang === 'en'
                        ? 'Click Open in Telegram above or search @' + botUsername + ' in your app.'
                        : "Yuqoridagi «Telegramda ochish» tugmasini bosing yoki qidiruvdan @" + botUsername + " ni toping."}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#E4D9C4] space-y-1">
                    <span className="w-5 h-5 rounded-full bg-[#1F3D2B] text-[#D9A441] font-bold text-[11px] flex items-center justify-center">
                      2
                    </span>
                    <p className="font-bold text-[#1F3D2B]">
                      {currentLang === 'ru' ? 'Отправьте номер' : currentLang === 'en' ? 'Share phone number' : "Raqamingizni yuboring"}
                    </p>
                    <p>
                      {currentLang === 'ru'
                        ? 'В боте нажмите кнопку «📲 Отправить номер телефона». Бот автоматически найдет ваши поля.'
                        : currentLang === 'en'
                        ? 'Press «📲 Share Phone Number» button. The bot will automatically detect your fields.'
                        : "Botdagi «📲 Telefon raqamni yuborish» tugmasini bosing. Tizim profilingizdagi dalalarni avtomatik taniydi."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Triggers Configuration */}
              <div className="bg-white rounded-2xl p-5 border border-[#E4D9C4] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#1F3D2B] flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#D9A441]" />
                      <span>
                        {currentLang === 'ru'
                          ? 'Автоматические типы уведомлений'
                          : currentLang === 'en'
                          ? 'Automated Notification Types'
                          : "Avtomatik Xabarnoma Turlari"}
                      </span>
                    </h3>
                    <p className="text-xs text-[#6C7C6F]">
                      {currentLang === 'ru'
                        ? 'Выберите, какие агро-отчеты вы хотите получать ежедневно'
                        : currentLang === 'en'
                        ? 'Choose which automated field reports you wish to receive'
                        : "Telegram orqali qaysi agro-xabarlarni qabul qilishni belgilang"}
                    </p>
                  </div>

                  {/* Delivery time selector */}
                  <div className="flex items-center gap-2 bg-[#FAF7F0] px-3 py-1.5 rounded-xl border border-[#E4D9C4]">
                    <Clock className="w-3.5 h-3.5 text-[#1F3D2B]" />
                    <span className="text-xs font-bold text-[#1F3D2B]">Vaqt:</span>
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="bg-transparent text-xs font-bold text-[#1F3D2B] focus:outline-none cursor-pointer"
                    >
                      <option value="06:00">06:00 (Tongda)</option>
                      <option value="07:00">07:00 (Ertalab)</option>
                      <option value="08:00">08:00 (Kun boshida)</option>
                      <option value="19:00">19:00 (Kechki salqinda)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Trigger 1: Daily Weather & Irrigation */}
                  <label className="flex items-start justify-between p-3.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F5EFE6] transition-colors border border-[#E4D9C4] cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-[#1F3D2B]">
                          {currentLang === 'ru'
                            ? 'Ежедневный прогноз погоды и норма полива'
                            : currentLang === 'en'
                            ? 'Daily weather forecast & irrigation volume'
                            : "Kunlik ob-havo va aniq sug'orish me'yori"}
                        </p>
                        <p className="text-[11px] text-[#6C7C6F] mt-0.5">
                          {currentLang === 'ru'
                            ? 'Температура, влажность, вероятность дождя и объем воды (м³/га) для ваших полей'
                            : currentLang === 'en'
                            ? 'Temperature, rain probability, evapotranspiration & exact m³/ha water need'
                            : "Harorat, yomg'ir ehtimoli, tuproq namligi va har bir dala uchun tavsiya etilgan suv hajmi"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyWeather}
                      onChange={(e) => setNotifyWeather(e.target.checked)}
                      className="w-5 h-5 accent-[#1F3D2B] rounded mt-1 cursor-pointer shrink-0"
                    />
                  </label>

                  {/* Trigger 2: Sentinel-2 Satellite NDVI */}
                  <label className="flex items-start justify-between p-3.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F5EFE6] transition-colors border border-[#E4D9C4] cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-[#1F3D2B]">
                          {currentLang === 'ru'
                            ? 'Спутниковый NDVI индекс и карта стресса'
                            : currentLang === 'en'
                            ? 'Sentinel-2 NDVI vegetation health updates'
                            : "Sentinel-2 sun'iy yo'ldosh NDVI xulosasi"}
                        </p>
                        <p className="text-[11px] text-[#6C7C6F] mt-0.5">
                          {currentLang === 'ru'
                            ? 'Спутниковый мониторинг Sentinel-2 каждые 3-5 дней при обновлении снимков'
                            : currentLang === 'en'
                            ? 'Canopy biomass, health index and stress alerts every 3-5 days'
                            : "Ekin biomassasi, barg indeksi va stress o'choqlari bo'yicha sun'iy yo'ldosh yangilanishi"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyNdvi}
                      onChange={(e) => setNotifyNdvi(e.target.checked)}
                      className="w-5 h-5 accent-[#1F3D2B] rounded mt-1 cursor-pointer shrink-0"
                    />
                  </label>

                  {/* Trigger 3: Frost & Extreme Weather Warning */}
                  <label className="flex items-start justify-between p-3.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F5EFE6] transition-colors border border-[#E4D9C4] cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-800 shrink-0 mt-0.5">
                        <ThermometerSnowflake className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-[#1F3D2B]">
                          {currentLang === 'ru'
                            ? 'Экстренные предупреждения (Заморозки / Жара)'
                            : currentLang === 'en'
                            ? 'Emergency alerts (Frost / Heat wave / Pests)'
                            : "Favqulodda sovuq urish va anomal issiqlik ogohlantirishlari"}
                        </p>
                        <p className="text-[11px] text-[#6C7C6F] mt-0.5">
                          {currentLang === 'ru'
                            ? 'Срочные алерты о ночных заморозках или температуре выше +39°C'
                            : currentLang === 'en'
                            ? 'Immediate emergency triggers for sub-zero temperatures or +39°C heat shock'
                            : "Kechasi 0°C dan past sovuq yoki kunduzi 39°C+ jazirama bo'yicha tezkor signal"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyFrost}
                      onChange={(e) => setNotifyFrost(e.target.checked)}
                      className="w-5 h-5 accent-[#1F3D2B] rounded mt-1 cursor-pointer shrink-0"
                    />
                  </label>

                  {/* Trigger 4: Agronomist Advisory */}
                  <label className="flex items-start justify-between p-3.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F5EFE6] transition-colors border border-[#E4D9C4] cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-900 shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4 text-[#D9A441]" />
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-[#1F3D2B]">
                          {currentLang === 'ru'
                            ? 'Предписания и рекомендации агронома'
                            : currentLang === 'en'
                            ? 'Field Agronomist Action Orders'
                            : "Biriktirilgan agronom ko'rsatmalari va retseptlari"}
                        </p>
                        <p className="text-[11px] text-[#6C7C6F] mt-0.5">
                          {currentLang === 'ru'
                            ? 'Уведомление при получении нового рецепта подкормки или защиты растений'
                            : currentLang === 'en'
                            ? 'Instant alerts when certified agronomist issues fertilizer / pest recipe'
                            : "Mutaxassis agronom o'g'itlash yoki himoya bo'yicha ko'rsatma berganda yuboriladi"}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyAdvisories}
                      onChange={(e) => setNotifyAdvisories(e.target.checked)}
                      className="w-5 h-5 accent-[#1F3D2B] rounded mt-1 cursor-pointer shrink-0"
                    />
                  </label>
                </div>
              </div>

              {/* Instant Test Triggers */}
              <div className="bg-white rounded-2xl p-5 border border-[#E4D9C4] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-sm font-bold text-[#1F3D2B] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D9A441]" />
                    <span>
                      {currentLang === 'ru' ? 'Отправить тестовое уведомление прямо сейчас' : currentLang === 'en' ? 'Trigger Live Test Message' : "Test xabarni darhol jo'natib ko'rish"}
                    </span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <Button
                    onClick={() => handleSendTestNotification('weather')}
                    variant="secondary"
                    size="sm"
                    isLoading={isSendingTest}
                    leftIcon={<Sun className="w-3.5 h-3.5 text-amber-600" />}
                  >
                    {currentLang === 'ru' ? '☀️ Сводка погоды' : currentLang === 'en' ? '☀️ Weather report' : "☀️ Ob-havo xabari"}
                  </Button>

                  <Button
                    onClick={() => handleSendTestNotification('ndvi')}
                    variant="secondary"
                    size="sm"
                    isLoading={isSendingTest}
                    leftIcon={<Layers className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    {currentLang === 'ru' ? '🛰️ NDVI снимок' : currentLang === 'en' ? '🛰️ Satellite NDVI' : "🛰️ NDVI tahlili"}
                  </Button>

                  <Button
                    onClick={() => handleSendTestNotification('frost')}
                    variant="secondary"
                    size="sm"
                    isLoading={isSendingTest}
                    leftIcon={<ThermometerSnowflake className="w-3.5 h-3.5 text-blue-600" />}
                  >
                    {currentLang === 'ru' ? '❄️ Заморозки' : currentLang === 'en' ? '❄️ Frost warning' : "❄️ Sovuq xavfi"}
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                      testResult.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testResult.message}</p>
                      {testResult.simulated && (
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          ℹ️ {currentLang === 'ru' ? 'Режим симуляции активен (токен бота не обязателен для локального тестирования).' : 'Simulyatsiya rejimi faol — xabar matnini «Bot Sinov Simulyatori» oynasida ko‘rishingiz mumkin.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LIVE TELEGRAM BOT CHAT SIMULATOR                                   */}
          {/* ========================================================================= */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="bg-[#1F3D2B] text-white p-3.5 rounded-2xl border border-[#2D543C] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#0088cc] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm">Ekinix Agro Yordamchi</span>
                      <span className="text-[9px] bg-[#D9A441] text-[#1F3D2B] font-black px-1.5 py-0.2 rounded">
                        BOT
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold">online • @{botUsername}</span>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    setSimulatedChat([
                      {
                        id: 'reset',
                        sender: 'bot',
                        text: `🌱 <b>Ekinix Agro Bot yangilandi!</b>\nMenyudan buyruqni tanlang:`,
                        time: '07:00',
                        buttons: ["⛅ Bugungi ob-havo & sug'orish", "🌾 Mening dalalarim", "🛰️ Sun'iy yo'ldosh NDVI"],
                      },
                    ])
                  }
                  variant="dark-ghost"
                  size="xs"
                  leftIcon={<RotateCcw className="w-3 h-3" />}
                >
                  Tozalash
                </Button>
              </div>

              {/* Smartphone Chat Window Frame */}
              <div className="bg-[#EAE1D3] rounded-2xl p-3 sm:p-4 min-h-[340px] max-h-[420px] overflow-y-auto space-y-3 custom-scrollbar border border-[#D4C4A8]">
                {simulatedChat.map((msg) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                      <div
                        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                          isBot
                            ? 'bg-white text-[#1F3D2B] rounded-tl-xs border border-[#E4D9C4]'
                            : 'bg-[#1F3D2B] text-white rounded-tr-xs'
                        }`}
                      >
                        <div
                          className="prose prose-xs max-w-none text-[11.5px] leading-normal"
                          dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
                        />
                        <div
                          className={`text-[9px] mt-1 text-right font-medium ${
                            isBot ? 'text-[#6C7C6F]' : 'text-[#D9A441]'
                          }`}
                        >
                          {msg.time}
                        </div>
                      </div>

                      {/* Bot Interactive Quick Reply Buttons */}
                      {isBot && msg.buttons && msg.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                          {msg.buttons.map((btnText, bIdx) => (
                            <button
                              key={bIdx}
                              onClick={() => handleSimulateUserCommand(btnText)}
                              className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-[#1F3D2B] border border-[#D4C4A8] text-[11px] font-bold shadow-xs hover:border-[#1F3D2B] transition-all cursor-pointer"
                            >
                              {btnText}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quick Command Action Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                <span className="text-[11px] font-bold text-[#6C7C6F] shrink-0 mr-1">Tezkor:</span>
                <button
                  onClick={() => handleSimulateUserCommand('/start')}
                  className="px-2.5 py-1 rounded-full bg-[#FAF7F0] hover:bg-[#1F3D2B] hover:text-white border border-[#D4C4A8] text-[11px] font-bold text-[#1F3D2B] shrink-0 transition-colors cursor-pointer"
                >
                  🚀 /start
                </button>
                <button
                  onClick={() => handleSimulateUserCommand('/weather')}
                  className="px-2.5 py-1 rounded-full bg-[#FAF7F0] hover:bg-[#1F3D2B] hover:text-white border border-[#D4C4A8] text-[11px] font-bold text-[#1F3D2B] shrink-0 transition-colors cursor-pointer"
                >
                  ⛅ /weather
                </button>
                <button
                  onClick={() => handleSimulateUserCommand('/fields')}
                  className="px-2.5 py-1 rounded-full bg-[#FAF7F0] hover:bg-[#1F3D2B] hover:text-white border border-[#D4C4A8] text-[11px] font-bold text-[#1F3D2B] shrink-0 transition-colors cursor-pointer"
                >
                  🌾 /fields
                </button>
                <button
                  onClick={() => handleSimulateUserCommand('/ndvi')}
                  className="px-2.5 py-1 rounded-full bg-[#FAF7F0] hover:bg-[#1F3D2B] hover:text-white border border-[#D4C4A8] text-[11px] font-bold text-[#1F3D2B] shrink-0 transition-colors cursor-pointer"
                >
                  🛰️ /ndvi
                </button>
                <button
                  onClick={() => handleSimulateUserCommand('/agronomist')}
                  className="px-2.5 py-1 rounded-full bg-[#FAF7F0] hover:bg-[#1F3D2B] hover:text-white border border-[#D4C4A8] text-[11px] font-bold text-[#1F3D2B] shrink-0 transition-colors cursor-pointer"
                >
                  👨‍🌾 /agronomist
                </button>
                <button
                  onClick={() => handleSimulateUserCommand('/notifications')}
                  className="px-2.5 py-1 rounded-full bg-[#FAF7F0] hover:bg-[#1F3D2B] hover:text-white border border-[#D4C4A8] text-[11px] font-bold text-[#1F3D2B] shrink-0 transition-colors cursor-pointer"
                >
                  🔔 /notifications
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userInput.trim()) {
                      handleSimulateUserCommand(userInput.trim());
                    }
                  }}
                  placeholder="Xabar yoki buyruq yozing (masalan: /start, /weather, /notifications)..."
                  className="flex-1 px-4 py-2.5 bg-white border border-[#E4D9C4] rounded-xl text-xs sm:text-sm text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]/20"
                />
                <Button
                  onClick={() => {
                    if (userInput.trim()) handleSimulateUserCommand(userInput.trim());
                  }}
                  variant="primary"
                  size="sm"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Yuborish
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: COMMANDS & SHORTCODES REFERENCE                                    */}
          {/* ========================================================================= */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-[#E4D9C4] shadow-xs space-y-4">
                <h3 className="font-serif text-base font-bold text-[#1F3D2B]">
                  {currentLang === 'ru' ? 'Доступные команды в Telegram боте' : currentLang === 'en' ? 'Available Telegram Commands' : "Telegram Botdagi barcha buyruqlar"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E4D9C4] space-y-1">
                    <span className="font-mono font-bold text-[#1F3D2B] bg-white px-2 py-0.5 rounded border border-[#E4D9C4]">
                      /start
                    </span>
                    <p className="font-bold text-[#1F3D2B] mt-1">{"Botni ishga tushirish & menyu"}</p>
                    <p className="text-[#6C7C6F]">
                      {"Kutib olish xabari, bot imkoniyatlari va asosiy klaviatura tugmalari."}
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E4D9C4] space-y-1">
                    <span className="font-mono font-bold text-[#1F3D2B] bg-white px-2 py-0.5 rounded border border-[#E4D9C4]">
                      /weather
                    </span>
                    <p className="font-bold text-[#1F3D2B] mt-1">{"Ob-havo va sug'orish"}</p>
                    <p className="text-[#6C7C6F]">
                      {"Bugungi 7 kunlik Open-Meteo prognozi, shamol, yomg'ir va hisoblangan sug'orish me'yori (m³/ga)."}
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E4D9C4] space-y-1">
                    <span className="font-mono font-bold text-[#1F3D2B] bg-white px-2 py-0.5 rounded border border-[#E4D9C4]">
                      /fields
                    </span>
                    <p className="font-bold text-[#1F3D2B] mt-1">{"Mening dalalarim"}</p>
                    <p className="text-[#6C7C6F]">
                      {"Ro'yxatdan o'tgan barcha maydonlaringiz, ekin turlari va ularning umumiy maydoni."}
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E4D9C4] space-y-1">
                    <span className="font-mono font-bold text-[#1F3D2B] bg-white px-2 py-0.5 rounded border border-[#E4D9C4]">
                      /ndvi
                    </span>
                    <p className="font-bold text-[#1F3D2B] mt-1">{"Sun'iy yo'ldosh NDVI"}</p>
                    <p className="text-[#6C7C6F]">
                      {"Sentinel-2 sun'iy yo'ldoshidan ekin vegetatsiyasi va tuproq namligi indeksi."}
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E4D9C4] space-y-1">
                    <span className="font-mono font-bold text-[#1F3D2B] bg-white px-2 py-0.5 rounded border border-[#E4D9C4]">
                      /agronomist
                    </span>
                    <p className="font-bold text-[#1F3D2B] mt-1">{"Agronom xulosasi"}</p>
                    <p className="text-[#6C7C6F]">
                      {"Biriktirilgan sertifikatlangan agronomning eng oxirgi amaliy ko'rsatmasi va tavsiyalari."}
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF7F0] rounded-xl border border-[#E4D9C4] space-y-1">
                    <span className="font-mono font-bold text-[#1F3D2B] bg-white px-2 py-0.5 rounded border border-[#E4D9C4]">
                      /notifications
                    </span>
                    <p className="font-bold text-[#1F3D2B] mt-1">{"Bildirishnomalarni boshqarish"}</p>
                    <p className="text-[#6C7C6F]">
                      {"07:00 dagi ertalabki ob-havo hisoboti va sovuq xavfi ogohlantirishlarini yoqish/o'chirish."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-[#FAF7F0] px-5 py-4 border-t border-[#E4D9C4] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#6C7C6F]">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Open-Meteo & Sentinel-2 avtomatlashtirilgan</span>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onClose} variant="secondary" size="sm">
              {currentLang === 'ru' ? 'Закрыть' : currentLang === 'en' ? 'Close' : 'Yopish'}
            </Button>
            <Button
              onClick={() => {
                handleSavePreferences();
                onClose();
              }}
              variant="primary"
              size="sm"
              leftIcon={<Check className="w-4 h-4" />}
            >
              {currentLang === 'ru' ? 'Сохранить настройки' : currentLang === 'en' ? 'Save Settings' : "Saqlash"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
