import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Para la imagen de Docker: `next build` deja en .next/standalone un
  // servidor con sólo lo que de verdad se usa, node_modules incluido. Sin
  // esto habría que meter las dependencias enteras en la imagen.
  output: "standalone",

  images: {
    // Sólo WebP, y AVIF fuera. Medido contra el servidor de producción, con
    // la misma fotografía y en frío:
    //
    //   AVIF  4,62 s → 21.120 B        WebP  1,43 s → 22.860 B
    //   AVIF  2,35 s → 10.930 B        WebP  0,74 s → 11.200 B
    //
    // El triple de tiempo por un 5 % menos de peso. Codificar AVIF es caro en
    // CPU y la instancia tiene 0,1: con seis fotos a la vez se hacen cola unas
    // a otras y la página tarda cinco segundos en poblarse. WebP lo entiende
    // todo lo que hay desde 2020 y el ahorro perdido no se nota; la espera sí.
    formats: ["image/webp"],

    // Los anchos que puede pedir el navegador. 1200 es el tope por defecto
    // en escritorio (ajustable foto a foto desde el panel); 1600 y 2048
    // quedan para quien elija servir la copia más grande.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1600, 1920, 2048],
    imageSizes: [96, 128, 160, 200, 256, 320, 384],

    // Next 16 sólo admite las calidades declaradas aquí: cualquier otra
    // contesta 400 y la imagen se queda en negro. El defecto de `next/image`
    // es 75 y tampoco está en la lista, así que **todo `<Image>` lleva su
    // `quality`** y sale de estas tres. 82 para las copias, 70 para las
    // miniaturas —hoja de contactos y rejilla del archivo—, 92 para el visor.
    qualities: [70, 82, 92],

    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  /**
   * La página de textos se llamaba «cuaderno» y ahora es «entradas». Las
   * direcciones viejas siguen contestando —301, la mudanza es definitiva—
   * porque estaban en el mapa del sitio, en los enlaces que se hayan escrito
   * desde el panel y en cualquier sitio donde alguien las haya pegado.
   */
  async redirects() {
    return [
      { source: "/cuaderno", destination: "/entradas", permanent: true },
      {
        source: "/cuaderno/:slug",
        destination: "/entradas/:slug",
        permanent: true,
      },
    ];
  },

  /**
   * Lo que pide `app/robots.ts`, dicho también en cada respuesta. Un fichero
   * robots.txt hay que ir a buscarlo; una cabecera viaja con la página y con
   * la fotografía, y la leen recolectores que nunca miran la raíz del sitio.
   *
   * `max-image-preview:large` es lo contrario y va a propósito: a los
   * buscadores de verdad se les pide que enseñen la fotografía GRANDE. Lo que
   * se cierra es el entrenamiento, no que a este señor se le vea el trabajo.
   */
  async headers() {
    return [
      {
        source: "/:ruta*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noai, noimageai, max-image-preview:large",
          },
        ],
      },
      {
        // El manual del panel. VA DESPUÉS de la regla general a propósito:
        // cuando dos reglas ponen la misma cabecera, gana la última, y aquí
        // hace falta `noindex` en vez de `max-image-preview`. Lo mismo piden
        // /robots.txt y la etiqueta dentro del propio documento.
        source: "/manual.html",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
