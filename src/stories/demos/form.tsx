import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export default function Demo() { const form=useForm({defaultValues:{topic:''}});return <Form {...form}><form className="max-w-sm space-y-5" onSubmit={form.handleSubmit(v=>toast.success(`Tema guardado: ${v.topic}`))}><FormField control={form.control} name="topic" rules={{required:'Escribe un tema.',minLength:{value:3,message:'Usa al menos 3 caracteres.'}}} render={({field})=><FormItem><FormLabel>Tema</FormLabel><FormControl><Input placeholder="Evaluación inicial" {...field}/></FormControl><FormDescription>Formulario con validación local.</FormDescription><FormMessage/></FormItem>}/><Button type="submit">Guardar tema</Button></form></Form> }
