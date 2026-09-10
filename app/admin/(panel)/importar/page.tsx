import { ImportarDeBlogger } from "@/components/panel/ImportarDeBlogger";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Importar de Blogger" };

export default async function Importar() {
  const [series, yaImportadas, redirecciones] = await Promise.all([
    prisma.serie.findMany({ orderBy: { orden: "asc" }, select: { id: true, nombre: true } }),
    prisma.entrada.count({ where: { urlAntigua: { not: null } } }),
    prisma.redireccion.count(),
  ]);

  return (
    <ImportarDeBlogger
      series={series}
      yaImportadas={yaImportadas}
      redirecciones={redirecciones}
    />
  );
}
