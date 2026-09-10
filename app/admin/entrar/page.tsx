import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { auth, signIn } from "@/lib/auth";
import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { FormularioDeEntrada } from "./FormularioDeEntrada";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

async function entrar(_previo: string | null, datos: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: String(datos.get("email") ?? ""),
      password: String(datos.get("password") ?? ""),
      redirectTo: "/admin",
    });
    return null;
  } catch (e) {
    if (e instanceof AuthError) return "Ese correo y esa contraseña no cuadran.";
    throw e; // el redirect de Next viaja como excepción: no se toca
  }
}

export default async function Entrar() {
  if (await auth()) redirect("/admin");

  const identidad = await identidadDelSitio();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-9">
          <p className="font-serif text-[1.6rem] leading-none font-bold">
            {identidad.nombre}
          </p>
          <p className="lbl mt-2 text-[.5625rem] tracking-[.28em] text-rojo">Cuarto oscuro</p>
        </div>

        <h1 className="font-serif text-[2rem] leading-tight font-bold">
          La puerta de atrás
        </h1>
        <p className="mt-3 text-[.9375rem] leading-relaxed text-dato">
          Aquí no entra nadie más que tú. La contraseña se cambia dentro, en
          Ajustes; si la has olvidado del todo, hay que cambiarla desde la base
          de datos.
        </p>

        <FormularioDeEntrada accion={entrar} />
      </div>
    </main>
  );
}
