import { AVISO_POR_DEFECTO, type Aviso } from "@/lib/aviso";
import { enCache } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

/**
 * El aviso vive en Ajuste para que se pueda corregir desde el panel sin tocar
 * el código. Si todavía no se ha guardado ninguno, sale el del autor.
 */
async function consultarAviso(): Promise<Aviso> {
  const fila = await prisma.ajuste.findUnique({ where: { clave: "sitio.aviso" } });
  if (!fila?.valor) return { ...AVISO_POR_DEFECTO, parrafos: [...AVISO_POR_DEFECTO.parrafos] };

  try {
    const leido = JSON.parse(fila.valor) as Partial<Aviso>;
    if (!Array.isArray(leido.parrafos) || leido.parrafos.length === 0) {
      throw new Error("aviso sin párrafos");
    }
    return {
      version: leido.version ?? AVISO_POR_DEFECTO.version,
      titulo: leido.titulo ?? AVISO_POR_DEFECTO.titulo,
      parrafos: leido.parrafos,
      boton: leido.boton ?? AVISO_POR_DEFECTO.boton,
    };
  } catch {
    return { ...AVISO_POR_DEFECTO, parrafos: [...AVISO_POR_DEFECTO.parrafos] };
  }
}

/** Lo pide el layout en cada página, así que va por la caché. */
export function avisoDelSitio(): Promise<Aviso> {
  return enCache("sitio:aviso", 300, consultarAviso);
}
