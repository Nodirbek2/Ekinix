'use client';

import React, { useEffect, useRef } from 'react';
import { getSafeLeaflet, safeDestroyMap } from '@/lib/leafletHelper';

interface FieldCardThumbnailProps {
  coordinates?: [number, number][];
  height?: number;
}

export const FieldCardThumbnail: React.FC<FieldCardThumbnailProps> = ({
  coordinates,
  height = 110,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  const coordsKey = JSON.stringify(coordinates || []);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;

    async function initThumbnail() {
      if (typeof window === 'undefined' || !container) return;

      const L = await getSafeLeaflet();
      if (!isMounted || !container || !L) return;

      if (mapRef.current) {
        safeDestroyMap(mapRef.current, container);
        mapRef.current = null;
      }

      const defaultCenter: [number, number] =
        coordinates && coordinates.length > 0 ? coordinates[0] : [41.2995, 69.2401];

      const map = L.map(container, {
        center: defaultCenter,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      L.tileLayer(
        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        {
          attribution: '&copy; Google Maps',
          maxNativeZoom: 20,
          maxZoom: 22,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        }
      ).addTo(map);

      if (coordinates && coordinates.length >= 3) {
        const polygon = L.polygon(coordinates, {
          color: '#10B981',
          weight: 2,
          fillColor: '#10B981',
          fillOpacity: 0.25,
        }).addTo(map);

        try {
          map.fitBounds(polygon.getBounds(), { padding: [12, 12], animate: false });
        } catch {
          // ignore
        }
      }

      mapRef.current = map;
    }

    initThumbnail();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        safeDestroyMap(mapRef.current, container);
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordsKey]);

  if (!coordinates || coordinates.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-xs text-slate-500"
      >
        <span>Xarita koordinatasi yo&apos;q</span>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="w-full rounded-lg overflow-hidden border border-slate-200 relative bg-slate-900 isolate z-0"
    >
      <div ref={containerRef} className="w-full h-full relative z-0" />
    </div>
  );
};

export default FieldCardThumbnail;
