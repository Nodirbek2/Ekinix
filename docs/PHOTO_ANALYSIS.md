# Crop photo analysis — 2026-10-22

## User goal and implementation
A new dedicated Photo analysis / Rasm orqali tahlil screen lets a grower upload a crop/harvest photo or use the phone's file-camera capture UI. A field is optional; a standalone crop selector and symptom notes are supported. Field detail opens the screen with that field selected. UZ/RU/EN interface and prompts are included.

The result view separates visible observations, possible causes with supporting signs and field checks, next actions and additional photos. It is visual scouting support, not a laboratory diagnosis, a soil moisture measurement, a food-safety determination or a pesticide prescription. Retake/non-crop outcomes cannot contain speculative cause lists or urgent diagnosis labels. No numeric confidence score or fabricated analysis is displayed.

## Data path and access
- Browser validates source type/size, decodes, resizes to max1600px and re-encodes JPEG, stripping original filename and EXIF/GPS metadata. Original limit20MB/50MP, outbound photo limit2MB.
- The send button explicitly identifies transmission to Google Gemini. Ekinix does not persist photos or reports in the database. Provider retention is not claimed to be absent. Photos may still contain visible location/person information; UI advises crop closeups.
- POST /api/gemini/plant-photo requires a valid Supabase user token. Optional field lookup uses the caller's RLS client and only selects crop_type. No field boundaries, names, coordinates, satellite requests or account contact details are sent to Gemini.
- Multipart stream is bounded to2MB+20KB and actual JPEG/PNG/WebP signatures checked. SVG and external URL inputs are not supported. Body/image/notes are never logged.
- Existing per-user AI quota is shared with field explanations; quota is consumed only after file validation and provider configuration checks. No migrations or storage buckets required.
- Model response has a bounded validated contract; unknown output keys removed, malformed/truncated responses return errors. Image text and user notes are explicitly untrusted evidence, never model instructions. No HTML rendering.
- GET returns only provider configured boolean and upload limit, no key/model secrets. No-store responses. Missing key disables submission with a clear service message, leaving local photo preview usable.
- Image/result requests are invalidated on input changes; pending response cannot overwrite a new photo/field. Object URLs are revoked. Language/account key changes remount and cancel previous requests.

## Provider configuration
GEMINI_API_KEY in Vercel production is required. Optional model override: GEMINI_VISION_MODEL, then existing GEMINI_MODEL; default gemini-3.8-flash (current official model docs verified, image input and structured output supported). Gemini3 uses low thinking level; no incompatible zero thinking budget is sent. Timeout40s. Backend uses generateContent with inlineData, and no fake provider fallback.
- https://ai.google.dev/gemini-api/docs/image-understanding
- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash

## Checks
29 regression tests pass (4 new image-signature/output-contract cases plus25 existing tests). TypeScript passes and production build/lint gate passes. Live upload/availability and deployment evidence appended after release. Actual model analysis cannot be claimed until a configured API key and image-inference round trip succeed. Phone camera behavior requires physical-phone testing.

The earlier exact-field NDVI outbound approval block remains separate. Do not send private field coordinates for testing without its required consent. Photo analysis does not request or forward field coordinates.
