'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import NextImage from 'next/image';
import { Language } from '@/lib/i18n';
import {
  FarmerProfile,
  MarketplaceListing,
  ChatMessage,
  ChatConversation,
  isSupabaseConfigured,
  supabase
} from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Phone,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Activity,
  ShoppingBag,
  MoreVertical,
  ArrowLeft,
  X,
  Plus,
  Clock,
  MapPin,
  Tag,
  Info,
  ChevronRight,
  Package
} from 'lucide-react';

interface ChatSectionProps {
  currentLang: Language;
  userProfile?: FarmerProfile | null;
  initialChatId?: string | null;
  initialListing?: MarketplaceListing | null;
  onViewListing?: (listing: MarketplaceListing) => void;
  onNavigateToMarketplace?: () => void;
}

// Initial realistic conversations data
const DEFAULT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-agr-1',
    type: 'agronomist',
    title: 'Dr. Anvar Qodirov (Katta agronom)',
    participant_id: 'agr-anvar',
    participant_name: 'Dr. Anvar Qodirov',
    participant_role: 'Katta agronom • Tuproq va NDVI tahlili',
    participant_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    participant_phone: '+998 90 345 67 89',
    participant_telegram: 'anvar_agronom',
    participant_online: true,
    last_message: "Maydondagi past NDVI hududiga 150 kg/ga superfosfat berishni tavsiya qilaman.",
    last_message_time: '10:42',
    unread_count: 1,
    messages: [
      {
        id: 'm1',
        conversation_id: 'conv-agr-1',
        sender_id: 'agr-anvar',
        sender_name: 'Dr. Anvar Qodirov',
        sender_role: 'agronomist',
        text: "Assalomu alaykum! G'o'za maydoningizdagi Sentinel-2 NDVI xaritasini ko'rib chiqdim. Janubiy qismida vegetatsiya indeksi 0.42 ga tushgan.",
        created_at: '10:30',
        is_read: true,
      },
      {
        id: 'm2',
        conversation_id: 'conv-agr-1',
        sender_id: 'me',
        sender_name: 'Siz',
        sender_role: 'farmer',
        text: "Va alaykum assalom, domla. O'sha qismida tuproq sho'rlanganroq edi. Sug'orish va oziqlantirish bo'yicha qanday chora ko'raylik?",
        created_at: '10:35',
        is_read: true,
      },
      {
        id: 'm3',
        conversation_id: 'conv-agr-1',
        sender_id: 'agr-anvar',
        sender_name: 'Dr. Anvar Qodirov',
        sender_role: 'agronomist',
        text: "Maydondagi past NDVI hududiga 150 kg/ga superfosfat berishni tavsiya qilaman. Keyingi sug'orishni esa 3 kun ichida 400 m³/ga me'yorda bajaring.",
        created_at: '10:42',
        is_read: false,
      },
    ],
  },
  {
    id: 'conv-market-1',
    type: 'marketplace',
    title: 'Farhod Aliyev (Buxoro Agro Export)',
    participant_id: 'buyer-farhod',
    participant_name: 'Farhod Aliyev',
    participant_role: 'Ulgurji xaridor • Buxoro Agro Export MChJ',
    participant_phone: '+998 93 555 12 34',
    participant_telegram: 'farhod_agro_export',
    participant_online: true,
    last_message: "45 tonna paxta partiyasining barchasini olmoqchimiz. Sertifikat bormi?",
    last_message_time: 'Kecha',
    unread_count: 0,
    listing_context: {
      id: 'list-1',
      crop_name: 'Paxta (G‘o‘za)',
      variety: 'Buxoro-102',
      farmer_name: 'Akmal Rahimov',
      category: 'paxta',
      total_quantity: 45,
      unit: 'tonna',
      price_uzs_per_unit: 9200,
      location_region: 'Buxoro viloyati, Vobkent',
      phone_contact: '+998 90 123 45 67',
      qualityGrade: 'Export',
      image_url: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=600&q=80',
    },
    messages: [
      {
        id: 'm20',
        conversation_id: 'conv-market-1',
        sender_id: 'buyer-farhod',
        sender_name: 'Farhod Aliyev',
        sender_role: 'buyer',
        text: "Assalomu alaykum! Ekinix bozoridagi Buxoro-102 navli paxta e'loningizni ko'rdim.",
        created_at: 'Kecha 16:15',
        is_read: true,
      },
      {
        id: 'm21',
        conversation_id: 'conv-market-1',
        sender_id: 'buyer-farhod',
        sender_name: 'Farhod Aliyev',
        sender_role: 'buyer',
        text: "45 tonna paxta partiyasining barchasini olmoqchimiz. Sertifikat bormi?",
        created_at: 'Kecha 16:16',
        is_read: true,
      },
      {
        id: 'm22',
        conversation_id: 'conv-market-1',
        sender_id: 'me',
        sender_name: 'Siz',
        sender_role: 'farmer',
        text: "Va alaykum assalom! Ha, 1-navli eksport sertifikati va tolalilik ko'rsatkichlari rasmiylashtirilgan. Vobkent omborida saqlanmoqda.",
        created_at: 'Kecha 16:30',
        is_read: true,
      },
    ],
  },
  {
    id: 'conv-market-2',
    type: 'marketplace',
    title: 'Rustam Rahmonov (Samarqand Savdo)',
    participant_id: 'buyer-rustam',
    participant_name: 'Rustam Rahmonov',
    participant_role: 'Meva-sabzavot treyderi',
    participant_phone: '+998 97 789 01 23',
    participant_online: false,
    last_message: "Gilos partiyasini qachondan yuklash mumkin?",
    last_message_time: '18-avg',
    unread_count: 0,
    listing_context: {
      id: 'list-3',
      crop_name: 'Gilos',
      variety: 'Valeriy Chkalov',
      farmer_name: 'Dilshod Soliyev',
      category: 'meva',
      total_quantity: 12,
      unit: 'tonna',
      price_uzs_per_unit: 24000,
      location_region: 'Farg‘ona, Quva',
      phone_contact: '+998 93 345 67 89',
      qualityGrade: 'Export',
      image_url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80',
    },
    messages: [
      {
        id: 'm30',
        conversation_id: 'conv-market-2',
        sender_id: 'buyer-rustam',
        sender_name: 'Rustam Rahmonov',
        sender_role: 'buyer',
        text: "Assalomu alaykum, Quvadagi Valeriy Chkalov gilosi bo'yicha yozmoqdaman. Qutilarga qadoqlanganmi?",
        created_at: '18-avg 11:20',
        is_read: true,
      },
      {
        id: 'm31',
        conversation_id: 'conv-market-2',
        sender_id: 'buyer-rustam',
        sender_name: 'Rustam Rahmonov',
        sender_role: 'buyer',
        text: "Gilos partiyasini qachondan yuklash mumkin?",
        created_at: '18-avg 11:22',
        is_read: true,
      },
    ],
  },
  {
    id: 'conv-ai-bot',
    type: 'agronomist',
    title: 'Ekinix AI Agronom Bot',
    participant_id: 'bot-ai',
    participant_name: 'Ekinix AI Agronom',
    participant_role: 'Sun\'iy intellekt agro-yordamchi (24/7)',
    participant_avatar: '',
    participant_online: true,
    last_message: "Ekinlaringiz parvarishi bo'yicha savolingiz bormi? Yozishingiz mumkin.",
    last_message_time: '12-avg',
    unread_count: 0,
    messages: [
      {
        id: 'm40',
        conversation_id: 'conv-ai-bot',
        sender_id: 'bot-ai',
        sender_name: 'Ekinix AI',
        sender_role: 'agronomist',
        text: "Assalomu alaykum! Men Ekinix platformasining sun'iy intellekt agronom yordamchisiman. Maydonlaringizdagi NDVI, sug'orish rejasi yoki kasalliklar haqida so'rashingiz mumkin.",
        created_at: '12-avg 09:00',
        is_read: true,
      },
    ],
  },
];

export const ChatSection: React.FC<ChatSectionProps> = ({
  currentLang,
  userProfile,
  initialChatId,
  initialListing,
  onViewListing,
  onNavigateToMarketplace,
}) => {
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ekinix_chat_conversations');
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_CONVERSATIONS;
  });
  const [activeChatId, setActiveChatId] = useState<string>(DEFAULT_CONVERSATIONS[0].id);
  const [filterType, setFilterType] = useState<'all' | 'agronomist' | 'marketplace'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [mobileShowThread, setMobileShowThread] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageCounterRef = useRef<number>(1000);

  // Save chats to localStorage on changes
  const saveConversations = (updated: ChatConversation[]) => {
    setConversations(updated);
    try {
      localStorage.setItem('ekinix_chat_conversations', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // If initialListing is provided, create or select conversation for this listing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initialListing) {
        setConversations((prev) => {
          const existing = prev.find(
            (c) => c.listing_context?.id === initialListing.id || c.participant_phone === initialListing.phone_contact
          );

          if (existing) {
            setActiveChatId(existing.id);
            setMobileShowThread(true);
            return prev;
          } else {
            // Create new conversation
            const msgId = `m-init-${Math.random().toString(36).substring(2, 9)}`;
            const newConv: ChatConversation = {
              id: `conv-market-${initialListing.id}`,
              type: 'marketplace',
              title: `${initialListing.farmer_name} (${initialListing.crop_name})`,
              participant_id: initialListing.farmer_id || initialListing.user_id || `farmer-${Math.random().toString(36).substring(2, 7)}`,
              participant_name: initialListing.farmer_name,
              participant_role: `Sotuvchi • ${initialListing.location_region}`,
              participant_phone: initialListing.phone_contact,
              participant_telegram: initialListing.telegram_contact,
              participant_online: true,
              last_message: `E'lon bo'yicha suhbat boshlandi: ${initialListing.crop_name}`,
              last_message_time: 'Hozir',
              unread_count: 0,
              listing_context: initialListing,
              messages: [
                {
                  id: msgId,
                  conversation_id: `conv-market-${initialListing.id}`,
                  sender_id: 'system',
                  sender_name: 'Tizim',
                  sender_role: 'system',
                  text: `Siz "${initialListing.crop_name} (${initialListing.total_quantity} ${initialListing.unit})" e'loni bo'yicha sotuvchi ${initialListing.farmer_name} bilan bog'landingiz.`,
                  created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  is_read: true,
                },
              ],
            };

            const updated = [newConv, ...prev];
            try {
              localStorage.setItem('ekinix_chat_conversations', JSON.stringify(updated));
            } catch {
              // ignore
            }
            setActiveChatId(newConv.id);
            setMobileShowThread(true);
            return updated;
          }
        });
      } else if (initialChatId) {
        setConversations((prev) => {
          const found = prev.find((c) => c.id === initialChatId);
          if (found) {
            setActiveChatId(found.id);
            setMobileShowThread(true);
          }
          return prev;
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [initialListing, initialChatId]);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, conversations]);

  // Active selected conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeChatId) || conversations[0];
  }, [conversations, activeChatId]);

  // Filtered conversations list
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Type filter
      if (filterType !== 'all' && c.type !== filterType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.participant_name.toLowerCase().includes(q);
        const matchesRole = c.participant_role.toLowerCase().includes(q);
        const matchesListing = c.listing_context?.crop_name.toLowerCase().includes(q);
        const matchesLast = (c.last_message || '').toLowerCase().includes(q);
        return matchesName || matchesRole || matchesListing || matchesLast;
      }
      return true;
    });
  }, [conversations, filterType, searchQuery]);

  // Send message
  const handleSendMessage = (textToSend?: string) => {
    const content = textToSend || inputText.trim();
    if (!content || !activeConversation) return;

    messageCounterRef.current += 1;
    const generatedMsgId = `msg-${messageCounterRef.current}`;
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: generatedMsgId,
      conversation_id: activeConversation.id,
      sender_id: 'me',
      sender_name: userProfile?.full_name || 'Siz',
      sender_role: 'farmer',
      text: content,
      created_at: formattedTime,
      is_read: true,
    };

    const updated = conversations.map((c) => {
      if (c.id === activeConversation.id) {
        return {
          ...c,
          last_message: content,
          last_message_time: newMsg.created_at,
          messages: [...c.messages, newMsg],
        };
      }
      return c;
    });

    saveConversations(updated);
    setInputText('');

    // Simulate realistic AI / Agronomist response after 1.5 seconds if talking to AI or Doctor
    if (activeConversation.type === 'agronomist') {
      setTimeout(() => {
        let replyText = "Xabaringiz qabul qilindi. Maydoningizning eng so'nggi NDVI ma'lumotlarini tekshirib, batafsil tavsiya tayyorlamoqdaman.";
        if (content.toLowerCase().includes("o'g'it") || content.toLowerCase().includes("oziqlantirish")) {
          replyText = "Tuproq tahliliga ko'ra azotli o'g'itlarni me'yordan ortiq bermaslik lozim. Hozirgi vegetatsiya bosqichida fosfor-kaliyli oziqlantirish samaraliroq.";
        } else if (content.toLowerCase().includes("namlik") || content.toLowerCase().includes("suv")) {
          replyText = "Open-Meteo prognozida yaqin 48 soatda yog'ingarchilik kutilmayapti. Tuproq qatlamlaridagi namlik 55% dan tushmasligi uchun navbatdagi sug'orishni kechiktirmang.";
        } else if (content.toLowerCase().includes("narx") || content.toLowerCase().includes("kelish")) {
          replyText = "Bozor narxlari bo'yicha Ekinix Bozor tahlilini ko'rib chiqishingiz mumkin. Katta partiyalar uchun odatda 5-8% chegirma taklif etiladi.";
        }

        messageCounterRef.current += 1;
        const replyMsg: ChatMessage = {
          id: `msg-reply-${messageCounterRef.current}`,
          conversation_id: activeConversation.id,
          sender_id: activeConversation.participant_id,
          sender_name: activeConversation.participant_name,
          sender_role: activeConversation.participant_id === 'bot-ai' ? 'agronomist' : 'agronomist',
          text: replyText,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          is_read: false,
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversation.id) {
              return {
                ...c,
                last_message: replyText,
                last_message_time: replyMsg.created_at,
                messages: [...c.messages, replyMsg],
              };
            }
            return c;
          })
        );
      }, 1200);
    }
  };

  // Quick suggestion chips based on active conversation type
  const quickSuggestions = activeConversation?.type === 'marketplace'
    ? [
        "Narxini hajmga qarab kelishsak bo'ladimi?",
        "Hosil sifati va sertifikat nusxasi bormi?",
        "Yukni qachon ombordan olib ketsak bo'ladi?",
        "Minimal buyurtma hajmi qancha?",
      ]
    : [
        "NDVI tahlili bo'yicha qanday o'g'it tavsiya qilasiz?",
        "Tuproq namligi tushib ketmoqda, nima qilish kerak?",
        "Tomchilatib sug'orish me'yori qanday bo'lishi kerak?",
        "Ekin barglarida sarg'ayish kuzatilmoqda.",
      ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner / Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-700" />
            <span>Xabarlar va Muloqot Markazi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mutaxassis agronomlar bilan maslahat va Hosil bozoridagi xaridorlar bilan to‘g‘ridan-to‘g‘ri xavfsiz suhbatlar.
          </p>
        </div>

        {onNavigateToMarketplace && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onNavigateToMarketplace}
            leftIcon={<ShoppingBag className="w-4 h-4 text-slate-600" />}
            className="h-8 text-xs font-semibold self-start sm:self-auto"
          >
            <span>Hosil Bozoriga o‘tish</span>
          </Button>
        )}
      </div>

      {/* Main Chat Workspace Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs h-[calc(100dvh-200px)] min-h-[500px] max-h-[820px] flex overflow-hidden relative">
        
        {/* ========================================================= */}
        {/* 1. LEFT COLUMN: CONVERSATION LIST */}
        {/* ========================================================= */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50 h-full overflow-hidden ${
            mobileShowThread ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Top Search & Filter Header */}
          <div className="p-3 border-b border-slate-200 bg-white space-y-2.5">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suhbat yoki fermerni qidirish..."
                className="w-full h-8.5 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Conversation Category Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
              <button
                onClick={() => setFilterType('all')}
                className={`flex-1 py-1 rounded transition-all cursor-pointer ${
                  filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Barchasi
              </button>
              <button
                onClick={() => setFilterType('agronomist')}
                className={`flex-1 py-1 rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  filterType === 'agronomist' ? 'bg-white text-emerald-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                <Activity className="w-3 h-3 text-emerald-700" />
                <span>Agronom</span>
              </button>
              <button
                onClick={() => setFilterType('marketplace')}
                className={`flex-1 py-1 rounded transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  filterType === 'marketplace' ? 'bg-white text-amber-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3 h-3 text-amber-700" />
                <span>Bozor</span>
              </button>
            </div>

          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-medium">Suhbatlar topilmadi</p>
                <p className="text-[11px] text-slate-400">
                  {searchQuery ? "Qidiruv so'zini o'zgartirib ko'ring" : "Hosil bozoridan e'lon tanlab muloqot boshlang"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeChatId;
                const isAgronomist = conv.type === 'agronomist';
                const isAI = conv.participant_id === 'bot-ai';

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveChatId(conv.id);
                      setMobileShowThread(true);
                      // Clear unread count on select
                      if (conv.unread_count) {
                        setConversations((prev) =>
                          prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
                        );
                      }
                    }}
                    className={`w-full p-3 text-left transition-colors flex items-start gap-3 cursor-pointer relative ${
                      isActive
                        ? 'bg-emerald-50/70 border-l-3 border-emerald-700'
                        : 'hover:bg-slate-100/60 bg-white'
                    }`}
                  >
                    {/* Avatar Icon / Image */}
                    <div className="relative shrink-0">
                      {isAI ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                          <Sparkles className="w-5 h-5" />
                        </div>
                      ) : isAgronomist ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold text-xs">
                          <Activity className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-xs">
                          {conv.participant_name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Online Status Green Dot */}
                      {conv.participant_online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs font-bold truncate ${isActive ? 'text-emerald-950' : 'text-slate-900'}`}>
                          {conv.participant_name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {conv.last_message_time || ''}
                        </span>
                      </div>

                      {/* Role & Context Tag */}
                      <div className="flex items-center gap-1.5 mb-1">
                        {isAgronomist ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded border border-emerald-200 truncate">
                            {isAI ? 'AI Maslahatchi' : 'Agronom'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded border border-amber-200 truncate">
                            {conv.listing_context ? conv.listing_context.crop_name : 'Bozor'}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 truncate">
                          {conv.participant_role.split('•')[0]}
                        </span>
                      </div>

                      {/* Last Message Preview */}
                      <p className="text-[11px] text-slate-500 truncate leading-snug">
                        {conv.last_message || 'Xabar yo\'q'}
                      </p>
                    </div>

                    {/* Unread Message Count Badge */}
                    {Boolean(conv.unread_count && conv.unread_count > 0) && (
                      <span className="shrink-0 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* ========================================================= */}
        {/* 2. RIGHT COLUMN: ACTIVE CHAT THREAD */}
        {/* ========================================================= */}
        <div
          className={`flex-1 flex flex-col bg-slate-50/30 h-full overflow-hidden relative ${
            mobileShowThread ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Thread Top Header */}
              <div className="p-3 sm:px-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shadow-2xs shrink-0 z-20">
                <div className="flex items-center gap-2.5 min-w-0">
                  
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileShowThread(false)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg"
                    aria-label="Orqaga"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {/* Participant Avatar */}
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {activeConversation.participant_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Title & Online Status */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {activeConversation.participant_name}
                      </h3>
                      {activeConversation.type === 'agronomist' && (
                        <span title="Tasdiqlangan agronom">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{activeConversation.participant_role}</span>
                    </p>
                  </div>

                </div>

                {/* Header Action Buttons (Phone & Telegram) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeConversation.participant_telegram && (
                    <a
                      href={`https://t.me/${activeConversation.participant_telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-2.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      title="Telegramda ochish"
                    >
                      <Send className="w-3 h-3" />
                      <span className="hidden sm:inline">Telegram</span>
                    </a>
                  )}

                  {activeConversation.participant_phone && (
                    <a
                      href={`tel:${activeConversation.participant_phone.replace(/\s+/g, '')}`}
                      className="h-8 px-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      title="Qo'ng'iroq qilish"
                    >
                      <Phone className="w-3 h-3 text-emerald-700" />
                      <span className="hidden sm:inline">Qo‘ng‘iroq</span>
                    </a>
                  )}
                </div>
              </div>

              {/* PRODUCT CONTEXT BANNER (IF MARKETPLACE CHAT) */}
              {activeConversation.listing_context && (
                <div className="bg-amber-50/80 border-b border-amber-200 p-2.5 px-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg overflow-hidden relative bg-slate-200 border border-amber-300 shrink-0">
                      <NextImage
                        src={activeConversation.listing_context.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80'}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {activeConversation.listing_context.crop_name}
                        </span>
                        <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                          {activeConversation.listing_context.total_quantity} {activeConversation.listing_context.unit}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-mono">
                        {activeConversation.listing_context.price_uzs_per_unit
                          ? `${activeConversation.listing_context.price_uzs_per_unit.toLocaleString('uz-UZ')} so'm/${activeConversation.listing_context.unit}`
                          : 'Kelishilgan narx'}
                        {' • '}
                        <span>{activeConversation.listing_context.location_region}</span>
                      </p>
                    </div>
                  </div>

                  {onViewListing && (
                    <button
                      onClick={() => onViewListing(activeConversation.listing_context!)}
                      className="h-7 px-2.5 rounded-md bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1 transition-colors shrink-0 shadow-2xs cursor-pointer"
                    >
                      <span>E&apos;lonni ko&apos;rish</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Messages Stream Scroll Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3.5 bg-slate-50/40">
                
                {/* Security Advice Notice Banner */}
                <div className="max-w-md mx-auto p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-200 text-center text-[11px] text-emerald-900 flex items-center justify-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Xavfsiz bitim: Mahsulotni ko‘rib, shartnoma tuzgandan so‘ng to‘lovni amalga oshiring.</span>
                </div>

                {/* Messages List */}
                {activeConversation.messages.map((msg) => {
                  const isMe = msg.sender_id === 'me';
                  const isSystem = msg.sender_role === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="inline-block bg-slate-200/80 text-slate-700 text-[11px] px-3 py-1 rounded-full">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-xs text-xs leading-relaxed ${
                          isMe
                            ? 'bg-emerald-800 text-white rounded-br-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        {!isMe && (
                          <p className="text-[10px] font-bold text-emerald-700 mb-0.5">
                            {msg.sender_name}
                          </p>
                        )}

                        <p className="whitespace-pre-line">{msg.text}</p>

                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isMe ? 'text-emerald-200' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.created_at}</span>
                          {isMe && (
                            <CheckCheck className="w-3 h-3 text-emerald-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-3 py-1.5 bg-slate-100/80 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 z-10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>Tezkor:</span>
                </span>
                {quickSuggestions.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="h-6.5 px-2.5 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 text-[11px] font-medium whitespace-nowrap transition-colors shadow-2xs shrink-0 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Message Composer Input Bar */}
              <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0 z-20">
                <button
                  type="button"
                  onClick={() => showToast("Fayl biriktirish funksiyasi tez orada faollashtiriladi")}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Rasm yoki hujjat biriktirish"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Xabar yozing (Enter bosing)..."
                  className="flex-1 h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 focus:bg-white transition-all"
                />

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className="h-9 px-3.5 text-xs font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Yuborish</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Suhbat tanlanmagan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Chap tarafdagi ro‘yxatdan suhbatni tanlang yoki e‘lon sahifasidan sotuvchiga yozing.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-xs font-medium shadow-lg animate-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

    </div>
  );
};
