/**
 * Las dos páginas que salen cuando algo no ha ido bien: la dirección que no
 * existe y el fallo del servidor.
 *
 * Aquí sólo están los datos —sin base y sin caché— para que el editor del
 * panel pueda importarlos desde el navegador; la lectura vive en
 * `lib/percancesDelSitio.ts`.
 *
 * Que se puedan escribir no es un capricho de estilo. El 404 es la página que
 * más visita la gente que llega de un enlace viejo del blog, y lo que ahí se
 * diga —por dónde seguir, qué se ha traído de la mudanza— cambia según lo que
 * el propio autor sepa de sus lectores. Eso no puede vivir en el código.
 */

export type ClaveDePercance = "404" | "500";

export const CLAVE_PERCANCE: Record<ClaveDePercance, string> = {
  "404": "sitio.404",
  "500": "sitio.500",
};

export type Percance = {
  /** Lo que se lee a la derecha del número, arriba. */
  rotulo: string;
  titulo: string;
  /** Párrafos separados por una línea en blanco; admite [texto](/ruta). */
  texto: string;
};

/** Lo que acompaña a cada uno y no se escribe: el número es el que es. */
export const CATALOGO: {
  clave: ClaveDePercance;
  codigo: string;
  nombre: string;
  cuando: string;
}[] = [
  {
    clave: "404",
    codigo: "Error 404",
    nombre: "Dirección no encontrada",
    cuando:
      "Sale ante cualquier dirección que no existe, y cuando una página se ha apagado o una serie está oculta.",
  },
  {
    clave: "500",
    codigo: "Error 500",
    nombre: "Fallo del servidor",
    cuando:
      "Sale cuando algo se rompe al montar una página. Lleva además un botón para volver a intentarlo.",
  },
];

export const TOPES = { rotulo: 40, titulo: 60, texto: 900 } as const;

export const POR_DEFECTO: Record<ClaveDePercance, Percance> = {
  "404": {
    rotulo: "Dirección no encontrada",
    titulo: "Aquí no hay ningún fotograma",
    texto: `La dirección a la que has llegado no existe, o dejó de existir. No es cosa tuya: los enlaces se rompen solos con el tiempo.

Si venías con un enlace guardado del blog antiguo, casi todos siguen funcionando: se trajeron con su dirección de siempre. Si este no, [busca por el título](/buscar) o mira el [archivo por fechas](/archivo) — no se ha quedado nada en la mudanza.`,
  },
  "500": {
    rotulo: "Fallo del servidor",
    titulo: "Se ha velado la copia",
    texto: `Algo ha fallado al montar esta página. No es cosa tuya y no se ha perdido nada: el archivo sigue entero donde estaba.

Prueba otra vez. Si vuelve a pasar, sigue por otro lado y vuelve más tarde.`,
  },
};

export const enCatalogo = (clave: string) =>
  CATALOGO.find((p) => p.clave === clave) ?? null;

/** La fotografía que acompaña al texto, si se ha elegido alguna. */
export type ImagenDePercance = {
  archivo: string;
  alt: string;
  ancho: number;
  alto: number;
  anchoMax: number;
};

export type PercanceCompleto = Percance & {
  codigo: string;
  imagen: ImagenDePercance | null;
};
