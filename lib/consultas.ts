import { enCache } from "@/lib/cache";
import { CLAVE_APERTURA, CLAVE_HOJA } from "@/lib/portada";
import { prisma } from "@/lib/prisma";
import { CLAVE_RETRATO, type RetratoDeSobreMi } from "@/lib/sobreMi";

/**
 * Qué cuenta como obra a la hora de enseñarla en el sitio.
 *
 * «Publicada» no basta. Una fotografía puede estar publicada sin ser obra: la
 * que se sube desde /admin/portada para abrir el sitio entra publicada en el
 * mismo gesto —si no, no se podría poner de apertura— y necesita un rollo,
 * porque es lo que sostiene el archivo. Sin más filtro, ese rollo aparecía en
 * /archivo como una fila «Sin serie», se colaba en el buscador, y como se abre
 * con la fecha de hoy se convertía además en la hoja del mes de la portada.
 *
 * Lo que separa una cosa de la otra es la serie: la mesa de luz no deja
 * publicar un fotograma sin asignarlo a una, así que «tiene serie» es
 * exactamente «se subió como obra».
 *
 * Esto lo usa lo que mira el público. El panel no: allí hay que verlo todo,
 * incluida la que sólo sirve de portada.
 */
export const OBRA_PUBLICADA = {
  estado: "publicada",
  series: { some: {} },
} as const;

/** Lo mínimo para pintar un fotograma en una hoja de contactos. */
export const seleccionFoto = {
  id: true,
  orden: true,
  archivo: true,
  alt: true,
  titulo: true,
  ancho: true,
  alto: true,
  anchoMax: true,
} as const;

function consultarSeriesVisibles() {
  return prisma.serie.findMany({
    where: { estado: { not: "oculta" } },
    orderBy: { orden: "asc" },
    include: {
      portada: { select: seleccionFoto },
      _count: { select: { fotos: true } },
      fotos: {
        where: { foto: { estado: "publicada" } },
        orderBy: { posicion: "asc" },
        take: 4,
        include: { foto: { select: seleccionFoto } },
      },
    },
  });
}

/**
 * Series que se enseñan al público: todo menos las ocultas.
 *
 * Va por la caché, como el resto de lo que pinta la portada. El tope de tiempo
 * es sólo la red de seguridad: el panel tira la caché en cada cambio, así que
 * lo que edites se ve al momento.
 */
export function seriesVisibles() {
  return enCache("series", 120, consultarSeriesVisibles);
}

export async function serieporSlug(slug: string) {
  return prisma.serie.findFirst({
    where: { slug, estado: { not: "oculta" } },
    include: {
      fotos: {
        where: { foto: { estado: "publicada" } },
        orderBy: { posicion: "asc" },
        include: { foto: true },
      },
      entradas: {
        where: { entrada: { estado: "publica" } },
        include: { entrada: true },
      },
    },
  });
}

async function consultarFotoDeApertura() {
  const ajuste = await prisma.ajuste.findUnique({
    where: { clave: CLAVE_APERTURA },
    include: {
      foto: {
        include: {
          series: { include: { serie: true }, orderBy: { principal: "desc" } },
          rollo: true,
        },
      },
    },
  });
  if (ajuste?.foto) return ajuste.foto;

  return prisma.foto.findFirst({
    where: { estado: "publicada" },
    orderBy: { fecha: "desc" },
    include: {
      series: { include: { serie: true }, orderBy: { principal: "desc" } },
      rollo: true,
    },
  });
}

/** La foto de apertura de la portada; si nadie la ha fijado, la última publicada. */
export function fotoDeApertura() {
  return enCache("portada:apertura", 120, consultarFotoDeApertura);
}

async function consultarHojaDelMes() {
  const ajuste = await prisma.ajuste.findUnique({
    where: { clave: CLAVE_HOJA },
  });

  const donde = ajuste?.valor ? { id: ajuste.valor } : {};
  return prisma.rollo.findFirst({
    where: { ...donde, fotos: { some: OBRA_PUBLICADA } },
    orderBy: { fecha: "desc" },
    include: {
      fotos: {
        where: OBRA_PUBLICADA,
        orderBy: { orden: "asc" },
        select: {
          ...seleccionFoto,
          series: {
            orderBy: { principal: "desc" },
            take: 1,
            include: { serie: { select: { nombre: true, slug: true } } },
          },
        },
      },
    },
  });
}

/** La hoja del mes: el rollo elegido en el panel o el último con fotos publicadas. */
export function hojaDelMes() {
  return enCache("portada:hoja", 120, consultarHojaDelMes);
}

/** Dirección pública de una foto: /series/[slug]/[posición]. */
export function rutaDeFoto(foto: {
  series: { posicion: number; serie: { slug: string } }[];
}) {
  const principal = foto.series[0];
  if (!principal) return null;
  return `/series/${principal.serie.slug}/${principal.posicion}`;
}

/**
 * Lo que se ha usado de verdad en el archivo, contado sobre las fotos
 * publicadas. Cuando la ficha de la foto no dice nada, manda la del rollo:
 * los datos comunes del lote se rellenan una sola vez al escanear.
 *
 * Se cuenta en memoria y no con `groupBy` porque el archivo es pequeño y
 * porque hay que resolver antes ese respaldo del rollo.
 */
async function consultarEquipoDelArchivo() {
  const fotos = await prisma.foto.findMany({
    where: { estado: "publicada" },
    select: {
      camara: true,
      optica: true,
      pelicula: true,
      revelado: true,
      rollo: {
        select: { camara: true, optica: true, pelicula: true, revelado: true },
      },
    },
  });

  const contar = (campo: "camara" | "optica" | "pelicula" | "revelado") => {
    const veces = new Map<string, number>();
    for (const f of fotos) {
      const valor = (f[campo] ?? f.rollo[campo] ?? "").trim();
      if (!valor) continue;
      veces.set(valor, (veces.get(valor) ?? 0) + 1);
    }
    return [...veces]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .map(([nombre, cuantas]) => ({ nombre, cuantas }));
  };

  return {
    camaras: contar("camara"),
    opticas: contar("optica"),
    peliculas: contar("pelicula"),
    revelados: contar("revelado"),
  };
}

/**
 * Lo que se ha usado de verdad en el archivo. Es la consulta más cara del
 * sitio —recorre todas las fotos publicadas— y la que menos cambia, así que
 * es la que más gana con la caché.
 */
export function equipoDelArchivo() {
  return enCache("sobre-mi:equipo", 300, consultarEquipoDelArchivo);
}

/** Las últimas copias publicadas, para acompañar un texto con imagen. */
export function tiraReciente(cuantas: number) {
  return enCache(`tira:${cuantas}`, 120, () =>
    consultarTiraReciente(cuantas),
  );
}

function consultarTiraReciente(cuantas: number) {
  return prisma.foto.findMany({
    where: { estado: "publicada" },
    orderBy: [{ fecha: "desc" }, { creadaEn: "desc" }],
    take: cuantas,
    select: {
      ...seleccionFoto,
      series: {
        orderBy: { principal: "desc" },
        take: 1,
        include: { serie: { select: { nombre: true, slug: true } } },
      },
    },
  });
}

/* -------------------------------------------------------- retrato de autor */

async function consultarRetratoDeSobreMi(): Promise<RetratoDeSobreMi | null> {
  const ajuste = await prisma.ajuste.findUnique({
    where: { clave: CLAVE_RETRATO },
    include: { foto: { select: seleccionFoto } },
  });
  if (!ajuste?.foto) return null;

  const { id, archivo, alt, titulo, ancho, alto, anchoMax } = ajuste.foto;
  return {
    foto: { id, archivo, alt, titulo, ancho, alto, anchoMax },
    pie: ajuste.valor?.trim() ?? "",
  };
}

/**
 * La fotografía que acompaña a /sobre-mi, si se ha elegido alguna en el
 * panel. Devuelve `null` mientras no haya ninguna: la página se monta igual
 * sin ella, que es lo que evita tener que dejar puesta una de relleno.
 */
export function retratoDeSobreMi() {
  return enCache("sobre-mi:retrato", 300, consultarRetratoDeSobreMi);
}

/* ------------------------------------------------------------- entradas */

function consultarUltimaEntrada() {
  return prisma.entrada.findFirst({
    where: { estado: "publica", publicadoEn: { not: null } },
    orderBy: { publicadoEn: "desc" },
    select: {
      id: true,
      slug: true,
      titulo: true,
      publicadoEn: true,
      imagen: { select: { archivo: true } },
      temas: { take: 1, include: { tema: { select: { nombre: true } } } },
    },
  });
}

/**
 * El último texto publicado, para la portada. Sin fecha de publicación no
 * entra: es lo que ordena las entradas y el archivo, y una entrada sin ella no
 * sabría dónde ponerse.
 */
export function ultimaEntrada() {
  return enCache("portada:ultima-entrada", 120, consultarUltimaEntrada);
}
