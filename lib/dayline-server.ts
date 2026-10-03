import { CATEGORIES, type Category, type Article, type NewsData, type WeatherData, type Place } from './dayline-types';

type Feed = { url: string; source: string; category: string };
const bbc = (section: string, category: string): Feed => ({ url: `https://feeds.bbci.co.uk/news/${section}/rss.xml`, source: 'BBC News', category });
const india: Feed = { url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', source: 'The Times of India', category: 'India' };
const world = bbc('world', 'World');
const FEEDS: Record<Category, Feed[]> = {
  top: [india, world], india: [india], world: [world], business: [bbc('business', 'Business')],
  technology: [bbc('technology', 'Technology')], sport: [{ url: 'https://feeds.bbci.co.uk/sport/rss.xml', source: 'BBC Sport', category: 'Sport' }], science: [bbc('science_and_environment', 'Science')],
};
const memory = new Map<string, { value: unknown; expires: number }>();
const pending = new Map<string, Promise<unknown>>();
async function cached<T>(key: string, ttl: number, get: () => Promise<T>): Promise<T> {
  const previous = memory.get(key);
  if (previous && previous.expires > Date.now()) return previous.value as T;
  if (pending.has(key)) return pending.get(key) as Promise<T>;
  const promise = get().then(value => {
    if (memory.size > 150) memory.delete(memory.keys().next().value!);
    memory.set(key, { value, expires: Date.now() + ttl });
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
async function request(url: string): Promise<Response> {
  const response = await fetch(url, { headers: { 'Accept': 'application/rss+xml, application/xml, application/json, text/xml;q=0.9, */*;q=0.8' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('The source is temporarily unavailable.');
  return response;
}
function decode(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity: string) => {
    const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    if (entity[0] !== '#') return named[entity.toLowerCase()] || '';
    const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2),16) : parseInt(entity.slice(1),10);
    return Number.isFinite(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
  });
}
function clean(s: string): string { return decode(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function tag(s: string, name: string): string { return s.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || ''; }
function safeUrl(s: string): string | null { try { const u = new URL(decode(s)); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href.replace(/^http:/, 'https:') : null; } catch { return null; } }
export function parseFeed(xml: string, feed: Feed): Article[] {
  const items = Array.from(xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi));
  return items.flatMap((match) => {
    const item = match[1];
    const title = clean(tag(item, 'title'));
    const url = safeUrl(tag(item, 'link').replace(/<!\[CDATA\[|\]\]>/g, '').trim());
    const date = new Date(clean(tag(item, 'pubDate')));
    if (!title || !url || !Number.isFinite(date.getTime()) || date.getTime() > Date.now()+3600000) return [];
    const media = item.match(/<media:(?:thumbnail|content)\b[^>]*\burl=["']([^"']+)["']/i)?.[1];
    const descImage = decode(tag(item, 'description')).match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
    const enclosure = item.match(/<enclosure\b[^>]*\burl=["']([^"']+)["']/i)?.[1];
    const fullDescription = clean(tag(item, 'description'));
    const description = fullDescription.length > 260 ? fullDescription.slice(0, 257).replace(/\s+\S*$/, '') + '…' : fullDescription;
    return [{ id: url, title, url, description, image: safeUrl(media || descImage || enclosure || ''), publishedAt: date.toISOString(), source: feed.source, category: feed.category }];
  });
}
export async function getNews(category: Category): Promise<NewsData> {
  if (!CATEGORIES.some(c => c.id === category)) throw new Error('Unknown news category.');
  return cached(`news:${category}`, 5 * 60_000, async () => {
    const feeds = FEEDS[category];
    const results = await Promise.allSettled(feeds.map(async f => {
      const xml = await (await request(f.url)).text();
      const articles = parseFeed(xml, f);
      if (!articles.length) throw new Error('This feed has no readable stories.');
      return articles;
    }));
    let articles = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    if (!articles.length) throw new Error('Headlines are taking a little longer to arrive. Please try again.');
    const seen = new Set<string>();
    articles = articles.filter(a => { const key = a.title.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).sort((a,b) => Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,50);
    return { articles, fetchedAt: new Date().toISOString(), partial: results.some(r => r.status === 'rejected'), stale: Date.now()-Date.parse(articles[0].publishedAt)>36*3600000, sources: [...new Set(articles.map(a=>a.source))] };
  });
}
export async function getWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const lat = latitude.toFixed(2), lon = longitude.toFixed(2);
  return cached(`weather:${lat},${lon}`, 10*60_000, async () => {
    const params = new URLSearchParams({ latitude:lat, longitude:lon, current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m', daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max', timezone:'auto', forecast_days:'5' });
    const data = await (await request(`https://api.open-meteo.com/v1/forecast?${params}`)).json() as WeatherData;
    if (!data.current || !data.daily?.time?.length || typeof data.current.temperature_2m !== 'number') throw new Error('Weather is temporarily unavailable.');
    return { fetchedAt:new Date().toISOString(), timezone:data.timezone, current:data.current, daily:data.daily };
  });
}
export async function findPlaces(query: string): Promise<Place[]> {
  return cached(`places:${query.toLowerCase()}`, 60*60_000, async () => {
    const params = new URLSearchParams({ name:query, count:'8', language:'en', format:'json' });
    const json = await (await request(`https://geocoding-api.open-meteo.com/v1/search?${params}`)).json() as { results?: { id:number; name:string; admin1?:string; country?:string; latitude:number; longitude:number }[] };
    return (json.results || []).map(p => ({ id:p.id, name:p.name, region:p.admin1||'', country:p.country||'', latitude:p.latitude, longitude:p.longitude }));
  });
}
