import { EditorDelAviso } from "@/components/panel/EditorDelAviso";
import { avisoDelSitio } from "@/lib/avisoDelSitio";

export const dynamic = "force-dynamic";

export const metadata = { title: "Aviso de entrada" };

export default async function AvisoDelPanel() {
  const aviso = await avisoDelSitio();
  return <EditorDelAviso aviso={aviso} />;
}
