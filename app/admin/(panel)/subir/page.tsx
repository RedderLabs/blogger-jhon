import { SubirEscaneos } from "@/components/panel/SubirEscaneos";
import { anchoDeLasFotos } from "@/lib/anchoDelSitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Subir escaneos" };

export default async function Subir() {
  const [ultimo, ancho] = await Promise.all([
    prisma.rollo.findFirst({
      orderBy: { fecha: "desc" },
      select: { codigo: true, camara: true, optica: true, pelicula: true, revelado: true },
    }),
    anchoDeLasFotos(),
  ]);

  // El código del rollo siguiente se propone solo: «Rollo 08» → «Rollo 09».
  const numero = ultimo?.codigo.match(/(\d+)\s*$/)?.[1];
  const propuesto = numero
    ? ultimo!.codigo.replace(/\d+\s*$/, String(Number(numero) + 1).padStart(numero.length, "0"))
    : "Rollo 01";

  return (
    <SubirEscaneos
      propuesto={propuesto}
      anchoDelSitio={ancho}
      anterior={{
        camara: ultimo?.camara ?? "",
        optica: ultimo?.optica ?? "",
        pelicula: ultimo?.pelicula ?? "",
        revelado: ultimo?.revelado ?? "",
      }}
    />
  );
}
