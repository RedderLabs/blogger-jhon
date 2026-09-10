import Link from "next/link";

import { EditorDeUnPercance } from "@/components/panel/EditorDeUnPercance";
import type { FotoElegible } from "@/components/panel/SelectorDeFoto";
import { CATALOGO } from "@/lib/percances";
import { fotosDeLosPercances, percanceGuardado } from "@/lib/percancesDelSitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Páginas de error" };

/**
 * Lo que lee quien se ha topado con una dirección rota o con un fallo del
 * servidor. Se escriben aquí porque son páginas del sitio como las demás: la
 * de 404 es, de hecho, de las más visitadas de cualquier web que viene de una
 * mudanza, y dejarla con el texto de fábrica es desaprovecharla.
 */
export default async function ErroresDelPanel() {
  const [noEncontrada, fallo, fotoDe, publicadas, rollos] = await Promise.all([
    percanceGuardado("404"),
    percanceGuardado("500"),
    fotosDeLosPercances(),
    // Todo el archivo, publicadas y en borrador: si una fotografía existe
    // tiene que poder elegirse. A la página no llega sin publicar, y de eso
    // avisa el editor.
    prisma.foto.findMany({
      orderBy: [{ fecha: "desc" }, { creadaEn: "desc" }],
      select: {
        id: true,
        archivo: true,
        titulo: true,
        alt: true,
        estado: true,
        orden: true,
        rollo: { select: { codigo: true } },
        series: {
          orderBy: { principal: "desc" },
          take: 1,
          include: { serie: { select: { nombre: true } } },
        },
      },
    }),
    prisma.rollo.findMany({
      orderBy: { fecha: "desc" },
      take: 60,
      select: { id: true, codigo: true },
    }),
  ]);

  const fotos: FotoElegible[] = publicadas.map((f) => ({
    id: f.id,
    archivo: f.archivo,
    titulo: f.titulo,
    alt: f.alt,
    estado: f.estado,
    rollo: f.rollo.codigo,
    orden: f.orden,
    serie: f.series[0]?.serie.nombre ?? null,
  }));

  const paginas = { "404": noEncontrada, "500": fallo } as const;

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">Páginas de error</span> · lo que se lee
          cuando algo no sale
        </p>
        <Link
          href="/no-existe-esta-direccion"
          target="_blank"
          className="ml-auto font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
        >
          Ver la de 404 ↗
        </Link>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        <p className="m-0 max-w-[70ch] text-[.9375rem] leading-relaxed text-dato">
          Dos páginas que no se buscan pero se encuentran. La primera la ve
          quien llega con un enlace roto —del blog antiguo, de un buscador, de
          un mensaje viejo—, y es la que más se lee de las dos; la segunda sólo
          sale si algo se rompe por dentro.
        </p>

        {CATALOGO.map((p) => (
          <EditorDeUnPercance
            key={p.clave}
            clave={p.clave}
            datos={paginas[p.clave]}
            fotoId={fotoDe[p.clave]}
            fotos={fotos}
            rollos={rollos}
          />
        ))}
      </div>
    </>
  );
}
