import "dotenv/config";

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { readdirSync, statSync } from "node:fs";

import { PREFIJO_ORIGINALES, PREFIJO_WEB, cubo, guardar, medir } from "../lib/almacen";
import { prisma } from "../lib/prisma";

/**
 * Sube a Backblaze lo que hay en public/uploads y reescribe las fichas para
 * que apunten allí.
 *
 *   npm run fotos:a-backblaze -- --simular   # sólo dice qué haría
 *   npm run fotos:a-backblaze                # lo hace
 *
 * No borra nada del disco. Se puede pasar las veces que haga falta: lo que ya
 * esté subido con el mismo tamaño se salta, y las fichas que ya apunten a
 * /foto/ se dejan como están. Si algo falla a mitad, se vuelve a lanzar.
 *
 * El reparto dentro del cubo:
 *   copia web  ->  web/<carpeta>/<nombre>.jpg     (la sirve /foto/…)
 *   escaneo    ->  originales/<carpeta>/<nombre>  (no se sirve nunca)
 */

const SIMULAR = process.argv.includes("--simular");
const RAIZ = join(process.cwd(), "public");

function tipoPorNombre(nombre: string) {
  const ext = nombre.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  return (
    {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".tif": "image/tiff",
      ".tiff": "image/tiff",
      ".webp": "image/webp",
      ".avif": "image/avif",
    }[ext] ?? "application/octet-stream"
  );
}

/** `/uploads/rollo/001.jpg` -> `web/rollo/001.jpg`. */
function claveWeb(ruta: string) {
  return PREFIJO_WEB + ruta.replace(/^\/uploads\//, "");
}

/** `/uploads/rollo/originales/001.tif` -> `originales/rollo/001.tif`. */
function claveOriginal(ruta: string) {
  return PREFIJO_ORIGINALES + ruta.replace(/^\/uploads\//, "").replace("originales/", "");
}

let subidos = 0;
let saltados = 0;
const fallos: string[] = [];

/** Sube si no está ya con el mismo tamaño. Devuelve false si no se pudo. */
async function subir(rutaPublica: string, clave: string) {
  const enDisco = join(RAIZ, rutaPublica.replace(/^\//, "").split("/").join(sep));
  if (!existsSync(enDisco)) {
    fallos.push(`no está en el disco: ${rutaPublica}`);
    return false;
  }

  const bytes = await readFile(enDisco);

  const ya = await medir(clave);
  if (ya === bytes.byteLength) {
    saltados += 1;
    return true;
  }

  if (SIMULAR) {
    console.log(`  subiría ${rutaPublica} -> ${clave} (${bytes.byteLength} B)`);
    subidos += 1;
    return true;
  }

  await guardar(clave, bytes, tipoPorNombre(rutaPublica));

  // Comprobación: se da por subido cuando B2 dice que pesa lo mismo.
  const comprobado = await medir(clave);
  if (comprobado !== bytes.byteLength) {
    fallos.push(`subida sin confirmar: ${clave} (B2 dice ${comprobado}, son ${bytes.byteLength})`);
    return false;
  }

  subidos += 1;
  return true;
}

console.log(SIMULAR ? "SIMULACRO — no se toca nada\n" : `Cubo: ${cubo()}\n`);

const fotos = await prisma.foto.findMany({
  select: { id: true, archivo: true, archivoOriginal: true },
  orderBy: { creadaEn: "asc" },
});
console.log(`${fotos.length} fichas en la base.`);

const usados = new Set<string>();
let fichas = 0;

for (const foto of fotos) {
  const cambios: { archivo?: string; archivoOriginal?: string } = {};

  if (foto.archivo.startsWith("/uploads/")) {
    usados.add(foto.archivo);
    const clave = claveWeb(foto.archivo);
    if (await subir(foto.archivo, clave)) {
      cambios.archivo = "/foto/" + foto.archivo.replace(/^\/uploads\//, "");
    }
  }

  if (foto.archivoOriginal?.startsWith("/uploads/")) {
    usados.add(foto.archivoOriginal);
    const clave = claveOriginal(foto.archivoOriginal);
    if (await subir(foto.archivoOriginal, clave)) {
      cambios.archivoOriginal = clave;
    }
  }

  if (Object.keys(cambios).length > 0) {
    if (!SIMULAR) await prisma.foto.update({ where: { id: foto.id }, data: cambios });
    fichas += 1;
  }
}

// Lo que hay en el disco y no reclama ninguna ficha: no se sube, se enseña.
function recorrer(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const completo = join(dir, n);
    return statSync(completo).isDirectory()
      ? recorrer(completo)
      : ["/" + relative(RAIZ, completo).split(sep).join("/")];
  });
}

const huerfanos = recorrer(join(RAIZ, "uploads")).filter((f) => !usados.has(f));

console.log(`\nsubidos: ${subidos}   ya estaban: ${saltados}   fichas reescritas: ${fichas}`);

if (huerfanos.length > 0) {
  console.log(`\n${huerfanos.length} fichero(s) en el disco que ninguna ficha reclama (NO se han subido):`);
  for (const h of huerfanos.slice(0, 20)) console.log(`  ${h}`);
  if (huerfanos.length > 20) console.log(`  …y ${huerfanos.length - 20} más`);
}

if (fallos.length > 0) {
  console.log(`\n${fallos.length} fallo(s):`);
  for (const f of fallos) console.log(`  ${f}`);
  console.log("\nLas fichas de esos ficheros se han quedado como estaban. Vuelve a lanzarlo.");
} else {
  console.log("\nSin fallos.");
  if (!SIMULAR) {
    console.log("public/uploads sigue en su sitio: compruébalo en el navegador antes de borrarlo.");
  }
}

await prisma.$disconnect();
