"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { mostrarPagina } from "@/app/admin/acciones";
import { CATALOGO_DE_PAGINAS, type ClaveDePagina } from "@/lib/paginas";

/**
 * Encender o apagar una página del sitio, desde la sección que la gobierna.
 *
 * No todo el mundo escribe, y no todo el mundo quiere enseñar la lista entera
 * de su obra. Un enlace en el menú que sólo lleva a una página vacía dice de
 * quien firma algo que no es verdad, y apagarlo es tan legítimo como apagar
 * una sección de la portada.
 *
 * El interruptor llega al índice y no más allá: lo que cuelga de él —una serie
 * concreta, un texto concreto— sigue abierto y se llega desde el archivo, la
 * portada y el buscador. Se dice aquí mismo, porque «apagar» sin más se
 * entendería como «esconder la obra».
 *
 * Se guarda solo, sin botón: es un interruptor de dos posiciones y se ve al
 * momento lo que ha pasado.
 */
export function InterruptorDePagina({
  clave,
  visible,
}: {
  clave: ClaveDePagina;
  visible: boolean;
}) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [fallo, setFallo] = useState<string | null>(null);

  const ficha = CATALOGO_DE_PAGINAS.find((p) => p.clave === clave);
  if (!ficha) return null;

  const poner = (quiero: boolean) => {
    if (quiero === visible) return;
    empezar(async () => {
      const r = await mostrarPagina(clave, quiero);
      setFallo(r?.error ?? null);
      router.refresh();
    });
  };

  return (
    <div
      className="flex flex-col gap-2 border-b px-4 py-3 sm:px-6"
      style={
        visible
          ? { borderColor: "var(--color-filo)" }
          : {
              borderColor: "var(--color-rojo)",
              background: "rgb(217 80 58 / .08)",
            }
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="m-0 font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">{ficha.nombre}</span>{" "}
          <span className="text-apagado">{ficha.ruta}</span>
        </p>

        <span className="ml-auto flex">
          <button
            type="button"
            className="seg"
            data-on={visible ? "si" : undefined}
            aria-pressed={visible}
            disabled={enCurso}
            onClick={() => poner(true)}
          >
            Se ve
          </button>
          <button
            type="button"
            className="seg"
            data-on={!visible ? "si" : undefined}
            aria-pressed={!visible}
            disabled={enCurso}
            onClick={() => poner(false)}
          >
            Apagada
          </button>
        </span>
      </div>

      <p
        role="status"
        className={`m-0 max-w-[80ch] font-mono text-[.66rem] leading-relaxed tracking-[.02em] ${
          fallo ? "text-rojo" : "text-apagado"
        }`}
      >
        {fallo ??
          (visible
            ? ficha.que
            : `Apagada: ${ficha.ruta} contesta «no encontrada» y se cae del menú, del pie y del mapa del sitio. ${ficha.alApagarla}`)}
      </p>
    </div>
  );
}
