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
- [x] Additive database migration, RLS, device ingestion, rate limits.
- [x] Replace unreliable data services with validated/authenticated APIs.
- [x] Rebuild focused responsive workspace + accessible auth/forms; all UZ/RU/EN strings.
- [x] Remove Telegram and obsolete feature code.
- [x] Meaningful unit + DB/RLS + API integration tests, lint/typecheck/build.
- [x] Push reviewed branch, inspect preview, release main, verify production.
- [x] Record remaining external provisioning/hardware limitations honestly.

## Continuation instructions
Read this file, git status/log, latest docs/VERIFICATION.md (when present). Do not restart or repeat completed work. Never include env secrets in commits or logs. Keep checkpoint synced to branch at milestones. Physical sensor end-to-end and external account provisioning cannot be claimed without evidence.

## Checkpoint 2026-10-21 (implementation, not deployed)
Migration 20261021114459 applied successfully. Focused app and authenticated monitoring/AI/device APIs implemented. Telegram routes and cron removed. Lint/type/build verification underway; tests in tests/domain.test.mjs. Cache bound to boundary hash; cross-account async state guarded. Remaining: RLS integration tests, browser QA, provider validation, deployment. GEMINI_API_KEY absent in production; AI must report unavailable honestly. Physical device not tested.

## Latest checkpoint (2026-10-21 continuation)
Main and remote fix branch at d96bebf16e0777e3adbdd02c975120c0241de174, production deployment dpl_HdPK64u4spMztPScaTtcRaN5fcYc READY. Local git equivalent 7260d66 (connector/local commit SHAs differ).
Core app production browser and authenticated API tests passed; see VERIFICATION. QA fixture fully removed. Current uncommitted changes: real public Sentinel COG fallback (geotiff 3.0.5, proj4 2.22.0), calibrated pixel tests, Uzbek date formatting, satellite history preservation, trimmed field names, updated provider privacy/attribution. Existing Copernicus credentials invalid (401 unauthorized_client); GEMINI_API_KEY absent. Next: finish checks, commit/push fallback, verify production build and actual fallback via authenticated test fixture, clean fixture, update final verification. Never claim physical sensor or email confirmation tested.

## Released and verified
Implementation commit 24ba8c3c5e6b38df9d80039d532dc0a56688d290 is deployed to https://ekinix.vercel.app (dpl_XQkjuDGQDzHXGgZ38u7Xx1VCgv9T READY). Nine tests, lint, types/build passed. Real public Sentinel fallback verified on deployed authenticated route (200, two real observations); weather and simulated hardware ingestion verified. Telegram code, cron, and external webhook disabled. Final QA fixtures removed.

Remaining user/account/hardware inputs are explicitly recorded in docs/VERIFICATION.md: Gemini key, email delivery round trip, real sensor calibration/trial, optional leaked-password protection. Do not claim those complete. Do not repeat the rebuild on continuation. Resume from these dependencies or new user feedback.

## Design correction now in progress
User rejected the previous design, requested distinct restored sections, proper settings, no moisture hardware dependency, and map drawing with up to10 points plus explicit closure and location search. See docs/REDESIGN_PROGRESS.md for current code and next steps. A one-time continuation task was created for 2026-10-22 05:00 Asia/Tashkent. The redesign is not yet deployed; do not confuse new source files with a finished UI.

Redesign implementation now integrated and locally passes types/lint/build + 9 tests. Source files include owner-scoped shared data, eight actual section components, settings panels, new map-first landing, manual-close 10-point drawing and place search. Awaiting production browser QA; see REDESIGN_PROGRESS.

## Current authoritative status — 2026-10-22 redesign
The user's later correction supersedes earlier sensor-focused UI decisions: hardware is optional/out of current scope. Eight distinct sections and redesigned settings are integrated and live; see REDESIGN_PROGRESS.md for completed map, navigation and design checks. No further backend or schema changes required for this redesign. Readability/data-race polish passed lint/types/build and is released with this checkpoint. AI key and real mailbox delivery remain external launch dependencies.

## Agronomy extension — 2026-10-22
User requested successful-platform research, Uzbek crop phases and sensor-free irrigation recommendations. Implemented 24 crop profiles, crop-specific phase selection and source-linked guide; new distinct Irrigation planner connects field detail → forecast budget → completed irrigation journal. Uses FAO-56 reference ET0×Kc, explicit observed-phase confirmation, configurable efficiency and rain scenario, missing-data gates, local-day weather and review warnings. Winter/perennial crops no longer infer stage from planting age. 19 numeric crop profiles; 5 specialist systems guide-only. No DB migration. 20 tests + lint/types/production build pass. See AGRONOMY_SYSTEM.md for sources, assumptions and deployment QA continuation. No agronomic field-validation claims; AI key remains optional.
