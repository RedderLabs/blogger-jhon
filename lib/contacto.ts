import { z } from "zod";

/**
 * El formulario de /contacto: qué se acepta de lo que llega.
 *
 * No hay lista de asuntos. La había —copia, encargo, otra cosa— y sugería un
 * catálogo de servicios que este sitio no es: aquí se enseña trabajo, no se
 * despacha. Quien escribe cuenta a qué viene con sus palabras.
 *
 * El correo y las redes no están aquí: se escriben desde el panel y se
 * guardan en `Ajuste` (ver `lib/datosDeContacto.ts`). Teléfono no hay, y es
 * deliberado (ver diseno/README.md).
 */
export const mensajeRecibido = z.object({
  nombre: z.string().trim().min(2, "Escribe un nombre.").max(120),
  correo: z.email("Ese correo no parece un correo.").max(180),
  cuerpo: z
    .string()
    .trim()
    .min(10, "Cuéntame algo más: con una línea no sé qué contestarte.")
    .max(4000, "Se ha quedado muy largo. Recórtalo un poco."),
});
