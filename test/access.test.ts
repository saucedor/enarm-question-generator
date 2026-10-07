import { test } from 'node:test';
import assert from 'node:assert/strict';
import type pg from 'pg';
import type PgBoss from 'pg-boss';
import { accessPassword } from '../server/auth.js';
import { createApp } from '../server/app.js';
import type { ObjectStore } from '../server/storage.js';
test('public mode is explicit and does not require a password', () => {
  assert.equal(accessPassword({ POC_ACCESS_MODE: 'public' }), null);
  assert.throws(() => accessPassword({}));
  assert.throws(() => accessPassword({ POC_ACCESS_MODE: 'invalid', POC_PASSWORD: 'test' }));
  assert.equal(accessPassword({ POC_PASSWORD: 'test' }), 'test');
});
test('public API has no browser authentication challenge; write protection remains', async () => {
  const db = { query: async () => ({ rows: [] }) } as unknown as pg.Pool;
  const app = await createApp(db, {} as PgBoss, {} as ObjectStore, null, false);
  try {
    const response = await app.inject('/api/runs');
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['www-authenticate'], undefined);
    assert.deepEqual(response.json(), []);
    const write = await app.inject({ method: 'POST', url: '/api/runs', payload: {} });
    assert.equal(write.statusCode, 403);
    assert.equal(write.headers['www-authenticate'], undefined);
  } finally { await app.close(); }
});
