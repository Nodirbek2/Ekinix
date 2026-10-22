"use client";
import { SimpleIrrigation } from "./SimpleIrrigation";
import { FieldChat } from "./FieldChat";
import { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Droplets,
  Download,
  Leaf,
  SlidersHorizontal,
} from "lucide-react";
import {
  cropLabel,
  formatDate,
  pick,
  type Field,
  type Lang,
  type Stage,
} from "@/lib/domain";
import {
  agronomySources,
  cropProfile,
  cropProfiles,
  phaseKc,
  waterPhases,
  type CropProfile,
  type Range,
} from "@/lib/crop-catalog";
import {
  buildIrrigationPlan,
  methodEfficiency,
  type PlanStatus,
} from "@/lib/irrigation-plan";
import { downloadCsv } from "@/lib/workspace";
import { stageLabel, t } from "@/lib/copy";
import {
  FieldPicker,
  PageHeading,
  Pill,
  type ViewProps,
} from "./WorkspaceViews";
const range = (v: Range | null | undefined, decimals = 1) =>
  !v
    ? "—"
    : Math.abs(v[1] - v[0]) < 0.001
      ? v[0].toFixed(decimals)
      : `${v[0].toFixed(decimals)}–${v[1].toFixed(decimals)}`;
const message = (status: PlanStatus, l: Lang) =>
  pick(
    l,
    ...(
      {
        unsupported: [
          "Bu ekin uchun alohida model kerak. Hozir faza qo‘llanmasi mavjud.",
          "Для этой культуры нужна отдельная модель. Доступно руководство по фазам.",
          "This crop needs a separate model. Phase guidance is available.",
        ],
        phase_needed: [
          "Daladagi joriy fazani tanlang va tasdiqlang. Sana bo‘yicha taxmin bilan suv hajmi hisoblanmaydi.",
          "Выберите и подтвердите текущую фазу на поле. Оценка по дате не даёт объём полива.",
          "Choose and confirm the current field phase. A calendar estimate cannot unlock water volumes.",
        ],
        harvest: [
          "Yig‘im-terim tanlangan. Vegetatsiya sug‘orish budjeti chiqarilmaydi.",
          "Выбрана уборка. Вегетационный бюджет полива не рассчитывается.",
          "Harvest is selected. No growing-season irrigation budget is calculated.",
        ],
        dormant: [
          "Qishki tinim tanlangan. Faol vegetatsiya budjeti hisoblanmaydi.",
          "Выбран зимний покой. Бюджет активной вегетации не рассчитывается.",
          "Dormancy is selected. No active-season water budget is calculated.",
        ],
        weather_needed: [
          "Yangi va to‘liq 7 kunlik ET₀/yog‘in prognozi kerak. Kuzatuvlarni yangilang.",
          "Нужен свежий полный 7-дневный прогноз ET₀ и осадков. Обновите наблюдения.",
          "A fresh complete 7-day ET₀/rain forecast is needed. Refresh observations.",
        ],
        invalid_inputs: [
          "Maydon va hisoblash parametrlarini tekshiring.",
          "Проверьте площадь и параметры расчёта.",
          "Check area and calculation parameters.",
        ],
        ready: [
          "7 kunlik suv budjeti tayyor. Sug‘orish vaqtini dala tekshiruvidan keyin belgilang.",
          "7-дневный водный бюджет готов. Время полива определите после осмотра поля.",
          "The 7-day water budget is ready. Set irrigation timing after a field check.",
        ],
      } satisfies Record<PlanStatus, [string, string, string]>
    )[status],
  );
function Sources({ lang }: { lang: Lang }) {
  return (
    <details className="agro-sources">
      <summary>
        {pick(
          lang,
          "Manbalar va hisoblash asosi",
          "Источники и методика",
          "Sources and methodology",
        )}
      </summary>
      <p>
        {pick(
          lang,
          "FAO-56 koeffitsiyentlari — boshlang‘ich ma’lumot, O‘zbekistonda barcha navlar uchun sinovdan o‘tgan norma emas.",
          "Коэффициенты FAO-56 — исходные ориентиры, а не проверенные нормы для всех сортов Узбекистана.",
          "FAO-56 coefficients are reference inputs, not validated doses for every Uzbek variety.",
        )}
      </p>
      {agronomySources.map((s) => (
        <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
          {s.name}
          <ArrowUpRight size={13} />
        </a>
      ))}
      <a
        href="https://www.fao.org/4/t7202e/t7202e08.htm"
        target="_blank"
        rel="noreferrer"
      >
        FAO ·{" "}
        {pick(
          lang,
          "sug‘orish samaradorligi",
          "эффективность орошения",
          "irrigation efficiency",
        )}
      </a>
      <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">
        Open-Meteo · ET₀ / {pick(lang, "prognoz", "прогноз", "forecast")}
      </a>
    </details>
  );
}
export function CropPhaseGuide({
  profile,
  lang,
  selected,
}: {
  profile: CropProfile;
  lang: Lang;
  selected?: Stage | "dormant" | null;
}) {
  return (
    <section className="panel agro-guide">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">
            {pick(
              lang,
              "FENOLOGIYA VA SUV",
              "ФЕНОЛОГИЯ И ВОДА",
              "PHENOLOGY & WATER",
            )}
          </span>
          <h2>{profile[lang]}</h2>
        </div>
        <BookOpen size={21} />
      </div>
      <div className="phase-cards">
        {waterPhases.map((s, i) => (
          <article key={s} className={selected === s ? "selected" : ""}>
            <div>
              <span className="phase-number">0{i + 1}</span>
              <Pill>{stageLabel(lang, s)}</Pill>
            </div>
            <h3>{profile.phases[s][lang]}</h3>
            <p>
              {s === "initial"
                ? pick(
                    lang,
                    "Unish bir tekisligi, ildiz otishi va tuproq yuzasini kuzating.",
                    "Проверьте равномерность всходов, укоренение и поверхность почвы.",
                    "Check emergence uniformity, rooting and the soil surface.",
                  )
                : s === "development"
                  ? pick(
                      lang,
                      "Barg qoplami kengayadi. Haqiqiy fazani daladagi belgilar bilan solishtiring.",
                      "Покров увеличивается. Сопоставляйте фазу с признаками на поле.",
                      "Canopy expands. Compare the phase with observed field signs.",
                    )
                  : s === "mid"
                    ? profile.critical[lang]
                    : pick(
                        lang,
                        "Pishish va yig‘im rejasiga moslang. Barcha ekinlarda suvni bir vaqtda to‘xtatish qoidasi yo‘q.",
                        "Учитывайте зрелость и уборку. Единого срока прекращения полива для всех культур нет.",
                        "Account for maturity and harvest. There is no universal irrigation cut-off for all crops.",
                      )}
            </p>
            <small>
              {profile.kc
                ? `Kc ${range(phaseKc(profile, s), 2)}`
                : pick(
                    lang,
                    "Sonli model hali yo‘q",
                    "Численная модель ещё не готова",
                    "Numeric model not available",
                  )}
            </small>
          </article>
        ))}
      </div>
      <div className="agro-local">
        <Leaf size={18} />
        <p>{profile.local[lang]}</p>
      </div>
      <p className="agro-caption">
        {pick(
          lang,
          "Bu 4 suv hisoblash bosqichi; aniq BBCH tashxisi yoki navga xos kunlik kalendar emas. O‘sish tezligi nav, hudud, harorat va ekish usuliga qarab o‘zgaradi.",
          "Это 4 стадии водного расчёта, не диагноз BBCH и не сортовой календарь. Темп зависит от сорта, климата и посева.",
          "These are 4 water-accounting stages, not a BBCH diagnosis or variety-specific calendar. Development depends on variety, climate and planting method.",
        )}
      </p>
      <Sources lang={lang} />
    </section>
  );
}
export function GuideView(p: ViewProps) {
  const [selected, setSelected] = useState(
      cropProfile(p.fields[0]?.crop_type)?.id ?? "cotton",
    ),
    [search, setSearch] = useState("");
  const profile = cropProfile(selected)!;
  return (
    <>
      <PageHeading
        eyebrow={pick(
          p.lang,
          "AGRONOMIYA KUTUBXONASI",
          "АГРОНОМИЧЕСКАЯ БИБЛИОТЕКА",
          "AGRONOMY LIBRARY",
        )}
        title={pick(
          p.lang,
          "Ekin fazalari qo‘llanmasi",
          "Справочник фаз культур",
          "Crop phase library",
        )}
        description={pick(
          p.lang,
          `${cropProfiles.length} ekin profili · dala belgisi, suvga talab va ochiq manbalar.`,
          `${cropProfiles.length} профиля · признаки, вода и открытые источники.`,
          `${cropProfiles.length} crop profiles · field signs, water needs and open sources.`,
        )}
      >
        <button
          className="button secondary"
          onClick={() => p.onNavigate("planning")}
        >
          <Droplets size={16} />
          {pick(
            p.lang,
            "Sug‘orish rejasiga",
            "План полива",
            "Irrigation planner",
          )}
        </button>
      </PageHeading>
      <div className="agro-library">
        <aside className="panel crop-library-nav">
          <label>
            {pick(p.lang, "Ekin izlash", "Поиск культуры", "Search crops")}
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <nav aria-label={pick(p.lang, "Ekin turi", "Культура", "Crop type")}>
            {cropProfiles
              .filter((c) =>
                c[p.lang]
                  .toLocaleLowerCase()
                  .includes(search.trim().toLocaleLowerCase()),
              )
              .map((c) => (
                <button
                  key={c.id}
                  aria-pressed={selected === c.id}
                  className={selected === c.id ? "active" : ""}
                  onClick={() => setSelected(c.id)}
                >
                  <Leaf size={16} />
                  {c[p.lang]}
                </button>
              ))}
          </nav>
        </aside>
        <div>
          <CropPhaseGuide profile={profile} lang={p.lang} />
          <section className="panel agro-related">
            <h2>
              {pick(
                p.lang,
                "Shu ekin ekilgan dalalar",
                "Поля с этой культурой",
                "Fields with this crop",
              )}
            </h2>
            {p.fields
              .filter((f) => f.crop_type === selected)
              .map((f) => (
                <button
                  key={f.id}
                  className="guide-field"
                  onClick={() => p.onOpen(f.id)}
                >
                  {f.name}
                  <ArrowUpRight size={16} />
                </button>
              ))}
            {!p.fields.some((f) => f.crop_type === selected) && (
              <p>
                {pick(
                  p.lang,
                  "Bu ekin dalalaringizda hali yo‘q.",
                  "В ваших полях пока нет этой культуры.",
                  "This crop is not in your field register yet.",
                )}
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
export function IrrigationPlanView(
  p: ViewProps & { initialFieldId?: string | null },
) {
  const [id, setId] = useState(p.initialFieldId ?? p.fields[0]?.id ?? "");
  const field = p.fields.find((f) => f.id === id) ?? p.fields[0];
  return (
    <>
      <PageHeading
        eyebrow={pick(
          p.lang,
          "SUVNI REJALASH",
          "ПЛАНИРОВАНИЕ ВОДЫ",
          "WATER PLANNING",
        )}
        title={pick(
          p.lang,
          "Sug‘orish rejasi",
          "План полива",
          "Irrigation planner",
        )}
        description={pick(
          p.lang,
          "Ekin fazasi va haqiqiy ob-havo prognozi asosida, sensorsiz.",
          "По фазе культуры и реальному прогнозу, без датчика.",
          "Crop phase and real weather forecasts, without a sensor.",
        )}
      >
        <button
          className="button secondary"
          onClick={() => p.onNavigate("irrigation")}
        >
          {pick(
            p.lang,
            "Bajarilgan sug‘orishlar",
            "Выполненные поливы",
            "Recorded irrigations",
          )}
          <ArrowUpRight size={15} />
        </button>
      </PageHeading>
      {!field ? (
        <section className="panel agro-empty">
          <h2>
            {pick(
              p.lang,
              "Avval dala qo‘shing",
              "Сначала добавьте поле",
              "Add a field first",
            )}
          </h2>
          <p>
            {pick(
              p.lang,
              "Chegara, ekin va sug‘orish usuli hisoblash asosini beradi.",
              "Граница, культура и способ полива задают основу расчёта.",
              "Boundary, crop and irrigation method provide the calculation inputs.",
            )}
          </p>
          <button className="button primary" onClick={p.onAdd}>
            {t(p.lang, "addField")}
          </button>
        </section>
      ) : (
        <>
          <FieldPicker
            fields={p.fields}
            value={field.id}
            lang={p.lang}
            onChange={(v) => {
              setId(v);
              p.onLoad(v);
            }}
          />
          <SimpleIrrigation
            key={`simple:${field.id}:${p.lang}`}
            field={field}
            lang={p.lang}
            demo={p.demo}
            monitoring={p.data[field.id]}
            water={p.water}
            onRecord={() => p.onRecord(field)}
            onEdit={() => p.onEdit(field)}
          />
          <details className="advanced-planner">
            <summary>
              {pick(
                p.lang,
                "Hisob tafsilotlari va sozlamalar",
                "Расчёты и настройки",
                "Calculation details and settings",
              )}
            </summary>
            <Planner
              key={`${field.id}:${field.stage_override}:${field.crop_type}:${field.irrigation_method}`}
              p={p}
              field={field}
            />
          </details>
          <FieldChat
            key={`chat:${field.id}:${p.lang}`}
            fieldId={field.id}
            lang={p.lang}
            demo={p.demo}
          />
        </>
      )}
    </>
  );
}
function Planner({ p, field }: { p: ViewProps; field: Field }) {
  const l = p.lang,
    profile = cropProfile(field.crop_type);
  const [phase, setPhase] = useState<Stage | "dormant" | "">(
      field.stage_override ?? "",
    ),
    [confirmed, setConfirmed] = useState(false),
    [rainCredit, setRainCredit] = useState(0),
    [efficiency, setEfficiency] = useState<number>(
      methodEfficiency[field.irrigation_method],
    ),
    [special, setSpecial] = useState(false);
  const weather = p.data[field.id]?.weather;
  // Demo uses its explicitly dated fixture clock, never passes an old fixture as a live forecast.
  const now = p.demo && weather ? new Date(weather.fetchedAt) : new Date();
  const plan = buildIrrigationPlan(
    field,
    weather,
    p.water.filter((w) => w.field_id === field.id),
    { phase: phase || null, confirmed, rainCredit, efficiency },
    now,
  );
  const ready = plan.status === "ready";
  const exportPlan = () =>
    downloadCsv("ekinix-irrigation-budget.csv", [
      [
        "Ekinix",
        plan.version,
        p.demo ? "DEMO" : "FORECAST SCENARIO",
        field.name,
        cropLabel(field.crop_type, l),
      ],
      [
        "Phase",
        phase,
        "Confirmed for scenario",
        confirmed,
        "Efficiency",
        efficiency,
        "Rain credit",
        rainCredit,
        "Forecast fetched",
        plan.forecastAt,
      ],
      [
        "Not an application order. Soil reserves, groundwater and leaching are not included.",
      ],
      [
        "Date",
        "ET0 mm",
        "Rain mm",
        "Credited rain mm",
        "ETc min mm",
        "ETc max mm",
        "Replacement min mm",
        "Replacement max mm",
        "Gross budget min m3",
        "Gross budget max m3",
      ],
      ...plan.days.map((d) => [
        d.date,
        d.et0,
        d.rain,
        d.effectiveRain,
        ...d.etc,
        ...d.net,
        ...d.grossM3,
      ]),
    ]);
  return (
    <>
      <div className="planner-layout">
        <section className="panel planner-controls">
          <div className="panel-heading">
            <h2>
              <SlidersHorizontal size={18} />
              {pick(l, "Reja parametrlari", "Параметры плана", "Plan inputs")}
            </h2>
          </div>
          <div className="planner-inputs">
            <button className="text-button" onClick={() => p.onLoad(field.id)}>
              {pick(
                l,
                "Shu dala prognozini yangilash",
                "Обновить прогноз поля",
                "Refresh this field forecast",
              )}
            </button>
            <p className="agro-caption">
              {p.demo ? "DEMO · " : "Open-Meteo · "}
              {weather
                ? formatDate(weather.fetchedAt, l)
                : pick(l, "Yuklanmoqda", "Загрузка", "Loading")}
            </p>
            <label>
              {pick(
                l,
                "Daladagi joriy faza",
                "Текущая фаза на поле",
                "Current field phase",
              )}
              <select
                value={phase}
                onChange={(e) => {
                  setPhase(e.target.value as typeof phase);
                  setConfirmed(false);
                }}
              >
                <option value="">
                  {pick(l, "Fazani tanlang", "Выберите фазу", "Choose phase")}
                </option>
                {waterPhases.map((s) => (
                  <option value={s} key={s}>
                    {profile?.phases[s][l] ?? stageLabel(l, s)}
                  </option>
                ))}
                <option value="harvest">
                  {pick(
                    l,
                    "Hosil yig‘ib olingan",
                    "Урожай убран",
                    "Harvest complete",
                  )}
                </option>
                <option value="dormant">
                  {pick(
                    l,
                    "Qishki tinim / faol o‘sish yo‘q",
                    "Зимний покой / нет роста",
                    "Dormancy / no active growth",
                  )}
                </option>
              </select>
            </label>
            <label className="planner-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={!phase}
              />
              {pick(
                l,
                "Tanlangan fazani dala kuzatuvi bilan tasdiqlayman",
                "Подтверждаю фазу по осмотру поля",
                "I confirm this phase from field observations",
              )}
            </label>
            <p className="agro-caption">
              {pick(
                l,
                "Bu vaqtinchalik ssenariy. Dala kartasiga yozish uchun ekin va fazani tahrirlang.",
                "Это временный сценарий. Для сохранения измените фазу в карточке поля.",
                "This is a temporary scenario. Edit the field profile to persist its phase.",
              )}
            </p>
            <button className="text-button" onClick={() => p.onEdit(field)}>
              {pick(
                l,
                "Dala va fazani tahrirlash",
                "Изменить поле и фазу",
                "Edit field and phase",
              )}
              <ArrowUpRight size={14} />
            </button>
            <label>
              {pick(
                l,
                "Sug‘orish samaradorligi, %",
                "Эффективность полива, %",
                "Application efficiency, %",
              )}
              <input
                type="number"
                min="30"
                max="100"
                step="1"
                value={
                  Number.isFinite(efficiency)
                    ? Math.round(efficiency * 100)
                    : ""
                }
                onChange={(e) =>
                  setEfficiency(
                    e.target.value === "" ? NaN : Number(e.target.value) / 100,
                  )
                }
              />
            </label>
            <p className="agro-caption">
              {t(l, field.irrigation_method)} ·{" "}
              {pick(
                l,
                "FAO boshlang‘ich taxmini; tizimingiz bo‘yicha aniqlashtiring. Kanal yo‘qotishlari kirmaydi.",
                "Исходная оценка FAO; уточните по вашей системе. Потери канала не включены.",
                "FAO reference assumption; adjust for your system. Canal losses are excluded.",
              )}
            </p>
            <label>
              {pick(
                l,
                "Prognoz yog‘inidan chegirma",
                "Учёт прогнозных осадков",
                "Forecast rain credit",
              )}
              <select
                value={rainCredit}
                onChange={(e) => setRainCredit(Number(e.target.value))}
              >
                <option value={0}>
                  {pick(
                    l,
                    "0% — tasdiqlanmagan yog‘inni ayirmaslik",
                    "0% — не вычитать прогнозный дождь",
                    "0% — do not subtract forecast rain",
                  )}
                </option>
                <option value={0.5}>
                  {pick(
                    l,
                    "50% — faqat ssenariy taxmini",
                    "50% — только сценарий",
                    "50% — scenario assumption only",
                  )}
                </option>
                <option value={0.8}>
                  {pick(
                    l,
                    "80% — faqat ssenariy taxmini",
                    "80% — только сценарий",
                    "80% — scenario assumption only",
                  )}
                </option>
              </select>
            </label>
            <label className="planner-check">
              <input
                type="checkbox"
                checked={special}
                onChange={(e) => setSpecial(e.target.checked)}
              />
              {pick(
                l,
                "Sho‘rlanish, sizot suvi yaqin yoki issiqxona sharoiti bor",
                "Есть засоление, близкие грунтовые воды или теплица",
                "Salinity, shallow groundwater or greenhouse conditions apply",
              )}
            </label>
          </div>
        </section>
        <section className="panel planner-result">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">FAO-56 · ET₀ × Kc</span>
              <h2>
                {pick(
                  l,
                  "7 kunlik suv budjeti",
                  "Водный бюджет на 7 дней",
                  "7-day water budget",
                )}
              </h2>
            </div>
            <Pill tone={ready && !special ? "green" : "amber"}>
              {pick(l, "Hisobiy reja", "Расчётный план", "Planning estimate")}
            </Pill>
          </div>
          <div className="planner-status" role="status">
            {special
              ? pick(
                  l,
                  "Bu sharoit uchun oddiy ETc modeli yetarli emas. Sonli budjet yashirildi; mahalliy agronom bilan tekshiring.",
                  "Для этих условий простого ETc недостаточно. Бюджет скрыт; уточните с местным агрономом.",
                  "A simple ETc model is insufficient for these conditions. Numeric budget is hidden; review locally.",
                )
              : message(plan.status, l)}
          </div>
          {ready && !special && (
            <>
              <div className="water-metrics">
                <div>
                  <small>
                    {pick(
                      l,
                      "Ekin suv sarfi ETc",
                      "Расход воды ETc",
                      "Crop water use ETc",
                    )}
                  </small>
                  <strong>
                    {range(plan.totals?.etc)} <span>mm</span>
                  </strong>
                </div>
                <div>
                  <small>
                    {pick(
                      l,
                      "Yog‘indan keyingi qoplash budjeti",
                      "Бюджет после учёта дождя",
                      "Replacement after rain credit",
                    )}
                  </small>
                  <strong>
                    {range(plan.totals?.net)} <span>mm</span>
                  </strong>
                </div>
                <div>
                  <small>
                    {field.area_hectares} ha ·{" "}
                    {pick(
                      l,
                      "yalpi reja hajmi",
                      "валовой бюджет",
                      "gross planning volume",
                    )}
                  </small>
                  <strong>
                    {range(plan.totals?.grossM3, 0)} <span>m³</span>
                  </strong>
                </div>
              </div>
              <div className="planner-equation">
                ETc = ET₀ × Kc {range(plan.kc, 2)}
                <br />
                {pick(
                  l,
                  "Kunlik qoplash = max(0, ETc − hisobga olingan yog‘in)",
                  "Суточное восполнение = max(0, ETc − учтённые осадки)",
                  "Daily replacement = max(0, ETc − credited rain)",
                )}
                <br />
                m³ = mm × 10 × ha ÷ {efficiency.toFixed(2)}
              </div>
              <p className="planner-boundary">
                {pick(
                  l,
                  "Bu hozir beriladigan suv dozasi emas. Tuproqdagi suv zaxirasi, oldingi sug‘orishning qolgan ta’siri, sizot suvi va sho‘r yuvish hisobga olinmagan. Kunlik jami prognoz ishlatiladi, bugungi qolgan soatlar hisobi emas.",
                  "Это не доза для немедленного внесения. Запасы почвы, остаток прошлого полива, грунтовые воды и промывка не учтены. Используются полные суточные прогнозы, не остаток часов сегодня.",
                  "This is not a dose to apply now. Soil reserves, residual irrigation, groundwater and salt leaching are not included. Forecasts are full calendar-day totals, not remaining hours today.",
                )}
              </p>
              <button className="button secondary" onClick={exportPlan}>
                <Download size={15} />
                {pick(
                  l,
                  "Rejani CSV yuklash",
                  "Скачать план CSV",
                  "Download plan CSV",
                )}
              </button>
            </>
          )}
          <div className="planner-next">
            <h3>{pick(l, "Keyingi qadam", "Следующий шаг", "Next action")}</h3>
            <p>
              {ready
                ? pick(
                    l,
                    "Ildiz atrofidagi tuproq namligini qo‘lda tekshiring, oxirgi sug‘orish va suv yetkazish navbatini hisobga oling. Rejalangan hajmni bitta sug‘orish sifatida qo‘llamang.",
                    "Проверьте влажность корневой зоны вручную, последний полив и очередь подачи воды. Не вносите весь бюджет за один полив.",
                    "Check root-zone moisture manually, recent irrigation and water delivery turns. Do not apply the whole budget as one irrigation.",
                  )
                : pick(
                    l,
                    "Fazani va mavjud prognozni tekshiring. Apparat ulash shart emas.",
                    "Проверьте фазу и прогноз. Подключать датчик не обязательно.",
                    "Check phase and forecast. Connecting a device is not required.",
                  )}
            </p>
            <button
              className="text-button"
              disabled={p.demo}
              onClick={() => p.onRecord(field)}
            >
              {pick(
                l,
                "Bajarilgan sug‘orishni qayd etish",
                "Записать выполненный полив",
                "Record completed irrigation",
              )}
              <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
      </div>
      {ready && !special && (
        <>
          <div className="planner-alerts">
            {plan.flags.map((flag) => (
              <div className="notice" key={flag}>
                {pick(
                  l,
                  ...(
                    {
                      rain: [
                        "Yog‘in kutilmoqda: amalda tushgan yog‘inni tekshirib, rejani yangilang.",
                        "Ожидается дождь: проверьте фактические осадки и обновите план.",
                        "Rain is forecast: verify observed rain and update the plan.",
                      ],
                      heat: [
                        "35°C va yuqori issiqlik signali. Bu ekin zararlangani tashxisi emas; dalani tekshiring.",
                        "Прогноз ≥35°C. Это не диагноз повреждения; осмотрите поле.",
                        "Forecast ≥35°C. This is not a damage diagnosis; inspect the field.",
                      ],
                      frost: [
                        "0°C yoki past sovuq signali. Faol fazani qayta tekshiring; sug‘orish ishini avtomatik boshlamang.",
                        "Прогноз ≤0°C. Проверьте активную фазу; не запускайте полив автоматически.",
                        "Forecast ≤0°C. Recheck active growth; do not start irrigation automatically.",
                      ],
                      recent_watering: [
                        "Oxirgi 48 soatda sug‘orish qaydi bor. Tuproqdagi qolgan suv miqdori bu modelda noma’lum.",
                        "Есть полив за последние 48 часов. Остаток воды в почве модели неизвестен.",
                        "Irrigation recorded in the last 48 hours. Residual soil water is unknown to this model.",
                      ],
                      late: [
                        "Mavsum oxiri: hosil turi va yig‘im vaqtiga moslab tekshiring; umumiy to‘xtatish sanasi qo‘llanmaydi.",
                        "Конец сезона: учитывайте урожай и уборку; универсальной даты отключения нет.",
                        "Late season: consider harvest type and timing; no universal cut-off is applied.",
                      ],
                    } satisfies Record<string, [string, string, string]>
                  )[flag],
                )}
              </div>
            ))}
          </div>
          <section className="panel">
            <div className="panel-heading">
              <h2>
                {pick(
                  l,
                  "Kunlik hisob",
                  "Суточный расчёт",
                  "Daily calculation",
                )}
              </h2>
              <small>
                {p.demo ? "DEMO · " : ""}Asia/Tashkent · {plan.days[0]?.date} —{" "}
                {plan.days.at(-1)?.date}
              </small>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      pick(l, "Sana", "Дата", "Date"),
                      "ET₀ mm",
                      pick(l, "Yog‘in mm", "Осадки мм", "Rain mm"),
                      "ETc mm",
                      pick(l, "Qoplash mm", "Восполнение мм", "Replacement mm"),
                      pick(l, "Reja m³", "Бюджет м³", "Budget m³"),
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plan.days.map((d) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td>{d.et0.toFixed(1)}</td>
                      <td>{d.rain.toFixed(1)}</td>
                      <td>{range(d.etc)}</td>
                      <td>{range(d.net)}</td>
                      <td>{range(d.grossM3, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      {plan.lastWatering && (
        <p className="agro-caption">
          {pick(l, "Oxirgi qayd", "Последняя запись", "Last record")}:{" "}
          {plan.lastWatering.watered_at.slice(0, 10)} ·{" "}
          {plan.lastWatering.water_volume_m3} m³.{" "}
          {pick(
            l,
            "Jurnal bajarilgan ish, reja esa prognoz.",
            "Журнал — выполненная работа, план — прогноз.",
            "The journal is completed work; the plan is a forecast.",
          )}
        </p>
      )}
      {profile && (
        <CropPhaseGuide profile={profile} lang={l} selected={phase || null} />
      )}
      <p className="agro-caption">
        {pick(
          l,
          "Parametrlar bu sahifadagi ssenariy uchun. Kc diapazoni statistik ishonch oralig‘i emas; mahalliy o‘lchovlar bilan kalibrlash kerak.",
          "Параметры действуют для сценария на странице. Диапазон Kc не является статистическим интервалом; нужна местная калибровка.",
          "Parameters apply to this page scenario. The Kc range is not a statistical confidence interval; local calibration is needed.",
        )}
      </p>
    </>
  );
}
