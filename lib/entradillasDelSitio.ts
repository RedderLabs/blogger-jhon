import { enCache } from "@/lib/cache";
import {
  CLAVE_ENTRADILLAS,
  type ClaveDeEntradilla,
  type Entradillas,
  ENTRADILLAS_POR_DEFECTO,
} from "@/lib/entradillas";
import { prisma } from "@/lib/prisma";

/**
 * Los párrafos de presentación de /entradas y /archivo.
 *
 * Las dos páginas los piden en cada visita, así que van por la caché; el panel
 * la tira al guardar. Un campo en blanco vuelve al de fábrica: una cabecera
 * con el título a solas y un hueco debajo no es una opción.
 */
async function consultar(): Promise<Entradillas> {
  try {
    const fila = await prisma.ajuste.findUnique({
      where: { clave: CLAVE_ENTRADILLAS },
    });
    if (!fila?.valor) return { ...ENTRADILLAS_POR_DEFECTO };

    const leido = JSON.parse(fila.valor) as Partial<Entradillas>;
    const campo = (nombre: ClaveDeEntradilla) =>
      (typeof leido[nombre] === "string" ? leido[nombre].trim() : "") ||
      ENTRADILLAS_POR_DEFECTO[nombre];

    return { entradas: campo("entradas"), archivo: campo("archivo") };
  } catch {
    return { ...ENTRADILLAS_POR_DEFECTO };
  }
}

export function entradillasDelSitio(): Promise<Entradillas> {
  return enCache("sitio:entradillas", 300, consultar);
}

/** Sin caché: el panel lee lo que hay en la base al abrir el formulario. */
export function entradillasGuardadas(): Promise<Entradillas> {
  return consultar();
}
