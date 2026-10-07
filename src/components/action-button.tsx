import type { ComponentProps } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Acción de ancho completo: texto centrado e icono en un espacio independiente. */
export function ActionButton({ children, loading = false, className, disabled, ...props }: ComponentProps<typeof Button> & { loading?: boolean }) {
  return <Button variant="outline" {...props} disabled={disabled || loading} aria-busy={loading} className={cn('relative h-12 w-full rounded-full px-12 text-sm font-semibold', className)}>
    <span className="min-w-0 truncate">{children}</span>
    {loading ? <Loader2 aria-hidden="true" className="absolute right-5 size-4 animate-spin"/> : <ArrowRight aria-hidden="true" className="absolute right-5 size-4"/>}
  </Button>;
}
