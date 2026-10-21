# Ekinix MVP implementation checkpoint

## Authorized goal
Repair Ekinix end to end, remove Telegram, improve design as needed, prepare a real MVP. User explicitly requests persistent continuation checkpoints. Do not touch Qalamtype.

## Targets
- Repository: Nodirbek2/Ekinix, starting main 26e1f37c343982e44e1a2332cc439e150f3bbe82
- Working branch: fix/ekinix-mvp
- Supabase: xncvbfumfmyzucrkrgly (Ekinix)
- Vercel: prj_82wNd10Jh724BRz27RCMBFWAK4k5; ekinix.vercel.app
- Vercel MCP: explicit teamId produced 403, exact project ID without teamId works. Production previously dpl_AQXrjyK4dwfMuC4k2MFpsoeMfmMJ.

## Product decisions
Focus MVP on accounts, field boundaries/crop dates, observations, weather, irrigation log, sensor/manual soil readings, explainable advice and optional AI explanation.
Remove Telegram completely. Remove unfinished marketplace, simulated agronomist chat, fake upgrades and subsidy claims from shipped UI (old implementation recoverable in Git).
Use real-email signup + password recovery; preserve legacy phone-as-email login for existing users.
Never fabricate NDVI, weather, acquisition dates, soil moisture or AI confidence. Unknown/stale/modeled/manual/device are distinct.
Irrigation quantities only from fresh measured volumetric soil moisture and explicit soil/root-depth calibration. Calendar stage alone is estimated, overrideable by grower; no automatic irrigation control.

## Research
- https://cropx.com/cropx-platform/ : consolidated soil/satellite/weather data, field-first interface, irrigation planning.
- https://eos.com/products/crop-monitoring/ : field boundaries, vegetation histories, weather and field activities.
- Supabase password auth/RLS documentation; Copernicus Statistical API; Open-Meteo forecast docs checked 2026-10-21.

## Baseline evidence
Build passed, lint failed (5 errors/1 warning). Production page rendered.
Supabase farmers.user_id lacked unique constraint and update policy. Registration tried nonexistent Telegram column. watering_log and agronomist tables absent. ndvi_readings SELECT-only, zero rows. UI reported watering success without checking DB errors.
Sentinel fallback fabricated values; no sensor ingestion; chat generated canned replies locally. Demo showed contradictory irrigation/harvest advice.

## Execution checklist
- [in progress] Additive database migration, RLS, device ingestion, rate limits.
- [ ] Replace unreliable data services with validated/authenticated APIs.
- [ ] Rebuild focused responsive workspace + accessible auth/forms; all UZ/RU/EN strings.
- [ ] Remove Telegram and obsolete feature code.
- [ ] Meaningful unit + DB/RLS + API integration tests, lint/typecheck/build.
- [ ] Push reviewed branch, inspect preview, release main, verify production.
- [ ] Record remaining external provisioning/hardware limitations honestly.

## Continuation instructions
Read this file, git status/log, latest docs/VERIFICATION.md (when present). Do not restart or repeat completed work. Never include env secrets in commits or logs. Keep checkpoint synced to branch at milestones. Physical sensor end-to-end and external account provisioning cannot be claimed without evidence.

## Checkpoint 2026-10-21 (implementation, not deployed)
Migration 20261021114459 applied successfully. Focused app and authenticated monitoring/AI/device APIs implemented. Telegram routes and cron removed. Lint/type/build verification underway; tests in tests/domain.test.mjs. Cache bound to boundary hash; cross-account async state guarded. Remaining: RLS integration tests, browser QA, provider validation, deployment. GEMINI_API_KEY absent in production; AI must report unavailable honestly. Physical device not tested.
