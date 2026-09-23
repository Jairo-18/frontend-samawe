/**
 * Cómo se ve cada ranura de medios EN EL SITIO REAL.
 *
 * Sirve para que la gestión se parezca al resultado: la miniatura de la pestaña
 * Multimedia y el visor usan la misma proporción con la que la imagen acabará
 * viéndose. Antes todas las tarjetas eran iguales, así que el fondo del login
 * —que en pantalla es una columna vertical— se juzgaba en el mismo recuadro
 * apaisado que una portada.
 *
 * Los códigos salen de la tabla `MediaType`. Uno que no esté en ninguna de las
 * dos listas se trata como apaisado de una columna, que es el caso corriente.
 */

/**
 * Se ven VERTICALES: ocupan media pantalla de alto junto al formulario.
 */
export const PORTRAIT_MEDIA = new Set(['LOGIN_BG', 'REGISTER_BG']);

/**
 * Se ven A TODO LO ANCHO: el vídeo de portada y las cabeceras de cada página.
 * En la rejilla ocupan dos columnas.
 */
export const WIDE_MEDIA = new Set([
  'HOME_VIDEO',
  'ABOUT_US_IMAGE',
  'ACCOMMODATIONS_IMAGE',
  'GASTRONOMY_IMAGE',
  'HOW_TO_ARRIVE_IMAGE',
  'EXPERIENCE_IMAGE'
]);

/** Ranuras que guardan vídeo en vez de imagen. */
export const VIDEO_MEDIA = new Set(['HOME_VIDEO']);

/** Proporción CSS con la que mostrar el medio. */
export function aspectForMedia(code: string): string {
  if (PORTRAIT_MEDIA.has(code)) return '3 / 4';
  return '16 / 9';
}
