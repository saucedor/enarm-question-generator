import {useEffect,useRef,useState} from 'react';
import type {Meta,StoryObj} from '@storybook/react';
import {AnimatedGroup} from '@/components/motion/animated-group';
import {NumberTicker} from '@/components/motion/number-ticker';
import {ActionButton,AnimatedUpload} from '@/components/motion/interactions';
import {useMotionPreference} from '@/components/motion/preferences';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {FormatChoice} from '@/components/studio';
import type {RunInput} from '../../shared/domain';
const meta:Meta={title:'ENARM/Movimiento',parameters:{layout:'fullscreen'}};
export default meta;
export const Interacciones:StoryObj={render:function Demo(){
 const [value,setValue]=useState(64);const [replay,setReplay]=useState(0);const [busy,setBusy]=useState(false);const [saved,setSaved]=useState(false);const [filename,setFilename]=useState('');const [format,setFormat]=useState<RunInput['format']>('independientes');const {reduced,toggle,manual}=useMotionPreference();
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 return <div className="studio-main max-w-4xl space-y-8"><header><p className="eyebrow">LABORATORIO VISUAL</p><h1 className="page-title">Movimiento de ENARM</h1><p className="page-description">Datos de ejemplo. Los controles de esta página no guardan ni envían información.</p></header><div className="flex flex-wrap gap-3"><Button onClick={()=>setReplay(n=>n+1)}>Repetir entrada</Button><Button variant="outline" onClick={()=>setValue(n=>n===64?128:64)}>Cambiar indicadores</Button><Button variant="outline" onClick={toggle} aria-pressed={manual}>{reduced?'Movimiento reducido':'Reducir movimiento'}</Button></div><AnimatedGroup key={replay} className="home-metrics">{['Preguntas','Revisadas','Pendientes','Pruebas'].map((label,i)=><Card className="home-metric" key={label}><p>{label}</p><strong><NumberTicker value={Math.round(value/(i+1))}/></strong></Card>)}</AnimatedGroup><div className="studio-section"><div className="studio-section-body"><FormatChoice value={format} onChange={setFormat}/><ActionButton loading={busy} success={saved} loadingText="Guardando ejemplo…" onClick={()=>{setBusy(true);setSaved(false);timer.current=setTimeout(()=>{setBusy(false);setSaved(true)},700)}}>{saved?'Ejemplo guardado':'Probar botón de guardado'}</ActionButton></div></div><AnimatedUpload busy={false} onUpload={file=>setFilename(`Seleccionado localmente: ${file.name}`)} onError={setFilename}/>{filename&&<p role="status">{filename}</p>}</div>;
}};
