import { prisma } from "@/lib/prisma";
import { aSlug } from "@/lib/texto";

/**
 * El traslado de Blogger, en un sitio al que llegan los dos caminos: el panel
 * (con el XML de la copia de seguridad) y el script que baja el feed público.
 * Que compartan esto es lo que evita dos reglas distintas para lo mismo.
 */

export type EntradaParaTrasladar = {
  titulo: string;
  fecha: string | null;
  urlAntigua: string | null;
  texto: string;
  palabras: number;
  /** "" o sin poner = a las entradas; si no, id de la serie de destino */
  destino?: string;
};

export type ResumenDelTraslado = {
  creadas: number;
  repetidas: number;
  redirecciones: number;
  /** Lo creado, por si hay que colgarle las fotos en un segundo paso. */
  nuevas: { id: string; slug: string; urlAntigua: string | null }[];
};

export async function trasladarEntradas(
  lote: EntradaParaTrasladar[],
): Promise<ResumenDelTraslado> {
  const resumen: ResumenDelTraslado = {
    creadas: 0,
    repetidas: 0,
    redirecciones: 0,
    nuevas: [],
  };

  for (const e of lote) {
    const base = aSlug(e.titulo) || "entrada";
    let slug = base;

    // La dirección antigua es la identidad de verdad: dos entradas pueden
    // llamarse igual, pero cada una vivía en su sitio.
    const ya = await prisma.entrada.findFirst({
      where: e.urlAntigua ? { urlAntigua: e.urlAntigua } : { slug: base },
    });
    if (ya) {
      resumen.repetidas += 1;
      continue;
    }

    let n = 2;
    while (await prisma.entrada.findUnique({ where: { slug } })) slug = `${base}-${n++}`;

    const parrafos = e.texto
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((texto) => ({ tipo: "p", texto }));

    const fecha = e.fecha ? new Date(e.fecha) : null;
    const conFecha = fecha !== null && !Number.isNaN(fecha.getTime());

    const creada = await prisma.entrada.create({
      data: {
        slug,
        titulo: e.titulo,
        entradilla: parrafos[0]?.texto.slice(0, 240) ?? null,
        cuerpo: JSON.stringify(parrafos),
        // Todo entra publicado con su fecha de siempre: el archivo no cambia.
        estado: conFecha ? "publica" : "borrador",
        publicadoEn: conFecha ? fecha : null,
        palabras: e.palabras,
        urlAntigua: e.urlAntigua,
      },
    });
    resumen.creadas += 1;
    resumen.nuevas.push({ id: creada.id, slug, urlAntigua: e.urlAntigua });

    if (e.destino) {
      await prisma.entradaEnSerie
        .create({ data: { entradaId: creada.id, serieId: e.destino } })
        .catch(() => undefined);
    }

    if (e.urlAntigua) {
      await prisma.redireccion.upsert({
        where: { desde: e.urlAntigua },
        create: { desde: e.urlAntigua, hacia: `/entradas/${slug}` },
        update: { hacia: `/entradas/${slug}` },
      });
      resumen.redirecciones += 1;
    }
  }

  return resumen;
}
