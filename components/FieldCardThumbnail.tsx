'use client';

import React, { useEffect, useRef } from 'react';
import { getSafeLeaflet, safeDestroyMap } from '@/lib/leafletHelper';

interface FieldCardThumbnailProps {
  coordinates?: [number, number][];
  height?: number;
}

export const FieldCardThumbnail: React.FC<FieldCardThumbnailProps> = ({
  coordinates,
  height = 140,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

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
          color: '#D9A441',
          weight: 2,
          fillColor: '#1F3D2B',
          fillOpacity: 0.5,
        }).addTo(map);

        try {
          map.fitBounds(polygon.getBounds(), { padding: [15, 15], animate: false });
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
  }, [coordinates]);

  if (!coordinates || coordinates.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full bg-[#1F3D2B]/10 rounded-xl border border-[#E4D9C4] flex items-center justify-center text-xs text-[#6C7C6F]"
      >
        <span>Xarita xarakteristikasi yo&apos;q</span>
      </div>
    );
  }

  return (
    <div
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border border-[#1F3D2B]/30 relative shadow-inner"
    >
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 bg-[#1F3D2B]/90 text-[#FAF7F0] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#D9A441]">
        Sun&apos;iy Yo&apos;ldosh
      </div>
    </div>
  );
};
