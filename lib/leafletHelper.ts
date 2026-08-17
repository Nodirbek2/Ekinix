/**
 * Safe Leaflet helper for Next.js and React components.
 * Prevents Leaflet '_leaflet_pos' and container lifecycle errors on unmount/re-renders.
 */

let leafletPromise: Promise<any> | null = null;

export async function getSafeLeaflet() {
  if (typeof window === 'undefined') return null;

  if (!leafletPromise) {
    leafletPromise = import('leaflet').then((module) => {
      const L = module.default || module;

      // Defensive guard against Leaflet unmount / detached node '_leaflet_pos' reading
      if (L && L.DomUtil) {
        const originalGetPosition = L.DomUtil.getPosition;
        L.DomUtil.getPosition = function (el: any) {
          if (!el) {
            return new L.Point(0, 0);
          }
          try {
            return el._leaflet_pos || new L.Point(0, 0);
          } catch {
            return new L.Point(0, 0);
          }
        };

        const originalSetPosition = L.DomUtil.setPosition;
        L.DomUtil.setPosition = function (el: any, point: any) {
          if (!el) return;
          try {
            originalSetPosition.call(L.DomUtil, el, point);
          } catch {
            if (el && typeof el === 'object') {
              el._leaflet_pos = point;
            }
          }
        };
      }

      // Safe default icons fallback
      try {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      } catch {
        // ignore
      }

      return L;
    });
  }

  return leafletPromise;
}

/**
 * Standard High-Resolution Tile Layers for Ekinix.
 * Prevents grey "Map data not yet available" tiles on zoom levels 18+ by specifying maxNativeZoom & maxZoom,
 * and providing high-definition Google Hybrid (Satellite + Road / Town Labels).
 */
export function createEkinixTileLayers(L: any) {
  // 1. Google Hybrid Satellite (Ultra-crisp up to zoom 22, includes labels for towns, canals & roads in Uzbekistan)
  const googleHybrid = L.tileLayer(
    'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    {
      attribution: '&copy; Google Maps &mdash; Sentinel-2 Hybrid',
      maxNativeZoom: 20,
      maxZoom: 22,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }
  );

  // 2. Esri World Imagery (Satellite with maxNativeZoom=18 and digital stretch up to zoom 21)
  const esriSatellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: '&copy; Esri &mdash; Sentinel-2 Satellite',
      maxNativeZoom: 18,
      maxZoom: 22,
    }
  );

  // 3. Esri Place & Road Labels
  const esriLabels = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: '&copy; Esri Labels',
      maxNativeZoom: 19,
      maxZoom: 22,
      opacity: 0.9,
    }
  );

  // 4. OpenStreetMap Standard Streets
  const street = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap contributors',
      maxNativeZoom: 19,
      maxZoom: 22,
    }
  );

  return {
    googleHybrid,
    esriSatellite,
    esriLabels,
    street,
  };
}

export function safeDestroyMap(mapInstance: any, containerElement?: HTMLElement | null) {
  if (mapInstance) {
    try {
      if (typeof mapInstance.stop === 'function') {
        mapInstance.stop();
      }
      if (typeof mapInstance.off === 'function') {
        mapInstance.off();
      }
      if (typeof mapInstance.eachLayer === 'function') {
        mapInstance.eachLayer((layer: any) => {
          try {
            if (layer && typeof layer.remove === 'function') {
              layer.remove();
            }
          } catch {}
        });
      }
      if (typeof mapInstance.remove === 'function') {
        mapInstance.remove();
      }
    } catch (e) {
      console.warn('[Leaflet Safe Cleanup Notice]:', e);
    }
  }

  if (containerElement) {
    try {
      delete (containerElement as any)._leaflet_id;
    } catch {}
  }
}
