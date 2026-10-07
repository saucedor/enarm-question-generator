import type { Meta, StoryObj } from '@storybook/react';
import Demo from './demos/sidebar';
const meta = { title: 'shadcn/Sidebar', component: Demo, parameters: { layout: 'fullscreen', docs: { description: { component: 'Componente oficial de shadcn/ui con el tema de ENARM. https://ui.shadcn.com/docs/components/sidebar' } } }, decorators: [(Story) => <div className="w-full "><Story/></div>] } satisfies Meta<typeof Demo>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
