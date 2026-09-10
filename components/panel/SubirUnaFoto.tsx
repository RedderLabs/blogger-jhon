"use client";

import { useEffect, useRef, useState } from "react";

import type { FotoElegible } from "@/components/panel/SelectorDeFoto";
import { TIPOS_ACEPTADOS } from "@/lib/fotos";

export type RolloDestino = { id: string; codigo: string };

/** Los megas que ocupa, para que se vea antes de mandarlos. */
const enMegas = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * Subir una fotografía sin pasar por el lote.
 *
 * La entrada normal del archivo es /admin/subir, un rollo entero de una vez.
 * Esto es para el caso contrario: hace falta una imagen concreta aquí y ahora
 * —la que abre el sitio, la que acompaña a un error— y obligar a dar un rodeo
 * por otra sección para volver a esta es de las cosas que hacen que un panel
 * se deje de usar.
 *
 * Se puede soltar encima o buscarla en el equipo; las dos acaban en el mismo
 * sitio. Sigue entrando por un rollo, como todas, y sale publicada: por eso el
 * texto alternativo se pide antes y no después.
 */
export function SubirUnaFoto({
  rollos,
  onSubida,
}: {
  rollos: RolloDestino[];
  onSubida: (foto: FotoElegible) => void;
}) {
  const caja = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  const [fichero, setFichero] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [encima, setEncima] = useState(false);

  const [alt, setAlt] = useState("");
  const [titulo, setTitulo] = useState("");
  const [rolloId, setRolloId] = useState(rollos[0]?.id ?? "");
  const [codigo, setCodigo] = useState("");

  const rolloNuevo = rolloId === "";

  // La vista previa es un objeto del navegador y hay que soltarlo a mano: si
  // no, la imagen entera se queda en memoria hasta recargar la página. Se crea
  // al elegir el fichero y se suelta aquí, cuando deja de hacer falta.
  useEffect(() => {
    if (!vistaPrevia) return;
    return () => URL.revokeObjectURL(vistaPrevia);
  }, [vistaPrevia]);

  function coger(elegido: File | undefined | null) {
    if (!elegido) return;
    if (!TIPOS_ACEPTADOS.includes(elegido.type)) {
      limpiar();
      setFallo(
        "Ese fichero no se puede leer. Acepto JPEG, PNG, TIFF, WebP y AVIF; el RAW de cámara hay que revelarlo antes.",
      );
      return;
    }
    setFallo(null);
    setFichero(elegido);
    setVistaPrevia(URL.createObjectURL(elegido));
  }

  function limpiar() {
    setFichero(null);
    setVistaPrevia(null);
    if (caja.current) caja.current.value = "";
  }

  function soltar(e: React.DragEvent) {
    e.preventDefault();
    setEncima(false);
    coger(e.dataTransfer.files?.[0]);
  }

  async function subir() {
    if (!fichero) return setFallo("Elige una fotografía o suéltala en la caja.");
    if (alt.trim().length < 3) {
      return setFallo("Escribe el texto alternativo: es lo único que lee un lector de pantalla.");
    }
    if (rolloNuevo && !codigo.trim()) {
      return setFallo("Ponle un código al rollo nuevo.");
    }

    setFallo(null);
    setSubiendo(true);
    try {
      const datos = new FormData();
      datos.set("foto", fichero);
      datos.set("alt", alt);
      datos.set("titulo", titulo);
      datos.set("rolloId", rolloNuevo ? "" : rolloId);
      datos.set("codigo", codigo);

      const r = await fetch("/api/subir/suelta", { method: "POST", body: datos });
      const cuerpo = await r.json();

      if (!r.ok) {
        setFallo(cuerpo?.error ?? "No ha podido subirse.");
        return;
      }

      onSubida(cuerpo.foto as FotoElegible);
      limpiar();
      setAlt("");
      setTitulo("");
      setCodigo("");
      setAbierto(false);
    } catch {
      setFallo("Se ha cortado la subida. Prueba otra vez.");
    } finally {
      setSubiendo(false);
    }
  }

  if (!abierto) {
    return (
      <button type="button" className="btn w-fit" onClick={() => setAbierto(true)}>
        Subir una fotografía nueva
      </button>
    );
  }

  return (
    <div className="grid gap-4 border border-filo p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="lbl text-[.5625rem]">Una fotografía nueva</p>
        <button
          type="button"
          className="ml-auto font-mono text-[.66rem] tracking-[.08em] text-dato uppercase hover:text-rojo"
          onClick={() => setAbierto(false)}
        >
          Cerrar
        </button>
      </div>

      {/* --- La caja: se suelta encima o se busca en el equipo ------------- */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={(e) => {
          // Sólo cuando se sale de la caja de verdad, no al pasar por encima
          // de lo que hay dentro.
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEncima(false);
        }}
        onDrop={soltar}
        className="grid gap-3 border border-dashed p-4 text-center transition-colors"
        style={{
          borderColor: encima ? "var(--color-rojo)" : "var(--color-filo)",
          background: encima ? "rgb(217 80 58 / .06)" : undefined,
        }}
      >
        {vistaPrevia && fichero ? (
          <figure className="m-0 grid justify-items-center gap-2">
            {/* Es un objeto del navegador, no una copia del archivo: aquí el
                optimizador de Next no pinta nada. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vistaPrevia}
              alt=""
              className="max-h-[220px] w-auto max-w-full bg-marco object-contain"
            />
            <figcaption className="font-mono text-[.66rem] leading-relaxed tracking-[.04em] text-dato">
              {fichero.name} · {enMegas(fichero.size)}
            </figcaption>
          </figure>
        ) : (
          <p className="m-0 font-mono text-[.72rem] leading-relaxed tracking-[.04em] text-dato">
            Suelta aquí la fotografía
            <br />
            <span className="text-apagado">JPEG, PNG, TIFF, WebP o AVIF</span>
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="btn"
            onClick={() => caja.current?.click()}
            disabled={subiendo}
          >
            {fichero ? "Elegir otra" : "Buscar en el equipo"}
          </button>
          {fichero && (
            <button
              type="button"
              className="font-mono text-[.66rem] tracking-[.08em] text-dato uppercase hover:text-rojo"
              onClick={limpiar}
              disabled={subiendo}
            >
              Quitarla
            </button>
          )}
        </div>

        <input
          ref={caja}
          type="file"
          accept={TIPOS_ACEPTADOS.join(",")}
          aria-label="La fotografía"
          className="hidden"
          onChange={(e) => coger(e.target.files?.[0])}
        />
      </div>

      <label className="grid gap-1">
        <span className="lbl text-[.5625rem]">Texto alternativo</span>
        <textarea
          rows={2}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Qué se ve, en una frase. Obligatorio: sale publicada."
          className="leading-relaxed"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="lbl text-[.5625rem]">Título</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Sin título"
            autoComplete="off"
          />
        </label>

        <label className="grid gap-1">
          <span className="lbl text-[.5625rem]">A qué rollo va</span>
          <select value={rolloId} onChange={(e) => setRolloId(e.target.value)}>
            {rollos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.codigo}
              </option>
            ))}
            <option value="">Uno nuevo…</option>
          </select>
        </label>
      </div>

      {rolloNuevo && (
        <label className="grid gap-1 sm:max-w-[20rem]">
          <span className="lbl text-[.5625rem]">Código del rollo nuevo</span>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="R/2026-09"
            autoComplete="off"
          />
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-p"
          onClick={subir}
          disabled={subiendo || !fichero}
        >
          {subiendo ? "Subiendo…" : "Subir y publicar"}
        </button>
        {fallo && (
          <span role="alert" className="font-mono text-[.66rem] tracking-[.04em] text-rojo">
            {fallo}
          </span>
        )}
      </div>

      <p className="m-0 max-w-[64ch] font-mono text-[.625rem] leading-relaxed tracking-[.04em] text-apagado">
        Entra en el archivo como cualquier otra: publicada, con su ficha y
        dentro del rollo que elijas. La ficha técnica —cámara, película,
        revelado— se le pone después desde su propia página.
      </p>
    </div>
  );
}
