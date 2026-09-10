"use client";

import { createContext, useContext } from "react";

import type { PercanceCompleto } from "@/lib/percances";

const Contexto = createContext<PercanceCompleto | null>(null);

/**
 * El texto de la página de fallo, puesto a mano en el árbol antes de que haga
 * falta.
 *
 * `error.tsx` tiene que ser un componente de cliente, así que no puede leer de
 * la base lo que se ha escrito en el panel. La vuelta es esta: el marco del
 * sitio —que es de servidor y se pinta por encima del cortafuegos— lo baja ya
 * leído, y la página de fallo sólo tiene que recogerlo.
 *
 * Si lo que se rompió fue el propio marco, aquí no llega nada y sale el texto
 * de fábrica. Es justo lo que se quiere: el último recurso no puede depender
 * de lo que acaba de fallar.
 */
export function ProveedorDelFallo({
  valor,
  children,
}: {
  valor: PercanceCompleto;
  children: React.ReactNode;
}) {
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useFallo() {
  return useContext(Contexto);
}
