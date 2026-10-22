"use client";
import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import type { Point, Lang } from "@/lib/domain";
import { pick } from "@/lib/domain";
import { t } from "@/lib/copy";
import { Search, MapPin } from "lucide-react";
export default function FieldMap({
  points,
  center,
  editable = false,
  closed = !editable,
  onChange,
  onCloseBoundary,
  lang,
}: {
  points: Point[];
  center: Point;
  editable?: boolean;
  closed?: boolean;
  onChange?: (p: Point[]) => void;
  onCloseBoundary?: () => void;
  lang: Lang;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    overlay = useRef<L.LayerGroup | null>(null),
    tiles = useRef<L.TileLayer | null>(null),
    leaflet = useRef<typeof L | null>(null);
  const latest = useRef({
    points,
    onChange,
    onCloseBoundary,
    editable,
    closed,
  });
  useEffect(() => {
    latest.current = { points, onChange, onCloseBoundary, editable, closed };
  }, [points, onChange, onCloseBoundary, editable, closed]);
  const initial = useRef({ points, center });
  const [ready, setReady] = useState(false),
    [layer, setLayer] = useState<"street" | "satellite">("satellite"),
    [tileError, setTileError] = useState(false);
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    import("leaflet")
      .then((mod) => {
        if (disposed || !container.current) return;
        const lib = mod.default;
        leaflet.current = lib;
        const m = lib
          .map(container.current, { scrollWheelZoom: true, maxZoom: 22 })
          .setView(initial.current.center, 14);
        map.current = m;
        overlay.current = lib.layerGroup().addTo(m);
        if (initial.current.points.length >= 3)
          m.fitBounds(lib.latLngBounds(initial.current.points), {
            padding: [30, 30],
            maxZoom: 17,
          });
        m.on("click", (e: L.LeafletMouseEvent) => {
          const current = latest.current;
          if (current.editable && !current.closed && current.points.length < 10)
            current.onChange?.([
              ...current.points,
              [
                Number(e.latlng.lat.toFixed(6)),
                Number(e.latlng.lng.toFixed(6)),
              ],
            ]);
        });
        observer = new ResizeObserver(() => m.invalidateSize());
        observer.observe(container.current);
        setReady(true);
      })
      .catch(() => setTileError(true));
    return () => {
      disposed = true;
      observer?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const lib = leaflet.current,
      m = map.current;
    if (!lib || !m || !ready) return;
    tiles.current?.remove();
    const tile = lib
      .tileLayer(
        layer === "satellite"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 22,
          maxNativeZoom: layer === "satellite" ? 17 : 19,
          attribution:
            layer === "satellite"
              ? "Tiles © Esri, Maxar, Earthstar Geographics"
              : "© OpenStreetMap contributors",
        },
      )
      .addTo(m);
    tiles.current = tile;
    tile.on("tileerror", () => setTileError(true));
    tile.on("load", () => setTileError(false));
    return () => {
      tile.remove();
    };
  }, [layer, ready]);
  useEffect(() => {
    const lib = leaflet.current,
      o = overlay.current;
    if (!lib || !o || !ready) return;
    o.clearLayers();
    if (points.length >= 3 && closed)
      lib
        .polygon(points, {
          color: "#d4f68b",
          weight: 3,
          fillColor: "#b9e570",
          fillOpacity: 0.16,
        })
        .addTo(o);
    else if (points.length)
      lib
        .polyline(points, { color: "#f6c66a", weight: 3, dashArray: "7 5" })
        .addTo(o);
    if (editable)
      points.forEach((p, i) =>
        lib
          .circleMarker(p, {
            radius: i === 0 && !closed ? 9 : 5,
            bubblingMouseEvents: false,
            color: "#fff",
            fillColor: "#31523a",
            fillOpacity: 1,
          })
          .on("click", (e: L.LeafletMouseEvent) => {
            lib.DomEvent.stopPropagation(e.originalEvent);
            const current = latest.current;
            if (
              i === 0 &&
              current.editable &&
              !current.closed &&
              current.points.length >= 3
            )
              current.onCloseBoundary?.();
          })
          .bindTooltip(
            i === 0 && !closed && points.length >= 3
              ? pick(
                  lang,
                  "Chegarani yopish",
                  "Закрыть границу",
                  "Close boundary",
                )
              : String(i + 1),
          )
          .addTo(o),
      );
  }, [points, editable, closed, ready, lang]);
  useEffect(() => {
    if (
      ready &&
      editable &&
      (center[0] !== initial.current.center[0] ||
        center[1] !== initial.current.center[1])
    )
      map.current?.setView(center, 13);
  }, [center, editable, ready]);
  const [search, setSearch] = useState(""),
    [results, setResults] = useState<
      Array<{
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        admin1?: string;
        admin2?: string;
      }>
    >([]),
    [searching, setSearching] = useState(false),
    [searchMessage, setSearchMessage] = useState("");
  const cache = useRef(new Map<string, typeof results>());
  async function findPlace() {
    const query = search
      .trim()
      .replace(
        /\s+(tumani|tuman|shahri|shahar|district|city|район|город)$/i,
        "",
      );
    if (query.length < 2) return;
    setSearching(true);
    setSearchMessage("");
    try {
      let places = cache.current.get(query);
      if (!places) {
        const params = new URLSearchParams({
          name: query,
          count: "8",
          language: lang,
          countryCode: "UZ",
        });
        const response = await fetch(
          "https://geocoding-api.open-meteo.com/v1/search?" + params,
          { signal: AbortSignal.timeout(10000) },
        );
        if (!response.ok) throw Error();
        const data = await response.json();
        places = (data.results ?? []).filter(
          (r: { latitude: number; longitude: number }) =>
            Number.isFinite(r.latitude) && Number.isFinite(r.longitude),
        );
        cache.current.set(query, places!);
      }
      setResults(places!);
      if (!places!.length)
        setSearchMessage(
          pick(
            lang,
            "Joy topilmadi. Boshqa yozilishini sinab ko‘ring.",
            "Место не найдено. Попробуйте другое написание.",
            "No location found. Try another spelling.",
          ),
        );
    } catch {
      setResults([]);
      setSearchMessage(
        pick(
          lang,
          "Qidiruv hozir ishlamadi. Qayta urinib ko‘ring.",
          "Поиск недоступен. Повторите попытку.",
          "Search is unavailable. Please try again.",
        ),
      );
    } finally {
      setSearching(false);
    }
  }
  return (
    <div className="map-wrap">
      {editable && (
        <div className="place-search">
          <div className="place-search-input">
            <Search size={16} />
            <input
              aria-label={pick(
                lang,
                "Tuman yoki shahar izlash",
                "Поиск района или города",
                "Search district or city",
              )}
              placeholder={pick(
                lang,
                "Tuman yoki shahar…",
                "Район или город…",
                "District or city…",
              )}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setResults([]);
                setSearchMessage("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void findPlace();
                }
              }}
            />
            <button
              type="button"
              disabled={searching || search.trim().length < 2}
              onClick={findPlace}
            >
              {searching ? "…" : pick(lang, "Qidirish", "Найти", "Search")}
            </button>
          </div>
          {results.length > 0 && (
            <div className="place-results">
              {results.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => {
                    map.current?.setView([r.latitude, r.longitude], 13);
                    setSearch(r.name);
                    setResults([]);
                  }}
                >
                  <MapPin size={15} />
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {[r.admin2, r.admin1].filter(Boolean).join(" · ")}
                    </small>
                  </span>
                </button>
              ))}
              <small>GeoNames / Open-Meteo</small>
            </div>
          )}
          {searchMessage && <p role="status">{searchMessage}</p>}
        </div>
      )}
      <div className="map-controls">
        {(["street", "satellite"] as const).map((l) => (
          <button
            type="button"
            key={l}
            className={layer === l ? "selected" : ""}
            onClick={() => setLayer(l)}
          >
            {t(lang, l)}
          </button>
        ))}
      </div>
      <div
        ref={container}
        className="field-map"
        aria-label={t(lang, "boundary")}
      />
      {tileError && (
        <div className="map-error">
          {pick(
            lang,
            "Xarita tasviri yuklanmadi. Koordinatalarni qo‘lda kiriting yoki boshqa qatlamni tanlang.",
            "Карта не загрузилась. Введите координаты вручную или смените слой.",
            "Map tiles could not load. Enter coordinates manually or switch layers.",
          )}
        </div>
      )}
      <div className="map-caption">
        {editable
          ? closed
            ? pick(
                lang,
                "Chegara yopildi. O‘zgartirish uchun qayta oching.",
                "Граница закрыта. Откройте для редактирования.",
                "Boundary closed. Reopen it to edit.",
              )
            : pick(
                lang,
                "10 tagacha nuqta qo‘ying. Kamida 3 nuqtadan so‘ng birinchi nuqtani yoki “Chegarani yopish” tugmasini bosing.",
                "Поставьте от 3 до 10 точек, затем нажмите первую точку или «Закрыть границу».",
                "Place 3–10 points, then click the first point or “Close boundary”.",
              )
          : pick(
              lang,
              "Bazaviy xarita • NDVI tasviri emas",
              "Базовая карта • не снимок NDVI",
              "Basemap • not an NDVI image",
            )}
      </div>
    </div>
  );
}
