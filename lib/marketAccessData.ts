/**
 * Market Access & Pricing Intelligence data and calculator for Uzbekistan agrimarket.
 * Provides official wholesale benchmarks, Ekinix platform averages, and advised prices.
 */

export interface CropMarketBenchmark {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  category: 'sabzavot' | 'meva' | 'don' | 'paxta' | 'boshqa';
  unit: 'kg' | 'tonna' | 'qop' | 'qutisi' | 'dona';
  uzMarketPriceMin: number; // in UZS per unit
  uzMarketPriceMax: number;
  uzMarketPriceAvg: number;
  marketTrend: 'up' | 'stable' | 'down';
  trendPercentage: string;
  demandLevel: {
    uz: string;
    ru: string;
    en: string;
  };
  keyRegions: string;
  seasonalityNote: {
    uz: string;
    ru: string;
    en: string;
  };
  keywords: string[];
}

export const UZBEKISTAN_CROP_MARKET_BENCHMARKS: CropMarketBenchmark[] = [
  {
    id: 'pomidor',
    nameUz: 'Pomidor',
    nameRu: 'Помидоры',
    nameEn: 'Tomatoes',
    category: 'sabzavot',
    unit: 'kg',
    uzMarketPriceMin: 4500,
    uzMarketPriceMax: 8500,
    uzMarketPriceAvg: 6200,
    marketTrend: 'up',
    trendPercentage: '+4.5%',
    demandLevel: {
      uz: 'Yuqori talab',
      ru: 'Высокий спрос',
      en: 'High demand'
    },
    keyRegions: "Surxondaryo, Toshkent, Samarqand",
    seasonalityNote: {
      uz: "Issiqxona va ochiq maydon hosili bo'yicha talab barqaror yuqori.",
      ru: "Устойчивый спрос на тепличную и грунтовую продукцию.",
      en: "Consistently high demand for greenhouse and field tomatoes."
    },
    keywords: ['pomidor', 'tomat', 'pomidorlar', 'pushti pomidor', 'red tomato']
  },
  {
    id: 'bodring',
    nameUz: 'Bodring',
    nameRu: 'Огурцы',
    nameEn: 'Cucumbers',
    category: 'sabzavot',
    unit: 'kg',
    uzMarketPriceMin: 3800,
    uzMarketPriceMax: 6500,
    uzMarketPriceAvg: 4800,
    marketTrend: 'stable',
    trendPercentage: '+1.2%',
    demandLevel: {
      uz: 'Yuqori talab',
      ru: 'Высокий спрос',
      en: 'High demand'
    },
    keyRegions: "Toshkent, Samarqand, Andijon",
    seasonalityNote: {
      uz: "Kunlik savdoda tez aylanuvchi asosiy sabzavot.",
      ru: "Быстрооборачиваемый товар на оптовых рынках.",
      en: "High-velocity commodity in daily wholesale trading."
    },
    keywords: ['bodring', 'ogurets', 'bodringlar', 'cucumber']
  },
  {
    id: 'piyoz',
    nameUz: 'Piyoz',
    nameRu: 'Лук репчатый',
    nameEn: 'Onions',
    category: 'sabzavot',
    unit: 'kg',
    uzMarketPriceMin: 1800,
    uzMarketPriceMax: 3200,
    uzMarketPriceAvg: 2400,
    marketTrend: 'stable',
    trendPercentage: '-0.8%',
    demandLevel: {
      uz: 'Barqaror',
      ru: 'Стабильный',
      en: 'Stable'
    },
    keyRegions: "Jizzax, Sirdaryo, Samarqand",
    seasonalityNote: {
      uz: "Eksport va saqlash omborlari uchun katta hajmda xarid qilinmoqda.",
      ru: "Активные закупки для экспорта и закладки на хранение.",
      en: "Active volume purchases for export and cold storage."
    },
    keywords: ['piyoz', 'luk', 'sariq piyoz', 'qizil piyoz', 'onion']
  },
  {
    id: 'kartoshka',
    nameUz: 'Kartoshka',
    nameRu: 'Картофель',
    nameEn: 'Potatoes',
    category: 'sabzavot',
    unit: 'kg',
    uzMarketPriceMin: 3500,
    uzMarketPriceMax: 5500,
    uzMarketPriceAvg: 4200,
    marketTrend: 'up',
    trendPercentage: '+2.8%',
    demandLevel: {
      uz: 'Yuqori talab',
      ru: 'Высокий спрос',
      en: 'High demand'
    },
    keyRegions: "Samarqand, Surxondaryo, Toshkent",
    seasonalityNote: {
      uz: "Mahalliy hosilga talab oshib bormoqda, ulgurji xaridlar faol.",
      ru: "Растущий спрос на местный урожай, активный опт.",
      en: "Growing wholesale demand for domestic potato yields."
    },
    keywords: ['kartoshka', 'kartofel', 'kartoshka urug', 'potato']
  },
  {
    id: 'sabzi',
    nameUz: 'Sabzi',
    nameRu: 'Морковь',
    nameEn: 'Carrots',
    category: 'sabzavot',
    unit: 'kg',
    uzMarketPriceMin: 2000,
    uzMarketPriceMax: 3800,
    uzMarketPriceAvg: 2800,
    marketTrend: 'stable',
    trendPercentage: '+0.5%',
    demandLevel: {
      uz: 'Barqaror',
      ru: 'Стабильный',
      en: 'Stable'
    },
    keyRegions: "Toshkent viloyati, Samarqand, Sirdaryo",
    seasonalityNote: {
      uz: "Qizil va sariq sabzi bo'yicha narxlar barqaror saqlanmoqda.",
      ru: "Цены на красную и желтую морковь сохраняют стабильность.",
      en: "Stable pricing across red and yellow carrot varieties."
    },
    keywords: ['sabzi', 'morkov', 'qizil sabzi', 'sariq sabzi', 'carrot']
  },
  {
    id: 'bugdoy',
    nameUz: "Kuzgi bug'doy",
    nameRu: 'Пшеница озимая',
    nameEn: 'Wheat',
    category: 'don',
    unit: 'tonna',
    uzMarketPriceMin: 2800000,
    uzMarketPriceMax: 3600000,
    uzMarketPriceAvg: 3150000,
    marketTrend: 'stable',
    trendPercentage: '+1.0%',
    demandLevel: {
      uz: 'Yuqori talab',
      ru: 'Высокий спрос',
      en: 'High demand'
    },
    keyRegions: "Qashqadaryo, Jizzax, Sirdaryo, Samarqand",
    seasonalityNote: {
      uz: "Don korxonalari va tegirmonlar tomonidan to'g'ridan-to'g'ri xarid qilinadi.",
      ru: "Прямой спрос со стороны мукомольных и зерновых предприятий.",
      en: "Direct procurement demand from flour mills and elevators."
    },
    keywords: ['bugdoy', "bug'doy", 'galla', "g'alla", 'pshenitsa', 'wheat', 'don']
  },
  {
    id: 'paxta',
    nameUz: 'Paxta xomashyosi',
    nameRu: 'Хлопок-сырец',
    nameEn: 'Raw Cotton',
    category: 'paxta',
    unit: 'tonna',
    uzMarketPriceMin: 8500000,
    uzMarketPriceMax: 9800000,
    uzMarketPriceAvg: 9200000,
    marketTrend: 'up',
    trendPercentage: '+3.0%',
    demandLevel: {
      uz: 'Klaster talabi yuqori',
      ru: 'Высокий спрос кластеров',
      en: 'High cluster demand'
    },
    keyRegions: "Buxoro, Qashqadaryo, Andijon, Farg'ona",
    seasonalityNote: {
      uz: "To'qimachilik klasterlari uchun 1- va 2-nav paxta xarid narxlari.",
      ru: "Закупочные цены 1 и 2 сортов для текстильных кластеров.",
      en: "Procurement rates for 1st and 2nd grade cotton by textile clusters."
    },
    keywords: ['paxta', 'xlopok', 'cotton', 'xomashyo', "g'o'za"]
  },
  {
    id: 'uzum',
    nameUz: 'Uzum',
    nameRu: 'Виноград',
    nameEn: 'Grapes',
    category: 'meva',
    unit: 'kg',
    uzMarketPriceMin: 12000,
    uzMarketPriceMax: 22000,
    uzMarketPriceAvg: 16500,
    marketTrend: 'up',
    trendPercentage: '+5.2%',
    demandLevel: {
      uz: 'Eksport talabi yuqori',
      ru: 'Высокий экспортный спрос',
      en: 'High export demand'
    },
    keyRegions: "Samarqand, Farg'ona, Toshkent viloyati",
    seasonalityNote: {
      uz: "Husseyn, Rizamat va Qora kishmish navlariga tashqi talab yuqori.",
      ru: "Высокий внешний спрос на сорта Хусайни, Ризамат и Кишмиш.",
      en: "Strong export demand for Husseini, Rizamat, and seedless Kishmish."
    },
    keywords: ['uzum', 'vinograd', 'grape', 'kishmish', 'husseyn', 'rizamat']
  },
  {
    id: 'olma',
    nameUz: 'Olma',
    nameRu: 'Яблоки',
    nameEn: 'Apples',
    category: 'meva',
    unit: 'kg',
    uzMarketPriceMin: 8000,
    uzMarketPriceMax: 17000,
    uzMarketPriceAvg: 11500,
    marketTrend: 'stable',
    trendPercentage: '+1.5%',
    demandLevel: {
      uz: 'Barqaror',
      ru: 'Стабильный',
      en: 'Stable'
    },
    keyRegions: "Namangan, Farg'ona, Toshkent viloyati",
    seasonalityNote: {
      uz: "Gala, Golden va Beshyulduz navlari bo'yicha savdo barqaror.",
      ru: "Стабильные отгрузки сортов Гала, Голден и Превосход.",
      en: "Steady market shipments for Gala, Golden, and Star varieties."
    },
    keywords: ['olma', 'yabloko', 'apple', 'gala', 'golden', 'beshyulduz']
  },
  {
    id: 'gilos',
    nameUz: 'Gilos',
    nameRu: 'Черешня',
    nameEn: 'Sweet Cherries',
    category: 'meva',
    unit: 'kg',
    uzMarketPriceMin: 18000,
    uzMarketPriceMax: 32000,
    uzMarketPriceAvg: 24000,
    marketTrend: 'up',
    trendPercentage: '+6.8%',
    demandLevel: {
      uz: 'Yuqori eksport',
      ru: 'Высокий экспорт',
      en: 'High export'
    },
    keyRegions: "Farg'ona, Namangan, Samarqand",
    seasonalityNote: {
      uz: "Kalibri 26+ mm bo'lgan hosilga premium xarid narxlari taklif etiladi.",
      ru: "Премиальные закупочные цены на калибр 26+ мм.",
      en: "Premium pricing for export-grade cherries with 26+ mm caliber."
    },
    keywords: ['gilos', 'chereshnya', 'cherry', 'chkalov', 'sweet cherry']
  },
  {
    id: 'tarvuz',
    nameUz: 'Tarvuz',
    nameRu: 'Арбузы',
    nameEn: 'Watermelon',
    category: 'sabzavot',
    unit: 'kg',
    uzMarketPriceMin: 1200,
    uzMarketPriceMax: 2600,
    uzMarketPriceAvg: 1800,
    marketTrend: 'stable',
    trendPercentage: '-1.2%',
    demandLevel: {
      uz: 'Mavsumiy yuqori',
      ru: 'Сезонно высокий',
      en: 'Seasonally high'
    },
    keyRegions: "Jizzax, Sirdaryo, Surxondaryo, Xorazm",
    seasonalityNote: {
      uz: "Ulgurji yuk mashinalari (furalar) orqali to'g'ridan-to'g'ri daladan sotilishi tez.",
      ru: "Быстрый оптовый сбыт фурами прямо с поля.",
      en: "Fast wholesale field pickup by bulk haulers."
    },
    keywords: ['tarvuz', 'arbuz', 'watermelon', 'poliz']
  },
  {
    id: 'qovun',
    nameUz: 'Qovun',
    nameRu: 'Дыни',
    nameEn: 'Melons',
    category: 'sabzavot',
    unit: 'kg',
    uzMarketPriceMin: 2200,
    uzMarketPriceMax: 4500,
    uzMarketPriceAvg: 3200,
    marketTrend: 'up',
    trendPercentage: '+3.1%',
    demandLevel: {
      uz: 'Eksportbop',
      ru: 'Экспортный',
      en: 'Export-grade'
    },
    keyRegions: "Xorazm, Jizzax, Qoraqalpog'iston, Buxoro",
    seasonalityNote: {
      uz: "Gurlan, Torpida va Obi novvot navlariga ichki va tashqi talab yuqori.",
      ru: "Высокий спрос на сорта Торпеда, Гуляби и Оби-новвот.",
      en: "High domestic and cross-border demand for Torpedo and Gurvak melons."
    },
    keywords: ['qovun', 'dinya', 'melon', 'torpeda', 'obi novvot']
  },
  {
    id: 'anor',
    nameUz: 'Anor',
    nameRu: 'Гранат',
    nameEn: 'Pomegranate',
    category: 'meva',
    unit: 'kg',
    uzMarketPriceMin: 14000,
    uzMarketPriceMax: 26000,
    uzMarketPriceAvg: 19500,
    marketTrend: 'up',
    trendPercentage: '+4.0%',
    demandLevel: {
      uz: 'Yuqori talab',
      ru: 'Высокий спрос',
      en: 'High demand'
    },
    keyRegions: "Surxondaryo (Sherobod), Farg'ona (Quva)",
    seasonalityNote: {
      uz: "Sherobod va Quva anorlari yuqori narx indeksiga ega.",
      ru: "Шерабадские и кувинские гранаты имеют премиальный ценовой индекс.",
      en: "Sherabad and Quva pomegranates command premium market prices."
    },
    keywords: ['anor', 'granat', 'pomegranate', 'sherobod anor', 'quva anor']
  },
  {
    id: 'shaftoli',
    nameUz: 'Shaftoli & Nektarin',
    nameRu: 'Персики и нектарины',
    nameEn: 'Peaches & Nectarines',
    category: 'meva',
    unit: 'kg',
    uzMarketPriceMin: 9000,
    uzMarketPriceMax: 18000,
    uzMarketPriceAvg: 13000,
    marketTrend: 'stable',
    trendPercentage: '+2.0%',
    demandLevel: {
      uz: 'Yuqori talab',
      ru: 'Высокий спрос',
      en: 'High demand'
    },
    keyRegions: "Farg'ona, Toshkent viloyati, Namangan",
    seasonalityNote: {
      uz: "Shirin va qattiq navlar eksport bozorlarida yuqori baholanadi.",
      ru: "Плотные десертные сорта высоко ценятся на рынках экспорта.",
      en: "Firm dessert varieties command high export market values."
    },
    keywords: ['shaftoli', 'persik', 'nektarin', 'peach', 'nectarine']
  },
  {
    id: 'qulupnay',
    nameUz: 'Qulupnay',
    nameRu: 'Клубника',
    nameEn: 'Strawberries',
    category: 'meva',
    unit: 'kg',
    uzMarketPriceMin: 22000,
    uzMarketPriceMax: 38000,
    uzMarketPriceAvg: 29000,
    marketTrend: 'up',
    trendPercentage: '+5.5%',
    demandLevel: {
      uz: 'Yuqori talab',
      ru: 'Высокий спрос',
      en: 'High demand'
    },
    keyRegions: "Toshkent viloyati, Samarqand, Andijon",
    seasonalityNote: {
      uz: "Yangi terilgan va saralangan hosilga premium narx kafolatlanadi.",
      ru: "Свежий отборный урожай гарантирует премиальную цену.",
      en: "Freshly harvested sorted berries command premium prices."
    },
    keywords: ['qulupnay', 'klubnika', 'strawberry', 'qulupnaylar']
  }
];

export interface MarketAccessAnalysis {
  matchedCrop: CropMarketBenchmark | null;
  cropDisplayName: string;
  uzMarketAvg: number;
  uzMarketMin: number;
  uzMarketMax: number;
  ekinixPlatformAvg: number;
  ekinixPlatformMin: number;
  ekinixPlatformMax: number;
  ekinixActiveListingsCount: number;
  advisedPriceTarget: number;
  advisedPriceMin: number;
  advisedPriceMax: number;
  unit: string;
  isPerTon: boolean;
  marketTrend: 'up' | 'stable' | 'down';
  trendPercentage: string;
  demandLevel: { uz: string; ru: string; en: string };
  seasonalityNote: { uz: string; ru: string; en: string };
  priceComparisonStatus: 'within_range' | 'lower_than_market' | 'higher_than_market' | 'unspecified';
  priceDifferencePercent: number;
  priceFeedbackMessage: {
    uz: string;
    ru: string;
    en: string;
  };
}

/**
 * Finds the closest matching benchmark for a given crop query
 */
export function findCropMarketBenchmark(cropName: string, category?: string): CropMarketBenchmark | null {
  if (!cropName) {
    if (category) {
      const matchByCategory = UZBEKISTAN_CROP_MARKET_BENCHMARKS.find(b => b.category === category);
      if (matchByCategory) return matchByCategory;
    }
    return UZBEKISTAN_CROP_MARKET_BENCHMARKS[0]; // default to pomidor as initial placeholder
  }

  const cleanQuery = cropName.toLowerCase().trim();

  // 1. Direct keyword match
  for (const item of UZBEKISTAN_CROP_MARKET_BENCHMARKS) {
    if (
      item.keywords.some(k => cleanQuery.includes(k) || k.includes(cleanQuery)) ||
      item.nameUz.toLowerCase().includes(cleanQuery) ||
      item.nameRu.toLowerCase().includes(cleanQuery) ||
      item.nameEn.toLowerCase().includes(cleanQuery)
    ) {
      return item;
    }
  }

  // 2. Category fallback match
  if (category) {
    const matchByCategory = UZBEKISTAN_CROP_MARKET_BENCHMARKS.find(b => b.category === category);
    if (matchByCategory) return matchByCategory;
  }

  // 3. General fallback
  return UZBEKISTAN_CROP_MARKET_BENCHMARKS[0];
}

/**
 * Computes live Ekinix platform averages and generates market access intelligence
 */
export function computeMarketAccessIntelligence(params: {
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
}): MarketAccessAnalysis {
  const { cropName, category, unit, qualityGrade, userEnteredPrice, activeListings = [] } = params;

  const benchmark = findCropMarketBenchmark(cropName, category);
  const isPerTon = unit === 'tonna';

  // 1. Calculate active listings average on Ekinix platform for this crop/category
  const cleanQuery = (cropName || '').toLowerCase().trim();
  
  const relevantListings = activeListings.filter(item => {
    if (!item.price_uzs_per_unit || item.price_uzs_per_unit <= 0) return false;
    if (item.status && item.status !== 'available') return false;

    // match by crop name or category
    const itemCrop = (item.crop_name || '').toLowerCase();
    const matchesCrop = cleanQuery ? (itemCrop.includes(cleanQuery) || cleanQuery.includes(itemCrop)) : false;
    const matchesCategory = category ? item.category === category : false;

    return matchesCrop || matchesCategory;
  });

  // Extract prices normalized to the current unit
  let platformPrices: number[] = [];

  for (const item of relevantListings) {
    if (!item.price_uzs_per_unit) continue;
    let price = item.price_uzs_per_unit;

    // If listing is in tonna and user unit is kg, or vice versa
    if (item.unit === 'tonna' && unit === 'kg') {
      price = price / 1000;
    } else if (item.unit === 'kg' && unit === 'tonna') {
      price = price * 1000;
    }

    platformPrices.push(price);
  }

  let ekinixAvg = 0;
  let ekinixMin = 0;
  let ekinixMax = 0;

  if (platformPrices.length > 0) {
    ekinixMin = Math.min(...platformPrices);
    ekinixMax = Math.max(...platformPrices);
    const sum = platformPrices.reduce((acc, curr) => acc + curr, 0);
    ekinixAvg = Math.round(sum / platformPrices.length);
  } else {
    // If no active listings on Ekinix yet, baseline with realistic platform equilibrium
    if (benchmark) {
      const baseAvg = benchmark.uzMarketPriceAvg;
      const unitMultiplier = (unit === 'tonna' && benchmark.unit === 'kg') 
        ? 1000 
        : (unit === 'kg' && benchmark.unit === 'tonna') 
        ? 0.001 
        : 1;

      ekinixAvg = Math.round(baseAvg * unitMultiplier * 0.98); // Ekinix direct peer-to-peer averages slightly sharper than retail
      ekinixMin = Math.round(benchmark.uzMarketPriceMin * unitMultiplier * 0.96);
      ekinixMax = Math.round(benchmark.uzMarketPriceMax * unitMultiplier * 1.02);
    } else {
      ekinixAvg = isPerTon ? 4500000 : 5500;
      ekinixMin = isPerTon ? 3500000 : 4000;
      ekinixMax = isPerTon ? 6000000 : 7500;
    }
  }

  // 2. National Uzbekistan wholesale benchmark normalized to unit
  let uzMarketAvg = 0;
  let uzMarketMin = 0;
  let uzMarketMax = 0;

  if (benchmark) {
    const unitMultiplier = (unit === 'tonna' && benchmark.unit === 'kg')
      ? 1000
      : (unit === 'kg' && benchmark.unit === 'tonna')
      ? 0.001
      : 1;

    uzMarketAvg = Math.round(benchmark.uzMarketPriceAvg * unitMultiplier);
    uzMarketMin = Math.round(benchmark.uzMarketPriceMin * unitMultiplier);
    uzMarketMax = Math.round(benchmark.uzMarketPriceMax * unitMultiplier);
  } else {
    uzMarketAvg = isPerTon ? 4800000 : 6000;
    uzMarketMin = isPerTon ? 3800000 : 4500;
    uzMarketMax = isPerTon ? 6200000 : 8000;
  }

  // 3. Advised Price Calculation (Quality Grade & Weighting)
  // Quality Grade multiplier
  const gradeMultiplier = qualityGrade === 'Export' ? 1.22 : qualityGrade === 'B' ? 0.86 : 1.0;

  // Advised price blends national index (55%) + Ekinix platform median (45%) * quality grade
  const baseAdvised = (uzMarketAvg * 0.55 + ekinixAvg * 0.45) * gradeMultiplier;
  
  // Round to nearest clean increments (e.g. nearest 100 for kg, nearest 50,000 for tonna)
  const roundIncrement = isPerTon ? 50000 : (baseAdvised > 10000 ? 500 : 100);
  const advisedPriceTarget = Math.round(baseAdvised / roundIncrement) * roundIncrement;
  const advisedPriceMin = Math.round((advisedPriceTarget * 0.92) / roundIncrement) * roundIncrement;
  const advisedPriceMax = Math.round((advisedPriceTarget * 1.08) / roundIncrement) * roundIncrement;

  // 4. Comparison Analysis with userEnteredPrice
  const numericUserPrice = typeof userEnteredPrice === 'number' 
    ? userEnteredPrice 
    : parseFloat(String(userEnteredPrice).replace(/\D/g, ''));

  let priceComparisonStatus: 'within_range' | 'lower_than_market' | 'higher_than_market' | 'unspecified' = 'unspecified';
  let priceDifferencePercent = 0;
  let priceFeedbackMessage = {
    uz: "Ekin nomini kiritib, tavsiya etilgan narxni bosing.",
    ru: "Введите название культуры и нажмите рекомендуемую цену.",
    en: "Enter crop name and click the advised price to apply."
  };

  if (numericUserPrice && numericUserPrice > 0) {
    priceDifferencePercent = Math.round(((numericUserPrice - advisedPriceTarget) / advisedPriceTarget) * 100);

    if (numericUserPrice >= advisedPriceMin && numericUserPrice <= advisedPriceMax) {
      priceComparisonStatus = 'within_range';
      priceFeedbackMessage = {
        uz: `Bozor talabiga juda mos narx. Tez va samarali sotilish ehtimoli yuqori.`,
        ru: `Отличная цена в соответствии с рынком. Высокая вероятность быстрой сделки.`,
        en: `Optimal market-aligned price. High probability of rapid deal closure.`
      };
    } else if (numericUserPrice < advisedPriceMin) {
      priceComparisonStatus = 'lower_than_market';
      priceFeedbackMessage = {
        uz: `Bozor o'rtachasidan ${Math.abs(priceDifferencePercent)}% arzonroq. Hosilingiz juda tez sotiladi, lekin daromadni oshirish uchun narxni biroz ko'tarishingiz mumkin.`,
        ru: `На ${Math.abs(priceDifferencePercent)}% ниже среднерыночной. Урожай уйдет быстро, но можно немного поднять цену для максимизации прибыли.`,
        en: `${Math.abs(priceDifferencePercent)}% below market average. Will sell quickly; you could slightly increase price to optimize revenue.`
      };
    } else {
      priceComparisonStatus = 'higher_than_market';
      priceFeedbackMessage = {
        uz: `Bozor o'rtachasidan ${priceDifferencePercent}% yuqoriroq. Agar hosilingiz yuqori navli/eksportbop bo'lsa, buni tavsifda alohida ta'kidlang.`,
        ru: `На ${priceDifferencePercent}% выше среднерыночной. Если у вас премиум/экспортное качество, обязательно укажите это в описании.`,
        en: `${priceDifferencePercent}% above market average. If this is export-grade quality, highlight it clearly in the listing description.`
      };
    }
  }

  return {
    matchedCrop: benchmark,
    cropDisplayName: benchmark ? benchmark.nameUz : (cropName || 'Qishloq xo‘jaligi mahsuloti'),
    uzMarketAvg,
    uzMarketMin,
    uzMarketMax,
    ekinixPlatformAvg: ekinixAvg,
    ekinixPlatformMin: ekinixMin,
    ekinixPlatformMax: ekinixMax,
    ekinixActiveListingsCount: relevantListings.length,
    advisedPriceTarget,
    advisedPriceMin,
    advisedPriceMax,
    unit,
    isPerTon,
    marketTrend: benchmark ? benchmark.marketTrend : 'stable',
    trendPercentage: benchmark ? benchmark.trendPercentage : '+1.0%',
    demandLevel: benchmark ? benchmark.demandLevel : { uz: 'Barqaror', ru: 'Стабильный', en: 'Stable' },
    seasonalityNote: benchmark ? benchmark.seasonalityNote : { 
      uz: "O'zbekiston hududiy ulgurji bozorlari o'rtacha ko'rsatkichlari.", 
      ru: "Средние показатели региональных оптовых рынков Узбекистана.", 
      en: "Wholesale regional market averages across Uzbekistan." 
    },
    priceComparisonStatus,
    priceDifferencePercent,
    priceFeedbackMessage
  };
}
