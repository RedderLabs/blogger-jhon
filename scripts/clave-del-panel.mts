import "dotenv/config";

import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";

/**
 * Cambia la contraseña de quien entra al panel.
 *
 *   npm run panel:clave                        # inventa una buena y la enseña
 *   npm run panel:clave -- "mi clave"          # la que tú digas
 *   npm run panel:clave -- "mi clave" otro@correo.com
 *
 * Enseña también el cifrado, que es lo único que hace falta llevarse a la
 * consola de Render: allí `bcryptjs` no se puede exigir —Next lo empaqueta
 * dentro del servidor— pero `better-sqlite3` sí.
 */

const [claveDada, correoDado] = process.argv.slice(2);

const correo = correoDado ?? (await prisma.usuario.findFirst())?.email;
if (!correo) {
  console.error("No hay ningún usuario en la base. Pasa npm run db:seed primero.");
  process.exit(1);
}

// 16 caracteres de azar sirven de sobra y se pueden copiar sin equivocarse.
const clave = claveDada?.trim() || randomBytes(12).toString("base64url");
if (clave.length < 8) {
  console.error("Esa clave es demasiado corta. Ocho caracteres como mínimo.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(clave, 12);

const usuario = await prisma.usuario.update({
  where: { email: correo },
  data: { passwordHash },
  select: { email: true, nombre: true },
});

console.log(`\nCambiada la clave de ${usuario.nombre} <${usuario.email}>\n`);
console.log(`  clave:   ${clave}`);
console.log(`  cifrado: ${passwordHash}\n`);
console.log("Guárdala donde guardes las tuyas: no vuelve a salir.");
console.log("Para la consola de Render, con el cifrado de arriba:\n");
console.log(
  `  cd /app && NUEVO='${passwordHash}' node -e 'const D=require("better-sqlite3");const db=new D(process.env.DATABASE_URL.replace(/^file:/,""));console.log("filas:",db.prepare("UPDATE Usuario SET passwordHash=? WHERE email=?").run(process.env.NUEVO,${JSON.stringify(usuario.email)}).changes)'\n`,
);
