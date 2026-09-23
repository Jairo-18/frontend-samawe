/**
 * Colores del modo oscuro que rigen cuando la organización no ha elegido nada.
 *
 * ⚠️ Deben COINCIDIR con los respaldos del bloque `:root[data-theme='dark']`
 * de `assets/styles/variables.scss`, que es lo que el navegador aplica de
 * verdad mientras las columnas estén vacías. Estas constantes existen solo
 * para que los selectores de Apariencia muestren el color que se está viendo,
 * en vez de aparecer en negro.
 *
 * Mismo criterio que `DEFAULT_TITLE_FONT` / `DEFAULT_BODY_FONT` con las
 * tipografías.
 */
export const DEFAULT_DARK_COLORS = {
  title: '#e6e8eb',
  subtitle: '#9aa3ad',
  text: '#e6e8eb',
  /** Superficie elevada: tarjetas, diálogos, menús. */
  bgPrimary: '#1c2128',
  /** El papel de fondo. */
  bgSecondary: '#14181d'
} as const;

/** Token CSS de cada color oscuro, para aplicarlos en caliente. */
export const DARK_COLOR_TOKENS = {
  darkTitleColor: '--org-dark-title-color',
  darkSubtitleColor: '--org-dark-subtitle-color',
  darkTextColor: '--org-dark-text-color',
  darkBgPrimaryColor: '--org-dark-bg-primary-color',
  darkBgSecondaryColor: '--org-dark-bg-secondary-color'
} as const;
