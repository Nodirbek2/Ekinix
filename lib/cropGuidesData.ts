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
  fertilization_notes_uz?: string;
  fertilization_notes_ru?: string;
  fertilization_notes_en?: string;
  pest_notes_uz?: string;
  pest_notes_ru?: string;
  pest_notes_en?: string;
  harvest_notes_uz?: string;
  harvest_notes_ru?: string;
  harvest_notes_en?: string;
}

export interface CropGuideItem {
  id: string;
  crop_name: string; // 'cotton' | 'wheat' | 'apple' | 'grape' | 'pomegranate' | 'tomato' | 'corn' | 'potato'
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
    summary_uz: "O'zbekistonning asosiy texnik ekini. Sug'orish rejimiga, o'z vaqtida chilpishga va g'o'za tunlamiga alohida e'tibor berish talab etiladi.",
    summary_ru: "Главная техническая культура Узбекистана. Требует строгого соблюдения поливного режима, чеканки и контроля хлопковой совки.",
    summary_en: "Uzbekistan's key commercial crop. Requires precise irrigation timing, topping, and integrated bollworm management.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Unib chiqish va maysalash (0-20 kun)",
        stage_name_ru: "Прорастание и всходы (0-20 дней)",
        stage_name_en: "Germination & Emergence (0-20 days)",
        days_min: 0,
        days_max: 20,
        irrigation_notes_uz: "Tuproq harorati 14-16°C bo'lganda ekiladi. Maysalash davrida yengil sug'orish (250-300 m³/ha) bir tekis unib chiqish uchun yetarli.",
        irrigation_notes_ru: "Посев при температуре почвы 14-16°C. Легкий полив (250-300 м³/га) для равномерных всходов.",
        irrigation_notes_en: "Sow when soil reaches 14-16°C. Light watering (250-300 m³/ha) ensures uniform germination.",
        fertilization_notes_uz: "Ekish oldidan fosfor (P₂O₅ 70-80 kg/ga) va kaliy (K₂O 50 kg/ga) beriladi. Maysalashda ildiz tizimini baquvvat qilish uchun fosforli start o'g'it zarur.",
        fertilization_notes_ru: "Основное внесение фосфора (70-80 кг/га) и калия (50 кг/га) под вспашку. Стимуляция корневой системы фосфорным питанием.",
        fertilization_notes_en: "Pre-sowing basal phosphorus (70-80 kg/ha) and potassium (50 kg/ha). Early starter phosphorus supports vigorous rooting.",
        pest_notes_uz: "Shira (aphid), tamaki tripsi va ildiz chirish kasalliklariga qarshi urug'larni fungitsid va insektitsid bilan dorilash va nazorat qilish.",
        pest_notes_ru: "Протравливание семян и защита от тли, табачного трипса и корневых гнилей на ранней фазе.",
        pest_notes_en: "Seed treatment and early scouting against aphids, tobacco thrips, and root rot pathogens.",
        harvest_notes_uz: "Ushbu bosqichda hosil yig'imi o'tkazilmaydi. Maqsad: 1 gektarda 100-110 ming sog'lom tup zichligini shakllantirish.",
        harvest_notes_ru: "Формирование оптимальной плотности посадки (100-110 тыс. растений/га). Сбор урожая не проводится.",
        harvest_notes_en: "Focus on establishing uniform healthy stand density (100-110k plants/ha). No harvesting at this stage.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Shoxlanish va g'unchalash (21-50 kun)",
        stage_name_ru: "Ветвление и бутонизация (21-50 дней)",
        stage_name_en: "Branching & Squaring (21-50 days)",
        days_min: 21,
        days_max: 50,
        irrigation_notes_uz: "Ildiz chuqur ketishi uchun 1-2 marta chuqur sug'orish (400-450 m³/ha). Sug'orishdan so'ng qator oralari kultivatsiya qilinadi.",
        irrigation_notes_ru: "1-2 глубоких полива (400-450 м³/га) для стимуляции глубокого укоренения. Междурядная культивация после полива.",
        irrigation_notes_en: "1-2 deep irrigations (400-450 m³/ha) to stimulate deep root tap. Inter-row cultivation after watering.",
        fertilization_notes_uz: "Birinchi oziqlantirish: 3-4 chinbargda gektariga sof holda 40-50 kg azot (ammiakli selitra yoki mochevina) solinadi. Bargdan sink (Zn) purkash tavsiya etiladi.",
        fertilization_notes_ru: "Первая подкормка: азот 40-50 кг/га д.в. при 3-4 настоящих листьях. Листовая подкормка цинком (Zn) для закладки бутонов.",
        fertilization_notes_en: "First top-dressing: 40-50 kg/ha nitrogen (ammonium nitrate/urea) at 3-4 leaves. Foliar zinc (Zn) spray to boost squaring.",
        pest_notes_uz: "O'rgimchakkana (spider mite) va trips paydo bo'lishini barg orqasidan muntazam tekshiring. 10-15% bargda kana ko'rinsa akaritsid qo'llang.",
        pest_notes_ru: "Мониторинг паутинного клеща и трипса на нижней стороне листьев. При 10-15% заселении — акарицидная обработка.",
        pest_notes_en: "Inspect leaf undersides regularly for spider mites and thrips. Treat with acaricides if threshold exceeds 10-15%.",
        harvest_notes_uz: "Shoxlanish davrida o'sishni boshqarish uchun shonalash nazorati olib boriladi va iyul boshida chilpish (uchini uzish) rejalashtiriladi.",
        harvest_notes_ru: "Контроль роста и подготовка к чеканке (прищипыванию верхушек) для перенаправления питания в коробочки.",
        harvest_notes_en: "Vegetative growth monitoring and preparation for terminal bud topping to channel nutrients into bolls.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Gullash va ko'sak tugish (51-90 kun)",
        stage_name_ru: "Цветение и коробочкообразование (51-90 дней)",
        stage_name_en: "Flowering & Boll Formation (51-90 days)",
        days_min: 51,
        days_max: 90,
        irrigation_notes_uz: "ENG MUHIM BOSQICH! Har 8-10 kunda mo'l sug'orish (550-600 m³/ha). Suv yetishmovchiligi gullar va yosh ko'saklarning to'kilib ketishiga sabab bo'ladi.",
        irrigation_notes_ru: "САМЫЙ КРИТИЧЕСКИЙ ПЕРИОД! Полив каждые 8-10 дней (550-600 м³/га). Водный стресс вызывает сброс цветков и завязей.",
        irrigation_notes_en: "MOST CRITICAL STAGE! Irrigate every 8-10 days (550-600 m³/ha). Water deficit triggers severe flower and boll shedding.",
        fertilization_notes_uz: "Ikkinchi oziqlantirish: gullash boshida azot (60-70 kg/ga) va kaliy sulfat (40 kg/ga). Bargdan bor (B) va magniy (Mg) purkash ko'sak vaznini 15% ga oshiradi.",
        fertilization_notes_ru: "Вторая подкормка: азот (60-70 кг/га) + калий (40 кг/га). Листовое внесение бора (B) и магния (Mg) увеличивает вес коробочек на 15%.",
        fertilization_notes_en: "Second feeding: nitrogen (60-70 kg/ha) + potassium sulfate (40 kg/ha). Foliar boron (B) & magnesium (Mg) increases boll mass by 15%.",
        pest_notes_uz: "G'o'za tunlami (cotton bollworm) kapalaklariga qarshi feromon tutqichlar qo'ying. Tuxum qo'yish boshlanganda gektariga 1-2 gramm trixogramma va brakon tarqating.",
        pest_notes_ru: "Применение трихограммы и бракона против хлопковой совки, установка феромонных ловушек для мониторинга лета бабочек.",
        pest_notes_en: "Deploy pheromone traps against bollworm moths. Release Trichogramma & Bracon wasps at early egg-laying stage.",
        harvest_notes_uz: "Poya bo'yi 90-110 sm ga yetganda o'suv nuqtasi chilpib tashlanadi (topping). Bu kechki ko'saklarning tez yetilishini ta'minlaydi.",
        harvest_notes_ru: "Чеканка верхушек главного стебля при высоте 90-110 см. Ускоряет созревание верхних коробочек.",
        harvest_notes_en: "Top terminal shoot when plant height reaches 90-110 cm to accelerate boll maturation.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Ko'sak ochilishi va Hosil Terimi (91+ kun)",
        stage_name_ru: "Раскрытие коробочек и сбор (91+ дней)",
        stage_name_en: "Boll Opening & Harvesting (91+ days)",
        days_min: 91,
        days_max: 200,
        irrigation_notes_uz: "Sug'orish butunlay to'xtatiladi. Ko'saklar 60-70% ochilganda defoliatsiya (barg to'kish) o'tkaziladi va paxta tez quriydi.",
        irrigation_notes_ru: "Полив полностью прекращается. Дефолиация при раскрытии 60-70% коробочек для ускорения высыхания волокна.",
        irrigation_notes_en: "Cease all irrigation. Apply defoliants when 60-70% of bolls are open to accelerate fiber drying.",
        fertilization_notes_uz: "O'g'itlash o'tkazilmaydi. Tuproq qoldiqlarini tahlil qilib keyingi mavsum uchun shudgorlash rejasini tuzing.",
        fertilization_notes_ru: "Внесение удобрений прекращается. Проведение почвенного анализа для осенней вспашки под следующий сезон.",
        fertilization_notes_en: "Fertilizer applications completed. Run post-harvest soil tests to plan autumn deep plowing.",
        pest_notes_uz: "Paxta tolasini chang, shira va yomg'ir dog'laridan saqlash uchun terim oldidan daladagi begona o'tlar to'liq o'rib olinadi.",
        pest_notes_ru: "Защита открытого волокна от пыли и загрязнений. Предварительное скашивание сорняков по краям поля.",
        pest_notes_en: "Protect open fiber from dust, dew, and weed stains. Clear border weed strips prior to picking.",
        harvest_notes_uz: "Quruq va ochiq quyoshli havoda teriladi. Tola namligi 10-12% dan oshmasligi shart. Birinchi terimda eng yuqori navli tola olinadi.",
        harvest_notes_ru: "Сбор в сухую солнечную погоду. Влажность волокна не более 10-12%. Первый сбор дает высший сорт хлопка.",
        harvest_notes_en: "Harvest during dry, sunny weather. Keep fiber moisture below 10-12%. First pick produces top-grade lint.",
      }
    ]
  },

  // 2. WHEAT / BUG'DOY
  {
    id: 'guide_wheat',
    crop_name: 'wheat',
    crop_title_uz: "Kuzgi va Bahorgi Bug'doy",
    crop_title_ru: "Озимая и яровая пшеница",
    crop_title_en: "Wheat",
    icon_emoji: "🌾",
    category: "don",
    summary_uz: "O'zbekistonda g'alla mustaqilligini ta'minlovchi doimiy strategik don ekini. Erta bahorgi azotli oziqlantirish va boshoqlash sug'orishi muhim.",
    summary_ru: "Стратегическая зерновая культура Узбекистана. Ранневесенняя азотная подкормка и полив в фазу колошения определяют урожайность.",
    summary_en: "Strategic grain staple. Early spring nitrogen top-dressing and flowering irrigation are decisive for high yields.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Unish va tuplash (0-30 kun)",
        stage_name_ru: "Всходы и кущение (0-30 дней)",
        stage_name_en: "Emergence & Tillering (0-30 days)",
        days_min: 0,
        days_max: 30,
        irrigation_notes_uz: "Urug' suvi (350 m³/ha) berish bilan tez va bir tekis unib chiqadi. Tuplash davrida mo''tadil namlik (65-70%) saqlanadi.",
        irrigation_notes_ru: "Всходовый полив (350 м³/га). В фазу кущения поддержание умеренной влажности почвы (65-70% НВ).",
        irrigation_notes_en: "Germination irrigation (350 m³/ha). Maintain moderate soil moisture (65-70% field capacity) during tillering.",
        fertilization_notes_uz: "Ekishda fosfor (P₂O₅ 60-70 kg/ga) va kaliy (40 kg/ga). Kuzda ildiz tizimini mustahkamlash uchun ortiqcha azot berilmaydi.",
        fertilization_notes_ru: "Основное внесение фосфора (60-70 кг/га) и калия (40 кг/га) под сев. Избегать избытка азота осенью.",
        fertilization_notes_en: "Pre-plant phosphorus (60-70 kg/ha) and potassium (40 kg/ha). Limit autumn nitrogen to avoid frost vulnerability.",
        pest_notes_uz: "Sariq zang (yellow rust), qora kuya va ildiz chirish profilaktikasi uchun urug'larni sertifikatlangan dorilar bilan ishlov berish.",
        pest_notes_ru: "Протравливание семян против желтой ржавчины, твердой головни и корневых гнилей.",
        pest_notes_en: "Certified fungicide seed dressing against yellow rust, smut, and fusarium root rot.",
        harvest_notes_uz: "Maysalarning qishlashga tayyorgarligi va tup qalinligi (450-500 unib chiqqan dona/m²) tekshiriladi.",
        harvest_notes_ru: "Контроль плотности всходов перед зимовкой (450-500 растений/м²).",
        harvest_notes_en: "Evaluate plant count density (450-500 seedlings/m²) and winter hardiness.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Poya tortish va naychalash (31-100 kun)",
        stage_name_ru: "Выход в трубку и стеблевание (31-100 дней)",
        stage_name_en: "Stem Elongation & Jointing (31-100 days)",
        days_min: 31,
        days_max: 100,
        irrigation_notes_uz: "Bahorgi birinchi va ikkinchi sug'orish (400-450 m³/ha). Poyaning baquvvat bo'lishi va yotib qolmasligi uchun me'yorga qat'iy rioya qiling.",
        irrigation_notes_ru: "Ранневесенний полив (400-450 м³/га). Строгая дозировка для предотвращения полегания посевов.",
        irrigation_notes_en: "Early spring irrigation (400-450 m³/ha). Regulate moisture strictly to prevent early crop lodging.",
        fertilization_notes_uz: "ENG MUHIM OZIQLANTIRISH! Erta bahorda azot (ammiakli selitra 150-200 kg/ga) 2 muddatda bo'lib beriladi. Bargdan temir va rux qo'shiladi.",
        fertilization_notes_ru: "КЛЮЧЕВАЯ ПОДКОРМКА! Азотная подкормка ранней весной (150-200 кг/га аммиачной селитры) дробно в 2 приема.",
        fertilization_notes_en: "CRITICAL NUTRITION! Top-dress nitrogen (150-200 kg/ha ammonium nitrate) split in 2 early spring doses.",
        pest_notes_uz: "Shira (aphids), shilliq qurt (p'yavitsa) va begona o'tlarga qarshi gertbitsid + insektitsid kompleks ishlovi.",
        pest_notes_ru: "Гербицидная обработка против сорняков + инсектицид против злаковой тли и пьявицы.",
        pest_notes_en: "Combined herbicide application with targeted insect sprays against cereal aphids and leaf beetles.",
        harvest_notes_uz: "Poyaning yotib qolish xavfi bo'lsa, o'sishni to'xtatuvchi regulyatorlar (retardantlar) sepiladi.",
        harvest_notes_ru: "Применение регуляторов роста (ретардантов) при риске полегания густых посевов.",
        harvest_notes_en: "Apply plant growth regulators (retardants) if dense stands show lodging risk.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Boshoqlash va gullash (101-140 kun)",
        stage_name_ru: "Колошение и цветение (101-140 дней)",
        stage_name_en: "Heading & Flowering (101-140 days)",
        days_min: 101,
        days_max: 140,
        irrigation_notes_uz: "Boshoqda don sonini va vaznini ko'paytirish uchun eng javobgar sug'orish (450-500 m³/ha).",
        irrigation_notes_ru: "Критический полив (450-500 м³/га) для налива зерен и предотвращения череззерницы.",
        irrigation_notes_en: "Crucial grain-filling irrigation (450-500 m³/ha) to maximize grains per spike and test weight.",
        fertilization_notes_uz: "Boshoqlashda karbamid (mochevina 10-15 kg/ga) eritmasi bilan bargdan purkash dondagi oqsil va kleykovinani 2-3% ga oshiradi.",
        fertilization_notes_ru: "Внекорневая подкормка раствором карбамида (10-15 кг/га) для повышения клейковины и белка в зерне на 2-3%.",
        fertilization_notes_en: "Foliar urea spray (10-15 kg/ha) during heading increases grain protein and gluten content by 2-3%.",
        pest_notes_uz: "Xirmon burasi (vrednaya cherepashka), boshoq shirasiga qarshi qat'iy nazorat va purkash.",
        pest_notes_ru: "Защита посевов от вредной черепашки и трипса в период налива зерна.",
        pest_notes_en: "Scout and spray against Sunn pest (Eurygaster integriceps) and wheat midges during milk stage.",
        harvest_notes_uz: "Don to'lishi va sut-mum pishish fazasi kuzatiladi. O'rim kombaynlarini sozlash boshlanadi.",
        harvest_notes_ru: "Мониторинг фазы восковой спелости. Подготовка уборочной техники и комбайнов.",
        harvest_notes_en: "Monitor dough-wax ripening transition and calibrate combine harvesters.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Don to'liq pishishi va O'rim-yig'im (141+ kun)",
        stage_name_ru: "Полная спелость и уборочная страда (141+ дней)",
        stage_name_en: "Full Maturity & Combine Harvest (141+ days)",
        days_min: 141,
        days_max: 240,
        irrigation_notes_uz: "Hosil o'rimiga 15-20 kun qolganda barcha sug'orishlar to'xtatiladi. Tuproq texnika kirishi uchun qotadi.",
        irrigation_notes_ru: "Полное прекращение полива за 15-20 дней до уборки для подсыхания почвы под технику.",
        irrigation_notes_en: "Stop all watering 15-20 days before harvest to allow soil drying for combine traffic.",
        fertilization_notes_uz: "O'g'it berilmaydi. G'alla o'rilgach somon ezilib shudgorga aralashtiriladi yoki takroriy ekin uchun o'g'it rejalashtiriladi.",
        fertilization_notes_ru: "Внесение удобрений завершено. Заделка пожнивных остатков и подготовка под повторные культуры.",
        fertilization_notes_en: "Applications completed. Stubble incorporation and fertilizing for secondary double crops.",
        pest_notes_uz: "Don omborlarini, elevator va xirmonlarni ombor zararkunandalariga qarshi dezinfeksiya qilish (fumihatsiya).",
        pest_notes_ru: "Фумигация и дезинсекция зернохранилищ и токов перед приемкой нового урожая.",
        pest_notes_en: "Sanitize and fumigate grain storage bins and conveyors before intake.",
        harvest_notes_uz: "Don namligi 13-14% ga yetganda kombayn bilan to'g'ridan-to'g'ri o'rib olinadi. Don to'kilmasligi uchun erta tong va kechqurun tez teriladi.",
        harvest_notes_ru: "Прямое комбайнирование при влажности зерна 13-14%. Своевременная уборка без потерь на осыпание.",
        harvest_notes_en: "Direct combine harvesting when grain moisture reaches 13-14%. Prompt harvest avoids shatter losses.",
      }
    ]
  },

  // 3. APPLE / OLMA
  {
    id: 'guide_apple',
    crop_name: 'apple',
    crop_title_uz: "Olma Bog'i Parvarishi",
    crop_title_ru: "Яблоневый сад",
    crop_title_en: "Apple Orchard",
    icon_emoji: "🍎",
    category: "meva",
    summary_uz: "O'zbekistondagi eng keng tarqalgan mevali bog'. Tomchilatib sug'orish, meva me'yorlash va olma qurtidan himoya sifatli eksport garovidir.",
    summary_ru: "Самый распространенный фруктовый сад. Капельное орошение, нормирование завязи и защита от плодожорки — залог экспортного качества.",
    summary_en: "Key fruit orchard crop. Drip irrigation, fruit thinning, and codling moth control guarantee premium export fruit.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Kurtak yozish va gullash (Mart-Aprel)",
        stage_name_ru: "Распускание почек и цветение (Март-Апрель)",
        stage_name_en: "Bud Burst & Flowering (March-April)",
        days_min: 0,
        days_max: 30,
        irrigation_notes_uz: "Bahorgi namlik saqlanadi. Gullash vaqtida ortiqcha sug'orilmaydi (gullar to'kilib ketmasligi uchun).",
        irrigation_notes_ru: "Поддержание умеренной влажности. Избегать избыточного полива в период цветения (риск сброса цветков).",
        irrigation_notes_en: "Maintain moderate moisture. Avoid heavy irrigation during full bloom to prevent petal drop.",
        fertilization_notes_uz: "Kurtak ochilishida azotli o'g'it (selitra 150-200 kg/ga) va chirindi solinadi. Gullashdan oldin bor (B) sepish changlanishni yaxshilaydi.",
        fertilization_notes_ru: "Весеннее внесение азота и органики. Листовая подкормка бором (B) перед цветением для улучшения завязываемости.",
        fertilization_notes_en: "Early spring nitrogen and compost. Foliar boron (B) spray before bloom enhances pollination and fruit set.",
        pest_notes_uz: "Kurtak bo'rtganda 3% li Bordo suyuqligi yoki mis kuporosi bilan purkash. Olma biti va po'stloq zararkunandalariga qarshi ko'rik.",
        pest_notes_ru: "Ранневесеннее опрыскивание 3% бордоской жидкостью по зеленому конусу против парши и монилиоза.",
        pest_notes_en: "Early dormant spray with 3% Bordeaux mixture or copper sulfate against scab and monilia rots.",
        harvest_notes_uz: "Quruq va kasallangan shoxlar kesiladi (butash). Gullar haddan tashqari ko'p bo'lsa me'yorlash o'tkaziladi.",
        harvest_notes_ru: "Санитарная обрезка сухих и больных ветвей. Подготовка сада к сезону вегетации.",
        harvest_notes_en: "Sanitary pruning of dry and diseased branches. Tree structure balanced.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Tuguncha kattalashishi va novda o'sishi (May-Iyun)",
        stage_name_ru: "Рост завязей и побегов (Май-Июнь)",
        stage_name_en: "Fruit Set & Shoot Growth (May-June)",
        days_min: 31,
        days_max: 90,
        irrigation_notes_uz: "Har 10-12 kunda mo'l sug'orish (500 m³/ha) yoki har kuni tomchilatib berish. Tuproq doimiy 70-75% nam ushlanadi.",
        irrigation_notes_ru: "Полив каждые 10-12 дней (500 м³/га) или регулярный капельный полив (поддержание влажности 70-75%).",
        irrigation_notes_en: "Deep watering every 10-12 days (500 m³/ha) or daily automated drip cycles maintaining 70-75% moisture.",
        fertilization_notes_uz: "Kompleks NPK + kalsiy (Ca) bargdan purkash. Kalsiy yetishmasligi olmada achchiq dog'lanish (bitter pit) kasalligini keltirib chiqaradi.",
        fertilization_notes_ru: "Внесение комплексных удобрений + листовой кальций (Ca) для защиты плодов от горькой ямчатости.",
        fertilization_notes_en: "Complex NPK + foliar calcium (Ca) feeding. Calcium prevents bitter pit and improves fruit firmness.",
        pest_notes_uz: "Olma mevaxo'ri (codling moth) va un-shudring (powdery mildew)ga qarshi feromon tutqichlar va insektitsidlar qo'llash.",
        pest_notes_ru: "Борьба с яблонной плодожоркой (мониторинг феромонами) и мучнистой росой (серосодержащие препараты).",
        pest_notes_en: "Deploy pheromone traps for codling moth flights; spray sulfur/systemic fungicides against powdery mildew.",
        harvest_notes_uz: "Tugunchalarni me'yorlash: har bitta gul to'pidan 1-2 ta eng chiroyli olma qoldirilib qolgani yulib tashlanadi.",
        harvest_notes_ru: "Нормирование завязи: удаление лишних плодов для получения крупного и товарного яблока.",
        harvest_notes_en: "Fruitlet thinning: leave 1-2 top fruitlets per cluster to guarantee large export sizing.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Meva pishishi va rang kirishi (Iyul-Avgust)",
        stage_name_ru: "Налив и окрашивание плодов (Июль-Август)",
        stage_name_en: "Fruit Maturation & Coloration (July-August)",
        days_min: 91,
        days_max: 150,
        irrigation_notes_uz: "Bir maromda sug'oriladi. Kutilmagan qurg'oqchilikdan so'ng haddan tashqari ko'p suv berilsa olma mevalari yorilib ketadi.",
        irrigation_notes_ru: "Равномерный полив. Резкие перепады влажности вызывают растрескивание кожуры плодов.",
        irrigation_notes_en: "Maintain continuous uniform moisture. Moisture shock triggers severe fruit skin cracking.",
        fertilization_notes_uz: "Faqat kaliyli o'g'itlar (kaliy sulfat 80-100 kg/ga) beriladi. Kaliy mevalarning qizarishi va shirinligini 20% ga oshiradi. Azot butunlay to'xtatiladi.",
        fertilization_notes_ru: "Калийные подкормки (сульфат калия 80-100 кг/га) для интенсивной окраски и сахаристости. Азот исключается.",
        fertilization_notes_en: "Apply potassium sulfate (80-100 kg/ha) to enhance red coloration, aroma, and sugar Brix. Cut all nitrogen.",
        pest_notes_uz: "Mevaxo'rning 2-3 avlodiga qarshi biologik preparatlar purkash. Qushlar va kemiruvchilardan himoya to'rlari.",
        pest_notes_ru: "Защита от 2-3 поколения плодожорки биопрепаратами с коротким сроком ожидания.",
        pest_notes_en: "Target 2nd/3rd gen codling moth with low-toxicity bio-insecticides with short pre-harvest intervals.",
        harvest_notes_uz: "Daraxt tagiga quyosh nuri tushishi uchun mevalarni to'sadigan ortiqcha barglar yengil terib olinadi.",
        harvest_notes_ru: "Прореживание листьев вокруг плодов для равномерного солнечного загара и окрашивания яблок.",
        harvest_notes_en: "Light summer leaf thinning around fruit clusters to optimize sun exposure and uniform blushing.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Meva Terimi va Sovutgichga joylash (Sentyabr-Oktyabr)",
        stage_name_ru: "Сбор урожая и закладка на хранение (Сентябрь-Октябрь)",
        stage_name_en: "Apple Harvest & Cold Storage (September-October)",
        days_min: 151,
        days_max: 240,
        irrigation_notes_uz: "Terimdan 10 kun oldin sug'orish to'xtatiladi. Terim yakunlangach daraxtlarga qishki yaxob suvi (600-700 m³/ha) beriladi.",
        irrigation_notes_ru: "Прекращение полива за 10 дней до сбора. После сбора — влагозарядковый полив (600-700 м³/га) под зиму.",
        irrigation_notes_en: "Cease watering 10 days prior to harvest. Apply post-harvest winter recharge irrigation (600-700 m³/ha).",
        fertilization_notes_uz: "Kuzgi shudgorda qator oralarga chirindi (20-30 t/ga) va superfosfat solinadi. Daraxtlar qishki sovuqqa chidamli bo'ladi.",
        fertilization_notes_ru: "Осеннее внесение органики (20-30 т/га) и фосфора в междурядья для повышения зимостойкости сада.",
        fertilization_notes_en: "Autumn organic manure (20-30 t/ha) and phosphorus between tree rows to strengthen frost resistance.",
        pest_notes_uz: "To'kilgan chirik olmalar yig'ishtirib yo'qotiladi. Daraxt tanasi ohak va mis kuporosi bilan oqlanadi.",
        pest_notes_ru: "Сбор падалицы, очистка штамбов от старой коры и побелка раствором извести с медным купоросом.",
        pest_notes_en: "Collect fallen fruit mummies; whitewash tree trunks with lime + copper sulfate solution.",
        harvest_notes_uz: "Bandi bilan birga ehtiyotkorlik bilan qo'lda uziladi. +1°C...+2°C va 90-95% namlikdagi sovutgichda 6 oygacha saqlanadi.",
        harvest_notes_ru: "Ручной сбор с плодоножкой без нажимов. Хранение в холодильнике при +1...+2°C и влажности 90-95% до 6 месяцев.",
        harvest_notes_en: "Hand-pick with stem intact without bruising. Store at +1°C...+2°C and 90-95% relative humidity for up to 6 months.",
      }
    ]
  },

  // 4. GRAPE / UZUM
  {
    id: 'guide_grape',
    crop_name: 'grape',
    crop_title_uz: "Uzumchilik va Tokzor Parvarishi",
    crop_title_ru: "Виноградник и агротехника",
    crop_title_en: "Vineyard & Grape Culture",
    icon_emoji: "🍇",
    category: "meva",
    summary_uz: "O'zbekistonning mashhur uzumzorlari. Oidium, xomtok va sug'orishni to'g'ri taqsimlash qand miqdorini oshiradi va eksport sifatini beradi.",
    summary_ru: "Славные виноградники Узбекистана. Борьба с оидиумом, зеленая обрезка и контролируемый дефицит воды повышают сахаристость ягод.",
    summary_en: "Renowned Uzbek viticulture. Canopy management, powdery mildew prevention, and deficit irrigation maximize Brix sugar levels.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Tok ochish va shoxlanish (Aprel)",
        stage_name_ru: "Открытие лозы и сокодвижение (Апрель)",
        stage_name_en: "Unwrapping & Spring Bud Burst (April)",
        days_min: 0,
        days_max: 30,
        irrigation_notes_uz: "Qishki ko'milgan toklar ochiladi va simbag'azga ko'tariladi. Bag'az suvi (300-350 m³/ha) beriladi.",
        irrigation_notes_ru: "Открытие лозы после зимовки, сухая подвязка к шпалере и влагозарядковый полив (300-350 м³/га).",
        irrigation_notes_en: "Unwrap overwintered buried vines, tie to trellis, and apply spring start-up watering (300-350 m³/ha).",
        fertilization_notes_uz: "Tup atrofiga organik chirindi va azotli o'g'it (selitra 100 kg/ga). Ildiz faolligini oshirish uchun gumatlar beriladi.",
        fertilization_notes_ru: "Внесение азота и гуматов под корень для стимуляции раннего отрастания побегов.",
        fertilization_notes_en: "Apply nitrogen (100 kg/ha) and humic acids around vine root zones to stimulate early shoot flush.",
        pest_notes_uz: "Kurtaklar bo'rtganda antraknoz va oidiumga qarshi oltingugurt yoki temir kuporosi bilan purkash.",
        pest_notes_ru: "Искореняющее опрыскивание препаратами серы или железным купоросом против зимующих спор оидиума.",
        pest_notes_en: "Eradicant spray with sulfur or iron sulfate against overwintering powdery mildew spores.",
        harvest_notes_uz: "Shoxlarni simbag'azga bir tekis tarab bog'lash (quruq bog'lov).",
        harvest_notes_ru: "Сухая подвязка рукавов и стрелок плодоношения горизонтально к шпалере.",
        harvest_notes_en: "Horizontal cordons tied to trellis wire for balanced sunlight distribution.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Xomtok va gullash (May-Iyun)",
        stage_name_ru: "Пасынкование и цветение (Май-Июнь)",
        stage_name_en: "Canopy Pruning & Bloom (May-June)",
        days_min: 31,
        days_max: 75,
        irrigation_notes_uz: "Ortiqcha novdalar xomtok qilinadi. Gullashdan oldin 1 marta sug'oriladi (350 m³/ha). Gullash davrida suv berilmaydi.",
        irrigation_notes_ru: "Зеленая обломка лишних побегов. Полив перед цветением (350 м³/га). Во время цветения полив прекращают.",
        irrigation_notes_en: "Thin sterile green shoots. Water once before bloom (350 m³/ha). Stop watering during full flower bloom.",
        fertilization_notes_uz: "Gullash oldidan bor (B) va rux (Zn) purkash shingillarning to'kilishini (gorosheniye) oldini oladi.",
        fertilization_notes_ru: "Внекорневая подкормка бором и цинком для предотвращения осыпания завязей (горошения).",
        fertilization_notes_en: "Foliar boron & zinc before bloom prevents flower shatter and shot-berry disorder.",
        pest_notes_uz: "Uzum barg o'rovchisi (grozdovaya listovyortka) va un-shudring (oidium)ga qarshi tizimli fungitsidlar.",
        pest_notes_ru: "Защита от оидиума и гроздевой листовертки специализированными фунгицидами.",
        pest_notes_en: "Preventive systemic fungicide application against powdery mildew (oidium) and berry moth.",
        harvest_notes_uz: "Shingil ustidagi ortiqcha barglar siyraklashtiriladi (xomtok va chilpish).",
        harvest_notes_ru: "Пасынкование и чеканка верхушек побегов при достижении верхней проволоки.",
        harvest_notes_en: "Lateral shoot pinching and leaf removal around bunch zone for airflow.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Shingil kattalashishi va g'ora (Iyul)",
        stage_name_ru: "Рост гроздей и ягод (Июль)",
        stage_name_en: "Berry Growth & Bunch Sizing (July)",
        days_min: 76,
        days_max: 120,
        irrigation_notes_uz: "Uzum do'ppilaganda va g'ora kattalashganda har 10-12 kunda sug'oriladi (400 m³/ha).",
        irrigation_notes_ru: "Регулярный полив каждые 10-12 дней (400 м³/га) в период интенсивного роста ягод.",
        irrigation_notes_en: "Irrigate every 10-12 days (400 m³/ha) during rapid berry cell expansion.",
        fertilization_notes_uz: "Kaliy monofosfat (bargdan 20-30 g / 10L suv) yoki tuproqqa kaliy sulfat (50-60 kg/ga).",
        fertilization_notes_ru: "Подкормка монофосфатом калия по листу для ускорения налива и укрепления кожицы ягод.",
        fertilization_notes_en: "Monopotassium phosphate foliar feeding enhances berry firmness and cluster uniformity.",
        pest_notes_uz: "Kulrang chirish (seraya gnil') va oidiumga qarshi profilaktika. Shingillarga havo aylanishi ta'minlanadi.",
        pest_notes_ru: "Профилактика серой гнили и милдью. Осветление гроздей для лучшего проветривания.",
        pest_notes_en: "Preventive sprays against botrytis bunch rot and downy mildew; ensure aeration.",
        harvest_notes_uz: "Ortiqcha mayda shingillar uzib tashlanadi (yuklama me'yorlash).",
        harvest_notes_ru: "Нормирование гроздей: удаление слабых и деформированных кистей.",
        harvest_notes_en: "Cluster thinning: prune underdeveloped bunches to concentrate vine vigor.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Pishish va Uzum Uzish (Avgust-Oktyabr)",
        stage_name_ru: "Созревание и сбор урожая (Август-Октябрь)",
        stage_name_en: "Ripening & Grape Harvest (August-October)",
        days_min: 121,
        days_max: 220,
        irrigation_notes_uz: "Qand darajasi (Brix 18-22%) ga yetishi va yorilib ketmasligi uchun sug'orish terimdan 20 kun oldin to'xtatiladi.",
        irrigation_notes_ru: "Полив прекращается за 20 дней до сбора для накопления сахара (18-22% Brix) и против растрескивания.",
        irrigation_notes_en: "Withhold watering 20 days prior to harvest to concentrate sugar Brix (18-22%) and prevent split.",
        fertilization_notes_uz: "O'g'itlash o'tkazilmaydi. Hosil terilgach tokzorga fosfor-kaliy o'g'itlari va yaxob suvi beriladi.",
        fertilization_notes_ru: "Подкормки завершены. После сбора — осеннее внесение фосфора и калия для вызревания лозы.",
        fertilization_notes_en: "Applications ended. Post-harvest phosphorus and potassium help lignify canes before winter.",
        pest_notes_uz: "Ari va qushlardan himoya qilish uchun maxsus to'r xaltalar (mesh bags) kiydiriladi.",
        pest_notes_ru: "Защита спелых гроздей от ос и птиц специальными сетчатыми мешочками.",
        pest_notes_en: "Fit protective mesh bags over ripe clusters to prevent wasp and bird damage.",
        harvest_notes_uz: "Quruq havoda qaychi bilan bandidan qirqiladi. Meva mum qatlami (pruin) saqlab qutilarga teriladi.",
        harvest_notes_ru: "Срезка секатором в сухую погоду с сохранением воскового налета (пруина). Укладка в ящики с пергаментом.",
        harvest_notes_en: "Clip cleanly with shears during dry mornings, preserving the natural bloom (pruin).",
      }
    ]
  },

  // 5. POMEGRANATE / ANOR
  {
    id: 'guide_pomegranate',
    crop_name: 'pomegranate',
    crop_title_uz: "Anor O'stirish va Parvarish",
    crop_title_ru: "Гранатовый сад",
    crop_title_en: "Pomegranate Orchard",
    icon_emoji: "🌺",
    category: "meva",
    summary_uz: "Farg'ona, Surxondaryo va Qashqadaryoning lazzatli anorzorlari. Po'sti yorilib ketmasligi uchun bir maromli sug'orish va kaliy oziqlantirish eng muhim omildir.",
    summary_ru: "Знаменитые гранаты Ферганы и Сурхандарьи. Стабильный полив без перепадов влажности и калийное питание предотвращают растрескивание кожуры.",
    summary_en: "Uzbekistan's prized ruby pomegranates. Strict moisture consistency and potassium nutrition prevent fruit split.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Bahorgi uyg'onish va barg yozish (Aprel)",
        stage_name_ru: "Весеннее пробуждение (Апрель)",
        stage_name_en: "Spring Awakening & Leafing (April)",
        days_min: 0,
        days_max: 30,
        irrigation_notes_uz: "Ko'milgan anor tuplari ochiladi, tagi yumshatilib organik chirindi va yengil start suvi (300 m³/ha) beriladi.",
        irrigation_notes_ru: "Открытие кустов после зимы, рыхление приствольных кругов и стартовый полив (300 м³/га).",
        irrigation_notes_en: "Unearth overwintered bushes, cultivate tree basins, apply compost and start-up irrigation (300 m³/ha).",
        fertilization_notes_uz: "Har bir tup tagiga 15-20 kg chirindi, 150g selitra va 100g superfosfat solinadi.",
        fertilization_notes_ru: "Внесение 15-20 кг перегноя, 150г аммиачной селитры и 100г суперфосфата под куст.",
        fertilization_notes_en: "Apply 15-20 kg well-rotted manure, 150g ammonium nitrate, and 100g superphosphate per bush.",
        pest_notes_uz: "Quruq shoxlar kesiladi. Qalqondor (lojnoshchitovka) va anor bitiga qarshi yuvuvchi purkash.",
        pest_notes_ru: "Санитарная вырезка сухих побегов. Опрыскивание против щитовки и гранатовой тли.",
        pest_notes_en: "Prune dead wood. Apply dormant oil spray against scale insects and pomegranate aphids.",
        harvest_notes_uz: "Tupda 4-5 ta baquvvat yosh poya qoldirilib, ortiqcha ildiz bachkilari qirqiladi.",
        harvest_notes_ru: "Формирование куста: сохранение 4-5 основных продуктивных стволов, удаление поросли.",
        harvest_notes_en: "Form bush canopy with 4-5 primary bearing trunks, clearing wild root suckers.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Gullash va tuguncha bog'lash (May-Iyun)",
        stage_name_ru: "Цветение и завязывание плодов (Май-Июнь)",
        stage_name_en: "Bloom & Fruit Set (May-June)",
        days_min: 31,
        days_max: 80,
        irrigation_notes_uz: "Har 10-12 kunda mo'tadil sug'oriladi (350-400 m³/ha). Gullash cho'qqisida ortiqcha suv to'kilishga sabab bo'ladi.",
        irrigation_notes_ru: "Умеренный полив каждые 10-12 дней (350-400 м³/га). Избыток влаги при цветении сбрасывает цветки.",
        irrigation_notes_en: "Moderate watering every 10-12 days (350-400 m³/ha). Avoid flooding during peak blossom.",
        fertilization_notes_uz: "Gullashda bor (B) va kalsiy (Ca) purkash. Ko'zacha shaklidagi haqiqiy hosilli gullarni saqlab qoladi.",
        fertilization_notes_ru: "Листовая подкормка бором и кальцием для укрепления кувшинчатых плодущих цветков.",
        fertilization_notes_en: "Foliar boron & calcium spray reinforces fertile urn-shaped blossoms.",
        pest_notes_uz: "Anor mevaxo'ri (granatovaya ognyovka) va o'rgimchakkana paydo bo'lishini nazorat qilib biologik dori sepish.",
        pest_notes_ru: "Защита от гранатовой огневки и клеща биопрепаратами и трихограммой.",
        pest_notes_en: "Scout for pomegranate butterfly/borer and mites; apply biological controls.",
        harvest_notes_uz: "Qo'ng'iroqsimon soxta (erkak) gullar tabiiy to'kiladi, bunga xavotir olinmaydi.",
        harvest_notes_ru: "Естественный сброс колокольчатых (бесплодных) цветков является нормой.",
        harvest_notes_en: "Sterile bell-shaped flowers drop naturally without causing yield loss.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Anor kattalashishi va don to'lishi (Iyul-Avgust)",
        stage_name_ru: "Рост и налив плодов (Июль-Август)",
        stage_name_en: "Fruit Expansion (July-August)",
        days_min: 81,
        days_max: 140,
        irrigation_notes_uz: "ENG NOZIK BOSQICH! Suv bir maromda berilishi shart. Qurg'oqchilikdan so'ng to'satdan ko'p suv berilsa, anor po'sti butunlay yorilib ketadi.",
        irrigation_notes_ru: "САМЫЙ ОТВЕТСТВЕННЫЙ ЭТАП! Строго равномерный полив. Резкий полив после засухи растрескивает кожуру плодов.",
        irrigation_notes_en: "CRITICAL WATER REGIME! Maintain strict moisture regularity. Uneven cycles cause irreparable fruit splitting.",
        fertilization_notes_uz: "Kaliy sulfat (100 kg/ga) va kalsiy xelat bargdan purkash anor po'stlog'ining elastikligini oshiradi.",
        fertilization_notes_ru: "Сульфат калия (100 кг/га) под корень + хелат кальция по листу для эластичности кожуры.",
        fertilization_notes_en: "Potassium sulfate (100 kg/ha) + foliar calcium chelate increases peel elasticity against cracking.",
        pest_notes_uz: "Anor mevaxo'riga qarshi meva kosachasi ichiga chang kirmasligi uchun tozalash va ishlov berish.",
        pest_notes_ru: "Очистка чашелистиков плодов и профилактическая обработка от загнивания верхушек.",
        pest_notes_en: "Inspect fruit calyx for borer entry; apply safe microbial sprays.",
        harvest_notes_uz: "Quyoshda kuyib ketmasligi uchun shoxlar soyabon holatida boshqariladi.",
        harvest_notes_ru: "Затенение плодов листьями для защиты от солнечных ожогов кожуры.",
        harvest_notes_en: "Canopy managed to shield sensitive fruit rinds from direct sunburn.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Anor Terimi va Qishki Ko'mish (Sentyabr-Noyabr)",
        stage_name_ru: "Сбор граната и укрытие на зиму (Сентябрь-Ноябрь)",
        stage_name_en: "Harvest & Winter Burial (September-November)",
        days_min: 141,
        days_max: 220,
        irrigation_notes_uz: "Terim oldidan sug'orish to'xtatiladi. Noyabrda tuplarni qishki ko'mishdan oldin yer yaxshilab sug'oriladi.",
        irrigation_notes_ru: "Прекращение полива перед сбором. Обильный полив перед осенней прикопкой кустов в ноябре.",
        irrigation_notes_en: "Stop watering before harvest. Apply pre-burial deep soak in late autumn.",
        fertilization_notes_uz: "Kuzgi chirindi va fosfor o'g'itlari xandaq qilib ko'miladi.",
        fertilization_notes_ru: "Внесение органических и фосфорно-калийных удобрений в приствольные канавки.",
        fertilization_notes_en: "Apply compost and rock phosphorus into perimeter root trenches.",
        pest_notes_uz: "Zararlangan va yorilgan anorlar yig'ib olinadi, zararkunandalar qishlamasligi uchun yo'qotiladi.",
        pest_notes_ru: "Утилизация поврежденных и треснувших плодов для предотвращения зимовки вредителей.",
        pest_notes_en: "Clear cracked culls to prevent overwintering fungal and insect reservoirs.",
        harvest_notes_uz: "Po'sti to'q qizil bo'lganda qaychi bilan ehtiyotkorlik bilan kesiladi. Salqin qorong'i yerto'lada 4-5 oy yangidek saqlanadi.",
        harvest_notes_ru: "Срезка секатором при достижении сортовой окраски. Хранение в сухом погребе при +4...+6°C до 4-5 месяцев.",
        harvest_notes_en: "Clip cleanly with shears upon color break. Stores up to 4-5 months in cool dry cellars (+4...+6°C).",
      }
    ]
  },

  // 6. TOMATO / POMIDOR
  {
    id: 'guide_tomato',
    crop_name: 'tomato',
    crop_title_uz: "Pomidor (Ochiq maydon va Issiqxona)",
    crop_title_ru: "Томаты (Открытый грунт и теплицы)",
    crop_title_en: "Tomatoes (Open Field & Greenhouse)",
    icon_emoji: "🍅",
    category: "sabzavot",
    summary_uz: "Serhosil sabzavot ekini. Fitoftora profilaktikasi, tomchilatib sug'orish va kaliy o'g'itlari hosildorlik hamda shakarni ta'minlaydi.",
    summary_ru: "Высокопродуктивная овощная культура. Профилактика фитофторы, капельный полив и калийные подкормки определяют сахаристость и лежкость.",
    summary_en: "High-yielding vegetable staple. Blight management, precision drip fertigation, and potassium maximize fruit density and sweetness.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Ko'chat o'tqazish va ildiz otish (0-20 kun)",
        stage_name_ru: "Высадка рассады и укоренение (0-20 дней)",
        stage_name_en: "Transplanting & Rooting (0-20 days)",
        days_min: 0,
        days_max: 20,
        irrigation_notes_uz: "Ko'chat o'tqazilgach darhol ildiz suvi beriladi. Tomchilatib sug'orishda tuproq namligi 75-80% doimiy bir maromda ushlanadi.",
        irrigation_notes_ru: "Обильный полив при высадке. Поддержание влажности 75-80% при капельном поливе без застоя воды.",
        irrigation_notes_en: "Immediate root zone soak at transplanting. Maintain 75-80% field moisture with steady drip pulses.",
        fertilization_notes_uz: "Ildiz stimulyatorlari (ildiz hosil qiluvchi fosforli o'g'itlar 13-40-13) va kalsiy nitrat bilan ildizlantiriladi.",
        fertilization_notes_ru: "Фосфорные укоренители (13-40-13) и кальциевая селитра для быстрого старта корневой системы.",
        fertilization_notes_en: "High-phosphorus rooting starter (e.g. 13-40-13) and calcium nitrate to stimulate root establishment.",
        pest_notes_uz: "Qora oyoq (chernaya nojka), ildiz chirish va pomidor kuyasi (Tuta absoluta)ga qarshi feromon tutqichlar o'rnatish.",
        pest_notes_ru: "Защита от черной ножки биофунгицидами и феромонный мониторинг южноамериканской томатной моли (Tuta absoluta).",
        pest_notes_en: "Protect against damping-off with bio-fungicides; install pheromone delta traps for tomato leafminer (Tuta absoluta).",
        harvest_notes_uz: "Ko'chatlar tutib ketgach tuproq orasi yengil yumshatiladi.",
        harvest_notes_ru: "Рыхление междурядий после приживаемости рассады.",
        harvest_notes_en: "Shallow inter-row cultivation once seedlings establish firmly.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Poya boylash va chilpish (21-45 kun)",
        stage_name_ru: "Подвязка и пасынкование (21-45 дней)",
        stage_name_en: "Staking & Suckering (21-45 days)",
        days_min: 21,
        days_max: 45,
        irrigation_notes_uz: "Har 4-5 kunda yoki har kuni 2-3 soat tomchilatib sug'oriladi. Suv barglarga purkalmasligi shart (kasallik oldini olish uchun).",
        irrigation_notes_ru: "Полив каждые 4-5 дней или ежедневный капельный полив под корень. Избегать попадания воды на листья.",
        irrigation_notes_en: "Water every 4-5 days or run daily drip cycles strictly at soil level to prevent foliar blight.",
        fertilization_notes_uz: "Teng mutanosib NPK 20-20-20 va magniy sulfat bilan haftada 1 marta fertitatsiya qilinadi.",
        fertilization_notes_ru: "Еженедельная фертигация сбалансированным NPK 20-20-20 + сульфат магния.",
        fertilization_notes_en: "Weekly balanced NPK 20-20-20 fertigation combined with magnesium sulfate.",
        pest_notes_uz: "Shira, oq qanot (belokrylka) va Tuta absolutaga qarshi sariq yopishqoq tutqichlar va biopreparatlar.",
        pest_notes_ru: "Желтые клеевые ловушки против белокрылки и трипса, биоинсектициды против томатной моли.",
        pest_notes_en: "Yellow sticky cards for whiteflies/thrips and targeted microbial sprays for leafminer larvae.",
        harvest_notes_uz: "Yon shoxlar (pasyunoklar) 5 sm dan oshmasdan chilpib tashlanadi va poya ipga boylanadi.",
        harvest_notes_ru: "Регулярное пасынкование (удаление боковых побегов до 5 см) и подвязка к шпалере.",
        harvest_notes_en: "Prune side suckers before they exceed 5 cm; twine main stem to trellis wires.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Gullash va tuguncha bog'lash (46-70 kun)",
        stage_name_ru: "Цветение и завязывание плодов (46-70 дней)",
        stage_name_en: "Flowering & Fruit Setting (46-70 days)",
        days_min: 46,
        days_max: 70,
        irrigation_notes_uz: "Sug'orish hajmi oshiriladi (mevalar quyilishi davri). Qurg'oqchilik uchki chirishga olib keladi.",
        irrigation_notes_ru: "Увеличение объема полива в период налива кистей. Дефицит влаги провоцирует вершинную гниль.",
        irrigation_notes_en: "Increase irrigation volume as fruit clusters size up. Moisture stress triggers blossom-end rot.",
        fertilization_notes_uz: "Kaliy ko'p bo'lgan NPK (masalan, 15-5-30 yoki kaliy nitrat) + kalsiy xelati beriladi. Kalsiy uchki chirishning (vershinnaya gnil') oldini oladi.",
        fertilization_notes_ru: "Калийные формулы (15-5-30) + хелат кальция против вершинной гнили плодов.",
        fertilization_notes_en: "High-potassium formula (e.g. 15-5-30) + chelated calcium prevents blossom-end rot.",
        pest_notes_uz: "Fitoftoroz (late blight) va alternariozga qarshi mis va tizimli fungitsidlar bilan profilaktik purkash.",
        pest_notes_ru: "Профилактические обработки против фитофтороза и альтернариоза медьсодержащими фунгицидами.",
        pest_notes_en: "Preventive copper and systemic fungicide applications against late blight and alternaria leaf spot.",
        harvest_notes_uz: "Pastki sarg'aygan qari barglar mevalar quyosh ko'rishi uchun qirqiladi.",
        harvest_notes_ru: "Удаление нижних старых листьев до первой плодовой кисти для улучшения проветривания.",
        harvest_notes_en: "Prune bottom aged leaves up to the first fruit truss to optimize airflow and sunlight.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Meva qizarishi va Uzluksiz Terim (71+ kun)",
        stage_name_ru: "Созревание и регулярный сбор (71+ дней)",
        stage_name_en: "Ripening & Continuous Harvest (71+ days)",
        days_min: 71,
        days_max: 180,
        irrigation_notes_uz: "Yengil va muntazam sug'orish. Meva yorilmasligi uchun birdan ortiqcha suv berilmaydi.",
        irrigation_notes_ru: "Умеренный частый полив. Избегать резких поливов для предотвращения растрескивания томатов.",
        irrigation_notes_en: "Moderate regular drip pulses. Avoid flood shocks to prevent tomato radial splitting.",
        fertilization_notes_uz: "Kaliy sulfat dondagi shirinlik va qizil rangni kuchaytiradi. Hosil yakuniga 10 kun qolganda to'xtatiladi.",
        fertilization_notes_ru: "Калийные подкормки для плотности и сахаристости плодов. Прекращение за 10 дней до финала.",
        fertilization_notes_en: "Potassium sulfate maintains brix and firmness through late pickings.",
        pest_notes_uz: "Kutilish muddati (karentin) qisqa (1-3 kun) biologik preparatlardan foydalaniladi.",
        pest_notes_ru: "Использование биопрепаратов с минимальным сроком ожидания (1-3 дня до сбора).",
        pest_notes_en: "Use bio-rational products with 1-3 day pre-harvest intervals for safe picking.",
        harvest_notes_uz: "Pishgan qizil yoki pushti pomidorlar har 2-3 kunda bandi bilan ehtiyotkorlik bilan teriladi. Quruq yashiklarda 12-15°C da saqlanadi.",
        harvest_notes_ru: "Сбор каждые 2-3 дня в утренние часы. Хранение при температуре 12-15°C в вентилируемых ящиках.",
        harvest_notes_en: "Harvest every 2-3 days in cool mornings. Store in ventilated crates at 12-15°C (do not freeze).",
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
    g => g.crop_name === normCrop || normCrop.includes(g.crop_name) || g.crop_title_uz.toLowerCase().includes(normCrop)
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

export const CROP_GUIDES = CROP_GUIDES_DATA;
