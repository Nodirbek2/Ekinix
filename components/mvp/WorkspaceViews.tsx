"use client";
import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CloudRain,
  Download,
  Droplets,
  FileText,
  Layers,
  Leaf,
  List,
  Map,
  MapPin,
  MoreHorizontal,
  Plus,
  Satellite,
  Search,
  Sun,
  Thermometer,
  TriangleAlert,
  Wind,
} from "lucide-react";
import {
  cropLabel,
  formatDate,
  growthStage,
  pick,
  type Field,
  type Lang,
  type Monitoring,
  type Observation,
  type Watering,
  type WeatherDay,
} from "@/lib/domain";
import { stageLabel, t } from "@/lib/copy";
import {
  downloadCsv,
  fieldColors,
  fieldExport,
  signals,
  type Section,
} from "@/lib/workspace";
import { Value } from "./ui";
const PortfolioMap = dynamic(() => import("./PortfolioMap"), {
  ssr: false,
  loading: () => <div className="map-skeleton" />,
});
export type ViewProps = {
  fields: Field[];
  data: Record<string, Monitoring>;
  water: Watering[];
  lang: Lang;
  demo: boolean;
  busy: boolean;
  onOpen: (id: string) => void;
  onAdd: () => void;
  onEdit: (f: Field) => void;
  onArchive: (f: Field) => void;
  onRecord: (f: Field) => void;
  onLoad: (id: string) => void;
  onNavigate: (s: Section) => void;
};
function rainTotal(
  days: WeatherDay[] | undefined,
  minimumDays = 1,
): number | null {
  if (
    !days ||
    days.length < minimumDays ||
    days.some((d) => d.rainMm === null || !Number.isFinite(d.rainMm))
  )
    return null;
  return days.reduce((total, d) => total + d.rainMm!, 0);
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  );
}
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "blue";
}) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}
export function FieldPicker({
  fields,
  value,
  onChange,
  lang,
}: {
  fields: Field[];
  value: string;
  onChange: (id: string) => void;
  lang: Lang;
}) {
  return (
    <label className="field-picker">
      <MapPin size={15} />
      <span className="sr-only">
        {pick(lang, "Dala tanlang", "Выберите поле", "Select field")}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {fields.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function EmptyFields({
  lang,
  onAdd,
}: {
  lang: Lang;
  onAdd: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-map-symbol">
        <Map size={34} />
      </div>
      <h2>
        {pick(
          lang,
          "Ferma xaritangizdan boshlang",
          "Начните с карты хозяйства",
          "Start with your farm map",
        )}
      </h2>
      <p>
        {pick(
          lang,
          "Birinchi dalani belgilang. Ob-havo, sun’iy yo‘ldosh va mavsum kuzatuvlari shu dala bilan bog‘lanadi.",
          "Добавьте первое поле, чтобы связать с ним прогноз, спутниковые наблюдения и сезон.",
          "Add a field to connect forecasts, satellite observations, and the growing season.",
        )}
      </p>
      <button className="button primary" onClick={onAdd}>
        <Plus size={16} />
        {t(lang, "addField")}
      </button>
    </div>
  );
}
export function NDVIChart({
  observations,
  lang,
}: {
  observations: Observation[];
  lang: Lang;
}) {
  if (!observations.length)
    return (
      <div className="no-observations">
        <Satellite size={26} />
        <p>
          {pick(
            lang,
            "Yaroqli kuzatuv hali yo‘q",
            "Пока нет пригодных наблюдений",
            "No usable observation yet",
          )}
        </p>
        <small>
          {pick(
            lang,
            "Bulutli tasvirlar chiqarib tashlanadi.",
            "Облачные наблюдения исключаются.",
            "Cloud-contaminated observations are excluded.",
          )}
        </small>
      </div>
    );
  return (
    <div className="chart-container">
      <div className="chart-y">
        <span>1.0</span>
        <span>0.5</span>
        <span>0.0</span>
        <span>−1.0</span>
      </div>
      <div className="chart-area">
        <svg
          viewBox="0 0 600 180"
          preserveAspectRatio="none"
          role="img"
          aria-label={pick(
            lang,
            "NDVI tarixi, −1 dan 1 gacha",
            "История NDVI от −1 до 1",
            "NDVI history from −1 to 1",
          )}
        >
          <path
            d="M0 10H600M0 50H600M0 90H600M0 170H600"
            stroke="#e8ecef"
            strokeDasharray="4 5"
          />
          <path
            d={`M${observations.map((o, i) => `${(i * 580) / Math.max(1, observations.length - 1) + 10},${90 - o.ndvi * 80}`).join(" L")} L${observations.length === 1 ? 10 : 590},170 L10,170Z`}
            fill="#edf5f0"
          />
          <polyline
            points={observations
              .map(
                (o, i) =>
                  `${(i * 580) / Math.max(1, observations.length - 1) + 10},${90 - o.ndvi * 80}`,
              )
              .join(" ")}
            fill="none"
            stroke="#2d8066"
            strokeWidth="2.5"
          />
          {observations.map((o, i) => (
            <circle
              key={o.date}
              cx={(i * 580) / Math.max(1, observations.length - 1) + 10}
              cy={90 - o.ndvi * 80}
              r="4"
              fill="#fff"
              stroke="#2d8066"
              strokeWidth="2"
            >
              <title>
                {o.date}: {o.ndvi} · {o.validPercent}%
              </title>
            </circle>
          ))}
        </svg>
        <div className="chart-x">
          <span>{observations[0].date}</span>
          <span>{observations.at(-1)?.date}</span>
        </div>
      </div>
    </div>
  );
}
export function FarmOverview(p: ViewProps) {
  const { fields, data, lang, onNavigate, onOpen, onAdd } = p;
  const attention = signals(fields, data, lang);
  const observed = fields.filter(
    (f) => data[f.id]?.satellite.observations.length,
  ).length;
  const area = fields.reduce((s, f) => s + f.area_hectares, 0);
  const cropsCount = new Set(fields.map((f) => f.crop_type)).size;
  return (
    <>
      <PageHeading
        eyebrow={pick(
          lang,
          "FERMA MARKAZI",
          "ЦЕНТР ХОЗЯЙСТВА",
          "FARM OPERATIONS",
        )}
        title={pick(
          lang,
          "Butun ferma. Bitta manzara.",
          "Всё хозяйство. Единая картина.",
          "Your farm, at a glance.",
        )}
        description={pick(
          lang,
          "Dalalar, mavsum va e’tibor talab qiladigan kuzatuvlar.",
          "Поля, сезон и наблюдения, требующие внимания.",
          "Fields, the growing season, and observations that need your attention.",
        )}
      >
        <button className="button primary" onClick={onAdd}>
          <Plus size={16} />
          {t(lang, "addField")}
        </button>
      </PageHeading>
      <div className="stat-row">
        {[
          [
            Layers,
            fields.length,
            pick(lang, "Faol dala", "Активных полей", "Active fields"),
            pick(
              lang,
              "Ferma portfeli",
              "Портфель хозяйства",
              "Farm portfolio",
            ),
          ],
          [
            Map,
            `${area.toFixed(1)} ha`,
            pick(lang, "Umumiy maydon", "Общая площадь", "Total area"),
            `${cropsCount} ${pick(lang, "turdagi ekin", "видов культур", "crop types")}`,
          ],
          [
            Satellite,
            `${observed} / ${fields.length}`,
            pick(
              lang,
              "Kuzatuvi bor dalalar",
              "Поля с наблюдениями",
              "Fields with observations",
            ),
            p.busy
              ? pick(lang, "Yuklanmoqda", "Загрузка", "Loading")
              : p.demo
                ? pick(
                    lang,
                    "Namunaviy kuzatuvlar",
                    "Демонстрационные наблюдения",
                    "Example observations",
                  )
                : pick(
                    lang,
                    "Haqiqiy sun’iy yo‘ldosh ma’lumoti",
                    "Реальные спутниковые данные",
                    "Actual satellite observations",
                  ),
          ],
          [
            TriangleAlert,
            attention.length,
            pick(lang, "Tekshirish kerak", "Требуют внимания", "Review items"),
            pick(
              lang,
              "Prognoz va dala ma’lumotlari",
              "Прогноз и данные полей",
              "Forecast and field context",
            ),
          ],
        ].map(([Icon, value, label, sub], i) => {
          const I = Icon as typeof Layers;
          return (
            <div className="stat" key={i}>
              <div className="stat-top">
                <span>{label as string}</span>
                <I size={17} />
              </div>
              <strong>{value as string | number}</strong>
              <small>{sub as string}</small>
            </div>
          );
        })}
      </div>
      {!fields.length ? (
        <EmptyFields lang={lang} onAdd={onAdd} />
      ) : (
        <>
          <div className="overview-grid">
            <section className="panel farm-map-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {pick(
                      lang,
                      "Ferma xaritasi",
                      "Карта хозяйства",
                      "Farm map",
                    )}
                  </h2>
                  <p>
                    {fields.length}{" "}
                    {pick(
                      lang,
                      "dala chegarasi",
                      "границ полей",
                      "field boundaries",
                    )}
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => onNavigate("fields")}
                >
                  {pick(
                    lang,
                    "Dalalarni boshqarish",
                    "Управлять полями",
                    "Manage fields",
                  )}
                  <ArrowUpRight size={14} />
                </button>
              </div>
              <PortfolioMap fields={fields} lang={lang} onSelect={onOpen} />
              <div className="map-legend">
                {fields.slice(0, 4).map((f, i) => (
                  <button key={f.id} onClick={() => onOpen(f.id)}>
                    <i
                      style={{
                        background: fieldColors[i % fieldColors.length],
                      }}
                    />
                    {f.name}
                    <span>{f.area_hectares} ha</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="panel attention-panel">
              <div className="panel-heading">
                <h2>
                  {pick(
                    lang,
                    "E’tibor markazida",
                    "В центре внимания",
                    "On your radar",
                  )}
                </h2>
                <Pill tone={attention.length ? "amber" : "green"}>
                  {attention.length}
                </Pill>
              </div>
              {attention.length ? (
                attention.map((a, i) => (
                  <button
                    key={`${a.field.id}-${i}`}
                    className="attention-item"
                    onClick={() => onOpen(a.field.id)}
                  >
                    <span className={`attention-icon ${a.kind}`}>
                      <TriangleAlert size={17} />
                    </span>
                    <span>
                      <small>{a.field.name}</small>
                      <strong>{a.title}</strong>
                      <p>{a.detail}</p>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))
              ) : (
                <div className="quiet-state">
                  <Check size={26} />
                  <strong>
                    {pick(
                      lang,
                      "Hozircha tekshiruv belgisi yo‘q",
                      "Нет отмеченных событий",
                      "No review items flagged",
                    )}
                  </strong>
                  <p>
                    {pick(
                      lang,
                      "Bu dalaning sog‘lomligi tasdig‘i emas. Yangi kuzatuvlar shu yerda aks etadi.",
                      "Это не подтверждение здоровья поля. Новые наблюдения появятся здесь.",
                      "This does not certify crop health. New observations will appear here.",
                    )}
                  </p>
                </div>
              )}
              <button
                className="panel-bottom-link"
                onClick={() => onNavigate("weather")}
              >
                <CloudRain size={16} />
                {pick(
                  lang,
                  "7 kunlik ob-havoni ochish",
                  "Открыть прогноз на 7 дней",
                  "Open the 7-day forecast",
                )}
                <ArrowRight size={15} />
              </button>
            </section>
          </div>
          <section className="panel season-panel">
            <div className="panel-heading">
              <div>
                <h2>
                  {pick(
                    lang,
                    "Mavsum holati",
                    "Состояние сезона",
                    "Season overview",
                  )}
                </h2>
                <p>
                  {pick(
                    lang,
                    "Ekin va bosqichlar bo‘yicha dala tarkibi",
                    "Поля по культурам и стадиям роста",
                    "Your fields by crop and growing stage",
                  )}
                </p>
              </div>
              <button
                className="text-button"
                onClick={() => onNavigate("guide")}
              >
                {pick(
                  lang,
                  "Ekin qo‘llanmasi",
                  "Справочник культур",
                  "Crop guide",
                )}
                <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="season-grid">
              {fields.slice(0, 6).map((f, i) => (
                <button
                  className="season-field"
                  key={f.id}
                  onClick={() => onOpen(f.id)}
                >
                  <span
                    className="crop-square"
                    style={{
                      background: fieldColors[i % fieldColors.length] + "18",
                      color: fieldColors[i % fieldColors.length],
                    }}
                  >
                    <Leaf size={21} />
                  </span>
                  <span>
                    <strong>{f.name}</strong>
                    <small>
                      {cropLabel(f.crop_type, lang)} · {f.area_hectares} ha
                    </small>
                    <span className="stage-track">
                      {["initial", "development", "mid", "late", "harvest"].map(
                        (s, j) => (
                          <i
                            className={
                              j <=
                              [
                                "initial",
                                "development",
                                "mid",
                                "late",
                                "harvest",
                              ].indexOf(growthStage(f).stage ?? "")
                                ? "filled"
                                : ""
                            }
                            key={s}
                          />
                        ),
                      )}
                    </span>
                    <small>{stageLabel(lang, growthStage(f).stage)}</small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
export function FieldsView(p: ViewProps & { archived: Field[] }) {
  const { lang, fields, onOpen, onEdit, onArchive, onAdd } = p;
  const [query, setQuery] = useState(""),
    [mode, setMode] = useState<"list" | "map">("list"),
    [archived, setArchived] = useState(false);
  const rows = (archived ? p.archived : fields).filter((f) =>
    `${f.name} ${cropLabel(f.crop_type, lang)} ${f.region}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow={pick(
          lang,
          "DALA BOSHQARUVI",
          "УПРАВЛЕНИЕ ПОЛЯМИ",
          "FIELD MANAGEMENT",
        )}
        title={sectionNameLocal(lang, "fields")}
        description={pick(
          lang,
          "Chegaralar, ekinlar va mavsum ma’lumotlarini boshqaring.",
          "Управляйте границами, культурами и данными сезона.",
          "Manage boundaries, crops, and growing-season details.",
        )}
      >
        <button
          className="button secondary"
          onClick={() => fieldExport(rows, lang)}
        >
          <Download size={15} />
          {t(lang, "export")}
        </button>
        <button className="button primary" onClick={onAdd}>
          <Plus size={16} />
          {t(lang, "addField")}
        </button>
      </PageHeading>
      <div className="panel">
        <div className="field-controls">
          <div className="segmented">
            <button
              className={!archived ? "active" : ""}
              onClick={() => setArchived(false)}
            >
              {pick(lang, "Faol dalalar", "Активные", "Active fields")}{" "}
              <span>{fields.length}</span>
            </button>
            <button
              className={archived ? "active" : ""}
              onClick={() => setArchived(true)}
            >
              {t(lang, "archived")} <span>{p.archived.length}</span>
            </button>
          </div>
          <div className="row">
            <label className="search-box">
              <Search size={16} />
              <input
                aria-label={pick(
                  lang,
                  "Dalani qidirish",
                  "Поиск поля",
                  "Search fields",
                )}
                placeholder={pick(
                  lang,
                  "Dala yoki ekin nomi",
                  "Поле или культура",
                  "Field or crop name",
                )}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="view-toggle">
              <button
                aria-label={pick(lang, "Ro‘yxat", "Список", "List view")}
                className={mode === "list" ? "active" : ""}
                onClick={() => setMode("list")}
              >
                <List size={17} />
              </button>
              <button
                aria-label={pick(lang, "Xarita", "Карта", "Map view")}
                className={mode === "map" ? "active" : ""}
                onClick={() => setMode("map")}
              >
                <Map size={17} />
              </button>
            </div>
          </div>
        </div>
        {mode === "map" && rows.length > 0 && (
          <PortfolioMap fields={rows} lang={lang} onSelect={onOpen} />
        )}
        <div className="table-scroll">
          <table className="field-table">
            <thead>
              <tr>
                <th>{pick(lang, "DALA", "ПОЛЕ", "FIELD")}</th>
                <th>{pick(lang, "EKIN", "КУЛЬТУРА", "CROP")}</th>
                <th>{pick(lang, "MAYDON", "ПЛОЩАДЬ", "AREA")}</th>
                <th>{pick(lang, "EKILGAN SANA", "ДАТА ПОСАДКИ", "PLANTED")}</th>
                <th>{pick(lang, "BOSQICH", "СТАДИЯ", "STAGE")}</th>
                <th>
                  <span className="sr-only">
                    {pick(lang, "Amallar", "Действия", "Actions")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => (
                <tr key={f.id}>
                  <td>
                    <button
                      className="field-name-button"
                      disabled={archived}
                      onClick={() => onOpen(f.id)}
                    >
                      <span
                        className="field-symbol"
                        style={{ color: fieldColors[i % fieldColors.length] }}
                      >
                        <Layers size={19} />
                      </span>
                      <span>
                        <strong>{f.name}</strong>
                        <small>{f.region}</small>
                      </span>
                    </button>
                  </td>
                  <td>{cropLabel(f.crop_type, lang)}</td>
                  <td className="numeric">
                    {f.area_hectares} <small>ha</small>
                  </td>
                  <td>{f.planting_date ?? "—"}</td>
                  <td>
                    <Pill>{stageLabel(lang, growthStage(f).stage)}</Pill>
                  </td>
                  <td>
                    <details className="row-menu">
                      <summary
                        aria-label={pick(
                          lang,
                          "Dala amallari",
                          "Действия с полем",
                          "Field actions",
                        )}
                      >
                        <MoreHorizontal size={19} />
                      </summary>
                      <div>
                        <button disabled={p.demo} onClick={() => onEdit(f)}>
                          {t(lang, "edit")}
                        </button>
                        <button disabled={p.demo} onClick={() => onArchive(f)}>
                          {t(lang, f.archived_at ? "restore" : "archive")}
                        </button>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="table-empty">
            {pick(
              lang,
              "Bu ro‘yxatda dala yo‘q.",
              "Здесь пока нет полей.",
              "No fields in this view.",
            )}
            {!fields.length && !query && !archived && (
              <button className="text-button" onClick={onAdd}>
                {t(lang, "addField")}
                <Plus size={15} />
              </button>
            )}
          </div>
        )}
        <div className="table-footer">
          <span>
            {rows.length} {pick(lang, "dala", "полей", "fields")}
          </span>
          <span>
            {rows.reduce((s, f) => s + f.area_hectares, 0).toFixed(1)} ha
          </span>
        </div>
      </div>
    </>
  );
}
function sectionNameLocal(
  l: Lang,
  s: "fields" | "satellite" | "weather" | "irrigation" | "reports",
) {
  return pick(
    l,
    ...(
      {
        fields: ["Dalalar", "Поля", "Fields"],
        satellite: [
          "Sun’iy yo‘ldosh monitoringi",
          "Спутниковый мониторинг",
          "Satellite monitoring",
        ],
        weather: [
          "Ob-havo va dala sharoiti",
          "Погода и условия поля",
          "Weather & field conditions",
        ],
        irrigation: [
          "Sug‘orish jurnali",
          "Журнал полива",
          "Irrigation journal",
        ],
        reports: ["Ferma hisobotlari", "Отчёты хозяйства", "Farm reports"],
      } satisfies Record<typeof s, [string, string, string]>
    )[s],
  );
}
export function WeatherPanel({
  monitoring,
  lang,
  busy = false,
}: {
  monitoring?: Monitoring;
  lang: Lang;
  busy?: boolean;
}) {
  const w = monitoring?.weather;
  return w?.status === "available" ? (
    <>
      <div className="weather-summary">
        <div className="weather-current">
          <Sun size={38} />
          <div>
            <strong>
              <Value value={w.temperature} unit="°C" />
            </strong>
            <span>
              {pick(
                lang,
                "Joriy model harorati",
                "Текущая температура модели",
                "Current modeled temperature",
              )}
            </span>
          </div>
        </div>
        <div>
          <small>
            {pick(
              lang,
              "7 kunda yog‘in",
              "Осадки за 7 дней",
              "7-day precipitation",
            )}
          </small>
          <strong>
            <Value value={rainTotal(w.days)} unit="mm" />
          </strong>
        </div>
        <div>
          <small>
            {pick(lang, "O‘rtacha ET₀", "Среднее ET₀", "Average ET₀")}
          </small>
          <strong>
            <Value
              value={
                w.days.every((d) => d.et0 !== null)
                  ? w.days.reduce((s, d) => s + d.et0!, 0) / w.days.length
                  : null
              }
              unit="mm / day"
            />
          </strong>
        </div>
      </div>
      <div className="forecast-list">
        {w.days.map((d) => (
          <div className="forecast-day" key={d.date}>
            <span>{formatDate(d.date + "T12:00:00Z", lang, true)}</span>
            {(d.rainMm ?? 0) > 0 ? <CloudRain size={24} /> : <Sun size={24} />}
            <strong>{d.max ?? "—"}°</strong>
            <small>{d.min ?? "—"}°</small>
            <div className="rain-bar">
              <i
                style={{
                  height: Math.max(2, Math.min(50, (d.rainMm ?? 0) * 5)),
                }}
              />
            </div>
            <span className="rain-value">{d.rainMm ?? "—"} mm</span>
            <small>{d.rainProbability ?? "—"}%</small>
          </div>
        ))}
      </div>
      <div className="source-line">
        Open-Meteo ·{" "}
        {pick(lang, "Model yangilangan", "Обновлено", "Model updated")}:{" "}
        {w.modelTime ? formatDate(w.modelTime, lang) : "—"}
      </div>
    </>
  ) : (
    <div className="no-observations">
      <CloudRain size={30} />
      <p>
        {busy
          ? t(lang, "loading")
          : pick(
              lang,
              "Prognoz hozir mavjud emas",
              "Прогноз сейчас недоступен",
              "Forecast is currently unavailable",
            )}
      </p>
    </div>
  );
}
export function WeatherView(p: ViewProps) {
  const [id, setId] = useState(p.fields[0]?.id ?? "");
  const field = p.fields.find((f) => f.id === id) ?? p.fields[0];
  const w = field ? p.data[field.id]?.weather : undefined;
  const rain = w?.days
    .slice(0, 2)
    .some((d) => (d.rainMm ?? 0) >= 5 && (d.rainProbability ?? 0) >= 60);
  return (
    <>
      <PageHeading
        eyebrow="OPEN-METEO"
        title={sectionNameLocal(p.lang, "weather")}
        description={pick(
          p.lang,
          "Har bir dala joylashuvi uchun prognoz va rejalash ko‘rsatkichlari.",
          "Прогноз и показатели планирования для каждого поля.",
          "Forecasts and planning indicators for each field location.",
        )}
      >
        {field && (
          <FieldPicker
            fields={p.fields}
            value={field.id}
            onChange={(id) => {
              setId(id);
              p.onLoad(id);
            }}
            lang={p.lang}
          />
        )}
      </PageHeading>
      {field ? (
        <>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>{field.name}</h2>
                <p>{field.region}</p>
              </div>
              <Pill tone="blue">{t(p.lang, "forecast")}</Pill>
            </div>
            <WeatherPanel
              monitoring={p.data[field.id]}
              lang={p.lang}
              busy={p.busy}
            />
          </section>
          <div className="three-notes">
            <article>
              <CloudRain size={21} />
              <h3>
                {pick(
                  p.lang,
                  "Sug‘orish oynasi",
                  "Окно полива",
                  "Irrigation window",
                )}
              </h3>
              <p>
                {rain
                  ? pick(
                      p.lang,
                      "Yaqin ikki kunda yomg‘ir ehtimoli yuqori. Sug‘orishni boshlashdan oldin prognozni qayta tekshiring.",
                      "В ближайшие два дня возможны осадки. Перепроверьте прогноз перед поливом.",
                      "Rain is likely in the next two days. Recheck the forecast before irrigating.",
                    )
                  : pick(
                      p.lang,
                      "Yog‘in prognozini dala holati va ekin bosqichi bilan birga baholang.",
                      "Оценивайте осадки вместе с состоянием поля и стадией культуры.",
                      "Assess forecast rain alongside field conditions and the crop stage.",
                    )}
              </p>
            </article>
            <article>
              <Thermometer size={21} />
              <h3>
                {pick(
                  p.lang,
                  "Haroratga e’tibor",
                  "Температура",
                  "Temperature context",
                )}
              </h3>
              <p>
                {pick(
                  p.lang,
                  "Sovuq yoki issiq kunlarda dalani ko‘zdan kechirishni rejalang. Prognoz daladagi o‘lchov emas.",
                  "Планируйте осмотр поля при холоде или жаре. Прогноз не является измерением.",
                  "Plan field checks around cold or hot days. A forecast is not an on-site measurement.",
                )}
              </p>
            </article>
            <article>
              <Wind size={21} />
              <h3>
                {pick(
                  p.lang,
                  "ET₀ nimani bildiradi?",
                  "Что означает ET₀?",
                  "What does ET₀ tell you?",
                )}
              </h3>
              <p>
                {pick(
                  p.lang,
                  "Etalon bug‘lanish — atmosfera suv talabining ko‘rsatkichi. Bu dalaga berilishi kerak bo‘lgan suv hajmi emas.",
                  "Эталонная испаряемость показывает спрос атмосферы на воду, а не норму полива.",
                  "Reference evapotranspiration indicates atmospheric water demand, not the water volume your field needs.",
                )}
              </p>
            </article>
          </div>
        </>
      ) : (
        <EmptyFields lang={p.lang} onAdd={p.onAdd} />
      )}
    </>
  );
}
export function SatelliteView(p: ViewProps) {
  const [id, setId] = useState(p.fields[0]?.id ?? "");
  const field = p.fields.find((f) => f.id === id) ?? p.fields[0];
  const m = field ? p.data[field.id] : undefined;
  const obs = m?.satellite.observations ?? [],
    last = obs.at(-1),
    previous = obs.at(-2),
    delta = last && previous ? last.ndvi - previous.ndvi : null;
  return (
    <>
      <PageHeading
        eyebrow="SENTINEL-2 · VEGETATION"
        title={sectionNameLocal(p.lang, "satellite")}
        description={pick(
          p.lang,
          "Dala bo‘yicha vegetatsiya dinamikasi va tasvirlarning yaroqlilik darajasi.",
          "Динамика растительности и пригодность наблюдений по полю.",
          "Field vegetation trends and observation quality, with acquisition dates.",
        )}
      >
        {field && (
          <FieldPicker
            fields={p.fields}
            value={field.id}
            onChange={(id) => {
              setId(id);
              p.onLoad(id);
            }}
            lang={p.lang}
          />
        )}
      </PageHeading>
      {field ? (
        <>
          <div className="satellite-layout">
            <section className="panel satellite-map">
              <PortfolioMap
                fields={[field]}
                selected={field.id}
                lang={p.lang}
              />
              <div className="map-analysis-caption">
                <Satellite size={18} />
                <span>
                  <strong>{field.name}</strong>
                  <small>
                    {pick(
                      p.lang,
                      "NDVI quyidagi grafikda · xarita bazaviy tasvir",
                      "NDVI на графике · карта базовая",
                      "NDVI is in the chart · map shows basemap imagery",
                    )}
                  </small>
                </span>
              </div>
            </section>
            <div className="satellite-summary">
              <section className="panel">
                <span className="eyebrow">
                  {pick(
                    p.lang,
                    "OXIRGI KUZATUV",
                    "ПОСЛЕДНЕЕ НАБЛЮДЕНИЕ",
                    "LATEST OBSERVATION",
                  )}
                </span>
                <div className="ndvi-big">
                  {last?.ndvi.toFixed(3) ?? "—"}
                  <small>NDVI</small>
                </div>
                <p>
                  {last?.date ??
                    (p.busy ? t(p.lang, "loading") : t(p.lang, "unknown"))}
                </p>
                <div className="observation-quality">
                  <span>
                    {pick(
                      p.lang,
                      "Yaroqli piksellar",
                      "Пригодные пиксели",
                      "Usable pixels",
                    )}
                  </span>
                  <strong>{last ? `${last.validPercent}%` : "—"}</strong>
                </div>
                <div className="quality-bar">
                  <i style={{ width: `${last?.validPercent ?? 0}%` }} />
                </div>
                <div className="observation-quality">
                  <span>
                    {pick(
                      p.lang,
                      "Oldingi kuzatuvdan farq",
                      "Изменение к предыдущему",
                      "Change since previous",
                    )}
                  </span>
                  <strong>
                    {delta === null
                      ? "—"
                      : `${delta > 0 ? "+" : ""}${delta.toFixed(3)}`}
                  </strong>
                </div>
              </section>
              <div className="analysis-note">
                <Leaf size={21} />
                <p>
                  {pick(
                    p.lang,
                    "NDVI o‘simlik qoplamidagi o‘zgarishni ko‘rsatadi. Pasayish kasallik tashxisi emas: terim, fenologiya yoki dala sharoiti sabab bo‘lishi mumkin.",
                    "NDVI показывает изменение растительности. Снижение не является диагнозом: возможны уборка, фенология или условия поля.",
                    "NDVI shows changes in vegetation. A decrease is not a disease diagnosis: harvest, growth stage, or field conditions may explain it.",
                  )}
                </p>
              </div>
            </div>
          </div>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  {pick(
                    p.lang,
                    "Vegetatsiya dinamikasi",
                    "Динамика растительности",
                    "Vegetation trend",
                  )}
                </h2>
                <p>
                  {obs.length}{" "}
                  {p.demo
                    ? pick(
                        p.lang,
                        "namunaviy kuzatuv",
                        "примерных наблюдений",
                        "example observations",
                      )
                    : pick(
                        p.lang,
                        "haqiqiy kuzatuv",
                        "реальных наблюдений",
                        "actual observations",
                      )}
                </p>
              </div>
              <button
                className="button secondary small"
                disabled={!obs.length}
                onClick={() =>
                  downloadCsv("ekinix-ndvi.csv", [
                    ["date", "NDVI", "usable_pixels_percent"],
                    ...obs.map((o) => [o.date, o.ndvi, o.validPercent]),
                  ])
                }
              >
                <Download size={14} />
                CSV
              </button>
            </div>
            <NDVIChart observations={obs} lang={p.lang} />
            <div className="source-line">
              Sentinel-2 ·{" "}
              {m?.satellite.source === "earth-search"
                ? "Earth Search / Element 84"
                : "Copernicus"}{" "}
              ·{" "}
              {pick(
                p.lang,
                "Kamida 50% yaroqli piksel",
                "Не менее 50% пригодных пикселей",
                "At least 50% usable pixels",
              )}
            </div>
          </section>
        </>
      ) : (
        <EmptyFields lang={p.lang} onAdd={p.onAdd} />
      )}
    </>
  );
}
export function JournalView(p: ViewProps) {
  const [filter, setFilter] = useState("all");
  const rows = p.water.filter((w) => filter === "all" || w.field_id === filter);
  const total = rows.reduce((s, w) => s + w.water_volume_m3, 0);
  return (
    <>
      <PageHeading
        eyebrow={pick(p.lang, "SUV HISOBI", "УЧЁТ ВОДЫ", "WATER RECORDS")}
        title={sectionNameLocal(p.lang, "irrigation")}
        description={pick(
          p.lang,
          "Amalda berilgan suvni qayd eting va dalalar bo‘yicha taqqoslang.",
          "Записывайте фактически поданную воду и сравнивайте поля.",
          "Record water actually applied and compare your fields.",
        )}
      >
        <button
          className="button primary"
          disabled={!p.fields.length || p.demo}
          onClick={() => {
            const f = p.fields.find((f) => f.id === filter) ?? p.fields[0];
            if (f) p.onRecord(f);
          }}
        >
          <Plus size={16} />
          {t(p.lang, "recordWater")}
        </button>
      </PageHeading>
      <div className="journal-intro">
        <div>
          <Droplets size={25} />
          <div>
            <strong>
              {total.toLocaleString()} <small>m³</small>
            </strong>
            <span>
              {pick(
                p.lang,
                "Ko‘rsatilgan qaydlardagi jami suv",
                "Сумма показанных записей",
                "Total water in displayed records",
              )}
            </span>
          </div>
        </div>
        <div>
          <strong>{rows.length}</strong>
          <span>
            {pick(
              p.lang,
              "Sug‘orish qaydi",
              "Записей полива",
              "Irrigation records",
            )}
          </span>
        </div>
        <p>
          {pick(
            p.lang,
            "Sensor ulash shart emas. Bu jurnal bajarilgan ishlar uchun; namlik o‘lchovisiz aniq suv me’yori hisoblanmaydi.",
            "Датчик не требуется. Это журнал выполненных работ; без измерения влажности точная норма не рассчитывается.",
            "No sensor is required. This journal tracks completed work; precise water quantities are not prescribed without measured soil conditions.",
          )}
        </p>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>
            {pick(
              p.lang,
              "Sug‘orish tarixi",
              "История полива",
              "Irrigation history",
            )}
          </h2>
          <label className="inline-filter">
            <span className="sr-only">
              {pick(p.lang, "Dala filtri", "Фильтр полей", "Field filter")}
            </span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">
                {pick(p.lang, "Barcha dalalar", "Все поля", "All fields")}
              </option>
              {p.fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{pick(p.lang, "SANA", "ДАТА", "DATE")}</th>
                <th>{pick(p.lang, "DALA", "ПОЛЕ", "FIELD")}</th>
                <th>{pick(p.lang, "SUV HAJMI", "ОБЪЁМ", "VOLUME")}</th>
                <th>{pick(p.lang, "USUL", "МЕТОД", "METHOD")}</th>
                <th>{pick(p.lang, "IZOH", "ЗАМЕТКА", "NOTES")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id}>
                  <td>{formatDate(w.watered_at, p.lang)}</td>
                  <td>
                    {p.fields.find((f) => f.id === w.field_id)?.name ?? "—"}
                  </td>
                  <td className="numeric">{w.water_volume_m3} m³</td>
                  <td>{t(p.lang, w.method)}</td>
                  <td>{w.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <div className="table-empty">
            <Droplets size={25} />
            <strong>
              {pick(
                p.lang,
                "Hali sug‘orish qayd etilmagan",
                "Полив пока не записан",
                "No irrigation recorded yet",
              )}
            </strong>
            <p>
              {pick(
                p.lang,
                "Birinchi qayd bilan suv tarixini boshlang.",
                "Начните историю воды с первой записи.",
                "Start your water history with the first entry.",
              )}
            </p>
          </div>
        )}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>
            {pick(
              p.lang,
              "Rejalashdan oldin",
              "Перед планированием",
              "Before you plan",
            )}
          </h2>
          <button
            className="text-button"
            onClick={() => p.onNavigate("weather")}
          >
            {sectionNameLocal(p.lang, "weather")}
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="planning-rows">
          {p.fields.map((f) => (
            <div key={f.id}>
              <span>
                <strong>{f.name}</strong>
                <small>{stageLabel(p.lang, growthStage(f).stage)}</small>
              </span>
              <span>
                <CloudRain size={15} />
                {rainTotal(p.data[f.id]?.weather.days.slice(0, 2), 2)?.toFixed(
                  1,
                ) ?? "—"}{" "}
                mm <small>/ 48h</small>
              </span>
              <button className="text-button" onClick={() => p.onOpen(f.id)}>
                {pick(p.lang, "Dalani ochish", "Открыть поле", "Open field")}
                <ArrowUpRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
export function ReportsView(p: ViewProps) {
  const total = p.water.reduce((s, w) => s + w.water_volume_m3, 0);
  const obs = p.fields.flatMap((f) =>
    (p.data[f.id]?.satellite.observations ?? []).map((o) => ({
      field: f,
      ...o,
    })),
  );
  return (
    <>
      <PageHeading
        eyebrow={pick(
          p.lang,
          "MA’LUMOT VA HISOBOT",
          "ДАННЫЕ И ОТЧЁТЫ",
          "DATA & REPORTING",
        )}
        title={sectionNameLocal(p.lang, "reports")}
        description={pick(
          p.lang,
          "Ferma ma’lumotlarini tekshiring va CSV formatida oling.",
          "Проверяйте данные хозяйства и выгружайте CSV.",
          "Review farm records and export the underlying data as CSV.",
        )}
      />
      <div className="report-cards">
        {[
          {
            icon: Layers,
            title: pick(
              p.lang,
              "Dala reyestri",
              "Реестр полей",
              "Field register",
            ),
            count: `${p.fields.length} ${pick(p.lang, "dala", "полей", "fields")}`,
            desc: pick(
              p.lang,
              "Chegara bilan bog‘langan ekin, sana va maydon ma’lumotlari.",
              "Культура, дата посадки и площадь каждого поля.",
              "Crop, planting date, and area for each field.",
            ),
            action: () => fieldExport(p.fields, p.lang),
          },
          {
            icon: Satellite,
            title: pick(
              p.lang,
              "Vegetatsiya kuzatuvlari",
              "Наблюдения растительности",
              "Vegetation observations",
            ),
            count: `${obs.length} ${pick(p.lang, "kuzatuv", "наблюдений", "observations")}`,
            desc: pick(
              p.lang,
              "NDVI va tasvirning yaroqli piksel ulushi.",
              "NDVI и доля пригодных пикселей.",
              "NDVI and usable-pixel coverage for each acquisition.",
            ),
            action: () =>
              downloadCsv("ekinix-satellite-report.csv", [
                ["field", "date", "NDVI", "usable_percent"],
                ...obs.map((o) => [
                  o.field.name,
                  o.date,
                  o.ndvi,
                  o.validPercent,
                ]),
              ]),
          },
          {
            icon: Droplets,
            title: pick(
              p.lang,
              "Suv sarfi jurnali",
              "Журнал расхода воды",
              "Water-use journal",
            ),
            count: `${total.toLocaleString()} m³`,
            desc: pick(
              p.lang,
              "Amalda qayd etilgan sug‘orishlar, usullar va izohlar.",
              "Записанные поливы, методы и заметки.",
              "Recorded irrigation events, methods, and notes.",
            ),
            action: () =>
              downloadCsv("ekinix-irrigation-report.csv", [
                ["field", "time", "volume_m3", "method", "notes"],
                ...p.water.map((w) => [
                  p.fields.find((f) => f.id === w.field_id)?.name,
                  w.watered_at,
                  w.water_volume_m3,
                  w.method,
                  w.notes,
                ]),
              ]),
          },
        ].map((r) => (
          <article className="panel report-card" key={r.title}>
            <span className="report-icon">
              <r.icon size={24} />
            </span>
            <h2>{r.title}</h2>
            <p>{r.desc}</p>
            <strong>{r.count}</strong>
            <button className="button secondary" onClick={r.action}>
              <Download size={15} />
              {pick(p.lang, "CSV yuklash", "Скачать CSV", "Download CSV")}
            </button>
          </article>
        ))}
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>
              {pick(
                p.lang,
                "Dalalar bo‘yicha suv taqsimoti",
                "Распределение воды по полям",
                "Recorded water by field",
              )}
            </h2>
            <p>
              {pick(
                p.lang,
                "Faqat jurnalga kiritilgan ma’lumotlar",
                "Только данные из журнала",
                "Based only on journal entries",
              )}
            </p>
          </div>
          <FileText size={18} />
        </div>
        <div className="water-breakdown">
          {p.fields.map((f, i) => {
            const volume = p.water
              .filter((w) => w.field_id === f.id)
              .reduce((s, w) => s + w.water_volume_m3, 0);
            return (
              <div key={f.id}>
                <span>{f.name}</span>
                <div>
                  <i
                    style={{
                      width: total ? `${(volume / total) * 100}%` : "0%",
                      background: fieldColors[i % fieldColors.length],
                    }}
                  />
                </div>
                <strong>{volume.toLocaleString()} m³</strong>
              </div>
            );
          })}
          {!p.fields.length && <p className="muted">{t(p.lang, "unknown")}</p>}
        </div>
      </section>
      <p className="data-footnote">
        {pick(
          p.lang,
          "Hisobotlar yo‘q ma’lumotni to‘ldirmaydi. Kuzatuvlar va jurnal oxirgi yuklangan yozuvlarni o‘z ichiga oladi; namunaviy hisobda barcha raqamlar demo.",
          "Отчёты не дополняют отсутствующие данные. Включены последние загруженные записи; в демо все цифры примерные.",
          "Reports do not fill missing data. They include the latest loaded observations and records; all values in the demo are examples.",
        )}
      </p>
    </>
  );
}
