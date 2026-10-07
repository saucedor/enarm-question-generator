import { useCallback, useEffect, useState } from 'react';
export async function api<T>(path:string,init?:RequestInit):Promise<T>{
 const response=await fetch(path,{...init,headers:{'X-Requested-With':'enarm',...init?.headers}});
 const body=await response.json();
 if(!response.ok)throw new Error(body.error||'No se pudo completar la operación.');
 return body;
}
export const json=(method:string,body:unknown):RequestInit=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
export function useResource<T>(path:string,poll=0){
 const [data,setData]=useState<T|null>(null);const [error,setError]=useState('');const [version,setVersion]=useState(0);
 const reload=useCallback(()=>setVersion(v=>v+1),[]);
 useEffect(()=>{let alive=true;setData(null);const load=()=>api<T>(path).then(d=>{if(alive){setData(d);setError('');}},e=>{if(alive)setError(e.message)});void load();const timer=poll?setInterval(load,poll):null;return()=>{alive=false;if(timer)clearInterval(timer)};},[path,poll,version]);
 return {data,error,reload,setData};
}
export function navigate(path:string){window.location.hash=path;window.scrollTo(0,0);}
