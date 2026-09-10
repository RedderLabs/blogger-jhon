/**
 * Qué páginas del sitio se enseñan.
 *
 * No todo el mundo escribe. Un fotógrafo que no escribe tiene ahora
 * mismo un enlace en el menú que sólo lleva a una página vacía, y eso dice de
 * él algo que no es verdad. Apagarla es tan legítimo como apagar una sección
 * de la portada.
 *
 * El interruptor llega hasta el índice y no más allá: apagado, /entradas
 * contesta «no encontrada» y se cae del menú, del pie y del mapa del sitio,
 * pero un texto concreto sigue abierto. Es a propósito: apagar también lo que
 * cuelga dejaría medio sitio apuntando a 404.
 *
 * El índice de series estaba aquí y ya no: /series y /admin/series se
 * quitaron del sitio el 31/08/2026. Cada serie sigue abierta en su dirección
 * —es donde vive cada fotografía—, lo que desapareció es la lista.
 *
 * /contacto tiene su propio interruptor en `lib/paginaContacto.ts`: allí va
 * junto a los seis textos de la página, que se leen siempre a la vez.
 *
 * Aquí sólo están los datos —sin base y sin caché— para que el panel pueda
 * importarlos desde el navegador; la lectura vive en `lib/paginasDelSitio.ts`.
 */

export const CLAVE_PAGINAS = "sitio.paginas";

export type ClaveDePagina = "entradas";

export type Paginas = Record<ClaveDePagina, boolean>;

/** Un sitio recién puesto las enseña todas. */
export const PAGINAS_POR_DEFECTO: Paginas = { entradas: true };

/**
 * De qué va cada una y qué se pierde al apagarla, para que el panel no tenga
 * que explicarlo con el nombre de la clave.
 */
export const CATALOGO_DE_PAGINAS: {
  clave: ClaveDePagina;
  nombre: string;
  ruta: string;
  que: string;
  alApagarla: string;
}[] = [
  {
    clave: "entradas",
    nombre: "Las entradas",
    ruta: "/entradas",
    que: "Los textos, ordenados por categoría. Con los botones de arriba para filtrar.",
    alApagarla:
      "Cada texto publicado sigue abierto en su dirección y sale en el archivo. Lo que desaparece es la lista y el filtro por categorías.",
  },
];

/** Lo que necesita la navegación: qué páginas opcionales están encendidas. */
export type Visibles = Paginas & { contacto: boolean };

export const VISIBLES_POR_DEFECTO: Visibles = {
  ...PAGINAS_POR_DEFECTO,
  contacto: true,
};
