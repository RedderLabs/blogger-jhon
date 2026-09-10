import type { Metadata } from "next";

import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { nombreLargo } from "@/lib/identidad";

/**
 * Los datos del sitio en un solo sitio: lo que se enseña en el buscador, lo
 * que sale al compartir un enlace y la dirección desde la que se cuelgan las
 * canónicas y el sitemap.
 */

/**
 * Dónde vive. Se lee en cada petición y NO lleva el prefijo `NEXT_PUBLIC_`, y
 * eso no es un descuido: Next sustituye las variables `NEXT_PUBLIC_` por su
 * valor al compilar, de modo que el dominio quedaría cocido dentro de la
 * imagen de Docker y mudarse obligaría a reconstruirla. Así basta con
 * cambiarla en Render y reiniciar.
 *
 * Sin ella se cae a localhost, que en desarrollo es lo correcto y en
 * producción se nota enseguida: una canónica apuntando a localhost es un fallo
 * visible, no uno silencioso.
 */
export const SITIO = (process.env.SITIO_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export function absoluta(ruta: string) {
  return ruta.startsWith("http") ? ruta : SITIO + (ruta.startsWith("/") ? ruta : "/" + ruta);
}

type Entrada = {
  titulo?: string;
  descripcion?: string | null;
  /** Ruta del sitio, con barra inicial. Es la canónica. */
  ruta: string;
  /** Una foto que represente la página, en `/foto/…`. */
  imagen?: string | null;
  /** El texto alternativo de esa foto: también viaja al compartir. */
  imagenAlt?: string | null;
  tipo?: "website" | "article";
  publicado?: Date | null;
  modificado?: Date | null;
};

/**
 * Los metadatos de una página. Reúne en un sitio lo que si no se escribiría a
 * mano —y a medias— en cada una: canónica, tarjeta al compartir y la foto que
 * la acompaña.
 */
export async function metadatos({
  titulo,
  descripcion,
  ruta,
  imagen,
  imagenAlt,
  tipo = "website",
  publicado,
  modificado,
}: Entrada): Promise<Metadata> {
  // El nombre y la descripción de reserva salen de /admin/ajustes. Va por la
  // caché, así que esto no es una consulta por página.
  const identidad = await identidadDelSitio();

  const desc = descripcion?.trim() || identidad.descripcion;
  const url = absoluta(ruta);
  const fotos = imagen
    ? [{ url: absoluta(imagen), alt: imagenAlt || titulo || identidad.nombre }]
    : undefined;

  return {
    title: titulo,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: tipo,
      url,
      // En la portada el título de la tarjeta es el del sitio, no «%s · el
      // nombre»: compartir la raíz y ver el nombre repetido queda a medio
      // hacer.
      title: titulo ? `${titulo} · ${identidad.nombre}` : nombreLargo(identidad),
      description: desc,
      siteName: identidad.nombre,
      locale: "es_ES",
      images: fotos,
      ...(tipo === "article"
        ? {
            publishedTime: publicado?.toISOString(),
            modifiedTime: modificado?.toISOString(),
            authors: [identidad.autor],
          }
        : {}),
    },
    twitter: {
      card: fotos ? "summary_large_image" : "summary",
      title: titulo ? `${titulo} · ${identidad.nombre}` : nombreLargo(identidad),
      description: desc,
      images: fotos?.map((f) => f.url),
    },
  };
}

/**
 * Datos estructurados. Van en un `<script type="application/ld+json">` y son
 * lo que hace que una fotografía o un texto se entiendan como tales y no como
 * «una página con cosas».
 */
export function DatosEstructurados({ datos }: { datos: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // El JSON lo escribimos nosotros, no viene de fuera.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos) }}
    />
  );
}
