import { findPlaces } from '@/lib/dayline-server';
export async function GET(request: Request) {
 const q=(new URL(request.url).searchParams.get('q')||'').trim();
 if (q.length<2 || q.length>80) return Response.json({error:'Enter between 2 and 80 characters.'},{status:400});
 try { return Response.json({ places:await findPlaces(q) }, {headers:{'Cache-Control':'private, max-age=3600'}}); }
 catch { return Response.json({error:'City search is temporarily unavailable. Please try again.'},{status:503}); }
}
