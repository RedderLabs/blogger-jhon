import type { Metadata } from "next";
import Image from "next/image";

import { Pie } from "@/components/sitio/Pie";
import { TextoConFormato } from "@/components/sitio/TextoConFormato";
import { retratoDeSobreMi, seriesVisibles } from "@/lib/consultas";
import { medidasDeVisualizacion } from "@/lib/fotos";
import { prisma } from "@/lib/prisma";
import { metadatos } from "@/lib/sitio";
import { textoDeSobreMi } from "@/lib/sobreMiDelSitio";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const texto = await textoDeSobreMi();

  return await metadatos({
    titulo: texto.titulo,
    descripcion: texto.entradilla,
    ruta: "/sobre-mi",
  });
}

/**
 * El texto, las secciones y el retrato salen del panel (/admin/sobre-mi); las
 * cifras de la cabecera no se escriben a mano: se cuentan del archivo, así que
 * la página no se queda desfasada cuando entra un rollo nuevo.
 */
export default async function SobreMi() {
  const [texto, series, totalFotos, totalRollos, retrato] = await Promise.all([
    textoDeSobreMi(),
    seriesVisibles(),
    prisma.foto.count({ where: { estado: "publicada" } }),
    prisma.rollo.count({ where: { fotos: { some: { estado: "publicada" } } } }),
    retratoDeSobreMi(),
  ]);

  // La fotografía que acompaña al texto, si se ha elegido alguna en el panel.
  // Se pide a su medida —nunca más píxeles de los que tiene el escaneo— igual
  // que el resto de copias del sitio.
  const medidasDelRetrato = retrato
    ? medidasDeVisualizacion(retrato.foto)
    : null;

  // Sin retrato no hay nada que poner al lado, y entonces tampoco hay dos
  // columnas: dejar la de la derecha vacía encajonaba el texto a la izquierda
  // y dejaba su raya colgando en un hueco de 22rem.
  const hayColumnaAlLado = Boolean(retrato && medidasDelRetrato);

  const desde = series.length
    ? Math.min(...series.map((s) => s.anoInicio))
    : null;
  const abiertas = series.filter((s) => s.anoFin === null).length;

  return (
    <>
      <header
        className={`mx-auto grid w-full gap-4 px-5 pt-9 pb-7 sm:px-8 sm:pt-14 lg:pt-16 ${
          hayColumnaAlLado ? "max-w-[78rem] lg:px-12" : "max-w-[72ch]"
        }`}
      >
        <p className="lbl lbl-sitio flex items-center gap-3">
          <span>La persona</span>
          <span className="h-px flex-1 bg-filo" />
        </p>
        <h1 className="max-w-[18ch] font-serif text-[2.4rem] leading-none font-bold tracking-[-.02em] sm:text-[3rem] lg:text-[3.4rem]">
          {texto.titulo}
        </h1>
        <p className="max-w-[var(--medida)] text-[.9375rem] text-papel-2 sm:text-[1.0625rem]">
          {texto.entradilla}
        </p>
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          {series.length} {series.length === 1 ? "serie" : "series"}{" "}
          {abiertas > 0 && (
            <>
              ({abiertas} {abiertas === 1 ? "abierta" : "abiertas"}){" "}
            </>
          )}
          · {totalFotos} {totalFotos === 1 ? "fotograma" : "fotogramas"} ·{" "}
          {totalRollos} {totalRollos === 1 ? "rollo" : "rollos"}
          {desde && <> · desde {desde}</>}
        </p>
      </header>

      <main
        className={`mx-auto w-full flex-1 px-5 pb-14 sm:px-8 ${
          hayColumnaAlLado
            ? "max-w-[78rem] lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-16 lg:px-12"
            : "max-w-[72ch]"
        }`}
      >
        {/* --- La columna de lectura ---------------------------------------- */}
        <div
          className={`grid gap-9 border-t border-filo pt-8 ${
            hayColumnaAlLado ? "max-w-[var(--medida)]" : ""
          }`}
        >
          {texto.secciones.map((s, n) => (
            <section key={n} className="grid gap-3">
              {s.titulo && <h2 className="lbl lbl-sitio">{s.titulo}</h2>}
              <TextoConFormato
                texto={s.parrafos.join("\n\n")}
                className="text-[length:var(--texto)] leading-[var(--interlinea)] text-papel-2"
              />
            </section>
          ))}
        </div>

        {/* --- El retrato, al lado ---------------------------------------
            Sale sólo si se ha elegido una fotografía en /admin/sobre-mi.
            Sin ella la página se monta igual —a una columna— porque es mejor
            que no haya retrato a que se quede uno de relleno. */}
        {retrato && medidasDelRetrato && (
          <aside className="mt-10 grid content-start gap-8 border-t border-filo pt-8 lg:mt-0 lg:sticky lg:top-[calc(var(--alto-cabecera)+2rem)]">
            <figure className="m-0 grid gap-3">
              <Image
                src={retrato.foto.archivo}
                alt={retrato.foto.alt || retrato.pie || "Retrato del autor"}
                width={medidasDelRetrato.ancho}
                height={medidasDelRetrato.alto}
                sizes="(min-width: 1024px) 22rem, (min-width: 640px) 60vw, 100vw"
                quality={82}
                priority
                className="h-auto w-full bg-marco"
              />
              {retrato.pie && (
                <figcaption className="font-mono text-[.72rem] leading-relaxed tracking-[.04em] text-dato">
                  {retrato.pie}
                </figcaption>
              )}
            </figure>
          </aside>
        )}
      </main>

      <Pie />
    </>
  );
}
