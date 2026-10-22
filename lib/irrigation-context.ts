import type { Method, WeatherDay } from "./domain";
export interface ForecastHour {
  time: number;
  temperature: number | null;
  rain: number | null;
  probability: number | null;
  wind: number | null;
}
export interface IrrigationContext {
  fetchedAt: string;
  weatherStatus: "available" | "unavailable";
  lastWatering: {
    watered_at: string;
    water_volume_m3: number;
    method: Method;
  } | null;
  history: WeatherDay[];
  forecast: WeatherDay[];
  hours: ForecastHour[];
  historyStart: string | null;
  historyEnd: string | null;
  historyComplete: boolean;
  satellite: {
    status: string;
    observations: { date: string; ndvi: number; validPercent: number }[];
    fetchedAt: string | null;
  };
}
export interface PlanningWindow {
  start: number;
  end: number;
  temperature: number;
  wind: number;
  rainProbability: number;
}
/** Weather-suitable inspection/planning windows, never an irrigation-need decision. */
export function planningWindows(
  hours: ForecastHour[],
  method: Method,
  now = Date.now(),
): PlanningWindow[] {
  const windows: PlanningWindow[] = [];
  const dates = new Set<string>();
  const sorted = [...hours].sort((a, b) => a.time - b.time);
  const eligible = (h: ForecastHour) => {
    const local = new Date(h.time + 5 * 3600000),
      hour = local.getUTCHours();
    return (
      h.time > now &&
      ((hour >= 5 && hour <= 9) || (hour >= 18 && hour <= 20)) &&
      [h.temperature, h.rain, h.probability, h.wind].every(
        (v) => typeof v === "number" && Number.isFinite(v),
      ) &&
      h.temperature! >= 5 &&
      h.temperature! <= 28 &&
      h.rain! >= 0 &&
      h.rain! < 0.2 &&
      h.probability! >= 0 &&
      h.probability! < 50 &&
      h.wind! >= 0 &&
      h.wind! <= (method === "sprinkler" ? 10 : 20)
    );
  };
  const candidates = sorted.flatMap((h, i) => {
    const next = sorted[i + 1];
    return next &&
      next.time - h.time === 3600000 &&
      eligible(h) &&
      eligible(next)
      ? [
          {
            start: h.time,
            end: next.time + 3600000,
            temperature: Math.max(h.temperature!, next.temperature!),
            wind: Math.max(h.wind!, next.wind!),
            rainProbability: Math.max(h.probability!, next.probability!),
          },
        ]
      : [];
  });
  candidates.sort(
    (a, b) =>
      Math.abs(a.temperature - 18) +
      a.wind / 3 -
      (Math.abs(b.temperature - 18) + b.wind / 3),
  );
  for (const w of candidates) {
    const date = new Date(w.start + 5 * 3600000).toISOString().slice(0, 10);
    if (!dates.has(date)) {
      dates.add(date);
      windows.push(w);
    }
  }
  return windows.sort((a, b) => a.start - b.start).slice(0, 3);
}
