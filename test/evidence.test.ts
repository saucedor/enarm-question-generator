import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evidencePassages} from '../server/evidence.js';
import type {EvidenceSource} from '../shared/domain.js';
test('evidence IDs resolve to exact bounded excerpts with original source and page',()=>{
 const text='Una recomendación con contexto y detalles. '.repeat(60)+'Final de la recomendación.';
 const sources:EvidenceSource[]=['a','b'].map(id=>({id,title:id,kind:'biblioteca',url:'',edition:'test',retrievedAt:'',sha256:'',warnings:[],pages:[{page:7,text},{page:12,text:'x'.repeat(1130)}]}));
 const passages=evidencePassages(sources);
 assert.equal(new Set(passages.map(p=>p.id)).size,passages.length);
 for(const p of passages){assert.ok(p.quote.length>=15&&p.quote.length<=600);assert.ok(sources.find(s=>s.id===p.sourceId)!.pages.find(page=>page.page===p.page)!.text.includes(p.quote));}
 assert.ok(passages.some(p=>p.quote.endsWith('Final de la recomendación.')));
 assert.ok(passages.some(p=>p.sourceId==='b'&&p.page===12));
 assert.deepEqual(evidencePassages([]),[]);
});
