import { z } from 'zod';
export const Difficulty = z.enum(['básica','intermedia','avanzada']);
export const difficulties = {
  básica: 'Reconocer un patrón clínico típico y aplicar un concepto o criterio directo.',
  intermedia: 'Integrar dos o más datos de antecedentes, exploración o estudios para discriminar alternativas plausibles.',
  avanzada: 'Resolver una decisión multietapa con comorbilidades o datos en conflicto, sustentada en la fuente.',
};
export const RunInput = z.object({
  specialty: z.string().trim().min(1).max(120), topic: z.string().trim().min(1).max(200),
  subtopic: z.string().trim().max(200).default(''), difficulty: Difficulty,
  count: z.number().int().min(1).max(10), instructions: z.string().trim().max(2000).default(''),
  documentId: z.string().uuid().optional(),
  questionType: z.enum(['diagnóstico','tratamiento','estudios','prevención','mixto']).default('mixto'),
  optionCount: z.number().int().min(3).max(5).default(4),
  format: z.enum(['independientes','seriadas']).default('independientes'),
  caseCount: z.number().int().min(1).max(5).default(1),
  questionsPerCase: z.number().int().min(2).max(5).default(2),
  sourceMode: z.enum(['documento','biblioteca','ambos']).default('biblioteca'),
  sourceIds: z.array(z.string().max(80)).max(5).default([]),
}).strict().superRefine((v,ctx)=>{
  if(v.format==='seriadas' && v.count!==v.caseCount*v.questionsPerCase) ctx.addIssue({code:'custom',message:'El total debe ser casos × preguntas por caso.',path:['count']});
  if(v.sourceMode!=='biblioteca'&&!v.documentId)ctx.addIssue({code:'custom',message:'Carga un documento para este modo.',path:['documentId']});
});
export type RunInput = z.infer<typeof RunInput>;
export const Citation = z.object({sourceId:z.string().min(1).max(100),page:z.number().int().min(1),quote:z.string().regex(/\S/,'El texto no puede estar vacío.').min(15).max(600),claim:z.string().regex(/\S/,'El texto no puede estar vacío.').min(5).max(1000)}).strict();
export const Option = z.object({text:z.string().regex(/\S/,'El texto no puede estar vacío.').min(1).max(1000),explanation:z.string().regex(/\S/,'El texto no puede estar vacío.').min(10).max(3000)}).strict();
export const Question = z.object({
  id:z.string().min(1).max(100), stem:z.string().regex(/\S/,'El texto no puede estar vacío.').min(10).max(2000),
  options:z.array(Option).min(3).max(5),correctIndex:z.number().int().min(0).max(4),
  explanation:z.string().regex(/\S/,'El texto no puede estar vacío.').min(15).max(5000),citations:z.array(Citation).min(1).max(8),
  specialty:z.string().min(1).max(120),topic:z.string().min(1).max(200),subtopic:z.string().max(200),difficulty:Difficulty,
}).strict();
export const ClinicalCase = z.object({id:z.string().min(1).max(100),title:z.string().regex(/\S/,'El texto no puede estar vacío.').min(1).max(200),narrative:z.string().regex(/\S/,'El texto no puede estar vacío.').min(50).max(6000),questions:z.array(Question).min(1).max(5)}).strict();
export const GeneratedContent = z.object({title:z.string().min(1).max(200),cases:z.array(ClinicalCase).max(10),limitations:z.array(z.string().max(1200)).max(20),insufficientEvidence:z.boolean()}).strict();
export type Question = z.infer<typeof Question>;
export type ClinicalCase = z.infer<typeof ClinicalCase>;
export type GeneratedContent = z.infer<typeof GeneratedContent>;
export type SourcePage = {page:number;text:string;locator?:string};
export type EvidenceSource = {id:string;title:string;kind:'documento'|'biblioteca';url:string;edition:string;retrievedAt:string;sha256:string;pages:SourcePage[];warnings:string[]};
export type QualityIssue = {code:string;severity:'error'|'warning';message:string;questionId?:string};
export type ModelUsage = {provider?:'openai'|'openrouter';model:string;inputTokens:number;outputTokens:number;estimatedCostUsd:number|null;durationMs:number;purpose:'generation'|'review'};
export type QuestionSet = {id:string;title:string;input:RunInput;cases:ClinicalCase[];sources:EvidenceSource[];revision:number;review_status:'draft'|'reviewed';review_note:string;metadata:{issues:QualityIssue[];limitations:string[];usage:ModelUsage[];promptVersion:string;reviewedByModel:boolean};parent_id:string|null;created_at:string;updated_at:string};
export const Id=z.string().uuid();
