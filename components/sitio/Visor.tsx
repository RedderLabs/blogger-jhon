"use client";

import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { IconoCerrar, IconoDerecha, IconoIzquierda } from "@/components/Iconos";
import { medidasDeVisualizacion } from "@/lib/fotos";

export type FotoDelVisor = {
  id: string;
  archivo: string;
  alt: string;
  ancho: number;
  alto: number;
  /** El tope de píxeles que se piden al servidor: 1200 por defecto. */
  anchoMax: number;
  /** Lo que se lee debajo: la serie o el pie que traiga el bloque. */
  pie: string;
  /** Cámara · película · exposición, ya montado por quien lo sabe. */
  ficha: string;
};

const Mando = createContext<((indice: number) => void) | null>(null);

/**
 * La copia ampliada. Se cierra con Escape o pinchando fuera, y las flechas
 * recorren las fotos de la propia entrada, que es el mismo gesto que ya
 * funciona en la ficha de una serie.
 *
 * En escritorio se pinta a su medida —los 1200 px que fija `anchoMax`, o
 * menos si el escaneo no da para tanto—, no estirada hasta llenar la ventana:
 * es la misma copia que sirve el resto del sitio, ni ampliada ni encogida. Si
 * a esa medida no cabe de alto, se recorre; por debajo de esos píxeles manda
 * el ancho de la pantalla.
 */
export function Visor({
  fotos,
  children,
}: {
  fotos: FotoDelVisor[];
  children: React.ReactNode;
}) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const cerrar = useCallback(() => setAbierta(null), []);

  const mover = useCallback(
    (paso: -1 | 1) =>
      setAbierta((i) => (i === null ? null : (i + paso + fotos.length) % fotos.length)),
    [fotos.length],
  );

  useEffect(() => {
    if (abierta === null) return;

    function alPulsar(e: KeyboardEvent) {
      if (e.key === "Escape") cerrar();
      if (e.key === "ArrowLeft") mover(-1);
      if (e.key === "ArrowRight") mover(1);
    }

    // Mientras la copia está abierta, la página de debajo no se mueve.
    const guardado = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", alPulsar);

    return () => {
      document.body.style.overflow = guardado;
      window.removeEventListener("keydown", alPulsar);
    };
  }, [abierta, cerrar, mover]);

  const foto = abierta === null ? null : fotos[abierta];
  // Dos medidas distintas, como en la ficha de una serie:
  //   · `medidas` son los PÍXELES que se piden al servidor (nunca más de los
  //     que tiene el escaneo: ampliar un negativo sólo añade peso).
  //   · `pintado` es el TAMAÑO al que se dibuja: los 1200 px de `anchoMax`,
  //     iguales para todas, aunque en una copia de 1080 suponga estirarla un
  //     poco. En grano, ese 11 % no se nota; que cada foto salga de un tamaño
  //     distinto, sí.
  const medidas = foto ? medidasDeVisualizacion(foto) : null;
  const pintado = foto ? (foto.anchoMax > 0 ? foto.anchoMax : foto.ancho) : 0;

  return (
    <Mando.Provider value={setAbierta}>
      {children}

      {foto && medidas && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={foto.alt || foto.pie || "Copia ampliada"}
          onClick={cerrar}
          className="fixed inset-0 z-50 flex flex-col bg-[rgb(10_9_8/.96)] backdrop-blur-sm"
        >
          <div className="flex shrink-0 items-center gap-4 px-4 py-3 sm:px-6">
            <span className="texto-visor font-mono text-[.75rem] tracking-[.1em]">
              {abierta! + 1} <span className="dato-visor">/</span> {fotos.length}
            </span>
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar la copia"
              autoFocus
              className="mando-visor ml-auto h-11 w-11"
            >
              <IconoCerrar tam={20} />
            </button>
          </div>

          {/* El clic dentro de la copia no cierra: sólo el fondo. */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="scroll-fino relative flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-3 pb-3 sm:items-center sm:px-8 sm:pb-6"
          >
            {fotos.length > 1 && (
              <button
                type="button"
                onClick={() => mover(-1)}
                aria-label="Anterior"
                className="mando-visor absolute left-2 z-10 h-14 w-14 backdrop-blur-sm sm:left-5"
              >
                <IconoIzquierda tam={24} />
              </button>
            )}

            <Image
              key={foto.id}
              src={foto.archivo}
              alt={foto.alt}
              width={medidas.ancho}
              height={medidas.alto}
              quality={92}
              sizes={`(max-width: ${pintado}px) 100vw, ${pintado}px`}
              // 1200 px en escritorio; el ancho de la pantalla si no caben.
              style={{ width: `min(100%, ${pintado}px)` }}
              className="h-auto"
            />

            {fotos.length > 1 && (
              <button
                type="button"
                onClick={() => mover(1)}
                aria-label="Siguiente"
                className="mando-visor absolute right-2 z-10 h-14 w-14 backdrop-blur-sm sm:right-5"
              >
                <IconoDerecha tam={24} />
              </button>
            )}
          </div>

          <div className="dato-visor flex shrink-0 flex-wrap justify-between gap-x-6 gap-y-1 px-4 pb-4 font-mono text-[.68rem] tracking-[.05em] sm:px-6 sm:pb-6">
            <span>{foto.pie}</span>
            <span>{foto.ficha}</span>
          </div>
        </div>
      )}
    </Mando.Provider>
  );
}

/**
 * El disparador. Envuelve la fotografía tal y como se pinta en el texto y la
 * convierte en un botón, sin cambiarle nada de aspecto.
 */
export function Ampliar({
  indice,
  children,
}: {
  indice: number;
  children: React.ReactNode;
}) {
  const abrir = useContext(Mando);
  if (!abrir) return <>{children}</>;

  return (
    <button
      type="button"
      onClick={() => abrir(indice)}
      aria-label="Ver la copia grande"
      className="block w-full cursor-zoom-in"
    >
      {children}
    </button>
  );
}
