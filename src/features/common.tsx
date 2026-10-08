import type { ReactNode } from 'react';
import { Alert,AlertDescription,AlertTitle } from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
export function ErrorNotice({message,onRetry}:{message:string;onRetry?:()=>void}){return message?<Alert variant="destructive" role="alert"><AlertTitle>No se pudo completar la acción</AlertTitle><AlertDescription>{message}{onRetry&&<Button type="button" variant="outline" className="mt-3" onClick={onRetry}>Volver a intentar</Button>}</AlertDescription></Alert>:null;}
export function Loading(){return <p role="status" className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="size-4 animate-spin"/>Cargando…</p>;}
export function Field({id,label,children,hint}:{id:string;label:string;children:ReactNode;hint?:string}){return <div className="min-w-0 space-y-2"><Label htmlFor={id}>{label}</Label>{children}{hint&&<p className="text-xs leading-5 text-muted-foreground">{hint}</p>}</div>;}
export function Choice({id,value,onChange,items,disabled=false}:{id:string;value:string;onChange:(s:string)=>void;items:Array<[string,string]>;disabled?:boolean}){return <Select value={value} onValueChange={v=>{if(v)onChange(v)}} disabled={disabled}><SelectTrigger id={id} className="w-full data-[size=default]:h-11"><SelectValue/></SelectTrigger><SelectContent>{items.map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>;}
export type Doc={id:string;filename:string;byte_size:number;extraction_status:'ready'|'pending'|'failed';extraction_error:string|null};
export type Run={id:string;input:{topic:string;count:number};status:string;error:string|null;created_at:string;result:{setId?:string;message:string}|null};
export type Config={library:Array<{id:string;title:string;specialty:string;edition:string;url:string;topics:string}>;sourcePolicy:string;difficulties:Record<string,string>};
export type Status={database:string;worker:string;storage:string;generation:string};
export const states:Record<string,string>={queued:'En espera',processing:'Generando y revisando',retrying:'Reintentando',completed:'Completado',failed:'Requiere atención'};
