import { parseHTML } from 'linkedom';
import { createHash } from 'node:crypto';
import type pg from 'pg';
import type { EvidenceSource, RunInput, SourcePage } from '../shared/domain.js';
import type { ObjectStore } from './storage.js';
import { extractText } from './extraction.js';
import { UserFacingError } from './errors.js';
export const library = [
 {id:'nice-ng28-glucose',title:'Diabetes tipo 2 en adultos: control de glucosa',specialty:'Medicina interna',edition:'NICE NG28 · capítulo consultado, recomendaciones actualizadas hasta 2026',url:'https://www.nice.org.uk/guidance/ng28/chapter/Blood-glucose-management',topics:'diabetes tipo 2 control glucémico HbA1c monitorización hipoglucemia',format:'html'},
 {id:'nice-ng201-prenatal',title:'Atención prenatal',specialty:'Ginecología y obstetricia',edition:'NICE NG201 · publicada 2021, actualización 2025',url:'https://www.nice.org.uk/guidance/ng201/chapter/Recommendations',topics:'embarazo prenatal gestación prevención tamizaje',format:'html'},
 {id:'nice-cg84-gastroenteritis',title:'Gastroenteritis en menores de cinco años',specialty:'Pediatría',edition:'NICE CG84 · publicada 2009; comprobar vigencia antes de aprobar',url:'https://www.nice.org.uk/guidance/cg84/chapter/Recommendations',topics:'diarrea gastroenteritis deshidratación rehidratación niños lactante',format:'html'},
 {id:'wses-appendicitis-2020',title:'Diagnóstico y tratamiento de apendicitis aguda',specialty:'Cirugía general',edition:'WSES Jerusalem · edición 2020, no es la edición más reciente',url:'https://www.wses.org.uk/wp-content/uploads/2020/04/acute-appendicitis-update.pdf',topics:'apendicitis abdomen dolor abdominal diagnóstico tratamiento',format:'pdf'},
];
export const sourcePolicy='Biblioteca inicial de guías oficiales NICE y WSES, seleccionadas por sus recomendaciones explícitas y referencias recuperables. Son fuentes internacionales en inglés: las preguntas se redactan en español y requieren contrastar su vigencia y aplicabilidad al contexto mexicano. No cubren todo el ENARM ni se presentan como las ediciones más recientes. Para una GPC mexicana u otro tema, carga el PDF/TXT correspondiente. Las descargas automatizadas del IMSS no están disponibles actualmente. Cada resultado conserva los fragmentos, edición y fecha consultados; una cita literal no prueba por sí sola la pertinencia clínica.';
export const normalize=(text:string)=>text.normalize('NFKC').replace(/\s+/g,' ').trim();
const tokens=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9]{3,}/g)??[];
const stop=new Set(['con','para','del','las','los','una','que','por','sus','como','caso','clinico','evaluacion','inicial']);
// Bounded bilingual lexical retrieval. These terms rank evidence; they never establish clinical support.
const synonyms:Record<string,string[]>={diabetes:['diabetes'],glucosa:['glucose','hba1c'],glucemico:['glucose','hba1c'],control:['control','monitoring'],hipoglucemia:['hypoglycaemia'],embarazo:['pregnancy','pregnant','antenatal'],prenatal:['antenatal','pregnancy'],gestacion:['pregnancy'],tamizaje:['screening'],prevencion:['prevention'],diarrea:['diarrhoea','gastroenteritis'],gastroenteritis:['gastroenteritis'],deshidratacion:['dehydration'],rehidratacion:['rehydration'],ninos:['children','child'],lactante:['infant','children'],apendicitis:['appendicitis'],dolor:['pain'],diagnostico:['diagnosis','diagnostic'],tratamiento:['treatment','management'],estudios:['investigations','assessment']};
export function extractGuidelineHtml(html:string):SourcePage[]{
 const {document}=parseHTML(html);const chapter=document.querySelector('.chapter');
 if(!chapter)throw new UserFacingError('La fuente no contiene un capítulo clínico reconocible.',503,'SOURCE_FORMAT');
 for(const element of chapter.querySelectorAll('script,style'))element.remove();
 // Retain table rows and columns instead of concatenating values into an ambiguous sentence.
 for(const table of chapter.querySelectorAll('table')){
  const text=Array.from(table.querySelectorAll('tr')).map(row=>Array.from(row.querySelectorAll('th,td')).map(cell=>normalize(cell.textContent||'')).join(' | ')).join('\n');
  const replacement=document.createElement('p');replacement.textContent='Tabla (columnas separadas por |):\n'+text;table.replaceWith(replacement);
 }
 const sections=Array.from(chapter.querySelectorAll('.section')).filter(section=>!section.querySelector('.section'));
 const pages=sections.map((section,index)=>({page:index+1,locator:section.id,text:normalize(section.textContent||'')})).filter(page=>page.text.length>=80);
 if(!pages.length)throw new UserFacingError('No se pudo extraer contenido clínico de la fuente.',503,'SOURCE_FORMAT');
 return pages;
}
export function selectPages(pages:SourcePage[],query:string,maxChars=36000):SourcePage[] {
 const terms=[...new Set(tokens(query).flatMap(t=>[t,...(synonyms[t]||[])]).filter(t=>!stop.has(t)))];
 const ranked=pages.map(p=>{const t=tokens(p.text);return {p,score:terms.reduce((s,w)=>s+Math.min(t.filter(x=>x===w).length,8),0)};}).sort((a,b)=>b.score-a.score);
 const selected:SourcePage[]=[];let total=0;
 for(const {p,score} of ranked) {
  if(p.text.length<80 || (terms.length&&score===0))continue;
  const text=p.text.slice(0,Math.min(8000,maxChars-total));
  if(text.length<80)break;
  selected.push({...p,text});total+=text.length;
  if(total>=maxChars||selected.length>=12)break;
 }
 return selected.sort((a,b)=>a.page-b.page);
}
export async function fetchLibrary(db:pg.Pool,id:string):Promise<EvidenceSource> {
 const item=library.find(s=>s.id===id);if(!item)throw new UserFacingError('Fuente seleccionada no reconocida.');
 const cached=await db.query("SELECT evidence FROM enarm.source_cache WHERE id=$1 AND fetched_at>now()-interval '7 days'",[id]);
 if(cached.rows[0])return cached.rows[0].evidence;
 let bytes:Buffer;
 try {
  const response=await fetch(item.url,{signal:AbortSignal.timeout(25000),redirect:'error'});
  if(!response.ok||!response.body)throw new Error('unavailable');
  const chunks:Buffer[]=[];let size=0;
  for await (const chunk of response.body) {size+=chunk.length;if(size>20*1024*1024){await response.body.cancel().catch(()=>{});throw new Error('too large');}chunks.push(Buffer.from(chunk));}
  bytes=Buffer.concat(chunks);if(item.format==='pdf'&&bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('not pdf');
 } catch {throw new UserFacingError(`No se pudo recuperar «${item.title}». Reintenta o carga el documento como fuente propia.`,503,'SOURCE_DOWNLOAD');}
 const pages=item.format==='pdf'?await extractText(bytes,'application/pdf'):extractGuidelineHtml(bytes.toString('utf8'));
 const evidence:EvidenceSource={id,title:item.title,kind:'biblioteca',url:item.url,edition:item.edition,retrievedAt:new Date().toISOString(),sha256:createHash('sha256').update(bytes).digest('hex'),pages,warnings:['Fuente internacional: comprobar vigencia y aplicabilidad al contexto mexicano. Requiere revisión académica.']};
 await db.query('INSERT INTO enarm.source_cache(id,evidence) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET evidence=$2,fetched_at=now()',[id,evidence]);
 return evidence;
}
export async function collectEvidence(db:pg.Pool,store:ObjectStore,input:RunInput):Promise<EvidenceSource[]> {
 const sources:EvidenceSource[]=[];
 if(input.sourceMode!=='biblioteca') {
  const {rows:[doc]}=await db.query('SELECT * FROM enarm.documents WHERE id=$1',[input.documentId]);
  if(!doc)throw new UserFacingError('Documento no encontrado.');
  let pages=doc.pages as SourcePage[]|null;
  if(!pages) {
   const bytes=await store.get(doc.object_key);
   if(createHash('sha256').update(bytes).digest('hex')!==doc.sha256)throw new UserFacingError('El documento no superó la verificación de integridad.');
   pages=await extractText(bytes,doc.media_type);
   await db.query("UPDATE enarm.documents SET pages=$2,extraction_status='ready',extraction_error=NULL WHERE id=$1",[doc.id,JSON.stringify(pages)]);
  }
  sources.push({id:doc.id,title:doc.filename,kind:'documento',url:`/api/documents/${doc.id}/download`,edition:doc.media_type==='application/pdf'?'Documento propio · página del PDF':'Documento propio · sección de 4000 caracteres',retrievedAt:doc.created_at.toISOString(),sha256:doc.sha256,pages,warnings:['La calidad y vigencia del documento propio requieren revisión académica.']});
 }
 if(input.sourceMode!=='documento') {
  const ids=input.sourceIds.length?input.sourceIds:library.filter(s=>s.specialty===input.specialty).map(s=>s.id);
  if(!ids.length)throw new UserFacingError('No hay fuentes en la biblioteca para esta especialidad. Selecciona una fuente o carga un documento propio.');
  for(const id of ids)sources.push(await fetchLibrary(db,id));
 }
 const query=[input.topic,input.subtopic,input.instructions].join(' ');
 const budget=Math.floor(60000/Math.max(sources.length,1));
 const selected=sources.map(s=>({...s,pages:selectPages(s.pages,query,budget)}));
 if(selected.some(s=>!s.pages.length))throw new UserFacingError('No se encontraron fragmentos relacionados en todas las fuentes elegidas. Cambia el tema, las fuentes o carga un documento pertinente.');
 return selected;
}
