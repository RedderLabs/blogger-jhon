import { XMLParser } from "fast-xml-parser";

/**
 * Lectura del XML que da Blogger en Configuración → Administrar el blog →
 * Copia de seguridad del contenido. Es un Atom con las entradas, las páginas,
 * las plantillas y los comentarios mezclados; aquí sólo interesan las entradas.
 */

export type EntradaBlogger = {
  /** id estable dentro del export, para poder marcar y desmarcar */
  ref: string;
  titulo: string;
  fecha: string | null;
  /** La dirección antigua, para la redirección 301 */
  urlAntigua: string | null;
  /** Texto plano, ya sin etiquetas */
  texto: string;
  /** El HTML tal cual, para quien necesite el orden de las fotos */
  html: string;
  /** Las direcciones de las fotos que llevaba dentro */
  fotos: string[];
  etiquetas: string[];
  palabras: number;
};

type Enlace = { "@_rel"?: string; "@_href"?: string; "@_type"?: string };
type Categoria = { "@_scheme"?: string; "@_term"?: string };

function comoLista<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

/** Deja el HTML en texto legible, conservando los saltos de párrafo. */
export function aTextoPlano(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function fotosDe(html: string) {
  const urls = new Set<string>();
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) urls.add(m[1]);
  // Blogger envuelve cada foto en un enlace a la versión grande: esa es la buena.
  for (const m of html.matchAll(
    /href=["'](https?:\/\/[^"']*(?:blogspot|bp\.blogspot|googleusercontent)[^"']*\.(?:jpe?g|png|gif|webp))["']/gi,
  )) {
    urls.add(m[1]);
  }
  return [...urls];
}

type EntradaCruda = Record<string, unknown>;

function parsear(xml: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
  });
  return parser.parse(xml);
}

/** El mapeo de una entrada de Atom, igual venga del export o del feed. */
function mapear(e: EntradaCruda): EntradaBlogger {
  const categorias = comoLista<Categoria>(e.category as Categoria | Categoria[]);

  const contenidoBruto =
    (e.content as { "#text"?: unknown })?.["#text"] ?? e.content ?? "";
  const html = typeof contenidoBruto === "string" ? contenidoBruto : "";

  const tituloBruto = (e.title as { "#text"?: unknown })?.["#text"] ?? e.title ?? "";
  const titulo =
    (typeof tituloBruto === "string" ? tituloBruto : "").trim() || "(sin título)";

  const enlaces = comoLista<Enlace>(e.link as Enlace | Enlace[]);
  const alterno = enlaces.find((l) => l["@_rel"] === "alternate")?.["@_href"] ?? null;

  const texto = aTextoPlano(html);

  return {
    ref: String(e.id ?? alterno ?? titulo),
    titulo,
    fecha: typeof e.published === "string" ? e.published : null,
    urlAntigua: alterno ? new URL(alterno).pathname : null,
    texto,
    html,
    fotos: fotosDe(html),
    etiquetas: categorias
      .filter((c) => String(c["@_scheme"] ?? "").includes("#kind") === false)
      .map((c) => String(c["@_term"] ?? ""))
      .filter(Boolean),
    palabras: texto.split(/\s+/).filter(Boolean).length,
  };
}

function porFechaDescendente(a: EntradaBlogger, b: EntradaBlogger) {
  return (b.fecha ?? "").localeCompare(a.fecha ?? "");
}

export function leerExportDeBlogger(xml: string): EntradaBlogger[] {
  const doc = parsear(xml);
  const salida: EntradaBlogger[] = [];

  for (const e of comoLista<EntradaCruda>(doc?.feed?.entry)) {
    const categorias = comoLista<Categoria>(e.category as Categoria | Categoria[]);
    const tipo = categorias.find((c) =>
      String(c["@_scheme"] ?? "").includes("#kind"),
    )?.["@_term"];

    // Sólo las entradas: fuera plantillas, ajustes, páginas y comentarios.
    if (!tipo || !String(tipo).endsWith("#post")) continue;

    // Los borradores de Blogger llevan una marca de control.
    const esBorrador = comoLista<Record<string, unknown>>(
      e["app:control"] as Record<string, unknown> | Record<string, unknown>[] | undefined,
    ).some((c) => String(c?.["app:draft"] ?? "") === "yes");
    if (esBorrador) continue;

    salida.push(mapear(e));
  }

  return salida.sort(porFechaDescendente);
}

/**
 * El otro camino: el feed público del blog (`/feeds/posts/default`), que se
 * puede pedir sin entrar en la cuenta.
 *
 * No trae las categorías `#kind` del export, así que aquí no se filtra por
 * tipo: el feed sólo publica entradas y sólo las publicadas. A cambio sirve
 * el contenido entero, que es lo que hace falta.
 */
export function leerFeedDeBlogger(xml: string): EntradaBlogger[] {
  const doc = parsear(xml);
  return comoLista<EntradaCruda>(doc?.feed?.entry).map(mapear).sort(porFechaDescendente);
}

export type TrozoDeEntrada =
  | { tipo: "texto"; texto: string }
  | { tipo: "foto"; url: string };

/**
 * La entrada troceada en el orden en que estaba escrita: los párrafos y las
 * fotos intercalados donde iban. `aTextoPlano` sola pierde esa colocación, y
 * en un blog de fotografía la colocación es la mitad del sentido.
 */
export function trocearEntrada(html: string): TrozoDeEntrada[] {
  const trozos: TrozoDeEntrada[] = [];
  let desde = 0;

  const meterTexto = (bruto: string) => {
    const texto = aTextoPlano(bruto);
    if (texto) trozos.push({ tipo: "texto", texto });
  };

  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
    meterTexto(html.slice(desde, m.index));
    trozos.push({ tipo: "foto", url: m[1] });
    desde = (m.index ?? 0) + m[0].length;
  }
  meterTexto(html.slice(desde));

  return trozos;
}

/**
 * Blogger sirve la foto al tamaño que se insertó (`/s320/`, `/w640-h480/`,
 * `=s400`). Cambiando esa marca por `s0` contesta con el original entero, que
 * es lo que hay que guardar: la copia de la web se hace aquí, no allí.
 */
export function aTamanoOriginal(url: string) {
  return url
    .replace(/\/(?:s|w)\d+(?:-h\d+)?(?:-[a-z-]+)?\//i, "/s0/")
    .replace(/=(?:s|w)\d+(?:-h\d+)?(?:-[a-z-]+)?$/i, "=s0");
}
