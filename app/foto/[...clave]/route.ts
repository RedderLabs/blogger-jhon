import { NextResponse } from "next/server";

import { claveDeRuta, traer } from "@/lib/almacen";

export const runtime = "nodejs";

/**
 * Lo que sirve las copias. El cubo de Backblaze es privado: nadie ve nunca una
 * dirección de b2, y todo lo que se enseña pasa por aquí.
 *
 * Sirve sólo lo que está bajo `web/`. Los escaneos originales viven en el
 * mismo cubo bajo `originales/` y esta ruta no los alcanza: antes estaban en
 * `public/uploads/…/originales/`, es decir, al alcance de cualquiera que
 * probase la dirección.
 *
 * La respuesta se transmite tal cual llega de B2, sin pasar el fichero entero
 * por la memoria del servidor. Delante de esto está el optimizador de
 * imágenes de Next, que guarda su propia versión treinta días: en la práctica
 * B2 recibe una petición por foto y tamaño, no una por visita.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ clave: string[] }> },
) {
  const { clave: partes } = await params;
  const clave = claveDeRuta(partes.join("/"));
  if (!clave) return new NextResponse("No", { status: 404 });

  try {
    const { cuerpo, tipo, tamano, etag } = await traer(clave);
    if (!cuerpo) return new NextResponse("No", { status: 404 });

    const cabeceras = new Headers({
      "Content-Type": tipo,
      // Inmutable: el nombre del fichero lleva su propia huella, así que un
      // cambio de foto es un nombre nuevo y nunca hay que invalidar nada.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Robots-Tag": "noai, noimageai",
    });
    if (tamano) cabeceras.set("Content-Length", String(tamano));
    if (etag) cabeceras.set("ETag", etag);

    return new NextResponse(cuerpo as unknown as BodyInit, { headers: cabeceras });
  } catch {
    // Da igual si fue un 404 de B2 o un fallo de credenciales: hacia fuera no
    // existe. Lo segundo se ve en los registros del servidor.
    return new NextResponse("No", { status: 404 });
  }
}
