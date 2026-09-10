import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Pie } from "@/components/sitio/Pie";
import { resumenDelCuerpo } from "@/lib/cuerpo";
import { entradillasDelSitio } from "@/lib/entradillasDelSitio";
import { fechaFicha } from "@/lib/fotos";
import { paginasDelSitio } from "@/lib/paginasDelSitio";
import { metadatos } from "@/lib/sitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return metadatos({
    titulo: "Entradas",
    descripcion:
      "Los textos, en su propia casa: método, mirada, equipo y crítica. Temas en vez de semanas.",
    ruta: "/entradas",
  });
}

export default async function Entradas(props: PageProps<"/entradas">) {
  // Apagado desde /admin/entradas, el indice deja de existir hacia fuera. Lo
  // que cuelga de el no: cada texto publicado sigue abierto en su direccion y
  // se llega desde el archivo, la portada y el buscador.
  const { entradas: indiceEncendido } = await paginasDelSitio();
  if (!indiceEncendido) notFound();

  // El párrafo de debajo del título se escribe en /admin/ajustes.
  const { entradas: entradilla } = await entradillasDelSitio();

  const { tema } = await props.searchParams;
  const temaElegido = typeof tema === "string" ? tema : null;

  const [entradas, temas] = await Promise.all([
    prisma.entrada.findMany({
      where: {
        estado: "publica",
        ...(temaElegido
          ? { temas: { some: { tema: { slug: temaElegido } } } }
          : {}),
      },
      orderBy: { publicadoEn: "desc" },
      include: {
        imagen: { select: { archivo: true, alt: true } },
        temas: { include: { tema: true } },
      },
    }),
    prisma.tema.findMany({
      where: { entradas: { some: { entrada: { estado: "publica" } } } },
      orderBy: { nombre: "asc" },
      include: { _count: { select: { entradas: true } } },
    }),
  ]);

  return (
    <>
      <header className="grid gap-4 px-5 pt-12 pb-8 sm:px-8 sm:pt-16 lg:px-12">
        <p className="lbl lbl-sitio flex items-center gap-3">
          <span>La escritura</span>
          <span className="h-px flex-1 bg-filo" />
        </p>
        <h1 className="font-serif text-[2.4rem] leading-none font-bold tracking-[-.02em] sm:text-[3rem] lg:text-[3.4rem]">
          Entradas
        </h1>
        <p className="max-w-[64ch] text-papel-2">{entradilla}</p>
      </header>

      {temas.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-filo px-5 pb-4 sm:px-8 lg:px-12">
          <span className="lbl">Temas</span>
          <span className="flex flex-wrap">
            <Link
              href="/entradas"
              scroll={false}
              className="seg"
              data-on={!temaElegido ? "si" : undefined}
            >
              Todos
            </Link>
            {temas.map((t) => (
              <Link
                key={t.id}
                href={`/entradas?tema=${t.slug}`}
                scroll={false}
                className="seg"
                data-on={temaElegido === t.slug ? "si" : undefined}
              >
                {t.nombre} · {t._count.entradas}
              </Link>
            ))}
          </span>
        </div>
      )}

      <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
        {entradas.length === 0 ? (
          <p className="border border-dashed border-filo-2 px-6 py-16 text-center font-mono text-[.75rem] tracking-[.06em] text-dato">
            Todavía no hay nada publicado con ese tema.
          </p>
        ) : (
          <div className="grid gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
            {entradas.map((e, i) => {
              const resumen = resumenDelCuerpo(e.cuerpo);
              return (
                <Link
                  key={e.id}
                  href={`/entradas/${e.slug}`}
                  // `content-start` no es decorado: sin él, una tarjeta corta
                  // —una entrada sin resumen— se estira hasta la altura de la
                  // más alta de su fila, y al estirarse reparte ese hueco
                  // entre sus filas. La de la fotografía crecía con las demás
                  // y el 3:2 se iba al garete: la misma imagen salía más alta
                  // en una tarjeta que en la de al lado, y las fechas y los
                  // títulos de las dos columnas dejaban de cuadrar.
                  className="group grid content-start gap-3"
                >
                  {/* El hueco de la fotografía se pinta siempre, haya imagen o
                      no: si faltara, esa tarjeta empezaría por la fecha y se
                      subiría respecto a las de su fila. */}
                  <span className="relative block aspect-[3/2] w-full bg-marco">
                    {e.imagen && (
                      <Image
                        src={e.imagen.archivo}
                        alt=""
                        fill
                        quality={70}
                        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 45vw, 30vw"
                        // La primera tarjeta es lo más grande de la mitad de
                        // arriba: sin prioridad, la página abre con un hueco.
                        priority={i === 0}
                        className="object-cover opacity-80 contrast-[1.04] transition-opacity group-hover:opacity-100"
                      />
                    )}
                  </span>
                  <span className="font-mono text-[.7rem] tracking-[.12em] text-dato uppercase transition-colors group-hover:text-rojo">
                    {fechaFicha(e.publicadoEn)}
                    {e.kicker ? ` · ${e.kicker}` : ""}
                  </span>
                  <h2 className="font-serif text-[1.45rem] leading-tight font-normal transition-colors group-hover:text-white">
                    {e.titulo}
                  </h2>
                  {/* Todas las tarjetas al mismo largo: el resumen sale del
                    texto y se corta por la misma medida, así que ninguna
                    descuadra a la de al lado. */}
                  {resumen && (
                    <p className="max-w-[46ch] text-[.9375rem] leading-relaxed text-dato">
                      {resumen}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Pie />
    </>
  );
}
