import {z} from 'zod';
import {RunInput} from '../../shared/domain';
// Editing is allowed to be incomplete; the strict contract still gates submission.
const Draft=RunInput.innerType().extend({topic:z.string().max(200),count:z.number().finite(),caseCount:z.number().finite(),questionsPerCase:z.number().finite()});
export function readGenerationDraft(raw:string|null,fallback:RunInput):RunInput {
 try {const draft=Draft.safeParse(JSON.parse(raw||'null'));return draft.success?draft.data:fallback;} catch{return fallback;}
}
export function generationIssue(form:RunInput):{field:string;message:string}|null {
 if(!form.topic.trim())return {field:'topic',message:'Escribe el tema que quieres evaluar.'};
 const total=form.format==='seriadas'?form.caseCount*form.questionsPerCase:form.count;
 if(form.format==='seriadas'&&(!Number.isInteger(form.caseCount)||form.caseCount<1||form.caseCount>5))return {field:'caseCount',message:'Selecciona entre 1 y 5 casos, sin decimales.'};
 if(form.format==='seriadas'&&(!Number.isInteger(form.questionsPerCase)||form.questionsPerCase<2||form.questionsPerCase>5))return {field:'questionsPerCase',message:'Selecciona entre 2 y 5 preguntas por caso, sin decimales.'};
 if(!Number.isInteger(total)||total<1||total>10)return {field:form.format==='seriadas'?'caseCount':'count',message:'La solicitud debe contener entre 1 y 10 preguntas en total, sin decimales.'};
 if(form.sourceMode!=='biblioteca'&&!form.documentId)return {field:'document',message:'Selecciona o carga un documento para este origen de información.'};
 return null;
}
