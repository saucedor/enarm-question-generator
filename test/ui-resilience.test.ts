import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RunInput} from '../shared/domain.js';
import {readGenerationDraft,generationIssue} from '../src/lib/generation-draft.js';
import {api,ApiError} from '../src/lib/request.js';
const defaults=RunInput.parse({specialty:'Medicina interna',topic:'Predeterminado',difficulty:'básica',count:3});
test('incomplete generation drafts survive without weakening the submit contract',()=>{
 for(const draft of [{...defaults,topic:'',sourceMode:'documento'},{...defaults,topic:'Mi borrador',format:'seriadas',caseCount:5,questionsPerCase:5,count:25}]){
  assert.deepEqual(readGenerationDraft(JSON.stringify(draft),defaults),draft);
  assert.equal(RunInput.safeParse(draft).success,false);
  assert.ok(generationIssue(draft as typeof defaults));
 }
 assert.deepEqual(readGenerationDraft('{broken',defaults),defaults);
 assert.deepEqual(readGenerationDraft(JSON.stringify({...defaults,sourceMode:'unknown'}),defaults),defaults);
});
test('form validation explains whitespace, combined bounds and missing document in Spanish',()=>{
 assert.equal(generationIssue({...defaults,topic:'   '})?.field,'topic');
 assert.equal(generationIssue({...defaults,format:'seriadas',caseCount:3,questionsPerCase:4})?.field,'caseCount');
 assert.equal(generationIssue({...defaults,count:1.5})?.field,'count');
 assert.equal(generationIssue({...defaults,sourceMode:'ambos'})?.field,'document');
 assert.equal(generationIssue({...defaults,format:'seriadas',caseCount:2,questionsPerCase:5}),null);
});
test('API handles outages, malformed responses, rate limits and preserves conflict status',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original});
 globalThis.fetch=async()=>{throw new TypeError('Failed to fetch')};
 await assert.rejects(api('/api/test'),/No se pudo conectar/);
 globalThis.fetch=async()=>new Response('<html>gateway</html>',{status:502});
 await assert.rejects(api('/api/test'),/servicio no está disponible/);
 globalThis.fetch=async()=>new Response('{invalid',{status:200});
 await assert.rejects(api('/api/test'),/respuesta del servidor no es válida/);
 globalThis.fetch=async()=>Response.json({error:'Too Many Requests'},{status:429});
 await assert.rejects(api('/api/test'),/Espera un minuto/);
 globalThis.fetch=async()=>Response.json({error:'Otra sesión modificó estas preguntas.'},{status:409});
 await assert.rejects(api('/api/test'),(e:unknown)=>e instanceof ApiError&&e.status===409);
});
test('API aborts slow requests instead of keeping actions busy forever',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original});
 t.mock.timers.enable({apis:['setTimeout']});
 globalThis.fetch=async(_url,init)=>new Promise((_resolve,reject)=>init!.signal!.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));
 const request=api('/api/test');
 const result=assert.rejects(request,/tardó demasiado/);
 t.mock.timers.tick(30000);await result;
});
