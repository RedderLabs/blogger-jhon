import Link from "next/link";

import { AjustesDeLaCuenta } from "@/components/panel/AjustesDeLaCuenta";
import { AjustesDeLasEntradillas } from "@/components/panel/AjustesDeLasEntradillas";
import { AjustesDeLasFotos } from "@/components/panel/AjustesDeLasFotos";
import { AjustesDeLaTipografia } from "@/components/panel/AjustesDeLaTipografia";
import { AjustesDeLasLetras } from "@/components/panel/AjustesDeLasLetras";
import { AjustesDelSitio } from "@/components/panel/AjustesDelSitio";
import { anchoGuardado } from "@/lib/anchoDelSitio";
import { auth } from "@/lib/auth";
import { entradillasGuardadas } from "@/lib/entradillasDelSitio";
import { identidadGuardada } from "@/lib/identidadDelSitio";
import { letrasGuardadas } from "@/lib/letrasDelSitio";
import { tipografiaGuardada } from "@/lib/tipografiaDelSitio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ajustes" };

/**
 * Lo que antes había que tocar en el código y volver a desplegar: cómo se
 * llama el sitio, con qué letra se lee, a cuántos píxeles se sirven las
 * fotografías y con qué se entra aquí.
 *
 * Cada bloque se guarda por separado —con su botón— porque no se cambian a la
 * vez: la descripción y los textos de las páginas se retocan de vez en
 * cuando, la letra se elige una vez y la contraseña casi nunca.
 *
 * Todo se lee sin caché: lo que aparece en los campos es lo que hay en la
 * base ahora mismo, no lo que se guardó hace cinco minutos.
 */
export default async function AjustesDelPanel() {
  const sesion = await auth();

  const [identidad, entradillas, letras, tipografia, ancho, total, usuario] =
    await Promise.all([
      identidadGuardada(),
      entradillasGuardadas(),
      letrasGuardadas(),
      tipografiaGuardada(),
      anchoGuardado(),
      prisma.foto.count(),
      sesion?.user?.id
        ? prisma.usuario.findUnique({
            where: { id: sesion.user.id },
            select: { nombre: true, email: true },
          })
        : null,
    ]);

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <span className="text-papel">Ajustes</span> · {identidad.nombre} ·{" "}
          {letras.nombre} ·{" "}
          {ancho === 0 ? "fotos sin límite" : `fotos a ${ancho} px`}
        </p>
        <Link
          href="/"
          target="_blank"
          className="ml-auto font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
        >
          Ver el sitio ↗
        </Link>
      </header>

      <div className="grid gap-5 p-4 sm:p-6">
        <AjustesDelSitio identidad={identidad} />
        <AjustesDeLasEntradillas entradillas={entradillas} />
        <AjustesDeLasLetras elegida={letras.clave} />
        <AjustesDeLaTipografia guardada={tipografia} />
        <AjustesDeLasFotos ancho={ancho} total={total} />
        {usuario ? (
          <AjustesDeLaCuenta nombre={usuario.nombre} correo={usuario.email} />
        ) : (
          // El layout ya exige sesión, así que esto sólo pasa si la cuenta se
          // borró de la base con la sesión abierta. Mejor decirlo que enseñar
          // un formulario que no va a guardar nada.
          <section className="border border-dashed border-filo-2 px-6 py-10 text-center font-mono text-[.75rem] tracking-[.06em] text-dato">
            Esta cuenta ya no está en la base. Vuelve a entrar.
          </section>
        )}
      </div>
    </>
  );
}
