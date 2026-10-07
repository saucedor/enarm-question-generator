import { pool, queue, waitForSchema } from './db.js';
import { accessPassword } from './auth.js';
import { objectStore } from './storage.js';
import { createApp } from './app.js';
const db = pool();
await waitForSchema(db);
const boss = queue();
await boss.start();
const app = await createApp(db, boss, objectStore(), accessPassword(process.env));
await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) });
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, async () => {
  await app.close(); await boss.stop(); await db.end();
});
