/**
 * URLs legibles del tipo `6-cabana-1`.
 *
 * El id va DELANTE y es lo único que se usa para resolver; el texto es
 * decorativo. Así el enlace se puede leer y aporta a SEO, pero la URL sigue
 * funcionando aunque el hospedaje se renombre, y —esto es lo importante— el id
 * es el mismo en español y en inglés, así que el par de hreflang sale directo
 * sin tener que traducir ni mantener slugs por idioma.
 */

/**
 * Marcas diacríticas que `normalize('NFD')` separa de su letra base (tildes,
 * diéresis, la virgulilla de la ñ). Se construye con `RegExp` y el rango
 * escapado en vez de escribir los caracteres literales en la expresión: son
 * invisibles en el editor y cualquier reencodeo del archivo se los come.
 */
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

/** "CABAÑA 1" → "cabana-1". Sin tildes, sin ñ, sin signos. */
export function toSlug(value: string): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** `6-cabana-1` → `6`. `null` si el segmento no empieza por un id válido. */
export function idFromSlug(slug: string | null | undefined): number | null {
  const match = /^(\d+)(?:-|$)/.exec((slug ?? '').trim());
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Construye el segmento de URL de un hospedaje. */
export function buildSlug(id: number, name: string): string {
  const text = toSlug(name);
  return text ? `${id}-${text}` : String(id);
}
