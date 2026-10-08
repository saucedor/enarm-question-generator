"""Rebuild the user guide and its public download. Requires reportlab.
Run from any directory: python3 scripts/build-guide.py
"""
from pathlib import Path
import json, os, shutil
from html import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
HELP = json.loads((ROOT/'src/content/help.json').read_text())
OUT = ROOT/'output/pdf/futurum-guia-flujo.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
# Override these two paths on a non-macOS documentation workstation.
fonts = [('Futurum', 'FUTURUM_FONT_REGULAR', '/System/Library/Fonts/Supplemental/Arial.ttf'), ('FuturumBold', 'FUTURUM_FONT_BOLD', '/System/Library/Fonts/Supplemental/Arial Bold.ttf')]
for name, env, default in fonts:
    pdfmetrics.registerFont(TTFont(name, os.environ.get(env, default)))
pdfmetrics.registerFontFamily('Futurum', normal='Futurum', bold='FuturumBold')
W,H = 595.28,841.89
NAVY='#101b43'; BLUE='#294dbe'; MUTED='#626d85'; BG='#f5f6fa'; LINE='#dce1ed'; TINT='#e9edfa'
c=canvas.Canvas(str(OUT), pagesize=(W,H))
c.setTitle('Futurum | Guía del flujo completo')
c.setAuthor('Futurum · Generador ENARM')
c.setSubject('Documentación funcional y técnica del recorrido de generación, revisión y práctica')

def box(x,y,w,h,fill=BG,stroke=None,r=12):
    c.setFillColor(HexColor(fill)); c.setStrokeColor(HexColor(stroke or fill))
    c.roundRect(x,H-y-h,w,h,r,fill=1,stroke=bool(stroke))

def text(s,x,y,size=10.5,color=NAVY,bold=False):
    c.setFillColor(HexColor(color));c.setFont('FuturumBold' if bold else 'Futurum',size);c.drawString(x,H-y-size,s)

def para(s,x,y,w=499,size=10.5,color=MUTED,bold=False):
    p=Paragraph(s,ParagraphStyle('body',fontName='FuturumBold' if bold else 'Futurum',fontSize=size,leading=size*1.47,textColor=HexColor(color)))
    _,h=p.wrap(w,700)
    if y+h>780: raise ValueError(f'Content exceeds page safe area: {s[:80]} at {y+h}')
    p.drawOn(c,x,H-y-h)
    return y+h

def logo(x,y,w=132):
    # Display the supplied image unchanged through a viewport, excluding screenshot margins.
    scale=w/438; h=136*scale
    c.saveState(); path=c.beginPath();path.rect(x,H-y-h,w,h);c.clipPath(path,stroke=0)
    c.drawImage(str(ROOT/'public/brand/futurum.png'),x-84*scale,H-y-h-(226-174)*scale,width=684*scale,height=226*scale)
    c.restoreState()

def start(n,kicker,title,subtitle):
    c.setFillColor(white);c.rect(0,0,W,H,fill=1,stroke=0)
    logo(44,27,126)
    text('GENERADOR ENARM',373,42,9,MUTED,True)
    c.setStrokeColor(HexColor(LINE));c.line(44,H-83,W-44,H-83)
    text(kicker.upper(),48,108,9,BLUE,True)
    text(title,48,129,27,NAVY,True)
    end=para(subtitle,48,172,499,11)
    c.bookmarkPage(f'p{n}');c.addOutlineEntry(title,f'p{n}',0)
    text(f'Futurum · Documentación v{HELP["version"]}',48,804,8,MUTED)
    text(f'{HELP["updated"]}   /   {n:02d}',366,804,8,MUTED)
    return end+26

def section(title,body,y):
    text(title,48,y,14,NAVY,True)
    return para(body,48,y+25)+20

def note(title,body,y):
    p=Paragraph(body,ParagraphStyle('note',fontName='Futurum',fontSize=10,leading=15,textColor=HexColor(NAVY)))
    _,h=p.wrap(459,600)
    box(48,y,499,h+55,TINT)
    text(title,66,y+13,10,BLUE,True)
    p.drawOn(c,66,H-(y+35)-h)
    if y+h+55>780:raise ValueError('Note overflow')
    return y+h+75

def row(num,title,body,y):
    box(48,y,35,35,TINT,r=10);text(num,56,y+10,11,BLUE,True)
    text(title,98,y,12,NAVY,True)
    bottom=para(body,98,y+22,449,10.5)
    return max(y+35,bottom)+21

# 1: route map and orientation.
y=start(1,'Guía de uso + documentación','De la fuente a la práctica','Un recorrido completo para preparar, generar, revisar y utilizar preguntas ENARM en Futurum.')
for i,(title,body) in enumerate([
 ('Define tu objetivo','Desde Inicio, abre Crear preguntas. Delimita el tema, la dificultad y la estructura del conjunto.'),
 ('Aporta las fuentes','Elige biblioteca, un documento propio o ambos. El sistema necesita evidencia relacionada con el tema.'),
 ('Confirma y genera','Revisa el resumen y envía. El servidor procesa la solicitud en segundo plano y muestra su estado.'),
 ('Revisa y guarda','Abre el resultado, comprueba las referencias, edita si hace falta y registra la revisión académica.'),
 ('Practica y reutiliza','Contesta una prueba, consulta las explicaciones y recupera o exporta el conjunto desde tu banco.')],1):
    y=row(f'0{i}',title,body,y)
y=note('Dos estados diferentes','<b>Completado</b> describe el procesamiento de una solicitud. <b>Revisión académica registrada</b> describe una comprobación humana del conjunto. Uno no implica el otro.',y)
para('Cómo leer esta guía: configuración y fuentes (p. 2), generación (p. 3), revisión y banco (p. 4), práctica (p. 5), arquitectura y datos (p. 6), FAQ (p. 7).',48,y,499,9.5)
c.showPage()

# 2: preparation.
y=start(2,'01 / Preparación','Configura tu solicitud','La precisión del tema y la pertinencia de las fuentes orientan el resultado.')
y=section('Contenido clínico','Elige Medicina interna, Pediatría, Ginecología y obstetricia o Cirugía general. Escribe un tema concreto y, si lo necesitas, un subtema e instrucciones. Selecciona dificultad básica, intermedia o avanzada y enfoque de diagnóstico, tratamiento, estudios, prevención o mixto.',y)
y=section('Estructura del conjunto','<b>Independientes:</b> de 1 a 10 preguntas, cada una con su caso.<br/><b>Seriadas:</b> de 1 a 5 casos con 2 a 5 preguntas por caso; el producto no puede superar 10. Por ejemplo, 2 casos × 3 preguntas = 6.<br/><b>Opciones:</b> 3, 4 o 5 por pregunta, con una mejor respuesta.',y)
y=section('Tres formas de aportar evidencia','<b>Biblioteca:</b> usa las fuentes disponibles para la especialidad; sin selección se toma la predeterminada.<br/><b>Mi documento:</b> carga o selecciona un archivo con contenido pertinente.<br/><b>Ambos:</b> combina el documento propio y la biblioteca; el conjunto debe citar ambos orígenes.',y)
y=note('Archivos admitidos','PDF con texto seleccionable o TXT UTF-8, hasta <b>5 MB</b>, <b>150 páginas de PDF</b> y <b>800 000 caracteres</b>. No hay OCR. Los archivos vacíos, corruptos o sin suficiente texto no sirven para generar.',y)
para('<b>Antes de confirmar:</b> revisa el total y las fuentes en el resumen. La configuración se guarda en este navegador. Al pulsar Generar preguntas se envía la solicitud al servidor; el contenido seleccionado se compartirá con el proveedor de IA. Usa material público o ficticio, sin datos personales.',48,y,499,10.5)
c.showPage()

# 3: internal pipeline without unverified medical claims.
y=start(3,'02 / Generación','Qué ocurre al enviar','El resultado se guarda únicamente si supera los controles del procesamiento.')
for i,(title,body) in enumerate([
 ('Registro y cola durable','La API valida los parámetros y registra la solicitud junto con el trabajo en PostgreSQL. Una clave de idempotencia evita duplicar el mismo envío cuando se reintenta con esa clave.'),
 ('Selección de evidencia','El worker recupera fuentes y texto del documento. Selecciona fragmentos relacionados y construye un catálogo de citas con su procedencia y página o sección.'),
 ('Redacción y controles','La IA redacta casos, opciones, clave y explicaciones. El servidor comprueba estructura, cantidades, duplicados, clasificación y referencias. El modelo selecciona IDs; el servidor aporta las citas originales.'),
 ('Revisión y corrección acotada','Una revisión de IA busca problemas de sustento y coherencia. Puede haber hasta dos correcciones del borrador; después se repiten los controles. Si persisten defectos, la solicitud falla explícitamente.'),
 ('Guardado del conjunto','Se conservan preguntas, fuentes utilizadas y metadatos. La solicitud queda Completada y ofrece Revisar preguntas. El conjunto empieza pendiente de revisión académica.')],1):
    y=row(str(i),title,body,y)
y=note('Estados de la solicitud','En cola → Procesando → Completado. Un fallo temporal de infraestructura puede pasar por Reintentando; un error terminal queda Fallido con su explicación. No se muestra un porcentaje de progreso estimado.',y)
para('Puedes salir cuando la solicitud esté confirmada como guardada. Al volver, consulta Solicitudes recientes en Crear preguntas. Si no hay un resultado, lee el estado antes de crear otro envío.',48,y,499,10)
c.showPage()

# 4: review lifecycle.
y=start(4,'03 / Revisión y biblioteca','Convierte el borrador en material útil','La revisión del equipo académico es una etapa propia del flujo.')
y=section('1. Comprueba cada pregunta','Lee el caso, enunciado, opciones y clave. Revisa la justificación y la explicación de cada distractor. Contrasta las afirmaciones con la cita literal y su página o sección. Comprueba vigencia, dificultad, coherencia y aplicabilidad al contexto mexicano.',y)
y=section('2. Edita y guarda','Editar preguntas permite ajustar títulos, narrativa, enunciado, opciones, clave, explicaciones y referencias. Guardar cambios valida el contenido e incrementa la versión. No agrega ni elimina preguntas del conjunto. El borrador local no reemplaza el guardado en el servidor.',y)
y=note('Si otra sesión guardó primero','El sistema rechaza la sobrescritura y conserva tu borrador local. Copia lo que necesites antes de usar Descartar mi borrador y cargar versión actual. Vuelve a aplicar tus ajustes sobre esa versión.',y)
y=section('3. Registra la revisión académica','Escribe una nota de 10 a 2 000 caracteres con lo que comprobaste y sus límites. Registrar revisión académica actualiza el estado. Una edición posterior lo devuelve a pendiente y elimina la nota anterior del conjunto actual. No se vuelve a ejecutar la revisión de IA al guardar una edición.',y)
y=section('4. Recupera, exporta o regenera','Banco de preguntas permite buscar por título, tema, subtema o especialidad y navegar páginas de hasta 50 conjuntos. Exportar JSON descarga la versión guardada con casos, referencias y metadatos. Regenerar conjunto crea otro conjunto vinculado al anterior y conserva el original.',y)
para('<b>Antes de practicar, exportar o regenerar:</b> guarda las ediciones pendientes. El número de versión protege frente a cambios concurrentes; no equivale a un historial navegable de todas las ediciones.',48,y,499,10)
c.showPage()

# 5: practice, persistence and dashboard.
y=start(5,'04 / Práctica y seguimiento','Contesta, aprende y retoma','Cada intento conserva una copia de la versión con la que comenzó.')
y=row('01','Inicia una prueba','Abre un conjunto guardado y pulsa Contestar prueba. Se crea un intento con una copia fija del contenido y su versión.',y)
y=row('02','Responde todas las preguntas','Las claves y explicaciones se omiten de la respuesta de la API de práctica durante el intento. La pantalla muestra el avance. Las selecciones pendientes se conservan en el navegador para ese intento.',y)
y=row('03','Finaliza y consulta la explicación','Finalizar y ver explicaciones se habilita al contestar todas las preguntas. El servidor registra las respuestas y devuelve la calificación, claves, explicaciones y fuentes de la copia evaluada.',y)
y=row('04','Recupera el resultado','Conserva el enlace del intento para volver a su resultado. Editar el conjunto original no cambia ese intento. Para repetir, vuelve al conjunto e inicia una nueva prueba.',y)
y=note('Dónde se guarda cada cosa','<b>Navegador:</b> configuración de la solicitud, borradores de edición, respuestas aún no enviadas y preferencia de movimiento.<br/><b>Servidor:</b> solicitudes aceptadas, conjuntos guardados, notas de revisión e intentos con sus respuestas al finalizar. Borrar los datos del navegador puede eliminar los borradores.',y)
y=section('Qué te muestra Inicio','El dashboard resume preguntas, conjuntos, revisiones pendientes y pruebas completadas. Muestra actividad de creación de los últimos siete días en UTC, conjuntos recientes y distribución por especialidad. Los conteos del Banco se refieren a la página y búsqueda actual, no necesariamente a todo el banco.',y)
para('La vista de práctica oculta respuestas para evitar pistas en el recorrido. No constituye por sí sola un sistema de examen seguro: el espacio académico también permite abrir los conjuntos y sus soluciones.',48,y,499,9.5)
c.showPage()

# 6: architecture and scope, no keys/internal URLs.
y=start(6,'Referencia técnica','Cómo se conectan las piezas','Arquitectura implementada. La configuración y disponibilidad dependen del entorno.')
labels=[('Navegador','React + shadcn'),('API','Fastify'),('Datos y cola','PostgreSQL'),('Worker','Evidencia + IA')]
for i,(title,desc) in enumerate(labels):
    x=48+i*127
    box(x,y,118,70,TINT if i==0 else BG)
    text(title,x+10,y+15,11,BLUE,True);text(desc,x+10,y+38,8.5,MUTED)
    if i<3:text('>',x+119,y+24,10,BLUE,True)
y+=82
y=section('Responsabilidades','<b>Web/API:</b> sirve la interfaz, valida entradas, gestiona archivos, consultas, ediciones y práctica.<br/><b>PostgreSQL + pg-boss:</b> persiste documentos y texto extraído, solicitudes, conjuntos, fuentes, intentos y la cola durable.<br/><b>Worker:</b> consume trabajos, reúne evidencia, llama al proveedor y guarda el resultado.<br/><b>Almacenamiento de objetos:</b> conserva los archivos originales. Las fuentes de biblioteca se recuperan desde sus sitios.',y)
y=section('Proveedor y trazabilidad','El código admite OpenRouter y OpenAI directo; los modelos dependen de la configuración. Cada conjunto completado registra modelo, tokens, duración, versión de instrucciones y costo disponible. Consulta Modelo, consumo y trazabilidad. Una solicitud fallida también puede consumir llamadas.',y)
y=section('Límites operativos actuales','Hasta 10 preguntas por solicitud y 3 solicitudes pendientes. Límite compartido predeterminado de 30 solicitudes por 24 horas (configurable) y 3 envíos por minuto/IP. Cada llamada al modelo tiene un límite de 150 segundos; no hay un tiempo de entrega garantizado.',y)
y=note('Alcance de esta versión','La biblioteca NICE/WSES cubre temas acotados. No hay búsqueda web abierta ni OCR. La selección de evidencia es léxica. Una cita existente no garantiza pertinencia. El entorno local puede usar un generador sintético; esos ejemplos no validan al proveedor real.',y)
para('<b>Base documental:</b> shared/domain.ts; server/app.ts, runs.ts, generation.ts, sources.ts, quality.ts y questions.ts; src/features/*.tsx. Guía contrastada con el código local al 8 de octubre de 2026. No certifica que Railway ejecute esta misma revisión ni acredita validación clínica.',48,y,499,9)
c.showPage()

# 7: FAQ shares exact content with the platform.
y=start(7,'Consulta rápida','Preguntas frecuentes','Estas respuestas también están disponibles en Ayuda y FAQ dentro de la plataforma.')
for item in HELP['faq']:
    text(item['question'],48,y,10.5,NAVY,True)
    y=para(escape(item['answer']),48,y+18,499,9.2)+10
c.showPage();c.save()
public=ROOT/'public/docs/futurum-guia-flujo.pdf';public.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(OUT,public)
print(f'Created {OUT} and public copy ({OUT.stat().st_size} bytes)')
