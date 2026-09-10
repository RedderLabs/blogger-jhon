/** Anchos que ofrece el panel al subir un lote. 0 = servir el escaneo entero. */
export const ANCHOS_DISPONIBLES = [
  { valor: 800, etiqueta: "800 px", nota: "Ligera. Suficiente para leer la foto en un portátil." },
  { valor: 1200, etiqueta: "1200 px", nota: "Por defecto. La copia llena una pantalla de escritorio." },
  { valor: 1600, etiqueta: "1600 px", nota: "Para monitores grandes o si quieres que se aprecie el grano." },
  { valor: 2048, etiqueta: "2048 px", nota: "Casi el escaneo. Pesa, y se puede descargar con más facilidad." },
  { valor: 0, etiqueta: "Sin límite", nota: "Se sirve el escaneo tal cual se subió." },
] as const;

/**
 * El ancho de fábrica. El del sitio se elige en /admin/ajustes y se guarda en
 * `Ajuste`; esto es lo que sale mientras no se haya tocado.
 */
export const ANCHO_POR_DEFECTO = 1200;

export const CLAVE_ANCHO = "sitio.anchoMax";

/**
 * Lo que sharp sabe leer, y por tanto lo único que se acepta al subir. El RAW
 * de cámara hay que revelarlo antes.
 *
 * Está aquí, con el resto de medidas de una foto, porque lo miran los dos
 * lados: el servidor al recibir el fichero y el navegador al soltarlo en la
 * caja, para poder decir que no antes de subir veinte megas en balde.
 */
export const TIPOS_ACEPTADOS = [
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
  "image/avif",
];

type Medible = { ancho: number; alto: number; anchoMax: number };

/**
 * Ancho y alto a los que se pide la copia. El tope de escritorio lo fija
 * `anchoMax` (1200 px por defecto); nunca se sube por encima del escaneo real,
 * porque ampliar un negativo escaneado sólo añade peso.
 */
export function medidasDeVisualizacion(foto: Medible) {
  const tope = foto.anchoMax > 0 ? Math.min(foto.ancho, foto.anchoMax) : foto.ancho;
  return {
    ancho: tope,
    alto: Math.max(1, Math.round((foto.alto * tope) / foto.ancho)),
  };
}

/**
 * El atributo `sizes` de la copia grande: a pantalla completa en móvil y
 * tableta, y limitada al tope en escritorio para no pedir más píxeles de los
 * que se van a pintar.
 */
export function sizesDeCopia(foto: Medible) {
  const { ancho } = medidasDeVisualizacion(foto);
  return `(max-width: 767px) 100vw, (max-width: 1023px) 92vw, min(${ancho}px, 62vw)`;
}

export function esVertical(foto: { ancho: number; alto: number }) {
  return foto.alto > foto.ancho;
}

/** "03" para el número de fotograma. */
export function dosDigitos(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function fechaLarga(d: Date | null | undefined) {
  if (!d) return "";
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** El formato con puntos medios de la ficha técnica: 20 · 08 · 2026 */
export function fechaFicha(d: Date | null | undefined) {
  if (!d) return "";
  return `${dosDigitos(d.getUTCDate())} · ${dosDigitos(d.getUTCMonth() + 1)} · ${d.getUTCFullYear()}`;
}

export function fechaCorta(d: Date | null | undefined) {
  if (!d) return "";
  return `${dosDigitos(d.getUTCDate())} · ${dosDigitos(d.getUTCMonth() + 1)}`;
}

export function nombreMes(d: Date) {
  const m = MESES[d.getUTCMonth()];
  return m.charAt(0).toUpperCase() + m.slice(1);
}

/** Los años tal y como los escribe la serie: «2024—» si sigue abierta. */
export function rangoDeAnos(anoInicio: number, anoFin: number | null) {
  return anoFin ? `${anoInicio}—${anoFin}` : `${anoInicio}—`;
}

export const ESTADOS_SERIE = {
  publica: { etiqueta: "Pública", color: "var(--color-verde)" },
  en_curso: { etiqueta: "En curso", color: "var(--color-rojo)" },
  oculta: { etiqueta: "Oculta", color: "var(--color-apagado)" },
} as const;

export type EstadoSerie = keyof typeof ESTADOS_SERIE;

export function estadoSerie(valor: string) {
  return ESTADOS_SERIE[valor as EstadoSerie] ?? ESTADOS_SERIE.en_curso;
}
