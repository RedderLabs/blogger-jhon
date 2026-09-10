import type { Metadata } from "next";
import Link from "next/link";

import { Fotograma } from "@/components/Fotograma";
import { Pie } from "@/components/sitio/Pie";
import { IconoBuscar, IconoCerrar, IconoVisto } from "@/components/Iconos";
import { OBRA_PUBLICADA, rutaDeFoto } from "@/lib/consultas";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buscar",
  description:
    "Busca por lo que se ve y por cómo está hecha: el título, la nota, la serie y toda la ficha técnica.",
  // Una búsqueda interna no es una página: cada combinación de filtros sería
  // una dirección distinta con el mismo material. Se usa, no se indexa.
  robots: { index: false, follow: true },
};

const FACETAS = [
  { clave: "serie", titulo: "Serie" },
  { clave: "pelicula", titulo: "Película" },
  { clave: "optica", titulo: "Óptica" },
  { clave: "ano", titulo: "Año" },
] as const;

type Clave = (typeof FACETAS)[number]["clave"];

function comoLista(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/** Añade o quita un valor de una faceta y devuelve la nueva dirección. */
function alternar(
  actuales: Record<Clave, string[]>,
  q: string,
  clave: Clave,
  valor: string,
) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  for (const f of FACETAS) {
    let lista = actuales[f.clave];
    if (f.clave === clave) {
      lista = lista.includes(valor)
        ? lista.filter((x) => x !== valor)
        : [...lista, valor];
    }
    for (const v of lista) params.append(f.clave, v);
  }
  const s = params.toString();
  return s ? `/buscar?${s}` : "/buscar";
}

export default async function Buscar(props: PageProps<"/buscar">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const elegidas: Record<Clave, string[]> = {
    serie: comoLista(sp.serie),
    pelicula: comoLista(sp.pelicula),
    optica: comoLista(sp.optica),
    ano: comoLista(sp.ano),
  };

  const todas = await prisma.foto.findMany({
    where: OBRA_PUBLICADA,
    orderBy: [{ fecha: "desc" }, { orden: "asc" }],
    include: {
      series: {
        orderBy: { principal: "desc" },
        include: { serie: { select: { nombre: true, slug: true, estado: true } } },
      },
    },
  });

  // Una foto puede estar en una serie pública y en otra oculta a la vez. Se
  // enseña, pero la serie oculta no puede asomar ni en la ficha ni en los
  // filtros: para eso está oculta.
  //
  // Sin serie ya no llega ninguna —`OBRA_PUBLICADA` las deja fuera—, así que
  // aquí sólo queda decidir qué hacer con las ocultas.
  const publicas = todas
    .filter((f) => f.series.some((s) => s.serie.estado !== "oculta"))
    .map((f) => ({ ...f, series: f.series.filter((s) => s.serie.estado !== "oculta") }));

  const anoDe = (f: (typeof publicas)[number]) =>
    f.fecha ? String(f.fecha.getUTCFullYear()) : "";

  // Las opciones se leen del propio archivo: nunca se ofrece un filtro vacío.
  const opciones: Record<Clave, { valor: string; nombre: string; cuenta: number }[]> = {
    serie: [],
    pelicula: [],
    optica: [],
    ano: [],
  };

  const acumular = (clave: Clave, valor: string, nombre: string) => {
    if (!valor) return;
    const ya = opciones[clave].find((o) => o.valor === valor);
    if (ya) ya.cuenta += 1;
    else opciones[clave].push({ valor, nombre, cuenta: 1 });
  };

  for (const f of publicas) {
    for (const s of f.series) acumular("serie", s.serie.slug, s.serie.nombre);
    if (f.pelicula) acumular("pelicula", f.pelicula, f.pelicula);
    if (f.optica) acumular("optica", f.optica, f.optica);
    acumular("ano", anoDe(f), anoDe(f));
  }
  opciones.ano.sort((a, b) => Number(b.valor) - Number(a.valor));

  const texto = q.toLowerCase();
  const resultados = publicas.filter((f) => {
    if (elegidas.serie.length && !f.series.some((s) => elegidas.serie.includes(s.serie.slug)))
      return false;
    if (elegidas.pelicula.length && !elegidas.pelicula.includes(f.pelicula ?? ""))
      return false;
    if (elegidas.optica.length && !elegidas.optica.includes(f.optica ?? "")) return false;
    if (elegidas.ano.length && !elegidas.ano.includes(anoDe(f))) return false;

    if (!texto) return true;
    const paja = [
      f.titulo,
      f.alt,
      f.nota,
      f.camara,
      f.optica,
      f.pelicula,
      f.revelado,
      f.lugar,
      ...f.series.map((s) => s.serie.nombre),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return paja.includes(texto);
  });

  const activos = FACETAS.flatMap((f) =>
    elegidas[f.clave].map((valor) => ({
      clave: f.clave,
      valor,
      nombre:
        opciones[f.clave].find((o) => o.valor === valor)?.nombre ?? valor,
    })),
  );

  return (
    <>
      <header className="grid gap-6 px-5 pt-10 pb-8 sm:px-8 sm:pt-14 lg:px-12">
        <form action="/buscar" className="flex items-center gap-4 border-b border-rojo pb-3">
          <IconoBuscar tam={22} className="shrink-0 text-rojo" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tri-X, Summicron, cementerio, 2019…"
            aria-label="Buscar en el archivo"
            className="border-0 bg-transparent p-0 font-serif text-[1.5rem] leading-tight tracking-[-.01em] focus:outline-none sm:text-[2rem] lg:text-[2.6rem]"
          />
        </form>
        <p className="max-w-[70ch] text-[.9375rem] text-dato">
          Busca por lo que se ve y por cómo está hecha: el título, la nota, el nombre de la
          serie y toda la ficha técnica. La razón por la que otro fotógrafo llega hasta aquí
          suele ser el nombre de una película o de un objetivo.
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-8 px-5 pb-12 sm:px-8 lg:grid lg:grid-cols-[268px_minmax(0,1fr)] lg:gap-12 lg:px-12">
        <aside className="flex flex-col gap-7 border-b border-filo pb-8 lg:border-r lg:border-b-0 lg:pr-8 lg:pb-0">
          {FACETAS.map((f) => {
            const lista = opciones[f.clave];
            if (lista.length === 0) return null;
            return (
              <div key={f.clave} className="flex flex-col gap-2">
                <p className="lbl m-0">{f.titulo}</p>
                <div className="flex flex-col">
                  {lista.map((o) => {
                    const on = elegidas[f.clave].includes(o.valor);
                    return (
                      <Link
                        key={o.valor}
                        href={alternar(elegidas, q, f.clave, o.valor)}
                        scroll={false}
                        className="group flex w-full items-center gap-[.65rem] py-[.34rem] text-left"
                      >
                        <span
                          className={`grid h-[13px] w-[13px] shrink-0 place-items-center border ${
                            on ? "border-rojo bg-rojo text-cuarto" : "border-filo-2"
                          }`}
                        >
                          {on && <IconoVisto tam={9} />}
                        </span>
                        <span
                          className={`min-w-0 flex-1 truncate text-[.875rem] ${on ? "text-papel" : "text-dato group-hover:text-papel"}`}
                        >
                          {o.nombre}
                        </span>
                        <span className="shrink-0 font-mono text-[.66rem] text-apagado">
                          {o.cuenta}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>

        <section className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center gap-4 border-b border-filo pb-4">
            <span className="font-serif text-[1.6rem] leading-none font-bold">
              {resultados.length}
            </span>
            <span className="font-mono text-[.72rem] tracking-[.08em] text-dato">
              {resultados.length === 1 ? "fotograma" : "fotogramas"}
            </span>

            {activos.length > 0 && (
              <span className="flex flex-wrap gap-2 lg:ml-4">
                {activos.map((a) => (
                  <Link
                    key={`${a.clave}-${a.valor}`}
                    href={alternar(elegidas, q, a.clave, a.valor)}
                    scroll={false}
                    className="flex items-center gap-2 border border-rojo bg-[rgb(217_80_58/.12)] px-[.6rem] py-[.28rem] font-mono text-[.66rem] tracking-[.1em] uppercase hover:bg-[rgb(217_80_58/.22)]"
                  >
                    {a.nombre}
                    <IconoCerrar tam={9} />
                  </Link>
                ))}
              </span>
            )}

            {(activos.length > 0 || q) && (
              <Link
                href="/buscar"
                className="ml-auto border-b border-filo font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
              >
                Quitar filtros
              </Link>
            )}
          </div>

          {resultados.length === 0 ? (
            <div className="grid justify-items-start gap-3 py-16">
              <p className="font-serif text-[1.6rem] font-normal sm:text-[1.9rem]">
                Nada con esa combinación.
              </p>
              <p className="max-w-[48ch] text-dato">
                Prueba a quitar un filtro. Los cruces raros —una película empujada con un
                objetivo que casi no uso— existen, pero son pocos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-[2px] gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
              {resultados.map((f, i) => {
                const ruta = rutaDeFoto(f);
                return (
                  <article key={f.id} className="min-w-0">
                    <Fotograma
                      src={f.archivo}
                      alt={f.alt}
                      href={ruta ?? undefined}
                      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 22vw"
                      prioridad={i < 4}
                    />
                    <div className="pt-[.6rem]">
                      <h3 className="font-serif text-[1rem] leading-tight font-normal">
                        {ruta ? <Link href={ruta}>{f.titulo}</Link> : f.titulo}
                      </h3>
                      <p className="mt-1 font-mono text-[.625rem] leading-[1.7] tracking-[.05em] text-dato">
                        {f.series[0]?.serie.nombre ?? "Sin serie"}
                        <br />
                        {[f.pelicula, f.optica, anoDe(f)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Pie />
    </>
  );
}
