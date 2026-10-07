import { Check } from 'lucide-react';
import { Marker, MarkerIcon, MarkerContent } from '@/components/ui/marker';
export default function Demo() { return <div className="space-y-6">{(['default','separator','border'] as const).map(variant=><Marker key={variant} variant={variant}><MarkerIcon><Check/></MarkerIcon><MarkerContent>Documento guardado · {variant}</MarkerContent></Marker>)}</div> }
