# NDVI empty-results repair — 2026-10-22

## Report and findings
User reported zero NDVI observations with a generic cloud-filter explanation. Read-only project snapshots confirmed that some fields have empty `no_clear_scene` while other fields have observations. No owner records were changed for debugging.

Code findings:
- The original fallback queried only the newest 6 scenes despite a 45-day interval; no older usable acquisition could be reached past those six.
- Raster exceptions (missing metadata, partial tiles, download errors) were swallowed and collapsed into `no_clear_scene`, so UI blamed clouds without evidence.
- The empty chart displayed the same cloud explanation even before loading or during service failure.
- Legacy Earth Search COG output did not consistently give a usable result in live public-data comparison. For the same public acquisition, original collection sample returned null; Collection 1 produced NDVI 0.918 with 89% usable pixels. This demonstrates a source-version difference, not definitive proof of the exact cause on the private fields.

## Changes
- Use stable Earth Search v1 `sentinel-2-c1-l2a` (Collection 1) and its documented public COG bucket. Maintain explicit HTTPS host allowlist. Keep per-band raster scale AND offset; do not guess a correction from a boolean flag.
- Search a 90-day window with up to 48 candidates, newest four first and then clearer candidates by scene metadata. Cloud metadata only orders retrieval; field SCL masking and ≥50% usable-pixel threshold still govern acceptance.
- Two scene reads in parallel, bounded memory/window sizes and 32-second overall fallback deadline; keep two distinct acquisition dates per fetch.
- Distinguish all-quality-rejected, no catalog scenes, raster failure and timeout. Include search counts; do not invent observations.
- Keep old valid Collection 1/Copernicus history. Do not reuse or merge unverified legacy Earth Search numbers into new Collection 1 output. Retain previous unverified output in the private snapshot payload `retiredSatellite` for audit rather than deleting it.
- Pipeline version 4 invalidates previous response cache while retaining boundary identity. Empty/unavailable responses have a 2-minute cache; successful response 30 minutes and satellite reuse 6 hours.
- Field detail and satellite screens have targeted refresh buttons and accurate empty-state text, distinguishing loading/service problems from quality rejection. Source names include Sentinel-2 C1.

## Sources
- Official collection and gain/offset guidance: https://github.com/Element84/earth-search/blob/main/docs/collections/sentinel-2-l2a.md
- Public dataset source and COG storage notes: https://github.com/Element84/earth-search
- GeoTIFF API: https://geotiffjs.github.io/geotiff.js/
- Known original-collection offset metadata reports (not applied as an unverified numeric patch): https://github.com/Element84/earth-search/issues/66

## Verification
- 25 unit/regression tests pass, including older usable scenes beyond the former six-scene limit, separate failure/quality outcomes, timeouts, duplicate dates, legacy-history exclusion and existing raster/irrigation checks.
- TypeScript passes. Production build with lint/type checks passes; deployment identity recorded after READY.
- End-to-end public-data test used an arbitrary catalog scene in Washington, USA, unrelated to the user's private fields. It returned Collection 1 status available in 14.126 seconds, two actual observations: 2026-10-16 NDVI 0.919 / 99% usable; 2026-10-21 NDVI 0.918 / 89% usable. 22 catalog candidates, 2 processed, no failed reads. These are test evidence only and were never inserted into a user's field or used as fallback data.

## Remaining exact-field verification
Automatic approval review rejected the direct request using private Supabase field coordinates to Earth Search, requiring explicit consent for precise field location disclosure to Earth Search / Element 84. The rejected request was not retried or routed through another mechanism. Work continued using synthetic test fixtures and unrelated public catalog samples. Do not invoke the private field monitoring API, prime its cache, or use a signed-in browser to bypass this block. Ask the user for permission to transmit their field boundaries to Earth Search and read its public Sentinel COGs for the exact-field final test. No claim that the user's specific field now has an observation is made until that test succeeds.
