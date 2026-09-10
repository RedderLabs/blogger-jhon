/**
 * El pie del sitio: la frase que acompaña al nombre bajo la línea, en todas
 * las páginas que llevan `<Pie />`. Aquí sólo están los datos —sin base y sin
 * caché— para que el editor del panel pueda importarlos desde el navegador;
 * la lectura vive en `lib/pieDelSitio.ts`.
 */

export const CLAVE_PIE = "sitio.pie";

/** Tope de lo que se acepta desde el panel: el pie es una nota, no un texto. */
export const TOPE_NOTA_PIE = 240;

/**
 * Lo que sale mientras no se haya escrito nada en el panel. No se guarda en la
 * base: así el sitio nunca se queda con el pie en blanco.
 */
export const NOTA_POR_DEFECTO =
  "El archivo es la memoria del sitio, no su portada. Si vienes a ver el trabajo, empieza por las series.";
