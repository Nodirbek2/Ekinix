# Simple irrigation and field chat — 2026-10-22

## Implemented
- New SimpleIrrigation card on field detail and irrigation planner: last recorded irrigation, confirmed phase, actual cached NDVI/date, weather since watering, candidate weather windows and clearly named forecast replacement budget.
- Advanced existing planner moved under expandable Calculation details and settings. Existing calculations retained.
- Watered — confirm record opens existing RecordForm; user supplies actual date/volume and saves through authenticated owner RLS. No click-only fabricated watering. After successful journal save, the card reloads using latest watering timestamp/volume.
- Owner-authenticated /api/irrigation/context reads watering and existing satellite snapshot, fetches Open-Meteo past-day model estimates (up to 92 days) and 7-day hourly forecast. No new database/schema or changed RLS required. Latest snapshot is used, not a new private satellite request.
- Only full days after irrigation day and before today are aggregated. Completeness checked; missing history is not zero. Historical crop-use estimates apply current confirmed Kc with explicit phase-history limitation.
- Weather windows selected from two consecutive known future hours, mornings/evenings, 5–28°C, precipitation <0.2 mm/h, probability <50%, wind ≤20 km/h (sprinkler ≤10). These are transparent conservative planning heuristics, NOT validated irrigation-need or optimal-time recommendations. One window/day, max three. No windows if missing last irrigation or unsupported/unconfirmed phase. Times in Asia/Tashkent. They are start opportunities, not irrigation duration.
- In-view reminders refresh weather every 30 minutes, clock every minute. No background SMS, email, push or closed-browser delivery claimed.
- FieldChat on field detail and planner: bounded conversation, owner auth/AI quota, server-supplied crop/phase/watering/history summary/forecast/NDVI, Groq JSON answer. Excludes boundary, centroid, IDs and contacts from model facts. Session-only chat, not persisted. AI cannot write records.
- Guardrails: never fabricate field zones, disease/soil measurements, exact irrigation dose/date from average NDVI. Existing deterministic budget remains distinct from immediate dose.

## Validation
39 tests passed, including window gaps, missing/rainy/cold/windy/past hours, sprinkler wind distinction, one-window-per-local-day and bounded chat follow-ups. Production build/types/lint passed before promotion. Public Tashkent model-weather sample returned 10 days and 240 hours; real data produced three candidate planning windows. No private field or user photo sent in tests.

## Material limits
Spatially resolved irrigation priorities are NOT implemented: current satellite pipeline returns field averages, not validated per-zone water deficits. No exact current irrigation dose can be established without a validated soil-water baseline and local conditions. No fake polygon subdivision or claimed precision. Current phase may differ from historical phase. Last-watering day/today are excluded; model weather is not an on-farm rain gauge. Missing history/forecast remains visibly incomplete.
Groq real inference previously rejected from workspace with HTTP 403/1010; signed-in chat response and real journal write not exercised in this pass. No automated private monitoring call due earlier coordinate-transmission approval restriction. Physical-phone verification pending.
