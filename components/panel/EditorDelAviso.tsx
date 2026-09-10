"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarAviso } from "@/app/admin/acciones";
import type { Aviso } from "@/lib/aviso";
import { CajaConFormato } from "@/components/panel/CajaConFormato";
import { TextoConFormato } from "@/components/sitio/TextoConFormato";

export function EditorDelAviso({ aviso }: { aviso: Aviso }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [titulo, setTitulo] = useState(aviso.titulo);
  const [texto, setTexto] = useState(aviso.parrafos.join("\n\n"));
  const [boton, setBoton] = useState(aviso.boton);
  const [volverAEnsenar, setVolverAEnsenar] = useState(false);

  const parrafos = texto
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

  function enviar(datos: FormData) {
    empezar(async () => {
      const r = await guardarAviso(datos);
      if (r?.error) setMensaje(r.error);
      else {
        setMensaje(
          volverAEnsenar
            ? "Guardado. Volverá a salirle a todo el mundo, incluso a quien ya lo había cerrado."
            : "Guardado. A quien ya lo cerró no le saldrá otra vez.",
        );
        setVolverAEnsenar(false);
      }
      router.refresh();
    });
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">Aviso de entrada</span>
        </p>
        <Link
          href="/aviso"
          target="_blank"
          className="ml-auto font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
        >
          Ver la página ↗
        </Link>
      </header>

      {mensaje && (
        <p
          role="status"
          className="border-b border-filo bg-[rgb(217_80_58/.08)] px-4 py-2 font-mono text-[.7rem] tracking-[.04em] sm:px-6"
        >
          {mensaje}
        </p>
      )}

      <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-10">
        <form action={enviar} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="lbl">El texto</p>
            <h1 className="font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]">
              Lo que lee quien entra por primera vez
            </h1>
            <p className="max-w-[60ch] text-[.9375rem] leading-relaxed text-dato">
              Sale una sola vez por visitante y se recuerda en su navegador. Aquí está
              como texto, no como imagen: se puede leer con un lector de pantalla, sale
              en las búsquedas y se corrige sin volver a exportar un JPEG.
            </p>
          </div>

          <label className="grid gap-2">
            <span className="lbl text-[.5625rem]">Título</span>
            <input
              name="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="lbl text-[.5625rem]">Texto</span>
            <CajaConFormato
              name="texto"
              rows={18}
              valor={texto}
              alCambiar={setTexto}
              required
              className="leading-relaxed"
            />
            <span className="font-mono text-[.625rem] tracking-[.04em] text-dato">
              Deja una línea en blanco entre párrafo y párrafo. Ahora mismo:{" "}
              {parrafos.length} {parrafos.length === 1 ? "párrafo" : "párrafos"}.
            </span>
          </label>

          <label className="grid max-w-[220px] gap-2">
            <span className="lbl text-[.5625rem]">Botón que lo cierra</span>
            <input
              name="boton"
              value={boton}
              onChange={(e) => setBoton(e.target.value)}
              required
            />
          </label>

          <label className="flex items-start gap-3 border border-filo p-4">
            <input
              type="checkbox"
              name="volverAEnsenar"
              checked={volverAEnsenar}
              onChange={(e) => setVolverAEnsenar(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-rojo)]"
            />
            <span className="grid gap-1">
              <span className="text-[.9375rem]">
                Volver a enseñárselo a quien ya lo cerró
              </span>
              <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-dato">
                Márcalo sólo si has cambiado el fondo del mensaje. Para una errata,
                déjalo sin marcar y nadie volverá a verlo.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-p" disabled={enCurso}>
              {enCurso ? "Guardando…" : "Guardar el aviso"}
            </button>
            <span className="font-mono text-[.625rem] tracking-[.04em] text-apagado">
              versión actual: {aviso.version}
            </span>
          </div>
        </form>

        {/* Vista previa: el mismo trozo de interfaz que ve el visitante */}
        <div className="flex flex-col gap-3">
          <p className="lbl">Como se verá</p>
          <div className="flex flex-col border border-filo bg-cuarto">
            <div className="flex items-start justify-between gap-4 border-b border-filo px-5 py-4">
              <h2 className="font-serif text-[1.5rem] leading-none font-bold tracking-[.06em] uppercase">
                {titulo || "Sin título"}
              </h2>
              <span className="border border-filo p-2 text-dato">✕</span>
            </div>
            <div className="scroll-fino flex max-h-[52vh] flex-col gap-4 overflow-y-auto px-5 py-6">
              {parrafos.length === 0 ? (
                <p className="font-mono text-[.7rem] text-apagado">
                  Escribe algo y aparecerá aquí.
                </p>
              ) : (
                <TextoConFormato
                  texto={parrafos.join("\n\n")}
                  className="text-[.9375rem] leading-[1.7] text-papel-2"
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t border-filo px-5 py-4">
              <span className="btn btn-p">{boton || "Entendido"}</span>
              <span className="font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-apagado">
                Se guarda en tu navegador para no volver a enseñártelo. No es una cookie
                y no sale de tu equipo.
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
