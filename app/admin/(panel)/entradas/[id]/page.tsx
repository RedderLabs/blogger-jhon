import { notFound } from "next/navigation";

import { EditorDeEntrada } from "@/components/panel/EditorDeEntrada";
import { bloquesAHtml, sonBloques } from "@/lib/cuerpo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditarEntrada(
  props: PageProps<"/admin/entradas/[id]">,
) {
  const { id } = await props.params;
  const esNueva = id === "nueva";

  const [entrada, temas, series, fotos] = await Promise.all([
    esNueva
      ? null
      : prisma.entrada.findUnique({
          where: { id },
          include: { temas: true, series: true },
        }),
    prisma.tema.findMany({ orderBy: { nombre: "asc" } }),
    prisma.serie.findMany({ orderBy: { orden: "asc" }, select: { id: true, nombre: true } }),
    // El archivo entero, borradores incluidos: si una fotografía está en la
    // galería tiene que poder ponerse en un texto. Casi todo lo que llegó del
    // blog está en borrador, y exigir publicarla antes obligaba a salir del
    // editor para volver. La rejilla marca cuáles lo están.
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
  ]);

  if (!esNueva && !entrada) notFound();

  return (
    <EditorDeEntrada
      entrada={
        entrada
          ? {
              id: entrada.id,
              slug: entrada.slug,
              titulo: entrada.titulo,
              kicker: entrada.kicker ?? "",
              // Las entradas escritas con el sistema de antes se convierten
              // al abrirlas; la primera vez que se guarden quedan ya en HTML.
              texto: sonBloques(entrada.cuerpo)
                ? bloquesAHtml(entrada.cuerpo)
                : entrada.cuerpo,
              estado: entrada.estado,
              // Día y hora, no sólo el día: es lo que pide la casilla de
              // programar. Los dieciséis primeros caracteres de un ISO son
              // justo «2026-08-26T18:30», que es lo que come un
              // `datetime-local`. En UTC, como el resto de las fechas.
              publicadoEn: entrada.publicadoEn
                ? entrada.publicadoEn.toISOString().slice(0, 16)
                : "",
              imagenId: entrada.imagenId ?? "",
              temas: entrada.temas.map((t) => t.temaId),
              series: entrada.series.map((s) => s.serieId),
            }
          : null
      }
      temas={temas}
      series={series}
      fotos={fotos.map((f) => ({
        id: f.id,
        archivo: f.archivo,
        titulo: f.titulo,
        alt: f.alt,
        estado: f.estado,
        rollo: f.rollo.codigo,
        orden: f.orden,
        serie: f.series[0]?.serie.nombre ?? null,
      }))}
    />
  );
}
