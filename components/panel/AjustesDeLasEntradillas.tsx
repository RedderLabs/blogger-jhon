"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarEntradillas } from "@/app/admin/acciones";
import {
  CATALOGO_DE_ENTRADILLAS,
  type ClaveDeEntradilla,
  type Entradillas,
  ENTRADILLAS_POR_DEFECTO,
  TOPE,
} from "@/lib/entradillas";

/**
 * El párrafo que presenta /entradas y el que presenta /archivo.
 *
 * Estaban escritos dentro de cada página: corregir una coma pedía tocar código
 * y volver a desplegar. Y son el texto que más se retoca, porque es lo primero
 * que se lee al entrar y lo que envejece antes —el de /archivo promete que las
 * direcciones viejas siguen funcionando—.
 *
 * Los campos van controlados, como el resto de los del panel: React vacía el
 * formulario al guardar si no lo están.
 */
export function AjustesDeLasEntradillas({ entradillas }: { entradillas: Entradillas }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [campos, setCampos] = useState<Entradillas>(entradillas);

  const escribir = (clave: ClaveDeEntradilla, valor: string) =>
    setCampos((antes) => ({ ...antes, [clave]: valor }));

  const sobra = CATALOGO_DE_ENTRADILLAS.some(
    (e) => campos[e.clave].trim().length > TOPE,
  );

  function guardar() {
    empezar(async () => {
      const forma = new FormData();
      for (const e of CATALOGO_DE_ENTRADILLAS) forma.set(e.clave, campos[e.clave]);

      const r = await guardarEntradillas(forma);
      setError(Boolean(r?.error));
      setMensaje(r?.error ?? "Guardado. Ya sale en las dos páginas.");
      router.refresh();
    });
  }

  return (
    <section className="grid gap-5 border border-filo p-4 sm:p-5">
      <div className="grid gap-2">
        <p className="lbl">Las páginas</p>
        <h2 className="font-serif text-[1.4rem] leading-tight font-bold">
          Lo que se lee al entrar en Entradas y en Archivo
        </h2>
        <p className="m-0 max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
          El párrafo que va debajo del título de cada una: lo primero que lee
          quien llega. Lo que dejes en blanco vuelve a lo de fábrica.
        </p>
      </div>

      <div className="grid gap-4">
        {CATALOGO_DE_ENTRADILLAS.map((e) => {
          const largo = campos[e.clave].trim().length;
          const pasa = largo - TOPE;
          return (
            <label key={e.clave} className="grid gap-1">
              <span className="lbl text-[.5625rem]">
                {e.nombre} · {e.ruta}
              </span>
              <textarea
                rows={3}
                value={campos[e.clave]}
                onChange={(ev) => escribir(e.clave, ev.target.value)}
                placeholder={ENTRADILLAS_POR_DEFECTO[e.clave]}
                className="leading-relaxed"
              />
              <span
                className={`font-mono text-[.625rem] leading-relaxed tracking-[.04em] ${
                  pasa > 0 ? "text-rojo" : "text-apagado"
                }`}
              >
                {largo} de {TOPE} · {e.ayuda}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn btn-p"
          onClick={guardar}
          disabled={enCurso || sobra}
        >
          {enCurso ? "Guardando…" : "Guardar los textos"}
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
