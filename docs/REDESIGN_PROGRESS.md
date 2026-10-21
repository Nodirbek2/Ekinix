# Ekinix redesign — active checkpoint

## User corrections (authoritative)
User rejected the previous minimalist design and duplicate Overview/Fields screens. Continue without requiring a soil-moisture hardware tool. Restore a meaningful platform with distinct workflows and professionally redesigned settings.
Additional map requirement: up to 10 boundary points, NEVER auto-close at three; explicit Close boundary button; city/district location search.
User requested continuation in this same conversation at 05:00 Asia/Tashkent on 2026-10-22. A one-time automation was successfully created; read this checkpoint first on resume.

## Current production
Main a4664059532c412b61560910db56bcdc4cdfc4d8; implementation 24ba8c3c5e6b38df9d80039d532dc0a56688d290 deployed. Backend real Sentinel, weather, auth and watering journal verified. Keep that backend. Do not touch Qalamtype. Gemini key absent, physical hardware out of scope now.

## New local implementation (not yet released)
- lib/workspace.ts: nav labels for 8 distinct sections, explicitly labeled portfolio demo fixtures, CSV helpers and derived attention signals.
- components/mvp/PortfolioMap.tsx: interactive multi-field basemap, geographic boundaries, safe text tooltips, field selection.
- components/mvp/WorkspaceViews.tsx: FarmOverview, FieldsView (search/archive/list/map), SatelliteView (history/quality), WeatherView (7d/rain/ET0), JournalView, ReportsView (real CSV), GuideView. Needs type/lint review, layout stylesheet, integration. Fix malformed three-notes markup in WeatherView (Thermometer is outside article).
- components/mvp/SettingsView.tsx: separate profile, preferences, security, and data panels with working profile update, language, reset-email action, logout, export. Demo read-only.
- FieldMap + FieldForm: explicit closed state, max10 drawing points, polyline while drawing, Close/Reopen boundary, disabled save until closed, manual coordinates same rules, user-submitted place search via Open-Meteo/GeoNames UZ filter. Search strips city/district suffix. Preserve old polygons on edit. Validate in browser.
- lib/copy.ts: boundary_open error.

## Still to do
1. Fix any current types/lint errors (types-results.log), especially WorkspaceViews tuple types/optional field lookup.
2. Rebuild EkinixApp shell: integrate new views, new tasteful stylesheet replacing old green/lime landing/template; distinct overview vs field table. Keep existing auth/session race protection and persistence. Fetch owner-scoped watering logs and monitoring into session-scoped state; cap auto-monitor requests (e.g. 6) and allow selected field loading. No account-unscoped caches. Demo must navigate all sections, including Settings preview.
3. Replace old FieldWorkspace UI with hardware-free field detail, or stop importing it. Remove exposed sensor connect/cards/nav and modeled soil moisture centerpiece; keep underlying sensor records/API intact for later.
4. New landing matching product with actual map/workspace preview, no repetitive fake field illustrations.
5. CSS responsive sidebar/mobile menu/tables/forms/settings/maps; accessible labels and focus; sensible visual hierarchy. Test 8 sections separately, search and map drawing explicit-close flow; settings real owner persist if possible. Use CUA for browser.
6. Lint/types/test/build, save feature branch checkpoint; publish only after integrated checks. GitHub tools write commits (local git push lacks credentials). Exact Vercel project ID without teamId works; preview share/log access has scope errors. Main update expected_sha lease.
7. Update this checkpoint and VERIFICATION with actual evidence. Don't claim placeholders are completed.

## Targets
Repo Nodirbek2/Ekinix, branch fix/ekinix-mvp, local /workspace/scratch/6c1b8e244e3f/ekinix.
Vercel prj_82wNd10Jh724BRz27RCMBFWAK4k5; domain https://ekinix.vercel.app.
Supabase xncvbfumfmyzucrkrgly. No schema changes needed for this redesign.

## Integrated checkpoint
EkinixApp now integrates all 8 distinct sections, new Landing, SettingsView, FieldDetail (no hardware UI), useFarmData (owner-scoped, max6 auto-monitor fields), and new responsive stylesheet. FieldPicker loads additional selected fields on demand. Shared refresh control added. Current types and ESLint passed before refresh-control patch; 9 existing tests pass. Production build verification in progress. Next: review build log, checkpoint/push branch, deploy main after gates; browser check every section, explicit-close drawing to10 points and place search, screenshots; update final docs.

## Ready for browser QA
All 8 screens are integrated, not just new unreferenced files. Responsive stylesheet and new landing replace previous lime illustration layout. TypeScript and ESLint pass; production build passes (206 kB first-load JS); nine existing domain/satellite regression tests pass. Source was formatted for maintainability. Main still at a466... until release commit below. Next immediate action: push/lease-update main with integrated implementation, wait READY, use live demo to verify each distinct section and settings, drawing10 points/explicit closure, city search, CSV export, capture actual design screenshots. Existing preview share access is limited; production release is authorized and reversible.
