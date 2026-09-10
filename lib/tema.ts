/**
 * El tema del sitio. Se guarda en `localStorage` **cuando el visitante lo
 * elige**, igual que el aviso de entrada: es una preferencia suya, no un
 * rastreo, así que sigue sin hacer falta banner de consentimiento.
 *
 * Por defecto, oscuro. No es pereza: el sitio se llama cuarto oscuro y una
 * copia se lee mejor sobre fondo bajo. Quien prefiera papel, lo cambia y se
 * le recuerda.
 */

export const CLAVE_TEMA = "photojhon:tema";

export type Tema = "oscuro" | "claro";

/**
 * Se inyecta en el `head` y corre antes de pintar: sin esto, quien tenga
 * elegido el claro vería un fogonazo oscuro en cada carga.
 */
export const GUION_DEL_TEMA = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  CLAVE_TEMA,
)})==="claro"){document.documentElement.dataset.tema="claro"}}catch(e){}})()`;
