import {useEffect,useState} from 'react';
import {BookOpen,Library,Plus,Layers3,ShieldCheck,ChevronRight,PanelLeft} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {GeneratePage} from '@/features/GeneratePage';
import {BankPage} from '@/features/BankPage';
import {SourcesPage} from '@/features/SourcesPage';
import {SetPage} from '@/features/SetPage';
import {PracticePage} from '@/features/PracticePage';
export function App(){
 const [route,setRoute]=useState(()=>window.location.hash.slice(1)||'new');
 const [mobileNav,setMobileNav]=useState(false);
 useEffect(()=>{const onHash=()=>{setRoute(window.location.hash.slice(1)||'new');setMobileNav(false);window.scrollTo(0,0)};window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash)},[]);
 const [view,id]=route.split('/');
 const title=({bank:'Banco de preguntas',sources:'Fuentes de referencia',set:'Revisión de preguntas',practice:'Contestar prueba'} as Record<string,string>)[view]||'Crear preguntas';
 return <div className="studio-shell"><aside className="studio-sidebar"><a href="#new" className="studio-brand"><span><BookOpen size={24}/></span><div>ENARM<small>ESTUDIO ACADÉMICO</small></div></a><Button className="studio-menu" size="icon" variant="ghost" aria-label="Mostrar navegación" aria-expanded={mobileNav} aria-controls="studio-navigation" onClick={()=>setMobileNav(v=>!v)}><PanelLeft/></Button><div id="studio-navigation" className={mobileNav?'studio-nav open':'studio-nav'}><p className="studio-nav-label">ESPACIO DE TRABAJO</p><nav aria-label="Navegación principal">{[{path:'new',label:'Crear preguntas',icon:Plus},{path:'bank',label:'Banco de preguntas',icon:Library},{path:'sources',label:'Fuentes de referencia',icon:BookOpen}].map(item=>{const active=view===item.path||(item.path==='bank'&&['set','practice'].includes(view));return <Button key={item.path} variant="ghost" className={active?'active':''} asChild><a href={`#${item.path}`} aria-current={active?'page':undefined} onClick={()=>setMobileNav(false)}><item.icon/>{item.label}{active&&<ChevronRight className="ml-auto size-4"/>}</a></Button>})}<Button variant="ghost" asChild><a href={import.meta.env.DEV?'http://127.0.0.1:6006/?path=/story/enarm-estudio--composicion':'/storybook/'}><Layers3/>Componentes</a></Button></nav></div><div className="studio-side-note"><ShieldCheck size={22}/><strong>De la evidencia<br/>a la revisión</strong><p>Cada pregunta conserva las fuentes que la sustentan.</p></div></aside><div className="studio-workspace"><header className="studio-topbar"><span>Espacio académico</span><ChevronRight size={14}/><strong>{title}</strong></header><main className="studio-main">{view==='bank'?<BankPage/>:view==='sources'?<SourcesPage/>:view==='set'&&id?<SetPage key={id} id={id}/>:view==='practice'&&id?<PracticePage key={id} id={id}/>:<GeneratePage/>}</main></div></div>;
}
