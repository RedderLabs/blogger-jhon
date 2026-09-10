"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarUmami } from "@/app/admin/acciones";
import { type Umami, falloDelPanel } from "@/lib/umami";

/**
 * Las visitas, dentro del cuarto oscuro. Los números los pinta el propio
 * Umami en un marco: no se copian ni se guardan aquí, así que no puede haber
 * dos versiones de la misma cifra discrepando.
 *
 * El formulario va plegado porque se toca dos veces en la vida —al montar
 * Umami y al mudarse de dominio— y los números se miran a diario.
 */
export function PanelDeVisitas({ umami }: { umami: Umami }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [script, setScript] = useState(umami.script);
  const [id, setId] = useState(umami.id);
  const [panel, setPanel] = useState(umami.panel);

  const midiendo = Boolean(umami.script && umami.id);
  const avisoDelPanel = falloDelPanel(panel);

  function enviar(datos: FormData) {
    empezar(async () => {
      const r = await guardarUmami(datos);
      if (r?.error) {
        setError(true);
        setMensaje(r.error);
      } else {
        setError(false);
        setMensaje(
          r?.midiendo
            ? "Guardado. El sitio ya está contando visitas."
            : "Guardado. Sin script ni identificador no se cuenta nada, que también es una decisión.",
        );
      }
      router.refresh();
    });
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">Visitas</span>
        </p>
        <span
          className="font-mono text-[.66rem] tracking-[.1em] uppercase"
          style={{ color: midiendo ? "var(--color-verde)" : "var(--color-apagado)" }}
        >
          {midiendo ? "· contando" : "· apagado"}
        </span>
        {umami.panel && (
          <a
            href={umami.panel}
            target="_blank"
            rel="noreferrer"
            className="ml-auto font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
          >
            Abrir aparte ↗
          </a>
        )}
      </header>

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

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        {umami.panel ? (
          // El marco ocupa lo que queda de pantalla: son gráficas, y una
          // gráfica dentro de un hueco de 300 px no se lee.
          <iframe
            src={umami.panel}
            title="Visitas del sitio"
            className="min-h-[calc(100vh-14rem)] w-full flex-1 border border-filo bg-cuarto"
            loading="lazy"
            // Sólo tiene que pintar: ni formularios, ni ventanas, ni permisos.
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="grid max-w-[62ch] gap-3 border border-filo p-6">
            <p className="lbl">Todavía no</p>
            <h1 className="font-serif text-[1.5rem] leading-tight font-bold">
              Aquí van a salir las visitas
            </h1>
            <p className="text-[.9375rem] leading-relaxed text-dato">
              Cuánta gente entra, por qué páginas pasa y de dónde viene —de una
              búsqueda, de un enlace, de Instagram—. Sin cookies y sin saber
              quiénes son: Umami cuenta visitas, no personas.
            </p>
            <p className="text-[.9375rem] leading-relaxed text-dato">
              Rellena los tres campos de abajo y esta misma página los enseñará.
            </p>
          </div>
        )}

        <details className="border border-filo" open={!umami.panel}>
          <summary className="cursor-pointer px-5 py-3 font-mono text-[.72rem] tracking-[.08em] text-dato hover:text-papel">
            Cómo se conecta
          </summary>

          <form action={enviar} className="grid gap-5 border-t border-filo p-5">
            <p className="max-w-[64ch] text-[.9375rem] leading-relaxed text-dato">
              Los tres datos salen del propio Umami. Cuando lo mudes de sitio —del
              dominio de Render al tuyo— se cambian aquí y ya está: no hay que
              volver a desplegar nada.
            </p>

            <label className="grid gap-2">
              <span className="lbl text-[.5625rem]">Dirección del script</span>
              <input
                name="script"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="https://tu-umami.onrender.com/script.js"
                inputMode="url"
              />
              <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
                La dirección de tu Umami con <b>/script.js</b> al final. Es el
                fichero que el sitio carga en cada visita.
              </span>
            </label>

            <label className="grid gap-2">
              <span className="lbl text-[.5625rem]">Identificador del sitio</span>
              <input
                name="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
              />
              <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
                En Umami: <b>Settings → Websites</b>, tu sitio, <b>Edit</b>. Es el
                «Website ID».
              </span>
            </label>

            <label className="grid gap-2">
              <span className="lbl text-[.5625rem]">
                Enlace para ver los números aquí
              </span>
              <input
                name="panel"
                value={panel}
                onChange={(e) => setPanel(e.target.value)}
                placeholder="https://tu-umami.onrender.com/share/xxxxxxxx/photo-jhon"
                inputMode="url"
              />
              <span
                className={`font-mono text-[.625rem] leading-relaxed tracking-[.04em] ${
                  avisoDelPanel ? "text-rojo" : "text-apagado"
                }`}
              >
                {avisoDelPanel ??
                  "En Umami: tu sitio → Edit → activa «Enable share URL» y copia la que sale. Es de sólo lectura, y es la única que se deja ver dentro de otra página."}
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="btn btn-p"
                disabled={enCurso || Boolean(avisoDelPanel)}
              >
                {enCurso ? "Guardando…" : "Guardar"}
              </button>
              <Link
                href="/aviso"
                target="_blank"
                className="font-mono text-[.66rem] tracking-[.04em] text-apagado hover:text-papel"
              >
                Qué se le cuenta al visitante ↗
              </Link>
            </div>
          </form>
        </details>
      </div>
    </>
  );
}
