'use client';

import React, { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';
import { supabase, isSupabaseConfigured, MarketplaceListing, FarmerProfile } from '@/lib/supabase';
import { 
  ShoppingBag, Plus, MapPin, Phone, Calendar, Search, Filter, CheckCircle2, 
  Tag, Send, X, Copy, ExternalLink, Sparkles, RefreshCw, AlertCircle,
  Package, ChevronRight, MessageSquare, ShieldCheck, Check
} from 'lucide-react';

interface MarketplaceSectionProps {
  currentLang: Language;
  userProfile?: FarmerProfile | null;
}

// Preset crop image mappings for clean visual design
const DEFAULT_CROP_IMAGES: Record<string, string> = {
  pomidor: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  uzum: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80',
  olma: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
  bugdoy: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
  paxta: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=600&q=80',
  qovun: 'https://images.unsplash.com/photo-1598170845058-12ef4a45753b?auto=format&fit=crop&w=600&q=80',
  tarvuz: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
  sabzi: 'https://images.unsplash.com/photo-1598170845058-12ef4a45753b?auto=format&fit=crop&w=600&q=80',
  anor: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
  kartoshka: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
  piyoz: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80'
};

const INITIAL_MOCK_LISTINGS: MarketplaceListing[] = [
  {
    id: 'mock-1',
    farmer_name: 'Rustam farmatsevt / Denov Agrosanoat',
    crop_name: 'Surxondaryo Pushti Pomidori (1-nav)',
    category: 'sabzavot',
    price_uzs_per_unit: 6500,
    unit: 'kg',
    total_quantity: 10, // 10 tonna
    expected_date: 'Hozir mavjud',
    location_region: 'Surxondaryo viloyati, Denov tumani',
    phone_contact: '+998 90 123 45 67',
    telegram_contact: '@denov_pomidor',
    description: 'Issiqxona va ochiq maydonda yetishtirilgan, sharbatli pushti pomidor. Ulgurji xaridorlar uchun fura bilan ortib beriladi.',
    image_url: DEFAULT_CROP_IMAGES.pomidor,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'mock-2',
    farmer_name: 'Akmalbek Dehqon Xo\'jaligi',
    crop_name: 'Farg\'ona Qora Xusayni va Rishtan Uzumi',
    category: 'meva',
    price_uzs_per_unit: 12000,
    unit: 'kg',
    total_quantity: 8,
    expected_date: 'Hozir mavjud',
    location_region: 'Farg\'ona viloyati, Rishtan tumani',
    phone_contact: '+998 91 234 56 78',
    telegram_contact: '@fergana_grapes',
    description: 'Eksportbop 1-navli uzum. Qutiga qadoqlangan, sovutgichli mashinaga tayyor holatda.',
    image_url: DEFAULT_CROP_IMAGES.uzum,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'mock-3',
    farmer_name: 'Samarqand Bog\'dorchilik Klasteri',
    crop_name: 'Samarqand Qizil Gala va Fuji Olmasi',
    category: 'meva',
    price_uzs_per_unit: 8500,
    unit: 'kg',
    total_quantity: 15,
    expected_date: 'Kutilmoqda: 10-Sentabr',
    location_region: 'Samarqand viloyati, Toyloq tumani',
    phone_contact: '+998 93 345 67 89',
    description: 'Intensiv bog\'dan hosil terimi boshlanmoqda. Oldindan shartnoma tuzish mumkin.',
    image_url: DEFAULT_CROP_IMAGES.olma,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'mock-4',
    farmer_name: "Qashqadaryo Don va G'alla Fermerligi",
    crop_name: "Sifatli Kuzgi Bug'doy (A'lo nav)",
    category: 'don',
    price_uzs_per_unit: 3200,
    unit: 'kg',
    total_quantity: 25,
    expected_date: 'Hozir mavjud',
    location_region: 'Qashqadaryo viloyati, Nishon tumani',
    phone_contact: '+998 97 456 78 90',
    description: "Kleykovinasi yuqori (28%+), un tortish va yem uchun juda mos bug'doy omborda saqlanmoqda.",
    image_url: DEFAULT_CROP_IMAGES.bugdoy,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'mock-5',
    farmer_name: 'Buxoro Polizchilik Agro',
    crop_name: "Mirzachsho'l Shirin Qovuni (Torpeda)",
    category: 'sabzavot',
    price_uzs_per_unit: null, // Kelishilgan
    unit: 'qutisi',
    total_quantity: 500,
    expected_date: 'Hozir mavjud',
    location_region: 'Buxoro viloyati, Kogon tumani',
    phone_contact: '+998 94 567 89 01',
    description: "Xushbo'y, boldek shirin Buxoro qovunlari. Narxi joyida kelishiladi.",
    image_url: DEFAULT_CROP_IMAGES.qovun,
    created_at: new Date(Date.now() - 3600000 * 30).toISOString()
  },
  {
    id: 'mock-6',
    farmer_name: 'Toshkent Sabzavotchilik fermeri',
    crop_name: 'Qizil va Sariq Qashqadaryo Sabzisi',
    category: 'sabzavot',
    price_uzs_per_unit: 3500,
    unit: 'kg',
    total_quantity: 12,
    expected_date: 'Hozir mavjud',
    location_region: 'Toshkent viloyati, Qibray tumani',
    phone_contact: '+998 99 678 90 12',
    description: 'Yuvilgan, toza saralangan sabzi. Toshkent ulgurji bozoriga yetkazib berish ham mavjud.',
    image_url: DEFAULT_CROP_IMAGES.sabzi,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString()
  }
];

const UZBEKISTAN_REGIONS = [
  "Toshkent viloyati",
  "Samarqand viloyati",
  "Farg'ona viloyati",
  "Surxondaryo viloyati",
  "Buxoro viloyati",
  "Andijon viloyati",
  "Namangan viloyati",
  "Xorazm viloyati",
  "Qashqadaryo viloyati",
  "Jizzax viloyati",
  "Sirdaryo viloyati",
  "Navoiy viloyati",
  "Qoraqalpog'iston Respublikasi"
];

export const MarketplaceSection: React.FC<MarketplaceSectionProps> = ({ currentLang, userProfile }) => {
  const t = translations[currentLang];

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'ready' | 'upcoming'>('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [contactModalItem, setContactModalItem] = useState<MarketplaceListing | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Create Form State
  const [formData, setFormData] = useState({
    farmer_name: '',
    crop_name: '',
    category: 'sabzavot',
    price_uzs_per_unit: '',
    unit: 'kg',
    total_quantity: '',
    expected_date: 'Hozir mavjud',
    location_region: UZBEKISTAN_REGIONS[0],
    phone_contact: '',
    telegram_contact: '',
    description: '',
    image_url: ''
  });

  // Pre-fill profile if available
  useEffect(() => {
    if (userProfile) {
      const timer = setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          farmer_name: userProfile.full_name || prev.farmer_name,
          location_region: userProfile.region ? `${userProfile.region} viloyati` : prev.location_region,
          phone_contact: userProfile.phone || prev.phone_contact
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [userProfile]);

  // Load Listings from Supabase or LocalStorage / Mock
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      let fetchedData: MarketplaceListing[] = [];

      // Try Supabase first if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('marketplace_listings')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            fetchedData = data as MarketplaceListing[];
          }
        } catch (e) {
          console.warn('Supabase fetch error, fallback to local/mock:', e);
        }
      }

      // Merge with localStorage created items
      try {
        const localListingsJson = localStorage.getItem('ekinix_marketplace_listings');
        let localListings: MarketplaceListing[] = [];
        if (localListingsJson) {
          localListings = JSON.parse(localListingsJson);
        }

        // Combine fetched/local/mock without duplicates
        const allCombined = [...localListings, ...fetchedData];
        if (allCombined.length === 0) {
          allCombined.push(...INITIAL_MOCK_LISTINGS);
        } else {
          // Ensure mock listings are present if list is small
          const existingIds = new Set(allCombined.map(x => x.id));
          INITIAL_MOCK_LISTINGS.forEach(mock => {
            if (!existingIds.has(mock.id)) {
              allCombined.push(mock);
            }
          });
        }

        if (isMounted) setListings(allCombined);
      } catch {
        if (isMounted) setListings(INITIAL_MOCK_LISTINGS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);

  // Filter listings
  const filteredListings = listings.filter((item) => {
    // Search query match
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = item.crop_name.toLowerCase().includes(q);
      const matchFarmer = item.farmer_name.toLowerCase().includes(q);
      const matchRegion = item.location_region.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      if (!matchName && !matchFarmer && !matchRegion && !matchDesc) return false;
    }

    // Category match
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // Region match
    if (selectedRegion !== 'all' && !item.location_region.includes(selectedRegion.split(' ')[0])) {
      return false;
    }

    // Availability match
    if (availabilityFilter === 'ready') {
      const isReady = !item.expected_date || item.expected_date.toLowerCase().includes('hozir') || item.expected_date.toLowerCase().includes('mavjud') || item.expected_date.toLowerCase().includes('готово');
      if (!isReady) return false;
    } else if (availabilityFilter === 'upcoming') {
      const isUpcoming = item.expected_date && (item.expected_date.toLowerCase().includes('kutil') || item.expected_date.toLowerCase().includes('ожидается') || /\d/.test(item.expected_date));
      if (!isUpcoming) return false;
    }

    return true;
  });

  // Handle Form Submit
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop_name || !formData.farmer_name || !formData.phone_contact || !formData.total_quantity) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring.");
      return;
    }

    setSubmitting(true);

    // Get default image if user didn't provide custom image URL
    const cropKey = formData.crop_name.toLowerCase();
    let imgUrl = formData.image_url;
    if (!imgUrl) {
      if (cropKey.includes('pomidor')) imgUrl = DEFAULT_CROP_IMAGES.pomidor;
      else if (cropKey.includes('uzum')) imgUrl = DEFAULT_CROP_IMAGES.uzum;
      else if (cropKey.includes('olma')) imgUrl = DEFAULT_CROP_IMAGES.olma;
      else if (cropKey.includes('bugdoy') || cropKey.includes("g'alla")) imgUrl = DEFAULT_CROP_IMAGES.bugdoy;
      else if (cropKey.includes('paxta')) imgUrl = DEFAULT_CROP_IMAGES.paxta;
      else if (cropKey.includes('qovun')) imgUrl = DEFAULT_CROP_IMAGES.qovun;
      else if (cropKey.includes('tarvuz')) imgUrl = DEFAULT_CROP_IMAGES.tarvuz;
      else if (cropKey.includes('sabzi')) imgUrl = DEFAULT_CROP_IMAGES.sabzi;
      else if (cropKey.includes('anor')) imgUrl = DEFAULT_CROP_IMAGES.anor;
      else if (cropKey.includes('kartoshka')) imgUrl = DEFAULT_CROP_IMAGES.kartoshka;
      else if (cropKey.includes('piyoz')) imgUrl = DEFAULT_CROP_IMAGES.piyoz;
      else imgUrl = DEFAULT_CROP_IMAGES.default;
    }

    const newListing: MarketplaceListing = {
      id: 'list-' + Date.now(),
      farmer_id: userProfile?.id,
      farmer_name: formData.farmer_name,
      crop_name: formData.crop_name,
      category: formData.category as MarketplaceListing['category'],
      price_uzs_per_unit: formData.price_uzs_per_unit ? Number(formData.price_uzs_per_unit) : null,
      unit: formData.unit,
      total_quantity: Number(formData.total_quantity),
      expected_date: formData.expected_date || 'Hozir mavjud',
      location_region: formData.location_region,
      phone_contact: formData.phone_contact,
      telegram_contact: formData.telegram_contact,
      description: formData.description,
      image_url: imgUrl,
      created_at: new Date().toISOString()
    };

    // Save to Supabase if available
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('marketplace_listings').insert([newListing]);
      } catch (err) {
        console.warn("Supabase insert listing failed, storing locally:", err);
      }
    }

    // Save to localStorage
    try {
      const existingJson = localStorage.getItem('ekinix_marketplace_listings');
      const existing: MarketplaceListing[] = existingJson ? JSON.parse(existingJson) : [];
      const updated = [newListing, ...existing];
      localStorage.setItem('ekinix_marketplace_listings', JSON.stringify(updated));
    } catch {
      // ignore localstorage error
    }

    // Update state
    setListings(prev => [newListing, ...prev]);
    setSubmitting(false);
    setCreateModalOpen(false);
    setSubmitSuccessMsg("E'loningiz muvaffaqiyatli joylashtirildi! Endi xaridorlar siz bilan bog'lanishlari mumkin.");

    // Clear alert after 5s
    setTimeout(() => {
      setSubmitSuccessMsg(null);
    }, 5000);
  };

  const copyPhoneNumber = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  return (
    <section id="section-market" className="py-16 sm:py-24 bg-[#FAF7F0] border-t border-[#E4D9C4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E4D9C4] pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#D9A441]/20 text-[#B8852B] font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-[#D9A441]/30">
              <ShoppingBag className="w-4 h-4 text-[#D9A441]" />
              <span>Dehqon & Xaridor Bozor Maydoni</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F3D2B] leading-tight">
              Ekinix Bozor Maydoni
            </h2>
            <p className="text-base text-[#4A5D4E] leading-relaxed">
              Dehqon va xaridorlarni to&apos;g&apos;ridan-to&apos;g&apos;ri vositachilarsiz uchrashtiruvchi agrosanoat taxtasi. Tayyor yoki kutilayotgan hosilingizni e&apos;lon qiling.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-sm px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-[#D9A441]/40 shrink-0 group"
          >
            <Plus className="w-5 h-5 text-[#D9A441] group-hover:scale-110 transition-transform" />
            <span>E&apos;lon Joylashtirish</span>
          </button>
        </div>

        {/* Success Alert */}
        {submitSuccessMsg && (
          <div className="bg-emerald-900 text-[#FAF7F0] p-4 rounded-2xl border-2 border-emerald-500/50 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <p className="text-sm font-semibold">{submitSuccessMsg}</p>
            </div>
            <button 
              onClick={() => setSubmitSuccessMsg(null)}
              className="text-white/70 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Search, Filter & Tabs Bar */}
        <div className="bg-[#FAF7F0] p-5 rounded-3xl border-2 border-[#E4D9C4] shadow-md space-y-4">
          
          {/* Top row: Search input & Region Select */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="w-5 h-5 text-[#6C7C6F] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ekin nomi, dehqon yoki hudud bo'yicha qidirish..."
                className="w-full bg-white border border-[#E4D9C4] rounded-2xl pl-12 pr-4 py-3.5 text-sm text-[#1F3D2B] placeholder-[#6C7C6F] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6C7C6F] hover:text-[#1F3D2B]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Region Filter */}
            <div className="relative">
              <MapPin className="w-5 h-5 text-[#D9A441] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-white border border-[#E4D9C4] rounded-2xl pl-12 pr-8 py-3.5 text-sm font-medium text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] appearance-none"
              >
                <option value="all">Barcha viloyatlar (O&apos;zbekiston)</option>
                {UZBEKISTAN_REGIONS.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Bottom row: Category Pills & Availability Filter */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2 border-t border-[#E4D9C4]">
            
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {[
                { id: 'all', label: "Barchasi" },
                { id: 'sabzavot', label: "🥦 Sabzavotlar" },
                { id: 'meva', label: "🍎 Meva va Bog'dorchilik" },
                { id: 'don', label: "🌾 Don va G'alla" },
                { id: 'paxta', label: "🌱 Paxta va Sanoat" },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    selectedCategory === cat.id
                      ? 'bg-[#1F3D2B] text-[#FAF7F0] border-[#1F3D2B] shadow-xs'
                      : 'bg-white text-[#1F3D2B] border-[#E4D9C4] hover:bg-[#F0E8D8]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Availability Filter Toggle */}
            <div className="flex items-center bg-[#F0E8D8] p-1 rounded-xl border border-[#E4D9C4] shrink-0 self-start lg:self-auto">
              <button
                onClick={() => setAvailabilityFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  availabilityFilter === 'all'
                    ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                    : 'text-[#5C4033] hover:text-[#1F3D2B]'
                }`}
              >
                Barchasi
              </button>
              <button
                onClick={() => setAvailabilityFilter('ready')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  availabilityFilter === 'ready'
                    ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                    : 'text-[#5C4033] hover:text-[#1F3D2B]'
                }`}
              >
                Hozir mavjud
              </button>
              <button
                onClick={() => setAvailabilityFilter('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  availabilityFilter === 'upcoming'
                    ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                    : 'text-[#5C4033] hover:text-[#1F3D2B]'
                }`}
              >
                Kutilayotgan hosil
              </button>
            </div>

          </div>

        </div>

        {/* Listings Counter */}
        <div className="flex items-center justify-between text-xs text-[#6C7C6F] font-semibold px-1">
          <span>{filteredListings.length} ta faol e&apos;lon topildi</span>
          {(searchQuery || selectedCategory !== 'all' || selectedRegion !== 'all' || availabilityFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedRegion('all');
                setAvailabilityFilter('all');
              }}
              className="text-[#B8852B] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Filterlarni tozalash
            </button>
          )}
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-16 bg-[#FAF7F0] rounded-3xl border border-[#E4D9C4] space-y-3">
            <RefreshCw className="w-8 h-8 text-[#D9A441] animate-spin mx-auto" />
            <p className="text-sm text-[#4A5D4E] font-medium">Bozor e&apos;lonlari yuklanmoqda...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16 bg-[#FAF7F0] rounded-3xl border border-[#E4D9C4] space-y-4 max-w-xl mx-auto p-8">
            <Package className="w-12 h-12 text-[#D9A441] mx-auto" />
            <h3 className="font-serif text-xl font-bold text-[#1F3D2B]">
              Ushbu parametrlar bo&apos;yicha e&apos;lonlar topilmadi
            </h3>
            <p className="text-xs text-[#6C7C6F] leading-relaxed">
              Qidiruv so&apos;rovini o&apos;zgartirib ko&apos;ring yoki birinchi bo&apos;lib hosilingiz uchun e&apos;lon joylashtiring.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="bg-[#1F3D2B] text-[#FAF7F0] text-xs font-bold px-5 py-3 rounded-xl hover:bg-[#14281C] transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#D9A441]" /> E&apos;lon Joylashtirish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => {
              const isReady = !item.expected_date || item.expected_date.toLowerCase().includes('hozir') || item.expected_date.toLowerCase().includes('mavjud');
              
              return (
                <div
                  key={item.id}
                  className="bg-[#FAF7F0] rounded-3xl overflow-hidden border-2 border-[#E4D9C4] hover:border-[#D9A441] shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  {/* Card Header Image */}
                  <div>
                    <div className="relative h-48 w-full bg-[#1F3D2B]/10 overflow-hidden">
                      <img
                        src={item.image_url || DEFAULT_CROP_IMAGES.default}
                        alt={item.crop_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Availability Badge */}
                      <div className="absolute top-3 left-3">
                        {isReady ? (
                          <span className="bg-emerald-800/90 backdrop-blur-md text-emerald-100 font-extrabold text-[11px] px-3 py-1 rounded-full border border-emerald-400/30 shadow-md inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            Hozir mavjud
                          </span>
                        ) : (
                          <span className="bg-amber-800/90 backdrop-blur-md text-amber-100 font-extrabold text-[11px] px-3 py-1 rounded-full border border-amber-400/30 shadow-md inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-300" />
                            {item.expected_date}
                          </span>
                        )}
                      </div>

                      {/* Quantity Tag on Image */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                        <span className="bg-[#1F3D2B]/90 backdrop-blur-md text-[#FAF7F0] font-bold text-xs px-3 py-1.5 rounded-xl border border-white/20">
                          📦 {item.total_quantity} {item.unit}
                        </span>
                        <span className="text-[11px] font-semibold text-white/80">
                          {item.location_region.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#F0E8D8] text-[#5C4033] px-2.5 py-1 rounded-md border border-[#E4D9C4]">
                          {item.category === 'sabzavot' ? 'Sabzavot' : item.category === 'meva' ? 'Meva' : item.category === 'don' ? 'Don & G\'alla' : item.category === 'paxta' ? 'Paxta' : 'Qishloq Xo\'jaligi'}
                        </span>
                        <span className="text-[11px] text-[#6C7C6F] font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tasdiqlangan
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-[#1F3D2B] group-hover:text-[#B8852B] transition-colors leading-snug">
                        {item.crop_name}
                      </h3>

                      <div className="space-y-1 text-xs text-[#4A5D4E]">
                        <p className="flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                          <span>{item.location_region}</span>
                        </p>
                        <p className="text-[#6C7C6F]">
                          Sotuvchi: <strong className="text-[#1F3D2B]">{item.farmer_name}</strong>
                        </p>
                      </div>

                      {item.description && (
                        <p className="text-xs text-[#6C7C6F] line-clamp-2 italic pt-1 border-t border-[#E4D9C4]">
                          &ldquo;{item.description}&rdquo;
                        </p>
                      )}

                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-0 space-y-3">
                    
                    <div className="pt-3 border-t border-[#E4D9C4] flex items-baseline justify-between">
                      <span className="text-xs text-[#6C7C6F] font-semibold">Mo&apos;ljallangan narx:</span>
                      <span className="text-base font-serif font-extrabold text-[#1F3D2B]">
                        {item.price_uzs_per_unit ? (
                          <>
                            {item.price_uzs_per_unit.toLocaleString()} <span className="text-xs font-sans font-normal text-[#6C7C6F]">so&apos;m/{item.unit}</span>
                          </>
                        ) : (
                          <span className="text-sm font-sans text-[#B8852B] font-bold">Kelishilgan narxda</span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => setContactModalItem(item)}
                      className="w-full bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg border border-[#D9A441]/30"
                    >
                      <Phone className="w-4 h-4 text-[#D9A441]" />
                      <span>Dehqon Bilan Bog&apos;lanish</span>
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ==================== CREATE LISTING MODAL ==================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E4D9C4] max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8">
            
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-[#6C7C6F] hover:text-[#1F3D2B] p-2 rounded-full hover:bg-[#E4D9C4]/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B8852B] uppercase tracking-wider bg-[#D9A441]/20 px-3 py-1 rounded-full border border-[#D9A441]/30">
                <Plus className="w-3.5 h-3.5" /> E&apos;lon Joylashtirish
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1F3D2B]">
                Hosilingizni Bozorga Chiqaring
              </h3>
              <p className="text-xs text-[#4A5D4E]">
                Ushbu e&apos;lon respublika bo&apos;ylab ulgurji va chakana xaridorlarga ko&apos;rinadi.
              </p>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              
              {/* Crop Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    Ekin / Mahsulot nomi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Surxondaryo Pomidori, Gala Olmasi"
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    Kategoriya *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  >
                    <option value="sabzavot">🥦 Sabzavotlar</option>
                    <option value="meva">🍎 Meva &amp; Bog&apos;dorchilik</option>
                    <option value="don">🌾 Don va G&apos;alla</option>
                    <option value="paxta">🌱 Paxta va Sanoat</option>
                    <option value="boshqa">📦 Boshqa mahsulotlar</option>
                  </select>
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    Mavjud / Kutilayotgan Miqdor *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Masalan: 10"
                    value={formData.total_quantity}
                    onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    O&apos;lchov birligi *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  >
                    <option value="tonna">tonna</option>
                    <option value="kg">kg</option>
                    <option value="qop">qop</option>
                    <option value="qutisi">qutisi</option>
                    <option value="dona">dona</option>
                  </select>
                </div>
              </div>

              {/* Expected Date & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    Mavjud bo&apos;lish vaqti
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Hozir mavjud yoki 15-Sentabr"
                    value={formData.expected_date}
                    onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    Mo&apos;ljallangan Narx (so&apos;m) <span className="text-[#6C7C6F] font-normal">(Bo&apos;sh = Kelishilgan)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Masalan: 6500"
                    value={formData.price_uzs_per_unit}
                    onChange={(e) => setFormData({ ...formData, price_uzs_per_unit: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>
              </div>

              {/* Region & Farmer Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    Viloyat / Hudud *
                  </label>
                  <select
                    value={formData.location_region}
                    onChange={(e) => setFormData({ ...formData, location_region: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  >
                    {UZBEKISTAN_REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    Sotuvchi Ismi / Fermer Xo&apos;jaligi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Abdumo'min fermer"
                    value={formData.farmer_name}
                    onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    Telefon raqam *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+998 90 123 45 67"
                    value={formData.phone_contact}
                    onChange={(e) => setFormData({ ...formData, phone_contact: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    Telegram nik (Ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    placeholder="@fermer_nik"
                    value={formData.telegram_contact}
                    onChange={(e) => setFormData({ ...formData, telegram_contact: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                  Qo&apos;shimcha ma&apos;lumot (Ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  placeholder="Hosil navi, qadoqlash, yuklab berish shartlari..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-sm py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border border-[#D9A441]/40 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-5 h-5 text-[#D9A441] animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#D9A441]" />
                      <span>E&apos;lonni Ekinix Bozorida Nashr Etish</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ==================== CONTACT FARMER MODAL ==================== */}
      {contactModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E4D9C4] max-w-md w-full p-6 shadow-2xl relative space-y-5">
            
            <button
              onClick={() => {
                setContactModalItem(null);
                setCopiedPhone(false);
              }}
              className="absolute top-4 right-4 text-[#6C7C6F] hover:text-[#1F3D2B] p-1.5 rounded-full hover:bg-[#E4D9C4]/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#E4D9C4] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center font-serif text-xl font-bold shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#B8852B] uppercase tracking-wider bg-[#D9A441]/20 px-2.5 py-0.5 rounded-full border border-[#D9A441]/30">
                  Dehqon bilan bog&apos;lanish
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1F3D2B] leading-tight">
                  {contactModalItem.farmer_name}
                </h3>
              </div>
            </div>

            {/* Listing Summary in Modal */}
            <div className="bg-[#F0E8D8] p-4 rounded-2xl border border-[#E4D9C4] space-y-1.5 text-xs text-[#1F3D2B]">
              <p className="font-bold text-sm text-[#1F3D2B]">
                {contactModalItem.crop_name}
              </p>
              <p className="text-[#4A5D4E]">
                <strong>Miqdori:</strong> {contactModalItem.total_quantity} {contactModalItem.unit}
              </p>
              <p className="text-[#4A5D4E]">
                <strong>Joylashuvi:</strong> {contactModalItem.location_region}
              </p>
              <p className="text-[#4A5D4E]">
                <strong>Mo&apos;ljallangan narx:</strong> {contactModalItem.price_uzs_per_unit ? `${contactModalItem.price_uzs_per_unit.toLocaleString()} so'm / ${contactModalItem.unit}` : 'Kelishilgan narxda'}
              </p>
            </div>

            {/* Direct Phone Call Button */}
            <div className="space-y-3 pt-1">
              <a
                href={`tel:${contactModalItem.phone_contact.replace(/\s+/g, '')}`}
                className="w-full bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-sm py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 border border-[#D9A441]/40"
              >
                <Phone className="w-5 h-5 text-[#D9A441]" />
                <span>Qo&apos;ng&apos;iroq Qilish ({contactModalItem.phone_contact})</span>
              </a>

              {/* Copy Phone Button */}
              <button
                onClick={() => copyPhoneNumber(contactModalItem.phone_contact)}
                className="w-full bg-white hover:bg-[#F0E8D8] text-[#1F3D2B] font-bold text-xs py-2.5 rounded-xl transition-all border border-[#E4D9C4] flex items-center justify-center gap-2"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Raqam nusxalandi!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#6C7C6F]" />
                    <span>Raqamdan nusxa olish</span>
                  </>
                )}
              </button>

              {/* Telegram Button if available */}
              {contactModalItem.telegram_contact && (
                <a
                  href={`https://t.me/${contactModalItem.telegram_contact.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>Telegram orqali yozish ({contactModalItem.telegram_contact})</span>
                </a>
              )}
            </div>

            <p className="text-[11px] text-[#6C7C6F] text-center italic pt-2 border-t border-[#E4D9C4]">
              💡 Ekinix xaridor va sotuvchilarni to&apos;g&apos;ridan-to&apos;g&apos;ri bog&apos;laydi. Kelishuv va to&apos;lov holatlarini mustaqil kelishib oling.
            </p>

          </div>
        </div>
      )}

    </section>
  );
};
