import { enCache } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { CLAVE_ID, CLAVE_PANEL, CLAVE_SCRIPT, type Umami } from "@/lib/umami";

/**
 * La configuración de Umami, escrita desde el panel y no desde un fichero de
 * entorno: el fotógrafo cambia de servidor —de Render a su propio dominio— sin
 * tener que tocar variables ni volver a desplegar.
 */
async function consultar(): Promise<Umami> {
  const filas = await prisma.ajuste.findMany({
    where: { clave: { in: [CLAVE_SCRIPT, CLAVE_ID, CLAVE_PANEL] } },
  });
  const v = (clave: string) => filas.find((f) => f.clave === clave)?.valor?.trim() ?? "";
  return { script: v(CLAVE_SCRIPT), id: v(CLAVE_ID), panel: v(CLAVE_PANEL) };
}

/** Lo pide el layout en cada página: va por la caché, como el aviso. */
export function umamiDelSitio(): Promise<Umami> {
  return enCache("sitio:umami", 300, consultar);
}
