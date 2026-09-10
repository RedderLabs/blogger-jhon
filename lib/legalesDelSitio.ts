import { enCache } from "@/lib/cache";
import {
  CLAVE_LEGAL,
  type ClaveLegal,
  deFabrica,
  type Legal,
  type LegalCompleta,
  type LegalesVisibles,
  type SeccionLegal,
  VISIBLES_POR_DEFECTO,
} from "@/lib/legales";
import { prisma } from "@/lib/prisma";

/**
 * El texto de una de las páginas de letra pequeña.
 *
 * Un campo en blanco vuelve al de fábrica y un JSON roto —editado a mano en la
 * base— devuelve la página entera de fábrica en vez de dejar una política de
 * privacidad medio vacía, que es de las pocas páginas de una web donde un
 * hueco tiene consecuencias.
 *
 * Quedarse sin secciones sí es una decisión legítima: quien quiera una página
 * de dos líneas la tiene. Por eso una lista vacía guardada se respeta, y lo
 * que se cae a fábrica es no haber guardado nunca nada.
 */
async function consultar(clave: ClaveLegal): Promise<LegalCompleta> {
  const fabrica = deFabrica(clave);

  try {
    const fila = await prisma.ajuste.findUnique({
      where: { clave: CLAVE_LEGAL[clave] },
    });
    if (!fila?.valor) return { visible: true, ...fabrica, actualizada: null };

    const leido = JSON.parse(fila.valor) as Partial<Legal>;

    const campo = (nombre: "titulo" | "entradilla") =>
      (typeof leido[nombre] === "string" ? leido[nombre].trim() : "") || fabrica[nombre];

    const secciones: SeccionLegal[] = Array.isArray(leido.secciones)
      ? leido.secciones
          .map((s) => ({
            titulo: String(s?.titulo ?? "").trim(),
            texto: String(s?.texto ?? "").trim(),
          }))
          .filter((s) => s.titulo || s.texto)
      : fabrica.secciones;

    return {
      visible: leido.visible !== false,
      titulo: campo("titulo"),
      entradilla: campo("entradilla"),
      secciones,
      actualizada: fila.actualizadoEn,
    };
  } catch {
    return { visible: true, ...fabrica, actualizada: null };
  }
}

/** Lo pide la página en cada visita, así que va por la caché; el panel la tira al guardar. */
export function legalDelSitio(clave: ClaveLegal): Promise<LegalCompleta> {
  return enCache(`sitio:legal:${clave}`, 300, () => consultar(clave));
}

/** Sin caché: el panel lee lo que hay en la base al abrir la sección. */
export function legalGuardada(clave: ClaveLegal): Promise<LegalCompleta> {
  return consultar(clave);
}

/**
 * Qué páginas legales están encendidas.
 *
 * Va en una sola consulta y con una sola entrada de caché a propósito: esto lo
 * pide el pie en cada visita del sitio, y tres lecturas por página para saber
 * si hay que pintar tres enlaces sería pagar de más por nada.
 *
 * Lo que no esté escrito se da por encendido, igual que en `lib/paginas.ts`.
 */
async function consultarVisibles(): Promise<LegalesVisibles> {
  try {
    const filas = await prisma.ajuste.findMany({
      where: { clave: { in: Object.values(CLAVE_LEGAL) } },
      select: { clave: true, valor: true },
    });

    const de = (clave: ClaveLegal) => {
      const fila = filas.find((f) => f.clave === CLAVE_LEGAL[clave]);
      if (!fila?.valor) return true;
      try {
        return (JSON.parse(fila.valor) as Partial<Legal>).visible !== false;
      } catch {
        // Un JSON roto deja la página en pie: la lectura de la propia página
        // la devuelve entera de fábrica, así que se puede enseñar.
        return true;
      }
    };

    return {
      cookies: de("cookies"),
      privacidad: de("privacidad"),
      terminos: de("terminos"),
    };
  } catch {
    return { ...VISIBLES_POR_DEFECTO };
  }
}

export function legalesVisibles(): Promise<LegalesVisibles> {
  return enCache("sitio:legales-visibles", 300, consultarVisibles);
}
