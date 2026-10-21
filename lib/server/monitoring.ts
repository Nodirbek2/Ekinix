import {createHash} from 'node:crypto';
import 'server-only';
import {publicSatelliteFor} from './public-satellite';
import type {Field,Weather,Satellite,Monitoring,Observation} from '../domain';
import {polygonError} from '../domain';
import {adminClient,fetchJson} from './http';
const number=(n:unknown):number|null=>typeof n==='number'&&Number.isFinite(n)?n:null;
export async function weatherFor(field:Field):Promise<Weather>{
 const fetchedAt=new Date().toISOString();const empty:Weather={status:'unavailable',fetchedAt,modelTime:null,temperature:null,soilVwc:null,soilTime:null,days:[]};
 if(polygonError(field.coordinates_json))return empty;
 const lat=field.coordinates_json.reduce((s,p)=>s+p[0],0)/field.coordinates_json.length;
 const lon=field.coordinates_json.reduce((s,p)=>s+p[1],0)/field.coordinates_json.length;
 try{
  const params=new URLSearchParams({latitude:String(lat),longitude:String(lon),current:'temperature_2m',hourly:'soil_moisture_9_to_27cm',daily:'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration',forecast_days:'7',timezone:'GMT',timeformat:'unixtime'});
  const key=process.env.OPEN_METEO_API_KEY;
  if(key)params.set('apikey',key);
  const data=await fetchJson(`https://${key?'customer-api':'api'}.open-meteo.com/v1/forecast?${params}`,{next:{revalidate:1800}} as RequestInit);
  const now=Date.now()/1000;
  const hours:number[]=data.hourly?.time??[];
  let index=-1;hours.forEach((time,i)=>{if(time<=now)index=i});
  const theta=index>=0?number(data.hourly?.soil_moisture_9_to_27cm?.[index]):null;
  const days=(data.daily?.time??[]).map((time:number,i:number)=>({date:new Date(time*1000).toISOString().slice(0,10),min:number(data.daily.temperature_2m_min?.[i]),max:number(data.daily.temperature_2m_max?.[i]),rainMm:number(data.daily.precipitation_sum?.[i]),rainProbability:number(data.daily.precipitation_probability_max?.[i]),et0:number(data.daily.et0_fao_evapotranspiration?.[i])}));
  return {status:days.length?'available':'unavailable',fetchedAt,modelTime:data.current?.time?new Date(data.current.time*1000).toISOString():null,temperature:number(data.current?.temperature_2m),soilVwc:theta!==null&&theta>=0&&theta<=1?Math.round(theta*1000)/10:null,soilTime:index>=0?new Date(hours[index]*1000).toISOString():null,days};
 }catch{return empty;}
}
async function copernicusSatelliteFor(field:Field):Promise<Satellite>{
 const fetchedAt=new Date().toISOString();
 const result:Satellite={status:'unavailable',fetchedAt,observations:[]};
 const id=process.env.SENTINEL_HUB_CLIENT_ID,secret=process.env.SENTINEL_HUB_CLIENT_SECRET;
 if(!id||!secret)return {...result,status:'not_configured'};
 if(polygonError(field.coordinates_json))return result;
 let phase='authentication';
 try{
  const token=await fetchJson('https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:id,client_secret:secret})});
  phase='statistics';
  const ring=field.coordinates_json.map(([lat,lng])=>[lng,lat]);ring.push(ring[0]);
  const to=new Date();to.setUTCHours(0,0,0,0);const from=new Date(to.getTime()-30*86400000);
  const stats=await fetchJson('https://sh.dataspace.copernicus.eu/api/v1/statistics',{method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({
   input:{bounds:{geometry:{type:'Polygon',coordinates:[ring]},properties:{crs:'http://www.opengis.net/def/crs/EPSG/0/4326'}},data:[{type:'sentinel-2-l2a',dataFilter:{maxCloudCoverage:80}}]},
   aggregation:{timeRange:{from:from.toISOString(),to:to.toISOString()},aggregationInterval:{of:'P1D'},resx:0.0001,resy:0.0001,evalscript:`//VERSION=3
function setup(){return {input:[{bands:["B04","B08","SCL","dataMask"]}],output:[{id:"ndvi",bands:1},{id:"dataMask",bands:1}]};}
function evaluatePixel(s){let valid=s.dataMask===1 && [4,5,6].includes(s.SCL) && (s.B08+s.B04)>0;return {ndvi:[valid?(s.B08-s.B04)/(s.B08+s.B04):0],dataMask:[valid?1:0]};}`}
  })},22000);
  const observations:Observation[]=[];
  for(const item of stats.data??[]){
   const s=item.outputs?.ndvi?.bands?.B0?.stats;const mean=number(s?.mean);const count=number(s?.sampleCount);const noData=number(s?.noDataCount);
   const valid=count&&noData!==null?(count-noData)/count*100:0;
   if(mean!==null&&mean>=-1&&mean<=1&&valid>=50&&item.interval?.from)observations.push({date:item.interval.from.slice(0,10),ndvi:Math.round(mean*1000)/1000,validPercent:Math.round(valid)});
  }
  return {...result,status:observations.length?'available':'no_clear_scene',observations:observations.sort((a,b)=>a.date.localeCompare(b.date))};
 }catch(error){const status=error instanceof Error?error.message.match(/Upstream (\d{3})/)?.[1]:undefined;return {...result,diagnostic:phase+'_'+(status??'unreachable')};}
}
export async function satelliteFor(field:Field):Promise<Satellite>{
 if(polygonError(field.coordinates_json))return {status:'unavailable',fetchedAt:new Date().toISOString(),observations:[]};
 const primary=await copernicusSatelliteFor(field);
 if(primary.status==='available'||primary.status==='no_clear_scene')return {...primary,source:'copernicus'};
 const fallback=await publicSatelliteFor(field);
 return {...fallback,diagnostic:primary.diagnostic};
}
export async function getMonitoring(field:Field):Promise<Monitoring>{
 const admin=adminClient();const {data:cached}=await admin.from('field_snapshots').select('*').eq('field_id',field.id).maybeSingle();
 const fingerprint=createHash('sha256').update(JSON.stringify({version:2,coordinates:field.coordinates_json})).digest('hex');
 const matching=cached?.payload?.boundaryFingerprint===fingerprint?cached:null;
 const age=matching?Date.now()-Date.parse(matching.fetched_at):Infinity;
 if(matching&&age<1800000)return matching.payload as Monitoring;
 const old=matching?.payload as Monitoring|undefined;
 const satellitePromise=old?.satellite.status==='available'&&Date.now()-Date.parse(old.satellite.fetchedAt)<6*3600000?Promise.resolve(old.satellite):satelliteFor(field);
 const [weather,satellite]=await Promise.all([weatherFor(field),satellitePromise]);
 const result:Monitoring={weather,satellite,fetchedAt:new Date().toISOString()};
 // Keep previous real observations (with their original dates) if the provider is unavailable.
 if(old?.satellite.observations.length){const history=new Map(old.satellite.observations.map(o=>[o.date,o]));satellite.observations.forEach(o=>history.set(o.date,o));result.satellite={...satellite,observations:[...history.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-100)};}
 const {error}=await admin.from('field_snapshots').upsert({field_id:field.id,payload:{...result,boundaryFingerprint:fingerprint},fetched_at:result.fetchedAt});
 if(error)console.error('[Ekinix] Snapshot persistence failed',error.code);
 return result;
}
