"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarAnchoDeLasFotos } from "@/app/admin/acciones";
import { ANCHOS_DISPONIBLES } from "@/lib/fotos";

/**
 * A cuántos píxeles se sirve una fotografía.
 *
 * Es el ancho con el que entra cada escaneo nuevo. No toca el fichero
 * guardado —ese sigue siendo el mismo, hasta 2400 px de lado mayor— sino
 * cuántos píxeles pide el navegador; por eso se puede ofrecer la casilla que
 * lo aplica al archivo entero sin que sea una operación de las que dan miedo:
 * se deshace con otro clic.
 */
export function AjustesDeLasFotos({
  ancho,
  total,
}: {
  ancho: number;
  total: number;
}) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [elegido, setElegido] = useState(ancho);
  const [aTodas, setATodas] = useState(false);

  const nota = ANCHOS_DISPONIBLES.find((a) => a.valor === elegido)?.nota;
  const cambiado = elegido !== ancho;

  function guardar() {
    empezar(async () => {
      const r = await guardarAnchoDeLasFotos(elegido, aTodas);
      if (r?.error) {
        setError(true);
        setMensaje(r.error);
      } else {
        setError(false);
        setMensaje(
          r?.cuantas
            ? `Guardado, y puesto en las ${r.cuantas} fotografías del archivo.`
            : "Guardado. Es el ancho con el que entran los escaneos nuevos.",
        );
        // La casilla vuelve a su sitio: aplicar a todo el archivo se pide cada
        // vez, no se queda puesta esperando al siguiente guardado.
        setATodas(false);
      }
      router.refresh();
    });
  }

  return (
    <section className="grid gap-5 border border-filo p-4 sm:p-5">
      <div className="grid gap-2">
        <p className="lbl">Las fotografías</p>
        <h2 className="font-serif text-[1.4rem] leading-tight font-bold">
          A cuántos píxeles se sirven
        </h2>
        <p className="m-0 max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
          El ancho con el que entra cada escaneo nuevo. En móvil y tableta el
          navegador pide siempre la copia que le quepa: este tope sólo manda en
          escritorio, y después se puede corregir foto a foto en su ficha.
        </p>
      </div>

      <div className="grid gap-3">
        <p className="lbl text-[.5625rem]">Ancho en escritorio</p>
        <div className="flex flex-wrap gap-2">
          {ANCHOS_DISPONIBLES.map((a) => (
            <button
              key={a.valor}
              type="button"
              className="seg"
              data-on={a.valor === elegido ? "si" : undefined}
              aria-pressed={a.valor === elegido}
              onClick={() => setElegido(a.valor)}
            >
              {a.etiqueta}
            </button>
          ))}
        </div>
        <p className="m-0 max-w-[62ch] font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
          {nota}
        </p>
      </div>

      <div className="grid gap-2 border-t border-filo pt-4">
        <label className="flex items-start gap-[.6rem] text-[.875rem] leading-relaxed">
          <input
            type="checkbox"
            checked={aTodas}
            onChange={(e) => setATodas(e.target.checked)}
            className="mt-[.2rem] w-auto"
          />
          <span>
            Aplicarlo también a las {total}{" "}
            {total === 1 ? "fotografía" : "fotografías"} que ya están en el
            archivo.
          </span>
        </label>
        <p className="m-0 max-w-[62ch] font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
          No se toca ningún fichero: lo único que cambia es cuántos píxeles pide
          el navegador. Se vuelve atrás eligiendo otro ancho y marcando otra vez
          la casilla.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn btn-p"
          onClick={guardar}
          disabled={enCurso || (!cambiado && !aTodas)}
        >
          {enCurso ? "Guardando…" : "Guardar el ancho"}
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
