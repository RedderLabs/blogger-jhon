"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { IconoCerrar, IconoSubir } from "@/components/Iconos";
import { ANCHOS_DISPONIBLES } from "@/lib/fotos";

type Props = {
  propuesto: string;
  anterior: { camara: string; optica: string; pelicula: string; revelado: string };
  /** El ancho por defecto del sitio, que se elige en /admin/ajustes. */
  anchoDelSitio: number;
};

type Resultado = {
  rolloId: string;
  subidas: number;
  rechazados: string[];
  fallados: string[];
};

const HOY = () => new Date().toISOString().slice(0, 10);

export function SubirEscaneos({ propuesto, anterior, anchoDelSitio }: Props) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);

  const [elegidos, setElegidos] = useState<File[]>([]);
  const [encima, setEncima] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<Resultado | null>(null);
  const [anchoMax, setAnchoMax] = useState(anchoDelSitio);

  function anadir(lista: FileList | null) {
    if (!lista) return;
    setError(null);
    setHecho(null);
    const nuevos = Array.from(lista).filter((f) => f.type.startsWith("image/"));
    setElegidos((prev) => {
      const yaEstan = new Set(prev.map((f) => `${f.name}:${f.size}`));
      return [...prev, ...nuevos.filter((f) => !yaEstan.has(`${f.name}:${f.size}`))];
    });
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (elegidos.length === 0) {
      setError("Elige primero los escaneos.");
      return;
    }

    const datos = new FormData(e.currentTarget);
    datos.delete("fotos");
    for (const f of elegidos) datos.append("fotos", f);
    datos.set("anchoMax", String(anchoMax));

    setSubiendo(true);
    setError(null);
    try {
      const r = await fetch("/api/subir", { method: "POST", body: datos });
      const cuerpo = await r.json();
      if (!r.ok) {
        setError(cuerpo.error ?? "No he podido subirlos.");
        return;
      }
      setHecho(cuerpo as Resultado);
      setElegidos([]);
      router.refresh();
    } catch {
      setError("Se ha cortado la subida. Prueba con menos fotogramas de una vez.");
    } finally {
      setSubiendo(false);
    }
  }

  const pesoTotal = elegidos.reduce((n, f) => n + f.size, 0);

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-papel">
          Subir escaneos
        </p>
      </header>

      <form
        onSubmit={enviar}
        className="flex flex-1 flex-col gap-8 p-4 sm:p-6 xl:grid xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-10"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="lbl">Lote nuevo</p>
            <h1 className="font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]">
              Un rollo entero de una vez
            </h1>
            <p className="mt-1 max-w-[62ch] text-[.9375rem] leading-relaxed text-dato">
              Suelta aquí la carpeta del escaneo. De cada fichero se guardan dos cosas: la
              copia que sirve la web y el escaneo original, que no se publica nunca pero
              queda para poder rehacer la copia sin volver a pasar el negativo.
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setEncima(true);
            }}
            onDragLeave={() => setEncima(false)}
            onDrop={(e) => {
              e.preventDefault();
              setEncima(false);
              anadir(e.dataTransfer.files);
            }}
            className="soltar flex-col py-12"
            data-encima={encima ? "si" : undefined}
          >
            <IconoSubir tam={26} />
            <p className="font-mono text-[.75rem] tracking-[.1em]">
              Arrastra los escaneos o
            </p>
            <button
              type="button"
              className="btn"
              onClick={() => entrada.current?.click()}
            >
              Elegir ficheros
            </button>
            <p className="font-mono text-[.66rem] tracking-[.06em] text-apagado">
              JPEG, PNG, TIFF, WebP o AVIF. El RAW de cámara hay que revelarlo antes.
            </p>
            <input
              ref={entrada}
              type="file"
              name="fotos"
              multiple
              accept="image/jpeg,image/png,image/tiff,image/webp,image/avif"
              className="hidden"
              onChange={(e) => anadir(e.target.files)}
            />
          </div>

          {elegidos.length > 0 && (
            <div className="border border-filo">
              <div className="flex flex-wrap items-center gap-3 border-b border-filo px-3 py-2">
                <span className="font-mono text-[.7rem] tracking-[.08em]">
                  {elegidos.length}{" "}
                  {elegidos.length === 1 ? "fotograma" : "fotogramas"} ·{" "}
                  {(pesoTotal / 1024 / 1024).toFixed(1)} MB
                </span>
                <button
                  type="button"
                  onClick={() => setElegidos([])}
                  className="ml-auto border-b border-filo font-mono text-[.66rem] tracking-[.12em] text-dato uppercase hover:text-papel"
                >
                  Vaciar
                </button>
              </div>
              <ul className="scroll-fino m-0 max-h-[280px] list-none overflow-y-auto p-0">
                {elegidos.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-3 border-b border-filo px-3 py-2 last:border-b-0"
                  >
                    <span className="w-8 shrink-0 font-mono text-[.66rem] text-dato">
                      {String(i + 1).padStart(3, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[.875rem]">{f.name}</span>
                    <span className="shrink-0 font-mono text-[.66rem] text-dato">
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <button
                      type="button"
                      aria-label={`Quitar ${f.name}`}
                      onClick={() => setElegidos((p) => p.filter((_, j) => j !== i))}
                      className="shrink-0 text-dato hover:text-rojo"
                    >
                      <IconoCerrar tam={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="border border-rojo bg-[rgb(217_80_58/.1)] px-3 py-2 font-mono text-[.7rem]"
            >
              {error}
            </p>
          )}

          {hecho && (
            <div className="border border-verde bg-[rgb(124_148_112/.08)] px-4 py-3">
              <p className="font-mono text-[.72rem] tracking-[.06em]">
                {hecho.subidas} {hecho.subidas === 1 ? "fotograma subido" : "fotogramas subidos"}.
              </p>
              {hecho.rechazados.length > 0 && (
                <p className="mt-2 font-mono text-[.66rem] text-dato">
                  Sin leer (formato no admitido): {hecho.rechazados.join(", ")}
                </p>
              )}
              {hecho.fallados.length > 0 && (
                <p className="mt-2 font-mono text-[.66rem] text-rojo">
                  Fallaron: {hecho.fallados.join(", ")}
                </p>
              )}
              <a
                href={`/admin?rollo=${hecho.rolloId}`}
                className="btn btn-p mt-3 inline-block"
              >
                Ir a la mesa de luz
              </a>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 border-t border-filo pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8">
          <p className="lbl">Ficha del lote</p>
          <p className="m-0 font-mono text-[.66rem] leading-relaxed tracking-[.02em] text-dato">
            Se copia en todos los fotogramas del rollo. Después se corrige uno a uno.
          </p>

          <label className="grid gap-1">
            <span className="lbl text-[.5625rem]">Código del rollo</span>
            <input name="codigo" required defaultValue={propuesto} />
          </label>

          <label className="grid gap-1">
            <span className="lbl text-[.5625rem]">Fecha</span>
            <input name="fecha" type="date" defaultValue={HOY()} />
          </label>

          <label className="grid gap-1">
            <span className="lbl text-[.5625rem]">Cámara</span>
            <input name="camara" defaultValue={anterior.camara} />
          </label>

          <label className="grid gap-1">
            <span className="lbl text-[.5625rem]">Óptica</span>
            <input name="optica" defaultValue={anterior.optica} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="lbl text-[.5625rem]">Película</span>
              <input name="pelicula" defaultValue={anterior.pelicula} />
            </label>
            <label className="grid gap-1">
              <span className="lbl text-[.5625rem]">Revelado</span>
              <input name="revelado" defaultValue={anterior.revelado} />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="lbl text-[.5625rem]">Notas del rollo</span>
            <textarea name="notas" rows={3} />
          </label>

          <div className="grid gap-2 border-t border-filo pt-4">
            <span className="lbl text-[.5625rem]">Ancho en escritorio</span>
            <select
              value={String(anchoMax)}
              onChange={(e) => setAnchoMax(Number(e.target.value))}
            >
              {ANCHOS_DISPONIBLES.map((a) => (
                <option key={a.valor} value={a.valor}>
                  {a.etiqueta}
                </option>
              ))}
            </select>
            <p className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
              {ANCHOS_DISPONIBLES.find((a) => a.valor === anchoMax)?.nota}
            </p>
            <p className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
              En móvil y tableta el navegador pide siempre la versión que le quepa; este
              tope sólo manda en escritorio. Se puede cambiar después foto a foto.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-p mt-2"
            disabled={subiendo || elegidos.length === 0}
          >
            {subiendo
              ? `Subiendo ${elegidos.length}…`
              : `Subir ${elegidos.length || ""}`.trim()}
          </button>
        </aside>
      </form>
    </>
  );
}
