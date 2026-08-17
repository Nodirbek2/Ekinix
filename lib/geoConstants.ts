/**
 * Geographic constants and utility helpers for Uzbekistan regions and map navigation in Ekinix.
 */

export interface RegionGeoInfo {
  nameKey: string;
  lat: number;
  lng: number;
  zoom: number;
  nameUz: string;
  nameRu: string;
  nameEn: string;
}

export const UZBEKISTAN_REGIONS_GEO: Record<string, RegionGeoInfo> = {
  "Qashqadaryo viloyati": {
    nameKey: "Qashqadaryo viloyati",
    lat: 38.8606,
    lng: 65.7891,
    zoom: 11,
    nameUz: "Qashqadaryo viloyati",
    nameRu: "Кашкадарьинская область",
    nameEn: "Kashkadarya Region",
  },
  "Toshkent viloyati": {
    nameKey: "Toshkent viloyati",
    lat: 41.1158,
    lng: 69.0485,
    zoom: 11,
    nameUz: "Toshkent viloyati",
    nameRu: "Ташкентская область",
    nameEn: "Tashkent Region",
  },
  "Toshkent shahri": {
    nameKey: "Toshkent shahri",
    lat: 41.2995,
    lng: 69.2401,
    zoom: 12,
    nameUz: "Toshkent shahri",
    nameRu: "Город Ташкент",
    nameEn: "Tashkent City",
  },
  "Samarqand viloyati": {
    nameKey: "Samarqand viloyati",
    lat: 39.6542,
    lng: 66.9597,
    zoom: 11,
    nameUz: "Samarqand viloyati",
    nameRu: "Самаркандская область",
    nameEn: "Samarkand Region",
  },
  "Farg'ona viloyati": {
    nameKey: "Farg'ona viloyati",
    lat: 40.3842,
    lng: 71.7843,
    zoom: 11,
    nameUz: "Farg'ona viloyati",
    nameRu: "Ферганская область",
    nameEn: "Fergana Region",
  },
  "Buxoro viloyati": {
    nameKey: "Buxoro viloyati",
    lat: 39.7747,
    lng: 64.4286,
    zoom: 11,
    nameUz: "Buxoro viloyati",
    nameRu: "Бухарская область",
    nameEn: "Bukhara Region",
  },
  "Surxondaryo viloyati": {
    nameKey: "Surxondaryo viloyati",
    lat: 37.2242,
    lng: 67.2783,
    zoom: 11,
    nameUz: "Surxondaryo viloyati",
    nameRu: "Сурхандарьинская область",
    nameEn: "Surkhandarya Region",
  },
  "Andijon viloyati": {
    nameKey: "Andijon viloyati",
    lat: 40.7821,
    lng: 72.3442,
    zoom: 11,
    nameUz: "Andijon viloyati",
    nameRu: "Андижанская область",
    nameEn: "Andijan Region",
  },
  "Namangan viloyati": {
    nameKey: "Namangan viloyati",
    lat: 41.0011,
    lng: 71.6683,
    zoom: 11,
    nameUz: "Namangan viloyati",
    nameRu: "Наманганская область",
    nameEn: "Namangan Region",
  },
  "Xorazm viloyati": {
    nameKey: "Xorazm viloyati",
    lat: 41.5503,
    lng: 60.6317,
    zoom: 11,
    nameUz: "Xorazm viloyati",
    nameRu: "Хорезмская область",
    nameEn: "Khorezm Region",
  },
  "Navoiy viloyati": {
    nameKey: "Navoiy viloyati",
    lat: 40.1039,
    lng: 65.3688,
    zoom: 11,
    nameUz: "Navoiy viloyati",
    nameRu: "Навоийская область",
    nameEn: "Navoiy Region",
  },
  "Jizzax viloyati": {
    nameKey: "Jizzax viloyati",
    lat: 40.1158,
    lng: 67.8422,
    zoom: 11,
    nameUz: "Jizzax viloyati",
    nameRu: "Джизакская область",
    nameEn: "Jizzakh Region",
  },
  "Sirdaryo viloyati": {
    nameKey: "Sirdaryo viloyati",
    lat: 40.4897,
    lng: 68.7842,
    zoom: 11,
    nameUz: "Sirdaryo viloyati",
    nameRu: "Сырдарьинская область",
    nameEn: "Sirdaryo Region",
  },
  "Qoraqalpog'iston Respublikasi": {
    nameKey: "Qoraqalpog'iston Respublikasi",
    lat: 42.4611,
    lng: 59.6166,
    zoom: 10,
    nameUz: "Qoraqalpog'iston Respublikasi",
    nameRu: "Республика Каракалпакстан",
    nameEn: "Republic of Karakalpakstan",
  },
};

export const ALL_UZBEKISTAN_REGIONS = Object.keys(UZBEKISTAN_REGIONS_GEO);

/**
 * Match a farmer's profile region string to the closest standard region info
 */
export function getRegionGeoInfo(regionName?: string | null): RegionGeoInfo {
  if (!regionName || typeof regionName !== 'string') {
    return UZBEKISTAN_REGIONS_GEO["Toshkent viloyati"];
  }

  const normalized = regionName.trim().toLowerCase();

  for (const [key, info] of Object.entries(UZBEKISTAN_REGIONS_GEO)) {
    const keyNorm = key.toLowerCase();
    const cleanKey = keyNorm.replace(' viloyati', '').replace(' shahri', '').replace(' respublikasi', '').trim();
    const cleanInput = normalized.replace(' viloyati', '').replace(' shahri', '').replace(' respublikasi', '').replace(' область', '').replace(' region', '').trim();

    if (
      keyNorm === normalized ||
      keyNorm.includes(normalized) ||
      normalized.includes(cleanKey) ||
      cleanKey === cleanInput ||
      cleanKey.includes(cleanInput) ||
      cleanInput.includes(cleanKey)
    ) {
      return info;
    }
  }

  return UZBEKISTAN_REGIONS_GEO["Toshkent viloyati"];
}

/**
 * Search locations within Uzbekistan using OpenStreetMap Nominatim
 */
export interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
}

export async function searchUzbekistanLocations(query: string): Promise<NominatimResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=uz&limit=6&addressdetails=1&q=${encoded}`,
      {
        headers: {
          'Accept-Language': 'uz,ru,en',
        },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.warn('Geocoding search warning:', err);
    return [];
  }
}
