import { MesaDeLuz } from "@/components/panel/MesaDeLuz";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Mesa(props: PageProps<"/admin">) {
  const { rollo: rolloPedido } = await props.searchParams;

  const rollos = await prisma.rollo.findMany({
    orderBy: { fecha: "desc" },
    select: { id: true, codigo: true, fecha: true, _count: { select: { fotos: true } } },
  });

  const idElegido =
    typeof rolloPedido === "string" && rollos.some((r) => r.id === rolloPedido)
      ? rolloPedido
      : rollos[0]?.id;

  const [rollo, series] = await Promise.all([
    idElegido
      ? prisma.rollo.findUnique({
          where: { id: idElegido },
          include: {
            fotos: {
              orderBy: { orden: "asc" },
              include: {
                series: {
                  orderBy: { principal: "desc" },
                  include: { serie: { select: { id: true, nombre: true } } },
                },
              },
            },
          },
        })
      : null,
    prisma.serie.findMany({
      orderBy: { orden: "asc" },
      include: { _count: { select: { fotos: true } } },
    }),
  ]);

  if (!rollo) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="grid max-w-[46ch] gap-3 text-center">
          <p className="font-serif text-[1.8rem] font-bold">La mesa está vacía</p>
          <p className="text-dato">
            Todavía no hay ningún rollo. Sube el primer lote de escaneos y aparecerá aquí
            para repartirlo en series.
          </p>
        </div>
      </div>
    );
  }

  return (
    <MesaDeLuz
      rollo={{
        id: rollo.id,
        codigo: rollo.codigo,
        fecha: rollo.fecha.toISOString(),
        camara: rollo.camara ?? "",
        optica: rollo.optica ?? "",
        pelicula: rollo.pelicula ?? "",
        revelado: rollo.revelado ?? "",
      }}
      rollos={rollos.map((r) => ({
        id: r.id,
        codigo: r.codigo,
        cuantas: r._count.fotos,
      }))}
      fotos={rollo.fotos.map((f) => ({
        id: f.id,
        orden: f.orden,
        archivo: f.archivo,
        alt: f.alt,
        titulo: f.titulo,
        estado: f.estado,
        anchoMax: f.anchoMax,
        series: f.series.map((s) => ({ id: s.serie.id, nombre: s.serie.nombre })),
      }))}
      series={series.map((s, i) => ({
        id: s.id,
        numero: `S/${String(i + 1).padStart(2, "0")}`,
        nombre: s.nombre,
        cuantas: s._count.fotos,
      }))}
    />
  );
}
