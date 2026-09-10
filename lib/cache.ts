import { createClient } from "redis";
import superjson from "superjson";

/**
 * Caché de consultas sobre Dragonfly (habla el protocolo de Redis).
 *
 * Tres decisiones que conviene no deshacer sin pensarlo:
 *
 *  · **Si la caché no está, la web funciona igual.** Todo lo de aquí devuelve
 *    el resultado de consultar la base cuando Dragonfly no contesta. Una
 *    caché que tumba el sitio al caerse es peor que no tener caché.
 *
 *  · **Se serializa con superjson, no con JSON.** Prisma devuelve fechas, y
 *    `JSON.stringify` las convierte en texto: la página que hace
 *    `fecha.getUTCFullYear()` reventaría al leer de la caché y no al leer de
 *    la base. Un fallo que sólo aparece en la segunda visita.
 *
 *  · **Al fallar la conexión se apaga un rato.** Sin eso, con Dragonfly caído
 *    cada visita esperaría el tiempo de conexión antes de rendirse, y la
 *    caché acabaría siendo más lenta que no tenerla.
 */

const URL = process.env.REDIS_URL;
const PREFIJO = "photojhon:";
const ESPERA_CONEXION = 1500;
const DESCANSO_TRAS_FALLO = 30_000;

// El tipo sale de la propia llamada: `ReturnType<typeof createClient>` usa
// los genéricos por defecto y no encaja con el cliente que creamos aquí.
function nuevoCliente() {
  return createClient({
    url: URL,
    socket: { connectTimeout: ESPERA_CONEXION, reconnectStrategy: false },
  });
}

type Cliente = ReturnType<typeof nuevoCliente>;

// Next recarga los módulos en desarrollo; sin cachear el cliente abriríamos
// una conexión por recarga, igual que con Prisma.
const global_ = globalThis as unknown as {
  clienteCache?: Cliente | null;
  cacheApagadaHasta?: number;
};

async function cliente(): Promise<Cliente | null> {
  if (!URL) return null;
  if ((global_.cacheApagadaHasta ?? 0) > Date.now()) return null;

  const ya = global_.clienteCache;
  if (ya?.isReady) return ya;

  try {
    const nuevo = nuevoCliente();
    // Sin oyente de errores, node-redis tumba el proceso al perder la conexión.
    nuevo.on("error", () => {});
    await nuevo.connect();
    global_.clienteCache = nuevo;
    return nuevo;
  } catch {
    global_.clienteCache = null;
    global_.cacheApagadaHasta = Date.now() + DESCANSO_TRAS_FALLO;
    return null;
  }
}

/**
 * Devuelve lo guardado o calcula y guarda. `segundos` es el tope de tiempo que
 * puede quedar viejo si nadie lo invalida antes; el panel llama a `olvidar()`
 * en cada cambio, así que en la práctica se refresca al momento.
 */
export async function enCache<T>(
  clave: string,
  segundos: number,
  calcular: () => Promise<T>,
): Promise<T> {
  const c = await cliente();
  if (!c) return calcular();

  const llave = PREFIJO + clave;

  try {
    const guardado = await c.get(llave);
    if (typeof guardado === "string") return superjson.parse<T>(guardado);
  } catch {
    // Lectura fallida: se sigue como si no hubiera nada guardado.
  }

  const valor = await calcular();

  try {
    await c.set(llave, superjson.stringify(valor), { EX: segundos });
  } catch {
    // Escritura fallida: el visitante ya tiene su respuesta, que es lo que importa.
  }

  return valor;
}

/** Tira todo lo guardado del sitio. Lo llama el panel al tocar cualquier cosa. */
export async function olvidar(): Promise<number> {
  const c = await cliente();
  if (!c) return 0;

  let borradas = 0;
  try {
    for await (const llaves of c.scanIterator({ MATCH: `${PREFIJO}*`, COUNT: 200 })) {
      const lote = Array.isArray(llaves) ? llaves : [llaves];
      if (lote.length === 0) continue;
      borradas += await c.del(lote);
    }
  } catch {
    // Si no se puede limpiar, el tope de tiempo acaba haciéndolo por su cuenta.
  }
  return borradas;
}

/** Para el arranque y para saber si de verdad está enchufado. */
export async function estadoDeLaCache() {
  if (!URL) return { activa: false, motivo: "sin REDIS_URL" as const };
  const c = await cliente();
  if (!c) return { activa: false, motivo: "no contesta" as const };
  try {
    await c.ping();
    return { activa: true, motivo: "lista" as const };
  } catch {
    return { activa: false, motivo: "no contesta" as const };
  }
}
