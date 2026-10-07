import type { Meta, StoryObj } from '@storybook/react';
import Demo from './demos/pagination';
const meta = { title: 'shadcn/Pagination', component: Demo, parameters: { layout: 'padded', docs: { description: { component: 'Componente oficial de shadcn/ui con el tema de ENARM. https://ui.shadcn.com/docs/components/pagination' } } }, decorators: [(Story) => <div className="w-full max-w-3xl"><Story/></div>] } satisfies Meta<typeof Demo>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
