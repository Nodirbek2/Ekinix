'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { CROP_OPTIONS } from '@/components/FarmerOnboardingModal';
import { MapPin, RotateCcw, Trash2, Check, Calendar, Layers, Sparkles, AlertCircle } from 'lucide-react';

interface FieldMapDrawerProps {
  currentLang: Language;
  defaultRegion?: string;
  onSaveField: (fieldData: {
    name: string;
    crop_type: string;
    planting_date: string;
    area_hectares: number;
    coordinates: [number, number][];
  }) => void;
  onCancel?: () => void;
}

// Region center coordinates in Uzbekistan
const REGION_COORDS: Record<string, [number, number]> = {
  "Toshkent viloyati": [41.2995, 69.2401],
  "Toshkent shahri": [41.2995, 69.2401],
  "Samarqand viloyati": [39.6542, 66.9597],
  "Farg'ona viloyati": [40.3842, 71.7843],
  "Buxoro viloyati": [39.7747, 64.4286],
  "Namangan viloyati": [40.9983, 71.6726],
  "Andijon viloyati": [40.7821, 72.3442],
  "Qashqadaryo viloyati": [38.8605, 65.7891],
  "Surxondaryo viloyati": [37.2242, 67.2783],
  "Xorazm viloyati": [41.5503, 60.6317],
  "Navoiy viloyati": [40.1031, 65.3688],
  "Sirdaryo viloyati": [40.4897, 68.7842],
  "Qoraqalpog'iston Respublikasi": [43.7683, 59.0214],
};

// Calculate geodesic area of polygon in hectares
export function calculatePolygonAreaHectares(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const RAD = Math.PI / 180;
  const R = 6378137; // Earth radius in meters
  let areaMeters = 0;

  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    
    const lat1 = p1[0] * RAD;
    const lat2 = p2[0] * RAD;
    const lon1 = p1[1] * RAD;
    const lon2 = p2[1] * RAD;

    areaMeters += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  areaMeters = Math.abs((areaMeters * R * R) / 2.0);
  const hectares = areaMeters / 10000;
  return parseFloat(hectares.toFixed(2));
}

export const FieldMapDrawer: React.FC<FieldMapDrawerProps> = ({
  currentLang,
  defaultRegion = "Toshkent viloyati",
  onSaveField,
  onCancel,
}) => {
  const t = translations[currentLang];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Leaflet map refs
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polygonRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const [points, setPoints] = useState<[number, number][]>([]);
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  
  // Form State
  const [fieldName, setFieldName] = useState("Paxta maydoni #1");
  const [cropType, setCropType] = useState('cotton');
  const [plantingDate, setPlantingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  const calculatedArea = calculatePolygonAreaHectares(points);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const center = REGION_COORDS[defaultRegion] || [41.2995, 69.2401];

      const map = L.map(mapContainerRef.current, {
        center,
        zoom: 14,
        zoomControl: false,
      });

      // Add Zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Tile layers
      const satelliteTile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
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

      if (mapType === 'satellite') {
        satelliteTile.addTo(map);
      } else {
        streetTile.addTo(map);
      }

      // Map Click Handler to place boundary points
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        const newPoint: [number, number] = [
          parseFloat(e.latlng.lat.toFixed(6)),
          parseFloat(e.latlng.lng.toFixed(6)),
        ];
        setPoints((prev) => [...prev, newPoint]);
      });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [defaultRegion, mapType]);

  // Update map layer when mapType changes
  useEffect(() => {
    async function switchLayer() {
      if (!mapInstanceRef.current) return;
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      map.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      if (mapType === 'satellite') {
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        ).addTo(map);
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);
      }
    }
    switchLayer();
  }, [mapType]);

  // Redraw markers & polygon overlay whenever points state updates
  useEffect(() => {
    async function updateMapOverlays() {
      if (!mapInstanceRef.current) return;
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      if (polygonRef.current) map.removeLayer(polygonRef.current);
      if (polylineRef.current) map.removeLayer(polylineRef.current);

      // Custom Natural Tones pin icon
      const pinIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: #D9A441; border: 2px solid #1F3D2B; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      // Add markers
      points.forEach((pt) => {
        const marker = L.marker(pt, { icon: pinIcon }).addTo(map);
        markersRef.current.push(marker);
      });

      // Draw polyline (2 points) or polygon (>=3 points)
      if (points.length >= 3) {
        polygonRef.current = L.polygon(points, {
          color: '#D9A441',
          weight: 3,
          fillColor: '#1F3D2B',
          fillOpacity: 0.45,
        }).addTo(map);
      } else if (points.length === 2) {
        polylineRef.current = L.polyline(points, {
          color: '#D9A441',
          weight: 3,
          dashArray: '5, 5',
        }).addTo(map);
      }
    }

    updateMapOverlays();
  }, [points]);

  const handleClearPoints = () => {
    setPoints([]);
    setError(null);
  };

  const handleUndoLastPoint = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, points.length - 1));
    }
  };

  const handleSave = () => {
    if (!fieldName.trim()) {
      setError(currentLang === 'uz' ? "Iltimos, maydon nomini kiriting" : "Введите название поля");
      return;
    }
    if (points.length < 3) {
      setError(t.drawBoundaryInstruction);
      return;
    }

    onSaveField({
      name: fieldName.trim(),
      crop_type: cropType,
      planting_date: plantingDate,
      area_hectares: calculatedArea > 0 ? calculatedArea : 1.5,
      coordinates: points,
    });
  };

  return (
    <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#1F3D2B] p-5 sm:p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4D9C4] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#D9A441] animate-pulse" />
            <h3 className="font-serif text-xl font-bold text-[#1F3D2B]">
              {t.addFieldBtn}
            </h3>
          </div>
          <p className="text-xs text-[#6C7C6F] mt-1">
            {t.drawBoundaryInstruction}
          </p>
        </div>

        {/* Map Type Toggle */}
        <div className="flex items-center gap-1 bg-[#F0E8D8] p-1 rounded-xl border border-[#E4D9C4] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapType === 'satellite'
                ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                : 'text-[#1F3D2B] hover:bg-[#FAF7F0]/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Sun&apos;iy yo&apos;ldosh</span>
          </button>
          <button
            type="button"
            onClick={() => setMapType('street')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapType === 'street'
                ? 'bg-[#1F3D2B] text-[#FAF7F0] shadow-xs'
                : 'text-[#1F3D2B] hover:bg-[#FAF7F0]/60'
            }`}
          >
            <span>Xarita</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border-2 border-[#1F3D2B] shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Overlay Instructions Bar */}
        <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none flex justify-between items-start gap-2">
          <div className="bg-[#1F3D2B]/90 text-[#FAF7F0] backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg border border-[#D9A441]/40 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#D9A441] shrink-0" />
            <span>
              {points.length === 0 && "Xaritada yer joyini belgilash uchun 1-burchak nuqtasini bosing"}
              {points.length > 0 && points.length < 3 && `Yana kamida ${3 - points.length} ta nuqta bosing`}
              {points.length >= 3 && "Maydon chegaralari yopildi. Maydonni saqlashingiz mumkin!"}
            </span>
          </div>

          <div className="bg-[#FAF7F0] text-[#1F3D2B] px-3 py-1.5 rounded-xl text-xs font-bold shadow-md border border-[#E4D9C4] flex items-center gap-1.5 shrink-0">
            <span className="text-[#D9A441]">{points.length}</span>
            <span>{t.pointsCount}</span>
          </div>
        </div>

        {/* Map Control Buttons */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUndoLastPoint}
              disabled={points.length === 0}
              className="bg-[#FAF7F0] hover:bg-[#F0E8D8] text-[#1F3D2B] px-3 py-1.5 rounded-xl text-xs font-bold shadow-md border border-[#E4D9C4] flex items-center gap-1 disabled:opacity-40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D9A441]" />
              <span>Orqaga</span>
            </button>

            <button
              type="button"
              onClick={handleClearPoints}
              disabled={points.length === 0}
              className="bg-rose-50 hover:bg-rose-100 text-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md border border-rose-200 flex items-center gap-1 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{t.resetMapPoints}</span>
            </button>
          </div>

          {/* Dynamic Calculated Area Widget */}
          <div className="bg-[#1F3D2B] text-[#FAF7F0] px-4 py-2 rounded-xl text-xs font-bold border border-[#D9A441] shadow-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D9A441]" />
            <span>
              {t.calculatedArea}: <strong className="text-[#D9A441] text-sm">{calculatedArea}</strong> {t.hectaresUnit}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Field Input Details Form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Field Name */}
        <div>
          <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
            {t.fieldNameLabel} *
          </label>
          <input
            type="text"
            required
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="Masalan: Janubiy G'o'za Maydoni"
            className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
          />
        </div>

        {/* Crop Selection */}
        <div>
          <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
            {t.cropTypeLabel} *
          </label>
          <select
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="w-full bg-white border border-[#E4D9C4] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
          >
            {CROP_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {t[c.nameKey as keyof typeof t] || c.id}
              </option>
            ))}
          </select>
        </div>

        {/* Planting Date */}
        <div>
          <label className="block text-xs font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
            {t.plantingDateLabel} *
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-[#D9A441] absolute left-3 top-3 pointer-events-none" />
            <input
              type="date"
              required
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              className="w-full bg-white border border-[#E4D9C4] rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
            />
          </div>
        </div>
      </div>

      {/* Save Action Controls */}
      <div className="pt-3 border-t border-[#E4D9C4] flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-[#1F3D2B] text-[#1F3D2B] font-bold text-xs hover:bg-[#F0E8D8] transition-colors"
          >
            Bekor qilish
          </button>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={points.length < 3}
          className="flex items-center gap-2 bg-[#D9A441] hover:bg-[#B8852B] text-[#1F3D2B] hover:text-[#FAF7F0] font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{t.saveFieldBtn}</span>
        </button>
      </div>

    </div>
  );
};
