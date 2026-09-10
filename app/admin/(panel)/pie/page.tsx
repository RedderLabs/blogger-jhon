import { EditorDelPie } from "@/components/panel/EditorDelPie";
import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { notaGuardadaDelPie } from "@/lib/pieDelSitio";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pie del sitio" };

export default async function PieDelPanel() {
  const [nota, identidad] = await Promise.all([
    notaGuardadaDelPie(),
    identidadDelSitio(),
  ]);
  return <EditorDelPie nota={nota} nombre={identidad.nombre} />;
}
