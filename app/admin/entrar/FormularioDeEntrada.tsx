"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type Accion = (previo: string | null, datos: FormData) => Promise<string | null>;

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-p mt-2 w-full" disabled={pending}>
      {pending ? "Abriendo…" : "Entrar"}
    </button>
  );
}

export function FormularioDeEntrada({ accion }: { accion: Accion }) {
  const [error, enviar] = useActionState(accion, null);

  return (
    <form action={enviar} className="mt-8 grid gap-4">
      <label className="grid gap-2">
        <span className="lbl text-[.5625rem]">Correo</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          defaultValue="jhon@photojhon.com"
        />
      </label>

      <label className="grid gap-2">
        <span className="lbl text-[.5625rem]">Contraseña</span>
        <input type="password" name="password" autoComplete="current-password" required />
      </label>

      {error && (
        <p
          role="alert"
          className="border border-rojo bg-[rgb(217_80_58/.1)] px-3 py-2 font-mono text-[.7rem] tracking-[.04em] text-papel"
        >
          {error}
        </p>
      )}

      <Boton />
    </form>
  );
}
