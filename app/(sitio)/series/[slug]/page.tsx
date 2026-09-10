import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Fotograma } from "@/components/Fotograma";
import { Pie } from "@/components/sitio/Pie";
import { serieporSlug } from "@/lib/consultas";
import { resumenDelCuerpo } from "@/lib/cuerpo";
import { estadoSerie, fechaFicha, rangoDeAnos } from "@/lib/fotos";
import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { DatosEstructurados, absoluta, metadatos } from "@/lib/sitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/series/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const serie = await prisma.serie.findFirst({
    where: { slug, estado: { not: "oculta" } },
    select: {
      nombre: true,
      nota: true,
      anoInicio: true,
      anoFin: true,
      actualizadaEn: true,
      portada: { select: { archivo: true, alt: true } },
      fotos: {
        where: { foto: { estado: "publicada" } },
        orderBy: { posicion: "asc" },
        take: 1,
        select: { foto: { select: { archivo: true, alt: true } } },
      },
    },
  });
  if (!serie) return { title: "Serie no encontrada", robots: { index: false, follow: false } };

  // Sin portada elegida manda la primera de la serie: una tarjeta sin foto,
  // en un sitio de fotografía, es la peor de las tarjetas.
  const cara = serie.portada ?? serie.fotos[0]?.foto ?? null;
  const anos = serie.anoFin ? `${serie.anoInicio}–${serie.anoFin}` : `desde ${serie.anoInicio}`;

  return await metadatos({
    titulo: serie.nombre,
    descripcion: serie.nota ?? `Serie fotográfica, ${anos}.`,
    ruta: `/series/${slug}`,
    imagen: cara?.archivo,
    imagenAlt: cara?.alt,
    modificado: serie.actualizadaEn,
  });
}

export default async function HojaDeSerie(props: PageProps<"/series/[slug]">) {
  const { slug } = await props.params;
  const serie = await serieporSlug(slug);
  if (!serie) notFound();

  const fotos = serie.fotos.map((f) => ({ ...f.foto, posicion: f.posicion }));
  const est = estadoSerie(serie.estado);
  const identidad = await identidadDelSitio();

  // Los datos técnicos que se repiten en la serie son los que la describen.
  const dominante = (valores: (string | null)[]) => {
    const cuenta = new Map<string, number>();
    for (const v of valores) if (v) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  };

  const datos = [
    { valor: String(fotos.length), etiqueta: "fotogramas" },
    {
      valor: serie.anoFin
        ? `${serie.anoFin - serie.anoInicio + 1}`
        : `${new Date().getUTCFullYear() - serie.anoInicio + 1}`,
      etiqueta: "años de trabajo",
    },
    { valor: dominante(fotos.map((f) => f.camara)), etiqueta: "cámara" },
    { valor: dominante(fotos.map((f) => f.pelicula)), etiqueta: "película" },
    { valor: dominante(fotos.map((f) => f.revelado)), etiqueta: "revelado" },
  ];

  const siguiente = await prisma.serie.findFirst({
    where: { estado: { not: "oculta" }, orden: { gt: serie.orden } },
    orderBy: { orden: "asc" },
    include: { _count: { select: { fotos: true } } },
  });

  return (
    <>
      <DatosEstructurados
        datos={{
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: serie.nombre,
          description: serie.nota || undefined,
          url: absoluta(`/series/${serie.slug}`),
          inLanguage: "es",
          author: { "@type": "Person", name: identidad.autor },
          dateModified: serie.actualizadaEn.toISOString(),
          numberOfItems: fotos.length,
          associatedMedia: fotos.map((f) => ({
            "@type": "ImageObject",
            contentUrl: absoluta(f.archivo),
            caption: f.alt || f.titulo,
            width: f.ancho,
            height: f.alto,
            url: absoluta(`/series/${serie.slug}/${f.posicion}`),
          })),
        }}
      />

      <header className="ancho-sitio grid gap-4 px-5 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <p
          className="font-mono text-[.72rem] tracking-[.14em] uppercase"
          style={{ color: est.color }}
        >
          Serie {String(serie.orden).padStart(2, "0")} · {est.etiqueta.toLowerCase()}
        </p>
        <h1 className="max-w-[16ch] font-serif text-[2.4rem] leading-[.98] font-bold tracking-[-.025em] sm:text-[3.2rem] lg:text-[4rem]">
          {serie.nombre}
        </h1>
        {serie.nota && (
          <p className="max-w-[64ch] text-papel-2">{serie.nota}</p>
        )}
      </header>

      {/* Teléfono: la ficha como lista. «D-76 1+1 · 9 min · 20 °C» en Bodoni a
          gran cuerpo se parte en tres líneas y no dice nada; en monoespaciada
          y en una fila se lee de un golpe. */}
      <dl className="mx-5 mt-7 border-t border-filo md:hidden">
        {datos.map((d) => (
          <div
            key={d.etiqueta}
            className="flex items-baseline justify-between gap-5 border-b border-filo py-[.6rem]"
          >
            <dt className="shrink-0 font-mono text-[.6875rem] tracking-[.1em] text-dato uppercase">
              {d.etiqueta}
            </dt>
            <dd className="m-0 text-right font-mono text-[.8125rem] tabular-nums">
              {d.valor}
            </dd>
          </div>
        ))}
      </dl>

      {/* Tableta y escritorio: la retícula de cifras del diseño */}
      <div className="ancho-sitio hidden px-8 md:block lg:px-12">
        <dl className="mt-8 grid grid-cols-3 border-t border-b border-filo lg:grid-cols-5">
        {datos.map((d) => (
          <div
            key={d.etiqueta}
            className="grid content-start gap-1 border-r border-filo px-[1.15rem] py-[1.05rem] last:border-r-0"
          >
            <dd className="m-0 font-serif text-[1.6rem] leading-none font-bold tabular-nums">
              {d.valor}
            </dd>
            <dt className="font-mono text-[.75rem] tracking-[.06em] text-dato">
              {d.etiqueta}
            </dt>
          </div>
          ))}
        </dl>
      </div>

      <div className="ancho-sitio flex flex-wrap items-baseline justify-between gap-4 px-5 pt-7 pb-4 sm:px-8 lg:px-12">
        <h2 className="font-serif text-[1.35rem] italic">
          <span className="md:hidden">La serie</span>
          <span className="hidden md:inline">Hoja de contactos</span>
        </h2>
        <span className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          {fotos.length} {fotos.length === 1 ? "fotograma" : "fotogramas"}
        </span>
      </div>

      <main className="ancho-sitio flex-1 px-5 sm:px-8 lg:px-12">
        {fotos.length === 0 ? (
          <p className="border border-dashed border-filo-2 px-6 py-16 text-center font-mono text-[.75rem] tracking-[.06em] text-dato">
            Todavía no hay fotogramas publicados en esta serie.
          </p>
        ) : (
          <>
            {/* Teléfono: una fotografía por pantalla, a sangre y en su propia
                proporción, con la ficha debajo. La hoja de contactos es para
                comparar; en el móvil se viene a mirar. */}
            <div className="-mx-5 flex flex-col gap-9 md:hidden">
              {fotos.map((f, i) => (
                <article key={f.id}>
                  <Link
                    href={`/series/${serie.slug}/${f.posicion}`}
                    className="block bg-marco"
                  >
                    <Image
                      src={f.archivo}
                      alt={f.alt}
                      width={f.ancho}
                      height={f.alto}
                      quality={82}
                      priority={i === 0}
                      sizes="(min-width: 768px) 20vw, 100vw"
                      className="h-auto w-full contrast-[1.04]"
                    />
                  </Link>
                  <div className="flex items-baseline gap-3 px-5 pt-3">
                    <span className="shrink-0 font-mono text-[.66rem] tracking-[.1em] text-rojo">
                      {String(f.posicion).padStart(2, "0")}
                    </span>
                    <h3 className="min-w-0 flex-1 font-serif text-[1.15rem] leading-tight">
                      {f.titulo}
                    </h3>
                  </div>
                  <p className="px-5 pt-1 pl-[2.6rem] font-mono text-[.625rem] leading-[1.7] tracking-[.05em] text-dato">
                    {[f.optica, f.apertura, f.velocidad, f.pelicula]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </article>
              ))}
            </div>

            {/* Tableta y escritorio: la hoja de contactos de verdad */}
            <div className="hidden gap-[2px] md:grid md:grid-cols-3 lg:grid-cols-5">
              {fotos.map((f, i) => (
                <Fotograma
                  key={f.id}
                  src={f.archivo}
                  alt={f.alt}
                  numero={f.posicion}
                  pie={f.titulo}
                  href={`/series/${serie.slug}/${f.posicion}`}
                  prioridad={i < 4}
                  vertical={false}
                  sizes="(max-width: 767px) 96px, (max-width: 1023px) 33vw, 20vw"
                />
              ))}
            </div>
          </>
        )}

        {serie.entradas.length > 0 && (
          <section className="grid gap-6 pt-14">
            <p className="lbl lbl-sitio flex items-center gap-3">
              <span>En las entradas</span>
              <span className="h-px flex-1 bg-filo" />
            </p>
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
              {serie.entradas.map(({ entrada }) => {
                const resumen = resumenDelCuerpo(entrada.cuerpo);
                return (
                  <Link
                    key={entrada.id}
                    href={`/entradas/${entrada.slug}`}
                    // Igual que en el índice: sin `content-start`, la tarjeta
                    // más corta de la fila se estira y reparte el hueco entre
                    // sus líneas, que se separan sin motivo.
                    className="group grid content-start gap-2 border-t border-filo pt-[1.1rem]"
                  >
                    <span className="font-mono text-[.7rem] tracking-[.12em] text-dato uppercase transition-colors group-hover:text-rojo">
                      {fechaFicha(entrada.publicadoEn)} · {entrada.kicker}
                    </span>
                    <h3 className="font-serif text-[1.35rem] leading-tight font-normal transition-colors group-hover:text-white sm:text-[1.55rem]">
                      {entrada.titulo}
                    </h3>
                    {resumen && (
                      <p className="max-w-[46ch] text-[.9375rem] leading-relaxed text-dato">
                        {resumen}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {siguiente && (
          <Link
            href={`/series/${siguiente.slug}`}
            className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-b border-filo py-8 sm:flex-row sm:items-center"
          >
            <span className="grid gap-2">
              <span className="lbl lbl-sitio">Serie siguiente</span>
              <span className="font-serif text-[1.6rem] leading-tight font-normal sm:text-[2.2rem]">
                {siguiente.nombre}
              </span>
            </span>
            <span className="font-mono text-[.72rem] tracking-[.1em] whitespace-nowrap text-dato">
              {siguiente._count.fotos} fotos ·{" "}
              {rangoDeAnos(siguiente.anoInicio, siguiente.anoFin)}
            </span>
          </Link>
        )}
      </main>

      <Pie />
    </>
  );
}
