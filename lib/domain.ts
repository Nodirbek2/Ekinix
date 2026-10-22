import { cropProfiles } from "./crop-catalog.ts";
export type Lang = "uz" | "ru" | "en";
export type Point = [number, number];
export type Stage = "initial" | "development" | "mid" | "late" | "harvest";
export type Method = "drip" | "sprinkler" | "furrow";
export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  region: string;
}
export interface Field {
  id: string;
  farmer_id: string;
  name: string;
  crop_type: string;
  planting_date: string | null;
  area_hectares: number;
  region: string;
  coordinates_json: Point[];
  soil_type?: string | null;
  stage_override: Stage | null;
  field_capacity: number | null;
  wilting_point: number | null;
  root_depth_cm: number | null;
  irrigation_method: Method;
  archived_at: string | null;
}
export interface SoilReading {
  id: string;
  field_id: string;
  device_id: string | null;
  moisture_vwc: number;
  temperature_c: number | null;
  depth_cm: number;
  calibrated: boolean;
  source: "manual" | "device";
  measured_at: string;
  notes?: string;
}
export interface Device {
  id: string;
  field_id: string;
  name: string;
  depth_cm: number;
  calibrated: boolean;
  enabled: boolean;
}
export interface Watering {
  id: string;
  field_id: string;
  watered_at: string;
  water_volume_m3: number;
  method: Method;
  notes: string | null;
}
export interface WeatherDay {
  date: string;
  min: number | null;
  max: number | null;
  rainMm: number | null;
  rainProbability: number | null;
  et0: number | null;
}
export interface Weather {
  status: "available" | "unavailable";
  fetchedAt: string;
  modelTime: string | null;
  temperature: number | null;
  soilVwc: number | null;
  soilTime: string | null;
  days: WeatherDay[];
}
export interface Observation {
  date: string;
  ndvi: number;
  validPercent: number;
}
export interface Satellite {
  source?: "copernicus" | "earth-search";
  diagnostic?: string;
  status: "available" | "not_configured" | "unavailable" | "no_clear_scene";
  observations: Observation[];
  fetchedAt: string;
}
export interface Monitoring {
  weather: Weather;
  satellite: Satellite;
  fetchedAt: string;
}
export const crops = [
  ...cropProfiles,
  {
    id: "other",
    uz: "Boshqa ekin",
    ru: "Другая культура",
    en: "Other crop",
    days: [] as number[],
  },
];
export const cropLabel = (id: string, l: Lang) =>
  crops.find((c) => c.id === id)?.[l] ?? id;
export const pick = (l: Lang, uz: string, ru: string, en: string) =>
  ({ uz, ru, en })[l];
export const dayMs = 86400000;
export function growthStage(
  field: Pick<Field, "crop_type" | "planting_date" | "stage_override">,
  now = new Date(),
): { stage: Stage | null; days: number | null; estimated: boolean } {
  if (field.stage_override)
    return {
      stage: field.stage_override,
      days: field.planting_date
        ? Math.floor(
            (now.getTime() - Date.parse(field.planting_date + "T00:00:00Z")) /
              dayMs,
          )
        : null,
      estimated: false,
    };
  if (!field.planting_date) return { stage: null, days: null, estimated: true };
  const days = Math.floor(
    (now.getTime() - Date.parse(field.planting_date + "T00:00:00Z")) / dayMs,
  );
  const crop = crops.find((c) => c.id === field.crop_type);
  if (!Number.isFinite(days) || days < 0 || !crop?.days.length)
    return {
      stage: null,
      days: Number.isFinite(days) ? days : null,
      estimated: true,
    };
  const index = crop.days.findIndex((d) => days < d);
  return {
    stage: (["initial", "development", "mid", "late", "harvest"] as Stage[])[
      index < 0 ? 4 : index
    ],
    days,
    estimated: true,
  };
}
export function areaHectares(coords: Point[]): number {
  let area = 0;
  const rad = Math.PI / 180;
  for (let i = 0; i < coords.length; i++) {
    const a = coords[i],
      b = coords[(i + 1) % coords.length];
    area +=
      (b[1] - a[1]) * rad * (2 + Math.sin(a[0] * rad) + Math.sin(b[0] * rad));
  }
  return Math.abs((area * 6378137 ** 2) / 2) / 10000;
}
export function polygonError(input: unknown): string | null {
  if (!Array.isArray(input) || input.length < 3 || input.length > 100)
    return "polygon_points";
  if (
    input.some(
      (p) =>
        !Array.isArray(p) ||
        p.length !== 2 ||
        p.some((v) => typeof v !== "number" || !Number.isFinite(v)) ||
        p[0] < 35 ||
        p[0] > 47 ||
        p[1] < 55 ||
        p[1] > 74,
    )
  )
    return "polygon_bounds";
  const p = input as Point[];
  if (new Set(p.map((v) => v.join(","))).size !== p.length)
    return "polygon_duplicate";
  const cross = (a: Point, b: Point, c: Point) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < p.length; i++)
    for (let j = i + 1; j < p.length; j++) {
      if (j === i + 1 || (i === 0 && j === p.length - 1)) continue;
      const a = p[i],
        b = p[(i + 1) % p.length],
        c = p[j],
        d = p[(j + 1) % p.length];
      if (
        cross(a, b, c) * cross(a, b, d) <= 0 &&
        cross(c, d, a) * cross(c, d, b) <= 0 &&
        Math.max(Math.min(a[0], b[0]), Math.min(c[0], d[0])) <=
          Math.min(Math.max(a[0], b[0]), Math.max(c[0], d[0])) &&
        Math.max(Math.min(a[1], b[1]), Math.min(c[1], d[1])) <=
          Math.min(Math.max(a[1], b[1]), Math.max(c[1], d[1]))
      )
        return "polygon_intersection";
    }
  const area = areaHectares(p);
  return area < 0.01 || area > 10000 ? "polygon_area" : null;
}
export function normalizeLogin(input: string): string {
  const value = input.trim().toLowerCase();
  if (value.includes("@")) return value;
  const digits = value.replace(/[\s()+-]/g, "");
  if (/^\d{9}$/.test(digits)) return `998${digits}@ekinix.uz`;
  if (/^998\d{9}$/.test(digits)) return `${digits}@ekinix.uz`;
  throw new Error("invalid_login");
}
export type AdviceCode =
  | "no_stage"
  | "harvest"
  | "late"
  | "no_measurement"
  | "stale_measurement"
  | "uncalibrated"
  | "calibration_needed"
  | "weather_unavailable"
  | "recent_irrigation"
  | "rain_expected"
  | "sufficient"
  | "irrigate";
export interface Advice {
  code: AdviceCode;
  netMm: number | null;
  grossM3Ha: number | null;
  totalM3: number | null;
  availableWater: number | null;
  stage: ReturnType<typeof growthStage>;
}
export function irrigationAdvice(
  field: Field,
  reading: SoilReading | null,
  weather: Weather | null,
  lastWatering: Watering | null,
  now = new Date(),
): Advice {
  const stage = growthStage(field, now);
  const result: Advice = {
    code: "no_stage",
    netMm: null,
    grossM3Ha: null,
    totalM3: null,
    availableWater: null,
    stage,
  };
  const done = (code: AdviceCode) => ({ ...result, code });
  if (!stage.stage) return done("no_stage");
  if (stage.stage === "harvest") return done("harvest");
  if (stage.stage === "late") return done("late");
  if (!reading) return done("no_measurement");
  const age = now.getTime() - Date.parse(reading.measured_at);
  if (!Number.isFinite(age) || age > 24 * 3600000 || age < -300000)
    return done("stale_measurement");
  if (!reading.calibrated) return done("uncalibrated");
  const { field_capacity: fc, wilting_point: wp, root_depth_cm: depth } = field;
  if (
    fc === null ||
    wp === null ||
    depth === null ||
    ![fc, wp, depth, reading.moisture_vwc, field.area_hectares].every(
      Number.isFinite,
    ) ||
    fc > 70 ||
    wp < 0 ||
    fc <= wp ||
    depth < 5 ||
    depth > 200 ||
    reading.moisture_vwc < 0 ||
    reading.moisture_vwc > 100 ||
    field.area_hectares <= 0
  )
    return done("calibration_needed");
  result.availableWater = Math.max(
    0,
    Math.min(100, ((reading.moisture_vwc - wp) / (fc - wp)) * 100),
  );
  if (
    lastWatering &&
    Date.parse(lastWatering.watered_at) >= Date.parse(reading.measured_at)
  )
    return done("recent_irrigation");
  if (
    !weather ||
    weather.status !== "available" ||
    !Number.isFinite(Date.parse(weather.fetchedAt)) ||
    now.getTime() - Date.parse(weather.fetchedAt) > 6 * 3600000 ||
    weather.days.length < 2 ||
    weather.days
      .slice(0, 2)
      .some((d) => d.rainMm === null || d.rainProbability === null)
  )
    return done("weather_unavailable");
  if (result.availableWater >= 50) return done("sufficient");
  if (
    weather.days
      .slice(0, 2)
      .some((d) => (d.rainMm ?? 0) >= 5 && (d.rainProbability ?? 0) >= 60)
  )
    return done("rain_expected");
  // Provisional refill to 80% plant-available water, not an automatic control command.
  const target = wp + 0.8 * (fc - wp);
  const deficitMm = Math.max(
    0,
    ((target - reading.moisture_vwc) / 100) * depth * 10,
  );
  const efficiency = { drip: 0.9, sprinkler: 0.75, furrow: 0.6 }[
    field.irrigation_method
  ];
  result.netMm = Math.round(deficitMm * 10) / 10;
  result.grossM3Ha = Math.round((deficitMm * 10) / efficiency);
  result.totalM3 = Math.round(
    ((deficitMm * 10) / efficiency) * field.area_hectares,
  );
  return done("irrigate");
}
export function newestReading<T extends { measured_at: string }>(
  rows: T[],
): T | null {
  return (
    [...rows].sort(
      (a, b) => Date.parse(b.measured_at) - Date.parse(a.measured_at),
    )[0] ?? null
  );
}

export function formatDate(
  value: string,
  lang: Lang,
  forecast = false,
): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  if (lang === "uz") {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tashkent",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      weekday: "short",
    }).formatToParts(date);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "";
    const weekdays: Record<string, string> = {
      Mon: "Du",
      Tue: "Se",
      Wed: "Ch",
      Thu: "Pa",
      Fri: "Ju",
      Sat: "Sh",
      Sun: "Ya",
    };
    return forecast
      ? `${get("day")}, ${weekdays[get("weekday")]}`
      : `${get("day")}.${get("month")}.${get("year")}, ${get("hour")}:${get("minute")}`;
  }
  return forecast
    ? date.toLocaleDateString(lang, {
        timeZone: "Asia/Tashkent",
        weekday: "short",
        day: "numeric",
      })
    : date.toLocaleString(lang, {
        timeZone: "Asia/Tashkent",
        dateStyle: "medium",
        timeStyle: "short",
      });
}
