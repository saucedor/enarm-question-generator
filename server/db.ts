import pg from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import PgBoss from 'pg-boss';
import { setTimeout } from 'node:timers/promises';
import { required } from './config.js';
export function pool(url = required('DATABASE_URL')) {
  return new pg.Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 5000, statement_timeout: 10000 });
}
export function queue(url = required('DATABASE_URL'), migrate = false, supervise = false) {
  const boss = new PgBoss({ connectionString: url, max: 3, migrate, supervise, schedule: false, pollingIntervalSeconds: 1 });
  boss.on('error', error => console.error(JSON.stringify({ event: 'queue_error', code: (error as NodeJS.ErrnoException).code ?? error.name })));
  return boss;
}
export async function waitForSchema(db: pg.Pool) {
  const files = (await readdir(resolve('migrations'))).filter(f=>/^\d+.*\.sql$/.test(f)).sort();
  const expected = await Promise.all(files.map(async version=>({version, checksum:createHash('sha256').update(await readFile(resolve('migrations',version))).digest('hex')})));
  for (let i = 0; i < 60; i++) {
    try {
      const result = await db.query('SELECT version,checksum FROM enarm.migrations');
      if (expected.every(e=>result.rows.some(r=>r.version===e.version&&r.checksum===e.checksum))) return;
    } catch { /* deployment may start before migrator */ }
    await setTimeout(2000);
  }
  throw new Error('Required database migration is not ready');
}
