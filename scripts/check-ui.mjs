import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:5175';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ channel:'chrome', headless:true });
const errors=[];
try {
 const page = await browser.newPage({viewport:{width:1440,height:1100}});
 page.on('pageerror',e=>errors.push({url:page.url(),message:e.message}));
 const index=await(await fetch(`${base}/storybook/index.json`)).json();
 const entries=Object.values(index.entries).filter(e=>e.type==='story');
 assert.equal(entries.filter(e=>e.title.startsWith('shadcn/')).length,63);
 const rendered=[];const overflows=[];
 for(const entry of entries) {
  await page.setViewportSize({width:1100,height:800});
  await page.goto(`${base}/storybook/iframe.html?id=${entry.id}&viewMode=story`);
  await page.waitForSelector('#storybook-root > div',{timeout:15000});
  await page.waitForFunction(()=>!document.body.classList.contains('sb-show-errordisplay'));
  rendered.push(entry.id);
  await page.setViewportSize({width:390,height:844});
  try { await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth, { }, {timeout:2000}); } catch { overflows.push(entry.id); }
 }
 await page.goto(`${base}/storybook/iframe.html?id=shadcn-dialog--default&viewMode=story`);
 await page.getByRole('button',{name:'Open Dialog'}).click();
 await page.getByRole('dialog').waitFor();
 await page.keyboard.press('Escape');
 await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.goto(`${base}/storybook/iframe.html?id=shadcn-combobox--default&viewMode=story`);
 await page.getByRole('combobox').fill('Pedia');
 await page.getByRole('option',{name:'Pediatría'}).click();
 assert.equal(await page.getByRole('combobox').inputValue(),'Pediatría');
 await page.goto(`${base}/storybook/iframe.html?id=shadcn-form--default&viewMode=story`);
 await page.getByRole('button',{name:'Guardar tema'}).click();
 await page.getByText('Escribe un tema.').waitFor();
 await page.goto(`${base}/storybook/iframe.html?id=shadcn-questionnaire--default&viewMode=story`);
 await page.getByRole('radio',{name:'Pediatría'}).check();
 await page.getByRole('button',{name:'Siguiente'}).click();
 await page.getByText('¿Qué dificultad prefieres?').waitFor();
 await page.getByRole('radio',{name:'Básica'}).check();
 await page.getByRole('button',{name:'Guardar',exact:true}).click();
 await page.getByText('Preferencias guardadas en esta demostración.').waitFor();
 await page.goto(`${base}/storybook/iframe.html?id=enarm-tema-y-botones--referencia&viewMode=story`);
 await page.getByText('ENARM · Sistema visual').waitFor();
 await page.screenshot({path:'artifacts/storybook-theme.png',fullPage:true});
 await page.goto(`${base}/storybook/iframe.html?id=enarm-tema-y-botones--referencia&viewMode=story&globals=theme:dark`);
 await page.waitForFunction(()=>document.documentElement.classList.contains('dark'));
 await page.screenshot({path:'artifacts/storybook-dark.png',fullPage:true});
 await writeFile('artifacts/ui-validation.json',JSON.stringify({rendered:rendered.length,errors,overflows},null,2));
 console.log(JSON.stringify({rendered:rendered.length,errors,overflows}));
 assert.deepEqual(errors,[]);
 assert.deepEqual(overflows,[]);
} finally {await browser.close();}
