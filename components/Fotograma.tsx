import Image from "next/image";
import Link from "next/link";

import { dosDigitos } from "@/lib/fotos";

type Props = {
  src: string;
  alt: string;
  numero?: number;
  pie?: string;
  /** Ancho del hueco según el ancho de pantalla; sin esto el navegador pide siempre la más grande. */
  sizes: string;
  href?: string;
  prioridad?: boolean;
  /** El fotograma vertical de la hoja de contactos ocupa el doble de alto. */
  vertical?: boolean;
};

/**
 * Una celda de hoja de contactos: recorte a 3:2 (o 2:3), número de fotograma
 * al vuelo y las marcas de encuadre en rojo al pasar por encima.
 */
export function Fotograma({
  src,
  alt,
  numero,
  pie,
  sizes,
  href,
  prioridad,
  vertical,
}: Props) {
  const contenido = (
    <>
      {numero !== undefined && <span className="marco-no">{dosDigitos(numero)}</span>}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={70}
        priority={prioridad}
        className="object-cover"
      />
      {pie && <span className="marco-pie">{pie}</span>}
    </>
  );

  const clases = `marco ${vertical ? "aspect-[2/3]" : "aspect-[3/2]"}`;

  if (href) {
    return (
      <Link href={href} className={clases}>
        {contenido}
      </Link>
    );
  }
  return <div className={clases}>{contenido}</div>;
}
