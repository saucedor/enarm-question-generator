import {ArrowDownToLine, ArrowRight, BookOpen, CircleHelp, FileText} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import help from '@/content/help.json';

export function HelpPage() {
 return <div className="space-y-8">
  <header className="studio-heading"><div><p className="eyebrow">APRENDE A USAR FUTURUM</p><h1 className="page-title">Ayuda y preguntas frecuentes</h1><p className="page-description">Del primer tema a una sesión de práctica. Encuentra aquí el recorrido y sus respuestas.</p></div><span className="studio-heading-icon"><CircleHelp size={32}/></span></header>
  <section className="help-guide" aria-labelledby="guide-title">
   <div className="help-guide-icon"><BookOpen size={32}/></div>
   <div className="help-guide-copy"><p className="eyebrow">DOCUMENTACIÓN DEL PROGRAMA</p><h2 id="guide-title">Tu guía de principio a fin</h2><p>Solicitud, fuentes, generación, revisión y práctica. Incluye un mapa del flujo, qué se guarda y cómo resolver problemas.</p><span>PDF · Versión {help.version} · {help.updated}</span></div>
   <div className="help-guide-actions"><Button asChild><a href={help.pdfUrl} download={help.pdfName}><ArrowDownToLine/>Descargar guía PDF</a></Button><Button variant="ghost" asChild><a href={help.pdfUrl} target="_blank" rel="noreferrer"><FileText/>Abrir PDF en otra pestaña</a></Button></div>
  </section>
  <section aria-labelledby="help-flow-title"><h2 id="help-flow-title" className="text-lg font-semibold mb-4">El recorrido en cuatro pasos</h2><ol className="help-steps">{help.steps.map((step,i)=><li key={step.title}><span className="help-step-number">0{i+1}</span><h3>{step.title}</h3><p>{step.text}</p><a href={step.href} aria-label={`${step.title}: abrir ${step.href==='#new'?'Crear preguntas':'Banco de preguntas'}`}>Ir a la sección<ArrowRight size={15}/></a></li>)}</ol></section>
  <section className="help-faq" aria-labelledby="faq-title"><header><p className="eyebrow">RESPUESTAS RÁPIDAS</p><h2 id="faq-title">Preguntas frecuentes</h2></header><Accordion type="single" collapsible>{help.faq.map(item=><AccordionItem value={item.id} key={item.id}><AccordionTrigger className="px-1 py-5 text-base gap-4">{item.question}</AccordionTrigger><AccordionContent className="px-1 pb-5 leading-7 text-muted-foreground"><p>{item.answer}</p>{item.href&&<a href={item.href} className="inline-flex items-center gap-2 text-primary font-medium">{item.link}<ArrowRight size={15}/></a>}</AccordionContent></AccordionItem>)}</Accordion></section>
  <p className="studio-hint">La guía describe la versión actual del programa. La revisión automática asiste al equipo académico; cada conjunto necesita una comprobación humana antes de utilizarse como material validado.</p>
 </div>;
}
