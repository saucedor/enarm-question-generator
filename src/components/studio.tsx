import {motion,LayoutGroup} from 'motion/react';
import {useId} from 'react';
import {useMotionPreference} from '@/components/motion/preferences';
import {NumberTicker} from '@/components/motion/number-ticker';
import type {ReactNode} from 'react';
import {BookOpen,Layers,ShieldCheck} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import type {RunInput} from '../../shared/domain';

export function StudioSection({number,title,description,children}:{number:string;title:string;description:string;children:ReactNode}) {
 const {reduced}=useMotionPreference();
 return <motion.section initial={reduced?false:{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.3,delay:reduced?0:Math.min(Number(number)||0,3)*.04}} className="studio-section"><header><span className="studio-section-number">{number}</span><div><h2>{title}</h2><p>{description}</p></div></header><div className="studio-section-body">{children}</div></motion.section>;
}
export function FormatChoice({value,onChange}:{value:RunInput['format'];onChange:(value:RunInput['format'])=>void}) {
 const groupId=useId();const {reduced}=useMotionPreference();
 return <LayoutGroup id={groupId}><fieldset><legend className="studio-legend">Formato de las preguntas</legend><RadioGroup aria-label="Formato de las preguntas" className="studio-format" value={value} onValueChange={v=>onChange(v as RunInput['format'])}>{(['independientes','seriadas'] as const).map(v=>{const Icon=v==='seriadas'?Layers:BookOpen;return <label key={v} className={value===v?'selected':''}>{value===v&&<motion.span className="motion-choice-indicator" layoutId="format" aria-hidden="true" transition={{duration:reduced?0:.2}}/>}<Icon size={21}/><span><strong>{v==='seriadas'?'Seriadas':'Independientes'}</strong><small>{v==='seriadas'?'Varias preguntas, un mismo caso':'Un caso por pregunta'}</small></span><RadioGroupItem value={v} aria-label={v==='seriadas'?'Seriadas':'Independientes'}/></label>})}</RadioGroup></fieldset></LayoutGroup>;
}
export function RequestSummary({form,documentName,sourceTitles=[],detailed=false}:{form:RunInput;documentName?:string;sourceTitles?:string[];detailed?:boolean}) {
 const total=form.format==='seriadas'?form.caseCount*form.questionsPerCase:form.count;
 return <><div className="studio-summary-title"><span className="eyebrow">TU CONJUNTO</span><Badge variant="outline">Borrador</Badge></div><p className="studio-total"><NumberTicker value={total}/><span>preguntas</span></p><h2 className="studio-summary-topic">{form.topic||'Tema por definir'}</h2><dl className="studio-summary-list"><div><dt>Especialidad</dt><dd>{form.specialty}</dd></div><div><dt>Formato</dt><dd>{form.format==='seriadas'?`${form.caseCount} ${form.caseCount===1?'caso':'casos'} × ${form.questionsPerCase} preguntas`:'Casos independientes'}</dd></div><div><dt>Dificultad</dt><dd className="capitalize">{form.difficulty}</dd></div><div><dt>Enfoque</dt><dd className="capitalize">{form.questionType}</dd></div><div><dt>Respuestas</dt><dd>{form.optionCount} opciones · una correcta</dd></div><div><dt>Fuentes</dt><dd>{form.sourceMode==='biblioteca'?'Biblioteca':form.sourceMode==='ambos'?'Documento + biblioteca':'Documento propio'}</dd></div>{form.sourceMode!=='biblioteca'&&<div><dt>Documento</dt><dd>{documentName||'Por seleccionar'}</dd></div>}{detailed&&<>{form.subtopic&&<div><dt>Subtema</dt><dd>{form.subtopic}</dd></div>}{form.instructions&&<div className="studio-summary-long"><dt>Instrucciones</dt><dd>{form.instructions}</dd></div>}{form.sourceMode!=='documento'&&<div className="studio-summary-long"><dt>Bibliografía</dt><dd>{sourceTitles.length?sourceTitles.join(' · '):'Predeterminada de la especialidad'}</dd></div>}</>}</dl></>;
}
export function AcademicNote(){return <div className="studio-academic"><ShieldCheck size={22}/><div><h3>El criterio final es tuyo</h3><p>Los resultados son borradores. Revisa claves, distractores y referencias antes de usarlos.</p></div></div>}
