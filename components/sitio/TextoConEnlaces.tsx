import { TextoConFormato } from "@/components/sitio/TextoConFormato";

/**
 * Un texto escrito en el panel, pintado en párrafos.
 *
 * Era el que sólo entendía `[texto](/ruta)`. Ahora es un nombre de paso hacia
 * `TextoConFormato`, que entiende lo mismo y además la negrita, la cursiva,
 * los subtítulos, las listas y las citas: lo que se escribe en la página de
 * contacto o en una legal se escribe igual que en una entrada, con los mismos
 * botones. Se mantiene el nombre porque es el que usan la página de contacto,
 * las legales y las de error, y ahí no cambia nada de lo que ya había escrito.
 *
 * No lleva "use client" ni estado: lo usan la página, que es de servidor, y la
 * vista previa del panel, que es de cliente.
 */
export function TextoConEnlaces({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  return <TextoConFormato texto={texto} className={className} />;
}
