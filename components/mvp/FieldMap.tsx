'use client';
import {useEffect,useRef,useState} from 'react';
import type L from 'leaflet';
import type {Point,Lang} from '@/lib/domain';
import {pick} from '@/lib/domain';
import {t} from '@/lib/copy';
export default function FieldMap({points,center,editable=false,onChange,lang}:{points:Point[];center:Point;editable?:boolean;onChange?:(p:Point[])=>void;lang:Lang}){
 const container=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),overlay=useRef<L.LayerGroup|null>(null),tiles=useRef<L.TileLayer|null>(null),leaflet=useRef<typeof L|null>(null);
 const latest=useRef({points,onChange,editable});useEffect(()=>{latest.current={points,onChange,editable}},[points,onChange,editable]);
 const initial=useRef({points,center});const [ready,setReady]=useState(false),[layer,setLayer]=useState<'street'|'satellite'>('satellite'),[tileError,setTileError]=useState(false);
 useEffect(()=>{let disposed=false;let observer:ResizeObserver|undefined;
  import('leaflet').then(mod=>{if(disposed||!container.current)return;const lib=mod.default;leaflet.current=lib;
   const m=lib.map(container.current,{scrollWheelZoom:false}).setView(initial.current.center,14);map.current=m;overlay.current=lib.layerGroup().addTo(m);
   if(initial.current.points.length>=3)m.fitBounds(lib.latLngBounds(initial.current.points),{padding:[30,30],maxZoom:17});
   m.on('click',(e:L.LeafletMouseEvent)=>{const current=latest.current;if(current.editable&&current.points.length<100)current.onChange?.([...current.points,[Number(e.latlng.lat.toFixed(6)),Number(e.latlng.lng.toFixed(6))]]);});
   observer=new ResizeObserver(()=>m.invalidateSize());observer.observe(container.current);setReady(true);
  }).catch(()=>setTileError(true));
  return()=>{disposed=true;observer?.disconnect();map.current?.remove();map.current=null;};
 },[]);
 useEffect(()=>{const lib=leaflet.current,m=map.current;if(!lib||!m||!ready)return;
  tiles.current?.remove();const tile=lib.tileLayer(layer==='satellite'?'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}':'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:layer==='satellite'?'Tiles © Esri, Maxar, Earthstar Geographics':'© OpenStreetMap contributors'}).addTo(m);tiles.current=tile;
  tile.on('tileerror',()=>setTileError(true));tile.on('load',()=>setTileError(false));return()=>{tile.remove()};
 },[layer,ready]);
 useEffect(()=>{const lib=leaflet.current,o=overlay.current;if(!lib||!o||!ready)return;o.clearLayers();if(points.length>=3)lib.polygon(points,{color:'#d4f68b',weight:3,fillColor:'#b9e570',fillOpacity:0.16}).addTo(o);else if(points.length)lib.polyline(points,{color:'#d4f68b'}).addTo(o);if(editable)points.forEach((p,i)=>lib.circleMarker(p,{radius:5,color:'#fff',fillColor:'#31523a',fillOpacity:1}).bindTooltip(String(i+1)).addTo(o));},[points,editable,ready]);
 useEffect(()=>{if(ready&&editable&&(center[0]!==initial.current.center[0]||center[1]!==initial.current.center[1]))map.current?.setView(center,13)},[center,editable,ready]);
 return <div className="map-wrap"><div className="map-controls">{(['street','satellite'] as const).map(l=><button type="button" key={l} className={layer===l?'selected':''} onClick={()=>setLayer(l)}>{t(lang,l)}</button>)}</div><div ref={container} className="field-map" aria-label={t(lang,'boundary')}/>{tileError&&<div className="map-error">{pick(lang,'Xarita tasviri yuklanmadi. Koordinatalarni qo‘lda kiriting yoki boshqa qatlamni tanlang.','Карта не загрузилась. Введите координаты вручную или смените слой.','Map tiles could not load. Enter coordinates manually or switch layers.')}</div>}<div className="map-caption">{editable?pick(lang,'Chegarani chizish uchun xaritaga bosing.','Нажмите на карту, чтобы нарисовать границу.','Click the map to draw your field boundary.'):pick(lang,'Bazaviy xarita • NDVI tasviri emas','Базовая карта • не снимок NDVI','Basemap • not an NDVI image')}</div></div>;
}
