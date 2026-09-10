"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { IconoCerrar } from "@/components/Iconos";
import { CLAVE_AVISO, type Aviso } from "@/lib/aviso";
import { TextoConFormato } from "@/components/sitio/TextoConFormato";

/**
 * Se enseña una sola vez por visitante. Lo que se guarda es la versión del
 * aviso que aceptó; si el texto cambia y sube de versión, vuelve a salir.
 *
 * No usa cookies: `localStorage` sólo se escribe cuando el visitante pulsa el
 * botón, así que es una preferencia suya y no necesita banner de consentimiento.
 */
export function AvisoImportante({ aviso }: { aviso: Aviso }) {
  const [visible, setVisible] = useState(false);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let guardado: string | null = null;
    try {
      guardado = window.localStorage.getItem(CLAVE_AVISO);
    } catch {
      // Navegación privada o almacenamiento bloqueado: se enseña igual, y si
      // no se puede recordar, se volverá a ver. Mejor eso que no verlo nunca.
    }
    if (guardado !== aviso.version) setVisible(true);
  }, [aviso.version]);

  const cerrar = useCallback(() => {
    try {
      window.localStorage.setItem(CLAVE_AVISO, aviso.version);
    } catch {
      /* si no se puede guardar, no pasa nada */
    }
    setVisible(false);
  }, [aviso.version]);

  useEffect(() => {
    if (!visible) return;

    cerrarRef.current?.focus();
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function alPulsar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        cerrar();
        return;
      }
      // El foco no se escapa del aviso mientras está abierto.
      if (e.key === "Tab" && panelRef.current) {
        const focos = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focos.length === 0) return;
        const primero = focos[0];
        const ultimo = focos[focos.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    }

    window.addEventListener("keydown", alPulsar);
    return () => {
      window.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = antes;
    };
  }, [visible, cerrar]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgb(8_7_6/.82)] p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="aviso-titulo"
        className="scroll-fino flex max-h-[92vh] w-full max-w-[68ch] flex-col overflow-y-auto border-t border-filo bg-cuarto sm:max-h-[86vh] sm:border"
      >
        <div className="flex items-start justify-between gap-4 border-b border-filo px-5 py-4 sm:px-8 sm:py-6">
          <h2
            id="aviso-titulo"
            className="font-serif text-[1.6rem] leading-none font-bold tracking-[.06em] uppercase sm:text-[2.1rem]"
          >
            {aviso.titulo}
          </h2>
          <button
            ref={cerrarRef}
            type="button"
            onClick={cerrar}
            aria-label="Cerrar el aviso"
            className="shrink-0 border border-filo p-2 text-dato hover:border-rojo hover:text-papel"
          >
            <IconoCerrar tam={15} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-6 sm:px-8">
          <TextoConFormato
            texto={aviso.parrafos.join("\n\n")}
            className="text-[length:var(--texto)] leading-[var(--interlinea)] text-papel-2"
          />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-filo px-5 py-4 sm:px-8">
          <button type="button" className="btn btn-p" onClick={cerrar}>
            {aviso.boton}
          </button>
          <p className="font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-apagado">
            Se guarda en tu navegador para no volver a enseñártelo. No es una cookie
            y no sale de tu equipo.
          </p>
        </div>
      </div>
    </div>
  );
}
