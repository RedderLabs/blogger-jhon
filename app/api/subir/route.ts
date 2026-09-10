import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { hayAlmacen } from "@/lib/almacen";
import { anchoDeLasFotos } from "@/lib/anchoDelSitio";
import { auth } from "@/lib/auth";
import { ACEPTADOS, procesarEscaneo } from "@/lib/escaneos";
import { ANCHO_POR_DEFECTO } from "@/lib/fotos";
import { prisma } from "@/lib/prisma";
import { aSlug } from "@/lib/texto";

export const runtime = "nodejs";
// Un rollo entero puede tardar: nada de respuestas a medias.
export const maxDuration = 300;

export async function POST(peticion: Request) {
  const sesion = await auth();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!hayAlmacen()) {
    return NextResponse.json(
      {
        error:
          "Falta configurar Backblaze (S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY). Sin eso no hay dónde dejar los escaneos.",
      },
      { status: 503 },
    );
  }

  const datos = await peticion.formData();
  const codigo = String(datos.get("codigo") ?? "").trim();
  const fechaTexto = String(datos.get("fecha") ?? "").trim();
  // Lo que se elija al subir manda; si no viene nada, el ancho del sitio
  // (/admin/ajustes).
  const pedido = Number(datos.get("anchoMax"));
  const anchoMax =
    Number.isFinite(pedido) && pedido >= 0 ? pedido : await anchoDeLasFotos();
  const ficheros = datos
    .getAll("fotos")
    .filter((f): f is File => f instanceof File);

  if (!codigo) {
    return NextResponse.json(
      { error: "Ponle un código al rollo." },
      { status: 400 },
    );
  }
  if (ficheros.length === 0) {
    return NextResponse.json(
      { error: "No has elegido ningún escaneo." },
      { status: 400 },
    );
  }

  const fecha = fechaTexto ? new Date(fechaTexto) : new Date();
  if (Number.isNaN(fecha.getTime())) {
    return NextResponse.json({ error: "Esa fecha no vale." }, { status: 400 });
  }

  const rechazados = ficheros
    .filter((f) => !ACEPTADOS.includes(f.type))
    .map((f) => f.name);
  const buenos = ficheros.filter((f) => ACEPTADOS.includes(f.type));
  if (buenos.length === 0) {
    return NextResponse.json(
      {
        error:
          "Ninguno de esos ficheros se puede leer. Acepto JPEG, PNG, TIFF, WebP y AVIF; el RAW de cámara hay que revelarlo antes.",
      },
      { status: 400 },
    );
  }

  const carpeta = aSlug(codigo) || "rollo";

  const rollo = await prisma.rollo.upsert({
    where: { codigo },
    create: {
      codigo,
      fecha,
      camara: String(datos.get("camara") ?? "").trim() || null,
      optica: String(datos.get("optica") ?? "").trim() || null,
      pelicula: String(datos.get("pelicula") ?? "").trim() || null,
      revelado: String(datos.get("revelado") ?? "").trim() || null,
      notas: String(datos.get("notas") ?? "").trim() || null,
    },
    update: { fecha },
  });

  // Si el rollo ya existía, los fotogramas nuevos siguen la numeración.
  const ultimo = await prisma.foto.aggregate({
    where: { rolloId: rollo.id },
    _max: { orden: true },
  });
  let orden = (ultimo._max.orden ?? 0) + 1;

  const creadas: string[] = [];
  const fallados: string[] = [];

  for (const fichero of buenos) {
    try {
      const copia = await procesarEscaneo({
        bytes: Buffer.from(await fichero.arrayBuffer()),
        tipo: fichero.type,
        nombreOriginal: fichero.name,
        carpeta,
        orden,
      });

      await prisma.foto.create({
        data: {
          rolloId: rollo.id,
          orden,
          archivo: copia.archivo,
          archivoOriginal: copia.archivoOriginal,
          hash: copia.hash,
          ancho: copia.ancho,
          alto: copia.alto,
          anchoMax: Number.isFinite(anchoMax) ? anchoMax : ANCHO_POR_DEFECTO,
          camara: rollo.camara,
          optica: rollo.optica,
          pelicula: rollo.pelicula,
          revelado: rollo.revelado,
          fecha: rollo.fecha,
          estado: "borrador",
        },
      });

      creadas.push(fichero.name);
      orden += 1;
    } catch {
      fallados.push(fichero.name);
    }
  }

  revalidatePath("/", "layout");

  return NextResponse.json({
    rolloId: rollo.id,
    subidas: creadas.length,
    rechazados,
    fallados,
  });
}
