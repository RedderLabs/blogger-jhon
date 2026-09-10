"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarLegal, legalDeFabricaOtraVez } from "@/app/admin/acciones";
import { IconoCerrar, IconoMas } from "@/components/Iconos";
import { RUTAS } from "@/lib/enlaces";
import { SOLO_EN_LINEA } from "@/components/panel/BarraDeFormato";
import { CajaConFormato } from "@/components/panel/CajaConFormato";
import {
  type ClaveLegal,
  deFabrica,
  enCatalogo,
  type LegalCompleta,
  type SeccionLegal,
  TOPES,
} from "@/lib/legales";

/**
 * Una de las tres páginas de letra pequeña.
 *
 * Va dentro de un `details` porque son tres en la misma pantalla y cada una
 * arrastra ocho secciones de texto largo: abiertas a la vez no se encontraría
 * nada. La cerrada dice lo justo para saber cuál es y si está encendida.
 *
 * Las secciones se añaden, se quitan y se mueven, igual que en sobre mí. Aquí
 * importa más que allí: la ley cambia, y quien tenga que meter un párrafo
 * nuevo sobre algo que hoy no existe tiene que poder hacerlo sin llamar a
 * nadie.
 *
 * Lo que se deja igual que el texto de fábrica no se guarda —lo hace la
 * acción, no este formulario—, así que una corrección futura del original
 * llega a las páginas que no se hayan tocado.
 */
export function EditorDeUnaLegal({
  clave,
  datos,
}: {
  clave: ClaveLegal;
  /** Lo que se lee ahora mismo en la página, sea propio o de fábrica. */
  datos: LegalCompleta;
}) {
  const router = useRouter();
  const ficha = enCatalogo(clave);

  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [visible, setVisible] = useState(datos.visible);
  const [titulo, setTitulo] = useState(datos.titulo);
  const [entradilla, setEntradilla] = useState(datos.entradilla);
  const [secciones, setSecciones] = useState<SeccionLegal[]>(() =>
    datos.secciones.map((s) => ({ ...s })),
  );

  const cambiar = (i: number, cambio: Partial<SeccionLegal>) =>
    setSecciones((antes) => antes.map((s, j) => (j === i ? { ...s, ...cambio } : s)));

  const quitar = (i: number) => setSecciones((antes) => antes.filter((_, j) => j !== i));

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
    largoTitulo > TOPES.titulo ||
    largoEntradilla > TOPES.entradilla ||
    secciones.length > TOPES.secciones ||
    secciones.some(
      (s) =>
        s.titulo.trim().length > TOPES.tituloSeccion ||
        s.texto.trim().length > TOPES.texto,
    );

  function guardar() {
    empezar(async () => {
      const r = await guardarLegal(clave, { visible, titulo, entradilla, secciones });

      if (r?.error) {
        setError(true);
        setMensaje(r.error);
      } else {
        setError(false);
        setMensaje(
          r?.visible
            ? `Guardada, y se ve en ${ficha?.ruta}. ${r.secciones} ${
                r.secciones === 1 ? "punto" : "puntos"
              }.`
            : `Guardada y apagada: ${ficha?.ruta} contesta «no encontrada» y se cae del pie y del mapa del sitio.`,
        );
      }
      router.refresh();
    });
  }

  function alDeFabrica() {
    empezar(async () => {
      const r = await legalDeFabricaOtraVez(clave);
      if (r?.error) {
        setError(true);
        setMensaje(r.error);
        return;
      }

      // Las cajas son estado de este componente: `router.refresh()` vuelve a
      // pintar la página pero no se enteraría de lo que hay escrito aquí.
      const f = deFabrica(clave);
      setVisible(true);
      setTitulo(f.titulo);
      setEntradilla(f.entradilla);
      setSecciones(f.secciones);

      setError(false);
      setMensaje("Vuelta al texto de fábrica, y encendida.");
      router.refresh();
    });
  }

  if (!ficha) return null;

  return (
    <details
      className="border"
      style={
        visible
          ? { borderColor: "var(--color-filo)" }
          : { borderColor: "var(--color-rojo)", background: "rgb(217 80 58 / .06)" }
      }
    >
      <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 font-mono text-[.72rem] tracking-[.08em] text-dato">
        <span className="text-papel">{ficha.nombre}</span>
        <span className="text-apagado">{ficha.ruta}</span>
        <span className={`ml-auto ${visible ? "text-apagado" : "text-rojo"}`}>
          {visible ? `${secciones.length} puntos` : "apagada"}
        </span>
      </summary>

      <div className="grid gap-6 border-t border-filo p-4 sm:p-5">
        <p className="m-0 max-w-[72ch] text-[.9375rem] leading-relaxed text-dato">
          {ficha.que}
        </p>

        {/* --- El interruptor ---------------------------------------------- */}
        <div className="grid gap-2 border border-filo p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="lbl m-0 text-[.5625rem]">La página</p>
            <span className="ml-auto flex">
              <button
                type="button"
                className="seg"
                data-on={visible ? "si" : undefined}
                aria-pressed={visible}
                disabled={enCurso}
                onClick={() => setVisible(true)}
              >
                Se ve
              </button>
              <button
                type="button"
                className="seg"
                data-on={!visible ? "si" : undefined}
                aria-pressed={!visible}
                disabled={enCurso}
                onClick={() => setVisible(false)}
              >
                Apagada
              </button>
            </span>
          </div>
          <p className="m-0 max-w-[76ch] font-mono text-[.66rem] leading-relaxed tracking-[.02em] text-apagado">
            {visible
              ? "Encendida: sale en la línea del final de todas las páginas —sólo en escritorio, como el pie— y en el mapa del sitio."
              : `Apagada: ${ficha.ruta} contesta «no encontrada» y se cae del pie y del mapa del sitio. ${ficha.alApagarla}`}
          </p>
        </div>

        {/* --- El texto ---------------------------------------------------- */}
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
                largoTitulo > TOPES.titulo ? "text-rojo" : "text-dato"
              }`}
            >
              {largoTitulo} de {TOPES.titulo} caracteres
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
                largoEntradilla > TOPES.entradilla ? "text-rojo" : "text-dato"
              }`}
            >
              {largoEntradilla} de {TOPES.entradilla} caracteres
            </span>
          </label>
        </div>

        {/* --- Los puntos --------------------------------------------------- */}
        <div className="grid gap-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="lbl m-0 text-[.5625rem]">
              Puntos · {secciones.length} de {TOPES.secciones}
            </p>
            <p className="m-0 font-mono text-[.625rem] tracking-[.04em] text-apagado">
              Se numeran solos en la página. Una línea en blanco separa
              párrafos; el formato lo ponen los botones. Las páginas del sitio
              son {RUTAS.join(" ")}, y una dirección https enlaza fuera.
            </p>
          </div>

          {secciones.length === 0 && (
            <p className="m-0 font-mono text-[.7rem] leading-relaxed text-apagado">
              Ninguno. La página saldría con el título y la entradilla y poco
              más, que en una de éstas es quedarse corto.
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
                    placeholder="Título del punto"
                    aria-label={`Título del punto ${i + 1}`}
                    autoComplete="off"
                    className="min-w-[12rem] flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => mover(i, -1)}
                      disabled={i === 0}
                      aria-label="Subir el punto"
                      className="border border-filo px-2 py-[.35rem] font-mono text-[.7rem] text-dato hover:border-filo-2 hover:text-papel disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => mover(i, 1)}
                      disabled={i === secciones.length - 1}
                      aria-label="Bajar el punto"
                      className="border border-filo px-2 py-[.35rem] font-mono text-[.7rem] text-dato hover:border-filo-2 hover:text-papel disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => quitar(i)}
                      aria-label={`Quitar el punto ${s.titulo || i + 1}`}
                      className="border border-filo p-[.42rem] text-dato hover:border-rojo hover:text-rojo"
                    >
                      <IconoCerrar tam={13} />
                    </button>
                  </div>
                </div>

                <label className="grid gap-2">
                  <span className="sr-only">Texto del punto {i + 1}</span>
                  <CajaConFormato
                    rows={7}
                    valor={s.texto}
                    alCambiar={(v) => cambiar(i, { texto: v })}
                    placeholder="El texto del punto. Una línea en blanco empieza un párrafo nuevo."
                    className="leading-relaxed"
                  />
                  <span
                    className={`font-mono text-[.625rem] tracking-[.04em] ${
                      largo > TOPES.texto ? "text-rojo" : "text-dato"
                    }`}
                  >
                    {largo} de {TOPES.texto} caracteres
                  </span>
                </label>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setSecciones((antes) => [...antes, { titulo: "", texto: "" }])}
            disabled={secciones.length >= TOPES.secciones}
            className="btn flex w-fit items-center gap-2 disabled:opacity-40"
          >
            <IconoMas tam={13} />
            Añadir un punto
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="btn btn-p"
            onClick={guardar}
            disabled={enCurso || sobra}
          >
            {enCurso ? "Guardando…" : "Guardar la página"}
          </button>
          <button
            type="button"
            className="btn text-dato hover:text-rojo"
            onClick={alDeFabrica}
            disabled={enCurso}
          >
            Volver al texto de fábrica
          </button>
          {visible && (
            <Link
              href={ficha.ruta}
              target="_blank"
              className="font-mono text-[.66rem] tracking-[.12em] text-dato uppercase hover:text-papel"
            >
              Ver la página ↗
            </Link>
          )}
          {mensaje && (
            <span
              role="status"
              className={`font-mono text-[.66rem] leading-relaxed tracking-[.04em] ${
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
