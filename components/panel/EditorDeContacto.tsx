"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarPaginaDeContacto } from "@/app/admin/acciones";
import { RUTAS } from "@/lib/enlaces";
import { CajaConFormato } from "@/components/panel/CajaConFormato";
import {
  type PaginaDeContacto,
  TEXTOS_POR_DEFECTO,
  TOPES,
} from "@/lib/paginaContacto";

type Campo = keyof typeof TEXTOS_POR_DEFECTO;

/** El orden en que se leen en la página, que es el orden en que se editan. */
const CAMPOS: { clave: Campo; etiqueta: string; filas: number; ayuda?: string }[] = [
  { clave: "titulo", etiqueta: "Título", filas: 1 },
  {
    clave: "entradilla",
    etiqueta: "Entradilla",
    filas: 3,
    ayuda: "Las dos líneas que se leen bajo el título.",
  },
  { clave: "antesTitulo", etiqueta: "Segundo bloque · título", filas: 1 },
  {
    clave: "antes",
    etiqueta: "Segundo bloque · texto",
    filas: 6,
    ayuda: "Una línea en blanco separa párrafos.",
  },
  { clave: "datosTitulo", etiqueta: "Tercer bloque · título", filas: 1 },
  {
    clave: "datos",
    etiqueta: "Tercer bloque · texto",
    filas: 6,
    ayuda: "Lo que se promete aquí es lo que hace el sitio: cámbialo con cuidado.",
  },
];

/**
 * La página de /contacto: si se enseña y qué pone.
 *
 * Va en la bandeja, junto al correo y las redes, porque es lo mismo —cómo se
 * llega a ti— y porque apagar la página se decide mirando los mensajes, no en
 * otra pantalla. Dentro de un `details`, como lo de al lado: se toca de tarde
 * en tarde y la bandeja se mira todos los días.
 *
 * Cada campo en blanco vuelve al texto de fábrica: no hay forma de dejar la
 * página con un título vacío.
 */
export function EditorDeContacto({ datos }: { datos: Partial<PaginaDeContacto> }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [visible, setVisible] = useState(datos.visible !== false);
  const [textos, setTextos] = useState<Record<Campo, string>>(() => ({
    titulo: datos.titulo ?? "",
    entradilla: datos.entradilla ?? "",
    antesTitulo: datos.antesTitulo ?? "",
    antes: datos.antes ?? "",
    datosTitulo: datos.datosTitulo ?? "",
    datos: datos.datos ?? "",
  }));

  const escribir = (clave: Campo, valor: string) =>
    setTextos((antes) => ({ ...antes, [clave]: valor }));

  const sobra = CAMPOS.some((c) => textos[c.clave].trim().length > TOPES[c.clave]);

  function guardar() {
    empezar(async () => {
      const forma = new FormData();
      forma.set("visible", visible ? "si" : "no");
      for (const c of CAMPOS) forma.set(c.clave, textos[c.clave]);

      const r = await guardarPaginaDeContacto(forma);
      if (r?.error) {
        setError(true);
        setMensaje(r.error);
      } else {
        setError(false);
        setMensaje(
          visible
            ? "Guardado. La página está abierta."
            : "Guardado. La página ya no existe: contesta 404 y sale de la navegación.",
        );
      }
      router.refresh();
    });
  }

  return (
    <details className="border border-filo">
      <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 font-mono text-[.72rem] tracking-[.08em] text-dato">
        <span className="text-papel">La página de contacto</span>
        <span className={visible ? "text-apagado" : "text-rojo"}>
          {visible ? "abierta · texto editable" : "apagada · nadie puede escribir"}
        </span>
      </summary>

      <div className="grid gap-6 border-t border-filo p-4 sm:p-5">
        <div className="grid gap-2">
          <p className="lbl text-[.5625rem]">Se enseña</p>
          <div className="flex w-fit">
            <button
              type="button"
              className="seg"
              data-on={visible ? "si" : undefined}
              aria-pressed={visible}
              onClick={() => setVisible(true)}
            >
              Abierta
            </button>
            <button
              type="button"
              className="seg"
              data-on={!visible ? "si" : undefined}
              aria-pressed={!visible}
              onClick={() => setVisible(false)}
            >
              Apagada
            </button>
          </div>
          <p className="max-w-[64ch] font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-dato">
            Apagada, /contacto contesta 404 y desaparece de la cabecera, de la
            barra de abajo, del pie y del mapa del sitio; el formulario tampoco
            admite envíos aunque alguien guarde la dirección. Los mensajes que
            ya hay siguen aquí, y el correo y las redes que tengas puestos
            arriba dejan de verse con ella.
          </p>
        </div>

        <div className="grid gap-5">
          <p className="lbl text-[.5625rem]">El texto</p>

          {CAMPOS.map((c) => {
            const valor = textos[c.clave];
            const largo = valor.trim().length;
            const pasa = largo - TOPES[c.clave];
            return (
              <label key={c.clave} className="grid gap-2">
                <span className="lbl text-[.5625rem]">{c.etiqueta}</span>
                {c.filas === 1 ? (
                  <input
                    value={valor}
                    onChange={(e) => escribir(c.clave, e.target.value)}
                    placeholder={TEXTOS_POR_DEFECTO[c.clave]}
                    autoComplete="off"
                  />
                ) : (
                  <CajaConFormato
                    rows={c.filas}
                    valor={valor}
                    alCambiar={(v) => escribir(c.clave, v)}
                    placeholder={TEXTOS_POR_DEFECTO[c.clave]}
                    className="leading-relaxed"
                  />
                )}
                <span
                  className={`font-mono text-[.625rem] leading-relaxed tracking-[.04em] ${
                    pasa > 0 ? "text-rojo" : "text-dato"
                  }`}
                >
                  {largo} de {TOPES[c.clave]} caracteres
                  {pasa > 0 && ` · sobran ${pasa}`}
                  {c.ayuda && ` · ${c.ayuda}`}
                </span>
              </label>
            );
          })}

          <p className="max-w-[64ch] font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
            En blanco sale el texto de fábrica, el que ves en gris. Los
            botones ponen el formato; a mano es **negrita**, *cursiva* y [lo
            que se lee](/sobre-mi). Las páginas del sitio son{" "}
            {RUTAS.join(" ")}, y una dirección https enlaza fuera.
          </p>
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
