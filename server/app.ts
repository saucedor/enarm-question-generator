import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import type pg from 'pg';
import type PgBoss from 'pg-boss';
import { ZodError } from 'zod';
import { authenticated } from './auth.js';
import { Id, RunInput } from './contracts.js';
import { Conflict, submitRun } from './runs.js';
import { MAX_FILE_BYTES } from './config.js';
import { questionRoutes } from './questions.js';
import { dashboardRoutes } from './dashboard.js';
import { extractText } from './extraction.js';
import { library, sourcePolicy } from './sources.js';
import { UserFacingError } from './errors.js';
import { difficulties } from '../shared/domain.js';
import type { ObjectStore } from './storage.js';
export async function createApp(db: pg.Pool, boss: PgBoss, store: ObjectStore, password: string | null, serveStatic = true) {
  const app = Fastify({ bodyLimit: 262144, logger: { redact: ['req.headers.authorization'] } });
  app.addHook('onRequest', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff').header('Referrer-Policy', 'same-origin').header('X-Frame-Options', 'SAMEORIGIN');
    if (request.url === '/health/ready') return;
    if (password !== null && !authenticated(request.headers.authorization, password)) {
      return reply.code(401).header('WWW-Authenticate', 'Basic realm="ENARM POC", charset="UTF-8"').send({ error: 'Acceso privado' });
    }
    if (!['GET','HEAD','OPTIONS'].includes(request.method) && request.headers['x-requested-with'] !== 'enarm') return reply.code(403).send({ error: 'Solicitud no autorizada' });
  });
  await app.register(rateLimit, { global: false });
  await app.register(multipart, { limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 0, parts: 1 } });
  app.get('/health/ready', async (_request, reply) => {
    try { await db.query('SELECT 1'); return { status: 'ok' }; }
    catch { return reply.code(503).send({ status: 'unavailable' }); }
  });
  app.get('/api/status', async () => {
    const heartbeat = await db.query("SELECT EXISTS(SELECT 1 FROM enarm.worker_heartbeat WHERE seen_at > now() - interval '35 seconds') AS active, EXISTS(SELECT 1 FROM enarm.worker_heartbeat WHERE seen_at > now() - interval '35 seconds' AND generation_ready) AS generation_ready");
    const bucket = await store.check().then(() => true, () => false);
    return { database: 'connected', worker: heartbeat.rows[0].active ? 'connected' : 'waiting', storage: bucket ? 'connected' : 'unavailable', generation: heartbeat.rows[0].generation_ready ? 'configured' : 'not_configured', mode: 'clinical' };
  });
  app.get('/api/config',async()=>({library,sourcePolicy,difficulties,limits:{fileMB:5,pdfPages:150,textCharacters:800000,questions:10,options:[3,4,5]},model:'Generación y revisión automáticas; modelos y consumo registrados en cada resultado. Pendiente de validación académica.'}));
  await questionRoutes(app,db,boss);
  dashboardRoutes(app,db);
  app.get('/api/runs', async () => (await db.query('SELECT * FROM enarm.runs ORDER BY created_at DESC LIMIT 25')).rows);
  app.get<{ Params: { id: string } }>('/api/runs/:id', async (req, reply) => {
    const { rows } = await db.query('SELECT * FROM enarm.runs WHERE id=$1', [Id.parse(req.params.id)]);
    return rows[0] ?? reply.code(404).send({ error: 'Solicitud no encontrada' });
  });
  app.post('/api/runs', { config: { rateLimit: { max: 3, timeWindow: '1 minute' } } }, async (req, reply) => {
    const input = RunInput.parse(req.body);
    const key = Id.parse(req.headers['idempotency-key']);
    const existing=await db.query('SELECT 1 FROM enarm.runs WHERE idempotency_key=$1',[key]);
    if(!existing.rowCount) {
      const ready=await db.query("SELECT 1 FROM enarm.worker_heartbeat WHERE generation_ready AND seen_at>now()-interval '35 seconds' LIMIT 1");
      if(!ready.rowCount)throw new UserFacingError('El servicio de generación no está disponible o no tiene una clave configurada.',503,'MODEL_NOT_CONFIGURED');
    }
    if(input.sourceIds.some(id=>!library.some(s=>s.id===id)))throw new UserFacingError('Fuente de biblioteca no reconocida.');
    if (input.documentId && !(await db.query('SELECT 1 FROM enarm.documents WHERE id=$1', [input.documentId])).rowCount) return reply.code(400).send({ error: 'Documento no encontrado' });
    return reply.code(202).send(await submitRun(db, boss, input, key));
  });
  app.get<{ Params: { id: string } }>('/api/runs/:id/export', async (req, reply) => {
    const { rows } = await db.query('SELECT * FROM enarm.runs WHERE id=$1', [Id.parse(req.params.id)]);
    if (!rows[0]) return reply.code(404).send({ error: 'Solicitud no encontrada' });
    return reply.header('Content-Disposition', `attachment; filename="enarm-${rows[0].id}.json"`).type('application/json').send(JSON.stringify({ formatVersion: 1, ...rows[0] }, null, 2));
  });
  app.get('/api/documents', async () => (await db.query('SELECT id,filename,media_type,byte_size,created_at,extraction_status,extraction_error FROM enarm.documents ORDER BY created_at DESC LIMIT 50')).rows);
  app.post('/api/documents', { config: { rateLimit: { max: 8, timeWindow: '1 minute' } } }, async (req, reply) => {
    const file = await req.file();
    if (!file) return reply.code(400).send({ error: 'Selecciona un archivo PDF o TXT.' });
    const bytes = await file.toBuffer();
    const isPdf = file.mimetype === 'application/pdf' && bytes.subarray(0,5).toString() === '%PDF-';
    const isText = file.mimetype === 'text/plain' && !bytes.includes(0);
    if (!bytes.length || (!isPdf && !isText)) return reply.code(400).send({ error: 'Archivo inválido. Admite PDF y TXT de hasta 5 MB.' });
    const id = randomUUID();
    const key = `documents/${id}`;
    const filename = file.filename.split(/[\\/]/).pop()!.slice(0,200);
    let pages=null;let extractionError=null;
    try { pages=await extractText(bytes,file.mimetype); } catch(error) {extractionError=error instanceof UserFacingError?error.message:'No se pudo extraer el texto.';}
    await store.put(key, bytes, file.mimetype);
    try {
      const { rows } = await db.query('INSERT INTO enarm.documents(id,filename,media_type,byte_size,sha256,object_key,pages,extraction_status,extraction_error) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,filename,media_type,byte_size,created_at,extraction_status,extraction_error', [id, filename, file.mimetype, bytes.length, createHash('sha256').update(bytes).digest('hex'), key,pages?JSON.stringify(pages):null,pages?'ready':'failed',extractionError]);
      return reply.code(201).send(rows[0]);
    } catch (error) { await store.remove(key).catch(() => undefined); throw error; }
  });
  app.get<{ Params: { id: string } }>('/api/documents/:id/download', async (req, reply) => {
    const { rows: [document] } = await db.query('SELECT * FROM enarm.documents WHERE id=$1', [Id.parse(req.params.id)]);
    if (!document) return reply.code(404).send({ error: 'Documento no encontrado' });
    const bytes = await store.get(document.object_key);
    return reply.type(document.media_type).header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(document.filename)}`).send(bytes);
  });
  app.setErrorHandler((error, req, reply) => {
    if (error instanceof ZodError) return reply.code(400).send({ error: 'Revisa los campos de la solicitud.', details: error.flatten() });
    if (error instanceof UserFacingError) return reply.code(error.statusCode).send({error:error.message,code:error.code});
    if (error instanceof Conflict) return reply.code(409).send({ error: error.message });
    const err = error as { code?: string; statusCode?: number; name?: string };
    req.log.error({ code: err.code, errorType: err.name }, 'request_failed');
    const status = err.statusCode && err.statusCode >= 400 && err.statusCode < 500 ? err.statusCode : 503;
    return reply.code(status).send({ error: status === 413 ? 'El archivo supera el límite de 5 MB.' : 'No se pudo completar la operación. Intenta de nuevo.' });
  });
  if (serveStatic) {
    await app.register(staticFiles, { root: resolve('dist/web'), prefix: '/', index: ['index.html'] });
  }
  return app;
}
