import { notFound, permanentRedirect } from "next/navigation";

import { destinoDe } from "@/lib/redirecciones";

export const dynamic = "force-dynamic";

/**
 * Lo último que se prueba con una dirección que no ha encontrado nada.
 *
 * Existe por las direcciones de Blogger —`/2019/03/algo.html`—, que no se
 * parecen a ninguna ruta de este sitio y por eso no las recogía nadie: el
 * importador las guardaba en `Redireccion` y ahí se quedaban, sin que ningún
 * visitante llegara a usarlas nunca. Aquí se leen, y quien venga con un enlace
 * guardado de hace años acaba donde tiene que acabar.
 *
 * Es lo último en probarse: cualquier ruta de verdad del sitio gana a un
 * comodín, así que esto sólo corre con lo que iba a ser un 404 de todas
 * formas. Va dentro del grupo `(sitio)` para que ese 404, cuando lo sea, salga
 * con la cabecera y el pie puestos.
 */
export default async function QuizasSeMudo(props: PageProps<"/[...ruta]">) {
  const { ruta } = await props.params;

  const destino = await destinoDe("/" + ruta.map(decodeURIComponent).join("/"));
  if (destino) permanentRedirect(destino);

  notFound();
}
