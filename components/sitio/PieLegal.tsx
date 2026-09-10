import Link from "next/link";

import { CATALOGO } from "@/lib/legales";
import { legalesVisibles } from "@/lib/legalesDelSitio";
import { identidadDelSitio } from "@/lib/identidadDelSitio";

/**
 * La línea de letra pequeña del final: cookies, privacidad y términos.
 *
 * **Sólo escritorio**, igual que `Pie`. En móvil y tableta el final de la
 * página se deja limpio: allí la navegación vive en la barra del pulgar y una
 * tira de enlaces por debajo de ella sería peso muerto al final de cada
 * scroll. Es una decisión tomada a sabiendas de lo que cuesta —en pantalla
 * pequeña no hay ningún enlace que lleve a estas tres páginas, y se llega sólo
 * escribiendo la dirección o desde un buscador—, así que si algún día hay que
 * darles una puerta en móvil, el sitio donde ponerla es la cabecera, junto a
 * los atajos de `Nav`, y no aquí.
 *
 * Va aparte del pie de siempre y no dentro de él porque `Pie` lo pone cada
 * página por su cuenta y hay dos que no lo llevan; esto se pinta desde
 * `Marco`, que envuelve todas las públicas —la de dirección no encontrada
 * incluida—, de modo que no hay que acordarse de ponerlo.
 *
 * Si están las tres apagadas no se pinta nada: una barra con sólo el año
 * sería una línea que ocupa y no dice.
 */
export async function PieLegal() {
  const [visibles, identidad] = await Promise.all([
    legalesVisibles(),
    identidadDelSitio(),
  ]);

  const enlaces = CATALOGO.filter((p) => visibles[p.clave]);
  if (enlaces.length === 0) return null;

  return (
    <div className="hidden border-t border-filo px-5 py-5 sm:px-8 lg:block lg:px-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="m-0 font-mono text-[.66rem] tracking-[.08em] text-apagado">
          © {identidad.autor} · todos los derechos reservados
        </p>
        <nav aria-label="Letra pequeña" className="flex flex-wrap gap-x-6 gap-y-2">
          {enlaces.map((p) => (
            <Link
              key={p.clave}
              href={p.ruta}
              className="font-mono text-[.66rem] tracking-[.12em] text-dato uppercase hover:text-rojo"
            >
              {p.enlace}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
