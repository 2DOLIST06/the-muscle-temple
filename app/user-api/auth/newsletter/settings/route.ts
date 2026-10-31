import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/api/env';
import { getUserJwt, USER_AUTH_COOKIE } from '@/lib/user/auth';
import { authProxy } from '@/lib/user/auth-proxy';
export const POST = (request: Request) => authProxy(request, '/api/auth/newsletter/settings', true);
export async function GET() {
  const token=await getUserJwt();
  if(!token)return NextResponse.json({error:'Unauthorized'},{status:401});
  try {
    const upstream=await fetch(buildApiUrl('/api/auth/newsletter/settings'),{headers:{Authorization:`Bearer ${token}`},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
    const result=NextResponse.json(await upstream.json(),{status:upstream.status,headers:{'Cache-Control':'no-store'}});
    if(upstream.status===401)result.cookies.delete(USER_AUTH_COOKIE);
    return result;
  }catch{return NextResponse.json({error:'Service unavailable'},{status:503});}
}
