import {createHash,timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import {adminClient,ApiError,failure,jsonBody,uuid} from '@/lib/server/http';
export async function POST(req:Request){try{
 const token=req.headers.get('authorization')?.match(/^Bearer (ek_[0-9a-f]{64})$/)?.[1];if(!token)throw new ApiError(401,'invalid_device_key');
 const body=await jsonBody(req);if(!uuid(body.device_id))throw new ApiError(400,'invalid_device');
 const {moisture_vwc,temperature_c,measured_at}=body;const time=Date.parse(measured_at);
 if(typeof measured_at!=='string'||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(measured_at)||typeof moisture_vwc!=='number'||!Number.isFinite(moisture_vwc)||moisture_vwc<0||moisture_vwc>100||!Number.isFinite(time)||time>Date.now()+300000||time<Date.now()-7*86400000||(temperature_c!=null&&(typeof temperature_c!=='number'||!Number.isFinite(temperature_c)||temperature_c< -50||temperature_c>80)))throw new ApiError(400,'invalid_reading');
 const admin=adminClient();const {data:device,error}=await admin.from('sensor_devices').select('*,fields!inner(archived_at)').eq('id',body.device_id).maybeSingle();
 if(error)throw new ApiError(503,'database_error');
 const hash=createHash('sha256').update(token).digest('hex');
 if(!device||!device.enabled||device.fields.archived_at||!timingSafeEqual(Buffer.from(hash),Buffer.from(device.key_hash)))throw new ApiError(401,'invalid_device_key');
 const {count,error:countError}=await admin.from('soil_readings').select('id',{count:'exact',head:true}).eq('device_id',device.id).gte('created_at',new Date(Date.now()-3600000).toISOString());
 if(countError)throw new ApiError(503,'database_error');if((count??0)>=120)throw new ApiError(429,'rate_limited');
 const {error:insertError}=await admin.from('soil_readings').upsert({field_id:device.field_id,device_id:device.id,moisture_vwc,temperature_c:temperature_c??null,depth_cm:device.depth_cm,calibrated:device.calibrated,source:'device',measured_at:new Date(time).toISOString()},{onConflict:'device_id,measured_at',ignoreDuplicates:true});
 if(insertError)throw new ApiError(503,'database_error');
 return NextResponse.json({accepted:true},{status:202});
}catch(e){return failure(e)}}
