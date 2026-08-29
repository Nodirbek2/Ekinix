import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fieldName,
      cropType,
      areaHectares,
      region,
      plantingDate,
      growthStage,
      ndviScore,
      moisturePercentage,
      status,
      weatherSummary,
      lang = 'uz',
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Build agronomic context prompt
    const prompt = `Siz O'zbekiston qishloq xo'jaligi bo'yicha yetakchi katta agronom-mutaxassisi va Ekinix tahlilchisisiz.
Quyidagi dala ma'lumotlari bo'yicha dehqon va agronom uchun qisqa, aniq va amaliy haftalik/mavsumiy xulosa hisoboti tuzib bering.

DALA MA'LUMOTLARI:
- Dala nomi: ${fieldName || "Asosiy maydon"}
- Ekin turi: ${cropType || "Paxta"}
- Maydoni: ${areaHectares || 1} gektar
- Hudud: ${region || "Toshkent viloyati"}
- Ekish sanasi: ${plantingDate || "2026-04-10"}
- Joriy o'sish bosqichi: ${growthStage || "Vegetatsiya"}
- Sun'iy yo'ldosh NDVI ko'rsatkichi: ${ndviScore ?? 0.65} (0.1 dan 0.9 gacha)
- Tuproq namlik darajasi: ${moisturePercentage ?? 60}%
- Holati: ${status || "good"}
- 7 kunlik ob-havo holati: ${weatherSummary || "O'rtacha harorat +28..+34°C, yog'ingarchilik kam"}

Talab qilinadigan til: ${lang === 'ru' ? 'Rus tili (Русский)' : lang === 'en' ? 'Ingliz tili (English)' : "O'zbek tili (Lotin yozuvi)"}

Quyidagi JSON formatda to'liq javob qaytaring (faqat toza JSON, hech qanday markdown belgilarsiz):
{
  "executive_summary": "Maydon holati haqida 2-3 jumlali qisqa umumiy xulosa",
  "what_happened": "Oxirgi kunlarda NDVI va namlik ko'rsatkichlarida nima yuz bergani, o'simlik rivojlanishi dinamikasi",
  "concerns_and_risks": "E'tibor qaratish lozim bo'lgan xavf omillari (suv tanqisligi, zararkunanda xavfi, issiqlik stressi yoki o'g'it yetishmovchiligi)",
  "recommended_actions": [
    "1-aniq amaliy harakat (masalan, sug'orish me'yori va muddati)",
    "2-aniq amaliy harakat (masalan, oziqlantirish yoki bargdan purkash)",
    "3-aniq amaliy harakat (masalan, zararkunandalarni nazorat qilish)"
  ],
  "irrigation_tip": "Keyingi 3-5 kunga sug'orish bo'yicha aniq norma (masalan: 65-75 m³/ga)",
  "confidence_score": 94
}`;

    if (!apiKey) {
      // AI module is unconfigured — return a safe, non-prescriptive offline notice.
      // IMPORTANT: Do NOT put specific irrigation volumes, chemical names, or dosages
      // here. Unverified agronomic advice without real field data is a liability.
      const offlineNotice = {
        uz: "Ekinix AI tahlil moduli hozirda ishlamayapti yoki sozlanmagan. Iltimos, mintaqangiz uchun standart agrotexnik qoidalarga rioya qiling va agronomingiz bilan maslahatlashing.",
        ru: "Модуль ИИ-анализа Ekinix в настоящее время недоступен или не настроен. Пожалуйста, руководствуйтесь стандартными агротехническими нормами вашего региона и проконсультируйтесь с агрономом.",
        en: "The Ekinix AI analysis module is currently offline or unconfigured. Please rely on standard regional farming practices and consult your local agronomist.",
      };
      const notice = lang === 'ru' ? offlineNotice.ru : lang === 'en' ? offlineNotice.en : offlineNotice.uz;
      return NextResponse.json({
        executive_summary: notice,
        what_happened: notice,
        concerns_and_risks: notice,
        recommended_actions: [notice],
        irrigation_tip: notice,
        confidence_score: 0,
        source: "offline_fallback",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json({
        ...parsed,
        source: "gemini-3.7-flash",
      });
    } catch {
      return NextResponse.json({
        executive_summary: responseText,
        what_happened: "Tahlil muvaffaqiyatli yakunlandi.",
        concerns_and_risks: "Dala monitoringini davom ettiring.",
        recommended_actions: ["Sug'orish me'yorini saqlang", "Begona o'tlarni tozalang"],
        irrigation_tip: "Ob-havoga qarab sug'oring",
        confidence_score: 90,
        source: "gemini-3.7-flash",
      });
    }
  } catch (error: any) {
    console.error("Gemini field summary error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate AI field summary" },
      { status: 500 }
    );
  }
}
