"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { IconoVisto } from "@/components/Iconos";
import {
  asignarASerie,
  guardarFoto,
  publicarFotos,
  quitarDeSeries,
} from "@/app/admin/acciones";
import { ANCHOS_DISPONIBLES, dosDigitos, medidasDeVisualizacion } from "@/lib/fotos";

type Foto = {
  id: string;
  orden: number;
  archivo: string;
  ancho: number;
  alto: number;
  anchoMax: number;
  titulo: string;
  alt: string;
  nota: string;
  camara: string;
  optica: string;
  pelicula: string;
  ei: string;
  apertura: string;
  velocidad: string;
  revelado: string;
  escaneo: string;
  lugar: string;
  estado: string;
};

type Props = {
  foto: Foto;
  rollo: { id: string; codigo: string; tira: { id: string; orden: number; archivo: string }[] };
  series: { id: string; numero: string; nombre: string; cuantas: number; puesta: boolean }[];
  posicion: { serie: string; numero: number } | null;
};

type Pestana = "tecnica" | "texto" | "series";

export function FichaDeFoto({ foto, rollo, series, posicion }: Props) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [pestana, setPestana] = useState<Pestana>("tecnica");
  const [aviso, setAviso] = useState<string | null>(null);
  const [anchoMax, setAnchoMax] = useState(foto.anchoMax);

  const i = rollo.tira.findIndex((t) => t.id === foto.id);
  const anterior = rollo.tira[i - 1];
  const siguiente = rollo.tira[i + 1];
  const medidas = medidasDeVisualizacion({ ...foto, anchoMax });

  function correr(trabajo: () => Promise<unknown>, hecho?: string) {
    empezar(async () => {
      const r = (await trabajo()) as { error?: string } | undefined;
      setAviso(r?.error ?? hecho ?? null);
      router.refresh();
    });
  }

  const pestanas: { clave: Pestana; texto: string }[] = [
    { clave: "tecnica", texto: "Técnica" },
    { clave: "texto", texto: "Texto" },
    { clave: "series", texto: "Series" },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <Link href="/admin" className="hover:text-papel">
            Mesa de luz
          </Link>
          <span className="text-filo-2"> / </span>
          {rollo.codigo}
          <span className="text-filo-2"> / </span>
          <span className="text-papel">Fotograma {dosDigitos(foto.orden)}</span>
        </p>

        <span
          className="border border-filo px-[.55rem] py-1 font-mono text-[.66rem] tracking-[.1em] uppercase"
          style={{
            color:
              foto.estado === "publicada" ? "var(--color-verde)" : "var(--color-dato)",
          }}
        >
          {foto.estado === "publicada" ? "Publicada" : "Borrador"}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {anterior && (
            <Link href={`/admin/foto/${anterior.id}`} className="btn">
              Anterior
            </Link>
          )}
          {siguiente && (
            <Link href={`/admin/foto/${siguiente.id}`} className="btn">
              Siguiente
            </Link>
          )}
          <button
            type="button"
            className="btn btn-p"
            disabled={enCurso || foto.estado === "publicada"}
            onClick={() => correr(() => publicarFotos([foto.id]), "Publicada.")}
          >
            Publicar
          </button>
        </div>
      </header>

      {aviso && (
        <p
          role="status"
          className="border-b border-filo bg-[rgb(217_80_58/.08)] px-4 py-2 font-mono text-[.7rem] tracking-[.04em] sm:px-6"
        >
          {aviso}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_396px]">
        <section className="flex min-w-0 flex-col">
          <div className="flex min-h-[40vh] flex-1 bg-montaje">
            <div className="relative m-5 flex-1 sm:m-8">
              <Image
                src={foto.archivo}
                alt={foto.alt}
                fill
                quality={82}
                priority
                sizes={`(max-width: 1023px) 92vw, min(${medidas.ancho}px, calc(100vw - 30rem))`}
                className="object-contain"
                style={{
                  filter:
                    "contrast(1.04) drop-shadow(0 2px 4px rgba(0,0,0,.35)) drop-shadow(0 22px 48px rgba(0,0,0,.45))",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-filo bg-cuarto-2 px-4 py-3 sm:px-5">
            <span className="lbl hidden shrink-0 text-[.5625rem] sm:block">
              {rollo.codigo}
            </span>
            <div className="scroll-fino flex flex-1 gap-[2px] overflow-x-auto">
              {rollo.tira.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/foto/${t.id}`}
                  className="relative block aspect-[3/2] w-[74px] shrink-0 bg-marco"
                  style={
                    t.id === foto.id
                      ? { outline: "1px solid var(--color-rojo)", outlineOffset: -1 }
                      : undefined
                  }
                >
                  <span className="absolute top-[2px] left-[4px] z-10 font-mono text-[.5625rem] text-papel mix-blend-difference">
                    {dosDigitos(t.orden)}
                  </span>
                  <Image
                    src={t.archivo}
                    alt=""
                    fill
                    quality={70}
                    sizes="74px"
                    className={`object-cover transition-opacity ${t.id === foto.id ? "opacity-100" : "opacity-40 hover:opacity-75"}`}
                  />
                </Link>
              ))}
            </div>
            <span className="hidden shrink-0 font-mono text-[.66rem] tracking-[.06em] text-dato sm:block">
              {dosDigitos(foto.orden)} / {rollo.tira.length}
            </span>
          </div>
        </section>

        <aside className="scroll-fino flex flex-col border-t border-filo bg-cuarto-2 lg:overflow-y-auto lg:border-t-0 lg:border-l">
          <div className="px-5 pt-4 pb-3">
            <p className="lbl text-rojo">
              {posicion
                ? `${posicion.serie} · ${dosDigitos(posicion.numero)}`
                : "Sin serie todavía"}
            </p>
          </div>

          <div className="flex gap-6 border-b border-filo px-5">
            {pestanas.map((p) => (
              <button
                key={p.clave}
                type="button"
                className="pestana"
                data-on={pestana === p.clave ? "si" : undefined}
                onClick={() => setPestana(p.clave)}
              >
                {p.texto}
              </button>
            ))}
          </div>

          <form
            action={(datos) => {
              datos.set("anchoMax", String(anchoMax));
              correr(() => guardarFoto(foto.id, datos), "Guardado.");
            }}
            className="flex flex-col"
          >
            {/* Los tres paneles viven en el mismo formulario: así se guarda todo
                de una vez aunque se haya escrito en dos pestañas distintas. */}
            <div className={pestana === "tecnica" ? "flex flex-col gap-3 p-5" : "hidden"}>
              <Campo etiqueta="Título" nombre="titulo" valor={foto.titulo} />
              <Campo etiqueta="Cámara" nombre="camara" valor={foto.camara} />
              <Campo etiqueta="Óptica" nombre="optica" valor={foto.optica} />
              <Campo etiqueta="Película" nombre="pelicula" valor={foto.pelicula} />
              <div className="grid grid-cols-3 gap-3">
                <Campo etiqueta="EI" nombre="ei" valor={foto.ei} />
                <Campo etiqueta="Apertura" nombre="apertura" valor={foto.apertura} />
                <Campo etiqueta="Velocidad" nombre="velocidad" valor={foto.velocidad} />
              </div>
              <Campo etiqueta="Revelado" nombre="revelado" valor={foto.revelado} />
              <Campo etiqueta="Escaneo" nombre="escaneo" valor={foto.escaneo} />
              <Campo
                etiqueta="Lugar"
                nombre="lugar"
                valor={foto.lugar}
                pista="Opcional — no se publica si lo dejas vacío"
              />

              <div className="mt-2 grid gap-2 border-t border-filo pt-4">
                <span className="lbl text-[.5625rem]">Ancho en escritorio</span>
                <select
                  value={String(anchoMax)}
                  onChange={(e) => setAnchoMax(Number(e.target.value))}
                >
                  {ANCHOS_DISPONIBLES.map((a) => (
                    <option key={a.valor} value={a.valor}>
                      {a.etiqueta} — {a.nota}
                    </option>
                  ))}
                </select>
                <p className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
                  Se pedirán {medidas.ancho} × {medidas.alto} px como mucho; el escaneo
                  mide {foto.ancho} × {foto.alto} px.
                  {foto.ancho < anchoMax && anchoMax > 0
                    ? " Ojo: el escaneo no llega a ese tope, así que se servirá al tamaño que tiene."
                    : ""}{" "}
                  En la ficha pública la copia se estira hasta llenar el gris, aunque eso
                  suponga ampliar un poco. En móvil y tableta el navegador pide siempre la
                  versión que le quepa.
                </p>
              </div>
            </div>

            <div className={pestana === "texto" ? "flex flex-col gap-5 p-5" : "hidden"}>
              <label className="grid gap-2">
                <span className="lbl text-[.5625rem] text-rojo">
                  Texto alternativo · obligatorio
                </span>
                <textarea name="alt" rows={3} defaultValue={foto.alt} />
                <span className="font-mono text-[.625rem] tracking-[.04em] text-dato">
                  Sin esto la foto no se puede publicar. Es lo que Google lee de una
                  fotografía, y lo que oye quien navega con lector de pantalla.
                </span>
              </label>

              <label className="grid gap-2">
                <span className="lbl text-[.5625rem]">Nota del autor</span>
                <textarea name="nota" rows={7} defaultValue={foto.nota} />
                <span className="font-mono text-[.625rem] tracking-[.04em] text-dato">
                  Aparece junto a la copia, bajo la ficha técnica.
                </span>
              </label>
            </div>

            <div className={pestana === "series" ? "flex flex-col gap-4 p-5" : "hidden"}>
              <p className="m-0 font-mono text-[.66rem] leading-relaxed tracking-[.02em] text-dato">
                Una foto puede estar en más de una serie. La primera en la que entró es la
                que manda: es la que sale en la ficha y en las flechas de teclado.
              </p>
              <div className="flex flex-col">
                {series.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={enCurso}
                    onClick={() =>
                      correr(() =>
                        s.puesta
                          ? quitarDeSeries([foto.id])
                          : asignarASerie([foto.id], s.id),
                      )
                    }
                    className="flex w-full items-center gap-3 border-b border-filo px-1 py-[.6rem] text-left hover:bg-[rgb(237_231_222/.04)]"
                  >
                    <span
                      className={`grid h-[15px] w-[15px] shrink-0 place-items-center border ${s.puesta ? "border-rojo bg-rojo text-cuarto" : "border-filo-2"}`}
                    >
                      {s.puesta && <IconoVisto tam={10} />}
                    </span>
                    <span className="w-[2.6rem] shrink-0 font-mono text-[.66rem] tracking-[.08em] text-dato">
                      {s.numero}
                    </span>
                    <span className="min-w-0 flex-1 text-[.875rem] leading-snug">
                      {s.nombre}
                    </span>
                    <span className="shrink-0 font-mono text-[.66rem] text-dato">
                      {s.cuantas}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Los campos ocultos viajan igual: el formulario es uno solo. */}
            <div className="sticky bottom-0 flex items-center gap-3 border-t border-filo bg-cuarto-2 px-5 py-3">
              <button type="submit" className="btn btn-p" disabled={enCurso}>
                {enCurso ? "Guardando…" : "Guardar"}
              </button>
              <Link href="/admin" className="btn">
                Volver
              </Link>
            </div>
          </form>
        </aside>
      </div>
    </>
  );
}

function Campo({
  etiqueta,
  nombre,
  valor,
  pista,
}: {
  etiqueta: string;
  nombre: string;
  valor: string;
  pista?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="lbl text-[.5625rem]">{etiqueta}</span>
      <input name={nombre} defaultValue={valor} placeholder={pista} />
    </label>
  );
}
