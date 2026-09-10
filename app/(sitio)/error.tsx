"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Percance, Salidas } from "@/components/sitio/Percance";
import { useFallo } from "@/components/sitio/PercanceContexto";
import { TextoConEnlaces } from "@/components/sitio/TextoConEnlaces";
import { enCatalogo, POR_DEFECTO } from "@/lib/percances";

const DESTINOS = [
  { href: "/", texto: "Portada" },
  { href: "/archivo", texto: "Archivo por fechas" },
  { href: "/buscar", texto: "Buscar" },
];

/**
 * Cuando algo se rompe al montar una página del sitio.
 *
 * `retry` vuelve a pedirle a Next este trozo de página: si el fallo era de
 * paso —la base que no contestó a tiempo, la caché a medio arrancar— con eso
 * se arregla sin recargar nada más.
 *
 * El texto y la fotografía se escriben en /admin/errores y llegan aquí por el
 * marco del sitio (ver `PercanceContexto`). Si tampoco llegan, sale el de
 * fábrica: esta página es el último recurso y no puede depender de nada.
 *
 * No sale ningún enlace a contacto: la página se puede haber apagado desde el
 * panel y esto es de cliente, así que no hay manera de saberlo. Mandar a
 * alguien que ya ha tropezado a un segundo error sería peor.
 */
export default function FalloDelSitio({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const guardado = useFallo();
  const pagina = guardado ?? {
    codigo: enCatalogo("500")?.codigo ?? "Error 500",
    ...POR_DEFECTO["500"],
    imagen: null,
  };

  useEffect(() => {
    // Al registro del servidor, que es donde se puede mirar después.
    console.error(error);
  }, [error]);

  return (
    <Percance
      codigo={pagina.codigo}
      rotulo={pagina.rotulo}
      titulo={pagina.titulo}
      imagen={pagina.imagen}
    >
      <TextoConEnlaces
        texto={pagina.texto}
        className="text-[length:var(--texto)] leading-[var(--interlinea)] text-papel-2"
      />

      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="btn btn-p" onClick={() => retry()}>
          Volver a intentarlo
        </button>
        {error.digest && (
          <span className="font-mono text-[.66rem] tracking-[.06em] text-apagado">
            Referencia {error.digest}
          </span>
        )}
      </div>

      <Salidas>
        {DESTINOS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="font-mono text-[.72rem] tracking-[.12em] text-dato uppercase hover:text-rojo"
          >
            {d.texto}
          </Link>
        ))}
      </Salidas>
    </Percance>
  );
}
