'use client';

import React, { useState } from 'react';
import { Language } from '@/lib/i18n';
import { 
  UZBEKISTAN_CROP_MARKET_BENCHMARKS, 
  computeMarketAccessIntelligence, 
  CropMarketBenchmark 
} from '@/lib/marketAccessData';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  BarChart3, 
  Check, 
  Info, 
  ArrowUpRight, 
  ChevronDown, 
  ChevronUp, 
  Scale, 
  Layers,
  Building2,
  Globe2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface MarketAccessAdviserProps {
  currentLang: Language;
  cropName: string;
  category: string;
  unit: string;
  qualityGrade: 'A' | 'B' | 'Export';
  userEnteredPrice: string | number;
  activeListings: Array<{
    id?: string;
    crop_name?: string;
    category?: string;
    unit?: string;
    price_uzs_per_unit?: number | null;
    status?: string;
  }>;
  onApplyAdvisedPrice: (price: number) => void;
  onSelectCropPreset?: (crop: {
    name: string;
    category: string;
    unit: string;
    advisedPrice: number;
  }) => void;
}

export const MarketAccessAdviser: React.FC<MarketAccessAdviserProps> = ({
  currentLang,
  cropName,
  category,
  unit,
  qualityGrade,
  userEnteredPrice,
  activeListings,
  onApplyAdvisedPrice,
  onSelectCropPreset
}) => {
  const [showDirectory, setShowDirectory] = useState<boolean>(false);
  const [justApplied, setJustApplied] = useState<boolean>(false);
  const [directoryCategory, setDirectoryCategory] = useState<string>('all');

  const analysis = computeMarketAccessIntelligence({
    cropName,
    category,
    unit,
    qualityGrade,
    userEnteredPrice,
    activeListings
  });

  const handleApply = (price: number) => {
    onApplyAdvisedPrice(price);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('uz-UZ');
  };

  const filteredDirectory = directoryCategory === 'all'
    ? UZBEKISTAN_CROP_MARKET_BENCHMARKS
    : UZBEKISTAN_CROP_MARKET_BENCHMARKS.filter(c => c.category === directoryCategory);

  return (
    <div 
      id="market-access-section" 
      className="bg-[#FAF7F0] border-2 border-[#E4D9C4] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs"
    >
      {/* Header with Title and Market Access Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4D9C4]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1F3D2B] text-[#FAF7F0] flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 text-[#D9A441]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F3D2B]">
                {currentLang === 'ru' ? 'Доступ к рынку и ценовой ориентир' : currentLang === 'en' ? 'Market access & price guidance' : 'Bozorga kirish va narx tavsiyasi'}
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9A441]/20 text-[#8B6214] border border-[#D9A441]/30">
                {currentLang === 'ru' ? 'Индекс Узбекистана' : currentLang === 'en' ? 'Uzbekistan index' : "O'zbekiston indeksi"}
              </span>
            </div>
            <p className="text-[11px] text-[#6C7C6F] mt-0.5">
              {currentLang === 'ru'
                ? 'Рекомендация на основе оптовых рынков страны и платформы Ekinix'
                : currentLang === 'en'
                ? 'Price advice based on national wholesale markets and Ekinix platform listings'
                : "Respublika ulgurji bozorlari va Ekinix ilovasi o'rtacha e'lonlari asosidagi tavsiya"}
            </p>
          </div>
        </div>

        {/* Directory Toggle Button */}
        <button
          type="button"
          id="toggle-market-directory-btn"
          onClick={() => setShowDirectory(!showDirectory)}
          className="self-start sm:self-center px-2.5 py-1.5 rounded-xl border border-[#E4D9C4] bg-white hover:bg-[#F0E8D8] text-[11px] font-bold text-[#1F3D2B] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <BarChart3 className="w-3.5 h-3.5 text-[#D9A441]" />
          <span>{showDirectory 
            ? (currentLang === 'ru' ? 'Скрыть справочник цен' : currentLang === 'en' ? 'Hide price directory' : "Bozor narxlari jadvalini yopish")
            : (currentLang === 'ru' ? 'Справочник цен на урожай' : currentLang === 'en' ? 'Crop price directory' : "Hosil bozor narxlari jadvali")}
          </span>
          {showDirectory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Pricing Advice Hero Bar */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#E4D9C4] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#6C7C6F]">
                {currentLang === 'ru' ? 'Рекомендуемая цена продажи:' : currentLang === 'en' ? 'Advised selling price:' : "Tavsiya etilgan sotuv narxi:"}
              </span>
              <span className="text-[11px] font-bold text-[#1F3D2B] bg-[#FAF7F0] px-2 py-0.5 rounded-md border border-[#E4D9C4]">
                {analysis.cropDisplayName} ({qualityGrade === 'Export' ? 'Export' : `${qualityGrade}-nav`})
              </span>
            </div>
            
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#1F3D2B]">
                {formatNumber(analysis.advisedPriceTarget)} <span className="text-xs font-sans font-medium text-[#6C7C6F]">so‘m / {analysis.unit}</span>
              </span>
              <span className="text-[11px] font-mono text-[#8B6214] bg-[#D9A441]/15 px-2 py-0.5 rounded-md">
                {currentLang === 'ru' ? 'диапазон:' : currentLang === 'en' ? 'range:' : 'oraliq:'} {formatNumber(analysis.advisedPriceMin)} – {formatNumber(analysis.advisedPriceMax)} so‘m
              </span>
            </div>
          </div>

          {/* Quick Apply Button */}
          <button
            type="button"
            id="apply-advised-price-btn"
            onClick={() => handleApply(analysis.advisedPriceTarget)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
              justApplied
                ? 'bg-[#6FA85C] text-white'
                : 'bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0]'
            }`}
          >
            {justApplied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>{currentLang === 'ru' ? 'Цена применена' : currentLang === 'en' ? 'Price applied' : "Narx qo'llandi"}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#D9A441]" />
                <span>{currentLang === 'ru' ? 'Применить эту цену' : currentLang === 'en' ? 'Apply advised price' : "Tavsiya narxini kiritish"}</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Benchmark Cards in Row: Uzbekistan Market Avg, Ekinix Platform Avg, Market Liquidity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Card 1: Uzbekistan Market Average */}
          <div className="bg-[#FAF7F0] p-2.5 sm:p-3 rounded-lg border border-[#E4D9C4] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#6C7C6F]">
              <span className="flex items-center gap-1">
                <Globe2 className="w-3 h-3 text-[#1F3D2B]" />
                {currentLang === 'ru' ? 'Рынки Узбекистана' : currentLang === 'en' ? 'Uzbekistan markets' : "O'zbekiston bozorlari"}
              </span>
              <span className="text-[10px] text-[#8B6214] font-medium">Ulgurji</span>
            </div>
            <div className="font-mono text-sm font-bold text-[#1F3D2B]">
              ~{formatNumber(analysis.uzMarketAvg)} <span className="text-[10px] font-sans font-normal text-[#6C7C6F]">so‘m/{analysis.unit}</span>
            </div>
            <p className="text-[10px] text-[#6C7C6F] leading-tight truncate" title={analysis.matchedCrop?.keyRegions}>
              {analysis.matchedCrop?.keyRegions || 'Toshkent, Samarqand, Farg‘ona'}
            </p>
          </div>

          {/* Card 2: Ekinix Platform Average */}
          <div className="bg-[#FAF7F0] p-2.5 sm:p-3 rounded-lg border border-[#E4D9C4] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#6C7C6F]">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#1F3D2B]" />
                {currentLang === 'ru' ? 'В приложении Ekinix' : currentLang === 'en' ? 'In Ekinix app' : "Ekinix ilovasida"}
              </span>
              <span className="text-[10px] text-[#1F3D2B] font-mono font-medium">
                {analysis.ekinixActiveListingsCount > 0 
                  ? `${analysis.ekinixActiveListingsCount} ta e'lon`
                  : (currentLang === 'ru' ? 'базовый' : 'baza')}
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-[#1F3D2B]">
              ~{formatNumber(analysis.ekinixPlatformAvg)} <span className="text-[10px] font-sans font-normal text-[#6C7C6F]">so‘m/{analysis.unit}</span>
            </div>
            <p className="text-[10px] text-[#6C7C6F] leading-tight">
              {analysis.ekinixActiveListingsCount > 0 
                ? (currentLang === 'ru' ? 'Среднее из активных объявлений' : "Faol e'lonlar o'rtachasi")
                : (currentLang === 'ru' ? 'Прямые сделки от фермеров' : "Dehqonlardan to'g'ridan-to'g'ri")}
            </p>
          </div>

          {/* Card 3: Demand & Trend */}
          <div className="bg-[#FAF7F0] p-2.5 sm:p-3 rounded-lg border border-[#E4D9C4] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#6C7C6F]">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#D9A441]" />
                {currentLang === 'ru' ? 'Динамика спроса' : currentLang === 'en' ? 'Demand trend' : "Talab dinamikasi"}
              </span>
              <span className={`text-[10px] font-mono font-bold ${
                analysis.marketTrend === 'up' ? 'text-[#6FA85C]' : analysis.marketTrend === 'down' ? 'text-[#D64545]' : 'text-[#8B6214]'
              }`}>
                {analysis.trendPercentage}
              </span>
            </div>
            <div className="text-xs font-bold text-[#1F3D2B] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6FA85C]" />
              <span>{analysis.demandLevel[currentLang] || analysis.demandLevel.uz}</span>
            </div>
            <p className="text-[10px] text-[#6C7C6F] leading-tight">
              {currentLang === 'ru' ? 'Активный сезон продаж' : currentLang === 'en' ? 'Active sales season' : "Faol savdo va sotuv mavsumi"}
            </p>
          </div>
        </div>

        {/* User Entered Price Feedback Analysis Banner */}
        {analysis.priceComparisonStatus !== 'unspecified' && (
          <div className={`p-2.5 sm:p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
            analysis.priceComparisonStatus === 'within_range'
              ? 'bg-[#6FA85C]/10 border-[#6FA85C]/30 text-[#1F3D2B]'
              : analysis.priceComparisonStatus === 'lower_than_market'
              ? 'bg-[#D9A441]/10 border-[#D9A441]/30 text-[#1F3D2B]'
              : 'bg-[#F4A340]/10 border-[#F4A340]/30 text-[#1F3D2B]'
          }`}>
            {analysis.priceComparisonStatus === 'within_range' ? (
              <CheckCircle2 className="w-4 h-4 text-[#6FA85C] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#D9A441] shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="font-bold block">
                {analysis.priceComparisonStatus === 'within_range'
                  ? (currentLang === 'ru' ? 'Оптимальная рыночная цена' : currentLang === 'en' ? 'Optimal market price' : "Maqbul bozor narxi")
                  : analysis.priceComparisonStatus === 'lower_than_market'
                  ? (currentLang === 'ru' ? 'Конкурентная цена ниже рынка' : currentLang === 'en' ? 'Competitive sub-market price' : "Bozor o'rtachasidan pastroq narx")
                  : (currentLang === 'ru' ? 'Цена выше среднерыночной' : currentLang === 'en' ? 'Price above market average' : "Bozor o'rtachasidan yuqoriroq narx")}
              </span>
              <p className="text-[11px] text-[#4A5D4E]">
                {analysis.priceFeedbackMessage[currentLang] || analysis.priceFeedbackMessage.uz}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Current Crop Market Prices Directory (Placeholder & Benchmark Information) */}
      {showDirectory && (
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-[#E4D9C4] space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-[#1F3D2B]">
                {currentLang === 'ru' ? 'Текущие оптовые цены по культурам в Узбекистане' : currentLang === 'en' ? 'Current wholesale crop market prices in Uzbekistan' : "O'zbekistonda ekinlar bo'yicha joriy ulgurji bozor narxlari"}
              </h5>
              <p className="text-[11px] text-[#6C7C6F]">
                {currentLang === 'ru'
                  ? 'Нажмите на любую культуру, чтобы автоматически заполнить название и цену'
                  : currentLang === 'en'
                  ? 'Click any crop to automatically fill in name, category, and advised price'
                  : "Kerakli ekin ustiga bosib, ma'lumot va tavsiya narxini avtomatik to'ldiring"}
              </p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
              <button
                type="button"
                id="filter-dir-all"
                onClick={() => setDirectoryCategory('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  directoryCategory === 'all' ? 'bg-[#1F3D2B] text-white' : 'bg-[#FAF7F0] text-[#6C7C6F] hover:text-[#1F3D2B]'
                }`}
              >
                {currentLang === 'ru' ? 'Все' : currentLang === 'en' ? 'All' : 'Barchasi'}
              </button>
              <button
                type="button"
                id="filter-dir-sabzavot"
                onClick={() => setDirectoryCategory('sabzavot')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  directoryCategory === 'sabzavot' ? 'bg-[#1F3D2B] text-white' : 'bg-[#FAF7F0] text-[#6C7C6F] hover:text-[#1F3D2B]'
                }`}
              >
                {currentLang === 'ru' ? 'Овощи' : 'Sabzavot'}
              </button>
              <button
                type="button"
                id="filter-dir-meva"
                onClick={() => setDirectoryCategory('meva')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  directoryCategory === 'meva' ? 'bg-[#1F3D2B] text-white' : 'bg-[#FAF7F0] text-[#6C7C6F] hover:text-[#1F3D2B]'
                }`}
              >
                {currentLang === 'ru' ? 'Фрукты' : 'Meva'}
              </button>
              <button
                type="button"
                id="filter-dir-don"
                onClick={() => setDirectoryCategory('don')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  directoryCategory === 'don' ? 'bg-[#1F3D2B] text-white' : 'bg-[#FAF7F0] text-[#6C7C6F] hover:text-[#1F3D2B]'
                }`}
              >
                {currentLang === 'ru' ? 'Зерновые' : "G'alla"}
              </button>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto border border-[#E4D9C4] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] text-[#6C7C6F] border-b border-[#E4D9C4] text-[10px] font-bold">
                <tr>
                  <th className="p-2 sm:p-2.5">
                    {currentLang === 'ru' ? 'Культура' : currentLang === 'en' ? 'Crop' : 'Ekin nomi'}
                  </th>
                  <th className="p-2 sm:p-2.5">
                    {currentLang === 'ru' ? 'Рыночный диапазон (UZS)' : currentLang === 'en' ? 'Market range (UZS)' : "O'zbekiston bozori (so'm)"}
                  </th>
                  <th className="p-2 sm:p-2.5">
                    {currentLang === 'ru' ? 'Средняя Ekinix' : currentLang === 'en' ? 'Ekinix avg' : "Ekinix o'rtacha"}
                  </th>
                  <th className="p-2 sm:p-2.5">
                    {currentLang === 'ru' ? 'Тренд' : currentLang === 'en' ? 'Trend' : 'Dinamika'}
                  </th>
                  <th className="p-2 sm:p-2.5 text-right">
                    {currentLang === 'ru' ? 'Действие' : currentLang === 'en' ? 'Action' : 'Tanlash'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4D9C4]">
                {filteredDirectory.map((item) => {
                  const isCurrent = (cropName || '').toLowerCase().includes(item.id);
                  const isPerTonCrop = item.unit === 'tonna';

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-[#FAF7F0] transition-colors ${
                        isCurrent ? 'bg-[#D9A441]/10' : ''
                      }`}
                    >
                      <td className="p-2 sm:p-2.5 font-medium text-[#1F3D2B]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{item.nameUz}</span>
                          <span className="text-[10px] text-[#6C7C6F] font-mono">({item.unit})</span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-2.5 font-mono text-[11px] text-[#1F3D2B]">
                        {formatNumber(item.uzMarketPriceMin)} – {formatNumber(item.uzMarketPriceMax)}
                      </td>
                      <td className="p-2 sm:p-2.5 font-mono text-[11px] font-bold text-[#8B6214]">
                        ~{formatNumber(item.uzMarketPriceAvg)}
                      </td>
                      <td className="p-2 sm:p-2.5 text-[10px] font-bold">
                        <span className={`inline-flex items-center gap-0.5 ${
                          item.marketTrend === 'up' ? 'text-[#6FA85C]' : item.marketTrend === 'down' ? 'text-[#D64545]' : 'text-[#8B6214]'
                        }`}>
                          {item.marketTrend === 'up' && <TrendingUp className="w-3 h-3" />}
                          {item.marketTrend === 'down' && <TrendingDown className="w-3 h-3" />}
                          {item.marketTrend === 'stable' && <Minus className="w-3 h-3" />}
                          <span>{item.trendPercentage}</span>
                        </span>
                      </td>
                      <td className="p-2 sm:p-2.5 text-right">
                        <button
                          type="button"
                          id={`select-crop-row-${item.id}`}
                          onClick={() => {
                            if (onSelectCropPreset) {
                              onSelectCropPreset({
                                name: item.nameUz,
                                category: item.category,
                                unit: item.unit,
                                advisedPrice: item.uzMarketPriceAvg
                              });
                            } else {
                              handleApply(item.uzMarketPriceAvg);
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-[#FAF7F0] hover:bg-[#1F3D2B] text-[#1F3D2B] hover:text-[#FAF7F0] border border-[#E4D9C4] font-bold text-[10px] transition-colors cursor-pointer"
                        >
                          {currentLang === 'ru' ? 'Выбрать' : currentLang === 'en' ? 'Select' : 'Tanlash'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
