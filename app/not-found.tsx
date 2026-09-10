import { Marco } from "@/components/sitio/Marco";
import { NoEncontrada } from "@/components/sitio/NoEncontrada";

export const dynamic = "force-dynamic";

/**
 * Lo que sale ante cualquier dirección que no existe en todo el sitio.
 *
 * Este fichero está en la raíz, fuera del grupo `(sitio)`, así que no le llega
 * su maqueta: por eso se pone el marco a mano. El `not-found` del grupo —el de
 * las páginas que llaman a `notFound()`— ya está dentro y no lo repite.
 */
export default function NoEncontradaGlobal() {
  return (
    <Marco>
      <NoEncontrada />
    </Marco>
  );
}
