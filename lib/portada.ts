/**
 * Qué se ve en la portada y en qué orden.
 *
 * Aquí sólo están los datos —sin base y sin caché— para que el editor del
 * panel pueda importarlos desde el navegador; la lectura vive en
 * `lib/portadaDelSitio.ts`.
 *
 * Las tres piezas estaban escritas una detrás de otra dentro de la página, así
 * que enseñar la portada sin la hoja de contactos, o poner la lista de series
 * antes que la apertura, era tocar código. Ahora es una fila de `Ajuste`.
 */

export const CLAVE_APERTURA = "portada.apertura";
export const CLAVE_HOJA = "portada.hojaDelMes";
export const CLAVE_SECCIONES = "portada.secciones";

export type ClaveDeSeccion = "apertura" | "hoja" | "series" | "entradas";

export type SeccionDePortada = {
  clave: ClaveDeSeccion;
  visible: boolean;
  /** Vacío = el título de fábrica. La apertura no lleva. */
  titulo?: string;
};

/** Tope del título de una sección: es un rótulo, no una frase. */
export const TOPE_TITULO = 40;

/**
 * De qué va cada pieza, para que el panel no tenga que explicarlo con el
 * nombre de la clave. El orden de aquí es el de fábrica.
 */
export const CATALOGO: {
  clave: ClaveDeSeccion;
  nombre: string;
  que: string;
  /** null = la sección no lleva rótulo propio. */
  tituloPorDefecto: string | null;
}[] = [
  {
    clave: "apertura",
    nombre: "La apertura",
    que: "La fotografía grande de arriba, sola: sin titular, sin frase y sin ficha encima.",
    tituloPorDefecto: null,
  },
  {
    clave: "hoja",
    nombre: "La hoja de contactos",
    que: "El rollo elegido, entero, como una hoja de contactos que se puede pinchar.",
    tituloPorDefecto: "Última hoja",
  },
  {
    clave: "series",
    nombre: "La lista de series",
    que: "Todas las series visibles con sus años y cuántas fotos lleva cada una.",
    tituloPorDefecto: "Series",
  },
  {
    clave: "entradas",
    nombre: "La última entrada",
    que: "El último texto publicado, con la misma fila del archivo: día, miniatura, título y tema.",
    tituloPorDefecto: "Última entrada",
  },
];

export const SECCIONES_POR_DEFECTO: SeccionDePortada[] = CATALOGO.map((s) => ({
  clave: s.clave,
  visible: true,
}));

export const enCatalogo = (clave: string) =>
  CATALOGO.find((s) => s.clave === clave) ?? null;

/**
 * Pone en orden lo que venga de la base: tira lo que no esté en el catálogo
 * —una sección que se quitó del código— y añade al final lo que falte, de modo
 * que una pieza nueva aparezca en la portada en vez de desaparecer sin que
 * nadie se entere.
 */
export function ordenar(guardadas: SeccionDePortada[]): SeccionDePortada[] {
  const limpias = guardadas.filter((s) => enCatalogo(s.clave));
  const faltan = SECCIONES_POR_DEFECTO.filter(
    (s) => !limpias.some((g) => g.clave === s.clave),
  );
  return [...limpias, ...faltan];
}
