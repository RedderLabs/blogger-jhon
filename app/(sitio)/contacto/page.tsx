import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormularioDeContacto } from "@/components/sitio/FormularioDeContacto";
import { Pie } from "@/components/sitio/Pie";
import { TextoConEnlaces } from "@/components/sitio/TextoConEnlaces";
import { datosDeContacto } from "@/lib/datosDeContacto";
import { sinMarcas } from "@/lib/enlaces";
import { paginaDeContacto } from "@/lib/paginaContactoDelSitio";
import { enlaceDeCuenta, red, textoDeCuenta } from "@/lib/redes";
import { metadatos } from "@/lib/sitio";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const pagina = await paginaDeContacto();

  return await metadatos({
    titulo: pagina.titulo,
    descripcion: sinMarcas(pagina.entradilla),
    ruta: "/contacto",
  });
}

/**
 * El texto y el interruptor salen del panel (/admin/mensajes). Apagada, la
 * página no existe hacia fuera: contesta 404 y desaparece de la navegación,
 * del pie y del mapa del sitio. Los mensajes que ya hubiera siguen en su sitio.
 */
export default async function Contacto() {
  const [pagina, { correo, redes }] = await Promise.all([
    paginaDeContacto(),
    datosDeContacto(),
  ]);

  if (!pagina.visible) notFound();

  return (
    <>
      <header className="mx-auto grid w-full max-w-[78rem] gap-4 px-5 pt-9 pb-7 sm:px-8 sm:pt-14 lg:px-12 lg:pt-16">
        <p className="lbl lbl-sitio flex items-center gap-3">
          <span>La persona</span>
          <span className="h-px flex-1 bg-filo" />
        </p>
        <h1 className="max-w-[18ch] font-serif text-[2.4rem] leading-none font-bold tracking-[-.02em] sm:text-[3rem] lg:text-[3.4rem]">
          {pagina.titulo}
        </h1>
        <TextoConEnlaces
          texto={pagina.entradilla}
          className="max-w-[var(--medida)] text-[length:var(--texto)] leading-[var(--interlinea)] text-papel-2"
        />
      </header>

      <main className="mx-auto w-full max-w-[78rem] flex-1 px-5 pb-10 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-16 lg:px-12">
        <div className="max-w-[66ch] border-t border-filo pt-8">
          <FormularioDeContacto />
        </div>

        <aside className="mt-10 grid content-start gap-8 border-t border-filo pt-8 lg:mt-0">
          {(correo || redes.length > 0) && (
            <section className="grid gap-4">
              <h2 className="lbl lbl-sitio">Directamente</h2>
              <dl className="exif m-0 grid gap-3">
                {correo && (
                  <div>
                    <dt>Correo</dt>
                    <dd>
                      <a href={`mailto:${correo}`} className="hover:text-rojo">
                        {correo}
                      </a>
                    </dd>
                  </div>
                )}
                {redes.map((cuenta) => {
                  const enlace = enlaceDeCuenta(cuenta);
                  if (!enlace) return null;
                  return (
                    <div key={cuenta.red}>
                      <dt>{red(cuenta.red)?.nombre}</dt>
                      <dd>
                        <a
                          href={enlace}
                          target="_blank"
                          rel="me noreferrer"
                          className="hover:text-rojo"
                        >
                          {textoDeCuenta(cuenta)} ↗
                        </a>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          )}

          <section className="grid gap-3">
            <h2 className="lbl lbl-sitio">{pagina.antesTitulo}</h2>
            <TextoConEnlaces
              texto={pagina.antes}
              className="text-[length:var(--texto)] leading-[var(--interlinea)] text-dato"
            />
          </section>

          <section className="grid gap-3">
            <h2 className="lbl lbl-sitio">{pagina.datosTitulo}</h2>
            <TextoConEnlaces
              texto={pagina.datos}
              className="font-mono text-[.72rem] leading-relaxed tracking-[.04em] text-dato"
            />
          </section>
        </aside>
      </main>

      <Pie />
    </>
  );
}
