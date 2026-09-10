import { readFileSync } from "node:fs";

import Database from "better-sqlite3";
import { Client } from "pg";

/**
 * Traslada el archivo entero de SQLite a Postgres.
 *
 *   npx tsx scripts/a-postgres.mts [--origen dev.db]
 *
 * Se puede repetir: cada fila entra con ON CONFLICT DO NOTHING, así que una
 * segunda pasada no duplica nada y sirve para rematar un traslado a medias.
 *
 * El destino sale de DATABASE_URL; si ahí todavía hay un `file:`, se busca la
 * línea comentada del .env, que es donde suele quedarse la de Neon.
 *
 * Las columnas y sus tipos NO se escriben aquí: se leen del propio Postgres
 * después de `prisma db push`. Así el día que cambie el esquema, este script
 * sigue valiendo sin tocarlo.
 */

const argumentos = process.argv.slice(2);
const origen =
  argumentos[argumentos.indexOf("--origen") + 1]?.replace(/^--.*/, "") || "dev.db";

function urlDestino() {
  const puesta = process.env.DATABASE_URL;
  if (puesta && !puesta.startsWith("file:")) return puesta;

  const env = readFileSync(".env", "utf8");
  const comentada = env.match(/^#\s*DATABASE_URL="([^"]+)"/m)?.[1];
  if (comentada && !comentada.startsWith("file:")) return comentada;

  throw new Error("No hay a dónde llevarlo: pon la URL de Postgres en DATABASE_URL.");
}

/** El orden importa: nadie entra antes que aquello a lo que apunta. */
const ORDEN = [
  "Usuario",
  "Rollo",
  "Serie",
  "Foto",
  "FotoEnSerie",
  "Tema",
  "Entrada",
  "EntradaEnTema",
  "EntradaEnSerie",
  "Ajuste",
  "Redireccion",
  "Mensaje",
] as const;

/** Serie apunta a Foto y Foto apunta a Rollo: la portada se pone al final. */
const APLAZADAS: Record<string, string[]> = { Serie: ["portadaId"] };

const POR_TANDA = 200;

const sqlite = new Database(origen, { readonly: true });
const pg = new Client({ connectionString: urlDestino() });
await pg.connect();

console.log(`origen:  ${origen}`);
console.log(`destino: ${new URL(urlDestino()).host}\n`);

type Columna = { nombre: string; tipo: string };

async function columnasDe(tabla: string): Promise<Columna[]> {
  const { rows } = await pg.query(
    `select column_name, data_type from information_schema.columns
     where table_schema = 'public' and table_name = $1
     order by ordinal_position`,
    [tabla],
  );
  return rows.map((r) => ({ nombre: r.column_name, tipo: r.data_type }));
}

function convertir(valor: unknown, tipo: string) {
  if (valor === null || valor === undefined) return null;
  if (tipo.startsWith("timestamp") || tipo === "date") {
    // Prisma guarda las fechas en SQLite como milisegundos.
    return typeof valor === "number" ? new Date(valor) : new Date(String(valor));
  }
  if (tipo === "boolean") return valor === 1 || valor === true || valor === "true";
  return valor;
}

const aplazado: { tabla: string; id: unknown; campos: Record<string, unknown> }[] = [];

for (const tabla of ORDEN) {
  const columnas = await columnasDe(tabla);
  if (columnas.length === 0) {
    console.log(`${tabla.padEnd(15)} no existe en el destino, la salto`);
    continue;
  }

  const filas = sqlite.prepare(`SELECT * FROM "${tabla}"`).all() as Record<string, unknown>[];
  if (filas.length === 0) {
    console.log(`${tabla.padEnd(15)} 0`);
    continue;
  }

  const deSpues = APLAZADAS[tabla] ?? [];
  const usadas = columnas.filter((c) => !deSpues.includes(c.nombre));
  const nombres = usadas.map((c) => `"${c.nombre}"`).join(", ");

  for (let i = 0; i < filas.length; i += POR_TANDA) {
    const tanda = filas.slice(i, i + POR_TANDA);
    const valores: unknown[] = [];
    const huecos = tanda.map((fila) => {
      const trozo = usadas.map((c) => {
        valores.push(convertir(fila[c.nombre], c.tipo));
        return `$${valores.length}`;
      });
      return `(${trozo.join(", ")})`;
    });

    await pg.query(
      `INSERT INTO "${tabla}" (${nombres}) VALUES ${huecos.join(", ")} ON CONFLICT DO NOTHING`,
      valores,
    );
  }

  // Lo que apunta a tablas que aún no existían se guarda para el final.
  for (const campo of deSpues) {
    for (const fila of filas) {
      if (fila[campo] != null) {
        aplazado.push({ tabla, id: fila.id, campos: { [campo]: fila[campo] } });
      }
    }
  }

  console.log(`${tabla.padEnd(15)} ${filas.length}`);
}

if (aplazado.length > 0) {
  console.log(`\nEnlazando ${aplazado.length} referencias aplazadas…`);
  for (const { tabla, id, campos } of aplazado) {
    const [campo, valor] = Object.entries(campos)[0];
    await pg.query(`UPDATE "${tabla}" SET "${campo}" = $1 WHERE "id" = $2`, [valor, id]);
  }
}

console.log("\n--- recuento en el destino ---");
let cuadra = true;
for (const tabla of ORDEN) {
  const aqui = (sqlite.prepare(`SELECT COUNT(*) n FROM "${tabla}"`).get() as { n: number }).n;
  const alli = Number((await pg.query(`SELECT COUNT(*)::int n FROM "${tabla}"`)).rows[0].n);
  const bien = aqui === alli;
  if (!bien) cuadra = false;
  console.log(`  ${tabla.padEnd(15)} sqlite ${String(aqui).padStart(4)}  ·  postgres ${String(alli).padStart(4)}  ${bien ? "ok" : "NO CUADRA"}`);
}

await pg.end();
sqlite.close();

console.log(cuadra ? "\nTodo cuadra." : "\nHay tablas que no cuadran: míralo antes de cambiar la web.");
process.exit(cuadra ? 0 : 1);
