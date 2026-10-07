// Paid, explicit evaluation of a wider request set. Never invoked by CI.
import {mkdir,writeFile} from 'node:fs/promises';
import {pool} from '../server/db.js';
import {fetchLibrary,selectPages} from '../server/sources.js';
import {generateClinical,PROMPT_VERSION,type GenerationObserver} from '../server/generation.js';
import {RunInput} from '../shared/domain.js';
const url=process.env.TEST_DATABASE_URL;
if(!url||new URL(url).hostname!=='127.0.0.1'||!new URL(url).pathname.endsWith('_test'))throw new Error('Explicit local test database required');
if(!process.env.OPENROUTER_API_KEY)throw new Error('Explicit provider key required');
const cases=[
 {name:'advanced-appendicitis',input:RunInput.parse({specialty:'Cirugía general',topic:'Apendicitis: dolor persistente y estudios negativos',subtopic:'Decisión después de imagen transversal negativa y observación',difficulty:'avanzada',count:1,questionType:'tratamiento',optionCount:5,sourceIds:['wses-appendicitis-2020'],instructions:'Adulto ficticio con dolor persistente en fosa iliaca derecha a pesar de observación y estudios iniciales normales, incluida imagen transversal negativa. Integra evolución temporal y resultados discordantes para elegir la conducta según WSES 2020. No declares la conducta correcta en el caso. Señala la antigüedad de la fuente.'})},
 {name:'prenatal-personalization',input:RunInput.parse({specialty:'Ginecología y obstetricia',topic:'Control prenatal',subtopic:'Programación de consultas en gestaciones sin complicaciones',difficulty:'básica',count:2,questionType:'prevención',optionCount:3,sourceIds:['nice-ng201-prenatal'],instructions:'Dos casos ficticios independientes de adultas con gestación sin complicaciones: uno nulípara y otro multípara con dos partos previos. Evaluar la programación de consultas NICE según esos perfiles; no revelar la cantidad correcta en los casos. Explicita que se usa una guía británica, no un protocolo mexicano.'})},
];
const requested=process.argv.slice(2);const selected=cases.filter(c=>!requested.length||requested.includes(c.name));
if(!selected.length)throw new Error('No matching evaluation scenario');
const directory=`artifacts/clinical-evaluation/capabilities-${PROMPT_VERSION}-${Date.now()}`;
await mkdir(directory,{recursive:true});const db=pool(url);const report:{name:string;passed:boolean;durationMs:number;error?:string;usage?:unknown}[]=[];
try{
 for(const scenario of selected){
  const started=Date.now();console.log(JSON.stringify({scenario:scenario.name,status:'started',directory}));
  const trace:Parameters<GenerationObserver>[0][]=[];
  try{
   const sources=await Promise.all(scenario.input.sourceIds.map(id=>fetchLibrary(db,id)));
   for(const source of sources)source.pages=selectPages(source.pages,[scenario.input.topic,scenario.input.subtopic,scenario.input.instructions].join(' '),Math.floor(60000/sources.length));
   await writeFile(`${directory}/${scenario.name}-request.json`,JSON.stringify({input:scenario.input,sources},null,2));
   const result=await generateClinical(scenario.input,sources,async event=>{trace.push(event);await writeFile(`${directory}/${scenario.name}-attempts.json`,JSON.stringify(trace,null,2));console.log(JSON.stringify({scenario:scenario.name,stage:event.stage,attempt:event.attempt,...(event.review?{problems:[...event.review.caseIssues,...event.review.questions.flatMap(q=>q.issues)]}:{})}));});
   await writeFile(`${directory}/${scenario.name}.json`,JSON.stringify({input:scenario.input,sources,...result},null,2));
   report.push({name:scenario.name,passed:true,durationMs:Date.now()-started,usage:result.usage});
  }catch(error){report.push({name:scenario.name,passed:false,durationMs:Date.now()-started,error:(error as Error).message});}
  await writeFile(`${directory}/report.json`,JSON.stringify({humanReview:false,scenarios:report},null,2));console.log(JSON.stringify(report.at(-1)));
 }
 if(report.some(r=>!r.passed))process.exitCode=1;
}finally{await db.end()}
