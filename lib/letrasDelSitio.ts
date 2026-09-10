import { enCache } from "@/lib/cache";
import { CLAVE_LETRAS, enCatalogo, type Pareja } from "@/lib/letras";
import { prisma } from "@/lib/prisma";

/**
 * La pareja de letras elegida. La pide la maqueta de raíz en cada visita, así
 * que va por la caché; el panel la tira al guardar.
 *
 * Lo que no esté en el catálogo cae en la de fábrica: si mañana se retira una
 * pareja, el sitio sigue con letra en vez de quedarse con la del sistema.
 */
async function consultar(): Promise<Pareja> {
  try {
    const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_LETRAS } });
    return enCatalogo(fila?.valor ?? "");
  } catch {
    return enCatalogo("");
  }
}

export function letrasDelSitio(): Promise<Pareja> {
  return enCache("sitio:letras", 300, consultar);
}

/** Sin caché: el panel lee lo que hay en la base al abrir el formulario. */
export function letrasGuardadas(): Promise<Pareja> {
  return consultar();
}
