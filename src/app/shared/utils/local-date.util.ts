/**
 * Hoy como `YYYY-MM-DD` en la hora LOCAL del navegador.
 *
 * `new Date().toISOString()` da el día en UTC: en Colombia (UTC-5), a partir de
 * las 7 p. m. ya es "mañana", y una estadía que termina hoy pasaría a
 * "Finalizada" antes de tiempo.
 */
export function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
