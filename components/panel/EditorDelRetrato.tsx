"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarRetratoDeSobreMi } from "@/app/admin/acciones";
import {
  type FotoElegible,
  numeroDeFoto,
  SelectorDeFoto,
} from "@/components/panel/SelectorDeFoto";
import { type RolloDestino, SubirUnaFoto } from "@/components/panel/SubirUnaFoto";
import { TOPE_PIE_RETRATO } from "@/lib/sobreMi";

type Props = {
  /** La que está puesta ahora mismo, o null si la página va sin retrato. */
  elegidaId: string | null;
  pie: string;
  /** Todo el archivo, con la elegida siempre dentro. */
  fotos: FotoElegible[];
  /** Para poder subir una que no esté todavía. */
  rollos: RolloDestino[];
};

/**
 * El retrato de /sobre-mi: qué fotografía acompaña al texto y qué se lee
 * debajo.
 *
 * No se sube nada desde aquí. La fotografía sale del archivo —la misma que
 * entra por /admin/subir—, así que el retrato no es un caso aparte: se le
 * corrige la ficha donde se corrigen todas y se cambia por otra en un clic.
 * Vale también una en borrador: un retrato del autor no tiene por qué formar
 * parte de ninguna serie ni salir en el archivo.
 */
export function EditorDelRetrato({ elegidaId, pie, fotos, rollos }: Props) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [elegida, setElegida] = useState<string | null>(elegidaId);
  const [texto, setTexto] = useState(pie);
  // Las del archivo más las que se suban aquí mismo, sin recargar la página.
  const [catalogo, setCatalogo] = useState(fotos);

  const foto = catalogo.find((f) => f.id === elegida) ?? null;

  const limpio = texto.trim();
  const sobra = limpio.length - TOPE_PIE_RETRATO;

  function correr(fotoId: string, aviso: string) {
    empezar(async () => {
      const datos = new FormData();
      datos.set("fotoId", fotoId);
      datos.set("pie", fotoId ? texto : "");

      const r = await guardarRetratoDeSobreMi(datos);
      if (r?.error) {
        setError(true);
        setMensaje(r.error);
      } else {
        setError(false);
        setMensaje(aviso);
      }
      router.refresh();
    });
  }

  function quitar() {
    setElegida(null);
    setTexto("");
    correr("", "Quitado. La página de sobre mí va sólo con el texto.");
  }

  return (
    <>
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

      <div className="flex flex-1 flex-col gap-8 p-4 sm:p-6 xl:grid xl:grid-cols-[24rem_minmax(0,1fr)] xl:items-start xl:gap-10">
        {/* --- Lo que está puesto ------------------------------------------- */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="lbl">La fotografía</p>
            <h2 className="font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]">
              La fotografía de sobre mí
            </h2>
            <p className="max-w-[46ch] text-[.9375rem] leading-relaxed text-dato">
              Sale junto al texto, al lado de la ficha del archivo. Elige una,
              escribe el pie si hace falta y guarda. Si no pones ninguna, la
              página se monta igual: es mejor que no haya retrato a que se
              quede uno de relleno.
            </p>
          </div>

          {foto ? (
            <figure className="m-0 grid gap-2">
              <div className="relative aspect-[3/4] bg-cuarto-3">
                <Image
                  src={foto.archivo}
                  alt=""
                  fill
                  quality={82}
                  sizes="(max-width: 1279px) 100vw, 384px"
                  className="object-contain"
                />
              </div>
              <figcaption className="font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-dato">
                {numeroDeFoto(foto)} · {foto.serie ?? "sin serie"} ·{" "}
                {foto.estado === "publicada" ? "publicada" : "en borrador"}
              </figcaption>
              {!foto.alt && (
                <p className="font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-rojo">
                  Esta fotografía no tiene texto alternativo, que es lo único
                  que lee un lector de pantalla.{" "}
                  <Link
                    href={`/admin/foto/${foto.id}`}
                    className="underline underline-offset-2"
                  >
                    Escríbelo en su ficha
                  </Link>
                  .
                </p>
              )}
            </figure>
          ) : (
            <p className="border border-dashed border-filo px-4 py-8 text-center font-mono text-[.7rem] leading-relaxed text-dato">
              Ahora mismo la página va sin retrato.
              <br />
              Elige una de las de al lado.
            </p>
          )}

          <label className="grid gap-2">
            <span className="lbl text-[.5625rem]">Pie del retrato</span>
            <textarea
              rows={3}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Dónde, cuándo o quién la hizo. En blanco sale sólo la fotografía."
              className="leading-relaxed"
            />
            <span
              className={`font-mono text-[.625rem] tracking-[.04em] ${
                sobra > 0 ? "text-rojo" : "text-dato"
              }`}
            >
              {limpio.length} de {TOPE_PIE_RETRATO} caracteres
              {sobra > 0 && ` · sobran ${sobra}`}
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-p"
              disabled={enCurso || sobra > 0 || !elegida}
              onClick={() => elegida && correr(elegida, "Guardado. Ya sale en sobre mí.")}
            >
              {enCurso ? "Guardando…" : "Guardar el retrato"}
            </button>
            {elegidaId && (
              <button
                type="button"
                className="btn text-dato hover:text-rojo"
                disabled={enCurso}
                onClick={quitar}
              >
                Quitar el retrato
              </button>
            )}
          </div>
        </div>

        {/* --- El archivo, para elegir -------------------------------------- */}
        <div className="flex flex-col gap-4">
          <SelectorDeFoto
            fotos={catalogo}
            elegida={elegida}
            onElegir={setElegida}
            enCurso={enCurso}
            nota="todo el archivo, publicadas y en borrador. Elegir una aquí no la publica ni la mete en ninguna serie: sólo la pone en sobre mí."
          />

          {/* Y si el retrato no está todavía en el archivo, entra por aquí sin
              salir de la página. */}
          <SubirUnaFoto
            rollos={rollos}
            onSubida={(nueva) => {
              setCatalogo((antes) => [nueva, ...antes]);
              setElegida(nueva.id);
              setError(false);
              setMensaje("Subida. Ya está elegida: dale a «Guardar el retrato» para ponerla.");
              router.refresh();
            }}
          />
        </div>
      </div>
    </>
  );
}
