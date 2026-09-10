"use client";

import type { RefObject } from "react";

import { type Alineacion, MARCA_DE_ALINEACION } from "@/lib/bloques";

/**
 * Los botones de formato que van encima de una caja de texto del panel.
 *
 * No hay editor enriquecido por debajo: cada botón escribe en el `textarea`
 * las marcas de `lib/formato.ts` y `lib/bloques.ts`, y deja el cursor donde
 * toca. Quien sepa escribirlas a mano puede seguir haciéndolo —es el mismo
 * texto—, y quien no, no tiene que aprender nada.
 *
 * Tres maneras de aplicar, según lo que sea la marca:
 *
 *  · **envolver** (negrita, cursiva, subrayado, tachado, código, enlace): se
 *    pone alrededor de lo seleccionado, o de un texto de muestra si no hay
 *    nada seleccionado.
 *  · **de línea** (rótulos, listas, cita): marcan la línea entera, y con
 *    varias líneas seleccionadas las marcan todas. El segundo clic las quita.
 *  · **de bloque** (las colocaciones): van al principio del bloque y se
 *    sustituyen entre ellas, porque un párrafo no puede ir centrado y a la
 *    derecha a la vez.
 */

export type Herramienta =
  | "negrita"
  | "cursiva"
  | "subrayado"
  | "tachado"
  | "codigo"
  | "enlace"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "lista"
  | "numerada"
  | "cita"
  | "separador"
  | "izquierda"
  | "centro"
  | "derecha"
  | "justificado";

type Marca =
  | { como: "envolver"; antes: string; despues: string; muestra: string }
  | { como: "linea"; antes: string; muestra: string }
  | { como: "bloque"; alinear: Alineacion }
  | { como: "suelta"; texto: string };

const MARCAS: Record<Herramienta, Marca> = {
  negrita: { como: "envolver", antes: "**", despues: "**", muestra: "negrita" },
  cursiva: { como: "envolver", antes: "*", despues: "*", muestra: "cursiva" },
  subrayado: { como: "envolver", antes: "__", despues: "__", muestra: "subrayado" },
  tachado: { como: "envolver", antes: "~~", despues: "~~", muestra: "tachado" },
  codigo: { como: "envolver", antes: "`", despues: "`", muestra: "dato" },
  enlace: { como: "envolver", antes: "[", despues: "](/)", muestra: "lo que se lee" },
  h1: { como: "linea", antes: "# ", muestra: "Rótulo" },
  h2: { como: "linea", antes: "## ", muestra: "Rótulo" },
  h3: { como: "linea", antes: "### ", muestra: "Rótulo" },
  h4: { como: "linea", antes: "#### ", muestra: "Rótulo" },
  h5: { como: "linea", antes: "##### ", muestra: "Rótulo" },
  h6: { como: "linea", antes: "###### ", muestra: "Rótulo" },
  lista: { como: "linea", antes: "- ", muestra: "Un punto" },
  numerada: { como: "linea", antes: "1. ", muestra: "Lo primero" },
  cita: { como: "linea", antes: "> ", muestra: "La cita" },
  separador: { como: "suelta", texto: "---" },
  izquierda: { como: "bloque", alinear: "izquierda" },
  centro: { como: "bloque", alinear: "centro" },
  derecha: { como: "bloque", alinear: "derecha" },
  justificado: { como: "bloque", alinear: "justificado" },
};

const ROTULOS: Record<Herramienta, { texto: string; titulo: string }> = {
  negrita: { texto: "B", titulo: "Negrita  **así**" },
  cursiva: { texto: "I", titulo: "Cursiva  *así*" },
  subrayado: { texto: "U", titulo: "Subrayado  __así__" },
  tachado: { texto: "S", titulo: "Tachado  ~~así~~" },
  codigo: { texto: "‹›", titulo: "Monoespaciado  `así`" },
  enlace: { texto: "↗", titulo: "Enlace  [lo que se lee](/ruta)" },
  h1: { texto: "H1", titulo: "Rótulo grande  # así" },
  h2: { texto: "H2", titulo: "Rótulo  ## así" },
  h3: { texto: "H3", titulo: "Rótulo pequeño  ### así" },
  h4: { texto: "H4", titulo: "Rótulo más pequeño  #### así" },
  h5: { texto: "H5", titulo: "Rótulo menor  ##### así" },
  h6: { texto: "H6", titulo: "Rótulo mínimo  ###### así" },
  lista: { texto: "•", titulo: "Lista  - un punto por línea" },
  numerada: { texto: "1.", titulo: "Lista numerada  1. un punto por línea" },
  cita: { texto: "❝", titulo: "Cita  > así, con la firma debajo" },
  separador: { texto: "—", titulo: "Raya de separación" },
  izquierda: { texto: "⯇", titulo: "A la izquierda, como se lee" },
  centro: { texto: "≡", titulo: "Centrado  [centro]" },
  derecha: { texto: "⯈", titulo: "A la derecha  [derecha]" },
  justificado: { texto: "☰", titulo: "Justificado  [justificado]" },
};

/** El orden en que se enseñan, agrupadas como se usan. */
export const TODAS: Herramienta[][] = [
  ["negrita", "cursiva", "subrayado", "tachado", "codigo", "enlace"],
  ["h1", "h2", "h3", "h4", "h5", "h6"],
  ["lista", "numerada", "cita", "separador"],
  ["izquierda", "centro", "derecha", "justificado"],
];

/** Para los textos cortos, donde un rótulo o una raya no pintan nada. */
export const SOLO_EN_LINEA: Herramienta[][] = [
  ["negrita", "cursiva", "subrayado", "tachado", "codigo", "enlace"],
];

type Props = {
  /** La caja sobre la que actúan los botones. */
  caja: RefObject<HTMLTextAreaElement | null>;
  valor: string;
  alCambiar: (v: string) => void;
  /** Qué grupos se enseñan; por defecto, todos. */
  grupos?: Herramienta[][];
  className?: string;
};

const TODAS_LAS_MARCAS = Object.values(MARCA_DE_ALINEACION).filter(Boolean);

export function BarraDeFormato({
  caja,
  valor,
  alCambiar,
  grupos = TODAS,
  className,
}: Props) {
  function aplicar(cual: Herramienta) {
    const el = caja.current;
    if (!el) return;

    const marca = MARCAS[cual];
    const ini = el.selectionStart;
    const fin = el.selectionEnd;
    const dentro = valor.slice(ini, fin);

    // Dónde empieza y acaba el bloque —lo de dos saltos de línea a dos saltos
    // de línea— en el que está el cursor. Lo necesitan las colocaciones.
    const principioDeLinea = valor.lastIndexOf("\n", ini - 1) + 1;
    const corte = valor.indexOf("\n", fin);
    const finalDeLinea = corte === -1 ? valor.length : corte;

    let nuevo: string;
    let cursorIni: number;
    let cursorFin: number;

    if (marca.como === "envolver") {
      const relleno = dentro || marca.muestra;
      nuevo = valor.slice(0, ini) + marca.antes + relleno + marca.despues + valor.slice(fin);
      cursorIni = ini + marca.antes.length;
      cursorFin = cursorIni + relleno.length;
    } else if (marca.como === "suelta") {
      // La raya va sola en su bloque, con una línea en blanco a cada lado.
      const antes = valor.slice(0, finalDeLinea);
      const despues = valor.slice(finalDeLinea);
      const pegote = `${antes ? "\n\n" : ""}${marca.texto}\n\n`;
      nuevo = antes + pegote + despues.replace(/^\n+/, "");
      cursorIni = cursorFin = (antes + pegote).length;
    } else if (marca.como === "bloque") {
      // Las colocaciones se sustituyen entre ellas: primero se quita la que
      // hubiera, y luego se pone la nueva. La izquierda es «ninguna».
      const linea = valor.slice(principioDeLinea, finalDeLinea);
      let limpia = linea;
      for (const vieja of TODAS_LAS_MARCAS) {
        if (limpia.toLowerCase().startsWith(vieja.trim().toLowerCase())) {
          limpia = limpia.slice(vieja.trim().length).replace(/^\s+/, "");
          break;
        }
      }
      const puesta = MARCA_DE_ALINEACION[marca.alinear] + limpia;
      nuevo = valor.slice(0, principioDeLinea) + puesta + valor.slice(finalDeLinea);
      cursorIni = cursorFin = principioDeLinea + puesta.length;
    } else {
      const lineas = valor.slice(principioDeLinea, finalDeLinea).split("\n");

      // Vacío: se escribe la marca con un texto de muestra dentro, para no
      // dejar una raya suelta esperando.
      if (lineas.length === 1 && lineas[0] === "") {
        nuevo =
          valor.slice(0, principioDeLinea) +
          marca.antes +
          marca.muestra +
          valor.slice(finalDeLinea);
        cursorIni = principioDeLinea + marca.antes.length;
        cursorFin = cursorIni + marca.muestra.length;
      } else {
        // Una línea ya marcada con otra cosa del mismo tipo —otro rótulo,
        // otra clase de lista— cambia en vez de acumular marcas.
        const otras = [/^#{1,6}\s+/, /^-\s+/, /^\d+[.)]\s+/, /^>\s*/];
        const marcadas = lineas.every((l) => l.startsWith(marca.antes));
        const cambiadas = lineas.map((l, i) => {
          if (marcadas) return l.slice(marca.antes.length);
          let limpia = l;
          for (const otra of otras) limpia = limpia.replace(otra, "");
          // En una numerada, cada línea lleva su número.
          const antes =
            cual === "numerada" ? `${i + 1}. ` : marca.antes;
          return antes + limpia;
        });
        const bloque = cambiadas.join("\n");
        nuevo = valor.slice(0, principioDeLinea) + bloque + valor.slice(finalDeLinea);
        cursorIni = principioDeLinea;
        cursorFin = principioDeLinea + bloque.length;
      }
    }

    alCambiar(nuevo);

    // El estado se pinta en el siguiente ciclo: hasta entonces la caja tiene
    // el texto viejo y mover el cursor no valdría de nada.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorIni, cursorFin);
    });
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className ?? ""}`}>
      {grupos.map((grupo, g) => (
        <div key={g} className="flex flex-wrap items-center gap-1">
          {grupo.map((cual) => (
            <button
              key={cual}
              type="button"
              title={ROTULOS[cual].titulo}
              aria-label={ROTULOS[cual].titulo}
              onClick={() => aplicar(cual)}
              className="grid h-[26px] min-w-[26px] place-items-center border border-filo px-[.35rem] font-mono text-[.7rem] text-dato normal-case hover:border-rojo hover:text-rojo"
            >
              <span
                className={
                  cual === "negrita"
                    ? "font-bold"
                    : cual === "cursiva"
                      ? "italic"
                      : cual === "subrayado"
                        ? "underline"
                        : cual === "tachado"
                          ? "line-through"
                          : ""
                }
              >
                {ROTULOS[cual].texto}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
