/**
 * La entradilla de /entradas y la de /archivo: el párrafo que va debajo del
 * título y explica de qué va la página.
 *
 * Estaban escritas dentro de cada página, que es tanto como decir que corregir
 * una coma pedía tocar código y volver a desplegar. Y son justo el texto que
 * se retoca: es lo primero que se lee al entrar, y lo que cambia cuando cambia
 * lo que hay debajo —la de /archivo promete que las direcciones viejas siguen
 * funcionando, y eso deja de ser cierto el día que se decida que no—.
 *
 * Aquí sólo están los datos —sin base y sin caché— para que el editor del
 * panel pueda importarlos desde el navegador; la lectura vive en
 * `lib/entradillasDelSitio.ts`, igual que pasa con la identidad y el pie.
 */

export const CLAVE_ENTRADILLAS = "sitio.entradillas";

export type ClaveDeEntradilla = "entradas" | "archivo";

export type Entradillas = Record<ClaveDeEntradilla, string>;

/** Lo que cabe debajo del título sin que la cabecera se coma la página. */
export const TOPE = 400;

/**
 * Lo que sale mientras no se haya escrito nada en el panel: el texto con el
 * que nacieron las dos páginas. No se guarda en la base, así que dejar un
 * campo en blanco lo devuelve a esto en vez de dejar el hueco vacío.
 */
export const ENTRADILLAS_POR_DEFECTO: Entradillas = {
  entradas:
    "Lo que pienso mientras fotografío, y lo que pienso después. Ordenado por tema, no por la semana en que lo escribí. Cada texto enlaza con las series de las que habla.",
  archivo:
    "Todo lo publicado, por fecha, como estaba en el blog. Nada se ha perdido en la mudanza: cada entrada conserva su día y su dirección antigua sigue funcionando. Si venías con un enlace guardado, este es tu sitio.",
};

/**
 * De qué página es cada entradilla y dónde se lee, para que el panel no tenga
 * que explicarlo con el nombre de la clave.
 */
export const CATALOGO_DE_ENTRADILLAS: {
  clave: ClaveDeEntradilla;
  nombre: string;
  ruta: string;
  ayuda: string;
}[] = [
  {
    clave: "entradas",
    nombre: "Entradas",
    ruta: "/entradas",
    ayuda:
      "Debajo del título, encima de los botones de tema. Es lo que explica por qué los textos van por tema y no por fecha.",
  },
  {
    clave: "archivo",
    nombre: "Archivo",
    ruta: "/archivo",
    ayuda:
      "Debajo del título, encima de los años. Es donde se le dice a quien llega con un enlace viejo que su enlace sigue valiendo.",
  },
];
