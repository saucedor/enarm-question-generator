import { parentPort, workerData } from 'node:worker_threads';
import { PDFParse } from 'pdf-parse';
const parser = new PDFParse({data:new Uint8Array(workerData),isEvalSupported:false});
try {
 const info=await parser.getInfo();
 if(info.total>150)throw new Error('El PDF supera las 150 páginas admitidas.');
 const result=await parser.getText();
 const pages=result.pages.map(p=>({page:p.num,text:p.text.replace(/\u0000/g,'').trim()}));
 if(pages.reduce((n,p)=>n+p.text.length,0)>800000)throw new Error('El texto supera los 800 000 caracteres admitidos.');
 if(pages.every(p=>p.text.length<40))throw new Error('El PDF no contiene texto suficiente. Usa un PDF con texto seleccionable o TXT; no se admite OCR.');
 parentPort?.postMessage({pages});
} catch(error) {parentPort?.postMessage({error:error instanceof Error?error.message:'No se pudo leer el PDF.'});}
finally {await parser.destroy();}
