# Ekinix redesign — release checkpoint 2026-10-22

## Authorized scope
User rejected the old duplicate Overview/Fields screens. Deliver distinct workflows, redesigned settings and a professional map/data-focused interface. Do not touch Qalamtype. Soil-moisture hardware is not required and is not exposed as the central workflow. Keep real backend, Sentinel and weather data; never invent production observations.

## Completed implementation
- Eight integrated sections: Farm overview, Fields, Satellite, Weather, Irrigation journal, Reports, Crop guide, Settings. Overview is a portfolio dashboard; Fields is a searchable register with map/list and archive/restore actions.
- New landing, navigation, responsive workspace, field detail and four settings panels (profile, preferences, security, data). Settings retains real profile persistence, language selection, password-reset request and exports.
- Satellite shows dated observations, usable coverage and NDVI history; map is explicitly a basemap, not a fabricated NDVI overlay. Weather shows forecast/rain/ET0; missing rain is not converted to zero.
- Irrigation journal records actual events without requiring a sensor. Reports export loaded owner records. Crop guide is general observational guidance, not automated agronomic diagnosis.
- Demo fixtures are explicitly labeled examples and are separate from account records.
- Drawing allows 3–10 points; no automatic closure. Close boundary explicitly closes it, Reopen/Undo/Clear support corrections. Save requires closure. Manual coordinates follow the same cap. Existing legacy polygons remain editable without truncation.
- City/district search uses explicit submission to Open-Meteo/GeoNames, Uzbekistan filter, and strips common administrative suffixes.
- Monitoring/watering state is owner-scoped; initial satellite loading capped at six fields, selected others load on demand. Revision guard rejects old responses after field changes.
- Readability polish increases small labels/body text and muted contrast; sticky header keeps controls accessible.

## Release and evidence
Integrated implementation 99097de844501291b76a0994a37a63606121fc29 is deployed READY at https://ekinix.vercel.app/ (dpl_8R2TTvfqmdukMWdXUNkUf53z5NWW).
Latest readability/data-race polish: lint, TypeScript and production build pass; publishing this checkpoint with that patch. Final deployment identity/visual verification is recorded in VERIFICATION.md after release.

Live browser checks against the integrated production release:
- All eight sections render distinct content; settings profile/preferences/security render.
- UZ → EN → RU language changes render translated navigation and guidance.
- Field search Bo‘zsuv returns one field / 8.6 ha. Crop guide Wheat changes text and linked field.
- Qibray tumani search returns Qibray, Tashkent Region and pans map.
- Actual editor accepts ten manual vertices. At three and ten points the SVG boundary remains open (no closing z); Close boundary produces a closed polygon / 5.52 ha. Reopen works; an eleventh Add point is disabled.
- CSV export produced a browser download event and path. The download file was unavailable through the shared filesystem, so its bytes were not inspected and no file attachment is claimed.
- Nine existing domain/raster tests passed for the integrated release. No DB schema changes in redesign.

## Remaining external limits
GEMINI_API_KEY is absent: optional AI explanation honestly reports unavailable. Real reset/confirmation email delivery still needs mailbox verification. Copernicus credentials are invalid; verified real public Sentinel fallback remains active. Physical-phone layout and hardware calibration are not claimed as tested; hardware is outside current scope.

## Resume safely
Read this file, MVP_PROGRESS.md, VERIFICATION.md and remote main/fix branch heads first. Do not repeat completed work or recreate test accounts unnecessarily. GitHub connector writes are needed because local push lacks credentials. Both main and fix/ekinix-mvp should point to the latest reviewed checkpoint. Exact Vercel project ID prj_82wNd10Jh724BRz27RCMBFWAK4k5 works without teamId. Supabase xncvbfumfmyzucrkrgly. No secrets in logs or commits.
