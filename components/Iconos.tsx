/**
 * El juego de iconos del sistema: trazo de 1,3 px sobre rejilla de 20,
 * sin relleno y heredando el color. Nunca emoji ni dingbats.
 */

type Props = { className?: string; tam?: number };

function Svg({ children, tam = 15, className }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconoMesa = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="4" width="15" height="12" />
    <path d="M2.5 12.5 7 8.5l3.4 3 2.6-2.2 4.5 4" />
    <circle cx="13.4" cy="7.4" r="1.3" />
  </Svg>
);

/** La galería de repetidas: dos copias de la misma imagen, una sobre otra. */
export const IconoGaleria = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="2.5" width="11" height="11" />
    <rect x="6.5" y="6.5" width="11" height="11" />
    <path d="M6.5 14.5 9.5 11.5l2 2 2-1.6 3.5 3" />
  </Svg>
);

export const IconoSeries = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="3.5" width="6" height="6" />
    <rect x="11.5" y="3.5" width="6" height="6" />
    <rect x="2.5" y="10.5" width="6" height="6" />
    <rect x="11.5" y="10.5" width="6" height="6" />
  </Svg>
);

export const IconoEntradas = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 4.2h6a2 2 0 0 1 2 2v10a1.6 1.6 0 0 0-1.6-1.4H3.5z" />
    <path d="M16.5 4.2h-3a2 2 0 0 0-2 2v10a1.6 1.6 0 0 1 1.6-1.4h3.4z" />
  </Svg>
);

export const IconoArchivo = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="4" width="15" height="3.4" />
    <path d="M4 7.4v8.6h12V7.4" />
    <path d="M8 10.6h4" />
  </Svg>
);

export const IconoSubir = (p: Props) => (
  <Svg {...p}>
    <path d="M10 12.5V2.8" />
    <path d="M6.6 6.2 10 2.8l3.4 3.4" />
    <path d="M3 12.2v3.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-3.5" />
  </Svg>
);

export const IconoBuscar = (p: Props) => (
  <Svg {...p}>
    <circle cx="8.8" cy="8.8" r="5.3" />
    <path d="m12.8 12.8 4 4" />
  </Svg>
);

export const IconoMas = (p: Props) => (
  <Svg {...p}>
    <path d="M10 4.2v11.6M4.2 10h11.6" />
  </Svg>
);

export const IconoVisto = (p: Props) => (
  <Svg {...p}>
    <path d="m4 10.4 4 4 8-8.8" />
  </Svg>
);

export const IconoCerrar = (p: Props) => (
  <Svg {...p}>
    <path d="m5 5 10 10M15 5 5 15" />
  </Svg>
);

export const IconoArriba = (p: Props) => (
  <Svg {...p}>
    <path d="M10 15.5v-11M5.5 9 10 4.5 14.5 9" />
  </Svg>
);

export const IconoAbajo = (p: Props) => (
  <Svg {...p}>
    <path d="M10 4.5v11M5.5 11 10 15.5 14.5 11" />
  </Svg>
);

export const IconoIzquierda = (p: Props) => (
  <Svg {...p}>
    <path d="M15.5 10h-11M9 5.5 4.5 10 9 14.5" />
  </Svg>
);

export const IconoDerecha = (p: Props) => (
  <Svg {...p}>
    <path d="M4.5 10h11M11 5.5 15.5 10 11 14.5" />
  </Svg>
);

export const IconoMenu = (p: Props) => (
  <Svg {...p}>
    <path d="M3 5.5h14M3 10h14M3 14.5h14" />
  </Svg>
);

export const IconoPie = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="3.5" width="15" height="13" />
    <path d="M2.5 12.5h15" />
    <path d="M5.2 14.6h4.4" />
  </Svg>
);

export const IconoVisitas = (p: Props) => (
  <Svg {...p}>
    <path d="M2.5 16.5v-5" />
    <path d="M7.4 16.5V8.2" />
    <path d="M12.3 16.5v-6.4" />
    <path d="M17.2 16.5V4.5" />
  </Svg>
);

export const IconoAviso = (p: Props) => (
  <Svg {...p}>
    <path d="M10 2.8 18 16.5H2z" />
    <path d="M10 8v3.6" />
    <path d="M10 13.9v.1" />
  </Svg>
);

export const IconoImportar = (p: Props) => (
  <Svg {...p}>
    <path d="M10 3v9.2" />
    <path d="M6.6 8.8 10 12.2l3.4-3.4" />
    <path d="M3 13v3a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 17 16v-3" />
  </Svg>
);

export const IconoInicio = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="4.5" width="15" height="11" />
    <path d="M2.5 12 6.8 8.4l3 2.6 2.4-2 5.3 4.4" />
    <circle cx="13.2" cy="7.8" r="1.1" />
  </Svg>
);

export const IconoPersona = (p: Props) => (
  <Svg {...p}>
    <circle cx="10" cy="7" r="3.1" />
    <path d="M3.8 17c.4-3.2 3-5.2 6.2-5.2s5.8 2 6.2 5.2" />
  </Svg>
);

/** Sobre mí: el retrato dentro de su marco, como una ficha del archivo. */
export const IconoRetrato = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="2.8" width="14" height="14.4" />
    <circle cx="10" cy="8" r="2.3" />
    <path d="M5.9 15c.5-2.1 2.1-3.3 4.1-3.3s3.6 1.2 4.1 3.3" />
  </Svg>
);

/** Páginas de error: el fotograma que no salió. */
export const IconoPercance = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="4" width="14" height="12" />
    <path d="M6.6 7.6l6.8 4.8M13.4 7.6l-6.8 4.8" />
  </Svg>
);

/** Contacto: el sobre. Se llama «correo» para no confundirlo con «sobre mí». */
export const IconoCorreo = (p: Props) => (
  <Svg {...p}>
    <rect x="2.5" y="4.5" width="15" height="11" />
    <path d="m2.9 5.2 7.1 5.3 7.1-5.3" />
  </Svg>
);

/** Tema claro: el sol de la ampliadora apagada. */
export const IconoSol = (p: Props) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="3.4" />
    <path d="M10 2.6v1.8M10 15.6v1.8M17.4 10h-1.8M4.4 10H2.6M15.2 4.8l-1.3 1.3M6.1 13.9l-1.3 1.3M15.2 15.2l-1.3-1.3M6.1 6.1 4.8 4.8" />
  </Svg>
);

/** Tema oscuro: la luz de seguridad del cuarto. */
export const IconoLuna = (p: Props) => (
  <Svg {...p}>
    <path d="M16.2 11.8A6.6 6.6 0 0 1 8.2 3.8a6.9 6.9 0 1 0 8 8Z" />
  </Svg>
);

/** El asa por la que se agarra una pieza para moverla de sitio. */
export const IconoAsa = (p: Props) => (
  <Svg {...p}>
    <circle cx="7.6" cy="5" r=".9" />
    <circle cx="12.4" cy="5" r=".9" />
    <circle cx="7.6" cy="10" r=".9" />
    <circle cx="12.4" cy="10" r=".9" />
    <circle cx="7.6" cy="15" r=".9" />
    <circle cx="12.4" cy="15" r=".9" />
  </Svg>
);

/** Las categorías de las entradas: la etiqueta que se le cuelga a un texto. */
export const IconoEtiqueta = (p: Props) => (
  <Svg {...p}>
    <path d="M10.4 2.5H17.5v7.1l-7.9 7.9-7.1-7.1z" />
    <circle cx="14.2" cy="5.8" r="1.1" />
  </Svg>
);

/** La letra pequeña: cookies, privacidad y términos. Un pliego con su sello. */
export const IconoLegal = (p: Props) => (
  <Svg {...p}>
    <path d="M4.5 2.5h7.6l3.4 3.4v11.6h-11z" />
    <path d="M11.8 2.6v3.6h3.6" />
    <path d="M6.8 9.4h6.4M6.8 12.2h6.4M6.8 15h3.6" />
  </Svg>
);

/** Lo que no cabe en la barra: se abre en una hoja. */
export const IconoPuntos = (p: Props) => (
  <Svg {...p}>
    <circle cx="4.4" cy="10" r=".9" />
    <circle cx="10" cy="10" r=".9" />
    <circle cx="15.6" cy="10" r=".9" />
  </Svg>
);
