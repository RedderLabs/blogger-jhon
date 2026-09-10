"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { IconoMas } from "@/components/Iconos";
import { borrarEntradas } from "@/app/admin/acciones";

/**
 * Lo que la lista necesita de cada entrada, ya masticado en el servidor: la
 * fecha llega hecha texto para que el panel no tenga que formatear nada.
 */
export type EntradaEnLista = {
  id: string;
  slug: string;
  titulo: string;
  estado: string;
  fecha: string;
  temas: string;
  palabras: number;
};

const ETIQUETA: Record<string, { texto: string; color: string }> = {
  borrador: { texto: "Borrador", color: "var(--color-dato)" },
  programada: { texto: "Programada", color: "var(--color-rojo)" },
  publica: { texto: "Pública", color: "var(--color-verde)" },
};

export function ListaDeEntradas({ entradas }: { entradas: EntradaEnLista[] }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();

  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const todas = entradas.length > 0 && marcadas.size === entradas.length;

  function marcar(id: string, si: boolean) {
    setMensaje(null);
    setMarcadas((antes) => {
      const nuevas = new Set(antes);
      if (si) nuevas.add(id);
      else nuevas.delete(id);
      return nuevas;
    });
  }

  function marcarTodas(si: boolean) {
    setMensaje(null);
    setMarcadas(si ? new Set(entradas.map((e) => e.id)) : new Set());
  }

  function borrarLoMarcado() {
    const ids = [...marcadas];
    if (ids.length === 0) return;

    const cuenta = `${ids.length} ${ids.length === 1 ? "entrada" : "entradas"}`;
    const nombres =
      ids.length === 1
        ? `«${entradas.find((e) => e.id === ids[0])?.titulo}»`
        : cuenta;
    if (!confirm(`¿Borrar ${nombres}? No hay vuelta atrás.`)) return;

    empezar(async () => {
      const r = (await borrarEntradas(ids)) as {
        error?: string;
        cuantas?: number;
      };
      setError(Boolean(r?.error));
      if (r?.error) {
        setMensaje(r.error);
      } else {
        const n = r?.cuantas ?? ids.length;
        setMensaje(`Borradas ${n} ${n === 1 ? "entrada" : "entradas"}.`);
        setMarcadas(new Set());
      }
      router.refresh();
    });
  }

  if (entradas.length === 0) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-1">
          <p className="lbl">La escritura</p>
          <h1 className="font-serif text-[1.4rem] leading-none font-bold sm:text-[1.7rem]">
            0 entradas
          </h1>
        </div>

        <Link href="/admin/entradas/nueva" className="soltar py-12">
          <IconoMas tam={16} />
          <span className="font-mono text-[.72rem] tracking-[.12em] uppercase">
            Escribir la primera
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-1">
        <p className="lbl">La escritura</p>
        <h1 className="font-serif text-[1.4rem] leading-none font-bold sm:text-[1.7rem]">
          {entradas.length} {entradas.length === 1 ? "entrada" : "entradas"}
        </h1>
      </div>

      {/* La barra de la selección: siempre visible, para que la casilla de
          «todas» no aparezca y desaparezca según lo que haya marcado. */}
      <div className="mb-2 flex flex-wrap items-center gap-3 border-b border-filo pb-2">
        <label className="flex cursor-pointer items-center gap-2 font-mono text-[.66rem] tracking-[.06em] text-dato uppercase hover:text-papel">
          <input
            type="checkbox"
            checked={todas}
            ref={(el) => {
              // Ni todas ni ninguna: el guion del navegador para «hay algo
              // marcado, pero no todo». No se puede poner por atributo.
              if (el) el.indeterminate = marcadas.size > 0 && !todas;
            }}
            onChange={(ev) => marcarTodas(ev.target.checked)}
          />
          Todas
        </label>

        {marcadas.size > 0 && (
          <>
            <span className="font-mono text-[.66rem] tracking-[.06em] text-dato">
              {marcadas.size} {marcadas.size === 1 ? "marcada" : "marcadas"}
            </span>
            <button
              type="button"
              onClick={() => marcarTodas(false)}
              className="border-b border-filo font-mono text-[.66rem] tracking-[.12em] text-dato uppercase hover:text-papel"
            >
              Vaciar
            </button>
            <button
              type="button"
              className="btn btn-p ml-auto"
              disabled={enCurso}
              onClick={borrarLoMarcado}
            >
              {enCurso
                ? "Borrando…"
                : `Borrar ${marcadas.size} ${marcadas.size === 1 ? "marcada" : "marcadas"}`}
            </button>
          </>
        )}
      </div>

      {mensaje && (
        <p
          role="status"
          className={`mb-2 px-1 py-2 font-mono text-[.7rem] tracking-[.04em] ${
            error ? "text-rojo" : "text-dato"
          }`}
        >
          {mensaje}
        </p>
      )}

      <div className="border-t border-filo">
        {entradas.map((e) => {
          const est = ETIQUETA[e.estado] ?? ETIQUETA.borrador;
          const marcada = marcadas.has(e.id);
          return (
            <div
              key={e.id}
              data-marcada={marcada ? "si" : undefined}
              className="flex items-stretch border-b border-filo data-[marcada=si]:bg-[rgb(217_80_58/.06)]"
            >
              {/* La casilla se pincha en toda su columna y no en el cuadro de
                  un pelo: en la mesa se marca con el dedo. */}
              <label className="flex cursor-pointer items-center px-2 hover:bg-[rgb(237_231_222/.04)] sm:px-3">
                <input
                  type="checkbox"
                  checked={marcada}
                  aria-label={`Marcar «${e.titulo}»`}
                  onChange={(ev) => marcar(e.id, ev.target.checked)}
                />
              </label>

              <Link
                href={`/admin/entradas/${e.id}`}
                className="group grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3 pr-1 hover:bg-[rgb(237_231_222/.035)] lg:grid-cols-[6rem_minmax(0,1fr)_14rem_6rem_5rem] lg:gap-x-5"
              >
                <span className="col-start-1 row-start-2 font-mono text-[.7rem] tracking-[.06em] text-dato group-hover:text-rojo lg:row-start-1">
                  {e.fecha}
                </span>

                <span className="col-start-1 row-start-1 min-w-0 lg:col-start-2">
                  <span className="block truncate font-serif text-[1.1rem] leading-tight group-hover:text-white lg:text-[1.22rem]">
                    {e.titulo}
                  </span>
                  <span className="block truncate font-mono text-[.625rem] tracking-[.04em] text-apagado">
                    /entradas/{e.slug}
                  </span>
                </span>

                <span className="col-start-1 row-start-3 font-mono text-[.66rem] tracking-[.06em] text-dato lg:col-start-3 lg:row-start-1">
                  {e.temas || "Sin categoría"}
                </span>

                <span className="hidden font-mono text-[.66rem] tracking-[.06em] text-dato lg:block">
                  {e.palabras} palabras
                </span>

                <span
                  className="col-start-2 row-start-1 justify-self-end border border-current px-2 py-[.24rem] font-mono text-[.625rem] tracking-[.11em] whitespace-nowrap uppercase lg:col-start-5"
                  style={{ color: est.color }}
                >
                  {est.texto}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
