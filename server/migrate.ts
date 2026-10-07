import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { pool, queue } from './db.js';
import { QUEUE, required } from './config.js';
export async function migrate(url: string) {
  const db = pool(url);
  const connection = await db.connect();
  const boss = queue(url, true);
  try {
    await connection.query('SELECT pg_advisory_lock(73006101)');
    await connection.query('CREATE SCHEMA IF NOT EXISTS enarm');
    await connection.query('CREATE TABLE IF NOT EXISTS enarm.migrations(version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const versions = (await readdir(resolve('migrations'))).filter(f => /^\d+.*\.sql$/.test(f)).sort();
    for (const version of versions) {
      const sql = await readFile(resolve('migrations', version), 'utf8');
      const hash = createHash('sha256').update(sql).digest('hex');
      const prior = await connection.query('SELECT checksum FROM enarm.migrations WHERE version=$1', [version]);
      if (prior.rowCount && prior.rows[0].checksum !== hash) throw new Error('Applied migration checksum mismatch');
      if (!prior.rowCount) {
        await connection.query('BEGIN');
        try { await connection.query(sql); await connection.query('INSERT INTO enarm.migrations(version,checksum) VALUES($1,$2)', [version,hash]); await connection.query('COMMIT'); }
        catch(error) { await connection.query('ROLLBACK'); throw error; }
      }
    }
    await boss.start();
    await boss.createQueue(QUEUE, { name: QUEUE, retryLimit: 2, retryDelay: 2, retryBackoff: true, expireInSeconds: 1200 });
    await boss.updateQueue(QUEUE, { name: QUEUE, retryLimit: 1, retryDelay: 10, retryBackoff: true, expireInSeconds: 1200 });
    // Roles are provisioned separately. No application role is a superuser.
    for (const role of ['enarm_app', 'enarm_worker']) {
      const password = process.env[role === 'enarm_app' ? 'APP_DB_PASSWORD' : 'WORKER_DB_PASSWORD'];
      if (password) {
        const exists = await connection.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [role]);
        const statement = await connection.query('SELECT format($1::text,$2::text,$3::text) AS sql', [exists.rowCount ? 'ALTER ROLE %I LOGIN PASSWORD %L' : 'CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT', role, password]);
        await connection.query(statement.rows[0].sql);
      }
      const exists = await connection.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [role]);
      if (exists.rowCount) {
        await connection.query(`GRANT USAGE ON SCHEMA enarm, pgboss TO ${role}`);
        await connection.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA enarm, pgboss TO ${role}`);
        await connection.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA enarm, pgboss TO ${role}`);
      }
    }
    console.log(JSON.stringify({ event: 'migrations_ready', versions }));
  } finally {
    await boss.stop();
    await connection.query('SELECT pg_advisory_unlock(73006101)');
    connection.release(); await db.end();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await migrate(required('DATABASE_ADMIN_URL'));
}
