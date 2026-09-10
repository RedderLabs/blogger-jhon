"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarPercance } from "@/app/admin/acciones";
import {
  type FotoElegible,
  numeroDeFoto,
  SelectorDeFoto,
} from "@/components/panel/SelectorDeFoto";
import { type RolloDestino, SubirUnaFoto } from "@/components/panel/SubirUnaFoto";
import { RUTAS } from "@/lib/enlaces";
import { SOLO_EN_LINEA } from "@/components/panel/BarraDeFormato";
import { CajaConFormato } from "@/components/panel/CajaConFormato";
import {
  type ClaveDePercance,
  enCatalogo,
  type PercanceCompleto,
  POR_DEFECTO,
  TOPES,
} from "@/lib/percances";

type Props = {
  clave: ClaveDePercance;
  /** Lo que se lee ahora mismo en la página, sea propio o de fábrica. */
  datos: PercanceCompleto;
  /** La foto elegida a mano, o null si la página va sin imagen. */
  fotoId: string | null;
  fotos: FotoElegible[];
  rollos: RolloDestino[];
};

/**
 * El texto y la fotografía de una página de error.
 *
 * Va dentro de un `details` porque son dos páginas en la misma pantalla y cada
 * una arrastra la rejilla del archivo entera: abiertas las dos a la vez, no se
 * encontraría nada.
 *
 * Los campos en blanco vuelven al texto de fábrica —el que sale en gris—, así
 * que no hay manera de dejar un error sin explicación.
 */
export function EditorDeUnPercance({ clave, datos, fotoId, fotos, rollos }: Props) {
  const router = useRouter();
  const ficha = enCatalogo(clave);
  const fabrica = POR_DEFECTO[clave];

  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [catalogo, setCatalogo] = useState(fotos);
  const [foto, setFoto] = useState<string | null>(fotoId);
  const [rotulo, setRotulo] = useState(datos.rotulo === fabrica.rotulo ? "" : datos.rotulo);
  const [titulo, setTitulo] = useState(datos.titulo === fabrica.titulo ? "" : datos.titulo);
  const [texto, setTexto] = useState(datos.texto === fabrica.texto ? "" : datos.texto);

  const elegida = catalogo.find((f) => f.id === foto) ?? null;
  const enBorrador = Boolean(elegida && elegida.estado !== "publicada");

  const sobra =
    rotulo.trim().length > TOPES.rotulo ||
    titulo.trim().length > TOPES.titulo ||
    texto.trim().length > TOPES.texto;

  function guardar() {
    empezar(async () => {
      const forma = new FormData();
      forma.set("rotulo", rotulo);
      forma.set("titulo", titulo);
      forma.set("texto", texto);
      forma.set("fotoId", foto ?? "");
      forma.set("publicar", enBorrador ? "si" : "no");

      const r = await guardarPercance(clave, forma);
      if (r?.error) {
        setError(true);
        setMensaje(r.error);
      } else {
        setError(false);
        setMensaje(
          r?.porDefecto
            ? "Guardado. La página vuelve al texto de fábrica, sin imagen."
            : "Guardado. Ya es lo que se lee cuando pasa.",
        );
      }
      router.refresh();
    });
  }

  return (
    <details className="border border-filo">
      <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 font-mono text-[.72rem] tracking-[.08em] text-dato">
        <span className="text-papel">{ficha?.codigo}</span>
        <span>{datos.titulo}</span>
        <span className="ml-auto text-apagado">
          {elegida ? "con fotografía" : "sin fotografía"}
        </span>
      </summary>

      <div className="grid gap-6 border-t border-filo p-4 sm:p-5">
        <p className="m-0 max-w-[70ch] font-mono text-[.66rem] leading-relaxed tracking-[.02em] text-dato">
          {ficha?.cuando}
        </p>

        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <label className="grid gap-1">
            <span className="lbl text-[.5625rem]">Rótulo</span>
            <input
              value={rotulo}
              onChange={(e) => setRotulo(e.target.value)}
              placeholder={fabrica.rotulo}
              autoComplete="off"
            />
            <span className="font-mono text-[.625rem] tracking-[.04em] text-apagado">
              Va a la derecha del número, arriba del todo.
            </span>
          </label>

          <label className="grid gap-1">
            <span className="lbl text-[.5625rem]">Título</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={fabrica.titulo}
              autoComplete="off"
            />
            <span className="font-mono text-[.625rem] tracking-[.04em] text-apagado">
              Lo grande, lo primero que se lee.
            </span>
          </label>
        </div>

        <label className="grid gap-1">
          <span className="lbl text-[.5625rem]">El texto</span>
          <CajaConFormato
            rows={6}
            valor={texto}
            alCambiar={setTexto}
            grupos={SOLO_EN_LINEA}
            placeholder={fabrica.texto}
            className="leading-relaxed"
          />
          <span
            className={`font-mono text-[.625rem] leading-relaxed tracking-[.04em] ${
              texto.trim().length > TOPES.texto ? "text-rojo" : "text-apagado"
            }`}
          >
            {texto.trim().length} de {TOPES.texto} caracteres · una línea en
            blanco separa párrafos · el formato lo ponen los botones · las
            páginas del sitio son {RUTAS.join(" ")}
          </span>
        </label>

        {/* --- La fotografía ------------------------------------------------ */}
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="lbl text-[.5625rem]">La fotografía</p>
            {elegida && (
              <button
                type="button"
                className="ml-auto font-mono text-[.66rem] tracking-[.08em] text-dato uppercase hover:text-rojo"
                onClick={() => setFoto(null)}
              >
                Quitar la imagen
              </button>
            )}
          </div>

          {elegida ? (
            <figure className="m-0 grid gap-2 sm:max-w-[22rem]">
              <div className="relative aspect-[3/2] bg-cuarto-3">
                <Image
                  src={elegida.archivo}
                  alt=""
                  fill
                  quality={70}
                  sizes="352px"
                  className="object-cover"
                />
              </div>
              <figcaption className="font-mono text-[.66rem] tracking-[.04em] text-dato">
                {numeroDeFoto(elegida)} · {elegida.serie ?? "sin serie"}
              </figcaption>
              {enBorrador && (
                <p className="m-0 font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-rojo">
                  Está en borrador. Al guardar se publica: esta página la ve
                  cualquiera.
                </p>
              )}
            </figure>
          ) : (
            <p className="m-0 font-mono text-[.7rem] leading-relaxed text-apagado">
              La página sale sólo con el texto. Una fotografía aquí no adorna:
              es lo que hace que un tropiezo siga pareciendo este sitio.
            </p>
          )}

          <SelectorDeFoto
            fotos={catalogo}
            elegida={foto}
            onElegir={setFoto}
            enCurso={enCurso}
            nota="todo el archivo, publicadas y en borrador. Las marcadas «Bor» se publican al guardar: esta página la ve cualquiera."
          />

          <SubirUnaFoto
            rollos={rollos}
            onSubida={(nueva) => {
              setCatalogo((antes) => [nueva, ...antes]);
              setFoto(nueva.id);
              router.refresh();
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="btn btn-p"
            onClick={guardar}
            disabled={enCurso || sobra}
          >
            {enCurso
              ? "Guardando…"
              : enBorrador
                ? "Publicar la foto y guardar"
                : "Guardar la página"}
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
      </div>
    </details>
  );
}
