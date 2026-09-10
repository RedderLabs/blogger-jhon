import { enYoutube, paraIncrustar } from "@/lib/videos";

/**
 * Un vídeo de YouTube dentro de una entrada.
 *
 * El único sitio donde se decide cómo se carga: qué dominio, qué permisos y
 * qué se le cuenta a Google. Lo guardado es sólo el identificador —ver
 * `lib/videos.ts`—, así que cambiar aquí una línea cambia todos los vídeos ya
 * escritos, en vez de tener que repasar entrada por entrada lo que se pegó en
 * su día.
 *
 * `loading="lazy"`: un vídeo al final de un texto largo no tiene por qué
 * cargarse antes de que nadie llegue a él, y sale caro pedirlo de otra casa.
 *
 * El 16:9 lo pone la caja de fuera y no el `<iframe>`: así el hueco está
 * reservado desde el primer pintado y la entrada no pega un salto cuando el
 * reproductor termina de llegar.
 */
export function VideoDeYoutube({ id }: { id: string }) {
  return (
    <figure className="m-0">
      <div className="relative aspect-video w-full bg-marco">
        <iframe
          src={paraIncrustar(id)}
          title="Vídeo de YouTube"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <figcaption className="mt-2 flex flex-wrap justify-between gap-4 font-mono text-[.68rem] tracking-[.05em] text-dato">
        <span>Vídeo</span>
        {/* Quien no quiera verlo aquí dentro —o no pueda— tiene la puerta de
            al lado, en vez de un rectángulo negro y ninguna salida. */}
        <a
          href={enYoutube(id)}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-rojo"
        >
          Verlo en YouTube ↗
        </a>
      </figcaption>
    </figure>
  );
}
