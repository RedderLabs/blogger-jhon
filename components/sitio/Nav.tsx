"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconoBuscar, IconoCorreo, IconoRetrato } from "@/components/Iconos";
import { InterruptorDeTema } from "@/components/sitio/InterruptorDeTema";
import { type Visibles, VISIBLES_POR_DEFECTO } from "@/lib/paginas";

/** Lo que no cabe en la barra del pulgar y sube aquí, en móvil y tableta. */
const ATAJOS = [
  { href: "/sobre-mi", texto: "Sobre mí", Icono: IconoRetrato },
  { href: "/contacto", texto: "Contacto", Icono: IconoCorreo, clave: "contacto" as const },
  { href: "/buscar", texto: "Buscar", Icono: IconoBuscar },
];

/** `clave` = la pagina se puede apagar desde el panel; sin ella, existe siempre. */
const ENLACES = [
  { href: "/entradas", texto: "Entradas", clave: "entradas" as const },
  { href: "/archivo", texto: "Archivo" },
  { href: "/sobre-mi", texto: "Sobre mí" },
  { href: "/contacto", texto: "Contacto", clave: "contacto" as const },
  { href: "/buscar", texto: "Buscar" },
];

/**
 * En escritorio, la cabecera de siempre. En móvil y tableta queda reducida a
 * la marca y a los mandos: los destinos viven abajo, en `NavInferior`, al
 * alcance del pulgar.
 *
 * `visibles` dice qué páginas opcionales están encendidas en el panel. Las
 * apagadas no salen aquí: un enlace a una página que contesta 404 es peor
 * que no tenerlo.
 */
export function Nav({
  nombre,
  visibles = VISIBLES_POR_DEFECTO,
}: {
  nombre: string;
  visibles?: Visibles;
}) {
  const ruta = usePathname();
  const activo = (href: string) => (ruta.startsWith(href) ? "si" : undefined);

  const enlaces = ENLACES.filter((e) => !e.clave || visibles[e.clave]);
  const atajos = ATAJOS.filter((e) => !e.clave || visibles[e.clave]);

  return (
    <header className="sticky top-0 z-40 border-b border-filo bg-cuarto/95 backdrop-blur-sm">
      <nav className="nav-sitio flex h-[var(--alto-cabecera)] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="shrink-0">
          <span className="block font-serif text-[1.2rem] leading-none font-bold tracking-[.02em] sm:text-[1.35rem]">
            {nombre}
          </span>
          <span className="mt-[.3rem] block font-mono text-[.625rem] tracking-[.28em] text-dato uppercase">
            Fotografía
          </span>
        </Link>

        <ul className="hidden list-none gap-[1.35rem] p-0 lg:flex">
          {enlaces.map((e) => (
            <li key={e.href}>
              <Link href={e.href} data-on={activo(e.href)}>
                {e.texto}
              </Link>
            </li>
          ))}
        </ul>

        {/* A la derecha, los mandos. En un teléfono de 390 px la barra de
            abajo sólo puede con cuatro destinos, así que Sobre mí, Contacto y
            Buscar viven aquí como iconos; en escritorio sobran, porque ya
            están en la lista de arriba. El hueco del idioma va al lado del
            tema cuando llegue el i18n. */}
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="flex items-center gap-1 lg:hidden">
            {atajos.map(({ href, texto, Icono }) => (
              <Link
                key={href}
                href={href}
                aria-label={texto}
                title={texto}
                aria-current={activo(href) ? "page" : undefined}
                className="flex h-9 w-9 items-center justify-center border transition-colors"
                style={{
                  borderColor: activo(href) ? "var(--color-rojo)" : "var(--color-filo)",
                  color: activo(href) ? "var(--color-papel)" : "var(--color-dato)",
                }}
              >
                <Icono tam={15} />
              </Link>
            ))}
          </span>

          <InterruptorDeTema />
        </div>

      </nav>
    </header>
  );
}
