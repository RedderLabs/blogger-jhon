import Link from "next/link";

import { EditorDeUnaLegal } from "@/components/panel/EditorDeUnaLegal";
import { CUANTOS_RASTREADORES } from "@/lib/ia";
import { CATALOGO } from "@/lib/legales";
import { legalGuardada } from "@/lib/legalesDelSitio";

export const dynamic = "force-dynamic";

export const metadata = { title: "Letra pequeña" };

/**
 * Las tres páginas que ninguna web quiere escribir y todas tienen que tener.
 *
 * Están juntas porque se escriben de una sentada y porque se contradicen entre
 * ellas con una facilidad pasmosa cuando viven separadas: la de cookies dice
 * que no hay cookies, la de privacidad dice qué se guarda, y las dos tienen
 * que decir lo mismo. Leerlas seguidas es la única manera de verlo.
 *
 * Cada una viene ya escrita desde lo que este sitio hace de verdad, y no de
 * una plantilla: si no se toca nada, lo que se publica ya es cierto. Lo único
 * que hay que poner a mano es quién firma, en la de privacidad.
 */
export default async function LegalesDelPanel() {
  const [cookies, privacidad, terminos] = await Promise.all([
    legalGuardada("cookies"),
    legalGuardada("privacidad"),
    legalGuardada("terminos"),
  ]);

  const paginas = { cookies, privacidad, terminos } as const;
  const apagadas = CATALOGO.filter((p) => !paginas[p.clave].visible);

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">Letra pequeña</span> · cookies,
          privacidad y términos
        </p>
        <span className="ml-auto font-mono text-[.7rem] tracking-[.08em] text-apagado">
          {apagadas.length === 0
            ? "las tres encendidas"
            : `${apagadas.length} ${apagadas.length === 1 ? "apagada" : "apagadas"}`}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="grid max-w-[74ch] gap-3">
          <p className="m-0 text-[.9375rem] leading-relaxed text-dato">
            Vienen escritas desde lo que este sitio hace de verdad: no pone
            ninguna cookie, cuenta las visitas con un contador propio que no
            identifica a nadie, guarda los escaneos originales en un almacén
            cerrado y le cierra la puerta a {CUANTOS_RASTREADORES} rastreadores
            de I.A. por su nombre. Si no tocas nada, lo que se publica ya es
            cierto.
          </p>
          <p className="m-0 text-[.9375rem] leading-relaxed text-dato">
            Lo único que hay que poner a mano es el primer punto de la política
            de privacidad: quién firma, con nombre y una dirección donde se le
            pueda escribir.
            Está avisado dentro. Y esto es un punto de partida honesto, no el
            dictamen de un abogado: si el sitio llega a vender copias o a
            recoger cualquier otra cosa, hay que volver aquí.
          </p>
          <p className="m-0 font-mono text-[.66rem] leading-relaxed tracking-[.02em] text-apagado">
            La lista de rastreadores bloqueados que sale en los términos no está
            escrita en el texto: se lee del mismo sitio del que sale{" "}
            <Link href="/robots.txt" target="_blank" className="underline hover:text-papel">
              robots.txt
            </Link>
            , así que no puede quedarse desfasada por olvido.
          </p>
        </div>

        {CATALOGO.map((p) => (
          <EditorDeUnaLegal key={p.clave} clave={p.clave} datos={paginas[p.clave]} />
        ))}
      </div>
    </>
  );
}
