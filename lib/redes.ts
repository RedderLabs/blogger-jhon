/**
 * Las redes que se pueden enseñar en /contacto. El catálogo está aquí y no en
 * la base porque cada una necesita saber cómo se construye su dirección; lo
 * que se elige desde el panel es cuáles se publican y con qué usuario.
 *
 * Hay dos formas de red:
 *  - «usuario»: se guarda el nombre de la cuenta y la dirección se arma sola.
 *  - «direccion»: se guarda la dirección entera, porque no hay patrón común
 *    (Mastodon cambia de servidor, un blog es un dominio cualquiera).
 */

export type FormaDeRed = "usuario" | "direccion";

export type Red = {
  clave: string;
  nombre: string;
  forma: FormaDeRed;
  /** Lo que va delante del usuario. Vacío en las de dirección. */
  base: string;
  /** Si el nombre de la cuenta se escribe con arroba delante. */
  arroba?: boolean;
  ejemplo: string;
};

export const REDES: Red[] = [
  { clave: "instagram", nombre: "Instagram", forma: "usuario", base: "https://instagram.com/", arroba: true, ejemplo: "photo.jhon" },
  { clave: "flickr", nombre: "Flickr", forma: "usuario", base: "https://www.flickr.com/photos/", ejemplo: "photojhon" },
  { clave: "500px", nombre: "500px", forma: "usuario", base: "https://500px.com/p/", ejemplo: "photojhon" },
  { clave: "facebook", nombre: "Facebook", forma: "usuario", base: "https://facebook.com/", ejemplo: "photojhon" },
  { clave: "x", nombre: "X", forma: "usuario", base: "https://x.com/", arroba: true, ejemplo: "photojhon" },
  { clave: "bluesky", nombre: "Bluesky", forma: "usuario", base: "https://bsky.app/profile/", arroba: true, ejemplo: "photojhon.bsky.social" },
  { clave: "threads", nombre: "Threads", forma: "usuario", base: "https://www.threads.net/@", arroba: true, ejemplo: "photo.jhon" },
  { clave: "youtube", nombre: "YouTube", forma: "usuario", base: "https://youtube.com/@", arroba: true, ejemplo: "photojhon" },
  { clave: "vimeo", nombre: "Vimeo", forma: "usuario", base: "https://vimeo.com/", ejemplo: "photojhon" },
  { clave: "mastodon", nombre: "Mastodon", forma: "direccion", base: "", ejemplo: "https://mastodon.social/@photojhon" },
  { clave: "blog", nombre: "El blog antiguo", forma: "direccion", base: "", ejemplo: "https://photo-jhon.blogspot.com" },
  { clave: "enlace", nombre: "Otra dirección", forma: "direccion", base: "", ejemplo: "https://…" },
];

export function red(clave: string) {
  return REDES.find((r) => r.clave === clave);
}

/** Lo que se guarda: la red y el usuario o la dirección. */
export type CuentaEnRed = { red: string; valor: string };

const USUARIO_VALIDO = /^[A-Za-z0-9._-]{1,60}$/;

/**
 * Admite que se pegue la dirección entera de un perfil: se queda con el
 * último trozo, que es el usuario. Pegar la URL es lo que hace todo el mundo.
 */
export function limpiarUsuario(bruto: string) {
  let v = bruto.trim();
  if (/^https?:\/\//i.test(v)) {
    v = v.replace(/[?#].*$/, "").replace(/\/+$/, "");
    v = v.slice(v.lastIndexOf("/") + 1);
  }
  return v.replace(/^@/, "");
}

/** null si vale; si no, qué está mal, para decírselo al panel. */
export function falloDeCuenta(cuenta: CuentaEnRed): string | null {
  const r = red(cuenta.red);
  if (!r) return "Esa red no está en la lista.";

  const valor = cuenta.valor.trim();
  if (!valor) return `Falta el ${r.forma === "usuario" ? "usuario" : "enlace"} de ${r.nombre}.`;

  if (r.forma === "direccion") {
    if (!/^https?:\/\/\S+\.\S+/i.test(valor)) {
      return `El enlace de ${r.nombre} tiene que empezar por https:// y ser una dirección entera.`;
    }
    return null;
  }

  if (!USUARIO_VALIDO.test(limpiarUsuario(valor))) {
    return `El usuario de ${r.nombre} sólo admite letras, números, puntos, guiones y guiones bajos.`;
  }
  return null;
}

/** La dirección a la que lleva el enlace. */
export function enlaceDeCuenta(cuenta: CuentaEnRed) {
  const r = red(cuenta.red);
  if (!r) return null;
  if (r.forma === "direccion") return cuenta.valor.trim();
  return r.base + limpiarUsuario(cuenta.valor);
}

/** Lo que se lee en pantalla: «@photo.jhon» o el dominio, sin el https. */
export function textoDeCuenta(cuenta: CuentaEnRed) {
  const r = red(cuenta.red);
  if (!r) return cuenta.valor;
  if (r.forma === "direccion") {
    return cuenta.valor.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  }
  const usuario = limpiarUsuario(cuenta.valor);
  return r.arroba ? `@${usuario}` : usuario;
}
