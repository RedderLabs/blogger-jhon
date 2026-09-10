import { NoEncontrada } from "@/components/sitio/NoEncontrada";

export const dynamic = "force-dynamic";

/**
 * Lo que sale cuando una página del sitio llama a `notFound()`: una serie
 * oculta, un fotograma que no está en ella, la página de contacto apagada.
 *
 * Va dentro del grupo `(sitio)`, así que se pinta con la cabecera y la barra
 * de abajo ya puestas por la maqueta.
 */
export default function NoEncontradaDelSitio() {
  return <NoEncontrada />;
}
