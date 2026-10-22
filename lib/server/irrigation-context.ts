import "server-only";
import { reusableSatellite } from "./public-satellite";
import type { Field, WeatherDay } from "../domain";
import { polygonError } from "../domain";
import type { IrrigationContext } from "../irrigation-context";
import { fetchJson } from "./http";
import type { SupabaseClient } from "@supabase/supabase-js";
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const day = (t: number) =>
  new Date(t * 1000 + 5 * 3600000).toISOString().slice(0, 10);
export async function irrigationContext(
  client: SupabaseClient,
  field: Field,
): Promise<IrrigationContext> {
  const [water, snapshot] = await Promise.all([
    client
      .from("watering_log")
      .select("watered_at,water_volume_m3,method")
      .eq("field_id", field.id)
      .order("watered_at", { ascending: false })
      .limit(1),
    client
      .from("field_snapshots")
      .select("payload")
      .eq("field_id", field.id)
      .maybeSingle(),
  ]);
  if (water.error) throw Error("database_error");
  const last = water.data?.[0] ?? null,
    now = new Date(),
    today = day(now.getTime() / 1000);
  const age = last
    ? Math.max(
        0,
        Math.floor((now.getTime() - Date.parse(last.watered_at)) / 86400000),
      )
    : 0;
  const candidate = snapshot.data?.payload?.satellite;
  const raw = reusableSatellite(candidate) ? candidate : null;
  const out: IrrigationContext = {
    fetchedAt: now.toISOString(),
    weatherStatus: "unavailable",
    lastWatering: last,
    history: [],
    forecast: [],
    hours: [],
    historyStart: null,
    historyEnd: null,
    historyComplete: false,
    satellite: {
      status: raw?.status ?? "unavailable",
      observations: Array.isArray(raw?.observations)
        ? raw.observations
            .filter(
              (o: { date: string; ndvi: number; validPercent: number }) =>
                o &&
                typeof o.date === "string" &&
                Number.isFinite(Date.parse(o.date)) &&
                Number.isFinite(o.ndvi) &&
                o.ndvi >= -1 &&
                o.ndvi <= 1 &&
                Number.isFinite(o.validPercent) &&
                o.validPercent >= 0 &&
                o.validPercent <= 100,
            )
            .slice(-8)
        : [],
      fetchedAt: raw?.fetchedAt ?? null,
    },
  };
  if (polygonError(field.coordinates_json)) return out;
  const n = field.coordinates_json.length;
  const params = new URLSearchParams({
    latitude: String(field.coordinates_json.reduce((s, p) => s + p[0], 0) / n),
    longitude: String(field.coordinates_json.reduce((s, p) => s + p[1], 0) / n),
    timezone: "Asia/Tashkent",
    timeformat: "unixtime",
    past_days: String(Math.min(92, age + 1)),
    forecast_days: "7",
    daily:
      "temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration",
    hourly:
      "temperature_2m,precipitation,precipitation_probability,wind_speed_10m",
  });
  const key = process.env.OPEN_METEO_API_KEY;
  if (key) params.set("apikey", key);
  try {
    const data = await fetchJson(
      `https://${key ? "customer-api" : "api"}.open-meteo.com/v1/forecast?${params}`,
      { next: { revalidate: 1800 } } as RequestInit,
      16000,
    );
    const days: WeatherDay[] = (data.daily?.time ?? []).map(
      (time: number, i: number) => ({
        date: day(time),
        min: num(data.daily.temperature_2m_min?.[i]),
        max: num(data.daily.temperature_2m_max?.[i]),
        rainMm: num(data.daily.precipitation_sum?.[i]),
        rainProbability: num(data.daily.precipitation_probability_max?.[i]),
        et0: num(data.daily.et0_fao_evapotranspiration?.[i]),
      }),
    );
    out.forecast = days.filter((d) => d.date >= today);
    out.weatherStatus = out.forecast.length ? "available" : "unavailable";
    if (last) {
      const lastDay = day(Date.parse(last.watered_at) / 1000);
      out.history = days.filter((d) => d.date > lastDay && d.date < today);
      out.historyStart = out.history[0]?.date ?? null;
      out.historyEnd = out.history.at(-1)?.date ?? null;
      const expected = Math.max(
        0,
        Math.round((Date.parse(today) - Date.parse(lastDay)) / 86400000) - 1,
      );
      out.historyComplete =
        out.history.length === expected &&
        out.history.every((d) => d.et0 !== null && d.rainMm !== null);
    }
    out.hours = (data.hourly?.time ?? [])
      .map((time: number, i: number) => ({
        time: time * 1000,
        temperature: num(data.hourly.temperature_2m?.[i]),
        rain: num(data.hourly.precipitation?.[i]),
        probability: num(data.hourly.precipitation_probability?.[i]),
        wind: num(data.hourly.wind_speed_10m?.[i]),
      }))
      .filter((h: { time: number }) => h.time > now.getTime());
  } catch {
    /* Preserve real watering/cached satellite context; never fabricate weather. */
  }
  return out;
}
