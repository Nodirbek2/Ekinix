'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FieldRecord } from '@/lib/supabase';
import { getSafeLeaflet, safeDestroyMap, createEkinixTileLayers } from '@/lib/leafletHelper';
import { Satellite, Layers, MapPin, Globe } from 'lucide-react';

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
  const tileLayersRef = useRef<{
    googleHybrid?: any;
    esriSatellite?: any;
    esriLabels?: any;
    street?: any;
  }>({});

  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [mapLoaded, setMapLoaded] = useState(false);

  // Invalidate map size on field change and mount to guarantee tiles render without grey voids
  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        try {
          mapRef.current.invalidateSize();
        } catch {
          // ignore
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [field, height]);

  // Hook into container resizing
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        try {
          mapRef.current.invalidateSize();
        } catch {
          // ignore
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Extract coordinates key string to prevent map thrashing on object reference changes
  const coordsKey = JSON.stringify(field.coordinates || []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordsKey]);

  // Compute bounding box / polygon center
  const center: [number, number] = React.useMemo(() => {
    if (coords.length === 0) return [41.2995, 69.2401];
    const sumLat = coords.reduce((acc, curr) => acc + curr[0], 0);
    const sumLon = coords.reduce((acc, curr) => acc + curr[1], 0);
    return [sumLat / coords.length, sumLon / coords.length];
  }, [coords]);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;

    async function initMap() {
      if (!container) return;

      const L = await getSafeLeaflet();
      if (!isMounted || !container || !L) return;

      // Clean up existing map instance safely
      if (mapRef.current) {
        safeDestroyMap(mapRef.current, container);
        mapRef.current = null;
      }

      // Create robust Tile Layers using createEkinixTileLayers (Google Hybrid up to Zoom 22, Esri with maxNativeZoom 18)
      const layers = createEkinixTileLayers(L);
      tileLayersRef.current = layers;

      const map = L.map(container, {
        center: center,
        zoom: 15,
        maxZoom: 22,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add initial layer (Google Hybrid by default for ultra-crisp satellite + road labels in Uzbekistan)
      if (mapType === 'satellite') {
        layers.googleHybrid.addTo(map);
      } else {
        layers.street.addTo(map);
      }

      // Draw real field boundary polygon drawn during registration
      const polygon = L.polygon(coords, {
        color: '#10B981',
        weight: 2.5,
        fillColor: '#10B981',
        fillOpacity: 0.25,
      }).addTo(map);

      polygon.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600;">${field.name}</h4>
          <p style="margin: 0; font-size: 11px; color: #64748b;">🌾 ${field.crop_type || 'Ekin'} &bull; ${field.area_hectares || 4.2} ha</p>
        </div>
      `);

      // Fit map view tightly around field polygon boundary
      try {
        map.fitBounds(polygon.getBounds(), { padding: [30, 30], animate: false });
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
        safeDestroyMap(mapRef.current, container);
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordsKey, field.id]);

  // Seamless Layer Switching without resetting map center or zoom level
  useEffect(() => {
    const map = mapRef.current;
    const { googleHybrid, street } = tileLayersRef.current;
    if (!map || !googleHybrid || !street) return;

    if (mapType === 'satellite') {
      if (map.hasLayer(street)) {
        map.removeLayer(street);
      }
      if (!map.hasLayer(googleHybrid)) {
        googleHybrid.addTo(map);
      }
    } else {
      if (map.hasLayer(googleHybrid)) {
        map.removeLayer(googleHybrid);
      }
      if (!map.hasLayer(street)) {
        street.addTo(map);
      }
    }
  }, [mapType]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-900 isolate z-0">
      
      {/* Map Layer Switcher Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/60 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
          <Satellite className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sentinel-2 L2A Telemetriya</span>
        </div>

        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-0.5 rounded-lg border border-slate-200 flex items-center gap-0.5 shadow-sm text-xs">
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              mapType === 'satellite'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Satellite className="w-3 h-3" />
            <span>Sun&apos;iy yo&apos;ldosh</span>
          </button>
          <button
            onClick={() => setMapType('street')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              mapType === 'street'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Xarita</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas Container */}
      <div
        ref={containerRef}
        style={{ height: `${height}px` }}
        className="w-full relative z-0"
      />

      {/* Loading overlay if map initializing */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-300 text-xs font-medium gap-2 z-20">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-emerald-500 rounded-full animate-spin" />
          <span>Xarita yuklanmoqda...</span>
        </div>
      )}

      {/* Map Footer Information Bar */}
      <div className="bg-slate-900 text-slate-300 px-3 py-2 text-xs flex items-center justify-between border-t border-slate-800">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">{field.name}</span>
          <span className="text-slate-400 text-[11px]">({coords.length} chegara nuqtasi)</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {center[0].toFixed(4)}°N, {center[1].toFixed(4)}°E
        </span>
      </div>

    </div>
  );
};
