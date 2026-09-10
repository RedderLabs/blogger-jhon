import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

import { PREFIJO_WEB, guardar } from "../lib/almacen";
import { AVISO_POR_DEFECTO } from "../lib/aviso";
import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

const RAIZ = process.cwd();
/**
 * Las fotos de ejemplo salen del propio blog, en su versión de 1200 px: es el
 * ancho al que se sirve una copia en escritorio, así que el sembrado enseña el
 * sitio tal y como se verá de verdad. (`diseno/canvas/*.jpg` son las mismas
 * reducidas para el lienzo de diseño; no valen para esto.)
 */
const ORIGEN_JSON = join(RAIZ, "diseno", "fuente", "images-1200.json");
/** Dentro del cubo: lo que sirve /foto va bajo `web/`. */
const CARPETA_EN_EL_CUBO = "rollo-08";

/** Los fotogramas de muestra, en memoria: van al cubo, no al disco. */
const bytesDeFoto = new Map<string, Buffer>();

/**
 * Lee ancho y alto de un JPEG recorriendo sus marcadores hasta el SOF.
 * Evita arrastrar una dependencia de imágenes sólo para el seed.
 */
function medirJpeg(b: Buffer): { ancho: number; alto: number } {
  let i = 2; // saltamos SOI (FFD8)
  while (i < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marcador = b[i + 1];
    // SOF0..SOF3 y SOF5..SOF15 llevan las dimensiones; DHT/DAC/RST no.
    const esSOF =
      marcador >= 0xc0 &&
      marcador <= 0xcf &&
      marcador !== 0xc4 &&
      marcador !== 0xc8 &&
      marcador !== 0xcc;
    if (esSOF) {
      return { alto: b.readUInt16BE(i + 5), ancho: b.readUInt16BE(i + 7) };
    }
    if (marcador === 0xd8 || (marcador >= 0xd0 && marcador <= 0xd9)) {
      i += 2;
      continue;
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error("No he podido medir uno de los fotogramas de muestra");
}

const SERIES = [
  {
    slug: "cabezas-de-cristal",
    nombre: "Cabezas de cristal",
    nota: "Dieciocho maniquíes de escaparate, fotografiados siempre entre las siete y las ocho de la tarde, cuando el sol entra de lado y el cristal deja de ser transparente.",
    anoInicio: 2025,
    anoFin: 2026,
    estado: "publica",
    orden: 1,
  },
  {
    slug: "fantasmas-paso-de-cebra",
    nombre: "Los fantasmas del paso de cebra",
    nota: "El mismo cruce, tres años, exposiciones largas. La gente pasa y deja rastro.",
    anoInicio: 2024,
    anoFin: null,
    estado: "en_curso",
    orden: 2,
  },
  {
    slug: "cementerios-y-abandonos",
    nombre: "Cementerios y lugares abandonados",
    nota: "Lo que queda cuando ya no queda nadie. Formato medio y mucha paciencia.",
    anoInicio: 2011,
    anoFin: null,
    estado: "publica",
    orden: 3,
  },
  {
    slug: "desenfoques",
    nombre: "Desenfoques intencionados",
    nota: "Contra la nitidez como valor. Enfocar es decidir, y a veces decido no hacerlo.",
    anoInicio: 2019,
    anoFin: null,
    estado: "publica",
    orden: 4,
  },
  {
    slug: "calle",
    nombre: "Fotografía de calle",
    nota: "La serie más vieja y la única que no tiene tema. Cuarenta y ocho años andando.",
    anoInicio: 1978,
    anoFin: null,
    estado: "publica",
    orden: 5,
  },
  {
    slug: "inanimados",
    nombre: "Inanimados",
    nota: "Objetos que alguien dejó donde están y nadie ha vuelto a tocar.",
    anoInicio: 2016,
    anoFin: null,
    estado: "oculta",
    orden: 6,
  },
];

/**
 * El rollo de arranque. Seis fotogramas ya repartidos y publicados; tres
 * esperando en la mesa de luz, que es el estado con el que se abre el panel.
 */
const FOTOS = [
  {
    orden: 1,
    archivo: "p3.jpg",
    titulo: "Escaparate cerrado, contraluz",
    alt: "Cabeza de maniquí de cristal a contraluz en un escaparate cerrado.",
    nota: "La primera de la serie que salió como la había pensado antes de levantar la cámara.",
    optica: "Summicron 50 mm f/2 Pre-ASPH",
    apertura: "f/8",
    velocidad: "1/250 s",
    series: [{ slug: "cabezas-de-cristal", posicion: 1, principal: true }],
    estado: "publicada",
  },
  {
    orden: 2,
    archivo: "p9.jpg",
    titulo: "Se cruzó alguien",
    alt: "Figuras cruzando un paso de cebra, movidas por una exposición larga.",
    nota: null,
    optica: "Summicron 50 mm f/2 Pre-ASPH",
    apertura: "f/8",
    velocidad: "1/15 s",
    series: [{ slug: "fantasmas-paso-de-cebra", posicion: 1, principal: true }],
    estado: "publicada",
  },
  {
    orden: 3,
    archivo: "p5.jpg",
    titulo: "Tarde de agosto",
    alt: "Escena de cementerio con sombras largas, una tarde de agosto.",
    nota: null,
    optica: "Elmarit 28 mm f/2,8",
    apertura: "f/11",
    velocidad: "1/250 s",
    series: [{ slug: "cementerios-y-abandonos", posicion: 1, principal: true }],
    estado: "publicada",
  },
  {
    orden: 4,
    archivo: "p7.jpg",
    titulo: "Lo que quedó en la repisa",
    alt: "Objeto abandonado sobre una repisa, cubierto de polvo.",
    nota: null,
    optica: "Summicron 50 mm f/2 Pre-ASPH",
    apertura: "f/5,6",
    velocidad: "1/60 s",
    series: [
      { slug: "inanimados", posicion: 1, principal: true },
      { slug: "cabezas-de-cristal", posicion: 2, principal: false },
    ],
    estado: "publicada",
  },
  {
    orden: 5,
    archivo: "p10.jpg",
    titulo: "Almacén, luz de tubo",
    alt: "Interior de un edificio abandonado iluminado por fluorescentes.",
    nota: null,
    optica: "Elmarit 28 mm f/2,8",
    apertura: "f/4",
    velocidad: "1/30 s",
    series: [{ slug: "cementerios-y-abandonos", posicion: 2, principal: true }],
    estado: "publicada",
  },
  {
    orden: 6,
    archivo: "p8.jpg",
    titulo: "Gran Vía, sábado",
    alt: "Fotografía de calle con figuras en movimiento a contraluz.",
    nota: null,
    optica: "Elmarit 28 mm f/2,8",
    apertura: "f/8",
    velocidad: "1/250 s",
    series: [{ slug: "calle", posicion: 1, principal: true }],
    estado: "publicada",
  },
  // --- Lo que queda por clasificar en la mesa de luz -----------------------
  {
    orden: 7,
    archivo: "p1.jpg",
    titulo: "Sin título",
    alt: "",
    nota: null,
    optica: "Summicron 50 mm f/2 Pre-ASPH",
    apertura: "f/8",
    velocidad: "1/250 s",
    series: [],
    estado: "borrador",
  },
  {
    orden: 8,
    archivo: "p4.jpg",
    titulo: "Sin título",
    alt: "",
    nota: null,
    optica: "Summicron 50 mm f/2 Pre-ASPH",
    apertura: "f/5,6",
    velocidad: "1/250 s",
    series: [],
    estado: "borrador",
  },
  // p6.jpg no entra: es la imagen del aviso «IMPORTANTE», que ahora vive como
  // texto en /aviso. No es una fotografía del archivo.
  {
    orden: 9,
    archivo: "p2.jpg",
    titulo: "Sin título",
    alt: "",
    nota: null,
    optica: "Summicron 50 mm f/2 Pre-ASPH",
    apertura: "f/2,8",
    velocidad: "1/125 s",
    series: [],
    estado: "borrador",
  },
];

const TEMAS = [
  { slug: "metodo", nombre: "Método" },
  { slug: "mirada", nombre: "Mirada" },
  { slug: "equipo", nombre: "Equipo" },
  { slug: "critica", nombre: "Crítica" },
];

async function main() {
  console.log("Vaciando…");
  await prisma.$transaction([
    prisma.entradaEnSerie.deleteMany(),
    prisma.entradaEnTema.deleteMany(),
    prisma.fotoEnSerie.deleteMany(),
    prisma.ajuste.deleteMany(),
    prisma.entrada.deleteMany(),
    prisma.tema.deleteMany(),
  ]);
  // Las series apuntan a una portada y las fotos a un rollo: hay que soltar
  // la portada antes de poder borrar nada.
  await prisma.serie.updateMany({ data: { portadaId: null } });
  await prisma.serie.deleteMany();
  await prisma.foto.deleteMany();
  await prisma.rollo.deleteMany();
  await prisma.redireccion.deleteMany();
  await prisma.usuario.deleteMany();

  console.log("Usuario…");
  // La contraseña no se escribe aquí: o la pones tú en CLAVE_PANEL, o se
  // inventa una y se enseña al terminar. Una clave en el repositorio es una
  // clave publicada.
  const clavePanel = process.env.CLAVE_PANEL?.trim() || randomBytes(12).toString("base64url");
  await prisma.usuario.create({
    data: {
      email: "jhon@photojhon.com",
      nombre: "Jhon",
      passwordHash: await bcrypt.hash(clavePanel, 12),
    },
  });

  console.log("Series…");
  for (const s of SERIES) await prisma.serie.create({ data: s });

  console.log("Copiando escaneos…");
  if (!existsSync(ORIGEN_JSON)) {
    throw new Error(
      `Falta ${ORIGEN_JSON}. Es de donde salen las fotos de ejemplo; ` +
        `si has movido diseno/fuente/, ajusta ORIGEN_JSON en prisma/seed.ts.`,
    );
  }
  const banco = JSON.parse(readFileSync(ORIGEN_JSON, "utf8")) as Record<
    string,
    { id: string; w: number; h: number; data: string }
  >;
  const porNombre = new Map(
    Object.values(banco).map((o) => [`${o.id}.jpg`, o]),
  );

  console.log("Subiendo los fotogramas de muestra a Backblaze…");
  for (const f of FOTOS) {
    const origen = porNombre.get(f.archivo);
    if (!origen) throw new Error(`En images-1200.json no está ${f.archivo}`);
    const base64 = origen.data.split(",")[1] ?? origen.data;
    bytesDeFoto.set(f.archivo, Buffer.from(base64, "base64"));
    await guardar(
      `${PREFIJO_WEB}${CARPETA_EN_EL_CUBO}/${f.archivo}`,
      bytesDeFoto.get(f.archivo)!,
      "image/jpeg",
    );
  }

  console.log("Rollo y fotogramas…");
  const rollo = await prisma.rollo.create({
    data: {
      codigo: "Rollo 08",
      fecha: new Date("2026-08-20T19:30:00Z"),
      camara: "Leica MP",
      optica: "Summicron 50 mm f/2 Pre-ASPH",
      pelicula: "Kodak Tri-X 400",
      revelado: "D-76 1+1 · 9 min · 20 °C",
      notas: "Toda la tarde en la misma calle. Luz de lado desde las siete.",
    },
  });

  for (const f of FOTOS) {
    const { ancho, alto } = medirJpeg(bytesDeFoto.get(f.archivo)!);
    const foto = await prisma.foto.create({
      data: {
        rolloId: rollo.id,
        orden: f.orden,
        archivo: `/foto/${CARPETA_EN_EL_CUBO}/${f.archivo}`,
        ancho,
        alto,
        titulo: f.titulo,
        alt: f.alt,
        nota: f.nota,
        camara: "Leica MP",
        optica: f.optica,
        pelicula: "Kodak Tri-X 400",
        ei: "400",
        apertura: f.apertura,
        velocidad: f.velocidad,
        revelado: "D-76 1+1 · 9 min · 20 °C",
        escaneo: "Plustek 8200i · 3600 ppp",
        fecha: new Date("2026-08-20T19:30:00Z"),
        estado: f.estado,
      },
    });

    for (const enSerie of f.series) {
      const serie = await prisma.serie.findUniqueOrThrow({
        where: { slug: enSerie.slug },
      });
      await prisma.fotoEnSerie.create({
        data: {
          fotoId: foto.id,
          serieId: serie.id,
          posicion: enSerie.posicion,
          principal: enSerie.principal,
        },
      });
      // La primera foto que entra en una serie se queda de portada.
      if (enSerie.posicion === 1 && enSerie.principal && !serie.portadaId) {
        await prisma.serie.update({
          where: { id: serie.id },
          data: { portadaId: foto.id },
        });
      }
    }
  }

  console.log("Temas…");
  for (const t of TEMAS) await prisma.tema.create({ data: t });

  console.log("Entradas…");
  const apertura = await prisma.foto.findFirstOrThrow({
    where: { rolloId: rollo.id, orden: 6 },
  });

  await prisma.entrada.create({
    data: {
      slug: "mirar-pensar-imaginar",
      titulo: "La fotografía, la mente, mirar-pensar-imaginar.",
      kicker: "Método",
      entradilla:
        "Sobre la diferencia entre disparar lo que hay delante y fotografiar lo que uno ha decidido ver antes de levantar la cámara.",
      cuerpo: JSON.stringify([
        {
          tipo: "p",
          texto:
            "Aquí va el texto tal y como lo escribes: párrafos largos, mayúsculas cuando hacen falta y ninguna concesión. La diferencia está en el soporte, no en el tono.",
        },
        {
          tipo: "cita",
          texto: "nunca he buscado los likes ni a las dos gordas",
          firma: "Jhon — Photo Jhon, agosto de 2026",
        },
        {
          tipo: "figura",
          fotoId: apertura.id,
          pie: "Calle · 2026",
        },
        {
          tipo: "p",
          texto:
            "Las fotografías que acompañan al texto ya no son adornos pegados al final: se intercalan a la anchura de la columna o a sangre completa, con su pie técnico, y cada una enlaza con su serie.",
        },
      ]),
      estado: "publica",
      publicadoEn: new Date("2026-08-19T08:00:00Z"),
      palabras: 1240,
      imagenId: apertura.id,
      urlAntigua: "/2026/08/mirar-pensar.html",
      temas: {
        create: [
          { tema: { connect: { slug: "metodo" } } },
          { tema: { connect: { slug: "mirada" } } },
          { tema: { connect: { slug: "critica" } } },
        ],
      },
      series: {
        create: [{ serie: { connect: { slug: "cabezas-de-cristal" } } }],
      },
    },
  });

  await prisma.entrada.create({
    data: {
      slug: "contra-el-like",
      titulo: "Contra el like",
      kicker: "Crítica",
      entradilla: null,
      cuerpo: JSON.stringify([{ tipo: "p", texto: "Borrador. Pendiente de rematar." }]),
      estado: "borrador",
      palabras: 96,
      temas: { create: [{ tema: { connect: { slug: "critica" } } }] },
    },
  });

  console.log("Ajustes de portada…");
  await prisma.ajuste.createMany({
    data: [
      { clave: "portada.apertura", valor: null, fotoId: apertura.id },
      { clave: "portada.hojaDelMes", valor: rollo.id },
      { clave: "sitio.instagram", valor: "https://instagram.com/" },
      { clave: "sitio.aviso", valor: JSON.stringify(AVISO_POR_DEFECTO) },
    ],
  });

  console.log("\nListo.");
  console.log(`  Entrar en /admin con  jhon@photojhon.com  /  ${clavePanel}`);
  if (!process.env.CLAVE_PANEL) {
    console.log("  (inventada al vuelo: apúntala, o pon CLAVE_PANEL antes de sembrar)");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
