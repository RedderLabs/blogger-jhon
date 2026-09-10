"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { IconoSubir, IconoVisto } from "@/components/Iconos";
import { importarEntradas } from "@/app/admin/acciones";

type EntradaBlogger = {
  ref: string;
  titulo: string;
  fecha: string | null;
  urlAntigua: string | null;
  texto: string;
  fotos: string[];
  etiquetas: string[];
  palabras: number;
};

type Resumen = {
  entradas: number;
  fotos: number;
  sinFecha: number;
  desde: string | null;
  hasta: string | null;
};

type Props = {
  series: { id: string; nombre: string }[];
  yaImportadas: number;
  redirecciones: number;
};

type Paso = "leer" | "repartir" | "trasladar";

const ENTRADAS = "";

export function ImportarDeBlogger({ series, yaImportadas, redirecciones }: Props) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [enCurso, empezar] = useTransition();

  const [paso, setPaso] = useState<Paso>("leer");
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<EntradaBlogger[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [destinos, setDestinos] = useState<Record<string, string>>({});
  const [hecho, setHecho] = useState<string | null>(null);

  async function leer(fichero: File) {
    setLeyendo(true);
    setError(null);
    const datos = new FormData();
    datos.append("xml", fichero);
    try {
      const r = await fetch("/api/importar", { method: "POST", body: datos });
      const cuerpo = await r.json();
      if (!r.ok) {
        setError(cuerpo.error ?? "No he podido leerlo.");
        return;
      }
      setEntradas(cuerpo.entradas);
      setResumen(cuerpo.resumen);
      setMarcadas(new Set(cuerpo.entradas.map((e: EntradaBlogger) => e.ref)));
      setPaso("repartir");
    } catch {
      setError("Se ha cortado la lectura del fichero.");
    } finally {
      setLeyendo(false);
    }
  }

  function alternar(ref: string) {
    setMarcadas((prev) => {
      const s = new Set(prev);
      if (s.has(ref)) s.delete(ref);
      else s.add(ref);
      return s;
    });
  }

  function ciclarDestino(ref: string) {
    const opciones = [ENTRADAS, ...series.map((s) => s.id)];
    setDestinos((prev) => {
      const actual = prev[ref] ?? ENTRADAS;
      const i = opciones.indexOf(actual);
      return { ...prev, [ref]: opciones[(i + 1) % opciones.length] };
    });
  }

  function nombreDestino(ref: string) {
    const d = destinos[ref] ?? ENTRADAS;
    if (d === ENTRADAS) return "Entradas";
    return series.find((s) => s.id === d)?.nombre ?? "Entradas";
  }

  function trasladar() {
    const lote = entradas
      .filter((e) => marcadas.has(e.ref))
      .map((e) => ({
        titulo: e.titulo,
        fecha: e.fecha,
        urlAntigua: e.urlAntigua,
        texto: e.texto,
        etiquetas: e.etiquetas,
        palabras: e.palabras,
        destino: destinos[e.ref] ?? ENTRADAS,
      }));

    empezar(async () => {
      const r = await importarEntradas(lote);
      if (r?.error) {
        setError(r.error);
        return;
      }
      setHecho(
        `${r.creadas} entradas trasladadas, ${r.redirecciones} redirecciones escritas` +
          (r.repetidas ? `, ${r.repetidas} que ya estaban se han saltado` : "") +
          ".",
      );
      router.refresh();
    });
  }

  const totalFotos = entradas
    .filter((e) => marcadas.has(e.ref))
    .reduce((n, e) => n + e.fotos.length, 0);

  const pasos: { clave: Paso; n: string; texto: string }[] = [
    { clave: "leer", n: "1", texto: "Leer el export" },
    { clave: "repartir", n: "2", texto: "Repartir" },
    { clave: "trasladar", n: "3", texto: "Trasladar" },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-papel">
          Traslado desde Blogger
        </p>
        <div className="flex lg:ml-auto">
          {pasos.map((p) => (
            <button
              key={p.clave}
              type="button"
              disabled={p.clave !== "leer" && entradas.length === 0}
              onClick={() => setPaso(p.clave)}
              className="flex items-center gap-3 border border-filo py-[.45rem] pr-[.9rem] pl-[.5rem] disabled:opacity-40"
              style={
                paso === p.clave
                  ? {
                      borderColor: "var(--color-rojo)",
                      background: "color-mix(in oklab, var(--color-rojo) 10%, transparent)",
                      color: "var(--color-papel)",
                    }
                  : { color: "var(--color-dato)", marginLeft: -1 }
              }
            >
              <span
                className="grid h-[22px] w-[22px] place-items-center border border-current font-mono text-[.66rem] tracking-[.1em]"
                style={
                  paso === p.clave
                    ? {
                        background: "var(--color-rojo)",
                        borderColor: "var(--color-rojo)",
                        color: "var(--color-cuarto)",
                      }
                    : undefined
                }
              >
                {p.n}
              </span>
              <span className="hidden font-mono text-[.68rem] tracking-[.11em] uppercase sm:inline">
                {p.texto}
              </span>
            </button>
          ))}
        </div>
      </header>

      {error && (
        <p role="alert" className="border-b border-rojo bg-[rgb(217_80_58/.1)] px-4 py-2 font-mono text-[.7rem] sm:px-6">
          {error}
        </p>
      )}
      {hecho && (
        <p role="status" className="border-b border-verde bg-[rgb(124_148_112/.08)] px-4 py-2 font-mono text-[.7rem] sm:px-6">
          {hecho}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="scroll-fino flex flex-col gap-5 p-4 sm:p-6 lg:overflow-y-auto">
          {paso === "leer" && (
            <>
              <div className="flex flex-col gap-1">
                <p className="lbl">Paso 1</p>
                <h1 className="font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]">
                  El fichero que da Blogger
                </h1>
                <p className="mt-1 max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
                  En Blogger: Configuración → Administrar el blog → Copia de seguridad del
                  contenido. Sale un XML con las entradas, sus fechas y las direcciones de
                  las fotos. Aquí sólo se lee: no se toca nada hasta el paso 3.
                </p>
              </div>

              <button
                type="button"
                className="soltar flex-col py-14"
                onClick={() => entrada.current?.click()}
              >
                <IconoSubir tam={26} />
                <span className="font-mono text-[.75rem] tracking-[.1em]">
                  {leyendo ? "Leyendo…" : "Elige blog-MM-DD-AAAA.xml"}
                </span>
              </button>
              <input
                ref={entrada}
                type="file"
                accept=".xml,text/xml,application/xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) leer(f);
                }}
              />
            </>
          )}

          {paso === "repartir" && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="lbl">Paso 2</p>
                  <h1 className="font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]">
                    Dónde va cada entrada
                  </h1>
                </div>
                <p className="m-0 max-w-[40ch] font-mono text-[.66rem] leading-relaxed text-dato">
                  Lo que era texto se va a Entradas. Lo que era una tanda de fotos se
                  puede asociar a una serie. Nada se borra del blog original.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 border border-filo bg-cuarto-2 px-3 py-2">
                <span className="font-mono text-[.7rem] tracking-[.08em]">
                  {marcadas.size} de {entradas.length} marcadas
                </span>
                <button
                  type="button"
                  onClick={() => setMarcadas(new Set(entradas.map((e) => e.ref)))}
                  className="btn px-3 py-1"
                >
                  Marcar todas
                </button>
                <button
                  type="button"
                  onClick={() => setMarcadas(new Set())}
                  className="ml-auto border-b border-filo font-mono text-[.66rem] tracking-[.12em] text-dato uppercase hover:text-papel"
                >
                  Desmarcar
                </button>
              </div>

              <div className="border-t border-filo">
                {entradas.map((e) => {
                  const on = marcadas.has(e.ref);
                  return (
                    <div
                      key={e.ref}
                      className="grid grid-cols-[16px_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-b border-filo px-1 py-2 hover:bg-[rgb(237_231_222/.035)] lg:grid-cols-[16px_6.5rem_minmax(0,1fr)_13rem_3.5rem_7rem]"
                    >
                      <button
                        type="button"
                        onClick={() => alternar(e.ref)}
                        aria-label={`Marcar ${e.titulo}`}
                        className="grid h-[15px] w-[15px] place-items-center border"
                        style={
                          on
                            ? {
                                borderColor: "var(--color-rojo)",
                                background: "var(--color-rojo)",
                                color: "var(--color-cuarto)",
                              }
                            : { borderColor: "var(--color-filo-2)" }
                        }
                      >
                        {on && <IconoVisto tam={10} />}
                      </button>

                      <span className="col-start-2 font-mono text-[.66rem] tracking-[.04em] text-dato lg:col-start-2">
                        {e.fecha ? e.fecha.slice(0, 10) : "sin fecha"}
                      </span>

                      <span className="col-start-2 min-w-0 truncate text-[.875rem] lg:col-start-3">
                        {e.titulo}
                      </span>

                      <button
                        type="button"
                        onClick={() => ciclarDestino(e.ref)}
                        className="col-start-2 flex w-full items-center gap-2 justify-self-start border border-filo px-2 py-1 text-left hover:border-filo-2 lg:col-start-4"
                        style={{
                          color:
                            (destinos[e.ref] ?? ENTRADAS) === ENTRADAS
                              ? "var(--color-dato)"
                              : "var(--color-papel)",
                        }}
                      >
                        <span className="shrink-0">→</span>
                        <span className="min-w-0 truncate font-mono text-[.66rem] tracking-[.06em]">
                          {nombreDestino(e.ref)}
                        </span>
                      </button>

                      <span className="hidden font-mono text-[.66rem] text-dato lg:block">
                        {e.fotos.length || "—"}
                      </span>

                      <span className="hidden font-mono text-[.625rem] tracking-[.04em] text-verde lg:block">
                        {e.urlAntigua ? "301 lista" : "sin URL"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {paso === "trasladar" && (
            <>
              <div className="flex flex-col gap-1">
                <p className="lbl">Paso 3</p>
                <h1 className="font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]">
                  Lo que va a pasar
                </h1>
              </div>

              <div className="grid gap-px border border-filo bg-filo sm:grid-cols-2">
                <Tarjeta
                  cifra={String(marcadas.size)}
                  titulo="Entradas"
                  nota="Con su fecha original. El orden del archivo no cambia."
                />
                <Tarjeta
                  cifra={String(entradas.filter((e) => marcadas.has(e.ref) && e.urlAntigua).length)}
                  titulo="Redirecciones 301"
                  nota="De la dirección vieja de Blogger a la nueva. Quien tenga un enlace guardado sigue llegando."
                />
                <Tarjeta
                  cifra={String(totalFotos)}
                  titulo="Fotos localizadas"
                  nota="Se anotan las direcciones, pero NO se descargan todavía: eso va aparte para poder pararlo y reanudarlo."
                  aviso
                />
                <Tarjeta
                  cifra={String(entradas.filter((e) => marcadas.has(e.ref) && !e.fecha).length)}
                  titulo="Sin fecha fiable"
                  nota="Entran como borrador y quedan marcadas para revisarlas a mano."
                  aviso
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="btn btn-p"
                  disabled={enCurso || marcadas.size === 0}
                  onClick={trasladar}
                >
                  {enCurso ? "Trasladando…" : `Trasladar ${marcadas.size}`}
                </button>
                <span className="font-mono text-[.66rem] tracking-[.04em] text-dato">
                  Las que ya estén importadas se saltan solas.
                </span>
              </div>
            </>
          )}
        </section>

        <aside className="scroll-fino border-t border-filo bg-cuarto-2 lg:overflow-y-auto lg:border-t-0 lg:border-l">
          <div className="flex flex-col gap-3 border-b border-filo px-5 py-5">
            <p className="lbl">Lo leído</p>
            {resumen ? (
              <>
                <Cifra etiqueta="Entradas" valor={String(resumen.entradas)} />
                <Cifra etiqueta="Fotos" valor={String(resumen.fotos)} />
                <Cifra
                  etiqueta="Rango"
                  valor={
                    resumen.desde && resumen.hasta
                      ? `${resumen.desde.slice(0, 4)} — ${resumen.hasta.slice(0, 4)}`
                      : "—"
                  }
                />
                <Cifra
                  etiqueta="Sin fecha"
                  valor={String(resumen.sinFecha)}
                  alerta={resumen.sinFecha > 0}
                />
              </>
            ) : (
              <p className="font-mono text-[.7rem] text-dato">
                Todavía no has cargado ningún fichero.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 px-5 py-5">
            <p className="lbl">Ya trasladado</p>
            <Cifra etiqueta="Entradas importadas" valor={String(yaImportadas)} />
            <Cifra etiqueta="Redirecciones activas" valor={String(redirecciones)} />
            <p className="mt-2 font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
              Las redirecciones se guardan en la base de datos. Para que funcionen de
              verdad hay que servirlas: eso lo hace el fichero <code>proxy.ts</code> cuando
              se ponga el dominio.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Tarjeta({
  cifra,
  titulo,
  nota,
  aviso,
}: {
  cifra: string;
  titulo: string;
  nota: string;
  aviso?: boolean;
}) {
  return (
    <div className="grid gap-2 bg-cuarto px-[1.15rem] py-[1.1rem]">
      <span
        className="font-serif text-[1.95rem] leading-none font-bold"
        style={aviso ? { color: "var(--color-rojo)" } : undefined}
      >
        {cifra}
      </span>
      <span className="lbl text-[.5625rem]" style={aviso ? { color: "var(--color-rojo)" } : undefined}>
        {titulo}
      </span>
      <span className="text-[.8125rem] leading-snug text-dato">{nota}</span>
    </div>
  );
}

function Cifra({
  etiqueta,
  valor,
  alerta,
}: {
  etiqueta: string;
  valor: string;
  alerta?: boolean;
}) {
  return (
    <p className="flex justify-between font-mono text-[.72rem] text-dato">
      <span>{etiqueta}</span>
      <span className={alerta ? "text-rojo" : "text-papel"}>{valor}</span>
    </p>
  );
}
