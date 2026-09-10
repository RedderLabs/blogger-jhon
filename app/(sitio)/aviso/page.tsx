import type { Metadata } from "next";

import { Pie } from "@/components/sitio/Pie";
import { TextoConFormato } from "@/components/sitio/TextoConFormato";
import { avisoDelSitio } from "@/lib/avisoDelSitio";
import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { metadatos } from "@/lib/sitio";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return metadatos({
    titulo: "Aviso importante",
    descripcion:
      "Sobre el uso de fotografías por parte de sistemas de inteligencia artificial.",
    ruta: "/aviso",
  });
}

/**
 * El mismo texto que sale al entrar, pero con dirección propia: así se puede
 * enlazar, se puede volver a leer y no depende de que el navegador recuerde
 * o no que ya se cerró.
 */
export default async function Aviso() {
  const [aviso, identidad] = await Promise.all([avisoDelSitio(), identidadDelSitio()]);

  return (
    <>
      <main className="mx-auto w-full max-w-[68ch] flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <p className="lbl lbl-sitio mb-4">{identidad.nombre}</p>
        <h1 className="font-serif text-[2.2rem] leading-none font-bold tracking-[.05em] uppercase sm:text-[3rem]">
          {aviso.titulo}
        </h1>
        <div className="mt-8 flex flex-col gap-5">
          <TextoConFormato
            texto={aviso.parrafos.join("\n\n")}
            className="text-[length:var(--texto)] leading-[var(--interlinea)] text-papel-2"
          />
        </div>
      </main>
      <Pie />
    </>
  );
}
