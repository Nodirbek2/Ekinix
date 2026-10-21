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
