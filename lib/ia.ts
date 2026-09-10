/**
 * Los rastreadores que recogen material para entrenar o alimentar sistemas de
 * I.A. Se les cierra el sitio entero.
 *
 * Esto no es una barrera técnica: `robots.txt` es una petición, y quien no la
 * respete entrará igual. Es la petición dicha por escrito y en el sitio donde
 * se mira, que es exactamente lo que dice el aviso de la portada. Lo que sí
 * es una barrera está en otro lado: el cubo de Backblaze es privado y los
 * escaneos originales no los sirve ninguna ruta.
 *
 * La lista vive aquí y no dentro de `app/robots.ts` porque la lee también la
 * página de términos: lo que se promete por escrito y lo que se sirve en
 * robots.txt tienen que ser lo mismo, y la única manera de que no se separen
 * con el tiempo es que sean el mismo dato.
 *
 * Dos que conviene entender antes de tocarlas:
 *   · `Google-Extended` NO afecta a la búsqueda de Google. Sólo dice que las
 *     fotografías no entren en Gemini. El sitio se sigue indexando igual.
 *   · `Applebot-Extended` es lo mismo con Apple: `Applebot` a secas, el de la
 *     búsqueda, sigue pasando.
 */

export const FAMILIAS: { quien: string; agentes: string[]; nota?: string }[] = [
  { quien: "OpenAI", agentes: ["GPTBot", "ChatGPT-User", "OAI-SearchBot"] },
  {
    quien: "Anthropic",
    agentes: ["anthropic-ai", "ClaudeBot", "Claude-Web", "Claude-User", "Claude-SearchBot"],
  },
  {
    quien: "Google y Apple",
    agentes: ["Google-Extended", "Applebot-Extended"],
    nota: "Sólo el entrenamiento. La búsqueda de Google y la de Apple siguen pasando: el sitio se indexa igual.",
  },
  {
    quien: "Meta",
    agentes: ["Meta-ExternalAgent", "Meta-ExternalFetcher", "FacebookBot"],
  },
  {
    quien: "Common Crawl",
    agentes: ["CCBot"],
    nota: "De aquí sale buena parte de lo que entrena a los demás.",
  },
  {
    quien: "Los otros",
    agentes: [
      "PerplexityBot",
      "Perplexity-User",
      "Bytespider",
      "Amazonbot",
      "cohere-ai",
      "cohere-training-data-crawler",
      "AI2Bot",
      "Ai2Bot-Dolma",
      "DuckAssistBot",
      "MistralAI-User",
      "PanguBot",
      "Timpibot",
      "YouBot",
      "Webzio-Extended",
      "omgili",
      "omgilibot",
      "Diffbot",
      "ImagesiftBot",
      "img2dataset",
      "Kangaroo Bot",
      "Scrapy",
      "SemrushBot-OCOB",
    ],
  },
];

/** La lista plana, que es lo que necesita `robots.txt`. */
export const RASTREADORES_DE_IA: string[] = FAMILIAS.flatMap((f) => f.agentes);

/** Cuántos son, para poder decirlo en la página sin contarlos a mano. */
export const CUANTOS_RASTREADORES = RASTREADORES_DE_IA.length;
