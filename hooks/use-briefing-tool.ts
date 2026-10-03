'use client';
import { useEffect, useRef } from 'react';
import type { Category, NewsData, Place, WeatherData } from '@/lib/dayline-types';
type Briefing = { category: Category; news: NewsData|null; weather: WeatherData|null; place: Place; newsError: string; weatherError: string };
type Tool = { name:string; title:string; description:string; inputSchema:object; annotations:{readOnlyHint:boolean;untrustedContentHint:boolean}; execute:(input:unknown)=>unknown };
export function useBriefingTool(briefing:Briefing){
 const current=useRef(briefing);current.current=briefing;
 useEffect(()=>{
  const context=(document as Document & { modelContext?:{ registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void> } }).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try{void Promise.resolve(context.registerTool({
   name:'read_daily_briefing',title:'Read the current news and weather',
   description:'Read the headlines and weather currently displayed in Dayline, including source links, timestamps and any loading or availability errors. Does not fetch other data or change the page.',
   inputSchema:{type:'object',properties:{},additionalProperties:false},
   annotations:{readOnlyHint:true,untrustedContentHint:true},
   execute(input){
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('This tool takes an empty object.');
    const b=current.current;
    return {category:b.category,newsUpdatedAt:b.news?.fetchedAt??null,headlines:b.news?.articles.slice(0,16).map(({title,url,source,publishedAt})=>({title,url,source,publishedAt}))??[],location:b.place.name,weather:b.weather?{current:b.weather.current,forecast:b.weather.daily,timezone:b.weather.timezone,fetchedAt:b.weather.fetchedAt}:null,newsStatus:b.newsError||(b.news?'available':'loading'),weatherStatus:b.weatherError||(b.weather?'available':'loading')};
   },
  },{signal:lifecycle.signal})).catch(()=>{});}catch{}
  return()=>lifecycle.abort();
 },[]);
}
