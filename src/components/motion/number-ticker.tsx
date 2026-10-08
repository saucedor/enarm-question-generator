// Adapted from Magic UI Number Ticker (MIT). See docs/licenses/magic-ui.txt.
import {useEffect,useRef} from 'react';
import {useInView,useMotionValue,useSpring} from 'motion/react';
import {useMotionPreference} from './preferences';
export function NumberTicker({value,className}:{value:number;className?:string}){
 const ref=useRef<HTMLSpanElement>(null);const {reduced}=useMotionPreference();
 const motionValue=useMotionValue(0);const spring=useSpring(motionValue,{damping:35,stiffness:180});
 const visible=useInView(ref,{once:true});
 const format=(n:number)=>Math.round(n).toLocaleString('es-MX');
 useEffect(()=>{
  if(reduced){spring.jump(value);if(ref.current)ref.current.textContent=format(value)}
  else if(visible)motionValue.set(value);
 },[value,visible,reduced,motionValue,spring]);
 useEffect(()=>spring.on('change',latest=>{if(ref.current)ref.current.textContent=format(latest)}),[spring]);
 return <span className={`motion-number ${className||''}`}><span className="sr-only">{format(value)}</span><span ref={ref} aria-hidden="true">{format(reduced?value:0)}</span></span>;
}
