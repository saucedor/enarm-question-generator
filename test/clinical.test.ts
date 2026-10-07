import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { RunInput, type EvidenceSource, type QuestionSet } from '../shared/domain.js';
import { validateClinical } from '../server/quality.js';
import { publicPractice } from '../server/questions.js';
import { extractText } from '../server/extraction.js';
import { selectPages, extractGuidelineHtml } from '../server/sources.js';
import { sourceText, fixtureGenerator } from './fixtures/clinical.js';
const input=RunInput.parse({specialty:'Pruebas',topic:'señal',difficulty:'básica',count:2,documentId:'00000000-0000-4000-8000-000000000001',sourceMode:'documento'});
const sources:EvidenceSource[]=[{id:input.documentId!,title:'Fixture',kind:'documento',url:'/fixture',edition:'prueba',retrievedAt:'2026-10-06',sha256:'test',pages:[{page:1,text:sourceText}],warnings:[]}];
test('contracts distinguish cases/questions, document mode and bounded options',()=>{
 assert.equal(RunInput.safeParse({...input,format:'seriadas',caseCount:2,questionsPerCase:2,count:3}).success,false);
 assert.equal(RunInput.safeParse({...input,optionCount:6}).success,false);
 assert.equal(RunInput.safeParse({...input,documentId:undefined}).success,false);
});
test('quality rejects fabricated citations, duplicate options and mismatched classification',async()=>{
 const {content}=await fixtureGenerator(input,sources);assert.deepEqual(validateClinical(content,sources,input),[]);
 content.cases[0].questions[0].citations[0].quote='Esta cita no existe en el documento original.';
 assert.ok(validateClinical(content,sources,input).some(i=>i.code==='unverified_citation'));
 content.cases[0].questions[0].options[1].text=content.cases[0].questions[0].options[0].text;
 content.cases[0].questions[0].difficulty='avanzada';
 const codes=validateClinical(content,sources,input).map(i=>i.code);assert.ok(codes.includes('duplicate_option'));assert.ok(codes.includes('classification'));
});
test('practice payload never includes keys, explanations, citations or source text',async()=>{
 const {content}=await fixtureGenerator(input,sources);
 content.title='La clave secreta es alfa';content.cases[0].title='El diagnóstico correcto está en el título';
 const payload=JSON.stringify(publicPractice({...content,sources} as QuestionSet));
 assert.equal(payload.includes(content.title),false);assert.equal(payload.includes(content.cases[0].title),false);
 for(const secret of ['correctIndex','explanation','citations','sourceText',content.cases[0].questions[0].explanation])assert.equal(payload.includes(secret),false);
});
test('extraction rejects insufficient or invalid UTF-8 and indexes TXT sections',async()=>{
 await assert.rejects(extractText(Buffer.from('vacío'),'text/plain'));
 await assert.rejects(extractText(Buffer.from([0xff,0xfe]),'text/plain'));
 const pages=await extractText(Buffer.from(sourceText.repeat(20)),'text/plain');assert.ok(pages.length>1);assert.equal(pages[1].page,2);
 assert.equal(selectPages(pages,'tema inexistente').length,0);
 assert.ok(selectPages(pages,'señal').length>0);
});
test('real PDF extraction preserves page numbers and refuses broken PDF',async()=>{
 const pages=await extractText(await readFile('test/fixtures/source.pdf'),'application/pdf');assert.equal(pages.length,2);assert.match(pages[0].text,/primera/);assert.match(pages[1].text,/segunda/);assert.equal(pages[1].page,2);
 await assert.rejects(extractText(Buffer.from('%PDF-invalid'),'application/pdf'));
});

test('official HTML extraction preserves section anchors and table columns, and excludes page chrome',()=>{
 const pages=extractGuidelineHtml('<nav>Ignore page chrome</nav><div class="chapter"><div class="section" id="recommendation-1"><h3>Dehydration assessment</h3><p>Consider this synthetic example only for testing the extraction of structured evidence.</p><table><tr><th>Finding</th><th>Present</th></tr><tr><td>Test signal</td><td>Yes</td></tr></table></div></div>');
 assert.equal(pages[0].locator,'recommendation-1');assert.match(pages[0].text,/Finding \| Present/);assert.match(pages[0].text,/Test signal \| Yes/);assert.equal(pages[0].text.includes('Ignore page chrome'),false);
 const selected=selectPages(pages,'deshidratación');assert.equal(selected[0].locator,'recommendation-1');
 assert.throws(()=>extractGuidelineHtml('<html>Access denied</html>'));
});
