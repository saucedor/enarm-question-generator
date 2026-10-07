import type { Preview } from '@storybook/react';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '../src/components/ui/tooltip';
import { Toaster } from '../src/components/ui/sonner';
import '../src/index.css';
const preview: Preview = {
  parameters: { layout: 'centered', backgrounds: { disable: true }, options: { storySort: { order: ['ENARM', 'shadcn'] } } },
  globalTypes: { theme: { description: 'Tema de ENARM', toolbar: { icon: 'contrast', items: [{ value: 'light', title: 'Claro' }, { value: 'dark', title: 'Oscuro' }] } } },
  initialGlobals: { theme: 'light' },
  decorators: [(Story, context) => <ThemeProvider attribute="class" forcedTheme={context.globals.theme || 'light'} enableSystem={false}><TooltipProvider><div className="w-full min-w-0 p-2"><Story/></div><Toaster/></TooltipProvider></ThemeProvider>],
};
export default preview;
