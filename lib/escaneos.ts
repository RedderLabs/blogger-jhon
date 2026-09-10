import { createHash } from "node:crypto";

import sharp from "sharp";

import { PREFIJO_ORIGINALES, PREFIJO_WEB, guardar } from "@/lib/almacen";
import { TIPOS_ACEPTADOS } from "@/lib/fotos";
import { aSlug } from "@/lib/texto";

/** Lo que sharp sabe leer, con el nombre que usan las rutas. */
export const ACEPTADOS = TIPOS_ACEPTADOS;

/** Tope del archivo que guarda la web. El original se conserva aparte. */
export const LADO_MAYOR_WEB = 2400;

export type CopiaGuardada = {
  /** La dirección con la que se sirve: /foto/… */
  archivo: string;
  ancho: number;
  alto: number;
  /** La clave del escaneo sin tocar, o null si no merecía guardarse. */
  archivoOriginal: string | null;
  /** El MD5 de la copia web: es lo que empareja las repetidas en la galería. */
  hash: string;
};

/**
 * De un escaneo a las dos copias que guarda el sitio: la del original, para
 * poder rehacer la web sin volver a pasar el negativo por el escáner, y la
 * web, un JPEG de 2400 px de lado mayor.
 *
 * Vive aquí porque lo usan dos rutas: la de subir un rollo entero y la de
 * subir una foto suelta desde la portada. Es la parte que no puede
 * separarse entre las dos sin que una acabe guardando copias distintas.
 */
export async function procesarEscaneo({
  bytes,
  tipo,
  nombreOriginal,
  carpeta,
  orden,
}: {
  bytes: Buffer;
  tipo: string;
  nombreOriginal: string;
  carpeta: string;
  orden: number;
}): Promise<CopiaGuardada> {
  const base = aSlug(nombreOriginal.replace(/\.[^.]+$/, "")) || `fotograma-${orden}`;
  const nombre = `${String(orden).padStart(3, "0")}-${base}`;

  const meta = await sharp(bytes).metadata();
  const anchoOriginal = meta.width ?? 0;
  const altoOriginal = meta.height ?? 0;
  if (!anchoOriginal || !altoOriginal) throw new Error("sin dimensiones");

  // El original sólo se conserva si aporta algo: un JPEG ya pequeño no merece
  // duplicarse.
  const necesitaOriginal =
    tipo !== "image/jpeg" || Math.max(anchoOriginal, altoOriginal) > LADO_MAYOR_WEB;

  let archivoOriginal: string | null = null;
  if (necesitaOriginal) {
    const ext = nombreOriginal.match(/\.[^.]+$/)?.[0] ?? "";
    // Bajo `originales/`, que /foto no sirve: está para rehacer la copia web,
    // no para verlo.
    archivoOriginal = `${PREFIJO_ORIGINALES}${carpeta}/${nombre}${ext}`;
    await guardar(archivoOriginal, bytes, tipo);
  }

  const web = sharp(bytes).rotate(); // respeta la orientación EXIF
  if (Math.max(anchoOriginal, altoOriginal) > LADO_MAYOR_WEB) {
    web.resize({
      width: anchoOriginal >= altoOriginal ? LADO_MAYOR_WEB : undefined,
      height: altoOriginal > anchoOriginal ? LADO_MAYOR_WEB : undefined,
      withoutEnlargement: true,
    });
  }

  const salida = await web
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  await guardar(`${PREFIJO_WEB}${carpeta}/${nombre}.jpg`, salida.data, "image/jpeg");

  return {
    archivo: `/foto/${carpeta}/${nombre}.jpg`,
    ancho: salida.info.width,
    alto: salida.info.height,
    archivoOriginal,
    // La misma huella que devuelve el cubo en el ETag, calculada aquí para no
    // tener que ir a preguntarla luego. Con esto una fotografía repetida se ve
    // en la galería desde el momento en que entra.
    hash: createHash("md5").update(salida.data).digest("hex"),
  };
}
