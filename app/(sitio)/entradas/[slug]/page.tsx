import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { Pie } from "@/components/sitio/Pie";
import { type FotoDelVisor, Ampliar, Visor } from "@/components/sitio/Visor";
import { VideoDeYoutube } from "@/components/sitio/VideoDeYoutube";
import {
  bloquesAHtml,
  resumenDelCuerpo,
  sonBloques,
  trozosDelCuerpo,
} from "@/lib/cuerpo";
import { fechaLarga } from "@/lib/fotos";
import { destinoDe, rutaDeEntrada } from "@/lib/redirecciones";
import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { DatosEstructurados, absoluta, metadatos } from "@/lib/sitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/entradas/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const e = await prisma.entrada.findFirst({
    where: { slug, estado: "publica" },
    select: {
      titulo: true,
      cuerpo: true,
      publicadoEn: true,
      actualizadaEn: true,
      imagen: { select: { archivo: true, alt: true } },
    },
  });
  // Un borrador o una entrada borrada no se indexan: contestan 404 y lo dicen.
  if (!e) return { title: "Entrada no encontrada", robots: { index: false, follow: false } };

  return await metadatos({
    titulo: e.titulo,
    descripcion: resumenDelCuerpo(e.cuerpo),
    ruta: `/entradas/${slug}`,
    imagen: e.imagen?.archivo,
    imagenAlt: e.imagen?.alt,
    tipo: "article",
    publicado: e.publicadoEn,
    modificado: e.actualizadaEn,
  });
}

export default async function PaginaDeEntrada(
  props: PageProps<"/entradas/[slug]">,
) {
  const { slug } = await props.params;

  const entrada = await prisma.entrada.findFirst({
    where: { slug, estado: "publica" },
    include: {
      temas: { include: { tema: true } },
      series: { include: { serie: true } },
    },
  });
  // Antes de darla por perdida: la dirección puede ser la de antes de que se
  // corrigiera el título, o una de Blogger. Si consta la mudanza, se manda a
  // donde vive ahora con un 301, que es lo que entiende un buscador por
  // «se ha movido, y para siempre».
  if (!entrada) {
    const destino = await destinoDe(rutaDeEntrada(slug));
    if (destino) permanentRedirect(destino);
    notFound();
  }

  // El cuerpo es HTML desde que se escribe con el editor del panel; las
  // entradas de antes siguen guardadas en bloques y se convierten al leerlas.
  const cuerpo = sonBloques(entrada.cuerpo)
    ? bloquesAHtml(entrada.cuerpo)
    : entrada.cuerpo;
  const trozos = trozosDelCuerpo(cuerpo);
  const identidad = await identidadDelSitio();

  // Las fotos intercaladas se piden de una vez, no una por bloque.
  const idsDeFoto = trozos.flatMap((t) => (t.tipo === "foto" ? [t.fotoId] : []));
  const fotos = idsDeFoto.length
    ? await prisma.foto.findMany({
        where: { id: { in: idsDeFoto } },
        include: {
          series: {
            orderBy: { principal: "desc" },
            take: 1,
            include: { serie: { select: { slug: true, nombre: true } } },
          },
        },
      })
    : [];
  const porId = new Map(fotos.map((f) => [f.id, f]));

  // Las fotos en el orden en que aparecen: es el que siguen las flechas del
  // visor. `idsDeFoto` puede repetir una foto; el índice se queda con la
  // primera aparición, que es la que se amplía.
  const delVisor: FotoDelVisor[] = [];
  const indiceDeFoto = new Map<string, number>();
  for (const b of trozos) {
    if (b.tipo !== "foto") continue;
    const f = porId.get(b.fotoId);
    if (!f || indiceDeFoto.has(f.id)) continue;
    indiceDeFoto.set(f.id, delVisor.length);
    delVisor.push({
      id: f.id,
      archivo: f.archivo,
      alt: f.alt,
      ancho: f.ancho,
      alto: f.alto,
      anchoMax: f.anchoMax,
      pie: b.pie ?? f.series[0]?.serie.nombre ?? f.titulo,
      ficha: [f.camara, f.pelicula, f.apertura, f.velocidad].filter(Boolean).join(" · "),
    });
  }

  const minutos = Math.max(1, Math.round(entrada.palabras / 180));

  return (
    <>
      <DatosEstructurados
        datos={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: entrada.titulo,
          description: resumenDelCuerpo(cuerpo) || undefined,
          url: absoluta(`/entradas/${entrada.slug}`),
          datePublished: entrada.publicadoEn?.toISOString(),
          dateModified: entrada.actualizadaEn.toISOString(),
          wordCount: entrada.palabras || undefined,
          inLanguage: "es",
          author: { "@type": "Person", name: identidad.autor },
          publisher: { "@type": "Person", name: identidad.nombre },
          image: delVisor.length > 0 ? absoluta(delVisor[0].archivo) : undefined,
          about: entrada.temas.map((t) => t.tema.nombre),
        }}
      />

      <main className="flex-1 px-5 py-10 sm:px-8 lg:grid lg:grid-cols-[minmax(0,190px)_minmax(0,860px)] lg:justify-center lg:gap-12 lg:px-12 lg:py-16 xl:gap-16">
        <aside className="mb-8 grid content-start gap-4 border-b border-filo pb-6 font-mono text-[.7rem] leading-relaxed tracking-[.06em] text-dato lg:mb-0 lg:border-r lg:border-b-0 lg:pr-6 lg:pb-0">
          <div>
            <b className="block font-normal text-papel">Publicado</b>
            {fechaLarga(entrada.publicadoEn)}
          </div>
          <div>
            <b className="block font-normal text-papel">Lectura</b>
            {minutos} {minutos === 1 ? "minuto" : "minutos"}
          </div>
          {entrada.temas.length > 0 && (
            <div>
              <b className="block font-normal text-papel">Temas</b>
              {entrada.temas.map(({ tema }) => (
                <Link
                  key={tema.id}
                  href={`/entradas?tema=${tema.slug}`}
                  className="block hover:text-rojo"
                >
                  {tema.nombre}
                </Link>
              ))}
            </div>
          )}
          {entrada.series.length > 0 && (
            <div>
              <b className="block font-normal text-papel">
                {entrada.series.length === 1 ? "Serie citada" : "Series citadas"}
              </b>
              {entrada.series.map(({ serie }) => (
                <Link
                  key={serie.id}
                  href={`/series/${serie.slug}`}
                  className="block hover:text-rojo"
                >
                  {serie.nombre}
                </Link>
              ))}
            </div>
          )}
        </aside>

        <Visor fotos={delVisor}>
          {/* La columna del texto mide lo que la fotografía y no menos: si el
              renglón se cortara antes, centrar o justificar un párrafo lo
              dejaría descuadrado respecto a la imagen de al lado. `--medida`
              —la medida de lectura de /admin/ajustes— se pisa aquí al ancho
              del artículo; en el resto de páginas largas sigue mandando. */}
          <article
            className="w-full max-w-[860px]"
            style={{ "--medida": "100%" } as React.CSSProperties}
          >
          {entrada.kicker && (
            <p className="mb-4 font-mono text-[.7rem] tracking-[.14em] text-rojo uppercase">
              Entradas · {entrada.kicker}
            </p>
          )}
          <h1 className="font-serif text-[2rem] leading-[1.05] font-bold tracking-[-.015em] sm:text-[2.6rem]">
            {entrada.titulo}
          </h1>

          <div className="mt-8 flex flex-col gap-6">
            {trozos.map((b, i) => {
              if (b.tipo === "html") {
                // El HTML se sanea al guardarlo, en `sanearCuerpo`: lo que hay
                // en la base es exactamente lo que se sirve.
                return (
                  <div
                    key={i}
                    className="cuerpo w-full text-[length:var(--texto)] leading-[var(--interlinea)]"
                    dangerouslySetInnerHTML={{ __html: b.html }}
                  />
                );
              }
              if (b.tipo === "video") {
                return <VideoDeYoutube key={i} id={b.videoId} />;
              }
              const foto = porId.get(b.fotoId);
              if (!foto) return null;
              const serie = foto.series[0]?.serie;
              return (
                <figure key={i} className="m-0">
                  <Ampliar indice={indiceDeFoto.get(foto.id) ?? 0}>
                    <Image
                      src={foto.archivo}
                      alt={foto.alt}
                      width={foto.ancho}
                      height={foto.alto}
                      quality={82}
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 92vw, 860px"
                      // La primera fotografía de la entrada es casi siempre lo
                      // más grande que se pinta arriba del todo: pedirla con
                      // prioridad es la diferencia entre que la página se vea
                      // al momento o después de un salto en blanco.
                      priority={indiceDeFoto.get(foto.id) === 0}
                      className="h-auto w-full contrast-[1.04]"
                    />
                  </Ampliar>
                  <figcaption className="mt-2 flex flex-wrap justify-between gap-4 font-mono text-[.68rem] tracking-[.05em] text-dato">
                    <span>
                      {serie ? (
                        <Link href={`/series/${serie.slug}`} className="hover:text-rojo">
                          {b.pie ?? serie.nombre}
                        </Link>
                      ) : (
                        (b.pie ?? foto.titulo)
                      )}
                    </span>
                    <span>
                      {[foto.camara, foto.pelicula, foto.apertura, foto.velocidad]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
          </article>
        </Visor>
      </main>

      <Pie />
    </>
  );
}
