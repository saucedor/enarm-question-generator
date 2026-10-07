import { FileText, X } from 'lucide-react';
import { useState } from 'react';
import { Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction, AttachmentGroup } from '@/components/ui/attachment';
import { Button } from '@/components/ui/button';
export default function Demo() { const [visible,setVisible] = useState(true); return <AttachmentGroup>{visible ? <Attachment state="done"><AttachmentMedia><FileText/></AttachmentMedia><AttachmentContent><AttachmentTitle>Guía de ejemplo.pdf</AttachmentTitle><AttachmentDescription>PDF · 240 KB · Carga completa</AttachmentDescription></AttachmentContent><AttachmentActions><AttachmentAction aria-label="Quitar archivo" onClick={()=>setVisible(false)}><X/></AttachmentAction></AttachmentActions></Attachment> : <Button variant="outline" onClick={()=>setVisible(true)}>Restaurar ejemplo</Button>}</AttachmentGroup> }
