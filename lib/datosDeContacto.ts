import { enCache } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { type CuentaEnRed, red } from "@/lib/redes";

export type DatosDeContacto = {
  /** Vacío = no se enseña. Entonces sólo queda el formulario. */
  correo: string;
  /** En el orden en que se hayan colocado en el panel. */
  redes: CuentaEnRed[];
};

export const CLAVE_CORREO = "sitio.correo";
export const CLAVE_REDES = "sitio.redes";

/**
 * Cómo te encuentran, tal y como se haya escrito en el panel. Vive en
 * `Ajuste` y no en el código para que se corrija sin tocar un fichero ni
 * volver a desplegar.
 */
async function consultarDatos(): Promise<DatosDeContacto> {
  const filas = await prisma.ajuste.findMany({
    where: { clave: { in: [CLAVE_CORREO, CLAVE_REDES] } },
  });
  const valor = (clave: string) =>
    filas.find((f) => f.clave === clave)?.valor?.trim() ?? "";

  return { correo: valor(CLAVE_CORREO), redes: leerRedes(valor(CLAVE_REDES)) };
}

/** Cambia una vez al año: se guarda cinco minutos y el panel la tira al editar. */
export function datosDeContacto(): Promise<DatosDeContacto> {
  return enCache("sitio:contacto", 300, consultarDatos);
}

/**
 * Lo guardado es JSON. Si algo viene torcido —una red que ya no está en el
 * catálogo, un valor vacío— se descarta esa fila y el resto sigue saliendo:
 * la página de contacto no se cae por un dato mal escrito.
 */
function leerRedes(bruto: string): CuentaEnRed[] {
  if (!bruto) return [];
  try {
    const leido = JSON.parse(bruto);
    if (!Array.isArray(leido)) return [];
    return leido
      .map((f) => ({ red: String(f?.red ?? ""), valor: String(f?.valor ?? "").trim() }))
      .filter((f) => f.valor && red(f.red));
  } catch {
    return [];
  }
}
