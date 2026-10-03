import { getWeather } from '@/lib/dayline-server';
export async function GET(request: Request) {
 const p = new URL(request.url).searchParams;
 const lat = Number(p.get('lat')), lon = Number(p.get('lon'));
 if (!p.has('lat') || !p.has('lon') || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) return Response.json({error:'Choose a valid location.'},{status:400});
 try { return Response.json(await getWeather(lat,lon), {headers:{'Cache-Control':'private, max-age=120'}}); }
 catch { return Response.json({error:'The weather service is temporarily unavailable. Please try again.'},{status:503}); }
}
