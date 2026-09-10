import type { Metadata } from "next";
import Link from "next/link";

import {
  type Acontecimiento,
  FilaDeArchivo,
} from "@/components/sitio/FilaDeArchivo";
import { MesPlegable } from "@/components/sitio/MesPlegable";
import { Pie } from "@/components/sitio/Pie";
import { OBRA_PUBLICADA } from "@/lib/consultas";
import { entradillasDelSitio } from "@/lib/entradillasDelSitio";
import { nombreMes } from "@/lib/fotos";
import { metadatos } from "@/lib/sitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return metadatos({
    titulo: "Archivo",
    descripcion:
      "Todo lo publicado, por fecha, como estaba en el blog. Cada entrada conserva su día y su dirección antigua sigue funcionando.",
    ruta: "/archivo",
  });
}

export default async function Archivo(props: PageProps<"/archivo">) {
  const { ano } = await props.searchParams;
  const anoElegido = typeof ano === "string" ? Number(ano) : null;

  // El párrafo de debajo del título se escribe en /admin/ajustes.
  const { archivo: entradilla } = await entradillasDelSitio();

  const [entradas, rollos] = await Promise.all([
    prisma.entrada.findMany({
      where: { estado: "publica", publicadoEn: { not: null } },
      orderBy: { publicadoEn: "desc" },
      include: {
        imagen: { select: { archivo: true } },
        temas: { include: { tema: true } },
      },
    }),
    // Sólo los rollos que llevan obra dentro. Un rollo abierto para colgar la
    // fotografía de la portada no es un acontecimiento del archivo: es un
    // fichero del sitio, y salía aquí como una fila «Sin serie».
    prisma.rollo.findMany({
      where: { fotos: { some: OBRA_PUBLICADA } },
      orderBy: { fecha: "desc" },
      include: {
        fotos: {
          where: OBRA_PUBLICADA,
          orderBy: { orden: "asc" },
          include: {
            series: {
              orderBy: { principal: "desc" },
              take: 1,
              include: { serie: { select: { nombre: true, slug: true } } },
            },
          },
        },
      },
    }),
  ]);

  const todo: Acontecimiento[] = [
    ...entradas.map((e) => ({
      id: e.id,
      fecha: e.publicadoEn!,
      titulo: e.titulo,
      // Un texto se distingue de un rollo por el título y por no tener
      // recuento, así que no hace falta rotularlo: sólo su tema, si lo tiene.
      destino: e.temas[0]?.tema.nombre ?? "",
      href: `/entradas/${e.slug}`,
      cuantas: "",
      miniatura: e.imagen?.archivo ?? null,
    })),
    ...rollos.map((r) => {
      const primera = r.fotos[0];
      const serie = primera?.series[0]?.serie;
      return {
        id: r.id,
        fecha: r.fecha,
        titulo: r.notas ? `${r.codigo} — ${r.notas.split(".")[0]}` : r.codigo,
        destino: serie ? serie.nombre : "Sin serie",
        // Sin serie no hay adonde ir: la fotografia vive en la pagina de su
        // serie, y el indice al que se mandaban antes estas filas ya no
        // existe. La fila se pinta igual, pero no es un enlace.
        href: serie ? `/series/${serie.slug}` : null,
        cuantas: `${r.fotos.length} ${r.fotos.length === 1 ? "foto" : "fotos"}`,
        miniatura: primera?.archivo ?? null,
      };
    }),
  ].sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  const anos = [...new Set(todo.map((t) => t.fecha.getUTCFullYear()))].sort((a, b) => b - a);
  const activo = anoElegido && anos.includes(anoElegido) ? anoElegido : (anos[0] ?? null);
  const delAno = todo.filter((t) => t.fecha.getUTCFullYear() === activo);

  // Agrupado por mes, conservando el orden descendente.
  const meses: { nombre: string; cosas: Acontecimiento[] }[] = [];
  for (const cosa of delAno) {
    const nombre = nombreMes(cosa.fecha);
    const ultimo = meses[meses.length - 1];
    if (ultimo && ultimo.nombre === nombre) ultimo.cosas.push(cosa);
    else meses.push({ nombre, cosas: [cosa] });
  }

  return (
    <>
      <header className="ancho-sitio grid gap-4 px-5 pt-12 pb-8 sm:px-8 sm:pt-16 lg:px-12">
        <p className="lbl lbl-sitio flex items-center gap-3">
          <span>El orden de siempre</span>
          <span className="h-px flex-1 bg-filo" />
        </p>
        <h1 className="font-serif text-[2.4rem] leading-none font-bold tracking-[-.02em] sm:text-[3rem] lg:text-[3.4rem]">
          Archivo
        </h1>
        <p className="max-w-[66ch] text-papel-2">{entradilla}</p>
      </header>

      {anos.length > 0 && (
        <div className="ancho-sitio flex flex-wrap items-center gap-x-5 gap-y-3 px-5 pb-6 sm:px-8 lg:px-12">
          <span className="lbl">Año</span>
          <span className="flex flex-wrap">
            {anos.map((a) => (
              <Link
                key={a}
                href={`/archivo?ano=${a}`}
                scroll={false}
                className="seg"
                data-on={a === activo ? "si" : undefined}
              >
                {a}
              </Link>
            ))}
          </span>
          <span className="ml-auto font-mono text-[.72rem] tracking-[.08em] text-dato">
            {delAno.length} {delAno.length === 1 ? "entrada" : "entradas"} en {activo}
          </span>
        </div>
      )}

      <main className="ancho-sitio flex-1 px-5 sm:px-8 lg:px-12">
        {meses.length === 0 && (
          <p className="border border-dashed border-filo-2 px-6 py-16 text-center font-mono text-[.75rem] tracking-[.06em] text-dato">
            Todavía no hay nada publicado.
          </p>
        )}

        {meses.map((mes) => (
          <MesPlegable
            key={mes.nombre}
            nombre={mes.nombre}
            cuenta={`${mes.cosas.length} ${mes.cosas.length === 1 ? "entrada" : "entradas"}`}
          >
            {mes.cosas.map((cosa, i) => (
              <FilaDeArchivo key={cosa.id} cosa={cosa} prioridad={i === 0} />
            ))}
          </MesPlegable>
        ))}
      </main>

      <Pie />
    </>
  );
}
