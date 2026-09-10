import { enCache } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { CLAVE_TEXTO, type SobreMi, SOBRE_MI } from "@/lib/sobreMi";

/** Una copia del texto de fábrica, para que nadie pueda tocar el original. */
const deFabrica = (): SobreMi => ({
  titulo: SOBRE_MI.titulo,
  entradilla: SOBRE_MI.entradilla,
  secciones: SOBRE_MI.secciones.map((s) => ({
    titulo: s.titulo,
    parrafos: [...s.parrafos],
  })),
});

/**
 * El texto de /sobre-mi tal y como se haya escrito en el panel.
 *
 * Las secciones no son un campo más: son una lista que crece y mengua, así
 * que se guarda entera en JSON, como el aviso. Si lo guardado viene torcido
 * —editado a mano en la base, por ejemplo— sale el de fábrica en lugar de
 * tumbar la página.
 *
 * Quedarse sin secciones es una decisión legítima, no un error: la página se
 * monta con el título, la entradilla y la ficha del archivo.
 */
async function consultarTexto(): Promise<SobreMi> {
  const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_TEXTO } });
  if (!fila?.valor) return deFabrica();

  try {
    const leido = JSON.parse(fila.valor) as Partial<SobreMi>;
    if (!Array.isArray(leido.secciones)) throw new Error("sin secciones");

    return {
      titulo: leido.titulo?.trim() || SOBRE_MI.titulo,
      entradilla: leido.entradilla?.trim() || SOBRE_MI.entradilla,
      secciones: leido.secciones
        .map((s) => ({
          titulo: String(s?.titulo ?? "").trim(),
          parrafos: (Array.isArray(s?.parrafos) ? s.parrafos : [])
            .map((p) => String(p ?? "").trim())
            .filter(Boolean),
        }))
        .filter((s) => s.titulo || s.parrafos.length > 0),
    };
  } catch {
    return deFabrica();
  }
}

/** Lo pide la página en cada visita, así que va por la caché; el panel la tira al guardar. */
export function textoDeSobreMi(): Promise<SobreMi> {
  return enCache("sobre-mi:texto", 300, consultarTexto);
}

/**
 * Lo mismo, sin caché: el panel lo lee una vez al abrir el formulario y tiene
 * que ver lo que hay en la base, no lo que quedó guardado hace un rato.
 */
export function textoGuardadoDeSobreMi(): Promise<SobreMi> {
  return consultarTexto();
}

/** Si hay texto propio o la página sigue con el de fábrica. */
export async function hayTextoPropio(): Promise<boolean> {
  const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_TEXTO } });
  return Boolean(fila?.valor);
}
