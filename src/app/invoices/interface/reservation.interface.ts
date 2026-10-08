/** Respuesta de `POST invoices/reservations`. */
export interface CreatedReservation {
  invoiceId: number;
  code: string;
  total: number;
  nights: number;
  startDate: string;
  endDate: string;
  /** Hasta cuándo se retienen las fechas sin pago (ISO). */
  expiresAt: string;
}
