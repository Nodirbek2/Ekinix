export interface CropStageCare {
  growth_stage: string;
  stage_name_uz: string;
  stage_name_ru: string;
  stage_name_en: string;
  days_min: number;
  days_max: number;
  irrigation_notes_uz: string;
  irrigation_notes_ru: string;
  irrigation_notes_en: string;
  pest_notes_uz?: string;
  pest_notes_ru?: string;
  pest_notes_en?: string;
  harvest_notes_uz?: string;
  harvest_notes_ru?: string;
  harvest_notes_en?: string;
}

export interface CropGuideItem {
  id: string;
  crop_name: string; // 'cotton' | 'wheat' | 'apple' | 'grape' | 'pomegranate' | 'tomato'
  crop_title_uz: string;
  crop_title_ru: string;
  crop_title_en: string;
  icon_emoji: string;
  category: 'paxta' | 'don' | 'meva' | 'sabzavot';
  summary_uz: string;
  summary_ru: string;
  summary_en: string;
  stages: CropStageCare[];
}

export const CROP_GUIDES_DATA: CropGuideItem[] = [
  // 1. COTTON / PAXTA
  {
    id: 'guide_cotton',
    crop_name: 'cotton',
    crop_title_uz: "G'o'za (Paxta)",
    crop_title_ru: "Хлопчатник (Хлопок)",
    crop_title_en: "Cotton",
    icon_emoji: "☁️",
    category: "paxta",
    summary_uz: "O'zbekistonning asosiy texnik ekini. Sug'orish rejimiga va g'o'za tunlamiga alohida e'tibor berish talab etiladi.",
    summary_ru: "Main industrial crop of Uzbekistan. Requires strict adherence to irrigation schedules and bollworm control.",
    summary_en: "Uzbekistan's key commercial crop. Requires optimal irrigation timing and cotton bollworm prevention.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Unib chiqish va maysalash (0-20 kun)",
        stage_name_ru: "Proroshchaniye i vshody (0-20 dney)",
        stage_name_en: "Germination & Emergence (0-20 days)",
        days_min: 0,
        days_max: 20,
        irrigation_notes_uz: "Tuproq harorati 14-16°C bo'lganda ekiladi. Maysalash davrida yengil sug'orish (250-300 m³/ha) yetarli.",
        irrigation_notes_ru: "Posev pri temperature pochvy 14-16°C. Lyoqkiy poliv (250-300 m³/ga) dlya ravnomernykh vshodov.",
        irrigation_notes_en: "Sow when soil reaches 14-16°C. Light watering (250-300 m³/ha) for uniform emergence.",
        pest_notes_uz: "Shira (aphid) va ildir chirish kasalliklariga qarshi urug'larni dorilash va nazorat qilish.",
        pest_notes_ru: "Obrabotka semyan protiv tli i kornevoy gnili na rannikh stadiyakh.",
        pest_notes_en: "Seed treatment and monitoring against aphids and root rot pathogens.",
        harvest_notes_uz: "Ushbu bosqichda hosil yig'imi o'tkazilmaydi. Yaxshi tup soni (100-110 ming tup/ha) shakllantiriladi.",
        harvest_notes_ru: "Formirovaniye optimal'noy plotnosti posadki (100-110 tys. kustov/ga).",
        harvest_notes_en: "Focus on establishing healthy stand density (100-110k plants/ha).",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Shoxlanish va g'unchalash (21-50 kun)",
        stage_name_ru: "Vetvleniye i butonizatsiya (21-50 dney)",
        stage_name_en: "Branching & Squaring (21-50 days)",
        days_min: 21,
        days_max: 50,
        irrigation_notes_uz: "Ildiz chuqurlashishi uchun 1-2 marta chuqur sug'orish (400-450 m³/ha). Qator oralari ishlanadi.",
        irrigation_notes_ru: "1-2 glubokikh poliva (400-450 m³/ga) dlya razvitiya kornevoy sistemy. Mezhduradnaya obrabotka.",
        irrigation_notes_en: "1-2 deep irigations (400-450 m³/ha) to stimulate deep rooting. Inter-row cultivation.",
        pest_notes_uz: "O'rgimchakkana (spider mite) va trips paydo bo'lishini barg orqasidan muntazam tekshiring.",
        pest_notes_ru: "Monomitoring pautinnogo kleshcha i tripsa na nizhney storone list'yev.",
        pest_notes_en: "Inspect leaf undersides regularly for spider mites and thrips.",
        harvest_notes_uz: "Shoxlanish davrida o'sishni boshqarish uchun shonalash nazorati va chilpish ishlariga tayyorgarlik ko'riladi.",
        harvest_notes_ru: "Podgotovka k chekanke i regulyatsiyerosta rasteniy.",
        harvest_notes_en: "Prepare for growth regulation and topping of vegetative branches.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Gullash va ko'sak tugish (51-90 kun)",
        stage_name_ru: "Tsveteniye i obrazovaniye korobochek (51-90 dney)",
        stage_name_en: "Flowering & Boll Formation (51-90 days)",
        days_min: 51,
        days_max: 90,
        irrigation_notes_uz: "ENG MUHIM BOSQICH! Har 8-10 kunda mo'l sug'orish (550-600 m³/ha). Suv yetishmovchiligi ko'sak to'kilishiga olib keladi.",
        irrigation_notes_ru: "SAMYY KRITICHESKIY PERIOD! Poliv kazhdiye 8-10 dney (550-600 m³/ga). Defitsit vody vyzyvayet opadaniye korobochek.",
        irrigation_notes_en: "MOST CRITICAL STAGE! Irrigate every 8-10 days (550-600 m³/ha). Water stress triggers boll shedding.",
        pest_notes_uz: "G'o'za tunlami (cotton bollworm) kapalaklari va qurtlariga qarshi feromon tutqichlar va trixogramma qo'llang.",
        pest_notes_ru: "Primeneniye trikhogrammy i feromonnykh lovushek protiv khlopkovoy sovki.",
        pest_notes_en: "Deploy pheromone traps and Trichogramma beneficial insects against cotton bollworm.",
        harvest_notes_uz: "Ko'saklar soni va vaznini oshirish uchun minerallashgan kompleks o'g'itlar bilan oziqlantiring.",
        harvest_notes_ru: "Fosforno-kaliynaya podkormka dlya uvelicheniya massy korobochek.",
        harvest_notes_en: "Apply potassium and phosphorus nutrients to boost boll mass and fiber quality.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Ko'sak ochilishi va Hosil Terimi (91+ kun)",
        stage_name_ru: "Raskrytiye korobochek i Sbor (91+ dney)",
        stage_name_en: "Boll Opening & Harvesting (91+ days)",
        days_min: 91,
        days_max: 200,
        irrigation_notes_uz: "Sug'orish butunlay to'xtatiladi. Ko'saklar 60-70% ochilganda defoliatsiya (barg to'kish) o'tkaziladi.",
        irrigation_notes_ru: "Poliv polnost'yu prekrashchayetsya. Defoliatsiya pri raskrytii 60-70% korobochek.",
        irrigation_notes_en: "Cease all irrigation. Apply defoliants when 60-70% of bolls are open.",
        pest_notes_uz: "Paxta tolasini chang va shira zarardan saqlash uchun terim oldi tozalik va nazorat.",
        pest_notes_ru: "Zashchita otkrytogo volokna ot zagryazneniya i vlasi.",
        pest_notes_en: "Protect open cotton fiber from dust, dew moisture, and late pest stains.",
        harvest_notes_uz: "Quruq va ochiq ob-havoda teriladi. Tola namligi 10-12% dan oshmasligi shart.",
        harvest_notes_ru: "Sbor v sukhuyu pogodu. Vlazhnost' volokna ne dolzhna prevyshat' 10-12%.",
        harvest_notes_en: "Harvest during dry, clear weather. Ensure fiber moisture remains under 10-12%.",
      }
    ]
  },

  // 2. WHEAT / BUG'DOY
  {
    id: 'guide_wheat',
    crop_name: 'wheat',
    crop_title_uz: "Kuzgi va Bahorgi Bug'doy",
    crop_title_ru: "Ozimaya i Yarovaya Pshenitsa",
    crop_title_en: "Wheat",
    icon_emoji: "🌾",
    category: "don",
    summary_uz: "O'zbekistonda g'alla mustaqilligini ta'minlovchi doimiy strategik don ekini.",
    summary_ru: "Strategic cereal crop ensuring food security across all regions of Uzbekistan.",
    summary_en: "Strategic grain staple ensuring national food self-sufficiency in Uzbekistan.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Unish va tuplash (0-30 kun)",
        stage_name_ru: "Kushcheniye i vshody (0-30 dney)",
        stage_name_en: "Emergence & Tillering (0-30 days)",
        days_min: 0,
        days_max: 30,
        irrigation_notes_uz: "Urug' suv berish (350 m³/ha) bilan tez va bir tekis unib chiqadi. Tuplash davrida azotli o'g'it sepiladi.",
        irrigation_notes_ru: "Vskhodovyy poliv (350 m³/ga). Podkormka azotom v fazu kushcheniya.",
        irrigation_notes_en: "Germination irrigation (350 m³/ha). Nitrogen top-dressing during tillering.",
        pest_notes_uz: "Sariq zang (yellow rust) va un-shudring profilaktikasi uchun tuproq va urug' nazorati.",
        pest_notes_ru: "Profilaktika zheltoy rzhavchiny i mukhnistoy rosy.",
        pest_notes_en: "Monitor and protect seeds/seedlings against yellow rust and powdery mildew.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Poya tortish va naychalash (31-100 kun)",
        stage_name_ru: "Vykhod v trubku (31-100 dney)",
        stage_name_en: "Stem Elongation & Jointing (31-100 days)",
        days_min: 31,
        days_max: 100,
        irrigation_notes_uz: "Bahorgi birinchi sug'orish (400 m³/ha). Poyaning baquvvat bo'lishi va yotib qolmasligi uchun me'yorga rioya qiling.",
        irrigation_notes_ru: "Pervyy vesennyy poliv (400 m³/ga). Kontrol' dozirovki dlya predotvrashcheniya poleganiya.",
        irrigation_notes_en: "First spring irrigation (400 m³/ha). Regulate density to avoid stem lodging.",
        pest_notes_uz: "Shira (aphids) va shilliq qurtlarga qarshi biopreparatlar sepish.",
        pest_notes_ru: "Obrabotka protiv zlakovoy tli i p'yavitsy.",
        pest_notes_en: "Foliar application against cereal aphids and leaf beetles.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Boshoqlash va gullash (101-140 kun)",
        stage_name_ru: "Kolosheniye i tsveteniye (101-140 dney)",
        stage_name_en: "Heading & Flowering (101-140 days)",
        days_min: 101,
        days_max: 140,
        irrigation_notes_uz: "Boshoqda don sonini ko'paytirish uchun muhim sug'orish (450 m³/ha).",
        irrigation_notes_ru: "Kriticheskiy poliv (450 m³/ga) dlya zakladki zeren v kolose.",
        irrigation_notes_en: "Critical watering (450 m³/ha) to maximize grains per spike.",
        pest_notes_uz: "Xirmon burasi (klob-cherepashka) va boshoq xasharotlariga qarshi nazorat.",
        pest_notes_ru: "Bor'ba s vrednoy cherepashkoy i kolosovoy sovkhoy.",
        pest_notes_en: "Active protection against sunn pest (Eurygaster) and wheat midges.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Don pishishi va Xirmon Yig'imi (141+ kun)",
        stage_name_ru: "Molochno-voskovaya zrelost' i Sbor (141+ dney)",
        stage_name_en: "Grain Filling & Harvest (141+ days)",
        days_min: 141,
        days_max: 240,
        irrigation_notes_uz: "Hosil terimiga 15 kun qolganda sug'orish batamom to'xtatiladi.",
        irrigation_notes_ru: "Prekrashcheniye poliva za 15 dney do uborki.",
        irrigation_notes_en: "Cease all watering 15 days prior to combine harvesting.",
        pest_notes_uz: "Don omborxonasini zararkunandalardan tozalash va dezinfeksiya qilish.",
        pest_notes_ru: "Dezinfeksiya zernokhranilishcha pered zakladkoy urozhaya.",
        pest_notes_en: "Sanitize and treat grain storage facilities before intake.",
      }
    ]
  },

  // 3. APPLE / OLMA
  {
    id: 'guide_apple',
    crop_name: 'apple',
    crop_title_uz: "Olma Bo'g'i Parvarishi",
    crop_title_ru: "Yablonovyy Sad",
    crop_title_en: "Apple Orchard",
    icon_emoji: "🍎",
    category: "meva",
    summary_uz: "O'zbekistondagi eng keng tarqalgan mevali bog'. Tomchilatib sug'orish va bahorgi ayozlardan himoya muhim.",
    summary_ru: "Most popular fruit orchard crop. Drip irrigation and spring frost protection are critical.",
    summary_en: "Widespread fruit orchard crop in Central Asia. Drip irrigation and spring frost defense essential.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Kurtak yozish va gullash (Mart-Aprel)",
        stage_name_ru: "Raspuskaniye pochek i tsveteniye (Mart-Aprel')",
        stage_name_en: "Bud Burst & Flowering (March-April)",
        days_min: 0,
        days_max: 30,
        irrigation_notes_uz: "Bahorgi tuproq namligi saqlanadi. Gullash vaqtida ortiqcha sug'orilmaydi (gullar to'kilishi mumkin).",
        irrigation_notes_ru: "Podderzhaniye vlazhnosti. Izbegat' izbytochnogo poliva vo vremya tsveteniya.",
        irrigation_notes_en: "Maintain moderate moisture. Avoid heavy irrigation during bloom to prevent petal drop.",
        pest_notes_uz: "Kalta xartumli olma biti va kalamush kabi kemiruvchilardan daraxt po'stlog'ini saqlash.",
        pest_notes_ru: "Zashchita kory ot gryzunov i obrabotka protiv yablonnoy tli.",
        pest_notes_en: "Bark protection from rodents and preventive copper spray for apple aphids.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Tuguncha kattalashishi va novda o'sishi (May-Iyun)",
        stage_name_ru: "Rost zavazi i pobegov (May-Iyun')",
        stage_name_en: "Fruit Set & Shoot Growth (May-June)",
        days_min: 31,
        days_max: 90,
        irrigation_notes_uz: "Har 10-12 kunda mo'l sug'orish (500 m³/ha) yoki har kuni tomchilatib berish.",
        irrigation_notes_ru: "Poliv kazhdiye 10-12 dney (500 m³/ga) ili yezhednevnyy kapel'nyy poliv.",
        irrigation_notes_en: "Deep watering every 10-12 days (500 m³/ha) or daily automated drip cycles.",
        pest_notes_uz: "Olma mevaxo'ri (codling moth) va un-shudring (powdery mildew) nazorati.",
        pest_notes_ru: "Obrabotka protiv yablonnoy plodozhorki i mukhnistoy rosy.",
        pest_notes_en: "Deploy pheromone disruptors against codling moth and sulfur against powdery mildew.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Meva pishishi va rang kirishi (Iyul-Avgust)",
        stage_name_ru: "Sozrevaniye i okrashivaniye plodov (Iyul'-Avgust)",
        stage_name_en: "Fruit Maturation & Coloration (July-August)",
        days_min: 91,
        days_max: 150,
        irrigation_notes_uz: "Bir maromda sug'oriladi. Kutilmagan qurg'oqchilikdan so'ng ko'p suv berilsa mevalar yorilib ketadi.",
        irrigation_notes_ru: "Ravnomernyy poliv. Izbegat' rezskikh perepadov vlazhnosti dlya predotvrashcheniya rastreskivaniya.",
        irrigation_notes_en: "Maintain continuous moisture. Uneven moisture spikes cause fruit splitting.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Meva Terimi va Omborga joylash (Sentyabr-Oktyabr)",
        stage_name_ru: "Sbor i Zakladka na khraneniye (Sentyabr'-Oktyabr')",
        stage_name_en: "Apple Harvest & Cold Storage (September-October)",
        days_min: 151,
        days_max: 240,
        irrigation_notes_uz: "Terimdan 10 kun oldin sug'orish to'xtatiladi. Terimdan so'ng darakxlarga yaxob suvi beriladi.",
        irrigation_notes_ru: "Prekrashcheniye poliva za 10 dney do sbora. Posle sbora — vlagozaryadkovyy poliv.",
        irrigation_notes_en: "Stop watering 10 days before harvest. Apply post-harvest soil recharge irrigation.",
      }
    ]
  },

  // 4. GRAPE / UZUM
  {
    id: 'guide_grape',
    crop_name: 'grape',
    crop_title_uz: "Uzumchilik va Tokzor Parvarishi",
    crop_title_ru: "Vinogradnik i Agrotekhnika",
    crop_title_en: "Vineyard & Grape Culture",
    icon_emoji: "🍇",
    category: "meva",
    summary_uz: "Uzbekistonning mashhur uzumzorlari. Oidium, xomtok va sug'orishni to'g'ri taqsimlash qand miqdorini oshiradi.",
    summary_ru: "High-value vineyard culture. Oidium control, shoot topping, and water restriction boost sugar degrees.",
    summary_en: "Renowned viticulture. Managing oidium, canopy management, and water deficit improves sugar content.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Tok ochish va shoxlanish (Aprel)",
        stage_name_ru: "Otkrytiye lozy i kushcheniye (Aprel')",
        stage_name_en: "Unwrapping & Spring Bud Burst (April)",
        days_min: 0,
        days_max: 30,
        irrigation_notes_uz: "Qishki ko'milgan toklar ochiladi va ishlov beriladi. Bag'az suvi (300 m³/ha) beriladi.",
        irrigation_notes_ru: "Otkrytiye lozy posle zimy i vesennyy vlagozaryadkovyy poliv (300 m³/ga).",
        irrigation_notes_en: "Unwrap overwintered vines and apply spring soil recharge (300 m³/ha).",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Xomtok va gullash (May-Iyun)",
        stage_name_ru: "Zelenaya obrezka i tsveteniye (May-Iyun')",
        stage_name_en: "Canopy Pruning & Bloom (May-June)",
        days_min: 31,
        days_max: 75,
        irrigation_notes_uz: "Ortiqcha novdalar xomtok qilinadi. Gullashdan oldin 1 marta sug'oriladi (350 m³/ha).",
        irrigation_notes_ru: "Zelenaya oblomka pobegov. Poliv pered tsveteniyem (350 m³/ga).",
        irrigation_notes_en: "Prune weak green shoots. Water once before blooming (350 m³/ha).",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Shingil kattalashishi va g'ora (Iyul)",
        stage_name_ru: "Rost grozdey i yagod (Iyul')",
        stage_name_en: "Berry Growth & Bunch Sizing (July)",
        days_min: 76,
        days_max: 120,
        irrigation_notes_uz: "Uzum do'ppilaganda va kattalashganda har 12 kunda sug'oriladi (400 m³/ha).",
        irrigation_notes_ru: "Poliv kazhdiye 12 dney (400 m³/ga) v period rosta yagod.",
        irrigation_notes_en: "Irrigate every 12 days (400 m³/ha) during berry expansion.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Uzilishi va Hosil Uzish (Avgust-Oktyabr)",
        stage_name_ru: "Sozrevaniye i Sbor grozdey (Avgust-Oktyabr')",
        stage_name_en: "Ripening & Grape Harvest (August-October)",
        days_min: 121,
        days_max: 220,
        irrigation_notes_uz: "Qand darajasi (Brix) 18-22% ga yetishi uchun sug'orish to'xtatiladi.",
        irrigation_notes_ru: "Poliv prekrashchayetsya dlya nakopleniya sakhara v yagodakh (18-22% Brix).",
        irrigation_notes_en: "Withhold watering to allow sugar accumulation (target 18-22% Brix).",
      }
    ]
  },

  // 5. POMEGRANATE / ANOR
  {
    id: 'guide_pomegranate',
    crop_name: 'pomegranate',
    crop_title_uz: "Anor O'stirish va Parvarish",
    crop_title_ru: "Granatovyy Sad",
    crop_title_en: "Pomegranate Orchard",
    icon_emoji: "🌺",
    category: "meva",
    summary_uz: "Farg'ona va Surxondaryo anorzorlari. Po'sti yorilib ketmasligi uchun sug'orish rejimining bir xilligi muhim.",
    summary_ru: "Famous Fergana & Surkhandarya pomegranates. Strict watering uniformity avoids fruit splitting.",
    summary_en: "Uzbekistan's prized pomegranates. Consistent moisture management prevents rind cracking.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Bahorgi uyg'onish va barg yozish (Aprel)",
        stage_name_ru: "Vesenneye probuzhdeniye (Aprel')",
        stage_name_en: "Spring Awakening & Leafing (April)",
        days_min: 0,
        days_max: 30,
        irrigation_notes_uz: "Tup tagi yumshatilib organik o'g'it va yengil sug'orish beriladi (300 m³/ha).",
        irrigation_notes_ru: "Rykleniye pochvy, organicheskiye udobreniya i lyoqkiy poliv (300 m³/ga).",
        irrigation_notes_en: "Loosen basin soil, apply compost, and provide light start-up irrigation (300 m³/ha).",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Gullash va tuguncha bog'lash (May-Iyun)",
        stage_name_ru: "Tsveteniye i zakladka plodov (May-Iyun')",
        stage_name_en: "Bloom & Fruit Set (May-June)",
        days_min: 31,
        days_max: 80,
        irrigation_notes_uz: "Har 10-12 kunda sug'oriladi. Anor biti va mevaxo'riga qarshi biologik ishlov beriladi.",
        irrigation_notes_ru: "Poliv kazhdiye 10-12 dney. Biologicheskaya obrabotka protiv tli.",
        irrigation_notes_en: "Water every 10-12 days. Apply bio-pesticides against aphids and moths.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Anor kattalashishi (Iyul-Avgust)",
        stage_name_ru: "Rost i naliv plodov (Iyul'-Avgust)",
        stage_name_en: "Fruit Expansion (July-August)",
        days_min: 81,
        days_max: 140,
        irrigation_notes_uz: "ENG NOZIK BOSQICH! Suv bir maromda berilishi shart. Qurg'oqchilik va birdan ko'p suv yorilishga olib keladi.",
        irrigation_notes_ru: "SAMYY CHUVSTVITEL'NYY PERIOD! Poliv strogie po grafiku. Perepad vlazhnosti vyzyvayet rastreskivaniye.",
        irrigation_notes_en: "CRITICAL REGIME! Maintain smooth watering. Moisture fluctuations cause rind cracking.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Anor Terimi va Qishki saqlash (Sentyabr-Oktyabr)",
        stage_name_ru: "Sbor granatov i Khraneniye (Sentyabr'-Oktyabr')",
        stage_name_en: "Harvest & Winter Cellar Storage (September-October)",
        days_min: 141,
        days_max: 220,
        irrigation_notes_uz: "Anor po'sti to'q qizil bo'lganda qaychi bilan kesiladi. Salqin yerto'lada 5 oygacha saqlash mumkin.",
        irrigation_notes_ru: "Sbor sekatorom pri temno-krasnom tsvete kozhitsy. Khraneniye v pogrebe do 5 mesyatsev.",
        irrigation_notes_en: "Clip with shears when skin turns deep crimson. Stores in cool cellars for up to 5 months.",
      }
    ]
  },

  // 6. TOMATO / POMIDOR
  {
    id: 'guide_tomato',
    crop_name: 'tomato',
    crop_title_uz: "Pomidor (Ochiq maydon va Issiqxona)",
    crop_title_ru: "Tomaty (Otkrytyy grunt i Teplitsy)",
    crop_title_en: "Tomatoes (Open Field & Greenhouse)",
    icon_emoji: "🍅",
    category: "sabzavot",
    summary_uz: "Serhosil sabzavot ekini. Fitoftora, tomchilatib sug'orish va kaliy o'g'itlari hosildorlik kalitidir.",
    summary_ru: "High-yield vegetable crop. Late blight protection, drip irrigation, and potassium feeding maximize yield.",
    summary_en: "Popular vegetable staple. Drip irrigation, blight control, and potassium boosts produce high yields.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Ko'chat o'tqazish va ildiz otish (0-20 kun)",
        stage_name_ru: "Vysadka rassady i ukoreneniye (0-20 dney)",
        stage_name_en: "Transplanting & Rooting (0-20 days)",
        days_min: 0,
        days_max: 20,
        irrigation_notes_uz: "Ko'chat o'tqazilgach darhol sug'oriladi. Tomchilatib sug'orishda tuproq namligi 75-80% ushlanadi.",
        irrigation_notes_ru: "O обильный poliv pri posadke. Podderzhaniye vlazhnosti 75-80% pri kapel'nom polive.",
        irrigation_notes_en: "Immediate watering post-transplant. Keep drip soil moisture near 75-80%.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Poya boylash va chilpish (21-45 kun)",
        stage_name_ru: "Podvyazka i pasynkovaniye (21-45 dney)",
        stage_name_en: "Staking & Suckering (21-45 days)",
        days_min: 21,
        days_max: 45,
        irrigation_notes_uz: "Har 4-5 kunda sug'oriladi. Yon shoxlar (pasyunok) chilpib tashlanadi.",
        irrigation_notes_ru: "Poliv kazhdiye 4-5 dney. Udalleniye pasynkov dlya formirovaniya kusta.",
        irrigation_notes_en: "Water every 4-5 days. Prune side suckers to concentrate growth into main stems.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Gullash va tuguncha bog'lash (46-70 kun)",
        stage_name_ru: "Tsveteniye i zavazivaniye (46-70 dney)",
        stage_name_en: "Flowering & Fruit Setting (46-70 days)",
        days_min: 46,
        days_max: 70,
        irrigation_notes_uz: "Kaliy va mikroelementlar bilan oziqlantiriladi. Fitoftorozga qarshi profilaktik purkash.",
        irrigation_notes_ru: "Kaliynaya podkormka. Profilakticheskaya obrabotka protiv fitoftoroza.",
        irrigation_notes_en: "Feed with potassium soluble fertilizer. Spray bio-fungicide against late blight.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Meva qizarishi va Terim (71+ kun)",
        stage_name_ru: "Sozrevaniye i Sbor (71+ dney)",
        stage_name_en: "Ripening & Continuous Harvest (71+ days)",
        days_min: 71,
        days_max: 180,
        irrigation_notes_uz: "Pishgan qizil pomidorlar har 2-3 kunda terib olinadi. Sug'orish yengil va muntazam bo'ladi.",
        irrigation_notes_ru: "Sbor krasnykh plodov kazhdiye 2-3 dnya. Umrennyy regulyarnyy poliv.",
        irrigation_notes_en: "Pick ripe red tomatoes every 2-3 days. Maintain regular moderate drip water.",
      }
    ]
  }
];

/**
 * Calculates current estimated growth stage for a crop given planting date or days elapsed
 */
export function calculateGrowthStage(cropType: string, plantingDateStr?: string) {
  const normCrop = (cropType || 'cotton').toLowerCase().trim();
  
  // Find matching guide item
  const guide = CROP_GUIDES_DATA.find(
    g => g.crop_name === normCrop || normCrop.includes(g.crop_name)
  ) || CROP_GUIDES_DATA[0];

  // Calculate days elapsed since planting date
  let daysElapsed = 45; // Default middle-stage estimate if not specified
  if (plantingDateStr) {
    try {
      const pDate = new Date(plantingDateStr);
      const now = new Date();
      const diffMs = now.getTime() - pDate.getTime();
      const calcDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (!isNaN(calcDays) && calcDays >= 0) {
        daysElapsed = calcDays;
      }
    } catch {
      // ignore
    }
  }

  // Find matching stage
  let matchedStage = guide.stages[0];
  for (const st of guide.stages) {
    if (daysElapsed >= st.days_min && daysElapsed <= st.days_max) {
      matchedStage = st;
      break;
    }
    if (daysElapsed > st.days_max) {
      matchedStage = st; // fallback to latest stage if past max
    }
  }

  const currentStageIndex = guide.stages.findIndex(s => s.growth_stage === matchedStage.growth_stage);

  return {
    guide,
    currentStage: matchedStage,
    daysElapsed,
    stageIndex: currentStageIndex >= 0 ? currentStageIndex : 0,
    totalStages: guide.stages.length,
  };
}
