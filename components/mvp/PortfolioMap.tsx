"use client";
import { useEffect, useRef, useState } from "react";
import type L from "leaflet";
import { Layers, Map as MapIcon } from "lucide-react";
import { pick, type Field, type Lang } from "@/lib/domain";
import { fieldColors } from "@/lib/workspace";
export default function PortfolioMap({
  fields,
  selected,
  onSelect,
  lang,
}: {
  fields: Field[];
  selected?: string;
  onSelect?: (id: string) => void;
  lang: Lang;
}) {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    lib = useRef<typeof L | null>(null),
    shapes = useRef<L.LayerGroup | null>(null),
    tile = useRef<L.TileLayer | null>(null),
    callback = useRef(onSelect);
  const [ready, setReady] = useState(false),
    [satellite, setSatellite] = useState(true),
    [error, setError] = useState(false);
  useEffect(() => {
    callback.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    import("leaflet")
      .then((mod) => {
        if (disposed || !host.current) return;
        lib.current = mod.default;
        map.current = mod.default
          .map(host.current, { scrollWheelZoom: false, zoomControl: false })
          .setView([41.12, 69.02], 13);
        mod.default.control
          .zoom({ position: "bottomright" })
          .addTo(map.current);
        shapes.current = mod.default.layerGroup().addTo(map.current);
        observer = new ResizeObserver(() => map.current?.invalidateSize());
        observer.observe(host.current);
        setReady(true);
      })
      .catch(() => setError(true));
    return () => {
      disposed = true;
      observer?.disconnect();
      map.current?.remove();
    };
  }, []);
  useEffect(() => {
    if (!ready || !lib.current || !map.current) return;
    const l = lib.current;
    tile.current?.remove();
    const next = l
      .tileLayer(
        satellite
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: satellite
            ? "© Esri, Maxar, Earthstar Geographics"
            : "© OpenStreetMap contributors",
        },
      )
      .addTo(map.current);
    tile.current = next;
    next.on("tileerror", () => setError(true));
    next.on("load", () => setError(false));
    return () => {
      next.remove();
    };
  }, [satellite, ready]);
  useEffect(() => {
    if (!ready || !lib.current || !map.current || !shapes.current) return;
    const l = lib.current;
    shapes.current.clearLayers();
    const bounds = l.latLngBounds([]);
    fields.forEach((f, i) => {
      if (!Array.isArray(f.coordinates_json) || f.coordinates_json.length < 3)
        return;
      const color = fieldColors[i % fieldColors.length];
      const polygon = l
        .polygon(f.coordinates_json, {
          color: selected === f.id ? "#fff" : color,
          weight: selected === f.id ? 3 : 2,
          fillColor: color,
          fillOpacity: selected === f.id ? 0.48 : 0.26,
        })
        .addTo(shapes.current!);
      const label = document.createElement("span");
      label.textContent = f.name;
      polygon.bindTooltip(label, {
        permanent: true,
        direction: "center",
        className: "field-map-label",
      });
      polygon.on("click", () => callback.current?.(f.id));
      bounds.extend(polygon.getBounds());
    });
    if (bounds.isValid())
      map.current.fitBounds(bounds, { padding: [55, 55], maxZoom: 16 });
  }, [fields, selected, ready]);
  return (
    <div className="portfolio-map">
      <div
        ref={host}
        className="portfolio-map-canvas"
        aria-label={pick(lang, "Dalalar xaritasi", "Карта полей", "Field map")}
      />
      <div className="portfolio-map-toolbar">
        <span>
          <Layers size={14} />
          {pick(lang, "Dala chegaralari", "Границы полей", "Field boundaries")}
        </span>
        <button type="button" onClick={() => setSatellite((v) => !v)}>
          <MapIcon size={14} />
          {satellite
            ? pick(lang, "Xarita", "Карта", "Street map")
            : pick(lang, "Sun’iy yo‘ldosh", "Спутник", "Satellite")}
        </button>
      </div>
      {error && (
        <div className="map-error">
          {pick(
            lang,
            "Xarita qatlami yuklanmadi. Boshqa qatlamni tanlang.",
            "Слой карты недоступен. Выберите другой.",
            "Map layer unavailable. Try the other layer.",
          )}
        </div>
      )}
      <span className="map-disclaimer">
        {pick(
          lang,
          "Bazaviy tasvir · NDVI qatlami emas",
          "Базовая карта · не слой NDVI",
          "Basemap imagery · not an NDVI layer",
        )}
      </span>
    </div>
  );
}
