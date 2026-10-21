import {
  cropLabel,
  formatDate,
  growthStage,
  pick,
  type Field,
  type Lang,
  type Monitoring,
  type Watering,
} from "./domain";
export type Section =
  | "overview"
  | "fields"
  | "satellite"
  | "weather"
  | "irrigation"
  | "reports"
  | "guide"
  | "settings";
export const sectionName = (l: Lang, s: Section) =>
  pick(
    l,
    ...(
      {
        overview: ["Ferma markazi", "Центр хозяйства", "Farm overview"],
        fields: ["Dalalar", "Поля", "Fields"],
        satellite: ["Sun’iy yo‘ldosh", "Спутник", "Satellite"],
        weather: ["Ob-havo", "Погода", "Weather"],
        irrigation: [
          "Sug‘orish jurnali",
          "Журнал полива",
          "Irrigation journal",
        ],
        reports: ["Hisobotlar", "Отчёты", "Reports"],
        guide: ["Ekin qo‘llanmasi", "Справочник культур", "Crop guide"],
        settings: ["Sozlamalar", "Настройки", "Settings"],
      } satisfies Record<Section, [string, string, string]>
    )[s],
  );
export const fieldColors = [
  "#347969",
  "#9b7a42",
  "#567aaa",
  "#98755d",
  "#7d7d51",
];
export const demoFields: Field[] = [
  {
    id: "demo-1",
    farmer_id: "demo",
    name: "Yangiyo‘l · Shimoliy dala",
    crop_type: "cotton",
    planting_date: "2026-04-10",
    area_hectares: 12.4,
    region: "Toshkent viloyati",
    coordinates_json: [
      [41.123, 69.012],
      [41.123, 69.017],
      [41.12, 69.017],
      [41.12, 69.012],
    ],
    stage_override: "late",
    field_capacity: null,
    wilting_point: null,
    root_depth_cm: null,
    irrigation_method: "drip",
    archived_at: null,
  },
  {
    id: "demo-2",
    farmer_id: "demo",
    name: "Bo‘zsuv · 02",
    crop_type: "wheat",
    planting_date: "2026-10-01",
    area_hectares: 8.6,
    region: "Toshkent viloyati",
    coordinates_json: [
      [41.118, 69.018],
      [41.118, 69.022],
      [41.115, 69.022],
      [41.115, 69.018],
    ],
    stage_override: "initial",
    field_capacity: null,
    wilting_point: null,
    root_depth_cm: null,
    irrigation_method: "furrow",
    archived_at: null,
  },
  {
    id: "demo-3",
    farmer_id: "demo",
    name: "Bog‘iston · Sabzavot",
    crop_type: "tomato",
    planting_date: "2026-08-01",
    area_hectares: 3.2,
    region: "Toshkent viloyati",
    coordinates_json: [
      [41.122, 69.024],
      [41.122, 69.027],
      [41.12, 69.027],
      [41.12, 69.024],
    ],
    stage_override: "mid",
    field_capacity: null,
    wilting_point: null,
    root_depth_cm: null,
    irrigation_method: "drip",
    archived_at: null,
  },
];
export const demoMonitoring: Record<string, Monitoring> = Object.fromEntries(
  demoFields.map((f, j) => [
    f.id,
    {
      fetchedAt: "2026-10-21T06:00:00Z",
      weather: {
        status: "available",
        fetchedAt: "2026-10-21T06:00:00Z",
        modelTime: "2026-10-21T06:00:00Z",
        temperature: 19 + j,
        soilVwc: null,
        soilTime: null,
        days: Array.from({ length: 7 }, (_, i) => ({
          date: `2026-10-${21 + i}`,
          min: 9 + (i % 3),
          max: 21 + (i % 4),
          rainMm: i === 2 ? 7.2 : 0,
          rainProbability: i === 2 ? 75 : 10,
          et0: 2.7 + i * 0.1,
        })),
      },
      satellite: {
        status: "available",
        fetchedAt: "2026-10-21T06:00:00Z",
        source: "earth-search",
        observations: [
          { date: "2026-10-02", ndvi: 0.61 - j * 0.07, validPercent: 96 },
          { date: "2026-10-07", ndvi: 0.65 - j * 0.05, validPercent: 91 },
          { date: "2026-10-12", ndvi: 0.68 - j * 0.04, validPercent: 98 },
          { date: "2026-10-17", ndvi: 0.66 - j * 0.05, validPercent: 97 },
          { date: "2026-10-20", ndvi: 0.63 - j * 0.05, validPercent: 95 },
        ],
      },
    },
  ]),
);
export const demoWaterings: Watering[] = [
  {
    id: "demo-water-1",
    field_id: "demo-2",
    watered_at: "2026-10-19T05:00:00Z",
    water_volume_m3: 180,
    method: "furrow",
    notes: "Demo / namuna",
  },
  {
    id: "demo-water-2",
    field_id: "demo-3",
    watered_at: "2026-10-17T05:00:00Z",
    water_volume_m3: 64,
    method: "drip",
    notes: "Demo / namuna",
  },
];
export function downloadCsv(name: string, rows: unknown[][]) {
  const cell = (v: unknown) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function fieldExport(fields: Field[], l: Lang) {
  downloadCsv("ekinix-fields.csv", [
    [
      pick(l, "Dala", "Поле", "Field"),
      pick(l, "Ekin", "Культура", "Crop"),
      "ha",
      pick(l, "Hudud", "Регион", "Region"),
      pick(l, "Ekish sanasi", "Посадка", "Planting date"),
    ],
    ...fields.map((f) => [
      f.name,
      cropLabel(f.crop_type, l),
      f.area_hectares,
      f.region,
      f.planting_date,
    ]),
  ]);
}
export function signals(
  fields: Field[],
  data: Record<string, Monitoring>,
  l: Lang,
) {
  return fields
    .flatMap((f) => {
      const m = data[f.id],
        stage = growthStage(f);
      const rows: {
        field: Field;
        kind: "warning" | "info";
        title: string;
        detail: string;
      }[] = [];
      if (!f.planting_date)
        rows.push({
          field: f,
          kind: "info",
          title: pick(
            l,
            "Ekish sanasini kiriting",
            "Укажите дату посадки",
            "Add the planting date",
          ),
          detail: pick(
            l,
            "Mavsum bosqichini kuzatish uchun",
            "Для отслеживания сезона",
            "To track the growing season",
          ),
        });
      if (
        m?.weather.days
          .slice(0, 2)
          .some((d) => (d.rainMm ?? 0) >= 5 && (d.rainProbability ?? 0) >= 60)
      )
        rows.push({
          field: f,
          kind: "warning",
          title: pick(
            l,
            "Yomg‘ir kutilmoqda",
            "Ожидаются осадки",
            "Rain is forecast",
          ),
          detail: pick(
            l,
            "Sug‘orish rejasini prognoz bilan tekshiring",
            "Сверьте план полива с прогнозом",
            "Review your irrigation plan against the forecast",
          ),
        });
      const obs = m?.satellite.observations ?? [];
      if (obs.length >= 2 && obs.at(-1)!.ndvi - obs.at(-2)!.ndvi < -0.1)
        rows.push({
          field: f,
          kind: "warning",
          title: pick(
            l,
            "NDVI pasaygan",
            "NDVI снизился",
            "NDVI has decreased",
          ),
          detail: pick(
            l,
            "Bu tashxis emas; dalani ko‘zdan kechiring",
            "Это не диагноз; осмотрите поле",
            "This is not a diagnosis; inspect the field",
          ),
        });
      if (stage.stage === "harvest")
        rows.push({
          field: f,
          kind: "info",
          title: pick(
            l,
            "Mavsum bosqichini tekshiring",
            "Проверьте стадию сезона",
            "Review the growing stage",
          ),
          detail: pick(
            l,
            "Yangi ekish yoki terimni dala sozlamalarida yangilang",
            "Обновите посадку или уборку в настройках поля",
            "Update planting or harvest in field settings",
          ),
        });
      return rows;
    })
    .slice(0, 8);
}
export const displayDate = (value: string, l: Lang) => formatDate(value, l);
