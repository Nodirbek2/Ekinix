export type Language = 'uz' | 'ru' | 'en';

export interface Translations {
  // Navigation
  home: string;
  fields: string;
  weatherIrrigation: string;
  marketplace: string;
  guides: string;
  login: string;
  register: string;
  dbSetup: string;

  // Hero
  heroTagline: string;
  heroTitle: string;
  heroSub: string;
  getStarted: string;
  tryDemo: string;
  moistureCardTitle: string;
  moistureStatus: string;
  fieldAreaCardTitle: string;
  fieldAreaValue: string;
  nextIrrigationTitle: string;
  nextIrrigationValue: string;

  // How It Works
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;

  // Demo / Preview Sections
  demoTitle: string;
  demoSubtitle: string;
  tabSatellite: string;
  tabWeather: string;
  tabMarket: string;
  tabGuides: string;

  // Satellite Section
  satelliteHeader: string;
  selectField: string;
  ndviIndex: string;
  soilMoisture: string;
  fieldStatus: string;
  fieldStatusGood: string;
  fieldStatusWarning: string;
  irrigationAdvice: string;
  satelliteNote: string;

  // Weather Section
  weatherHeader: string;
  selectRegion: string;
  currentTemp: string;
  humidity: string;
  windSpeed: string;
  precipitationChance: string;
  irrigationRecommendation: string;
  dayForecast: string;

  // Marketplace Section
  marketHeader: string;
  marketSub: string;
  addListing: string;
  filterAll: string;
  pricePerUnit: string;
  quantity: string;
  contactFarmer: string;
  location: string;

  // Guides Section
  guidesHeader: string;
  guidesSub: string;
  readMore: string;

  // Auth Modal
  authLoginTitle: string;
  authRegisterTitle: string;
  phoneOrEmail: string;
  password: string;
  fullName: string;
  region: string;
  authSubmitLogin: string;
  authSubmitRegister: string;
  supabaseConnected: string;
  supabaseNotConnected: string;
  noAccount: string;
  hasAccount: string;

  // Onboarding Flow
  onboardingTitle: string;
  onboardingSubtitle: string;
  stepCounter: string; // e.g. "Qadam {step} / 3"
  onboardingStep1Title: string;
  onboardingStep1Sub: string;
  onboardingStep2Title: string;
  onboardingStep2Sub: string;
  onboardingStep3Title: string;
  onboardingStep3Sub: string;
  farmTypeSmallholderTitle: string;
  farmTypeSmallholderDesc: string;
  farmTypeCommercialTitle: string;
  farmTypeCommercialDesc: string;
  cropCotton: string;
  cropWheat: string;
  cropApple: string;
  cropGrape: string;
  cropPomegranate: string;
  cropTomato: string;
  cropOther: string;
  btnNext: string;
  btnBack: string;
  btnFinish: string;
  myProfile: string;
  logout: string;

  // My Fields Section
  myFieldsTitle: string;
  myFieldsSubtitle: string;
  addFieldBtn: string;
  fieldNameLabel: string;
  cropTypeLabel: string;
  plantingDateLabel: string;
  drawBoundaryInstruction: string;
  closeBoundaryBtn: string;
  boundaryClosed: string;
  reopenBoundary: string;
  calculatedArea: string;
  resetMapPoints: string;
  saveFieldBtn: string;
  noFieldsYet: string;
  noFieldsSub: string;
  hectaresUnit: string;
  pointsCount: string;

  // Farmer Dashboard
  dashboardTitle: string;
  dashboardSubtitle: string;
  healthStatusLabel: string;
  statusGood: string;
  statusModerate: string;
  statusStressed: string;
  statusHealthy: string;
  statusModerateStress: string;
  statusHighStress: string;
  ndviScoreLabel: string;
  trendImproving: string;
  trendDeclining: string;
  trendStable: string;
  cloudCoverWarning: string;
  satelliteSource: string;
  fetchingNdvi: string;
  weatherForecastTitle: string;
  rainExpectedTitle: string;
  rainExpectedMsg: string;
  noRainTitle: string;
  noRainMsg: string;
  today: string;
  rainChance: string;
  loadingWeather: string;
  weatherError: string;
  dashboardNavTab: string;

  // Footer
  footerDesc: string;
  allRightsReserved: string;
}

export const translations: Record<Language, Translations> = {
  uz: {
    home: "Bosh sahifa",
    fields: "Maydonlar",
    weatherIrrigation: "Ob-havo va Sug'orish",
    marketplace: "Hosil bozori",
    guides: "Dehqonchilik qo'llanmasi",
    login: "Kirish",
    register: "Ro'yxatdan o'tish",
    dbSetup: "Supabase sozlamasi",

    heroTagline: "O'zbekiston dehqonlari uchun aqlli yordamchi",
    heroTitle: "Ekinlaringiz unumdorligini sun'iy yo'ldosh orqali oshiring",
    heroSub: "Sun'iy yo'ldosh orqali ekin holatini kuzatish, aniq sug'orish tavsiyalari va hosilni vositachisiz to'g'ridan-to'g'ri sotish — barchasi bitta qulay ilovada.",
    getStarted: "Bepul boshlash",
    tryDemo: "Tizimni sinab ko'rish",
    moistureCardTitle: "Tuproq namligi",
    moistureStatus: "Yaxshi (68%)",
    fieldAreaCardTitle: "Ekin maydoni",
    fieldAreaValue: "4.2 gektar (Paxta)",
    nextIrrigationTitle: "Navbatdagi sug'orish",
    nextIrrigationValue: "Ertaga ertalab, 350 m³",

    howItWorksTitle: "Qanday ishlaydi?",
    howItWorksSubtitle: "Ekinix orqali dehqonchilikni zamonaviy va samarali boshqarishning 3 ta oddiy qadami",
    step1Title: "1. Maydoningizni xaritada belgilang",
    step1Desc: "O'zingizning ekin maydoningiz chegaralarini xaritada osongina chizing yoki koordinatali belgilang.",
    step2Title: "2. Sun'iy yo'ldosh va sug'orish tahlili",
    step2Desc: "Sentinel sun'iy yo'ldosh tasviri (NDVI) va ob-havo ma'lumotlari asosida aniq sug'orish tavsiyasini oling.",
    step3Title: "3. Hosilingizni unumli soting",
    step3Desc: "Tayyor hosilingizni hech qanday vositachilarsiz to'g'ridan-to'g meva-sabzavot xaridorlariga taklif qiling.",

    demoTitle: "Ekinix platformasini amalda ko'ring",
    demoSubtitle: "Har bir dehqon uchun tushunarli va qulay vositalar",
    tabSatellite: "Sun'iy yo'ldosh kuzatuvi",
    tabWeather: "Ob-havo va Sug'orish",
    tabMarket: "Hosil bozori",
    tabGuides: "Agro qo'llanma",

    satelliteHeader: "Maydoningizning NDVI va namlik xaritasi",
    selectField: "Maydonni tanlang",
    ndviIndex: "NDVI O'simlik Indeksi",
    soilMoisture: "Tuproq Namlik Darajasi",
    fieldStatus: "Ekin Holati",
    fieldStatusGood: "Sog'lom rivojlanish",
    fieldStatusWarning: "Suv tanqisligi sezilmoqda",
    irrigationAdvice: "Sug'orish Tavsiyasi",
    satelliteNote: "Sun'iy yo'ldosh tasviri har 3-5 kunda yangilanadi. Ma'lumotlar Open-Meteo va Sentinel bazasidan olinadi.",

    weatherHeader: "O'zbekiston hududlari bo'yicha agro ob-havo va sug'orish grafigi",
    selectRegion: "Viloyatni tanlang",
    currentTemp: "Harorat",
    humidity: "Havo namligi",
    windSpeed: "Shamol tezligi",
    precipitationChance: "Yog'ingarchilik ehtimoli",
    irrigationRecommendation: "Bugungi Sug'orish Rejasi",
    dayForecast: "7 kunlik ob-havo prognozi",

    marketHeader: "Qishloq xo'jaligi hosil bozori",
    marketSub: "To'g'ridan-to'g'ri dehqon va xaridorlarni bog'lovchi platforma. Barcha narxlar so'mda.",
    addListing: "+ Ekin sotuvga qo'yish",
    filterAll: "Barchasi",
    pricePerUnit: "Narxi (1 kg/tonna)",
    quantity: "Miqdori",
    contactFarmer: "Dehqon bilan bog'lanish",
    location: "Joylashuv",

    guidesHeader: "Dehqon uchun foydali qo'llanmalar",
    guidesSub: "Paxta, bug'doy, sabzavot va mevali bog'larni parvarish qilish bo'yicha mutaxassis maslahatlari",
    readMore: "Batafsil o'qish",

    authLoginTitle: "Tizimga kirish",
    authRegisterTitle: "Dehqon sifatida ro'yxatdan o'tish",
    phoneOrEmail: "Telefon raqam yoki Email",
    password: "Parol",
    fullName: "Ism va Familiya",
    region: "Viloyatingiz",
    authSubmitLogin: "Tizimga kirish",
    authSubmitRegister: "Ro'yxatdan o'tish",
    supabaseConnected: "Supabase bazasiga ulandi (Aktiv)",
    supabaseNotConnected: "Supabase kalitlari o'rnatilmagan (Demo rejimida ishlamoqda)",
    noAccount: "Hali hisobingiz yo'qmi? Ro'yxatdan o'ting",
    hasAccount: "Hisobingiz bormi? Tizimga kiring",

    onboardingTitle: "Dehqon Profilini Sozlash",
    onboardingSubtitle: "Sizga moslashtirilgan agro-tavsiyalar ko'rsatishimiz uchun 3 ta qisqa qadam",
    stepCounter: "Qadam",
    onboardingStep1Title: "Ismingiz va Viloyatingiz",
    onboardingStep1Sub: "O'zingiz va yer maydoningiz joylashgan hududni ko'rsating",
    onboardingStep2Title: "Xo'jalik Turi",
    onboardingStep2Sub: "Ekin yer maydoningizning umumiy toifasini tanlang",
    onboardingStep3Title: "Asosiy Ekinlaringiz",
    onboardingStep3Sub: "Maydoningizda yetishtiriladigan asosiy ekin turlari",
    farmTypeSmallholderTitle: "Tomorqa / Kichik Dehqon",
    farmTypeSmallholderDesc: "Oila ehtiyoji va kichik lokal bozor uchun (0.1–10 ha)",
    farmTypeCommercialTitle: "Fermer Xo'jaligi / Tijorat",
    farmTypeCommercialDesc: "Sanoat va yirik tijorat hosili yetishtirish uchun (10+ ha)",
    cropCotton: "Paxta (G'o'za)",
    cropWheat: "Bug'doy (Kuzgi/Bahorgi)",
    cropApple: "Olma Bog'i",
    cropGrape: "Uzumzor",
    cropPomegranate: "Anor",
    cropTomato: "Pomidor (Ochiq/Issiqxona)",
    cropOther: "Boshqa ekinlar",
    btnNext: "Keyingisi →",
    btnBack: "← Orqaga",
    btnFinish: "Saqlash va Boshlash",
    myProfile: "Mening profilim",
    logout: "Chiqish",

    myFieldsTitle: "Mening Maydonlarim",
    myFieldsSubtitle: "Xaritada yer burchaklarini belgilang va ekinlaringizni aqlli nazorat qiling",
    addFieldBtn: "+ Yangi Maydon Belgilash",
    fieldNameLabel: "Maydon Nomi",
    cropTypeLabel: "Ekin Turi",
    plantingDateLabel: "Ekilgan / Ekiladigan Sana",
    drawBoundaryInstruction: "Xaritaga bosib, maydoningizning burchak nuqtalarini belgilang (kamida 4 ta burchak nuqtasi talab qilinadi).",
    closeBoundaryBtn: "Chegarani yakunlash (Maydonni yopish)",
    boundaryClosed: "Maydon chegaralari muvaffaqiyatli yopildi! Quyidagi formani to'ldirib saqlang.",
    reopenBoundary: "Chegarani qayta ochish (tahrirlash)",
    calculatedArea: "Hisoblangan Maydon",
    resetMapPoints: "Nuqtalarni Tozalash",
    saveFieldBtn: "Maydonni Saqlash",
    noFieldsYet: "Hali birorta maydon belgilanmagan",
    noFieldsSub: "Yangi maydon belgilang va sun'iy yo'ldosh orqali tuproq namligi va ekin o'sishini kuzating",
    hectaresUnit: "gektar",
    pointsCount: "burchak nuqtasi",

    dashboardTitle: "Fermer Boshqaruv Paneli",
    dashboardSubtitle: "Har bir maydoningiz bo'yicha ekin salomatligi, Open-Meteo ob-havo va aqlli sug'orish tavsiyalari",
    healthStatusLabel: "Ekin Salomatligi",
    statusGood: "A'lo (Sog'lom)",
    statusModerate: "O'rtacha Holat",
    statusStressed: "E'tibor Talab qiladi",
    statusHealthy: "Sog'lom (Yashil)",
    statusModerateStress: "O'rtacha stress (Sariq)",
    statusHighStress: "Yuqori stress (Qizil)",
    ndviScoreLabel: "NDVI Ko'rsatkichi",
    trendImproving: "Yaxshilanmoqda",
    trendDeclining: "Yomonlashmoqda",
    trendStable: "Barqaror",
    cloudCoverWarning: "Bu hafta aniq sun'iy yo'ldosh tasviri yo'q — birozdan keyin qayta tekshiring",
    satelliteSource: "Sentinel-2 L2A Telemetriyasi",
    fetchingNdvi: "Sentinel Hub'dan NDVI ma'lumotlari olinmoqda...",
    weatherForecastTitle: "Jonli Ob-Havo & Yomg'ir Prognozi",
    rainExpectedTitle: "Yog'ingarchilik kutilmoqda",
    rainExpectedMsg: "Yaqin 2 kunda yomg'ir yog'ish ehtimoli yuqori (60%+). Suvni tejash va tuproq ko'llashining oldini olish uchun sug'orishni kechiktirish tavsiya etiladi.",
    noRainTitle: "Jiddiy yog'ingarchilik kutilmayapti",
    noRainMsg: "Yaqin kunlarda yomg'ir ehtimoli past. Tuproq namligini tekshirib, ekin turiga mos rejali sug'orishni amalga oshiring.",
    today: "Bugun",
    rainChance: "Yomg'ir",
    loadingWeather: "Open-Meteo orqali ob-havo ma'lumotlari yuklanmoqda...",
    weatherError: "Ob-havo ma'lumotini yuklab bo'lmadi. GPS koordinatalari tekshirilmoqda.",
    dashboardNavTab: "Boshqaruv Paneli",

    footerDesc: "Ekinix — O'zbekiston dehqonlari va fermerlari uchun yaratilgan milliy raqamli agro-platforma.",
    allRightsReserved: "Barcha huquqlar himoyalangan."
  },
  ru: {
    home: "Главная",
    fields: "Поля",
    weatherIrrigation: "Погода и Полив",
    marketplace: "Рынок Урожая",
    guides: "Справочник",
    login: "Войти",
    register: "Регистрация",
    dbSetup: "Настройка Supabase",

    heroTagline: "Умный помощник для фермеров Узбекистана",
    heroTitle: "Повышайте урожайность с помощью спутникового мониторинга",
    heroSub: "Спутниковый контроль состояния посевов, точные рекомендации по поливу и прямой доступ к рынку без посредников.",
    getStarted: "Начать бесплатно",
    tryDemo: "Попробовать демо",
    moistureCardTitle: "Влажность почвы",
    moistureStatus: "Отлично (68%)",
    fieldAreaCardTitle: "Площадь поля",
    fieldAreaValue: "4.2 га (Хлопок)",
    nextIrrigationTitle: "Следующий полив",
    nextIrrigationValue: "Завтра утром, 350 м³",

    howItWorksTitle: "Как это работает?",
    howItWorksSubtitle: "3 простых шага для современного и эффективного управления фермой с Ekinix",
    step1Title: "1. Отметьте поле на карте",
    step1Desc: "Легко нарисуйте или отметьте границы вашего поля на интерактивной карте.",
    step2Title: "2. Спутниковый анализ и полив",
    step2Desc: "Получайте индекс NDVI с космических снимков Sentinel и расчет норм полива.",
    step3Title: "3. Выгодно продавайте урожай",
    step3Desc: "Размещайте объявления и продавайте урожай напрямую оптовым покупателям.",

    demoTitle: "Испробуйте платформу Ekinix в действии",
    demoSubtitle: "Понятные и удобные инструменты для каждого дехканина",
    tabSatellite: "Спутниковый мониторинг",
    tabWeather: "Погода и Полив",
    tabMarket: "Рынок Урожая",
    tabGuides: "Агро справочник",

    satelliteHeader: "Карта NDVI и влажности вашего поля",
    selectField: "Выберите поле",
    ndviIndex: "Индекс вегетации NDVI",
    soilMoisture: "Уровень влажности почвы",
    fieldStatus: "Состояние культур",
    fieldStatusGood: "Здоровое развитие",
    fieldStatusWarning: "Наблюдается дефицит влаги",
    irrigationAdvice: "Рекомендация по поливу",
    satelliteNote: "Спутниковые снимки обновляются каждые 3-5 дней. Данные Sentinel и Open-Meteo.",

    weatherHeader: "Агропогода и график полива по регионам Узбекистана",
    selectRegion: "Выберите область",
    currentTemp: "Температура",
    humidity: "Влажность воздуха",
    windSpeed: "Скорость ветра",
    precipitationChance: "Вероятность осадков",
    irrigationRecommendation: "План полива на сегодня",
    dayForecast: "Прогноз погоды на 7 дней",

    marketHeader: "Сельскохозяйственный маркетплейс",
    marketSub: "Платформа прямого контакта фермеров и покупателей. Все цены в сумах (UZS).",
    addListing: "+ Разместить урожай",
    filterAll: "Все",
    pricePerUnit: "Цена (1 кг/тонна)",
    quantity: "Количество",
    contactFarmer: "Связаться с фермером",
    location: "Локация",

    guidesHeader: "Полезные руководства для фермера",
    guidesSub: "Советы экспертов по выращиванию хлопчатника, пшеницы, овощей и садов",
    readMore: "Читать далее",

    authLoginTitle: "Вход в систему",
    authRegisterTitle: "Регистрация фермера",
    phoneOrEmail: "Телефон или Email",
    password: "Пароль",
    fullName: "Имя и Фамилия",
    region: "Ваша область",
    authSubmitLogin: "Войти",
    authSubmitRegister: "Зарегистрироваться",
    supabaseConnected: "Подключено к базе Supabase (Активно)",
    supabaseNotConnected: "Ключи Supabase не настроены (Работает в демо режиме)",
    noAccount: "Нет аккаунта? Зарегистрируйтесь",
    hasAccount: "Уже есть аккаунт? Войдите",

    onboardingTitle: "Настройка Профиля Фермера",
    onboardingSubtitle: "3 коротких шага для персональных агро-рекомендаций",
    stepCounter: "Шаг",
    onboardingStep1Title: "Имя и Область",
    onboardingStep1Sub: "Укажите ваши данные и регион вашего участка",
    onboardingStep2Title: "Тип Хозяйства",
    onboardingStep2Sub: "Выберите общую категорию вашего хозяйства",
    onboardingStep3Title: "Основные Культуры",
    onboardingStep3Sub: "Культуры, выращиваемые на вашем участке (можно несколько)",
    farmTypeSmallholderTitle: "Личное Хозяйство / Дехканин",
    farmTypeSmallholderDesc: "Для семейного потребления и небольших продаж (0.1–10 га)",
    farmTypeCommercialTitle: "Фермерское Хозяйство / Коммерция",
    farmTypeCommercialDesc: "Для коммерческого и промышленного выращивания (10+ га)",
    cropCotton: "Хлопчатник",
    cropWheat: "Пшеница (Озимая/Яровая)",
    cropApple: "Яблоневый Сад",
    cropGrape: "Виноградник",
    cropPomegranate: "Гранат",
    cropTomato: "Томаты (Открытый/Теплица)",
    cropOther: "Другие культуры",
    btnNext: "Далее →",
    btnBack: "← Назад",
    btnFinish: "Сохранить и Начать",
    myProfile: "Мой профиль",
    logout: "Выйти",

    myFieldsTitle: "Мои Поля",
    myFieldsSubtitle: "Отмечайте границы полей на карте и отслеживайте состояние посевов",
    addFieldBtn: "+ Добавить Поле",
    fieldNameLabel: "Название Поля",
    cropTypeLabel: "Тип Культуры",
    plantingDateLabel: "Дата Посадки",
    drawBoundaryInstruction: "Отметьте угловые точки поля на карте (требуется минимум 4 точки).",
    closeBoundaryBtn: "Завершить контур (Закрыть)",
    boundaryClosed: "Контур поля успешно замкнут! Заполните форму ниже для сохранения.",
    reopenBoundary: "Открыть контур (редактировать)",
    calculatedArea: "Рассчитанная Площадь",
    resetMapPoints: "Очистить Точки",
    saveFieldBtn: "Сохранить Поле",
    noFieldsYet: "Пока нет зарегистрированных полей",
    noFieldsSub: "Отметьте свое первое поле на карте, чтобы получить спутниковый анализ влажности и биомассы",
    hectaresUnit: "га",
    pointsCount: "угловых точек",

    dashboardTitle: "Панель Управления Фермера",
    dashboardSubtitle: "Состояние культур, прогноз погоды Open-Meteo и рекомендации по поливу для каждого поля",
    healthStatusLabel: "Состояние Посевов",
    statusGood: "Отличное (Здоровое)",
    statusModerate: "Удовлетворительное",
    statusStressed: "Требует Внимания",
    statusHealthy: "Здоровый (Зеленый)",
    statusModerateStress: "Умеренный стресс (Желтый)",
    statusHighStress: "Высокий стресс (Красный)",
    ndviScoreLabel: "Индекс NDVI",
    trendImproving: "Улучшается",
    trendDeclining: "Ухудшается",
    trendStable: "Стабильно",
    cloudCoverWarning: "На этой неделе нет четкого спутникового снимка — проверьте позже",
    satelliteSource: "Телеметрия Sentinel-2 L2A",
    fetchingNdvi: "Получение данных NDVI из Sentinel Hub...",
    weatherForecastTitle: "Прогноз Погоды & Осадков",
    rainExpectedTitle: "Ожидаются осадки",
    rainExpectedMsg: "В ближайшие 2 дня высока вероятность дождя (60%+). Рекомендуется отложить полив для экономии воды.",
    noRainTitle: "Значительных осадков не ожидается",
    noRainMsg: "В ближайшие дни вероятность дождя низкая. Проверьте влажность почвы и проведите плановый полив.",
    today: "Сегодня",
    rainChance: "Дождь",
    loadingWeather: "Загрузка погоды через Open-Meteo...",
    weatherError: "Не удалось загрузить данные погоды.",
    dashboardNavTab: "Панель Управления",

    footerDesc: "Ekinix — цифровая агро-платформа для фермеров и дехкан Узбекистана.",
    allRightsReserved: "Все права защищены."
  },
  en: {
    home: "Home",
    fields: "Fields",
    weatherIrrigation: "Weather & Irrigation",
    marketplace: "Crop Market",
    guides: "Agri Guides",
    login: "Sign In",
    register: "Register",
    dbSetup: "Supabase Setup",

    heroTagline: "Smart Assistant for Farmers in Uzbekistan",
    heroTitle: "Boost Your Crop Yields with Satellite Monitoring",
    heroSub: "Satellite-driven vegetation tracking, precision irrigation advice, and direct marketplace access for farmers — all in one simple platform.",
    getStarted: "Get Started Free",
    tryDemo: "Explore Demo",
    moistureCardTitle: "Soil Moisture",
    moistureStatus: "Optimal (68%)",
    fieldAreaCardTitle: "Field Area",
    fieldAreaValue: "4.2 ha (Cotton)",
    nextIrrigationTitle: "Next Irrigation",
    nextIrrigationValue: "Tomorrow morning, 350 m³",

    howItWorksTitle: "How It Works",
    howItWorksSubtitle: "3 simple steps to modern and efficient farm management with Ekinix",
    step1Title: "1. Map Your Field Boundaries",
    step1Desc: "Draw or select your farm land boundaries easily on the interactive map.",
    step2Title: "2. Satellite & Water Analytics",
    step2Desc: "Receive NDVI vegetation health index and automated irrigation schedule.",
    step3Title: "3. Sell Crop Harvest Directly",
    step3Desc: "List your fresh produce and connect directly with buyers with zero middlemen fees.",

    demoTitle: "Experience Ekinix Platform Live",
    demoSubtitle: "Simple, intuitive tools tailored for local agricultural conditions",
    tabSatellite: "Satellite Monitoring",
    tabWeather: "Weather & Irrigation",
    tabMarket: "Crop Market",
    tabGuides: "Agri Guides",

    satelliteHeader: "NDVI Vegetation & Soil Moisture Map",
    selectField: "Select Field",
    ndviIndex: "NDVI Vegetation Index",
    soilMoisture: "Soil Moisture Level",
    fieldStatus: "Crop Health",
    fieldStatusGood: "Healthy Growth",
    fieldStatusWarning: "Water Deficit Detected",
    irrigationAdvice: "Irrigation Advice",
    satelliteNote: "Satellite images refreshed every 3-5 days via Sentinel Hub and Open-Meteo.",

    weatherHeader: "Agri Weather & Irrigation Schedule across Uzbekistan Regions",
    selectRegion: "Select Region",
    currentTemp: "Temperature",
    humidity: "Humidity",
    windSpeed: "Wind Speed",
    precipitationChance: "Precipitation",
    irrigationRecommendation: "Today's Irrigation Plan",
    dayForecast: "7-Day Weather Forecast",

    marketHeader: "Agriculture Crop Marketplace",
    marketSub: "Direct peer-to-peer trading between Uzbek farmers and buyers. Prices in UZS.",
    addListing: "+ Post Crop Listing",
    filterAll: "All Crops",
    pricePerUnit: "Price (per kg/ton)",
    quantity: "Quantity",
    contactFarmer: "Contact Farmer",
    location: "Location",

    guidesHeader: "Farmer Practical Guides",
    guidesSub: "Expert guidelines for cotton, wheat, tomato, apple orchards and soil health",
    readMore: "Read Guide",

    authLoginTitle: "Farmer Login",
    authRegisterTitle: "Register New Account",
    phoneOrEmail: "Phone Number or Email",
    password: "Password",
    fullName: "Full Name",
    region: "Region in Uzbekistan",
    authSubmitLogin: "Sign In",
    authSubmitRegister: "Create Account",
    supabaseConnected: "Connected to Supabase Database (Active)",
    supabaseNotConnected: "Supabase Keys Not Configured (Running in Demo Mode)",
    noAccount: "Don't have an account? Register",
    hasAccount: "Already have an account? Sign in",

    onboardingTitle: "Farmer Profile Setup",
    onboardingSubtitle: "3 quick steps to get personalized agricultural recommendations",
    stepCounter: "Step",
    onboardingStep1Title: "Farmer Name & Region",
    onboardingStep1Sub: "Provide your name and the location of your farmland",
    onboardingStep2Title: "Farm Type",
    onboardingStep2Sub: "Select the operational scale of your agricultural land",
    onboardingStep3Title: "Primary Crops Grown",
    onboardingStep3Sub: "Select main crops grown on your land (multi-select)",
    farmTypeSmallholderTitle: "Smallholder Farm",
    farmTypeSmallholderDesc: "For household consumption and local market sale (0.1–10 ha)",
    farmTypeCommercialTitle: "Commercial Farm",
    farmTypeCommercialDesc: "For large-scale and industrial farming (10+ ha)",
    cropCotton: "Cotton",
    cropWheat: "Wheat (Winter/Spring)",
    cropApple: "Apple Orchard",
    cropGrape: "Vineyard",
    cropPomegranate: "Pomegranate",
    cropTomato: "Tomato (Open/Greenhouse)",
    cropOther: "Other Crops",
    btnNext: "Next →",
    btnBack: "← Back",
    btnFinish: "Save & Complete",
    myProfile: "My Profile",
    logout: "Log Out",

    myFieldsTitle: "My Fields",
    myFieldsSubtitle: "Draw field boundaries on the map to monitor soil moisture and satellite vegetation",
    addFieldBtn: "+ Register New Field",
    fieldNameLabel: "Field Name",
    cropTypeLabel: "Crop Type",
    plantingDateLabel: "Planting Date",
    drawBoundaryInstruction: "Click on the map to place corner boundary points (at least 4 points required).",
    closeBoundaryBtn: "Finish Boundary (Close Polygon)",
    boundaryClosed: "Field boundary successfully closed! Fill in the form details below to save.",
    reopenBoundary: "Reopen boundary (edit points)",
    calculatedArea: "Calculated Area",
    resetMapPoints: "Clear Points",
    saveFieldBtn: "Save Field",
    noFieldsYet: "No registered fields yet",
    noFieldsSub: "Mark your first field boundary on the map to unlock satellite telemetry and irrigation recommendations",
    hectaresUnit: "hectares",
    pointsCount: "corner points",

    dashboardTitle: "Farmer Dashboard",
    dashboardSubtitle: "Live crop health status, Open-Meteo weather forecasts, and smart irrigation recommendations for each registered field",
    healthStatusLabel: "Crop Health Status",
    statusGood: "Good (Healthy)",
    statusModerate: "Moderate Condition",
    statusStressed: "Attention Needed",
    statusHealthy: "Healthy (Green)",
    statusModerateStress: "Moderate stress (Yellow)",
    statusHighStress: "High stress (Red)",
    ndviScoreLabel: "NDVI Index",
    trendImproving: "Improving",
    trendDeclining: "Declining",
    trendStable: "Stable",
    cloudCoverWarning: "No clear satellite image this week — check back soon",
    satelliteSource: "Sentinel-2 L2A Telemetry",
    fetchingNdvi: "Fetching Sentinel Hub NDVI data...",
    weatherForecastTitle: "Live Weather & Rain Forecast",
    rainExpectedTitle: "Rain expected — consider delaying irrigation",
    rainExpectedMsg: "High precipitation probability in the next 2 days (60%+). Delay irrigation to conserve water and protect root systems.",
    noRainTitle: "No significant rain expected — check soil moisture",
    noRainMsg: "Low rain probability in upcoming days. Inspect soil moisture and proceed with planned irrigation.",
    today: "Today",
    rainChance: "Rain",
    loadingWeather: "Fetching Open-Meteo weather forecast...",
    weatherError: "Unable to load live weather data.",
    dashboardNavTab: "Dashboard",

    footerDesc: "Ekinix — Digital Agriculture & Satellite Monitoring Platform for Farmers in Uzbekistan.",
    allRightsReserved: "All rights reserved."
  }
};
