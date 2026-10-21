import {NextResponse} from 'next/server';
import {authorizedField,failure} from '@/lib/server/http';
import {getMonitoring} from '@/lib/server/monitoring';
export const maxDuration=60;
export async function GET(req:Request){try{const {field}=await authorizedField(req,new URL(req.url).searchParams.get('fieldId'),'monitoring');return NextResponse.json(await getMonitoring(field),{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e)}}
