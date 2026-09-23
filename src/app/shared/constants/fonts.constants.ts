/**
 * Catálogo de tipografías elegibles desde Aplicación → Apariencia.
 *
 * Es una lista CERRADA a propósito, y por dos razones:
 *
 * 1. **Seguridad.** El valor guardado acaba en un `style.setProperty()`. Si se
 *    aceptara texto libre de la base de datos, ahí se podría colar CSS que no
 *    es una fuente. Al resolver contra este catálogo, lo que no esté en la
 *    lista simplemente no se aplica.
 * 2. **Diseño.** La fuente de títulos se usa bajo una regla escrita en
 *    `global.scss`: va en rótulos y nunca en texto corrido, porque las de
 *    versalitas se leen mal en frases largas. Esa regla se pensó para fuentes
 *    con este carácter; una manuscrita o una display estrecha la romperían.
 *
 * Añadir una familia nueva son tres pasos: bajar el `woff2` a
 * `assets/fonts/<familia>/`, declarar su `@font-face` en
 * `assets/fonts/_catalog.scss` y añadirla aquí.
 */
export interface FontOption {
  /** Nombre de la familia. Es lo que se guarda en la base de datos. */
  family: string;
  /** Lo que se lee en el desplegable. */
  label: string;
  /** Una línea sobre su carácter, para poder elegir sin verlas todas. */
  hint: string;
  /** Respaldo si la familia no llegara a cargar. */
  fallback: 'serif' | 'sans-serif';
}

/**
 * Lo que rige cuando la organización no tiene nada guardado.
 *
 * ⚠️ Tienen que coincidir con `--font-title` y `--font-body` de
 * `assets/styles/variables.scss`, que es lo que el navegador aplica de verdad
 * mientras la columna esté vacía. Estas dos constantes existen solo para que
 * los desplegables de Apariencia muestren marcada la fuente que se está
 * viendo, en vez de aparecer en blanco.
 */
export const DEFAULT_TITLE_FONT = 'Alegreya SC';
export const DEFAULT_BODY_FONT = 'Poppins';

/** Para títulos y rótulos: `--font-title`. */
export const TITLE_FONTS: readonly FontOption[] = [
  {
    family: 'Alegreya SC',
    label: 'Alegreya SC',
    hint: 'La actual. Versalitas cálidas, con carácter.',
    fallback: 'serif'
  },
  {
    family: 'Cinzel',
    label: 'Cinzel',
    hint: 'Romana clásica, inspirada en inscripciones. Señorial.',
    fallback: 'serif'
  },
  {
    family: 'Cormorant Garamond',
    label: 'Cormorant Garamond',
    hint: 'Fina y elegante, de trazo delicado.',
    fallback: 'serif'
  },
  {
    family: 'Playfair Display',
    label: 'Playfair Display',
    hint: 'Mucho contraste, aire editorial de revista.',
    fallback: 'serif'
  },
  {
    family: 'Marcellus',
    label: 'Marcellus',
    hint: 'Serena y equilibrada, discreta en títulos largos.',
    fallback: 'serif'
  },
  {
    family: 'Lora',
    label: 'Lora',
    hint: 'Serif corriente y muy legible; la más sobria del grupo.',
    fallback: 'serif'
  }
];

/**
 * Para el texto: `--font-body`.
 *
 * Todas son de palo seco y de alta legibilidad a tamaño pequeño. Aquí NO entran
 * las de versalitas ni las display: esta fuente la llevan las facturas, las
 * tablas y los formularios, donde lo único que importa es leer sin esfuerzo.
 */
export const BODY_FONTS: readonly FontOption[] = [
  {
    family: 'Poppins',
    label: 'Poppins',
    hint: 'La actual. Geométrica, redonda, moderna.',
    fallback: 'sans-serif'
  },
  {
    family: 'Inter',
    label: 'Inter',
    hint: 'Pensada para pantalla. La más nítida en textos densos.',
    fallback: 'sans-serif'
  },
  {
    family: 'Lato',
    label: 'Lato',
    hint: 'Cálida y algo más humana que Inter.',
    fallback: 'sans-serif'
  },
  {
    family: 'Source Sans 3',
    label: 'Source Sans 3',
    hint: 'Neutra y compacta; cunde bien en tablas.',
    fallback: 'sans-serif'
  },
  {
    family: 'Nunito Sans',
    label: 'Nunito Sans',
    hint: 'De formas suaves, tono amable.',
    fallback: 'sans-serif'
  },
  {
    family: 'Work Sans',
    label: 'Work Sans',
    hint: 'Sobria, de aspecto profesional.',
    fallback: 'sans-serif'
  }
];

/**
 * Traduce una familia guardada al valor de la variable CSS.
 *
 * Devuelve `null` si no está en el catálogo —una fuente retirada, o un valor
 * manipulado—, y entonces quien llama no debe tocar nada: se queda el valor por
 * defecto de `variables.scss`.
 */
export function resolveFontStack(
  family: string | null | undefined,
  catalog: readonly FontOption[]
): string | null {
  if (!family) return null;
  const found = catalog.find((f) => f.family === family);
  return found ? `'${found.family}', ${found.fallback}` : null;
}
