"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import { borrarEntrada, crearCategoria, guardarEntrada } from "@/app/admin/acciones";
import { EditorDeCuerpo } from "@/components/panel/EditorDeCuerpo";
import { SelectorDeFoto } from "@/components/panel/SelectorDeFoto";
import { VideoDeYoutube } from "@/components/sitio/VideoDeYoutube";
import { textoDelCuerpo, trozosDelCuerpo } from "@/lib/cuerpo";

type Entrada = {
  id: string;
  slug: string;
  titulo: string;
  kicker: string;
  texto: string;
  estado: string;
  publicadoEn: string;
  imagenId: string;
  temas: string[];
  series: string[];
};

type Foto = { id: string; archivo: string; titulo: string };

type Props = {
  entrada: Entrada | null;
  temas: { id: string; nombre: string }[];
  series: { id: string; nombre: string }[];
  /** Todo el archivo publicado: es de donde se eligen las intercaladas. */
  fotos: (Foto & { alt: string; estado: string; rollo: string; orden: number; serie: string | null })[];
};

/**
 * Las fotografías se guardan como un hueco —`<figure data-foto="ID">`— sin la
 * imagen dentro: la de verdad la pone la página al pintar, con su visor y su
 * ficha. Para escribir hace falta verlas, así que al abrir el editor se les
 * mete la miniatura y TinyMCE la enseña como un bloque de una pieza.
 */
function conMiniaturas(html: string, porId: Map<string, Foto>): string {
  return html.replace(
    /<figure([^>]*\sdata-foto="([^"]+)"[^>]*)>([\s\S]*?)<\/figure>/gi,
    (entera, atributos: string, id: string, dentro: string) => {
      if (dentro.includes("<img")) return entera;
      const f = porId.get(id);
      if (!f) return entera;
      return (
        `<figure${atributos} contenteditable="false">` +
        `<img src="${f.archivo}" alt="">` +
        `<figcaption>${f.titulo}</figcaption>` +
        `</figure>`
      );
    },
  );
}

/**
 * Los vídeos ya escritos se guardan como el hueco a secas —el
 * `contenteditable` no sobrevive al saneado, ni tiene por qué—, y sin él
 * TinyMCE deja escribir dentro del `<figure>` y la etiqueta acaba partida.
 * Al abrir se les vuelve a poner: dentro del editor son un bloque de una
 * pieza, que se selecciona y se borra entero. Lo que se ve lo pinta el
 * `content_style` de `EditorDeCuerpo`.
 */
function conVideosEnBloque(html: string): string {
  return html.replace(
    /<figure(?![^>]*\scontenteditable=)([^>]*\sdata-video="[^"]+"[^>]*)>/gi,
    '<figure contenteditable="false"$1>',
  );
}

const ESTADOS = [
  { valor: "borrador", texto: "Borrador" },
  { valor: "programada", texto: "Programada" },
  { valor: "publica", texto: "Pública" },
];

/* --- El día y la hora ------------------------------------------------------
   Todo el sitio enseña las fechas en UTC —`fechaLarga`, `fechaFicha`— y aquí
   se sigue igual: un `datetime-local` que se lee y se escribe en UTC no
   depende de dónde esté el reloj del servidor ni del navegador, así que lo
   que se ve al abrir la página es lo mismo que se guardó. */

/** Del instante guardado al hueco del formulario: 2026-08-26T18:30 */
const aCasilla = (iso: string) => iso.slice(0, 16);

/** Y de vuelta, ya como instante completo. Vacío sigue siendo vacío. */
const aInstante = (casilla: string) =>
  casilla ? `${casilla.slice(0, 16)}:00.000Z` : "";

/** Mañana a esta hora, en punto: lo que se propone al programar sin fecha. */
function manana(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setUTCMinutes(0, 0, 0);
  return aCasilla(d.toISOString());
}

const yaPaso = (casilla: string) =>
  Boolean(casilla) && new Date(aInstante(casilla)).getTime() <= Date.now();

export function EditorDeEntrada({ entrada, temas, series, fotos }: Props) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [titulo, setTitulo] = useState(entrada?.titulo ?? "");
  const [kicker, setKicker] = useState(entrada?.kicker ?? "");
  const [texto, setTexto] = useState(entrada?.texto ?? "");
  const [elegidosTemas, setTemas] = useState<string[]>(entrada?.temas ?? []);
  // El catálogo se guarda en estado y no se lee del prop a secas: una
  // categoría creada aquí tiene que aparecer y quedarse marcada sin recargar,
  // que es justo lo que se está haciendo cuando hace falta una nueva.
  const [catalogo, setCatalogo] = useState(temas);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [falloCategoria, setFalloCategoria] = useState<string | null>(null);
  const [elegidasSeries, setSeries] = useState<string[]>(entrada?.series ?? []);
  const [imagenId, setImagenId] = useState(entrada?.imagenId ?? "");
  const [vista, setVista] = useState<"escribir" | "previa">("escribir");

  /* El estado y la fecha van en estado de React y no sueltos en el formulario.
     Con `action={...}`, React vacía el formulario en cuanto la acción termina,
     y un `<select defaultValue>` volvía entonces a lo que valía al abrir la
     página: se elegía «Pública», se guardaba bien, la casilla saltaba sola a
     «Borrador» y el siguiente Guardar la devolvía a borrador de verdad.
     Controlados, lo que se ve es lo que se manda. */
  const [estado, setEstado] = useState(entrada?.estado ?? "borrador");
  const [cuando, setCuando] = useState(entrada?.publicadoEn ?? "");

  /* El botón «Fotografía» del editor abre esta rejilla y espera. Se guarda la
     promesa a medias: se resuelve al elegir una o al cerrar sin elegir, que es
     lo que necesita TinyMCE para seguir donde estaba. */
  const [pidiendoFoto, setPidiendoFoto] = useState(false);
  const responder = useRef<((f: Foto | null) => void) | null>(null);

  const pedirFoto = () =>
    new Promise<Foto | null>((resolver) => {
      responder.current = resolver;
      setPidiendoFoto(true);
    });

  function cerrarRejilla(elegida: Foto | null) {
    responder.current?.(elegida);
    responder.current = null;
    setPidiendoFoto(false);
  }

  const trozos = useMemo(() => trozosDelCuerpo(texto), [texto]);
  const palabras = useMemo(
    () => textoDelCuerpo(texto).split(/\s+/).filter(Boolean).length,
    [texto],
  );
  const minutos = Math.max(1, Math.round(palabras / 180));
  const porId = new Map(fotos.map((f) => [f.id, f]));
  const puestaDeCabecera = imagenId ? porId.get(imagenId) : undefined;

  function alternar(lista: string[], set: (v: string[]) => void, id: string) {
    set(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);
  }

  /**
   * Una categoría nueva sin salir de aquí. Se crea de verdad en la base —hace
   * falta su identificador para poder guardarla con la entrada— y entra ya
   * marcada: quien la escribe la quiere puesta en el texto que tiene delante.
   */
  function anadirCategoria() {
    const nombre = nuevaCategoria.trim();
    if (nombre.length < 2) return;

    empezar(async () => {
      const r = await crearCategoria(nombre);
      if (r?.error || !r?.categoria) {
        setFalloCategoria(r?.error ?? "No se ha podido crear.");
        return;
      }
      const creada = { id: r.categoria.id, nombre: r.categoria.nombre };
      setCatalogo((antes) => [...antes, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setTemas((antes) => [...antes, creada.id]);
      setNuevaCategoria("");
      setFalloCategoria(null);
    });
  }

  function enviar(datos: FormData) {
    datos.delete("temas");
    datos.delete("series");
    for (const t of elegidosTemas) datos.append("temas", t);
    for (const s of elegidasSeries) datos.append("series", s);
    datos.set("imagenId", imagenId);
    datos.set("texto", texto);
    datos.set("titulo", titulo);
    datos.set("kicker", kicker);
    datos.set("estado", estado);
    datos.set("publicadoEn", aInstante(cuando));

    empezar(async () => {
      const r = await guardarEntrada(entrada?.id ?? null, datos);
      if (r?.error) {
        setMensaje(r.error);
        return;
      }
      // Que la dirección haya cambiado se dice, no se deja descubrir: es lo
      // que se pega en un correo o en una red, y quien corrige una errata del
      // título no tiene por qué imaginar que también se ha movido la página.
      setMensaje(
        r?.mudada
          ? `Guardado. La dirección ahora es /entradas/${r.slug} — la anterior lleva aquí.`
          : "Guardado.",
      );
      if (!entrada && r?.id) router.replace(`/admin/entradas/${r.id}`);
      else router.refresh();
    });
  }

  return (
    <form action={enviar} className="flex min-h-0 flex-1 flex-col">
      {/* La rejilla del archivo, cuando la pide el botón del editor. */}
      {pidiendoFoto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-negro/80 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Elegir una fotografía del archivo"
        >
          <div className="w-full max-w-[52rem] border border-filo bg-cuarto p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <p className="lbl">Poner una fotografía</p>
              <button
                type="button"
                className="btn ml-auto"
                onClick={() => cerrarRejilla(null)}
              >
                Cerrar
              </button>
            </div>
            <SelectorDeFoto
              fotos={fotos}
              elegida={null}
              onElegir={(id) => cerrarRejilla(fotos.find((f) => f.id === id) ?? null)}
              nota="todo el archivo, publicadas y en borrador. Se pone donde esté el cursor, con su pie y su ficha técnica."
            />
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-filo bg-cuarto px-4 py-3 sm:px-6">
        <p className="font-mono text-[.72rem] tracking-[.08em] text-dato">
          <Link href="/admin/entradas" className="hover:text-papel">
            Entradas
          </Link>
          <span className="text-filo-2"> / </span>
          <span className="text-papel">{entrada ? entrada.slug : "entrada nueva"}</span>
        </p>

        <div className="flex lg:ml-auto">
          <button
            type="button"
            className="seg"
            data-on={vista === "escribir" ? "si" : undefined}
            onClick={() => setVista("escribir")}
          >
            Escribir
          </button>
          <button
            type="button"
            className="seg"
            data-on={vista === "previa" ? "si" : undefined}
            onClick={() => setVista("previa")}
          >
            Previsualizar
          </button>
        </div>

        {entrada && (
          <Link
            href={`/entradas/${entrada.slug}`}
            target="_blank"
            className="btn"
          >
            Ver ↗
          </Link>
        )}
        <button type="submit" className="btn btn-p" disabled={enCurso}>
          {enCurso ? "Guardando…" : "Guardar"}
        </button>
      </header>

      {mensaje && (
        <p
          role="status"
          className="border-b border-filo bg-[rgb(217_80_58/.08)] px-4 py-2 font-mono text-[.7rem] tracking-[.04em] sm:px-6"
        >
          {mensaje}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_396px]">
        <section className="scroll-fino flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:overflow-y-auto">
          {vista === "escribir" ? (
            <>
              <label className="grid gap-2">
                <span className="lbl text-[.5625rem]">Antetítulo</span>
                <input
                  value={kicker}
                  onChange={(e) => setKicker(e.target.value)}
                  placeholder="Método, Mirada, Crítica…"
                  className="max-w-[280px]"
                />
              </label>

              <label className="grid gap-2">
                <span className="lbl text-[.5625rem]">Título</span>
                <input
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="font-serif text-[1.5rem] leading-tight font-bold"
                />
              </label>

              <div className="grid flex-1 gap-2">
                <span className="lbl text-[.5625rem]">Texto</span>
                <EditorDeCuerpo
                  valor={conVideosEnBloque(conMiniaturas(texto, porId))}
                  alCambiar={setTexto}
                  alPedirFoto={pedirFoto}
                />
                <span className="font-mono text-[.625rem] tracking-[.04em] text-dato">
                  {palabras} palabras · {minutos} min de lectura
                </span>
              </div>
            </>
          ) : (
            <article className="max-w-[64ch]">
              <p className="font-mono text-[.7rem] tracking-[.14em] text-rojo uppercase">
                Entradas · {kicker || "…"}
              </p>
              <h1 className="mt-4 font-serif text-[2rem] leading-[1.05] font-bold tracking-[-.015em]">
                {titulo || "Sin título"}
              </h1>
              <div className="mt-8 flex flex-col gap-6">
                {trozos.map((t, i) => {
                  if (t.tipo === "html") {
                    return (
                      <div
                        key={i}
                        className="cuerpo"
                        dangerouslySetInnerHTML={{ __html: t.html }}
                      />
                    );
                  }
                  // La previsualización enseña el vídeo de verdad, con el
                  // mismo componente que la página: es la única forma de ver
                  // antes de publicar cuánto ocupa y dónde parte el texto.
                  if (t.tipo === "video") {
                    return <VideoDeYoutube key={i} id={t.videoId} />;
                  }
                  const f = porId.get(t.fotoId);
                  return f ? (
                    <figure key={i} className="m-0">
                      <Image
                        src={f.archivo}
                        alt=""
                        width={900}
                        height={600}
                        quality={70}
                        sizes="64ch"
                        className="h-auto w-full"
                      />
                      <figcaption className="mt-2 font-mono text-[.68rem] text-dato">
                        {t.pie ?? f.titulo}
                      </figcaption>
                    </figure>
                  ) : (
                    <p
                      key={i}
                      className="border border-rojo px-3 py-2 font-mono text-[.7rem] text-rojo"
                    >
                      No encuentro la foto {t.fotoId}
                    </p>
                  );
                })}
              </div>
            </article>
          )}
        </section>

        <aside className="scroll-fino flex flex-col border-t border-filo bg-cuarto-2 lg:overflow-y-auto lg:border-t-0 lg:border-l">
          <div className="grid gap-3 border-b border-filo px-5 py-4">
            <label className="grid gap-1">
              <span className="lbl text-[.5625rem]">Estado</span>
              <select
                value={estado}
                onChange={(e) => {
                  const nuevo = e.target.value;
                  setEstado(nuevo);
                  // Programar sin decir cuándo no es programar: si no hay
                  // fecha, o la que hay ya pasó, se propone mañana en punto
                  // para que sólo haya que retocarla.
                  if (nuevo === "programada" && (!cuando || yaPaso(cuando))) {
                    setCuando(manana());
                  }
                }}
              >
                {ESTADOS.map((e) => (
                  <option key={e.valor} value={e.valor}>
                    {e.texto}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="lbl text-[.5625rem]">
                {estado === "programada"
                  ? "Cuándo se publica — día y hora"
                  : "Fecha de publicación"}
              </span>
              <input
                type="datetime-local"
                value={cuando}
                required={estado !== "borrador"}
                onChange={(e) => setCuando(aCasilla(e.target.value))}
              />
              <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
                {estado === "programada"
                  ? "En hora UTC, la misma con la que el sitio enseña todas las fechas."
                  : estado === "publica"
                    ? "Es la que la ordena en el índice y en el archivo."
                    : "Un borrador puede llevarla o no: no se enseña en ningún sitio."}
              </span>
              {estado === "programada" && yaPaso(cuando) && (
                <span className="font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-rojo">
                  Esa fecha ya ha pasado. Ponle una futura, o déjala en
                  «Pública» si lo que quieres es que salga ya.
                </span>
              )}
            </label>
          </div>

          {/* En la base se llaman `Tema` —son los que filtran /entradas—; aquí
              y en /admin/categorias se leen como lo que son. El campo del
              formulario sigue siendo «temas», que es lo que espera la acción. */}
          <div className="flex flex-col gap-3 border-b border-filo px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="lbl">Categorías</p>
              <Link
                href="/admin/categorias"
                target="_blank"
                className="font-mono text-[.62rem] tracking-[.1em] text-apagado uppercase hover:text-papel"
              >
                Ordenarlas ↗
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {catalogo.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => alternar(elegidosTemas, setTemas, t.id)}
                  className="border px-[.65rem] py-[.32rem] font-mono text-[.66rem] tracking-[.1em] uppercase"
                  style={
                    elegidosTemas.includes(t.id)
                      ? {
                          borderColor: "var(--color-rojo)",
                          background: "color-mix(in oklab, var(--color-rojo) 12%, transparent)",
                          color: "var(--color-papel)",
                        }
                      : { borderColor: "var(--color-filo)", color: "var(--color-dato)" }
                  }
                >
                  {t.nombre}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    anadirCategoria();
                  }
                }}
                placeholder="Categoría nueva"
                autoComplete="off"
                aria-label="Categoría nueva"
                className="max-w-[13rem]"
              />
              <button
                type="button"
                className="btn"
                onClick={anadirCategoria}
                disabled={enCurso || nuevaCategoria.trim().length < 2}
              >
                Añadir
              </button>
            </div>
            <p
              className={`m-0 font-mono text-[.62rem] leading-relaxed tracking-[.04em] ${
                falloCategoria ? "text-rojo" : "text-apagado"
              }`}
            >
              {falloCategoria ??
                "La nueva se crea al momento y entra marcada en este texto."}
            </p>
          </div>

          <div className="flex flex-col gap-3 border-b border-filo px-5 py-4">
            <p className="lbl">Series citadas</p>
            <p className="m-0 font-mono text-[.66rem] leading-relaxed text-dato">
              El enlace va en los dos sentidos: la entrada aparece también en la página de
              la serie.
            </p>
            <div className="flex flex-wrap gap-2">
              {series.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => alternar(elegidasSeries, setSeries, s.id)}
                  className="border px-[.65rem] py-[.32rem] font-mono text-[.66rem] tracking-[.1em] uppercase"
                  style={
                    elegidasSeries.includes(s.id)
                      ? {
                          borderColor: "var(--color-rojo)",
                          background: "color-mix(in oklab, var(--color-rojo) 12%, transparent)",
                          color: "var(--color-papel)",
                        }
                      : { borderColor: "var(--color-filo)", color: "var(--color-dato)" }
                  }
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4">
            <p className="lbl">Imagen de la entrada</p>

            {puestaDeCabecera ? (
              <figure className="m-0 grid gap-2">
                <div className="relative aspect-[3/2] bg-marco">
                  <Image
                    src={puestaDeCabecera.archivo}
                    alt=""
                    fill
                    quality={70}
                    sizes="360px"
                    className="object-cover"
                  />
                  {puestaDeCabecera.estado !== "publicada" && (
                    <span className="absolute top-0 right-0 bg-cuarto/85 px-1 font-mono text-[.5rem] tracking-[.08em] text-dato uppercase">
                      Bor
                    </span>
                  )}
                </div>
                <figcaption className="font-mono text-[.62rem] leading-relaxed tracking-[.04em] text-dato">
                  {puestaDeCabecera.rollo}/
                  {String(puestaDeCabecera.orden).padStart(2, "0")} ·{" "}
                  {puestaDeCabecera.titulo}
                </figcaption>
              </figure>
            ) : (
              <p className="border border-dashed border-filo px-4 py-6 text-center font-mono text-[.66rem] leading-relaxed text-dato">
                Sin imagen de cabecera.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  const elegida = await pedirFoto();
                  if (elegida) setImagenId(elegida.id);
                }}
              >
                Elegir del archivo
              </button>
              {imagenId && (
                <button
                  type="button"
                  className="btn text-dato hover:text-rojo"
                  onClick={() => setImagenId("")}
                >
                  Quitarla
                </button>
              )}
            </div>

            <p className="m-0 font-mono text-[.62rem] leading-relaxed tracking-[.04em] text-apagado">
              La de la cabecera: la que sale en el índice y en las redes. Las
              que van dentro del texto se ponen con el botón de la fotografía,
              en la barra del editor, y se elige del mismo archivo.
            </p>

            {entrada && (
              <button
                type="button"
                disabled={enCurso}
                onClick={() => {
                  if (!confirm(`¿Borrar «${entrada.titulo}»? No hay vuelta atrás.`)) return;
                  empezar(async () => {
                    await borrarEntrada(entrada.id);
                    router.push("/admin/entradas");
                  });
                }}
                className="mt-4 self-start border-b border-filo font-mono text-[.66rem] tracking-[.12em] text-dato uppercase hover:border-rojo hover:text-rojo"
              >
                Borrar esta entrada
              </button>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
