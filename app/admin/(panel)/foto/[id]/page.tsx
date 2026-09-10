import { notFound } from "next/navigation";

import { FichaDeFoto } from "@/components/panel/FichaDeFoto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Ficha(props: PageProps<"/admin/foto/[id]">) {
  const { id } = await props.params;

  const foto = await prisma.foto.findUnique({
    where: { id },
    include: {
      rollo: {
        include: {
          fotos: {
            orderBy: { orden: "asc" },
            select: { id: true, orden: true, archivo: true },
          },
        },
      },
      series: { include: { serie: true } },
    },
  });
  if (!foto) notFound();

  const series = await prisma.serie.findMany({
    orderBy: { orden: "asc" },
    include: { _count: { select: { fotos: true } } },
  });

  const principal = foto.series.find((s) => s.principal) ?? foto.series[0];

  return (
    <FichaDeFoto
      foto={{
        id: foto.id,
        orden: foto.orden,
        archivo: foto.archivo,
        ancho: foto.ancho,
        alto: foto.alto,
        anchoMax: foto.anchoMax,
        titulo: foto.titulo,
        alt: foto.alt,
        nota: foto.nota ?? "",
        camara: foto.camara ?? "",
        optica: foto.optica ?? "",
        pelicula: foto.pelicula ?? "",
        ei: foto.ei ?? "",
        apertura: foto.apertura ?? "",
        velocidad: foto.velocidad ?? "",
        revelado: foto.revelado ?? "",
        escaneo: foto.escaneo ?? "",
        lugar: foto.lugar ?? "",
        estado: foto.estado,
      }}
      rollo={{
        id: foto.rollo.id,
        codigo: foto.rollo.codigo,
        tira: foto.rollo.fotos,
      }}
      series={series.map((s, i) => ({
        id: s.id,
        numero: `S/${String(i + 1).padStart(2, "0")}`,
        nombre: s.nombre,
        cuantas: s._count.fotos,
        puesta: foto.series.some((f) => f.serieId === s.id),
      }))}
      posicion={
        principal
          ? { serie: principal.serie.nombre, numero: principal.posicion }
          : null
      }
    />
  );
}
