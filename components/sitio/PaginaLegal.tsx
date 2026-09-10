import { notFound } from "next/navigation";

import { Pie } from "@/components/sitio/Pie";
import { TextoConEnlaces } from "@/components/sitio/TextoConEnlaces";
import { FAMILIAS, CUANTOS_RASTREADORES } from "@/lib/ia";
import { type ClaveLegal, enCatalogo } from "@/lib/legales";
import { legalDelSitio } from "@/lib/legalesDelSitio";

const CUANDO = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Las tres páginas de letra pequeña se pintan aquí: cookies, privacidad y
 * términos tienen la misma forma —título, entradilla y secciones numeradas— y
 * lo único que cambia es el texto, que sale del panel. Tres maquetas iguales
 * en tres ficheros distintos se separan a la primera corrección.
 *
 * La medida es de lectura larga y va a una columna: esto no es una página que
 * se ojee, es una que se lee de arriba abajo cuando alguien quiere saber algo
 * concreto. La numeración de las secciones no es decoración: sirve para poder
 * decir «lo que dice el punto 4» en un correo.
 *
 * Apagada desde el panel, la página no existe hacia fuera: contesta 404 y
 * desaparece del pie y del mapa del sitio.
 */
export async function PaginaLegal({ clave }: { clave: ClaveLegal }) {
  const ficha = enCatalogo(clave);
  const pagina = await legalDelSitio(clave);

  if (!ficha || !pagina.visible) notFound();

  return (
    <>
      <header className="mx-auto grid w-full max-w-[72ch] gap-4 px-5 pt-9 pb-7 sm:px-8 sm:pt-14 lg:pt-16">
        <p className="lbl lbl-sitio flex items-center gap-3">
          <span>Letra pequeña</span>
          <span className="h-px flex-1 bg-filo" />
        </p>
        <h1 className="max-w-[20ch] font-serif text-[2.2rem] leading-none font-bold tracking-[-.02em] sm:text-[2.8rem] lg:text-[3.1rem]">
          {pagina.titulo}
        </h1>
        <TextoConEnlaces
          texto={pagina.entradilla}
          className="max-w-[var(--medida)] text-[length:var(--texto)] leading-[var(--interlinea)] text-papel-2"
        />
        {pagina.actualizada && (
          <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
            Última revisión: {CUANDO.format(pagina.actualizada)}
          </p>
        )}
      </header>

      <main className="mx-auto w-full max-w-[72ch] flex-1 px-5 pb-14 sm:px-8">
        {pagina.secciones.length === 0 ? (
          <p className="border-t border-filo pt-8 font-mono text-[.75rem] leading-relaxed text-dato">
            Esta página todavía no dice nada. Se escribe en el panel.
          </p>
        ) : (
          <ol className="m-0 grid list-none gap-10 border-t border-filo p-0 pt-10">
            {pagina.secciones.map((s, i) => (
              <li key={i} className="grid gap-3">
                <h2 className="flex items-baseline gap-3 font-serif text-[1.3rem] leading-tight font-bold sm:text-[1.5rem]">
                  <span
                    aria-hidden="true"
                    className="font-mono text-[.72rem] font-normal tracking-[.08em] text-rojo"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.titulo}
                </h2>
                <TextoConEnlaces
                  texto={s.texto}
                  className="text-[length:var(--texto)] leading-[var(--interlinea)] text-papel-2"
                />
              </li>
            ))}
          </ol>
        )}

        {ficha.conListaDeIA && <ListaDeRastreadores />}
      </main>

      <Pie />
    </>
  );
}

/**
 * Los rastreadores a los que se cierra el sitio, con su nombre.
 *
 * Se lee de `lib/ia.ts`, que es de donde sale también el robots.txt que se
 * sirve de verdad. No es una lista escrita a mano en un texto que hay que
 * acordarse de actualizar: es el mismo dato, y por eso la página puede
 * prometer que coincide.
 */
function ListaDeRastreadores() {
  return (
    <section className="mt-12 grid gap-5 border border-filo p-5 sm:p-6">
      <div className="grid gap-2">
        <h2 className="lbl lbl-sitio">Los {CUANTOS_RASTREADORES} que tienen la puerta cerrada</h2>
        <p className="m-0 max-w-[62ch] font-mono text-[.7rem] leading-relaxed tracking-[.02em] text-dato">
          Tal y como aparecen en el fichero robots.txt de este dominio, que se
          genera de esta misma lista.
        </p>
      </div>

      <dl className="m-0 grid gap-5">
        {FAMILIAS.map((f) => (
          <div key={f.quien} className="grid gap-2">
            <dt className="font-mono text-[.72rem] tracking-[.08em] text-papel">
              {f.quien}
            </dt>
            <dd className="m-0 flex flex-wrap gap-x-2 gap-y-1">
              {f.agentes.map((a) => (
                <code
                  key={a}
                  className="border border-filo px-[.4rem] py-[.15rem] font-mono text-[.68rem] tracking-[.02em] text-dato"
                >
                  {a}
                </code>
              ))}
            </dd>
            {f.nota && (
              <dd className="m-0 max-w-[62ch] font-mono text-[.66rem] leading-relaxed text-apagado">
                {f.nota}
              </dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
