import type {Meta,StoryObj} from '@storybook/react';
import {HomeDashboard} from '@/features/HomePage';
import type {DashboardData} from '../../shared/dashboard';
const example:DashboardData={
 totals:{sets:12,questions:64,reviewed:8,pending:4,practices:7,activeRuns:0,failedRuns:0},
 activity:[2,1,0,3,2,1,3].map((sets,i)=>({date:`2026-10-0${i+1}`,sets})),
 specialties:[{name:'Medicina interna',questions:28},{name:'Pediatría',questions:18},{name:'Cirugía general',questions:12},{name:'Ginecología y obstetricia',questions:6}],
 recent:[{id:'example-1',title:'Diabetes mellitus: diagnóstico y seguimiento',specialty:'Medicina interna',questions:6,reviewed:false,updatedAt:'2026-10-07'},{id:'example-2',title:'Evaluación inicial del paciente pediátrico',specialty:'Pediatría',questions:5,reviewed:true,updatedAt:'2026-10-06'},{id:'example-3',title:'Abdomen agudo: diagnóstico diferencial',specialty:'Cirugía general',questions:4,reviewed:false,updatedAt:'2026-10-05'}],
 nextReview:{id:'example-1',title:'Diabetes mellitus: diagnóstico y seguimiento'}
};
const meta:Meta<typeof HomeDashboard>={title:'ENARM/Inicio',component:HomeDashboard,parameters:{layout:'fullscreen'},decorators:[Story=><div className="studio-main"><p className="studio-hint mb-5">Vista de diseño · datos ficticios de ejemplo.</p><Story/></div>]};
export default meta;
type Story=StoryObj<typeof HomeDashboard>;
export const ConActividad:Story={args:{data:example}};
export const PrimerIngreso:Story={args:{data:{totals:{sets:0,questions:0,reviewed:0,pending:0,practices:0,activeRuns:0,failedRuns:0},activity:example.activity.map(d=>({...d,sets:0})),specialties:[],recent:[],nextReview:null}}};
export const RevisionCompleta:Story={args:{data:{...example,totals:{...example.totals,reviewed:12,pending:0},recent:example.recent.map(s=>({...s,reviewed:true})),nextReview:null}}};
