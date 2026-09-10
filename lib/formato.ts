/**
 * El formato dentro de una línea.
 *
 * Se escribe con marcas, no con un editor que guarde HTML:
 *
 *   **negrita**                → una palabra que pesa
 *   *cursiva*                  → un título de libro, una palabra en otro idioma
 *   __subrayado__              → lo que hay que ver antes que el resto
 *   ~~tachado~~                → lo que se dijo y ya no vale
 *   `monoespaciado`            → un dato, una dirección, algo que se copia
 *   [lo que se lee](/ruta)     → enlace a otra página del sitio
 *   [lo que se lee](https://…) → enlace a otra casa, que se abre aparte
 *
 * El panel tiene botones que las ponen —nadie tiene que aprendérselas—, pero
 * lo guardado sigue siendo texto llano. Es a propósito: un cuerpo en HTML se
 * rompe al cambiar de editor y no se puede leer en la base; esto se lee igual
 * en un `textarea` que en una consulta.
 *
 * Las marcas se pueden meter unas dentro de otras —`**una *palabra* así**`—
 * porque el troceado vuelve a entrar en lo que captura. Lo que NO se
 * interpreta se queda como está: un asterisco suelto es un asterisco, y un
 * enlace a `javascript:` es texto, nunca un enlace.
 */

export type Trozo = {
  texto: string;
  fuerte?: boolean;
  enfasis?: boolean;
  subrayado?: boolean;
  tachado?: boolean;
  codigo?: boolean;
  /** Sin poner, es texto suelto. */
  href?: string;
  /** El enlace sale del sitio: se abre aparte y con `rel` de seguridad. */
  fuera?: boolean;
};

/** El orden importa: `**` antes que `*`, o una negrita se leería como dos cursivas. */
const MARCAS =
  /\*\*([^*]+(?:\*(?!\*)[^*]*)*)\*\*|__([^_]+)__|~~([^~]+)~~|`([^`]+)`|\*([^*\n]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Ni `javascript:` ni `data:`: dentro del sitio o a una casa por http(s). */
function destinoValido(destino: string): { href: string; fuera: boolean } | null {
  if (destino.startsWith("/")) return { href: destino, fuera: false };
  if (/^https?:\/\//i.test(destino)) return { href: destino, fuera: true };
  return null;
}

/**
 * Una línea, troceada en texto suelto y texto con formato. `heredado` es lo
 * que traiga puesto de fuera, para que las marcas anidadas se sumen en vez de
 * pisarse.
 */
export function enTrozos(linea: string, heredado: Omit<Trozo, "texto"> = {}): Trozo[] {
  const trozos: Trozo[] = [];
  let desde = 0;

  // Cada llamada estrena su recorrido: la expresión es global y compartida.
  const marcas = new RegExp(MARCAS.source, "g");

  for (const m of linea.matchAll(marcas)) {
    const i = m.index ?? 0;
    if (i > desde) trozos.push({ ...heredado, texto: linea.slice(desde, i) });

    // Dentro de una marca puede haber otras, así que se vuelve a entrar. Lo
    // capturado siempre es más corto que lo de fuera, de modo que esto acaba.
    if (m[1] !== undefined) trozos.push(...enTrozos(m[1], { ...heredado, fuerte: true }));
    else if (m[2] !== undefined)
      trozos.push(...enTrozos(m[2], { ...heredado, subrayado: true }));
    else if (m[3] !== undefined)
      trozos.push(...enTrozos(m[3], { ...heredado, tachado: true }));
    // Lo monoespaciado se queda tal cual: es texto que se copia, y una marca
    // ahí dentro casi siempre es parte de lo que se quería enseñar.
    else if (m[4] !== undefined) trozos.push({ ...heredado, texto: m[4], codigo: true });
    else if (m[5] !== undefined) trozos.push(...enTrozos(m[5], { ...heredado, enfasis: true }));
    else {
      const destino = destinoValido(m[7]);
      // Un destino que no vale se queda como lo escribieron, corchetes
      // incluidos: es más fácil verlo y corregirlo que si desapareciera.
      if (destino)
        trozos.push(
          ...enTrozos(m[6], { ...heredado, href: destino.href, fuera: destino.fuera }),
        );
      else trozos.push({ ...heredado, texto: m[0] });
    }

    desde = i + m[0].length;
  }

  if (desde < linea.length) trozos.push({ ...heredado, texto: linea.slice(desde) });
  return trozos.length > 0 ? trozos : [{ ...heredado, texto: linea }];
}
