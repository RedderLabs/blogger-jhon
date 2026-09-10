"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { IconoSubir, IconoVisto } from "@/components/Iconos";
import {
  aplicarFichaAlRollo,
  asignarASerie,
  publicarFotos,
  quitarDeSeries,
} from "@/app/admin/acciones";
import { ANCHOS_DISPONIBLES, dosDigitos } from "@/lib/fotos";

type Foto = {
  id: string;
  orden: number;
  archivo: string;
  alt: string;
  titulo: string;
  estado: string;
  anchoMax: number;
  series: { id: string; nombre: string }[];
};

type Props = {
  rollo: {
    id: string;
    codigo: string;
    fecha: string;
    camara: string;
    optica: string;
    pelicula: string;
    revelado: string;
  };
  rollos: { id: string; codigo: string; cuantas: number }[];
  fotos: Foto[];
  series: { id: string; numero: string; nombre: string; cuantas: number }[];
};

type Filtro = "sin" | "con" | "todas";

export function MesaDeLuz({ rollo, rollos, fotos, series }: Props) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();

  const [elegidas, setElegidas] = useState<string[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [aviso, setAviso] = useState<string | null>(null);
  const [panelAbierto, setPanelAbierto] = useState(false);

  const sinSerie = fotos.filter((f) => f.series.length === 0).length;
  const conSerie = fotos.length - sinSerie;
  const sinAlt = fotos.filter((f) => f.alt.trim() === "").length;
  const publicables = fotos.filter(
    (f) => f.series.length > 0 && f.alt.trim() !== "" && f.estado !== "publicada",
  );

  const visibles = useMemo(() => {
    if (filtro === "sin") return fotos.filter((f) => f.series.length === 0);
    if (filtro === "con") return fotos.filter((f) => f.series.length > 0);
    return fotos;
  }, [fotos, filtro]);

  function alternar(id: string) {
    setAviso(null);
    setElegidas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function correr(trabajo: () => Promise<unknown>) {
    empezar(async () => {
      const r = (await trabajo()) as { error?: string } | undefined;
      if (r?.error) setAviso(r.error);
      else setAviso(null);
      router.refresh();
    });
  }

  const segmentos: { clave: Filtro; texto: string }[] = [
    { clave: "sin", texto: `Sin serie · ${sinSerie}` },
    { clave: "con", texto: `En serie · ${conSerie}` },
    { clave: "todas", texto: `Todas · ${fotos.length}` },
  ];

  /* ---------------------------------------------------------- panel lateral */
  const panel = (
    <div className="flex flex-col">
      <div className="border-b border-filo px-[1.15rem] py-[1.1rem]">
        <p className="lbl mb-2">Selección</p>
        <div className="flex items-baseline gap-3">
          <span
            className="font-serif text-[2.1rem] leading-none font-bold"
            style={{ color: elegidas.length ? "var(--color-rojo)" : "var(--color-filo-2)" }}
          >
            {dosDigitos(elegidas.length)}
          </span>
          <span className="font-mono text-[.72rem] tracking-[.06em] text-dato">
            {elegidas.length === 1 ? "fotograma en la mesa" : "fotogramas en la mesa"}
          </span>
          {elegidas.length > 0 && (
            <button
              type="button"
              onClick={() => setElegidas([])}
              className="ml-auto border-b border-filo font-mono text-[.66rem] tracking-[.12em] text-dato uppercase hover:text-papel"
            >
              Vaciar
            </button>
          )}
        </div>
      </div>

      <div className="border-b border-filo px-[1.15rem] py-[1.1rem]">
        <p className="lbl mb-3">Asignar a una serie</p>
        <div className="flex flex-col">
          {series.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={elegidas.length === 0 || enCurso}
              onClick={() => correr(async () => { await asignarASerie(elegidas, s.id); setElegidas([]); })}
              className="group flex w-full items-center gap-3 border-b border-filo px-2 py-[.55rem] text-left hover:bg-[rgb(237_231_222/.04)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="w-[2.6rem] shrink-0 font-mono text-[.66rem] tracking-[.08em] text-dato group-enabled:group-hover:text-rojo">
                {s.numero}
              </span>
              <span className="min-w-0 flex-1 text-[.875rem] leading-snug">{s.nombre}</span>
              <span className="shrink-0 font-mono text-[.66rem] text-dato">{s.cuantas}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {elegidas.length > 0 && (
            <button
              type="button"
              disabled={enCurso}
              onClick={() => correr(async () => { await quitarDeSeries(elegidas); setElegidas([]); })}
              className="font-mono text-[.7rem] tracking-[.12em] text-dato uppercase hover:text-papel"
            >
              Quitar de su serie
            </button>
          )}
        </div>
      </div>

      <form
        action={(datos) => correr(() => aplicarFichaAlRollo(rollo.id, datos))}
        className="flex flex-col gap-3 border-b border-filo px-[1.15rem] py-[1.1rem]"
      >
        <p className="lbl">Ficha del lote</p>
        <p className="m-0 font-mono text-[.66rem] leading-relaxed tracking-[.02em] text-dato">
          Lo que rellenes aquí se copia en las {fotos.length} fichas del rollo. Después se
          corrige una a una.
        </p>

        <label className="grid gap-1">
          <span className="lbl text-[.5625rem]">Cámara</span>
          <input name="camara" defaultValue={rollo.camara} />
        </label>
        <label className="grid gap-1">
          <span className="lbl text-[.5625rem]">Óptica</span>
          <input name="optica" defaultValue={rollo.optica} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="lbl text-[.5625rem]">Película</span>
            <input name="pelicula" defaultValue={rollo.pelicula} />
          </label>
          <label className="grid gap-1">
            <span className="lbl text-[.5625rem]">Revelado</span>
            <input name="revelado" defaultValue={rollo.revelado} />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="lbl text-[.5625rem]">Ancho en escritorio</span>
          <select name="anchoMax" defaultValue={String(fotos[0]?.anchoMax ?? 1200)}>
            {ANCHOS_DISPONIBLES.map((a) => (
              <option key={a.valor} value={a.valor}>
                {a.etiqueta} — {a.nota}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="btn mt-1 self-start" disabled={enCurso}>
          Aplicar a las {fotos.length}
        </button>
      </form>

      <div className="flex flex-col gap-[.6rem] px-[1.15rem] py-[1.1rem]">
        <p className="lbl">Antes de publicar</p>
        <Requisito mal={sinSerie > 0} texto={`${sinSerie} fotogramas sin serie`} />
        <Requisito mal={sinAlt > 0} texto={`${sinAlt} sin texto alternativo`} />
        <Requisito
          mal={!rollo.revelado}
          texto={rollo.revelado ? "Datos de revelado completos" : "Falta el revelado"}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Cabecera del lote */}
      <header className="sticky top-0 z-20 flex flex-wrap items-end gap-4 border-b border-filo bg-cuarto px-4 py-4 sm:px-6 lg:gap-6">
        <div className="flex flex-col gap-1">
          <p className="lbl">Lote en revelado</p>
          <h1 className="font-serif text-[1.4rem] leading-none font-bold sm:text-[1.7rem]">
            {rollo.codigo} · {new Date(rollo.fecha).getUTCDate()} de{" "}
            {new Date(rollo.fecha).toLocaleDateString("es", {
              month: "long",
              timeZone: "UTC",
            })}
          </h1>
        </div>

        <p className="font-mono text-[.7rem] leading-[1.7] tracking-[.06em] text-dato">
          {fotos.length} fotogramas escaneados
          <br />
          {[rollo.camara, rollo.pelicula, rollo.revelado].filter(Boolean).join(" · ") ||
            "Sin ficha técnica"}
        </p>

        {rollos.length > 1 && (
          <select
            defaultValue={rollo.id}
            aria-label="Cambiar de rollo"
            className="w-auto max-w-[220px] font-mono text-[.7rem]"
            onChange={(e) => router.push(`/admin?rollo=${e.target.value}`)}
          >
            {rollos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.codigo} · {r.cuantas} fotos
              </option>
            ))}
          </select>
        )}

        <div className="flex w-full flex-wrap items-center gap-3 lg:ml-auto lg:w-auto">
          <div className="flex">
            {segmentos.map((s) => (
              <button
                key={s.clave}
                type="button"
                className="seg"
                data-on={filtro === s.clave ? "si" : undefined}
                onClick={() => setFiltro(s.clave)}
              >
                {s.texto}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-p"
            disabled={publicables.length === 0 || enCurso}
            onClick={() =>
              correr(() => publicarFotos(publicables.map((f) => f.id)))
            }
          >
            Publicar {publicables.length}
          </button>
        </div>
      </header>

      {aviso && (
        <p
          role="alert"
          className="border-b border-rojo bg-[rgb(217_80_58/.1)] px-4 py-3 font-mono text-[.7rem] tracking-[.04em] sm:px-6"
        >
          {aviso}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_348px]">
        {/* Hoja de contactos */}
        <section className="scroll-fino flex flex-col gap-5 p-4 sm:p-6 lg:overflow-y-auto">
          <Link href="/admin/importar" className="soltar">
            <IconoSubir tam={18} />
            <span className="font-mono text-[.7rem] tracking-[.1em] sm:text-[.72rem]">
              Arrastra aquí los escaneos — TIFF, JPEG o RAW
            </span>
          </Link>

          {visibles.length === 0 ? (
            <p className="py-12 text-center font-mono text-[.75rem] tracking-[.06em] text-dato">
              Nada aquí. Todo el rollo está clasificado.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
              {visibles.map((f) => {
                const puesta = f.series[0];
                const elegida = elegidas.includes(f.id);
                return (
                  <div key={f.id} className="relative">
                    <button
                      type="button"
                      onClick={() => alternar(f.id)}
                      className="marco aspect-[3/2]"
                      data-elegido={elegida ? "si" : undefined}
                      data-atenuado={!elegida && puesta ? "si" : undefined}
                      aria-pressed={elegida}
                      aria-label={`Fotograma ${dosDigitos(f.orden)}${puesta ? `, en ${puesta.nombre}` : ", sin serie"}`}
                    >
                      <span className="marco-no">{dosDigitos(f.orden)}</span>
                      <Image
                        src={f.archivo}
                        alt=""
                        fill
                        quality={70}
                        sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 22vw"
                        className="object-cover"
                      />
                      {puesta && <span className="marco-pie">{puesta.nombre}</span>}
                    </button>

                    <div className="flex items-center justify-between gap-3 pt-[.35rem]">
                      <Link
                        href={`/admin/foto/${f.id}`}
                        className="truncate font-mono text-[.625rem] tracking-[.04em] text-dato hover:text-rojo"
                      >
                        Ficha ↗
                      </Link>
                      {f.alt.trim() === "" && (
                        <span className="shrink-0 font-mono text-[.625rem] tracking-[.04em] text-rojo">
                          sin alt
                        </span>
                      )}
                      {f.estado === "publicada" && (
                        <span className="shrink-0 font-mono text-[.625rem] tracking-[.04em] text-verde">
                          publicada
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Escritorio: columna fija. Móvil y tableta: cajón desde abajo. */}
        <aside className="scroll-fino hidden border-l border-filo bg-cuarto-2 lg:block lg:overflow-y-auto">
          {panel}
        </aside>

        <div className="sticky bottom-0 z-40 border-t border-filo bg-cuarto-2 lg:hidden">
          <button
            type="button"
            onClick={() => setPanelAbierto((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3"
          >
            <span className="font-mono text-[.72rem] tracking-[.1em] uppercase">
              {elegidas.length > 0
                ? `${dosDigitos(elegidas.length)} en la mesa`
                : "Clasificar"}
            </span>
            <span className="font-mono text-[.72rem] text-dato">
              {panelAbierto ? "Cerrar ▾" : "Abrir ▴"}
            </span>
          </button>
          {panelAbierto && (
            <div className="scroll-fino max-h-[62vh] overflow-y-auto border-t border-filo">
              {panel}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Requisito({ mal, texto }: { mal: boolean; texto: string }) {
  return (
    <p className="flex items-start gap-3">
      <span
        className="mt-[.15rem] shrink-0"
        style={{ color: mal ? "var(--color-rojo)" : "var(--color-verde)" }}
      >
        {mal ? "✕" : <IconoVisto tam={13} />}
      </span>
      <span className="text-[.8125rem] leading-snug text-dato">{texto}</span>
    </p>
  );
}
