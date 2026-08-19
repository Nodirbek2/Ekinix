import { GovernmentProgram, FieldRecord } from './supabase';

export type { GovernmentProgram };

export const GOVERNMENT_PROGRAMS_DATA: GovernmentProgram[] = [
  {
    id: 'drip-irrigation-subsidy',
    title_uz: "Suv tejovchi (tomchilatib/yomg'irlatib) sug'orish texnologiyalari subsidiyasi",
    title_ru: "Субсидия на внедрение водосберегающих (капельных/дождевальных) технологий",
    title_en: "Water-Saving & Drip Irrigation Technology Government Subsidy",
    organization_uz: "O'zbekiston Respublikasi Suv xo'jaligi vazirligi & Qishloq xo'jaligi jamg'armasi",
    organization_ru: "Министерство водного хозяйства РУз и Фонд развития сельского хозяйства",
    organization_en: "Ministry of Water Resources & Agricultural Development Fund",
    description_uz: "Paxta, g'alla, sabzavot va bog'dorchilik maydonlarida tomchilatib yoki diskret sug'orish uskunalarini o'rnatgan fermerlarga har bir gektar uchun 8 000 000 so'mgacha qaytarilmaydigan to'g'ridan-to'g'ri subsidiya ajratiladi va 14% stavkali 5 yillik kredit beriladi.",
    description_ru: "Фермерам, внедрившим системы капельного или спринклерного орошения, выделяется безвозмездная прямая субсидия до 8 000 000 сум за гектар, а также льготный кредит под 14% годовых на 5 лет.",
    description_en: "Non-repayable direct subsidy of up to 8,000,000 UZS/ha plus 14% 5-year preferential loan for farmers installing drip, sprinkler, or pulse irrigation systems.",
    max_subsidy_uz: "8 000 000 so'm / ga",
    max_subsidy_ru: "до 8 000 000 сум / га",
    max_subsidy_en: "Up to 8,000,000 UZS / ha",
    eligibility_crop_types: ['cotton', 'wheat', 'apple', 'grape', 'pomegranate', 'tomato', 'vegetable', 'fruit'],
    eligibility_regions: ['all'],
    requires_drip_irrigation: true,
    required_documents_uz: [
      "Yer uchastkasiga ijara shartnomasi yoki egalik hujjati",
      "Suv tejovchi uskuna pudratchisi bilan tuzilgan shartnoma va loyiha-smeta hujjati",
      "Qurib bitkazilganlik va foydalanishga topshirilganlik to'g'risida tuman komissiyasi dalolatnomasi",
      "Fermer xo'jaligining bank hisob rekvizitlari"
    ],
    required_documents_ru: [
      "Договор аренды или правоустанавливающий документ на землю",
      "Договор с сертифицированным подрядчиком и проектно-сметная документация",
      "Акт районной комиссии о вводе системы орошения в эксплуатацию",
      "Банковские реквизиты фермерского хозяйства"
    ],
    required_documents_en: [
      "Land lease agreement or ownership certificate",
      "Contract with certified irrigation equipment contractor and design estimate",
      "District commission commissioning acceptance report",
      "Farmer business bank account details"
    ],
    application_url: "https://agro.uz",
    badge_text_uz: "Eng ommabop subsidiya",
    badge_text_ru: "Самая популярная субсидия",
    badge_text_en: "Most popular subsidy"
  },
  {
    id: 'orchard-vineyard-grant',
    title_uz: "Intensiv bog'dorchilik va tokzorlar barpo etish davlat granti",
    title_ru: "Гранты Агентства развития садоводства и виноградарства на интенсивные сады",
    title_en: "Intensive Orchard and Vineyard Development State Grant",
    organization_uz: "Bog'dorchilik va issiqxona xo'jaligini rivojlantirish agentligi",
    organization_ru: "Агентство по развитию садоводства и тепличного хозяйства",
    organization_en: "Agency for the Development of Horticulture & Greenhouses",
    description_uz: "Yangi intensiv olma, shaftoli, anor, gilos bog'lari va zamonaviy tokzorlar barpo etishda sifatli payvandlangan ko'chatlar va shpaler konstruksiyalari xarajatlarining 50% gacha qismi davlat byudjeti hisobidan qoplab beriladi.",
    description_ru: "Компенсация до 50% затрат на приобретение сертифицированных саженцев интенсивных сортов яблони, граната, винограда и установку шпалерных конструкций.",
    description_en: "Up to 50% government reimbursement for certified dwarf rootstocks, saplings (apple, pomegranate, grapes) and trellis installation costs.",
    max_subsidy_uz: "15 000 000 so'm / ga gacha",
    max_subsidy_ru: "до 15 000 000 сум / га",
    max_subsidy_en: "Up to 15,000,000 UZS / ha",
    eligibility_crop_types: ['apple', 'grape', 'pomegranate', 'fruit'],
    eligibility_regions: ['all'],
    requires_drip_irrigation: true,
    required_documents_uz: [
      "Bog' yoki tokzor loyihasi pasporti",
      "Ko'chat sotuvchi sertifikatlangan pitomnik bilan shartnoma",
      "Karantin va fitosanitariya xulosasi",
      "Agrotexnik xarajatlar smetasi"
    ],
    required_documents_ru: [
      "Паспорт проекта сада или виноградника",
      "Договор с сертифицированным питомником на поставку саженцев",
      "Фитосанитарный сертификат",
      "Смета агротехнических затрат"
    ],
    required_documents_en: [
      "Orchard/vineyard project passport",
      "Contract with certified nursery for saplings",
      "Phytosanitary inspection certificate",
      "Agrotechnical expenditure estimate"
    ],
    application_url: "https://agro.uz",
    badge_text_uz: "Bog'dorchilik uchun",
    badge_text_ru: "Для садоводов",
    badge_text_en: "For Orchards"
  },
  {
    id: 'cotton-grain-fuel-subsidy',
    title_uz: "Paxta va g'alla yetishtirishda yonilg'i-moylash va o'g'it xarajatlari kompensatsiyasi",
    title_ru: "Компенсация расходов на ГСМ и минеральные удобрения для хлопка и зерна",
    title_en: "Fuel & Mineral Fertilizer Price Compensation for Cotton & Wheat",
    organization_uz: "Qishloq xo'jaligini davlat tomonidan qo'llab-quvvatlash jamg'armasi",
    organization_ru: "Фонд государственной поддержки сельского хозяйства",
    organization_en: "State Agricultural Support Fund",
    description_uz: "Paxta va bug'doy yetishtiruvchi fermerlarga dizel yonilg'isi va azotli-fosforli mineral o'g'itlar bozor narxi oshganida, xarajatlar farqining 30-40% qismi davlat subsidiyasi sifatida to'lab beriladi.",
    description_ru: "Фермерам, выращивающим хлопок и пшеницу, компенсируется 30-40% удорожания дизельного топлива и минеральных азотно-фосфорных удобрений.",
    description_en: "30-40% cost difference compensation on diesel fuel and nitrogen/phosphorus fertilizers for grain and cotton growers.",
    max_subsidy_uz: "2 500 000 so'm / ga",
    max_subsidy_ru: "до 2 500 000 сум / га",
    max_subsidy_en: "Up to 2,500,000 UZS / ha",
    eligibility_crop_types: ['cotton', 'wheat'],
    eligibility_regions: ['all'],
    requires_drip_irrigation: false,
    required_documents_uz: [
      "Klaster yoki davlat xaridi bilan tuzilgan fyuchers shartnomasi",
      "Yonilg'i va mineral o'g'it sotib olinganligi to'g'risida elektron hisobvaraq-faktura (EHF)",
      "Tuman qishloq xo'jaligi bo'limi tasdiqnomasi"
    ],
    required_documents_ru: [
      "Фьючерсный контракт с агрокластером или заготовителем",
      "Электронные счета-фактуры на закупку ГСМ и удобрений",
      "Подтверждение районного отдела сельского хозяйства"
    ],
    required_documents_en: [
      "Futures contract with agricultural cluster",
      "Electronic invoices for fuel and fertilizer purchases",
      "District agricultural department confirmation"
    ],
    application_url: "https://agro.uz",
    badge_text_uz: "Paxta va g'alla",
    badge_text_ru: "Хлопок и зерно",
    badge_text_en: "Cotton & Grain"
  },
  {
    id: 'agrobank-tech-leasing',
    title_uz: "Agrobank orqali zamonaviy qishloq xo'jaligi texnikalari uchun 10% li imtiyozli lizing",
    title_ru: "Льготный агролизинг сельхозтехники через Агробанк (10% годовых, до 7 лет)",
    title_en: "Agrobank Preferential Equipment Leasing (10% APR, up to 7 Years)",
    organization_uz: "ATB «Agrobank» & «O'zagrolizing» AJ",
    organization_ru: "АКБ «Агробанк» и АО «Узагролизинг»",
    organization_en: "Agrobank JSC & UzAgroLeasing",
    description_uz: "Traktorlar, seyalkalar, purkagichlar, kombaynlar va kultivatorlar sotib olish uchun 15% boshlang'ich to'lov, 1 yillik imtiyozli davr va 10% yillik stavka bilan 7 yilgacha lizing taqdim etiladi.",
    description_ru: "Лизинг тракторов, сеялок, опрыскивателей и комбайнов с первоначальным взносом 15%, льготным периодом 1 год и ставкой 10% годовых на срок до 7 лет.",
    description_en: "15% down payment, 1-year grace period, 10% APR for up to 7 years on modern tractors, seeders, sprayers, and combine harvesters.",
    max_subsidy_uz: "500 000 000 so'mgacha lizing",
    max_subsidy_ru: "до 500 000 000 сум лизинг",
    max_subsidy_en: "Up to 500M UZS leasing limit",
    eligibility_crop_types: ['cotton', 'wheat', 'apple', 'grape', 'pomegranate', 'tomato', 'vegetable', 'fruit'],
    eligibility_regions: ['all'],
    requires_drip_irrigation: false,
    required_documents_uz: [
      "Fermer xo'jaligi guvohnomasi va nizomi",
      "Oxirgi 1 yillik moliyaviy hisobot (1 va 2-shakl)",
      "Texnika yetkazib beruvchi dilerning tijorat taklifi"
    ],
    required_documents_ru: [
      "Свидетельство и устав фермерского хозяйства",
      "Финансовая отчётность за последний год (Формы 1 и 2)",
      "Коммерческое предложение поставщика техники"
    ],
    required_documents_en: [
      "Farmer enterprise registration certificate and charter",
      "Annual financial statements (Forms 1 and 2)",
      "Equipment dealer commercial proposal"
    ],
    application_url: "https://agrobank.uz",
    badge_text_uz: "Texnika va Lizing",
    badge_text_ru: "Техника и лизинг",
    badge_text_en: "Machinery & Leasing"
  },
  {
    id: 'globalgap-organic-cert',
    title_uz: "GlobalG.A.P va Organic xalqaro sertifikatlash xarajatlarini 100% qoplash",
    title_ru: "100% покрытие затрат на международную сертификацию GlobalG.A.P и Organic",
    title_en: "100% Export Certification Grant for GlobalG.A.P & Organic Compliance",
    organization_uz: "Eksportni rag'batlantirish agentligi (EPA)",
    organization_ru: "Агентство продвижения экспорта (EPA)",
    organization_en: "Export Promotion Agency (EPA)",
    description_uz: "Meva va sabzavot eksport qiluvchi fermerlarning xalqaro GlobalG.A.P, Organic, ISO 22000 sertifikatlarini olish va xalqaro auditdan o'tish bilan bog'liq barcha xarajatlari davlat tomonidan 100% to'liq qoplab beriladi.",
    description_ru: "Полное 100% возмещение затрат фермеров-экспортёров на прохождение аудита и получение международных сертификатов качества GlobalG.A.P, Organic и ISO 22000.",
    description_en: "Full 100% reimbursement of international audit and certification fees for agricultural producers obtaining GlobalG.A.P, Organic, or ISO 22000 export certifications.",
    max_subsidy_uz: "Xarajatning 100% qismi",
    max_subsidy_ru: "100% компенсация расходов",
    max_subsidy_en: "100% fee reimbursement",
    eligibility_crop_types: ['apple', 'grape', 'pomegranate', 'tomato', 'vegetable', 'fruit'],
    eligibility_regions: ['all'],
    requires_drip_irrigation: false,
    required_documents_uz: [
      "Xalqaro sertifikatlash organi bilan tuzilgan shartnoma va to'lov kvitansiyasi",
      "Olingan xalqaro sertifikat nusxasi",
      "Eksport shartnomasi yoki eksport niyati to'g'risida ma'lumotnoma"
    ],
    required_documents_ru: [
      "Договор с международным органом сертификации и квитанция об оплате",
      "Копия полученного международного сертификата",
      "Экспортный контракт или письмо о намерениях"
    ],
    required_documents_en: [
      "Contract with international accredited certification body & receipt",
      "Copy of issued international certificate",
      "Export contract or statement of export intent"
    ],
    application_url: "https://epauzb.gov.uz",
    badge_text_uz: "Eksportchilar uchun",
    badge_text_ru: "Для экспортёров",
    badge_text_en: "For Exporters"
  }
];

export interface ProgramMatchResult {
  program: GovernmentProgram;
  matchScore: number; // 0 to 100
  status: 'eligible' | 'potential' | 'needs_action';
  matchingFieldsCount: number;
  totalEstimatedSubsidyUzs: number;
  matchReasonsUz: string[];
  matchReasonsRu: string[];
  matchReasonsEn: string[];
}

export function matchFarmerPrograms(fields: FieldRecord[] = []): ProgramMatchResult[] {
  return GOVERNMENT_PROGRAMS_DATA.map((program) => {
    let matchingFields = 0;
    let totalEligibleArea = 0;
    const reasonsUz: string[] = [];
    const reasonsRu: string[] = [];
    const reasonsEn: string[] = [];

    if (fields.length === 0) {
      // Demo / general match
      matchingFields = 1;
      totalEligibleArea = 5.0;
      reasonsUz.push("O'zbekiston hududidagi barcha faol qishloq xo'jaligi maydonlari uchun ochiq");
      reasonsRu.push("Доступно для всех действующих сельскохозяйственных угодий Узбекистана");
      reasonsEn.push("Open to all registered agricultural land in Uzbekistan");
    } else {
      fields.forEach((f) => {
        const cropMatch = program.eligibility_crop_types.includes('all') ||
          program.eligibility_crop_types.includes(f.crop_type.toLowerCase()) ||
          (program.eligibility_crop_types.includes('fruit') && ['apple', 'grape', 'pomegranate'].includes(f.crop_type.toLowerCase())) ||
          (program.eligibility_crop_types.includes('vegetable') && ['tomato', 'onion', 'cucumber', 'potato'].includes(f.crop_type.toLowerCase()));

        if (cropMatch) {
          matchingFields++;
          totalEligibleArea += Number(f.area_hectares) || 1.0;
        }
      });

      if (matchingFields > 0) {
        reasonsUz.push(`Sizning ${matchingFields} ta maydoningiz (${totalEligibleArea.toFixed(1)} ga) ekin turi bo'yicha to'liq mos keladi`);
        reasonsRu.push(`Ваши ${matchingFields} полей (${totalEligibleArea.toFixed(1)} га) полностью подходят по типу культуры`);
        reasonsEn.push(`Your ${matchingFields} field(s) (${totalEligibleArea.toFixed(1)} ha) match the crop qualification criteria`);
      } else {
        reasonsUz.push("Ushbu dastur talablariga mos yangi ekin maydonlarini qo'shish orqali foydalanishingiz mumkin");
        reasonsRu.push("Вы сможете подать заявку, добавив поля с соответствующими культурами");
        reasonsEn.push("You can qualify by registering fields with eligible crop varieties");
      }
    }

    let matchScore = 85;
    let status: ProgramMatchResult['status'] = 'eligible';
    let totalEstimatedSubsidyUzs = 0;

    if (program.id === 'drip-irrigation-subsidy') {
      totalEstimatedSubsidyUzs = totalEligibleArea * 8000000;
      matchScore = matchingFields > 0 ? 100 : 75;
      status = matchingFields > 0 ? 'eligible' : 'potential';
    } else if (program.id === 'orchard-vineyard-grant') {
      totalEstimatedSubsidyUzs = totalEligibleArea * 15000000;
      matchScore = matchingFields > 0 ? 95 : 60;
      status = matchingFields > 0 ? 'eligible' : 'potential';
    } else if (program.id === 'cotton-grain-fuel-subsidy') {
      totalEstimatedSubsidyUzs = totalEligibleArea * 2500000;
      matchScore = matchingFields > 0 ? 100 : 70;
      status = matchingFields > 0 ? 'eligible' : 'potential';
    } else {
      totalEstimatedSubsidyUzs = totalEligibleArea * 5000000;
      matchScore = 90;
      status = 'eligible';
    }

    return {
      program,
      matchScore,
      status,
      matchingFieldsCount: matchingFields,
      totalEstimatedSubsidyUzs,
      matchReasonsUz: reasonsUz,
      matchReasonsRu: reasonsRu,
      matchReasonsEn: reasonsEn,
    };
  });
}
