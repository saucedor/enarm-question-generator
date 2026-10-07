// Regression against the actual v3 draft that mixed treatment phases.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import OpenAI from 'openai';
import {generateClinical,reviewClinical,PROMPT_VERSION} from '../server/generation.js';
import type {GeneratedContent,ModelUsage,QuestionSet} from '../shared/domain.js';
const path='artifacts/clinical-evaluation/library-series-v3.json';
const set=JSON.parse(await readFile(path,'utf8')) as QuestionSet;
const content:GeneratedContent={title:set.title,cases:set.cases,limitations:set.metadata.limitations,insufficientEvidence:false};
const client=new OpenAI({apiKey:process.env.OPENROUTER_API_KEY,baseURL:'https://openrouter.ai/api/v1',maxRetries:0,timeout:150000});
const usage:ModelUsage[]=[];
if(!process.argv.includes('--generation-only')){
const review=await reviewClinical(client,set.input,set.sources,content,usage);
await writeFile('artifacts/clinical-evaluation/review-regression.json',JSON.stringify({review,usage},null,2));
const problems=[...review.caseIssues,...review.questions.flatMap(q=>q.issues)];
assert.ok(problems.length,'The known defective draft must be rejected');
assert.match(problems.join(' '),/alimenta|sólid|manten|fase/i);
console.log(JSON.stringify({regressionRejected:true,problems,usage}));
}
const traces:unknown[]=[];
const generated=await generateClinical(set.input,set.sources,async event=>{traces.push(event);await writeFile(`artifacts/clinical-evaluation/series-attempts-${PROMPT_VERSION}.json`,JSON.stringify(traces,null,2));console.log(JSON.stringify({stage:event.stage,attempt:event.attempt,...(event.review?{issues:[...event.review.caseIssues,...event.review.questions.flatMap(q=>q.issues)]}:{})}));});
await writeFile(`artifacts/clinical-evaluation/series-${PROMPT_VERSION}.json`,JSON.stringify({input:set.input,sources:set.sources,...generated},null,2));
console.log(JSON.stringify({newSeriesPassed:true,usage:generated.usage}));
