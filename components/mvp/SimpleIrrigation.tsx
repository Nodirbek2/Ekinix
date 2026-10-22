"use client";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Droplets, RefreshCw } from "lucide-react";
import {
  pick,
  formatDate,
  type Field,
  type Lang,
  type Monitoring,
  type Watering,
} from "@/lib/domain";
import { stageLabel } from "@/lib/copy";
import { phaseKc, cropProfile } from "@/lib/crop-catalog";
import { buildIrrigationPlan } from "@/lib/irrigation-plan";
import {
  planningWindows,
  type IrrigationContext,
} from "@/lib/irrigation-context";
import { api } from "@/lib/supabase";
import { ErrorNotice } from "./ui";
export function SimpleIrrigation({
  field,
  lang,
  demo,
  monitoring,
  water,
  onRecord,
  onEdit,
}: {
  field: Field;
  lang: Lang;
  demo: boolean;
  monitoring?: Monitoring;
  water: Watering[];
  onRecord: () => void;
  onEdit: () => void;
}) {
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const [context, setContext] = useState<IrrigationContext | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    if (demo) return;
    const timer = setInterval(() => setReload((x) => x + 1), 1800000);
    return () => clearInterval(timer);
  }, [demo]);
  const latest = water
    .filter((w) => w.field_id === field.id)
    .sort((a, b) => Date.parse(b.watered_at) - Date.parse(a.watered_at))[0];
  useEffect(() => {
    let live = true;
    queueMicrotask(async () => {
      if (!live || demo) return;
      setBusy(true);
      setError("");
      try {
        const value = await api<IrrigationContext>(
          `/api/irrigation/context?fieldId=${field.id}`,
        );
        if (live) setContext(value);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : "request_failed");
      } finally {
        if (live) setBusy(false);
      }
    });
    return () => {
      live = false;
    };
  }, [field.id, demo, latest?.watered_at, latest?.water_volume_m3, reload]);
  const last = context?.lastWatering ?? latest;
  const forecast = context?.forecast ?? monitoring?.weather.days ?? [];
  const weather = context
    ? {
        status: context.weatherStatus,
        fetchedAt: context.fetchedAt,
        modelTime: null,
        temperature: null,
        soilVwc: null,
        soilTime: null,
        days: forecast,
      }
    : monitoring?.weather;
  const plan = buildIrrigationPlan(
    field,
    weather,
    water,
    { phase: field.stage_override, confirmed: !!field.stage_override },
    demo && weather ? new Date(weather.fetchedAt) : new Date(clock),
  );
  const windows =
    last && plan.status === "ready" && context
      ? planningWindows(context.hours, field.irrigation_method, clock)
      : [];
  const profile = cropProfile(field.crop_type);
  const kc =
    profile && field.stage_override && field.stage_override !== "harvest"
      ? phaseKc(profile, field.stage_override)
      : null;
  const history = context?.history ?? [];
  const complete = context?.historyComplete && history.length > 0 && kc;
  const et0 = history.reduce((s, d) => s + (d.et0 ?? 0), 0),
    rain = history.reduce((s, d) => s + (d.rainMm ?? 0), 0);
  const satellite = context?.satellite ?? monitoring?.satellite;
  const observation = satellite?.observations.at(-1);
  const dateTime = (ms: number) =>
    new Date(ms).toLocaleString(lang, {
      timeZone: "Asia/Tashkent",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <section className="panel simple-irrigation">
      <div className="panel-heading">
        <h2>
          <Droplets size={19} />
          {pick(
            lang,
            "Sug‘orish — oddiy reja",
            "Полив — простой план",
            "Irrigation — simple plan",
          )}
        </h2>
        <button
          className="text-button"
          disabled={demo || busy}
          onClick={() => setReload((x) => x + 1)}
        >
          <RefreshCw size={15} />
          {busy
            ? pick(lang, "Yuklanmoqda…", "Загрузка…", "Loading…")
            : pick(lang, "Yangilash", "Обновить", "Refresh")}
        </button>
      </div>
      <div className="simple-body">
        <small className="agro-caption">
          {pick(
            lang,
            "Vaqtlar: Toshkent (UTC+5)",
            "Время: Ташкент (UTC+5)",
            "Times: Tashkent (UTC+5)",
          )}
          {context
            ? ` · Open-Meteo · ${dateTime(Date.parse(context.fetchedAt))}`
            : ""}
        </small>
        <ErrorNotice error={error} lang={lang} />
        <div className="simple-facts">
          <div>
            <small>
              {pick(
                lang,
                "Oxirgi sug‘orish",
                "Последний полив",
                "Last watering",
              )}
            </small>
            <strong>
              {last
                ? formatDate(last.watered_at, lang)
                : pick(
                    lang,
                    "Qayd kiriting",
                    "Добавьте запись",
                    "Add a record",
                  )}
            </strong>
            <span>
              {last
                ? `${last.water_volume_m3} m³`
                : pick(
                    lang,
                    "Rejaning boshlang‘ich nuqtasi",
                    "Начальная точка плана",
                    "The starting point for planning",
                  )}
            </span>
          </div>
          <div>
            <small>
              {pick(lang, "Ekin fazasi", "Фаза культуры", "Crop phase")}
            </small>
            <strong>
              {field.stage_override
                ? stageLabel(lang, field.stage_override)
                : pick(
                    lang,
                    "Tasdiqlanmagan",
                    "Не подтверждена",
                    "Not confirmed",
                  )}
            </strong>
            <button className="text-button" onClick={onEdit}>
              {pick(
                lang,
                "Fazani aniqlashtirish",
                "Уточнить фазу",
                "Confirm phase",
              )}
            </button>
          </div>
          <div>
            <small>
              {pick(lang, "Sun’iy yo‘ldosh", "Спутник", "Satellite")}
            </small>
            <strong>
              {observation
                ? `NDVI ${observation.ndvi.toFixed(2)}`
                : pick(
                    lang,
                    "Kuzatuv yo‘q",
                    "Нет наблюдений",
                    "No observation",
                  )}
            </strong>
            <span>{observation ? observation.date : "—"}</span>
          </div>
        </div>
        {!last && (
          <div className="simple-callout">
            <strong>
              {pick(
                lang,
                "Avval oxirgi sug‘orishni kiriting",
                "Сначала запишите последний полив",
                "First record the last watering",
              )}
            </strong>
            <p>
              {pick(
                lang,
                "Qachon va amalda qancha suv berilganini yozing. Sug‘orilmagan bo‘lsa, tasdiqlash tugmasini bosmang.",
                "Укажите фактическую дату и объём. Не подтверждайте невыполненный полив.",
                "Enter its actual date and volume. Do not confirm watering that did not happen.",
              )}
            </p>
          </div>
        )}
        {context && last && (
          <div className="simple-callout">
            <strong>
              {pick(
                lang,
                "Oxirgi sug‘orishdan keyingi ob-havo",
                "Погода после полива",
                "Weather since watering",
              )}
            </strong>
            {complete ? (
              <p>
                {context.historyStart} — {context.historyEnd}:{" "}
                {pick(lang, "yomg‘ir", "осадки", "rain")}{" "}
                <b>{rain.toFixed(1)} mm</b> ·{" "}
                {pick(
                  lang,
                  "ekin suv sarfi taxmini",
                  "оценка расхода воды культурой",
                  "estimated crop water use",
                )}{" "}
                <b>
                  {(et0 * kc[0]).toFixed(1)}–{(et0 * kc[1]).toFixed(1)} mm
                </b>
                .
              </p>
            ) : (
              <p>
                {pick(
                  lang,
                  "To‘liq o‘tgan kunlar yoki tasdiqlangan faza yetarli emas; umumiy suv sarfi chiqarilmadi.",
                  "Недостаточно полных дней или подтверждённой фазы.",
                  "Not enough complete days or a confirmed phase to calculate total crop water use.",
                )}
              </p>
            )}
            <small>
              {pick(
                lang,
                "Sug‘orilgan kun va bugunning tugamagan qismi kirmaydi. Bu ob-havo modeli va hozirgi faza bilan taxmin; tuproqdagi qolgan suv o‘lchovi emas.",
                "День полива и сегодня исключены. Это модельная оценка по текущей фазе, не измерение запаса воды.",
                "Excludes irrigation day and today. A weather-model estimate using the current phase, not measured soil water.",
              )}
            </small>
          </div>
        )}
        <h3>
          <CalendarDays size={17} />{" "}
          {pick(
            lang,
            "Yaqin kunlardagi qulay vaqtlar",
            "Подходящие ближайшие окна",
            "Upcoming weather windows",
          )}
        </h3>
        <p>
          {pick(
            lang,
            "Bu vaqtlar dalani tekshirish va kerak bo‘lsa sug‘orishni rejalash uchun. Soat — boshlash oynasi, sug‘orish davomiyligi emas.",
            "Окна для осмотра и, при необходимости, планирования полива. Это время начала, не длительность полива.",
            "These are inspection and possible irrigation planning windows. Times are starting windows, not watering duration.",
          )}
        </p>
        <div className="simple-windows">
          {windows.length ? (
            windows.map((w, i) => (
              <article key={w.start}>
                <small>
                  {i + 1}.{" "}
                  {pick(
                    lang,
                    "Rejalash oynasi",
                    "Окно планирования",
                    "Planning window",
                  )}
                </small>
                <strong>
                  {dateTime(w.start)}–
                  {new Date(w.end).toLocaleTimeString(lang, {
                    timeZone: "Asia/Tashkent",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
                <span>
                  {w.temperature.toFixed(0)}°C ·{" "}
                  {pick(lang, "shamol", "ветер", "wind")} {w.wind.toFixed(0)}{" "}
                  km/h ·{" "}
                  {pick(
                    lang,
                    "yomg‘ir ehtimoli",
                    "вероятность осадков",
                    "rain chance",
                  )}{" "}
                  {w.rainProbability}%
                </span>
              </article>
            ))
          ) : (
            <p className="simple-callout">
              {pick(
                lang,
                "Hozir qulay soatni ko‘rsatish uchun tasdiqlangan faza va yaroqli soatlik prognoz kerak. Mos ob-havo bo‘lmasa, vaqt tayinlanmaydi.",
                "Для выбора окна нужны подтверждённая фаза и почасовой прогноз.",
                "A confirmed phase and usable hourly forecast are required. No suitable weather means no window is assigned.",
              )}
            </p>
          )}
        </div>
        <div className="simple-bottom">
          <div>
            <strong>
              {pick(lang, "Qancha suv?", "Сколько воды?", "How much water?")}
            </strong>
            <p>
              {plan.status === "ready" && plan.days[0]
                ? `${pick(lang, "Bugungi hisobiy suv sarfini qoplash byudjeti", "Бюджет возмещения расхода за сегодня", "Today’s modeled replacement budget")}: ${Math.round(plan.days[0].grossM3[0])}–${Math.round(plan.days[0].grossM3[1])} m³ (${field.area_hectares} ha).`
                : pick(
                    lang,
                    "Faza va prognoz tasdiqlangach hisoblanadi.",
                    "Рассчитывается после подтверждения фазы и прогноза.",
                    "Calculated after phase and forecast are confirmed.",
                  )}
            </p>
            <small>
              {pick(
                lang,
                "Bu hozir beriladigan doza emas. Amaldagi hajm tuproq holati va agronom bilan belgilanadi.",
                "Это не доза для немедленного внесения.",
                "This is not a dose to apply now.",
              )}
            </small>
          </div>
          <div>
            <strong>
              {pick(
                lang,
                "Qaysi qismdan boshlash?",
                "С какой части начать?",
                "Which part first?",
              )}
            </strong>
            <p>
              {pick(
                lang,
                "Hozir NDVI dala o‘rtachasi. Alohida quruq zonalar va ularning navbati hali o‘lchanmagan. Avval dalada quruqligi tasdiqlangan joyni tekshiring.",
                "NDVI усреднён по полю. Отдельные сухие зоны и их порядок не измерены.",
                "Current NDVI is a field average. Dry zones and their irrigation order have not been measured.",
              )}
            </p>
          </div>
        </div>
        <button className="button primary" disabled={demo} onClick={onRecord}>
          <CheckCircle2 size={17} />
          {pick(
            lang,
            "Sug‘orildi — qaydni tasdiqlash",
            "Полито — подтвердить запись",
            "Watered — confirm record",
          )}
        </button>
        <small className="simple-confirm-note">
          {pick(
            lang,
            "Keyingi oynada sana va amaldagi hajmni kiritib saqlaysiz. Shundan keyin reja yangilanadi.",
            "В следующем окне сохраните дату и фактический объём.",
            "Enter the actual date and volume in the next dialog. The plan then updates.",
          )}
        </small>
        <p className="agro-caption">
          {pick(
            lang,
            "Eslatmalar sayt ochilganda yangilanadi. Hozir fon rejimida SMS yoki push yuborilmaydi.",
            "Напоминания обновляются при открытии сайта. Фоновых SMS/push пока нет.",
            "Reminders refresh when the site is opened. Background SMS or push is not enabled.",
          )}
        </p>
      </div>
    </section>
  );
}
