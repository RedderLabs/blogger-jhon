import type { MetadataRoute } from "next";

import { RASTREADORES_DE_IA } from "@/lib/ia";
import { SITIO } from "@/lib/sitio";

/**
 * En cada petición, no al compilar: si se generase una sola vez, el dominio
 * quedaría escrito dentro de la imagen y mudarse de sitio obligaría a
 * reconstruirla. Es un fichero de veinte líneas que se pide una vez al día.
 */
export const dynamic = "force-dynamic";

/*
 * La lista de rastreadores de I.A. está en `lib/ia.ts`, con el porqué. No se
 * escribe aquí porque la lee también /terminos: lo que se promete por escrito
 * y lo que se sirve en robots.txt tienen que ser el mismo dato.
 */

/**
 * Lo que no tiene nada que hacer en un índice, venga quien venga.
 *
 * `/manual.html` es el manual del panel: se sirve para poder pasarle el enlace
 * a quien lo necesite, pero no es parte de la obra y no pinta nada en una
 * búsqueda. No está en el sitemap y además lleva su propia cabecera.
 */
const CERRADO = ["/admin", "/api/", "/buscar", "/manual.html"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: CERRADO },
      // El cuarto oscuro y el buscador interno no se indexan; las fotos sí,
      // que es de lo que va el sitio.
      ...RASTREADORES_DE_IA.map((agente) => ({ userAgent: agente, disallow: "/" })),
    ],
    sitemap: `${SITIO}/sitemap.xml`,
    host: SITIO,
  };
}
