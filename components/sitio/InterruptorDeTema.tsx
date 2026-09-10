"use client";

import { IconoLuna, IconoSol } from "@/components/Iconos";
import { CLAVE_TEMA, type Tema } from "@/lib/tema";

/**
 * Cambia entre el cuarto oscuro y el papel.
 *
 * No guarda estado ni lee nada al montar: la verdad está en el atributo
 * `data-tema` del `html`, que pone el guión del `head` antes de pintar. El
 * icono lo elige el CSS a partir de ese mismo atributo, así que no hay
 * parpadeo ni desajuste entre lo que sirve el servidor y lo que ve el
 * navegador. Por eso la etiqueta habla de las dos posturas: vale para las dos.
 */
export function InterruptorDeTema({ className }: { className?: string }) {
  function cambiar() {
    const raiz = document.documentElement;
    const siguiente: Tema = raiz.dataset.tema === "claro" ? "oscuro" : "claro";

    if (siguiente === "claro") raiz.dataset.tema = "claro";
    else delete raiz.dataset.tema;

    try {
      localStorage.setItem(CLAVE_TEMA, siguiente);
    } catch {
      // Navegación privada o almacenamiento lleno: vale para esta visita.
    }
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      aria-label="Cambiar entre cuarto oscuro y papel claro"
      title="Cuarto oscuro o papel claro"
      className={`flex h-9 w-9 items-center justify-center border border-filo text-dato transition-colors hover:border-filo-2 hover:text-papel ${className ?? ""}`}
    >
      <IconoLuna tam={15} className="si-oscuro" />
      <IconoSol tam={15} className="si-claro" />
    </button>
  );
}
