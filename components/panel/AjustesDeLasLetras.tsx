"use client";

import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";

import { guardarLetras } from "@/app/admin/acciones";
import { PAREJA_POR_DEFECTO, PAREJAS, variablesDe } from "@/lib/letras";

/**
 * Qué hace cada una de las tres letras de una pareja, y de qué clase es. Una
 * pareja se elige por cómo se ve, pero se reconoce por el nombre: sin esto,
 * las ocho tarjetas son ocho muestras sin nombre.
 */
const RENGLONES = [
  { papel: "Titulares", clave: "titular", clase: "serif" },
  { papel: "Texto", clave: "texto", clase: "sans" },
  { papel: "Datos", clave: "datos", clase: "monoespaciada" },
] as const;

/**
 * Con qué letra se lee el sitio.
 *
 * No hay una caja donde escribir el nombre de una fuente: se elige entre
 * cuatro parejas cerradas, y las tres familias de cada una las sirve el propio
 * sitio. Es la misma promesa que hace el aviso de entrada —ni una petición a
 * un servidor de otro— y por eso la elección es entre parejas y no libre.
 *
 * La muestra de cada tarjeta se pinta con las letras de verdad: lo que se ve
 * aquí es exactamente lo que va a salir en la portada, porque el navegador
 * descarga los ficheros de las cuatro sólo para enseñarlas en esta página.
 */
export function AjustesDeLasLetras({ elegida }: { elegida: string }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [clave, setClave] = useState(elegida);

  const cambiada = clave !== elegida;
  const puesta = PAREJAS.find((p) => p.clave === elegida) ?? PAREJA_POR_DEFECTO;

  function guardar() {
    empezar(async () => {
      const r = await guardarLetras(clave);
      setError(Boolean(r?.error));
      setMensaje(r?.error ?? "Guardado. El sitio entero cambia de letra.");
      router.refresh();
    });
  }

  return (
    <section className="grid gap-5 border border-filo p-4 sm:p-5">
      <div className="grid gap-2">
        <p className="lbl">Las letras</p>
        <h2 className="font-serif text-[1.4rem] leading-tight font-bold">
          Con qué letra se lee el sitio
        </h2>
        <p className="m-0 max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
          Ocho parejas cerradas, las tres familias de cada una servidas desde
          aquí: ni una petición a un servidor ajeno. Lo que enseña cada tarjeta
          son las letras de verdad, no una descripción.
        </p>
        <p className="m-0 font-mono text-[.7rem] leading-relaxed tracking-[.04em] text-apagado">
          Actual: <span className="text-papel">{puesta.nombre}</span> ·{" "}
          {puesta.familias.titular} (serif) · {puesta.familias.texto} (sans) ·{" "}
          {puesta.familias.datos} (mono)
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {PAREJAS.map((p) => {
          const puesta = p.clave === clave;
          return (
            <button
              key={p.clave}
              type="button"
              onClick={() => setClave(p.clave)}
              aria-pressed={puesta}
              className={`grid gap-3 border p-4 text-left ${
                puesta
                  ? "border-rojo bg-[rgb(217_80_58/.08)]"
                  : "border-filo hover:border-filo-2"
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="lbl text-[.5625rem] text-papel">{p.nombre}</span>
                {p.clave === elegida && (
                  <span className="font-mono text-[.6rem] tracking-[.12em] text-rojo uppercase">
                    Actual
                  </span>
                )}
              </div>

              {/* La muestra se cuelga de las variables de la pareja, así que
                  `font-serif`, `font-sans` y `font-mono` de dentro resuelven a
                  sus tres familias sin tocar nada más. */}
              <div style={variablesDe(p)} className="grid gap-[.45rem]">
                <p className="m-0 font-serif text-[1.5rem] leading-tight font-bold">
                  Los días contados
                </p>
                <p className="m-0 font-sans text-[.875rem] leading-relaxed text-dato">
                  Revelado en casa, con el grano que trae el negativo.
                </p>
                <p className="m-0 font-mono text-[.7rem] tracking-[.06em] text-apagado">
                  35 mm · f/8 · 1/125 · HP5+
                </p>
              </div>

              <dl className="m-0 grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-[.2rem] font-mono text-[.625rem] leading-relaxed tracking-[.04em]">
                {RENGLONES.map((r) => (
                  <React.Fragment key={r.clave}>
                    <dt className="text-apagado">{r.papel}</dt>
                    <dd className="m-0 truncate text-dato">{p.familias[r.clave]}</dd>
                    <dd className="m-0 text-apagado">{r.clase}</dd>
                  </React.Fragment>
                ))}
              </dl>
              <p className="m-0 max-w-[46ch] text-[.8125rem] leading-relaxed text-dato">
                {p.que}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn btn-p"
          onClick={guardar}
          disabled={enCurso || !cambiada}
        >
          {enCurso ? "Guardando…" : "Guardar las letras"}
        </button>
        {mensaje && (
          <span
            role="status"
            className={`font-mono text-[.66rem] tracking-[.04em] ${
              error ? "text-rojo" : "text-verde"
            }`}
          >
            {mensaje}
          </span>
        )}
      </div>
    </section>
  );
}
