import { enCache } from "@/lib/cache";
import { CLAVE_PIE, NOTA_POR_DEFECTO } from "@/lib/pie";
import { prisma } from "@/lib/prisma";

/**
 * La nota del pie vive en `Ajuste` y es una sola para todo el sitio: se escribe
 * una vez en el panel y sale en todas las páginas que llevan `<Pie />`. Antes
 * iba escrita a mano en cada página, que es justo lo que obligaba a tocar el
 * código para corregir una coma.
 */
async function consultarNota(): Promise<string> {
  const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_PIE } });
  return fila?.valor?.trim() || NOTA_POR_DEFECTO;
}

/** La pide cada página, así que va por la caché; el panel la tira al guardar. */
export function notaDelPie(): Promise<string> {
  return enCache("sitio:pie", 300, consultarNota);
}

/**
 * Lo que hay escrito de verdad, sin sustituirlo por la nota de fábrica: el
 * panel necesita distinguir «no se ha escrito nada» de «se ha escrito justo
 * eso», y no pasa por caché porque se lee una vez al abrir el formulario.
 */
export async function notaGuardadaDelPie(): Promise<string> {
  const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_PIE } });
  return fila?.valor?.trim() ?? "";
}
