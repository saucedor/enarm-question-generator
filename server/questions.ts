import type { FastifyInstance } from 'fastify';
import type pg from 'pg';
import type PgBoss from 'pg-boss';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ClinicalCase, Id, RunInput, type QuestionSet } from '../shared/domain.js';
import { validateClinical } from './quality.js';
import { Conflict, submitRun } from './runs.js';
import { UserFacingError } from './errors.js';
const Edit=z.object({revision:z.number().int().positive(),title:z.string().trim().min(1).max(200),cases:z.array(ClinicalCase).min(1).max(10)}).strict();
export const publicPractice=(set:QuestionSet)=>({title:'Prueba de preguntas clínicas',cases:set.cases.map(c=>({id:c.id,narrative:c.narrative,questions:c.questions.map(q=>({id:q.id,stem:q.stem,options:q.options.map(o=>({text:o.text}))}))}))});
export async function questionRoutes(app:FastifyInstance,db:pg.Pool,boss:PgBoss) {
 async function load(id:string):Promise<QuestionSet> {const {rows:[set]}=await db.query('SELECT * FROM enarm.question_sets WHERE id=$1',[Id.parse(id)]);if(!set)throw new UserFacingError('Conjunto de preguntas no encontrado.',404);return set;}
 app.get('/api/sets',async req=>{
  const query=z.object({q:z.string().max(200).default(''),offset:z.coerce.number().int().min(0).max(1000000).default(0)}).parse(req.query);
  return (await db.query(`SELECT id,title,input,revision,review_status,created_at,updated_at,parent_id FROM enarm.question_sets WHERE strpos(lower(concat_ws(' ',title,input->>'specialty',input->>'topic',input->>'subtopic')),lower($1))>0 ORDER BY updated_at DESC,id LIMIT 50 OFFSET $2`,[query.q,query.offset])).rows;
 });
 app.get<{Params:{id:string}}>('/api/sets/:id',async req=>load(req.params.id));
 app.put<{Params:{id:string}}>('/api/sets/:id',async req=>{
  const edit=Edit.parse(req.body);const old=await load(req.params.id);
  const oldCaseIds=old.cases.map(c=>c.id).sort().join(',');const newCaseIds=edit.cases.map(c=>c.id).sort().join(',');
  if(oldCaseIds!==newCaseIds||old.cases.some(c=>c.questions.map(q=>q.id).sort().join(',')!==edit.cases.find(n=>n.id===c.id)?.questions.map(q=>q.id).sort().join(',')))throw new UserFacingError('La edición debe conservar los identificadores y la relación de las preguntas con su caso.');
  const issues=validateClinical({title:edit.title,cases:edit.cases,limitations:[],insufficientEvidence:false},old.sources,old.input);
  if(issues.some(i=>i.severity==='error'))throw new UserFacingError(issues.map(i=>i.message).join(' ').slice(0,1600));
  const metadata={...old.metadata,reviewedByModel:false,issues:[...issues,{code:'edited',severity:'warning',message:'Contenido editado. Las citas se localizan, pero las afirmaciones modificadas requieren nueva revisión académica.'}]};
  const {rows:[saved]}=await db.query("UPDATE enarm.question_sets SET title=$2,cases=$3,metadata=$4,revision=revision+1,review_status='draft',review_note='',updated_at=now() WHERE id=$1 AND revision=$5 RETURNING *",[old.id,edit.title,JSON.stringify(edit.cases),metadata,edit.revision]);
  if(!saved)throw new Conflict('Otra sesión modificó estas preguntas. Recarga antes de guardar para no sobrescribir cambios.');return saved;
 });
 app.post<{Params:{id:string}}>('/api/sets/:id/review',async req=>{
  const body=z.object({revision:z.number().int().positive(),note:z.string().trim().min(10).max(2000)}).strict().parse(req.body);
  const {rows:[saved]}=await db.query("UPDATE enarm.question_sets SET review_status='reviewed',review_note=$3,revision=revision+1,updated_at=now() WHERE id=$1 AND revision=$2 RETURNING *",[Id.parse(req.params.id),body.revision,body.note]);
  if(!saved)throw new Conflict('Las preguntas cambiaron. Recarga antes de registrar la revisión.');return saved;
 });
 app.post<{Params:{id:string}}>('/api/sets/:id/regenerate',{config:{rateLimit:{max:3,timeWindow:'1 minute'}}},async(req,reply)=>{
  const old=await load(req.params.id);const body=z.object({instructions:z.string().max(2000)}).strict().parse(req.body);
  const ready=await db.query("SELECT 1 FROM enarm.worker_heartbeat WHERE generation_ready AND seen_at>now()-interval '35 seconds' LIMIT 1");
  if(!ready.rowCount)throw new UserFacingError('El servicio de generación no está disponible o no tiene una clave configurada.',503);
  const input=RunInput.parse({...old.input,instructions:body.instructions});
  return reply.code(202).send(await submitRun(db,boss,input,Id.parse(req.headers['idempotency-key']),old.id));
 });
 app.get<{Params:{id:string}}>('/api/sets/:id/export',async(req,reply)=>{
  const set=await load(req.params.id);
  return reply.header('Content-Disposition',`attachment; filename="enarm-preguntas-${set.id}.json"`).type('application/json').send(JSON.stringify({formatVersion:2,exportedAt:new Date().toISOString(),...set},null,2));
 });
 app.post<{Params:{id:string}}>('/api/sets/:id/practice',async(req,reply)=>{
  const set=await load(req.params.id);const id=randomUUID();
  await db.query('INSERT INTO enarm.practice_attempts(id,set_id,revision,snapshot) VALUES($1,$2,$3,$4)',[id,set.id,set.revision,set]);
  return reply.code(201).send({id,setId:set.id,revision:set.revision,...publicPractice(set)});
 });
 app.get<{Params:{id:string}}>('/api/practice/:id',async req=>{
  const {rows:[attempt]}=await db.query('SELECT * FROM enarm.practice_attempts WHERE id=$1',[Id.parse(req.params.id)]);
  if(!attempt)throw new UserFacingError('Intento no encontrado.',404);
  return {id:attempt.id,setId:attempt.set_id,revision:attempt.revision,...publicPractice(attempt.snapshot),...(attempt.completed_at?{answers:attempt.answers,feedback:attempt.snapshot.cases,completedAt:attempt.completed_at,sources:attempt.snapshot.sources}:{})};
 });
 app.post<{Params:{id:string}}>('/api/practice/:id/submit',async req=>{
  const {answers}=z.object({answers:z.record(z.number().int().min(0).max(4))}).strict().parse(req.body);
  const {rows:[attempt]}=await db.query('SELECT * FROM enarm.practice_attempts WHERE id=$1',[Id.parse(req.params.id)]);
  if(!attempt)throw new UserFacingError('Intento no encontrado.',404);
  const snapshot=attempt.snapshot as QuestionSet;const questions=snapshot.cases.flatMap(c=>c.questions);
  if(Object.keys(answers).length!==questions.length||questions.some(q=>answers[q.id]===undefined||answers[q.id]>=q.options.length))throw new UserFacingError('Responde todas las preguntas antes de consultar las soluciones.');
  const {rowCount}=await db.query('UPDATE enarm.practice_attempts SET answers=$2,completed_at=now() WHERE id=$1 AND completed_at IS NULL',[attempt.id,answers]);
  if(!rowCount)throw new Conflict('Este intento ya fue enviado. Consulta sus resultados o inicia uno nuevo.');
  return {answers,feedback:snapshot.cases,sources:snapshot.sources,score:questions.filter(q=>answers[q.id]===q.correctIndex).length,total:questions.length};
 });
}
