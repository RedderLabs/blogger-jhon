"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarTextoDeSobreMi, volverAlTextoDeFabrica } from "@/app/admin/acciones";
import { IconoCerrar, IconoMas } from "@/components/Iconos";
import { type SobreMi, SOBRE_MI, TOPES_TEXTO } from "@/lib/sobreMi";
import { enParrafos } from "@/lib/texto";
import { SOLO_EN_LINEA } from "@/components/panel/BarraDeFormato";
import { CajaConFormato } from "@/components/panel/CajaConFormato";

/** Una sección mientras se edita: los párrafos, en una sola caja. */
type EnEdicion = { titulo: string; texto: string };

const aEdicion = (texto: SobreMi): EnEdicion[] =>
  texto.secciones.map((s) => ({ titulo: s.titulo, texto: s.parrafos.join("\n\n") }));

/**
 * El texto de /sobre-mi: título, entradilla y las secciones que haga falta.
 *
 * Las secciones se añaden, se quitan y se mueven. Es la parte de la página que
 * de verdad es de quien firma —quién es, cómo trabaja, qué le importa— y
 * estaba escrita dentro del código: cambiar una coma obligaba a un despliegue.
 *
 * Los párrafos de una sección se escriben en una sola caja y se separan con
 * una línea en blanco. Es lo mismo que se hace al escribir en cualquier sitio,
 * y evita el baile de cajitas de un párrafo cada una.
 */
export function EditorDeSobreMi({
  texto,
  propio,
}: {
  texto: SobreMi;
  /** false = la página sigue con el texto de fábrica. */
  propio: boolean;
}) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [hayPropio, setHayPropio] = useState(propio);
  const [titulo, setTitulo] = useState(texto.titulo);
  const [entradilla, setEntradilla] = useState(texto.entradilla);
  const [secciones, setSecciones] = useState<EnEdicion[]>(() => aEdicion(texto));

  const cambiar = (i: number, cambio: Partial<EnEdicion>) =>
    setSecciones((antes) => antes.map((s, j) => (j === i ? { ...s, ...cambio } : s)));

  const quitar = (i: number) =>
    setSecciones((antes) => antes.filter((_, j) => j !== i));

  const mover = (i: number, paso: -1 | 1) =>
    setSecciones((antes) => {
      const destino = i + paso;
      if (destino < 0 || destino >= antes.length) return antes;
      const copia = [...antes];
      [copia[i], copia[destino]] = [copia[destino], copia[i]];
      return copia;
    });

  const largoTitulo = titulo.trim().length;
  const largoEntradilla = entradilla.trim().length;
  const sobra =
    largoTitulo > TOPES_TEXTO.titulo ||
    largoEntradilla > TOPES_TEXTO.entradilla ||
    secciones.length > TOPES_TEXTO.secciones ||
    secciones.some(
      (s) =>
        s.titulo.trim().length > TOPES_TEXTO.tituloSeccion ||
        s.texto.trim().length > TOPES_TEXTO.parrafos,
    );

  function guardar() {
    empezar(async () => {
      const r = await guardarTextoDeSobreMi({
        titulo,
        entradilla,
        secciones: secciones.map((s) => ({
          titulo: s.titulo,
          parrafos: enParrafos(s.texto),
        })),
      });

      if (r?.error) {
        setError(true);
        setMensaje(r.error);
      } else {
        setError(false);
        setHayPropio(true);
        setMensaje(
          r?.secciones === 0
            ? "Guardado. La página va sin secciones: título, entradilla y la ficha del archivo."
            : `Guardado. ${r?.secciones} ${r?.secciones === 1 ? "sección" : "secciones"} en la página.`,
        );
      }
      router.refresh();
    });
  }

  function deFabrica() {
    empezar(async () => {
      await volverAlTextoDeFabrica();

      // El formulario se rellena otra vez a mano: `router.refresh()` vuelve a
      // pintar la página, pero lo que hay escrito en las cajas es estado de
      // este componente y no se enteraría.
      setTitulo(SOBRE_MI.titulo);
      setEntradilla(SOBRE_MI.entradilla);
      setSecciones(aEdicion(SOBRE_MI));

      setHayPropio(false);
      setError(false);
      setMensaje("Vuelto al texto de fábrica.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6 border-b border-filo p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <p className="lbl">El texto</p>
        <h1 className="font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]">
          Lo que se lee en sobre mí
        </h1>
        <p className="max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
          El título, las dos líneas de debajo y las secciones. Las cifras
          —series, fotogramas, rollos— y la ficha de equipo no se escriben:
          salen contadas del archivo y se ponen al día solas.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <label className="grid gap-2">
          <span className="lbl text-[.5625rem]">Título</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            autoComplete="off"
          />
          <span
            className={`font-mono text-[.625rem] tracking-[.04em] ${
              largoTitulo > TOPES_TEXTO.titulo ? "text-rojo" : "text-dato"
            }`}
          >
            {largoTitulo} de {TOPES_TEXTO.titulo} caracteres
          </span>
        </label>

        <label className="grid gap-2">
          <span className="lbl text-[.5625rem]">Entradilla</span>
          <CajaConFormato
            rows={3}
            valor={entradilla}
            alCambiar={setEntradilla}
            grupos={SOLO_EN_LINEA}
            className="leading-relaxed"
          />
          <span
            className={`font-mono text-[.625rem] tracking-[.04em] ${
              largoEntradilla > TOPES_TEXTO.entradilla ? "text-rojo" : "text-dato"
            }`}
          >
            {largoEntradilla} de {TOPES_TEXTO.entradilla} caracteres
          </span>
        </label>
      </div>

      <div className="grid gap-4">
        <p className="lbl text-[.5625rem]">
          Secciones · {secciones.length} de {TOPES_TEXTO.secciones}
        </p>

        {secciones.length === 0 && (
          <p className="font-mono text-[.7rem] leading-relaxed text-apagado">
            Ninguna. La página saldrá con el título, la entradilla y la ficha
            del archivo, que no es poco.
          </p>
        )}

        {secciones.map((s, i) => {
          const largo = s.texto.trim().length;
          return (
            <div key={i} className="grid gap-3 border border-filo p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[.66rem] tracking-[.08em] text-apagado">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  value={s.titulo}
                  onChange={(e) => cambiar(i, { titulo: e.target.value })}
                  placeholder="Título de la sección"
                  aria-label={`Título de la sección ${i + 1}`}
                  autoComplete="off"
                  className="min-w-[12rem] flex-1"
                />
                <div className="flex items-center gap-1">
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
                    disabled={i === secciones.length - 1}
                    aria-label="Bajar la sección"
                    className="border border-filo px-2 py-[.35rem] font-mono text-[.7rem] text-dato hover:border-filo-2 hover:text-papel disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => quitar(i)}
                    aria-label={`Quitar la sección ${s.titulo || i + 1}`}
                    className="border border-filo p-[.42rem] text-dato hover:border-rojo hover:text-rojo"
                  >
                    <IconoCerrar tam={13} />
                  </button>
                </div>
              </div>

              <label className="grid gap-2">
                <span className="sr-only">Texto de la sección {i + 1}</span>
                <CajaConFormato
                  rows={6}
                  valor={s.texto}
                  alCambiar={(v) => cambiar(i, { texto: v })}
                  placeholder="El texto de la sección. Una línea en blanco empieza un párrafo nuevo."
                  className="leading-relaxed"
                />
                <span
                  className={`font-mono text-[.625rem] tracking-[.04em] ${
                    largo > TOPES_TEXTO.parrafos ? "text-rojo" : "text-dato"
                  }`}
                >
                  {enParrafos(s.texto).length}{" "}
                  {enParrafos(s.texto).length === 1 ? "párrafo" : "párrafos"} ·{" "}
                  {largo} de {TOPES_TEXTO.parrafos} caracteres
                </span>
              </label>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setSecciones((antes) => [...antes, { titulo: "", texto: "" }])}
          disabled={secciones.length >= TOPES_TEXTO.secciones}
          className="btn flex w-fit items-center gap-2 disabled:opacity-40"
        >
          <IconoMas tam={13} />
          Añadir una sección
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn btn-p"
          onClick={guardar}
          disabled={enCurso || sobra}
        >
          {enCurso ? "Guardando…" : "Guardar el texto"}
        </button>
        {hayPropio && (
          <button
            type="button"
            className="btn text-dato hover:text-rojo"
            onClick={deFabrica}
            disabled={enCurso}
          >
            Volver al texto de fábrica
          </button>
        )}
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
  );
}
