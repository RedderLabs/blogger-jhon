"use client";

import "./globals.css";

/**
 * El último cortafuegos: lo que sale si se rompe la maqueta de raíz, la que
 * pinta el `<html>` y el `<body>`.
 *
 * Por eso este fichero los pinta él mismo y no usa nada del sitio: si llegase
 * a depender de la cabecera, del pie o de la base, se rompería por lo mismo
 * que ha traído hasta aquí. Las tipografías tampoco están —las carga la
 * maqueta que ha fallado—, así que sale con la letra del sistema. No pasa
 * nada: esta página no debería verse nunca.
 */
export default function FalloDeRaiz({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          minHeight: "100vh",
          display: "grid",
          placeContent: "center",
          gap: "1.25rem",
          padding: "2rem",
          background: "#100e0d",
          color: "#ede7de",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: ".7rem",
            letterSpacing: ".28em",
            textTransform: "uppercase",
            color: "#d9503a",
          }}
        >
          Error
        </p>
        <h1
          style={{
            margin: 0,
            maxWidth: "18ch",
            fontSize: "2rem",
            lineHeight: 1.1,
            fontWeight: 700,
          }}
        >
          El sitio no ha podido abrirse
        </h1>
        <p style={{ margin: 0, maxWidth: "48ch", lineHeight: 1.7, color: "#beb5aa" }}>
          Ha fallado algo por debajo de todo lo demás. Vuelve a intentarlo; si
          sigue igual, es cosa del servidor y se arregla desde dentro.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              border: "1px solid #4a423b",
              background: "transparent",
              color: "#ede7de",
              padding: ".5rem 1rem",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            Volver a intentarlo
          </button>
          {error.digest && (
            <span style={{ fontSize: ".72rem", letterSpacing: ".06em", color: "#5c554e" }}>
              Referencia {error.digest}
            </span>
          )}
        </div>
      </body>
    </html>
  );
}
