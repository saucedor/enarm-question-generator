export class ApiError extends Error {
 constructor(message:string,public status=0){super(message);this.name='ApiError';}
}
export async function api<T>(path:string,init?:RequestInit):Promise<T>{
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),30000);
 const abort=()=>controller.abort();
 init?.signal?.addEventListener('abort',abort,{once:true});
 if(init?.signal?.aborted)controller.abort();
 try {
  const response=await fetch(path,{...init,signal:controller.signal,headers:{'X-Requested-With':'enarm',...init?.headers}});
  let body:unknown;
  try{body=await response.json()}catch{throw new ApiError(response.ok?'La respuesta del servidor no es válida. Intenta de nuevo.':'El servicio no está disponible. Intenta de nuevo en unos momentos.',response.status)}
  if(!response.ok){const message=body&&typeof body==='object'&&'error' in body&&typeof body.error==='string'?body.error:null;throw new ApiError(response.status===429?'Has realizado demasiadas solicitudes. Espera un minuto antes de volver a intentar.':message||'No se pudo completar la operación.',response.status)}
  return body as T;
 }catch(error){
  if(error instanceof ApiError)throw error;
  throw new ApiError(controller.signal.aborted?'La solicitud tardó demasiado. Revisa tu conexión e intenta de nuevo.':'No se pudo conectar con el servicio. Revisa tu conexión e intenta de nuevo.');
 }finally{clearTimeout(timeout);init?.signal?.removeEventListener('abort',abort)}
}
