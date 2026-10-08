import { useCallback, useEffect, useState } from 'react';
import {api} from './request';
export {api,ApiError} from './request';
export const json=(method:string,body:unknown):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
export function useResource<T>(path:string,poll=0){
 const [data,setData]=useState<T|null>(null);const [error,setError]=useState('');const [version,setVersion]=useState(0);
 const reload=useCallback(()=>setVersion(v=>v+1),[]);
 useEffect(()=>{let alive=true;let loading=false;const controller=new AbortController();setData(null);setError('');const load=()=>{if(loading)return;loading=true;return api<T>(path,{signal:controller.signal}).then(d=>{if(alive){setData(d);setError('');}},e=>{if(alive)setError(e.message)}).finally(()=>{loading=false})};void load();const timer=poll?setInterval(load,poll):null;return()=>{alive=false;controller.abort();if(timer)clearInterval(timer)};},[path,poll,version]);
 return {data,error,reload,setData};
}
export function navigate(path:string){window.location.hash=path;window.scrollTo(0,0);}
