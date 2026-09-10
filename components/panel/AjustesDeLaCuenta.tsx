"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { guardarCuenta } from "@/app/admin/acciones";

/** Lo mismo que exige el servidor; aquí sólo para no hacerle ir y volver. */
const TOPE_CLAVE = 8;

/**
 * La cuenta con la que se entra al panel: el nombre, el correo y la
 * contraseña.
 *
 * Los tres campos van juntos y detrás de la contraseña actual a propósito. Lo
 * que se está tapando es la sesión olvidada abierta en un portátil ajeno: sin
 * pedir la de ahora, quien pase por delante se cambia el correo y se queda con
 * el sitio.
 */
export function AjustesDeLaCuenta({
  nombre,
  correo,
}: {
  nombre: string;
  correo: string;
}) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const [campos, setCampos] = useState({
    nombre,
    correo,
    actual: "",
    nueva: "",
    repetir: "",
  });

  const escribir = (clave: keyof typeof campos, valor: string) =>
    setCampos((antes) => ({ ...antes, [clave]: valor }));

  // Los avisos que se pueden dar antes de molestar al servidor.
  const corta = campos.nueva.length > 0 && campos.nueva.length < TOPE_CLAVE;
  const dispares =
    campos.repetir.length > 0 && campos.nueva !== campos.repetir;
  const puede = campos.actual.length > 0 && !corta && !dispares;

  function guardar() {
    empezar(async () => {
      const forma = new FormData();
      for (const [clave, valor] of Object.entries(campos)) forma.set(clave, valor);

      const r = await guardarCuenta(forma);
      if (r?.error) {
        setError(true);
        setMensaje(r.error);
        return;
      }

      setError(false);
      setMensaje(
        r?.clave
          ? "Guardado. La próxima vez se entra con la contraseña nueva."
          : "Guardado.",
      );
      // Las tres contraseñas se vacían siempre: no se quedan escritas en una
      // pantalla que puede seguir abierta.
      setCampos((antes) => ({ ...antes, actual: "", nueva: "", repetir: "" }));
      router.refresh();
    });
  }

  return (
    <section className="grid gap-5 border border-filo p-4 sm:p-5">
      <div className="grid gap-2">
        <p className="lbl">La cuenta</p>
        <h2 className="font-serif text-[1.4rem] leading-tight font-bold">
          Con qué se entra al panel
        </h2>
        <p className="m-0 max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
          Para cambiar cualquiera de las tres cosas hay que escribir la
          contraseña de ahora. Cambiarla no cierra esta sesión —aquí se sigue
          dentro— pero la vieja deja de valer en cualquier otro sitio.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <label className="grid gap-1">
          <span className="lbl text-[.5625rem]">Nombre</span>
          <input
            value={campos.nombre}
            onChange={(e) => escribir("nombre", e.target.value)}
            autoComplete="name"
          />
          <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
            Sólo se lee aquí dentro. Quien firma la obra se escribe arriba, en
            el sitio.
          </span>
        </label>

        <label className="grid gap-1">
          <span className="lbl text-[.5625rem]">Correo</span>
          <input
            type="email"
            value={campos.correo}
            onChange={(e) => escribir("correo", e.target.value)}
            autoComplete="username"
          />
          <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
            El de entrar, no el de contacto: ese va en Mensajes.
          </span>
        </label>
      </div>

      <div className="grid gap-4 border-t border-filo pt-4 lg:grid-cols-3 lg:items-start">
        <label className="grid gap-1 lg:col-span-3">
          <span className="lbl text-[.5625rem]">Contraseña de ahora</span>
          <input
            type="password"
            value={campos.actual}
            onChange={(e) => escribir("actual", e.target.value)}
            autoComplete="current-password"
            className="lg:max-w-[22rem]"
          />
          <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
            Hace falta aunque sólo cambies el nombre.
          </span>
        </label>

        <label className="grid gap-1">
          <span className="lbl text-[.5625rem]">Contraseña nueva</span>
          <input
            type="password"
            value={campos.nueva}
            onChange={(e) => escribir("nueva", e.target.value)}
            autoComplete="new-password"
          />
          <span
            className={`font-mono text-[.625rem] leading-relaxed tracking-[.04em] ${
              corta ? "text-rojo" : "text-apagado"
            }`}
          >
            {corta
              ? `Al menos ${TOPE_CLAVE} caracteres.`
              : `Déjalas en blanco si no la vas a cambiar. Mínimo ${TOPE_CLAVE} caracteres.`}
          </span>
        </label>

        <label className="grid gap-1">
          <span className="lbl text-[.5625rem]">Repetirla</span>
          <input
            type="password"
            value={campos.repetir}
            onChange={(e) => escribir("repetir", e.target.value)}
            autoComplete="new-password"
          />
          <span
            className={`font-mono text-[.625rem] leading-relaxed tracking-[.04em] ${
              dispares ? "text-rojo" : "text-apagado"
            }`}
          >
            {dispares ? "No coincide con la de arriba." : "Para no dejarse fuera."}
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="btn btn-p"
          onClick={guardar}
          disabled={enCurso || !puede}
        >
          {enCurso ? "Guardando…" : "Guardar la cuenta"}
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
    </section>
  );
}
