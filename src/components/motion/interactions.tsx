import {useRef,useState,type ComponentProps,type ReactNode} from 'react';
import {AnimatePresence,motion,useIsPresent} from 'motion/react';
import {Check,Loader2,Upload,FileUp} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useMotionPreference} from './preferences';

// Local, controlled implementation of the Stateful Button interaction pattern.
// Inspired by https://ui.aceternity.com/components/stateful-button.
// The caller owns network state: resolved handlers are not assumed to mean success.
export function ActionButton({loading=false,success=false,loadingText='Guardando…',children,disabled,...props}:ComponentProps<typeof Button>&{loading?:boolean;success?:boolean;loadingText?:string}){
 const {reduced}=useMotionPreference();const state=loading?'loading':success?'success':'idle';
 return <Button {...props} disabled={disabled||loading} aria-busy={loading} className={`motion-action ${props.className||''}`}><AnimatePresence initial={false} mode="sync"><ActionContent key={state} reduced={reduced}>{loading?<><Loader2 className="animate-spin"/>{loadingText}</>:<>{success&&<Check/>}{children}</>}</ActionContent></AnimatePresence></Button>;
}

function ActionContent({children,reduced}:{children:ReactNode;reduced:boolean}){
 const present=useIsPresent();return <motion.span aria-hidden={!present} className="motion-action-content" initial={reduced?false:{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={reduced?{opacity:1}:{opacity:0,y:-4}} transition={{duration:reduced?0:.16}}>{children}</motion.span>;
}

// Aceternity-inspired upload interaction, retaining our input and server validation.
export function AnimatedUpload({busy,onUpload,onError}:{busy:boolean;onUpload:(file:File)=>void;onError:(message:string)=>void}){
 const input=useRef<HTMLInputElement>(null);const depth=useRef(0);const [dragging,setDragging]=useState(false);const {reduced}=useMotionPreference();
 return <div className={`studio-upload motion-upload ${dragging?'dragging':''}`} onDragEnter={e=>{e.preventDefault();if(!busy){depth.current++;setDragging(true)}}} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect=busy?'none':'copy'}} onDragLeave={e=>{e.preventDefault();depth.current=Math.max(0,depth.current-1);if(!depth.current)setDragging(false)}} onDrop={e=>{e.preventDefault();depth.current=0;setDragging(false);if(busy)return;if(e.dataTransfer.files.length!==1){onError('Carga un solo documento a la vez.');return}onUpload(e.dataTransfer.files[0])}}>
  <motion.div className="motion-upload-icon" animate={reduced?{}:{y:dragging?-6:0,rotate:dragging?-5:0,scale:dragging?1.08:1}} transition={{type:'spring',stiffness:300,damping:24}}>{dragging?<FileUp size={24}/>:<Upload size={24}/>}</motion.div>
  <strong>{dragging?'Suelta tu documento aquí':'Agrega tu material de referencia'}</strong><p>Arrastra un archivo o selecciónalo.<br/>PDF con texto o TXT UTF-8 · hasta 5 MB<br/>PDF: hasta 150 páginas · sin OCR</p>
  <ActionButton type="button" variant="outline" loading={busy} loadingText="Leyendo documento…" onClick={()=>input.current?.click()}>Cargar archivo</ActionButton><input ref={input} className="sr-only" tabIndex={-1} aria-label="Cargar documento" type="file" accept=".pdf,.txt" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)onUpload(file);e.target.value=''}}/>
 </div>;
}
export function Reveal({children,className}:{children:ReactNode;className?:string}){
 const {reduced}=useMotionPreference();return <motion.div className={className} initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.22}}>{children}</motion.div>;
}
