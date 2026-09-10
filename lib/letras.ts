/**
 * Las letras del sitio.
 *
 * No se escribe el nombre de una fuente y se carga de donde sea: se elige
 * entre parejas cerradas, y las tres familias de cada una las sirve el propio
 * sitio (`next/font` las descarga al compilar y las deja en `.next`). Esto no
 * es una limitación por pereza —es lo mismo que promete el aviso de entrada:
 * ni una petición a un servidor de otro, ni una cookie, ni una manera de
 * saber quién está leyendo.
 *
 * Cada pareja nombra las variables CSS que declara `app/layout.tsx`; la
 * elegida se cuelga de `--tipo-serif`, `--tipo-sans` y `--tipo-mono`, que son
 * las que ya usa toda la hoja de estilo.
 *
 * Ocho parejas. Si mañana se retira una, lo guardado en la base deja de estar
 * en el catálogo y `enCatalogo` cae en la de fábrica: el sitio se queda con
 * otra letra, no sin letra.
 */

export const CLAVE_LETRAS = "sitio.letras";

export type Pareja = {
  clave: string;
  nombre: string;
  /** Para qué sirve, dicho sin jerga tipográfica. */
  que: string;
  /**
   * El nombre de cada familia y para qué va cada una, que es lo que hay que
   * poder leer en el panel: una pareja se elige por cómo se ve, pero se
   * reconoce por el nombre de la letra.
   */
  familias: { titular: string; texto: string; datos: string };
  variables: { serif: string; sans: string; mono: string };
};

export const PAREJAS: Pareja[] = [
  {
    clave: "cuarto-oscuro",
    nombre: "Cuarto oscuro",
    que: "La de siempre. Titulares de contraste alto, como los de una revista de fotografía, y una monoespaciada seca para los datos técnicos.",
    familias: {
      titular: "Bodoni Moda",
      texto: "Archivo",
      datos: "DM Mono",
    },
    variables: { serif: "--tipo-bodoni", sans: "--tipo-archivo", mono: "--tipo-dm-mono" },
  },
  {
    clave: "ampliadora",
    nombre: "Ampliadora",
    que: "Clásica y cálida, de las que no llaman la atención sobre sí mismas. La más cómoda si el sitio se va llenando de texto largo.",
    familias: {
      titular: "EB Garamond",
      texto: "Manrope",
      datos: "Fira Code",
    },
    variables: { serif: "--tipo-garamond", sans: "--tipo-manrope", mono: "--tipo-fira" },
  },
  {
    clave: "negativo",
    nombre: "Negativo",
    que: "Fina y alta, de mucho contraste. Los títulos se estiran y pesan poco; es la más elegante y la que peor aguanta un texto largo.",
    familias: {
      titular: "Cormorant Garamond",
      texto: "Karla",
      datos: "Source Code Pro",
    },
    variables: { serif: "--tipo-cormorant", sans: "--tipo-karla", mono: "--tipo-source-mono" },
  },
  {
    clave: "revelado",
    nombre: "Revelado",
    que: "De libro. Pensada para leer seguido sin cansarse: es la que mejor le sienta a las entradas.",
    familias: {
      titular: "Crimson Pro",
      texto: "Public Sans",
      datos: "Inconsolata",
    },
    variables: { serif: "--tipo-crimson", sans: "--tipo-public", mono: "--tipo-inconsolata" },
  },
  {
    clave: "encuadre",
    nombre: "Encuadre",
    que: "Moderna y geométrica. Formas limpias y bastante aire; el sitio parece más nuevo y menos de imprenta.",
    familias: {
      titular: "Spectral",
      texto: "Figtree",
      datos: "Red Hat Mono",
    },
    variables: { serif: "--tipo-spectral", sans: "--tipo-figtree", mono: "--tipo-red-hat" },
  },
  {
    clave: "grano",
    nombre: "Grano",
    que: "De reportaje: titulares compactos y una sans estrecha que mete mucho texto en poco sitio. La que mejor aguanta un título largo.",
    familias: {
      titular: "Newsreader",
      texto: "Barlow",
      datos: "Overpass Mono",
    },
    variables: { serif: "--tipo-newsreader", sans: "--tipo-barlow", mono: "--tipo-overpass" },
  },
  {
    clave: "papel",
    nombre: "Papel",
    que: "La que más carácter tiene. Los títulos hacen gesto —casi de cartel— y por eso conviene mirarla dos veces antes de dejarla puesta.",
    familias: {
      titular: "Fraunces",
      texto: "Outfit",
      datos: "Azeret Mono",
    },
    variables: { serif: "--tipo-fraunces", sans: "--tipo-outfit", mono: "--tipo-azeret" },
  },
  {
    clave: "comic",
    nombre: "Comic",
    que: "La de las notas del frigorífico. No es la Comic Sans de Microsoft —esa no se puede servir desde aquí y habría que pedírsela al equipo de quien mira— sino Comic Neue, que es la misma letra rehecha para web. Está porque se pidió; el archivo se lee igual de bien, pero deja de parecer serio.",
    familias: {
      titular: "Comic Neue",
      texto: "Nunito",
      datos: "Sono",
    },
    variables: { serif: "--tipo-comic", sans: "--tipo-nunito", mono: "--tipo-sono" },
  },
];

export const PAREJA_POR_DEFECTO = PAREJAS[0];

export const enCatalogo = (clave: string) =>
  PAREJAS.find((p) => p.clave === clave) ?? PAREJA_POR_DEFECTO;

/**
 * Lo que se le cuelga al `<html>`: las tres variables de siempre apuntando a
 * las de la pareja elegida. Así la hoja de estilo no se entera de nada.
 */
export function variablesDe(pareja: Pareja): React.CSSProperties {
  return {
    "--tipo-serif": `var(${pareja.variables.serif})`,
    "--tipo-sans": `var(${pareja.variables.sans})`,
    "--tipo-mono": `var(${pareja.variables.mono})`,
  } as React.CSSProperties;
}
