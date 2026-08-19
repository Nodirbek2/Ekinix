'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import NextImage from 'next/image';
import { Language, translations } from '@/lib/i18n';
import { 
  supabase, 
  isSupabaseConfigured, 
  MarketplaceListing, 
  FarmerProfile, 
  uploadMarketplaceImage 
} from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/ui/StateFeedback';
import { 
  ShoppingBag, Plus, MapPin, Phone, Calendar, Search, Filter, CheckCircle2, 
  Tag, Send, X, Copy, ExternalLink, Sparkles, RefreshCw, AlertCircle,
  Package, ChevronRight, MessageSquare, ShieldCheck, Check,
  Upload, Image as ImageIcon, Camera, Link as LinkIcon, Trash2,
  Edit3, Eye, CheckCircle, Clock, Ban, UserCheck, AlertTriangle
} from 'lucide-react';

interface MarketplaceSectionProps {
  currentLang: Language;
  userProfile?: FarmerProfile | null;
}

// Preset crop image mappings with high quality agricultural photography
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
  bodring: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=600&q=80',
  shaftoli: 'https://images.unsplash.com/photo-1629828874514-c1e5103f2150?auto=format&fit=crop&w=600&q=80',
  qulupnay: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80'
};

const PRESET_CROP_LIST = [
  { key: 'pomidor', nameUz: 'Pomidor', img: DEFAULT_CROP_IMAGES.pomidor },
  { key: 'uzum', nameUz: 'Uzum', img: DEFAULT_CROP_IMAGES.uzum },
  { key: 'olma', nameUz: 'Olma', img: DEFAULT_CROP_IMAGES.olma },
  { key: 'bugdoy', nameUz: "Bug'doy", img: DEFAULT_CROP_IMAGES.bugdoy },
  { key: 'paxta', nameUz: 'Paxta', img: DEFAULT_CROP_IMAGES.paxta },
  { key: 'qovun', nameUz: 'Qovun', img: DEFAULT_CROP_IMAGES.qovun },
  { key: 'tarvuz', nameUz: 'Tarvuz', img: DEFAULT_CROP_IMAGES.tarvuz },
  { key: 'sabzi', nameUz: 'Sabzi', img: DEFAULT_CROP_IMAGES.sabzi },
  { key: 'anor', nameUz: 'Anor', img: DEFAULT_CROP_IMAGES.anor },
  { key: 'kartoshka', nameUz: 'Kartoshka', img: DEFAULT_CROP_IMAGES.kartoshka },
  { key: 'piyoz', nameUz: 'Piyoz', img: DEFAULT_CROP_IMAGES.piyoz },
  { key: 'bodring', nameUz: 'Bodring', img: DEFAULT_CROP_IMAGES.bodring },
  { key: 'shaftoli', nameUz: 'Shaftoli', img: DEFAULT_CROP_IMAGES.shaftoli },
  { key: 'qulupnay', nameUz: 'Qulupnay', img: DEFAULT_CROP_IMAGES.qulupnay },
];

const UZBEKISTAN_REGIONS = [
  "Barcha viloyatlar",
  "Toshkent viloyati",
  "Toshkent shahri",
  "Samarqand viloyati",
  "Farg'ona viloyati",
  "Andijon viloyati",
  "Namangan viloyati",
  "Buxoro viloyati",
  "Qashqadaryo viloyati",
  "Surxondaryo viloyati",
  "Xorazm viloyati",
  "Navoiy viloyati",
  "Jizzax viloyati",
  "Sirdaryo viloyati",
  "Qoraqalpog'iston Respublikasi"
];

type ListingStatusFilter = 'all_active' | 'all' | 'available' | 'reserved' | 'sold' | 'my_listings';

// Helper to generate a unique listing ID
function generateListingId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `list-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const MarketplaceSection: React.FC<MarketplaceSectionProps> = ({ currentLang, userProfile }) => {
  const t = translations[currentLang];

  // State
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ListingStatusFilter>('all_active');
  const [myListingIds, setMyListingIds] = useState<string[]>([]);
  const [currentAuthUserId, setCurrentAuthUserId] = useState<string | null>(null);

  // Modals & UI States
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [editingListing, setEditingListing] = useState<MarketplaceListing | null>(null);
  const [contactModalItem, setContactModalItem] = useState<MarketplaceListing | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageUploadTab, setImageUploadTab] = useState<'upload' | 'presets' | 'url'>('upload');

  // Refs for File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form State for creating/editing listing
  const [formData, setFormData] = useState({
    crop_name: '',
    category: 'sabzavot',
    price_uzs_per_unit: '',
    unit: 'kg',
    total_quantity: '',
    expected_date: 'Hozir mavjud',
    location_region: userProfile?.region || 'Toshkent viloyati',
    farmer_name: userProfile?.full_name || '',
    phone_contact: userProfile?.phone || '',
    telegram_contact: '',
    description: '',
    image_url: '',
    status: 'available' as 'available' | 'reserved' | 'sold'
  });

  // Show temporary toast message
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load My Listing IDs from localStorage & Auth session
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      try {
        const savedMyIds = localStorage.getItem('ekinix_my_listing_ids');
        if (savedMyIds && isMounted) {
          setMyListingIds(JSON.parse(savedMyIds));
        }
      } catch {
        // ignore
      }
    }, 0);

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.id && isMounted) {
          setCurrentAuthUserId(data.session.user.id);
        }
      });
    }

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Update form defaults when userProfile changes
  useEffect(() => {
    if (!userProfile) return;
    const timer = setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        farmer_name: prev.farmer_name || userProfile.full_name,
        phone_contact: prev.phone_contact || userProfile.phone,
        location_region: prev.location_region === 'Toshkent viloyati' && userProfile.region ? userProfile.region : prev.location_region
      }));
    }, 0);
    return () => clearTimeout(timer);
  }, [userProfile]);

  // Load Real Listings from Supabase and sync with local storage
  const loadListings = React.useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    let loadedListings: MarketplaceListing[] = [];

    // 1. Fetch from Supabase marketplace_listings table
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('marketplace_listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          loadedListings = data.map((item: any) => ({
            ...item,
            status: item.status || 'available'
          }));
        } else if (error) {
          console.warn('Supabase marketplace fetch error:', error.message);
          setFetchError(
            currentLang === 'ru'
              ? 'Не удалось загрузить объявления с сервера. Проверьте соединение с интернетом.'
              : currentLang === 'en'
              ? 'Failed to load marketplace listings from server. Please check your connection.'
              : "Bozor e'lonlarini yuklashda xatolik yuz berdi. Internet aloqasini tekshiring."
          );
        }
      } catch (err) {
        console.warn('Failed to load marketplace from Supabase:', err);
        setFetchError(
          currentLang === 'ru'
            ? 'Сетевая ошибка при загрузке объявлений.'
            : currentLang === 'en'
            ? 'Network error while loading marketplace listings.'
            : "E'lonlarni yuklashda tarmoq xatoligi yuz berdi."
        );
      }
    }

    // 2. Load locally created real listings (fallback / offline sync)
    try {
      const savedLocal = localStorage.getItem('ekinix_my_created_listings');
      if (savedLocal) {
        const localList: MarketplaceListing[] = JSON.parse(savedLocal);
        // Merge without duplicating IDs
        const existingIds = new Set(loadedListings.map(l => l.id));
        for (const loc of localList) {
          if (!existingIds.has(loc.id)) {
            loadedListings.push({
              ...loc,
              status: loc.status || 'available'
            });
          }
        }
      }
    } catch {
      // ignore
    }

    // Sort by created_at desc
    loadedListings.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    setListings(loadedListings);
    setLoading(false);
  }, [currentLang]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadListings();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadListings]);

  // Helper to determine if the logged in farmer owns the listing
  const isOwner = React.useCallback((item: MarketplaceListing): boolean => {
    if (item.id && myListingIds.includes(item.id)) return true;
    if (currentAuthUserId && item.user_id && item.user_id === currentAuthUserId) return true;
    if (userProfile?.id && item.farmer_id && item.farmer_id === userProfile.id) return true;
    if (userProfile?.user_id && item.user_id && item.user_id === userProfile.user_id) return true;
    
    // Match cleaned phone number if user is logged in
    if (userProfile?.phone && item.phone_contact) {
      const userP = userProfile.phone.replace(/\D/g, '');
      const itemP = item.phone_contact.replace(/\D/g, '');
      if (userP.length >= 9 && itemP.length >= 9 && userP.slice(-9) === itemP.slice(-9)) {
        return true;
      }
    }
    return false;
  }, [myListingIds, currentAuthUserId, userProfile]);

  // Handle Real File Selection & Storage Upload
  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(currentLang === 'ru' ? 'Пожалуйста, выберите файл изображения (JPG, PNG)' : "Iltimos, rasm faylini tanlang (JPG, PNG)");
      return;
    }

    try {
      setUploadingImage(true);
      // Calls client-side canvas compressor and uploads to Supabase Storage 'marketplace' bucket
      const uploadedUrl = await uploadMarketplaceImage(file);
      setFormData(prev => ({ ...prev, image_url: uploadedUrl }));
      showToast(currentLang === 'ru' ? "Фотография успешно загружена!" : "Rasm muvaffaqiyatli yuklandi!");
    } catch (err) {
      console.error('Image upload failed:', err);
      alert(currentLang === 'ru' ? "Не удалось загрузить фото. Попробуйте еще раз." : "Rasmni yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: MarketplaceListing) => {
    setEditingListing(item);
    setFormData({
      crop_name: item.crop_name,
      category: item.category || 'sabzavot',
      price_uzs_per_unit: item.price_uzs_per_unit ? String(item.price_uzs_per_unit) : '',
      unit: item.unit || 'kg',
      total_quantity: String(item.total_quantity || ''),
      expected_date: item.expected_date || 'Hozir mavjud',
      location_region: item.location_region || 'Toshkent viloyati',
      farmer_name: item.farmer_name || '',
      phone_contact: item.phone_contact || '',
      telegram_contact: item.telegram_contact || '',
      description: item.description || '',
      image_url: item.image_url || '',
      status: (item.status as any) || 'available'
    });
    setCreateModalOpen(true);
  };

  // Create or Update Listing
  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.crop_name || !formData.total_quantity || !formData.farmer_name || !formData.phone_contact) {
      alert(currentLang === 'ru' ? "Пожалуйста, заполните обязательные поля (*)" : "Iltimos, barcha majburiy maydonlarni to'ldiring (*)");
      return;
    }

    setSubmitting(true);

    const priceNum = formData.price_uzs_per_unit ? parseFloat(formData.price_uzs_per_unit) : null;
    const quantityNum = parseFloat(formData.total_quantity) || 1;
    const resolvedImageUrl = formData.image_url || DEFAULT_CROP_IMAGES.default;

    if (editingListing) {
      // UPDATE EXISTING LISTING
      const updatedItem: MarketplaceListing = {
        ...editingListing,
        crop_name: formData.crop_name,
        category: formData.category,
        price_uzs_per_unit: priceNum,
        unit: formData.unit,
        total_quantity: quantityNum,
        expected_date: formData.expected_date || 'Hozir mavjud',
        location_region: formData.location_region,
        farmer_name: formData.farmer_name,
        phone_contact: formData.phone_contact,
        telegram_contact: formData.telegram_contact || undefined,
        description: formData.description || undefined,
        image_url: resolvedImageUrl,
        status: formData.status
      };

      // 1. Update in Supabase
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('marketplace_listings')
            .update({
              crop_name: updatedItem.crop_name,
              category: updatedItem.category,
              price_uzs_per_unit: updatedItem.price_uzs_per_unit,
              unit: updatedItem.unit,
              total_quantity: updatedItem.total_quantity,
              expected_date: updatedItem.expected_date,
              location_region: updatedItem.location_region,
              farmer_name: updatedItem.farmer_name,
              phone_contact: updatedItem.phone_contact,
              telegram_contact: updatedItem.telegram_contact,
              description: updatedItem.description,
              image_url: updatedItem.image_url,
              status: updatedItem.status
            })
            .eq('id', updatedItem.id);
        } catch (err) {
          console.warn('Failed to update listing in Supabase:', err);
        }
      }

      // 2. Update local state
      setListings(prev => prev.map(l => l.id === updatedItem.id ? updatedItem : l));

      // 3. Update localStorage fallback
      try {
        const savedLocal = localStorage.getItem('ekinix_my_created_listings');
        if (savedLocal) {
          const list: MarketplaceListing[] = JSON.parse(savedLocal);
          const updatedList = list.map(l => l.id === updatedItem.id ? updatedItem : l);
          localStorage.setItem('ekinix_my_created_listings', JSON.stringify(updatedList));
        }
      } catch {
        // ignore
      }

      showToast(currentLang === 'ru' ? "Объявление успешно обновлено!" : "E'lon muvaffaqiyatli tahrirlandi!");
    } else {
      // CREATE NEW LISTING
      const newListingId = generateListingId();
      
      const newListing: MarketplaceListing = {
        id: newListingId,
        farmer_id: userProfile?.id,
        user_id: currentAuthUserId || userProfile?.user_id,
        farmer_name: formData.farmer_name,
        crop_name: formData.crop_name,
        category: formData.category,
        price_uzs_per_unit: priceNum,
        unit: formData.unit,
        total_quantity: quantityNum,
        expected_date: formData.expected_date || 'Hozir mavjud',
        location_region: formData.location_region,
        phone_contact: formData.phone_contact,
        telegram_contact: formData.telegram_contact || undefined,
        description: formData.description || undefined,
        image_url: resolvedImageUrl,
        status: 'available',
        created_at: new Date().toISOString()
      };

      // 1. Insert into Supabase
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('marketplace_listings')
            .insert([{
              farmer_id: newListing.farmer_id || null,
              user_id: newListing.user_id || null,
              farmer_name: newListing.farmer_name,
              crop_name: newListing.crop_name,
              category: newListing.category,
              price_uzs_per_unit: newListing.price_uzs_per_unit,
              unit: newListing.unit,
              total_quantity: newListing.total_quantity,
              expected_date: newListing.expected_date,
              location_region: newListing.location_region,
              phone_contact: newListing.phone_contact,
              telegram_contact: newListing.telegram_contact,
              description: newListing.description,
              image_url: newListing.image_url,
              status: 'available'
            }])
            .select();

          if (!error && data?.[0]) {
            newListing.id = data[0].id;
          }
        } catch (err) {
          console.warn('Failed to insert listing into Supabase:', err);
        }
      }

      // 2. Track ownership in local state & storage
      const updatedMyIds = [...myListingIds, newListing.id];
      setMyListingIds(updatedMyIds);
      try {
        localStorage.setItem('ekinix_my_listing_ids', JSON.stringify(updatedMyIds));
        
        const savedLocal = localStorage.getItem('ekinix_my_created_listings');
        const list: MarketplaceListing[] = savedLocal ? JSON.parse(savedLocal) : [];
        list.unshift(newListing);
        localStorage.setItem('ekinix_my_created_listings', JSON.stringify(list));
      } catch {
        // ignore
      }

      // 3. Update React State
      setListings(prev => [newListing, ...prev]);
      showToast(currentLang === 'ru' ? "Объявление успешно опубликовано в Ekinix Bozor!" : "E'lon Ekinix Bozorida muvaffaqiyatli nashr etildi!");
    }

    setSubmitting(false);
    setCreateModalOpen(false);
    setEditingListing(null);
    resetForm();
  };

  // Change Listing Status (Available / Reserved / Sold)
  const handleChangeStatus = async (item: MarketplaceListing, newStatus: 'available' | 'reserved' | 'sold') => {
    const updatedItem = { ...item, status: newStatus };

    // 1. Update in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('marketplace_listings')
          .update({ status: newStatus })
          .eq('id', item.id);
      } catch (err) {
        console.warn('Supabase status update error:', err);
      }
    }

    // 2. Update local state
    setListings(prev => prev.map(l => l.id === item.id ? updatedItem : l));

    // 3. Update local storage
    try {
      const savedLocal = localStorage.getItem('ekinix_my_created_listings');
      if (savedLocal) {
        const list: MarketplaceListing[] = JSON.parse(savedLocal);
        const updatedList = list.map(l => l.id === item.id ? updatedItem : l);
        localStorage.setItem('ekinix_my_created_listings', JSON.stringify(updatedList));
      }
    } catch {
      // ignore
    }

    const statusLabelsUz = {
      available: "E'lon 'Mavjud' (Faol) holatiga o'tkazildi",
      reserved: "E'lon 'Band qilingan' holatiga o'tkazildi",
      sold: "E'lon 'Sotilgan' deb belgilandi va faol ro'yxatdan olindi"
    };
    const statusLabelsRu = {
      available: "Объявление снова активно!",
      reserved: "Объявление помечено как 'Забронировано'",
      sold: "Объявление отмечено как 'Продано' и скрыто из активных"
    };

    showToast(currentLang === 'ru' ? statusLabelsRu[newStatus] : statusLabelsUz[newStatus]);
  };

  // Delete Listing
  const handleDeleteListing = async (item: MarketplaceListing) => {
    const confirmMsg = currentLang === 'ru'
      ? `Вы действительно хотите удалить объявление "${item.crop_name}"?`
      : `Haqiqatdan ham "${item.crop_name}" e'lonini o'chirmoqchimisiz?`;

    if (!confirm(confirmMsg)) return;

    // 1. Delete from Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('marketplace_listings')
          .delete()
          .eq('id', item.id);
      } catch (err) {
        console.warn('Failed to delete listing from Supabase:', err);
      }
    }

    // 2. Update React state
    setListings(prev => prev.filter(l => l.id !== item.id));

    // 3. Update local storage
    try {
      const updatedMyIds = myListingIds.filter(id => id !== item.id);
      setMyListingIds(updatedMyIds);
      localStorage.setItem('ekinix_my_listing_ids', JSON.stringify(updatedMyIds));

      const savedLocal = localStorage.getItem('ekinix_my_created_listings');
      if (savedLocal) {
        const list: MarketplaceListing[] = JSON.parse(savedLocal);
        const updatedList = list.filter(l => l.id !== item.id);
        localStorage.setItem('ekinix_my_created_listings', JSON.stringify(updatedList));
      }
    } catch {
      // ignore
    }

    showToast(currentLang === 'ru' ? "Объявление успешно удалено" : "E'lon muvaffaqiyatli o'chirildi");
  };

  const resetForm = () => {
    setFormData({
      crop_name: '',
      category: 'sabzavot',
      price_uzs_per_unit: '',
      unit: 'kg',
      total_quantity: '',
      expected_date: 'Hozir mavjud',
      location_region: userProfile?.region || 'Toshkent viloyati',
      farmer_name: userProfile?.full_name || '',
      phone_contact: userProfile?.phone || '',
      telegram_contact: '',
      description: '',
      image_url: '',
      status: 'available'
    });
    setEditingListing(null);
  };

  const copyPhoneNumber = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const formatPriceWithSpaces = (val: string) => {
    if (!val) return '';
    const clean = val.replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Filter listings based on Search, Category, Region, and Status
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        item.crop_name.toLowerCase().includes(query) ||
        item.farmer_name.toLowerCase().includes(query) ||
        item.location_region.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query));

      // 2. Category Filter
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;

      // 3. Region Filter
      const matchesRegion = selectedRegion === 'all' || 
        item.location_region.toLowerCase().includes(selectedRegion.toLowerCase()) ||
        (selectedRegion === 'Barcha viloyatlar');

      // 4. Status Filter
      const itemStatus = item.status || 'available';
      let matchesStatus = true;

      if (statusFilter === 'all_active') {
        // Active = available or reserved (exclude sold)
        matchesStatus = itemStatus === 'available' || itemStatus === 'reserved';
      } else if (statusFilter === 'available') {
        matchesStatus = itemStatus === 'available';
      } else if (statusFilter === 'reserved') {
        matchesStatus = itemStatus === 'reserved';
      } else if (statusFilter === 'sold') {
        matchesStatus = itemStatus === 'sold';
      } else if (statusFilter === 'my_listings') {
        matchesStatus = isOwner(item);
      } else if (statusFilter === 'all') {
        matchesStatus = true;
      }

      return matchesSearch && matchesCat && matchesRegion && matchesStatus;
    });
  }, [listings, searchQuery, selectedCategory, selectedRegion, statusFilter, isOwner]);

  // Count active / my listings
  const activeCount = useMemo(() => {
    return listings.filter(l => (l.status || 'available') !== 'sold').length;
  }, [listings]);

  const myListingsCount = useMemo(() => {
    return listings.filter(l => isOwner(l)).length;
  }, [listings, isOwner]);

  return (
    <section id="marketplace-section" className="space-y-6">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#1F3D2B] text-[#FAF7F0] px-5 py-3.5 rounded-2xl shadow-2xl border border-[#D9A441] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md">
          <CheckCircle2 className="w-5 h-5 text-[#D9A441] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-auto text-[#FAF7F0]/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. SECTION HEADER BANNER */}
      <div className="bg-[#1F3D2B] text-[#FAF7F0] rounded-3xl p-6 sm:p-8 border-2 border-[#D9A441]/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#D9A441]/20 border border-[#D9A441]/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#D9A441]">
            <ShoppingBag className="w-4 h-4 text-[#D9A441]" />
            <span>{currentLang === 'ru' ? 'Рынок урожая Узбекистана' : currentLang === 'en' ? 'Uzbekistan Harvest Marketplace' : 'O\'zbekiston Hosil Bozori'}</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#FAF7F0]">
            {currentLang === 'ru' 
              ? 'Прямой рынок урожая от дехкан' 
              : currentLang === 'en' 
              ? 'Direct Farm-to-Buyer Harvest Market' 
              : 'Dehqondan To\'g\'ridan-to\'g\'ri Hosil Bozori'}
          </h2>

          <p className="text-sm text-[#FAF7F0]/85 leading-relaxed">
            {currentLang === 'ru'
              ? 'Размещайте объявления о готовом или ожидаемом урожае и продавайте оптовым покупателям по всему Узбекистану без посредников.'
              : currentLang === 'en'
              ? 'Post listings for available or upcoming harvests and connect directly with wholesale buyers across Uzbekistan without middlemen.'
              : 'Ekinlaringizni yoki kutilayotgan hosilingizni ulgurji va chakana xaridorlarga hech qanday vositachisiz to\'g\'ridan-to\'g\'ri soting.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              variant="accent"
              size="md"
              onClick={() => {
                resetForm();
                setCreateModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {currentLang === 'ru' ? 'Разместить объявление' : currentLang === 'en' ? 'Post New Listing' : '+ E\'lon Joylashtirish'}
            </Button>

            <Button
              variant={statusFilter === 'my_listings' ? 'secondary' : 'ghost'}
              size="md"
              onClick={() => setStatusFilter(statusFilter === 'my_listings' ? 'all_active' : 'my_listings')}
              leftIcon={<UserCheck className="w-4 h-4 text-[#D9A441]" />}
              className={statusFilter !== 'my_listings' ? 'bg-white/10 hover:bg-white/20 text-[#FAF7F0] border-white/20' : ''}
            >
              {currentLang === 'ru' ? `Мои объявления (${myListingsCount})` : currentLang === 'en' ? `My Listings (${myListingsCount})` : `Mening e'lonlarim (${myListingsCount})`}
            </Button>
          </div>
        </div>

        {/* Decorative Watermark */}
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
          <ShoppingBag className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-[#FAF7F0] p-5 sm:p-6 rounded-3xl border border-[#E4D9C4] shadow-sm space-y-4">
        
        {/* Top Row: Search Input & Region Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C7C6F]" />
            <input
              type="text"
              placeholder={currentLang === 'ru' ? "Поиск по названию культуры, региону или фермеру..." : currentLang === 'en' ? "Search by crop name, region, or farmer..." : "Ekin nomi, hudud yoki dehqon bo'yicha qidiring..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E4D9C4] rounded-2xl pl-11 pr-4 py-3 text-xs text-[#1F3D2B] placeholder-[#6C7C6F] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6C7C6F] hover:text-[#1F3D2B]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Region Filter */}
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D9A441]" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-white border border-[#E4D9C4] rounded-2xl pl-11 pr-8 py-3 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] shadow-2xs appearance-none cursor-pointer"
            >
              {UZBEKISTAN_REGIONS.map((reg) => (
                <option key={reg} value={reg === "Barcha viloyatlar" ? "all" : reg}>
                  {reg}
                </option>
              ))}
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6C7C6F] pointer-events-none" />
          </div>

        </div>

        {/* Bottom Row: Category Chips & Status Tabs */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2 border-t border-[#E4D9C4]/70">
          
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: currentLang === 'ru' ? 'Все категории' : currentLang === 'en' ? 'All' : 'Barchasi', icon: '🧺' },
              { id: 'sabzavot', label: currentLang === 'ru' ? 'Овощи' : currentLang === 'en' ? 'Vegetables' : 'Sabzavotlar', icon: '🥦' },
              { id: 'meva', label: currentLang === 'ru' ? 'Фрукты' : currentLang === 'en' ? 'Fruits' : 'Mevalar', icon: '🍎' },
              { id: 'don', label: currentLang === 'ru' ? 'Зерновые' : currentLang === 'en' ? 'Grains' : 'Don & G\'alla', icon: '🌾' },
              { id: 'paxta', label: currentLang === 'ru' ? 'Хлопок' : currentLang === 'en' ? 'Cotton' : 'Paxta', icon: '🌱' },
              { id: 'boshqa', label: currentLang === 'ru' ? 'Другое' : currentLang === 'en' ? 'Other' : 'Boshqa', icon: '📦' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-sm'
                    : 'bg-white text-[#4A5D4E] hover:bg-[#F0E8D8] border border-[#E4D9C4]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Status Filter Tabs (Faol / Barchasi / Mavjud / Band / Sotilgan / Mening) */}
          <div className="flex items-center bg-[#F0E8D8] p-1 rounded-2xl border border-[#E4D9C4] shrink-0 self-start lg:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setStatusFilter('all_active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'all_active'
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                  : 'text-[#5C4033] hover:text-[#1F3D2B]'
              }`}
            >
              {currentLang === 'ru' ? 'Активные' : currentLang === 'en' ? 'Active' : 'Faol e\'lonlar'}
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                  : 'text-[#5C4033] hover:text-[#1F3D2B]'
              }`}
            >
              {currentLang === 'ru' ? 'Все' : currentLang === 'en' ? 'All' : 'Barchasi'}
            </button>

            <button
              onClick={() => setStatusFilter('sold')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'sold'
                  ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                  : 'text-[#5C4033] hover:text-[#1F3D2B]'
              }`}
            >
              {currentLang === 'ru' ? 'Продано' : currentLang === 'en' ? 'Sold' : 'Sotilgan'}
            </button>

            <button
              onClick={() => setStatusFilter('my_listings')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                statusFilter === 'my_listings'
                  ? 'bg-[#D9A441] text-[#1F3D2B] shadow-xs font-extrabold'
                  : 'text-[#5C4033] hover:text-[#1F3D2B]'
              }`}
            >
              <span>{currentLang === 'ru' ? 'Мои' : currentLang === 'en' ? 'Mine' : 'Mening'}</span>
              {myListingsCount > 0 && (
                <span className="bg-[#1F3D2B] text-[#FAF7F0] text-[10px] px-1.5 py-0.2 rounded-full">
                  {myListingsCount}
                </span>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* 3. LISTINGS COUNTER & CONTROLS */}
      <div className="flex items-center justify-between text-xs text-[#6C7C6F] font-semibold px-1">
        <span>
          {currentLang === 'ru' 
            ? `Найдено объявлений: ${filteredListings.length}` 
            : currentLang === 'en' 
            ? `Found listings: ${filteredListings.length}` 
            : `${filteredListings.length} ta e'lon topildi`}
          {statusFilter === 'all_active' && ` (faqat faol)`}
          {statusFilter === 'sold' && ` (sotilganlar)`}
          {statusFilter === 'my_listings' && ` (sizning e'lonlaringiz)`}
        </span>

        {(searchQuery || selectedCategory !== 'all' || selectedRegion !== 'all' || statusFilter !== 'all_active') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedRegion('all');
              setStatusFilter('all_active');
            }}
            className="text-[#B8852B] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> 
            <span>{currentLang === 'ru' ? 'Сбросить фильтры' : currentLang === 'en' ? 'Reset filters' : 'Filterlarni tozalash'}</span>
          </button>
        )}
      </div>

      {/* 4. LISTINGS GRID OR REAL EMPTY/ERROR/LOADING STATE */}
      {loading ? (
        <div className="py-4">
          <CardSkeleton count={6} height="h-96" />
        </div>
      ) : fetchError ? (
        <div className="py-8">
          <ErrorState
            title={
              currentLang === 'ru'
                ? 'Ошибка загрузки объявлений'
                : currentLang === 'en'
                ? 'Error loading marketplace listings'
                : "Bozor e'lonlarini yuklashda xatolik"
            }
            message={fetchError}
            onRetry={loadListings}
            retryText={currentLang === 'ru' ? 'Повторить' : currentLang === 'en' ? 'Retry' : 'Qayta urinish'}
          />
        </div>
      ) : filteredListings.length === 0 ? (
        /* PROPER EMPTY STATE: Explicit requirement when no listings exist */
        <EmptyState
          icon={<Package className="w-7 h-7 text-[#D9A441]" />}
          badge={statusFilter === 'my_listings' ? "Sizning e'lonlaringiz" : "Ekinix Bozor"}
          title={
            currentLang === 'ru' 
              ? 'Пока нет объявлений — станьте первым, кто разместит объявление' 
              : currentLang === 'en' 
              ? 'No listings yet — be the first to post a harvest listing' 
              : "Hozircha e'lonlar yo'q — birinchi bo'lib e'lon joylashtiring"
          }
          description={
            statusFilter === 'my_listings'
              ? (currentLang === 'ru' 
                  ? 'У вас пока нет опубликованных объявлений. Разместите свой первый урожай на Ekinix Bozor!' 
                  : "Siz hali e'lon joylashtirmagansiz. Hosilingizni birinchi bo'lib bozorga chiqaring!")
              : (currentLang === 'ru'
                  ? 'Фермеры со всего Узбекистана могут выставить свой урожай на продажу напрямую покупателям.'
                  : "O'zbekiston bo'ylab dehqonlar o'z hosillarini to'g'ridan-to'g'ri xaridorlarga sotish uchun e'lon joylashtirishlari mumkin.")
          }
          actionText={currentLang === 'ru' ? 'Разместить объявление' : currentLang === 'en' ? 'Post Listing' : "E'lon Joylashtirish"}
          actionIcon={<Plus className="w-4 h-4 text-[#D9A441]" />}
          onAction={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
          className="my-6"
        />
      ) : (
        /* LISTINGS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => {
            const userIsOwner = isOwner(item);
            const itemStatus = item.status || 'available';
            const isSold = itemStatus === 'sold';
            const isReserved = itemStatus === 'reserved';
            const isAvailable = itemStatus === 'available';

            return (
              <div
                key={item.id}
                className={`bg-[#FAF7F0] rounded-3xl overflow-hidden border-2 transition-all flex flex-col justify-between group relative ${
                  isSold 
                    ? 'border-gray-300 opacity-85 shadow-sm bg-gray-50/50' 
                    : userIsOwner 
                    ? 'border-[#D9A441] shadow-md hover:shadow-xl ring-2 ring-[#D9A441]/20' 
                    : 'border-[#E4D9C4] hover:border-[#D9A441] shadow-md hover:shadow-xl'
                }`}
              >
                {/* CARD TOP: IMAGE & BADGES */}
                <div>
                  <div className="relative h-48 w-full bg-[#1F3D2B]/10 overflow-hidden">
                    <NextImage
                      src={item.image_url || DEFAULT_CROP_IMAGES.default}
                      alt={item.crop_name}
                      fill
                      referrerPolicy="no-referrer"
                      className={`object-cover transition-transform duration-500 ${
                        isSold ? 'grayscale-[50%] brightness-90' : 'group-hover:scale-105'
                      }`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Top Left: Status Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                      {isSold ? (
                        <span className="bg-rose-900/90 backdrop-blur-md text-rose-100 font-extrabold text-[11px] px-3 py-1 rounded-full border border-rose-400/40 shadow-md inline-flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5 text-rose-300" />
                          <span>{currentLang === 'ru' ? 'Продано' : currentLang === 'en' ? 'Sold' : 'Sotilgan'}</span>
                        </span>
                      ) : isReserved ? (
                        <span className="bg-amber-800/90 backdrop-blur-md text-amber-100 font-extrabold text-[11px] px-3 py-1 rounded-full border border-amber-400/30 shadow-md inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-300" />
                          <span>{currentLang === 'ru' ? 'Забронировано' : currentLang === 'en' ? 'Reserved' : 'Band qilingan'}</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-800/90 backdrop-blur-md text-emerald-100 font-extrabold text-[11px] px-3 py-1 rounded-full border border-emerald-400/30 shadow-md inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>{item.expected_date || (currentLang === 'ru' ? 'В наличии' : 'Hozir mavjud')}</span>
                        </span>
                      )}

                      {/* Owner Badge */}
                      {userIsOwner && (
                        <span className="bg-[#D9A441] text-[#1F3D2B] font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-md inline-flex items-center gap-1 border border-white/40">
                          <UserCheck className="w-3 h-3" />
                          <span>{currentLang === 'ru' ? 'Ваше объявление' : currentLang === 'en' ? 'Your Listing' : 'Sizning e\'loningiz'}</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Image Tag: Quantity & Region */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="bg-[#1F3D2B]/90 backdrop-blur-md text-[#FAF7F0] font-bold text-xs px-3 py-1.5 rounded-xl border border-white/20">
                        📦 {item.total_quantity} {item.unit}
                      </span>
                      <span className="text-[11px] font-semibold text-white/90 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {item.location_region.split(',')[0]}
                      </span>
                    </div>
                  </div>

                  {/* CARD BODY */}
                  <div className="p-5 space-y-3">
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#F0E8D8] text-[#5C4033] px-2.5 py-1 rounded-md border border-[#E4D9C4]">
                        {item.category === 'sabzavot' ? (currentLang === 'ru' ? 'Овощи' : 'Sabzavot') :
                         item.category === 'meva' ? (currentLang === 'ru' ? 'Фрукты' : 'Meva') :
                         item.category === 'don' ? (currentLang === 'ru' ? 'Зерновые' : 'Don & G\'alla') :
                         item.category === 'paxta' ? (currentLang === 'ru' ? 'Хлопок' : 'Paxta') :
                         (currentLang === 'ru' ? 'Сельхоз' : 'Qishloq Xo\'jaligi')}
                      </span>
                      <span className="text-[11px] text-[#6C7C6F] font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{currentLang === 'ru' ? 'Проверен' : 'Tasdiqlangan'}</span>
                      </span>
                    </div>

                    <h3 className={`font-serif text-lg font-bold leading-snug transition-colors ${
                      isSold ? 'text-gray-500 line-through' : 'text-[#1F3D2B] group-hover:text-[#B8852B]'
                    }`}>
                      {item.crop_name}
                    </h3>

                    <div className="space-y-1 text-xs text-[#4A5D4E]">
                      <p className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                        <span>{item.location_region}</span>
                      </p>
                      <p className="text-[#6C7C6F]">
                        {currentLang === 'ru' ? 'Продавец: ' : 'Sotuvchi: '}
                        <strong className="text-[#1F3D2B]">{item.farmer_name}</strong>
                      </p>
                    </div>

                    {item.description && (
                      <p className="text-xs text-[#6C7C6F] line-clamp-2 italic pt-1 border-t border-[#E4D9C4]">
                        &ldquo;{item.description}&rdquo;
                      </p>
                    )}

                  </div>
                </div>

                {/* CARD FOOTER & OWNER CONTROLS */}
                <div className="p-5 pt-0 space-y-3">
                  
                  {/* Price Row */}
                  <div className="pt-3 border-t border-[#E4D9C4] flex items-baseline justify-between">
                    <span className="text-xs text-[#6C7C6F] font-semibold">
                      {currentLang === 'ru' ? 'Ориентировочная цена:' : 'Mo\'ljallangan narx:'}
                    </span>
                    <span className="text-base font-serif font-extrabold text-[#1F3D2B]">
                      {item.price_uzs_per_unit ? (
                        <>
                          {item.price_uzs_per_unit.toLocaleString()} <span className="text-xs font-sans font-normal text-[#6C7C6F]">so&apos;m/{item.unit}</span>
                        </>
                      ) : (
                        <span className="text-sm font-sans text-[#B8852B] font-bold">
                          {currentLang === 'ru' ? 'Договорная' : 'Kelishilgan narxda'}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* OWNER ACTION CONTROLS (Only visible to creator) */}
                  {userIsOwner ? (
                    <div className="bg-[#F0E8D8] p-3 rounded-2xl border border-[#E4D9C4] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#5C4033]">
                        <span>{currentLang === 'ru' ? 'Управление объявлением:' : 'E\'lon boshqaruvi:'}</span>
                        <span className="text-[10px] text-[#B8852B] font-extrabold uppercase">
                          {itemStatus}
                        </span>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {isAvailable && (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleChangeStatus(item, 'sold')}
                              leftIcon={<Ban className="w-3.5 h-3.5" />}
                              className="text-[11px] py-1.5 w-full"
                              title="E'lonni sotilgan deb belgilash va faol ro'yxatdan olish"
                            >
                              {currentLang === 'ru' ? 'Продано' : 'Sotildi'}
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleChangeStatus(item, 'reserved')}
                              leftIcon={<Clock className="w-3.5 h-3.5" />}
                              className="text-[11px] py-1.5 w-full bg-amber-700 hover:bg-amber-800 text-white border-amber-800"
                            >
                              {currentLang === 'ru' ? 'Забронировать' : 'Band qilish'}
                            </Button>
                          </>
                        )}

                        {isReserved && (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleChangeStatus(item, 'sold')}
                              leftIcon={<Ban className="w-3.5 h-3.5" />}
                              className="text-[11px] py-1.5 w-full"
                            >
                              {currentLang === 'ru' ? 'Продано' : 'Sotildi'}
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleChangeStatus(item, 'available')}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#D9A441]" />}
                              className="text-[11px] py-1.5 w-full"
                            >
                              {currentLang === 'ru' ? 'Активно' : 'Faol qilish'}
                            </Button>
                          </>
                        )}

                        {isSold && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleChangeStatus(item, 'available')}
                            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#D9A441]" />}
                            className="col-span-2 text-[11px] py-1.5 w-full"
                          >
                            {currentLang === 'ru' ? 'Вернуть в активные' : 'Qayta sotuvga chiqarish'}
                          </Button>
                        )}
                      </div>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          leftIcon={<Edit3 className="w-3.5 h-3.5 text-[#D9A441]" />}
                          className="flex-1 text-[11px] py-1.5"
                        >
                          {currentLang === 'ru' ? 'Редактировать' : 'Tahrirlash'}
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteListing(item)}
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                          className="text-[11px] py-1.5 px-3"
                          title="E'lonni butunlay o'chirish"
                        >
                          {currentLang === 'ru' ? 'Удалить' : 'O\'chirish'}
                        </Button>
                      </div>

                    </div>
                  ) : (
                    /* PUBLIC CONTACT BUTTON */
                    <Button
                      variant={isSold ? 'ghost' : 'primary'}
                      size="md"
                      onClick={() => setContactModalItem(item)}
                      disabled={isSold}
                      leftIcon={<Phone className={`w-4 h-4 ${isSold ? 'text-gray-400' : 'text-[#D9A441]'}`} />}
                      className={`w-full ${isSold ? 'bg-gray-200 text-gray-500 border border-gray-300' : ''}`}
                    >
                      {isSold 
                        ? (currentLang === 'ru' ? 'Товар продан' : 'Mahsulot sotilgan')
                        : (currentLang === 'ru' ? 'Связаться с фермером' : 'Dehqon Bilan Bog\'lanish')}
                    </Button>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CREATE / EDIT LISTING MODAL ==================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#E4D9C4] max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8">
            
            <button
              onClick={() => {
                setCreateModalOpen(false);
                setEditingListing(null);
              }}
              className="absolute top-5 right-5 text-[#6C7C6F] hover:text-[#1F3D2B] p-2 rounded-full hover:bg-[#E4D9C4]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B8852B] uppercase tracking-wider bg-[#D9A441]/20 px-3 py-1 rounded-full border border-[#D9A441]/30">
                {editingListing ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{editingListing ? (currentLang === 'ru' ? 'Редактирование объявления' : 'E\'lonni Tahrirlash') : (currentLang === 'ru' ? 'Размещение объявления' : 'E\'lon Joylashtirish')}</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#1F3D2B]">
                {editingListing 
                  ? (currentLang === 'ru' ? 'Обновите данные о вашем урожае' : 'Hosil ma\'lumotlarini yangilang') 
                  : (currentLang === 'ru' ? 'Выставьте ваш урожай на рынок' : 'Hosilingizni Bozorga Chiqaring')}
              </h3>
              <p className="text-xs text-[#4A5D4E]">
                {currentLang === 'ru'
                  ? 'Это объявление увидят оптовые и розничные покупатели по всему Узбекистану.'
                  : 'Ushbu e\'lon respublika bo\'ylab ulgurji va chakana xaridorlarga ko\'rinadi.'}
              </p>
            </div>

            <form onSubmit={handleSaveListing} className="space-y-4">
              
              {/* Crop Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Название культуры / товара *' : 'Ekin / Mahsulot nomi *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Surxondaryo Pushti Pomidori, Gala Olmasi"
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Категория *' : 'Kategoriya *'}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  >
                    <option value="sabzavot">🥦 Sabzavotlar (Овощи)</option>
                    <option value="meva">🍎 Meva &amp; Bog&apos;dorchilik (Фрукты)</option>
                    <option value="don">🌾 Don va G&apos;alla (Зерновые)</option>
                    <option value="paxta">🌱 Paxta va Sanoat (Хлопок)</option>
                    <option value="boshqa">📦 Boshqa mahsulotlar (Другое)</option>
                  </select>
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Объем урожая *' : 'Mavjud / Kutilayotgan Miqdor *'}
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
                    {currentLang === 'ru' ? 'Единица измерения *' : 'O\'lchov birligi *'}
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  >
                    <option value="tonna">tonna (т)</option>
                    <option value="kg">kg (кг)</option>
                    <option value="qop">qop (мешок)</option>
                    <option value="qutisi">qutisi (ящик)</option>
                    <option value="dona">dona (шт)</option>
                  </select>
                </div>
              </div>

              {/* Expected Date & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Срок готовности' : 'Mavjud bo\'lish vaqti'}
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
                    {currentLang === 'ru' ? 'Ориентировочная цена (UZS)' : 'Mo\'ljallangan Narx (so\'m)'} <span className="text-[#6C7C6F] font-normal">(Bo&apos;sh = Kelishilgan)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Masalan: 6 500"
                    value={formatPriceWithSpaces(formData.price_uzs_per_unit)}
                    onChange={(e) => {
                      const cleanNumber = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, price_uzs_per_unit: cleanNumber });
                    }}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>
              </div>

              {/* Region & Farmer Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Регион / Область *' : 'Viloyat / Hudud *'}
                  </label>
                  <select
                    value={formData.location_region}
                    onChange={(e) => setFormData({ ...formData, location_region: e.target.value })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  >
                    {UZBEKISTAN_REGIONS.filter(r => r !== "Barcha viloyatlar").map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Имя продавца / Фермерское хозяйство *' : 'Sotuvchi Ismi / Fermer Xo\'jaligi *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Abdumo'min dehqon"
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
                    {currentLang === 'ru' ? 'Номер телефона *' : 'Telefon raqam *'}
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
                    {currentLang === 'ru' ? 'Telegram ник (Опционально)' : 'Telegram nik (Ixtiyoriy)'}
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

              {/* Status Field (if editing) */}
              {editingListing && (
                <div>
                  <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                    {currentLang === 'ru' ? 'Статус объявления *' : 'E\'lon holati *'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  >
                    <option value="available">🟢 Mavjud / Faol (В наличии / Активно)</option>
                    <option value="reserved">🟡 Band qilingan (Забронировано)</option>
                    <option value="sold">🔴 Sotilgan (Продано)</option>
                  </select>
                </div>
              )}

              {/* REAL PHOTO UPLOAD TO SUPABASE STORAGE */}
              <div className="bg-white p-4 rounded-2xl border border-[#E4D9C4] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#1F3D2B]">
                      {currentLang === 'ru' ? 'Фотография урожая' : 'Mahsulot / Hosil Rasmi'}
                    </label>
                    <p className="text-[11px] text-[#6C7C6F]">
                      {currentLang === 'ru' ? 'Объявления с фото привлекают в 3 раза больше покупателей' : 'Rasmli e\'lonlar 3 barobar ko\'proq xaridorlarni jalb qiladi'}
                    </p>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="flex items-center bg-[#FAF7F0] p-1 rounded-xl border border-[#E4D9C4] text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setImageUploadTab('upload')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        imageUploadTab === 'upload'
                          ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                          : 'text-[#6C7C6F] hover:text-[#1F3D2B]'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{currentLang === 'ru' ? 'Файл / Камера' : 'Fayl / Kamera'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadTab('presets')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        imageUploadTab === 'presets'
                          ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                          : 'text-[#6C7C6F] hover:text-[#1F3D2B]'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{currentLang === 'ru' ? 'Галерея' : 'Tayyor'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadTab('url')}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        imageUploadTab === 'url'
                          ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                          : 'text-[#6C7C6F] hover:text-[#1F3D2B]'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>URL</span>
                    </button>
                  </div>
                </div>

                {/* Hidden File Inputs for real image upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Current Image Preview Card */}
                {formData.image_url ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#D9A441] bg-[#FAF7F0] p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/10 shrink-0 border border-[#E4D9C4]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={formData.image_url}
                          alt="Tanlangan rasm"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> {currentLang === 'ru' ? 'Фото прикреплено' : 'Rasm yuklandi'}
                        </span>
                        <p className="text-xs font-bold text-[#1F3D2B] truncate mt-1">
                          {formData.crop_name || "Hosil rasmi"}
                        </p>
                        <p className="text-[10px] text-[#6C7C6F]">
                          {currentLang === 'ru' ? 'Сохранено в хранилище Supabase' : 'Supabase Storage bazasida saqlandi'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-xs font-bold text-[#1F3D2B] bg-white hover:bg-[#F0E8D8] border border-[#E4D9C4] rounded-xl transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Boshqa rasm yuklash"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#D9A441]" />
                        <span className="hidden sm:inline">{currentLang === 'ru' ? 'Заменить' : 'O\'zgartirish'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                        className="p-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Rasmni o'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span className="hidden sm:inline">{currentLang === 'ru' ? 'Удалить' : 'O\'chirish'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Tab 1: Real Storage Upload / Camera */}
                    {imageUploadTab === 'upload' && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                          isDragging
                            ? 'border-[#1F3D2B] bg-[#1F3D2B]/10 scale-[1.01]'
                            : 'border-[#D9A441] bg-[#FAF7F0]/60 hover:bg-[#FAF7F0]'
                        }`}
                      >
                        {uploadingImage ? (
                          <div className="py-4 flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-7 h-7 text-[#D9A441] animate-spin" />
                            <p className="text-xs font-bold text-[#1F3D2B]">
                              {currentLang === 'ru' ? 'Сжатие и загрузка фото в Supabase Storage...' : 'Rasm siqilmoqda va Supabase Storage ga yuklanmoqda...'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B]/10 text-[#1F3D2B] flex items-center justify-center mx-auto">
                              <Upload className="w-6 h-6 text-[#D9A441]" />
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs font-bold text-[#1F3D2B]">
                                {currentLang === 'ru' ? 'Перетащите фото сюда или выберите файл' : 'Rasmni bu yerga tashlang yoki tanlang'}
                              </p>
                              <p className="text-[10px] text-[#6C7C6F]">
                                JPG, PNG, WEBP formatlari qabul qilinadi
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3.5 py-2 bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5 text-[#D9A441]" />
                                <span>{currentLang === 'ru' ? 'Выбрать из галереи' : 'Galereyadan tanlash'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => cameraInputRef.current?.click()}
                                className="px-3.5 py-2 bg-white hover:bg-[#F0E8D8] text-[#1F3D2B] text-xs font-bold rounded-xl transition-all border border-[#E4D9C4] shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Camera className="w-3.5 h-3.5 text-[#D9A441]" />
                                <span>{currentLang === 'ru' ? 'Снять на камеру' : 'Kameradan olish'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Presets Gallery */}
                    {imageUploadTab === 'presets' && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-[#6C7C6F]">
                          {currentLang === 'ru' ? 'Выберите подходящее фото культуры:' : 'Ekingizga mos tayyor professional rasmni tanlang:'}
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-40 overflow-y-auto p-1">
                          {PRESET_CROP_LIST.map((crop) => (
                            <button
                              key={crop.key}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, image_url: crop.img }))}
                              className="group p-1 bg-white hover:bg-[#F0E8D8] border border-[#E4D9C4] hover:border-[#D9A441] rounded-xl transition-all flex flex-col items-center text-center shadow-2xs cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/10 relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={crop.img}
                                  alt={crop.nameUz}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                              </div>
                              <span className="text-[10px] font-bold text-[#1F3D2B] truncate w-full mt-1">
                                {crop.nameUz}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tab 3: URL link */}
                    {imageUploadTab === 'url' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-[#1F3D2B]">
                          {currentLang === 'ru' ? 'Прямая ссылка на фото (URL)' : 'Rasm internet havolasi (URL)'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            className="flex-1 bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2 text-xs text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#1F3D2B] mb-1">
                  {currentLang === 'ru' ? 'Дополнительная информация (Опционально)' : 'Qo\'shimcha ma\'lumot (Ixtiyoriy)'}
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
                  className="w-full bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-sm py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border border-[#D9A441]/40 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <RefreshCw className="w-5 h-5 text-[#D9A441] animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#D9A441]" />
                      <span>{editingListing ? (currentLang === 'ru' ? 'Сохранить изменения' : 'O\'zgarishlarni Saqlash') : (currentLang === 'ru' ? 'Опубликовать на Ekinix Bozor' : 'E\'lonni Ekinix Bozorida Nashr Etish')}</span>
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
              className="absolute top-4 right-4 text-[#6C7C6F] hover:text-[#1F3D2B] p-1.5 rounded-full hover:bg-[#E4D9C4]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-[#E4D9C4] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1F3D2B] text-[#D9A441] flex items-center justify-center font-serif text-xl font-bold shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#B8852B] uppercase tracking-wider bg-[#D9A441]/20 px-2.5 py-0.5 rounded-full border border-[#D9A441]/30">
                  {currentLang === 'ru' ? 'Связь с продавцом' : 'Dehqon bilan bog\'lanish'}
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
                <strong>{currentLang === 'ru' ? 'Количество: ' : 'Miqdori: '}</strong> {contactModalItem.total_quantity} {contactModalItem.unit}
              </p>
              <p className="text-[#4A5D4E]">
                <strong>{currentLang === 'ru' ? 'Регион: ' : 'Joylashuvi: '}</strong> {contactModalItem.location_region}
              </p>
              <p className="text-[#4A5D4E]">
                <strong>{currentLang === 'ru' ? 'Цена: ' : 'Mo\'ljallangan narx: '}</strong> {contactModalItem.price_uzs_per_unit ? `${contactModalItem.price_uzs_per_unit.toLocaleString()} so'm / ${contactModalItem.unit}` : 'Kelishilgan narxda'}
              </p>
            </div>

            {/* Direct Phone Call Button */}
            <div className="space-y-3 pt-1">
              <a
                href={`tel:${contactModalItem.phone_contact.replace(/\s+/g, '')}`}
                className="w-full bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-sm py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 border border-[#D9A441]/40"
              >
                <Phone className="w-5 h-5 text-[#D9A441]" />
                <span>{currentLang === 'ru' ? 'Позвонить' : 'Qo\'ng\'iroq Qilish'} ({contactModalItem.phone_contact})</span>
              </a>

              {/* Copy Phone Button */}
              <button
                onClick={() => copyPhoneNumber(contactModalItem.phone_contact)}
                className="w-full bg-white hover:bg-[#F0E8D8] text-[#1F3D2B] font-bold text-xs py-2.5 rounded-xl transition-all border border-[#E4D9C4] flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">{currentLang === 'ru' ? 'Номер скопирован!' : 'Raqam nusxalandi!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#6C7C6F]" />
                    <span>{currentLang === 'ru' ? 'Скопировать номер' : 'Raqamdan nusxa olish'}</span>
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
                  <span>Telegram: {contactModalItem.telegram_contact}</span>
                </a>
              )}
            </div>

            <p className="text-[11px] text-[#6C7C6F] text-center italic pt-2 border-t border-[#E4D9C4]">
              💡 {currentLang === 'ru' 
                ? 'Ekinix связывает дехкан и покупателей напрямую. Условия сделки согласуются сторонами.'
                : 'Ekinix xaridor va sotuvchilarni to\'g\'ridan-to\'g\'ri bog\'laydi. Shartnoma va to\'lov holatlarini mustaqil kelishib oling.'}
            </p>

          </div>
        </div>
      )}

    </section>
  );
};
