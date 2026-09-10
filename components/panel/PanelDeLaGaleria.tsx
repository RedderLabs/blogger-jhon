"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { borrarDuplicadas, borrarFotos, calcularHuellas } from "@/app/admin/acciones";

export type FotoDeGaleria = {
  id: string;
  archivo: string;
  titulo: string;
  alt: string;
  estado: string;
  medidas: string;
  rollo: string;
  orden: number;
  series: string[];
  deEntradas: string[];
  portadaDe: string | null;
  enAjustes: string[];
  enCuerpos: string[];
};

export type Grupo = {
  clave: string;
  /** El fichero es el mismo; si no, es que se ven igual. */
  identicas: boolean;
  fotos: FotoDeGaleria[];
};

/** Cuántas cosas del sitio se caerían si esta fotografía desapareciera. */
const usos = (f: FotoDeGaleria) =>
  f.series.length +
  f.deEntradas.length +
  f.enCuerpos.length +
  f.enAjustes.length +
  (f.portadaDe ? 1 : 0);

const comoSeUsa = (f: FotoDeGaleria) => {
  const partes: string[] = [];
  if (f.portadaDe) partes.push(`portada de ${f.portadaDe}`);
  if (f.series.length) partes.push(`en ${f.series.join(", ")}`);
  if (f.deEntradas.length) partes.push(`cabecera de «${f.deEntradas.join("», «")}»`);
  if (f.enCuerpos.length) partes.push(`dentro de «${f.enCuerpos.join("», «")}»`);
  for (const a of f.enAjustes) {
    if (a === "portada.apertura") partes.push("abre la portada");
    else if (a === "sobre-mi.retrato") partes.push("retrato de sobre mí");
    else partes.push(a);
  }
  return partes.length ? partes.join(" · ") : "no se usa en ninguna parte";
};

const numero = (f: FotoDeGaleria) => `${f.rollo}/${String(f.orden).padStart(2, "0")}`;

/** Cuántas se pintan de una vez. El resto está, pero no en el DOM. */
const TANDA = 60;

/**
 * La galería del panel: todo el archivo, con lo repetido arriba.
 *
 * Dos maneras de quitar una fotografía, y no son la misma:
 *
 *  · En un grupo de repetidas se elige cuál se queda y las demás **se
 *    funden** con ella: lo que las nombraba —el cuerpo de una entrada, la
 *    portada de una serie, la apertura— pasa a nombrar a la que se queda. No
 *    se pierde nada de lo que ya estaba montado.
 *  · En el archivo se borra a secas lo que se marque. Lo que apuntase a esas
 *    fotografías se queda sin ellas, y por eso cada una dice dónde se usa
 *    antes de que nadie marque nada.
 */
export function PanelDeLaGaleria({
  grupos,
  archivo,
  faltan,
  copiasDeMas,
}: {
  grupos: Grupo[];
  archivo: (FotoDeGaleria & { repetida: boolean })[];
  faltan: number;
  copiasDeMas: number;
}) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState(false);

  /* --- Lo repetido -------------------------------------------------------- */

  const [quedan, setQuedan] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      grupos.map((g) => [
        g.clave,
        [...g.fotos].sort((a, b) => usos(b) - usos(a))[0]?.id ?? "",
      ]),
    ),
  );
  const [aFundir, setAFundir] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      grupos.flatMap((g) => {
        const queda = [...g.fotos].sort((a, b) => usos(b) - usos(a))[0]?.id;
        return g.fotos.map((f) => [f.id, f.id !== queda]);
      }),
    ),
  );

  /* --- Todo el archivo ---------------------------------------------------- */

  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "repetidas" | "sueltas">("todas");
  const [tope, setTope] = useState(TANDA);

  const listadas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return archivo.filter((f) => {
      if (filtro === "repetidas" && !f.repetida) return false;
      if (filtro === "sueltas" && usos(f) > 0) return false;
      if (!q) return true;
      return [f.titulo, f.rollo, f.alt, ...f.series].join(" ").toLowerCase().includes(q);
    });
  }, [archivo, busca, filtro]);

  const enPantalla = listadas.slice(0, tope);
  const faltanDePintar = listadas.length - enPantalla.length;
  const enUso = [...marcadas].filter((id) => {
    const f = archivo.find((x) => x.id === id);
    return f && usos(f) > 0;
  }).length;

  function correr(trabajo: () => Promise<unknown>, aviso: string) {
    empezar(async () => {
      const r = (await trabajo()) as { error?: string } | undefined;
      setError(Boolean(r?.error));
      setMensaje(r?.error ?? aviso);
      router.refresh();
    });
  }

  function marcar(id: string, si: boolean) {
    setMarcadas((antes) => {
      const nuevas = new Set(antes);
      if (si) nuevas.add(id);
      else nuevas.delete(id);
      return nuevas;
    });
  }

  function elegirQueQueda(clave: string, id: string) {
    setQuedan((antes) => ({ ...antes, [clave]: id }));
    setAFundir((antes) => ({ ...antes, [id]: false }));
  }

  const fusionables = grupos.flatMap((g) =>
    g.fotos.filter((f) => aFundir[f.id] && f.id !== quedan[g.clave]).map((f) => f.id),
  );

  function fundirLoMarcado() {
    const trabajos = grupos
      .map((g) => ({
        queda: quedan[g.clave],
        fuera: g.fotos
          .filter((f) => aFundir[f.id] && f.id !== quedan[g.clave])
          .map((f) => f.id),
      }))
      .filter((t) => t.queda && t.fuera.length > 0);

    correr(async () => {
      for (const t of trabajos) {
        const r = (await borrarDuplicadas(t.queda, t.fuera)) as { error?: string };
        if (r?.error) return r;
      }
      return { ok: true };
    }, `Quitadas ${fusionables.length} ${fusionables.length === 1 ? "repetida" : "repetidas"}. Lo que las nombraba apunta ahora a la que se queda.`);
  }

  function borrarLoMarcado() {
    const ids = [...marcadas];
    const aviso =
      enUso > 0
        ? `¿Borrar ${ids.length} ${ids.length === 1 ? "fotografía" : "fotografías"}? ${enUso} ${enUso === 1 ? "está en uso y desaparecerá de donde esté" : "están en uso y desaparecerán de donde estén"}. No hay vuelta atrás.`
        : `¿Borrar ${ids.length} ${ids.length === 1 ? "fotografía" : "fotografías"}? No hay vuelta atrás.`;
    if (!confirm(aviso)) return;

    correr(async () => {
      const r = await borrarFotos(ids);
      if (!(r as { error?: string })?.error) setMarcadas(new Set());
      return r;
    }, `Borradas ${ids.length} ${ids.length === 1 ? "fotografía" : "fotografías"}.`);
  }

  /** La tarjeta de una fotografía, igual en los dos sitios. */
  const ficha = (
    f: FotoDeGaleria,
    opciones: {
      borde?: string;
      apagada?: boolean;
      pie?: React.ReactNode;
      repetida?: boolean;
    } = {},
  ) => (
    <div
      className="grid gap-2 border p-2"
      style={{ borderColor: opciones.borde ?? "var(--color-filo)" }}
    >
      <div className="relative aspect-[3/2] bg-marco">
        <Image
          src={f.archivo}
          alt={f.alt || f.titulo}
          fill
          quality={70}
          sizes="220px"
          className={`object-cover ${opciones.apagada ? "opacity-40" : ""}`}
        />
        {f.estado !== "publicada" && (
          <span className="absolute top-0 right-0 bg-cuarto/85 px-1 font-mono text-[.5rem] tracking-[.08em] text-dato uppercase">
            Bor
          </span>
        )}
        {opciones.repetida && (
          <span className="absolute top-0 left-0 bg-rojo/85 px-1 font-mono text-[.5rem] tracking-[.08em] text-papel uppercase">
            Repe
          </span>
        )}
      </div>

      <p className="m-0 font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-dato">
        {numero(f)} · {f.medidas}
      </p>
      <p className="m-0 truncate text-[.8125rem] leading-snug text-papel" title={f.titulo}>
        {f.titulo}
      </p>
      <p className="m-0 font-mono text-[.62rem] leading-relaxed tracking-[.03em] text-apagado">
        {comoSeUsa(f)}
      </p>
      {opciones.pie}
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-papel">Galería</p>
        <p className="font-mono text-[.7rem] tracking-[.06em] text-dato">
          {archivo.length} en el archivo
          {grupos.length > 0 &&
            ` · ${grupos.length} ${grupos.length === 1 ? "imagen repetida" : "imágenes repetidas"} · ${copiasDeMas} de más`}
        </p>
        {marcadas.size > 0 && (
          <button
            type="button"
            className="btn btn-p ml-auto"
            disabled={enCurso}
            onClick={borrarLoMarcado}
          >
            {enCurso
              ? "Borrando…"
              : `Borrar ${marcadas.size} ${marcadas.size === 1 ? "marcada" : "marcadas"}`}
          </button>
        )}
      </header>

      {mensaje && (
        <p
          role="status"
          className={`border-b border-filo px-4 py-2 font-mono text-[.7rem] tracking-[.04em] sm:px-6 ${
            error ? "bg-[rgb(217_80_58/.12)] text-rojo" : "bg-[rgb(217_80_58/.08)]"
          }`}
        >
          {mensaje}
        </p>
      )}

      <div className="flex-1 p-4 sm:p-6">
        {faltan > 0 && (
          <div className="mb-5 grid gap-3 border border-filo p-4">
            <p className="m-0 font-mono text-[.72rem] leading-relaxed tracking-[.04em] text-dato">
              {faltan}{" "}
              {faltan === 1
                ? "fotografía todavía sin comparar"
                : "fotografías todavía sin comparar"}
              . La huella del fichero se le pide al cubo; la de lo que se ve
              obliga a traerse la fotografía, así que va de veinte en veinte y
              se paga una sola vez por fotografía.
            </p>
            <button
              type="button"
              className="btn w-fit"
              disabled={enCurso}
              onClick={() =>
                correr(
                  () => calcularHuellas(20),
                  "Tanda comparada. Si quedan más, dale otra vez.",
                )
              }
            >
              {enCurso ? "Comparando…" : "Comparar una tanda"}
            </button>
          </div>
        )}

        {/* --- Lo repetido ------------------------------------------------- */}
        {grupos.length > 0 && (
          <section className="mb-8 grid gap-4">
            <div className="grid gap-2">
              <p className="lbl">Lo repetido</p>
              <h2 className="font-serif text-[1.4rem] leading-none font-bold sm:text-[1.7rem]">
                {grupos.length}{" "}
                {grupos.length === 1 ? "imagen repetida" : "imágenes repetidas"}
              </h2>
              <p className="m-0 max-w-[70ch] text-[.9375rem] leading-relaxed text-dato">
                Se comparan la huella del fichero, que encuentra las copias
                exactas, y la de lo que se ve, que encuentra la misma fotografía
                guardada otra vez con distinta compresión —lo que dejó el
                traslado del blog—. De cada grupo se queda una, y lo que
                nombraba a las otras pasa a nombrarla a ella: el cuerpo de una
                entrada, su imagen de cabecera, la portada de una serie y lo que
                hubiera fijado en los ajustes. No se queda ninguna página con un
                hueco.
              </p>
              {fusionables.length > 0 && (
                <button
                  type="button"
                  className="btn btn-p w-fit"
                  disabled={enCurso}
                  onClick={fundirLoMarcado}
                >
                  {enCurso
                    ? "Quitando…"
                    : `Quitar ${fusionables.length} ${fusionables.length === 1 ? "repetida" : "repetidas"}`}
                </button>
              )}
            </div>

            {grupos.map((g) => (
              <div key={g.clave} className="grid gap-3 border border-filo p-3 sm:p-4">
                <p className="m-0 font-mono text-[.66rem] tracking-[.06em] text-apagado">
                  {g.fotos.length} copias ·{" "}
                  {g.identicas
                    ? "el mismo fichero"
                    : "la misma imagen, guardada de otra manera"}
                </p>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {g.fotos.map((f) => {
                    const queda = quedan[g.clave] === f.id;
                    const fuera = Boolean(aFundir[f.id]) && !queda;
                    return (
                      <div key={f.id}>
                        {ficha(f, {
                          borde: queda
                            ? "var(--color-verde)"
                            : fuera
                              ? "var(--color-rojo)"
                              : "var(--color-filo)",
                          apagada: fuera,
                          pie: (
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                className="seg"
                                data-on={queda ? "si" : undefined}
                                aria-pressed={queda}
                                onClick={() => elegirQueQueda(g.clave, f.id)}
                              >
                                {queda ? "Se queda" : "Que se quede ésta"}
                              </button>
                              {!queda && (
                                <label className="flex items-center gap-2 font-mono text-[.66rem] tracking-[.06em] text-dato">
                                  <input
                                    type="checkbox"
                                    checked={fuera}
                                    onChange={(e) =>
                                      setAFundir((antes) => ({
                                        ...antes,
                                        [f.id]: e.target.checked,
                                      }))
                                    }
                                  />
                                  Quitar
                                </label>
                              )}
                            </div>
                          ),
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* --- Todo el archivo --------------------------------------------- */}
        <section className="grid gap-4">
          <div className="grid gap-2">
            <p className="lbl">Todo el archivo</p>
            <h2 className="font-serif text-[1.4rem] leading-none font-bold sm:text-[1.7rem]">
              {archivo.length}{" "}
              {archivo.length === 1 ? "fotografía" : "fotografías"}
            </h2>
            <p className="m-0 max-w-[70ch] text-[.9375rem] leading-relaxed text-dato">
              Marca las que sobren y bórralas. Debajo de cada una está dónde se
              usa: lo que se borra desaparece de ahí también —de la portada de
              una serie, de la cabecera de una entrada, del cuerpo de un
              texto—, y no hay vuelta atrás. Para las repetidas es mejor lo de
              arriba, que no deja huecos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex">
              {(
                [
                  ["todas", "Todas"],
                  ["repetidas", "Repetidas"],
                  ["sueltas", "Sin usar"],
                ] as const
              ).map(([clave, texto]) => (
                <button
                  key={clave}
                  type="button"
                  className="seg"
                  data-on={filtro === clave ? "si" : undefined}
                  aria-pressed={filtro === clave}
                  onClick={() => {
                    setFiltro(clave);
                    setTope(TANDA);
                  }}
                >
                  {texto}
                </button>
              ))}
            </div>

            <input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setTope(TANDA);
              }}
              placeholder="Buscar por título, rollo o serie"
              aria-label="Buscar una fotografía del archivo"
              className="w-full sm:ml-auto sm:w-[18rem]"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[.66rem] tracking-[.06em] text-dato">
            <span>
              {enPantalla.length} de {listadas.length}
              {listadas.length !== archivo.length && ` (de ${archivo.length})`}
            </span>
            <button
              type="button"
              className="text-dato underline underline-offset-4 hover:text-papel"
              onClick={() => setMarcadas(new Set(listadas.map((f) => f.id)))}
            >
              Marcar las {listadas.length} de la lista
            </button>
            {marcadas.size > 0 && (
              <button
                type="button"
                className="text-dato underline underline-offset-4 hover:text-papel"
                onClick={() => setMarcadas(new Set())}
              >
                Quitar las marcas
              </button>
            )}
            {enUso > 0 && (
              <span className="text-rojo">
                {enUso} de las marcadas {enUso === 1 ? "está en uso" : "están en uso"}
              </span>
            )}
          </div>

          {listadas.length === 0 ? (
            <p className="border border-dashed border-filo px-6 py-12 text-center font-mono text-[.75rem] leading-relaxed text-dato">
              Nada con eso.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {enPantalla.map((f) => {
                const marcada = marcadas.has(f.id);
                return (
                  <div key={f.id}>
                    {ficha(f, {
                      borde: marcada ? "var(--color-rojo)" : "var(--color-filo)",
                      apagada: marcada,
                      repetida: f.repetida,
                      pie: (
                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 font-mono text-[.66rem] tracking-[.06em] text-dato">
                            <input
                              type="checkbox"
                              checked={marcada}
                              onChange={(e) => marcar(f.id, e.target.checked)}
                            />
                            Borrar
                          </label>
                          <Link
                            href={`/admin/foto/${f.id}`}
                            className="font-mono text-[.62rem] tracking-[.1em] text-apagado uppercase hover:text-papel"
                          >
                            Ficha ↗
                          </Link>
                        </div>
                      ),
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {faltanDePintar > 0 && (
            <button
              type="button"
              className="btn w-fit"
              onClick={() => setTope((t) => t + TANDA)}
            >
              Ver {faltanDePintar > TANDA ? TANDA : faltanDePintar} más
            </button>
          )}
        </section>
      </div>
    </>
  );
}
