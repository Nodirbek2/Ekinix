"use client";
import { SimpleIrrigation } from "./SimpleIrrigation";
import { FieldChat } from "./FieldChat";
import { useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CloudRain,
  Droplets,
  Layers,
  Satellite,
  Sparkles,
} from "lucide-react";
import {
  cropLabel,
  formatDate,
  growthStage,
  pick,
  type Field,
  type Lang,
  type Monitoring,
  type Watering,
} from "@/lib/domain";
import { stageLabel, t } from "@/lib/copy";
import { api } from "@/lib/supabase";
import { PageHeading, Pill, NDVIChart, WeatherPanel } from "./WorkspaceViews";
import { Busy, ErrorNotice } from "./ui";
const PortfolioMap = dynamic(() => import("./PortfolioMap"), { ssr: false });
export function FieldDetail({
  field,
  monitoring,
  water,
  lang,
  demo,
  onBack,
  onEdit,
  onRecord,
  onPlan,
  onRefresh,
  onPhoto,
}: {
  field: Field;
  monitoring?: Monitoring;
  water: Watering[];
  lang: Lang;
  demo: boolean;
  onBack: () => void;
  onEdit: () => void;
  onRecord: () => void;
  onPlan: () => void;
  onRefresh: () => void;
  onPhoto: () => void;
}) {
  const [tab, setTab] = useState<"observations" | "weather" | "activity">(
      "observations",
    ),
    [ai, setAi] = useState<{ summary: string; actions: string[] } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const obs = monitoring?.satellite.observations ?? [],
    last = obs.at(-1),
    stage = growthStage(field);
  async function explain() {
    setBusy(true);
    setError("");
    try {
      setAi(
        await api("/api/gemini/field-summary", { fieldId: field.id, lang }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "request_failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="text-button back-link" onClick={onBack}>
        <ArrowLeft size={15} />
        {pick(lang, "Barcha dalalar", "Все поля", "All fields")}
      </button>
      <PageHeading
        eyebrow={field.region}
        title={field.name}
        description={`${cropLabel(field.crop_type, lang)} · ${field.area_hectares} ha · ${field.planting_date ?? "—"}`}
      >
        <button className="button secondary" onClick={onEdit}>
          {t(lang, "edit")}
        </button>
        <button className="button secondary" onClick={onPhoto}>
          <Camera size={15} />
          {pick(lang, "Rasmni tahlil qilish", "Анализ фото", "Analyze a photo")}
        </button>
        <button className="button secondary" onClick={onPlan}>
          <Droplets size={15} />
          {pick(lang, "Sug‘orish rejasi", "План полива", "Irrigation planner")}
        </button>
        <button className="button primary" disabled={demo} onClick={onRecord}>
          <Droplets size={15} />
          {t(lang, "recordWater")}
        </button>
      </PageHeading>
      <div className="field-detail-top">
        <section className="panel">
          <PortfolioMap fields={[field]} selected={field.id} lang={lang} />
        </section>
        <section className="panel field-facts">
          <h2>
            {pick(lang, "Dala pasporti", "Паспорт поля", "Field profile")}
          </h2>
          {[
            [
              Layers,
              pick(lang, "Maydon", "Площадь", "Area"),
              `${field.area_hectares} ha`,
            ],
            [
              CalendarDays,
              pick(lang, "Ekish sanasi", "Дата посадки", "Planting date"),
              field.planting_date ?? "—",
            ],
            [
              Satellite,
              "NDVI",
              last ? `${last.ndvi.toFixed(3)} · ${last.date}` : "—",
            ],
            [Droplets, t(lang, "method"), t(lang, field.irrigation_method)],
          ].map(([Icon, label, value], i) => {
            const I = Icon as typeof Layers;
            return (
              <div className="fact-row" key={i}>
                <span>
                  <I size={15} />
                  {label as string}
                </span>
                <strong>{value as string}</strong>
              </div>
            );
          })}
          <Pill tone="green">{stageLabel(lang, stage.stage)}</Pill>
          <small className="muted">
            {stage.estimated
              ? t(lang, "autoStage")
              : pick(
                  lang,
                  "Fermer tasdiqlagan",
                  "Подтверждено фермером",
                  "Grower-confirmed",
                )}
          </small>
        </section>
      </div>
      <SimpleIrrigation
        key={`simple:${field.id}:${lang}`}
        field={field}
        lang={lang}
        demo={demo}
        monitoring={monitoring}
        water={water}
        onRecord={onRecord}
        onEdit={onEdit}
      />
      <div className="detail-tabs">
        {(
          [
            {
              id: "observations",
              name: pick(lang, "Vegetatsiya", "Растительность", "Vegetation"),
            },
            { id: "weather", name: pick(lang, "Ob-havo", "Погода", "Weather") },
            {
              id: "activity",
              name: pick(lang, "Dala jurnali", "Журнал поля", "Field activity"),
            },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            className={tab === s.id ? "active" : ""}
            onClick={() => setTab(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>
      {tab === "observations" ? (
        <div className="detail-bottom">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                {pick(
                  lang,
                  "NDVI kuzatuvlari",
                  "Наблюдения NDVI",
                  "NDVI observations",
                )}
              </h2>
              <Pill>{obs.length}</Pill>
            </div>
            <NDVIChart
              observations={obs}
              lang={lang}
              satellite={monitoring?.satellite}
            />
            <button className="text-button" onClick={onRefresh} disabled={demo}>
              {pick(
                lang,
                "NDVIni qayta tekshirish",
                "Повторно проверить NDVI",
                "Check NDVI again",
              )}
            </button>
            <div className="source-line">
              Sentinel-2 ·{" "}
              {monitoring?.satellite.source === "earth-search"
                ? "Earth Search / Element 84 · Sentinel‑2 C1"
                : monitoring?.satellite.source === "copernicus"
                  ? "Copernicus"
                  : pick(
                      lang,
                      "Manba hali olinmagan",
                      "Источник ещё не получен",
                      "Source not loaded",
                    )}
            </div>
          </section>
          <section className="panel ai-panel">
            <Sparkles size={22} />
            <h2>
              {pick(
                lang,
                "Kuzatuvlar izohi",
                "Объяснение наблюдений",
                "Explain the observations",
              )}
            </h2>
            <p>
              {pick(
                lang,
                "AI mavjud dala ma’lumotlarini tushuntiradi. Bu daladagi tekshiruv o‘rnini bosmaydi.",
                "ИИ объясняет данные поля, но не заменяет осмотр.",
                "AI explains available field data and does not replace an on-site inspection.",
              )}
            </p>
            <ErrorNotice error={error} lang={lang} />
            {ai && (
              <div>
                <p>{ai.summary}</p>
                <ul>
                  {ai.actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="button secondary"
              onClick={explain}
              disabled={busy || demo}
            >
              {busy ? (
                <Busy label={t(lang, "loading")} />
              ) : (
                pick(
                  lang,
                  "AI bilan tahlil qilish",
                  "Объяснить с ИИ",
                  "Explain with AI",
                )
              )}
            </button>
          </section>
        </div>
      ) : tab === "weather" ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <CloudRain size={18} />
              {t(lang, "forecast")}
            </h2>
          </div>
          <WeatherPanel monitoring={monitoring} lang={lang} />
        </section>
      ) : (
        <section className="panel">
          <div className="panel-heading">
            <h2>
              {pick(
                lang,
                "Sug‘orish qaydlari",
                "Записи полива",
                "Irrigation entries",
              )}
            </h2>
            <Pill>{water.length}</Pill>
          </div>
          {water.map((w) => (
            <div className="activity-entry" key={w.id}>
              <Droplets size={17} />
              <span>
                <strong>
                  {w.water_volume_m3} m³ · {t(lang, w.method)}
                </strong>
                <small>{formatDate(w.watered_at, lang)}</small>
                {w.notes && <p>{w.notes}</p>}
              </span>
            </div>
          ))}
          {!water.length && (
            <p className="table-empty">
              {pick(
                lang,
                "Bu dalada hali qayd yo‘q.",
                "В этом поле пока нет записей.",
                "No activity recorded for this field yet.",
              )}
            </p>
          )}
        </section>
      )}
      <FieldChat
        key={`chat:${field.id}:${lang}`}
        fieldId={field.id}
        lang={lang}
        demo={demo}
      />
    </>
  );
}
