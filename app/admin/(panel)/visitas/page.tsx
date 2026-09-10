import { PanelDeVisitas } from "@/components/panel/PanelDeVisitas";
import { umamiDelSitio } from "@/lib/umamiDelSitio";

export const dynamic = "force-dynamic";

export const metadata = { title: "Visitas" };

export default async function VisitasDelPanel() {
  const umami = await umamiDelSitio();
  return <PanelDeVisitas umami={umami} />;
}
