# Ekinix

Field monitoring and irrigation decision support for Uzbekistan, in Uzbek, Russian, and English. Next.js, Supabase Auth/Postgres, Open-Meteo, Copernicus / Earth Search Sentinel-2, and optional Gemini explanations.

## Run

Use Node 24, `npm ci`, copy `.env.example` to `.env.local`, configure the project keys, then `npm run dev`. Never commit secrets. `npm test`, `npm run lint`, and `npm run build` are the verification gates. Apply the committed Supabase migrations before deploying the app.

## MVP workflows

Email signup/recovery and legacy phone login; field boundaries, crop/date and optional grower stage; real satellite NDVI with a public Earth Search COG fallback and acquisition dates and usable-pixel coverage; weather forecasts clearly separated from measured moisture; manual or authenticated device readings; calibrated irrigation estimates; actual irrigation records; archive/restore; CSV export. Telegram and unfinished marketplace/chat flows are removed.

Missing providers, stale readings and unconfigured soil calibration are shown explicitly. The demo contains labeled fixtures. No fabricated observation fallbacks. NDVI is a vegetation indicator, not a disease diagnosis. Estimates require fresh calibrated VWC and confirmed field capacity, wilting point and root depth. A single sensor may not represent a whole field: validate representativeness and irrigation efficiency with the grower/agronomist before using estimates. No valve or pump automation.

## Operations

Production: https://ekinix.vercel.app. Database policies enforce ownership. Server routes verify bearer sessions and field access; only server code uses service-role credentials. Device secrets are shown once and stored hashed. AI is optional and requires a separately provisioned Gemini key. Email confirmation/recovery requires working Supabase email delivery and an allowed production redirect URL.

See `docs/MVP_PROGRESS.md`, `docs/VERIFICATION.md`, `docs/SENSOR_PROTOCOL.md`. `tests/rls.sql` uses synthetic fixtures inside a rollback transaction. Keep migrations additive and preserve user records. Retired database tables are retained for recovery; the shipped app no longer reads them.
