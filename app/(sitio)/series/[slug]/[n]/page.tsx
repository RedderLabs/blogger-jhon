import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Copia } from "@/components/Copia";
import { FlechasDeTeclado } from "@/components/sitio/FlechasDeTeclado";
import { fechaFicha, medidasDeVisualizacion } from "@/lib/fotos";
import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { DatosEstructurados, absoluta, metadatos } from "@/lib/sitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function cargar(slug: string, posicion: number) {
  const serie = await prisma.serie.findFirst({
    where: { slug, estado: { not: "oculta" } },
    include: {
      fotos: {
        where: { foto: { estado: "publicada" } },
        orderBy: { posicion: "asc" },
        include: { foto: true },
      },
    },
  });
  if (!serie) return null;

  const indice = serie.fotos.findIndex((f) => f.posicion === posicion);
  if (indice === -1) return null;

  return {
    serie,
    indice,
    foto: serie.fotos[indice].foto,
    anterior: serie.fotos[indice - 1]?.posicion ?? null,
    siguiente: serie.fotos[indice + 1]?.posicion ?? null,
    total: serie.fotos.length,
  };
}

export async function generateMetadata(
  props: PageProps<"/series/[slug]/[n]">,
): Promise<Metadata> {
  const { slug, n } = await props.params;
  const datos = await cargar(slug, Number(n));
  if (!datos) return { title: "Fotograma no encontrado", robots: { index: false, follow: false } };

  const { foto, serie } = datos;
  // La descripción sale del alt, que es lo que describe la fotografía de
  // verdad; si no lo hay, de la nota, y si tampoco, de la ficha técnica.
  const tecnica = [foto.camara, foto.pelicula, foto.lugar].filter(Boolean).join(" · ");

  return await metadatos({
    titulo: `${foto.titulo} · ${serie.nombre}`,
    descripcion: foto.alt || foto.nota || tecnica || null,
    ruta: `/series/${slug}/${n}`,
    imagen: foto.archivo,
    imagenAlt: foto.alt,
    modificado: foto.actualizadaEn,
  });
}

export default async function FichaDeFoto(props: PageProps<"/series/[slug]/[n]">) {
  const { slug, n } = await props.params;
  const posicion = Number(n);
  if (!Number.isInteger(posicion)) notFound();

  const datos = await cargar(slug, posicion);
  if (!datos) notFound();

  const { serie, foto, anterior, siguiente, total } = datos;
  const medidas = medidasDeVisualizacion(foto);
  const identidad = await identidadDelSitio();

  const ficha = [
    ["Cámara", foto.camara],
    ["Óptica", foto.optica],
    ["Película", foto.pelicula],
    ["Índice EI", foto.ei],
    ["Exposición", [foto.apertura, foto.velocidad].filter(Boolean).join(" · ")],
    ["Revelado", foto.revelado],
    ["Escaneo", foto.escaneo],
    ["Fecha", fechaFicha(foto.fecha)],
    ["Lugar", foto.lugar],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      {/* Que un buscador entienda esto como una fotografía —con su autor, su
          cámara y su película— y no como una página con una imagen dentro. */}
      <DatosEstructurados
        datos={{
          "@context": "https://schema.org",
          "@type": "Photograph",
          name: foto.titulo,
          description: foto.alt || foto.nota || undefined,
          url: absoluta(`/series/${serie.slug}/${posicion}`),
          dateCreated: foto.fecha?.toISOString(),
          creator: { "@type": "Person", name: identidad.autor },
          copyrightHolder: { "@type": "Person", name: identidad.autor },
          isPartOf: {
            "@type": "CreativeWorkSeries",
            name: serie.nombre,
            url: absoluta(`/series/${serie.slug}`),
          },
          image: {
            "@type": "ImageObject",
            contentUrl: absoluta(foto.archivo),
            width: foto.ancho,
            height: foto.alto,
            caption: foto.alt || foto.titulo,
            contentLocation: foto.lugar || undefined,
            // La ficha técnica, que en fotografía es parte de la obra.
            exifData: [
              ["Cámara", foto.camara],
              ["Óptica", foto.optica],
              ["Película", foto.pelicula],
              ["Revelado", foto.revelado],
            ]
              .filter(([, v]) => v)
              .map(([nombre, valor]) => ({
                "@type": "PropertyValue",
                name: nombre,
                value: valor,
              })),
          },
        }}
      />

      <FlechasDeTeclado
        anterior={anterior === null ? null : `/series/${serie.slug}/${anterior}`}
        siguiente={siguiente === null ? null : `/series/${serie.slug}/${siguiente}`}
        serie={`/series/${serie.slug}`}
      />

      {/*
        La pantalla se reparte justo, sin que sobre ni falte:
        alto de ventana − cabecera − barra inferior. Dentro, la copia se queda
        quieta y lo único que se desplaza es la ficha. Así se puede leer el
        revelado sin perder de vista la fotografía.
      */}
      <main
        className="flex h-[calc(100dvh-var(--alto-cabecera)-var(--hueco-nav-inferior)-1px)] flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_396px]"
      >
        <Copia
          foto={foto}
          prioridad
          className="max-h-[52vh] shrink-0 sm:max-h-[56vh] lg:h-full lg:max-h-none lg:shrink"
        />

        <aside className="flex min-h-0 flex-1 flex-col border-t border-filo lg:border-t-0 lg:border-l">
          <div className="scroll-fino flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-6 sm:px-8 lg:px-7 lg:py-7">
            <div>
              <p className="font-mono text-[.72rem] tracking-[.14em] text-rojo uppercase">
                <Link href={`/series/${serie.slug}`} className="hover:text-papel">
                  {serie.nombre}
                </Link>{" "}
                · {String(posicion).padStart(2, "0")} / {total}
              </p>
              <h1 className="mt-2 font-serif text-[1.6rem] leading-tight font-bold sm:text-[1.8rem] lg:text-[1.6rem]">
                {foto.titulo}
              </h1>
            </div>

            <dl className="exif grid gap-3">
              {ficha.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>

            {foto.nota && (
              <p className="max-w-[46ch] text-[.9375rem] leading-relaxed text-papel-2">
                {foto.nota}
              </p>
            )}

            <p className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
              Copia servida a {medidas.ancho} px como máximo, del escaneo de {foto.ancho} ×{" "}
              {foto.alto} px.
            </p>
          </div>

          {/* Nunca se va de la pantalla: es lo único que hace falta para
              recorrer la serie con el pulgar. */}
          <nav className="flex shrink-0 items-center justify-between gap-4 border-t border-filo bg-cuarto px-5 py-4 font-mono text-[.7rem] tracking-[.12em] uppercase sm:px-8 lg:px-7 lg:py-5">
            {anterior !== null ? (
              <Link
                href={`/series/${serie.slug}/${anterior}`}
                className="text-dato hover:text-papel"
              >
                ← <span className="hidden sm:inline">Anterior</span>
                <span className="sm:hidden">Ant.</span>
              </Link>
            ) : (
              <span className="text-apagado">
                ← <span className="hidden sm:inline">Anterior</span>
                <span className="sm:hidden">Ant.</span>
              </span>
            )}

            <Link href={`/series/${serie.slug}`} className="text-rojo hover:text-rojo-2">
              Ver serie
            </Link>

            {siguiente !== null ? (
              <Link
                href={`/series/${serie.slug}/${siguiente}`}
                className="text-dato hover:text-papel"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <span className="sm:hidden">Sig.</span> →
              </Link>
            ) : (
              <span className="text-apagado">
                <span className="hidden sm:inline">Siguiente</span>
                <span className="sm:hidden">Sig.</span> →
              </span>
            )}
          </nav>
        </aside>
      </main>
    </>
  );
}
