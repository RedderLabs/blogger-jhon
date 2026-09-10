import { prisma } from "@/lib/prisma";

/**
 * Las direcciones que ya no existen y adónde van ahora.
 *
 * La tabla la empezó el importador de Blogger —cada entrada traía su dirección
 * antigua— y la alimenta también el panel: al corregir el título de una
 * entrada, su dirección cambia, y la vieja queda apuntando a la nueva.
 *
 * Esto es lo que hace verdad lo que promete la página del archivo: «cada
 * entrada conserva su día y su dirección antigua sigue funcionando». Sin
 * alguien que lea esta tabla, era una fila guardada y nada más.
 *
 * Se consulta sólo cuando algo no se ha encontrado, así que no hay caché: en
 * un sitio que funciona esto casi nunca se llama, y una caché por dirección
 * crecería con cada rastreador que pruebe direcciones inventadas.
 */

/** La dirección de una entrada. En un sitio, para no escribirla de memoria. */
export const rutaDeEntrada = (slug: string) => `/entradas/${slug}`;

/** Sin barra final y con barra inicial, que es como se guardan. */
function normalizar(ruta: string): string {
  const limpia = ruta.trim().split(/[?#]/)[0];
  if (!limpia) return "";
  const conBarra = limpia.startsWith("/") ? limpia : `/${limpia}`;
  return conBarra.length > 1 ? conBarra.replace(/\/+$/, "") : conBarra;
}

/**
 * Adónde va una dirección que ya no existe, o null si no va a ninguna parte.
 *
 * Sólo se sale hacia dentro de casa: una fila con `hacia` apuntando a otro
 * dominio —escrita a mano en la base— convertiría esta tabla en un salto
 * abierto a cualquier sitio, firmado con la dirección de este.
 */
export async function destinoDe(ruta: string): Promise<string | null> {
  const desde = normalizar(ruta);
  if (!desde) return null;

  const fila = await prisma.redireccion.findUnique({ where: { desde } });
  const hacia = fila?.hacia?.trim();
  if (!hacia || !hacia.startsWith("/") || hacia.startsWith("//")) return null;

  // Una fila que apunta a sí misma daría un salto infinito.
  return normalizar(hacia) === desde ? null : hacia;
}

/**
 * Deja constancia de que una entrada se ha mudado de dirección.
 *
 * Tres cosas, y las tres hacen falta:
 *
 *  1. Lo que ya venía a parar a la dirección vieja —una dirección de Blogger,
 *     o un cambio de título anterior— se reapunta a la nueva. Si no, quedaría
 *     una cadena cuyo último salto lleva a una página que ya no existe.
 *  2. Se guarda el salto de la vieja a la nueva.
 *  3. Si la dirección nueva era la vieja de otro cambio —se corrigió el título
 *     y luego se volvió atrás—, esa fila sobra: la entrada vive otra vez ahí.
 *     No estorbaría, porque la tabla sólo se lee cuando no se ha encontrado
 *     nada, pero una tabla con filas que mienten se acaba leyendo mal.
 */
export async function anotarMudanza(slugViejo: string, slugNuevo: string) {
  const desde = rutaDeEntrada(slugViejo);
  const hacia = rutaDeEntrada(slugNuevo);
  if (desde === hacia) return;

  await prisma.redireccion.updateMany({ where: { hacia: desde }, data: { hacia } });
  await prisma.redireccion.upsert({
    where: { desde },
    create: { desde, hacia },
    update: { hacia },
  });
  await prisma.redireccion.deleteMany({ where: { desde: hacia } });
}
