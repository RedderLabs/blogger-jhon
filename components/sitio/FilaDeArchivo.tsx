import Image from "next/image";
import Link from "next/link";

import { fechaCorta } from "@/lib/fotos";

/**
 * Una cosa publicada, sea un texto o un rollo: es lo que hace que el archivo
 * pueda mezclarlos en la misma lista sin preguntarse cuál es cuál.
 */
export type Acontecimiento = {
  id: string;
  fecha: Date;
  titulo: string;
  /** De dónde viene: la serie, o el tema del texto. En blanco si no hay. */
  destino: string;
  /** null = no lleva a ninguna parte: se pinta la fila, pero sin enlace. */
  href: string | null;
  /** «12 fotos» en un rollo. Los textos de las entradas no se cuentan. */
  cuantas: string;
  miniatura: string | null;
};

/**
 * La fila del archivo: día, miniatura de 96 px, título, de dónde viene y qué
 * es. Vive aquí y no dentro de /archivo porque la portada enseña la última
 * entrada con esta misma forma, y dos maquetas parecidas para la misma cosa
 * acaban separándose a la primera corrección.
 */
export function FilaDeArchivo({
  cosa,
  prioridad,
}: {
  cosa: Acontecimiento;
  prioridad?: boolean;
}) {
  const clase =
    "group grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b border-filo px-1 py-3 sm:grid-cols-[5.5rem_96px_minmax(0,1fr)] sm:gap-x-7 lg:grid-cols-[5.5rem_96px_minmax(0,1fr)_15rem_5rem]";

  const dentro = (
    <>
      <span className="font-mono text-[.7rem] tracking-[.06em] text-dato transition-colors group-hover:text-rojo">
        {fechaCorta(cosa.fecha)}
      </span>

      {cosa.miniatura ? (
        <span className="relative col-start-1 row-start-2 block h-[52px] w-[96px] bg-marco sm:col-start-2 sm:row-start-1">
          <Image
            src={cosa.miniatura}
            alt=""
            fill
            quality={70}
            sizes="96px"
            priority={prioridad}
            className="object-cover opacity-[.72] contrast-[1.04] transition-opacity group-hover:opacity-100"
          />
        </span>
      ) : (
        <span className="col-start-1 row-start-2 hidden h-[52px] w-[96px] border border-filo sm:col-start-2 sm:row-start-1 sm:block" />
      )}

      <span className="col-start-2 row-start-1 text-[1rem] leading-snug transition-colors group-hover:text-white sm:col-start-3 sm:row-start-1 sm:text-[1.0625rem]">
        {cosa.titulo}
      </span>

      <span className="col-start-2 row-start-2 font-mono text-[.68rem] tracking-[.06em] text-dato sm:col-start-3 sm:row-start-2 lg:col-start-4 lg:row-start-1">
        {cosa.destino}
      </span>

      <span className="hidden font-mono text-[.68rem] tracking-[.06em] text-dato lg:block lg:text-right">
        {cosa.cuantas}
      </span>
    </>
  );

  // Un rollo cuyas fotografías no están en ninguna serie no tiene página a la
  // que llevar. Antes se mandaba al índice de series, que ya no existe: entre
  // un enlace que acaba en un 404 y una fila que no es enlace, lo segundo.
  return cosa.href ? (
    <Link href={cosa.href} className={clase}>
      {dentro}
    </Link>
  ) : (
    <div className={clase}>{dentro}</div>
  );
}
