"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarIdentidad } from "@/app/admin/acciones";
import {
  type Identidad,
  IDENTIDAD_POR_DEFECTO,
  nombreLargo,
  TOPES,
} from "@/lib/identidad";

type Campo = keyof Identidad;

const CAMPOS: { clave: Campo; etiqueta: string; filas: number; ayuda: string }[] = [
  {
    clave: "nombre",
    etiqueta: "Nombre del sitio",
    filas: 1,
    ayuda: "En la cabecera, en el pie, en el rail del panel y en la pestaña del navegador.",
  },
  {
    clave: "lema",
    etiqueta: "Lema",
    filas: 1,
    ayuda: "Acompaña al nombre en el título de la portada. Puede quedarse en blanco.",
  },
  {
    clave: "autor",
    etiqueta: "Quién firma",
    filas: 1,
    ayuda: "Va en los datos estructurados: es lo que hace que el nombre se entienda como una persona con obra.",
  },
  {
    clave: "descripcion",
    etiqueta: "Descripción",
    filas: 3,
    ayuda: "Las dos líneas que enseña un buscador cuando la página no trae otra mejor.",
  },
];

/**
 * Cómo se llama el sitio y qué dice de sí mismo.
 *
 * Estaba escrito dentro de `lib/sitio.tsx`, que es tanto como decir que
 * corregir la descripción —lo que de verdad se retoca, porque es lo que lee un
 * buscador— pedía tocar código y volver a desplegar.
 */
export function AjustesDelSitio({ identidad }: { identidad: Identidad }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [campos, setCampos] = useState<Identidad>(identidad);

  const escribir = (clave: Campo, valor: string) =>
    setCampos((antes) => ({ ...antes, [clave]: valor }));

  const sobra = CAMPOS.some((c) => campos[c.clave].trim().length > TOPES[c.clave]);

  function guardar() {
    empezar(async () => {
      const forma = new FormData();
      for (const c of CAMPOS) forma.set(c.clave, campos[c.clave]);

      const r = await guardarIdentidad(forma);
      setError(Boolean(r?.error));
      setMensaje(r?.error ?? "Guardado. Ya sale en todo el sitio.");
      router.refresh();
    });
  }

  return (
    <section className="grid gap-5 border border-filo p-4 sm:p-5">
      <div className="grid gap-2">
        <p className="lbl">El sitio</p>
        <h2 className="font-serif text-[1.4rem] leading-tight font-bold">
          Cómo se llama y qué dice de sí mismo
        </h2>
        <p className="m-0 max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
          Sale en la cabecera, en el pie, al compartir un enlace y en la ficha
          que enseña un buscador. Lo que dejes en blanco vuelve a lo de fábrica.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {CAMPOS.map((c) => {
          const largo = campos[c.clave].trim().length;
          const pasa = largo - TOPES[c.clave];
          return (
            <label
              key={c.clave}
              className={`grid gap-1 ${c.filas > 1 ? "lg:col-span-2" : ""}`}
            >
              <span className="lbl text-[.5625rem]">{c.etiqueta}</span>
              {c.filas === 1 ? (
                <input
                  value={campos[c.clave]}
                  onChange={(e) => escribir(c.clave, e.target.value)}
                  placeholder={IDENTIDAD_POR_DEFECTO[c.clave]}
                  autoComplete="off"
                />
              ) : (
                <textarea
                  rows={c.filas}
                  value={campos[c.clave]}
                  onChange={(e) => escribir(c.clave, e.target.value)}
                  placeholder={IDENTIDAD_POR_DEFECTO[c.clave]}
                  className="leading-relaxed"
                />
              )}
              <span
                className={`font-mono text-[.625rem] leading-relaxed tracking-[.04em] ${
                  pasa > 0 ? "text-rojo" : "text-apagado"
                }`}
              >
                {largo} de {TOPES[c.clave]} · {c.ayuda}
              </span>
            </label>
          );
        })}
      </div>

      <div className="grid gap-2 border-t border-filo pt-4">
        <p className="lbl text-[.5625rem]">Como se leerá</p>
        <p className="m-0 font-mono text-[.7rem] leading-relaxed tracking-[.04em] text-dato">
          Pestaña de la portada: <span className="text-papel">{nombreLargo(campos)}</span>
          <br />
          Pestaña de una serie:{" "}
          <span className="text-papel">Los días contados · {campos.nombre}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn btn-p"
          onClick={guardar}
          disabled={enCurso || sobra}
        >
          {enCurso ? "Guardando…" : "Guardar el sitio"}
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
