import { enCache } from "@/lib/cache";
import {
  CLAVE_IDENTIDAD,
  type Identidad,
  IDENTIDAD_POR_DEFECTO,
} from "@/lib/identidad";
import { prisma } from "@/lib/prisma";

/**
 * El nombre, el autor y la descripción del sitio.
 *
 * La pide cada página para sus metadatos, así que va por la caché; el panel la
 * tira al guardar. Un campo en blanco vuelve al de fábrica: un sitio sin
 * nombre no es una opción.
 */
async function consultar(): Promise<Identidad> {
  try {
    const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_IDENTIDAD } });
    if (!fila?.valor) return { ...IDENTIDAD_POR_DEFECTO };

    const leido = JSON.parse(fila.valor) as Partial<Identidad>;
    const campo = (nombre: keyof Identidad) =>
      (typeof leido[nombre] === "string" ? leido[nombre].trim() : "") ||
      IDENTIDAD_POR_DEFECTO[nombre];

    return {
      nombre: campo("nombre"),
      autor: campo("autor"),
      descripcion: campo("descripcion"),
      // El lema sí puede quedarse vacío a propósito: hay quien no quiere
      // coletilla detrás del nombre.
      lema: typeof leido.lema === "string" ? leido.lema.trim() : IDENTIDAD_POR_DEFECTO.lema,
    };
  } catch {
    return { ...IDENTIDAD_POR_DEFECTO };
  }
}

export function identidadDelSitio(): Promise<Identidad> {
  return enCache("sitio:identidad", 300, consultar);
}

/** Sin caché: el panel lee lo que hay en la base al abrir el formulario. */
export function identidadGuardada(): Promise<Identidad> {
  return consultar();
}
