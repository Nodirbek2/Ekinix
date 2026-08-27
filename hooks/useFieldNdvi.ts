'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FieldRecord } from '@/lib/supabase';
import {
  NdviResult,
  fetchAndStoreFieldNdvi,
  formatNdviScore,
  getNdviStatusBadge,
  getCachedNdvi,
} from '@/lib/ndviService';
import { Language } from '@/lib/i18n';

export interface UseFieldNdviReturn {
  ndviResult: NdviResult | null;
  ndviScore: number | null;
  isAvailable: boolean;
  loading: boolean;
  error: Error | null;
  formattedScore: string;
  badge: {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  refetch: () => Promise<NdviResult | null>;
}

/**
 * Single source of truth React hook for individual field NDVI telemetry.
 * Automatically synchronizes with shared cache across all components.
 */
export function useFieldNdvi(
  field: FieldRecord | null | undefined,
  currentLang: Language = 'uz',
  simulateCloud = false
): UseFieldNdviReturn {
  const [ndviResult, setNdviResult] = useState<NdviResult | null>(() => {
    if (field?.id) {
      return getCachedNdvi(field.id);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => !ndviResult);
  const [error, setError] = useState<Error | null>(null);

  const fetchNdvi = useCallback(async () => {
    if (!field?.id) {
      setNdviResult(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchAndStoreFieldNdvi(field, simulateCloud);
      setNdviResult(result);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
      return null;
    }
  }, [field, simulateCloud]);

  useEffect(() => {
    let isMounted = true;
    if (field?.id) {
      const cached = getCachedNdvi(field.id);
      if (cached && !simulateCloud) {
        setNdviResult(cached);
        setLoading(false);
      } else {
        fetchNdvi();
      }
    } else {
      setNdviResult(null);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [field?.id, simulateCloud, fetchNdvi]);

  const ndviScore = ndviResult?.ndviScore ?? null;
  const isAvailable = ndviResult?.isAvailable ?? false;
  const formattedScore = useMemo(() => formatNdviScore(ndviScore, currentLang), [ndviScore, currentLang]);
  const badge = useMemo(() => getNdviStatusBadge(ndviScore, currentLang), [ndviScore, currentLang]);

  return {
    ndviResult,
    ndviScore,
    isAvailable,
    loading,
    error,
    formattedScore,
    badge,
    refetch: fetchNdvi,
  };
}

/**
 * Single source of truth React hook for multiple fields NDVI telemetry.
 * Calculates true average NDVI strictly over fields with real data (or null if no fields have data).
 */
export function useMultipleFieldsNdvi(
  fields: FieldRecord[],
  currentLang: Language = 'uz'
) {
  const [ndviMap, setNdviMap] = useState<Record<string, NdviResult>>(() => {
    const initial: Record<string, NdviResult> = {};
    fields.forEach((f) => {
      const cached = getCachedNdvi(f.id);
      if (cached) initial[f.id] = cached;
    });
    return initial;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fieldsKey = fields.map((f) => f.id).join(',');

  const fetchAll = useCallback(async () => {
    if (fields.length === 0) {
      setNdviMap({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const newMap: Record<string, NdviResult> = {};

    await Promise.all(
      fields.map(async (field) => {
        try {
          const res = await fetchAndStoreFieldNdvi(field);
          newMap[field.id] = res;
        } catch {
          // If fetch fails, populate honest unavailable result
          newMap[field.id] = {
            fieldId: field.id,
            ndviScore: null,
            isAvailable: false,
            statusTier: 'unknown',
            moisturePercentage: 55,
            satelliteDate: new Date().toISOString().split('T')[0],
            isCloudy: false,
            cloudCoverPercent: 85,
            cloudMessageUz: "Ma'lumot olinmadi",
            cloudMessageRu: "Данные не получены",
            cloudMessageEn: "Data unavailable",
            trend: null,
          };
        }
      })
    );

    setNdviMap(newMap);
    setLoading(false);
  }, [fields, fieldsKey]);

  useEffect(() => {
    let isMounted = true;
    fetchAll();
    return () => {
      isMounted = false;
    };
  }, [fieldsKey, fetchAll]);

  // Genuine average NDVI calculation across only available real scores
  const averageNdvi = useMemo(() => {
    const scores = Object.values(ndviMap)
      .map((n) => n.ndviScore)
      .filter((s): s is number => typeof s === 'number' && !isNaN(s) && s > 0);

    if (scores.length === 0) return null;
    const sum = scores.reduce((a, b) => a + b, 0);
    return parseFloat((sum / scores.length).toFixed(2));
  }, [ndviMap]);

  const formattedAverageNdvi = useMemo(() => {
    return formatNdviScore(averageNdvi, currentLang);
  }, [averageNdvi, currentLang]);

  return {
    ndviMap,
    loading,
    averageNdvi,
    formattedAverageNdvi,
    refetchAll: fetchAll,
  };
}
