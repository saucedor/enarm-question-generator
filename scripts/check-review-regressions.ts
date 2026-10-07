// Explicit paid checks of known false negatives. Keep defective examples as evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import OpenAI from 'openai';
import {reviewClinical,PROMPT_VERSION} from '../server/generation.js';
import type {ModelUsage} from '../shared/domain.js';
if(!process.env.OPENROUTER_API_KEY)throw new Error('Explicit provider key required');
const client=new OpenAI({apiKey:process.env.OPENROUTER_API_KEY,baseURL:'https://openrouter.ai/api/v1',maxRetries:0,timeout:150000});
const fixtures=[
 {name:'treatment-phases',file:'library-series-v3.json',pattern:/alimenta|sólid|manten|fase/i},
 {name:'overlapping-options',file:'series-enarm-evidence-v7.json',pattern:/solap|específic|verdader|ambigü|subtipo|dos opciones/i},
];
const selected=process.argv.slice(2);const results:unknown[]=[];
for(const fixture of fixtures.filter(f=>!selected.length||selected.includes(f.name))){
 const original=JSON.parse(await readFile(`artifacts/clinical-evaluation/${fixture.file}`,'utf8'));
 const content=original.content??{title:original.title,cases:original.cases,limitations:original.metadata.limitations,insufficientEvidence:false};
 const usage:ModelUsage[]=[];
 const review=await reviewClinical(client,original.input,original.sources,content,usage);
 const problems=[...review.caseIssues,...review.questions.flatMap(q=>q.issues)];
 const detected=fixture.pattern.test(problems.join(' '));
 results.push({name:fixture.name,detected,review,usage});
 await writeFile(`artifacts/clinical-evaluation/regressions-${PROMPT_VERSION}.json`,JSON.stringify(results,null,2));
 console.log(JSON.stringify({name:fixture.name,detected,problems,usage}));assert.equal(detected,true,'Known defect must appear in blocking issues, not just warnings');
}
