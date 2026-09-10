import sanitizar from "sanitize-html";

import { type Bloque, CLASE_DE_ALINEACION, leerBloques } from "@/lib/bloques";
import { enTrozos } from "@/lib/formato";
import { conVideos, esIdDeYoutube } from "@/lib/videos";

/**
 * El cuerpo de una entrada, que desde el editor de TinyMCE es HTML.
 *
 * Antes eran bloques —un JSON con `p`, `cita`, `figura`…— y las entradas ya
 * escritas siguen guardadas así. No se convierten en masa: se convierten al
 * abrirlas, y la primera vez que se guardan quedan ya en HTML. Una entrada que
 * nadie toque se sigue leyendo igual de bien, que es lo que importa.
 *
 * Las fotografías del archivo no son un `<img>` cualquiera: van en un
 * `<figure data-foto="ID">`, y al pintar la entrada ese hueco lo ocupa el
 * componente de verdad, con su visor, su pie enlazado a la serie y su ficha
 * técnica. Por eso el editor las mete con un botón propio y no con el de
 * imágenes de TinyMCE.
 *
 * Los vídeos de YouTube van igual —`<figure data-video="ID">`—: se pegan en el
 * texto como dirección o como el `<iframe>` de «Compartir», y `lib/videos.ts`
 * los deja en su hueco antes de sanear. Aquí no entra un `<iframe>` nunca.
 */

/** ¿Lo guardado son los bloques de antes o el HTML de ahora? */
export const sonBloques = (cuerpo: string) => cuerpo.trimStart().startsWith("[");

/**
 * Lo que se le permite al HTML guardado.
 *
 * Se sanea al guardar y no al pintar: lo que hay en la base es exactamente lo
 * que se va a servir, sin sorpresas, y una etiqueta rara no se queda esperando
 * a que alguien cambie el saneado.
 */
const PERMITIDO: sanitizar.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "code",
    "pre",
    "blockquote",
    "cite",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "hr",
    "a",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "span",
    "div",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    figure: ["data-foto", "data-video", "data-pie", "class"],
    "*": ["style"],
  },
  // Sólo la colocación: nada de colores ni de tamaños escritos a mano, que es
  // lo que convierte un sitio con criterio en un documento de Word.
  allowedStyles: {
    "*": { "text-align": [/^(left|center|right|justify)$/] },
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    // Un enlace a otra casa se abre aparte y sin dejarle tocar esta página.
    a: (nombre, atributos) => {
      const href = atributos.href ?? "";
      const fuera = /^https?:\/\//i.test(href);
      return {
        tagName: nombre,
        attribs: fuera
          ? { ...atributos, target: "_blank", rel: "noopener noreferrer" }
          : { ...atributos },
      };
    },
  },
};

/**
 * Los vídeos se convierten aquí dentro y no en quien llama: el `<iframe>` que
 * se pegó tiene que hacerse hueco ANTES de sanear, porque el saneado no admite
 * esa etiqueta y se lo llevaría por delante. Metido en el propio saneado, no
 * hay forma de guardar un cuerpo saltándose el paso.
 */
export function sanearCuerpo(html: string): string {
  return sanitizar(conVideos(html), PERMITIDO).trim();
}

/**
 * Quitadas las etiquetas, `sanitize-html` devuelve el texto con las entidades
 * todavía escritas —«B&amp;W»—. Eso vale para pegarlo dentro de HTML, pero lo
 * que sale de aquí se pinta como texto: hay que deshacerlas o se lee el
 * «&amp;» tal cual. El ampersand va el último, o desharía las demás dos veces.
 */
const sinEntidades = (t: string) =>
  t
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

/**
 * Quitar las etiquetas y quedarse con lo escrito.
 *
 * `sinFiguras` tira además el contenido de los `<figure>`. Un pie de foto es
 * un rótulo de la imagen, no el texto de la entrada: dejarlo dentro hacía que
 * el resumen de una entrada de sólo fotografías fuese el mismo pie repetido
 * cuatro veces. Para contar palabras sí cuenta, que ahí es texto escrito.
 */
function pelar(html: string, sinFiguras = false): string {
  const limpio = sanitizar(html, {
    allowedTags: [],
    allowedAttributes: {},
    ...(sinFiguras
      ? { nonTextTags: ["figure", "style", "script", "textarea", "option"] }
      : {}),
  });
  return sinEntidades(limpio).replace(/\s+/g, " ").trim();
}

/** El texto pelado, para contar palabras y para la descripción de la página. */
export function textoDelCuerpo(html: string): string {
  return pelar(html);
}

/** Cuántos caracteres se enseñan de una entrada allí donde se resume. */
export const TOPE_RESUMEN = 160;

/**
 * La descripción breve de una entrada, sacada de lo que se escribió.
 *
 * Se escribía a mano en una «entradilla» aparte, y era repetir el principio
 * del texto en otra caja: la misma frase dos veces, una encima de la otra.
 * Ahora sale del cuerpo, que es donde ya está dicho.
 *
 * Siempre la misma medida, y ahí está el porqué del tope: en el índice las
 * tarjetas van una al lado de otra, y un resumen de dos líneas junto a otro
 * de seis se lee como un descuido y no como una diferencia.
 *
 * Se corta por la última palabra entera que quepa —nunca a mitad de palabra—
 * y los puntos suspensivos sólo se ponen si de verdad se ha dejado algo
 * fuera. Un texto corto sale entero y sin ellos.
 */
export function resumenDelCuerpo(cuerpo: string, tope = TOPE_RESUMEN): string {
  const texto = pelar(sonBloques(cuerpo) ? bloquesAHtml(cuerpo) : cuerpo, true);
  if (texto.length <= tope) return texto;

  const corte = texto.slice(0, tope);
  const espacio = corte.lastIndexOf(" ");
  // Si la última palabra fuese kilométrica, más vale cortarla que devolver un
  // resumen de tres palabras. De ahí el suelo del 60 %.
  const entero = espacio > tope * 0.6 ? corte.slice(0, espacio) : corte;
  return `${entero.replace(/[\s,;:.—-]+$/, "")}…`;
}

const escapar = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Una línea con sus marcas de siempre, ya en HTML. */
function lineaAHtml(texto: string): string {
  return enTrozos(texto)
    .map((t) => {
      let dentro = escapar(t.texto);
      if (t.codigo) dentro = `<code>${dentro}</code>`;
      if (t.fuerte) dentro = `<strong>${dentro}</strong>`;
      if (t.enfasis) dentro = `<em>${dentro}</em>`;
      if (t.subrayado) dentro = `<u>${dentro}</u>`;
      if (t.tachado) dentro = `<s>${dentro}</s>`;
      if (t.href) {
        const fuera = t.fuera ? ' target="_blank" rel="noopener noreferrer"' : "";
        dentro = `<a href="${escapar(t.href)}"${fuera}>${dentro}</a>`;
      }
      return dentro;
    })
    .join("");
}

/** El estilo de colocación de un bloque, si lo llevaba. */
const colocacion = (b: Bloque) =>
  "alinear" in b && b.alinear && b.alinear !== "izquierda"
    ? ` style="text-align:${CLASE_DE_ALINEACION[b.alinear].replace("text-", "")}"`
    : "";

/**
 * De los bloques de antes al HTML de ahora. Se usa al abrir en el editor una
 * entrada que se escribió con el sistema anterior.
 */
export function bloquesAHtml(json: string): string {
  const bloques = leerBloques(json);

  return bloques
    .map((b) => {
      const donde = colocacion(b);

      if (b.tipo === "separador") return "<hr>";
      if (b.tipo === "titulo") {
        const n = b.nivel ?? 2;
        return `<h${n}${donde}>${lineaAHtml(b.texto)}</h${n}>`;
      }
      if (b.tipo === "lista") {
        const etiqueta = b.numerada ? "ol" : "ul";
        const puntos = b.puntos.map((p) => `<li>${lineaAHtml(p)}</li>`).join("");
        return `<${etiqueta}${donde}>${puntos}</${etiqueta}>`;
      }
      if (b.tipo === "cita") {
        const firma = b.firma ? `<cite>${escapar(b.firma)}</cite>` : "";
        return `<blockquote${donde}><p>${lineaAHtml(b.texto)}</p>${firma}</blockquote>`;
      }
      if (b.tipo === "figura") {
        const pie = b.pie ? ` data-pie="${escapar(b.pie)}"` : "";
        return `<figure data-foto="${escapar(b.fotoId)}"${pie}></figure>`;
      }
      return `<p${donde}>${lineaAHtml(b.texto)}</p>`;
    })
    .join("\n");
}

/** Un trozo del cuerpo ya listo para pintar: HTML, una fotografía o un vídeo. */
export type Trozo =
  | { tipo: "html"; html: string }
  | { tipo: "foto"; fotoId: string; pie?: string }
  | { tipo: "video"; videoId: string };

const HUECO = /<figure[^>]*\sdata-(foto|video)="([^"]+)"[^>]*>[\s\S]*?<\/figure>/gi;
const PIE = /\sdata-pie="([^"]*)"/i;

/**
 * Parte el cuerpo por sus huecos, para que la página pueda pintar el HTML tal
 * cual y poner en su sitio el componente de verdad: la fotografía con su visor
 * y su ficha, o el reproductor del vídeo.
 *
 * Los dos se buscan a la vez y no en dos pasadas, que es lo que conserva el
 * orden en que se escribieron.
 */
export function trozosDelCuerpo(html: string): Trozo[] {
  const trozos: Trozo[] = [];
  let desde = 0;

  for (const m of html.matchAll(HUECO)) {
    const i = m.index ?? 0;
    // Lo que queda entre dos huecos suele ser un salto de linea y nada
    // más: eso no es un trozo, es el hueco entre dos.
    const entre = html.slice(desde, i);
    if (i > desde && entre.trim()) trozos.push({ tipo: "html", html: entre });

    if (m[1].toLowerCase() === "video") {
      // Un identificador que no lo sea no se pinta: sería pedirle a YouTube
      // una dirección inventada y enseñar su error dentro de la entrada.
      if (esIdDeYoutube(m[2])) trozos.push({ tipo: "video", videoId: m[2] });
    } else {
      const pie = m[0].match(PIE)?.[1];
      trozos.push({ tipo: "foto", fotoId: m[2], ...(pie ? { pie } : {}) });
    }
    desde = i + m[0].length;
  }

  const final = html.slice(desde);
  if (desde < html.length && final.trim()) {
    trozos.push({ tipo: "html", html: final });
  }
  return trozos;
}

/** Los identificadores de las fotografías que lleva dentro, en orden. */
export function fotosDelCuerpo(html: string): string[] {
  return trozosDelCuerpo(html).flatMap((t) => (t.tipo === "foto" ? [t.fotoId] : []));
}

/**
 * Quita del cuerpo la fotografía que se va a borrar.
 *
 * Sirve para los dos formatos: el HTML de ahora —donde es un `<figure>`— y los
 * bloques de antes, donde es un objeto dentro del JSON. Un cuerpo que se queda
 * nombrando una fotografía que ya no está pinta un hueco con un aviso, y eso
 * lo ve el visitante.
 */
export function quitarFotoDelCuerpo(cuerpo: string, fotoId: string): string {
  if (!cuerpo.includes(fotoId)) return cuerpo;

  if (sonBloques(cuerpo)) {
    const bloques = leerBloques(cuerpo).filter(
      (b) => !(b.tipo === "figura" && b.fotoId === fotoId),
    );
    return JSON.stringify(bloques);
  }

  // Los identificadores son alfanuméricos —los pone Prisma—, así que no
  // hay nada que escapar al meterlos en la expresión.
  const suya = new RegExp(
    '<figure[^>]*\\sdata-foto="' + fotoId + '"[^>]*>[\\s\\S]*?<\\/figure>',
    "gi",
  );
  return cuerpo.replace(suya, "").trim();
}
