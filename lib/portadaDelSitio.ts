import { enCache } from "@/lib/cache";
import {
  CLAVE_SECCIONES,
  type ClaveDeSeccion,
  enCatalogo,
  ordenar,
  SECCIONES_POR_DEFECTO,
  type SeccionDePortada,
} from "@/lib/portada";
import { prisma } from "@/lib/prisma";

/**
 * Las secciones de la portada, en el orden en que se van a pintar. Si lo
 * guardado viene torcido salen las de fábrica: la portada es lo primero que
 * ve nadie y no puede quedarse en blanco por un JSON mal escrito.
 */
async function consultarSecciones(): Promise<SeccionDePortada[]> {
  const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_SECCIONES } });
  if (!fila?.valor) return [...SECCIONES_POR_DEFECTO];

  try {
    const leido = JSON.parse(fila.valor);
    if (!Array.isArray(leido)) throw new Error("no es una lista");

    // La sección de textos se llamaba «cuaderno»: una portada guardada con
    // ese nombre conserva su sitio y su interruptor en vez de volver de fábrica.
    return ordenar(
      leido.map((s) => ({
        clave: (s?.clave === "cuaderno"
          ? "entradas"
          : String(s?.clave ?? "")) as ClaveDeSeccion,
        visible: s?.visible !== false,
        titulo: typeof s?.titulo === "string" ? s.titulo.trim() : undefined,
      })),
    );
  } catch {
    return [...SECCIONES_POR_DEFECTO];
  }
}

/** La pide la portada en cada visita, así que va por la caché; el panel la tira al guardar. */
export function seccionesDePortada(): Promise<SeccionDePortada[]> {
  return enCache("portada:secciones", 300, consultarSecciones);
}

/** Sin caché: el panel lee lo que hay en la base al abrir el formulario. */
export function seccionesGuardadas(): Promise<SeccionDePortada[]> {
  return consultarSecciones();
}

/** El rótulo de una sección: el escrito en el panel o el de fábrica. */
export function tituloDeSeccion(seccion: SeccionDePortada): string {
  return seccion.titulo?.trim() || enCatalogo(seccion.clave)?.tituloPorDefecto || "";
}
