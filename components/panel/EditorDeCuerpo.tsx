"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useState } from "react";

import { conVideos } from "@/lib/videos";

/**
 * El editor del cuerpo de una entrada: TinyMCE, servido por el propio sitio.
 *
 * Cuatro cosas que conviene no deshacer sin pensarlo:
 *
 *  · **No se carga del CDN de Tiny.** `tinymceScriptSrc` apunta a
 *    `/tinymce/`, que deja ahí `scripts/copiar-tinymce.mjs` antes de cada
 *    compilación. Cargarlo de su nube sería una línea menos y una petición a
 *    un servidor de otro cada vez que se abre el panel, que es justo lo que
 *    este sitio promete no hacer. Auto-alojado va bajo la GPL y por eso
 *    `license_key` dice `gpl`: sin eso el editor avisa de que falta clave.
 *
 *  · **Las fotografías del archivo no las pone TinyMCE.** Su botón de imagen
 *    está fuera a propósito: pediría una dirección y metería un `<img>`
 *    cualquiera, y entonces esa fotografía no tendría visor, ni pie enlazado a
 *    su serie, ni ficha técnica. El botón «Fotografía» de aquí abre la rejilla
 *    del archivo y deja un `<figure data-foto="ID">`, que la página cambia por
 *    el componente de verdad.
 *
 *  · **Los vídeos no tienen botón: se pegan.** En el texto, la dirección de
 *    YouTube o el `<iframe>` de «Compartir → Insertar», que es lo que uno
 *    tiene en el portapapeles cuando llega aquí. Se convierten al pegarlos
 *    —abajo, en `paste_preprocess`— y otra vez al guardar, por si entraron
 *    escribiendo en vez de pegando; lo guardado es un hueco `data-video`, no
 *    el `<iframe>` que venía. Ver `lib/videos.ts`.
 *
 *  · **La barra es corta a propósito.** Rótulos, negrita, cursiva, subrayado,
 *    tachado, colocación, listas, cita, enlace, tabla, raya y quitar formato.
 *    Ni colores ni tamaños ni familias de letra: eso lo decide el sitio entero
 *    en /admin/ajustes, y un párrafo pintado a mano se pelea con el diseño.
 */

type Foto = { id: string; archivo: string; titulo: string };

export function EditorDeCuerpo({
  valor,
  alCambiar,
  alPedirFoto,
}: {
  valor: string;
  alCambiar: (html: string) => void;
  /** Abre la rejilla del archivo y devuelve la elegida, o null si se cierra. */
  alPedirFoto: () => Promise<Foto | null>;
}) {
  const [listo, setListo] = useState(false);

  return (
    <div className="grid gap-1">
      {!listo && (
        <p className="border border-filo px-3 py-2 font-mono text-[.7rem] tracking-[.04em] text-dato">
          Abriendo el editor…
        </p>
      )}
      <div className={listo ? "" : "hidden"}>
        <Editor
          // Fijo y a mano. Sin `id`, tinymce-react se inventa uno al azar
          // —`tiny-react_<números>`— en cada render, así que el que escribe el
          // servidor y el que calcula el navegador no coinciden y React se
          // queja de que el árbol no cuadra al hidratar. En esta página sólo
          // hay un editor: no hay con qué chocar.
          id="cuerpo-de-la-entrada"
          tinymceScriptSrc="/tinymce/tinymce.min.js"
          licenseKey="gpl"
          value={valor}
          onEditorChange={(html) => alCambiar(html)}
          onInit={() => setListo(true)}
          init={{
            base_url: "/tinymce",
            suffix: ".min",
            language: "es",
            language_url: "/tinymce/langs/es.js",
            skin: "oxide-dark",
            content_css: "dark",
            menubar: false,
            branding: false,
            promotion: false,
            statusbar: true,
            elementpath: false,
            resize: false,
            min_height: 520,
            plugins: [
              "advlist",
              "autolink",
              "autoresize",
              "code",
              "link",
              "lists",
              "table",
              "wordcount",
            ],
            autoresize_bottom_margin: 24,
            toolbar:
              "blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify |" +
              " bullist numlist blockquote | link fotografia | table hr | removeformat code",
            block_formats:
              "Párrafo=p; Rótulo 1=h1; Rótulo 2=h2; Rótulo 3=h3; Rótulo 4=h4; Rótulo 5=h5; Rótulo 6=h6",
            // Lo que se puede pegar y lo que no: se limpia al entrar, para que
            // un texto copiado de un correo no se traiga su tipografía.
            paste_as_text: false,
            paste_block_drop: true,
            /* Lo que se pega se mira antes de que TinyMCE lo limpie: un
               `<iframe>` no está en `valid_elements` y se caería aquí mismo,
               sin dejar rastro de que se pegó un vídeo. Convertido en su hueco
               sí pasa, y se ve al momento como un bloque. */
            paste_preprocess: (_editor, args) => {
              const con = conVideos(args.content);
              if (con !== args.content) {
                args.content = con.replace(
                  /<figure data-video=/g,
                  '<figure contenteditable="false" data-video=',
                );
              }
            },
            valid_elements:
              "p[style],br,strong,b,em,i,u,s,code,pre,blockquote[style],cite," +
              "h1[style],h2[style],h3[style],h4[style],h5[style],h6[style]," +
              "ul[style],ol[style],li,hr,a[href|target|rel|title]," +
              "figure[data-foto|data-video|data-pie|class|contenteditable],figcaption,img[src|alt]," +
              "table,thead,tbody,tr,th,td",
            // La caja de escribir con la letra y los colores del panel, para
            // que lo que se ve al escribir se parezca a lo que se publica.
            content_style: `
              body {
                background: #1a1a1a;
                color: #ede7de;
                font-family: Georgia, "Times New Roman", serif;
                font-size: 18px;
                line-height: 1.75;
                margin: 1.2rem 1.4rem;
                max-width: 64ch;
              }
              h1, h2, h3, h4, h5, h6 { font-weight: 700; line-height: 1.15; }
              blockquote {
                border-left: 2px solid #d9503a;
                margin: 0;
                padding-left: 1.2rem;
                font-style: italic;
              }
              blockquote cite { display: block; font-size: .8rem; font-style: normal;
                letter-spacing: .12em; text-transform: uppercase; color: #8a8178; }
              a { color: #ede7de; }
              hr { border: 0; border-top: 1px solid #4a423b; }
              figure[data-foto] {
                margin: 0;
                border: 1px dashed #4a423b;
                background: #221f1c;
              }
              figure[data-foto] img { display: block; width: 100%; height: auto; }
              figure[data-foto] figcaption {
                font-family: ui-monospace, monospace;
                font-size: .68rem;
                letter-spacing: .05em;
                color: #8a8178;
                padding: .4rem .6rem;
              }
              /* El vídeo se dibuja con letra y no con la carátula de YouTube:
                 pedirle la miniatura sería una petición a un servidor de otro
                 cada vez que se abre una entrada en el panel, que es justo lo
                 que aquí no se hace. Se ve en «Previsualizar», ya de verdad. */
              figure[data-video] {
                margin: 0;
                border: 1px dashed #4a423b;
                background: #221f1c;
                padding: 2rem 1rem;
                text-align: center;
                font-family: ui-monospace, monospace;
                font-size: .72rem;
                letter-spacing: .06em;
                color: #8a8178;
              }
              figure[data-video]::before {
                content: "▶  vídeo de YouTube · " attr(data-video);
              }
              table { border-collapse: collapse; }
              td, th { border: 1px solid #4a423b; padding: .35rem .6rem; }
            `,
            setup: (editor) => {
              editor.ui.registry.addButton("fotografia", {
                icon: "image",
                tooltip: "Poner una fotografía del archivo",
                onAction: async () => {
                  const elegida = await alPedirFoto();
                  if (!elegida) return;
                  // El `contenteditable="false"` la hace un bloque de una
                  // pieza: se selecciona y se borra entera, y no se puede
                  // escribir dentro por error.
                  editor.insertContent(
                    `<figure data-foto="${elegida.id}" contenteditable="false">` +
                      `<img src="${elegida.archivo}" alt="">` +
                      `<figcaption>${elegida.titulo}</figcaption>` +
                      `</figure><p></p>`,
                  );
                },
              });
            },
          }}
        />
      </div>
    </div>
  );
}
