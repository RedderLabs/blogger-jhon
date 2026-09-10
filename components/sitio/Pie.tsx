import Link from "next/link";

import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { paginaDeContacto } from "@/lib/paginaContactoDelSitio";
import { paginasDelSitio } from "@/lib/paginasDelSitio";
import { notaDelPie } from "@/lib/pieDelSitio";
import { TextoConFormato } from "@/components/sitio/TextoConFormato";

/** `clave` = la pagina se puede apagar desde el panel; sin ella, existe siempre. */
const ENLACES = [
  { href: "/entradas", texto: "Entradas", clave: "entradas" as const },
  { href: "/archivo", texto: "Archivo por fechas" },
  { href: "/aviso", texto: "Aviso importante" },
  { href: "/contacto", texto: "Contacto", clave: "contacto" as const },
];

/**
 * Sólo en escritorio. En móvil y tableta la navegación vive en la barra
 * inferior y un pie que repitiese los mismos enlaces sería peso muerto al
 * final de cada scroll.
 *
 * La nota no se pasa por propiedad a propósito: es una sola para todo el
 * sitio y se escribe en /admin/pie, de modo que cambiarla no obliga a repasar
 * página por página.
 */
export async function Pie() {
  const [nota, contacto, paginas, identidad] = await Promise.all([
    notaDelPie(),
    paginaDeContacto(),
    paginasDelSitio(),
    identidadDelSitio(),
  ]);
  const visibles = { ...paginas, contacto: contacto.visible };
  const enlaces = ENLACES.filter((e) => !e.clave || visibles[e.clave]);

  return (
    <footer className="mt-auto hidden flex-col items-start justify-between gap-8 border-t border-filo px-5 py-10 sm:px-8 lg:flex lg:flex-row lg:px-12">
      <div className="grid max-w-[46ch] gap-3">
        <p className="lbl lbl-sitio">{identidad.nombre} · fotografía</p>
        <div className="grid gap-3 text-[.9375rem] leading-relaxed text-dato">
          <TextoConFormato texto={nota} />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-3">
        {enlaces.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="font-mono text-[.72rem] tracking-[.12em] text-dato uppercase hover:text-rojo"
          >
            {e.texto}
          </Link>
        ))}
      </div>
    </footer>
  );
}
