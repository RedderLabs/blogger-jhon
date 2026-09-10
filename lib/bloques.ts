/**
 * El cuerpo de una entrada —y el de cualquier texto largo del panel— se
 * escribe en texto llano con unas convenciones, y se guarda como bloques:
 *
 *   párrafo normal          → { tipo: "p" }
 *   # … ###### rótulo       → { tipo: "titulo", nivel: 1…6 }
 *   - uno por línea         → { tipo: "lista" }
 *   1. uno por línea        → { tipo: "lista", numerada: true }
 *   > cita                  → { tipo: "cita" }, con «— firma» en la línea siguiente
 *   ---                     → { tipo: "separador" }
 *   [foto:ID] pie opcional  → { tipo: "figura" }
 *
 * Cualquier bloque puede empezar por `[centro]`, `[derecha]` o `[justificado]`
 * para decir cómo se coloca; sin nada, va como se lee, a la izquierda.
 *
 * Dentro de un párrafo, de un punto de la lista, de un rótulo o de una cita
 * valen además las marcas de `lib/formato.ts`: **negrita**, *cursiva*,
 * __subrayado__, ~~tachado~~, `monoespaciado` y [enlaces](/ruta). El panel las
 * pone con botones; aquí no hay que saber nada de eso, porque lo que se
 * guarda sigue siendo el texto tal cual se escribió.
 *
 * Los bloques guardados antes de todo esto —`p`, `cita`, `figura` y un
 * `titulo` sin nivel— siguen valiendo: lo que falte se da por lo de siempre.
 */

export type Alineacion = "izquierda" | "centro" | "derecha" | "justificado";

export type NivelDeTitulo = 1 | 2 | 3 | 4 | 5 | 6;

/** Lo que puede llevar cualquier bloque. */
type Comun = { alinear?: Alineacion };

export type Bloque =
  | ({ tipo: "p"; texto: string } & Comun)
  | ({ tipo: "titulo"; texto: string; nivel?: NivelDeTitulo } & Comun)
  | ({ tipo: "lista"; puntos: string[]; numerada?: boolean } & Comun)
  | ({ tipo: "cita"; texto: string; firma?: string } & Comun)
  | { tipo: "separador" }
  | ({ tipo: "figura"; fotoId: string; pie?: string } & Comun);

/** Las clases de Tailwind de cada colocación, para no repetirlas en cada página. */
export const CLASE_DE_ALINEACION: Record<Alineacion, string> = {
  izquierda: "",
  centro: "text-center",
  derecha: "text-right",
  justificado: "text-justify",
};

export const MARCA_DE_ALINEACION: Record<Alineacion, string> = {
  izquierda: "",
  centro: "[centro] ",
  derecha: "[derecha] ",
  justificado: "[justificado] ",
};

const ALINEACIONES: Alineacion[] = ["centro", "derecha", "justificado"];

/** Se quita la marca de colocación del principio y se dice cuál era. */
function sacarAlineacion(linea: string): { linea: string; alinear?: Alineacion } {
  for (const a of ALINEACIONES) {
    const marca = `[${a}]`;
    if (linea.toLowerCase().startsWith(marca)) {
      return { linea: linea.slice(marca.length).trim(), alinear: a };
    }
  }
  return { linea };
}

export function textoABloques(texto: string): Bloque[] {
  const bloques: Bloque[] = [];

  for (const trozo of texto.split(/\n\s*\n/)) {
    const crudas = trozo
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (crudas.length === 0) continue;

    // La colocación se escribe una vez, al principio del bloque, y vale para
    // todo él: una lista centrada a medias no es nada que nadie quiera.
    const primera = sacarAlineacion(crudas[0]);
    const alinear = primera.alinear;
    const con = alinear ? { alinear } : {};
    const lineas = [primera.linea, ...crudas.slice(1)].filter(Boolean);
    if (lineas.length === 0) continue;

    if (/^-{3,}$/.test(lineas[0])) {
      bloques.push({ tipo: "separador" });
      const resto = lineas.slice(1);
      if (resto.length > 0) bloques.push({ tipo: "p", texto: resto.join(" "), ...con });
      continue;
    }

    const foto = lineas[0].match(/^\[foto:([^\]]+)\]\s*(.*)$/);
    if (foto) {
      const pie = foto[2].trim();
      bloques.push({
        tipo: "figura",
        fotoId: foto[1].trim(),
        ...(pie ? { pie } : {}),
        ...con,
      });
      continue;
    }

    // El rótulo es de una línea: lo que venga detrás en el mismo trozo es el
    // párrafo que va debajo, no parte del rótulo.
    const titulo = lineas[0].match(/^(#{1,6})\s+(.+)$/);
    if (titulo) {
      bloques.push({
        tipo: "titulo",
        nivel: titulo[1].length as NivelDeTitulo,
        texto: titulo[2].trim(),
        ...con,
      });
      const resto = lineas.slice(1);
      if (resto.length > 0) bloques.push({ tipo: "p", texto: resto.join(" "), ...con });
      continue;
    }

    const numerada = /^\d+[.)]\s+/.test(lineas[0]);
    if (numerada || lineas[0].startsWith("- ")) {
      // Una línea que no empiece por raya o número, dentro de una lista, es la
      // continuación del punto anterior: se escribe largo y se corta solo.
      const puntos: string[] = [];
      for (const l of lineas) {
        const conNumero = l.match(/^\d+[.)]\s+(.*)$/);
        if (numerada && conNumero) puntos.push(conNumero[1].trim());
        else if (!numerada && l.startsWith("- ")) puntos.push(l.slice(2).trim());
        else if (puntos.length > 0) puntos[puntos.length - 1] += ` ${l}`;
      }
      if (puntos.length > 0) {
        bloques.push({ tipo: "lista", puntos, ...(numerada ? { numerada } : {}), ...con });
        continue;
      }
    }

    if (lineas[0].startsWith(">")) {
      const cuerpo: string[] = [];
      let firma: string | undefined;
      for (const l of lineas) {
        if (l.startsWith("—") || l.startsWith("--")) firma = l.replace(/^(—|--)\s*/, "");
        else cuerpo.push(l.replace(/^>\s*/, ""));
      }
      bloques.push({
        tipo: "cita",
        texto: cuerpo.join(" "),
        ...(firma ? { firma } : {}),
        ...con,
      });
      continue;
    }

    bloques.push({ tipo: "p", texto: lineas.join(" "), ...con });
  }

  return bloques;
}

/** El camino de vuelta, para rellenar el editor. */
export function bloquesATexto(json: string) {
  let bloques: Bloque[] = [];
  try {
    const v = JSON.parse(json);
    if (Array.isArray(v)) bloques = v as Bloque[];
  } catch {
    return "";
  }

  return bloques
    .map((b) => {
      if (b.tipo === "separador") return "---";

      const marca = b.alinear ? MARCA_DE_ALINEACION[b.alinear] : "";
      if (b.tipo === "titulo") return `${marca}${"#".repeat(b.nivel ?? 2)} ${b.texto}`;
      if (b.tipo === "lista") {
        return b.puntos
          .map((p, i) => `${i === 0 ? marca : ""}${b.numerada ? `${i + 1}. ` : "- "}${p}`)
          .join("\n");
      }
      if (b.tipo === "cita") {
        return `${marca}> ${b.texto}${b.firma ? `\n— ${b.firma}` : ""}`;
      }
      if (b.tipo === "figura") {
        return `${marca}[foto:${b.fotoId}]${b.pie ? ` ${b.pie}` : ""}`;
      }
      return `${marca}${b.texto}`;
    })
    .join("\n\n");
}

export function leerBloques(json: string): Bloque[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as Bloque[]) : [];
  } catch {
    return [];
  }
}
