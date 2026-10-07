import type { Meta, StoryObj } from '@storybook/react';
import Demo from './demos/carousel';
const meta = { title: 'shadcn/Carousel', component: Demo, parameters: { layout: 'padded', docs: { description: { component: 'Componente oficial de shadcn/ui con el tema de ENARM. https://ui.shadcn.com/docs/components/carousel' } } }, decorators: [(Story) => <div className="w-full max-w-md px-12 py-4"><Story/></div>] } satisfies Meta<typeof Demo>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
