/**
 * Umami: la analítica del sitio. Sin cookies, sin huella del navegador y sin
 * datos personales — mide páginas y procedencias, no personas. Es lo único
 * compatible con lo que este sitio le promete a quien entra.
 *
 * Aquí sólo están los datos y las claves. La lectura de la base vive en
 * `lib/umamiDelSitio.ts`, para que el editor del panel pueda importar esto sin
 * arrastrarse Prisma al navegador.
 */

export const CLAVE_SCRIPT = "umami.script";
export const CLAVE_ID = "umami.id";
export const CLAVE_PANEL = "umami.panel";

export type Umami = {
  /** Dirección del `script.js` del servidor de Umami. Vacío = apagado. */
  script: string;
  /** El identificador del sitio dentro de Umami. Vacío = apagado. */
  id: string;
  /**
   * La dirección para ver los números dentro del panel. En Umami se saca con
   * «Share URL»: es un enlace público de sólo lectura, y es el único que se
   * puede incrustar. El panel normal de Umami se niega a salir dentro de otra
   * página, y hace bien.
   */
  panel: string;
};

export const UMAMI_APAGADO: Umami = { script: "", id: "", panel: "" };

/** Se mide sólo si están las dos: media configuración no mide nada. */
export function mide(u: Umami) {
  return Boolean(u.script && u.id);
}

/**
 * Umami acepta el enlace de compartir en dos formas y sólo una se puede
 * incrustar. `https://…/share/XXXX/mi-sitio` es la que se copia del botón;
 * `https://…/share/XXXX` sin el nombre también vale. Se acepta cualquiera de
 * las dos y se rechaza lo que no sea un enlace de compartir, que es el fallo
 * que se comete: pegar la dirección del panel de Umami y ver un cuadro en
 * blanco sin saber por qué.
 */
export function falloDelPanel(url: string): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return "Eso no es una dirección web. Pégala entera, con https:// delante.";
  }
  if (u.protocol !== "https:" && u.hostname !== "localhost") {
    return "Tiene que ir por https, o el navegador se negará a enseñarlo dentro del panel.";
  }
  if (!u.pathname.includes("/share/")) {
    return "Esa no es la de compartir. En Umami: el sitio → Edit → Share URL, y copia la que empieza por /share/.";
  }
  return null;
}
