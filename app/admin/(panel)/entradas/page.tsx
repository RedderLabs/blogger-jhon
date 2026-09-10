import Link from "next/link";

import { InterruptorDePagina } from "@/components/panel/InterruptorDePagina";
import { ListaDeEntradas } from "@/components/panel/ListaDeEntradas";
import { fechaFicha } from "@/lib/fotos";
import { paginasGuardadas } from "@/lib/paginasDelSitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Entradas" };

export default async function EntradasDelPanel() {
  const [entradas, paginas] = await Promise.all([
    prisma.entrada.findMany({
      orderBy: [{ publicadoEn: "desc" }, { creadaEn: "desc" }],
      include: {
        temas: { include: { tema: true } },
        series: { include: { serie: { select: { nombre: true } } } },
      },
    }),
    paginasGuardadas(),
  ]);

  // La lista se marca con casillas y eso pide cliente. Se le da lo justo y ya
  // masticado: la fecha hecha texto y los temas en una sola línea.
  const enLista = entradas.map((e) => ({
    id: e.id,
    slug: e.slug,
    titulo: e.titulo,
    estado: e.estado,
    fecha: e.publicadoEn ? fechaFicha(e.publicadoEn) : "—",
    temas: e.temas.map((t) => t.tema.nombre).join(" · "),
    palabras: e.palabras,
  }));

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-papel">Entradas</p>
        <Link
          href="/entradas"
          target="_blank"
          className="ml-auto font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
        >
          Ver /entradas ↗
        </Link>
        <Link href="/admin/entradas/nueva" className="btn btn-p">
          Entrada nueva
        </Link>
      </header>

      <InterruptorDePagina clave="entradas" visible={paginas.entradas} />

      <ListaDeEntradas entradas={enLista} />
    </>
  );
}
