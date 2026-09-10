"use client";

import { useRef } from "react";

import {
  BarraDeFormato,
  type Herramienta,
  TODAS,
} from "@/components/panel/BarraDeFormato";

/**
 * Una caja de texto del panel con sus botones de formato encima.
 *
 * Es lo que sustituye a un `<textarea>` suelto en todas las pantallas donde
 * se escribe algo que luego se lee en el sitio. Cada caja se trae su propio
 * enganche al elemento, que es lo que necesita la barra para saber qué hay
 * seleccionado: así una pantalla con seis cajas —la de contacto— no tiene que
 * llevar la cuenta de seis referencias.
 */
export function CajaConFormato({
  valor,
  alCambiar,
  grupos = TODAS,
  className,
  ...resto
}: {
  valor: string;
  alCambiar: (v: string) => void;
  /** Qué grupos de botones se enseñan; por defecto, todos. */
  grupos?: Herramienta[][];
  className?: string;
  name?: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  "aria-label"?: string;
}) {
  const caja = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="grid gap-1">
      <BarraDeFormato
        caja={caja}
        valor={valor}
        alCambiar={alCambiar}
        grupos={grupos}
      />
      <textarea
        {...resto}
        ref={caja}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        className={className}
      />
    </div>
  );
}
