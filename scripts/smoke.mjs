// Public POC smoke. Uploads only clearly labelled nonclinical software fixtures.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir} from 'node:fs/promises';
const base=process.env.POC_BASE_URL;
if(!base)throw new Error('Set POC_BASE_URL explicitly to the ENARM POC');
const headers={'X-Requested-With':'enarm'};
if(process.env.POC_ACCESS_MODE!=='public')headers.Authorization='Basic '+Buffer.from(`enarm:${process.env.POC_PASSWORD||''}`).toString('base64');
const get=async path=>{const r=await fetch(base+path,{headers});assert.equal(r.status,200,path);return r.json()};
assert.equal((await get('/health/ready')).status,'ok');
const status=await get('/api/status');for(const key of ['database','worker','storage'])assert.equal(status[key],'connected');
const config=await get('/api/config');assert.equal(config.library.length,4);
const docs=[];
for(const [name,type,bytes] of [['software-smoke.txt','text/plain',Buffer.from('MATERIAL SINTÉTICO PARA PRUEBAS DE SOFTWARE. No contiene información médica. Este documento sirve únicamente para verificar almacenamiento, extracción y recuperación del sistema.')],['software-smoke.pdf','application/pdf',await readFile('test/fixtures/source.pdf')]]){
 const form=new FormData();form.append('file',new Blob([bytes],{type}),name);const response=await fetch(base+'/api/documents',{method:'POST',headers,body:form});assert.equal(response.status,201);const doc=await response.json();assert.equal(doc.extraction_status,'ready');const downloaded=Buffer.from(await(await fetch(base+`/api/documents/${doc.id}/download`,{headers})).arrayBuffer());assert.equal(createHash('sha256').update(downloaded).digest('hex'),createHash('sha256').update(bytes).digest('hex'));docs.push(doc.id);
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({extraHTTPHeaders:headers,viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.getByRole('heading',{name:'Generador de preguntas ENARM'}).waitFor();
 if(status.generation!=='configured')assert.equal(await page.getByRole('button',{name:'Generar preguntas',exact:true}).isDisabled(),true);
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));assert.equal(Math.round((await page.locator('aside').boundingBox()).y),0);
 await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/clinical-deployed-desktop.png',fullPage:true});
 for(const width of [768,390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.getByRole('link',{name:'Banco de preguntas',exact:true}).click();await page.getByRole('heading',{name:'Banco de preguntas'}).waitFor();await page.getByRole('link',{name:'Fuentes',exact:true}).click();await page.getByRole('heading',{name:'Fuentes de consulta'}).waitFor();
 await page.screenshot({path:'artifacts/clinical-deployed-mobile.png',fullPage:true});
 const stories=await get('/storybook/index.json');assert.equal(Object.values(stories.entries).filter(s=>s.type==='story'&&s.title.startsWith('shadcn/')).length,63);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,status,documents:docs,realModelEvaluation:status.generation==='configured'?'Requires separate clinical evaluation':'BLOCKED: configure own ENARM provider key'}));
}finally{await browser.close()}
