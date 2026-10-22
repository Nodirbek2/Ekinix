"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImagePlus, Leaf, ScanLine, Trash2 } from "lucide-react";
import { crops, cropLabel, pick, type Field, type Lang } from "@/lib/domain";
import {
  imageMimeTypes,
  maxPhotoBytes,
  type PlantPhotoAnalysis,
} from "@/lib/plant-photo";
import { requireClient } from "@/lib/supabase";
import { PageHeading, Pill } from "./WorkspaceViews";
import { Busy, ErrorNotice } from "./ui";
type PhotoResult = {
  analysis: PlantPhotoAnalysis;
  generatedAt: string;
  source: string;
  model: string;
};
async function preparePhoto(file: File): Promise<File> {
  if (file.size > 20_000_000) throw Error("photo_too_large");
  if (!(imageMimeTypes as readonly string[]).includes(file.type))
    throw Error("photo_format");
  const bitmap = await createImageBitmap(file);
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width * bitmap.height > 50_000_000
    )
      throw Error("photo_format");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height)),
      canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("photo_format");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8),
    );
    if (!blob) throw Error("photo_format");
    if (blob.size > maxPhotoBytes) throw Error("photo_too_large");
    // Canvas encodes pixels only: EXIF/GPS and the original filename are not forwarded.
    return new File([blob], "crop.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
export function PlantPhotoView({
  fields,
  lang,
  demo,
  initialFieldId,
}: {
  fields: Field[];
  lang: Lang;
  demo: boolean;
  initialFieldId?: string | null;
}) {
  const [fieldId, setFieldId] = useState(
      fields.some((f) => f.id === initialFieldId) ? initialFieldId! : "",
    ),
    [crop, setCrop] = useState(
      fields.find((f) => f.id === initialFieldId)?.crop_type ?? "cotton",
    ),
    [notes, setNotes] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [preparing, setPreparing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [available, setAvailable] = useState<boolean | null>(null),
    [result, setResult] = useState<PhotoResult | null>(null);
  const upload = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null),
    revision = useRef(0),
    request = useRef<AbortController | null>(null);
  const cancel = useCallback(() => {
    revision.current++;
    request.current?.abort();
  }, []);
  const checkService = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/gemini/plant-photo", {
        signal,
        cache: "no-store",
      });
      if (!response.ok) throw Error();
      const data = await response.json();
      setAvailable(Boolean(data.available));
      setError("");
    } catch {
      if (!signal?.aborted) {
        setAvailable(null);
        setError("request_failed");
      }
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) void checkService(controller.signal);
    });
    return () => {
      controller.abort();
      cancel();
    };
  }, [checkService, cancel]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  function invalidate() {
    cancel();
    setPreparing(false);
    setResult(null);
    setError("");
    setBusy(false);
  }
  async function choose(selected?: File) {
    if (!selected) return;
    invalidate();
    const expected = revision.current;
    setPreparing(true);
    setFile(null);
    setPreview("");
    try {
      const prepared = await preparePhoto(selected);
      if (expected === revision.current) {
        setFile(prepared);
        setPreview(URL.createObjectURL(prepared));
      }
    } catch (e) {
      if (expected === revision.current)
        setError(
          e instanceof Error &&
            ["photo_format", "photo_too_large"].includes(e.message)
            ? e.message
            : "photo_format",
        );
    } finally {
      if (expected === revision.current) setPreparing(false);
    }
  }
  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (!file || busy || demo || available !== true) return;
    setBusy(true);
    setError("");
    setResult(null);
    const expected = ++revision.current,
      controller = new AbortController();
    request.current = controller;
    try {
      const {
        data: { session },
      } = await requireClient().auth.getSession();
      if (!session) throw Error("session_expired");
      if (controller.signal.aborted) return;
      const body = new FormData();
      body.set("image", file);
      body.set("crop", crop);
      body.set("lang", lang);
      body.set("notes", notes);
      if (fields.some((f) => f.id === fieldId)) body.set("fieldId", fieldId);
      const r = await fetch("/api/gemini/plant-photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body,
        signal: controller.signal,
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error ?? "request_failed");
      if (expected === revision.current) setResult(data);
    } catch (e) {
      if (!controller.signal.aborted && expected === revision.current)
        setError(e instanceof Error ? e.message : "request_failed");
    } finally {
      if (expected === revision.current) setBusy(false);
    }
  }
  const field = fields.find((f) => f.id === fieldId);
  return (
    <>
      <PageHeading
        eyebrow={pick(
          lang,
          "DALA KUZATUVI · AI",
          "ОСМОТР ПОЛЯ · ИИ",
          "FIELD SCOUTING · AI",
        )}
        title={pick(
          lang,
          "Rasm orqali tahlil",
          "Анализ по фото",
          "Crop photo analysis",
        )}
        description={pick(
          lang,
          "Barg, poya yoki hosildagi ko‘rinadigan belgilarni tekshiring.",
          "Проверьте видимые признаки на листьях, стебле или урожае.",
          "Review visible signs on leaves, stems or harvested produce.",
        )}
      />
      <div className="photo-layout">
        <section className="panel photo-input">
          <div className="panel-heading">
            <h2>
              <Camera size={19} />
              {pick(
                lang,
                "Ekin rasmini qo‘shing",
                "Добавьте фото культуры",
                "Add a crop photo",
              )}
            </h2>
            <Pill>JPG · PNG · WEBP</Pill>
          </div>
          <form onSubmit={analyze}>
            <div className="photo-drop">
              {file && preview ? (
                <>
                  <Image
                    src={preview}
                    alt={pick(
                      lang,
                      "Tahlil uchun tanlangan ekin rasmi",
                      "Выбранное фото культуры",
                      "Crop photo selected for analysis",
                    )}
                    width={800}
                    height={600}
                    unoptimized
                  />
                  <button
                    type="button"
                    className="photo-remove"
                    aria-label={pick(
                      lang,
                      "Rasmni olib tashlash",
                      "Удалить фото",
                      "Remove photo",
                    )}
                    onClick={() => {
                      invalidate();
                      setFile(null);
                      setPreview("");
                      setPreparing(false);
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </>
              ) : (
                <div className="photo-placeholder">
                  <ScanLine size={40} />
                  <h3>
                    {pick(
                      lang,
                      "Muammoni yaqinroq ko‘rsating",
                      "Покажите симптом крупнее",
                      "Show the symptom up close",
                    )}
                  </h3>
                  <p>
                    {pick(
                      lang,
                      "Yorug‘ joyda, filtrsiz suratga oling.",
                      "Снимайте при хорошем свете, без фильтров.",
                      "Use good light and no filters.",
                    )}
                  </p>
                </div>
              )}
              {preparing && (
                <Busy
                  label={pick(
                    lang,
                    "Rasm tayyorlanmoqda…",
                    "Подготовка фото…",
                    "Preparing photo…",
                  )}
                />
              )}
            </div>
            <input
              ref={upload}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label={pick(
                lang,
                "Ekin rasmini yuklash",
                "Загрузить фото культуры",
                "Upload crop photo",
              )}
              onChange={(e) => {
                void choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <input
              ref={camera}
              className="sr-only"
              type="file"
              accept="image/*"
              capture="environment"
              aria-label={pick(
                lang,
                "Kamerada ekin rasmini olish",
                "Снять фото культуры",
                "Take crop photo",
              )}
              onChange={(e) => {
                void choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => void checkService()}
            >
              {pick(
                lang,
                "Xizmat holatini yangilash",
                "Проверить доступность сервиса",
                "Refresh service status",
              )}
            </button>
            <div className="photo-buttons">
              <button
                type="button"
                className="button secondary"
                disabled={busy || preparing}
                onClick={() => upload.current?.click()}
              >
                <ImagePlus size={16} />
                {pick(lang, "Rasm yuklash", "Загрузить фото", "Upload photo")}
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={busy || preparing}
                onClick={() => camera.current?.click()}
              >
                <Camera size={16} />
                {pick(lang, "Suratga olish", "Сделать снимок", "Take a photo")}
              </button>
            </div>
            <div className="photo-form">
              <label>
                {pick(
                  lang,
                  "Dala (ixtiyoriy)",
                  "Поле (необязательно)",
                  "Field (optional)",
                )}
                <select
                  value={field?.id ?? ""}
                  disabled={busy}
                  onChange={(e) => {
                    invalidate();
                    setFieldId(e.target.value);
                    const f = fields.find((f) => f.id === e.target.value);
                    if (f) setCrop(f.crop_type);
                  }}
                >
                  <option value="">
                    {pick(
                      lang,
                      "Dalasiz tahlil",
                      "Без привязки к полю",
                      "Analyze without a field",
                    )}
                  </option>
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {pick(lang, "Ekin turi", "Культура", "Crop")}
                <select
                  value={field?.crop_type ?? crop}
                  disabled={busy || !!field}
                  onChange={(e) => {
                    invalidate();
                    setCrop(e.target.value);
                  }}
                >
                  {crops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c[lang]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="photo-notes">
                {pick(
                  lang,
                  "Nima o‘zgardi? (ixtiyoriy)",
                  "Что изменилось? (необязательно)",
                  "What changed? (optional)",
                )}
                <textarea
                  rows={3}
                  maxLength={1200}
                  value={notes}
                  disabled={busy}
                  onChange={(e) => {
                    invalidate();
                    setNotes(e.target.value);
                  }}
                  placeholder={pick(
                    lang,
                    "Masalan: barglar 3 kundan beri sarg‘aygan, bir nechta tupda.",
                    "Например: листья желтеют 3 дня, на нескольких растениях.",
                    "For example: yellowing leaves for 3 days on several plants.",
                  )}
                />
              </label>
            </div>
            <ErrorNotice lang={lang} error={error} />
            {available === false && (
              <div className="notice photo-service">
                {pick(
                  lang,
                  "Rasm tahlili hozir ulanmagan. Rasmni tanlab ko‘rishingiz mumkin; xizmat yoqilgach AI tahlili ishlaydi.",
                  "Анализ фото пока не подключён. Можно выбрать фото; ИИ заработает после подключения сервиса.",
                  "Photo analysis is not connected yet. You can preview a photo; analysis starts once the service is enabled.",
                )}
              </div>
            )}
            {demo && (
              <p className="agro-caption">
                {pick(
                  lang,
                  "Demo: rasm tanlash mumkin. AIga yuborish uchun hisobingizga kiring.",
                  "Демо: можно выбрать фото. Для отправки ИИ войдите в аккаунт.",
                  "Demo: preview a photo. Sign in to send it for AI analysis.",
                )}
              </p>
            )}
            <p className="photo-privacy">
              {pick(
                lang,
                "Tahlil tugmasi rasm va izohni Google Gemini xizmatiga yuboradi. Rasm Ekinix bazasiga saqlanmaydi; GPS metama’lumotlari yuborilmaydi.",
                "Кнопка анализа отправляет фото и заметку в Google Gemini. Фото не сохраняется в базе Ekinix; GPS-метаданные удаляются.",
                "The analysis button sends the photo and note to Google Gemini. Ekinix does not store the photo in its database; GPS metadata is removed.",
              )}
            </p>
            <button
              className="button primary"
              type="submit"
              disabled={
                !file || busy || preparing || demo || available !== true
              }
            >
              {busy ? (
                <Busy
                  label={pick(
                    lang,
                    "Rasm tahlil qilinmoqda…",
                    "Анализ фото…",
                    "Analyzing photo…",
                  )}
                />
              ) : (
                <>
                  <ScanLine size={17} />
                  {pick(
                    lang,
                    "AIga yuborib tahlil qilish",
                    "Отправить ИИ для анализа",
                    "Send to AI for analysis",
                  )}
                </>
              )}
            </button>
          </form>
        </section>
        <div className="photo-output">
          {result ? (
            <PhotoReport result={result} lang={lang} />
          ) : (
            <section className="panel photo-guide">
              <Leaf size={30} />
              <span className="eyebrow">
                {pick(
                  lang,
                  "FOYDALI RASM — ANIQROQ KUZATUV",
                  "ЧЁТКОЕ ФОТО — ЛУЧШЕ ОСМОТР",
                  "CLEAR PHOTO · BETTER SCOUTING",
                )}
              </span>
              <h2>
                {pick(
                  lang,
                  "Rasmda nimalar ko‘rinishi kerak?",
                  "Что должно быть видно?",
                  "What should the photo show?",
                )}
              </h2>
              {[
                [
                  pick(
                    lang,
                    "Bargning ikki tomoni",
                    "Обе стороны листа",
                    "Both sides of a leaf",
                  ),
                  pick(
                    lang,
                    "Dog‘, rang va zararkunanda belgilari aniq ko‘rinsin.",
                    "Покажите пятна, цвет и признаки вредителей.",
                    "Show spots, color and visible pest signs.",
                  ),
                ],
                [
                  pick(
                    lang,
                    "Butun o‘simlik",
                    "Растение целиком",
                    "The whole plant",
                  ),
                  pick(
                    lang,
                    "Muammo bir bargdami yoki butun tupdami — izohda yozing.",
                    "Укажите, проблема на одном листе или всём растении.",
                    "Note whether one leaf or the whole plant is affected.",
                  ),
                ],
                [
                  pick(
                    lang,
                    "Tabiiy yorug‘lik",
                    "Естественный свет",
                    "Natural light",
                  ),
                  pick(
                    lang,
                    "Xiralik, kuchli soya va rang filtrlaridan saqlaning.",
                    "Избегайте размытия, сильных теней и фильтров.",
                    "Avoid blur, deep shadows and color filters.",
                  ),
                ],
              ].map(([title, desc], i) => (
                <div className="photo-tip" key={title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
              <div className="photo-limit">
                {pick(
                  lang,
                  "AI ko‘rinadigan alomatlar va ehtimoliy sabablarni aytadi. Aniq kasallik, tuproq namligi yoki hosilni yeyish xavfsizligini faqat rasm orqali tasdiqlamaydi.",
                  "ИИ описывает видимые признаки и возможные причины. Фото не подтверждает точную болезнь, влажность почвы или безопасность урожая для еды.",
                  "AI describes visible signs and possible causes. A photo cannot confirm an exact disease, soil moisture or whether produce is safe to eat.",
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
function PhotoReport({ result, lang }: { result: PhotoResult; lang: Lang }) {
  const a = result.analysis;
  return (
    <section className="panel photo-report" aria-live="polite">
      <div className="panel-heading">
        <h2>{pick(lang, "Rasm tahlili", "Анализ фото", "Photo assessment")}</h2>
        <Pill tone={a.urgency !== "routine" ? "amber" : "green"}>
          {a.imageQuality !== "usable"
            ? pick(
                lang,
                "Yangi rasm kerak",
                "Нужно новое фото",
                "New photo needed",
              )
            : a.urgency === "agronomist"
              ? pick(
                  lang,
                  "Agronom bilan tekshiring",
                  "Проверьте с агрономом",
                  "Review with agronomist",
                )
              : a.urgency === "inspect_soon"
                ? pick(
                    lang,
                    "Tezroq tekshiring",
                    "Проверьте в ближайшее время",
                    "Inspect soon",
                  )
                : pick(
                    lang,
                    "Dala tekshiruvi",
                    "Полевой осмотр",
                    "Field review",
                  )}
        </Pill>
      </div>
      <div className="photo-report-body">
        <p className="photo-summary">{a.summary}</p>
        <h3>
          {pick(
            lang,
            "Ko‘rinadigan belgilar",
            "Видимые признаки",
            "Visible signs",
          )}
        </h3>
        <ul>
          {a.observations.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        {a.possibleCauses.length > 0 && (
          <>
            <h3>
              {pick(
                lang,
                "Ehtimoliy sabablar — tashxis emas",
                "Возможные причины — не диагноз",
                "Possible causes — not a diagnosis",
              )}
            </h3>
            {a.possibleCauses.map((c, i) => (
              <article className="photo-cause" key={i}>
                <h4>{c.cause}</h4>
                <p>{c.basis}</p>
                <small>
                  {pick(lang, "Tekshirish", "Проверка", "Check")}: {c.check}
                </small>
              </article>
            ))}
          </>
        )}
        <h3>
          {pick(lang, "Keyingi qadamlar", "Следующие шаги", "Next steps")}
        </h3>
        <ul>
          {a.nextSteps.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        {a.additionalPhotos.length > 0 && (
          <>
            <h3>
              {pick(
                lang,
                "Yana qanday rasm kerak?",
                "Какие ещё фото нужны?",
                "Which extra photos would help?",
              )}
            </h3>
            <ul>
              {a.additionalPhotos.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </>
        )}
        <div className="photo-limit">
          {pick(
            lang,
            "Bu dastlabki vizual baho. Alomatlar ko‘rinmasa ham, rasm kasallik yo‘qligini tasdiqlamaydi. Muhim qarorni daladagi tekshiruv bilan tasdiqlang.",
            "Это предварительная визуальная оценка. Отсутствие симптомов на фото не доказывает отсутствие болезни. Подтвердите решение осмотром поля.",
            "This is preliminary visual triage. No visible symptoms does not prove absence of disease. Verify important decisions in the field.",
          )}
        </div>
        <small className="agro-caption">
          Google Gemini ·{" "}
          {new Date(result.generatedAt).toLocaleString(lang, {
            timeZone: "Asia/Tashkent",
          })}
        </small>
      </div>
    </section>
  );
}
