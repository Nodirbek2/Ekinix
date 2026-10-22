# Crop phases and irrigation planning — 2026-10-22

## Product research translated into Ekinix
- EOSDA Crop Monitoring: https://eos.com/products/crop-monitoring/ — field register → vegetation/phase/weather → field action → activity log/report. Adopt the connected workflow, not claims of satellite disease diagnosis or unlicensed imagery layers.
- CropX: https://cropx.com/cropx-platform/irrigation-planning/ — water-use/ET context and field-specific irrigation planning. Ekinix does not claim CropX's sensors, ETa measurements, proprietary algorithms or demonstrated yield savings.
- Uzbekistan adaptation: Uzbek/Russian/English, ha/mm/m³, local civil-day forecast (Asia/Tashkent), winter cereal dormancy, repeat/spring planting context, drip/sprinkler/furrow, canal-delivery context, groundwater and salinity limits. A region name never acts as an invented irrigation multiplier.

## Scientific and local sources checked
1. FAO-56 chapter 6, tables 11–12: https://www.fao.org/4/x0490e/x0490e0b.htm — standard-condition ETc = ET0 × Kc; phase coefficient endpoints and example stage durations. Calendar examples come from stated foreign climates, are only rough estimates, and are not Uzbek-variety validation. Development/late phases use the full endpoint range because stage progress is unknown.
2. FAO irrigation efficiencies: https://www.fao.org/4/t7202e/t7202e08.htm — illustrative field application efficiencies: surface 0.60, sprinkler 0.75, drip 0.90. Users can change a page scenario; canal conveyance losses are excluded.
3. FAO effective rainfall: https://www.fao.org/4/s2022e/s2022e03.htm — runoff/percolation mean forecast rain is not automatically all effective. Default rain credit is zero; optional 50/80% are explicitly scenario assumptions, not FAO-calibrated effective-rain models. Rain is credited only on the same day, never against previous days.
4. Uzbekistan Ministry of Agriculture, 2026-06-19: https://gov.uz/oz/agro/news/view/15419 — cotton advice depends on soil texture and groundwater. Its conditional application doses are NOT copied into a universal Ekinix rule.
5. Ibragimov et al., Uzbekistan cotton study (2020): https://www.ars.usda.gov/research/publications/publication/?seqNo115=376082 — varieties and growth stages need different scheduling conditions. No variety-specific percentage is applied to all fields.
6. FAO water quality: https://www.fao.org/4/t0234e/t0234e00.htm — salinity, infiltration and related limits need separate management.
7. Open-Meteo: https://open-meteo.com/en/docs — reference evapotranspiration and precipitation forecasts; modeled data, not measured field moisture.

## Shipped scope
24 selectable crop profiles: cotton; generic, winter and spring wheat; barley; grain maize; field tomato; potato; bulb onion; carrot; cabbage; field cucumber; sweet melon; watermelon; sunflower; soybean; dry bean; chickpea; sesame; rice; alfalfa; table grape; apple; apricot. Each has tri-language crop-specific phase labels, field observation context, critical-phase guidance, local limitations and source links. This covers the catalog, not every plant species cultivated in Uzbekistan.

Four water-accounting phases: initial, development, mid and late. These are not a BBCH diagnostic model. All budgets require an explicit observed-phase confirmation in the current scenario; calendar stage alone does not unlock volumes. A persisted stage can be set in the existing field form. Changing crop clears inherited phase. Winter/perennial/cutting crops do not infer current stage from planting age.

19 profiles have FAO reference numeric budgeting. Rice, alfalfa and the 3 orchard profiles are guide-only until ponding/seepage/cutting/canopy modules exist. Salinity, shallow groundwater or greenhouse conditions selected by the user hide numeric budgets. No soil-moisture hardware is required.

## Deterministic model: fao56-budget-v1
- Inputs: actual loaded weather forecast, field crop/area/method, explicitly confirmed observed phase, application efficiency, optional rain-credit scenario.
- Seven fresh (≤6 h), contiguous Uzbekistan civil-day forecasts with finite ET0 and precipitation. Missing, duplicate, stale or future-invalid data blocks numeric output; missing rain never becomes zero.
- Daily ETc interval = ET0 × phase Kc endpoints.
- Daily replacement interval = max(0, ETc − scenario rain credit).
- Weekly budget = sum of daily intervals. Gross planning m³ = replacement mm × 10 × hectares / efficiency.
- Ranges describe reference coefficient variation and unknown phase progress, NOT confidence intervals.
- All figures are full calendar-day forecast budgets, NOT remaining hours today and NOT an order to apply that quantity now.
- Initial soil reserves, residual irrigation, capillary rise, runoff storage, percolation, salt leaching and canal losses are not modeled. Thus no automatic irrigation start/date, exact irrigation dose, disease diagnosis or claimed savings.
- Recent actual watering is shown as context, never silently subtracted from unknown soil storage. Forecast rain, ≥35°C, ≤0°C, recent watering and late season produce review cues, not crop damage diagnoses.
- Endpoints and assumptions are visible. Scenario CSV contains method version, phase confirmation, forecast timestamp, assumptions and daily numbers. Scenarios are session/page-only; completed irrigation remains an actual owner-scoped DB journal entry.
- Optional AI receives the same model budget and must distinguish it from measured soil refill advice. The deterministic planner works without a Gemini key.

## Validation
- 20 tests pass: 11 new planning/catalog cases plus 9 previous domain/Sentinel tests. Test cases cover units/area/efficiency, no sensor, phase gating, dormancy/harvest, invalid/stale/incomplete dates, absent rain/ET0, same-day rainfall accounting, late-phase ranges, recent watering, unsupported systems and timezone rollover.
- Production build passes with TypeScript and ESLint checks; 217 kB first load.
- Live public Open-Meteo check returned Asia/Tashkent local midnight 2026-10-22, seven days and real ET0 [2.89, 2.67, 2.30, 2.29, 2.33, 2.71, 1.48] mm. These are dated API evidence, never stored as production fallback observations.
- Read-only Supabase schema check: crop_type is text with no restricting crop check; existing stage/method values match this implementation. No migration or owner-record changes needed.
- Live browser release verification is recorded below after deployment.

## Remaining agronomic validation
Field trials and a local agronomist must calibrate coefficients, stage durations and application efficiency by variety, planting system, soils and local climate before claiming field-validated irrigation prescriptions. Optional FAO soil-water-balance initialization with farmer measurements, EC/groundwater, rice ponding, orchard canopy and alfalfa cutting cycles are future modules. Current estimates are planning support with the boundaries above.
