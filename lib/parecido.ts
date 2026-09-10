import sharp from "sharp";

/**
 * Cuándo dos fotografías son «la misma» aunque el fichero no lo sea.
 *
 * El traslado del blog dejó la misma imagen guardada varias veces, cada una
 * comprimida a su manera: el MD5 del fichero no las empareja —son ficheros
 * distintos de verdad—, pero se ven idénticas. Esto compara lo que se ve.
 *
 * El método es el de siempre para esto, y se explica en una línea: se reduce
 * la imagen a 9×8 píxeles en gris y se anota, para cada fila, si un píxel es
 * más claro que el de su derecha. Son 64 síes o noes, 64 bits, dieciséis
 * caracteres. Recomprimir, reescalar o cambiar el formato mueven poquísimos de
 * esos bits; una fotografía distinta mueve muchos.
 *
 * No es infalible y no pretende serlo: dos fotogramas seguidos del mismo rollo
 * —el mismo encuadre con un paso de diferencia— pueden salir parecidos. Por
 * eso la galería enseña las dos y deja elegir; no borra nada por su cuenta.
 */

/** Ancho y alto de la reducción: 9 columnas para poder comparar 8 parejas. */
const ANCHO = 9;
const ALTO = 8;

/** La huella de lo que se ve, en dieciséis caracteres. */
export async function huellaVisual(bytes: Buffer): Promise<string> {
  const gris = await sharp(bytes)
    .greyscale()
    .resize(ANCHO, ALTO, { fit: "fill" })
    .raw()
    .toBuffer();

  let bits = "";
  for (let fila = 0; fila < ALTO; fila++) {
    for (let col = 0; col < ANCHO - 1; col++) {
      const aqui = gris[fila * ANCHO + col];
      const derecha = gris[fila * ANCHO + col + 1];
      bits += aqui > derecha ? "1" : "0";
    }
  }

  // De 64 bits a hexadecimal, de cuatro en cuatro.
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

const UNOS = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];

/**
 * Cuántos de los 64 bits difieren. 0 es «lo que se ve es idéntico»; a partir
 * de 12 ó 15 ya son dos fotografías distintas.
 */
export function distancia(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let cuenta = 0;
  for (let i = 0; i < a.length; i++) {
    cuenta += UNOS[parseInt(a[i], 16) ^ parseInt(b[i], 16)];
  }
  return cuenta;
}

/**
 * Hasta dónde se considera la misma fotografía. Cinco bits de sesenta y
 * cuatro: tolera la recompresión y el reescalado, y deja fuera dos tomas
 * parecidas del mismo sitio.
 */
export const TOPE_PARECIDO = 5;
