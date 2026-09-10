/**
 * Los vídeos de YouTube dentro de una entrada.
 *
 * Se ponen escribiendo, no con un botón: se pega en el texto la dirección
 * —`https://youtu.be/OU8mkKhATjA`— o el trozo de `<iframe>` que da YouTube al
 * pulsar «Compartir», y eso se convierte en el vídeo. Es como lo hacía el
 * blog de siempre, y es lo que uno tiene en el portapapeles cuando llega aquí.
 *
 * Lo que se guarda NO es el `<iframe>` que se pegó. Es un hueco —`<figure
 * data-video="ID">`—, igual que con las fotografías del archivo, y por la
 * misma razón: un `<iframe>` guardado tal cual trae los permisos, la política
 * de referencia y la dirección con que venía, y a partir de ahí es la base de
 * datos la que decide qué carga el navegador de la gente. Con el hueco lo
 * decide `components/sitio/VideoDeYoutube.tsx`, en un sitio, y se cambia una
 * vez para todas las entradas ya escritas.
 *
 * Nada de esto deja pasar un `<iframe>` por el saneado: `lib/cuerpo.ts` sigue
 * sin admitirlo, y lo que no sea un vídeo de YouTube reconocible se cae.
 */

/**
 * El identificador de un vídeo dentro de cualquiera de las direcciones que
 * reparte YouTube: la corta, la de siempre, la de incrustar, los cortos y las
 * emisiones. Once caracteres, que es lo que mide.
 */
const DIRECCION =
  /(?:youtu\.be\/|(?:youtube|youtube-nocookie)\.com\/(?:watch\?(?:[^"'\s<>]*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/i;

/** Una dirección de YouTube y nada más: ni texto delante ni detrás. */
const SOLO_DIRECCION =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtu\.be|youtube\.com|youtube-nocookie\.com)\/\S+$/i;

/** Lo que se guarda en `data-video`. Se comprueba también al pintar. */
export const esIdDeYoutube = (id: string) => /^[A-Za-z0-9_-]{11}$/.test(id);

/** El identificador del vídeo que haya en un texto, o null si no hay ninguno. */
export function idDeYoutube(texto: string): string | null {
  return texto.match(DIRECCION)?.[1] ?? null;
}

/** El hueco que se guarda en el cuerpo. */
export const huecoDeVideo = (id: string) => `<figure data-video="${id}"></figure>`;

/** La dirección para ver el vídeo en su casa, que es la que se enseña debajo. */
export const enYoutube = (id: string) => `https://youtu.be/${id}`;

/**
 * La dirección que carga el reproductor.
 *
 * `youtube-nocookie.com` y no `youtube.com`: en ese dominio Google no escribe
 * nada en el navegador de quien pasa por la página hasta que le da al play.
 * Este sitio cuenta las visitas sin cookies y lo dice en /privacidad; abrir
 * una entrada no debería contradecirlo por llevar un vídeo dentro.
 */
export const paraIncrustar = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}`;

const IFRAME = /<iframe\b[^>]*>(?:[\s\S]*?<\/iframe>)?/gi;
const PARRAFO = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;

/** Sin etiquetas y con las entidades deshechas, para poder leer la dirección. */
const soloTexto = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Los vídeos que haya pegados, ya convertidos en su hueco.
 *
 * Tres formas de que llegue uno, que son las tres que se dan al escribir:
 *
 *  1. El `<iframe>` de «Compartir → Insertar», pegado tal cual.
 *  2. Un párrafo que es sólo la dirección —pegada a secas, o ya convertida en
 *     enlace por el editor—.
 *  3. La dirección sola, sin etiquetas: lo que llega al pegar en el editor
 *     antes de que este la envuelva en nada.
 *
 * Una dirección **dentro** de una frase se queda como está: ahí es un enlace
 * que alguien escribió a propósito, y convertirla en un reproductor de
 * quinientos píxeles en mitad del párrafo no es lo que se pedía.
 */
export function conVideos(html: string): string {
  // Un iframe que no sea un vídeo de YouTube se cae aquí en vez de más
  // adelante: el saneado tampoco lo dejaría pasar, y así no queda a medias.
  let salida = html.replace(IFRAME, (entera) => {
    const id = idDeYoutube(entera);
    return id ? huecoDeVideo(id) : "";
  });

  salida = salida.replace(PARRAFO, (entera, dentro: string) => {
    const texto = soloTexto(dentro);
    if (!SOLO_DIRECCION.test(texto)) return entera;
    const id = idDeYoutube(texto);
    return id ? huecoDeVideo(id) : entera;
  });

  const entero = soloTexto(salida);
  if (SOLO_DIRECCION.test(entero)) {
    const id = idDeYoutube(entero);
    if (id) return huecoDeVideo(id);
  }

  return salida;
}
