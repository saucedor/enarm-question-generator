import {motion} from 'motion/react';
import {Reveal} from '@/components/motion/interactions';
import {useMotionPreference} from '@/components/motion/preferences';
import {useEffect,useState} from 'react';
import {BookOpen,Library,Plus,Layers3,ShieldCheck,ChevronRight,PanelLeft,LayoutDashboard,Sparkles,CircleHelp} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {HelpPage} from '@/features/HelpPage';
import {HomePage} from '@/features/HomePage';
import {GeneratePage} from '@/features/GeneratePage';
import {BankPage} from '@/features/BankPage';
import {SourcesPage} from '@/features/SourcesPage';
import {SetPage} from '@/features/SetPage';
import {PracticePage} from '@/features/PracticePage';
export function App(){
 const {reduced,manual,toggle}=useMotionPreference();
 const [route,setRoute]=useState(()=>window.location.hash.slice(1)||'home');
 const [mobileNav,setMobileNav]=useState(false);
 useEffect(()=>{const onHash=()=>{setRoute(window.location.hash.slice(1)||'home');setMobileNav(false);window.scrollTo(0,0)};window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash)},[]);
 const [view,id]=route.split('/');
 const title=({home:'Inicio',faq:'Ayuda y FAQ',bank:'Banco de preguntas',sources:'Fuentes de referencia',set:'Revisión de preguntas',practice:'Contestar prueba'} as Record<string,string>)[view]||'Crear preguntas';
 return <div className="studio-shell"><aside className="studio-sidebar"><a href="#home" className="studio-brand" aria-label="Futurum · Inicio"><svg className="studio-brand-logo" viewBox="84 38 438 136" aria-hidden="true" focusable="false"><image href="/brand/futurum.png" width="684" height="226"/></svg><small>Generador ENARM</small></a><Button className="studio-menu" size="icon" variant="ghost" aria-label="Mostrar navegación" aria-expanded={mobileNav} aria-controls="studio-navigation" onClick={()=>setMobileNav(v=>!v)}><PanelLeft/></Button><div id="studio-navigation" className={mobileNav?'studio-nav open':'studio-nav'}><p className="studio-nav-label">ESPACIO DE TRABAJO</p><nav aria-label="Navegación principal">{[{path:'home',label:'Inicio',icon:LayoutDashboard},{path:'new',label:'Crear preguntas',icon:Plus},{path:'bank',label:'Banco de preguntas',icon:Library},{path:'sources',label:'Fuentes de referencia',icon:BookOpen},{path:'faq',label:'Ayuda y FAQ',icon:CircleHelp}].map(item=>{const active=view===item.path||(item.path==='bank'&&['set','practice'].includes(view));return <Button key={item.path} variant="ghost" className={active?'active':''} asChild><a href={`#${item.path}`} aria-current={active?'page':undefined} onClick={()=>setMobileNav(false)}><>{active&&<motion.span aria-hidden="true" className="motion-nav-indicator" layoutId="main-navigation" transition={{duration:reduced?0:.22,ease:"easeOut"}}/>}<item.icon/><span className="motion-nav-label">{item.label}</span></></a></Button>})}<Button variant="ghost" asChild><a href={import.meta.env.DEV?'http://127.0.0.1:6006/?path=/story/enarm-estudio--composicion':'/storybook/'}><Layers3/>Componentes</a></Button></nav></div><div className="studio-side-note"><ShieldCheck size={22}/><strong>De la evidencia<br/>a la revisión</strong><p>Cada pregunta conserva las fuentes que la sustentan.</p></div></aside><div className="studio-workspace"><header className="studio-topbar"><span>Espacio académico</span><ChevronRight size={14}/><strong>{title}</strong><Button variant="ghost" size="sm" className="motion-toggle" onClick={toggle} aria-pressed={manual} title="También se respeta la preferencia de movimiento del sistema"><Sparkles size={15}/>{reduced?"Movimiento reducido":"Reducir movimiento"}</Button></header><main className="studio-main"><Reveal key={route}>{view==='home'?<HomePage/>:view==='faq'?<HelpPage/>:view==='bank'?<BankPage/>:view==='sources'?<SourcesPage/>:view==='set'&&id?<SetPage key={id} id={id}/>:view==='practice'&&id?<PracticePage key={id} id={id}/>:<GeneratePage/>}</Reveal></main></div></div>;
}
