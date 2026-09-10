/**
 * Las tres páginas de letra pequeña: cookies, privacidad y términos.
 *
 * Van juntas porque son la misma clase de página —texto largo, partido en
 * secciones, que casi nadie lee y que tiene que estar— y porque se escriben de
 * una sentada en /admin/legales. Cada una es una fila de `Ajuste` en JSON,
 * igual que el aviso o la página de contacto.
 *
 * Cada una lleva su propio interruptor. Un sitio que no recoge nada puede
 * decidir que con el aviso le sobra, y una página de cookies en un sitio sin
 * cookies llega a resultar cómica; apagarla es tan legítimo como apagar el
 * las entradas. Apagada, la dirección contesta «no encontrada» y desaparece del
 * pie y del mapa del sitio.
 *
 * Aquí sólo están los datos —sin base y sin caché— para que el editor del
 * panel pueda importarlos desde el navegador; la lectura vive en
 * `lib/legalesDelSitio.ts`.
 *
 * Sobre el texto de fábrica: está escrito desde lo que este sitio hace de
 * verdad —sin cookies, con contador propio, con el cubo de escaneos cerrado y
 * con los rastreadores de I.A. bloqueados en `lib/ia.ts`— y no desde una
 * plantilla genérica. Aun así es un punto de partida, no un dictamen: quien
 * firma pone su nombre, su dirección y lo que un abogado le diga, desde el
 * panel y sin tocar un fichero.
 */

export type ClaveLegal = "cookies" | "privacidad" | "terminos";

export const CLAVE_LEGAL: Record<ClaveLegal, string> = {
  cookies: "sitio.legal.cookies",
  privacidad: "sitio.legal.privacidad",
  terminos: "sitio.legal.terminos",
};

/** Una sección: un rótulo y su texto. Admite `[lo que se lee](/ruta)`. */
export type SeccionLegal = { titulo: string; texto: string };

export type TextosLegales = {
  titulo: string;
  entradilla: string;
  secciones: SeccionLegal[];
};

export type Legal = TextosLegales & {
  /** false = la página no existe hacia fuera. */
  visible: boolean;
};

/** Lo que además se lee de la base: cuándo se guardó por última vez. */
export type LegalCompleta = Legal & { actualizada: Date | null };

export const TOPES = {
  titulo: 60,
  entradilla: 400,
  tituloSeccion: 80,
  texto: 4000,
  /** Cuántas secciones caben. No es la maqueta: es que nadie lee más. */
  secciones: 16,
} as const;

/**
 * De qué va cada una, dónde vive y qué se pierde al apagarla. Lo usa el panel
 * para no tener que explicarlo con el nombre de la clave, y el pie y el mapa
 * del sitio para saber a dónde enlazan.
 */
export const CATALOGO: {
  clave: ClaveLegal;
  ruta: string;
  /** Lo corto, que es lo que cabe en el pie. */
  enlace: string;
  nombre: string;
  que: string;
  alApagarla: string;
  /** true = debajo del texto sale la lista de rastreadores bloqueados. */
  conListaDeIA?: boolean;
}[] = [
  {
    clave: "cookies",
    ruta: "/cookies",
    enlace: "Cookies",
    nombre: "Información sobre cookies",
    que: "Qué se guarda en el navegador de quien visita el sitio. Ahora mismo: ninguna cookie.",
    alApagarla:
      "Mientras el sitio no ponga cookies no hay nada que sea obligatorio publicar. Si algún día entra cualquier cosa de fuera —un vídeo incrustado, un mapa, un botón de una red— vuelve a hacer falta.",
  },
  {
    clave: "privacidad",
    ruta: "/privacidad",
    enlace: "Privacidad",
    nombre: "Política de privacidad",
    que: "Qué datos se recogen, para qué, cuánto tiempo se guardan y cómo se pide que se borren.",
    alApagarla:
      "Los datos se siguen recogiendo igual: quien escriba deja su nombre, su correo y su mensaje. Lo que se pierde es el sitio donde está explicado qué pasa con ellos, que es lo que la ley pide tener publicado.",
  },
  {
    clave: "terminos",
    ruta: "/terminos",
    enlace: "Términos",
    nombre: "Términos y condiciones",
    que: "De quién son las fotografías, qué se puede hacer con ellas y qué no. Lleva además lo que se les pide a los sistemas de I.A.",
    alApagarla:
      "Los derechos de autor no dependen de que estén escritos en una página: existen igual. Lo que se pierde es el sitio donde decirlo y el enlace al que apuntar cuando alguien pregunte.",
    conListaDeIA: true,
  },
];

export const enCatalogo = (clave: string) =>
  CATALOGO.find((p) => p.clave === clave) ?? null;

export const esClaveLegal = (clave: string): clave is ClaveLegal =>
  CATALOGO.some((p) => p.clave === clave);

/* ---------------------------------------------------------- lo de fábrica */

const COOKIES: TextosLegales = {
  titulo: "Cookies",
  entradilla:
    "Este sitio no pone ninguna cookie. No hay banner que aceptar porque no hay nada que consentir, y no es una manera elegante de decir «sólo las necesarias»: son cero.",
  secciones: [
    {
      titulo: "Por qué no hay",
      texto: `Una cookie es un dato que una web deja en tu navegador y que vuelve a ella en cada petición. Sirve para reconocerte entre visitas, y de ahí sale casi todo lo demás: la publicidad que te persigue, los perfiles, los paneles de consentimiento con doscientos «socios».

Aquí no hay ninguna porque no hay nada que la necesite. No hay anuncios, ni botones de redes incrustados, ni vídeos de fuera, ni mapas, ni tipografías pedidas al servidor de otro: las letras se sirven desde este mismo dominio. Ninguna página de este sitio hace una sola petición a un servidor ajeno.`,
    },
    {
      titulo: "Lo que sí se guarda en tu navegador",
      texto: `Dos cosas, y las dos en el almacenamiento local, que no es una cookie: no viaja al servidor, no se manda a ninguna parte y se queda en tu equipo hasta que borres los datos del sitio.

La primera es si prefieres el papel claro o el cuarto oscuro, y sólo se escribe si tocas el interruptor. La segunda es la versión del [aviso de entrada](/aviso) que ya cerraste, para no volver a ponértelo delante cada vez que entras.

Las dos son preferencias tuyas y las dos se borran desde tu navegador cuando quieras. Si las borras, el sitio abre en oscuro y el aviso vuelve a salir una vez. No pasa nada más.`,
    },
    {
      titulo: "Cómo se cuentan las visitas",
      texto: `Con un contador propio, alojado aparte y sin cookies: registra qué páginas se ven, cuántas veces y de dónde se llega —de una búsqueda, de un enlace, de una red—, y nada más. No hay huella del navegador, no hay identificador que dure entre visitas y no hay manera de saber quién eres ni de seguirte a ningún otro sitio.

Puede además estar apagado. Si lo está, no se cuenta absolutamente nada.`,
    },
    {
      titulo: "La única cookie de todo el dominio",
      texto: `La de la sesión del panel de administración. Se pone al iniciar sesión, sirve para no tener que escribir la contraseña en cada página y sólo la tiene quien administra el sitio.

Si has llegado aquí como visitante, no la tienes ni hay forma de que la tengas.`,
    },
    {
      titulo: "Si esto cambia",
      texto: `El día que entre cualquier cosa de fuera —un vídeo incrustado, un mapa, una pasarela de pago— habrá que revisar esta página antes de encenderla, y probablemente hará falta pedir consentimiento de verdad. Mientras esta página diga lo que dice, es porque sigue siendo cierto.

Sobre qué se hace con las fotografías y con los sistemas de I.A. está [el aviso](/aviso), y están los [términos](/terminos).`,
    },
  ],
};

const PRIVACIDAD: TextosLegales = {
  titulo: "Política de privacidad",
  entradilla:
    "Qué se recoge, para qué, cuánto tiempo se guarda y cómo se pide que se borre. Es corta porque se recoge poco.",
  secciones: [
    {
      titulo: "Quién responde de esto",
      texto: `El responsable del tratamiento es el autor del sitio, y a él hay que escribir para cualquiera de las cosas que aquí se dicen.

Antes de publicar el sitio, cambia este párrafo desde el panel por tu nombre completo, tu identificación fiscal si la ley te la exige y una dirección donde se te pueda escribir. Es lo único de esta página que no puede quedarse como está.`,
    },
    {
      titulo: "Lo que se guarda cuando alguien escribe",
      texto: `Tres cosas: el nombre que dejas, tu correo y el mensaje. Nada más — no se pide teléfono, no se pide dirección, y no se rellena nada por tu parte sin que lo veas.

Se guardan en la base de datos de este mismo sitio y sirven para una sola cosa: leer lo que has escrito y poder contestarte. No hay ningún proveedor de correo por medio, no se comparten con nadie, no se usan para mandarte nada que no hayas pedido y no hay boletín al que apuntarse.

La base legal es tu consentimiento, que es lo que das al escribir. Puedes retirarlo cuando quieras pidiendo que se borre el mensaje.`,
    },
    {
      titulo: "Cuánto tiempo se guarda",
      texto: `El mensaje se conserva mientras la conversación tenga sentido y, después, el tiempo que haga falta para responder de ella si llega el caso. Cuando deja de servir para algo, se borra.

Si prefieres que se borre antes, escríbeme y se borra. No hay que dar explicaciones.`,
    },
    {
      titulo: "Quién más lo ve",
      texto: `Nadie más lo lee. Sí hay, inevitablemente, empresas que sostienen la infraestructura y que por tanto tienen acceso técnico a lo que hay dentro: quien aloja el servidor y la base de datos, y quien guarda los escaneos originales de las fotografías. Actúan como encargados del tratamiento, con contrato, y no pueden usar nada de esto para sus propios fines.

No hay analítica de terceros, no hay publicidad, no hay redes sociales incrustadas, y no se vende ni se cede nada a nadie. Nunca.`,
    },
    {
      titulo: "Visitas y registros del servidor",
      texto: `Las visitas se cuentan con un contador propio y sin cookies: qué páginas se ven y de dónde se llega. No identifica a nadie. En [cookies](/cookies) está explicado con detalle.

Aparte, el servidor deja los registros técnicos de siempre —peticiones, errores— que sirven para saber si algo se ha roto y se rotan solos. Es lo mínimo para que una web funcione.`,
    },
    {
      titulo: "Tus derechos",
      texto: `Puedes pedir acceso a lo que haya tuyo, que se corrija, que se borre, que se limite su uso, que se te entregue en un fichero, y oponerte a que se trate. Se hace escribiendo al responsable, sin más trámite que decirlo.

Se contesta en un mes como mucho, y en la práctica en bastante menos. Si crees que algo no se ha hecho bien, puedes reclamar ante la autoridad de control de tu país; en España es la Agencia Española de Protección de Datos.`,
    },
    {
      titulo: "Fotografías de personas",
      texto: `En este archivo hay fotografías hechas en la calle y en espacios públicos. Si apareces en alguna y no quieres estar, escribe: se retira. No hace falta ningún argumento jurídico, ni discutirlo, ni justificar nada — basta con decirlo, y se hace.

Sobre por qué esto se ha vuelto más delicado de lo que era, está [el aviso](/aviso).`,
    },
    {
      titulo: "Sistemas de inteligencia artificial",
      texto: `No se cede ningún dato de este sitio a ningún sistema de I.A., ni los mensajes ni las fotografías. A los rastreadores que recogen material para entrenarlos se les cierra el sitio entero: la lista completa y cómo se hace están en los [términos](/terminos).`,
    },
  ],
};

const TERMINOS: TextosLegales = {
  titulo: "Términos y condiciones",
  entradilla:
    "De quién son las fotografías, qué puedes hacer con ellas sin preguntar y qué no. Y lo que se les pide, por escrito, a los sistemas de inteligencia artificial.",
  secciones: [
    {
      titulo: "De quién es esto",
      texto: `Todas las fotografías de este sitio, los textos de las entradas y el propio diseño de las páginas son obra del autor y están protegidos por los derechos de autor. Que estén publicadas y se puedan ver gratis no las convierte en material libre: no hay ninguna licencia abierta sobre ellas.`,
    },
    {
      titulo: "Lo que puedes hacer sin pedir permiso",
      texto: `Mirarlas todo lo que quieras. Enlazar cualquier página de este sitio desde donde te apetezca, sin avisar. Citar un trozo de un texto diciendo de dónde sale y enlazando al original. Enseñárselo a alguien. Guardarte una imagen para verla tú.

Nada de eso requiere permiso ni se va a discutir nunca.`,
    },
    {
      titulo: "Lo que no",
      texto: `Publicarlas en otro sitio, aunque sea citando al autor. Recortarlas, reencuadrarlas, retocarlas o pasarles un filtro. Usarlas en algo comercial, en una portada, en un cartel, en un fondo de pantalla que se vende. Venderlas, imprimirlas para vender o registrarlas a tu nombre. Vaciar el sitio con un programa para llevarte el archivo entero.

Si quieres usar una fotografía para algo, pregunta antes: se habla. Casi siempre la respuesta a una petición razonable es que sí, y a veces sale gratis. Lo que no va a pasar es enterarse por casualidad.`,
    },
    {
      titulo: "Nada de esto entra en un modelo de I.A.",
      texto: `Queda expresamente prohibido usar cualquier contenido de este sitio —las fotografías, los textos, los pies, las fichas técnicas— para entrenar, ajustar, evaluar o alimentar modelos de inteligencia artificial, ni por cuenta propia ni para terceros, con ánimo de lucro o sin él. La prohibición alcanza a la extracción masiva y a la recolección automatizada de cualquier tipo, sea para un conjunto de entrenamiento, para un índice de búsqueda generativa o para lo que venga después.

Esta reserva de derechos se hace al amparo de lo previsto para la minería de textos y datos, y se dice en los tres sitios donde se mira: en el fichero robots.txt de este dominio, en las etiquetas de cada página —noai, noimageai— y en la cabecera con la que se sirve cada fotografía.

A los rastreadores conocidos se les cierra el sitio entero, uno a uno y por su nombre. La lista está debajo, y es exactamente la misma que sirve robots.txt: se lee del mismo sitio, así que no puede quedarse desfasada.`,
    },
    {
      titulo: "Dicho con honestidad",
      texto: `El fichero robots.txt es una petición, no una puerta cerrada. Quien decida no respetarla entrará igual, y no hay web en el mundo que pueda impedirlo del todo. Lo que sí es una barrera de verdad está en otro lado: los escaneos originales —los ficheros grandes, los que servirían para algo— no los sirve ninguna dirección de este sitio y viven en un almacén cerrado. Lo que se publica son copias a la medida de la pantalla.

Se dice así porque prometer una protección que no existe sería justo lo contrario de lo que esta página intenta hacer.`,
    },
    {
      titulo: "El sitio se ofrece como está",
      texto: `Es un archivo personal, mantenido por una persona. Puede estar caído, puede haber una errata, una fecha mal puesta o una dirección que dejó de funcionar. Se agradece que se avise y se corrige, pero no hay compromiso de disponibilidad ni responsabilidad por lo que pase por no poder entrar un rato.

Las direcciones del blog antiguo se han conservado y traen aquí. Si te encuentras una rota, avísame y se arregla.`,
    },
    {
      titulo: "Cambios y ley aplicable",
      texto: `Estas condiciones pueden cambiar. Cuando lo hagan, cambia la fecha de arriba y lo que vale es lo que ponga aquí ese día.

Se aplica la legislación española, y para cualquier disputa los juzgados que correspondan por ley. Antes de eso, lo normal es escribir un correo: casi todo se arregla así.`,
    },
  ],
};

export const POR_DEFECTO: Record<ClaveLegal, TextosLegales> = {
  cookies: COOKIES,
  privacidad: PRIVACIDAD,
  terminos: TERMINOS,
};

/** Una copia, para que nadie pueda tocar el original por descuido. */
export const deFabrica = (clave: ClaveLegal): TextosLegales => {
  const f = POR_DEFECTO[clave];
  return {
    titulo: f.titulo,
    entradilla: f.entradilla,
    secciones: f.secciones.map((s) => ({ titulo: s.titulo, texto: s.texto })),
  };
};

/** Qué páginas legales están encendidas. Un sitio recién puesto las enseña todas. */
export type LegalesVisibles = Record<ClaveLegal, boolean>;

export const VISIBLES_POR_DEFECTO: LegalesVisibles = {
  cookies: true,
  privacidad: true,
  terminos: true,
};

/** Si dos listas de secciones son la misma cosa. Lo usa el panel para no guardar de más. */
export const mismasSecciones = (a: SeccionLegal[], b: SeccionLegal[]) =>
  a.length === b.length &&
  a.every((s, i) => s.titulo === b[i].titulo && s.texto === b[i].texto);
