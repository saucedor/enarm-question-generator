// Explicit real-provider evaluation. Runs only after the deployed worker reports configured.
// Stores private local artifacts; never marks content academically reviewed.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const base=process.env.POC_BASE_URL;if(!base)throw new Error('Set POC_BASE_URL to the independent ENARM POC');
const headers={'X-Requested-With':'enarm'};
if(process.env.POC_ACCESS_MODE!=='public')headers.Authorization='Basic '+Buffer.from(`enarm:${process.env.POC_PASSWORD||''}`).toString('base64');
async function request(path,body,method='POST',extra={}){const response=await fetch(base+path,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw new Error(`${response.status} ${data.error}`);return data;}
const get=path=>request(path,undefined,'GET');
const status=await get('/api/status');assert.equal(status.generation,'configured','Configure own OPENROUTER_API_KEY or OPENAI_API_KEY on enarm-worker before evaluating. No synthetic fallback.');
await mkdir('artifacts/clinical-evaluation',{recursive:true});
async function upload(name,type,bytes){const body=new FormData();body.append('file',new Blob([bytes],{type}),name);const response=await fetch(base+'/api/documents',{method:'POST',headers,body});assert.equal(response.status,201);return response.json();}
// User-document path exercises an official public document, with original text and page provenance.
const pdf=await fetch('https://www.wses.org.uk/wp-content/uploads/2020/04/acute-appendicitis-update.pdf',{signal:AbortSignal.timeout(30000)});assert.equal(pdf.status,200);const pdfDoc=await upload('WSES-appendicitis-2020-evaluation.pdf','application/pdf',await pdf.arrayBuffer());assert.equal(pdfDoc.extraction_status,'ready');
const insufficient=await upload('nonclinical-software-fixture.pdf','application/pdf',await readFile('test/fixtures/source.pdf'));
const basic={specialty:'Medicina interna',topic:'Diabetes tipo 2: objetivos de HbA1c',subtopic:'',difficulty:'básica',count:1,instructions:'Cita la recomendación de NICE aplicable. Evita extrapolar a protocolos mexicanos.',questionType:'tratamiento',optionCount:4,format:'independientes',caseCount:1,questionsPerCase:2,sourceMode:'biblioteca',sourceIds:['nice-ng28-glucose']};
const scenarios=[
 {name:'library-independent',input:basic},
 {name:'library-series',input:{...basic,specialty:'Pediatría',topic:'Gastroenteritis y deshidratación en niños',difficulty:'intermedia',questionType:'mixto',format:'seriadas',count:2,sourceIds:['nice-cg84-gastroenteritis'],instructions:'Caso ficticio pediátrico. Una pregunta de valoración y otra de manejo; ninguna debe revelar la respuesta de la otra.'}},
 {name:'library-series-diabetes',input:{...basic,topic:'Diabetes tipo 2: objetivo de HbA1c y seguimiento estable',questionType:'mixto',format:'seriadas',count:2,instructions:'Un caso ficticio de adulto estable con metformina en monoterapia, sin hipoglucemias ni comorbilidades que requieran relajar el objetivo. No incluyas en la narrativa el valor ni el intervalo que se pregunta. Una pregunta sobre el objetivo de HbA1c y otra sobre el intervalo de seguimiento cuando el control está estable. Las preguntas deben poder resolverse desde el caso sin que una revele la clave de la otra. Usa sólo NICE y explicita su alcance internacional.'}},
 {name:'own-pdf',input:{...basic,specialty:'Cirugía general',topic:'Apendicitis: diagnóstico',questionType:'diagnóstico',sourceMode:'documento',sourceIds:[],documentId:pdfDoc.id,instructions:'Basarse en la edición WSES 2020 aportada y señalar su límite de vigencia.'}},
 {name:'mixed-sources',input:{...basic,specialty:'Cirugía general',topic:'Apendicitis: diagnóstico',questionType:'diagnóstico',sourceMode:'ambos',sourceIds:['wses-appendicitis-2020'],documentId:pdfDoc.id,instructions:'Identifica que el documento propio y la biblioteca son la misma edición; no los presentes como corroboración independiente.'}},
 {name:'insufficient-evidence',expectFailure:true,input:{...basic,sourceMode:'documento',sourceIds:[],documentId:insufficient.id}},
];
const report={startedAt:new Date().toISOString(),provider:'real configured worker',humanReview:false,scenarios:[]};
const selected=process.env.EVALUATION_SCENARIOS?.split(',');
for(const scenario of scenarios.filter(s=>!selected||selected.includes(s.name))){
 const started=Date.now();let run;
 try{
  run=await request('/api/runs',scenario.input,'POST',{'Idempotency-Key':randomUUID()});console.log(JSON.stringify({scenario:scenario.name,runId:run.id,status:'submitted'}));
  while(!['completed','failed'].includes(run.status)&&Date.now()-started<1260000){await new Promise(r=>setTimeout(r,3000));run=await get(`/api/runs/${run.id}`);}
  if(scenario.expectFailure){assert.equal(run.status,'failed');assert.match(run.error,/evidencia|fragmentos relacionados/i);report.scenarios.push({name:scenario.name,passed:true,runId:run.id,error:run.error});continue;}
  assert.equal(run.status,'completed',run.error||'Generation timed out');const set=await get(`/api/sets/${run.result.setId}`);assert.equal(set.cases.flatMap(c=>c.questions).length,scenario.input.count);assert.ok(set.metadata.usage.length>=2);
  await writeFile(`artifacts/clinical-evaluation/${scenario.name}.json`,JSON.stringify(set,null,2));
  const practice=await request(`/api/sets/${set.id}/practice`,{});assert.equal(JSON.stringify(practice).includes('correctIndex'),false);
  assert.equal(practice.title,'Prueba de preguntas clínicas');
  const answers=Object.fromEntries(set.cases.flatMap(c=>c.questions).map(q=>[q.id,q.correctIndex]));
  const graded=await request(`/api/practice/${practice.id}/submit`,{answers});assert.equal(graded.score,scenario.input.count);assert.equal(graded.total,scenario.input.count);
  const recovered=await get(`/api/practice/${practice.id}`);assert.deepEqual(recovered.answers,answers);assert.deepEqual(recovered.feedback,set.cases);
  const saved=await request(`/api/sets/${set.id}`,{revision:set.revision,title:set.title+' · evaluación de recuperación',cases:set.cases},'PUT');const exported=await get(`/api/sets/${set.id}/export`);assert.equal(exported.title,saved.title);assert.equal(exported.revision,saved.revision);assert.deepEqual(exported.cases,set.cases);
  report.scenarios.push({name:scenario.name,passed:true,runId:run.id,setId:set.id,durationMs:Date.now()-started,usage:set.metadata.usage,clinicalJudgment:'Pending independent content review; inspect artifact against source excerpts'});
 }catch(error){report.scenarios.push({name:scenario.name,passed:false,runId:run?.id,error:error.message});}
 await writeFile('artifacts/clinical-evaluation/report.json',JSON.stringify(report,null,2));
}
report.finishedAt=new Date().toISOString();await writeFile('artifacts/clinical-evaluation/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(report.scenarios.some(s=>!s.passed))process.exitCode=1;
