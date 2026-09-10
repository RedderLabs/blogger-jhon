import "dotenv/config";

import { type EntradaBlogger, leerFeedDeBlogger } from "../lib/blogger";
import { prisma } from "../lib/prisma";
import { trasladarEntradas } from "../lib/traslado";

/**
 * Baja el blog entero por su feed público y lo traslada al archivo con la
 * fecha que tenía cada entrada.
 *
 *   npx tsx scripts/traer-de-blogger.mts [url] [--ensayo]
 *
 * Con `--ensayo` no escribe nada: sólo dice qué encontraría. Se puede repetir
 * las veces que haga falta: lo que ya está trasladado se salta, porque la
 * identidad es la dirección antigua de cada entrada.
 *
 * Las fotos no entran aquí: van en `scripts/traer-fotos-de-blogger.mts`,
 * porque son cientos de peticiones a otro servidor y conviene poder pararlo
 * y reanudarlo sin tocar el texto.
 */

const BLOG = (
  process.argv.find((a) => a.startsWith("http")) ?? "https://photo-jhon.blogspot.com"
).replace(/\/+$/, "");

const ENSAYO = process.argv.includes("--ensayo");
const POR_TANDA = 150;

async function bajarElFeed(): Promise<EntradaBlogger[]> {
  const todas: EntradaBlogger[] = [];
  const vistas = new Set<string>();

  for (let inicio = 1; ; inicio += POR_TANDA) {
    const url = `${BLOG}/feeds/posts/default?alt=atom&max-results=${POR_TANDA}&start-index=${inicio}`;
    const respuesta = await fetch(url, { headers: { "user-agent": "photo-jhon/traslado" } });
    if (!respuesta.ok) {
      throw new Error(`El blog contesta ${respuesta.status} en ${url}`);
    }

    const tanda = leerFeedDeBlogger(await respuesta.text());
    const nuevas = tanda.filter((e) => !vistas.has(e.ref));
    for (const e of nuevas) vistas.add(e.ref);
    todas.push(...nuevas);

    process.stdout.write(`  tanda desde ${inicio}: ${tanda.length} entradas\n`);
    if (tanda.length < POR_TANDA || nuevas.length === 0) break;
  }

  return todas.sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""));
}

const dia = (f: string | null) => (f ? f.slice(0, 10) : "sin fecha");

console.log(`Blog: ${BLOG}`);
const entradas = await bajarElFeed();

console.log(`\n${entradas.length} entradas en el feed.`);
console.log(`  de ${dia(entradas[0]?.fecha ?? null)} a ${dia(entradas.at(-1)?.fecha ?? null)}`);
console.log(`  fotos que llevan dentro: ${entradas.reduce((n, e) => n + e.fotos.length, 0)}`);
console.log(`  sin una sola palabra de texto: ${entradas.filter((e) => e.palabras === 0).length}`);

const yaEstaban = await prisma.entrada.count();
console.log(`  entradas que ya hay en el archivo: ${yaEstaban}`);

if (ENSAYO) {
  console.log("\n--ensayo: no se escribe nada. Esto es lo que entraría:\n");
  for (const e of entradas) {
    console.log(`  ${dia(e.fecha)}  ${e.fotos.length ? `[${e.fotos.length} fotos]` : "         "}  ${e.titulo.slice(0, 64)}`);
  }
  process.exit(0);
}

console.log("\nTrasladando…");
const resumen = await trasladarEntradas(
  entradas.map((e) => ({
    titulo: e.titulo,
    fecha: e.fecha,
    urlAntigua: e.urlAntigua,
    texto: e.texto,
    palabras: e.palabras,
  })),
);

console.log(`\n  trasladadas:    ${resumen.creadas}`);
console.log(`  ya estaban:     ${resumen.repetidas}`);
console.log(`  redirecciones:  ${resumen.redirecciones}`);
console.log("\nListo. Las entradas salen en /entradas y en /archivo, cada una con su fecha.");
