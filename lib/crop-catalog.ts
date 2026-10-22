// Reference coefficients: FAO-56, chapter 6, table 12. Not locally calibrated.
// Phase labels describe field observations; they are not a BBCH prediction model.
export type CropLanguage = "uz" | "ru" | "en";
export type CropPhase = "initial" | "development" | "mid" | "late";
export type LocalText = Record<CropLanguage, string>;
export type Range = [number, number];
const text = (uz: string, ru: string, en: string): LocalText => ({
  uz,
  ru,
  en,
});
export const agronomySources = [
  {
    name: "FAO-56 · Kc, bosqichlar va ETc",
    url: "https://www.fao.org/4/x0490e/x0490e0b.htm",
  },
  {
    name: "O‘zbekiston Qishloq xo‘jaligi vazirligi · g‘o‘za parvarishi",
    url: "https://gov.uz/oz/agro/news/view/15419",
  },
  {
    name: "USDA ARS · O‘zbekistonda paxta sug‘orish tadqiqoti",
    url: "https://www.ars.usda.gov/research/publications/publication/?seqNo115=376082",
  },
  {
    name: "FAO · suv sifati va sho‘rlanish",
    url: "https://www.fao.org/4/t0234e/t0234e00.htm",
  },
];
export interface CropProfile {
  id: string;
  uz: string;
  ru: string;
  en: string;
  days: number[];
  kc: { initial: Range; mid: Range; end: Range } | null;
  phases: Record<CropPhase, LocalText>;
  critical: LocalText;
  local: LocalText;
  mode: "annual" | "winter" | "orchard" | "cutting" | "paddy";
}
const phases = (a: LocalText, b: LocalText, c: LocalText, d: LocalText) => ({
  initial: a,
  development: b,
  mid: c,
  late: d,
});
const emergence = text(
  "Unib chiqish va ildiz otish",
  "Всходы и укоренение",
  "Emergence and establishment",
);
const leaf = text(
  "Barg va poya o‘sishi",
  "Рост листьев и стеблей",
  "Leaf and stem growth",
);
const flower = text(
  "Gullash va meva tugish",
  "Цветение и завязь",
  "Flowering and fruit set",
);
const filling = text(
  "Gullash va don to‘lishi",
  "Цветение и налив зерна",
  "Flowering and grain filling",
);
const ripening = text(
  "Pishish va yig‘imga tayyorgarlik",
  "Созревание и подготовка к уборке",
  "Ripening and harvest preparation",
);
const localAnnual = text(
  "Nav, bahorgi yoki takroriy ekish va tuproq holatini tekshiring. Viloyat nomi sug‘orish me’yorini o‘zi belgilamaydi.",
  "Учитывайте сорт, весенний или повторный посев и почву. Область сама по себе не задаёт норму полива.",
  "Check variety, spring or second-crop sowing and soil. A region name alone does not set the irrigation dose.",
);
const criticalFruit = text(
  "Gullash va hosil shakllanishida dala holatini tez-tez tekshiring; suvni keskin ko‘paytirishdan saqlaning.",
  "Чаще осматривайте поле при цветении и формировании урожая; избегайте резких изменений полива.",
  "Inspect more often during flowering and yield formation; avoid abrupt irrigation changes.",
);
function crop(
  id: string,
  names: LocalText,
  coeff: [number | Range, number | Range, number | Range] | null,
  p: Record<CropPhase, LocalText>,
  critical = criticalFruit,
  mode: CropProfile["mode"] = "annual",
  local = localAnnual,
  days: number[] = [],
): CropProfile {
  const range = (n: number | Range): Range =>
    typeof n === "number" ? [n, n] : n;
  return {
    id,
    ...names,
    kc: coeff
      ? { initial: range(coeff[0]), mid: range(coeff[1]), end: range(coeff[2]) }
      : null,
    phases: p,
    critical,
    mode,
    local,
    days,
  };
}
const cereal = phases(
  emergence,
  text(
    "Tuplanish va naychalash",
    "Кущение и выход в трубку",
    "Tillering and stem elongation",
  ),
  filling,
  ripening,
);
const pulse = phases(
  emergence,
  leaf,
  text(
    "Gullash va dukkak to‘lishi",
    "Цветение и налив бобов",
    "Flowering and pod filling",
  ),
  ripening,
);
const vine = phases(
  emergence,
  text(
    "Palak o‘sishi va gullash boshlanishi",
    "Рост плетей и начало цветения",
    "Vine growth and first flowering",
  ),
  text(
    "Meva tugish va yiriklashish",
    "Завязывание и рост плодов",
    "Fruit set and enlargement",
  ),
  ripening,
);
const orchard = phases(
  text(
    "Kurtak yozilishi va gullash",
    "Распускание почек и цветение",
    "Budbreak and flowering",
  ),
  text(
    "Meva tugish va barg qoplami",
    "Завязь и развитие кроны",
    "Fruit set and canopy development",
  ),
  text("Meva yiriklashishi", "Рост плодов", "Fruit enlargement"),
  text(
    "Pishish va mavsum yakuni",
    "Созревание и конец сезона",
    "Ripening and end of season",
  ),
);
const winterLocal = text(
  "Kuzgi ekinda qishki tinim bor. Ekish sanasidan hisoblangan kunlar bahorgi fazani aniqlamaydi; haqiqiy fazani tasdiqlang.",
  "Озимые проходят зимний покой. Дни после посева не определяют весеннюю фазу; подтвердите её на поле.",
  "Winter crops have dormancy. Days since sowing do not determine the spring phase; confirm it in the field.",
);
const orchardLocal = text(
  "Ko‘p yillik bog‘: ekilgan yil emas, joriy mavsum fazasi kerak. Kc daraxt yoshi, qator va qoplamga bog‘liq; bog‘ uchun sonli budjet hali yoqilmagan.",
  "Для сада нужна фаза текущего сезона. Kc зависит от возраста, междурядий и покрова; численный бюджет пока отключён.",
  "Use the current orchard season, not tree planting age. Kc depends on age, spacing and ground cover; numeric orchard budgets are not enabled yet.",
);
export const cropProfiles: CropProfile[] = [
  crop(
    "cotton",
    text("Paxta", "Хлопок", "Cotton"),
    [0.35, [1.15, 1.2], [0.5, 0.7]],
    phases(
      emergence,
      text(
        "Shonalash va shoxlanish",
        "Бутонизация и ветвление",
        "Squaring and branching",
      ),
      text(
        "Gullash va ko‘sak to‘lishi",
        "Цветение и налив коробочек",
        "Flowering and boll filling",
      ),
      text(
        "Ko‘sak ochilishi va terim",
        "Раскрытие коробочек и сбор",
        "Boll opening and picking",
      ),
    ),
    criticalFruit,
    "annual",
    text(
      "Sizot suvi chuqurligi va tuproq tarkibi muhim. Bitta hudud uchun berilgan me’yorni barcha dalaga ko‘chirmang.",
      "Учитывайте грунтовые воды и механический состав; не переносите одну норму на все поля.",
      "Account for groundwater and soil texture; do not transfer one local dose to every field.",
    ),
    [30, 80, 140, 195],
  ),
  crop(
    "wheat",
    text(
      "Bug‘doy (mavsumni tasdiqlang)",
      "Пшеница (уточните сезон)",
      "Wheat (confirm season)",
    ),
    [[0.3, 0.7], 1.15, [0.25, 0.4]],
    cereal,
    criticalFruit,
    "winter",
    winterLocal,
  ),
  crop(
    "winter_wheat",
    text("Kuzgi bug‘doy", "Озимая пшеница", "Winter wheat"),
    [[0.4, 0.7], 1.15, [0.25, 0.4]],
    cereal,
    criticalFruit,
    "winter",
    winterLocal,
  ),
  crop(
    "spring_wheat",
    text("Bahorgi bug‘doy", "Яровая пшеница", "Spring wheat"),
    [0.3, 1.15, [0.25, 0.4]],
    cereal,
    criticalFruit,
    "annual",
    localAnnual,
    [20, 45, 105, 135],
  ),
  crop(
    "barley",
    text("Arpa", "Ячмень", "Barley"),
    [0.3, 1.15, 0.25],
    cereal,
    criticalFruit,
    "winter",
    winterLocal,
  ),
  crop(
    "maize",
    text("Makkajo‘xori (don)", "Кукуруза (зерно)", "Maize (grain)"),
    [0.3, 1.2, [0.35, 0.6]],
    phases(
      emergence,
      leaf,
      text(
        "Ro‘vak, ipaklanish va don to‘lishi",
        "Метёлка, рыльца и налив зерна",
        "Tasseling, silking and grain filling",
      ),
      ripening,
    ),
    text(
      "Ipaklanish va changlanish davrida suv tanqisligiga alohida e’tibor bering.",
      "Особое внимание дефициту воды при появлении рылец и опылении.",
      "Pay particular attention to water deficit during silking and pollination.",
    ),
    "annual",
    localAnnual,
    [25, 65, 110, 140],
  ),
  crop(
    "tomato",
    text(
      "Pomidor (ochiq dala)",
      "Томат (открытый грунт)",
      "Tomato (open field)",
    ),
    [0.6, 1.15, [0.7, 0.9]],
    phases(emergence, leaf, flower, ripening),
    criticalFruit,
    "annual",
    localAnnual,
    [30, 70, 115, 145],
  ),
  crop(
    "potato",
    text("Kartoshka", "Картофель", "Potato"),
    [0.5, 1.15, 0.75],
    phases(
      emergence,
      text(
        "Poya o‘sishi va tuganak boshlanishi",
        "Рост ботвы и начало клубнеобразования",
        "Canopy growth and tuber initiation",
      ),
      text("Tuganaklarning yiriklashishi", "Налив клубней", "Tuber bulking"),
      text(
        "Palak qarishi va po‘st mustahkamlanishi",
        "Старение ботвы и укрепление кожуры",
        "Senescence and skin set",
      ),
    ),
    text(
      "Tuganak boshlanishi va yiriklashishida bir tekis namlanishni kuzating.",
      "Следите за равномерным увлажнением при образовании и наливе клубней.",
      "Watch moisture uniformity during tuber initiation and bulking.",
    ),
    "annual",
    localAnnual,
    [25, 55, 100, 130],
  ),
  crop(
    "onion",
    text("Piyoz (bosh piyoz)", "Лук репчатый", "Onion (dry bulb)"),
    [0.7, 1.05, 0.75],
    phases(
      emergence,
      leaf,
      text("Piyozbosh yiriklashishi", "Рост луковицы", "Bulb enlargement"),
      text(
        "Barg yotishi va qurish",
        "Полегание и подсыхание",
        "Top fall and curing",
      ),
    ),
    criticalFruit,
    "annual",
    localAnnual,
    [15, 40, 110, 150],
  ),
  crop(
    "carrot",
    text("Sabzi", "Морковь", "Carrot"),
    [0.7, 1.05, 0.95],
    phases(
      emergence,
      leaf,
      text(
        "Ildizmeva yiriklashishi",
        "Рост корнеплода",
        "Storage-root enlargement",
      ),
      ripening,
    ),
  ),
  crop(
    "cabbage",
    text("Karam", "Капуста", "Cabbage"),
    [0.7, 1.05, 0.95],
    phases(
      emergence,
      leaf,
      text(
        "Karam boshining shakllanishi",
        "Формирование кочана",
        "Head formation",
      ),
      ripening,
    ),
  ),
  crop(
    "cucumber",
    text(
      "Bodring (ochiq dala)",
      "Огурец (открытый грунт)",
      "Cucumber (open field)",
    ),
    [0.6, 1, 0.75],
    vine,
  ),
  crop("melon", text("Qovun", "Дыня", "Sweet melon"), [0.5, 1.05, 0.75], vine),
  crop(
    "watermelon",
    text("Tarvuz", "Арбуз", "Watermelon"),
    [0.4, 1, 0.75],
    vine,
  ),
  crop(
    "sunflower",
    text("Kungaboqar", "Подсолнечник", "Sunflower"),
    [0.35, [1, 1.15], 0.35],
    phases(
      emergence,
      leaf,
      text(
        "Savatcha, gullash va urug‘ to‘lishi",
        "Корзинка, цветение и налив семян",
        "Head formation, flowering and seed filling",
      ),
      ripening,
    ),
  ),
  crop("soybean", text("Soya", "Соя", "Soybean"), [0.4, 1.15, 0.5], pulse),
  crop(
    "bean",
    text("Loviya (quruq don)", "Фасоль (сухое зерно)", "Bean (dry seed)"),
    [0.4, 1.15, 0.35],
    pulse,
  ),
  crop("chickpea", text("No‘xat", "Нут", "Chickpea"), [0.4, 1, 0.35], pulse),
  crop(
    "sesame",
    text("Kunjut", "Кунжут", "Sesame"),
    [0.35, 1.1, 0.25],
    phases(
      emergence,
      leaf,
      text(
        "Gullash va ko‘sakcha to‘lishi",
        "Цветение и налив коробочек",
        "Flowering and capsule filling",
      ),
      ripening,
    ),
  ),
  crop(
    "rice",
    text("Sholi", "Рис", "Rice"),
    null,
    cereal,
    criticalFruit,
    "paddy",
    text(
      "Sholipoya uchun suv qatlami, sizilish va drenaj ham hisoblanadi. ETc budjeti yakka o‘zi yetarli emas; sonli tavsiya berilmaydi.",
      "Для риса нужны слой воды, фильтрация и дренаж. Одного ETc недостаточно; численная рекомендация отключена.",
      "Paddy requires ponding, seepage and drainage accounting. ETc alone is insufficient; numeric advice is disabled.",
    ),
  ),
  crop(
    "alfalfa",
    text("Beda", "Люцерна", "Alfalfa"),
    null,
    phases(
      text(
        "O‘rimdan keyin qayta o‘sish",
        "Отрастание после укоса",
        "Regrowth after cutting",
      ),
      leaf,
      text(
        "G‘unchalash va gullash",
        "Бутонизация и цветение",
        "Budding and flowering",
      ),
      text("O‘rimga tayyorlash", "Подготовка к укосу", "Preparing to cut"),
    ),
    criticalFruit,
    "cutting",
    text(
      "Har o‘rimdan keyin yangi sikl boshlanadi. O‘rim sanasi va qoplam hisobga olinmaguncha sonli budjet yoqilmagan.",
      "После укоса начинается новый цикл; без даты укоса и покрова численный бюджет отключён.",
      "Each cutting starts a new cycle. Numeric budgets need cutting date and canopy data and are not enabled yet.",
    ),
  ),
  crop(
    "grape",
    text("Uzum", "Виноград", "Table grape"),
    null,
    orchard,
    criticalFruit,
    "orchard",
    orchardLocal,
  ),
  crop(
    "apple",
    text("Olma", "Яблоня", "Apple"),
    null,
    orchard,
    criticalFruit,
    "orchard",
    orchardLocal,
  ),
  crop(
    "apricot",
    text("O‘rik", "Абрикос", "Apricot"),
    null,
    orchard,
    criticalFruit,
    "orchard",
    orchardLocal,
  ),
];
export const cropProfile = (id: string) =>
  cropProfiles.find((c) => c.id === id);
export const waterPhases: CropPhase[] = [
  "initial",
  "development",
  "mid",
  "late",
];
export function phaseKc(profile: CropProfile, stage: CropPhase): Range | null {
  const k = profile.kc;
  if (!k) return null;
  if (stage === "initial") return [...k.initial];
  if (stage === "mid") return [...k.mid];
  return stage === "development"
    ? [Math.min(...k.initial, ...k.mid), Math.max(...k.initial, ...k.mid)]
    : [Math.min(...k.end, ...k.mid), Math.max(...k.end, ...k.mid)];
}
