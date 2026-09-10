"use client";

import { useState } from "react";

import { IconoAbajo } from "@/components/Iconos";

/**
 * Un mes del archivo, que se pliega al pinchar en su nombre. No es un
 * `select` ni un `details`: es el patrón de acordeón de siempre —un botón que
 * dice si está abierto y la lista que obedece—, para que la cabecera conserve
 * la tipografía del mes y el recuento.
 *
 * Empieza abierto: el archivo es para leerlo, y plegar es cosa de quien busca
 * una fecha concreta y quiere quitarse el resto de en medio.
 */
export function MesPlegable({
  nombre,
  cuenta,
  children,
}: {
  nombre: string;
  cuenta: string;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(true);

  return (
    <section>
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
          className="group flex w-full items-baseline gap-4 border-b border-filo px-1 pt-7 pb-3 text-left"
        >
          <span className="font-serif text-[1.4rem] leading-none font-normal italic transition-colors group-hover:text-white sm:text-[1.65rem]">
            {nombre}
          </span>
          <span className="font-mono text-[.7rem] tracking-[.1em] text-dato">{cuenta}</span>
          <span
            aria-hidden="true"
            className="ml-auto self-center text-dato transition-transform duration-200 group-hover:text-papel"
            style={{ transform: abierto ? "rotate(0deg)" : "rotate(-90deg)" }}
          >
            <IconoAbajo tam={16} />
          </span>
        </button>
      </h2>

      {abierto && children}
    </section>
  );
}
