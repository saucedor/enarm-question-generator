import type { Meta, StoryObj } from '@storybook/react';
import Demo from './demos/label';
const meta = { title: 'shadcn/Label', component: Demo, parameters: { layout: 'padded', docs: { description: { component: 'Componente oficial de shadcn/ui con el tema de ENARM. https://ui.shadcn.com/docs/components/label' } } }, decorators: [(Story) => <div className="w-full max-w-3xl"><Story/></div>] } satisfies Meta<typeof Demo>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
