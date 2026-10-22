import {
  cropProfile,
  phaseKc,
  type CropPhase,
  type Range,
} from "./crop-catalog.ts";
import type { Field, Stage, Watering, Weather } from "./domain.ts";
export const planVersion = "fao56-budget-v1";
export const methodEfficiency = {
  drip: 0.9,
  sprinkler: 0.75,
  furrow: 0.6,
} as const;
export type PlanStatus =
  | "unsupported"
  | "phase_needed"
  | "harvest"
  | "dormant"
  | "weather_needed"
  | "invalid_inputs"
  | "ready";
export interface PlanDay {
  date: string;
  et0: number;
  rain: number;
  effectiveRain: number;
  etc: Range;
  net: Range;
  grossM3: Range;
  min: number | null;
  max: number | null;
}
export interface IrrigationPlan {
  version: string;
  status: PlanStatus;
  phase: Stage | "dormant" | null;
  kc: Range | null;
  days: PlanDay[];
  totals: {
    etc: Range;
    rain: number;
    effectiveRain: number;
    net: Range;
    grossM3: Range;
  } | null;
  flags: ("rain" | "heat" | "frost" | "recent_watering" | "late")[];
  efficiency: number;
  rainCredit: number;
  forecastAt: string | null;
  lastWatering: Watering | null;
}
export function uzbekDay(now: Date): string {
  return new Date(now.getTime() + 5 * 3600000).toISOString().slice(0, 10);
}
export function buildIrrigationPlan(
  field: Pick<Field, "crop_type" | "area_hectares" | "irrigation_method">,
  weather: Weather | null | undefined,
  water: Watering[],
  options: {
    phase: Stage | "dormant" | null;
    confirmed: boolean;
    rainCredit?: number;
    efficiency?: number;
  },
  now = new Date(),
): IrrigationPlan {
  const efficiency =
    options.efficiency ?? methodEfficiency[field.irrigation_method];
  // Zero is the conservative default: forecast rain is shown but not credited until user opts in.
  const rainCredit = options.rainCredit ?? 0;
  const lastWatering =
    water
      .filter(
        (w) =>
          Number.isFinite(Date.parse(w.watered_at)) &&
          Date.parse(w.watered_at) <= now.getTime(),
      )
      .sort((a, b) => Date.parse(b.watered_at) - Date.parse(a.watered_at))[0] ??
    null;
  const out: IrrigationPlan = {
    version: planVersion,
    status: "unsupported",
    phase: options.phase,
    kc: null,
    days: [],
    totals: null,
    flags: [],
    efficiency,
    rainCredit,
    forecastAt: weather?.fetchedAt ?? null,
    lastWatering,
  };
  const done = (status: PlanStatus) => ({ ...out, status });
  const profile = cropProfile(field.crop_type);
  if (!profile?.kc) return out;
  if (
    !Number.isFinite(field.area_hectares) ||
    field.area_hectares <= 0 ||
    field.area_hectares > 10000 ||
    !Number.isFinite(efficiency) ||
    efficiency < 0.3 ||
    efficiency > 1 ||
    !Number.isFinite(rainCredit) ||
    rainCredit < 0 ||
    rainCredit > 1
  )
    return done("invalid_inputs");
  if (!options.confirmed || !options.phase) return done("phase_needed");
  if (options.phase === "harvest") return done("harvest");
  if (options.phase === "dormant") return done("dormant");
  if (!["initial", "development", "mid", "late"].includes(options.phase))
    return done("phase_needed");
  out.kc = phaseKc(profile, options.phase as CropPhase);
  const age = now.getTime() - Date.parse(weather?.fetchedAt ?? "");
  if (
    !weather ||
    weather.status !== "available" ||
    !Number.isFinite(age) ||
    age > 6 * 3600000 ||
    age < -300000 ||
    weather.days.length < 7
  )
    return done("weather_needed");
  const today = uzbekDay(now);
  const days = weather.days.filter((d) => d.date >= today).slice(0, 7);
  // Seven complete contiguous calendar-day forecasts; never turn missing rain/ET0 into zero.
  if (
    days.length !== 7 ||
    days.some(
      (d, i) =>
        d.date !==
          new Date(Date.parse(today + "T00:00:00Z") + i * 86400000)
            .toISOString()
            .slice(0, 10) ||
        d.et0 === null ||
        !Number.isFinite(d.et0) ||
        d.et0 < 0 ||
        d.et0 > 25 ||
        d.rainMm === null ||
        !Number.isFinite(d.rainMm) ||
        d.rainMm < 0 ||
        d.rainMm > 500,
    )
  )
    return done("weather_needed");
  const k = out.kc!;
  out.days = days.map((d) => {
    const et0 = d.et0!,
      rain = d.rainMm!,
      effectiveRain = rain * rainCredit;
    const etc: Range = [et0 * k[0], et0 * k[1]];
    // Same-day rain only. Carry-over, soil reserves and future rainfall cannot silently cancel today's need.
    const net: Range = [
      Math.max(0, etc[0] - effectiveRain),
      Math.max(0, etc[1] - effectiveRain),
    ];
    return {
      date: d.date,
      et0,
      rain,
      effectiveRain,
      etc,
      net,
      grossM3: net.map(
        (v) => (v * 10 * field.area_hectares) / efficiency,
      ) as Range,
      min: d.min,
      max: d.max,
    };
  });
  const sum = (key: "etc" | "net" | "grossM3"): Range =>
    out.days.reduce<Range>(
      (s, d) => [s[0] + d[key][0], s[1] + d[key][1]],
      [0, 0],
    );
  out.totals = {
    etc: sum("etc"),
    rain: out.days.reduce((s, d) => s + d.rain, 0),
    effectiveRain: out.days.reduce((s, d) => s + d.effectiveRain, 0),
    net: sum("net"),
    grossM3: sum("grossM3"),
  };
  if (days.some((d) => d.rainMm! >= 5)) out.flags.push("rain");
  if (days.some((d) => d.max !== null && Number.isFinite(d.max) && d.max >= 35))
    out.flags.push("heat");
  if (days.some((d) => d.min !== null && Number.isFinite(d.min) && d.min <= 0))
    out.flags.push("frost");
  if (
    lastWatering &&
    now.getTime() - Date.parse(lastWatering.watered_at) < 48 * 3600000
  )
    out.flags.push("recent_watering");
  if (options.phase === "late") out.flags.push("late");
  return done("ready");
}
