import type { MetadataRoute } from "next";

import { legalesVisibles } from "@/lib/legalesDelSitio";
import { paginaDeContacto } from "@/lib/paginaContactoDelSitio";
import { paginasDelSitio } from "@/lib/paginasDelSitio";
import { prisma } from "@/lib/prisma";
import { absoluta } from "@/lib/sitio";

/**
 * El mapa del sitio, hecho contra la base en cada petición.
 *
 * No hay lista escrita a mano que mantener: publicar una serie, una entrada o
 * un fotograma desde el panel lo mete aquí, y ocultarlo lo saca. Lo que está
 * en borrador o oculto no aparece nunca.
 *
 * Va sin caché a propósito. Un buscador lo pide de tarde en tarde y lo que se
 * gana es que una foto publicada hace un minuto ya esté dentro.
 *
 * Lo que se sirve desde `public/` no entra aquí, y en particular
 * `/manual.html`: es el manual del panel, no es obra, y está cerrado en
 * `app/robots.ts` y con su propia cabecera en `next.config.ts`.
 */
export const dynamic = "force-dynamic";

type Fija = {
  ruta: string;
  prioridad: number;
  cada: MetadataRoute.Sitemap[number]["changeFrequency"];
  /** Si la lleva, la página se puede apagar desde el panel. */
  clave?: "entradas" | "contacto" | "cookies" | "privacidad" | "terminos";
};

/** Las páginas sueltas del sitio, con su importancia relativa. */
const FIJAS: Fija[] = [
  { ruta: "/", prioridad: 1, cada: "weekly" },
  { ruta: "/entradas", prioridad: 0.8, cada: "weekly", clave: "entradas" },
  { ruta: "/archivo", prioridad: 0.5, cada: "monthly" },
  { ruta: "/sobre-mi", prioridad: 0.5, cada: "yearly" },
  { ruta: "/aviso", prioridad: 0.3, cada: "yearly" },
  { ruta: "/contacto", prioridad: 0.4, cada: "yearly", clave: "contacto" },
  // La letra pequeña. Prioridad baja y cambio anual: tienen que estar y tienen
  // que poder encontrarse, pero no compiten con la obra.
  { ruta: "/cookies", prioridad: 0.2, cada: "yearly", clave: "cookies" },
  { ruta: "/privacidad", prioridad: 0.2, cada: "yearly", clave: "privacidad" },
  { ruta: "/terminos", prioridad: 0.2, cada: "yearly", clave: "terminos" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [contacto, paginas, legales, series, entradas] = await Promise.all([
    // Apagada desde el panel, una página no existe hacia fuera: contesta 404
    // y tampoco tiene sentido ofrecérsela a un buscador. Lo que cuelga de ella
    // sí sigue aquí: una serie o un texto concretos siguen abiertos, y se
    // llega a ellos desde el archivo, la portada y el buscador.
    paginaDeContacto(),
    paginasDelSitio(),
    legalesVisibles(),
    prisma.serie.findMany({
      where: { estado: { not: "oculta" } },
      select: {
        slug: true,
        actualizadaEn: true,
        portada: { select: { archivo: true } },
        fotos: {
          where: { foto: { estado: "publicada" } },
          orderBy: { posicion: "asc" },
          select: {
            posicion: true,
            foto: { select: { archivo: true, actualizadaEn: true } },
          },
        },
      },
    }),
    prisma.entrada.findMany({
      where: { estado: "publica" },
      select: {
        slug: true,
        publicadoEn: true,
        actualizadaEn: true,
        imagen: { select: { archivo: true } },
      },
    }),
  ]);

  // La portada se mueve cuando se mueve cualquier cosa: su fecha es la más
  // reciente de todo lo publicado, no la del despliegue.
  const fechas = [
    ...series.map((s) => s.actualizadaEn),
    ...entradas.map((e) => e.actualizadaEn),
  ];
  const ultimoCambio = fechas.length
    ? new Date(Math.max(...fechas.map((f) => f.getTime())))
    : new Date();

  const visibles = { ...paginas, ...legales, contacto: contacto.visible };

  const fijas: MetadataRoute.Sitemap = FIJAS.filter(
    (p) => !p.clave || visibles[p.clave],
  ).map((p) => ({
    url: absoluta(p.ruta),
    lastModified: ultimoCambio,
    changeFrequency: p.cada,
    priority: p.prioridad,
  }));

  const hojasDeSerie: MetadataRoute.Sitemap = series.map((s) => ({
    url: absoluta(`/series/${s.slug}`),
    lastModified: s.actualizadaEn,
    changeFrequency: "monthly",
    priority: 0.8,
    // Las fotos de la serie, para el índice de imágenes: es lo que de verdad
    // se busca de un fotógrafo.
    images: s.fotos.map((f) => absoluta(f.foto.archivo)),
  }));

  const fichasDeFoto: MetadataRoute.Sitemap = series.flatMap((s) =>
    s.fotos.map((f) => ({
      url: absoluta(`/series/${s.slug}/${f.posicion}`),
      lastModified: f.foto.actualizadaEn,
      changeFrequency: "yearly" as const,
      priority: 0.6,
      images: [absoluta(f.foto.archivo)],
    })),
  );

  const deEntradas: MetadataRoute.Sitemap = entradas.map((e) => ({
    url: absoluta(`/entradas/${e.slug}`),
    lastModified: e.actualizadaEn,
    changeFrequency: "monthly",
    priority: 0.7,
    images: e.imagen ? [absoluta(e.imagen.archivo)] : undefined,
  }));

  return [...fijas, ...hojasDeSerie, ...fichasDeFoto, ...deEntradas];
}
