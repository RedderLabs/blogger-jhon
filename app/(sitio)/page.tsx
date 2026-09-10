import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";

import { Fotograma } from "@/components/Fotograma";
import { FilaDeArchivo } from "@/components/sitio/FilaDeArchivo";
import { Pie } from "@/components/sitio/Pie";
import {
  fotoDeApertura,
  hojaDelMes,
  rutaDeFoto,
  seriesVisibles,
  ultimaEntrada,
} from "@/lib/consultas";
import { nombreMes, rangoDeAnos } from "@/lib/fotos";
import type { SeccionDePortada } from "@/lib/portada";
import { seccionesDePortada, tituloDeSeccion } from "@/lib/portadaDelSitio";
import { prisma } from "@/lib/prisma";
import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { DatosEstructurados, SITIO, absoluta } from "@/lib/sitio";

export const dynamic = "force-dynamic";

/**
 * Qué se enseña, en qué orden y con qué rótulo se decide en /admin/portada:
 * las tres piezas estaban escritas una detrás de otra aquí, y enseñar la
 * portada sin la hoja de contactos era tocar código.
 *
 * Las consultas se hacen todas aunque una sección esté apagada. Van por la
 * caché y son las mismas tres de siempre; encadenarlas al interruptor
 * ahorraría poco y haría que encender una sección tardase en notarse.
 */
export default async function Portada() {
  const [identidad, secciones, apertura, hoja, series, totalFotos, entrada] =
    await Promise.all([
      identidadDelSitio(),
      seccionesDePortada(),
      fotoDeApertura(),
      hojaDelMes(),
      seriesVisibles(),
      prisma.foto.count({ where: { estado: "publicada" } }),
      ultimaEntrada(),
    ]);

  const seVe = (clave: string) =>
    secciones.some((s) => s.clave === clave && s.visible);

  // Encendida no basta: una sección sin nada dentro —sin apertura, sin rollo
  // publicado— no se pinta, y eso cambia cuál es la primera.
  const hayContenido = (clave: SeccionDePortada["clave"]) => {
    if (clave === "apertura") return Boolean(apertura);
    if (clave === "hoja") return Boolean(hoja && hoja.fotos.length > 0);
    if (clave === "entradas") return Boolean(entrada);
    return series.length > 0;
  };

  const visibles = secciones.filter((s) => s.visible && hayContenido(s.clave));

  // La apertura no lleva rótulo —es la fotografía y nada más—, así que el h1
  // se lo queda el de la primera sección que sí tenga. Si no queda ninguna
  // —una portada de sólo apertura— se pone uno para lectores de pantalla y
  // buscadores más abajo: una página sin encabezado de primer nivel no la
  // entiende ni el uno ni el otro.
  const conTitular = visibles.find((s) => s.clave !== "apertura")?.clave;

  function bloque(seccion: SeccionDePortada) {
    const titulo = tituloDeSeccion(seccion);
    const Titular = seccion.clave === conTitular ? "h1" : "h2";

    if (seccion.clave === "apertura") {
      if (!apertura) return null;
      return (
        <section className="bg-cuarto-3">
          {/* La fotografía y nada encima. En el teléfono se lee en vertical; a
              partir de tableta, apaisada como en la maqueta. Lo que era el
              titular, la frase y la ficha técnica se quitó a propósito: la
              apertura es una copia colgada, no un cartel. */}
          <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[16/9]">
            <Image
              src={apertura.archivo}
              alt={apertura.alt}
              fill
              priority
              quality={82}
              sizes="100vw"
              className="object-cover contrast-[1.05]"
            />
          </div>
        </section>
      );
    }

    if (seccion.clave === "hoja") {
      if (!hoja || hoja.fotos.length === 0) return null;
      return (
        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-4 px-5 pt-8 pb-4 sm:px-8 sm:pt-10 lg:px-12">
            <Titular className="font-serif text-[1.5rem] italic">
              {titulo}
            </Titular>
            <span className="lbl lbl-sitio">
              {nombreMes(hoja.fecha)} {hoja.fecha.getUTCFullYear()} ·{" "}
              {hoja.fotos.length} fotogramas
            </span>
          </div>

          <div className="grid grid-cols-2 gap-[2px] px-5 pb-8 sm:grid-cols-3 sm:px-8 lg:grid-cols-4 lg:px-12">
            {hoja.fotos.map((f, i) => {
              const ruta = rutaDeFoto(f);
              const serie = f.series[0]?.serie.nombre;
              return (
                <Fotograma
                  key={f.id}
                  src={f.archivo}
                  alt={f.alt}
                  numero={f.orden}
                  pie={
                    serie
                      ? `${serie} · ${String(f.orden).padStart(2, "0")}`
                      : undefined
                  }
                  href={ruta ?? undefined}
                  prioridad={i < 2}
                  sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                />
              );
            })}
          </div>
        </section>
      );
    }

    if (seccion.clave === "entradas") {
      if (!entrada?.publicadoEn) return null;
      const tema = entrada.temas[0]?.tema.nombre;
      return (
        <section className="px-5 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-filo pt-8 pb-4">
            <Titular className="font-serif text-[1.5rem] italic">
              {titulo}
            </Titular>
            <Link href="/entradas" className="lbl lbl-sitio hover:text-rojo">
              Todas las entradas ↗
            </Link>
          </div>

          {/* La misma fila que en el archivo: día, miniatura, título y tema. El
              rótulo «Entradas» sobra aquí —lo dice el titular de la sección— y
              el «texto» del recuento tampoco añade nada. */}
          <FilaDeArchivo
            cosa={{
              id: entrada.id,
              fecha: entrada.publicadoEn,
              titulo: entrada.titulo,
              destino: tema ?? "",
              href: `/entradas/${entrada.slug}`,
              cuantas: "",
              miniatura: entrada.imagen?.archivo ?? null,
            }}
          />
        </section>
      );
    }

    return (
      <section className="px-5 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-filo pt-8 pb-4">
          <Titular className="font-serif text-[1.5rem] italic">
            {titulo}
          </Titular>
          <span className="lbl lbl-sitio">
            {totalFotos} fotogramas publicados
          </span>
        </div>

        <ul className="m-0 list-none p-0">
          {series.map((s, i) => (
            <li key={s.id}>
              <Link
                href={`/series/${s.slug}`}
                className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-1 border-b border-filo py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-x-10 sm:py-[1.15rem]"
              >
                <span className="font-mono text-[.7rem] tracking-[.1em] text-dato group-hover:text-rojo">
                  S/{String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-serif text-[1.2rem] leading-tight font-normal group-hover:text-white sm:text-[1.6rem] lg:text-[1.9rem]">
                  {s.nombre}
                </h3>
                <span className="col-start-2 font-mono text-[.7rem] tracking-[.08em] whitespace-nowrap text-dato sm:col-start-3">
                  {rangoDeAnos(s.anoInicio, s.anoFin)}
                </span>
                <span className="col-start-2 font-mono text-[.7rem] tracking-[.08em] whitespace-nowrap text-dato sm:col-start-4">
                  {s._count.fotos} fotos
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <>
      {/* Quién firma esto y qué es. Es lo que permite que el nombre salga
          como una persona con obra, y no como una cadena de texto más. */}
      <DatosEstructurados
        datos={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${SITIO}/#sitio`,
              url: SITIO,
              name: identidad.nombre,
              description: identidad.descripcion,
              inLanguage: "es",
              author: { "@id": `${SITIO}/#autor` },
            },
            {
              "@type": "Person",
              "@id": `${SITIO}/#autor`,
              name: identidad.autor,
              url: absoluta("/sobre-mi"),
              // La cara del autor para un buscador es la que abre el sitio; si
              // la apertura está apagada, mejor sin imagen que con una que
              // nadie ve.
              image:
                apertura && seVe("apertura")
                  ? absoluta(apertura.archivo)
                  : undefined,
            },
          ],
        }}
      />

      {/* Nadie lo ve: es el encabezado de primer nivel para cuando la portada
          es sólo la fotografía y no queda ningún rótulo que lo lleve. */}
      {!conTitular && <h1 className="sr-only">{identidad.nombre}</h1>}

      {visibles.map((s) => (
        <Fragment key={s.clave}>{bloque(s)}</Fragment>
      ))}

      <Pie />
    </>
  );
}
