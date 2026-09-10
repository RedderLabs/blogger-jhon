import { AvisoImportante } from "@/components/sitio/AvisoImportante";
import { Nav } from "@/components/sitio/Nav";
import { NavInferior } from "@/components/sitio/NavInferior";
import { ProveedorDelFallo } from "@/components/sitio/PercanceContexto";
import { PieLegal } from "@/components/sitio/PieLegal";
import { avisoDelSitio } from "@/lib/avisoDelSitio";
import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { paginaDeContacto } from "@/lib/paginaContactoDelSitio";
import { paginasDelSitio } from "@/lib/paginasDelSitio";
import { percanceDelSitio } from "@/lib/percancesDelSitio";
import { mide } from "@/lib/umami";
import { umamiDelSitio } from "@/lib/umamiDelSitio";

/**
 * El marco de la parte pública: la cabecera, la barra del pulgar, el aviso de
 * entrada y el contador.
 *
 * Está aquí y no dentro de `app/(sitio)/layout.tsx` porque hay una página que
 * lo necesita y no está en ese grupo: la de dirección no encontrada. Un 404
 * sin cabecera deja al visitante en un callejón, que es justo lo que no
 * queremos de un error.
 */
export async function Marco({ children }: { children: React.ReactNode }) {
  const [identidad, aviso, umami, contacto, paginas, fallo] = await Promise.all([
    identidadDelSitio(),
    avisoDelSitio(),
    umamiDelSitio(),
    paginaDeContacto(),
    paginasDelSitio(),
    // Lo que dirá la página de fallo si se rompe algo de aquí para abajo. Se
    // baja ya leído porque `error.tsx` es de cliente y no puede consultarlo.
    percanceDelSitio("500"),
  ]);

  // Lo que la navegación necesita saber: qué páginas opcionales existen hoy.
  const visibles = { ...paginas, contacto: contacto.visible };

  return (
    <div
      className="flex min-h-screen flex-col lg:pb-0"
      // Hueco para la barra inferior, que va fija y taparía el pie.
      style={{ paddingBottom: "var(--hueco-nav-inferior)" }}
    >
      <Nav nombre={identidad.nombre} visibles={visibles} />

      {/* La página y, debajo del todo, la línea de letra pequeña. Van dentro
          del mismo hueco flexible para que el `mt-auto` del pie siga pegando
          el pie al fondo cuando la página es corta y la línea legal quede
          después de él, y no compitiendo con él por el espacio sobrante. */}
      <div className="flex flex-1 flex-col">
        <ProveedorDelFallo valor={fallo}>{children}</ProveedorDelFallo>
        <PieLegal />
      </div>

      <NavInferior visibles={visibles} />
      <AvisoImportante aviso={aviso} />

      {/* Umami: cuenta páginas y de dónde vienen. Sin cookies, sin huella del
          navegador y sin nada que identifique a nadie — por eso puede estar
          aquí sin contradecir lo que el sitio promete. Sólo se carga si está
          configurado en /admin/visitas, y no entra en el cuarto oscuro: este
          marco es sólo el de la parte pública. */}
      {mide(umami) && (
        <script defer src={umami.script} data-website-id={umami.id} />
      )}
    </div>
  );
}
