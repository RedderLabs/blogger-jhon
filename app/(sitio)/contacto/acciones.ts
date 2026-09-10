"use server";

import { mensajeRecibido } from "@/lib/contacto";
import { paginaDeContacto } from "@/lib/paginaContactoDelSitio";
import { prisma } from "@/lib/prisma";

export type EstadoDelEnvio =
  | { estado: "inicial" }
  | { estado: "error"; aviso: string; campos: Record<string, string> }
  | { estado: "enviado"; nombre: string };

export const ENVIO_INICIAL: EstadoDelEnvio = { estado: "inicial" };

/** Cuántos mensajes admite un mismo correo en una hora. */
const TOPE_POR_HORA = 3;

/**
 * Recibe el formulario de /contacto y lo guarda. No sale ningún correo del
 * servidor: los mensajes se leen en /admin/mensajes.
 *
 * Contra el correo basura, dos medidas sin dependencias ni captcha: un campo
 * señuelo que sólo rellenan los robots y un tope por hora y dirección.
 */
export async function enviarMensaje(
  _previo: EstadoDelEnvio,
  datos: FormData,
): Promise<EstadoDelEnvio> {
  // La página se puede apagar desde el panel. Que no se enseñe no basta: el
  // formulario es una dirección, y una dirección se puede llamar a mano.
  const { visible } = await paginaDeContacto();
  if (!visible) {
    return {
      estado: "error",
      aviso: "El formulario está cerrado ahora mismo. Vuelve a probar más adelante.",
      campos: {},
    };
  }

  const nombre = String(datos.get("nombre") ?? "");

  // El señuelo. Está oculto para quien mira la página, así que si viene
  // relleno no lo ha escrito una persona: se le contesta que sí y se tira.
  if (String(datos.get("web") ?? "").trim() !== "") {
    return { estado: "enviado", nombre: nombre.trim() || "Hola" };
  }

  const leido = mensajeRecibido.safeParse({
    nombre,
    correo: String(datos.get("correo") ?? ""),
    cuerpo: String(datos.get("cuerpo") ?? ""),
  });

  if (!leido.success) {
    const campos: Record<string, string> = {};
    for (const fallo of leido.error.issues) {
      const campo = String(fallo.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = fallo.message;
    }
    return {
      estado: "error",
      aviso: "Falta algo por corregir antes de enviarlo.",
      campos,
    };
  }

  const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000);
  const recientes = await prisma.mensaje.count({
    where: { correo: leido.data.correo, creadoEn: { gte: haceUnaHora } },
  });
  if (recientes >= TOPE_POR_HORA) {
    return {
      estado: "error",
      aviso:
        "Ya me has escrito varias veces en la última hora. Dame un rato para leerlo y te contesto.",
      campos: {},
    };
  }

  await prisma.mensaje.create({ data: leido.data });

  return { estado: "enviado", nombre: leido.data.nombre };
}
