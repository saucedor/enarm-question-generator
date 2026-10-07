import type { Meta, StoryObj } from '@storybook/react';
import Demo from './demos/popover';
const meta = { title: 'shadcn/Popover', component: Demo, parameters: { layout: 'padded', docs: { description: { component: 'Componente oficial de shadcn/ui con el tema de ENARM. https://ui.shadcn.com/docs/components/popover' } } }, decorators: [(Story) => <div className="w-full max-w-3xl"><Story/></div>] } satisfies Meta<typeof Demo>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
