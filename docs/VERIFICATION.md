# Verification — 2026-10-21

- Production build: passed (Next.js 15.5.24, type and lint checks enabled).
- ESLint: passed, no suppressed build lint gate.
- Six domain tests: passed. Calibrated units/rounding, missing/stale/uncalibrated data, weather failure/rain, harvest, recent watering, invalid calibration, polygon topology and legacy login.
- Database rollback integration tests: passed. Own-profile update, own-field read, cross-owner denial, watering/manual reading persistence, forged device-source denial, per-user AI quota. Repeated after moving privileged budget code into private schema.
- Additive migrations applied to Ekinix Supabase. Existing records preserved.
- Preview build 496daf1: READY. UI access blocked by Vercel protection; connector share access returned 403. No protection settings weakened.
- Public deployment/browser verification: passed for the core flows listed below.
- Gemini key absent in production at audit: optional AI explanation cannot be validated until configured.
- Physical sensor and email delivery round trips: not yet verified.

## Live verification

- Production d96bebf deployed READY at ekinix.vercel.app; landing/demo/map/history/language switch rendered. No Ekinix application console errors observed (browser-extension and earlier Vercel login warnings excluded).
- Disposable QA account: password auth 200; profile update, field create, soil/watering persistence, device registration, archive/restore passed through REST with owner token.
- Production API: unauthenticated monitoring 401; Telegram 404; weather 200 with actual model time; sensor POST/retry both 202; invalid VWC 400; incorrect device key 401. AI correctly reports 503 ai_not_configured.
- QA sessions, account, and linked test data removed after testing; remaining QA user count zero.
- Copernicus existing credentials rejected: 401 unauthorized_client. Public Earth Search Sentinel-2 COG fallback added; locally verified actual scene dates 2026-10-17 / 2026-10-20, polygon means 0.252 / 0.279 and usable coverage 98% / 95% on the synthetic test boundary. Source scale AND offset applied; SCL mask + field mask; no imagery fabricated.
- Fallback production deployment 24ba8c3c5e6b38df9d80039d532dc0a56688d290 / dpl_XQkjuDGQDzHXGgZ38u7Xx1VCgv9T: READY. Authenticated monitoring returned 200 in 12.7s with weather available, satellite source earth-search, dates 2026-10-17 / 2026-10-20, NDVI 0.252 / 0.279, usable pixels 98% / 95%. Cloud-free retrieval is not guaranteed; missing/old observations remain explicitly labeled.
- Security advisor: private quota table and retired Telegram table intentionally have no user RLS policy. Leaked-password protection remains disabled in Supabase Auth; requires account-level configuration.

- Telegram deleteWebhook returned 200/ok; getWebhookInfo confirmed empty webhook URL. No messages sent and pending updates not purged. Old environment keys are unused.
- Nine regression tests and production build passed including public satellite fallback.

- Final production UI verified: Uzbek weekday abbreviations and date/time corrected, demo renders, no Ekinix application errors in browser console. Both disposable QA fixtures and their sessions/data removed; remaining synthetic QA account count zero.

## Launch dependencies still open

1. Configure GEMINI_API_KEY in Vercel production and redeploy to enable AI explanations. Deterministic irrigation calculations already work without it. Do not paste secrets into issue reports or chat.
2. Run one actual email signup confirmation and password-reset delivery round trip with an owned mailbox. Password authentication itself was tested.
3. Test a real moisture device, verify VWC calibration, representative depth/location, clock synchronization and network retries. HTTPS ingestion was tested with a simulator.
4. Enable Supabase leaked-password protection if the account plan supports it: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .

Copernicus credentials can be replaced later; public Sentinel fallback is working. Preview share/log connector access remains limited by Vercel team permissions; this did not prevent production deployment and API/browser verification. Mobile CSS is implemented, but a physical-phone visual check is not claimed.

## Redesign verification — 2026-10-22
Integrated production 99097de / dpl_8R2TTvfqmdukMWdXUNkUf53z5NWW READY. All eight screens inspected through live demo navigation; profile/preferences/security settings inspected. Field search filters 3→1 field; Wheat guide changes content; UZ/EN/RU language switching verified. Qibray tumani search returns actual Qibray result. Manual editor tested with 10 vertices: open at 3 and 10, explicit closure at button, reopen works and 11th point disabled. CSV download event succeeded but resulting file could not be inspected in shared files. Nine regression tests passed for integrated code; latest UI/data-race polish passes lint, TypeScript and production build (206 kB first load). No new DB migrations. Final visual/deployment evidence follows.

Final polish release fb8450c9a04b26756a043a6580566e3f28d70c29 / dpl_HbLJy2LRaqBQAguGn8CSXnhTTzXM: READY, alias ekinix.vercel.app verified. Live reload confirms updated demo observation labels and readability changes. Overview and settings screenshots inspected and saved alongside this document. No Ekinix application console errors observed (browser-extension metadata errors excluded). Fresh lint + all nine tests pass. Final evidence checkpoint is on fix/ekinix-mvp; main retains the verified code release.

## Agronomy planner release — 2026-10-22
Commit 864b8a1a9fc74bcef3abbea81c17981c54adf48a / dpl_DrTZU3RMExS2Qp2f6zJNtBXDB7qt READY, ekinix.vercel.app alias verified. Type/lint production build passed (217 kB first load), 20 tests passed. Read-only schema compatibility checked. Public Open-Meteo returned valid 7-day Asia/Tashkent ET0. Live browser verified phase gating, rain scenario calculation, special-condition block, dormancy, field switch reset, crop/phase reset in field editor, 24-profile guide/search, UZ/RU/EN, and field-detail → selected-field planner flow. CSV download event passed, bytes not inspected. Production screenshot docs/agronomy-planner.jpg. Full source/model/limits evidence: AGRONOMY_SYSTEM.md. No local field-validation claim.

## Empty NDVI repair — 2026-10-22
Production e1aac05488be44546815d843e13737f9f5f5903d / dpl_3EEBg7tRJUjiPRh8fiH3xQnnG1yr READY, domain alias verified. Collection 1 COGs, 90-day/48-candidate search, truthful failure-vs-quality states, targeted refresh, legacy-history separation and audit preservation. 25 tests + lint + type/build passed. End-to-end unrelated public USA sample returned 2 actual dated observations in 14.126s. Exact private-field final test blocked by automatic approval review pending explicit permission for field-boundary transmission to Earth Search; no bypass attempted. Details NDVI_FIX.md.
