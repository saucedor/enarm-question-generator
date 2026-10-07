import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty } from '@/components/ui/combobox';
const items = ['Medicina interna', 'Pediatría', 'Cirugía general', 'Ginecología y obstetricia'];
export default function Demo() { return <Combobox items={items}><ComboboxInput aria-label="Especialidad" placeholder="Busca una especialidad" showClear/><ComboboxContent><ComboboxEmpty>Sin resultados.</ComboboxEmpty><ComboboxList>{(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}</ComboboxList></ComboboxContent></Combobox> }
