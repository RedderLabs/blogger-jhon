import { enCache } from "@/lib/cache";
import {
  CLAVE_PERCANCE,
  type ClaveDePercance,
  enCatalogo,
  type Percance,
  type PercanceCompleto,
  POR_DEFECTO,
} from "@/lib/percances";
import { prisma } from "@/lib/prisma";

/**
 * El texto y la fotografía de una página de error.
 *
 * Un campo en blanco vuelve al de fábrica, y un JSON roto devuelve la página
 * entera de fábrica: esto es lo que se pinta justamente cuando algo ya ha ido
 * mal, así que no puede ser una segunda cosa que se rompa.
 */
async function consultar(clave: ClaveDePercance): Promise<PercanceCompleto> {
  const fabrica = POR_DEFECTO[clave];
  const codigo = enCatalogo(clave)?.codigo ?? "Error";

  try {
    const fila = await prisma.ajuste.findUnique({
      where: { clave: CLAVE_PERCANCE[clave] },
      include: {
        foto: {
          select: { archivo: true, alt: true, ancho: true, alto: true, anchoMax: true },
        },
      },
    });

    const escrito: Partial<Percance> = fila?.valor ? JSON.parse(fila.valor) : {};
    const campo = (nombre: keyof Percance) =>
      (typeof escrito[nombre] === "string" ? escrito[nombre].trim() : "") ||
      fabrica[nombre];

    return {
      codigo,
      rotulo: campo("rotulo"),
      titulo: campo("titulo"),
      texto: campo("texto"),
      imagen: fila?.foto ?? null,
    };
  } catch {
    return { codigo, ...fabrica, imagen: null };
  }
}

/** Va por la caché como el resto de textos del sitio; el panel la tira al guardar. */
export function percanceDelSitio(clave: ClaveDePercance): Promise<PercanceCompleto> {
  return enCache(`sitio:percance:${clave}`, 300, () => consultar(clave));
}

/** Sin caché: el panel lee lo que hay en la base al abrir el formulario. */
export function percanceGuardado(clave: ClaveDePercance): Promise<PercanceCompleto> {
  return consultar(clave);
}

/** Qué fotografía tiene puesta cada uno, para marcarla en el panel. */
export async function fotosDeLosPercances(): Promise<
  Record<ClaveDePercance, string | null>
> {
  const filas = await prisma.ajuste.findMany({
    where: { clave: { in: Object.values(CLAVE_PERCANCE) } },
    select: { clave: true, fotoId: true },
  });

  const de = (clave: ClaveDePercance) =>
    filas.find((f) => f.clave === CLAVE_PERCANCE[clave])?.fotoId ?? null;

  return { "404": de("404"), "500": de("500") };
}
