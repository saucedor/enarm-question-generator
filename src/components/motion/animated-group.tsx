// Adapted from Motion Primitives Animated Group (MIT).
// See docs/licenses/motion-primitives.txt. Stable child keys and reduced-motion added.
import {Children,isValidElement,type ReactNode} from 'react';
import {motion} from 'motion/react';
import {useMotionPreference} from './preferences';
export function AnimatedGroup({children,className}:{children:ReactNode;className?:string}){
 const {reduced}=useMotionPreference();
 return <motion.div className={className} initial={reduced?false:'hidden'} animate="visible" variants={{visible:{transition:{staggerChildren:reduced?0:.055}}}}>{Children.toArray(children).map((child,index)=><motion.div className="motion-group-item" key={isValidElement(child)?child.key??index:index} variants={{hidden:{opacity:0,y:10},visible:{opacity:1,y:0,transition:{duration:reduced?0:.28,ease:'easeOut'}}}}>{child}</motion.div>)}</motion.div>;
}
