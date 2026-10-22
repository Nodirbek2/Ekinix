import type { PlantPhotoAnalysis } from "./plant-photo";
type Language = "uz" | "ru" | "en";
// Only identification names are used; provider treatment text is never prescribed.
export function kindwiseAnalysis(
  value: unknown,
  lang: Language,
): PlantPhotoAnalysis | null {
  const result = (
    value as {
      result?: {
        disease?: { suggestions?: unknown[] };
        crop?: { suggestions?: unknown[] };
      };
    }
  )?.result;
  if (
    !result ||
    !Array.isArray(result.disease?.suggestions) ||
    !Array.isArray(result.crop?.suggestions)
  )
    return null;
  const text = (uz: string, ru: string, en: string) => ({ uz, ru, en })[lang];
  const names = (list: unknown[]) =>
    list
      .flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const s = item as { name?: unknown; probability?: unknown };
        return typeof s.name === "string" &&
          s.name.length > 0 &&
          s.name.length <= 250 &&
          typeof s.probability === "number" &&
          Number.isFinite(s.probability) &&
          s.probability > 0 &&
          s.probability <= 1
          ? [s.name]
          : [];
      })
      .slice(0, 4);
  const diseases = names(result.disease.suggestions);
  const crops = names(result.crop.suggestions);
  return {
    imageQuality: "usable",
    urgency: diseases.length ? "inspect_soon" : "routine",
    summary: text(
      "Kindwise suratga mos ehtimoliy ekin va holatlarni qaytardi. Bu aniq tashxis emas; nomlar xizmat bergan tilda ko‘rsatiladi.",
      "Kindwise предложил возможные культуры и состояния по фото. Это не окончательный диагноз; названия приведены на языке сервиса.",
      "Kindwise returned possible crops and conditions matching the photo. This is not a confirmed diagnosis; names are shown in the provider’s language.",
    ),
    observations: crops.length
      ? [
          text("Taxminiy ekin: ", "Возможная культура: ", "Possible crop: ") +
            crops.join(", "),
        ]
      : [],
    possibleCauses: diseases.map((cause) => ({
      cause,
      basis: text(
        "Surat bo‘yicha model taklifi; dalada tasdiqlanmagan.",
        "Предположение модели по фото; в поле не подтверждено.",
        "Model suggestion from the image; not verified in the field.",
      ),
      check: text(
        "Bargning ikki tomonini, poyani va qo‘shni tuplarni tekshiring. Alomatlar mosligini agronom bilan tasdiqlang.",
        "Осмотрите обе стороны листа, стебель и соседние растения. Подтвердите симптомы с агрономом.",
        "Inspect both leaf surfaces, the stem and nearby plants. Confirm matching symptoms with an agronomist.",
      ),
    })),
    nextSteps: [
      text(
        "Faqat shu javob asosida dori yoki sug‘orish miqdorini belgilamang.",
        "Не назначайте препараты или объём полива только по этому ответу.",
        "Do not choose chemicals or irrigation amounts from this result alone.",
      ),
      text(
        "Zarar tez tarqalayotgan bo‘lsa, mahalliy agronomga murojaat qiling.",
        "При быстром распространении повреждений обратитесь к агроному.",
        "Contact a local agronomist if damage is spreading quickly.",
      ),
    ],
    additionalPhotos: [
      text(
        "Bargning ikki tomoni va butun o‘simlikni tabiiy yorug‘likda suratga oling.",
        "Снимите обе стороны листа и всё растение при естественном свете.",
        "Photograph both leaf surfaces and the whole plant in natural light.",
      ),
    ],
  };
}
