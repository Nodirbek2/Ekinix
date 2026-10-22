import { test } from "node:test";
import assert from "node:assert/strict";
import { cropProfiles, phaseKc } from "../lib/crop-catalog.ts";
import { buildIrrigationPlan, uzbekDay } from "../lib/irrigation-plan.ts";
import { growthStage } from "../lib/domain.ts";
const now = new Date("2026-07-15T05:00:00Z");
const field = {
  crop_type: "maize",
  area_hectares: 2,
  irrigation_method: "drip",
};
const weather = {
  status: "available",
  fetchedAt: now.toISOString(),
  days: Array.from({ length: 7 }, (_, i) => ({
    date: `2026-07-${15 + i}`,
    et0: 5,
    rainMm: 0,
    rainProbability: 10,
    min: 18,
    max: 31,
  })),
};
const options = { phase: "mid", confirmed: true };
const make = (f = field, w = weather, o = options, water = []) =>
  buildIrrigationPlan(f, w, water, o, now);
test("sensor-free ETc budget uses FAO crop coefficient, area and method with correct units", () => {
  const p = make();
  assert.equal(p.status, "ready");
  assert.equal(p.days.length, 7);
  assert.deepEqual(p.totals.etc, [42, 42]);
  assert.deepEqual(p.totals.net, [42, 42]);
  assert.ok(Math.abs(p.totals.grossM3[0] - 933.333333) < 0.001);
  const furrow = make({ ...field, irrigation_method: "furrow" });
  assert.equal(furrow.totals.grossM3[0], 1400);
});
test("unknown or unconfirmed phase, harvest and dormancy cannot yield a budget", () => {
  for (const [o, status] of [
    [{ phase: "mid", confirmed: false }, "phase_needed"],
    [{ phase: null, confirmed: true }, "phase_needed"],
    [{ phase: "harvest", confirmed: true }, "harvest"],
    [{ phase: "dormant", confirmed: true }, "dormant"],
  ]) {
    const p = make(field, weather, o);
    assert.equal(p.status, status);
    assert.equal(p.totals, null);
  }
});
test("missing, invalid, stale, future, duplicate and incomplete weather fail closed", () => {
  for (const w of [
    null,
    { ...weather, status: "unavailable" },
    { ...weather, fetchedAt: "invalid" },
    { ...weather, fetchedAt: "2026-07-14T05:00:00Z" },
    { ...weather, fetchedAt: "2026-07-16T05:00:00Z" },
    { ...weather, days: weather.days.slice(1) },
    {
      ...weather,
      days: weather.days.map((d, i) => (i === 3 ? { ...d, et0: null } : d)),
    },
    {
      ...weather,
      days: weather.days.map((d, i) => (i === 3 ? { ...d, rainMm: NaN } : d)),
    },
    {
      ...weather,
      days: weather.days.map((d, i) =>
        i === 3 ? { ...d, date: weather.days[0].date } : d,
      ),
    },
  ])
    assert.equal(make(field, w).status, "weather_needed");
});
test("forecast rain never reduces the default budget and cannot cancel earlier days", () => {
  const w = {
    ...weather,
    days: weather.days.map((d, i) => ({ ...d, rainMm: i === 6 ? 50 : 0 })),
  };
  assert.deepEqual(make(field, w).totals.net, [42, 42]);
  const p = make(field, w, { ...options, rainCredit: 0.8 });
  assert.deepEqual(p.days[0].net, [6, 6]);
  assert.deepEqual(p.days[6].net, [0, 0]);
  assert.deepEqual(p.totals.net, [36, 36]);
  assert.ok(p.flags.includes("rain"));
});
test("late-season ranges stay explicit; no blanket stop for all crops", () => {
  const p = make({ ...field, crop_type: "tomato" }, weather, {
    ...options,
    phase: "late",
  });
  assert.equal(p.status, "ready");
  assert.ok(p.totals.etc[0] < p.totals.etc[1]);
  assert.ok(p.flags.includes("late"));
});
test("recent watering is context, never silently subtracted from unknown soil reserves", () => {
  const water = [{ watered_at: "2026-07-14T08:00:00Z", water_volume_m3: 500 }];
  const p = make(field, weather, options, water);
  assert.deepEqual(p.totals.net, [42, 42]);
  assert.ok(p.flags.includes("recent_watering"));
  assert.equal(water.length, 1);
});
test("rice, cutting forage and orchards are guide-only rather than false numeric models", () => {
  for (const id of ["rice", "alfalfa", "grape", "apple", "apricot", "other"]) {
    const p = make({ ...field, crop_type: id });
    assert.equal(p.status, "unsupported");
    assert.equal(p.totals, null);
  }
});
test("invalid area, efficiency and scenario rainfall cannot produce infinity or negative volumes", () => {
  for (const area of [NaN, 0, -1, 10001])
    assert.equal(
      make({ ...field, area_hectares: area }).status,
      "invalid_inputs",
    );
  for (const efficiency of [NaN, 0, 1.1])
    assert.equal(
      make(field, weather, { ...options, efficiency }).status,
      "invalid_inputs",
    );
  assert.equal(
    make(field, weather, { ...options, rainCredit: 2 }).status,
    "invalid_inputs",
  );
});
test("Uzbek day rolls over at UTC19 and heat/frost are warnings rather than disease diagnoses", () => {
  assert.equal(uzbekDay(new Date("2026-07-14T20:00:00Z")), "2026-07-15");
  const p = make(field, {
    ...weather,
    days: weather.days.map((d, i) => (i === 0 ? { ...d, max: 36, min: 0 } : d)),
  });
  assert.ok(p.flags.includes("heat"));
  assert.ok(p.flags.includes("frost"));
});
test("every published crop has complete tri-language phases and bounded reference Kc", () => {
  assert.equal(
    new Set(cropProfiles.map((c) => c.id)).size,
    cropProfiles.length,
  );
  for (const c of cropProfiles)
    for (const s of ["initial", "development", "mid", "late"]) {
      for (const l of ["uz", "ru", "en"]) assert.ok(c.phases[s][l].length > 3);
      const k = phaseKc(c, s);
      if (k) {
        assert.ok(k[0] > 0 && k[1] >= k[0] && k[1] < 2);
      }
    }
});
test("winter and perennial planting ages cannot auto-claim harvest or a spring phase", () => {
  for (const crop_type of [
    "wheat",
    "winter_wheat",
    "barley",
    "alfalfa",
    "apple",
    "grape",
  ])
    assert.equal(
      growthStage(
        { crop_type, planting_date: "2025-10-01", stage_override: null },
        now,
      ).stage,
      null,
    );
});
