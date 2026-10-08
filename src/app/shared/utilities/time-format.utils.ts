/**
 * Las observaciones de una reserva en línea guardan la hora de llegada en 24 h
 * ("Llegada estimada: 13:30"): es el dato y otras partes lo leen así. Esto solo
 * cambia cómo se MUESTRA, a 12 h ("1:30 p. m."); el texto guardado no se toca.
 */
export function showArrivalTimeIn12h(text: string | null | undefined): string {
  if (!text) return text ?? '';
  return text.replace(
    /(Llegada estimada:\s*)(\d{1,2}):(\d{2})/g,
    (whole, label: string, hh: string, mm: string) => {
      const h = Number(hh);
      if (h > 23) return whole;
      return `${label}${h % 12 || 12}:${mm} ${h >= 12 ? 'p. m.' : 'a. m.'}`;
    }
  );
}
