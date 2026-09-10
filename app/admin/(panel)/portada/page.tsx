import Link from "next/link";

import {
  EditorDeLaPortada,
  type RolloElegible,
} from "@/components/panel/EditorDeLaPortada";
import type { FotoElegible } from "@/components/panel/SelectorDeFoto";
import { fechaFicha } from "@/lib/fotos";
import { CLAVE_APERTURA, type ClaveDeSeccion, CLAVE_HOJA } from "@/lib/portada";
import { seccionesGuardadas } from "@/lib/portadaDelSitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Portada" };

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
 * Todo lo que se decide de la portada: la fotografía que abre, el rollo que se
 * enseña debajo y qué piezas salen y en qué orden.
 *
 * Se ofrece el archivo entero, ordenado por fecha de la más reciente a la más
 * vieja. `automatica` es la primera publicada de esa lista: exactamente la que
 * `fotoDeApertura()` elegiría sola si no hay ninguna fijada, y por eso puede
 * enseñarse como «la que saldría» sin volver a consultarla.
 */
export default async function PortadaDelPanel() {
  const [apertura, hoja, publicadas, rollos, secciones, entradas, series] =
    await Promise.all([
      prisma.ajuste.findUnique({
        where: { clave: CLAVE_APERTURA },
        include: { foto: { select: seleccion } },
      }),
      prisma.ajuste.findUnique({ where: { clave: CLAVE_HOJA } }),
      // Todas las del archivo, publicadas y en borrador: si una fotografía
      // existe tiene que poder elegirse. Lo que no puede es llegar a la
      // portada sin publicar, y de eso avisa el editor.
      prisma.foto.findMany({
        orderBy: [{ fecha: "desc" }, { creadaEn: "desc" }],
        select: seleccion,
      }),
      prisma.rollo.findMany({
        orderBy: { fecha: "desc" },
        take: 60,
        select: {
          id: true,
          codigo: true,
          fecha: true,
          _count: { select: { fotos: true } },
        },
      }),
      seccionesGuardadas(),
      prisma.entrada.count({ where: { estado: "publica", publicadoEn: { not: null } } }),
      prisma.serie.count({ where: { estado: { not: "oculta" } } }),
    ]);

  const elegida = apertura?.foto ?? null;
  const fotos = publicadas.map(aElegible);
  if (elegida && !fotos.some((f) => f.id === elegida.id)) {
    fotos.unshift(aElegible(elegida));
  }

  // Sin nada fijado, la portada abre con la última publicada: la misma que
  // elegiría `fotoDeApertura()`.
  const automatica = fotos.find((f) => f.estado === "publicada") ?? null;

  // Encendida no basta: una sección sin nada dentro no se pinta, y desde el
  // panel eso se ve como si el interruptor no funcionara.
  const vacias: ClaveDeSeccion[] = [
    ...(automatica ? [] : (["apertura", "hoja"] as const)),
    ...(entradas === 0 ? (["entradas"] as const) : []),
    ...(series === 0 ? (["series"] as const) : []),
  ];

  const enLista: RolloElegible[] = rollos.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    cuantas: r._count.fotos,
    cuando: fechaFicha(r.fecha),
  }));

  const encendidas = secciones.filter((s) => s.visible).length;

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">Portada</span> · {encendidas} de{" "}
          {secciones.length} secciones ·{" "}
          {elegida ? "apertura fijada" : "apertura automática"}
        </p>
        <Link
          href="/"
          target="_blank"
          className="ml-auto font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
        >
          Ver la portada ↗
        </Link>
      </header>

      <EditorDeLaPortada
        aperturaId={elegida?.id ?? null}
        automaticaId={automatica?.id ?? null}
        fotos={fotos}
        rollos={enLista}
        hojaId={hoja?.valor ?? null}
        secciones={secciones}
        vacias={vacias}
      />
    </>
  );
}
