import { responseError } from "./api-errors";
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export function requireClient() {
  if (!supabase) throw new Error("not_configured");
  return supabase;
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const client = requireClient();
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session) throw new Error("session_expired");
  let res: Response;
  try {
    res = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(55000),
    });
  } catch (e) {
    throw new Error(
      e instanceof Error && ["TimeoutError", "AbortError"].includes(e.name)
        ? "request_timeout"
        : "network_error",
    );
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(responseError(res.status, data));
  if (!data) throw new Error("service_unavailable");
  return data as T;
}
