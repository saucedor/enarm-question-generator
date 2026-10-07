import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { pool, queue, waitForSchema } from './db.js';
import { QUEUE } from './config.js';
import { processRun } from './runs.js';
import { UserFacingError } from './errors.js';
import { modelName,modelConfigured } from './generation.js';
import { objectStore } from './storage.js';
const db = pool();
await waitForSchema(db);
const boss = queue(undefined, false, true);
await boss.start();
const store = objectStore();
const workerId = randomUUID();
const beat = async () => {
  await db.query('INSERT INTO enarm.worker_heartbeat(id,generation_ready,model) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET seen_at=now(),generation_ready=$2,model=$3', [workerId,modelConfigured(),modelName()]);
  await db.query("UPDATE enarm.runs r SET status='failed', error='El trabajo agotó sus reintentos. Puedes crear una nueva solicitud.', updated_at=now() FROM pgboss.job j WHERE j.name=$1 AND j.data->>'runId'=r.id::text AND j.state='failed' AND r.status NOT IN ('completed','failed')", [QUEUE]);
};
await beat();
const timer = setInterval(() => void beat().catch(() => console.error(JSON.stringify({ event: 'heartbeat_failed' }))), 10000);
await boss.work<{ runId: string }>(QUEUE, { includeMetadata: true, batchSize: 1 }, async jobs => {
  for (const job of jobs) {
    try {
      await processRun(db, store, job.data.runId);
      console.log(JSON.stringify({ event: 'run_completed', runId: job.data.runId }));
    } catch (error) {
      const terminal = error instanceof UserFacingError || job.retryCount >= job.retryLimit;
      await db.query('UPDATE enarm.runs SET status=$2,error=$3,updated_at=now() WHERE id=$1', [job.data.runId, terminal ? 'failed' : 'retrying', error instanceof UserFacingError ? error.message : terminal ? 'No se pudo completar la generación después de los reintentos.' : 'Fallo temporal. El worker reintentará el trabajo.']);
      console.error(JSON.stringify({ event: 'run_failed', runId: job.data.runId, attempt: job.retryCount + 1 }));
      if(error instanceof UserFacingError)continue;
      // Avoid persisting SDK errors containing endpoint details into queue output.
      throw new Error('Pipeline execution failed');
    }
  }
});
const health = createServer(async (_req, res) => {
  try { await db.query('SELECT 1'); res.writeHead(200); res.end('ready'); }
  catch { res.writeHead(503); res.end('unavailable'); }
});
health.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
console.log(JSON.stringify({ event: 'worker_ready' }));
for (const signal of ['SIGTERM','SIGINT']) process.once(signal, async () => {
  clearInterval(timer); health.close(); await boss.stop({ graceful: true, timeout: 30000 });
  await db.query('DELETE FROM enarm.worker_heartbeat WHERE id=$1', [workerId]); await db.end();
});
