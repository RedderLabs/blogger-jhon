import { NextResponse } from "next/server";

import { hayAlmacen } from "@/lib/almacen";
import { anchoDeLasFotos } from "@/lib/anchoDelSitio";
import { auth } from "@/lib/auth";
import { olvidar } from "@/lib/cache";
import { ACEPTADOS, procesarEscaneo } from "@/lib/escaneos";
import { ANCHO_POR_DEFECTO } from "@/lib/fotos";
import { prisma } from "@/lib/prisma";
import { aSlug } from "@/lib/texto";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Una fotografía suelta, subida desde donde se la necesita: la portada.
 *
 * Sigue entrando por un rollo, como todas —es lo que sostiene el archivo—,
 * pero se elige cuál en vez de dar por hecho que se está subiendo un lote. Y
 * pide el texto alternativo antes de nada: aquí la foto sale publicada en el
 * mismo gesto, y publicar sin alt es lo único que este sitio no hace.
 */
export async function POST(peticion: Request) {
  const sesion = await auth();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!hayAlmacen()) {
    return NextResponse.json(
      {
        error:
          "Falta configurar Backblaze (S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY). Sin eso no hay dónde dejar la fotografía.",
      },
      { status: 503 },
    );
  }

  const datos = await peticion.formData();
  const fichero = datos.get("foto");
  const alt = String(datos.get("alt") ?? "").trim();
  const titulo = String(datos.get("titulo") ?? "").trim();
  const rolloId = String(datos.get("rolloId") ?? "").trim();
  const codigoNuevo = String(datos.get("codigo") ?? "").trim();
  // Lo que se elija al subir manda; si no viene nada, el ancho del sitio
  // (/admin/ajustes).
  const pedido = Number(datos.get("anchoMax"));
  const anchoMax =
    Number.isFinite(pedido) && pedido >= 0 ? pedido : await anchoDeLasFotos();

  if (!(fichero instanceof File)) {
    return NextResponse.json(
      { error: "No has elegido ninguna fotografía." },
      { status: 400 },
    );
  }
  if (!ACEPTADOS.includes(fichero.type)) {
    return NextResponse.json(
      {
        error:
          "Ese fichero no se puede leer. Acepto JPEG, PNG, TIFF, WebP y AVIF; el RAW de cámara hay que revelarlo antes.",
      },
      { status: 400 },
    );
  }
  if (alt.length < 3) {
    return NextResponse.json(
      {
        error:
          "Escribe el texto alternativo: es lo único que lee un lector de pantalla.",
      },
      { status: 400 },
    );
  }

  // O va a un rollo que ya existe, o se abre uno con el código que se dé.
  let rollo = rolloId
    ? await prisma.rollo.findUnique({ where: { id: rolloId } })
    : null;

  if (!rollo) {
    if (!codigoNuevo) {
      return NextResponse.json(
        { error: "Dime a qué rollo va, o ponle código a uno nuevo." },
        { status: 400 },
      );
    }
    rollo = await prisma.rollo.upsert({
      where: { codigo: codigoNuevo },
      create: { codigo: codigoNuevo, fecha: new Date() },
      update: {},
    });
  }

  const ultimo = await prisma.foto.aggregate({
    where: { rolloId: rollo.id },
    _max: { orden: true },
  });
  const orden = (ultimo._max.orden ?? 0) + 1;

  let copia;
  try {
    copia = await procesarEscaneo({
      bytes: Buffer.from(await fichero.arrayBuffer()),
      tipo: fichero.type,
      nombreOriginal: fichero.name,
      carpeta: aSlug(rollo.codigo) || "rollo",
      orden,
    });
  } catch {
    return NextResponse.json(
      { error: "No he podido leer esa imagen. Prueba a exportarla otra vez." },
      { status: 400 },
    );
  }

  const foto = await prisma.foto.create({
    data: {
      rolloId: rollo.id,
      orden,
      archivo: copia.archivo,
      archivoOriginal: copia.archivoOriginal,
      hash: copia.hash,
      ancho: copia.ancho,
      alto: copia.alto,
      anchoMax: Number.isFinite(anchoMax) ? anchoMax : ANCHO_POR_DEFECTO,
      titulo: titulo || "Sin título",
      alt,
      camara: rollo.camara,
      optica: rollo.optica,
      pelicula: rollo.pelicula,
      revelado: rollo.revelado,
      fecha: rollo.fecha,
      estado: "publicada",
    },
    select: {
      id: true,
      archivo: true,
      titulo: true,
      alt: true,
      estado: true,
      orden: true,
    },
  });

  await olvidar();
  revalidatePath("/", "layout");

  return NextResponse.json({
    foto: { ...foto, rollo: rollo.codigo, serie: null },
  });
}
