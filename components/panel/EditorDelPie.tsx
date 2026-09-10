"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarNotaDelPie } from "@/app/admin/acciones";
import { NOTA_POR_DEFECTO, TOPE_NOTA_PIE } from "@/lib/pie";
import { SOLO_EN_LINEA } from "@/components/panel/BarraDeFormato";
import { CajaConFormato } from "@/components/panel/CajaConFormato";
import { Formateado } from "@/components/sitio/TextoConFormato";

const PAGINAS = [
  "Portada",
  "Series",
  "Entradas",
  "Archivo",
  "Sobre mí",
  "Contacto",
  "Aviso",
  "Buscar",
];

/**
 * La frase que acompaña al nombre en el pie de todas las páginas. Es una sola
 * para todo el sitio: aquí se escribe una vez y sale en las nueve.
 */
export function EditorDelPie({ nota, nombre }: { nota: string; nombre: string }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [texto, setTexto] = useState(nota);

  const limpio = texto.trim();
  const sobra = limpio.length - TOPE_NOTA_PIE;
  const enPie = limpio || NOTA_POR_DEFECTO;

  function enviar(datos: FormData) {
    empezar(async () => {
      const r = await guardarNotaDelPie(datos);
      if (r?.error) {
        setError(true);
        setMensaje(r.error);
      } else {
        setError(false);
        setMensaje(
          r?.porDefecto
            ? "Guardado. Al quedarse en blanco vuelve a salir la frase de fábrica."
            : "Guardado. Ya sale en el pie de todas las páginas.",
        );
      }
      router.refresh();
    });
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">Pie del sitio</span>
        </p>
        {/* Cualquier página larga sirve para ver el pie; era /series, que ya
            no existe. El archivo lo lleva igual y no se puede apagar. */}
        <Link
          href="/archivo"
          target="_blank"
          className="ml-auto font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
        >
          Ver una página ↗
        </Link>
      </header>

      {mensaje && (
        <p
          role="status"
          className={`border-b border-filo px-4 py-2 font-mono text-[.7rem] tracking-[.04em] sm:px-6 ${
            error ? "bg-[rgb(217_80_58/.12)] text-rojo" : "bg-[rgb(217_80_58/.08)]"
          }`}
        >
          {mensaje}
        </p>
      )}

      <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-10">
        <form action={enviar} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="lbl">El texto</p>
            <h1 className="font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]">
              La frase del pie
            </h1>
            <p className="max-w-[60ch] text-[.9375rem] leading-relaxed text-dato">
              Va bajo el nombre, a la izquierda del pie, en todas las páginas del
              sitio a la vez. Antes estaba escrita dentro de cada página y había
              que tocar el código para corregir una coma.
            </p>
          </div>

          <label className="grid gap-2">
            <span className="lbl text-[.5625rem]">Nota del pie</span>
            <CajaConFormato
              name="nota"
              rows={4}
              valor={texto}
              alCambiar={setTexto}
              grupos={SOLO_EN_LINEA}
              placeholder={NOTA_POR_DEFECTO}
              className="leading-relaxed"
            />
            <span
              className={`font-mono text-[.625rem] tracking-[.04em] ${
                sobra > 0 ? "text-rojo" : "text-dato"
              }`}
            >
              {limpio.length} de {TOPE_NOTA_PIE} caracteres
              {sobra > 0 && ` · sobran ${sobra}`}
            </span>
            <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
              Déjalo en blanco y vuelve la de fábrica: «{NOTA_POR_DEFECTO}»
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-p" disabled={enCurso || sobra > 0}>
              {enCurso ? "Guardando…" : "Guardar el pie"}
            </button>
          </div>

          <div className="grid gap-2 border-t border-filo pt-5">
            <p className="lbl text-[.5625rem]">Dónde se ve</p>
            <p className="font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-dato">
              {PAGINAS.join(" · ")}. En móvil y tableta el pie no sale: allí la
              navegación va en la barra de abajo.
            </p>
          </div>
        </form>

        {/* Vista previa: el mismo pie que se sirve, sin los enlaces recortados */}
        <div className="flex flex-col gap-3">
          <p className="lbl">Como se verá</p>
          <div className="flex flex-col items-start justify-between gap-8 border border-filo bg-cuarto px-5 py-8 lg:flex-row">
            <div className="grid max-w-[46ch] gap-3">
              <p className="lbl lbl-sitio">{nombre} · fotografía</p>
              <p className="text-[.9375rem] leading-relaxed text-dato">
                <Formateado texto={enPie} />
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {["Series", "Entradas", "Archivo por fechas", "Aviso importante", "Contacto"].map(
                (e) => (
                  <span
                    key={e}
                    className="font-mono text-[.72rem] tracking-[.12em] text-dato uppercase"
                  >
                    {e}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
