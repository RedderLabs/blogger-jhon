import Link from "next/link";

import { EditorDelRetrato } from "@/components/panel/EditorDelRetrato";
import { EditorDeSobreMi } from "@/components/panel/EditorDeSobreMi";
import type { FotoElegible } from "@/components/panel/SelectorDeFoto";
import { prisma } from "@/lib/prisma";
import { CLAVE_RETRATO } from "@/lib/sobreMi";
import { hayTextoPropio, textoGuardadoDeSobreMi } from "@/lib/sobreMiDelSitio";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sobre mí" };

const seleccion = {
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
} as const;

type Fila = {
  id: string;
  archivo: string;
  titulo: string;
  alt: string;
  estado: string;
  orden: number;
  rollo: { codigo: string };
  series: { serie: { nombre: string } }[];
};

const aElegible = (f: Fila): FotoElegible => ({
  id: f.id,
  archivo: f.archivo,
  titulo: f.titulo,
  alt: f.alt,
  estado: f.estado,
  rollo: f.rollo.codigo,
  orden: f.orden,
  serie: f.series[0]?.serie.nombre ?? null,
});

/**
 * Todo lo que se escribe de /sobre-mi: el texto con sus secciones y la
 * fotografía que lo acompaña. Se guardan por separado —son dos filas de
 * `Ajuste` y dos botones— porque casi nunca se cambian a la vez.
 *
 * Para el retrato se ofrece el archivo entero, en borrador incluido, y la que
 * esté puesta se añade a la lista aunque ya no esté: si no, abrir esta página
 * con un retrato viejo no enseñaría cuál es. Y si la que hace falta no está
 * todavía, se sube desde aquí mismo.
 */
export default async function SobreMiDelPanel() {
  const [texto, propio, ajuste, ultimas, rollos] = await Promise.all([
    textoGuardadoDeSobreMi(),
    hayTextoPropio(),
    prisma.ajuste.findUnique({
      where: { clave: CLAVE_RETRATO },
      include: { foto: { select: seleccion } },
    }),
    // Todo el archivo, publicadas y en borrador: el retrato del autor no
    // tiene por qué estar publicado, y si una fotografía existe tiene que
    // poder elegirse.
    prisma.foto.findMany({
      orderBy: [{ creadaEn: "desc" }, { orden: "asc" }],
      select: seleccion,
    }),
    prisma.rollo.findMany({
      orderBy: { fecha: "desc" },
      take: 60,
      select: { id: true, codigo: true },
    }),
  ]);

  const elegida = ajuste?.foto ?? null;
  const fotos = ultimas.map(aElegible);
  if (elegida && !fotos.some((f) => f.id === elegida.id)) {
    fotos.unshift(aElegible(elegida));
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">Sobre mí</span> ·{" "}
          {texto.secciones.length}{" "}
          {texto.secciones.length === 1 ? "sección" : "secciones"} ·{" "}
          {elegida ? "con retrato" : "sin retrato"}
          {!propio && <span className="text-apagado"> · texto de fábrica</span>}
        </p>
        <Link
          href="/sobre-mi"
          target="_blank"
          className="ml-auto font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
        >
          Ver la página ↗
        </Link>
      </header>

      <EditorDeSobreMi texto={texto} propio={propio} />

      <EditorDelRetrato
        elegidaId={elegida?.id ?? null}
        pie={ajuste?.valor ?? ""}
        fotos={fotos}
        rollos={rollos}
      />
    </>
  );
}
