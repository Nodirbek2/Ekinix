'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FieldRecord } from '@/lib/supabase';
import { Satellite, Layers, MapPin } from 'lucide-react';

interface FieldMonitoringMapProps {
  field: FieldRecord | {
    id: string;
    name: string;
    coordinates?: [number, number][];
    area_hectares?: number;
    crop_type?: string;
    region?: string;
  };
  height?: number;
}

export const FieldMonitoringMap: React.FC<FieldMonitoringMapProps> = ({
  field,
  height = 360,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);

  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Extract coordinates or fallback to Uzbekistan regional defaults
  const coords: [number, number][] = React.useMemo(() => {
    if (field.coordinates && field.coordinates.length >= 3) {
      return field.coordinates;
    }
    // Default polygon around Yangiyo'l, Tashkent region if coordinates not specified
    return [
      [41.1158, 69.0485],
      [41.1185, 69.0520],
      [41.1160, 69.0565],
      [41.1130, 69.0525],
    ];
  }, [field.coordinates]);

  // Compute bounding box / polygon center
  const center: [number, number] = React.useMemo(() => {
    if (coords.length === 0) return [41.2995, 69.2401];
    const sumLat = coords.reduce((acc, curr) => acc + curr[0], 0);
    const sumLon = coords.reduce((acc, curr) => acc + curr[1], 0);
    return [sumLat / coords.length, sumLon / coords.length];
  }, [coords]);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!containerRef.current) return;

      const L = (await import('leaflet')).default;

      if (!isMounted) return;

      // Clean up existing map instance
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Base tile layers
      const satelliteTile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri &mdash; Sentinel-2 Satellite',
          maxZoom: 19,
        }
      );

      const streetTile = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }
      );

      const activeTile = mapType === 'satellite' ? satelliteTile : streetTile;

      const map = L.map(containerRef.current, {
        center: center,
        zoom: 15,
        layers: [activeTile],
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Draw real field boundary polygon drawn during registration
      const polygon = L.polygon(coords, {
        color: '#D9A441',
        weight: 3.5,
        fillColor: '#1F3D2B',
        fillOpacity: 0.45,
        dashArray: '6, 6',
      }).addTo(map);

      polygon.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; color: #1F3D2B;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; font-serif: serif;">${field.name}</h4>
          <p style="margin: 0; font-size: 12px; color: #6C7C6F;">🌾 ${field.crop_type || 'Ekin'} &bull; ${field.area_hectares || 4.2} ha</p>
        </div>
      `);

      // Fit map view tightly around field polygon boundary
      try {
        map.fitBounds(polygon.getBounds(), { padding: [30, 30] });
      } catch {
        // ignore
      }

      mapRef.current = map;
      polygonRef.current = polygon;
      if (isMounted) setMapLoaded(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coords, center, mapType, field]);

  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-[#E4D9C4] shadow-md bg-[#1F3D2B]">
      
      {/* Map Layer Switcher Header */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-[#1F3D2B]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white text-xs font-bold flex items-center gap-2 shadow-md">
          <Satellite className="w-4 h-4 text-[#D9A441]" />
          <span>Sentinel-2 L2A Telemetry Map</span>
        </div>

        <div className="pointer-events-auto bg-white/90 backdrop-blur-md p-1 rounded-xl border border-[#E4D9C4] flex items-center gap-1 shadow-md">
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              mapType === 'satellite'
                ? 'bg-[#1F3D2B] text-[#D9A441]'
                : 'text-[#6C7C6F] hover:text-[#1F3D2B]'
            }`}
          >
            <Satellite className="w-3 h-3" />
            <span>Sun&apos;iy yo&apos;ldosh</span>
          </button>
          <button
            onClick={() => setMapType('street')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              mapType === 'street'
                ? 'bg-[#1F3D2B] text-[#D9A441]'
                : 'text-[#6C7C6F] hover:text-[#1F3D2B]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Xarita</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas Container */}
      <div
        ref={containerRef}
        style={{ height: `${height}px` }}
        className="w-full z-0"
      />

      {/* Loading overlay if map initializing */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#1F3D2B] flex items-center justify-center text-white text-xs font-bold gap-2 z-[999]">
          <div className="w-4 h-4 border-2 border-white border-t-[#D9A441] rounded-full animate-spin" />
          <span>Interaktiv xarita yuklanmoqda...</span>
        </div>
      )}

      {/* Map Footer Information Bar */}
      <div className="bg-[#1F3D2B] text-[#FAF7F0] p-3 text-xs flex items-center justify-between border-t border-white/10">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#D9A441]" />
          <span className="font-bold">{field.name}</span>
          <span className="text-[#D9A441]/80">({coords.length} ta chegara nuqtasi)</span>
        </div>
        <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-md font-mono">
          {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E
        </span>
      </div>

    </div>
  );
};
