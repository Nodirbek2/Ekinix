// Public Sentinel-2 COG fallback. No credentials or invented observations.
import {
  fromUrl,
  type RemoteSourceOptions,
  type BlockedSourceOptions,
} from "geotiff";
import proj4 from "proj4";
import type { Field, Observation, Satellite } from "../domain";
export type Asset = {
  href: string;
  "raster:bands"?: Array<{ scale?: number; offset?: number }>;
};
export type Scene = {
  id: string;
  properties: {
    datetime: string;
    "proj:epsg": number;
    "eo:cloud_cover"?: number;
  };
  assets: Record<string, Asset>;
};
function inside(x: number, y: number, ring: number[][]) {
  let yes = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    )
      yes = !yes;
  }
  return yes;
}
export async function readSceneObservation(
  scene: Scene,
  field: Field,
  signal: AbortSignal,
): Promise<Observation | null> {
  const epsg = scene.properties["proj:epsg"];
  if (!Number.isInteger(epsg) || epsg < 32601 || epsg > 32660)
    throw Error("Unsupported projection");
  const projection = `+proj=utm +zone=${epsg - 32600} +datum=WGS84 +units=m +no_defs`;
  const ring = field.coordinates_json.map(([lat, lon]) =>
    proj4("EPSG:4326", projection, [lon, lat]),
  );
  const xs = ring.map((p) => p[0]),
    ys = ring.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  // Bound memory and transfer size for long/thin or very large polygons.
  if ((maxX - minX) * (maxY - minY) > 200_000_000)
    throw Error("Field window exceeds processing limit");
  const resolution = Math.max(
    10,
    Math.ceil(Math.sqrt(((maxX - minX) * (maxY - minY)) / 100000) / 10) * 10,
  );
  const left = Math.floor(minX / resolution) * resolution,
    top = Math.ceil(maxY / resolution) * resolution;
  const width = Math.max(1, Math.ceil((maxX - left) / resolution)),
    height = Math.max(1, Math.ceil((top - minY) / resolution));
  const bbox = [
    left,
    top - height * resolution,
    left + width * resolution,
    top,
  ];
  const read = async (name: string) => {
    const asset = scene.assets[name];
    if (!asset) throw Error("Missing band");
    const url = new URL(asset.href);
    if (
      url.protocol !== "https:" ||
      ![
        "sentinel-cogs.s3.us-west-2.amazonaws.com",
        "e84-earth-search-sentinel-data.s3.us-west-2.amazonaws.com",
      ].includes(url.hostname)
    )
      throw Error("Untrusted asset host");
    const options: RemoteSourceOptions & BlockedSourceOptions = {
      blockSize: 16384,
    };
    const tiff = await fromUrl(asset.href, options, signal);
    const image = await tiff.getImage();
    const bounds = image.getBoundingBox();
    if (
      bbox[0] < bounds[0] ||
      bbox[1] < bounds[1] ||
      bbox[2] > bounds[2] ||
      bbox[3] > bounds[3]
    )
      throw Error("Partial tile");
    return tiff.readRasters({
      bbox,
      width,
      height,
      samples: [0],
      interleave: true,
      resampleMethod: "nearest",
      signal,
    });
  };
  const [red, nir, scl] = await Promise.all([
    read("red"),
    read("nir"),
    read("scl"),
  ]);
  const rb = scene.assets.red["raster:bands"]?.[0],
    nb = scene.assets.nir["raster:bands"]?.[0];
  // Offsets changed with Sentinel processing baselines; metadata is mandatory.
  if (
    !Number.isFinite(rb?.scale) ||
    !Number.isFinite(rb?.offset) ||
    !Number.isFinite(nb?.scale) ||
    !Number.isFinite(nb?.offset)
  )
    throw Error("Missing reflectance metadata");
  const summary = summarizePixels({
    red: Array.from(red, Number),
    nir: Array.from(nir, Number),
    scl: Array.from(scl, Number),
    redScale: rb!.scale!,
    redOffset: rb!.offset!,
    nirScale: nb!.scale!,
    nirOffset: nb!.offset!,
    ring,
    left,
    top,
    resolution,
    width,
    height,
  });
  return summary
    ? { date: scene.properties.datetime.slice(0, 10), ...summary }
    : null;
}
export function summarizePixels({
  red,
  nir,
  scl,
  redScale,
  redOffset,
  nirScale,
  nirOffset,
  ring,
  left,
  top,
  resolution,
  width,
  height,
}: {
  red: number[];
  nir: number[];
  scl: number[];
  redScale: number;
  redOffset: number;
  nirScale: number;
  nirOffset: number;
  ring: number[][];
  left: number;
  top: number;
  resolution: number;
  width: number;
  height: number;
}): { ndvi: number; validPercent: number } | null {
  if (![redScale, redOffset, nirScale, nirOffset].every(Number.isFinite))
    return null;
  let total = 0,
    valid = 0,
    sum = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (
        !inside(
          left + (x + 0.5) * resolution,
          top - (y + 0.5) * resolution,
          ring,
        )
      )
        continue;
      total++;
      const i = y * width + x,
        r = red[i],
        n = nir[i];
      if (
        ![4, 5, 6].includes(scl[i]) ||
        !Number.isFinite(r) ||
        !Number.isFinite(n) ||
        r <= 0 ||
        n <= 0
      )
        continue;
      const reflectRed = r * redScale + redOffset,
        reflectNir = n * nirScale + nirOffset;
      if (reflectRed < 0 || reflectNir < 0 || reflectNir + reflectRed <= 0)
        continue;
      sum += (reflectNir - reflectRed) / (reflectNir + reflectRed);
      valid++;
    }
  if (!total || valid / total < 0.5) return null;
  return {
    ndvi: Math.round((sum / valid) * 1000) / 1000,
    validPercent: Math.round((valid / total) * 100),
  };
}

export const satelliteSearchDays = 90;
export const publicSatelliteCollection = "sentinel-2-c1-l2a";
export function reusableSatellite(satellite: Satellite | undefined): boolean {
  return (
    satellite?.source === "copernicus" ||
    (satellite?.source === "earth-search" &&
      satellite.collection === publicSatelliteCollection)
  );
}
export function prioritizeScenes(scenes: Scene[]): Scene[] {
  const sorted = [...scenes]
    .filter((s) => Number.isFinite(Date.parse(s.properties?.datetime)))
    .sort((a, b) => b.properties.datetime.localeCompare(a.properties.datetime));
  // Inspect recent acquisitions, then prefer clearer older candidates. Scene-wide cloud
  // metadata only sets search order; the actual field SCL mask still decides eligibility.
  const cloud = (s: Scene) =>
    Number.isFinite(s.properties["eo:cloud_cover"])
      ? s.properties["eo:cloud_cover"]!
      : 100;
  return [
    ...sorted.slice(0, 4),
    ...sorted
      .slice(4)
      .sort(
        (a, b) =>
          cloud(a) - cloud(b) ||
          b.properties.datetime.localeCompare(a.properties.datetime),
      ),
  ];
}
export async function collectObservations(
  scenes: Scene[],
  field: Field,
  signal: AbortSignal,
  reader = readSceneObservation,
): Promise<Satellite> {
  const result: Satellite = {
    status: "unavailable",
    fetchedAt: new Date().toISOString(),
    observations: [],
    source: "earth-search",
    collection: publicSatelliteCollection,
  };
  const observations: Observation[] = [];
  let processed = 0,
    qualityRejected = 0,
    failed = 0;
  const ordered = prioritizeScenes(scenes);
  for (let i = 0; i < ordered.length; i += 2) {
    if (signal.aborted) break;
    const batch = ordered
      .slice(i, i + 2)
      .filter(
        (scene) =>
          !observations.some(
            (o) => o.date === scene.properties.datetime.slice(0, 10),
          ),
      );
    await Promise.all(
      batch.map(async (scene) => {
        processed++;
        try {
          const value = await reader(scene, field, signal);
          if (value) {
            if (!observations.some((o) => o.date === value.date))
              observations.push(value);
          } else qualityRejected++;
        } catch {
          failed++;
        }
      }),
    );
    if (observations.length >= 2) break;
  }
  const interrupted =
    signal.aborted || (processed < ordered.length && observations.length < 2);
  return {
    ...result,
    status: observations.length
      ? "available"
      : failed || interrupted || !ordered.length
        ? "unavailable"
        : "no_clear_scene",
    diagnostic: observations.length
      ? undefined
      : !ordered.length
        ? "catalog_no_scenes"
        : signal.aborted
          ? "search_timeout"
          : failed
            ? "raster_read_failed"
            : "quality_rejected",
    search: {
      windowDays: satelliteSearchDays,
      candidates: ordered.length,
      processed,
      qualityRejected,
      failed,
      interrupted,
    },
    observations: observations
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-2),
  };
}
export async function publicSatelliteFor(field: Field): Promise<Satellite> {
  const result: Satellite = {
    status: "unavailable",
    fetchedAt: new Date().toISOString(),
    observations: [],
    source: "earth-search",
    collection: publicSatelliteCollection,
  };
  const signal = AbortSignal.timeout(32000);
  try {
    const now = new Date(),
      from = new Date(now.getTime() - satelliteSearchDays * 86400000);
    const lats = field.coordinates_json.map((p) => p[0]),
      lons = field.coordinates_json.map((p) => p[1]);
    const response = await fetch(
      "https://earth-search.aws.element84.com/v1/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          collections: [publicSatelliteCollection],
          bbox: [
            Math.min(...lons),
            Math.min(...lats),
            Math.max(...lons),
            Math.max(...lats),
          ],
          datetime: `${from.toISOString()}/${now.toISOString()}`,
          limit: 48,
          sortby: [{ field: "properties.datetime", direction: "desc" }],
        }),
      },
    );
    if (!response.ok) throw Error("Catalog unavailable");
    const catalog = await response.json();
    if (!Array.isArray(catalog.features)) throw Error("Invalid catalog");
    return await collectObservations(
      catalog.features as Scene[],
      field,
      signal,
    );
  } catch {
    return {
      ...result,
      diagnostic: signal.aborted ? "search_timeout" : "catalog_unavailable",
    };
  }
}
