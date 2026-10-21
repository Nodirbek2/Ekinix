# Sensor ingestion

Add a device from a field's Devices tab. Configure its measurement depth and calibration flag. Copy the generated secret immediately; only its SHA-256 hash is stored. Disable a lost device and create a replacement. Never put the key in firmware shared publicly.

POST https://ekinix.vercel.app/api/sensors/readings
Authorization: Bearer ek_<64 hexadecimal characters>
Content-Type: application/json

```json
{"device_id":"UUID_FROM_DEVICE_SETUP","moisture_vwc":24.6,"temperature_c":22.1,"measured_at":"2026-10-21T12:00:00Z"}
```

Use actual UTC/offset ISO timestamps and volumetric water content (0–100 percent), not raw ADC or an arbitrary normalized percentage. Temperature is optional, -50 to 80 Celsius. Measurements may be at most seven days old or five minutes ahead. Account/field binding, depth, and calibration come from server-side device configuration. Disabled/archived devices are rejected. A repeated device/timestamp is idempotent. Nominal limit: 120 readings/hour/device; transmit every 15–60 minutes, retry with exponential backoff on 429/503. Never change the timestamp just to retry.

202 means accepted; 400 invalid payload; 401 invalid/disabled key; 429 rate limited; 503 service unavailable. The transport must validate TLS. The hardware model, calibration method, network resilience and representative placement require a physical field trial; this repository does not claim that trial has happened.
