'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Droplets, Globe2, LocateFixed, MapPin, Moon, Newspaper, Radio, RefreshCw, Search, Sun, Thermometer, Wind, TriangleAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';
import { Skeleton } from '@/components/ui/skeleton';
import { useBriefingTool } from '@/hooks/use-briefing-tool';
import { CATEGORIES, DEFAULT_PLACE, type Article, type Category, type NewsData, type Place, type WeatherData } from '@/lib/dayline-types';

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
 const r = await fetch(url, { signal, cache:'no-store' });
 const data = await r.json() as T & { error?: string };
 if (!r.ok) throw new Error(data.error || 'This is temporarily unavailable. Please try again.');
 return data;
}
function relativeTime(value: string, now: number) {
 const minutes=Math.max(0,Math.floor((now-Date.parse(value))/60000));
 if(minutes<1) return 'Just now';
 if(minutes<60) return `${minutes} min ago`;
 const hours=Math.floor(minutes/60);
 if(hours<24) return `${hours}h ago`;
 return new Date(value).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
}
function weatherDescription(code: number) {
 if(code===0) return 'Clear skies'; if(code<=2) return 'Partly cloudy'; if(code===3) return 'Overcast';
 if(code<=48) return 'Foggy'; if(code<=57) return 'Light drizzle'; if(code<=67) return 'Rainy';
 if(code<=77) return 'Snowy'; if(code<=82) return 'Rain showers'; if(code<=86) return 'Snow showers'; return 'Thunderstorms';
}
function WeatherIcon({code,night=false,className=''}:{code:number;night?:boolean;className?:string}) {
 const Icon=code===0?(night?Moon:Sun):code<=2?(night?Moon:CloudSun):code===3?Cloud:code<=48?CloudFog:code<=57?CloudDrizzle:code<=67?CloudRain:code<=77?CloudSnow:code<=82?CloudRain:code<=86?CloudSnow:CloudLightning;
 return <Icon className={`${className} ${code===0&&!night?'sun':''}`} aria-hidden="true"/>;
}
function StoryImage({article,className='',eager=false}:{article:Article;className?:string;eager?:boolean}) {
 const [broken,setBroken]=useState(false);
 if(!article.image||broken) return null;
 return <a className={className} href={article.url} target="_blank" rel="noopener noreferrer" aria-label={`Read: ${article.title}`}><img src={article.image} alt="" className="article-image" loading={eager?'eager':'lazy'} referrerPolicy="no-referrer" onError={()=>setBroken(true)}/></a>;
}
function StoryMeta({article,now}:{article:Article;now:number}) {
 return <div className="article-meta"><span className="source">{article.source}</span><span aria-hidden="true">·</span><time dateTime={article.publishedAt} title={new Date(article.publishedAt).toLocaleString()}>{relativeTime(article.publishedAt,now)}</time></div>;
}
function LoadingNews() {
 return <div className="loading-news" role="status" aria-label="Loading headlines"><div><Skeleton className="h-64 w-full mb-6"/><Skeleton className="h-7 w-11/12 mb-3"/><Skeleton className="h-7 w-4/5 mb-5"/><Skeleton className="h-4 w-full mb-3"/><Skeleton className="h-4 w-4/5"/></div><div>{[0,1,2].map(i=><div key={i} className="mb-8"><Skeleton className="h-3 w-20 mb-4"/><Skeleton className="h-5 w-full mb-2"/><Skeleton className="h-5 w-4/5 mb-4"/><Skeleton className="h-3 w-32"/></div>)}</div></div>;
}
function NewsPanel({data,loading,error,now,retry}:{data:NewsData|null;loading:boolean;error:string;now:number;retry:()=>void}) {
 const [visible,setVisible]=useState(12);
 useEffect(()=>{setVisible(12)},[data?.articles[0]?.id]);
 if(!data&&loading) return <LoadingNews/>;
 if(!data) return <div className="error-panel" role="alert"><Newspaper/><h2>A moment between headlines</h2><p>{error||'No headlines are available right now.'}</p><button className="refresh-button" onClick={retry}><RefreshCw/>Try again</button></div>;
 const [lead,...rest]=data.articles;
 if(!lead) return <div className="error-panel"><h2>No headlines yet</h2><p>Try another category or check back shortly.</p></div>;
 return <>
  {(error||data.partial||data.stale)&&<div className="status-banner" role="status"><TriangleAlert/>{error?'Refresh failed. Showing the last headlines received.':data.stale?'The publisher’s latest available headlines are more than a day old.': 'One source is unavailable. Showing headlines from the sources that responded.'}</div>}
  <div className={`lead-grid ${!lead.image?'no-image':''}`}>
   <article className="lead-story"><StoryImage key={lead.id} article={lead} className="lead-photo" eager/><div className="eyebrow"><span className="mark"/>{lead.category}</div><a href={lead.url} target="_blank" rel="noopener noreferrer"><h2>{lead.title}</h2></a>{lead.description&&<p className="lead-description">{lead.description}</p>}<StoryMeta article={lead} now={now}/></article>
   <div className="side-stories">{rest.slice(0,3).map(article=><article className="side-story" key={article.id}><div className="eyebrow">{article.category}</div><a href={article.url} target="_blank" rel="noopener noreferrer"><h3>{article.title}</h3></a><StoryMeta article={article} now={now}/></article>)}</div>
  </div>
  {rest.length>3&&<><div className="section-heading"><h2>The latest</h2><span>In the headlines</span></div><div className="article-list">{rest.slice(3,visible+3).map(article=><article key={article.id} className="list-story"><div><div className="eyebrow">{article.category}</div><a href={article.url} target="_blank" rel="noopener noreferrer"><h3>{article.title}</h3></a><StoryMeta article={article} now={now}/></div><StoryImage article={article} className="thumb"/></article>)}</div>{rest.length>visible+3&&<button className="more-button" onClick={()=>setVisible(n=>n+12)}>More headlines</button>}</>}
 </>;
}
function WeatherPanel({place,data,loading,error,change,retry}:{place:Place;data:WeatherData|null;loading:boolean;error:string;change:()=>void;retry:()=>void}) {
 const current=data?.current,daily=data?.daily;
 return <aside className="news-sidebar" id="weather"><section className="weather-card" aria-label={`Weather for ${place.name}`}>
  <div className="weather-heading"><span>YOUR WEATHER</span><Sun aria-hidden="true"/></div>
  <div className="weather-location"><div><h2>{place.name}</h2><p>{[place.region,place.country].filter(Boolean).join(', ')||'Your current location'}</p></div><button onClick={change} className="icon-button" title="Change city" aria-label="Change weather city"><MapPin/></button></div>
  {!data&&loading?<div className="loading-weather" role="status" aria-label="Loading weather"><Skeleton className="h-24 w-full mt-5"/><Skeleton className="h-4 w-3/5 my-5"/><Skeleton className="h-52 w-full"/></div>:!data?<div className="weather-error" role="alert"><p>{error||'Weather is not available right now.'}</p><button className="refresh-button" onClick={retry}><RefreshCw/>Try again</button></div>:current&&daily&&<>
   <div className="current-weather"><div className="temperature">{Math.round(current.temperature_2m)}<sup>°C</sup></div><WeatherIcon code={current.weather_code} night={!current.is_day} className="weather-art"/></div>
   <div className="condition-area"><div className="condition">{weatherDescription(current.weather_code)}</div><div className="high-low">High {Math.round(daily.temperature_2m_max[0])}° · Low {Math.round(daily.temperature_2m_min[0])}°</div></div>
   <div className="weather-stats"><div className="weather-stat"><Thermometer/><div><span>Feels like</span><strong>{Math.round(current.apparent_temperature)}°C</strong></div></div><div className="weather-stat"><Droplets/><div><span>Humidity</span><strong>{Math.round(current.relative_humidity_2m)}%</strong></div></div><div className="weather-stat"><Wind/><div><span>Wind</span><strong>{Math.round(current.wind_speed_10m)} km/h</strong></div></div><div className="weather-stat"><CloudRain/><div><span>Rain today</span><strong>{daily.precipitation_probability_max[0]??'—'}{daily.precipitation_probability_max[0]!=null?'%':''}</strong></div></div></div>
   <div className="forecast"><div className="forecast-title">5-DAY FORECAST</div>{daily.time.map((date,i)=><div className="forecast-row" key={date}><span>{i===0?'Today':new Date(date+'T12:00:00Z').toLocaleDateString('en-IN',{weekday:'short',timeZone:'UTC'})}</span><span title={weatherDescription(daily.weather_code[i])}><WeatherIcon code={daily.weather_code[i]}/><span className="sr-only">{weatherDescription(daily.weather_code[i])}</span></span><span className="high" aria-label={`High ${Math.round(daily.temperature_2m_max[i])} degrees`}>{Math.round(daily.temperature_2m_max[i])}°</span><span className="low" aria-label={`Low ${Math.round(daily.temperature_2m_min[i])} degrees`}>{Math.round(daily.temperature_2m_min[i])}°</span></div>)}</div>
   <div className="weather-footer"><span>{error?'Refresh failed · last available data':`Forecast at ${current.time.slice(11,16)} local`}</span><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a></div>
  </>}
 </section><p className="weather-note">Current conditions are model estimates. All temperatures in Celsius.</p><section className="sidebar-note"><h3>A little more perspective.</h3><p>Headlines from established newsrooms, together in one place. Open any story to read the full report at its source.</p><div className="source-badges"><a href="https://www.bbc.com/news" target="_blank" rel="noopener noreferrer">BBC News</a><a href="https://timesofindia.indiatimes.com/" target="_blank" rel="noopener noreferrer">The Times of India</a></div></section></aside>;
}
function LocationDialog({open,setOpen,onSelect}:{open:boolean;setOpen:(open:boolean)=>void;onSelect:(place:Place)=>void}) {
 const [query,setQuery]=useState(''),[places,setPlaces]=useState<Place[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[locating,setLocating]=useState(false);
 useEffect(()=>{if(open){setQuery('');setPlaces([]);setError('')}},[open]);
 useEffect(()=>{
  if(!open||query.trim().length<2){setPlaces([]);setBusy(false);return}
  const controller=new AbortController();setBusy(true);setError('');
  const timer=setTimeout(()=>{fetchJson<{places:Place[]}>(`/api/locations?q=${encodeURIComponent(query.trim())}`,controller.signal).then(d=>setPlaces(d.places)).catch(e=>{if(e.name!=='AbortError'){setError(e.message);setPlaces([])}}).finally(()=>{if(!controller.signal.aborted)setBusy(false)})},350);
  return ()=>{clearTimeout(timer);controller.abort()};
 },[query,open]);
 function locate(){
  setError('');if(!navigator.geolocation){setError('Location is not supported in this browser. Search for a city instead.');return}
  setLocating(true);navigator.geolocation.getCurrentPosition(position=>{setLocating(false);onSelect({id:0,name:'Current location',region:'',country:'',latitude:position.coords.latitude,longitude:position.coords.longitude});setOpen(false)},()=>{setLocating(false);setError('Your location could not be accessed. Allow location access or search for a city.');},{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
 }
 return <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle className="font-serif text-2xl font-normal">Find your weather</DialogTitle><DialogDescription>Search for a city to see its current conditions and forecast.</DialogDescription></DialogHeader>
  <Combobox items={places} filter={null} inputValue={query} onInputValueChange={setQuery} itemToStringLabel={(item:Place)=>item.name} value={null} onValueChange={(item:Place|null)=>{if(item){onSelect(item);setOpen(false)}}}><ComboboxInput className="w-full h-12" placeholder="Search city, e.g. Hyderabad" aria-label="Search city" showTrigger={false}/><ComboboxContent><ComboboxEmpty>{busy?'Searching cities…':query.length<2?'Type at least 2 characters':'No matching cities found.'}</ComboboxEmpty><ComboboxList>{(item:Place)=><ComboboxItem key={item.id} value={item} className="city-result"><strong>{item.name}</strong><span>{[item.region,item.country].filter(Boolean).join(', ')}</span></ComboboxItem>}</ComboboxList></ComboboxContent></Combobox>
  <div aria-live="polite">{error?<p className="location-error">{error}</p>:<p className="location-hint">{busy?'Searching…':'Choose a result to update your forecast.'}</p>}</div><button className="locate-button" onClick={locate} disabled={locating}><LocateFixed/>{locating?'Finding your location…':'Use my current location'}</button><p className="location-hint">Your city preference is saved only in this browser. Weather coordinates are sent to Open-Meteo.</p>
 </DialogContent></Dialog>;
}

export default function Dayline(){
 const [category,setCategory]=useState<Category>('top'),[news,setNews]=useState<NewsData|null>(null),[newsBusy,setNewsBusy]=useState(true),[newsError,setNewsError]=useState('');
 const [place,setPlace]=useState<Place>(DEFAULT_PLACE),[weather,setWeather]=useState<WeatherData|null>(null),[weatherBusy,setWeatherBusy]=useState(true),[weatherError,setWeatherError]=useState('');
 const [cityOpen,setCityOpen]=useState(false),[now,setNow]=useState(0),[ready,setReady]=useState(false),[refresh,setRefresh]=useState(0);
 useBriefingTool({category,news,weather,place,newsError,weatherError});
 const previousCategory=useRef<Category>('top');const previousCoordinates=useRef('');
 useEffect(()=>{setNow(Date.now());try{const saved=JSON.parse(localStorage.getItem('dayline-city')||'null');if(saved&&typeof saved.name==='string'&&typeof saved.latitude==='number'&&typeof saved.longitude==='number'&&Math.abs(saved.latitude)<=90&&Math.abs(saved.longitude)<=180)setPlace(saved)}catch{}setReady(true);const clock=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(clock)},[]);
 useEffect(()=>{
  const controller=new AbortController();
  if(previousCategory.current!==category){setNews(null);previousCategory.current=category}
  async function load(){setNewsBusy(true);setNewsError('');try{const data=await fetchJson<NewsData>(`/api/news?category=${category}`,controller.signal);if(!controller.signal.aborted){setNews(data);setNow(Date.now())}}catch(e){if(!controller.signal.aborted)setNewsError(e instanceof Error?e.message:'Could not load headlines.')}finally{if(!controller.signal.aborted)setNewsBusy(false)}}
  void load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load()},5*60_000);
  function visible(){if(document.visibilityState==='visible')void load()}document.addEventListener('visibilitychange',visible);
  return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible)};
 },[category,refresh]);
 useEffect(()=>{
  if(!ready)return;const controller=new AbortController();const key=`${place.latitude},${place.longitude}`;
  if(previousCoordinates.current!==key){setWeather(null);previousCoordinates.current=key}
  async function load(){setWeatherBusy(true);setWeatherError('');try{const data=await fetchJson<WeatherData>(`/api/weather?lat=${place.latitude}&lon=${place.longitude}`,controller.signal);if(!controller.signal.aborted)setWeather(data)}catch(e){if(!controller.signal.aborted)setWeatherError(e instanceof Error?e.message:'Could not load weather.')}finally{if(!controller.signal.aborted)setWeatherBusy(false)}}
  void load();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load()},10*60_000);
  function visible(){if(document.visibilityState==='visible')void load()}document.addEventListener('visibilitychange',visible);
  return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible)};
 },[place.latitude,place.longitude,refresh,ready]);
 const selectPlace=useCallback((value:Place)=>{setPlace(value);try{localStorage.setItem('dayline-city',JSON.stringify(value))}catch{}},[]);
 const refreshAll=()=>setRefresh(n=>n+1);
 const active=CATEGORIES.find(c=>c.id===category)!;
 const date=now?new Date(now).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):'Your daily edition';
 return <><a href="#headlines" className="skip-link">Skip to headlines</a><div className="topline"><div className="shell"><span>{date}</span><span className="topline-note"><Globe2/><span>India & the world</span></span></div></div><div className="shell">
 <header className="masthead"><a href="/" aria-label="Dayline home"><div className="wordmark">dayline<span>.</span></div><p className="brand-note">NEWS. WEATHER. EVERY DAY.</p></a><div className="masthead-right"><div className="edition"><strong>A fresh perspective, daily.</strong>Your world, at a glance.</div><button className="refresh-button" onClick={refreshAll} disabled={newsBusy||weatherBusy} aria-label="Refresh news and weather"><RefreshCw className={newsBusy||weatherBusy?'spin':''}/><span>{newsBusy||weatherBusy?'Refreshing':'Refresh'}</span></button></div></header>
 <Tabs value={category} onValueChange={value=>setCategory(value as Category)} className="category-root"><div className="nav-row"><div className="category-scroll"><TabsList variant="line" className="category-tabs" aria-label="News categories">{CATEGORIES.map(c=><TabsTrigger key={c.id} value={c.id} className="category-tab">{c.label}</TabsTrigger>)}</TabsList></div><button className="nav-weather" onClick={()=>setCityOpen(true)}><MapPin/>{place.name}{weather&&<span className="muted"> {Math.round(weather.current.temperature_2m)}°</span>}</button></div>
 <main id="headlines"><div className="section-intro"><div><h1>{category==='top'?'Your daily briefing.':active.label}</h1><p>{active.subtitle}</p></div><div className="live-label" role="status">{news&&!newsError&&!news.stale?<><span className="live-dot"/>{newsBusy?'Checking headlines…':`Updated ${relativeTime(news.fetchedAt,now).toLowerCase()}`}</>:newsBusy?'Fetching headlines…':'Latest available headlines'}</div></div>
 <div className="main-grid"><div className="news-main">{CATEGORIES.map(c=><TabsContent key={c.id} value={c.id}><NewsPanel key={c.id} data={news} loading={newsBusy} error={newsError} now={now} retry={refreshAll}/></TabsContent>)}</div><WeatherPanel place={place} data={weather} loading={weatherBusy} error={weatherError} change={()=>setCityOpen(true)} retry={refreshAll}/></div></main></Tabs>
 <footer className="site-footer"><div><a className="footer-brand" href="/">dayline.</a><p>A little clarity in a busy world.</p></div><div className="footer-right"><p>News refreshes every 5 minutes while open.</p><p>Reporting and images belong to their publishers.</p></div></footer>
 </div><LocationDialog open={cityOpen} setOpen={setCityOpen} onSelect={selectPlace}/></>;
}
