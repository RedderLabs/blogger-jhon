import "dotenv/config";

import { createHash } from "node:crypto";

import sharp from "sharp";

import { PREFIJO_ORIGINALES, PREFIJO_WEB, guardar } from "../lib/almacen";
import { aTamanoOriginal, leerFeedDeBlogger, trocearEntrada } from "../lib/blogger";
import { ANCHO_POR_DEFECTO } from "../lib/fotos";
import { prisma } from "../lib/prisma";

/**
 * Segundo paso del traslado: baja las fotos de cada entrada, hace la copia
 * que sirve la web y las coloca dentro del texto donde estaban.
 *
 *   npx tsx scripts/traer-fotos-de-blogger.mts [url] [--limite N] [--ensayo]
 *
 * Se puede parar y reanudar: una foto ya bajada no se vuelve a pedir. El
 * cuerpo de la entrada se rehace a partir del blog en cada pasada, así que
 * conviene terminar el traslado antes de ponerse a editar en el panel.
 *
 * Las fotos entran como BORRADOR y sin texto alternativo, a propósito: el
 * archivo no publica una foto sin alt, y eso lo pone Jhon en la mesa de luz.
 * Se ven igual dentro de la entrada, como estaban en el blog.
 */

const BLOG = (
  process.argv.find((a) => a.startsWith("http")) ?? "https://photo-jhon.blogspot.com"
).replace(/\/+$/, "");

const ENSAYO = process.argv.includes("--ensayo");
const LIMITE = Number(process.argv[process.argv.indexOf("--limite") + 1]) || Infinity;

/** Tope del archivo que guarda la web. El original se conserva aparte. */
const LADO_MAYOR_WEB = 2400;
const ESPERA_ENTRE_FOTOS = 120;

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const firma = (url: string) => createHash("sha1").update(url).digest("hex").slice(0, 8);

async function bajar(url: string) {
  const respuesta = await fetch(url, {
    headers: { "user-agent": "photo-jhon/traslado" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!respuesta.ok) throw new Error(`${respuesta.status}`);
  return Buffer.from(await respuesta.arrayBuffer());
}

/** Primero el original entero; si ese no está, lo que diera el blog. */
async function bajarLaMejor(url: string) {
  const grande = aTamanoOriginal(url);
  try {
    return await bajar(grande);
  } catch {
    if (grande === url) throw new Error("no se ha podido bajar");
    await esperar(ESPERA_ENTRE_FOTOS);
    return bajar(url);
  }
}

const feed = await fetch(
  `${BLOG}/feeds/posts/default?alt=atom&max-results=500&start-index=1`,
  { headers: { "user-agent": "photo-jhon/traslado" } },
);
const entradas = leerFeedDeBlogger(await feed.text())
  .sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""))
  .filter((e) => e.fotos.length > 0)
  .slice(0, LIMITE);

console.log(`${entradas.length} entradas con fotos.\n`);

let bajadas = 0;
let reusadas = 0;
let falladas = 0;
let sinEntrada = 0;

for (const [i, e] of entradas.entries()) {
  const entrada = e.urlAntigua
    ? await prisma.entrada.findFirst({ where: { urlAntigua: e.urlAntigua } })
    : null;

  if (!entrada) {
    sinEntrada += 1;
    console.log(`· ${e.titulo.slice(0, 50)} — no está trasladada, la salto`);
    continue;
  }

  const trozos = trocearEntrada(e.html);
  const cuantas = trozos.filter((t) => t.tipo === "foto").length;
  console.log(
    `[${i + 1}/${entradas.length}] ${(e.fecha ?? "").slice(0, 10)} ${entrada.slug.slice(0, 44)} — ${cuantas} fotos`,
  );
  if (ENSAYO) continue;

  const carpeta = `blog-${entrada.slug}`.slice(0, 60);

  const fecha = entrada.publicadoEn ?? new Date();
  const rollo = await prisma.rollo.upsert({
    where: { codigo: carpeta },
    create: {
      codigo: carpeta,
      fecha,
      notas: `Traído del blog: ${BLOG}${e.urlAntigua ?? ""}`,
    },
    update: { fecha },
  });

  const bloques: Record<string, unknown>[] = [];
  let orden = 0;
  let portada: string | null = null;

  for (const trozo of trozos) {
    if (trozo.tipo === "texto") {
      for (const parrafo of trozo.texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
        bloques.push({ tipo: "p", texto: parrafo });
      }
      continue;
    }

    orden += 1;
    const nombre = `${String(orden).padStart(3, "0")}-${firma(trozo.url)}`;
    const archivo = `/foto/${carpeta}/${nombre}.jpg`;

    const ya = await prisma.foto.findFirst({ where: { archivo } });
    if (ya) {
      reusadas += 1;
      portada ??= ya.id;
      bloques.push({ tipo: "figura", fotoId: ya.id });
      continue;
    }

    try {
      const bytes = await bajarLaMejor(trozo.url);
      const meta = await sharp(bytes).metadata();
      if (!meta.width || !meta.height) throw new Error("sin dimensiones");

      const copia = await sharp(bytes)
        .rotate()
        .resize({
          width: LADO_MAYOR_WEB,
          height: LADO_MAYOR_WEB,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      await guardar(`${PREFIJO_WEB}${carpeta}/${nombre}.jpg`, copia.data, "image/jpeg");

      // El original sólo se guarda si aporta algo sobre la copia de la web.
      let rutaOriginal: string | null = null;
      if (meta.format !== "jpeg" || Math.max(meta.width, meta.height) > LADO_MAYOR_WEB) {
        const ext = meta.format === "jpeg" ? "jpg" : (meta.format ?? "bin");
        rutaOriginal = `${PREFIJO_ORIGINALES}${carpeta}/${nombre}.${ext}`;
        await guardar(rutaOriginal, bytes, `image/${meta.format ?? "jpeg"}`);
      }

      const foto = await prisma.foto.create({
        data: {
          rolloId: rollo.id,
          orden,
          archivo,
          ancho: copia.info.width,
          alto: copia.info.height,
          archivoOriginal: rutaOriginal,
          anchoMax: ANCHO_POR_DEFECTO,
          titulo: entrada.titulo.slice(0, 120),
          // Sin alt y en borrador: el alt lo escribe Jhon antes de publicar.
          alt: "",
          estado: "borrador",
          fecha,
        },
      });

      bajadas += 1;
      portada ??= foto.id;
      bloques.push({ tipo: "figura", fotoId: foto.id });
      process.stdout.write(`    ${orden}/${cuantas} ${copia.info.width}×${copia.info.height}\r`);
      await esperar(ESPERA_ENTRE_FOTOS);
    } catch (fallo) {
      falladas += 1;
      console.log(`    ✗ foto ${orden}: ${(fallo as Error).message}`);
    }
  }

  await prisma.entrada.update({
    where: { id: entrada.id },
    data: {
      cuerpo: JSON.stringify(bloques),
      ...(portada && !entrada.imagenId ? { imagenId: portada } : {}),
    },
  });
}

console.log(`\n  bajadas:      ${bajadas}`);
console.log(`  ya estaban:   ${reusadas}`);
console.log(`  falladas:     ${falladas}`);
if (sinEntrada) console.log(`  sin entrada:  ${sinEntrada} (pasa antes el traslado de textos)`);
console.log("\nEstán en la mesa de luz, en borrador y sin alt. Se ven ya dentro de cada entrada.");
