export interface CropStageCare {
  growth_stage: string;
  stage_name_uz: string;
  stage_name_ru: string;
  stage_name_en: string;
  days_min: number;
  days_max: number;
  days_range?: string;
  tasks_uz: string[];
  tasks_ru: string[];
  tasks_en: string[];
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
  crop_name: string; // 'cotton' | 'wheat' | 'corn' | 'orchard' | 'apple' | 'grape' | 'pomegranate' | 'tomato'
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
    crop_title_uz: "G‘o‘za (Paxta)",
    crop_title_ru: "Хлопчатник (Хлопок)",
    crop_title_en: "Cotton",
    icon_emoji: "☁️",
    category: "paxta",
    summary_uz: "O‘zbekistonning asosiy texnik ekini. Sug‘orish rejimiga, o‘z vaqtida chilpishga va g‘o‘za tunlamiga alohida e’tibor berish talab etiladi.",
    summary_ru: "Главная техническая культура Узбекистана. Требует строгого соблюдения поливного режима, чеканки и контроля хлопковой совки.",
    summary_en: "Uzbekistan's key commercial crop. Requires precise irrigation timing, topping, and integrated bollworm management.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Urug‘ unib chiqishi va maysalik",
        stage_name_ru: "Прорастание и всходы",
        stage_name_en: "Germination & Emergence",
        days_min: 1,
        days_max: 20,
        days_range: "1 - 20 kun",
        tasks_uz: [
          "Yagana qilish (qator oralig‘ini belgilangan zichlikda siyraklatish)",
          "Qatqaloqqa qarshi kultivatsiya o‘tkazish va qator oralari yumshatish",
          "1 gektarda 100-110 ming sog‘lom tup qalinligini shakllantirish"
        ],
        tasks_ru: [
          "Прореживание всходов до оптимальной густоты стояния",
          "Междурядная культивация против почвенной корки",
          "Формирование густоты 100-110 тыс. растений/га"
        ],
        tasks_en: [
          "Thinning seedlings to target stand density",
          "Inter-row cultivation to break crust and aerate roots",
          "Establish 100-110k healthy plants/ha density"
        ],
        irrigation_notes_uz: "Unib chiqish suvi berilgan bo‘lsa, ortiqcha sug‘orishdan saqlanish (ildiz chirishi xavfi). Yengil sug‘orish (250-300 m³/ga).",
        irrigation_notes_ru: "Легкий полив (250-300 м³/га). Избегать переувлажнения во избежание корневых гнилей.",
        irrigation_notes_en: "Light irrigation (250-300 m³/ha). Avoid waterlogging to prevent seedling root rot.",
        fertilization_notes_uz: "Ekish oldidan fosfor (P₂O₅ 70-80 kg/ga) va kaliy (K₂O 50 kg/ga) beriladi. Ildiz tizimini baquvvat qilish uchun fosfor zarur.",
        fertilization_notes_ru: "Основное внесение фосфора (70-80 кг/га) и калия (50 кг/га) под вспашку для развития корней.",
        fertilization_notes_en: "Pre-plant basal phosphorus (70-80 kg/ha) and potassium (50 kg/ha) for root vitality.",
        pest_notes_uz: "Ildiz chirishiga qarshi fungitsid bilan profilaktika, shira va tamaki tripsiga qarshi monitoring.",
        pest_notes_ru: "Протравливание и фунгицидная защита от корневых гнилей, трипса и ранней тли.",
        pest_notes_en: "Seed treatment and early fungicide protection against damping-off, thrips, and aphids.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Shonalash va shoxlanish",
        stage_name_ru: "Бутонизация и ветвление",
        stage_name_en: "Squaring & Branching",
        days_min: 20,
        days_max: 45,
        days_range: "20 - 45 kun",
        tasks_uz: [
          "Chopiq qilish va begona o‘tlardan tozalash",
          "Birinchi azotli va fosforli oziqlantirishni o‘tkazish",
          "Poya bo‘yi va shona sonini kunlik monitoring qilish"
        ],
        tasks_ru: [
          "Прополка и очистка междурядий от сорняков",
          "Первая азотно-фосфорная подкормка",
          "Мониторинг высоты стебля и закладки бутонов"
        ],
        tasks_en: [
          "Hoeing, weeding, and inter-row cultivation",
          "First top-dressing with nitrogen and phosphorus",
          "Daily monitoring of plant height and square formation"
        ],
        irrigation_notes_uz: "Namlik darajasi 65-70% oralig‘ida saqlanishi kerak (400-450 m³/ga). Sug‘orishdan so‘ng kultivatsiya qilinadi.",
        irrigation_notes_ru: "Поддержание влажности 65-70% НВ (400-450 м³/га). Культивация после полива.",
        irrigation_notes_en: "Maintain 65-70% field moisture (400-450 m³/ha). Cultivate shortly after watering.",
        fertilization_notes_uz: "3-4 chinbargda azot (ammiakli selitra 40-50 kg/ga sof holda). Bargdan sink (Zn) purkash shonalashni tezlashtiradi.",
        fertilization_notes_ru: "Азот 40-50 кг/га д.в. при 3-4 листьях. Листовая подкормка цинком (Zn).",
        fertilization_notes_en: "Nitrogen 40-50 kg/ha at 3-4 leaves. Foliar zinc (Zn) spray to boost squaring.",
        pest_notes_uz: "O‘rgimchakkana va shiralarga qarshi monitoring boshlash, 10-15% bargda kana ko‘rinsa akaritsid qo‘llash.",
        pest_notes_ru: "Мониторинг паутинного клеща и тли, акарицидная обработка при превышении ЭПВ.",
        pest_notes_en: "Monitor leaf undersides for spider mites and aphids. Apply acaricides if threshold is crossed.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Gullash va ko‘sak hosil qilish",
        stage_name_ru: "Цветение и коробочкообразование",
        stage_name_en: "Flowering & Boll Formation",
        days_min: 45,
        days_max: 85,
        days_range: "45 - 85 kun",
        tasks_uz: [
          "Uchlarini chilpish (chekanit) — o‘suv nuqtasini uzib ko‘saklarni to‘yintirish",
          "Mikroelementlar (Bor, Magniy) bilan bargdan oziqlantirish",
          "G‘o‘za tunlamiga qarshi feromon tutqichlar o‘rnatish va biologik himoya"
        ],
        tasks_ru: [
          "Чеканка верхушек главного стебля (прищипывание)",
          "Внекорневая подкормка микроэлементами (Бор, Магний)",
          "Установка феромонных ловушек против совки"
        ],
        tasks_en: [
          "Terminal bud topping to redirect nutrients into bolls",
          "Foliar micro-nutrient spraying (Boron, Magnesium)",
          "Install pheromone traps and deploy biological Trichogramma"
        ],
        irrigation_notes_uz: "Eng kritik davr: namlik 75-80% dan tushmasligi shart (har 10-12 kunda me’yoriy sug‘orish, 550-600 m³/ga).",
        irrigation_notes_ru: "Критический период: влажность не ниже 75-80% (полив каждые 10-12 дней, 550-600 м³/га).",
        irrigation_notes_en: "Most critical period: maintain 75-80% moisture (irrigate every 10-12 days, 550-600 m³/ha).",
        fertilization_notes_uz: "Gullash boshida azot (60-70 kg/ga) va kaliy sulfat (40 kg/ga). Bor purkash ko‘sak to‘kilishini kamaytiradi.",
        fertilization_notes_ru: "Азот (60-70 кг/га) + сульфат калия (40 кг/га). Борная подкормка снижает опадение завязей.",
        fertilization_notes_en: "Nitrogen (60-70 kg/ha) + potassium sulfate (40 kg/ha). Boron prevents boll shedding.",
        pest_notes_uz: "G‘o‘za tunlamiga qarshi trixogramma yoki samarali biologik/kimyoviy ishlov berish.",
        pest_notes_ru: "Выпуск трихограммы и бракона против хлопковой совки, химические обработки по регламенту.",
        pest_notes_en: "Release Trichogramma & Bracon wasps or selective bio-insecticides against bollworm.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Ko‘sak ochilishi va Paxta terimi",
        stage_name_ru: "Раскрытие коробочек и сбор хлопка",
        stage_name_en: "Boll Opening & Harvesting",
        days_min: 85,
        days_max: 160,
        days_range: "85 - 160 kun",
        tasks_uz: [
          "Ko‘saklar 60-70% ochilganda defoliatsiya (barg to‘kish) o‘tkazish",
          "Paxta terim mashinalari yoki qo‘lda 1-terimni o‘tkazish",
          "Olingan xomashyoni quruq omborlarda saqlash"
        ],
        tasks_ru: [
          "Дефолиация при раскрытии 60-70% коробочек",
          "Машинный или ручной первый сбор качественного волокна",
          "Контроль влажности волокна (до 10-12%)"
        ],
        tasks_en: [
          "Apply defoliants when 60-70% of bolls are open",
          "Commence primary harvest for top-grade fiber",
          "Maintain seed cotton moisture below 10-12%"
        ],
        irrigation_notes_uz: "Sug‘orish butunlay to‘xtatiladi. Ko‘saklar tez va quruq ochilishi ta’minlanadi.",
        irrigation_notes_ru: "Полив полностью прекращается для быстрого просыхания и раскрытия коробочек.",
        irrigation_notes_en: "Cease all irrigation to facilitate dry, uniform boll opening.",
        fertilization_notes_uz: "O‘g‘it berilmaydi. Tuproq tahlili asosida keyingi mavsum uchun fosfor-kaliy rejalashtiriladi.",
        fertilization_notes_ru: "Подкормки не проводятся. Подготовка поля к зяблевой вспашке.",
        fertilization_notes_en: "No fertilizer applied. Prepare field for autumn deep plowing.",
        pest_notes_uz: "Daladagi begona o‘tlar terimdan oldin to‘liq tozalanadi.",
        pest_notes_ru: "Очистка краев поля от сорняков во избежание загрязнения волокна.",
        pest_notes_en: "Clear weed buffer strips to protect fiber from contaminants.",
      }
    ]
  },

  // 2. WHEAT / BUG'DOY
  {
    id: 'guide_wheat',
    crop_name: 'wheat',
    crop_title_uz: "Kuzgi Bug‘doy",
    crop_title_ru: "Озимая пшеница",
    crop_title_en: "Winter Wheat",
    icon_emoji: "🌾",
    category: "don",
    summary_uz: "O‘zbekiston oziq-ovqat xavfsizligining asosi. Erta bahorgi azotli oziqlantirish va boshoqlash sug‘orishi hosildorlikni belgilaydi.",
    summary_ru: "Основа продовольственной безопасности. Ранневесенняя азотная подкормка и полив в фазу колошения формируют урожай.",
    summary_en: "Uzbekistan's food staple. Early spring nitrogen feeding and heading irrigation determine maximum grain yields.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Unib chiqish va tuplash",
        stage_name_ru: "Всходы и кущение",
        stage_name_en: "Emergence & Tillering",
        days_min: 1,
        days_max: 30,
        days_range: "1 - 30 kun",
        tasks_uz: [
          "Urug‘ suvi berish va bir tekis maysalashni ta’minlash",
          "Maysalar qalinligini (450-500 dona/m²) nazorat qilish",
          "Begona o‘tlar va sariq zangga qarshi urug‘ dorilash"
        ],
        tasks_ru: [
          "Всходовый полив для равномерного прорастания",
          "Контроль густоты всходов (450-500 раст./м²)",
          "Протравливание семян от ржавчины и головни"
        ],
        tasks_en: [
          "Germination watering for uniform emergence",
          "Check stand density (450-500 seedlings/m²)",
          "Fungicide seed treatment against rust and bunt"
        ],
        irrigation_notes_uz: "Urug‘ suvi (350 m³/ha) beriladi. Tuplash davrida mo‘tadil namlik (65-70%) saqlanadi.",
        irrigation_notes_ru: "Всходовый полив (350 м³/га), поддержание умеренной влажности 65-70%.",
        irrigation_notes_en: "Emergence soak (350 m³/ha), maintain 65-70% moisture during tillering.",
        fertilization_notes_uz: "Ekishda fosfor (P₂O₅ 60-70 kg/ga) va kaliy (40 kg/ga). Kuzda ortiqcha azot berilmaydi.",
        fertilization_notes_ru: "Фосфор (60-70 кг/га) и калий (40 кг/га) под сев. Ограничить азот осенью.",
        fertilization_notes_en: "Pre-sow phosphorus (60-70 kg/ha) and potassium (40 kg/ha). Limit autumn nitrogen.",
        pest_notes_uz: "Sariq zang va ildiz chirish profilaktikasi uchun sertifikatlangan dorilar bilan ishlov berish.",
        pest_notes_ru: "Защита от желтой ржавчины и корневых гнилей.",
        pest_notes_en: "Preventive treatment against stripe rust and root rot.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Poya tortish va naychalash",
        stage_name_ru: "Выход в трубку",
        stage_name_en: "Stem Elongation & Jointing",
        days_min: 30,
        days_max: 95,
        days_range: "30 - 95 kun",
        tasks_uz: [
          "Erta bahorgi birinchi va ikkinchi azotli oziqlantirishni o‘tkazish",
          "Begona o‘tlarga qarshi gerbitsid bilan ishlov berish",
          "Poya yotib qolmasligi uchun me’yoriy o‘sish regulyatorlarini qo‘llash"
        ],
        tasks_ru: [
          "Ранневесенняя азотная подкормка (2 приема)",
          "Гербицидная обработка против сорных растений",
          "Применение ретардантов против полегания"
        ],
        tasks_en: [
          "Early spring nitrogen top-dressing split in two doses",
          "Herbicide application for broadleaf and grass weeds",
          "Growth regulators to prevent lodging in lush stands"
        ],
        irrigation_notes_uz: "Bahorgi sug‘orish (400-450 m³/ga). Poyaning baquvvat bo‘lishi uchun me’yorga qat’iy rioya qiling.",
        irrigation_notes_ru: "Весенний полив (400-450 м³/га). Строгий контроль нормы против полегания.",
        irrigation_notes_en: "Spring irrigation (400-450 m³/ha). Strict moisture balance to avoid lodging.",
        fertilization_notes_uz: "ENG ASOSIY: Ammiakli selitra 150-200 kg/ga (2 muddatda bo‘lib). Bargdan temir va rux purkash.",
        fertilization_notes_ru: "КЛЮЧЕВАЯ ПОДКОРМКА: Аммиачная селитра 150-200 кг/га дробно + микроэлементы по листу.",
        fertilization_notes_en: "PRIMARY FEEDING: Split 150-200 kg/ha ammonium nitrate + foliar micro-elements.",
        pest_notes_uz: "Shira va shilliq qurt (p’yavitsa)ga qarshi insektitsid purkash.",
        pest_notes_ru: "Инсектицидная защита от злаковой тли и пьявицы.",
        pest_notes_en: "Insecticide spray against cereal aphids and leaf beetles.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Boshoqlash va don to‘lishi",
        stage_name_ru: "Колошение и налив зерна",
        stage_name_en: "Heading & Grain Filling",
        days_min: 95,
        days_max: 135,
        days_range: "95 - 135 kun",
        tasks_uz: [
          "Karbamid (mochevina) bilan bargdan oziqlantirish (oqsil va kleykovinani oshirish)",
          "Boshoq kasalliklariga qarshi monitoring o‘tkazish",
          "Xirmon va kombaynlarni tayyorlash"
        ],
        tasks_ru: [
          "Внекорневая подкормка карбамидом для повышения клейковины",
          "Фунгицидная защита колоса",
          "Подготовка комбайнов и токов к уборочной"
        ],
        tasks_en: [
          "Foliar urea spray to increase grain protein & gluten",
          "Scout for head blight and ear diseases",
          "Calibrate harvesters and prepare threshing floors"
        ],
        irrigation_notes_uz: "Dondagi to‘lishni ta’minlovchi hal qiluvchi sug‘orish (450-500 m³/ga).",
        irrigation_notes_ru: "Критический полив (450-500 м³/га) для налива зерна.",
        irrigation_notes_en: "Grain filling irrigation (450-500 m³/ha) to maximize test weight.",
        fertilization_notes_uz: "Karbamid (10-15 kg/ga) eritmasi bilan bargdan purkash dondagi sifatni 2-3% ga oshiradi.",
        fertilization_notes_ru: "Карбамид 10-15 кг/га по листу повышает качество зерна.",
        fertilization_notes_en: "Foliar urea 10-15 kg/ha elevates grain protein by 2-3%.",
        pest_notes_uz: "Xirmon burasi (vrednaya cherepashka) va boshoq shirasiga qarshi purkash.",
        pest_notes_ru: "Защита от вредной черепашки и трипса в фазе налива.",
        pest_notes_en: "Target Sunn pest and wheat midges with approved insecticides.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Don to‘liq pishishi va O‘rim",
        stage_name_ru: "Полная спелость и уборка",
        stage_name_en: "Maturity & Combine Harvest",
        days_min: 135,
        days_max: 200,
        days_range: "135+ kun",
        tasks_uz: [
          "Don namligi 13-14% ga yetganda to‘g‘ridan-to‘g‘ri kombayn bilan o‘rish",
          "Donni tozalash, quritish va elevatorga topshirish",
          "Somonni yig‘ish va takroriy ekin uchun yerni haydash"
        ],
        tasks_ru: [
          "Прямое комбайнирование при влажности 13-14%",
          "Очистка, сушка и сдача зерна на элеватор",
          "Уборка соломы и подготовка под повторный сев"
        ],
        tasks_en: [
          "Direct combine harvesting at 13-14% grain moisture",
          "Clean, dry, and store grain in ventilated silos",
          "Bale straw and prepare soil for double cropping"
        ],
        irrigation_notes_uz: "O‘rimga 15-20 kun qolganda sug‘orish butunlay to‘xtatiladi.",
        irrigation_notes_ru: "Полное прекращение полива за 15-20 дней до уборки.",
        irrigation_notes_en: "Cease all irrigation 15-20 days prior to combine harvest.",
        fertilization_notes_uz: "O‘g‘itlash to‘xtatiladi. Somon shudgorga kiritilib chirindi hosil qilinadi.",
        fertilization_notes_ru: "Внесение завершено. Заделка пожнивных остатков.",
        fertilization_notes_en: "Finished. Incorporate crop residues into soil.",
        pest_notes_uz: "Omborlarni dezinfeksiya va fumigatsiya qilish.",
        pest_notes_ru: "Фумигация и обеззараживание зернохранилищ.",
        pest_notes_en: "Fumigate and sanitize grain silos before intake.",
      }
    ]
  },

  // 3. CORN / MAKKAJO'XORI
  {
    id: 'guide_corn',
    crop_name: 'corn',
    crop_title_uz: "Makkajo‘xori",
    crop_title_ru: "Кукуруза (зерно и силос)",
    crop_title_en: "Corn / Maize",
    icon_emoji: "🌽",
    category: "don",
    summary_uz: "Don va silos uchun yuqori mahsuldor ekin. Kuchli azotli oziqlantirish, so‘talar shakllanishida mo‘l suv va poya kapalaklaridan himoya muhim.",
    summary_ru: "Высокопродуктивная культура на зерно и силос. Требует обильного азотного питания, своевременного полива при выметывании и защиты от кукурузного мотылька.",
    summary_en: "High-yield cereal for grain and silage. Demands rich nitrogen feeding, abundant tassel irrigation, and corn borer control.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Unib chiqish va 3-5 barglik davr",
        stage_name_ru: "Всходы и 3-5 листьев",
        stage_name_en: "Emergence & V3-V5 Stage",
        days_min: 1,
        days_max: 25,
        days_range: "1 - 25 kun",
        tasks_uz: [
          "Tuproq qatqalog‘ini yumshatish va begona o‘tlardan tozalash",
          "Gektariga 65-75 ming tup maqbul zichlikni ta’minlash",
          "Kultivatsiya va birinchi start oziqlantirish"
        ],
        tasks_ru: [
          "Рыхление почвенной корки и прополка",
          "Формирование густоты 65-75 тыс. раст./га",
          "Междурядная культивация и стартовая подкормка"
        ],
        tasks_en: [
          "Break soil crust and perform early weed control",
          "Ensure stand density of 65-75k plants/ha",
          "Inter-row cultivation and starter fertilization"
        ],
        irrigation_notes_uz: "Maysalik davrida yengil sug‘orish (300-350 m³/ga). Ildiz chuqur ketishi uchun ortiqcha botqoqlikdan saqlaning.",
        irrigation_notes_ru: "Умеренный полив (300-350 м³/га). Стимуляция глубокого укоренения.",
        irrigation_notes_en: "Light irrigation (300-350 m³/ha) to encourage deep tap rooting.",
        fertilization_notes_uz: "Ekishda fosfor (80 kg/ga) va kaliy (50 kg/ga). 3-5 chinbargda rux (Zn) bilan bargdan purkash.",
        fertilization_notes_ru: "Фосфор (80 кг/га) и калий (50 кг/га). Листовая подкормка цинком (Zn) при 3-5 листьях.",
        fertilization_notes_en: "Basal phosphorus (80 kg/ha) and potassium (50 kg/ha). Foliar zinc at V3-V5 stage.",
        pest_notes_uz: "Simqurt (provolochnik) va ko‘kat shirasiga qarshi urug‘ dorilash hamda profilaktika.",
        pest_notes_ru: "Защита всходов от проволочника и тли.",
        pest_notes_en: "Seed dressing against wireworms and early aphids.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Intensiv poya o‘sishi va ro‘vak chiqarish",
        stage_name_ru: "Интенсивный рост и выметывание",
        stage_name_en: "Rapid Growth & Tasseling",
        days_min: 25,
        days_max: 65,
        days_range: "25 - 65 kun",
        tasks_uz: [
          "Asosiy azotli oziqlantirish (karbamid/selitra 150-180 kg/ga)",
          "Poya kapalagiga qarshi trixogramma tarqatish",
          "Sug‘orish ariqlarini tozalash va qator oralari yumshatish"
        ],
        tasks_ru: [
          "Основная азотная подкормка (150-180 кг/га)",
          "Биологическая защита трихограммой от стеблевого мотылька",
          "Рыхление междурядий перед смыканием рядов"
        ],
        tasks_en: [
          "Main nitrogen side-dressing (150-180 kg/ha urea)",
          "Biological release of Trichogramma against corn borer",
          "Cultivate and ridge rows before canopy closure"
        ],
        irrigation_notes_uz: "Suvga talab yuqori: har 8-10 kunda mo‘l sug‘orish (550-600 m³/ga).",
        irrigation_notes_ru: "Высокая потребность в воде: полив каждые 8-10 дней (550-600 м³/га).",
        irrigation_notes_en: "High water demand: irrigate every 8-10 days (550-600 m³/ha).",
        fertilization_notes_uz: "Azotli o‘g‘itni bo‘lib solish (sug‘orish suvi bilan birga fertitatsiya).",
        fertilization_notes_ru: "Внесение азота с поливной водой (фертигация).",
        fertilization_notes_en: "Split nitrogen applications injected via irrigation water.",
        pest_notes_uz: "Makkajo‘xori poya kapalagi (steblevoy motilyok) va tunlamga qarshi qat’iy nazorat.",
        pest_notes_ru: "Контроль стеблевого мотылька и хлопковой совки.",
        pest_notes_en: "Monitor and spray against European corn borer and fall armyworm.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "So‘ta shakllanishi va sut-mum pishish",
        stage_name_ru: "Формирование початков и налив",
        stage_name_en: "Silk Stage & Grain Filling",
        days_min: 65,
        days_max: 95,
        days_range: "65 - 95 kun",
        tasks_uz: [
          "Changlanish jarayonida havo harorati va namlikni boshqarish",
          "Kaliy va fosfor bilan oziqlantirish (dondagi kraxmal va vaznni oshirish)",
          "So‘talardagi don qatorlarini tekshirish"
        ],
        tasks_ru: [
          "Контроль опыления и влажности в период цветения",
          "Калийная подкормка для налива зерен",
          "Мониторинг выполненности початков"
        ],
        tasks_en: [
          "Ensure adequate soil moisture during silking and pollination",
          "Potassium top-dressing for kernel weight and starch density",
          "Evaluate ear fill and kernel development"
        ],
        irrigation_notes_uz: "ENG KRITIK DAVR: namlik 75-80% saqlanadi (600 m³/ga). Suvsizlik so‘tada don kam bo‘lishiga olib keladi.",
        irrigation_notes_ru: "САМЫЙ ВАЖНЫЙ ПОЛИВ: влажность 75-80% (600 м³/га) для предотвращения череззерницы.",
        irrigation_notes_en: "CRITICAL STAGE: maintain 75-80% moisture (600 m³/ha) to prevent blank tips.",
        fertilization_notes_uz: "Kaliy sulfat va bor bargdan purkash dondagi ozuqa qiymatini oshiradi.",
        fertilization_notes_ru: "Листовая подкормка калием и бором для качества зерна.",
        fertilization_notes_en: "Foliar potassium and boron to reinforce grain filling.",
        pest_notes_uz: "So‘ta qurtlariga qarshi biologik ishlov.",
        pest_notes_ru: "Биопрепараты против гусениц на початках.",
        pest_notes_en: "Bio-rational spray against earworm larvae.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "To‘liq pishish va Hosil yig‘imi",
        stage_name_ru: "Полная спелость и уборка",
        stage_name_en: "Black Layer & Harvest",
        days_min: 95,
        days_max: 140,
        days_range: "95+ kun",
        tasks_uz: [
          "Silos uchun: sut-mum pishishda o‘rish va zichlab bostirish",
          "Don uchun: qora nuqta (black layer) paydo bo‘lib, namlik 14-16% bo‘lganda kombayn bilan yanchish",
          "Donni quritish va ventilyatsiyalangan omborlarga joylash"
        ],
        tasks_ru: [
          "На силос: скашивание в фазе восковой спелости и трамбовка в ямы",
          "На зерно: уборка комбайном при влажности 14-16%",
          "Сушка и закладка зерна на хранение"
        ],
        tasks_en: [
          "Silage: harvest at dough stage and pack tightly in bunker silos",
          "Grain: combine harvest at black layer maturity (14-16% moisture)",
          "Dry and store kernels in aerated bins"
        ],
        irrigation_notes_uz: "O‘rimga 15 kun qolganda sug‘orish to‘xtatiladi.",
        irrigation_notes_ru: "Прекращение полива за 15 дней до уборки.",
        irrigation_notes_en: "Cease watering 15 days before combine harvest.",
        fertilization_notes_uz: "O‘g‘itlash yakunlangan.",
        fertilization_notes_ru: "Подкормки завершены.",
        fertilization_notes_en: "Applications completed.",
        pest_notes_uz: "Omborlarni dezinfeksiya qilish.",
        pest_notes_ru: "Обеззараживание складов.",
        pest_notes_en: "Sanitize storage bins.",
      }
    ]
  },

  // 4. INTENSIVE ORCHARDS / INTENSIV BOG'LAR (Olma, Shaftoli, Gilos)
  {
    id: 'guide_orchard',
    crop_name: 'orchard',
    crop_title_uz: "Intensiv bog‘lar",
    crop_title_ru: "Интенсивные сады",
    crop_title_en: "Intensive Orchards",
    icon_emoji: "🍎",
    category: "meva",
    summary_uz: "Past bo‘yli pakana payvandtagli zamonaviy bog‘lar. Tomchilatib sug‘orish, shox-shabbalarni shakllantirish, mevani me’yorlash va zararkunandalardan himoya eksport sifatini ta’minlaydi.",
    summary_ru: "Современные сады на карликовых подвоях. Капельный полив, шпалерная формировка кроны, нормирование завязи и защита от плодожорки — залог экспортного качества.",
    summary_en: "Modern high-density orchards on dwarf rootstocks. Trellis training, drip fertigation, fruit thinning, and moth defense ensure export-grade fruit.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Kurtak yozish va gullash",
        stage_name_ru: "Распускание почек и цветение",
        stage_name_en: "Bud Break & Blossom",
        days_min: 1,
        days_max: 30,
        days_range: "1 - 30 kun",
        tasks_uz: [
          "Qishki sanitariya butashini yakunlash va shoxlarni simga bog‘lash",
          "Kurtak bo‘rtganda 3% li Bordo suyuqligi bilan purkash",
          "Gullash oldidan bor (B) bilan bargdan oziqlantirish (changlanishni yaxshilash)"
        ],
        tasks_ru: [
          "Завершение обрезки и подвязка к шпалере",
          "Ранневесеннее опрыскивание 3% бордоской жидкостью",
          "Листовая подкормка бором (B) перед цветением"
        ],
        tasks_en: [
          "Complete dormant pruning and tie main limbs to trellis",
          "Dormant copper / 3% Bordeaux spray at bud swell",
          "Pre-bloom foliar boron (B) spray to enhance fruit set"
        ],
        irrigation_notes_uz: "Bahorgi tabiiy namlik saqlanadi. Gullash cho‘qqisida ortiqcha sug‘orilmaydi (gullar to‘kilib ketmasligi uchun).",
        irrigation_notes_ru: "Умеренная влажность. Избегать избыточного полива во время цветения.",
        irrigation_notes_en: "Maintain moderate soil moisture; avoid flooding during peak blossom.",
        fertilization_notes_uz: "Kurtak ochilishida tomchilatib azot va organik gumatlar beriladi.",
        fertilization_notes_ru: "Капельное внесение азота и гуматов на старте вегетации.",
        fertilization_notes_en: "Drip fertigation with nitrogen starter and humic acids.",
        pest_notes_uz: "Kurtak biti, gulxo‘r va parshaga qarshi profilaktik ishlov.",
        pest_notes_ru: "Защита от цветоеда, тли и парши.",
        pest_notes_en: "Preventive spray against apple blossom weevil, aphids, and scab.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Tuguncha kattalashishi va Meva me’yorlash",
        stage_name_ru: "Рост завязи и нормирование",
        stage_name_en: "Fruitlet Growth & Thinning",
        days_min: 30,
        days_max: 80,
        days_range: "30 - 80 kun",
        tasks_uz: [
          "Meva tugunchalarini me’yorlash: har bitta to‘pda 1-2 ta eng yirik mevani qoldirish",
          "Yashil butash (ortiqcha vertikal bachki novdalarni qirqish)",
          "Bargdan kalsiy (Ca) purkash (achchiq dog‘lanish kasalligiga qarshi)"
        ],
        tasks_ru: [
          "Нормирование завязей: удаление лишних плодов для крупного калибра",
          "Зеленая обрезка жировых побегов",
          "Листовые обработки кальцием (Ca) против горькой ямчатости"
        ],
        tasks_en: [
          "Fruitlet thinning: leave 1-2 central fruits per cluster for size",
          "Summer pruning of vertical water sprouts",
          "Foliar calcium (Ca) applications to prevent bitter pit"
        ],
        irrigation_notes_uz: "Doimiy tomchilatib sug‘orish (kuniga yoki har 2 kunda tuproq namligi 75% saqlanadi).",
        irrigation_notes_ru: "Регулярный капельный полив (поддержание влажности 75%).",
        irrigation_notes_en: "Regular drip fertigation cycles maintaining 75% root zone moisture.",
        fertilization_notes_uz: "NPK 20-20-20 + Kalsiy xelati bilan har 7-10 kunda fertitatsiya.",
        fertilization_notes_ru: "Фертигация NPK 20-20-20 + хелат кальция каждые 7-10 дней.",
        fertilization_notes_en: "Weekly balanced NPK 20-20-20 fertigation + chelated calcium.",
        pest_notes_uz: "Olma mevaxo‘ri (plodojorka) va un-shudringga qarshi feromon tutqichlar va tizimli dorilar.",
        pest_notes_ru: "Защита от яблонной плодожорки (феромонный контроль) и мучнистой росы.",
        pest_notes_en: "Deploy codling moth pheromone traps and spray against powdery mildew.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Meva pishishi va rang kirishi",
        stage_name_ru: "Налив и окрашивание плодов",
        stage_name_en: "Fruit Ripening & Blushing",
        days_min: 80,
        days_max: 140,
        days_range: "80 - 140 kun",
        tasks_uz: [
          "Meva atrofidagi ortiqcha barglarni siyraklatish (quyoshda bir tekis qizarishi uchun)",
          "Kaliy bilan oziqlantirish (shakarni oshirish, azotni butunlay to‘xtatish)",
          "Qushlar va do‘ldan himoya to‘rlarini nazorat qilish"
        ],
        tasks_ru: [
          "Прореживание листьев вокруг плодов для красивого румянца",
          "Калийная подкормка (исключение азота)",
          "Проверка защитных противоградовых сеток"
        ],
        tasks_en: [
          "Thin leaf canopy around fruit clusters for sun blushing",
          "Potassium sulfate fertigation (eliminate all nitrogen)",
          "Inspect hail and bird protection netting"
        ],
        irrigation_notes_uz: "Bir maromli sug‘orish. Keskin qurg‘oqchilik va suv ko‘payishi mevalarni yorib yuboradi.",
        irrigation_notes_ru: "Строго равномерный капельный полив без перепадов влажности.",
        irrigation_notes_en: "Consistent drip pulses; moisture shocks cause skin splitting.",
        fertilization_notes_uz: "Kaliy sulfat (80-100 kg/ga) mevaning saqlanuvchanligi va shirinligini 20% ga oshiradi.",
        fertilization_notes_ru: "Сульфат калия (80-100 кг/га) повышает сахаристость и лежкость.",
        fertilization_notes_en: "Potassium sulfate (80-100 kg/ha) increases sugar brix and shelf life.",
        pest_notes_uz: "Kutilish muddati qisqa bo‘lgan biopreparatlardan foydalanish.",
        pest_notes_ru: "Применение биопрепаратов с коротким сроком ожидания.",
        pest_notes_en: "Low-toxicity bio-rational sprays with short pre-harvest intervals.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Hosil terimi va Sovutgichga joylash",
        stage_name_ru: "Сбор урожая и закладка на хранение",
        stage_name_en: "Harvest & Cold Storage",
        days_min: 140,
        days_max: 220,
        days_range: "140+ kun",
        tasks_uz: [
          "Bandi bilan ehtiyotkorlik bilan qo‘lda terish (ezmasdan qutilarga joylash)",
          "Hosilni +1°C...+2°C sovutgich kameralariga joylash",
          "Daraxtlarga qishki yaxob suvi va fosfor-kaliyli o‘g‘it berish"
        ],
        tasks_ru: [
          "Аккуратный ручной сбор с плодоножкой в ящики",
          "Закладка в холодильные камеры с РГС (+1...+2°C)",
          "Влагозарядковый полив и осеннее внесение фосфора-калия"
        ],
        tasks_en: [
          "Hand-pick with stem intact without bruising into padded crates",
          "Store in controlled atmosphere cold storage (+1°C...+2°C)",
          "Post-harvest winter recharge watering and basal fertilizer"
        ],
        irrigation_notes_uz: "Terimdan 7-10 kun oldin sug‘orish to‘xtatiladi. Terimdan so‘ng yaxob suvi beriladi.",
        irrigation_notes_ru: "Прекращение полива за 7-10 дней до сбора. Влагозарядка после сбора.",
        irrigation_notes_en: "Stop drip 7-10 days before picking. Apply winter recharge soak after harvest.",
        fertilization_notes_uz: "Kuzda qator oralarga organik chirindi va fosfor ko‘miladi.",
        fertilization_notes_ru: "Осенняя заделка органики и фосфора в междурядья.",
        fertilization_notes_en: "Autumn organic manure and phosphorus trenching.",
        pest_notes_uz: "To‘kilgan mevalarni yo‘qotish, daraxt tanasini oqlash.",
        pest_notes_ru: "Сбор падалицы и побелка штамбов известью с медным купоросом.",
        pest_notes_en: "Clear fallen culls, whitewash trunks with lime and copper.",
      }
    ]
  },

  // 5. TOMATO / SABZAVOTLAR
  {
    id: 'guide_tomato',
    crop_name: 'tomato',
    crop_title_uz: "Pomidor va Sabzavotlar",
    crop_title_ru: "Томаты и овощи",
    crop_title_en: "Tomatoes & Vegetables",
    icon_emoji: "🍅",
    category: "sabzavot",
    summary_uz: "Ochiq maydon va issiqxona uchun serhosil sabzavot ekini. Fitoftora profilaktikasi, tomchilatib sug‘orish va muntazam kaliy-kalsiy oziqlantirish talab etiladi.",
    summary_ru: "Высокодоходная овощная культура. Требует профилактики фитофтороза, капельного полива и регулярного калийно-кальциевого питания.",
    summary_en: "High-value open field & greenhouse vegetable. Requires blight prevention, drip irrigation, and balanced potassium-calcium fertigation.",
    stages: [
      {
        growth_stage: "germination",
        stage_name_uz: "Ko‘chat o‘tqazish va ildiz otish",
        stage_name_ru: "Высадка рассады и укоренение",
        stage_name_en: "Transplanting & Rooting",
        days_min: 1,
        days_max: 20,
        days_range: "1 - 20 kun",
        tasks_uz: [
          "Ko‘chatlarni nam tuproqqa ehtiyotkorlik bilan o‘tqazish",
          "Ildizlantiruvchi fosforli o‘g‘itlar va kalsiy nitrat bilan sug‘orish",
          "Tuta absoluta va tripsga qarshi feromon hamda yopishqoq tutqichlar o‘rnatish"
        ],
        tasks_ru: [
          "Бережная высадка рассады в прогретую почву",
          "Полив укоренителями с высоким фосфором и кальцием",
          "Установка клеевых и феромонных ловушек от моли и трипса"
        ],
        tasks_en: [
          "Transplant healthy seedlings into warm moist beds",
          "Apply rooting starter high in phosphorus and calcium",
          "Install yellow sticky traps and Tuta absoluta pheromone traps"
        ],
        irrigation_notes_uz: "Ko‘chat o‘tqazilgach darhol ildiz suvi beriladi. Tomchilatib sug‘orishda tuproq namligi 75-80% saqlanadi.",
        irrigation_notes_ru: "Обильный полив при посадке. Поддержание влажности 75-80% капельным путем.",
        irrigation_notes_en: "Immediate root zone soak. Maintain 75-80% field moisture with steady drip pulses.",
        fertilization_notes_uz: "Ildiz stimulyatorlari (NPK 13-40-13) va kalsiy nitrat bilan ildizlantirish.",
        fertilization_notes_ru: "Фосфорные стартовые удобрения (13-40-13) и кальциевая селитра.",
        fertilization_notes_en: "High-phosphorus rooting starter and calcium nitrate.",
        pest_notes_uz: "Qora oyoq va ildiz chirish kasalliklariga qarshi biologik fungitsidlar.",
        pest_notes_ru: "Биофунгициды против черной ножки и корневых гнилей.",
        pest_notes_en: "Bio-fungicides against damping-off and root pathogens.",
      },
      {
        growth_stage: "vegetative",
        stage_name_uz: "Poya bog‘lash va novda chilpish",
        stage_name_ru: "Подвязка и пасынкование",
        stage_name_en: "Staking & Sucker Pruning",
        days_min: 20,
        days_max: 45,
        days_range: "20 - 45 kun",
        tasks_uz: [
          "Yon shoxlar (pasyunoklar) 5 sm dan oshmasdan chilpib tashlash",
          "Poyalarni maxsus ipga yoki tayanchga boylash",
          "Teng mutanosib NPK 20-20-20 va magniy bilan haftalik fertitatsiya"
        ],
        tasks_ru: [
          "Удаление пасынков до 5 см и формирование в 1-2 стебля",
          "Подвязка растений к шпалере",
          "Еженедельная фертигация NPK 20-20-20 + магний"
        ],
        tasks_en: [
          "Prune side suckers before exceeding 5 cm length",
          "Twine main stems to trellis wires or stakes",
          "Weekly balanced NPK 20-20-20 fertigation + magnesium"
        ],
        irrigation_notes_uz: "Har 4-5 kunda yoki har kuni 2 soat tomchilatib beriladi. Suv barglarga purkalmasligi shart.",
        irrigation_notes_ru: "Капельный полив каждые 4-5 дней под корень. Не мочить листья.",
        irrigation_notes_en: "Regular drip at root level. Keep foliage completely dry.",
        fertilization_notes_uz: "NPK 20-20-20 va magniy sulfat eritmasi beriladi.",
        fertilization_notes_ru: "Сбалансированное питание NPK 20-20-20 с микроэлементами.",
        fertilization_notes_en: "Balanced NPK 20-20-20 with trace nutrients.",
        pest_notes_uz: "Oq qanot, shira va tripsga qarshi sariq yopishqoq tutqichlar.",
        pest_notes_ru: "Желтые клеевые ловушки от белокрылки и биоинсектициды.",
        pest_notes_en: "Yellow sticky cards for whiteflies and leafminers.",
      },
      {
        growth_stage: "flowering",
        stage_name_uz: "Gullash va meva quyilishi",
        stage_name_ru: "Цветение и завязывание плодов",
        stage_name_en: "Blossom & Fruit Setting",
        days_min: 45,
        days_max: 75,
        days_range: "45 - 75 kun",
        tasks_uz: [
          "Changlanishni yaxshilash (issiqxonada shamollatish yoki gumbul arilar)",
          "Kalsiy xelati purkash (uchki chirish kasalligining oldini olish)",
          "Fitoftorozga qarshi profilaktik mis preparatlari bilan purkash"
        ],
        tasks_ru: [
          "Улучшение опыления (проветривание или шмели)",
          "Внесение хелата кальция против вершинной гнили",
          "Профилактика фитофторы медьсодержащими фунгицидами"
        ],
        tasks_en: [
          "Optimize airflow and vibration for pollination",
          "Chelated calcium spray to stop blossom-end rot",
          "Preventive copper fungicide against late blight"
        ],
        irrigation_notes_uz: "Sug‘orish hajmi oshiriladi. Qurg‘oqchilik uchki chirishga olib keladi.",
        irrigation_notes_ru: "Увеличение полива. Дефицит влаги вызывает вершинную гниль.",
        irrigation_notes_en: "Increase drip volume as fruit clusters expand.",
        fertilization_notes_uz: "Kaliyga boy NPK (15-5-30) + Kalsiy xelati muntazam beriladi.",
        fertilization_notes_ru: "Калийные формулы (15-5-30) + хелат кальция.",
        fertilization_notes_en: "High-potassium formula (15-5-30) + chelated calcium.",
        pest_notes_uz: "Fitoftora va pomidor kuyasiga qarshi doimiy nazorat.",
        pest_notes_ru: "Защита от фитофторы и томатной моли Tuta absoluta.",
        pest_notes_en: "Scout and spray against early/late blight and Tuta absoluta.",
      },
      {
        growth_stage: "maturation_harvest",
        stage_name_uz: "Meva pishishi va muntazam terim",
        stage_name_ru: "Созревание и сбор урожая",
        stage_name_en: "Ripening & Continuous Harvest",
        days_min: 75,
        days_max: 180,
        days_range: "75+ kun",
        tasks_uz: [
          "Har 2-3 kunda qizargan pomidorlarni bandi bilan uzish",
          "Pastki sarg‘aygan barglarni qirqib havo aylanishini yaxshilash",
          "Hosilni ventilyatsiyalangan yashiklarda 12-15°C da saqlash"
        ],
        tasks_ru: [
          "Регулярный сбор плодов каждые 2-3 дня с плодоножкой",
          "Удаление нижних старых листьев для проветривания",
          "Хранение в вентилируемых ящиках при 12-15°C"
        ],
        tasks_en: [
          "Pick ripe tomatoes every 2-3 days with calyx intact",
          "Prune lower aged leaves for canopy ventilation",
          "Store in ventilated crates at 12-15°C"
        ],
        irrigation_notes_uz: "Yengil va muntazam tomchilatish. Pomidor yorilmasligi uchun birdan ko‘p suv berilmaydi.",
        irrigation_notes_ru: "Умеренный регулярный полив без резких скачков.",
        irrigation_notes_en: "Even drip pulses to prevent fruit skin cracking.",
        fertilization_notes_uz: "Kaliy sulfat mevani shirin va zich qiladi.",
        fertilization_notes_ru: "Сульфат калия для сахаристости и плотности.",
        fertilization_notes_en: "Potassium sulfate for sweetness and firmness.",
        pest_notes_uz: "Kutilish muddati 1-3 kunlik xavfsiz biopreparatlardan foydalanish.",
        pest_notes_ru: "Биопрепараты со сроком ожидания 1-3 дня.",
        pest_notes_en: "Bio-rational products with 1-3 day pre-harvest interval.",
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
