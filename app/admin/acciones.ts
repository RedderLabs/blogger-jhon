"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import bcrypt from "bcryptjs";

import { auth } from "@/lib/auth";
import {
  borrar as borrarDelAlmacen,
  claveDeRuta,
  huella,
  traerBytes,
} from "@/lib/almacen";
import { huellaVisual } from "@/lib/parecido";
import { olvidar } from "@/lib/cache";
import {
  quitarFotoDelCuerpo,
  sanearCuerpo,
  textoDelCuerpo,
} from "@/lib/cuerpo";
import { aSlug } from "@/lib/texto";
import { trasladarEntradas } from "@/lib/traslado";
import { anotarMudanza } from "@/lib/redirecciones";
import { CLAVE_CORREO, CLAVE_REDES } from "@/lib/datosDeContacto";
import {
  CLAVE_IDENTIDAD,
  type Identidad,
  IDENTIDAD_POR_DEFECTO,
  TOPES as TOPES_IDENTIDAD,
} from "@/lib/identidad";
import {
  CLAVE_ENTRADILLAS,
  type ClaveDeEntradilla,
  type Entradillas,
  ENTRADILLAS_POR_DEFECTO,
  TOPE as TOPE_ENTRADILLA,
} from "@/lib/entradillas";
import {
  CLAVE_LEGAL,
  type ClaveLegal,
  deFabrica as legalDeFabrica,
  esClaveLegal,
  type Legal,
  mismasSecciones,
  type SeccionLegal,
  TOPES as TOPES_LEGALES,
} from "@/lib/legales";
import { CLAVE_LETRAS, PAREJAS } from "@/lib/letras";
import {
  CATALOGO_DE_PAGINAS,
  CLAVE_PAGINAS,
  type ClaveDePagina,
  type Paginas,
  PAGINAS_POR_DEFECTO,
} from "@/lib/paginas";
import {
  CLAVE_CONTACTO,
  type PaginaDeContacto,
  TEXTOS_POR_DEFECTO,
  TOPES,
} from "@/lib/paginaContacto";
import {
  CLAVE_PERCANCE,
  type ClaveDePercance,
  enCatalogo as percanceEnCatalogo,
  POR_DEFECTO as PERCANCE_POR_DEFECTO,
  TOPES as TOPES_PERCANCE,
} from "@/lib/percances";
import { CLAVE_PIE, TOPE_NOTA_PIE } from "@/lib/pie";
import {
  CLAVE_APERTURA,
  CLAVE_HOJA,
  CLAVE_SECCIONES,
  enCatalogo,
  ordenar,
  type SeccionDePortada,
  TOPE_TITULO,
} from "@/lib/portada";
import {
  CLAVE_RETRATO,
  CLAVE_TEXTO,
  type SobreMi,
  TOPE_PIE_RETRATO,
  TOPES_TEXTO,
} from "@/lib/sobreMi";
import { CLAVE_ID, CLAVE_PANEL, CLAVE_SCRIPT, falloDelPanel } from "@/lib/umami";
import { type CuentaEnRed, falloDeCuenta, limpiarUsuario, red } from "@/lib/redes";
import { ANCHOS_DISPONIBLES, ANCHO_POR_DEFECTO, CLAVE_ANCHO } from "@/lib/fotos";
import {
  CLAVE_TIPOGRAFIA,
  INTERLINEADOS,
  MEDIDAS,
  TAMANOS,
} from "@/lib/tipografia";
import { prisma } from "@/lib/prisma";

/** Todas las acciones pasan por aquí: sin sesión no se toca la base. */
async function exigirSesion() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error("No autorizado");
  return sesion;
}

/**
 * Después de tocar cualquier cosa: se tira la caché y se invalida lo que Next
 * tenga guardado. En ese orden, y esperando a las dos: si se devolviera antes,
 * la página que se pinta a continuación podría leer todavía lo viejo.
 */
async function refrescarTodo() {
  await olvidar();
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------------ fotos */

export async function asignarASerie(fotoIds: string[], serieId: string) {
  await exigirSesion();
  if (fotoIds.length === 0) return;

  const ultima = await prisma.fotoEnSerie.aggregate({
    where: { serieId },
    _max: { posicion: true },
  });
  let siguiente = (ultima._max.posicion ?? 0) + 1;

  for (const fotoId of fotoIds) {
    const ya = await prisma.fotoEnSerie.findUnique({
      where: { fotoId_serieId: { fotoId, serieId } },
    });
    if (ya) continue;

    const cuantas = await prisma.fotoEnSerie.count({ where: { fotoId } });
    await prisma.fotoEnSerie.create({
      data: {
        fotoId,
        serieId,
        posicion: siguiente++,
        // Si es la primera serie de la foto, manda: es la que sale en la ficha.
        principal: cuantas === 0,
      },
    });
  }

  // Una serie sin portada se queda con la primera foto que entra.
  const serie = await prisma.serie.findUnique({ where: { id: serieId } });
  if (serie && !serie.portadaId) {
    await prisma.serie.update({
      where: { id: serieId },
      data: { portadaId: fotoIds[0] },
    });
  }

  await refrescarTodo();
}

export async function quitarDeSeries(fotoIds: string[]) {
  await exigirSesion();
  if (fotoIds.length === 0) return;
  await prisma.fotoEnSerie.deleteMany({ where: { fotoId: { in: fotoIds } } });
  await refrescarTodo();
}

export async function publicarFotos(fotoIds: string[]) {
  await exigirSesion();
  if (fotoIds.length === 0) return;

  // El texto alternativo es obligatorio antes de publicar: no se salta.
  const sinAlt = await prisma.foto.count({
    where: { id: { in: fotoIds }, alt: "" },
  });
  if (sinAlt > 0) {
    return {
      error: `${sinAlt} ${sinAlt === 1 ? "fotograma sigue" : "fotogramas siguen"} sin texto alternativo.`,
    };
  }

  await prisma.foto.updateMany({
    where: { id: { in: fotoIds } },
    data: { estado: "publicada" },
  });
  await refrescarTodo();
  return { ok: true };
}

export async function despublicarFotos(fotoIds: string[]) {
  await exigirSesion();
  await prisma.foto.updateMany({
    where: { id: { in: fotoIds } },
    data: { estado: "borrador" },
  });
  await refrescarTodo();
}

const fichaDeFoto = z.object({
  titulo: z.string().trim().min(1).max(200),
  alt: z.string().trim().max(600),
  nota: z.string().trim().max(4000),
  camara: z.string().trim().max(120),
  optica: z.string().trim().max(120),
  pelicula: z.string().trim().max(120),
  ei: z.string().trim().max(40),
  apertura: z.string().trim().max(40),
  velocidad: z.string().trim().max(40),
  revelado: z.string().trim().max(160),
  escaneo: z.string().trim().max(160),
  lugar: z.string().trim().max(160),
  anchoMax: z.coerce.number().int().min(0).max(6000),
});

export async function guardarFoto(id: string, datos: FormData) {
  await exigirSesion();

  const leido = fichaDeFoto.safeParse(Object.fromEntries(datos));
  if (!leido.success) return { error: "Hay algún campo que no cuadra." };

  const d = leido.data;
  const vacioANulo = (s: string) => (s === "" ? null : s);

  await prisma.foto.update({
    where: { id },
    data: {
      titulo: d.titulo,
      alt: d.alt,
      nota: vacioANulo(d.nota),
      camara: vacioANulo(d.camara),
      optica: vacioANulo(d.optica),
      pelicula: vacioANulo(d.pelicula),
      ei: vacioANulo(d.ei),
      apertura: vacioANulo(d.apertura),
      velocidad: vacioANulo(d.velocidad),
      revelado: vacioANulo(d.revelado),
      escaneo: vacioANulo(d.escaneo),
      lugar: vacioANulo(d.lugar),
      anchoMax: d.anchoMax,
    },
  });

  await refrescarTodo();
  return { ok: true };
}

/**
 * El texto alternativo, suelto.
 *
 * `guardarFoto` pide la ficha entera y aquí sobra: lo único que impide poner
 * de apertura una fotografía en borrador es que no tenga alt —sin él no se
 * publica nada—, así que se escribe en la propia portada en vez de mandar a
 * quien la esté eligiendo a otra pantalla y de vuelta.
 */
export async function guardarAltDeFoto(id: string, alt: string) {
  await exigirSesion();

  const limpio = alt.trim();
  if (!limpio) return { error: "Ese texto no puede quedarse vacío." };
  if (limpio.length > 600) return { error: "Son 600 caracteres como mucho." };

  await prisma.foto.update({ where: { id }, data: { alt: limpio } });
  await refrescarTodo();
  return { ok: true };
}

/* --------------------------------------------------------------- galería */

/**
 * Calcula la huella de las fotografías que aún no la tienen, de tanda en
 * tanda.
 *
 * Va por tandas y no de una vez porque son una petición al cubo por fotografía
 * y un archivo grande dejaría la pantalla colgada sin decir nada. La página
 * llama a esto hasta que no queda ninguna, y mientras tanto va enseñando
 * cuántas faltan.
 */
export async function calcularHuellas(cuantas = 20) {
  await exigirSesion();

  const pendientes = await prisma.foto.findMany({
    where: { OR: [{ hash: null }, { visual: null }] },
    select: { id: true, archivo: true, hash: true, visual: true },
    take: Math.min(Math.max(cuantas, 1), 60),
  });

  let hechas = 0;
  for (const f of pendientes) {
    const clave = claveDeRuta(f.archivo);
    if (!clave) continue;

    const datos: { hash?: string; visual?: string } = {};

    // La del fichero sale del ETag del cubo: una pregunta, sin descargar nada.
    if (!f.hash) {
      const h = await huella(clave);
      if (h) datos.hash = h;
    }

    // La de lo que se ve obliga a traerse la fotografía. Es lo caro de todo
    // esto, y por eso se guarda: se paga una vez por fotografía.
    if (!f.visual) {
      const bytes = await traerBytes(clave);
      if (bytes) {
        try {
          datos.visual = await huellaVisual(bytes);
        } catch {
          // Un fichero que sharp no sabe leer se queda sin huella visual en vez
          // de tumbar la tanda entera.
        }
      }
    }

    if (Object.keys(datos).length === 0) continue;
    await prisma.foto.update({ where: { id: f.id }, data: datos });
    hechas++;
  }

  const faltan = await prisma.foto.count({
    where: { OR: [{ hash: null }, { visual: null }] },
  });
  await refrescarTodo();
  return { ok: true, hechas, faltan };
}

/**
 * Borra fotografías del archivo, sin más.
 *
 * Es lo que hace el borrado suelto de la galería: se marca lo que sobra y se
 * va. Lo que apuntaba a esas fotografías se queda sin ellas —la base pone a
 * nulo la portada de la serie, la imagen de la entrada y lo fijado en los
 * ajustes—, y las que estuvieran metidas dentro del cuerpo de una entrada se
 * quitan de ahí: es mejor que el texto se cierre solo a que quede un hueco
 * diciendo que falta una fotografía.
 *
 * Para las repetidas está `borrarDuplicadas`, que en vez de dejar huecos
 * reapunta todo a la copia que se conserva.
 */
export async function borrarFotos(ids: string[]) {
  await exigirSesion();
  if (ids.length === 0) return { error: "No hay ninguna marcada." };

  const fotos = await prisma.foto.findMany({
    where: { id: { in: ids } },
    select: { id: true, archivo: true, archivoOriginal: true },
  });
  if (fotos.length === 0) return { error: "Esas fotografías ya no están." };

  // Fuera del cuerpo de las entradas que las llevaran dentro.
  const entradas = await prisma.entrada.findMany({ select: { id: true, cuerpo: true } });
  for (const e of entradas) {
    let cuerpo = e.cuerpo;
    for (const f of fotos) {
      if (!cuerpo.includes(f.id)) continue;
      cuerpo = quitarFotoDelCuerpo(cuerpo, f.id);
    }
    if (cuerpo !== e.cuerpo) {
      await prisma.entrada.update({ where: { id: e.id }, data: { cuerpo } });
    }
  }

  for (const f of fotos) {
    const clave = claveDeRuta(f.archivo);
    if (clave) {
      try {
        await borrarDelAlmacen(clave);
      } catch {
        // El cubo puede haberlo perdido antes; la fila se va igual.
      }
    }
    if (f.archivoOriginal) {
      try {
        await borrarDelAlmacen(f.archivoOriginal);
      } catch {
        // Igual: el original es para rehacer copias, no para servir.
      }
    }
  }

  const { count } = await prisma.foto.deleteMany({ where: { id: { in: fotos.map((f) => f.id) } } });

  await refrescarTodo();
  return { ok: true, borradas: count };
}

/**
 * Borra fotografías repetidas y deja en su sitio la que se conserva.
 *
 * Borrar a secas dejaría entradas apuntando a una fotografía que ya no está
 * —el cuerpo las nombra por su identificador, y eso no lo vigila la base—, así
 * que antes de borrar se reapunta todo lo que las nombraba: el cuerpo de las
 * entradas, su imagen de cabecera, la portada de una serie y lo que hubiera
 * fijado en los ajustes. Lo que se pierde es el fichero repetido, no el sitio
 * donde se enseñaba.
 */
export async function borrarDuplicadas(quedaId: string, borrarIds: string[]) {
  await exigirSesion();

  const fuera = borrarIds.filter((id) => id !== quedaId);
  if (fuera.length === 0) return { error: "No hay ninguna marcada para borrar." };

  const queda = await prisma.foto.findUnique({ where: { id: quedaId } });
  if (!queda) return { error: "La fotografía que se queda ya no está." };

  const aBorrar = await prisma.foto.findMany({
    where: { id: { in: fuera } },
    select: { id: true, archivo: true, archivoOriginal: true },
  });

  // 1. El cuerpo de las entradas: `[foto:ID]` es texto, no una relación.
  const entradas = await prisma.entrada.findMany({ select: { id: true, cuerpo: true } });
  for (const e of entradas) {
    let cuerpo = e.cuerpo;
    for (const f of aBorrar) cuerpo = cuerpo.split(f.id).join(quedaId);
    if (cuerpo !== e.cuerpo) {
      await prisma.entrada.update({ where: { id: e.id }, data: { cuerpo } });
    }
  }

  // 2. La imagen de cabecera de una entrada.
  await prisma.entrada.updateMany({
    where: { imagenId: { in: fuera } },
    data: { imagenId: quedaId },
  });

  // 3. La portada de una serie. Es única por serie, así que una serie que ya
  //    tenga portada se queda con la suya y la repetida se suelta.
  const conPortada = await prisma.serie.findMany({
    where: { portadaId: { in: fuera } },
    select: { id: true },
  });
  for (const serie of conPortada) {
    const ocupada = await prisma.serie.findFirst({ where: { portadaId: quedaId } });
    await prisma.serie.update({
      where: { id: serie.id },
      data: { portadaId: ocupada ? null : quedaId },
    });
  }

  // 4. Lo fijado en los ajustes: la apertura de la portada y el retrato.
  await prisma.ajuste.updateMany({
    where: { fotoId: { in: fuera } },
    data: { fotoId: quedaId },
  });

  // 5. Las series a las que pertenecía y la que se queda no: se mueve el sitio
  //    en vez de perderlo.
  const enSeries = await prisma.fotoEnSerie.findMany({ where: { fotoId: { in: fuera } } });
  for (const rel of enSeries) {
    const ya = await prisma.fotoEnSerie.findUnique({
      where: { fotoId_serieId: { fotoId: quedaId, serieId: rel.serieId } },
    });
    if (!ya) {
      await prisma.fotoEnSerie.create({
        data: {
          fotoId: quedaId,
          serieId: rel.serieId,
          posicion: rel.posicion,
          principal: false,
        },
      });
    }
  }

  // 6. El fichero del cubo, y sólo entonces la fila. En este orden: una fila
  //    sin fichero se ve enseguida; un fichero sin fila no lo encuentra nadie.
  for (const f of aBorrar) {
    const clave = claveDeRuta(f.archivo);
    if (clave) {
      try {
        await borrarDelAlmacen(clave);
      } catch {
        // El cubo puede haberlo perdido antes; la fila se va igual.
      }
    }
    if (f.archivoOriginal) {
      try {
        await borrarDelAlmacen(f.archivoOriginal);
      } catch {
        // Igual: el original es para rehacer copias, no para servir.
      }
    }
  }

  await prisma.foto.deleteMany({ where: { id: { in: fuera } } });

  await refrescarTodo();
  return { ok: true, borradas: fuera.length };
}

/** Copia los datos comunes del lote en todos sus fotogramas. */
export async function aplicarFichaAlRollo(rolloId: string, datos: FormData) {
  await exigirSesion();

  const camara = String(datos.get("camara") ?? "").trim();
  const optica = String(datos.get("optica") ?? "").trim();
  const pelicula = String(datos.get("pelicula") ?? "").trim();
  const revelado = String(datos.get("revelado") ?? "").trim();
  const anchoMax = Number(datos.get("anchoMax") ?? ANCHO_POR_DEFECTO);

  await prisma.rollo.update({
    where: { id: rolloId },
    data: { camara, optica, pelicula, revelado },
  });

  await prisma.foto.updateMany({
    where: { rolloId },
    data: {
      camara: camara || null,
      optica: optica || null,
      pelicula: pelicula || null,
      revelado: revelado || null,
      anchoMax: Number.isFinite(anchoMax) ? anchoMax : ANCHO_POR_DEFECTO,
    },
  });

  await refrescarTodo();
  return { ok: true };
}

/* ----------------------------------------------------------------- series */


/* ---------------------------------------------------------------- portada */

/**
 * La fotografía grande de la portada.
 *
 * Sin nada fijado sale la última publicada, así que quitarla no deja la
 * portada sin imagen: la devuelve a que se mueva sola con el archivo.
 *
 * En el panel se pueden ver todas las del archivo, borradores incluidos, pero
 * a la portada sólo llega lo publicado. Elegir una en borrador no es un error
 * que haya que corregir en otra pantalla: se publica aquí mismo, con
 * `publicar`.
 *
 * **Aquí el texto alternativo no es obligatorio, y en el resto del panel sí.**
 * Lo decidió el usuario: casi todo el archivo trasladado del blog está en
 * borrador y sin alt, y exigirlo convertía «cambiar la fotografía de portada»
 * en un trámite de dos pantallas. `publicarFotos` sigue exigiéndolo para las
 * tandas de la mesa de luz. El panel avisa de que le falta y ofrece
 * escribirlo ahí mismo con `guardarAltDeFoto`, pero no lo impone.
 */
export async function fijarApertura(fotoId: string | null, publicar = false) {
  await exigirSesion();

  if (!fotoId) {
    await prisma.ajuste.deleteMany({ where: { clave: CLAVE_APERTURA } });
    await refrescarTodo();
    return { ok: true, porDefecto: true };
  }

  const foto = await prisma.foto.findUnique({
    where: { id: fotoId },
    select: { estado: true, alt: true },
  });
  if (!foto) return { error: "Esa fotografía ya no está en el archivo." };

  if (foto.estado !== "publicada") {
    if (!publicar) {
      return { error: "Esa fotografía está en borrador. Publícala para ponerla de apertura." };
    }
    await prisma.foto.update({ where: { id: fotoId }, data: { estado: "publicada" } });
  }

  await prisma.ajuste.upsert({
    where: { clave: CLAVE_APERTURA },
    create: { clave: CLAVE_APERTURA, fotoId },
    update: { fotoId },
  });
  await refrescarTodo();
  return {
    ok: true,
    publicada: foto.estado !== "publicada",
    sinAlt: !foto.alt.trim(),
  };
}

/** El rollo que se enseña como hoja de contactos; vacío = el último publicado. */
export async function fijarHojaDelMes(rolloId: string | null) {
  await exigirSesion();

  if (!rolloId) {
    await prisma.ajuste.deleteMany({ where: { clave: CLAVE_HOJA } });
    await refrescarTodo();
    return { ok: true, porDefecto: true };
  }

  await prisma.ajuste.upsert({
    where: { clave: CLAVE_HOJA },
    create: { clave: CLAVE_HOJA, valor: rolloId },
    update: { valor: rolloId },
  });
  await refrescarTodo();
  return { ok: true };
}

const seccionEditadaDePortada = z.object({
  clave: z.string().trim().max(20),
  visible: z.boolean(),
  titulo: z.string().trim().max(TOPE_TITULO).optional(),
});

/**
 * Qué piezas se enseñan en la portada, en qué orden y con qué rótulo.
 *
 * Se guardan las tres siempre, apagadas incluidas: el panel tiene que poder
 * volver a encender una, y una lista de la que desaparecen las apagadas no
 * conserva dónde estaban.
 */
export async function guardarSeccionesDePortada(secciones: SeccionDePortada[]) {
  await exigirSesion();

  const leido = z.array(seccionEditadaDePortada).max(10).safeParse(secciones);
  if (!leido.success) {
    return { error: `Un rótulo pasa de ${TOPE_TITULO} caracteres.` };
  }

  const limpias = ordenar(
    leido.data
      .filter((s) => enCatalogo(s.clave))
      .map((s) => ({
        clave: s.clave as SeccionDePortada["clave"],
        visible: s.visible,
        ...(s.titulo ? { titulo: s.titulo } : {}),
      })),
  );

  const valor = JSON.stringify(limpias);
  await prisma.ajuste.upsert({
    where: { clave: CLAVE_SECCIONES },
    create: { clave: CLAVE_SECCIONES, valor },
    update: { valor },
  });

  await refrescarTodo();
  return { ok: true, cuantas: limpias.filter((s) => s.visible).length };
}

/* --------------------------------------------------------------- entradas */

const entradaEditada = z.object({
  titulo: z.string().trim().min(2).max(200),
  kicker: z.string().trim().max(60),
  texto: z.string().trim().max(80000),
  estado: z.enum(["borrador", "programada", "publica"]),
  publicadoEn: z.string().trim().max(40),
  imagenId: z.string().trim().max(40),
});

/**
 * Un slug que no esté cogido. `salvo` es la entrada que se está guardando: su
 * propio slug no cuenta como ocupado, o renombrarla a lo que ya es le pondría
 * un número detrás sin motivo.
 */
async function slugLibreDeEntrada(base: string, salvo?: string) {
  let slug = base;
  let n = 2;
  for (;;) {
    const ya = await prisma.entrada.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!ya || ya.id === salvo) return slug;
    slug = `${base}-${n++}`;
  }
}

/**
 * ¿La dirección que tiene sigue siendo la que le toca a este título?
 *
 * Vale el propio `base` y también `base-2`, `base-3`…: si al crearla el nombre
 * estaba cogido se le puso un número detrás, y eso no es razón para
 * renombrarla otra vez cada vez que se guarda sin haber tocado el título.
 *
 * `base` sale de `aSlug`, así que sólo lleva letras, números y guiones: no hay
 * nada que escapar al meterlo en la expresión.
 */
const leCorresponde = (slug: string, base: string) =>
  slug === base || new RegExp(`^${base}-\d+$`).test(slug);

export async function guardarEntrada(id: string | null, datos: FormData) {
  await exigirSesion();

  const leido = entradaEditada.safeParse(Object.fromEntries(datos));
  if (!leido.success) return { error: "Falta el título o hay algún campo demasiado largo." };
  const d = leido.data;

  // El cuerpo llega en HTML desde el editor y se guarda saneado: lo que hay
  // en la base es exactamente lo que se va a servir.
  const cuerpo = sanearCuerpo(d.texto);
  const palabras = textoDelCuerpo(cuerpo).split(/\s+/).filter(Boolean).length;

  const temas = datos.getAll("temas").map(String);
  const series = datos.getAll("series").map(String);

  const fecha = d.publicadoEn ? new Date(d.publicadoEn) : null;
  if (fecha && Number.isNaN(fecha.getTime())) return { error: "Esa fecha no vale." };
  if (d.estado === "publica" && !fecha) {
    return { error: "Una entrada pública necesita fecha de publicación." };
  }
  // Programada sin cuándo es un borrador con otro nombre, y programada para
  // ayer no es nada: las dos se paran aquí y no en el navegador, que el panel
  // no es el único que puede llamar a esto.
  if (d.estado === "programada") {
    if (!fecha) return { error: "Dime cuándo se publica: día y hora." };
    if (fecha.getTime() <= Date.now()) {
      return {
        error:
          "Esa fecha ya ha pasado. Ponle una futura, o déjala en «Pública» si quieres que salga ya.",
      };
    }
  }

  const comun = {
    titulo: d.titulo,
    kicker: d.kicker || null,
    // `entradilla` ya no se escribe: la descripción breve se saca del cuerpo
    // al pintarla, con `resumenDelCuerpo`. La columna sigue en el esquema con
    // lo que se escribió en su día, pero no la lee nadie.
    cuerpo,
    estado: d.estado,
    publicadoEn: fecha,
    palabras,
    imagenId: d.imagenId || null,
  };

  let entradaId = id;
  const base = aSlug(d.titulo) || "entrada";
  let slug: string;
  let mudada = false;

  if (id) {
    const antes = await prisma.entrada.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!antes) return { error: "Esa entrada ya no está en la base." };

    slug = antes.slug;

    // La dirección sigue al título: corregir el título de una entrada y
    // dejarla viviendo en la dirección del título viejo era quedarse con la
    // errata puesta para siempre. Lo que no se pierde es la dirección
    // anterior, que queda apuntando a la nueva —ver `lib/redirecciones.ts`—:
    // sin eso, cada corrección rompería los enlaces que ya estén por ahí.
    if (!leCorresponde(antes.slug, base)) {
      slug = await slugLibreDeEntrada(base, id);
      if (slug !== antes.slug) {
        await anotarMudanza(antes.slug, slug);
        mudada = true;
      }
    }

    await prisma.entrada.update({ where: { id }, data: { ...comun, slug } });
  } else {
    slug = await slugLibreDeEntrada(base);
    const creada = await prisma.entrada.create({ data: { ...comun, slug } });
    entradaId = creada.id;
  }

  await prisma.entradaEnTema.deleteMany({ where: { entradaId: entradaId! } });
  await prisma.entradaEnSerie.deleteMany({ where: { entradaId: entradaId! } });
  if (temas.length) {
    await prisma.entradaEnTema.createMany({
      data: temas.map((temaId) => ({ entradaId: entradaId!, temaId })),
    });
  }
  if (series.length) {
    await prisma.entradaEnSerie.createMany({
      data: series.map((serieId) => ({ entradaId: entradaId!, serieId })),
    });
  }

  await refrescarTodo();
  return { ok: true, id: entradaId, slug, mudada };
}

export async function borrarEntrada(id: string) {
  await exigirSesion();
  await prisma.entrada.delete({ where: { id } });
  await refrescarTodo();
  return { ok: true };
}

/**
 * Borrar varias entradas de una tacada, desde la lista del panel.
 *
 * Las tablas puente —`EntradaEnTema` y `EntradaEnSerie`— caen en cascada, así
 * que no hay nada que limpiar a mano. Las fotografías no se tocan: borrar lo
 * escrito no se lleva por delante el archivo, ni siquiera la de la cabecera.
 *
 * Se devuelve cuántas cayeron de verdad y no cuántas se pidieron: si alguna ya
 * no estaba —dos pestañas abiertas—, el número lo dice sin dar un error.
 */
export async function borrarEntradas(ids: string[]) {
  await exigirSesion();

  const limpios = [...new Set(ids.filter((id) => typeof id === "string" && id !== ""))];
  if (limpios.length === 0) return { error: "No hay ninguna entrada marcada." };

  const { count } = await prisma.entrada.deleteMany({ where: { id: { in: limpios } } });
  await refrescarTodo();
  return { ok: true, cuantas: count };
}

/* --------------------------------------------------- páginas que se enseñan */

/**
 * Encender o apagar una página opcional del sitio.
 *
 * Se guarda el mapa entero en una fila de `Ajuste` y no una fila por página:
 * lo lee el marco en cada visita, y una consulta es una consulta.
 *
 * El interruptor llega al índice y no más allá —ver `lib/paginas.ts`—, así que
 * apagar las entradas no esconde ningún texto ya publicado: lo que hace es
 * dejar de ofrecer la lista.
 */
export async function mostrarPagina(clave: string, visible: boolean) {
  await exigirSesion();

  if (!CATALOGO_DE_PAGINAS.some((p) => p.clave === clave)) {
    return { error: "Esa página no se puede apagar." };
  }

  const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_PAGINAS } });
  let actual: Paginas = { ...PAGINAS_POR_DEFECTO };
  if (fila?.valor) {
    try {
      // El nombre viejo de la página —«cuaderno»— se sigue entendiendo al
      // leer, igual que en `lib/paginasDelSitio.ts`.
      const leido = JSON.parse(fila.valor) as Partial<Paginas> & {
        cuaderno?: boolean;
      };
      // El `series` que pueda venir guardado se ignora y se cae al reescribir
      // la fila: ese índice se quitó del sitio el 31/08/2026.
      actual = { entradas: (leido.entradas ?? leido.cuaderno) !== false };
    } catch {
      // Un JSON roto se sustituye por lo de fábrica en vez de heredarse.
    }
  }

  const valor = JSON.stringify({ ...actual, [clave as ClaveDePagina]: visible });
  await prisma.ajuste.upsert({
    where: { clave: CLAVE_PAGINAS },
    create: { clave: CLAVE_PAGINAS, valor },
    update: { valor },
  });

  await refrescarTodo();
  return { ok: true, visible };
}

/* ------------------------------------------------------------- categorías */

/*
 * Las categorías son el modelo `Tema`: los que ya filtran /entradas. No se
 * duplican con otro nombre porque son la misma cosa —«método», «mirada»,
 * «equipo»— y dos listas de lo mismo se separan a la primera corrección.
 *
 * Lo que faltaba era poder crearlas: existían las del arranque y ninguna
 * manera de añadir una sin tocar la base.
 */

const TOPE_CATEGORIA = 60;

const categoriaEditada = z.object({
  nombre: z.string().trim().min(2).max(TOPE_CATEGORIA),
});

/** El slug de una categoría: /entradas?tema=mirada. Nunca se repite. */
async function slugLibreDeCategoria(nombre: string, salvo?: string) {
  const base = aSlug(nombre) || "categoria";
  let slug = base;
  let n = 2;
  for (;;) {
    const ocupado = await prisma.tema.findUnique({ where: { slug } });
    if (!ocupado || ocupado.id === salvo) return slug;
    slug = `${base}-${n++}`;
  }
}

/**
 * Una categoría nueva.
 *
 * Devuelve la categoría entera y no sólo un «ok» porque quien la crea desde el
 * editor de una entrada necesita el identificador para dejarla marcada sin
 * recargar la página.
 */
export async function crearCategoria(nombre: string) {
  await exigirSesion();

  const leido = categoriaEditada.safeParse({ nombre });
  if (!leido.success) {
    return { error: `El nombre va de 2 a ${TOPE_CATEGORIA} caracteres.` };
  }

  // Se compara por slug y no por nombre: «Mirada» y «mirada» son la misma
  // categoría, y dos que sólo se distinguen por una tilde también.
  const slug = aSlug(leido.data.nombre);
  const repetida = slug
    ? await prisma.tema.findUnique({ where: { slug } })
    : null;
  if (repetida) return { error: `Ya existe «${repetida.nombre}».` };

  const creada = await prisma.tema.create({
    data: { nombre: leido.data.nombre, slug: await slugLibreDeCategoria(leido.data.nombre) },
  });

  await refrescarTodo();
  return { ok: true, categoria: { id: creada.id, nombre: creada.nombre, slug: creada.slug } };
}

/**
 * Cambiarle el nombre.
 *
 * El slug se rehace con el nombre nuevo, así que la dirección vieja
 * —/entradas?tema=lo-que-fuera— deja de valer. Es un filtro de una lista, no
 * la dirección de nada publicado: no hay enlace que romper.
 */
export async function renombrarCategoria(id: string, nombre: string) {
  await exigirSesion();

  const leido = categoriaEditada.safeParse({ nombre });
  if (!leido.success) {
    return { error: `El nombre va de 2 a ${TOPE_CATEGORIA} caracteres.` };
  }

  const slug = aSlug(leido.data.nombre);
  const repetida = slug
    ? await prisma.tema.findUnique({ where: { slug } })
    : null;
  if (repetida && repetida.id !== id) return { error: `Ya existe «${repetida.nombre}».` };

  await prisma.tema.update({
    where: { id },
    data: { nombre: leido.data.nombre, slug: await slugLibreDeCategoria(leido.data.nombre, id) },
  });

  await refrescarTodo();
  return { ok: true };
}

/**
 * Borrarla.
 *
 * No se lleva por delante ninguna entrada: `EntradaEnTema` cae en cascada y
 * los textos se quedan donde estaban, sin esa categoría. Aun así el panel
 * avisa de cuántos pierden la etiqueta, porque volver a ponerla es ir uno por
 * uno.
 */
export async function borrarCategoria(id: string) {
  await exigirSesion();

  const cuantas = await prisma.entradaEnTema.count({ where: { temaId: id } });
  await prisma.tema.delete({ where: { id } });

  await refrescarTodo();
  return { ok: true, cuantas };
}

/* --------------------------------------------------------------- importar */

const loteDeBlogger = z.array(
  z.object({
    titulo: z.string().trim().min(1).max(300),
    fecha: z.string().nullable(),
    urlAntigua: z.string().nullable(),
    texto: z.string().max(200000),
    etiquetas: z.array(z.string().max(80)).max(40),
    palabras: z.number().int().min(0),
    /** "" = a las entradas; si no, id de la serie de destino */
    destino: z.string().max(40),
  }),
);

/**
 * Trae las entradas de Blogger. Las fotos NO se descargan aquí: eso va en su
 * propio paso, porque son cientos de peticiones a otro servidor y conviene
 * poder pararlo y reanudarlo.
 */
export async function importarEntradas(bruto: unknown) {
  await exigirSesion();

  const leido = loteDeBlogger.safeParse(bruto);
  if (!leido.success) return { error: "El lote llega mal formado." };

  const resumen = await trasladarEntradas(leido.data);

  await refrescarTodo();
  return {
    ok: true,
    creadas: resumen.creadas,
    repetidas: resumen.repetidas,
    redirecciones: resumen.redirecciones,
  };
}

/* ------------------------------------------------------------------ aviso */

const avisoEditado = z.object({
  titulo: z.string().trim().min(1).max(80),
  texto: z.string().trim().min(1).max(20000),
  boton: z.string().trim().min(1).max(40),
});

/**
 * Guarda el aviso que ve quien entra por primera vez.
 *
 * `volverAEnsenar` sube la versión: sólo entonces vuelve a salirle a quien ya
 * lo había cerrado. Así se pueden corregir erratas sin dar la lata a nadie.
 */
export async function guardarAviso(datos: FormData) {
  await exigirSesion();

  const leido = avisoEditado.safeParse(Object.fromEntries(datos));
  if (!leido.success) return { error: "El aviso no puede quedarse vacío." };

  // Un párrafo por bloque separado con una línea en blanco.
  const parrafos = leido.data.texto
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  if (parrafos.length === 0) return { error: "El aviso no puede quedarse vacío." };

  const anterior = await prisma.ajuste.findUnique({ where: { clave: "sitio.aviso" } });
  let version = "";
  try {
    version = anterior?.valor ? (JSON.parse(anterior.valor).version ?? "") : "";
  } catch {
    version = "";
  }
  if (!version || datos.get("volverAEnsenar") === "on") {
    version = new Date().toISOString().slice(0, 19);
  }

  const valor = JSON.stringify({
    version,
    titulo: leido.data.titulo,
    parrafos,
    boton: leido.data.boton,
  });

  await prisma.ajuste.upsert({
    where: { clave: "sitio.aviso" },
    create: { clave: "sitio.aviso", valor },
    update: { valor },
  });

  await refrescarTodo();
  return { ok: true, version };
}

export async function fijarPortadaDeSerie(serieId: string, fotoId: string) {
  await exigirSesion();
  await prisma.serie.update({ where: { id: serieId }, data: { portadaId: fotoId } });
  await refrescarTodo();
}

/* --------------------------------------------------------------- mensajes */

/** Marca o desmarca como leído un mensaje de /contacto. */
export async function marcarMensaje(id: string, leido: boolean) {
  await exigirSesion();
  await prisma.mensaje.update({ where: { id }, data: { leido } });
  revalidatePath("/admin/mensajes");
}

export async function borrarMensaje(id: string) {
  await exigirSesion();
  await prisma.mensaje.delete({ where: { id } });
  revalidatePath("/admin/mensajes");
}

const correoEditado = z.union([z.literal(""), z.email()]);

/**
 * El correo y las redes que enseña /contacto.
 *
 * Dejar el correo en blanco o quedarse sin redes no es un olvido: significa
 * «no lo publiques», y la página deja de enseñar ese bloque.
 */
export async function guardarDatosDeContacto(
  correoBruto: string,
  redes: CuentaEnRed[],
) {
  await exigirSesion();

  const correo = correoEditado.safeParse(correoBruto.trim());
  if (!correo.success) {
    return { error: "Ese correo no parece un correo. Déjalo en blanco si no quieres publicarlo." };
  }

  const limpias: CuentaEnRed[] = [];
  for (const cuenta of redes) {
    const fallo = falloDeCuenta(cuenta);
    if (fallo) return { error: fallo };

    if (limpias.some((c) => c.red === cuenta.red)) {
      return { error: `${red(cuenta.red)?.nombre} está dos veces en la lista.` };
    }

    limpias.push({
      red: cuenta.red,
      valor:
        red(cuenta.red)?.forma === "usuario"
          ? limpiarUsuario(cuenta.valor)
          : cuenta.valor.trim(),
    });
  }

  for (const [clave, valor] of [
    [CLAVE_CORREO, correo.data],
    [CLAVE_REDES, JSON.stringify(limpias)],
  ] as const) {
    await prisma.ajuste.upsert({
      where: { clave },
      create: { clave, valor },
      update: { valor },
    });
  }

  await refrescarTodo();
  return { ok: true };
}

const paginaEditada = z.object({
  visible: z.enum(["si", "no"]),
  titulo: z.string().trim().max(TOPES.titulo),
  entradilla: z.string().trim().max(TOPES.entradilla),
  antesTitulo: z.string().trim().max(TOPES.antesTitulo),
  antes: z.string().trim().max(TOPES.antes),
  datosTitulo: z.string().trim().max(TOPES.datosTitulo),
  datos: z.string().trim().max(TOPES.datos),
});

/**
 * La página de contacto: si se enseña y qué pone.
 *
 * Los seis textos y el interruptor van en una sola fila de `Ajuste`, en JSON,
 * porque se leen siempre juntos. Un campo en blanco no se guarda vacío: se
 * quita, y al leer vuelve a salir el de fábrica — así no hay manera de dejar
 * la página con un título en blanco.
 */
export async function guardarPaginaDeContacto(datos: FormData) {
  await exigirSesion();

  const leido = paginaEditada.safeParse(Object.fromEntries(datos));
  if (!leido.success) {
    return { error: "Hay algún texto más largo de lo que cabe. Recórtalo un poco." };
  }
  const d = leido.data;

  const guardado: Partial<PaginaDeContacto> = { visible: d.visible === "si" };
  for (const clave of Object.keys(TEXTOS_POR_DEFECTO) as (keyof typeof TEXTOS_POR_DEFECTO)[]) {
    // Lo que coincide con el texto de fábrica tampoco se guarda: así una
    // corrección futura del texto original llega a las páginas que no se
    // hayan tocado.
    if (d[clave] && d[clave] !== TEXTOS_POR_DEFECTO[clave]) guardado[clave] = d[clave];
  }

  const valor = JSON.stringify(guardado);
  await prisma.ajuste.upsert({
    where: { clave: CLAVE_CONTACTO },
    create: { clave: CLAVE_CONTACTO, valor },
    update: { valor },
  });

  await refrescarTodo();
  return { ok: true, visible: guardado.visible };
}

/* ------------------------------------------------------- páginas de error */

const percanceEditado = z.object({
  rotulo: z.string().trim().max(TOPES_PERCANCE.rotulo),
  titulo: z.string().trim().max(TOPES_PERCANCE.titulo),
  texto: z.string().trim().max(TOPES_PERCANCE.texto),
  /** Vacío = la página va sin fotografía. */
  fotoId: z.string().trim().max(40),
  /** "si" = si está en borrador, publícala al guardar. */
  publicar: z.enum(["si", "no"]).optional(),
});

/**
 * El texto y la fotografía de una página de error.
 *
 * Lo que coincide con el texto de fábrica no se guarda: así una corrección
 * futura del original llega a las páginas que no se hayan tocado. Y si no
 * queda nada escrito ni ninguna foto, se borra la fila entera en vez de dejar
 * un JSON vacío en la base.
 */
export async function guardarPercance(clave: ClaveDePercance, datos: FormData) {
  await exigirSesion();
  if (!percanceEnCatalogo(clave)) return { error: "Esa página de error no existe." };

  const leido = percanceEditado.safeParse(Object.fromEntries(datos));
  if (!leido.success) {
    return { error: "Hay algún texto más largo de lo que cabe. Recórtalo un poco." };
  }
  const d = leido.data;

  const fabrica = PERCANCE_POR_DEFECTO[clave];
  const guardado: Record<string, string> = {};
  for (const campo of ["rotulo", "titulo", "texto"] as const) {
    if (d[campo] && d[campo] !== fabrica[campo]) guardado[campo] = d[campo];
  }

  let fotoId: string | null = null;
  if (d.fotoId) {
    const foto = await prisma.foto.findUnique({
      where: { id: d.fotoId },
      select: { estado: true, alt: true },
    });
    if (!foto) return { error: "Esa fotografía ya no está en el archivo." };

    // Esta página la ve cualquiera, así que la foto tiene que estar publicada.
    // Si está en borrador se publica aquí mismo, con la regla de siempre.
    if (foto.estado !== "publicada") {
      if (d.publicar !== "si") {
        return { error: "Esa fotografía está en borrador. Publícala para ponerla aquí." };
      }
      if (!foto.alt.trim()) {
        return {
          error: "No tiene texto alternativo, y sin eso no se publica. Escríbelo en su ficha.",
        };
      }
      await prisma.foto.update({ where: { id: d.fotoId }, data: { estado: "publicada" } });
    }
    fotoId = d.fotoId;
  }

  const hayTexto = Object.keys(guardado).length > 0;
  if (!hayTexto && !fotoId) {
    await prisma.ajuste.deleteMany({ where: { clave: CLAVE_PERCANCE[clave] } });
    await refrescarTodo();
    return { ok: true, porDefecto: true };
  }

  const valor = hayTexto ? JSON.stringify(guardado) : null;
  await prisma.ajuste.upsert({
    where: { clave: CLAVE_PERCANCE[clave] },
    create: { clave: CLAVE_PERCANCE[clave], valor, fotoId },
    update: { valor, fotoId },
  });

  await refrescarTodo();
  return { ok: true, conFoto: Boolean(fotoId) };
}

/* -------------------------------------------------------------------- pie */

const notaDelPieEditada = z.object({
  nota: z.string().trim().max(TOPE_NOTA_PIE),
});

/**
 * La frase del pie, una sola para todo el sitio.
 *
 * Dejarla en blanco no es un error: se borra la fila y vuelve a salir la de
 * fábrica, así que el pie nunca se queda mudo.
 */
export async function guardarNotaDelPie(datos: FormData) {
  await exigirSesion();

  const leido = notaDelPieEditada.safeParse(Object.fromEntries(datos));
  if (!leido.success) {
    return { error: `La nota del pie no puede pasar de ${TOPE_NOTA_PIE} caracteres.` };
  }

  const nota = leido.data.nota;
  if (nota) {
    await prisma.ajuste.upsert({
      where: { clave: CLAVE_PIE },
      create: { clave: CLAVE_PIE, valor: nota },
      update: { valor: nota },
    });
  } else {
    await prisma.ajuste.deleteMany({ where: { clave: CLAVE_PIE } });
  }

  await refrescarTodo();
  return { ok: true, porDefecto: !nota };
}

/* ---------------------------------------------------------------- sobre mí */

const seccionEditada = z.object({
  titulo: z.string().trim().max(TOPES_TEXTO.tituloSeccion),
  parrafos: z.array(z.string().trim()).max(40),
});

const textoEditado = z.object({
  titulo: z.string().trim().max(TOPES_TEXTO.titulo),
  entradilla: z.string().trim().max(TOPES_TEXTO.entradilla),
  secciones: z.array(seccionEditada).max(TOPES_TEXTO.secciones),
});

/**
 * El texto de /sobre-mi: título, entradilla y las secciones que haya.
 *
 * Las secciones se guardan enteras, en JSON y en una sola fila, porque son una
 * lista que crece y mengua: una fila por sección obligaría a inventar un orden
 * y a arrastrarlo en cada cambio.
 *
 * Una sección sin título y sin párrafos no se guarda: es una que se añadió y
 * se dejó a medias, y prefiero tirarla aquí a que salga un hueco en la página.
 */
export async function guardarTextoDeSobreMi(texto: SobreMi) {
  await exigirSesion();

  const leido = textoEditado.safeParse(texto);
  if (!leido.success) {
    return { error: "Hay algún texto más largo de lo que cabe, o demasiadas secciones." };
  }

  const secciones = leido.data.secciones
    .map((s) => ({ titulo: s.titulo, parrafos: s.parrafos.filter(Boolean) }))
    .filter((s) => s.titulo || s.parrafos.length > 0);

  for (const s of secciones) {
    if (s.parrafos.join("\n\n").length > TOPES_TEXTO.parrafos) {
      return {
        error: `«${s.titulo || "Una sección"}» pasa de ${TOPES_TEXTO.parrafos} caracteres. Pártela en dos.`,
      };
    }
  }

  const valor = JSON.stringify({
    titulo: leido.data.titulo,
    entradilla: leido.data.entradilla,
    secciones,
  });

  await prisma.ajuste.upsert({
    where: { clave: CLAVE_TEXTO },
    create: { clave: CLAVE_TEXTO, valor },
    update: { valor },
  });

  await refrescarTodo();
  return { ok: true, secciones: secciones.length };
}

/**
 * Tira lo escrito y devuelve la página al texto con el que nació. No borra el
 * retrato: son dos cosas distintas y se guardan por separado.
 */
export async function volverAlTextoDeFabrica() {
  await exigirSesion();
  await prisma.ajuste.deleteMany({ where: { clave: CLAVE_TEXTO } });
  await refrescarTodo();
  return { ok: true };
}

const retratoEditado = z.object({
  /** Vacío = quitar el retrato y dejar la página sólo con el texto. */
  fotoId: z.string().trim().max(40),
  pie: z.string().trim().max(TOPE_PIE_RETRATO),
});

/**
 * La fotografía de /sobre-mi y el pie que se lee debajo.
 *
 * No se sube nada aquí: se elige una del archivo, como la apertura de la
 * portada. Vale cualquiera, publicada o en borrador — un retrato del autor no
 * tiene por qué formar parte de ninguna serie, y obligar a publicarlo lo
 * metería en el archivo y en las búsquedas.
 */
export async function guardarRetratoDeSobreMi(datos: FormData) {
  await exigirSesion();

  const leido = retratoEditado.safeParse(Object.fromEntries(datos));
  if (!leido.success) {
    return { error: `El pie del retrato no puede pasar de ${TOPE_PIE_RETRATO} caracteres.` };
  }
  const { fotoId, pie } = leido.data;

  if (!fotoId) {
    await prisma.ajuste.deleteMany({ where: { clave: CLAVE_RETRATO } });
    await refrescarTodo();
    return { ok: true, quitado: true };
  }

  const foto = await prisma.foto.findUnique({
    where: { id: fotoId },
    select: { id: true },
  });
  if (!foto) return { error: "Esa fotografía ya no está en el archivo." };

  await prisma.ajuste.upsert({
    where: { clave: CLAVE_RETRATO },
    create: { clave: CLAVE_RETRATO, fotoId, valor: pie || null },
    update: { fotoId, valor: pie || null },
  });

  await refrescarTodo();
  return { ok: true };
}

/* ---------------------------------------------------------------- ajustes */

const identidadEditada = z.object({
  nombre: z.string().trim().max(TOPES_IDENTIDAD.nombre),
  autor: z.string().trim().max(TOPES_IDENTIDAD.autor),
  descripcion: z.string().trim().max(TOPES_IDENTIDAD.descripcion),
  lema: z.string().trim().max(TOPES_IDENTIDAD.lema),
});

/**
 * Cómo se llama el sitio y qué dice de sí mismo.
 *
 * Lo que coincide con lo de fábrica no se guarda, igual que en el resto de
 * textos: así una corrección futura del original llega sola. El lema sí puede
 * quedarse vacío a propósito —hay quien no quiere coletilla detrás del
 * nombre—, y por eso se guarda aunque esté en blanco.
 */
export async function guardarIdentidad(datos: FormData) {
  await exigirSesion();

  const leido = identidadEditada.safeParse(Object.fromEntries(datos));
  if (!leido.success) {
    return { error: "Hay algún texto más largo de lo que cabe. Recórtalo un poco." };
  }
  const d = leido.data;

  const guardado: Partial<Identidad> = { lema: d.lema };
  for (const campo of ["nombre", "autor", "descripcion"] as const) {
    if (d[campo] && d[campo] !== IDENTIDAD_POR_DEFECTO[campo]) guardado[campo] = d[campo];
  }

  const valor = JSON.stringify(guardado);
  await prisma.ajuste.upsert({
    where: { clave: CLAVE_IDENTIDAD },
    create: { clave: CLAVE_IDENTIDAD, valor },
    update: { valor },
  });

  await refrescarTodo();
  return { ok: true };
}

const entradillasEditadas = z.object({
  entradas: z.string().trim().max(TOPE_ENTRADILLA),
  archivo: z.string().trim().max(TOPE_ENTRADILLA),
});

/**
 * Los párrafos de presentación de /entradas y /archivo.
 *
 * Lo que coincide con lo de fábrica no se guarda, igual que en el resto de
 * textos: así una corrección futura del original llega sola, y una página que
 * nunca se ha tocado no arrastra una copia congelada de su propio texto.
 */
export async function guardarEntradillas(datos: FormData) {
  await exigirSesion();

  const leido = entradillasEditadas.safeParse(Object.fromEntries(datos));
  if (!leido.success) {
    return { error: "Hay algún texto más largo de lo que cabe. Recórtalo un poco." };
  }
  const d = leido.data;

  const guardado: Partial<Entradillas> = {};
  for (const clave of ["entradas", "archivo"] as ClaveDeEntradilla[]) {
    if (d[clave] && d[clave] !== ENTRADILLAS_POR_DEFECTO[clave]) guardado[clave] = d[clave];
  }

  // Sin nada propio no se deja una fila con `{}` en la base: se borra, y las
  // dos páginas vuelven a leer el texto de fábrica.
  if (Object.keys(guardado).length === 0) {
    await prisma.ajuste.deleteMany({ where: { clave: CLAVE_ENTRADILLAS } });
  } else {
    const valor = JSON.stringify(guardado);
    await prisma.ajuste.upsert({
      where: { clave: CLAVE_ENTRADILLAS },
      create: { clave: CLAVE_ENTRADILLAS, valor },
      update: { valor },
    });
  }

  await refrescarTodo();
  return { ok: true };
}

/** La pareja de letras del sitio. Sólo vale una de las del catálogo. */
export async function guardarLetras(clave: string) {
  await exigirSesion();
  if (!PAREJAS.some((p) => p.clave === clave)) {
    return { error: "Esa pareja de letras no está en el catálogo." };
  }

  await prisma.ajuste.upsert({
    where: { clave: CLAVE_LETRAS },
    create: { clave: CLAVE_LETRAS, valor: clave },
    update: { valor: clave },
  });

  await refrescarTodo();
  return { ok: true };
}

const tipografiaEditada = z.object({
  tamano: z.enum(TAMANOS.map((e) => e.clave) as [string, ...string[]]),
  interlineado: z.enum(INTERLINEADOS.map((e) => e.clave) as [string, ...string[]]),
  medida: z.enum(MEDIDAS.map((e) => e.clave) as [string, ...string[]]),
});

/**
 * Cómo se lee el sitio: tamaño del texto, interlineado y ancho de columna.
 *
 * Se guardan los tres a la vez en una fila —lo mismo que las páginas que se
 * enseñan— porque se eligen a la vez, mirando la misma muestra. Lo que no
 * esté en el catálogo se queda en lo de fábrica al leer, así que un escalón
 * retirado del código no deja el sitio sin medida.
 */
export async function guardarTipografia(t: unknown) {
  await exigirSesion();

  const leido = tipografiaEditada.safeParse(t);
  if (!leido.success) return { error: "Esa medida no está en el catálogo." };

  await prisma.ajuste.upsert({
    where: { clave: CLAVE_TIPOGRAFIA },
    create: { clave: CLAVE_TIPOGRAFIA, valor: JSON.stringify(leido.data) },
    update: { valor: JSON.stringify(leido.data) },
  });

  await refrescarTodo();
  return { ok: true };
}

/**
 * A cuántos píxeles se sirven las fotografías.
 *
 * `aTodas` lo aplica al archivo entero. No es destructivo y por eso se puede
 * ofrecer: el fichero guardado no se toca —sigue siendo el mismo JPEG de hasta
 * 2400 px— y lo único que cambia es cuántos píxeles pide el navegador. Se
 * puede volver atrás con otro clic.
 */
export async function guardarAnchoDeLasFotos(ancho: number, aTodas: boolean) {
  await exigirSesion();
  if (!ANCHOS_DISPONIBLES.some((a) => a.valor === ancho)) {
    return { error: "Ese ancho no está en la lista." };
  }

  await prisma.ajuste.upsert({
    where: { clave: CLAVE_ANCHO },
    create: { clave: CLAVE_ANCHO, valor: String(ancho) },
    update: { valor: String(ancho) },
  });

  let cuantas = 0;
  if (aTodas) {
    const r = await prisma.foto.updateMany({ data: { anchoMax: ancho } });
    cuantas = r.count;
  }

  await refrescarTodo();
  return { ok: true, cuantas };
}

/* ----------------------------------------------------------------- cuenta */

const cuentaEditada = z.object({
  nombre: z.string().trim().min(2).max(80),
  correo: z.email().max(180),
  actual: z.string().max(200),
  nueva: z.string().max(200),
  repetir: z.string().max(200),
});

/** Lo mínimo para que una contraseña no sea un adorno. */
const TOPE_CLAVE = 8;

/**
 * La cuenta del panel: el nombre, el correo con el que se entra y la
 * contraseña.
 *
 * Para cambiar cualquiera de las tres hay que escribir la actual. Es la sesión
 * abierta en un portátil ajeno lo que se está tapando: sin eso, quien pase por
 * delante se queda con el sitio.
 *
 * Al cambiarla no se cierra la sesión de aquí —el testigo va firmado y sigue
 * valiendo— pero sí deja de servir la contraseña vieja en cualquier otro sitio.
 */
export async function guardarCuenta(datos: FormData) {
  const sesion = await exigirSesion();

  const leido = cuentaEditada.safeParse(Object.fromEntries(datos));
  if (!leido.success) {
    return { error: "Revisa el nombre y el correo: alguno no cuadra." };
  }
  const d = leido.data;

  // El identificador viaja en el testigo de sesión (ver `lib/auth.ts`); si no
  // estuviera, `exigirSesion` ya habría cortado.
  const usuario = sesion.user?.id
    ? await prisma.usuario.findUnique({ where: { id: sesion.user.id } })
    : null;
  if (!usuario) return { error: "Esta cuenta ya no está en la base." };

  const vale = await bcrypt.compare(d.actual, usuario.passwordHash);
  if (!vale) return { error: "La contraseña actual no es esa." };

  if (d.nueva || d.repetir) {
    if (d.nueva.length < TOPE_CLAVE) {
      return { error: `La contraseña nueva necesita al menos ${TOPE_CLAVE} caracteres.` };
    }
    if (d.nueva !== d.repetir) {
      return { error: "La contraseña nueva y su repetición no coinciden." };
    }
  }

  const correo = d.correo.toLowerCase();
  if (correo !== usuario.email) {
    const ocupado = await prisma.usuario.findUnique({ where: { email: correo } });
    if (ocupado) return { error: "Ya hay una cuenta con ese correo." };
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      nombre: d.nombre,
      email: correo,
      // 12 vueltas, las mismas que usa `scripts/clave-del-panel.mts`.
      ...(d.nueva ? { passwordHash: await bcrypt.hash(d.nueva, 12) } : {}),
    },
  });

  return { ok: true, clave: Boolean(d.nueva), correo };
}

/* ------------------------------------------------------------------ umami */

const umamiEditado = z.object({
  script: z.union([z.literal(""), z.url()]),
  id: z.string().trim().max(80),
  panel: z.string().trim().max(500),
});

/**
 * La analítica: dónde vive el servidor de Umami, qué sitio mide y con qué
 * enlace se ven los números dentro del panel.
 *
 * Va en `Ajuste` y no en el entorno a propósito: mudarse de servidor —del
 * dominio de Render al propio— es cambiar tres campos en una página, no
 * reconstruir la imagen y volver a desplegar.
 */
export async function guardarUmami(datos: FormData) {
  await exigirSesion();

  const leido = umamiEditado.safeParse(Object.fromEntries(datos));
  if (!leido.success) {
    return { error: "La dirección del script tiene que ser una dirección web entera, con https:// delante." };
  }

  const { script, id, panel } = leido.data;

  const fallo = falloDelPanel(panel);
  if (fallo) return { error: fallo };

  // Media configuración no mide nada y confunde más que no tener ninguna.
  if ((script && !id) || (id && !script)) {
    return {
      error: "Hacen falta las dos: la dirección del script y el identificador del sitio. Con una sola no se mide nada.",
    };
  }

  for (const [clave, valor] of [
    [CLAVE_SCRIPT, script],
    [CLAVE_ID, id],
    [CLAVE_PANEL, panel],
  ] as const) {
    if (valor) {
      await prisma.ajuste.upsert({
        where: { clave },
        create: { clave, valor },
        update: { valor },
      });
    } else {
      await prisma.ajuste.deleteMany({ where: { clave } });
    }
  }

  await refrescarTodo();
  return { ok: true, midiendo: Boolean(script && id) };
}

/* ------------------------------------------------------- la letra pequeña */

const seccionLegal = z.object({
  titulo: z.string().trim().max(TOPES_LEGALES.tituloSeccion),
  texto: z.string().trim().max(TOPES_LEGALES.texto),
});

const legalEditada = z.object({
  visible: z.boolean(),
  titulo: z.string().trim().max(TOPES_LEGALES.titulo),
  entradilla: z.string().trim().max(TOPES_LEGALES.entradilla),
  secciones: z.array(seccionLegal).max(TOPES_LEGALES.secciones),
});

/**
 * Una de las tres páginas de letra pequeña: cookies, privacidad o términos.
 *
 * El interruptor y los textos van juntos en una fila de `Ajuste`, en JSON,
 * como la página de contacto. Lo que coincida con el texto de fábrica no se
 * guarda: así una corrección futura del original —que en estas páginas no es
 * hipotética, la ley se mueve— llega a las que no se hayan tocado.
 *
 * Las secciones son la excepción y se guardan enteras en cuanto cambia una:
 * son una lista ordenada, y guardar «las que no son de fábrica» dejaría un
 * hueco imposible de recomponer al leer.
 *
 * No pasa por `FormData` como el resto: son tres cajas de texto y una lista
 * que crece, y serializar eso a formulario y volver a montarlo no aporta nada.
 */
export async function guardarLegal(clave: string, datos: unknown) {
  await exigirSesion();
  if (!esClaveLegal(clave)) return { error: "Esa página no existe." };

  const leido = legalEditada.safeParse(datos);
  if (!leido.success) {
    return { error: "Hay algún texto más largo de lo que cabe. Recórtalo un poco." };
  }
  const d = leido.data;

  // Una sección sin título y sin texto es una caja que se quedó abierta y no
  // se llegó a escribir: no se guarda.
  const secciones: SeccionLegal[] = d.secciones.filter((s) => s.titulo || s.texto);

  const fabrica = legalDeFabrica(clave as ClaveLegal);
  const guardado: Partial<Legal> = { visible: d.visible };

  if (d.titulo && d.titulo !== fabrica.titulo) guardado.titulo = d.titulo;
  if (d.entradilla && d.entradilla !== fabrica.entradilla) {
    guardado.entradilla = d.entradilla;
  }
  if (!mismasSecciones(secciones, fabrica.secciones)) guardado.secciones = secciones;

  const valor = JSON.stringify(guardado);
  await prisma.ajuste.upsert({
    where: { clave: CLAVE_LEGAL[clave as ClaveLegal] },
    create: { clave: CLAVE_LEGAL[clave as ClaveLegal], valor },
    update: { valor },
  });

  await refrescarTodo();
  return {
    ok: true,
    visible: d.visible,
    secciones: secciones.length,
    propia: guardado.secciones !== undefined || guardado.titulo !== undefined,
  };
}

/**
 * Devuelve una de estas páginas al texto de fábrica.
 *
 * Se borra la fila entera en vez de escribir el texto original dentro: así la
 * página vuelve a seguir al de fábrica de aquí en adelante, y una corrección
 * futura le llega. El interruptor vuelve también a encendida, que es lo que
 * significa no haber dicho nada.
 */
export async function legalDeFabricaOtraVez(clave: string) {
  await exigirSesion();
  if (!esClaveLegal(clave)) return { error: "Esa página no existe." };

  await prisma.ajuste.deleteMany({ where: { clave: CLAVE_LEGAL[clave as ClaveLegal] } });

  await refrescarTodo();
  return { ok: true };
}
