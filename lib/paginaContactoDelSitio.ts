import { enCache } from "@/lib/cache";
import {
  CLAVE_CONTACTO,
  CONTACTO_POR_DEFECTO,
  type PaginaDeContacto,
  TEXTOS_POR_DEFECTO,
} from "@/lib/paginaContacto";
import { prisma } from "@/lib/prisma";

/**
 * Si /contacto se enseña y con qué texto. Todo en una fila de `Ajuste`, en
 * JSON, porque se lee siempre junto: la navegación necesita saber si la
 * página existe y la página necesita sus textos.
 *
 * Un campo en blanco vuelve al de fábrica en vez de dejar el hueco vacío, y
 * un JSON roto —editado a mano en la base, por ejemplo— devuelve la página
 * entera de fábrica en lugar de tumbar el sitio: esto lo pide el layout en
 * cada visita.
 */
async function consultarPagina(): Promise<PaginaDeContacto> {
  const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_CONTACTO } });
  if (!fila?.valor) return { ...CONTACTO_POR_DEFECTO };

  try {
    const leido = JSON.parse(fila.valor) as Partial<PaginaDeContacto>;
    const campo = (clave: keyof typeof TEXTOS_POR_DEFECTO) => {
      const valor = typeof leido[clave] === "string" ? leido[clave].trim() : "";
      return valor || TEXTOS_POR_DEFECTO[clave];
    };

    return {
      visible: leido.visible !== false,
      titulo: campo("titulo"),
      entradilla: campo("entradilla"),
      antesTitulo: campo("antesTitulo"),
      antes: campo("antes"),
      datosTitulo: campo("datosTitulo"),
      datos: campo("datos"),
    };
  } catch {
    return { ...CONTACTO_POR_DEFECTO };
  }
}

/** La pide el layout en cada página, así que va por la caché; el panel la tira al guardar. */
export function paginaDeContacto(): Promise<PaginaDeContacto> {
  return enCache("sitio:pagina-contacto", 300, consultarPagina);
}

/**
 * Lo que hay escrito de verdad, sin sustituir nada por lo de fábrica: el panel
 * necesita distinguir «no se ha tocado» de «se ha escrito justo eso», y no
 * pasa por caché porque se lee una vez al abrir el formulario.
 */
export async function contactoGuardado(): Promise<Partial<PaginaDeContacto>> {
  const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_CONTACTO } });
  if (!fila?.valor) return { visible: true };

  try {
    const leido = JSON.parse(fila.valor) as Partial<PaginaDeContacto>;
    return { ...leido, visible: leido.visible !== false };
  } catch {
    return { visible: true };
  }
}
