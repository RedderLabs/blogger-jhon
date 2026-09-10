import Link from "next/link";

import { PanelDeCategorias } from "@/components/panel/PanelDeCategorias";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Categorías" };

/**
 * Las categorías de las entradas.
 *
 * Son el modelo `Tema`: los mismos que filtran /entradas. Se listan por
 * nombre y no por uso porque esta página es para encontrar una y corregirla,
 * no para saber cuál gana.
 */
export default async function CategoriasDelPanel() {
  const temas = await prisma.tema.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { entradas: true } } },
  });

  const categorias = temas.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    slug: t.slug,
    cuantas: t._count.entradas,
  }));

  const sinUsar = categorias.filter((c) => c.cuantas === 0).length;

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">Categorías</span> · {categorias.length}
          {sinUsar > 0 && (
            <span className="text-apagado">
              {" "}
              · {sinUsar} sin usar
            </span>
          )}
        </p>
        <Link
          href="/admin/entradas"
          className="ml-auto font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
        >
          Ir a las entradas
        </Link>
      </header>

      <PanelDeCategorias categorias={categorias} />
    </>
  );
}
