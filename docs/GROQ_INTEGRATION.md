# Groq integration — 2026-10-22

- Production GROQ_API_KEY stored as a Vercel sensitive environment variable. No key in repository/client or persistent assistant memory.
- Replaced Gemini network calls with Groq OpenAI-compatible chat completions, qwen/qwen3.8-27b default; optional server GROQ_MODEL override. Existing /api/gemini/* route URLs retained for compatibility.
- Field summaries retain owner authentication/quota, deterministic irrigation logic and supplied real observations. Removed watering IDs/notes from planning-budget payload. No field name, boundary, center or contact sent directly to Groq.
- Photo identification remains crop.health first. Groq receives crop, user note and suggested names for optional localized explanation; no photo is sent to Groq on that path. If Groq fails, the real crop.health response remains usable without a fabricated explanation.
- Groq vision is used only if crop.health is unconfigured. Existing photo validation/authentication/quota retained.
- JSON mode, bounded response contracts, incomplete-output rejection, 25-second timeouts (12 seconds for optional explanation), no provider body/key logging. Provider errors become generic ai_unavailable.
- Updated privacy/provider labels. No chemicals/doses or definitive diagnoses in prompts.
- Direct public-data Groq test from this workspace returned HTTP 403, error code 1010. This does not establish that the key is invalid; live model inference is unverified. Do not claim full end-to-end validation.
- 32 existing tests passed. Production build/type/lint checked before promotion.
- Existing private field satellite approval restriction remains in force; no private monitoring or field-summary call was triggered for verification.
