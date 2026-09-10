import { enCache } from "@/lib/cache";
import {
  CLAVE_PAGINAS,
  type Paginas,
  PAGINAS_POR_DEFECTO,
} from "@/lib/paginas";
import { prisma } from "@/lib/prisma";

/**
 * Qué páginas opcionales están encendidas.
 *
 * La pide el marco en cada visita —el menú necesita saber si la página
 * existe—, así que va por la caché; el panel la tira al guardar.
 *
 * Lo que no esté escrito se da por encendido: un sitio recién puesto las
 * enseña todas, y un JSON roto —editado a mano en la base— devuelve el sitio
 * entero en vez de dejarlo sin navegación.
 */
async function consultar(): Promise<Paginas> {
  try {
    const fila = await prisma.ajuste.findUnique({ where: { clave: CLAVE_PAGINAS } });
    if (!fila?.valor) return { ...PAGINAS_POR_DEFECTO };

    // `series` sigue apareciendo en lo guardado de antes y se ignora: ese
    // índice ya no existe. `cuaderno` es como se llamaba «entradas» hasta que
    // se renombró: un ajuste con el nombre viejo se sigue entendiendo, para
    // que una página apagada entonces no se encienda sola.
    const leido = JSON.parse(fila.valor) as Partial<Paginas> & {
      cuaderno?: boolean;
      series?: boolean;
    };
    return { entradas: (leido.entradas ?? leido.cuaderno) !== false };
  } catch {
    return { ...PAGINAS_POR_DEFECTO };
  }
}

export function paginasDelSitio(): Promise<Paginas> {
  return enCache("sitio:paginas", 300, consultar);
}

/** Sin caché: el panel lee lo que hay en la base al abrir la sección. */
export function paginasGuardadas(): Promise<Paginas> {
  return consultar();
}
