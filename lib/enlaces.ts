/**
 * Lo que queda del atajo de enlaces cuando el formato de los textos del panel
 * pasó a vivir en `lib/formato.ts` y `lib/bloques.ts`.
 *
 * Aquí se quedan dos cosas que siguen haciendo falta:
 *
 *  · `RUTAS`, la lista de páginas del sitio, que el panel enseña como
 *    sugerencia al escribir un enlace. Ya no es una frontera —se puede
 *    enlazar a cualquier dirección del sitio y a una casa por https—, sino la
 *    chuleta de las direcciones que uno no se sabe de memoria.
 *  · `sinMarcas`, que deja el texto pelado para la descripción de la página:
 *    lo que leen los buscadores y las redes no lleva asteriscos.
 */

import { enParrafos } from "@/lib/texto";

/** Las páginas fijas del sitio, para sugerirlas al escribir un enlace. */
export const RUTAS = [
  "/",
  "/entradas",
  "/archivo",
  "/sobre-mi",
  "/aviso",
  "/buscar",
  "/cookies",
  "/privacidad",
  "/terminos",
] as const;

export type RutaDelSitio = (typeof RUTAS)[number];

/** Una línea en blanco separa párrafos; el resto de saltos no cuentan. */
export const parrafos = enParrafos;

/**
 * El texto pelado: sin marcas de formato y sin las de bloque.
 *
 * Es lo que va en la descripción de la página y en las tarjetas de las redes,
 * donde un `**` no significa nada y se lee como lo que es, un error.
 */
export function sinMarcas(texto: string): string {
  return (
    texto
      // Los enlaces se quedan con lo que se lee, no con el destino.
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
      // Negrita, cursiva, subrayado, tachado y monoespaciado.
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/~~([^~]+)~~/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*([^*\n]+)\*/g, "$1")
      // Las marcas de principio de línea: rótulos, listas, citas y colocación.
      .replace(/^\s*(#{1,6}\s+|[-]\s+|\d+[.)]\s+|>\s*)/gm, "")
      .replace(/\[(centro|derecha|justificado|izquierda)\]\s*/gi, "")
      // Una raya de separación no dice nada en una descripción.
      .replace(/^\s*-{3,}\s*$/gm, "")
      .trim()
  );
}
