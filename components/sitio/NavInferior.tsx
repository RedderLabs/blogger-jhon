"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  IconoArchivo,
  IconoBuscar,
  IconoCorreo,
  IconoEntradas,
  IconoInicio,
  IconoRetrato,
} from "@/components/Iconos";
import { type Visibles, VISIBLES_POR_DEFECTO } from "@/lib/paginas";

type Destino = {
  href: string;
  texto: string;
  Icono: (p: { tam?: number; className?: string }) => React.ReactElement;
  exacto?: boolean;
  /** Cabe siempre, incluso en un teléfono de 390 px. */
  fijo?: boolean;
  /** Si la lleva, la página se puede apagar desde el panel. */
  clave?: keyof Visibles;
};

const DESTINOS: Destino[] = [
  { href: "/", texto: "Inicio", Icono: IconoInicio, exacto: true, fijo: true },
  { href: "/entradas", texto: "Entradas", Icono: IconoEntradas, fijo: true, clave: "entradas" },
  { href: "/archivo", texto: "Archivo", Icono: IconoArchivo, fijo: true },
  { href: "/sobre-mi", texto: "Sobre mí", Icono: IconoRetrato },
  { href: "/contacto", texto: "Contacto", Icono: IconoCorreo, clave: "contacto" },
  { href: "/buscar", texto: "Buscar", Icono: IconoBuscar },
];

/**
 * La navegación al alcance del pulgar. Cuántos destinos enseña depende de lo
 * que quepa, no de una lista fija:
 *
 *   · Teléfono (390 px): sólo los cuatro que llevan a la obra. Cuatro huecos
 *     de 97 px, muy por encima del objetivo táctil mínimo de 44. Sobre mí,
 *     Contacto y Buscar suben a la cabecera, junto al interruptor de tema.
 *   · Tableta: los siete, que ya caben con holgura.
 *   · Escritorio: desaparece. Allí manda la cabecera.
 */
export function NavInferior({
  visibles = VISIBLES_POR_DEFECTO,
}: {
  visibles?: Visibles;
}) {
  const ruta = usePathname();

  const destinos = DESTINOS.filter((d) => !d.clave || visibles[d.clave]);

  const activo = (href: string, exacto?: boolean) =>
    exacto ? ruta === href : ruta.startsWith(href);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-filo bg-cuarto-2/95 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Los huecos se reparten entre los que haya y no entre los que podría
          haber: con una página apagada, la columna vacía se vería. En un
          teléfono sólo entran los fijos, que son los que llevan a la obra. */}
      <ul
        className="m-0 grid list-none grid-cols-[repeat(var(--fijos),minmax(0,1fr))] p-0 sm:grid-cols-[repeat(var(--todos),minmax(0,1fr))]"
        style={
          {
            "--fijos": destinos.filter((d) => d.fijo).length,
            "--todos": destinos.length,
          } as React.CSSProperties
        }
      >
        {destinos.map((d) => {
          const on = activo(d.href, d.exacto);
          return (
            <li key={d.href} className={d.fijo ? undefined : "hidden sm:block"}>
              <Link
                href={d.href}
                aria-current={on ? "page" : undefined}
                className="flex h-14 flex-col items-center justify-center gap-1 border-t-2 transition-colors"
                style={{
                  borderTopColor: on ? "var(--color-rojo)" : "transparent",
                  color: on ? "var(--color-papel)" : "var(--color-dato)",
                }}
              >
                <d.Icono tam={19} />
                <span className="font-mono text-[.5625rem] tracking-[.12em] uppercase">
                  {d.texto}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
