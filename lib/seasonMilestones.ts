import { Language } from './i18n';

export interface MilestoneStage {
  id: 'planting' | 'vegetation' | 'flowering' | 'harvest';
  index: number;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  shortDescUz: string;
  shortDescRu: string;
  shortDescEn: string;
  icon: string;
  startDay: number;
  endDay: number;
  checklistUz: { id: string; text: string; done?: boolean }[];
  checklistRu: { id: string; text: string; done?: boolean }[];
  checklistEn: { id: string; text: string; done?: boolean }[];
  irrigationGuidanceUz: string;
  irrigationGuidanceRu: string;
  irrigationGuidanceEn: string;
  nutrientFocusUz: string;
  nutrientFocusRu: string;
  nutrientFocusEn: string;
}

export interface FieldSeasonProgress {
  cropType: string;
  plantingDate: string;
  daysElapsed: number;
  totalSeasonDays: number;
  overallProgressPercent: number;
  currentMilestone: MilestoneStage;
  currentMilestoneIndex: number;
  allMilestones: MilestoneStage[];
  daysRemainingInMilestone: number;
}

// Crop-specific season timelines (in days from planting)
const CROP_TIMELINES: Record<string, { totalDays: number; stages: { id: MilestoneStage['id']; endDay: number }[] }> = {
  cotton: {
    totalDays: 160,
    stages: [
      { id: 'planting', endDay: 25 },
      { id: 'vegetation', endDay: 70 },
      { id: 'flowering', endDay: 120 },
      { id: 'harvest', endDay: 160 },
    ],
  },
  wheat: {
    totalDays: 140,
    stages: [
      { id: 'planting', endDay: 20 },
      { id: 'vegetation', endDay: 60 },
      { id: 'flowering', endDay: 95 },
      { id: 'harvest', endDay: 140 },
    ],
  },
  tomato: {
    totalDays: 110,
    stages: [
      { id: 'planting', endDay: 18 },
      { id: 'vegetation', endDay: 45 },
      { id: 'flowering', endDay: 75 },
      { id: 'harvest', endDay: 110 },
    ],
  },
  apple: {
    totalDays: 180,
    stages: [
      { id: 'planting', endDay: 30 },
      { id: 'vegetation', endDay: 80 },
      { id: 'flowering', endDay: 120 },
      { id: 'harvest', endDay: 180 },
    ],
  },
  grape: {
    totalDays: 165,
    stages: [
      { id: 'planting', endDay: 25 },
      { id: 'vegetation', endDay: 75 },
      { id: 'flowering', endDay: 115 },
      { id: 'harvest', endDay: 165 },
    ],
  },
  default: {
    totalDays: 120,
    stages: [
      { id: 'planting', endDay: 20 },
      { id: 'vegetation', endDay: 55 },
      { id: 'flowering', endDay: 85 },
      { id: 'harvest', endDay: 120 },
    ],
  },
};

export function getFieldSeasonProgress(cropType: string, plantingDateStr?: string): FieldSeasonProgress {
  const normCrop = (cropType || 'cotton').toLowerCase();
  const timeline = CROP_TIMELINES[normCrop] || CROP_TIMELINES.default;

  // Calculate days elapsed from planting
  let daysElapsed = 45; // default reasonable mid-season fallback
  if (plantingDateStr) {
    const pDate = new Date(plantingDateStr);
    if (!isNaN(pDate.getTime())) {
      const now = new Date();
      const diffTime = now.getTime() - pDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      daysElapsed = Math.max(1, diffDays);
    }
  }

  // Construct standard 4 milestones with specific crop adaptations
  const allMilestones: MilestoneStage[] = [
    {
      id: 'planting',
      index: 0,
      nameUz: "Ekish & Nihol",
      nameRu: "Посев и всходы",
      nameEn: "Planting & Emergence",
      shortDescUz: "Urug' qadash, tuproq haroratini nazorat qilish va birinchi unib chiqish davri",
      shortDescRu: "Посев семян, контроль температуры почвы и появление первых всходов",
      shortDescEn: "Seeding, soil temperature monitoring, and initial seedling emergence",
      icon: "🌱",
      startDay: 0,
      endDay: timeline.stages[0].endDay,
      checklistUz: [
        { id: 'p1', text: "Tuproq harorati kamida +14°C ekanligini tekshirish" },
        { id: 'p2', text: "Urug' ekish chuqurligini bir xilda (4-5 sm) saqlash" },
        { id: 'p3', text: "Unib chiqish foizini hisoblash (85%+ me'yor)" },
      ],
      checklistRu: [
        { id: 'p1', text: "Проверить температуру почвы (не менее +14°C)" },
        { id: 'p2', text: "Обеспечить равномерную глубину заделки семян (4-5 см)" },
        { id: 'p3', text: "Оценить процент всхожести (норма 85%+)" },
      ],
      checklistEn: [
        { id: 'p1', text: "Verify soil temperature is at least +14°C" },
        { id: 'p2', text: "Maintain uniform seed depth (4-5 cm)" },
        { id: 'p3', text: "Assess emergence rate (target 85%+)" },
      ],
      irrigationGuidanceUz: "Yengil namlovchi sug'orish (30-40 m³/ga), qatqaloq hosil bo'lishiga yo'l qo'ymaslik",
      irrigationGuidanceRu: "Лёгкий увлажнительный полив (30-40 м³/га), предотвращение корки",
      irrigationGuidanceEn: "Light moisture irrigation (30-40 m³/ha), prevent soil crusting",
      nutrientFocusUz: "Fosfor va rux (ildiz tizimini baquvvat qilish uchun)",
      nutrientFocusRu: "Фосфор и цинк (для стимуляции корневой системы)",
      nutrientFocusEn: "Phosphorus and zinc (for vigorous root establishment)",
    },
    {
      id: 'vegetation',
      index: 1,
      nameUz: "O'sish & Vegetatsiya",
      nameRu: "Вегетативный рост",
      nameEn: "Vegetation & Canopy",
      shortDescUz: "Barglar va poyaning jadal rivojlanishi, ildiz chuqurlashishi va qator oralarini ishlash",
      shortDescRu: "Интенсивный рост стеблей и листьев, развитие корневой зоны и культивация",
      shortDescEn: "Rapid canopy development, root deepening, and row inter-cultivation",
      icon: "🌿",
      startDay: timeline.stages[0].endDay + 1,
      endDay: timeline.stages[1].endDay,
      checklistUz: [
        { id: 'v1', text: "Qator oralarini kultivatsiya qilish va begona o'tlarni yo'qotish" },
        { id: 'v2', text: "Azotli o'g'it bilan birinchi oziqlantirishni o'tkazish" },
        { id: 'v3', text: "NDVI yashillik xaritasida orqada qolgan joylarni aniqlash" },
      ],
      checklistRu: [
        { id: 'v1', text: "Междурядная культивация и прополка сорняков" },
        { id: 'v2', text: "Внесение первой азотной подкормки" },
        { id: 'v3', text: "Анализ зон отставания по карте вегетации NDVI" },
      ],
      checklistEn: [
        { id: 'v1', text: "Inter-row cultivation and weed control" },
        { id: 'v2', text: "Apply first nitrogen top-dressing" },
        { id: 'v3', text: "Analyze low-biomass zones on satellite NDVI map" },
      ],
      irrigationGuidanceUz: "Muntazam chuqur sug'orish (60-70 m³/ga), tuproq namligini 65-75% oralig'ida ushlash",
      irrigationGuidanceRu: "Регулярный полив (60-70 м³/га), поддержание влажности 65-75%",
      irrigationGuidanceEn: "Regular deep irrigation (60-70 m³/ha), target 65-75% soil moisture",
      nutrientFocusUz: "Azot (Karbamid/Selitra) + mikroelementlar",
      nutrientFocusRu: "Азот (Карбамид/Селитра) + микроэлементы",
      nutrientFocusEn: "Nitrogen (Urea/Nitrate) + micronutrients",
    },
    {
      id: 'flowering',
      index: 2,
      nameUz: "Gullash & Shakllanish",
      nameRu: "Цветение и завязь",
      nameEn: "Flowering & Fruit Set",
      shortDescUz: "Gullash, tugunak va mevalar shakllanishi — eng ko'p suv va kaliy talab qiluvchi muhim davr",
      shortDescRu: "Цветение, закладка завязей и плодов — критический период максимальной потребности в воде",
      shortDescEn: "Flowering, fruit/boll set — peak water and potassium consumption window",
      icon: "🌸",
      startDay: timeline.stages[1].endDay + 1,
      endDay: timeline.stages[2].endDay,
      checklistUz: [
        { id: 'f1', text: "Suv tanqisligiga yo'l qo'ymaslik (stress gullarni to'kib yuboradi)" },
        { id: 'f2', text: "Kaliy va bor bilan bargdan oziqlantirish" },
        { id: 'f3', text: "Zararkunandalarga qarshi biologik yoki kimyoviy himoya" },
      ],
      checklistRu: [
        { id: 'f1', text: "Исключить водный стресс (дефицит влаги приводит к сбросу завязей)" },
        { id: 'f2', text: "Листовая подкормка калием и бором" },
        { id: 'f3', text: "Мониторинг и биозащита от совки, клеща и вредителей" },
      ],
      checklistEn: [
        { id: 'f1', text: "Prevent water stress (drought triggers flower/boll drop)" },
        { id: 'f2', text: "Apply foliar potassium and boron" },
        { id: 'f3', text: "Active pest scouting and targeted crop protection" },
      ],
      irrigationGuidanceUz: "Maksimal sug'orish me'yori (75-90 m³/ga), intervalni 5-7 kundan oshirmaslik",
      irrigationGuidanceRu: "Максимальный полив (75-90 м³/га), интервал не более 5-7 дней",
      irrigationGuidanceEn: "Peak irrigation volume (75-90 m³/ha), strict 5-7 day cycle",
      nutrientFocusUz: "Kaliy, Fosfor, Bor va Kalsiy",
      nutrientFocusRu: "Калий, фосфор, бор и кальций",
      nutrientFocusEn: "Potassium, phosphorus, boron, and calcium",
    },
    {
      id: 'harvest',
      index: 3,
      nameUz: "Pishish & Hosil Terimi",
      nameRu: "Созревание и сбор",
      nameEn: "Ripening & Harvest",
      shortDescUz: "Hosildorlikni to'liq shakllantirish, sug'orishni to'xtatish va sifatli terim o'tkazish",
      shortDescRu: "Финальное созревание, прекращение полива и сбор высококачественного урожая",
      shortDescEn: "Final maturation, irrigation cessation, and harvest collection",
      icon: "🌾",
      startDay: timeline.stages[2].endDay + 1,
      endDay: timeline.totalDays,
      checklistUz: [
        { id: 'h1', text: "Terimdan 12-15 kun oldin sug'orishni butunlay to'xtatish" },
        { id: 'h2', text: "Defoliatsiya yoki hosilni terimga tayyorlash" },
        { id: 'h3', text: "Ekinix Hosil Bozoriga e'lon joylashtirish" },
      ],
      checklistRu: [
        { id: 'h1', text: "Прекратить поливы за 12-15 дней до сбора" },
        { id: 'h2', text: "Провести дефолиацию или предуборочную подготовку" },
        { id: 'h3', text: "Опубликовать урожай на рынке Ekinix" },
      ],
      checklistEn: [
        { id: 'h1', text: "Cease irrigation 12-15 days prior to harvest" },
        { id: 'h2', text: "Defoliation / pre-harvest crop conditioning" },
        { id: 'h3', text: "Post harvest lot on Ekinix Marketplace" },
      ],
      irrigationGuidanceUz: "Sug'orish to'xtatiladi yoki minimal darajada ushlab turiladi",
      irrigationGuidanceRu: "Поливы прекращаются для ускорения созревания",
      irrigationGuidanceEn: "Irrigation terminated to facilitate uniform ripening",
      nutrientFocusUz: "O'g'itlash to'xtatiladi",
      nutrientFocusRu: "Подкормки завершены",
      nutrientFocusEn: "Fertilization completed",
    },
  ];

  // Determine current milestone index based on days elapsed
  let currentMilestoneIndex = 0;
  if (daysElapsed <= timeline.stages[0].endDay) {
    currentMilestoneIndex = 0;
  } else if (daysElapsed <= timeline.stages[1].endDay) {
    currentMilestoneIndex = 1;
  } else if (daysElapsed <= timeline.stages[2].endDay) {
    currentMilestoneIndex = 2;
  } else {
    currentMilestoneIndex = 3;
  }

  const currentMilestone = allMilestones[currentMilestoneIndex];
  const overallProgressPercent = Math.min(100, Math.round((daysElapsed / timeline.totalDays) * 100));
  const daysRemainingInMilestone = Math.max(0, currentMilestone.endDay - daysElapsed);

  return {
    cropType,
    plantingDate: plantingDateStr || '2026-04-10',
    daysElapsed,
    totalSeasonDays: timeline.totalDays,
    overallProgressPercent,
    currentMilestone,
    currentMilestoneIndex,
    allMilestones,
    daysRemainingInMilestone,
  };
}
