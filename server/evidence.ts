import type { EvidenceSource } from '../shared/domain.js';

export type EvidencePassage = {id:string;sourceId:string;page:number;quote:string};
// The model selects IDs. Provenance and literal excerpts are supplied by the server,
// never transcribed or reconstructed by the model. Adjacent excerpts overlap so a
// recommendation spanning a boundary remains available in context.
export function evidencePassages(sources:EvidenceSource[]):EvidencePassage[]{
 const passages:EvidencePassage[]=[];
 for(const source of sources)for(const page of source.pages){
  let start=0;
  while(start<page.text.length){
   let end=Math.min(start+560,page.text.length);
   if(end<page.text.length){
    const boundary=page.text.lastIndexOf(' ',end);
    if(boundary>start+300)end=boundary;
   }
   const quote=page.text.slice(start,end).trim();
   if(quote.length>=15)passages.push({id:`E${String(passages.length+1).padStart(4,'0')}`,sourceId:source.id,page:page.page,quote});
   if(end===page.text.length)break;
   const overlap=page.text.indexOf(' ',Math.max(start+1,end-100));
   start=overlap>=0&&overlap<end?overlap+1:end;
  }
 }
 return passages;
}
