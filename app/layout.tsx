import type { Metadata } from "next";
import {
  Archivo,
  Azeret_Mono,
  Barlow,
  Bodoni_Moda,
  Comic_Neue,
  Cormorant_Garamond,
  Crimson_Pro,
  DM_Mono,
  EB_Garamond,
  Figtree,
  Fira_Code,
  Fraunces,
  Inconsolata,
  Karla,
  Manrope,
  Newsreader,
  Nunito,
  Outfit,
  Overpass_Mono,
  Public_Sans,
  Red_Hat_Mono,
  Sono,
  Source_Code_Pro,
  Spectral,
} from "next/font/google";

import { identidadDelSitio } from "@/lib/identidadDelSitio";
import { nombreLargo } from "@/lib/identidad";
import { variablesDe } from "@/lib/letras";
import { letrasDelSitio } from "@/lib/letrasDelSitio";
import { variablesDe as variablesDeTipografia } from "@/lib/tipografia";
import { tipografiaDelSitio } from "@/lib/tipografiaDelSitio";
import { SITIO } from "@/lib/sitio";
import Script from "next/script";

import { GUION_DEL_TEMA } from "@/lib/tema";

import "./globals.css";

/* ---------------------------------------------------------------------------
   Las letras. Están declaradas las ocho parejas de `lib/letras.ts` —las tres
   familias de cada una, veinticuatro en total— y se sirven todas desde el
   propio sitio, pero el navegador sólo descarga los ficheros de la que esté
   puesta: una fuente que no usa ninguna regla de CSS no se pide.

   Por eso van con `preload: false`. La descarga anticipada es una etiqueta en
   la cabecera, y esa sí se dispara aunque la letra no se use: con las ocho
   precargadas, cambiar de pareja significaría traerse setenta y dos ficheros
   para usar tres.

   La única página que las pide todas es /admin/ajustes, porque enseña las
   ocho muestras a la vez. Es del panel y se abre de tarde en tarde: se paga
   ahí y no en la portada.
   --------------------------------------------------------------------------- */

/* Cada llamada va con su objeto entero y sin variables de por medio: `next/font`
   lee estos argumentos al compilar, así que no admite ni un `...` ni una
   constante compartida. */

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-bodoni",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-archivo",
  weight: ["400", "500", "600"],
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-dm-mono",
  weight: ["300", "400", "500"],
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-garamond",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-manrope",
  weight: ["400", "500", "600"],
});
const fira = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-fira",
  weight: ["300", "400", "500"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-cormorant",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const karla = Karla({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-karla",
  weight: ["400", "500", "600"],
});
const sourceMono = Source_Code_Pro({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-source-mono",
  weight: ["300", "400", "500"],
});

const crimson = Crimson_Pro({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-crimson",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-public",
  weight: ["400", "500", "600"],
});
const inconsolata = Inconsolata({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-inconsolata",
  weight: ["300", "400", "500"],
});

const spectral = Spectral({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-spectral",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-figtree",
  weight: ["400", "500", "600"],
});
const redHat = Red_Hat_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-red-hat",
  weight: ["300", "400", "500"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-newsreader",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const barlow = Barlow({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-barlow",
  weight: ["400", "500", "600"],
});
const overpass = Overpass_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-overpass",
  weight: ["300", "400", "500"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-fraunces",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-outfit",
  weight: ["400", "500", "600"],
});
const azeret = Azeret_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-azeret",
  weight: ["300", "400", "500"],
});

const comic = Comic_Neue({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-comic",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-nunito",
  weight: ["400", "500", "600"],
});
const sono = Sono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--tipo-sono",
  weight: ["300", "400", "500"],
});

const TIPOGRAFIAS = [
  bodoni,
  archivo,
  dmMono,
  garamond,
  manrope,
  fira,
  cormorant,
  karla,
  sourceMono,
  crimson,
  publicSans,
  inconsolata,
  spectral,
  figtree,
  redHat,
  newsreader,
  barlow,
  overpass,
  fraunces,
  outfit,
  azeret,
  comic,
  nunito,
  sono,
]
  .map((f) => f.variable)
  .join(" ");

/**
 * El nombre y la descripción salen de /admin/ajustes, así que los metadatos de
 * raíz se calculan en cada petición y no al compilar.
 */
export async function generateMetadata(): Promise<Metadata> {
  const identidad = await identidadDelSitio();
  const largo = nombreLargo(identidad);

  return {
    // Sin esto, toda ruta relativa —canónicas, fotos al compartir— se queda a
    // medias y Next avisa en cada compilación.
    metadataBase: new URL(SITIO),

    title: {
      default: largo,
      template: `%s · ${identidad.nombre}`,
    },
    description: identidad.descripcion,

    authors: [{ name: identidad.autor }],
    creator: identidad.autor,
    publisher: identidad.autor,

    // El sitio es en español y de un solo idioma: decirlo evita que un buscador
    // lo adivine mal.
    alternates: { canonical: "/" },

    openGraph: {
      type: "website",
      siteName: identidad.nombre,
      locale: "es_ES",
      url: SITIO,
      title: largo,
      description: identidad.descripcion,
    },

    twitter: {
      card: "summary_large_image",
      title: largo,
      description: identidad.descripcion,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        // Sin recortes: que la ficha del buscador pueda enseñar la fotografía
        // grande y el texto entero.
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    // Lo mismo que pide robots.txt, dicho también en la página: hay
    // recolectores que sólo miran esto. Ver `app/robots.ts`.
    other: { robots: "noai, noimageai" },

    formatDetection: { telephone: false, address: false, email: false },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [letras, tipografia] = await Promise.all([
    letrasDelSitio(),
    tipografiaDelSitio(),
  ]);

  return (
    <html
      lang="es"
      className={TIPOGRAFIAS}
      // Las tres variables de siempre, apuntando a la pareja elegida, y las
      // tres de cómo se lee: tamaño, interlineado y ancho de columna.
      style={{ ...variablesDe(letras), ...variablesDeTipografia(tipografia) }}
      suppressHydrationWarning
    >
      <head>
        {/* Antes de pintar: si el visitante eligió papel claro, se lo damos ya
            puesto. Si no, no hace nada y el sitio abre en cuarto oscuro.

            Va por `next/script` con `beforeInteractive` y no con un `<script>`
            a pelo: un `<script>` escrito dentro de un componente sólo corre
            cuando lo pinta el servidor —React avisa por consola de que en el
            cliente no se ejecuta nunca—, y esto tiene que entrar en el HTML
            inicial sí o sí, que es de lo que depende que no haya fogonazo. */}
        <Script
          id="tema-antes-de-pintar"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: GUION_DEL_TEMA }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
