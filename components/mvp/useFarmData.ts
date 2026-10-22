"use client";
import { monitoringError } from "@/lib/api-errors";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, requireClient } from "@/lib/supabase";
import type { Field, Monitoring, Watering } from "@/lib/domain";
import { demoMonitoring, demoWaterings } from "@/lib/workspace";
export function useFarmData(fields: Field[], demo: boolean, account: string) {
  const [data, setData] = useState<Record<string, Monitoring>>({}),
    [water, setWater] = useState<Watering[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const owner = useRef(account),
    pending = useRef(new Set<string>()),
    revision = useRef(0);
  useEffect(() => {
    revision.current += 1;
    owner.current = account;
    pending.current.clear();
  }, [account, fields]);
  const loadField = useCallback(
    async (id: string) => {
      const generation = revision.current;
      const requestKey = `${generation}:${id}`;
      if (demo || pending.current.has(requestKey)) return;
      pending.current.add(requestKey);
      const expected = account;
      try {
        const m = await api<Monitoring>(`/api/monitoring?fieldId=${id}`);
        if (owner.current === expected && revision.current === generation) {
          setData((old) => ({ ...old, [id]: m }));
          setFieldErrors((old) => {
            const next = { ...old };
            delete next[id];
            return next;
          });
        }
      } catch (e) {
        if (owner.current === expected && revision.current === generation)
          setFieldErrors((old) => ({ ...old, [id]: monitoringError(e) }));
      } finally {
        pending.current.delete(requestKey);
      }
    },
    [account, demo],
  );
  const loadWater = useCallback(async () => {
    if (demo) return;
    if (!fields.length) {
      setWater([]);
      return;
    }
    const expected = account;
    const generation = revision.current;
    const { data, error } = await requireClient()
      .from("watering_log")
      .select("*")
      .in(
        "field_id",
        fields.map((f) => f.id),
      )
      .order("watered_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    if (owner.current === expected && revision.current === generation)
      setWater(data ?? []);
  }, [fields, demo, account]);
  useEffect(() => {
    let live = true;
    queueMicrotask(async () => {
      if (!live || demo) return;
      setData({});
      setFieldErrors({});
      setBusy(true);
      setError("");
      await Promise.all([
        loadWater().catch(() => {
          if (live) setError("database_error");
        }),
        (async () => {
          for (let i = 0; i < Math.min(fields.length, 6); i += 2) {
            if (!live) break;
            await Promise.all(
              fields.slice(i, i + 2).map((f) => loadField(f.id)),
            );
          }
        })(),
      ]);
      if (live) setBusy(false);
    });
    return () => {
      live = false;
    };
  }, [fields, demo, loadWater, loadField]);
  const refresh = useCallback(async () => {
    if (demo) return;
    setBusy(true);
    setError("");
    try {
      await Promise.all([
        loadWater(),
        ...fields.slice(0, 6).map((f) => loadField(f.id)),
      ]);
    } catch {
      setError("request_failed");
    } finally {
      setBusy(false);
    }
  }, [fields, demo, loadWater, loadField]);
  return {
    refresh,
    data: demo ? demoMonitoring : data,
    water: demo ? demoWaterings : water,
    busy: demo ? false : busy,
    error: demo ? "" : error || Object.values(fieldErrors)[0] || "",
    loadField,
    loadWater,
  };
}
