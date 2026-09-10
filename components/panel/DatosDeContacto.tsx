"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarDatosDeContacto } from "@/app/admin/acciones";
import { IconoCerrar, IconoMas } from "@/components/Iconos";
import type { DatosDeContacto as Datos } from "@/lib/datosDeContacto";
import { type CuentaEnRed, REDES, red, textoDeCuenta } from "@/lib/redes";

/** La primera red del catálogo que aún no esté puesta. */
function siguienteLibre(puestas: CuentaEnRed[]) {
  const libre = REDES.find((r) => !puestas.some((c) => c.red === r.clave));
  return libre?.clave ?? "enlace";
}

/**
 * Lo que enseña /contacto además del formulario: el correo y las redes que
 * haya. Va dentro de un `details` porque se toca una vez al año y la bandeja
 * se mira todos los días.
 */
export function DatosDeContacto({ datos }: { datos: Datos }) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [correo, setCorreo] = useState(datos.correo);
  const [redes, setRedes] = useState<CuentaEnRed[]>(datos.redes);

  const cambiar = (i: number, cambio: Partial<CuentaEnRed>) =>
    setRedes((antes) => antes.map((c, j) => (j === i ? { ...c, ...cambio } : c)));

  const quitar = (i: number) => setRedes((antes) => antes.filter((_, j) => j !== i));

  const mover = (i: number, paso: -1 | 1) =>
    setRedes((antes) => {
      const destino = i + paso;
      if (destino < 0 || destino >= antes.length) return antes;
      const copia = [...antes];
      [copia[i], copia[destino]] = [copia[destino], copia[i]];
      return copia;
    });

  function guardar() {
    empezar(async () => {
      const r = await guardarDatosDeContacto(correo, redes);
      if (r?.error) {
        setError(true);
        setMensaje(r.error);
      } else {
        setError(false);
        setMensaje(
          correo.trim() || redes.length > 0
            ? "Guardado. Ya sale en la página de contacto."
            : "Guardado. La página enseña sólo el formulario.",
        );
      }
      router.refresh();
    });
  }

  const resumen = [
    correo || "sin correo público",
    redes.length === 0
      ? "sin redes"
      : redes.map((c) => textoDeCuenta(c)).join(" · "),
  ].join(" · ");

  return (
    <details className="border border-filo">
      <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 font-mono text-[.72rem] tracking-[.08em] text-dato">
        <span className="text-papel">Cómo te encuentran</span>
        <span className="truncate text-apagado">{resumen}</span>
      </summary>

      <div className="grid gap-6 border-t border-filo p-4 sm:p-5">
        <label className="grid max-w-[32rem] gap-2">
          <span className="lbl text-[.5625rem]">Correo público</span>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="hola@ejemplo.com"
            autoComplete="off"
          />
          <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-dato">
            En blanco no se publica. Piensa que queda a la vista de cualquiera,
            robots incluidos.
          </span>
        </label>

        <div className="grid gap-3">
          <p className="lbl text-[.5625rem]">Redes</p>

          {redes.length === 0 && (
            <p className="font-mono text-[.7rem] text-apagado">
              Ninguna todavía. Añade las que uses; las que no, mejor fuera.
            </p>
          )}

          {redes.map((cuenta, i) => {
            const r = red(cuenta.red);
            return (
              <div
                key={i}
                className="grid gap-2 border border-filo p-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
              >
                <select
                  value={cuenta.red}
                  onChange={(e) => cambiar(i, { red: e.target.value })}
                >
                  {REDES.map((opcion) => (
                    <option key={opcion.clave} value={opcion.clave}>
                      {opcion.nombre}
                    </option>
                  ))}
                </select>

                <input
                  value={cuenta.valor}
                  onChange={(e) => cambiar(i, { valor: e.target.value })}
                  placeholder={r?.ejemplo}
                  autoComplete="off"
                  aria-label={
                    r?.forma === "usuario"
                      ? `Usuario de ${r.nombre}`
                      : `Dirección de ${r?.nombre ?? "la red"}`
                  }
                />

                <div className="flex items-center gap-1 justify-self-end">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label="Subir"
                    className="border border-filo px-2 py-[.35rem] font-mono text-[.7rem] text-dato hover:border-filo-2 hover:text-papel disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === redes.length - 1}
                    aria-label="Bajar"
                    className="border border-filo px-2 py-[.35rem] font-mono text-[.7rem] text-dato hover:border-filo-2 hover:text-papel disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => quitar(i)}
                    aria-label={`Quitar ${r?.nombre ?? "la red"}`}
                    className="border border-filo p-[.42rem] text-dato hover:border-rojo hover:text-rojo"
                  >
                    <IconoCerrar tam={13} />
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() =>
              setRedes((antes) => [...antes, { red: siguienteLibre(antes), valor: "" }])
            }
            className="btn flex w-fit items-center gap-2"
          >
            <IconoMas tam={13} />
            Añadir una red
          </button>

          <p className="max-w-[64ch] font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-dato">
            En las de usuario basta con el nombre de la cuenta; si pegas la
            dirección entera del perfil, me quedo con el usuario. Mastodon, el
            blog antiguo y «otra dirección» piden el enlace completo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="btn btn-p" onClick={guardar} disabled={enCurso}>
            {enCurso ? "Guardando…" : "Guardar los datos"}
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
