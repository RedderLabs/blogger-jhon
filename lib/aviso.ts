/**
 * El aviso que ve quien entra por primera vez. El texto es del autor: estaba
 * publicado como imagen en el blog de Blogger, así que aquí pasa a ser texto
 * de verdad — se puede leer con un lector de pantalla, se puede buscar y se
 * puede corregir desde el panel sin volver a exportar un JPEG.
 *
 * La `version` es la que decide si un visitante que ya lo cerró vuelve a
 * verlo: al cambiar el texto, súbela y el aviso reaparece una sola vez.
 */

export const CLAVE_AVISO = "photojhon:aviso";

export const AVISO_POR_DEFECTO = {
  version: "2026-08-21",
  titulo: "Importante",
  parrafos: [
    "Debido a que, al parecer, las I.A. están diseñadas y autorizadas para disponer y utilizar nuestras fotografías, las de todos, y tal vez modificarlas e igualmente poder incluso tal vez venderlas, pues la gente se está viendo en la necesidad de borrar toda aquella fotografía donde se identifique con claridad a una o varias personas, incluso con contrato de cesión de derechos y autorizaciones para hacer dichas fotografías. Y quiero pensar que reels y vídeos también.",
    "No creo que importe mucho que se tenga el Instagram en modo privado o público. No creo yo que importe que sean fotografías de familiares, amigos o desconocidos, menores de edad, o foto de desnudos o cualquiera otra. Es lo que creo entender yo y otra mucha gente que al parecer alerta de ello en redes, y yo por si acaso lo escucho: no quiero verme en un posible futuro inmerso en alguna demanda legal aunque no sea culpa mía.",
    "Ya venía yo advirtiendo, y era por algo, de que cada día se pone más de moda el hacer fotografía barrida, desenfocada, etc., etc. Es lo que hay.",
    "Si nadie colgase fotos en estos sitios esto no pasaría. La culpa la tenemos todos.",
  ],
  /** Lo que pone el botón que lo cierra. */
  boton: "Entendido",
} as const;

export type Aviso = {
  version: string;
  titulo: string;
  parrafos: string[];
  boton: string;
};
