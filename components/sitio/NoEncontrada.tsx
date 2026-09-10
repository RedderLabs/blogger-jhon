import Link from "next/link";

import { Percance, Salidas } from "@/components/sitio/Percance";
import { Pie } from "@/components/sitio/Pie";
import { TextoConEnlaces } from "@/components/sitio/TextoConEnlaces";
import { paginaDeContacto } from "@/lib/paginaContactoDelSitio";
import { percanceDelSitio } from "@/lib/percancesDelSitio";

const DESTINOS = [
  { href: "/", texto: "Portada" },
  { href: "/entradas", texto: "Entradas" },
  { href: "/archivo", texto: "Archivo por fechas" },
  { href: "/buscar", texto: "Buscar" },
  { href: "/contacto", texto: "Contacto", soloConContacto: true },
];

/**
 * La página de dirección no encontrada.
 *
 * El texto y la fotografía salen del panel (/admin/errores); los enlaces de
 * salida no, porque son la navegación del sitio y tienen que estar completos:
 * quien llega aquí casi siempre venía de un enlace viejo del blog, y lo más
 * útil que se le puede ofrecer es el buscador y el archivo por fechas, no un
 * botón de «volver» que el navegador ya tiene.
 */
export async function NoEncontrada() {
  const [pagina, contacto] = await Promise.all([
    percanceDelSitio("404"),
    paginaDeContacto(),
  ]);
  const salidas = DESTINOS.filter((d) => contacto.visible || !d.soloConContacto);

  return (
    <>
      <Percance
        codigo={pagina.codigo}
        rotulo={pagina.rotulo}
        titulo={pagina.titulo}
        imagen={pagina.imagen}
      >
        <TextoConEnlaces
          texto={pagina.texto}
          className="text-[1rem] leading-[1.75] text-papel-2 sm:text-[1.0625rem]"
        />

        <Salidas>
          {salidas.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="font-mono text-[.72rem] tracking-[.12em] text-dato uppercase hover:text-rojo"
            >
              {d.texto}
            </Link>
          ))}
        </Salidas>
      </Percance>

      <Pie />
    </>
  );
}
