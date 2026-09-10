/**
 * Cómo se llama el sitio y qué dice de sí mismo.
 *
 * Estaba escrito en `lib/sitio.tsx`, que es lo mismo que decir que cambiar una
 * coma de la descripción obligaba a tocar código y volver a desplegar. Y la
 * descripción es justo lo que se retoca: es lo que lee un buscador y lo que
 * sale al pegar un enlace en cualquier sitio.
 *
 * Aquí sólo están los datos —sin base y sin caché— para que el editor del
 * panel pueda importarlos desde el navegador; la lectura vive en
 * `lib/identidadDelSitio.ts`.
 */

export const CLAVE_IDENTIDAD = "sitio.identidad";

export type Identidad = {
  /** El nombre, tal cual sale en la cabecera, el pie y el buscador. */
  nombre: string;
  /** Quien firma la obra. Va en los datos estructurados y al compartir. */
  autor: string;
  /** Las dos líneas que lee un buscador cuando no hay otra cosa mejor. */
  descripcion: string;
  /** Lo que acompaña al nombre en el título: «Photo Jhon · …». */
  lema: string;
};

export const TOPES = {
  nombre: 40,
  autor: 60,
  descripcion: 300,
  lema: 60,
} as const;

export const IDENTIDAD_POR_DEFECTO: Identidad = {
  nombre: "Photo Jhon",
  autor: "Jhon Bosch",
  descripcion:
    "Fotografía en blanco y negro, revelada en casa. El trabajo ordenado por series, las entradas y el archivo completo por fechas.",
  lema: "fotografía en blanco y negro",
};

/** El título de una página del sitio: «Series · Photo Jhon». */
export function titulo(identidad: Identidad, pagina?: string) {
  return pagina ? `${pagina} · ${identidad.nombre}` : nombreLargo(identidad);
}

/** El nombre con su lema, que es el título de la portada. */
export function nombreLargo(identidad: Identidad) {
  return identidad.lema
    ? `${identidad.nombre} · ${identidad.lema}`
    : identidad.nombre;
}
