import type { EvidenceSource, GeneratedContent, QualityIssue, RunInput } from '../shared/domain.js';
import { normalize } from './sources.js';
export function validateClinical(content:GeneratedContent,sources:EvidenceSource[],input:RunInput):QualityIssue[] {
 const issues:QualityIssue[]=[];
 const add=(code:string,message:string,questionId?:string)=>issues.push({code,severity:'error',message,...(questionId?{questionId}:{})});
 const questions=content.cases.flatMap(c=>c.questions);
 const expectedCases=input.format==='seriadas'?input.caseCount:input.count;
 if(content.cases.length!==expectedCases||questions.length!==input.count)add('counts','La cantidad de casos o preguntas no coincide con la solicitud.');
 const ids=new Set<string>();const stems=new Set<string>();
 for(const c of content.cases) {
  if(ids.has(c.id))add('duplicate_id','Identificador de caso repetido.');ids.add(c.id);
  if(c.questions.length!==(input.format==='seriadas'?input.questionsPerCase:1))add('series_count','La serie no tiene la cantidad de preguntas solicitadas.');
  for(const q of c.questions) {
   if(ids.has(q.id))add('duplicate_id','Identificador de pregunta repetido.',q.id);ids.add(q.id);
   if(stems.has(normalize(q.stem).toLowerCase()))add('duplicate_question','Enunciado duplicado.',q.id);stems.add(normalize(q.stem).toLowerCase());
   if(q.options.length!==input.optionCount||q.correctIndex>=q.options.length)add('options','Cantidad de opciones o respuesta correcta inválida.',q.id);
   if(new Set(q.options.map(o=>normalize(o.text).toLowerCase())).size!==q.options.length)add('duplicate_option','Hay opciones duplicadas.',q.id);
   if(q.specialty!==input.specialty||q.topic!==input.topic||q.subtopic!==input.subtopic||q.difficulty!==input.difficulty)add('classification','Clasificación diferente a la solicitada.',q.id);
   for(const cite of q.citations) {
    const source=sources.find(s=>s.id===cite.sourceId);const page=source?.pages.find(p=>p.page===cite.page);
    if(!page||!normalize(page.text).includes(normalize(cite.quote)))add('unverified_citation','La cita no se localiza literalmente en la página/sección indicada.',q.id);
   }
  }
 }
 const cited=new Set(questions.flatMap(q=>q.citations.map(c=>c.sourceId)));
 if(input.sourceMode!=='biblioteca'&&!sources.some(s=>s.kind==='documento'&&cited.has(s.id)))add('document_unused','Las preguntas no usan el documento cargado.');
 if(input.sourceMode==='ambos'&&!sources.some(s=>s.kind==='biblioteca'&&cited.has(s.id)))add('library_unused','Las preguntas no usan la biblioteca seleccionada.');
 return issues;
}
