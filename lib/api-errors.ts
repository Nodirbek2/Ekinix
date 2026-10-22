/** Never show an upstream HTML error page or transport internals to a grower. */
export function responseError(status: number, body: unknown): string {
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string" &&
    /^[a-z][a-z0-9_]{0,79}$/.test(body.error)
  )
    return body.error;
  if (status === 401) return "session_expired";
  if (status === 429) return "rate_limited";
  if (status === 408 || status === 504) return "request_timeout";
  return "service_unavailable";
}
export function monitoringError(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  return [
    "session_expired",
    "rate_limited",
    "server_not_configured",
    "not_configured",
    "database_error",
    "network_error",
    "request_timeout",
  ].includes(code)
    ? code
    : "monitoring_unavailable";
}
