'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Language, translations } from '@/lib/i18n';
import { CROP_OPTIONS } from '@/components/FarmerOnboardingModal';
import { getSafeLeaflet, safeDestroyMap, createEkinixTileLayers } from '@/lib/leafletHelper';
import {
  UZBEKISTAN_REGIONS_GEO,
  ALL_UZBEKISTAN_REGIONS,
  getRegionGeoInfo,
  searchUzbekistanLocations,
  NominatimResult,
} from '@/lib/geoConstants';
import {
  MapPin,
  RotateCcw,
  Trash2,
  Check,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Search,
  X,
  Compass,
  CheckCircle2,
  Globe,
  Loader2,
} from 'lucide-react';

interface FieldMapDrawerProps {
  currentLang: Language;
  defaultRegion?: string | null;
  onSaveField: (fieldData: {
    name: string;
    crop_type: string;
    planting_date: string;
    area_hectares: number;
    region: string;
    coordinates: [number, number][];
  }) => void;
  onCancel?: () => void;
}

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
  defaultRegion,
  onSaveField,
  onCancel,
}) => {
  const t = translations[currentLang];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Region and Geolocation state
  const initialGeo = getRegionGeoInfo(defaultRegion);
  const [selectedRegion, setSelectedRegion] = useState<string>(initialGeo.nameKey);

  // Map state
  const [points, setPoints] = useState<[number, number][]>([]);
  const [isPolygonClosed, setIsPolygonClosed] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');

  // Keep refs for event listeners
  const pointsRef = useRef(points);
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  const isPolygonClosedRef = useRef(isPolygonClosed);
  useEffect(() => {
    isPolygonClosedRef.current = isPolygonClosed;
  }, [isPolygonClosed]);

  // Search / Geocoding state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Form State
  const [fieldName, setFieldName] = useState("Paxta maydoni #1");
  const [cropType, setCropType] = useState('cotton');
  const [plantingDate, setPlantingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  // Leaflet map refs
  const mapInstanceRef = useRef<any>(null);
  const tileLayersRef = useRef<{
    googleHybrid?: any;
    esriSatellite?: any;
    esriLabels?: any;
    street?: any;
  }>({});
  const markersRef = useRef<any[]>([]);
  const polygonRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  // Calculated area
  const calculatedArea = (isPolygonClosed && points.length >= 4)
    ? calculatePolygonAreaHectares(points)
    : 0;

  // 1. Initialize Leaflet Map once on mount
  useEffect(() => {
    let isMounted = true;
    const container = mapContainerRef.current;

    async function initMap() {
      if (typeof window === 'undefined' || !container) return;

      const L = await getSafeLeaflet();
      if (!isMounted || !container || !L) return;

      if (mapInstanceRef.current) {
        safeDestroyMap(mapInstanceRef.current, container);
        mapInstanceRef.current = null;
      }

      const geo = getRegionGeoInfo(defaultRegion);
      const initialCenter: [number, number] = [geo.lat, geo.lng];
      const initialZoom = geo.zoom;

      const map = L.map(container, {
        center: initialCenter,
        zoom: initialZoom,
        maxZoom: 22,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const layers = createEkinixTileLayers(L);
      tileLayersRef.current = layers;

      if (mapType === 'satellite') {
        layers.googleHybrid.addTo(map);
      } else {
        layers.street.addTo(map);
      }

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        if (isPolygonClosedRef.current) return;
        const newPoint: [number, number] = [
          parseFloat(e.latlng.lat.toFixed(6)),
          parseFloat(e.latlng.lng.toFixed(6)),
        ];
        setPoints((prev) => [...prev, newPoint]);
        setError(null);
      });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        safeDestroyMap(mapInstanceRef.current, container);
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Layer Sync
  useEffect(() => {
    const map = mapInstanceRef.current;
    const { googleHybrid, street } = tileLayersRef.current;
    if (!map || !googleHybrid || !street) return;

    if (mapType === 'satellite') {
      if (map.hasLayer(street)) map.removeLayer(street);
      if (!map.hasLayer(googleHybrid)) googleHybrid.addTo(map);
    } else {
      if (map.hasLayer(googleHybrid)) map.removeLayer(googleHybrid);
      if (!map.hasLayer(street)) street.addTo(map);
    }
  }, [mapType]);

  // 3. Region FlyTo Handler
  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    const targetGeo = UZBEKISTAN_REGIONS_GEO[newRegion];
    if (targetGeo && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([targetGeo.lat, targetGeo.lng], targetGeo.zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  };

  // 4. Geocoding Search Handling
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (val.trim().length >= 2) {
      setIsSearching(true);
      setShowSearchDropdown(true);
      searchDebounceRef.current = setTimeout(async () => {
        const results = await searchUzbekistanLocations(val);
        setSearchResults(results);
        setIsSearching(false);
      }, 400);
    } else {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchDropdown(false);
    }
  };

  const handleSelectSearchResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (!isNaN(lat) && !isNaN(lon) && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 14, {
        animate: true,
        duration: 1.3,
      });
    }

    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  // 5. Redraw Markers and Polygon overlays
  useEffect(() => {
    async function updateMapOverlays() {
      if (!mapInstanceRef.current) return;
      const L = await getSafeLeaflet();
      if (!L || !mapInstanceRef.current) return;
      const map = mapInstanceRef.current;

      markersRef.current.forEach((m) => {
        try { map.removeLayer(m); } catch {}
      });
      markersRef.current = [];

      if (polygonRef.current) {
        try { map.removeLayer(polygonRef.current); } catch {}
      }
      if (polylineRef.current) {
        try { map.removeLayer(polylineRef.current); } catch {}
      }

      points.forEach((pt, index) => {
        const isFirst = index === 0;
        const canClose = points.length >= 4 && !isPolygonClosed;

        const markerHtml = isFirst && canClose
          ? `<div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
               <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(16, 185, 129, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
               <div style="position: relative; background-color: #059669; border: 2px solid #ffffff; color: #ffffff; width: 18px; height: 18px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4); font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">1</div>
             </div>`
          : `<div style="background-color: #0f172a; border: 2px solid #ffffff; color: #ffffff; width: 18px; height: 18px; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">${index + 1}</div>`;

        const pinIcon = L.divIcon({
          className: 'custom-map-pin',
          html: markerHtml,
          iconSize: isFirst && canClose ? [26, 26] : [18, 18],
          iconAnchor: isFirst && canClose ? [13, 13] : [9, 9],
        });

        const marker = L.marker(pt, { icon: pinIcon }).addTo(map);

        if (isFirst) {
          marker.on('click', (e: any) => {
            if (L.DomEvent) L.DomEvent.stopPropagation(e);
            if (pointsRef.current.length >= 4 && !isPolygonClosedRef.current) {
              setIsPolygonClosed(true);
              setError(null);
            }
          });

          if (canClose) {
            marker.bindTooltip(
              currentLang === 'uz'
                ? "1-burchak: Maydonni yopish uchun bosing"
                : currentLang === 'ru'
                ? "1-я точка: Нажмите, чтобы замкнуть контур"
                : "1st corner: Click to close polygon",
              { permanent: false, direction: 'top', offset: [0, -10] }
            );
          }
        }

        markersRef.current.push(marker);
      });

      if (isPolygonClosed && points.length >= 4) {
        polygonRef.current = L.polygon(points, {
          color: '#10B981',
          weight: 2.5,
          fillColor: '#10B981',
          fillOpacity: 0.25,
        }).addTo(map);
      } else if (points.length >= 2) {
        polylineRef.current = L.polyline(points, {
          color: '#10B981',
          weight: 2,
          dashArray: '5, 5',
        }).addTo(map);
      }
    }

    updateMapOverlays();
  }, [points, isPolygonClosed, currentLang]);

  const handleCloseBoundary = () => {
    if (points.length >= 4) {
      setIsPolygonClosed(true);
      setError(null);
    } else {
      setError(
        currentLang === 'ru'
          ? "Пожалуйста, отметьте как минимум 4 точки контура поля на карте."
          : currentLang === 'en'
          ? "Please click at least 4 corner points on the map."
          : t.drawBoundaryInstruction
      );
    }
  };

  const handleClearPoints = () => {
    setPoints([]);
    setIsPolygonClosed(false);
    setError(null);
  };

  const handleUndoLastPoint = () => {
    if (points.length > 0) {
      setPoints((prev) => prev.slice(0, prev.length - 1));
      setIsPolygonClosed(false);
    }
  };

  const handleSave = () => {
    if (!fieldName.trim()) {
      setError(
        currentLang === 'ru'
          ? "Пожалуйста, введите название поля"
          : currentLang === 'uz'
          ? "Iltimos, maydon nomini kiriting"
          : "Please enter a field name"
      );
      return;
    }
    if (points.length < 4) {
      setError(
        currentLang === 'ru'
          ? "Пожалуйста, отметьте как минимум 4 точки контура поля на карте."
          : currentLang === 'en'
          ? "Please mark at least 4 corner points on the map."
          : t.drawBoundaryInstruction
      );
      return;
    }
    if (!isPolygonClosed) {
      setError(
        currentLang === 'ru'
          ? "Пожалуйста, замкните контур поля перед сохранением."
          : currentLang === 'uz'
          ? "Iltimos, xaritadagi 1-nuqtaga yoki 'Chegarani yakunlash' tugmasiga bosib maydonni yoping."
          : "Please close the field polygon boundary before saving."
      );
      return;
    }

    onSaveField({
      name: fieldName.trim(),
      crop_type: cropType,
      planting_date: plantingDate,
      area_hectares: calculatedArea > 0 ? calculatedArea : 1.5,
      region: selectedRegion,
      coordinates: points,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {currentLang === 'ru' ? 'Интерактивная карторисовка поля' : currentLang === 'en' ? 'Interactive Field Boundary Drawer' : "Maydon Chegarasini Belgilash"}
          </h3>
          <p className="text-xs text-slate-500">
            {currentLang === 'ru' ? 'Отметьте угловые точки поля на спутниковой карте (минимум 4 точки)' : currentLang === 'en' ? 'Mark the field corner points on the satellite map (minimum 4 points)' : "Xaritada maydonning kamida 4 ta burchak nuqtasini belgilang"}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Two-column split layout: Left Map Canvas (65%), Right Registration Panel (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Map Canvas & Map Controls (lg:col-span-8) */}
        <div className="lg:col-span-8 relative w-full h-[420px] sm:h-[480px] rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Top-Left Search Input */}
          <div className="absolute top-3 left-3 z-10 w-64">
            <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-lg border border-slate-200 shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                placeholder={currentLang === 'ru' ? 'Поиск локации...' : currentLang === 'en' ? 'Search location...' : 'Tuman yoki qishloq qidirish...'}
                className="w-full h-8 pl-8 pr-7 text-xs text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
              />
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-2.5" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Dropdown search results */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden max-h-52 overflow-y-auto z-50">
                {searchResults.map((res) => (
                  <button
                    key={res.place_id}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-start gap-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{res.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Floating Top-Right Layer Switcher Segmented Control */}
          <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm rounded-lg p-0.5 text-xs flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                mapType === 'satellite'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{currentLang === 'ru' ? 'Спутник' : currentLang === 'en' ? 'Satellite' : "Sun'iy yo'ldosh"}</span>
            </button>
            <button
              type="button"
              onClick={() => setMapType('street')}
              className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                mapType === 'street'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{currentLang === 'ru' ? 'Карта' : currentLang === 'en' ? 'Map' : "Ko'chalar"}</span>
            </button>
          </div>

          {/* Floating Bottom-Center Polygon Action Toolbar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md p-1 rounded-lg">
            <button
              type="button"
              onClick={handleUndoLastPoint}
              disabled={points.length === 0}
              className="h-7 px-2.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1 disabled:opacity-40 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>{currentLang === 'ru' ? 'Отмена' : currentLang === 'en' ? 'Undo' : 'Orqaga'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearPoints}
              disabled={points.length === 0}
              className="h-7 px-2.5 text-xs font-medium rounded-md text-rose-600 hover:bg-rose-50 flex items-center gap-1 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3 h-3 text-rose-500" />
              <span>{currentLang === 'ru' ? 'Сброс' : currentLang === 'en' ? 'Clear' : 'Ochirish'}</span>
            </button>

            {points.length >= 4 && !isPolygonClosed && (
              <button
                type="button"
                onClick={handleCloseBoundary}
                className="h-7 px-3 text-xs font-medium rounded-md bg-emerald-800 text-white hover:bg-emerald-900 flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{currentLang === 'ru' ? 'Замыкать контур' : currentLang === 'en' ? 'Complete Boundary' : "Chegarani yakunlash"}</span>
              </button>
            )}

            {isPolygonClosed && (
              <span className="h-7 px-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-md flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentLang === 'ru' ? 'Контур замкнут' : currentLang === 'en' ? 'Boundary Closed' : "Yopildi"}</span>
              </span>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Registration Form Panel (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              {currentLang === 'ru' ? 'Параметры участка' : currentLang === 'en' ? 'Field Registration Details' : "Maydon Ma'lumotlari"}
            </h4>
            <p className="text-[11px] text-slate-500">
              {currentLang === 'ru' ? 'Заполните основные данные о поле' : currentLang === 'en' ? 'Fill in core field information' : "Maydon parametrlarini kiriting"}
            </p>
          </div>

          {/* 1. Region Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3 h-3 text-slate-400" />
              <span>{currentLang === 'ru' ? '1. Регион / Область' : currentLang === 'en' ? '1. Region' : '1. Viloyat'}</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full h-9 text-xs sm:text-sm rounded-lg border-slate-300 bg-white font-medium text-slate-900 focus:ring-emerald-800 focus:border-emerald-800 px-2.5"
            >
              {ALL_UZBEKISTAN_REGIONS.map((regionName) => (
                <option key={regionName} value={regionName}>
                  {regionName}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Field Name */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 uppercase tracking-wider">
              {currentLang === 'ru' ? '2. Название поля *' : currentLang === 'en' ? '2. Field Name *' : '2. Maydon nomi *'}
            </label>
            <input
              type="text"
              required
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Masalan: Paxta maydoni #1"
              className="w-full h-9 text-xs sm:text-sm rounded-lg border-slate-300 bg-white font-medium text-slate-900 focus:ring-emerald-800 focus:border-emerald-800 px-3"
            />
          </div>

          {/* 3. Crop Selector */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 uppercase tracking-wider">
              {currentLang === 'ru' ? '3. Культура *' : currentLang === 'en' ? '3. Crop Type *' : '3. Ekin turi *'}
            </label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full h-9 text-xs sm:text-sm rounded-lg border-slate-300 bg-white font-medium text-slate-900 focus:ring-emerald-800 focus:border-emerald-800 px-2.5"
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {t[c.nameKey as keyof typeof t] || c.id}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Planting Date */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 uppercase tracking-wider">
              {currentLang === 'ru' ? '4. Дата посева *' : currentLang === 'en' ? '4. Planting Date *' : '4. Ekilgan sana *'}
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="date"
                required
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full h-9 text-xs sm:text-sm rounded-lg border-slate-300 bg-white font-medium text-slate-900 focus:ring-emerald-800 focus:border-emerald-800 pl-8 pr-2.5"
              />
            </div>
          </div>

          {/* Real-time Calculated Area Display Box */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentLang === 'ru' ? 'Расчитанная площадь' : currentLang === 'en' ? 'Calculated Area' : 'Hisoblangan Maydon'}</span>
            </span>
            <div className="tabular font-mono font-bold text-lg text-slate-900">
              {isPolygonClosed && points.length >= 4 ? (
                <span>{calculatedArea} ha</span>
              ) : (
                <span className="text-xs text-slate-400 font-sans font-normal">
                  {currentLang === 'ru' ? '(Замкните контур на карте)' : currentLang === 'en' ? '(Close polygon to calculate)' : '(Xaritada yoping)'}
                </span>
              )}
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="pt-2 flex items-center justify-end gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {currentLang === 'ru' ? 'Отмена' : currentLang === 'en' ? 'Cancel' : 'Bekor qilish'}
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={points.length < 4 || !isPolygonClosed}
              className="h-9 px-4 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{currentLang === 'ru' ? 'Сохранить поле' : currentLang === 'en' ? 'Save Field' : 'Saqlash'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
