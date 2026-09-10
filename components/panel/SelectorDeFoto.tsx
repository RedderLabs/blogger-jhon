"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export type FotoElegible = {
  id: string;
  archivo: string;
  titulo: string;
  alt: string;
  /** "borrador" | "publicada" */
  estado: string;
  rollo: string;
  orden: number;
  serie: string | null;
};

/** R/07 · 03, como en el resto del panel. */
export const numeroDeFoto = (f: FotoElegible) =>
  `${f.rollo}/${String(f.orden).padStart(2, "0")}`;

type Props = {
  fotos: FotoElegible[];
  elegida: string | null;
  onElegir: (id: string) => void;
  /** Mientras se guarda, la rejilla no acepta clics. */
  enCurso?: boolean;
  /** Lo que se lee bajo la rejilla; el porqué cambia según dónde se use. */
  nota: string;
};

/** Cuántas se pintan de una vez. El resto está, pero no en el DOM. */
const TANDA = 60;

/**
 * La rejilla del archivo para elegir una fotografía: la misma en la portada y
 * en sobre mí.
 *
 * Están todas las que hay, no las últimas: si una fotografía existe en el
 * archivo tiene que poder elegirse. Lo que se reparte es el pintado —de
 * sesenta en sesenta— porque mil miniaturas de golpe no las mueve ningún
 * navegador, y el buscador filtra sobre el montón entero, no sobre lo que
 * se esté enseñando.
 *
 * El filtro va por lo que uno recuerda —el título, el código del rollo, la
 * serie— y no por la fecha, que es justo lo que no se recuerda.
 */
export function SelectorDeFoto({ fotos, elegida, onElegir, enCurso, nota }: Props) {
  const [busca, setBusca] = useState("");
  const [tope, setTope] = useState(TANDA);

  const listadas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return fotos;
    return fotos.filter((f) =>
      [f.titulo, f.rollo, f.serie ?? "", f.alt].join(" ").toLowerCase().includes(q),
    );
  }, [busca, fotos]);

  const enPantalla = listadas.slice(0, tope);
  const faltan = listadas.length - enPantalla.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="lbl">Del archivo</p>
        <input
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setTope(TANDA);
          }}
          placeholder="Buscar por título, rollo o serie"
          aria-label="Buscar una fotografía del archivo"
          className="ml-auto w-full sm:w-[18rem]"
          autoComplete="off"
        />
      </div>

      {listadas.length === 0 ? (
        <p className="font-mono text-[.7rem] text-dato">
          Nada con eso. Prueba con el código del rollo.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-[2px] sm:grid-cols-4 lg:grid-cols-6">
          {enPantalla.map((f) => {
            const puesta = f.id === elegida;
            return (
              <button
                key={f.id}
                type="button"
                disabled={enCurso}
                onClick={() => onElegir(f.id)}
                aria-pressed={puesta}
                title={`${numeroDeFoto(f)} · ${f.titulo}`}
                className="relative block aspect-[3/2] bg-marco"
                style={
                  puesta
                    ? { outline: "1px solid var(--color-rojo)", outlineOffset: -1 }
                    : undefined
                }
              >
                <Image
                  src={f.archivo}
                  alt={`${numeroDeFoto(f)} · ${f.titulo}`}
                  fill
                  quality={70}
                  sizes="140px"
                  className={`object-cover transition-opacity ${
                    puesta ? "opacity-100" : "opacity-45 hover:opacity-85"
                  }`}
                />
                {f.estado !== "publicada" && (
                  <span className="absolute top-0 right-0 bg-cuarto/85 px-1 font-mono text-[.5rem] tracking-[.08em] text-dato uppercase">
                    Bor
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {faltan > 0 && (
        <button
          type="button"
          className="btn w-fit"
          onClick={() => setTope((t) => t + TANDA)}
        >
          Ver {faltan > TANDA ? TANDA : faltan} más
        </button>
      )}

      <p className="max-w-[64ch] font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
        {enPantalla.length} de {listadas.length}
        {listadas.length !== fotos.length && ` (de ${fotos.length} en el archivo)`} ·{" "}
        {nota}
      </p>
    </div>
  );
}
