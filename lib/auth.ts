import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const credenciales = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/admin/entrar" },
  providers: [
    Credentials({
      name: "Cuarto oscuro",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(raw) {
        const leido = credenciales.safeParse(raw);
        if (!leido.success) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: leido.data.email.toLowerCase() },
        });
        if (!usuario) return null;

        const vale = await bcrypt.compare(leido.data.password, usuario.passwordHash);
        if (!vale) return null;

        return { id: usuario.id, email: usuario.email, name: usuario.nombre };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

/** Lanza al login si no hay sesión. Se llama desde el layout de /admin. */
export async function exigirSesion() {
  const sesion = await auth();
  if (!sesion?.user) return null;
  return sesion;
}
