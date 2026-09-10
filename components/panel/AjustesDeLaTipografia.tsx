"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarTipografia } from "@/app/admin/acciones";
import {
  type Escalon,
  escalonesDe,
  INTERLINEADOS,
  MEDIDAS,
  TAMANOS,
  type Tipografia,
} from "@/lib/tipografia";

/**
 * Cómo se lee el sitio: el tamaño del texto, el aire entre líneas y el ancho
 * de la columna.
 *
 * Los tres van juntos y con una sola muestra, porque no se eligen de uno en
 * uno: se mira el párrafo de abajo y se toca hasta que se lee a gusto. La
 * muestra cambia al momento —antes de guardar— con las mismas variables que
 * usa el sitio, así que lo que se ve aquí es exactamente lo que va a salir.
 */
export function AjustesDeLaTipografia({ guardada }: { guardada: Tipografia }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [t, setT] = useState<Tipografia>(guardada);
  const puesta = escalonesDe(t);
  const cambiada =
    t.tamano !== guardada.tamano ||
    t.interlineado !== guardada.interlineado ||
    t.medida !== guardada.medida;

  function guardar() {
    empezar(async () => {
      const r = (await guardarTipografia(t)) as { error?: string };
      setError(Boolean(r?.error));
      setMensaje(r?.error ?? "Guardado. Así se lee el sitio a partir de ahora.");
      router.refresh();
    });
  }

  const fila = (
    titulo: string,
    lista: Escalon[],
    elegido: string,
    poner: (clave: string) => void,
  ) => (
    <div className="grid gap-2">
      <p className="lbl text-[.5625rem]">{titulo}</p>
      <div className="flex flex-wrap gap-1">
        {lista.map((e) => (
          <button
            key={e.clave}
            type="button"
            className="seg"
            data-on={e.clave === elegido ? "si" : undefined}
            title={e.que}
            aria-pressed={e.clave === elegido}
            onClick={() => poner(e.clave)}
          >
            {e.nombre}
          </button>
        ))}
      </div>
      <p className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
        {lista.find((e) => e.clave === elegido)?.que}
      </p>
    </div>
  );

  return (
    <section className="border border-filo">
      <header className="flex flex-wrap items-center gap-3 border-b border-filo px-4 py-3 sm:px-5">
        <h2 className="font-serif text-[1.2rem] leading-none font-bold">
          Cómo se lee
        </h2>
        <p className="font-mono text-[.7rem] tracking-[.06em] text-dato">
          {puesta.tamano.nombre.toLowerCase()} · interlineado{" "}
          {puesta.interlineado.nombre.toLowerCase()} · columna{" "}
          {puesta.medida.nombre.toLowerCase()}
        </p>
      </header>

      {mensaje && (
        <p
          role="status"
          className={`border-b border-filo px-4 py-2 font-mono text-[.7rem] tracking-[.04em] sm:px-5 ${
            error ? "bg-[rgb(217_80_58/.12)] text-rojo" : "bg-[rgb(217_80_58/.08)]"
          }`}
        >
          {mensaje}
        </p>
      )}

      <div className="grid gap-5 p-4 sm:p-5">
        <p className="max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
          El tamaño del texto corrido de las páginas que se leen: las entradas,
          sobre mí, la de contacto, las legales y el aviso de entrada. Los
          rótulos, los datos técnicos y los pies de foto no se tocan, que
          tienen su medida y su sitio.
        </p>

        <div className="grid gap-5 lg:grid-cols-3">
          {fila("Tamaño del texto", TAMANOS, t.tamano, (v) =>
            setT((antes) => ({ ...antes, tamano: v })),
          )}
          {fila("Entre líneas", INTERLINEADOS, t.interlineado, (v) =>
            setT((antes) => ({ ...antes, interlineado: v })),
          )}
          {fila("Ancho de la columna", MEDIDAS, t.medida, (v) =>
            setT((antes) => ({ ...antes, medida: v })),
          )}
        </div>

        {/* La muestra: el mismo texto que se lee en una entrada, con las
            variables puestas a mano para verlo antes de guardar. */}
        <div className="grid gap-2">
          <p className="lbl text-[.5625rem]">Así se leerá</p>
          <div
            className="border border-filo bg-cuarto px-5 py-6"
            style={
              {
                "--texto": puesta.tamano.valor,
                "--interlinea": puesta.interlineado.valor,
                "--medida": puesta.medida.valor,
              } as React.CSSProperties
            }
          >
            <p className="max-w-[var(--medida)] text-[length:var(--texto)] leading-[var(--interlinea)] text-papel-2">
              En film me gusta desde siempre el Kodak Tri-X 400: con él aprendí.
              La película en blanco y negro es algo intenso para mí, revelo en
              casa y escaneo el negativo, y me gusta la suciedad del grano y
              esas transiciones químicas entre blancos, grises y negros que
              jamás se consiguen con el digital.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-p"
            disabled={enCurso || !cambiada}
            onClick={guardar}
          >
            {enCurso ? "Guardando…" : "Guardar cómo se lee"}
          </button>
          {cambiada && (
            <button
              type="button"
              className="btn text-dato hover:text-rojo"
              disabled={enCurso}
              onClick={() => setT(guardada)}
            >
              Dejarlo como estaba
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
