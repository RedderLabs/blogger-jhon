/**
 * El texto de /sobre-mi: el de fábrica y las medidas de lo que se puede
 * escribir en su lugar.
 *
 * Aquí no hay base ni caché a propósito, para que el editor del panel pueda
 * importarlo desde el navegador; la lectura vive en `lib/sobreMiDelSitio.ts`.
 *
 * Lo de abajo es un primer borrador escrito desde lo que el propio sitio ya
 * cuenta (película, revelado en casa, escaneo del negativo, la serie como
 * unidad). No es biografía: las fechas, los lugares y lo que sea personal los
 * pone Jhon con sus palabras desde el panel, sin tocar un fichero.
 */

export type Seccion = { titulo: string; parrafos: string[] };

export type SobreMi = {
  titulo: string;
  entradilla: string;
  secciones: Seccion[];
};

export const SOBRE_MI: SobreMi = {
  titulo: "Sobre mí",
  entradilla:
    "Fotografío en blanco y negro, revelo y escaneo yo mismo, y ordeno lo que hago en series. Esto es lo que hay detrás del archivo.",
  secciones: [
    {
      titulo: "Quién",
      parrafos: [
        "Llevo haciendo fotografías desde mucho antes de que existiera este sitio. No trabajo por temporadas: vuelvo a los mismos sitios con la misma pregunta hasta que el trabajo dice algo, y por eso hay series que llevan abiertas décadas y otras que se cerraron en un mes.",
        "Durante años todo esto estuvo en un blog, ordenado por semanas. Aquí está ordenado por lo único que separa de verdad una fotografía de otra: el trabajo al que pertenece.",
      ],
    },
    {
      titulo: "Cómo trabajo",
      parrafos: [
        "Película, revelado en casa y escaneo del negativo. Lo que ves en pantalla sale de ese escaneo, con los ajustes justos para que se parezca a la copia: sin reencuadres que cambien la fotografía y sin limpiezas que le quiten el grano.",
        "Las fotos entran por rollo, el lote que se escanea de una vez, y desde ahí se reparten en las series a las que pertenecen. Una misma fotografía puede estar en más de una; casi siempre es señal de que el trabajo iba por dos sitios a la vez.",
      ],
    },
    {
      titulo: "El dato técnico, a la vista",
      parrafos: [
        "De cada fotograma se guarda su ficha —cámara, óptica, película, exposición, revelado— y se enseña junto a la fotografía. No es adorno ni presunción de equipo: es parte de lo que estás mirando, y a quien fotografía en película le ahorra preguntar.",
      ],
    },
  ],
};

/**
 * El texto se edita en /admin/sobre-mi y se guarda en `Ajuste`. Lo de arriba
 * deja de ser «el texto» para pasar a ser el punto de partida: lo que se lee
 * mientras no se haya escrito nada y a lo que se vuelve al darle a «Volver al
 * texto de fábrica».
 */
export const CLAVE_TEXTO = "sobre-mi.texto";

export const TOPES_TEXTO = {
  titulo: 40,
  entradilla: 400,
  tituloSeccion: 60,
  /** Todos los párrafos de una sección, juntos. */
  parrafos: 4000,
  /** Cuántas secciones caben. No es la maqueta: es que nadie lee más. */
  secciones: 12,
} as const;

/* ------------------------------------------------------------- el retrato */

/**
 * La fotografía que acompaña a /sobre-mi. No va aquí escrita: se elige en el
 * panel entre las del archivo y se guarda en `Ajuste`, con el pie que se lea
 * debajo. Aquí sólo están la clave y los topes —sin base y sin caché— para
 * que el editor del panel pueda importarlos desde el navegador; la lectura
 * vive en `lib/consultas.ts`.
 */
export const CLAVE_RETRATO = "sobre-mi.retrato";

/** Tope del pie del retrato: es un pie de foto, no un párrafo. */
export const TOPE_PIE_RETRATO = 160;

export type RetratoDeSobreMi = {
  foto: {
    id: string;
    archivo: string;
    alt: string;
    titulo: string;
    ancho: number;
    alto: number;
    anchoMax: number;
  };
  /** Lo que se lee bajo la fotografía. Vacío = sólo la fotografía. */
  pie: string;
};
