import { createClient } from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase=url&&key?createClient(url,key):null;
export function requireClient(){if(!supabase)throw new Error('not_configured');return supabase;}
export async function api<T>(path:string,body?:unknown):Promise<T>{
 const client=requireClient();const {data:{session}}=await client.auth.getSession();
 if(!session)throw new Error('session_expired');
 const res=await fetch(path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await res.json();if(!res.ok)throw new Error(data.error??'request_failed');return data as T;
}
