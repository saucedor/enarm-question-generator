// Real provider probe against an explicitly selected local test database; never writes question sets.
import {pool} from '../server/db.js';
import {fetchLibrary,selectPages} from '../server/sources.js';
import {generateClinical} from '../server/generation.js';
import {RunInput} from '../shared/domain.js';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.TEST_DATABASE_URL;
if(!url||new URL(url).hostname!=='127.0.0.1'||!new URL(url).pathname.endsWith('_test'))throw new Error('Local test database required');
const db=pool(url);
try{
 const source=await fetchLibrary(db,'nice-ng28-glucose');source.pages=selectPages(source.pages,'Diabetes control glucémico HbA1c');
 const input=RunInput.parse({specialty:'Medicina interna',topic:'Diabetes tipo 2: objetivos de HbA1c',difficulty:'básica',count:1,questionType:'tratamiento',instructions:'Cita la recomendación de NICE aplicable. Evita extrapolar a protocolos mexicanos.',...(process.env.PROBE_SERIES==='true'?{topic:'Diabetes tipo 2: objetivo de HbA1c y seguimiento estable',format:'seriadas',count:2,caseCount:1,questionsPerCase:2,questionType:'mixto',instructions:'Un caso ficticio adulto estable. Una pregunta sobre el objetivo de HbA1c y otra sobre el intervalo de seguimiento estable. No incluyas en la narrativa el valor o intervalo que se pregunta. Cada pregunta debe resolverse desde el caso sin que otra revele su clave. Usa sólo NICE y declara su alcance internacional.'}:{})});
 const result=await generateClinical(input,[source]);
 await mkdir('artifacts/clinical-evaluation',{recursive:true});await writeFile(`artifacts/clinical-evaluation/${process.env.PROBE_SERIES==='true'?'series-v5-probe':'provider-probe'}.json`,JSON.stringify({input,sources:[source],...result},null,2));
 console.log(JSON.stringify({success:true,usage:result.usage}));
}catch(error){const e=error as Error&{code?:string};console.log(JSON.stringify({success:false,code:e.code,message:e.message}));process.exitCode=1;}finally{await db.end()}
