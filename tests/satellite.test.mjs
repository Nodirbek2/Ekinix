import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizePixels } from "../lib/server/public-satellite.ts";
const grid = {
  red: [2000, 2000, 2000, 2000],
  nir: [4000, 4000, 4000, 4000],
  scl: [4, 4, 4, 4],
  redScale: 0.0001,
  redOffset: -0.1,
  nirScale: 0.0001,
  nirOffset: -0.1,
  ring: [
    [0, 0],
    [20, 0],
    [20, 20],
    [0, 20],
  ],
  left: 0,
  top: 20,
  resolution: 10,
  width: 2,
  height: 2,
};
test("Sentinel processing offsets applied before NDVI", () => {
  assert.deepEqual(summarizePixels(grid), { ndvi: 0.5, validPercent: 100 });
});
test("Cloud mask and field polygon control usable coverage", () => {
  assert.deepEqual(summarizePixels({ ...grid, scl: [4, 4, 9, 9] }), {
    ndvi: 0.5,
    validPercent: 50,
  });
  assert.equal(summarizePixels({ ...grid, scl: [4, 9, 9, 9] }), null);
  assert.deepEqual(
    summarizePixels({
      ...grid,
      scl: [4, 9, 4, 9],
      ring: [
        [0, 0],
        [10, 0],
        [10, 20],
        [0, 20],
      ],
    }),
    { ndvi: 0.5, validPercent: 100 },
  );
});
test("No data or missing calibration cannot produce NDVI", () => {
  assert.equal(summarizePixels({ ...grid, redScale: NaN }), null);
  assert.equal(summarizePixels({ ...grid, red: [0, 0, 0, 0] }), null);
});

// Synthetic catalog/raster fixtures only: no private field boundary leaves the test runner.
const { collectObservations, prioritizeScenes } = await import(
  "../lib/server/public-satellite.ts"
);
const scene = (i, cloud = 70) => ({
  id: String(i),
  properties: {
    datetime: `2026-10-${String(22 - i).padStart(2, "0")}T10:00:00Z`,
    "eo:cloud_cover": cloud,
    "proj:epsg": 32642,
  },
  assets: {},
});
const syntheticField = {
  coordinates_json: [
    [41, 69],
    [41, 69.001],
    [41.001, 69.001],
  ],
};
test("search reaches usable acquisitions beyond the former six-scene limit", async () => {
  const scenes = Array.from({ length: 12 }, (_, i) =>
    scene(i, i >= 7 ? 5 : 90),
  );
  const result = await collectObservations(
    scenes,
    syntheticField,
    new AbortController().signal,
    async (s) =>
      Number(s.id) >= 7
        ? {
            date: s.properties.datetime.slice(0, 10),
            ndvi: 0.4,
            validPercent: 85,
          }
        : null,
  );
  assert.equal(result.status, "available");
  assert.equal(result.observations.length, 2);
  assert.ok(result.search.processed > 4);
  assert.equal(result.search.windowDays, 90);
});
test("raster failures and timeouts are not reported as cloud rejection", async () => {
  const r = await collectObservations(
    [scene(0)],
    syntheticField,
    new AbortController().signal,
    async () => {
      throw Error("Partial tile");
    },
  );
  assert.equal(r.status, "unavailable");
  assert.equal(r.diagnostic, "raster_read_failed");
  assert.equal(r.search.failed, 1);
  const controller = new AbortController();
  controller.abort();
  const a = await collectObservations(
    [scene(0)],
    syntheticField,
    controller.signal,
    async () => null,
  );
  assert.equal(a.status, "unavailable");
  assert.equal(a.diagnostic, "search_timeout");
});
test("completed quality rejection and an empty catalog have different causes", async () => {
  const r = await collectObservations(
    [scene(0), scene(1)],
    syntheticField,
    new AbortController().signal,
    async () => null,
  );
  assert.equal(r.status, "no_clear_scene");
  assert.equal(r.diagnostic, "quality_rejected");
  const none = await collectObservations(
    [],
    syntheticField,
    new AbortController().signal,
  );
  assert.equal(none.status, "unavailable");
  assert.equal(none.diagnostic, "catalog_no_scenes");
});
test("recent scenes retain priority and duplicate acquisition dates do not duplicate history", async () => {
  const scenes = [
    ...Array.from({ length: 6 }, (_, i) => scene(i)),
    scene(6, 1),
  ];
  assert.equal(prioritizeScenes(scenes)[0].id, "0");
  assert.equal(prioritizeScenes(scenes)[4].id, "6");
  const result = await collectObservations(
    [scene(0), scene(0)],
    syntheticField,
    new AbortController().signal,
    async (s) => ({
      date: s.properties.datetime.slice(0, 10),
      ndvi: 0.3,
      validPercent: 90,
    }),
  );
  assert.equal(result.observations.length, 1);
});

test("unverified legacy Earth Search history cannot contaminate Collection 1 results", async () => {
  const { reusableSatellite, publicSatelliteCollection } = await import(
    "../lib/server/public-satellite.ts"
  );
  assert.equal(publicSatelliteCollection, "sentinel-2-c1-l2a");
  assert.equal(reusableSatellite(undefined), false);
  assert.equal(reusableSatellite({ source: "earth-search" }), false);
  assert.equal(
    reusableSatellite({
      source: "earth-search",
      collection: publicSatelliteCollection,
    }),
    true,
  );
  assert.equal(reusableSatellite({ source: "copernicus" }), true);
});
