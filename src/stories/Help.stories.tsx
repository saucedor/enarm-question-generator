import type {Meta, StoryObj} from '@storybook/react';
import {HelpPage} from '@/features/HelpPage';
const meta:Meta<typeof HelpPage>={title:'ENARM/Ayuda y FAQ',component:HelpPage,parameters:{layout:'fullscreen'},decorators:[Story=><div className="studio-main"><Story/></div>]};
export default meta;
export const GuiaYRespuestas:StoryObj<typeof HelpPage>={};
