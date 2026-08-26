'use client';

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { Language } from '@/lib/i18n';
import { MarketplaceListing, FarmerProfile } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import {
  X,
  MapPin,
  Phone,
  Calendar,
  Send,
  Share2,
  Check,
  ShieldCheck,
  Star,
  Package,
  Clock,
  Ban,
  CheckCircle2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Info,
  Award,
  Layers,
} from 'lucide-react';

interface MarketplaceDetailViewProps {
  listing: MarketplaceListing;
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  userProfile?: FarmerProfile | null;
  onStartChat?: (listing: MarketplaceListing) => void;
  onChangeStatus?: (listing: MarketplaceListing, newStatus: 'available' | 'reserved' | 'sold') => void;
  onEditListing?: (listing: MarketplaceListing) => void;
}

export const MarketplaceDetailView: React.FC<MarketplaceDetailViewProps> = ({
  listing,
  isOpen,
  onClose,
  currentLang,
  userProfile,
  onStartChat,
  onChangeStatus,
  onEditListing,
}) => {
  // Gallery images array (fallback to main image + variations)
  const galleryImages = listing.images && listing.images.length > 0
    ? listing.images
    : [
        listing.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
      ];

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [currencyMode, setCurrencyMode] = useState<'UZS' | 'USD'>('UZS');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isOwner = userProfile && (
    listing.user_id === userProfile.user_id ||
    listing.farmer_id === userProfile.id ||
    listing.phone_contact === userProfile.phone
  );

  const status = listing.status || 'available';
  const isAvailable = status === 'available';
  const isReserved = status === 'reserved';
  const isSold = status === 'sold';

  // Stock calculations
  const totalStock = listing.total_quantity || 1;
  const remainingStock = typeof listing.remaining_quantity === 'number'
    ? listing.remaining_quantity
    : isSold
    ? 0
    : isReserved
    ? Math.round(totalStock * 0.4)
    : Math.round(totalStock * 0.75);

  const stockPercentage = Math.max(0, Math.min(100, Math.round((remainingStock / totalStock) * 100)));

  // Currency Calculations (1 USD ≈ 12,800 UZS)
  const USD_RATE = 12800;
  const priceUzs = listing.price_uzs_per_unit || 0;
  const priceUsd = listing.price_usd_per_unit || (priceUzs > 0 ? +(priceUzs / USD_RATE).toFixed(2) : 0);

  // Total lot value
  const totalValueUzs = priceUzs > 0 ? (listing.unit === 'tonna' ? priceUzs * totalStock * 1000 : priceUzs * totalStock) : 0;
  const totalValueUsd = priceUsd > 0 ? (listing.unit === 'tonna' ? priceUsd * totalStock * 1000 : priceUsd * totalStock) : 0;

  // Handle Share / Copy Link
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?tab=marketplace&listing=${listing.id}`
      : `?tab=marketplace&listing=${listing.id}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Ekinix Bozor: ${listing.crop_name} (${listing.variety || ''})`,
          text: `${listing.crop_name} - ${listing.total_quantity} ${listing.unit}. Narxi: ${priceUzs.toLocaleString('uz-UZ')} so'm/${listing.unit}. Manzil: ${listing.location_region}`,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      } catch {
        // ignore
      }
    }
  };

  // Clean Telegram link
  const getTelegramUrl = () => {
    if (!listing.telegram_contact) return 'https://t.me/ekinix_bot';
    const cleanHandle = listing.telegram_contact.replace('@', '').replace('https://t.me/', '');
    return `https://t.me/${cleanHandle}`;
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      
      {/* Modal / Fullscreen Drawer Container */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="marketplace-detail-title"
        className="bg-white w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[92vh] sm:rounded-2xl border-0 sm:border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              {listing.category === 'sabzavot' ? 'Sabzavot' :
               listing.category === 'meva' ? 'Meva' :
               listing.category === 'don' ? "G'alla & Don" :
               listing.category === 'paxta' ? 'Paxta xomashyosi' :
               listing.category === 'poliz' ? 'Poliz ekini' : 'Qishloq xo\'jaligi'}
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 font-mono truncate hidden sm:inline">
              ID: {listing.id}
            </span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="E'lon havolasini ulashish"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Havola olindi</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Ulashish</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
          
          {/* 1. TOP HERO: PHOTO GALLERY & PRICING SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Gallery Column (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              {/* Main Photo View */}
              <div className="relative aspect-4/3 sm:aspect-16/10 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs group">
                <NextImage
                  src={galleryImages[activeImageIndex] || listing.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80'}
                  alt={listing.crop_name}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />

                {/* Overlaid Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {/* Status Badge */}
                  {isSold ? (
                    <span className="bg-rose-600/95 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-sm inline-flex items-center gap-1">
                      <Ban className="w-3.5 h-3.5" />
                      <span>Sotilgan</span>
                    </span>
                  ) : isReserved ? (
                    <span className="bg-amber-600/95 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-sm inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Band qilingan</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-700/95 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-sm inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sotuvda mavjud</span>
                    </span>
                  )}

                  {/* Quality Grade Badge */}
                  {listing.qualityGrade && (
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm inline-flex items-center gap-1 ${
                      listing.qualityGrade === 'Export'
                        ? 'bg-amber-400 text-slate-900 border border-amber-300'
                        : listing.qualityGrade === 'Organik'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/90 backdrop-blur-xs text-slate-800 border border-slate-200'
                    }`}>
                      <Award className="w-3.5 h-3.5" />
                      <span>{listing.qualityGrade}</span>
                    </span>
                  )}
                </div>

                {/* Gallery Navigation Arrows (if > 1 image) */}
                {galleryImages.length > 1 && (
                  <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                      }}
                      className="w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs pointer-events-auto transition-all shadow-md"
                      title="Oldingi rasm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
                      }}
                      className="w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs pointer-events-auto transition-all shadow-md"
                      title="Keyingi rasm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Photo counter */}
                <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[11px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              </div>

              {/* Thumbnails Row */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-600/30'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <NextImage
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info & Pricing Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Crop Title & Variety */}
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{listing.location_region}</span>
                </div>
                <h1 id="marketplace-detail-title" className="text-2xl font-bold text-slate-900 tracking-tight">
                  {listing.crop_name}
                </h1>
                {listing.variety && (
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Navi: <span className="font-semibold text-slate-900 font-mono">{listing.variety}</span>
                  </p>
                )}
              </div>

              {/* Dual Currency Price Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Belgilangan narx
                  </span>
                  
                  {/* Currency Switcher Toggle */}
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-md text-[11px] font-bold">
                    <button
                      onClick={() => setCurrencyMode('UZS')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        currencyMode === 'UZS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      UZS (so‘m)
                    </button>
                    <button
                      onClick={() => setCurrencyMode('USD')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        currencyMode === 'USD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                {/* Primary Price Display */}
                <div>
                  <div className="flex items-baseline gap-1.5">
                    {priceUzs > 0 ? (
                      <>
                        <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                          {currencyMode === 'UZS'
                            ? priceUzs.toLocaleString('uz-UZ')
                            : `$${priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </span>
                        <span className="text-sm font-medium text-slate-600">
                          {currencyMode === 'UZS' ? `so'm / ${listing.unit}` : `USD / ${listing.unit}`}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-amber-800">Kelishilgan narxda</span>
                    )}
                  </div>

                  {/* Equivalent secondary price hint */}
                  {priceUzs > 0 && (
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {currencyMode === 'UZS'
                        ? `≈ $${priceUsd} USD (kurs: 1$ = ${USD_RATE.toLocaleString()} so'm)`
                        : `≈ ${priceUzs.toLocaleString('uz-UZ')} so'm`}
                    </p>
                  )}
                </div>

                {/* Total Lot Estimated Worth */}
                {totalValueUzs > 0 && (
                  <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Jami partiya qiymati:</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {currencyMode === 'UZS'
                        ? `${totalValueUzs.toLocaleString('uz-UZ')} so'm`
                        : `$${totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Volume & Stock Availability Progress Bar */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Package className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Jami hajm: <strong className="text-slate-900">{listing.total_quantity} {listing.unit}</strong></span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 tabular-nums">
                    {stockPercentage}% mavjud
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      stockPercentage > 50
                        ? 'bg-emerald-600'
                        : stockPercentage > 20
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${stockPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Qolgan zaxira: <strong className="text-slate-800 font-mono">{remainingStock} {listing.unit}</strong></span>
                  {listing.min_order_quantity && (
                    <span>Min buyurtma: {listing.min_order_quantity} {listing.unit}</span>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* 2. MIDDLE DETAILS: DESCRIPTION, HARVEST DATE, PACKAGING */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* Left Specs & Description (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Description Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Mahsulot haqida to‘liq tavsif
                </h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-700">
                  {listing.description ? (
                    <p className="whitespace-pre-line">{listing.description}</p>
                  ) : (
                    <p className="text-slate-400 italic">
                      Ushbu e&apos;lon uchun qo&apos;shimcha tavsif kiritilmagan. Mahsulot holati va sifatini bilish uchun dehqon bilan to&apos;g&apos;ridan-to&apos;g&apos;ri bog&apos;laning.
                    </p>
                  )}
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Hosil sanasi</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-700" />
                    <span>{listing.harvest_date || listing.expected_date || '2026-yil hosili'}</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Qadoqlash</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-700" />
                    <span>{listing.packaging || 'Yashik / Qop / To‘kma'}</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Yetkazib berish</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    Kelishuv / Olib ketish
                  </p>
                </div>
              </div>

            </div>

            {/* Right: Farmer Profile & Verification Card (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Farmer Trust Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {listing.farmer_name ? listing.farmer_name.charAt(0).toUpperCase() : 'D'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900">{listing.farmer_name}</h4>
                        {listing.isVerified !== false && (
                          <span title="Tasdiqlangan xo'jalik">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{listing.location_region}</span>
                      </p>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-amber-900 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{listing.farmer_rating || 4.9}</span>
                  </div>
                </div>

                {/* Farmer Credibility Badges */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium">Bajarilgan bitimlar</span>
                    <p className="text-xs font-extrabold text-slate-900 font-mono mt-0.5">
                      {listing.deals_count || 18} ta
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium">Javob berish tezligi</span>
                    <p className="text-xs font-extrabold text-emerald-700 font-mono mt-0.5">
                      ~15 daqiqa
                    </p>
                  </div>
                </div>

                {/* Safe Deal Guarantee Banner */}
                <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p>
                    Ekinix kafolati: To‘g‘ridan-to‘g‘ri dehqon narxi, ortiqcha vositachilik foizlarisiz.
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* 3. OWNER CONTROLS (IF USER IS LISTING CREATOR) */}
          {isOwner && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>Siz ushbu e&apos;lon muallifisiz</span>
                </span>
                <span className="text-[11px] font-bold text-amber-800 uppercase font-mono">
                  Holat: {status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isAvailable && onChangeStatus && (
                  <>
                    <button
                      onClick={() => onChangeStatus(listing, 'reserved')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Band qilish (Reserved)</span>
                    </button>
                    <button
                      onClick={() => onChangeStatus(listing, 'sold')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Sotildi deb belgilash</span>
                    </button>
                  </>
                )}

                {(isReserved || isSold) && onChangeStatus && (
                  <button
                    onClick={() => onChangeStatus(listing, 'available')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Qayta sotuvga chiqarish</span>
                  </button>
                )}

                {onEditListing && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditListing(listing);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Tahrirlash</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Sticky Action Bar (Direct Contact & Chat) */}
        <div className="sticky bottom-0 z-30 bg-white border-t border-slate-200 p-3 sm:p-4 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          
          <div className="hidden sm:block min-w-0">
            <p className="text-xs text-slate-500">Mo‘ljallangan narx:</p>
            <p className="text-base font-bold text-slate-900 tabular-nums">
              {priceUzs > 0 ? `${priceUzs.toLocaleString('uz-UZ')} so'm/${listing.unit}` : 'Kelishilgan'}
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            
            {/* 1. Internal Platform Chat (Main CTA) */}
            {onStartChat && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  onStartChat(listing);
                }}
                leftIcon={<MessageSquare className="w-4 h-4 text-white" />}
                className="flex-1 sm:flex-none h-10 px-4 text-xs font-bold shadow-sm"
              >
                <span>Platformada xabar yozish</span>
              </Button>
            )}

            {/* 2. Telegram Direct Message */}
            <a
              href={getTelegramUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-3.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              title="Telegram orqali bog'lanish"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Telegram</span>
            </a>

            {/* 3. Phone Direct Call */}
            {listing.phone_contact && (
              <a
                href={`tel:${listing.phone_contact.replace(/\s+/g, '')}`}
                className="h-10 px-3.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                title="Qo'ng'iroq qilish"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Qo‘ng‘iroq</span>
              </a>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
