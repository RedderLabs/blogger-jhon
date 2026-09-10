import Image from "next/image";

import { medidasDeVisualizacion } from "@/lib/fotos";

type Foto = {
  archivo: string;
  alt: string;
  ancho: number;
  alto: number;
  anchoMax: number;
};

/**
 * La copia montada sobre gris fotográfico 18 %, como una ampliación sobre la
 * mesa: ocupa todo el hueco disponible dejando un margen de montaje alrededor.
 *
 * Hay dos medidas distintas y conviene no confundirlas:
 *
 *   · `anchoMax` (1200 px por defecto) manda en CUÁNTOS PÍXELES se piden al
 *     servidor. Es lo que se elige al subir el lote.
 *   · El hueco manda en QUÉ TAMAÑO se pinta. En escritorio la copia se estira
 *     hasta llenarlo, aunque eso suponga ampliar un poco los 1200 px: en una
 *     fotografía de grano, ampliar un 15 % no se nota y sí se nota tenerla
 *     pequeña en mitad de una pantalla grande.
 *
 * La sombra va con `drop-shadow`, que sigue el borde real de la fotografía y
 * no la caja: con `object-contain` una sombra de caja quedaría flotando en el
 * aire a los lados.
 */
export function Copia({
  foto,
  prioridad,
  className,
}: {
  foto: Foto;
  prioridad?: boolean;
  className?: string;
}) {
  const { ancho } = medidasDeVisualizacion(foto);

  return (
    <div
      // En móvil y tableta el montaje toma la proporción de la propia foto,
      // para no dejar franjas de gris muerto arriba y abajo. En escritorio
      // manda el hueco, que es lo que la llena de verdad. El tope de alto lo
      // pone quien la usa, que es el que sabe cuánto sitio hay.
      className={`flex bg-montaje aspect-[var(--rel)] lg:aspect-auto ${className ?? ""}`}
      style={{ "--rel": `${foto.ancho} / ${foto.alto}` } as React.CSSProperties}
    >
      <div className="relative m-3 flex-1 sm:m-6 lg:m-10">
        <Image
          src={foto.archivo}
          alt={foto.alt || ""}
          fill
          sizes={`(max-width: 767px) 100vw, (max-width: 1023px) 92vw, min(${ancho}px, calc(100vw - 30rem))`}
          quality={82}
          priority={prioridad}
          className="object-contain"
          style={{
            filter:
              "contrast(1.04) drop-shadow(0 2px 4px rgba(0,0,0,.35)) drop-shadow(0 22px 48px rgba(0,0,0,.45))",
          }}
        />
      </div>
    </div>
  );
}
