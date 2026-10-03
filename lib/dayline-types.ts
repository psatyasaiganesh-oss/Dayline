export const CATEGORIES = [
  { id: 'top', label: 'Top stories', subtitle: 'The latest from India and around the world.' },
  { id: 'india', label: 'India', subtitle: 'Headlines from across the country.' },
  { id: 'world', label: 'World', subtitle: 'A wider view of what’s happening.' },
  { id: 'business', label: 'Business', subtitle: 'Companies, economies, and the world of work.' },
  { id: 'technology', label: 'Technology', subtitle: 'The ideas and innovations shaping our world.' },
  { id: 'sport', label: 'Sport', subtitle: 'The latest from the field and beyond.' },
  { id: 'science', label: 'Science', subtitle: 'Discoveries, our planet, and what comes next.' },
] as const;
export type Category = typeof CATEGORIES[number]['id'];
export type Article = { id: string; title: string; description: string; url: string; image: string | null; source: string; category: string; publishedAt: string };
export type NewsData = { articles: Article[]; fetchedAt: string; partial: boolean; stale: boolean; sources: string[] };
export type Place = { id: number; name: string; region: string; country: string; latitude: number; longitude: number };
export const DEFAULT_PLACE: Place = { id: 1253102, name: 'Visakhapatnam', region: 'Andhra Pradesh', country: 'India', latitude: 17.6868, longitude: 83.2185 };
export type WeatherData = { fetchedAt: string; timezone: string; current: { time: string; temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; is_day: number; weather_code: number; wind_speed_10m: number }; daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[] } };
