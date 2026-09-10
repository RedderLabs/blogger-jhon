"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  IconoArchivo,
  IconoAviso,
  IconoCerrar,
  IconoCorreo,
  IconoEntradas,
  IconoEtiqueta,
  IconoGaleria,
  IconoImportar,
  IconoInicio,
  IconoLegal,
  IconoMenu,
  IconoMesa,
  IconoPercance,
  IconoPie,
  IconoPuntos,
  IconoRetrato,
  IconoSubir,
  IconoVisitas,
} from "@/components/Iconos";

/**
 * El rail, en tres grupos y una entrada suelta.
 *
 * La mesa de luz va sola arriba porque no es una sección más: es la portada
 * del panel y el sitio donde más se está. Debajo, lo que se toca agrupado por
 * lo que se está tocando —las páginas del sitio, lo que se publica, y el
 * resto— en vez de por orden de aparición, que era lo de antes y obligaba a
 * repasar los trece nombres para dar con uno.
 */
const MESA = { href: "/admin", texto: "Mesa de luz", Icono: IconoMesa, exacto: true };

const GRUPOS: {
  titulo: string;
  secciones: {
    href: string;
    texto: string;
    Icono: (p: { tam?: number }) => React.ReactElement;
  }[];
}[] = [
  {
    titulo: "Páginas",
    secciones: [
      { href: "/admin/sobre-mi", texto: "Sobre mí", Icono: IconoRetrato },
      { href: "/admin/errores", texto: "Errores", Icono: IconoPercance },
      { href: "/admin/portada", texto: "Portada", Icono: IconoInicio },
      { href: "/admin/aviso", texto: "Aviso", Icono: IconoAviso },
      { href: "/admin/legales", texto: "Legales", Icono: IconoLegal },
    ],
  },
  {
    titulo: "Entradas",
    secciones: [
      { href: "/admin/subir", texto: "Subir", Icono: IconoSubir },
      { href: "/admin/entradas", texto: "Entradas", Icono: IconoEntradas },
      { href: "/admin/categorias", texto: "Categorías", Icono: IconoEtiqueta },
      { href: "/admin/archivo", texto: "Archivo", Icono: IconoArchivo },
      { href: "/admin/galeria", texto: "Galería", Icono: IconoGaleria },
    ],
  },
  {
    titulo: "Otros",
    secciones: [
      { href: "/admin/mensajes", texto: "Mensajes", Icono: IconoCorreo },
      { href: "/admin/visitas", texto: "Visitas", Icono: IconoVisitas },
      { href: "/admin/pie", texto: "Pie", Icono: IconoPie },
      { href: "/admin/importar", texto: "Importar", Icono: IconoImportar },
      { href: "/admin/ajustes", texto: "Ajustes", Icono: IconoPuntos },
    ],
  },
];

type Props = {
  /** El nombre del sitio, que se escribe en /admin/ajustes. */
  nombre: string;
  /** Lo que se enseña al pie del rail: cifras del archivo. */
  pie: { etiqueta: string; valor: string; alerta?: boolean }[];
};

export function Rail({ nombre, pie }: Props) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  const activo = (href: string, exacto?: boolean) =>
    (exacto ? ruta === href : ruta.startsWith(href)) ? "si" : undefined;

  const marca = (
    <div className="border-b border-filo px-4 pt-[1.15rem] pb-[1.05rem]">
      <p className="font-serif text-[1.2rem] leading-none font-bold">{nombre}</p>
      <p className="lbl mt-[.35rem] text-[.5625rem] tracking-[.28em] text-rojo">
        Cuarto oscuro
      </p>
    </div>
  );

  const enlace = ({
    href,
    texto,
    Icono,
    exacto,
  }: {
    href: string;
    texto: string;
    Icono: (p: { tam?: number }) => React.ReactElement;
    exacto?: boolean;
  }) => (
    <Link
      key={href}
      href={href}
      className="nav-i"
      data-on={activo(href, exacto)}
      onClick={() => setAbierto(false)}
    >
      <Icono />
      {texto}
    </Link>
  );

  const navegacion = (
    <nav className="flex flex-col py-[.9rem]">
      {enlace(MESA)}
      {GRUPOS.map((g) => (
        <div key={g.titulo} className="flex flex-col gap-px">
          {/* El rótulo se alinea con el texto de los enlaces, no con su
              icono: 0.75rem de relleno más los 2px del filo de la izquierda. */}
          <p className="lbl mt-[1.1rem] mb-[.4rem] pl-[calc(.75rem+2px)] text-[.5625rem] tracking-[.22em] text-apagado">
            {g.titulo}
          </p>
          {g.secciones.map(enlace)}
        </div>
      ))}
    </nav>
  );

  const cifras = (
    <div className="mt-auto flex flex-col gap-[.55rem] border-t border-filo p-4">
      <p className="lbl text-[.5625rem]">Archivo</p>
      {pie.map((d) => (
        <p
          key={d.etiqueta}
          className="flex justify-between font-mono text-[.72rem] text-dato"
        >
          <span>{d.etiqueta}</span>
          <span className={d.alerta ? "text-rojo" : "text-papel"}>{d.valor}</span>
        </p>
      ))}
      <Link
        href="/"
        className="mt-2 font-mono text-[.66rem] tracking-[.12em] text-dato uppercase hover:text-papel"
      >
        Ver el sitio ↗
      </Link>
    </div>
  );

  return (
    <>
      {/* Barra superior en móvil y tableta */}
      <div className="flex items-center justify-between border-b border-filo bg-cuarto-2 px-4 py-3 lg:hidden">
        <div>
          <p className="font-serif text-[1.05rem] leading-none font-bold">{nombre}</p>
          <p className="lbl mt-1 text-[.5rem] tracking-[.28em] text-rojo">Cuarto oscuro</p>
        </div>
        <button
          type="button"
          className="border border-filo p-2 text-dato hover:border-filo-2 hover:text-papel"
          aria-expanded={abierto}
          aria-label={abierto ? "Cerrar el menú" : "Abrir el menú"}
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? <IconoCerrar tam={17} /> : <IconoMenu tam={17} />}
        </button>
      </div>

      {abierto && (
        <div className="scroll-fino flex max-h-[70dvh] flex-col overflow-y-auto border-b border-filo bg-cuarto-2 lg:hidden">
          {navegacion}
          {cifras}
        </div>
      )}

      {/* Rail fijo en escritorio */}
      <aside className="scroll-fino hidden w-[208px] shrink-0 flex-col overflow-y-auto border-r border-filo bg-cuarto-2 lg:flex">
        {marca}
        {navegacion}
        {cifras}
      </aside>
    </>
  );
}
