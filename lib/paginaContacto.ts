/**
 * La página de /contacto: si se enseña y qué pone.
 *
 * Aquí sólo están los datos —sin base y sin caché— para que el editor del
 * panel pueda importarlos desde el navegador; la lectura vive en
 * `lib/paginaContactoDelSitio.ts`, igual que pasa con el pie y con el aviso.
 *
 * Que se pueda apagar no es un capricho: hay temporadas en las que no se
 * quiere recibir nada, y una página de contacto abierta con la bandeja sin
 * mirar promete una respuesta que no va a llegar. Apagada, /contacto responde
 * 404 y desaparece de la navegación, del pie y del mapa del sitio; los
 * mensajes que ya estaban siguen en /admin/mensajes.
 */

export const CLAVE_CONTACTO = "sitio.contacto.pagina";

export type TextosDeContacto = {
  titulo: string;
  entradilla: string;
  antesTitulo: string;
  /** Párrafos separados por una línea en blanco. */
  antes: string;
  datosTitulo: string;
  datos: string;
};

export type PaginaDeContacto = TextosDeContacto & {
  /** false = la página no existe hacia fuera. */
  visible: boolean;
};

/** Topes de cada campo. Un tope no es una manía: es lo que cabe sin romper la maqueta. */
export const TOPES = {
  titulo: 40,
  entradilla: 400,
  antesTitulo: 40,
  antes: 1200,
  datosTitulo: 40,
  datos: 1200,
} as const;

/**
 * Lo que sale mientras no se haya escrito nada en el panel: el texto con el
 * que nació la página. No se guarda en la base, así que dejar un campo en
 * blanco lo devuelve a esto en vez de dejar el hueco vacío.
 */
export const TEXTOS_POR_DEFECTO: TextosDeContacto = {
  titulo: "Contacto",
  entradilla:
    "Para preguntar por una fotografía del archivo, por cómo está hecha o por la serie a la que pertenece. Escribe con calma: contesto yo.",
  antesTitulo: "Antes de escribir",
  antes: `Si buscas una fotografía concreta, dime de qué serie es y el número de fotograma: sale en la ficha de cada fotografía, debajo de la imagen. Con eso la localizo en un momento.

Si la pregunta es cómo está hecha, mira primero [sobre mí](/sobre-mi): cámara, película y revelado están a la vista, y quizá te ahorre el mensaje.`,
  datosTitulo: "Qué pasa con tus datos",
  datos: `El mensaje se guarda en el propio sitio para que pueda leerlo y contestarte. No hay anuncios ni terceros. Se cuentan las visitas —cuántas y de qué páginas— con un contador propio, sin cookies y sin nada que permita saber quién eres. Sobre el uso de las fotografías por sistemas de I.A. está [el aviso](/aviso).`,
};

export const CONTACTO_POR_DEFECTO: PaginaDeContacto = {
  visible: true,
  ...TEXTOS_POR_DEFECTO,
};
