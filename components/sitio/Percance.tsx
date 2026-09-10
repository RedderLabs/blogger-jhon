import Image from "next/image";

import { medidasDeVisualizacion } from "@/lib/fotos";
import type { ImagenDePercance } from "@/lib/percances";

/**
 * La maqueta de una página que no ha salido bien: la dirección que no existe y
 * el fallo del servidor usan la misma.
 *
 * No pinta el pie: el fallo del servidor es un componente de cliente y el pie
 * lee de la base. Lo pone quien puede, que es la de 404.
 *
 * El número va arriba, en el hueco del rótulo, con la misma tipografía con la
 * que se numeran los fotogramas: un error tiene que decir cuál es —para poder
 * contarlo— sin ser lo primero que se lee.
 */
export function Percance({
  codigo,
  rotulo,
  titulo,
  imagen,
  children,
}: {
  codigo: string;
  rotulo: string;
  titulo: string;
  /** La fotografía que se haya elegido en el panel, si hay alguna. */
  imagen?: ImagenDePercance | null;
  children: React.ReactNode;
}) {
  const medidas = imagen ? medidasDeVisualizacion(imagen) : null;

  return (
    <>
      <header className="ancho-sitio grid gap-4 px-5 pt-12 pb-8 sm:px-8 sm:pt-16 lg:px-12">
        <p className="lbl lbl-sitio flex items-center gap-3">
          <span>{codigo}</span>
          <span className="h-px flex-1 bg-filo" />
          <span className="text-dato">{rotulo}</span>
        </p>
        <h1 className="max-w-[20ch] font-serif text-[2.4rem] leading-none font-bold tracking-[-.02em] sm:text-[3rem] lg:text-[3.4rem]">
          {titulo}
        </h1>
      </header>

      <main className="ancho-sitio flex-1 px-5 pb-12 sm:px-8 lg:px-12">
        <div className="border-t border-filo pt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-16">
          <div className="grid max-w-[62ch] content-start gap-5">{children}</div>

          {imagen && medidas && (
            <figure className="mt-9 m-0 lg:mt-0">
              <Image
                src={imagen.archivo}
                alt={imagen.alt}
                width={medidas.ancho}
                height={medidas.alto}
                sizes="(min-width: 1024px) 22rem, (min-width: 640px) 60vw, 100vw"
                quality={70}
                className="h-auto w-full bg-marco"
              />
            </figure>
          )}
        </div>
      </main>
    </>
  );
}

/** Los enlaces de salida, con la letra del pie: es de donde vienen. */
export function Salidas({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-filo pt-6">
      {children}
    </div>
  );
}
