import type { Route } from "next";
import Link from "next/link";

import { type Bloque, CLASE_DE_ALINEACION, textoABloques } from "@/lib/bloques";
import { enTrozos } from "@/lib/formato";

/**
 * Una línea escrita en el panel, con su formato puesto: negrita, cursiva,
 * subrayado, tachado, monoespaciado y enlaces (ver `lib/formato.ts`).
 *
 * Sin "use client" ni estado, para que valga igual en una página de servidor
 * y en la vista previa del panel, que es de cliente.
 */
export function Formateado({ texto }: { texto: string }) {
  return (
    <>
      {enTrozos(texto).map((t, i) => {
        // Las marcas se suman: una palabra puede ser negrita y cursiva a la
        // vez, así que esto son clases, no un elemento por cada una.
        const clase = [
          t.fuerte ? "font-semibold text-papel" : "",
          t.enfasis ? "italic" : "",
          t.subrayado ? "underline underline-offset-4" : "",
          t.tachado ? "line-through" : "",
          t.codigo ? "font-mono text-[.92em] text-papel" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const cuerpo = t.codigo ? (
          <code className={clase}>{t.texto}</code>
        ) : clase ? (
          <span className={clase}>{t.texto}</span>
        ) : (
          t.texto
        );

        if (!t.href) return <span key={i}>{cuerpo}</span>;

        // Lo de fuera se abre aparte y sin dejar que la otra página toque
        // ésta; lo de dentro va por el enrutado del sitio, sin recargar.
        return t.fuera ? (
          <a
            key={i}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-papel underline underline-offset-4 hover:text-rojo"
          >
            {cuerpo}
          </a>
        ) : (
          <Link
            key={i}
            href={t.href as Route}
            className="text-papel underline underline-offset-4 hover:text-rojo"
          >
            {cuerpo}
          </Link>
        );
      })}
    </>
  );
}

/**
 * El tamaño de cada rótulo. Son seis niveles porque el panel deja elegir
 * seis: del que abre una parte entera al que sólo separa dos párrafos.
 */
const TITULOS: Record<number, string> = {
  1: "font-serif text-[1.9rem] leading-tight font-bold sm:text-[2.2rem]",
  2: "font-serif text-[1.5rem] leading-tight font-bold sm:text-[1.7rem]",
  3: "font-serif text-[1.25rem] leading-tight font-bold sm:text-[1.4rem]",
  4: "font-serif text-[1.1rem] leading-tight font-bold",
  5: "font-sans text-[1rem] leading-tight font-semibold text-papel",
  6: "lbl lbl-sitio",
};

/**
 * Un bloque ya troceado, pintado. Las fotografías intercaladas se devuelven
 * sin pintar —`null`—: sólo las entradas saben de dónde sacarlas, y cada
 * página las coloca a su manera.
 */
export function PintarBloque({
  b,
  className,
}: {
  b: Bloque;
  className?: string;
}) {
  if (b.tipo === "separador") {
    return <hr className="my-2 h-px w-full border-0 bg-filo" />;
  }

  const alinear = b.alinear ? CLASE_DE_ALINEACION[b.alinear] : "";
  const junto = (base?: string) => [base, alinear].filter(Boolean).join(" ") || undefined;

  if (b.tipo === "titulo") {
    const nivel = b.nivel ?? 2;
    const Rotulo = `h${nivel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    return (
      <Rotulo className={junto(`mt-2 ${TITULOS[nivel] ?? TITULOS[2]}`)}>
        <Formateado texto={b.texto} />
      </Rotulo>
    );
  }

  if (b.tipo === "lista") {
    const Lista = b.numerada ? "ol" : "ul";
    return (
      <Lista
        className={junto(`m-0 grid gap-2 pl-5 ${b.numerada ? "list-decimal" : "list-disc"}`)}
      >
        {b.puntos.map((p, j) => (
          <li key={j} className={className}>
            <Formateado texto={p} />
          </li>
        ))}
      </Lista>
    );
  }

  if (b.tipo === "cita") {
    return (
      <blockquote className={junto("m-0 border-l-2 border-rojo pl-5")}>
        <p className="font-serif text-[1.15rem] leading-[1.45] italic sm:text-[1.3rem]">
          <Formateado texto={b.texto} />
        </p>
        {b.firma && (
          <cite className="mt-2 block font-mono text-[.7rem] tracking-[.14em] text-dato uppercase not-italic">
            {b.firma}
          </cite>
        )}
      </blockquote>
    );
  }

  if (b.tipo === "figura") return null;

  return (
    <p className={junto(className)}>
      <Formateado texto={b.texto} />
    </p>
  );
}

/**
 * Un texto largo del panel, entero: párrafos, rótulos, listas, citas y rayas,
 * con el formato de cada línea puesto.
 *
 * Lo trocea el mismo `textoABloques` que el cuerpo de una entrada, para que
 * escribir en el panel sea lo mismo en todas las páginas: quien aprende a
 * poner una lista en una entrada la pone igual en la página de contacto. Las
 * fotografías intercaladas son cosa de las entradas: aquí no hay de dónde
 * sacarlas, así que se quedan como el texto que se escribió.
 */
export function TextoConFormato({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  return (
    <>
      {textoABloques(texto).map((b, i) =>
        b.tipo === "figura" ? (
          <p key={i} className={className}>
            [foto:{b.fotoId}]{b.pie ? ` ${b.pie}` : ""}
          </p>
        ) : (
          <PintarBloque key={i} b={b} className={className} />
        ),
      )}
    </>
  );
}
