import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { leerExportDeBlogger } from "@/lib/blogger";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Lee el XML de Blogger y devuelve lo que ha encontrado, sin tocar nada.
 * El traslado de verdad va aparte, cuando se ha revisado el reparto.
 */
export async function POST(peticion: Request) {
  const sesion = await auth();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const datos = await peticion.formData();
  const fichero = datos.get("xml");
  if (!(fichero instanceof File)) {
    return NextResponse.json({ error: "No has elegido el fichero." }, { status: 400 });
  }

  const xml = await fichero.text();
  if (!xml.includes("<feed") && !xml.includes("<entry")) {
    return NextResponse.json(
      {
        error:
          "Eso no parece el XML de Blogger. Sale de Configuración → Administrar el blog → Copia de seguridad del contenido.",
      },
      { status: 400 },
    );
  }

  try {
    const entradas = leerExportDeBlogger(xml);
    return NextResponse.json({
      entradas,
      resumen: {
        entradas: entradas.length,
        fotos: entradas.reduce((n, e) => n + e.fotos.length, 0),
        sinFecha: entradas.filter((e) => !e.fecha).length,
        desde: entradas.at(-1)?.fecha ?? null,
        hasta: entradas[0]?.fecha ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No he podido leer ese XML. ¿Está completo?" },
      { status: 400 },
    );
  }
}
