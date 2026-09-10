"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Flechas del teclado para recorrer la serie, tal y como promete la maqueta.
 * No pinta nada: sólo escucha. Se desentiende si el foco está en un campo.
 */
export function FlechasDeTeclado({
  anterior,
  siguiente,
  serie,
}: {
  anterior: string | null;
  siguiente: string | null;
  serie: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (anterior) router.prefetch(anterior);
    if (siguiente) router.prefetch(siguiente);
  }, [router, anterior, siguiente]);

  useEffect(() => {
    function alPulsar(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const foco = document.activeElement;
      if (
        foco instanceof HTMLElement &&
        (foco.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(foco.tagName))
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && anterior) router.push(anterior);
      if (e.key === "ArrowRight" && siguiente) router.push(siguiente);
      if (e.key === "Escape") router.push(serie);
    }

    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [router, anterior, siguiente, serie]);

  return null;
}
