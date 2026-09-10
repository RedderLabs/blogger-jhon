"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { IconoAsa } from "@/components/Iconos";
import {
  fijarApertura,
  fijarHojaDelMes,
  guardarAltDeFoto,
  guardarSeccionesDePortada,
} from "@/app/admin/acciones";
import {
  type FotoElegible,
  numeroDeFoto,
  SelectorDeFoto,
} from "@/components/panel/SelectorDeFoto";
import { SubirUnaFoto } from "@/components/panel/SubirUnaFoto";
import {
  type ClaveDeSeccion,
  enCatalogo,
  type SeccionDePortada,
  TOPE_TITULO,
} from "@/lib/portada";

export type RolloElegible = {
  id: string;
  codigo: string;
  cuantas: number;
  cuando: string;
};

type Props = {
  /** La fijada a mano, o null si la portada va con la última publicada. */
  aperturaId: string | null;
  /** La que saldría sola sin fijar ninguna: la última publicada. */
  automaticaId: string | null;
  /** Todo el archivo, de lo más reciente a lo más viejo. */
  fotos: FotoElegible[];
  rollos: RolloElegible[];
  hojaId: string | null;
  secciones: SeccionDePortada[];
  /** Las que están encendidas pero hoy no tienen nada que pintar. */
  vacias: ClaveDeSeccion[];
};

/**
 * La portada: qué fotografía la abre, qué rollo se enseña debajo y qué piezas
 * salen, en qué orden y con qué rótulo.
 *
 * Las piezas estaban una detrás de otra dentro de la página y la
 * apertura se elegía entre las cinco últimas, en un rincón de /admin/series.
 * Aquí se elige entre todo el archivo publicado y se puede apagar lo que
 * sobre: una portada de un solo trabajo es una decisión, no una carencia.
 */
export function EditorDeLaPortada({
  aperturaId,
  automaticaId,
  fotos,
  rollos,
  hojaId,
  secciones,
  vacias,
}: Props) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [apertura, setApertura] = useState<string | null>(aperturaId);
  // Las del archivo más las que se suban aquí mismo, sin recargar la página.
  const [catalogo, setCatalogo] = useState(fotos);
  const [hoja, setHoja] = useState<string | null>(hojaId);

  const [lista, setLista] = useState<SeccionDePortada[]>(secciones);

  // Sin nada fijado manda la última publicada.
  const automatica = catalogo.find((f) => f.id === automaticaId) ?? null;
  const puesta = catalogo.find((f) => f.id === apertura) ?? automatica;
  const enBorrador = Boolean(puesta && puesta.estado !== "publicada");

  /* --- El texto alternativo, cuando falta ---------------------------------
     Casi todo el archivo entra en borrador y sin alt —así lo deja el traslado
     del blog—. Aquí no impide nada: cambiar la fotografía de portada no puede
     depender de escribir un texto antes, y así lo pidió el usuario. Se avisa
     de que falta y se puede escribir sin salir de la página, que es distinto
     de exigirlo. */
  const faltaAlt = Boolean(puesta && !puesta.alt.trim());
  const [alt, setAlt] = useState("");

  const cambiar = (i: number, cambio: Partial<SeccionDePortada>) =>
    setLista((antes) =>
      antes.map((s, j) => (j === i ? { ...s, ...cambio } : s)),
    );

  const mover = (i: number, paso: -1 | 1) =>
    setLista((antes) => {
      const destino = i + paso;
      if (destino < 0 || destino >= antes.length) return antes;
      const copia = [...antes];
      [copia[i], copia[destino]] = [copia[destino], copia[i]];
      return copia;
    });

  /* --- Mover arrastrando -------------------------------------------------
     Con el arrastre de siempre del navegador, sin biblioteca: son cuatro
     piezas y traerse uno de esos paquetes para esto sería pagar mucho por
     poco.

     Los botones ↑ y ↓ se quedan, y no por costumbre: el arrastre del
     navegador no existe en una pantalla táctil y tampoco se puede hacer con
     el teclado. Quien esté en un teléfono, o no use ratón, sigue moviendo las
     secciones igual que antes.

     Una tarjeta sólo se vuelve arrastrable mientras se tiene apretada el asa.
     Si estuviera siempre suelta, seleccionar el texto del rótulo se llevaría
     la tarjeta entera por delante. */

  /** Cuál se está moviendo, y encima de cuál está ahora mismo. */
  const [asida, setAsida] = useState<number | null>(null);
  const [moviendo, setMoviendo] = useState<number | null>(null);
  const [encima, setEncima] = useState<number | null>(null);

  const soltarEncimaDe = (destino: number) => {
    setLista((antes) => {
      if (moviendo === null || moviendo === destino) return antes;
      const copia = [...antes];
      const [pieza] = copia.splice(moviendo, 1);
      // Se inserta en el hueco, no se cambia con la otra: arrastrar la última
      // entrada hasta arriba la pone la primera y empuja al resto hacia abajo,
      // que es lo que se espera al soltarla ahí.
      copia.splice(destino, 0, pieza);
      return copia;
    });
    setMoviendo(null);
    setEncima(null);
    setAsida(null);
  };

  /** La raya roja que dice dónde va a caer: arriba o abajo según de dónde venga. */
  const senal = (i: number) => {
    if (encima !== i || moviendo === null || moviendo === i) return undefined;
    return moviendo < i
      ? { boxShadow: "inset 0 -2px 0 var(--color-rojo)" }
      : { boxShadow: "inset 0 2px 0 var(--color-rojo)" };
  };

  const sobra = lista.some((s) => (s.titulo ?? "").trim().length > TOPE_TITULO);
  const apagadas = lista.filter((s) => !s.visible).length;

  function correr(trabajo: () => Promise<unknown>, aviso: string) {
    empezar(async () => {
      const r = (await trabajo()) as { error?: string } | undefined;
      setError(Boolean(r?.error));
      setMensaje(r?.error ?? aviso);
      router.refresh();
    });
  }

  return (
    <>
      {mensaje && (
        <p
          role="status"
          className={`border-b border-filo px-4 py-2 font-mono text-[.7rem] tracking-[.04em] sm:px-6 ${
            error
              ? "bg-[rgb(217_80_58/.12)] text-rojo"
              : "bg-[rgb(217_80_58/.08)]"
          }`}
        >
          {mensaje}
        </p>
      )}

      {/* --- La fotografía que abre --------------------------------------- */}
      <div className="flex flex-col gap-8 border-b border-filo p-4 sm:p-6 xl:grid xl:grid-cols-[26rem_minmax(0,1fr)] xl:items-start xl:gap-10">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="lbl">La imagen</p>
            <h1 className="font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]">
              La fotografía que abre
            </h1>
            <p className="max-w-[46ch] text-[.9375rem] leading-relaxed text-dato">
              Ocupa toda la pantalla al entrar, sola y sin nada escrito
              encima. Si no eliges ninguna sale la última publicada, y entonces
              la portada se mueve sola cada vez que entra un rollo.
            </p>
          </div>

          {puesta ? (
            <>
              <figure className="m-0 grid gap-2">
                <div className="relative aspect-[16/9] bg-cuarto-3">
                  <Image
                    src={puesta.archivo}
                    alt=""
                    fill
                    quality={82}
                    sizes="(max-width: 1279px) 100vw, 416px"
                    className="object-cover contrast-[1.05]"
                  />
                </div>
                <figcaption className="font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-dato">
                  {numeroDeFoto(puesta)} · {puesta.serie ?? "sin serie"} ·{" "}
                  {apertura ? "fijada a mano" : "la última publicada"}
                </figcaption>
                {enBorrador && (
                  <p className="font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-rojo">
                    Está en borrador: a la portada no llega sin publicar. El
                    botón la publica al fijarla.
                  </p>
                )}
                {faltaAlt && (
                  <p className="font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-dato">
                    No tiene texto alternativo, y es la primera imagen del
                    sitio. No impide ponerla, pero conviene escribirlo aquí
                    abajo.
                  </p>
                )}
              </figure>

              {/* Se escribe donde estorba que falte, no en otra pantalla. */}
              {faltaAlt && (
                <label className="grid gap-1">
                  <span className="lbl text-[.5625rem]">Texto alternativo</span>
                  <textarea
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    rows={2}
                    maxLength={600}
                    placeholder="Lo que se ve, para quien no la puede ver."
                    aria-label="Texto alternativo de la fotografía"
                  />
                  <button
                    type="button"
                    className="btn w-fit"
                    disabled={enCurso || !alt.trim()}
                    onClick={() =>
                      correr(async () => {
                        const escrito = alt.trim();
                        const r = (await guardarAltDeFoto(
                          puesta.id,
                          escrito,
                        )) as {
                          error?: string;
                        };
                        if (!r.error) {
                          setCatalogo((antes) =>
                            antes.map((f) =>
                              f.id === puesta.id ? { ...f, alt: escrito } : f,
                            ),
                          );
                          setAlt("");
                        }
                        return r;
                      }, "Escrito. Ya se puede publicar y poner de apertura.")
                    }
                  >
                    Guardar el texto alternativo
                  </button>
                </label>
              )}
            </>
          ) : (
            <p className="border border-dashed border-filo px-4 py-8 text-center font-mono text-[.7rem] leading-relaxed text-dato">
              Todavía no hay ninguna fotografía publicada.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-p"
              disabled={enCurso || !apertura}
              onClick={() =>
                correr(
                  () => fijarApertura(apertura, enBorrador),
                  `${
                    enBorrador
                      ? "Publicada y puesta. Ya es la primera imagen del sitio."
                      : "Guardada. Ya es la primera imagen del sitio."
                  }${faltaAlt ? " Sigue sin texto alternativo." : ""}`,
                )
              }
            >
              {enCurso
                ? "Guardando…"
                : enBorrador
                  ? "Publicar y fijar como apertura"
                  : "Fijar esta apertura"}
            </button>
            {aperturaId && (
              <button
                type="button"
                className="btn text-dato hover:text-rojo"
                disabled={enCurso}
                onClick={() => {
                  setApertura(null);
                  correr(
                    () => fijarApertura(null),
                    "Suelta. La portada vuelve a abrirse con la última publicada.",
                  );
                }}
              >
                Volver a la última publicada
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <SelectorDeFoto
            fotos={catalogo}
            elegida={puesta?.id ?? null}
            onElegir={(id) => {
              setApertura(id);
              // Lo escrito para otra fotografía no se arrastra a ésta.
              setAlt("");
            }}
            enCurso={enCurso}
            nota="todo el archivo, publicadas y en borrador. Las marcadas «Bor» no están publicadas: elegir una y darle al botón la publica."
          />

          {/* Y si la que quiere no está todavía en el archivo, entra por aquí
              sin salir de la página. */}
          <SubirUnaFoto
            rollos={rollos}
            onSubida={(nueva) => {
              setCatalogo((antes) => [nueva, ...antes]);
              setApertura(nueva.id);
              setError(false);
              setMensaje(
                "Subida y publicada. Ya está elegida: dale a «Fijar esta apertura» para ponerla.",
              );
              router.refresh();
            }}
          />
        </div>
      </div>

      {/* --- Qué se enseña y en qué orden --------------------------------- */}
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="flex flex-col gap-2">
          <p className="lbl">Las secciones</p>
          <h2 className="font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]">
            Qué se ve al entrar
          </h2>
          <p className="max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
            Las piezas de la portada, en el orden en que se pintan. Se apagan,
            se encienden y se mueven; al rótulo se le puede cambiar el nombre.
            Para cambiarlas de sitio, agárralas por el asa de la izquierda y
            suéltalas donde quieras que caigan —o usa las flechas, que es lo que
            hay que hacer en un teléfono. Apagarlas todas dejaría la portada en
            blanco, así que el último interruptor encendido no se deja apagar.
          </p>
        </div>

        <div className="grid gap-3">
          {lista.map((s, i) => {
            const ficha = enCatalogo(s.clave);
            if (!ficha) return null;

            const soloQuedaEsta =
              s.visible && lista.filter((o) => o.visible).length === 1;
            const largo = (s.titulo ?? "").trim().length;

            return (
              <div
                key={s.clave}
                draggable={asida === i}
                onDragStart={(e) => {
                  setMoviendo(i);
                  e.dataTransfer.effectAllowed = "move";
                  // Firefox no empieza el arrastre si no se le da algo.
                  e.dataTransfer.setData("text/plain", s.clave);
                }}
                onDragEnd={() => {
                  setMoviendo(null);
                  setEncima(null);
                  setAsida(null);
                }}
                onDragOver={(e) => {
                  if (moviendo === null || moviendo === i) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setEncima(i);
                }}
                onDragLeave={() => setEncima((v) => (v === i ? null : v))}
                onDrop={(e) => {
                  e.preventDefault();
                  soltarEncimaDe(i);
                }}
                className="grid gap-3 border border-filo p-3 sm:p-4"
                style={{
                  ...(s.visible ? undefined : { opacity: 0.55 }),
                  ...(moviendo === i ? { opacity: 0.4 } : {}),
                  ...senal(i),
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    // El asa: mientras se tiene apretada, la tarjeta se puede
                    // arrastrar. Al soltarla vuelve a estar quieta, y así el
                    // texto del rótulo se puede seleccionar con el ratón.
                    onPointerDown={() => setAsida(i)}
                    onPointerUp={() => setAsida(null)}
                    aria-hidden="true"
                    title="Arrastra para moverla de sitio"
                    className="grid h-[24px] w-[22px] shrink-0 cursor-grab place-items-center border border-filo text-apagado hover:border-rojo hover:text-rojo active:cursor-grabbing"
                  >
                    <IconoAsa tam={11} />
                  </span>
                  <span className="font-mono text-[.66rem] tracking-[.08em] text-apagado">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-serif text-[1.1rem] leading-none">
                    {ficha.nombre}
                  </span>

                  <div className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      className="seg"
                      data-on={s.visible ? "si" : undefined}
                      disabled={soloQuedaEsta}
                      aria-pressed={s.visible}
                      title={
                        soloQuedaEsta
                          ? "Es la única que queda encendida"
                          : "Encender o apagar la sección"
                      }
                      onClick={() => cambiar(i, { visible: !s.visible })}
                    >
                      {s.visible ? "Se ve" : "Apagada"}
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(i, -1)}
                      disabled={i === 0}
                      aria-label="Subir la sección"
                      className="border border-filo px-2 py-[.35rem] font-mono text-[.7rem] text-dato hover:border-filo-2 hover:text-papel disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(i, 1)}
                      disabled={i === lista.length - 1}
                      aria-label="Bajar la sección"
                      className="border border-filo px-2 py-[.35rem] font-mono text-[.7rem] text-dato hover:border-filo-2 hover:text-papel disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <p className="m-0 max-w-[70ch] font-mono text-[.66rem] leading-relaxed tracking-[.02em] text-dato">
                  {ficha.que}
                </p>

                {vacias.includes(s.clave) && (
                  <p className="m-0 font-mono text-[.66rem] leading-relaxed tracking-[.02em] text-rojo">
                    Ahora mismo no hay nada que enseñar aquí, así que no sale
                    aunque esté encendida.
                  </p>
                )}

                {ficha.tituloPorDefecto && (
                  <label className="grid gap-1 sm:max-w-[24rem]">
                    <span className="lbl text-[.5625rem]">Rótulo</span>
                    <input
                      value={s.titulo ?? ""}
                      onChange={(e) => cambiar(i, { titulo: e.target.value })}
                      placeholder={ficha.tituloPorDefecto}
                      aria-label={`Rótulo de ${ficha.nombre}`}
                      autoComplete="off"
                    />
                    <span
                      className={`font-mono text-[.625rem] tracking-[.04em] ${
                        largo > TOPE_TITULO ? "text-rojo" : "text-apagado"
                      }`}
                    >
                      En blanco sale «{ficha.tituloPorDefecto}»
                    </span>
                  </label>
                )}

                {s.clave === "hoja" && (
                  <label className="grid gap-1 sm:max-w-[24rem]">
                    <span className="lbl text-[.5625rem]">
                      Qué rollo se enseña
                    </span>
                    <select
                      value={hoja ?? ""}
                      disabled={enCurso}
                      onChange={(e) => {
                        const elegido = e.target.value || null;
                        setHoja(elegido);
                        correr(
                          () => fijarHojaDelMes(elegido),
                          elegido
                            ? "Guardado. Es la hoja que sale en la portada."
                            : "Guardado. Sale el último rollo publicado.",
                        );
                      }}
                    >
                      <option value="">El último publicado</option>
                      {rollos.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.codigo} · {r.cuando} · {r.cuantas} fotogramas
                        </option>
                      ))}
                    </select>
                    <span className="font-mono text-[.625rem] tracking-[.04em] text-apagado">
                      Esto se guarda solo, sin darle al botón.
                    </span>
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="btn btn-p"
            disabled={enCurso || sobra}
            onClick={() =>
              correr(
                () => guardarSeccionesDePortada(lista),
                apagadas === 0
                  ? "Guardado. La portada las enseña todas."
                  : `Guardado. ${apagadas} ${apagadas === 1 ? "sección apagada" : "secciones apagadas"}.`,
              )
            }
          >
            {enCurso ? "Guardando…" : "Guardar la portada"}
          </button>
        </div>
      </div>
    </>
  );
}
