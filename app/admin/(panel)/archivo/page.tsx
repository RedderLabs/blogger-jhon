import Image from "next/image";
import Link from "next/link";

import { IconoBuscar } from "@/components/Iconos";
import { dosDigitos, fechaFicha } from "@/lib/fotos";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Archivo" };

const FILTROS = [
  { clave: "todas", texto: "Todas" },
  { clave: "publicadas", texto: "Publicadas" },
  { clave: "borradores", texto: "Borradores" },
  { clave: "sin-serie", texto: "Sin serie" },
  { clave: "sin-alt", texto: "Sin alt" },
] as const;

export default async function ArchivoDelPanel(props: PageProps<"/admin/archivo">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const filtro = typeof sp.f === "string" ? sp.f : "todas";

  const condiciones: Prisma.FotoWhereInput[] = [];
  if (filtro === "publicadas") condiciones.push({ estado: "publicada" });
  if (filtro === "borradores") condiciones.push({ estado: "borrador" });
  if (filtro === "sin-serie") condiciones.push({ series: { none: {} } });
  if (filtro === "sin-alt") condiciones.push({ alt: "" });
  if (q) {
    condiciones.push({
      OR: [
        { titulo: { contains: q } },
        { alt: { contains: q } },
        { nota: { contains: q } },
        { camara: { contains: q } },
        { optica: { contains: q } },
        { pelicula: { contains: q } },
        { revelado: { contains: q } },
        { lugar: { contains: q } },
      ],
    });
  }

  const donde: Prisma.FotoWhereInput = condiciones.length ? { AND: condiciones } : {};

  const [fotos, total] = await Promise.all([
    prisma.foto.findMany({
      where: donde,
      orderBy: [{ fecha: "desc" }, { orden: "asc" }],
      take: 200,
      include: {
        rollo: { select: { codigo: true } },
        series: {
          orderBy: { principal: "desc" },
          include: { serie: { select: { nombre: true } } },
        },
      },
    }),
    prisma.foto.count(),
  ]);

  const conParam = (clave: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (clave !== "todas") p.set("f", clave);
    const s = p.toString();
    return s ? `/admin/archivo?${s}` : "/admin/archivo";
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-papel">Archivo</p>
        <form action="/admin/archivo" className="flex items-center gap-2 border border-filo px-[.65rem] py-[.28rem] lg:ml-auto lg:w-[280px]">
          <IconoBuscar tam={13} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tri-X, cementerio, Summicron…"
            aria-label="Buscar en el archivo"
            className="border-0 bg-transparent p-0 font-mono text-[.7rem] tracking-[.06em] focus:outline-none"
          />
          {filtro !== "todas" && <input type="hidden" name="f" value={filtro} />}
        </form>
      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-filo px-4 py-3 sm:px-6">
        <span className="flex flex-wrap">
          {FILTROS.map((f) => (
            <Link
              key={f.clave}
              href={conParam(f.clave)}
              className="seg"
              data-on={filtro === f.clave ? "si" : undefined}
            >
              {f.texto}
            </Link>
          ))}
        </span>
        <span className="ml-auto font-mono text-[.7rem] tracking-[.08em] text-dato">
          {fotos.length} de {total}
          {fotos.length === 200 ? " (primeras 200)" : ""}
        </span>
      </div>

      <div className="scroll-fino flex-1 p-4 sm:p-6 lg:overflow-y-auto">
        {fotos.length === 0 ? (
          <p className="border border-dashed border-filo-2 px-6 py-16 text-center font-mono text-[.75rem] tracking-[.06em] text-dato">
            Nada con ese filtro.
          </p>
        ) : (
          <div className="border-t border-filo">
            {fotos.map((f) => (
              <Link
                key={f.id}
                href={`/admin/foto/${f.id}`}
                className="group grid grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-b border-filo px-1 py-2 hover:bg-[rgb(237_231_222/.035)] lg:grid-cols-[3rem_96px_minmax(0,1fr)_13rem_7rem_6rem_5rem] lg:gap-x-5"
              >
                <span className="hidden font-mono text-[.7rem] tracking-[.1em] text-dato group-hover:text-rojo lg:block">
                  {dosDigitos(f.orden)}
                </span>

                <span className="relative row-span-3 block h-[52px] w-[96px] bg-marco lg:row-span-1">
                  <Image
                    src={f.archivo}
                    alt=""
                    fill
                    quality={70}
                    sizes="96px"
                    className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
                  />
                </span>

                <span className="min-w-0 truncate text-[.9375rem] group-hover:text-white">
                  {f.titulo}
                </span>

                <span className="col-start-2 truncate font-mono text-[.66rem] tracking-[.06em] text-dato lg:col-start-4">
                  {f.series.map((s) => s.serie.nombre).join(" · ") || "Sin serie"}
                </span>

                <span className="col-start-2 font-mono text-[.66rem] tracking-[.06em] text-dato lg:col-start-5">
                  {f.rollo.codigo} · {fechaFicha(f.fecha)}
                </span>

                <span className="hidden font-mono text-[.66rem] tracking-[.06em] lg:block">
                  {f.alt.trim() === "" ? (
                    <span className="text-rojo">sin alt</span>
                  ) : (
                    <span className="text-dato">alt ✓</span>
                  )}
                </span>

                <span
                  className="hidden font-mono text-[.625rem] tracking-[.11em] uppercase lg:block"
                  style={{
                    color:
                      f.estado === "publicada"
                        ? "var(--color-verde)"
                        : "var(--color-dato)",
                  }}
                >
                  {f.estado === "publicada" ? "Publicada" : "Borrador"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
