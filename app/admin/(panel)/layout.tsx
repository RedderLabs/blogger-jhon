import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Rail } from "@/components/panel/Rail";
import { auth } from "@/lib/auth";
import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: { default: "Cuarto oscuro", template: "%s · Cuarto oscuro" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LayoutPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  // La comprobación real está aquí, no en un proxy: si no hay sesión, no se
  // llega a consultar nada.
  const sesion = await auth();
  if (!sesion?.user) redirect("/admin/entrar");

  const [identidad, total, sinSerie, sinAlt, sinLeer] = await Promise.all([
    identidadDelSitio(),
    prisma.foto.count(),
    prisma.foto.count({ where: { series: { none: {} } } }),
    prisma.foto.count({ where: { alt: "" } }),
    prisma.mensaje.count({ where: { leido: false } }),
  ]);

  return (
    // El panel no scrollea entero: ocupa la pantalla y punto. El rail y la
    // barra de cada sección se quedan quietos y lo que se mueve es el
    // contenido, que es lo que ya daban por hecho las secciones con dos
    // columnas (mesa de luz, series, ficha de foto) al pedir `min-h-0 flex-1`.
    //
    // `h-dvh` y no `h-screen`: en un teléfono, la barra del navegador se come
    // parte de los 100vh y el pie del rail quedaba debajo del borde.
    <div className="flex h-dvh flex-col overflow-hidden lg:flex-row">
      <Rail
        nombre={identidad.nombre}
        pie={[
          { etiqueta: "Fotogramas", valor: String(total) },
          { etiqueta: "Sin serie", valor: String(sinSerie), alerta: sinSerie > 0 },
          { etiqueta: "Sin alt", valor: String(sinAlt), alerta: sinAlt > 0 },
          { etiqueta: "Mensajes", valor: String(sinLeer), alerta: sinLeer > 0 },
        ]}
      />
      <div className="scroll-fino flex min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
