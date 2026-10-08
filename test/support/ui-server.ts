// Local-only browser harness. Synthetic generator and local bucket; never used by deployed entrypoints.
import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {migrate} from '../../server/migrate.js';
import {pool,queue} from '../../server/db.js';
import {createApp} from '../../server/app.js';
import {processRun} from '../../server/runs.js';
import {QUEUE} from '../../server/config.js';
import {fixtureGenerator} from '../fixtures/clinical.js';
const url=process.env.TEST_DATABASE_URL;
if(!url||new URL(url).hostname!=='127.0.0.1'||!new URL(url).pathname.endsWith('_ui_test'))throw new Error('Dedicated local _ui_test database required');
process.env.APP_DB_PASSWORD='local-test-only';process.env.WORKER_DB_PASSWORD='local-test-only';
await migrate(url);
const db=pool(url);const boss=queue(url,false,true);await boss.start();
const bucket=resolve('artifacts/ui-bucket');await mkdir(bucket,{recursive:true});
const store={async put(k:string,b:Buffer){await writeFile(resolve(bucket,basename(k)),b)},async get(k:string){return readFile(resolve(bucket,basename(k)))},async remove(k:string){await rm(resolve(bucket,basename(k)),{force:true})},async check(){}};
if(process.env.PRESERVE_UI_TEST_DATA!=='1'){
 await db.query('DELETE FROM enarm.practice_attempts');await db.query('UPDATE enarm.runs SET parent_set_id=NULL');await db.query('DELETE FROM enarm.question_sets');await db.query('DELETE FROM enarm.runs');await db.query('DELETE FROM enarm.documents');await db.query('DELETE FROM pgboss.job');
}
const beat=()=>db.query("INSERT INTO enarm.worker_heartbeat(id,generation_ready,model) VALUES('local-browser-harness',true,'synthetic-test') ON CONFLICT(id) DO UPDATE SET seen_at=now()");
await beat();const timer=setInterval(()=>void beat(),5000);
await boss.work<{runId:string}>(QUEUE,async jobs=>{for(const job of jobs)await processRun(db,store,job.data.runId,fixtureGenerator)});
const app=await createApp(db,boss,store,null,false);await app.listen({host:'127.0.0.1',port:3000});
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,async()=>{clearInterval(timer);await app.close();await boss.stop();await db.end()});
