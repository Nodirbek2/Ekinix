'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Navigation,
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
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Form State
  const [fieldName, setFieldName] = useState("Paxta maydoni #1");
  const [cropType, setCropType] = useState('cotton');
  const [plantingDate, setPlantingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  // Leaflet map refs to avoid re-creation
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

  // Calculated area is only computed once boundary is closed and has >= 4 points
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

      // Clean up previous instance if any
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

      // Zoom control in bottom-right so top is reserved for search/layers
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Create Tile Layers using unified Ekinix Layer provider
      const layers = createEkinixTileLayers(L);
      tileLayersRef.current = layers;

      // Add active tiles based on mapType
      if (mapType === 'satellite') {
        layers.googleHybrid.addTo(map);
      } else {
        layers.street.addTo(map);
      }

      // Map Click Handler to place boundary points
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        // If polygon is already closed, do not add more points unless reopened
        if (isPolygonClosedRef.current) {
          return;
        }
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

  // 2. Map Layer Sync: Switch between Satellite (with labels) and Street WITHOUT resetting center or zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
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

  // 3. Region FlyTo Handler
  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    const targetGeo = UZBEKISTAN_REGIONS_GEO[newRegion];
    if (targetGeo && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([targetGeo.lat, targetGeo.lng], targetGeo.zoom, {
        animate: true,
        duration: 1.2,
      });
      setSearchFeedback(`${targetGeo.nameUz} markaziga yo'naltirildi`);
      setTimeout(() => setSearchFeedback(null), 3500);
    }
  };

  // 4. Geocoding Search Handling
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

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

      const shortName = result.display_name.split(',')[0];
      setSearchFeedback(`📍 Xarita yo'naltirildi: ${shortName}`);
      setTimeout(() => setSearchFeedback(null), 4000);
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

      // Clear existing markers
      markersRef.current.forEach((m) => {
        try {
          map.removeLayer(m);
        } catch {}
      });
      markersRef.current = [];

      if (polygonRef.current) {
        try {
          map.removeLayer(polygonRef.current);
        } catch {}
      }
      if (polylineRef.current) {
        try {
          map.removeLayer(polylineRef.current);
        } catch {}
      }

      // Add numbered markers for each point
      points.forEach((pt, index) => {
        const isFirst = index === 0;
        const canClose = points.length >= 4 && !isPolygonClosed;

        const markerHtml = isFirst && canClose
          ? `<div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
               <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(16, 185, 129, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
               <div style="position: relative; background-color: #059669; border: 2px solid #FFFFFF; color: #FFFFFF; width: 22px; height: 22px; border-radius: 50%; box-shadow: 0 3px 8px rgba(0,0,0,0.5); font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">1</div>
             </div>`
          : `<div style="background-color: ${isPolygonClosed ? '#1F3D2B' : '#D9A441'}; border: 2px solid ${isPolygonClosed ? '#D9A441' : '#1F3D2B'}; color: ${isPolygonClosed ? '#FAF7F0' : '#1F3D2B'}; width: 20px; height: 20px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4); font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; font-family: sans-serif;">${index + 1}</div>`;

        const pinIcon = L.divIcon({
          className: 'custom-map-pin',
          html: markerHtml,
          iconSize: isFirst && canClose ? [28, 28] : [20, 20],
          iconAnchor: isFirst && canClose ? [14, 14] : [10, 10],
        });

        const marker = L.marker(pt, { icon: pinIcon }).addTo(map);

        // Click first marker to close polygon when >= 4 points exist
        if (isFirst) {
          marker.on('click', (e: any) => {
            if (L.DomEvent) {
              L.DomEvent.stopPropagation(e);
            }
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
              {
                permanent: false,
                direction: 'top',
                offset: [0, -12],
              }
            );
          }
        }

        markersRef.current.push(marker);
      });

      // Draw Polygon (if closed and >= 4 points) or Polyline (open line when in progress)
      if (isPolygonClosed && points.length >= 4) {
        polygonRef.current = L.polygon(points, {
          color: '#D9A441',
          weight: 3.5,
          fillColor: '#1F3D2B',
          fillOpacity: 0.45,
        }).addTo(map);
      } else if (points.length >= 2) {
        polylineRef.current = L.polyline(points, {
          color: '#D9A441',
          weight: 3,
          dashArray: '6, 6',
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
      setError(t.drawBoundaryInstruction);
    }
  };

  const handleReopenBoundary = () => {
    setIsPolygonClosed(false);
    setError(null);
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
      setError(currentLang === 'uz' ? "Iltimos, maydon nomini kiriting" : "Введите название поля");
      return;
    }
    if (points.length < 4) {
      setError(t.drawBoundaryInstruction);
      return;
    }
    if (!isPolygonClosed) {
      setError(
        currentLang === 'uz'
          ? "Iltimos, xaritadagi 1-nuqtaga yoki 'Chegarani yakunlash' tugmasiga bosib maydonni yoping."
          : currentLang === 'ru'
          ? "Пожалуйста, замкните контур поля перед сохранением."
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
    <div className="bg-[#FAF7F0] rounded-3xl border-2 border-[#1F3D2B] p-5 sm:p-7 shadow-xl space-y-6">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E4D9C4] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#D9A441] animate-pulse" />
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1F3D2B]">
              {t.addFieldBtn}
            </h3>
          </div>
          <p className="text-xs text-[#6C7C6F] mt-1">
            Viloyatni tanlang, tuman/qishloqni qidiring yoki xaritada maydonning burchak nuqtalarini belgilang (kamida 4 ta).
          </p>
        </div>

        {/* Map Type Sync Toggle */}
        <div className="flex items-center bg-[#F0E8D8] p-1 rounded-xl border border-[#E4D9C4] shrink-0 self-start lg:self-auto shadow-2xs">
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
            <span>Sun&apos;iy yo&apos;ldosh + Nomlar</span>
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
            <Globe className="w-3.5 h-3.5" />
            <span>Ko&apos;chalar xaritasi</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border-2 border-[#1F3D2B] shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Top Floating Controls: Geocoding Search & Region Quick Focus */}
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
          
          {/* Geocoding Search Box (OSM Nominatim) */}
          <div className="relative pointer-events-auto w-full sm:max-w-xs md:max-w-sm">
            <div className="relative flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-[#E4D9C4] shadow-md focus-within:ring-2 focus-within:ring-[#1F3D2B] focus-within:border-[#1F3D2B] transition-all">
              <Search className="w-4 h-4 text-[#D9A441] ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                placeholder="Tuman, qishloq yoki joy qidirish..."
                className="w-full px-2.5 py-2 text-xs text-[#1F3D2B] font-medium bg-transparent focus:outline-none placeholder:text-[#6C7C6F]/70"
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-[#D9A441] animate-spin mr-3 shrink-0" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchDropdown(false);
                  }}
                  className="mr-2.5 p-1 text-[#6C7C6F] hover:text-[#1F3D2B]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#E4D9C4] shadow-xl overflow-hidden max-h-56 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 bg-[#FAF7F0] border-b border-[#E4D9C4] text-[10px] font-bold text-[#6C7C6F] uppercase">
                  O&apos;zbekiston bo&apos;yicha topilgan joylar
                </div>
                {searchResults.map((res) => (
                  <button
                    key={res.place_id}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-[#1F3D2B] hover:bg-[#F0E8D8] border-b border-[#FAF7F0] last:border-0 flex items-start gap-2 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#D9A441] shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{res.display_name}</span>
                  </button>
                ))}
              </div>
            )}

            {showSearchDropdown && !isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#E4D9C4] shadow-xl p-3 text-xs text-[#6C7C6F] text-center z-50">
                Bunday nomli joy topilmadi. Viloyat yoki tuman nomini to&apos;g&apos;ri yozing.
              </div>
            )}
          </div>

          {/* Quick Boundary Point Indicator */}
          <div className="pointer-events-auto bg-[#1F3D2B]/90 backdrop-blur-md text-[#FAF7F0] px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md border border-[#D9A441]/40 flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <span className="text-[#D9A441] font-mono">{points.length} ta</span>
            <span>
              {points.length === 0
                ? (currentLang === 'uz' ? "Nuqtalar belgilanmagan" : currentLang === 'ru' ? "Точки не отмечены" : "No points placed")
                : !isPolygonClosed
                ? (currentLang === 'uz' ? `Belgilangan: ${points.length} / 4 ta kamida` : currentLang === 'ru' ? `Отмечено: ${points.length} / 4 мин.` : `Corners: ${points.length} / 4 min`)
                : (currentLang === 'uz' ? `${points.length} burchak (Yopildi ✓)` : currentLang === 'ru' ? `${points.length} точек (Замкнут ✓)` : `${points.length} corners (Closed ✓)`)}
            </span>
          </div>
        </div>

        {/* Floating Search / Focus Toast Feedback */}
        {searchFeedback && (
          <div className="absolute top-16 left-3 z-10 pointer-events-none bg-[#1F3D2B] text-[#FAF7F0] text-xs font-bold px-3.5 py-1.5 rounded-xl border border-[#D9A441] shadow-lg animate-in fade-in duration-200 flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-[#D9A441] animate-bounce" />
            <span>{searchFeedback}</span>
          </div>
        )}

        {/* Overlay Instructions Bar */}
        <div className="absolute bottom-14 left-3 right-3 z-10 pointer-events-none">
          <div className="bg-[#1F3D2B]/95 text-[#FAF7F0] backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg border border-[#D9A441]/40 flex items-center gap-2 max-w-xl">
            <MapPin className="w-4 h-4 text-[#D9A441] shrink-0" />
            <span>
              {points.length === 0 && t.drawBoundaryInstruction}
              {points.length > 0 && points.length < 4 && (
                currentLang === 'uz'
                  ? `Yana kamida ${4 - points.length} ta burchak nuqtasi belgilang (${points.length} / 4 ta)`
                  : currentLang === 'ru'
                  ? `Отметьте еще минимум ${4 - points.length} точки (${points.length} / 4)`
                  : `Add at least ${4 - points.length} more corner points (${points.length} / 4)`
              )}
              {points.length >= 4 && !isPolygonClosed && (
                currentLang === 'uz'
                  ? "Yana burchaklar qo'shing yoki 1-nuqtaga / 'Chegarani yakunlash' tugmasiga bosib maydonni yoping"
                  : currentLang === 'ru'
                  ? "Добавьте еще точки или нажмите на 1-ю точку / кнопку 'Завершить контур'"
                  : "Add more corners or click the 1st point / 'Finish Boundary' button to close the polygon"
              )}
              {isPolygonClosed && t.boundaryClosed}
            </span>
          </div>
        </div>

        {/* Map Bottom Actions & Area Calculated Display */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Finish / Close Boundary Button (appears when >= 4 points and not yet closed) */}
            {points.length >= 4 && !isPolygonClosed && (
              <button
                type="button"
                onClick={handleCloseBoundary}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md border border-emerald-500 flex items-center gap-1.5 animate-pulse transition-all"
              >
                <Check className="w-3.5 h-3.5 text-[#D9A441]" />
                <span>{t.closeBoundaryBtn}</span>
              </button>
            )}

            {/* Reopen / Edit Boundary Button (when closed) */}
            {isPolygonClosed && (
              <button
                type="button"
                onClick={handleReopenBoundary}
                className="bg-[#1F3D2B] hover:bg-[#2A4D37] text-[#FAF7F0] px-3 py-1.5 rounded-xl text-xs font-bold shadow-md border border-[#D9A441]/50 flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#D9A441]" />
                <span>{t.reopenBoundary}</span>
              </button>
            )}
          </div>

          {/* Dynamic Calculated Area Widget */}
          <div className="bg-[#1F3D2B] text-[#FAF7F0] px-4 py-2 rounded-xl text-xs font-bold border border-[#D9A441] shadow-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D9A441]" />
            <span>
              {t.calculatedArea}:{' '}
              {isPolygonClosed && points.length >= 4 ? (
                <strong className="text-[#D9A441] text-sm font-mono">{calculatedArea} {t.hectaresUnit}</strong>
              ) : (
                <span className="text-[#D9A441]/80 font-mono text-xs">
                  (yopilgach hisoblanadi)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Field Input Details Form (Priority order: 1. Viloyat, 2. Nomi, 3. Ekin, 4. Sana) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        
        {/* 1. Region Dropdown with Auto FlyTo Focus */}
        <div className="bg-white p-3.5 rounded-2xl border-2 border-[#D9A441]/70 shadow-xs">
          <label className="block text-[11px] font-bold text-[#1F3D2B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>1. Viloyatni tanlang *</span>
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full bg-[#FAF7F0] border border-[#E4D9C4] rounded-xl px-3 py-2 text-xs font-bold text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
          >
            {ALL_UZBEKISTAN_REGIONS.map((regionName) => (
              <option key={regionName} value={regionName}>
                {regionName}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-[#6C7C6F] mt-1">
            Tanlangan viloyatga xarita avtomatik yaqinlashadi
          </p>
        </div>

        {/* 2. Field Name */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E4D9C4] shadow-xs">
          <label className="block text-[11px] font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
            2. {t.fieldNameLabel} *
          </label>
          <input
            type="text"
            required
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="Masalan: Janubiy Paxtazor #2"
            className="w-full bg-[#FAF7F0] border border-[#E4D9C4] rounded-xl px-3 py-2 text-xs font-bold text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
          />
          <p className="text-[10px] text-[#6C7C6F] mt-1">
            Maydonni oson eslab qolish uchun nom
          </p>
        </div>

        {/* 3. Crop Selection */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E4D9C4] shadow-xs">
          <label className="block text-[11px] font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
            3. {t.cropTypeLabel} *
          </label>
          <select
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="w-full bg-[#FAF7F0] border border-[#E4D9C4] rounded-xl px-3 py-2 text-xs font-bold text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
          >
            {CROP_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {t[c.nameKey as keyof typeof t] || c.id}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-[#6C7C6F] mt-1">
            Ekinga mos parvarish va NDVI ko&apos;rsatiladi
          </p>
        </div>

        {/* 4. Planting Date */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#E4D9C4] shadow-xs">
          <label className="block text-[11px] font-bold text-[#6C7C6F] uppercase tracking-wider mb-1.5">
            4. {t.plantingDateLabel} *
          </label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 text-[#D9A441] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="date"
              required
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              className="w-full bg-[#FAF7F0] border border-[#E4D9C4] rounded-xl pl-8 pr-2.5 py-2 text-xs font-bold text-[#1F3D2B] focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
            />
          </div>
          <p className="text-[10px] text-[#6C7C6F] mt-1">
            O&apos;sish fazasini hisoblash uchun
          </p>
        </div>

      </div>

      {/* Save & Cancel Action Controls */}
      <div className="pt-3 border-t border-[#E4D9C4] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#6C7C6F]">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isPolygonClosed && points.length >= 4 ? 'text-emerald-600' : 'text-[#D9A441]'}`} />
          <span>
            Hudud: <strong className="text-[#1F3D2B]">{selectedRegion}</strong> &bull; Maydon: <strong className="text-[#1F3D2B]">{isPolygonClosed && points.length >= 4 ? `${calculatedArea} ga` : '—'}</strong>
          </span>
        </div>

        <div className="flex items-center justify-end gap-3">
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
            disabled={points.length < 4 || !isPolygonClosed}
            className="flex items-center justify-center gap-2 bg-[#D9A441] hover:bg-[#B8852B] text-[#1F3D2B] hover:text-[#FAF7F0] font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>{t.saveFieldBtn}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
