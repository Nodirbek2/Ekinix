# Startup error reporting — 2026-10-22

User reports generic “Amal bajarilmadi” banner immediately after entering workspace.

Confirmed code paths:
- useFarmData automatically requests monitoring for up to six fields, discarded every monitoring error code and replaced it with request_failed.
- database_error had no localized mapping and also fell through to the generic message.
- fetch helper attempted JSON parsing even on HTML gateway error pages, losing timeout/status context.

Changes:
- Preserve actionable session/quota/config/database/network/timeout reasons; otherwise describe field observation loading failure specifically.
- Track monitoring errors per field; clear each error on successful reload instead of leaving a stale global banner. Preserve successful results when another field fails.
- Bound requests to 55 seconds; normalize non-JSON HTTP failures without exposing provider internals.
- Add Uzbek/Russian/English messages for database, transport, timeout and monitoring failures.
- 34 tests passed including non-JSON gateway/status handling; production build/types/lint passed.

Limit: exact underlying request failure on the user's authenticated account is not reproduced or established. No private monitoring API triggered because the earlier coordinate-transmission approval block remains unresolved. Do not claim satellite/network/database root cause fixed. Public demo cannot reproduce authenticated provider requests. Current connector team inventory returned no teams, so production runtime-log access was not available in this pass.
