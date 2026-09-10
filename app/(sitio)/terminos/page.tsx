import type { Metadata } from "next";

import { PaginaLegal } from "@/components/sitio/PaginaLegal";
import { sinMarcas } from "@/lib/enlaces";
import { legalDelSitio } from "@/lib/legalesDelSitio";
import { metadatos } from "@/lib/sitio";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const pagina = await legalDelSitio("terminos");

  return await metadatos({
    titulo: pagina.titulo,
    descripcion: sinMarcas(pagina.entradilla),
    ruta: "/terminos",
  });
}

/** El texto y el interruptor salen de /admin/legales. Ver `components/sitio/PaginaLegal.tsx`. */
export default function Pagina() {
  return <PaginaLegal clave="terminos" />;
}
