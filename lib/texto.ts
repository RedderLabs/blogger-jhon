/** La dirección legible de una entrada o una serie a partir de su título. */
export function aSlug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita los acentos ya separados por NFD
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/**
 * De caja de texto a párrafos: una línea en blanco separa, el resto de saltos
 * no cuentan. Lo comparten el texto de sobre mí y el de la página de contacto,
 * que se escriben los dos en un `textarea` del panel.
 */
export function enParrafos(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
