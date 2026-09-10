import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * El almacén de los escaneos: un cubo privado de Backblaze B2, hablado por su
 * API compatible con S3.
 *
 * Privado a propósito. Las copias no salen nunca con una dirección de
 * Backblaze: las sirve el propio sitio por /foto/… (ver
 * `app/foto/[...clave]/route.ts`), que es lo único que permite decidir qué se
 * deja pasar y qué no —y lo que hace que el aviso de la portada signifique
 * algo—. Los originales viven bajo `originales/` y esa ruta no los sirve:
 * están para poder rehacer una copia, no para descargarlos.
 */

/** Prefijo de lo que sirve la web. Lo que no empiece por aquí no se sirve. */
export const PREFIJO_WEB = "web/";

/** Prefijo de los escaneos sin tocar. Nunca se sirven. */
export const PREFIJO_ORIGINALES = "originales/";

function ajustes() {
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  // Todo o nada: con la mitad de las variables se abriría un cliente que
  // falla en la primera foto, y el fallo saldría lejos de la causa.
  if (!bucket || !endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Falta configurar Backblaze: S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY y S3_SECRET_KEY (mira .env.example)",
    );
  }

  return { bucket, endpoint, region, accessKeyId, secretAccessKey };
}

/** Si falta cualquier variable, `false`: sirve para avisar sin reventar. */
export function hayAlmacen() {
  try {
    ajustes();
    return true;
  } catch {
    return false;
  }
}

let cliente: S3Client | null = null;

function s3() {
  if (cliente) return cliente;
  const { endpoint, region, accessKeyId, secretAccessKey } = ajustes();
  cliente = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    // B2 no admite el estilo de dirección por subdominio de cubo.
    forcePathStyle: true,
  });
  return cliente;
}

export function cubo() {
  return ajustes().bucket;
}

export async function guardar(clave: string, cuerpo: Buffer, tipo: string) {
  await s3().send(
    new PutObjectCommand({
      Bucket: cubo(),
      Key: clave,
      Body: cuerpo,
      ContentType: tipo,
      ContentLength: cuerpo.byteLength,
    }),
  );
}

/** Lo que devuelve B2 para servirlo tal cual, sin pasarlo por memoria. */
export async function traer(clave: string) {
  const r = await s3().send(new GetObjectCommand({ Bucket: cubo(), Key: clave }));
  return {
    cuerpo: r.Body as ReadableStream | null,
    tipo: r.ContentType ?? "application/octet-stream",
    tamano: r.ContentLength,
    etag: r.ETag,
  };
}

/** El tamaño guardado, o null si no está. Se usa para comprobar la subida. */
export async function medir(clave: string) {
  try {
    const r = await s3().send(new HeadObjectCommand({ Bucket: cubo(), Key: clave }));
    return r.ContentLength ?? null;
  } catch {
    return null;
  }
}

/**
 * La huella del fichero guardado, para saber si dos fotografías son la misma.
 *
 * No hace falta descargar nada: el cubo devuelve en el `ETag` el MD5 de lo que
 * se subió, y aquí se sube de una pieza —`PutObject`—, así que ese MD5 es el
 * del fichero entero. Si algún día llega un objeto subido por partes, su ETag
 * lleva un `-` detrás y entonces no vale como huella: se devuelve null y esa
 * foto se queda sin comparar, que es mejor que compararla con una huella que
 * no lo es.
 */
export async function huella(clave: string): Promise<string | null> {
  try {
    const r = await s3().send(new HeadObjectCommand({ Bucket: cubo(), Key: clave }));
    const etag = (r.ETag ?? "").replace(/"/g, "");
    return /^[0-9a-f]{32}$/i.test(etag) ? etag.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** El fichero entero en memoria. Sólo para calcular su huella visual. */
export async function traerBytes(clave: string): Promise<Buffer | null> {
  try {
    const r = await s3().send(new GetObjectCommand({ Bucket: cubo(), Key: clave }));
    const bytes = await r.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch {
    return null;
  }
}

export async function borrar(clave: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: cubo(), Key: clave }));
}

/**
 * De la dirección que guarda la ficha (`/foto/serie/001.jpg`) a la clave del
 * cubo (`web/serie/001.jpg`). Devuelve null a lo que se salga de ahí: un
 * `..` en la ruta, o el intento de colarse en `originales/`.
 */
export function claveDeRuta(ruta: string): string | null {
  const limpia = ruta.replace(/^\/foto\//, "").replace(/^\/+/, "");
  if (!limpia || limpia.includes("..") || limpia.startsWith(PREFIJO_ORIGINALES)) {
    return null;
  }
  return PREFIJO_WEB + limpia;
}

/** Al revés: de la clave del cubo a lo que se guarda en `Foto.archivo`. */
export function rutaDeClave(clave: string) {
  return "/foto/" + clave.replace(new RegExp("^" + PREFIJO_WEB), "");
}
