"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { borrarCategoria, crearCategoria, renombrarCategoria } from "@/app/admin/acciones";
import { IconoMas } from "@/components/Iconos";

export type Categoria = {
  id: string;
  nombre: string;
  slug: string;
  /** Cuántas entradas la llevan puesta. */
  cuantas: number;
};

/**
 * Las categorías de las entradas: crearlas, renombrarlas y quitarlas.
 *
 * Son el modelo `Tema` de siempre —las que filtran /entradas—, sólo que hasta
 * ahora existían las del arranque y no había manera de añadir una sin tocar la
 * base. Se ponen a cada texto en su editor; aquí se decide cuáles hay.
 *
 * Lo que se escribe en cada fila no se guarda solo: hace falta el botón. Una
 * categoría se lee en el sitio publicado, y una tecla suelta no debería
 * renombrar nada.
 */
export function PanelDeCategorias({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [nueva, setNueva] = useState("");
  // Sólo las que se están tocando: lo que no esté aquí es lo que hay en la base.
  const [editados, setEditados] = useState<Record<string, string>>({});

  const aviso = (texto: string, malo = false) => {
    setError(malo);
    setMensaje(texto);
  };

  function anadir() {
    const nombre = nueva.trim();
    if (!nombre) return;
    empezar(async () => {
      const r = await crearCategoria(nombre);
      if (r?.error) return aviso(r.error, true);
      setNueva("");
      aviso(`«${r?.categoria?.nombre}» ya se puede poner en cualquier texto.`);
      router.refresh();
    });
  }

  function renombrar(c: Categoria) {
    const nombre = (editados[c.id] ?? c.nombre).trim();
    if (!nombre || nombre === c.nombre) return;
    empezar(async () => {
      const r = await renombrarCategoria(c.id, nombre);
      if (r?.error) return aviso(r.error, true);
      setEditados((antes) => {
        // La fila deja de estar «tocada»: a partir de ahora vale lo de la base.
        const resto = { ...antes };
        delete resto[c.id];
        return resto;
      });
      aviso(`Ahora se llama «${nombre}».`);
      router.refresh();
    });
  }

  function borrar(c: Categoria) {
    const seguro = c.cuantas
      ? `¿Borrar «${c.nombre}»? Los ${c.cuantas} textos que la llevan se quedan donde están, pero pierden la etiqueta y volver a ponerla es ir uno por uno.`
      : `¿Borrar «${c.nombre}»? No la lleva ningún texto.`;
    if (!confirm(seguro)) return;

    empezar(async () => {
      const r = await borrarCategoria(c.id);
      aviso(
        r?.cuantas
          ? `Borrada. ${r.cuantas} ${r.cuantas === 1 ? "texto se queda" : "textos se quedan"} sin esa categoría.`
          : "Borrada.",
      );
      router.refresh();
    });
  }

  return (
    <div className="flex-1 p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-1">
        <p className="lbl">Cómo se ordena la escritura</p>
        <h1 className="font-serif text-[1.4rem] leading-none font-bold sm:text-[1.7rem]">
          {categorias.length}{" "}
          {categorias.length === 1 ? "categoría" : "categorías"}
        </h1>
        <p className="m-0 mt-2 max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
          Se le ponen a cada texto en su editor, y son los botones que filtran
          las entradas. Por tema y no por semana: es lo que hace que un texto de
          hace dos años se encuentre.
        </p>
      </div>

      <div className="mb-6 grid gap-2 border border-filo p-4 sm:p-5">
        <p className="lbl text-[.5625rem]">Categoría nueva</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                anadir();
              }
            }}
            placeholder="Mirada, equipo, revelado…"
            autoComplete="off"
            className="sm:max-w-[22rem]"
          />
          <button
            type="button"
            className="btn btn-p"
            onClick={anadir}
            disabled={enCurso || nueva.trim().length < 2}
          >
            <IconoMas tam={14} />
            Añadir
          </button>
        </div>
        {mensaje && (
          <p
            role="status"
            className={`m-0 font-mono text-[.66rem] tracking-[.04em] ${
              error ? "text-rojo" : "text-verde"
            }`}
          >
            {mensaje}
          </p>
        )}
      </div>

      {categorias.length === 0 ? (
        <p className="border border-dashed border-filo-2 px-6 py-12 text-center font-mono text-[.72rem] tracking-[.06em] text-dato">
          Todavía no hay ninguna. La primera se escribe ahí arriba.
        </p>
      ) : (
        <div className="border-t border-filo">
          {categorias.map((c) => {
            const nombre = editados[c.id] ?? c.nombre;
            const cambiado = nombre.trim() !== c.nombre && nombre.trim().length >= 2;
            return (
              <div
                key={c.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-filo px-1 py-3 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_7rem_auto] lg:gap-x-5"
              >
                <input
                  value={nombre}
                  onChange={(e) =>
                    setEditados((antes) => ({ ...antes, [c.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      renombrar(c);
                    }
                  }}
                  autoComplete="off"
                  aria-label={`Nombre de ${c.nombre}`}
                />

                <span className="col-start-1 row-start-2 truncate font-mono text-[.66rem] tracking-[.04em] text-apagado lg:col-start-2 lg:row-start-1">
                  /entradas?tema={c.slug}
                </span>

                <span className="col-start-2 row-start-2 font-mono text-[.66rem] tracking-[.06em] text-dato lg:col-start-3 lg:row-start-1">
                  {c.cuantas} {c.cuantas === 1 ? "texto" : "textos"}
                </span>

                <span className="col-start-2 row-start-1 flex justify-end gap-2 lg:col-start-4">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => renombrar(c)}
                    disabled={enCurso || !cambiado}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => borrar(c)}
                    disabled={enCurso}
                  >
                    Borrar
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 m-0 max-w-[62ch] font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-apagado">
        Borrar una categoría no borra ningún texto: los que la llevaban se
        quedan donde están, sin ella.{" "}
        <Link href="/entradas" target="_blank" className="text-dato hover:text-papel">
          Ver las entradas ↗
        </Link>
      </p>
    </div>
  );
}
