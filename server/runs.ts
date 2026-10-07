import type pg from 'pg';
import type PgBoss from 'pg-boss';
import { randomUUID, createHash } from 'node:crypto';
import { QUEUE } from './config.js';
import { RunInput } from './contracts.js';
import { collectEvidence } from './sources.js';
import { generateClinical, PROMPT_VERSION, type Generator } from './generation.js';
import { UserFacingError } from './errors.js';
import type { ObjectStore } from './storage.js';
export class Conflict extends Error {}
export async function submitRun(db: pg.Pool, boss: PgBoss, input: RunInput, key: string, parentId: string | null = null) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(73006102)');
    const existing=await client.query('SELECT *, input=$2::jsonb AND parent_set_id IS NOT DISTINCT FROM $3::uuid AS matches FROM enarm.runs WHERE idempotency_key=$1',[key,JSON.stringify(input),parentId]);
    if(existing.rows[0]) {if(!existing.rows[0].matches)throw new Conflict('La clave de reintento ya pertenece a otra solicitud.');await client.query('COMMIT');return existing.rows[0];}
    const limits=await client.query("SELECT count(*) FILTER(WHERE created_at>now()-interval '24 hours')::int AS daily,count(*) FILTER(WHERE status IN ('queued','processing','retrying'))::int AS pending FROM enarm.runs");
    if(limits.rows[0].daily>=Number(process.env.GENERATION_DAILY_LIMIT||30))throw new UserFacingError('Se alcanzó el límite diario compartido de generación. Intenta mañana.',429,'DAILY_LIMIT');
    if(limits.rows[0].pending>=3)throw new UserFacingError('Hay tres solicitudes en curso. Espera a que terminen antes de enviar otra.',429,'QUEUE_FULL');
    const id = randomUUID();
    const inserted = await client.query('INSERT INTO enarm.runs(id,idempotency_key,input,document_id,parent_set_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(idempotency_key) DO NOTHING RETURNING *', [id, key, input, input.documentId ?? null,parentId]);
    if (!inserted.rowCount) {
      const prior = await client.query('SELECT *, input = $2::jsonb AS matches FROM enarm.runs WHERE idempotency_key=$1', [key, JSON.stringify(input)]);
      if (!prior.rows[0].matches) throw new Conflict('La clave de reintento ya pertenece a otra solicitud.');
      await client.query('COMMIT'); return prior.rows[0];
    }
    const job = await boss.send(QUEUE, { runId: id }, { db: { executeSql: (sql, values) => client.query(sql, values) } });
    if (!job) throw new Error('Queue did not acknowledge the job');
    await client.query('COMMIT'); return inserted.rows[0];
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export async function processRun(db: pg.Pool, store: ObjectStore, runId: string, generate:Generator=generateClinical) {
  const updated=await db.query("UPDATE enarm.runs SET status='processing', attempts=attempts+1,error=null,updated_at=now() WHERE id=$1 AND status<>'completed' RETURNING *",[runId]);
  if(!updated.rows[0])return;
  const run=updated.rows[0];const input=RunInput.parse(run.input);
  const sources=await collectEvidence(db,store,input);
  const generated=await generate(input,sources);
  const metadata={issues:generated.issues,limitations:generated.content.limitations,usage:generated.usage,promptVersion:PROMPT_VERSION,reviewedByModel:true};
  const connection=await db.connect();
  try {
    await connection.query('BEGIN');
    await connection.query('INSERT INTO enarm.question_sets(id,title,input,cases,sources,metadata,parent_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING',[runId,generated.content.title,input,JSON.stringify(generated.content.cases),JSON.stringify(sources),metadata,run.parent_set_id]);
    await connection.query("UPDATE enarm.runs SET status='completed',result=$2,error=null,updated_at=now() WHERE id=$1",[runId,{mode:'clinical',clinicalGeneration:true,setId:runId,questionCount:input.count,caseCount:generated.content.cases.length,message:'Preguntas generadas y guardadas. Revisa su sustento antes de utilizarlas.'}]);
    await connection.query('COMMIT');
  } catch(error) {await connection.query('ROLLBACK');throw error;} finally {connection.release();}
}
