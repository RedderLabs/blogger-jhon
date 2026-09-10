import { PanelDeLaGaleria } from "@/components/panel/PanelDeLaGaleria";
import { distancia, TOPE_PARECIDO } from "@/lib/parecido";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Galería" };

type Fila = {
  id: string;
  hash: string | null;
  visual: string | null;
  archivo: string;
  titulo: string;
  alt: string;
  estado: string;
  orden: number;
  ancho: number;
  alto: number;
  rollo: { codigo: string };
  series: { serie: { nombre: string } }[];
  imagenDeEntrada: { titulo: string }[];
  portadaDeSerie: { nombre: string } | null;
  enAjustes: { clave: string }[];
};

/**
 * Junta en un grupo todo lo que se parezca, en cadena: si A se parece a B y B
 * a C, las tres van juntas aunque A y C no lleguen a parecerse entre ellas.
 *
 * Es lo que hace falta aquí. Una fotografía que pasó tres veces por el
 * recomprimidor de Blogger deja tres ficheros que se van alejando poco a poco;
 * partirlos en dos grupos obligaría a hacer el trabajo dos veces.
 */
function agrupar(fotos: Fila[]): Fila[][] {
  const grupoDe = new Map<string, number>();
  const grupos: Fila[][] = [];

  for (const f of fotos) {
    if (!f.visual && !f.hash) continue;

    let destino: number | null = null;
    for (const otra of fotos) {
      if (otra.id === f.id) continue;
      const ya = grupoDe.get(otra.id);
      if (ya === undefined) continue;

      const identicas = Boolean(f.hash && otra.hash && f.hash === otra.hash);
      const parecidas =
        Boolean(f.visual && otra.visual) &&
        distancia(f.visual!, otra.visual!) <= TOPE_PARECIDO;

      if (identicas || parecidas) {
        destino = ya;
        break;
      }
    }

    if (destino === null) {
      grupoDe.set(f.id, grupos.length);
      grupos.push([f]);
    } else {
      grupoDe.set(f.id, destino);
      grupos[destino].push(f);
    }
  }

  return grupos.filter((g) => g.length > 1);
}

/**
 * La galería del panel: todo el archivo, y arriba lo que está repetido.
 *
 * Las repetidas salen del traslado del blog: la misma imagen entró en varias
 * entradas y Blogger guardó una copia recomprimida cada vez, así que el
 * fichero no coincide aunque la fotografía sea la misma. Por eso se comparan
 * dos cosas: la huella del fichero —idénticas— y la de lo que se ve.
 *
 * De cada fotografía se dice dónde se está usando. Eso es lo que decide si se
 * puede borrar sin dejar un hueco, y en un grupo de repetidas, cuál conviene
 * conservar.
 */
export default async function GaleriaDelPanel() {
  const [fotos, faltan] = await Promise.all([
    prisma.foto.findMany({
      orderBy: [{ creadaEn: "desc" }],
      select: {
        id: true,
        hash: true,
        visual: true,
        archivo: true,
        titulo: true,
        alt: true,
        estado: true,
        orden: true,
        ancho: true,
        alto: true,
        rollo: { select: { codigo: true } },
        series: { select: { serie: { select: { nombre: true } } } },
        imagenDeEntrada: { select: { titulo: true } },
        portadaDeSerie: { select: { nombre: true } },
        enAjustes: { select: { clave: true } },
      },
    }),
    prisma.foto.count({ where: { OR: [{ hash: null }, { visual: null }] } }),
  ]);

  // El cuerpo de una entrada nombra las fotografías por su identificador y eso
  // no es una relación: hay que buscarlo en el texto.
  const entradas = await prisma.entrada.findMany({
    select: { titulo: true, cuerpo: true },
  });

  const aFicha = (f: Fila) => ({
    id: f.id,
    archivo: f.archivo,
    titulo: f.titulo,
    alt: f.alt,
    estado: f.estado,
    medidas: `${f.ancho}×${f.alto}`,
    rollo: f.rollo.codigo,
    orden: f.orden,
    series: f.series.map((s) => s.serie.nombre),
    deEntradas: f.imagenDeEntrada.map((e) => e.titulo),
    portadaDe: f.portadaDeSerie?.nombre ?? null,
    enAjustes: f.enAjustes.map((a) => a.clave),
    enCuerpos: entradas.filter((e) => e.cuerpo.includes(f.id)).map((e) => e.titulo),
  });

  const juntas = agrupar(fotos);
  const grupos = juntas.map((g) => ({
    clave: g[0].id,
    identicas: g.every((f) => f.hash && f.hash === g[0].hash),
    fotos: g.map(aFicha),
  }));

  const repetidas = new Set(juntas.flat().map((f) => f.id));

  return (
    <PanelDeLaGaleria
      grupos={grupos}
      archivo={fotos.map((f) => ({ ...aFicha(f), repetida: repetidas.has(f.id) }))}
      faltan={faltan}
      copiasDeMas={grupos.reduce((n, g) => n + g.fotos.length - 1, 0)}
    />
  );
}
