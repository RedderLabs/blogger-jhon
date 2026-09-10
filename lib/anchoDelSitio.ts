import { enCache } from "@/lib/cache";
import { ANCHOS_DISPONIBLES, ANCHO_POR_DEFECTO, CLAVE_ANCHO } from "@/lib/fotos";
import { prisma } from "@/lib/prisma";

/**
 * A cuántos píxeles se sirve una fotografía, por defecto.
 *
 * Es el ancho con el que entra cada escaneo nuevo; después se puede corregir
 * foto a foto en su ficha. No toca el fichero guardado —ese es siempre el
 * mismo, hasta 2400 px de lado mayor— sino cuántos píxeles pide el navegador,
 * así que cambiarlo no estropea nada y se puede deshacer.
 */
async function consultar(): Promise<number> {
  try {
    const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_ANCHO } });
    const valor = Number(fila?.valor);
    const vale = ANCHOS_DISPONIBLES.some((a) => a.valor === valor);
    return vale ? valor : ANCHO_POR_DEFECTO;
  } catch {
    return ANCHO_POR_DEFECTO;
  }
}

export function anchoDeLasFotos(): Promise<number> {
  return enCache("sitio:ancho", 300, consultar);
}

/** Sin caché: el panel lee lo que hay en la base al abrir el formulario. */
export function anchoGuardado(): Promise<number> {
  return consultar();
}
