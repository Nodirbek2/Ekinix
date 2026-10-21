import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {NextResponse} from 'next/server';
import type {Field} from '../domain';
export class ApiError extends Error{constructor(public status:number,message:string){super(message)}}
export const uuid=(s:unknown):s is string=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
export function publicClient(token?:string){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new ApiError(503,'not_configured');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:token?{headers:{Authorization:`Bearer ${token}`}}:undefined});
}
export function adminClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new ApiError(503,'server_not_configured');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function authorizedField(req:Request,id:unknown,budget?:'monitoring'|'ai'){
 if(!uuid(id))throw new ApiError(400,'invalid_field');
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)throw new ApiError(401,'session_expired');
 const client=publicClient(token);const {data,error}=await client.auth.getUser(token);
 if(error||!data.user)throw new ApiError(401,'session_expired');
 const {data:field,error:fieldError}=await client.from('fields').select('*').eq('id',id).is('archived_at',null).maybeSingle();
 if(fieldError)throw new ApiError(503,'database_error');if(!field)throw new ApiError(404,'field_not_found');
 if(budget){const {data:allowed,error:e}=await client.rpc('consume_api_budget',{p_kind:budget});if(e)throw new ApiError(503,'database_error');if(!allowed)throw new ApiError(429,'rate_limited');}
 return {client,field:field as Field,user:data.user};
}
export async function jsonBody(req:Request){
 if(Number(req.headers.get('content-length')??0)>16000)throw new ApiError(413,'request_too_large');
 const text=await req.text();if(text.length>16000)throw new ApiError(413,'request_too_large');
 try{const data=JSON.parse(text);if(!data||Array.isArray(data)||typeof data!=='object')throw Error();return data;}catch{throw new ApiError(400,'invalid_request')}
}
export function failure(error:unknown){
 if(error instanceof ApiError)return NextResponse.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});
 console.error('[Ekinix API]',error instanceof Error?error.name:'Unknown error');
 return NextResponse.json({error:'request_failed'},{status:500});
}
export async function fetchJson(url:string,init:RequestInit={},timeout=12000){
 const response=await fetch(url,{...init,signal:AbortSignal.timeout(timeout)});
 if(!response.ok)throw new Error(`Upstream ${response.status}`);
 return response.json();
}
