import { Worker } from 'node:worker_threads';
import { UserFacingError } from './errors.js';
import type { SourcePage } from '../shared/domain.js';
export async function extractText(bytes:Buffer,mediaType:string):Promise<SourcePage[]> {
 if(mediaType==='text/plain') {
  let text:string;
  try {text=new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/\r\n/g,'\n');} catch {throw new UserFacingError('El TXT debe estar codificado en UTF-8.');}
  if(text.trim().length<80)throw new UserFacingError('El documento tiene muy poco texto. Incluye material clínico suficiente para sustentar las preguntas.');
  if(text.length>800000)throw new UserFacingError('El texto supera los 800 000 caracteres admitidos.');
  // TXT references are numbered sections of at most 4000 characters, not invented physical pages.
  const pages:SourcePage[]=[];
  for(let i=0;i<text.length;i+=4000)pages.push({page:pages.length+1,text:text.slice(i,i+4000)});
  return pages;
 }
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL(import.meta.url.endsWith('.ts')?'./extract-worker.ts':'./extract-worker.js',import.meta.url),{workerData:bytes,execArgv:[],resourceLimits:{maxOldGenerationSizeMb:256}});
  const timer=setTimeout(()=>{void worker.terminate();reject(new UserFacingError('No se pudo extraer el PDF en 30 segundos. Prueba con un archivo más pequeño.'));},30000);
  worker.once('message',(result:{pages?:SourcePage[];error?:string})=>{clearTimeout(timer);void worker.terminate();if(result.pages)resolve(result.pages);else reject(new UserFacingError(result.error?.startsWith('El ')?result.error:'No se pudo leer el PDF. Puede estar cifrado, dañado o escaneado.'));});
  worker.once('error',()=>{clearTimeout(timer);reject(new UserFacingError('No se pudo leer el PDF. Puede estar cifrado, dañado o escaneado.'));});
  worker.once('exit',code=>{clearTimeout(timer);if(code!==0)reject(new UserFacingError('La extracción del PDF excedió los recursos disponibles.'));});
 });
}
