import { enCache } from "@/lib/cache";
import {
  CLAVE_TIPOGRAFIA,
  type Tipografia,
  TIPOGRAFIA_POR_DEFECTO,
} from "@/lib/tipografia";
import { prisma } from "@/lib/prisma";

/**
 * Cómo se lee el sitio. La pide la maqueta de raíz en cada visita, así que va
 * por la caché; el panel la tira al guardar.
 *
 * Lo que venga torcido cae en lo de fábrica: un JSON mal escrito a mano en la
 * base deja el sitio con la medida de siempre, no sin medida.
 */
async function consultar(): Promise<Tipografia> {
  try {
    const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_TIPOGRAFIA } });
    if (!fila?.valor) return { ...TIPOGRAFIA_POR_DEFECTO };

    const leido = JSON.parse(fila.valor) as Partial<Tipografia>;
    return {
      tamano: leido.tamano ?? TIPOGRAFIA_POR_DEFECTO.tamano,
      interlineado: leido.interlineado ?? TIPOGRAFIA_POR_DEFECTO.interlineado,
      medida: leido.medida ?? TIPOGRAFIA_POR_DEFECTO.medida,
    };
  } catch {
    return { ...TIPOGRAFIA_POR_DEFECTO };
  }
}

export function tipografiaDelSitio(): Promise<Tipografia> {
  return enCache("sitio:tipografia", 300, consultar);
}

/** Sin caché: el panel lee lo que hay en la base al abrir el formulario. */
export function tipografiaGuardada(): Promise<Tipografia> {
  return consultar();
}
