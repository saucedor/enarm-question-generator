import { useState } from 'react';
import { DirectionProvider } from '@/components/ui/direction';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
export default function Demo() { const [dir,setDir]=useState<'ltr'|'rtl'>('ltr');return <DirectionProvider dir={dir}><div dir={dir} className="space-y-4"><Button variant="outline" onClick={()=>setDir(dir==='ltr'?'rtl':'ltr')}>Dirección: {dir.toUpperCase()}</Button><Tabs defaultValue="a" dir={dir}><TabsList><TabsTrigger value="a">Documentos</TabsTrigger><TabsTrigger value="b">Solicitudes</TabsTrigger></TabsList><TabsContent value="a">El orden se adapta a la dirección del texto.</TabsContent><TabsContent value="b">Historial de solicitudes.</TabsContent></Tabs></div></DirectionProvider> }
