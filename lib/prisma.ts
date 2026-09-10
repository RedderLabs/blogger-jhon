import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

// Prisma 7 ya no abre la conexión por su cuenta: hay que darle un adaptador.
function crearCliente() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL (mira .env.example)");

  return new PrismaClient({
    // El pool lo lleva `pg`. Los números son pequeños a propósito: en Neon la
    // conexión ya pasa por su propio agrupador, y una instancia de 0,1 CPU no
    // gana nada abriendo veinte conexiones que no puede atender a la vez.
    adapter: new PrismaPg({ connectionString: url, max: 5 }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// En desarrollo Next recarga los módulos en cada cambio; sin este cacheo
// abriríamos un pool nuevo por recarga.
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalParaPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma;
