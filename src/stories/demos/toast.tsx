import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
export default function Demo() { const {toast}=useToast();return <><p className="mb-4 text-sm text-muted-foreground">Toast clásico. Para pantallas nuevas usamos Sonner.</p><Button variant="outline" onClick={()=>toast({title:'Solicitud guardada',description:'Disponible en el historial.'})}>Mostrar notificación</Button><Toaster/></> }
