import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {MotionConfig,useReducedMotion} from 'motion/react';
const Preference=createContext({reduced:false,manual:false,toggle:()=>{}});
export function MotionPreferences({children,forceReduced=false}:{children:ReactNode;forceReduced?:boolean}){
 const system=useReducedMotion();
 const [manual,setManual]=useState(()=>{try{return localStorage.getItem('enarm-reduce-motion')==='true'}catch{return false}});
 const reduced=forceReduced||!!system||manual;
 useEffect(()=>{document.documentElement.dataset.motion=reduced?'reduced':'full';return()=>{delete document.documentElement.dataset.motion}},[reduced]);
 function toggle(){setManual(value=>{const next=!value;try{localStorage.setItem('enarm-reduce-motion',String(next))}catch{}return next})}
 return <Preference.Provider value={{reduced,manual,toggle}}><MotionConfig reducedMotion={reduced?'always':'never'}><div data-motion={reduced?'reduced':'full'}>{children}</div></MotionConfig></Preference.Provider>;
}
export const useMotionPreference=()=>useContext(Preference);
