import { getNews } from '@/lib/dayline-server';
import { CATEGORIES, type Category } from '@/lib/dayline-types';
export async function GET(request: Request) {
 const category = new URL(request.url).searchParams.get('category') || 'top';
 if (!CATEGORIES.some(c=>c.id===category)) return Response.json({ error:'Unknown category.' }, { status:400 });
 try { return Response.json(await getNews(category as Category), { headers:{'Cache-Control':'private, max-age=60'} }); }
 catch { return Response.json({ error:'Headlines are temporarily unavailable. Please try again.' }, { status:503 }); }
}
