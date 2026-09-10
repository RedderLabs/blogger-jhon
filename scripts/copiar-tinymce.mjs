import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Deja TinyMCE en `public/tinymce`, servido por el propio sitio.
 *
 * El editor NO se carga del CDN de Tiny. Sería una línea menos, pero cada vez
 * que alguien abriera el panel su navegador iría a pedirle el editor a un
 * servidor de otro, y este sitio se apoya en no hacer eso —lo mismo que las
 * letras, que también se sirven desde aquí—. Además el CDN pide una clave de
 * su nube; auto-alojado va bajo la GPL, que es lo que declara el editor en
 * `license_key`.
 *
 * Se copia en cada compilación en vez de guardarlo en el repositorio: son
 * cinco megas de una dependencia que ya está en `node_modules`, y así no se
 * queda vieja al actualizar el paquete.
 */

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, "..");
const origen = join(raiz, "node_modules", "tinymce");
const destino = join(raiz, "public", "tinymce");

if (!existsSync(origen)) {
  console.error("No encuentro node_modules/tinymce. ¿Falta `npm install`?");
  process.exit(1);
}

/*
 * Sólo lo que se usa, no el paquete entero: entero son casi diez megas y la
 * mitad son pieles y complementos que este panel no enseña nunca. Al añadir un
 * complemento a la barra de `EditorDeCuerpo.tsx` hay que añadirlo también
 * aquí, o en producción saldrá el editor sin ese botón.
 */
const CARPETAS = [
  "icons/default",
  "models/dom",
  "themes/silver",
  "skins/ui/oxide-dark",
  "skins/ui/oxide",
  "skins/content/dark",
  "skins/content/default",
  ...[
    "advlist",
    "autolink",
    "autoresize",
    "code",
    "link",
    "lists",
    "table",
    "wordcount",
  ].map((p) => `plugins/${p}`),
];
const FICHEROS = ["tinymce.min.js", "license.md"];

await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });

for (const carpeta of CARPETAS) {
  const de = join(origen, carpeta);
  if (existsSync(de)) await cp(de, join(destino, carpeta), { recursive: true });
}
for (const fichero of FICHEROS) {
  const de = join(origen, fichero);
  if (existsSync(de)) await cp(de, join(destino, fichero));
}

// El idioma. TinyMCE se sirve en inglés y sus traducciones se descargan
// aparte; ésta se escribe aquí para no depender de una descarga y para poder
// decir las cosas como se dicen en el resto del panel.
const es = `tinymce.addI18n('es', ${JSON.stringify({
  Bold: "Negrita",
  Italic: "Cursiva",
  Underline: "Subrayado",
  Strikethrough: "Tachado",
  "Align left": "A la izquierda",
  "Align center": "Centrado",
  "Align right": "A la derecha",
  Justify: "Justificado",
  "Bullet list": "Lista",
  "Numbered list": "Lista numerada",
  Blockquote: "Cita",
  "Horizontal line": "Raya de separación",
  "Insert/edit link": "Enlace",
  "Remove link": "Quitar el enlace",
  Link: "Enlace",
  Url: "Dirección",
  "Text to display": "Lo que se lee",
  "Open link in...": "Abrir el enlace…",
  "Current window": "En esta ventana",
  "New window": "En una ventana nueva",
  Save: "Guardar",
  Cancel: "Cancelar",
  Close: "Cerrar",
  Formats: "Formato",
  Headings: "Rótulos",
  "Heading 1": "Rótulo 1",
  "Heading 2": "Rótulo 2",
  "Heading 3": "Rótulo 3",
  "Heading 4": "Rótulo 4",
  "Heading 5": "Rótulo 5",
  "Heading 6": "Rótulo 6",
  Paragraph: "Párrafo",
  "Clear formatting": "Quitar el formato",
  Undo: "Deshacer",
  Redo: "Rehacer",
  "Source code": "Código",
  Table: "Tabla",
  "Insert table": "Poner una tabla",
  "Delete table": "Quitar la tabla",
  Row: "Fila",
  Column: "Columna",
  Cut: "Cortar",
  Copy: "Copiar",
  Paste: "Pegar",
  "Paste as text": "Pegar sin formato",
  "Select all": "Seleccionar todo",
  Fullscreen: "Pantalla completa",
  "Words: {0}": "Palabras: {0}",
  "Rich Text Area": "Zona de texto",
  "Rich Text Area. Press ALT-0 for help.":
    "Zona de texto. ALT-0 para la ayuda.",
  "Powered by {0}": "Con {0}",
  "You have unsaved changes are you sure you want to navigate away?":
    "Hay cambios sin guardar. ¿Seguro que quieres salir?",
})});`;

await mkdir(join(destino, "langs"), { recursive: true });
await writeFile(join(destino, "langs", "es.js"), es, "utf8");

console.log("TinyMCE copiado a public/tinymce");
