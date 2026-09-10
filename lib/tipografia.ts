/**
 * Cómo se lee el sitio: el tamaño del texto, cuánto respira entre líneas y
 * cuánto mide la columna de lectura.
 *
 * La pareja de letras —`lib/letras.ts`— dice con qué letra; esto dice a qué
 * tamaño. Son cosas distintas y se cambian en momentos distintos: la letra se
 * elige una vez y el tamaño se retoca cuando alguien se queja de que lee
 * pequeño, que es una queja legítima y hasta ahora obligaba a tocar el código.
 *
 * Tres cosas y no diez, cada una con tres o cuatro escalones. Un cuadro de
 * diálogo con un número libre de píxeles acaba en una página con el texto a 11
 * o a 30: los escalones están medidos para que cualquier combinación siga
 * leyéndose bien.
 *
 * Cada escalón se cuelga de una variable CSS que usan las páginas con texto
 * largo —la entrada, sobre mí, las legales, la de contacto y el aviso—; los
 * rótulos, los datos técnicos y los pies no se tocan, que tienen su medida.
 *
 * Aquí sólo están los datos —sin base y sin caché— para que el panel pueda
 * importarlos desde el navegador; la lectura vive en `lib/tipografiaDelSitio.ts`.
 */

export const CLAVE_TIPOGRAFIA = "sitio.tipografia";

export type Tipografia = {
  tamano: string;
  interlineado: string;
  medida: string;
};

export type Escalon = {
  clave: string;
  nombre: string;
  /** Lo que se le cuelga a la variable CSS. */
  valor: string;
  /** Para qué es bueno, dicho sin jerga. */
  que: string;
};

/** El tamaño del texto corrido. 18px es lo que había escrito en las páginas. */
export const TAMANOS: Escalon[] = [
  { clave: "menor", nombre: "Menor", valor: "16px", que: "Cabe más en pantalla. Para quien lee rápido y de cerca." },
  { clave: "normal", nombre: "Normal", valor: "18px", que: "El de siempre. Cómodo en un portátil y en un teléfono." },
  { clave: "mayor", nombre: "Mayor", valor: "20px", que: "Un punto más grande. Se agradece en una pantalla lejos." },
  { clave: "grande", nombre: "Grande", valor: "22px", que: "Para leer sin esfuerzo, o desde el sofá." },
];

/** Cuánto respira el texto entre línea y línea. */
export const INTERLINEADOS: Escalon[] = [
  { clave: "ajustado", nombre: "Ajustado", valor: "1.55", que: "Más apretado: el párrafo se ve como un bloque." },
  { clave: "normal", nombre: "Normal", valor: "1.75", que: "El de siempre. El ojo salta de línea sin perderse." },
  { clave: "holgado", nombre: "Holgado", valor: "1.95", que: "Muy aireado. Va bien con textos largos y densos." },
];

/** Cuánto mide la columna: en `ch`, que son caracteres, no píxeles. */
export const MEDIDAS: Escalon[] = [
  { clave: "estrecha", nombre: "Estrecha", valor: "56ch", que: "Renglón corto, como el de un libro de bolsillo." },
  { clave: "normal", nombre: "Normal", valor: "64ch", que: "La de siempre. Entre sesenta y setenta caracteres." },
  { clave: "ancha", nombre: "Ancha", valor: "74ch", que: "Aprovecha la pantalla. Menos saltos de línea." },
];

export const TIPOGRAFIA_POR_DEFECTO: Tipografia = {
  tamano: "normal",
  interlineado: "normal",
  medida: "normal",
};

const buscar = (lista: Escalon[], clave: string) =>
  lista.find((e) => e.clave === clave) ?? lista.find((e) => e.clave === "normal") ?? lista[0];

/** Lo elegido, ya en escalones de verdad: lo que no esté cae en lo de fábrica. */
export function escalonesDe(t: Tipografia) {
  return {
    tamano: buscar(TAMANOS, t.tamano),
    interlineado: buscar(INTERLINEADOS, t.interlineado),
    medida: buscar(MEDIDAS, t.medida),
  };
}

/**
 * Las variables que se cuelgan del `<html>`, igual que las de las letras.
 * Se llaman como lo que hacen, no como el escalón elegido: una página no
 * tiene que saber si el texto está en «mayor» o en «grande».
 */
export function variablesDe(t: Tipografia): React.CSSProperties {
  const e = escalonesDe(t);
  return {
    "--texto": e.tamano.valor,
    "--interlinea": e.interlineado.valor,
    "--medida": e.medida.valor,
  } as React.CSSProperties;
}
