# Verification — 2026-10-21

- Production build: passed (Next.js 15.5.24, type and lint checks enabled).
- ESLint: passed, no suppressed build lint gate.
- Six domain tests: passed. Calibrated units/rounding, missing/stale/uncalibrated data, weather failure/rain, harvest, recent watering, invalid calibration, polygon topology and legacy login.
- Database rollback integration tests: passed. Own-profile update, own-field read, cross-owner denial, watering/manual reading persistence, forged device-source denial, per-user AI quota. Repeated after moving privileged budget code into private schema.
- Additive migrations applied to Ekinix Supabase. Existing records preserved.
- Preview build 496daf1: READY. UI access blocked by Vercel protection; connector share access returned 403. No protection settings weakened.
- Public deployment/browser verification: pending release.
- Gemini key absent in production at audit: optional AI explanation cannot be validated until configured.
- Physical sensor and email delivery round trips: not yet verified.

## Live verification

- Production d96bebf deployed READY at ekinix.vercel.app; landing/demo/map/history/language switch rendered. No Ekinix application console errors observed (browser-extension and earlier Vercel login warnings excluded).
- Disposable QA account: password auth 200; profile update, field create, soil/watering persistence, device registration, archive/restore passed through REST with owner token.
- Production API: unauthenticated monitoring 401; Telegram 404; weather 200 with actual model time; sensor POST/retry both 202; invalid VWC 400; incorrect device key 401. AI correctly reports 503 ai_not_configured.
- QA sessions, account, and linked test data removed after testing; remaining QA user count zero.
- Copernicus existing credentials rejected: 401 unauthorized_client. Public Earth Search Sentinel-2 COG fallback added; locally verified actual scene dates 2026-10-17 / 2026-10-20, polygon means 0.252 / 0.279 and usable coverage 98% / 95% on the synthetic test boundary. Source scale AND offset applied; SCL mask + field mask; no imagery fabricated.
- Fallback deployment pending. Cloud-free retrieval is not guaranteed; missing/old observations remain explicitly labeled.
- Security advisor: private quota table and retired Telegram table intentionally have no user RLS policy. Leaked-password protection remains disabled in Supabase Auth; requires account-level configuration.

- Telegram deleteWebhook returned 200/ok; getWebhookInfo confirmed empty webhook URL. No messages sent and pending updates not purged. Old environment keys are unused.
- Nine regression tests and production build passed including public satellite fallback.
