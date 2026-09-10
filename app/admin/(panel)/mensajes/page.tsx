import Link from "next/link";

import { borrarMensaje, marcarMensaje } from "@/app/admin/acciones";
import { IconoCerrar, IconoVisto } from "@/components/Iconos";
import { DatosDeContacto } from "@/components/panel/DatosDeContacto";
import { EditorDeContacto } from "@/components/panel/EditorDeContacto";
import { datosDeContacto } from "@/lib/datosDeContacto";
import { fechaFicha } from "@/lib/fotos";
import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { contactoGuardado } from "@/lib/paginaContactoDelSitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mensajes" };

const FILTROS = [
  { clave: "nuevos", texto: "Sin leer" },
  { clave: "todos", texto: "Todos" },
] as const;

/**
 * La bandeja de /contacto. Aquí no se contesta: se lee y se responde desde el
 * correo de siempre, con el enlace que ya lleva la dirección puesta.
 */
export default async function MensajesDelPanel(props: PageProps<"/admin/mensajes">) {
  const sp = await props.searchParams;
  const filtro = sp.f === "todos" ? "todos" : "nuevos";

  const [mensajes, sinLeer, total, datos, pagina, identidad] = await Promise.all([
    prisma.mensaje.findMany({
      where: filtro === "nuevos" ? { leido: false } : {},
      orderBy: { creadoEn: "desc" },
      take: 200,
    }),
    prisma.mensaje.count({ where: { leido: false } }),
    prisma.mensaje.count(),
    datosDeContacto(),
    contactoGuardado(),
    identidadDelSitio(),
  ]);

  const abierta = pagina.visible !== false;

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">Mensajes</span> · {total} en total ·{" "}
          <span className={sinLeer > 0 ? "text-rojo" : undefined}>{sinLeer} sin leer</span>
          {!abierta && <span className="text-rojo"> · página apagada</span>}
        </p>

        <div className="ml-auto flex">
          {FILTROS.map((f) => (
            <Link
              key={f.clave}
              href={`/admin/mensajes?f=${f.clave}`}
              className="seg"
              data-on={filtro === f.clave ? "si" : undefined}
            >
              {f.texto}
            </Link>
          ))}
        </div>

        {abierta && (
          <Link
            href="/contacto"
            target="_blank"
            className="font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
          >
            Ver la página ↗
          </Link>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <EditorDeContacto datos={pagina} />
        <DatosDeContacto datos={datos} />

        {mensajes.length === 0 ? (
          <p className="font-mono text-[.75rem] leading-relaxed text-dato">
            {filtro === "nuevos"
              ? "Nada sin leer."
              : "Todavía no ha escrito nadie por el formulario."}
          </p>
        ) : (
          mensajes.map((m) => (
            <article
              key={m.id}
              className="grid gap-3 border border-filo p-4 sm:p-5"
              style={{ borderLeftColor: m.leido ? undefined : "var(--color-rojo)" }}
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="font-serif text-[1.2rem] leading-none">{m.nombre}</h2>
                <a
                  href={`mailto:${m.correo}?subject=${encodeURIComponent(
                    `Re: tu mensaje · ${identidad.nombre}`,
                  )}`}
                  className="font-mono text-[.72rem] tracking-[.04em] text-dato hover:text-rojo"
                >
                  {m.correo} ↗
                </a>
                <span className="ml-auto font-mono text-[.66rem] tracking-[.08em] text-apagado">
                  {fechaFicha(m.creadoEn)}
                </span>
              </div>

              <p className="max-w-[74ch] text-[.9375rem] leading-relaxed whitespace-pre-wrap text-papel-2">
                {m.cuerpo}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <form action={marcarMensaje.bind(null, m.id, !m.leido)}>
                  <button type="submit" className="btn flex items-center gap-2">
                    <IconoVisto tam={13} />
                    {m.leido ? "Marcar sin leer" : "Marcar leído"}
                  </button>
                </form>
                <form action={borrarMensaje.bind(null, m.id)}>
                  <button
                    type="submit"
                    className="btn flex items-center gap-2 text-dato hover:text-rojo"
                  >
                    <IconoCerrar tam={13} />
                    Borrar
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}
