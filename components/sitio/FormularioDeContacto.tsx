"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { ENVIO_INICIAL, enviarMensaje } from "@/app/(sitio)/contacto/acciones";

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-p" disabled={pending}>
      {pending ? "Enviando…" : "Enviar el mensaje"}
    </button>
  );
}

function Fallo({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <span role="alert" className="font-mono text-[.66rem] tracking-[.04em] text-rojo">
      {texto}
    </span>
  );
}

/**
 * El formulario de /contacto. No enseña captcha ni pide más datos de los que
 * hacen falta para contestar: nombre, correo y lo que quieras decir.
 */
export function FormularioDeContacto() {
  const [envio, accion] = useActionState(enviarMensaje, ENVIO_INICIAL);

  if (envio.estado === "enviado") {
    return (
      <div className="grid gap-3 border border-verde/40 bg-[rgb(124_148_112/.08)] p-6">
        <p className="lbl text-verde">Mensaje recibido</p>
        <p className="text-[1.0625rem] leading-relaxed">
          Gracias, {envio.nombre}. Lo leo yo, no un contestador automático, así
          que la respuesta tarda lo que tarde en llegarme al cuarto oscuro —
          pero llega.
        </p>
      </div>
    );
  }

  const campos = envio.estado === "error" ? envio.campos : {};

  return (
    <form action={accion} className="grid gap-5">
      {envio.estado === "error" && (
        <p
          role="alert"
          className="border border-rojo/50 bg-[rgb(217_80_58/.08)] px-4 py-3 font-mono text-[.72rem] leading-relaxed tracking-[.04em]"
        >
          {envio.aviso}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="lbl text-[.5625rem]">Tu nombre</span>
          <input name="nombre" required maxLength={120} autoComplete="name" />
          <Fallo texto={campos.nombre} />
        </label>

        <label className="grid gap-2">
          <span className="lbl text-[.5625rem]">Tu correo</span>
          <input
            name="correo"
            type="email"
            required
            maxLength={180}
            autoComplete="email"
            inputMode="email"
          />
          <Fallo texto={campos.correo} />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="lbl text-[.5625rem]">El mensaje</span>
        <textarea name="cuerpo" rows={9} required maxLength={4000} className="leading-relaxed" />
        <Fallo texto={campos.cuerpo} />
      </label>

      {/* El señuelo: invisible y fuera del recorrido del tabulador. Quien lo
          rellena es un robot, y su mensaje se descarta sin guardarse. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          No rellenes esto
          <input name="web" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Boton />
        <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
          Tu correo sólo se usa para contestarte. No hay lista, ni boletín, ni
          se lo paso a nadie.
        </span>
      </div>
    </form>
  );
}
